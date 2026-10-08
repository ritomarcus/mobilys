# Roteiro de demonstração do Mobilys

## Preparação

1. Abra Docker Desktop. Em `backend`, confirme o `.env` local e execute:

   ```powershell
   docker compose up -d --wait
   mvn spring-boot:run
   ```

2. Abra `http://localhost:8080`. O backend agora entrega também o frontend.
   Não precisa abrir Live Server para essa forma de execução.
3. Entre com a conta administrativa já cadastrada. As variáveis de bootstrap
   criam a primeira conta somente quando o banco está vazio.
4. Use janelas/perfis de navegador separados para administrador, motorista e
   família. Abas da mesma sessão compartilham o login.
5. Use o percurso da rota 11 informado pelo autor, com passageiros e contas
   fictícios, e explique essa distinção na apresentação. Não exponha
   senhas, `.env`, nomes, documentos ou localização de pessoas reais.

Para repetir a apresentação, use outra rota ou outra data de serviço. Há uma
viagem por rota/data/trajeto e o histórico não é apagado pelo fluxo normal.
Não apague o volume do banco para repetir uma demonstração.

## Dados de apresentação

Crie uma conta motorista e duas contas de aluno/responsável com e-mails
fictícios distintos, utilizando senhas definidas pelo apresentador. Cadastre
motorista vinculado à conta, veículo com 2 lugares (capacidade apenas do cenário
de teste) e uma rota denominada “Rota 11 — demonstração — [data]”, turno Noite,
origem Aguaí e instituições IF e SENAC. Os nomes abaixo são exemplos para digitação,
não são inseridos automaticamente.

Use o [cenário completo da rota 11](ROTA-11.md) como referência para cadastrar
as dez paradas de cada trajeto: oito pontos em Aguaí e duas instituições.
Na ida, os horários informados vão de 18:00 a 18:25; depois o veículo passa
no IF e no SENAC. Na volta, passa no SENAC, no IF e nos oito pontos em ordem
inversa. Os horários das instituições e de todo o retorno não foram informados.
Como o cadastro exige horário em cada parada, use valores provisórios somente
para o ensaio, identificados na referência da parada como “Horário simulado
para demonstração”; não os apresente como horários reais da rota.

Cadastre dois alunos (por exemplo, “Aluno demonstração A” e “Aluno demonstração
B”), cada um com matrícula distinta. Em **Responsáveis**, cadastre os responsáveis
vinculados às contas. Em **Alunos → Vínculos**, selecione o responsável e informe
o parentesco. Para A, autorize Escola João Borges na ida e IF na volta;
para B, autorize Posto Major na ida e SENAC na volta. No cenário, A desembarca
no IF na ida e na Escola João Borges na volta; B desembarca no SENAC na ida
e no Posto Major na volta. Esses destinos são definidos pelo roteiro, pois o
cadastro atual vincula pontos de embarque, sem destino individual obrigatório.
Horários previstos não impedem a demonstração fora desse horário;
os eventos reais usam o instante atual do servidor.

## Apresentação sugerida — 12 a 15 minutos

| Etapa | Ação demonstrada | Resultado que deve aparecer |
| --- | --- | --- |
| 1. Contexto, 1 min | Apresentar a rota 11 e a necessidade de reunir confirmações | Percurso real relatado pelo autor, com passageiros fictícios |
| 2. Administração, 2 min | Mostrar cadastros, vínculos e itinerário | IDs relacionados e paradas separadas de ida/volta |
| 3. Família, 2 min | Confirmar ida/volta dos dois alunos; cancelar e reconfirmar uma delas | Estados independentes; cada conta só vê seus alunos |
| 4. Motorista, 3 min | Iniciar ida; na Escola João Borges marcar A presente; percorrer os pontos até Posto Major e marcar B ausente | Lista fixada, horário de entrada e ações conforme etapa |
| 5. Acompanhamento, 1 min | Na família A, abrir a viagem; opcionalmente ativar GPS no motorista | Presença registrada e última posição autorizada |
| 6. Desembarque, 1 min | Chegar ao IF, confirmar desembarque de A, concluir SENAC e encerrar | Desembarque individual e fim de viagem distintos |
| 7. Relatórios, 2 min | Filtrar rota/aluno, consultar frequência, auditoria e exportar CSV | 1 presente e 1 ausente produzem 50% na ida filtrada |
| 8. Volta e conclusão, 2 min | Iniciar volta, mostrar SENAC antes do IF e explicar o retorno pelos pontos em ordem inversa | Presença de ida não é copiada para volta; explicar a regra real de omitir pontos sem passageiros e a limitação atual |

Se houver outros registros no período, filtre pela rota/nome exclusivo da
apresentação antes de falar em 50%. Para demonstrar todo o percurso de volta,
registre B presente no SENAC e A presente no IF; desembarque B no Posto Major
e A na Escola João Borges. A ausência de B na ida não impede sua confirmação
e presença na volta. Reserve mais tempo para percorrer as dez paradas; os
12 a 15 minutos são uma estimativa para um ensaio já preparado.

O sistema atual exige chegada e conclusão de todas as paradas cadastradas.
Nos pontos intermediários sem alunos, demonstre essa sequência como limitação
do protótipo, sem afirmar que o motorista para nesses locais na operação real.
A omissão de pontos sem passageiros é um cenário de evolução descrito em
[Rota 11](ROTA-11.md), ainda não uma funcionalidade implementada.

## Casos de falha úteis para a banca

- Tentar avançar antes de resolver as presenças: operação recusada.
- Tentar cancelar uma confirmação após iniciar o trajeto: recusada.
- Consultar outra família: aluno não aparece; API não autoriza seu acesso.
- Em duas sessões do mesmo motorista, enviar ações com versão antiga: conflito.
- Negar permissão ao GPS: a viagem continua utilizável com mensagem explícita.
- Pausar GPS: a posição deixa de ser disponibilizada aos acompanhantes.
- Mostrar que ausência, cancelamento e pendência são estados diferentes.

## GPS no computador e no celular

No computador, `localhost` permite testar a Geolocation API com a autorização
do navegador. A leitura pode vir de Wi-Fi/rede e não de um receptor GPS.
No celular, acessar o IP do computador por HTTP não habilita geolocalização:
é necessário HTTPS com certificado confiável e acesso ao backend. O servidor
escuta apenas loopback por padrão; `SERVER_ADDRESS=0.0.0.0` é uma opção para um
ambiente de rede configurado, não substitui HTTPS. Consulte o [guia](GEOLOCALIZACAO.md).

O modo de sensores das ferramentas do navegador pode simular coordenadas para
uma apresentação. Identifique essa simulação explicitamente. Não apresente
coordenadas simuladas como rastreamento de um veículo em circulação.

## Evidências técnicas

As imagens em [evidencias](evidencias/) são capturas da aplicação pelo teste
automatizado com dados fictícios, não de operação em campo. O teste substitui
os tiles públicos por uma imagem neutra e fornece coordenadas controladas;
o mapa cinza nessas capturas evita acessos automatizados ao serviço de mapas.
Essas capturas são do cenário técnico anterior e não comprovam uma execução
da rota 11. Para o TCC com esta rota, produza novas capturas durante o ensaio.

- [Acompanhamento no celular](evidencias/acompanhamento-celular.png)
- [Viagem no desktop](evidencias/viagem-desktop.png)
- [Relatório no desktop](evidencias/relatorio-desktop.png)

Na apresentação, use a aplicação em execução e registre as evidências com
data, versão, passos e resultado observado. O [protocolo qualitativo](AVALIACAO.md)
contém um formulário para coletar retorno real.
