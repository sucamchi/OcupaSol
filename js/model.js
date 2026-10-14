/*
 * Modelo de predicción de ocupación hotelera (grado de ocupación por plazas, %).
 *
 * Idea: la ocupación de un mes se parece mucho a la del mismo mes del año anterior
 * (estacionalidad). El modelo aprende, con una regresión lineal (ridge), cuánto
 * se va a desviar este año respecto al anterior a partir de:
 *   - tendencia reciente: variación interanual media de los últimos 3 meses conocidos
 *   - cambio del año pasado en ese mismo mes (captura el "rebote" o vuelta a la media)
 *   - tendencia reciente x horizonte (la tendencia pierde fuerza cuanto más lejos predecimos)
 *
 *   ocupación(t) = ocupación(t-12) + w · features
 *
 * Los meses de la COVID (mar-2020 a dic-2021) se excluyen del entrenamiento.
 */
(function (global) {
  "use strict";

  const COVID_DESDE = "2020-03";
  const COVID_HASTA = "2021-12";
  const VENTANA_TENDENCIA = 3;
  const HORIZONTE_MAX = 12;
  const LAMBDA = 10;

  const esCovid = (f) => f >= COVID_DESDE && f <= COVID_HASTA;

  function desplazar(fecha, meses) {
    const [a, m] = fecha.split("-").map(Number);
    const t = a * 12 + (m - 1) + meses;
    const anio = Math.floor(t / 12);
    const mes = (t % 12) + 1;
    return `${anio}-${String(mes).padStart(2, "0")}`;
  }

  function mesesEntre(desde, hasta) {
    const [a1, m1] = desde.split("-").map(Number);
    const [a2, m2] = hasta.split("-").map(Number);
    return (a2 * 12 + m2) - (a1 * 12 + m1);
  }

  /** Serie {fecha: valor} válida (sin huecos ni meses COVID). */
  function crearSerie(registros, zona, campo = "ocupacion_plazas") {
    const serie = new Map();
    for (const r of registros) {
      if (r.zona !== zona || r[campo] === null || r[campo] === undefined) continue;
      serie.set(r.fecha, Number(r[campo]));
    }
    return serie;
  }

  const valido = (serie, f) => serie.has(f) && !esCovid(f);

  function tendencia(serie, origen) {
    const difs = [];
    for (let k = 0; k < VENTANA_TENDENCIA; k++) {
      const f = desplazar(origen, -k);
      const l = desplazar(f, -12);
      if (valido(serie, f) && valido(serie, l)) difs.push(serie.get(f) - serie.get(l));
    }
    return difs.length ? difs.reduce((a, b) => a + b, 0) / difs.length : 0;
  }

  /** Vector de características para predecir `objetivo` sabiendo datos hasta `origen`. */
  function caracteristicas(serie, objetivo, origen) {
    const l12 = desplazar(objetivo, -12);
    const l24 = desplazar(objetivo, -24);
    if (!valido(serie, l12)) return null;
    const tend = tendencia(serie, origen);
    const cambioAnterior = valido(serie, l24) ? serie.get(l12) - serie.get(l24) : 0;
    const horizonteAnios = mesesEntre(origen, objetivo) / 12;
    return [1, tend, cambioAnterior, horizonteAnios * tend];
  }

  /** Resuelve (XᵀX + λI)w = Xᵀy por eliminación de Gauss-Jordan (sin penalizar el término independiente). */
  function ridge(X, y, lambda) {
    const n = X[0].length;
    const A = Array.from({ length: n }, (_, i) => {
      const fila = new Array(n + 1).fill(0);
      for (let k = 0; k < X.length; k++) {
        for (let j = 0; j < n; j++) fila[j] += X[k][i] * X[k][j];
        fila[n] += X[k][i] * y[k];
      }
      if (i > 0) fila[i] += lambda;
      return fila;
    });
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let j = c; j <= n; j++) A[r][j] -= f * A[c][j];
      }
    }
    return A.map((fila, i) => fila[n] / fila[i]);
  }

  /** Entrena con todos los meses anteriores a `hastaExcl` (formato AAAA-MM). */
  function entrenar(serie, hastaExcl) {
    const X = [];
    const y = [];
    for (const f of [...serie.keys()].sort()) {
      if (f >= hastaExcl || esCovid(f)) continue;
      for (let h = 1; h <= HORIZONTE_MAX; h++) {
        const origen = desplazar(f, -h);
        if (esCovid(origen)) continue;
        const x = caracteristicas(serie, f, origen);
        if (!x) continue;
        X.push(x);
        y.push(serie.get(f) - serie.get(desplazar(f, -12)));
      }
    }
    if (X.length < 24) return null;
    return { pesos: ridge(X, y, LAMBDA), muestras: X.length };
  }

  function predecirMes(modelo, serie, objetivo, origen) {
    const x = caracteristicas(serie, objetivo, origen);
    if (!x) return null;
    const delta = x.reduce((s, v, i) => s + v * modelo.pesos[i], 0);
    const valor = serie.get(desplazar(objetivo, -12)) + delta;
    return Math.min(100, Math.max(0, valor));
  }

  /**
   * Validación (backtesting): entrena hasta un punto, predice los 12 meses
   * siguientes y lo compara con lo que pasó de verdad. Se repite con 3 cortes.
   * Línea base = "naïve estacional" (mismo mes del año anterior).
   */
  function validar(serie, cortes = 3) {
    const fechas = [...serie.keys()].sort();
    const errores = [];
    const erroresBase = [];
    let ultimo = [];
    for (let b = 0; b < cortes; b++) {
      const fin = fechas.length - 12 * b;
      const prueba = fechas.slice(fin - 12, fin);
      if (prueba.length < 12) break;
      const origen = desplazar(prueba[0], -1);
      const modelo = entrenar(serie, prueba[0]);
      if (!modelo) break;
      const puntos = [];
      for (const f of prueba) {
        if (esCovid(f)) continue;
        const p = predecirMes(modelo, serie, f, origen);
        if (p === null) continue;
        const real = serie.get(f);
        errores.push(p - real);
        erroresBase.push(serie.get(desplazar(f, -12)) - real);
        puntos.push({ fecha: f, real, prediccion: p });
      }
      if (b === 0) ultimo = puntos;
    }
    const mae = (e) => e.reduce((s, v) => s + Math.abs(v), 0) / (e.length || 1);
    const rmse = (e) => Math.sqrt(e.reduce((s, v) => s + v * v, 0) / (e.length || 1));
    return {
      n: errores.length,
      mae: mae(errores),
      rmse: rmse(errores),
      maeBase: mae(erroresBase),
      ultimoCorte: ultimo,
    };
  }

  /** Predicción de los próximos `horizonte` meses tras el último dato disponible. */
  function pronosticar(serie, horizonte = HORIZONTE_MAX) {
    const fechas = [...serie.keys()].sort();
    const origen = fechas[fechas.length - 1];
    const modelo = entrenar(serie, desplazar(origen, 1));
    const validacion = validar(serie);
    // Intervalo aproximado al 90 % a partir del error real del backtesting
    const margen = 1.645 * validacion.rmse;
    const puntos = [];
    if (modelo) {
      for (let h = 1; h <= Math.min(horizonte, HORIZONTE_MAX); h++) {
        const f = desplazar(origen, h);
        const p = predecirMes(modelo, serie, f, origen);
        if (p === null) continue;
        puntos.push({
          fecha: f,
          prediccion: p,
          min: Math.max(0, p - margen),
          max: Math.min(100, p + margen),
        });
      }
    }
    return { origen, modelo, validacion, puntos };
  }

  global.Modelo = { crearSerie, pronosticar, validar, desplazar, esCovid };
})(window);
