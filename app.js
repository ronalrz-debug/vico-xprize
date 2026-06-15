// 1. URL DE CONEXIÓN CON GOOGLE APPS SCRIPT
const APPS_SCRIPT_API = "https://script.google.com/macros/s/AKfycbyaZXNodzFzX8veAs4gX0dF7pp6ApAQWch9d-iQ9_4Ar-ZjzeNHdQ5waiaMquUeDbJ0/exec";

const CENTRO_DEFAULT = [13.689356, -89.18718]; // Coordenadas por defecto
let map;
let marcadores = [];
let baseNegocios = [];
let filtroColonia = "todos";
let marcadorUsuario = null;

/* ════════════════════════════════════════════════════════════
   2. INICIALIZACIÓN DEL MAPA Y DETECCIÓN DE UBICACIÓN (GPS)
════════════════════════════════════════════════════════════ */
function initMapa() {
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
        // Solo centramos en
