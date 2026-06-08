import { Carousel } from 'react-bootstrap';

interface ProductImageCarouselProps {
  imagens: string[];
  alt: string;
  activeIndex?: number;
  carouselKey?: string;
}

const ProductImageCarousel = ({
  imagens,
  alt,
  activeIndex = 0,
  carouselKey,
}: ProductImageCarouselProps) => {
  if (!imagens.length) {
    return (
      <div className="product-carousel-placeholder">
        <span>Sem imagem</span>
      </div>
    );
  }

  if (imagens.length === 1) {
    return (
      <div className="product-carousel-single" key={carouselKey ?? imagens[0]}>
        <img src={imagens[0]} alt={alt} className="product-carousel-image" />
      </div>
    );
  }

  return (
    <Carousel
      key={carouselKey ?? imagens.join('-')}
      activeIndex={activeIndex}
      interval={null}
      indicators
      controls
      className="product-carousel"
      variant="dark"
    >
      {imagens.map((img, index) => (
        <Carousel.Item key={`${img}-${index}`}>
          <img
            src={img}
            alt={`${alt} — foto ${index + 1}`}
            className="product-carousel-image"
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default ProductImageCarousel;
