// Requer API local, Edge e CORS para http://127.0.0.1:5501.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { base: api, credenciais, sessao } = require('./http-helper.cjs');
const raiz = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!/^\/(?:[\w-]+\.html|(?:js|css|assets)\/[^.][\w./-]*)$/.test(pathname) || pathname.includes('..')) { res.writeHead(404).end(); return; }
  fs.readFile(path.join(raiz, pathname), (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[path.extname(pathname)] || 'application/octet-stream');
    res.end(data);
  });
});
async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(5501, '127.0.0.1', resolve); });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const marca = 'Teste sistema ' + Date.now();
  const ids = {};
  const admin = sessao();
  const { email, senha } = credenciais();
  try {
    assert.equal((await admin.login(email, senha)).status, 204);
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.route('**/js/config.js', route => route.fulfill({ contentType: 'text/javascript', body: `window.MOBILYS_API_URL = ${JSON.stringify(api)};` }));
    const frontend = 'http://127.0.0.1:5501/';
    await page.goto(frontend + 'admin-cadastros.html');
    await page.waitForURL('**/index.html');
    await page.locator('#in-email').fill(email);
    await page.locator('#in-senha').fill('senha-incorreta');
    await page.locator('#btn-entrar').click();
    await page.waitForFunction(() => document.getElementById('login-erro').textContent.includes('incorretos'));
    await page.locator('#in-senha').fill(senha);
    await page.locator('#btn-entrar').click();
    await page.waitForURL('**/admin-painel.html');
    await page.goto(frontend + 'admin-cadastros.html');
    await page.waitForFunction(() => cadastroApiEstado === 'pronto');
    const salvar = async () => {
      await page.locator('#modal-salvar').click();
      await page.locator('#modal-cadastro').waitFor({ state: 'hidden' });
    };
    const criar = async (entidade, campos, selecoes = {}) => {
      await page.locator('#aba-' + entidade).click();
      await page.locator('#btn-novo-cadastro').click();
      for (const [campo, valor] of Object.entries(campos)) await page.locator('#campo-' + campo).fill(String(valor));
      for (const [campo, valor] of Object.entries(selecoes)) await page.locator('#campo-' + campo).selectOption(String(valor));
      await salvar();
      const lista = await (await admin.request('/' + entidade)).json();
      const registro = lista.find(r => r.nome === marca || r.modelo === marca);
      assert.ok(registro, 'Cadastro deve persistir: ' + entidade);
      ids[entidade] = registro.id;
    };
    await criar('usuarios', { nome: marca, email: randomBytes(8).toString('hex') + '@teste.local', senha: randomBytes(16).toString('hex') }, { perfil: 'MOTORISTA' });
    await criar('motoristas', { nome: marca, cnh: String(Date.now()).slice(-11), telefone: '(19) 99999-1234' }, { usuarioId: ids.usuarios });
    await criar('veiculos', { placa: 'TST' + String(Date.now()).slice(-4), modelo: marca, capacidade: 30 }, { motoristaId: ids.motoristas });
    await criar('rotas', { nome: marca, origem: 'Aguaí', destino: 'São João', turno: 'Manhã' }, { veiculoId: ids.veiculos });
    await page.locator(`[data-acao="itinerario"][data-id="${ids.rotas}"]`).click();
    await page.waitForFunction(() => itinerarioAtual !== null && !itinerarioOcupado);
    for (const trajeto of ['IDA', 'VOLTA']) {
      await page.locator(`[data-adicionar="${trajeto}"]`).click();
      await page.locator(`#it-local-${trajeto}-0`).fill(trajeto === 'IDA' ? 'Praça central' : 'Escola');
      await page.locator(`#it-hora-${trajeto}-0`).fill(trajeto === 'IDA' ? '06:00' : '12:00');
    }
    await page.locator('#itinerario-salvar').click();
    await page.waitForFunction(() => document.getElementById('itinerario-status').textContent.includes('salvo com sucesso'));
    const percurso = await (await admin.request(`/rotas/${ids.rotas}/itinerario`)).json();
    assert.equal(percurso.paradas.length, 2);
    await page.locator('#modal-itinerario .btn-close').click();
    await page.locator('#modal-itinerario').waitFor({ state: 'hidden' });
    await page.locator(`[data-acao="itinerario"][data-id="${ids.rotas}"]`).click();
    await page.waitForFunction(() => itinerarioAtual !== null && !itinerarioOcupado);
    assert.equal(await page.locator('#it-local-IDA-0').inputValue(), 'Praça central');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.locator('#modal-itinerario .modal-content').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    }
    await page.locator('#modal-itinerario .btn-close').click();
    await page.locator('#modal-itinerario').waitFor({ state: 'hidden' });
    await criar('alunos', { nome: marca, matricula: marca, turma: 'Manhã', responsavel: 'Responsável de teste' }, { rotaId: ids.rotas });
    await page.reload();
    await page.waitForFunction(() => cadastroApiEstado === 'pronto');
    assert.match(await page.locator('#corpo-tabela-cadastro').innerText(), new RegExp(marca));
    for (const entidade of ['motoristas', 'veiculos', 'rotas', 'alunos']) {
      await page.locator('#aba-' + entidade).click();
      await page.locator(`[data-acao="editar"][data-id="${ids[entidade]}"]`).click();
      const campo = entidade === 'veiculos' ? 'modelo' : 'nome';
      await page.locator('#campo-' + campo).fill(marca + ' editado');
      await salvar();
      const lista = await (await admin.request('/' + entidade)).json();
      assert.equal(lista.find(r => r.id === ids[entidade])[campo], marca + ' editado');
    }
    for (const entidade of ['usuarios', 'motoristas', 'veiculos', 'rotas']) {
      await page.locator('#aba-' + entidade).click();
      await page.locator(`[data-acao="excluir"][data-id="${ids[entidade]}"]`).click();
      await page.locator('#modal-salvar').click();
      await page.waitForFunction(() => document.getElementById('modal-descricao').textContent.includes('vinculado'));
      assert.equal(await page.locator('#modal-cadastro').isVisible(), true);
      await page.locator('#modal-cadastro .btn-close').click();
      await page.locator('#modal-cadastro').waitFor({ state: 'hidden' });
    }
    await page.route(api + '/rotas', route => route.abort());
    await page.locator('#cadastro-atualizar').click();
    await page.waitForFunction(() => cadastroApiEstado === 'erro');
    assert.equal(await page.locator('#btn-novo-cadastro').isDisabled(), true);
    await page.unroute(api + '/rotas');
    await page.locator('#cadastro-atualizar').click();
    await page.waitForFunction(() => cadastroApiEstado === 'pronto');
    for (const entidade of ['alunos', 'rotas', 'veiculos', 'motoristas', 'usuarios']) {
      await page.locator('#aba-' + entidade).click();
      await page.locator(`[data-acao="excluir"][data-id="${ids[entidade]}"]`).click();
      await salvar();
      assert.ok(!(await (await admin.request('/' + entidade)).json()).some(r => r.id === ids[entidade]));
      delete ids[entidade];
    }
    for (const pagina of ['admin-painel.html','admin-cadastros.html','admin-presencas.html','admin-relatorios.html']) {
      await page.goto(frontend + pagina);
      await page.waitForFunction(() => !document.documentElement.classList.contains('sessao-pendente'));
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, pagina + ' overflow ' + width);
      }
      assert.equal(await page.locator('#demo-reiniciar').count(), 0);
    }
    await page.locator('.topo-usuario-btn').click();
    await page.locator('.link-sair').click();
    await page.waitForURL('**/index.html');
    await page.goto(frontend + 'admin-cadastros.html');
    await page.waitForURL('**/index.html');
    assert.deepEqual(erros, []);
    console.log('OK: login real, cinco cadastros, itinerários, vínculos, edição, exclusão protegida, persistência, rede, responsividade e logout.');
  } finally {
    for (const entidade of ['alunos','rotas','veiculos','motoristas','usuarios']) if (ids[entidade]) await admin.request('/' + entidade + '/' + ids[entidade], 'DELETE');
    await browser.close();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
