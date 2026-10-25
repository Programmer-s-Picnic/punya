/* Punya Yatra: river-facing imagery presentation.
 * Location photographs are not asserted to be photographed FROM the river unless
 * their original source states that viewpoint. General panorama is clearly labelled.
 * This is a photographic sightseeing sequence, NOT photogrammetry/continuous video.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const GENERIC={
 url:'https://commons.wikimedia.org/wiki/Special:FilePath/Varanasi_ghats_seen_from_a_boat_on_the_Ganges_river_in_October_2014.jpg?width=1280',
 source:'https://commons.wikimedia.org/wiki/File:Varanasi_ghats_seen_from_a_boat_on_the_Ganges_river_in_October_2014.jpg',
 credit:'Rickard Törnblad · CC BY-SA 4.0',
 note:'Real photograph from a Ganga boat (2014) · GENERAL GHAT VIEW, not this exact stop',
 general:true
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function create(places){
 const root=$('riverView'),water=$('riverWater'),imgs=[$('riverPhotoA'),$('riverPhotoB')];
 let active=false,slot=0,currentStop=-1,elapsed=0,requestKey=0,photo=null,lastW=0,lastH=0;
 let lookOffset=0,dragPointer=null,dragStart=0,dragBase=0;
 // Only photos with a reviewed ghat subject enter the location-specific layer.
 function sourceFor(i){
  const stop=places[clamp(i,0,places.length-1)];
  const p=(stop.photos||[]).find(p=>p.url&&p.verifiedSubject===true);
  if(!p)return {...GENERIC};
  return {
   url:p.url,source:p.source||GENERIC.source,
   credit:(p.credit||'Photographer credited on source')+' · '+(p.license||'See original file'),
   note:'Photograph of '+stop.name+' · original viewpoint may not be from the river',
   general:false
  };
 }
 function activatePhoto(index){
  if(!active)return;
  const ix=clamp(index,0,places.length-1);
  if(currentStop===ix)return;
  currentStop=ix;
  const p=sourceFor(ix);photo=p;
  const label=places[ix].name;
  $('riverViewName').textContent=p.general?(ix===0?'South of Varanasi · Ganga approach':ix>=places.length-2?'Northern riverfront · Adi Keshav vicinity':label):label;
  $('riverPhotoNote').textContent=p.note;
  $('riverPhotoSource').href=p.source;
  $('riverPhotoSource').textContent=p.credit;
  imgs.forEach(img=>{img.alt='';img.setAttribute('aria-hidden','true')});
  const inactive=1-slot,next=imgs[inactive],other=imgs[slot];
  const nonce=++requestKey;
  next.onload=()=>{
   if(nonce!==requestKey||!active)return;
   $('riverPhotoUnavailable').hidden=true;
   next.classList.add('visible');other.classList.remove('visible');
   slot=inactive;
  };
  next.onerror=()=>{
   if(nonce!==requestKey||!active)return;
   if(!p.general){
    // Image may be offline or commons CDN blocked; transparent labelled panoramic fallback.
    photo={...GENERIC};$('riverPhotoNote').textContent=GENERIC.note;
    $('riverPhotoSource').href=GENERIC.source;
    $('riverPhotoSource').textContent=GENERIC.credit;
    next.src=GENERIC.url;next.onerror=()=>{
      if(nonce!==requestKey||!active)return;
      $('riverPhotoUnavailable').hidden=false;
      next.classList.remove('visible');
      other.classList.remove('visible');
    };
  }else{
    $('riverPhotoUnavailable').hidden=false;
    next.classList.remove('visible');
    other.classList.remove('visible');
  }
  };
  if(other.src===p.url&&other.complete&&other.naturalWidth>0){
    // Existing visible image already represents desired view.
    currentStop=ix;photo=p;next.onload=null;next.onerror=null;return;
  }
  next.src=p.url;
  setTimeout(()=>{
    if(nonce===requestKey&&active&&!next.complete){
      $('riverPhotoUnavailable').hidden=false;
      $('riverPhotoUnavailable').textContent='Photograph is slow to load. You can continue your journey or open the gallery.';
    }
  },9500);
  const anticipated=places[ix+1] && sourceFor(ix+1).url;
  if(anticipated&&anticipated!==p.url&&typeof Image!=='undefined'){
    // Decode ahead without retaining an oversized gallery cache.
    const preload=new Image();preload.decoding='async';preload.src=anticipated;
  }
 }
 function drawWater(now,playing,speed){
  if(!active)return;
  const bound=water.getBoundingClientRect();
  if(!bound.width||!bound.height)return;
  const ratio=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(bound.width*ratio)),h=Math.max(1,Math.round(bound.height*ratio));
  if(w!==lastW||h!==lastH){water.width=w;water.height=h;lastW=w;lastH=h}
  const ctx=water.getContext('2d');if(!ctx)return;
  const ms=(now||0)/1000,velocity=playing?(speed||1):.2;
  elapsed+=velocity*.095;
  ctx.clearRect(0,0,w,h);
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'rgba(40,121,146,0.04)');
  grad.addColorStop(.28,'rgba(29,104,132,.41)');
  grad.addColorStop(1,'rgba(4,45,73,.89)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(let row=0;row<48;row++){
   const depth=(row+1)/49;
   const y=h*(.14+depth*.88);
   const amplitude=(1+depth*3.9)*ratio;
   const stripeWidth=w*(.03+depth*.33);
   for(let j=0;j<7;j++){
    const phase=j*2.31+row*.73+elapsed*1.1;
    const x=(((j/6+.11*Math.sin(phase))*w+elapsed*(6+depth*14)*Math.sin(j+1)*ratio)% (w+stripeWidth))-stripeWidth*.3;
    ctx.beginPath();
    ctx.moveTo(x,y);ctx.quadraticCurveTo(x+stripeWidth*.55,y+Math.sin(phase)*amplitude,x+stripeWidth,y);
    ctx.strokeStyle=(j+row)%3===0?'rgba(248,222,176,'+(.045+depth*.13)+')':'rgba(176,226,233,'+(.045+depth*.16)+')';
    ctx.lineWidth=(.3+depth*1.5)*ratio;ctx.stroke();
   }
  }
  // Two diverging wakes from the camera boat. Strictly cinematic.
  ctx.lineCap='round';
  for(const sign of [-1,1]){
   ctx.beginPath();
   for(let i=0;i<=18;i++){
    const t=i/18,x=w/2+sign*w*(.02+t*.44),y=h*(1-t*.94);
    if(!i)ctx.moveTo(x,y);else ctx.lineTo(x+Math.sin(t*23+elapsed*2)*w*.002,y);
   }
   ctx.strokeStyle='rgba(224,246,238,.19)';ctx.lineWidth=2.2*ratio;ctx.stroke();
  }
 }
 const api={
  get active(){return active},
  enter(){
   active=true;root.hidden=false;root.classList.remove('wide');lookOffset=0;
   root.closest('.workspace')?.classList.add('river-mode');
   currentStop=-1;requestKey++;slot=0;
   imgs.forEach(img=>img.classList.remove('visible'));
   $('riverPhotoUnavailable').hidden=true;
   this.update(0,0,true,true,false);
  },
  exit(){
   active=false;requestKey++;
   root.hidden=true;
   root.closest('.workspace')?.classList.remove('river-mode');
   imgs.forEach(img=>img.onload=img.onerror=null);
  },
  update(leg,t,running,follow,ended,speed=1){
   if(!active)return;
   const stop=ended?places.length-1:Math.min(places.length-2,leg+((running&&t>.3)?1:0));
   activatePhoto(stop);
   root.classList.toggle('wide',!follow);
   const drift=running?t:0;
   const pan=Math.sin((leg+drift)*2.75)*1.9+lookOffset;
   imgs.forEach(img=>{img.style.transform=follow?'scale(1.13) translate3d('+(-pan)+'%,0,0)':'scale(1.035) translate3d('+(-pan*.55)+'%,0,0)'});
   drawWater(typeof performance!=='undefined'?performance.now():Date.now(),running,speed);
  },
  frame(now,running,speed){
   if(!active)return;
   // Water animates even while stopped, without advancing the journey.
   drawWater(now,running,speed);
  }
 };
 root.addEventListener('pointerdown',e=>{
   if(e.target.closest('button,a'))return;
   dragPointer=e.pointerId;dragStart=e.clientX;dragBase=lookOffset;
   root.setPointerCapture?.(e.pointerId);
 });
 root.addEventListener('pointermove',e=>{
   if(dragPointer!==e.pointerId)return;
   const width=Math.max(1,root.getBoundingClientRect().width);
   lookOffset=clamp(dragBase+(dragStart-e.clientX)*14/width,-8,8);
 });
 const release=e=>{if(e.pointerId===dragPointer)dragPointer=null};
 root.addEventListener('pointerup',release);root.addEventListener('pointercancel',release);
 $('riverMapButton').addEventListener('click',()=>api.exitRequested?.());
 return api;
}
window.PunyaRiverView={create};
})();
