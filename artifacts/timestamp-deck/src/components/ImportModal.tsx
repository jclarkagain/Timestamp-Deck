import { useState } from "react";
import { FileKey, LoaderCircle, X } from "lucide-react";
import type { Project } from "../types";
import { decryptProject } from "../utils/crypto";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (project: Project) => void;
};

export function ImportModal({ isOpen, onClose, onImport }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!jsonInput.trim()) { setError("Paste the encrypted project JSON first."); return; }
    if (!password) { setError("Enter the project password."); return; }
    setError(null);
    setIsDecrypting(true);
    try {
      const imported = await decryptProject(JSON.parse(jsonInput), password);
      onImport(imported);
      setJsonInput("");
      setPassword("");
      onClose();
    } catch (caught) {
      console.error(caught);
      setError("Could not decrypt this project. Check the password and pasted JSON.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCancel = () => {
    setJsonInput("");
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDecrypting) handleCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="import-heading">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div className="empty-state-icon" style={{ margin: "0 0 14px" }}><FileKey size={19} /></div>
            <h2 id="import-heading">Open a secured deck</h2>
          </div>
          <button className="icon-button" onClick={handleCancel} disabled={isDecrypting} data-testid="button-close-import" aria-label="Close import dialog"><X size={18} /></button>
        </div>
        <p className="modal-lede">Encrypted projects are opened in your browser. Nothing is uploaded or sent elsewhere.</p>
        <div className="field">
          <label htmlFor="encrypted-json">Encrypted JSON</label>
          <textarea id="encrypted-json" rows={8} value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} disabled={isDecrypting} placeholder={'Paste a .tdenc file’s contents here'} data-testid="textarea-import-json" />
        </div>
        <div className="field">
          <label htmlFor="import-password">Password</label>
          <input id="import-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isDecrypting} data-testid="input-import-password" onKeyDown={(event) => { if (event.key === "Enter") void handleImport(); }} />
        </div>
        {error && <div className="error" role="alert" data-testid="status-import-error">{error}</div>}
        <div className="modal-actions">
          <button className="button button-ghost" onClick={handleCancel} disabled={isDecrypting} data-testid="button-cancel-import">Cancel</button>
          <button className="button button-accent" onClick={() => void handleImport()} disabled={isDecrypting} data-testid="button-submit-import">
            {isDecrypting ? <><LoaderCircle size={15} /> Opening...</> : <><FileKey size={15} /> Decrypt & open</>}
          </button>
        </div>
      </div>
    </div>
  );
}