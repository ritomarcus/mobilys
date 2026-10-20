/* Gráficos vetoriais locais: sem CDN, com os mesmos registros dos relatórios. */
(function (root) {
  const seguro = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const cores = ['#116b60', '#c16720', '#5865ab', '#9a477b', '#327fa3', '#67722c'];
  function resumir(rows) {
    const dias = new Map(), rotas = new Map();
    for (const p of rows) {
      if (!dias.has(p.data_servico)) dias.set(p.data_servico, { data:p.data_servico, presentes:0, ausentes:0, pendentes:0 });
      if (!rotas.has(p.rota_id)) rotas.set(p.rota_id, { id:p.rota_id, nome:p.rota_nome, alunos:new Set(), presentes:0, ausentes:0, pendentes:0 });
      const rota = rotas.get(p.rota_id);
      rota.alunos.add(p.aluno_id);
      const campo = { PRESENTE:'presentes', AUSENTE:'ausentes', PENDENTE:'pendentes' }[p.status];
      if (campo) { dias.get(p.data_servico)[campo]++; rota[campo]++; }
    }
    const frequencia = d => ({ ...d, frequencia:d.presentes+d.ausentes ? Math.round(1000*d.presentes/(d.presentes+d.ausentes))/10 : null });
    return { dias:[...dias.values()].sort((a,b)=>a.data.localeCompare(b.data)).map(frequencia),
      rotas:[...rotas.values()].map(r=>({ ...r, alunos:r.alunos.size })).sort((a,b)=>a.nome.localeCompare(b.nome, 'pt-BR')) };
  }
  const data = d => d.split('-').reverse().join('/');
  const svg = (titulo, corpo, altura=240) => `<svg viewBox="0 0 600 ${altura}" role="img" aria-label="${seguro(titulo)}">${corpo}</svg>`;
  const card = (titulo, descricao, grafico, valores) => `<section class="card painel op-grafico"><h2 class="h5">${titulo}</h2><p class="small text-muted">${descricao}</p>${grafico}<details class="op-grafico-valores"><summary>Ver valores do gráfico</summary>${valores}</details></section>`;
  function renderizar(rows) {
    if (!rows.length) return '<section class="card painel p-4 mb-4 op-graficos-vazios"><h2 class="h5">Gráficos do período</h2><p class="mb-0">Nenhum registro de viagem para os filtros selecionados.</p></section>';
    const { dias, rotas } = resumir(rows);
    const x = i => dias.length===1 ? 320 : 55+i*510/(dias.length-1), y = n => 190-n*1.5;
    let linha = [0,25,50,75,100].map(n=>`<line x1="55" y1="${y(n)}" x2="565" y2="${y(n)}" stroke="#dce4e8"/><text x="45" y="${y(n)+4}" text-anchor="end">${n}%</text>`).join('');
    // Dias com somente pendências interrompem a curva; não representam frequência zero.
    let segmento = [];
    const segmentos = [];
    dias.forEach((d,i)=>{ if(d.frequencia===null) { if(segmento.length) segmentos.push(segmento); segmento=[]; } else segmento.push(`${x(i)},${y(d.frequencia)}`); });
    if(segmento.length) segmentos.push(segmento);
    linha += segmentos.map(p=>`<polyline points="${p.join(' ')}" fill="none" stroke="${cores[0]}" stroke-width="3"/>`).join('');
    linha += dias.map((d,i)=>`${d.frequencia===null?'':`<circle cx="${x(i)}" cy="${y(d.frequencia)}" r="5" fill="${cores[0]}"><title>${data(d.data)}: ${d.frequencia}%</title></circle>`}${i===0||i===dias.length-1||i%Math.max(1,Math.ceil(dias.length/5))===0?`<text x="${x(i)}" y="215" text-anchor="middle">${data(d.data).slice(0,5)}</text>`:''}`).join('');
    const frequencias = '<ul>'+dias.map(d=>`<li>${data(d.data)}: ${d.frequencia===null?'Sem presenças resolvidas':d.frequencia+'%'} (${d.presentes} presentes, ${d.ausentes} ausentes, ${d.pendentes} pendentes)</li>`).join('')+'</ul>';
    const total = rotas.reduce((n,r)=>n+r.alunos,0);
    let acumulado = 0;
    const circulos = rotas.map((r,i)=>{ const fatia=r.alunos/total*100, inicio=acumulado; acumulado+=fatia;
      return `<circle cx="120" cy="120" r="78" fill="none" stroke="${cores[i%cores.length]}" stroke-width="32" pathLength="100" stroke-dasharray="${fatia} ${100-fatia}" stroke-dashoffset="${-inicio}" transform="rotate(-90 120 120)"><title>${seguro(r.nome)}: ${r.alunos} alunos</title></circle>`; }).join('');
    const donut = svg('Alunos distintos por rota no período filtrado', circulos+`<text x="120" y="119" text-anchor="middle" class="op-grafico-total">${total}</text><text x="120" y="142" text-anchor="middle">alunos por rota</text>`,240).replace('viewBox="0 0 600 240"', 'viewBox="0 0 240 240"');
    const legenda = '<ul class="op-grafico-legenda">'+rotas.map((r,i)=>`<li><span style="background:${cores[i%cores.length]}" aria-hidden="true"></span>${seguro(r.nome)} <strong>${r.alunos}</strong></li>`).join('')+'</ul>';
    const max = Math.max(1,...rotas.map(r=>r.presentes+r.ausentes+r.pendentes));
    const barras = '<div class="op-grafico-barras">'+rotas.map(r=>`<div class="op-grafico-rota"><strong>${seguro(r.nome)}</strong><div class="op-grafico-barra" role="img" aria-label="${seguro(r.nome)}: ${r.presentes} presentes, ${r.ausentes} ausentes, ${r.pendentes} pendentes">${[['presentes','Presentes'],['ausentes','Ausentes'],['pendentes','Pendentes']].map(([k,label])=>r[k]?`<span class="op-barra-${k}" style="width:${r[k]/max*100}%" title="${label}: ${r[k]}">${r[k]}</span>`:'').join('')}</div><small>${r.presentes} presentes · ${r.ausentes} ausentes · ${r.pendentes} pendentes</small></div>`).join('')+'</div>';
    return '<div class="op-graficos mb-4">'+
      card('Frequência no período','Presentes ÷ (presentes + ausentes). Dias sem registros não são exibidos.',svg('Frequência diária em porcentagem',linha),frequencias)+
      card('Alunos por rota','Alunos distintos com registros nos filtros atuais; ida e volta não duplicam o aluno na mesma rota.',`<div class="op-grafico-distribuicao">${donut}${legenda}</div>`,legenda)+
      card('Presenças por rota','Contagem de registros por trajeto. Um aluno pode ter registros de ida e de volta.',barras,'<ul>'+rotas.map(r=>`<li>${seguro(r.nome)}: ${r.presentes} presentes, ${r.ausentes} ausentes, ${r.pendentes} pendentes</li>`).join('')+'</ul>')+'</div>';
  }
  root.graficosMobilys = { resumir, renderizar };
  if (typeof module === 'object' && module.exports) module.exports = root.graficosMobilys;
})(typeof window === 'undefined' ? globalThis : window);
