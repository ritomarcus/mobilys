package br.com.mobilys.cadastro;

import jakarta.validation.constraints.*;

public record RotaRequest(
    @NotBlank @Size(max = 150) String nome,
    @NotBlank @Size(max = 30) String turno,
    @NotBlank @Size(max = 150) String origem,
    @NotBlank @Size(max = 150) String destino,
    @Positive Long veiculoId, @Size(max=500) String descricao, Boolean ativo
) {
    public RotaRequest(String nome, String turno, String origem, String destino) {
        this(nome, turno, origem, destino, null,null,true);
    }
}
