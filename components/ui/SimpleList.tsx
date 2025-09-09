import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface SimpleListProps {
  playlists: ISpotifyPlaylist[];
  onSubscribe?: (playlist: ISpotifyPlaylist) => void;
  onViewTracks?: (playlist: ISpotifyPlaylist) => void;
  subscribedPlaylistIds?: Set<string>;
  loadingPlaylistId?: string | null;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMoreData?: boolean;
}

interface PlaylistItemProps {
  playlist: ISpotifyPlaylist;
  onSubscribe?: (playlist: ISpotifyPlaylist) => void;
  onViewTracks?: (playlist: ISpotifyPlaylist) => void;
  isSubscribed?: boolean;
  isLoading?: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  playlist,
  onSubscribe,
  onViewTracks,
  isSubscribed = false,
  isLoading = false,
}) => {
  return (
    <View style={styles.itemContainer}>
      {/* Playlist Image */}
      <Image
        source={{ 
          uri: playlist.images?.[0]?.url || 'https://via.placeholder.com/48x48/CCCCCC/FFFFFF?text=♪'
        }}
        style={styles.playlistImage}
      />

      {/* Content */}
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={() => onViewTracks?.(playlist)}
        activeOpacity={0.7}
      >
        <Text style={styles.playlistName} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.ownerName} numberOfLines={1}>
          by {playlist.owner.display_name}
        </Text>
        
        <View style={styles.trackInfo}>
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#CC5500" />
              <Text style={styles.trackInfoText}>Loading...</Text>
            </>
          ) : (
            <>
              <Ionicons name="musical-notes" size={12} color="#CC5500" />
              <Text style={styles.trackInfoText}>
                {playlist.tracks?.total || 0} tracks • Tap to view
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          isSubscribed ? styles.subscribedButton : styles.unsubscribedButton
        ]}
        onPress={() => onSubscribe?.(playlist)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isSubscribed ? "notifications" : "notifications-outline"}
          size={16}
          color={isSubscribed ? "#CC5500" : "white"}
        />
      </TouchableOpacity>
    </View>
  );
};

export const SimpleList: React.FC<SimpleListProps> = ({
  playlists,
  onSubscribe,
  onViewTracks,
  subscribedPlaylistIds = new Set(),
  loadingPlaylistId = null,
  onLoadMore,
  loadingMore = false,
  hasMoreData = true,
}) => {
  const renderPlaylistItem = ({ item }: { item: ISpotifyPlaylist }) => (
    <PlaylistItem
      playlist={item}
      onSubscribe={onSubscribe}
      onViewTracks={onViewTracks}
      isSubscribed={subscribedPlaylistIds.has(item.id)}
      isLoading={loadingPlaylistId === item.id}
    />
  );

  const renderFooter = () => {
    if (!hasMoreData) {
      return (
        <View style={styles.endFooter}>
          <Text style={styles.endText}>No more playlists to load</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#CC5500" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }

    return null;
  };

  const handleEndReached = () => {
    if (hasMoreData && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  if (playlists.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="musical-notes-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No playlists found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists.filter(playlist => playlist)}
        renderItem={renderPlaylistItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playlistImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackInfoText: {
    fontSize: 12,
    color: '#CC5500',
    fontWeight: '500',
  },
  subscribeButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribedButton: {
    backgroundColor: '#FED7AA',
  },
  unsubscribedButton: {
    backgroundColor: '#CC5500',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  endFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
});