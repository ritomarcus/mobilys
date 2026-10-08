package br.com.mobilys.cadastro;
import br.com.mobilys.operacao.OperacaoLock;


import java.util.List;
import java.util.Locale;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class TransporteService {
    private final OperacaoLock operacaoLock;
    public record MotoristaResponse(Long id, String nome, String cnh, String telefone, Long usuarioId, String cpf, java.time.LocalDate validadeCnh) {}
    public record VeiculoResponse(Long id, String placa, String modelo, int capacidade, Long motoristaId, Integer anoFabricacao, boolean ativo) {}
    private final JdbcTemplate db;
    public TransporteService(JdbcTemplate db, OperacaoLock operacaoLock) {
        this.operacaoLock = operacaoLock; this.db = db; }
    public List<MotoristaResponse> motoristas() {
        return db.query("SELECT * FROM motoristas ORDER BY id", (rs,n) -> new MotoristaResponse(rs.getLong("id"),
            rs.getString("nome"), rs.getString("cnh"), rs.getString("telefone"), rs.getLong("usuario_id"),rs.getString("cpf"),rs.getObject("validade_cnh",java.time.LocalDate.class)));
    }
    public List<VeiculoResponse> veiculos() {
        return db.query("SELECT * FROM veiculos ORDER BY id", (rs,n) -> new VeiculoResponse(rs.getLong("id"),
            rs.getString("placa"), rs.getString("modelo"), rs.getInt("capacidade"), rs.getObject("motorista_id", Long.class),rs.getObject("ano_fabricacao",Integer.class),rs.getBoolean("ativo")));
    }
    @Transactional
    public MotoristaResponse salvarMotorista(Long id, MotoristaRequest dados) {
        operacaoLock.bloquear();
        var perfis = db.queryForList("SELECT perfil FROM usuarios WHERE id=? FOR UPDATE", String.class, dados.usuarioId());
        if (perfis.isEmpty() || !perfis.getFirst().equals("MOTORISTA"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione uma conta com perfil Motorista.");
        if (id == null) id = db.queryForObject("INSERT INTO motoristas (nome,cnh,telefone,usuario_id) VALUES (?,?,?,?) RETURNING id",
            Long.class, dados.nome().strip(), dados.cnh(), dados.telefone().strip(), dados.usuarioId());
        else if (db.update("UPDATE motoristas SET nome=?,cnh=?,telefone=?,usuario_id=? WHERE id=?",
            dados.nome().strip(), dados.cnh(), dados.telefone().strip(), dados.usuarioId(), id) == 0) naoEncontrado();
        db.update("UPDATE motoristas SET cpf=?,validade_cnh=? WHERE id=?",dados.cpf(),dados.validadeCnh(),id);
        return new MotoristaResponse(id,dados.nome().strip(),dados.cnh(),dados.telefone().strip(),dados.usuarioId(),dados.cpf(),dados.validadeCnh());
    }
    @Transactional
    public VeiculoResponse salvarVeiculo(Long id, VeiculoRequest dados) {
        operacaoLock.bloquear();
        validarVeiculoDisponivel(id);
        if (dados.motoristaId() != null && db.queryForObject("SELECT count(*) FROM motoristas WHERE id=?", Integer.class, dados.motoristaId()) == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motorista não encontrado.");
        String placa = dados.placa().toUpperCase(Locale.ROOT).replace("-", "");
        if (id == null) id = db.queryForObject("INSERT INTO veiculos (placa,modelo,capacidade,motorista_id) VALUES (?,?,?,?) RETURNING id",
            Long.class, placa, dados.modelo().strip(), dados.capacidade(), dados.motoristaId());
        else if (db.update("UPDATE veiculos SET placa=?,modelo=?,capacidade=?,motorista_id=? WHERE id=?",
            placa, dados.modelo().strip(), dados.capacidade(), dados.motoristaId(), id) == 0) naoEncontrado();
        db.update("UPDATE veiculos SET ano_fabricacao=?,ativo=COALESCE(?,ativo) WHERE id=?",dados.anoFabricacao(),dados.ativo(),id);
        final Long salvo=id; return veiculos().stream().filter(v->v.id().equals(salvo)).findFirst().orElseThrow();
    }
    @Transactional public void excluirMotorista(Long id) {
        operacaoLock.bloquear(); if (db.update("DELETE FROM motoristas WHERE id=?", id) == 0) naoEncontrado(); }
    @Transactional public void excluirVeiculo(Long id) {
        operacaoLock.bloquear(); validarVeiculoDisponivel(id); if (db.update("DELETE FROM veiculos WHERE id=?", id) == 0) naoEncontrado(); }
    private void validarVeiculoDisponivel(Long id) {
        if (id != null && db.queryForObject("SELECT count(*) FROM viagens v JOIN veiculos c ON c.placa=v.placa WHERE c.id=? AND v.status='EM_ANDAMENTO'", Integer.class, id) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Aguarde o encerramento da viagem para alterar o veículo.");
    }
    private void naoEncontrado() { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro não encontrado."); }
}
