const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { credenciais, base } = require('./http-helper.cjs');
async function main() {
  const browser = await chromium.launch({ headless:true });
  try {
    const page = await browser.newPage({ viewport:{ width:1440, height:1000 } });
    const erros=[]; page.on('pageerror',e=>erros.push(e.message));
    const origem=new URL(base).origin;
    await page.goto(origem+'/index.html');
    const c=credenciais();
    await page.locator('#in-email').fill(c.email);
    await page.locator('#in-senha').fill(c.senha);
    await page.locator('#btn-entrar').click();
    await page.waitForURL('**/admin-painel.html');
    await page.locator('.op-grafico').first().waitFor();
    assert.equal(await page.locator('.op-grafico').count(),3);
    await page.goto(origem+'/admin-relatorios.html');
    await page.locator('.op-grafico').first().waitFor();
    await page.locator('#op-inicio').fill('2026-10-20');
    await page.locator('#op-fim').fill('2026-10-20');
    await page.locator('#op-filtros button').click();
    await page.waitForFunction(()=>!opCarregando);
    await page.locator('#op-busca').fill('histórico simulado');
    assert.equal(await page.locator('.op-grafico').count(),3);
    assert.match(await page.locator('.op-grafico').first().innerHTML(),/75%/);
    await page.locator('#op-trajeto').selectOption('IDA');
    assert.match(await page.locator('.op-grafico').first().innerHTML(),/50%/);
    await page.locator('#op-trajeto').selectOption('VOLTA');
    assert.match(await page.locator('.op-grafico').first().innerHTML(),/100%/);
    await page.locator('#op-trajeto').selectOption('');
    await page.screenshot({path:'backend/target/relatorios-graficos-desktop.png',fullPage:true});
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Transbordamento em ${width}px`);
    }
    await page.screenshot({path:'backend/target/relatorios-graficos-celular.png',fullPage:true});
    await page.emulateMedia({media:'print'});
    assert.ok(await page.locator('.op-grafico').first().isVisible());
    await page.emulateMedia({media:'screen'});
    await page.locator('#op-busca').fill('nenhuma-rota-corresponde');
    assert.equal(await page.locator('.op-grafico').count(),0);
    assert.match(await page.locator('.op-graficos-vazios').innerText(),/Nenhum registro/);
    assert.deepEqual(erros,[]);
    console.log('OK: painel, relatórios, filtros 75/50/100%, vazio, impressão e telas 1440/390/320px.');
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
