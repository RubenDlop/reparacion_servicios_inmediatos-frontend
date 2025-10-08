<script>
  export let name = '';
  export let comment = '';
  const initial = name?.charAt(0) ?? '?';
</script>

<figure class="tst">
  <blockquote class="tst__quote">“{comment}”</blockquote>
  <figcaption class="tst__author">
    <div class="tst__avatar" aria-hidden="true">{initial}</div>
    <span class="tst__name">{name}</span>
  </figcaption>
</figure>

<style>
  .tst{ background:rgba(255,255,255,.6);backdrop-filter:blur(8px);
        border:1px solid #bfdbfe;border-radius:14px;padding:1.25rem;
        box-shadow:0 6px 18px rgba(30,64,175,.05); }
  .tst__quote{ color:#374151;font-style:italic; }
  .tst__author{ display:flex;align-items:center;justify-content:center;gap:.75rem;margin-top:1rem; }
  .tst__avatar{ width:36px;height:36px;border-radius:9999px;background:#2563eb;color:#fff;
                display:grid;place-items:center;font-weight:700; }
  .tst__name{ color:#1f2937;font-weight:600;font-size:.9rem; }
</style>
