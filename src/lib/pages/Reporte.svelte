<script>
  let termino = "";
  let fechaDesde = "";
  let fechaHasta = "";
  let rol = "";
  function buscar(e) { e.preventDefault(); /* no funcional por requisito */ }
</script>

<section class="container">
  <h1>Reporte (Demo no funcional)</h1>
  <form on:submit|preventDefault={buscar} class="f">
    <label>
      Término:
      <input bind:value={termino} placeholder="usuario, servicio, solicitud..." />
    </label>
    <label>
      Desde:
      <input type="date" bind:value={fechaDesde} />
    </label>
    <label>
      Hasta:
      <input type="date" bind:value={fechaHasta} />
    </label>
    <label>
      Rol:
      <select bind:value={rol}>
        <option value="">Todos</option>
        <option>Admin</option>
        <option>Técnico</option>
        <option>Cliente</option>
      </select>
    </label>
    <button type="submit">Buscar</button>
  </form>

  <h2>Resultados</h2>
  <table class="tbl">
    <thead>
      <tr><th>ID</th><th>Entidad</th><th>Detalle</th><th>Fecha</th><th>Estado</th></tr>
    </thead>
    <tbody>
      <tr><td colSpan="5">Demostración: sin conexión aún (requisito del parcial).</td></tr>
    </tbody>
  </table>
</section>

<style>
  .container { max-width: 1100px; margin: 2rem auto; padding: 1rem; }
  .f { display: grid; grid-template-columns: repeat(5, 1fr); gap: .75rem; align-items: end; }
  .f label { display:flex; flex-direction:column; font-size:.9rem; }
  .tbl { width:100%; border-collapse: collapse; margin-top:1rem; }
  .tbl th, .tbl td { border:1px solid #ddd; padding:.5rem; text-align:left; }
</style>
