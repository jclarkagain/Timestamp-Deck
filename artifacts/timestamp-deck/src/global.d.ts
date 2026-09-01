export {};

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: typeof YT;
  }

  namespace YT {
    class Player {
      constructor(element: HTMLElement, options: {
        videoId: string;
        height?: string;
        width?: string;
        playerVars?: Record<string, number>;
      });
      seekTo(seconds: number, allowSeekAhead?: boolean): void;
      getCurrentTime(): number;
      destroy(): void;
    }
  }
}
