/* GPS é opcional, explicitamente ativado e restrito à viagem autorizada. */
let gpsWatch=null,gpsViagem=null,gpsUltimoEnvio=0,gpsEnviando=false,gpsGeracao=0;
let mapaMobilys=null,marcadorMobilys=null,circuloMobilys=null,mapaViagem=null,pontosViagem=[];
function gpsMensagem(texto){const e=document.getElementById('gps-aviso');if(e)e.textContent=texto;}
function gpsLimparWatch(){gpsGeracao++;if(gpsWatch!==null)navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;gpsViagem=null;}
async function gpsParar(){
  const id=gpsViagem;gpsLimparWatch();
  if(id)try{await opApi(`/viagens/${id}/localizacao`,'DELETE');gpsMensagem('Compartilhamento pausado.');}catch(e){gpsMensagem(e.message+' A última posição será indicada como antiga.');}
  document.getElementById('gps-iniciar')?.removeAttribute('disabled');document.getElementById('gps-parar')?.setAttribute('disabled','');
}
async function gpsIniciar(id){
  if(!window.isSecureContext||!navigator.geolocation){gpsMensagem('Use HTTPS (ou localhost neste computador) para permitir a localização.');return;}
  if(gpsWatch!==null)await gpsParar();
  gpsViagem=id;gpsUltimoEnvio=0;const geracao=++gpsGeracao;
  gpsMensagem('Aguardando sua permissão e uma leitura do dispositivo…');
  document.getElementById('gps-iniciar').disabled=true;document.getElementById('gps-parar').disabled=false;
  gpsWatch=navigator.geolocation.watchPosition(async p=>{
    if(geracao!==gpsGeracao||gpsEnviando||Date.now()-gpsUltimoEnvio<5000)return;
    if(p.coords.accuracy>10000){gpsMensagem('Sinal impreciso. Aguardando uma leitura melhor.');return;}
    gpsEnviando=true;gpsUltimoEnvio=Date.now();
    try{
      await opApi(`/viagens/${id}/localizacao`,'PUT',{latitude:p.coords.latitude,longitude:p.coords.longitude,precisao:p.coords.accuracy,capturadaEm:new Date(p.timestamp).toISOString()});
      // Uma pausa durante o envio deve remover também essa leitura em trânsito.
      if(geracao!==gpsGeracao){await opApi(`/viagens/${id}/localizacao`,'DELETE');return;}
      gpsMensagem('Compartilhando a posição do dispositivo. Mantenha esta página aberta.');await atualizarMapa(id);
    }catch(e){gpsMensagem(e.message);if([401,403,404,409].includes(e.status))gpsLimparWatch();}
    finally{gpsEnviando=false;}
  },e=>{
    if(geracao!==gpsGeracao)return;
    gpsMensagem(e.code===1?'Permissão negada. Libere a localização nas configurações do navegador.':'Não foi possível obter a posição. Verifique o sinal e tente novamente.');
    gpsLimparWatch();document.getElementById('gps-iniciar').disabled=false;document.getElementById('gps-parar').disabled=true;
  },{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
}
async function prepararMapa(v){
  pontosViagem=(v.paradas||[]).filter(p=>p.latitude!=null&&p.longitude!=null);
  if(gpsViagem&&(gpsViagem!==v.id||v.status!=='EM_ANDAMENTO'))await gpsParar();
  let area=document.getElementById('op-localizacao');
  if(!area){area=document.createElement('section');area.id='op-localizacao';area.className='card painel mapa-painel mt-3';document.getElementById('op-detalhe').after(area);}
  const key=v.id+v.status;
  if(area.dataset.viagem!==key){
    mapaMobilys?.remove();mapaMobilys=null;marcadorMobilys=null;circuloMobilys=null;mapaViagem=v.id;
    area.dataset.viagem=key;
    area.innerHTML=`<div class="mapa-cabecalho"><div><span class="sobretitulo">ACOMPANHAMENTO</span><h3>Localização do veículo</h3></div><span class="etiqueta" id="mapa-sinal">Sem posição</span></div><p id="mapa-status" role="status">Aguardando atualização.</p>${usuarioAtual.perfil==='MOTORISTA'&&v.status==='EM_ANDAMENTO'?'<div class="gps-controles"><button type="button" class="btn btn-primary" id="gps-iniciar"><i class="bi bi-broadcast"></i> Compartilhar localização</button><button type="button" class="btn btn-outline-primary" id="gps-parar" disabled>Pausar</button><p>Ao ativar, sua posição será visível à administração e às famílias desta viagem. A captura termina ao sair desta página.</p><p id="gps-aviso" role="status"></p></div>':''}<div id="mapa-viagem" class="mapa-viagem" aria-label="Mapa com a última posição do veículo" hidden></div><p class="mapa-nota">A precisão depende do dispositivo e do sinal. O mapa não confirma embarques ou desembarques.</p>`;
    document.getElementById('gps-iniciar')?.addEventListener('click',()=>gpsIniciar(v.id));document.getElementById('gps-parar')?.addEventListener('click',gpsParar);
  }
  await atualizarMapa(v.id);
}
async function atualizarMapa(id){
  try{
    const p=await opApi(`/viagens/${id}/localizacao`);if(id!==mapaViagem)return;
    const texto=document.getElementById('mapa-status'),sinal=document.getElementById('mapa-sinal'),el=document.getElementById('mapa-viagem');
    if(!p.disponivel){texto.textContent=pontosViagem.length?'Pontos cadastrados no itinerário. Sem posição compartilhada do veículo.':'Sem localização compartilhada para esta viagem.';sinal.textContent='Sem posição';if(!pontosViagem.length){el.hidden=true;return;}}
    if(p.disponivel){
    sinal.textContent=p.recente?'Sinal recente':'Posição antiga';sinal.classList.toggle('etiqueta-suave',!p.recente);
    texto.textContent=`Última leitura: ${new Date(p.capturada_em).toLocaleTimeString('pt-BR')} · precisão aproximada de ${Math.round(p.precisao)} m${p.recente?'':'. O dispositivo deixou de enviar atualizações.'}`;
    }
    if(!window.L){texto.textContent+=' Mapa indisponível. Tente recarregar a página.';return;}
    el.hidden=false;
    if(!mapaMobilys){
      const centro=p.disponivel?[p.latitude,p.longitude]:[pontosViagem[0].latitude,pontosViagem[0].longitude];
      mapaMobilys=L.map(el,{scrollWheelZoom:false}).setView(centro,15);
      for(const ponto of pontosViagem){const label=document.createElement('span');label.textContent=ponto.ordem+'. '+ponto.local;L.circleMarker([ponto.latitude,ponto.longitude],{radius:6,color:'#1c6888',fillOpacity:.3}).addTo(mapaMobilys).bindTooltip(label);}
      if(pontosViagem.length>1)mapaMobilys.fitBounds(pontosViagem.map(q=>[q.latitude,q.longitude]),{padding:[30,30],maxZoom:16});
      L.tileLayer(window.MOBILYS_MAP_TILES||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:window.MOBILYS_MAP_ATTRIBUTION||'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(mapaMobilys).on('tileerror',()=>{if(!texto.textContent.includes('Mapa base indisponível'))texto.textContent+=' Mapa base indisponível; a posição recebida permanece registrada.';});
    }
    if(p.disponivel&&!marcadorMobilys){
      circuloMobilys=L.circle([p.latitude,p.longitude],{radius:p.precisao,color:'#0e6b7a',weight:1,fillOpacity:.1}).addTo(mapaMobilys);
      marcadorMobilys=L.circleMarker([p.latitude,p.longitude],{radius:10,color:'#ffffff',weight:3,fillColor:'#0e6b7a',fillOpacity:1}).addTo(mapaMobilys).bindTooltip('Veículo');
    }
    if(p.disponivel){marcadorMobilys.setLatLng([p.latitude,p.longitude]);circuloMobilys.setLatLng([p.latitude,p.longitude]).setRadius(p.precisao);}
    else if(marcadorMobilys){marcadorMobilys.remove();circuloMobilys.remove();marcadorMobilys=null;circuloMobilys=null;}
    mapaMobilys.invalidateSize();
  }catch(e){if(id===mapaViagem){document.getElementById('mapa-status').textContent=e.message;document.getElementById('mapa-sinal').textContent='Sem atualização';}}
}
window.addEventListener('pagehide',gpsLimparWatch);
window.addEventListener('mobilys:sessao-expirada',gpsLimparWatch);
