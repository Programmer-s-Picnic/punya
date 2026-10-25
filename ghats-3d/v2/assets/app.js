(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={data:null,index:0,slideIndex:0,photos:[],map:null,markers:[],routeTimer:null,slideTimer:null,tab:'major',lang:'en',satellite:false,tilt:false,externalCache:new Map(),loadToken:0,booted:false};
const rad=Math.PI/180, DEG2KM=6371.0088;
const toPoint=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)?[p.lng,p.lat]:null;
const hav=(a,b)=>{
 const dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;
 const q=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
 return 2*DEG2KM*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
};
const formatDist=k=>Number.isFinite(k)?(k<1?Math.round(k*1000)+' m':k.toFixed(2)+' km'):'Not surveyed';
const status=text=>{$('journeyStatus').textContent=text};
function outerLink(name){return 'https://commons.wikimedia.org/w/index.php?search='+encodeURIComponent(name+' Varanasi ghat')+'&title=Special:MediaSearch&type=image'}
function chooseImage(photo){
 const img=$('photo'),empty=$('emptyPhoto'),token=state.loadToken;
 img.hidden=true;img.removeAttribute('src');empty.hidden=false;empty.textContent='Loading location photograph…';
 img.onload=()=>{if(state.loadToken!==token)return;empty.hidden=true;img.hidden=false;};
 img.onerror=()=>{if(state.loadToken!==token)return;img.hidden=true;empty.hidden=false;empty.textContent='Photo unavailable. Follow the source link below to view the original.';};
 img.alt=photo.caption||'Landmark photograph';
 img.referrerPolicy='no-referrer';
 img.src=photo.url;
 $('photoCredit').replaceChildren();
 const label=document.createElement('span');
 label.textContent=(photo.caption||'Photograph')+' · '+(photo.credit||'Contributor')+' · ';
 const link=document.createElement('a');link.textContent=photo.license==='Existing site asset'?'Original collection':'Original file / licence';
 link.href=photo.source||outerLink(state.data.places[state.index].name);
 link.target='_blank';link.rel='noopener noreferrer';
 $('photoCredit').append(label,link);
}
function renderGallery(){
 state.loadToken++;
 const photos=state.photos,has=photos.length>0;
 $('galleryCount').textContent=has?photos.length+' photos':'0 verified';
 $('photoIndex').textContent=has?(state.slideIndex+1)+' / '+photos.length:'0 / 0';
 $('prevPhoto').disabled=!has||photos.length===1;
 $('nextPhoto').disabled=!has||photos.length===1;
 $('openPhoto').disabled=!has;
 $('slideshow').disabled=photos.length<2;
 const empty=$('emptyPhoto'),img=$('photo'),thumbs=$('thumbs');thumbs.replaceChildren();
 if(!has){
  img.onload=null;img.onerror=null;img.hidden=true;img.removeAttribute('src');empty.hidden=false;
  empty.textContent='No reviewed, licence-cleared photograph is yet attached. Use “Find more photographs” to inspect potential sources.';
  $('photoCredit').textContent='Location record is available; the gallery is awaiting verified images.';
  $('photoCaution').textContent='Photographs are not substituted with images from a different ghat.';
  return;
 }
 const p=photos[state.slideIndex];
 $('photoCaution').textContent=p.verifiedSubject===false?
   'Provisional Wikimedia file reference: subject, author and licence require editorial review before final public release.':
   p.reviewStatus==='candidate'?
   'Community search candidates are not independently verified as this exact location. Check file details before reuse.':
   'Photo supplied by the Punya Yatra collection. Reuse rights should be reviewed for production.';
 chooseImage(p);
 photos.forEach((t,i)=>{
  const b=document.createElement('button');b.type='button';b.classList.toggle('active',i===state.slideIndex);
  b.setAttribute('aria-label','Display photograph '+(i+1));
  const pic=document.createElement('img');pic.loading='lazy';pic.alt='';pic.referrerPolicy='no-referrer';pic.src=t.url;
  pic.onerror=()=>{pic.style.display='none'};
  b.append(pic);b.addEventListener('click',()=>{stopSlides();state.slideIndex=i;renderGallery()});thumbs.append(b);
 });
}
function stopSlides(){if(state.slideTimer)clearInterval(state.slideTimer);state.slideTimer=null;$('slideshow').textContent='▶ Play';$('slideshow').setAttribute('aria-pressed','false')}
function changePhoto(delta){
 if(!state.photos.length)return;
 state.slideIndex=(state.slideIndex+delta+state.photos.length)%state.photos.length;
 renderGallery();
}
function toggleSlides(){
 if(state.slideTimer){stopSlides();return}
 if(state.photos.length<2)return;
 stopTour();
 $('slideshow').textContent='❚❚ Pause';$('slideshow').setAttribute('aria-pressed','true');
 state.slideTimer=setInterval(()=>changePhoto(1),4200);
}
function openPhoto(){
 if(!state.photos.length)return;stopTour();stopSlides();
 const p=state.photos[state.slideIndex],modal=$('photoModal');
 $('modalImage').src=p.url;$('modalImage').alt=p.caption;
 $('modalHeading').textContent=state.data.places[state.index].name+' · Photo '+(state.slideIndex+1);
 $('modalCaption').textContent=(p.caption||'Photograph')+' · '+(p.credit||'Credit pending')+'. Source licences must be checked.';
 $('modalSource').href=p.source||outerLink(state.data.places[state.index].name);
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');$('closeModal').focus();
}
function closeModal(id){
 const m=$(id);m.classList.remove('open');m.setAttribute('aria-hidden','true');
 if(id==='photoModal')$('modalImage').removeAttribute('src');
}
function choose(index,fromTour=false){
 const places=state.data.places;
 index=Math.max(0,Math.min(places.length-1,index));
 if(!fromTour)stopTour();
 stopSlides();
 state.index=index;state.slideIndex=0;
 const p=places[index];
 $('stopType').textContent=(p.kind==='temple'?'SOUTHERN TEMPLE':p.kind==='confluence'?'NORTHERN CONFLUENCE':'HISTORIC GHAT')+' · STOP '+(index+1);
 $('stopName').textContent=state.lang==='hi'&&p.hi?p.hi:p.name;
 $('stopHindi').textContent=state.lang==='hi'?p.name:p.hi;
 $('stopDescription').textContent=p.summary;
 $('features').textContent=p.whatToSee;
 $('placeSource').href=p.source;
 $('openMaps').href=toPoint(p)?'https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lng+'#map=16/'+p.lat+'/'+p.lng:'https://www.openstreetmap.org/search?query='+encodeURIComponent(p.name+' Varanasi');
 $('commonsSearch').href=outerLink(p.name);
 $('progress').value=index;
 $('routePosition').textContent='Stop '+(index+1)+' of '+places.length;
 // These are lower bounds, not river / footpath routing distances.
 const coords=places.filter(x=>toPoint(x));
 const mappedIndex=coords.findIndex(x=>x.id===p.id);
 if(mappedIndex<0){
   $('distanceFrom').textContent='Needs survey';
   $('distanceNext').textContent='Needs survey';
 }else{
   let total=0;
   for(let i=1;i<=mappedIndex;i++)total+=hav(coords[i-1],coords[i]);
   $('distanceFrom').textContent='≥ '+formatDist(total);
   $('distanceNext').textContent=mappedIndex===coords.length-1?'Last mapped stop':'≥ '+formatDist(hav(coords[mappedIndex],coords[mappedIndex+1]));
 }
 state.photos=(p.photos||[]).map(x=>({...x}));
 renderGallery();
 refreshList();
 if(state.map&&toPoint(p)){
  state.map.flyTo({center:toPoint(p),zoom:p.kind==='temple'?12.9:15.8,pitch:state.tilt?59:0,bearing:state.tilt?22:0,speed:1.2,essential:false});
  state.markers.forEach((marker,j)=>marker.getElement().classList.toggle('active-marker',j===index));
 }
 else if(state.map&&!toPoint(p)){
  const last=places[places.length-2];state.map.flyTo({center:toPoint(last),zoom:14.3,pitch:state.tilt?59:0,essential:false});
 }
 if(location.hash!=='#'+encodeURIComponent(p.id))history.replaceState(null,'','#'+encodeURIComponent(p.id));
 if(p.photos.length<2)void tryCommons(p,index);
}
async function tryCommons(p,index){
 // Candidates supplement the gallery only after an image-search result passes simple title checks.
 // Never claim they have been verified. The request is only made for the visible location.
 if(state.externalCache.has(p.id)){
  const cached=state.externalCache.get(p.id);if(state.index===index)appendCandidates(cached);return;
 }
 const terms=p.kind==='temple'?'Shooltankeshwar Madhopur Varanasi':p.name+' Varanasi';
 const u='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent('"'+terms+'"')+'&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=900&format=json&origin=*';
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7500);
 try{
  const res=await fetch(u,{signal:controller.signal,credentials:'omit'});if(!res.ok)throw Error('Commons returned '+res.status);
  const json=await res.json();
  const list=Object.values(json.query?.pages||{}).filter(e=>e.imageinfo?.[0]?.thumburl)
   .filter(e=>/\.(jpe?g|png|webp)$/i.test(e.title||''))
   .filter(e=>{
    const n=(e.title||'').toLowerCase().replace(/[_\-]/g,' ');
    const key=p.name.toLowerCase().replace(' ghat','').replace(' mahadev','').split(/\s+/)[0];
    return n.includes(key)&& (n.includes('varanasi')||n.includes('benaras')||n.includes('banaras')||n.includes('ghat')||n.includes('tankeshwar'));
   })
   .slice(0,6).map(e=>{
     const d=e.imageinfo[0],meta=d.extmetadata||{};
     return {url:d.thumburl,caption:e.title.replace(/^File:/,'').replaceAll('_',' '),credit:'Wikimedia Commons (unreviewed)',license:meta.LicenseShortName?.value||'See source',source:d.descriptionurl,reviewStatus:'candidate',verifiedSubject:false};
   });
  state.externalCache.set(p.id,list);
  if(state.index===index)appendCandidates(list);
 }catch(error){state.externalCache.set(p.id,[])}
 finally{clearTimeout(timeout)}
}
function appendCandidates(list){
 const already=new Set(state.photos.map(p=>p.url));
 const add=list.filter(p=>!already.has(p.url));
 if(!add.length)return;
 state.photos.push(...add);
 renderGallery();
}
function renderList(){
 const list=$('stopList');list.replaceChildren();
 const q=$('search').value.trim().toLowerCase();
 if(state.tab==='major'){
  state.data.places.forEach((p,i)=>{
   if(q&&!(p.name+' '+p.hi+' '+p.summary).toLowerCase().includes(q))return;
   const button=document.createElement('button');
   button.classList.toggle('active',i===state.index);
   const left=document.createElement('span');left.textContent=String(i+1).padStart(2,'0')+' · '+p.name;
   const right=document.createElement('small');right.textContent=toPoint(p)?'Mapped':'Pending';
   button.append(left,right);button.addEventListener('click',()=>{choose(i);list.scrollTop=0});list.append(button);
  });
 }else{
  state.data.traditionalGhats.forEach(g=>{
   if(q&&!g.name.toLowerCase().includes(q))return;
   const button=document.createElement('button');
   const left=document.createElement('span');left.textContent=String(g.sequence).padStart(2,'0')+' · '+g.name;
   const right=document.createElement('small');right.textContent=g.linkedStop?'Mapped':'To survey';
   button.append(left,right);
   button.addEventListener('click',()=>{
    if(g.linkedStop){
      const ix=state.data.places.findIndex(p=>p.id===g.linkedStop);
      choose(ix);$('search').value='';
      if(state.tab==='all')renderList();
    }else{
      stopTour();stopSlides();
      $('stopType').textContent='TRADITIONAL GHAT '+g.sequence+' · AWAITING SURVEY';
      $('stopName').textContent=g.name;
      $('stopHindi').textContent='';
      $('stopDescription').textContent='This historic ghat is in the traditional south-to-north directory. Its coordinates and photographs have not yet been validated; it has deliberately not been given a fabricated map marker.';
      $('features').textContent='Pending geographic survey and photo-curation.';
      $('distanceFrom').textContent='Not surveyed';$('distanceNext').textContent='Not surveyed';
      $('placeSource').href='https://www.openstreetmap.org/search?query='+encodeURIComponent(g.name+' Varanasi');
      $('openMaps').href=$('placeSource').href;
      $('commonsSearch').href=outerLink(g.name);
      state.photos=[];renderGallery();
    }
   });
   list.append(button);
  });
 }
 if(!list.childNodes.length){const p=document.createElement('p');p.className='footnote';p.textContent='No matching place.';list.append(p)}
}
const refreshList=()=>renderList();
function stopTour(){
 if(state.routeTimer)clearInterval(state.routeTimer);
 state.routeTimer=null;$('play').textContent='▶ Guided journey';$('play').setAttribute('aria-pressed','false');
}
function toggleTour(){
 if(state.routeTimer){stopTour();return}
 stopSlides();closeModal('photoModal');
 if(state.index>=state.data.places.length-1)choose(0,true);
 $('play').textContent='❚❚ Pause journey';$('play').setAttribute('aria-pressed','true');
 status('Playing major stops · Pause to explore any gallery');
 state.routeTimer=setInterval(()=>{
  if(state.index>=state.data.places.length-1){stopTour();status('Journey complete · Ganga–Varuna Sangam');return}
  choose(state.index+1,true);
 },7200);
}
function createMapStyle(satellite){
 return {version:8,transition:{duration:150},
 sources:{base:{type:'raster',tiles:satellite?
 ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']:
 ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,
 attribution:satellite?'Tiles © Esri and imagery contributors':'© OpenStreetMap contributors'}},
 layers:[{id:'base-layer',type:'raster',source:'base',minzoom:0,maxzoom:20}]};
}
async function maplibre(){
 if(window.maplibregl)return window.maplibregl;
 const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.append(css);
 const urls=[
 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js',
 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
 ];
 for(const url of urls){
   try{
    await new Promise((ok,fail)=>{
      const el=document.createElement('script');el.src=url;el.async=true;
      const timer=setTimeout(()=>{el.remove();fail(Error('Map library timed out'))},8000);
      el.onload=()=>{clearTimeout(timer);ok()};
      el.onerror=()=>{clearTimeout(timer);fail(Error('Map library blocked'))};
      document.head.append(el);
    });
    if(window.maplibregl)return window.maplibregl;
   }catch(error){console.warn('Map library source unavailable',error.message)}
 }
 throw Error('The map library could not load from its available hosts.');
}
async function initMap(){
 try{
  const lib=await maplibre();
  if(state.map){state.map.remove();state.map=null;state.markers=[]}
  if(!lib.supported()){throw Error('This browser currently does not provide WebGL for interactive maps.')}
  const map=new lib.Map({container:'map',style:createMapStyle(state.satellite),center:[83.014,25.310],zoom:12.1,attributionControl:true,hash:false,dragRotate:true,pitch:state.tilt?56:0,maxPitch:70});
  state.map=map;
  map.addControl(new lib.NavigationControl({visualizePitch:true}),'top-right');
  map.addControl(new lib.ScaleControl({maxWidth:110,unit:'metric'}),'bottom-right');
  const coords=state.data.places.filter(p=>toPoint(p));
  const chain=coords.map(toPoint);
  map.on('load',()=>{
    map.addSource('reference',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:chain}}});
    map.addLayer({id:'reference-line',type:'line',source:'reference',paint:{'line-color':'#eac484','line-width':3,'line-opacity':.8,'line-dasharray':[2,2]}});
    coords.forEach(p=>{
      const i=state.data.places.findIndex(x=>x.id===p.id);
      const el=document.createElement('button');
      el.className='map-pin';el.type='button';el.title=p.name;
      el.style.cssText='width:25px;height:25px;border-radius:50%;background:#f4c882;color:#173446;border:2px solid white;font-weight:700;box-shadow:0 3px 10px #0007;font-size:10px;cursor:pointer';
      el.textContent=i+1;
      el.setAttribute('aria-label','Explore '+p.name);
      el.addEventListener('click',()=>choose(i));
      const marker=new lib.Marker({element:el}).setLngLat(toPoint(p)).addTo(map);
      state.markers.push(marker);
    });
    fitMap();
    $('mapFallback').classList.remove('show');
    status('Map ready · Real position markers');
  });
  map.on('error',e=>{console.warn('Map tile/provider issue',e?.error||e)});
 }catch(err){
   $('mapFallback').classList.add('show');
   $('mapFailureText').textContent='Map unavailable: '+err.message+'. Location descriptions and galleries are still available.';
   status('Photo and landmark mode · map unavailable');
 }
}
function fitMap(){
 if(!state.map||!state.data)return;
 const ps=state.data.places.filter(p=>toPoint(p)),bounds=new window.maplibregl.LngLatBounds(toPoint(ps[0]),toPoint(ps[0]));
 ps.forEach(p=>bounds.extend(toPoint(p)));
 state.map.fitBounds(bounds,{padding:55,duration:500,maxZoom:13.7,pitch:state.tilt?45:0});
}
function toggleSatellite(on){
 state.satellite=on;
 $('street').classList.toggle('selected',!on);$('street').setAttribute('aria-pressed',String(!on));
 $('satellite').classList.toggle('selected',on);$('satellite').setAttribute('aria-pressed',String(on));
 if(state.map){
  state.map.getSource('base')?.setTiles(on?['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']:['https://tile.openstreetmap.org/{z}/{x}/{y}.png']);
  state.map.getCanvas().style.filter=on?'saturate(1.05)':'';
 }
 status(on?'Satellite imagery: © Esri and contributing imagery partners':'Street map: © OpenStreetMap contributors');
}
function toggleTilt(){
 state.tilt=!state.tilt;
 $('tilt').classList.toggle('selected',state.tilt);$('tilt').setAttribute('aria-pressed',String(state.tilt));
 if(state.map)state.map.easeTo({pitch:state.tilt?58:0,bearing:state.tilt?18:0,duration:700});
 status(state.tilt?'3D perspective · tilted map, not surveyed 3D structures':'Map · overhead view');
}
function wire(){
 $('prev').onclick=()=>choose(state.index-1);$('next').onclick=()=>choose(state.index+1);
 $('play').onclick=toggleTour;
 $('progress').oninput=e=>choose(Number(e.target.value));
 $('prevPhoto').onclick=()=>{stopSlides();changePhoto(-1)};
 $('nextPhoto').onclick=()=>{stopSlides();changePhoto(1)};
 $('slideshow').onclick=toggleSlides;$('openPhoto').onclick=openPhoto;
 $('closeModal').onclick=()=>closeModal('photoModal');
 $('photoModal').onclick=e=>{if(e.target.id==='photoModal')closeModal('photoModal')};
 $('helpBtn').onclick=()=>{$('helpModal').classList.add('open');$('helpModal').setAttribute('aria-hidden','false');stopTour()};
 $('closeHelp').onclick=()=>closeModal('helpModal');
 $('helpModal').onclick=e=>{if(e.target.id==='helpModal')closeModal('helpModal')};
 window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal('photoModal');closeModal('helpModal')}
  if(e.target.tagName==='INPUT')return;
  if(e.key==='ArrowLeft')choose(state.index-1);
  if(e.key==='ArrowRight')choose(state.index+1);
 });
 $('lang').onclick=()=>{state.lang=state.lang==='en'?'hi':'en';$('lang').textContent=state.lang==='hi'?'English':'हिन्दी';$('lang').setAttribute('aria-pressed',String(state.lang==='hi'));choose(state.index)};
 $('verifiedTab').onclick=()=>switchTab('major');
 $('allTab').onclick=()=>switchTab('all');
 $('search').oninput=renderList;
 $('fit').onclick=fitMap;
 $('street').onclick=()=>toggleSatellite(false);
 $('satellite').onclick=()=>toggleSatellite(true);
 $('tilt').onclick=toggleTilt;
 $('retryMap').onclick=()=>void initMap();
}
function switchTab(name){
 state.tab=name;
 $('verifiedTab').classList.toggle('active',name==='major');
 $('verifiedTab').setAttribute('aria-selected',String(name==='major'));
 $('allTab').classList.toggle('active',name==='all');
 $('allTab').setAttribute('aria-selected',String(name==='all'));
 $('search').value='';
 renderList();
}
async function init(){
 wire();
 try{
  const response=await fetch('./data/places.json?v=20261025b',{cache:'no-cache'});
  if(!response.ok)throw Error('Location data returned '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.places)||!Array.isArray(data.traditionalGhats)||data.places.length<2)throw Error('Location file is invalid.');
  state.data=data;
  $('progress').max=String(data.places.length-1);
  const raw=decodeURIComponent(location.hash.slice(1));
  const ix=data.places.findIndex(p=>p.id===raw);
  choose(ix>=0?ix:0);
  state.booted=true;
  void initMap();
 }catch(err){
  $('mapFallback').classList.add('show');
  $('mapFailureText').textContent='Location data failed to load: '+err.message+'. Please reload the page.';
  $('stopDescription').textContent='The route data is unavailable. Use the existing Punya Yatra photo gallery as an alternative.';
  status('Location data unavailable');
 }
}
window.addEventListener('hashchange',()=>{
 if(!state.data)return;
 const id=decodeURIComponent(location.hash.slice(1)),ix=state.data.places.findIndex(p=>p.id===id);
 if(ix>=0&&ix!==state.index)choose(ix);
});
init();
})();
