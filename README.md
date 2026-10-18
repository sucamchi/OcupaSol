<p align="center"><img src="img/logo.svg" alt="Logo de OcupaSol" width="120"></p>

# [OcupaSol](https://sucamchi.github.io/OcupaSol/)

**Predictor de ocupación hotelera para la Costa del Sol**

OcupaSol es una aplicación web que predice el grado de ocupación hotelera de los próximos 12 meses en la Costa del Sol
y en sus principales municipios, para ayudar a los hoteles a planificar personal, precios y campañas.

> Proyecto del Módulo 5 del curso **Programación en Inteligencia Artificial y Big Data aplicables en entornos 5G**
> (98/2024/LJ/0001 29-0047).

---

## Fase 1: definición del proyecto

| Apartado | Definición |
|---|---|
| **Título** | **OcupaSol**: predictor de ocupación hotelera para la Costa del Sol |
| **1. Sector o industria** | Turismo / HORECA (hostelería) |
| **2. Proceso a mejorar** | **Toma de decisiones** y **análisis de datos (predicciones)**. Hoy muchos hoteles planifican plantilla, tarifas y promociones "a ojo" o copiando el año anterior. La app anticipa la demanda de la zona para decidir con datos. |
| **3. Fuentes de datos** | **Encuesta de Ocupación Hotelera (EOH) del INE**, datos oficiales mensuales y públicos:<br>• Tabla 2013: establecimientos, plazas, grados de ocupación y personal por **zonas turísticas**<br>• Tabla 2039: viajeros y pernoctaciones por **zonas turísticas**<br>• Tabla 2076: establecimientos, plazas, ocupación y personal por **puntos turísticos** (municipios)<br>• Tabla 2078: viajeros y pernoctaciones por **puntos turísticos**<br>• Tablas 46297 y 46298: tarifa media diaria (ADR) por zonas y puntos turísticos (desde 2021)<br>**Dataset creado:** `data/ocupacion_costa_del_sol.csv` con **2.035 registros mensuales** (1999–2026) de la Costa del Sol y 7 municipios (Málaga, Torremolinos, Benalmádena, Fuengirola, Marbella, Estepona y Nerja), 16 variables cada uno. |
| **4. Usuario final** | **Empresas (B2B)**: directores de hotel, *revenue managers* y responsables de RR. HH. de hoteles de la Costa del Sol. Usuarios secundarios: analistas de turismo y administraciones públicas. |
| **5. Capacidad de IA principal** | **Predicción (modelo supervisado)**: regresión lineal regularizada (ridge) entrenada con series temporales, que aprende cómo cambia la ocupación respecto al mismo mes del año anterior según la tendencia reciente. Se valida con *backtesting* frente a un modelo de referencia. |
| **6. Tipo de interacción** | **Dashboard interactivo**, **formulario inteligente** y **sistema de recomendaciones**: el usuario elige zona y mes y mueve los controles de habitaciones (hasta 150, pensado para pymes) y precio de su hotel; recibe al momento la ocupación prevista, un intervalo de confianza, las habitaciones ocupadas, los ingresos del mes, el personal recomendado y consejos de precio y gestión. |

### Problema que resuelve

La ocupación en la Costa del Sol es muy estacional (≈45 % en invierno frente a más del 80 % en agosto) y cambia de un año a otro.
Si un hotel se equivoca al prever la demanda:

- **Contrata personal de más o de menos**, con sobrecostes o un servicio peor.
- **Fija precios equivocados**: pierde ingresos en temporada alta o no llena en temporada baja.
- **Lanza campañas en el momento equivocado.**

### Propuesta de valor

1. Predicción mensual de la ocupación a 12 meses, por zona, con su margen de error.
2. Traducción a decisiones concretas: habitaciones ocupadas, ingresos, plantilla orientativa y precio orientativo.
3. Panel con la evolución histórica, la comparativa entre municipios, el origen de los clientes y un mapa de estacionalidad.
4. Transparencia: la app muestra cuánto se equivoca el modelo y lo compara con la referencia más simple.

### Organización del equipo (máx. 3 personas)

| Integrante | Rol principal | Responsabilidades |
|---|---|---|
| Susana | Datos y modelo | Dataset INE, limpieza, modelo predictivo, validación |
| Mabel | Desarrollo y diseño | Prompts, interfaz HTML/CSS/JS, gráficos, usabilidad |
| Marta | Testing y documentación | Pruebas, registro de errores, documentación, presentación |

---

## Uso de la aplicación

1. Clona o descarga el repositorio.
2. Abre `index.html` en el navegador (doble clic). No hace falta servidor.
   - Hace falta conexión a Internet para cargar la librería de gráficos (Chart.js desde un CDN).
3. La página de **Inicio** explica qué hace la app y cómo tratamos tu privacidad. Desde ahí, elige una **zona** y navega por las pestañas:
   - **Panel**: indicadores clave, evolución, comparativa de municipios, origen de los clientes y estacionalidad.
   - **Predicción**: controles de habitaciones y precio de tu hotel → ocupación prevista, intervalo, ingresos, personal y recomendaciones; además, la fiabilidad del modelo.
   - **Datos**: tabla del dataset filtrable por año y descarga del CSV.
   - **Acerca de**: fuentes, modelo y limitaciones.

### Actualizar los datos

El dataset se descarga automáticamente de la API pública del INE:

```bash
python scripts/build_dataset.py
```

El script regenera `data/ocupacion_costa_del_sol.csv` (evidencia del dataset) y `data/dataset.js` (el mismo dataset embebido para que la app funcione sin servidor). Solo usa la librería estándar de Python.

## Estructura del repositorio

```
OcupaSol/
├── index.html                      # Aplicación web
├── css/styles.css                  # Estilos (solo modo oscuro)
├── img/
│   ├── logo.svg                    # Logo de OcupaSol (también es el favicon)
│   └── fondos/                     # Fotos propias de Málaga en blanco y negro, una por pestaña
├── js/
│   ├── model.js                    # Modelo predictivo + validación (backtesting)
│   └── app.js                      # Interfaz: pestañas, gráficos, formulario, tabla
├── data/
│   ├── ocupacion_costa_del_sol.csv # Dataset (2.035 registros, INE)
│   └── dataset.js                  # Dataset embebido para la app
├── scripts/build_dataset.py        # Descarga y construcción del dataset
├── docs/benchmarking.md            # Fase 2: aplicaciones similares y mejoras
├── docs/prompts.md                 # Registro de prompts e iteraciones
└── docs/speech.md                  # Guion de la videopresentación (2 min)
```

## Dataset

| Columna | Descripción |
|---|---|
| `fecha`, `año`, `mes` | Periodo mensual (AAAA-MM) |
| `zona` | Costa del Sol (total) o municipio |
| `ocupacion_plazas` | Grado de ocupación por plazas (%). **Variable a predecir** |
| `ocupacion_habitaciones` | Grado de ocupación por habitaciones (%) |
| `ocupacion_fin_semana` | Grado de ocupación por plazas en fin de semana (%) |
| `establecimientos`, `plazas`, `habitaciones`, `personal` | Oferta hotelera estimada y personal empleado (`habitaciones` desde 2015) |
| `viajeros_residentes`, `viajeros_extranjeros` | Viajeros alojados según residencia |
| `pernoctaciones_residentes`, `pernoctaciones_extranjeros` | Pernoctaciones según residencia |
| `tarifa_media` | Tarifa media diaria por habitación (ADR, €), desde 2021 |

Hay huecos puntuales (por ejemplo, abril–junio de 2020 por el cierre de la COVID, o meses que el INE no publica por secreto estadístico).

## Modelo predictivo

- **Idea:** la ocupación de un mes se parece mucho a la del mismo mes del año anterior. El modelo aprende a corregir ese valor con:
  la tendencia interanual de los últimos 3 meses, el cambio que hubo el año pasado en ese mes, la pérdida de fuerza de la tendencia cuanto más lejos se predice
  y el **cambio de fecha de la Semana Santa** (qué parte de la semana cae en ese mes este año frente al año anterior; puede caer en marzo o en abril).
- **Algoritmo:** regresión lineal ridge, resuelta en el navegador (JavaScript, sin librerías de ML).
- **Entrenamiento:** un modelo por zona. Se excluyen los meses de la COVID (marzo de 2020 a diciembre de 2021).
- **Validación:** *backtesting* con los 3 últimos años (36 meses de prueba). Se mide el MAE en puntos porcentuales y se compara con la referencia "igual que el año pasado".
- **Intervalo del 90 %:** ±1,645 × RMSE de la validación.
- **Tu hotel:** se usa la predicción de ocupación por habitaciones de la zona. Tu precio se compara con la tarifa media del INE para esa zona el mismo mes del año anterior,
  con una suposición simple (no aprendida de los datos): cobrar un 10 % más que la media llena un 10 % menos, y al revés.
- **Precio orientativo:** parte de esa tarifa media de la zona (con la suposición anterior, es el precio con el que más ingresa cada habitación):
  un 10 % más si la demanda prevista es alta, la media si es media y un 10 % menos si es baja. No depende del precio que pongas; la app te dice cuánto te alejas de él.

## Seguridad y fiabilidad

- No hay registro, claves de API ni datos personales: todo se ejecuta en el navegador y los datos del hotel no se guardan ni se envían.
- Las entradas del formulario se validan y todo el texto que se inserta en la página se escapa.
- La app muestra el error real del modelo y sus limitaciones, para no dar una falsa sensación de precisión.
