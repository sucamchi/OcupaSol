# Registro de prompts e iteraciones

La entrega final pide documentar el proceso: idea, prompts, iteraciones y mejoras. Añadid una entrada por cada iteración.

---

## Iteración 1 — Estructura inicial (MVP)

**Herramienta:** Claude Code (agente de IA)
**Fecha:** 14/10/2026

### Prompt

> Crea la ficha de la Fase 1 en el README y empieza a desarrollar la aplicación en HTML con sus archivos necesarios
> en el repositorio. Idea: predictor de ocupación hotelera para empresas de la Costa del Sol.

### Resultado

- Dataset real descargado de la API del INE (Encuesta de Ocupación Hotelera): 2.035 registros mensuales, 8 zonas.
- Script reproducible `scripts/build_dataset.py`.
- App `index.html` con 4 pestañas (Panel, Predicción, Datos, Acerca de), gráficos con Chart.js y un modelo predictivo en JS.

### Decisiones y errores encontrados

| Problema | Solución |
|---|---|
| Las fechas del INE (marca de tiempo en hora española) caían en el mes anterior al pasarlas a UTC | Se usan los campos `Anyo` y `FK_Periodo` en lugar de `Fecha` |
| Los meses de la COVID (2020–2021) distorsionan el entrenamiento | Se excluyen del entrenamiento y de la validación |
| Una regresión con variables por mes no mejoraba la referencia "igual que el año pasado" | Se cambió a predecir la **variación** respecto al año anterior usando la tendencia reciente: el MAE global bajó de 4,06 a 3,88 p.p. |
| Con umbrales fijos (80 % / 60 %), Marbella salía casi siempre con "demanda baja" | El nivel de demanda se calcula por terciles del histórico de cada zona |
| Abrir `index.html` sin servidor impide leer el CSV con `fetch` | El dataset se embebe también en `data/dataset.js` |

### Pendiente de evaluar

- En la Costa del Sol (total), el modelo es un 4 % peor que la referencia simple, mientras que en Marbella mejora un 7 %. Probad nuevas variables en la Fase 4.

---

## Iteración 2 — (Fase 2) Prompt estructurado

### Prompt

> _Pegad aquí el prompt de la Fase 2 (contexto, rol, objetivo, requisitos, formato de salida)._

### Análisis del código generado

- _¿Qué funcionaba?_
- _¿Qué errores había y cómo se corrigieron?_

---

## Iteración 3 — (Fase 4) Prompt optimizado (máx. 500 palabras) con Antigravity

> _Prompt optimizado aquí._

---

## Iteración 4 — (Fase 5) Testeo y segunda iteración

| Prueba | Resultado esperado | Resultado obtenido | ¿OK? |
|---|---|---|---|
| Plazas = 0 en el formulario | Mensaje de error | | |
| Cambiar de zona | Se actualizan todos los gráficos y la predicción | | |
| Abrir en el móvil | Diseño adaptado, sin scroll horizontal | | |
| Sin conexión a Internet | Aviso de que no carga Chart.js | | |
