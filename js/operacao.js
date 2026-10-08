/* Fluxos operacionais. Toda alteração depende da autorização e resposta da API. */
const opApi = (path, method = 'GET', body) => apiCadastros.requisitar('/operacao' + path, method, body);
const opRotulos = { IDA:'Ida', VOLTA:'Volta', EM_ANDAMENTO:'Em andamento', ENCERRADA:'Encerrada', PRESENTE:'Presente', AUSENTE:'Ausente', PENDENTE:'Pendente', CONFIRMADO:'Confirmado', CANCELADO:'Cancelado' };
const opTexto = valor => htmlSeguro(opRotulos[valor] || valor || '—');
const opHora = valor => valor ? htmlSeguro(new Date(valor).toLocaleString('pt-BR', { timeZone:'America/Sao_Paulo' })) : '—';
const opData = valor => htmlSeguro(valor?.split('-').reverse().join('/') || '—');
const opSelo = valor => `<span class="etiqueta ${['PRESENTE','CONFIRMADO','EM_ANDAMENTO'].includes(valor)?'':'etiqueta-suave'}">${opTexto(valor)}</span>`;
let opView, opHoje, opViagemId = null, opOcupado = false, opCarregando = false, opUltimo = '', opRelatorio = null;

function opAviso(texto) { document.getElementById('op-aviso').textContent = texto; }
function opBotao(texto, acao, id = '', extra = '', disabled = false) {
  return `<button type="button" class="btn btn-sm btn-outline-primary" data-op="${acao}" data-id="${id}" ${extra} ${disabled?'disabled':''}>${texto}</button>`;
}
async function iniciarOperacao(view) {
  opView = view; opHoje = (await opApi('/hoje')).data;
  const historico = ['admin-presencas','admin-relatorios','resp-historico'].includes(view);
  const titulos = { 'admin-dashboard':'Painel administrativo', 'motorista-viagem':'Minhas viagens', 'resp-agendamentos':'Agendamentos', 'resp-status':'Acompanhamento', 'admin-presencas':'Presenças', 'admin-relatorios':'Relatórios', 'resp-historico':'Histórico de transporte' };
  const main = document.getElementById('conteudo');
  main.innerHTML = `<header class="operacao-hero"><div><span class="sobretitulo">MOBILYS / ${htmlSeguro(perfis[usuarioAtual.perfil])}</span><h1>${titulos[view]}</h1><p>${view.startsWith('resp-')?'Mais tranquilidade em cada trajeto. Acompanhe e organize o transporte dos seus alunos.':view==='motorista-viagem'?'Seu percurso organizado. Cada parada, cada aluno, tudo no mesmo lugar.':'Uma visão clara da operação para cuidar de cada trajeto.'}</p></div><div class="hero-data"><i class="bi bi-calendar3" aria-hidden="true"></i><span>${opData(opHoje)}<small>Transporte estudantil</small></span></div></header>
    <div class="card painel p-3 mb-3"><form id="op-filtros" class="row g-3 align-items-end">
    ${historico ? `<div class="col-sm-4"><label for="op-inicio" class="form-label">Início</label><input required type="date" class="form-control" id="op-inicio" value="${opHoje.slice(0,8)}01"></div><div class="col-sm-4"><label for="op-fim" class="form-label">Fim</label><input required type="date" class="form-control" id="op-fim" value="${opHoje}"></div>` : `<div class="col-sm-5"><label for="op-data" class="form-label">Data</label><input required type="date" class="form-control" id="op-data" value="${opHoje}"></div>`}
    <div class="col-sm-4"><button class="btn btn-primary" type="submit">${historico?'Consultar':'Atualizar'}</button></div></form>
    ${historico ? `<div class="row g-2 mt-2"><div class="col-sm-6"><label for="op-busca" class="form-label">Buscar aluno ou rota</label><input type="search" class="form-control" id="op-busca"></div><div class="col-sm-6"><label for="op-situacao" class="form-label">Situação</label><select id="op-situacao" class="form-select"><option value="">Todas</option>${['PRESENTE','AUSENTE','PENDENTE'].map(s=>`<option value="${s}">${opRotulos[s]}</option>`).join('')}</select></div></div>`:''}
    <p class="mb-0 mt-3" id="op-aviso" role="status" aria-live="polite"></p></div><div id="op-conteudo"></div><div id="op-detalhe" class="mt-3"></div>`;
  document.getElementById('op-filtros').onsubmit = e => { e.preventDefault(); if (e.target.reportValidity()) carregarOperacao(true); };
  if (historico) {
    ['op-inicio','op-fim'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{opRelatorio=null;document.querySelectorAll('[data-op="csv"], [data-op="imprimir"]').forEach(b=>b.disabled=true);opAviso('Período alterado. Consulte novamente para atualizar os resultados.');}));
    ['op-busca','op-situacao'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{if(opRelatorio) desenharHistorico();}));
  }
  main.addEventListener('click', tratarOperacao);
  await carregarOperacao(true);
  if(!historico) setInterval(()=>{if(!document.hidden&&!opOcupado) carregarOperacao(false);},10000);
}
async function carregarOperacao(forcar = false) {
  if(opCarregando) return;
  opCarregando = true;
  try {
    const data = document.getElementById('op-data')?.value;
    if(opView === 'resp-agendamentos') {
      const rows = await opApi('/agenda?data='+encodeURIComponent(data));
      const json = JSON.stringify(rows)+data;
      if(forcar||json!==opUltimo) {desenharAgenda(rows,data);opUltimo=json;}
    } else if(['admin-presencas','admin-relatorios','resp-historico'].includes(opView)) {
      const inicio=document.getElementById('op-inicio').value, fim=document.getElementById('op-fim').value;
      opRelatorio={...await opApi(`/historico?inicio=${inicio}&fim=${fim}`),inicio,fim};
      desenharHistorico();
    } else {
      const viagens = await opApi('/viagens?data='+data);
      const rotas = opView==='motorista-viagem'?await opApi('/motorista/rotas'):[];
      const resumo = opView==='admin-dashboard'?await opApi(`/historico?inicio=${data}&fim=${data}`):null;
      const dados={viagens,rotas,resumo,data}; const json=JSON.stringify(dados);
      if(forcar||json!==opUltimo) {desenharViagens(dados);opUltimo=json;}
      if(opViagemId) await carregarDetalhe();
    }
    opAviso('Atualizado às '+new Date().toLocaleTimeString('pt-BR')+(document.getElementById('op-data')?' · Atualização automática a cada 10 segundos.':''));
  } catch(erro) { opAviso(erro.message+' Os resultados exibidos podem estar desatualizados.'); }
  finally {opCarregando=false;}
}
function desenharAgenda(rows,data) {
  const passado=data<opHoje;
  document.getElementById('op-conteudo').innerHTML=rows.length?'<div class="row g-3">'+rows.map(r=>{
    const chave=r.aluno_id+'-'+r.trajeto,bloqueado=passado||!!r.viagem_id;
    const seletor='<label for="agenda-ponto-'+chave+'" class="form-label">Ponto de embarque</label><select id="agenda-ponto-'+chave+'" class="form-select mb-3" '+(bloqueado?'disabled':'')+'>'+ (r.pontos.length?r.pontos.map(p=>'<option value="'+p.id+'" '+(p.id===r.parada_id?'selected':'')+'>'+htmlSeguro(p.local)+' · '+htmlSeguro(p.horario)+'</option>').join(''):'<option value="">Nenhum ponto autorizado</option>')+'</select>';
    return '<div class="col-lg-6"><article class="card painel p-3"><h2 class="h5">'+opTexto(r.nome)+' · '+opTexto(r.trajeto)+'</h2><p>'+opTexto(r.rota_nome)+'</p><p>'+opSelo(r.status)+(r.viagem_id?' · Trajeto iniciado':'')+'</p>'+(!r.rota_ativa?'<p>Rota inativa. Entre em contato com a administração.</p>':'')+seletor+'<div class="d-flex gap-2 flex-wrap">'+opBotao(r.status==='CONFIRMADO'?'Atualizar confirmação':'Confirmar','agenda',r.aluno_id,'data-trajeto="'+r.trajeto+'" data-status="CONFIRMADO"',bloqueado||!r.rota_ativa||!r.pontos.length)+opBotao('Cancelar','agenda',r.aluno_id,'data-trajeto="'+r.trajeto+'" data-status="CANCELADO"',bloqueado||r.status==='CANCELADO')+'</div></article></div>';
  }).join('')+'</div><p class="mt-3">Ida e volta são independentes. Apenas confirmados entram na viagem. Outros responsáveis vinculados também podem atualizar esta agenda.</p>':'<div class="card painel p-4">Nenhum aluno vinculado à conta. Solicite o vínculo à administração.</div>';
}
function indicadores(rows) {
  const presentes=rows.filter(r=>r.status==='PRESENTE').length, ausentes=rows.filter(r=>r.status==='AUSENTE').length;
  return `<div class="row g-3 mb-4 indicadores">${[['Presentes',presentes,'bi-person-check'],['Ausentes',ausentes,'bi-person-dash'],['Pendentes',rows.length-presentes-ausentes,'bi-hourglass-split'],['Frequência',presentes+ausentes?Math.round(1000*presentes/(presentes+ausentes))/10+'%':'—','bi-bar-chart']].map(([t,v,icon])=>`<div class="col-6 col-lg-3"><div class="card painel indicador"><i class="bi ${icon}" aria-hidden="true"></i><span>${t}</span><strong>${v}</strong><small>${t==='Frequência'?'Dos registros resolvidos':'No período selecionado'}</small></div></div>`).join('')}</div>`;
}
function desenharViagens({viagens,rotas,resumo,data}) {
  document.getElementById('op-conteudo').innerHTML = (resumo?indicadores(resumo.presencas)+'<a href="admin-cadastros.html" class="btn btn-primary mb-3">Gerenciar cadastros</a>':'')+
    (opView==='motorista-viagem'?`<h2 class="h5">Rotas atribuídas</h2>${rotas.length?rotas.map(r=>`<article class="card painel p-3 mb-2"><h3 class="h6">${opTexto(r.nome)}</h3><p>${opTexto(r.turno)}</p><label for="viagem-veiculo-${r.id}" class="form-label">Veículo desta viagem</label><select class="form-select mb-3" id="viagem-veiculo-${r.id}">${(r.veiculos||[]).map(v=>`<option value="${v.id}">${opTexto(v.placa)} · ${v.capacidade} lugares</option>`).join('')}</select><div class="d-flex gap-2">${['IDA','VOLTA'].map(t=>opBotao('Iniciar '+opRotulos[t].toLowerCase(),'iniciar',r.id,`data-trajeto="${t}"`,data!==opHoje||viagens.some(v=>v.rota_id===r.id&&v.data_servico===data&&v.trajeto===t))).join('')}</div></article>`).join(''):'<p>Nenhuma rota atribuída. Peça à administração para vincular sua conta, motorista, veículo e rota.</p>'}`:'')+
    `<h2 class="h5 mt-4">Viagens da data e viagens em andamento</h2>${viagens.length?viagens.map(v=>`<article class="card painel p-3 mb-2"><h3 class="h6">${opTexto(v.rota_nome)} · ${opTexto(v.trajeto)}</h3><p>${opData(v.data_servico)} · ${opTexto(v.status)} · ${opTexto(v.motorista_nome)} · ${opTexto(v.placa)}</p><div>${opBotao('Abrir viagem','abrir',v.id)}</div></article>`).join(''):'<p>Nenhuma viagem disponível para esta data.</p>'}`;
}
async function carregarDetalhe() {
  const v = await opApi('/viagens/'+opViagemId);
  const motorista=usuarioAtual.perfil==='MOTORISTA', ativa=v.status==='EM_ANDAMENTO';
  const parada=v.paradas.find(p=>p.ordem===v.ponto_atual);
  const detalhe = document.getElementById('op-detalhe');
  if(typeof prepararMapa==='function') await prepararMapa(v);
  const json=JSON.stringify(v);
  if(detalhe.dataset.json===json) return;
  detalhe.dataset.json=json;
  detalhe.innerHTML=`<section class="card painel p-3 viagem-detalhe"><div class="viagem-titulo"><div><span class="sobretitulo">DETALHES DO TRAJETO</span><h2 class="h4">${opTexto(v.rota_nome)} · ${opTexto(v.trajeto)}</h2></div>${opSelo(v.status)}</div><p>${opData(v.data_servico)} · ${opTexto(v.placa)}</p><div class="etapa-atual"><i class="bi bi-geo-alt" aria-hidden="true"></i><div><span>${parada?(v.no_ponto?'Na parada':'A caminho de'):'Percurso concluído'}</span><strong>${parada?`${parada.ordem}. ${opTexto(parada.local)}`:'Todas as paradas concluídas'}</strong>${parada?`<small>Horário previsto: ${opTexto(parada.horario)}</small>`:''}</div></div>
  ${motorista&&ativa?`<div class="d-flex gap-2 flex-wrap mb-3">${parada?opBotao(v.no_ponto?'Concluir parada':'Cheguei ao ponto','acao',v.id,`data-acao="${v.no_ponto?'AVANCAR':'CHEGAR'}" data-versao="${v.versao}"`):opBotao('Encerrar viagem','acao',v.id,`data-acao="ENCERRAR" data-versao="${v.versao}"`)}</div>`:''}
  <h3 class="h5">${usuarioAtual.perfil==='RESPONSAVEL'?'Seus alunos':'Alunos confirmados'}</h3><div class="row g-3">${v.alunos.map(a=>`<div class="col-lg-6"><article class="passageiro"><div class="passageiro-nome"><span class="avatar-aluno" aria-hidden="true">${htmlSeguro(a.aluno_nome.charAt(0))}</span><strong>${opTexto(a.aluno_nome)}</strong>${opSelo(a.status)}</div><p>Embarque na parada ${a.embarque_ordem}</p><p class="small mb-2">Entrada: ${opHora(a.entrada_em)}<br>Desembarque: ${a.desembarque_em?opHora(a.desembarque_em):'Não registrado'}<br>Fim do trajeto: ${opHora(a.saida_em)}</p>${motorista&&ativa?`<div class="d-flex gap-2 flex-wrap">${['PRESENTE','AUSENTE'].map(s=>opBotao(opRotulos[s],'acao',v.id,`data-acao="PRESENCA" data-aluno="${a.aluno_id}" data-status="${s}" data-versao="${v.versao}"`,!v.no_ponto||a.embarque_ordem!==v.ponto_atual||a.status===s||!!a.desembarque_em)).join('')}${a.status==='PRESENTE'?opBotao(a.desembarque_em?'Desembarcou':'Confirmar desembarque','acao',v.id,`data-acao="DESEMBARCAR" data-aluno="${a.aluno_id}" data-versao="${v.versao}"`,!!a.desembarque_em||!v.no_ponto||!['DESEMBARQUE','AMBOS'].includes(parada?.tipo)):''}</div>`:''}</article></div>`).join('')||'<p>Nenhum aluno confirmado nesta viagem.</p>'}</div>
  <details class="mt-3 percurso" open><summary>Itinerário da viagem</summary><ol class="mt-2">${v.paradas.map(p=>`<li class="${p.ordem<v.ponto_atual?'concluida':p.ordem===v.ponto_atual?'atual':''}"><span>${opTexto(p.horario)}</span><strong>${opTexto(p.local)}</strong>${p.referencia?`<small>${opTexto(p.referencia)}</small>`:''}</li>`).join('')}</ol></details><p class="small mt-3">Presença, desembarque e fim do trajeto são registros independentes. A localização é atualizada quando o motorista compartilha o GPS.</p>
  ${usuarioAtual.perfil==='ADMIN'?opBotao('Ver auditoria','auditoria',v.id):''}<div id="op-auditoria" class="mt-3"></div></section>`;
}
function linhasHistorico() {
  const busca=document.getElementById('op-busca').value.toLocaleLowerCase('pt-BR'), status=document.getElementById('op-situacao').value;
  return opRelatorio.presencas.filter(p=>(!status||p.status===status)&&(`${p.aluno_nome} ${p.rota_nome}`.toLocaleLowerCase('pt-BR').includes(busca)));
}
function desenharHistorico() {
  const rows=linhasHistorico();
  const tabela = `<div class="tabela-scroll"><table class="table operacao-tabela"><thead><tr><th>Data</th><th>Aluno</th><th>Rota / trajeto</th><th>Situação</th><th>Entrada</th><th>Desembarque</th><th>Fim do trajeto</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${opData(p.data_servico)}</td><td>${opTexto(p.aluno_nome)}</td><td>${opTexto(p.rota_nome)} · ${opTexto(p.trajeto)}</td><td>${opTexto(p.status)}</td><td>${opHora(p.entrada_em)}</td><td>${opHora(p.desembarque_em)}</td><td>${opHora(p.saida_em)}</td></tr>`).join('')}</tbody></table></div>`;
  const semViagem=(opRelatorio.agendamentos||[]).filter(a=>!opRelatorio.presencas.some(p=>p.aluno_id===a.aluno_id&&p.data_servico===a.data_servico&&p.trajeto===a.trajeto));
  document.getElementById('op-conteudo').innerHTML=indicadores(rows)+`<section class="card painel p-3"><h2 class="h5">Registros de viagem</h2>${rows.length?tabela:'<p>Nenhum registro para os filtros selecionados.</p>'}<p class="small">Frequência = presentes ÷ (presentes + ausentes). Pendentes e cancelamentos não entram no cálculo. Saída corresponde ao encerramento do trajeto.</p><div class="d-flex gap-2">${opBotao('Exportar CSV','csv','', '',!rows.length)}${opBotao('Imprimir / PDF','imprimir')}</div></section>`+(semViagem.length?`<section class="card painel p-3 mt-3"><h2 class="h5">Agendamentos sem registro de presença</h2><ul>${semViagem.map(a=>`<li>${opData(a.data_servico)} · ${opTexto(a.aluno_nome)} · ${opTexto(a.trajeto)}: ${opTexto(a.status)}</li>`).join('')}</ul></section>`:'');
}
function exportarHistorico() {
  if(!opRelatorio) return;
  const celula=v=>`"${String(v??'').replace(/^[\s]*([=+@-])/,"'$1").replace(/"/g,'""')}"`;
  const linhas=[['Data','Aluno','Rota','Trajeto','Situação','Entrada UTC','Desembarque UTC','Fim do trajeto UTC'],...linhasHistorico().map(p=>[p.data_servico,p.aluno_nome,p.rota_nome,p.trajeto,p.status,p.entrada_em,p.desembarque_em,p.saida_em])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+linhas.map(l=>l.map(celula).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`mobilys-${opRelatorio.inicio}-${opRelatorio.fim}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function tratarOperacao(e) {
  const botao=e.target.closest('[data-op]');if(!botao||botao.disabled||opOcupado) return;
  const d=botao.dataset;
  if(d.op==='csv') {exportarHistorico();return;} if(d.op==='imprimir') {window.print();return;}
  opOcupado=true;botao.disabled=true;
  try {
    if(d.op==='agenda') await opApi('/agenda','PUT',{alunoId:Number(d.id),data:document.getElementById('op-data').value,trajeto:d.trajeto,status:d.status,paradaId:Number(document.getElementById('agenda-ponto-'+d.id+'-'+d.trajeto)?.value)||null});
    if(d.op==='iniciar') {const v=await opApi('/viagens','POST',{rotaId:Number(d.id),trajeto:d.trajeto,veiculoId:Number(document.getElementById('viagem-veiculo-'+d.id)?.value)||null});opViagemId=v.id;}
    if(d.op==='acao') await opApi(`/viagens/${d.id}/acoes`,'POST',{versao:Number(d.versao),acao:d.acao,alunoId:d.aluno?Number(d.aluno):null,status:d.status||null});
    if(d.op==='abrir') {opViagemId=Number(d.id);document.getElementById('op-detalhe').dataset.json='';await carregarDetalhe();document.getElementById('op-detalhe').scrollIntoView({block:'start'});}
    else if(d.op==='auditoria') {
      const rows=await opApi(`/viagens/${d.id}/eventos`);
      document.getElementById('op-auditoria').innerHTML='<h3 class="h6">Eventos registrados</h3><ul>'+rows.map(r=>`<li>${opHora(r.em)} · ${opTexto(r.autor)} · ${opTexto(r.acao)}: ${opTexto(r.detalhe)}</li>`).join('')+'</ul>';
    } else await carregarOperacao(true);
  } catch(erro) {opAviso(erro.message);}
  finally {opOcupado=false;if(botao.isConnected) botao.disabled=false;}
}
