"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  LolChampionReference,
  LolChampionPassive,
  LolChampionAbility,
  LolChampionAbilityReference,
  LolItemReference,
  LolPassiveReference,
  LolRuneReference,
  LolSpellReference,
} from "../domain/lol-assets.types";
import { lolAssets } from "../services/lol-assets.service";

type LolAssetImageProps = {
  alt: string;
  className?: string;
  fallbackSrc: string;
  loading?: "eager" | "lazy";
  size?: number;
  src: string;
};

function LolAssetImage({
  alt,
  className,
  fallbackSrc,
  loading = "lazy",
  size = 40,
  src,
}: LolAssetImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = failedSrc === src ? fallbackSrc : src;

  return (
    // Data Dragon images stay remote; the internal asset route resolves their current version first.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={cn("shrink-0 object-cover", className)}
      decoding="async"
      height={size}
      loading={loading}
      onError={() => setFailedSrc(src)}
      src={resolvedSrc}
      width={size}
    />
  );
}

type IconProps = {
  className?: string;
  loading?: "eager" | "lazy";
  size?: number;
};

function getNamedAssetLabel(reference: LolItemReference | LolRuneReference, fallback: string) {
  return typeof reference === "object" && reference.name ? reference.name : fallback;
}

function getSpellLabel(reference: LolSpellReference) {
  return typeof reference === "object" && reference.name ? reference.name : "Hechizo de invocador de League of Legends";
}

export function ChampionIcon({
  champion,
  className,
  loading,
  size,
}: IconProps & { champion: LolChampionReference }) {
  const alt = champion.name ?? champion.id ?? "Campeón de League of Legends";
  return <LolAssetImage alt={alt} className={cn("rounded-full", className)} fallbackSrc={lolAssets.fallback("champion")} loading={loading} size={size} src={lolAssets.champion(champion)} />;
}

export function ItemIcon({ item, className, loading, size }: IconProps & { item: LolItemReference }) {
  return <LolAssetImage alt={getNamedAssetLabel(item, "Objeto de League of Legends")} className={cn("rounded-xl", className)} fallbackSrc={lolAssets.fallback("item")} loading={loading} size={size} src={lolAssets.item(item)} />;
}

export function RuneIcon({ rune, className, loading, size }: IconProps & { rune: LolRuneReference }) {
  return <LolAssetImage alt={getNamedAssetLabel(rune, "Runa de League of Legends")} className={cn("rounded-full", className)} fallbackSrc={lolAssets.fallback("rune")} loading={loading} size={size} src={lolAssets.rune(rune)} />;
}

export function SpellIcon({ spell, className, loading, size }: IconProps & { spell: LolSpellReference }) {
  return <LolAssetImage alt={getSpellLabel(spell)} className={cn("rounded-xl", className)} fallbackSrc={lolAssets.fallback("spell")} loading={loading} size={size} src={lolAssets.spell(spell)} />;
}

export function ChampionAbilityIcon({ ability, className, loading, size }: IconProps & { ability: LolChampionAbilityReference }) {
  const alt = ability.name ?? ability.id ?? "Habilidad de campeón de League of Legends";
  return <LolAssetImage alt={alt} className={cn("rounded-xl", className)} fallbackSrc={lolAssets.fallback("ability")} loading={loading} size={size} src={lolAssets.ability(ability)} />;
}

export function PassiveIcon({ passive, className, loading, size }: IconProps & { passive: LolPassiveReference }) {
  return <LolAssetImage alt="Pasiva de League of Legends" className={cn("rounded-xl", className)} fallbackSrc={lolAssets.fallback("passive")} loading={loading} size={size} src={lolAssets.passive(passive)} />;
}

export function ChampionAbilities({ champion }: { champion: LolChampionReference }) {
  const [abilities, setAbilities] = useState<LolChampionAbility[]>([]);
  const [passive, setPassive] = useState<LolChampionPassive | null>(null);
  const detailsUrl = lolAssets.championDetails(champion);

  useEffect(() => {
    let cancelled = false;

    void fetch(detailsUrl, { cache: "force-cache" })
      .then((response) => response.ok ? response.json() as Promise<{ abilities: LolChampionAbility[]; passive: LolChampionPassive | null }> : { abilities: [], passive: null })
      .then((payload) => {
        if (!cancelled) {
          setAbilities(payload.abilities);
          setPassive(payload.passive);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAbilities([]);
          setPassive(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailsUrl]);

  if (abilities.length === 0 && !passive) return null;

  return <div className="mt-5 border-t border-white/15 pt-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/80">Habilidades</p><div className="flex flex-wrap gap-2">{passive ? <div className="group relative"><PassiveIcon passive={{ image: passive.image }} className="size-9 ring-1 ring-white/25" size={36} /><span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-slate-950/80 text-[9px] font-bold text-white">P</span><span className="sr-only">{passive.name}</span></div> : null}{abilities.slice(0, 4).map((ability, index) => <div key={ability.id} className="group relative"><ChampionAbilityIcon ability={{ champion, ...ability }} className="size-9 ring-1 ring-white/25" size={36} /><span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-slate-950/80 text-[9px] font-bold text-white">{"QWER"[index]}</span><span className="sr-only">{ability.name}</span></div>)}</div></div>;
}
