/* ==========================================================================
   MOBILYS — app.js
   Protótipo funcional em memória (sem backend) cobrindo os casos de uso
   do diagrama: Administrador, Motorista e Aluno/Responsável.
   Usa componentes do Bootstrap 5 (Modal, Toast, Dropdown) via bootstrap.bundle.js.
   ========================================================================== */

/* --------------------------- Ícones (Bootstrap Icons) --------------------------- */
const ICONE = {
  dashboard: 'bi-grid-1x2',
  cadastros: 'bi-folder2-open',
  presencas: 'bi-check2-circle',
  relatorios: 'bi-bar-chart-line',
  viagem: 'bi-bus-front',
  agenda: 'bi-calendar2-check',
  mapa: 'bi-geo-alt',
  historico: 'bi-clock-history',
};

/* --------------------------- Dados simulados (em memória) --------------------------- */
const DB = {
  alunos: [
    { id: 1, nome: 'Ana Beatriz Souza', matricula: '2026001', turma: '5º A', rota: 'Jardim das Flores', responsavel: 'Marcos Souza' },
    { id: 2, nome: 'Pedro Henrique Lima', matricula: '2026002', turma: '5º A', rota: 'Jardim das Flores', responsavel: 'Carla Lima' },
    { id: 3, nome: 'Sofia Martins', matricula: '2026003', turma: '4º B', rota: 'Vila Nova', responsavel: 'João Martins' },
    { id: 4, nome: 'Lucas Andrade', matricula: '2026004', turma: '4º B', rota: 'Vila Nova', responsavel: 'Renata Andrade' },
    { id: 5, nome: 'Maria Clara Ferreira', matricula: '2026005', turma: '3º C', rota: 'Centro', responsavel: 'Paulo Ferreira' },
  ],
  rotas: [
    { id: 1, nome: 'Jardim das Flores', turno: 'Manhã', veiculo: 'ABC-1D23', alunos: 2 },
    { id: 2, nome: 'Vila Nova', turno: 'Manhã', veiculo: 'DEF-4G56', alunos: 2 },
    { id: 3, nome: 'Centro', turno: 'Tarde', veiculo: 'Não associado', alunos: 1 },
  ],
  motoristas: [
    { id: 1, nome: 'Carlos Eduardo', cnh: '01234567890', telefone: '(19) 99123-4567', veiculo: 'ABC-1D23' },
    { id: 2, nome: 'Roberto Silva', cnh: '09876543210', telefone: '(19) 99876-5432', veiculo: 'DEF-4G56' },
  ],
  veiculos: [
    { id: 1, placa: 'ABC-1D23', modelo: 'Volksbus 15.190', capacidade: 32, motorista: 'Carlos Eduardo' },
    { id: 2, placa: 'DEF-4G56', modelo: 'Mercedes-Benz OF-1721', capacidade: 40, motorista: 'Roberto Silva' },
    { id: 3, placa: 'GHI-7J89', modelo: 'Iveco CityClass', capacidade: 28, motorista: 'Não associado' },
  ],
  usuarios: [
    { id: 1, nome: 'Equipe Administrativa', email: 'admin@mobilys.com.br', perfil: 'Administrador' },
    { id: 2, nome: 'Carlos Eduardo', email: 'carlos@mobilys.com.br', perfil: 'Motorista' },
    { id: 3, nome: 'Marcos Souza', email: 'marcos@mobilys.com.br', perfil: 'Aluno/Responsável' },
  ],
  historicoPresencas: [
    { data: '21/08/2026', aluno: 'Ana Beatriz Souza', rota: 'Jardim das Flores', turno: 'Ida', status: 'presente' },
    { data: '21/08/2026', aluno: 'Pedro Henrique Lima', rota: 'Jardim das Flores', turno: 'Ida', status: 'ausente' },
    { data: '21/08/2026', aluno: 'Sofia Martins', rota: 'Vila Nova', turno: 'Volta', status: 'presente' },
    { data: '20/08/2026', aluno: 'Lucas Andrade', rota: 'Vila Nova', turno: 'Ida', status: 'presente' },
    { data: '20/08/2026', aluno: 'Maria Clara Ferreira', rota: 'Centro', turno: 'Volta', status: 'presente' },
  ],
  presencaSemana: [
    { dia: 'Seg', pct: 88 }, { dia: 'Ter', pct: 92 }, { dia: 'Qua', pct: 85 },
    { dia: 'Qui', pct: 94 }, { dia: 'Sex', pct: 80 }, { dia: 'Sáb', pct: 96 },
  ],
};

/* Estado da viagem do motorista */
const viagem = {
  status: 'nao-iniciada', // nao-iniciada | em-andamento | encerrada
  turno: 'ida',
  alunos: [
    { id: 1, nome: 'Ana Beatriz Souza', ponto: 'Rua das Acácias, 120', ida: null, volta: null },
    { id: 2, nome: 'Pedro Henrique Lima', ponto: 'Rua das Acácias, 240', ida: null, volta: null },
  ],
};

/* Agendamentos do Aluno/Responsável logado */
const agendamentos = [
  { id: 1, nome: 'Ana Beatriz Souza', rota: 'Jardim das Flores', ida: 'confirmado', volta: 'confirmado' },
];

const historicoResp = [
  { data: '21/08/2026', rota: 'Jardim das Flores', turno: 'Ida', situacao: 'Utilizado' },
  { data: '20/08/2026', rota: 'Jardim das Flores', turno: 'Volta', situacao: 'Cancelado' },
  { data: '19/08/2026', rota: 'Jardim das Flores', turno: 'Ida', situacao: 'Utilizado' },
];

/* --------------------------- Navegação por perfil --------------------------- */
const NAV = {
  admin: [
    { view: 'admin-dashboard', label: 'Painel', icone: 'dashboard' },
    { view: 'admin-cadastros', label: 'Cadastros', icone: 'cadastros' },
    { view: 'admin-presencas', label: 'Presenças', icone: 'presencas' },
    { view: 'admin-relatorios', label: 'Relatórios', icone: 'relatorios' },
  ],
  motorista: [
    { view: 'motorista-viagem', label: 'Viagem', icone: 'viagem' },
  ],
  responsavel: [
    { view: 'resp-agendamentos', label: 'Agenda', icone: 'agenda' },
    { view: 'resp-status', label: 'Viagem', icone: 'mapa' },
    { view: 'resp-historico', label: 'Histórico', icone: 'historico' },
  ],
};

const NOME_PERFIL = { admin: 'Administrador', motorista: 'Motorista', responsavel: 'Aluno/Responsável' };

/* Cada view agora corresponde a um arquivo .html real do projeto */
const PAGINA_POR_VIEW = {
  'admin-dashboard':   'admin-painel.html',
  'admin-cadastros':   'admin-cadastros.html',
  'admin-presencas':   'admin-presencas.html',
  'admin-relatorios':  'admin-relatorios.html',
  'motorista-viagem':  'motorista-viagem.html',
  'resp-agendamentos': 'responsavel-agendamentos.html',
  'resp-status':       'responsavel-status.html',
  'resp-historico':    'responsavel-historico.html',
};
const PERFIL_POR_VIEW = {
  'admin-dashboard': 'admin', 'admin-cadastros': 'admin', 'admin-presencas': 'admin', 'admin-relatorios': 'admin',
  'motorista-viagem': 'motorista',
  'resp-agendamentos': 'responsavel', 'resp-status': 'responsavel', 'resp-historico': 'responsavel',
};
const PRIMEIRA_PAGINA = { admin: 'admin-painel.html', motorista: 'motorista-viagem.html', responsavel: 'responsavel-agendamentos.html' };

/* Instâncias Bootstrap reutilizadas (só existem nas páginas que trazem o respectivo elemento) */
const elModal = document.getElementById('modal-cadastro');
const modalCadastro = elModal ? new bootstrap.Modal(elModal) : null;
const elToast = document.getElementById('toast-mobilys');
const toastMobilys = elToast ? new bootstrap.Toast(elToast, { delay: 2800 }) : null;

/* --------------------------- Login (apenas em index.html) --------------------------- */
const formLogin = document.getElementById('form-login');
if (formLogin){
  document.querySelectorAll('.perfil-opcao').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.perfil-opcao').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
    });
  });

  /* Saudação dinâmica conforme o horário */
  const elSaudacao = document.getElementById('login-saudacao');
  if (elSaudacao){
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    elSaudacao.textContent = `${saudacao}! Bem-vindo(a) de volta`;
  }

  /* Mostrar/ocultar senha */
  const btnOlho = document.getElementById('btn-olho');
  const inSenha = document.getElementById('in-senha');
  const iconeOlho = document.getElementById('icone-olho');
  if (btnOlho){
    btnOlho.addEventListener('click', () => {
      const visivel = inSenha.type === 'text';
      inSenha.type = visivel ? 'password' : 'text';
      iconeOlho.classList.toggle('bi-eye', visivel);
      iconeOlho.classList.toggle('bi-eye-slash', !visivel);
    });
  }

  /* Envio com pequeno feedback de carregamento antes de redirecionar */
  const btnEntrar = document.getElementById('btn-entrar');
  const spinnerEntrar = document.getElementById('spinner-entrar');
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!formLogin.checkValidity()){ formLogin.reportValidity(); return; }
    const perfil = document.querySelector('.perfil-opcao.ativo')?.dataset.perfil || 'admin';
    btnEntrar.classList.add('carregando');
    spinnerEntrar?.classList.remove('d-none');
    btnEntrar.querySelector('.btn-entrar-texto').textContent = 'Entrando...';
    setTimeout(() => {
      window.location.href = `${PRIMEIRA_PAGINA[perfil]}?perfil=${perfil}`;
    }, 450);
  });
}

/* --------------------------- Montagem de navegação (todas as páginas internas) --------------------------- */
function linkNavHTML(item, perfil, viewAtual){
  const ativo = item.view === viewAtual ? 'ativo' : '';
  return `<a class="nav-item-mobilys ${ativo}" href="${PAGINA_POR_VIEW[item.view]}?perfil=${perfil}"><i class="bi ${ICONE[item.icone]}"></i><span>${item.label}</span></a>`;
}

function montarNavegacao(perfil, viewAtual){
  const itens = NAV[perfil];
  const inferior = document.getElementById('nav-inferior');
  const lateral = document.getElementById('nav-lateral');
  if (inferior) inferior.innerHTML = itens.map(i => linkNavHTML(i, perfil, viewAtual)).join('');
  if (lateral) lateral.innerHTML = itens.map(i => linkNavHTML(i, perfil, viewAtual)).join('');
}

/* Ponto de entrada de cada página interna: lê o perfil pela URL (?perfil=admin|motorista|responsavel),
   monta o cabeçalho/menu e dispara a renderização específica daquela tela. */
function iniciarPagina(viewAtual){
  const params = new URLSearchParams(window.location.search);
  const perfil = params.get('perfil') || PERFIL_POR_VIEW[viewAtual];

  const topoCargo = document.getElementById('topo-cargo');
  if (topoCargo) topoCargo.textContent = NOME_PERFIL[perfil];
  document.querySelectorAll('.link-sair').forEach(a => a.setAttribute('href', 'index.html'));

  montarNavegacao(perfil, viewAtual);

  if (viewAtual === 'admin-dashboard') atualizarDashboard();
  if (viewAtual === 'admin-cadastros') montarAbasCadastro();
  if (viewAtual === 'admin-presencas') renderHistoricoPresencas();
  if (viewAtual === 'admin-relatorios') preencherFiltroRotas();
  if (viewAtual === 'motorista-viagem') renderViagem();
  if (viewAtual === 'resp-agendamentos') renderAgendamentos();
  if (viewAtual === 'resp-status') renderStatusViagem();
  if (viewAtual === 'resp-historico') renderHistoricoResp();
}

/* --------------------------- Toast de feedback (Bootstrap Toast) --------------------------- */
function mostrarToast(msg, sucesso = true){
  if (!toastMobilys) return;
  document.getElementById('toast-corpo').innerHTML =
    `<i class="bi ${sucesso ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}"></i><span>${msg}</span>`;
  elToast.classList.remove('text-bg-dark', 'text-bg-mobilys');
  elToast.classList.add(sucesso ? 'text-bg-mobilys' : 'text-bg-dark');
  toastMobilys.show();
}

/* ============================================================
   ADMIN — DASHBOARD
   ============================================================ */
function atualizarDashboard(){
  const elSaudacao = document.getElementById('painel-saudacao');
  if (elSaudacao){
    const hora = new Date().getHours();
    elSaudacao.textContent = hora < 12 ? 'Bom dia, Administrador' : hora < 18 ? 'Boa tarde, Administrador' : 'Boa noite, Administrador';
  }
  const elData = document.getElementById('painel-data');
  if (elData){
    elData.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  document.getElementById('d-alunos').textContent = DB.alunos.length;
  document.getElementById('d-rotas').textContent = DB.rotas.length;
  document.getElementById('d-veiculos').textContent = DB.veiculos.length;
  const presentes = DB.historicoPresencas.filter(p => p.status === 'presente').length;
  const pct = Math.round((presentes / DB.historicoPresencas.length) * 100);
  document.getElementById('d-presenca').textContent = pct + '%';

  const corpo = document.getElementById('tabela-viagens-hoje');
  corpo.innerHTML = DB.rotas.map(r => `
    <tr>
      <td>${r.nome}</td>
      <td>${DB.motoristas.find(m => m.veiculo === r.veiculo)?.nome ?? '—'}</td>
      <td>${r.turno}</td>
      <td><span class="badge selo-pendente">Em rota</span></td>
      <td><span class="badge selo-presente">${r.alunos}/${r.alunos} confirmados</span></td>
    </tr>`).join('');

  renderGraficosDashboard();
}

/* Gráficos do painel (Chart.js) — carregado apenas em admin-painel.html */
function renderGraficosDashboard(){
  if (typeof Chart === 'undefined') return;

  const corPrimaria = getComputedStyle(document.documentElement).getPropertyValue('--primaria-700').trim();
  const corPrimariaClara = getComputedStyle(document.documentElement).getPropertyValue('--primaria-100').trim();
  const corTexto = getComputedStyle(document.documentElement).getPropertyValue('--neutro-600').trim();
  Chart.defaults.font.family = "'Roboto', system-ui, sans-serif";
  Chart.defaults.color = corTexto;

  const canvasLinha = document.getElementById('grafico-presenca-semana');
  if (canvasLinha && !canvasLinha.dataset.montado){
    canvasLinha.dataset.montado = '1';
    new Chart(canvasLinha, {
      type: 'line',
      data: {
        labels: DB.presencaSemana.map(d => d.dia),
        datasets: [{
          label: 'Presença (%)',
          data: DB.presencaSemana.map(d => d.pct),
          borderColor: corPrimaria,
          backgroundColor: corPrimariaClara,
          fill: true,
          tension: .35,
          pointRadius: 4,
          pointBackgroundColor: corPrimaria,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 60, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#F0F2F4' } }, x: { grid: { display: false } } },
      },
    });
  }

  const canvasRotas = document.getElementById('grafico-alunos-rota');
  if (canvasRotas && !canvasRotas.dataset.montado){
    canvasRotas.dataset.montado = '1';
    const cores = ['#0E6B7A', '#1C6888', '#6BBFCC', '#9BA3AE'];
    new Chart(canvasRotas, {
      type: 'doughnut',
      data: {
        labels: DB.rotas.map(r => r.nome),
        datasets: [{ data: DB.rotas.map(r => r.alunos), backgroundColor: cores, borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false } },
      },
    });

    const legenda = document.getElementById('legenda-alunos-rota');
    if (legenda){
      legenda.innerHTML = DB.rotas.map((r, i) => `
        <div class="legenda-rota"><span class="ponto" style="background:${cores[i % cores.length]}"></span>${r.nome} <strong class="ms-auto">${r.alunos}</strong></div>
      `).join('');
    }
  }
}

/* ============================================================
   ADMIN — CADASTROS (motor CRUD genérico)
   Cobre: Listar/Inserir/Atualizar/Excluir/Buscar para
   Alunos, Rotas, Motoristas, Veículos e Usuários; e as
   associações (aluno↔rota, veículo↔rota, motorista↔veículo).
   ============================================================ */
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
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true },
      { chave: 'matricula', rotulo: 'Matrícula', tipo: 'text', obrigatorio: true },
      { chave: 'turma', rotulo: 'Turma', tipo: 'text', obrigatorio: true },
      { chave: 'responsavel', rotulo: 'Responsável', tipo: 'text', obrigatorio: true },
      { chave: 'rota', rotulo: 'Rota associada', tipo: 'select', origem: 'rotas', campoOrigem: 'nome', legenda: 'Associar aluno à rota' },
    ],
  },
  rotas: {
    titulo: 'Rota', chave: 'rotas',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'Turno', campo: 'turno' },
      { rotulo: 'Veículo', campo: 'veiculo' },
      { rotulo: 'Alunos', campo: 'alunos' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome da rota', tipo: 'text', obrigatorio: true },
      { chave: 'turno', rotulo: 'Turno', tipo: 'select', opcoes: ['Manhã', 'Tarde', 'Noite'], obrigatorio: true },
      { chave: 'veiculo', rotulo: 'Veículo', tipo: 'select', origem: 'veiculos', campoOrigem: 'placa', legenda: 'Associar veículo à rota' },
    ],
  },
  motoristas: {
    titulo: 'Motorista', chave: 'motoristas',
    colunas: [
      { rotulo: 'Nome', campo: 'nome' },
      { rotulo: 'CNH', campo: 'cnh' },
      { rotulo: 'Telefone', campo: 'telefone' },
      { rotulo: 'Veículo', campo: 'veiculo' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true },
      { chave: 'cnh', rotulo: 'Número da CNH', tipo: 'text', obrigatorio: true },
      { chave: 'telefone', rotulo: 'Telefone', tipo: 'text', obrigatorio: true },
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
      { chave: 'placa', rotulo: 'Placa', tipo: 'text', obrigatorio: true },
      { chave: 'modelo', rotulo: 'Modelo', tipo: 'text', obrigatorio: true },
      { chave: 'capacidade', rotulo: 'Capacidade (lugares)', tipo: 'number', obrigatorio: true },
      { chave: 'motorista', rotulo: 'Motorista', tipo: 'select', origem: 'motoristas', campoOrigem: 'nome', legenda: 'Associar motorista ao veículo' },
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
      { chave: 'nome', rotulo: 'Nome completo', tipo: 'text', obrigatorio: true },
      { chave: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
      { chave: 'perfil', rotulo: 'Perfil de acesso', tipo: 'select', opcoes: ['Administrador', 'Motorista', 'Aluno/Responsável'], obrigatorio: true },
    ],
  },
};

let entidadeAtual = 'alunos';

function montarAbasCadastro(){
  const abas = document.getElementById('abas-cadastro');
  abas.innerHTML = Object.keys(ENTIDADES).map(chave => `
    <button class="btn btn-sm ${chave === entidadeAtual ? 'btn-primary' : 'btn-outline-primary'}" data-entidade="${chave}">
      ${ENTIDADES[chave].titulo}s
    </button>`).join('');
  abas.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => { entidadeAtual = b.dataset.entidade; document.getElementById('busca-cadastro').value=''; montarAbasCadastro(); renderTabelaCadastro(); });
  });
  renderTabelaCadastro();
}

function renderTabelaCadastro(filtro = ''){
  const def = ENTIDADES[entidadeAtual];
  const dados = DB[def.chave].filter(item =>
    !filtro || Object.values(item).some(v => String(v).toLowerCase().includes(filtro.toLowerCase()))
  );

  document.getElementById('cabecalho-tabela-cadastro').innerHTML =
    `<tr>${def.colunas.map(c => `<th>${c.rotulo}</th>`).join('')}<th class="text-end">Ações</th></tr>`;

  const corpo = document.getElementById('corpo-tabela-cadastro');
  if (!dados.length){
    corpo.innerHTML = `<tr><td colspan="${def.colunas.length + 1}">
      <div class="vazio"><i class="bi ${ICONE.cadastros}"></i><strong>Nenhum registro encontrado</strong>Cadastre um novo ${def.titulo.toLowerCase()} para começar.</div>
    </td></tr>`;
    return;
  }

  corpo.innerHTML = dados.map(item => `
    <tr>
      ${def.colunas.map(c => `<td>${item[c.campo] ?? '—'}</td>`).join('')}
      <td>
        <div class="d-flex gap-2 justify-content-end">
          <button class="icone-btn" data-acao="editar" data-id="${item.id}" title="Editar / associar"><i class="bi bi-pencil"></i></button>
          <button class="icone-btn excluir" data-acao="excluir" data-id="${item.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
        </div>
      </td>
    </tr>`).join('');

  corpo.querySelectorAll('[data-acao="editar"]').forEach(b => b.addEventListener('click', () => abrirModalCadastro(Number(b.dataset.id))));
  corpo.querySelectorAll('[data-acao="excluir"]').forEach(b => b.addEventListener('click', () => excluirRegistro(Number(b.dataset.id))));
}

document.getElementById('busca-cadastro')?.addEventListener('input', (e) => renderTabelaCadastro(e.target.value));
document.getElementById('btn-novo-cadastro')?.addEventListener('click', () => abrirModalCadastro(null));

function excluirRegistro(id){
  const def = ENTIDADES[entidadeAtual];
  if (!confirm(`Excluir este ${def.titulo.toLowerCase()}? Esta ação não pode ser desfeita.`)) return;
  DB[def.chave] = DB[def.chave].filter(i => i.id !== id);
  renderTabelaCadastro(document.getElementById('busca-cadastro').value);
  atualizarDashboard();
  mostrarToast(`${def.titulo} excluído com sucesso.`);
}

function abrirModalCadastro(id){
  const def = ENTIDADES[entidadeAtual];
  const registro = id ? DB[def.chave].find(i => i.id === id) : {};
  document.getElementById('modal-titulo').textContent = id ? `Editar ${def.titulo.toLowerCase()}` : `Novo ${def.titulo.toLowerCase()}`;

  const form = document.getElementById('modal-form');
  form.innerHTML = def.campos.map(c => {
    let controle;
    if (c.tipo === 'select'){
      let opcoes = c.opcoes;
      if (c.origem) opcoes = DB[c.origem].map(o => o[c.campoOrigem]);
      controle = `<select class="form-select" name="${c.chave}" ${c.obrigatorio ? 'required' : ''}>
        <option value="">Selecione...</option>
        ${opcoes.map(o => `<option value="${o}" ${registro[c.chave] === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>`;
    } else {
      controle = `<input type="${c.tipo}" class="form-control" name="${c.chave}" value="${registro[c.chave] ?? ''}" ${c.obrigatorio ? 'required' : ''}>`;
    }
    return `<div class="mb-3">
      <label class="form-label campo-rotulo">${c.rotulo}${c.legenda ? ` <span class="text-body-secondary text-normal fw-normal text-lowercase">(${c.legenda})</span>` : ''}</label>
      ${controle}
    </div>`;
  }).join('') + `
    <div class="d-flex gap-2 mt-4">
      <button type="button" class="btn btn-outline-primary flex-fill" data-bs-dismiss="modal">Cancelar</button>
      <button type="submit" class="btn btn-primary flex-fill">${id ? 'Salvar alterações' : 'Cadastrar'}</button>
    </div>`;

  form.onsubmit = (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());
    if (id){
      Object.assign(registro, dados);
      mostrarToast(`${def.titulo} atualizado com sucesso.`);
    } else {
      const novoId = Math.max(0, ...DB[def.chave].map(i => i.id)) + 1;
      DB[def.chave].push({ id: novoId, ...dados });
      mostrarToast(`${def.titulo} cadastrado com sucesso.`);
    }
    modalCadastro.hide();
    renderTabelaCadastro(document.getElementById('busca-cadastro').value);
    atualizarDashboard();
  };

  modalCadastro.show();
}

/* ============================================================
   ADMIN — HISTÓRICO DE PRESENÇAS e RELATÓRIOS
   ============================================================ */
function preencherFiltroRotas(){
  ['f-presenca-rota', 'rel-rota'].forEach(idSelect => {
    const sel = document.getElementById(idSelect);
    if (!sel || sel.dataset.preenchido) return;
    sel.innerHTML += DB.rotas.map(r => `<option value="${r.nome}">${r.nome}</option>`).join('');
    sel.dataset.preenchido = '1';
  });
}

function renderHistoricoPresencas(){
  preencherFiltroRotas();
  const corpo = document.getElementById('tabela-historico-presencas');
  corpo.innerHTML = DB.historicoPresencas.map(p => `
    <tr>
      <td>${p.data}</td><td>${p.aluno}</td><td>${p.rota}</td><td>${p.turno}</td>
      <td><span class="badge ${p.status === 'presente' ? 'selo-presente' : 'selo-ausente'}">${p.status === 'presente' ? 'Presente' : 'Ausente'}</span></td>
    </tr>`).join('');
}

document.getElementById('btn-gerar-relatorio')?.addEventListener('click', () => {
  const rota = document.getElementById('rel-rota').value;
  const registros = DB.historicoPresencas.filter(p => !rota || p.rota === rota);
  const presentes = registros.filter(p => p.status === 'presente').length;
  const total = registros.length || 1;
  document.getElementById('rel-resultado').innerHTML =
    `Relatório gerado: <strong>${registros.length}</strong> registros ${rota ? `para a rota <strong>${rota}</strong>` : 'em todas as rotas'} —
     <strong>${Math.round((presentes/total)*100)}%</strong> de presença no período. (Exportação em PDF/planilha disponível na versão final.)`;
  mostrarToast('Relatório de presença gerado com sucesso.');
});

/* ============================================================
   MOTORISTA — GERENCIAR VIAGEM
   (iniciar, listar alunos confirmados, registrar presença ida/volta, encerrar)
   ============================================================ */
function renderViagem(){
  const selo = document.getElementById('mv-status-selo');
  const btnIniciar = document.getElementById('btn-iniciar-viagem');
  const btnEncerrar = document.getElementById('btn-encerrar-viagem');

  const rotulos = { 'nao-iniciada': 'Não iniciada', 'em-andamento': 'Em andamento', 'encerrada': 'Encerrada' };
  selo.textContent = rotulos[viagem.status];
  document.getElementById('mv-info').textContent = `Turno: ${viagem.turno === 'ida' ? 'Ida' : 'Volta'} · Alunos confirmados: ${viagem.alunos.length}`;

  btnIniciar.classList.toggle('d-none', viagem.status !== 'nao-iniciada');
  btnEncerrar.classList.toggle('d-none', viagem.status !== 'em-andamento');

  renderListaAlunosViagem();
}

document.getElementById('btn-iniciar-viagem')?.addEventListener('click', () => {
  viagem.status = 'em-andamento';
  mostrarToast('Viagem iniciada. Boa rota!');
  renderViagem();
});
document.getElementById('btn-encerrar-viagem')?.addEventListener('click', () => {
  viagem.status = 'encerrada';
  mostrarToast('Viagem encerrada com sucesso.');
  renderViagem();
});
document.getElementById('mv-turno-select')?.addEventListener('change', (e) => {
  viagem.turno = e.target.value;
  renderViagem();
});
document.getElementById('busca-alunos-viagem')?.addEventListener('input', () => renderListaAlunosViagem());

function renderListaAlunosViagem(){
  const filtro = document.getElementById('busca-alunos-viagem').value.toLowerCase();
  const lista = document.getElementById('lista-alunos-viagem');
  const dados = viagem.alunos.filter(a => a.nome.toLowerCase().includes(filtro));
  const emAndamento = viagem.status === 'em-andamento';

  if (!dados.length){
    lista.innerHTML = `<div class="vazio"><i class="bi ${ICONE.viagem}"></i><strong>Nenhum aluno confirmado</strong>para este trajeto no momento.</div>`;
    return;
  }

  lista.innerHTML = dados.map(a => {
    const val = a[viagem.turno];
    return `
    <div class="cartao-aluno">
      <div class="avatar">${a.nome.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
      <div class="info"><div class="nome">${a.nome}</div><div class="ponto">${a.ponto}</div></div>
      <div class="toggle-presenca">
        <button data-id="${a.id}" data-valor="presente" class="${val === 'presente' ? 'pres-ativo' : ''}" ${!emAndamento ? 'disabled' : ''}>Presente</button>
        <button data-id="${a.id}" data-valor="ausente" class="${val === 'ausente' ? 'aus-ativo' : ''}" ${!emAndamento ? 'disabled' : ''}>Ausente</button>
      </div>
    </div>`;
  }).join('');

  lista.querySelectorAll('.toggle-presenca button').forEach(btn => {
    btn.addEventListener('click', () => {
      const aluno = viagem.alunos.find(a => a.id === Number(btn.dataset.id));
      aluno[viagem.turno] = btn.dataset.valor;
      renderListaAlunosViagem();
      mostrarToast(`Presença registrada: ${aluno.nome} — ${btn.dataset.valor === 'presente' ? 'presente' : 'ausente'} (${viagem.turno}).`);
    });
  });
}

/* ============================================================
   ALUNO/RESPONSÁVEL — AGENDAMENTOS, STATUS E HISTÓRICO
   ============================================================ */
function renderAgendamentos(){
  const lista = document.getElementById('lista-agendamentos');
  lista.innerHTML = agendamentos.map(a => `
    <div class="cartao-aluno flex-wrap">
      <div class="avatar">${a.nome.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
      <div class="info"><div class="nome">${a.nome}</div><div class="ponto">Rota: ${a.rota}</div></div>
      <div class="w-100 d-flex gap-4 mt-2 flex-wrap">
        <div class="flex-fill" style="min-width:140px;">
          <p class="desc mb-2 fw-bold">Ida</p>
          <div class="toggle-presenca">
            <button data-turno="ida" data-valor="confirmado" data-id="${a.id}" class="${a.ida==='confirmado' ? 'pres-ativo':''}">Confirmar</button>
            <button data-turno="ida" data-valor="cancelado" data-id="${a.id}" class="${a.ida==='cancelado' ? 'aus-ativo':''}">Cancelar</button>
          </div>
        </div>
        <div class="flex-fill" style="min-width:140px;">
          <p class="desc mb-2 fw-bold">Volta</p>
          <div class="toggle-presenca">
            <button data-turno="volta" data-valor="confirmado" data-id="${a.id}" class="${a.volta==='confirmado' ? 'pres-ativo':''}">Confirmar</button>
            <button data-turno="volta" data-valor="cancelado" data-id="${a.id}" class="${a.volta==='cancelado' ? 'aus-ativo':''}">Cancelar</button>
          </div>
        </div>
      </div>
    </div>`).join('');

  lista.querySelectorAll('button[data-turno]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ag = agendamentos.find(a => a.id === Number(btn.dataset.id));
      ag[btn.dataset.turno] = btn.dataset.valor;
      renderAgendamentos();
      mostrarToast(btn.dataset.valor === 'confirmado' ? 'Utilização do transporte confirmada.' : 'Utilização do transporte cancelada.');
    });
  });
}

const ETAPAS_VIAGEM = ['Aguardando', 'A caminho', 'No ponto', 'Chegou'];
let etapaAtual = 1;
function renderStatusViagem(){
  const trilha = document.getElementById('trilha-status');
  trilha.innerHTML = ETAPAS_VIAGEM.map((et, i) => `
    <div class="etapa ${i < etapaAtual ? 'feita' : ''} ${i === etapaAtual ? 'atual' : ''}">
      <div class="bola">${i < etapaAtual ? '<i class="bi bi-check-lg"></i>' : ''}</div>
      <div class="rotulo-etapa">${et}</div>
    </div>`).join('');
  document.getElementById('rs-mensagem').textContent =
    etapaAtual >= ETAPAS_VIAGEM.length - 1
      ? 'O ônibus chegou ao destino.'
      : `O ônibus está a caminho — próxima etapa: ${ETAPAS_VIAGEM[etapaAtual]}.`;
}

function renderHistoricoResp(){
  const corpo = document.getElementById('tabela-historico-resp');
  corpo.innerHTML = historicoResp.map(h => `
    <tr>
      <td>${h.data}</td><td>${h.rota}</td><td>${h.turno}</td>
      <td><span class="badge ${h.situacao === 'Utilizado' ? 'selo-presente' : 'selo-ausente'}">${h.situacao}</span></td>
    </tr>`).join('');
}
