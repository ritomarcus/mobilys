package br.com.mobilys.usuario;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record UsuarioPrincipal(Long id, String nome, String email, String senhaHash,
                               String perfil, long versao, boolean ativo) implements UserDetails {
    public UsuarioPrincipal(Long id,String nome,String email,String senhaHash,String perfil,long versao) { this(id,nome,email,senhaHash,perfil,versao,true); }
    @Override public boolean isEnabled() { return ativo; }
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return senhaHash; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + perfil));
    }
    public UsuarioResponse resposta() { return new UsuarioResponse(id, nome, email, perfil, ativo); }
}
