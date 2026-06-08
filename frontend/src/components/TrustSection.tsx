import { Container, Row, Col } from 'react-bootstrap';
import { FiTruck, FiCreditCard, FiShield, FiMessageCircle } from 'react-icons/fi';
import { Icon } from './Icon';

const items = [
  {
    icon: FiTruck,
    title: 'Enviamos para todo o Brasil',
    text: 'Receba seus artigos religiosos com carinho em casa',
  },
  {
    icon: FiCreditCard,
    title: 'Pagamento facilitado',
    text: 'Pix, cartão e parcelamento seguro',
  },
  {
    icon: FiShield,
    title: 'Compra segura',
    text: 'Atendimento respeitoso e humanizado',
  },
  {
    icon: FiMessageCircle,
    title: 'Atendimento pelo WhatsApp',
    text: 'Tire dúvidas e personalize do seu jeito',
  },
];

const TrustSection = () => {
  return (
    <section className="trust-section">
      <Container>
        <Row className="g-4">
          {items.map((item) => (
            <Col key={item.title} xs={6} md={3}>
              <div className="trust-item">
                <div className="trust-icon">
                  <Icon icon={item.icon} size={28} />
                </div>
                <h6>{item.title}</h6>
                <p>{item.text}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TrustSection;
