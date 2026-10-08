package br.com.mobilys.cadastro;

public record RotaResponse(Long id, String nome, String turno, String origem, String destino, Long veiculoId, String descricao, boolean ativo) {
    static RotaResponse de(Rota registro) {
        return new RotaResponse(registro.getId(), registro.getNome(), registro.getTurno(), registro.getOrigem(), registro.getDestino(), registro.getVeiculoId(),registro.getDescricao(),registro.isAtivo());
    }
}
