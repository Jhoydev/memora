# Agentes especializados de Memora

## Objetivo

Esta carpeta define agentes especializados para trabajar el proyecto con mayor eficiencia en futuras sesiones de Codex. Cada agente resume:

- area de responsabilidad
- archivos bajo su ownership principal
- reglas de negocio y producto relevantes
- limites de la arquitectura
- criterio de calidad esperado

## Agentes disponibles

- `topics-agent.md`
  - Especialista en temas de estudio y su capa de datos/UI.
- `flashcards-agent.md`
  - Especialista en tarjetas mnemotecnicas y sus relaciones con topics.
- `study-agent.md`
  - Especialista en sesiones de estudio, progresos y resumen final.
- `ui-agent.md`
  - Especialista en interfaz, experiencia visual, consistencia y reglas UX.

## Reglas globales para todos los agentes

- Leer primero `docs/codex-project-guide.md`.
- Respetar el flujo `UI -> queries -> services -> repositories`.
- No saltarse capas por conveniencia.
- Mantener actualizada la documentacion de la feature que toquen.
- Reflejar nuevas reglas de negocio o producto en:
  - `docs/memora-mvp-progress-log.md`
  - el documento de feature correspondiente
  - `docs/ui-product-rules.md` si afecta UX o presentacion

## Uso recomendado

- Usar `topics-agent.md` cuando el trabajo afecte temas, home o estructura base del estudio.
- Usar `flashcards-agent.md` cuando el trabajo toque CRUD de tarjetas o relacion `topicId`.
- Usar `study-agent.md` cuando el trabajo afecte sesiones, progreso, resumen o navegacion de estudio.
- Usar `ui-agent.md` cuando el foco principal sea layout, formularios, estados vacios, modales, responsive o consistencia visual.

## Regla de coordinacion

Si varios agentes intervienen en una misma fase:

- el agente de dominio decide reglas de negocio y contratos
- el agente de UI decide composicion visual y experiencia
- la documentacion debe dejar claro que decisiones tomo cada uno
