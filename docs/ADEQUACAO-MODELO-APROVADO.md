# Adequação ao modelo aprovado

Os diagramas fornecidos pelo autor e aprovados pelo professor permanecem
inalterados. O trabalho desta etapa foi realizado no banco, backend, interface
e testes. As propostas anteriores de modificar os diagramas foram descartadas.

## Correspondência entre modelo e implementação

O DER é conceitual. Algumas tabelas e campos físicos mantêm nomes anteriores
para preservar a aplicação e os dados; a correspondência é registrada abaixo.
As tabelas de execução de viagens e auditoria são complementos de implementação.

| Modelo aprovado | Implementação física / tela |
| --- | --- |
| USUARIOS: nome, email, senha_hash, tipo, ativo, criado_em | `usuarios`; tipo corresponde a `perfil`; situação em Usuários; BCrypt e data de criação mantidos |
| ALUNOS: matrícula, curso, período, telefone e usuário | `alunos`; novos campos e conta própria opcional em Alunos; turma mantida por compatibilidade |
| RESPONSAVEIS: CPF e telefone | `responsaveis`, ligado a `usuarios`; categoria Responsáveis |
| RESPONSAVEIS_ALUNOS: parentesco | `responsaveis_alunos`; vários responsáveis para vários alunos; editor Alunos → Vínculos |
| MOTORISTAS: CPF, CNH, validade | `motoristas`; CPF validado e único; CNH vencida bloqueia início de viagem |
| VEICULOS: placa, modelo, capacidade, ano, ativo | `veiculos`; formulário completo e filtro de veículos ativos na operação |
| ROTAS: nome, descrição, ativo | `rotas`; origem, destino e turno anteriores continuam disponíveis |
| Motorista opera rotas | `rotas_motoristas`; associações adicionais em Rotas → Veículos / motoristas; o motorista do veículo padrão também atende a rota |
| Rota utiliza veículos | `rotas_veiculos`; seleção do veículo disponível ao iniciar cada viagem |
| Associação motorista–veículo | `veiculos.motorista_id`, conforme caso de uso aprovado |
| PONTOS_EMBARQUE: nome, endereço, coordenadas, ordem, horário | `paradas`; nome corresponde a `local`; editor de itinerário com mapa e coordenadas |
| Aluno embarca em pontos, com ativo | `alunos_pontos`; autorização/inativação individual dos pontos em Vínculos |
| CONFIRMACOES_PRESENCA: data, tipo, confirmação, ponto e instante | `agendamentos`; tipo corresponde a `trajeto`, confirmado/cancelado a `status`, instante a `atualizado_em`; `parada_id` fixa a escolha por dia/trajeto |
| REGISTROS_PRESENCA: aluno, data, tipo, status, registro e rota/ponto | `participantes` associado a `viagens` e ao snapshot `viagem_paradas`; data/trajeto/rota vêm da viagem e embarque da ordem fixada |

## Fluxos novos

### Responsáveis e acesso do aluno

1. Cadastre uma conta com perfil **Aluno/Responsável** em Usuários.
2. Na categoria **Responsáveis**, associe essa conta e informe CPF/telefone.
3. Em **Alunos → Vínculos**, marque os responsáveis e informe o parentesco de
   cada um. Uma conta pode acompanhar vários alunos; cada aluno pode ter vários
   responsáveis. Todos operam a mesma agenda persistida daquele aluno.
4. Para acesso próprio do aluno, associe uma conta de perfil Aluno/Responsável
   no formulário de Alunos. Ele verá seu registro mesmo sem responsável vinculado.

Os vínculos antigos são migrados, sem inventar CPF ou dados pessoais ausentes.
Remover um responsável revoga o acesso aos dados do aluno na próxima consulta.
O histórico é acessível pelos vínculos atuais, não pelos vínculos de uma data
anterior. A identificação documental e a autorização do vínculo cabem à administração.

### Pontos e confirmação

Cadastre local, endereço, tipo, ordem, horário, latitude e longitude no
itinerário. O botão **Definir no mapa** preenche as coordenadas por clique;
as informações só são persistidas ao salvar o itinerário.

Em Vínculos, autorize os pontos possíveis e escolha os padrões de ida/volta.
Na agenda, o aluno/responsável escolhe um ponto autorizado por trajeto e salva
a confirmação. O ponto escolhido é armazenado no agendamento; não se perde
quando outro ponto padrão é escolhido depois. Desativar um ponto autorizado
cancela confirmações de hoje/futuras que o utilizam. Trocar a rota do aluno
desativa seus pontos anteriores e cancela confirmações futuras dessa associação.

Viagens em andamento bloqueiam a edição dos vínculos do aluno. No início da
viagem, o ponto escolhido precisa continuar autorizado e válido. O snapshot
inclui endereço e coordenadas; edições posteriores não reescrevem a viagem.
O acompanhamento mostra os pontos cadastrados mesmo sem GPS compartilhado.

### Associações de rota e inativação

O veículo padrão e seu motorista continuam sendo a configuração simples da
rota. Em **Veículos / motoristas**, associe outros veículos e motoristas; esses
vínculos são adicionais. Para remover uma atribuição padrão, altere também o
cadastro da rota ou o vínculo motorista–veículo correspondente.

O motorista escolhe um dos veículos ativos associados ao iniciar. O servidor
valida a atribuição, capacidade e disponibilidade do veículo/motorista.

- Usuário inativo não entra e perde sessões anteriores. Não é permitido
  inativar a própria conta, eliminar o último administrador ativo ou impedir
  que um motorista encerre sua viagem ativa.
- Rota inativa não aceita novas confirmações nem novos inícios; histórico e
  encerramento de uma viagem já iniciada continuam acessíveis.
- Veículo inativo não pode ser escolhido para uma nova viagem. Alterar um
  veículo em viagem continua bloqueado.
- A inativação preserva os registros e vínculos. Exclusões permanecem sujeitas
  às chaves estrangeiras e à preservação do histórico.

Campos novos podem ficar sem informação nos cadastros antigos. CPF informado
é validado e não pode duplicar outro registro da mesma categoria. Uma validade
de CNH informada e vencida impede iniciar viagem; o sistema não consulta órgãos
externos nem presume a validade de documentos ausentes.

## Migração e execução

Reinicie o backend na pasta `backend` com `mvn spring-boot:run`.
Flyway aplica `V7__adequacao_modelo_aprovado.sql` automaticamente; não apague
o volume nem altere migrações já aplicadas. Abra `http://localhost:8080`.

## Verificação

- `npm run test:modelo`: campos, responsáveis N:N, parentesco, conta do aluno,
  isolamento/revogação, ponto por confirmação, georreferenciamento, inativação,
  CNH vencida e associações N:N de rota.
- `npm run test:modelo:browser`: formulários, múltiplos responsáveis, parentesco,
  escolha de ponto, edição no mapa, inativação, redirecionamento e layout móvel.
- As suítes anteriores continuam cobrindo presença de ida/volta, concorrência,
  itinerário, capacidade, GPS, desembarque, relatórios e autenticação.

Use `MOBILYS_TEST_API` apontando para o banco isolado, conforme backend/README.md.
O teste novo de navegador utiliza o frontend empacotado no próprio backend.
