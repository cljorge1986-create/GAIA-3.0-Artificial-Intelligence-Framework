let gaiaVoiceLock=true,_pulseActive=true;
window.speakGAIA=function(text){
  if(gaiaVoiceLock||!window.gSettings?.voiceEnabled)return;
  gaiaVoiceLock=true;_pulseActive=true;
  const u=new SpeechSynthesisUtterance(text);u.lang=gSettings.lang==='pt'?'pt-PT':gSettings.lang;
  const go=()=>{const voices=speechSynthesis.getVoices();const v=voices.find(v=>v.lang.startsWith(gSettings.lang));if(v)u.voice=v;speechSynthesis.cancel();speechSynthesis.speak(u);};
  u.onend=()=>{_pulseActive=false;gaiaVoiceLock=false;clearVoiceBars();};
  _startVoiceBars();
  if(speechSynthesis.getVoices().length===0)speechSynthesis.onvoiceschanged=go;else go();
};
function _startVoiceBars(){const box=document.getElementById('voiceViz');if(!box)return;box.innerHTML='';for(let i=0;i<22;i++){const b=document.createElement('div');b.className='bar';b.style.height=(10+Math.random()*50)+'px';box.appendChild(b);}const loop=setInterval(()=>{if(!_pulseActive){clearInterval(loop);clearVoiceBars();return;}[...box.children].forEach(b=>b.style.height=(10+Math.random()*50)+'px');},120);}
window.clearVoiceBars=function(){const b=document.getElementById('voiceViz');if(b)b.innerHTML='';};
let mediaRecorder,audioChunks=[];
window.startRecording=async function(){
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});audioChunks=[];mediaRecorder=new MediaRecorder(stream);
  if(window.appendChatMsg)appendChatMsg('🎤 A gravar…','user');
  mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
  mediaRecorder.onstop=async()=>{try{const blob=new Blob(audioChunks,{type:'audio/webm'});const ab=await blob.arrayBuffer();const ac=new(window.AudioContext||window.webkitAudioContext)();const buf=await ac.decodeAudioData(ab);const wav=_audioToWav(buf);const fd=new FormData();fd.append('audio',wav,'voice.wav');const res=await fetch('/api/chat',{method:'POST',body:fd});const data=await res.json();if(data.type==='voice'&&window.appendChatMsg){appendChatMsg(data.response.text,'user');appendChatMsg(data.response.reply,'gaia');speakGAIA(data.response.reply);}}catch(err){if(window.appendChatMsg)appendChatMsg('Erro áudio: '+err.message,'error');}};
  mediaRecorder.start();setTimeout(()=>mediaRecorder?.stop(),4000);}catch(e){if(window.appendChatMsg)appendChatMsg('Microfone: '+e.message,'error');}
};
function _audioToWav(buffer){const nc=buffer.numberOfChannels,len=buffer.length*nc*2+44;const ab=new ArrayBuffer(len);const v=new DataView(ab);let o=0;const ws=s=>{for(let i=0;i<s.length;i++)v.setUint8(o++,s.charCodeAt(i));};const w16=x=>{v.setUint16(o,x,true);o+=2;};const w32=x=>{v.setUint32(o,x,true);o+=4;};ws('RIFF');w32(len-8);ws('WAVE');ws('fmt ');w32(16);w16(1);w16(nc);w32(buffer.sampleRate);w32(buffer.sampleRate*nc*2);w16(nc*2);w16(16);ws('data');w32(len-o-4);const ch=[];for(let i=0;i<nc;i++)ch.push(buffer.getChannelData(i));for(let i=0;i<buffer.length;i++)for(let c=0;c<nc;c++){let s=Math.max(-1,Math.min(1,ch[c][i]));s=s<0?s*0x8000:s*0x7FFF;v.setInt16(o,s,true);o+=2;}return new Blob([ab],{type:'audio/wav'});}
