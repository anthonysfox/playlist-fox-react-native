import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SimpleList } from "./SimpleList";
import { useApiService, SpotifyPlaylist, ApiError } from "@/services/api";

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

interface Category {
  id: string;
  name: string;
}

interface SubOption {
  id: string;
  name: string;
}

interface CuratedPlaylistsProps {
  onSubscribe?: (playlist: SpotifyPlaylist) => void;
  onViewTracks?: (playlist: SpotifyPlaylist) => void;
  subscribedPlaylistIds?: Set<string>;
}

// Mock categories - in real app, these would come from your API/constants
const mockCategories: Category[] = [
  { id: "popular", name: "Popular" },
  { id: "mood", name: "Mood" },
  { id: "genre", name: "Genre" },
  { id: "activity", name: "Activity" },
];

const mockSubOptions: { [key: string]: SubOption[] } = {
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
const generateMockPlaylists = (count: number = 10): ISpotifyPlaylist[] => {
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

export const CuratedPlaylists: React.FC<CuratedPlaylistsProps> = ({
  onSubscribe,
  onViewTracks,
  subscribedPlaylistIds = new Set(),
}) => {
  const [activeCategory, setActiveCategory] = useState("popular");
  const [activeSubOption, setActiveSubOption] = useState("trending");
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [searchOffset, setSearchOffset] = useState(0);
  const [hasMoreSearchData, setHasMoreSearchData] = useState(true);
  const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const apiService = useApiService();

  // Load playlists from API
  const loadPlaylists = useCallback(
    async (category: string, subOption: string, reset: boolean = true) => {
      try {
        if (reset) {
          setLoading(true);
          setCurrentOffset(0);
          setHasMoreData(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);
        
        // Map category/subOption to your Next.js API categories
        const apiCategory = subOption || category;
        const offset = reset ? 0 : currentOffset;
        
        // Get curated playlists from your Next.js API
        const rawPlaylists = await apiService.getCuratedPlaylists(apiCategory, offset);
        
        // Filter out null/undefined playlists that the backend sometimes returns
        const fetchedPlaylists = rawPlaylists.filter(playlist => 
          playlist && playlist.id && playlist.name && playlist.owner
        );
        
        // Debug logging
        console.log(`API Response - Category: ${apiCategory}, Offset: ${offset}, Raw: ${rawPlaylists.length}, Filtered: ${fetchedPlaylists.length} playlists`);
        
        if (reset) {
          setPlaylists(fetchedPlaylists);
          console.log(`Reset playlists with ${fetchedPlaylists.length} items`);
        } else {
          setPlaylists(prev => {
            // Check for duplicates
            const existingIds = new Set(prev.map(p => p.id));
            const newPlaylists = fetchedPlaylists.filter(p => !existingIds.has(p.id));
            const newTotal = prev.length + newPlaylists.length;
            
            console.log(`Fetched ${fetchedPlaylists.length} playlists, ${newPlaylists.length} new (${fetchedPlaylists.length - newPlaylists.length} duplicates), total now: ${newTotal}`);
            
            // If we got playlists but they're all duplicates, stop loading
            if (fetchedPlaylists.length > 0 && newPlaylists.length === 0) {
              console.log('All fetched playlists were duplicates - stopping infinite scroll');
              setHasMoreData(false);
            }
            
            return [...prev, ...newPlaylists];
          });
        }
        
        // Only stop loading if we get exactly 0 results
        // The API pagination is complex, so be conservative
        if (fetchedPlaylists.length === 0) {
          console.log('No more playlists available - stopping infinite scroll');
          setHasMoreData(false);
        }
        
        // Update offset for next load - use fixed increment instead of actual length
        // This works better with the API's pagination logic
        setCurrentOffset(offset + 20);
        
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setError(err instanceof ApiError ? err.message : 'Failed to load playlists');
        
        // Fallback to mock data in development
        if (__DEV__ && reset) {
          console.log('Using fallback mock data...');
          const mockPlaylists = generateMockPlaylists(12);
          setPlaylists(mockPlaylists);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiService, currentOffset]
  );

  const loadSearchResults = useCallback(async (query: string, reset: boolean = true) => {
    console.log(`loadSearchResults called - query: "${query}", reset: ${reset}`);
    
    try {
      const currentSearchOffset = reset ? 0 : searchOffset;
      
      if (reset) {
        setLoading(true);
        setSearchOffset(0);
        setHasMoreSearchData(true);
      } else {
        setLoadingMoreSearch(true);
      }
      setError(null);

      // Don't search if query is empty
      if (!query.trim()) {
        console.log('Empty query, aborting search');
        setLoading(false);
        setLoadingMoreSearch(false);
        return;
      }
      
      // Search playlists using your Next.js API
      const rawResults = await apiService.searchPlaylists(query, currentSearchOffset);
      
      // Filter out null/undefined playlists
      const searchResults = rawResults.filter(playlist => 
        playlist && playlist.id && playlist.name && playlist.owner
      );
      
      console.log(`Search API Response - Query: "${query}", Offset: ${currentSearchOffset}, Raw: ${rawResults.length}, Filtered: ${searchResults.length} playlists`);
      
      if (reset) {
        setPlaylists(searchResults);
        console.log(`Reset search results with ${searchResults.length} items`);
      } else {
        setPlaylists(prev => {
          // Check for duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newPlaylists = searchResults.filter(p => !existingIds.has(p.id));
          const newTotal = prev.length + newPlaylists.length;
          
          console.log(`Search: Fetched ${searchResults.length} playlists, ${newPlaylists.length} new (${searchResults.length - newPlaylists.length} duplicates), total now: ${newTotal}`);
          
          // If we got playlists but they're all duplicates, stop loading
          if (searchResults.length > 0 && newPlaylists.length === 0) {
            console.log('All search results were duplicates - stopping infinite scroll');
            setHasMoreSearchData(false);
          }
          
          return [...prev, ...newPlaylists];
        });
      }
      
      // Stop loading if we get no results
      if (searchResults.length === 0) {
        console.log('No more search results available - stopping infinite scroll');
        setHasMoreSearchData(false);
      }
      
      // Update search offset for next load
      setSearchOffset(currentSearchOffset + 20);
      
    } catch (err) {
      console.error('Failed to search playlists:', err);
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
      setLoadingMoreSearch(false);
    }
  }, [apiService]);

  // Handle search with debouncing - simplified
  useEffect(() => {
    console.log(`Search effect triggered - searchText: "${searchText}"`);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const trimmedText = searchText.trim();
    
    if (!trimmedText) {
      // Empty search - exit search mode immediately
      if (isSearchMode) {
        console.log('Empty search - exiting search mode');
        setIsSearchMode(false);
        setSearchOffset(0);
        setHasMoreSearchData(true);
        setLoadingMoreSearch(false);
        // Add a small delay to prevent immediate reload when keyboard dismisses
        setTimeout(() => {
          loadPlaylists(activeCategory, activeSubOption, true);
        }, 100);
      }
      return;
    }

    // Non-empty search - debounce it
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`Executing search for: "${trimmedText}"`);
      if (trimmedText === searchText.trim()) { // Double-check text hasn't changed
        setIsSearchMode(true);
        setSearchOffset(0);
        setHasMoreSearchData(true);
        loadSearchResults(trimmedText, true);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]); // Only depend on searchText

  // Load initial data
  useEffect(() => {
    if (!isSearchMode && loading) {
      loadPlaylists(activeCategory, activeSubOption);
    }
  }, [activeCategory, activeSubOption, isSearchMode, loading, loadPlaylists]);

  const handleCategoryChange = (category: string) => {
    if (isSearchMode) return;
    setActiveCategory(category);
    const defaultSubOption = mockSubOptions[category]?.[0]?.id;
    if (defaultSubOption) {
      setActiveSubOption(defaultSubOption);
      loadPlaylists(category, defaultSubOption, true);
    }
  };

  const handleSubOptionChange = (subOption: string) => {
    if (isSearchMode) return;
    setActiveSubOption(subOption);
    loadPlaylists(activeCategory, subOption, true);
  };

  const loadMorePlaylists = useCallback(() => {
    if (isSearchMode) {
      // Load more search results
      if (!loadingMoreSearch && hasMoreSearchData) {
        loadSearchResults(searchText.trim(), false);
      }
    } else {
      // Load more curated playlists
      if (!loadingMore && hasMoreData) {
        loadPlaylists(activeCategory, activeSubOption, false);
      }
    }
  }, [
    isSearchMode, 
    loadingMoreSearch, 
    hasMoreSearchData, 
    searchText, 
    loadingMore, 
    hasMoreData, 
    activeCategory, 
    activeSubOption, 
    loadPlaylists, 
    loadSearchResults
  ]);

  const handleRefresh = async () => {
    if (isSearchMode) {
      loadSearchResults(searchText.trim(), true);
    } else {
      loadPlaylists(activeCategory, activeSubOption, true);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setIsSearchMode(false);
    setSearchOffset(0);
    setHasMoreSearchData(true);
    setLoadingMoreSearch(false);
    // Reload the current category when exiting search
    setLoading(true);
  };

  const FilterButton = () => {
    const currentCategory = mockCategories.find(
      (cat) => cat.id === activeCategory
    );
    const currentSubOption = mockSubOptions[activeCategory]?.find(
      (sub) => sub.id === activeSubOption
    );

    return (
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#CC5500", "#A0522D"]}
          style={styles.filterGradient}
        >
          <Ionicons name="options" size={16} color="white" />
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterLabel}>Filter</Text>
            <Text style={styles.filterValue}>
              {currentCategory?.name} • {currentSubOption?.name}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const FilterModal = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterModal}>
        <View style={styles.filterContent}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterSectionTitle}>Category</Text>
          <View style={styles.filterOptionsRow}>
            {mockCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterOption,
                  activeCategory === category.id && styles.activeFilterOption,
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    activeCategory === category.id &&
                      styles.activeFilterOptionText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Sub-category</Text>
          <View style={styles.filterOptionsRow}>
            {mockSubOptions[activeCategory]?.map((subOption) => (
              <TouchableOpacity
                key={subOption.id}
                style={[
                  styles.filterOption,
                  activeSubOption === subOption.id && styles.activeFilterOption,
                ]}
                onPress={() => handleSubOptionChange(subOption.id)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    activeSubOption === subOption.id &&
                      styles.activeFilterOptionText,
                  ]}
                >
                  {subOption.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => {
              // Don't trigger search on submit - just dismiss keyboard
              // The search is already handled by the debounced useEffect
            }}
            blurOnSubmit={true}
          />
          {searchText ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <FilterButton />
      </View>

      {/* Playlists List */}
      <View style={styles.playlistsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#CC5500" />
            <Text style={styles.loadingText}>Loading playlists...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure your Next.js app is running on http://192.168.1.178:3000
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadPlaylists(activeCategory, activeSubOption)}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : playlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Playlists Found</Text>
            <Text style={styles.emptyMessage}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        ) : (
          <SimpleList
            playlists={playlists}
            onSubscribe={onSubscribe}
            onViewTracks={onViewTracks}
            subscribedPlaylistIds={subscribedPlaylistIds}
            onLoadMore={loadMorePlaylists}
            loadingMore={isSearchMode ? loadingMoreSearch : loadingMore}
            hasMoreData={isSearchMode ? hasMoreSearchData : hasMoreData}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
  },
  filterButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  filterButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTextContainer: {
    alignItems: "flex-start",
  },
  filterLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
  },
  filterValue: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  playlistsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  playlistItemWrapper: {
    marginBottom: 8,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endText: {
    color: "#6B7280",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 16,
  },
  filterModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  filterContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeFilterOption: {
    backgroundColor: "#CC5500",
    borderColor: "#CC5500",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  activeFilterOptionText: {
    color: "white",
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#EF4444",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CC5500",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
