<script>
  import Router from 'svelte-spa-router';
  import { routes } from './routes/index.js';
  import Nav from './lib/nav/Nav.svelte';
  import Footer from './lib/footer/Footer.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    const fixHash = () => {
      if (location.hash.startsWith('#/')) {
        const target = location.hash.slice(1);
        history.replaceState(null, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    fixHash();
    window.addEventListener('hashchange', fixHash);
    return () => window.removeEventListener('hashchange', fixHash);
  });
</script>

<Nav logoSrc="/logo.png" brand="RIB" />

<!-- ❌ antes: class="pt-14" -->
<main>
  <Router {routes} useHash={false} />
</main>

<Footer brand="RIB" logoSrc="/logo.png" />
