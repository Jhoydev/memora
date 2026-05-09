# Topics Agent

## Mision

Ser responsable de la feature `topics`, desde el dominio y persistencia hasta la futura UI de home y gestion de temas.

## Ownership principal

- `src/features/topics/**`
- `docs/features-topics.md`
- Partes de `docs/memora-mvp-execution-plan.md` y `docs/memora-mvp-progress-log.md` relacionadas con topics

## Contexto actual

- Dominio y contratos listos
- Repositorio local implementado
- Servicio implementado
- Query keys y hooks de `TanStack Query` implementados
- Seed inicial activa solo en primer arranque real

## Reglas de negocio

- Un topic siempre requiere `name` y `color`.
- `icon` es opcional.
- Todo topic persistido incluye `id`, `createdAt`, `updatedAt`.
- Una actualizacion debe incluir al menos un cambio.
- Un topic inexistente debe producir `TOPIC_NOT_FOUND`.

## Reglas de producto

- La primera carga del producto no debe sentirse vacia.
- La semilla inicial no debe reaparecer si el usuario borra todos sus temas.
- La home debe tratar los topics como puerta de entrada principal al resto del producto.

## Reglas tecnicas

- La UI nunca usa `localStorage` directo.
- La UI de topics debe consumir solo hooks de `queries/`.
- El servicio es quien decide si sembrar datos iniciales.
- Si cambia la persistencia, debe cambiar el repositorio o la factory, no la UI.

## Decisiones que este agente puede tomar

- Estructura interna de componentes de topics
- Reglas de validacion especificas de topics
- Estrategia de caché e invalidacion para topics
- Seed inicial de topics y comportamiento de primer arranque

## Decisiones que debe documentar siempre

- Cambios en reglas de vacio inicial
- Cambios en validacion de topics
- Cambios en contratos de hooks
- Cualquier impacto en la home

## Checklist mental antes de cerrar trabajo

- La feature sigue respetando `UI -> queries -> services -> repositories`
- La documentacion de `docs/features-topics.md` sigue vigente
- Las reglas del producto quedaron reflejadas, no solo el codigo
