import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer mt-auto">
      <div className="footer-video-section">
        <video 
          className="footer-video-bg" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/videos/por-do-sol-mata.mp4" type="video/mp4" />
        </video>
        <div className="footer-overlay"></div>
        <Container className="footer-content">
          <Row>
            <Col md={6}>
              <h5 className="footer-text">Raizes Store</h5>
              <p className="mb-0 footer-text">Sua loja de impressões criativas</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0 footer-text">
                <small>&copy; {new Date().getFullYear()} Raizes Store. Todos os direitos reservados.</small>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
