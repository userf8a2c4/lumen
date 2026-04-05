import React, { useState, useEffect } from 'react';

const QUOTES = [
  { text: 'La excelencia nunca es un accidente; es el resultado de alta intencion, esfuerzo sincero e inteligente ejecucion.', author: 'Aristoteles' },
  { text: 'La calidad no es un acto, es un habito.', author: 'Aristoteles' },
  { text: 'La simplicidad es la maxima sofisticacion.', author: 'Leonardo da Vinci' },
  { text: 'La unica manera de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' },
  { text: 'La innovacion distingue entre un lider y un seguidor.', author: 'Steve Jobs' },
  { text: 'Tu tiempo es limitado; no lo desperdicies viviendo la vida de otro.', author: 'Steve Jobs' },
  { text: 'La vision sin ejecucion es solo una alucinacion.', author: 'Henry Ford' },
  { text: 'Reunirse es un comienzo; mantenerse juntos es progreso; trabajar juntos es exito.', author: 'Henry Ford' },
  { text: 'No cuentes los dias, haz que los dias cuenten.', author: 'Muhammad Ali' },
  { text: 'El exito es la suma de pequenos esfuerzos repetidos dia tras dia.', author: 'Robert Collier' },
  { text: 'La mejor manera de predecir el futuro es crearlo.', author: 'Peter Drucker' },
  { text: 'La productividad nunca es un accidente; es siempre el resultado de un compromiso con la excelencia.', author: 'Paul J. Meyer' },
  { text: 'La diferencia entre ordinario y extraordinario es ese pequeno extra.', author: 'Jimmy Johnson' },
  { text: 'Haz cada dia tu obra maestra.', author: 'John Wooden' },
  { text: 'El exito no es definitivo, el fracaso no es fatal: lo que importa es el coraje de continuar.', author: 'Winston Churchill' },
  { text: 'Si crees que puedes, ya estas a mitad del camino.', author: 'Theodore Roosevelt' },
  { text: 'El secreto del exito es la constancia en el proposito.', author: 'Benjamin Disraeli' },
  { text: 'Haz tu mejor esfuerzo hasta que sepas mejor. Luego, cuando sepas mejor, hazlo mejor.', author: 'Maya Angelou' },
  { text: 'El liderazgo no se trata de ser el mejor. Se trata de hacer mejor a todos los demas.', author: 'Simon Sinek' },
  { text: 'Empieza donde estas. Usa lo que tienes. Haz lo que puedas.', author: 'Arthur Ashe' },
  { text: 'Una inversion en conocimiento paga los mejores intereses.', author: 'Benjamin Franklin' },
  { text: 'El aprendizaje es un tesoro que seguira a su dueno a todas partes.', author: 'Proverbio Chino' },
  { text: 'La sabiduria no es producto de la escolarizacion, sino del intento de aprenderla toda la vida.', author: 'Albert Einstein' },
  { text: 'La creatividad es la inteligencia divirtiendose.', author: 'Albert Einstein' },
  { text: 'No importa que tan lento vayas, siempre y cuando no te detengas.', author: 'Confucio' },
  { text: 'La educacion es el arma mas poderosa que puedes usar para cambiar el mundo.', author: 'Nelson Mandela' },
  { text: 'El conocimiento habla, pero la sabiduria escucha.', author: 'Jimi Hendrix' },
  { text: 'Busca primero entender, luego ser entendido.', author: 'Stephen Covey' },
  { text: 'Las grandes mentes hablan de ideas; las medianas de eventos; las pequenas de personas.', author: 'Eleanor Roosevelt' },
  { text: 'La pasion es energia. Siente el poder que viene de enfocarte en lo que te emociona.', author: 'Oprah Winfrey' },
  { text: 'Lo que medimos mejora.', author: 'Peter Drucker' },
  { text: 'La calidad es recordada mucho despues de que el precio se ha olvidado.', author: 'Familia Gucci' },
  { text: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
  { text: 'Se tan bueno que no puedan ignorarte.', author: 'Steve Martin' },
  { text: 'El cliente satisfecho es la mejor estrategia de todas.', author: 'Michael LeBoeuf' },
  { text: 'Cuida bien a tus clientes y ellos te cuidaran a ti.', author: 'Tom Peters' },
  { text: 'Atiende siempre a tus clientes mas de lo que esperan.', author: 'Nelson Boswell' },
  { text: 'La gente no compra bienes y servicios. Compra relaciones, historias y magia.', author: 'Seth Godin' },
  { text: 'La excelencia en servicio al cliente ocurre al nivel de las relaciones humanas.', author: 'Steve Dorfman' },
  { text: 'El liderazgo es el arte de conseguir que alguien haga algo porque quiere hacerlo.', author: 'Dwight D. Eisenhower' },
  { text: 'El unico limite para nuestros logros del manana seran nuestras dudas de hoy.', author: 'Franklin D. Roosevelt' },
  { text: 'La excelencia es una forma de arte ganada por entrenamiento y habituacion.', author: 'Aristoteles' },
  { text: 'No subestimes el poder de un pequeno grupo de personas comprometidas para cambiar el mundo.', author: 'Margaret Mead' },
  { text: 'Lo que obtienes al lograr tus metas no es tan importante como en quien te conviertes.', author: 'Henry David Thoreau' },
  { text: 'La perseverancia no es una larga carrera; son muchas carreras cortas, una tras otra.', author: 'Walter Elliot' },
  { text: 'El trabajo bien hecho es su propia recompensa.', author: 'Voltaire' },
  { text: 'Cada experto fue alguna vez un principiante.', author: 'Helen Hayes' },
  { text: 'El futuro pertenece a quienes creen en la belleza de sus suenos.', author: 'Eleanor Roosevelt' },
  { text: 'Haz de cada interaccion una experiencia memorable.', author: 'Tony Hsieh' },
  { text: 'La mentalidad de crecimiento lo transforma todo.', author: 'Carol Dweck' },
];

export default function DailyInsight({ userName = 'Lucila' }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const today = new Date().toDateString();
    const seen = sessionStorage.getItem('lumen_insight_date');
    if (seen === today) return;

    // Delay slightly so the app renders first
    const showTimer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const today = new Date().toDateString();
    sessionStorage.setItem('lumen_insight_date', today);

    // Auto-dismiss after 6 seconds
    const dismissTimer = setTimeout(() => beginFade(), 6000);
    return () => clearTimeout(dismissTimer);
  }, [visible]);

  const beginFade = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 600);
  };

  if (!visible) return null;

  return (
    <div
      onClick={beginFade}
      style={{
        position: 'fixed',
        bottom: '64px',
        left: '50%',
        zIndex: 9999,
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateX(-50%) translateY(8px)' : 'translateX(-50%) translateY(0)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--lumen-card)',
          border: '1px solid var(--lumen-border)',
          borderRadius: '20px',
          padding: '20px 28px',
          maxWidth: '480px',
          minWidth: '340px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Greeting */}
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--lumen-text-muted)',
          marginBottom: '12px',
        }}>
          Bienvenida, {userName}
        </p>

        {/* Quote */}
        <p style={{
          fontSize: '13px',
          lineHeight: '1.7',
          color: 'var(--lumen-text-secondary)',
          fontStyle: 'italic',
          marginBottom: '12px',
          fontWeight: 400,
        }}>
          &ldquo;{quote.text}&rdquo;
        </p>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--lumen-text-muted)',
            letterSpacing: '0.05em',
          }}>
            — {quote.author}
          </p>
          <div style={{
            width: '28px',
            height: '3px',
            borderRadius: '2px',
            background: 'rgba(126,63,242,0.3)',
            animation: 'shrink-bar 6s linear',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes shrink-bar {
          from { width: 28px; }
          to { width: 0px; }
        }
      `}</style>
    </div>
  );
}
