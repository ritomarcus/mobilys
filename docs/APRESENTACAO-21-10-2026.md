# Apresentação ao orientador — 21/10/2026

Dados fictícios preparados pela API local. Os horários complementares são
simulados; não representam uma operação real. Os registros anteriores foram preservados.

## Abrir o sistema

Em `backend`, execute `docker compose up -d --wait` e `mvn spring-boot:run`.
Abra http://localhost:8080. Se o backend já estiver ligado, use a instância existente.

O administrador usa o acesso local de `backend/.env`. Os acessos de motorista
e das duas famílias estão em `backend/target/demonstracao-local.json`, na lista
`contas`: campos `email` e `senha`. Esse arquivo é local e ignorado pelo Git.
Guarde uma cópia privada antes de executar `mvn clean`, que apaga `target`.

Use navegadores ou perfis diferentes para cada conta: abas comuns do mesmo
navegador compartilham a sessão. Não mostre o arquivo de senhas na apresentação.

## Cenários preparados

- **Rota 11 — apresentação 2026-10-21:** dois alunos fictícios, vinte paradas,
  capacidade de dois passageiros e ida/volta confirmadas para amanhã. Nenhuma
  viagem foi iniciada nesta rota pelo preparo. Também há confirmações para
  20/10, permitindo ensaiar hoje sem consumir os trajetos de amanhã.
- **Rota 11 — histórico simulado 2026-10-20:** ida e volta encerradas pela API,
  com presenças, ausência, desembarques e auditoria. Use a data 20/10 nos relatórios.
  A ida tem 50% de frequência; a volta, 100%; ambas, 75%.

As famílias possuem alunos nos dois cenários. Escolha a rota de apresentação
ao demonstrar o fluxo ao vivo e a rota de histórico ao consultar os resultados prontos.

## Roteiro de 12 a 15 minutos

1. Como administrador, mostre motorista, veículo, alunos, responsáveis e os
   vínculos da rota de apresentação. Abra o itinerário e mostre ida/volta.
2. Como Mariana, abra Agendamentos em 21/10. Ana tem embarque na Escola João
   Borges e destino IF na ida; IF e Escola João Borges na volta. Cancele e
   reconfirme uma agenda para mostrar os estados independentes.
3. Como Roberto, mostre Bruno: Posto Major → SENAC na ida; SENAC → Posto Major
   na volta. A conta não vê Ana. Deixe a ida e a volta confirmadas para ambos.
4. Como Carlos, em 21/10, inicie **ida da rota de apresentação**. Na Escola João
   Borges, registre Ana presente. Conclua os pontos seguintes e, no Posto Major,
   registre Bruno ausente. Mostre que uma presença pendente impede avançar.
5. Na conta de Mariana, abra Acompanhamento e mostre a etapa de Ana. GPS é
   opcional e depende de autorização do motorista; não é necessário para o fluxo.
6. No motorista, chegue ao IF e registre o desembarque de Ana. Conclua o IF,
   visite o SENAC e encerre. A saída da viagem e o desembarque são registros distintos.
7. Se houver tempo, inicie a volta: marque Bruno presente no SENAC e Ana
   presente no IF. Desembarque Bruno no Posto Major. Os seis pontos seguintes
   sem passageiros são omitidos; desembarque Ana na Escola João Borges e encerre.
8. No administrador, abra Relatórios, selecione 20/10 e busque a rota de
   **histórico simulado**. Mostre 3 presentes, 1 ausente e 75%. Filtre ida/volta,
   exporte CSV e abra a auditoria das viagens. Assim os relatórios já podem ser
   apresentados mesmo sem concluir o fluxo ao vivo.

Há uma viagem por rota/data/trajeto. Ensaiar hoje não ocupa as viagens de amanhã;
encerrar uma viagem amanhã não permite reiniciar o mesmo trajeto naquela data.

## Reexecutar o preparo

Na raiz, `node scripts/preparar-demonstracao.cjs`. O arquivo local registra os
IDs e permite retomar o preparo sem recriar cadastros concluídos. Preserve esse
arquivo. A reexecução pode reconfirmar agendas ainda não iniciadas do cenário.
O script exige a API ligada e utiliza as credenciais administrativas locais.

Verificação do preparo: relatório com 3 presentes, 1 ausente e frequência 75%,
e consulta das famílias confirmando o isolamento entre os alunos da apresentação.
