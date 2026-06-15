/* GAIA 2.0 — Módulo: Artemis (APIs externas) */

window.selectApi = function(api, el) {
  document.querySelectorAll('.artemis-api-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('[id^="apiPanel-"]').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('apiPanel-' + api);
  if (panel) panel.style.display = 'block';
};

window.fetchWeather = async function() {
  const city = document.getElementById('weatherCity').value.trim();
  if (!city) return;
  setStatus('A consultar meteorologia…', 'amber');
  try {
    const unit = document.getElementById('weatherUnit').value;
    const r = await fetch(`/api/weather?city=${encodeURIComponent(city)}&units=${unit}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    _renderWeather(d, unit);
    setStatus('Online', 'green');
  } catch(e) {
    setStatus('Erro meteorologia', 'red');
    const empty = document.getElementById('weatherEmpty');
    empty.textContent = 'Erro: ' + e.message;
    empty.style.display = 'block';
    document.getElementById('weatherWidget').style.display = 'none';
  }
};

function _renderWeather(d, unit) {
  const icons = {
    Clear:'☀️', Clouds:'☁️', Rain:'🌧️', Snow:'❄️',
    Thunderstorm:'⛈️', Drizzle:'🌦️', Mist:'🌫️', Fog:'🌫️'
  };
  const isImperial = unit === 'imperial';
  document.getElementById('wIcon').textContent     = icons[d.weather?.[0]?.main] || '🌡️';
  document.getElementById('wTemp').textContent     = Math.round(d.main?.temp ?? d.temp ?? 0);
  document.getElementById('wUnit').textContent     = isImperial ? '°F' : '°C';
  document.getElementById('wDesc').textContent     = d.weather?.[0]?.description || '';
  document.getElementById('wLocation').textContent = `${d.name || ''}, ${d.sys?.country || ''}`;
  document.getElementById('wHumidity').textContent = (d.main?.humidity ?? '--') + '%';
  document.getElementById('wWind').textContent     = Math.round((d.wind?.speed ?? 0) * (isImperial ? 1 : 3.6)) + (isImperial ? ' mph' : ' km/h');
  document.getElementById('wPressure').textContent = (d.main?.pressure ?? '--') + ' hPa';
  document.getElementById('wFeels').textContent    = Math.round(d.main?.feels_like ?? 0) + (isImperial ? '°F' : '°C');
  document.getElementById('weatherWidget').style.display = 'block';
  document.getElementById('weatherEmpty').style.display  = 'none';
}

/* ── Extensão futura de APIs ─────────────────────────────────
   Para adicionar uma nova API (ex: Finance):
   1. Adiciona card no artemis.html com data-api="finance"
   2. Adiciona painel #apiPanel-finance no artemis.html
   3. Adiciona endpoint /api/finance no gaia_server.py
   4. Adiciona função fetchFinance() aqui em baixo
   ─────────────────────────────────────────────────────────── */
