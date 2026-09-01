import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertCircle, Film, LoaderCircle } from "lucide-react";
import type { VideoEntry } from "../types";
import { getLocalVideoUrl } from "../utils/localVideoStorage";
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
  const localPlayerRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [localVideoError, setLocalVideoError] = useState<string | null>(null);
  const isLocalVideo = video.sourceType === "local";
  const videoId = extractVideoId(video.url);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      if (isLocalVideo) {
        if (localPlayerRef.current) {
          localPlayerRef.current.currentTime = seconds;
          void localPlayerRef.current.play().catch(() => undefined);
        }
        return;
      }
      playerRef.current?.seekTo(seconds, true);
    },
    getCurrentTime: () => isLocalVideo
      ? localPlayerRef.current?.currentTime ?? 0
      : playerRef.current?.getCurrentTime() ?? 0,
  }));

  useEffect(() => {
    if (!isLocalVideo) return;
    let cancelled = false;
    setLocalVideoUrl(null);
    setLocalVideoError(null);
    if (!video.localVideoId) {
      setLocalVideoError("This local video does not have a stored file on this device.");
      return;
    }

    getLocalVideoUrl(video.localVideoId)
      .then((url) => {
        if (!cancelled) setLocalVideoUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLocalVideoError(error instanceof Error ? error.message : "Could not open this local video.");
        }
      });

    return () => {
      cancelled = true;
      setLocalVideoUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
    };
  }, [isLocalVideo, video.localVideoId]);

  useEffect(() => {
    if (isLocalVideo) return;
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (!cancelled) setApiReady(true);
    }).catch(() => {
      if (!cancelled) setApiError(true);
    });
    return () => { cancelled = true; };
  }, [isLocalVideo]);

  useEffect(() => {
    if (isLocalVideo || !apiReady || !containerRef.current || !videoId) return;
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
  }, [apiReady, isLocalVideo, videoId]);

  return (
    <section className="panel player-panel" data-testid="video-player">
      <div className="player-topline">
        <p className="player-title" data-testid={`text-active-video-${video.id}`}>{video.title}</p>
        <span className="player-label">{video.timestamps.length} {video.timestamps.length === 1 ? "mark" : "marks"} filed</span>
      </div>
      <div className="youtube-frame">
        {isLocalVideo ? (
          localVideoError ? (
            <div className="player-placeholder" data-testid="status-local-video-error">
              <div><AlertCircle size={28} /><p>{localVideoError}</p></div>
            </div>
          ) : localVideoUrl ? (
            <video
              ref={localPlayerRef}
              className="local-video"
              src={localVideoUrl}
              controls
              playsInline
              preload="metadata"
              data-testid="local-video-player"
            />
          ) : (
            <div className="player-placeholder" data-testid="status-local-video-loading">
              <div><LoaderCircle size={28} className="spin" /><p>Opening the local video...</p></div>
            </div>
          )
        ) : !videoId ? (
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