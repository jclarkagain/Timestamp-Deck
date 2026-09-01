import { useState } from "react";
import { Check, FileText, GripVertical, Pencil, Play, Plus, ScanLine, Trash2, X } from "lucide-react";
import type { Timestamp, VideoEntry } from "../types";
import { TimestampNotesModal } from "./TimestampNotesModal";

type Props = {
  video: VideoEntry;
  onChange: (updated: VideoEntry) => void;
  onSeek?: (seconds: number) => void;
  onCapture?: () => number | undefined;
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const s = safeSeconds % 60;
  const m = Math.floor((safeSeconds / 60) % 60);
  const h = Math.floor(safeSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export function TimestampPanel({ video, onChange, onSeek, onCapture }: Props) {
  const [editingNotes, setEditingNotes] = useState<Timestamp | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const addTimestampManual = () => {
    const input = window.prompt("Enter time in seconds:");
    if (input === null || !input.trim()) return;
    const timeSeconds = Number(input);
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      window.alert("Enter a positive number of seconds.");
      return;
    }
    const label = window.prompt("Label for this timestamp?") ?? "";
    onChange({ ...video, timestamps: [...video.timestamps, { id: `ts-${Date.now()}`, timeSeconds, label }] });
  };

  const handleCapture = () => {
    if (!onCapture) return;
    const time = onCapture();
    if (time == null) {
      window.alert("The player is not ready yet.");
      return;
    }
    const label = window.prompt("Label for this timestamp?") ?? "";
    onChange({ ...video, timestamps: [...video.timestamps, { id: `ts-${Date.now()}`, timeSeconds: Math.floor(time), label }] });
  };

  const updateTimestamp = (id: string, patch: Partial<Timestamp>) => {
    onChange({ ...video, timestamps: video.timestamps.map((timestamp) => timestamp.id === id ? { ...timestamp, ...patch } : timestamp) });
  };

  const deleteTimestamp = (id: string) => {
    if (!window.confirm("Delete this timestamp?")) return;
    onChange({ ...video, timestamps: video.timestamps.filter((timestamp) => timestamp.id !== id) });
  };

  const beginLabelEdit = (timestamp: Timestamp) => {
    setEditingLabelId(timestamp.id);
    setEditingLabel(timestamp.label);
  };

  const commitLabelEdit = () => {
    if (!editingLabelId) return;
    updateTimestamp(editingLabelId, { label: editingLabel.trim() || "Untitled moment" });
    setEditingLabelId(null);
  };

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, id: string) => {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (event: React.DragEvent<HTMLLIElement>, destinationId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === destinationId) return;
    const reordered = [...video.timestamps];
    const sourceIndex = reordered.findIndex((timestamp) => timestamp.id === sourceId);
    const destinationIndex = reordered.findIndex((timestamp) => timestamp.id === destinationId);
    if (sourceIndex < 0 || destinationIndex < 0) return;
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);
    onChange({ ...video, timestamps: reordered });
    setDraggingId(null);
  };

  const saveNotes = (notes: string) => {
    if (!editingNotes) return;
    updateTimestamp(editingNotes.id, { notes });
    setEditingNotes(null);
  };

  return (
    <section className="timestamp-wrap" data-testid="timestamp-panel">
      <div className="section-heading">
        <div>
          <h2>Filed moments</h2>
          <p>{video.timestamps.length === 0 ? "The useful parts are still ahead." : "Drag to arrange your trail through the video."}</p>
        </div>
        <div className="section-actions">
          <button className="button button-ghost" onClick={addTimestampManual} data-testid="button-add-manual-timestamp"><Plus size={15} /> Manual</button>
          <button className="button button-accent" onClick={handleCapture} data-testid="button-capture-timestamp"><ScanLine size={15} /> Capture now <kbd>C</kbd></button>
        </div>
      </div>

      {video.timestamps.length === 0 ? (
        <div className="empty-state" data-testid="empty-timestamps">
          <div>
            <div className="empty-state-icon"><ScanLine size={19} /></div>
            <h3>Leave a pin in the film.</h3>
            <p>Capture the current player time, or file a moment manually when you already know where it lives.</p>
            <button className="button button-accent" onClick={handleCapture} data-testid="button-empty-capture"><ScanLine size={15} /> Capture current time</button>
          </div>
        </div>
      ) : (
        <ul className="timestamp-list" data-testid="list-timestamps">
          {video.timestamps.map((timestamp) => (
            <li
              key={timestamp.id}
              className={`timestamp-card ${draggingId === timestamp.id ? "dragging" : ""}`}
              draggable
              onDragStart={(event) => handleDragStart(event, timestamp.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, timestamp.id)}
              data-testid={`card-timestamp-${timestamp.id}`}
            >
              <div className="drag-handle" title="Drag to reorder" aria-label="Drag to reorder"><GripVertical size={18} /></div>
              <div className="timestamp-main">
                <button className="timestamp-time mono" onClick={() => onSeek?.(timestamp.timeSeconds)} data-testid={`button-seek-timestamp-${timestamp.id}`} title="Jump to this moment">{formatTime(timestamp.timeSeconds)}</button>
                {editingLabelId === timestamp.id ? (
                  <div className="edit-label">
                    <input value={editingLabel} onChange={(event) => setEditingLabel(event.target.value)} autoFocus data-testid={`input-edit-label-${timestamp.id}`} onKeyDown={(event) => { if (event.key === "Enter") commitLabelEdit(); if (event.key === "Escape") setEditingLabelId(null); }} />
                    <button className="icon-button" onClick={commitLabelEdit} data-testid={`button-save-label-${timestamp.id}`} aria-label="Save label"><Check size={15} /></button>
                    <button className="icon-button" onClick={() => setEditingLabelId(null)} data-testid={`button-cancel-label-${timestamp.id}`} aria-label="Cancel label edit"><X size={15} /></button>
                  </div>
                ) : (
                  <p className="timestamp-label" data-testid={`text-label-${timestamp.id}`}>{timestamp.label || "Untitled moment"}</p>
                )}
                {timestamp.notes && <span className="timestamp-note" data-testid={`text-note-${timestamp.id}`}>{timestamp.notes.replace(/[#*_`]/g, "")}</span>}
              </div>
              <div className="timestamp-controls">
                <button className="icon-button" onClick={() => onSeek?.(timestamp.timeSeconds)} data-testid={`button-jump-timestamp-${timestamp.id}`} aria-label="Jump to timestamp"><Play size={15} /></button>
                <button className="icon-button" onClick={() => beginLabelEdit(timestamp)} data-testid={`button-edit-label-${timestamp.id}`} aria-label="Edit label"><Pencil size={15} /></button>
                <button className="icon-button" onClick={() => setEditingNotes(timestamp)} data-testid={`button-edit-notes-${timestamp.id}`} aria-label="Edit notes"><FileText size={15} /></button>
                <button className="icon-button icon-button-danger" onClick={() => deleteTimestamp(timestamp.id)} data-testid={`button-delete-timestamp-${timestamp.id}`} aria-label="Delete timestamp"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <TimestampNotesModal timestamp={editingNotes} onSave={saveNotes} onClose={() => setEditingNotes(null)} />
    </section>
  );
}