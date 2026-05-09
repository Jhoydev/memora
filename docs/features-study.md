# Feature: Study

## Objetivo

La feature de study convierte una colección de flashcards en una sesión de repaso enfocada. Su trabajo no es administrar tarjetas sino facilitar recuperación activa, decisión rápida y resumen útil al final.

## Alcance actual

En este punto la feature de study ya incluye:

- servicio puro de apoyo para sesión
- hook `use-study-session`
- pantalla `/topics/[topicId]/study`
- progreso de sesión
- tarjeta de estudio con reveal
- resumen final

## Reglas de negocio

- La sesión vive en memoria en el MVP.
- Cada tarjeta puede marcarse como `known` o `unknown`.
- El resultado final debe devolver `totalCards`, `knownCards` y `unknownCards`.
- No existe histórico persistido de sesiones en esta fase.

## Reglas de producto

- Primero se intenta recordar, luego se revela la respuesta.
- La experiencia debe sentirse liviana y secuencial: una tarjeta por vez.
- El resumen final orienta el siguiente paso, no califica al usuario.
- Si no hay tarjetas para estudiar, la pantalla debe volver a empujar hacia el detalle del tema.

## Componentes de UI actuales

- `StudyScreen`
- `StudyProgress`
- `StudyCard`
- `StudySummary`

## Contratos expuestos

- `StudyService`
- `useStudySession`

La UI del modo estudio se apoya en estos contratos y sigue separada del CRUD de flashcards.
