import { AppHeader } from "@/components/ui/AppHeader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useApiService, ApiError } from "@/services/api";
import React, { useState, useEffect } from "react";
import { 
  Alert, 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface ManagedPlaylist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
  subscriptions: Array<{
    id: string;
    sourcePlaylist: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  }>;
  nextSyncTime?: string;
  lastSyncCompletedAt?: string;
}

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<ManagedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  
  const apiService = useApiService();

  const loadSubscriptions = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const userSubscriptions = await apiService.getUserSubscriptions();
      setSubscriptions(userSubscriptions || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubscriptions(true);
  };

  const handleUnsubscribe = (managedPlaylist: ManagedPlaylist, sourcePlaylistId: string) => {
    const sourcePlaylist = managedPlaylist.subscriptions.find(
      sub => sub.sourcePlaylist.id === sourcePlaylistId
    )?.sourcePlaylist;

    Alert.alert(
      "Unsubscribe",
      `Stop syncing from "${sourcePlaylist?.name}" to "${managedPlaylist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unsubscribe",
          style: "destructive",
          onPress: async () => {
            try {
              setUnsubscribingId(managedPlaylist.id);
              
              const result = await apiService.unsubscribeFromPlaylist(
                managedPlaylist.id, 
                sourcePlaylistId
              );
              
              if (result.success) {
                Alert.alert("Success", "Unsubscribed successfully!");
                loadSubscriptions(); // Reload the list
              } else {
                throw new Error(result.message || 'Unsubscribe failed');
              }
            } catch (error) {
              console.error('Unsubscribe error:', error);
              Alert.alert(
                "Unsubscribe Failed", 
                error instanceof Error ? error.message : 'Unable to unsubscribe. Please try again.'
              );
            } finally {
              setUnsubscribingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const renderSubscription = ({ item }: { item: ManagedPlaylist }) => (
    <View style={styles.subscriptionCard}>
      {/* Managed Playlist Info */}
      <View style={styles.playlistHeader}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.playlistImage} />
        ) : (
          <View style={styles.playlistImagePlaceholder}>
            <Ionicons name="musical-notes" size={24} color="#CC5500" />
          </View>
        )}
        
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.trackCount} tracks • Last sync: {formatDate(item.lastSyncCompletedAt)}
          </Text>
        </View>
      </View>

      {/* Source Playlists */}
      {item.subscriptions.map((subscription) => (
        <View key={subscription.id} style={styles.sourcePlaylistRow}>
          <View style={styles.sourceInfo}>
            {subscription.sourcePlaylist.imageUrl ? (
              <Image 
                source={{ uri: subscription.sourcePlaylist.imageUrl }} 
                style={styles.sourceImage} 
              />
            ) : (
              <View style={styles.sourceImagePlaceholder}>
                <Ionicons name="library" size={16} color="#6B7280" />
              </View>
            )}
            
            <View style={styles.sourceText}>
              <Text style={styles.sourceName} numberOfLines={1}>
                Syncing from: {subscription.sourcePlaylist.name}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.unsubscribeButton}
            onPress={() => handleUnsubscribe(item, subscription.sourcePlaylist.id)}
            disabled={unsubscribingId === item.id}
          >
            {unsubscribingId === item.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CC5500" />
          <Text style={styles.loadingText}>Loading your subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppHeader />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Subscriptions</Text>
          <Text style={styles.subtitle}>
            Playlists that automatically sync with new tracks
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Failed to Load</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadSubscriptions()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
            <Text style={styles.emptyMessage}>
              Subscribe to playlists in the Discover tab to see them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            renderItem={renderSubscription}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#CC5500"]}
                tintColor="#CC5500"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#EF4444",
  },
  errorMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#CC5500",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playlistImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  playlistImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  playlistMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  sourcePlaylistRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 4,
  },
  sourceInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  sourceImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  sourceImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sourceText: {
    flex: 1,
    marginLeft: 8,
  },
  sourceName: {
    fontSize: 14,
    color: "#374151",
  },
  unsubscribeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
  },
});