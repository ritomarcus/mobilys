package br.com.mobilys.usuario;

import jakarta.validation.constraints.*;

public record UsuarioRequest(
    @NotBlank @Size(max = 150) String nome,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Pattern(regexp = "ADMIN|MOTORISTA|RESPONSAVEL") String perfil,
    @Size(max = 64) String senha, Boolean ativo
) { public UsuarioRequest(String nome,String email,String perfil,String senha) { this(nome,email,perfil,senha,true); } }
