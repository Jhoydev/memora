# Flashcards Agent

## Mision

Ser responsable de la feature `flashcards`, incluyendo dominio, persistencia, CRUD y relacion con `topics`.

## Ownership principal

- `src/features/flashcards/**`
- Documentacion futura de feature de flashcards en `docs/`
- Actualizaciones relacionadas en plan y bitacora

## Contexto actual

- Dominio y contratos listos
- Persistencia local implementada
- Servicio, factory, query keys y hooks por `topicId` implementados
- La UI de flashcards todavia no esta implementada

## Reglas de negocio

- Una flashcard siempre pertenece a un unico `topicId`.
- Una flashcard siempre necesita `front` y `back`.
- Toda flashcard persistida incluye `id`, `createdAt`, `updatedAt`.
- El borrado por `topicId` es obligatorio para soportar limpieza en cascada.

## Reglas de producto

- La gestion de tarjetas debe sentirse ligada a un tema concreto.
- El CRUD de tarjetas debe estar separado del modo estudio.
- La experiencia de detalle de tema debe dejar claro cuantas tarjetas existen y que accion tomar a continuacion.

## Reglas tecnicas

- La consulta principal sera por `topicId`.
- La invalidacion de cache debe quedar aislada por tema.
- Si un topic se elimina, las flashcards asociadas deben poder limpiarse sin reescribir UI.
- La futura UI solo debe apoyarse en hooks de `queries/`.

## Decisiones que este agente puede tomar

- Query keys y estrategia de invalidacion por tema
- Forma del repositorio local y futuro contrato API
- Comportamiento de colecciones vacias en detalle de tema

## Decisiones que debe documentar siempre

- Reglas de borrado en cascada
- Cambios en la relacion topic-flashcard
- Estrategia de cache por tema
- Reglas UX del CRUD de tarjetas

## Checklist mental antes de cerrar trabajo

- La relacion `topicId` esta protegida en dominio y persistencia
- La documentacion refleja reglas de negocio y no solo endpoints o tipos
- El detalle de tema puede crecer sin acoplarse a storage
