const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const dir=process.argv[2]||path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(dir,'assets',name),'utf8');
const base=read('wireframe-template.html').replace(/\{\{([^}]+)\}\}/g,(_,name)=>({'需求名称':'服务管理评审','页面名称':'业务设置','模块名称':'业务管理','真实字段名称':'名称','变更标题':'填写业务名称','具体行为或规则':'名称不能为空，保存时校验。'}[name]||name));
function html(count=1,clean=false){
  let content=base;
  if(count>1){
    const pages=Array.from({length:count},(_,index)=>({id:'p'+index,title:'业务页面 '+(index+1),group:'模块 '+(Math.floor(index/4)+1),templateId:'fixture-'+index,notes:Array.from({length:index===0?3:2},(_,n)=>({id:`R${index+1}-0${n+1}`,type:'新增字段',title:`字段规则 ${index+1}.${n+1}`,body:'默认保留现有值，支持修改并校验。',source:'来源：测试需求文档'}))}));
    const templates=pages.map(page=>`<template id="${page.templateId}"><section class="sample-product"><h2>${page.title}</h2><form onsubmit="event.preventDefault();window.submits=(window.submits||0)+1">${page.notes.map(note=>`<div class="sample-control req-target" data-requirement="${note.id}" style="margin-bottom:35px"><label>字段 ${note.id}<input class="business-input" value="初始值" style="font-size:17px;background:rgb(250,251,252)"></label><button type="button" class="req-pin" aria-label="查看 ${note.id} 标注">${note.id}</button></div>`).join('')}</form></section></template>`).join('');
    content=content.replace('<script src="requirement-review.js"></script>',templates+'<script>window.requirementPages='+JSON.stringify(pages)+'</script><script src="requirement-review.js"></script>');
  }
  if(clean)content=content.replace('<html lang=', '<html class="req-clean" lang=');
  return content.replace('<link rel="stylesheet" href="requirement-review.css">',()=>'<style>'+read('requirement-review.css')+'</style>').replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+read(name)+'</script>');
}
(async()=>{
  const browser=await chromium.launch({headless:true});let failed=0;
  async function test(name,count,fn){
    const p=await browser.newPage({viewport:{width:1440,height:980},reducedMotion:'reduce'});p.setDefaultTimeout(2000);
    const errors=[];p.on('pageerror',error=>errors.push(error.message));
    try{await p.setContent(html(count));await fn(p);assert.deepEqual(errors,[]);console.log('PASS',name);}catch(error){failed++;console.log('FAIL',name,error.message.split('\n')[0]);}finally{await p.close();}
  }
  await test('single-page workspace omits directory and restores annotations',1,async p=>{
    assert.equal(await p.locator('.req-page-directory').isVisible(),false);
    assert.equal(await p.locator('[data-directory-toggle]').isVisible(),false);
    assert.equal(await p.locator('.req-note-scope').isVisible(),false);
    const width=(await p.locator('.req-review-stage').boundingBox()).width;
    for(let i=0;i<3;i++){
      await p.getByRole('button',{name:'隐藏标注',exact:true}).click();
      assert.equal(await p.locator('.req-review-panel').isVisible(),false);
      assert.equal(await p.locator('.req-pin').isVisible(),false);
      assert.ok((await p.locator('.req-review-stage').boundingBox()).width>width);
      await p.getByRole('button',{name:'显示标注',exact:true}).click();
      assert.equal(await p.locator('.req-review-panel').isVisible(),true);
    }
  });
  await test('initial clean mode and keyboard toggles stay synchronized',1,async p=>{
    await p.setContent(html(1,true));
    const toggle=p.locator('[data-requirement-toggle]');await toggle.focus();await p.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'),'true');await p.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  });
  await test('three pages preserve input and never submit business forms',3,async p=>{
    assert.equal(await p.locator('[data-review-page]').count(),3);
    await p.locator('.req-page:not([hidden]) input').first().fill('修改后的名称');
    await p.locator('[data-review-page=p1]').click();await p.locator('[data-review-page=p0]').click();
    assert.equal(await p.locator('.req-page:not([hidden]) input').first().inputValue(),'修改后的名称');
    await p.locator('.req-page:not([hidden]) .req-pin').first().click();await p.waitForTimeout(50);
    assert.equal(await p.locator('.req-review-item[data-requirement="R1-01"]').evaluate(e=>e===document.activeElement),true);
    await p.keyboard.press('Enter');await p.waitForTimeout(50);
    assert.equal(await p.locator('.req-page:not([hidden]) .req-pin').first().evaluate(e=>e===document.activeElement),true);
    assert.equal(await p.evaluate(()=>window.submits||0),0);
    assert.equal(await p.locator('.req-page:not([hidden]) input').first().evaluate(e=>getComputedStyle(e).fontSize),'17px');
    await p.addStyleTag({content:'.business-link{color:rgb(16,80,160);text-decoration:underline}'});
    await p.locator('.req-page:not([hidden])').evaluate(e=>e.insertAdjacentHTML('beforeend','<a class="business-link" href="#business">业务链接</a>'));
    assert.equal(await p.locator('.business-link').evaluate(e=>getComputedStyle(e).color),'rgb(16, 80, 160)');
  });
  await test('24-page directory searches, handles no matches, and crosses pages',24,async p=>{
    assert.equal(await p.locator('[data-review-page]').count(),24);
    await p.locator('[data-page-search]').fill('R24-02');
    assert.equal(await p.locator('[data-review-page]').count(),1);await p.locator('[data-review-page=p23]').click();
    assert.equal(await p.locator('.req-page-position').textContent(),'24 / 24');
    assert.equal(await p.getByRole('button',{name:'下一页',exact:true}).isDisabled(),true);
    await p.locator('[data-page-search]').fill('不存在的字段');await p.locator('[data-clear-search]').click();
    assert.equal(await p.locator('[data-review-page]').count(),24);
    await p.locator('[data-note-scope=all]').click();assert.equal(await p.locator('.req-review-item').count(),49);
    await p.locator('[data-note-page=p1] summary').click();
    await p.locator('.req-review-item[data-requirement="R2-02"]').click();await p.waitForTimeout(60);
    assert.equal(await p.locator('.req-page:not([hidden])').getAttribute('data-page'),'p1');
    assert.equal(await p.locator('.req-page:not([hidden]) .req-pin').last().evaluate(e=>e===document.activeElement),true);
    await p.getByRole('button',{name:'隐藏标注',exact:true}).click();await p.getByRole('button',{name:'下一页',exact:true}).click();
    assert.equal(await p.locator('.req-review-panel').isVisible(),false);
    assert.equal(await p.locator('.req-page:not([hidden]) .req-pin').first().isVisible(),false);
    await p.getByRole('button',{name:'显示标注',exact:true}).click();
    if(process.env.REQ_SCREENSHOTS)await p.screenshot({path:path.join(process.env.REQ_SCREENSHOTS,'workspace-24.png'),fullPage:true});
  });
  await test('async surface rendering retains bidirectional pin navigation',3,async p=>{
    await p.locator('[data-review-page=p1]').click();
    await p.evaluate(()=>{
      document.querySelector('.req-page[data-page="p1"] .req-target').remove();
      document.querySelector('.req-review-item').dataset.openSurface='drawer';
      window.openRequirementSurface=async()=>{
        await new Promise(resolve=>setTimeout(resolve,100));
        document.querySelector('.req-page[data-page="p1"]').insertAdjacentHTML('beforeend','<div class="req-target" data-requirement="R2-01" style="margin:80px 30px">详情<button type="button" class="req-pin">R2-01</button></div>');
      };
    });
    await p.locator('.req-review-item').first().click();await p.waitForTimeout(180);
    assert.equal(await p.locator('.req-target[data-requirement="R2-01"] .req-pin').evaluate(e=>e===document.activeElement),true);
    await p.locator('.req-target[data-requirement="R2-01"] .req-pin').click();await p.waitForTimeout(50);
    assert.equal(await p.locator('.req-review-item').first().evaluate(e=>e===document.activeElement),true);
  });
  await test('responsive layout keeps search, restore action, and focus usable',3,async p=>{
    for(const width of [1100,800,375]){
      await p.setViewportSize({width,height:850});await p.waitForTimeout(50);
      assert.equal(await p.locator('.req-page-directory').isVisible(),false);
      await p.locator('[data-directory-toggle]').click();await p.locator('[data-page-search]').fill('业务页面 2');
      await p.locator('[data-review-page=p1]').click();assert.equal(await p.locator('.req-page-directory').isVisible(),false);
      await p.locator('[data-directory-toggle]').click();await p.locator('[data-page-search]').focus();await p.keyboard.press('Escape');
      assert.equal(await p.locator('.req-page-directory').isVisible(),false);
      await p.getByRole('button',{name:'隐藏标注',exact:true}).click();
      const button=p.getByRole('button',{name:'显示标注',exact:true}),box=await button.boundingBox();
      assert.ok(box.x>=0&&box.x+box.width<=width&&box.height<50);
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
      await button.click();
    }
    if(process.env.REQ_SCREENSHOTS)await p.screenshot({path:path.join(process.env.REQ_SCREENSHOTS,'workspace-mobile.png'),fullPage:true});
  });
  await browser.close();process.exitCode=failed?1:0;
})();
