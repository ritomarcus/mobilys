package br.com.mobilys.usuario;
import br.com.mobilys.operacao.OperacaoLock;


import java.util.List;
import java.util.Locale;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UsuarioService implements UserDetailsService {
    private final OperacaoLock operacaoLock;
    private final JdbcTemplate db;
    private final PasswordEncoder encoder;
    private final RowMapper<UsuarioPrincipal> mapper = (rs, n) -> new UsuarioPrincipal(
        rs.getLong("id"), rs.getString("nome"), rs.getString("email"), rs.getString("senha_hash"),
        rs.getString("perfil"), rs.getLong("versao"), rs.getBoolean("ativo"));

    public UsuarioService(JdbcTemplate db, PasswordEncoder encoder, OperacaoLock operacaoLock) {
        this.operacaoLock = operacaoLock;
        this.db = db; this.encoder = encoder;
    }
    @Override
    public UsuarioPrincipal loadUserByUsername(String email) {
        return db.query("SELECT * FROM usuarios WHERE lower(email) = ?", mapper, email.strip().toLowerCase(Locale.ROOT))
            .stream().findFirst().orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas."));
    }
    public UsuarioPrincipal porId(Long id) {
        return db.query("SELECT * FROM usuarios WHERE id = ?", mapper, id).stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
    public List<UsuarioResponse> listar() {
        return db.query("SELECT * FROM usuarios ORDER BY id", mapper).stream().map(UsuarioPrincipal::resposta).toList();
    }
    private void validarSenha(String senha) {
        if (senha == null || senha.isBlank() || senha.length() > 64 ||
            senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma senha não vazia de até 64 caracteres (até 72 bytes UTF-8).");
    }
    @Transactional
    public UsuarioResponse criar(UsuarioRequest dados) {
        operacaoLock.bloquear();
        validarSenha(dados.senha());
        Long id = db.queryForObject("INSERT INTO usuarios (nome,email,perfil,senha_hash,ativo) VALUES (?,?,?,?,?) RETURNING id",
            Long.class, dados.nome().strip(), dados.email().strip().toLowerCase(Locale.ROOT), dados.perfil(), encoder.encode(dados.senha()), !Boolean.FALSE.equals(dados.ativo()));
        return porId(id).resposta();
    }
    @Transactional
    public UsuarioResponse atualizar(Long id, UsuarioRequest dados, Long autor) {
        operacaoLock.bloquear();
        // Serializa mudanças administrativas para preservar ao menos um administrador.
        db.queryForList("SELECT id FROM usuarios WHERE perfil = 'ADMIN' ORDER BY id FOR UPDATE");
        db.queryForList("SELECT id FROM usuarios WHERE id=? FOR UPDATE", id);
        UsuarioPrincipal atual = porId(id);
        if ((Boolean.FALSE.equals(dados.ativo()) || !dados.perfil().equals("MOTORISTA")) && db.queryForObject("SELECT count(*) FROM viagens WHERE motorista_usuario_id=? AND status='EM_ANDAMENTO'",Integer.class,id)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Encerre a viagem antes de inativar a conta ou alterar o perfil do motorista.");
        if (!dados.perfil().equals("RESPONSAVEL") && db.queryForObject("SELECT (SELECT count(*) FROM responsaveis WHERE usuario_id=?)+(SELECT count(*) FROM alunos WHERE usuario_id=?)",Integer.class,id,id)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Desvincule os alunos antes de alterar o perfil da conta.");
        if (!dados.perfil().equals("MOTORISTA") && db.queryForObject("SELECT count(*) FROM motoristas WHERE usuario_id=?", Integer.class, id) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Desvincule o motorista antes de alterar o perfil da conta.");
        if (id.equals(autor) && (!atual.perfil().equals(dados.perfil()) || Boolean.FALSE.equals(dados.ativo())))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você não pode alterar seu próprio perfil.");
        if (atual.perfil().equals("ADMIN") && (!dados.perfil().equals("ADMIN") || Boolean.FALSE.equals(dados.ativo())) && quantidadeAdmins() <= 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mantenha ao menos um administrador.");
        String hash = atual.senhaHash();
        if (dados.senha() != null && !dados.senha().isEmpty()) { validarSenha(dados.senha()); hash = encoder.encode(dados.senha()); }
        db.update("UPDATE usuarios SET nome=?, email=?, perfil=?, senha_hash=?, ativo=?, versao=versao+1 WHERE id=?",
            dados.nome().strip(), dados.email().strip().toLowerCase(Locale.ROOT), dados.perfil(), hash, dados.ativo()==null?atual.ativo():dados.ativo(), id);
        return porId(id).resposta();
    }
    @Transactional
    public void excluir(Long id, Long autor) {
        operacaoLock.bloquear();
        db.queryForList("SELECT id FROM usuarios WHERE perfil = 'ADMIN' ORDER BY id FOR UPDATE");
        if (id.equals(autor)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Você não pode excluir sua própria conta.");
        UsuarioPrincipal atual = porId(id);
        if (atual.perfil().equals("ADMIN") && quantidadeAdmins() <= 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mantenha ao menos um administrador.");
        db.update("DELETE FROM usuarios WHERE id=?", id);
    }
    private int quantidadeAdmins() { return db.queryForObject("SELECT count(*) FROM usuarios WHERE perfil='ADMIN' AND ativo", Integer.class); }
    @Transactional
    public void alterarSenha(UsuarioPrincipal principal,String atual,String nova) {
        operacaoLock.bloquear();
        var usuario=porId(principal.id());
        if(!encoder.matches(atual,usuario.senhaHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A senha atual está incorreta.");
        validarSenha(nova);
        if(encoder.matches(nova,usuario.senhaHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Escolha uma senha diferente da atual.");
        db.update("UPDATE usuarios SET senha_hash=?,versao=versao+1 WHERE id=?",encoder.encode(nova),usuario.id());
    }
    @Transactional
    public void bootstrap(String email, String senha) {
        operacaoLock.bloquear();
        db.execute("LOCK TABLE usuarios IN EXCLUSIVE MODE");
        if (db.queryForObject("SELECT count(*) FROM usuarios", Integer.class) == 0)
            criar(new UsuarioRequest("Administrador", email, "ADMIN", senha));
    }
}
