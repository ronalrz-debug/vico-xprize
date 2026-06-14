// 1. TU URL DE GOOGLE APPS SCRIPT (Cambiá esto por tu enlace real terminado en /exec)
const APPS_SCRIPT_API = "https://script.google.com/macros/s/AKfycbxKiCX5mEVK7iIrmBAP078DGTxGxIEPLLlua4zcb-07Rs4amm8MUIAFAaLceGn5k-Jg/exec";

const CENTRO_DEFAULT = [13.689356, -89.18718]; // Coordenadas de respaldo (El Salvador)
let map;
let marcadores = [];
let baseNegocios = [];
let filtroColonia = "todos";
let marcadorUsuario = null; // Guardará el pin de la posición del usuario

/* ════════════════════════════════════════════════════════════
   2. INICIALIZACIÓN DEL MAPA Y DETECCIÓN DE UBICACIÓN (GPS)
════════════════════════════════════════════════════════════ */
function initMapa() {
  if (!document.getElementById('map')) return;

  // Creamos el mapa con un zoom inicial intermedio
  map = L.map('map', { zoomControl: false }).setView(CENTRO_DEFAULT, 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  // MÓDULO GPS: Intentar leer la posición real del dispositivo inmediatamente
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const miLat = pos.coords.latitude;
        const miLng = pos.coords.longitude;
        
        console.log(`[vico] Ubicación detectada con éxito: ${miLat}, ${miLng}`);
        
        // Centramos el mapa directamente en la ubicación real del usuario con un zoom más cercano (calle)
        map.setView([miLat, miLng], 16);
        
        // Dibujamos un marcador especial y personalizado para el usuario
        ponerMarcadorUsuario(miLat, miLng);
      },
      (error) => {
        console.warn("[vico] No se pudo acceder al GPS o permisos denegados. Usando centro por defecto.", error.message);
      },
      {
        enableHighAccuracy: true, // Intenta usar GPS satelital/alta precisión si está en móvil
        timeout: 6000,            // Si tarda más de 6 segundos buscando, pasa de largo para no congelar la app
        maximumAge: 0             // No usar posiciones viejas guardadas en caché
      }
    );
  } else {
    console.warn("[vico] Este navegador antiguo no soporta Geolocalización.");
  }
}

// Función para pintar o actualizar el punto del usuario en tiempo real
function ponerMarcadorUsuario(lat, lng) {
  if (!map) return;

  // Un diseño circular sutil con CSS para que sepa dónde está parado
  const iconoUsuario = L.divIcon({
    className: 'marcador-usuario-gps',
    html: `
      <div style="
        width: 14px; height: 14px; 
        background: #22A05E; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 10px rgba(34,160,94,0.6);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  if (marcadorUsuario) {
    marcadorUsuario.setLatLng([lat, lng]);
  } else {
    marcadorUsuario = L.marker([lat, lng], { icon: iconoUsuario }).addTo(map)
      .bindPopup("<b>Tú estás aquí</b>", { closeButton: false });
  }
}

/* ════════════════════════════════════════════════════════════
   3. CONSUMO DE DATOS Y FILTRADO
════════════════════════════════════════════════════════════ */
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
    // Datos mockup de respaldo por seguridad offline
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
  // Limpiar únicamente los marcadores de los negocios (dejando vivo el del usuario)
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];

  const container = document.getElementById('cards-container');
  container.innerHTML = "";

  const negociosFiltrados = baseNegocios.filter(b => {
    return filtroColonia === "todos" || b.colonia === filtroColonia;
  });

  if (negociosFiltrados.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:#aaa;">No se encontraron comercios en esta selección.</p>`;
    return;
  }

  negociosFiltrados.forEach(negocio => {
    const marcador = L.marker([negocio.lat, negocio.lng]).bindPopup(`
      <b style="color:#22A05E;">${negocio.nombre}</b><br>
      <span style="font-size:12px;">${negocio.descripcion}</span>
    `);
    marcador.addTo(map);
    marcadores.push(marcador);

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

/* ════════════════════════════════════════════════════════════
   4. ESCUCHADORES DE EVENTOS
════════════════════════════════════════════════════════════ */
function instalarListeners() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.onclick = (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filtroColonia = e.currentTarget.dataset.colonia;
      actualizarVistaCompleta();
    };
  });

  document.getElementById('search-btn').onclick = () => {
    const txt = document.getElementById('search-input').value;
    if (!txt.trim()) return;
    
    document.getElementById('cards-container').innerHTML = "<p style='color:#22A05E;'>La IA está analizando los comercios cercanos...</p>";
    descargarDatos(txt);
  };
}

// Encendido global ordenado
window.addEventListener('DOMContentLoaded', () => {
  initMapa();
  instalarListeners();
  descargarDatos();
});
