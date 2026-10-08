package br.com.mobilys.cadastro;

import jakarta.validation.constraints.*;

public record AlunoRequest(
    @NotBlank @Size(max = 150) String nome,
    @NotBlank @Size(max = 40) String matricula,
    @NotBlank @Size(max = 60) String turma,
    @NotBlank @Size(max = 150) String responsavel,
    @NotNull @Positive Long rotaId, @Size(max=150) String curso, @Size(max=60) String periodo, @Size(max=30) String telefone, @Positive Long usuarioId
) { public AlunoRequest(String nome,String matricula,String turma,String responsavel,Long rotaId) { this(nome,matricula,turma,responsavel,rotaId,null,null,null,null); } }
