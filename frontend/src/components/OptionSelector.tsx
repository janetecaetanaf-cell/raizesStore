interface OptionSelectorProps<T extends string | number> {
  label: string;
  opcoes: { value: T; label: string; swatch?: string }[];
  valorSelecionado: T | '';
  onChange: (value: T) => void;
  aviso?: string;
}

const OptionSelector = <T extends string | number>({
  label,
  opcoes,
  valorSelecionado,
  onChange,
  aviso,
}: OptionSelectorProps<T>) => {
  if (opcoes.length === 0) {
    return (
      <div className="option-selector mb-3">
        <p className="fw-bold mb-1">{label}</p>
        <p className="text-muted small mb-0">
          {aviso ?? 'Nenhuma opção disponível no momento.'}
        </p>
      </div>
    );
  }

  return (
    <div className="option-selector mb-3">
      <p className="fw-bold mb-2">{label}</p>
      <div className="option-selector-grid">
        {opcoes.map((opcao) => {
          const ativo = valorSelecionado === opcao.value;
          return (
            <button
              key={String(opcao.value)}
              type="button"
              className={`option-selector-btn ${ativo ? 'active' : ''} ${opcao.swatch ? 'has-swatch' : ''}`}
              onClick={() => onChange(opcao.value)}
              aria-pressed={ativo}
            >
              {opcao.swatch && (
                <span
                  className="option-swatch"
                  style={{ backgroundColor: opcao.swatch }}
                  aria-hidden
                />
              )}
              <span>{opcao.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OptionSelector;
