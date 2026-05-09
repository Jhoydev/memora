# Pantalla: Study

## Objetivo

La pantalla de estudio debe permitir un repaso visual y rápido de las flashcards de un tema concreto, con el menor ruido posible y con una conclusión clara al final.

## Acciones principales

- Ver el frente de una tarjeta
- Revelar la respuesta
- Marcarla como sabida
- Marcarla como no sabida
- Repetir sesión
- Volver al detalle del tema

## Reglas de producto

- El modo estudio trabaja sobre un `topicId` concreto.
- Si el tema no existe, debe ofrecerse salida clara hacia Home.
- Si no hay flashcards, debe ofrecerse salida clara hacia el detalle del tema.
- La sesión no persiste histórico durante el MVP.

## Reglas de UX

- Solo se muestra una tarjeta a la vez.
- La respuesta no se ve hasta que el usuario la revela.
- La decisión posterior debe ser binaria y rápida.
- El resumen final debe sugerir aprendizaje, no castigo.

## Reglas visuales

- El estudio mantiene la identidad luminosa del producto, pero con un panel lateral de decisión más enfocado.
- La jerarquía visual debe guiar: progreso, tarjeta actual, decisión, resumen.
- La animación de reveal debe sentirse suave, no distractora.

## Estados esperados

- carga de tema/flashcards
- tema inexistente
- tema sin flashcards
- sesión activa
- sesión completada con resumen

## Dependencias de arquitectura

- La pantalla consume `useTopicQuery` y `useFlashcardsByTopicQuery`.
- La lógica de sesión se encapsula en `useStudySession`.
- El resumen se deriva del resultado de `StudyService`.
