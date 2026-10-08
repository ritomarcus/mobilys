const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {fixture}=require('./operacao.fixture.cjs');
const {base,credenciais}=require('./http-helper.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname;
  if(!/^\/(?:[\w-]+\.html|(?:js|css|assets)\/[^.][\w./-]*)$/.test(p)||p.includes('..')) return res.writeHead(404).end();
  fs.readFile(path.join(root,p),(error,data)=>{
    if(error)return res.writeHead(404).end();
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(p)]||'application/octet-stream');res.end(data);
  });
});
async function main(){
  const f=await fixture(),errors=[];
  assert.equal((await f.admin.request(`/rotas/${f.rota.id}/itinerario`,'PUT',{...f.itinerario,paradas:f.itinerario.paradas.map(p=>({...p,tipo:p.trajeto==='IDA'&&p.ordem===2?'AMBOS':p.tipo}))})).status,200);
  await new Promise(resolve=>server.listen(5501,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const front='http://127.0.0.1:5501/';
  try{
    const login=async(c)=>{
      const context=await browser.newContext(),p=await context.newPage();
      // Não carregar tiles públicos em testes automatizados.
      await context.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV2kAAAAASUVORK5CYII=','base64')}));
      p.on('pageerror',e=>errors.push(e.message));
      await p.route('**/js/config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.MOBILYS_API_URL=${JSON.stringify(base)};`}));
      await p.goto(front+'index.html');await p.locator('#in-email').fill(c.email);await p.locator('#in-senha').fill(c.senha);await p.locator('#btn-entrar').click();await p.waitForURL(url=>!url.pathname.endsWith('index.html'));return p;
    };
    const admin=await login(credenciais()),family=await login(f.familia),driver=await login(f.motorista);
    await admin.goto(front+'admin-cadastros.html');await admin.waitForFunction(()=>cadastroApiEstado==='pronto');
    await admin.locator('#aba-alunos').click();await admin.locator(`[data-acao="vinculos"][data-id="${f.a.id}"]`).click();
    await admin.locator('[data-responsavel]:checked').first().waitFor();
    assert.equal(await admin.locator('[data-responsavel]:checked').count(),1);
    await admin.locator('#modal-salvar').click();await admin.locator('#modal-cadastro').waitFor({state:'hidden'});
    await family.goto(front+'responsavel-agendamentos.html');
    const confirm=family.locator(`[data-op="agenda"][data-id="${f.a.id}"][data-trajeto="IDA"][data-status="CONFIRMADO"]`);
    await confirm.click();await family.waitForFunction(()=>!opOcupado);
    assert.match(await family.locator('#op-conteudo').innerText(),/Confirmado/);assert.equal(await family.locator(`[data-id="${f.b.id}"]`).count(),0);
    await family.locator(`[data-op="agenda"][data-trajeto="VOLTA"][data-status="CANCELADO"]`).click();await family.waitForFunction(()=>!opOcupado);
    await driver.locator(`[data-op="iniciar"][data-id="${f.rota.id}"][data-trajeto="IDA"]`).click();
    await driver.locator('[data-acao="CHEGAR"]').waitFor();
    const trip=await driver.evaluate(()=>opViagemId);
    await driver.evaluate(()=>{window.watchOriginal=navigator.geolocation.watchPosition.bind(navigator.geolocation);navigator.geolocation.watchPosition=(_ok,erro)=>{queueMicrotask(()=>erro({code:1}));return 123;};});
    await driver.locator('#gps-iniciar').click();await driver.waitForFunction(()=>document.getElementById('gps-aviso').textContent.includes('Permissão negada'));
    assert.equal((await(await f.admin.request(`/operacao/viagens/${trip}/localizacao`)).json()).disponivel,false);
    await driver.evaluate(()=>{navigator.geolocation.watchPosition=window.watchOriginal;});
    await driver.context().grantPermissions(['geolocation'],{origin:front});await driver.context().setGeolocation({latitude:-22.059,longitude:-46.975,accuracy:12});
    await driver.locator('#gps-iniciar').click();await driver.waitForFunction(()=>document.getElementById('gps-aviso').textContent.includes('Compartilhando'));
    await driver.locator('[data-acao="CHEGAR"]').click();await driver.waitForFunction(()=>!opOcupado);
    await driver.locator(`[data-acao="PRESENCA"][data-aluno="${f.a.id}"][data-status="PRESENTE"]`).click();await driver.waitForFunction(()=>!opOcupado);
    await family.goto(front+'responsavel-status.html');await family.locator(`[data-op="abrir"][data-id="${trip}"]`).click();await family.waitForFunction(()=>!opOcupado);
    assert.match(await family.locator('#op-detalhe').innerText(),/Presente/);
    assert.equal(await family.locator('[data-acao="PRESENCA"]').count(),0);
    assert.equal(await family.locator('#mapa-sinal').innerText(),'Sinal recente');assert.equal(await family.locator('.leaflet-container').count(),1);
    fs.mkdirSync(path.join(root,'docs/evidencias'),{recursive:true});
    await family.setViewportSize({width:390,height:844});await family.evaluate(()=>{document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'});});await family.screenshot({path:path.join(root,'docs/evidencias/acompanhamento-celular.png'),fullPage:true});
    await driver.locator('#gps-parar').click();await driver.waitForFunction(()=>gpsViagem===null);
    await driver.locator('[data-acao="AVANCAR"]').click();await driver.waitForFunction(()=>!opOcupado);
    await driver.locator('[data-acao="CHEGAR"]').click();await driver.waitForFunction(()=>!opOcupado);
    await driver.locator(`[data-acao="DESEMBARCAR"][data-aluno="${f.a.id}"]`).click();await driver.waitForFunction(()=>!opOcupado);
    assert.match(await driver.locator('#op-detalhe').innerText(),/Desembarcou/);
    await driver.setViewportSize({width:1440,height:1000});await driver.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await driver.screenshot({path:path.join(root,'docs/evidencias/viagem-desktop.png'),fullPage:true});
    await driver.locator('[data-acao="AVANCAR"]').click();await driver.waitForFunction(()=>!opOcupado);
    await driver.locator('[data-acao="ENCERRAR"]').click();await driver.waitForFunction(()=>!opOcupado);
    assert.match(await driver.locator('#op-detalhe').innerText(),/Encerrada/);
    await family.reload();await family.locator(`[data-op="abrir"][data-id="${trip}"]`).click();await family.waitForFunction(()=>!opOcupado);
    assert.match(await family.locator('#op-detalhe').innerText(),/Encerrada/);
    for(const [p,file] of [[admin,'admin-painel.html'],[admin,'admin-presencas.html'],[admin,'admin-relatorios.html'],[family,'responsavel-historico.html'],[family,'responsavel-agendamentos.html'],[family,'responsavel-status.html'],[driver,'motorista-viagem.html']]){
      await p.goto(front+file);await p.waitForFunction(()=>document.getElementById('op-aviso')?.textContent.includes('Atualizado'));
      for(const width of [320,390,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' overflow '+width);}
    }
    await admin.goto(front+'admin-relatorios.html');await admin.locator('#op-busca').fill(f.a.nome);
    await admin.waitForFunction(()=>opRelatorio!==null);await admin.locator('#op-busca').dispatchEvent('input');
    assert.equal(await admin.locator('tbody tr').count(),1);
    await admin.screenshot({path:path.join(root,'docs/evidencias/relatorio-desktop.png'),fullPage:true});
    const downloadPromise=admin.waitForEvent('download');await admin.locator('[data-op="csv"]').click();const download=await downloadPromise;
    const csv=fs.readFileSync(await download.path(),'utf8');assert.ok(csv.includes(f.a.nome));assert.ok(!csv.includes(f.b.nome));
    await admin.goto(front+'admin-painel.html');await admin.locator(`[data-op="abrir"][data-id="${trip}"]`).click();await admin.waitForFunction(()=>!opOcupado);
    await admin.locator('[data-op="auditoria"]').click();await admin.waitForFunction(()=>!opOcupado);assert.match(await admin.locator('#op-auditoria').innerText(),/PRESENCA/);
    await family.locator('.topo-usuario-btn').click();await family.locator('#abrir-senha').click();
    await family.locator('#senha-atual').fill(f.familia.senha);await family.locator('#senha-nova').fill('NovaSenhaBrowser1234');await family.locator('#senha-confirmar').fill('NovaSenhaBrowser1234');await family.locator('#salvar-senha').click();await family.waitForURL('**/index.html?senha=alterada');
    assert.deepEqual(errors,[]);console.log('OK: vínculos, agenda, viagem, presença, acompanhamento, auditoria, CSV e telas responsivas no Edge.');
  }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
