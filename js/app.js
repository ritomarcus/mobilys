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
  statusPorTurno: { ida: 'nao-iniciada', volta: 'nao-iniciada' },
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
  return `<a class="nav-item-mobilys ${ativo}" ${ativo ? 'aria-current="page"' : ''} href="${PAGINA_POR_VIEW[item.view]}?perfil=${perfil}"><i class="bi ${ICONE[item.icone]}" aria-hidden="true"></i><span>${item.label}</span></a>`;
}

function montarNavegacao(perfil, viewAtual){
  const itens = NAV[perfil];
  const inferior = document.getElementById('nav-inferior');
  const lateral = document.getElementById('nav-lateral');
  if (inferior) inferior.innerHTML = itens.map(i => linkNavHTML(i, perfil, viewAtual)).join('');
  if (lateral) lateral.innerHTML = itens.map(i => linkNavHTML(i, perfil, viewAtual)).join('');
  if (lateral && perfil !== 'admin') lateral.insertAdjacentHTML('afterbegin', `<div class="nav-perfil"><span class="avatar-perfil">${perfil === 'motorista' ? 'CE' : 'AB'}</span><strong>${perfil === 'motorista' ? 'Carlos Eduardo' : 'Ana Beatriz Souza'}</strong><small>${perfil === 'motorista' ? 'Motorista · Jardim das Flores' : 'Aluna · 5º A · Manhã'}</small></div>`);
}

/* Ponto de entrada de cada página interna: lê o perfil pela URL (?perfil=admin|motorista|responsavel),
   monta o cabeçalho/menu e dispara a renderização específica daquela tela. */
function iniciarPagina(viewAtual){
  const perfil = PERFIL_POR_VIEW[viewAtual];

  const topoCargo = document.getElementById('topo-cargo');
  if (topoCargo) topoCargo.textContent = NOME_PERFIL[perfil];
  document.querySelectorAll('.link-sair').forEach(a => a.setAttribute('href', 'index.html'));

  montarNavegacao(perfil, viewAtual);

  if (viewAtual === 'admin-dashboard') atualizarDashboard();
  if (viewAtual === 'admin-cadastros') montarAbasCadastro();
  if (viewAtual === 'admin-presencas') renderHistoricoPresencas();
  if (viewAtual === 'admin-relatorios') iniciarRelatorios();
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
  const estilo = getComputedStyle(document.documentElement);
  const cor = nome => estilo.getPropertyValue(nome).trim();
  const corPrimaria = cor('--primaria-700');
  const corPrimariaClara = cor('--primaria-100');
  const corTexto = cor('--neutro-600');
  const cores = ['--primaria-700', '--secundaria-700', '--primaria-300', '--neutro-400'].map(cor);
  const presentes = DB.rotas.map(r => DB.historicoPresencas.filter(p => p.rota === r.nome && p.status === 'presente').length);
  const ausentes = DB.rotas.map(r => DB.historicoPresencas.filter(p => p.rota === r.nome && p.status === 'ausente').length);
  document.getElementById('dados-presencas-rota').textContent = DB.rotas.map((r, i) => `${r.nome}: ${presentes[i]} presente(s), ${ausentes[i]} ausente(s)`).join(' · ');
  document.getElementById('legenda-alunos-rota').innerHTML = DB.rotas.map((r, i) => `<div class="legenda-rota"><span class="ponto" style="background:${cores[i % cores.length]}"></span>${r.nome}<strong class="ms-auto">${r.alunos}</strong></div>`).join('');
  if (typeof Chart === 'undefined') {
    document.querySelectorAll('.grafico-caixa').forEach(el => { el.innerHTML = '<p class="desc p-3">Gráfico indisponível. Consulte os valores abaixo.</p>'; });
    return;
  }
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
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: cor('--neutro-100') } }, x: { grid: { display: false } } },
      },
    });
  }

  const canvasRotas = document.getElementById('grafico-alunos-rota');
  if (canvasRotas && !canvasRotas.dataset.montado){
    canvasRotas.dataset.montado = '1';
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
  const canvasPresencas = document.getElementById('grafico-presencas-rota');
  if (canvasPresencas && !canvasPresencas.dataset.montado){
    canvasPresencas.dataset.montado = '1';
    new Chart(canvasPresencas, {
      type: 'bar',
      data: { labels: DB.rotas.map(r => r.nome), datasets: [
        { label: 'Presentes', data: presentes, backgroundColor: corPrimaria, borderRadius: 5 },
        { label: 'Ausentes', data: ausentes, backgroundColor: cor('--neutro-400'), borderRadius: 5 },
      ] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: cor('--neutro-100') } }, y: { grid: { display: false } } } },
    });
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

/* Apresentação e filtros de cada categoria. Os dados continuam no DB de demonstração. */
const CADASTRO_UI = {
  alunos: { plural: 'Alunos', novo: 'Novo aluno', icone: 'bi-mortarboard', descricao: 'Dados escolares, responsáveis e vínculos com as rotas.', filtro: 'rota', filtroNome: 'Rota', busca: 'Nome, matrícula ou responsável', ajuda: 'Associe cada aluno à sua rota no formulário de cadastro.', grupos: ['Dados do aluno', 'Transporte escolar'] },
  rotas: { plural: 'Rotas', novo: 'Nova rota', icone: 'bi-signpost-split', descricao: 'Organize os trajetos, turnos e veículos do transporte.', filtro: 'turno', filtroNome: 'Turno', busca: 'Nome da rota ou placa do veículo', ajuda: 'O número de alunos é calculado a partir dos alunos associados a cada rota.', grupos: ['Identificação da rota', 'Veículo do trajeto'] },
  motoristas: { plural: 'Motoristas', novo: 'Novo motorista', icone: 'bi-person-vcard', descricao: 'Consulte os condutores, seus contatos e veículos.', filtro: 'veiculo', filtroNome: 'Veículo', busca: 'Nome, CNH, telefone ou veículo', ajuda: 'Para associar um motorista a um veículo, abra a categoria Veículos e edite o veículo desejado.', grupos: ['Dados do motorista'] },
  veiculos: { plural: 'Veículos', novo: 'Novo veículo', icone: 'bi-bus-front', descricao: 'Mantenha a frota e os motoristas associados organizados.', filtro: 'motorista', filtroNome: 'Motorista', busca: 'Placa, modelo ou motorista', ajuda: 'Associe o motorista aqui e vincule o veículo ao trajeto na categoria Rotas.', grupos: ['Dados do veículo', 'Motorista responsável'] },
  usuarios: { plural: 'Usuários', novo: 'Novo usuário', icone: 'bi-person-gear', descricao: 'Organize as pessoas e seus perfis de acesso ao sistema.', filtro: 'perfil', filtroNome: 'Perfil', busca: 'Nome, e-mail ou perfil de acesso', ajuda: 'Os perfis representam as áreas de Administrador, Motorista e Aluno/Responsável.', grupos: ['Dados do usuário', 'Perfil de acesso'] },
};
const escaparHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizarBusca = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let entidadeAtual = 'alunos';
let cadastroRetornoFoco = null;

function montarAbasCadastro(){
  const abas = document.getElementById('abas-cadastro');
  abas.innerHTML = Object.keys(ENTIDADES).map(chave => `
    <button type="button" class="cadastro-categoria ${chave === entidadeAtual ? 'ativo' : ''}" id="aba-${chave}" role="tab" aria-selected="${chave === entidadeAtual}" aria-controls="painel-cadastro" tabindex="${chave === entidadeAtual ? 0 : -1}" data-entidade="${chave}">
      <i class="bi ${CADASTRO_UI[chave].icone}" aria-hidden="true"></i><span>${CADASTRO_UI[chave].plural}<small>${DB[chave].length} registros</small></span>
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
  const opcoes = [...new Set(DB[entidadeAtual].map(r => r[ui.filtro] || 'Não associado'))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
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
  const filtro = normalizarBusca(document.getElementById('busca-cadastro').value.trim());
  const categoria = document.getElementById('filtro-cadastro').value;
  const ordem = document.getElementById('ordem-cadastro').value;
  const dados = DB[def.chave].filter(item => (!filtro || Object.values(item).some(v => normalizarBusca(v).includes(filtro))) && (!categoria || (item[ui.filtro] || 'Não associado') === categoria));
  dados.sort((a,b) => ordem === 'recentes' ? b.id-a.id : (ordem === 'za' ? -1 : 1) * String(a.nome || a.placa).localeCompare(String(b.nome || b.placa), 'pt-BR'));
  document.getElementById('cadastro-contagem').textContent = `${dados.length} de ${DB[def.chave].length} registros`;
  document.getElementById('cabecalho-tabela-cadastro').innerHTML = `<tr>${def.colunas.map(c => `<th scope="col">${c.rotulo}</th>`).join('')}<th scope="col" class="text-end">Ações</th></tr>`;
  const corpo = document.getElementById('corpo-tabela-cadastro');
  if (!dados.length){
    corpo.innerHTML = `<tr class="cadastro-vazio"><td colspan="${def.colunas.length + 1}"><div class="vazio"><i class="bi ${filtro || categoria ? 'bi-search' : ui.icone}"></i><strong>${filtro || categoria ? 'Nenhum resultado para estes filtros' : 'Esta lista ainda está vazia'}</strong>${filtro || categoria ? 'Altere a busca ou limpe os filtros para ver outros registros.' : `Use “${ui.novo}” para adicionar o primeiro registro.`}</div></td></tr>`;
    return;
  }
  corpo.innerHTML = dados.map(item => `<tr>
    ${def.colunas.map((c, i) => {
      const valor = c.campo === 'alunos' ? DB.alunos.filter(a => a.rota === item.nome).length : item[c.campo] ?? 'Não associado';
      let html = escaparHTML(valor);
      if (i === 0) html = `<div class="cadastro-identidade"><span class="cadastro-avatar"><i class="bi ${ui.icone}" aria-hidden="true"></i></span><span><strong>${html}</strong><small>${escaparHTML(entidadeAtual === 'alunos' ? `Responsável: ${item.responsavel || 'Não informado'}` : entidadeAtual === 'veiculos' ? item.modelo : `Registro #${String(item.id).padStart(3, '0')}`)}</small></span></div>`;
      else if (['rota','turno','perfil','motorista','veiculo'].includes(c.campo)) html = `<span class="cadastro-vinculo ${valor === 'Não associado' || !valor ? 'sem-vinculo' : ''}">${html || 'Não associado'}</span>`;
      return `<td data-label="${c.rotulo}">${html}</td>`;
    }).join('')}
    <td data-label="Ações"><div class="cadastro-acoes"><button class="btn btn-sm btn-outline-primary" data-acao="editar" data-id="${item.id}" aria-label="Editar ${escaparHTML(item.nome || item.placa)}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button><button class="icone-btn" data-acao="excluir" data-id="${item.id}" aria-label="Excluir ${escaparHTML(item.nome || item.placa)}" title="Excluir registro"><i class="bi bi-trash3" aria-hidden="true"></i></button></div></td>
  </tr>`).join('');
  corpo.querySelectorAll('[data-acao]').forEach(b => b.addEventListener('click', () => {
    cadastroRetornoFoco = { id: b.dataset.id, acao: b.dataset.acao };
    if (b.dataset.acao === 'editar') abrirModalCadastro(Number(b.dataset.id));
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
  const def = ENTIDADES[entidadeAtual];
  const registro = DB[def.chave].find(i => i.id === id);
  document.getElementById('modal-titulo').textContent = `Excluir ${def.titulo.toLowerCase()}`;
  document.getElementById('modal-descricao').textContent = 'Confira o registro antes de confirmar a exclusão.';
  document.getElementById('modal-salvar').textContent = 'Excluir registro';
  const form = document.getElementById('modal-form');
  form.innerHTML = `<div class="cadastro-exclusao"><i class="bi bi-trash3"></i><strong>${escaparHTML(registro.nome || registro.placa)}</strong><p class="desc mb-0">O registro será removido desta lista de demonstração.</p></div>`;
  form.onsubmit = e => {
    e.preventDefault();
    DB[def.chave] = DB[def.chave].filter(i => i.id !== id);
    modalCadastro.hide(); montarAbasCadastro();
    mostrarToast('Registro excluído com sucesso.');
  };
  modalCadastro.show();
}

function abrirModalCadastro(id){
  const def = ENTIDADES[entidadeAtual], ui = CADASTRO_UI[entidadeAtual];
  const registro = id ? DB[def.chave].find(i => i.id === id) : {};
  document.getElementById('modal-titulo').textContent = id ? `Editar ${def.titulo.toLowerCase()}` : ui.novo;
  document.getElementById('modal-descricao').textContent = 'Preencha os dados abaixo. Os campos com * são obrigatórios.';
  document.getElementById('modal-salvar').textContent = id ? 'Salvar alterações' : 'Salvar cadastro';
  const form = document.getElementById('modal-form');
  const grupos = [def.campos.filter(c => c.tipo !== 'select'), def.campos.filter(c => c.tipo === 'select')].filter(g => g.length);
  form.innerHTML = grupos.map((campos, index) => `<fieldset class="cadastro-fieldset"><legend><span>${index + 1}</span>${ui.grupos[index]}</legend><div class="row g-3">${campos.map(c => {
    const attrs = `id="campo-${c.chave}" name="${c.chave}" ${c.obrigatorio ? 'required' : ''}`;
    let controle;
    if (c.tipo === 'select'){
      const opcoes = c.origem ? DB[c.origem].map(o => o[c.campoOrigem]) : c.opcoes;
      controle = `<select class="form-select" ${attrs}><option value="">${c.obrigatorio ? 'Selecione uma opção' : 'Sem associação'}</option>${opcoes.map(o => `<option value="${escaparHTML(o)}" ${registro[c.chave] === o ? 'selected' : ''}>${escaparHTML(o)}</option>`).join('')}</select>`;
    } else {
      const dicas = { nome: 'Digite o nome completo', matricula: 'Ex.: 2026006', turma: 'Ex.: 5º A', responsavel: 'Nome do responsável', cnh: 'Número da CNH', telefone: 'Ex.: (19) 99123-4567', placa: 'Ex.: ABC-1D23', modelo: 'Ex.: Volksbus 15.190', capacidade: 'Ex.: 32', email: 'nome@exemplo.com.br' };
      controle = `<input type="${c.chave === 'telefone' ? 'tel' : c.tipo}" class="form-control" ${attrs} value="${escaparHTML(registro[c.chave] ?? '')}" placeholder="${entidadeAtual === 'rotas' && c.chave === 'nome' ? 'Ex.: Jardim das Flores' : dicas[c.chave] || ''}" ${c.tipo === 'number' ? 'min="1" step="1"' : ''}>`;
    }
    return `<div class="${['nome','responsavel','email'].includes(c.chave) || c.tipo === 'select' ? 'col-12' : 'col-md-6'}"><label class="form-label" for="campo-${c.chave}">${c.rotulo}${c.obrigatorio ? ' <span aria-hidden="true">*</span>' : ' <small class="text-body-secondary">(opcional)</small>'}</label>${controle}</div>`;
  }).join('')}</div></fieldset>`).join('') + `<p class="cadastro-form-ajuda"><i class="bi bi-info-circle me-1"></i>${ui.ajuda}</p>`;
  form.onsubmit = e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const dados = Object.fromEntries([...new FormData(form).entries()].map(([chave, valor]) => [chave, valor.trim()]));
    const vazio = def.campos.find(c => c.obrigatorio && !dados[c.chave]);
    if (vazio){ form.elements[vazio.chave].value = ''; form.reportValidity(); return; }
    def.campos.filter(c => c.tipo === 'number').forEach(c => dados[c.chave] = Number(dados[c.chave]));
    if (id) Object.assign(registro, dados);
    else DB[def.chave].push({ id: Math.max(0, ...DB[def.chave].map(i => i.id)) + 1, ...dados });
    modalCadastro.hide(); montarAbasCadastro();
    mostrarToast(id ? 'Alterações salvas com sucesso.' : 'Cadastro realizado com sucesso.');
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
  const busca = normalizarBusca(document.getElementById('f-presenca-busca').value.trim());
  const rota = document.getElementById('f-presenca-rota').value;
  const turno = document.getElementById('f-presenca-turno').value;
  const data = document.getElementById('f-presenca-data').value;
  const status = document.getElementById('f-presenca-status').value;
  const ordem = document.getElementById('f-presenca-ordem').value;
  // A chave ISO permite comparar datas sem depender do fuso horário do navegador.
  const dataISO = valor => valor.split('/').reverse().join('-');
  const dados = DB.historicoPresencas.filter(p =>
    (!busca || normalizarBusca(p.aluno).includes(busca)) &&
    (!rota || p.rota === rota) && (!turno || p.turno.toLowerCase() === turno) &&
    (!data || dataISO(p.data) === data) && (!status || p.status === status)
  ).sort((a,b) => ordem === 'aluno' ? a.aluno.localeCompare(b.aluno, 'pt-BR') :
    (ordem === 'antigos' ? 1 : -1) * dataISO(a.data).localeCompare(dataISO(b.data)) || a.aluno.localeCompare(b.aluno, 'pt-BR'));
  const presentes = dados.filter(p => p.status === 'presente').length;
  const ausentes = dados.filter(p => p.status === 'ausente').length;
  document.getElementById('hp-total').textContent = dados.length;
  document.getElementById('hp-presentes').textContent = presentes;
  document.getElementById('hp-ausentes').textContent = ausentes;
  document.getElementById('hp-taxa').textContent = dados.length ? `${Math.round(presentes / dados.length * 100)}%` : '—';
  document.getElementById('hp-contagem').textContent = `${dados.length} de ${DB.historicoPresencas.length} registros · ${presentes} presença(s) e ${ausentes} ausência(s)`;
  const ativos = [busca, rota, turno, data, status].filter(Boolean).length;
  document.getElementById('hp-filtros-resumo').textContent = ativos ? `${ativos} filtro(s) aplicado(s)` : 'Exibindo todos os registros';
  const datas = [...new Set(dados.map(p => p.data))].sort((a,b) => dataISO(a).localeCompare(dataISO(b)));
  document.getElementById('hp-periodo').textContent = !datas.length ? 'Sem registros no período' : datas.length === 1 ? datas[0] : `${datas[0]} a ${datas[datas.length - 1]}`;
  const corpo = document.getElementById('tabela-historico-presencas');
  corpo.innerHTML = dados.map(p => `
    <tr>
      <td data-label="Aluno"><div class="cadastro-identidade"><span class="cadastro-avatar" aria-hidden="true">${escaparHTML(p.aluno.split(' ').slice(0,2).map(n => n[0]).join(''))}</span><strong>${escaparHTML(p.aluno)}</strong></div></td>
      <td data-label="Data"><time datetime="${dataISO(p.data)}">${escaparHTML(p.data)}</time></td>
      <td data-label="Rota"><span class="cadastro-vinculo">${escaparHTML(p.rota)}</span></td>
      <td data-label="Trajeto"><span class="presenca-trajeto"><i class="bi ${p.turno === 'Ida' ? 'bi-arrow-up-right' : 'bi-arrow-down-left'}" aria-hidden="true"></i>${escaparHTML(p.turno)}</span></td>
      <td data-label="Situação"><span class="badge ${p.status === 'presente' ? 'selo-presente' : 'selo-ausente'}"><i class="bi ${p.status === 'presente' ? 'bi-check-circle' : 'bi-dash-circle'} me-1" aria-hidden="true"></i>${p.status === 'presente' ? 'Presente' : 'Ausente'}</span></td>
    </tr>`).join('') || '<tr><td colspan="5"><div class="vazio"><i class="bi bi-search" aria-hidden="true"></i><strong>Nenhum registro encontrado</strong>Altere a busca ou use “Limpar filtros” para consultar outras presenças.</div></td></tr>';
}

['f-presenca-busca', 'f-presenca-rota', 'f-presenca-turno', 'f-presenca-data', 'f-presenca-status', 'f-presenca-ordem'].forEach(id => {
  document.getElementById(id)?.addEventListener(id === 'f-presenca-busca' ? 'input' : 'change', renderHistoricoPresencas);
});
document.getElementById('hp-limpar')?.addEventListener('click', () => {
  ['f-presenca-busca', 'f-presenca-rota', 'f-presenca-turno', 'f-presenca-data', 'f-presenca-status'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-presenca-ordem').value = 'recentes';
  renderHistoricoPresencas();
});

/* Relatórios: a visualização e as exportações usam o mesmo conjunto de dados gerado. */
let relatorioGerado = null;
const dataRelatorioISO = valor => valor.split('/').reverse().join('-');
const dataRelatorioBR = valor => valor.split('-').reverse().join('/');

function filtrosRelatorio(){
  return Object.fromEntries(['inicio', 'fim', 'rota', 'turno'].map(c => [c, document.getElementById(`rel-${c}`).value]));
}

function periodoExemploRelatorio(){
  const datas = DB.historicoPresencas.map(p => dataRelatorioISO(p.data)).sort();
  document.getElementById('rel-inicio').value = datas[0] || '';
  document.getElementById('rel-fim').value = datas[datas.length - 1] || '';
  document.getElementById('rel-rota').value = '';
  document.getElementById('rel-turno').value = '';
  document.getElementById('rel-fim').setCustomValidity('');
  document.getElementById('rel-dados-disponiveis').textContent = datas.length ? `Exemplo disponível de ${dataRelatorioBR(datas[0])} a ${dataRelatorioBR(datas[datas.length - 1])}.` : 'Nenhum registro de exemplo disponível.';
}

function iniciarRelatorios(){
  preencherFiltroRotas();
  periodoExemploRelatorio();
  if (DB.historicoPresencas.length) gerarRelatorio();
}

function relatorioEstaAtualizado(){
  return relatorioGerado && JSON.stringify(relatorioGerado.filtros) === JSON.stringify(filtrosRelatorio());
}

function atualizarEstadoRelatorio(){
  const atualizado = relatorioEstaAtualizado();
  document.getElementById('rel-aviso').classList.toggle('d-none', !relatorioGerado || atualizado);
  document.getElementById('rel-csv').disabled = !atualizado || !relatorioGerado.registros.length;
  document.getElementById('rel-imprimir').disabled = !atualizado || !relatorioGerado.registros.length;
}

function gerarRelatorio(){
  const filtros = filtrosRelatorio();
  const fim = document.getElementById('rel-fim');
  fim.setCustomValidity(filtros.inicio && filtros.fim && filtros.fim < filtros.inicio ? 'A data final deve ser igual ou posterior à data inicial.' : '');
  if (!document.getElementById('rel-form').reportValidity()) return;
  const registros = DB.historicoPresencas.filter(p => {
    const data = dataRelatorioISO(p.data);
    return data >= filtros.inicio && data <= filtros.fim && (!filtros.rota || p.rota === filtros.rota) && (!filtros.turno || p.turno === filtros.turno);
  }).map(p => ({ ...p })).sort((a,b) => dataRelatorioISO(b.data).localeCompare(dataRelatorioISO(a.data)) || a.aluno.localeCompare(b.aluno, 'pt-BR'));
  relatorioGerado = { filtros, registros };
  const presentes = registros.filter(p => p.status === 'presente').length;
  const ausentes = registros.filter(p => p.status === 'ausente').length;
  document.getElementById('rel-total').textContent = registros.length;
  document.getElementById('rel-presentes').textContent = presentes;
  document.getElementById('rel-ausentes').textContent = ausentes;
  document.getElementById('rel-taxa').textContent = registros.length ? `${Math.round(presentes / registros.length * 100)}%` : '—';
  document.getElementById('rel-escopo').textContent = `${dataRelatorioBR(filtros.inicio)} a ${dataRelatorioBR(filtros.fim)} · ${filtros.rota || 'Todas as rotas'} · ${filtros.turno || 'Ida e volta'}`;
  document.getElementById('rel-resultado').textContent = registros.length ? `Relatório gerado com ${registros.length} registros de demonstração.` : 'Nenhum registro para os filtros selecionados. Altere o período ou use o período de exemplo.';
  document.getElementById('rel-contagem').textContent = `${registros.length} registro(s) no relatório`;
  const rotas = [...new Set(registros.map(p => p.rota))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
  document.getElementById('rel-rotas-contagem').textContent = `${rotas.length} rota(s) com registros`;
  document.getElementById('rel-rotas').innerHTML = rotas.map(rota => {
    const dados = registros.filter(p => p.rota === rota);
    const presencas = dados.filter(p => p.status === 'presente').length;
    const taxa = Math.round(presencas / dados.length * 100);
    return `<div class="rel-rota"><div class="rel-rota-topo"><strong>${escaparHTML(rota)}</strong><span>${taxa}% de presença</span></div><div class="progress" role="progressbar" aria-label="Taxa de presença em ${escaparHTML(rota)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${taxa}"><div class="progress-bar" style="width:${taxa}%"></div></div><p>${presencas} presença(s) · ${dados.length - presencas} ausência(s) · ${dados.length} registros</p></div>`;
  }).join('') || '<p class="desc mb-0">Sem dados para comparar as rotas neste período.</p>';
  document.getElementById('rel-registros').innerHTML = registros.map(p => `<tr>
    <td data-label="Aluno"><div class="cadastro-identidade"><span class="cadastro-avatar" aria-hidden="true"><i class="bi bi-person"></i></span><strong>${escaparHTML(p.aluno)}</strong></div></td>
    <td data-label="Data"><time datetime="${dataRelatorioISO(p.data)}">${escaparHTML(p.data)}</time></td>
    <td data-label="Rota"><span class="cadastro-vinculo">${escaparHTML(p.rota)}</span></td>
    <td data-label="Trajeto">${escaparHTML(p.turno)}</td>
    <td data-label="Situação"><span class="badge ${p.status === 'presente' ? 'selo-presente' : 'selo-ausente'}">${p.status === 'presente' ? 'Presente' : 'Ausente'}</span></td>
  </tr>`).join('') || '<tr><td colspan="5"><div class="vazio"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><strong>Nenhum registro encontrado</strong>Selecione outro período ou outra rota e gere o relatório novamente.</div></td></tr>';
  atualizarEstadoRelatorio();
}

document.getElementById('rel-form')?.addEventListener('submit', e => { e.preventDefault(); gerarRelatorio(); });
['inicio', 'fim', 'rota', 'turno'].forEach(c => document.getElementById(`rel-${c}`)?.addEventListener('input', () => {
  document.getElementById('rel-fim').setCustomValidity('');
  atualizarEstadoRelatorio();
}));
document.getElementById('rel-restaurar')?.addEventListener('click', () => { periodoExemploRelatorio(); gerarRelatorio(); });

function csvRelatorio(registros){
  const celula = valor => {
    let texto = String(valor ?? '');
    // Nomes que começam com operadores devem abrir como texto na planilha.
    if (/^\s*[=+\-@]/.test(texto) || /^[\t\r\n]/.test(texto)) texto = "'" + texto;
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const linhas = [['Aluno', 'Data', 'Rota', 'Trajeto', 'Situação'], ...registros.map(p => [p.aluno, p.data, p.rota, p.turno, p.status === 'presente' ? 'Presente' : 'Ausente'])];
  return '\uFEFF' + linhas.map(linha => linha.map(celula).join(';')).join('\r\n');
}

document.getElementById('rel-csv')?.addEventListener('click', () => {
  if (!relatorioEstaAtualizado() || !relatorioGerado.registros.length) return;
  const blob = new Blob([csvRelatorio(relatorioGerado.registros)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mobilys-presencas-${relatorioGerado.filtros.inicio}-${relatorioGerado.filtros.fim}.csv`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById('rel-imprimir')?.addEventListener('click', () => {
  if (relatorioEstaAtualizado() && relatorioGerado.registros.length) window.print();
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
  document.getElementById('mv-orientacao').textContent = viagem.status === 'encerrada' ? 'Viagem encerrada. Confira os registros deste trajeto.' : viagem.status === 'em-andamento' ? 'Registre a presença de cada aluno durante o embarque.' : 'Inicie a viagem para registrar a presença dos alunos.';
  document.getElementById('mv-trajeto-titulo').textContent = viagem.turno === 'ida' ? 'Do bairro até a escola' : 'Da escola até o bairro';
  const paradas = viagem.turno === 'ida'
    ? [['Rua das Acácias, 120', '06:30 · Ana Beatriz Souza'], ['Rua das Acácias, 240', '06:35 · Pedro Henrique Lima'], ['Escola Municipal · Centro', '07:00 · Desembarque dos alunos']]
    : [['Escola Municipal · Centro', '12:15 · Embarque dos alunos'], ['Rua das Acácias, 240', '12:40 · Pedro Henrique Lima'], ['Rua das Acácias, 120', '12:45 · Ana Beatriz Souza']];
  document.getElementById('mv-itinerario').innerHTML = paradas.map(p => `<li><strong>${p[0]}</strong><small>${p[1]}</small></li>`).join('');

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
  viagem.statusPorTurno[viagem.turno] = viagem.status;
  viagem.turno = e.target.value;
  viagem.status = viagem.statusPorTurno[viagem.turno];
  renderViagem();
});
document.getElementById('busca-alunos-viagem')?.addEventListener('input', () => renderListaAlunosViagem());

function renderListaAlunosViagem(){
  document.getElementById('mv-total').textContent = viagem.alunos.length;
  document.getElementById('mv-presentes').textContent = viagem.alunos.filter(a => a[viagem.turno] === 'presente').length;
  document.getElementById('mv-pendentes').textContent = viagem.alunos.filter(a => a[viagem.turno] === null).length;
  const filtro = document.getElementById('busca-alunos-viagem').value.toLowerCase();
  const lista = document.getElementById('lista-alunos-viagem');
  const dados = viagem.alunos.filter(a => a.nome.toLowerCase().includes(filtro));
  const emAndamento = viagem.status === 'em-andamento';

  if (!dados.length){
    lista.innerHTML = `<div class="vazio"><i class="bi bi-search"></i><strong>Nenhum aluno encontrado</strong>Tente buscar por outro nome.</div>`;
    return;
  }

  lista.innerHTML = dados.map(a => {
    const val = a[viagem.turno];
    return `
    <div class="cartao-aluno">
      <div class="avatar">${a.nome.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
      <div class="info"><div class="nome">${a.nome}</div><div class="ponto">${a.ponto}</div></div>
      <div class="toggle-presenca">
        <button data-id="${a.id}" data-valor="presente" aria-label="Marcar ${a.nome} presente" aria-pressed="${val === 'presente'}" class="${val === 'presente' ? 'pres-ativo' : ''}" ${!emAndamento ? 'disabled' : ''}>Presente</button>
        <button data-id="${a.id}" data-valor="ausente" aria-label="Marcar ${a.nome} ausente" aria-pressed="${val === 'ausente'}" class="${val === 'ausente' ? 'aus-ativo' : ''}" ${!emAndamento ? 'disabled' : ''}>Ausente</button>
      </div>
    </div>`;
  }).join('');

  lista.querySelectorAll('.toggle-presenca button').forEach(btn => {
    btn.addEventListener('click', () => {
      const aluno = viagem.alunos.find(a => a.id === Number(btn.dataset.id));
      aluno[viagem.turno] = btn.dataset.valor;
      renderListaAlunosViagem();
      lista.querySelector(`[data-id="${btn.dataset.id}"][data-valor="${btn.dataset.valor}"]`)?.focus();
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
    <article class="cartao-aluno flex-wrap">
      <div class="avatar">AB</div>
      <div class="info"><div class="nome">${a.nome}</div><div class="ponto">5º A · Manhã · ${a.rota}</div></div>
      <div class="agenda-trajetos">${['ida', 'volta'].map(turno => `
        <section class="agenda-trajeto">
          <div class="d-flex align-items-center justify-content-between gap-2"><h3 class="mb-0"><i class="bi ${turno === 'ida' ? 'bi-sunrise' : 'bi-house-door'} me-1"></i>${turno === 'ida' ? 'Ida à escola' : 'Volta para casa'}</h3><span class="badge ${a[turno] === 'confirmado' ? 'selo-presente' : 'selo-ausente'}">${a[turno] === 'confirmado' ? 'Confirmado' : 'Cancelado'}</span></div>
          <p class="horario">${turno === 'ida' ? '06:30' : '12:15'}</p><p class="desc mb-0">${turno === 'ida' ? 'Saída do ponto de encontro' : 'Saída da escola'}</p>
          <div class="toggle-presenca" role="group" aria-label="Agendamento de ${turno}">
            <button data-turno="${turno}" data-valor="confirmado" data-id="${a.id}" aria-pressed="${a[turno] === 'confirmado'}" class="${a[turno] === 'confirmado' ? 'pres-ativo' : ''}"><i class="bi bi-check2"></i> Confirmar</button>
            <button data-turno="${turno}" data-valor="cancelado" data-id="${a.id}" aria-pressed="${a[turno] === 'cancelado'}" class="${a[turno] === 'cancelado' ? 'aus-ativo' : ''}">Cancelar</button>
          </div>
        </section>`).join('')}</div>
    </article>`).join('');
  lista.querySelectorAll('button[data-turno]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ag = agendamentos.find(a => a.id === Number(btn.dataset.id));
      ag[btn.dataset.turno] = btn.dataset.valor;
      renderAgendamentos();
      lista.querySelector(`[data-id="${btn.dataset.id}"][data-turno="${btn.dataset.turno}"][data-valor="${btn.dataset.valor}"]`)?.focus();
      mostrarToast(btn.dataset.valor === 'confirmado' ? 'Utilização do transporte confirmada.' : 'Utilização do transporte cancelada.');
    });
  });
}

const ETAPAS_VIAGEM = ['Aguardando', 'A caminho', 'No ponto', 'Chegou'];
let etapaAtual = 1;
function renderStatusViagem(){
  const trilha = document.getElementById('trilha-status');
  trilha.innerHTML = ETAPAS_VIAGEM.map((et, i) => `
    <div class="etapa ${i < etapaAtual ? 'feita' : ''} ${i === etapaAtual ? 'atual' : ''}" ${i === etapaAtual ? 'aria-current="step"' : ''}>
      <div class="bola">${i < etapaAtual ? '<i class="bi bi-check-lg"></i>' : ''}</div>
      <div class="rotulo-etapa">${et}</div>
    </div>`).join('');
  document.getElementById('rs-mensagem').textContent = ['Aguardando o início da viagem.', 'O ônibus está a caminho do ponto de embarque.', 'O ônibus chegou ao ponto. Prepare-se para embarcar.', 'O ônibus chegou à escola. Trajeto concluído.'][etapaAtual];
  document.getElementById('rs-status').textContent = ETAPAS_VIAGEM[etapaAtual];
  document.getElementById('rs-avancar').textContent = etapaAtual === 3 ? 'Reiniciar simulação' : 'Simular próxima etapa →';
}

document.getElementById('rs-avancar')?.addEventListener('click', () => {
  etapaAtual = (etapaAtual + 1) % ETAPAS_VIAGEM.length;
  renderStatusViagem();
});

function renderHistoricoResp(){
  const situacao = document.getElementById('rh-situacao').value;
  const turno = document.getElementById('rh-turno').value;
  const dados = historicoResp.filter(h => (!situacao || h.situacao === situacao) && (!turno || h.turno === turno));
  document.getElementById('rh-total').textContent = historicoResp.length;
  document.getElementById('rh-utilizados').textContent = historicoResp.filter(h => h.situacao === 'Utilizado').length;
  document.getElementById('rh-cancelados').textContent = historicoResp.filter(h => h.situacao === 'Cancelado').length;
  document.getElementById('rh-contagem').textContent = `${dados.length} de ${historicoResp.length} registros · Agosto de 2026`;
  const corpo = document.getElementById('tabela-historico-resp');
  corpo.innerHTML = dados.map(h => `
    <tr>
      <td>${h.data}</td><td>${h.rota}</td><td>${h.turno}</td>
      <td><span class="badge ${h.situacao === 'Utilizado' ? 'selo-presente' : 'selo-ausente'}">${h.situacao}</span></td>
    </tr>`).join('') || '<tr><td colspan="4"><div class="vazio"><i class="bi bi-search"></i><strong>Nenhuma viagem encontrada</strong>Altere os filtros para consultar outros trajetos.</div></td></tr>';
}

['rh-situacao', 'rh-turno'].forEach(id => document.getElementById(id)?.addEventListener('change', renderHistoricoResp));
document.getElementById('rh-limpar')?.addEventListener('click', () => {
  document.getElementById('rh-situacao').value = '';
  document.getElementById('rh-turno').value = '';
  renderHistoricoResp();
});
