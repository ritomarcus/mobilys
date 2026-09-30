/* Repositório local da demonstração. Sem autenticação ou comunicação com servidor. */
function criarDadosMobilys(iniciais, storage, agora = () => new Date()) {
  const chave = 'mobilys.demo.v1';
  const formatarData = valor => `${String(valor.getDate()).padStart(2, '0')}/${String(valor.getMonth() + 1).padStart(2, '0')}/${valor.getFullYear()}`;
  const data = () => formatarData(agora());
  const ontem = agora();
  ontem.setDate(ontem.getDate() - 1);
  const copiar = valor => JSON.parse(JSON.stringify(valor));
  const base = copiar(iniciais);
  base.alunos.forEach((a, i) => {
    a.pontoIndice = a.id === 5 ? 2 : a.id === 2 ? 1 : 0;
    a.instituicao = base.rotas.find(r => r.nome === a.rota).instituicoes[a.id === 5 ? 4 : i % 2];
  });
  base.historicoPresencas.forEach(p => {
    p.alunoId = base.alunos.find(a => a.nome === p.aluno)?.id;
    // Os registros anteriores não se confundem com a viagem ainda não iniciada.
    p.data = formatarData(ontem);
  });
  const inicial = { versao: 1, db: base, viagens: {}, confirmacoes: {}, revisao: 0 };
  let estado = copiar(inicial);
  let erro = '';
  const db = {};
  function publicar(novo) { estado = novo; Object.assign(db, estado.db); }
  function ler() {
    const texto = storage.getItem(chave);
    if (!texto) return copiar(inicial);
    const valor = JSON.parse(texto);
    if (valor.versao !== 1 || !valor.db || !valor.viagens || !valor.confirmacoes ||
      !Object.keys(base).every(k => Array.isArray(valor.db[k]))) throw new Error('Dados locais incompatíveis.');
    return valor;
  }
  function atualizar() {
    try { publicar(ler()); erro = ''; return true; }
    catch (_) { erro = 'Não foi possível ler os dados locais. Use Reiniciar demonstração ou habilite o armazenamento do navegador.'; return false; }
  }
  function alterar(fn) {
    let novo;
    try { novo = ler(); } catch (_) { throw new Error('Não foi possível ler os dados. Reinicie a demonstração antes de continuar.'); }
    const resultado = fn(novo);
    novo.revisao++;
    try { storage.setItem(chave, JSON.stringify(novo)); }
    catch (_) { throw new Error('Não foi possível salvar. Verifique o armazenamento do navegador; a alteração não foi aplicada.'); }
    publicar(novo); erro = '';
    return resultado;
  }
  const idViagem = (rotaId, turno) => `${data().split('/').reverse().join('-')}:${rotaId}:${turno}`;
  function obterViagem(s, rotaId, turno) {
    if (!['ida', 'volta'].includes(turno)) throw new Error('Trajeto inválido.');
    const id = idViagem(rotaId, turno);
    if (s.viagens[id]) return s.viagens[id];
    const rota = s.db.rotas.find(r => r.id === rotaId);
    if (!rota?.paradas?.length || !rota.paradasVolta?.length) throw new Error('Esta rota ainda não possui itinerário para a demonstração.');
    return { id, rotaId, data: data(), turno, status: 'nao-iniciada', pontoAtual: 0, noPonto: false, rota: copiar(rota), alunos: [] };
  }
  function confirmacao(s, alunoId, v) { return s.confirmacoes[`${v.id}:${alunoId}`] || 'confirmado'; }
  function lista(s, v) {
    if (v.status !== 'nao-iniciada') return v.alunos;
    return s.db.alunos.filter(a => a.rota === v.rota.nome && confirmacao(s, a.id, v) === 'confirmado').map(a => ({
      id: a.id, nome: a.nome, pontoIndice: Number(a.pontoIndice),
      embarqueIndice: v.turno === 'ida' ? Number(a.pontoIndice) : v.rota.paradasVolta.findIndex(p => p.local === a.instituicao && p.tipo === 'embarque'),
      ponto: v.turno === 'ida' ? v.rota.paradas[a.pontoIndice]?.local : a.instituicao,
      status: null,
    }));
  }
  function viagem(rotaId, turno) { const v = copiar(obterViagem(estado, rotaId, turno)); v.alunos = copiar(lista(estado, v)); return v; }
  function agir(rotaId, turno, acao, alunoId, status) {
    return alterar(s => {
      const v = obterViagem(s, rotaId, turno);
      const paradas = turno === 'ida' ? v.rota.paradas : v.rota.paradasVolta;
      if (acao === 'iniciar') {
        if (v.status !== 'nao-iniciada') throw new Error('A viagem já foi iniciada.');
        v.alunos = lista(s, v);
        if (v.alunos.some(a => !Number.isInteger(a.embarqueIndice) || !paradas[a.embarqueIndice])) throw new Error('Associe todos os alunos confirmados a um ponto e a uma instituição válidos.');
        v.status = 'em-andamento'; v.iniciadaEm = new Date().toISOString();
      } else {
        if (v.status !== 'em-andamento') throw new Error('A viagem precisa estar em andamento.');
        if (acao === 'presenca') {
          const aluno = v.alunos.find(a => a.id === alunoId);
          if (!aluno || !['presente', 'ausente'].includes(status)) throw new Error('Registro inválido.');
          if (!v.noPonto || aluno.embarqueIndice !== v.pontoAtual) throw new Error('Registre a presença quando o ônibus estiver no ponto do aluno.');
          const anterior = aluno.status;
          aluno.status = status;
          const registro = { viagemId: v.id, alunoId, aluno: aluno.nome, data: v.data, rota: v.rota.nome,
            turno: turno === 'ida' ? 'Ida' : 'Volta', status, registradoEm: new Date().toISOString(), registradoPor: 'Motorista de demonstração' };
          const indice = s.db.historicoPresencas.findIndex(p => p.viagemId === v.id && p.alunoId === alunoId);
          if (indice < 0) s.db.historicoPresencas.push(registro); else s.db.historicoPresencas[indice] = registro;
          (v.alteracoes || (v.alteracoes = [])).push({ alunoId, anterior, status, em: registro.registradoEm, por: registro.registradoPor });
        } else if (acao === 'avancar') {
          if (v.pontoAtual >= paradas.length) throw new Error('Todos os pontos já foram concluídos.');
          if (v.noPonto) {
            if (v.alunos.some(a => a.embarqueIndice === v.pontoAtual && !a.status)) throw new Error('Registre os alunos pendentes antes de avançar.');
            v.pontoAtual++; v.noPonto = false;
          } else v.noPonto = true;
        } else if (acao === 'encerrar') {
          if (v.pontoAtual < paradas.length || v.alunos.some(a => !a.status)) throw new Error('Conclua as paradas e os registros antes de encerrar.');
          v.status = 'encerrada'; v.encerradaEm = new Date().toISOString();
        } else throw new Error('Ação desconhecida.');
      }
      s.viagens[v.id] = v;
    });
  }
  function agenda(alunoId) {
    const a = db.alunos.find(a => a.id === alunoId);
    const rota = db.rotas.find(r => r.nome === a?.rota);
    if (!a || !rota?.paradas?.length || !rota.paradasVolta?.length) return null;
    const resultado = { ...a, rotaId: rota.id };
    for (const turno of ['ida', 'volta']) {
      const v = obterViagem(estado, rota.id, turno);
      resultado[turno] = confirmacao(estado, alunoId, v);
      resultado[`${turno}Bloqueado`] = v.status !== 'nao-iniciada';
    }
    return resultado;
  }
  function confirmar(alunoId, turno, valor) {
    alterar(s => {
      if (!['confirmado', 'cancelado'].includes(valor)) throw new Error('Confirmação inválida.');
      const a = s.db.alunos.find(a => a.id === alunoId);
      const rota = s.db.rotas.find(r => r.nome === a?.rota);
      if (!rota) throw new Error('Aluno sem rota.');
      const v = obterViagem(s, rota.id, turno);
      if (v.status !== 'nao-iniciada') throw new Error('As confirmações ficam encerradas após o início deste trajeto.');
      s.confirmacoes[`${v.id}:${alunoId}`] = valor;
    });
  }
  function historico(alunoId) {
    const registros = db.historicoPresencas.filter(p => p.alunoId === alunoId).map(p => ({ ...p, situacao: p.status === 'presente' ? 'Utilizado' : 'Ausente' }));
    const a = agenda(alunoId);
    if (a) for (const turno of ['ida', 'volta']) {
      const id = idViagem(a.rotaId, turno);
      if (!registros.some(p => p.viagemId === id)) registros.push({ data: data(), rota: a.rota, turno: turno === 'ida' ? 'Ida' : 'Volta', situacao: a[turno] === 'cancelado' ? 'Cancelado' : 'Aguardando registro' });
    }
    return registros.sort((a,b) => b.data.split('/').reverse().join('').localeCompare(a.data.split('/').reverse().join('')));
  }
  function cadastro(entidade, id, dados) {
    alterar(s => {
      const tabela = s.db[entidade];
      const registro = tabela.find(r => r.id === id);
      if (id && !registro) throw new Error('Registro removido em outra aba. Abra o cadastro novamente.');
      // Mantém os vínculos estáveis depois que a execução da demonstração começou.
      if (['alunos', 'rotas'].includes(entidade) && Object.keys(s.viagens).length) throw new Error('Reinicie a demonstração para alterar alunos ou rotas após o início das viagens.');
      if (!dados) {
        if (entidade === 'alunos' && s.db.historicoPresencas.some(p => p.alunoId === id)) throw new Error('Este aluno possui histórico e não pode ser excluído.');
        if (entidade === 'rotas' && (s.db.alunos.some(a => a.rota === registro.nome) || s.db.historicoPresencas.some(p => p.rota === registro.nome))) throw new Error('Esta rota possui alunos ou histórico vinculado.');
        if (entidade === 'veiculos' && s.db.rotas.some(r => r.veiculo === registro.placa)) throw new Error('Desassocie o veículo das rotas antes de excluir.');
        if (entidade === 'motoristas' && s.db.veiculos.some(v => v.motorista === registro.nome)) throw new Error('Desassocie o motorista dos veículos antes de excluir.');
        s.db[entidade] = tabela.filter(r => r.id !== id); return;
      }
      const unico = { alunos: 'matricula', rotas: 'nome', motoristas: 'cnh', veiculos: 'placa', usuarios: 'email' }[entidade];
      if (tabela.some(r => r.id !== id && String(r[unico]).toLowerCase() === String(dados[unico]).toLowerCase())) throw new Error('Já existe um cadastro com este identificador.');
      if (entidade === 'alunos' && dados.rota) {
        const rota = s.db.rotas.find(r => r.nome === dados.rota);
        if (dados.pontoIndice === '' || !rota?.paradas?.[Number(dados.pontoIndice)] || !rota.instituicoes.includes(dados.instituicao)) throw new Error('Selecione um ponto e uma instituição da rota.');
        dados.pontoIndice = Number(dados.pontoIndice);
      }
      if (registro) {
        if (entidade === 'rotas') s.db.alunos.filter(a => a.rota === registro.nome).forEach(a => a.rota = dados.nome);
        if (entidade === 'veiculos') s.db.rotas.filter(r => r.veiculo === registro.placa).forEach(r => r.veiculo = dados.placa);
        if (entidade === 'motoristas') s.db.veiculos.filter(v => v.motorista === registro.nome).forEach(v => v.motorista = dados.nome);
        Object.assign(registro, dados);
      } else tabela.push({ id: Math.max(0, ...tabela.map(r => r.id)) + 1, ...dados });
    });
  }
  function reiniciar() {
    try { storage.removeItem(chave); } catch (_) { throw new Error('Não foi possível reiniciar os dados locais.'); }
    publicar(copiar(inicial)); erro = '';
  }
  atualizar();
  if (!Object.keys(db).length) publicar(copiar(inicial));
  return { chave, get data() { return data(); }, db, atualizar, viagem, agir, agenda, confirmar, historico, cadastro, reiniciar,
    get revisao() { return estado.revisao; }, get erro() { return erro; } };
}
if (typeof module !== 'undefined') module.exports = { criarDadosMobilys };
