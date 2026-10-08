// Endereço do backend local. Não coloque senhas neste arquivo público.
window.MOBILYS_API_URL = ['5500','5501'].includes(location.port)
  ? `${location.protocol}//${location.hostname}:8080/api`
  : `${location.origin}/api`;
// Provedor substituível. Use apenas tiles visíveis; preserve a atribuição no mapa.
window.MOBILYS_MAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
window.MOBILYS_MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
