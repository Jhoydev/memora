import type { SelectedLoadout } from "./champion-loadout.service";
import type { LeagueItemReference } from "../domain/lol-draft.types";

function normalizeItemName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export function getNextItemRecommendation(
  loadout: SelectedLoadout | null,
  ownedItems: Array<string | LeagueItemReference>,
) {
  if (!loadout) return null;

  const owned = new Set(ownedItems.map((item) => normalizeItemName(typeof item === "string" ? item : item.name)));
  const build = loadout.buildItems?.map((item) => item.name) ?? loadout.build;
  const item = build.find((buildItem) => !owned.has(normalizeItemName(buildItem)));
  return item ?? null;
}
