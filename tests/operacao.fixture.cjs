const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {sessao,credenciais}=require('./http-helper.cjs');
async function fixture() {
  if(!process.env.MOBILYS_TEST_API) throw new Error('Defina MOBILYS_TEST_API para uma instância conectada ao banco isolado de testes.');
  const admin=sessao(),c=credenciais();assert.equal((await admin.login(c.email,c.senha)).status,204);
  const sufixo=randomBytes(5).toString('hex');
  const criar=async(entidade,dados)=>{const r=await admin.request('/'+entidade,'POST',dados);assert.equal(r.status,201,entidade+': '+await(r.status!==201?r.text():Promise.resolve('')));return r.json();};
  const conta=async(perfil,nome)=>{
    const email=`${nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}-${sufixo}@teste.local`,senha=randomBytes(16).toString('hex');
    const u=await criar('usuarios',{nome,email,senha,perfil});const cliente=sessao();assert.equal((await cliente.login(email,senha)).status,204);return {...u,email,senha,cliente};
  };
  const motorista=await conta('MOTORISTA','Motorista'),outro=await conta('MOTORISTA','Outro'),familia=await conta('RESPONSAVEL','Família'),familiaB=await conta('RESPONSAVEL','FamíliaB');
  const m=await criar('motoristas',{nome:'Motorista '+sufixo,cnh:String(Date.now()).slice(-11),telefone:'19999991234',usuarioId:motorista.id});
  const placa='OPT'+String(Date.now()).slice(-4);
  const veiculo=await criar('veiculos',{placa,modelo:'Ônibus '+sufixo,capacidade:1,motoristaId:m.id});
  const rota=await criar('rotas',{nome:'Operação '+sufixo,turno:'Manhã',origem:'Aguaí',destino:'São João',veiculoId:veiculo.id});
  const res=await admin.request(`/rotas/${rota.id}/itinerario`,'PUT',{versao:0,paradas:[
    {trajeto:'IDA',ordem:1,local:'Praça',referencia:'Centro',horario:'06:00',tipo:'EMBARQUE'},
    {trajeto:'IDA',ordem:2,local:'Bairro',referencia:'Rua 2',horario:'06:10',tipo:'EMBARQUE'},
    {trajeto:'VOLTA',ordem:1,local:'Escola',referencia:'Portão',horario:'12:00',tipo:'EMBARQUE'}]});
  assert.equal(res.status,200);const itinerario=await res.json();
  const a=await criar('alunos',{nome:'Aluno A '+sufixo,matricula:'A'+sufixo,turma:'Manhã',responsavel:'Família',rotaId:rota.id});
  const b=await criar('alunos',{nome:'Aluno B '+sufixo,matricula:'B'+sufixo,turma:'Manhã',responsavel:'FamíliaB',rotaId:rota.id});
  const vinculo=(u,i)=>({responsavelUsuarioId:u,paradaIdaId:itinerario.paradas[i].id,paradaVoltaId:itinerario.paradas[2].id});
  assert.equal((await admin.request(`/operacao/alunos/${a.id}/vinculos`,'PUT',vinculo(familia.id,0))).status,204);
  assert.equal((await admin.request(`/operacao/alunos/${b.id}/vinculos`,'PUT',vinculo(familiaB.id,1))).status,204);
  const data=(await(await admin.request('/operacao/hoje')).json()).data;
  const confirmar=(cliente,id,trajeto,status='CONFIRMADO')=>cliente.request('/operacao/agenda','PUT',{alunoId:id,data,trajeto,status});
  return {admin,motorista,outro,familia,familiaB,m,veiculo,rota,itinerario,a,b,data,confirmar};
}
module.exports={fixture};
