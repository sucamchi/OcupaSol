# Registro de prompts e iteraciones

La entrega final pide documentar el proceso: idea, prompts, iteraciones y mejoras. Añadid una entrada por cada iteración.

---

## Iteración 1 — Estructura inicial (MVP)

**Herramienta:** Claude Code (agente de IA)
**Fecha:** 14/10/2026

### Prompts (tal como se escribieron)

**Prompt 1 — Elección de la idea (Fase 1)**

> tenemos que realziar un proyecto para nuestro curso de big data y programacion en IA con la siguientes pautas @"Módulo 5_1 - PROYECTO.pptx" y tenemos tres ideas: un predictor de ocupancia hotelera para empresas en la costa del sol, un chat bot para resolver dudas que pueda tener el estudiante sobre el temario de Programación en Inteligencia Artificial y Big Data aplicables en entornos 5G 98/2024/LJ/0001 29-0047 (el curso que estamos haciendo) y una aplicacion para personas de vision reducida que la ia peuda detectar e identificar obstaculos y avisar al usuario, segun las pautas del proyecto, que idea seria mas factible y sencillo implementar?

**Prompt 2 — Ficha de la Fase 1 y creación de la app**

> creame creame la ficha de la fase 1 en el readme y empieza a desarrollar la aplicacion en html con sus archivos necesarios en mi repositorio de github @proyectoIABD\ ponte al lio

**Prompt 3 — Investigación previa (benchmarking, Fase 2)**

> naa olvidalo, vamos a dejarlo sencillo, en la fase 2 necesitamos que compruebes si ya existen esta aplicacion o similares para que podamos mirarlas y ver que podemos mejorar

**Prompt 4 — Correcciones de nombre y columna**

> OcupaSol es el nombre correcto, se escribe "año", corrije todo y vuelve a subirlo

**Prompt 5 — Publicación**

> puedes activar github pages para OcupaSol?

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

```text
# ROL
Actúa como desarrollador web full-stack y científico de datos con experiencia en el sector hotelero.

# CONTEXTO
Somos un equipo de 3 alumnas del curso "Programación en Inteligencia Artificial y Big Data
aplicables en entornos 5G". Vamos a crear OcupaSol, una aplicación web B2B que ayuda a los
hoteles de la Costa del Sol a anticipar su ocupación para planificar personal, precios y campañas.
La ocupación en la zona es muy estacional (≈45 % en invierno y más del 80 % en agosto).

# OBJETIVO
Genera una aplicación web funcional que prediga el grado de ocupación hotelera por plazas (%)
de los próximos 12 meses, por zona, y traduzca la predicción en recomendaciones de negocio.

# DATOS
- Dataset CSV del INE (Encuesta de Ocupación Hotelera), con más de 2.000 registros mensuales
  desde 1999 de la Costa del Sol (total) y 7 municipios: Málaga, Torremolinos, Benalmádena,
  Fuengirola, Marbella, Estepona y Nerja.
- Columnas: fecha (AAAA-MM), año, mes, zona, ocupacion_plazas, ocupacion_habitaciones,
  ocupacion_fin_semana, establecimientos, plazas, personal, viajeros_residentes,
  viajeros_extranjeros, pernoctaciones_residentes, pernoctaciones_extranjeros.
- Incluye el dataset también como archivo .js para que la app funcione sin servidor.

# FUNCIONALIDADES
1. Selector de zona que actualice toda la app.
2. Pestaña "Panel": indicadores clave (ocupación del último mes y variación interanual, media
   de 12 meses, plazas, % de clientes extranjeros), gráfico de evolución, comparativa de
   municipios, gráfico de origen de los clientes y mapa de calor de estacionalidad (año x mes).
3. Pestaña "Predicción": formulario con mes objetivo, plazas del hotel y precio medio (opcional).
   Debe mostrar la ocupación prevista con un intervalo del 90 %, las plazas ocupadas estimadas,
   el personal orientativo, un nivel de demanda (alto/medio/bajo respecto al histórico de la zona)
   y recomendaciones de precio y gestión.
4. Modelo: regresión lineal en JavaScript que parta del mismo mes del año anterior y lo corrija
   con la tendencia reciente. Excluye los meses de la COVID (mar-2020 a dic-2021).
5. Validación: compara el error del modelo (MAE) con la referencia "igual que el año pasado"
   en los últimos 3 años y muéstralo en un gráfico real frente a predicho.
6. Pestaña "Datos": tabla filtrable por año y botón para descargar el CSV.
7. Pestaña "Acerca de": fuente de los datos, explicación del modelo y limitaciones.

# REQUISITOS TÉCNICOS
- HTML, CSS y JavaScript sin frameworks; gráficos con Chart.js desde un CDN.
- Archivos separados: index.html, css/styles.css, js/model.js, js/app.js, data/.
- Diseño responsive (móvil sin scroll horizontal), modo claro y oscuro, todo en español.
- Seguridad: sin claves de API ni datos personales, validación de las entradas del formulario y
  escapado del texto que se inserte en la página.
- Si no cargan los datos o la librería de gráficos, mostrar un mensaje de error claro.

# FORMATO DE SALIDA
Entrega el código completo de cada archivo, indicando su ruta. Después añade una breve explicación
de cómo ejecutar la app y una lista de limitaciones conocidas.
```

### Análisis del código generado

- _¿Qué funcionaba?_
- _¿Qué errores había y cómo se corrigieron?_

---

## Iteración 3: Nuevas funcionalidades (Semana Santa, habitaciones y precio, bienvenida, logo y fondos)

**Herramienta:** Claude Code (agente de IA)
**Fecha:** 17/10/2026

### Prompt (tal como se escribió)

> okay, i want you to implement these new features to my ocupasol app (in spanish of course, even though i am speaking english, the project is in spanish): add a way to deviation specifically for semana santa (usually end of may, beginning of april) as ocuppancy rises in that period, instead of the background being plain dark blue, i want them to be greyscaled pictures of costa del sol landmarks, which rotate depending on the page being viewed, create a logo for the OcupaSol brand, change the logic so it varies depending on the number on rooms my hotel has and the price i set my rooms at, adding some sliders for example, add a welcome page before showing the full website, here is what my colleague suggested: Creo que a la web habría que añadirle una página de bienvenida, diciendo lo que hace, que nos importa su privacidad, no tiene que dejar datos personales (ni los guardamos o vendemos),  con un botón que los lleve a la página de la predicción, check websites like WuBook and SiteMinder to take inspiration and copy how they work while respecting their privacy, so no registering or data, ask follow up questions if unsure and reject ideas if they can be implemented easily

Le hablo al agente en inglés porque suele mejorar la precisión. Traducido al español, el prompt sería:

> vale, quiero que implementes estas nuevas funcionalidades en mi app OcupaSol (en español, claro; aunque yo hable en inglés, el proyecto está en español): añade un ajuste específico para la Semana Santa (normalmente a finales de mayo, principios de abril), ya que la ocupación sube en ese periodo; en lugar de que el fondo sea azul oscuro liso, quiero que sean fotos en escala de grises de lugares emblemáticos de la Costa del Sol, que cambien según la página que se esté viendo; crea un logo para la marca OcupaSol; cambia la lógica para que varíe según el número de habitaciones de mi hotel y el precio que pongo a mis habitaciones, añadiendo por ejemplo unos controles deslizantes; añade una página de bienvenida antes de mostrar la web completa. Esto es lo que sugirió un miembro de mi equipo: Creo que a la web habría que añadirle una página de bienvenida, diciendo lo que hace, que nos importa su privacidad, no tiene que dejar datos personales (ni los guardamos o vendemos),  con un botón que los lleve a la página de la predicción. Mira webs como WuBook y SiteMinder para inspirarte y copiar cómo funcionan, pero respetando la privacidad de los usuarios, así que sin registro ni datos. Hazme preguntas si tienes dudas y rechaza las ideas si se pueden implementar fácilmente.



### Preguntas del agente y respuestas

| Pregunta | Respuesta elegida |
|---|---|
| ¿Cómo debe influir el precio? (el INE no publica una relación entre precio y ocupación) | Ingresos + elasticidad: el precio cambia los ingresos y, con una suposición sencilla, también la ocupación |
| ¿Habitaciones o plazas? | Habitaciones solo en el cálculo de "Tu hotel"; el panel y los gráficos siguen por plazas |
| ¿Fotos de fondo en qué modo? | En el modo claro y en el oscuro |
| ¿Cuándo se muestra la bienvenida? | En cada visita, sin guardar nada en el navegador |

### Resultado

- **Semana Santa:** nueva variable del modelo, calculada a partir de la fecha de Pascua de cada año: qué parte de la Semana Santa (del Domingo de Ramos al de Pascua) cae en el mes este año menos la que cayó el año anterior. Cae en marzo o en abril, no en mayo como decía el prompt.
- **Habitaciones y precio:** el formulario pasa a tener dos controles deslizantes que recalculan al momento. Se predice la ocupación por habitaciones y se muestran habitaciones ocupadas, ingresos del mes, RevPAR y personal recomendado.
- **Dataset:** dos columnas nuevas del INE, `habitaciones` (desde 2015) y `tarifa_media` (ADR en €, desde 2021, tablas 46297 y 46298). Las 14 columnas anteriores no cambian.
- **Bienvenida:** nueva pestaña "Inicio" con qué hace la app, cifras del dataset, tres ventajas, el bloque de privacidad y botones hacia la predicción. Estructura inspirada en la web de SiteMinder.
- **Logo:** `img/logo.svg` (sol, barras de ocupación que suben y mar), usado también como icono de la pestaña del navegador.
- **Fondos:** cinco fotos de Wikimedia Commons en blanco y negro, una por pestaña, con sus créditos en "Acerca de".

### Decisiones y errores encontrados

| Problema | Solución |
|---|---|
| Comparar con el mismo mes del año anterior falla cuando la Semana Santa cambia de mes | Variable "cambio de Semana Santa" en el modelo. En marzo y abril, el MAE baja de 4,55 a 4,33 p.p. (media de las 8 zonas, 6 cortes). Para 2027 sube marzo (de 59,0 a 60,8 %) y baja abril (de 69,0 a 67,4 %), porque la Semana Santa vuelve a marzo |
| No había datos de precios para relacionar precio y ocupación | Se descarga la tarifa media del INE y se usa como precio de referencia de la zona (mismo mes del año anterior). La relación precio-ocupación es una **suposición** (cobrar un 10 % más que la media llena un 10 % menos), indicada como tal en la app |
| El ratio de personal era por plaza ocupada y el formulario ahora pide habitaciones | Se añade la columna `habitaciones` del INE y el ratio pasa a ser por habitación ocupada |
| La web de WuBook solo mostraba la pantalla de inicio de sesión | Se tomó como referencia solo SiteMinder, sin registro ni recogida de datos |
| Wikimedia Commons cortaba las descargas (error 429) y una foto de Puerto Banús era un cartel | Se reintentó la descarga y se cambió por la Catedral de Málaga |
| La regla `display: flex` de la barra de zona ganaba al atributo `hidden` | Regla global `[hidden] { display: none !important; }` |

---

## Iteración 4 — (Fase 4) Prompt optimizado (máx. 500 palabras) con Antigravity

> _Prompt optimizado aquí._

---

## Iteración 5 — (Fase 5) Testeo y segunda iteración

| Prueba | Resultado esperado | Resultado obtenido | ¿OK? |
|---|---|---|---|
| Abrir `index.html` sin `#pestaña` | Se muestra la página de bienvenida | | |
| Mover los controles de habitaciones y precio | El resultado se actualiza al momento | | |
| Elegir marzo o abril | Aparece la recomendación de Semana Santa si cae en ese mes | | |
| Cambiar de pestaña | Cambia la foto de fondo | | |
| Cambiar de zona | Se actualizan todos los gráficos y la predicción | | |
| Abrir en el móvil | Diseño adaptado, sin scroll horizontal | | |
| Sin conexión a Internet | Aviso de que no carga Chart.js | | |
