# Plan de implementación: historial de rivales y aprendizaje por enfrentamientos

## Estado del documento

- Estado: listo para ejecutar por otro agente.
- Fecha de auditoría: `2026-09-05`.
- Alcance: nuevo módulo `opponent-history` integrado con DraftLens LoL.
- Objetivo: reconocer, una vez que League revele la identidad en partida, si el usuario ya se enfrentó a ese jugador; resumir resultados por rol y matchup; y adaptar el plan de juego usando únicamente partidas verificadas.
- Este documento es un plan. No implica que el módulo esté implementado.

## Conclusión de la auditoría de datos

La aplicación **no dispone hoy de datos suficientes para calcular un historial fiable**. Sí recibe durante la partida buena parte de la materia prima, pero actualmente descarta la identidad del resto de jugadores y no captura un resultado final verificable.

### Datos disponibles actualmente

El adaptador de `src/features/lol-draft/services/lol-client.service.ts` obtiene de Live Client:

- Riot ID visible durante la partida (`riotId`, `riotIdGameName` y, en la respuesta oficial, `riotIdTagLine`).
- campeón, equipo y posición publicada por League
- nivel, KDA, CS y ward score
- objetos e importe visible del inventario
- duración actual de la partida
- jugador local, aliados, enemigos y rival directo cuando el rol está confirmado

El contrato `LivePlayerSnapshot` solo conserva actualmente campeón, rol, equipo y estadísticas. No conserva Riot ID, PUUID, runas, hechizos ni un identificador de participante.

### Datos necesarios que faltan

- `PUUID` estable del usuario y de cada rival
- `matchId` global y deduplicable
- resultado verificado de la partida (`win`)
- cola, parche, fecha de inicio y duración final
- rol final de cada participante
- estadísticas finales y oro final
- timeline para diferencias de oro, experiencia y CS al minuto 10/15
- estado persistente de una sesión pendiente cuando la app o League se cierran
- repositorio de partidas y encuentros

### Decisión de producto

- El historial no se mostrará durante Champion Select: la identidad rival está deliberadamente oculta en esa fase.
- La consulta del historial se activa al comenzar la partida, cuando Live Client publica Riot IDs.
- Los cálculos históricos solo usarán partidas reconciliadas con Match-v5.
- Una captura local sin resultado oficial puede guardarse como `pendiente`, pero no contará en porcentajes ni recomendaciones.
- Nunca se inferirá que dos Riot IDs pertenecen a la misma persona por similitud de nombre.

## Fuentes y límites verificados

- Riot documenta que Live Client ofrece los Riot IDs, campeón, posición y estadísticas de todos los jugadores durante una partida: [Live Client Data API](https://developer.riotgames.com/docs/lol#game-client-api_live-client-data-api).
- Riot recomienda usar PUUID como identificador estable y resolverlo desde Riot ID mediante ACCOUNT-v1: [migración de Summoner Name a Riot ID](https://developer.riotgames.com/docs/lol#summoner-names-to-riot-ids).
- Match-v5 debe ser la fuente de verdad postpartida para match, participantes, resultado y timeline: [Riot API Reference](https://developer.riotgames.com/apis#match-v5).
- Riot acepta herramientas de entrenamiento que muestran el historial propio y estadísticas agregadas, pero prohíbe revelar información de sesión que el jugador no conoce y aplicaciones que dicten decisiones: [política de League of Legends](https://developer.riotgames.com/docs/lol#game-policy).
- La League Client API local no está oficialmente soportada y no garantiza estabilidad. Puede ayudar a detectar transiciones, pero no debe ser la única fuente del resultado: [League Client API](https://developer.riotgames.com/docs/lol#league-client-api).

## Alcance funcional

### Durante la partida

- Detectar el Riot ID de cada rival cuando Live Client lo revele.
- Buscar coincidencias por PUUID en el historial local.
- Mostrar para el rival de línea:
  - número de enfrentamientos totales
  - enfrentamientos en el mismo rol
  - enfrentamientos con la pareja exacta de campeones
  - victorias y derrotas verificadas
  - comportamiento histórico de línea, si existe timeline suficiente
  - nivel de confianza de la lectura
- Integrar una recomendación breve en el `Plan en vivo`, siempre subordinada al matchup actual y al estado real de la partida.

### Después de la partida

- Detectar el paso `in-game -> not-in-game`.
- Mantener una sesión pendiente aunque el cliente o la página se cierren.
- Consultar Match-v5 con reintentos porque la partida puede tardar en aparecer.
- Reconciliar el match correcto y guardarlo de forma idempotente.
- Actualizar automáticamente los resúmenes de cada rival.

### Historial consultable

- Nueva vista con rivales recientes y recurrentes.
- Filtros por rol propio, campeón propio, campeón rival, cola y parche.
- Detalle de un rival con cronología de partidas y desglose por matchup.
- Acción para exportar, importar y borrar todos los datos locales.

## Fuera de alcance inicial

- Identificar rivales antes de que League revele su identidad.
- Crear un MMR, ELO o probabilidad de victoria.
- Analizar el historial público completo de cada rival.
- Afirmar patrones personales con una o dos partidas.
- Recomendar acciones basadas en información oculta, como posición actual del jungla o oro sin gastar.
- Sincronización entre dispositivos. Se prepararán contratos para un backend futuro, pero el primer almacenamiento será local.

## Modelo de dominio propuesto

### `PendingGameSession`

Captura temporal creada al detectar una partida:

```ts
type PendingGameSession = {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  status: "capturing" | "awaiting-match" | "reconciled" | "expired";
  localRiotId: RiotId;
  localPuuid: string | null;
  gameMode: string | null;
  mapNumber: number | null;
  approximateDurationSeconds: number;
  participants: CapturedParticipant[];
  reconciliationAttempts: number;
  nextRetryAt: string | null;
};
```

### `RecordedMatch`

Fuente normalizada e inmutable de una partida verificada:

```ts
type RecordedMatch = {
  schemaVersion: 1;
  matchId: string;
  queueId: number;
  patch: string;
  startedAt: string;
  durationSeconds: number;
  localPuuid: string;
  win: boolean;
  remake: boolean;
  source: "riot-match-v5";
  participants: RecordedParticipant[];
  timeline: LaneCheckpoint[];
  importedAt: string;
};
```

### `RecordedParticipant`

```ts
type RecordedParticipant = {
  puuid: string;
  riotIdSnapshot: RiotId;
  teamId: number;
  championId: number;
  championName: string;
  teamPosition: DraftRole | null;
  roleConfidence: "official" | "unknown";
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  totalDamageToChampions: number;
  visionScore: number;
  itemIds: number[];
  runeIds: number[];
  summonerSpellIds: number[];
};
```

### `OpponentEncounter`

Proyección ligera derivada de `RecordedMatch`, no fuente duplicada:

```ts
type OpponentEncounter = {
  matchId: string;
  opponentPuuid: string;
  opponentRiotIdSnapshot: RiotId;
  myRole: DraftRole | null;
  opponentRole: DraftRole | null;
  isDirectRoleOpponent: boolean;
  myChampionId: number;
  opponentChampionId: number;
  win: boolean;
  laneCheckpoint: LaneCheckpoint | null;
};
```

### Reglas de identidad

- Clave primaria de rival: `PUUID`.
- Riot ID se guarda solo como nombre visible del momento y puede actualizarse.
- Un cambio de Riot ID no crea un rival nuevo si el PUUID coincide.
- Si ACCOUNT-v1 no puede resolver el PUUID, la sesión queda pendiente.
- No agregar estadísticas utilizando únicamente `summonerName` o Riot ID normalizado.

## Captura y reconciliación de partidas

### Flujo principal

1. `LiveGameCaptureService` detecta `status: in-game`.
2. Conserva Riot ID completo, campeón, equipo, posición y tiempo de partida.
3. Resuelve el PUUID local y los PUUID visibles mediante ACCOUNT-v1 desde el servidor.
4. Persiste o actualiza una `PendingGameSession` cada vez que cambia información relevante; no guarda cada polling.
5. Al pasar a `not-in-game`, marca la sesión como `awaiting-match`.
6. `MatchReconciliationService` consulta los match IDs recientes del PUUID local.
7. Descarga candidatos y selecciona el que cumpla simultáneamente:
   - inicio compatible con `startedAt`
   - campeón local coincidente
   - duración aproximada compatible
   - mayoría suficiente de PUUID o campeones capturados coincidentes
8. Descarga match y timeline.
9. Valida con Zod, normaliza y guarda por `matchId` mediante `upsert`.
10. Marca la sesión pendiente como reconciliada.

### Reintentos

- Reintentos sugeridos: `15 s`, `30 s`, `60 s`, `120 s`, `240 s`.
- Ventana máxima automática: `15 minutos` tras finalizar.
- Si no se reconcilia, queda pendiente y se reintenta al siguiente arranque.
- Una respuesta `429` respeta `Retry-After`; no se hacen reintentos agresivos.
- Una partida jamás se elige solo por ser “la más reciente”. Debe superar la validación de identidad y contexto.

### Fallback sin API de Riot

- Guardar la sesión local como pendiente y explicar `Resultado pendiente de verificar`.
- Permitir una confirmación manual de victoria/derrota solo como nota personal separada.
- Una confirmación manual no entra en estadísticas verificadas ni en la fórmula principal.
- No usar el último KDA visible para inventar el resultado.

## Persistencia y arquitectura

### Decisión recomendada

Usar IndexedDB mediante un repositorio asíncrono. Un historial con timelines crecerá demasiado para reescribir un único JSON de `localStorage` y debe poder consultarse por índices.

Flujo obligatorio:

`UI -> queries/mutations -> services -> repository interfaces -> IndexedDB repository`

### Repositorios

```ts
interface OpponentHistoryRepository {
  upsertPendingSession(session: PendingGameSession): Promise<void>;
  listPendingSessions(): Promise<PendingGameSession[]>;
  upsertMatch(match: RecordedMatch): Promise<void>;
  getMatch(matchId: string): Promise<RecordedMatch | null>;
  listEncountersByOpponent(puuid: string): Promise<OpponentEncounter[]>;
  listRecentOpponents(limit: number): Promise<OpponentSummary[]>;
  deleteAll(): Promise<void>;
}
```

### Índices mínimos

- `matches.matchId` único
- `matches.startedAt`
- `encounters.opponentPuuid`
- compuesto: `[opponentPuuid+myRole]`
- compuesto: `[opponentPuuid+myRole+myChampionId+opponentChampionId]`
- `pendingSessions.status`

### Versionado

- Base: `memora-lol-history`.
- Versión inicial de IndexedDB: `1`.
- Cada registro incluye `schemaVersion`.
- Las migraciones deben ser explícitas y probadas.
- Añadir exportación JSON versionada antes de considerar el módulo cerrado.

## Fórmula de análisis histórico

La aplicación debe mostrar primero hechos (`3 partidas, 2 victorias`) y después una lectura suavizada. No se debe presentar un porcentaje bruto de una muestra pequeña como una predicción.

### Selección de muestra

El análisis usa capas de especificidad, sin mezclarlas silenciosamente:

1. mismo rival + mismo rol + mismos dos campeones
2. mismo rival + mismo rol + cualquier campeón
3. mismo rival + cualquier rol, solo como familiaridad general
4. playbook general de matchup ya existente

Solo las capas `1` y `2` pueden modificar el plan de línea. La capa `3` se muestra como contexto y nunca como evidencia de matchup.

### Partidas válidas

- Excluir remakes y partidas de menos de `10 minutos`.
- Ranked Solo/Duo y Flex forman la muestra competitiva principal.
- Normal Draft/Quickplay se muestran en un segmento separado y tienen menor peso si el usuario decide incluirlas.
- Entrenamiento, bots y custom no entran en estadísticas competitivas.
- Si falta `teamPosition`, la partida no aporta al análisis por rol.

### Peso temporal

Las partidas recientes pesan más mediante una semivida de 90 días:

```text
recencyWeight = 0.5 ^ (ageDays / 90)
queueWeight = 1.0 ranked | 0.70 normal | 0 custom/practice
weight = recencyWeight * queueWeight
```

No se mezclan parches antiguos sin indicarlo. La UI debe permitir `parche actual`, `90 días` y `todo el historial`.

### Win rate suavizado

Usar un prior neutral de cuatro partidas para evitar extremos como `100%` tras una victoria:

```text
weightedWins = Σ(weight_i * won_i)
weightedGames = Σ(weight_i)
adjustedWinRate = (weightedWins + 4 * 0.50) / (weightedGames + 4)
```

Se muestran juntos:

- récord real: `2 V - 1 D`
- win rate bruto: `67%`
- tendencia ajustada, solo si aporta contexto
- confianza de la muestra

El `adjustedWinRate` no se etiqueta como probabilidad de ganar la partida actual.

### Rendimiento de línea

Usar el frame del minuto 15 o el último frame anterior si la fase de línea terminó antes. Evitar incluir KDA dos veces: las bajas ya se reflejan parcialmente en oro y experiencia.

```text
goldSignal = clamp(goldDeltaAt15 / 2000, -1, 1)
xpSignal = clamp(xpDeltaAt15 / 1500, -1, 1)
csSignal = clamp(csDeltaAt15 / 35, -1, 1)

laneIndex = 100 * (
  0.50 * goldSignal +
  0.30 * xpSignal +
  0.20 * csSignal
)
```

Interpretación inicial:

- `>= +15`: ventaja de línea observada
- `-14..+14`: línea pareja o inconclusa
- `<= -15`: desventaja de línea observada

Estos umbrales son heurísticos y deben almacenarse en configuración versionada. No deben llamarse “exactos” hasta validarlos con suficientes partidas reales.

### Tamaño efectivo y confianza

Con pesos temporales, usar tamaño efectivo:

```text
effectiveSampleSize = (Σweight_i)² / Σ(weight_i²)
```

- `< 2`: anecdótico; no cambia la recomendación
- `2..<4`: confianza baja; solo añade una advertencia contextual
- `4..<8`: confianza media; puede ajustar el tono del plan
- `>= 8`: confianza alta dentro de este historial personal

La confianza se calcula por segmento exacto. Ocho partidas contra el jugador no equivalen a ocho partidas contra él usando Darius Top.

### Matriz de recomendación

- Línea positiva + resultados positivos: permitir una apertura más proactiva únicamente en ventanas ya soportadas por el playbook del campeón.
- Línea negativa + resultados positivos: recomendar absorber presión y jugar por utilidad/equipo; el historial sugiere que ganar no depende de dominar el duelo.
- Línea positiva + resultados negativos: priorizar conversión de ventaja, resets, visión y objetivos; evitar perseguir más kills.
- Línea negativa + resultados negativos: mantener plan conservador y priorizar variante segura de runas/build si existe.
- Señales contradictorias o confianza insuficiente: conservar el playbook general sin ajuste histórico.

La historia personal nunca puede reemplazar:

- el estado actual de la partida
- la composición actual
- la variante de loadout elegida por el usuario
- las reglas específicas del matchup

Orden recomendado de decisión:

```text
estado actual > matchup específico > composición/build > historial personal > fallback por arquetipo
```

## API y seguridad

- Variables de servidor: `RIOT_API_KEY`, `RIOT_PLATFORM` y `RIOT_REGION`.
- La API key nunca llega al navegador ni se persiste en IndexedDB.
- Crear adaptadores separados:
  - `RiotAccountClient`
  - `RiotMatchClient`
  - `LiveClientGameSource`
- Aplicar timeout, cancelación, caché corta de Riot ID -> PUUID y tratamiento de `403`, `404`, `429` y `5xx`.
- No registrar la API key, headers de autorización ni respuestas completas con identificadores en logs de producción.
- El usuario puede borrar y exportar su historial local.
- Mostrar el Riot ID, no el PUUID, en la interfaz.

## Diseño de UI propuesto

### En `Plan en vivo`

Card compacta visible solo cuando el rival directo está confirmado:

- título: `Ya te enfrentaste a [Riot ID]`
- resumen factual: `3 partidas en Top · 2 V / 1 D`
- matchup exacto: `1 partida: Malphite vs Darius`
- confianza: `Anecdótico`, `Baja`, `Media` o `Alta`
- consejo: una frase derivada de la matriz
- enlace: `Ver historial`

Si no existen partidas:

- `Primer enfrentamiento registrado contra este jugador`.
- Se utiliza exclusivamente el playbook del matchup actual.

Si el PUUID o el match están pendientes:

- `Identidad detectada; historial pendiente de verificar`.
- No mostrar porcentajes.

### Vista `/lol/history`

- resumen de partidas verificadas y pendientes
- listado de rivales por recencia
- búsqueda por Riot ID visible
- filtros de rol y campeón
- indicador claro de tamaño de muestra
- exportar/importar/borrar historial

### Detalle `/lol/history/[opponentPuuid]`

- Riot ID actual y alias vistos anteriormente
- total de encuentros y récord
- desglose por rol
- desglose por pareja de campeones
- diferencias medias al minuto 15
- cronología de partidas verificadas
- explicación de por qué se recomienda un estilo concreto

## Estructura de archivos propuesta

```text
src/features/opponent-history/
  domain/
    opponent-history.types.ts
    opponent-history.schemas.ts
    opponent-history.repository.ts
  repositories/
    indexed-db-opponent-history.repository.ts
  services/
    opponent-history.service.ts
    opponent-history-analysis.service.ts
    match-reconciliation.service.ts
    opponent-history.factory.ts
  queries/
    opponent-history.query-keys.ts
    use-opponent-history-query.ts
    use-reconcile-match-mutation.ts
  components/
    OpponentHistoryInsight.tsx
    OpponentHistoryList.tsx
    OpponentHistoryDetail.tsx

src/features/lol-draft/services/
  riot-account.client.ts
  riot-match.client.ts

src/app/api/riot/
  account/route.ts
  matches/reconcile/route.ts

src/app/lol/history/
  page.tsx
  [opponentPuuid]/page.tsx
```

Antes de implementar, añadir `.agents/opponent-history-agent.md` con ownership del módulo, reglas de identidad, política de datos y orden de decisión.

## Plan de ejecución por fases

### Fase 1. Contratos y fixtures reales

Implementación:

- [ ] Capturar fixtures anonimizados de `allgamedata`, Match-v5 y timeline.
- [ ] Confirmar en una partida real la presencia de `riotIdTagLine` y posiciones finales.
- [ ] Definir tipos y schemas Zod.
- [ ] Definir estados `capturing`, `awaiting-match`, `reconciled` y `expired`.
- [ ] Definir interfaces de repositorio y clientes Riot.

Validación:

- [ ] Los fixtures no contienen API keys ni PUUID reales en el repositorio.
- [ ] Un payload incompleto produce error tipado, no datos parciales silenciosos.
- [ ] Documentar cualquier diferencia entre Entrenamiento, Normal y Ranked.

### Fase 2. Identidad y captura en vivo

Implementación:

- [ ] Ampliar `LiveClientPlayer` con `riotIdTagLine`.
- [ ] Conservar Riot ID en `LivePlayerSnapshot` sin exponer PUUID innecesariamente a componentes.
- [ ] Implementar `RiotAccountClient` para Riot ID -> PUUID.
- [ ] Crear `LiveGameCaptureService` idempotente.
- [ ] Persistir `PendingGameSession` con escrituras limitadas a cambios relevantes.

Validación:

- [ ] Un cambio de Riot ID conserva identidad mediante PUUID.
- [ ] Dos jugadores con nombres parecidos nunca se fusionan.
- [ ] Champion Select no intenta resolver identidades rivales.

### Fase 3. Reconciliación postpartida

Implementación:

- [ ] Implementar Match-v5 IDs, detalle y timeline.
- [ ] Detectar transición de fin de partida.
- [ ] Implementar búsqueda con ventana temporal y validación de roster.
- [ ] Implementar reintentos y recuperación al siguiente arranque.
- [ ] Deduplicar por `matchId`.
- [ ] Marcar remakes y colas excluidas.

Validación:

- [ ] Reabrir la app reconcilia sesiones pendientes.
- [ ] Procesar dos veces el mismo match no duplica encuentros.
- [ ] Una partida reciente distinta no puede asociarse por error.
- [ ] Los errores `429` respetan espera y no pierden la sesión.

### Fase 4. Persistencia e historial

Implementación:

- [ ] Implementar repositorio IndexedDB e índices.
- [ ] Crear proyección de encuentros por rival.
- [ ] Implementar exportación, importación y borrado.
- [ ] Añadir migración versionada.
- [ ] Crear queries y mutations de TanStack Query.

Validación:

- [ ] Historial de al menos 500 partidas no reescribe toda la base por cambio.
- [ ] Exportar e importar conserva match IDs y evita duplicados.
- [ ] Borrar historial requiere confirmación y elimina pendientes y verificadas.

### Fase 5. Motor de análisis

Implementación:

- [ ] Implementar segmentación por rival, rol y campeones.
- [ ] Implementar pesos temporales y por cola.
- [ ] Implementar win rate suavizado.
- [ ] Implementar `laneIndex` con timeline al minuto 15.
- [ ] Implementar tamaño efectivo y confianza.
- [ ] Implementar matriz de recomendación.
- [ ] Integrar el resultado como señal secundaria del coach actual.

Validación:

- [ ] Una sola victoria no produce consejo agresivo ni `100%` concluyente.
- [ ] Una partida en otro rol no modifica el plan de Top.
- [ ] Un remake no afecta estadísticas.
- [ ] Línea ganada con partida perdida recomienda convertir ventaja, no jugar más agresivo sin contexto.
- [ ] Sin timeline se muestran resultados, pero no se inventa rendimiento de línea.

### Fase 6. UI de historial y contexto en vivo

Implementación:

- [ ] Crear insight compacto en `Plan en vivo`.
- [ ] Crear `/lol/history`.
- [ ] Crear detalle por rival.
- [ ] Mostrar estados vacío, pendiente, sin coincidencias y error de API.
- [ ] Añadir filtros y explicación de confianza.
- [ ] Implementar responsive y navegación por teclado.

Validación:

- [ ] La UI diferencia hechos, tendencia ajustada y recomendación.
- [ ] Nunca muestra el PUUID.
- [ ] No hay identificación rival en Champion Select.
- [ ] El consejo histórico no compite visualmente con el estado actual de partida.

### Fase 7. Documentación, privacidad y operación

Implementación:

- [ ] Crear `.agents/opponent-history-agent.md`.
- [ ] Actualizar `docs/codex-project-guide.md`.
- [ ] Actualizar `docs/features-lol-draft.md`.
- [ ] Actualizar `docs/ui-product-rules.md`.
- [ ] Registrar la feature en `docs/memora-mvp-progress-log.md`.
- [ ] Documentar configuración de Riot API, límites, retención y recuperación.
- [ ] Añadir aviso legal de Riot requerido por su política.

Validación:

- [ ] La API key está solo en servidor y `.env.local` no se versiona.
- [ ] Los logs no contienen secretos ni respuestas completas con identificadores.
- [ ] El usuario puede exportar y borrar sus datos.
- [ ] Ejecutar tests, lint y build de producción.

## Estrategia de pruebas

### Unitarias

- normalización de Riot ID
- deduplicación por PUUID y matchId
- segmentación exacta por rol y campeones
- fórmula de pesos, prior, lane index y tamaño efectivo
- clasificación de confianza
- matriz de consejo y fallbacks
- exclusión de remakes y modos no competitivos

### Integración

- Live Client fixture -> sesión pendiente
- sesión pendiente + Account-v1 -> identidades estables
- sesión pendiente + Match-v5 -> match registrado
- caída/reapertura -> reconciliación recuperada
- match registrado -> query de rival -> insight del coach

### Contrato

- fixtures de Account-v1, Match-v5 MatchDto y TimelineDto validados con Zod
- errores `403`, `404`, `429` y `5xx`
- cambios de nombre conservando PUUID
- timeline ausente o más corto de 15 minutos

### UI

- primer encuentro
- rival recurrente con muestra anecdótica
- muestra suficiente y señales coherentes
- señales contradictorias
- partida pendiente de reconciliar
- historial vacío y borrado confirmado

## Criterios de aceptación global

- [ ] Ningún rival se identifica durante Champion Select.
- [ ] PUUID es la única identidad agregable; Riot ID es presentación.
- [ ] Solo partidas Match-v5 verificadas cuentan en estadísticas.
- [ ] Cada match se guarda una sola vez.
- [ ] Se separan mismo rol, otro rol y matchup exacto.
- [ ] Remakes, custom y Entrenamiento no contaminan estadísticas competitivas.
- [ ] La fórmula muestra tamaño de muestra y confianza.
- [ ] Una muestra anecdótica no altera el plan de juego.
- [ ] Sin timeline no se inventa una lectura de línea.
- [ ] El estado actual de partida prevalece sobre el historial.
- [ ] La persona usuaria puede exportar y borrar su historial.
- [ ] Tests, lint y build pasan.
- [ ] Toda regla nueva queda documentada.

## Riesgos y decisiones pendientes

- La API key de desarrollo de Riot caduca y Match-v5 tiene rate limits. La implementación debe tolerar periodos sin credenciales sin perder sesiones pendientes.
- Un rival exacto puede repetirse muy pocas veces; por eso la mayoría de insights serán inicialmente anecdóticos.
- La posición publicada puede ser desconocida en algunos modos. Esas partidas no deben entrar en estadísticas por rol.
- El timeline aumenta almacenamiento y llamadas. Se recomienda persistir solo checkpoints derivados y no el payload completo.
- La fórmula inicial es explicable, pero sus pesos son heurísticos. Deben versionarse y revisarse con un dataset propio antes de afirmar calidad predictiva.
- Antes de distribuir públicamente la aplicación, registrar el producto y revisar de nuevo la política vigente de Riot.

## Orden recomendado para el agente ejecutor

1. No empezar por la UI.
2. Capturar y anonimizar fixtures reales.
3. Cerrar identidad PUUID y reconciliación postpartida.
4. Probar idempotencia y recuperación.
5. Implementar persistencia y hechos históricos.
6. Añadir la fórmula solo cuando los datos verificados estén disponibles.
7. Integrar el insight en el coach y construir la vista de historial.
8. Documentar límites y ejecutar la validación completa.

