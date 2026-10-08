package br.com.mobilys.cadastro;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties = "spring.datasource.url=${DB_TEST_URL}")
class CadastroIntegrationTest {
    @Autowired RotaService rotas;
    @Autowired AlunoService alunos;
    @Autowired jakarta.persistence.EntityManager entidades;

    private RotaResponse criarRota() {
        return rotas.criar(new RotaRequest("Rota de teste", "Manhã", "Aguaí", "São João"));
    }

    @Test
    void persisteAlunoComVinculoPorId() {
        var rota = criarRota();
        var aluno = alunos.criar(new AlunoRequest(" Ana ", "TESTE-001", "Manhã", "Maria", rota.id()));
        var salvo = alunos.buscar(aluno.id());
        assertThat(salvo.nome()).isEqualTo("Ana");
        assertThat(salvo.rotaId()).isEqualTo(rota.id());
    }

    @Test
    void impedeExcluirRotaVinculada() {
        var rota = criarRota();
        alunos.criar(new AlunoRequest("Ana", "TESTE-002", "Manhã", "Maria", rota.id()));
        entidades.flush();
        entidades.clear();
        assertThatThrownBy(() -> rotas.excluir(rota.id()))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void impedeNomeDeRotaDuplicadoSemDiferenciarMaiusculas() {
        criarRota();
        assertThatThrownBy(() -> rotas.criar(
            new RotaRequest("ROTA DE TESTE", "Noite", "Aguaí", "São João")))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejeitaAlunoSemRotaExistente() {
        assertThatThrownBy(() -> alunos.criar(
            new AlunoRequest("Ana", "TESTE-003", "Manhã", "Maria", Long.MAX_VALUE)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                erro -> assertThat(erro.getStatusCode().value()).isEqualTo(404));
    }
}
