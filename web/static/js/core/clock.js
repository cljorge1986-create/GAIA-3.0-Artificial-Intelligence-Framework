window.startClock=function(){
  function tick(){const now=new Date();const t=document.getElementById('clockTime');const d=document.getElementById('clockDate');if(t)t.textContent=now.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});if(d)d.textContent=now.toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'});}
  tick();setInterval(tick,1000);
};
