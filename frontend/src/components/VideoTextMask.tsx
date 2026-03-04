import { useEffect, useRef } from 'react';

interface VideoTextMaskProps {
  videoSrc: string;
  text: string;
  className?: string;
}

const VideoTextMask = ({ videoSrc, text, className = '' }: VideoTextMaskProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;

    if (!canvas || !video || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Função para desenhar o texto com vídeo
    const draw = () => {
      if (!ctx || !video) return;

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar vídeo no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Criar máscara de texto
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'white';
      ctx.font = '900 4.5rem Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      requestAnimationFrame(draw);
    };

    // Quando o vídeo estiver pronto, começar a desenhar
    video.addEventListener('loadedmetadata', () => {
      draw();
    });

    // Iniciar desenho
    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [text, videoSrc]);

  return (
    <div ref={containerRef} className={`video-text-mask-container ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="video-text-mask-video"
      />
      <canvas ref={canvasRef} className="video-text-mask-canvas" />
    </div>
  );
};

export default VideoTextMask;
