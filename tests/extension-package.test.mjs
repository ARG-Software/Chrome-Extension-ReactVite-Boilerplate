import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const readDist = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");
const readDistFile = (file) => readFile(new URL(`../dist/${file}`, import.meta.url));

test("builds a complete Manifest V3 extension package", async () => {
  const manifest = JSON.parse(await readDist("manifest.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "index.html");
  assert.equal(manifest.background.service_worker, "background.js");
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.deepEqual(manifest.content_scripts[0].matches, ["https://*/*", "http://*/*"]);
  assert.deepEqual(manifest.content_scripts[0].js, ["content-script.js"]);

  const [backgroundScript, contentScript, popupHtml] = await Promise.all([
    readDist("background.js"),
    readDist("content-script.js"),
    readDist("index.html"),
  ]);

  new vm.Script(backgroundScript);
  new vm.Script(contentScript);
  assert.match(popupHtml, /<div id="root"><\/div>/);

  const popupAssets = [...popupHtml.matchAll(/(?:src|href)="\.\/assets\/([^"]+)"/g)];
  assert.equal(popupAssets.length, 2);
  await Promise.all(popupAssets.map((match) => readDistFile(`assets/${match[1]}`)));

  const icons = new Set([
    ...Object.values(manifest.action.default_icon),
    ...Object.values(manifest.icons),
  ]);
  assert.equal(icons.size, 3);
  await Promise.all([...icons].map(readDistFile));
});

test("runs the packaged content script against the active page", async () => {
  const contentScript = await readDist("content-script.js");
  const links = [{ style: {} }, { style: {} }];
  let listener;
  const context = {
    chrome: {
      runtime: {
        onMessage: {
          addListener(callback) {
            listener = callback;
          },
        },
      },
    },
    document: {
      title: "Example page",
      querySelectorAll: () => links,
    },
    window: {
      location: { href: "https://example.com/" },
    },
  };
  vm.runInNewContext(contentScript, context);

  let pageInfo;
  listener({ action: "getPageInfo" }, {}, (response) => {
    pageInfo = response;
  });
  assert.equal(pageInfo.title, "Example page");
  assert.equal(pageInfo.url, "https://example.com/");
  assert.equal(pageInfo.linkCount, 2);

  let highlightResult;
  listener({ action: "highlightLinks" }, {}, (response) => {
    highlightResult = response;
  });
  assert.equal(highlightResult.success, true);
  assert.equal(highlightResult.linksFound, 2);
  assert.equal(links[0].style.backgroundColor, "#fff176");
  assert.equal(links[1].style.outline, "2px solid #f9a825");
});

test("serializes history saves and clears", async () => {
  const backgroundScript = await readDist("background.js");
  const storage = {};
  let listener;
  const context = {
    chrome: {
      runtime: {
        onMessage: {
          addListener(callback) {
            listener = callback;
          },
        },
      },
      storage: {
        local: {
          get(defaults) {
            return new Promise((resolve) => {
              setTimeout(() => resolve({ ...defaults, ...storage }), 10);
            });
          },
          set(values) {
            Object.assign(storage, values);
            return Promise.resolve();
          },
          remove(key) {
            delete storage[key];
            return Promise.resolve();
          },
        },
      },
    },
    setTimeout,
  };
  vm.runInNewContext(backgroundScript, context);

  const send = (request) =>
    new Promise((resolve) => {
      assert.equal(listener(request, {}, resolve), true);
    });

  await Promise.all([
    send({
      action: "saveVisit",
      visit: { url: "https://example.com", title: "Example", timestamp: 1 },
    }),
    send({ action: "clearVisitHistory" }),
  ]);

  const result = await send({ action: "getVisitHistory" });
  assert.equal(Array.isArray(result.visits), true);
  assert.equal(result.visits.length, 0);
});
