/*
  🧮 仕入れ判断の計算機 — 電波が無いときのための「控え」係
  （ネット上に置いたときだけ働く。パソコンでファイルを直に開いたときは何もしない）

  やっていること＝下の FILES を一度そっくり控えておき、
  以後は「まず控えから出す」。だから電波が無い店の中でも開ける。

  🔴 index.html を直したら CACHE の版番号を1つ上げること。
     上げないと iPhone が古い控えを出し続ける。
     （tests/test_shiire_calc.py の test_sw_cache_list が一覧のズレは見張るが、
       版番号を上げ忘れたことは機械では分からない＝人が気をつける）
*/

var CACHE = "shiire-v4";

// 控える物の一覧。"./" は入口（ホーム画面のアイコンが開くアドレス）＝中身は index.html
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png"];

// 控えが「全部そろった」ときだけ書く印。画面はこれを見て「電波が無くても開けます」と出す。
// 🔴 そろわなかったら書かない＝嘘を出さないため。
var MARK = "./__offline_ok";

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(FILES).then(function () {
        var body = JSON.stringify({ cache: CACHE, files: FILES, cachedOn: new Date().toISOString().slice(0, 10) });
        return c.put(MARK, new Response(body, { headers: { "Content-Type": "application/json" } }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) { return n === CACHE ? null : caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // まず控えから。無ければ取りに行く（取れなければブラウザの通常のエラー）
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req);
    })
  );
});
