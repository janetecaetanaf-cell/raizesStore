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
                A <strong>Raízes Estampas</strong> nasceu da paixão por transformar
                ideias em estampas únicas — em camisetas, canecas e presentes
                personalizados para qualquer ocasião.
              </p>
              <p>
                Somos especialistas em estamparia personalizada: criamos artes para
                aniversários, casamentos, empresas, times, pets, datas comemorativas
                e muito mais. Cada peça é pensada para contar a sua história.
              </p>
              <p>
                Trabalhamos com materiais de qualidade e oferecemos ajuda na criação
                da arte, para que você tenha um produto exclusivo, do jeito que
                imaginou.
              </p>
              <p>
                Nossa missão é levar criatividade e personalização para o dia a
                dia — seja para presentear quem você ama, uniformizar sua equipe
                ou marcar um momento especial.
              </p>
              <p className="static-page-signature">✦ Raízes Estampas ✦</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NossaHistoria;
