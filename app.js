/* ════════════════════════════════════════════════════════════
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
════════════════════════════════════════════════════════════ */
const COORDENADAS_DEFAULT = [13.689356, -89.18718]; // Coordenadas de El Salvador por defecto
const MAPA_ZOOM_DEFAULT = 14;

let map;
let marcadoresCluster = null;
let marcadoresNormales = []; // Respaldo por si MarkerCluster falla
let marcadorUsuario = null;

const Estado = {
  negocios: [],
  coloniaActiva: 'todos',
  busquedaQuery: ''
};

/* ════════════════════════════════════════════════════════════
   2. INICIALIZACIÓN DEL MAPA
════════════════════════════════════════════════════════════ */
function initMapa() {
  if (!document.getElementById('map')) return;

  map = L.map('map', { zoomControl: false }).setView(COORDENADAS_DEFAULT, MAPA_ZOOM_DEFAULT);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // MODO SEGURO: Inicializar MarkerCluster SOLO si la librería ya cargó en el HTML
  if (typeof L.markerClusterGroup === 'function') {
    marcadoresCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true
    });
    map.addLayer(marcadoresCluster);
    console.log("[LocalCerca] Grupos de marcadores activados correctamente.");
  } else {
    // Si da error, usamos una lista normal y no rompemos la app
    console.warn("[LocalCerca] Servidor desactualizado: Usando modo de marcadores individuales estándar.");
    marcadoresCluster = null;
  }
}

function ponerMarcadorUsuario(lat, lng) {
  if (!map) return;
  const iconoUsuario = L.divIcon({
    className: 'marcador-usuario-pulsante',
    html: '<div class="pulso"></div><div class="centro"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  if (marcadorUsuario) {
    marcadorUsuario.setLatLng([lat, lng]);
  } else {
    marcadorUsuario = L.marker([lat, lng], { icon: iconoUsuario }).addTo(map);
  }
}

/* ════════════════════════════════════════════════════════════
   3. CONSUMO DE DATOS Y FILTRADO
════════════════════════════════════════════════════════════ */
async function cargarNegocios() {
  try {
    const respuesta = await fetch('data.json');
    if (!respuesta.ok) throw new Error('No se pudo leer data.json');
    Estado.negocios = await respuesta.json();
  } catch (error) {
    console.warn('[LocalCerca] Cargando datos locales simulados.');
    Estado.negocios = [
      { id: 1, nombre: "Centro de Impresiones Rápidas", tipo: "premium", colonia: "Urb. Nuevo Lourdes", lat: 13.6893, lng: -89.1871, descripcion: "Impresiones láser, copias, encuadernación y pagos de servicios." },
      { id: 2, nombre: "Banco del Barrio", tipo: "regular", colonia: "Col. Escalón", lat: 13.6910, lng: -89.1850, descripcion: "Retiros, depósitos y corresponsal financiero rápido." },
      { id: 3, nombre: "Pupusería Bella Vista", tipo: "premium", colonia: "Merliot", lat: 13.6850, lng: -89.2010, descripcion: "Pupusas de maíz y arroz, desayunos tradicionales." }
    ];
  }
  actualizarInterfaz();
}

function actualizarInterfaz() {
  const loadingState = document.getElementById('loading-state');
  if (loadingState) loadingState.hidden = true;

  const negociosFiltrados = Estado.negocios.filter(negocio => {
    const cumpleColonia = Estado.coloniaActiva === 'todos' || negocio.colonia === Estado.coloniaActiva;
    const cumpleBusqueda = negocio.nombre.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()) ||
                           (negocio.descripcion && negocio.descripcion.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()));
    return cumpleColonia && cumpleBusqueda;
  });

  const txtCount = document.getElementById('panel-count');
  if (txtCount) txtCount.textContent = `(${negociosFiltrados.length})`;

  renderizarTarjetas(negociosFiltrados);
  actualizarMarcadores(negociosFiltrados);
}

/* ════════════════════════════════════════════════════════════
   4. RENDERIZADO DE COMPONENTES
════════════════════════════════════════════════════════════ */
function renderizarTarjetas(lista) {
  const contenedor = document.getElementById('cards-scroll');
  const emptyState = document.getElementById('empty-state');
  if (!contenedor) return;

  const tarjetasViejas = contenedor.querySelectorAll('.card-item-dinamico');
  tarjetasViejas.forEach(t => t.remove());

  if (lista.length === 0) {
    if (emptyState) {
      emptyState.hidden = false;
      const term = document.getElementById('empty-term');
      if (term) term.textContent = Estado.busquedaQuery || Estado.coloniaActiva;
    }
    return;
  }

  if (emptyState) emptyState.hidden = true;

  lista.forEach(negocio => {
    const card = document.createElement('div');
    card.className = `card-item-dinamico card-negocio ${negocio.tipo === 'premium' ? 'card--premium' : ''}`;
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #eee;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #ff6b6b;">${negocio.colonia}</span>
        <h3 style="margin: 4px 0; font-family: 'Syne', sans-serif; font-size: 16px;">${negocio.nombre}</h3>
        <p style="font-size: 13px; color: #555; margin: 4px 0 12px 0;">${negocio.descripcion || ''}</p>
        <button class="btn-ubicar-card" style="background: #111; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;">
          📍 Ubicar en mapa
        </button>
      </div>
    `;

    card.querySelector('.btn-ubicar-card').onclick = () => {
      if (map) {
        map.setView([negocio.lat, negocio.lng], 17, { animate: true });
        
        // Abrir popup de forma compatible con ambos modos
        if (marcadoresCluster) {
          marcadoresCluster.eachLayer(m => {
            if (m.getLatLng().lat === negocio.lat && m.getLatLng().lng === negocio.lng) setTimeout(() => m.openPopup(), 250);
          });
        } else {
          marcadoresNormales.forEach(m => {
            if (m.getLatLng().lat === negocio.lat && m.getLatLng().lng === negocio.lng) setTimeout(() => m.openPopup(), 250);
          });
        }
      }
    };

    contenedor.appendChild(card);
  });
}

function actualizarMarcadores(lista) {
  // Limpieza si usamos clusters
  if (marcadoresCluster) {
    marcadoresCluster.clearLayers();
  } else {
    // Limpieza si estamos usando marcadores normales de Leaflet
    marcadoresNormales.forEach(m => map.removeLayer(m));
    marcadoresNormales = [];
  }

  lista.forEach(negocio => {
    const marcador = L.marker([negocio.lat, negocio.lng]).bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 4px;">
        <strong style="font-family: 'Syne', sans-serif; font-size: 14px; display:block; margin-bottom:4px;">${negocio.nombre}</strong>
        <span style="font-size:12px; color:#444;">${negocio.descripcion || 'Sin descripción.'}</span>
      </div>
    `, { closeButton: false });

    if (marcadoresCluster) {
      marcadoresCluster.addLayer(marcador);
    } else {
      marcador.addTo(map);
      marcadoresNormales.push(marcador);
    }
  });
}

/* ════════════════════════════════════════════════════════════
   5. ESCUCHADORES DE EVENTOS (LISTENERS)
════════════════════════════════════════════════════════════ */
function asociarEventos() {
  const inputBusqueda = document.getElementById('search-input');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
      Estado.busquedaQuery = e.target.value;
      actualizarInterfaz();
    });
  }

  const chips = document.querySelectorAll('.colonias-scroll .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('chip--active'));
      e.currentTarget.classList.add('chip--active');
      Estado.coloniaActiva = e.currentTarget.dataset.colonia;
      actualizarInterfaz();
    });
  });

  const btnIn = document.getElementById('zoom-in');
  const btnOut = document.getElementById('zoom-out');
  if (btnIn) btnIn.onclick = () => { if (map) map.zoomIn(); };
  if (btnOut) btnOut.onclick = () => { if (map) map.zoomOut(); };

  const btnGps = document.getElementById('btn-gps');
  if (btnGps) {
    btnGps.onclick = () => {
      if (navigator.geolocation && map) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 16);
          ponerMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        });
      }
    };
  }
}

window.clearSearch = function() {
  const inputBusqueda = document.getElementById('search-input');
  if (inputBusqueda) inputBusqueda.value = '';
  Estado.busquedaQuery = '';
  const primeraColonia = document.querySelector('.colonias-scroll .chip');
  if (primeraColonia) primeraColonia.click();
};

/* ════════════════════════════════════════════════════════════
   6. CONTROL DE ARRANQUE IMPERMEABLE
════════════════════════════════════════════════════════════ */
function inicializarAplicacion() {
  const splashElement = document.getElementById('splash');

  // Ejecutar inicialización pase lo que pase
  try {
    initMapa();
    asociarEventos();
  } catch(err) {
    console.error("[LocalCerca] Error en arranque crítico:", err);
  }

  // Quitar la pantalla de carga inmediatamente de forma garantizada
  cargarNegocios().finally(() => {
    setTimeout(() => {
      if (splashElement) {
        splashElement.style.display = 'none'; 
        console.log("[LocalCerca] Aplicación desplegada en modo seguro continuo.");
      }
    }, 200);
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
  inicializarAplicacion();
}
