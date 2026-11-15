/* =====================================================================
   Démarrage : choix du stockage, chargement, synchronisation
   ===================================================================== */
const withTimeout = (p, ms) => Promise.race([p, sleep(ms).then(() => null)]);
async function boot() {
  S.ui.sit = lsGet('sit', null);
  $('#app').innerHTML = `<div class="home"><section class="hero" style="padding-bottom:60px"><div class="in-hero"><div class="ttl"><div class="eyebrow">Secrétariat des évaluations</div><h1>AI721 <em>ASTRA LUZ</em> 2.0</h1><p>Ouverture de la base de données…</p></div></div></section></div>`;
  let db = null;
  if (window.claude && typeof window.claude.use === 'function') {
    const [d, dl, u] = await Promise.all([withTimeout(window.claude.use('db').catch(() => null), 9000), withTimeout(window.claude.use('downloads').catch(() => null), 9000), withTimeout(window.claude.use('user').catch(() => null), 9000)]);
    db = d; S.caps.downloads = dl; S.caps.user = u;
    if (u) { try { S.caps.userId = await u.id(); } catch (e) { } }
  }
  const fcfg = !db && typeof cloudConfig === 'function' ? cloudConfig() : null;
  if (fcfg && !lsGet('demo', false)) {
    window.addEventListener('hashchange', () => { if (S.mode === 'cloud' && CLOUD.profile) route(); });
    registerSW();
    try { await cloudBoot(fcfg); return; }
    catch (e) { console.error(e); setTimeout(() => toast('Base en ligne indisponible (' + (e.message || e) + ') : ouverture en base locale.', 'bad'), 400); }
  }
  if (fcfg && lsGet('demo', false)) S.cloudDemo = true;
  if (db) {
    S.store = new SharedStore(db); S.mode = 'shared';
    try { const ok = await Promise.race([loadAll().then(() => true), sleep(15000).then(() => false)]); if (!ok) throw new Error('délai dépassé'); }
    catch (e) { console.warn(e); S.store = await new LocalStore('reel').open(); S.mode = 'local'; await loadAll(); setTimeout(() => toast('Base partagée injoignable : travail en base locale. Pensez à sauvegarder.', 'bad'), 400); }
  } else { S.store = await new LocalStore('reel').open(); S.mode = 'local'; await loadAll(); }
  if (S.store.volatile) setTimeout(() => toast('Ce navigateur bloque le stockage local : les données seront perdues à la fermeture. Sauvegardez régulièrement.', 'bad'), 600);
  if (S.mode === 'shared') subscribeShared();
  if (lsGet('demo', false)) { S.realStore = S.store; S.realMode = S.mode; const st = await new LocalStore('demo').open(); S.store = st; S.mode = 'demo'; await loadAll(); if (!Object.keys(S.evals).length) { await buildDemo(); await loadAll(); } }
  if (!S.ui.sit) S.ui.sit = S.settings.sitCourante || 1;
  if (S.ui.level && S.ui.level !== 'all' && !levelById(S.ui.level)) S.ui.level = null;
  window.addEventListener('hashchange', route);
  registerSW();
  route();
}
/* Application installable (PWA) : uniquement sur le site hébergé */
function registerSW() {
  try { if (!window.ASTRA_WEB || !('serviceWorker' in navigator) || location.protocol !== 'https:' || registerSW.done) return; registerSW.done = true; navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
}
function subscribeShared() {
  const st = S.store;
  st.subscribe('classes', docs => { if (S.store !== st) return; S.classes = {}; docs.forEach(d => S.classes[d.id] = clone(d.data)); rerender(); });
  st.subscribe('evals', docs => { if (S.store !== st) return; const next = {}; docs.forEach(d => next[d.id] = clone(d.data)); S.evals = next; rerender(); });
  st.subscribe('cfg', docs => { if (S.store !== st) return; docs.forEach(d => { const v = clone(d.data); if (d.id === 'settings') { S.settings = deepMerge(clone(DEFAULT_SETTINGS), v); if (!S.settings.logo) S.settings.logo = DEFAULT_LOGO; } if (d.id === 'subjects') S.subjects = v.list || []; if (d.id === 'teachers') S.teachers = v.list || []; if (d.id === 'rooms') S.rooms = v.list || []; if (d.id === 'security') S.security = v; }); if (docs.some(d => d.id === 'settings')) S.initialized = true; rerender(); });
}
/* Ne pas redessiner sous les doigts de l'utilisateur pendant une saisie */
document.addEventListener('focusin', ev => { S.ui.busyForm = !!ev.target.closest('.scan-zone, .modal, #sv-body, form, #mt-body'); });
document.addEventListener('focusout', () => { setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) S.ui.busyForm = false; }, 50); });
boot().catch(e => { console.error(e); $('#app').innerHTML = `<div style="padding:24px"><h2>Démarrage impossible</h2><p>${esc(e.message)}</p></div>`; });
