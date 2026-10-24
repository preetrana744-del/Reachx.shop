// Public enquiry capture; the platform still verifies the project's anon JWT.
// Only server credentials can call the database RPC; never return form values.
const allowedOrigins = new Set(["https://reachx.shop","https://www.reachx.shop","http://127.0.0.1:8767"]);
Deno.serve(async (req: Request) => {
 const origin=req.headers.get("origin")||"";
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://reachx.shop","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
 const reply=(body:object,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowedOrigins.has(origin))return reply({error:"This request origin is not allowed."},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Use POST."},405);
 if(!req.headers.get("content-type")?.includes("application/json"))return reply({error:"Send a JSON request."},415);
 const declared=Number(req.headers.get("content-length")||0);
 if(declared>18000)return reply({error:"Your message is too large."},413);
 try {
  const raw=await req.text();if(raw.length>18000)return reply({error:"Your message is too large."},413);
  const b=JSON.parse(raw);
  if(b.website_check)return reply({error:"Please leave the verification field empty."},400);
  const name=typeof b.name==="string"?b.name.trim():"";
  const email=typeof b.email==="string"?b.email.trim():"";
  const company=typeof b.business==="string"?b.business.trim():"";
  const message=typeof b.needs==="string"?b.needs.trim():"";
  if(name.length<2||name.length>120||email.length>320||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||company.length>160||message.length<10||message.length>4000)return reply({error:"Check your name, email and message (10–4,000 characters)."},400);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.request_id||""))return reply({error:"Refresh this page and try again."},400);
  const source=b.source==="homepage"?"homepage":"contact";
  const path=source==="homepage"?"/":"/contact.html";
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");const url=Deno.env.get("SUPABASE_URL");
  if(!key||!url)return reply({error:"Enquiry service is temporarily unavailable. Please use email."},503);
  const ip=(req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key+new Date().toISOString().slice(0,10)+ip));
  const abuseKey=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
  const saved=await fetch(url+"/rest/v1/rpc/capture_website_enquiry",{method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_id:b.request_id,p_name:name,p_email:email,p_company:company,p_message:message,p_source:source,p_path:path,p_abuse_key:abuseKey})});
  if(!saved.ok){
   const error=await saved.text();
   if(error.includes("submission_rate_limited"))return reply({error:"Too many enquiries. Please wait 10 minutes or email us."},429);
   console.error("Enquiry database request failed",saved.status);
   return reply({error:"Your enquiry could not be saved. Please use email or try again."},503);
  }
  return reply({ok:true,reference:b.request_id});
 }catch{return reply({error:"Your enquiry could not be saved. Check the fields and try again, or use email."},400);}
});
