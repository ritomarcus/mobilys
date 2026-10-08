/* ==========================================================================
   MOBILYS — app.js
   Cadastros de alunos e rotas via API; demais fluxos em demonstração local.
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
const DADOS_INICIAIS = {
  alunos: [
    { id: 1, nome: 'Ana Beatriz Souza', matricula: '2026001', turma: 'Manhã', rota: 'Rota 10 — São João da Boa Vista', responsavel: 'Marcos Souza' },
    { id: 2, nome: 'Pedro Henrique Lima', matricula: '2026002', turma: 'Manhã', rota: 'Rota 10 — São João da Boa Vista', responsavel: 'Carla Lima' },
    { id: 3, nome: 'Sofia Martins', matricula: '2026003', turma: 'Noite', rota: 'Rota 11 — São João da Boa Vista', responsavel: 'João Martins' },
    { id: 4, nome: 'Lucas Andrade', matricula: '2026004', turma: 'Noite', rota: 'Rota 11 — São João da Boa Vista', responsavel: 'Renata Andrade' },
    { id: 5, nome: 'Maria Clara Ferreira', matricula: '2026005', turma: 'Manhã', rota: 'Rota 10 — São João da Boa Vista', responsavel: 'Paulo Ferreira' },
  ],
  rotas: ROTAS_BASE.map(r => ({ ...r, paradas: r.paradas.map(p => ({ ...p })), veiculo: 'Não associado', alunos: r.id === 10 ? 3 : 2 })),
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
    { aluno: 'Ana Beatriz Souza', rota: 'Rota 10 — São João da Boa Vista', turno: 'Ida', status: 'presente' },
    { aluno: 'Pedro Henrique Lima', rota: 'Rota 10 — São João da Boa Vista', turno: 'Ida', status: 'ausente' },
    { aluno: 'Sofia Martins', rota: 'Rota 11 — São João da Boa Vista', turno: 'Volta', status: 'presente' },
    { aluno: 'Lucas Andrade', rota: 'Rota 11 — São João da Boa Vista', turno: 'Ida', status: 'presente' },
    { aluno: 'Maria Clara Ferreira', rota: 'Rota 10 — São João da Boa Vista', turno: 'Volta', status: 'presente' },
  ],
  presencaSemana: [
    { dia: 'Seg', pct: 88 }, { dia: 'Ter', pct: 92 }, { dia: 'Qua', pct: 85 },
    { dia: 'Qui', pct: 94 }, { dia: 'Sex', pct: 80 }, { dia: 'Sáb', pct: 96 },
  ],
};

/* As páginas compartilham a mesma demonstração neste navegador/origem. */
const armazenamento = {
  getItem: chave => window.localStorage.getItem(chave),
  setItem: (chave, valor) => window.localStorage.setItem(chave, valor),
  removeItem: chave => window.localStorage.removeItem(chave),
};
const dadosMobilys = criarDadosMobilys(DADOS_INICIAIS, armazenamento);
const DB = dadosMobilys.db;
let viagem = { rotaId: 10, turno: 'ida' };
let agendamentos = [];
let paginaAtual = '';
let alteracaoEmCurso = false;

function sincronizarViagem(){
  const atual = dadosMobilys.viagem(viagem.rotaId, viagem.turno);
  viagem = { ...atual, alunos: atual.alunos.map(a => ({ ...a, [atual.turno]: a.status })) };
}
function atualizarAgenda(){
  const agenda = dadosMobilys.agenda(1);
  agendamentos = agenda ? [agenda] : [];
  return agenda;
}
async function executarAlteracao(acao, sucesso){
  if (alteracaoEmCurso) return false;
  alteracaoEmCurso = true;
  const executar = () => { acao(); };
  try {
    if (navigator.locks) await navigator.locks.request(dadosMobilys.chave, executar);
    else executar();
    renderPaginaAtual();
    if (sucesso) mostrarToast(sucesso);
    return true;
  } catch (erro) {
    dadosMobilys.atualizar();
    renderPaginaAtual();
    mostrarToast(escaparHTML(erro.message), false);
    return false;
  } finally { alteracaoEmCurso = false; }
}
function renderPaginaAtual(){
  atualizarAgenda();
  atualizarIdentidadeAluno();
  if (paginaAtual === 'admin-dashboard') atualizarDashboard();
  if (paginaAtual === 'admin-cadastros') montarAbasCadastro();
  if (paginaAtual === 'admin-presencas') renderHistoricoPresencas();
  if (paginaAtual === 'admin-relatorios') { preencherFiltroRotas(); atualizarEstadoRelatorio(); }
  if (paginaAtual === 'motorista-viagem') renderViagem();
  if (paginaAtual === 'resp-agendamentos') renderAgendamentos();
  if (paginaAtual === 'resp-status') renderStatusViagem();
  if (paginaAtual === 'resp-historico') renderHistoricoResp();
}
function atualizarIdentidadeAluno(){
  const aluno = DB.alunos.find(a => a.id === 1);
  const identidade = document.querySelector('.aluno-identidade');
  if (!identidade) return;
  identidade.querySelector('strong').textContent = aluno?.nome || 'Aluno não cadastrado';
  identidade.querySelector('div > span').textContent = aluno ? 'Matrícula ' + aluno.matricula + ' · ' + aluno.turma : '';
  identidade.querySelector('.aluno-rota').textContent = aluno?.rota || 'Sem rota associada';
}
window.addEventListener('storage', evento => {
  if (evento.key !== dadosMobilys.chave && evento.key !== null) return;
  if (dadosMobilys.atualizar()) renderPaginaAtual();
  else mostrarToast(dadosMobilys.erro, false);
});
atualizarAgenda();
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
    btn.setAttribute('aria-pressed', String(btn.classList.contains('ativo')));
    btn.addEventListener('click', () => {
      document.querySelectorAll('.perfil-opcao').forEach(b => {
        b.classList.remove('ativo');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('ativo');
      btn.setAttribute('aria-pressed', 'true');
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
      btnOlho.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
      btnOlho.setAttribute('aria-pressed', String(!visivel));
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
  if (lateral) lateral.insertAdjacentHTML('afterbegin', '<p class="nav-grupo-titulo">' + NOME_PERFIL[perfil] + '</p>');
  if (lateral && perfil !== 'admin') lateral.insertAdjacentHTML('afterbegin', `<div class="nav-perfil"><span class="avatar-perfil">${perfil === 'motorista' ? 'CE' : 'AB'}</span><strong>${perfil === 'motorista' ? 'Carlos Eduardo' : 'Ana Beatriz Souza'}</strong><small>${perfil === 'motorista' ? 'Motorista · Rota 10 — São João da Boa Vista' : 'Aluna de demonstração · Manhã'}</small></div>`);
}

/* Ponto de entrada de cada página interna: lê o perfil pela URL (?perfil=admin|motorista|responsavel),
   monta o cabeçalho/menu e dispara a renderização específica daquela tela. */
function iniciarPagina(viewAtual){
  paginaAtual = viewAtual;
  const perfil = PERFIL_POR_VIEW[viewAtual];

  const topoCargo = document.getElementById('topo-cargo');
  if (topoCargo) topoCargo.textContent = NOME_PERFIL[perfil];
  const pagina = document.getElementById('topo-pagina');
  if (pagina) pagina.textContent = NAV[perfil].find(item => item.view === viewAtual)?.label || 'Mobilys';
  const nomeConta = document.getElementById('topo-conta-nome');
  if (nomeConta) nomeConta.textContent = { admin: 'Equipe administrativa', motorista: 'Carlos Eduardo', responsavel: 'Marcos Souza' }[perfil];
  const perfilConta = document.getElementById('topo-conta-perfil');
  if (perfilConta) perfilConta.textContent = NOME_PERFIL[perfil];
  const inicioConta = document.getElementById('topo-inicio');
  if (inicioConta) inicioConta.href = PRIMEIRA_PAGINA[perfil];
  const marca = document.querySelector('.topo-marca');
  if (marca) marca.setAttribute('aria-label', 'Mobilys — página inicial');
  document.querySelectorAll('.link-sair').forEach(a => a.setAttribute('href', 'index.html'));

  montarNavegacao(perfil, viewAtual);
  const voltarTopo = document.createElement('button');
  voltarTopo.type = 'button';
  voltarTopo.className = 'voltar-topo';
  voltarTopo.hidden = true;
  voltarTopo.setAttribute('aria-label', 'Voltar ao início do conteúdo');
  voltarTopo.innerHTML = '<i class="bi bi-arrow-up" aria-hidden="true"></i>';
  document.body.append(voltarTopo);
  const atualizarVoltarTopo = () => { voltarTopo.hidden = window.scrollY < 500; };
  window.addEventListener('scroll', atualizarVoltarTopo, { passive: true });
  atualizarVoltarTopo();
  voltarTopo.addEventListener('click', () => {
    document.getElementById('conteudo').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  const aviso = document.createElement('div');
  aviso.className = 'demo-controles';
  aviso.innerHTML = `<span>${dadosMobilys.data} · ${viewAtual === 'admin-cadastros' ? 'Alunos e rotas salvos no servidor. Demais categorias em demonstração local.' : 'Demonstração local · Esta tela ainda não usa os cadastros do servidor.'}</span><button type="button" class="btn btn-sm btn-outline-primary" id="demo-reiniciar">Reiniciar demonstração local</button>`;
  document.getElementById('conteudo').prepend(aviso);
  document.getElementById('demo-reiniciar').addEventListener('click', async () => {
    if (!window.confirm('Apagar as alterações locais e restaurar os dados iniciais da demonstração?')) return;
    if (await executarAlteracao(() => dadosMobilys.reiniciar())) window.location.reload();
  });
  atualizarIdentidadeAluno();
  if (dadosMobilys.erro) mostrarToast(dadosMobilys.erro, false);

  if (viewAtual === 'admin-dashboard') atualizarDashboard();
  if (viewAtual === 'admin-cadastros') { montarAbasCadastro(); carregarCadastrosApi(); }
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
    elData.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  document.getElementById('d-alunos').textContent = DB.alunos.length;
  document.getElementById('d-rotas').textContent = DB.rotas.length;
  document.getElementById('d-veiculos').textContent = DB.veiculos.length;
  const registrosHoje = DB.historicoPresencas.filter(p => p.data === dadosMobilys.data);
  const presentes = registrosHoje.filter(p => p.status === 'presente').length;
  document.getElementById('d-presenca').textContent = registrosHoje.length ? Math.round(presentes / registrosHoje.length * 100) + '%' : '—';

  const corpo = document.getElementById('tabela-viagens-hoje');
  corpo.innerHTML = DB.rotas.filter(r => r.paradas?.length && r.paradasVolta?.length).flatMap(r => ['ida', 'volta'].map(turno => {
    const v = dadosMobilys.viagem(r.id, turno);
    const motorista = DB.veiculos.find(v => v.placa === r.veiculo)?.motorista || 'Não associado';
    return `
    <tr>
      <td>${escaparHTML(r.nome)}</td>
      <td>${escaparHTML(motorista)}</td>
      <td>${turno === 'ida' ? 'Ida' : 'Volta'}</td>
      <td><span class="badge selo-pendente">${{ 'nao-iniciada': 'Não iniciada', 'em-andamento': 'Em andamento', encerrada: 'Encerrada' }[v.status]}</span></td>
      <td><span class="badge selo-presente">${v.alunos.length} confirmados</span></td>
    </tr>`;
  })).join('');

  renderGraficosDashboard();
}

/* Gráficos do painel (Chart.js) — carregado apenas em admin-painel.html */
function renderGraficosDashboard(){
  DB.rotas.forEach(r => r.alunos = DB.alunos.filter(a => a.rota === r.nome).length);
  const datas = [...new Set(DB.historicoPresencas.map(p => p.data))].sort((a,b) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join(''))).slice(-7);
  const frequencia = datas.map(data => {
    const registros = DB.historicoPresencas.filter(p => p.data === data);
    return { dia: data.slice(0, 5), pct: Math.round(registros.filter(p => p.status === 'presente').length / registros.length * 100) };
  });
  document.getElementById('dados-presenca-periodo').textContent = frequencia.map(d => `${d.dia}: ${d.pct}%`).join(' · ') || 'Sem registros';
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
  ['grafico-presenca-semana', 'grafico-alunos-rota', 'grafico-presencas-rota'].forEach(id => {
    Chart.getChart(id)?.destroy();
    const canvas = document.getElementById(id);
    if (canvas) delete canvas.dataset.montado;
  });

  const canvasLinha = document.getElementById('grafico-presenca-semana');
  if (canvasLinha && !canvasLinha.dataset.montado){
    canvasLinha.dataset.montado = '1';
    new Chart(canvasLinha, {
      type: 'line',
      data: {
        labels: frequencia.map(d => d.dia),
        datasets: [{
          label: 'Presença (%)',
          data: frequencia.map(d => d.pct),
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
      { rotulo: 'Alunos', campo: 'alunos' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome da rota', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'origem', rotulo: 'Cidade de origem', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'destino', rotulo: 'Cidade de destino', tipo: 'text', obrigatorio: true, max: 150 },
      { chave: 'turno', rotulo: 'Turno', tipo: 'text', obrigatorio: true, max: 30 },
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

/* Apresentação e filtros de cada categoria. Alunos e rotas vêm da API; demais categorias usam a demonstração local. */
const CADASTRO_UI = {
  alunos: { plural: 'Alunos', novo: 'Novo aluno', icone: 'bi-mortarboard', descricao: 'Dados escolares, responsáveis e vínculos com as rotas.', filtro: 'rota', filtroNome: 'Rota', busca: 'Nome, matrícula ou responsável', ajuda: 'Cadastre uma rota antes de adicionar alunos. Selecione a rota no formulário.', grupos: ['Dados do aluno', 'Transporte escolar'] },
  rotas: { plural: 'Rotas', novo: 'Nova rota', icone: 'bi-signpost-split', descricao: 'Organize os trajetos, origens, destinos e turnos do transporte.', filtro: 'turno', filtroNome: 'Turno', busca: 'Nome da rota, origem ou destino', ajuda: 'O número de alunos é calculado a partir dos alunos associados a cada rota.', grupos: ['Identificação da rota', 'Veículo do trajeto'] },
  motoristas: { plural: 'Motoristas', novo: 'Novo motorista', icone: 'bi-person-vcard', descricao: 'Consulte os condutores, seus contatos e veículos.', filtro: 'veiculo', filtroNome: 'Veículo', busca: 'Nome, CNH, telefone ou veículo', ajuda: 'Para associar um motorista a um veículo, abra a categoria Veículos e edite o veículo desejado.', grupos: ['Dados do motorista'] },
  veiculos: { plural: 'Veículos', novo: 'Novo veículo', icone: 'bi-bus-front', descricao: 'Mantenha a frota e os motoristas associados organizados.', filtro: 'motorista', filtroNome: 'Motorista', busca: 'Placa, modelo ou motorista', ajuda: 'Associe o motorista aqui e vincule o veículo ao trajeto na categoria Rotas.', grupos: ['Dados do veículo', 'Motorista responsável'] },
  usuarios: { plural: 'Usuários', novo: 'Novo usuário', icone: 'bi-person-gear', descricao: 'Organize as pessoas e seus perfis de acesso ao sistema.', filtro: 'perfil', filtroNome: 'Perfil', busca: 'Nome, e-mail ou perfil de acesso', ajuda: 'Os perfis representam as áreas de Administrador, Motorista e Aluno/Responsável.', grupos: ['Dados do usuário', 'Perfil de acesso'] },
};
const escaparHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizarBusca = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function itinerarioRotaHTML(rota){
  return (rota.paradas || []).map(p => `<li><strong>${escaparHTML(p.horario)} · ${escaparHTML(p.local)}</strong>${p.referencia ? `<small>${escaparHTML(p.referencia)}</small>` : ''}</li>`).join('') || '<li><strong>Pontos de saída não informados</strong></li>';
}
function rotaDoAluno(){ return DB.rotas.find(r => r.id === agendamentos[0]?.rotaId); }
function pontoDoAluno(){ return rotaDoAluno()?.paradas[agendamentos[0]?.pontoIndice]; }
function renderRotaAluno(){
  const rota = rotaDoAluno();
  if (!rota) return;
  const ponto = pontoDoAluno() || { local: 'Ponto não associado', horario: '—', referencia: '' };
  const valores = {
    'ra-proxima': `Saída do seu ponto às ${ponto.horario}`,
    'ra-rota': `${rota.nome} · ${rota.turno}`,
    'ra-ponto': ponto.local,
    'ra-referencia': `${ponto.referencia} · ${rota.origem}`,
    'rs-rota': `${rota.nome} · Ida`,
    'rs-ponto': `${ponto.local} · ${ponto.horario}`,
    'rs-instituicoes': rota.instituicoes.join(' · '),
  };
  Object.entries(valores).forEach(([id, valor]) => { const el = document.getElementById(id); if (el) el.textContent = valor; });
  const itinerario = document.getElementById('ra-itinerario');
  if (itinerario) itinerario.innerHTML = itinerarioRotaHTML({ paradas: document.getElementById('ra-trajeto')?.value === 'volta' ? rota.paradasVolta : rota.paradas });
}
document.getElementById('ra-trajeto')?.addEventListener('change', renderRotaAluno);
let entidadeAtual = 'alunos';
let cadastroRetornoFoco = null;
const apiCadastros = typeof criarApiMobilys === 'function' ? criarApiMobilys(window.MOBILYS_API_URL) : null;
let cadastroApiEstado = 'carregando';
let cadastroApiErro = '';
let cadastroCarregando = false;
let cadastroSalvando = false;
const cadastroRemoto = chave => ['alunos', 'rotas'].includes(chave);
function tabelaCadastro(chave) { return cadastroRemoto(chave) ? apiCadastros.db[chave] : DB[chave]; }

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
  if (!cadastroRemoto(entidade)) {
    const ok = await executarAlteracao(() => dadosMobilys.cadastro(entidade, id, dados), mensagem);
    if (ok) modalCadastro.hide();
    return;
  }
  if (cadastroSalvando || cadastroApiEstado !== 'pronto') return;
  cadastroSalvando = true;
  const botao = document.getElementById('modal-salvar');
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Aguarde…';
  let sucesso = false;
  try {
    await apiCadastros.cadastro(entidade, id, dados);
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
  document.getElementById('cadastro-api-status').textContent = cadastroApiEstado === 'carregando' ? 'Carregando alunos e rotas…' : cadastroApiEstado === 'erro' ? cadastroApiErro : 'Alunos e rotas carregados do servidor.';
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

function detalhesRotaHTML(r){
  return `<article class="card painel mb-3"><div class="cadastro-painel-topo"><div><p class="sobretitulo">${escaparHTML(r.turno)} · ${escaparHTML(r.origem || 'Origem não informada')}</p><h2>${escaparHTML(r.nome)}</h2><p class="desc mb-0">Destino: ${escaparHTML(r.destino || 'Não informado')}</p></div><span class="badge selo-info">${r.paradas?.length || 0} pontos de saída</span></div><div class="card-body pt-0"><h3 class="bloco-titulo">Instituições atendidas</h3><p class="desc">${escaparHTML(r.instituicoes?.join(' · ') || 'Não informadas')}</p><h3 class="bloco-titulo">Locais e horários de saída em ${escaparHTML(r.origem || 'origem')}</h3><ol class="itinerario">${itinerarioRotaHTML(r)}</ol><p class="desc mt-4 mb-0">Ida transcrita do material.</p><h3 class="bloco-titulo mt-4">Volta · demonstração</h3><ol class="itinerario">${itinerarioRotaHTML({ paradas: r.paradasVolta })}</ol><p class="desc mt-3">Horários e ordem da volta são fictícios.</p><p class="desc mt-2 mb-0">${escaparHTML(r.fonte || 'Cadastro de demonstração')} · Vigência não informada.</p></div></article>`;
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
  corpo.innerHTML = dados.map(item => `<tr ${entidadeAtual === 'rotas' && item.paradas ? 'class="rota-resumo"' : ''}>
    ${def.colunas.map((c, i) => {
      const valor = c.campo === 'alunos' ? tabelaCadastro('alunos').filter(a => a.rotaId === item.id).length : item[c.campo] ?? 'Não associado';
      let html = escaparHTML(valor);
      if (i === 0) html = `<div class="cadastro-identidade"><span class="cadastro-avatar"><i class="bi ${ui.icone}" aria-hidden="true"></i></span><span><strong>${html}</strong><small>${escaparHTML(entidadeAtual === 'alunos' ? (item.responsavel ? `Responsável: ${item.responsavel}` : 'Sem responsável vinculado') : entidadeAtual === 'veiculos' ? item.modelo : `Registro #${String(item.id).padStart(3, '0')}`)}</small></span></div>`;
      else if (['rota','turno','perfil','motorista','veiculo'].includes(c.campo)) html = `<span class="cadastro-vinculo ${valor === 'Não associado' || !valor ? 'sem-vinculo' : ''}">${html || 'Não associado'}</span>`;
      if (entidadeAtual === 'rotas' && item.paradas && i === 0) html = `<button type="button" class="rota-expandir" id="rota-botao-${item.id}" aria-expanded="false" aria-controls="rota-detalhes-${item.id}">${html}<span class="rota-expandir-indicador"><span class="rota-expandir-texto">Ver itinerário</span><i class="bi bi-chevron-down" aria-hidden="true"></i></span></button>`;
      return `<td data-label="${c.rotulo}">${html}</td>`;
    }).join('')}
    <td data-label="Ações"><div class="cadastro-acoes"><button class="btn btn-sm btn-outline-primary" data-acao="editar" data-id="${item.id}" aria-label="Editar ${escaparHTML(item.nome || item.placa)}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button><button class="icone-btn" data-acao="excluir" data-id="${item.id}" aria-label="Excluir ${escaparHTML(item.nome || item.placa)}" title="Excluir registro"><i class="bi bi-trash3" aria-hidden="true"></i></button></div></td>
  </tr>${entidadeAtual === 'rotas' && item.paradas ? `<tr class="rota-expansao" id="rota-detalhes-${item.id}" hidden><td colspan="${def.colunas.length + 1}"><div role="region" aria-labelledby="rota-botao-${item.id}">${detalhesRotaHTML(item)}</div></td></tr>` : ''}`).join('');
  corpo.querySelectorAll('.rota-expandir').forEach(botao => botao.addEventListener('click', () => {
    const abrir = botao.getAttribute('aria-expanded') !== 'true';
    corpo.querySelectorAll('.rota-expandir').forEach(outro => {
      const aberto = outro === botao && abrir;
      outro.setAttribute('aria-expanded', String(aberto));
      outro.querySelector('.rota-expandir-texto').textContent = aberto ? 'Recolher itinerário' : 'Ver itinerário';
      outro.closest('tr').classList.toggle('rota-aberta', aberto);
      document.getElementById(outro.getAttribute('aria-controls')).hidden = !aberto;
    });
  }));
  corpo.querySelectorAll('.rota-resumo').forEach(linha => linha.addEventListener('click', e => {
    if (e.target.closest('button, a, input, select, label')) return;
    linha.querySelector('.rota-expandir').click();
  }));
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
  const registro = tabelaCadastro(def.chave).find(i => i.id === id);
  document.getElementById('modal-titulo').textContent = `Excluir ${def.titulo.toLowerCase()}`;
  document.getElementById('modal-descricao').textContent = 'Confira o registro antes de confirmar a exclusão.';
  document.getElementById('modal-salvar').textContent = 'Excluir registro';
  const form = document.getElementById('modal-form');
  form.innerHTML = `<div class="cadastro-exclusao"><i class="bi bi-trash3"></i><strong>${escaparHTML(registro.nome || registro.placa)}</strong><p class="desc mb-0">O registro será removido ${cadastroRemoto(def.chave) ? 'do servidor' : 'da demonstração local'}.</p></div>`;
  form.onsubmit = e => {
    e.preventDefault();
    salvarCadastro(def.chave, id, null, 'Registro excluído com sucesso.');
  };
  modalCadastro.show();
}

function abrirModalCadastro(id){
  const def = ENTIDADES[entidadeAtual], ui = CADASTRO_UI[entidadeAtual];
  const registro = id ? tabelaCadastro(def.chave).find(i => i.id === id) : {};
  document.getElementById('modal-titulo').textContent = id ? `Editar ${def.titulo.toLowerCase()}` : ui.novo;
  document.getElementById('modal-descricao').textContent = 'Preencha os dados abaixo. Os campos com * são obrigatórios.';
  document.getElementById('modal-salvar').textContent = id ? 'Salvar alterações' : 'Salvar cadastro';
  const form = document.getElementById('modal-form');
  const grupos = [def.campos.filter(c => c.tipo !== 'select'), def.campos.filter(c => c.tipo === 'select')].filter(g => g.length);
  form.innerHTML = grupos.map((campos, index) => `<fieldset class="cadastro-fieldset"><legend><span>${index + 1}</span>${ui.grupos[index]}</legend><div class="row g-3">${campos.map(c => {
    const attrs = `id="campo-${c.chave}" name="${c.chave}" ${c.obrigatorio ? 'required' : ''} ${c.max ? `maxlength="${c.max}"` : ''}`;
    let controle;
    if (c.tipo === 'select'){
      const opcoes = c.origem ? tabelaCadastro(c.origem).map(o => ({ valor: o[c.valorOrigem || c.campoOrigem], texto: o[c.campoOrigem] })) : c.opcoes.map(o => ({ valor: o, texto: o }));
      controle = `<select class="form-select" ${attrs}><option value="">${c.obrigatorio ? 'Selecione uma opção' : 'Sem associação'}</option>${opcoes.map(o => `<option value="${escaparHTML(o.valor)}" ${String(registro[c.chave]) === String(o.valor) ? 'selected' : ''}>${escaparHTML(o.texto)}</option>`).join('')}</select>`;
    } else {
      const dicas = { nome: 'Digite o nome completo', matricula: 'Ex.: 2026006', turma: 'Ex.: Manhã ou Noite', responsavel: 'Nome do responsável', cnh: 'Número da CNH', telefone: 'Ex.: (19) 99123-4567', placa: 'Ex.: ABC-1D23', modelo: 'Ex.: Volksbus 15.190', capacidade: 'Ex.: 32', email: 'nome@exemplo.com.br' };
      controle = `<input type="${c.chave === 'telefone' ? 'tel' : c.tipo}" class="form-control" ${attrs} value="${escaparHTML(registro[c.chave] ?? '')}" placeholder="${entidadeAtual === 'rotas' && c.chave === 'nome' ? 'Ex.: Rota 10 — São João da Boa Vista' : dicas[c.chave] || ''}" ${c.tipo === 'number' ? 'min="1" step="1"' : ''}>`;
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
    salvarCadastro(def.chave, id, dados, id ? 'Alterações salvas com sucesso.' : 'Cadastro realizado com sucesso.');
  };
  modalCadastro.show();
}
/* ============================================================
   ADMIN — HISTÓRICO DE PRESENÇAS e RELATÓRIOS
   ============================================================ */
function preencherFiltroRotas(){
  ['f-presenca-rota', 'rel-rota'].forEach(idSelect => {
    const sel = document.getElementById(idSelect);
    if (!sel) return;
    const anterior = sel.value;
    const nomes = [...new Set([...DB.rotas.map(r => r.nome), ...DB.historicoPresencas.map(p => p.rota)])];
    sel.innerHTML = '<option value="">Todas as rotas</option>' + nomes.map(nome => `<option value="${escaparHTML(nome)}">${escaparHTML(nome)}</option>`).join('');
    sel.value = nomes.includes(anterior) ? anterior : '';
  });
}

function horarioPresenca(registro, campo){
  if (registro.status !== 'presente') return 'Não se aplica';
  const valor = campo === 'entradaEm' ? registro.entradaEm || registro.registradoEm : registro.saidaEm;
  if (!valor) return 'Não registrado';
  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime())) return 'Não registrado';
  const data = instante.toLocaleDateString('pt-BR');
  const hora = instante.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return data === registro.data ? hora : `${data} ${hora}`;
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
    <td data-label="Entrada">${escaparHTML(horarioPresenca(p, 'entradaEm'))}</td>
    <td data-label="Saída">${escaparHTML(horarioPresenca(p, 'saidaEm'))}</td>
      <td data-label="Rota"><span class="cadastro-vinculo">${escaparHTML(p.rota)}</span></td>
      <td data-label="Trajeto"><span class="presenca-trajeto"><i class="bi ${p.turno === 'Ida' ? 'bi-arrow-up-right' : 'bi-arrow-down-left'}" aria-hidden="true"></i>${escaparHTML(p.turno)}</span></td>
      <td data-label="Situação"><span class="badge ${p.status === 'presente' ? 'selo-presente' : 'selo-ausente'}"><i class="bi ${p.status === 'presente' ? 'bi-check-circle' : 'bi-dash-circle'} me-1" aria-hidden="true"></i>${p.status === 'presente' ? 'Presente' : 'Ausente'}</span></td>
    </tr>`).join('') || '<tr><td colspan="7"><div class="vazio"><i class="bi bi-search" aria-hidden="true"></i><strong>Nenhum registro encontrado</strong>Altere a busca ou use “Limpar filtros” para consultar outras presenças.</div></td></tr>';
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
  return relatorioGerado && relatorioGerado.revisao === dadosMobilys.revisao && JSON.stringify(relatorioGerado.filtros) === JSON.stringify(filtrosRelatorio());
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
  relatorioGerado = { filtros, registros, revisao: dadosMobilys.revisao };
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
    <td data-label="Entrada">${escaparHTML(horarioPresenca(p, 'entradaEm'))}</td>
    <td data-label="Saída">${escaparHTML(horarioPresenca(p, 'saidaEm'))}</td>
    <td data-label="Rota"><span class="cadastro-vinculo">${escaparHTML(p.rota)}</span></td>
    <td data-label="Trajeto">${escaparHTML(p.turno)}</td>
    <td data-label="Situação"><span class="badge ${p.status === 'presente' ? 'selo-presente' : 'selo-ausente'}">${p.status === 'presente' ? 'Presente' : 'Ausente'}</span></td>
  </tr>`).join('') || '<tr><td colspan="7"><div class="vazio"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><strong>Nenhum registro encontrado</strong>Selecione outro período ou outra rota e gere o relatório novamente.</div></td></tr>';
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
  const linhas = [['Aluno', 'Data', 'Entrada', 'Saída', 'Rota', 'Trajeto', 'Situação'], ...registros.map(p => [p.aluno, p.data, horarioPresenca(p, 'entradaEm'), horarioPresenca(p, 'saidaEm'), p.rota, p.turno, p.status === 'presente' ? 'Presente' : 'Ausente'])];
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
  sincronizarViagem();
  const seletor = document.getElementById('mv-rota-select');
  seletor.innerHTML = DB.rotas.filter(r => r.paradas?.length && r.paradasVolta?.length).map(r => `<option value="${r.id}">${escaparHTML(r.nome)}</option>`).join('');
  seletor.value = viagem.rotaId;
  const selo = document.getElementById('mv-status-selo');
  const btnIniciar = document.getElementById('btn-iniciar-viagem');
  const btnEncerrar = document.getElementById('btn-encerrar-viagem');

  const rotulos = { 'nao-iniciada': 'Não iniciada', 'em-andamento': 'Em andamento', 'encerrada': 'Encerrada' };
  selo.textContent = rotulos[viagem.status];
  document.getElementById('mv-info').textContent = `Turno: ${viagem.turno === 'ida' ? 'Ida' : 'Volta'} · Alunos confirmados: ${viagem.alunos.length}`;

  btnIniciar.classList.toggle('d-none', viagem.status !== 'nao-iniciada');
  btnEncerrar.classList.toggle('d-none', viagem.status !== 'em-andamento');
  document.getElementById('mv-orientacao').textContent = viagem.status === 'encerrada' ? 'Viagem encerrada. Confira os registros deste trajeto.' : viagem.status === 'em-andamento' ? 'Registre a presença de cada aluno durante o embarque.' : 'Inicie a viagem para registrar a presença dos alunos.';
  const rota = viagem.rota;
  document.getElementById('mv-rota-nome').textContent = rota.nome;
  document.getElementById('mv-horarios').textContent = `${rota.turno} · Primeira saída ${rota.paradas[0].horario} · Retorno ${rota.horarioRetorno} (fictício)`;
  document.getElementById('mv-destino').textContent = viagem.turno === 'ida' ? `${rota.origem} → ${rota.destino}` : `${rota.destino} → ${rota.origem} · Retorno fictício`;
  document.getElementById('mv-trajeto-titulo').textContent = viagem.turno === 'ida' ? `Saídas em ${rota.origem}` : 'Retorno fictício para Aguaí';
  document.getElementById('mv-instituicoes').textContent = rota.instituicoes.join(' · ');
  renderListaAlunosViagem();
}

function paradasDaViagem(){
  const rota = viagem.rota;
  return viagem.turno === 'ida' ? rota.paradas : rota.paradasVolta;
}
function indicePontoAluno(a){ return a.embarqueIndice; }
function renderLinhaTempo(){
  const rota = DB.rotas.find(r => r.id === viagem.rotaId);
  const ida = viagem.turno === 'ida';
  const ativa = viagem.status === 'em-andamento';
  const paradas = paradasDaViagem(); const total = paradas.length;
  const concluida = viagem.pontoAtual >= total;
  const ponto = paradas[viagem.pontoAtual];
  const pendentes = viagem.alunos.filter(a => indicePontoAluno(a) === viagem.pontoAtual && a[viagem.turno] === null).length;
  document.getElementById('mv-itinerario').innerHTML = paradas.map((p,i) => {
    const feita = i < viagem.pontoAtual;
    const atual = ativa && i === viagem.pontoAtual;
    const emTransito = atual && !viagem.noPonto;
    const label = feita ? 'Concluído' : atual ? (viagem.noPonto ? (p.tipo === 'desembarque' ? 'Desembarcando' : 'Embarcando') : 'A caminho') : 'Aguardando';
    return `<li class="${feita ? 'concluida' : ''} ${atual ? 'atual' : ''} ${emTransito ? 'em-transito' : ''}" ${atual ? 'aria-current="step"' : ''}>${emTransito ? '<span class="timeline-onibus" role="img" aria-label="Ônibus a caminho do próximo ponto"><i class="bi bi-bus-front-fill" aria-hidden="true"></i></span>' : ''}<span class="timeline-marcador" aria-hidden="true">${feita ? '<i class="bi bi-check-lg"></i>' : atual && viagem.noPonto ? '<i class="bi bi-bus-front-fill"></i>' : i+1}</span><span class="timeline-horario">${escaparHTML(p.horario)} · Previsto</span><strong>${escaparHTML(p.local)}</strong><span class="timeline-estado">${label}</span></li>`;
  }).join('');
  document.getElementById('mv-progresso-texto').textContent = `${viagem.pontoAtual} de ${total} pontos concluídos`;
  const tracker = document.getElementById('mv-tracker');
  const etapa = `${viagem.turno}:${viagem.pontoAtual}:${viagem.noPonto}:${viagem.status}`;
  if (tracker.dataset.etapa !== etapa){
    const item = document.getElementById('mv-itinerario').children[Math.min(viagem.pontoAtual, total-1)];
    const emTransito = ativa && !concluida && !viagem.noPonto;
    tracker.scrollLeft = item ? Math.max(0, item.offsetLeft + (emTransito ? 0 : item.offsetWidth / 2) - tracker.clientWidth / 2) : 0;
    tracker.dataset.etapa = etapa;
  }
  const titulo = document.getElementById('mv-ponto-atual');
  const info = document.getElementById('mv-ponto-info');
  titulo.textContent = viagem.status === 'encerrada' ? 'Viagem encerrada' : concluida ? 'Todos os pontos concluídos' : ponto.local;
  info.textContent = viagem.status === 'nao-iniciada' ? `Primeira saída prevista: ${ponto.horario}. Inicie a viagem para acompanhar as paradas.` : viagem.status === 'encerrada' ? 'Os registros desta viagem estão disponíveis para consulta.' : concluida ? (ida ? 'Siga para as instituições atendidas e encerre a viagem ao chegar ao destino.' : 'Retorno concluído. Encerre a viagem após o último desembarque.') : !viagem.noPonto ? `Previsão ${ponto.horario} · ${ponto.referencia || 'Próximo local de embarque'}. Confirme sua chegada ao parar.` : pendentes ? `${pendentes} aluno(s) aguardando registro neste ponto. Marque presente ou ausente para continuar.` : 'Registros deste ponto concluídos. Você pode avançar para a próxima parada.';
  const botao = document.getElementById('mv-avancar-ponto');
  document.getElementById('mv-acompanhamento').textContent = concluida ? 'Resumo do percurso' : viagem.noPonto ? (ponto?.tipo === 'desembarque' ? 'Desembarque neste ponto' : 'Embarque neste ponto') : 'Próxima parada';
  botao.classList.toggle('d-none', concluida);
  botao.textContent = viagem.noPonto ? (viagem.pontoAtual === total-1 ? 'Concluir último ponto' : 'Concluir parada e avançar') : 'Cheguei ao ponto';
  botao.disabled = !ativa || concluida || (viagem.noPonto && pendentes > 0);
  document.getElementById('btn-encerrar-viagem').disabled = !concluida;
  document.getElementById('mv-filtrar-ponto').disabled = !ativa || concluida;
}

document.getElementById('mv-avancar-ponto')?.addEventListener('click', () => {
  executarAlteracao(() => dadosMobilys.agir(viagem.rotaId, viagem.turno, 'avancar'));
});
document.getElementById('mv-filtrar-ponto')?.addEventListener('change', renderListaAlunosViagem);
document.getElementById('mv-filtrar-confirmados')?.addEventListener('change', renderListaAlunosViagem);
document.getElementById('btn-iniciar-viagem')?.addEventListener('click', () => {
  executarAlteracao(() => dadosMobilys.agir(viagem.rotaId, viagem.turno, 'iniciar'), 'Viagem iniciada. Confirmações encerradas para este trajeto.');
});
document.getElementById('btn-encerrar-viagem')?.addEventListener('click', () => {
  executarAlteracao(() => dadosMobilys.agir(viagem.rotaId, viagem.turno, 'encerrar'), 'Viagem encerrada. Registros disponíveis no histórico e nos relatórios.');
});
document.getElementById('mv-turno-select')?.addEventListener('change', e => {
  viagem.turno = e.target.value;
  renderViagem();
});
document.getElementById('mv-rota-select')?.addEventListener('change', e => {
  viagem.rotaId = Number(e.target.value);
  renderViagem();
});
document.getElementById('busca-alunos-viagem')?.addEventListener('input', () => renderListaAlunosViagem());

function renderListaAlunosViagem(){
  renderLinhaTempo();
  document.getElementById('mv-total').textContent = viagem.alunos.length;
  document.getElementById('mv-presentes').textContent = viagem.alunos.filter(a => a[viagem.turno] === 'presente').length;
  document.getElementById('mv-pendentes').textContent = viagem.alunos.filter(a => a[viagem.turno] === null).length;
  const filtro = document.getElementById('busca-alunos-viagem').value.toLowerCase();
  const lista = document.getElementById('lista-alunos-viagem');
  const porPonto = document.getElementById('mv-filtrar-ponto').checked && !document.getElementById('mv-filtrar-ponto').disabled;
  const somenteConfirmados = document.getElementById('mv-filtrar-confirmados').checked;
  const cancelados = somenteConfirmados ? [] : DB.alunos.filter(a =>
    a.rota === viagem.rota.nome && dadosMobilys.agenda(a.id)?.[viagem.turno] === 'cancelado'
  ).map(a => ({
    ...a, cancelado: true,
    embarqueIndice: viagem.turno === 'ida' ? Number(a.pontoIndice) : viagem.rota.paradasVolta.findIndex(p => p.local === a.instituicao && p.tipo === 'embarque'),
    ponto: viagem.turno === 'ida' ? viagem.rota.paradas[a.pontoIndice]?.local : a.instituicao,
  }));
  const dados = [...viagem.alunos, ...cancelados].filter(a => a.nome.toLowerCase().includes(filtro) && (!porPonto || indicePontoAluno(a) === viagem.pontoAtual));
  const emAndamento = viagem.status === 'em-andamento';

  if (!dados.length){
    lista.innerHTML = `<div class="vazio"><i class="bi bi-search"></i><strong>Nenhum aluno encontrado</strong>${porPonto ? 'Não há alunos para estes filtros no ponto atual. Você pode consultar a lista completa.' : 'Tente buscar por outro nome.'}</div>`;
    return;
  }

  lista.innerHTML = dados.map(a => {
    const val = a[viagem.turno];
    const podeRegistrar = emAndamento && viagem.noPonto && indicePontoAluno(a) === viagem.pontoAtual;
    return `
    <div class="cartao-aluno">
      <div class="avatar">${a.nome.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
      <div class="info"><div class="nome">${escaparHTML(a.nome)}</div><div class="ponto">${escaparHTML(a.ponto || 'Ponto não associado')}</div></div>
      ${a.cancelado ? '<span class="badge selo-ausente">Agendamento cancelado</span>' : `<div class="toggle-presenca">
        <button data-id="${a.id}" data-valor="presente" aria-label="Marcar ${escaparHTML(a.nome)} presente" aria-pressed="${val === 'presente'}" class="${val === 'presente' ? 'pres-ativo' : ''}" ${!podeRegistrar ? 'disabled' : ''}>Presente</button>
        <button data-id="${a.id}" data-valor="ausente" aria-label="Marcar ${escaparHTML(a.nome)} ausente" aria-pressed="${val === 'ausente'}" class="${val === 'ausente' ? 'aus-ativo' : ''}" ${!podeRegistrar ? 'disabled' : ''}>Ausente</button>
      </div>`}
    </div>`;
  }).join('');

  lista.querySelectorAll('.toggle-presenca button').forEach(btn => {
    btn.addEventListener('click', () => {
      const aluno = viagem.alunos.find(a => a.id === Number(btn.dataset.id));
      executarAlteracao(() => dadosMobilys.agir(viagem.rotaId, viagem.turno, 'presenca', aluno.id, btn.dataset.valor), 'Presença salva no histórico.').then(() => {
        lista.querySelector(`[data-id="${btn.dataset.id}"][data-valor="${btn.dataset.valor}"]`)?.focus();
      });
    });
  });
}

/* ============================================================
   ALUNO/RESPONSÁVEL — AGENDAMENTOS, STATUS E HISTÓRICO
   ============================================================ */
function renderAgendamentos(){
  atualizarAgenda();
  document.querySelector('.faixa-viagem').hidden = !agendamentos.length;
  document.getElementById('ra-ponto').closest('aside').hidden = !agendamentos.length;
  if (!agendamentos.length) {
    document.getElementById('lista-agendamentos').innerHTML = '<div class="vazio"><strong>Nenhuma viagem disponível</strong>Solicite a associação do aluno a uma rota com itinerário.</div>';
    document.getElementById('ra-resumo').textContent = 'Sem agendamento';
    return;
  }
  renderRotaAluno();
  const confirmados = ['ida', 'volta'].filter(t => agendamentos[0][t] === 'confirmado').length;
  document.getElementById('ra-resumo').textContent = `${confirmados} de 2 trajetos confirmados para hoje`;
  const lista = document.getElementById('lista-agendamentos');
  lista.innerHTML = agendamentos.map(a => `
    <article class="cartao-aluno flex-wrap">
      <div class="avatar">AB</div>
      <div class="info"><div class="nome">${escaparHTML(a.nome)}</div><div class="ponto">${escaparHTML(a.turma)} · ${escaparHTML(a.rota)}</div></div>
      <div class="agenda-trajetos">${['ida', 'volta'].map(turno => `
        <section class="agenda-trajeto">
          <div class="d-flex align-items-center justify-content-between gap-2"><h3 class="mb-0"><i class="bi ${turno === 'ida' ? 'bi-sunrise' : 'bi-house-door'} me-1"></i>${turno === 'ida' ? 'Ida à instituição' : 'Volta para casa'}</h3><span class="badge ${a[turno] === 'confirmado' ? 'selo-presente' : 'selo-ausente'}">${a[turno] === 'confirmado' ? 'Confirmado' : 'Cancelado'}</span></div>
          <p class="horario">${turno === 'ida' ? pontoDoAluno()?.horario || '—' : rotaDoAluno().paradasVolta.find(p => p.local === a.instituicao)?.horario || '—'}</p><p class="desc mb-0">${turno === 'ida' ? 'Saída do ponto de encontro' : 'Retorno fictício · ' + escaparHTML(a.instituicao || 'Instituição não associada')}</p>
          ${a[turno + 'Bloqueado'] ? '<p class="desc mt-2">Confirmações encerradas: este trajeto já foi iniciado.</p>' : ''}
          <div class="toggle-presenca" role="group" aria-label="Agendamento de ${turno}">
            <button data-turno="${turno}" data-valor="confirmado" data-id="${a.id}" aria-pressed="${a[turno] === 'confirmado'}" class="${a[turno] === 'confirmado' ? 'pres-ativo' : ''}"><i class="bi bi-check2"></i> Confirmar</button>
            <button data-turno="${turno}" data-valor="cancelado" data-id="${a.id}" aria-pressed="${a[turno] === 'cancelado'}" class="${a[turno] === 'cancelado' ? 'aus-ativo' : ''}">Cancelar</button>
          </div>
        </section>`).join('')}</div>
    </article>`).join('');
  lista.querySelectorAll('button[data-turno]').forEach(btn => {
    btn.disabled = !!agendamentos[0][btn.dataset.turno + 'Bloqueado'];
    btn.addEventListener('click', () => {
      const ag = agendamentos.find(a => a.id === Number(btn.dataset.id));
      executarAlteracao(() => dadosMobilys.confirmar(ag.id, btn.dataset.turno, btn.dataset.valor), btn.dataset.valor === 'confirmado' ? 'Utilização confirmada.' : 'Utilização cancelada.').then(() => {
        lista.querySelector(`[data-id="${btn.dataset.id}"][data-turno="${btn.dataset.turno}"][data-valor="${btn.dataset.valor}"]`)?.focus();
      });
    });
  });
}

const ETAPAS_VIAGEM = ['Aguardando', 'Em viagem', 'Na parada', 'Encerrada'];
function renderStatusViagem(){
  atualizarAgenda();
  const turno = document.getElementById('rs-turno').value;
  const a = agendamentos[0];
  const painel = document.getElementById('rs-conteudo');
  painel.hidden = !a;
  document.getElementById('rs-sem-viagem').hidden = !!a;
  if (!a) return;
  renderRotaAluno();
  const v = dadosMobilys.viagem(a.rotaId, turno);
  const rota = v.rota;
  const volta = turno === 'volta';
  const paradas = volta ? rota.paradasVolta : rota.paradas;
  const ponto = paradas[v.pontoAtual];
  const etapa = v.status === 'encerrada' ? 3 : v.status === 'nao-iniciada' ? 0 : v.noPonto ? 2 : 1;
  document.getElementById('rs-rota').textContent = rota.nome + ' · ' + (volta ? 'Volta' : 'Ida');
  document.getElementById('rs-ponto').textContent = volta ? 'Desembarque em ' + (pontoDoAluno()?.local || 'ponto não associado') : 'Embarque em ' + (pontoDoAluno()?.local || 'ponto não associado');
  document.getElementById('rs-origem-mapa').textContent = volta ? 'Instituição' : 'Aguaí';
  document.getElementById('rs-destino-mapa').textContent = volta ? 'Aguaí' : 'Destino';
  document.getElementById('rs-chegada').textContent = volta ? rota.horarioChegada : 'Não informado';
  document.getElementById('rs-chegada-nota').textContent = volta ? 'Horário fictício para o último desembarque em Aguaí.' : 'O material informa apenas as saídas de Aguaí.';
  document.getElementById('trilha-status').innerHTML = ETAPAS_VIAGEM.map((et, i) => '<div class="etapa ' + (i === etapa ? 'atual' : '') + '" ' + (i === etapa ? 'aria-current="step"' : '') + '><div class="bola"></div><div class="rotulo-etapa">' + et + '</div></div>').join('');
  const aluno = v.alunos.find(al => al.id === a.id);
  const registro = aluno?.status === 'presente' ? 'Sua presença foi registrada.' : aluno?.status === 'ausente' ? 'Sua ausência foi registrada.' : a[turno] === 'cancelado' ? 'Você cancelou a utilização deste trajeto.' : 'Sua presença ainda não foi registrada.';
  const mensagem = etapa === 0 ? 'Aguardando o motorista iniciar a viagem.' : etapa === 3 ? 'Viagem encerrada pelo motorista.' : ponto ? (v.noPonto ? 'Ônibus na parada: ' : 'Ônibus a caminho de: ') + ponto.local + '.' : 'Paradas concluídas. Aguardando o motorista encerrar a viagem.';
  document.getElementById('rs-mensagem').textContent = mensagem + ' ' + registro;
  document.getElementById('rs-aluno-situacao').textContent = registro;
  document.getElementById('rs-parada-atual').textContent = etapa === 0 ? 'Aguardando sa?da' : etapa === 3 ? 'Percurso encerrado' : ponto ? (v.noPonto ? 'Na parada · ' : 'A caminho · ') + ponto.local : 'Todas as paradas concluídas';
  document.getElementById('rs-status').textContent = ETAPAS_VIAGEM[etapa];
}
document.getElementById('rs-turno')?.addEventListener('change', renderStatusViagem);
function renderHistoricoResp(){
  const historicoResp = dadosMobilys.historico(1);
  const situacao = document.getElementById('rh-situacao').value;
  const turno = document.getElementById('rh-turno').value;
  const data = document.getElementById('rh-data').value;
  const dados = historicoResp.filter(h => (!situacao || h.situacao === situacao) && (!turno || h.turno === turno) && (!data || h.data.split('/').reverse().join('-') === data));
  const ordem = document.getElementById('rh-ordem').value;
  dados.sort((a, b) => (ordem === 'antigos' ? 1 : -1) * a.data.split('/').reverse().join('-').localeCompare(b.data.split('/').reverse().join('-')));
  document.getElementById('rh-total').textContent = dados.length;
  document.getElementById('rh-utilizados').textContent = dados.filter(h => h.situacao === 'Utilizado').length;
  document.getElementById('rh-cancelados').textContent = dados.filter(h => h.situacao === 'Cancelado').length;
  document.getElementById('rh-contagem').textContent = `${dados.length} de ${historicoResp.length} registros · Confirmação não equivale a presença`;
  const corpo = document.getElementById('tabela-historico-resp');
  corpo.innerHTML = dados.map(h => `
    <tr>
      <td data-label="Data">${escaparHTML(h.data)}</td>
      <td data-label="Entrada">${escaparHTML(h.situacao === 'Aguardando registro' ? 'Não registrado' : horarioPresenca(h, 'entradaEm'))}</td>
      <td data-label="Saída">${escaparHTML(h.situacao === 'Aguardando registro' ? 'Não registrado' : horarioPresenca(h, 'saidaEm'))}</td>
      <td data-label="Rota">${escaparHTML(h.rota)}</td><td data-label="Trajeto">${escaparHTML(h.turno)}</td>
      <td data-label="Situação"><span class="badge ${h.situacao === 'Utilizado' ? 'selo-presente' : h.situacao === 'Aguardando registro' ? 'selo-pendente' : 'selo-ausente'}">${h.situacao}</span></td>
    </tr>`).join('') || '<tr><td colspan="6"><div class="vazio"><i class="bi bi-search"></i><strong>Nenhuma viagem encontrada</strong>Altere os filtros para consultar outros trajetos.</div></td></tr>';
}

['rh-situacao', 'rh-turno', 'rh-data', 'rh-ordem'].forEach(id => document.getElementById(id)?.addEventListener('change', renderHistoricoResp));
document.getElementById('rh-limpar')?.addEventListener('click', () => {
  document.getElementById('rh-data').value = '';
  document.getElementById('rh-situacao').value = '';
  document.getElementById('rh-turno').value = '';
  renderHistoricoResp();
});
