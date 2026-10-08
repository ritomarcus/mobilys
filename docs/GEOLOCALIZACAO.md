# Localização e desembarque

## Funcionamento

O motorista abre uma viagem ativa e escolhe **Compartilhar localização**.
O navegador solicita permissão e usa `watchPosition`. As leituras são enviadas
no máximo a cada 5 segundos; isso é um limite de envio, não garantia de que o
dispositivo produza uma leitura nesse intervalo. A família e a administração
consultam a última posição ao atualizar o detalhe, normalmente a cada 10 segundos.

Somente o motorista da viagem pode publicar ou apagar a posição. A família
precisa ter um aluno participante da viagem atualmente vinculado à sua conta.
O servidor valida coordenadas, precisão, atividade da viagem e idade da leitura.
Leituras recebidas fora de ordem não substituem uma mais recente.

Não se grava histórico GPS: existe no máximo uma posição por viagem. Pausar e
encerrar removem essa posição. Ao fechar a aba, a captura é interrompida; se a
última leitura continuar no servidor, será marcada como antiga após 90 segundos.
Uma leitura antiga nunca é apresentada como sinal recente. A última posição
também é removida no encerramento, mesmo que o motorista não tenha pausado.

O mapa tem atribuição OpenStreetMap, respeita o cache do navegador e não faz
pré-download. O provedor é configurável em `js/config.js`. Nomes, presenças,
identificadores de alunos e credenciais não são enviados ao provedor de tiles.
O provedor recebe requisições dos tiles visualizados e o IP do navegador.

## Requisitos do dispositivo

A API de localização requer permissão e contexto seguro (HTTPS; localhost
é aceito para desenvolvimento). Um computador pode estimar localização por
rede/Wi-Fi. O GPS pode ser impreciso ou indisponível. O navegador pode suspender
a captura em segundo plano; o motorista precisa manter a página aberta.

O endereço `http://localhost:8080` funciona no computador do backend. No celular,
`localhost` é o próprio telefone. Para experimentar em rede, será necessário
configurar um endereço acessível, HTTPS com certificado confiável e o backend
na mesma origem. O projeto não publica automaticamente a aplicação nem abre
firewall. `SERVER_ADDRESS` permite escolher a interface de escuta; o padrão
permanece `127.0.0.1`.

## Desembarque

Configure paradas do tipo **Desembarque** ou **Ambos** no itinerário. Depois de
chegar a uma dessas paradas, o motorista pode confirmar o desembarque de cada
aluno presente. O horário e a ordem da parada são gravados separadamente do
horário de encerramento. Não é permitido duplicar o registro nem alterar uma
presença depois do desembarque.

Quando existem paradas de desembarque, todos os presentes precisam desembarcar
antes de concluir a última parada. Itinerários anteriores com apenas embarques
continuam compatíveis, exibindo “Não registrado” em desembarque. Cadastre uma
parada de desembarque para usar o fluxo completo.

## Endpoints

| Método | URL | Efeito |
| --- | --- | --- |
| GET | `/api/operacao/viagens/{id}/localizacao` | Última posição autorizada ou `disponivel: false` |
| PUT | mesma URL | `latitude`, `longitude`, `precisao` em metros, `capturadaEm` ISO UTC |
| DELETE | mesma URL | Pausar e apagar a última posição |
| POST | `/api/operacao/viagens/{id}/acoes` | `acao: DESEMBARCAR`, `alunoId`, `versao` |
| POST | `/api/auth/senha` | `atual`, `nova`; revoga sessões após trocar senha |

## Referências técnicas consultadas

- [Geolocation.watchPosition — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
- [Distribuição do Leaflet](https://leafletjs.com/download.html) — versão estável 1.9.4, licença incluída em `assets/vendor/leaflet/LICENSE`.
- [Política de tiles OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/)

Os testes automatizados interceptam os tiles para não usar o servidor público.
As coordenadas desses testes são controladas e não representam uma viagem real.
