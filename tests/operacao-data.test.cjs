const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

for (const [nome, selecionada, editando, esperada] of [
  ['acompanha a virada do dia', '2026-10-20', false, '2026-10-21'],
  ['preserva uma data escolhida', '2026-10-25', false, '2026-10-25'],
  ['preserva edições de agenda', '2026-10-20', true, '2026-10-20'],
]) {
  test(nome, async () => {
    const filtro = { value: selecionada };
    const cabecalho = {};
    const chamadas = [];
    const contexto = vm.createContext({
      htmlSeguro: String,
      apiCadastros: { requisitar: async path => {
        chamadas.push(path);
        return path.endsWith('/hoje') ? { data: '2026-10-21' } : [];
      } },
      document: {
        getElementById: id => id === 'op-data' ? filtro : id === 'op-hoje' ? cabecalho : {},
        querySelector: () => editando ? {} : null,
      },
    });
    vm.runInContext(fs.readFileSync('js/operacao.js', 'utf8'), contexto);
    vm.runInContext(`opHoje='2026-10-20'; opView='resp-agendamentos'; desenharAgenda=()=>{};`, contexto);
    await vm.runInContext('carregarOperacao()', contexto);
    assert.equal(filtro.value, esperada);
    assert.equal(cabecalho.textContent, '21/10/2026');
    assert.equal(vm.runInContext('opHoje', contexto), '2026-10-21');
    assert.equal(chamadas.includes('/operacao/agenda?data=' + esperada), !editando);
  });
}
