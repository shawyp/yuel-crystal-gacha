(function () {
'use strict';
var $=function(s){return document.querySelector(s);}, $$=function(s){return Array.from(document.querySelectorAll(s));};
var beads=window.CRYSTAL_CATALOG, flowers=window.MINI_FLOWERS, moods=window.MINI_MOODS, demos=window.MINI_DEMOS, shop=window.SHOP;
var selected=[], flower=flowers[0], current=null, currentNote=null, saved=[], filter='all', colFilter='all', done=false, size=shop.wristSizes[0], version=0, ready=false, activeView='gacha', audio=null, audioTimer=null, audioOn=false;
var byId=function(id){return beads.find(function(b){return b.id===id;});};
var moodOf=function(b){return moods.find(function(m){return m.id===b.mood;});};
function el(tag,cl,text){var n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n;}
function img(b){var n=el('img');n.src='./'+b.render;n.alt=b.name;n.draggable=false;return n;}
function text(s,value){$(s).textContent=value;}
function on(s,fn){var n=$(s);if(n)n.addEventListener('click',fn);}
var brewTimer=null,brewing=false;
var toastTimer;function toast(message){clearTimeout(toastTimer);text('#toast',message);$('#toast').classList.add('is-show');$('#toast').style.opacity='1';toastTimer=setTimeout(function(){$('#toast').classList.remove('is-show');$('#toast').style.opacity='0';},2600);}
function mini(){return window.xhs&&window.xhs.miniTool;}
async function initStorage(){var launch=window.xhs&&window.xhs.launchOptions, api=mini();if(!launch&&api&&typeof api.getLaunchOptions==='function'){try{launch=await api.getLaunchOptions();}catch(e){}}version=Math.floor(Number(launch&&launch.miniToolEnv&&launch.miniToolEnv.buildVersion||0)/1000);try{var data;if(version>=9460&&api&&typeof api.getStorage==='function'){var result=await api.getStorage({key:'yuel-mini-collection'});data=result&&result.data;}else data=localStorage.getItem('yuel-mini-collection');var a=data?JSON.parse(data):[];saved=Array.isArray(a)?a.filter(function(x){return x&&byId(x.id)&&typeof x.wish==='string';}).slice(-100):[];}catch(e){saved=[];}ready=true;renderCollection();}
async function persist(){try{var data=JSON.stringify(saved),api=mini();if(version>=9460&&api&&typeof api.setStorage==='function')await api.setStorage({key:'yuel-mini-collection',data:data});else localStorage.setItem('yuel-mini-collection',data);return true;}catch(e){return false;}}
function modal(open){$('#wish-dialog').hidden=!open;$('#open-wish').setAttribute('aria-expanded',String(open));document.body.classList.toggle('modal-open',open);if(open)$('#story-input').focus();else $('#open-wish').focus();}
function stopMusic(){clearTimeout(audioTimer);audioTimer=null;audioOn=false;if(audio&&audio.state==='running')audio.suspend().catch(function(){});text('#ws-sub','点击播放这颗水晶的旋律');}
function playMusic(){var C=window.AudioContext||window.webkitAudioContext;if(!C)return toast('此环境暂不支持音乐');if(audioOn){stopMusic();return;}try{audio=audio||new C();audio.resume().catch(function(){toast('音乐暂不可用');});audioOn=true;var b=current||beads[0],m=moodOf(b),i=0;function tick(){if(!audioOn||document.hidden)return;var osc=audio.createOscillator(),g=audio.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(m.music.root+m.music.scale[(b.seed+i*3)%m.music.scale.length]-69)/12);g.gain.setValueAtTime(0,audio.currentTime);g.gain.linearRampToValueAtTime(.09,audio.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.6);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.65);i++;audioTimer=setTimeout(tick,60000/m.music.bpm);}tick();text('#ws-sub','播放中 · 点击停止');}catch(e){stopMusic();toast('音乐暂不可用');}}
var revealTimer=null;
function reveal(b,note,launch){clearTimeout(revealTimer);currentSaved=false;currentSaving=false;$('#fab-save').disabled=false;$('#fab-save').hidden=false;$('#use-crystal').hidden=true;text('#result-name',b.name);current=b;currentNote=note||null;var m=moodOf(b);$('#model-fallback').src='./'+b.render;$('#model-fallback').alt=b.name;text('#w-mood-line',m.zh+' · '+m.en);text('#w-stone-line',b.name);text('#t-mood',m.zh);text('#t-stone',b.name);text('#t-song',m.songZh);text('#t-bpm',m.music.bpm);text('#w-wish',note?note.wish:m.wish);text('#wish-origin',note?'离线预设样例 · 非 AI 实时生成':'预写祝福 · 随机心意');text('#w-bead-name',b.name);text('#w-bead-id',b.id);text('#w-no',b.id.toUpperCase());text('#w-date',new Date().toLocaleDateString());text('#ws-title',m.songZh);text('#ws-sub','点击播放这颗水晶的旋律');$('#wish-reflection').hidden=!note;text('#wish-reflection',note?note.reflection:'');$('#reveal').classList.add('is-open');$('#reveal').setAttribute('aria-hidden','false');startReveal(!!launch);}
function startReveal(launch){
 var layer=$('#reveal'),ball=$('.reveal-ball'),calm=matchMedia('(prefers-reduced-motion: reduce)').matches;layer.classList.remove('is-ejecting');
 if(launch&&!calm){var r=ball.getBoundingClientRect(),m=$('.mini-machine').getBoundingClientRect(),origin=window.LiveMachine&&!window.LiveMachine.status().disposed?window.LiveMachine.outlet():{x:m.left+m.width/2,y:m.top+m.height*.82};ball.style.setProperty('--launch-x',(origin.x-r.left-r.width/2)+'px');ball.style.setProperty('--launch-y',(origin.y-r.top-r.height/2)+'px');void ball.offsetWidth;layer.classList.add('is-ejecting');revealTimer=setTimeout(function(){revealTimer=null;$('#fab-save').focus({preventScroll:true});},1050);}
 else $('#fab-save').focus({preventScroll:true});
}
function closeReveal(){clearTimeout(revealTimer);revealTimer=null;$('#reveal').classList.remove('is-ejecting');$('#reveal').classList.remove('is-open');$('#reveal').setAttribute('aria-hidden','true');stopMusic();}
function randomBead(launch){var pool=beads.filter(function(b){return filter==='all'||b.mood===filter;});reveal(pool[Math.floor(Math.random()*pool.length)],null,launch===true);}
function navigate(name){cancelBrew();stopMachine();modal(false);closeReveal();activeView=name;$$('.view').forEach(function(v){var yes=v.id==='view-'+name;v.classList.toggle('is-active',yes);v.setAttribute('aria-hidden',String(!yes));});$$('[data-go]').forEach(function(b){b.classList.toggle('is-on',b.dataset.go===name);if(b.dataset.go===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(name==='collection')renderCollection();if(name==='bracelet')syncFlow();window.scrollTo(0,0);}
function makeChips(selector,collection){var wrap=$(selector);wrap.textContent='';[{id:'all',zh:'全部'}].concat(moods).forEach(function(m){var b=el('button','chip'+((collection?colFilter:filter)===m.id?' is-on':''),m.zh);b.type='button';b.addEventListener('click',function(){if(collection){colFilter=m.id;renderCollection();}else{filter=m.id;makeChips(selector,false);if($('#mood-draw'))text('#mood-draw',m.id==='all'?'随机扭一颗':'扭一颗'+m.zh+'水晶');text('#mc-kicker',m.zh);text('#mc-title',m.id==='all'?'随机一颗':m.songZh);text('#mc-sub',m.id==='all'?'六种心情，交给运气':m.wish);}});wrap.appendChild(b);});}
function textPanel(title,value){text('#text-title',title);$('#text-value').value=value;$('#text-overlay').hidden=false;$('#text-value').focus();$('#text-value').select();}
function showDemo(sample){currentNote=sample;var b=byId(sample.beadId);$('#recommendation').hidden=false;text('#recommendation-source','预设演示 · 非实时 AI');text('#recommended-feeling',sample.feeling);text('#recommended-reflection',sample.reflection);$('#recommended-image').src='./'+b.render;text('#recommended-name',b.name);text('#recommended-subtitle',moodOf(b).zh);text('#recommended-reason',sample.reason);$('#story-status').hidden=true;}
function storySubmit(e){e.preventDefault();var sample=demos.find(function(d){return d.text===$('#story-input').value.trim();});if(!sample){$('#recommendation').hidden=true;$('#story-status').hidden=false;text('#story-status','离线版不能分析自由输入。请选择下方心情，或点选一个预设样例。');return;}showDemo(sample);}
function renderFlowers(){var wrap=$('#bl-flowers'),scroll=wrap.scrollLeft;wrap.textContent='';flowers.forEach(function(f){var b=el('button','bl-flower'+(flower.id===f.id?' is-picked':''));b.type='button';b.dataset.flower=f.id;b.setAttribute('aria-pressed',String(flower.id===f.id));b.appendChild(img(f));b.appendChild(el('b','',f.name));b.addEventListener('click',function(){cancelBrew();flower=f;done=false;renderWorkshop();});wrap.appendChild(b);});wrap.scrollLeft=scroll;text('#bl-flower-current',flower.name);}
function renderWorkshop(){renderFlowers();text('#bl-count',selected.length+' / 5');$('#bl-slots').hidden=done;var slots=$('#bl-slots');slots.textContent='';for(var i=0;i<5;i++){(function(index){var b=el('button','bl-slot',selected[index]?undefined:'＋');b.type='button';b.setAttribute('aria-label',selected[index]?'移除'+selected[index].name:'空珠位');if(selected[index])b.appendChild(img(selected[index]));b.addEventListener('click',function(){cancelBrew();selected.splice(index,1);done=false;renderWorkshop();});slots.appendChild(b);})(i);}$('#bl-brew').disabled=selected.length!==5;$('#bl-brew').hidden=done;$('#bl-result').hidden=!done;var grid=$('#bl-grid');grid.textContent='';beads.slice().sort(function(a,b){return Number(saved.some(function(x){return x.id===b.id;}))-Number(saved.some(function(x){return x.id===a.id;}));}).forEach(function(b){var card=el('button','mini-card');card.type='button';card.appendChild(img(b));card.appendChild(el('b','',b.name));var picked=selected.filter(function(x){return x.id===b.id;}).length;card.classList.toggle('is-picked',picked>0);if(picked)card.appendChild(el('span','pick-count',String(picked)));card.addEventListener('click',function(){if(selected.length===5)return toast('已选满 5 颗，点上方珠子可移除');selected.push(b);done=false;renderWorkshop();});grid.appendChild(card);});renderPot();if(done)renderBracelet();else{$('#mini-parts').textContent='';$('.mini-cord').style.display='none';}syncFlow();}
function positions(){var rs=[flower.radius,.22,.22,.22,.22,.22],step=Math.PI*2/(5+flower.span),angles=[-Math.PI/2];for(var i=0;i<5;i++)angles.push(-Math.PI/2+(flower.span/2+.5+i)*step);var r=0;for(i=0;i<6;i++)for(var j=i+1;j<6;j++)r=Math.max(r,(rs[i]+rs[j]+.08)/(2*Math.abs(Math.sin((angles[i]-angles[j])/2))));var scale=46/(r+Math.max.apply(null,rs));return {r:r,scale:scale,rs:rs,angles:angles};}
function renderBracelet(){var p=positions(),parts=[flower].concat(selected),wrap=$('#mini-parts');wrap.textContent='';parts.forEach(function(b,i){var n=img(b),d=p.rs[i]*2*p.scale;n.style.width=d+'%';n.style.height=d+'%';n.style.left=(50+Math.cos(p.angles[i])*p.r*p.scale)+'%';n.style.top=(50+Math.sin(p.angles[i])*p.r*p.scale)+'%';if(i===0&&flower.span===3)n.style.transform='translate(-50%,-50%) rotate(-83deg)';wrap.appendChild(n);});var cord=$('.mini-cord'),d=p.r*p.scale*2;Object.assign(cord.style,{display:'block',width:d+'%',height:d+'%',left:(50-d/2)+'%',top:(50-d/2)+'%'});$('#mini-bracelet').classList.remove('mini-pulse');void $('#mini-bracelet').offsetWidth;$('#mini-bracelet').classList.add('mini-pulse');text('#bl-no','BR-'+String(Date.now()).slice(-8));text('#bl-name','「'+flower.name+'」手链');text('#bl-spec','5 颗原创水晶 + 1 朵'+flower.name+' · 平面渲染图合成');text('#bl-price',shop.price===null?'价格私信询问':'¥ '+shop.price);text('#bl-hint',shop.note);var list=$('#bl-beads');list.textContent='';parts.forEach(function(b){var li=el('li');li.appendChild(img(b));li.appendChild(el('span','',b.name));list.appendChild(li);});var sizes=$('#bl-sizes');sizes.textContent='';shop.wristSizes.forEach(function(v){var b=el('button',v===size?'is-on':'',v+' cm');b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked',String(v===size));b.addEventListener('click',function(){size=v;renderBracelet();});sizes.appendChild(b);});}
function renderCollection(){makeChips('#chips-col',true);var grid=$('#folders');grid.textContent='';beads.filter(function(b){return saved.some(function(x){return x.id===b.id;})&&(colFilter==='all'||b.mood===colFilter);}).forEach(function(b){var items=saved.filter(function(s){return s.id===b.id;}),card=el('button','mini-card'+(items.length?' is-picked':''));card.type='button';card.appendChild(img(b));card.appendChild(el('b','',b.name));card.appendChild(el('small','',items.length?'已收下 '+items.length+' 次':'未收下'));card.addEventListener('click',function(){reveal(b,items.length?items[items.length-1]:null);});grid.appendChild(card);});text('#total',saved.length+' 颗');if($('#collection-empty')){$('#collection-empty').hidden=grid.children.length>0;$('#collection-empty p').textContent=saved.length?'这个心情下，还没有收下的水晶。':'收下的水晶，会留在这里。';}}
async function saveCurrent(){if(currentSaved||currentSaving)return;if(!ready)return toast('正在读取收藏，请稍后');if(!current)return;currentSaving=true;$('#fab-save').disabled=true;saved.push({id:current.id,wish:$('#w-wish').textContent,reflection:currentNote?currentNote.reflection:'',at:Date.now()});saved=saved.slice(-100);var ok=await persist();currentSaving=false;currentSaved=true;$('#fab-save').hidden=true;$('#use-crystal').hidden=false;$('#use-crystal').focus();toast(ok?'已收下这颗水晶':'本次已收下；存储不可用，关闭后可能丢失');}
async function saveCard(){if(!current)return;var api=mini();if(!api||typeof api.saveImageToPhotosAlbum!=='function')return textPanel('心情卡',current.name+'\n'+$('#w-wish').textContent+'\n\n当前环境不支持保存相册。');try{var c=document.createElement('canvas');c.width=600;c.height=760;var g=c.getContext('2d');if(!g)throw Error('canvas');g.fillStyle='#e6efdf';g.fillRect(0,0,600,760);g.fillStyle='#ffffff';g.fillRect(28,28,544,704);g.fillStyle='#426b5a';g.font='24px sans-serif';g.fillText('许愿球 · 给今天的你',60,90);var image=$('#model-fallback');if(image.complete&&image.naturalWidth)g.drawImage(image,130,120,340,340);g.font='30px sans-serif';g.fillText(current.name,60,520);g.font='21px sans-serif';var words=Array.from($('#w-wish').textContent),line='',y=570;words.forEach(function(ch){if(g.measureText(line+ch).width>480){g.fillText(line,60,y);line=ch;y+=34;}else line+=ch;});g.fillText(line,60,y);g.font='14px sans-serif';g.fillText('离线心意 · 非实时 AI 生成',60,704);var data=c.toDataURL('image/png');if(data.length>1398100)throw Error('image-too-large');var path=data;if(typeof api.writeTempFile==='function'){var r=await api.writeTempFile({data:data});path=r.filePath;}await api.saveImageToPhotosAlbum({filePath:path});toast('心情卡已保存到相册');}catch(e){toast('未能保存，请检查相册授权后重试');}}
// Dense original 3D views, bounded decoded-image cache, direct drag and damped release.
var ORBIT_FRAMES=90, machineAngle=0, knobAngle=0, machineBusy=false, machineTimer=null, frameTicket=0, wantedFrame='', frameCache=new Map(), orbitRAF=0, orbitVelocity=0;
function cachedFrame(src){
 var entry=frameCache.get(src);if(entry){frameCache.delete(src);frameCache.set(src,entry);return entry;}
 var im=new Image();entry={image:im,ready:false};frameCache.set(src,entry);
 im.onload=function(){entry.ready=true;if(wantedFrame===src)$('#stage-canvas').src=src;};
 im.onerror=function(){frameCache.delete(src);if(wantedFrame===src)text('#machine-hint','角度暂不可用，仍可点按钮扭一颗');};im.src=src;
 while(frameCache.size>24){var key=frameCache.keys().next().value,old=frameCache.get(key);old.image.onload=null;old.image.onerror=null;frameCache.delete(key);}
 return entry;
}
function machineFrame(mode,index){
 if(window.LiveMachine&&!window.LiveMachine.status().disposed){window.LiveMachine.frame(mode,index);return;}
 var count=mode==='orbit'?ORBIT_FRAMES:24;index=((Math.round(index)%count)+count)%count;
 function path(i){return './assets/rotation/'+mode+'-'+String((i+count)%count).padStart(2,'0')+'.webp';}
 var src=path(index);wantedFrame=src;var frame=cachedFrame(src);if(frame.ready)$('#stage-canvas').src=src;
 for(var d=1;d<=3;d++){cachedFrame(path(index+d));cachedFrame(path(index-d));}
}
function turnMachine(angle){machineAngle=angle;machineFrame('orbit',angle/(360/ORBIT_FRAMES));$('#machine-reset').hidden=Math.abs(((angle%360)+540)%360-180)<3;$('#mini-knob').hidden=Math.abs(((angle%360)+540)%360-180)>12;$('#stage-canvas').setAttribute('aria-valuenow',String(((Math.round(angle/4)*4)%360+360)%360));}
function stopOrbit(){cancelAnimationFrame(orbitRAF);orbitRAF=0;orbitVelocity=0;}
function releaseOrbit(){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||Math.abs(orbitVelocity)<.012)return;
 var last=performance.now();
 function step(now){orbitRAF=0;if(document.hidden||activeView!=='gacha'||machineBusy){stopOrbit();return;}var dt=Math.min(now-last,34);last=now;orbitVelocity*=Math.exp(-dt/125);turnMachine(machineAngle+orbitVelocity*dt);if(Math.abs(orbitVelocity)>.005)orbitRAF=requestAnimationFrame(step);else orbitVelocity=0;}
 orbitRAF=requestAnimationFrame(step);
}
function stopMachine(){stopOrbit();clearTimeout(machineTimer);machineTimer=null;machineBusy=false;$('#auto-twist').disabled=false;$('#mini-knob').disabled=false;}
function dispenseMini(){
 if(machineBusy)return;stopOrbit();machineBusy=true;turnMachine(0);var i=0;$('#auto-twist').disabled=true;$('#mini-knob').disabled=true;text('#machine-hint','把一点好运，转给今天的你…');
 function tick(){if(document.hidden||activeView!=='gacha'){stopMachine();return;}machineFrame('knob',i++);if(i<24){machineTimer=setTimeout(tick,38);}else{machineTimer=setTimeout(function(){stopMachine();knobAngle=0;machineFrame('orbit',0);text('#machine-hint',window.LiveMachine&&!window.LiveMachine.status().disposed?'轻触机身 · 松手回位 · 点旋钮出珠':'左右拖动看机身 · 拧旋钮出珠');randomBead(true);},100);}}
 tick();
}
// Pointer events where available; touch/mouse fallback for older WebViews.
function bindDrag(node,start,move,end){
 var active=false,id=null;
 if(window.PointerEvent){
  node.addEventListener('pointerdown',function(e){if(e.isPrimary===false||e.button>0)return;active=true;id=e.pointerId;start(e.clientX,e.clientY);if(node.setPointerCapture)node.setPointerCapture(id);e.preventDefault();});
  node.addEventListener('pointermove',function(e){if(active&&id===e.pointerId){move(e.clientX,e.clientY);e.preventDefault();}});
  function finish(e){if(active&&id===e.pointerId){active=false;end(e.type!=='pointerup');}}
  node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);node.addEventListener('lostpointercapture',finish);
 }else{
  var touched=0;
  node.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;active=true;touched=Date.now();start(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
  node.addEventListener('touchmove',function(e){if(active&&e.touches.length){move(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}},{passive:false});
  node.addEventListener('touchend',function(){if(active){active=false;end(false);}touched=Date.now();});node.addEventListener('touchcancel',function(){active=false;end(true);});
  node.addEventListener('mousedown',function(e){if(e.button||Date.now()-touched<700)return;active=true;start(e.clientX,e.clientY);e.preventDefault();});
  window.addEventListener('mousemove',function(e){if(active&&Date.now()-touched>700)move(e.clientX,e.clientY);});window.addEventListener('mouseup',function(){if(active&&Date.now()-touched>700){active=false;end(false);}});
 }
}
function initMachine(){
 var lastX=0,accept=false,prev=0,travel=0,lastKnobEnd=0,knobRect;
 var lastMove=0;
 $('#stage-canvas').setAttribute('aria-valuemax','356');
 machineFrame('orbit',0);
 bindDrag($('#stage-canvas'),function(x){stopOrbit();lastX=x;lastMove=performance.now();accept=!machineBusy;},function(x){
  if(!accept||machineBusy)return;var now=performance.now(),dt=Math.max(8,now-lastMove),delta=-(x-lastX)*.48;
  orbitVelocity=orbitVelocity*.3+Math.max(-.55,Math.min(.55,delta/dt))*.7;
  turnMachine(machineAngle+delta);lastX=x;lastMove=now;
 },function(cancelled){if(!accept)return;accept=false;if(cancelled||performance.now()-lastMove>90){stopOrbit();return;}releaseOrbit();});
 bindDrag($('#mini-knob'),function(x,y){accept=!machineBusy;knobRect=$('#mini-knob').getBoundingClientRect();prev=Math.atan2(y-knobRect.top-knobRect.height/2,x-knobRect.left-knobRect.width/2);travel=0;},function(x,y){
  if(!accept||machineBusy)return;var a=Math.atan2(y-knobRect.top-knobRect.height/2,x-knobRect.left-knobRect.width/2),d=a-prev;prev=a;if(d>Math.PI)d-=Math.PI*2;if(d< -Math.PI)d+=Math.PI*2;travel+=Math.abs(d);knobAngle=Math.max(0,knobAngle+d);machineFrame('knob',knobAngle/(Math.PI*2)*24);text('#machine-hint','顺时针拧一圈 · '+Math.min(100,Math.round(knobAngle/(Math.PI*2)*100))+'%');if(knobAngle>=Math.PI*2-.1){accept=false;dispenseMini();}
 },function(cancelled){lastKnobEnd=Date.now();if(!cancelled&&accept&&travel<.15)dispenseMini();accept=false;});
 $('#mini-knob').addEventListener('click',function(){if(Date.now()-lastKnobEnd>400)dispenseMini();});
 on('#machine-reset',function(){if(!machineBusy){stopOrbit();knobAngle=0;turnMachine(0);text('#machine-hint',window.LiveMachine&&!window.LiveMachine.status().disposed?'轻触机身 · 松手回位 · 点旋钮出珠':'左右拖动看机身 · 拧旋钮出珠');}});
 $('#stage-canvas').addEventListener('keydown',function(e){if(machineBusy)return;stopOrbit();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turnMachine(machineAngle+(e.key==='ArrowLeft'?-10:10));}else if(e.key==='Enter'||e.key===' '){e.preventDefault();dispenseMini();}else if(e.key==='Home'){e.preventDefault();turnMachine(0);}});
 $('#stage-canvas').addEventListener('dragstart',function(e){e.preventDefault();});
}
function renderPot(){
 $('.mini-pot').hidden=done;$('#pot-caption').hidden=done;$('#mini-bracelet').hidden=!done;
 text('#pot-caption','5 颗水晶 + 1 朵'+flower.name);
 text('#bl-brew',selected.length===5?'合成我的手链 ✦':'还差 '+(5-selected.length)+' 颗水晶');
 var wrap=$('#pot-beads');wrap.textContent='';selected.forEach(function(b,i){var n=img(b);n.style.left=(12+i*15)+'%';n.style.top=(i%2?4:-4)+'px';wrap.appendChild(n);});
}
function cancelBrew(){clearTimeout(brewTimer);brewTimer=null;brewing=false;$('.bl-stage').classList.remove('is-brewing');$('#bl-brew').disabled=selected.length!==5;}
function brewMini(){if(selected.length!==5||brewing)return;brewing=true;$('.bl-stage').classList.add('is-brewing');$('#bl-brew').disabled=true;text('#bl-brew','一点点魔法正在发生…');brewTimer=setTimeout(function(){cancelBrew();done=true;renderWorkshop();$('.bl-stage').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});toast('你的手链合成好了');},850);}

// One primary action per screen; retain offline disclosures where relevant.
var workshopStep=0,currentSaved=false,currentSaving=false;
function flowButton(id,label,fn){var b=el('button','flow-primary',label);b.type='button';b.id=id;b.addEventListener('click',fn);return b;}
function setupFlow(){
 $('.stage-caption').innerHTML='<h1>给今天，<br>扭一点好运。</h1>';
 $('#auto-twist').textContent='扭一颗水晶 ↻';
 $('#open-wish').innerHTML='<span>按心情挑选</span><span aria-hidden="true">＋</span>';
 $('.stage-picker summary').innerHTML='<span>选一种心情</span><span aria-hidden="true">＋</span>';
 // Mood selection stays inside the optional popup, not beside the primary CTA.
 var picker=$('.stage-picker');picker.classList.remove('stage-picker');$('.wish-dialog .panel').appendChild(picker);
 $('.story-intro h2').textContent='选一种今天的心情';$('.story-intro .lede').textContent='也可以试试下面的情景示例。';
 $('#story-form').hidden=true;
 var examples=$('#story-examples');examples.parentNode.removeChild(examples);$('.story-intro').appendChild(examples);
 $('.story-intro').appendChild($('#story-privacy'));$('#story-privacy').textContent='预设情景，非实时 AI。';
 picker.open=true;$('.story-intro').insertBefore(picker,examples);picker.appendChild(flowButton('mood-draw','按这个心情扭一颗',function(){modal(false);dispenseMini();}));
 var demo=el('details','flow-demo');demo.appendChild(el('summary','','试试情景推荐'));demo.appendChild(examples);demo.appendChild($('#story-privacy'));demo.appendChild($('#recommendation'));$('.story-intro').appendChild(demo);$('#tone-adjust').hidden=true;
 demo.addEventListener('toggle',function(){$('#mood-draw').hidden=demo.open;});
 var originalModal=modal;modal=function(open){originalModal(open);if(open)$('#close-wish').focus();};
 $('#machine-reset').hidden=true;
 var workshop=$('#view-bracelet');workshop.classList.add('single-workshop');
 var tray=el('div','flow-tray');tray.id='selection-tray';workshop.insertBefore(tray,$('#bl-picker'));tray.appendChild($('#bl-slots'));
 var actions=el('div','workshop-actions');actions.appendChild($('#bl-brew'));workshop.appendChild(actions);
 $('#view-bracelet .title').textContent='做一条自己的手链';$('.bl-flower-picker h2').textContent='挑一朵喜欢的花';$('#bl-picker h2').textContent='选5颗水晶';$('#bl-random').textContent='帮我搭配';$('#bl-picker-note').textContent='点珠子加入，点上方珠位移除。';$('#bl-order').textContent='查看定制信息';$('#bl-again').textContent='重新搭配';
 var resultTitle=el('h2','flow-result-name');resultTitle.id='result-name';$('#wish').insertBefore(resultTitle,$('.w-model'));
 var ball=$('.w-model');ball.classList.add('reveal-ball');$('.reveal-inner').insertBefore(ball,$('#wish'));$('#reveal').setAttribute('role','dialog');$('#reveal').setAttribute('aria-modal','true');$('#reveal').setAttribute('aria-label','你的水晶与祝福');
 var next=flowButton('use-crystal','用它做手链 →',function(){if(!current)return;if(selected.length<5&&!selected.some(function(b){return b.id===current.id;}))selected.push(current);done=false;workshopStep=0;renderWorkshop();navigate('bracelet');});next.hidden=true;$('#fabs').insertBefore(next,$('#fab-share'));
 text('#fab-save em','收下这颗水晶');$('#fab-back').setAttribute('aria-label','返回');text('#fab-back em','返回');
 on('#bl-again',function(){workshopStep=0;syncFlow();window.scrollTo(0,0);});
 var empty=el('div','flow-empty');empty.id='collection-empty';empty.appendChild(el('p','','收下的水晶，会留在这里。'));empty.appendChild(flowButton('collection-start','去扭一颗 →',function(){navigate('gacha');}));$('#folders').parentNode.insertBefore(empty,$('#folders'));
 syncFlow();renderCollection();
}
function syncFlow(){
 if(!$('.single-workshop'))return;
 $('.bl-stage').classList.toggle('is-done',done);$('#bl-random').disabled=selected.length===5;
 $('.bl-flower-picker').hidden=false;$('#bl-picker').hidden=false;$('.bl-stage').hidden=false;$('#bl-result').hidden=!done;$('#selection-tray').hidden=false;$('#bl-slots').hidden=false;
 $('.workshop-actions').hidden=done;$('#bl-brew').disabled=selected.length!==5||brewing;
}

function init(){text('#ai-mode','离线演示');text('#story-privacy','本版不联网。自由输入不会发送；只有预设样例可演示推荐。');text('#story-submit-text','查看预设演示');$('#loading').classList.add('is-done');$('#loading').hidden=true;$('#recommendation-another').hidden=true;$('#recommendation-hint').textContent='由你决定喜欢哪种心情。';$('#tone-adjust').hidden=false;var tones=$('#tone-options');moods.forEach(function(m){var b=el('button','chip',m.zh);b.type='button';b.addEventListener('click',function(){filter=m.id;modal(false);randomBead();});tones.appendChild(b);});$('#story-examples').textContent='';demos.forEach(function(d){var b=el('button','story-example',d.label);b.type='button';b.addEventListener('click',function(){$('#story-input').value=d.text;$('#story-submit').disabled=false;showDemo(d);});$('#story-examples').appendChild(b);});$('#story-input').addEventListener('input',function(){text('#story-count',this.value.length+' / 300');$('#story-submit').disabled=this.value.trim().length<2;$('#recommendation').hidden=true;});$('#story-form').addEventListener('submit',storySubmit);$$('[data-go]').forEach(function(b){b.addEventListener('click',function(){navigate(b.dataset.go);});});on('#open-wish',function(){modal(true);});on('#close-wish',function(){modal(false);});initMachine();on('#auto-twist',dispenseMini);on('#recommendation-twist',function(){var d=currentNote;modal(false);if(d)reveal(byId(d.beadId),d);});on('#recommendation-adjust',function(){$('#tone-adjust').hidden=false;});on('#fab-back',closeReveal);on('#fab-again',function(){closeReveal();dispenseMini();});on('#fab-save',saveCurrent);on('#fab-share',saveCard);on('#wish-copy',function(){textPanel('给今天的你',$('#w-wish').textContent);});on('#text-close',function(){$('#text-overlay').hidden=true;});on('#w-song',playMusic);on('#mc-play',playMusic);on('#sound',playMusic);on('#sound-top',playMusic);on('#bl-random',function(){cancelBrew();while(selected.length<5)selected.push(beads[Math.floor(Math.random()*beads.length)]);done=false;renderWorkshop();});on('#bl-brew',brewMini);on('#bl-again',function(){selected=[];done=false;renderWorkshop();});on('#bl-order',function(){textPanel('手链订单信息',[shop.name,$('#bl-no').textContent,'花：'+flower.name,'水晶：'+selected.map(function(b){return b.name+'（'+b.id+'）';}).join('、'),'手围：'+size+' cm',shop.price===null?'价格私信询问':'价格：'+shop.price+' 元',shop.contact,shop.note].filter(Boolean).join('\n'));});document.addEventListener('keydown',function(e){if(e.key==='Escape'){modal(false);closeReveal();$('#text-overlay').hidden=true;}});document.addEventListener('visibilitychange',function(){document.body.classList.toggle('is-paused',document.hidden);if(document.hidden){clearTimeout(revealTimer);revealTimer=null;$('#reveal').classList.remove('is-ejecting');cancelBrew();stopMachine();stopMusic();clearTimeout(toastTimer);}});makeChips('#chips',false);renderWorkshop();renderCollection();initStorage();}
init();
setupFlow();
window.YuelApp={navigate:navigate};
})();
