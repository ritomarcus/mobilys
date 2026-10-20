const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumir, renderizar } = require('../js/graficos.js');
const registro = (aluno, status, data='2026-10-20', rota=1, nome='Rota 11') => ({ aluno_id:aluno, status, data_servico:data, rota_id:rota, rota_nome:nome });
test('frequência real e alunos distintos não duplicados entre trajetos', () => {
  const r = resumir([registro(1,'PRESENTE'),registro(2,'AUSENTE'),registro(1,'PRESENTE'),registro(2,'PRESENTE')]);
  assert.equal(r.dias[0].frequencia,75);
  assert.equal(r.rotas[0].alunos,2);
  assert.equal(r.rotas[0].presentes,3);
  assert.equal(r.rotas[0].ausentes,1);
});
test('pendências não viram frequência zero e rotas são agrupadas por ID', () => {
  const r=resumir([registro(1,'PENDENTE','2026-10-21'),registro(2,'AUSENTE','2026-10-20',2)]);
  assert.deepEqual(r.dias.map(d=>d.frequencia),[0,null]);
  assert.equal(r.rotas.length,2);
});
test('gráficos tratam vazio, nomes HTML e valores filtrados', () => {
  assert.match(renderizar([]),/Nenhum registro/);
  const html=renderizar([registro(1,'PRESENTE','2026-10-20',1,'<img onerror=alert(1)>')]);
  assert.ok(!html.includes('<img'));
  assert.match(html,/&lt;img/);
  assert.match(html,/100%/);
  assert.match(html,/viewBox="0 0 240 240"/);
});
