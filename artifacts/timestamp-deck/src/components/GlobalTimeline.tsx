import { useMemo, useState } from "react";
import { ChevronDown, ListVideo, Play, Search, X } from "lucide-react";
import type { GlobalTimestamp, Project } from "../types";

type Props = {
  project: Project;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onJump: (videoId: string, seconds: number) => void;
};

type Grouped = {
  videoId: string;
  videoTitle: string;
  timestamps: GlobalTimestamp[];
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const s = safeSeconds % 60;
  const m = Math.floor((safeSeconds / 60) % 60);
  const h = Math.floor(safeSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export function GlobalTimeline({ project, searchQuery, setSearchQuery, onJump }: Props) {
  const rawGroups = useMemo<Grouped[]>(() => project.videos
    .map((video) => ({
      videoId: video.id,
      videoTitle: video.title || video.url,
      timestamps: video.timestamps.map((timestamp) => ({
        id: timestamp.id,
        videoId: video.id,
        videoTitle: video.title || video.url,
        videoUrl: video.url,
        timeSeconds: timestamp.timeSeconds,
        label: timestamp.label,
        notes: timestamp.notes,
      })),
    }))
    .filter((group) => group.timestamps.length > 0), [project.videos]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rawGroups;
    return rawGroups
      .map((group) => ({
        ...group,
        timestamps: group.timestamps.filter((timestamp) =>
          timestamp.label.toLowerCase().includes(query) || (timestamp.notes?.toLowerCase().includes(query) ?? false)),
      }))
      .filter((group) => group.timestamps.length > 0);
  }, [rawGroups, searchQuery]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const total = filteredGroups.reduce((sum, group) => sum + group.timestamps.length, 0);

  return (
    <div className="global-timeline" data-testid="global-timeline">
      <div className="workspace-intro">
        <div>
          <p className="eyebrow">Every record, one view</p>
          <h1 className="workspace-title">The <em>long</em> view.</h1>
        </div>
        <div className="intro-meta">
          <span>Searchable archive</span>
          <strong>{total.toString().padStart(2, "0")} results</strong>
        </div>
      </div>

      <div className="timeline-toolbar">
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search labels and notes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            data-testid="input-global-search"
            aria-label="Search labels and notes"
          />
          {searchQuery && (
            <button className="icon-button search-clear" onClick={() => setSearchQuery("")} data-testid="button-clear-search" aria-label="Clear search"><X size={15} /></button>
          )}
        </div>
        <span className="results-count">{total} {total === 1 ? "match" : "matches"}</span>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="empty-state" data-testid="empty-global-timeline">
          <div>
            <div className="empty-state-icon"><ListVideo size={19} /></div>
            <h3>{searchQuery.trim() ? "Nothing in the margins." : "Your archive is waiting."}</h3>
            <p>{searchQuery.trim() ? `No filed moments match “${searchQuery.trim()}”. Try another phrase.` : "Capture a few moments from your videos and they will gather here."}</p>
          </div>
        </div>
      ) : (
        filteredGroups.map((group) => {
          const isExpanded = expanded[group.videoId] !== false;
          return (
            <section key={group.videoId} className="group-section" data-testid={`section-video-group-${group.videoId}`}>
              <button className="group-header" onClick={() => setExpanded((current) => ({ ...current, [group.videoId]: !isExpanded }))} data-testid={`button-toggle-group-${group.videoId}`} aria-expanded={isExpanded}>
                <ChevronDown size={17} className={`group-chevron ${isExpanded ? "" : "closed"}`} />
                <span className="group-title">{group.videoTitle}</span>
                <span className="group-count">{group.timestamps.length.toString().padStart(2, "0")}</span>
              </button>
              {isExpanded && (
                <ul className="global-items">
                  {group.timestamps.map((item) => (
                    <li key={item.id} className="global-item" data-testid={`row-global-timestamp-${item.id}`}>
                      <div className="global-item-copy">
                        <span className="timestamp-time mono">{formatTime(item.timeSeconds)}</span>
                        <p className="global-item-label">{item.label || "Untitled moment"}</p>
                        {item.notes && <p className="global-notes">{item.notes.replace(/[#*_`]/g, "")}</p>}
                      </div>
                      <button className="button button-ghost" onClick={() => onJump(item.videoId, item.timeSeconds)} data-testid={`button-jump-global-${item.id}`}><Play size={14} /> Jump</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}