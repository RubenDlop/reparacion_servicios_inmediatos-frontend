<script>
  import { fly } from 'svelte/transition';
  import Badge from './Badge.svelte';
  import ServiceCard from './ServiceCard.svelte';
  import Testimonial from './Testimonial.svelte';
  import Carousel from './Carousel.svelte';
  import { services } from './services';

  import Img1 from '../../assets/hero-carousel/pexels-photo-259588.jpeg';
  import Img2 from '../../assets/hero-carousel/pexels-photo-4792511.jpeg';
  import Img3 from '../../assets/hero-carousel/pexels-photo-4246094.jpeg';
  import Img4 from '../../assets/hero-carousel/pexels-photo-3990359.jpeg';

  const images = [Img1, Img2, Img3, Img4];

  function scrollToInfo() {
    const el = document.getElementById('info');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<section id="hero" class="hero" aria-labelledby="hero-title">
  <div class="hero__bg-top" aria-hidden="true"></div>
  <div class="hero__bg-bubble" aria-hidden="true"></div>

  <div class="hero__content">
    <!-- Texto -->
    <div class="hero__left" in:fly={{ x: -50, duration: 300, opacity: 0 }}>
      <h1 id="hero-title" class="hero__title">Servicios expertos para tu hogar</h1>
      <p class="hero__subtitle">Tu hogar, en manos confiables.</p>
      <p class="hero__lead">
        Reparación, mantenimiento, remodelación y más. Conecta con profesionales confiables y transforma tu hogar en minutos.
      </p>

      <div class="hero__badges">
        <Badge text="+1,000 clientes felices">👍</Badge>
        <Badge text="Garantía de satisfacción">✅</Badge>
      </div>

      <div class="hero__grid">
        {#each services as s}
          <ServiceCard label={s.label} icon={s.icon} />
        {/each}
      </div>

      <div class="hero__cta">
        <button class="btn btn--primary" on:click={scrollToInfo}>Ver Servicios</button>
        <button class="btn btn--ghost">Agenda tu demostración</button>
      </div>
    </div>

    <!-- Carrusel -->
    <div class="hero__right" in:fly={{ x: 50, duration: 300, delay: 100, opacity: 0 }}>
      <Carousel {images} />
    </div>
  </div>

  <div class="hero__reviews">
    <h3 class="hero__reviews-title">Lo que dicen nuestros clientes</h3>
    <Testimonial
      name="Carlos Méndez"
      comment="¡Excelente servicio! En menos de 2 horas ya tenía la plomería arreglada. Rápidos, profesionales y muy amables."
    />
  </div>
</section>

<style>
  .hero{
    position:relative; padding:5rem 1.5rem; overflow:hidden;
    background:linear-gradient(135deg,#eff6ff,#ffffff,#dbeafe);
  }
  .hero__content{
    position:relative; z-index:1; display:flex; flex-direction:column;
    gap:3.5rem; align-items:center; justify-content:space-between;
  }
  @media (min-width:1024px){
    .hero__content{ flex-direction:row; align-items:stretch; }
  }
  .hero__bg-top{
    position:absolute; inset:0 0 auto 0; height:12rem;
    background:linear-gradient(90deg,rgba(191,219,254,.4),rgba(147,197,253,.2));
    border-bottom-left-radius:100% 80px; border-bottom-right-radius:100% 80px;
    filter:blur(24px); z-index:0;
  }
  .hero__bg-bubble{
    position:absolute; right:-100px; bottom:-150px; width:300px; height:300px;
    background:#dbeafe; border-radius:9999px; filter:blur(36px); opacity:.6; z-index:0;
  }
  .hero__left{ width:100%; max-width:720px; text-align:center; }
  @media (min-width:1024px){ .hero__left{ width:50%; text-align:left; } }

  .hero__title{ font-weight:800; letter-spacing:-.01em; color:#1d4ed8;
                font-size:2.25rem; line-height:1.15; }
  @media (min-width:768px){ .hero__title{ font-size:3rem; } }

  .hero__subtitle{ color:#6b7280; font-style:italic; margin-top:.5rem; }
  .hero__lead{ color:#374151; font-size:1.125rem; line-height:1.7; margin-top:.5rem; }

  .hero__badges{ display:flex; flex-wrap:wrap; gap:1rem; margin-top:1rem; }
  .hero__grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.25rem; margin-top:1.25rem; }

  .hero__cta{ display:flex; flex-direction:column; gap:1rem; margin-top:2rem; justify-content:center; }
  @media (min-width:640px){ .hero__cta{ flex-direction:row; justify-content:flex-start; } }

  .btn{ border-radius:9999px; padding:.5rem 2rem; font-weight:600; transition:all .2s ease; }
  .btn--primary{ background:#2563eb; color:#fff; box-shadow:0 10px 24px rgba(37,99,235,.25); }
  .btn--primary:hover{ transform:scale(1.03); }
  .btn--ghost{ border:1px solid #2563eb; color:#2563eb; background:transparent; }
  .btn--ghost:hover{ background:#2563eb; color:#fff; }

.hero__right{
  width:100%;
  max-width:none;           /* o pon 720px si quieres limitar ancho */
  overflow:visible;         /* nada de “recorte” del marco */
  /* sin radius / sin sombra / sin outline */
}
@media (min-width:1024px){ .hero__right{ width:48%; } }

/* extra: clase para asegurarnos que no haya marco */
.no-frame{
  border:none !important;
  outline:none !important;
  box-shadow:none !important;
  background:transparent !important;
  border-radius:0 !important;
  padding:0 !important;
}

  .hero__reviews{ margin-top:5rem; max-width:768px; margin-inline:auto; text-align:center; }
  .hero__reviews-title{ color:#2563eb; font-weight:600; font-size:1.125rem; margin-bottom:1rem; }
</style>
