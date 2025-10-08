<script>
  export let label = '';
  export let icon = '🧰';
</script>

<button class="card" type="button" aria-label={label}>
  <span class="card__icon" aria-hidden="true">{icon}</span>
  <span class="card__label">{label}</span>
</button>

<style>
  .card{
    display:flex;align-items:center;gap:.75rem;
    width:100%;padding:.75rem 1rem;border-radius:12px;
    background:rgba(255,255,255,.6);backdrop-filter:blur(8px);
    border:1px solid #bfdbfe;cursor:pointer;
    transition:transform .15s ease, box-shadow .15s ease;
  }
  .card:hover{ transform:translateY(-1px); box-shadow:0 10px 20px rgba(30,64,175,.08); }
  .card__icon{ font-size:1.25rem; }
  .card__label{ color:#1f2937;font-weight:500; }
</style>
