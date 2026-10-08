const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { criarDadosMobilys } = require('../js/dados.js');
const raiz = path.join(__dirname, '..');
const contexto = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(raiz, 'js/rotas.js'), 'utf8') + '\n' + fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8').split('/* As páginas compartilham')[0] + '\nthis.seed = DADOS_INICIAIS;', contexto);
const seed = JSON.parse(JSON.stringify(contexto.seed));
function ambiente() {
  const itens = new Map();
  const storage = { getItem: k => itens.get(k) || null, setItem: (k,v) => itens.set(k,v), removeItem: k => itens.delete(k) };
  return { storage, model: criarDadosMobilys(seed, storage) };
}

test('horarios persistem, preservam entrada repetida e excluem ausentes da saida', () => {
  const { storage } = ambiente();
  let instante = new Date('2026-09-30T08:00:00Z');
  const model = criarDadosMobilys(seed, storage, () => new Date(instante));
  model.agir(10, 'ida', 'iniciar');
  model.agir(10, 'ida', 'avancar');
  model.agir(10, 'ida', 'presenca', 1, 'presente');
  const registro = () => model.db.historicoPresencas.find(p => p.viagemId && p.alunoId === 1);
  assert.equal(registro().entradaEm, instante.toISOString());
  assert.equal(registro().saidaEm, null);
  instante = new Date('2026-09-30T08:01:00Z');
  model.agir(10, 'ida', 'presenca', 1, 'presente');
  assert.equal(registro().entradaEm, '2026-09-30T08:00:00.000Z');
  model.agir(10, 'ida', 'presenca', 1, 'ausente');
  assert.equal(registro().entradaEm, null);
  model.agir(10, 'ida', 'presenca', 1, 'presente');
  assert.equal(registro().entradaEm, instante.toISOString());
  model.agir(10, 'ida', 'avancar');
  for (let i = 1; i < 7; i++) {
    model.agir(10, 'ida', 'avancar');
    model.viagem(10, 'ida').alunos.filter(a => a.embarqueIndice === i).forEach(a => model.agir(10, 'ida', 'presenca', a.id, 'ausente'));
    model.agir(10, 'ida', 'avancar');
  }
  instante = new Date('2026-09-30T09:00:00Z');
  model.agir(10, 'ida', 'encerrar');
  const nova = criarDadosMobilys(seed, storage, () => new Date(instante));
  const registros = nova.db.historicoPresencas.filter(p => p.viagemId);
  assert.equal(registros.find(p => p.alunoId === 1).saidaEm, instante.toISOString());
  assert.ok(registros.filter(p => p.status === 'ausente').every(p => p.entradaEm === null && p.saidaEm === null));
  assert.ok(nova.db.historicoPresencas.filter(p => !p.viagemId).every(p => !p.entradaEm && !p.saidaEm));
});
test('data local muda na virada do dia e preserva os registros anteriores', () => {
  const { storage } = ambiente();
  let instante = new Date(2026, 11, 31, 23, 59);
  const model = criarDadosMobilys(seed, storage, () => new Date(instante));
  assert.equal(model.data, '31/12/2026');
  assert.equal(model.db.historicoPresencas[0].data, '30/12/2026');
  model.agir(10, 'ida', 'iniciar');
  model.agir(10, 'ida', 'avancar');
  model.agir(10, 'ida', 'presenca', 1, 'presente');
  instante = new Date(2027, 0, 1, 0, 1);
  assert.equal(model.data, '01/01/2027');
  assert.equal(model.viagem(10, 'ida').id, '2027-01-01:10:ida');
  assert.equal(model.viagem(10, 'ida').status, 'nao-iniciada');
  assert.ok(model.historico(1).some(p => p.data === '31/12/2026' && p.situacao === 'Utilizado'));
});

test('cancelar ida remove somente a ida da lista e persiste entre páginas', () => {
  const { model, storage } = ambiente();
  model.confirmar(1, 'ida', 'cancelado');
  const outraPagina = criarDadosMobilys(seed, storage);
  assert.equal(outraPagina.viagem(10, 'ida').alunos.some(a => a.id === 1), false);
  assert.equal(outraPagina.viagem(10, 'volta').alunos.some(a => a.id === 1), true);
  assert.equal(outraPagina.historico(1).find(p => p.data === model.data && p.turno === 'Ida').situacao, 'Cancelado');
});
test('confirmação não conta como presença, e início bloqueia cancelamentos', () => {
  const { model } = ambiente();
  assert.equal(model.db.historicoPresencas.some(p => p.data === model.data), false);
  model.agir(10, 'ida', 'iniciar');
  assert.throws(() => model.confirmar(1, 'ida', 'cancelado'), /encerradas/);
  assert.equal(model.agenda(1).idaBloqueado, true);
  model.confirmar(1, 'volta', 'cancelado');
});
test('presença exige ponto correto, evita duplicatas e alimenta histórico', () => {
  const { model, storage } = ambiente();
  assert.throws(() => model.agir(10, 'ida', 'presenca', 1, 'presente'), /andamento/);
  model.agir(10, 'ida', 'iniciar');
  assert.throws(() => model.agir(10, 'ida', 'presenca', 1, 'presente'), /ponto/);
  model.agir(10, 'ida', 'avancar');
  assert.throws(() => model.agir(10, 'ida', 'avancar'), /pendentes/);
  assert.throws(() => model.agir(10, 'ida', 'presenca', 2, 'presente'), /ponto/);
  model.agir(10, 'ida', 'presenca', 1, 'ausente');
  model.agir(10, 'ida', 'presenca', 1, 'presente');
  const nova = criarDadosMobilys(seed, storage);
  assert.equal(nova.db.historicoPresencas.filter(p => p.alunoId === 1 && p.data === model.data).length, 1);
  assert.equal(nova.historico(1).find(p => p.data === model.data && p.turno === 'Ida').situacao, 'Utilizado');
  assert.equal(nova.viagem(10, 'ida').alteracoes.length, 2);
  assert.equal(nova.viagem(10, 'volta').status, 'nao-iniciada');
  assert.throws(() => nova.agir(10, 'ida', 'encerrar'), /Conclua/);
});
test('encerra somente após percurso e não permite editar viagem encerrada', () => {
  const { model } = ambiente();
  model.agir(10, 'ida', 'iniciar');
  for (let i = 0; i < 7; i++) {
    model.agir(10, 'ida', 'avancar');
    model.viagem(10, 'ida').alunos.filter(a => a.embarqueIndice === i).forEach(a => model.agir(10, 'ida', 'presenca', a.id, 'presente'));
    model.agir(10, 'ida', 'avancar');
  }
  model.agir(10, 'ida', 'encerrar');
  assert.equal(model.viagem(10, 'ida').status, 'encerrada');
  assert.throws(() => model.agir(10, 'ida', 'presenca', 1, 'ausente'), /andamento/);
});
test('edição de vínculo muda o ponto e a instituição, validando a rota', () => {
  const { model } = ambiente();
  const aluno = { ...model.db.alunos[0], pontoIndice: '2', instituicao: 'UNESP' };
  model.cadastro('alunos', 1, aluno);
  assert.equal(model.viagem(10, 'ida').alunos[0].embarqueIndice, 2);
  assert.equal(model.viagem(10, 'volta').alunos[0].embarqueIndice, 1);
  assert.throws(() => model.cadastro('alunos', 1, { ...aluno, pontoIndice: '99' }), /Selecione/);
  model.agir(10, 'ida', 'iniciar');
  assert.throws(() => model.cadastro('alunos', 1, aluno), /Reinicie/);
});
test('operações de outra aba usam estado recente e reset restaura a base', () => {
  const { model, storage } = ambiente();
  const outra = criarDadosMobilys(seed, storage);
  model.confirmar(1, 'ida', 'cancelado');
  outra.confirmar(1, 'volta', 'cancelado');
  model.atualizar();
  assert.equal(model.agenda(1).ida, 'cancelado');
  assert.equal(model.agenda(1).volta, 'cancelado');
  model.reiniciar();
  assert.equal(model.agenda(1).ida, 'confirmado');
});
test('falha de gravação não publica alteração; dados corrompidos exigem reset', () => {
  const { model, storage } = ambiente();
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => model.confirmar(1, 'ida', 'cancelado'), /não foi aplicada/);
  assert.equal(model.agenda(1).ida, 'confirmado');
  const corrompido = criarDadosMobilys(seed, { getItem: () => '{', setItem() {}, removeItem() {} });
  assert.match(corrompido.erro, /ler/);
  assert.throws(() => corrompido.confirmar(1, 'ida', 'cancelado'), /ler/);
});
