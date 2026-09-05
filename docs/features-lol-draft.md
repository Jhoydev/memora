# DraftLens LoL

## Objetivo

DraftLens LoL ayuda a tomar una decision rapida durante el champion select de League of Legends. La persona usuaria registra picks aliados y rivales, elige la linea que quiere jugar y recibe tres recomendaciones explicables junto con una build y runas base.

## Alcance actual

- Funciona localmente con Safari y Chrome en macOS.
- Detecta el cliente local de League of Legends y sincroniza picks y bans durante Champion Select cada dos segundos.
- Cuando League elimina el endpoint de Champion Select al entrar en "últimos detalles", conserva la última composición válida durante dos minutos y la identifica como tal para evitar recomendaciones contra un tablero vacío.
- Durante una partida, conserva el draft hasta cuatro horas y usa el Live Client local para mostrar el tiempo, oro, inventario y siguiente objeto pendiente de la build seleccionada.
- Durante una partida, compara al jugador con el rival de su misma posición y genera un plan en vivo para apertura, fase de líneas, transición o macro. La lectura usa nivel, CS, KDA y valor visible del inventario; nunca se presenta como probabilidad de victoria.
- Durante Champion Select, el tablero rival no muestra líneas ni selectores: agrupa los campeones detectados en orden de pick con estado `rol oculto`; usa tanto `theirTeam` como las acciones de pick bloqueadas del draft para no ocultarlos. Las líneas rivales solo se presentan cuando el Live Client las confirma en partida.
- Detecta por nombre cualquier campeón expuesto por los assets locales de League.
- Incluye un pool curado de perfiles estratégicos para top, jungla, mid, ADC y support.
- El recomendador usa un pool personal configurable: top (Gnar, Malphite, Sett, Aurelion Sol, K'Sante, Poppy, Galio y Zaahen), jungla (Nocturne, Malphite, Shyvana y Evelynn), ADC (Jinx, Lucian, Sivir y Samira) y support (Braum, Janna, Milio y Zilean).
- Aurora forma parte del pool de top y mid, e Illaoi del pool de top; ambos picks se sincronizan desde el cliente local.
- Los picks detectados fuera del pool curado se muestran por nombre con un estado de guía no disponible; no influyen todavía en el cálculo de sinergias y counters.
- No requiere cuenta ni claves de terceros para las consultas de meta.
- Durante Champion Select, la app consulta el MCP publico de OP.GG desde el servidor local para recuperar build y runas del campeon activo. Solo solicita los campos estrictamente necesarios y guarda cada resultado diez minutos.
- El snapshot local de cada linea incluye el meta completo (tier, ranking, win rate, pick rate, ban rate y KDA) y se actualiza con `npm run sync:opgg:meta`. El ranking da un ajuste moderado a las recomendaciones y se muestra junto a los picks de su linea.
- La build local se muestra de inmediato mientras OP.GG responde. Si la consulta falla o el campeon no tiene datos, el pool curado sigue siendo el respaldo.
- Las recomendaciones son deterministas y explicables: separan fuerza de meta, perfil de daño, necesidades de composición, sinergia de composición, condición de victoria, respuesta rival, matchup de línea y penalización por redundancia.
- Los picks rivales sin rol confirmado cuentan en las señales globales de composición, build, runas y hechizos. No se emplean como matchup directo de top hasta que League confirma su línea en partida.
- Durante Champion Select, quien juega puede marcar un pick rival detectado como `posible Top`. Esta hipótesis adapta la variante de build, el inicio y los planes de línea para ese matchup; nunca modifica el score global de prioridad ni se presenta como una posición confirmada. Al entrar en partida, el rol publicado por League sustituye la hipótesis.
- Si el pick activo puede jugar Top, la app ofrece planes de línea separados de la build de composición: un plan seguro sin rival confirmado y una variante condicional por cada campeón detectado que también pueda jugar Top. Elegir un plan aplica su build y runas, pero no afirma que ese campeón vaya a ocupar la línea.
- Los planes de Top y el coaching en partida comparten un playbook de matchup. Una ficha específica, por ejemplo contra Darius o Aurora, aporta una ventana de intercambio, una conducta que evitar y un ajuste según ventaja; cuando falta ficha, el sistema declara un consejo por arquetipo (poke/burst o duelo sostenido) en vez de fingir precisión por campeón.
- Los perfiles importados sin etiquetas tácticas pueden usar un catálogo explícito de amenazas de Top para activar respuestas de línea verificables. El catálogo complementa, pero no sobrescribe, las etiquetas de los perfiles curados.
- Los assets visuales usan Riot Data Dragon a través de una API interna. La UI no conoce parches ni URLs de CDN; consulta `lolAssets` o los iconos reutilizables del módulo.

## Reglas de producto

- Un campeon ya elegido o baneado de forma confirmada en cualquier lado no se puede seleccionar ni recomendar de nuevo. Los bans en curso se muestran como contexto, pero no excluyen candidatos hasta quedar bloqueados.
- Los bans se agrupan por equipo. Si agotan el pool personal de la línea, el recomendador ofrece las mejores opciones legales del meta, marcadas como `Meta`, para no dejar el draft sin salida.
- La card "Tu siguiente pick" se limita al pool personal de la línea cuando existe. Si una línea aún no tiene pool configurado, como Mid, muestra las tres mejores opciones del meta importado y lo identifica explícitamente como tal.
- Si un campeón del pool curado, pero fuera del pool personal, tiene un fit estrictamente superior a la mejor opción personal, la card puede mostrar una única alternativa marcada como `Meta`.
- Elegir una recomendación o seleccionar manualmente un campeón en el tablero aliado lo convierte en el pick activo de la línea. Desde ese momento se ocultan las sugerencias de campeón y se muestran build, runas, summoners y loadouts alternativos para ese campeón y composición.
- La recomendacion debe indicar al menos una razon legible para la decision.
- Cuando el pick local pertenece al pool curado, su card activa muestra su porcentaje de fit calculado sin contar al propio campeón dos veces en la composición.
- El fit de pick y el score de loadout son métricas distintas: el primero mide compatibilidad del campeón con ambos equipos; el segundo ordena alternativas de build mediante señales de meta, uso y rendimiento. La interfaz las etiqueta por separado.
- Si la linea activa ya tiene un pick local, la card central deja de ofrecer sustitutos y muestra el fit de ese campeón. Las alternativas se consultan al cambiar a una linea sin pick.
- Build y runas incluyen hechizos de invocador recomendados, con ajustes contra dive, burst, pick y sustain rival.
- Los campeones con perfiles locales usan loadouts cerrados: cada build se muestra solo con sus runas compatibles. El selector puntúa las variantes según el rival y marca la mejor, por ejemplo Camille con Garras y objetos defensivos contra burst o Mordekaiser con Conquistador y Liandry contra frontline.
- Las alternativas de loadout son seleccionables. La mejor alternativa de meta se activa inicialmente, pero la persona usuaria puede activar otra y la cabecera actualiza de forma conjunta build, runas y score de ese loadout; la selección se conserva mientras no cambie el campeón o la línea.
- `npm run sync:opgg:pool` obtiene un snapshot de estadísticas, objetos de inicio, botas, core build, continuaciones de cuarto/quinto/sexto objeto, runas, counters y sinergias de cada campeón del pool personal por línea.
- Los loadouts de OP.GG se generan desde el snapshot y mantienen emparejada la página de runas que OP.GG devuelve para ese campeón y línea. Las continuaciones de objetos se puntúan por uso y victoria; los loadouts curados condicionales conservan prioridad cuando responden a la composición rival.
- El dataset de top incluye todos los campeones activos del snapshot de meta de OP.GG. Sus matchups directos se aplican al fit de recomendaciones de top cuando el rival se detecta, con un ajuste limitado para no anular la composición completa.
- El dataset de campeones incluye todos los perfiles activos del snapshot de meta de OP.GG en top, jungla, mid, ADC y support. Los campeones flexibles se deduplican y acumulan sus líneas válidas; los perfiles curados mantienen sus etiquetas tácticas y son los únicos que entran por defecto en el pool personal.
- `npm run sync:opgg:all-champions` descarga de forma incremental builds, runas, estadísticas y matchups para cada pareja campeón/línea aún ausente. Cada ejecución procesa hasta `64` perfiles, persiste cada ocho peticiones, deduplica por pareja campeón/línea y se puede repetir hasta completar el snapshot sin duplicar entradas.
- El snapshot ampliado tiene prioridad al construir loadouts. Por eso un campeón reconocido fuera del pool curado, como un mid o jungla importado desde el meta, recibe su build y runas OP.GG en lugar del fallback vacío.
- Las continuaciones de OP.GG se normalizan contra el core de la build: un objeto repetido no se muestra dos veces. La identidad visual combina nombre y posición como defensa adicional ante datos históricos.
- Una alternativa de OP.GG debe expresar una decisión tácticamente distinta. Si, después de normalizar objetos repetidos, conserva la misma build y las mismas runas que el core u otra alternativa, se descarta aunque la fuente tenga un score estadístico diferente.
- Los selectores de campeón usan un diálogo con búsqueda, iconos, tier y win rate. La lista solo muestra campeones válidos de la línea y bloquea los que ya están escogidos en cualquier lado del draft.
- Si la composición aliada ya tiene frontline o engage, el motor penaliza candidatos redundantes; el tier de meta nunca anula esa penalización.
- El equilibrio AD/AP cuenta fuentes de daño de ambos tipos. Si un equipo tiene más amenazas AP que AD, se prioriza un candidato AD, y viceversa.
- La build y las runas se presentan como una orientacion inicial, no como una fuente de datos de parche en tiempo real.
- Vaciar el draft restablece la seleccion y conserva la linea elegida.
- El token de League solo se lee desde el servidor local a traves del lockfile; nunca llega al navegador.
- Las consultas a OP.GG se hacen desde una ruta local del servidor; el navegador no se conecta directamente al MCP.
- Si el modo entrenamiento no asigna una posicion al jugador y queda una sola linea libre, la app la usa como linea objetivo y para mostrar su pick temporal o confirmado.
- Los iconos deben resolverse con identificadores estables: campeones por `id`/`key`/`name`, objetos y runas por ID, y hechizos por ID o imagen de Data Dragon. Ningún componente debe construir URLs de proveedor.
- La card de pick activo muestra iconos de objetos y hechizos cuando el proveedor puede resolverlos; también obtiene Q/W/E/R desde el detalle del campeón. Los nombres actuales son fallback para datos curados antiguos que todavía no exponen IDs de item o hechizo.
- El modelo de importación separa el texto de presentación de las referencias canónicas: campeones guardan `dataDragonId` y clave numérica Riot, objetos/runas/hechizos guardan su ID cuando la fuente lo expone. Los imports por nombre se enriquecen en servidor con el catálogo Data Dragon, no con tablas manuales en la UI.
- El detalle de campeón incorpora pasiva y los metadatos de Q/W/E/R (descripción, tooltip, coste, alcance y enfriamiento). La interfaz solo usa los iconos y nombres que necesita; análisis y recomendaciones futuras pueden consumir el contrato completo sin volver a consultar la fuente.
- El inventario del Live Client conserva tanto los nombres legacy como `itemReferences` con `itemID`; el recomendador de siguiente objeto prefiere dichas referencias y sigue funcionando con snapshots históricos solo por nombre.

## Score de recomendaciones

- El score de campeón es un índice heurístico de `1` a `99`, no una probabilidad de victoria ni un win rate.
- Cada recomendación conserva factores estructurados con puntos positivos o negativos. La UI usa sus tres aportes positivos principales como explicación y muestra el alcance de información disponible.
- `Encaje de equipo` se usa cuando no hay picks rivales conocidos. Solo evalúa composición aliada, fuerza de meta y atributos del candidato.
- `Encaje de draft parcial` se usa cuando hay picks rivales con rol oculto. Añade respuestas globales, pero no afirma conocer el matchup de línea.
- `Encaje de draft` requiere las cinco posiciones enemigas confirmadas por el Live Client en partida.
- El perfil de daño distingue físico, mágico y verdadero. Los perfiles curados que tienen daño híbrido o verdadero relevante lo declaran explícitamente; el resto se infiere de sus etiquetas `ad` y `ap` sin inventar una distribución numérica.
- Las capacidades de composición se derivan de las etiquetas existentes: por ejemplo, `split` produce presión lateral, `dive` produce acceso a objetivos y `frontline` aporta control y objetivos. Esto permite cubrir necesidades sin introducir una base manual masiva.
- La redundancia tiene rendimientos decrecientes: la primera frontline adicional se penaliza poco y la tercera se penaliza más. El tier de meta nunca borra esa penalización.
- El matchup estadístico de OP.GG solo se aplica a Top cuando `enemyBoard.top` está confirmado. Los rivales de otras líneas y los picks de Champion Select con rol oculto únicamente afectan las respuestas globales.
- Las sinergias actuales son de composición, no estadísticas: combinan engage aliado, acceso a objetivos y presión lateral. Las sinergias de win rate por pareja permanecen fuera del motor hasta contar con una fuente versionada y validada.
- Los perfiles importados desde OP.GG se enriquecen con el catálogo versionado de Riot Data Dragon. Sus clases amplias aportan señales prudentes como frontline, AP, AD, sustain, burst o peel; los perfiles curados conservan prioridad para conceptos específicos de kit como engage, split o acceso a objetivos.

## Sincronización incremental

- La pantalla consulta el snapshot LCU cada dos segundos y recalcula de forma pura con el snapshot más reciente recibido.
- La sincronización no inicia una nueva consulta mientras una anterior sigue en curso, evitando que una respuesta lenta sobrescriba un draft posterior.
- Al entrar en partida, el mismo snapshot de `allgamedata` alimenta composición, inventario y coaching. No se realiza una segunda lectura duplicada en el mismo ciclo.
- Si el cliente no responde, la UI comunica el estado de conexión y conserva la última composición válida según el TTL documentado.

## Coaching en partida

- El rival de línea se identifica únicamente cuando el Live Client publica una posición igual a la del jugador. Si no existe esa confirmación, se entrega un plan seguro con confianza baja.
- En modos como Entrenamiento, donde Live Client puede omitir la posición del jugador, se infiere únicamente si queda exactamente un rol aliado libre y el campeón activo es compatible con él. La fuente se marca como `inferred` y la confianza no puede ser alta. En Ranked continúa teniendo prioridad absoluta la posición publicada por League.
- El estado de línea se calcula con cuatro factores acotados para evitar que una señal aislada domine: diferencia de nivel (`±36`), CS ajustado por minuto (`±24`), impacto de KDA (`±24`) y valor visible de inventario (`±30`). El resultado interno queda limitado a `-100..100`.
- Tras calcular el estado, el coach combina la postura con la ficha del matchup confirmado. Por ello una desventaja contra Darius y una contra Aurora comparten la prioridad de reducir pérdidas, pero indican riesgos y ventanas de juego diferentes.
- Los estados son: ventaja dominante (`>=35`), ventaja (`>=14`), igualado (`-13..13`), desventaja (`<=-14`) y desventaja crítica (`<=-35`). La UI presenta el estado y sus factores, no el número interno.
- Una histéresis de cinco puntos conserva el estado anterior cerca de cada umbral. Así una variación mínima entre snapshots no alterna el consejo cada dos segundos; cambiar de rival o fase reinicia esta estabilización.
- Fases: apertura antes del minuto 5, línea hasta el 14, transición hasta el 20 y macro desde el 20. Después del minuto 14 el consejo deja de asumir que el duelo de línea es el objetivo principal.
- El valor de inventario usa el coste total de Data Dragon. Si no puede resolverse, usa el precio expuesto por Live Client y baja la confianza de la lectura. Es valor visible comprado, no oro total: el oro enemigo sin gastar no está disponible.
- La ruta de compra en vivo parte siempre del loadout que la persona haya seleccionado. El motor puede adelantar botas defensivas por daño físico, daño mágico o control rival, y decide si van antes o después del primer objeto según la postura actual; no sustituye silenciosamente la variante ni sus runas.
- La ruta incluye tres niveles de decisión: compra inicial, próximo objeto completo y componente prioritario para el oro disponible. El inicio procede de OP.GG cuando existe; en ausencia de ese dato se deriva de campeón, runas, rival y postura. Las recetas y los costes se resuelven desde Riot Data Dragon mediante una ruta interna.
- Cada objeto completo detectado en el inventario se marca como comprado y el primer objeto ausente pasa a ser el siguiente objetivo. La ruta se vuelve a calcular con cada snapshot del Live Client, por lo que responde a compras, fase de partida y cambios estabilizados de ventaja.
- El sistema no inventa el oro enemigo ni el estado de tienda. Para el jugador propio sí recomienda el primer componente alcanzable con el oro observable; componentes ya comprados y consumibles adicionales siguen siendo una mejora futura.
- Los consejos no afirman conocer estado de la oleada, ubicación del jungla, visión completa ni cooldowns enemigos. Las acciones se redactan como condiciones seguras, no como órdenes basadas en información oculta.
- El plan en vivo identifica el aliado y el enemigo con mayor ventaja visible usando nivel, KDA, valor de inventario y CS con peso reducido para no comparar roles como si tuvieran la misma economía esperada. La UI muestra las señales usadas, una acción de apoyo o focus y un posible ajuste defensivo de build; no los presenta como una predicción de victoria ni como información completa del mapa.
- Referencias de diseño: documentación oficial de Riot Live Client Data API, `NexusHero/LOLRecommender` para comparación jugador-rival y disparadores por eventos, `Open-League-Overlay` para estimación de valor visible, y `kyfuse/league-win-predictor` para las familias de variables de estado. DraftLens usa un motor determinista explicable porque todavía no dispone de un dataset propio calibrado para afirmar probabilidades.

## Enriquecimiento de campeones

- `npm run sync:riot:champion-profiles` descarga el catálogo oficial de Riot Data Dragon y genera `riot-champion-profiles.json` con identidad canónica y clases para todos los campeones.
- La conversión a tags estratégicos es deliberadamente conservadora: Tank aporta frontline; Mage, AP; Marksman, AD, daño sostenido y respuesta contra tanques; Fighter, AD y sustain; Assassin, AD, burst y dive; Support, peel.
- No se infieren engage, split push, poke o matchup por clase amplia. Esas propiedades continúan en el dataset curado o deben incorporarse mediante una fuente verificable.

## UX y responsive

- En escritorio, ambos equipos enmarcan las recomendaciones para leer la composicion de un vistazo.
- En movil, las tres areas se apilan sin ocultar informacion ni requerir una aplicacion nativa.
- Los controles de campeón usan búsqueda modal accesible para mantener la selección rápida con el dataset ampliado en Safari y móvil.
- El nombre del campeon seleccionado tiene prioridad sobre las descripciones secundarias en anchos reducidos.

## Proxima iteracion sugerida

Conectar una fuente versionada de datos de Riot o de estadisticas de parche para actualizar el pool, items y runas sin cambiar la interfaz.
