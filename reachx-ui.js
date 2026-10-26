(()=>{
 const button=document.querySelector('.rx-menu-toggle'),menu=document.getElementById('rx-menu');
 function close(){menu?.classList.remove('open');button?.setAttribute('aria-expanded','false');}
 button?.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));menu.classList.toggle('open',open);});
 menu?.addEventListener('click',e=>{if(e.target.closest('a'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){close();button.focus();}});
 document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&!button.contains(e.target))close();});
 // Consistent navigation on service, contact and guide pages.
 const header=document.querySelector('header.top');
 if(header&&!header.querySelector('[aria-label="Main navigation"]')){
  const nav=document.createElement('nav');nav.className='utility-nav';nav.setAttribute('aria-label','Main navigation');
  for(const [label,url] of [['Services & plans','/#phase1'],['Work','/work.html'],['About','/about.html'],['Contact','/contact.html']]){const a=document.createElement('a');a.textContent=label;a.href=url;nav.append(a);}
  header.querySelectorAll(':scope > a:not(.brand)').forEach(a=>a.remove());header.append(nav);
 }
})();
