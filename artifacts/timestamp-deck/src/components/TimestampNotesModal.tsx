import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import type { Timestamp } from "../types";

type Props = {
  timestamp: Timestamp | null;
  onSave: (notes: string) => void;
  onClose: () => void;
};

export function TimestampNotesModal({ timestamp, onSave, onClose }: Props) {
  const [text, setText] = useState(timestamp?.notes ?? "");
  useEffect(() => { setText(timestamp?.notes ?? ""); }, [timestamp]);
  if (!timestamp) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notes-heading">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div className="empty-state-icon" style={{ margin: "0 0 14px" }}><FileText size={19} /></div>
            <h2 id="notes-heading">Annotate this moment</h2>
          </div>
          <button className="icon-button" onClick={onClose} data-testid="button-close-notes" aria-label="Close notes dialog"><X size={18} /></button>
        </div>
        <p className="modal-lede">A thought, a question, a connection. Notes stay attached to {timestamp.label || "this timestamp"}.</p>
        <div className="notes-editor">
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="timestamp-notes">Your notes</label>
            <textarea id="timestamp-notes" value={text} onChange={(event) => setText(event.target.value)} rows={10} placeholder="Write what you want to remember..." data-testid="textarea-timestamp-notes" autoFocus />
          </div>
          <div className="field" style={{ marginTop: 0 }}>
            <label>Preview</label>
            <div className="notes-preview" data-testid="preview-timestamp-notes">{text || "Your annotation will appear here."}</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="button button-ghost" onClick={onClose} data-testid="button-cancel-notes">Cancel</button>
          <button className="button button-accent" onClick={() => onSave(text)} data-testid="button-save-notes"><FileText size={15} /> Save annotation</button>
        </div>
      </div>
    </div>
  );
}