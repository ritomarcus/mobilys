async function abrirEditorVinculos(titulo,descricao,carregar){
  document.getElementById('modal-titulo').textContent=titulo;
  document.getElementById('modal-descricao').textContent=descricao;
  const form=document.getElementById('modal-form'),salvar=document.getElementById('modal-salvar');
  form.innerHTML='<p>Carregando vínculos…</p>';form.onsubmit=e=>e.preventDefault();salvar.disabled=true;salvar.textContent='Salvar vínculos';cadastroSalvando=true;modalCadastro.show();
  try{await carregar(form);salvar.disabled=false;}
  catch(e){form.innerHTML='';document.getElementById('modal-descricao').textContent=e.message;}
  finally{cadastroSalvando=false;}
}
function salvarVinculosCom(form,url,payload){
  form.onsubmit=async e=>{
    e.preventDefault();if(cadastroSalvando||!form.reportValidity())return;
    cadastroSalvando=true;const botao=document.getElementById('modal-salvar');botao.disabled=true;
    try{await apiCadastros.requisitar(url,'PUT',payload());cadastroSalvando=false;modalCadastro.hide();mostrarToast('Vínculos salvos.');}
    catch(e){document.getElementById('modal-descricao').textContent=e.message;}
    finally{cadastroSalvando=false;botao.disabled=false;}
  };
}
async function abrirVinculos(id){
  const aluno=apiCadastros.db.alunos.find(a=>a.id===id);if(!aluno)return;
  await abrirEditorVinculos('Vínculos — '+aluno.nome,'Autorize responsáveis e pontos de embarque. Cada responsável poderá acompanhar este aluno.',async form=>{
    const [familia,itinerario,responsaveis]=await Promise.all([apiCadastros.requisitar(`/alunos/${id}/familia`),apiCadastros.itinerario(aluno.rotaId),apiCadastros.requisitar('/responsaveis')]);
    const pontos=itinerario.paradas.filter(p=>p.tipo!=='DESEMBARQUE');
    form.innerHTML='<h3 class="h6">Responsáveis e parentesco</h3>'+ (responsaveis.length?responsaveis.map(r=>{
      const vinculo=familia.responsaveis.find(v=>v.responsavelId===r.id);
      return `<div class="border rounded p-3 mb-2"><label class="form-check-label"><input class="form-check-input me-2" type="checkbox" data-responsavel="${r.id}" id="familia-resp-${r.id}" ${vinculo?'checked':''}>${htmlSeguro(r.nome)} · ${htmlSeguro(r.email)}${r.ativo?'':' (conta inativa)'}</label><label for="parentesco-${r.id}" class="form-label mt-2">Parentesco / relação</label><input class="form-control" id="parentesco-${r.id}" maxlength="60" placeholder="Ex.: mãe, pai, tutor" value="${htmlSeguro(vinculo?.parentesco||'')}" ${vinculo?'required':''}></div>`;
    }).join(''):'<p>Cadastre os responsáveis na categoria Responsáveis antes de vinculá-los.</p>')+
    '<h3 class="h6 mt-4">Pontos autorizados</h3><p class="small">A família poderá escolher um destes pontos em cada confirmação. Desmarcar um ponto cancela confirmações futuras que o utilizam.</p>'+pontos.map(p=>`<label class="d-block mb-2"><input class="form-check-input me-2" type="checkbox" data-ponto="${p.id}" ${familia.pontos.some(v=>v.paradaId===p.id&&v.ativo)?'checked':''}>${p.trajeto} · ${htmlSeguro(p.horario)} · ${htmlSeguro(p.local)}</label>`).join('')+
    ['IDA','VOLTA'].map(t=>{const nome=t==='IDA'?'paradaIdaId':'paradaVoltaId';return `<label class="form-label mt-3" for="vinculo-${nome}">Embarque padrão — ${t}</label><select class="form-select" id="vinculo-${nome}"><option value="">Sem padrão</option>${pontos.filter(p=>p.trajeto===t).map(p=>`<option value="${p.id}" ${p.id===familia[nome]?'selected':''}>${htmlSeguro(p.local)}</option>`).join('')}</select>`;}).join('');
    form.querySelectorAll('[data-responsavel]').forEach(c=>c.onchange=()=>document.getElementById('parentesco-'+c.dataset.responsavel).required=c.checked);
    form.querySelectorAll('select').forEach(s=>s.onchange=()=>{const c=form.querySelector(`[data-ponto="${s.value}"]`);if(c)c.checked=true;});
    salvarVinculosCom(form,`/alunos/${id}/familia`,()=>({
      responsaveis:[...form.querySelectorAll('[data-responsavel]:checked')].map(c=>({responsavelId:Number(c.dataset.responsavel),parentesco:document.getElementById('parentesco-'+c.dataset.responsavel).value.trim()})),
      pontos:[...form.querySelectorAll('[data-ponto]')].map(c=>({paradaId:Number(c.dataset.ponto),ativo:c.checked})),
      paradaIdaId:Number(document.getElementById('vinculo-paradaIdaId').value)||null,paradaVoltaId:Number(document.getElementById('vinculo-paradaVoltaId').value)||null
    }));
  });
}
async function abrirAssociacoes(id){
  await abrirEditorVinculos('Veículos e motoristas da rota','Defina associações adicionais. O veículo padrão e seu motorista continuam disponíveis pela configuração do cadastro.',async form=>{
    const dados=await apiCadastros.requisitar(`/rotas/${id}/associacoes`);
    form.innerHTML=[['veiculoIds','Veículos',apiCadastros.db.veiculos,r=>r.placa+' · '+r.modelo],['motoristaIds','Motoristas',apiCadastros.db.motoristas,r=>r.nome]].map(([chave,titulo,lista,nome])=>`<fieldset class="mb-4"><legend class="h6">${titulo}</legend>${lista.map(r=>`<label class="d-block mb-2"><input type="checkbox" class="form-check-input me-2" name="${chave}" value="${r.id}" ${dados[chave].includes(r.id)?'checked':''}>${htmlSeguro(nome(r))}${r.ativo===false?' (inativo)':''}</label>`).join('')||'<p>Nenhum cadastro disponível.</p>'}</fieldset>`).join('');
    salvarVinculosCom(form,`/rotas/${id}/associacoes`,()=>Object.fromEntries(['veiculoIds','motoristaIds'].map(k=>[k,[...form.querySelectorAll(`[name="${k}"]:checked`)].map(c=>Number(c.value))])));
  });
}
