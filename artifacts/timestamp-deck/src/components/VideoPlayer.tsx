import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertCircle, Film, LoaderCircle } from "lucide-react";
import type { VideoEntry } from "../types";
import { loadYouTubeAPI } from "../utils/youtubeApi";

export type PlayerRef = {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
};

type Props = { video: VideoEntry };

function extractVideoId(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.host.includes("youtu.be")) return parsed.pathname.slice(1).split("/")[0];
    if (parsed.host.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v") || "";
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] === "embed" || segments[0] === "shorts") return segments[1] || "";
    }
  } catch {
    return "";
  }
  return "";
}

export const VideoPlayer = forwardRef<PlayerRef, Props>(({ video }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(false);
  const videoId = extractVideoId(video.url);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => playerRef.current?.seekTo(seconds, true),
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
  }));

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (!cancelled) setApiReady(true);
    }).catch(() => {
      if (!cancelled) setApiError(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!apiReady || !containerRef.current || !videoId) return;
    playerRef.current?.destroy();
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      height: "100%",
      width: "100%",
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    });
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [apiReady, videoId]);

  return (
    <section className="panel player-panel" data-testid="video-player">
      <div className="player-topline">
        <p className="player-title" data-testid={`text-active-video-${video.id}`}>{video.title}</p>
        <span className="player-label">{video.timestamps.length} {video.timestamps.length === 1 ? "mark" : "marks"} filed</span>
      </div>
      <div className="youtube-frame">
        {!videoId ? (
          <div className="player-placeholder" data-testid="status-invalid-video">
            <div><AlertCircle size={28} /><p>This link does not look like a YouTube video. Edit the record or add another link.</p></div>
          </div>
        ) : (
          <>
            <div ref={containerRef} data-testid="youtube-embed" />
            {!apiReady && !apiError && (
              <div className="player-placeholder" data-testid="status-player-loading">
                <div><LoaderCircle size={28} className="spin" /><p>Preparing the player...</p></div>
              </div>
            )}
            {apiError && (
              <div className="player-placeholder" data-testid="status-player-error">
                <div><Film size={28} /><p>The YouTube player could not load. Check your connection and try again.</p></div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

VideoPlayer.displayName = "VideoPlayer";