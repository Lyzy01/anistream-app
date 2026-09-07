import Constants from "expo-constants";

// Set this in app.config.ts -> extra.apiBaseUrl, so it's easy to swap between
// your local dev server and the deployed Render URL without touching code.
export const API_BASE_URL: string =
  Constants.expoConfig?.extra?.apiBaseUrl ?? "https://anistream-backend.onrender.com";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retryOnColdStart = true): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    // Render free tier: a spun-down instance can take 30-60s to wake up and
    // may return a gateway-style error on the very first request. One silent
    // retry after a short delay smooths that over for the user.
    if (retryOnColdStart && (res.status === 502 || res.status === 503)) {
      await new Promise((r) => setTimeout(r, 3000));
      return request<T>(path, options, false);
    }

    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed with status ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}

// --- Types (trimmed to the fields the UI actually uses) --------------------

export type AnimeSummary = {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string; large_image_url?: string } };
  synopsis?: string;
  score?: number;
  episodes?: number;
  status?: string;
};

export type AnimeDetails = AnimeSummary & {
  genres: { name: string }[];
  aired: { string: string };
  trailer?: { youtube_id?: string };
  studios: { name: string }[];
};

export type Episode = {
  mal_id: number;
  title: string;
  episode: string;
  aired?: string;
};

// --- Jikan-backed endpoints --------------------------------------------

export function searchAnime(query: string, page = 1) {
  return request<{ data: AnimeSummary[] }>(
    `/api/anime/search?q=${encodeURIComponent(query)}&page=${page}`
  );
}

export function getTrendingAnime(page = 1) {
  return request<{ data: AnimeSummary[] }>(`/api/anime/trending?page=${page}`);
}

export function getSeasonalAnime(year?: number, season?: string, page = 1) {
  const q = year && season ? `?year=${year}&season=${season}&page=${page}` : `?page=${page}`;
  return request<{ data: AnimeSummary[] }>(`/api/anime/seasonal${q}`);
}

export function getAnimeDetails(id: string | number) {
  return request<{ data: AnimeDetails }>(`/api/anime/${id}`);
}

export function getAnimeEpisodes(id: string | number, page = 1) {
  return request<{ data: Episode[] }>(`/api/anime/${id}/episodes?page=${page}`);
}
