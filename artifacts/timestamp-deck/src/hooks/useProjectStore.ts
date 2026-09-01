import { useEffect, useState } from "react";
import type { Project } from "../types";

const STORAGE_KEY = "timestampDeckProject";

export function useProjectStore(initial: Project) {
  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Project) : initial;
    } catch {
      // Corrupt or unreadable localStorage data - fall back to a fresh project
      // instead of crashing the app.
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Storage might be full or unavailable (e.g. private browsing) - ignore.
    }
  }, [project]);

  return { project, setProject };
}
