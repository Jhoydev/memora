# Plan de ejecucion y documentacion por fases para Memora MVP

## Estado global

- Fase actual: `Fase 6. UI de detalle de tema y CRUD de flashcards`
- Ultima fase cerrada: `Fase 5. Persistencia local y servicios de Flashcards`
- Ultima actualizacion: `2026-05-09`
- Regla operativa: al cerrar cada fase se actualiza este archivo y `docs/memora-mvp-progress-log.md`, y despues se pide confirmacion explicita antes de continuar.

## Resumen

Se construye **Memora** como MVP funcional sobre `Next.js`, con arquitectura desacoplada entre UI, queries, servicios y repositorios, y con documentacion incremental obligatoria por fase.

## Regla documental ampliada

- Cada fase debe documentar no solo cambios tecnicos, sino tambien la feature entregada desde la perspectiva de producto.
- Cada cierre de fase debe incluir reglas de negocio y reglas de producto descubiertas o confirmadas durante la implementacion.
- Si una fase introduce comportamiento visible para usuario, debe quedar descrito en terminos funcionales, no solo en nombres de archivos o componentes.
- La bitacora debe dejar claro que decisiones son tecnicas, cuales son de negocio y cuales afectan UX o producto.

## Fase 1. Bootstrap y base tecnica

Implementacion:
- [x] Inicializar proyecto `Next.js` con `npm`, App Router, `TypeScript` y `src/`
- [x] Configurar `Tailwind CSS`
- [x] Instalar y configurar `shadcn/ui`
- [x] Instalar `@tanstack/react-query`, `react-hook-form`, `zod`, `framer-motion`, `lucide-react`
- [x] Crear `src/app/providers.tsx`
- [x] Crear `src/lib/query/query-client.ts`
- [x] Integrar providers en `src/app/layout.tsx`
- [x] Crear estructura base de carpetas por features
- [x] Crear `AppError`
- [x] Crear utilidades de storage, IDs y fechas
- [x] Definir `STORAGE_KEYS` versionadas

Documentacion:
- [x] Registrar decisiones de bootstrap y dependencias elegidas
- [x] Documentar estructura inicial de carpetas
- [x] Documentar proposito de `providers`, `query-client` y utilidades compartidas
- [x] Anotar comandos base usados para crear el proyecto
- [x] Registrar validaciones ejecutadas para confirmar que la app arranca
- [x] Registrar la feature tecnica entregada y sus reglas base de producto

Cierre de fase:
- [x] Confirmar que la app levanta sin errores
- [x] Actualizar plan y bitacora
- [x] Preguntar al usuario si desea continuar con Fase 2

Notas:
- `shadcn/ui` quedo inicializado con estilo `base-nova` y `baseColor` neutral.
- La home temporal ya representa el proyecto Memora en lugar del starter de Next.
- La estructura `src/features/*` queda creada para avanzar por dominio sin rehacer base.
- Validaciones confirmadas: `npm run lint` y `npm run build`.
- Comandos base utilizados:
  - `npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes`
  - `npm install @tanstack/react-query react-hook-form zod @hookform/resolvers framer-motion lucide-react`
  - `npx shadcn@latest init -d`

## Fase 2. Dominio y contratos

Implementacion:
- [x] Crear `StudyTopic`
- [x] Crear `Flashcard`
- [x] Crear `StudySessionResult`
- [x] Crear `topic.schema.ts`
- [x] Crear `flashcard.schema.ts`
- [x] Exportar `Create*Input` y `Update*Input`
- [x] Crear interfaces `TopicRepository` y `FlashcardRepository`
- [x] Definir errores de dominio iniciales

Documentacion:
- [x] Documentar entidades del dominio y su responsabilidad
- [x] Documentar reglas de validacion Zod
- [x] Documentar por que los repositorios son interfaces asincronas
- [x] Registrar como esta capa prepara la futura migracion a API
- [x] Documentar reglas de negocio y producto fijadas por el modelo de dominio

Cierre de fase:
- [x] Validar coherencia entre tipos, schemas y contratos
- [x] Actualizar plan y bitacora
- [x] Preguntar al usuario si desea continuar con Fase 3

Notas:
- `StudyTopic`, `Flashcard` y `StudySessionResult` ya fijan la forma estable del dominio para topics, tarjetas y resultados de estudio.
- Los schemas Zod definen mensajes base en espanol y separan inputs de creacion y actualizacion.
- Los contratos de repositorio se declararon asincronos para mantener compatibilidad futura con una API remota sin tocar la UI.
- Los errores iniciales de dominio quedan centralizados en `src/lib/errors/app-error.ts` con `APP_ERROR_CODES` y el tipo `AppErrorCode`.

## Fase 3. Persistencia local y servicios de Topics

Implementacion:
- [x] Implementar `LocalStorageClient`
- [x] Implementar `LocalStorageTopicRepository`
- [x] Implementar `TopicService`
- [x] Crear `topic-service.factory.ts`
- [x] Crear `topic.query-keys.ts`
- [x] Crear `useTopicsQuery`
- [x] Crear `useTopicQuery`
- [x] Crear `useCreateTopicMutation`
- [x] Crear `useUpdateTopicMutation`
- [x] Crear `useDeleteTopicMutation`
- [x] Preparar seed inicial de temas

Documentacion:
- [x] Documentar flujo `query -> service -> repository`
- [x] Documentar claves versionadas de storage
- [x] Documentar decisiones sobre seed inicial
- [x] Registrar invalidaciones y limpieza de cache de topics
- [x] Documentar errores esperados y manejo de fallbacks
- [x] Documentar la feature de topics y sus reglas de negocio y producto

Cierre de fase:
- [x] Verificar CRUD funcional de temas a nivel de datos
- [x] Actualizar plan y bitacora
- [x] Preguntar al usuario si desea continuar con Fase 4

Notas:
- La semilla inicial de topics solo se crea si la clave `memora:v1:topics` no existe todavia.
- Si el usuario deja su lista vacia manualmente, la semilla no reaparece.
- La UI futura debe consumir exclusivamente los hooks de `src/features/topics/queries/`.

## Fase 4. UI de Topics y Home

Implementacion:
- [x] Crear `PageHeader`
- [x] Crear `EmptyState`
- [x] Crear `ConfirmDialog`
- [x] Crear `TopicForm`
- [x] Crear `TopicCard`
- [x] Crear `TopicGrid`
- [x] Implementar Home `/`
- [x] Anadir creacion y edicion de temas con `Dialog`
- [x] Anadir borrado con confirmacion
- [x] Ajustar responsive y estado vacio

Documentacion:
- [x] Documentar composicion de la Home
- [x] Documentar comportamiento de formularios y modales
- [x] Registrar decisiones visuales iniciales
- [x] Documentar empty states y flujos de usuario principales
- [x] Documentar experiencia de producto de la Home y gestion de temas

Cierre de fase:
- [x] Verificar CRUD completo de temas desde UI
- [x] Actualizar plan y bitacora
- [x] Preguntar al usuario si desea continuar con Fase 5

Notas:
- La home ya consume solo hooks de topics y no toca servicios ni storage directamente.
- Crear y editar topics se resuelve dentro de `Dialog` para no romper el flujo principal.
- El estado vacio se muestra solo cuando ya no aplica la semilla inicial.

## Fase 5. Persistencia local y servicios de Flashcards

Implementacion:
- [x] Implementar `LocalStorageFlashcardRepository`
- [x] Implementar `FlashcardService`
- [x] Crear `flashcard-service.factory.ts`
- [x] Crear `flashcard.query-keys.ts`
- [x] Crear `useFlashcardsByTopicQuery`
- [x] Crear `useCreateFlashcardMutation`
- [x] Crear `useUpdateFlashcardMutation`
- [x] Crear `useDeleteFlashcardMutation`
- [x] Implementar borrado por `topicId`

Documentacion:
- [x] Documentar relacion entre tema y tarjetas
- [x] Documentar estrategia de consulta por `topicId`
- [x] Registrar reglas de borrado en cascada
- [x] Documentar comportamiento esperado de cache por coleccion
- [x] Documentar la feature de flashcards y sus reglas de negocio y producto

Cierre de fase:
- [x] Verificar capa de datos de flashcards
- [x] Actualizar plan y bitacora
- [x] Preguntar al usuario si desea continuar con Fase 6

Notas:
- La consulta principal de flashcards ya queda aislada por `topicId`.
- La limpieza en cascada de flashcards se dispara desde la capa de servicio de topics, no desde la UI.
- La futura pantalla de detalle de tema debe consumir exclusivamente los hooks de `src/features/flashcards/queries/`.

## Fase 6. UI de detalle de tema y CRUD de flashcards

Implementacion:
- [ ] Crear `FlashcardForm`
- [ ] Crear `FlashcardPreview`
- [ ] Crear `FlashcardGrid`
- [ ] Implementar `/topics/[topicId]`
- [ ] Mostrar datos del tema
- [ ] Anadir CRUD de tarjetas en modales
- [ ] Anadir CTA hacia estudio
- [ ] Resolver estados vacios y errores

Documentacion:
- [ ] Documentar estructura de la pagina de detalle
- [ ] Documentar experiencia de edicion y creacion de tarjetas
- [ ] Registrar comportamiento frente a `topicId` invalido
- [ ] Documentar navegacion hacia estudio
- [ ] Documentar reglas de producto del detalle de tema

Cierre de fase:
- [ ] Verificar CRUD funcional de tarjetas desde UI
- [ ] Actualizar plan y bitacora
- [ ] Preguntar al usuario si desea continuar con Fase 7

## Fase 7. Modo estudio

Implementacion:
- [ ] Crear soporte de dominio/servicio de estudio si aplica
- [ ] Crear `use-study-session`
- [ ] Crear `StudyCard`
- [ ] Crear `StudyProgress`
- [ ] Crear `StudySummary`
- [ ] Implementar `/topics/[topicId]/study`
- [ ] Anadir reveal de respuesta
- [ ] Anadir marcado sabida/no sabida
- [ ] Anadir avance de sesion
- [ ] Anadir resumen final

Documentacion:
- [ ] Documentar modelo de sesion en memoria
- [ ] Documentar estados del hook de estudio
- [ ] Registrar reglas de conteo de resultados
- [ ] Documentar separacion entre estudio y CRUD
- [ ] Documentar reglas de negocio y producto del modo estudio

Cierre de fase:
- [ ] Verificar sesion de estudio completa
- [ ] Actualizar plan y bitacora
- [ ] Preguntar al usuario si desea continuar con Fase 8

## Fase 8. Pulido visual y UX

Implementacion:
- [ ] Aplicar identidad visual consistente
- [ ] Anadir animacion de flip con `Framer Motion`
- [ ] Mejorar microinteracciones
- [ ] Afinar responsive
- [ ] Revisar consistencia de componentes base
- [ ] Pulir estados vacios, feedback y jerarquia visual

Documentacion:
- [ ] Documentar decisiones visuales finales del MVP
- [ ] Registrar convenciones de componentes UI reutilizables
- [ ] Documentar animaciones y proposito UX
- [ ] Anotar mejoras visuales futuras si quedan fuera del MVP
- [ ] Documentar criterios de producto sobre calidad visual y experiencia de demo

Cierre de fase:
- [ ] Verificar experiencia de demo en movil y escritorio
- [ ] Actualizar plan y bitacora
- [ ] Preguntar al usuario si desea continuar con Fase 9

## Fase 9. Testing

Implementacion:
- [ ] Configurar entorno de tests
- [ ] Crear tests de `LocalStorageClient`
- [ ] Crear tests de repositorios
- [ ] Crear tests de servicios
- [ ] Crear tests de hooks/mutations clave
- [ ] Crear tests de formularios
- [ ] Crear tests del flujo de estudio
- [ ] Ejecutar smoke test de navegacion principal

Documentacion:
- [ ] Documentar alcance real de la cobertura
- [ ] Registrar tests criticos por capa
- [ ] Anotar limitaciones o huecos pendientes
- [ ] Documentar como ejecutar la suite
- [ ] Documentar que reglas de negocio y producto quedan cubiertas por tests

Cierre de fase:
- [ ] Verificar estabilidad base del MVP
- [ ] Actualizar plan y bitacora
- [ ] Preguntar al usuario si desea dar por terminado el MVP o abrir fase de mejoras

## Criterios de aceptacion global

- [ ] Toda lectura persistente usa `useQuery`
- [ ] Toda escritura persistente usa `useMutation`
- [ ] `TanStack Query` vive solo en `queries/`
- [ ] La UI no accede directamente a `localStorage`
- [ ] Los formularios usan `React Hook Form + Zod`
- [ ] La migracion futura a API requiere cambiar principalmente repositorios y factories
- [ ] El modo estudio esta separado del CRUD
- [x] Cada fase quedo documentada al cerrarse
- [x] Despues de cada fase se pedira confirmacion antes de continuar
- [ ] El MVP final es funcional, responsive y demostrable
