import {safeReportDownloadName} from "./report-interactive-table-export-model";

export type ReportDownloadAnchor = {
  href: string;
  download: string;
  click: () => void;
  remove: () => void;
};

export type ReportDownloadPort = {
  createUrl: (text: string) => string;
  createAnchor: () => ReportDownloadAnchor;
  appendAnchor: (anchor: ReportDownloadAnchor) => void;
  revokeUrl: (url: string) => void;
  defer: (task: () => void) => void;
};

/** Return a truthful result; never leak object URLs on failed downloads. */
export function trySaveReportCsv(
  csvWithoutBom: string,
  title: string,
  port: ReportDownloadPort,
): boolean {
  let url: string | null = null;
  let anchor: ReportDownloadAnchor | null = null;
  try {
    url = port.createUrl("\uFEFF" + csvWithoutBom);
    anchor = port.createAnchor();
    anchor.href = url;
    anchor.download = safeReportDownloadName(title);
    port.appendAnchor(anchor);
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    try { anchor?.remove(); } catch { /* failure never masks primary outcome */ }
    if (url !== null) {
      const disposableUrl = url;
      try {
        port.defer(() => {
          try { port.revokeUrl(disposableUrl); }
          catch { /* release best effort; never crash client */ }
        });
      } catch {
        // If scheduling fails, revoke synchronously rather than leaking.
        try { port.revokeUrl(disposableUrl); } catch { /* best effort */ }
      }
    }
  }
}
