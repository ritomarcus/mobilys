package br.com.mobilys.usuario;

import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UsuarioService usuarios;
    public AuthController(UsuarioService usuarios) { this.usuarios=usuarios; }
    public record SenhaRequest(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=64) String atual,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=64) String nova) {}
    @PostMapping("/senha")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void senha(@AuthenticationPrincipal UsuarioPrincipal principal,@jakarta.validation.Valid @RequestBody SenhaRequest dados,
        jakarta.servlet.http.HttpServletRequest request) {
        usuarios.alterarSenha(principal,dados.atual(),dados.nova());
        if(request.getSession(false)!=null) request.getSession(false).invalidate();
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
    @GetMapping("/csrf") public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }
    @GetMapping("/me") public UsuarioResponse me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return principal.resposta();
    }
}
