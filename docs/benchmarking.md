# Fase 2 — Investigación previa (benchmarking)

Objetivo: ver qué aplicaciones o servicios parecidos a SolOcupa existen, qué hacen bien y qué podemos aportar o mejorar.

> Búsqueda realizada el 14/10/2026. Precios y funciones según webs comerciales y comparadores: conviene confirmarlos en la web de cada producto.

---

## 1. Software comercial de *revenue management* (para un hotel concreto)

Son las herramientas profesionales que usan los hoteles para predecir la demanda y fijar precios. Trabajan con los **datos internos del hotel** (reservas, cancelaciones, precios de la competencia).

| Producto | Qué hace | Para quién | Precio orientativo | Qué podemos mirar |
|---|---|---|---|---|
| **IDeaS** (grupo SAS) | Previsión de demanda con IA y analítica avanzada, recomendación de precios | Cadenas y hoteles grandes (más de 16.000 clientes en 144 países, según la propia empresa) | A medida (caro) | Cómo presentan la previsión y su margen de error |
| **Duetto** | Plataforma en la nube: precios, previsión, grupos y rentabilidad | Hoteles, *resorts* y casinos | Unos 10 $ por habitación al mes (según comparadores) | El concepto de "precio abierto": precio distinto según día y canal |
| **Atomize** | Precios dinámicos y gestión de ingresos automática; incluye previsión de demanda | Hoteles medianos | Los comparadores no coinciden: desde gratis hasta unos 19 $ al mes | Interfaz sencilla, todo automatizado |
| **RoomPriceGenie** | Precios automáticos y una "estrategia de ocupación" (ocupación objetivo, antelación de las reservas…) | Hoteles independientes y pequeños | Suscripción por planes | Su enfoque "fácil para pequeños hoteles" y su guía gratuita de previsión |
| **FLYR (antes Pace)** | Previsión y precios con *machine learning* | Hoteles y aerolíneas | A medida | — |

**Conclusión:** son muy potentes, pero **de pago, cerrados** (no se sabe cómo calculan) y necesitan los datos de reservas del hotel. Un hotel pequeño de la Costa del Sol sin presupuesto no tiene acceso a una previsión de su zona.

## 2. Previsiones y estadísticas del destino (Costa del Sol y Andalucía)

| Fuente | Qué ofrece | Limitación |
|---|---|---|
| **AEHCOS** (Asociación de Empresarios Hoteleros de la Costa del Sol) | **Previsiones mensuales de ocupación por municipio**, publicadas en prensa. Ejemplo: agosto de 2026, 88,87 % de media (Benalmádena 95,22 %, Torremolinos 93,64 %, Málaga 90,27 %, Fuengirola 90,25 %, Marbella 85,78 %); septiembre de 2026, 86,51 %. Julio de 2026 cerró en el 89,50 %, por encima del 86,37 % previsto. | Es una nota de prensa, sin herramienta interactiva ni histórico consultable. Se basa en encuestas a sus asociados, no en un modelo público. |
| **SAETA / Oficina del Dato** (Junta de Andalucía) | Encuestas puntuales de ocupación en fechas clave (Semana Santa, puente de diciembre…), con desglose por provincia. Ejemplo: puente de la Constitución de 2024, Málaga al 64,2 %. | Solo fechas concretas, en PDF. |
| **INE — Encuesta de Ocupación Hotelera** | Datos oficiales mensuales por zona y municipio (es **nuestra fuente**). | Solo datos históricos, sin predicción. Tablas difíciles de consultar para un hotelero. |
| **STR / CoStar** | Comparativa de ocupación, ADR (precio medio por habitación) y RevPAR (ingreso por habitación disponible) frente a la competencia, con informes de mercado (por ejemplo, Barcelona o Madrid). | De pago y orientado a cadenas. |
| **Mabrian** | Inteligencia turística de destinos: previsiones de llegadas y conectividad aérea de los destinos de costa españoles. | De pago y orientado a administraciones; no predice la ocupación hotelera de un municipio. |
| **ForwardKeys / Amadeus** | Previsión de llegadas a partir de las **reservas de vuelos**. | De pago. Además, el grueso de las reservas aéreas se hace con solo 30–40 días de antelación, así que no sirve para planificar con muchos meses. |

## 3. Proyectos académicos y de código abierto

| Proyecto | Qué hace | Diferencia con SolOcupa |
|---|---|---|
| **Kaggle "Hotel Booking Demand"** (119.000 reservas de un hotel urbano y un hotel de playa en Portugal) | Casi todos los proyectos con este dataset predicen **cancelaciones** (por ejemplo, con regresión logística). Algunos predicen ingresos diarios. | Son cuadernos (*notebooks*), no aplicaciones para un usuario final, y usan datos de Portugal, no de la Costa del Sol. |

---

## 4. Huecos que hemos detectado y cómo los cubre SolOcupa

| Lo que falta en el mercado | Qué aporta SolOcupa |
|---|---|
| Las herramientas buenas son de pago y cerradas | **Gratuita y transparente**: muestra el error real del modelo y lo compara con la referencia simple |
| Las previsiones de AEHCOS son notas de prensa sin histórico | **Panel interactivo** con el histórico desde 1999, la comparativa de municipios y la estacionalidad |
| Los datos del INE son difíciles de consultar | Datos del INE ya limpios, visualizados y descargables en CSV |
| Hacen falta datos internos del hotel | Funciona solo con datos públicos: útil para hoteles pequeños o para planificar antes de abrir |
| Previsión sin traducir a decisiones | Pasa la ocupación prevista a plazas ocupadas, personal orientativo y recomendaciones de precio |

## 5. Ideas de mejora sacadas del benchmarking (para elegir en las fases 3–5)

Mantenemos la app sencilla; estas son opciones, no obligaciones:

1. **Comparar nuestra predicción con la de AEHCOS** en el mismo mes (por ejemplo, agosto de 2026). Ojo: AEHCOS mide la ocupación por habitaciones y el INE nuestra ocupación por plazas, así que conviene comparar con la columna `ocupacion_habitaciones`.
   Primer dato: para agosto de 2026, AEHCOS preveía un 88,87 % y el INE ha publicado un 89,93 % de ocupación por habitaciones en la Costa del Sol. Los ámbitos no son idénticos (provincia frente a zona turística), pero sirve de referencia.
2. **Selector "ocupación por plazas" o "por habitaciones"**, porque los hoteleros suelen hablar por habitaciones.
3. **Explicación en lenguaje sencillo** de cada predicción ("se espera algo menos que el año pasado porque los últimos meses vienen a la baja").
4. **Botón "Descargar informe"** (imprimir o PDF) con la predicción, como hacen los productos comerciales.
5. **Indicar la fecha de Semana Santa** en el gráfico cuando cae en marzo o en abril, porque mueve la ocupación unos 7 puntos entre esos meses.

---

## Fuentes

- Comparativas de revenue management: [Toolradar: IDeaS vs. Atomize](https://toolradar.com/compare/ideas-vs-atomize), [Toolradar: IDeaS vs. Duetto](https://toolradar.com/compare/ideas-vs-duetto), [Oaky: herramientas de revenue management](https://oaky.com/blog/revenue-management-tools-for-hotels), [The Caterer: guía tecnológica 2025](https://thecaterer.com/products--equipment/technology-buying-guide-2025-how-to-maximise-hotel-occupancy), [Alternativas a FLYR](https://www.softwarereviews.com/categories/217/products/7390/alternatives)
- RoomPriceGenie: [estrategia de ocupación](https://help.roompricegenie.com/knowledge/occupancy-strategy?hsLang=en), [ficha en HotelTechReport](https://hoteltechreport.com/revenue-management/revenue-management-systems/roompricegenie), [guía de previsión](https://hoteltechreport.com/es/news/roompricegenie-drops-new-free-guide-forecasting-made-simple)
- AEHCOS: [El Español, 31/07/2026](https://www.elespanol.com/malaga/20260731/hoteles-costa-sol-rozaran-ocupacion-agosto-pese-bajar-respecto/1003744340093_0.html), [Hosteltur: previsión de junio](https://www.hosteltur.com/157567_hoteles-de-la-costa-del-sol-preven-un-85-de-ocupacion-en-junio.html)
- SAETA: [encuesta del puente de la Constitución de 2024](https://multimedia.andalucia.org/saeta/epo_const_inm_2024.pdf), [encuesta de Semana Santa 2024](https://multimedia.andalucia.org/saeta/epo_semana_santa_2024.pdf)
- STR/CoStar: [nota de prensa sobre Barcelona](https://www.costar.com/es-es/productos/str-benchmark/recursos/notas-de-prensa/formula-one-drove-barcelona-hotel-adr-and-revpar-all-time-highs-june)
- ForwardKeys: [Hosteltur: previsión de llegadas de verano](https://www.hosteltur.com/150891_este-es-el-pronostico-de-llegadas-de-turistas-a-espana-para-el-verano.html), [La Moncloa: previsiones de verano 2022](https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/industria/Documents/2022/300622-PrevisionesTuristicasVerano.pdf)
- Mabrian: no encontramos su informe original; conviene consultarlo directamente en mabrian.com
- Kaggle Hotel Booking Demand: [Towards Data Science](https://towardsdatascience.com/predicting-a-hotel-booking-demand-7608a7dbf5a4), [proyecto en GitHub](https://github.com/NguyenThai1705/hotel_booking_demand_proj)
