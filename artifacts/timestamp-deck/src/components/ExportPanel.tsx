import { useState } from "react";
import { Clipboard, FileDown, FileText, LockKeyhole } from "lucide-react";
import type { Project } from "../types";
import { secureWriteClipboard } from "../utils/secureClipboard";
import { encryptProject } from "../utils/crypto";
import { downloadFile } from "../utils/download";
import { EncryptModal } from "./EncryptModal";

type Props = { project: Project; secureMode: boolean };
type PendingAction = "clipboard" | "download" | null;

export function ExportPanel({ project, secureMode }: Props) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [status, setStatus] = useState<string | null>(null);

  const confirmUnsafeExport = () => {
    if (!secureMode) return true;
    return window.confirm("Secure Mode is on. This export will not be encrypted. Continue?");
  };

  const exportJSON = async () => {
    if (!confirmUnsafeExport()) return;
    try {
      await secureWriteClipboard(JSON.stringify(project, null, 2), secureMode);
      setStatus("JSON copied");
    } catch {
      setStatus("Clipboard unavailable");
    }
  };

  const exportText = async () => {
    if (!confirmUnsafeExport()) return;
    const lines: string[] = [];
    for (const video of project.videos) {
      lines.push(`Video: ${video.title}`, video.sourceType === "local"
        ? `File: ${video.localFileName ?? "Local video"} (stored on this device)`
        : `URL: ${video.url}`);
      for (const timestamp of video.timestamps) lines.push(`  - ${formatExportTime(timestamp.timeSeconds)} — ${timestamp.label}`);
      lines.push("");
    }
    try {
      await secureWriteClipboard(lines.join("\n"), secureMode);
      setStatus("Plain text copied");
    } catch {
      setStatus("Clipboard unavailable");
    }
  };

  const handleEncryptConfirm = async (password: string) => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    try {
      const payload = await encryptProject(project, password);
      const json = JSON.stringify(payload, null, 2);
      if (action === "clipboard") {
        await secureWriteClipboard(json, secureMode);
        setStatus("Encrypted project copied");
      } else {
        const filename = `timestamp-deck-${Date.now()}.tdenc`;
        downloadFile(filename, json);
        setStatus("Encrypted file downloaded");
      }
    } catch (caught) {
      console.error(caught);
      setStatus("Encryption failed");
    }
  };

  return (
    <div className="export-panel" data-testid="export-panel">
      <h3>Take it with you</h3>
      {secureMode && <p className="secure-note"><LockKeyhole size={13} /> Secure mode asks before plain exports.</p>}
      <button className="button button-sidebar" onClick={() => void exportJSON()} data-testid="button-export-json"><Clipboard size={15} /> Copy JSON</button>
      <button className="button button-sidebar" onClick={() => void exportText()} data-testid="button-export-text"><FileText size={15} /> Copy reading list</button>
      <button className="button button-sidebar" onClick={() => setPendingAction("clipboard")} data-testid="button-export-encrypted-copy"><LockKeyhole size={15} /> Encrypt & copy</button>
      <button className="button button-sidebar" onClick={() => setPendingAction("download")} data-testid="button-export-encrypted-file"><FileDown size={15} /> Download encrypted</button>
      {status && <span style={{ color: "hsl(var(--sidebar-ink) / .52)", fontSize: ".68rem" }} role="status" data-testid="status-export">{status}</span>}
      <EncryptModal isOpen={pendingAction !== null} title="Set an encryption password" onConfirm={handleEncryptConfirm} onClose={() => setPendingAction(null)} />
    </div>
  );
}

function formatExportTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const s = safeSeconds % 60;
  const m = Math.floor((safeSeconds / 60) % 60);
  const h = Math.floor(safeSeconds / 3600);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}