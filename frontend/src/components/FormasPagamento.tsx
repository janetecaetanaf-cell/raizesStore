import { Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { formatarMoeda } from '../utils/pagseguro';
export type MetodoPagamento = 'pix' | 'cartao';

export interface DadosCartao {
  numero: string;
  nome: string;
  cvv: string;
  mes: string;
  ano: string;
}

interface FormasPagamentoProps {
  metodo: MetodoPagamento;
  onMetodoChange: (metodo: MetodoPagamento) => void;
  cartao: DadosCartao;
  onCartaoChange: (cartao: DadosCartao) => void;
  total: number;
  pagSeguroPronto: boolean;
  preparandoPagamento: boolean;
  qrCodeImagem?: string | null;
  codigoPix?: string | null;
  sandbox?: boolean;
  onCopiarPix?: () => void;
  erroPagamento?: string | null;
}

const FormasPagamento = ({
  metodo,
  onMetodoChange,
  cartao,
  onCartaoChange,
  total,
  pagSeguroPronto,
  preparandoPagamento,
  qrCodeImagem,
  codigoPix,
  sandbox = false,
  onCopiarPix,
  erroPagamento,
}: FormasPagamentoProps) => {
  const pixGerado = Boolean(qrCodeImagem || codigoPix);

  const codigoPixValido = Boolean(codigoPix?.trimStart().startsWith('000201'));

  return (
    <div>
      <h5 className="mb-3">Forma de pagamento</h5>

      {preparandoPagamento && (
        <Alert variant="light" className="small border">
          Conectando ao PagSeguro...
        </Alert>
      )}

      {!preparandoPagamento && !pagSeguroPronto && (
        <Alert variant="warning" className="small">
          Pagamento online indisponível no momento. Verifique a configuração do PagSeguro.
        </Alert>
      )}

      {erroPagamento && <Alert variant="danger" className="small">{erroPagamento}</Alert>}

      {!pixGerado && (
        <div className="d-flex gap-2 mb-3">
          <Button
            type="button"
            variant={metodo === 'pix' ? 'primary' : 'outline-primary'}
            className="flex-fill"
            onClick={() => onMetodoChange('pix')}
            disabled={!pagSeguroPronto}
          >
            Pix
          </Button>
          <Button
            type="button"
            variant={metodo === 'cartao' ? 'primary' : 'outline-primary'}
            className="flex-fill"
            onClick={() => onMetodoChange('cartao')}
            disabled={!pagSeguroPronto}
          >
            Cartão de crédito
          </Button>
        </div>
      )}

      {metodo === 'pix' && !pixGerado && (
        <Alert variant="info" className="small mb-0">
          Ao finalizar, o QR Code Pix aparecerá aqui na mesma página. Pagamento na hora.
        </Alert>
      )}

      {metodo === 'pix' && pixGerado && (
        <div className="text-center border rounded p-3 bg-light">
          {sandbox && (
            <Alert variant="warning" className="small text-start">
              Ambiente de <strong>teste (sandbox)</strong>: o QR Code Pix{' '}
              <strong>não funciona</strong> em apps de banco reais (Nubank, Caixa, etc.).
              Use o simulador do PagBank ou copie o código no app PagBank sandbox.
            </Alert>
          )}
          <p className="text-muted small mb-3">Escaneie o QR Code ou copie o código Pix abaixo.</p>
          {qrCodeImagem && (
            <img
              src={
                qrCodeImagem.startsWith('data:') || qrCodeImagem.startsWith('http')
                  ? qrCodeImagem
                  : `data:image/png;base64,${qrCodeImagem}`
              }
              alt="QR Code Pix"
              style={{ maxWidth: 220 }}
              className="mb-3"
            />
          )}
          {codigoPixValido && (
            <>
              <Form.Control as="textarea" rows={3} readOnly value={codigoPix ?? ''} className="font-monospace small mb-2" />
              {onCopiarPix && (
                <Button type="button" variant="outline-primary" size="sm" onClick={onCopiarPix}>
                  Copiar código Pix
                </Button>
              )}
            </>
          )}
          <Alert variant="success" className="small mt-3 mb-0">
            Assim que o banco confirmar, você será redirecionada automaticamente.
          </Alert>
        </div>
      )}

      {metodo === 'cartao' && !pixGerado && (
        <Row className="g-3">
          <Col xs={12}>
            <Form.Label>Nome no cartão</Form.Label>
            <Form.Control
              required
              value={cartao.nome}
              onChange={(e) => onCartaoChange({ ...cartao, nome: e.target.value })}
            />
          </Col>
          <Col xs={12}>
            <Form.Label>Número do cartão</Form.Label>
            <Form.Control
              required
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={cartao.numero}
              onChange={(e) => onCartaoChange({ ...cartao, numero: e.target.value })}
            />
          </Col>
          <Col md={4}>
            <Form.Label>Mês</Form.Label>
            <Form.Control
              required
              placeholder="MM"
              maxLength={2}
              value={cartao.mes}
              onChange={(e) => onCartaoChange({ ...cartao, mes: e.target.value })}
            />
          </Col>
          <Col md={4}>
            <Form.Label>Ano</Form.Label>
            <Form.Control
              required
              placeholder="AAAA"
              maxLength={4}
              value={cartao.ano}
              onChange={(e) => onCartaoChange({ ...cartao, ano: e.target.value })}
            />
          </Col>
          <Col md={4}>
            <Form.Label>CVV</Form.Label>
            <Form.Control
              required
              maxLength={4}
              value={cartao.cvv}
              onChange={(e) => onCartaoChange({ ...cartao, cvv: e.target.value })}
            />
          </Col>
          <Col xs={12}>
            <small className="text-muted">
              Total no cartão: <strong>{formatarMoeda(total)}</strong> em 1x
            </small>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default FormasPagamento;
