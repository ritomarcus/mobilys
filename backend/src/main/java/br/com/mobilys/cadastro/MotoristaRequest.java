package br.com.mobilys.cadastro;
import jakarta.validation.constraints.*;
public record MotoristaRequest(
    @NotBlank @Size(max=150) String nome,
    @NotBlank @Pattern(regexp="[0-9]{11}") String cnh,
    @NotBlank @Size(max=30) String telefone,
    @NotNull @Positive Long usuarioId, @org.hibernate.validator.constraints.br.CPF String cpf, java.time.LocalDate validadeCnh
) {}
