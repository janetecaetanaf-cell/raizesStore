import { Form } from 'react-bootstrap';

interface Opcao {
  value: number;
  label: string;
  swatch?: string;
}

interface EnumMultiSelectProps {
  label: string;
  opcoes: Opcao[];
  selecionados: number[];
  onToggle: (value: number) => void;
  hint?: string;
}

const EnumMultiSelect = ({
  label,
  opcoes,
  selecionados,
  onToggle,
  hint,
}: EnumMultiSelectProps) => (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    {hint && (
      <Form.Text className="text-muted d-block mb-2">
        {hint}
      </Form.Text>
    )}
    <div className="option-selector-grid">
      {opcoes.map((opcao) => {
        const ativo = selecionados.includes(opcao.value);
        return (
          <button
            key={opcao.value}
            type="button"
            className={`option-selector-btn ${ativo ? 'active' : ''} ${opcao.swatch ? 'has-swatch' : ''}`}
            onClick={() => onToggle(opcao.value)}
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
  </Form.Group>
);

export default EnumMultiSelect;
