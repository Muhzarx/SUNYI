import * as THREE from 'three';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090f0d);
scene.fog = new THREE.FogExp2(0x101a17, 0.0125);
const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .1, 650);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
$('game').appendChild(renderer.domElement);

const clock = new THREE.Clock();
const keys = {};
const state = {started:false, paused:true, dead:false, third:false, flashlight:true, health:100, stamina:100, batteries:0, notes:0, quest:0, time:0, sensitivity:1, invertY:false, volume:.45, nearby:null, lastSave:0};
const player = {pos:new THREE.Vector3(0,0,8), vel:new THREE.Vector3(), yaw:Math.PI, pitch:0, speed:4.2, height:1.7, bob:0};
const world = new THREE.Group(); scene.add(world);
const colliders = [], interactables = [], enemies = [];
const mats = {};
function mat(name,color,roughness=1,metalness=0){return mats[name]=new THREE.MeshStandardMaterial({color,roughness,metalness});}
mat('ground',0x26332a); mat('bark',0x302820); mat('leaf',0x17271d); mat('leaf2',0x253729);
mat('wood',0x4a4032); mat('roof',0x252a25); mat('stone',0x44483f); mat('metal',0x59605a,.45,.55);
mat('window',0x111b18,.2); mat('skin',0x9b8066); mat('shirt',0x34443b); mat('pants',0x242a29); mat('enemy',0x111412); mat('glow',0xc9a36c,.4);
const hemi = new THREE.HemisphereLight(0x8d9b9c,0x182017,1.0); scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9aafc2,1.35); moon.position.set(-35,65,20); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048); moon.shadow.camera.left=-90; moon.shadow.camera.right=90; moon.shadow.camera.top=90; moon.shadow.camera.bottom=-90; scene.add(moon);
const ambient = new THREE.AmbientLight(0x314239,.25); scene.add(ambient);
const flashlight = new THREE.SpotLight(0xe2e7d8,35,32,Math.PI/7,.48,1.2); flashlight.castShadow=true; scene.add(flashlight); scene.add(flashlight.target);
const fill = new THREE.PointLight(0x9aafc2,.4,30); scene.add(fill);

function box(parent,x,y,z,sx,sy,sz,material,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,x,y,z,r1,r2,h,material,seg=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function seededRandom(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const rand=seededRandom(42098);
function terrainHeight(x,z){return Math.sin(x*.035)*1.3+Math.cos(z*.045)*1.1+Math.sin((x+z)*.018)*1.7;}
function makeTerrain(){
 const n=100, size=360, geo=new THREE.PlaneGeometry(size,size,n,n); geo.rotateX(-Math.PI/2);
 const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrainHeight(x,z));}
 geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mats.ground);mesh.receiveShadow=true;world.add(mesh);
}
makeTerrain();
function addTree(x,z,scale=1){
 const y=terrainHeight(x,z), g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);
 cylinder(g,0,3,0,.28,.48,6,mats.bark,7);
 for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(2.4-i*.35,4.5,7),i===1?mats.leaf2:mats.leaf);cone.position.y=5+i*1.55;cone.castShadow=true;g.add(cone);}
 world.add(g);colliders.push({x,z,r:.65*scale});
}
for(let i=0;i<430;i++){let x=(rand()-.5)*330,z=(rand()-.5)*330;if(Math.hypot(x,z)<25)continue;if(Math.abs(x)<12&&z>15&&z<100)continue;addTree(x,z,.7+rand()*.85);}
function addRock(x,z,s=1){const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),mats.stone);mesh.position.set(x,terrainHeight(x,z)+s*.45,z);mesh.scale.set(1,.65,1.2);mesh.castShadow=true;mesh.receiveShadow=true;world.add(mesh);}
for(let i=0;i<90;i++){let x=(rand()-.5)*300,z=(rand()-.5)*300;if(Math.hypot(x,z)>20)addRock(x,z,.5+rand()*1.8);}
function makeHouse(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.scale.setScalar(scale);
 box(g,0,1.4,0,7,2.8,6,mats.wood);box(g,0,3.05,0,8,1.2,7,mats.roof);
 // gable silhouette
 const roof1=box(g,-1.9,3.75,0,4.2,.22,7,mats.roof);roof1.rotation.z=-.48;
 const roof2=box(g,1.9,3.75,0,4.2,.22,7,mats.roof);roof2.rotation.z=.48;
 box(g,0,1.15,3.04,1.1,2.3,.12,mats.bark);
 box(g,-2.1,1.8,3.08,1.2,.9,.14,mats.window);box(g,2.1,1.8,3.08,1.2,.9,.14,mats.window);
 const porch=box(g,0,.25,4.4,5,.35,2,mats.bark);
 world.add(g);colliders.push({x,z,r:4.7*scale});
 return g;
}
const houseA=makeHouse(0,62,1.25),houseB=makeHouse(-27,82,.9),houseC=makeHouse(28,105,1.05),houseD=makeHouse(45,55,.85);
function addPath(){
 for(let i=0;i<45;i++){let z=12+i*3.2;for(let j=0;j<2;j++){const x=(j?1:-1)*(5+Math.sin(i*.25)*2);const rock=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,2.4),mats.stone);rock.position.set(x,terrainHeight(x,z)+.05,z);rock.rotation.y=(rand()-.5)*.3;world.add(rock);}}
}
addPath();
function addLantern(x,z){
 const y=terrainHeight(x,z);cylinder(world,x,y+2,z,.08,.08,4,mats.bark,6);
 const lamp=new THREE.PointLight(0xd39a59,2.2,13);lamp.position.set(x,y+3.7,z);world.add(lamp);
 const orb=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),new THREE.MeshBasicMaterial({color:0xffc77c}));orb.position.copy(lamp.position);world.add(orb);
}
[[7,56],[-22,78],[32,98],[42,52],[-4,120]].forEach(p=>addLantern(...p));

// Main character: procedural articulated humanoid with simple walk animation.
const avatar=new THREE.Group();world.add(avatar);
const body=new THREE.Group();avatar.add(body);
const skin=mats.skin, shirt=mats.shirt, pants=mats.pants;
const torso=box(body,0,1.15,0,.62,.82,.34,shirt);
const head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),skin);head.position.y=1.78;head.castShadow=true;body.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.235,12,8,0,Math.PI*2,0,Math.PI*.55),mats.bark);hair.position.set(0,1.88,0);body.add(hair);
const arms=[],legs=[];
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.42,1.43,0);body.add(arm);box(arm,0,-.34,0,.19,.72,.2,shirt);cylinder(arm,0,-.77,0,.09,.1,.22,skin,8);arms.push(arm);
 const leg=new THREE.Group();leg.position.set(side*.19,.78,0);body.add(leg);box(leg,0,-.36,0,.24,.72,.27,pants);box(leg,0,-.75,.08,.26,.16,.42,mats.bark);legs.push(leg);
}
const fpRig=new THREE.Group();camera.add(fpRig);
const hand=box(fpRig,.28,-.3,-.55,.13,.14,.32,skin,false);hand.visible=false;
const sleeve=box(fpRig,.28,-.4,-.4,.2,.25,.4,shirt,false);sleeve.visible=false;
function makeEnemy(x,z){
 const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);world.add(g);
 const torsoE=box(g,0,1.25,0,.62,1.05,.38,mats.enemy);torsoE.scale.y=1.25;
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),mats.enemy);skull.position.set(0,2.05,.04);g.add(skull);
 const eyeMat=new THREE.MeshBasicMaterial({color:0x9b3429});for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.045,6,6),eyeMat);e.position.set(s*.1,2.08,.25);g.add(e);}
 const armsE=[];for(const s of [-1,1]){const a=box(g,s*.43,1.28,.02,.18,.95,.2,mats.enemy);a.rotation.z=s*.12;armsE.push(a);}
 enemies.push({group:g,arms:armsE,home:new THREE.Vector3(x,0,z),phase:rand()*6,attack:0,alert:false});
}
makeEnemy(-35,38);makeEnemy(45,132);makeEnemy(70,-30);
function addPickup(type,x,z){
 const group=new THREE.Group();group.position.set(x,terrainHeight(x,z)+.7,z);
 const color=type==='battery'?0xd3b86f:0x9aab9a;
 const mesh=new THREE.Mesh(type==='battery'?new THREE.BoxGeometry(.32,.5,.22):new THREE.BoxGeometry(.45,.06,.32),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.18}));
 mesh.castShadow=true;group.add(mesh);
 const light=new THREE.PointLight(color,.5,4);group.add(light);world.add(group);
 interactables.push({type,group,used:false,range:2.7});
}
addPickup('battery',-5,49);addPickup('battery',33,89);addPickup('battery',-39,105);
addPickup('note',-24,79);addPickup('note',27,102);addPickup('note',2,116);
function addRadio(){
 const g=new THREE.Group();g.position.set(0,terrainHeight(0,130),130);
 box(g,0,.7,0,1.3,1.4,.8,mats.metal);box(g,0,1.6,0,.12,1.1,.12,mats.metal);
 const glow=new THREE.PointLight(0x8a9b75,0,8);glow.position.set(0,1.5,.5);g.add(glow);world.add(g);
 interactables.push({type:'radio',group:g,used:false,range:3.2,glow});
}
addRadio();

let audioCtx=null, master=null, windOsc=null;
function initAudio(){
 if(audioCtx)return;try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=state.volume;master.connect(audioCtx.destination);
 const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.12;
 const noise=audioCtx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;const gain=audioCtx.createGain();gain.gain.value=.25;noise.connect(filter);filter.connect(gain);gain.connect(master);noise.start();
 windOsc={gain,filter};
 }catch(e){console.warn('Audio tidak tersedia',e);}
}
function sound(freq=220,duration=.12,type='sine',volume=.08){
 if(!audioCtx||!master)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(audioCtx.currentTime+duration);
}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function setObjective(){const texts=['Temukan jalan menuju desa','Cari 2 catatan penduduk','Temukan pemancar radio di utara desa','Aktifkan pemancar radio'];$('objective-text').textContent=texts[Math.min(state.quest,3)];}
function showScreen(id){for(const el of document.querySelectorAll('.screen'))el.classList.add('hidden');$(id).classList.remove('hidden');}
function startGame(load=false){
 initAudio();state.started=true;state.paused=false;state.dead=false;
 $('main-menu').classList.add('hidden');$('pause-menu').classList.add('hidden');$('settings-menu').classList.add('hidden');$('credits-menu').classList.add('hidden');$('death-screen').classList.add('hidden');$('hud').classList.remove('hidden');
 if(load)loadGame();else resetGame();
 if(innerWidth>700)renderer.domElement.requestPointerLock?.();
 updateHUD();clock.getDelta();
}
function resetGame(){state.health=100;state.stamina=100;state.batteries=0;state.notes=0;state.quest=0;state.time=0;player.pos.set(0,0,8);player.yaw=Math.PI;player.pitch=0;interactables.forEach(i=>i.used=false);enemies.forEach(e=>{e.group.position.set(e.home.x,terrainHeight(e.home.x,e.home.z),e.home.z);e.alert=false;});setObjective();}
function saveGame(){
 const data={pos:player.pos.toArray(),yaw:player.yaw,pitch:player.pitch,health:state.health,stamina:state.stamina,batteries:state.batteries,notes:state.notes,quest:state.quest,time:state.time,used:interactables.map(i=>i.used)};
 localStorage.setItem('sunyi-save-v1',JSON.stringify(data));toast('Permainan berhasil disimpan.');sound(540,.16,'sine',.06);
}
function loadGame(){
 try{const d=JSON.parse(localStorage.getItem('sunyi-save-v1'));if(!d)throw 0;player.pos.fromArray(d.pos);player.yaw=d.yaw;player.pitch=d.pitch;for(const k of ['health','stamina','batteries','notes','quest','time'])state[k]=d[k];interactables.forEach((i,n)=>i.used=!!d.used[n]);setObjective();toast('Progres berhasil dimuat.');}catch(e){resetGame();toast('Belum ada save. Memulai permainan baru.');}
}
function pause(){if(!state.started||state.paused)return;state.paused=true;$('pause-menu').classList.remove('hidden');document.exitPointerLock?.();}
function resume(){state.paused=false;$('pause-menu').classList.add('hidden');if(innerWidth>700)renderer.domElement.requestPointerLock?.();}
function updateHUD(){
 $('health-fill').style.width=state.health+'%';$('stamina-fill').style.width=state.stamina+'%';
 $('inventory-mini').textContent=`▣ Baterai: ${state.batteries}　✦ Catatan: ${state.notes}`;
 const mins=Math.floor(state.time/60),hours=(23+Math.floor(mins/60))%24,mm=mins%60;$('clock').textContent=String(hours).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}
function interact(){
 if(!state.nearby)return;const item=state.nearby;
 if(item.used)return;
 if(item.type==='battery'){item.used=true;state.batteries++;toast('Baterai ditemukan. Senter lebih aman sekarang.');sound(680,.12); }
 if(item.type==='note'){item.used=true;state.notes++;toast(state.notes===1?'Catatan: “Jangan ikuti suara lonceng.”':'Catatan: “Pemancar ada di balik rumah paling utara.”');sound(430,.18);if(state.notes>=2&&state.quest<2){state.quest=2;setObjective();}}
 if(item.type==='radio'){
   if(state.notes<2){toast('Butuh setidaknya 2 catatan untuk memahami frekuensi radio.');return;}
   if(state.batteries<1){toast('Pemancar membutuhkan baterai cadangan.');return;}
   item.used=true;item.glow.intensity=4;state.quest=4;setObjective();toast('Sinyal terkirim... tetapi ada yang menjawab.');sound(90,.9,'sawtooth',.13);
   setTimeout(()=>toast('MISI SELESAI — Kebenaran baru saja dimulai.'),1900);
 }
 updateHUD();
}
function nearestInteractable(){
 let best=null,dist=99;for(const i of interactables){if(i.used)continue;const d=player.pos.distanceTo(i.group.position);if(d<i.range&&d<dist){best=i;dist=d;}}
 state.nearby=best;$('interaction').classList.toggle('hidden',!best);
}
function damage(amount){state.health=Math.max(0,state.health-amount);sound(75,.22,'sawtooth',.12);if(state.health<=0){state.dead=true;state.paused=true;$('death-screen').classList.remove('hidden');document.exitPointerLock?.();}}
function updateEnemies(dt){
 for(const e of enemies){
  const p=e.group.position,dx=player.pos.x-p.x,dz=player.pos.z-p.z,d=Math.hypot(dx,dz);
  const visible=d<22&&Math.abs(player.pos.y+1-p.y-1)<5;
  if(visible)e.alert=true;else if(d>38)e.alert=false;
  let vx=0,vz=0;
  if(e.alert&&d>.9){vx=dx/d;vz=dz/d;}else{const a=clock.elapsedTime*.18+e.phase;vx=Math.sin(a)*.35;vz=Math.cos(a)*.35;}
  const speed=e.alert?2.35:0.55;p.x+=vx*speed*dt;p.z+=vz*speed*dt;p.y=terrainHeight(p.x,p.z);
  e.group.rotation.y=Math.atan2(vx,vz);
  e.arms.forEach((a,i)=>a.rotation.x=Math.sin(clock.elapsedTime*5+i)*.45);
  if(d<1.55){e.attack-=dt;if(e.attack<=0){damage(13);e.attack=1.05;toast('Sesuatu mencengkerammu!');}}
 }
}
function resolveCollision(pos){
 for(const c of colliders){const dx=pos.x-c.x,dz=pos.z-c.z,d=Math.hypot(dx,dz),min=c.r+.55;if(d<min&&d>.001){pos.x=c.x+dx/d*min;pos.z=c.z+dz/d*min;}}
 pos.x=THREE.MathUtils.clamp(pos.x,-174,174);pos.z=THREE.MathUtils.clamp(pos.z,-174,174);
}
let moveX=0,moveY=0,lookTouch=null,runTouch=false;
function updatePlayer(dt){
 const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-moveY;
 const strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+moveX;
 const moving=Math.hypot(forward,strafe)>.05,run=(keys.ShiftLeft||runTouch)&&state.stamina>1&&moving;
 const speed=run?7.1:4.2;if(run)state.stamina=Math.max(0,state.stamina-25*dt);else state.stamina=Math.min(100,state.stamina+15*dt);
 const dir=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw));
 const right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
 const desired=dir.multiplyScalar(-forward).add(right.multiplyScalar(strafe));if(desired.length()>1)desired.normalize();
 player.vel.x=THREE.MathUtils.damp(player.vel.x,desired.x*speed, moving?10:14,dt);
 player.vel.z=THREE.MathUtils.damp(player.vel.z,desired.z*speed, moving?10:14,dt);
 const next=player.pos.clone();next.x+=player.vel.x*dt;next.z+=player.vel.z*dt;resolveCollision(next);player.pos.copy(next);player.pos.y=terrainHeight(player.pos.x,player.pos.z);if(state.quest===0&&Math.hypot(player.pos.x,player.pos.z-65)<22){state.quest=1;setObjective();toast('Kamu telah mencapai desa yang ditinggalkan.');}
 player.bob+=dt*(moving?(run?13:8):2);
 avatar.position.copy(player.pos);avatar.rotation.y=player.yaw;
 legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(player.bob+i*Math.PI)*.62:0);
 arms.forEach((a,i)=>a.rotation.x=moving?Math.sin(player.bob+i*Math.PI)*.45:0);
 const eye=player.pos.clone().add(new THREE.Vector3(0,player.height,0));
 if(state.third){
  const offset=new THREE.Vector3(Math.sin(player.yaw)*5,2.3,Math.cos(player.yaw)*5);
  camera.position.copy(eye).add(offset);camera.lookAt(eye.x,eye.y-.2,eye.z);
 }else{camera.position.copy(eye);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.rotation.z=0;}
 // Keep camera from entering the ground.
 flashlight.position.copy(camera.position);const direction=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);flashlight.target.position.copy(camera.position).add(direction.multiplyScalar(10));flashlight.visible=state.flashlight;
 fpRig.visible=!state.third;
 nearestInteractable();updateHUD();
}
function updateWorld(dt){
 state.time+=dt*.45;
 world.children.forEach(o=>{if(o.userData.float)o.position.y=o.userData.base+Math.sin(clock.elapsedTime*2+o.position.x)*.12;});
 for(const i of interactables){if(!i.used&&i.type!=='radio'){i.group.rotation.y+=dt*.5;}}
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);
 if(state.started&&!state.paused&&!state.dead){updatePlayer(dt);updateEnemies(dt);updateWorld(dt);
  const d=Math.min(...enemies.map(e=>player.pos.distanceTo(e.group.position)));
  if(windOsc)windOsc.gain.gain.setTargetAtTime(d<15?.5:.25,audioCtx.currentTime,.5);
 }
 renderer.render(scene,camera);
}
animate();

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape'){if(state.paused)resume();else pause();}if(!state.paused&&e.code==='KeyE')interact();if(!state.paused&&e.code==='KeyF'){state.flashlight=!state.flashlight;sound(300,.06);}if(!state.paused&&e.code==='KeyV'){state.third=!state.third;}});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement&&!state.paused){player.yaw-=e.movementX*.002*state.sensitivity;player.pitch-=e.movementY*.002*state.sensitivity*(state.invertY?-1:1);player.pitch=THREE.MathUtils.clamp(player.pitch,-1.35,1.35);}});
renderer.domElement.addEventListener('click',()=>{if(state.started&&!state.paused&&innerWidth>700)renderer.domElement.requestPointerLock?.();});
$('new-game').onclick=()=>startGame(false);$('continue-game').onclick=()=>startGame(true);
$('open-settings').onclick=()=>{$('main-menu').classList.add('hidden');$('settings-menu').classList.remove('hidden');};
$('pause-settings').onclick=()=>{$('pause-menu').classList.add('hidden');$('settings-menu').classList.remove('hidden');};
$('close-settings').onclick=()=>{$('settings-menu').classList.add('hidden');if(state.started){$('pause-menu').classList.remove('hidden');}else $('main-menu').classList.remove('hidden');};
$('sensitivity').oninput=e=>state.sensitivity=+e.target.value;$('volume').oninput=e=>{state.volume=+e.target.value;if(master)master.gain.value=state.volume;};$('invert-y').onchange=e=>state.invertY=e.target.checked;
$('credits').onclick=()=>{$('main-menu').classList.add('hidden');$('credits-menu').classList.remove('hidden');};$('close-credits').onclick=()=>{$('credits-menu').classList.add('hidden');$('main-menu').classList.remove('hidden');};
$('resume').onclick=resume;$('save-game').onclick=saveGame;$('quit').onclick=()=>{saveGame();state.started=false;state.paused=true;$('hud').classList.add('hidden');showScreen('main-menu');};
$('retry').onclick=()=>startGame(false);$('death-menu').onclick=()=>{state.started=false;$('hud').classList.add('hidden');showScreen('main-menu');};
$('mobile-run').onpointerdown=()=>runTouch=true;$('mobile-run').onpointerup=()=>runTouch=false;
$('mobile-flash').onclick=()=>state.flashlight=!state.flashlight;$('mobile-use').onclick=interact;$('mobile-view').onclick=()=>state.third=!state.third;
const joy=$('joystick'),stick=$('stick');
joy.addEventListener('pointerdown',e=>{joy.setPointerCapture(e.pointerId);joy.dataset.active='1';joyMove(e);});
joy.addEventListener('pointermove',e=>{if(joy.dataset.active)joyMove(e);});
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),m=Math.min(38,len),a=Math.atan2(dy,dx);const x=Math.cos(a)*m,y=Math.sin(a)*m;stick.style.transform=`translate(${x}px,${y}px)`;moveX=x/38;moveY=y/38;}
function joyEnd(){joy.dataset.active='';moveX=moveY=0;stick.style.transform='translate(0,0)';}
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
$('look-zone').addEventListener('pointerdown',e=>{lookTouch={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);});
$('look-zone').addEventListener('pointermove',e=>{if(!lookTouch||lookTouch.id!==e.pointerId)return;const dx=e.clientX-lookTouch.x,dy=e.clientY-lookTouch.y;player.yaw-=dx*.006*state.sensitivity;player.pitch-=dy*.006*state.sensitivity*(state.invertY?-1:1);player.pitch=THREE.MathUtils.clamp(player.pitch,-1.3,1.3);lookTouch.x=e.clientX;lookTouch.y=e.clientY;});
$('look-zone').addEventListener('pointerup',()=>lookTouch=null);$('look-zone').addEventListener('pointercancel',()=>lookTouch=null);
function setupMobile(){if(('ontouchstart'in window)||navigator.maxTouchPoints>0){$('mobile-controls').classList.remove('hidden');$('hint').textContent='Joystick bergerak · Geser kanan untuk melihat · Tombol aksi untuk interaksi';}}
setupMobile();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
$('continue-game').disabled=!localStorage.getItem('sunyi-save-v1');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started&&!state.paused)pause();});
