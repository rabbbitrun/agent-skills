(()=>{
  const workspace=document.querySelector('.req-workspace');
  const pages=window.requirementPages;
  if(!workspace||!Array.isArray(pages)||!pages.length)return;
  const query=selector=>workspace.querySelector(selector);
  const nodes=selector=>workspace.querySelectorAll(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const pageMap=new Map(),noteMap=new Map(),views=new Map(),groups=new Map(),selected=new Map();
  const list=query('.req-review-list'),directory=query('.req-directory-groups'),search=query('[data-page-search]');
  const compact=matchMedia('(max-width:1200px)');
  let current=pages[0].id,scope='page';
  const openedGroups=new Set();
  // Mount once, then hide/show pages so entered values and business handlers survive navigation.
  pages.forEach(page=>{
    if(pageMap.has(page.id))throw new Error('Duplicate review page ID: '+page.id);
    const template=document.getElementById(page.templateId);
    if(!(template instanceof HTMLTemplateElement))throw new Error('Missing page template: '+page.templateId);
    pageMap.set(page.id,page);
    const group=page.group||'页面';
    if(!groups.has(group))groups.set(group,[]);
    groups.get(group).push(page);
    const view=document.createElement('section');
    view.className='req-page';view.dataset.page=page.id;view.hidden=true;
    view.append(template.content.cloneNode(true));query('[data-page-canvas]').append(view);views.set(page.id,view);
    (page.notes||[]).forEach(note=>{
      if(noteMap.has(note.id))throw new Error('Duplicate requirement ID: '+note.id);
      noteMap.set(note.id,{page,note});
    });
    selected.set(page.id,page.notes?.[0]?.id);
  });
  openedGroups.add(pages[0].group||'页面');
  const summary=`${groups.size} 个模块 · ${pages.length} 个页面 · ${noteMap.size} 条注释`;
  nodes('[data-page-total]').forEach(node=>node.textContent=pages.length+' 个页面');
  nodes('[data-project-summary]').forEach(node=>node.textContent=summary);
  workspace.classList.toggle('req-single',pages.length===1);
  function setDirectory(open){
    workspace.classList.toggle('req-directory-closed',!open);
    query('[data-directory-toggle]').setAttribute('aria-expanded',String(open));
  }
  function renderDirectory(){
    const term=search.value.trim().toLocaleLowerCase();let count=0;
    directory.innerHTML=[...groups].map(([name,members])=>{
      const filtered=members.filter(page=>[name,page.title,String(pages.indexOf(page)+1).padStart(2,'0'),...(page.notes||[]).flatMap(note=>[note.id,note.title,note.body])].join(' ').toLocaleLowerCase().includes(term));
      count+=filtered.length;if(!filtered.length)return '';
      return `<details class="req-directory-group" data-group="${escape(name)}" ${term||openedGroups.has(name)?'open':''}><summary>${escape(name)}<span>${filtered.length}</span></summary>${filtered.map(page=>`<button type="button" class="req-directory-page" data-review-page="${escape(page.id)}" ${page.id===current?'aria-current="page"':''}><span class="req-page-index">${String(pages.indexOf(page)+1).padStart(2,'0')}</span>${escape(page.title)}<span class="req-page-count">${page.notes?.length||0}</span></button>`).join('')}</details>`;
    }).join('');
    query('.req-search-result').textContent=term?`匹配 ${count} / ${pages.length} 个页面`:summary;
    if(!count)directory.innerHTML='<div class="req-directory-empty">没有找到相关页面或注释。<br><button type="button" data-clear-search>清空搜索</button></div>';
  }
  function renderNotes(){
    const page=pageMap.get(current);
    query('.req-panel-heading h2').textContent=scope==='all'?'全部页面注释':'本页注释';
    query('.req-count').textContent=scope==='all'?noteMap.size:(page.notes?.length||0);
    query('.req-panel-subtitle').textContent=scope==='all'?'按页折叠，点击注释可跨页定位。':page.title+' · 点击条目定位对应界面';
    nodes('[data-note-scope]').forEach(button=>{
      const all=button.dataset.noteScope==='all';
      button.textContent=(all?'全部 ':'本页 ')+(all?noteMap.size:(page.notes?.length||0));
      button.setAttribute('aria-pressed',String(button.dataset.noteScope===scope));
    });
    list.innerHTML=(scope==='all'?pages:[page]).map(item=>{
      const notes=(item.notes||[]).map(note=>`<button type="button" class="req-review-item${item.id===current&&note.id===selected.get(current)?' is-active':''}" data-requirement="${escape(note.id)}" data-page="${escape(item.id)}"${note.surface?` data-open-surface="${escape(note.surface)}"`:''}><span class="req-note-top"><span class="req-review-id">${escape(note.id)}</span><span class="req-type">${escape(note.type)}</span></span><b class="req-note-title">${escape(note.title)}</b><span class="req-note-body">${escape(note.body)}</span>${note.source?`<span class="req-note-source">${escape(note.source)}</span>`:''}</button>`).join('')||'<p class="req-directory-empty">本页暂无注释。</p>';
      return scope==='all'?`<details class="req-note-page-group" data-note-page="${escape(item.id)}" ${item.id===current?'open':''}><summary>${escape(item.title)}<span>${item.id===current?'当前 · ':''}${item.notes?.length||0} 条</span></summary>${notes}</details>`:`<section class="req-note-page-group">${notes}</section>`;
    }).join('');
  }
  function openPage(id){
    if(!pageMap.has(id))return;
    current=id;const page=pageMap.get(id),index=pages.indexOf(page);
    views.forEach((view,key)=>view.hidden=key!==id);
    nodes('.req-target').forEach(node=>node.classList.toggle('is-active',node.dataset.requirement===selected.get(id)));
    query('.req-current-page-path').textContent=(page.group?page.group+' / ':'')+page.title;
    query('.req-page-position').textContent=String(index+1).padStart(2,'0')+' / '+pages.length;
    query('[data-page-step="-1"]').disabled=index===0;query('[data-page-step="1"]').disabled=index===pages.length-1;
    openedGroups.add(page.group||'页面');search.value='';renderDirectory();renderNotes();
    if(!workspace.classList.contains('req-directory-closed'))directory.querySelector('[aria-current=page]')?.scrollIntoView({block:'nearest'});
    if(scope==='all'&&!document.documentElement.classList.contains('req-clean'))list.querySelector('.is-active')?.scrollIntoView({block:'nearest'});
  }
  window.openRequirementPage=id=>{if(id!==current)openPage(id);};
  // Capture the chosen ID before cross-page navigation rebuilds the note list.
  workspace.addEventListener('click',event=>{
    const control=event.target.closest('.req-pin,.req-review-item');
    const id=control?.closest('[data-requirement]')?.dataset.requirement;
    if(noteMap.has(id))selected.set(noteMap.get(id).page.id,id);
  },true);
  directory.addEventListener('toggle',event=>{
    const group=event.target.dataset.group;
    if(!group||search.value.trim())return;
    if(event.target.open)openedGroups.add(group);else openedGroups.delete(group);
  },true);
  search.addEventListener('input',renderDirectory);
  query('[data-directory-toggle]').addEventListener('click',()=>setDirectory(workspace.classList.contains('req-directory-closed')));
  nodes('[data-note-scope]').forEach(button=>button.addEventListener('click',()=>{
    scope=button.dataset.noteScope;renderNotes();
    if(scope==='all')list.querySelector('.is-active')?.scrollIntoView({block:'nearest'});
  }));
  workspace.addEventListener('click',event=>{
    if(event.target.closest('[data-clear-search]')){search.value='';renderDirectory();search.focus();return;}
    const step=event.target.closest('[data-page-step]');
    if(step){openPage(pages[pages.findIndex(page=>page.id===current)+Number(step.dataset.pageStep)]?.id);return;}
    const link=event.target.closest('[data-review-page],[data-go-page]');if(!link)return;
    openPage(link.dataset.reviewPage||link.dataset.goPage);
    if(compact.matches){setDirectory(false);query('[data-directory-toggle]').focus({preventScroll:true});}
    else directory.querySelector('[aria-current=page]')?.focus({preventScroll:true});
  });
  workspace.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&compact.matches&&!workspace.classList.contains('req-directory-closed')&&event.target.closest('.req-page-directory')){
      setDirectory(false);query('[data-directory-toggle]').focus({preventScroll:true});
    }
  });
  compact.addEventListener('change',()=>setDirectory(!compact.matches));
  setDirectory(!compact.matches);openPage(current);
})();
