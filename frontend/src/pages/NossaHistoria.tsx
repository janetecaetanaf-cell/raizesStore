import { Container, Row, Col } from "react-bootstrap";

const NossaHistoria = () => {
  return (
    <div className="static-page">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <h1 className="static-page-title">Nossa História</h1>
            <div className="static-page-content">
              <p>
                A <strong>Raízes Estampas</strong> nasceu do desejo de levar
                estampas e artigos religiosos com qualidade, respeito e carinho
                para simpatizantes das religiões afro-brasileiras.
              </p>
              <p>
                Somos uma loja especializada em produtos de Umbanda: velas,
                guias de contas, imagens de orixás e entidades, incensos e itens
                personalizados como canecas e camisetas.
              </p>
              <p>
                Cada peça é pensada para honrar a tradição. Trabalhamos com
                materiais de qualidade e oferecemos personalização para que você
                expresse sua devoção do seu jeito.
              </p>
              <p>
                Nossa missão é ser ponte entre o sagrado e o cotidiano,
                fortalecendo sua fé, presenteando quem você ama e nos momentos
                em que a tradição pede presença e intenção.
              </p>
              <p className="static-page-signature">☽ ✦ ☾</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NossaHistoria;
