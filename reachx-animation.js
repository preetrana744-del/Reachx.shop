// Optional visual enhancement. Business interactions initialise independently.
export async function startAnimation(onFailure){
const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

const canvas=document.getElementById('webgl');

const mqCoarse=matchMedia('(pointer:coarse)');
const mqSmall=matchMedia('(max-width:700px)');
const coarseDevice=mqCoarse.matches;
const smallViewport=mqSmall.matches;
const shortSide=Math.min(window.innerWidth,window.innerHeight);
const deviceMemory=navigator.deviceMemory || 4;
const cores=navigator.hardwareConcurrency || 4;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Performance-first tiers. The visual language is retained, but expensive particle
// counts are capped aggressively so phones/tablets do not melt under WebGL + DOM.
const veryLowDevice = coarseDevice && (shortSide<=430 || cores<=4 || deviceMemory<=4);
const lowDevice = coarseDevice || shortSide<900 || cores<=6 || deviceMemory<=4;
const FX_QUALITY = reducedMotion ? .35 : (veryLowDevice ? .30 : (lowDevice ? .52 : .76));
const pixelRatioCap = veryLowDevice ? 1 : (lowDevice ? 1.15 : 1.5);

const webglProbe=document.createElement('canvas');
const webglAvailable=!!(webglProbe.getContext('webgl2')||webglProbe.getContext('webgl'));
if(!webglAvailable){
  canvas.style.display='none';
  document.documentElement.classList.add('no-webgl');
  throw new Error('WebGL is not available');
}

const renderer=new THREE.WebGLRenderer({
  canvas,
  antialias:!(coarseDevice || shortSide<900),
  alpha:true,
  powerPreference:'high-performance'
});

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio || 1,
    pixelRatioCap
  )
);

function viewportSize(){
  const vv=window.visualViewport;
  return {
    width:Math.max(1,Math.round(vv ? vv.width : window.innerWidth)),
    height:Math.max(1,Math.round(vv ? vv.height : window.innerHeight))
  };
}

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xf7f5f0,0.018);
const camera=new THREE.PerspectiveCamera(55,1,.1,180);
camera.position.set(0,0,18);

let lastRenderW=0,lastRenderH=0,resizeRAF=0,resizeTimer=0;
function resizeRenderer(){
  const v=viewportSize();
  if(v.width===lastRenderW && v.height===lastRenderH) return;
  lastRenderW=v.width; lastRenderH=v.height;
  renderer.setSize(v.width,v.height,false);
  camera.aspect=v.width/v.height;
  camera.updateProjectionMatrix();
}
function queueResize(){
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    if(resizeRAF) return;
    resizeRAF=requestAnimationFrame(()=>{
      resizeRAF=0;
      resizeRenderer();
    });
  },100);
}
resizeRenderer();
addEventListener('resize',queueResize,{passive:true});
if(window.visualViewport && !coarseDevice){
  window.visualViewport.addEventListener('resize',queueResize,{passive:true});
}

const root=new THREE.Group(); scene.add(root);
const count=Math.max(coarseDevice?2800:5000,Math.floor(18000*FX_QUALITY*(coarseDevice?.65:1)));
const positions=new Float32Array(count*3);
const seeds=new Float32Array(count);
const colors=new Float32Array(count*3);
const base=new Float32Array(count*3);
const palette=[
  new THREE.Color(0x000000),new THREE.Color(0x000000),
  new THREE.Color(0x000000),new THREE.Color(0x000000),
  new THREE.Color(0x000000),new THREE.Color(0x000000)
];
for(let i=0;i<count;i++){
  const rr=Math.pow(Math.random(),.42)*8.8;
  const a=Math.random()*Math.PI*2;
  const b=Math.acos(THREE.MathUtils.randFloatSpread(2));
  const x=Math.cos(a)*Math.sin(b)*rr;
  const y=Math.cos(b)*rr*.72;
  const z=Math.sin(a)*Math.sin(b)*rr*.78;
  positions[i*3]=base[i*3]=x;
  positions[i*3+1]=base[i*3+1]=y;
  positions[i*3+2]=base[i*3+2]=z;
  seeds[i]=Math.random()*6.283;
  const c=palette[Math.floor(Math.random()*palette.length)];
  colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
}
const geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
geo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const mat=new THREE.PointsMaterial({
  size:.064,vertexColors:true,transparent:true,opacity:.98,blending:THREE.NormalBlending,depthWrite:false
});
const particleField=new THREE.Points(geo,mat);
if(FX_QUALITY<.7){
  mat.opacity=.94;
}
root.add(particleField);

// Keep the particle animation without orbital diagram lines.
const shellGroup=new THREE.Group(); root.add(shellGroup);

// Dedicated kinetic hero logos.
// The silhouettes are sampled directly from the actual Unicode glyphs ⚡ and ∞.
// This keeps their shape intact and contains NO connecting lines.
const brandGroup=new THREE.Group(); scene.add(brandGroup);
const cornerGroup=new THREE.Group(); scene.add(cornerGroup);


const pipelineGroup=
  new THREE.Group();

scene.add(
  pipelineGroup
);

const pipelineColors=[
  0x000000,
  0x000000,
  0x000000
];

function createSpacePipeline(
  start,
  end,
  count,
  seed,
  color
){
  const arr=
    new Float32Array(count*3);
  const flowT=new Float32Array(count);

  const dx=end[0]-start[0];
  const dy=end[1]-start[1];
  const dz=end[2]-start[2];

  for(let i=0;i<count;i++){
    const q=i*3;
    const t=Math.random();
    flowT[i]=t;
    const sideWave=(Math.random()-.5);

    let x=start[0]+dx*t;
    let y=start[1]+dy*t;
    let z=start[2]+dz*t;

    const curve=
      Math.sin(t*Math.PI)*
      sideWave*
      2.5;

    if(Math.abs(dx)>=Math.abs(dy)){
      y+=curve;
      z+=sideWave*2.8;
    }else{
      x+=curve;
      z+=sideWave*2.8;
    }

    arr[q]=x;
    arr[q+1]=y;
    arr[q+2]=z;
  }

  const g=
    new THREE.BufferGeometry();

  g.setAttribute(
    'position',
    new THREE.BufferAttribute(
      arr,
      3
    )
  );

  const m=
    new THREE.PointsMaterial({
      color,
      size:.060,
      transparent:true,
      opacity:.82,
      blending:THREE.NormalBlending,
      depthWrite:false
    });

  const p=
    new THREE.Points(
      g,
      m
    );

  p.userData={
    seed,
    base:arr.slice(),
    flowT,
    start:[...start],
    end:[...end]
  };

  return p;
}

const pipelines=[
  createSpacePipeline(
    [-16, 11, -4],
    [-1.8,  1.2, -2.0],
    Math.floor(520*FX_QUALITY),
    1,
    pipelineColors[0]
  ),

  createSpacePipeline(
    [ 16,  9, -5],
    [  1.8,  1.0, -1.2],
    Math.floor(480*FX_QUALITY),
    2,
    pipelineColors[1]
  ),

  createSpacePipeline(
    [-17, -8, -4],
    [ -1.5, -1.0, -1.0],
    Math.floor(520*FX_QUALITY),
    3,
    pipelineColors[2]
  ),

  createSpacePipeline(
    [ 17,-10, -6],
    [  1.5, -1.0, -1.4],
    Math.floor(500*FX_QUALITY),
    4,
    pipelineColors[0]
  ),

  createSpacePipeline(
    [ -4, 14, -7],
    [  0.0,  1.2, -2.0],
    Math.floor(420*FX_QUALITY),
    5,
    pipelineColors[1]
  ),

  createSpacePipeline(
    [  4,-14, -8],
    [  0.2, -1.2, -2.0],
    Math.floor(420*FX_QUALITY),
    6,
    pipelineColors[2]
  ),

  createSpacePipeline(
    [-14,  3, -6],
    [ -1.0,  0.4, -2.2],
    Math.floor(300*FX_QUALITY),
    7,
    pipelineColors[0]
  ),

  createSpacePipeline(
    [ 14,  2, -7],
    [  1.0,  0.3, -2.1],
    Math.floor(300*FX_QUALITY),
    8,
    pipelineColors[1]
  ),

  createSpacePipeline(
    [-13, -3, -7],
    [ -1.0, -0.4, -2.0],
    Math.floor(300*FX_QUALITY),
    9,
    pipelineColors[2]
  ),

  createSpacePipeline(
    [ 13, -4, -6],
    [  1.0, -0.5, -2.2],
    Math.floor(300*FX_QUALITY),
    10,
    pipelineColors[0]
  )
];

pipelines.forEach(
  p=>pipelineGroup.add(p)
);
function makeCornerField(cx,cy,cz,seed){
  const n=Math.max(420,Math.floor(1800*FX_QUALITY)), arr=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const q=i*3;
    const rx=(Math.random()-.5)*11.5;
    const ry=(Math.random()-.5)*8.2;
    const spread=.55+.9*Math.random();
    arr[q]=cx+rx*spread;
    arr[q+1]=cy+ry*spread;
    arr[q+2]=cz+(Math.random()-.5)*9;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const m=new THREE.PointsMaterial({
    color:[0x000000,0x000000,0x000000,0x000000][seed%4],
    size:.048,transparent:true,opacity:.64,
    blending:THREE.NormalBlending,depthWrite:false
  });
  const p=new THREE.Points(g,m);
  p.userData={seed};
  return p;
}
const cornerFields=[
  makeCornerField(-10.5,7.0,-2,1),
  makeCornerField(10.5,7.0,-4,2),
  makeCornerField(-10.5,-7.0,-3,3),
  makeCornerField(10.5,-7.0,-5,4)
];
cornerFields.forEach(p=>cornerGroup.add(p));


function glyphPoints(glyph, fontFamily, fontWeight, fontSize, count, widthScale=1){
  const size=420;
  const c=document.createElement('canvas');
  c.width=size; c.height=size;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.clearRect(0,0,size,size);
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font=`${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle='#fff';
  ctx.fillText(glyph,size/2,size/2+8);

  const img=ctx.getImageData(0,0,size,size).data;
  const candidates=[];
  for(let y=0;y<size;y+=2){
    for(let x=0;x<size;x+=2){
      const a=img[(y*size+x)*4+3];
      if(a>40) candidates.push([x,y,a/255]);
    }
  }
  if(!candidates.length) throw new Error(`Could not rasterize glyph ${glyph}`);

  const pts=[];
  // Edge-preserving dense fill: random opaque pixels + a fraction near edges,
  // so the symbol reads as a solid heavy kinetic form rather than an outline.
  for(let i=0;i<count;i++){
    const p=candidates[(Math.random()*candidates.length)|0];
    const jx=(Math.random()-.5)*1.7, jy=(Math.random()-.5)*1.7;
    const x=((p[0]-size/2)/(size/2))*widthScale + jx/size;
    const y=((size/2-p[1])/(size/2))*widthScale + jy/size;
    pts.push([x,y,(Math.random()-.5)*.13]);
  }
  return pts;
}

function makeParticleShape(points, size, color, opacity){
  const g=new THREE.BufferGeometry();
  const a=new Float32Array(points.length*3);
  for(let i=0;i<points.length;i++){
    a[i*3]=points[i][0];
    a[i*3+1]=points[i][1];
    a[i*3+2]=points[i][2];
  }
  g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const m=new THREE.PointsMaterial({
    color,size,transparent:true,opacity,
    blending:THREE.NormalBlending,depthWrite:false
  });
  return new THREE.Points(g,m);
}

const FLASH_FONT = `"Arial","Helvetica","Segoe UI Symbol","DejaVu Sans",sans-serif`;
const INFINITY_FONT = `"Arial Black","Arial","Helvetica","DejaVu Sans",sans-serif`;

const flashCloud = glyphPoints('⚡', FLASH_FONT, 900, 292, Math.floor(3600*FX_QUALITY), 2.55);
const infinityCloud = glyphPoints('∞', INFINITY_FONT, 900, 300, Math.floor(3800*FX_QUALITY), 2.95);

const bolt=makeParticleShape(flashCloud,.034,0x000000,.92);
const infinity=makeParticleShape(infinityCloud,.032,0x000000,.92);

bolt.position.set(0,0,-1.2);
infinity.position.set(0,0,-1.4);
infinity.visible=false;

const boltGlow=makeParticleShape(
  glyphPoints('⚡', FLASH_FONT, 900, 292, 900, 2.58),
  .078,0x000000,.26
);
const infinityGlow=makeParticleShape(
  glyphPoints('∞', INFINITY_FONT, 900, 300, 950, 2.98),
  .072,0x000000,.24
);

boltGlow.position.copy(bolt.position);
infinityGlow.position.copy(infinity.position);
infinityGlow.visible=false;

brandGroup.add(bolt,infinity,boltGlow,infinityGlow);

const boltBase=bolt.geometry.attributes.position.array.slice();
const boltGlowBase=boltGlow.geometry.attributes.position.array.slice();

let scrollP=0,targetScroll=0,mouseX=0,mouseY=0,targetMX=0,targetMY=0,prevScroll=0,scrollVelocity=0;
const logoLabel=document.getElementById('kineticLogoLabel');
let frameSkip = veryLowDevice ? 2 : (lowDevice ? 1 : 0);
let frameCounter = 0;
let perfLast = performance.now();
let dynamicLowMode = lowDevice || veryLowDevice;

const followBackgroundPointer=e=>{
  
  targetMX=(e.clientX/window.innerWidth-.5)*1.1;
  targetMY=(e.clientY/window.innerHeight-.5)*.75;
};
addEventListener('pointermove',followBackgroundPointer,{passive:true});
addEventListener('touchmove',e=>{if(e.touches&&e.touches.length===1)followBackgroundPointer(e.touches[0])},{passive:true});
let scrollFramePending=false;
addEventListener('scroll',()=>{
  if(scrollFramePending) return;
  scrollFramePending=true;
  requestAnimationFrame(()=>{
    targetScroll=
      scrollY/
      Math.max(
        1,
        document.body.scrollHeight-
        window.innerHeight
      );
    scrollFramePending=false;
  });
},{passive:true});

let pageHidden=document.hidden;
document.addEventListener('visibilitychange',()=>{
  pageHidden=document.hidden;
});
let animationFrame = 0,lastRenderedAt=0;
const minimumFrameMs=coarseDevice?1000/30:1000/60;
let animationStopped = false;
function stopAnimation(error){
  if(animationStopped) return;
  animationStopped = true;
  cancelAnimationFrame(animationFrame);
  renderer.dispose();
  onFailure(error);
}
canvas.addEventListener('webglcontextlost', event=>{
  event.preventDefault();
  stopAnimation(new Error('WebGL context lost'));
});
function animate(t){
  if(animationStopped) return;
  animationFrame = requestAnimationFrame(nextTime=>{
    try { animate(nextTime); } catch(error) { stopAnimation(error); }
  });
  if(pageHidden) return;
  if(lastRenderedAt&&t-lastRenderedAt<minimumFrameMs-1)return;
  lastRenderedAt=t;

  frameCounter++;
  // Adapt to real device performance. We do not change layout or the visual system;
  // we only reduce expensive simulation updates when FPS drops.
  if(t-perfLast>1200){
    const fps=frameCounter*1000/(t-perfLast);
    if(!veryLowDevice){
      dynamicLowMode=fps<52 || lowDevice;
      frameSkip=fps<42 ? 2 : (lowDevice ? 1 : 0);
    }else{
      dynamicLowMode=true;
      frameSkip=2;
    }
    frameCounter=0;
    perfLast=t;
  }

  scrollP+= (targetScroll-scrollP)*.05;
  mouseX+=(targetMX-mouseX)*.05; mouseY+=(targetMY-mouseY)*.05;
  const rawVelocity=targetScroll-prevScroll;
  scrollVelocity += (rawVelocity-scrollVelocity)*(coarseDevice ? .06 : .16);
  const velocity=coarseDevice ? 0 : THREE.MathUtils.clamp(scrollVelocity,-.0045,.0045);
  prevScroll=targetScroll;

  const arr=geo.attributes.position.array;
  const updateField = !dynamicLowMode || (frameCounter % (frameSkip+1)===0);
  if(updateField){
    for(let i=0;i<count;i++){
      const k=i*3, s=seeds[i], bx=base[k], by=base[k+1], bz=base[k+2];
      const radial=Math.sqrt(bx*bx+by*by)+.001;
      const wave=Math.sin(radial*2.3 - scrollP*22 + s + t*.0008)*.15;
      const swirl=t*.00012 + scrollP*.9;
      arr[k]=bx*Math.cos(swirl)-by*Math.sin(swirl) + Math.cos(s+t*.0007)*wave + velocity*18*Math.sin(s*3);
      arr[k+1]=bx*Math.sin(swirl)+by*Math.cos(swirl) + Math.sin(s+t*.0006)*wave;
      arr[k+2]=bz + Math.sin(radial*1.5-scrollP*18+s)*.18 + velocity*22*Math.cos(s*2);
    }
    geo.attributes.position.needsUpdate=true;
  }

  root.rotation.y += (mouseX*.35-root.rotation.y)*.025;
  root.rotation.x += (mouseY*.22-root.rotation.x)*.025;
  root.position.y += ((scrollP-.5)*1.8-root.position.y)*.03;
  camera.position.z += ((17-scrollP*4.6)-camera.position.z)*.03;
  camera.position.x += (mouseX*1.3-camera.position.x)*.02;

  const morph=scrollP*Math.PI*2;
  

const streamTime=t*.00030+scrollP*2.25;

// Restore the original multi-direction kinetic particle flow: particles visibly
// ripple and float through the pipelines entering from top, bottom, left, right
// and the diagonal directions. Performance-tier frame skipping remains active.
if(updateField){
  for(const p of pipelines){
    const pos=p.geometry.attributes.position.array;
    const base=p.userData.base;
    const flowT=p.userData.flowT;
    const seed=p.userData.seed;
    const sx=p.userData.start[0], sy=p.userData.start[1], sz=p.userData.start[2];
    const ex=p.userData.end[0], ey=p.userData.end[1], ez=p.userData.end[2];

    for(let i=0;i<flowT.length;i++) {
      const q=i*3;
      const travel=(flowT[i] + streamTime*(.055 + (i%7)*.0012)) % 1;
      const edgeFade=Math.sin(travel*Math.PI);
      const phase=streamTime+seed+i*.00175;
      const flow=Math.sin(phase)*.18+Math.cos(phase*.63)*.11;

      const bx=sx+(ex-sx)*travel;
      const by=sy+(ey-sy)*travel;
      const bz=sz+(ez-sz)*travel;

      pos[q]=bx + (base[q]-(sx+(ex-sx)*flowT[i])) + Math.cos(phase*1.45)*flow*edgeFade;
      pos[q+1]=by + (base[q+1]-(sy+(ey-sy)*flowT[i])) + Math.sin(phase*1.25)*flow*edgeFade;
      pos[q+2]=bz + (base[q+2]-(sz+(ez-sz)*flowT[i])) + Math.cos(phase*.84)*.22*edgeFade;
    }

    p.geometry.attributes.position.needsUpdate=true;
    p.material.opacity=.70+.20*(.5+.5*Math.sin(t*.001+seed))
      +Math.min(.10,Math.abs(velocity)*1.6);
  }
}

pipelineGroup.rotation.y += (mouseX*.025-pipelineGroup.rotation.y)*.018;
pipelineGroup.rotation.x += (mouseY*.018-pipelineGroup.rotation.x)*.018;

const logoPhase=scrollP;

  // Clean 5-page logo sequence:
  // Page 1 -> 2: centered Flash grows.
  // Page 2 -> 3: centered Flash dissolves into particles.
  // Page 3 -> 5: centered Infinity reforms and grows.
  const flashGrow = THREE.MathUtils.clamp(logoPhase/0.36,0,1);
  const destroy = THREE.MathUtils.clamp((logoPhase-0.32)/0.18,0,1);
  const infinityForm = THREE.MathUtils.clamp((logoPhase-0.45)/0.22,0,1);

  const easeOut = t => 1-Math.pow(1-t,3);
  const easeInOut = t => t*t*(3-2*t);

  const fg = easeOut(flashGrow);
  const ds = easeInOut(destroy);
  const inf = easeOut(infinityForm);

  bolt.visible = fg > .005 || ds < 1;
  boltGlow.visible = bolt.visible;
  infinity.visible = inf > .005;
  infinityGlow.visible = inf > .005;

  // Keep the Flash tucked directly beneath the large X during the opening Flash phase,
  // while Infinity returns to the centered position for the later phases.
  if(logoPhase < 0.45){
    brandGroup.position.set(0,-1.55,-1.4);
  }else{
    brandGroup.position.set(0,0,-1.4);
  }
  brandGroup.rotation.set(0,0,0);

  // Flash stays small at the opening state and grows smoothly through the Flash phase.
  const flashScale = .34 + 1.62*fg;
  bolt.scale.setScalar(flashScale);
  boltGlow.scale.setScalar(flashScale*1.01);
  bolt.material.opacity = (.35 + .92*fg) * (1-ds);
  boltGlow.material.opacity = (.14 + .46*fg) * (1-ds);

  // Infinity stays normal and centered while forming.
  const infinityScale = .25 + 1.68*inf;
  infinity.scale.setScalar(infinityScale);
  infinityGlow.scale.setScalar(infinityScale*1.01);
  infinity.material.opacity = .28 + .94*inf;
  infinityGlow.material.opacity = .12 + .44*inf;

  // Keep the actual logo shapes still; only the individual particles disperse.
  const bPos = bolt.geometry.attributes.position.array;
  const bGlow = boltGlow.geometry.attributes.position.array;

  for(let i=0;i<bPos.length;i+=3){
    const ox=boltBase[i], oy=boltBase[i+1], oz=boltBase[i+2];
    const ang=Math.atan2(oy,ox) + Math.sin(i*.018)*.22;
    const radial=Math.sqrt(ox*ox+oy*oy)+.08;
    const burst=ds*(1.45 + 1.25*Math.abs(Math.sin(i*.012)));
    bPos[i]   = ox + Math.cos(ang)*(burst*radial);
    bPos[i+1] = oy + Math.sin(ang)*(burst*radial);
    bPos[i+2] = oz + Math.sin(i*.006)*ds*.65;
  }

  for(let i=0;i<bGlow.length;i+=3){
    const ox=boltGlowBase[i], oy=boltGlowBase[i+1], oz=boltGlowBase[i+2];
    const ang=Math.atan2(oy,ox) + Math.cos(i*.015)*.24;
    const radial=Math.sqrt(ox*ox+oy*oy)+.10;
    const burst=ds*(1.8 + 1.6*Math.abs(Math.cos(i*.011)));
    bGlow[i]   = ox + Math.cos(ang)*(burst*radial);
    bGlow[i+1] = oy + Math.sin(ang)*(burst*radial);
    bGlow[i+2] = oz + Math.cos(i*.007)*ds*.8;
  }

  bolt.geometry.attributes.position.needsUpdate=true;
  boltGlow.geometry.attributes.position.needsUpdate=true;

  // Calm particle motion: no logo rotation or sideways travel.
  bolt.material.size=.038+.012*fg+.025*ds;
  boltGlow.material.size=.075+.028*fg+.052*ds;
  infinity.material.size=.036+.014*inf;
  infinityGlow.material.size=.074+.028*inf;

  shellGroup.rotation.x += .0002 + velocity*3; shellGroup.rotation.y -= .0003 + velocity*2;
for(const p of cornerFields){
  const s=p.userData.seed;
  p.rotation.z += .00018*(s%2?1:-1) + velocity*(s%2?2:-2);
  p.rotation.x = Math.sin(t*.00035+s)*.09 + mouseY*.035;
  p.rotation.y = Math.cos(t*.00031+s)*.09 + mouseX*.035;
  p.position.z = Math.sin(t*.00025+s)*.45 + Math.sin(scrollP*6+s)*.7;
  p.material.opacity = .55 + .20*(.5+.5*Math.sin(t*.001+s))
                     + Math.min(.12,Math.abs(velocity)*1.8);
}
cornerGroup.rotation.y += (mouseX*.08-cornerGroup.rotation.y)*.018;
cornerGroup.rotation.x += (mouseY*.06-cornerGroup.rotation.x)*.018;

  mat.size=.03 + Math.min(.02,Math.abs(velocity)*.25);

  logoLabel.textContent=logoPhase<.45?'FLASH':'∞  INFINITY';
  logoLabel.style.opacity=(logoPhase<.8?0.18:0.08);
  renderer.render(scene,camera);
}
if(reducedMotion){ dynamicLowMode=true; frameSkip=2; }
animate(0);


}

