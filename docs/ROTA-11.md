# Rota 11 — cenário para demonstrações do TCC

Fonte: percurso e horários relatados pelo autor, que realiza a rota, nesta
conversa em 8 de outubro de 2026. Este registro não é uma tabela oficial da
prefeitura. Os pontos e a ordem representam o relato; contas, passageiros e
resultados do ensaio devem ser fictícios e identificados como demonstração.

## Ida

Em Aguaí, o veículo recolhe os alunos nos oito pontos abaixo. Depois segue
para o IF e, em seguida, para o SENAC. Não foram acrescentados endereços,
coordenadas ou tempos de deslocamento não informados pelo autor.

| Ordem | Ponto | Horário informado | Operação |
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
Nenhum horário de retorno foi informado.

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
| Pontos sem passageiros | Na volta acima, nenhum passageiro usa os seis pontos intermediários de Aguaí | Na operação real: SENAC → IF → Posto Major → Escola João Borges; no protótipo atual, é necessário concluir também os pontos intermediários |
| Ponto compartilhado | Em outro ensaio, A e B retornam ao Posto Major; um falta e o outro embarca | Pela regra operacional, Posto Major continua necessário enquanto houver um passageiro destinado a ele |

Os percentuais são resultados esperados dos cenários, não resultados já
coletados. Filtre separadamente ida e volta, rota e data. Atribua destinos
fictícios no roteiro e use os vínculos do sistema para os embarques.

## Limite da implementação e evolução necessária

O sistema permite cadastrar a ordem dos pontos, confirmar cada trajeto,
registrar presença e registrar desembarque individual. Atualmente não há
vínculo obrigatório de destino por passageiro e confirmação, nem ação para
pular uma parada: o avanço exige chegada e incrementa a ordem em uma unidade.
Não registre chegadas fictícias como evidência de uma viagem em campo.

Para automatizar a regra de retorno, uma evolução deverá registrar o destino
de cada passageiro, preservá-lo na viagem e permitir omitir um ponto de
desembarque somente se nenhum passageiro presente e ainda a bordo tiver
aquele destino. O histórico deverá guardar a omissão e seu motivo, preservando
a ordem dos demais pontos. Não inferir o destino exclusivamente do embarque
da ida, pois um aluno pode confirmar apenas a volta ou usar outro ponto.

## Texto de contexto para o TCC

> A demonstração do Mobilys foi planejada com base na rota 11 descrita pelo
> autor, que realiza esse percurso. A coleta dos estudantes em Aguaí ocorre
> em oito pontos, com horários informados entre 18h00 e 18h25, seguida do
> atendimento ao IF e ao SENAC, nessa ordem. No retorno, o embarque ocorre
> primeiro no SENAC e depois no IF, com desembarques nos pontos de Aguaí em
> ordem inversa. Na operação relatada, pontos sem passageiros destinados a
> eles são omitidos na volta. Os cenários de demonstração utilizam alunos
> fictícios e distinguem as funções disponíveis no protótipo da evolução
> necessária para automatizar essa omissão.

Após realizar o ensaio, registre data, versão, cenário, capturas e resultado
observado conforme o [roteiro de demonstração](DEMONSTRACAO.md). Horários do
IF, do SENAC e da volta permanecem pendentes de informação do autor; qualquer
valor necessário ao cadastro de teste deve ser marcado como simulado.
