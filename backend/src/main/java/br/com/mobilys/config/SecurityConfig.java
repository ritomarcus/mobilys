package br.com.mobilys.config;

import br.com.mobilys.usuario.UsuarioPrincipal;
import br.com.mobilys.usuario.UsuarioService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean SecurityFilterChain security(HttpSecurity http, UsuarioService usuarios) throws Exception {
        http.cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/*.html", "/js/**", "/css/**", "/assets/**", "/favicon.ico").permitAll()
                .requestMatchers("/api/auth/csrf", "/api/auth/login", "/error").permitAll()
                .requestMatchers("/api/auth/me", "/api/auth/senha").authenticated()
                .requestMatchers("/api/operacao/**").authenticated()
                .requestMatchers("/api/alunos/**", "/api/rotas/**", "/api/usuarios/**", "/api/motoristas/**", "/api/veiculos/**", "/api/responsaveis/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .formLogin(login -> login.loginProcessingUrl("/api/auth/login").usernameParameter("email")
                .successHandler((req, res, auth) -> res.setStatus(204))
                .failureHandler((req, res, error) -> res.setStatus(401)))
            .logout(logout -> logout.logoutUrl("/api/auth/logout")
                .deleteCookies("JSESSIONID").logoutSuccessHandler((req, res, auth) -> res.setStatus(204)))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req, res, error) -> res.setStatus(401))
                .accessDeniedHandler((req, res, error) -> res.setStatus(403)))
            .requestCache(cache -> cache.disable());
        // Revoga a sessão na próxima requisição após editar ou excluir uma conta.
        http.addFilterBefore(new OncePerRequestFilter() {
            @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                    FilterChain chain) throws ServletException, IOException {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal principal) {
                    boolean valido;
                    try { var atual = usuarios.porId(principal.id()); valido = atual.ativo() && atual.versao() == principal.versao(); }
                    catch (ResponseStatusException e) { valido = false; }
                    if (!valido) {
                        SecurityContextHolder.clearContext();
                        if (request.getSession(false) != null) request.getSession(false).invalidate();
                        if (request.getRequestURI().startsWith("/api/")) { response.setStatus(401); return; }
                    }
                }
                chain.doFilter(request, response);
            }
        }, AuthorizationFilter.class);
        return http.build();
    }
}
