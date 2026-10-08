/* Editor do itinerário persistido; cada trajeto mantém sua própria ordem. */
const elementoItinerario = document.createElement('div');
elementoItinerario.id = 'modal-itinerario';
elementoItinerario.className = 'modal fade';
elementoItinerario.tabIndex = -1;
elementoItinerario.setAttribute('aria-labelledby', 'itinerario-titulo');
elementoItinerario.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content">
  <div class="modal-header"><h2 class="modal-title h5" id="itinerario-titulo"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>
  <div class="modal-body"><p>Defina a sequência de paradas para cada trajeto. Horários são previstos, no horário local; não representam embarques registrados.</p>
    <p id="itinerario-status" role="status" aria-live="polite"></p>
    <button type="button" id="itinerario-recarregar" class="btn btn-outline-primary mb-3" hidden>Tentar carregar novamente</button>
    <form id="itinerario-form"></form>
  </div><div class="modal-footer"><button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Fechar</button><button type="submit" form="itinerario-form" class="btn btn-primary" id="itinerario-salvar" disabled>Salvar itinerário</button></div>
</div></div>`;
document.body.append(elementoItinerario);
const modalItinerario = new bootstrap.Modal(elementoItinerario);
const formularioItinerario = document.getElementById('itinerario-form');
let itinerarioAtual = null;
let itinerarioOcupado = false;
let itinerarioAlterado = false;
let itinerarioOrigem = null;

function lerParadas() {
  return [...formularioItinerario.querySelectorAll('[data-parada]')].map(linha => ({
    id: linha.dataset.id ? Number(linha.dataset.id) : null,
    trajeto: linha.dataset.trajeto,
    local: linha.querySelector('[data-campo="local"]').value.trim(),
    referencia: linha.querySelector('[data-campo="referencia"]').value.trim(),
    horario: linha.querySelector('[data-campo="horario"]').value,
    tipo: linha.querySelector('[data-campo="tipo"]').value,
    endereco:linha.querySelector('[data-campo="endereco"]').value.trim(),
    latitude:linha.querySelector('[data-campo="latitude"]').value===''?null:Number(linha.querySelector('[data-campo="latitude"]').value),
    longitude:linha.querySelector('[data-campo="longitude"]').value===''?null:Number(linha.querySelector('[data-campo="longitude"]').value),
  }));
}
function desenharParadas(paradas) {
  fecharMapasPontos();
  formularioItinerario.innerHTML = ['IDA', 'VOLTA'].map(trajeto => {
    const lista = paradas.filter(p => p.trajeto === trajeto);
    return `<section class="mb-4"><h3 class="h5">${trajeto === 'IDA' ? 'Ida' : 'Volta'}</h3>
      ${lista.length ? lista.map((p, i) => {
        const chave = `${trajeto}-${i}`;
        return `<fieldset class="border rounded p-3 mb-3" data-parada data-trajeto="${trajeto}" data-id="${p.id || ''}">
          <legend class="float-none w-auto fs-6 px-2">Parada ${i+1}</legend><div class="row g-2">
          <div class="col-md-6"><label class="form-label" for="it-local-${chave}">Local *</label><input class="form-control" id="it-local-${chave}" data-campo="local" required maxlength="150" value="${htmlSeguro(p.local)}"></div>
          <div class="col-md-6"><label class="form-label" for="it-ref-${chave}">Referência</label><input class="form-control" id="it-ref-${chave}" data-campo="referencia" maxlength="250" value="${htmlSeguro(p.referencia)}"></div>
          <div class="col-sm-6"><label class="form-label" for="it-hora-${chave}">Horário previsto *</label><input class="form-control" id="it-hora-${chave}" data-campo="horario" type="time" step="any" required value="${htmlSeguro(p.horario || '')}"></div>
          <div class="col-sm-6"><label class="form-label" for="it-tipo-${chave}">Operação *</label><select class="form-select" id="it-tipo-${chave}" data-campo="tipo">${Object.entries({ EMBARQUE:'Embarque', DESEMBARQUE:'Desembarque', AMBOS:'Embarque e desembarque' }).map(([v,t]) => `<option value="${v}" ${p.tipo === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="col-12"><label class="form-label" for="it-endereco-${chave}">Endereço</label><input class="form-control" id="it-endereco-${chave}" data-campo="endereco" maxlength="250" value="${htmlSeguro(p.endereco||'')}"></div>
          <div class="col-sm-6"><label class="form-label" for="it-lat-${chave}">Latitude</label><input class="form-control" id="it-lat-${chave}" data-campo="latitude" type="number" min="-90" max="90" step="any" value="${p.latitude??''}"></div>
          <div class="col-sm-6"><label class="form-label" for="it-lng-${chave}">Longitude</label><input class="form-control" id="it-lng-${chave}" data-campo="longitude" type="number" min="-180" max="180" step="any" value="${p.longitude??''}"></div>
          <div class="col-12"><button class="btn btn-outline-primary" type="button" data-mapa>Definir no mapa</button></div>
          <div class="col-12 d-flex gap-2 flex-wrap"><button class="btn btn-sm btn-outline-primary" type="button" data-mover="-1" ${i===0?'disabled':''} aria-label="Subir parada ${i+1} da ${trajeto.toLowerCase()}">Subir</button><button class="btn btn-sm btn-outline-primary" type="button" data-mover="1" ${i===lista.length-1?'disabled':''} aria-label="Descer parada ${i+1} da ${trajeto.toLowerCase()}">Descer</button><button class="btn btn-sm btn-outline-danger" type="button" data-remover aria-label="Remover parada ${i+1} da ${trajeto.toLowerCase()}">Remover</button></div></div></fieldset>`;
      }).join('') : '<p class="text-body-secondary">Nenhuma parada cadastrada neste trajeto.</p>'}
      <button class="btn btn-outline-primary" type="button" data-adicionar="${trajeto}" ${paradas.length>=200?'disabled':''}>Adicionar parada de ${trajeto.toLowerCase()}</button></section>`;
  }).join('');
}
function bloquearItinerario(bloqueado) {
  itinerarioOcupado = bloqueado;
  document.getElementById('itinerario-salvar').disabled = bloqueado || !itinerarioAtual;
  formularioItinerario.querySelectorAll('input, select, button').forEach(el => {
    if (bloqueado) { el.dataset.estavaDesabilitado = String(el.disabled); el.disabled = true; }
    else if ('estavaDesabilitado' in el.dataset) { el.disabled = el.dataset.estavaDesabilitado === 'true'; delete el.dataset.estavaDesabilitado; }
  });
}
async function carregarItinerario(rota) {
  itinerarioAtual = null; itinerarioAlterado = false;
  formularioItinerario.innerHTML = '';
  document.getElementById('itinerario-recarregar').hidden = true;
  document.getElementById('itinerario-status').textContent = 'Carregando itinerário…';
  bloquearItinerario(true);
  try {
    const dados = await apiCadastros.itinerario(rota.id);
    itinerarioAtual = { ...dados, rotaId: rota.id };
    desenharParadas(dados.paradas);
    document.getElementById('itinerario-status').textContent = `${dados.paradas.length} paradas cadastradas.`;
  } catch (erro) {
    document.getElementById('itinerario-status').textContent = erro.message;
    document.getElementById('itinerario-recarregar').hidden = false;
    document.getElementById('itinerario-recarregar').onclick = () => carregarItinerario(rota);
  } finally { bloquearItinerario(false); }
}
function abrirItinerario(id) {
  const rota = apiCadastros.db.rotas.find(r => r.id === id);
  if (!rota) return;
  itinerarioOrigem = document.activeElement;
  document.getElementById('itinerario-titulo').textContent = `Itinerário — ${rota.nome}`;
  modalItinerario.show(); carregarItinerario(rota);
}
formularioItinerario.addEventListener('input', e => {
  itinerarioAlterado = true;
  if (e.target.dataset.campo === 'local') e.target.setCustomValidity('');
});
formularioItinerario.addEventListener('change', () => itinerarioAlterado = true);
formularioItinerario.addEventListener('click', e => {
  const botao = e.target.closest('button');
  if (!botao || itinerarioOcupado) return;
  if(botao.hasAttribute('data-mapa')){abrirMapaPonto(botao.closest('[data-parada]'));return;}
  const lista = lerParadas();
  if (botao.dataset.adicionar) {
    lista.push({ trajeto: botao.dataset.adicionar, local:'', referencia:'', horario:'', tipo:'EMBARQUE' });
  } else {
    const linhas = [...formularioItinerario.querySelectorAll('[data-parada]')];
    const indice = linhas.indexOf(botao.closest('[data-parada]'));
    if (indice < 0) return;
    if (botao.hasAttribute('data-remover')) lista.splice(indice, 1);
    else {
      const destino = indice + Number(botao.dataset.mover);
      if (!lista[destino] || lista[destino].trajeto !== lista[indice].trajeto) return;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    }
  }
  itinerarioAlterado = true; desenharParadas(lista);
  if (botao.dataset.adicionar) formularioItinerario.querySelectorAll(`[data-trajeto="${botao.dataset.adicionar}"] [data-campo="local"]`).item(lista.filter(p => p.trajeto === botao.dataset.adicionar).length - 1)?.focus();
});
formularioItinerario.onsubmit = async e => {
  e.preventDefault(); if (itinerarioOcupado || !itinerarioAtual) return;
  formularioItinerario.querySelectorAll('[data-campo="local"]').forEach(el => el.setCustomValidity(el.value.trim() ? '' : 'Informe o local da parada.'));
  if (!formularioItinerario.reportValidity()) return;
  const ordens = { IDA: 0, VOLTA: 0 };
  const paradas = lerParadas().map(p => ({ ...p, ordem: ++ordens[p.trajeto] }));
  bloquearItinerario(true);
  document.getElementById('itinerario-status').textContent = 'Salvando…';
  try {
    const dados = await apiCadastros.salvarItinerario(itinerarioAtual.rotaId, { versao: itinerarioAtual.versao, paradas });
    itinerarioAtual = { ...itinerarioAtual, ...dados };
    itinerarioAlterado = false; desenharParadas(dados.paradas);
    document.getElementById('itinerario-status').textContent = 'Itinerário salvo com sucesso.';
  } catch (erro) { document.getElementById('itinerario-status').textContent = erro.message; }
  finally { bloquearItinerario(false); }
};
elementoItinerario.addEventListener('hide.bs.modal', e => {
  if (itinerarioOcupado || (itinerarioAlterado && !window.confirm('Descartar as alterações não salvas do itinerário?'))) e.preventDefault();
});
elementoItinerario.addEventListener('hidden.bs.modal', () => {fecharMapasPontos();itinerarioOrigem?.focus();});
