import { readFile } from "node:fs/promises";
import https from "node:https";
import type { LiveGameSnapshot, LivePlayerScore, LivePlayerSnapshot } from "../domain/in-game-coach.types";
import type { DraftBoard, DraftRole, LeagueItemReference } from "../domain/lol-draft.types";
import { getDataDragonItemGoldValues } from "./data-dragon-assets.service";
import { CHAMPIONS, EMPTY_DRAFT_BOARD } from "./lol-draft-data";

export type { LiveGameSnapshot } from "../domain/in-game-coach.types";

const LOCKFILE_PATH = "/Applications/League of Legends.app/Contents/LoL/lockfile";

type LcuConnection = {
  port: number;
  password: string;
};

type LcuPlayer = {
  assignedPosition?: string;
  cellId?: number;
  championId?: number;
  championPickIntent?: number;
};

type LcuAction = {
  actorCellId?: number;
  championId?: number;
  completed?: boolean;
  isInProgress?: boolean;
  type?: string;
};

type LcuSession = {
  actions?: LcuAction[][];
  localPlayerCellId?: number;
  myTeam?: LcuPlayer[];
  theirTeam?: LcuPlayer[];
  timer?: { phase?: string };
};

export type LcuChampSelectSnapshot = {
  status: "client-unavailable" | "not-in-champ-select" | "in-champ-select" | "recent-champ-select" | "in-game";
  phase: string | null;
  alliedBoard: DraftBoard;
  enemyBoard: DraftBoard;
  alliedPicks: LcuPickBoard;
  enemyPicks: LcuPickBoard;
  alliedBans: LcuDraftBan[];
  enemyBans: LcuDraftBan[];
  pendingBans: LcuDraftBan[];
  enemyDetectedPicks: LcuDraftPick[];
  yourRole: DraftRole | null;
  liveGame: LiveGameSnapshot | null;
};

export type LcuDraftPick = {
  championId: number;
  championName: string;
  localChampionId: string | null;
};

export type LcuDraftBan = LcuDraftPick;

export type LcuPickBoard = Record<DraftRole, LcuDraftPick | null>;

type LiveClientPlayer = {
  championName?: string;
  isDead?: boolean;
  items?: Array<{ displayName?: string; itemID?: number; price?: number }>;
  level?: number;
  position?: string;
  respawnTimer?: number;
  riotId?: string;
  riotIdGameName?: string;
  scores?: Partial<LivePlayerScore>;
  summonerName?: string;
  team?: string;
};

type LiveClientGame = LiveGameSnapshot & {
  activeTeam: string | null;
};

const championNameCache = new Map<number, string>();
const RECENT_DRAFT_TTL_MS = 2 * 60 * 1000;
const IN_GAME_DRAFT_TTL_MS = 4 * 60 * 60 * 1000;
let recentChampSelectSnapshot: { capturedAt: number; snapshot: LcuChampSelectSnapshot } | null = null;
const localChampionIdByName = new Map(
  CHAMPIONS.map((champion) => [normalizeChampionName(champion.name), champion.id]),
);

function emptyPickBoard(): LcuPickBoard {
  return {
    top: null,
    jungle: null,
    mid: null,
    adc: null,
    support: null,
  };
}

function normalizeChampionName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function getLocalChampionId(championName: string | undefined) {
  return championName ? localChampionIdByName.get(normalizeChampionName(championName)) ?? null : null;
}

function getLocalChampionIdForRole(championName: string | undefined, role: DraftRole | null) {
  const championId = getLocalChampionId(championName);
  const champion = championId ? CHAMPIONS.find((candidate) => candidate.id === championId) : null;
  return champion && role && champion.roles.includes(role) ? championId : null;
}

function emptySnapshot(status: LcuChampSelectSnapshot["status"]): LcuChampSelectSnapshot {
  return {
    status,
    phase: null,
    alliedBoard: { ...EMPTY_DRAFT_BOARD },
    enemyBoard: { ...EMPTY_DRAFT_BOARD },
    alliedPicks: emptyPickBoard(),
    enemyPicks: emptyPickBoard(),
    alliedBans: [],
    enemyBans: [],
    pendingBans: [],
    enemyDetectedPicks: [],
    yourRole: null,
    liveGame: null,
  };
}

function getRecentChampSelectSnapshot(status: "recent-champ-select" | "in-game") {
  const maxAge = status === "in-game" ? IN_GAME_DRAFT_TTL_MS : RECENT_DRAFT_TTL_MS;
  if (!recentChampSelectSnapshot || recentChampSelectSnapshot.capturedAt + maxAge < Date.now()) {
    recentChampSelectSnapshot = null;
    return null;
  }

  return {
    ...recentChampSelectSnapshot.snapshot,
    status,
    phase: status === "in-game" ? "EN PARTIDA" : "FINALIZADO",
    liveGame: null,
  };
}

function asDraftRole(position: string | undefined): DraftRole | null {
  const positions: Record<string, DraftRole> = {
    TOP: "top",
    JUNGLE: "jungle",
    MIDDLE: "mid",
    MID: "mid",
    BOTTOM: "adc",
    BOT: "adc",
    UTILITY: "support",
    SUPPORT: "support",
  };

  return position ? positions[position.toUpperCase()] ?? null : null;
}

export function inferActivePlayerRole(
  activePlayer: LivePlayerSnapshot,
  alliedPlayers: LivePlayerSnapshot[],
) {
  if (activePlayer.role) return activePlayer.role;

  const occupiedRoles = new Set(alliedPlayers.flatMap((player) => player.role ? [player.role] : []));
  const openRoles = (["top", "jungle", "mid", "adc", "support"] as DraftRole[])
    .filter((role) => !occupiedRoles.has(role));
  if (openRoles.length !== 1) return null;

  const championId = getLocalChampionId(activePlayer.championName);
  const champion = championId ? CHAMPIONS.find((candidate) => candidate.id === championId) : null;
  return champion?.roles.includes(openRoles[0]) ? openRoles[0] : null;
}

function getOpenRoleForLocalPlayer(
  players: LcuPlayer[] | undefined,
  localPlayerCellId: number | undefined,
) {
  if (localPlayerCellId === undefined) return null;

  const localPlayer = players?.find((player) => player.cellId === localPlayerCellId);
  if (!localPlayer || asDraftRole(localPlayer.assignedPosition)) return null;

  const occupiedRoles = new Set(
    (players ?? []).map((player) => asDraftRole(player.assignedPosition)).filter(Boolean),
  );
  const openRoles = (["top", "jungle", "mid", "adc", "support"] as DraftRole[]).filter(
    (role) => !occupiedRoles.has(role),
  );

  return openRoles.length === 1 ? openRoles[0] : null;
}

function getPlayerRole(
  player: LcuPlayer,
  localPlayerCellId: number | undefined,
  localPlayerFallbackRole: DraftRole | null,
) {
  return asDraftRole(player.assignedPosition) ?? (
    player.cellId === localPlayerCellId ? localPlayerFallbackRole : null
  );
}

function toDraftBoard(
  players: LcuPlayer[] | undefined,
  championNames: Map<number, string>,
  localPlayerCellId?: number,
): DraftBoard {
  const board = { ...EMPTY_DRAFT_BOARD };
  const localPlayerFallbackRole = getOpenRoleForLocalPlayer(players, localPlayerCellId);

  for (const player of players ?? []) {
    const role = getPlayerRole(player, localPlayerCellId, localPlayerFallbackRole);
    const championId = player.championId || player.championPickIntent || 0;
    const localChampionId = getLocalChampionIdForRole(championNames.get(championId), role);

    if (role && localChampionId) board[role] = localChampionId;
  }

  return board;
}

function getPickedChampionId(player: LcuPlayer) {
  return player.championId || player.championPickIntent || 0;
}

function mergePickActions(players: LcuPlayer[] | undefined, actions: LcuAction[][] | undefined) {
  const championByCellId = new Map<number, number>();

  for (const actionGroup of actions ?? []) {
    for (const action of actionGroup) {
      if (
        action.type?.toLowerCase() !== "pick" ||
        action.actorCellId === undefined ||
        !action.championId
      ) {
        continue;
      }

      championByCellId.set(action.actorCellId, action.championId);
    }
  }

  return (players ?? []).map((player) => {
    if (getPickedChampionId(player) || player.cellId === undefined) return player;

    const championId = championByCellId.get(player.cellId);
    return championId ? { ...player, championId } : player;
  });
}

function getBans(
  actions: LcuAction[][] | undefined,
  alliedPlayers: LcuPlayer[] | undefined,
  championNames: Map<number, string>,
) {
  const alliedCellIds = new Set(
    (alliedPlayers ?? []).flatMap((player) => player.cellId === undefined ? [] : [player.cellId]),
  );
  const alliedBans: LcuDraftBan[] = [];
  const enemyBans: LcuDraftBan[] = [];
  const pendingBans: LcuDraftBan[] = [];
  const seenConfirmedBans = new Set<number>();

  for (const actionGroup of actions ?? []) {
    for (const action of actionGroup) {
      if (action.type?.toLowerCase() !== "ban" || !action.championId) continue;

      const championName = championNames.get(action.championId) ?? `Campeon ${action.championId}`;
      const ban = {
        championId: action.championId,
        championName,
        localChampionId: getLocalChampionId(championName),
      };

      if (!action.completed) {
        pendingBans.push(ban);
        continue;
      }

      // A locked ban can appear in more than one action snapshot while the phase advances.
      if (seenConfirmedBans.has(action.championId)) continue;
      seenConfirmedBans.add(action.championId);
      (alliedCellIds.has(action.actorCellId ?? -1) ? alliedBans : enemyBans).push(ban);
    }
  }

  return { alliedBans, enemyBans, pendingBans };
}

async function getChampionNames(connection: LcuConnection, championIds: number[]) {
  const distinctChampionIds = [...new Set(championIds.filter(Boolean))];
  const uncachedChampionIds = distinctChampionIds.filter((championId) => !championNameCache.has(championId));

  await Promise.all(
    uncachedChampionIds.map(async (championId) => {
      try {
        const response = await requestJson(
          connection,
          `/lol-game-data/assets/v1/champions/${championId}.json`,
        );
        const championName = (response.body as { name?: unknown }).name;
        if (response.statusCode >= 200 && response.statusCode < 300 && typeof championName === "string") {
          championNameCache.set(championId, championName);
        }
      } catch {
        // Keep a usable fallback when the local asset cannot be read.
      }
    }),
  );

  return new Map(
    distinctChampionIds.map((championId) => [
      championId,
      championNameCache.get(championId) ?? `Campeon ${championId}`,
    ]),
  );
}

function toPickBoard(
  players: LcuPlayer[] | undefined,
  championNames: Map<number, string>,
  localPlayerCellId?: number,
) {
  const board = emptyPickBoard();
  const localPlayerFallbackRole = getOpenRoleForLocalPlayer(players, localPlayerCellId);

  for (const player of players ?? []) {
    const role = getPlayerRole(player, localPlayerCellId, localPlayerFallbackRole);
    const championId = getPickedChampionId(player);
    if (role && championId) {
      board[role] = {
        championId,
        championName: championNames.get(championId) ?? `Campeon ${championId}`,
        localChampionId: getLocalChampionId(championNames.get(championId)),
      };
    }
  }

  return board;
}

function toDetectedPicks(
  players: LcuPlayer[] | undefined,
  championNames: Map<number, string>,
) {
  return (players ?? []).flatMap((player) => {
    const championId = getPickedChampionId(player);
    if (!championId) return [];

    return [{
      championId,
      championName: championNames.get(championId) ?? `Campeon ${championId}`,
      localChampionId: getLocalChampionId(championNames.get(championId)),
    }];
  });
}

function getYourRole(session: LcuSession): DraftRole | null {
  const localPlayer = session.myTeam?.find(
    (player) => player.cellId === session.localPlayerCellId,
  );

  return asDraftRole(localPlayer?.assignedPosition) ?? getOpenRoleForLocalPlayer(
    session.myTeam,
    session.localPlayerCellId,
  );
}

function requestJson(connection: LcuConnection, path: string) {
  return new Promise<{ statusCode: number; body: unknown }>((resolve, reject) => {
    const request = https.request(
      {
        hostname: "127.0.0.1",
        port: connection.port,
        path,
        method: "GET",
        rejectUnauthorized: false,
        headers: {
          Authorization: `Basic ${Buffer.from(`riot:${connection.password}`).toString("base64")}`,
        },
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          try {
            resolve({
              statusCode: response.statusCode ?? 500,
              body: responseBody ? JSON.parse(responseBody) : null,
            });
          } catch {
            reject(new Error("League Client devolvio una respuesta no valida."));
          }
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function requestLiveClientJson(path: string) {
  return new Promise<{ statusCode: number; body: unknown }>((resolve, reject) => {
    const request = https.request(
      { hostname: "127.0.0.1", port: 2999, path, method: "GET", rejectUnauthorized: false },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => { responseBody += chunk; });
        response.on("end", () => {
          try {
            resolve({ statusCode: response.statusCode ?? 500, body: responseBody ? JSON.parse(responseBody) : null });
          } catch {
            reject(new Error("Live Client devolvió una respuesta no válida."));
          }
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

export async function getLiveGameSnapshot(): Promise<LiveGameSnapshot> {
  return getLiveClientGame();
}

async function getLiveClientGame(): Promise<LiveClientGame> {
  const emptyGame: LiveClientGame = {
    status: "not-in-game",
    championName: null,
    currentGold: null,
    gameTime: null,
    items: [],
    itemReferences: [],
    activePlayer: null,
    laneOpponent: null,
    allies: [],
    enemies: [],
    activeTeam: null,
  };
  try {
    const response = await requestLiveClientJson("/liveclientdata/allgamedata");
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return emptyGame;
    }

    const game = response.body as {
      activePlayer?: { currentGold?: number; riotId?: string; riotIdGameName?: string; summonerName?: string };
      allPlayers?: LiveClientPlayer[];
      gameData?: { gameTime?: number };
    };
    const rawPlayers = game.allPlayers ?? [];
    const activeIdentifiers = new Set([
      game.activePlayer?.riotId,
      game.activePlayer?.riotIdGameName,
      game.activePlayer?.summonerName,
    ].filter((identifier): identifier is string => Boolean(identifier)));
    const rawActivePlayer = rawPlayers.find((player) => [player.riotId, player.riotIdGameName, player.summonerName]
      .some((identifier) => identifier && activeIdentifiers.has(identifier)));
    const itemIds = rawPlayers.flatMap((player) => player.items?.flatMap((item) => item.itemID ? [item.itemID] : []) ?? []);
    const dataDragonGold = await getDataDragonItemGoldValues(itemIds).catch(() => new Map<number, number>());
    let players: LivePlayerSnapshot[] = rawPlayers.flatMap((player) => {
      if (!player.championName) return [];
      const itemReferences = (player.items ?? []).flatMap((item) => {
        if (!item.displayName) return [];
        const totalGold = item.itemID ? dataDragonGold.get(item.itemID) ?? item.price : item.price;
        return [{ id: item.itemID, name: item.displayName, totalGold } satisfies LeagueItemReference];
      });
      const resolvedWithDataDragon = itemReferences.length === 0 || itemReferences.every((item) => item.id && dataDragonGold.has(item.id));
      const resolvedWithFallback = itemReferences.length === 0 || itemReferences.every((item) => typeof item.totalGold === "number");
      const scores = player.scores ?? {};
      return [{
        championName: player.championName,
        role: asDraftRole(player.position),
        roleSource: asDraftRole(player.position) ? "live-client" : "unknown",
        team: player.team ?? null,
        level: player.level ?? 0,
        scores: {
          kills: scores.kills ?? 0,
          deaths: scores.deaths ?? 0,
          assists: scores.assists ?? 0,
          creepScore: scores.creepScore ?? 0,
          wardScore: scores.wardScore ?? 0,
        },
        items: itemReferences,
        visibleInventoryGold: resolvedWithFallback
          ? itemReferences.reduce((total, item) => total + (item.totalGold ?? 0), 0)
          : null,
        inventoryGoldSource: resolvedWithDataDragon
          ? "data-dragon"
          : resolvedWithFallback ? "live-client" : "unavailable",
        isDead: player.isDead ?? false,
        respawnTimer: player.respawnTimer ?? 0,
      } satisfies LivePlayerSnapshot];
    });
    let activePlayer = players.find((player) => player.championName === rawActivePlayer?.championName && player.team === rawActivePlayer?.team) ?? null;
    const activeTeam = activePlayer?.team ?? null;
    if (activePlayer && activeTeam && !activePlayer.role) {
      const inferredRole = inferActivePlayerRole(
        activePlayer,
        players.filter((player) => player.team === activeTeam),
      );
      if (inferredRole) {
        const originalActivePlayer = activePlayer;
        activePlayer = { ...activePlayer, role: inferredRole, roleSource: "inferred" };
        players = players.map((player) => player === originalActivePlayer ? activePlayer! : player);
      }
    }
    const allies = activeTeam ? players.filter((player) => player.team === activeTeam) : [];
    const enemies = activeTeam ? players.filter((player) => player.team && player.team !== activeTeam) : [];
    const laneOpponent = activePlayer?.role
      ? enemies.find((player) => player.role === activePlayer.role) ?? null
      : null;

    return {
      status: "in-game",
      championName: activePlayer?.championName ?? null,
      currentGold: game.activePlayer?.currentGold ?? null,
      gameTime: game.gameData?.gameTime ?? null,
      items: activePlayer?.items.map((item) => item.name) ?? [],
      itemReferences: activePlayer?.items ?? [],
      activePlayer,
      laneOpponent,
      allies,
      enemies,
      activeTeam,
    };
  } catch {
    return emptyGame;
  }
}

function toLiveDraftBoard(players: LivePlayerSnapshot[]) {
  const board = { ...EMPTY_DRAFT_BOARD };
  for (const player of players) {
    const role = player.role;
    const championId = getLocalChampionIdForRole(player.championName, role);
    if (role && championId) board[role] = championId;
  }
  return board;
}

function toLivePickBoard(players: LivePlayerSnapshot[]) {
  const board = emptyPickBoard();
  for (const [index, player] of players.entries()) {
    const role = player.role;
    if (role && player.championName) board[role] = {
      championId: index + 1,
      championName: player.championName,
      localChampionId: getLocalChampionId(player.championName),
    };
  }
  return board;
}

function getLiveGameDraftSnapshot(game: LiveClientGame): LcuChampSelectSnapshot | null {
  if (game.status !== "in-game" || !game.activeTeam) return null;

  const alliedPlayers = game.allies;
  const enemyPlayers = game.enemies;
  const yourRole = game.activePlayer?.role ?? null;

  return {
    status: "in-game",
    phase: "EN PARTIDA",
    alliedBoard: toLiveDraftBoard(alliedPlayers),
    enemyBoard: toLiveDraftBoard(enemyPlayers),
    alliedPicks: toLivePickBoard(alliedPlayers),
    enemyPicks: toLivePickBoard(enemyPlayers),
    alliedBans: [],
    enemyBans: [],
    pendingBans: [],
    enemyDetectedPicks: [],
    yourRole,
    liveGame: game,
  };
}

async function getConnection(): Promise<LcuConnection | null> {
  try {
    const [processName, pid, port, password, protocol] = (await readFile(LOCKFILE_PATH, "utf8"))
      .trim()
      .split(":");

    if (processName && pid && password && protocol === "https" && Number(port)) {
      return { port: Number(port), password };
    }
  } catch {
    // The client may be closed or installed in another location.
  }

  return null;
}

export async function getChampSelectSnapshot(): Promise<LcuChampSelectSnapshot> {
  const connection = await getConnection();
  if (!connection) {
    const liveSnapshot = getLiveGameDraftSnapshot(await getLiveClientGame());
    return liveSnapshot ?? emptySnapshot("client-unavailable");
  }

  try {
    const response = await requestJson(connection, "/lol-champ-select/v1/session");
    if (response.statusCode === 404) {
      const liveGame = await getLiveClientGame();
      const liveSnapshot = getLiveGameDraftSnapshot(liveGame);
      return liveSnapshot ?? getRecentChampSelectSnapshot("recent-champ-select") ?? emptySnapshot("not-in-champ-select");
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return emptySnapshot("client-unavailable");
    }

    const session = response.body as LcuSession;
    // Some queues only expose the locked pick in actions, not directly in theirTeam.
    const alliedPlayers = mergePickActions(session.myTeam, session.actions);
    const enemyPlayers = mergePickActions(session.theirTeam, session.actions);
    const banChampionIds = (session.actions ?? []).flatMap((actionGroup) => actionGroup.flatMap((action) => (
      action.type?.toLowerCase() === "ban" && action.championId ? [action.championId] : []
    )));
    const championNames = await getChampionNames(connection, [
      ...alliedPlayers.map(getPickedChampionId),
      ...enemyPlayers.map(getPickedChampionId),
      ...banChampionIds,
    ]);
    const bans = getBans(session.actions, session.myTeam, championNames);
    const snapshot: LcuChampSelectSnapshot = {
      status: "in-champ-select",
      phase: session.timer?.phase ?? null,
      alliedBoard: toDraftBoard(alliedPlayers, championNames, session.localPlayerCellId),
      // Champion Select does not reveal enemy roles to the player. Keep the enemy draft role-agnostic.
      enemyBoard: { ...EMPTY_DRAFT_BOARD },
      alliedPicks: toPickBoard(alliedPlayers, championNames, session.localPlayerCellId),
      enemyPicks: emptyPickBoard(),
      ...bans,
      enemyDetectedPicks: toDetectedPicks(enemyPlayers, championNames),
      yourRole: getYourRole(session),
      liveGame: null,
    };
    recentChampSelectSnapshot = { snapshot, capturedAt: Date.now() };
    return snapshot;
  } catch {
    return emptySnapshot("client-unavailable");
  }
}
