import { DRAFT_ROLES, type Champion, type DraftBoard, type DraftRole } from "../domain/lol-draft.types";
import topMetaSnapshot from "../data/opgg-lane-meta.json";
import riotChampionProfiles from "../data/riot-champion-profiles.json";

export const EMPTY_DRAFT_BOARD: DraftBoard = {
  top: null,
  jungle: null,
  mid: null,
  adc: null,
  support: null,
};

export const ROLE_LABELS: Record<DraftRole, string> = {
  top: "Top",
  jungle: "Jungla",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
};

// Pool personal usado por el recomendador. Los selectores siguen permitiendo explorar el pool curado completo.
export const PLAYER_CHAMPION_POOL: Record<DraftRole, string[]> = {
  top: ["gnar", "malphite", "sett", "aurelion-sol", "ksante", "poppy", "galio", "zaahen"],
  jungle: ["nocturne", "malphite", "shyvana", "evelynn"],
  mid: [],
  adc: ["jinx", "lucian", "sivir", "samira"],
  support: ["braum", "janna", "milio", "zilean"],
};

const CURATED_CHAMPIONS: Champion[] = [
  {
    id: "ornn", name: "Ornn", roles: ["top"], tags: ["frontline", "engage", "ap"], style: "Frontline y engage para peleas largas.", build: ["Guantelete de hielo", "Capa de fuego solar", "Jak'Sho"], runes: { primary: "Garras del inmortal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "camille", name: "Camille", roles: ["top"], tags: ["ad", "dive", "split", "tank-shred"], damageProfile: { physical: "primary", magic: "none", true: "secondary" }, style: "Amenaza lateral que encuentra carries aislados.", build: ["Fuerza de trinidad", "Hidra voraz", "Baile de la muerte"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" }, loadouts: [
      { id: "duelo", label: "Duelo sostenido", build: ["Fuerza de trinidad", "Hidra voraz", "Baile de la muerte"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" }, rationale: "Conquistador y sustain para presión lateral y peleas largas." },
      { id: "anti-burst", label: "Contra burst", against: "burst", build: ["Fuerza de trinidad", "Hidra titánica", "Calibrador de Sterak"], runes: { primary: "Garras del inmortal", secondary: "Valor", shards: "Fuerza adaptable · Vida · Vida" }, rationale: "Garras y vida adicional para sobrevivir al all-in rival antes de responder." },
    ],
  },
  {
    id: "gnar", name: "Gnar", roles: ["top"], tags: ["ad", "frontline", "engage", "poke"], style: "Presión de línea con iniciación de equipo.", build: ["Cuchilla negra", "Fuerza de la trinidad", "Rostro espiritual"], runes: { primary: "Pies veloces", secondary: "Dominación", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "gwen", name: "Gwen", roles: ["top"], tags: ["ap", "dive", "tank-shred", "split"], damageProfile: { physical: "none", magic: "primary", true: "secondary" }, style: "Daño mágico sostenido contra frontline.", build: ["Creadora de grietas", "Diente de Nashor", "Reloj de arena de Zhonya"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "illaoi", name: "Illaoi", roles: ["top"], tags: ["ad", "frontline", "sustain", "split", "tank-shred"], style: "Luchadora de presión lateral que domina peleas en espacio cerrado.", build: ["Guantelete de hielo", "Cuchilla negra", "Calibrador de Sterak"], runes: { primary: "Garras del inmortal", secondary: "Precisión", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "mordekaiser", name: "Mordekaiser", roles: ["top"], tags: ["ap", "frontline", "sustain", "tank-shred"], style: "Luchador mágico que aísla objetivos y sostiene peleas largas.", build: ["Creadora de grietas", "Tormento de Liandry", "Reloj de arena de Zhonya"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" }, loadouts: [
      { id: "frontline", label: "Contra frontline", against: "frontline", build: ["Creadora de grietas", "Tormento de Liandry", "Cetro de cristal de Rylai"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" }, rationale: "Conquistador y Liandry para desgastar tanques en peleas extendidas." },
      { id: "estandar", label: "Pelea extendida", build: ["Creadora de grietas", "Tormento de Liandry", "Reloj de arena de Zhonya"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" }, rationale: "Conquistador y omnivampirismo para dominar peleas largas." },
    ],
  },
  {
    id: "malphite", name: "Malphite", roles: ["top", "jungle"], tags: ["ap", "frontline", "engage", "poke"], style: "Iniciación fiable y respuesta sólida contra composiciones AD.", build: ["Tormento de Liandry", "Llamasombría", "Reloj de arena de Zhonya"], runes: { primary: "Cometa arcano", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" }, loadouts: [
      { id: "poke-ap", label: "Poke AP", build: ["Tormento de Liandry", "Llamasombría", "Reloj de arena de Zhonya"], runes: { primary: "Cometa arcano", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" }, rationale: "Cometa y poder de habilidad para castigar desde rango antes de iniciar." },
      { id: "frontline-ad", label: "Frontline contra AD", against: "ad", build: ["Guantelete de hielo", "Capa de fuego solar", "Malla de espinas"], runes: { primary: "Garras del inmortal", secondary: "Valor", shards: "Velocidad de ataque · Vida · Vida" }, rationale: "Garras, armadura y vida para absorber daño físico e iniciar peleas." },
    ],
  },
  {
    id: "sett", name: "Sett", roles: ["top"], tags: ["ad", "frontline", "engage", "sustain"], damageProfile: { physical: "primary", magic: "none", true: "secondary" }, style: "Luchador resistente que castiga el cuerpo a cuerpo rival.", build: ["Rompecascos", "Cuchilla negra", "Calibrador de Sterak"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "aurelion-sol", name: "Aurelion Sol", roles: ["top"], tags: ["ap", "poke", "burst"], style: "Amenaza mágica de escalado con control de zona.", build: ["Tormento de Liandry", "Cetro de cristal de Rylai", "Sombrero mortal de Rabadon"], runes: { primary: "Conquistador", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "ksante", name: "K'Sante", roles: ["top"], tags: ["ad", "frontline", "engage", "peel"], damageProfile: { physical: "secondary", magic: "secondary", true: "secondary" }, style: "Frontline de alta movilidad que protege y aisla objetivos.", build: ["Guantelete de hielo", "Jak'Sho", "Rostro espiritual"], runes: { primary: "Garras del inmortal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "poppy", name: "Poppy", roles: ["top"], tags: ["ad", "frontline", "engage", "peel"], style: "Control anti-dash y protección para la composición.", build: ["Guantelete de hielo", "Capa de fuego solar", "Rostro espiritual"], runes: { primary: "Garras del inmortal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "zaahen", name: "Zaahen", roles: ["top"], tags: ["ad", "frontline", "engage", "sustain"], style: "Luchador resistente para presión lateral y peleas extendidas.", build: ["Cuchilla negra", "Calibrador de Sterak", "Baile de la muerte"], runes: { primary: "Conquistador", secondary: "Valor", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "shen", name: "Shen", roles: ["top", "support"], tags: ["frontline", "engage", "peel", "split"], style: "Frontline global que protege al carry y habilita respuestas rápidas.", build: ["Corazón de hielo", "Jak'Sho", "Rostro espiritual"], runes: { primary: "Garras del inmortal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "sion", name: "Sion", roles: ["top", "jungle"], tags: ["ad", "frontline", "engage", "split"], style: "Tanque de iniciación con gran control de zonas.", build: ["Capa de fuego solar", "Corazón de hielo", "Rostro espiritual"], runes: { primary: "Garras del inmortal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "jarvan-iv", name: "Jarvan IV", roles: ["jungle"], tags: ["ad", "engage", "dive", "frontline"], style: "Iniciación directa para habilitar carries.", build: ["Cielo dividido", "Cuchilla negra", "Ángel de la guarda"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "sejuani", name: "Sejuani", roles: ["jungle"], tags: ["frontline", "engage", "peel", "ap"], style: "Control fiable y protección para el backline.", build: ["Creagrietas", "Armadura de Warmog", "Rostro espiritual"], runes: { primary: "Posimpacto", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "viego", name: "Viego", roles: ["jungle"], tags: ["ad", "dive", "sustain", "tank-shred"], style: "Limpieza de peleas tras la primera baja.", build: ["Hoja del rey arruinado", "Cuchilla negra", "Baile de la muerte"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "lillia", name: "Lillia", roles: ["jungle"], tags: ["ap", "engage", "poke", "sustain"], style: "Daño mágico de área y preparación de wombo.", build: ["Tormento de Liandry", "Cetro de cristal de Rylai", "Reloj de arena de Zhonya"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "nocturne", name: "Nocturne", roles: ["jungle"], tags: ["ad", "dive", "pick", "burst"], style: "Amenaza global para castigar carries aislados.", build: ["Cuchilla negra", "Hidra voraz", "Ángel de la guarda"], runes: { primary: "Compás letal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "shyvana", name: "Shyvana", roles: ["jungle"], tags: ["ad", "ap", "dive", "tank-shred"], style: "Daño explosivo y presión sobre objetivos neutrales.", build: ["Diente de Nashor", "Tormento de Liandry", "Reloj de arena de Zhonya"], runes: { primary: "Conquistador", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "evelynn", name: "Evelynn", roles: ["jungle"], tags: ["ap", "pick", "burst", "dive"], style: "Asesinato desde sigilo para eliminar objetivos frágiles.", build: ["Cintomisil hextech", "Sombrero mortal de Rabadon", "Reloj de arena de Zhonya"], runes: { primary: "Electrocutar", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "ahri", name: "Ahri", roles: ["mid"], tags: ["ap", "pick", "burst", "dive"], style: "Pick móvil para crear superioridad numérica.", build: ["Compañera de Luden", "Llamasombría", "Reloj de arena de Zhonya"], runes: { primary: "Electrocutar", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "orianna", name: "Orianna", roles: ["mid"], tags: ["ap", "engage", "peel", "poke"], style: "Control de zona y sinergia con iniciadores.", build: ["Compañera de Luden", "Llamasombría", "Sombrero mortal de Rabadon"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "syndra", name: "Syndra", roles: ["mid"], tags: ["ap", "poke", "burst", "pick"], style: "Castigo a objetivos frágiles desde distancia.", build: ["Compañera de Luden", "Llamasombría", "Sombrero mortal de Rabadon"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "galio", name: "Galio", roles: ["top", "mid"], tags: ["ap", "frontline", "engage", "peel"], style: "Respuesta robusta contra dive y daño mágico.", build: ["Cintomisil hextech", "Reloj de arena de Zhonya", "Bastón del vacío"], runes: { primary: "Posimpacto", secondary: "Brujería", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "aurora", name: "Aurora", roles: ["top", "mid"], tags: ["ap", "poke", "burst", "dive"], style: "Amenaza mágica móvil que castiga objetivos aislados.", build: ["Tormento de Liandry", "Llamasombría", "Reloj de arena de Zhonya"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "jinx", name: "Jinx", roles: ["adc"], tags: ["ad", "tank-shred", "sustain"], style: "DPS de escalado para front-to-back.", build: ["Filo de la noche", "Huracán de Runaan", "Recuerdos de lord Dominik"], runes: { primary: "Compás letal", secondary: "Brujería", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "kaisa", name: "Kai'Sa", roles: ["adc"], tags: ["ad", "ap", "dive", "burst", "tank-shred"], style: "Carry híbrido que sigue el engage.", build: ["Kraken Slayer", "Diente de Nashor", "Reloj de arena de Zhonya"], runes: { primary: "Compás letal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "ashe", name: "Ashe", roles: ["adc"], tags: ["ad", "poke", "pick", "peel"], style: "Utilidad global y control para perseguir picks.", build: ["Filo infinito", "Huracán de Runaan", "Sanguinaria"], runes: { primary: "Compás letal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "xayah", name: "Xayah", roles: ["adc"], tags: ["ad", "peel", "sustain", "tank-shred"], style: "Carry seguro contra composiciones de dive.", build: ["Filo infinito", "Cañón de fuego rápido", "Sanguinaria"], runes: { primary: "Compás letal", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "lucian", name: "Lucian", roles: ["adc"], tags: ["ad", "burst", "dive", "poke"], style: "Tirador de presión temprana y ejecución rápida.", build: ["Filo infinito", "Cañón de fuego rápido", "Recuerdos de lord Dominik"], runes: { primary: "Primer golpe", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "sivir", name: "Sivir", roles: ["adc"], tags: ["ad", "poke", "sustain", "peel"], style: "Limpieza de oleadas y utilidad para acelerar al equipo.", build: ["Filo infinito", "Navajas rápidas de Navori", "Recuerdos de lord Dominik"], runes: { primary: "Compás letal", secondary: "Brujería", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "samira", name: "Samira", roles: ["adc"], tags: ["ad", "dive", "burst", "sustain"], style: "Carry explosiva que aprovecha el engage aliado.", build: ["Filo infinito", "Sanguinaria", "Ángel de la guarda"], runes: { primary: "Conquistador", secondary: "Dominación", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "ziggs", name: "Ziggs", roles: ["mid", "adc"], tags: ["ap", "poke", "burst"], style: "Artillería mágica que castiga desde rango y derriba estructuras.", build: ["Compañera de Luden", "Llamasombría", "Bastón del vacío"], runes: { primary: "Cometa arcano", secondary: "Dominación", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "leona", name: "Leona", roles: ["support"], tags: ["frontline", "engage", "pick"], style: "Bot lane explosiva con engage muy fiable.", build: ["Medallón de los Solari de Hierro", "Promesa de caballero", "Malla de espinas"], runes: { primary: "Posimpacto", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "lulu", name: "Lulu", roles: ["support"], tags: ["ap", "peel", "sustain"], style: "Protección total para un carry de escalado.", build: ["Canción de sangre", "Incensario ardiente", "Redención"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "nautilus", name: "Nautilus", roles: ["support"], tags: ["frontline", "engage", "pick", "peel"], style: "Control punto y clic para bloquear amenazas.", build: ["Medallón de los Solari de Hierro", "Promesa de caballero", "Convergencia de Zeke"], runes: { primary: "Posimpacto", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "nami", name: "Nami", roles: ["support"], tags: ["ap", "poke", "peel", "engage"], style: "Presión de línea y desenganche versátil.", build: ["Canción de sangre", "Incensario ardiente", "Redención"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "braum", name: "Braum", roles: ["support"], tags: ["frontline", "peel", "engage"], style: "Protección de carries y control fiable en peleas.", build: ["Medallón de los Solari de Hierro", "Promesa de caballero", "Convergencia de Zeke"], runes: { primary: "Posimpacto", secondary: "Inspiración", shards: "Velocidad de ataque · Fuerza adaptable · Vida" },
  },
  {
    id: "janna", name: "Janna", roles: ["support"], tags: ["ap", "peel", "poke"], style: "Desenganche y protección para composiciones de escalado.", build: ["Canción de sangre", "Incensario ardiente", "Redención"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "milio", name: "Milio", roles: ["support"], tags: ["ap", "peel", "sustain"], style: "Potencia al carry y limpia control crítico.", build: ["Canción de sangre", "Incensario ardiente", "Redención"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
  {
    id: "zilean", name: "Zilean", roles: ["support"], tags: ["ap", "peel", "poke", "pick"], style: "Control de ritmo y protección decisiva en peleas.", build: ["Canción de sangre", "Incensario ardiente", "Reloj de arena de Zhonya"], runes: { primary: "Invocar a Aery", secondary: "Inspiración", shards: "Fuerza adaptable · Fuerza adaptable · Vida" },
  },
];

function topProfileId(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

type LaneMetaEntry = { name: string; isRip: boolean };
type LaneMetaSnapshot = { roles: Partial<Record<DraftRole, LaneMetaEntry[]>> };
type RiotChampionProfile = {
  dataDragonId: string;
  riotChampionKey: number;
  tags: Champion["tags"];
};
type RiotChampionProfilesSnapshot = { profiles: Record<string, RiotChampionProfile> };

const importedLaneMeta = topMetaSnapshot as LaneMetaSnapshot;
const importedRiotProfiles = riotChampionProfiles as RiotChampionProfilesSnapshot;

function createMetaChampion(name: string, role: DraftRole): Champion {
  const profile = importedRiotProfiles.profiles[topProfileId(name)];
  return {
    id: topProfileId(name),
    name,
    identity: profile ? { dataDragonId: profile.dataDragonId, riotChampionKey: profile.riotChampionKey } : undefined,
    roles: [role],
    tags: profile?.tags ?? [],
    style: `Perfil de ${ROLE_LABELS[role]} sincronizado desde el meta de OP.GG.`,
    build: [],
    runes: {
      primary: "Runas de OP.GG",
      secondary: "Pendiente de sincronizar",
      shards: "Fragmentos de OP.GG",
    },
  };
}

function mergeMetaProfiles() {
  const championsById = new Map(CURATED_CHAMPIONS.map((champion) => [champion.id, { ...champion }]));

  for (const role of DRAFT_ROLES) {
    for (const entry of importedLaneMeta.roles[role] ?? []) {
      if (entry.isRip) continue;

      const id = topProfileId(entry.name);
      const existing = championsById.get(id);
      if (existing) {
        if (!existing.roles.includes(role)) existing.roles = [...existing.roles, role];
        continue;
      }

      championsById.set(id, createMetaChampion(entry.name, role));
    }
  }

  return [...championsById.values()];
}

// Los perfiles curados aportan reglas estratégicas. El snapshot de OP.GG amplía
// detección, selección manual y metadatos de línea para todo campeón activo.
export const CHAMPIONS: Champion[] = mergeMetaProfiles();
