# Feature: Topics

## Objetivo

La feature de topics permite representar los contenedores principales de estudio en Memora. Todo el flujo posterior del MVP depende de que exista un tema seleccionable al que asociar tarjetas y desde el que iniciar estudio.

## Alcance actual

En este punto la feature de topics ya incluye:

- repositorio local con `localStorage`
- servicio de aplicacion
- factory concreta
- query keys
- hooks de lectura y mutacion con `TanStack Query`
- seed inicial de temas
- home funcional
- grid de topics
- modal de creacion y edicion
- confirmacion de borrado
- componentes compartidos para encabezado y empty state

## Reglas de negocio

- Un tema requiere `name` y `color`.
- `icon` es opcional.
- Todo tema persistido incluye `id`, `createdAt` y `updatedAt`.
- La actualizacion debe contener al menos un cambio efectivo.
- El borrado de un tema inexistente debe fallar con error de dominio.

## Reglas de producto

- La primera visita no debe sentirse vacia: si no existe la clave de topics en storage, se crean temas semilla.
- Si el usuario borra todos sus temas, la semilla no debe reaparecer automaticamente.
- La capa de datos debe ser compatible con una futura API sin cambiar los hooks ni la UI.
- La home de topics es la puerta de entrada principal al MVP.
- Crear y editar topics debe ocurrir dentro de la home mediante modal.
- Borrar un topic requiere confirmacion explicita.

## Seed inicial

Se incluyen tres temas de ejemplo:

- Vocabulario
- Historia
- Ciencia

Su objetivo es acelerar demos y desarrollo del MVP.

## Contratos expuestos

- `topicQueryKeys`
- `useTopicsQuery`
- `useTopicQuery`
- `useCreateTopicMutation`
- `useUpdateTopicMutation`
- `useDeleteTopicMutation`

Estos contratos son la unica puerta de entrada de la UI para datos persistentes de topics.

## Componentes de UI actuales

- `TopicsHomeScreen`
- `TopicGrid`
- `TopicCard`
- `TopicForm`
- `PageHeader`
- `EmptyState`
- `ConfirmDialog`
