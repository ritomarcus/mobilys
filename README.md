# Mobilys

Protótipo de frontend para gestão de transporte estudantil, feito com HTML, CSS, JavaScript, Bootstrap 5 e Chart.js.

## Como visualizar

Sirva a pasta por HTTP local (por exemplo, **Open with Live Server** no VS Code). Abra `index.html`, selecione um perfil e preencha os campos para acessar a demonstração. Use o mesmo endereço e porta em todas as abas. Abrir via `file://` não garante armazenamento compartilhado entre páginas. As telas disponíveis são:

- `motorista-viagem.html`: iniciar e encerrar viagens de ida e volta, buscar alunos e registrar presenças. Os contadores acompanham os registros do trajeto selecionado.
- `responsavel-agendamentos.html`: confirmar ou cancelar a ida e a volta separadamente.
- `responsavel-status.html`: acompanhar as etapas atualizadas pelo motorista e o registro pessoal de presença, com ida e volta independentes.
- `responsavel-historico.html`: consultar utilizações e filtrar por situação e trajeto.
- `admin-painel.html`: consultar as viagens de ida e volta, indicadores e gráficos de presença por data, alunos por rota e presenças por rota.
- `admin-cadastros.html`: alternar entre alunos, rotas, motoristas, veículos e usuários; buscar, filtrar, ordenar e gerenciar registros em formulários agrupados. No celular, as listas usam cartões e as categorias permitem deslizar horizontalmente.
- `admin-presencas.html`: consultar o histórico com busca por aluno, filtros combinados de rota, trajeto, data e situação e ordenação. Os indicadores são recalculados conforme os resultados; cada ida ou volta conta como um registro separado.
- `admin-relatorios.html`: gerar relatórios com período inclusivo, rota e trajeto; consultar indicadores e comparação por rota; exportar os registros em CSV ou usar **Imprimir / PDF** e selecionar **Salvar como PDF** no navegador. Após alterar filtros, gere novamente o relatório para liberar a exportação. A tela inicia com o período dos dados de exemplo.

É necessária conexão à internet para carregar Bootstrap, Bootstrap Icons, a fonte e Chart.js, servidos por CDN.

## Dados de demonstração

As rotas-base estão registradas em `js/rotas.js`, transcritas das duas imagens enviadas da Prefeitura Municipal de Aguaí:

- **Rota 10 — manhã:** Aguaí → São João da Boa Vista; sete pontos, de 05:50 a 06:20. Atende UNIFEOB, UNESP, Externato, Anglo e Instituto Federal.
- **Rota 11 — noite:** Aguaí → São João da Boa Vista; seis pontos, de 17:50 a 18:25. Atende Fazenda UNIFEOB e Instituto Federal.

Consulte **Cadastros → Rotas** para ver todas as paradas, referências e horários. Esses registros compõem a base inicial; alterações locais são preservadas até reiniciar a demonstração. As imagens não informam vigência, chegada, retorno, coordenadas, motoristas ou veículos. A ordem das instituições na lista não representa um itinerário de desembarque confirmado.

Alunos, presenças, motoristas e veículos permanecem fictícios. O aluno da demonstração é Ana Beatriz; o motorista pode alternar entre as duas rotas. Vínculos de pontos e instituições são editáveis em **Cadastros → Alunos**, antes de iniciar viagens. As rotas não possuem veículo oficial associado. O cadastro, os filtros, o painel e os relatórios usam as duas rotas-base.

Os dados iniciais ficam em `js/app.js`; `js/dados.js` mantém cadastros, confirmações e viagens no localStorage, sob a chave `mobilys.demo.v1`. Alterações persistem ao navegar e recarregar e atualizam outras abas da mesma origem. Cada gravação lê os dados mais recentes; navegadores com Web Locks serializam as alterações entre abas. Falhas de leitura ou gravação são informadas, sem confirmar uma alteração que não foi salva. **Reiniciar demonstração** remove somente os dados do Mobilys, após confirmação. Não há autenticação real, backend, GPS ou sincronização entre dispositivos.

A paleta está centralizada nas variáveis de `css/styles.css`. Os estilos de motorista e família usam a classe `experiencia`; o layout administrativo foi preservado, com complemento dos gráficos e correção da margem externa da grade.

## Verificação manual

1. No motorista, inicie a ida, confirme a chegada a cada ponto, registre os alunos e conclua a parada. O filtro permite ver apenas os alunos do ponto atual. Após os sete pontos, encerre ao chegar ao destino. A linha do tempo é manual, sem GPS; a volta possui um itinerário fictício com embarque nas instituições e desembarque em Aguaí. O progresso é salvo no navegador.
2. Na agenda, cancele e confirme a ida; a volta deve permanecer independente e o resumo deve atualizar a quantidade de trajetos confirmados.
3. Abra o acompanhamento em outra aba. Inicie e avance a viagem como motorista; o aluno deve visualizar as mesmas etapas, sem botão de simulação independente.
4. No histórico, combine situação, trajeto e data; confira os indicadores filtrados, o estado sem resultados e use **Limpar**. Em celular, os registros são apresentados como cartões com rótulos.
5. No admin, confira os três gráficos e os valores em texto. Verifique as telas em celular e desktop.

### Retornos fictícios

As duas rotas incluem volta para apresentação: Rota 10 às 12:00 e Rota 11 às 22:10. Horários e ordem dos pontos de retorno são fictícios. No motorista, ida e volta mantêm progresso e presenças independentes entre recarregamentos e navegação. Selecione Volta, inicie, registre os embarques nas instituições e avance pelos desembarques até encerrar.

## Fluxo integrado da demonstração

A data operacional acompanha a data atual do dispositivo. Os registros iniciais de presença são anteriores a ela; os trajetos do dia começam sem presenças lançadas.

- Antes do início, a confirmação/cancelamento altera a lista de embarque daquele trajeto. A demonstração começa com os alunos confirmados.
- Ao iniciar, a viagem guarda uma cópia do itinerário e da lista confirmada. As confirmações desse trajeto ficam bloqueadas.
- O motorista registra presença somente na parada de embarque correspondente, após **Cheguei ao ponto**. Pode corrigir o registro enquanto estiver nessa parada; a correção substitui a presença e mantém um histórico local de alterações com horário e autor demonstrativo.
- Não é possível concluir uma parada com registros pendentes, nem encerrar antes de concluir o percurso. Depois de encerrado, o trajeto não permite alterações.
- Cancelamento, presença, ausência e registro pendente são situações distintas. Confirmação sozinha não gera presença nem entra nos relatórios de frequência.
- O histórico administrativo, o histórico pessoal, o painel e os relatórios usam os mesmos registros de presença. Relatórios gerados ficam desatualizados quando os dados mudam; gere novamente antes de exportar.
- Cadastros de alunos incluem o ponto da ida e a instituição da volta, filtrados pela rota. Alunos e rotas ficam bloqueados para edição após iniciar qualquer viagem: reinicie a demonstração para modificar essa configuração. Registros com vínculos/histórico possuem proteções de exclusão.
- O formulário de rotas continua sem editor de itinerário: somente as duas rotas-base com paradas participam da execução de viagens.

## Roteiro de validação integrada

1. Abra agenda, motorista, acompanhamento e relatórios em abas da mesma origem.
2. Cancele apenas a ida de Ana: ela deve sair da lista da ida, permanecendo na volta. Recarregue a agenda e confira a persistência.
3. Confirme novamente a ida; inicie-a no motorista. A agenda deve bloquear mudanças da ida, mantendo a volta disponível.
4. Confirme chegada ao ponto de Ana e registre sua presença. Confira o acompanhamento, o histórico pessoal e as presenças administrativas.
5. Gere o relatório incluindo a data atual. Confira o registro e exporte CSV. Corrigir a presença no motorista deve invalidar a exportação do relatório já gerado.
6. Conclua todas as paradas e encerre. Recarregue a tela: a viagem deve continuar encerrada. A volta deve permanecer independente.
7. Reinicie a demonstração. Edite o ponto e a instituição de Ana no cadastro e confira a agenda e a lista do motorista.

## Testes automatizados

Com Node.js instalado:

- `node tests/dados.test.cjs`: regras de confirmação, presença, encerramento, vínculos, persistência, operações de páginas diferentes e falha de armazenamento.
- `npm install` e `npm run test:browser`: teste integrado com Playwright e Microsoft Edge instalado, usando perfil temporário. Exige acesso aos CDNs utilizados pelas páginas. O teste abre seu próprio servidor local e verifica também as nove telas em 320, 390, 768 e 1440 pixels, a navegação ativa e o botão de voltar ao topo.

O teste de navegador não altera os dados do perfil habitual do usuário. Este protótipo não substitui autenticação, banco transacional ou auditoria de um sistema de produção.

