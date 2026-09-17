import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const readDist = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");

test("builds a complete Manifest V3 extension package", async () => {
  const manifest = JSON.parse(await readDist("manifest.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "index.html");
  assert.equal(manifest.background.service_worker, "background.js");
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.deepEqual(manifest.content_scripts[0].js, ["content-script.js"]);

  const [backgroundScript, contentScript] = await Promise.all([
    readDist("background.js"),
    readDist("content-script.js"),
    readDist("index.html"),
  ]);

  new vm.Script(backgroundScript);
  new vm.Script(contentScript);
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
