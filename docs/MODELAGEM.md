# Modelagem do Mobilys

Os diagramas desta seção representam a base das migrações V1–V6; os
complementos V7 e V8 estão descritos ao final. Diagramas de classes,
sequência e estados abaixo usam notação UML suportada pelo Mermaid; o último
diagrama usa notação entidade-relacionamento, não UML. O diagrama de casos de
uso em PlantUML está em [casos-de-uso.puml](casos-de-uso.puml).

## Arquitetura

```mermaid
flowchart LR
  A[Administrador] --> UI[Interface HTML / CSS / JavaScript]
  M[Motorista] --> UI
  R[Aluno / responsável] --> UI
  UI -->|JSON, cookies e CSRF| SEC[Spring Security]
  SEC --> C[Controllers REST]
  C --> S[Services: regras e transações]
  S --> P[JPA / JdbcTemplate]
  P --> DB[(PostgreSQL)]
  F[Flyway] --> DB
  GEO[Geolocation do navegador] -->|Permissão do motorista| UI
  OSM[OpenStreetMap: tiles] --> MAP[Leaflet no navegador]
  UI --> MAP
```

O Spring Boot também serve os arquivos estáticos empacotados, permitindo
executar a aplicação na mesma origem. Live Server continua disponível para
edição do frontend. As regras permanecem no servidor. A visualização de mapa
usa tiles externos; nomes, alunos e credenciais não são enviados ao provedor.
O carregamento do mapa revela ao provedor os tiles da região visualizada e o IP
do navegador, como ocorre em serviços de mapas web.

## Classes conceituais do domínio

```mermaid
classDiagram
  class Usuario {
    Long id
    String nome
    String email
    String perfil
    Long versao
  }
  class Motorista {
    Long id
    String cnh
  }
  class Veiculo {
    Long id
    String placa
    int capacidade
  }
  class Rota {
    Long id
    String nome
    Long versaoItinerario
  }
  class Parada {
    Long id
    String trajeto
    int ordem
    String tipo
    LocalTime horario
  }
  class Aluno {
    Long id
    String nome
    String matricula
  }
  class Agendamento {
    LocalDate dataServico
    String trajeto
    String status
  }
  class Viagem {
    Long id
    String status
    Long versao
    iniciar()
    chegar()
    avancar()
    encerrar()
  }
  class Participante {
    String status
    Instant entradaEm
    Instant desembarqueEm
    Instant saidaEm
  }
  class Evento {
    String acao
    String detalhe
    Instant em
  }
  Usuario "1" --> "0..1" Motorista : conta
  Motorista "0..1" --> "0..*" Veiculo : conduz
  Veiculo "0..1" --> "0..*" Rota : atende
  Rota "1" --> "0..*" Parada : organiza
  Rota "1" --> "0..*" Aluno : recebe
  Usuario "0..1" --> "0..*" Aluno : responsável
  Aluno "1" --> "0..*" Agendamento : confirma
  Rota "1" --> "0..*" Viagem : realiza
  Usuario "1" --> "0..*" Viagem : motorista autenticado
  Viagem "1" *-- "0..*" Participante
  Aluno "1" --> "0..*" Participante
  Viagem "0..1" --> "0..*" Evento
  Usuario "1" --> "0..*" Evento : autor
```

É um modelo conceitual: no código, parte das entidades usa JPA e parte é
manipulada por JdbcTemplate. Os métodos operacionais estão em `OperacaoService`.

## Sequência: confirmação, viagem e presença

```mermaid
sequenceDiagram
  actor R as Responsável
  participant UI as Interface
  participant API as Controller / Security
  participant S as OperacaoService
  participant DB as PostgreSQL
  actor M as Motorista
  R->>UI: Confirmar ida do aluno na data
  UI->>API: PUT agenda + cookie + CSRF
  API->>S: Identidade autenticada e dados validados
  S->>DB: Transação: validar vínculo / viagem não iniciada
  S->>DB: Gravar agenda e evento
  DB-->>UI: Confirmação de persistência
  M->>UI: Iniciar ida da rota
  UI->>API: POST viagens
  API->>S: Validar atribuição, capacidade e itinerário
  S->>DB: Fixar viagem, paradas e confirmados
  DB-->>UI: ID e versão da viagem
  M->>UI: Chegar ao ponto e registrar presença
  UI->>API: POST ações com versão
  API->>S: Validar motorista, etapa e participante
  S->>DB: Atualizar presença, versão e auditoria na mesma transação
  R->>UI: Acompanhar
  UI->>API: GET viagem
  API->>S: Restringir aos alunos vinculados à conta
  S-->>UI: Estado e horários persistidos
```

## Estados operacionais

```mermaid
stateDiagram-v2
  [*] --> EmDeslocamento: iniciar / snapshot
  EmDeslocamento --> NoPonto: CHEGAR
  NoPonto --> NoPonto: PRESENCA / auditar correção
  NoPonto --> NoPonto: DESEMBARCAR / registrar instante
  NoPonto --> EmDeslocamento: AVANCAR [existem próximas paradas]
  NoPonto --> ParadasConcluidas: AVANCAR [última parada e registros resolvidos]
  ParadasConcluidas --> Encerrada: ENCERRAR / apagar última posição GPS
  Encerrada --> [*]
```

No banco, os três estados intermediários são derivados de `EM_ANDAMENTO`,
`ponto_atual` e `no_ponto`. Após encerrar, as ações são recusadas. Versão antiga
retorna 409; não aplica novamente uma transição.

## Estrutura relacional

```mermaid
erDiagram
  usuarios ||--o| motoristas : conta
  usuarios o|--o{ alunos : responsavel
  motoristas o|--o{ veiculos : conduz
  veiculos o|--o{ rotas : atende
  rotas ||--o{ paradas : possui
  rotas ||--o{ alunos : organiza
  paradas o|--o{ alunos : embarque_ida_volta
  alunos ||--o{ agendamentos : agenda
  rotas ||--o{ viagens : origina
  usuarios ||--o{ viagens : motorista
  viagens ||--|{ viagem_paradas : snapshot
  viagens ||--o{ participantes : inclui
  alunos ||--o{ participantes : participa
  viagens ||--o| localizacoes : ultima_posicao
  viagens o|--o{ eventos : registra
  usuarios ||--o{ eventos : autor
  agendamentos {
    bigint id PK
    bigint aluno_id FK
    date data_servico UK
    varchar trajeto UK
    varchar status
  }
  participantes {
    bigint viagem_id PK,FK
    bigint aluno_id PK,FK
    varchar status
    timestamptz entrada_em
    timestamptz desembarque_em
    integer desembarque_ordem
    timestamptz saida_em
  }
  localizacoes {
    bigint viagem_id PK,FK
    double latitude
    double longitude
    double precisao
    timestamptz capturada_em
    timestamptz recebida_em
  }
```

Unicidades compostas: agenda `(aluno_id, data_servico, trajeto)`; viagem
`(rota_id, data_servico, trajeto)`; paradas `(rota_id, trajeto, ordem)`;
participante `(viagem_id, aluno_id)`. A ligação de paradas a alunos representa
duas FKs opcionais, uma para cada trajeto. O veículo da viagem é preservado pela
placa em snapshot e, desde V7, também pela FK `veiculo_id`.
`parada_original_id` do snapshot não tem
FK: permite manter o histórico após editar o itinerário original.

O DDL completo e as restrições estão em `backend/src/main/resources/db/migration`.

## Complementos V7 e V8

Os diagramas aprovados fornecidos pelo autor permanecem inalterados. A V7
adiciona responsáveis N:N, conta própria do aluno, pontos autorizados e
associações de veículos/motoristas, descritos na
[adequação ao modelo aprovado](ADEQUACAO-MODELO-APROVADO.md).

| Estrutura V8 | Papel |
| --- | --- |
| `agendamentos.destino_id` → `paradas.id` | Destino escolhido por aluno, data e trajeto; FK impede excluir uma parada referenciada |
| `participantes.destino_ordem` | Destino fixado no itinerário da viagem; não depende do cadastro atual da parada |
| `viagem_paradas.omitida_em` e `motivo_omissao` | Registro de um ponto pulado na volta, sem simular chegada |
| `eventos.acao = OMITIR_PARADA` | Autor, instante, ordem/local e motivo da omissão |

Na confirmação, o servidor valida rota, trajeto, tipo e ordem do destino.
No início, valida novamente e copia a ordem para o participante. Ao avançar
na volta, verifica a demanda de desembarque e registra as omissões e a versão
da viagem na mesma transação. Embarques e pontos mistos permanecem no percurso.
Presentes precisam desembarcar no destino antes do avanço. Dados anteriores
à V8 permanecem sem destino, sem inferência retroativa de fatos históricos.
