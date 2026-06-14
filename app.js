/* ════════════════════════════════════════════════════════════
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
════════════════════════════════════════════════════════════ */
const COORDENADAS_DEFAULT = [13.689356, -89.18718]; // Coordenadas de El Salvador por defecto
const MAPA_ZOOM_DEFAULT = 14;

let map;
let marcadoresCluster;
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

  // Inicialización blindada de los grupos de marcadores agrupados
  if (typeof L.markerClusterGroup === 'function') {
    marcadoresCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true
    });
    map.addLayer(marcadoresCluster);
  } else {
    console.error("[LocalCerca] Error: La librería Leaflet.markercluster no se cargó correctamente en el HTML.");
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
    console.warn('[LocalCerca] Entrando en modo local simulado (Datos de demostración).');
    // Datos mockup para que la app no quede en blanco si falta data.json temporalmente
    Estado.negocios = [
      { id: 1, nombre: "Centro de Impresiones Rápidas", tipo: "premium", colonia: "Urb. Nuevo Lourdes", lat: 13.6893, lng: -89.1871, descripcion: "Impresiones láser, copias, encuadernación y pagos de servicios." },
      { id: 2, nombre: "Banco del Barrio", tipo: "regular", colonia: "Col. Escalón", lat: 13.6910, lng: -89.1850, descripcion: "Retiros, depósitos y corresponsal financiero rápido." },
      { id: 3, nombre: "Pupusería y Licuados Bella Vista", tipo: "premium", colonia: "Merliot", lat: 13.6850, lng: -89.2010, descripcion: "Pupusas de maíz y arroz, desayunos tradicionales y minutas." }
    ];
  }
  actualizarInterfaz();
}

function actualizarInterfaz() {
  // Desactivar el esqueleto visual de carga inicial del panel
  const loadingState = document.getElementById('loading-state');
  if (loadingState) loadingState.hidden = true;

  const negociosFiltrados = Estado.negocios.filter(negocio => {
    const cumpleColonia = Estado.coloniaActiva === 'todos' || negocio.colonia === Estado.coloniaActiva;
    const cumpleBusqueda = negocio.nombre.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()) ||
                           (negocio.descripcion && negocio.descripcion.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()));
    return cumpleColonia && cumpleBusqueda;
  });

  // Mostrar la cantidad de negocios listados
  const txtCount = document.getElementById('panel-count');
  if (txtCount) txtCount.textContent = `(${negociosFiltrados.length})`;

  renderizarTarjetas(negociosFiltrados);
  actualizarMarcadores(negociosFiltrados);
}

/* ════════════════════════════════════════════════════════════
   4. RENDERIZADO DE COMPONENTES DE INTERFAZ
════════════════════════════════════════════════════════════ */
function renderizarTarjetas(lista) {
  const contenedor = document.getElementById('cards-scroll');
  const emptyState = document.getElementById('empty-state');
  if (!contenedor) return;

  // Limpiar tarjetas dinámicas anteriores sin alterar los contenedores estructurales
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
      <div style="padding: 16px; border-bottom: 1px solid #eee; position: relative;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #ff6b6b;">${negocio.colonia}</span>
        <h3 style="margin: 4px 0; font-family: 'Syne', sans-serif; font-size: 16px;">${negocio.nombre}</h3>
        <p style="font-size: 13px; color: #555; margin: 4px 0 12px 0; line-height: 1.4;">${negocio.descripcion || ''}</p>
        <button class="btn-ubicar-card" style="background: #111; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.2s;">
          📍 Ubicar en mapa
        </button>
      </div>
    `;

    card.querySelector('.btn-ubicar-card').onclick = () => {
      if (map) {
        map.setView([negocio.lat, negocio.lng], 17, { animate: true });
        // Buscar y desplegar el popup automáticamente al centrar
        if (marcadoresCluster) {
          marcadoresCluster.eachLayer(marker => {
            if (marker.getLatLng().lat === negocio.lat && marker.getLatLng().lng === negocio.lng) {
              setTimeout(() => marker.openPopup(), 250);
            }
          });
        }
      }
    };

    contenedor.appendChild(card);
  });
}

function actualizarMarcadores(lista) {
  if (!marcadoresCluster) return;
  marcadoresCluster.clearLayers();

  lista.forEach(negocio => {
    const marcador = L.marker([negocio.lat, negocio.lng]).bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 4px;">
        <strong style="font-family: 'Syne', sans-serif; font-size: 14px; display:block; margin-bottom:4px;">${negocio.nombre}</strong>
        <span style="font-size:12px; color:#444;">${negocio.descripcion || 'Sin descripción disponible.'}</span>
      </div>
    `, { closeButton: false });
    marcadoresCluster.addLayer(marcador);
  });
}

/* ════════════════════════════════════════════════════════════
   5. ESCUCHADORES DE EVENTOS (LISTENERS)
════════════════════════════════════════════════════════════ */
function asociarEventos() {
  // Manejador del cuadro de búsqueda integrado (search-input)
  const inputBusqueda = document.getElementById('search-input');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
      Estado.busquedaQuery = e.target.value;
      actualizarInterfaz();
    });
  }

  // Filtrado dinámico por barra superior de colonias
  const chips = document.querySelectorAll('.colonias-scroll .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => {
        c.classList.remove('chip--active');
        c.setAttribute('aria-pressed', 'false');
      });
      e.currentTarget.classList.add('chip--active');
      e.currentTarget.setAttribute('aria-pressed', 'true');
      Estado.coloniaActiva = e.currentTarget.dataset.colonia;
      actualizarInterfaz();
    });
  });

  // Controles flotantes de zoom personalizados
  const btnIn = document.getElementById('zoom-in');
  const btnOut = document.getElementById('zoom-out');
  if (btnIn) btnIn.onclick = () => { if (map) map.zoomIn(); };
  if (btnOut) btnOut.onclick = () => { if (map) map.zoomOut(); };

  // Botón GPS del panel superior
  const btnGps = document.getElementById('btn-gps');
  if (btnGps) {
    btnGps.onclick = () => {
      if (navigator.geolocation && map) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 16);
          ponerMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        }, () => console.warn("Ubicación rechazada por el dispositivo."));
      }
    };
  }
}

// Función global requerida por el botón del empty state del HTML
window.clearSearch = function() {
  const inputBusqueda = document.getElementById('search-input');
  if (inputBusqueda) inputBusqueda.value = '';
  Estado.busquedaQuery = '';
  
  const primeraColonia = document.querySelector('.colonias-scroll .chip');
  if (primeraColonia) primeraColonia.click(); // Vuelve a seleccionar 'Todas'
};

/* ════════════════════════════════════════════════════════════
   6. CONTROL DE ARRANQUE Y RETIRADA DEL SPLASH SCREEN
════════════════════════════════════════════════════════════ */
function inicializarAplicacion() {
  const splashElement = document.getElementById('splash');

  // Inicialización de módulos core
  initMapa();
  asociarEventos();

  // Intentar geolocalización en background no-bloqueante al iniciar
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (map) {
          map.setView([pos.coords.latitude, pos.coords.longitude], MAPA_ZOOM_DEFAULT);
          ponerMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        }
      },
      err => console.log("Iniciando con coordenadas por defecto."),
      { timeout: 3500 }
    );
  }

  // Carga asíncrona de negocios y remoción inmediata del Splash Screen
  cargarNegocios().finally(() => {
    setTimeout(() => {
      if (splashElement) {
        splashElement.style.display = 'none'; 
        console.log("[LocalCerca] Inicialización exitosa. Splash retirado.");
      }
    }, 300);
  });
}

// Control nativo del ciclo de vida del DOM
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
  inicializarAplicacion();
}
