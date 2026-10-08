const pontosMapas=new Map();
function fecharMapasPontos(){for(const [el,mapa] of pontosMapas){mapa.remove();el.remove();}pontosMapas.clear();}
function abrirMapaPonto(linha){
  const existente=linha.querySelector('[data-mapabox]');
  if(existente){pontosMapas.get(existente)?.remove();pontosMapas.delete(existente);existente.remove();return;}
  if(!window.L){document.getElementById('itinerario-status').textContent='Não foi possível carregar o mapa.';return;}
  const lat=linha.querySelector('[data-campo="latitude"]'),lng=linha.querySelector('[data-campo="longitude"]');
  const caixa=document.createElement('div');caixa.dataset.mapabox='';caixa.className='mapa-viagem mt-3';linha.append(caixa);
  const coords=lat.value!==''&&lng.value!==''?[Number(lat.value),Number(lng.value)]:[-22.059,-46.975];
  const mapa=L.map(caixa,{scrollWheelZoom:false}).setView(coords,14);pontosMapas.set(caixa,mapa);
  L.tileLayer(window.MOBILYS_MAP_TILES,{maxZoom:19,attribution:window.MOBILYS_MAP_ATTRIBUTION}).addTo(mapa);
  let marcador=lat.value!==''?L.circleMarker(coords,{radius:8,color:'#0e6b7a'}).addTo(mapa):null;
  mapa.on('click',e=>{
    lat.value=e.latlng.lat.toFixed(6);lng.value=e.latlng.lng.toFixed(6);
    if(marcador)marcador.setLatLng(e.latlng);else marcador=L.circleMarker(e.latlng,{radius:8,color:'#0e6b7a'}).addTo(mapa);
    lat.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.getElementById('itinerario-status').textContent='Clique no local do ponto no mapa. As coordenadas serão gravadas ao salvar o itinerário.';
  requestAnimationFrame(()=>mapa.invalidateSize());
}
