const PREFIX = `doona-shell:${self.registration.scope}:`;
// The page reads the same build from index.html, to tell whether this worker taking it over is a new build.
const BUILD = 'fdcc1d8c66f6624a';
const CACHE = PREFIX + BUILD;
const PRECACHE = ["assets/AddCircle-e3oqYyvw.js","assets/AppearanceControls-B4cGTn5S.js","assets/AreaChart-DU41Di3l.js","assets/AreaCurve-DQSHOSpG.js","assets/BackendText-DzOnYUm8.js","assets/CardView-DlqlSAFl.js","assets/Checkbox-CEQrH4pR.js","assets/CheckboxSet-DPrspQsf.js","assets/CodeEditor-B_Sbpf1K.js","assets/Config-BSlVbcez.js","assets/Connections-3N8umUfV.js","assets/Copy-DNEU1qEu.js","assets/Coverage--28Iwisy.js","assets/DaeCode-DEjXqvav.js","assets/Delete-cs77pceL.js","assets/Dns-CsAXSf3H.css","assets/Dns-DetiYx5n.js","assets/Donut-CHOmlMGq.js","assets/Editors-rPgk_VZK.css","assets/Editors-tLQXT-ko.js","assets/Events-Bfo_SNFY.js","assets/FlagPicker-1UwGp94K.js","assets/Flows-BekA1vQh.css","assets/Flows-D010emRi.js","assets/GridList-Bdnapxv3.js","assets/ItemText-DIVd1Vkd.js","assets/LinkOut-DVoFrZdu.js","assets/Login-BnoH8KXS.js","assets/Logs-BNdiN45T.js","assets/ManualFields-BGEJOunR.js","assets/ModeReadOnlyHint-BClDmE1n.js","assets/NodePath-B2ckA5u7.js","assets/Nodes-Dz09mbUJ.css","assets/Nodes-L-dm5z2v.js","assets/NumberField-V6rOyp8r.js","assets/Overview-CMLAZDy7.js","assets/Policies-D-Joa9g8.js","assets/Rules-DBDFJlY2.js","assets/SearchDialog-V1bPNos3.js","assets/SearchList-D4sHuK_J.js","assets/SearchSelect-0hQ09dcF.js","assets/Select-Dq34dktw.js","assets/Settings-BVpmQMTB.css","assets/Settings-DYF_NK92.js","assets/Sparkline-BNH8zGMY.js","assets/SubscriptionFields-BqWz9rYz.js","assets/Table-CpldIfRK.js","assets/Tabs-BRAxHHYY.js","assets/Tag-GuBsX8mG.js","assets/TimeCell-D4zko07Q.js","assets/Trace-C8Xqi5R6.js","assets/TwemojiCountryFlags-Bymva2JV.woff2","assets/Virtualizer-BgVBqUvC.js","assets/WallpaperSettings-CUR4bovT.js","assets/XhttpOptions-CtNIxWtM.js","assets/_commonjsHelpers-CXUWDbkB.js","assets/activity-CgcM8uHz.css","assets/activity-cAylug6L.js","assets/array-C0VuvQyb.js","assets/auth-BqacBobF.js","assets/auth-C13OZuSE.js","assets/daeTokens-BVtuNnWZ.js","assets/duck-night-CbKHyiul.webp","assets/files-Dt8K7QfP.js","assets/flows-Dihy9OOQ.js","assets/fonts-C5_wsAqZ.css","assets/geodata-CvcFemyc.js","assets/geodataUpdate-DRIbzT9o.js","assets/glass-D8tYX8mi.js","assets/glass-piYllnzE.css","assets/gorges-dark-FlgXSNn1.webp","assets/gorges-light-DCWkLX37.webp","assets/halloween-Dfny7j3b.js","assets/halloween-e3DfiasY.css","assets/impact-B8feJDtJ.css","assets/index-BgEzWvA1.js","assets/index-DUM-iwa2.js","assets/index-DhY2A0CV.css","assets/ipLookup-BYorpVJi.css","assets/ipLookup-VWBjZpt2.js","assets/labels-D8xxfRTQ.js","assets/lake-dark-B_VaUlAe.webp","assets/lake-light-oWll36-V.webp","assets/lens-BMneTJKP.js","assets/limitHint-mKV0TGd5.js","assets/logo-CKC46m8V.svg","assets/logo-obi05X1B.svg","assets/logs-fN0JYhS7.js","assets/match.worker-B2aIccpg.js","assets/nav-C666d770.js","assets/nav-D2dSpncA.js","assets/nodes-BlvFUsog.js","assets/outbounds-4v87Y8QO.js","assets/paletteSheet-Vc0PGoNW.js","assets/probe-BjDFAnnq.js","assets/recorder-BHyqDNp5.js","assets/rule-BhPXkxFq.js","assets/square-dark-CG0rwsS1.webp","assets/square-light-OU6dsCf9.webp","assets/subscriptionEntries-B0V9NeYR.js","assets/taishan-dark-BI3cd4fj.webp","assets/taishan-light-Dip0HmJZ.webp","assets/useGridSelectionCheckbox-wyzM0oC7.js","assets/useQuickRule-CAg089r8.js","assets/vendor-editor-50h2cCk6.js","assets/vendor-react-64fcanlc.js","assets/wall-dark-DCO0xUUO.webp","assets/wall-light-BYfte2Bi.webp","assets/wallpaper-CEC7gitM.js","index.html"];
// Each language's catalogue and stylesheets in this build, cached only for a language a reader uses. A partial
// language's list holds the reference language's files too, since it loads them.
const LANGUAGES = {"zh-TW":["assets/fonts-tc-D9rvq3k7.css","assets/locale-zh-TW-activity-CopnBuwF.js","assets/locale-zh-TW-core-DShHxgi-.js","assets/locale-zh-TW-rest-DipSnd54.js"],"zh-CN":["assets/fonts-sc-Dyn9aW84.css","assets/locale-zh-CN-activity-CjG6S6CQ.js","assets/locale-zh-CN-core-BCXm81cE.js","assets/locale-zh-CN-rest-B5XCKaN5.js"],"en":["assets/locale-en-activity-B6t-8m5i.js","assets/locale-en-core-DC-8eH96.js","assets/locale-en-rest-DYQhiAUt.js"]};
// The mock backend's chunk, cached only for a page that runs on it.
const MOCK = ["assets/index-CPFgQnl6.js"];
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
