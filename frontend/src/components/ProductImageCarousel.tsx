import { useEffect, useState } from 'react';
import { Carousel } from 'react-bootstrap';

interface ProductImageCarouselProps {
  imagens: string[];
  alt: string;
  carouselKey?: string;
}

const ProductImageCarousel = ({
  imagens,
  alt,
  carouselKey,
}: ProductImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const imagensKey = imagens.join('|');

  useEffect(() => {
    setActiveIndex(0);
  }, [carouselKey, imagensKey]);

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
      onSelect={setActiveIndex}
      interval={null}
      indicators={false}
      controls
      className="product-carousel"
      variant="dark"
      touch
    >
      {imagens.map((img, index) => (
        <Carousel.Item key={`${carouselKey ?? 'slide'}-${index}`}>
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
