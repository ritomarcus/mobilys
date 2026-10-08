# Rota 11 — cenário para demonstrações do TCC

Fonte: percurso e horários relatados pelo autor, que realiza a rota, nesta
conversa em 8 de outubro de 2026. Este registro não é uma tabela oficial da
prefeitura. Os pontos e a ordem representam o relato; contas, passageiros e
resultados do ensaio devem ser fictícios e identificados como demonstração.

## Horários das aulas

O autor informou os seguintes horários acadêmicos das instituições:

| Instituição | Início das aulas | Término das aulas |
| --- | --- | --- |
| IF | 19:00 | 22:15 |
| SENAC | 19:00 | 22:00 |

Esses horários são referências das aulas. Os horários exatos de chegada e
embarque do ônibus nas instituições ainda precisam ser confirmados, assim
como os desembarques em Aguaí na volta. O término das aulas no SENAC ocorre
antes do IF, acompanhando a ordem de atendimento relatada para o retorno.
Não foram estimados tempos de deslocamento entre os pontos.

## Ida

Em Aguaí, o veículo recolhe os alunos nos oito pontos abaixo. Depois segue
para o IF e, em seguida, para o SENAC. Não foram acrescentados endereços,
coordenadas ou tempos de deslocamento não informados pelo autor.

| Ordem | Ponto | Horário do transporte informado | Operação |
| --- | --- | --- | --- |
| 1 | Escola João Borges | 18:00 | Embarque |
| 2 | Creche Laura Sorense | 18:03 | Embarque |
| 3 | Lumens | 18:05 | Embarque |
| 4 | Esquina Aldo Veterinário | 18:08 | Embarque |
| 5 | Garagem | 18:10 | Embarque |
| 6 | Posto de Saúde | 18:15 | Embarque |
| 7 | Ponto de Ônibus — Av. Castelo Branco | 18:20 | Embarque |
| 8 | Posto Major | 18:25 | Embarque |
| 9 | IF | Não informado | Desembarque |
| 10 | SENAC | Não informado | Desembarque |

## Volta

O percurso é o mesmo, no sentido inverso: o veículo recolhe os alunos no
SENAC, depois no IF, e retorna aos pontos de Aguaí de trás para frente.
As aulas terminam no SENAC às 22:00 e no IF às 22:15. Os horários exatos de
embarque do ônibus nessas instituições e de desembarque em Aguaí ainda não
foram confirmados.

| Ordem | Ponto | Operação |
| --- | --- | --- |
| 1 | SENAC | Embarque |
| 2 | IF | Embarque |
| 3 | Posto Major | Desembarque |
| 4 | Ponto de Ônibus — Av. Castelo Branco | Desembarque |
| 5 | Posto de Saúde | Desembarque |
| 6 | Garagem | Desembarque |
| 7 | Esquina Aldo Veterinário | Desembarque |
| 8 | Lumens | Desembarque |
| 9 | Creche Laura Sorense | Desembarque |
| 10 | Escola João Borges | Desembarque |

Na operação relatada, um ponto de Aguaí é pulado na volta quando nenhum aluno
a bordo precisa desembarcar ali. Se vários alunos usam o mesmo ponto, basta
um passageiro precisar dele para a parada continuar necessária. Não aplicar
essa regra automaticamente à ida: o autor a informou especificamente para
o retorno.

## Cenários de demonstração

| Cenário | Preparação fictícia | Resultado esperado |
| --- | --- | --- |
| Ida com ausência | A embarca na Escola João Borges e estuda no IF; B embarcaria no Posto Major e estuda no SENAC; ambos confirmam, mas B não comparece | A presente e desembarque no IF; B ausente; frequência da ida filtrada: 50% |
| Volta independente | A confirma IF → Escola João Borges; B confirma SENAC → Posto Major; ambos comparecem | Embarque de B antes de A; desembarque de B antes de A; frequência da volta filtrada: 100% |
| Pontos sem passageiros | Na volta acima, nenhum passageiro usa os seis pontos intermediários de Aguaí | SENAC → IF → Posto Major → Escola João Borges; os seis pontos intermediários são omitidos automaticamente e auditados |
| Ponto compartilhado | Em outro ensaio, A e B retornam ao Posto Major; um falta e o outro embarca | Pela regra operacional, Posto Major continua necessário enquanto houver um passageiro destinado a ele |

Filtre separadamente ida e volta, rota e data. Se reunir ambos os trajetos do
cenário com A e B, a frequência será 75% (três presenças em quatro registros).
Os resultados da execução automatizada ficam no [registro do ensaio](ENSAIO-ROTA-11.md).

## Funcionamento implementado

O sistema permite cadastrar a ordem dos pontos, confirmar cada trajeto,
escolher embarque e destino, registrar presença e registrar desembarque
individual. Na volta, após concluir um ponto, o sistema omite os próximos
pontos exclusivos de desembarque que não tenham passageiros destinados a eles.
Embarques e pontos mistos não são omitidos. Ida não tem omissão automática.

Cada confirmação guarda seu destino, que deve permitir desembarque na mesma
rota e trajeto, a partir do embarque escolhido. Havendo um único destino
compatível, ele é selecionado automaticamente; havendo vários, a família
precisa escolher. Rotas antigas que só têm embarques continuam aceitas.
O destino é copiado como ordem no itinerário fixado da viagem e aparece na
lista do motorista, no acompanhamento, no histórico e no CSV.

O avanço é bloqueado enquanto um aluno presente precisar desembarcar no ponto
atual. O desembarque é permitido somente no destino escolhido. Ausentes não
tornam uma parada necessária; basta um aluno presente para mantê-la. Passageiros
pendentes também preservam seus destinos, por segurança.

Cada omissão guarda instante e motivo e gera um evento de auditoria. A tela
mostra “Ponto pulado”; não inventa uma chegada. Viagens antigas com alunos a
bordo sem destino não têm seus pontos automaticamente omitidos. Não se infere
o destino do embarque da ida, pois um aluno pode confirmar apenas a volta.

## Carregar o modelo na interface

Crie uma rota e abra **Itinerário → Usar modelo da rota 11**. O botão aparece
somente em itinerários vazios e carrega as vinte paradas para revisão, sem
salvar automaticamente. Os oito horários de embarque em Aguaí são preenchidos.
As referências das paradas do IF e do SENAC registram os horários das aulas;
os campos de horário do transporte nessas instituições e de toda a volta
ficam em branco para preenchimento antes de salvar.
Em ensaios, identifique valores simulados na referência de cada parada.

## Texto de contexto para o TCC

> A demonstração do Mobilys foi planejada com base na rota 11 descrita pelo
> autor, que realiza esse percurso. A coleta dos estudantes em Aguaí ocorre
> em oito pontos, com horários informados entre 18h00 e 18h25, seguida do
> atendimento ao IF e ao SENAC, nessa ordem. As aulas começam às 19h00 em
> ambas as instituições e terminam às 22h00 no SENAC e às 22h15 no IF.
> Esses horários acadêmicos não fixam os horários de parada do ônibus.
> No retorno, o embarque ocorre
> primeiro no SENAC e depois no IF, com desembarques nos pontos de Aguaí em
> ordem inversa. Na operação relatada, pontos sem passageiros destinados a
> eles são omitidos na volta. Os cenários de demonstração utilizam alunos
> fictícios. O protótipo guarda o destino por confirmação e omite automaticamente
> os pontos exclusivos de desembarque sem passageiros na volta, registrando
> instante e motivo no histórico da viagem.

Após realizar o ensaio, registre data, versão, cenário, capturas e resultado
observado conforme o [roteiro de demonstração](DEMONSTRACAO.md). Os horários
das aulas estão registrados; os horários de transporte nas instituições e
de desembarque em Aguaí na volta permanecem pendentes de confirmação.
Qualquer valor provisório necessário ao cadastro de teste deve ser marcado
como simulado.
