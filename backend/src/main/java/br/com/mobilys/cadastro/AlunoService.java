package br.com.mobilys.cadastro;
import br.com.mobilys.operacao.OperacaoLock;


import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AlunoService {
    private final OperacaoLock operacaoLock;
    private final AlunoRepository repository;
    private final RotaRepository rotas;
    private final org.springframework.jdbc.core.JdbcTemplate db;

    public AlunoService(AlunoRepository repository, RotaRepository rotas, OperacaoLock operacaoLock, org.springframework.jdbc.core.JdbcTemplate db) {
        this.db = db;
        this.operacaoLock = operacaoLock;
        this.repository = repository;
        this.rotas = rotas;
    }
    public List<AlunoResponse> listar() {
        return repository.findAll(Sort.by("id")).stream().map(AlunoResponse::de).toList();
    }
    public AlunoResponse buscar(Long id) { return AlunoResponse.de(obter(id)); }
    private Aluno obter(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno não encontrado."));
    }
    @Transactional
    public AlunoResponse criar(AlunoRequest dados) {
        operacaoLock.bloquear();
        return salvar(new Aluno(), dados);
    }
    @Transactional
    public AlunoResponse atualizar(Long id, AlunoRequest dados) {
        operacaoLock.bloquear();
        return salvar(obter(id), dados);
    }
    private AlunoResponse salvar(Aluno registro, AlunoRequest dados) {
        if (dados.usuarioId()!=null && db.queryForObject("SELECT count(*) FROM usuarios WHERE id=? AND perfil='RESPONSAVEL'",Integer.class,dados.usuarioId())!=1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selecione uma conta de aluno/responsável.");
        if (registro.getId() != null) {
            if (db.queryForObject("SELECT count(*) FROM participantes p JOIN viagens v ON v.id=p.viagem_id WHERE p.aluno_id=? AND v.status='EM_ANDAMENTO'", Integer.class, registro.getId()) > 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Aguarde o encerramento da viagem para editar o aluno.");
            if (!registro.getRota().getId().equals(dados.rotaId())) {
                db.update("UPDATE alunos SET parada_ida_id=NULL,parada_volta_id=NULL WHERE id=?",registro.getId());
                db.update("UPDATE alunos_pontos SET ativo=false WHERE aluno_id=?",registro.getId());
                db.update("UPDATE agendamentos SET status='CANCELADO',atualizado_em=now() WHERE aluno_id=? AND data_servico>=(now() AT TIME ZONE 'America/Sao_Paulo')::date",registro.getId());
            }
        }
        Rota rota = rotas.findById(dados.rotaId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Rota não encontrada."));
        registro.atualizar(dados, rota);
        return AlunoResponse.de(repository.saveAndFlush(registro));
    }
    @Transactional
    public void excluir(Long id) {
        operacaoLock.bloquear();
        repository.delete(obter(id));
        repository.flush();
    }
}
