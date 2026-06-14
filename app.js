// CAMBIA ESTA URL POR LA DE TU APPS SCRIPT PUBLICADO EN EL PASO 1
const APPS_SCRIPT_API = "TU_URL_DE_APPS_SCRIPT_AQUI";

const CENTRO_DEFAULT = [13.689356, -89.18718]; // El Salvador por defecto
let map;
let marcadores = [];
let baseNegocios = [];
let filtroColonia = "todos";

function initMapa() {
  map = L.map('map', { zoomControl: false }).setView(CENTRO_DEFAULT, 14);

  // Capa urbana elegante y oscura integrada para encajar con el CSS urbano
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
}

async function descargarDatos(queryIA = "") {
  try {
    let url = APPS_SCRIPT_API;
    if (queryIA) {
      url += `?q=${encodeURIComponent(queryIA)}`;
    }
    
    const respuesta = await fetch(url);
    baseNegocios = await respuesta.json();
    actualizarVistaCompleta();
  } catch(e) {
    console.error("Error al conectar con la API de Google Sheets:", e);
    // Carga defensiva local si la hoja de cálculo tarda en responder
    baseNegocios = [
      { id: "1", nombre: "Papelería e Impresiones vico", colonia: "Urb. Nuevo Lourdes", lat: 13.6893, lng: -89.1871, descripcion: "Copias nítidas, impresiones de guías y pago de recibos.", categoria: "servicios" },
      { id: "2", nombre: "Pupusería El Retorno", colonia: "Col. Escalón", lat: 13.6910, lng: -89.1850, descripcion: "Pupusas tradicionales de queso, chicharrón y especialidades.", categoria: "comida" }
    ];
    actualizarVistaCompleta();
  } finally {
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
  }
}

function actualizarVistaCompleta() {
  // 1. Limpiar marcadores antiguos del mapa
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];

  // 2. Limpiar panel lateral de tarjetas
  const container = document.getElementById('cards-container');
  container.innerHTML = "";

  // 3. Filtrar según la colonia seleccionada en la barra superior
  const negociosFiltrados = baseNegocios.filter(b => {
    return filtroColonia === "todos" || b.colonia === filtroColonia;
  });

  if (negociosFiltrados.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:#aaa;">No se encontraron comercios en esta selección.</p>`;
    return;
  }

  // 4. Pintar datos filtrados en mapa e interfaz
  negociosFiltrados.forEach(negocio => {
    // Añadir pin al mapa
    const marcador = L.marker([negocio.lat, negocio.lng]).bindPopup(`
      <b style="color:#22A05E;">${negocio.nombre}</b><br>
      <span style="font-size:12px;">${negocio.descripcion}</span>
    `);
    marcador.addTo(map);
    marcadores.push(marcador);

    // Añadir tarjeta en la lista lateral
    const card = document.createElement('div');
    card.className = 'biz-card';
    card.innerHTML = `
      <h4 class="biz-title">${negocio.nombre}</h4>
      <p class="biz-desc">${negocio.descripcion}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10px; color:#22A05E; font-weight:bold; text-transform:uppercase;">${negocio.colonia}</span>
        <button class="btn-locate">📍 Ver</button>
      </div>
    `;

    card.querySelector('.btn-locate').onclick = () => {
      map.setView([negocio.lat, negocio.lng], 17);
      marcador.openPopup();
    };

    container.appendChild(card);
  });
}

// Configurar los escuchadores y clics
function instalarListeners() {
  // Clic en barras de colonias (chips)
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.onclick = (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filtroColonia = e.currentTarget.dataset.colonia;
      actualizarVistaCompleta();
    };
  });

  // Gatillo del botón de IA
  document.getElementById('search-btn').onclick = () => {
    const txt = document.getElementById('search-input').value;
    if (!txt.trim()) return;
    
    // Mostramos un loader provisional en las tarjetas mientras Gemini piensa en la API
    document.getElementById('cards-container').innerHTML = "<p style='color:#22A05E;'>La IA está analizando los comercios...</p>";
    descargarDatos(txt);
  };
}

// Inicialización de la aplicación
window.addEventListener('DOMContentLoaded', () => {
  initMapa();
  instalarListeners();
  descargarDatos();
});
