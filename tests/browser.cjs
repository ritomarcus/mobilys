// Requer playwright-core e um navegador Chromium instalado.
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const arquivo = path.resolve(raiz, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!arquivo.startsWith(raiz + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' })[path.extname(arquivo)] || 'application/octet-stream');
    res.end(dados);
  });
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext();
    const erros = [];
    context.on('page', page => page.on('pageerror', e => erros.push(e.message)));
    const agenda = await context.newPage();
    const motorista = await context.newPage();
    const status = await context.newPage();
    const admin = await context.newPage();
    await agenda.goto(base + 'responsavel-agendamentos.html');
    await motorista.goto(base + 'motorista-viagem.html');
    await status.goto(base + 'responsavel-status.html');
    await admin.goto(base + 'admin-relatorios.html');
    await agenda.locator('[data-turno="ida"][data-valor="cancelado"]').click();
    await motorista.waitForFunction(() => document.getElementById('mv-total').textContent === '2');
    await agenda.reload();
    assert.equal(await agenda.locator('[data-turno="ida"][data-valor="cancelado"]').getAttribute('aria-pressed'), 'true');
    await agenda.locator('[data-turno="ida"][data-valor="confirmado"]').click();
    await motorista.waitForFunction(() => document.getElementById('mv-total').textContent === '3');
    await motorista.locator('#btn-iniciar-viagem').click();
    await agenda.waitForFunction(() => document.querySelector('[data-turno="ida"]').disabled);
    assert.equal(await agenda.locator('[data-turno="volta"][data-valor="cancelado"]').isEnabled(), true);
    await status.waitForFunction(() => document.getElementById('rs-status').textContent === 'Em viagem');
    assert.equal(await motorista.locator('[data-id="1"][data-valor="presente"]').isDisabled(), true);
    await motorista.locator('#mv-avancar-ponto').click();
    await motorista.locator('[data-id="1"][data-valor="presente"]').click();
    await status.waitForFunction(() => document.getElementById('rs-mensagem').textContent.includes('Sua presença foi registrada'));
    await admin.waitForFunction(() => !document.getElementById('rel-aviso').classList.contains('d-none'));
    assert.equal(await admin.locator('#rel-csv').isDisabled(), true);
    await admin.locator('#rel-restaurar').click();
    const hoje = await admin.evaluate(() => dadosMobilys.data);
    assert.ok((await admin.locator('#rel-registros').innerText()).includes(hoje));
    await motorista.reload();
    assert.equal(await motorista.locator('[data-id="1"][data-valor="presente"]').getAttribute('aria-pressed'), 'true');
    await agenda.goto(base + 'responsavel-historico.html');
    await agenda.locator('#rh-data').fill(hoje.split('/').reverse().join('-'));
    await agenda.locator('#rh-data').dispatchEvent('change');
    await agenda.locator('#rh-situacao').selectOption('Utilizado');
    assert.equal(await agenda.locator('#rh-total').innerText(), '1');
    await motorista.locator('#mv-turno-select').selectOption('volta');
    assert.equal(await motorista.locator('#btn-iniciar-viagem').isVisible(), true);
    // Conclui a ida, incluindo as paradas sem alunos.
    await motorista.locator('#mv-turno-select').selectOption('ida');
    await motorista.locator('#mv-avancar-ponto').click();
    for (let i = 1; i < 7; i++) {
      await motorista.locator('#mv-avancar-ponto').click();
      await motorista.waitForFunction(() => document.getElementById('mv-avancar-ponto').textContent.startsWith('Concluir'));
      const presentes = motorista.locator('[data-valor="presente"]:enabled');
      for (const botao of await presentes.all()) await botao.click();
      await motorista.locator('#mv-avancar-ponto').click();
    }
    await motorista.locator('#btn-encerrar-viagem').click();
    await status.waitForFunction(() => document.getElementById('rs-status').textContent === 'Encerrada');
    // Restauração e edição real do ponto pelo formulário.
    motorista.once('dialog', d => d.accept());
    await motorista.locator('#demo-reiniciar').click();
    await motorista.waitForFunction(() => document.getElementById('mv-status-selo').textContent === 'Não iniciada');
    await admin.goto(base + 'admin-cadastros.html');
    await admin.locator('[data-acao="editar"][data-id="1"]').click();
    await admin.locator('#campo-pontoIndice').selectOption('2');
    await admin.locator('#campo-instituicao').selectOption('UNESP');
    await admin.locator('#modal-salvar').click();
    await admin.locator('#modal-cadastro').waitFor({ state: 'hidden' });
    await agenda.goto(base + 'responsavel-agendamentos.html');
    assert.match(await agenda.locator('#ra-ponto').innerText(), /Wilson/);
    await motorista.locator('#mv-turno-select').selectOption('volta');
    assert.match(await motorista.locator('.cartao-aluno').first().innerText(), /UNESP/);
    // Abre todas as páginas em celular e verifica overflow e erros de execução.
    await agenda.setViewportSize({ width: 390, height: 844 });
    for (const pagina of ['index.html', 'admin-painel.html', 'admin-cadastros.html', 'admin-presencas.html', 'admin-relatorios.html', 'motorista-viagem.html', 'responsavel-agendamentos.html', 'responsavel-status.html', 'responsavel-historico.html']) {
      await agenda.goto(base + pagina);
      for (const width of [320, 390, 768, 1440]) {
        await agenda.setViewportSize({ width, height: 900 });
        assert.equal(await agenda.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Overflow em ' + pagina + ' a ' + width + 'px');
        if (pagina !== 'index.html') {
          const menu = width < 992 ? '#nav-inferior' : '#nav-lateral';
          assert.equal(await agenda.locator(menu + ' [aria-current="page"]').count(), 1);
          assert.equal(await agenda.locator(menu).isVisible(), true);
        }
      }
    }
    await agenda.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    if (await agenda.evaluate(() => scrollY >= 500)) {
      await agenda.locator('.voltar-topo').click();
      await agenda.waitForFunction(() => scrollY === 0 && document.activeElement.id === 'conteudo');
    }
    await agenda.setViewportSize({ width: 390, height: 844 });
    if (process.env.MOBILYS_SCREENSHOT) await agenda.screenshot({ path: process.env.MOBILYS_SCREENSHOT, fullPage: true });
    assert.deepEqual(erros, []);
    console.log('OK: fluxo integrado, nove telas em 320/390/768/1440px, navegação ativa e retorno ao topo.');
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
