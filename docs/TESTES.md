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
