# Guia operativa del proyecto para Codex

## Objetivo

Este documento resume la estructura del proyecto, las reglas arquitectonicas y las convenciones mas importantes para que futuras sesiones de Codex puedan avanzar rapido sin reexplorar el repositorio completo.

## Estructura actual

- `src/app/`
  - Entrada App Router, layout global y providers.
- `src/features/`
  - Cada dominio vive por feature.
  - `topics/`, `flashcards/`, `study/`
- `src/components/`
  - `ui/` para base de `shadcn/ui`
  - `shared/` para componentes compartidos del producto
- `src/lib/`
  - Utilidades compartidas y detalles de infraestructura ligera
- `docs/`
  - Plan por fases, bitacora de avance y guias operativas del proyecto

## Regla de arquitectura

El flujo obligatorio para datos persistentes es:

`UI -> query hooks -> services -> repository interfaces -> repository implementation`

Reglas:
- La UI no toca `localStorage`.
- La UI no llama repositorios.
- Los hooks de `TanStack Query` viven solo en `queries/`.
- Los servicios no dependen de `TanStack Query`.
- La futura migracion a API debe requerir cambiar sobre todo repositorios y factories.

## Estado por capas

- Dominio:
  - Tipos y schemas de `topics`, `flashcards` y `study` ya definidos.
- Topics:
  - Repositorio local, servicio, factory, query keys, hooks de datos, semilla inicial y Home CRUD implementados.
- Flashcards:
  - Dominio, repositorio local, servicio, factory, query keys y hooks por `topicId` implementados.
- Study:
  - Solo tipo de resultado por ahora.

## Convenciones de implementacion

- Los tipos de entidad incluyen `id`, `createdAt` y `updatedAt`.
- Los repositorios exponen APIs asincronas aunque internamente usen `localStorage`.
- Las validaciones de entrada viven en schemas Zod por feature.
- Los errores de aplicacion se canalizan con `AppError` y `APP_ERROR_CODES`.
- Las factories crean una unica instancia concreta por feature para no duplicar wiring.
- La semilla de una feature debe resolverse en la capa de servicio, no en la UI.
- Si una feature introduce reglas visibles para el usuario, debe tener su propio documento en `docs/`.
- Las reglas de limpieza en cascada deben resolverse desde servicios o repositorios, no desde componentes.

## Reglas para futuras sesiones de Codex

- Antes de implementar una fase, revisar `docs/memora-mvp-execution-plan.md`.
- Revisar tambien `.agents/README.md` y escoger el perfil especializado que corresponda.
- Al cerrar una fase, actualizar tambien `docs/memora-mvp-progress-log.md`.
- Si una fase introduce una feature visible, documentar:
  - que hace
  - reglas de negocio
  - reglas de producto
  - decisiones de UI/UX
- No saltar directamente a componentes si la capa de datos de esa feature no esta cerrada.
- Mantener nombres de archivos alineados con el plan tecnico original salvo que haya una razon fuerte para desviarse.

## Mapa de agentes

- `.agents/topics-agent.md`
  - Especialista en topics, home y reglas de primer arranque.
- `.agents/flashcards-agent.md`
  - Especialista en tarjetas, relacion con `topicId` y cache por tema.
- `.agents/study-agent.md`
  - Especialista en sesiones, progreso y resumen final.
- `.agents/ui-agent.md`
  - Especialista en interfaz, modales, empty states, responsive y consistencia visual.

## Pendiente inmediato

La siguiente fase tras la persistencia de flashcards es la UI del detalle de tema y el CRUD visual de tarjetas, reutilizando el patron de la Home de topics.
