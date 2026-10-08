package br.com.mobilys.cadastro;

public record AlunoResponse(Long id, String nome, String matricula, String turma, String responsavel, Long rotaId, String curso, String periodo, String telefone, Long usuarioId) {
    static AlunoResponse de(Aluno registro) {
        return new AlunoResponse(registro.getId(), registro.getNome(), registro.getMatricula(), registro.getTurma(), registro.getResponsavel(), registro.getRota().getId(),registro.getCurso(),registro.getPeriodo(),registro.getTelefone(),registro.getUsuarioId());
    }
}
