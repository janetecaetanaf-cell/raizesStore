import { Alert, Button, Form } from 'react-bootstrap';
import { FiCopy, FiMessageCircle } from 'react-icons/fi';
import { Icon } from './Icon';
import { LOJA, PAGAMENTO, whatsappLink } from '../config/loja';
import { formatarMoeda } from '../utils/pagseguro';

interface PagamentoPixManualProps {
  total: number;
  pedidoConfirmado?: boolean;
  mensagemWhatsApp?: string;
  onCopiarChave: () => void;
}

const PagamentoPixManual = ({
  total,
  pedidoConfirmado = false,
  mensagemWhatsApp,
  onCopiarChave,
}: PagamentoPixManualProps) => {
  const { pix } = PAGAMENTO;
  const urlWhatsApp = mensagemWhatsApp ? whatsappLink(mensagemWhatsApp) : whatsappLink(
    `Olá! Gostaria de finalizar um pedido na ${LOJA.nome}.`
  );

  return (
    <div className="pagamento-pix-manual">
      <h5 className="mb-3">Pagamento via Pix</h5>

      <Alert variant="info" className="small">
        <strong>Como funciona:</strong>
        <ol className="mb-0 ps-3 mt-2">
          <li>Transfira o valor exato abaixo para a chave Pix.</li>
          <li>Envie o <strong>comprovante</strong> pelo WhatsApp.</li>
          <li>Aguarde nossa confirmação — produzimos e enviamos após validar o pagamento.</li>
        </ol>
      </Alert>

      <div className="border rounded p-3 bg-light mb-3">
        <p className="text-muted small mb-1">Valor a pagar</p>
        <p className="fs-4 fw-bold text-primary mb-3">{formatarMoeda(total)}</p>

        <p className="text-muted small mb-1">Chave Pix ({pix.tipo})</p>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <Form.Control
            readOnly
            value={pix.chaveExibicao}
            className="font-monospace fw-semibold"
            style={{ maxWidth: 280 }}
          />
          <Button type="button" variant="outline-primary" size="sm" onClick={onCopiarChave}>
            <Icon icon={FiCopy} className="me-1" />
            Copiar chave
          </Button>
        </div>
        <p className="text-muted small mb-0">
          Titular: <strong>{pix.titular}</strong>
        </p>
      </div>

      {pedidoConfirmado ? (
        <Alert variant="warning" className="small mb-3">
          <strong>Pedido registrado!</strong> Faça o Pix no valor de{' '}
          <strong>{formatarMoeda(total)}</strong> e envie o comprovante pelo WhatsApp para
          confirmarmos seu pedido. Sem o comprovante, não iniciamos a produção.
        </Alert>
      ) : (
        <Alert variant="secondary" className="small mb-3">
          Após preencher seus dados, clique em <strong>Confirmar pedido</strong> e envie o
          comprovante pelo WhatsApp.
        </Alert>
      )}

      <Button
        as="a"
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        variant="success"
        className="w-100 d-flex align-items-center justify-content-center gap-2"
        size={pedidoConfirmado ? 'lg' : undefined}
      >
        <Icon icon={FiMessageCircle} />
        {pedidoConfirmado ? 'Enviar comprovante pelo WhatsApp' : 'Falar no WhatsApp'}
      </Button>

      <p className="text-muted small text-center mt-2 mb-0">
        WhatsApp {LOJA.whatsappDisplay}
      </p>
    </div>
  );
};

export default PagamentoPixManual;
