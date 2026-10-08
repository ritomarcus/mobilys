package br.com.mobilys.operacao;

import br.com.mobilys.usuario.UsuarioPrincipal;
import java.sql.Timestamp;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static br.com.mobilys.operacao.OperacaoRequests.*;

@Service
@Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
public class OperacaoService {
    private static final String ACESSO="(? IN (SELECT a.usuario_id UNION ALL SELECT r.usuario_id FROM responsaveis_alunos ra JOIN responsaveis r ON r.id=ra.responsavel_id WHERE ra.aluno_id=a.id))";
    private final JdbcTemplate db;
    private final OperacaoLock lock;
    private final Clock clock;
    public OperacaoService(JdbcTemplate db, OperacaoLock lock, Clock clock) { this.db=db; this.lock=lock; this.clock=clock; }
    public LocalDate hoje() { return LocalDate.now(clock.withZone(ZoneId.of("America/Sao_Paulo"))); }
    private Timestamp agora() { return Timestamp.from(clock.instant()); }
    private long numero(Object valor) { return ((Number) valor).longValue(); }
    private void erro(HttpStatus status, String mensagem) { throw new ResponseStatusException(status,mensagem); }
    private void perfil(UsuarioPrincipal u, String... perfis) {
        if (!Arrays.asList(perfis).contains(u.perfil())) erro(HttpStatus.FORBIDDEN,"Operação não permitida para seu perfil.");
    }
    private List<Map<String,Object>> lista(String sql, Object... args) {
        var rows=db.queryForList(sql,args);
        rows.forEach(row->row.replaceAll((k,v)->v instanceof Timestamp t?t.toInstant().toString():v instanceof java.sql.Date d?d.toLocalDate().toString():v instanceof java.sql.Time t?t.toLocalTime().toString():v));
        return rows;
    }
    private Map<String,Object> unico(String sql,Object...args) {
        var rows=lista(sql,args); if(rows.isEmpty()) erro(HttpStatus.NOT_FOUND,"Registro não encontrado."); return rows.getFirst();
    }
    private int contar(String sql,Object...args) { return db.queryForObject(sql,Integer.class,args); }
    private void evento(UsuarioPrincipal u, Long viagem, String entidade, long id, String acao, String detalhe) {
        db.update("INSERT INTO eventos(usuario_id,viagem_id,entidade,registro_id,acao,detalhe,em) VALUES(?,?,?,?,?,?,?)",
            u.id(),viagem,entidade,id,acao,detalhe,agora());
    }
    public List<Map<String,Object>> vinculos(UsuarioPrincipal u) {
        perfil(u,"ADMIN"); return lista("SELECT id,rota_id,responsavel_usuario_id,parada_ida_id,parada_volta_id FROM alunos ORDER BY id");
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public void vincular(UsuarioPrincipal u,Long id,Vinculo dados) {
        perfil(u,"ADMIN"); lock.bloquear();
        var aluno=unico("SELECT * FROM alunos WHERE id=?",id);
        if(contar("SELECT count(*) FROM participantes p JOIN viagens v ON v.id=p.viagem_id WHERE p.aluno_id=? AND v.status='EM_ANDAMENTO'",id)>0)
            erro(HttpStatus.CONFLICT,"Aguarde o encerramento da viagem antes de alterar os vínculos do aluno.");
        if(dados.responsavelUsuarioId()!=null && contar("SELECT count(*) FROM usuarios WHERE id=? AND perfil='RESPONSAVEL'",dados.responsavelUsuarioId())!=1)
            erro(HttpStatus.BAD_REQUEST,"Selecione uma conta de responsável.");
        validarParada(dados.paradaIdaId(),numero(aluno.get("rota_id")),"IDA");
        validarParada(dados.paradaVoltaId(),numero(aluno.get("rota_id")),"VOLTA");
        db.update("UPDATE alunos SET responsavel_usuario_id=?,parada_ida_id=?,parada_volta_id=? WHERE id=?",
            dados.responsavelUsuarioId(),dados.paradaIdaId(),dados.paradaVoltaId(),id);
        db.update("DELETE FROM responsaveis_alunos WHERE aluno_id=?",id);
        if(dados.responsavelUsuarioId()!=null){
            db.update("INSERT INTO responsaveis(usuario_id) VALUES(?) ON CONFLICT(usuario_id) DO NOTHING",dados.responsavelUsuarioId());
            db.update("INSERT INTO responsaveis_alunos(responsavel_id,aluno_id,parentesco) SELECT id,?,'Responsável' FROM responsaveis WHERE usuario_id=?",id,dados.responsavelUsuarioId());
        }
        db.update("UPDATE alunos_pontos SET ativo=false WHERE aluno_id=?",id);
        for(Long p:Arrays.asList(dados.paradaIdaId(),dados.paradaVoltaId()))if(p!=null)db.update("INSERT INTO alunos_pontos(aluno_id,parada_id) VALUES(?,?) ON CONFLICT(aluno_id,parada_id) DO UPDATE SET ativo=true",id,p);
        evento(u,null,"ALUNO",id,"VINCULOS", "Responsável="+dados.responsavelUsuarioId()+", ida="+dados.paradaIdaId()+", volta="+dados.paradaVoltaId());
    }
    private void validarParada(Long id,long rota,String trajeto) {
        if(id!=null && contar("SELECT count(*) FROM paradas WHERE id=? AND rota_id=? AND trajeto=? AND tipo IN ('EMBARQUE','AMBOS')",id,rota,trajeto)!=1)
            erro(HttpStatus.BAD_REQUEST,"O ponto deve permitir embarque e pertencer à rota e ao trajeto do aluno.");
    }
    public List<Map<String,Object>> alunosFamilia(UsuarioPrincipal u) {
        perfil(u,"RESPONSAVEL");
        return lista("SELECT a.id,a.nome,a.matricula,a.turma,a.rota_id,r.nome AS rota_nome,p.local AS ponto_ida,q.local AS ponto_volta FROM alunos a JOIN rotas r ON r.id=a.rota_id LEFT JOIN paradas p ON p.id=a.parada_ida_id LEFT JOIN paradas q ON q.id=a.parada_volta_id WHERE "+ACESSO+" ORDER BY a.nome",u.id());
    }
    public List<Map<String,Object>> agenda(UsuarioPrincipal u,LocalDate data) {
        perfil(u,"RESPONSAVEL");
        var rows=lista("SELECT a.id AS aluno_id,a.nome,a.rota_id,r.nome AS rota_nome,r.ativo AS rota_ativa,t.trajeto,COALESCE(g.status,'PENDENTE') AS status,v.id AS viagem_id,v.status AS viagem_status,COALESCE(g.parada_id,CASE WHEN t.trajeto='IDA' THEN a.parada_ida_id ELSE a.parada_volta_id END) AS parada_id FROM alunos a JOIN rotas r ON r.id=a.rota_id CROSS JOIN (VALUES ('IDA'),('VOLTA')) AS t(trajeto) LEFT JOIN agendamentos g ON g.aluno_id=a.id AND g.data_servico=? AND g.trajeto=t.trajeto LEFT JOIN viagens v ON v.rota_id=a.rota_id AND v.data_servico=? AND v.trajeto=t.trajeto WHERE "+ACESSO+" ORDER BY a.nome,t.trajeto",data,data,u.id());
        for(var row:rows)row.put("pontos",lista("SELECT p.id,p.local,p.horario,p.endereco,p.latitude,p.longitude FROM alunos_pontos ap JOIN paradas p ON p.id=ap.parada_id WHERE ap.aluno_id=? AND ap.ativo AND p.rota_id=? AND p.trajeto=? AND p.tipo<>'DESEMBARQUE' ORDER BY p.ordem",row.get("aluno_id"),row.get("rota_id"),row.get("trajeto")));
        return rows;
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public void confirmar(UsuarioPrincipal u,Agenda dados) {
        perfil(u,"RESPONSAVEL"); lock.bloquear();
        if(dados.data().isBefore(hoje())||dados.data().isAfter(hoje().plusDays(30))) erro(HttpStatus.BAD_REQUEST,"Agende entre hoje e os próximos 30 dias.");
        var aluno=unico("SELECT a.* FROM alunos a WHERE a.id=? AND "+ACESSO,dados.alunoId(),u.id());
        if(contar("SELECT count(*) FROM viagens WHERE rota_id=? AND data_servico=? AND trajeto=?",aluno.get("rota_id"),dados.data(),dados.trajeto())>0)
            erro(HttpStatus.CONFLICT,"O trajeto já foi iniciado. Não é mais possível alterar a confirmação.");
        Object parada=dados.paradaId()!=null?dados.paradaId():aluno.get(dados.trajeto().equals("IDA")?"parada_ida_id":"parada_volta_id");
        if(dados.status().equals("CONFIRMADO")) {
            if(contar("SELECT count(*) FROM rotas WHERE id=? AND ativo",aluno.get("rota_id"))!=1)erro(HttpStatus.CONFLICT,"Esta rota está inativa.");
            if(parada!=null&&contar("SELECT count(*) FROM alunos_pontos WHERE aluno_id=? AND parada_id=? AND ativo",dados.alunoId(),parada)!=1)erro(HttpStatus.CONFLICT,"Ponto não autorizado para este aluno.");
            if(parada==null) erro(HttpStatus.CONFLICT,"Peça à administração para associar um ponto de embarque ao aluno.");
            validarParada(numero(parada),numero(aluno.get("rota_id")),dados.trajeto());
        }
        var antes=lista("SELECT status,parada_id FROM agendamentos WHERE aluno_id=? AND data_servico=? AND trajeto=?",dados.alunoId(),dados.data(),dados.trajeto());
        String anterior=antes.isEmpty()?"PENDENTE":antes.getFirst().get("status").toString();
        if(anterior.equals(dados.status())&&!antes.isEmpty()&&Objects.equals(antes.getFirst().get("parada_id"),parada)) return;
        db.update("INSERT INTO agendamentos(aluno_id,data_servico,trajeto,status,atualizado_em,parada_id) VALUES(?,?,?,?,?,?) ON CONFLICT(aluno_id,data_servico,trajeto) DO UPDATE SET status=excluded.status,atualizado_em=excluded.atualizado_em,parada_id=excluded.parada_id",dados.alunoId(),dados.data(),dados.trajeto(),dados.status(),agora(),parada);
        evento(u,null,"ALUNO",dados.alunoId(),"AGENDAMENTO",dados.data()+" "+dados.trajeto()+": "+anterior+" -> "+dados.status()+"; ponto "+parada);
    }
    private List<Map<String,Object>> veiculosRota(Long id){return lista("SELECT DISTINCT v.id,v.placa,v.modelo,v.capacidade FROM veiculos v WHERE v.ativo AND (v.id=(SELECT veiculo_id FROM rotas WHERE id=?) OR v.id IN (SELECT veiculo_id FROM rotas_veiculos WHERE rota_id=?)) ORDER BY v.placa",id,id);}
    public List<Map<String,Object>> rotasMotorista(UsuarioPrincipal u) {
        perfil(u,"MOTORISTA");
        var rows=lista("SELECT DISTINCT r.id,r.nome,r.turno,r.origem,r.destino,v.placa,v.capacidade FROM rotas r LEFT JOIN veiculos v ON v.id=r.veiculo_id WHERE r.ativo AND (EXISTS(SELECT 1 FROM motoristas m WHERE m.id=v.motorista_id AND m.usuario_id=?) OR EXISTS(SELECT 1 FROM rotas_motoristas rm JOIN motoristas m ON m.id=rm.motorista_id WHERE rm.rota_id=r.id AND m.usuario_id=?)) ORDER BY r.nome",u.id(),u.id());
        for(var row:rows)row.put("veiculos",veiculosRota(numero(row.get("id"))));return rows;
    }
    public List<Map<String,Object>> viagens(UsuarioPrincipal u,LocalDate data) {
        String where=""; List<Object> args=new ArrayList<>(); args.add(data);
        if(u.perfil().equals("MOTORISTA")) { where=" AND v.motorista_usuario_id=?";args.add(u.id()); }
        else if(u.perfil().equals("RESPONSAVEL")) { where=" AND EXISTS(SELECT 1 FROM participantes p JOIN alunos a ON a.id=p.aluno_id WHERE p.viagem_id=v.id AND "+ACESSO+")";args.add(u.id()); }
        else perfil(u,"ADMIN");
        return lista("SELECT v.* FROM viagens v WHERE (v.data_servico=? OR v.status='EM_ANDAMENTO')"+where+" ORDER BY v.iniciada_em DESC",args.toArray());
    }
    public Map<String,Object> viagem(UsuarioPrincipal u,Long id) {
        var v=unico("SELECT * FROM viagens WHERE id=?",id);
        String filtro=""; List<Object> args=new ArrayList<>();args.add(id);
        if(u.perfil().equals("MOTORISTA")) { if(numero(v.get("motorista_usuario_id"))!=u.id()) erro(HttpStatus.NOT_FOUND,"Viagem não encontrada."); }
        else if(u.perfil().equals("RESPONSAVEL")) {
            if(contar("SELECT count(*) FROM participantes p JOIN alunos a ON a.id=p.aluno_id WHERE p.viagem_id=? AND "+ACESSO+"",id,u.id())==0) erro(HttpStatus.NOT_FOUND,"Viagem não encontrada.");
            filtro=" AND "+ACESSO+"";args.add(u.id());
        } else perfil(u,"ADMIN");
        v.put("paradas",lista("SELECT ordem,local,referencia,horario,tipo,endereco,latitude,longitude FROM viagem_paradas WHERE viagem_id=? ORDER BY ordem",id));
        v.put("alunos",lista("SELECT p.* FROM participantes p JOIN alunos a ON a.id=p.aluno_id WHERE p.viagem_id=?"+filtro+" ORDER BY p.embarque_ordem,p.aluno_nome",args.toArray()));
        return v;
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public Map<String,Object> iniciar(UsuarioPrincipal u,Iniciar dados) {
        perfil(u,"MOTORISTA");lock.bloquear();
        var existentes=lista("SELECT id,motorista_usuario_id FROM viagens WHERE rota_id=? AND data_servico=? AND trajeto=?",dados.rotaId(),hoje(),dados.trajeto());
        if(!existentes.isEmpty()) return viagem(u,numero(existentes.getFirst().get("id")));
        if(rotasMotorista(u).stream().noneMatch(r->numero(r.get("id"))==dados.rotaId()))erro(HttpStatus.NOT_FOUND,"Rota não atribuída ou inativa.");
        var r=unico("SELECT * FROM rotas WHERE id=? AND ativo",dados.rotaId());
        var m=unico("SELECT * FROM motoristas WHERE usuario_id=?",u.id());
        if(m.get("validade_cnh")!=null && LocalDate.parse(m.get("validade_cnh").toString()).isBefore(hoje()))erro(HttpStatus.CONFLICT,"A validade da CNH precisa ser atualizada antes de iniciar uma viagem.");
        var opcoes=veiculosRota(dados.rotaId());
        Long escolhido=dados.veiculoId()!=null?dados.veiculoId():r.get("veiculo_id")!=null?numero(r.get("veiculo_id")):opcoes.isEmpty()?null:numero(opcoes.getFirst().get("id"));
        var veiculo=opcoes.stream().filter(v->Objects.equals(v.get("id"),escolhido)).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,"Selecione um veículo ativo associado à rota."));
        r.put("placa",veiculo.get("placa"));r.put("capacidade",veiculo.get("capacidade"));r.put("motorista_nome",m.get("nome"));
        if(contar("SELECT count(*) FROM viagens WHERE status='EM_ANDAMENTO' AND (motorista_usuario_id=? OR veiculo_id=? OR placa=?)",u.id(),escolhido,r.get("placa"))>0)
            erro(HttpStatus.CONFLICT,"Este motorista ou veículo já possui uma viagem em andamento.");
        var paradas=lista("SELECT * FROM paradas WHERE rota_id=? AND trajeto=? ORDER BY ordem",dados.rotaId(),dados.trajeto());
        if(paradas.isEmpty()) erro(HttpStatus.CONFLICT,"Cadastre o itinerário deste trajeto antes de iniciar.");
        var alunos=lista("SELECT a.*,g.parada_id AS embarque_agendado FROM alunos a JOIN agendamentos g ON g.aluno_id=a.id WHERE a.rota_id=? AND g.data_servico=? AND g.trajeto=? AND g.status='CONFIRMADO' ORDER BY a.id",dados.rotaId(),hoje(),dados.trajeto());
        if(alunos.size()>numero(r.get("capacidade"))) erro(HttpStatus.CONFLICT,"A quantidade de alunos confirmados excede a capacidade do veículo.");
        String coluna="embarque_agendado";
        for(var a:alunos) {
            if(contar("SELECT count(*) FROM alunos_pontos WHERE aluno_id=? AND parada_id=? AND ativo",a.get("id"),a.get(coluna))!=1)
                erro(HttpStatus.CONFLICT,"Há confirmação para um ponto que não está mais autorizado. Atualize o agendamento.");
            if(a.get(coluna)==null || paradas.stream().noneMatch(p->numero(p.get("id"))==numero(a.get(coluna)) && !p.get("tipo").equals("DESEMBARQUE")))
                erro(HttpStatus.CONFLICT,"Há aluno confirmado sem ponto de embarque válido.");
            long embarque=numero(paradas.stream().filter(p->numero(p.get("id"))==numero(a.get(coluna))).findFirst().orElseThrow().get("ordem"));
            if(paradas.stream().anyMatch(p->!p.get("tipo").equals("EMBARQUE")) && paradas.stream().noneMatch(p->!p.get("tipo").equals("EMBARQUE")&&numero(p.get("ordem"))>=embarque))
                erro(HttpStatus.CONFLICT,"O itinerário precisa de uma parada de desembarque após os embarques confirmados.");
        }
        Long id=db.queryForObject("INSERT INTO viagens(rota_id,motorista_usuario_id,rota_nome,motorista_nome,placa,data_servico,trajeto,iniciada_em,veiculo_id) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id",Long.class,dados.rotaId(),u.id(),r.get("nome"),r.get("motorista_nome"),r.get("placa"),hoje(),dados.trajeto(),agora(),escolhido);
        db.update("INSERT INTO viagem_paradas(viagem_id,parada_original_id,ordem,local,referencia,horario,tipo,endereco,latitude,longitude) SELECT ?,id,ordem,local,referencia,horario,tipo,endereco,latitude,longitude FROM paradas WHERE rota_id=? AND trajeto=?",id,dados.rotaId(),dados.trajeto());
        for(var a:alunos) {
            var p=paradas.stream().filter(parada->numero(parada.get("id"))==numero(a.get(coluna))).findFirst().orElseThrow();
            db.update("INSERT INTO participantes(viagem_id,aluno_id,aluno_nome,embarque_ordem) VALUES(?,?,?,?)",id,a.get("id"),a.get("nome"),p.get("ordem"));
        }
        evento(u,id,"VIAGEM",id,"INICIAR",alunos.size()+" alunos confirmados; itinerário fixado.");
        return viagem(u,id);
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public Map<String,Object> agir(UsuarioPrincipal u,Long id,Acao dados) {
        perfil(u,"MOTORISTA");lock.bloquear();
        var v=unico("SELECT * FROM viagens WHERE id=? AND motorista_usuario_id=? FOR UPDATE",id,u.id());
        if(numero(v.get("versao"))!=dados.versao()) erro(HttpStatus.CONFLICT,"A viagem foi atualizada. Recarregue antes de tentar novamente.");
        if(!v.get("status").equals("EM_ANDAMENTO")) erro(HttpStatus.CONFLICT,"Esta viagem já foi encerrada.");
        int ponto=(int)numero(v.get("ponto_atual")); boolean noPonto=(boolean)v.get("no_ponto");
        int total=contar("SELECT count(*) FROM viagem_paradas WHERE viagem_id=?",id);
        switch(dados.acao()) {
            case "CHEGAR" -> {
                if(noPonto||ponto>total) erro(HttpStatus.CONFLICT,"Não há deslocamento pendente para esta parada.");
                db.update("UPDATE viagens SET no_ponto=true WHERE id=?",id);
            }
            case "PRESENCA" -> {
                if(dados.alunoId()==null||dados.status()==null) erro(HttpStatus.BAD_REQUEST,"Informe o aluno e a presença.");
                var p=unico("SELECT * FROM participantes WHERE viagem_id=? AND aluno_id=?",id,dados.alunoId());
                if(p.get("desembarque_em")!=null) erro(HttpStatus.CONFLICT,"O aluno já desembarcou. A presença não pode ser alterada.");
                if(!noPonto||numero(p.get("embarque_ordem"))!=ponto) erro(HttpStatus.CONFLICT,"Registre a presença apenas na parada de embarque do aluno.");
                db.update("UPDATE participantes SET status=?,entrada_em=CASE WHEN ?='AUSENTE' THEN NULL WHEN status='PRESENTE' THEN entrada_em ELSE ? END,registrado_em=? WHERE viagem_id=? AND aluno_id=?",dados.status(),dados.status(),agora(),agora(),id,dados.alunoId());
                evento(u,id,"ALUNO",dados.alunoId(),"PRESENCA",p.get("status")+" -> "+dados.status());
            }
            case "DESEMBARCAR" -> {
                if(dados.alunoId()==null) erro(HttpStatus.BAD_REQUEST,"Informe o aluno.");
                if(!noPonto || contar("SELECT count(*) FROM viagem_paradas WHERE viagem_id=? AND ordem=? AND tipo IN ('DESEMBARQUE','AMBOS')",id,ponto)==0)
                    erro(HttpStatus.CONFLICT,"Confirme a chegada a uma parada de desembarque.");
                var p=unico("SELECT * FROM participantes WHERE viagem_id=? AND aluno_id=?",id,dados.alunoId());
                if(!p.get("status").equals("PRESENTE")) erro(HttpStatus.CONFLICT,"Somente alunos presentes podem desembarcar.");
                if(p.get("desembarque_em")!=null) erro(HttpStatus.CONFLICT,"Desembarque já registrado.");
                db.update("UPDATE participantes SET desembarque_em=?,desembarque_ordem=? WHERE viagem_id=? AND aluno_id=?",agora(),ponto,id,dados.alunoId());
                evento(u,id,"ALUNO",dados.alunoId(),"DESEMBARCAR","Desembarque confirmado na parada "+ponto);
            }
            case "AVANCAR" -> {
                if(!noPonto||ponto>total) erro(HttpStatus.CONFLICT,"Confirme a chegada à parada antes de concluí-la.");
                if(contar("SELECT count(*) FROM participantes WHERE viagem_id=? AND embarque_ordem=? AND status='PENDENTE'",id,ponto)>0)
                    erro(HttpStatus.CONFLICT,"Registre os alunos pendentes desta parada.");
                if(ponto==total && contar("SELECT count(*) FROM viagem_paradas WHERE viagem_id=? AND tipo IN ('DESEMBARQUE','AMBOS')",id)>0
                    && contar("SELECT count(*) FROM participantes WHERE viagem_id=? AND status='PRESENTE' AND desembarque_em IS NULL",id)>0)
                    erro(HttpStatus.CONFLICT,"Confirme os desembarques antes de concluir a última parada.");
                db.update("UPDATE viagens SET ponto_atual=ponto_atual+1,no_ponto=false WHERE id=?",id);
            }
            case "ENCERRAR" -> {
                if(ponto<=total||contar("SELECT count(*) FROM participantes WHERE viagem_id=? AND status='PENDENTE'",id)>0)
                    erro(HttpStatus.CONFLICT,"Conclua todas as paradas e presenças antes de encerrar.");
                Timestamp fim=agora();
                db.update("UPDATE viagens SET status='ENCERRADA',encerrada_em=? WHERE id=?",fim,id);
                db.update("UPDATE participantes SET saida_em=? WHERE viagem_id=? AND status='PRESENTE'",fim,id);
                db.update("DELETE FROM localizacoes WHERE viagem_id=?",id);
            }
            default -> erro(HttpStatus.BAD_REQUEST,"Ação inválida.");
        }
        if(!Set.of("PRESENCA","DESEMBARCAR").contains(dados.acao())) evento(u,id,"VIAGEM",id,dados.acao(),"Parada "+ponto);
        db.update("UPDATE viagens SET versao=versao+1 WHERE id=?",id);
        return viagem(u,id);
    }
    public Map<String,Object> historico(UsuarioPrincipal u,LocalDate inicio,LocalDate fim,Long rotaId) {
        perfil(u,"ADMIN","RESPONSAVEL");
        if(fim.isBefore(inicio)||ChronoUnit.DAYS.between(inicio,fim)>366) erro(HttpStatus.BAD_REQUEST,"Informe um período de até 366 dias.");
        String filtro="";List<Object> args=new ArrayList<>(List.of(inicio,fim));
        if(rotaId!=null) { filtro+=" AND v.rota_id=?";args.add(rotaId); }
        if(u.perfil().equals("RESPONSAVEL")) { filtro+=" AND "+ACESSO+"";args.add(u.id()); }
        var presencas=lista("SELECT p.*,v.rota_id,v.rota_nome,v.data_servico,v.trajeto,v.status AS viagem_status FROM participantes p JOIN viagens v ON v.id=p.viagem_id JOIN alunos a ON a.id=p.aluno_id WHERE v.data_servico BETWEEN ? AND ?"+filtro+" ORDER BY v.data_servico DESC,v.id,p.aluno_nome",args.toArray());
        long presentes=presencas.stream().filter(p->p.get("status").equals("PRESENTE")).count();
        long ausentes=presencas.stream().filter(p->p.get("status").equals("AUSENTE")).count();
        Map<String,Object> resposta=new LinkedHashMap<>(); resposta.put("presencas",presencas);
        resposta.put("presentes",presentes);resposta.put("ausentes",ausentes);resposta.put("pendentes",presencas.size()-presentes-ausentes);
        resposta.put("frequencia",presentes+ausentes==0?null:Math.round(1000.0*presentes/(presentes+ausentes))/10.0);
        if(u.perfil().equals("RESPONSAVEL")) resposta.put("agendamentos",lista("SELECT g.*,a.nome AS aluno_nome,r.nome AS rota_nome FROM agendamentos g JOIN alunos a ON a.id=g.aluno_id JOIN rotas r ON r.id=a.rota_id WHERE "+ACESSO+" AND g.data_servico BETWEEN ? AND ? ORDER BY g.data_servico DESC,a.nome",u.id(),inicio,fim));
        return resposta;
    }
    public List<Map<String,Object>> eventos(UsuarioPrincipal u,Long viagemId) {
        perfil(u,"ADMIN");return lista("SELECT e.*,u.nome AS autor FROM eventos e JOIN usuarios u ON u.id=e.usuario_id WHERE e.viagem_id=? ORDER BY e.id",viagemId);
    }
    public Map<String,Object> localizacao(UsuarioPrincipal u,Long id) {
        var v=viagem(u,id); // Mesma autorização de acesso aos passageiros/viagem.
        var rows=lista("SELECT * FROM localizacoes WHERE viagem_id=?",id);
        if(!v.get("status").equals("EM_ANDAMENTO") || rows.isEmpty()) return Map.of("disponivel",false);
        var p=rows.getFirst();
        boolean recente=Instant.parse(p.get("capturada_em").toString()).isAfter(clock.instant().minusSeconds(90));
        p.put("disponivel",true);p.put("recente",recente);return p;
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public void localizar(UsuarioPrincipal u,Long id,Posicao p) {
        perfil(u,"MOTORISTA");lock.bloquear();
        var v=unico("SELECT status FROM viagens WHERE id=? AND motorista_usuario_id=?",id,u.id());
        if(!v.get("status").equals("EM_ANDAMENTO")) erro(HttpStatus.CONFLICT,"Localização disponível somente durante a viagem.");
        if(!Double.isFinite(p.latitude())||!Double.isFinite(p.longitude())||!Double.isFinite(p.precisao())
            ||p.capturadaEm().isBefore(clock.instant().minusSeconds(120))||p.capturadaEm().isAfter(clock.instant().plusSeconds(30)))
            erro(HttpStatus.BAD_REQUEST,"Posição inválida ou antiga. Aguarde uma nova leitura do GPS.");
        db.update("INSERT INTO localizacoes(viagem_id,latitude,longitude,precisao,capturada_em,recebida_em) VALUES(?,?,?,?,?,?) ON CONFLICT(viagem_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,precisao=excluded.precisao,capturada_em=excluded.capturada_em,recebida_em=excluded.recebida_em WHERE localizacoes.capturada_em<excluded.capturada_em",id,p.latitude(),p.longitude(),p.precisao(),Timestamp.from(p.capturadaEm()),agora());
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public void pararLocalizacao(UsuarioPrincipal u,Long id) {
        perfil(u,"MOTORISTA");lock.bloquear();
        unico("SELECT id FROM viagens WHERE id=? AND motorista_usuario_id=?",id,u.id());
        db.update("DELETE FROM localizacoes WHERE viagem_id=?",id);
    }
}
