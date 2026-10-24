/* Captures enquiries in ReachX's existing backend. This is a public anon key,
   not a server secret. RLS denies direct reads and writes to the inbox. */
(() => {
 "use strict";
 const endpoint="https://eiijmxudxdzmfnzomlfy.supabase.co/functions/v1/website-enquiry";
 const publicAnonKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaWpteHVkeGR6bWZuem9tbGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTIwMjksImV4cCI6MjEwNjA2ODAyOX0.PNIv09Xm1u9qx4TVAa3wOHOlGitSekWyZ3aRIfAj5WE";
 document.querySelectorAll("#queryForm, [data-enquiry-form]").forEach(form=>{
  const status=form.querySelector(".enquiry-status");
  const button=form.querySelector('[type="submit"]');const label=button.textContent;
  let pending=false,requestId=null;
  form.addEventListener("submit",async event=>{
   event.preventDefault();
   if(pending||!form.reportValidity())return;
   pending=true;button.disabled=true;button.textContent="Sending…";status.dataset.state="pending";status.textContent="Saving your enquiry…";
   const fields=new FormData(form);
   if(!requestId)requestId=crypto.randomUUID();
   const payload={request_id:requestId,name:fields.get("name"),email:fields.get("email"),business:fields.get("business")||"",needs:fields.get("needs"),website_check:fields.get("website_check")||"",source:form.id==="queryForm"?"homepage":"contact"};
   try{
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","apikey":publicAnonKey,"Authorization":"Bearer "+publicAnonKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const result=await response.json();
    if(!response.ok||result.ok!==true)throw new Error(result.error||"Your enquiry could not be saved.");
    status.dataset.state="success";status.textContent="Enquiry saved. Reference: "+result.reference+". Keep this reference if you contact us by email.";
    if(typeof window.gtag==="function")window.gtag("event","generate_lead",{send_to:"G-5PS7FT8WVV",method:"website_form",form_location:payload.source,page_path:location.pathname});
    form.reset();requestId=null;
   }catch(error){
    status.dataset.state="error";status.textContent=(error.name==="TimeoutError"?"The connection timed out. Your enquiry may have been saved; retrying will reuse the same reference.":error.message||"We could not connect to the enquiry service.")+" You can also email reachx.shop@gmail.com.";
   }finally{pending=false;button.disabled=false;button.textContent=label;}
  });
  form.addEventListener("input",()=>{if(!pending)requestId=null;});
 });
})();

