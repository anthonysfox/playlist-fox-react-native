import { SpotifyPlaylist } from '@/services/api';

export interface ISpotifyPlaylist {
  id: string;
  name: string;
  owner: {
    display_name: string;
  };
  images?: Array<{
    url: string;
  }>;
  tracks?: {
    total: number;
  };
}

export interface Category {
  id: string;
  name: string;
}

export interface SubOption {
  id: string;
  name: string;
}

export interface CuratedPlaylistsProps {
  onSubscribe?: (playlist: SpotifyPlaylist) => void;
  onViewTracks?: (playlist: SpotifyPlaylist) => void;
  onViewSubscriptions?: (sourcePlaylistId: string) => void;
  subscribedPlaylistIds?: Set<string>;
}

// Mock categories - in real app, these would come from your API/constants
export const mockCategories: Category[] = [
  { id: "popular", name: "Popular" },
  { id: "mood", name: "Mood" },
  { id: "genre", name: "Genre" },
  { id: "activity", name: "Activity" },
];

export const mockSubOptions: { [key: string]: SubOption[] } = {
  popular: [
    { id: "trending", name: "Trending" },
    { id: "top50", name: "Top 50" },
    { id: "viral", name: "Viral" },
  ],
  mood: [
    { id: "chill", name: "Chill" },
    { id: "happy", name: "Happy" },
    { id: "focus", name: "Focus" },
  ],
  genre: [
    { id: "pop", name: "Pop" },
    { id: "rock", name: "Rock" },
    { id: "hiphop", name: "Hip Hop" },
  ],
  activity: [
    { id: "workout", name: "Workout" },
    { id: "party", name: "Party" },
    { id: "sleep", name: "Sleep" },
  ],
};

// Mock data generator
export const generateMockPlaylists = (count: number = 10): ISpotifyPlaylist[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `playlist_${Date.now()}_${i}`,
    name: `Sample Playlist ${i + 1}`,
    owner: {
      display_name: `User ${i + 1}`,
    },
    images: [
      {
        url: `https://picsum.photos/300/300?random=${i}`,
      },
    ],
    tracks: {
      total: Math.floor(Math.random() * 50) + 10,
    },
  }));
};

export const getCategoryIcon = (categoryId: string): any => {
  const icons: Record<string, any> = {
    popular: "trending-up",
    mood: "happy-outline", 
    genre: "musical-notes",
    activity: "fitness",
  };
  return icons[categoryId] || "musical-notes";
};