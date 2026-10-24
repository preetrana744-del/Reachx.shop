(()=>{
 const root=document.getElementById('reachx-collaborate');if(!root)return;
 const stage=root.querySelector('.rx-collaborate__stage'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),button=root.querySelector('.rx-collaborate__button');if(!ctx)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const N=24,M=30,chains=Array.from({length:N},(_,i)=>({phase:i*2.399,points:Array.from({length:M},()=>({x:0,y:0,vx:0,vy:0})),path:[]}));
 let w=700,h=440,dpr=1,ready=false,px=110,py=112,vx=0,vy=0,tx=110,ty=112,active=false,dragging=false,living=!reduce,clock=0,last=0,raf=0,inView=true,demoAt=-1,press=0,pulse=0,meshMotion=0,stableAngle=.8;
 function size(){w=stage.clientWidth;h=stage.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ready=false;wake()}
 function smooth(points){if(!points.length)return;ctx.moveTo(points[0].x,points[0].y);for(let j=1;j<points.length-1;j++)ctx.quadraticCurveTo(points[j].x,points[j].y,(points[j].x+points[j+1].x)/2,(points[j].y+points[j+1].y)/2);ctx.lineTo(points.at(-1).x,points.at(-1).y)}
 function paint(){meshMotion=0;
  ctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,half=button.offsetWidth/2,rad=32,dist=Math.hypot(px,py),angle=dist>3?(stableAngle=Math.atan2(py,px)):stableAngle,nx=-Math.sin(angle),ny=Math.cos(angle),energy=Math.min(Math.hypot(vx,vy)/12,1);
  ctx.save();
  for(let i=0;i<N;i++){
   const c=chains[i],u=(i-(N-1)/2)/((N-1)/2),a=angle+u*1.18+Math.sin(i*2.3)*.085;
   const ax=cx+Math.cos(a)*(half+4),ay=cy+Math.sin(a)*(rad+3);
   const ex=cx+px+nx*u*2,ey=cy+py+ny*u*2;
   const dx=ex-ax,dy=ey-ay,len=Math.hypot(dx,dy),perpX=-dy/Math.max(len,1),perpY=dx/Math.max(len,1);
   const p=c.points;
   for(let j=0;j<M;j++){
    const t=j/(M-1),envelope=Math.pow(Math.sin(Math.PI*t),.85),wave=Math.sin(t*8-clock*(1.2+i*.037)+c.phase),wave2=Math.sin(t*17+clock*(1.8+i*.019)+c.phase*.7);
    const spread=(u*(34+dist*.18)+Math.sin(i*1.7)*14)*Math.sin(Math.PI*t)*(1-t);
    const wriggle=living?(wave*(7+energy*8)+wave2*2.5)*envelope:0;
    const qx=ax+dx*t+perpX*(spread+wriggle),qy=ay+dy*t+perpY*(spread+wriggle);
    if(!ready||reduce){p[j].x=qx;p[j].y=qy;p[j].vx=p[j].vy=0}
    else if(j===0||j===M-1){p[j].x=qx;p[j].y=qy;p[j].vx=p[j].vy=0}
    else{const spring=.105+(i%5)*.006;p[j].vx=(p[j].vx+(qx-p[j].x)*spring)*.66;p[j].vy=(p[j].vy+(qy-p[j].y)*spring)*.66;p[j].x+=p[j].vx;p[j].y+=p[j].vy}
   }
   // Neighbor coupling makes the liquid bend continuously rather than as a rigid fan.
   for(let pass=0;pass<2;pass++)for(let j=1;j<M-1;j++){p[j].x+=(p[j-1].x+p[j+1].x-2*p[j].x)*.12;p[j].y+=(p[j-1].y+p[j+1].y-2*p[j].y)*.12}
   const left=[],right=[],shine=[];
   for(let j=0;j<M;j++){
    const t=j/(M-1),prev=p[Math.max(j-1,0)],next=p[Math.min(j+1,M-1)],dx1=next.x-prev.x,dy1=next.y-prev.y,l=Math.max(Math.hypot(dx1,dy1),.01),nnx=-dy1/l,nny=dx1/l;
    const travel=living?Math.pow(Math.max(0,Math.sin(t*11-clock*2.1+c.phase)),12):0;
    const core=i%6===0;const thickness=(core?2.2: .42)+Math.pow(1-t,2.4)*(core?10:3.7)+travel*(core?4.5:1.1)*Math.sin(Math.PI*t);const width=thickness*(1+press*.5);
    const side=i%2?1:-1;
    const spineNode=7+(i*5)%13;
    const delta=j-spineNode;
    // The barb is part of this strand's silhouette: a broad meniscus, narrow neck,
    // swept tip, then a concave return. No separate triangle is overlaid.
    const growth=(i%3===0&&delta>=-2&&delta<=2)?[.08,.36,1,.20,.02][delta+2]:0;
    const spineLength=(7+(i%4)*1.6)*(1+(living?Math.sin(clock*.65+i)*.08:0));
    const extension=growth*spineLength;
    const tangentX=dx1/l,tangentY=dy1/l;
    const sweep=extension*.68;
    let lx=p[j].x+nnx*width,ly=p[j].y+nny*width,rx=p[j].x-nnx*width,ry=p[j].y-nny*width;
    if(side>0){lx+=nnx*extension-tangentX*sweep;ly+=nny*extension-tangentY*sweep}
    else{rx-=nnx*extension+tangentX*sweep;ry-=nny*extension+tangentY*sweep}
    left.push({x:lx,y:ly});right.push({x:rx,y:ry});
    if(growth===1){if(side>0)left.push({x:lx,y:ly});else right.push({x:rx,y:ry})}
    shine.push({x:p[j].x+nnx*(width*.45+(side>0?extension*.62:0))-tangentX*sweep*.62,y:p[j].y+nny*(width*.45+(side>0?extension*.62:0))-tangentY*sweep*.62});
   }
   if(c.path.length)for(let j=0;j<M;j++)meshMotion=Math.max(meshMotion,Math.hypot(p[j].x-c.path[j].x,p[j].y-c.path[j].y));c.path=p.map(q=>({x:q.x,y:q.y}));
   ctx.beginPath();smooth(left);const rev=right.reverse();ctx.lineTo(rev[0].x,rev[0].y);for(let j=1;j<rev.length-1;j++)ctx.quadraticCurveTo(rev[j].x,rev[j].y,(rev[j].x+rev[j+1].x)/2,(rev[j].y+rev[j+1].y)/2);ctx.lineTo(rev.at(-1).x,rev.at(-1).y);ctx.closePath();
   const grad=ctx.createLinearGradient(ax-12,ay-15,ex+8,ey+15);grad.addColorStop(0,'#080b12');grad.addColorStop(.28,'#30343b');grad.addColorStop(.48,'#101720');grad.addColorStop(.7,'#454b52');grad.addColorStop(1,'#080d15');ctx.fillStyle=grad;ctx.shadowColor='#0a10251c';ctx.shadowBlur=3;ctx.shadowOffsetY=4;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
   ctx.beginPath();smooth(shine);ctx.strokeStyle=i%3===0?'#d3d9de80':'#abb5bc38';ctx.lineWidth=i%3===0?.65:.35;ctx.stroke();
  }
  // Inter-strand membranes join and separate as adjacent tendrils pass.
  for(let i=0;i<N-2;i+=3){
   const j=7+(i*7)%12,a=chains[i].points[j],b=chains[i+2].points[j+2];
   const gap=Math.hypot(b.x-a.x,b.y-a.y),bond=living?.5+.5*Math.sin(clock*.9+i*1.6):.5;
   if(gap<60&&gap>3&&bond>.16){
    const mx=(a.x+b.x)/2+Math.sin(clock+i)*5,my=(a.y+b.y)/2;
    ctx.beginPath();ctx.moveTo(a.x-2,a.y);ctx.quadraticCurveTo(mx,my-5*bond,b.x+1,b.y);ctx.quadraticCurveTo(mx,my+2*bond,a.x+2,a.y);ctx.closePath();ctx.fillStyle='#10151dde';ctx.fill();
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my-2*bond,b.x,b.y);ctx.strokeStyle='#9aa4ad38';ctx.lineWidth=.5;ctx.stroke();
   }
  }
  // Short roots around the entire perimeter flow into the same cursor endpoint.
  // The tiny outward meniscus remains visible before the filament turns inward.
  for(let i=0;i<16;i++){
   const a=i/16*Math.PI*2+.12,ox=Math.cos(a),oy=Math.sin(a),sx=-oy,sy=ox;
   const baseX=cx+ox*(half+7),baseY=cy+oy*36;
   const tiny=6+(living?Math.sin(clock*.8+i*1.9)*1.2:0);
   const neckX=baseX+ox*tiny,neckY=baseY+oy*tiny;
   const ex=cx+px+nx*((i%3)-1)*1.2,ey=cy+py+ny*((i%3)-1)*1.2;
   const wave=living?Math.sin(clock*1.1+i*1.7)*4:0;
   const c1x=neckX+ox*8+sx*wave,c1y=neckY+oy*8+sy*wave;
   const c2x=ex-(ex-neckX)*.26+sx*wave,c2y=ey-(ey-neckY)*.26+sy*wave;
   const points=[],left=[],right=[],highlight=[];
   const rootWidth=i%4===0?10.5:4.8;
   // Use the same broad root, travelling bulge and tapered end as the original strands.
   for(let j=0;j<30;j++){
    const t=j/29,v=1-t;
    const x=v*v*v*neckX+3*v*v*t*c1x+3*v*t*t*c2x+t*t*t*ex;
    const y=v*v*v*neckY+3*v*v*t*c1y+3*v*t*t*c2y+t*t*t*ey;
    points.push({x,y});
   }
   for(let j=0;j<points.length;j++){
    const t=j/29,prev=points[Math.max(0,j-1)],next=points[Math.min(29,j+1)];
    const dx=next.x-prev.x,dy=next.y-prev.y,l=Math.max(Math.hypot(dx,dy),.01),nnx=-dy/l,nny=dx/l;
    const travel=living?Math.pow(Math.max(0,Math.sin(t*11-clock*2.1+i*2.399)),12):0;
    const width=(.48+Math.pow(1-t,2.4)*rootWidth+travel*(i%4===0?4.5:1.1)*Math.sin(Math.PI*t))*(1+press*.5);
    left.push({x:points[j].x+nnx*width,y:points[j].y+nny*width});
    right.push({x:points[j].x-nnx*width,y:points[j].y-nny*width});
    highlight.push({x:points[j].x+nnx*width*.45,y:points[j].y+nny*width*.45});
   }
   ctx.beginPath();ctx.moveTo(baseX+sx*rootWidth,baseY+sy*rootWidth);ctx.lineTo(left[0].x,left[0].y);
   for(let j=0;j<left.length-1;j++)ctx.quadraticCurveTo(left[j].x,left[j].y,(left[j].x+left[j+1].x)/2,(left[j].y+left[j+1].y)/2);
   ctx.lineTo(ex,ey);right.reverse();for(let j=0;j<right.length-1;j++)ctx.quadraticCurveTo(right[j].x,right[j].y,(right[j].x+right[j+1].x)/2,(right[j].y+right[j+1].y)/2);
   ctx.lineTo(baseX-sx*rootWidth,baseY-sy*rootWidth);ctx.closePath();
   const filament=ctx.createLinearGradient(baseX-12,baseY-15,ex+8,ey+15);filament.addColorStop(0,'#080b12');filament.addColorStop(.28,'#30343b');filament.addColorStop(.48,'#101720');filament.addColorStop(.7,'#454b52');filament.addColorStop(1,'#080d15');ctx.fillStyle=filament;ctx.fill();
   ctx.beginPath();smooth(highlight);ctx.strokeStyle=i%3===0?'#d3d9de80':'#abb5bc38';ctx.lineWidth=i%3===0?.65:.35;ctx.stroke();
  }

  ready=true;
  // Living meniscus around the pill hides individual roots inside one continuous body.
  ctx.beginPath();for(let k=0;k<=120;k++){const a=k/120*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),rr=34+(living?Math.sin(a*5-clock*1.5)*1.3+Math.sin(a*9+clock*.9)*.55:0);const x=cx+ca*(half-26)+ca*rr,y=cy+sa*rr;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();
  const body=ctx.createLinearGradient(cx,cy-38,cx,cy+40);body.addColorStop(0,'#768294');body.addColorStop(.12,'#303949');body.addColorStop(.32,'#0b1019');body.addColorStop(.75,'#080b11');body.addColorStop(1,'#354051');ctx.fillStyle=body;ctx.shadowColor='#11172d30';ctx.shadowBlur=17;ctx.shadowOffsetY=9;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // A small liquid collar binds the tips, with the familiar hand cursor above it.
  ctx.save();ctx.translate(cx+px,cy+py);ctx.rotate(angle);ctx.beginPath();ctx.ellipse(-4,0,11,3.8+Math.sin(clock*2)*.4,0,0,Math.PI*2);ctx.fillStyle='#141d29';ctx.fill();ctx.restore();
  if(active){
  ctx.save();ctx.translate(cx+px,cy+py);ctx.rotate(-.18);ctx.beginPath();ctx.moveTo(-4,10);ctx.lineTo(-10,0);ctx.quadraticCurveTo(-12,-5,-8,-5);ctx.lineTo(-3,0);ctx.lineTo(-3,-14);ctx.quadraticCurveTo(0,-19,3,-14);ctx.lineTo(3,-5);ctx.quadraticCurveTo(7,-9,9,-4);ctx.quadraticCurveTo(14,-7,15,0);ctx.quadraticCurveTo(19,-1,18,5);ctx.lineTo(13,17);ctx.lineTo(0,17);ctx.closePath();ctx.fillStyle='#fafbf9';ctx.fill();ctx.strokeStyle='#1b2430';ctx.lineWidth=1.7;ctx.stroke();ctx.restore();
  }
  ctx.restore();
  button.style.transform=`perspective(650px) translate(${px*.025}px,${py*.025}px) rotateX(${-py*.018}deg) rotateY(${px*.018}deg) scale(${1-press*.055})`;
  button.style.background=`radial-gradient(ellipse at ${38+px*.12}% ${12+py*.07}%,#4c586a 0%,#202936 23%,#080c14 63%,#151e2a 100%)`;
 }
 function tick(t){raf=0;if(document.hidden||!inView){last=0;return}const dt=Math.min((t-last)/16.67||1,2);last=t;if(living)clock+=dt/60;

  let xx=tx,yy=ty;if(!active&&living){xx=Math.min(w*.26,150)*Math.sin(clock*.44+.7);yy=42+Math.sin(clock*.72)*18}
  yy=Math.max(-h/2+22,Math.min(h/2-22,yy));const cap=Math.min(w*.44,320),len=Math.hypot(xx,yy);if(len>cap){xx*=cap/len;yy*=cap/len}
  const follow=1-Math.exp(-dt*.24);const oldX=px,oldY=py;px+=(xx-px)*follow;py+=(yy-py)*follow;vx=(px-oldX)*.35;vy=(py-oldY)*.35;px+=vx*.12;py+=vy*.12;press*=Math.pow(.89,dt);paint();
  const unsettled=meshMotion>.03;if(living||demoAt>=0||Math.hypot(xx-px,yy-py)+Math.hypot(vx,vy)>.08||unsettled||press>.001)wake();else last=0;
 }
 function wake(){if(!raf&&!document.hidden&&inView)raf=requestAnimationFrame(tick)}

 function pointer(e){if(e.pointerType==='touch'||reduce)return;const r=stage.getBoundingClientRect(),x=e.clientX-r.left-w/2,y=e.clientY-r.top-h/2;
  if(Math.abs(x)>w/2+100||Math.abs(y)>h/2+80){active=false;tx=ty=0;return}tx=x;ty=y;active=true;wake();
 }
 window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('blur',()=>{active=false;tx=ty=0},{passive:true});
 document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)wake()});
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){last=0;wake()}},{rootMargin:'80px'}).observe(root)}
 new ResizeObserver(size).observe(stage);size();
})();
