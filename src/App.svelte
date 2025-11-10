<script>
  import Router, { location } from 'svelte-spa-router';
  import { routes } from './routes/index.js';
  import Nav from './lib/nav/Nav.svelte';
  import Footer from './lib/footer/Footer.svelte';
  import { onMount } from 'svelte';
  import { checkAuth, logoutAndClear } from './lib/stores/auth.js';

  function handleLogout() { logoutAndClear(); }

  onMount(() => {
    checkAuth(); // verifica token al cargar la app
  });
</script>

<!-- ✅ SOLO un nav -->
<Nav logoSrc="/logo.png" brand="RIB" on:logout={handleLogout} />

<main>
  {#key $location}
    <Router {routes} useHash={false} restoreScrollState={true} />
  {/key}
</main>

<Footer brand="RIB" logoSrc="/logo.png" />
