/* Punya Yatra: independent, self-contained virtual boat experience.
   Schematic river-side animation between source-linked ghat reference coordinates.
   NOT channel survey, nautical chart, boating directions or travel-duration estimate. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const rad=Math.PI/180,earth=6371.0088;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>{let a1=(b[1]-a[1])*rad,o1=(b[0]-a[0])*rad,q=Math.sin(a1/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(o1/2)**2;return 2*earth*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))};
const point=p=>p&&Number.isFinite(p.lng)&&Number.isFinite(p.lat)?[p.lng,p.lat]:null;
const scenicAt=p=>{
 // Virtual camera/boat offset for a schematic *river-side* position.
 // NOT derived from hydrographic boundaries or navigable channel measurements.
 const delta=0.00088+0.00018*Math.sin(p.lat*64);
 return [p.lng+delta,p.lat-0.00018];
};
const mix=(a,b,t)=>a+(b-a)*t;
function spline(a,b,c,d,t){
 // Smooth Catmull-Rom cubic through the staged, mapped reference points.
 const t2=t*t,t3=t2*t;
 const calc=i=>.5*(2*b[i]+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t2+(-a[i]+3*b[i]-3*c[i]+d[i])*t3);
 return [calc(0),calc(1)];
}
function svgBoat(){
 const div=document.createElement('div');
 div.className='boat-map-marker';
 div.setAttribute('role','img');div.setAttribute('aria-label','Moving virtual tour boat');
 div.style.cssText='width:52px;height:65px;filter:drop-shadow(0 4px 6px #0018);pointer-events:none;transform-origin:50% 50%';
 div.innerHTML='<svg viewBox="0 0 52 65" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M26 2 C44 16 48 39 26 62 C4 39 8 16 26 2Z" fill="#8e4a32" stroke="#fff0c5" stroke-width="2.5"/><path d="M26 11 L26 52" stroke="#d9b579" stroke-width="4"/><rect x="16" y="21" width="20" height="22" rx="5" fill="#f6dba1" stroke="#6e4635" stroke-width="2"/><circle cx="26" cy="32" r="6" fill="#aa704d"/><path d="M9 40 L2 53 M43 40 L50 53" stroke="#f7dcb3" stroke-width="3" stroke-linecap="round"/></svg>';
 return div;
}
function create({places,onStop,status,stopOtherTour,openGallery}){
 const riverView=window.PunyaRiverView?.create(places);
 const tracked=places.map((p,index)=>({index,pos:point(p)})).filter(p=>p.pos);
 const sourceStops=tracked.map(p=>p.index);
 const offshore=tracked.map(p=>scenicAt(places[p.index]));
 const segments=[];
 for(let i=0;i<offshore.length-1;i++){
  const a=offshore[Math.max(0,i-1)],b=offshore[i],c=offshore[i+1],d=offshore[Math.min(offshore.length-1,i+2)];
  const points=[];
  for(let j=0;j<=30;j++)points.push(spline(a,b,c,d,j/30));
  let km=0;for(let j=1;j<points.length;j++)km+=dist(points[j-1],points[j]);
  segments.push({points,lengthKm:km});
 }
 const ctrl={
  active:false,running:false,pausedAtStop:true,ended:false,leg:0,t:0,speed:1,follow:true,
  map:null,lib:null,marker:null,boatIcon:null,mapReady:false,request:0,last:0,lastPaint:0,selected:0,
  fallback:false,
  get progress(){return this.leg+this.t},
  get stopCount(){return places.length},
  get legCount(){return segments.length},
  currentPos(){
   if(this.leg>=segments.length)return offshore[offshore.length-1];
   const arr=segments[this.leg].points,x=clamp(this.t,0,1)*(arr.length-1),k=Math.floor(x),n=Math.min(k+1,arr.length-1);
   return [mix(arr[k][0],arr[n][0],x-k),mix(arr[k][1],arr[n][1],x-k)];
  },
  heading(){
   const seg=segments[Math.min(this.leg,segments.length-1)];
   const before=seg.points[Math.max(0,Math.floor(this.t*30)-1)],after=seg.points[Math.min(30,Math.floor(this.t*30)+1)];
   return Math.atan2((after[0]-before[0])*Math.cos(after[1]*rad),after[1]-before[1])*180/Math.PI;
  },
  refreshButtons(){
   if(!this.active)return;
   $('boatPlay').textContent=this.ended?'↺ Restart voyage':this.running?'❚❚ Pause':this.pausedAtStop?'▶ Continue voyage':'▶ Resume voyage';
   $('boatPlay').setAttribute('aria-pressed',String(this.running));
   $('footerBoat').textContent=this.running?'❚❚ Pause boat':'⛵ Continue boat';
   $('footerBoat').setAttribute('aria-pressed',String(this.running));
   $('boatPrev').disabled=this.leg<=0&&this.pausedAtStop;
   $('boatNext').disabled=this.ended;
   const i=Math.min(this.leg,tracked.length-1),from=places[tracked[i].index].name,next=places[tracked[Math.min(i+1,tracked.length-1)].index].name;
   $('boatStage').textContent=this.ended?'Arrived at Ganga–Varuna Sangam':this.running?'Sailing toward '+next:'Stopped at '+from;
   $('boatPosition').textContent=this.ended?'End of virtual journey — confluence near Adi Keshav':this.running?'Approaching '+next+' · virtual playback '+this.speed+'×':'Gallery stop · '+from+' · tap Continue voyage when ready';
   $('boatProgressFill').style.width=(this.ended?100:(this.progress/segments.length*100)).toFixed(1)+'%';
   $('boatCamera').textContent=this.follow?'◉ River camera':'◉ Wide river view';
   $('boatCamera').setAttribute('aria-pressed',String(this.follow));
   $('boatGallery').disabled=false;
  },
  start(){
   stopOtherTour();
   if(this.active){this.toggle();return;}
   this.active=true;this.running=true;this.ended=false;this.pausedAtStop=false;this.leg=0;this.t=0;this.selected=0;this.last=0;this.lastPaint=0;
   const area=$('map').closest('.map-area');area?.classList.add('boat-active');
   $('boatHud').hidden=false;
   $('footerBoat').textContent='❚❚ Pause boat';
   $('boatCanvas').hidden=true;
   riverView?.enter();
   onStop(0);this.showLayers();
   this.refreshButtons();this.repaint(true);
   status('Virtual boat journey started · pauses at each landmark');
   this.request=window.requestAnimationFrame(this.frame.bind(this));
  },
  toggle(){
   if(!this.active){this.start();return}
   if(this.ended){this.exit();this.start();return}
   if(this.leg>=segments.length){this.finish();return}
   this.running=!this.running;
   this.pausedAtStop=false;
   this.last=0;
   this.refreshButtons();
   if(this.running)status('Boat moving · '+this.speed+'× sightseeing speed');
   else status('Boat paused · Resume when ready');
  },
  pause(reason='Boat paused for gallery'){
   if(!this.active||this.ended)return;
   this.running=false;this.last=0;this.refreshButtons();status(reason);
  },
  atStop(){
   const i=Math.min(this.leg,sourceStops.length-1);
   this.selected=sourceStops[i];this.running=false;this.pausedAtStop=true;this.t=0;this.last=0;
   onStop(this.selected);
   this.refreshButtons();this.repaint(true);
   status('Arrived at '+places[this.selected].name+' · view gallery or continue');
   // Keep the Adi Keshav gallery available before the unsurveyed Sangam finish.
  },
  finish(){
   this.running=false;this.ended=true;this.pausedAtStop=true;this.leg=segments.length;this.t=0;
   // Adi Keshav is the last measured location. The actual confluence point is not surveyed.
   onStop(places.length-1);
   this.refreshButtons();this.repaint(true);
   status('Journey complete · Ganga–Varuna Sangam near Adi Keshav');
  },
  jumpTo(index){
   if(!this.active)return;
   this.running=false;this.last=0;this.ended=false;this.pausedAtStop=true;
   if(index>=places.length-1){this.finish();return}
   const found=tracked.findIndex(x=>x.index===index);
   if(found<0)return;
   this.leg=Math.min(found,segments.length);
   this.t=0;this.selected=index;this.refreshButtons();this.repaint(true);
   status('Boat positioned near '+places[index].name+' · Continue when ready');
  },
  step(delta){
   if(!this.active)this.start();
   if(this.ended&&delta<0){this.ended=false;this.leg=segments.length;this.t=0;this.atStop();return}
   const current=this.leg;
   const next=clamp(current+delta,0,segments.length);
   if(next===segments.length){this.leg=segments.length;this.t=0;this.atStop();return}
   this.leg=next;this.t=0;this.running=false;this.pausedAtStop=true;this.ended=false;
   onStop(sourceStops[next]);this.refreshButtons();this.repaint(true);
   status('Boat stop · '+places[sourceStops[next]].name);
  },
  exit(){
   if(!this.active)return;
   this.active=false;this.running=false;this.ended=false;
   if(this.request)window.cancelAnimationFrame(this.request);
   this.request=0;this.last=0;
   riverView?.exit();
   $('boatHud').hidden=true;$('boatCanvas').hidden=true;$('footerBoat').textContent='⛵ Boat journey';
   $('footerBoat').setAttribute('aria-pressed','false');
   $('map').closest('.map-area')?.classList.remove('boat-active');
   this.hideLayers();
   status('Boat mode closed · choose a location to explore');
  },
  frame(now){
   if(!this.active)return;
   if(!this.last)this.last=now;
   const dt=clamp((now-this.last)/1000,0,.07);this.last=now;
   if(this.running&&!this.ended&&this.leg<segments.length){
    const seg=segments[this.leg];
    // Accelerated sightseeing pace, independent of nautical/physical speed.
    const seconds=Math.min(56,Math.max(9,6+seg.lengthKm*13));
    this.t+=dt*this.speed/seconds;
    if(this.t>=1){
      this.leg+=1;this.t=0;
      this.atStop();
    }
   }
   if(now-this.lastPaint>70){this.repaint();this.lastPaint=now}
   this.request=window.requestAnimationFrame(this.frame.bind(this));
  },
  repaint(force=false){
   if(!this.active)return;
   const pos=this.currentPos();
   riverView?.update(this.leg,this.t,this.running,this.follow,this.ended,this.speed);
   if(this.mapReady&&this.map){
    if(this.marker){this.marker.setLngLat(pos);if(typeof this.marker.setRotation==='function')this.marker.setRotation(this.heading())}
    // The river-facing photo camera is now independent of the hidden overhead map.
    if(this.map.getSource?.('boat-wake')){
      const traveled=this.leg>=segments.length?
       segments.flatMap((seg,i)=>i===0?seg.points:seg.points.slice(1)):
       segments.slice(0,this.leg).flatMap((seg,i)=>i===0?seg.points:seg.points.slice(1)).concat(segments[this.leg].points.slice(0,Math.floor(this.t*30)+1),[pos]);
      this.map.getSource('boat-wake').setData({type:'Feature',geometry:{type:'LineString',coordinates:traveled.length>1?traveled:[pos,pos]},properties:{}});
    }
   }
   // If all photos fail, the dedicated river-view still renders water and a boat bow.
   this.refreshButtons();
  },
  showLayers(){
   if(!this.mapReady||!this.map)return;
   if(this.boatIcon)this.boatIcon.style.display='block';
   for(const id of ['boat-route','boat-wake-line']){
    if(this.map.getLayer?.(id))this.map.setLayoutProperty(id,'visibility','visible');
   }
  },
  hideLayers(){
   if(this.boatIcon)this.boatIcon.style.display='none';
   if(this.map){
    for(const id of ['boat-route','boat-wake-line'])if(this.map.getLayer?.(id))this.map.setLayoutProperty(id,'visibility','none');
   }
  },
  setupMap(map,lib){
   this.map=map;this.lib=lib;this.mapReady=true;
   const coords=segments.flatMap((seg,i)=>i===0?seg.points:seg.points.slice(1));
   try{
    if(!map.getSource?.('boat-illustration')){
      map.addSource('boat-illustration',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{}}});
      map.addLayer({id:'boat-route',type:'line',source:'boat-illustration',layout:{visibility:this.active?'visible':'none'},paint:{'line-color':'#27c3dc','line-width':4,'line-dasharray':[1.4,1.4],'line-opacity':.93}});
      map.addSource('boat-wake',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[offshore[0],offshore[0]]},properties:{}}});
      map.addLayer({id:'boat-wake-line',type:'line',source:'boat-wake',layout:{visibility:this.active?'visible':'none'},paint:{'line-color':'#fff3c5','line-width':3,'line-opacity':.9}});
    }
    this.boatIcon=svgBoat();this.boatIcon.style.display=this.active?'block':'none';
    this.marker=new lib.Marker({element:this.boatIcon,rotationAlignment:'map',anchor:'center'}).setLngLat(this.currentPos()).addTo(map);
    $('boatCanvas').hidden=true;
    if(this.active){this.showLayers();this.repaint(true)}
   }catch(err){
    console.warn('Map boat overlay failed, switching to river canvas',err);
    this.mapReady=false;this.fallback=true;
    if(this.active)$('boatCanvas').hidden=true;
   }
  },
  unavailable(){
   this.mapReady=false;this.map=null;this.marker=null;this.boatIcon=null;
   if(this.active){$('boatCanvas').hidden=true;this.repaint(true)}
  },
  drawFallback(pos){
   const canvas=$('boatCanvas');if(canvas.hidden)canvas.hidden=false;
   const box=canvas.getBoundingClientRect();
   if(!box.width||!box.height)return;
   const pixel=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(box.width*pixel)),h=Math.max(1,Math.floor(box.height*pixel));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
   const ctx=canvas.getContext('2d');if(!ctx)return;
   const M=Math.min(w,h),spanKm=this.follow?2.4:7.3;
   const latWidth=spanKm/111,lonWidth=spanKm/(111*Math.cos(pos[1]*rad));
   const project=q=>[w/2+(q[0]-pos[0])*w/lonWidth,h/2-(q[1]-pos[1])*h/latWidth];
   ctx.fillStyle='#698a6a';ctx.fillRect(0,0,w,h);
   const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#1b688d');g.addColorStop(1,'#42a1b2');
   const drawLine=(points,stroke,width)=>{
    ctx.beginPath();points.forEach((p,i)=>{const xy=project(p);i?ctx.lineTo(...xy):ctx.moveTo(...xy)});
    ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
   };
   const all=segments.flatMap((s,i)=>i?s.points.slice(1):s.points);
   drawLine(all,'#bbab80',Math.max(78,M*.29));
   drawLine(all,g,Math.max(67,M*.26));
   drawLine(all,'#eaf4ec55',3*pixel);
   offshore.forEach((p,i)=>{
    const [x,y]=project(p);
    if(x<-30||x>w+30||y<-30||y>h+30)return;
    ctx.beginPath();ctx.fillStyle='#f2cb8f';ctx.arc(x,y,8*pixel,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#15334a';ctx.font='bold '+(11*pixel)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y);
   });
   const [x,y]=project(pos),angle=this.heading()*rad;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   ctx.fillStyle='#fff6cd';ctx.beginPath();ctx.ellipse(0,8*pixel,13*pixel,23*pixel,0,0,2*Math.PI);ctx.fill();
   ctx.fillStyle='#ad6039';ctx.beginPath();ctx.moveTo(0,-22*pixel);ctx.lineTo(-9*pixel,10*pixel);ctx.quadraticCurveTo(0,24*pixel,9*pixel,10*pixel);ctx.closePath();ctx.fill();
   ctx.fillStyle='#f3d19e';ctx.fillRect(-5*pixel,-6*pixel,10*pixel,16*pixel);
   ctx.restore();
   ctx.fillStyle='#0e243acc';ctx.fillRect(0,0,w,34*pixel);
   ctx.fillStyle='#fff0cf';ctx.font='bold '+(12*pixel)+'px sans-serif';ctx.textAlign='left';ctx.fillText('VIRTUAL GANGA CRUISE  ·  NOT A NAVIGATION CHART',12*pixel,22*pixel);
  }
 };
 // Map failure should never prevent the simulated river journey from animating.
 if(riverView)riverView.exitRequested=()=>ctrl.exit();
 $('boatLaunch').addEventListener('click',()=>ctrl.start());
 $('footerBoat').addEventListener('click',()=>ctrl.start());
 $('boatPlay').addEventListener('click',()=>ctrl.toggle());
 $('boatPrev').addEventListener('click',()=>ctrl.step(-1));
 $('boatNext').addEventListener('click',()=>ctrl.step(1));
 $('boatExit').addEventListener('click',()=>ctrl.exit());
 $('boatCamera').addEventListener('click',()=>{ctrl.follow=!ctrl.follow;ctrl.refreshButtons();ctrl.repaint(true)});
 $('boatSpeed').addEventListener('change',e=>{ctrl.speed=clamp(Number(e.target.value)||1,1,4);ctrl.refreshButtons()});
 $('boatGallery').addEventListener('click',()=>{
  ctrl.pause('Boat paused for the location gallery');
  const scroll=document.querySelector('.info-scroll');
  if(scroll)scroll.scrollTo?.({top:0,behavior:'smooth'});
  if(!$('openPhoto').disabled)openGallery();
  else status('No reviewed photo at this stop · check source links for additional images');
 });
 window.addEventListener('resize',()=>{if(ctrl.active&&!ctrl.mapReady)ctrl.repaint(true)});
 return ctrl;
}
window.PunyaBoat={create};
})();
