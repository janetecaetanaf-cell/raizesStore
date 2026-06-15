import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FiMessageCircle, FiMail, FiClock } from 'react-icons/fi';
import { Icon } from '../components/Icon';
import { LOJA, whatsappLink } from '../config/loja';

const Atendimento = () => {
  const whatsappUrl = whatsappLink('Olá! Preciso de ajuda com um pedido ou personalização.');

  return (
    <div className="static-page">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <h1 className="static-page-title text-center">Atendimento</h1>
            <p className="text-center text-muted mb-5">
              Estamos aqui para ajudar com dúvidas, personalizações e pedidos especiais.
            </p>

            <Row className="g-4">
              <Col md={4}>
                <Card className="atendimento-card h-100 text-center">
                  <Card.Body>
                    <div className="atendimento-icon">
                      <Icon icon={FiMessageCircle} size={32} />
                    </div>
                    <Card.Title>WhatsApp</Card.Title>
                    <Card.Text>Resposta rápida para dúvidas e personalizações</Card.Text>
                    <Button
                      variant="primary"
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-100"
                    >
                      Chamar no WhatsApp
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="atendimento-card h-100 text-center">
                  <Card.Body>
                    <div className="atendimento-icon">
                      <Icon icon={FiMail} size={32} />
                    </div>
                    <Card.Title>E-mail</Card.Title>
                    <Card.Text>Para pedidos corporativos ou encomendas especiais</Card.Text>
                    <Button
                      variant="outline-primary"
                      href={`mailto:${LOJA.email}`}
                      className="w-100"
                    >
                      Enviar e-mail
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="atendimento-card h-100 text-center">
                  <Card.Body>
                    <div className="atendimento-icon">
                      <Icon icon={FiClock} size={32} />
                    </div>
                    <Card.Title>Horário</Card.Title>
                    <Card.Text>
                      Seg a Sex: 9h às 18h<br />
                      Sáb: 9h às 13h
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="atendimento-faq mt-5">
              <h3>Perguntas frequentes</h3>
              <div className="faq-item">
                <h6>Como funciona a personalização?</h6>
                <p>
                  Envie sua ideia pelo WhatsApp — nome, frase, logo ou foto. Nossa equipe
                  cria a estampa sem custo adicional e envia para aprovação antes da produção.
                </p>
              </div>
              <div className="faq-item">
                <h6>Qual o prazo de entrega?</h6>
                <p>
                  Produtos prontos: 3 a 7 dias úteis. Personalizados: 7 a 15 dias úteis
                  após aprovação da arte. Enviamos para todo o Brasil.
                </p>
              </div>
              <div className="faq-item">
                <h6>Quais formas de pagamento?</h6>
                <p>
                  Aceitamos Pix (com 5% de desconto), cartão de crédito em até 3x sem juros
                  e débito.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Atendimento;
