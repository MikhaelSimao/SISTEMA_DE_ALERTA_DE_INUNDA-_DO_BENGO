/**
 * =============================================================
 *  map.js - MÓDULO DE MAPA DE RISCO (API de Mapas)
 * =============================================================
 * Utiliza a biblioteca Leaflet.js com o serviço de mapas
 * gratuito OpenStreetMap para mostrar a localização geográfica
 * do bairro Mubungo (província do Bengo) e dos sensores nele
 * instalados, coloridos de acordo com o seu nível de risco.
 *
 * NOTA: caso a instituição possua uma chave da API do Google
 * Maps, é possível substituir facilmente o "tileLayer" do
 * OpenStreetMap por um "google.maps.Map", bastando incluir o
 * script oficial do Google Maps com a chave (API key) no
 * index.html e adaptar a função iniciar() abaixo.
 * =============================================================
 */

const FloodMap = (() => {

  let mapa = null;
  let marcadores = [];

  // Coordenadas aproximadas do bairro Mubungo, província do Bengo, Angola
  const CENTRO_MUBUNGO = [-8.6128, 13.6918];

  /** Inicializa (ou reinicializa) o mapa no elemento com o id indicado */
  function iniciar(elementoId) {
    const container = document.getElementById(elementoId);
    if (!container) return;

    // Se já existe um mapa anterior, remove-o para evitar duplicação
    if (mapa) { mapa.remove(); mapa = null; }

    mapa = L.map(elementoId).setView(CENTRO_MUBUNGO, 15);

    // Camada de mapa base (OpenStreetMap - gratuito, sem necessidade de chave de API)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; Colaboradores do OpenStreetMap',
      maxZoom: 19
    }).addTo(mapa);

    atualizarMarcadoresSensores();
  }

  /** Devolve a cor do marcador conforme o estado do sensor */
  function _corPorEstado(estado) {
    if (estado === 'critico') return '#dc3545';
    if (estado === 'alerta') return '#fd7e14';
    return '#198754';
  }

  /** Desenha/atualiza no mapa os marcadores de todos os sensores cadastrados */
  function atualizarMarcadoresSensores() {
    if (!mapa) return;
    marcadores.forEach(m => mapa.removeLayer(m));
    marcadores = [];

    const sensores = FloodSensors.listar();
    sensores.forEach(sensor => {
      const estado = FloodSensors.classificarEstado(sensor);
      const marcador = L.circleMarker([sensor.latitude, sensor.longitude], {
        radius: 12,
        fillColor: _corPorEstado(estado),
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      }).addTo(mapa);

      marcador.bindPopup(`
        <b>${sensor.nome}</b><br/>
        Local: ${sensor.localizacao}<br/>
        Nível atual: ${sensor.nivelAtual} m<br/>
        Estado: <b>${estado.toUpperCase()}</b><br/>
        Dispositivo: ${sensor.dispositivo} (${sensor.modo === 'real' ? 'ligação real' : 'simulação'})
      `);
      marcadores.push(marcador);
    });
  }

  return { iniciar, atualizarMarcadoresSensores };
})();
