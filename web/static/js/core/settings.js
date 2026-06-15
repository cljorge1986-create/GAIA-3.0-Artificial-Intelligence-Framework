const GAIA_DEFAULT_SETTINGS = { theme:'green-blue', profile:'WARM', lang:'pt', voiceEnabled:false, memoryEnabled:true, canvasEnabled:true };
const PROFILE_TAGLINES = { WARM:'Olá! Como posso ajudar hoje?', DIRECT:'Diz o que precisas.', STRICT:'Aguardo a sua solicitação.', MECHANICAL:'INPUT REQUIRED.', ANALYTICAL:'Pronto para processar dados.' };
window.gSettings = { ...GAIA_DEFAULT_SETTINGS };
window.loadSettingsFromStorage = function() {
  try { const s=localStorage.getItem('gaiaSettings'); if(s) window.gSettings={...GAIA_DEFAULT_SETTINGS,...JSON.parse(s)}; } catch(e){}
  applySettings();
};
window.applySettings = function() {
  document.documentElement.setAttribute('data-theme', gSettings.theme);
  const cv=document.getElementById('gaiaCanvas'); if(cv) cv.style.display=gSettings.canvasEnabled?'':'none';
  const pb=document.getElementById('chatProfileBadge'); if(pb) pb.textContent=gSettings.profile;
  const cw=document.querySelector('.chat-welcome p'); if(cw) cw.textContent=PROFILE_TAGLINES[gSettings.profile]||'';
  const sl=document.getElementById('settingsLang'); if(sl) sl.value=gSettings.lang;
  ['voiceToggle','memoryToggle','canvasToggle'].forEach(id => { const k=id.replace('Toggle','Enabled'); const el=document.getElementById(id); if(el) el.classList.toggle('on',!!gSettings[k]); });
  document.querySelectorAll('.theme-option').forEach(el=>el.classList.toggle('selected',el.dataset.theme===gSettings.theme));
  document.querySelectorAll('.profile-option').forEach(el=>el.classList.toggle('selected',el.dataset.profile===gSettings.profile));
};
window.openSettings=()=>document.getElementById('settingsOverlay').classList.add('open');
window.closeSettings=()=>document.getElementById('settingsOverlay').classList.remove('open');
window.closeSettingsIfOutside=e=>{if(e.target===document.getElementById('settingsOverlay'))closeSettings();};
window.setTheme=function(t,el){gSettings.theme=t;document.documentElement.setAttribute('data-theme',t);document.querySelectorAll('.theme-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');};
window.setProfile=function(p,el){gSettings.profile=p;document.querySelectorAll('.profile-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');};
window.toggleSetting=function(id,key){gSettings[key]=!gSettings[key];const el=document.getElementById(id);if(el)el.classList.toggle('on',gSettings[key]);};
window.saveSettings=function(){try{localStorage.setItem('gaiaSettings',JSON.stringify(gSettings));}catch(e){}applySettings();closeSettings();setStatus('Configurações guardadas','green');};
window.resetSettings=function(){window.gSettings={...GAIA_DEFAULT_SETTINGS};applySettings();};
