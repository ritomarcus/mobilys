package br.com.mobilys.usuario;

public record UsuarioResponse(Long id, String nome, String email, String perfil, boolean ativo) {}
