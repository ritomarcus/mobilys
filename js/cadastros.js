const ENTIDADES = {
  alunos: {
    titulo: 'Aluno', chave: 'alunos',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'Matrícula', campo: 'matricula' },
      { rotulo: 'Turma', campo: 'turma' },
      { rotulo: 'Rota', campo: 'rota' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'matricula', rotulo: 'Matrícula', tipo: 'text', obrigatorio: true, max: 40 },
      { chave: 'turma', rotulo: 'Turma', tipo: 'text', obrigatorio: true, max: 60 },
      { chave: 'responsavel', rotulo: 'Responsável', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'rotaId', rotulo: 'Rota associada', tipo: 'select', origem: 'rotas', campoOrigem: 'nome', valorOrigem: 'id', obrigatorio: true },
    ],
  },
  rotas: {
    titulo: 'Rota', chave: 'rotas',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'Turno', campo: 'turno' },
      { rotulo: 'Origem', campo: 'origem' },
      { rotulo: 'Destino', campo: 'destino' },
      { rotulo: 'Veículo', campo: 'veiculo' },
      { rotulo: 'Alunos', campo: 'alunos' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome da rota', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'origem', rotulo: 'Cidade de origem', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'destino', rotulo: 'Cidade de destino', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'turno', rotulo: 'Turno', tipo: 'text', obrigatorio: true, max: 30 },
      { chave: 'veiculoId', rotulo: 'Veículo', tipo: 'select', origem: 'veiculos', campoOrigem: 'placa', valorOrigem: 'id' },
    ],
  },
  motoristas: {
    titulo: 'Motorista', chave: 'motoristas',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'CNH', campo: 'cnh' },
      { rotulo: 'Conta de acesso', campo: 'usuario' },
      { rotulo: 'Telefone', campo: 'telefone' },
      { rotulo: 'Veículo', campo: 'veiculo' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'cnh', rotulo: 'CNH (11 dígitos)', tipo: 'text', obrigatorio: true, max: 11, pattern: '[0-9]{11}' },
      { chave: 'telefone', rotulo: 'Telefone', tipo: 'text', obrigatorio: true, max: 30 },
      { chave: 'usuarioId', rotulo: 'Conta com perfil Motorista', tipo: 'select', origem: 'usuarios', campoOrigem: 'email', valorOrigem: 'id', perfil: 'MOTORISTA', obrigatorio: true },
    ],
  },
  veiculos: {
    titulo: 'Veículo', chave: 'veiculos',
    colunas: [
      { rotulo: 'Placa', campo: 'placa' },
      { rotulo: 'Modelo', campo: 'modelo' },
      { rotulo: 'Capacidade', campo: 'capacidade' },
      { rotulo: 'Motorista', campo: 'motorista' },
    ],
    campos: [
      { chave: 'placa', rotulo: 'Placa', tipo: 'text', obrigatorio: true, max: 8 },
      { chave: 'modelo', rotulo: 'Modelo', tipo: 'text', obrigatorio: true, max: 100 },
      { chave: 'capacidade', rotulo: 'Capacidade (1 a 200 lugares)', tipo: 'number', obrigatorio: true },
      { chave: 'motoristaId', rotulo: 'Motorista', tipo: 'select', origem: 'motoristas', campoOrigem: 'nome', valorOrigem: 'id' },
    ],
  },
  usuarios: {
    titulo: 'Usuário', chave: 'usuarios',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'E-mail', campo: 'email' },
      { rotulo: 'Perfil', campo: 'perfil' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, max: 254 },
      { chave: 'senha', rotulo: 'Senha (até 64 caracteres; deixe em branco ao editar para manter)', tipo: 'password', max: 64 },
      { chave: 'perfil', rotulo: 'Perfil de acesso', tipo: 'select', opcoes: ['ADMIN', 'MOTORISTA', 'RESPONSAVEL'], obrigatorio: true },
    ],
  },
};

// Campos previstos no modelo aprovado.
ENTIDADES.alunos.campos.push(
  {chave:'curso',rotulo:'Curso',tipo:'text',max:150},
  {chave:'periodo',rotulo:'Período',tipo:'text',max:60},
  {chave:'telefone',rotulo:'Telefone do aluno',tipo:'text',max:30},
  {chave:'usuarioId',rotulo:'Conta do próprio aluno (opcional)',tipo:'select',origem:'usuarios',campoOrigem:'email',valorOrigem:'id',perfil:'RESPONSAVEL'});
ENTIDADES.motoristas.campos.push({chave:'cpf',rotulo:'CPF (somente números)',tipo:'text',max:11,pattern:'[0-9]{11}'},{chave:'validadeCnh',rotulo:'Validade da CNH',tipo:'date'});
ENTIDADES.veiculos.campos.push({chave:'anoFabricacao',rotulo:'Ano de fabricação',tipo:'number'});
ENTIDADES.rotas.campos.push({chave:'descricao',rotulo:'Descrição',tipo:'text',max:500});
for(const chave of ['usuarios','rotas','veiculos']){
  ENTIDADES[chave].campos.push({chave:'ativo',rotulo:'Situação do cadastro',tipo:'select',opcoes:['true','false'],padrao:'true',obrigatorio:true});
  ENTIDADES[chave].colunas.push({rotulo:'Situação',campo:'situacao'});
}
ENTIDADES.responsaveis={titulo:'Responsável',chave:'responsaveis',colunas:[{rotulo:'Nome',campo:'nome'},{rotulo:'E-mail',campo:'email'},{rotulo:'CPF',campo:'cpf'},{rotulo:'Telefone',campo:'telefone'}],campos:[
  {chave:'usuarioId',rotulo:'Conta de aluno/responsável',tipo:'select',origem:'usuarios',campoOrigem:'email',valorOrigem:'id',perfil:'RESPONSAVEL',obrigatorio:true},
  {chave:'cpf',rotulo:'CPF (somente números)',tipo:'text',max:11,pattern:'[0-9]{11}'},{chave:'telefone',rotulo:'Telefone',tipo:'text',max:30}]};

/* Apresentação e filtros dos cadastros persistidos na API. */
const CADASTRO_UI = {
  alunos: { plural: 'Alunos', novo: 'Novo aluno', icone: 'bi-mortarboard', descricao: 'Dados escolares, responsáveis e vínculos com as rotas.', filtro: 'rota', filtroNome: 'Rota', busca: 'Nome, matrícula ou responsável', ajuda: 'Cadastre uma rota antes de adicionar alunos. Selecione a rota no formulário.', grupos: ['Dados do aluno', 'Transporte escolar'] },
  rotas: { plural: 'Rotas', novo: 'Nova rota', icone: 'bi-signpost-split', descricao: 'Organize os trajetos, origens, destinos e turnos do transporte.', filtro: 'turno', filtroNome: 'Turno', busca: 'Nome da rota, origem ou destino', ajuda: 'O número de alunos é calculado a partir dos alunos associados a cada rota.', grupos: ['Identificação da rota', 'Veículo do trajeto'] },
  motoristas: { plural: 'Motoristas', novo: 'Novo motorista', icone: 'bi-person-vcard', descricao: 'Consulte os condutores, seus contatos e veículos.', filtro: 'veiculo', filtroNome: 'Veículo', busca: 'Nome, CNH, telefone ou veículo', ajuda: 'Crie primeiro uma conta com perfil Motorista em Usuários. Associe essa conta ao motorista; depois vincule-o a um veículo.', grupos: ['Dados do motorista', 'Conta de acesso'] },
  veiculos: { plural: 'Veículos', novo: 'Novo veículo', icone: 'bi-bus-front', descricao: 'Mantenha a frota e os motoristas associados organizados.', filtro: 'motorista', filtroNome: 'Motorista', busca: 'Placa, modelo ou motorista', ajuda: 'Associe o motorista aqui e vincule o veículo ao trajeto na categoria Rotas.', grupos: ['Dados do veículo', 'Motorista responsável'] },
  usuarios: { plural: 'Usuários', novo: 'Novo usuário', icone: 'bi-person-gear', descricao: 'Organize as pessoas e seus perfis de acesso ao sistema.', filtro: 'perfil', filtroNome: 'Perfil', busca: 'Nome, e-mail ou perfil de acesso', ajuda: 'Editar uma conta encerra suas sessões no próximo acesso. Não é possível excluir sua própria conta.', grupos: ['Dados do usuário', 'Perfil de acesso'] },
};
CADASTRO_UI.responsaveis={plural:'Responsáveis',novo:'Novo responsável',icone:'bi-people',descricao:'Contatos dos responsáveis e vínculos com os alunos.',filtro:'nome',filtroNome:'Nome',busca:'Nome, e-mail ou CPF',ajuda:'Crie a conta em Usuários, cadastre o responsável aqui e associe aos alunos em Vínculos.',grupos:['Contato do responsável','Conta de acesso']};
const escaparHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizarBusca = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let entidadeAtual = 'alunos';
let cadastroRetornoFoco = null;
let cadastroApiEstado = 'carregando';
let cadastroApiErro = '';
let cadastroCarregando = false;
let cadastroSalvando = false;
const cadastroRemoto = chave => true;
function tabelaCadastro(chave) { return apiCadastros.db[chave].map(r=>({...r,situacao:r.ativo===false?'Inativo':'Ativo'})); }

async function carregarCadastrosApi() {
  if (cadastroCarregando || cadastroSalvando) return;
  cadastroCarregando = true;
  cadastroApiEstado = 'carregando';
  montarAbasCadastro();
  try {
    await apiCadastros.atualizar();
    cadastroApiEstado = 'pronto';
  } catch (erro) {
    cadastroApiEstado = 'erro';
    cadastroApiErro = erro.message;
  } finally {
    cadastroCarregando = false;
    montarAbasCadastro();
  }
}
document.getElementById('cadastro-atualizar')?.addEventListener('click', carregarCadastrosApi);
elModal?.addEventListener('hide.bs.modal', evento => { if (cadastroSalvando) evento.preventDefault(); });

async function salvarCadastro(entidade, id, dados, mensagem) {

  if (cadastroSalvando || cadastroApiEstado !== 'pronto') return;
  cadastroSalvando = true;
  const botao = document.getElementById('modal-salvar');
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Aguarde…';
  let sucesso = false;
  try {
    await apiCadastros.cadastro(entidade, id, dados);
    if (entidade === 'usuarios' && id === usuarioAtual.id) { location.replace('index.html'); return; }
    sucesso = true;
    mostrarToast(mensagem);
  } catch (erro) {
    document.getElementById('modal-descricao').textContent = erro.message;
    mostrarToast(escaparHTML(erro.message), false);
  } finally {
    cadastroSalvando = false;
    botao.disabled = false;
    botao.textContent = texto;
    montarAbasCadastro();
  }
  if (sucesso) modalCadastro.hide();
}

function montarAbasCadastro(){
  const abas = document.getElementById('abas-cadastro');
  abas.innerHTML = Object.keys(ENTIDADES).map(chave => `
    <button type="button" class="cadastro-categoria ${chave === entidadeAtual ? 'ativo' : ''}" id="aba-${chave}" role="tab" aria-selected="${chave === entidadeAtual}" aria-controls="painel-cadastro" tabindex="${chave === entidadeAtual ? 0 : -1}" data-entidade="${chave}">
      <i class="bi ${CADASTRO_UI[chave].icone}" aria-hidden="true"></i><span>${CADASTRO_UI[chave].plural}<small>${cadastroRemoto(chave) && cadastroApiEstado !== 'pronto' ? '—' : tabelaCadastro(chave).length} registros · ${cadastroRemoto(chave) ? 'Servidor' : 'Demo'}</small></span>
    </button>`).join('');
  abas.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => selecionarCategoria(b.dataset.entidade));
    b.addEventListener('keydown', e => {
      const keys = Object.keys(ENTIDADES);
      let indice = keys.indexOf(entidadeAtual);
      if (e.key === 'ArrowRight') indice = (indice + 1) % keys.length;
      else if (e.key === 'ArrowLeft') indice = (indice + keys.length - 1) % keys.length;
      else if (e.key === 'Home') indice = 0;
      else if (e.key === 'End') indice = keys.length - 1;
      else return;
      e.preventDefault(); selecionarCategoria(keys[indice]);
    });
  });
  const ui = CADASTRO_UI[entidadeAtual];
  document.getElementById('cadastro-origem').textContent = cadastroRemoto(entidadeAtual) ? 'Dados do servidor' : 'Demonstração local';
  document.getElementById('cadastro-api-status').textContent = cadastroApiEstado === 'carregando' ? 'Carregando cadastros…' : cadastroApiEstado === 'erro' ? cadastroApiErro : 'Cadastros carregados do servidor.';
  document.getElementById('cadastro-atualizar').disabled = cadastroCarregando || cadastroSalvando;
  document.getElementById('btn-novo-cadastro').disabled = cadastroRemoto(entidadeAtual) && (cadastroApiEstado !== 'pronto' || (entidadeAtual === 'alunos' && !apiCadastros.db.rotas.length));
  document.getElementById('painel-cadastro').setAttribute('aria-labelledby', `aba-${entidadeAtual}`);
  document.getElementById('cadastro-titulo').textContent = ui.plural;
  document.getElementById('cadastro-caption').textContent = `Lista de ${ui.plural.toLowerCase()}`;
  document.getElementById('cadastro-descricao').textContent = ui.descricao;
  document.getElementById('cadastro-ajuda').textContent = ui.ajuda;
  document.querySelector('#btn-novo-cadastro span').textContent = ui.novo;
  document.getElementById('busca-cadastro').placeholder = ui.busca;
  document.getElementById('filtro-cadastro-label').textContent = ui.filtroNome;
  const select = document.getElementById('filtro-cadastro');
  const anterior = select.value;
  const opcoes = [...new Set(tabelaCadastro(entidadeAtual).map(r => r[ui.filtro] || 'Não associado'))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
  select.innerHTML = '<option value="">Todos</option>' + opcoes.map(o => `<option value="${escaparHTML(o)}">${escaparHTML(o)}</option>`).join('');
  if (opcoes.includes(anterior)) select.value = anterior;
  const ordem = document.getElementById('ordem-cadastro');
  ordem.options[0].textContent = entidadeAtual === 'veiculos' ? 'Placa: A–Z' : 'Nome: A–Z';
  ordem.options[1].textContent = entidadeAtual === 'veiculos' ? 'Placa: Z–A' : 'Nome: Z–A';
  renderTabelaCadastro();
}

function selecionarCategoria(chave){
  entidadeAtual = chave;
  document.getElementById('busca-cadastro').value = '';
  document.getElementById('filtro-cadastro').value = '';
  document.getElementById('ordem-cadastro').value = 'az';
  montarAbasCadastro();
  document.getElementById(`aba-${chave}`).focus();
}

function renderTabelaCadastro(){
  const def = ENTIDADES[entidadeAtual], ui = CADASTRO_UI[entidadeAtual];
  if (cadastroRemoto(entidadeAtual) && cadastroApiEstado !== 'pronto') {
    document.getElementById('cabecalho-tabela-cadastro').innerHTML = '';
    document.getElementById('corpo-tabela-cadastro').innerHTML = `<tr><td><div class="vazio">${cadastroApiEstado === 'carregando' ? 'Carregando registros…' : 'Lista indisponível. Use Atualizar do servidor para tentar novamente.'}</div></td></tr>`;
    document.getElementById('cadastro-contagem').textContent = '—';
    return;
  }
  const filtro = normalizarBusca(document.getElementById('busca-cadastro').value.trim());
  const categoria = document.getElementById('filtro-cadastro').value;
  const ordem = document.getElementById('ordem-cadastro').value;
  const dados = tabelaCadastro(def.chave).filter(item => (!filtro || Object.values(item).some(v => normalizarBusca(v).includes(filtro))) && (!categoria || (item[ui.filtro] || 'Não associado') === categoria));
  dados.sort((a,b) => ordem === 'recentes' ? b.id-a.id : (ordem === 'za' ? -1 : 1) * String(a.nome || a.placa).localeCompare(String(b.nome || b.placa), 'pt-BR'));
  document.getElementById('cadastro-contagem').textContent = `${dados.length} de ${tabelaCadastro(def.chave).length} registros`;
  document.getElementById('cabecalho-tabela-cadastro').innerHTML = `<tr>${def.colunas.map(c => `<th scope="col">${c.rotulo}</th>`).join('')}<th scope="col" class="text-end">Ações</th></tr>`;
  const corpo = document.getElementById('corpo-tabela-cadastro');
  if (!dados.length){
    corpo.innerHTML = `<tr class="cadastro-vazio"><td colspan="${def.colunas.length + 1}"><div class="vazio"><i class="bi ${filtro || categoria ? 'bi-search' : ui.icone}"></i><strong>${filtro || categoria ? 'Nenhum resultado para estes filtros' : 'Esta lista ainda está vazia'}</strong>${filtro || categoria ? 'Altere a busca ou limpe os filtros para ver outros registros.' : `Use “${ui.novo}” para adicionar o primeiro registro.`}</div></td></tr>`;
    return;
  }
  corpo.innerHTML = dados.map(item => `<tr>
    ${def.colunas.map((c, i) => {
      const valor = c.campo === 'alunos' ? tabelaCadastro('alunos').filter(a => a.rotaId === item.id).length : item[c.campo] ?? 'Não associado';
      let html = escaparHTML(c.campo === 'perfil' ? perfis[valor] || valor : valor);
      if (i === 0) html = `<div class="cadastro-identidade"><span class="cadastro-avatar"><i class="bi ${ui.icone}" aria-hidden="true"></i></span><span><strong>${html}</strong><small>${escaparHTML(entidadeAtual === 'alunos' ? (item.responsavel ? `Responsável: ${item.responsavel}` : 'Sem responsável vinculado') : entidadeAtual === 'veiculos' ? item.modelo : `Registro #${String(item.id).padStart(3, '0')}`)}</small></span></div>`;
      else if (['rota','turno','perfil','motorista','veiculo'].includes(c.campo)) html = `<span class="cadastro-vinculo ${valor === 'Não associado' || !valor ? 'sem-vinculo' : ''}">${html || 'Não associado'}</span>`;
      return `<td data-label="${c.rotulo}">${html}</td>`;
    }).join('')}
    <td data-label="Ações"><div class="cadastro-acoes">${entidadeAtual === 'alunos' ? `<button class="btn btn-sm btn-outline-primary" data-acao="vinculos" data-id="${item.id}">Vínculos</button>` : ''}${entidadeAtual === 'rotas' ? `<button class="btn btn-sm btn-outline-primary" data-acao="itinerario" data-id="${item.id}">Itinerário</button><button class="btn btn-sm btn-outline-primary" data-acao="associacoes" data-id="${item.id}">Veículos / motoristas</button>` : ''}<button class="btn btn-sm btn-outline-primary" data-acao="editar" data-id="${item.id}" aria-label="Editar ${escaparHTML(item.nome || item.placa)}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button><button class="icone-btn" data-acao="excluir" data-id="${item.id}" aria-label="Excluir ${escaparHTML(item.nome || item.placa)}" title="Excluir registro"><i class="bi bi-trash3" aria-hidden="true"></i></button></div></td>
  </tr>`).join('');
  corpo.querySelectorAll('[data-acao]').forEach(b => b.addEventListener('click', () => {
    cadastroRetornoFoco = { id: b.dataset.id, acao: b.dataset.acao };
    if (b.dataset.acao === 'editar') abrirModalCadastro(Number(b.dataset.id));
    else if (b.dataset.acao === 'vinculos') abrirVinculos(Number(b.dataset.id));
    else if (b.dataset.acao === 'associacoes') abrirAssociacoes(Number(b.dataset.id));
    else if (b.dataset.acao === 'itinerario') abrirItinerario(Number(b.dataset.id));
    else excluirRegistro(Number(b.dataset.id));
  }));
}

['busca-cadastro','filtro-cadastro','ordem-cadastro'].forEach(id => document.getElementById(id)?.addEventListener(id === 'busca-cadastro' ? 'input' : 'change', renderTabelaCadastro));
document.getElementById('limpar-filtros-cadastro')?.addEventListener('click', () => {
  document.getElementById('busca-cadastro').value = '';
  document.getElementById('filtro-cadastro').value = '';
  document.getElementById('ordem-cadastro').value = 'az';
  renderTabelaCadastro();
});
document.getElementById('btn-novo-cadastro')?.addEventListener('click', () => { cadastroRetornoFoco = null; abrirModalCadastro(null); });
elModal?.addEventListener('shown.bs.modal', () => document.querySelector('#modal-form input, #modal-form select')?.focus());
elModal?.addEventListener('hidden.bs.modal', () => {
  const origem = cadastroRetornoFoco && document.querySelector(`[data-acao="${cadastroRetornoFoco.acao}"][data-id="${cadastroRetornoFoco.id}"]`);
  (origem || document.getElementById('btn-novo-cadastro'))?.focus();
});

function excluirRegistro(id){
  document.getElementById('modal-salvar').disabled = false;
  const def = ENTIDADES[entidadeAtual];
  const registro = tabelaCadastro(def.chave).find(i => i.id === id);
  document.getElementById('modal-titulo').textContent = `Excluir ${def.titulo.toLowerCase()}`;
  document.getElementById('modal-descricao').textContent = 'Confira o registro antes de confirmar a exclusão.';
  document.getElementById('modal-salvar').textContent = 'Excluir registro';
  const form = document.getElementById('modal-form');
  form.innerHTML = `<div class="cadastro-exclusao"><i class="bi bi-trash3"></i><strong>${escaparHTML(registro.nome || registro.placa)}</strong><p class="desc mb-0">O registro será removido do servidor.</p></div>`;
  form.onsubmit = e => {
    e.preventDefault();
    salvarCadastro(def.chave, id, null, 'Registro excluído com sucesso.');
  };
  modalCadastro.show();
}

function abrirModalCadastro(id){
  document.getElementById('modal-salvar').disabled = false;
  const def = ENTIDADES[entidadeAtual], ui = CADASTRO_UI[entidadeAtual];
  const registro = id ? tabelaCadastro(def.chave).find(i => i.id === id) : {};
  def.campos.filter(c => c.chave === 'senha').forEach(c => c.obrigatorio = !id);
  document.getElementById('modal-titulo').textContent = id ? `Editar ${def.titulo.toLowerCase()}` : ui.novo;
  document.getElementById('modal-descricao').textContent = 'Preencha os dados abaixo. Os campos com * são obrigatórios.';
  document.getElementById('modal-salvar').textContent = id ? 'Salvar alterações' : 'Salvar cadastro';
  const form = document.getElementById('modal-form');
  const grupos = [def.campos.filter(c => c.tipo !== 'select'), def.campos.filter(c => c.tipo === 'select')].filter(g => g.length);
  form.innerHTML = grupos.map((campos, index) => `<fieldset class="cadastro-fieldset"><legend><span>${index + 1}</span>${ui.grupos[index]}</legend><div class="row g-3">${campos.map(c => {
    const attrs = `id="campo-${c.chave}" name="${c.chave}" ${c.obrigatorio ? 'required' : ''} ${c.max ? `maxlength="${c.max}"` : ''} ${c.pattern ? `pattern="${c.pattern}"` : ''} ${c.chave === 'senha' ? 'autocomplete="new-password"' : ''}`;
    let controle;
    if (c.tipo === 'select'){
      const opcoes = c.origem ? tabelaCadastro(c.origem).filter(o => !c.perfil || o.perfil === c.perfil).map(o => ({ valor: o[c.valorOrigem || c.campoOrigem], texto: o[c.campoOrigem] })) : c.opcoes.map(o => ({ valor: o, texto: o==='true'?'Ativo':o==='false'?'Inativo':perfis[o] || o }));
      controle = `<select class="form-select" ${attrs}><option value="">${c.obrigatorio ? 'Selecione uma opção' : 'Sem associação'}</option>${opcoes.map(o => `<option value="${escaparHTML(o.valor)}" ${String(registro[c.chave] ?? c.padrao) === String(o.valor) ? 'selected' : ''}>${escaparHTML(o.texto)}</option>`).join('')}</select>`;
    } else {
      const dicas = { nome: 'Digite o nome completo', matricula: 'Ex.: 2026006', turma: 'Ex.: Manhã ou Noite', responsavel: 'Nome do responsável', cnh: 'Número da CNH', telefone: 'Ex.: (19) 99123-4567', placa: 'Ex.: ABC-1D23', modelo: 'Ex.: Volksbus 15.190', capacidade: 'Ex.: 32', email: 'nome@exemplo.com.br' };
      controle = `<input type="${c.chave === 'telefone' ? 'tel' : c.tipo}" class="form-control" ${attrs} value="${escaparHTML(registro[c.chave] ?? '')}" placeholder="${entidadeAtual === 'rotas' && c.chave === 'nome' ? 'Ex.: Rota 10 — São João da Boa Vista' : dicas[c.chave] || ''}" ${c.tipo === 'number' ? 'min="1" step="1"' : ''}>`;
    }
    return `<div class="${['nome','responsavel','email'].includes(c.chave) || c.tipo === 'select' ? 'col-12' : 'col-md-6'}"><label class="form-label" for="campo-${c.chave}">${c.rotulo}${c.obrigatorio ? ' <span aria-hidden="true">*</span>' : ' <small class="text-body-secondary">(opcional)</small>'}</label>${controle}</div>`;
  }).join('')}</div></fieldset>`).join('') + `<p class="cadastro-form-ajuda"><i class="bi bi-info-circle me-1"></i>${ui.ajuda}</p>`;
  form.onsubmit = e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const dados = Object.fromEntries([...new FormData(form).entries()].map(([chave, valor]) => [chave, chave === 'senha' ? valor : valor.trim()]));
    const vazio = def.campos.find(c => c.obrigatorio && !dados[c.chave]);
    if (vazio){ form.elements[vazio.chave].value = ''; form.reportValidity(); return; }
    def.campos.filter(c => c.tipo === 'number').forEach(c => dados[c.chave] = Number(dados[c.chave]));
    salvarCadastro(def.chave, id, dados, id ? 'Alterações salvas com sucesso.' : 'Cadastro realizado com sucesso.');
  };
  modalCadastro.show();
}
/* ============================================================
   ADMIN — HISTÓRICO DE PRESENÇAS e RELATÓRIOS
   ============================================================ */
