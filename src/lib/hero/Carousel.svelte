<script>
  import { onMount } from 'svelte';
  import { register } from 'swiper/element/bundle';
  export let images = [];
  let swiperEl;

  onMount(() => {
    register();
    Object.assign(swiperEl, {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      pagination: { clickable: true },
      autoplay: { delay: 3200, disableOnInteraction: false },
      speed: 600,
      autoHeight: false
    });
    swiperEl.initialize();
  });
</script>


<swiper-container
  bind:this={swiperEl}
  init="false"
  class="block w-full overflow-hidden rounded-2xl
         aspect-[16/10] sm:aspect-[4/3] lg:aspect-[16/9]"
>
  {#each images as img, i}
    <swiper-slide class="!p-0">
      <img
        src={img}
        alt={`Servicio ${i + 1}`}
        loading={i === 0 ? 'eager' : 'lazy'}
        fetchpriority={i === 0 ? 'high' : 'auto'}
        class="block w-full h-full select-none
               object-cover"        
        style="object-position: center 30%;"  
        draggable="false"
        sizes="(min-width:1024px) 720px, 100vw"
      />
    </swiper-slide>
  {/each}
</swiper-container>

<style>

  :global(swiper-slide img){ border-radius: 0 !important; }


  :global(swiper-container){
    --swiper-pagination-bottom: 10px;  
  }

</style>
