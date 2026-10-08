# Mobilys

Sistema de gestão de transporte estudantil em desenvolvimento. Frontend em
HTML, CSS, JavaScript e Bootstrap; backend Java 21/Spring Boot 4.1.1 e PostgreSQL.

## Funcional nesta etapa

- Login com e-mail/senha e sessão no servidor; o perfil vem da conta.
- Painel administrativo com viagens e indicadores reais de presença.
- Cadastro, edição e exclusão de usuários, motoristas, veículos, rotas e alunos.
- Vínculos por ID: conta → motorista → veículo → rota → aluno.
- Itinerários de ida e volta com paradas, horários, referências e ordem; proteção contra edições concorrentes.
- Validação no servidor, identificadores únicos e bloqueio de exclusão de registros vinculados.
- Senhas com BCrypt, proteção CSRF e autorização administrativa nos endpoints.
- Editar ou excluir usuário revoga suas sessões no próximo acesso; logout invalida a sessão.
- Vínculo de cada aluno à conta da família e aos pontos de embarque de ida e volta.
- Confirmações e cancelamentos por data e trajeto, com isolamento entre famílias.
- Viagens com controle de capacidade, chegada aos pontos, presenças e encerramento.
- Acompanhamento por etapa, histórico, auditoria, frequência, exportação CSV e impressão/PDF.
- GPS opcional autorizado pelo motorista, com mapa, precisão e indicação de posição antiga.
- Desembarque individual em paradas compatíveis e troca da própria senha.
- Responsáveis com CPF/telefone, vários vínculos por aluno e parentesco; conta própria opcional do aluno.
- Pontos com endereço/coordenadas, escolha de embarque por confirmação e associações adicionais de veículos/motoristas às rotas.
- Destino por confirmação, desembarque no ponto escolhido e omissão auditada de pontos sem passageiros na volta.
- Modelo da rota 11 para revisão no editor e filtro de ida/volta nos relatórios e CSV.
- Inativação de usuários, rotas e veículos; campos cadastrais previstos no modelo aprovado.

O login não aceita mais credenciais fictícias nem perfil escolhido pela URL.
Nenhuma página ativa carrega os dados do antigo protótipo ou grava cadastros em
localStorage. `js/app.js`, `js/dados.js`, `js/rotas.js` e seus testes históricos
permanecem como referência, mas não são carregados pelas páginas do sistema.

## Executar

Veja [o guia do backend](backend/README.md) para banco, configuração da primeira
conta administrativa e inicialização. Com o backend atualizado, abra
**http://localhost:8080**: a aplicação entrega também o frontend.
Live Server na porta 5500 continua disponível como alternativa para editar as telas.
Mantenha Docker/PostgreSQL e backend ligados.

Para o primeiro acesso, use os valores de `BOOTSTRAP_ADMIN_EMAIL` e
`BOOTSTRAP_ADMIN_PASSWORD` do arquivo **local** `backend/.env`. Não envie esse
arquivo ao Git. Em Cadastros, comece por uma conta com perfil Motorista, depois
cadastre o motorista, o veículo e a rota. Os alunos precisam de uma rota.

## Usar a operação

1. Como administrador, crie as contas de motorista e responsável, motorista,
   veículo, rota e seu itinerário de ida/volta; cadastre os alunos.
2. Em **Cadastros → Responsáveis**, vincule o responsável à conta. Em
   **Alunos → Vínculos**, selecione responsáveis, parentesco e pontos autorizados.
   O nome do responsável sozinho não concede acesso.
3. Entre como responsável e confirme a ida e/ou volta em **Agendamentos**.
4. Entre como motorista, inicie o trajeto, informe a chegada a cada ponto e
   registre presente ou ausente para cada aluno antes de concluir a parada.
5. Encerre a viagem após a última parada. Consulte histórico e relatórios.

O acompanhamento informa a etapa registrada e, quando compartilhada, a última
posição do dispositivo. O horário de saída indica o encerramento do trajeto;
o desembarque individual possui campo próprio. A família precisa confirmar
cada trajeto explicitamente. Configure paradas de desembarque no itinerário.
Recuperação automática de senha por e-mail e implantação em produção
(HTTPS, backup e monitoramento) ainda não estão implementadas. O administrador
pode redefinir senhas em Usuários. O acesso atual é destinado ao desenvolvimento local.

## Material do TCC

- [Requisitos e rastreabilidade](docs/REQUISITOS.md)
- [Análise histórica dos diagramas, anterior às adequações](docs/ANALISE-DIAGRAMAS.md)
- [Modelagem UML e estrutura relacional](docs/MODELAGEM.md)
- [Roteiro de demonstração](docs/DEMONSTRACAO.md)
- [Rota 11: percurso e cenários de demonstração do TCC](docs/ROTA-11.md)
- [Ensaio da rota 11, resultados e capturas para o TCC](docs/ENSAIO-ROTA-11.md)
- [Análise qualitativa técnica e protocolo de avaliação](docs/AVALIACAO.md)
- [Geolocalização: funcionamento e limites](docs/GEOLOCALIZACAO.md)

Os diagramas aprovados pelo professor permanecem inalterados. A implementação
foi adequada aos campos e relações antes pendentes; veja o
[guia de adequação ao modelo aprovado](docs/ADEQUACAO-MODELO-APROVADO.md).
A avaliação com participantes precisa ser realizada pelo autor.

Os registros de estudo já existentes no PostgreSQL foram preservados; não
representam dados reais de operação.

## Testes

Instale as dependências de teste com `npm install`.

- `npm test`: cliente HTTP, CSRF, vínculos e falhas de gravação.
- `npm run test:security`: testes HTTP de login, autorização, CSRF, revogação e logout.
- `npm run test:itinerario`: persistência, reordenação, validação e conflito de edição das paradas.
- `npm run test:browser`: teste real da interface no Microsoft Edge, incluindo os cinco cadastros, persistência, vínculos, exclusões protegidas e tamanhos de tela.
- `npm run test:operacao`: permissões, agenda, capacidade, concorrência, viagens, presenças e auditoria.
- `npm run test:operacao:browser`: fluxo completo entre administrador, família e motorista no Edge.
- `npm run test:localizacao`: permissões e validade do GPS, desembarque e troca de senha.
- `npm run test:modelo`: vínculos N:N, novos campos, inativação, pontos e associações de rota.
- `npm run test:modelo:browser`: novos cadastros e vínculos na interface, usando o frontend empacotado.
- `npm run test:rota11`: destinos, ida/volta, pontos compartilhados, omissões auditadas e histórico preservado.
- `npm run test:rota11:browser`: fluxo da rota 11 no Edge, filtro de trajeto, CSV e capturas em `docs/evidencias/rota11`.

Os testes de integração exigem API e PostgreSQL em execução. O teste de navegador abre
seu frontend na porta 5501; permita essa origem em `FRONTEND_ORIGINS`. Consulte
[as instruções](backend/README.md#testes). Use um banco separado: os testes
operacionais preservam registros de viagem e auditoria para inspeção.
Não execute contra banco de produção.

Bootstrap, ícones e fontes são carregados de CDNs; é necessária conexão à internet.
