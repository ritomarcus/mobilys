package br.com.mobilys.cadastro;
import br.com.mobilys.usuario.UsuarioPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import static br.com.mobilys.cadastro.ModeloService.*;
@RestController @RequestMapping("/api")
public class ModeloController {
    private final ModeloService service;
    public ModeloController(ModeloService service){this.service=service;}
    @GetMapping("/responsaveis") public Object listar(){return service.responsaveis();}
    @PostMapping("/responsaveis") @ResponseStatus(org.springframework.http.HttpStatus.CREATED) public Object criar(@Valid @RequestBody ResponsavelRequest d){return service.salvarResponsavel(null,d);}
    @PutMapping("/responsaveis/{id}") public Object salvar(@PathVariable Long id,@Valid @RequestBody ResponsavelRequest d){return service.salvarResponsavel(id,d);}
    @DeleteMapping("/responsaveis/{id}") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void excluir(@PathVariable Long id){service.excluirResponsavel(id);}
    @GetMapping("/alunos/{id}/familia") public Object familia(@PathVariable Long id){return service.familia(id);}
    @PutMapping("/alunos/{id}/familia") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void familia(@PathVariable Long id,@Valid @RequestBody FamiliaRequest d,@AuthenticationPrincipal UsuarioPrincipal u){service.salvarFamilia(id,d,u.id());}
    @GetMapping("/rotas/{id}/associacoes") public Object associacoes(@PathVariable Long id){return service.associacoes(id);}
    @PutMapping("/rotas/{id}/associacoes") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void associacoes(@PathVariable Long id,@Valid @RequestBody Associacoes d){service.salvarAssociacoes(id,d);}
}
