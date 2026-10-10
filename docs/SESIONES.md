# Sesiones guardadas del D360°

El D360° pasa de ser un cuestionario público a una **herramienta para conducir una reunión con un cliente**: el consultor responde con el cliente, la sesión queda guardada en Firebase para retomarla después, y el cliente ve sus resultados con un enlace privado.

## Quién hace qué

| | Consultor (auditor) | Cliente |
|---|---|---|
| Entra con | Cuenta de Google autorizada | Un enlace privado con código |
| Ve las preguntas y registra respuestas | Sí, navegando libremente (índice, atrás, saltar) | No |
| Escribe notas de la reunión por pregunta | Sí (solo las ve el consultor) | No las ve |
| Ve el panel con todas las sesiones y retoma cualquiera | Sí | No |
| Ve los resultados (puntaje, radar, brechas, plan, semáforo, alertas) | Sí, siempre | Sí, **lo que el consultor publicó**, en modo lectura |
| Descarga el PDF | Sí | Sí |
| Publica, actualiza o revoca el enlace del cliente | Sí | No |

La portada pública anterior (cuestionario abierto a cualquiera) **ya no existe**: sin cuenta autorizada no se puede responder.

## Cómo se usa en una reunión

1. El consultor ingresa con Google y pulsa **Nueva sesión** (empresa, sector, tamaño, contacto).
2. Conduce la reunión: lee la pregunta, usa «Ver ejemplos» con el cliente, marca la respuesta (`1`–`4` en el teclado, `Enter` para avanzar) y anota lo que comenta el cliente. El indicador de la barra superior muestra «Guardado». Si se cae internet, la sesión se guarda en el equipo y se sube sola al reconectar.
3. Puede salir en cualquier momento («Sesiones») y retomar después con **Continuar**: queda en la primera pregunta pendiente. Con el **Índice de preguntas** salta a cualquiera, y puede volver a una respuesta para cambiarla.
4. Al terminar abre **Resultados**, los revisa y pulsa **Compartir con el cliente → Publicar y crear enlace**. Copia el enlace y se lo envía.
5. Si después corrige una respuesta, la tarjeta de la sesión muestra «Cambios sin publicar» y el diálogo ofrece **Actualizar resultados publicados**. **Revocar enlace** lo desactiva de inmediato.

## Qué se guarda y dónde

Firebase Firestore, proyecto `aligndata-arcop`, **base nombrada `d360`** (región `southamerica-west1`). La base `(default)` es la del portal y no se toca.

```
sesiones/{id}          Solo consultores autorizados
  perfil               nombre, sector, tamaño, contacto, email
  respuestas           { "GOB-01": 3, ... }
  notas                { "GOB-01": "texto", ... }   ← privadas
  estado, avance, hechas, total, puntaje, nivel     (resumen para el panel)
  compartido           { token, en } | null
  creadoPor, creadoEn, actualizadoEn, actualizadoPor, version

compartidos/{token}    Lectura por enlace; solo consultores escriben
  perfil               nombre, sector, tamaño         ← sin email ni contacto
  respuestas           solo las de preguntas visibles
  publicadoEn, version
```

## Seguridad

Las reglas están en [`firestore.d360.rules`](../firestore.d360.rules):

- **Sesiones:** solo cuentas de Google con correo verificado que estén en la lista de la regla.
- **Resultados compartidos:** se leen uno a uno con el token (24 bytes al azar = 192 bits, 32 caracteres); **no se pueden listar**. Solo admiten los campos `perfil`, `respuestas`, `publicadoEn` y `version`, así que nunca viajan notas ni datos de contacto.
- Todo lo demás está denegado.
- Las claves de `firebase-config.js` son identificadores públicos del cliente; **la protección son las reglas**, no esas claves.
- El enlace del cliente no se indexa (`noindex`) ni se filtra por Referer (`no-referrer`). Quien tenga el enlace ve los resultados: se trata como un secreto y se puede revocar.
- El cliente no guarda nada en su equipo. Al cerrar sesión, el consultor borra la copia local de la base.
- Todo texto ingresado por personas (empresa, notas) se escapa antes de mostrarse.

**Protección de datos (Ley 21.719).** Se guarda lo mínimo: datos de la empresa, un contacto opcional, respuestas y notas. Conviene definir cuánto tiempo se conservan las sesiones y avisar al cliente de esto en la reunión. Hoy no hay botón para eliminar una sesión (se hace desde la consola de Firebase).

## Archivos

| Archivo | Rol |
|---|---|
| `public/nube.js` | Firebase Auth (Google) + Firestore: sesiones, guardado automático, enlace compartido |
| `public/sesiones.js` | Pantallas del consultor (ingreso, panel, compartir) y vista del cliente |
| `public/firebase-config.js` | Configuración pública. **Si se elimina, la app vuelve al modo local** (sin sesiones en la nube) |
| `public/app.js` | Motor y cuestionario: navegación libre, notas, `pub()` (qué se publica), `res()` (resumen) |
| `public/dev/nube-mock.js` | Simulador para probar sin nube (`http://localhost:5199/?mock=1`); no se publica |
| `firestore.d360.rules`, `firestore.indexes.json`, `firebase.json` | Reglas e índices de la base `d360` |

## Puesta en marcha (una sola vez)

Cada paso cambia el proyecto de producción, por eso se hacen con visto bueno:

```bash
# 1. Crea la base «d360» en southamerica-west1 y publica sus reglas (no toca la base del portal)
npx firebase-tools deploy --only firestore:d360 --project aligndata-arcop
```

2. Consola de Firebase → **Authentication → Sign-in method** → activar **Google**.
3. **Authentication → Settings → Authorized domains** → agregar `d360-assessment.web.app` (sin esto el popup de Google falla).
4. Publicar la app:

```bash
npx firebase-tools deploy --only hosting:d360 --project aligndata-arcop
```

5. Probar: ingresar con una cuenta autorizada, crear una sesión, publicar el enlace y abrirlo en una ventana de incógnito.

## Autorizar a otro consultor

Agregar su correo a la lista `esConsultor()` en `firestore.d360.rules` y publicar de nuevo las reglas:

```bash
npx firebase-tools deploy --only firestore:d360 --project aligndata-arcop
```

Hoy están autorizados `carlos.jerez@aligndata.cl` y `jerezcarlos70@gmail.com`.

## Límites conocidos

- Una sesión debe ser conducida por **una persona a la vez**: si dos consultores la editan a la vez, gana la última escritura.
- El enlace del cliente muestra una **foto** de lo publicado; no se actualiza solo hasta que el consultor pulsa «Actualizar».
- No hay registro de auditoría de quién cambió qué (solo `actualizadoPor` de la última edición).
- No se puede eliminar una sesión desde la app.

## Pruebas

`npm run verificar` (sección 10) comprueba la navegación entre preguntas, que lo publicado nunca incluya notas ni contactos, que el guardado vaya a la nube y no al navegador, el escape de HTML y las reglas de seguridad (sin listado público, solo lectura puntual de un resultado compartido, base `d360` únicamente).

Las reglas se validaron con `firebase deploy --dry-run` (compilan). **No se probaron contra la nube real**: el flujo completo (ingreso, panel, notas, navegación, publicar, ver como cliente, revocar) se probó con el simulador local, y el trabajo sin conexión no se probó. Tras la puesta en marcha hay que repetir la prueba del paso 5 con Firebase de verdad.
