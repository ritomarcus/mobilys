package br.com.mobilys.operacao;
import java.time.LocalDate;
import jakarta.validation.constraints.*;
public class OperacaoRequests {
    public record Vinculo(@Positive Long responsavelUsuarioId, @Positive Long paradaIdaId, @Positive Long paradaVoltaId) {}
    public record Agenda(@NotNull @Positive Long alunoId, @NotNull LocalDate data,
        @NotBlank @Pattern(regexp="IDA|VOLTA") String trajeto,
        @NotBlank @Pattern(regexp="CONFIRMADO|CANCELADO") String status, @Positive Long paradaId,
        @Positive Long destinoId) {
        public Agenda(Long alunoId,LocalDate data,String trajeto,String status,Long paradaId) {
            this(alunoId,data,trajeto,status,paradaId,null);
        }
    }
    public record Iniciar(@NotNull @Positive Long rotaId,
        @NotBlank @Pattern(regexp="IDA|VOLTA") String trajeto, @Positive Long veiculoId) { public Iniciar(Long rotaId,String trajeto){this(rotaId,trajeto,null);} }
    public record Acao(@NotNull @PositiveOrZero Long versao,
        @NotBlank @Pattern(regexp="CHEGAR|AVANCAR|ENCERRAR|PRESENCA|DESEMBARCAR") String acao,
        @Positive Long alunoId, @Pattern(regexp="PRESENTE|AUSENTE") String status) {}
    public record Posicao(@NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @NotNull @DecimalMin("0") @DecimalMax("10000") Double precisao,
        @NotNull java.time.Instant capturadaEm) {}
}
