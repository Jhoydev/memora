# Reglas de UI y producto

## Principios de producto

- Memora debe sentirse clara, amable y enfocada en estudio visual.
- El flujo principal del MVP es:
  - crear tema
  - crear tarjetas
  - estudiar
- El producto debe ser demostrable desde el primer arranque; por eso existe seed inicial.

## Reglas de negocio confirmadas

### Topics

- Un tema siempre tiene nombre y color.
- Un tema puede tener icono opcional.
- Si no hay datos previos, la aplicacion crea temas semilla para evitar una primera experiencia vacia.
- La semilla inicial solo debe aparecer cuando la clave de topics aun no existe.
- Si el usuario borra todos los temas, la experiencia debe respetar ese estado vacio.
- El borrado de un tema debera eliminar sus tarjetas asociadas cuando la feature de flashcards este completa.

### Flashcards

- Cada tarjeta pertenece a un unico tema.
- Cada tarjeta necesita frente y reverso.
- El CRUD de tarjetas vive separado del modo estudio.
- La consulta principal de tarjetas es por `topicId`.
- El borrado de un tema debe poder limpiar sus tarjetas asociadas sin depender de la UI.

### Study

- Una sesion se calcula en memoria para el MVP.
- El resultado final debe distinguir sabidas y no sabidas.
- El estudio no debe depender de formularios CRUD para funcionar.
- El modo estudio muestra una tarjeta a la vez.
- La respuesta debe revelarse solo tras una accion explicita del usuario.

## Reglas de UI

- La UI base usa `shadcn/ui`.
- El diseño debe evitar apariencia de starter generico.
- Se prioriza claridad visual antes que densidad de informacion.
- Los estados vacios deben explicar el siguiente paso.
- Las acciones destructivas deben tener confirmacion.
- Los formularios deben mostrar mensajes de validacion claros en espanol.
- Los flujos primarios del MVP deben resolverse con la menor navegacion posible.
- Mientras una feature aun no exista, la UI debe comunicarlo sin crear falsas expectativas.

## Reglas de UI confirmadas por Home

- La home usa un CTA principal unico: crear tema.
- Crear y editar topics se resuelven en modal para mantener contexto.
- El formulario de topics incluye preview visual para reducir errores de eleccion de color/icono.
- Las tarjetas de topic deben expresar personalidad visual, no solo metadata.
- Las pantallas deben mantener una direccion luminosa y optimista por defecto.

## Reglas de UI confirmadas por Topic Detail

- El detalle del tema debe mantener visible el contexto del topic al gestionar flashcards.
- Crear y editar flashcards tambien se resuelve en modal para no romper el flujo.
- El empty state de tarjetas debe orientar a crear la primera flashcard.
- El CTA a estudio puede mostrarse antes de que la feature exista por completo, pero debe comunicar claramente que llega en la siguiente fase.

## Reglas de UI confirmadas por Study

- El estudio prioriza foco y secuencia por encima de densidad.
- La decision `sabida/no sabida` solo aparece tras revelar la respuesta.
- El resumen final debe sentirse orientativo y motivador.
- Si no hay tarjetas, el flujo vuelve a empujar hacia el detalle del tema.

## Convenciones visuales finales del MVP

- Se usa una familia de superficies claras y oscuras reutilizables para dar consistencia.
- Las entradas de pantalla se apoyan en reveals sutiles, no en animaciones ruidosas.
- El fondo debe sentirse vivo mediante gradientes y textura ligera, no plano.
- La tarjeta de estudio tiene peso especial y usa flip 3D como gesto principal de interacción.

## Reglas para futuras features

- Antes de crear una pantalla nueva, documentar:
  - objetivo de la pantalla
  - acciones primarias
  - estados vacios
  - errores esperados
  - comportamiento responsive
- Si una regla de producto cambia, reflejarla tanto en la bitacora como en este archivo.
