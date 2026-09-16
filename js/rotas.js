const ROTAS_BASE = [
  {
    id: 10, numero: '10', nome: 'Rota 10 — São João da Boa Vista', turno: 'Manhã',
    origem: 'Aguaí', destino: 'São João da Boa Vista',
    instituicoes: ['UNIFEOB', 'UNESP', 'Externato', 'Anglo', 'Instituto Federal'],
    fonte: 'Material da Prefeitura Municipal de Aguaí enviado pelo usuário',
    horarioRetorno: null, horarioChegada: null,
    paradas: [
      { horario: '05:50', local: 'Bairro Citta', referencia: 'Caixa d’água' },
      { horario: '05:55', local: 'Praça Mário Covas', referencia: 'Supermercado Paraíso' },
      { horario: '06:00', local: 'Rua Wilson Barbosa Braga', referencia: 'Mercado do Povo' },
      { horario: '06:08', local: 'Garagem Municipal', referencia: '' },
      { horario: '06:10', local: 'Praça Governador Carvalho Pinto', referencia: 'Assistência' },
      { horario: '06:15', local: 'Avenida Castelo Branco', referencia: 'Ponto de ônibus Boi Chique' },
      { horario: '06:20', local: 'Av. Adolfo Simon, 52', referencia: 'Posto do Major' },
    ],
  },
  {
    id: 11, numero: '11', nome: 'Rota 11 — São João da Boa Vista', turno: 'Noite',
    origem: 'Aguaí', destino: 'São João da Boa Vista',
    instituicoes: ['Fazenda UNIFEOB', 'Instituto Federal'],
    fonte: 'Material da Prefeitura Municipal de Aguaí enviado pelo usuário',
    horarioRetorno: null, horarioChegada: null,
    paradas: [
      { horario: '17:50', local: 'Escola Municipal João Borges', referencia: '' },
      { horario: '17:55', local: 'Creche Municipal Laura Sorense', referencia: '' },
      { horario: '18:00', local: 'Av. Wilson Barbosa Braga', referencia: 'Lumens' },
      { horario: '18:15', local: 'Praça Governador Carvalho Pinto', referencia: 'Posto de Saúde' },
      { horario: '18:20', local: 'Avenida Castelo Branco', referencia: 'Ponto de ônibus Boi Chique' },
      { horario: '18:25', local: 'Av. Adolfo Simon, 52', referencia: 'Posto do Major' },
    ],
  },
];

// Retornos inteiramente fictícios para apresentação do template.
ROTAS_BASE.forEach(rota => {
  const inicio = rota.id === 10 ? 720 : 1330;
  const hora = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  rota.paradasVolta = [
    ...rota.instituicoes.map((local, i) => ({ horario: hora(inicio + i * 5), local, referencia: 'Embarque · São João da Boa Vista', tipo: 'embarque' })),
    ...[...rota.paradas].reverse().map((p, i) => ({ ...p, horario: hora(inicio + rota.instituicoes.length * 5 + 30 + i * 5), tipo: 'desembarque' }))
  ];
  rota.horarioRetorno = rota.paradasVolta[0].horario;
  rota.horarioChegada = rota.paradasVolta[rota.paradasVolta.length - 1].horario;
});
