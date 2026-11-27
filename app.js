/* ===== LUX WALLPAPERS — app.js =====
   Admin: sign in with the owner email (footer link), type the passcode in the
   search bar, or triple-tap the LUX logo. Red X buttons then remove walls for
   everyone (commits to main via the GitHub API). Browsing stays free for all. */

const $ = id => document.getElementById(id);
const grid = $('grid'), sentinel = $('sentinel'), toast = $('toast');

const ADMIN_PASS = 'doomiscoming';
const ADMIN_EMAILS = ['itroll5449@gmail.com'];
const API_FILE = 'app.js';
let adminMode = false;

function openAdminLogin() {
  $('adminModal').classList.add('open');
  setTimeout(() => $('adminPass').focus(), 60);
}
function grantAdmin(msg) {
  adminMode = true;
  localStorage.setItem('luxAdmin', '1');
  document.body.classList.add('admin');
  $('adminModal').classList.remove('open');
  showToast(msg);
}

$('signinLink').addEventListener('click', () => {
  $('signinModal').classList.add('open');
  setTimeout(() => $('signinEmail').focus(), 60);
});
$('signinCancel').addEventListener('click', () => { $('signinModal').classList.remove('open'); });
$('signinOk').addEventListener('click', trySignin);
$('signinEmail').addEventListener('keydown', e => { if (e.key === 'Enter') trySignin(); });
function trySignin() {
  const email = $('signinEmail').value.trim().toLowerCase();
  if (!email.includes('@') || !email.includes('.')) { showToast('Enter a valid email'); return; }
  localStorage.setItem('luxUser', email);
  $('signinModal').classList.remove('open');
  $('signinEmail').value = '';
  if (ADMIN_EMAILS.includes(email)) {
    grantAdmin('🔴 ADMIN MODE ON — red ✕ buttons remove walls for everyone');
  } else {
    showToast('Signed in — enjoy the walls!');
  }
}

let logoTaps = 0, logoResetTimer = null, pickerTimer = null;
$('homeBtn').addEventListener('click', () => {
  logoTaps++;
  clearTimeout(logoResetTimer);
  clearTimeout(pickerTimer);
  logoResetTimer = setTimeout(() => { logoTaps = 0; }, 900);
  if (logoTaps >= 3) {
    logoTaps = 0;
    openAdminLogin();
  } else {
    pickerTimer = setTimeout(showPicker, 450);
  }
});
$('adminCancel').addEventListener('click', () => { $('adminModal').classList.remove('open'); $('adminPass').value = ''; });
$('adminOk').addEventListener('click', tryAdminLogin);
$('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') tryAdminLogin(); });
function tryAdminLogin() {
  if ($('adminPass').value.trim() === ADMIN_PASS) {
    grantAdmin('🔴 ADMIN MODE ON — red ✕ buttons remove walls for everyone');
  } else {
    $('adminPass').value = '';
    showToast('❌ Wrong passcode');
  }
}
if (localStorage.getItem('luxAdmin') === '1') {
  adminMode = true;
  document.body.classList.add('admin');
}

async function deleteWall(id, cardEl, isDoom) {
  if (!adminMode) return;
  if (!confirm('Remove this wallpaper from the site for everyone?')) return;
  let token = localStorage.getItem('luxToken');
  if (!token) {
    token = prompt('Paste your GitHub token (public_repo scope).\nSaved only on this device — never in the public code.\nCreate one at: github.com/settings/tokens/new?scopes=public_repo');
    if (!token) return;
    localStorage.setItem('luxToken', token.trim());
  }
  cardEl.style.opacity = '.4';
  try {
    const auth = { 'Authorization': 'Bearer ' + localStorage.getItem('luxToken'), 'Accept': 'application/vnd.github+json' };
    const res = await fetch('https://api.github.com/repos/luxwalls/luxwall/contents/' + API_FILE + '?ref=main', { headers: auth });
    const meta = await res.json();
    if (!meta.content || !meta.sha) throw new Error('read failed');
    /* decode as UTF-8 — atob alone mangles em-dashes and breaks matching */
    const bin = atob(meta.content.replace(/\s/g, ''));
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const text = new TextDecoder().decode(u8);
    let re;
    if (isDoom) {
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp("\\{\\s*t:'" + esc + "'[\\s\\S]*?\\},\\s*");
    } else {
      re = new RegExp('\\["' + id + '"[^\\]]*\\],?\\s*');
    }
    if (!re.test(text)) throw new Error('wall not found in catalog');
    text = text.replace(re, '').replace(/,\s*,/g, ',').replace(/\[\s*,/, '[').replace(/,\s*\]/g, ']');
    const put = await fetch('https://api.github.com/repos/luxwalls/luxwall/contents/' + API_FILE, {
      method: 'PUT', headers: auth,
      body: JSON.stringify({ message: 'Admin: remove wallpaper ' + id, content: btoa(unescape(encodeURIComponent(text))), sha: meta.sha, branch: 'main' })
    });
    if (!put.ok) throw new Error('commit failed');
    if (isDoom) {
      const di = DOOMS.findIndex(d => d.t === id);
      if (di > -1) DOOMS.splice(di, 1);
      renderDoom();
    } else {
      const wi = WALLS.findIndex(w => w[0] === id);
      if (wi > -1) WALLS.splice(wi, 1);
      $('statCount').textContent = WALLS.length + '+';
      filtered = filtered.filter(w => w[0] !== id);
    }
    cardEl.remove();
    showToast('✅ Removed for everyone — live in ~1 min');
  } catch (err) {
    cardEl.style.opacity = '1';
    if (err && (err.message === 'read failed' || err.message === 'commit failed')) {
      localStorage.removeItem('luxToken');
      showToast('❌ Bad token — cleared. Tap ✕ again and paste a fresh one');
    } else {
      showToast('❌ Delete failed — check connection');
    }
  }
}

/* ===== SPLASH ===== */
const luxWord = $('luxWord');
let li = 0;
['Lux', 'Wallpapers'].forEach((word, wi) => {
  const w = document.createElement('span');
  w.className = 'wrd';
  word.split('').forEach(ch => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.animationDelay = (0.1 + li++ * 0.045) + 's';
    w.appendChild(s);
  });
  luxWord.appendChild(w);
  if (wi === 0) {
    const sp = document.createElement('span');
    sp.className = 'sp';
    luxWord.appendChild(sp);
  }
});
setTimeout(() => {
  $('splash').classList.add('gone');
  setTimeout(() => $('splash').remove(), 1000);
  showPicker();
  setTimeout(() => { $('movieNote').classList.add('show'); }, 1200);
}, 2500);

/* ===== DOOMS DATA ===== */
const DOOM_IMG = 'https://c4.wallpaperflare.com/wallpaper/863/579/692/doctor-doom-avengers-doomsday-green-light-hd-wallpaper-preview.jpg';
const DOOMS = [
  { t:'Doctor Doom — Green Light', res:'1672x941',
    img:'https://c4.wallpaperflare.com/wallpaper/863/579/692/doctor-doom-avengers-doomsday-green-light-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/doctor-doom-avengers-doomsday-green-light-wallpaper-ylyaz' },
  { t:'Avengers Assemble — MCU', res:'1440x2565',
    img:'https://c4.wallpaperflare.com/wallpaper/245/815/696/marvel-avengers-marvel-cinematic-universe-marvel-comics-avengers-doomsday-avengers-endgame-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/marvel-avengers-marvel-cinematic-universe-marvel-comics-avengers-doomsday-wallpaper-ylwif' },
  { t:'Doom vs Thor & Bucky', res:'3840x2160',
    img:'https://c4.wallpaperflare.com/wallpaper/943/37/78/marvel-cinematic-universe-avengers-doomsday-dr-doom-bucky-barnes-thor-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/marvel-cinematic-universe-avengers-doomsday-dr-doom-bucky-barnes-wallpaper-jnsyc' },
  { t:'Doctor Doom — Cloaked', res:'3840x2160',
    img:'https://c4.wallpaperflare.com/wallpaper/255/267/806/marvel-cinematic-universe-avengers-doomsday-dr-doom-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/marvel-cinematic-universe-avengers-doomsday-dr-doom-wallpaper-jnsyp' },
  { t:'Doctor Doom — Wide Angle', res:'2560x1440',
    img:'https://c4.wallpaperflare.com/wallpaper/964/289/195/doctor-doom-wide-angle-marvel-comics-closeup-digital-art-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/doctor-doom-wide-angle-marvel-comics-closeup-digital-art-wallpaper-jnsgk' },
  { t:'Doom Mask — Frontal', res:'3840x2160',
    img:'https://c4.wallpaperflare.com/wallpaper/157/653/233/dr-doom-doctor-doom-digital-art-frontal-view-artwork-hd-wallpaper-preview.jpg',
    dl:'https://www.wallpaperflare.com/dr-doom-doctor-doom-digital-art-frontal-view-artwork-mask-wallpaper-jgsgm' }
];

function doGlitch() {
  const g = $('doomGlitch');
  g.innerHTML = `
    <img src="${DOOM_IMG}" alt="">
    <div class="ghost r" style="background-image:url('${DOOM_IMG}')"></div>
    <div class="ghost g" style="background-image:url('${DOOM_IMG}')"></div>
    <div class="bar"></div>
    <div class="bar" style="animation-delay:.08s"></div>
    <div class="bar" style="animation-delay:.16s"></div>
    <div class="doomtxt">DOOM</div>`;
  g.classList.add('on');
  const sec = $('doomSec');
  sec.classList.add('shake');
  setTimeout(() => sec.classList.remove('shake'), 520);
  setTimeout(() => { g.classList.remove('on'); g.innerHTML = ''; }, 1000);
}

/* ===== COUNTDOWN ===== */
const RELEASE = new Date('2026-12-18T00:00:00');
function tickCount() {
  let d = Math.max(0, RELEASE - Date.now());
  const days = Math.floor(d/86400000); d -= days*86400000;
  const hrs = Math.floor(d/3600000); d -= hrs*3600000;
  const min = Math.floor(d/60000); d -= min*60000;
  const sec = Math.floor(d/1000);
  $('count').innerHTML = ['Days','Hrs','Min','Sec'].map((L,i) =>
    `<div class="c"><b>${[days,hrs,min,sec][i]}</b><span>${L}</span></div>`).join('');
}
tickCount(); setInterval(tickCount, 1000);

/* ===== DOOMSDAY SECTION ===== */
function renderDoom() {
  const g = $('doomGrid'); g.innerHTML = '';
  DOOMS.forEach((m, i) => {
    const c = document.createElement('div');
    c.className = 'dcard'; c.style.animationDelay = Math.min(i*60, 400) + 'ms';
    c.innerHTML = `<div class="ib"><img loading="lazy" src="${m.img}" alt="${m.t}"></div>
      <button class="delbtn" title="Remove (admin)">✕</button>
      <div class="meta"><span class="r">${m.t}<br>${m.res}</span><span class="g">GET</span></div>`;
    const img = c.querySelector('img');
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => { img.classList.add('loaded'); img.style.background = 'linear-gradient(135deg,#052e16,#000)'; });
    c.querySelector('.delbtn').addEventListener('click', e => { e.stopPropagation(); deleteWall(m.t, c, true); });
    c.addEventListener('click', () => {
      $('mImg').src = m.img;
      $('mMeta').textContent = `${m.t} · ${m.res}`;
      $('mDl').href = m.dl;
      $('mHint').textContent = 'Tap Get Full Res → pick your size on WallpaperFlare → download';
      $('modal').classList.add('open');
    });
    g.appendChild(c);
  });
}
function openDoom() {
  renderDoom();
  $('movieNote').classList.add('hide');
  const s = $('doomSec');
  s.classList.add('open');
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('vis')));
  doGlitch();
}
function closeDoom() {
  const s = $('doomSec');
  s.classList.remove('vis');
  setTimeout(() => s.classList.remove('open'), 500);
}
$('doomBack').addEventListener('click', closeDoom);
$('movieNote').addEventListener('click', e => { if (!e.target.closest('.nx')) openDoom(); });
$('noteClose').addEventListener('click', e => { e.stopPropagation(); $('movieNote').classList.add('hide'); });
$('doomChipBtn').addEventListener('click', () => { document.querySelectorAll('.chip').forEach(x => x.classList.remove('active')); openDoom(); });

/* ===== HALAL-VERIFIED CATALOG ===== */
const WALLS = [
["8gpx71","jpg","4378x2919",14639,1420562],["k8rw5d","jpg","6144x3457",11762,7378603],
["xewljv","jpg","3840x2160",13258,327908],["w5weqp","jpg","4500x3003",10241,5779211],
["21jkkg","jpg","3840x2621",6141,3797343],["jerxxy","jpg","6240x4160",4334,1452317],
["po597e","jpg","5970x3974",4242,3754640],["1ql3yg","jpg","3840x2160",3700,6005309],
["9oe6pk","jpg","3840x2160",3509,6495596],["3qg9jv","jpg","6144x3457",3487,15987246],
["zp2mlv","jpg","4000x2666",8256,2871575],["rqw21w","jpg","5120x2880",8180,10407241],
["jerxzm","jpg","3840x2619",3035,2066712],["9oedm1","jpg","5760x3840",2985,3182508],
["po5y9j","jpg","3800x2533",2663,694333],["xew98d","jpg","6688x3762",2645,6882865],
["po5lp3","jpg","5500x3667",2576,4297114],["yqwgxx","jpg","6567x4770",2240,16341568],
["w5wyjr","jpg","5120x2160",4759,9503530],["w5wywx","jpg","5472x3648",2042,4231279],
["vp3qw8","jpg","4096x2358",2010,3094553],["rqwjr1","jpg","7000x3968",1982,13491934],
["jer5qm","jpg","5472x3648",1827,4609639],["w5w8xx","jpg","3840x2160",1207,421180],
["21j8eg","jpg","4928x3280",1130,2499659],["gwv87d","jpg","4288x2848",1097,3063070],
["gwv5qd","jpg","3500x3132",1113,1519644],["ogw1p9","jpg","3840x2160",1127,1614328],
["jerrjy","jpg","5381x3027",1006,3350538],["jerd9m","jpg","4673x2884",968,1489440],
["gwv2w7","jpg","3840x2560",940,2409056],["d82odg","jpg","3840x2160",1411,4432127],
["qr5lz5","jpg","6144x3631",1281,9508953],["yqwvwk","jpg","4710x3141",1149,11064054],
["po5mk9","jpg","3840x2560",1188,4200455],["lyrmqy","jpg","3840x2160",3953,3006634],
["w5wdxq","jpg","6144x3457",1638,6806945],["po5m5p","jpg","5279x2969",1282,4612520],
["mlrorm","jpg","5522x3106",1198,3731316],["6l77z7","jpg","5210x2931",489,5065007],
["zp2m5g","jpg","3840x2160",7305,280076],["zp2zjy","jpg","3840x2160",6190,446330],
["1ql3r3","jpg","3840x2160",5326,387458],["e8r3qo","jpg","3840x2160",4796,524494],
["mlrl3y","jpg","3840x2400",2750,227027],["7jmx63","jpg","3840x2160",1877,254364],
["yqwm17","jpg","3840x2160",1455,282245],["qr5mqd","jpg","3840x2160",1352,644761],
["9oee7x","jpg","3840x2160",940,252884],["w5ww96","jpg","4096x2648",497,98275],
["jerydy","jpg","6021x3402",1610,15834786],["w5wq8p","jpg","4928x3280",1597,5019234],
["yqwmkl","jpg","4032x3024",1617,7083644],["yqwmwl","jpg","5472x3648",1279,8659664],
["gwv81e","jpg","5472x3648",951,5716851],["7jmlj9","jpg","2576x1448",895,136993],
["xewp6d","jpg","5948x3380",925,5168658],["vp3yep","jpg","6055x4165",791,10507413],
["yqwj9l","jpg","3840x2160",770,2688936],["d82gym","jpg","7952x4516",5538,17061967],
["1ql39w","jpg","4000x2666",4993,2336901],["zp2p9g","jpg","3440x1440",4835,445655],
["ogwlgl","jpg","3000x1969",2064,4097665],["mlr3x1","png","3840x2160",9650,21043],
["7jmpy9","png","3840x2160",5635,22251],["e8rxjw","png","3840x2160",4750,25246],
["xew6vd","png","3840x2160",2595,23852],["6l7wp7","jpg","2560x1440",3438,300134],
["21jelx","jpg","5120x2880",5134,16162751],["vp3gll","jpg","6144x3457",5589,14355673],
["1qlrjw","png","3840x2160",1582,5805081],["zp298v","jpg","3840x2160",1249,1474737],
["ogwx57","png","2560x1440",998,4464756],["k8rzqd","jpg","3840x2160",3760,342950],
["k8r8d7","jpg","3840x2160",2103,900000],["qr55wr","png","3840x2160",359,4133561],
["qr5d27","png","3440x1440",1456,1000000],["islam1","webp","3840x2160",5000,1500000],
["islam2","webp","3840x2160",5000,1500000]
];

/* ===== STATS FOOTER ===== */
const totalWalls = WALLS.length;
$('statCount').textContent = totalWalls + '+';

/* ===== CATEGORIES ===== */
const CATS = [
  { name: 'Islamic Art', ids: ['islam1','islam2','mlrl3y','zp2m5g'] },
  { name: 'Landscapes & Nature', ids: ['8gpx71','k8rw5d','w5weqp','21jkkg','jerxxy','po597e','1ql3yg','zp2mlv','rqw21w','jerxzm','9oedm1','po5y9j','xew98d','po5lp3','yqwgxx','w5wywx','rqwjr1','jer5qm','21j8eg','gwv87d','gwv5qd','ogw1p9','lyrmqy','w5wdxq','6l77z7','w5wq8p','yqwmwl','gwv81e','yqwmkl','vp3yep','d82odg'] },
  { name: 'City & Architecture', ids: ['d82gym','1ql39w','9oe6pk','3qg9jv','jerd9m','jerrjy','7jmlj9','xewp6d','vp3qw8','yqwgxx','qr5lz5','yqwvwk','po5mk9','mlrorm','zp2p9g','w5wyjr','ogwlgl','yqwj9l'] },
  { name: 'Space & Night Sky', ids: ['k8rw5d','po597e','mlr3x1','7jmpy9','e8rxjw','lyrmqy','ogwx57','qr55wr','7jmx63'] },
  { name: 'Dark & Minimal', ids: ['xewljv','zp2m5g','zp2zjy','1ql3r3','e8r3qo','mlrl3y','7jmx63','yqwm17','qr5mqd','9oee7x','w5ww96','xew6vd','6l7wp7','7jmpy9'] },
  { name: 'Vehicles & Machines', ids: ['k8rzqd','k8r8d7','qr5d27','21jelx','jerydy','d82gym','zp2p9g'] },
  { name: 'Ocean & Water', ids: ['21jelx','vp3gll','w5wyjr','w5wywx','ogwlgl','po5y9j','rqw21w','1ql3yg','9oedm1','3qg9jv','qr5lz5'] },
  { name: 'Mountains', ids: ['8gpx71','k8rw5d','w5weqp','jerxxy','po597e','rqwjr1','jer5qm','21jkkg','po5y9j','xew98d','lyrmqy','gwv87d','w5wdxq','mlrorm','po5m5p','6l77z7','po5lp3'] },
  { name: 'Snow & Winter', ids: ['lyrmqy','w5wdxq','po5m5p','mlrorm','6l77z7','w5weqp'] },
  { name: 'Forest & Woods', ids: ['zp2mlv','rqw21w','jerxxy','po5lp3','1ql3yg','xew98d','lyrmqy','6l77z7','yqwvwk'] }
];

function info(w) {
  const [id, ext, res, views, bytes] = w;
  if (ISLAMIC[id]) return { id, ext:'webp', res, views, bytes, thumb: ISLAMIC[id], orig: ISLAMIC[id], full: ISLAMIC[id] };
  const pfx = id.slice(0, 2);
  return { id, ext, res, views, bytes,
    thumb: `https://th.wallhaven.cc/lg/${pfx}/${id}.jpg`,
    orig: `https://th.wallhaven.cc/orig/${pfx}/${id}.jpg`,
    full: `https://w.wallhaven.cc/full/${pfx}/wallhaven-${id}.${ext}` };
}
const ISLAMIC = {
  islam1: 'https://d3p662obnq9uz2.cloudfront.net/generated-images/639951e3.webp',
  islam2: 'https://d3p662obnq9uz2.cloudfront.net/generated-images/1dc808eb.webp'
};
function dims(w) { return w[2].split('x').map(Number); }
function orientation(w) {
  const r = dims(w)[0] / dims(w)[1];
  if (r >= 2) return 'ultrawide';
  if (r <= 0.9) return 'vertical';
  return 'wide';
}

/* ===== PICKER ===== */
function closePicker() {
  const p = $('picker');
  p.classList.add('gone');
  setTimeout(() => { p.classList.remove('show','gone'); }, 550);
}
$('pickerClose').addEventListener('click', closePicker);
function showPicker() {
  const catGrid = $('catGrid');
  catGrid.innerHTML = '';
  if (DOOMS.length) {
    const promo = document.createElement('div');
    promo.className = 'cat doomc';
    promo.style.animationDelay = '0ms';
    promo.innerHTML = `<img src="${DOOMS[0].img}" alt="Avengers Doomsday">
      <div class="label">🎬 Doomsday Zone</div>
      <div class="count">Trending now</div>`;
    const pimg = promo.querySelector('img');
    pimg.addEventListener('load', () => pimg.classList.add('loaded'));
    pimg.addEventListener('error', () => pimg.classList.add('loaded'));
    promo.addEventListener('click', openDoom);
    catGrid.appendChild(promo);
  }
  CATS.forEach((c, i) => {
    const box = document.createElement('div');
    box.className = 'cat';
    box.style.animationDelay = Math.min((i+1) * 70, 640) + 'ms';
    const rep = c.ids[0];
    const repUrl = ISLAMIC[rep] || `https://th.wallhaven.cc/lg/${rep.slice(0,2)}/${rep}.jpg`;
    box.innerHTML = `<img src="${repUrl}" alt="">
      <div class="label">${c.name}</div>
      <div class="count">${c.ids.filter(x => WALLS.find(w => w[0] === x)).length} wallpapers</div>`;
    const img = box.querySelector('img');
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.add('loaded'));
    box.addEventListener('click', () => enterWith(c.ids, c.name));
    catGrid.appendChild(box);
  });
  const p = $('picker');
  p.classList.remove('gone');
  p.classList.add('show');
}

let filter = 'top', query = '', shown = 0, filtered = [], shuffleIds = null, customOrder = null;

function enterWith(ids, name) {
  closePicker();
  if (name === 'Random Exploration') {
    filter = 'random'; shuffleIds = null; customOrder = null;
    $('heroTitle').textContent = 'Random Exploration';
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    refresh(); return;
  }
  const set = new Set(ids);
  const picks = WALLS.filter(w => set.has(w[0]));
  const extra = WALLS.filter(w => !set.has(w[0]));
  customOrder = picks.concat(extra).map(w => w[0]);
  filter = 'custom';
  $('heroTitle').textContent = name;
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
  refresh();
}
$('randomBtn').addEventListener('click', () => enterWith(null, 'Random Exploration'));

function matches(w) {
  if (filter === 'ultrawide' && orientation(w) !== 'ultrawide') return false;
  if (!query) return true;
  const q = query.toLowerCase();
  const [x] = dims(w);
  return w[2].includes(q) || orientation(w).includes(q)
    || (q.includes('4k') && x >= 3840) || (q.includes('5k') && x >= 5000)
    || (q.includes('islamic') && ISLAMIC[w[0]]);
}
function applyFilter() {
  if (filter === 'custom' && customOrder) {
    const m = new Map(WALLS.map(w => [w[0], w]));
    return customOrder.map(id => m.get(id)).filter(Boolean).filter(matches);
  }
  let arr = WALLS.filter(matches);
  if (filter === 'top') arr = [...arr].sort((a, b) => b[3] - a[3]);
  if (filter === 'deep') arr = [...arr].sort((a, b) => a[3] - b[3]);
  if (filter === 'random') {
    if (!shuffleIds) shuffleIds = [...WALLS].sort(() => Math.random() - .5).map(w => w[0]);
    const m = new Map(WALLS.map(w => [w[0], w]));
    return shuffleIds.map(id => m.get(id)).filter(Boolean).filter(matches);
  }
  return arr;
}

function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}
function reset() { shown = 0; grid.innerHTML = ''; }

function renderBatch() {
  if (!filtered.length) { sentinel.textContent = '✦ Nothing here — try another word'; return; }
  const PER = 12;
  const batch = filtered.slice(shown, shown + PER);
  if (!batch.length) { sentinel.textContent = `✦ End — ${filtered.length} walls in this view`; return; }
  const frag = document.createDocumentFragment();
  batch.forEach((w, i) => {
    const v = info(w);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = Math.min(i * 40, 400) + 'ms';
    card.innerHTML = `
      <div class="imgbox"><img loading="lazy" src="${v.thumb}" alt="wallpaper ${v.id}"></div>
      <button class="delbtn" title="Remove (admin)">✕</button>
      <div class="overlay">
        <div class="tags"><span class="tag">${v.res}</span>
        <span class="tag">${orientation(w)}</span>
        <span class="tag">▲ ${v.views.toLocaleString()}</span></div>
        <div class="row"><span class="res">${(v.bytes/1048576).toFixed(1)} MB · ${v.ext.toUpperCase()}</span>
        <button class="btn">⬇ Full Res</button></div>
      </div>`;
    const img = card.querySelector('img');
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.add('loaded', 'fallback'));
    card.querySelector('.delbtn').addEventListener('click', e => { e.stopPropagation(); deleteWall(v.id, card, false); });
    card.querySelector('.btn').addEventListener('click', e => { e.stopPropagation(); openModal(w); showToast('⬇ Tap Get Full Res, then long-press to save'); });
    card.addEventListener('click', () => openModal(w));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  shown += batch.length;
  sentinel.textContent = shown < filtered.length ? 'Scroll for more…' : `✦ End — ${filtered.length} walls in this view`;
}
function refresh() { filtered = applyFilter(); reset(); renderBatch(); }

function openModal(w) {
  const v = info(w);
  $('mImg').src = v.orig;
  $('mMeta').textContent = `${v.res} · ${(v.bytes/1048576).toFixed(1)} MB`;
  $('mDl').href = v.full;
  $('mHint').textContent = 'On phone: tap Get Full Res → long-press image → "Save image"';
  $('modal').classList.add('open');
}
const closeModal = () => $('modal').classList.remove('open');
$('mClose').onclick = closeModal;
$('modal').addEventListener('click', e => e.target === $('modal') && closeModal());

const io = new IntersectionObserver(e => { if (e[0].isIntersecting) renderBatch(); }, { rootMargin: '500px 0px' });
io.observe(sentinel);

let t; $('q').addEventListener('input', e => {
  const v = e.target.value;
  if (v.trim().toLowerCase() === ADMIN_PASS) {
    e.target.value = ''; query = '';
    refresh();
    if (adminMode) { showToast('🔴 Admin already ON'); return; }
    openAdminLogin();
    return;
  }
  clearTimeout(t); t = setTimeout(() => { query = v.trim(); refresh(); }, 350);
});

document.querySelectorAll('.chip[data-f]').forEach(c => c.addEventListener('click', () => {
  const act = document.querySelector('.chip.active');
  if (act) act.classList.remove('active');
  c.classList.add('active'); filter = c.dataset.f; shuffleIds = null; customOrder = null;
  $('heroTitle').textContent = c.textContent === 'Top' ? 'Ultra HD Wallpapers' : c.textContent;
  refresh();
}));

refresh();