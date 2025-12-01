import "../styles/Hero.css";

function Hero({ onScrollClick = () => {} }: { onScrollClick?: () => void }) {
  return (
    <div className="hero">
      <div className="cta-button-wrapper">
        <button className="cta-button" onClick={onScrollClick}>
          BOOK YOUR TURF NOW
        </button>
      </div>
    </div>
  );
}

export default Hero;
