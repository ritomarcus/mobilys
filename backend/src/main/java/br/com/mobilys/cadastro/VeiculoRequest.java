package br.com.mobilys.cadastro;
import jakarta.validation.constraints.*;
public record VeiculoRequest(
    @NotBlank @Pattern(regexp="(?i)[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}") String placa,
    @NotBlank @Size(max=100) String modelo,
    @NotNull @Min(1) @Max(200) Integer capacidade,
    @Positive Long motoristaId, @Min(1900) @Max(2100) Integer anoFabricacao, Boolean ativo
) {}
