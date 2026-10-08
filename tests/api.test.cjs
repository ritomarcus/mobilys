const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarApiMobilys } = require('../js/api.js');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const criarCliente = (base, impl) => criarApiMobilys(base, (url, opts) => url.endsWith('/auth/csrf') ? json({ headerName: 'X-CSRF-TOKEN', token: 'token-teste' }) : impl(url, opts));

test('carga une alunos e rotas por ID e não publica carga parcial', async () => {
  let falhar = false;
  const api = criarCliente('/api', async url => {
    if (!url.endsWith('/rotas') && !url.endsWith('/alunos')) return json([]);
    if (url.endsWith('/rotas')) return json([{ id: 10, nome: falhar ? 'Alterada' : 'Rota A' }]);
    if (falhar) throw new TypeError('offline');
    return json([{ id: 1, nome: 'Ana', rotaId: 10 }]);
  });
  await api.atualizar();
  assert.equal(api.db.alunos[0].rota, 'Rota A');
  falhar = true;
  await assert.rejects(api.atualizar(), /consultar o servidor/);
  assert.equal(api.db.rotas[0].nome, 'Rota A');
});

test('envia somente campos da API e rotaId numérico; aceita DELETE sem corpo', async () => {
  const chamadas = [];
  const api = criarCliente('/api/', async (url, options) => {
    chamadas.push({ url, ...options });
    return options.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ id: 7, ...JSON.parse(options.body) }, 201);
  });
  await api.cadastro('alunos', null, { nome: 'Ana', matricula: '001', turma: 'Manhã', responsavel: 'Maria', rotaId: '10', rota: 'Texto antigo', pontoIndice: 4 });
  assert.deepEqual(JSON.parse(chamadas[0].body), { nome: 'Ana', matricula: '001', turma: 'Manhã', responsavel: 'Maria', rotaId: 10 });
  assert.equal(chamadas[0].url, '/api/alunos');
  assert.equal(chamadas[0].credentials, 'include');
  assert.equal(chamadas[0].headers['X-CSRF-TOKEN'], 'token-teste');
  await api.cadastro('alunos', 7, null);
  assert.equal(api.db.alunos.length, 0);
  assert.equal(chamadas[1].method, 'DELETE');
});

test('conflito não remove registro e falha de rede não confirma gravação', async () => {
  let offline = false;
  const api = criarCliente('/api', async () => {
    if (offline) throw new TypeError('offline');
    return json({}, 409);
  });
  api.db.rotas.push({ id: 1, nome: 'Rota A' });
  await assert.rejects(api.cadastro('rotas', 1, null), /vinculado/);
  assert.equal(api.db.rotas.length, 1);
  offline = true;
  await assert.rejects(api.cadastro('rotas', 1, { nome: 'Rota B' }), /Atualize a lista/);
  assert.equal(api.db.rotas[0].nome, 'Rota A');
});

test('renomear rota atualiza a apresentação dos alunos sem mudar o vínculo', async () => {
  const api = criarCliente('/api', async () => json({ id: 10, nome: 'Novo nome' }));
  api.db.rotas.push({ id: 10, nome: 'Nome antigo' });
  api.db.alunos.push({ id: 1, rotaId: 10, rota: 'Nome antigo' });
  await api.cadastro('rotas', 10, { nome: 'Novo nome', turno: 'Manhã', origem: 'A', destino: 'B' });
  assert.equal(api.db.alunos[0].rota, 'Novo nome');
  assert.equal(api.db.alunos[0].rotaId, 10);
});
