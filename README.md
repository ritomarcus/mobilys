# Mobilys

Protótipo de frontend para gestão de transporte estudantil, feito com HTML, CSS, JavaScript, Bootstrap 5 e Chart.js.

## Como visualizar

Abra `index.html` no navegador, selecione um perfil e preencha os campos para acessar a demonstração. Também é possível abrir as telas diretamente:

- `motorista-viagem.html`: iniciar e encerrar viagens de ida e volta, buscar alunos e registrar presenças. Os contadores acompanham os registros do trajeto selecionado.
- `responsavel-agendamentos.html`: confirmar ou cancelar a ida e a volta separadamente.
- `responsavel-status.html`: visualizar o trajeto ilustrativo e avançar pelas etapas com o botão de simulação.
- `responsavel-historico.html`: consultar utilizações e filtrar por situação e trajeto.
- `admin-painel.html`: consultar indicadores e gráficos de presença semanal, alunos por rota e presenças por rota.
- `admin-cadastros.html`: alternar entre alunos, rotas, motoristas, veículos e usuários; buscar, filtrar, ordenar e gerenciar registros em formulários agrupados. No celular, as listas usam cartões e as categorias permitem deslizar horizontalmente.
- `admin-presencas.html`: consultar o histórico com busca por aluno, filtros combinados de rota, trajeto, data e situação e ordenação. Os indicadores são recalculados conforme os resultados; cada ida ou volta conta como um registro separado.
- `admin-relatorios.html`: gerar relatórios com período inclusivo, rota e trajeto; consultar indicadores e comparação por rota; exportar os registros em CSV ou usar **Imprimir / PDF** e selecionar **Salvar como PDF** no navegador. Após alterar filtros, gere novamente o relatório para liberar a exportação. A tela inicia com o período dos dados de exemplo.

É necessária conexão à internet para carregar Bootstrap, Bootstrap Icons, a fonte e Chart.js, servidos por CDN.

## Dados de demonstração

Os dados ficam em `js/app.js`. Alterações são mantidas somente na memória da página: recarregar ou navegar para outra tela reinicia os dados. Os perfis não possuem autenticação real e as telas não sincronizam entre si. O trajeto é ilustrativo, sem GPS; o botão de simulação permite apresentar as etapas sem backend.

A paleta está centralizada nas variáveis de `css/styles.css`. Os estilos de motorista e família usam a classe `experiencia`; o layout administrativo foi preservado, com complemento dos gráficos e correção da margem externa da grade.

## Verificação manual

1. No motorista, inicie a ida, marque um aluno e confira os contadores. Encerre e alterne para a volta; cada trajeto mantém seu estado enquanto a página estiver aberta.
2. Na agenda, cancele e confirme a ida; a volta deve permanecer independente.
3. No acompanhamento, avance até a chegada e reinicie a simulação.
4. No histórico, combine filtros, confira o estado sem resultados e use **Limpar**.
5. No admin, confira os três gráficos e os valores em texto. Verifique as telas em celular e desktop.
