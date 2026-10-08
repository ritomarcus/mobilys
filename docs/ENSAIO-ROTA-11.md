# Ensaio técnico da rota 11

## Método

Ensaio automatizado da aplicação com PostgreSQL em banco isolado,
`mobilys_operacao_test`, e Microsoft Edge em modo headless. O teste usa o
frontend empacotado pelo backend e sessões separadas para administração,
motorista e duas famílias. O percurso corresponde ao relato do autor;
passageiros e contas são fictícios, e os horários não informados são
explicitamente identificados como simulados. O GPS não é compartilhado neste
ensaio. Não houve transporte em campo nem avaliação com participantes.

As referências das instituições distinguem o início das aulas às 19:00 em
ambas e o término às 22:00 no SENAC e às 22:15 no IF. Esses horários foram
informados pelo autor; os horários de chegada e embarque do ônibus ainda não
foram confirmados. No ensaio, as chegadas de ida são simuladas às 18:50 no IF
e às 18:55 no SENAC. Na volta, os embarques são simulados às 22:00 no SENAC e
às 22:15 no IF; os pontos seguintes têm horários simulados a partir de 22:20.
Essa configuração não mede nem comprova tempos reais de deslocamento.

O [manifesto da execução](evidencias/rota11/execucao.json) registra instante,
IDs das viagens no banco de teste, resultados e hashes SHA-256 das fontes
principais. Os hashes identificam os arquivos usados sem pressupor que a
versão local já tenha sido publicada no GitHub. Nova execução gera novos
registros e substitui as capturas e o manifesto.

## Resultados observados

| Verificação | Resultado |
| --- | --- |
| Modelo para cadastro | Vinte paradas carregadas para revisão; horários não informados em branco; nenhuma gravação automática |
| Ida | Dez pontos percorridos, com A presente desde Escola João Borges e desembarque no IF; B ausente no Posto Major |
| Volta | B embarca no SENAC e A no IF; B desembarca no Posto Major e A na Escola João Borges |
| Pontos sem passageiros | Seis pontos intermediários omitidos automaticamente; ordem do percurso preservada |
| Proteção de destino | A não pode desembarcar no Posto Major; avanço bloqueado enquanto o desembarque de B estiver pendente ali |
| Família | Apenas o próprio aluno aparece no acompanhamento; omissões do itinerário são visíveis |
| Relatório da ida | Uma presença e uma ausência: 50% |
| Relatório da volta | Duas presenças: 100% |
| Relatório combinado | Três presenças e uma ausência em quatro registros: 75% |
| CSV | Exportação respeita o filtro de trajeto e inclui embarque e destino |
| Layout | Sem transbordamento horizontal do documento em 320, 390 e 1440 pixels |

O teste HTTP complementar inclui alunos ausentes com destino compartilhado
e exclusivo: o Posto Major é preservado para um passageiro presente, mesmo
quando outro aluno destinado ao mesmo ponto falta; a Creche Laura Sorense é
omitida quando seu único aluno confirmado está ausente. Também verifica
destinos inválidos, conflito de versão, seis eventos `OMITIR_PARADA`, isolamento
entre famílias e preservação do itinerário/destino após editar a rota.

A regressão Java exercita uma viagem antiga com passageiro sem destino:
os pontos não são omitidos enquanto ele estiver a bordo. Após o desembarque,
um ponto vazio pode ser omitido, mas uma parada mista permanece no percurso.

## Capturas para o TCC

| Captura | O que evidencia |
| --- | --- |
| [Itinerário](evidencias/rota11/itinerario.png) | Ordem das instituições e pontos; indicação de horários simulados |
| [Agenda no celular](evidencias/rota11/agenda-celular.png) | Escolha independente de embarque e destino para cada trajeto |
| [Volta no desktop](evidencias/rota11/volta-desktop.png) | Destino dos passageiros e seis pontos pulados no itinerário |
| [Acompanhamento no celular](evidencias/rota11/acompanhamento-celular.png) | Visão restrita da família durante a volta |
| [Relatório combinado](evidencias/rota11/relatorio-desktop.png) | Quatro registros e frequência de 75% |
| [Relatório da ida](evidencias/rota11/relatorio-ida.png) | Filtro de trajeto e frequência de 50% |
| [Relatório da volta](evidencias/rota11/relatorio-volta.png) | Filtro de trajeto e frequência de 100% |

## Reprodução

Inicie a API na porta 8081 conectada ao banco isolado conforme o
[guia do backend](../backend/README.md#testar-a-operação-em-banco-separado).
Use a versão atual do backend para incluir migração V8 e recursos estáticos.
Na raiz, em PowerShell:

```powershell
$env:MOBILYS_TEST_API = 'http://127.0.0.1:8081/api'
npm.cmd run test:rota11
npm.cmd run test:rota11:browser
```

Os testes criam seus próprios cadastros e viagens no banco isolado. As senhas
são geradas apenas em memória; não são incluídas nas capturas ou no manifesto.
O teste do navegador exige Edge e acesso às dependências de interface em CDN.

## Texto de resultados para adaptar ao TCC

> Em um ensaio automatizado com dados fictícios, o Mobilys executou o percurso
> da rota 11 com confirmações independentes de ida e volta. Na ida, foram
> registrados um aluno presente e um ausente, resultando em frequência de 50%.
> Na volta, ambos estavam presentes, resultando em 100%. Após o desembarque no
> Posto Major, seis pontos sem passageiros destinados a eles foram omitidos,
> e a viagem seguiu para a Escola João Borges. As omissões foram exibidas no
> acompanhamento e registradas com instante e motivo na auditoria. O ensaio
> verificou o comportamento funcional do protótipo, sem medir desempenho,
> usabilidade com participantes ou resultados em transporte real.
