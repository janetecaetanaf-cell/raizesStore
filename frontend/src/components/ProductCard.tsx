import { Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Produto } from '../types';

interface ProductCardProps {
  produto: Produto;
  onComprar?: (produto: Produto) => void;
}

const ProductCard = ({ produto, onComprar }: ProductCardProps) => {
  const navigate = useNavigate();
  const desconto = produto.precoOriginal
    ? Math.round((1 - produto.preco / produto.precoOriginal) * 100)
    : 0;
  const precoPix = produto.preco * 0.95;

  const handleClick = () => {
    if (produto.id.startsWith('demo-')) {
      return;
    }
    if (onComprar) {
      onComprar(produto);
    } else {
      navigate(`/produto/${produto.id}`);
    }
  };

  return (
    <Card className="product-card h-100">
      <div className="product-image-wrapper">
        {desconto > 0 && (
          <Badge className="product-badge-discount">{desconto}% OFF</Badge>
        )}
        <Badge className="product-badge-shipping">Frete grátis</Badge>
        {produto.imagens && produto.imagens.length > 0 ? (
          <Card.Img
            variant="top"
            src={produto.imagens[0]}
            alt={produto.nome}
            className="product-image"
            onClick={handleClick}
            style={{ cursor: produto.id.startsWith('demo-') ? 'default' : 'pointer' }}
          />
        ) : (
          <div className="product-image product-image-placeholder">
            <span>👕</span>
          </div>
        )}
      </div>
      <Card.Body className="product-card-body">
        <Card.Title className="product-title">{produto.nome}</Card.Title>
        <div className="product-prices">
          <span className="price-current">R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
          {produto.precoOriginal && (
            <span className="price-original">
              R$ {produto.precoOriginal.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
        <p className="price-pix">
          R$ {precoPix.toFixed(2).replace('.', ',')} com Pix
        </p>
        <Button
          variant="primary"
          className="w-100 product-buy-btn"
          onClick={handleClick}
          disabled={produto.id.startsWith('demo-')}
        >
          {produto.id.startsWith('demo-') ? 'Em breve' : 'Comprar'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
