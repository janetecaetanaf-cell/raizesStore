import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LOJA, whatsappLink } from '../config/loja';

const Footer = () => {
  return (
    <footer className="store-footer">
      <Container className="footer-main">
        <Row className="g-4">
          <Col md={4}>
            <div className="footer-brand">
              <span className="brand-icon">☽</span>
              <span>{LOJA.nome}</span>
            </div>
            <p className="footer-tagline">
              Artigos religiosos e presentes espirituais feitos com respeito e carinho.
            </p>
          </Col>
          <Col md={4}>
            <h6 className="footer-heading">Navegação</h6>
            <ul className="footer-links">
              <li><Link to="/">Início</Link></li>
              <li><Link to="/#destaques">Destaques</Link></li>
              <li><Link to="/nossa-historia">Nossa História</Link></li>
              <li><Link to="/atendimento">Atendimento</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h6 className="footer-heading">Contato</h6>
            <ul className="footer-links">
              <li>
                <a href={whatsappLink('Olá! Vim pelo site e gostaria de mais informações.')} target="_blank" rel="noopener noreferrer">
                  WhatsApp {LOJA.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={LOJA.instagramUrl} target="_blank" rel="noopener noreferrer">
                  Instagram @{LOJA.instagram}
                </a>
              </li>
              <li>
                <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>

      <div className="footer-payments">
        <Container>
          <p className="mb-2">Formas de pagamento</p>
          <div className="payment-icons">
            <span>Pix</span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Elo</span>
            <span>Amex</span>
          </div>
        </Container>
      </div>

      <div className="footer-bottom">
        <Container>
          <p className="mb-0">
            &copy; {new Date().getFullYear()} {LOJA.nome}. Todos os direitos reservados.
          </p>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
