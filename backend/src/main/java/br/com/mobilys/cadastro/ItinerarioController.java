package br.com.mobilys.cadastro;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rotas/{rotaId}/itinerario")
public class ItinerarioController {
    private final ItinerarioService service;
    public ItinerarioController(ItinerarioService service) { this.service = service; }
    @GetMapping public ItinerarioService.Resposta buscar(@PathVariable Long rotaId) { return service.buscar(rotaId); }
    @PutMapping public ItinerarioService.Resposta salvar(@PathVariable Long rotaId, @Valid @RequestBody ItinerarioRequest dados) { return service.salvar(rotaId, dados); }
}
