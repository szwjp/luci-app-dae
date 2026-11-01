const PREFIX = `doona-shell:${self.registration.scope}:`;
// The page reads the same build from index.html, to tell whether this worker taking it over is a new build.
const BUILD = '610e5258e38ea85b';
const CACHE = PREFIX + BUILD;
const PRECACHE = ["assets/AddCircle-DU42Vf99.js","assets/AppearanceControls-De97CLNg.js","assets/AreaChart-CFUOJGZf.js","assets/AreaCurve-DQSHOSpG.js","assets/BackendText-ENwx26IS.js","assets/CardView-Csx8eK5m.js","assets/Checkbox-xFZuCJHy.js","assets/CheckboxSet-D5VbPveY.js","assets/CodeEditor-DFIKZYfp.js","assets/Config-BGufJ3-J.js","assets/Connections-Dn5UO9li.js","assets/Copy-DBFGoaVq.js","assets/Coverage-RN104TPD.js","assets/DaeCode-DEjXqvav.js","assets/Delete-D0LgRtE_.js","assets/Dns-Crunrr9o.js","assets/Dns-CsAXSf3H.css","assets/Donut-Cxp7PhH3.js","assets/Editors-B1q8aLV6.js","assets/Editors-rPgk_VZK.css","assets/Events-BkTcYt04.js","assets/FlagPicker-Y-Rmla9L.js","assets/Flows-AAOoqqhS.js","assets/Flows-BekA1vQh.css","assets/GridList-4sTK2Hb0.js","assets/ItemText-BYZpzl9g.js","assets/LinkOut-BNOvHRfR.js","assets/Login-DhwdHpN0.js","assets/Logs-w2qu8cwu.js","assets/ManualFields-CrLoTbeX.js","assets/ModeReadOnlyHint-DMxZXRqa.js","assets/NodePath-CZDObKRD.js","assets/Nodes-CG0WmA7r.js","assets/Nodes-Dz09mbUJ.css","assets/NumberField-C4SUFNhq.js","assets/Overview-D9qGMCx3.js","assets/Policies-Bdc4pA2V.js","assets/Rules-Cpix95q0.js","assets/SearchDialog-CSK2msUx.js","assets/SearchList-EejQXq-G.js","assets/SearchSelect-BR_uwBEP.js","assets/Select-DWDfngul.js","assets/Settings-BVpmQMTB.css","assets/Settings-CSBBdoS1.js","assets/Sparkline-CG7y3vYt.js","assets/SubscriptionFields-XjUw6jTM.js","assets/Table-Cnn6J_ll.js","assets/Tabs-4wimF94C.js","assets/Tag-D-T7r-_w.js","assets/TimeCell-DKvtj_uM.js","assets/Trace-CcTpULGa.js","assets/TwemojiCountryFlags-Bymva2JV.woff2","assets/Virtualizer-CVeV7xIf.js","assets/WallpaperSettings-CFlFwMnP.js","assets/XhttpOptions-BxHO-ZTa.js","assets/_commonjsHelpers-CXUWDbkB.js","assets/activity-CKk6X7wg.css","assets/activity-Cm0GH5j6.js","assets/array-C0VuvQyb.js","assets/auth-ClHAcr39.js","assets/auth-D45-HuIF.js","assets/daeTokens-BVtuNnWZ.js","assets/duck-night-CbKHyiul.webp","assets/files-Dt8K7QfP.js","assets/flows-CGSfjqnf.js","assets/fonts-C5_wsAqZ.css","assets/geodata-CvcFemyc.js","assets/geodataUpdate-DGzgRqSL.js","assets/glass-BcMm4w7K.js","assets/glass-piYllnzE.css","assets/gorges-dark-FlgXSNn1.webp","assets/gorges-light-DCWkLX37.webp","assets/halloween-Dfny7j3b.js","assets/halloween-e3DfiasY.css","assets/impact-B8feJDtJ.css","assets/index-CD1ZKKSw.css","assets/index-DUM-iwa2.js","assets/index-oc5h0son.js","assets/ipLookup-BYorpVJi.css","assets/ipLookup-Trk_UTwk.js","assets/labels-D8xxfRTQ.js","assets/lake-dark-B_VaUlAe.webp","assets/lake-light-oWll36-V.webp","assets/lens-BMneTJKP.js","assets/limitHint-BUj9ls5C.js","assets/logo-CKC46m8V.svg","assets/logo-obi05X1B.svg","assets/logs-CGgBmsId.js","assets/match.worker-B2aIccpg.js","assets/nav-B-01Fs3G.js","assets/nav-BO8viH9G.js","assets/nav-Bs3wiOb2.js","assets/nav-CbtbcFPB.js","assets/nav-CfmvVuSu.js","assets/nav-DW-sSn7K.js","assets/nav-Du_TgTOT.js","assets/nodes-CvdJ88wo.js","assets/outbounds-UO4bfQy1.js","assets/paletteSheet-Vc0PGoNW.js","assets/probe-CDyBxCD3.js","assets/recorder-BHyqDNp5.js","assets/rule-DQlpgcZ1.js","assets/square-dark-CG0rwsS1.webp","assets/square-light-OU6dsCf9.webp","assets/subscriptionEntries-Cu-bveuU.js","assets/taishan-dark-BI3cd4fj.webp","assets/taishan-light-Dip0HmJZ.webp","assets/useGridSelectionCheckbox-DT-uRAMV.js","assets/useQuickRule-DI1uma0u.js","assets/vendor-editor-50h2cCk6.js","assets/vendor-react-64fcanlc.js","assets/wall-dark-DCO0xUUO.webp","assets/wall-light-BYfte2Bi.webp","assets/wallpaper-CEC7gitM.js","index.html"];
// Each language's catalogue and stylesheets in this build, cached only for a language a reader uses. A partial
// language's list holds the reference language's files too, since it loads them.
const LANGUAGES = {"zh-TW":["assets/fonts-tc-D9rvq3k7.css","assets/locale-zh-TW-activity-C7Vz2kIV.js","assets/locale-zh-TW-core-DbOz-y7r.js","assets/locale-zh-TW-rest-DvOf1wA3.js"],"zh-CN":["assets/fonts-sc-Dyn9aW84.css","assets/locale-zh-CN-activity-B_7_QXPJ.js","assets/locale-zh-CN-core-BMXWrAfb.js","assets/locale-zh-CN-rest-DNPBkbM5.js"],"en":["assets/locale-en-activity-D3WqzCdU.js","assets/locale-en-core-DAd3wgGg.js","assets/locale-en-rest-ByVYZbxk.js"]};
// The mock backend's chunk, cached only for a page that runs on it.
const MOCK = ["assets/index-CXGSbt3K.js"];
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
