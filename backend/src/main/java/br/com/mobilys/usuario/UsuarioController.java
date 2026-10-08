package br.com.mobilys.usuario;

import java.net.URI;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService service;
    public UsuarioController(UsuarioService service) { this.service = service; }
    @GetMapping public List<UsuarioResponse> listar() { return service.listar(); }
    @PostMapping public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody UsuarioRequest dados) {
        var resposta = service.criar(dados);
        return ResponseEntity.created(URI.create("/api/usuarios/" + resposta.id())).body(resposta);
    }
    @PutMapping("/{id}") public UsuarioResponse atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest dados,
            @AuthenticationPrincipal UsuarioPrincipal autor) { return service.atualizar(id, dados, autor.id()); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> excluir(@PathVariable Long id, @AuthenticationPrincipal UsuarioPrincipal autor) {
        service.excluir(id, autor.id()); return ResponseEntity.noContent().build();
    }
}
