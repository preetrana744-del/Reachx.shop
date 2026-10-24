(()=>{
 const form=document.getElementById('collaboration-email');if(!form)return;
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form),name=String(data.get('name')||'').trim(),email=String(data.get('email')||'').trim(),message=String(data.get('message')||'').trim();
  const body=`Hi Preet,\n\n${message}\n\nName: ${name}\nReply email: ${email}`;
  const href='mailto:preetrana744@gmail.com?subject='+encodeURIComponent('Let’s collaborate — ReachX')+'&body='+encodeURIComponent(body);
  document.getElementById('email-status').textContent='Your email app will open. If it doesn’t, use the direct email link on this page.';
  window.location.href=href;
 });
})();
