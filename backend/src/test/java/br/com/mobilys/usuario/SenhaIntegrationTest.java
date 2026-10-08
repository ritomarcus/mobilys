package br.com.mobilys.usuario;

import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties="spring.datasource.url=${DB_TEST_URL}")
class SenhaIntegrationTest {
    @Autowired UsuarioService usuarios;
    @Autowired PasswordEncoder encoder;
    @Autowired Validator validator;

    @Test
    void aceitaSenhaCurtaNaCriacaoEdicaoETrocaPessoal() {
        var criado = usuarios.criar(new UsuarioRequest("Teste senha", "senha-curta@teste.local", "RESPONSAVEL", "a"));
        var usuario = usuarios.porId(criado.id());
        assertThat(encoder.matches("a", usuario.senhaHash())).isTrue();
        usuarios.atualizar(criado.id(), new UsuarioRequest("Teste senha", usuario.email(), "RESPONSAVEL", ""), criado.id());
        assertThat(usuarios.porId(criado.id()).senhaHash()).isEqualTo(usuario.senhaHash());
        usuarios.atualizar(criado.id(), new UsuarioRequest("Teste senha", usuario.email(), "RESPONSAVEL", "bc"), criado.id());
        assertThat(encoder.matches("bc", usuarios.porId(criado.id()).senhaHash())).isTrue();
        assertThat(validator.validate(new AuthController.SenhaRequest("bc", "d"))).isEmpty();
        usuarios.alterarSenha(usuario, "bc", "d");
        assertThat(encoder.matches("d", usuarios.porId(criado.id()).senhaHash())).isTrue();
        assertThat(usuarios.porId(criado.id()).versao()).isGreaterThan(usuario.versao());
    }

    @Test
    void recusaSenhasVaziasEMantemLimitesSuperiores() {
        for (String senha : new String[]{null, "", "   ", "a".repeat(65), "á".repeat(37)}) {
            assertThatThrownBy(() -> usuarios.criar(new UsuarioRequest("Teste senha", "senha-invalida@teste.local", "RESPONSAVEL", senha)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(400));
        }
        assertThat(validator.validate(new AuthController.SenhaRequest("a", ""))).isNotEmpty();
    }
}
