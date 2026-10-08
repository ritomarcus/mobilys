package br.com.mobilys.operacao;
import br.com.mobilys.usuario.UsuarioPrincipal;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import static br.com.mobilys.operacao.OperacaoRequests.*;

@RestController
@RequestMapping("/api/operacao")
public class OperacaoController {
    private final OperacaoService service;
    public OperacaoController(OperacaoService service) { this.service=service; }
    @GetMapping("/hoje") public Map<String,Object> hoje() { return Map.of("data",service.hoje(),"fuso","America/Sao_Paulo"); }
    @GetMapping("/vinculos") public Object vinculos(@AuthenticationPrincipal UsuarioPrincipal u) { return service.vinculos(u); }
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @PutMapping("/alunos/{id}/vinculos") public void vincular(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id,@Valid @RequestBody Vinculo dados) { service.vincular(u,id,dados); }
    @GetMapping("/familia/alunos") public Object alunos(@AuthenticationPrincipal UsuarioPrincipal u) { return service.alunosFamilia(u); }
    @GetMapping("/agenda") public Object agenda(@AuthenticationPrincipal UsuarioPrincipal u,@RequestParam LocalDate data) { return service.agenda(u,data); }
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @PutMapping("/agenda") public void confirmar(@AuthenticationPrincipal UsuarioPrincipal u,@Valid @RequestBody Agenda dados) { service.confirmar(u,dados); }
    @GetMapping("/motorista/rotas") public Object rotas(@AuthenticationPrincipal UsuarioPrincipal u) { return service.rotasMotorista(u); }
    @GetMapping("/viagens") public Object viagens(@AuthenticationPrincipal UsuarioPrincipal u,@RequestParam(required=false) LocalDate data) { return service.viagens(u,data==null?service.hoje():data); }
    @GetMapping("/viagens/{id}") public Object viagem(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id) { return service.viagem(u,id); }
    @PostMapping("/viagens") public Object iniciar(@AuthenticationPrincipal UsuarioPrincipal u,@Valid @RequestBody Iniciar dados) { return service.iniciar(u,dados); }
    @PostMapping("/viagens/{id}/acoes") public Object agir(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id,@Valid @RequestBody Acao dados) { return service.agir(u,id,dados); }
    @GetMapping("/historico") public Object historico(@AuthenticationPrincipal UsuarioPrincipal u,@RequestParam LocalDate inicio,@RequestParam LocalDate fim,@RequestParam(required=false) Long rotaId) { return service.historico(u,inicio,fim,rotaId); }
    @GetMapping("/viagens/{id}/eventos") public Object eventos(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id) { return service.eventos(u,id); }
    @GetMapping("/viagens/{id}/localizacao") public Object localizacao(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id) { return service.localizacao(u,id); }
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @PutMapping("/viagens/{id}/localizacao") public void localizar(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id,@Valid @RequestBody Posicao p) { service.localizar(u,id,p); }
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @DeleteMapping("/viagens/{id}/localizacao") public void parar(@AuthenticationPrincipal UsuarioPrincipal u,@PathVariable Long id) { service.pararLocalizacao(u,id); }
}
