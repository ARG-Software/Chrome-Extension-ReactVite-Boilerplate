chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "highlightLinks") {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      link.style.backgroundColor = "#fff176";
      link.style.outline = "2px solid #f9a825";
    });
    sendResponse({ success: true, linksFound: links.length });
  }

  if (request.action === "getPageInfo") {
    sendResponse({
      title: document.title,
      url: window.location.href,
      linkCount: document.querySelectorAll("a").length,
    });
  }
});
