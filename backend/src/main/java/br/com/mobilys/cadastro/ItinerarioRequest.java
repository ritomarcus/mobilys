package br.com.mobilys.cadastro;

import java.time.LocalTime;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ItinerarioRequest(@NotNull @PositiveOrZero Long versao,
        @NotNull @Size(max=200) List<@NotNull @Valid Parada> paradas) {
    public record Parada(@Positive Long id,
        @NotBlank @Pattern(regexp="IDA|VOLTA") String trajeto,
        @NotNull @Min(1) @Max(200) Integer ordem,
        @NotBlank @Size(max=150) String local,
        @Size(max=250) String referencia,
        @NotNull LocalTime horario,
        @NotBlank @Pattern(regexp="EMBARQUE|DESEMBARQUE|AMBOS") String tipo,
        @Size(max=250) String endereco,
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude) {
        @AssertTrue(message="Informe latitude e longitude juntas.") public boolean isCoordenadasCompletas(){return (latitude==null)==(longitude==null);}
    }
}
