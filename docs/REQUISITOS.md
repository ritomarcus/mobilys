# Mobilys — requisitos e rastreabilidade

## Origem e delimitação

Base: introdução, justificativa e objetivos do TCC fornecidos pelo autor em
06/10/2026. O objetivo geral é desenvolver um sistema web para gerenciar o
transporte estudantil, com foco no controle de presença de ida e volta e na
organização logística. O texto recebido não contém uma lista formal numerada
de requisitos nem critérios específicos da banca. Posteriormente, o autor
forneceu imagens de casos de uso e do DER, aprovadas pelo professor e preservadas
sem alterações. Consulte a [adequação da implementação](ADEQUACAO-MODELO-APROVADO.md).
Os itens abaixo detalham os critérios verificáveis da aplicação.

Os três atores são administrador, motorista e aluno/responsável. O perfil
`RESPONSAVEL` representa a conta que agenda e consulta um ou mais alunos; o
sistema não verifica documentalmente parentesco ou identidade. Cabe à
administração validar o vínculo. Confirmação de uso não significa presença.

## Requisitos funcionais

| ID | Requisito e critério de aceite | Implementação / evidência |
| --- | --- | --- |
| RF01 | Autenticar por e-mail/senha; negar credenciais erradas; restringir funções por perfil | Spring Security; `security.integration.cjs` |
| RF02 | Cadastrar/editar/excluir usuários, alunos, responsáveis, motoristas, veículos e rotas, impedindo duplicidades e exclusões de registros vinculados | Cadastros; `api.browser.cjs`, `modelo.browser.cjs`, testes Java |
| RF03 | Associar motorista à conta, veículo ao motorista e rota ao veículo | Cadastros por ID; testes de integração e navegador |
| RF04 | Organizar paradas de ida/volta, ordem, tipo, referência e horário previsto | Itinerário; `itinerario.integration.cjs` |
| RF05 | Vincular aluno à rota, a vários responsáveis com parentesco e aos pontos autorizados; permitir conta própria do aluno | Alunos → Vínculos; `modelo.integration.cjs` |
| RF06 | Confirmar/cancelar uso por aluno, data e trajeto independentemente | Agenda da família; bloqueio após início; `operacao.integration.cjs` |
| RF07 | Iniciar viagem com os confirmados, respeitando motorista atribuído e capacidade | Viagem e cópia do itinerário; `operacao.integration.cjs` |
| RF08 | Registrar presença/ausência somente após chegada ao embarque correspondente | Ações versionadas; correções auditadas; `operacao.integration.cjs` |
| RF09 | Concluir paradas e viagem preservando data de serviço, inclusive na virada do dia | `OperacaoIntegrationTest`, testes HTTP |
| RF10 | Consultar acompanhamento e histórico somente dos próprios alunos | Filtro no servidor; testes entre duas famílias |
| RF11 | Consultar frequência, presenças e ausências por período; filtrar e exportar | Relatórios, CSV e impressão/PDF; `operacao.browser.cjs` |
| RF12 | Registrar autor, instante e ação das alterações operacionais | Eventos transacionais; auditoria administrativa |
| RF13 | Alterar a própria senha validando a atual e encerrando sessões anteriores | Menu da conta; `localizacao.integration.cjs` |
| RF14 | Permitir recuperação assistida pela administração | Edição de usuário; instrução em “Esqueceu sua senha?”; identificação verificada fora do sistema |
| RF15 | Inativar usuários, veículos e rotas, revogando acesso e impedindo novas operações correspondentes | `modelo.integration.cjs`, `modelo.browser.cjs` |
| RF16 | Escolher ponto autorizado na confirmação e veículo associado no início da viagem; associar vários motoristas/veículos à rota | Agenda e associações; `modelo.integration.cjs` |
| RF17 | Persistir curso, período, telefone, CPF, validade da CNH, ano de fabricação e endereço/coordenadas; rejeitar CNH informada vencida ao iniciar | Cadastros e itinerário; `modelo.integration.cjs` |
| RF18 | Selecionar destino por confirmação, fixá-lo na viagem e impedir desembarque fora dele e avanço com desembarques pendentes no ponto | `rota11.integration.cjs`, `rota11.browser.cjs` |
| RF19 | Na volta, omitir pontos exclusivos de desembarque sem passageiros destinados a eles, preservando embarques, pontos mistos e auditoria | Migração V8; testes da rota 11 e regressão Java de viagens antigas |
| RC01 | Compartilhar localização opcional durante a viagem e indicar idade/precisão da leitura | Geolocation + Leaflet; API restrita; `localizacao.integration.cjs` |
| RC02 | Confirmar desembarque individual, com horário e parada próprios | Ação DESEMBARCAR; `localizacao.integration.cjs` |

RC01 e RC02 são complementos ao núcleo do TCC, não exigências explicitadas na
introdução. Nenhum dado fictício é convertido em presença ou localização real.

## Requisitos não funcionais

| ID | Requisito | Verificação / limite |
| --- | --- | --- |
| RNF01 | Persistência relacional e integridade | PostgreSQL, chaves estrangeiras, unicidade, Flyway V1–V8 |
| RNF02 | Autorização no servidor e isolamento entre contas | Casos 401/403/404, CSRF e revogação de sessão |
| RNF03 | Senhas protegidas | BCrypt; hash não exposto; senha atual exigida na troca pessoal |
| RNF04 | Interface adaptável a celular e desktop | Testes em larguras 320, 390 e 1440 px; sem rolagem horizontal do documento |
| RNF05 | Usabilidade e acessibilidade básica | Labels, foco visível, teclado, regiões de feedback, navegação móvel e alvos de toque; sem alegação de certificação WCAG |
| RNF06 | Consistência sob chamadas simultâneas | Versão de viagem/itinerário, transações e bloqueio compartilhado; testes de corrida |
| RNF07 | Rastreabilidade temporal | Instantes UTC do servidor; data de serviço America/Sao_Paulo; GPS distingue instante do dispositivo e recebimento |
| RNF08 | Falha de rede não deve confirmar gravação inexistente | Feedback de erro e atualização; `api.test.cjs`, `api.browser.cjs` |
| RNF09 | Minimizar localização armazenada | Só a última posição por viagem; apagada ao pausar/encerrar; sem histórico de trajetos GPS |
| RNF10 | Execução reproduzível | Maven, Compose, migrations e guias de execução/testes |

Atualização de acompanhamento a cada 10 segundos enquanto a página está
visível. Não representa comunicação em tempo real com garantia de entrega.
Não houve ensaio de carga nem validação de escalabilidade. A aplicação atual
usa um bloqueio transacional compartilhado nas escritas operacionais.

## Regras de negócio

1. Ida e volta possuem agendamentos e viagens distintos. Ausência de confirmação
   deixa o aluno fora da lista daquela viagem; não o marca automaticamente ausente.
2. A agenda pode ser alterada de hoje até 30 dias à frente, antes de iniciar o trajeto.
3. Uma rota possui no máximo uma viagem por dia e trajeto. Motorista e veículo
   não podem operar duas viagens ativas ao mesmo tempo.
4. A lista e o itinerário são copiados no início. Edições posteriores da rota
   não reescrevem os fatos da viagem.
5. Presença é registrada no ponto de embarque; correção permanece auditada.
6. Desembarque é independente do fim da viagem. Em itinerários com desembarque,
   deve haver uma parada compatível a partir de cada embarque confirmado e todos
   os presentes devem desembarcar antes de concluir a última parada.
7. Rotas antigas que contêm apenas embarques continuam executáveis; o sistema
   exibe desembarque não registrado. Não se inventam eventos para dados anteriores.
8. A frequência é `presentes / (presentes + ausentes) × 100`. Pendentes e
   cancelamentos não entram no denominador; sem registros, não há percentual.
9. A família consulta o histórico dos alunos atualmente vinculados à sua conta.
10. GPS não comprova presença nem desembarque. Requer ação e permissão do
    motorista. Ao sair da página, a coleta para; uma posição sem atualização
    por mais de 90 segundos é indicada como antiga.
11. Destino pertence à mesma rota/trajeto e permite desembarque a partir do
    embarque escolhido; um único destino compatível pode ser selecionado
    automaticamente. Rotas legadas que só têm embarques permanecem aceitas.
12. Somente a volta omite automaticamente pontos exclusivos de desembarque.
    Presentes a bordo e pendentes preservam seus destinos; destino desconhecido
    impede omissão enquanto o passageiro estiver pendente ou a bordo.

## Atendimento dos objetivos acadêmicos

| Objetivo do texto fornecido | Entrega | O que depende do autor |
| --- | --- | --- |
| Levantar/analisar requisitos | Este catálogo, critérios de aceite e limites | Validar com orientador e representantes do contexto estudado |
| Modelar arquitetura e banco | [Modelagem UML e ER](MODELAGEM.md) | Adequar apresentação/normas da instituição |
| Desenvolver protótipo navegável | Aplicação funcional com backend e PostgreSQL | Preparar equipamento e contas para a demonstração |
| Demonstrar e analisar qualitativamente | [Roteiro](DEMONSTRACAO.md), [análise e protocolo](AVALIACAO.md) | Realizar apresentação e coletar avaliação real, se exigida |

Os trabalhos e as referências bibliográficas mencionados na introdução não
foram verificados a partir de suas publicações originais nesta implementação.
Confirme referências, citações e formatação acadêmica antes da entrega.
