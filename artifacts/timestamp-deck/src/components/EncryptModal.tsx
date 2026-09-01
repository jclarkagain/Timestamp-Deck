import { useState } from "react";
import { KeyRound, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: string;
  onConfirm: (password: string) => void;
  onClose: () => void;
};

export function EncryptModal({ isOpen, title, onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;

  const reset = () => { setPassword(""); setConfirmPassword(""); setError(null); };
  const handleConfirm = () => {
    if (password.length < 8) { setError("Use at least 8 characters for the password."); return; }
    if (password !== confirmPassword) { setError("Those passwords do not match."); return; }
    onConfirm(password);
    reset();
  };
  const handleCancel = () => { reset(); onClose(); };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="encrypt-heading">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div className="empty-state-icon" style={{ margin: "0 0 14px" }}><KeyRound size={19} /></div>
            <h2 id="encrypt-heading">{title}</h2>
          </div>
          <button className="icon-button" onClick={handleCancel} data-testid="button-close-encryption" aria-label="Close encryption dialog"><X size={18} /></button>
        </div>
        <p className="modal-lede">Use a phrase you can remember. The password never leaves this browser and cannot be recovered.</p>
        <div className="field">
          <label htmlFor="encryption-password">Password</label>
          <input id="encryption-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus data-testid="input-encryption-password" />
        </div>
        <div className="field">
          <label htmlFor="encryption-confirm">Confirm password</label>
          <input id="encryption-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleConfirm(); }} data-testid="input-encryption-confirm" />
        </div>
        {error && <div className="error" role="alert" data-testid="status-encryption-error">{error}</div>}
        <div className="modal-actions">
          <button className="button button-ghost" onClick={handleCancel} data-testid="button-cancel-encryption">Cancel</button>
          <button className="button button-accent" onClick={handleConfirm} data-testid="button-confirm-encryption"><KeyRound size={15} /> Encrypt project</button>
        </div>
      </div>
    </div>
  );
}