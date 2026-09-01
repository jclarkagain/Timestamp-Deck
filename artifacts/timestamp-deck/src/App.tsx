import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Film,
  LayoutList,
  Moon,
  Plus,
  ShieldCheck,
  ShieldOff,
  Sun,
  Upload,
  X,
} from "lucide-react";
import type { Project, VideoEntry } from "./types";
import { useProjectStore } from "./hooks/useProjectStore";
import { VideoPlayer, PlayerRef } from "./components/VideoPlayer";
import { TimestampPanel } from "./components/TimestampPanel";
import { GlobalTimeline } from "./components/GlobalTimeline";
import { ImportModal } from "./components/ImportModal";
import { ExportPanel } from "./components/ExportPanel";

const createEmptyProject = (): Project => ({
  id: "proj-1",
  name: "My Timestamp Deck",
  videos: [],
});

export function App() {
  const { project, setProject } = useProjectStore(createEmptyProject());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showGlobalTimeline, setShowGlobalTimeline] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [secureMode, setSecureMode] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("timestampDeckTheme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const playerRef = useRef<PlayerRef | null>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("timestampDeckTheme", theme);
    } catch {
      // Theme persistence is best effort.
    }
  }, [theme]);

  const activeVideo: VideoEntry | undefined = useMemo(
    () => project.videos.find((v) => v.id === activeVideoId) ?? project.videos[0],
    [project.videos, activeVideoId],
  );

  useEffect(() => {
    if (!activeVideo && project.videos.length > 0) {
      setActiveVideoId(project.videos[0].id);
    }
  }, [project.videos, activeVideo]);

  const updateVideo = (updated: VideoEntry) => {
    setProject((current) => ({
      ...current,
      videos: current.videos.map((video) => (video.id === updated.id ? updated : video)),
    }));
  };

  const submitNewVideo = () => {
    const url = newVideoUrl.trim();
    if (!url) return;
    const newVideo: VideoEntry = {
      id: `vid-${Date.now()}`,
      title: newVideoTitle.trim() || "Untitled video",
      url,
      timestamps: [],
    };
    setProject((current) => ({ ...current, videos: [...current.videos, newVideo] }));
    setActiveVideoId(newVideo.id);
    setNewVideoUrl("");
    setNewVideoTitle("");
    setIsAddVideoOpen(false);
  };

  const jumpToTimestamp = (videoId: string, seconds: number) => {
    setActiveVideoId(videoId);
    setShowGlobalTimeline(false);
    window.setTimeout(() => playerRef.current?.seekTo(seconds), 160);
  };

  const handleImport = (imported: Project) => {
    setProject(imported);
    setActiveVideoId(imported.videos[0]?.id ?? null);
  };

  const getCurrentTime = () => playerRef.current?.getCurrentTime() ?? 0;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key.toLowerCase() === "f") {
        document.querySelector<HTMLInputElement>("input[data-testid='input-global-search']")?.focus();
      }
      if (event.key.toLowerCase() === "c" && activeVideo) {
        const time = getCurrentTime();
        const label = window.prompt("Label for captured timestamp?") ?? "";
        updateVideo({
          ...activeVideo,
          timestamps: [
            ...activeVideo.timestamps,
            { id: `ts-${Date.now()}`, timeSeconds: Math.floor(time), label },
          ],
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeVideo]);

  const timestampCount = project.videos.reduce((sum, video) => sum + video.timestamps.length, 0);

  return (
    <div className="app">
      <header className="header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><BookOpen size={18} strokeWidth={2.4} /></div>
          <div>
            <p className="brand-name">Timestamp Deck</p>
            <p className="brand-kicker">A desk for watching closely</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="shortcut-hint"><kbd>F</kbd> search&nbsp;&nbsp; <kbd>C</kbd> capture</span>
          <button
            className={`button ${secureMode ? "button-accent" : "button-ghost"}`}
            onClick={() => setSecureMode((mode) => !mode)}
            data-testid="button-toggle-secure-mode"
            aria-pressed={secureMode}
            title="Toggle secure mode"
          >
            {secureMode ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
            <span>{secureMode ? "Secure on" : "Secure off"}</span>
          </button>
          <button
            className="button button-ghost"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            data-testid="button-toggle-theme"
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === "light" ? "Night" : "Day"}</span>
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <h2>Study shelf</h2>
            <span className="video-count" data-testid="text-video-count">{project.videos.length.toString().padStart(2, "0")}</span>
          </div>
          {project.videos.length > 0 ? (
            <ul className="video-list" data-testid="list-videos">
              {project.videos.map((video, index) => (
                <li key={video.id}>
                  <button
                    className={`video-item ${video.id === activeVideo?.id && !showGlobalTimeline ? "active" : ""}`}
                    onClick={() => { setActiveVideoId(video.id); setShowGlobalTimeline(false); }}
                    data-testid={`button-select-video-${video.id}`}
                    title={video.title}
                  >
                    <span className="video-number">{(index + 1).toString().padStart(2, "0")}</span>
                    <span>
                      <span className="video-title">{video.title}</span>
                      <span className="video-subtitle">{video.timestamps.length} {video.timestamps.length === 1 ? "mark" : "marks"}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="sidebar-empty">
              <p className="sidebar-label">Nothing filed yet</p>
              <p style={{ margin: 0, color: "hsl(var(--sidebar-ink) / .55)", fontSize: ".76rem", lineHeight: 1.5 }}>
                Add a video to begin your first record.
              </p>
            </div>
          )}

          <div className="sidebar-divider" />
          <div className="sidebar-tools">
            <button className="button button-accent" onClick={() => setIsAddVideoOpen(true)} data-testid="button-add-video">
              <Plus size={16} /> Add video
            </button>
            <button className="button button-sidebar" onClick={() => setShowGlobalTimeline((showing) => !showing)} data-testid="button-toggle-timeline">
              <LayoutList size={15} /> {showGlobalTimeline ? "Back to player" : "Global timeline"}
            </button>
            <button className="button button-sidebar" onClick={() => setIsImportModalOpen(true)} data-testid="button-open-import">
              <Upload size={15} /> Import encrypted
            </button>
            <ExportPanel project={project} secureMode={secureMode} />
          </div>
        </aside>

        <section className="content">
          <div className="workspace">
            {showGlobalTimeline ? (
              <GlobalTimeline project={project} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onJump={jumpToTimestamp} />
            ) : activeVideo ? (
              <>
                <div className="workspace-intro">
                  <div>
                    <p className="eyebrow">Active study desk</p>
                    <h1 className="workspace-title">Watch it <em>closely.</em></h1>
                  </div>
                  <div className="intro-meta">
                    <span>Current record</span>
                    <strong>{timestampCount.toString().padStart(2, "0")} timestamps</strong>
                  </div>
                </div>
                <VideoPlayer ref={playerRef} video={activeVideo} />
                <TimestampPanel video={activeVideo} onChange={updateVideo} onSeek={(seconds) => playerRef.current?.seekTo(seconds)} onCapture={getCurrentTime} />
              </>
            ) : (
              <div className="empty-state" style={{ minHeight: "55vh" }} data-testid="empty-project-state">
                <div>
                  <div className="empty-state-icon"><Film size={20} /></div>
                  <h3>Your desk is clear.</h3>
                  <p>Bring in a YouTube video and start collecting the moments worth returning to.</p>
                  <button className="button button-accent" onClick={() => setIsAddVideoOpen(true)} data-testid="button-empty-add-video">
                    <Plus size={16} /> Add your first video
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {isAddVideoOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddVideoOpen(false); }}>
          <div className="modal add-video-modal" role="dialog" aria-modal="true" aria-labelledby="add-video-heading">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <p className="eyebrow">New record</p>
                <h2 id="add-video-heading">File a video</h2>
              </div>
              <button className="icon-button" onClick={() => setIsAddVideoOpen(false)} data-testid="button-close-add-video" aria-label="Close add video dialog"><X size={18} /></button>
            </div>
            <p className="modal-lede">Paste a YouTube link. Give it a name you will recognize when you return in a week.</p>
            <div className="field">
              <label htmlFor="video-url">YouTube URL</label>
              <input id="video-url" value={newVideoUrl} onChange={(event) => setNewVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." autoFocus data-testid="input-video-url" onKeyDown={(event) => { if (event.key === "Enter") submitNewVideo(); }} />
            </div>
            <div className="field">
              <label htmlFor="video-title">Title <span style={{ opacity: .65 }}>(optional)</span></label>
              <input id="video-title" value={newVideoTitle} onChange={(event) => setNewVideoTitle(event.target.value)} placeholder="e.g. The shape of a good argument" data-testid="input-video-title" />
            </div>
            <div className="modal-actions">
              <button className="button button-ghost" onClick={() => setIsAddVideoOpen(false)} data-testid="button-cancel-add-video">Cancel</button>
              <button className="button button-accent" onClick={submitNewVideo} disabled={!newVideoUrl.trim()} data-testid="button-submit-add-video"><Plus size={16} /> Add to shelf</button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImport} />
    </div>
  );
}

export default App;