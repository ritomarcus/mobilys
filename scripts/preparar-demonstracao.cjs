// Dados fictícios. As gravações passam pelas permissões e regras da API.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { sessao, credenciais } = require('../tests/http-helper.cjs');
const { modeloRota11 } = require('../js/rota11.js');
const arquivo = path.join(__dirname, '../backend/target/demonstracao-local.json');

async function main() {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const estado = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : { contas: [], registros: {} };
  const salvar = () => fs.writeFileSync(arquivo, JSON.stringify(estado, null, 2));
  const admin = sessao(), c = credenciais();
  if ((await admin.login(c.email, c.senha)).status !== 204) throw Error('Não foi possível autenticar o administrador local.');
  async function api(cliente, url, metodo = 'GET', dados) {
    const r = await cliente.request(url, metodo, dados);
    if (!r.ok) throw Error(`${metodo} ${url}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  const hoje = (await api(admin, '/operacao/hoje')).data;
  const amanha = new Date(hoje + 'T12:00:00Z'); amanha.setUTCDate(amanha.getUTCDate() + 1);
  estado.dataApresentacao ||= amanha.toISOString().slice(0, 10);
  estado.dataHistorico ||= hoje;
  estado.sufixo ||= randomBytes(3).toString('hex'); salvar();
  async function criar(chave, recurso, dados) {
    if (!estado.registros[chave]) {
      estado.registros[chave] = await api(admin, '/' + recurso, 'POST', dados); salvar();
    }
    return estado.registros[chave];
  }
  async function conta(chave, nome, perfil) {
    let acesso = estado.contas.find(u => u.chave === chave);
    if (!acesso) {
      acesso = { chave, nome, perfil, email: `${chave}.${estado.sufixo}@demo.mobilys.local`, senha: randomBytes(10).toString('hex') };
      estado.contas.push(acesso); salvar();
    }
    const u = await criar(chave, 'usuarios', acesso);
    acesso.id = u.id; salvar();
    const cliente = sessao();
    if ((await cliente.login(acesso.email, acesso.senha)).status !== 204) throw Error('Falha no login de demonstração.');
    return { ...acesso, cliente };
  }
  const motorista = await conta('motorista', 'Carlos — motorista fictício', 'MOTORISTA');
  const familiaA = await conta('familia-ana', 'Mariana — responsável fictícia', 'RESPONSAVEL');
  const familiaB = await conta('familia-bruno', 'Roberto — responsável fictício', 'RESPONSAVEL');
  const m = await criar('cadastro-motorista', 'motoristas', { nome: motorista.nome, usuarioId: motorista.id,
    cnh: String(parseInt(estado.sufixo, 16)).padStart(11, '0'), telefone: '19999990001', validadeCnh: '2028-12-31' });
  const veiculo = await criar('veiculo', 'veiculos', { placa: 'DEM' + String(parseInt(estado.sufixo, 16) % 10000).padStart(4, '0'),
    modelo: 'Micro-ônibus escolar — demonstração', capacidade: 2, motoristaId: m.id, anoFabricacao: 2024, ativo: true });
  for (const f of [familiaA, familiaB]) await criar('responsavel-' + f.chave, 'responsaveis', { usuarioId: f.id, telefone: '19999990002' });
  const paradas = modeloRota11().map(p => {
    const min = p.trajeto === 'IDA' ? 18 * 60 + 50 + (p.ordem - 9) * 5 : p.ordem === 1 ? 22 * 60 : 22 * 60 + 15 + (p.ordem - 2) * 5;
    return { ...p, horario: p.horario || `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`,
      referencia: [p.referencia, 'Cenário fictício; horários do transporte simulados para apresentação.'].filter(Boolean).join(' ') };
  });
  async function cenario(chave, nome) {
    const rota = await criar(chave, 'rotas', { nome, turno: 'Noite', origem: 'Aguaí', destino: 'IF e SENAC',
      descricao: 'Demonstração acadêmica com pessoas fictícias e horários simulados.', veiculoId: veiculo.id, ativo: true });
    let itinerario = await api(admin, `/rotas/${rota.id}/itinerario`);
    if (!itinerario.paradas.length) itinerario = await api(admin, `/rotas/${rota.id}/itinerario`, 'PUT', { versao: itinerario.versao, paradas });
    const ponto = (trajeto, ordem) => itinerario.paradas.find(p => p.trajeto === trajeto && p.ordem === ordem).id;
    const alunos = [];
    for (const [i, familia, nomeAluno, curso] of [[0, familiaA, 'Ana — aluna fictícia', 'Informática — IF'], [1, familiaB, 'Bruno — aluno fictício', 'Administração — SENAC']]) {
      const a = await criar(`${chave}-aluno-${i}`, 'alunos', { nome: nomeAluno, matricula: `DEMO-${estado.sufixo}-${chave}-${i}`,
        turma: 'Noturno', responsavel: familia.nome, rotaId: rota.id, curso, periodo: '2º semestre', telefone: '19999990003' });
      const ida = ponto('IDA', i === 0 ? 1 : 8), volta = ponto('VOLTA', i === 0 ? 2 : 1);
      if (!estado.registros[`${chave}-vinculo-${i}`]) {
        await api(admin, `/alunos/${a.id}/familia`, 'PUT', {
          responsaveis: [{ responsavelId: estado.registros['responsavel-' + familia.chave].id, parentesco: i === 0 ? 'Mãe' : 'Pai' }],
          pontos: [{ paradaId: ida, ativo: true }, { paradaId: volta, ativo: true }], paradaIdaId: ida, paradaVoltaId: volta });
        estado.registros[`${chave}-vinculo-${i}`] = true; salvar();
      }
      alunos.push({ ...a, familia, ida, volta, destinoIda: ponto('IDA', i === 0 ? 9 : 10), destinoVolta: ponto('VOLTA', i === 0 ? 10 : 3) });
    }
    return { rota, alunos };
  }
  const principal = await cenario('apresentacao', `Rota 11 — apresentação ${estado.dataApresentacao}`);
  const historico = await cenario('historico', `Rota 11 — histórico simulado ${estado.dataHistorico}`);
  async function agendar(cenario, data) {
    const viagens = await api(admin, '/operacao/viagens?data=' + data);
    for (const a of cenario.alunos) for (const trajeto of ['IDA', 'VOLTA']) {
      if (viagens.some(v => v.rota_id === cenario.rota.id && v.data_servico === data && v.trajeto === trajeto)) continue;
      await api(a.familia.cliente, '/operacao/agenda', 'PUT', { alunoId: a.id, data, trajeto, status: 'CONFIRMADO',
        paradaId: trajeto === 'IDA' ? a.ida : a.volta, destinoId: trajeto === 'IDA' ? a.destinoIda : a.destinoVolta });
    }
  }
  await agendar(principal, estado.dataApresentacao);
  // Permite ensaiar hoje sem consumir a viagem reservada para amanhã.
  if (hoje !== estado.dataApresentacao) await agendar(principal, hoje);
  if (!estado.historicoConcluido) {
    if (hoje !== estado.dataHistorico) throw Error('O histórico parcial pertence a outra data. Revise antes de continuar.');
    await agendar(historico, hoje);
    for (const trajeto of ['IDA', 'VOLTA']) {
      let v = await api(motorista.cliente, '/operacao/viagens', 'POST', { rotaId: historico.rota.id, trajeto });
      const agir = async (acao, extra = {}) => { v = await api(motorista.cliente, `/operacao/viagens/${v.id}/acoes`, 'POST', { versao: v.versao, acao, ...extra }); };
      while (v.status === 'EM_ANDAMENTO' && v.ponto_atual <= v.paradas.length) {
        if (!v.no_ponto) await agir('CHEGAR');
        for (const a of v.alunos.filter(a => a.embarque_ordem === v.ponto_atual && a.status === 'PENDENTE'))
          await agir('PRESENCA', { alunoId: a.aluno_id, status: trajeto === 'IDA' && a.aluno_id === historico.alunos[1].id ? 'AUSENTE' : 'PRESENTE' });
        for (const a of v.alunos.filter(a => a.destino_ordem === v.ponto_atual && a.status === 'PRESENTE' && !a.desembarque_em))
          await agir('DESEMBARCAR', { alunoId: a.aluno_id });
        await agir('AVANCAR');
      }
      if (v.status === 'EM_ANDAMENTO') await agir('ENCERRAR');
    }
    estado.historicoConcluido = true; salvar();
  }
  const relatorio = await api(admin, `/operacao/historico?inicio=${estado.dataHistorico}&fim=${estado.dataHistorico}&rotaId=${historico.rota.id}`);
  if (relatorio.presentes !== 3 || relatorio.ausentes !== 1 || relatorio.frequencia !== 75) throw Error('O relatório não corresponde ao cenário esperado.');
  for (const a of principal.alunos) {
    const visiveis = await api(a.familia.cliente, '/operacao/familia/alunos');
    if (!visiveis.some(x => x.id === a.id) || visiveis.some(x => x.id === principal.alunos.find(x => x.id !== a.id).id)) throw Error('Falha ao verificar isolamento das famílias.');
  }
  console.log(`Demonstração pronta para ${estado.dataApresentacao}. Histórico: 3 presentes, 1 ausente, frequência 75%.`);
  console.log('Acessos salvos somente em backend/target/demonstracao-local.json (ignorado pelo Git).');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
