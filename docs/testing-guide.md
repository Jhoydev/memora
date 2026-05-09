# Guia de testing

## Stack de pruebas

- `Vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

## Comandos

- `npm test`
  - ejecuta toda la suite en modo run
- `npm run test:watch`
  - deja la suite en modo interactivo para desarrollo
- `npm run lint`
  - valida convenciones y errores de código
- `npm run build`
  - valida que el proyecto siga compilando correctamente

## Cobertura actual del MVP

- `LocalStorageClient`
- repositorios locales de `topics` y `flashcards`
- servicios de `topics`, `flashcards` y `study`
- hook `useStudySession`
- mutation `useCreateTopicMutation`
- formulario `TopicForm`
- smoke básico del flujo entre topic detail y retorno desde estudio

## Riesgos aún no cubiertos a fondo

- No hay pruebas E2E reales de navegación completa en navegador
- No hay pruebas visuales/snapshots del polish
- No hay suite dedicada para `FlashcardForm` ni para todas las mutaciones de flashcards

## Regla para futuras sesiones

- Si se modifica la lógica de storage, servicios o flujo de estudio, actualizar primero la suite unitaria correspondiente.
- Si se introduce una nueva pantalla principal, añadir al menos un smoke test de render o navegación.
