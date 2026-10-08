/* Percurso e horários das aulas relatados pelo autor.
   Horários do ônibus não confirmados ficam em branco. */
(function(root) {
  const pontos = [
    ['Escola João Borges', '18:00'],
    ['Creche Laura Sorense', '18:03'],
    ['Lumens', '18:05'],
    ['Esquina Aldo Veterinário', '18:08'],
    ['Garagem', '18:10'],
    ['Posto de Saúde', '18:15'],
    ['Ponto de Ônibus — Av. Castelo Branco', '18:20'],
    ['Posto Major', '18:25'],
  ];
  function modeloRota11() {
    const parada=(trajeto,local,horario,tipo)=>({trajeto,local,horario,tipo,referencia:'',endereco:'',latitude:null,longitude:null});
    const instituicao=(trajeto,local,tipo)=>({
      ...parada(trajeto,local,'',tipo),
      referencia:trajeto==='IDA'?'Início das aulas: 19:00. Chegada do ônibus a confirmar.':
        `Término das aulas: ${local==='IF'?'22:15':'22:00'}. Embarque do ônibus a confirmar.`,
    });
    const ida=[...pontos.map(([local,hora])=>parada('IDA',local,hora,'EMBARQUE')),
      instituicao('IDA','IF','DESEMBARQUE'),instituicao('IDA','SENAC','DESEMBARQUE')];
    const volta=[instituicao('VOLTA','SENAC','EMBARQUE'),instituicao('VOLTA','IF','EMBARQUE'),
      ...[...pontos].reverse().map(([local])=>parada('VOLTA',local,'','DESEMBARQUE'))];
    return [...ida,...volta].map((p,i)=>({...p,ordem:i%10+1}));
  }
  if(typeof module==='object'&&module.exports) module.exports={modeloRota11};
  else root.modeloRota11=modeloRota11;
})(typeof window==='undefined'?globalThis:window);
