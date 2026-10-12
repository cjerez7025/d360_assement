# Servicio contratado

El D360° Inicia es el punto de partida (esta aplicación). Los demás paquetes se activan según lo que el cliente contrate. Los paquetes y sus contenidos salen del sitio de AlignData; los hitos, del resumen de condiciones comerciales v1.0 (el contrato prevalece).

## Principio

**Quien activa un nivel es el consultor, registrando la decisión.** Adjuntar o referenciar un contrato la respalda, pero no activa nada por sí solo: la aplicación no puede verificar una firma ni un pago (las condiciones dicen que el trabajo parte con la firma y el anticipo). El contrato queda en el Drive de AlignData; aquí solo se guarda **la referencia** (nombre y un enlace https opcional). El cliente solo puede **pedir** avanzar.

## Paquetes, niveles y estados

| Paquete | Nivel | Hitos que se registran |
|---|---|---|
| D360° Inicia | 1 | Aceptación y anticipo · kick-off · dashboard entregado · informe final y presentación |
| D360° Evalúa | 2 | Aceptación y anticipo · inventario, flujos y borrador de hallazgos · informe final, hoja de ruta ejecutiva y presentación |
| Combo Inicia + Evalúa | 2 | Aceptación y anticipo · dashboard y puntuación · inventario y flujos · presentación final y acta |
| D360° Acompaña | 3 | Contrato y primer mes facturado · mínimo de 3 meses cumplido |
| D360° Implementa | 4 | Evalúa aprobado y contrato · hitos verificables · cierre |

Estados: **propuesta enviada, aceptada, activa, entregada**. Solo *activa* y *entregada* cuentan como contratado; una propuesta no sube el nivel. El Inicia siempre está incluido. Acompaña e Implementa suponen un Evalúa aprobado: sin él, el cliente ve «Requiere D360° Evalúa». No se muestran precios (viven en el sitio).

## Qué ve cada perfil

- **Consultor:** opción «Servicio contratado» en el menú lateral (con la cantidad de solicitudes pendientes) y pestaña «Servicio» en los resultados. En el formulario registra paquete, estado, referencia del contrato, hitos con su fecha, y ve quién lo registró. El enlace se valida (solo `https://`, sin espacios).
- **Cliente:** pestaña «Servicio» con su nivel activo, el contenido de cada paquete y su estado. Para Evalúa (y, con el Evalúa activo, Acompaña e Implementa) hay un botón «Quiero avanzar». **No activa nada:** crea una solicitud que ve el consultor.
- Al cliente solo le viaja el **paquete y el estado**, y solo cuando el consultor **actualiza los resultados publicados**. Nunca el contrato, los hitos ni quién lo registró.

## Cuenta regresiva del Combo

Las condiciones dan un descuento si el anticipo del Evalúa se paga **dentro de 5 días hábiles desde la entrega del informe del Inicia**. Al marcar ese hito, el consultor ve el plazo y los días hábiles que quedan (lunes a viernes; **no considera feriados**).

## Dónde vive

`sesiones/{id}.servicio` (consultor) → `compartidos/{token}.servicio` (solo `{paquete, estado}`) y `compartidos/{token}/solicitudes/{id}` (`{paquete, nombre, cargo, creadoEn}`: las crea quien tiene el enlace, mientras exista; solo el consultor las lee y las borra). Reglas probadas con `npm run probar-reglas`. **Al publicar hay que desplegar primero `firestore:d360`.** Código en `public/servicio.js`; pruebas en la sección 27 de `npm run verificar`.

## Lo que todavía no está

Los módulos de D360° Evalúa (inventario, flujos, contratos con terceros y DPIA preliminar) y el seguimiento por sprints de Acompaña no existen en la aplicación: hoy este registro permite saber qué contrató el cliente y mostrar qué incluye cada paquete. Algunas funciones de Evalúa, Acompaña e Implementa se entregan fuera de la aplicación.
