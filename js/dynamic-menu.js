(() => {
  const cfg = window.CAFE_SUPABASE || {};
  const enabled = cfg.url && cfg.anonKey && !cfg.url.includes('YOUR_');
  if (!enabled || !window.supabase) return;
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const fa = n => new Intl.NumberFormat('fa-IR').format(Number(n || 0));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fallback = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="100%" height="100%" fill="#e6e1d8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#667079" font-family="sans-serif" font-size="36">بدون تصویر</text></svg>`);

  function productCard(p, i){
    const diet = [p.is_vegan?'vegan':'',p.is_dairy_free?'dairyfree':'',p.is_sugar_free?'sugarfree':''].filter(Boolean).join(' ');
    const prices = p.price_large
      ? `<div class="price-set"><div class="price-line"><span class="price-label">کوچک</span><span class="price">${fa(p.price_small)} ت</span></div><div class="price-line"><span class="price-label">بزرگ</span><span class="price">${fa(p.price_large)} ت</span></div></div>`
      : `<div class="price-set"><div class="price-line"><span class="price">${fa(p.price_small)} ت</span></div></div>`;
    const tags = (p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('');
    const allergens = (p.allergens||[]).length ? `<div class="allergens" aria-label="مواد حساسیت‌زا">${p.allergens.map(a=>`<span class="allergen">حاوی ${esc(a)}</span>`).join('')}</div>` : '';
    const stock = `<span class="stock">${p.is_available===false?'ناموجود':'موجود'}</span>`;
    return `<article class="menu-card reveal in${i===0?' featured':''}" data-category="${esc(p.category)}" data-diet="${diet}" data-id="${esc(p.id)}" data-stock="${p.is_available===false?'out':'in'}">
      <div class="card-image"><img src="${esc(p.image_url||fallback)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="900" height="700" data-fallback="1"></div>
      <div class="card-body"><div class="card-top"><h3 class="card-title">${esc(p.name)}</h3>${prices}</div><p class="desc">${esc(p.description||'')}</p><div class="chips">${tags}</div>${allergens}${stock}</div>
    </article>`;
  }

  function bindDynamicFilters(){
    const oldSearch=document.getElementById('menu-search');
    if(!oldSearch) return;
    const search=oldSearch.cloneNode(true); oldSearch.replaceWith(search);
    const oldButtons=[...document.querySelectorAll('.filter')];
    const buttons=oldButtons.map(b=>{const n=b.cloneNode(true);b.replaceWith(n);return n});
    const oldDiet=[...document.querySelectorAll('.diet-filter')];
    const dietButtons=oldDiet.map(b=>{const n=b.cloneNode(true);b.replaceWith(n);return n});
    const count=document.getElementById('search-count'); const no=document.getElementById('no-results');
    let active='all', diet='all';
    const norm=v=>String(v||'').trim().toLocaleLowerCase('fa-IR').replace(/ي/g,'ی').replace(/ك/g,'ک');
    function render(){
      const cards=[...document.querySelectorAll('.menu-card')], q=norm(search.value); let visible=0;
      cards.forEach(c=>{const cat=active==='all'||c.dataset.category===active;const ds=(c.dataset.diet||'').split(/\s+/);const dm=diet==='all'||ds.includes(diet);const tm=!q||norm(c.textContent).includes(q);c.hidden=!(cat&&dm&&tm);if(!c.hidden)visible++});
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===active)));dietButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.diet===diet)));if(count)count.textContent=q?`${visible} نتیجه`:`${visible} آیتم`;if(no)no.hidden=visible!==0;
    }
    buttons.forEach(b=>b.addEventListener('click',()=>{active=b.dataset.filter||'all';render();document.querySelector('.menu-grid')?.scrollIntoView({behavior:'smooth',block:'start'})}));
    dietButtons.forEach(b=>b.addEventListener('click',()=>{diet=b.dataset.diet||'all';render()}));search.addEventListener('input',render);render();
  }

  document.addEventListener('error',e=>{const img=e.target;if(img?.tagName==='IMG'&&img.dataset.fallback==='1'){img.dataset.fallback='0';img.src=fallback}},true);

  async function loadProducts(){
    const grid=document.querySelector('.menu-grid'); if(!grid)return;
    const {data,error}=await client.from('products').select('*').order('sort_order').order('created_at');
    if(error||!data?.length)return;
    grid.querySelectorAll('.menu-card').forEach(x=>x.remove());
    const no=grid.querySelector('#no-results');grid.insertAdjacentHTML('afterbegin',data.map(productCard).join(''));if(no)grid.appendChild(no);bindDynamicFilters();
  }
  async function loadSettings(){
    const {data}=await client.from('site_settings').select('*').eq('id',1).maybeSingle();if(!data)return;
    document.querySelectorAll('[data-social="instagram"]').forEach(a=>{if(data.instagram_url)a.href=data.instagram_url});document.querySelectorAll('[data-social="telegram"]').forEach(a=>{if(data.telegram_url)a.href=data.telegram_url});document.querySelectorAll('[data-social="whatsapp"]').forEach(a=>{if(data.whatsapp_url)a.href=data.whatsapp_url});document.querySelectorAll('[data-cafe-phone]').forEach(a=>{if(data.phone)a.href='tel:'+data.phone});document.querySelectorAll('[data-cafe-instagram]').forEach(el=>{if(data.instagram_id)el.textContent=data.instagram_id});
  }
  Promise.all([loadProducts(),loadSettings()]);
})();
