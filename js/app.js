/* Lógica de la interfaz: pestañas, gráficos, formulario y tabla de datos. */
(function () {
  "use strict";

  const DATOS = window.DATASET || [];
  const META = window.DATASET_META || {};
  const ZONA_TOTAL = "Costa del Sol (total)";
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  // Suposición (no aprendida de los datos): cobrar un 10 % más que la media de la zona llena un 10 % menos
  // Con esta regla, cada habitación ingresa más cobrando la media de la zona: recomendaciones() parte de ahí
  const ELASTICIDAD = 1;
  const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"];

  const $ = (sel) => document.querySelector(sel);
  const graficos = {};
  let rangoAnios = 3;

  const fmt = (n, dec = 1) => (n === null || n === undefined || Number.isNaN(n)) ? "–"
    : n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const etiquetaMes = (f) => { const [a, m] = f.split("-"); return `${MESES[+m - 1]} ${a}`; };
  const etiquetaMesLarga = (f) => { const [a, m] = f.split("-"); return `${MESES_LARGOS[+m - 1]} de ${a}`; };

  function css(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }

  // Escapa texto antes de insertarlo como HTML (los valores vienen del dataset, pero mejor no fiarse)
  function esc(t) {
    return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function registrosZona(zona) {
    return DATOS.filter((r) => r.zona === zona).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  const zonas = () => {
    const z = [...new Set(DATOS.map((r) => r.zona))].filter((x) => x !== ZONA_TOTAL).sort((a, b) => a.localeCompare(b, "es"));
    return [ZONA_TOTAL, ...z];
  };

  function crearGrafico(id, config) {
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart(document.getElementById(id), config);
  }

  function opcionesBase() {
    const texto = css("--texto-suave");
    const rejilla = css("--borde");
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { labels: { color: texto, boxWidth: 12 } } },
      scales: {
        x: { ticks: { color: texto, maxRotation: 0, autoSkipPadding: 12 }, grid: { display: false } },
        y: { ticks: { color: texto }, grid: { color: rejilla } },
      },
    };
  }

  // ---------- Pestañas ----------
  function mostrarPestana(nombre) {
    const boton = document.querySelector(`.pestana[data-tab="${nombre}"]`);
    if (!boton) return;
    document.querySelectorAll(".pestana").forEach((x) => {
      x.classList.toggle("activa", x === boton);
      x.setAttribute("aria-selected", x === boton);
    });
    document.querySelectorAll(".seccion").forEach((s) => { s.hidden = s.id !== `tab-${nombre}`; });
    $(".barra-zona").hidden = nombre === "inicio";
    // Cada pestaña tiene su foto de fondo (ver body[data-vista] en styles.css)
    document.body.dataset.vista = nombre;
    // Chart.js necesita redibujar al hacerse visible
    Object.values(graficos).forEach((g) => g.resize());
  }

  function iniciarPestanas() {
    document.querySelectorAll(".pestana").forEach((b) => {
      b.addEventListener("click", () => {
        mostrarPestana(b.dataset.tab);
        history.replaceState(null, "", `#${b.dataset.tab}`);
      });
    });
    // Permite enlazar a una pestaña (index.html#prediccion); los botones de la bienvenida usan estos enlaces
    window.addEventListener("hashchange", () => mostrarPestana(location.hash.slice(1) || "inicio"));
    mostrarPestana(location.hash.slice(1) || "inicio");
  }

  // ---------- Panel ----------
  function pintarKpis(zona) {
    const regs = registrosZona(zona).filter((r) => r.ocupacion_plazas !== null);
    const ultimo = regs[regs.length - 1];
    const haceUnAnio = regs.find((r) => r.fecha === Modelo.desplazar(ultimo.fecha, -12));
    const ult12 = regs.slice(-12);
    const media12 = ult12.reduce((s, r) => s + r.ocupacion_plazas, 0) / ult12.length;
    const ant12 = regs.slice(-24, -12);
    const mediaAnt = ant12.length ? ant12.reduce((s, r) => s + r.ocupacion_plazas, 0) / ant12.length : null;
    const pernExt = ult12.reduce((s, r) => s + (r.pernoctaciones_extranjeros || 0), 0);
    const pernRes = ult12.reduce((s, r) => s + (r.pernoctaciones_residentes || 0), 0);
    const variacion = haceUnAnio ? ultimo.ocupacion_plazas - haceUnAnio.ocupacion_plazas : null;
    const varMedia = mediaAnt !== null ? media12 - mediaAnt : null;

    const flecha = (v) => v === null ? "" : `<span class="${v >= 0 ? "sube" : "baja"}">${v >= 0 ? "▲" : "▼"} ${fmt(Math.abs(v))} p.p.</span>`;

    $("#kpis").innerHTML = `
      <div class="kpi"><div class="etiqueta">Ocupación ${esc(etiquetaMes(ultimo.fecha))}</div>
        <div class="valor">${fmt(ultimo.ocupacion_plazas)} %</div>
        <div class="detalle">${flecha(variacion)} vs. mismo mes año anterior</div></div>
      <div class="kpi"><div class="etiqueta">Media últimos 12 meses</div>
        <div class="valor">${fmt(media12)} %</div>
        <div class="detalle">${flecha(varMedia)} vs. 12 meses anteriores</div></div>
      <div class="kpi"><div class="etiqueta">Plazas hoteleras (${esc(etiquetaMes(ultimo.fecha))})</div>
        <div class="valor">${fmt(ultimo.plazas, 0)}</div>
        <div class="detalle">${fmt(ultimo.establecimientos, 0)} establecimientos abiertos</div></div>
      <div class="kpi"><div class="etiqueta">Pernoctaciones de extranjeros</div>
        <div class="valor">${fmt(100 * pernExt / ((pernExt + pernRes) || 1))} %</div>
        <div class="detalle">del total en los últimos 12 meses</div></div>`;
  }

  function pintarHistorico(zona) {
    let regs = registrosZona(zona).filter((r) => r.ocupacion_plazas !== null);
    if (rangoAnios > 0) regs = regs.slice(-12 * rangoAnios);
    const conFinde = regs.some((r) => r.ocupacion_fin_semana !== null);
    const datasets = [{
      label: "Ocupación por plazas (%)",
      data: regs.map((r) => r.ocupacion_plazas),
      borderColor: css("--acento"),
      backgroundColor: css("--acento"),
      borderWidth: 2,
      pointRadius: rangoAnios === 3 ? 2 : 0,
      tension: 0.25,
    }];
    if (conFinde) {
      datasets.push({
        label: "Ocupación en fin de semana (%)",
        data: regs.map((r) => r.ocupacion_fin_semana),
        borderColor: css("--sol"),
        backgroundColor: css("--sol"),
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.25,
      });
    }
    const opciones = opcionesBase();
    opciones.scales.y.suggestedMin = 0;
    opciones.scales.y.suggestedMax = 100;
    opciones.plugins.tooltip = { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}` } };
    crearGrafico("graf-historico", { type: "line", data: { labels: regs.map((r) => etiquetaMes(r.fecha)), datasets }, options: opciones });
  }

  function pintarMunicipios(zonaActual) {
    const filas = zonas().filter((z) => z !== ZONA_TOTAL).map((z) => {
      const ult = registrosZona(z).filter((r) => r.ocupacion_plazas !== null).slice(-12);
      return { zona: z, media: ult.reduce((s, r) => s + r.ocupacion_plazas, 0) / ult.length };
    }).sort((a, b) => b.media - a.media);
    const acento = css("--acento");
    const apagado = css("--borde");
    const opciones = opcionesBase();
    opciones.indexAxis = "y";
    opciones.plugins.legend = { display: false };
    opciones.scales.x.suggestedMin = 0;
    opciones.scales.x.suggestedMax = 100;
    opciones.scales.x.grid = { color: apagado };
    opciones.scales.y.grid = { display: false };
    opciones.plugins.tooltip = { callbacks: { label: (c) => `${fmt(c.parsed.x)} %` } };
    crearGrafico("graf-municipios", {
      type: "bar",
      data: {
        labels: filas.map((f) => f.zona),
        datasets: [{
          data: filas.map((f) => f.media),
          backgroundColor: filas.map((f) => (f.zona === zonaActual || zonaActual === ZONA_TOTAL) ? acento : apagado),
          borderRadius: 4,
        }],
      },
      options: opciones,
    });
  }

  function pintarOrigen(zona) {
    const ult = registrosZona(zona).slice(-12);
    const ext = ult.reduce((s, r) => s + (r.pernoctaciones_extranjeros || 0), 0);
    const res = ult.reduce((s, r) => s + (r.pernoctaciones_residentes || 0), 0);
    crearGrafico("graf-origen", {
      type: "doughnut",
      data: {
        labels: ["Residentes en el extranjero", "Residentes en España"],
        datasets: [{ data: [ext, res], backgroundColor: [css("--acento"), css("--sol")], borderColor: css("--superficie"), borderWidth: 2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom", labels: { color: css("--texto-suave"), boxWidth: 12 } },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${fmt(c.parsed, 0)} pernoctaciones (${fmt(100 * c.parsed / ((ext + res) || 1))} %)` } },
        },
      },
    });
  }

  function colorCalor(v) {
    // De arena (baja) a azul mar (alta)
    const t = Math.min(1, Math.max(0, (v - 20) / 75));
    const a = [246, 226, 179];
    const b = [38, 140, 190];
    const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function pintarMapaCalor(zona) {
    const regs = registrosZona(zona);
    const porFecha = new Map(regs.map((r) => [r.fecha, r.ocupacion_plazas]));
    const anios = [...new Set(regs.map((r) => r.año))].sort((a, b) => b - a);
    let html = `<thead><tr><th></th>${MESES.map((m) => `<th>${m}</th>`).join("")}</tr></thead><tbody>`;
    for (const a of anios) {
      html += `<tr><th>${a}</th>`;
      for (let m = 1; m <= 12; m++) {
        const v = porFecha.get(`${a}-${String(m).padStart(2, "0")}`);
        html += (v === undefined || v === null)
          ? `<td class="sin-dato">·</td>`
          : `<td style="background:${colorCalor(v)}" title="${MESES[m - 1]} ${a}: ${fmt(v)} %">${Math.round(v)}</td>`;
      }
      html += "</tr>";
    }
    $("#mapa-calor").innerHTML = html + "</tbody>";
  }

  // ---------- Bienvenida ----------
  function pintarCifras() {
    const fechas = DATOS.map((r) => r.fecha).sort();
    const cifra = (valor, texto) => `<div class="kpi"><div class="valor">${valor}</div><div class="detalle">${texto}</div></div>`;
    $("#cifras").innerHTML =
      cifra(DATOS.length.toLocaleString("es-ES"), "registros mensuales oficiales del INE") +
      cifra(new Set(DATOS.map((r) => r.zona)).size, "zonas: la Costa del Sol y 7 municipios") +
      cifra(fechas[0].slice(0, 4), "primer año con datos") +
      cifra(12, "meses de predicción");
  }

  // ---------- Predicción ----------
  // Dos pronósticos: por plazas para los gráficos y por habitaciones para el cálculo de tu hotel
  let pronostico = null;
  let pronosticoHab = null;

  function calcularPronostico(zona) {
    pronostico = Modelo.pronosticar(Modelo.crearSerie(DATOS, zona));
    pronosticoHab = Modelo.pronosticar(Modelo.crearSerie(DATOS, zona, "ocupacion_habitaciones"));
    const sel = $("#mes-objetivo");
    const elegido = sel.value;
    sel.innerHTML = pronostico.puntos.map((p) => `<option value="${p.fecha}">${esc(etiquetaMesLarga(p.fecha))}</option>`).join("");
    // Al cambiar de zona se conserva el mes elegido si sigue en la lista
    if (pronostico.puntos.some((p) => p.fecha === elegido)) sel.value = elegido;
    pintarGraficoPrediccion(zona);
    pintarValidacion();
    pintarResultado();
  }

  function pintarGraficoPrediccion(zona) {
    const hist = registrosZona(zona).filter((r) => r.ocupacion_plazas !== null).slice(-24);
    const pts = pronostico.puntos;
    const etiquetas = [...hist.map((r) => r.fecha), ...pts.map((p) => p.fecha)];
    const n = hist.length;
    const relleno = (arr, desde) => [...new Array(desde).fill(null), ...arr];
    const acento = css("--acento");
    const sol = css("--sol");
    const ultimoReal = hist[n - 1].ocupacion_plazas;
    const opciones = opcionesBase();
    opciones.scales.y.suggestedMin = 0;
    opciones.scales.y.suggestedMax = 100;
    opciones.plugins.legend.labels.filter = (item) => !item.text.startsWith("_");
    opciones.plugins.tooltip = {
      filter: (item) => !item.dataset.label.startsWith("_") && item.parsed.y !== null,
      callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)} %` },
    };
    crearGrafico("graf-prediccion", {
      type: "line",
      data: {
        labels: etiquetas.map(etiquetaMes),
        datasets: [
          { label: "Real", data: hist.map((r) => r.ocupacion_plazas), borderColor: acento, backgroundColor: acento, borderWidth: 2, pointRadius: 2, tension: 0.25 },
          // Une el último dato real con la primera predicción
          { label: "Predicción", data: relleno([ultimoReal, ...pts.map((p) => p.prediccion)], n - 1), borderColor: sol, backgroundColor: sol, borderDash: [6, 4], borderWidth: 2, pointRadius: 2, tension: 0.25 },
          { label: "_max", data: relleno(pts.map((p) => p.max), n), borderColor: "transparent", pointRadius: 0, fill: false },
          { label: "Intervalo 90 %", data: relleno(pts.map((p) => p.min), n), borderColor: "transparent", backgroundColor: hexAlfa(sol, 0.18), pointRadius: 0, fill: "-1" },
        ],
      },
      options: opciones,
    });
  }

  function hexAlfa(color, alfa) {
    const m = color.match(/^#([0-9a-f]{6})$/i);
    if (!m) return color;
    const v = parseInt(m[1], 16);
    return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alfa})`;
  }

  function pintarValidacion() {
    const v = pronostico.validacion;
    const mejora = v.maeBase > 0 ? 100 * (v.maeBase - v.mae) / v.maeBase : 0;
    $("#kpis-modelo").innerHTML = `
      <div class="kpi"><div class="etiqueta">Error medio del modelo (MAE)</div>
        <div class="valor">${fmt(v.mae)} p.p.</div>
        <div class="detalle">puntos de ocupación, en ${v.n} meses de prueba</div></div>
      <div class="kpi"><div class="etiqueta">Error de la referencia simple</div>
        <div class="valor">${fmt(v.maeBase)} p.p.</div>
        <div class="detalle">"igual que el año pasado"</div></div>
      <div class="kpi"><div class="etiqueta">Mejora del modelo</div>
        <div class="valor ${mejora >= 0 ? "sube" : "baja"}">${mejora >= 0 ? "+" : ""}${fmt(mejora)} %</div>
        <div class="detalle">${mejora >= 0 ? "menos error que la referencia" : "en esta zona la referencia acierta más"}</div></div>`;

    const pts = v.ultimoCorte;
    const opciones = opcionesBase();
    opciones.scales.y.suggestedMin = 0;
    opciones.scales.y.suggestedMax = 100;
    opciones.plugins.tooltip = { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)} %` } };
    crearGrafico("graf-validacion", {
      type: "line",
      data: {
        labels: pts.map((p) => etiquetaMes(p.fecha)),
        datasets: [
          { label: "Real", data: pts.map((p) => p.real), borderColor: css("--acento"), backgroundColor: css("--acento"), borderWidth: 2, pointRadius: 3, tension: 0.25 },
          { label: "Predicho por el modelo", data: pts.map((p) => p.prediccion), borderColor: css("--sol"), backgroundColor: css("--sol"), borderDash: [6, 4], borderWidth: 2, pointRadius: 3, tension: 0.25 },
        ],
      },
      options: opciones,
    });
  }

  /** Personal por habitación ocupada en la zona para ese mes del año (media de los últimos 3 años con dato). */
  function ratioPersonal(zona, mes) {
    const regs = registrosZona(zona).filter((r) => r.mes === mes && r.personal && r.habitaciones && r.ocupacion_habitaciones && !Modelo.esCovid(r.fecha)).slice(-3);
    if (!regs.length) return null;
    const ratios = regs.map((r) => r.personal / (r.habitaciones * r.ocupacion_habitaciones / 100));
    return ratios.reduce((s, x) => s + x, 0) / ratios.length;
  }

  /** Nivel de demanda relativo a la propia zona: se compara con sus últimos 5 años (sin COVID) por terciles. */
  function nivelDemanda(zona, p) {
    const historico = registrosZona(zona)
      .filter((r) => r.ocupacion_plazas !== null && !Modelo.esCovid(r.fecha))
      .slice(-60).map((r) => r.ocupacion_plazas).sort((a, b) => a - b);
    const tercil = (q) => historico[Math.floor(q * (historico.length - 1))];
    if (p >= tercil(2 / 3)) return { clase: "alta", texto: "Demanda alta para la zona" };
    if (p >= tercil(1 / 3)) return { clase: "media", texto: "Demanda media para la zona" };
    return { clase: "baja", texto: "Demanda baja para la zona" };
  }

  function recomendaciones(nivel, precio, ref, fecha) {
    const r = [];
    if (nivel.clase === "alta") {
      r.push("Sube tarifas o aplica estancia mínima: será de los meses más fuertes de la zona.");
      r.push("Refuerza personal de pisos y recepción con antelación.");
      r.push("Reduce comisiones: prioriza la venta directa frente a las OTA.");
    } else if (nivel.clase === "media") {
      r.push("Mantén tarifas y ajusta según el ritmo de reservas semanal.");
      r.push("Campañas dirigidas al mercado extranjero (principal cliente de la zona).");
    } else {
      r.push("Lanza ofertas (larga estancia, paquetes, grupos y congresos).");
      r.push("Buen momento para vacaciones del personal y obras de mantenimiento.");
      r.push("Apóyate en las OTA para ganar visibilidad.");
    }
    // Parte de la media de la zona: con la regla de ELASTICIDAD, ahí es donde más ingresa cada habitación
    if (ref) {
      const factor = nivel.clase === "alta" ? 1.1 : nivel.clase === "media" ? 1 : 0.9;
      const orientativo = ref * factor;
      const dif = precio / orientativo - 1;
      const comparacion = Math.abs(dif) < 0.005 ? "El tuyo coincide."
        : `El tuyo está un ${fmt(Math.abs(100 * dif), 0)} % ${dif > 0 ? "por encima" : "por debajo"}.`;
      const base = factor > 1 ? "un 10 % más que la media de la zona" : factor < 1 ? "un 10 % menos que la media de la zona" : "la media de la zona";
      r.push(`Precio orientativo: ${fmt(orientativo, 0)} € (${base}). ${comparacion}`);
    }
    const diasSS = Modelo.semanaSanta(fecha) * 8;
    if (diasSS > 0) {
      r.push(`Este mes incluye ${diasSS === 8 ? "toda la" : `${diasSS} de los 8 días de la`} Semana Santa: sube la tarifa esos días y pide estancia mínima.`);
    }
    return r;
  }

  function pintarResultado() {
    const zona = $("#zona").value;
    const fecha = $("#mes-objetivo").value;
    const habitaciones = Number($("#habitaciones-hotel").value);
    const precio = Number($("#precio-hotel").value);
    $("#v-habitaciones").textContent = fmt(habitaciones, 0);
    $("#v-precio").textContent = `${fmt(precio, 0)} €`;

    const punto = pronostico.puntos.find((p) => p.fecha === fecha);
    const puntoHab = pronosticoHab.puntos.find((p) => p.fecha === fecha);
    if (!punto || !puntoHab) {
      $("#precio-zona").textContent = "";
      $("#resultado").innerHTML = `<p class="vacio">No hay predicción disponible para ese mes.</p>`;
      return;
    }

    // Precio de referencia: tarifa media (ADR) de la zona el mismo mes del año anterior
    const anioAnterior = registrosZona(zona).find((r) => r.fecha === Modelo.desplazar(fecha, -12));
    const ref = anioAnterior ? anioAnterior.tarifa_media : null;
    let ajuste = 1;
    if (ref) {
      const dif = precio / ref - 1;
      ajuste = 1 - ELASTICIDAD * dif;
      $("#precio-zona").textContent = `Media de la zona en ${etiquetaMesLarga(anioAnterior.fecha)}: ${fmt(ref, 0)} € (INE). ` +
        `Tu precio está un ${fmt(Math.abs(100 * dif), 0)} % ${dif >= 0 ? "por encima" : "por debajo"}.`;
    } else {
      $("#precio-zona").textContent = "El INE no publicó la tarifa media de esta zona ese mes: el precio no cambia la ocupación.";
    }
    const limitar = (v) => Math.min(100, Math.max(0, v));
    const ocupacion = limitar(puntoHab.prediccion * ajuste);
    const ocupadas = habitaciones * ocupacion / 100;
    const [a, m] = fecha.split("-").map(Number);
    const diasMes = new Date(a, m, 0).getDate();
    const ingresos = ocupadas * precio * diasMes;
    const ratio = ratioPersonal(zona, m);
    const personal = ratio ? Math.round(ocupadas * ratio) : null;
    const nivel = nivelDemanda(zona, punto.prediccion);

    $("#resultado").innerHTML = `
      <h2>${esc(zona)} · ${esc(etiquetaMesLarga(fecha))}</h2>
      <div class="res-principal">
        <span class="res-valor">${fmt(ocupacion)} %</span>
        <span class="insignia ${nivel.clase}">${nivel.texto}</span>
      </div>
      <p class="res-intervalo">Ocupación prevista de tus habitaciones con ese precio. Intervalo del 90 %:
        ${fmt(limitar(puntoHab.min * ajuste))} % – ${fmt(limitar(puntoHab.max * ajuste))} %.
        Media prevista de la zona: ${fmt(puntoHab.prediccion)} %.</p>
      <div class="res-datos">
        <div><strong>${fmt(ocupadas, 0)}</strong><span>habitaciones ocupadas por noche</span></div>
        <div><strong>${fmt(ingresos, 0)} €</strong><span>ingresos por habitaciones en el mes</span></div>
        <div><strong>${fmt(precio * ocupacion / 100, 0)} €</strong><span>RevPAR (ingreso por habitación disponible)</span></div>
        <div><strong>${personal !== null ? fmt(personal, 0) : "–"}</strong><span>empleados recomendados (ratio de la zona)</span></div>
      </div>
      <h3>Recomendaciones</h3>
      <ul class="recomendaciones">${recomendaciones(nivel, precio, ref, fecha).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  // ---------- Datos ----------
  const COLUMNAS_TABLA = [
    ["fecha", "Fecha", 0], ["zona", "Zona", 0], ["ocupacion_plazas", "Ocup. plazas %", 1],
    ["ocupacion_habitaciones", "Ocup. hab. %", 1], ["ocupacion_fin_semana", "Ocup. finde %", 1],
    ["establecimientos", "Establec.", 0], ["plazas", "Plazas", 0], ["habitaciones", "Habitac.", 0], ["personal", "Personal", 0],
    ["viajeros_residentes", "Viajeros ES", 0], ["viajeros_extranjeros", "Viajeros ext.", 0],
    ["pernoctaciones_residentes", "Pernoct. ES", 0], ["pernoctaciones_extranjeros", "Pernoct. ext.", 0],
    ["tarifa_media", "Tarifa media €", 0],
  ];

  function iniciarDatos() {
    const anios = [...new Set(DATOS.map((r) => r.año))].sort((a, b) => b - a);
    $("#filtro-anio").innerHTML = `<option value="">Todos</option>` + anios.map((a) => `<option>${a}</option>`).join("");
    $("#filtro-anio").value = String(anios[0]);
    $("#filtro-anio").addEventListener("change", () => pintarTabla($("#zona").value));
    const nZonas = new Set(DATOS.map((r) => r.zona)).size;
    const fechas = DATOS.map((r) => r.fecha).sort();
    $("#resumen-dataset").textContent =
      `${DATOS.length.toLocaleString("es-ES")} registros mensuales · ${nZonas} zonas · ${fechas[0]} a ${fechas[fechas.length - 1]} · ${META.fuente || "INE"}.`;
  }

  function pintarTabla(zona) {
    const anio = $("#filtro-anio").value;
    const filas = registrosZona(zona).filter((r) => !anio || String(r.año) === anio).reverse();
    const cab = `<thead><tr>${COLUMNAS_TABLA.map(([, t]) => `<th>${t}</th>`).join("")}</tr></thead>`;
    const cuerpo = filas.map((r) => `<tr>${COLUMNAS_TABLA.map(([k, , d]) =>
      `<td>${typeof r[k] === "number" ? fmt(r[k], d) : esc(r[k] ?? "–")}</td>`).join("")}</tr>`).join("");
    $("#tabla-datos").innerHTML = cab + `<tbody>${cuerpo || `<tr><td colspan="${COLUMNAS_TABLA.length}">Sin datos</td></tr>`}</tbody>`;
  }

  // ---------- Inicio ----------
  function actualizarZona() {
    const zona = $("#zona").value;
    pintarKpis(zona);
    pintarHistorico(zona);
    pintarMunicipios(zona);
    pintarOrigen(zona);
    pintarMapaCalor(zona);
    calcularPronostico(zona);
    pintarTabla(zona);
  }

  function iniciar() {
    if (!DATOS.length || typeof Chart === "undefined") {
      document.querySelector("main").innerHTML =
        `<div class="tarjeta"><h2>No se pudieron cargar los datos o la librería de gráficos</h2>
         <p>Comprueba que existe <code>data/dataset.js</code> y que hay conexión a Internet (Chart.js se carga desde un CDN).</p></div>`;
      return;
    }
    $("#zona").innerHTML = zonas().map((z) => `<option>${esc(z)}</option>`).join("");
    const ultima = DATOS.map((r) => r.fecha).sort().pop();
    $("#nota-datos").textContent = `Datos del INE hasta ${etiquetaMesLarga(ultima)}`;

    iniciarDatos();
    pintarCifras();
    $("#zona").addEventListener("change", actualizarZona);
    // Los controles recalculan al momento; el formulario nunca se envía
    $("#form-prediccion").addEventListener("input", pintarResultado);
    $("#form-prediccion").addEventListener("submit", (e) => e.preventDefault());
    document.querySelectorAll("#rango-historico button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#rango-historico button").forEach((x) => x.classList.toggle("activo", x === b));
        rangoAnios = Number(b.dataset.anios);
        pintarHistorico($("#zona").value);
      });
    });
    actualizarZona();
    iniciarPestanas();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
