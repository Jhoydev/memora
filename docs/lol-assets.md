# Assets de League of Legends

## Objetivo

DraftLens expone imágenes de League mediante una API interna estable. Los componentes no construyen URLs de Data Dragon ni conocen el parche actual.

Flujo:

`UI -> lolAssets -> /api/lol-assets -> dataDragonAssetProvider -> Riot Data Dragon`

La UI recibe una URL interna. La ruta resuelve los metadatos en servidor y redirige al CDN de Riot. Si el recurso no existe o falla la carga de imagen, `LolAssetImage` muestra un placeholder SVG común.

## Fuente y configuración

- Provider actual: Riot Data Dragon.
- Versión: se consulta en `api/versions.json`; se conserva seis horas en memoria de servidor.
- Metadata de campeones, objetos, runas y hechizos: se conserva veinticuatro horas por versión y locale.
- Locale centralizado: `es_ES` en `DATA_DRAGON_CONFIG` dentro de `src/features/lol-draft/services/data-dragon-assets.service.ts`.
- Las imágenes siguen remotas; no se descargan ni se incluyen en el bundle.

## Uso desde componentes

Usar los wrappers visuales cuando se necesite una imagen:

```tsx
import { ChampionIcon, ItemIcon, RuneIcon, SpellIcon } from "@/features/lol-draft/components/LolAssetImage";

<ChampionIcon champion={{ id: "MonkeyKing", name: "Wukong" }} size={40} />
<ItemIcon item={3078} size={32} />
<RuneIcon rune={8021} size={28} />
<SpellIcon spell="SummonerFlash" size={28} />
<ChampionAbilityIcon ability={{ champion: { name: "Wukong" }, id: "MonkeyKingQ" }} size={28} />
```

Para casos sin UI, usar el resolver seguro para cliente:

```ts
import { lolAssets } from "@/features/lol-draft/services/lol-assets.service";

const source = lolAssets.champion({ key: 62, name: "Wukong" });
```

`ChampionIcon` admite `id`, `key` o `name`. El provider busca primero coincidencias exactas y después nombres normalizados, por lo que cubre diferencias como `MonkeyKing` / `Wukong` o `KSante` / `K'Sante`. Objetos y runas priorizan el ID; el nombre es solo fallback. `ChampionAbilities` obtiene pasiva y Q/W/E/R desde el detalle cacheado del campeón y resuelve sus iconos con la misma API interna. Las runas principal y secundaria recomendadas muestran sus iconos con `RuneIcon` cuando el loadout importado incluye la selección estructurada. Las cards de alternativas y planes de línea también muestran una previsualización de objetos y, si está disponible, runas. Cada objeto y runa visual incluye texto alternativo y tooltip con su nombre.

## Identificadores canónicos e importación

Los datos de producto conservan texto visible para no romper snapshots curados, pero los contratos incluyen referencias estructuradas. `ChampionIdentity` guarda `dataDragonId` y `riotChampionKey`; objetos, runas y hechizos conservan su ID oficial junto al nombre. Las funciones de servidor `getDataDragonItemReference`, `getDataDragonRuneReference` y `getDataDragonSummonerSpellReference` convierten importaciones basadas en nombre a referencias canónicas desde el catálogo vigente de Data Dragon.

El endpoint de detalle de campeón devuelve además de iconos: identidad canónica, pasiva, descripciones, tooltip, coste, alcance y enfriamiento de cada habilidad. El cliente local conserva `itemID` del inventario como `itemReferences`, sin retirar el arreglo legacy `items` hasta completar la migración de todos los snapshots.

## Añadir un recurso o provider

1. Definir la referencia tipada en `domain/lol-assets.types.ts`.
2. Añadir el método al contrato `LolAssetProvider` y al proveedor Data Dragon.
3. Exponer la URL interna desde `lolAssets` y validarla en la route handler.
4. Si necesita UI, añadir un wrapper sobre `LolAssetImage`; no duplicar manejo de `onError`.

Para usar CommunityDragon o assets locales en el futuro, implementar el mismo contrato `LolAssetProvider` y cambiar el provider usado por la route handler. Los componentes y las llamadas a `lolAssets` permanecen sin cambios.
