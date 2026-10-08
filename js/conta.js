function instalarConta(){
  const menu=document.querySelector('.topo-conta-menu');if(!menu)return;
  const li=document.createElement('li');li.innerHTML='<button type="button" class="dropdown-item d-flex align-items-center gap-2" id="abrir-senha"><i class="bi bi-shield-lock"></i> Alterar senha</button>';menu.insertBefore(li,menu.lastElementChild);
  document.body.insertAdjacentHTML('beforeend',`<div class="modal fade" id="modal-senha" tabindex="-1" aria-labelledby="titulo-senha" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><form id="form-senha"><div class="modal-header"><h2 class="modal-title fs-5" id="titulo-senha">Alterar minha senha</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body"><p>Escolha uma senha de até 64 caracteres. Após a alteração, você entrará novamente.</p><label for="senha-atual" class="form-label">Senha atual</label><input id="senha-atual" class="form-control mb-3" type="password" autocomplete="current-password" required maxlength="64"><label for="senha-nova" class="form-label">Nova senha</label><input id="senha-nova" class="form-control mb-3" type="password" autocomplete="new-password" required maxlength="64"><label for="senha-confirmar" class="form-label">Repita a nova senha</label><input id="senha-confirmar" class="form-control" type="password" autocomplete="new-password" required maxlength="64"><p id="senha-aviso" role="alert" class="mt-3"></p></div><div class="modal-footer"><button type="submit" class="btn btn-primary" id="salvar-senha">Salvar nova senha</button></div></form></div></div></div>`);
  const el=document.getElementById('modal-senha'),modal=new bootstrap.Modal(el),form=document.getElementById('form-senha');let enviando=false;
  document.getElementById('abrir-senha').onclick=()=>{form.reset();document.getElementById('senha-aviso').textContent='';modal.show();};
  el.addEventListener('hide.bs.modal',e=>{if(enviando)e.preventDefault();});
  el.addEventListener('hidden.bs.modal',()=>form.reset());
  form.onsubmit=async e=>{
    e.preventDefault();if(enviando||!form.reportValidity())return;
    const nova=document.getElementById('senha-nova').value,aviso=document.getElementById('senha-aviso');
    if(nova!==document.getElementById('senha-confirmar').value){aviso.textContent='As senhas não coincidem.';return;}
    enviando=true;document.getElementById('salvar-senha').disabled=true;
    try{await apiCadastros.requisitar('/auth/senha','POST',{atual:document.getElementById('senha-atual').value,nova});location.replace('index.html?senha=alterada');}
    catch(error){aviso.textContent=error.message;}finally{enviando=false;document.getElementById('salvar-senha').disabled=false;}
  };
}
instalarConta();
if(document.getElementById('form-login')){
  document.getElementById('form-login').insertAdjacentHTML('afterend','<details class="recuperar-senha"><summary>Esqueceu sua senha?</summary><p>Solicite a redefinição à administração do transporte. Após confirmar sua identidade, o administrador poderá definir uma senha temporária em Cadastros → Usuários. Ao entrar, altere-a no menu da sua conta.</p></details>');
  if(new URLSearchParams(location.search).get('senha')==='alterada')document.getElementById('login-erro').textContent='Senha alterada. Entre com sua nova senha.';
}
