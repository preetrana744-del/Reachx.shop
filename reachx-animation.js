// One bounded, low-density effect. Native scrolling is independent of animation.
export function startAnimation(onFailure){
 try {
  const canvas=document.getElementById('webgl'),hero=document.getElementById('home')||document.querySelector('.hero');
  if(!canvas||!hero||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  hero.prepend(canvas);const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const points=Array.from({length:coarse?12:24},()=>({x:Math.random(),y:Math.random(),r:Math.random()+.5}));
  let w=1,h=1,frame=0,visible=true,last=0,elapsed=0;
  function size(){w=hero.clientWidth;h=hero.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function tick(t){frame=0;if(!visible||document.hidden)return;
   const dt=last?Math.min(t-last,50):0;last=t;elapsed+=dt;
   ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(168,124,36,.22)';
   for(const p of points){const x=p.x*w,y=(p.y*h+elapsed*.004)%h;ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();}
   frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
  new ResizeObserver(size).observe(hero);size();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else wake();}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',()=>{if(motion.matches){visible=false;cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,w,h);}else{visible=true;wake();}});
  wake();
 } catch(error){onFailure?.(error);}
}
