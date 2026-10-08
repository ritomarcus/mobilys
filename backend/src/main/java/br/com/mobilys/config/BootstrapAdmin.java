package br.com.mobilys.config;

import br.com.mobilys.usuario.UsuarioService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final UsuarioService usuarios;
    private final String email;
    private final String senha;
    public BootstrapAdmin(UsuarioService usuarios,
            @Value("${mobilys.bootstrap.email}") String email,
            @Value("${mobilys.bootstrap.password}") String senha) {
        this.usuarios = usuarios; this.email = email; this.senha = senha;
    }
    @Override public void run(ApplicationArguments args) {
        if (!email.isBlank() && !senha.isBlank()) usuarios.bootstrap(email, senha);
    }
}
