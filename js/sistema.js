/* Entrada do sistema real: identidade e permissões vêm da sessão do servidor. */
const apiCadastros = criarApiMobilys(window.MOBILYS_API_URL);
let usuarioAtual = null;
const elModal = document.getElementById('modal-cadastro');
const modalCadastro = elModal ? new bootstrap.Modal(elModal) : null;
const elToast = document.getElementById('toast-mobilys');
const toastMobilys = elToast ? new bootstrap.Toast(elToast, { delay: 4500 }) : null;
const htmlSeguro = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const perfis = { ADMIN: 'Administrador', MOTORISTA: 'Motorista', RESPONSAVEL: 'Aluno/Responsável' };
const paginasIniciais = { ADMIN: 'admin-painel.html', MOTORISTA: 'motorista-viagem.html', RESPONSAVEL: 'responsavel-agendamentos.html' };
const navegacao = {
  ADMIN: [['admin-dashboard', 'Painel', 'admin-painel.html', 'bi-grid'], ['admin-cadastros', 'Cadastros', 'admin-cadastros.html', 'bi-folder'], ['admin-presencas', 'Presenças', 'admin-presencas.html', 'bi-check2-circle'], ['admin-relatorios', 'Relatórios', 'admin-relatorios.html', 'bi-bar-chart']],
  MOTORISTA: [['motorista-viagem', 'Viagens', 'motorista-viagem.html', 'bi-bus-front']],
  RESPONSAVEL: [['resp-agendamentos', 'Agenda', 'responsavel-agendamentos.html', 'bi-calendar'], ['resp-status', 'Viagem', 'responsavel-status.html', 'bi-geo-alt'], ['resp-historico', 'Histórico', 'responsavel-historico.html', 'bi-clock-history']],
};

function mostrarToast(mensagem, sucesso = true) {
  if (!toastMobilys) return;
  document.getElementById('toast-corpo').innerHTML = `<i class="bi ${sucesso ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i><span>${mensagem}</span>`;
  elToast.classList.add('text-bg-dark');
  toastMobilys.show();
}
window.addEventListener('mobilys:sessao-expirada', () => {
  if (!document.getElementById('form-login')) location.replace('index.html');
});

async function iniciarPagina(view) {
  const main = document.getElementById('conteudo');
  if (view !== 'admin-cadastros') main.innerHTML = '<p role="status">Carregando…</p>';
  try {
    usuarioAtual = await apiCadastros.sessao();
    const itens = navegacao[usuarioAtual.perfil];
    const atual = itens.find(i => i[0] === view);
    if (!atual) { location.replace(paginasIniciais[usuarioAtual.perfil]); return; }
    for (const id of ['topo-conta-nome']) { const e = document.getElementById(id); if (e) e.textContent = usuarioAtual.nome; }
    for (const id of ['topo-cargo', 'topo-conta-perfil']) { const e = document.getElementById(id); if (e) e.textContent = perfis[usuarioAtual.perfil]; }
    const titulo = document.getElementById('topo-pagina'); if (titulo) titulo.textContent = atual[1];
    const inicio = document.getElementById('topo-inicio'); if (inicio) inicio.href = paginasIniciais[usuarioAtual.perfil];
    const links = itens.map(([id, label, href, icon]) => `<a class="nav-item-mobilys ${id === view ? 'ativo' : ''}" ${id === view ? 'aria-current="page"' : ''} href="${href}"><i class="bi ${icon}"></i><span>${label}</span></a>`).join('');
    for (const id of ['nav-lateral', 'nav-inferior']) { const e = document.getElementById(id); if (e) e.innerHTML = links; }
    document.querySelectorAll('.link-sair').forEach(a => a.addEventListener('click', async e => {
      e.preventDefault();
      try { await apiCadastros.sair(); location.replace('index.html'); }
      catch (erro) { mostrarToast(htmlSeguro(erro.message), false); }
    }));
    document.documentElement.classList.remove('sessao-pendente');
    if (view === 'admin-cadastros') { montarAbasCadastro(); await carregarCadastrosApi(); }
    else { await iniciarOperacao(view); }
  } catch (erro) {
    document.documentElement.classList.remove('sessao-pendente');
    if (erro.status === 401) { location.replace('index.html'); return; }
    main.innerHTML = `<section class="card painel p-4"><h1>Não foi possível carregar</h1><p role="alert">${htmlSeguro(erro.message)}</p><button class="btn btn-primary" id="tentar-novamente">Tentar novamente</button></section>`;
    document.getElementById('tentar-novamente').onclick = () => location.reload();
  }
}

const formLogin = document.getElementById('form-login');
if (formLogin) {
  const senha = document.getElementById('in-senha');
  document.getElementById('btn-olho').onclick = e => {
    const mostrar = senha.type === 'password'; senha.type = mostrar ? 'text' : 'password';
    e.currentTarget.setAttribute('aria-pressed', String(mostrar));
    e.currentTarget.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  };
  formLogin.onsubmit = async e => {
    e.preventDefault(); if (!formLogin.reportValidity()) return;
    const botao = document.getElementById('btn-entrar');
    const aviso = document.getElementById('login-erro');
    botao.disabled = true; aviso.textContent = '';
    document.getElementById('spinner-entrar').classList.remove('d-none');
    try {
      const usuario = await apiCadastros.entrar(document.getElementById('in-email').value.trim(), senha.value);
      location.assign(paginasIniciais[usuario.perfil]);
    } catch (erro) { aviso.textContent = erro.message; }
    finally { botao.disabled = false; document.getElementById('spinner-entrar').classList.add('d-none'); }
  };
}
