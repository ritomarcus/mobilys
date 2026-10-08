package br.com.mobilys.cadastro;

import jakarta.persistence.*;

@Entity
@Table(name = "alunos")
public class Aluno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(nullable = false, length = 40)
    private String matricula;
    @Column(nullable = false, length = 60)
    private String turma;
    @Column(nullable = false, length = 150)
    private String responsavel;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rota_id", nullable = false)
    private Rota rota;

    @Column(length=150,nullable=false) private String curso="";
    @Column(length=60,nullable=false) private String periodo="";
    @Column(length=30,nullable=false) private String telefone="";
    @Column(name="usuario_id") private Long usuarioId;
    public String getCurso(){return curso;} public String getPeriodo(){return periodo;} public String getTelefone(){return telefone;} public Long getUsuarioId(){return usuarioId;}
    protected Aluno() {}
    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getMatricula() { return matricula; }
    public String getTurma() { return turma; }
    public String getResponsavel() { return responsavel; }
    public Rota getRota() { return rota; }

    void atualizar(AlunoRequest dados, Rota rota) {
        this.nome = dados.nome().strip();
        this.matricula = dados.matricula().strip();
        this.turma = dados.turma().strip();
        this.responsavel = dados.responsavel().strip();
        this.rota = rota;
        this.curso=dados.curso()==null?curso:dados.curso().strip();
        this.periodo=dados.periodo()==null?periodo:dados.periodo().strip();
        this.telefone=dados.telefone()==null?telefone:dados.telefone().strip();
        this.usuarioId=dados.usuarioId();
    }
}
