const PREFIX = `doona-shell:${self.registration.scope}:`;
// The page reads the same build from index.html, to tell whether this worker taking it over is a new build.
const BUILD = '2ef45d1b9d2f4bcf';
const CACHE = PREFIX + BUILD;
const PRECACHE = ["assets/AddCircle-ByeEwZrv.js","assets/AppearanceControls-ObLNCSsG.js","assets/AreaChart-DHyp4X--.js","assets/AreaCurve-DQSHOSpG.js","assets/BackendText-1KZfTCIH.js","assets/CardView-DTYzYfin.js","assets/Checkbox-B6pfTwkK.js","assets/CheckboxSet-CH8yt-Sl.js","assets/CodeEditor-Ckge6t7b.js","assets/Config-DjOIv1yp.js","assets/Connections-Cq655Jo_.js","assets/Copy-YS0BrULB.js","assets/Coverage-BCR956bq.js","assets/DaeCode-DEjXqvav.js","assets/Delete-CWC4EERD.js","assets/Dns-BfPJ-P_d.js","assets/Dns-CsAXSf3H.css","assets/Donut-CiAjzfTT.js","assets/Editors-BAVjpIMp.js","assets/Editors-rPgk_VZK.css","assets/Events-DYfHTFVo.js","assets/FlagPicker-knYFqkXm.js","assets/Flows-BekA1vQh.css","assets/Flows-Cy5bjzda.js","assets/GridList-CRD9IoD1.js","assets/ItemText-CjTx6aCh.js","assets/LinkOut-C8mrN6rl.js","assets/Login-BjKdh3Zg.js","assets/Logs-QCFzQptj.js","assets/ManualFields-BRS_LlI3.js","assets/ModeReadOnlyHint-CJ24cNE2.js","assets/NodePath-Do65uQ7Y.js","assets/Nodes-CnRSml2p.js","assets/Nodes-Dz09mbUJ.css","assets/NumberField-D0WpB6D2.js","assets/Overview-Bzh29RAD.js","assets/Policies-CWQl6LTj.js","assets/Rules-CrIUA2y_.js","assets/SearchDialog-Q4v7D-6L.js","assets/SearchList-Bc9C3q3u.js","assets/SearchSelect-CrJjx4jP.js","assets/Select-BpJ2Wi_P.js","assets/Settings-BVE3j40b.js","assets/Settings-BVpmQMTB.css","assets/Sparkline-hKc79fV5.js","assets/SubscriptionFields-n3iIggzK.js","assets/Table-CZa0t9o3.js","assets/Tabs-Dac0xVIP.js","assets/Tag-Bd3IEtAL.js","assets/TimeCell-Cxbno5O1.js","assets/Trace-CYc04vVX.js","assets/TwemojiCountryFlags-Bymva2JV.woff2","assets/Virtualizer-Cc9es1pj.js","assets/WallpaperSettings-BAJMZju5.js","assets/XhttpOptions-BX-S5BbI.js","assets/_commonjsHelpers-CXUWDbkB.js","assets/activity-BhwsW0Xw.js","assets/activity-CKk6X7wg.css","assets/array-C0VuvQyb.js","assets/auth-2jzZOgfn.js","assets/auth-B0kXAT5r.js","assets/daeTokens-BVtuNnWZ.js","assets/duck-night-CbKHyiul.webp","assets/files-Dt8K7QfP.js","assets/flows-r1gd1ynx.js","assets/fonts-C5_wsAqZ.css","assets/geodata-CvcFemyc.js","assets/geodataUpdate-BBbx25WA.js","assets/glass-BcMm4w7K.js","assets/glass-piYllnzE.css","assets/gorges-dark-FlgXSNn1.webp","assets/gorges-light-DCWkLX37.webp","assets/halloween-Dfny7j3b.js","assets/halloween-e3DfiasY.css","assets/impact-B8feJDtJ.css","assets/index-CD1ZKKSw.css","assets/index-DUM-iwa2.js","assets/index-zv_sHU-O.js","assets/ipLookup-BYorpVJi.css","assets/ipLookup-ICE6fQ2N.js","assets/labels-D8xxfRTQ.js","assets/lake-dark-B_VaUlAe.webp","assets/lake-light-oWll36-V.webp","assets/lens-BMneTJKP.js","assets/limitHint-CW2Ci7vs.js","assets/logo-CKC46m8V.svg","assets/logo-obi05X1B.svg","assets/logs-CqZqOR3y.js","assets/match.worker-B2aIccpg.js","assets/nav-A9ioYO9v.js","assets/nav-BGjlJ83Z.js","assets/nav-BO8viH9G.js","assets/nav-BwK4mYWG.js","assets/nav-C4oCEJeQ.js","assets/nav-CkSm9FYD.js","assets/nav-D5dHhIBk.js","assets/nodes-MuHFJPcw.js","assets/outbounds-_ZBolDag.js","assets/paletteSheet-Vc0PGoNW.js","assets/probe-C1gw_uvY.js","assets/recorder-BHyqDNp5.js","assets/rule-CpyLElR0.js","assets/square-dark-CG0rwsS1.webp","assets/square-light-OU6dsCf9.webp","assets/subscriptionEntries-6OLmp2ux.js","assets/taishan-dark-BI3cd4fj.webp","assets/taishan-light-Dip0HmJZ.webp","assets/useGridSelectionCheckbox-CwTTtOfA.js","assets/useQuickRule-CoyHYDE3.js","assets/vendor-editor-50h2cCk6.js","assets/vendor-react-64fcanlc.js","assets/wall-dark-DCO0xUUO.webp","assets/wall-light-BYfte2Bi.webp","assets/wallpaper-CEC7gitM.js","index.html"];
// Each language's catalogue and stylesheets in this build, cached only for a language a reader uses. A partial
// language's list holds the reference language's files too, since it loads them.
const LANGUAGES = {"zh-TW":["assets/fonts-tc-D9rvq3k7.css","assets/locale-zh-TW-activity-C7Vz2kIV.js","assets/locale-zh-TW-core-u0At-cld.js","assets/locale-zh-TW-rest-DvOf1wA3.js"],"zh-CN":["assets/fonts-sc-Dyn9aW84.css","assets/locale-zh-CN-activity-B_7_QXPJ.js","assets/locale-zh-CN-core-Bl7c61gs.js","assets/locale-zh-CN-rest-DNPBkbM5.js"],"en":["assets/locale-en-activity-D3WqzCdU.js","assets/locale-en-core-BZPoNVMO.js","assets/locale-en-rest-ByVYZbxk.js"]};
// The mock backend's chunk, cached only for a page that runs on it.
const MOCK = ["assets/index-CQahrpDI.js"];
const ROOT = new URL(self.registration.scope);

// A new build takes over on the next online load, including open dashboard tabs.
// Each build records when it was installed, so activation can tell the build it replaces from older ones.
const STAMP = new URL('__installed__', ROOT);
// index.html keeps its name across builds, so it is fetched past the HTTP cache: a caching proxy cannot hand the new
// build an old shell. A file under assets/ is named after its content hash, so the copy the page already loaded through
// the HTTP cache is the same file and is not downloaded again.
const precacheRequest = url => (url.startsWith('assets/') ? url : new Request(url, {cache: 'reload'}));
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => Promise.all([cache.addAll(PRECACHE.map(precacheRequest)), cache.put(STAMP, new Response(String(Date.now())))]))
      .then(() => self.skipWaiting())
  );
});
// A page loads its catalogue and backend before this worker controls it, so it reports the language it shows and
// whether it runs on the mock, to have them cached.
self.addEventListener('message', event => {
  if (event.data?.build === true) {
    event.ports[0]?.postMessage(BUILD);
    return;
  }
  const lang = event.data?.language;
  const files = [...(typeof lang === 'string' && Object.hasOwn(LANGUAGES, lang) ? LANGUAGES[lang] : []), ...(event.data?.mock === true ? MOCK : [])];
  if (!files.length) return;
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(files.map(async url => (await cache.match(url, {ignoreVary: true})) ?? cache.add(url)))));
});
// The build just replaced stays: tabs still showing it load their remaining chunks from it until reloaded.
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const older = [];
      for (const key of await caches.keys()) {
        if (!key.startsWith(PREFIX) || key === CACHE) continue;
        const stamp = await (await caches.open(key)).match(STAMP);
        older.push({key, installed: stamp ? Number(await stamp.text()) : 0});
      }
      older.sort((a, b) => b.installed - a.installed);
      await Promise.all(older.slice(1).map(({key}) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

function hit(response) {
  if (!response) return Response.error();
  const headers = new Headers(response.headers);
  headers.set('x-doona-sw', 'hit');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || /\/api(?:\/|$)/.test(url.pathname) || !url.pathname.startsWith(ROOT.pathname)) return;
  if (url.pathname.startsWith(new URL('lite/', ROOT).pathname)) return;
  const navigation = request.mode === 'navigate';
  if (!navigation && !/^(assets|fonts|icons)\//.test(url.pathname.slice(ROOT.pathname.length))) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (navigation) {
        try {
          return await fetch(request);
        } catch {
          return hit(await cache.match(new URL('index.html', ROOT)));
        }
      }
      // A build file is the same for every requester, so a server's Vary: Origin must not turn a cached copy into a miss.
      const response = (await cache.match(request, {ignoreVary: true})) ?? (await caches.match(request, {ignoreVary: true}));
      if (response) return hit(response);
      const fresh = await fetch(request);
      // A host may answer a missing file with the page; caching that would keep the file missing once it is installed.
      if (fresh.ok && fresh.type === 'basic' && !fresh.redirected && !fresh.headers.get('content-type')?.includes('html'))
        await cache.put(request, fresh.clone());
      return fresh;
    })()
  );
});
