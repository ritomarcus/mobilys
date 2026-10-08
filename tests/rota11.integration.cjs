const assert=require('node:assert/strict');
const {fixtureRota11}=require('./rota11.fixture.cjs');

async function main(){
  const f=await fixtureRota11(),{admin,motorista,familia,familiaB,a,b,rota}=f;
  const request=async(client,path,method,body,expected=200)=>{
    const r=await client.request(path,method,body);
    assert.equal(r.status,expected,`${method} ${path}: ${r.status===expected?'':await r.text()}`);
    return expected===200? r.json():null;
  };
  const idaEscola=f.ponto('IDA','Escola João Borges'),voltaIF=f.ponto('VOLTA','IF');
  await f.agendar(familia.cliente,a,'IDA','Escola João Borges',null,'CONFIRMADO',409);
  await request(familia.cliente,'/operacao/agenda','PUT',{alunoId:a.id,data:f.data,trajeto:'IDA',status:'CONFIRMADO',paradaId:idaEscola.id,destinoId:voltaIF.id},400);
  await request(familia.cliente,'/operacao/agenda','PUT',{alunoId:a.id,data:f.data,trajeto:'IDA',status:'CONFIRMADO',paradaId:idaEscola.id,destinoId:idaEscola.id},400);
  await f.agendar(familia.cliente,a,'IDA','Escola João Borges','IF');
  await f.agendar(familiaB.cliente,b,'IDA','Posto Major','SENAC');
  await f.agendar(familia.cliente,a,'VOLTA','IF','Escola João Borges');
  await f.agendar(familiaB.cliente,b,'VOLTA','SENAC','Posto Major');
  // Uma edição não pode invalidar destinos já confirmados.
  await request(admin,`/rotas/${rota.id}/itinerario`,'PUT',{...f.itinerario,paradas:f.itinerario.paradas.map(p=>({...p,tipo:p.trajeto==='IDA'&&p.local==='IF'?'EMBARQUE':p.tipo}))},409);
  // Dois alunos ausentes: um compartilha o destino de B e outro tem destino exclusivo.
  const c=await f.api('/alunos','POST',{nome:'Aluno demonstração C',matricula:'C'+a.matricula,turma:'Noite',responsavel:'Família fictícia',rotaId:rota.id},201);
  const d=await f.api('/alunos','POST',{nome:'Aluno demonstração D',matricula:'D'+a.matricula,turma:'Noite',responsavel:'Família fictícia',rotaId:rota.id},201);
  for(const aluno of [c,d]) await f.vincular(aluno,familiaB.id,'Posto Major','SENAC');
  await f.agendar(familiaB.cliente,c,'VOLTA','SENAC','Posto Major');
  await f.agendar(familiaB.cliente,d,'VOLTA','SENAC','Creche Laura Sorense');

  let v=await request(motorista.cliente,'/operacao/viagens','POST',{rotaId:rota.id,trajeto:'IDA'});
  const agir=async(acao,extra={},expected=200)=>{
    const atualizado=await request(motorista.cliente,`/operacao/viagens/${v.id}/acoes`,'POST',{versao:v.versao,acao,...extra},expected);
    if(atualizado)v=atualizado;
  };
  const idaId=v.id;
  assert.equal(v.alunos.find(x=>x.aluno_id===a.id).destino_ordem,9);
  for(let ordem=1;ordem<=10;ordem++){
    assert.equal(v.ponto_atual,ordem,'A ida não omite paradas');
    await agir('CHEGAR');
    if(ordem===1)await agir('PRESENCA',{alunoId:a.id,status:'PRESENTE'});
    if(ordem===8)await agir('PRESENCA',{alunoId:b.id,status:'AUSENTE'});
    if(ordem===9){await agir('AVANCAR',{},409);await agir('DESEMBARCAR',{alunoId:a.id});}
    await agir('AVANCAR');
  }
  assert.ok(v.paradas.every(p=>!p.omitida_em));await agir('ENCERRAR');
  v=await request(motorista.cliente,'/operacao/viagens','POST',{rotaId:rota.id,trajeto:'VOLTA'});
  const voltaId=v.id;
  await agir('CHEGAR');await agir('AVANCAR',{},409);
  await agir('PRESENCA',{alunoId:b.id,status:'PRESENTE'});
  await agir('PRESENCA',{alunoId:c.id,status:'AUSENTE'});
  await agir('PRESENCA',{alunoId:d.id,status:'AUSENTE'});
  await agir('AVANCAR');assert.equal(v.ponto_atual,2,'IF nunca é omitido: é embarque');
  await agir('CHEGAR');await agir('PRESENCA',{alunoId:a.id,status:'PRESENTE'});
  const versao=v.versao;await agir('AVANCAR');
  await request(motorista.cliente,`/operacao/viagens/${v.id}/acoes`,'POST',{versao,acao:'CHEGAR'},409);
  assert.equal(v.ponto_atual,3,'Posto Major permanece necessário para B, mesmo com C ausente');
  await agir('CHEGAR');await agir('DESEMBARCAR',{alunoId:a.id},409);await agir('AVANCAR',{},409);
  await agir('DESEMBARCAR',{alunoId:b.id});await agir('AVANCAR');
  assert.equal(v.ponto_atual,10,'Seis pontos sem passageiros foram omitidos');
  const omitidas=v.paradas.filter(p=>p.omitida_em);
  assert.deepEqual(omitidas.map(p=>p.ordem),[4,5,6,7,8,9]);
  assert.ok(omitidas.every(p=>p.motivo_omissao.includes('Nenhum passageiro')));
  const privada=await request(familia.cliente,`/operacao/viagens/${v.id}`,'GET');
  assert.deepEqual(privada.alunos.map(x=>x.aluno_id),[a.id]);
  assert.equal(privada.paradas.filter(p=>p.omitida_em).length,6);
  await agir('CHEGAR');await agir('DESEMBARCAR',{alunoId:a.id});await agir('AVANCAR');await agir('ENCERRAR');
  const eventos=await f.api(`/operacao/viagens/${voltaId}/eventos`);
  assert.equal(eventos.filter(e=>e.acao==='OMITIR_PARADA').length,6);
  const resumo=await f.api(`/operacao/historico?inicio=${f.data}&fim=${f.data}`);
  const ida=resumo.presencas.filter(p=>p.viagem_id===idaId);
  assert.equal(ida.filter(p=>p.status==='PRESENTE').length,1);assert.equal(ida.filter(p=>p.status==='AUSENTE').length,1);
  // Reordenar o cadastro depois da viagem não altera o destino nem o percurso fixados.
  const itinerario=await f.api(`/rotas/${rota.id}/itinerario`);
  await f.api(`/rotas/${rota.id}/itinerario`,'PUT',{...itinerario,paradas:itinerario.paradas.map(p=>({...p,local:p.local+' (editado após viagem)'}))});
  const historica=await f.api(`/operacao/viagens/${voltaId}`);
  assert.equal(historica.paradas[9].local,'Escola João Borges');
  assert.equal(historica.alunos.find(x=>x.aluno_id===a.id).destino_ordem,10);
  console.log('OK: rota 11, destinos independentes, validação, presença, ponto compartilhado, seis omissões auditadas, isolamento e histórico preservado.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
