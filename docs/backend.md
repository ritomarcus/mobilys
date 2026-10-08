# Backend do Mobilys

## Situação atual

Usuários, alunos, motoristas, veículos e rotas usam a API Spring Boot, com
persistência no PostgreSQL. Login e logout usam Spring Security, senha BCrypt,
sessão HttpOnly, proteção CSRF e autorização por perfil no servidor.
`js/sistema.js` controla a sessão e `js/cadastros.js` os formulários reais.
O painel mostra viagens e indicadores de presença. As páginas ativas não carregam
mais `js/dados.js` nem os registros fictícios do localStorage.
Viagens, agenda, presenças, acompanhamento e relatórios usam a API;
`js/operacao.js` controla esses fluxos e `js/familia.js` associa família e embarques.

## Primeira entrega

Banco, migrations, autenticação, sessão, painel e cadastros administrativos
estão implementados. A tecnologia definida é Java com Spring Boot e PostgreSQL.

Consulte [o guia de execução](../backend/README.md). Vínculos motorista–conta,
veículo–motorista, rota–veículo e aluno–rota usam IDs e chaves estrangeiras.
Os itinerários de ida/volta já permitem gerenciar paradas, ordem e horários,
com controle de versão e IDs estáveis. O vínculo responsável–aluno e a operação
de viagens foram implementados na migração V5. A V6 adiciona posição GPS e
desembarque individual. A V7 implementa responsáveis e associações N:N, pontos
autorizados, inativação e campos do modelo aprovado. Consulte o
[guia de correspondência](ADEQUACAO-MODELO-APROVADO.md). Os registros de estudo existentes
no banco foram preservados.

## Modelo de dados

- Usuários: identidade, email único, senha com hash e perfil de acesso.
- Alunos e responsáveis: vínculo explícito entre usuário responsável e alunos.
- Motoristas, veículos e rotas: vínculos por ID, substituindo referências por nome.
- Paradas: rota, trajeto, ordem, local, tipo e horário previsto.
- Vínculos dos alunos: rota, conta do responsável e pontos de embarque de ida/volta.
- Agendamentos: aluno, data de serviço, trajeto e confirmação ou cancelamento.
- Viagens: rota, motorista, veículo, data de serviço, trajeto e estado operacional.
- Participantes da viagem: lista de alunos fixada no início do percurso.
- Presenças: viagem, aluno, situação, entrada e saída.
- Eventos de auditoria: autor autenticado, instante, ação e valores anteriores e novos.

## Regras implementadas

- Ida e volta têm confirmações independentes; confirmação não é presença.
- Após iniciar a viagem, bloquear alterações de agendamento daquele trajeto.
- Registrar presença somente durante a viagem e no ponto correspondente.
- Garantir uma presença por aluno e viagem e preservar as correções na auditoria.
- Administradores gerenciam cadastros e relatórios; motoristas operam somente
  suas viagens; responsáveis consultam e agendam somente seus alunos vinculados.
- Aplicar autorização e validação no servidor, independentemente da interface.
- Gerar os instantes de auditoria no servidor e armazená-los com referência UTC.
  Usar um fuso operacional explícito para datas de serviço e exibição.
- Identificar viagens por ID persistente: uma viagem iniciada antes da meia-noite
  deve poder ser concluída depois da virada do dia.
- A saída corresponde ao encerramento da viagem. O desembarque individual
  tem horário e parada próprios; um evento não substitui o outro.
- Não converter dados fictícios ou horários previstos em eventos reais de auditoria.
- Executar mudanças de estado e seus eventos de auditoria na mesma transação,
  tratando chamadas repetidas e alterações concorrentes.

## Integrações concluídas

1. Banco, migrações, configuração de ambiente e autenticação com sessão.
2. Cadastros e vínculos com validação e autorização por perfil.
3. Agendamentos e lista de participantes por trajeto.
4. Operação de viagens, presenças e eventos de auditoria.
5. Histórico, filtros de relatório, exportação e indicadores com dados do servidor.
6. Testes de acesso entre perfis, isolamento entre responsáveis, concorrência,
   persistência e viagens que atravessam a meia-noite.

Módulos pendentes não devem apresentar resultados fictícios nem simular gravações.
As telas só devem confirmar uma alteração depois da resposta bem-sucedida da API.
