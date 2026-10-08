const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { credenciais, sessao } = require('./http-helper.cjs');
async function main() {
  const admin = sessao();
  const { email, senha } = credenciais();
  assert.equal((await admin.request('/alunos')).status, 401);
  assert.equal((await admin.raw('/auth/login', { method: 'POST', body: new URLSearchParams({ email, password: senha }) })).status, 403);
  assert.equal((await admin.login(email, 'senha-incorreta')).status, 401);
  const entrada = await admin.login(email, senha);
  assert.equal(entrada.status, 204);
  assert.ok(entrada.headers.getSetCookie().some(c => /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c)));
  const eu = await (await admin.request('/auth/me')).json();
  assert.equal(eu.perfil, 'ADMIN');
  assert.deepEqual(Object.keys(eu).sort(), ['ativo','email','id','nome','perfil']);
  assert.equal((await admin.raw('/rotas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await admin.request('/usuarios/' + eu.id, 'DELETE')).status, 409);
  const ids = [];
  try {
    for (const perfil of ['MOTORISTA', 'RESPONSAVEL']) {
      const password = randomBytes(16).toString('hex');
      const dados = { nome: 'Conta de teste', email: `${randomBytes(8).toString('hex')}@teste.local`, senha: password, perfil };
      const criacao = await admin.request('/usuarios', 'POST', dados);
      assert.equal(criacao.status, 201);
      const criado = await criacao.json(); ids.push(criado.id);
      assert.equal(Object.hasOwn(criado, 'senhaHash'), false);
      const cliente = sessao();
      assert.equal((await cliente.login(dados.email, password)).status, 204);
      for (const recurso of ['alunos','rotas','motoristas','veiculos','usuarios']) {
        assert.equal((await cliente.request('/' + recurso)).status, 403);
        assert.equal((await cliente.request('/' + recurso, 'POST', {})).status, 403);
      }
      assert.equal((await admin.request('/usuarios/' + criado.id, 'PUT', { ...dados, senha: '', nome: 'Conta atualizada' })).status, 200);
      assert.equal((await cliente.request('/auth/me')).status, 401, 'Sessão antiga deve ser revogada após edição');
    }
    const lista = await (await admin.request('/usuarios')).json();
    assert.ok(lista.every(u => !('senha' in u) && !('senhaHash' in u) && !('senha_hash' in u)));
  } finally {
    for (const id of ids) assert.equal((await admin.request('/usuarios/' + id, 'DELETE')).status, 204);
  }
  assert.equal((await admin.request('/auth/logout', 'POST')).status, 204);
  assert.equal((await admin.request('/auth/me')).status, 401);
  console.log('OK: login, senha incorreta, CSRF, cookies, autorização dos três perfis, revogação, proteção da própria conta e logout.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
