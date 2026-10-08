# Registro de verificação técnica

Execuções em 07 e 08/10/2026, Windows, Java/Maven e PostgreSQL local em Docker.
Banco isolado `mobilys_operacao_test`, API de teste na porta 8081; os testes
HTTP operacionais deixam seus próprios dados para inspeção da auditoria.

| Verificação | Resultado |
| --- | --- |
| `mvn package`, com `DB_TEST_URL` | 5 testes Java, nenhuma falha; artefato gerado |
| `npm.cmd test` | 4 testes do cliente HTTP, nenhuma falha |
| `security.integration.cjs` | Login, CSRF, autorização, revogação e logout aprovados |
| `itinerario.integration.cjs` | Persistência, ordem, isolamento e conflito de versão aprovados |
| `operacao.integration.cjs` | Agenda, capacidade, viagens, concorrência, presença, auditoria e frequência aprovados |
| `localizacao.integration.cjs` | GPS autorizado, validação, posição antiga, pausa, encerramento, desembarque e senha aprovados |
| `operacao.browser.cjs` | Fluxo de três perfis no Edge; GPS controlado, negação de permissão, desembarque, CSV e troca de senha aprovados |
| `api.browser.cjs` | Login, cinco cadastros, itinerários, vínculos, exclusões protegidas, rede e responsividade aprovados |
| Layout operacional em 320/390/1440 px | Sem transbordamento horizontal do documento nos cenários testados |
| Frontend empacotado | Página inicial, JavaScript, CSS e Leaflet respondem pela API; `.env` não é servido |
| `modelo.integration.cjs` | Campos do modelo, responsáveis N:N, conta do aluno, pontos autorizados, inativação, CNH vencida e associações de rota aprovados |
| `modelo.browser.cjs` | Seis cadastros, parentesco, escolha de ponto, mapa, associações e retorno ao login após inativação aprovados no frontend empacotado |

Em 08/10, as suítes de segurança, modelo (HTTP e navegador), cadastros e operação
no navegador passaram após as adequações V7. A configuração F5 do VS Code foi
adicionada; o acionamento pela interface do editor não faz parte destes testes.

As capturas em `evidencias/` são de dados fictícios. O teste fornece coordenadas
controladas e intercepta os tiles OpenStreetMap; não comprova precisão de GPS
em campo. A negação de permissão é exercitada por um callback controlado no teste.

Foi necessário iniciar Docker Desktop antes da execução final, pois a primeira
tentativa encontrou PostgreSQL desligado. A execução após iniciar o banco passou.

Essas verificações não incluem teste de carga, auditoria independente de
segurança, certificação de acessibilidade, dispositivos móveis físicos nem
avaliação com participantes. A correspondência entre o DER aprovado e o banco
implementado está no [guia de adequação](ADEQUACAO-MODELO-APROVADO.md).

## Complemento — rota 11 e migração V8, 08/10/2026

- `mvn package`, com `DB_TEST_URL` no banco isolado: oito testes Java, sem
  falhas. Inclui viagem antiga sem destino e preservação de parada mista.
- `npm.cmd test`: quatro testes do cliente HTTP aprovados.
- Suítes HTTP de segurança, itinerário, operação, localização e modelo:
  aprovadas após V8.
- `test:rota11`: destinos independentes, validação, ponto compartilhado,
  seis omissões auditadas, isolamento e snapshot histórico aprovados.
- `test:rota11:browser`: modelo de cadastro, ida/volta completas, destinos,
  filtros de frequência (50%/100%/75%), CSV e layout em 320/390/1440 pixels
  aprovados no frontend empacotado.
- `api.browser.cjs` e `modelo.browser.cjs`: regressões de cadastros, vínculos,
  itinerário, pontos autorizados, mapa, inativação e layout aprovadas após V8.

As capturas e o manifesto estão em [evidencias/rota11](evidencias/rota11/);
o [relato do ensaio](ENSAIO-ROTA-11.md) descreve método, resultados e limites.
Essas evidências usam dados fictícios e horários complementares simulados.
O ensaio de navegador da rota 11 foi repetido após informar os horários das
aulas (19:00 em ambas; término 22:00 no SENAC e 22:15 no IF). As referências
acadêmicas e horários simulados do ônibus foram atualizados, com novas capturas;
as verificações continuaram aprovadas.
