const HISTORY_KEY = "visits";
const MAX_VISITS = 10;
let historyUpdate = Promise.resolve();

function isVisit(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.url === "string" &&
    typeof value.title === "string" &&
    typeof value.timestamp === "number"
  );
}

function queueHistoryUpdate(update) {
  const nextUpdate = historyUpdate.then(update, update);
  historyUpdate = nextUpdate.catch(() => {});
  return nextUpdate;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "saveVisit" && isVisit(request.visit)) {
    queueHistoryUpdate(async () => {
      const result = await chrome.storage.local.get({ [HISTORY_KEY]: [] });
      const visits = Array.isArray(result[HISTORY_KEY])
        ? result[HISTORY_KEY].filter(isVisit)
        : [];
      await chrome.storage.local.set({
        [HISTORY_KEY]: [request.visit, ...visits].slice(0, MAX_VISITS),
      });
    })
      .then(() => sendResponse({ saved: true }))
      .catch(() => sendResponse({ saved: false }));
    return true;
  }

  if (request.action === "getVisitHistory") {
    historyUpdate
      .then(() => chrome.storage.local.get({ [HISTORY_KEY]: [] }))
      .then((result) => {
        const visits = Array.isArray(result[HISTORY_KEY])
          ? result[HISTORY_KEY].filter(isVisit)
          : [];
        sendResponse({ visits });
      })
      .catch(() => sendResponse({ visits: [] }));
    return true;
  }

  if (request.action === "clearVisitHistory") {
    queueHistoryUpdate(() => chrome.storage.local.remove(HISTORY_KEY))
      .then(() => sendResponse({ cleared: true }))
      .catch(() => sendResponse({ cleared: false }));
    return true;
  }

  return false;
});
