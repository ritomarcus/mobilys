const assert=require('node:assert/strict');
const {fixture}=require('./operacao.fixture.cjs');
const {modeloRota11}=require('../js/rota11.js');

async function fixtureRota11(){
  const f=await fixture();
  const api=async(path,method='GET',body,status=200)=>{
    const r=await f.admin.request(path,method,body);
    assert.equal(r.status,status,`${method} ${path}: ${r.status===status?'':await r.text()}`);
    return status===204?null:r.json();
  };
  const paradas=modeloRota11().map(p=>{
    const id=p.trajeto==='IDA'&&p.ordem===1?f.itinerario.paradas[0].id:
      p.trajeto==='IDA'&&p.ordem===8?f.itinerario.paradas[1].id:
      p.trajeto==='VOLTA'&&p.ordem===1?f.itinerario.paradas[2].id:undefined;
    // Valores exclusivos do ensaio, sem alegação de horários reais.
    const minutos=p.trajeto==='IDA'?18*60+50+(p.ordem-9)*5:
      p.ordem===1?22*60:22*60+15+(p.ordem-2)*5;
    return {...p,id,horario:p.horario||`${String(Math.floor(minutos/60)).padStart(2,'0')}:${String(minutos%60).padStart(2,'0')}`,
      referencia:[p.referencia,p.horario?'':'Horário simulado para demonstração'].filter(Boolean).join(' ')};
  });
  await api('/veiculos/'+f.veiculo.id,'PUT',{...f.veiculo,capacidade:4});
  f.rota=await api('/rotas/'+f.rota.id,'PUT',{...f.rota,nome:'Rota 11 — demonstração '+f.a.matricula,turno:'Noite',descricao:'Percurso informado pelo autor; passageiros fictícios e horários complementares simulados.'});
  f.itinerario=await api(`/rotas/${f.rota.id}/itinerario`,'PUT',{versao:f.itinerario.versao,paradas});
  const ponto=(trajeto,local)=>f.itinerario.paradas.find(p=>p.trajeto===trajeto&&p.local===local);
  const vincular=async(aluno,usuario,ida,volta)=>api(`/operacao/alunos/${aluno.id}/vinculos`,'PUT',{
    responsavelUsuarioId:usuario,paradaIdaId:ponto('IDA',ida).id,paradaVoltaId:ponto('VOLTA',volta).id
  },204);
  await vincular(f.a,f.familia.id,'Escola João Borges','IF');
  await vincular(f.b,f.familiaB.id,'Posto Major','SENAC');
  const agendar=async(cliente,aluno,trajeto,embarque,destino,status='CONFIRMADO',expected=204)=>{
    const r=await cliente.request('/operacao/agenda','PUT',{alunoId:aluno.id,data:f.data,trajeto,status,
      paradaId:ponto(trajeto,embarque).id,destinoId:destino?ponto(trajeto,destino).id:null});
    assert.equal(r.status,expected,`Agenda ${trajeto}: ${r.status===expected?'':await r.text()}`);
    return r;
  };
  return {...f,api,ponto,vincular,agendar};
}
module.exports={fixtureRota11};
