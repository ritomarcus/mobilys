package br.com.mobilys.cadastro;

import jakarta.persistence.*;

@Entity
@Table(name = "rotas")
public class Rota {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(nullable = false, length = 30)
    private String turno;
    @Column(nullable = false, length = 150)
    private String origem;
    @Column(nullable = false, length = 150)
    private String destino;
    @Column(name = "veiculo_id")
    private Long veiculoId;

    @Column(length=500,nullable=false) private String descricao="";
    @Column(nullable=false) private boolean ativo=true;
    public String getDescricao(){return descricao;} public boolean isAtivo(){return ativo;}
    protected Rota() {}
    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getTurno() { return turno; }
    public String getOrigem() { return origem; }
    public String getDestino() { return destino; }
    public Long getVeiculoId() { return veiculoId; }

    void atualizar(RotaRequest dados) {
        this.nome = dados.nome().strip();
        this.turno = dados.turno().strip();
        this.origem = dados.origem().strip();
        this.destino = dados.destino().strip();
        this.veiculoId = dados.veiculoId();
        this.descricao=dados.descricao()==null?descricao:dados.descricao().strip();
        if(dados.ativo()!=null)this.ativo=dados.ativo();
    }
}
