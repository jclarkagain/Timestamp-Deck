export type Timestamp = {
  id: string;
  timeSeconds: number;
  label: string;
  notes?: string;
};

export type VideoEntry = {
  id: string;
  title: string;
  url: string;
  sourceType?: "youtube" | "local";
  localVideoId?: string;
  localFileName?: string;
  timestamps: Timestamp[];
};

export type Project = {
  id: string;
  name: string;
  videos: VideoEntry[];
};

export type GlobalTimestamp = {
  id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  timeSeconds: number;
  label: string;
  notes?: string;
};
