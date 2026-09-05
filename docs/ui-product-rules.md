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

## Reglas de UI confirmadas por DraftLens LoL

- La pantalla principal de DraftLens debe permitir leer picks aliados, picks rivales y recomendacion sin navegar entre vistas.
- Durante Champion Select, el tablero rival no presenta filas de Top, Jungla, Mid, ADC o Support ni controles de selección. Cada pick rival se lista por orden de bloqueo como `rol oculto`, con icono y nombre, y cuenta para recomendaciones globales sin presentarse dentro de una línea. Las filas por rol solo aparecen al confirmarse las posiciones desde el Live Client en partida.
- Para un pick activo de Top, los planes de línea se muestran como alternativas seleccionables y diferenciadas de la build de composición. Deben incluir un plan seguro cuando el rival de línea sea desconocido y planes condicionales que indiquen explícitamente `Si [campeón] va Top`.
- El bloque de planes de Top permite marcar un campeón rival detectado como `posible Top`. Debe usar una etiqueta de hipótesis y ofrecer siempre la opción `Top sin confirmar`; esta interacción actualiza la build, el inicio y los planes, pero no convierte el supuesto en un rol visualmente confirmado ni altera la prioridad global de pick.
- Las cards de alternativas de loadout y planes de línea muestran previews visuales de los objetos recomendados y de las runas estructuradas disponibles. El texto de build y runas se conserva como contexto y fallback accesible.
- Cada icono de objeto o runa de una recomendación expone su nombre en un tooltip al pasar el cursor y en texto alternativo para tecnologías de asistencia; el usuario no debe depender del texto inferior para identificarlo.
- Cuando una build, runa o hechizo tiene icono y tooltip, la UI no repite su nombre en texto visible. Los datos legacy sin iconos y los fragmentos de runas conservan texto como fallback.
- Los bans confirmados se muestran agrupados bajo el equipo que los realizó y bloquean selección y recomendación. Un ban en curso se comunica como estado transitorio y no elimina un candidato hasta confirmarse.
- Cuando los bans agotan el pool personal de una línea, la card de siguiente pick ofrece alternativas legales de meta en lugar de un estado vacío.
- Al terminar el draft, la última composición válida debe permanecer visible con un estado explícito; nunca se debe recalcular una recomendación como si ambos equipos estuvieran vacíos.
- En partida, la recomendación mantiene el loadout y las runas seleccionadas y muestra una ruta ordenada de compra con estados `Comprado`, `Siguiente` y pendiente, además del tiempo, oro actual y la razón del ajuste situacional.
- La ruta de compra es viva: debe avanzar al detectar objetos completos y puede reordenar botas defensivas según rival, composición y postura. Nunca debe dar la impresión de haber cambiado la variante de build elegida por la persona usuaria.
- La ruta de compra debe mostrar `Inicio de partida`, `Próximo back` y `Orden de componentes` cuando la receta oficial esté disponible. El bloque de back indica el objeto completo objetivo, el componente que se puede comprar ahora y su coste; los iconos mantienen tooltip con el nombre.
- En partida, la card `Plan en vivo` debe indicar fase, postura (`Agresivo`, `Controlado` o `Defensivo`), confianza y factores observables frente al rival de línea. Debe ofrecer dos acciones inmediatas y una conducta que evitar.
- El plan en vivo debe destacar el aliado y enemigo con mayor ventaja visible. Cada prioridad muestra campeón, rol solo si League lo confirma, señales observadas y una acción concreta: jugar alrededor del aliado, focus o respeto del enemigo y, cuando corresponda, un ajuste defensivo de build. No debe mostrar un score opaco ni sugerir visión u oro no disponibles.
- Cuando existe una ficha de matchup, `Plan en vivo` muestra un bloque visible con su alcance (`Matchup específico` o `Arquetipo`) y adapta la primera acción y el riesgo a evitar al campeón rival. No debe simular precisión específica si solo existe una lectura por arquetipo.
- `Ruta de compra` y `Plan en vivo` forman una banda independiente de ancho completo debajo del resumen de campeón, build y runas. No viven dentro de la columna derecha porque su altura no debe estirar la identidad azul ni generar espacio vacío. La compra ocupa un bloque compacto con altura propia y el plan recibe el ancho principal.
- El coaching no muestra una probabilidad de victoria ni el score interno del algoritmo. Comunica diferencias concretas de nivel, CS, impacto KDA e inventario visible, y explicita que no conoce oro enemigo sin gastar, estado de oleada o ubicación del jungla.
- Si League no confirma un rival de la misma posición, la interfaz muestra un plan seguro con `Datos insuficientes`; nunca asigna un matchup por inferencia.
- Una posición propia inferida en Entrenamiento permite activar el plan, pero se presenta como estimación parcial. Solo se acepta cuando existe una única posición aliada libre y el campeón puede jugarla; con cualquier ambigüedad se conserva el plan seguro.
- A partir de transición, la terminología cambia de plan de línea a decisiones de mapa y recursos para no recomendar agresión de línea fuera de contexto.
- La linea a recomendar siempre debe estar visible y poder cambiarse en un toque.
- Cada recomendacion debe mostrar la razon del ajuste, no solo una puntuacion.
- La puntuación de campeón se presenta como `Prioridad` en porcentaje, con un contexto secundario: `Composición`, `Draft parcial` o `Draft completo`. No representa probabilidad de victoria ni una certeza sobre el resultado de la partida.
- Al haber rivales con rol oculto, la UI debe comunicar que el matchup directo aún no forma parte de la prioridad. La explicación visible se deriva de los factores que realmente contribuyeron al score.
- Builds y runas son una guia inicial y deben comunicar que requieren adaptacion al parche y a la partida.
- La experiencia debe funcionar desde Safari y Chrome en macOS sin exigir una app nativa.
- Durante una consulta de meta, la UI conserva la build curada para no bloquear la decision de draft y sustituye sus datos cuando OP.GG responde.
- La card "Tu siguiente pick" identifica si sus opciones proceden del pool personal o del meta de línea. Una línea sin pool personal configurado nunca debe quedar sin recomendaciones si existen campeones importados disponibles.
- Una opción marcada como `Meta` es una única excepción que supera al mejor pick del pool personal; nunca desplaza el pool como fuente principal de las recomendaciones.
- Al confirmar un campeón desde una recomendación o el tablero aliado, la interfaz cambia de decisión de pick a asesoramiento del campeón: build, runas, summoners y alternativas coherentes con la composición.
- No reutilizar el término `fit` para scores de build: el fit corresponde al campeón frente al draft; las alternativas de build se presentan como `score de loadout` o `meta` y explican su procedencia.
- Las cards de alternativas de loadout son controles seleccionables, no contenido estático. La elegida debe llevar estado visual `Seleccionada` y actualizar la recomendación superior con su pareja completa de build y runas.
- Las etiquetas de estado de build no dividen palabras ni números dentro de una píldora. Si el ancho no alcanza, la píldora completa pasa a la siguiente línea sin perder legibilidad.
- Una recomendación excepcional fuera del pool se marca como `Meta` y se limita a una opción para no desplazar el foco de los campeones personales.
- Los assets de League se presentan mediante iconos reutilizables con `alt`, tamaño configurable y fallback común; las pantallas no manejan fallos de imágenes individualmente.
- La card de pick activo divide la información accionable en dos columnas: build y runas. Los hechizos se integran como un bloque compacto dentro de Runas, pues dos iconos no justifican una tercera columna independiente. El panel del campeón usa su altura para reforzar identidad y etiquetas estratégicas.
- El selector de siguiente pick se ubica después de los dos tableros de composición y ocupa todo el ancho disponible. Las recomendaciones deben compararse en horizontal en escritorio y no competir como una tercera columna comprimida.
- Los iconos de la card activa incluyen la pasiva y Q/W/E/R cuando el detalle canónico del campeón está disponible. La UI muestra únicamente esa síntesis visual; costes, alcance y enfriamientos permanecen en el contrato de datos para análisis y futuras vistas de detalle.
- Un selector de campeón con más de una pantalla de opciones no usa un `select` nativo: abre una búsqueda modal con foco inicial, opción de limpiar, iconos y contexto de meta. Debe ser utilizable con teclado y en móvil.
- La recomendación de runas muestra los iconos de la página y las runas individuales cuando existen referencias importadas. Los fragmentos se mantienen textuales porque no pertenecen al catálogo de runas de Data Dragon.
