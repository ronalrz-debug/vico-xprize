/* ════════════════════════════════════════════════════════════
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
════════════════════════════════════════════════════════════ */
const CATEGORIAS_VALIDAS = ['comida', 'ropa', 'tecnologia', 'servicios', 'salud', 'educacion', 'ocio', 'otros'];
const COORDENADAS_DEFAULT = [13.689356, -89.18718]; // Coordenadas del centro por defecto
const MAPA_ZOOM_DEFAULT = 14;

let map;
let marcadoresCluster;
let marcadorUsuario = null;

// Estado único de la aplicación
const Estado = {
  negocios: [],
  categoriaActiva: 'todos',
  busquedaQuery: '',
  userLatLng: null
};

/* ════════════════════════════════════════════════════════════
   2. INICIALIZACIÓN DEL MAPA (LEAFLET)
════════════════════════════════════════════════════════════ */
function initMapa() {
  // Inicializar contenedor del mapa Leaflet
  map = L.map('map', {
    zoomControl: false 
  }).setView(COORDENADAS_DEFAULT, MAPA_ZOOM_DEFAULT);

  // Capa de diseño del mapa (OpenStreetMap con estilo sutil)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Mover botones de zoom a la esquina inferior derecha
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Inicializar el grupo de agrupación de marcadores (MarkerCluster)
  marcadoresCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true
  });
  map.addLayer(marcadoresCluster);
}

function ponerMarcadorUsuario(lat, lng) {
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
   3. CONSUMO DE DATOS (API / JSON)
════════════════════════════════════════════════════════════ */
async function cargarNegocios() {
  try {
    // Intentar cargar el archivo estructurado de negocios locales
    const respuesta = await fetch('data.json');
    if (!respuesta.ok) {
      throw new Error(`Error en el servidor: ${respuesta.status} ${respuesta.statusText}`);
    }
    Estado.negocios = await respuesta.json();
    actualizarInterfaz();
  } catch (error) {
    console.error('[LocalCerca] Error al obtener el repositorio de comercios:', error);
    mostrarError('No se pudo conectar a la base de datos. Cargando modo demostración local...');
    
    // Datos de respaldo por si el fetch falla en local
    Estado.negocios = [
      { id: 1, nombre: "Café Don Juan", categoria: "comida", lat: 13.6893, lng: -89.1871, telefono: "2200-0000", descripcion: "Café artesanal premium." },
      { id: 2, nombre: "Boutique Estilo", categoria: "ropa", lat: 13.6910, lng: -89.1850, telefono: "2200-0001", descripcion: "Moda urbana contemporánea." }
    ];
    actualizarInterfaz();
  }
}

/* ════════════════════════════════════════════════════════════
   4. RENDERIZADO Y CONTROLADORES DE INTERFAZ (DOM)
════════════════════════════════════════════════════════════ */
function actualizarInterfaz() {
  // Filtrado de la lista maestra basado en el Estado global
  const negociosFiltrados = Estado.negocios.filter(negocio => {
    const cumpleCategoria = Estado.categoriaActiva === 'todos' || negocio.categoria === Estado.categoriaActiva;
    const cumpleBusqueda = negocio.nombre.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()) ||
                           (negocio.descripcion && negocio.descripcion.toLowerCase().includes(Estado.busquedaQuery.toLowerCase()));
    return cumpleCategoria && cumpleBusqueda;
  });

  renderizarListaTarjetas(negociosFiltrados);
  actualizarMarcadoresMapa(negociosFiltrados);
}

function renderizarListaTarjetas(lista) {
  const contenedor = document.getElementById('lista-negocios');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="sin-resultados animated fadeIn">
        <p>No se encontraron comercios que coincidan con los criterios actuales.</p>
      </div>
    `;
    return;
  }

  lista.forEach(negocio => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-comercio animated fadeIn';
    tarjeta.innerHTML = `
      <div class="tarjeta-cuerpo">
        <span class="etiqueta-categoria">${negocio.categoria.toUpperCase()}</span>
        <h3 class="comercio-titulo">${negocio.nombre}</h3>
        <p class="comercio-descripcion">${negocio.descripcion || 'Sin descripción disponible.'}</p>
        ${negocio.telefono ? `<a href="tel:${negocio.telefono}" class="comercio-telefono"><i class="fas fa-phone-alt"></i> ${negocio.telefono}</a>` : ''}
      </div>
      <div class="tarjeta-acciones">
        <button class="btn-ir" onclick="enfocarComercio(${negocio.lat}, ${negocio.lng}, '${negocio.nombre.replace(/'/g, "\\'")}')">
          <i class="fas fa-directions"></i> Ubicar
        </button>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });
}

function actualizarMarcadoresMapa(lista) {
  if (!marcadoresCluster) return;
  marcadoresCluster.clearLayers();

  lista.forEach(negocio => {
    const popupContenido = `
      <div class="popup-custom">
        <h4>${negocio.nombre}</h4>
        <p>${negocio.descripcion || ''}</p>
        ${negocio.telefono ? `<a href="tel:${negocio.telefono}" class="btn-popup-tel"><i class="fas fa-phone"></i> Llamar</a>` : ''}
      </div>
    `;

    const marcador = L.marker([negocio.lat, negocio.lng])
      .bindPopup(popupContenido, { closeButton: false, offset: L.point(0, -5) });
    
    marcadoresCluster.addLayer(marcador);
  });
}

function renderizarSugerencias() {
  const contenedorSugerencias = document.getElementById('sugerencias-categorias');
  if (!contenedorSugerencias) return;

  CATEGORIAS_VALIDAS.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'btn-filtro-rapido';
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.onclick = () => {
      Estado.categoriaActiva = cat;
      
      // Marcar visualmente el botón activo en el menú lateral real si existe
      const itemsMenu = document.querySelectorAll('.menu-item');
      itemsMenu.forEach(item => {
        if(item.dataset.categoria === cat) item.classList.add('is-active');
        else item.classList.remove('is-active');
      });

      actualizarInterfaz();
    };
    contenedorSugerencias.appendChild(btn);
  });
}

function enfocarComercio(lat, lng, nombre) {
  if (!map) return;
  map.setView([lat, lng], 17, { animate: true, duration: 1 });
  
  // Buscar el marcador específico dentro del cluster y abrir su información emergente
  marcadoresCluster.eachLayer(marker => {
    if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
      setTimeout(() => marker.openPopup(), 300);
    }
  });

  // Cerrar el panel lateral responsivo en móviles para ver el mapa
  const panelLateral = document.getElementById('panel-lateral');
  if (panelLateral && window.innerWidth <= 768) {
    panelLateral.classList.remove('is-open');
  }
}

function mostrarError(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'toast-error-app';
  toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${mensaje}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ════════════════════════════════════════════════════════════
   5. ESCUCHADORES DE EVENTOS DEL USUARIO (LISTENERS)
════════════════════════════════════════════════════════════ */
// Control de pestañas/menú de categorías
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('is-active'));
    e.currentTarget.classList.add('is-active');
    Estado.categoriaActiva = e.currentTarget.dataset.categoria;
    actualizarInterfaz();
  });
});

// Caja de entrada de búsqueda con retardo sutil (Debounce manual sencillo)
const inputBusqueda = document.getElementById('input-busqueda');
if (inputBusqueda) {
  let temporizadorBusqueda;
  inputBusqueda.addEventListener('input', (e) => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      Estado.busquedaQuery = e.target.value;
      actualizarInterfaz();
    }, 250);
  });
}

// Botón de activación del menú responsivo flotante
const btnAlternarPanel = document.getElementById('btn-toggle-panel');
const panelLateral = document.getElementById('panel-lateral');
if (btnAlternarPanel && panelLateral) {
  btnAlternarPanel.addEventListener('click', () => {
    panelLateral.classList.toggle('is-open');
  });
}

/* ════════════════════════════════════════════════════════════
   6. SPLASH → CONTROL INTELIGENTE DE INICIALIZACIÓN
════════════════════════════════════════════════════════════ */
function inicializarAplicacion() {
  const splashElement = document.getElementById('splash');

  // 1. Validar si Leaflet se cargó correctamente (Evita congelamiento si estás offline)
  if (typeof L === 'undefined') {
    console.error('[LocalCerca] Error crítico: No se pudo cargar Leaflet. Verifica tu conexión a internet.');
    mostrarError('No se pudo cargar el mapa (Leaflet offline). Mostrando datos locales...');
    
    // Forzamos la retirada del splash para que el usuario pueda interactuar con la web
    if (splashElement) splashElement.classList.add('is-hidden');
    return;
  }

  // 2. Inicializar componentes visuales si la librería existe
  initMapa();
  renderizarSugerencias();

  // 3. Intentar GPS de forma segura bajo un bloque try/catch (Evita bloqueos en file:// o entornos inseguros)
  if (navigator.geolocation) {
    try {
      navigator.geolocation.getCurrentPosition(
        pos => {
          Estado.userLatLng = [pos.coords.latitude, pos.coords.longitude];
          if (map) {
            map.setView([pos.coords.latitude, pos.coords.longitude], MAPA_ZOOM_DEFAULT);
            ponerMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
          }
        },
        () => {
          console.warn('[LocalCerca] No se otorgaron permisos de GPS o la ubicación no está disponible.');
        }, 
        { timeout: 5000, maximumAge: 120000 }
      );
    } catch (geoError) {
      console.warn('[LocalCerca] Geolocalización rechazada por políticas del navegador:', geoError.message);
    }
  }

  // 4. Cargar negocios y ocultar splash screen de forma garantizada al terminar
  cargarNegocios().then(() => {
    setTimeout(() => {
      if (splashElement) {
        splashElement.classList.add('is-hidden');
      }
    }, 200);
  });
}

// 5. Verificación del ciclo de vida del DOM para asegurar que el script se lance sin retrasos
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
  inicializarAplicacion();
}
