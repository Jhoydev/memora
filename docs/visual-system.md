# Sistema visual MVP

## Direccion general

Memora usa una identidad luminosa, calmada y optimista. No busca parecer una herramienta administrativa ni un starter técnico; debe sentirse como un producto de estudio visual desde el primer vistazo.

## Decisiones visuales finales del MVP

- Fondos con gradientes radiales suaves y velos de color por pantalla.
- Superficies claras con bordes suaves y sombras largas, sin caer en efectos pesados.
- Paneles oscuros usados como contraste para decisiones, resumen o foco secundario.
- Tipografía grande y confiada para títulos, con microcopy simple en español.

## Convenciones reutilizables

- `.memora-page-shell`
  - contenedor principal de pantalla con overflow controlado
- `.memora-page-content`
  - ancho máximo consistente y espaciado vertical uniforme
- `.memora-surface`
  - panel claro principal
- `.memora-dark-surface`
  - panel oscuro de apoyo o énfasis
- `.memora-mesh`
  - retícula sutil para dar textura al fondo
- `Reveal`
  - componente de entrada progresiva con `Framer Motion`

## Motion

- Las entradas de secciones usan `Reveal` con delays cortos y consistentes.
- La tarjeta de estudio usa flip 3D para que revelar la respuesta tenga un peso intencional.
- Las acciones críticas no usan animaciones excesivas; priorizan claridad y respuesta.

## Responsive

- El sistema visual debe conservar jerarquía en móvil sin depender de múltiples columnas.
- Las pantallas pasan de composiciones en dos columnas a una sola columna sin perder orden narrativo.
- Los CTA principales se mantienen visibles y comprensibles incluso cuando se apilan.

## Reglas para seguir extendiendo el sistema

- Nuevas pantallas deben reutilizar estas superficies antes de inventar estilos paralelos.
- Si aparece un nuevo patrón visual, debe documentarse aquí.
- El polish debe ayudar al aprendizaje; no debe competir con el contenido.
