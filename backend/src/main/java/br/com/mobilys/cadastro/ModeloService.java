package br.com.mobilys.cadastro;

import br.com.mobilys.operacao.OperacaoLock;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly=true)
public class ModeloService {
    public record ResponsavelRequest(@NotNull @Positive Long usuarioId,
        @org.hibernate.validator.constraints.br.CPF String cpf,@Size(max=30) String telefone) {}
    public record ResponsavelLink(@NotNull @Positive Long responsavelId,@NotBlank @Size(max=60) String parentesco) {}
    public record PontoLink(@NotNull @Positive Long paradaId,@NotNull Boolean ativo) {}
    public record FamiliaRequest(@NotNull @Size(max=20) List<@Valid ResponsavelLink> responsaveis,
        @NotNull @Size(max=200) List<@Valid PontoLink> pontos,@Positive Long paradaIdaId,@Positive Long paradaVoltaId) {}
    public record Associacoes(@NotNull @Size(max=100) List<@NotNull @Positive Long> veiculoIds,
        @NotNull @Size(max=100) List<@NotNull @Positive Long> motoristaIds) {}
    private final JdbcTemplate db; private final OperacaoLock lock;
    public ModeloService(JdbcTemplate db,OperacaoLock lock){this.db=db;this.lock=lock;}
    private void erro(String msg){throw new ResponseStatusException(HttpStatus.CONFLICT,msg);}
    private Map<String,Object> obter(String sql,Object...args){var rows=db.queryForList(sql,args);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado.");return rows.getFirst();}
    public List<Map<String,Object>> responsaveis(){return db.queryForList("SELECT r.id,r.usuario_id AS \"usuarioId\",r.cpf,r.telefone,u.nome,u.email,u.ativo FROM responsaveis r JOIN usuarios u ON u.id=r.usuario_id ORDER BY u.nome");}
    @Transactional public Map<String,Object> salvarResponsavel(Long id,ResponsavelRequest d){
        lock.bloquear();if(!obter("SELECT perfil FROM usuarios WHERE id=?",d.usuarioId()).get("perfil").equals("RESPONSAVEL"))erro("Escolha uma conta com perfil Aluno/Responsável.");
        if(id==null)id=db.queryForObject("INSERT INTO responsaveis(usuario_id,cpf,telefone) VALUES(?,?,?) RETURNING id",Long.class,d.usuarioId(),d.cpf(),d.telefone()==null?"":d.telefone().strip());
        else{
            var antes=obter("SELECT usuario_id FROM responsaveis WHERE id=?",id);
            if(!antes.get("usuario_id").equals(d.usuarioId())&&db.queryForObject("SELECT count(*) FROM responsaveis_alunos WHERE responsavel_id=?",Integer.class,id)>0)erro("Desvincule os alunos antes de trocar a conta do responsável.");
            db.update("UPDATE responsaveis SET usuario_id=?,cpf=?,telefone=? WHERE id=?",d.usuarioId(),d.cpf(),d.telefone()==null?"":d.telefone().strip(),id);
        }
        final Long salvo=id;return responsaveis().stream().filter(r->r.get("id").equals(salvo)).findFirst().orElseThrow();
    }
    @Transactional public void excluirResponsavel(Long id){lock.bloquear();obter("SELECT id FROM responsaveis WHERE id=?",id);db.update("DELETE FROM responsaveis WHERE id=?",id);}
    public Map<String,Object> familia(Long alunoId){
        var a=obter("SELECT id,rota_id,parada_ida_id AS \"paradaIdaId\",parada_volta_id AS \"paradaVoltaId\" FROM alunos WHERE id=?",alunoId);
        a.put("responsaveis",db.queryForList("SELECT responsavel_id AS \"responsavelId\",parentesco FROM responsaveis_alunos WHERE aluno_id=? ORDER BY id",alunoId));
        a.put("pontos",db.queryForList("SELECT parada_id AS \"paradaId\",ativo FROM alunos_pontos WHERE aluno_id=?",alunoId));return a;
    }
    @Transactional public void salvarFamilia(Long alunoId,FamiliaRequest d,Long autor){
        lock.bloquear();var a=obter("SELECT rota_id FROM alunos WHERE id=?",alunoId);
        if(db.queryForObject("SELECT count(*) FROM participantes p JOIN viagens v ON v.id=p.viagem_id WHERE p.aluno_id=? AND v.status='EM_ANDAMENTO'",Integer.class,alunoId)>0)erro("Aguarde o encerramento da viagem para alterar os vínculos.");
        Set<Long> rids=new HashSet<>(),pids=new HashSet<>();
        for(var r:d.responsaveis()){if(!rids.add(r.responsavelId()))erro("Responsável repetido.");obter("SELECT id FROM responsaveis WHERE id=?",r.responsavelId());}
        for(var p:d.pontos()){
            if(!pids.add(p.paradaId()))erro("Ponto repetido.");var parada=obter("SELECT rota_id,tipo FROM paradas WHERE id=?",p.paradaId());
            if(!parada.get("rota_id").equals(a.get("rota_id"))||parada.get("tipo").equals("DESEMBARQUE"))erro("Selecione pontos de embarque da rota do aluno.");
        }
        for(String trajeto:List.of("IDA","VOLTA")){
            Long id=trajeto.equals("IDA")?d.paradaIdaId():d.paradaVoltaId();
            if(id!=null){var p=obter("SELECT trajeto FROM paradas WHERE id=?",id);
                if(!p.get("trajeto").equals(trajeto)||d.pontos().stream().noneMatch(x->x.paradaId().equals(id)&&x.ativo()))erro("O embarque padrão precisa ser um ponto autorizado e ativo do trajeto.");}
        }
        db.update("DELETE FROM responsaveis_alunos WHERE aluno_id=?",alunoId);
        for(var r:d.responsaveis())db.update("INSERT INTO responsaveis_alunos(responsavel_id,aluno_id,parentesco) VALUES(?,?,?)",r.responsavelId(),alunoId,r.parentesco().strip());
        db.update("UPDATE alunos_pontos SET ativo=false WHERE aluno_id=?",alunoId);
        for(var p:d.pontos())db.update("INSERT INTO alunos_pontos(aluno_id,parada_id,ativo) VALUES(?,?,?) ON CONFLICT(aluno_id,parada_id) DO UPDATE SET ativo=excluded.ativo",alunoId,p.paradaId(),p.ativo());
        db.update("UPDATE alunos SET responsavel_usuario_id=NULL,parada_ida_id=?,parada_volta_id=? WHERE id=?",d.paradaIdaId(),d.paradaVoltaId(),alunoId);
        db.update("UPDATE agendamentos g SET status='CANCELADO',atualizado_em=now() WHERE g.aluno_id=? AND g.status='CONFIRMADO' AND g.data_servico>=(now() AT TIME ZONE 'America/Sao_Paulo')::date AND NOT EXISTS(SELECT 1 FROM alunos_pontos ap WHERE ap.aluno_id=g.aluno_id AND ap.parada_id=g.parada_id AND ap.ativo)",alunoId);
        db.update("INSERT INTO eventos(usuario_id,entidade,registro_id,acao,detalhe,em) VALUES(?,'ALUNO',?,'VINCULOS',?,now())",autor,alunoId,rids.size()+" responsáveis; "+pids.size()+" pontos autorizados.");
    }
    public Associacoes associacoes(Long id){obter("SELECT id FROM rotas WHERE id=?",id);return new Associacoes(db.queryForList("SELECT veiculo_id FROM rotas_veiculos WHERE rota_id=?",Long.class,id),db.queryForList("SELECT motorista_id FROM rotas_motoristas WHERE rota_id=?",Long.class,id));}
    @Transactional public void salvarAssociacoes(Long id,Associacoes d){
        lock.bloquear();obter("SELECT id FROM rotas WHERE id=?",id);
        for(Long v:new HashSet<>(d.veiculoIds()))obter("SELECT id FROM veiculos WHERE id=?",v);
        for(Long m:new HashSet<>(d.motoristaIds()))obter("SELECT id FROM motoristas WHERE id=?",m);
        db.update("DELETE FROM rotas_veiculos WHERE rota_id=?",id);db.update("DELETE FROM rotas_motoristas WHERE rota_id=?",id);
        for(Long v:new HashSet<>(d.veiculoIds()))db.update("INSERT INTO rotas_veiculos VALUES(?,?)",id,v);
        for(Long m:new HashSet<>(d.motoristaIds()))db.update("INSERT INTO rotas_motoristas VALUES(?,?)",id,m);
    }
}
