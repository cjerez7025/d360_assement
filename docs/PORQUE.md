# Icono «¿por qué?» junto al riesgo

Junto a cada nivel de riesgo hay un icono de ayuda (círculo con «?»). Al pulsarlo se abre un recuadro que explica, con los números de esa sesión, por qué la etiqueta es la que es. No calcula nada nuevo: muestra las reglas que ya usa el modelo. Código: `public/porque.js`.

| Dónde está el icono | Qué explica |
|---|---|
| «Riesgo crítico / alto / medio» en **Brechas** y **Plan** | El puntaje de la dimensión, la escala (crítico hasta 30 %, alto hasta 55 %, medio hasta 79 %, 80 % o más no es brecha), cuánto falta para salir de ese riesgo y las respuestas que más bajaron el puntaje |
| «Nivel N — nombre» y «riesgo …» en **Perfil** | El puntaje global, las cinco bandas de madurez con la actual marcada, la meta (nivel 3) y, si hay ajustes por rubro y tamaño, el puntaje sin ellos |
| «Crítico» en **Alertas críticas** | La pregunta, la respuesta dada, por qué importa (la explicación legal de la pregunta), su base legal, que una alerta no cambia el puntaje y con qué respuesta deja de ser alerta |
| «Cumple / Parcial / No cumple» en **Semáforo** | El promedio de las preguntas de esa obligación, los umbrales y las respuestas que cuentan |

- El contenido se arma al pulsar, con las respuestas del momento; así siempre coincide con lo que se ve.
- Funciona igual para el consultor y para el cliente (enlace de resultados).
- No sale en los PDF.
- Si se cambian los umbrales del plan (`pl()` en `app.js`), hay que cambiar también `PQ_TRAMOS`; una prueba (sección 30 de `verificar`) comprueba que coinciden.

# Otros ajustes de esta pasada

- **«¿Quién participa?»** ya no deja atrapado: tiene ×, «Ahora no» y Esc, que cierran sin pedir el nombre (los avisos de la pantalla lo piden cuando haga falta). Un invitado de la reunión en vivo que aún no ha dado su nombre ve además «Salir de la reunión».
- **Barra de pestañas de resultados:** al activar una pestaña se trae a la vista (antes la última, «Alertas» o «Método», quedaba cortada en el borde en pantallas medianas) y los bordes se difuminan cuando hay más pestañas ocultas.
