<script>
  export let text = '';

</script>

<div class="badge" role="note" aria-label={text}>
  <div class="badge__icon">
    <slot>✅</slot>
  </div>
  <span class="badge__text">{text}</span>
</div>

<style>
  .badge {
    display:flex;align-items:center;gap:.75rem;
    padding:.5rem 1.25rem;border-radius:9999px;
    background:rgba(255,255,255,.4);
    backdrop-filter:blur(6px);
    border:1px solid #bfdbfe;
    box-shadow:0 1px 2px rgba(0,0,0,.05);
    transition:box-shadow .2s ease;
  }
  .badge:hover{ box-shadow:0 4px 16px rgba(0,0,0,.08); }
  .badge__icon{
    width:2rem;height:2rem;border-radius:9999px;
    display:grid;place-items:center;background:#dbeafe;color:#1d4ed8;
  }
  .badge__text{ color:#1f2937;font-weight:600;font-size:.9rem; }
</style>
