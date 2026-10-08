async function abrirVinculos(id) {
  const aluno=apiCadastros.db.alunos.find(a=>a.id===id);if(!aluno) return;
  document.getElementById('modal-titulo').textContent='Vínculos — '+aluno.nome;
  document.getElementById('modal-descricao').textContent='Associe a conta do responsável e os pontos de embarque de cada trajeto.';
  const form=document.getElementById('modal-form'), salvar=document.getElementById('modal-salvar');
  form.innerHTML='<p>Carregando vínculos…</p>';form.onsubmit=e=>e.preventDefault();salvar.disabled=true;salvar.textContent='Salvar vínculos';
  modalCadastro.show();
  cadastroSalvando=true;
  try {
    const [vinculos,itinerario]=await Promise.all([apiCadastros.requisitar('/operacao/vinculos'),apiCadastros.itinerario(aluno.rotaId)]);
    const atual=vinculos.find(a=>a.id===id);
    const campos=[['responsavelUsuarioId','Conta do responsável',apiCadastros.db.usuarios.filter(u=>u.perfil==='RESPONSAVEL').map(u=>({id:u.id,nome:u.nome+' · '+u.email})),atual.responsavel_usuario_id],['paradaIdaId','Embarque da ida',itinerario.paradas.filter(p=>p.trajeto==='IDA'&&p.tipo!=='DESEMBARQUE').map(p=>({id:p.id,nome:p.horario+' · '+p.local})),atual.parada_ida_id],['paradaVoltaId','Embarque da volta',itinerario.paradas.filter(p=>p.trajeto==='VOLTA'&&p.tipo!=='DESEMBARQUE').map(p=>({id:p.id,nome:p.horario+' · '+p.local})),atual.parada_volta_id]];
    form.innerHTML=campos.map(([nome,label,opcoes,valor])=>`<div class="mb-3"><label for="vinculo-${nome}" class="form-label">${label}</label><select name="${nome}" id="vinculo-${nome}" class="form-select"><option value="">Não associado</option>${opcoes.map(o=>`<option value="${o.id}" ${o.id===valor?'selected':''}>${htmlSeguro(o.nome)}</option>`).join('')}</select></div>`).join('')+'<p class="small">Cadastre usuários com perfil de responsável e paradas de embarque no itinerário da rota para disponibilizar as opções. Trocar a rota do aluno remove os vínculos de pontos anteriores.</p>';
    salvar.disabled=false;
    form.onsubmit=async e=>{
      e.preventDefault();if(cadastroSalvando) return;cadastroSalvando=true;salvar.disabled=true;
      try {await apiCadastros.requisitar(`/operacao/alunos/${id}/vinculos`,'PUT',Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,v?Number(v):null])));cadastroSalvando=false;modalCadastro.hide();mostrarToast('Vínculos salvos.');}
      catch(erro) {document.getElementById('modal-descricao').textContent=erro.message;}
      finally {cadastroSalvando=false;salvar.disabled=false;}
    };
  } catch(erro) {form.innerHTML='';document.getElementById('modal-descricao').textContent=erro.message;}
  finally {cadastroSalvando=false;}
}
