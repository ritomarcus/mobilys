# Backend Mobilys

Java 21 como versão de compilação, Spring Boot 4.1.1, Maven e PostgreSQL.
O Spring Security mantém a sessão e protege os endpoints; Flyway versiona o banco.
Alunos e rotas usam JPA; os novos cadastros usam JdbcTemplate com transações.

## Iniciar no Windows

Na pasta `backend`, configure o `.env` local. Caso ainda não exista:

```powershell
Copy-Item .env.example .env
```

Defina `POSTGRES_PASSWORD`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`.
A senha inicial é obrigatória, sem mínimo de 12 caracteres; aceita até 64 caracteres
e até 72 bytes UTF-8. Senhas vazias ou compostas apenas por espaços são recusadas.
Não reutilize a senha do banco. No ambiente já preparado, as credenciais de
administração foram adicionadas ao `.env` local com uma senha aleatória.

```powershell
docker compose up -d --wait
mvn spring-boot:run
```

A aplicação agora lê `.env` automaticamente quando iniciada dentro de `backend`.
Se `DB_PASSWORD` já estiver definida no terminal, ela tem prioridade sobre
`POSTGRES_PASSWORD`. Para usar o valor do arquivo:

```powershell
Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
```

O administrador inicial só é criado se não existir nenhum usuário. Alterar as
variáveis de bootstrap depois não troca a senha de uma conta existente. Depois
do primeiro acesso, é possível alterar a senha em **Cadastros → Usuários**;
editar sua própria conta exige entrar novamente. As variáveis de bootstrap
podem ser removidas do `.env` após criar a conta.

Se o backend já estava em execução, use Ctrl+C e execute novamente para carregar
as alterações. Não precisa apagar o volume do banco. Flyway aplica as migrações até V7
preservando alunos e rotas existentes.

Abra **http://localhost:8080** para usar frontend e API na mesma origem.
Os arquivos estáticos são copiados pelo Maven; reinicie o comando após editar
o frontend para atualizar essa cópia. Como alternativa de desenvolvimento,
abra `index.html` pelo Live Server em `http://127.0.0.1:5500` ou
`http://localhost:5500`. Entre com o e-mail e a senha de bootstrap. O frontend
usa o mesmo hostname para o backend na porta 8080, permitindo o cookie de sessão.
Não use `file://` nem misture `localhost` e `127.0.0.1` na configuração.

## Executar pelo VS Code

Com a pasta `mobilys` aberta, Docker Desktop iniciado e as extensões Java/Spring
Boot carregadas, abra **Executar e Depurar**, selecione **Mobilys — Spring Boot**
e pressione **F5**. A configuração em `.vscode/launch.json` executa na pasta
`backend`, onde o `.env` é lido. A tarefa anterior inicia PostgreSQL pelo Compose
e copia os recursos do frontend com Maven. Aguarde a importação do projeto Java
antes da primeira execução.

Abra **http://localhost:8080** após a inicialização. Se já houver outra execução
do backend nessa porta, encerre-a antes de usar F5. Para parar a depuração, use
**Shift+F5**; o container PostgreSQL continua disponível. As extensões auxiliam
o desenvolvimento; Java, Maven e Docker continuam sendo usados pela configuração.

## Configuração

| Variável | Finalidade |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Banco e credenciais do Compose |
| `DB_URL` | URL JDBC; padrão `jdbc:postgresql://localhost:5432/mobilys` |
| `DB_USER`, `DB_PASSWORD` | Substituem as credenciais do `.env` |
| `PORT` | Porta HTTP; padrão 8080 |
| `SERVER_ADDRESS` | Interface de escuta; padrão 127.0.0.1 |
| `FRONTEND_ORIGINS` | Origens permitidas, separadas por vírgula; padrão localhost e 127.0.0.1 na porta 5500 |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Criação única da primeira conta |
| `COOKIE_SECURE` | Exige HTTPS no cookie; padrão false para desenvolvimento HTTP local |

Ao mudar o nome do banco no Compose, configure `DB_URL`. Alterar a senha no
arquivo não altera a senha de um PostgreSQL já inicializado em volume existente.
`js/config.js` define a URL da API para o navegador. Não coloque senhas nesse arquivo.

## Sessão e permissões

- `GET /api/auth/csrf`: retorna token e nome do cabeçalho CSRF, criando sessão se necessário.
- `POST /api/auth/login`: recebe formulário com `email` e `password`, mais token CSRF; retorna 204 ou 401.
- `GET /api/auth/me`: retorna ID, nome, e-mail e perfil autenticado.
- `POST /api/auth/logout`: exige token CSRF, invalida a sessão e retorna 204.

Use cookies (`credentials: include` no fetch). O cliente em `js/api.js` obtém o
token CSRF e renova-o após login/logout. Não são usados tokens no localStorage.
A sessão expira após 30 minutos de inatividade; reiniciar o backend também
encerra as sessões atuais, pois ficam em memória. Senhas são armazenadas com
BCrypt e nunca retornadas nos DTOs. Cookies são HttpOnly e SameSite=Lax.

Todos os cadastros exigem perfil **ADMIN**. Motoristas operam suas viagens;
responsáveis agendam e consultam somente seus alunos vinculados. Alterar a URL ou enviar um perfil no
login não concede permissões. Mudanças em contas invalidam sessões anteriores.

## Cadastros e vínculos

`/api/alunos`, `/api/rotas`, `/api/usuarios`, `/api/motoristas`, `/api/veiculos` e `/api/responsaveis`
oferecem GET (lista), POST (criação), PUT `/{id}` e DELETE `/{id}`.
Alunos e rotas também oferecem GET `/{id}`.

| Recurso | Campos do corpo |
| --- | --- |
| Usuário | `nome`, `email`, `perfil` (`ADMIN`, `MOTORISTA`, `RESPONSAVEL`), `senha`, `ativo` |
| Motorista | `nome`, `cnh` (11 dígitos), `telefone`, `usuarioId`, `cpf` opcional (11 dígitos), `validadeCnh` opcional |
| Veículo | `placa`, `modelo`, `capacidade` (1 a 200), `motoristaId` opcional, `anoFabricacao` opcional, `ativo` |
| Rota | `nome`, `turno`, `origem`, `destino`, `veiculoId` opcional, `descricao`, `ativo` |
| Aluno | `nome`, `matricula`, `turma`, `responsavel` (nome), `rotaId`, `curso`, `periodo`, `telefone`, `usuarioId` opcional |
| Responsável | `usuarioId`, `cpf` opcional (11 dígitos), `telefone` |

`GET/PUT /api/alunos/{id}/familia` consulta e salva responsáveis com parentesco,
pontos autorizados e pontos padrão. `GET/PUT /api/rotas/{id}/associacoes` gerencia
veículos e motoristas adicionais. Os contratos e as regras estão no
[guia do modelo aprovado](../docs/ADEQUACAO-MODELO-APROVADO.md).

A senha é obrigatória ao criar usuário; omitida ou vazia na edição mantém a
atual. Um motorista precisa de uma conta de perfil MOTORISTA, que só pode ser
vinculada uma vez. Não é possível excluir sua própria conta ou mudar seu próprio
perfil. Uma conta vinculada a motorista não pode mudar para outro perfil.

Placas são normalizadas sem hífen e em maiúsculas. Matrícula, nome da rota e
e-mail são únicos sem diferenciar maiúsculas. Chaves estrangeiras bloqueiam
exclusão de registros vinculados. Erros retornam 400 (validação), 401 (sem sessão),
403 (permissão/CSRF), 404 (inexistente) ou 409 (duplicidade/vínculos).

Crie os registros nesta ordem: usuário → motorista → veículo → rota → aluno.
A capacidade é validada ao iniciar a viagem, contando os alunos confirmados.

## Itinerários das rotas

Em **Cadastros → Rotas → Itinerário**, adicione paradas de ida e volta,
informe local, referência opcional, horário previsto e operação (embarque,
desembarque ou ambos). Use **Subir**, **Descer** e **Remover** para organizar
o percurso. As alterações só são persistidas em **Salvar itinerário**.

`GET /api/rotas/{id}/itinerario` retorna `{ versao, paradas }`.
`PUT /api/rotas/{id}/itinerario` recebe a versão consultada e a lista completa
(até 200 paradas). Cada parada tem `id` opcional ao criar, `trajeto` (`IDA` ou
`VOLTA`), `ordem`, `local`, `referencia`, `horario` e `tipo` (`EMBARQUE`,
`DESEMBARQUE` ou `AMBOS`), `endereco`, `latitude` e `longitude` opcionais.
As coordenadas devem ser informadas juntas e podem ser escolhidas no mapa.
A ordem de cada trajeto começa em 1 e não tem lacunas.

O servidor preserva os IDs ao editar e reordenar. A gravação é transacional e
bloqueia a rota durante a alteração; versão antiga retorna 409. A tela mantém
as edições não salvas e orienta reabrir para consultar a versão atual. Ida e
volta podem ter itinerários diferentes. Horários são locais e previstos;
ainda não representam eventos de uma viagem. Excluir uma rota sem alunos
também remove suas paradas.

## Testes

Para os testes Java, crie um banco separado, pertencente ao usuário da aplicação:

```powershell
docker compose exec db createdb -U mobilys mobilys_test
$env:DB_TEST_URL = 'jdbc:postgresql://localhost:5432/mobilys_test'
mvn test
```

Crie o banco apenas uma vez. Esses testes validam a persistência e as restrições
de alunos/rotas. Cada teste desfaz seus registros com rollback.

Para os testes HTTP e navegador, mantenha o backend ligado. Antes de iniciar,
adicione a origem de teste:

```powershell
$env:FRONTEND_ORIGINS = 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501'
mvn spring-boot:run
```

Em outro terminal, na raiz do projeto:

```powershell
npm install
npm test
npm run test:security
npm run test:itinerario
npm run test:browser
```

As credenciais administrativas dos testes são lidas do `.env` local ou das
variáveis `MOBILYS_TEST_EMAIL` e `MOBILYS_TEST_PASSWORD`. Se você já mudou a senha
no sistema, use as variáveis com a senha atual. `MOBILYS_TEST_API` pode alterar
a URL padrão `http://127.0.0.1:8080/api`. Nunca use um banco de produção.
O teste da interface exige Microsoft Edge e acesso aos CDNs.

## Operação de transporte

Após cadastrar a rota e seu itinerário, cadastre as contas e os registros em
**Responsáveis**. Use **Alunos → Vínculos** para definir responsáveis, parentesco
e embarques autorizados de ida/volta. Só paradas de embarque ou
ambos, pertencentes à rota e ao trajeto, são aceitas. Trocar a rota do aluno
limpa seus pontos antigos; será necessário selecionar os novos.

O responsável confirma ou cancela cada trajeto para hoje ou até 30 dias à
frente. Iniciar uma viagem fixa os alunos confirmados e uma cópia do itinerário,
motorista e placa. O motorista só pode iniciar suas rotas, uma viagem por vez;
o mesmo veículo também não pode estar em duas viagens ativas.

Em cada ponto, o motorista registra chegada e presença/ausência. Deve resolver
as presenças pendentes antes de avançar. Pode corrigir enquanto estiver no ponto;
as correções ficam na auditoria. Ao concluir todas as paradas, encerra a viagem.
As viagens ativas continuam acessíveis depois da meia-noite, pela mesma ID.
Data de serviço usa America/Sao_Paulo; instantes vêm do servidor em UTC.

Alterações de vínculos/alunos e veículos em viagem são bloqueadas. Agendamentos do trajeto
iniciado não podem mudar. Histórico e auditoria impedem excluir registros
referenciados. Viagens têm versão: uma ação com versão antiga recebe 409.
As escritas de operação e cadastros usam um bloqueio transacional compartilhado
para evitar conflitos. Essa abordagem prioriza consistência nesta instalação;
maior escala exigirá particionar os bloqueios e paginar as consultas.

Endpoints sob `/api/operacao`, com sessão e CSRF nas escritas:

| Endpoint | Uso |
| --- | --- |
| GET `/hoje` | Data operacional do servidor |
| GET `/vinculos`, PUT `/alunos/{id}/vinculos` | Compatibilidade com o vínculo simples anterior; a tela atual usa `/api/alunos/{id}/familia` |
| GET `/familia/alunos` | Alunos da conta responsável |
| GET `/agenda?data=AAAA-MM-DD`, PUT `/agenda` | Confirmação por aluno, data e trajeto |
| GET `/motorista/rotas` | Rotas atribuídas ao motorista |
| GET `/viagens?data=AAAA-MM-DD`, GET `/viagens/{id}` | Lista e detalhe autorizado |
| POST `/viagens` | Iniciar com `rotaId`, `trajeto` e `veiculoId` opcional |
| POST `/viagens/{id}/acoes` | `versao`, `acao`, `alunoId` e `status` quando presença |
| GET `/historico?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Registros; intervalo máximo de 366 dias |
| GET `/viagens/{id}/eventos` | Auditoria administrativa |

As ações são `CHEGAR`, `PRESENCA`, `AVANCAR` e `ENCERRAR`. A presença aceita
`PRESENTE` ou `AUSENTE`. O vínculo recebe `responsavelUsuarioId`, `paradaIdaId`,
`paradaVoltaId`. A agenda recebe `alunoId`, `data`, `trajeto` (`IDA`/`VOLTA`) e
`status` (`CONFIRMADO`/`CANCELADO`) e `paradaId` opcional. Sem `paradaId`, usa o
ponto padrão; a confirmação sempre exige um ponto autorizado para o trajeto.

Histórico e relatórios incluem filtros, frequência, CSV e impressão/PDF.
Frequência considera presentes e ausentes; pendentes e cancelamentos são
excluídos. A família vê apenas os alunos atualmente vinculados à sua conta.
O acompanhamento combina etapas manuais e GPS opcional. `DESEMBARCAR` registra
um evento individual nas paradas de desembarque/ambos, preservando a diferença
entre `desembarque_em` e `saida_em` (fim do trajeto). Consulte
[localização e desembarque](../docs/GEOLOCALIZACAO.md) para endpoints e regras.

### Testar a operação em banco separado

Em `backend`, crie o banco uma única vez e inicie uma segunda API:

```powershell
docker compose exec -T db createdb -U mobilys mobilys_operacao_test
$env:DB_URL = 'jdbc:postgresql://localhost:5432/mobilys_operacao_test'
$env:PORT = '8081'
$env:FRONTEND_ORIGINS = 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501'
mvn spring-boot:run
```

Em outro terminal, na raiz:

```powershell
$env:MOBILYS_TEST_API = 'http://127.0.0.1:8081/api'
npm run test:operacao
npm run test:operacao:browser
npm run test:localizacao
npm run test:modelo
npm run test:modelo:browser
```

Os testes deixam dados no banco isolado, pois viagens e auditoria são
preservadas. Os testes Java também cobrem a virada de dia com relógio controlado;
use `DB_TEST_URL` e `mvn test` como descrito acima. Feche o terminal da API de
teste ao terminar; use um terminal novo para voltar ao banco normal.

## Próximas etapas

As adequações ao modelo aprovado foram implementadas na V7; consulte o
[guia atualizado](../docs/ADEQUACAO-MODELO-APROVADO.md) para novos campos,
responsáveis, pontos, associações e inativação. Permanecem como evoluções a
recuperação de senha por e-mail e preparação para produção (HTTPS, implantação,
backup e monitoramento). A recuperação atual é assistida pela administração;
usuários autenticados podem trocar a própria senha no menu da conta.
