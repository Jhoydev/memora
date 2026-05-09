# Pantalla: Home Topics

## Objetivo

La Home de Memora debe convertir la capa de datos de topics en una experiencia clara y accionable. Es la puerta de entrada del producto y debe responder a una pregunta inmediata: "¿sobre que quiero estudiar ahora?"

## Acciones principales

- Crear un tema nuevo
- Editar un tema existente
- Eliminar un tema
- Explorar visualmente la biblioteca de temas

## Reglas de producto

- La home debe sentirse viva desde el primer arranque gracias a la semilla inicial.
- Si el usuario ya vacio la biblioteca manualmente, la home debe respetar el estado vacio.
- El tema visual debe ayudar a distinguir rapidamente un topic antes incluso de leer todos sus detalles.
- La home no debe prometer acciones de flashcards o estudio todavia implementadas como si ya estuvieran listas.

## Reglas de UX

- El CTA primario siempre es "Nuevo tema".
- Los estados vacios deben explicar el siguiente paso.
- Crear y editar se resuelven en modal para no romper el flujo de la home.
- El borrado siempre requiere confirmacion explicita.
- El formulario debe ofrecer una vista previa visual del tema antes de guardar.

## Reglas visuales

- La home usa una composicion luminosa, optimista y no oscura por defecto.
- Las tarjetas de topic deben verse como bloques de coleccion, no como filas administrativas.
- El color del topic debe expresarse tanto en el icono como en la etiqueta visual.
- La jerarquia debe dejar claro: primero nombre del tema, luego accion, luego metadata secundaria.

## Responsive

- En movil, el encabezado y CTA se apilan.
- La rejilla de topics debe degradar a una sola columna cuando no haya ancho suficiente.
- Los modales deben seguir siendo usables en pantallas pequenas sin perder contexto.

## Errores esperados

- Fallos de lectura/escritura de storage
- Validaciones de formulario
- Error al editar o borrar un topic inexistente

## Dependencias de arquitectura

- La home consume solo hooks de `src/features/topics/queries/`.
- El formulario no persiste directamente; recibe `onSubmit`.
- Los componentes compartidos reutilizados son `PageHeader`, `EmptyState` y `ConfirmDialog`.
