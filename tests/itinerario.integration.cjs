const assert = require('node:assert/strict');
const { sessao, credenciais } = require('./http-helper.cjs');
async function main() {
  const admin = sessao(), anonimo = sessao();
  const { email, senha } = credenciais();
  assert.equal((await admin.login(email, senha)).status, 204);
  const ids = [];
  try {
    for (const indice of [1, 2]) {
      const res = await admin.request('/rotas', 'POST', { nome: `Itinerário teste ${Date.now()}-${indice}`, turno: 'Manhã', origem:'A', destino:'B' });
      assert.equal(res.status, 201); ids.push((await res.json()).id);
    }
    const url = '/rotas/' + ids[0] + '/itinerario';
    assert.equal((await anonimo.request(url)).status, 401);
    const vazio = await (await admin.request(url)).json();
    assert.deepEqual(vazio, { versao: 0, paradas: [] });
    const ponto = (trajeto, ordem, local) => ({ trajeto, ordem, local, referencia:'Referência', horario:'06:00', tipo:'EMBARQUE' });
    const inicial = { versao:0, paradas:[ponto('IDA',1,'Praça'),ponto('IDA',2,'Escola'),ponto('VOLTA',1,'Escola')] };
    const criacao = await admin.request(url,'PUT',inicial);
    assert.equal(criacao.status,200);
    const salvo = await criacao.json();
    assert.equal(salvo.versao,1);
    assert.equal(salvo.paradas.length,3);
    const ida = salvo.paradas.filter(p=>p.trajeto==='IDA');
    const trocado = { versao:1, paradas:salvo.paradas.map(p=>p.trajeto==='IDA'?{...p,ordem:3-p.ordem}:p) };
    const edicao = await admin.request(url,'PUT',trocado);
    assert.equal(edicao.status,200);
    const novo = await edicao.json();
    assert.equal(novo.paradas[0].id,ida[1].id);
    assert.equal(novo.paradas[1].id,ida[0].id);
    assert.equal((await admin.request(url,'PUT',inicial)).status,409);
    assert.equal((await admin.request(url,'PUT',{versao:2,paradas:[ponto('IDA',2,'Lacuna')]})).status,400);
    assert.equal((await admin.request('/rotas/'+ids[1]+'/itinerario','PUT',{versao:0,paradas:[{...novo.paradas[0],ordem:1}]})).status,400);
    assert.deepEqual(await (await admin.request(url)).json(),novo, 'Falhas não devem alterar o itinerário');
    assert.equal((await admin.request(url,'PUT',{versao:2,paradas:[]})).status,200);
    assert.deepEqual((await (await admin.request(url)).json()).paradas,[]);
    console.log('OK: itinerário persistido, ida/volta, reordenação com IDs estáveis, conflito de versão, validação e isolamento entre rotas.');
  } finally { for (const id of ids) await admin.request('/rotas/'+id,'DELETE'); }
}
main().catch(e=>{ console.error(e);process.exitCode=1; });
