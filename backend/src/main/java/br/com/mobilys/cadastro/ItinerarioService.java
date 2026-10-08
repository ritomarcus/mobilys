package br.com.mobilys.cadastro;
import br.com.mobilys.operacao.OperacaoLock;


import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ItinerarioService {
    private final OperacaoLock operacaoLock;
    public record Resposta(long versao, List<ItinerarioRequest.Parada> paradas) {}
    private final JdbcTemplate db;
    public ItinerarioService(JdbcTemplate db, OperacaoLock operacaoLock) {
        this.operacaoLock = operacaoLock; this.db = db; }

    // Versão e lista precisam representar o mesmo instante, mesmo com uma edição concorrente.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Resposta buscar(Long rotaId) { return resposta(rotaId, versao(rotaId, false)); }

    private long versao(Long rotaId, boolean bloquear) {
        var versoes = db.queryForList("SELECT versao_itinerario FROM rotas WHERE id=?" + (bloquear ? " FOR UPDATE" : ""), Long.class, rotaId);
        if (versoes.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rota não encontrada.");
        return versoes.getFirst();
    }
    private Resposta resposta(Long rotaId, long versao) {
        var paradas = db.query("SELECT * FROM paradas WHERE rota_id=? ORDER BY trajeto, ordem", (rs,n) ->
            new ItinerarioRequest.Parada(rs.getLong("id"), rs.getString("trajeto"), rs.getInt("ordem"),
                rs.getString("local"), rs.getString("referencia"), rs.getTime("horario").toLocalTime(), rs.getString("tipo"),rs.getString("endereco"),rs.getObject("latitude",Double.class),rs.getObject("longitude",Double.class)), rotaId);
        return new Resposta(versao, paradas);
    }
    @Transactional
    public Resposta salvar(Long rotaId, ItinerarioRequest dados) {
        operacaoLock.bloquear();
        long atual = versao(rotaId, true);
        if (atual != dados.versao()) throw new ResponseStatusException(HttpStatus.CONFLICT,
            "O itinerário foi alterado por outra pessoa. Feche e abra novamente para revisar a versão atual.");
        var existentes = new HashSet<>(db.queryForList("SELECT id FROM paradas WHERE rota_id=?", Long.class, rotaId));
        Set<Long> mantidos = new HashSet<>();
        for (var p : dados.paradas()) {
            if (p.id() != null && (!existentes.contains(p.id()) || !mantidos.add(p.id())))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parada inválida ou repetida.");
        }
        for (String trajeto : List.of("IDA", "VOLTA")) {
            var ordens = dados.paradas().stream().filter(p -> p.trajeto().equals(trajeto)).map(ItinerarioRequest.Parada::ordem).sorted().toList();
            for (int i=0; i<ordens.size(); i++) if (ordens.get(i) != i+1)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ordem de cada trajeto deve começar em 1 e não ter lacunas ou repetições.");
        }
        for (Long id : existentes) if (!mantidos.contains(id)) db.update("DELETE FROM paradas WHERE id=?", id);
        for (var p : dados.paradas()) {
            String referencia = p.referencia() == null ? "" : p.referencia().strip();
            if (p.id() == null) db.update("INSERT INTO paradas (rota_id,trajeto,ordem,local,referencia,horario,tipo,endereco,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?,?)",
                rotaId, p.trajeto(), p.ordem(), p.local().strip(), referencia, java.sql.Time.valueOf(p.horario()), p.tipo(),p.endereco()==null?"":p.endereco().strip(),p.latitude(),p.longitude());
            else db.update("UPDATE paradas SET trajeto=?,ordem=?,local=?,referencia=?,horario=?,tipo=?,endereco=?,latitude=?,longitude=? WHERE id=? AND rota_id=?",
                p.trajeto(), p.ordem(), p.local().strip(), referencia, java.sql.Time.valueOf(p.horario()), p.tipo(),p.endereco()==null?"":p.endereco().strip(),p.latitude(),p.longitude(), p.id(), rotaId);
        }
        if (db.queryForObject("SELECT count(*) FROM alunos a JOIN paradas p ON p.id=a.parada_ida_id OR p.id=a.parada_volta_id WHERE (p.id=a.parada_ida_id AND (p.trajeto<>'IDA' OR p.tipo='DESEMBARQUE' OR p.rota_id<>a.rota_id)) OR (p.id=a.parada_volta_id AND (p.trajeto<>'VOLTA' OR p.tipo='DESEMBARQUE' OR p.rota_id<>a.rota_id))",Integer.class)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Esta parada está vinculada a um aluno. Ajuste o vínculo antes de mudar o trajeto ou retirar o embarque.");
        if(db.queryForObject("SELECT count(*) FROM alunos_pontos ap JOIN alunos a ON a.id=ap.aluno_id JOIN paradas p ON p.id=ap.parada_id WHERE ap.ativo AND (p.rota_id<>a.rota_id OR p.tipo='DESEMBARQUE')",Integer.class)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"A parada é um embarque autorizado. Ajuste os vínculos antes de mudar a operação.");
        if(db.queryForObject("SELECT count(*) FROM agendamentos g JOIN paradas p ON p.id=g.parada_id WHERE g.status='CONFIRMADO' AND g.data_servico>=(now() AT TIME ZONE 'America/Sao_Paulo')::date AND (p.trajeto<>g.trajeto OR p.tipo='DESEMBARQUE')",Integer.class)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"A parada tem confirmações. Cancele-as antes de alterar trajeto ou operação.");
        db.update("UPDATE rotas SET versao_itinerario=versao_itinerario+1 WHERE id=?", rotaId);
        return resposta(rotaId, atual+1);
    }
}
