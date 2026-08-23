import { LOJA } from "../config/loja";

function CTA() {
  return (
    <section className="cta">
      <div className="container cta-inner">
        <p className="eyebrow">Faça parte da missão</p>

        <h2>CURTIU A MISSÃO?</h2>

        <p>Vem acompanhar a Mission Store.</p>

        <div className="cta-botoes">
          <a
            href={LOJA.instagram}
            target="_blank"
            rel="noreferrer"
            className="botao botao-solido"
          >
            Instagram
          </a>

          <a
            href={`https://wa.me/${LOJA.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="botao botao-contorno"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export default CTA;
