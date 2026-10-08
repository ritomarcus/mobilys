package br.com.mobilys.cadastro;

import java.net.URI;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rotas")
public class RotaController {
    private final RotaService service;

    public RotaController(RotaService service) { this.service = service; }

    @GetMapping
    public List<RotaResponse> listar() { return service.listar(); }

    @GetMapping("/{id}")
    public RotaResponse buscar(@PathVariable Long id) { return service.buscar(id); }

    @PostMapping
    public ResponseEntity<RotaResponse> criar(@Valid @RequestBody RotaRequest dados) {
        var resposta = service.criar(dados);
        return ResponseEntity.created(URI.create("/api/rotas/" + resposta.id())).body(resposta);
    }

    @PutMapping("/{id}")
    public RotaResponse atualizar(@PathVariable Long id, @Valid @RequestBody RotaRequest dados) {
        return service.atualizar(id, dados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
