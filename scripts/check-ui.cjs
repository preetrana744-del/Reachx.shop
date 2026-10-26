const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('const accountReady ='),end=html.indexOf('const topLoginBtn=',start);
async function check(available){
 const listeners={};let timeout;
 const auth={getSession:async()=>({data:{session:{user:{id:'test'}}}}),signInWithPassword:async()=>({data:{user:{id:'test'}},error:null}),onAuthStateChange:()=>{}};
 const context={window:available?{supabase:{createClient:()=>({auth})}}:{},document:{getElementById:()=>({addEventListener:(event,callback)=>listeners[event]=callback})},setTimeout:fn=>(timeout=fn,1),clearTimeout:()=>{},SUPABASE_URL:'https://example.invalid',SUPABASE_PUBLISHABLE_KEY:'test'};
 vm.createContext(context);vm.runInContext(html.slice(start,end)+';this.client=supabaseClient;',context);
 assert(context.client,'public module continues synchronously');
 if(!available)listeners.error();
 const session=await context.client.auth.getSession(),login=await context.client.auth.signInWithPassword({});
 if(available){assert.equal(session.data.session.user.id,'test');assert.equal(login.error,null);}
 else{assert.equal(session.data.session,null);assert.match(login.error.message,/unavailable/);}
}
(async()=>{await check(false);await check(true);console.log('PASS: SDK failure does not block initialization; account errors are contained; ready SDK calls still work.');})().catch(e=>{console.error(e);process.exit(1)});
