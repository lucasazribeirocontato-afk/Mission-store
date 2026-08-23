import { LOJA } from "../config/loja";

function Mapa() {
  return (
    <section className="container section localizacao">
      <p className="eyebrow">Onde estamos</p>

      <h2 className="section-titulo">Venha nos visitar.</h2>

      <p className="descricao">Encontre a Mission Store no mapa.</p>

      <div className="mapa">
        <iframe
          title="Localização da Mission Store"
          src={LOJA.mapaEmbed}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <div className="mapa-botao-wrap">
        <a
          href={LOJA.googleMaps}
          target="_blank"
          rel="noreferrer"
          className="botao botao-solido"
        >
          Como chegar
        </a>
      </div>
    </section>
  );
}

export default Mapa;
