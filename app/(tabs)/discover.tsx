import { AppHeader } from "@/components/ui/AppHeader";
import { CuratedPlaylists } from "@/components/ui";
import { TrackPreviewModal } from "@/components/ui/TrackPreviewModal";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useApiService, SpotifyPlaylist, ApiError } from "@/services/api";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface ISpotifyPlaylist {
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

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  
  const apiService = useApiService();
  const router = useRouter();

  const generateMockTracks = (playlistName: string) => {
    const mockTracks = [
      {
        id: "1",
        name: "Blinding Lights",
        artists: [{ name: "The Weeknd" }],
        album: {
          name: "After Hours",
          images: [{ url: "https://picsum.photos/300/300?random=1" }],
        },
        duration_ms: 200040,
      },
      {
        id: "2",
        name: "Watermelon Sugar",
        artists: [{ name: "Harry Styles" }],
        album: {
          name: "Fine Line",
          images: [{ url: "https://picsum.photos/300/300?random=2" }],
        },
        duration_ms: 174000,
      },
      {
        id: "3",
        name: "Good 4 U",
        artists: [{ name: "Olivia Rodrigo" }],
        album: {
          name: "SOUR",
          images: [{ url: "https://picsum.photos/300/300?random=3" }],
        },
        duration_ms: 178000,
      },
      {
        id: "4",
        name: "Levitating",
        artists: [{ name: "Dua Lipa" }],
        album: {
          name: "Future Nostalgia",
          images: [{ url: "https://picsum.photos/300/300?random=4" }],
        },
        duration_ms: 203064,
      },
      {
        id: "5",
        name: "Peaches",
        artists: [
          { name: "Justin Bieber" },
          { name: "Daniel Caesar" },
          { name: "Giveon" },
        ],
        album: {
          name: "Justice",
          images: [{ url: "https://picsum.photos/300/300?random=5" }],
        },
        duration_ms: 198000,
      },
    ];

    return mockTracks.slice(0, Math.floor(Math.random() * 5) + 3); // 3-7 tracks
  };

  const handleViewSubscriptions = (sourcePlaylistId: string) => {
    // Navigate to subscriptions tab and highlight the specific source playlist
    router.push({
      pathname: '/subscribed',
      params: { highlightSourceId: sourcePlaylistId }
    });
  };

  const handleViewTracks = async (playlist: SpotifyPlaylist) => {
    try {
      setSelectedPlaylist(playlist);
      setLoadingTracks(true);
      
      // Fetch real tracks from your Next.js API
      const response = await apiService.getPlaylistTracks(playlist.id);
      
      // Transform the Spotify API response to match our track format
      const transformedTracks = response.tracks.map((item: any) => ({
        id: item.track?.id || '',
        name: item.track?.name || 'Unknown Track',
        artists: item.track?.artists || [{ name: 'Unknown Artist' }],
        album: {
          name: item.track?.album?.name || 'Unknown Album',
          images: item.track?.album?.images || [],
        },
        duration_ms: item.track?.duration_ms || 0,
      }));
      
      setTracks(transformedTracks);
      setLoadingTracks(false);
      // Only open modal after tracks are loaded
      setModalVisible(true);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setLoadingTracks(false);
      
      // Fallback to mock data if API fails
      if (__DEV__) {
        console.log('Using fallback mock tracks...');
        setTracks(generateMockTracks(playlist.name));
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to load tracks. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.authenticatedContainer}>
        <AppHeader title="Discover" />

        <CuratedPlaylists
          onViewTracks={handleViewTracks}
          onViewSubscriptions={handleViewSubscriptions}
        />

        <TrackPreviewModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          playlist={selectedPlaylist}
          tracks={tracks}
        />

        <LoadingOverlay
          visible={loadingTracks}
          message="Fetching playlist tracks..."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  authenticatedContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
});
