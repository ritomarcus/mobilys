const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {fixtureRota11}=require('./rota11.fixture.cjs');
const {base,credenciais}=require('./http-helper.cjs');

async function main(){
  const f=await fixtureRota11(),front=new URL(base).origin+'/',errors=[];
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const pasta=path.resolve(__dirname,'../docs/evidencias/rota11');fs.mkdirSync(pasta,{recursive:true});
  const evidencias=[];
  try{
    const login=async(conta)=>{
      const context=await browser.newContext({viewport:{width:1440,height:1000}});
      await context.route('https://tile.openstreetmap.org/**',r=>r.abort());
      const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
      await p.goto(front+'index.html');await p.locator('#in-email').fill(conta.email);
      await p.locator('#in-senha').fill(conta.senha);await p.locator('#btn-entrar').click();
      await p.waitForURL(url=>!url.pathname.endsWith('index.html'));return p;
    };
    const admin=await login(credenciais()),familia=await login(f.familia),familiaB=await login(f.familiaB),motorista=await login(f.motorista);
    const capturar=async(page,nome,cenario)=>{
      await page.evaluate(async()=>{
        document.activeElement?.blur();
        window.scrollTo({top:0,behavior:'instant'});
        await document.fonts.ready;
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      });
      await page.screenshot({path:path.join(pasta,nome),fullPage:true});
      evidencias.push({arquivo:nome,cenario});
    };
    // O modelo vazio não salva dados nem inventa horários ausentes.
    const vazia=await f.api('/rotas','POST',{nome:'Modelo rota 11 '+f.a.matricula,turno:'Noite',origem:'Aguaí',destino:'IF e SENAC'},201);
    await admin.goto(front+'admin-cadastros.html');await admin.waitForFunction(()=>cadastroApiEstado==='pronto');
    await admin.locator('#aba-rotas').click();
    await admin.locator(`[data-acao="itinerario"][data-id="${vazia.id}"]`).click();
    await admin.locator('#itinerario-rota11').click();
    assert.equal(await admin.locator('[data-parada]').count(),20);
    assert.equal(await admin.locator('[data-trajeto="IDA"] [data-campo="horario"]').first().inputValue(),'18:00');
    assert.equal(await admin.locator('[data-trajeto="VOLTA"] [data-campo="horario"]').first().inputValue(),'');
    assert.equal((await f.api(`/rotas/${vazia.id}/itinerario`)).paradas.length,0);
    admin.once('dialog',d=>d.accept());await admin.locator('#modal-itinerario .modal-footer [data-bs-dismiss]').click();
    await admin.locator('#modal-itinerario').waitFor({state:'hidden'});
    await admin.locator(`[data-acao="itinerario"][data-id="${f.rota.id}"]`).click();
    await admin.locator('[data-parada]').first().waitFor();
    assert.equal(await admin.locator('#itinerario-rota11').isHidden(),true);
    await capturar(admin,'itinerario.png','Itinerário completo: horários complementares explicitamente simulados.');

    const confirmar=async(page,aluno,trajeto,destino)=>{
      await page.locator(`#agenda-destino-${aluno.id}-${trajeto}`).selectOption(String(f.ponto(trajeto,destino).id));
      await page.locator(`[data-op="agenda"][data-id="${aluno.id}"][data-trajeto="${trajeto}"][data-status="CONFIRMADO"]`).click();
      await page.waitForFunction(()=>!opOcupado);
      assert.match(await page.locator(`[data-agenda="${aluno.id}-${trajeto}"]`).innerText(),/Confirmado/);
    };
    await familia.goto(front+'responsavel-agendamentos.html');
    await confirmar(familia,f.a,'IDA','IF');await confirmar(familia,f.a,'VOLTA','Escola João Borges');
    await familia.setViewportSize({width:390,height:844});
    await capturar(familia,'agenda-celular.png','Confirmações independentes de ida e volta com destino escolhido.');
    await familiaB.goto(front+'responsavel-agendamentos.html');
    await confirmar(familiaB,f.b,'IDA','SENAC');await confirmar(familiaB,f.b,'VOLTA','Posto Major');
    const acao=async(acao,aluno,status)=>{
      const seletor=`[data-acao="${acao}"]${aluno?`[data-aluno="${aluno.id}"]`:''}${status?`[data-status="${status}"]`:''}`;
      await motorista.locator(seletor).click();await motorista.waitForFunction(()=>!opOcupado);
    };
    await motorista.locator(`[data-op="iniciar"][data-id="${f.rota.id}"][data-trajeto="IDA"]`).click();
    await motorista.locator('[data-acao="CHEGAR"]').waitFor();
    for(let ordem=1;ordem<=10;ordem++){
      await acao('CHEGAR');
      if(ordem===1)await acao('PRESENCA',f.a,'PRESENTE');
      if(ordem===8)await acao('PRESENCA',f.b,'AUSENTE');
      if(ordem===9)await acao('DESEMBARCAR',f.a);
      await acao('AVANCAR');
    }
    await acao('ENCERRAR');
    const idaId=await motorista.evaluate(()=>opViagemId);
    await motorista.locator(`[data-op="iniciar"][data-id="${f.rota.id}"][data-trajeto="VOLTA"]`).click();
    await motorista.locator('[data-acao="CHEGAR"]').waitFor();
    await acao('CHEGAR');await acao('PRESENCA',f.b,'PRESENTE');await acao('AVANCAR');
    await acao('CHEGAR');await acao('PRESENCA',f.a,'PRESENTE');await acao('AVANCAR');
    await acao('CHEGAR');
    assert.equal(await motorista.locator(`[data-acao="DESEMBARCAR"][data-aluno="${f.a.id}"]`).isDisabled(),true);
    await acao('DESEMBARCAR',f.b);await acao('AVANCAR');
    assert.match(await motorista.locator('.etapa-atual').innerText(),/Escola João Borges/);
    assert.equal(await motorista.locator('.percurso li.omitida').count(),6);
    await capturar(motorista,'volta-desktop.png','SENAC → IF → Posto Major → Escola João Borges; seis pontos omitidos.');
    const voltaId=await motorista.evaluate(()=>opViagemId);
    await familia.goto(front+'responsavel-status.html');
    await familia.locator(`[data-op="abrir"][data-id="${voltaId}"]`).click();await familia.waitForFunction(()=>!opOcupado);
    assert.equal(await familia.locator('.passageiro').count(),1);
    await capturar(familia,'acompanhamento-celular.png','Família acompanha o destino de seu aluno e as omissões, sem acesso ao outro passageiro.');
    await acao('CHEGAR');await acao('DESEMBARCAR',f.a);await acao('AVANCAR');await acao('ENCERRAR');
    const historico=await f.api(`/operacao/historico?inicio=${f.data}&fim=${f.data}`);
    const registros=historico.presencas.filter(p=>[idaId,voltaId].includes(p.viagem_id));
    assert.equal(registros.length,4);assert.equal(registros.filter(p=>p.status==='PRESENTE').length,3);
    await admin.goto(front+'admin-relatorios.html');await admin.locator('#op-busca').fill(f.rota.nome);
    assert.equal(await admin.locator('.operacao-tabela tbody tr').count(),4);
    await capturar(admin,'relatorio-desktop.png','Relatório das duas viagens: três presenças e uma ausência (75% combinado).');
    await admin.locator('#op-trajeto').selectOption('IDA');
    assert.equal(await admin.locator('.operacao-tabela tbody tr').count(),2);
    assert.match(await admin.locator('.indicadores').innerText(),/50%/);
    assert.match(await admin.locator('.operacao-tabela').innerText(),/Escola João Borges/);
    await capturar(admin,'relatorio-ida.png','Ida filtrada: uma presença, uma ausência e frequência de 50%.');
    const download=admin.waitForEvent('download');await admin.locator('[data-op="csv"]').click();
    const arquivo=await download;
    const stream=await arquivo.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
    const csv=Buffer.concat(chunks).toString('utf8');
    assert.match(csv,/"Embarque";"Destino"/);assert.equal(csv.split('\r\n').length,3);
    assert.match(csv,/"IF"/);assert.ok(!csv.includes('"VOLTA"'));
    await admin.locator('#op-trajeto').selectOption('VOLTA');
    assert.equal(await admin.locator('.operacao-tabela tbody tr').count(),2);
    assert.match(await admin.locator('.indicadores').innerText(),/100%/);
    await capturar(admin,'relatorio-volta.png','Volta filtrada: duas presenças e frequência de 100%.');
    for(const page of [familia,motorista,admin]){
      for(const width of [320,390,1440]){
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Layout em ${width}px`);
      }
    }
    assert.deepEqual(errors,[]);
    const arquivos=['js/operacao.js','js/rota11.js','css/operacao.css','backend/src/main/java/br/com/mobilys/operacao/OperacaoService.java','backend/src/main/resources/db/migration/V8__destinos_e_paradas_omitidas.sql','tests/rota11.browser.cjs'];
    const fontesSha256=Object.fromEntries(arquivos.map(nome=>[nome,createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'..',nome))).digest('hex')]));
    fs.writeFileSync(path.join(pasta,'execucao.json'),JSON.stringify({
      executadoEm:new Date().toISOString(),ambiente:'Banco isolado; Edge headless; passageiros fictícios; horários complementares simulados; GPS não compartilhado.',
      rota:f.rota.nome,viagens:{ida:idaId,volta:voltaId},resultados:{registros:4,presentes:3,ausentes:1,pontosOmitidosNaVolta:6,frequenciaIda:50,frequenciaVolta:100,frequenciaCombinada:75},fontesSha256,evidencias
    },null,2)+'\n');
    console.log('OK: rota 11 no navegador, modelo revisável, destinos, ida/volta, omissões, isolamento, relatórios, capturas e layout 320/390/1440.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
