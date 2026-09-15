(()=>{
  const root=document.documentElement;
  const toggles=document.querySelectorAll('[data-requirement-toggle]');
  function syncToggle(){
    const clean=root.classList.contains('req-clean');
    toggles.forEach(toggle=>{
      toggle.textContent=clean?'显示标注':'隐藏标注';
      toggle.setAttribute('aria-expanded',String(!clean));
    });
  }
  async function focusRequirement(id,source){
    if(!id)return;
    if(source?.dataset.page&&typeof window.openRequirementPage==='function')await window.openRequirementPage(source.dataset.page);
    const surface=source?.dataset.openSurface;
    if(surface&&typeof window.openRequirementSurface==='function')await window.openRequirementSurface(surface);
    root.classList.remove('req-clean');
    syncToggle();
    const nodes=[...document.querySelectorAll('[data-requirement]')];
    nodes.forEach(node=>node.classList.toggle('is-active',node.dataset.requirement===id));
    const matches=nodes.filter(node=>node.dataset.requirement===id);
    matches.filter(node=>node.classList.contains('req-review-item')).forEach(node=>{const details=node.closest('details');if(details)details.open=true;});
    const fromPin=source?.classList.contains('req-target');
    const destination=matches.find(node=>node.classList.contains(fromPin?'req-review-item':'req-target')&&node.getClientRects().length);
    if(!destination)return;
    requestAnimationFrame(()=>{
      const focusable=fromPin?destination:destination.querySelector('.req-pin');
      focusable?.focus({preventScroll:true});
      destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    });
  }
  document.addEventListener('click',event=>{
    const control=event.target.closest('.req-pin,.req-review-item');
    if(!control)return;
    event.preventDefault();
    const source=control.classList.contains('req-pin')?control.closest('.req-target'):control;
    focusRequirement(source?.dataset.requirement,source);
  });
  toggles.forEach(toggle=>toggle.addEventListener('click',event=>{
    event.preventDefault();
    root.classList.toggle('req-clean');
    syncToggle();
  }));
  syncToggle();
  window.focusRequirement=focusRequirement;
})();
