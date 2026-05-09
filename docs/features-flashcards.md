# Feature: Flashcards

## Objetivo

La feature de flashcards permite guardar tarjetas mnemotecnicas asociadas a un tema concreto. Es la capa que transforma un topic en una unidad real de estudio.

## Alcance actual

En esta fase queda implementada la capa de datos de flashcards:

- repositorio local con `localStorage`
- servicio de aplicacion
- factory concreta
- query keys
- hooks de lectura y mutacion por `topicId`
- borrado en cascada por tema

La UI del detalle de tema y del CRUD de flashcards se implementara en la fase siguiente.

## Reglas de negocio

- Una flashcard siempre pertenece a un `topicId`.
- Una flashcard requiere `front` y `back`.
- Toda flashcard persistida incluye `id`, `createdAt` y `updatedAt`.
- La actualizacion debe contener al menos un cambio efectivo.
- No se puede crear una flashcard para un tema inexistente.
- El borrado por `topicId` debe permitir limpieza en cascada.

## Reglas de producto

- Las flashcards no existen de forma aislada; siempre viven dentro de un tema.
- La coleccion de flashcards debe poder consultarse por tema sin mezclar tarjetas de otros contextos.
- El borrado de un topic debe poder limpiar sus tarjetas asociadas sin depender de la UI.

## Contratos expuestos

- `flashcardQueryKeys`
- `useFlashcardsByTopicQuery`
- `useCreateFlashcardMutation`
- `useUpdateFlashcardMutation`
- `useDeleteFlashcardMutation`

Estos contratos seran la unica puerta de entrada de la UI para datos persistentes de flashcards.
