* ═══════════════════════════════════════════════════════════
   LocalCerca · app.js
   Mapa · Búsqueda · Panel · Modal · API connector
═══════════════════════════════════════════════════════════

   PARA CONECTAR CON TU GOOGLE APPS SCRIPT:
   1. Publica el script como API (ver LocalCerca_AppsScript.js)
   2. Reemplaza la URL en APPS_SCRIPT_URL
   3. Cambia USAR_DATOS_DEMO a false

═══════════════════════════════════════════════════════════ */

'use strict';

/* ── CONFIGURACIÓN ────────────────────────────────────────── */
const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';
const USAR_DATOS_DEMO = true;   // ← cambiar a false cuando tengas la API lista

const MAPA_CENTRO_DEFAULT = [13.6929, -89.2182]; // Urb. Nuevo Lourdes
const MAPA_ZOOM_DEFAULT   = 16;

// Sugerencias que aparecen antes de escribir
const SUGERENCIAS_POPULARES = [
  'impresión de fotos',
  'papel fotográfico',
  'retiros banco agrícola',
  'pago de recibos',
  'venta de minutas',
  'comida para llevar',
  'recargas tigo',
  'fotos carnet',
  'copias',
  'pago de agua',
];

/* ── DATOS DE DEMO ────────────────────────────────────────── */
const DEMO_NEGOCIOS = [
  {
    id: 1,
    nombre:      'Librería y Copy Center Hernández',
    colonia:     'Urb. Nuevo Lourdes',
    direccion:   'Calle Principal, Casa 14-B',
    lat:          13.6929,
    lng:         -89.2182,
    categoria:   'Librería / Copias',
    emoji:        '📚',
    premium:      true,
    servicios:   ['impresión de fotos', 'papel fotográfico', 'copias', 'espiralados', 'plastificado', 'útiles escolares', 'impresión documentos', 'fax'],
    descripcion:  'Servicios completos de impresión y papelería. Especialistas en impresión fotográfica en papel fotográfico mate y brillante.',
    telefono:    '+503 2222-3344',
    whatsapp:    '+50322223344',
    facebook:    'libreriaHernandez',
    horario:     'Lun–Sáb  8:00–18:00',
    abierto:      true,
    estrellas:    4.8,
    resenas:      47,
    distancia:   '120m',
  },
  {
    id: 2,
    nombre:      'Foto Express',
    colonia:     'Urb. Nuevo Lourdes',
    direccion:   'Av. Secundaria 8, Local 3',
    lat:          13.6945,
    lng:         -89.2195,
    categoria:   'Fotografía',
    emoji:        '📷',
    premium:      true,
    servicios:   ['fotos carnet', 'papel fotográfico', 'impresión fotos', 'ampliaciones', 'fotos pasaporte', 'enmarcado', 'canvas', 'álbumes'],
    descripcion:  'Estudio fotográfico con impresiones de alta calidad en papel fotográfico Kodak. Fotos para documentos en minutos.',
    telefono:    '+503 2233-4455',
    whatsapp:    '+50322334455',
    facebook:    'fotoExpress',
    horario:     'Lun–Dom  8:30–17:30',
    abierto:      true,
    estrellas:    4.9,
    resenas:      89,
    distancia:   '480m',
  },
  {
    id: 3,
    nombre:      'Mini Super El Buen Precio',
    colonia:     'Urb. Nuevo Lourdes',
    direccion:   'Pasaje Los Pinos 4',
    lat:          13.6915,
    lng:         -89.2168,
    categoria:   'Supermercado',
    emoji:        '🛒',
    premium:      false,
    servicios:   ['pago de agua', 'pago de recibos', 'pago de luz', 'recargas tigo', 'recargas claro', 'venta de comida', 'bebidas', 'lácteos'],
    descripcion:  'Minisuper con servicios de pago de recibos y recargas. Abierto todos los días.',
    telefono:    '+503 2211-5566',
    whatsapp:     null,
    facebook:     null,
    horario:     'Lun–Dom  7:00–20:00',
    abierto:      true,
    estrellas:    3.9,
    resenas:      22,
    distancia:   '210m',
  },
  {
    id: 4,
    nombre:      'Pupusería Doña Chela',
    colonia:     'Urb. Nuevo Lourdes',
    direccion:   'Calle El Sauce 12',
    lat:          13.6922,
    lng:         -89.2175,
    categoria:   'Comida típica',
    emoji:        '🫓',
    premium:      false,
    servicios:   ['venta de comida mexicana', 'pupusas', 'tacos', 'burritos', 'minutas', 'comida para llevar', 'almuerzo', 'elotes locos'],
    descripcion:  'Las mejores pupusas y comida típica de la colonia. También vendemos minutas de frutas y elotes locos.',
    telefono:    '+503 7788-9900',
    whatsapp:    '+50377889900',
    facebook:    'pupuseriaChela',
    horario:     'Mar–Dom  11:00–21:00',
    abierto:      false,
    estrellas:    4.6,
    resenas:      134,
    distancia:   '90m',
  },
  {
    id: 5,
    nombre:      'Agente Banco Agrícola',
    colonia:     'Urb. Nuevo Lourdes',
    direccion:   'Centro Comercial Lourdes, Local 7',
    lat:          13.6936,
    lng:         -89.2201,
    categoria:   'Servicios financieros',
    emoji:        '🏦',
    premium:      false,
    servicios:   ['retiros banco agrícola', 'depósitos', 'pago de préstamos', 'consulta de saldo', 'transferencias'],
    descripcion:  'Agente corresponsal autorizado del Banco Agrícola. Realiza retiros, depósitos y pagos sin ir al banco.',
    telefono:    '+503 2244-6677',
    whatsapp:     null,
    facebook:     null,
    horario:     'Lun–Sáb  8:00–17:00',
    abierto:      true,
    estrellas:    4.1,
    resenas:      31,
    distancia:   '300m',
  },
  {
    id: 6,
    nombre:      'Farmacia San Lucas',
    colonia:     'Col. Escalón',
    direccion:   '79 Av. Norte 215',
    lat:          13.7012,
    lng:         -89.2290,
    categoria:   'Farmacia',
    emoji:        '💊',
    premium:      false,
    servicios:   ['medicamentos', 'vitaminas', 'venta de papas fritas', 'snacks', 'recargas', 'medición de presión', 'prueba de glucosa'],
    descripcion:  'Farmacia con servicio de entrega a domicilio. También contamos con snacks y productos de conveniencia.',
    telefono:    '+503 2255-7788',
    whatsapp:    '+50322557788',
    facebook:    'farmaciaSanLucas',
    horario:     'Lun–Dom  7:00–21:00',
    abierto:      true,
    estrellas:    4.3,
    resenas:      58,
    distancia:   '1.2km',
  },
  {
    id: 7,
    nombre:      'Papelería y Servicios Net',
    colonia:     'Santa Elena',
    direccion:   'Blvd. Santa Elena, Local 2B',
    lat:          13.6870,
    lng:         -89.2320,
    categoria:   'Papelería / Internet',
    emoji:        '🖨️',
    premium:      false,
    servicios:   ['impresión de fotos', 'documentos', 'copias', 'internet', 'pago de recibos', 'escaneo', 'quemado de cd'],
    descripcion:  'Centro de servicios con computadoras, impresión y trámites varios.',
    telefono:    '+503 2266-8899',
    whatsapp:    '+50322668899',
    facebook:     null,
    horario:     'Lun–Sáb  8:00–19:00',
    abierto:      true,
    estrellas:    3.7,
    resenas:      19,
    distancia:   '2.1km',
  },
];

/* ════════════════════════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════════════════════════ */
const Estado = {
  negocios:     [],
  filtrados:    [],
  query:        '',
  colonia:      'todos',
  ordenar:      'relevancia',
  userLatLng:   null,
  negocioAbierto: null,  // id del popup abierto
};

/* ════════════════════════════════════════════════════════════
   MAPA
════════════════════════════════════════════════════════════ */
let map;
const layerMarkers = {};  // id → marker de Leaflet

function initMapa() {
  map = L.map('map', {
    center:      MAPA_CENTRO_DEFAULT,
    zoom:        MAPA_ZOOM_DEFAULT,
    zoomControl: false,
    attributionControl: false,
  });

  // Tiles oscuros CARTO — gratuito, sin API key
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
    maxZoom: 20,
  }).addTo(map);

  // Zoom personalizado
  document.getElementById('zoom-in').addEventListener('click',  () => map.zoomIn());
  document.getElementById('zoom-out').addEventListener('click', () => map.zoomOut());

  // Cerrar popup al hacer click en mapa
  map.on('click', () => cerrarSugerencias());
}

/* ── CREAR MARCADOR ──────────────────────────────────────── */
function crearIcono(negocio) {
  const colorFondo = negocio.premium ? '#2C1F06' : '#0F2218';
  const colorPin   = negocio.premium ? '#E8921A' : '#1A7A4A';

  const radar = negocio.premium
    ? `<div class="mk-radar"></div>`
    : '';

  const star = negocio.premium
    ? `<div class="mk-premium-star" aria-hidden="true">★</div>`
    : '';

  const html = `
    <div class="mk-wrap">
      ${radar}
      <div class="mk-pin" style="background:${colorPin}" data-id="${negocio.id}" aria-label="${negocio.nombre}">
        <span class="mk-emoji" role="img" aria-hidden="true">${negocio.emoji}</span>
      </div>
      ${star}
    </div>`;

  return L.divIcon({
    html,
    className:  '',
    iconSize:   [36, 44],
    iconAnchor: [18, 44],
    popupAnchor:[0, -48],
  });
}

function crearIconoUsuario() {
  return L.divIcon({
    html:       `<div class="mk-user" aria-label="Tu posición"></div>`,
    className:  '',
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  });
}

/* ── POPUP ───────────────────────────────────────────────── */
function buildPopupHTML(n) {
  const stars      = '★'.repeat(Math.round(n.estrellas));
  const tipoBadge  = n.premium
    ? `<span class="pop-badge pop-badge--premium">★ Premium</span>`
    : `<span class="pop-badge pop-badge--regular">Local</span>`;

  const contacto = n.premium
    ? `<div class="pop-contact">
        ${n.telefono  ? `<a class="pop-contact-link" href="tel:${n.telefono}">📞 ${n.telefono}</a>` : ''}
        ${n.whatsapp  ? `<a class="pop-contact-link" href="https://wa.me/${n.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
        ${n.facebook  ? `<a class="pop-contact-link" href="https://facebook.com/${n.facebook}" target="_blank" rel="noopener">📘 Facebook</a>` : ''}
       </div>`
    : '';

  const statusDot = n.abierto
    ? `<span class="status-dot status-dot--open" aria-hidden="true"></span> Abierto`
    : `<span class="status-dot status-dot--closed" aria-hidden="true"></span> Cerrado`;

  const colorFondo = n.premium ? 'rgba(232,146,26,0.10)' : 'rgba(26,122,74,0.10)';

  return `
    <div class="pop">
      <div class="pop-head">
        <div class="pop-emoji" style="background:${colorFondo}">${n.emoji}</div>
        <div class="pop-info">
          ${tipoBadge}
          <div class="pop-name">${n.nombre}</div>
        </div>
      </div>
      <div class="pop-services">${n.servicios.slice(0, 4).join(' · ')}</div>
      <div class="pop-row">
        <span class="pop-status">${statusDot}</span>
        <span class="pop-dist">📍 ${n.distancia}</span>
        <span class="pop-stars">${stars}</span>
      </div>
      ${contacto}
      <button class="pop-btn" onclick="abrirModal(${n.id})">
        Ver perfil completo
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>`;
}

/* ── RENDERIZAR MARCADORES ───────────────────────────────── */
function renderizarMarcadores() {
  // Quitar marcadores anteriores
  Object.values(layerMarkers).forEach(m => map.removeLayer(m));
  Object.keys(layerMarkers).forEach(k => delete layerMarkers[k]);

  Estado.filtrados.forEach(n => {
    const marker = L.marker([n.lat, n.lng], { icon: crearIcono(n), alt: n.nombre });

    marker.bindPopup(buildPopupHTML(n), {
      maxWidth:      280,
      minWidth:      240,
      closeButton:   true,
      className:     'lc-popup',
    });

    marker.bindTooltip(n.nombre, {
      direction: 'top',
      offset:    [0, -46],
    });

    marker.addTo(map);
    layerMarkers[n.id] = marker;
  });
}

/* ── MARCADOR USUARIO ────────────────────────────────────── */
let markerUsuario = null;

function ponerMarcadorUsuario(lat, lng) {
  if (markerUsuario) map.removeLayer(markerUsuario);
  markerUsuario = L.marker([lat, lng], {
    icon:          crearIconoUsuario(),
    zIndexOffset:  1000,
    alt:           'Tu posición',
  });
  markerUsuario.bindTooltip('Tú estás aquí', { direction: 'top' });
  markerUsuario.addTo(map);
}

/* ════════════════════════════════════════════════════════════
   DATOS — carga desde API o demo
════════════════════════════════════════════════════════════ */
async function cargarNegocios() {
  mostrarSkeleton(true);

  try {
    if (USAR_DATOS_DEMO) {
      // Simular delay de red
      await new Promise(r => setTimeout(r, 900));
      Estado.negocios = DEMO_NEGOCIOS;
    } else {
      const url = `${APPS_SCRIPT_URL}?accion=negocios`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error en API');
      Estado.negocios = json.negocios;
    }

    aplicarFiltros();

  } catch (err) {
    console.error('[LocalCerca] Error al cargar negocios:', err);
    mostrarError('No se pudieron cargar los negocios. Intenta recargar la página.');
  } finally {
    mostrarSkeleton(false);
  }
}

/* ════════════════════════════════════════════════════════════
   FILTROS Y BÚSQUEDA
════════════════════════════════════════════════════════════ */
function aplicarFiltros() {
  const q   = Estado.query.toLowerCase().trim();
  const col = Estado.colonia;

  let resultado = Estado.negocios.filter(n => {
    const matchColonia = col === 'todos' || n.colonia === col;
    if (!matchColonia) return false;

    if (!q) return true;

    // Buscar en nombre, servicios, categoría, descripción
    const haystack = [
      n.nombre,
      ...n.servicios,
      n.categoria,
      n.descripcion,
    ].join(' ').toLowerCase();

    // Coincidencia exacta de frase
    if (haystack.includes(q)) return true;

    // Coincidencia por palabras individuales (≥3 letras)
    return q.split(/\s+/).filter(p => p.length >= 3).some(p => haystack.includes(p));
  });

  // Ordenar
  resultado = ordenar(resultado, Estado.ordenar);

  Estado.filtrados = resultado;

  renderizarMarcadores();
  renderizarTarjetas();
  actualizarResultBadge();

  // Registrar búsqueda si hay query
  if (q.length >= 3) registrarBusqueda(q);
}

function ordenar(lista, criterio) {
  return [...lista].sort((a, b) => {
    if (criterio === 'distancia') {
      const da = parseFloat(a.distancia) || 9999;
      const db = parseFloat(b.distancia) || 9999;
      if (da !== db) return da - db;
    }
    if (criterio === 'estrellas') {
      if (b.estrellas !== a.estrellas) return b.estrellas - a.estrellas;
    }
    // Relevancia: premium primero, luego estrellas
    if (b.premium !== a.premium) return (b.premium ? 1 : 0) - (a.premium ? 1 : 0);
    return b.estrellas - a.estrellas;
  });
}

/* ════════════════════════════════════════════════════════════
   TARJETAS
════════════════════════════════════════════════════════════ */
function renderizarTarjetas() {
  const scroll   = document.getElementById('cards-scroll');
  const empty    = document.getElementById('empty-state');
  const loading  = document.getElementById('loading-state');
  const count    = document.getElementById('panel-count');
  const emptyTerm= document.getElementById('empty-term');

  // Limpieza (dejar empty y loading en el DOM)
  scroll.querySelectorAll('.biz-card').forEach(c => c.remove());

  const lista = Estado.filtrados;
  count.textContent = lista.length
    ? `${lista.length} negocio${lista.length !== 1 ? 's' : ''}`
    : '';

  if (!lista.length) {
    empty.removeAttribute('hidden');
    emptyTerm.textContent = Estado.query || Estado.colonia;
    return;
  }

  empty.setAttribute('hidden', '');
  loading.setAttribute('hidden', '');

  lista.forEach((n, i) => {
    const card = crearTarjeta(n, i);
    scroll.appendChild(card);
  });
}

function crearTarjeta(n, index) {
  const card = document.createElement('article');
  card.className = 'biz-card' + (n.premium ? ' biz-card--premium' : '');
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${n.nombre}, ${n.distancia}`);
  card.style.animationDelay = `${index * 0.04}s`;

  const stars = '★'.repeat(Math.round(n.estrellas));
  const colorEmoji = n.premium ? 'rgba(232,146,26,0.12)' : 'rgba(26,122,74,0.12)';
  const premiumBadge = n.premium
    ? `<span class="card-premium-badge">★ Premium</span>`
    : '';

  // En mobile: layout horizontal compacto
  // En desktop (sidebar): layout diferente con .card-body
  card.innerHTML = `
    <div class="card-top">
      <div class="card-emoji" style="background:${colorEmoji}">${n.emoji}</div>
      <div class="card-name">${n.nombre}</div>
    </div>
    <div class="card-body">
      <div class="card-name-full">${n.nombre} ${premiumBadge}</div>
      <div class="card-services">${n.servicios.slice(0, 5).join(' · ')}</div>
      <div class="card-footer">
        <span class="card-dist">📍 ${n.distancia}</span>
        <span class="card-stars">${stars}</span>
      </div>
    </div>`;

  // Click → abrir modal
  card.addEventListener('click', () => abrirModal(n.id));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrirModal(n.id);
    }
  });

  // Hover → mostrar popup en mapa
  card.addEventListener('mouseenter', () => {
    const marker = layerMarkers[n.id];
    if (marker) marker.openPopup();
  });

  return card;
}

/* ── RESULT BADGE ────────────────────────────────────────── */
function actualizarResultBadge() {
  const badge   = document.getElementById('result-badge');
  const text    = document.getElementById('result-text');
  const q       = Estado.query;
  const total   = Estado.filtrados.length;

  if (q && total >= 0) {
    text.textContent = total
      ? `${total} negocio${total !== 1 ? 's' : ''} con "${q}"`
      : `Sin resultados para "${q}"`;
    badge.removeAttribute('hidden');
    setTimeout(() => badge.setAttribute('hidden', ''), 4000);
  } else {
    badge.setAttribute('hidden', '');
  }
}

/* ════════════════════════════════════════════════════════════
   MODAL DETALLE
════════════════════════════════════════════════════════════ */
function abrirModal(id) {
  const n = Estado.negocios.find(b => b.id === id);
  if (!n) return;

  const overlay = document.getElementById('modal-overlay');
  const stars   = '★'.repeat(Math.floor(n.estrellas));
  const colorEmoji = n.premium ? 'rgba(232,146,26,0.12)' : 'rgba(26,122,74,0.12)';

  // Emoji
  document.getElementById('modal-emoji').textContent = n.emoji;
  document.getElementById('modal-emoji').style.background = colorEmoji;

  // Badges
  const badges = [];
  if (n.premium) badges.push(`<span class="modal-badge modal-badge--premium">★ Premium</span>`);
  badges.push(n.abierto
    ? `<span class="modal-badge modal-badge--open">● Abierto</span>`
    : `<span class="modal-badge modal-badge--closed">● Cerrado</span>`);
  document.getElementById('modal-badges').innerHTML = badges.join('');

  // Info básica
  document.getElementById('modal-name').textContent   = n.nombre;
  document.getElementById('modal-colonia').innerHTML  = `📍 ${n.colonia} · ${n.direccion}`;
  document.getElementById('modal-desc').textContent   = n.descripcion;

  // Rating
  document.getElementById('modal-rating').innerHTML = `
    <span class="rating-stars">${stars}</span>
    <span class="rating-val">${n.estrellas}</span>
    <span class="rating-count">(${n.resenas} reseñas)</span>
    <span style="margin-left:auto;font-size:12px;color:var(--c-text-3)">📍 ${n.distancia}</span>`;

  // Tags de servicios
  document.getElementById('modal-tags').innerHTML = n.servicios
    .map(s => `<span class="modal-tag">${s}</span>`)
    .join('');

  // Grid de info
  document.getElementById('modal-grid').innerHTML = `
    <div class="modal-info-cell">
      <div class="info-label">Horario</div>
      <div class="info-value">${n.horario}</div>
    </div>
    <div class="modal-info-cell">
      <div class="info-label">Categoría</div>
      <div class="info-value">${n.categoria}</div>
    </div>
    <div class="modal-info-cell">
      <div class="info-label">Distancia</div>
      <div class="info-value">${n.distancia}</div>
    </div>
    <div class="modal-info-cell">
      <div class="info-label">Colonia</div>
      <div class="info-value">${n.colonia}</div>
    </div>`;

  // Contacto
  const contactTitle  = document.getElementById('modal-contact-title');
  const contactList   = document.getElementById('modal-contact-list');
  const contactSection= document.getElementById('modal-contact-section');

  if (n.premium) {
    contactTitle.textContent = 'Contacto directo';
    const links = [];
    if (n.telefono) links.push(`
      <a class="modal-contact-link" href="tel:${n.telefono}">
        <span class="contact-ico">📞</span>${n.telefono}
      </a>`);
    if (n.whatsapp) links.push(`
      <a class="modal-contact-link" href="https://wa.me/${n.whatsapp}" target="_blank" rel="noopener">
        <span class="contact-ico">💬</span>Enviar mensaje por WhatsApp
      </a>`);
    if (n.facebook) links.push(`
      <a class="modal-contact-link" href="https://facebook.com/${n.facebook}" target="_blank" rel="noopener">
        <span class="contact-ico">📘</span>Ver página en Facebook
      </a>`);
    contactList.innerHTML = links.join('') || '<p style="font-size:13px;color:var(--c-text-3)">Sin contacto registrado</p>';
  } else {
    contactTitle.textContent = '';
    contactList.innerHTML = `
      <div class="modal-upsell">
        ⭐ El contacto directo (teléfono, WhatsApp, Facebook) está disponible para
        <strong>negocios Premium</strong>. ¿Eres dueño de este negocio?
        <a href="registro.html" style="color:var(--c-ambar);text-decoration:none;font-weight:600"> Contáctanos para activar tu perfil →</a>
      </div>`;
  }

  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Focus trap básico
  document.getElementById('modal-close').focus();

  // Centrar mapa en el negocio
  map.setView([n.lat, n.lng], Math.max(map.getZoom(), 17));
  const marker = layerMarkers[n.id];
  if (marker) marker.openPopup();
}

function cerrarModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/* ════════════════════════════════════════════════════════════
   BÚSQUEDA
════════════════════════════════════════════════════════════ */
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const suggestionsEl = document.getElementById('search-suggestions');

let searchTimer;

searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  Estado.query = val;
  searchClear.hidden = val.length === 0;

  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    aplicarFiltros();
    if (val.length === 0) {
      mostrarSugerencias(true);
    } else {
      cerrarSugerencias();
    }
  }, 280);
});

searchInput.addEventListener('focus', () => {
  if (!Estado.query) mostrarSugerencias(true);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { cerrarSugerencias(); searchInput.blur(); }
});

function mostrarSugerencias(mostrar) {
  if (mostrar) {
    suggestionsEl.removeAttribute('hidden');
  } else {
    suggestionsEl.setAttribute('hidden', '');
  }
}

function cerrarSugerencias() {
  suggestionsEl.setAttribute('hidden', '');
}

function clearSearch() {
  searchInput.value = '';
  Estado.query     = '';
  searchClear.hidden = true;
  cerrarSugerencias();
  aplicarFiltros();
}

// Chips de sugerencias
function renderizarSugerencias() {
  const chips = document.getElementById('suggestions-chips');
  chips.innerHTML = SUGERENCIAS_POPULARES
    .map(s => `<button class="suggestion-chip" data-term="${s}" aria-label="Buscar ${s}">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      ${s}
    </button>`)
    .join('');

  chips.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const term = chip.dataset.term;
      searchInput.value = term;
      Estado.query      = term;
      searchClear.hidden = false;
      cerrarSugerencias();
      aplicarFiltros();
    });
  });
}

/* ════════════════════════════════════════════════════════════
   COLONIAS
════════════════════════════════════════════════════════════ */
document.querySelectorAll('.chip[data-colonia]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-colonia]').forEach(c => {
      c.classList.remove('chip--active');
      c.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('chip--active');
    chip.setAttribute('aria-pressed', 'true');
    Estado.colonia = chip.dataset.colonia;
    aplicarFiltros();

    // Centrar mapa en la colonia
    const primer = Estado.filtrados[0];
    if (primer) map.setView([primer.lat, primer.lng], MAPA_ZOOM_DEFAULT);
  });
});

/* ════════════════════════════════════════════════════════════
   ORDENAR
════════════════════════════════════════════════════════════ */
document.getElementById('sort-select').addEventListener('change', function() {
  Estado.ordenar = this.value;
  aplicarFiltros();
});

/* ════════════════════════════════════════════════════════════
   GEOLOCALIZACIÓN
════════════════════════════════════════════════════════════ */
document.getElementById('btn-gps').addEventListener('click', solicitarGPS);

function solicitarGPS() {
  const btn = document.getElementById('btn-gps');
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización.');
    return;
  }

  btn.classList.add('is-active');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      Estado.userLatLng = [lat, lng];
      map.setView([lat, lng], 17);
      ponerMarcadorUsuario(lat, lng);
      btn.classList.remove('is-active');

      // Seleccionar automáticamente la colonia más cercana (simplificado)
      detectarColoniaCercana(lat, lng);
    },
    err => {
      console.warn('[LocalCerca] GPS no disponible:', err.message);
      btn.classList.remove('is-active');
      alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
    },
    { timeout: 10000, maximumAge: 60000 }
  );
}

function detectarColoniaCercana(lat, lng) {
  // Distancia simple (Haversine simplificado)
  function dist(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  let minDist = Infinity;
  let coloniaDetectada = 'todos';

  Estado.negocios.forEach(n => {
    const d = dist(lat, lng, n.lat, n.lng);
    if (d < minDist) {
      minDist = d;
      coloniaDetectada = n.colonia;
    }
  });

  if (coloniaDetectada !== 'todos') {
    const chipEl = document.querySelector(`.chip[data-colonia="${coloniaDetectada}"]`);
    if (chipEl) chipEl.click();
  }
}

/* ════════════════════════════════════════════════════════════
   PANEL — arrastrar (móvil)
════════════════════════════════════════════════════════════ */
(function initPanelDrag() {
  const panel  = document.getElementById('panel');
  const handle = document.getElementById('panel-handle');
  let startY   = 0;
  let startH   = 0;

  function onStart(e) {
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    startH = panel.offsetHeight;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup',  onEnd);
    document.addEventListener('touchend', onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    const y  = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = startY - y;
    const vh = window.innerHeight;
    const newH = Math.min(Math.max(startH + dy, 56), vh * 0.65);
    panel.style.height = newH + 'px';
    panel.style.transition = 'none';
  }

  function onEnd() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup',  onEnd);
    document.removeEventListener('touchend', onEnd);

    panel.style.transition = '';
    const h = panel.offsetHeight;
    const vh = window.innerHeight;

    if      (h < 90)           { panel.classList.add('is-collapsed'); panel.classList.remove('is-expanded'); panel.style.height = ''; }
    else if (h > vh * 0.35)    { panel.classList.add('is-expanded');  panel.classList.remove('is-collapsed'); panel.style.height = ''; }
    else                       { panel.classList.remove('is-collapsed', 'is-expanded'); panel.style.height = ''; }
  }

  handle.addEventListener('mousedown',  onStart);
  handle.addEventListener('touchstart', onStart, { passive: true });

  handle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      panel.classList.toggle('is-expanded');
      panel.classList.remove('is-collapsed');
    }
  });
})();

/* ════════════════════════════════════════════════════════════
   MODAL — eventos
════════════════════════════════════════════════════════════ */
document.getElementById('modal-close').addEventListener('click', cerrarModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) cerrarModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModal();
});

/* ════════════════════════════════════════════════════════════
   CERRAR SUGERENCIAS AL CLICK FUERA
════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  if (!e.target.closest('.search-container')) cerrarSugerencias();
});

/* ════════════════════════════════════════════════════════════
   REGISTRAR BÚSQUEDA EN APPS SCRIPT
════════════════════════════════════════════════════════════ */
const busquedasRegistradas = new Set();

async function registrarBusqueda(termino) {
  if (USAR_DATOS_DEMO) return;
  if (busquedasRegistradas.has(termino)) return;
  busquedasRegistradas.add(termino);

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion:      'busqueda',
        termino,
        zona:        Estado.colonia,
        resultados:  Estado.filtrados.length,
      }),
    });
  } catch (e) {
    // Silencioso — no afecta la experiencia del usuario
  }
}

/* ════════════════════════════════════════════════════════════
   UI HELPERS
════════════════════════════════════════════════════════════ */
function mostrarSkeleton(mostrar) {
  document.getElementById('loading-state').hidden = !mostrar;
}

function mostrarError(msg) {
  const scroll = document.getElementById('cards-scroll');
  scroll.querySelectorAll('.biz-card').forEach(c => c.remove());
  document.getElementById('empty-state').setAttribute('hidden', '');

  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <p class="empty-title">Error de conexión</p>
    <p class="empty-desc">${msg}</p>
    <button class="empty-clear" onclick="location.reload()">Reintentar</button>`;
  scroll.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   SPLASH → INIT
════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initMapa();
  renderizarSugerencias();

  // Intentar GPS silenciosamente
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        Estado.userLatLng = [pos.coords.latitude, pos.coords.longitude];
        map.setView([pos.coords.latitude, pos.coords.longitude], MAPA_ZOOM_DEFAULT);
        ponerMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
      },
      () => {}, // fallo silencioso — queda en centro default
      { timeout: 5000, maximumAge: 120000 }
    );
  }

  // Cargar negocios y ocultar splash
  cargarNegocios().then(() => {
    setTimeout(() => {
      document.getElementById('splash').classList.add('is-hidden');
    }, 200);
  });
});
