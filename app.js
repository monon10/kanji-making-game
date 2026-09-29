const $=id=>document.getElementById(id);
const screens=['home','setup','handoff','battleDraw','guess','scoreTurn','battleResults','solo'];
function showScreen(id){screens.forEach(x=>$(x).classList.toggle('hidden',x!==id));window.scrollTo({top:0,behavior:'instant'});}
function randomTopic(used){let pool=topics.filter(t=>!used.has(t));if(!pool.length){used.clear();pool=[...topics];}const t=pool[Math.floor(Math.random()*pool.length)];used.add(t);return t;}

function makePad(canvas,brush,brushValue,undo,clear){
  const ctx=canvas.getContext('2d');let strokes=[],current=null,drawing=false;
  const point=e=>{const r=canvas.getBoundingClientRect();const t=e.touches&&e.touches[0]?e.touches[0]:e;return{x:(t.clientX-r.left)*canvas.width/r.width,y:(t.clientY-r.top)*canvas.height/r.height}};
  function drawStroke(s){const p=s.points;if(!p.length)return;ctx.strokeStyle='#111';ctx.fillStyle='#111';ctx.lineWidth=s.size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();if(p.length===1){ctx.arc(p[0].x,p[0].y,s.size/2,0,Math.PI*2);ctx.fill();return}ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.stroke();}
  function redraw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);strokes.forEach(drawStroke);if(undo)undo.disabled=!strokes.length;}
  function start(e){e.preventDefault();drawing=true;current={size:Number(brush.value),points:[point(e)]};strokes.push(current);redraw();}
  function move(e){if(!drawing||!current)return;e.preventDefault();current.points.push(point(e));redraw();}
  function end(){drawing=false;current=null;}
  canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);canvas.addEventListener('mouseleave',end);canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);canvas.addEventListener('touchcancel',end);
  brush.addEventListener('input',()=>brushValue.textContent=brush.value);if(undo)undo.addEventListener('click',()=>{strokes.pop();redraw();});if(clear)clear.addEventListener('click',()=>{strokes=[];redraw();});
  redraw();return{clear(){strokes=[];redraw();},hasInk(){return strokes.length>0;},snapshot(){return canvas.toDataURL('image/png');},setImage(dataUrl){return new Promise(resolve=>{const img=new Image();img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve();};img.src=dataUrl;});},getStrokes(){return structuredClone(strokes);}};
}

const soloPad=makePad($('soloCanvas'),$('soloBrush'),$('soloBrushValue'),$('soloUndo'),$('soloClear'));
const battlePad=makePad($('battleCanvas'),$('battleBrush'),$('battleBrushValue'),$('battleUndo'),$('battleClear'));
let soloTopic='',soloHidden=false,soloUsed=new Set();
$('soloModeBtn').onclick=()=>showScreen('solo');$('battleModeBtn').onclick=()=>{renderNames();showScreen('setup');};document.querySelectorAll('.backHomeBtn').forEach(b=>b.onclick=()=>showScreen('home'));
function setSoloTopic(topic){soloTopic=topic.trim();if(!soloTopic)return;$('soloTopic').textContent=soloTopic;soloHidden=false;$('soloTopic').classList.remove('masked');$('soloToggleTopic').textContent='お題を隠す';}
$('soloNewTopic').onclick=()=>setSoloTopic(randomTopic(soloUsed));
$('soloSetCustomTopic').onclick=()=>{const value=$('soloCustomTopic').value;if(!value.trim()){alert('お題を入力してください。');return;}setSoloTopic(value);};
$('soloCustomTopic').addEventListener('keydown',e=>{if(e.key==='Enter')$('soloSetCustomTopic').click();});
$('soloToggleTopic').onclick=()=>{if(!soloTopic)return;soloHidden=!soloHidden;$('soloTopic').classList.toggle('masked',soloHidden);$('soloToggleTopic').textContent=soloHidden?'お題を表示':'お題を隠す';};

async function exportSoloBlob(){const out=document.createElement('canvas');out.width=1600;out.height=1800;const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,out.width,out.height);o.strokeStyle='#e5e7eb';o.lineWidth=3;o.strokeRect(40,40,1520,1720);o.fillStyle='#111';o.font='700 56px system-ui';o.fillText('漢字作り遊び',90,120);o.fillStyle='#666';o.font='400 30px system-ui';o.fillText('お題',90,200);o.fillStyle='#111';o.font='700 68px system-ui';o.fillText(soloTopic||'（お題なし）',90,290);o.strokeStyle='#ddd';o.strokeRect(90,350,1420,1220);o.drawImage($('soloCanvas'),100,360,1400,1200);return new Promise(r=>out.toBlob(r,'image/png'));}
async function saveSoloPng(){
  if(!soloPad.hasInk()){alert('まず創作漢字を書いてください。');return;}
  const blob=await exportSoloBlob();
  if(!blob){alert('PNG画像の作成に失敗しました。');return;}
  const filename=`sousaku-kanji_${(soloTopic||'kanji').replace(/[\/:*?"<>|]/g,'_')}_${Date.now()}.png`;
  const url=URL.createObjectURL(blob);
  try{const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();}catch(e){window.open(url,'_blank');}
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('soloSave').onclick=saveSoloPng;
$('soloShare').onclick=async()=>{if(!soloPad.hasInk())return;const blob=await exportSoloBlob();const file=new File([blob],'sousaku-kanji.png',{type:'image/png'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:'創作漢字',text:soloTopic?`お題: ${soloTopic}`:'創作漢字'});else await saveSoloPng();};

let setupPlayers=4,setupRounds=2;
function renderNames(){const host=$('playerNames');const old=[...host.querySelectorAll('input')].map(i=>i.value);host.innerHTML='';for(let i=0;i<setupPlayers;i++){const input=document.createElement('input');input.placeholder=`プレイヤー${i+1}`;input.value=old[i]||'';host.appendChild(input);}$('playerCountValue').textContent=setupPlayers;$('roundCountValue').textContent=setupRounds;}
$('playersMinus').onclick=()=>{if(setupPlayers>2){setupPlayers--;renderNames();}};$('playersPlus').onclick=()=>{if(setupPlayers<8){setupPlayers++;renderNames();}};$('roundsMinus').onclick=()=>{if(setupRounds>1){setupRounds--;$('roundCountValue').textContent=setupRounds;}};$('roundsPlus').onclick=()=>{if(setupRounds<5){setupRounds++;$('roundCountValue').textContent=setupRounds;}};

let game=null;
function progressText(){return `${game.turn+1} / ${game.players.length*game.rounds}ターン`;}
function roundText(){return `${Math.floor(game.turn/game.players.length)+1} / ${game.rounds}周`;}
function currentPlayerIndex(){return game.turn%game.players.length;}
function prepareTurn(){const idx=currentPlayerIndex();game.currentTopic=randomTopic(game.usedTopics);game.currentGlyph='';battlePad.clear();$('handoffProgress').textContent=progressText();$('handoffRound').textContent=roundText();$('handoffName').textContent=game.players[idx].name;$('battleProgress').textContent=progressText();$('battleRound').textContent=roundText();$('battlePlayer').textContent=`${game.players[idx].name} の作字`;$('battleTopic').textContent=game.currentTopic;showScreen('handoff');}
$('startBattleBtn').onclick=()=>{const inputs=[...$('playerNames').querySelectorAll('input')];const players=inputs.map((i,n)=>({name:i.value.trim()||`プレイヤー${n+1}`,score:0,create:0,decode:0}));game={players,rounds:setupRounds,turn:0,usedTopics:new Set(),currentTopic:'',currentGlyph:'',history:[]};prepareTurn();};
$('revealTopicBtn').onclick=()=>showScreen('battleDraw');
$('finishGlyphBtn').onclick=()=>{if(!battlePad.hasInk()){alert('まず創作漢字を書いてください。');return;}game.currentGlyph=battlePad.snapshot();$('guessProgress').textContent=progressText();$('guessRound').textContent=roundText();$('guessCanvas').getContext('2d').clearRect(0,0,1200,1200);const img=new Image();img.onload=()=>{$('guessCanvas').getContext('2d').drawImage(img,0,0,1200,1200);};img.src=game.currentGlyph;showScreen('guess');};
$('showAnswerBtn').onclick=()=>{const idx=currentPlayerIndex();$('scoreProgress').textContent=progressText();$('scoreRound').textContent=roundText();$('answerBox').innerHTML=`答え：<strong>${game.currentTopic}</strong><br><span class="tiny">作字者：${game.players[idx].name}</span>`;const host=$('correctPlayers');host.innerHTML='';game.players.forEach((p,i)=>{if(i===idx)return;const label=document.createElement('label');label.className='correct-option';label.innerHTML=`<span>${p.name}</span><input type="checkbox" value="${i}">`;host.appendChild(label);});showScreen('scoreTurn');};
$('applyScoreBtn').onclick=()=>{const author=currentPlayerIndex();const correct=[...$('correctPlayers').querySelectorAll('input:checked')].map(x=>Number(x.value));correct.forEach(i=>{game.players[i].score++;game.players[i].decode++;});game.players[author].score+=correct.length;game.players[author].create+=correct.length;game.history.push({round:Math.floor(game.turn/game.players.length)+1,author,topic:game.currentTopic,correct:[...correct]});game.turn++;if(game.turn>=game.players.length*game.rounds)finishGame();else prepareTurn();};
function finishGame(){const sorted=game.players.map((p,i)=>({...p,i})).sort((a,b)=>b.score-a.score||b.create-a.create||b.decode-a.decode);const top=sorted[0].score;const winners=sorted.filter(p=>p.score===top).map(p=>p.name);$('winnerText').textContent=winners.length===1?`優勝：${winners[0]}（${top}点）`:`同率優勝：${winners.join('・')}（${top}点）`;let html='<table class="result-table"><thead><tr><th>順位 / 名前</th><th>総合</th><th>作字</th><th>解読</th></tr></thead><tbody>';let rank=1;sorted.forEach((p,n)=>{if(n>0&&p.score<sorted[n-1].score)rank=n+1;html+=`<tr class="${p.score===top?'winner':''}"><td><span class="rank">${rank}位</span> ${p.name}</td><td><strong>${p.score}</strong></td><td>${p.create}</td><td>${p.decode}</td></tr>`;});html+='</tbody></table>';$('resultTable').innerHTML=html;showScreen('battleResults');}
$('playAgainBtn').onclick=()=>{game.players.forEach(p=>{p.score=0;p.create=0;p.decode=0;});game.turn=0;game.usedTopics.clear();game.history=[];prepareTurn();};
function quitBattle(){if(confirm('対戦を終了してトップに戻りますか？'))showScreen('home');}$('quitBattleBtn1').onclick=quitBattle;
renderNames();showScreen('home');
