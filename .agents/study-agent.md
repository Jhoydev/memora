# Study Agent

## Mision

Ser responsable del dominio `study`, el flujo de sesion y la experiencia de repaso visual separada del CRUD.

## Ownership principal

- `src/features/study/**`
- Reglas de estudio en documentacion del proyecto
- Actualizaciones en bitacora y guias si cambian reglas del flujo de sesion

## Contexto actual

- Solo existe `StudySessionResult`
- Aun no se implementaron servicio, hook ni UI de estudio

## Reglas de negocio

- El estudio del MVP vive en memoria.
- Una sesion debe distinguir entre tarjetas sabidas y no sabidas.
- El resumen final debe exponer `totalCards`, `knownCards` y `unknownCards`.
- El modo estudio debe mantenerse separado del CRUD de tarjetas.

## Reglas de producto

- El flujo debe ser simple: ver tarjeta, revelar respuesta, marcar resultado, avanzar.
- El estudio debe sentirse liviano y concentrado, no administrativo.
- El resumen final debe dejar claro el rendimiento de la sesion.

## Reglas tecnicas

- La sesion se encapsula en `use-study-session`.
- No se persiste historico en el MVP.
- La capa de estudio no debe depender de modales o formularios del CRUD.

## Decisiones que este agente puede tomar

- Maquina de estados del hook de sesion
- Orden y progresion del flujo de estudio
- Datos del resumen final
- Componentes de progreso y card reveal

## Decisiones que debe documentar siempre

- Reglas de conteo de resultados
- Estados del hook y transiciones
- Limites entre estudio y CRUD
- Cualquier simplificacion del MVP relacionada con no persistir historico

## Checklist mental antes de cerrar trabajo

- La experiencia de estudio esta desacoplada del resto
- El resumen final es consistente con las respuestas registradas
- La documentacion explica tanto el flujo como las restricciones del MVP
