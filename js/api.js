/* Cliente dos cadastros persistidos. Não usa localStorage como fallback. */
function criarApiMobilys(baseUrl = 'http://127.0.0.1:8080/api', fetchImpl = (...args) => fetch(...args)) {
  const db = { alunos: [], rotas: [], motoristas: [], veiculos: [], usuarios: [], responsaveis: [] };
  let csrf = null;
  const campos = {
    alunos: ['nome', 'matricula', 'turma', 'responsavel', 'rotaId', 'curso', 'periodo', 'telefone', 'usuarioId'],
    rotas: ['nome', 'turno', 'origem', 'destino', 'veiculoId', 'descricao', 'ativo'],
    motoristas: ['nome', 'cnh', 'telefone', 'usuarioId', 'cpf', 'validadeCnh'],
    veiculos: ['placa', 'modelo', 'capacidade', 'motoristaId', 'anoFabricacao', 'ativo'],
    usuarios: ['nome', 'email', 'perfil', 'senha', 'ativo'],
    responsaveis: ['usuarioId','cpf','telefone'],
  };
  async function requisitar(caminho, metodo = 'GET', dados) {
    if (metodo !== 'GET' && !csrf) csrf = await requisitar('/auth/csrf');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const resposta = await fetchImpl(baseUrl.replace(/\/$/, '') + caminho, {
        method: metodo, signal: controller.signal, cache: 'no-store', credentials: 'include',
        headers: { ...(dados ? { 'Content-Type': caminho === '/auth/login' ? 'application/x-www-form-urlencoded' : 'application/json' } : {}),
          ...(metodo !== 'GET' ? { [csrf.headerName]: csrf.token } : {}) },
        body: dados ? (caminho === '/auth/login' ? new URLSearchParams(dados).toString() : JSON.stringify(dados)) : undefined,
      });
      if (!resposta.ok) {
        const problema = await resposta.json().catch(() => ({}));
        const mensagens = {
          400: 'Confira os campos obrigatórios e os limites de tamanho.',
          401: caminho === '/auth/login' ? 'E-mail ou senha incorretos.' : 'Sua sessão expirou. Entre novamente.',
          403: 'Acesso não permitido ou sessão desatualizada. Entre novamente.',
          404: 'Registro não encontrado. Atualize a lista antes de continuar.',
          409: 'Identificador já cadastrado ou registro vinculado a outro cadastro.',
        };
        const erro = new Error(problema.detail || mensagens[resposta.status] || 'Não foi possível concluir a operação.');
        erro.status = resposta.status;
        if (resposta.status === 401 && caminho !== '/auth/login' && typeof window !== 'undefined') window.dispatchEvent(new Event('mobilys:sessao-expirada'));
        if (resposta.status === 403) csrf = null;
        throw erro;
      }
      return resposta.status === 204 ? null : await resposta.json();
    } catch (erro) {
      if (erro.name === 'AbortError' || erro instanceof TypeError) {
        throw new Error(metodo === 'GET'
          ? 'Não foi possível consultar o servidor. Confira se o backend está ligado e tente atualizar.'
          : 'Não foi possível confirmar a operação. Atualize a lista antes de tentar novamente.');
      }
      throw erro;
    } finally { clearTimeout(timer); }
  }
  function relacionar() {
    db.alunos = db.alunos.map(a => ({ ...a, rota: db.rotas.find(r => r.id === a.rotaId)?.nome || 'Rota não encontrada' }));
    db.rotas = db.rotas.map(r => ({ ...r, veiculo: db.veiculos.find(v => v.id === r.veiculoId)?.placa || 'Não associado' }));
    db.veiculos = db.veiculos.map(v => ({ ...v, motorista: db.motoristas.find(m => m.id === v.motoristaId)?.nome || 'Não associado' }));
    db.motoristas = db.motoristas.map(m => ({ ...m, usuario: db.usuarios.find(u => u.id === m.usuarioId)?.email || 'Conta não encontrada',
      veiculo: db.veiculos.filter(v => v.motoristaId === m.id).map(v => v.placa).join(', ') || 'Não associado' }));
  }
  async function atualizar() {
    const entidades = Object.keys(campos);
    const listas = await Promise.all(entidades.map(e => requisitar('/' + e)));
    if (listas.some(lista => !Array.isArray(lista))) throw new Error('Resposta inválida do servidor.');
    entidades.forEach((e, i) => db[e] = listas[i]);
    relacionar();
  }
  async function cadastro(entidade, id, dados) {
    if (!campos[entidade]) throw new Error('Cadastro indisponível na API.');
    const payload = dados && Object.fromEntries(campos[entidade].filter(c=>dados[c]!==undefined).map(c => [c,
      c.endsWith('Id') ? (dados[c] ? Number(dados[c]) : null) : c === 'ativo' ? (dados[c]===true||dados[c]==='true') : ['cpf','validadeCnh'].includes(c) ? (dados[c]||null) : ['capacidade','anoFabricacao'].includes(c) ? (dados[c]?Number(dados[c]):null) : dados[c]]));
    const resultado = await requisitar('/' + entidade + (id ? '/' + id : ''),
      dados ? (id ? 'PUT' : 'POST') : 'DELETE', payload);
    if (!dados) db[entidade] = db[entidade].filter(r => r.id !== id);
    else {
      const indice = db[entidade].findIndex(r => r.id === resultado.id);
      if (indice < 0) db[entidade].push(resultado); else db[entidade][indice] = resultado;
    }
    relacionar();
    return resultado;
  }
  async function entrar(email, password) {
    await requisitar('/auth/login', 'POST', { email, password });
    csrf = null;
    return requisitar('/auth/me');
  }
  async function sair() { await requisitar('/auth/logout', 'POST'); csrf = null; }
  return { db, atualizar, cadastro, entrar, sair, requisitar, sessao: () => requisitar('/auth/me'),
    itinerario: rotaId => requisitar(`/rotas/${rotaId}/itinerario`),
    salvarItinerario: (rotaId, dados) => requisitar(`/rotas/${rotaId}/itinerario`, 'PUT', dados) };
}
if (typeof module !== 'undefined') module.exports = { criarApiMobilys };
