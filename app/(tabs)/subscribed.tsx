import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/ui/AppHeader';
import { useApiService } from '@/services/api';
import { useLocalSearchParams } from 'expo-router';

interface ManagedPlaylist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
  syncInterval: string;
  syncQuantityPerSource: number;
  nextSyncTime?: string;
  subscriptions: Array<{
    id: string;
    sourcePlaylist: {
      id: string;
      spotifyPlaylistId: string;
      name: string;
      imageUrl?: string;
      trackCount: number;
    };
    lastSyncedFromSourceAt?: string;
  }>;
}

export default function SubscribedScreen() {
  const [managedPlaylists, setManagedPlaylists] = useState<ManagedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  
  const apiService = useApiService();
  const { highlightSourceId } = useLocalSearchParams();

  useEffect(() => {
    if (highlightSourceId && typeof highlightSourceId === 'string') {
      setHighlightedSourceId(highlightSourceId);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedSourceId(null), 3000);
    }
  }, [highlightSourceId]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const subscriptions = await apiService.getUserSubscriptions();
      setManagedPlaylists(subscriptions);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      Alert.alert('Error', 'Failed to load your subscriptions. Please try again.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadSubscriptions(true);
  };

  const handleUnsubscribe = async (managedPlaylistId: string, sourcePlaylistId: string, sourcePlaylistName: string) => {
    Alert.alert(
      'Unsubscribe',
      `Stop syncing from "${sourcePlaylistName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.unsubscribeFromPlaylist(managedPlaylistId, sourcePlaylistId);
              
              // Update state locally instead of making another API call
              setManagedPlaylists(prevPlaylists => {
                return prevPlaylists.map(managedPlaylist => {
                  if (managedPlaylist.id === managedPlaylistId) {
                    const updatedSubscriptions = managedPlaylist.subscriptions.filter(
                      sub => sub.sourcePlaylist.id !== sourcePlaylistId
                    );
                    return {
                      ...managedPlaylist,
                      subscriptions: updatedSubscriptions
                    };
                  }
                  return managedPlaylist;
                }).filter(managedPlaylist => managedPlaylist.subscriptions.length > 0); // Remove managed playlists with no subscriptions
              });
              
              Alert.alert('Success', `Unsubscribed from "${sourcePlaylistName}"`);
            } catch (error) {
              console.error('Failed to unsubscribe:', error);
              Alert.alert('Error', 'Failed to unsubscribe. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CC5500" />
          <Text style={styles.loadingText}>Loading your subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (managedPlaylists.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#CC5500" />
          <Text style={styles.emptyStateTitle}>No Subscriptions Yet</Text>
          <Text style={styles.emptyStateText}>
            Once you discover playlists you love, they'll appear here for easy access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Subscribed" />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#CC5500']} // Android
            tintColor="#CC5500" // iOS
          />
        }
      >
        
        {managedPlaylists.map((managedPlaylist) => (
          <View key={managedPlaylist.id} style={styles.managedPlaylistCard}>
            {/* Managed Playlist Header */}
            <View style={styles.managedPlaylistHeader}>
              <Image
                source={{ 
                  uri: managedPlaylist.imageUrl || 'https://via.placeholder.com/64x64/CCCCCC/FFFFFF?text=♪'
                }}
                style={styles.managedPlaylistImage}
              />
              <View style={styles.managedPlaylistInfo}>
                <Text style={styles.managedPlaylistName}>{managedPlaylist.name}</Text>
                <Text style={styles.managedPlaylistMeta}>
                  {managedPlaylist.trackCount} tracks • {managedPlaylist.syncInterval.toLowerCase()} sync
                </Text>
                {managedPlaylist.nextSyncTime && (
                  <Text style={styles.nextSyncText}>
                    Next sync: {new Date(managedPlaylist.nextSyncTime).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Source Subscriptions */}
            <View style={styles.sourcesSection}>
              <Text style={styles.sourcesTitle}>Sources ({managedPlaylist.subscriptions.length})</Text>
              {managedPlaylist.subscriptions.map((subscription) => (
                <View
                  key={subscription.id}
                  style={[
                    styles.sourceItem,
                    highlightedSourceId === subscription.sourcePlaylist.spotifyPlaylistId && styles.highlightedSourceItem
                  ]}
                >
                  <Image
                    source={{ 
                      uri: subscription.sourcePlaylist.imageUrl || 'https://via.placeholder.com/40x40/CCCCCC/FFFFFF?text=♪'
                    }}
                    style={styles.sourceImage}
                  />
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>{subscription.sourcePlaylist.name}</Text>
                    <Text style={styles.sourceTrackCount}>
                      {subscription.sourcePlaylist.trackCount} tracks • {managedPlaylist.syncQuantityPerSource} per sync
                    </Text>
                    {subscription.lastSyncedFromSourceAt && (
                      <Text style={styles.lastSyncText}>
                        Last sync: {new Date(subscription.lastSyncedFromSourceAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.unsubscribeButton}
                    onPress={() => handleUnsubscribe(
                      managedPlaylist.id, 
                      subscription.sourcePlaylist.id,
                      subscription.sourcePlaylist.name
                    )}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  managedPlaylistCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  managedPlaylistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  managedPlaylistImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  managedPlaylistInfo: {
    marginLeft: 16,
    flex: 1,
  },
  managedPlaylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  managedPlaylistMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  nextSyncText: {
    fontSize: 12,
    color: '#CC5500',
    fontWeight: '500',
  },
  sourcesSection: {
    padding: 16,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  highlightedSourceItem: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECACA',
    borderWidth: 2,
  },
  sourceImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sourceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sourceTrackCount: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unsubscribeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});