"use client";

import { Ban, Check, ChevronDown, Radio, Search, ShieldCheck, Sparkles, Swords, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InGameCoachAnalysis, LiveGameSnapshot } from "../domain/in-game-coach.types";
import { DRAFT_ROLES, type DraftBoard, type DraftRole, type LeagueItemPurchaseDetail, type LeagueRuneReference, type RecommendationScope, type RuneSelection } from "../domain/lol-draft.types";
import type { GeneratedChampionGuide } from "../domain/lol-draft.types";
import { EMPTY_DRAFT_BOARD, PLAYER_CHAMPION_POOL, ROLE_LABELS } from "../services/lol-draft-data";
import type { LcuChampSelectSnapshot, LcuDraftBan, LcuDraftPick, LcuPickBoard } from "../services/lol-client.service";
import { analyzeInGameState } from "../services/in-game-coach.service";
import { getChampionById, getChampionFit, getChampionsForRole, recommendChampions } from "../services/lol-draft.service";
import { getLaneMetaChampion } from "../services/opgg-lane-meta.service";
import { getSummonerSpellRecommendation } from "../services/summoner-spell.service";
import { getChampionLoadouts, type SelectedLoadout } from "../services/champion-loadout.service";
import { getLivePurchasePlan, type LivePurchasePlan } from "../services/live-purchase-plan.service";
import { lolAssets } from "../services/lol-assets.service";
import { getTopLanePlans } from "../services/top-lane-plan.service";
import { ChampionAbilities, ChampionIcon, ItemIcon, RuneIcon, SpellIcon } from "./LolAssetImage";

const roleSymbols: Record<DraftRole, string> = { top: "T", jungle: "J", mid: "M", adc: "A", support: "S" };
const EMPTY_LCU_PICK_BOARD: LcuPickBoard = { top: null, jungle: null, mid: null, adc: null, support: null };
const EMPTY_LIVE_GAME: LiveGameSnapshot = {
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
};

const clientStatusCopy: Record<LcuChampSelectSnapshot["status"], string> = {
  "client-unavailable": "Cliente de League no detectado",
  "not-in-champ-select": "Cliente detectado · abre Champion Select",
  "in-champ-select": "Draft sincronizado con League",
  "recent-champ-select": "Última composición del draft",
  "in-game": "Recomendación activa en partida",
};

function useItemPurchaseDetails(loadout: SelectedLoadout | null) {
  const references = [
    ...(loadout?.buildItems?.length ? loadout.buildItems : loadout?.build.map((name) => ({ name })) ?? []),
    ...(loadout?.boots ?? []),
    { id: 3047, name: "Botas blindadas" },
    { id: 3111, name: "Botas de mercurio" },
  ];
  const requestUrl = loadout ? lolAssets.itemDetails(references) : null;
  const [result, setResult] = useState<{ requestUrl: string | null; details: LeagueItemPurchaseDetail[] }>({ requestUrl: null, details: [] });

  useEffect(() => {
    let cancelled = false;
    if (!requestUrl) return;

    void fetch(requestUrl, { cache: "force-cache" })
      .then((response) => response.ok ? response.json() as Promise<{ items: LeagueItemPurchaseDetail[] }> : { items: [] })
      .then((payload) => {
        if (!cancelled) setResult({ requestUrl, details: payload.items });
      })
      .catch(() => {
        if (!cancelled) setResult({ requestUrl, details: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [requestUrl]);

  return result.requestUrl === requestUrl ? result.details : [];
}

const recommendationScopeCopy: Record<RecommendationScope, string> = {
  team: "Composición",
  "partial-draft": "Draft parcial",
  draft: "Draft completo",
} as const;

type DraftColumnProps = {
  title: string;
  tone: "ally" | "enemy";
  board: DraftBoard;
  syncedPicks: LcuPickBoard;
  bans?: LcuDraftBan[];
  unavailableChampionIds: Set<string>;
  onChange: (role: DraftRole, championId: string | null) => void;
};

type ChampionPickerProps = {
  role: DraftRole;
  title: string;
  selectedId: string | null;
  syncedPick: LcuDraftPick | null;
  unavailableChampionIds: Set<string>;
  onChange: (championId: string | null) => void;
};

function ChampionPicker({ role, title, selectedId, syncedPick, unavailableChampionIds, onChange }: ChampionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = getChampionById(selectedId);
  const candidates = getChampionsForRole(role)
    .filter((champion) => champion.id === selectedId || !unavailableChampionIds.has(champion.id))
    .filter((champion) => champion.name.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es")));
  const label = selected?.name ?? (syncedPick ? syncedPick.championName : `${ROLE_LABELS[role]} · sin pick`);

  const choose = (championId: string | null) => {
    onChange(championId);
    setSearch("");
    setOpen(false);
  };

  return <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setSearch(""); }}>
    <Button type="button" variant="ghost" className="h-9 min-w-0 flex-1 justify-between px-0 text-left font-medium text-slate-800 hover:bg-transparent hover:text-slate-950" onClick={() => setOpen(true)} aria-label={`Elegir campeón para ${title} ${ROLE_LABELS[role]}`}>
      <span className="truncate">{label}</span><ChevronDown className="size-4 shrink-0 text-slate-500" />
    </Button>
    <DialogContent className="max-w-[calc(100%-1.5rem)] gap-3 rounded-2xl p-5 sm:max-w-lg" showCloseButton={false}>
      <DialogHeader className="pr-8">
        <DialogTitle>Elegir campeón de {ROLE_LABELS[role]}</DialogTitle>
        <DialogDescription>{title}. Busca por nombre o selecciona una opción del meta de la línea.</DialogDescription>
      </DialogHeader>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar campeón..." className="h-10 pl-9" /></div>
      <div className="max-h-[min(55vh,31rem)] overflow-y-auto pr-1" role="listbox" aria-label={`Campeones de ${ROLE_LABELS[role]}`}>
        <button type="button" role="option" aria-selected={!selectedId} onClick={() => choose(null)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-400">—</span>Sin pick</button>
        {candidates.map((champion) => {
          const meta = getLaneMetaChampion(role, champion.name);
          const active = champion.id === selectedId;
          return <button key={champion.id} type="button" role="option" aria-selected={active} onClick={() => choose(champion.id)} className={cn("mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition", active ? "bg-cyan-50 text-cyan-950 ring-1 ring-cyan-200" : "text-slate-700 hover:bg-slate-100")}>
            <ChampionIcon champion={champion} className="size-9" size={36} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{champion.name}</span>{meta ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">T{meta.tier} · {Math.round(meta.winRate * 100)}%</span> : null}{active ? <span className="text-xs font-bold text-cyan-700">Actual</span> : null}
          </button>;
        })}
        {candidates.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">No hay campeones disponibles con esa búsqueda.</p> : null}
      </div>
    </DialogContent>
  </Dialog>;
}

function DraftColumn({
  title,
  tone,
  board,
  syncedPicks,
  bans = [],
  unavailableChampionIds,
  onChange,
}: DraftColumnProps) {
  const ally = tone === "ally";
  return (
    <section className={cn("rounded-[1.75rem] border p-5", ally ? "border-cyan-200 bg-cyan-50/70" : "border-rose-200 bg-rose-50/70")}>
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", ally ? "bg-cyan-500" : "bg-rose-500")} />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-2">
        {DRAFT_ROLES.map((role) => {
          const selected = getChampionById(board[role]);
          const syncedPick = syncedPicks[role];
          const laneMeta = getLaneMetaChampion(role, syncedPick?.championName ?? selected?.name);
          const championReference = selected ?? (syncedPick
            ? { key: syncedPick.championId, name: syncedPick.championName }
            : null);
          return (
            <label key={role} className="flex items-center gap-3 rounded-2xl bg-white/85 p-2.5 shadow-sm ring-1 ring-black/5">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold", ally ? "bg-cyan-100 text-cyan-800" : "bg-rose-100 text-rose-800")}>{roleSymbols[role]}</span>
              {championReference ? <ChampionIcon champion={championReference} className="size-8" size={32} /> : null}
              <ChampionPicker role={role} title={title} selectedId={board[role]} syncedPick={syncedPick} unavailableChampionIds={unavailableChampionIds} onChange={(championId) => onChange(role, championId)} />
              {selected ? <span className="hidden max-w-40 truncate text-[11px] text-slate-400 xl:block">{selected.style.split(".")[0]}</span> : null}
              {!selected && syncedPick ? <span className="hidden text-[11px] font-medium text-cyan-700 sm:block">League</span> : null}
              {laneMeta ? <span className="hidden text-[11px] font-medium text-slate-400 xl:block">T{laneMeta.tier} · {Math.round(laneMeta.winRate * 100)}%</span> : null}
            </label>
          );
        })}
      </div>
      {bans.length > 0 ? <div className={cn("mt-3 rounded-2xl border p-3", ally ? "border-cyan-200/80 bg-white/70" : "border-rose-200/80 bg-white/70")}><p className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]", ally ? "text-cyan-700" : "text-rose-700")}><Ban className="size-3.5" /> Bans confirmados</p><div className="mt-2 flex flex-wrap gap-2">{bans.map((ban) => <span key={ban.championId} className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold", ally ? "bg-cyan-100 text-cyan-900" : "bg-rose-100 text-rose-900")}><ChampionIcon champion={{ key: ban.championId, name: ban.championName }} className="size-4" size={16} />{ban.championName}</span>)}</div></div> : null}
    </section>
  );
}

function EnemyDraftColumn({ picks, bans }: { picks: LcuDraftPick[]; bans: LcuDraftBan[] }) {
  return <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/70 p-5">
    <div className="mb-4 flex items-center gap-2"><span className="size-2.5 rounded-full bg-rose-500" /><h2 className="font-semibold text-slate-900">Rivales</h2></div>
    <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">Picks detectados</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Los roles rivales permanecen ocultos durante Champion Select. Estos picks ya cuentan para las recomendaciones globales.</p>
      {picks.length > 0 ? <ol className="mt-3 space-y-2">{picks.map((pick, index) => <li key={pick.championId} className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-100 text-xs font-bold text-rose-800">{index + 1}</span><ChampionIcon champion={{ key: pick.championId, name: pick.championName }} className="size-8" size={32} /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{pick.championName}</span><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">Rol oculto</span></li>)}</ol> : <p className="py-7 text-center text-sm text-slate-500">Aún no hay picks rivales bloqueados.</p>}
    </div>
    {bans.length > 0 ? <div className="mt-3 rounded-2xl border border-rose-200/80 bg-white/70 p-3"><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700"><Ban className="size-3.5" /> Bans confirmados</p><div className="mt-2 flex flex-wrap gap-2">{bans.map((ban) => <span key={ban.championId} className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-900"><ChampionIcon champion={{ key: ban.championId, name: ban.championName }} className="size-4" size={16} />{ban.championName}</span>)}</div></div> : null}
  </section>;
}

export function LolDraftScreen() {
  const [role, setRole] = useState<DraftRole>("mid");
  const [alliedBoard, setAlliedBoard] = useState<DraftBoard>(EMPTY_DRAFT_BOARD);
  const [enemyBoard, setEnemyBoard] = useState<DraftBoard>(EMPTY_DRAFT_BOARD);
  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<LcuChampSelectSnapshot["status"]>("client-unavailable");
  const [syncedAlliedPicks, setSyncedAlliedPicks] = useState<LcuPickBoard>(EMPTY_LCU_PICK_BOARD);
  const [syncedEnemyPicks, setSyncedEnemyPicks] = useState<LcuPickBoard>(EMPTY_LCU_PICK_BOARD);
  const [alliedBans, setAlliedBans] = useState<LcuDraftBan[]>([]);
  const [enemyBans, setEnemyBans] = useState<LcuDraftBan[]>([]);
  const [pendingBans, setPendingBans] = useState<LcuDraftBan[]>([]);
  const [enemyDetectedPicks, setEnemyDetectedPicks] = useState<LcuDraftPick[]>([]);
  const [suspectedTopId, setSuspectedTopId] = useState<string | null>(null);
  const [liveGame, setLiveGame] = useState<LiveGameSnapshot>(EMPTY_LIVE_GAME);
  const [inGameAnalysis, setInGameAnalysis] = useState<InGameCoachAnalysis | null>(null);
  const [generatedGuide, setGeneratedGuide] = useState<GeneratedChampionGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [selectedLoadoutSelection, setSelectedLoadoutSelection] = useState<{ championId: string; role: DraftRole; loadoutId: string } | null>(null);
  const syncInFlight = useRef(false);
  const unavailableChampionIds = new Set(
    [...Object.values(alliedBoard), ...Object.values(enemyBoard), ...alliedBans.map((ban) => ban.localChampionId), ...enemyBans.map((ban) => ban.localChampionId)].filter(
      (championId): championId is string => Boolean(championId),
    ),
  );
  const personalPool = PLAYER_CHAMPION_POOL[role];
  const usesPersonalPool = personalPool.length > 0;
  const unassignedEnemyChampionIds = enemyDetectedPicks.flatMap((pick) => pick.localChampionId ? [pick.localChampionId] : []);
  const activeTopHypothesisId = clientStatus !== "in-game" && role === "top" && suspectedTopId && unassignedEnemyChampionIds.includes(suspectedTopId)
    ? suspectedTopId
    : null;
  const enemyBoardForLinePlan = activeTopHypothesisId
    ? { ...enemyBoard, top: activeTopHypothesisId }
    : enemyBoard;
  const remainingUnassignedEnemyChampionIds = activeTopHypothesisId
    ? unassignedEnemyChampionIds.filter((championId) => championId !== activeTopHypothesisId)
    : unassignedEnemyChampionIds;
  const recommendations = recommendChampions(role, alliedBoard, enemyBoard, personalPool, [
    ...alliedBans.map((ban) => ban.localChampionId),
    ...enemyBans.map((ban) => ban.localChampionId),
  ].filter((championId): championId is string => Boolean(championId)), unassignedEnemyChampionIds);
  const currentClientPick = syncedAlliedPicks[role];
  const activeChampionId = alliedBoard[role];
  const hasActivePick = Boolean(activeChampionId || currentClientPick);
  const generatedGuideKey = currentClientPick && !getChampionById(alliedBoard[role]) ? `${role}:${currentClientPick.championId}` : null;
  const selectedChampion = activeChampionId
    ? getChampionById(activeChampionId)
    : currentClientPick
      ? null
      : getChampionById(selectedChampionId) ?? recommendations[0]?.champion ?? null;
  const selectedFit = getChampionFit(role, selectedChampion?.id ?? null, alliedBoard, enemyBoard, unassignedEnemyChampionIds);
  const summoners = getSummonerSpellRecommendation(role, enemyBoardForLinePlan, remainingUnassignedEnemyChampionIds);
  const selectedLoadouts = selectedChampion ? getChampionLoadouts(selectedChampion, enemyBoardForLinePlan, role, remainingUnassignedEnemyChampionIds) : [];
  const topLanePlans = selectedChampion && role === "top" ? getTopLanePlans(selectedChampion, unassignedEnemyChampionIds) : [];
  const selectedLoadoutId = selectedLoadoutSelection && selectedLoadoutSelection.championId === selectedChampion?.id && selectedLoadoutSelection.role === role
    ? selectedLoadoutSelection.loadoutId
    : null;
  const selectedLoadout = selectedLoadouts.find((loadout) => loadout.id === selectedLoadoutId) ?? selectedLoadouts[0] ?? null;
  const purchaseDetails = useItemPurchaseDetails(selectedLoadout);
  const purchasePlan = getLivePurchasePlan(selectedChampion, selectedLoadout, liveGame, inGameAnalysis, enemyBoard, purchaseDetails);
  const visibleGeneratedGuide = generatedGuideKey ? generatedGuide : null;

  const updateBoard = (side: "allied" | "enemy", targetRole: DraftRole, championId: string | null) => {
    const update = side === "allied" ? setAlliedBoard : setEnemyBoard;
    update((board) => ({ ...board, [targetRole]: championId }));

    if (side === "allied" && championId) {
      setRole(targetRole);
      setSelectedChampionId(championId);
    }
  };

  const resetDraft = () => {
    setAlliedBoard(EMPTY_DRAFT_BOARD);
    setEnemyBoard(EMPTY_DRAFT_BOARD);
    setSelectedChampionId(null);
  };

  useEffect(() => {
    let cancelled = false;

    const syncFromLeagueClient = async () => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      try {
        const response = await fetch("/api/lol-client/champ-select", { cache: "no-store" });
        const snapshot = (await response.json()) as LcuChampSelectSnapshot;
        if (cancelled) return;

        setClientStatus(snapshot.status);
        if (snapshot.status === "in-champ-select" || snapshot.status === "recent-champ-select" || snapshot.status === "in-game") {
          setAlliedBoard(snapshot.alliedBoard);
          setEnemyBoard(snapshot.enemyBoard);
          setSyncedAlliedPicks(snapshot.alliedPicks);
          setSyncedEnemyPicks(snapshot.enemyPicks);
          setAlliedBans(snapshot.alliedBans);
          setEnemyBans(snapshot.enemyBans);
          setPendingBans(snapshot.pendingBans);
          setEnemyDetectedPicks(snapshot.enemyDetectedPicks);
          if (snapshot.status === "in-game") {
            const nextLiveGame = snapshot.liveGame ?? EMPTY_LIVE_GAME;
            setLiveGame(nextLiveGame);
            setInGameAnalysis((previous) => analyzeInGameState(nextLiveGame, previous));
          } else {
            setLiveGame(EMPTY_LIVE_GAME);
            setInGameAnalysis(null);
          }
          if (snapshot.yourRole) {
            setRole(snapshot.yourRole);
            if (snapshot.alliedBoard[snapshot.yourRole]) {
              setSelectedChampionId(snapshot.alliedBoard[snapshot.yourRole]);
            }
          } else {
            const openRoles = DRAFT_ROLES.filter((draftRole) => !snapshot.alliedPicks[draftRole]);
            if (openRoles.length === 1) {
              setRole(openRoles[0]);
              if (snapshot.alliedBoard[openRoles[0]]) {
                setSelectedChampionId(snapshot.alliedBoard[openRoles[0]]);
              }
            }
          }
        } else {
          setSyncedAlliedPicks(EMPTY_LCU_PICK_BOARD);
          setSyncedEnemyPicks(EMPTY_LCU_PICK_BOARD);
          setAlliedBans([]);
          setEnemyBans([]);
          setPendingBans([]);
          setEnemyDetectedPicks([]);
          setLiveGame(EMPTY_LIVE_GAME);
          setInGameAnalysis(null);
        }
      } catch {
        if (!cancelled) setClientStatus("client-unavailable");
      } finally {
        syncInFlight.current = false;
      }
    };

    void syncFromLeagueClient();
    const intervalId = window.setInterval(() => void syncFromLeagueClient(), 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!generatedGuideKey) return;

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setGeneratedGuide(null);
        setIsGeneratingGuide(true);
        return fetch("/api/lol-client/guide", { cache: "no-store" });
      })
      .then(async (response) => {
        if (!response) return null;
        if (!response.ok) throw new Error("No se pudo generar la guia.");
        return response.json() as Promise<{ guide: GeneratedChampionGuide }>;
      })
      .then((guideResponse) => {
        if (!cancelled && guideResponse) setGeneratedGuide(guideResponse.guide);
      })
      .catch(() => {
        if (!cancelled) setGeneratedGuide(null);
      })
      .finally(() => {
        if (!cancelled) setIsGeneratingGuide(false);
      });

    return () => {
      cancelled = true;
    };
  }, [generatedGuideKey]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f3ea] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.16),transparent_25%),radial-gradient(circle_at_85%_10%,rgba(251,113,133,0.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.7),transparent)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700"><Sparkles className="size-4" /> Draft inteligente</p>
            <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">DraftLens <span className="text-cyan-600">LoL</span></h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">Introduce los picks del lobby y elige tu línea. Recibirás tres campeones, con builds y runas preparados para la partida.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur"><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600" /> Funciona en Safari y Chrome para Mac</span><span className={cn("flex items-center gap-2 font-medium", clientStatus === "in-champ-select" || clientStatus === "in-game" ? "text-emerald-700" : clientStatus === "recent-champ-select" ? "text-amber-700" : "text-slate-500")}><Radio className="size-4" /> {clientStatusCopy[clientStatus]}</span></div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <DraftColumn title="Tu equipo" tone="ally" board={alliedBoard} syncedPicks={syncedAlliedPicks} bans={alliedBans} unavailableChampionIds={unavailableChampionIds} onChange={(draftRole, championId) => updateBoard("allied", draftRole, championId)} />
          {clientStatus === "in-game" ? <DraftColumn title="Rivales" tone="enemy" board={enemyBoard} syncedPicks={syncedEnemyPicks} bans={enemyBans} unavailableChampionIds={unavailableChampionIds} onChange={(draftRole, championId) => updateBoard("enemy", draftRole, championId)} /> : <EnemyDraftColumn picks={enemyDetectedPicks} bans={enemyBans} />}
        </div>

        {pendingBans.length > 0 ? <p className="-mt-3 text-center text-xs text-slate-500">Bans en curso: {pendingBans.map((ban) => ban.championName).join(", ")}. Se excluirán al confirmarse.</p> : null}

        <section className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-[0_22px_60px_-25px_rgba(15,23,42,0.7)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{hasActivePick ? "Pick activo" : usesPersonalPool ? "Tu siguiente pick · pool personal" : "Tu siguiente pick · meta de la línea"}</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{hasActivePick ? `${selectedChampion?.name ?? currentClientPick?.championName ?? "Campeón"} seleccionado` : `Elige tu pick de ${ROLE_LABELS[role]}`}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-white/6 p-1.5">
                {DRAFT_ROLES.map((draftRole) => <button key={draftRole} type="button" onClick={() => setRole(draftRole)} className={cn("rounded-xl px-3 py-2 text-xs font-bold transition", role === draftRole ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white")}>{roleSymbols[draftRole]}<span className="sr-only">{ROLE_LABELS[draftRole]}</span></button>)}
              </div>
              <Button variant="ghost" size="icon" onClick={resetDraft} className="text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Limpiar draft"><X /></Button>
            </div>
          </div>
          {hasActivePick ? <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="font-semibold">{selectedFit ? `Prioridad de ${recommendationScopeCopy[selectedFit.scope].toLocaleLowerCase("es")}: ${selectedFit.score}%` : "Prioridad no disponible"}</p>{selectedFit ? <p className="mt-1 text-xs leading-5 text-cyan-100/75">{selectedFit.reasons.join(" ")}</p> : null}</div><p className="mt-2 leading-5 text-cyan-100/75 sm:mt-0">Resume señales de composición, no una probabilidad de victoria. El score de cada loadout mide meta y uso.</p></div> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((recommendation, index) => <button type="button" key={recommendation.champion.id} onClick={() => updateBoard("allied", role, recommendation.champion.id)} className={cn("min-h-36 rounded-2xl border p-4 text-left transition", selectedChampion?.id === recommendation.champion.id ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-[0_14px_30px_-18px_rgba(34,211,238,0.8)]" : "border-white/10 bg-white/6 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10")}>
              <div className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-center gap-2 pt-1 text-base font-bold"><ChampionIcon champion={recommendation.champion} className="size-10 ring-1 ring-black/10" size={40} /> <span className="truncate">{index + 1}. {recommendation.champion.name}</span></span><span className="shrink-0 text-right"><span className="block text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">Prioridad</span><span className="mt-0.5 block text-xl font-black leading-none tabular-nums">{recommendation.score}<span className="ml-0.5 text-xs font-semibold opacity-65">%</span></span><span className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium opacity-75"><span className="size-1.5 rounded-full bg-current" />{recommendationScopeCopy[recommendation.scope]}</span></span></div>
              {recommendation.isOutsidePool ? <span className="mt-3 inline-flex rounded-full bg-amber-300/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Meta</span> : null}
              <p className={cn("mt-3 text-sm leading-5", selectedChampion?.id === recommendation.champion.id ? "text-slate-700" : "text-slate-300")}>{recommendation.reasons[0]}</p>
            </button>)}
            {recommendations.length === 0 ? <p className="col-span-full rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-slate-300">No quedan campeones legales para esta línea tras los picks y bans confirmados.</p> : null}
          </div>}
        </section>

        <div>
          {visibleGeneratedGuide && currentClientPick && !selectedChampion ? <MissingChampionGuide pick={currentClientPick} role={role} guide={visibleGeneratedGuide} isGenerating={isGeneratingGuide} fit={selectedFit?.score ?? null} summoners={summoners} /> : null}
          {!visibleGeneratedGuide && selectedChampion ? <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.42)] backdrop-blur">
            <div className="grid lg:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.22fr)]">
              <div className="relative flex min-h-[20rem] flex-col overflow-hidden bg-[linear-gradient(145deg,#0891b2_0%,#0e76d5_56%,#1d4ed8_100%)] p-6 text-white sm:p-7">
                <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full border border-white/15" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Tu pick activo · {ROLE_LABELS[role]}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <ChampionIcon champion={selectedChampion} className="size-16 ring-2 ring-white/40 shadow-lg" loading="eager" size={64} />
                      <h2 className="truncate text-4xl font-black tracking-tight sm:text-5xl">{selectedChampion.name}</h2>
                    </div>
                    {selectedFit ? <span className="rounded-xl border border-white/15 bg-white/15 px-3 py-2 text-right shadow-sm"><span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100/75">Prioridad</span><span className="block text-lg font-black leading-none">{selectedFit.score}<span className="ml-0.5 text-xs font-semibold text-cyan-100/75">%</span></span><span className="mt-1 block text-[10px] font-medium text-cyan-100/75">{recommendationScopeCopy[selectedFit.scope]}</span></span> : null}
                  </div>
                  <p className="mt-5 max-w-md text-base leading-7 text-cyan-50 sm:text-lg">{selectedChampion.style}</p>
                </div>
                <div className="relative mt-auto pt-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/80">Identidad de draft</p>
                  <div className="flex flex-wrap gap-2">{selectedChampion.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">{tag.replace("-", " ")}</span>)}</div>
                  <ChampionAbilities key={selectedChampion.id} champion={selectedChampion} />
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-2 xl:p-7"><BuildAndRunes champion={selectedLoadout ?? selectedChampion} loadout={selectedLoadout} summoners={summoners} /></div>
            </div>
            {liveGame.status === "in-game" ? <div className="border-t border-slate-200 bg-[linear-gradient(110deg,rgba(236,253,245,0.72),rgba(248,250,252,0.96)_38%,rgba(236,254,255,0.72))] p-5 sm:p-6 xl:p-7"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Asistente de partida</p><p className="mt-1 text-sm text-slate-500">Ruta de compra y plan de juego según el estado observable.</p></div><span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />Actualización en vivo</span></div><div className="grid items-start gap-4 lg:grid-cols-[minmax(17rem,0.82fr)_minmax(0,1.18fr)]">{purchasePlan ? <LivePurchasePlanCard plan={purchasePlan} liveGame={liveGame} /> : null}{inGameAnalysis ? <InGameCoach analysis={inGameAnalysis} /> : null}</div></div> : null}
            {selectedLoadouts.length > 1 ? <LoadoutAlternatives loadouts={selectedLoadouts} selectedLoadoutId={selectedLoadout?.id ?? null} onSelect={(loadoutId) => setSelectedLoadoutSelection({ championId: selectedChampion.id, role, loadoutId })} /> : null}
            {topLanePlans.length > 0 ? <TopLanePlans plans={topLanePlans} suspectedTopId={activeTopHypothesisId} selectedLoadoutId={selectedLoadout?.id ?? null} onSelect={(loadoutId) => setSelectedLoadoutSelection({ championId: selectedChampion.id, role, loadoutId })} onSuspectTop={(championId) => { setSuspectedTopId(championId); setSelectedLoadoutSelection(null); }} /> : null}
          </section> : null}
          {!visibleGeneratedGuide && !selectedChampion && currentClientPick ? <MissingChampionGuide pick={currentClientPick} role={role} guide={visibleGeneratedGuide} isGenerating={isGeneratingGuide} fit={null} summoners={summoners} /> : null}
        </div>
        <p className="pb-2 text-center text-xs text-slate-500">Recomendaciones orientativas con pool curado. Ajusta la build a parches, bans y estilo del equipo.</p>
      </div>
    </main>
  );
}

function AssetTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group relative inline-flex" title={label}>{children}<span aria-hidden="true" className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-20 w-max max-w-48 -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-center text-[11px] font-semibold leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{label}</span></span>;
}

function RuneAssets({ runes }: { runes: LeagueRuneReference[] }) {
  return <div className="mt-2 flex flex-wrap gap-1.5"><span className="sr-only">{runes.map((rune) => rune.name).join(", ")}</span>{runes.map((rune, index) => <AssetTooltip key={`${rune.id ?? rune.name}-${index}`} label={rune.name}><RuneIcon rune={rune} className="size-7 ring-1 ring-slate-200" size={28} /></AssetTooltip>)}</div>;
}

function LoadoutAssetPreview({ loadout }: { loadout: Pick<SelectedLoadout, "build" | "buildItems" | "runeSelection"> }) {
  const items = loadout.buildItems?.length ? loadout.buildItems : loadout.build.map((name) => ({ name }));
  const runes = loadout.runeSelection
    ? [loadout.runeSelection.primaryTree, ...loadout.runeSelection.primaryRunes].filter((rune): rune is LeagueRuneReference => Boolean(rune)).slice(0, 3)
    : [];

  return <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Vista previa de objetos y runas">
    <span className="sr-only">Objetos: {items.map((item) => item.name).join(", ")}</span>
    {items.slice(0, 5).map((item, index) => <AssetTooltip key={`${item.name}-${index}`} label={item.name}><ItemIcon item={item} className="size-7 ring-1 ring-slate-200" size={28} /></AssetTooltip>)}
    {runes.length > 0 ? <><span className="mx-0.5 h-5 border-l border-slate-200" /><span className="sr-only">Runas: {runes.map((rune) => rune.name).join(", ")}</span>{runes.map((rune, index) => <AssetTooltip key={`${rune.id ?? rune.name}-${index}`} label={rune.name}><RuneIcon rune={rune} className="size-7 ring-1 ring-slate-200" size={28} /></AssetTooltip>)}</> : null}
  </div>;
}

function BuildAndRunes({ champion, loadout, summoners }: { champion: { build: string[]; runes: { primary: string; secondary: string; shards: string }; runeSelection?: RuneSelection }; loadout?: SelectedLoadout | null; summoners: ReturnType<typeof getSummonerSpellRecommendation> }) {
  const runeSelection = champion.runeSelection;
  const primaryRunes = runeSelection ? [runeSelection.primaryTree, ...runeSelection.primaryRunes].filter((rune): rune is LeagueRuneReference => Boolean(rune)) : [];
  const secondaryRunes = runeSelection ? [runeSelection.secondaryTree, ...runeSelection.secondaryRunes].filter((rune): rune is LeagueRuneReference => Boolean(rune)) : [];
  return <>
    <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><Swords className="size-4 text-cyan-600" /> Build</p>{loadout ? <span className="shrink-0 whitespace-nowrap rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold leading-4 text-cyan-800">{loadout.label}</span> : null}</div>
      <ol className="mt-4 space-y-2.5">{champion.build.map((item, index) => <li key={`${item}-${index}`} className="flex items-center gap-3 text-sm leading-5 text-slate-700"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">{index + 1}</span><ItemIcon item={{ name: item }} className="size-8 ring-1 ring-slate-200" size={32} /><span>{item}</span></li>)}</ol>
      {loadout ? <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-700">Score de loadout: {loadout.score}%.</span> {loadout.rationale}</p> : null}
    </section>
    <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><div className="flex flex-wrap items-start justify-between gap-3"><p className="pt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Runas</p><SummonerSpells recommendation={summoners} /></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-400">Principal</dt>{primaryRunes.length > 0 ? <dd><RuneAssets runes={primaryRunes} /></dd> : <dd className="mt-1 font-semibold leading-6 text-slate-800">{champion.runes.primary}</dd>}</div><div><dt className="text-slate-400">Secundaria</dt>{secondaryRunes.length > 0 ? <dd><RuneAssets runes={secondaryRunes} /></dd> : <dd className="mt-1 font-semibold leading-6 text-slate-800">{champion.runes.secondary}</dd>}</div><div><dt className="text-slate-400">Fragmentos</dt><dd className="mt-1 font-semibold leading-6 text-slate-800">{champion.runes.shards}</dd></div></dl></section>
  </>;
}

function LoadoutAlternatives({ loadouts, selectedLoadoutId, onSelect }: { loadouts: SelectedLoadout[]; selectedLoadoutId: string | null; onSelect: (loadoutId: string) => void }) {
  return <div className="border-t border-slate-100 bg-slate-50/70 p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Alternativas de loadout</p><p className="mt-1 text-xs leading-5 text-slate-500">Selecciona una alternativa para aplicarla arriba con su build y runas. El score de meta es orientativo.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{loadouts.map((loadout, index) => {
    const selected = loadout.id === selectedLoadoutId;
    return <button key={loadout.id} type="button" aria-pressed={selected} onClick={() => onSelect(loadout.id)} className={cn("rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500", selected ? "border-cyan-400 bg-cyan-50 shadow-[0_12px_24px_-20px_rgba(8,145,178,0.8)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-sm")}><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-800">{loadout.label}{index === 0 ? <span className="ml-2 rounded-full bg-cyan-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-900">Mejor meta</span> : null}{selected ? <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">Seleccionada</span> : null}</p><span className="text-right text-sm font-bold text-slate-600"><span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Meta</span>{loadout.score}%</span></div>{loadout.runeSelection ? null : <p className="mt-2 text-sm font-medium text-slate-700">{loadout.runes.primary}</p>}<LoadoutAssetPreview loadout={loadout} /><p className="mt-2 text-sm leading-5 text-slate-500">{loadout.build.join(" → ")}</p><p className="mt-2 text-xs leading-5 text-slate-500">{loadout.rationale}</p></button>;
  })}</div></div>;
}

function TopLanePlans({ plans, suspectedTopId, selectedLoadoutId, onSelect, onSuspectTop }: { plans: ReturnType<typeof getTopLanePlans>; suspectedTopId: string | null; selectedLoadoutId: string | null; onSelect: (loadoutId: string) => void; onSuspectTop: (championId: string | null) => void }) {
  const candidates = plans.flatMap((plan) => plan.opponent ? [plan.opponent] : []);
  return <div className="border-t border-slate-100 bg-amber-50/50 p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Planes de línea · Top</p><p className="mt-1 text-xs leading-5 text-slate-600">Los roles rivales siguen ocultos. Marca tu lectura del posible Top para recalcular la build y el inicio como una hipótesis, no como un rol confirmado.</p>{candidates.length > 0 ? <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">Tu lectura del matchup</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={suspectedTopId === null} onClick={() => onSuspectTop(null)} className={cn("rounded-xl border px-3 py-2 text-xs font-semibold transition", suspectedTopId === null ? "border-amber-400 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300")}>Top sin confirmar</button>{candidates.map((candidate) => <button key={candidate.id} type="button" aria-pressed={suspectedTopId === candidate.id} onClick={() => onSuspectTop(candidate.id)} className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition", suspectedTopId === candidate.id ? "border-amber-400 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300")}><ChampionIcon champion={candidate} className="size-5" size={20} />{candidate.name}</button>)}</div>{suspectedTopId ? <p className="mt-2 text-[11px] leading-4 text-amber-800">Hipótesis activa: la build y el inicio se preparan contra este posible rival hasta que League confirme las posiciones.</p> : null}</div> : null}<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => {
    const selected = plan.loadout.id === selectedLoadoutId;
    return <button key={plan.id} type="button" aria-pressed={selected} onClick={() => onSelect(plan.loadout.id)} className={cn("rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500", selected ? "border-amber-400 bg-amber-100/70 shadow-[0_12px_24px_-20px_rgba(180,83,9,0.8)]" : "border-amber-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm")}><div className="flex items-center gap-2"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", plan.kind === "safe" ? "bg-slate-200 text-slate-700" : "bg-amber-200 text-amber-900")}>{plan.kind === "safe" ? "Seguro" : "Condicional"}</span>{plan.opponent ? <ChampionIcon champion={plan.opponent} className="size-6" size={24} /> : null}</div><p className="mt-3 font-bold text-slate-800">{plan.title}</p>{plan.loadout.runeSelection ? null : <p className="mt-2 text-sm font-medium text-slate-700">{plan.loadout.runes.primary}</p>}<LoadoutAssetPreview loadout={plan.loadout} /><p className="mt-2 text-sm leading-5 text-slate-500">{plan.loadout.build.join(" → ")}</p><p className="mt-2 text-xs leading-5 text-slate-500">{plan.description}</p></button>;
  })}</div></div>;
}

function SummonerSpells({ recommendation }: { recommendation: ReturnType<typeof getSummonerSpellRecommendation> }) {
  return <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Summoners</p><div className="mt-1.5 flex justify-end gap-2"><span className="sr-only">{recommendation.spells.map((spell) => spell.name).join(", ")}</span>{recommendation.spells.map((spell) => <AssetTooltip key={spell.id ?? spell.name} label={spell.name}><SpellIcon spell={spell} className="size-9 ring-1 ring-slate-200" size={36} /></AssetTooltip>)}</div></div>;
}

function LivePurchasePlanCard({ plan, liveGame }: { plan: LivePurchasePlan; liveGame: LiveGameSnapshot }) {
  const minutes = liveGame.gameTime === null ? null : `${Math.floor(liveGame.gameTime / 60)}:${String(Math.floor(liveGame.gameTime % 60)).padStart(2, "0")}`;
  const currentGold = liveGame.currentGold === null ? "--" : Math.floor(liveGame.currentGold);
  const nextStep = plan.steps.find((step) => step.status === "next");

  return <section className="rounded-2xl bg-white p-4 ring-1 ring-emerald-200 shadow-[0_16px_35px_-30px_rgba(5,150,105,0.8)]">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Ruta de compra · en vivo</p><h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">{plan.headline}</h3></div>
      <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-right text-[11px] font-semibold leading-4 text-emerald-800">{minutes ? `Min ${minutes}` : "En curso"}<span className="block text-emerald-700/70">{currentGold} oro</span></p>
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-500">{plan.rationale}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Inicio de partida</p><div className="mt-2 flex flex-wrap items-center gap-2">{plan.opening.items.map((item) => <AssetTooltip key={item.id ?? item.name} label={item.name}><ItemIcon item={item} className="size-8 ring-1 ring-slate-200" size={32} /></AssetTooltip>)}<span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide", plan.opening.status === "owned" ? "bg-emerald-100 text-emerald-800" : "bg-cyan-100 text-cyan-800")}>{plan.opening.status === "owned" ? "Detectado" : "Recomendado"}</span></div><p className="mt-2 text-[11px] leading-4 text-slate-500">{plan.opening.rationale}</p></div>
      {plan.nextPurchase ? <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Próximo back</p><div className="mt-2 flex items-center gap-2"><AssetTooltip label={plan.nextPurchase.target.name}><ItemIcon item={plan.nextPurchase.target} className="size-8 ring-1 ring-emerald-200" size={32} /></AssetTooltip><span className="min-w-0 truncate text-sm font-bold text-slate-900">Objetivo: {plan.nextPurchase.target.name}</span></div>{plan.nextPurchase.buyNow ? <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/80 p-2"><AssetTooltip label={plan.nextPurchase.buyNow.name}><ItemIcon item={plan.nextPurchase.buyNow} className="size-7 ring-1 ring-slate-200" size={28} /></AssetTooltip><p className="text-xs leading-4 text-slate-700"><span className="font-bold">Compra ahora:</span> {plan.nextPurchase.buyNow.name}{plan.nextPurchase.buyNowCost !== null ? ` · ${plan.nextPurchase.buyNowCost} oro` : ""}</p></div> : <p className="mt-2 text-xs leading-4 text-emerald-800">Cargando receta oficial y componentes.</p>}</div> : null}
    </div>
    {plan.nextPurchase?.componentPath.length ? <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Orden de componentes</p><div className="mt-2 flex flex-wrap items-center gap-1.5">{plan.nextPurchase.componentPath.map((item, index) => <span key={`${item.id ?? item.name}-${index}`} className="flex items-center gap-1.5"><AssetTooltip label={item.name}><ItemIcon item={item} className="size-6 ring-1 ring-slate-200" size={24} /></AssetTooltip>{index < plan.nextPurchase!.componentPath.length - 1 ? <span className="text-slate-300">→</span> : null}</span>)}<span className="text-slate-300">→</span><AssetTooltip label={plan.nextPurchase.target.name}><ItemIcon item={plan.nextPurchase.target} className="size-6 ring-1 ring-emerald-200" size={24} /></AssetTooltip></div><p className="mt-2 text-[11px] leading-4 text-slate-500">{plan.nextPurchase.rationale}</p></div> : null}
    <ol className="mt-4 space-y-2" aria-label="Ruta de objetos completos">
      {plan.steps.slice(0, 5).map((step, index) => <li key={`${step.item.id ?? step.item.name}-${index}`} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 ring-1", step.status === "next" ? "bg-emerald-50 ring-emerald-300" : step.status === "owned" ? "bg-slate-50 text-slate-500 ring-slate-200" : "bg-white ring-slate-100")}>
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", step.status === "owned" ? "bg-emerald-600 text-white" : step.status === "next" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>{step.status === "owned" ? <Check className="size-3.5" /> : index + 1}</span>
        <AssetTooltip label={step.item.name}><ItemIcon item={step.item} className="size-8 ring-1 ring-slate-200" size={32} /></AssetTooltip>
        <span className={cn("min-w-0 flex-1 truncate text-sm font-semibold", step.status === "next" ? "text-slate-900" : "text-slate-600")}>{step.item.name}</span>
        {step.status !== "later" ? <span className={cn("shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide", step.status === "owned" ? "bg-slate-200 text-slate-600" : "bg-emerald-600 text-white")}>{step.status === "owned" ? "Comprado" : "Siguiente"}</span> : null}
      </li>)}
    </ol>
    {nextStep ? <p className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-300"><span className="font-bold text-emerald-300">Por qué ahora:</span> {nextStep.reason}</p> : <p className="mt-3 text-xs font-semibold text-emerald-700">Ruta principal completada.</p>}
  </section>;
}

const postureCopy = {
  aggressive: { label: "Agresivo", classes: "bg-cyan-100 text-cyan-800 ring-cyan-200" },
  controlled: { label: "Controlado", classes: "bg-amber-100 text-amber-800 ring-amber-200" },
  defensive: { label: "Defensivo", classes: "bg-rose-100 text-rose-800 ring-rose-200" },
} as const;

const phaseLabels = {
  opening: "Apertura",
  laning: "Fase de líneas",
  transition: "Transición",
  macro: "Macro",
} as const;

const confidenceLabels = { high: "Datos completos", medium: "Estimación parcial", low: "Datos insuficientes" } as const;

function InGameCoach({ analysis }: { analysis: InGameCoachAnalysis }) {
  const posture = postureCopy[analysis.posture];
  const priorities = analysis.teamPriorities;

  return <section className="rounded-2xl bg-slate-950 p-5 text-white ring-1 ring-slate-800">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">Plan en vivo · {phaseLabels[analysis.phase]}</p><h3 className="mt-2 text-xl font-black tracking-tight">{analysis.title}</h3></div>
      <div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-3 py-1 text-[11px] font-bold ring-1", posture.classes)}>{posture.label}</span><span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold text-slate-300 ring-1 ring-white/10">{confidenceLabels[analysis.confidence]}</span></div>
    </div>
    <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.summary}</p>
    <div className={cn("mt-3 rounded-xl px-3 py-2 text-xs leading-5 ring-1", analysis.matchup.source === "specific" ? "bg-cyan-400/10 text-cyan-100 ring-cyan-300/20" : "bg-white/5 text-slate-300 ring-white/10")}><span className="font-bold">{analysis.matchup.label}:</span> {analysis.matchup.summary}</div>
    {analysis.factors.length > 0 ? <div className="mt-4 flex flex-wrap gap-2" aria-label="Factores de la lectura de línea">{analysis.factors.map((factor) => <span key={factor.id} className={cn("rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1", factor.points > 2 ? "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20" : factor.points < -2 ? "bg-rose-400/10 text-rose-200 ring-rose-300/20" : "bg-white/7 text-slate-300 ring-white/10")}>{factor.label}</span>)}</div> : null}
    {priorities.strongestAlly || priorities.strongestEnemy ? <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Prioridades visibles de equipo">
      {priorities.strongestAlly ? <div className="rounded-xl bg-emerald-400/10 p-3 ring-1 ring-emerald-300/20"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">Aliado con mayor ventaja visible</p><div className="mt-2 flex items-center gap-2"><ChampionIcon champion={{ name: priorities.strongestAlly.championName }} size={32} /><div><p className="text-sm font-bold text-white">{priorities.strongestAlly.isActivePlayer ? "Tú · " : ""}{priorities.strongestAlly.championName}</p><p className="text-[11px] text-emerald-100/70">{priorities.strongestAlly.role ? ROLE_LABELS[priorities.strongestAlly.role] : "Rol sin confirmar"}</p></div></div><p className="mt-2 text-xs leading-5 text-slate-200">{priorities.allyAction}</p><p className="mt-2 text-[10px] leading-4 text-slate-400">{priorities.strongestAlly.reason}</p></div> : null}
      {priorities.strongestEnemy ? <div className="rounded-xl bg-rose-400/10 p-3 ring-1 ring-rose-300/20"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">Enemigo con mayor ventaja visible</p><div className="mt-2 flex items-center gap-2"><ChampionIcon champion={{ name: priorities.strongestEnemy.championName }} size={32} /><div><p className="text-sm font-bold text-white">{priorities.strongestEnemy.championName}</p><p className="text-[11px] text-rose-100/70">{priorities.strongestEnemy.role ? ROLE_LABELS[priorities.strongestEnemy.role] : "Rol sin confirmar"}</p></div></div><p className="mt-2 text-xs leading-5 text-slate-200">{priorities.enemyAction}</p>{priorities.buildAdjustment ? <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-4 text-rose-100">Build: {priorities.buildAdjustment}</p> : null}<p className="mt-2 text-[10px] leading-4 text-slate-400">{priorities.strongestEnemy.reason}</p></div> : null}
    </div> : null}
    <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[1fr_0.9fr]">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Ahora</p><ul className="mt-2 space-y-2">{analysis.actions.map((action) => <li key={action} className="flex gap-2 text-sm leading-5 text-slate-200"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-300" />{action}</li>)}</ul></div>
      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/8"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">Evita</p><p className="mt-2 text-sm leading-5 text-slate-300">{analysis.avoid}</p></div>
    </div>
    <p className="mt-4 text-[10px] leading-4 text-slate-500">La ventaja usa nivel, CS, KDA y valor visible del inventario. No conoce el oro enemigo sin gastar ni la posición actual de la jungla.</p>
  </section>;
}

function MissingChampionGuide({ pick, role, guide, isGenerating, fit, summoners }: { pick: LcuDraftPick; role: DraftRole; guide: GeneratedChampionGuide | null; isGenerating: boolean; fit: number | null; summoners: ReturnType<typeof getSummonerSpellRecommendation> }) {
  if (guide) {
    return (
      <section className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white/85 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.32)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-7 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Datos OP.GG · {ROLE_LABELS[role]}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><h2 className="text-4xl font-black tracking-tight">{pick.championName}</h2>{fit !== null ? <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{fit}% fit</span> : null}</div><p className="mt-3 max-w-sm leading-6 text-emerald-50">{guide.rationale}</p></div>
          <div className="grid gap-6 p-7 sm:grid-cols-3"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500"><Swords className="size-4 text-emerald-600" /> Build sugerida</p><ol className="mt-3 space-y-2">{guide.build.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 text-sm text-slate-700"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>{item}</li>)}</ol></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Runas</p><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-slate-400">Principal</dt><dd className="font-semibold text-slate-800">{guide.runes.primary}</dd></div><div><dt className="text-slate-400">Secundaria</dt><dd className="font-semibold text-slate-800">{guide.runes.secondary}</dd></div><div><dt className="text-slate-400">Fragmentos</dt><dd className="font-semibold text-slate-800">{guide.runes.shards}</dd></div></dl></div><SummonerSpells recommendation={summoners} /></div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-7 text-amber-950 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.22)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Pick detectado · {ROLE_LABELS[role]}</p>
      <h2 className="mt-2 text-3xl font-black">{pick.championName}</h2>
      <p className="mt-3 max-w-2xl leading-6 text-amber-900/80">{isGenerating ? "Consultando build y runas actualizadas en OP.GG..." : "League ha sincronizado este campeón, pero OP.GG no ha devuelto una guía ahora mismo."}</p>
    </section>
  );
}
