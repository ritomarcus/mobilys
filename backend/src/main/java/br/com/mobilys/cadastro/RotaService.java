package br.com.mobilys.cadastro;
import br.com.mobilys.operacao.OperacaoLock;


import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class RotaService {
    private final OperacaoLock operacaoLock;
    private final RotaRepository repository;

    public RotaService(RotaRepository repository, OperacaoLock operacaoLock) {
        this.operacaoLock = operacaoLock;
        this.repository = repository;
    }
    public List<RotaResponse> listar() {
        return repository.findAll(Sort.by("id")).stream().map(RotaResponse::de).toList();
    }
    public RotaResponse buscar(Long id) { return RotaResponse.de(obter(id)); }
    private Rota obter(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Rota não encontrado."));
    }
    @Transactional
    public RotaResponse criar(RotaRequest dados) {
        operacaoLock.bloquear();
        return salvar(new Rota(), dados);
    }
    @Transactional
    public RotaResponse atualizar(Long id, RotaRequest dados) {
        operacaoLock.bloquear();
        return salvar(obter(id), dados);
    }
    private RotaResponse salvar(Rota registro, RotaRequest dados) {
        registro.atualizar(dados);
        return RotaResponse.de(repository.saveAndFlush(registro));
    }
    @Transactional
    public void excluir(Long id) {
        operacaoLock.bloquear();
        repository.delete(obter(id));
        repository.flush();
    }
}
