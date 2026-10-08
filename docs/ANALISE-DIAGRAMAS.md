# Análise dos diagramas enviados pelo autor

**Registro histórico, superado pela orientação do autor:** os diagramas já foram
aprovados pelo professor e não devem ser alterados. As sugestões abaixo de
revisão dos diagramas ficam descartadas. Os campos e vínculos identificados
como ausentes foram implementados na migração V7. A referência atual é o
[guia de adequação ao modelo aprovado](ADEQUACAO-MODELO-APROVADO.md).

Análise das imagens de casos de uso e modelo entidade-relacionamento recebidas
na conversa, comparadas com a implementação atual. As imagens originais não
foram alteradas. Este documento registra diferenças; não assume que todas as
cardinalidades desenhadas já foram aprovadas como regras definitivas.

## Casos de uso

Os atores Administradores, Motoristas e Alunos/Responsáveis correspondem aos
três perfis da aplicação. Os fluxos de cadastro, associações, confirmação,
cancelamento, presença em ida/volta, acompanhamento, histórico e relatório
estão cobertos por telas e API. A autenticação é comum aos perfis.

O principal ajuste é o uso de `<<extend>>`: inserir, atualizar e excluir são
objetivos distintos e não precisam ser extensões de listar. Estar acessível
por um botão de uma listagem não estabelece uma relação UML de extensão.
Pode-se associar o administrador diretamente a essas operações ou agrupá-las
em pacotes de gestão. `<<extend>>` deve indicar comportamento opcional inserido
em um caso base, com condição/ponto de extensão identificado.

Iniciar, registrar presença e encerrar são etapas com pré-condições e estado.
O ciclo é explicado melhor pelo diagrama de atividade/estados, mantendo no
diagrama de casos de uso os objetivos de interação. A autenticação pode ser
uma pré-condição dos casos protegidos, sem repetir `<<include>>` em todos.
Nomeie o limite do sistema como Mobilys e posicione todos os atores fora dele.

## Modelo de dados

A separação de CONFIRMACOES_PRESENCA e REGISTROS_PRESENCA é coerente: intenção
de uso e embarque efetivo são fatos diferentes. A associação
RESPONSAVEIS_ALUNOS com parentesco também representa um cenário importante.
Entretanto, o DER ainda não representa a execução de uma viagem como entidade.

Adicionar VIAGENS permite distinguir rota planejada de execução em determinada
data/trajeto. Deve guardar motorista, veículo/snapshot, início, fim e estado.
O registro de presença precisa identificar aluno e viagem, com unicidade desse
par, em vez de depender apenas de data/tipo/rota. A aplicação já adota essa
abordagem, incluindo snapshot das paradas e eventos de auditoria.

As relações “é” entre USUARIOS e perfis devem ser esclarecidas. Se representam
especialização, não convém dar a entender que uma única conta corresponde a
vários motoristas. Uma conta individual pode corresponder a no máximo um
cadastro de motorista; a obrigatoriedade de conta para aluno precisa ser
definida. O acesso por responsável não obriga o aluno a ter login próprio.

As relações motorista–rota e rota–veículo parecem permitir vários registros
em ambos os lados. Se isso é intencional, precisam de entidades associativas
e regras de vigência/atribuição. Se a intenção é um veículo por rota e um
motorista por veículo no cadastro atual, as cardinalidades devem expressar
essa restrição. A viagem preserva a atribuição efetivamente utilizada.

## Diferenças concretas entre DER e código

| Item do DER | Implementação atual | Pendência para equivalência |
| --- | --- | --- |
| Responsáveis N:N alunos, com parentesco | Uma conta responsável por aluno; uma conta pode ter vários alunos | Tabela associativa e telas/permissões para múltiplos responsáveis |
| Cadastro de responsáveis com CPF/telefone | Conta de usuário; nome do responsável no aluno | Cadastro específico ou campos complementares validados |
| Aluno como usuário, curso, período e telefone | Nome, matrícula, turma, responsável, rota; sem login individual de aluno | Definir acesso próprio de aluno e mapear/adicionar campos |
| CPF e validade CNH do motorista | Nome, CNH, telefone e conta | Campos e regras de validação/impedimento |
| Veículo com ano de fabricação e ativo | Placa, modelo, capacidade e motorista | Campos e fluxo de inativação |
| Usuário com ativo | Conta, perfil, versão e data de criação | Desativação explícita e revogação de acesso |
| Rota com descrição e ativo | Nome, turno, origem, destino e veículo | Descrição/inativação, se mantidas no modelo definitivo |
| Pontos com latitude/longitude | Paradas com local, referência, ordem, tipo e horário | Coordenadas e edição/visualização dos pontos no mapa |
| Confirmação ligada a ponto específico | Agenda aluno/data/trajeto; embarque vem do vínculo atual do aluno | Registrar ponto na confirmação, se a família puder escolhê-lo por dia |
| Motorista–rota e rota–veículo N:N | Atribuição atual pela cadeia conta → motorista → veículo → rota | Definir multiplicidade e modelar associações caso necessário |
| Execução e auditoria | VIAGENS, PARTICIPANTES, VIAGEM_PARADAS e EVENTOS | Incluir essas entidades no DER acadêmico |

GPS do veículo não equivale a coordenadas cadastrais dos pontos de embarque.
O mapa implementado acompanha a última posição compartilhada, sem desenhar
um itinerário georreferenciado.

## Encaminhamento

O diagrama de casos de uso corresponde, em grande parte, ao sistema funcional.
O DER é uma referência conceitual mais ampla e ainda não equivale ao esquema
implementado. Antes de declarar conformidade integral, o autor deve decidir
as regras de múltiplos responsáveis, conta do aluno, atribuições de veículos
e escolha de pontos; depois alinhar banco, API, interface, testes e diagramas.
Campos cadastrais adicionais não devem ser apresentados como implementados
antes dessa adaptação.
