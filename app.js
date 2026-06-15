// 1. URL DE CONEXIÓN CON GOOGLE APPS SCRIPT
const APPS_SCRIPT_API = "https://script.google.com/macros/s/AKfycbyaZXNodzFzX8veAs4gX0dF7pp6ApAQWch9d-iQ9_4Ar-ZjzeNHdQ5waiaMquUeDbJ0/exec";

const CENTRO_DEFAULT = [13.689356, -89.18718]; // Coordenadas por defecto (El Salvador)
let map;
let marcadores = [];
let baseNegocios = [];
let filtroColonia = "todos";
let marcadorUsuario = null;

/* ════════════════════════════════════════════════════════════
   2. INICIALIZACIÓN DEL MAPA Y DETECCIÓN DE UBICACIÓN (GPS)
════════════════════════════════════════════════════════════ */
function initMapa() {
  try {
    if (!document.getElementById('map')) return;

    map = L.map('map', { zoomControl: false }).setView(CENTRO_DEFAULT, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const miLat = pos.coords.latitude;
          const miLng = pos.coords.longitude;
          if (baseNegocios.length === 0) {
            map.setView([miLat, miLng], 15);
          }
          ponerMarcadorUsuario(miLat, miLng);
        },
        (error) => {
          console.warn("[vico] Acceso a GPS denegado o no disponible.");
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  } catch (err) {
    console.error("[vico] Error al inicializar el mapa:", err);
  }
}

function ponerMarcadorUsuario(lat, lng) {
  if (!map) return;

  const iconoUsuario = L.divIcon({
    className: 'marcador-usuario-gps',
    html: `
      <div style="
        width: 14px; height: 14px; 
        background: #007BFF; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 10px rgba(0,123,255,0.6);
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
    
    console.log("[vico] Intentando conectar con Google Apps Script...");
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) {
      throw new Error("La respuesta de la API no fue correcta");
    }

    baseNegocios = await respuesta.json();
    console.log("[vico] Datos recibidos con éxito de la base de datos:", baseNegocios);
    
    // Si la respuesta no es un arreglo válido, la convertimos en uno vacío para no romper el bucle
    if (!Array.isArray(baseNegocios)) {
      baseNegocios = [];
    }

    actualizarVistaCompleta();
  } catch(e) {
    console.error("[vico] Fallo crítico al conectar con la API de Google Sheets:", e);
    baseNegocios = [];
    actualizarVistaCompleta();
    
    const container = document.getElementById('cards-container');
    if (container) {
      container.innerHTML = `<p style="font-size:13px; color:#ff6b6b; padding:10px; background:rgba(255,107,107,0.1); border-radius:6px;">⚠️ Error de conexión con la base de datos. Asegúrate de haber publicado correctamente el Apps Script en Google.</p>`;
    }
  } finally {
    // ESTO GARANTIZA QUE LA PANTALLA DE CARGA SE QUITE SÍ O SÍ PASE LO QUE PASE
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.display = 'none';
      console.log("[vico] Pantalla de carga retirada.");
    }
  }
}

function actualizarVistaCompleta() {
  try {
    marcadores.forEach(m => map.removeLayer(m));
    marcadores = [];

    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = "";

    const negociosFiltrados = baseNegocios.filter(b => {
      if (!b || !b.colonia) return false;
      return filtroColonia === "todos" || b.colonia === filtroColonia;
    });

    if (negociosFiltrados.length === 0) {
      container.innerHTML = `<p style="font-size:13px; color:#aaa;">No se encontraron comercios aprobados en esta selección.</p>`;
      return;
    }

    const grupoCoordenadas = [];

    negociosFiltrados.forEach(negocio => {
      const latitud = parseFloat(negocio.lat);
      const longitud = parseFloat(negocio.lng);

      if (isNaN(latitud) || isNaN(longitud)) {
        console.warn(`[vico] Negocio omitido por coordenadas inválidas: ${negocio.nombre}`);
        return;
      }

      grupoCoordenadas.push([latitud, longitud]);

      const iconoNegocio = L.divIcon({
        className: 'marcador-negocio-vico',
        html: `
          <div style="
            width: 12px; height: 12px; 
            background: #22A05E; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marcador = L.marker([latitud, longitud], { icon: iconoNegocio }).bindPopup(`
        <div style="color: #333; font-family: sans-serif; min-width:150px;">
          <b style="color:#22A05E; font-size:14px;">${negocio.nombre}</b><br>
          <span style="font-size:12px; display:block; margin-top:4px;">${negocio.descripcion || ''}</span>
        </div>
      `);
      
      marcador.addTo(map);
      marcadores.push(marcador);

      const card = document.createElement('div');
      card.className = 'biz-card';
      card.innerHTML = `
        <h4 class="biz-title">${negocio.nombre}</h4>
        <p class="biz-desc">${negocio.descripcion || 'Sin descripción'}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10px; color:#22A05E; font-weight:bold; text-transform:uppercase;">${negocio.colonia}</span>
          <button class="btn-locate">📍 Ver</button>
        </div>
      `;

      card.querySelector('.btn-locate').onclick = () => {
        map.setView([latitud, longitud], 17);
        marcador.openPopup();
      };

      container.appendChild(card);
    });

    if (grupoCoordenadas.length > 0 && map) {
      const bounds = L.latLngBounds(grupoCoordenadas);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  } catch (error) {
    console.error("[vico] Error durante el renderizado de la interfaz:", error);
  }
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

  const btnSearch = document.getElementById('search-btn');
  if (btnSearch) {
    btnSearch.onclick = () => {
      const txt = document.getElementById('search-input').value;
      if (!txt.trim()) return;
      
      const container = document.getElementById('cards-container');
      if (container) container.innerHTML = "<p style='color:#22A05E;'>La IA está analizando los comercios cercanos...</p>";
      descargarDatos(txt);
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initMapa();
  instalarListeners();
  descargarDatos();
});
