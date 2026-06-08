import { useState, useEffect } from 'react';
import { LOJA } from '../config/loja';

const mensagens = [
  `✨ Bem-vindos à ${LOJA.nome} • estampas e artigos religiosos`,
  '🕯️ Presentes espirituais para fortalecer sua fé e sua casa',
  `📦 Enviamos para todo o Brasil • WhatsApp ${LOJA.whatsappDisplay}`,
];

const AnnouncementBar = () => {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((prev) => (prev + 1) % mensagens.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="announcement-bar">
      <div className="announcement-bar-inner">
        <span className="announcement-text">{mensagens[indice]}</span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
