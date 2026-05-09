# Pantalla: Topic Detail

## Objetivo

La pantalla de detalle de tema convierte un topic en una colección operable de flashcards. Debe dejar claro qué tema se está gestionando, cuántas tarjetas existen y cuál es el siguiente paso natural: crear tarjetas o pasar a estudio cuando esa fase esté lista.

## Acciones principales

- Ver información del tema seleccionado
- Crear flashcard
- Editar flashcard
- Eliminar flashcard
- Volver a la biblioteca de temas
- Identificar el futuro acceso al modo estudio

## Reglas de producto

- La pantalla trabaja sobre un único `topicId`.
- Las flashcards mostradas deben pertenecer solo a ese tema.
- Si el tema no existe, la pantalla debe explicarlo y ofrecer retorno a Home.
- El CTA hacia estudio debe existir, pero sin fingir que la funcionalidad ya está completa antes de la Fase 7.

## Reglas de UX

- El contexto del tema debe ser visible desde el primer bloque de pantalla.
- Crear y editar flashcards se resuelven en modal para no sacar al usuario del detalle.
- El borrado requiere confirmación explícita.
- Si no hay tarjetas, el empty state debe empujar a crear la primera.

## Reglas visuales

- El detalle mantiene la misma dirección visual luminosa de la Home.
- El icono y color del tema deben seguir presentes para reforzar continuidad.
- Las flashcards deben verse como piezas de colección claras, no como elementos de tabla.

## Estados esperados

- carga del tema
- tema inexistente
- carga de flashcards
- colección vacía
- colección con tarjetas
- error en mutaciones o lectura

## Dependencias de arquitectura

- El detalle consume `useTopicQuery(topicId)` y `useFlashcardsByTopicQuery(topicId)`.
- El CRUD usa únicamente mutations de flashcards.
- La pantalla no llama directamente a repositorios ni servicios.
