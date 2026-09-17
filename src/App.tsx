import { useState } from "react";
import "./App.css";

interface PageInfo {
  title: string;
  url: string;
  linkCount: number;
}

interface Visit {
  url: string;
  title: string;
  timestamp: number;
}

interface HighlightLinksResponse {
  success: boolean;
  linksFound: number;
}

interface SaveVisitResponse {
  saved: boolean;
}

interface VisitHistoryResponse {
  visits: Visit[];
}

interface ClearHistoryResponse {
  cleared: boolean;
}

async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error("No active tab is available.");
  return tab.id;
}

async function sendToActiveTab<Response>(action: string): Promise<Response> {
  const tabId = await getActiveTabId();
  return chrome.tabs.sendMessage(tabId, { action }) as Promise<Response>;
}

function App() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [status, setStatus] = useState("Open a regular web page to try the extension.");

  const highlightLinks = async (): Promise<void> => {
    try {
      const response = await sendToActiveTab<HighlightLinksResponse>("highlightLinks");
      setStatus(
        response.success
          ? `Highlighted ${response.linksFound} links.`
          : "The page could not be highlighted.",
      );
    } catch {
      setStatus("This page does not allow the extension content script.");
    }
  };

  const getPageInfo = async (): Promise<void> => {
    try {
      const response = await sendToActiveTab<PageInfo>("getPageInfo");
      setPageInfo(response);
      setStatus(`Found ${response.linkCount} links on this page.`);
    } catch {
      setStatus("Page information is not available on this tab.");
    }
  };

  const saveCurrentPage = async (): Promise<void> => {
    if (!pageInfo) {
      setStatus("Read the current page before saving it.");
      return;
    }

    try {
      const response = (await chrome.runtime.sendMessage({
        action: "saveVisit",
        visit: {
          url: pageInfo.url,
          title: pageInfo.title,
          timestamp: Date.now(),
        },
      })) as SaveVisitResponse;
      setStatus(response.saved ? "Page saved locally." : "Chrome could not save this page.");
    } catch {
      setStatus("The background worker did not respond.");
    }
  };

  const loadHistory = async (): Promise<void> => {
    try {
      const response = (await chrome.runtime.sendMessage({
        action: "getVisitHistory",
      })) as VisitHistoryResponse;
      setVisits(response.visits);
      setStatus(response.visits.length ? "Saved pages loaded." : "No pages are saved yet.");
    } catch {
      setStatus("Chrome could not load saved pages.");
    }
  };

  const clearHistory = async (): Promise<void> => {
    try {
      const response = (await chrome.runtime.sendMessage({
        action: "clearVisitHistory",
      })) as ClearHistoryResponse;
      if (!response.cleared) {
        setStatus("Chrome could not clear saved pages.");
        return;
      }
      setVisits([]);
      setStatus("Saved pages cleared.");
    } catch {
      setStatus("The background worker did not respond.");
    }
  };

  return (
    <main className="popup">
      <p className="eyebrow">React + Vite</p>
      <h1>Page toolkit</h1>
      <p className="status" role="status">
        {status}
      </p>

      <div className="actions">
        <button onClick={getPageInfo}>Read page</button>
        <button onClick={highlightLinks}>Highlight links</button>
        <button onClick={saveCurrentPage} disabled={!pageInfo}>
          Save page
        </button>
      </div>

      {pageInfo ? (
        <section className="page-info">
          <strong>{pageInfo.title}</strong>
          <span>{pageInfo.url}</span>
          <span>{pageInfo.linkCount} links</span>
        </section>
      ) : null}

      <section className="history">
        <div className="history-heading">
          <h2>Saved pages</h2>
          <button className="text-button" onClick={loadHistory}>
            Refresh
          </button>
          <button className="text-button" onClick={clearHistory} disabled={!visits.length}>
            Clear
          </button>
        </div>
        {visits.map((visit) => (
          <a
            key={`${visit.timestamp}-${visit.url}`}
            href={visit.url}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{visit.title}</strong>
            <span>{new Date(visit.timestamp).toLocaleString()}</span>
          </a>
        ))}
      </section>
    </main>
  );
}

export default App;
