package br.com.mobilys.cadastro;

import java.net.URI;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.mobilys.cadastro.TransporteService.MotoristaResponse;
import br.com.mobilys.cadastro.TransporteService.VeiculoResponse;

@RestController
@RequestMapping("/api")
public class TransporteController {
    private final TransporteService service;
    public TransporteController(TransporteService service) { this.service = service; }
    @GetMapping("/motoristas") public List<MotoristaResponse> motoristas() { return service.motoristas(); }
    @GetMapping("/veiculos") public List<VeiculoResponse> veiculos() { return service.veiculos(); }
    @PostMapping("/motoristas") public ResponseEntity<MotoristaResponse> criarMotorista(@Valid @RequestBody MotoristaRequest dados) {
        var r = service.salvarMotorista(null, dados); return ResponseEntity.created(URI.create("/api/motoristas/" + r.id())).body(r);
    }
    @PostMapping("/veiculos") public ResponseEntity<VeiculoResponse> criarVeiculo(@Valid @RequestBody VeiculoRequest dados) {
        var r = service.salvarVeiculo(null, dados); return ResponseEntity.created(URI.create("/api/veiculos/" + r.id())).body(r);
    }
    @PutMapping("/motoristas/{id}") public MotoristaResponse editarMotorista(@PathVariable Long id, @Valid @RequestBody MotoristaRequest dados) { return service.salvarMotorista(id, dados); }
    @PutMapping("/veiculos/{id}") public VeiculoResponse editarVeiculo(@PathVariable Long id, @Valid @RequestBody VeiculoRequest dados) { return service.salvarVeiculo(id, dados); }
    @DeleteMapping("/motoristas/{id}") public ResponseEntity<Void> excluirMotorista(@PathVariable Long id) { service.excluirMotorista(id); return ResponseEntity.noContent().build(); }
    @DeleteMapping("/veiculos/{id}") public ResponseEntity<Void> excluirVeiculo(@PathVariable Long id) { service.excluirVeiculo(id); return ResponseEntity.noContent().build(); }
}
