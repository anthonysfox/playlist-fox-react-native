import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { iTunesAPI } from '@/services/api';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images?: Array<{ url: string }>;
  };
  duration_ms: number;
}

interface TrackPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: {
    id: string;
    name: string;
    owner: { display_name: string };
    images?: Array<{ url: string }>;
  } | null;
  tracks: Track[];
}

export function TrackPreviewModal({
  visible,
  onClose,
  playlist,
  tracks,
}: TrackPreviewModalProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});
  
  // Setup audio mode for playback
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  // Clean up on modal close
  useEffect(() => {
    if (!visible && sound) {
      sound.unloadAsync();
      setSound(null);
      setCurrentlyPlaying(null);
    }
  }, [visible, sound]);

  const playTrackPreview = async (track: Track) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setCurrentlyPlaying(null);
      }
      
      setLoadingTrack(track.id);
      
      // Check if we already have the preview URL cached
      let previewUrl = previewUrls[track.id];
      
      if (previewUrl === undefined) {
        // Search iTunes for preview URL
        const artist = track.artists[0]?.name || '';
        previewUrl = await iTunesAPI.searchTrack(artist, track.name);
        
        // Cache the result (even if null)
        setPreviewUrls(prev => ({
          ...prev,
          [track.id]: previewUrl
        }));
      }
      
      if (previewUrl) {
        // Load and play the audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: previewUrl },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setCurrentlyPlaying(track.id);
        
        // Auto-stop after 30 seconds (iTunes previews are 30s)
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setCurrentlyPlaying(null);
            setSound(null);
          }
        });
      } else {
        console.log('No preview available for track:', track.name);
      }
    } catch (error) {
      console.error('Error playing track preview:', error);
    } finally {
      setLoadingTrack(null);
    }
  };

  const stopTrackPreview = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setCurrentlyPlaying(null);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTrack = ({ item, index }: { item: Track; index: number }) => {
    const isPlaying = currentlyPlaying === item.id;
    const isLoading = loadingTrack === item.id;
    const hasPreview = previewUrls[item.id] !== null;
    const hasSearched = previewUrls[item.id] !== undefined;
    
    return (
      <TouchableOpacity
        style={[
          styles.trackItem,
          isPlaying && styles.trackItemPlaying,
        ]}
        onPress={() => isPlaying ? stopTrackPreview() : playTrackPreview(item)}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.trackNumberContainer}>
          {isPlaying ? (
            <Ionicons
              name="pause"
              size={16}
              color="#CC5500"
            />
          ) : (
            <Text style={styles.trackNumber}>{index + 1}</Text>
          )}
        </View>
        
        {item.album.images && item.album.images[0] ? (
          <Image
            source={{ uri: item.album.images[0].url }}
            style={styles.albumArt}
          />
        ) : (
          <View style={styles.albumArtPlaceholder}>
            <Ionicons name="musical-notes" size={16} color="#CC5500" />
          </View>
        )}

        <View style={styles.trackInfo}>
          <Text style={[
            styles.trackName,
            isPlaying && styles.trackNamePlaying,
          ]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {item.artists.map(artist => artist.name).join(', ')}
          </Text>
        </View>

        <Text style={styles.duration}>{formatDuration(item.duration_ms)}</Text>
        
        {/* Loading indicator or preview status */}
        <View style={styles.statusContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#CC5500" />
          ) : hasSearched && !hasPreview ? (
            <Ionicons name="ban" size={16} color="#9CA3AF" />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (!playlist) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Tracks</Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Playlist Info */}
        <View style={styles.playlistInfo}>
          {playlist.images && playlist.images[0] ? (
            <Image
              source={{ uri: playlist.images[0].url }}
              style={styles.playlistImage}
            />
          ) : (
            <View style={styles.playlistImagePlaceholder}>
              <Ionicons name="musical-notes" size={32} color="#CC5500" />
            </View>
          )}
          
          <View style={styles.playlistDetails}>
            <Text style={styles.playlistName} numberOfLines={2}>
              {playlist.name}
            </Text>
            <Text style={styles.playlistOwner}>
              by {playlist.owner.display_name}
            </Text>
            <Text style={styles.trackCount}>
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>
        </View>

        {/* Track List */}
        <FlatList
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id}
          style={styles.trackList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  playlistInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  playlistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  playlistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  playlistOwner: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  trackCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  trackList: {
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    marginBottom: 1,
  },
  trackItemPlaying: {
    backgroundColor: '#FFF7ED',
  },
  trackNumberContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumber: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginLeft: 12,
  },
  albumArtPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  trackNamePlaying: {
    color: '#CC5500',
    fontWeight: '600',
  },
  artistName: {
    fontSize: 12,
    color: '#6B7280',
  },
  duration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  statusContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});