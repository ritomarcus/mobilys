const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const {fixture}=require('./operacao.fixture.cjs');
const {base,credenciais}=require('./http-helper.cjs');
async function main(){
 const f=await fixture(),front=base.replace(/\/api\/?$/,'/');
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  const login=async c=>{const ctx=await browser.newContext();await ctx.route('https://tile.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV2kAAAAASUVORK5CYII=','base64')}));const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(front+'index.html');await p.locator('#in-email').fill(c.email);await p.locator('#in-senha').fill(c.senha);await p.locator('#btn-entrar').click();await p.waitForURL(u=>!u.pathname.endsWith('index.html'));return p;};
  const p=await login(credenciais());await p.goto(front+'admin-cadastros.html');await p.waitForFunction(()=>cadastroApiEstado==='pronto');
  const salvar=async()=>{await p.locator('#modal-salvar').click();await p.locator('#modal-cadastro').waitFor({state:'hidden'});};
  const editar=async(entidade,id)=>{await p.locator('#aba-'+entidade).click();await p.locator(`[data-acao="editar"][data-id="${id}"]`).click();};
  const pessoas=await(await f.admin.request('/responsaveis')).json(),ra=pessoas.find(r=>r.usuarioId===f.familia.id),rb=pessoas.find(r=>r.usuarioId===f.familiaB.id);
  await editar('responsaveis',ra.id);await p.locator('#campo-telefone').fill('19999990000');await salvar();
  await editar('alunos',f.a.id);await p.locator('#campo-curso').fill('Desenvolvimento de Sistemas');await p.locator('#campo-periodo').fill('Noturno');await p.locator('#campo-telefone').fill('19999990001');await salvar();
  await p.locator(`[data-acao="vinculos"][data-id="${f.a.id}"]`).click();await p.locator('#familia-resp-'+rb.id).check();await p.locator('#parentesco-'+rb.id).fill('Pai');await p.locator(`[data-ponto="${f.itinerario.paradas[1].id}"]`).check();await salvar();
  assert.equal((await(await f.admin.request(`/alunos/${f.a.id}/familia`)).json()).responsaveis.length,2);
  await editar('motoristas',f.m.id);await p.locator('#campo-validadeCnh').fill('2099-01-01');await salvar();
  await editar('veiculos',f.veiculo.id);await p.locator('#campo-anoFabricacao').fill('2021');await p.locator('#campo-ativo').selectOption('false');await salvar();
  await editar('veiculos',f.veiculo.id);assert.equal(await p.locator('#campo-ativo').inputValue(),'false');await p.locator('#campo-ativo').selectOption('true');await salvar();
  await editar('rotas',f.rota.id);await p.locator('#campo-descricao').fill('Rota do modelo aprovado');await salvar();
  await p.locator(`[data-acao="associacoes"][data-id="${f.rota.id}"]`).click();await p.locator(`[name="veiculoIds"][value="${f.veiculo.id}"]`).check();await p.locator(`[name="motoristaIds"][value="${f.m.id}"]`).check();await salvar();
  await p.locator(`[data-acao="itinerario"][data-id="${f.rota.id}"]`).click();await p.waitForFunction(()=>itinerarioAtual!==null&&!itinerarioOcupado);
  await p.locator('#it-endereco-IDA-0').fill('Rua central, 123');await p.locator('#it-lat-IDA-0').fill('-22.059');await p.locator('#it-lng-IDA-0').fill('-46.975');
  await p.locator('[data-mapa]').first().click();await p.locator('[data-mapabox]').waitFor();await p.locator('[data-mapabox]').click({position:{x:100,y:100}});
  const latitude=Number(await p.locator('#it-lat-IDA-0').inputValue());assert.ok(Number.isFinite(latitude));
  await p.locator('#itinerario-salvar').click();await p.waitForFunction(()=>document.getElementById('itinerario-status').textContent.includes('salvo com sucesso'));
  assert.equal((await(await f.admin.request(`/rotas/${f.rota.id}/itinerario`)).json()).paradas[0].latitude,latitude);
  await p.locator('#modal-itinerario .btn-close').click();await p.locator('#modal-itinerario').waitFor({state:'hidden'});
  for(const width of [320,390,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Cadastros sem overflow '+width);}
  const familia=await login(f.familiaB);await familia.locator(`#agenda-ponto-${f.a.id}-IDA`).selectOption(String(f.itinerario.paradas[1].id));await familia.locator(`[data-op="agenda"][data-id="${f.a.id}"][data-trajeto="IDA"][data-status="CONFIRMADO"]`).click();await familia.waitForFunction(()=>!opOcupado);
  const agenda=await(await f.familia.cliente.request('/operacao/agenda?data='+f.data)).json();assert.equal(agenda.find(a=>a.aluno_id===f.a.id&&a.trajeto==='IDA').parada_id,f.itinerario.paradas[1].id);
  await editar('usuarios',f.familiaB.id);await p.locator('#campo-ativo').selectOption('false');await salvar();
  await familia.reload();await familia.waitForURL('**/index.html');
  assert.deepEqual(errors,[]);console.log('OK: interface do modelo aprovado, responsáveis, parentesco, pontos, mapa, campos, inativação e responsividade.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
