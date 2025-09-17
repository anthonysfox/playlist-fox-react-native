import { useAuth } from "@clerk/clerk-expo";

// Custom Error Class
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Network configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  owner: {
    display_name: string;
    id: string;
  };
  images?: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
  tracks?: {
    total: number;
  };
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    images?: Array<{
      url: string;
    }>;
  };
  duration_ms: number;
  external_urls?: {
    spotify: string;
  };
}

// API Service Class
class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : "Network error occurred"
      );
    }
  }

  // Get authenticated request headers
  private async getAuthHeaders(getToken: () => Promise<string | null>) {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Fetch curated playlists (matches your Next.js /api/spotify/curated-playlists)
  async getCuratedPlaylists(
    getToken: () => Promise<string | null>,
    category: string = "popular",
    offset: number = 0
  ): Promise<SpotifyPlaylist[]> {
    const headers = await this.getAuthHeaders(getToken);
    const params = new URLSearchParams({
      category,
      offset: offset.toString(),
    });
    return this.makeRequest<SpotifyPlaylist[]>(
      `/spotify/curated-playlists?${params}`,
      { headers }
    );
  }

  // Fetch tracks for a specific playlist (matches your Next.js /api/spotify/playlists/[playlist])
  async getPlaylistTracks(
    playlistId: string,
    getToken: () => Promise<string | null>
  ): Promise<{ tracks: SpotifyTrack[]; playlist: SpotifyPlaylist }> {
    const headers = await this.getAuthHeaders(getToken);
    const params = new URLSearchParams({
      tracks: "true",
      metadata: "true",
    });
    return this.makeRequest<{
      tracks: SpotifyTrack[];
      playlist: SpotifyPlaylist;
    }>(`/spotify/playlists/${playlistId}?${params}`, { headers });
  }

  // Subscribe to a playlist with full Next.js API compatibility
  async subscribeToPlaylist(
    subscriptionData: {
      sourcePlaylist: {
        id: string;
        name: string;
        imageUrl: string;
        trackCount: number;
      };
      managedPlaylist?: {
        id: string;
        name: string;
        imageUrl: string;
        trackCount: number;
      };
      newPlaylistName?: string;
      syncFrequency?: string;
      syncQuantityPerSource?: number;
      runImmediateSync?: boolean;
      syncMode?: string;
      explicitContentFilter?: boolean;
      trackAgeLimit?: number;
      customDays?: string[];
    },
    getToken: () => Promise<string | null>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const headers = await this.getAuthHeaders(getToken);

    const body = {
      ...subscriptionData,
      syncFrequency: subscriptionData.syncFrequency || "WEEKLY",
      syncQuantityPerSource: subscriptionData.syncQuantityPerSource || 5,
      runImmediateSync: subscriptionData.runImmediateSync ?? true,
      syncMode: subscriptionData.syncMode || "APPEND",
      explicitContentFilter: subscriptionData.explicitContentFilter || false,
      trackAgeLimit: subscriptionData.trackAgeLimit || 0,
    };

    return this.makeRequest("/spotify/playlists/subscribe", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  // Get user's own playlists for subscription destination selection
  async getUserPlaylists(
    offset: number = 0,
    limit: number = 20,
    getToken: () => Promise<string | null>,
    ownedOnly: boolean = true
  ): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    const queryParams = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      ...(ownedOnly && { owned_only: "true" }),
    });

    return this.makeRequest<any[]>(`/spotify/user/playlists?${queryParams}`, {
      headers,
    });
  }

  // Unsubscribe from a playlist
  async unsubscribeFromPlaylist(
    managedPlaylistId: string,
    sourcePlaylistId: string,
    getToken: () => Promise<string | null>
  ): Promise<{ success: boolean; message: string }> {
    const headers = await this.getAuthHeaders(getToken);
    return this.makeRequest(
      `/users/managed-playlists/${managedPlaylistId}/subscriptions/${sourcePlaylistId}`,
      {
        method: "DELETE",
        headers,
      }
    );
  }

  // Get user's subscribed playlists (simplified)
  async getUserSubscriptions(
    getToken: () => Promise<string | null>
  ): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    return this.makeRequest<any[]>("/users/managed-playlists", { headers });
  }

  // Search for playlists (matches your Next.js /api/spotify/search)
  async searchPlaylists(
    searchText: string,
    getToken: () => Promise<string | null>,
    offset: number = 0
  ): Promise<SpotifyPlaylist[]> {
    const headers = await this.getAuthHeaders(getToken);
    const params = new URLSearchParams({
      searchText: searchText.trim(),
      offset: offset.toString(),
    });
    return this.makeRequest<SpotifyPlaylist[]>(`/spotify/search?${params}`, {
      headers,
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Custom hooks for API calls
export const useApiService = () => {
  const { getToken } = useAuth();

  return {
    getCuratedPlaylists: (category?: string, offset?: number) =>
      apiService.getCuratedPlaylists(getToken, category, offset),
    getPlaylistTracks: (playlistId: string) =>
      apiService.getPlaylistTracks(playlistId, getToken),
    subscribeToPlaylist: (subscriptionData: any) =>
      apiService.subscribeToPlaylist(subscriptionData, getToken),
    unsubscribeFromPlaylist: (
      managedPlaylistId: string,
      sourcePlaylistId: string
    ) =>
      apiService.unsubscribeFromPlaylist(
        managedPlaylistId,
        sourcePlaylistId,
        getToken
      ),
    getUserSubscriptions: () => apiService.getUserSubscriptions(getToken),
    getUserPlaylists: (offset?: number, limit?: number, ownedOnly?: boolean) =>
      apiService.getUserPlaylists(offset, limit, getToken, ownedOnly),
    searchPlaylists: (searchText: string, offset?: number) =>
      apiService.searchPlaylists(searchText, getToken, offset),
  };
};

// iTunes Search API for track previews (free, no auth required)
export const iTunesAPI = {
  // Helper function to clean track names for better matching
  cleanTrackName(name: string): string {
    return (
      name
        .toLowerCase()
        // Remove common remix/version indicators
        .replace(/\s*\(.*?remix.*?\)/gi, "")
        .replace(/\s*\(.*?version.*?\)/gi, "")
        .replace(/\s*\(.*?edit.*?\)/gi, "")
        .replace(/\s*\(feat\..*?\)/gi, "")
        .replace(/\s*\(ft\..*?\)/gi, "")
        .replace(/\s*-\s*remix/gi, "")
        .replace(/\s*-\s*radio edit/gi, "")
        .replace(/\s*-\s*extended/gi, "")
        // Remove extra whitespace
        .trim()
    );
  },

  // Helper function to calculate similarity between two strings
  similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },

  // Levenshtein distance calculation
  levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  },

  // Filter results to find the best match
  findBestMatch(
    results: any[],
    originalTrack: string,
    originalArtist: string
  ): any | null {
    if (!results || results.length === 0) return null;

    const cleanOriginalTrack = this.cleanTrackName(originalTrack);
    const cleanOriginalArtist = originalArtist.toLowerCase().trim();

    let bestMatch = null;
    let bestScore = 0;

    for (const result of results) {
      if (!result.previewUrl) continue;

      const cleanResultTrack = this.cleanTrackName(result.trackName || "");
      const cleanResultArtist = (result.artistName || "").toLowerCase().trim();

      // Calculate similarity scores
      const trackSimilarity = this.similarity(
        cleanOriginalTrack,
        cleanResultTrack
      );
      const artistSimilarity = this.similarity(
        cleanOriginalArtist,
        cleanResultArtist
      );

      // Weighted score (track name is more important)
      const totalScore = trackSimilarity * 0.7 + artistSimilarity * 0.3;

      // Prefer exact matches and penalize remixes
      let penalty = 0;
      const resultTrackLower = (result.trackName || "").toLowerCase();
      if (
        resultTrackLower.includes("remix") &&
        !originalTrack.toLowerCase().includes("remix")
      ) {
        penalty = 0.3;
      }
      if (
        resultTrackLower.includes("karaoke") ||
        resultTrackLower.includes("instrumental")
      ) {
        penalty = 0.5;
      }

      const finalScore = totalScore - penalty;

      console.log(
        `iTunes match: "${result.trackName}" by ${
          result.artistName
        } - Score: ${finalScore.toFixed(2)}`
      );

      if (finalScore > bestScore && finalScore > 0.6) {
        // Minimum threshold
        bestScore = finalScore;
        bestMatch = result;
      }
    }

    return bestMatch;
  },

  async searchTrack(artist: string, track: string): Promise<string | null> {
    try {
      // Strategy 1: Search with both artist and track
      const query1 = encodeURIComponent(`${artist} ${track}`);
      const response1 = await fetch(
        `https://itunes.apple.com/search?term=${query1}&media=music&entity=song&limit=10`
      );
      const data1 = await response1.json();

      let bestMatch = this.findBestMatch(data1.results, track, artist);

      if (bestMatch) {
        console.log(
          `iTunes found match: "${bestMatch.trackName}" by ${bestMatch.artistName}`
        );
        return bestMatch.previewUrl;
      }

      // Strategy 2: Search with just track name if first search failed
      console.log("iTunes: Trying search with track name only...");
      const query2 = encodeURIComponent(track);
      const response2 = await fetch(
        `https://itunes.apple.com/search?term=${query2}&media=music&entity=song&limit=15`
      );
      const data2 = await response2.json();

      bestMatch = this.findBestMatch(data2.results, track, artist);

      if (bestMatch) {
        console.log(
          `iTunes found match (track-only search): "${bestMatch.trackName}" by ${bestMatch.artistName}`
        );
        return bestMatch.previewUrl;
      }

      console.log(
        `iTunes: No suitable match found for "${track}" by ${artist}`
      );
      return null;
    } catch (error) {
      console.error("iTunes API error:", error);
      return null;
    }
  },
};
