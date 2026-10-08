package br.com.mobilys.operacao;

import br.com.mobilys.usuario.UsuarioPrincipal;
import java.time.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static br.com.mobilys.operacao.OperacaoRequests.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties="spring.datasource.url=${DB_TEST_URL}")
class OperacaoIntegrationTest {
    @Autowired OperacaoService operacao;
    @Autowired JdbcTemplate db;
    @MockitoBean Clock clock;

    @Test
    void preservaDestinoDesconhecidoEParadaMistaNaVoltaAntiga() {
        when(clock.instant()).thenReturn(Instant.parse("2026-10-08T22:00:00Z"));
        long usuario=db.queryForObject("INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES('Legado','legado@teste.local','hash','MOTORISTA') RETURNING id",Long.class);
        long rota=db.queryForObject("INSERT INTO rotas(nome,turno,origem,destino) VALUES('Volta legada','Noite','Origem','Destino') RETURNING id",Long.class);
        long aluno=db.queryForObject("INSERT INTO alunos(nome,matricula,turma,responsavel,rota_id) VALUES('Aluno legado','LEGADO','Noite','Responsável',?) RETURNING id",Long.class,rota);
        long id=db.queryForObject("INSERT INTO viagens(rota_id,motorista_usuario_id,rota_nome,motorista_nome,placa,data_servico,trajeto,iniciada_em,no_ponto) VALUES(?,?,'Volta legada','Legado','LEG0001','2026-10-08','VOLTA',now(),true) RETURNING id",Long.class,rota,usuario);
        for(int ordem=1;ordem<=4;ordem++)
            db.update("INSERT INTO viagem_paradas(viagem_id,parada_original_id,ordem,local,referencia,horario,tipo) VALUES(?,?,?,?,'','22:00',?)",id,ordem,ordem,"Ponto "+ordem,ordem==1?"EMBARQUE":ordem==4?"AMBOS":"DESEMBARQUE");
        db.update("INSERT INTO participantes(viagem_id,aluno_id,aluno_nome,embarque_ordem,status) VALUES(?,?,'Aluno legado',1,'PRESENTE')",id,aluno);
        var u=new UsuarioPrincipal(usuario,"Legado","legado@teste.local","hash","MOTORISTA",0);
        var v=operacao.agir(u,id,new Acao(0L,"AVANCAR",null,null));
        assertThat(v.get("ponto_atual")).isEqualTo(2);
        assertThat(db.queryForObject("SELECT count(*) FROM viagem_paradas WHERE viagem_id=? AND omitida_em IS NOT NULL",Integer.class,id)).isZero();
        operacao.agir(u,id,new Acao(1L,"CHEGAR",null,null));
        operacao.agir(u,id,new Acao(2L,"DESEMBARCAR",aluno,null));
        v=operacao.agir(u,id,new Acao(3L,"AVANCAR",null,null));
        assertThat(v.get("ponto_atual")).isEqualTo(4); // Ponto 3 omitido; AMBOS preservado.
        assertThat(db.queryForObject("SELECT count(*) FROM eventos WHERE viagem_id=? AND acao='OMITIR_PARADA'",Integer.class,id)).isEqualTo(1);
        operacao.agir(u,id,new Acao(4L,"CHEGAR",null,null));
        operacao.agir(u,id,new Acao(5L,"AVANCAR",null,null));
        assertThat(operacao.agir(u,id,new Acao(6L,"ENCERRAR",null,null)).get("status")).isEqualTo("ENCERRADA");
    }

    @Test
    void concluiDepoisDaMeiaNoitePreservandoDataDeServico() {
        var instante=new AtomicReference<>(Instant.parse("2026-10-07T02:59:00Z"));
        when(clock.instant()).thenAnswer(a->instante.get());
        when(clock.withZone(any(ZoneId.class))).thenAnswer(a->Clock.fixed(instante.get(),a.getArgument(0)));
        long usuario=db.queryForObject("INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES('Teste madrugada','madrugada@teste.local','hash','MOTORISTA') RETURNING id",Long.class);
        long motorista=db.queryForObject("INSERT INTO motoristas(nome,cnh,telefone,usuario_id) VALUES('Madrugada','00000000001','19999999999',?) RETURNING id",Long.class,usuario);
        long veiculo=db.queryForObject("INSERT INTO veiculos(placa,modelo,capacidade,motorista_id) VALUES('MAD0001','Teste',1,?) RETURNING id",Long.class,motorista);
        long rota=db.queryForObject("INSERT INTO rotas(nome,turno,origem,destino,veiculo_id) VALUES('Teste madrugada','Noite','Origem','Destino',?) RETURNING id",Long.class,veiculo);
        db.update("INSERT INTO paradas(rota_id,trajeto,ordem,local,horario,tipo) VALUES(?,'IDA',1,'Ponto','23:59','EMBARQUE')",rota);
        var u=new UsuarioPrincipal(usuario,"Madrugada","madrugada@teste.local","hash","MOTORISTA",0);
        assertThat(operacao.hoje()).isEqualTo(LocalDate.of(2026,10,6));
        var viagem=operacao.iniciar(u,new Iniciar(rota,"IDA"));
        long id=((Number)viagem.get("id")).longValue();
        instante.set(Instant.parse("2026-10-07T03:01:00Z"));
        assertThat(operacao.hoje()).isEqualTo(LocalDate.of(2026,10,7));
        assertThat(operacao.viagens(u,operacao.hoje())).anySatisfy(v->assertThat(v.get("id")).isEqualTo(id));
        operacao.agir(u,id,new Acao(0L,"CHEGAR",null,null));
        operacao.agir(u,id,new Acao(1L,"AVANCAR",null,null));
        var encerrada=operacao.agir(u,id,new Acao(2L,"ENCERRAR",null,null));
        assertThat(encerrada.get("status")).isEqualTo("ENCERRADA");
        assertThat(encerrada.get("data_servico")).isEqualTo("2026-10-06");
        assertThat(encerrada.get("encerrada_em")).isEqualTo("2026-10-07T03:01:00Z");
        assertThat(db.queryForObject("SELECT count(*) FROM eventos WHERE viagem_id=?",Integer.class,id)).isEqualTo(4);
    }
}
