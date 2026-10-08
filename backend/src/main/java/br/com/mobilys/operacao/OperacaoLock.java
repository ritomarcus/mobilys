package br.com.mobilys.operacao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Serializa as gravações operacionais e cadastrais durante a transação.
 * Evita início/confirmacão concorrentes e snapshots parciais em instalações pequenas.
 * Em maior escala, substituir por bloqueios por rota mantendo a mesma ordem. */
@Component
public class OperacaoLock {
    private final JdbcTemplate db;
    public OperacaoLock(JdbcTemplate db) { this.db = db; }
    public void bloquear() { db.execute("SELECT pg_advisory_xact_lock(7642031)"); }
}
