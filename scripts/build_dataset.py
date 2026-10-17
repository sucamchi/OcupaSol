"""
Construye el dataset del proyecto a partir de la API pública del INE
(Encuesta de Ocupación Hotelera, EOH).

Genera:
  data/ocupacion_costa_del_sol.csv  -> dataset en formato CSV (evidencia)
  data/dataset.js                   -> mismo dataset embebido para la app .html

Uso:
  python scripts/build_dataset.py

Solo usa la librería estándar de Python (sin dependencias).
"""
import csv
import json
import os
import urllib.request
from datetime import datetime

API = "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/{tabla}?nult=400"

# Tablas de la EOH usadas
TABLA_ZONA_OCUP = 2013     # Establecimientos, plazas, grados de ocupación y personal por zonas turísticas
TABLA_ZONA_VIAJ = 2039     # Viajeros y pernoctaciones por zonas turísticas
TABLA_PUNTO_OCUP = 2076    # Ídem por puntos turísticos (municipios)
TABLA_PUNTO_VIAJ = 2078    # Viajeros y pernoctaciones por puntos turísticos
# Tarifa media diaria (ADR) de la Encuesta de Rentabilidad Hotelera (IRSH), desde 2021
TABLA_ZONA_ADR = 46297
TABLA_PUNTO_ADR = 46298

ZONA_INE = "Costa Del Sol (Málaga)"
ZONA_APP = "Costa del Sol (total)"
MUNICIPIOS = ["Málaga", "Torremolinos", "Benalmádena", "Fuengirola",
              "Marbella", "Estepona", "Nerja"]

# (columna del CSV, texto que identifica la serie en el nombre del INE)
METRICAS_OCUP = [
    ("ocupacion_plazas", "Grado de ocupación por plazas."),
    ("ocupacion_habitaciones", "Grado de ocupación por habitaciones."),
    ("ocupacion_fin_semana", "Grado de ocupación por plazas en fin de semana."),
    ("establecimientos", "Número de establecimientos abiertos estimados."),
    ("plazas", "Número de plazas estimadas."),
    ("habitaciones", "Número de habitaciones estimadas. Total categorías. Dato."),
    ("personal", "Personal empleado."),
]
METRICAS_VIAJ = [
    ("viajeros_residentes", "Viajeros.", "Residentes en España"),
    ("viajeros_extranjeros", "Viajeros.", "Residentes en el extranjero"),
    ("pernoctaciones_residentes", "Pernoctaciones.", "Residentes en España"),
    ("pernoctaciones_extranjeros", "Pernoctaciones.", "Residentes en el extranjero"),
]
COLUMNAS = (["fecha", "año", "mes", "zona"] + [m[0] for m in METRICAS_OCUP]
            + [m[0] for m in METRICAS_VIAJ] + ["tarifa_media"])


def descargar(tabla):
    print(f"Descargando tabla {tabla} del INE...")
    with urllib.request.urlopen(API.format(tabla=tabla), timeout=300) as r:
        return json.load(r)


def partes(nombre):
    """Divide el nombre de la serie en sus componentes ('Nacional', 'Marbella', ...)."""
    return [p.strip() for p in nombre.split(". ") if p.strip()]


def es_zona(nombre, zona):
    for p in partes(nombre):
        p = p.rstrip(".")
        # En algunos municipios el INE antepone el código: '29051-Estepona'
        if p == zona or p.split("-", 1)[-1] == zona or p == f"Andalucía: {zona}":
            return True
    return False


def serie_a_dict(serie):
    datos = {}
    for d in serie["Data"]:
        if d.get("Valor") is None or d.get("Secreto"):
            continue
        # FK_Periodo es el mes (1-12). Usamos Anyo/FK_Periodo en vez de 'Fecha'
        # porque 'Fecha' está en hora española y en UTC cae en el mes anterior.
        anio, mes = d["Anyo"], d["FK_Periodo"]
        if not 1 <= mes <= 12:
            continue
        datos[f"{anio:04d}-{mes:02d}"] = d["Valor"]
    return datos


def extraer(tabla_ocup, tabla_viaj, tabla_adr, zona_ine, zona_app, filas):
    for col, clave in METRICAS_OCUP:
        series = [s for s in tabla_ocup if clave in s["Nombre"] and es_zona(s["Nombre"], zona_ine)
                  and (col == "habitaciones" or "habitaciones estimadas" not in s["Nombre"])]
        if not series:
            print(f"  AVISO: sin serie '{col}' para {zona_app}")
            continue
        for fecha, valor in serie_a_dict(series[0]).items():
            filas.setdefault((fecha, zona_app), {})[col] = valor
    for col, clave, residencia in METRICAS_VIAJ:
        series = [s for s in tabla_viaj if clave in s["Nombre"] and residencia in s["Nombre"]
                  and es_zona(s["Nombre"], zona_ine)]
        if not series:
            print(f"  AVISO: sin serie '{col}' para {zona_app}")
            continue
        for fecha, valor in serie_a_dict(series[0]).items():
            filas.setdefault((fecha, zona_app), {})[col] = valor
    # El INE da el dato y su tasa de variación; nos quedamos con el dato en euros
    series = [s for s in tabla_adr if "Total categorías. Dato." in s["Nombre"]
              and es_zona(s["Nombre"], zona_ine)]
    if not series:
        print(f"  AVISO: sin serie 'tarifa_media' para {zona_app}")
        return
    for fecha, valor in serie_a_dict(series[0]).items():
        filas.setdefault((fecha, zona_app), {})["tarifa_media"] = valor


def main():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zona_ocup, zona_viaj = descargar(TABLA_ZONA_OCUP), descargar(TABLA_ZONA_VIAJ)
    punto_ocup, punto_viaj = descargar(TABLA_PUNTO_OCUP), descargar(TABLA_PUNTO_VIAJ)
    zona_adr, punto_adr = descargar(TABLA_ZONA_ADR), descargar(TABLA_PUNTO_ADR)

    filas = {}
    extraer(zona_ocup, zona_viaj, zona_adr, ZONA_INE, ZONA_APP, filas)
    for m in MUNICIPIOS:
        extraer(punto_ocup, punto_viaj, punto_adr, m, m, filas)

    registros = []
    for (fecha, zona), valores in sorted(filas.items(), key=lambda x: (x[0][1], x[0][0])):
        if "ocupacion_plazas" not in valores:
            continue
        anio, mes = fecha.split("-")
        registro = {"fecha": fecha, "año": int(anio), "mes": int(mes), "zona": zona}
        for col in COLUMNAS[4:]:
            registro[col] = valores.get(col)
        registros.append(registro)

    os.makedirs(os.path.join(raiz, "data"), exist_ok=True)
    ruta_csv = os.path.join(raiz, "data", "ocupacion_costa_del_sol.csv")
    with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNAS)
        w.writeheader()
        for r in registros:
            w.writerow({k: ("" if v is None else v) for k, v in r.items()})

    meta = {
        "fuente": "INE - Encuesta de Ocupación Hotelera (tablas 2013, 2039, 2076, 2078) "
                  "e Indicadores de Rentabilidad Hotelera (tablas 46297, 46298)",
        "generado": datetime.now().strftime("%Y-%m-%d"),
        "registros": len(registros),
        "columnas": COLUMNAS,
    }
    ruta_js = os.path.join(raiz, "data", "dataset.js")
    with open(ruta_js, "w", encoding="utf-8") as f:
        f.write("// Archivo generado por scripts/build_dataset.py. No editar a mano.\n")
        f.write("window.DATASET_META = " + json.dumps(meta, ensure_ascii=False) + ";\n")
        f.write("window.DATASET = " + json.dumps(registros, ensure_ascii=False, separators=(",", ":")) + ";\n")

    print(f"OK: {len(registros)} registros -> {ruta_csv}")
    por_zona = {}
    for r in registros:
        por_zona.setdefault(r["zona"], []).append(r["fecha"])
    for z, fs in por_zona.items():
        print(f"  {z}: {len(fs)} meses ({min(fs)} a {max(fs)})")


if __name__ == "__main__":
    main()
