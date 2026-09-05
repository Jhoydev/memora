# Bitacora de progreso de Memora MVP

## DraftLens. Assets de Riot Data Dragon

- Fecha de cierre: `2026-09-04`
- Entregable: sistema centralizado y extensible de assets para campeones, objetos, runas, hechizos y pasivas.
- Decisiones: `lolAssets` es la API estable consumida por la UI; una route handler interna delega la resolución a `dataDragonAssetProvider`. El provider consulta la versión más reciente de Data Dragon, centraliza `es_ES` y conserva versión/metadata en caché de servidor. Los componentes usan un fallback SVG único para no repetir manejo de errores de imágenes.
- Reglas de negocio y producto: los campeones pueden llegar desde LCU, OP.GG o datos locales con `id`, `key` o `name`; objetos y runas deben conservar sus IDs cuando estén disponibles. Ninguna pantalla puede construir URLs de Data Dragon ni conocer el parche.
- Archivos principales: `src/features/lol-draft/domain/lol-assets.types.ts`, `src/features/lol-draft/services/lol-assets.service.ts`, `src/features/lol-draft/services/data-dragon-assets.service.ts`, `src/features/lol-draft/components/LolAssetImage.tsx`, `src/app/api/lol-assets/` y `docs/lol-assets.md`.
- Validación: `npm run lint`, `npm test` (19 archivos, 46 pruebas) y `npm run build` completados correctamente; las pruebas unitarias cubren normalización, URLs, tipos de asset y caché de versión.
- Seguimiento: los adaptadores de OP.GG y LCU deben exponer IDs de objeto/runa/hechizo cuando estén disponibles para habilitar sus iconos sin resolver por nombre.

## DraftLens. Meta de OP.GG

- Fecha de cierre: `2026-09-02`
- Entregable: integración del MCP público de OP.GG para builds y runas del campeón activo en Champion Select.
- Decisiones: el servidor local consulta solo datos de objetos y runas, mantiene una caché de diez minutos y conserva el pool curado como respuesta inmediata y respaldo ante errores.
- Validación: la conexión MCP respondió correctamente; una consulta de Illaoi top devolvió build y runas en español. Se añadió una prueba del adaptador y se ejecutaron lint, tests y build.
- Seguimiento: añadido un snapshot local completo por linea, generado desde `lol_list_lane_meta_champions`, para comparar todos los rivales sin consultas de red en pleno draft.

## Fase 1. Bootstrap y base tecnica

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: dejar el proyecto operativo con la base tecnica comun y el sistema de documentacion incremental.
- Feature entregada:
  - Base tecnica inicial de Memora lista para soportar features de producto sin acoplar UI y persistencia
- Entregables completados:
  - Proyecto `Next.js` inicializado con `npm`, App Router, `TypeScript` y `src/`
  - `Tailwind CSS` activo
  - `shadcn/ui` inicializado
  - Dependencias base de query, formularios, validacion, iconos y motion instaladas
  - `QueryClientProvider` integrado en `src/app/providers.tsx`
  - `queryClient` compartido creado en `src/lib/query/query-client.ts`
  - Estructura base de `features/`, `components/shared/` y `lib/` creada
  - `AppError`, `LocalStorageClient`, utilidades de fecha e ID, y `STORAGE_KEYS` creados
  - Documentacion inicial persistida en `docs/`
- Decisiones tecnicas:
  - Se usa `npm` como gestor principal
  - `shadcn/ui` queda configurado desde Fase 1 con estilo `base-nova`
  - La home del starter se reemplazo por una portada temporal alineada con Memora
  - La documentacion de seguimiento vive dentro del repo para que pueda evolucionar junto al codigo
- Reglas de negocio y producto:
  - La aplicacion debe poder evolucionar de `localStorage` a API sin reescribir pantallas
  - La documentacion debe crecer junto con el producto, fase por fase
  - Cada fase terminada debe detener el flujo y pedir confirmacion antes de continuar
- Archivos o modulos principales afectados:
  - `package.json`
  - `components.json`
  - `src/app/layout.tsx`
  - `src/app/providers.tsx`
  - `src/app/page.tsx`
  - `src/lib/query/query-client.ts`
  - `src/lib/errors/app-error.ts`
  - `src/lib/storage/local-storage.client.ts`
  - `src/lib/storage/storage-keys.ts`
  - `docs/memora-mvp-execution-plan.md`
  - `docs/memora-mvp-progress-log.md`
- Validaciones realizadas:
  - Scaffold inicial completado sin errores
  - Inicializacion de `shadcn/ui` completada
  - Dependencias base instaladas correctamente
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
- Problemas encontrados:
  - Ningun bloqueo funcional; el scaffold base incluyo archivos starter que hubo que sustituir
- Deuda tecnica o pendientes:
  - Empezar la capa de dominio en Fase 2
- Recomendacion para la siguiente fase:
  - Avanzar con `StudyTopic`, `Flashcard`, `StudySessionResult` y los schemas Zod para fijar los contratos antes de persistencia real

## Fase 2. Dominio y contratos

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: definir el modelo estable del dominio y los contratos de datos antes de implementar persistencia y servicios concretos.
- Feature entregada:
  - Modelo base de topics, flashcards y resultados de estudio listo para soportar CRUD y sesiones de estudio
- Entregables completados:
  - `StudyTopic` creado en `src/features/topics/domain/topic.types.ts`
  - `Flashcard` creada en `src/features/flashcards/domain/flashcard.types.ts`
  - `StudySessionResult` creado en `src/features/study/domain/study.types.ts`
  - Schemas Zod de topics y flashcards creados con sus tipos inferidos de creacion y actualizacion
  - Interfaces `TopicRepository` y `FlashcardRepository` creadas con firmas asincronas
  - Cierre tipado para errores iniciales mediante `APP_ERROR_CODES` y `AppErrorCode`
- Decisiones tecnicas:
  - Los tipos de dominio incluyen siempre `id`, `createdAt` y `updatedAt` para mantener consistencia entre implementaciones
  - Los inputs de actualizacion se modelan como `partial` para alinear formularios y futuras mutaciones PATCH-like
  - Los contratos de repositorio permanecen asincronos incluso para `localStorage` para facilitar migracion a backend sin cambiar hooks ni componentes
  - Los codigos de error se mantienen centralizados en la capa compartida en vez de duplicarse por feature
- Reglas de negocio y producto:
  - Un tema de estudio siempre debe tener nombre y color
  - Una flashcard siempre pertenece a un tema mediante `topicId`
  - Una flashcard siempre debe tener frente y reverso
  - El resultado de estudio debe distinguir entre tarjetas sabidas y no sabidas
  - La capa de dominio debe reflejar reglas del producto y no detalles de almacenamiento
- Archivos o modulos principales afectados:
  - `src/features/topics/domain/topic.types.ts`
  - `src/features/topics/domain/topic.schema.ts`
  - `src/features/topics/repositories/topic.repository.ts`
  - `src/features/flashcards/domain/flashcard.types.ts`
  - `src/features/flashcards/domain/flashcard.schema.ts`
  - `src/features/flashcards/repositories/flashcard.repository.ts`
  - `src/features/study/domain/study.types.ts`
  - `src/lib/errors/app-error.ts`
  - `docs/memora-mvp-execution-plan.md`
  - `docs/memora-mvp-progress-log.md`
- Validaciones realizadas:
  - Revision de coherencia entre tipos de dominio y schemas Zod
  - Confirmacion de firmas asincronas en los contratos de repositorio
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
- Problemas encontrados:
  - Ningun bloqueo funcional en esta fase
- Deuda tecnica o pendientes:
  - Implementar repositorios concretos de topics en la siguiente fase
- Recomendacion para la siguiente fase:
  - Avanzar con `LocalStorageTopicRepository`, `TopicService`, query keys y hooks de topics para cerrar la primera feature persistente

## Fase 3. Persistencia local y servicios de Topics

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: implementar la primera feature persistente del MVP respetando la arquitectura desacoplada y dejando lista la API de datos que consumira la UI.
- Feature entregada:
  - Capa completa de datos de topics con `localStorage`, servicio, seed inicial y hooks de `TanStack Query`
- Entregables completados:
  - `LocalStorageTopicRepository` implementado
  - `TopicService` implementado con validacion, semilla inicial y reglas base
  - `topicService` factory creada
  - `topicQueryKeys` creadas
  - Hooks `useTopicsQuery`, `useTopicQuery`, `useCreateTopicMutation`, `useUpdateTopicMutation` y `useDeleteTopicMutation` creados
  - Seed inicial de topics documentada e implementada
  - Documentacion operativa adicional creada para Codex y para reglas de UI/producto
- Decisiones tecnicas:
  - El repositorio local se apoya en `LocalStorageClient` y `STORAGE_KEYS.TOPICS`
  - La semilla se aplica desde el servicio, no desde la UI, para preservar el contrato futuro
  - La comprobacion de “primer arranque” usa existencia real de la clave en storage, no solo longitud del array
  - Las invalidaciones de cache se concentran en los hooks de mutation
- Reglas de negocio y producto:
  - Un tema invalido no puede crearse ni actualizarse
  - Actualizar un tema exige al menos un cambio efectivo
  - El primer arranque debe mostrar temas semilla para acelerar onboarding y demo
  - Borrar todos los temas no debe reinyectar la semilla automaticamente
  - La UI debe consumir solo hooks de query/mutation y nunca el servicio o storage de forma directa
- Reglas de UI/UX confirmadas:
  - La futura Home debe mostrar estados vacios solo cuando realmente no existan temas y ya no aplique la semilla
  - Las acciones de crear, editar y borrar se apoyaran en feedback de mutation y refresco por invalidacion de cache
  - La experiencia de producto debe mantener claridad entre “datos reales del usuario” y “semilla inicial”
- Archivos o modulos principales afectados:
  - `src/features/topics/repositories/local-storage-topic.repository.ts`
  - `src/features/topics/services/topic.service.ts`
  - `src/features/topics/services/topic-service.factory.ts`
  - `src/features/topics/services/topic.seed.ts`
  - `src/features/topics/queries/topic.query-keys.ts`
  - `src/features/topics/queries/use-topics-query.ts`
  - `src/features/topics/queries/use-topic-query.ts`
  - `src/features/topics/queries/use-create-topic-mutation.ts`
  - `src/features/topics/queries/use-update-topic-mutation.ts`
  - `src/features/topics/queries/use-delete-topic-mutation.ts`
  - `docs/codex-project-guide.md`
  - `docs/ui-product-rules.md`
  - `docs/features-topics.md`
- Validaciones realizadas:
  - Revision de coherencia del flujo `query -> service -> repository`
  - Verificacion de reglas de seed inicial y no-reaparicion tras vaciado manual
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
- Problemas encontrados:
  - Ningun bloqueo funcional en esta fase
- Deuda tecnica o pendientes:
  - Construir la UI de topics y Home en la siguiente fase
- Recomendacion para la siguiente fase:
  - Crear componentes compartidos y de topics reutilizando los hooks ya expuestos y apoyandose en la documentacion de reglas de UI

## Fase 4. UI de Topics y Home

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: convertir la feature de topics en la primera experiencia completa del producto, con CRUD visual y una home lista para demo.
- Feature entregada:
  - Home funcional de Memora con listado de topics, creacion, edicion, borrado y estados vacios
- Entregables completados:
  - `PageHeader`, `EmptyState` y `ConfirmDialog` creados como componentes compartidos
  - `TopicForm`, `TopicCard`, `TopicGrid` y `TopicsHomeScreen` implementados
  - Home `/` conectada a hooks reales de topics
  - Modales de crear y editar implementados con `Dialog`
  - Confirmacion de borrado implementada con `AlertDialog`
  - Documentacion especifica de la pantalla Home creada
- Decisiones tecnicas:
  - Se reutilizo `shadcn/ui` como base para `Dialog`, `AlertDialog`, `Card`, `Input`, `Label` y `Badge`
  - El formulario usa `react-hook-form` + `zodResolver` y recibe `onSubmit` externo
  - La vista previa visual del topic vive en el formulario y no requiere persistencia
  - La home es un client component dedicado que orquesta queries, mutations y estado de modales
- Reglas de negocio y producto:
  - La home trata los topics como puerta de entrada al producto
  - Crear y editar se hacen en modal para mantener el contexto
  - El borrado siempre pide confirmacion
  - Si el usuario vacia su biblioteca, debe ver un empty state claro y accionable
  - La UI no debe hacer parecer que flashcards o estudio ya estan implementados en esta fase
- Reglas de UI/UX confirmadas:
  - Existe un CTA primario unico: `Nuevo tema`
  - Las tarjetas de topic deben comunicar identidad visual antes que densidad de datos
  - La experiencia base debe verse luminosa, optimista y claramente de producto
  - El formulario ofrece preview de color e icono antes de guardar
  - La grid degrada correctamente entre movil, tablet y escritorio
- Archivos o modulos principales afectados:
  - `src/app/page.tsx`
  - `src/components/shared/PageHeader.tsx`
  - `src/components/shared/EmptyState.tsx`
  - `src/components/shared/ConfirmDialog.tsx`
  - `src/features/topics/components/TopicForm.tsx`
  - `src/features/topics/components/TopicCard.tsx`
  - `src/features/topics/components/TopicGrid.tsx`
  - `src/features/topics/components/TopicsHomeScreen.tsx`
  - `src/features/topics/components/topic-ui.constants.tsx`
  - `docs/features-topics.md`
  - `docs/screen-home-topics.md`
  - `docs/ui-product-rules.md`
- Validaciones realizadas:
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
  - Revision de consistencia entre hooks de topics y flujo visual de la home
- Problemas encontrados:
  - Se detecto un warning de React Compiler con `watch()` de `react-hook-form` y se corrigio usando `useWatch`
- Deuda tecnica o pendientes:
  - Construir la capa persistente de flashcards
  - Conectar la futura navegacion hacia detalle de tema
- Recomendacion para la siguiente fase:
  - Replicar el mismo patron de topics para `flashcards`: repositorio local, servicio, factory, query keys y hooks por `topicId`

## Fase 5. Persistencia local y servicios de Flashcards

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: dejar lista la capa de datos de flashcards con consultas por tema y reglas de cascada coherentes con la arquitectura del proyecto.
- Feature entregada:
  - Capa completa de datos de flashcards con persistencia local, servicio y hooks de `TanStack Query` por `topicId`
- Entregables completados:
  - `LocalStorageFlashcardRepository` implementado
  - `FlashcardService` implementado
  - `flashcardService` factory creada
  - `flashcardQueryKeys` creadas
  - Hooks `useFlashcardsByTopicQuery`, `useCreateFlashcardMutation`, `useUpdateFlashcardMutation` y `useDeleteFlashcardMutation` creados
  - Regla de borrado en cascada documentada e integrada en la eliminacion de topics
  - Documentacion especifica de la feature de flashcards creada
- Decisiones tecnicas:
  - La consulta principal de flashcards se concentra en `findByTopicId`
  - `FlashcardService` valida el input y comprueba existencia del topic antes de crear una tarjeta
  - La limpieza en cascada se resuelve desde `TopicService` usando `deleteByTopicId`
  - La mutation de borrado de topic ya limpia tambien la cache de flashcards asociada
- Reglas de negocio y producto:
  - No puede existir una flashcard sin tema asociado
  - No se puede crear una flashcard para un topic inexistente
  - La coleccion de flashcards debe mantenerse aislada por tema
  - Borrar un topic debe poder borrar tambien sus tarjetas sin depender de una pantalla concreta
- Reglas de UI/UX confirmadas:
  - La futura pantalla de detalle de topic debe renderizar una coleccion perteneciente solo al `topicId` actual
  - Los mensajes de error deben seguir hablándose en espanol claro
  - La UI de tarjetas debe tratar el tema como contexto primario, no como campo secundario
- Archivos o modulos principales afectados:
  - `src/features/flashcards/repositories/local-storage-flashcard.repository.ts`
  - `src/features/flashcards/services/flashcard.service.ts`
  - `src/features/flashcards/services/flashcard-service.factory.ts`
  - `src/features/flashcards/queries/flashcard.query-keys.ts`
  - `src/features/flashcards/queries/use-flashcards-by-topic-query.ts`
  - `src/features/flashcards/queries/use-create-flashcard-mutation.ts`
  - `src/features/flashcards/queries/use-update-flashcard-mutation.ts`
  - `src/features/flashcards/queries/use-delete-flashcard-mutation.ts`
  - `src/features/topics/services/topic.service.ts`
  - `src/features/topics/services/topic-service.factory.ts`
  - `src/features/topics/queries/use-delete-topic-mutation.ts`
  - `docs/features-flashcards.md`
- Validaciones realizadas:
  - Verificacion de coherencia entre `topicId`, servicio y repositorio local
  - Revision de reglas de cascada entre topics y flashcards
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
- Problemas encontrados:
  - Ningun bloqueo funcional en esta fase
- Deuda tecnica o pendientes:
  - Implementar la pantalla de detalle de topic y el CRUD visual de flashcards
- Recomendacion para la siguiente fase:
  - Reutilizar el patron de la Home de topics para construir `/topics/[topicId]` con modales de crear, editar y borrar flashcards

## Fase 6. UI de detalle de tema y CRUD de flashcards

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: convertir la feature de flashcards en una experiencia navegable y operable desde el detalle de un tema concreto.
- Feature entregada:
  - Pantalla `/topics/[topicId]` con colección visual de flashcards, CRUD en modales y CTA hacia estudio
- Entregables completados:
  - `FlashcardForm`, `FlashcardPreview` y `FlashcardGrid` implementados
  - `TopicDetailScreen` implementado
  - Ruta `src/app/topics/[topicId]/page.tsx` creada
  - Navegación desde tarjetas de topic de Home hacia detalle activada
  - Estado de tema inexistente, colección vacía, carga y errores resueltos
  - Documentación específica de la pantalla de detalle creada
- Decisiones tecnicas:
  - El detalle es un client component dedicado que orquesta `useTopicQuery`, `useFlashcardsByTopicQuery` y mutations
  - El formulario de flashcards usa `react-hook-form` con `zodResolver` y recibe `onSubmit` externo
  - El CTA hacia estudio se muestra ya en el detalle, pero deshabilitado y rotulado como siguiente fase
  - Se reutilizan componentes compartidos existentes para mantener consistencia entre Home y detalle
- Reglas de negocio y producto:
  - El detalle siempre trabaja sobre un solo `topicId`
  - Las flashcards mostradas pertenecen solo al tema actual
  - Si el tema no existe, el flujo debe detenerse con un estado explicativo y retorno a Home
  - La pantalla debe preparar el paso natural de organizar tarjetas antes de estudiar
- Reglas de UI/UX confirmadas:
  - El contexto visual del topic se mantiene visible en el encabezado y bloques de resumen
  - Crear y editar flashcards se resuelve en modal para no romper el flujo
  - El empty state de la colección empuja a crear la primera tarjeta
  - La experiencia mantiene la dirección luminosa y de producto ya establecida en Home
- Archivos o modulos principales afectados:
  - `src/app/topics/[topicId]/page.tsx`
  - `src/features/flashcards/components/TopicDetailScreen.tsx`
  - `src/features/flashcards/components/FlashcardForm.tsx`
  - `src/features/flashcards/components/FlashcardPreview.tsx`
  - `src/features/flashcards/components/FlashcardGrid.tsx`
  - `src/features/topics/components/TopicCard.tsx`
  - `docs/features-flashcards.md`
  - `docs/screen-topic-detail.md`
  - `docs/ui-product-rules.md`
- Validaciones realizadas:
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
  - Verificación de la ruta dinámica `/topics/[topicId]`
- Problemas encontrados:
  - La implementación actual de `Button` no soporta `asChild`; se sustituyeron esos puntos por `Link` estilizado con `buttonVariants`
- Deuda tecnica o pendientes:
  - Implementar la ruta y flujo real de estudio
- Recomendacion para la siguiente fase:
  - Construir `/topics/[topicId]/study` reutilizando el mismo contexto de tema y las flashcards ya disponibles por `topicId`

## Fase 7. Modo estudio

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: cerrar el flujo principal del MVP permitiendo estudiar las flashcards de un tema en una sesión ligera y enfocada.
- Feature entregada:
  - Modo estudio funcional con reveal de respuesta, marcado sabida/no sabida y resumen final
- Entregables completados:
  - `StudyService` implementado
  - `useStudySession` implementado
  - `StudyProgress`, `StudyCard`, `StudySummary` y `StudyScreen` implementados
  - Ruta `src/app/topics/[topicId]/study/page.tsx` creada
  - CTA desde detalle de tema conectada al estudio cuando hay tarjetas disponibles
  - Documentación específica de la feature y de la pantalla de estudio creada
- Decisiones tecnicas:
  - El estudio se mantiene en memoria y no persiste histórico
  - La lógica de sesión se encapsula en un hook dedicado y un servicio puro de apoyo
  - El resumen final se deriva del estado de respuestas, no de almacenamiento externo
  - El flujo se reinicia localmente con `restartSession`
- Reglas de negocio y producto:
  - Solo se estudia un tema a la vez
  - Cada tarjeta se marca como `known` o `unknown`
  - La respuesta se revela solo después de una acción explícita
  - Si no hay tarjetas, el flujo vuelve a empujar hacia el detalle del tema
  - El resumen final debe orientar el siguiente repaso y no funcionar como nota punitiva
- Reglas de UI/UX confirmadas:
  - Se muestra una tarjeta por vez
  - La decisión de resultado aparece solo tras revelar la respuesta
  - El progreso visible reduce sensación de pérdida dentro de la sesión
  - La experiencia mantiene continuidad visual con Home y Topic Detail, pero con foco más concentrado
- Archivos o modulos principales afectados:
  - `src/app/topics/[topicId]/study/page.tsx`
  - `src/features/study/domain/study.types.ts`
  - `src/features/study/services/study.service.ts`
  - `src/features/study/hooks/use-study-session.ts`
  - `src/features/study/components/StudyProgress.tsx`
  - `src/features/study/components/StudyCard.tsx`
  - `src/features/study/components/StudySummary.tsx`
  - `src/features/study/components/StudyScreen.tsx`
  - `src/features/flashcards/components/TopicDetailScreen.tsx`
  - `docs/features-study.md`
  - `docs/screen-study.md`
- Validaciones realizadas:
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
  - Verificación de la ruta dinámica `/topics/[topicId]/study`
- Problemas encontrados:
  - `eslint` marcó un reinicio de estado dentro de un `effect`; se simplificó el hook para inicializar la sesión sin ese patrón
- Deuda tecnica o pendientes:
  - Pulir motion, responsive fino y microinteracciones globales del MVP
- Recomendacion para la siguiente fase:
  - Enfocar la Fase 8 en polish visual transversal, consistencia final y experiencia de demo

## Fase 8. Pulido visual y UX

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: consolidar una identidad visual consistente, mejorar motion y dejar el MVP con una experiencia de demo realmente pulida.
- Feature entregada:
  - Sistema visual transversal del MVP con reveals consistentes, superficies reutilizables y flip 3D en estudio
- Entregables completados:
  - Utilidades visuales globales añadidas en `src/app/globals.css`
  - Componente compartido `Reveal` implementado
  - Home, Topic Detail y Study alineados con motion y composición consistente
  - Flip 3D de la tarjeta de estudio implementado con `Framer Motion`
  - Documento `docs/visual-system.md` creado
- Decisiones tecnicas:
  - El sistema visual se formaliza con clases utilitarias `memora-*` en vez de duplicar estilos de pantalla en pantalla
  - `Reveal` concentra la animación de entrada para evitar variaciones arbitrarias entre vistas
  - El flip 3D se limita al modo estudio, donde sí aporta significado al flujo
- Reglas de negocio y producto:
  - El polish debe mejorar comprensión y foco, no solo “verse bonito”
  - La experiencia de demo debe sentirse coherente de Home a Study sin romper identidad
  - El gesto de revelar respuesta debe sentirse intencional y alineado con la recuperación activa
- Reglas de UI/UX confirmadas:
  - Los fondos ya no son planos: usan gradiente y retícula suave como atmósfera común
  - Las superficies claras y oscuras se reutilizan con roles definidos
  - Las entradas animadas deben ser sutiles y consistentes
  - La tarjeta de estudio merece el gesto de flip; otros flujos no necesitan sobreanimación
- Archivos o modulos principales afectados:
  - `src/app/globals.css`
  - `src/components/shared/Reveal.tsx`
  - `src/features/topics/components/TopicsHomeScreen.tsx`
  - `src/features/flashcards/components/TopicDetailScreen.tsx`
  - `src/features/study/components/StudyCard.tsx`
  - `src/features/study/components/StudyScreen.tsx`
  - `docs/visual-system.md`
  - `docs/ui-product-rules.md`
  - `.agents/ui-agent.md`
- Validaciones realizadas:
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
  - Verificación de rutas Home, Topic Detail y Study tras el polish
- Problemas encontrados:
  - Ningun bloqueo funcional en esta fase
- Deuda tecnica o pendientes:
  - Cerrar testing del MVP para proteger los flujos críticos
- Recomendacion para la siguiente fase:
  - Enfocar la Fase 9 en tests de storage, servicios, hooks, formularios y flujo de estudio

## Fase 9. Testing

- Fecha de cierre: `2026-05-09`
- Objetivo de la fase: validar de forma automatizada las capas críticas del MVP sin convertir el proyecto en una suite pesada de mantener.
- Feature entregada:
  - Infraestructura de testing ligera y suite base para storage, repositorios, servicios, hooks, formulario y smoke del flujo principal
- Entregables completados:
  - `Vitest` configurado
  - `Testing Library` y `jsdom` configurados
  - `LocalStorageClient` cubierto
  - repositorios locales de topics y flashcards cubiertos
  - servicios de topics, flashcards y study cubiertos
  - hook `useStudySession` cubierto
  - mutation `useCreateTopicMutation` cubierta
  - `TopicForm` cubierto
  - smoke test de flujo principal añadido
  - guía de testing creada
- Decisiones tecnicas:
  - La suite usa `Vitest` por ligereza y velocidad
  - Se priorizó cobertura de lógica y flujos críticos antes que snapshots o E2E pesados
  - Se añadió `query-test-utils` para probar hooks de React Query sin duplicar setup
- Reglas de negocio y producto cubiertas por tests:
  - storage seguro con fallbacks y errores controlados
  - creación, actualización y borrado local de topics y flashcards
  - validaciones de actualización vacía
  - prohibición de crear flashcards para temas inexistentes
  - conteo final de resultados de estudio
  - envío correcto del formulario principal de topics
- Archivos o modulos principales afectados:
  - `vitest.config.ts`
  - `src/test/setup.ts`
  - `src/test/query-test-utils.tsx`
  - `src/lib/storage/local-storage.client.test.ts`
  - `src/features/topics/repositories/local-storage-topic.repository.test.ts`
  - `src/features/flashcards/repositories/local-storage-flashcard.repository.test.ts`
  - `src/features/topics/services/topic.service.test.ts`
  - `src/features/flashcards/services/flashcard.service.test.ts`
  - `src/features/study/services/study.service.test.ts`
  - `src/features/study/hooks/use-study-session.test.tsx`
  - `src/features/topics/queries/use-create-topic-mutation.test.tsx`
  - `src/features/topics/components/TopicForm.test.tsx`
  - `src/app/app-flow.smoke.test.tsx`
  - `docs/testing-guide.md`
- Validaciones realizadas:
  - `npm test` ejecutado correctamente con `10` archivos y `23` tests verdes
  - `npm run lint` ejecutado correctamente
  - `npm run build` ejecutado correctamente
- Problemas encontrados:
  - Un test de repositorio dependía de timestamps en el mismo milisegundo; se volvió más robusto eliminando esa suposición
- Deuda tecnica o pendientes:
  - No hay E2E completos ni pruebas visuales
  - La cobertura de formularios y mutations de flashcards puede ampliarse si el producto crece
- Recomendacion para la siguiente fase:
  - El plan MVP queda cerrado; a partir de aquí conviene decidir entre backend real, E2E o mejoras de producto

## Fase 10. DraftLens LoL

- Fecha de cierre: `2026-09-02`
- Objetivo de la fase: convertir la entrada principal en un asistente simple de draft de League of Legends, usable desde Mac.
- Feature entregada:
  - Draft por lineas para equipo aliado y rival, recomendaciones explicables, builds y runas base.
- Entregables completados:
  - Feature aislada en `src/features/lol-draft/` con dominio, datos locales, servicio puro y pantalla cliente.
  - Motor de recomendacion que valora equilibrio AD/AP, frontline, engage, peel, dive, poke y dano contra tanques.
  - UI responsive compatible con navegadores modernos de macOS.
  - Pruebas del motor para priorizacion contra dive y exclusion de campeones bloqueados.
  - Documento de producto `docs/features-lol-draft.md` y reglas de UX actualizadas.
- Decisiones tecnicas:
  - El pool y las builds son datos curados locales para que la primera version no dependa de APIs ni cuentas.
  - La logica vive en un servicio puro y se puede conectar a datos versionados de parche mas adelante.
- Deuda tecnica o pendientes:
  - No hay actualizacion automatica de builds, runas o disponibilidad por parche.
  - Conviene ampliar el pool y sumar estadisticas reales antes de usarlo como referencia competitiva.
  - La integracion con League busca la instalacion estandar de macOS; debe ampliarse con deteccion de rutas configurables para otras instalaciones.

### Ajuste posterior: picks rivales sin linea

- Fecha: `2026-09-03`
- Se amplia el adaptador local del cliente de League para recuperar picks rivales tanto desde `theirTeam` como desde las acciones de pick bloqueadas del draft.
- Cuando League no comunica una linea rival, la interfaz muestra el campeon como "linea sin confirmar" en lugar de ocultarlo o asignarle un rol incorrecto.
- Validaciones: `npm test` con `15` archivos y `39` tests, `npm run lint` y `npm run build` correctos.
- La fase final de League puede eliminar el endpoint de Champion Select antes de abrir la partida. Se conserva el último snapshot válido durante dos minutos con estado "Última composición del draft" para impedir que el tablero se vacíe en esa transición.
- Durante una partida se conserva el draft hasta cuatro horas y se consulta el Live Client local para mostrar el próximo objeto de la build a partir del oro y el inventario actuales.

### Snapshot de datos OP.GG del champion pool

- Fecha: `2026-09-03`
- Ejecutado `npm run sync:opgg:pool` para generar `src/features/lol-draft/data/opgg-champion-pool.json`.
- El snapshot contiene `20` perfiles: `8` de top, `4` de jungla, `4` de ADC y `4` de support, con estadísticas de línea, objetos de inicio, botas, core builds, continuaciones de objetos, runas, counters y sinergias.
- Los loadouts generados desde OP.GG emparejan siempre los objetos con las runas verificadas para la misma línea; los perfiles locales contra composición rival siguen siendo la prioridad táctica.
- Mid queda pendiente de poblar cuando se defina su champion pool.

### Dataset completo de top

- Fecha: `2026-09-03`
- Añadido `npm run sync:opgg:top-champions`, con guardado incremental y reanudable, para sincronizar los `59` tops activos del snapshot de OP.GG.
- Los tops se reconocen en el tablero y sus matchups directos contra el rival de línea ajustan el fit de los candidatos de top.

### Enriquecimiento canónico de datos League

- Fecha: `2026-09-04`
- Objetivo: preparar los datos importados para reconciliación entre el cliente de Riot, Data Dragon y snapshots de OP.GG sin retirar los fallbacks legibles existentes.
- Entregables completados:
  - Identidad de campeón con `dataDragonId` y clave numérica de Riot.
  - Referencias estructuradas para objetos, runas, fragmentos y hechizos de invocador.
  - Conversores de servidor que resuelven nombres de imports contra el catálogo vigente de Data Dragon.
  - Detalle de campeón con pasiva y metadatos completos de Q/W/E/R.
  - Inventario Live Client con `itemID` en paralelo a los nombres legacy.
- Decisiones técnicas:
  - La migración es aditiva: los campos de texto siguen funcionando para snapshots antiguos hasta que todos los importadores proporcionen IDs.
  - La normalización se ejecuta en servicios de servidor; componentes y reglas de recomendación no consultan directamente catálogos remotos.
  - Los IDs de hechizos recomendados se incluyen en el resultado determinista porque corresponden a los identificadores estables publicados por Data Dragon.
- Validaciones realizadas:
  - Se amplía la suite de Data Dragon para identidad, pasiva, metadatos de habilidad y referencias canónicas.
- Riesgos o pendientes:
  - Los snapshots de OP.GG actuales exponen nombres de objetos y runas, por lo que se enriquecen al importarlos; una sincronización futura debe persistir también los IDs resueltos.
  - Falta incorporar el contexto de parche, región, rango y fecha de captura como metadatos del snapshot de OP.GG.
- Recomendación: consumir las referencias canónicas en la próxima versión del sincronizador OP.GG y usar los metadatos de habilidad en una vista de detalle o análisis de matchup.

### Expansión de dataset League por líneas

- Fecha: `2026-09-04`
- Objetivo: reconocer y permitir seleccionar los campeones activos de todas las líneas, no solo los perfiles curados y el dataset de top.
- Entregables completados:
  - Los perfiles del snapshot de OP.GG se materializan para top, jungla, mid, ADC y support.
  - Los campeones flexibles se deduplican en una sola entidad con múltiples líneas válidas.
  - Nuevo comando `npm run sync:opgg:all-champions` para importar incrementalmente build, runas, estadísticas y matchups de las parejas campeón/línea faltantes.
- Decisiones técnicas:
  - Los datos importados solo añaden detección y selección hasta tener etiquetas tácticas verificadas; el pool personal curado sigue controlando las recomendaciones por defecto.
  - El sincronizador persiste cada dos consultas para que una caída de red no obligue a reiniciar cientos de importaciones.
- Riesgos o pendientes:
  - Las etiquetas tácticas de perfiles importados siguen vacías hasta que se clasifiquen de forma verificable; no se infieren automáticamente a partir de la build.
- Validación de datos:
  - Se actualizó el snapshot de meta con `267` entradas de línea y se generó el snapshot detallado deduplicado de campeón/línea para el adaptador de loadouts.
- Recomendación: incorporar etiquetas tácticas desde una fuente estructurada antes de abrir el recomendador a un pool personal más amplio.

### Fallback de recomendaciones para Mid

- Fecha: `2026-09-04`
- Problema: Mid tenía un array de pool personal vacío, que el recomendador trataba como restricción absoluta y dejaba la card sin opciones.
- Decisión: una línea sin pool configurado usa las tres mejores opciones del meta importado y la interfaz lo declara como "meta de la línea"; las líneas con pool personal no cambian su comportamiento.
- Validación: test de recomendación para un pool vacío añadido al servicio puro.

### Normalización de builds OP.GG

- Fecha: `2026-09-04`
- Problema: algunas continuaciones de OP.GG repetían un objeto ya incluido en el core, como Malla de espinas para Shen.
- Decisión: el adaptador deduplica objetos por nombre normalizado y conserva su primer lugar en la secuencia; la UI nunca corrige ni oculta datos por sí sola.
- Validación: test de una continuación con objeto repetido añadido al parser de loadouts.

### Assets de runas recomendadas

- Fecha: `2026-09-04`
- Entregable: la card de build muestra iconos de la página principal/secundaria y de cada runa recomendada cuando OP.GG entrega `runeSelection` estructurada.
- Decisión: los fragmentos permanecen en texto, ya que no son runas del catálogo de Data Dragon. Los perfiles legacy siguen usando el fallback textual sin bloquear la card.

### Flujo de recomendación y pick activo

- Fecha: `2026-09-04`
- Regla de producto: el pool personal es la fuente principal de candidatos; solo un campeón externo con fit superior puede aparecer como `Meta`.
- Regla de interacción: una elección manual o una card de recomendación confirma el pick aliado y cambia la aplicación a las recomendaciones de loadout del campeón seleccionado.
- Resultado: la app separa explícitamente la fase de decidir campeón de la fase de decidir build, runas y summoners, incluidas sus alternativas tácticas.

### Claridad entre fit y score de loadout

- Fecha: `2026-09-04`
- Problema: la UI etiquetaba como `fit` tanto el encaje del campeón en el draft como el score de alternativas OP.GG, haciendo parecer que valores como 71% y 86% se contradecían.
- Decisión: el pick muestra `fit de pick`; las builds muestran `score de loadout` y `meta`, con una explicación contextual de ambas métricas.

### Selección manual de loadout

- Fecha: `2026-09-04`
- Regla de producto: la mejor variante de meta es el valor inicial, no una elección forzosa. La persona usuaria puede seleccionar cualquier loadout táctico disponible.
- Resultado: la alternativa activa actualiza en la cabecera su build, runas y score asociados, permitiendo priorizar por ejemplo una configuración tanque de Garras frente a una variante AP con Cometa.

### Alternativas de loadout no redundantes

- Fecha: `2026-09-04`
- Problema: OP.GG podía asignar scores diferentes al core y a una continuación que, tras quitar un objeto repetido, quedaban con la misma build y runas.
- Decisión: el parser descarta loadouts con la misma firma de build, página de runas y fragmentos. Las cards solo aparecen cuando muestran una alternativa real que se puede elegir.

### Etiqueta de build responsive

- Fecha: `2026-09-04`
- Ajuste: la etiqueta de la variante activa deja de tener un ancho máximo. Conserva el texto en una sola línea y se recoloca íntegra bajo el título `Build` cuando el panel es estrecho.

### Bans del Champion Select

- Fecha: `2026-09-04`
- Objetivo: impedir recomendaciones inválidas y aportar contexto de draft al incorporar los bans del cliente local de League.
- Entregables completados:
  - El adaptador LCU extrae acciones de tipo `ban`, resuelve sus nombres y distingue bans aliados, rivales y pendientes.
  - Los bans confirmados se muestran bajo cada tablero y se excluyen del selector manual y del motor de recomendaciones.
  - Un ban pendiente se informa sin bloquear candidatos hasta que League lo confirma.
  - Si los bans dejan vacío el pool personal, se muestran tres opciones legales de meta marcadas como `Meta`.
- Decisiones técnicas:
  - Los bans solo son un filtro de disponibilidad; no se usan para inferir el rol rival ni la intención táctica del equipo que baneó.
  - El snapshot conserva los bans junto con los picks durante la transición a partida, igual que la composición final.
- Validaciones realizadas:
  - Se añadieron pruebas del filtro de bans y del fallback de meta cuando el pool queda agotado.
- Riesgos o pendientes:
  - Los bans de campeones aún no presentes en el catálogo local se muestran por nombre, pero no requieren filtrado adicional porque no pueden ser candidatos del recomendador actual.

### Composición rival sin roles durante el draft

- Fecha: `2026-09-04`
- Problema: Champion Select puede revelar el campeón rival sin revelar su línea. La interfaz lo listaba fuera del panel de rivales y el motor lo omitía del cálculo.
- Decisión: los campeones se agrupan dentro del panel rival como composición detectada con `rol oculto`; no se asignan artificialmente a Top, Jungla, Mid, ADC o Support.
- Regla de producto: esos picks alimentan las señales globales de composición para picks, loadouts y hechizos. El ajuste de matchup de top queda reservado al rival cuya línea haya sido confirmada.
- Validación: prueba añadida para verificar que un rival sin rol, como Nocturne, cambia la prioridad hacia una respuesta de peel para ADC.

### Tablero rival acorde al Champion Select

- Fecha: `2026-09-04`
- Problema: la UI reutilizaba las cinco filas de rol del equipo aliado para el rival, dando a entender que League revelaba posiciones enemigas antes de la partida.
- Decisión: en Champion Select y en el snapshot reciente, Rivales usa una lista no editable en orden de pick con roles ocultos. El adaptador deja de convertir `theirTeam` en un tablero por línea durante esa fase.
- Regla de producto: la vista rival por posiciones solo se habilita en partida, cuando el Live Client confirma la posición. Hasta entonces, las decisiones usan exclusivamente señales globales de composición.

### Planes de línea condicionales para Top

- Fecha: `2026-09-04`
- Objetivo: separar la build de composición general de las variantes que dependen del posible rival de línea cuando sus posiciones permanecen ocultas durante Champion Select.
- Entregables completados:
  - Nuevo servicio que genera un plan seguro y planes condicionales para cada rival detectado que pueda jugar Top.
  - Las cards de plan aplican de forma conjunta su build y runas a la recomendación superior.
  - Malphite ofrece, por ejemplo, su frontline contra AD si Darius puede ir Top y poke AP si Aurora puede ocupar esa línea.
- Regla de producto: un plan condicional nunca confirma un rol rival. Permite preparar la variante, mientras el plan seguro mantiene una decisión válida hasta que el matchup se revele.
- Decisión de datos: Darius se incorpora al catálogo táctico de fallback como amenaza AD de sustain y frontline, porque su perfil importado aún no expone etiquetas. Aurora utiliza sus etiquetas existentes de AP, poke, burst y dive.

### Previews visuales en recomendaciones

- Fecha: `2026-09-04`
- Entregable: las alternativas de loadout y los planes de línea incluyen iconos de sus objetos y, cuando el import contiene referencias estructuradas, de sus runas.
- Decisión: las cards reutilizan el proveedor interno Data Dragon existente, resolviendo por ID y usando nombre como fallback. No incorporan URLs de assets ni catálogos duplicados en la UI.

### Identificación de iconos en recomendaciones

- Fecha: `2026-09-04`
- Entregable: los objetos y runas de previews y recomendaciones principales muestran un tooltip con su nombre al pasar el cursor.
- Accesibilidad: los wrappers de assets reciben texto alternativo específico en lugar de una etiqueta genérica, y el atributo `title` ofrece un fallback nativo para el nombre.
- Validaciones realizadas:
  - Pruebas para planes seguro, Darius y Aurora con Malphite, además de la exclusión de campeones que no juegan Top.

### Auditoría y motor explicable de DraftLens

- Fecha: `2026-09-04`
- Objetivo: corregir los riesgos detectados en la auditoría del ranking de campeones sin sustituir el motor determinista existente.
- Entregables completados:
  - El score ahora conserva factores estructurados para fuerza de meta, daño, necesidades, sinergia de composición, condición de victoria, respuesta rival, matchup y redundancia.
  - Se introdujeron perfiles de daño físico, mágico y verdadero para Camille, Gwen, Sett y K'Sante; el resto mantiene una inferencia conservadora desde `ad` y `ap`.
  - La composición deriva capacidades de los tags existentes, incluyendo presión lateral, split push, acceso a objetivos, control, daño sostenido y objetivos.
  - El matchup estadístico de Top queda limitado exclusivamente al rival en `enemyBoard.top` confirmado por el Live Client.
  - La interfaz diferencia encaje de equipo, draft parcial y draft completo; muestra escala `/100` en lugar de un porcentaje de probabilidad.
  - El polling del cliente evita solicitudes concurrentes para impedir que una respuesta lenta reemplace un estado posterior.
- Decisiones técnicas:
  - No se incorporó una base manual masiva ni ML. Los perfiles importados sin tags permanecen explícitamente incompletos hasta que se enriquezcan con una fuente verificable.
  - Las sinergias nuevas son de composición, no estadísticas por pareja; se mantienen trazables y testeables.
- Validaciones realizadas:
  - Añadidas pruebas para alcance de matchup exclusivo de Top y para los estados de encaje de equipo/draft parcial.
  - Ejecutados `npm test` con `58` pruebas y `npm run lint` correctamente.
- Pendientes:
  - Enriquecer de forma incremental los perfiles tácticos importados y añadir sinergias estadísticas solo tras elegir una fuente versionada por parche.

### Enriquecimiento masivo con Riot Data Dragon

- Fecha: `2026-09-04`
- Entregable: snapshot versionado de `173` campeones de Riot Data Dragon (`16.17.1`) para enriquecer los perfiles importados de OP.GG.
- Decisión: se traducen únicamente las clases oficiales amplias a tags prudentes. Los perfiles curados siguen prevaleciendo y ninguna clase genérica inventa engage, split push o counter directo.
- Resultado: un rival detectado e importado como Darius ya contribuye a las señales globales de frontline, daño AD y sustain, además de conservar su matchup estadístico de Top cuando la línea se confirma.

### Presentación de prioridad de recomendación

- Fecha: `2026-09-04`
- Problema: la píldora `Encaje de equipo` ocupaba demasiado espacio y hacía que el valor pareciera una métrica técnica o una probabilidad.
- Decisión: las cards muestran `Prioridad`, el valor `/100` como dato dominante y un contexto compacto de composición o draft debajo.
- Regla: el indicador mantiene el alcance de información disponible sin competir visualmente con el campeón ni presentar una certeza sobre la partida.
- Ajuste posterior: el valor conserva el formato porcentual solicitado (`83%`) en lugar de una escala `/100`; `Prioridad` y el contexto siguen aclarando que no es win rate.

### Densidad de runas y summoners

- Fecha: `2026-09-04`
- Decisión: los iconos con tooltip son la representación principal de runas, objetos y hechizos. Sus nombres se ocultan cuando existe una referencia visual estructurada.
- Fallback: perfiles legacy sin selección estructurada y fragmentos de runas conservan texto, porque no hay icono canónico suficiente para identificarlos.

### Reorganización de columnas del pick activo

- Fecha: `2026-09-04`
- Problema: Summoners ocupaba una tercera columna completa aunque solo contiene dos iconos.
- Decisión: el detalle usa dos columnas equilibradas para Build y Runas; Summoners vive en la cabecera de Runas como información auxiliar compacta.
- Resultado: más ancho útil para objetos y runas, sin espacio vertical desperdiciado en escritorio ni pérdida de tooltips.

### Coaching en partida y planes adaptativos

- Fecha: `2026-09-04`
- Objetivo: continuar el análisis después de Champion Select y orientar cómo jugar según ventaja o desventaja observable.
- Entregables completados:
  - El Live Client incorpora nivel, CS, KDA, muerte, inventario y posición de todos los jugadores.
  - El rival directo se resuelve por posición confirmada al comenzar la partida.
  - Nuevo motor puro que clasifica apertura, línea, transición y macro, con planes agresivos, controlados o defensivos.
  - Histéresis temporal de cinco puntos para evitar cambios visuales inestables cerca de los umbrales.
  - La card `Plan en vivo` expone factores concretos, confianza, acciones recomendadas y un riesgo que evitar.
  - La sincronización reutiliza una sola lectura de `allgamedata` por ciclo.
- Decisiones técnicas:
  - Se adoptó un score determinista con factores acotados en vez de una falsa probabilidad de victoria sin modelo calibrado.
  - El oro rival se representa como valor visible de inventario usando costes totales de Data Dragon y nunca como oro total exacto.
  - La falta de rival confirmado produce un plan seguro de confianza baja en vez de una asignación especulativa.
- Validaciones realizadas:
  - Pruebas de fases, límites de factores, desventaja crítica y fallback sin rival.
  - `63` pruebas, lint y build de producción ejecutados correctamente.
- Pendientes:
  - Añadir historial de eventos para explicar tendencias y cambios bruscos sin convertir el coaching en una predicción opaca.

### Fallback de rol para modo Entrenamiento

- Fecha: `2026-09-04`
- Problema: Live Client detectaba a Camille pero devolvía su posición vacía en Entrenamiento, impidiendo emparejarla con Darius Top pese a disponer del resto de estadísticas.
- Decisión: inferir el rol propio solo si queda una única posición aliada libre y el campeón activo es compatible con ella. Los roles confirmados por Ranked siempre prevalecen y nunca se infiere el rol rival.
- Transparencia: el jugador queda marcado con `roleSource: inferred` y el coaching limita la confianza a estimación parcial.
- Validación real: en la partida activa se identificó Camille Top contra Darius Top y se recibieron correctamente nivel, CS, KDA y valor de inventario de ambos.
- Validaciones automáticas: `67` pruebas y lint completados correctamente.
- Ajuste de UI: el oro disponible se redondea hacia abajo para evitar decimales internos del Live Client.

### Reubicación del asistente en partida

- Fecha: `2026-09-04`
- Problema: siguiente compra y plan en vivo estaban dentro de la columna de build/runas, alargando toda la fila y dejando un gran vacío en la identidad azul del campeón.
- Decisión: mover ambas superficies a una banda de ancho completo inmediatamente después del resumen principal y antes de las alternativas de loadout.
- Jerarquía: la compra inmediata usa el bloque estrecho; el plan adaptativo recibe el ancho principal y mantiene visibles estado, factores y acciones.
- Responsive: la banda se apila en móvil y usa una proporción aproximada `1/3 + 2/3` desde escritorio.

### Ruta de compra adaptativa en vivo

- Fecha: `2026-09-05`
- Objetivo: convertir el único `Siguiente objetivo` en una secuencia explicable que cambie con la situación de partida.
- Entregables completados:
  - La ruta conserva el loadout seleccionado y marca objetos completos como `Comprado`, `Siguiente` o pendiente.
  - Las botas mejoradas pueden adelantarse contra daño físico, daño mágico o control; el rival de línea recibe más peso que el resto del equipo.
  - Una postura defensiva prioriza supervivencia antes del núcleo, mientras una postura agresiva mantiene primero el pico ofensivo.
  - Cada actualización de inventario y del plan en vivo vuelve a calcular automáticamente el orden restante.
- Decisiones técnicas:
  - El motor es puro, determinista y reutiliza los snapshots ya disponibles; no añade otra consulta al cliente.
  - No se cambia la pareja de build y runas elegida. Los ajustes situacionales se insertan en su ruta de objetos.
  - El alcance actual se limita a objetos completos y botas mejoradas; componentes, consumibles y backs exactos quedan fuera hasta disponer de un modelo de tienda más completo.
- Validaciones realizadas:
  - Pruebas para botas de armadura al ir por detrás contra daño físico, avance tras una compra y conservación del núcleo cuando se juega con ventaja.
  - Suite completa con `70` pruebas, lint y build de producción ejecutados correctamente.
  - Se corrigió el contrato TypeScript del rol inferido de Entrenamiento que impedía completar el build de producción.
- Riesgos o pendientes:
  - Ampliar el catálogo de respuestas situacionales más allá de botas y modelar componentes por umbrales reales de oro.

### Hipótesis de rival Top y compra por componentes

- Fecha: `2026-09-05`
- Entregables completados:
  - En Champion Select, los picks rivales compatibles con Top se pueden marcar como `posible Top` o devolver a `Top sin confirmar`.
  - La hipótesis recalcula loadout, inicio y plan de línea sin confundirla con una posición detectada por League ni modificar la prioridad global de campeón.
  - Las importaciones de OP.GG preservan ahora objetos de inicio y botas junto al core de cada loadout.
  - La ruta viva muestra el inicio, el objeto completo objetivo, el componente prioritario alcanzable y la cadena de componentes procedente de Riot Data Dragon.
- Decisiones técnicas:
  - Las recetas se resuelven en servidor desde Data Dragon mediante una API local, con validación del conjunto de objetos solicitado.
  - La elección de componente prioriza armadura o resistencia mágica al jugar defensivo y componentes de ritmo, como Brillo, cuando el plan no requiere estabilizarse.
- Validaciones realizadas:
  - Añadidas pruebas para objetos de inicio de OP.GG y para iniciar Guantelete de hielo con Armadura de tela ante una línea física y defensiva.
  - Suite completa con `71` pruebas, lint y build de producción ejecutados correctamente.

### Playbook de matchups de línea

- Fecha: `2026-09-05`
- Objetivo: evitar que el plan en vivo repita una plantilla genérica para rivales tácticamente distintos.
- Entregables completados:
  - Playbook reutilizable con fichas específicas para Darius, Aurora, Gnar y Camille, más ajustes por pareja para Malphite y Camille.
  - Fallback explícito por arquetipo para poke/burst y duelo sostenido cuando un rival aún no tiene ficha individual.
  - El plan de draft y el coaching en partida muestran el contexto del matchup y usan una acción y riesgo adaptados a postura.
- Regla de producto:
  - Una ficha específica no equivale a una predicción: orienta la ventana de intercambio y el riesgo principal. Las estadísticas en vivo continúan determinando si jugar agresivo, controlado o defensivo.
- Validaciones realizadas:
  - Suite completa con `73` pruebas, lint y build de producción ejecutados correctamente.

### Prioridades visibles de equipo en partida

- Fecha: `2026-09-05`
- Objetivo: ayudar a decidir a qué aliado apoyar, qué rival respetar o enfocar y qué respuesta de build considerar durante una partida.
- Entregables completados:
  - El coaching identifica el aliado y el enemigo con mayor ventaja visible en el snapshot actual.
  - Cada prioridad explica nivel, CS, KDA y valor visible de inventario, además de una acción de equipo.
  - El enemigo prioritario puede proponer resistencia mágica, armadura/vida o un ajuste por daño y control según sus etiquetas tácticas.
- Decisiones técnicas:
  - El cálculo pondera nivel, impacto KDA e inventario; el CS tiene peso reducido porque las expectativas económicas cambian por rol.
  - La salida se llama `ventaja visible`, no poder real ni probabilidad de victoria: no conoce oro sin gastar, visión, enfriamientos o ubicación.
- Validaciones realizadas:
  - Añadida prueba de selección de aliado/enemigo y respuesta de build contra una amenaza AP.
  - Suite completa con `74` pruebas, lint y build de producción ejecutados correctamente.
- Pendientes:
  - Incorporar eventos y objetivos confirmados por League cuando el Live Client los exponga de forma estable.
