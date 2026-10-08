# Análise qualitativa e protocolo de avaliação

## Natureza desta análise

Esta é uma análise técnica da implementação e dos cenários automatizados.
Não é resultado de entrevistas, questionário aplicado, observação em transporte
real ou experimento com estudantes. Não foram coletados depoimentos nem notas
de usuários. A seção seguinte pode apoiar a discussão do TCC, respeitando essa
delimitação.

## Pontos positivos observáveis

| Aspecto | Evidência no sistema | Interpretação e limite |
| --- | --- | --- |
| Centralização | Agenda, lista de confirmados e presenças persistidos no mesmo banco | Reduz a necessidade de procurar confirmações em mensagens; não foi medida redução de falhas em campo |
| Ida e volta independentes | Agendamento e viagem por data/trajeto | Evita supor que participação na ida implica participação na volta |
| Consistência | Validação de capacidade, pontos, versão e transações | Testes recusam ações incompatíveis; não substituem teste sob carga |
| Rastreabilidade | Entrada, desembarque, fim e auditoria separados | Permite reconstruir o registro operacional; depende de o motorista informar corretamente |
| Isolamento de acesso | Família só consulta seus vínculos; motorista só opera suas viagens | Verificado por testes de acesso cruzado, não por auditoria de segurança independente |
| Acesso móvel | Navegação inferior, botões de toque e layout adaptativo | Testes em navegadores com larguras móveis; ainda requer avaliação em dispositivos físicos |
| Acompanhamento opcional | GPS com idade/precisão, pausa e autorização | Indica a última leitura do dispositivo, não oferece localização garantida nem previsão de chegada |

## Limitações e aspectos negativos

- A omissão automática da [rota 11](ROTA-11.md) depende do destino confirmado
  e da presença registrada. Aplica-se somente à volta e a pontos exclusivos
  de desembarque; pontos mistos são preservados. Viagens antigas sem destino
  não permitem inferir quais pontos seriam dispensáveis para alunos a bordo.
- O funcionamento depende de rede e backend disponível. Não há fila de ações
  offline nem recuperação automática de comandos não confirmados.
- Navegadores móveis podem suspender GPS quando a tela apaga ou a página vai
  para segundo plano. Não há serviço nativo de rastreamento em background.
- A informação de presença é manual. Não existe leitor de carteirinha, biometria
  ou sensor físico que confirme embarque/desembarque.
- A administração mantém vínculos e pontos autorizados; a família escolhe entre
  esses pontos ao confirmar. A qualidade cadastral é essencial e a verificação
  documental ocorre fora da aplicação.
- A recuperação de senha é assistida pela administração. Não há envio de e-mail
  automático ou serviço SMTP configurado.
- Não há notificações push/WhatsApp, otimização automática de rotas ou previsão
  de chegada. Esses recursos não constam dos objetivos recebidos.
- Há uma viagem por rota, data e trajeto; operações com múltiplas partidas do
  mesmo trajeto no dia exigem uma extensão do modelo.
- O histórico não oferece exclusão casual de eventos. Uma política de retenção,
  anonimização e gestão de acesso precisa ser definida antes de uso real.
- Os relatórios têm intervalo máximo de 366 dias, sem paginação no servidor;
  o bloqueio compartilhado das escritas limita escalabilidade. Não há SLA.
- Tiles de mapa, Bootstrap, ícones e fontes dependem de serviços externos.
  Leaflet é distribuído localmente; a disponibilidade do mapa base não é garantida.
- Publicação em produção, certificado HTTPS, backup automatizado, restauração
  ensaiada, monitoramento e avaliação formal de privacidade não foram realizados.

## Protocolo proposto para avaliação com participantes

Validar o método com o orientador antes de recrutar. Preferir adultos que
representem os perfis de administração, motorista e responsável. Usar dados
fictícios e não coletar informações pessoais desnecessárias. Se a instituição
exigir consentimento ou procedimentos específicos de pesquisa, segui-los.

1. Apresentar o propósito e informar que a tarefa avalia o sistema, não a pessoa.
2. Entregar credenciais de teste individuais. Explicar apenas o contexto da tarefa.
3. Pedir à administração que associe um aluno à família e ao ponto.
4. Pedir à família que confirme a ida, cancele a volta e consulte a presença.
5. Pedir ao motorista que inicie, resolva presenças, registre desembarque e encerre.
6. Pedir à administração que encontre uma ausência e exporte o relatório.
7. Registrar dificuldades e intervenções necessárias, sem sugerir respostas.
8. Solicitar percepção sobre clareza, confiança e adequação ao contexto.

### Registro de observação — preencher após execução

| Campo | Registro |
| --- | --- |
| Código anônimo / perfil | A preencher |
| Data, dispositivo e navegador | A preencher |
| Tarefa | A preencher |
| Concluiu sem ajuda / com ajuda / não concluiu | A preencher |
| Dificuldade observada | A preencher |
| Intervenção do avaliador | A preencher |
| Comentário autorizado, transcrito fielmente | A preencher |
| Melhoria sugerida | A preencher |

Perguntas abertas: “O que ficou claro?”, “Em que momento você não soube como
prosseguir?”, “O que faltaria para sua rotina?” e “Você conseguiu distinguir
confirmação, presença e desembarque?”. Não atribuir percentuais, médias ou
conclusões de aceitação antes da coleta. Depois, agrupar os comentários por
tema, relacionar às tarefas e registrar também discordâncias e dificuldades.

## Conclusão técnica delimitada

A implementação oferece um fluxo navegável e persistente para centralizar
agendamentos e controle manual de presença em ida e volta. Os testes fornecem
evidência de funcionamento nos cenários definidos. A contribuição potencial
para reduzir falhas de comunicação e melhorar a rotina deve ser discutida
como hipótese apoiada pelo desenho do sistema, até haver avaliação real.
