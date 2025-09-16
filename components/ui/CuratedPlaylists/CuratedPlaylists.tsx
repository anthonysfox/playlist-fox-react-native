import { ApiError, SpotifyPlaylist, useApiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SimpleList } from "../SimpleList";
import { SubscriptionModal } from "../SubscriptionModal";
import { styles } from "./CuratedPlaylists.styles";
import {
  CuratedPlaylistsProps,
  generateMockPlaylists,
  getCategoryIcon,
  mockCategories,
  mockSubOptions,
} from "./CuratedPlaylists.types";

export const CuratedPlaylists: React.FC<CuratedPlaylistsProps> = ({
  onSubscribe,
  onViewTracks,
  onViewSubscriptions,
  subscribedPlaylistIds = new Set(),
}) => {
  // State
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlaylistForSubscription, setSelectedPlaylistForSubscription] =
    useState<SpotifyPlaylist | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [subscribedSourcePlaylistIds, setSubscribedSourcePlaylistIds] =
    useState<Set<string>>(new Set());

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const subscriptionsLoadedRef = useRef(false);
  
  // Services
  const apiService = useApiService();

  // Load user subscriptions
  const loadUserSubscriptions = useCallback(async () => {
    try {
      const subscriptions = await apiService.getUserSubscriptions();
      setUserSubscriptions(subscriptions);

      const sourceIds = new Set<string>();
      subscriptions.forEach((managedPlaylist: any) => {
        if (managedPlaylist.subscriptions) {
          managedPlaylist.subscriptions.forEach((sub: any) => {
            if (sub.sourcePlaylist?.spotifyPlaylistId) {
              sourceIds.add(sub.sourcePlaylist.spotifyPlaylistId);
            }
          });
        }
      });
      setSubscribedSourcePlaylistIds(sourceIds);
    } catch (error) {
      console.error("Failed to load user subscriptions:", error);
    }
  }, [apiService]);

  // Load subscriptions when component mounts - only once
  useEffect(() => {
    if (!subscriptionsLoadedRef.current) {
      subscriptionsLoadedRef.current = true;
      loadUserSubscriptions();
    }
  }, [loadUserSubscriptions]);

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

        const apiCategory = subOption || category;
        const offset = reset ? 0 : currentOffset;

        const rawPlaylists = await apiService.getCuratedPlaylists(
          apiCategory,
          offset
        );

        const fetchedPlaylists = rawPlaylists.filter(
          (playlist) =>
            playlist && playlist.id && playlist.name && playlist.owner
        );

        console.log(
          `API Response - Category: ${apiCategory}, Offset: ${offset}, Raw: ${rawPlaylists.length}, Filtered: ${fetchedPlaylists.length} playlists`
        );

        if (reset) {
          setPlaylists(fetchedPlaylists);
          console.log(`Reset playlists with ${fetchedPlaylists.length} items`);
        } else {
          setPlaylists((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPlaylists = fetchedPlaylists.filter(
              (p) => !existingIds.has(p.id)
            );
            
            if (fetchedPlaylists.length > 0 && newPlaylists.length === 0) {
              console.log("All fetched playlists were duplicates - stopping infinite scroll");
              setHasMoreData(false);
            }

            return [...prev, ...newPlaylists];
          });
        }

        if (fetchedPlaylists.length === 0) {
          console.log("No more playlists available - stopping infinite scroll");
          setHasMoreData(false);
        }

        setCurrentOffset(offset + 20);
      } catch (err) {
        console.error("Failed to load playlists:", err);
        setError(
          err instanceof ApiError ? err.message : "Failed to load playlists"
        );

        if (__DEV__ && reset) {
          console.log("Using fallback mock data...");
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

  // Load search results
  const loadSearchResults = useCallback(
    async (query: string, reset: boolean = true) => {
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

        if (!query.trim()) {
          console.log("Empty query, aborting search");
          setLoading(false);
          setLoadingMoreSearch(false);
          return;
        }

        const rawResults = await apiService.searchPlaylists(query, currentSearchOffset);
        const searchResults = rawResults.filter(
          (playlist) =>
            playlist && playlist.id && playlist.name && playlist.owner
        );

        console.log(
          `Search API Response - Query: "${query}", Offset: ${currentSearchOffset}, Raw: ${rawResults.length}, Filtered: ${searchResults.length} playlists`
        );

        if (reset) {
          setPlaylists(searchResults);
        } else {
          setPlaylists((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPlaylists = searchResults.filter((p) => !existingIds.has(p.id));
            
            if (searchResults.length > 0 && newPlaylists.length === 0) {
              console.log("All search results were duplicates - stopping infinite scroll");
              setHasMoreSearchData(false);
            }

            return [...prev, ...newPlaylists];
          });
        }

        if (searchResults.length === 0) {
          console.log("No more search results available - stopping infinite scroll");
          setHasMoreSearchData(false);
        }

        setSearchOffset(currentSearchOffset + 20);
      } catch (err) {
        console.error("Failed to search playlists:", err);
        setError(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        setLoading(false);
        setLoadingMoreSearch(false);
      }
    },
    [apiService]
  );

  // Handle search with debouncing
  useEffect(() => {
    console.log(`Search effect triggered - searchText: "${searchText}"`);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedText = searchText.trim();

    if (!trimmedText) {
      if (isSearchMode) {
        console.log("Empty search - exiting search mode");
        setIsSearchMode(false);
        setSearchOffset(0);
        setHasMoreSearchData(true);
        setLoadingMoreSearch(false);
        setTimeout(() => {
          loadPlaylists(activeCategory, activeSubOption, true);
        }, 100);
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log(`Executing search for: "${trimmedText}"`);
      if (trimmedText === searchText.trim()) {
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
  }, [searchText]);

  // Load initial data
  useEffect(() => {
    if (!isSearchMode && loading) {
      loadPlaylists(activeCategory, activeSubOption);
    }
  }, [activeCategory, activeSubOption, isSearchMode, loading, loadPlaylists]);

  // Event handlers
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
      if (!loadingMoreSearch && hasMoreSearchData) {
        loadSearchResults(searchText.trim(), false);
      }
    } else {
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
    loadSearchResults,
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
    setLoading(true);
  };

  const handleSubscribe = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylistForSubscription(playlist);
    setShowSubscriptionModal(true);
  };

  const handleSubscribeSuccess = () => {
    loadUserSubscriptions();
    console.log("Successfully subscribed to playlist");
  };

  // Components
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
        activeOpacity={0.7}
      >
        <View style={styles.filterContent}>
          <Ionicons name="options-outline" size={18} color="#6B7280" />
          <Text style={styles.filterText}>{currentCategory?.name}</Text>
          {currentSubOption && (
            <>
              <View style={styles.filterDivider} />
              <Text style={styles.filterSubText}>{currentSubOption.name}</Text>
            </>
          )}
          <Ionicons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9CA3AF"
            style={styles.chevronIcon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const FilterModal = () => {
    if (!showFilters) return null;

    return (
      <TouchableOpacity
        style={styles.filterModal}
        activeOpacity={1}
        onPress={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.filterModalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.filterHeader}>
            <View style={styles.filterHeaderLeft}>
              <View style={styles.filterHeaderIcon}>
                <Ionicons name="options-outline" size={24} color="#CC5500" />
              </View>
              <View>
                <Text style={styles.filterTitle}>Browse Categories</Text>
                <Text style={styles.filterSubtitle}>
                  Discover music by style
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.filterScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Categories Grid */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {mockCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      activeCategory === category.id &&
                        styles.activeCategoryCard,
                      {
                        transform: [
                          {
                            scale: activeCategory === category.id ? 1.02 : 1,
                          },
                        ],
                      },
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        activeCategory === category.id &&
                          styles.activeCategoryIconContainer,
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(category.id)}
                        size={24}
                        color={
                          activeCategory === category.id ? "#FFFFFF" : "#6B7280"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        activeCategory === category.id &&
                          styles.activeCategoryName,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {activeCategory === category.id && (
                      <View style={styles.activeIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#CC5500"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sub-categories */}
            {mockSubOptions[activeCategory] && (
              <View style={styles.subCategoriesSection}>
                <Text style={styles.sectionTitle}>
                  {mockCategories.find((c) => c.id === activeCategory)?.name}{" "}
                  Styles
                </Text>
                <View style={styles.subCategoriesList}>
                  {mockSubOptions[activeCategory].map((subOption) => (
                    <TouchableOpacity
                      key={subOption.id}
                      style={[
                        styles.subCategoryItem,
                        activeSubOption === subOption.id &&
                          styles.activeSubCategoryItem,
                      ]}
                      onPress={() => handleSubOptionChange(subOption.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.subCategoryContent}>
                        <View style={styles.subCategoryLeft}>
                          <View
                            style={[
                              styles.subCategoryDot,
                              activeSubOption === subOption.id &&
                                styles.activeSubCategoryDot,
                            ]}
                          />
                          <Text
                            style={[
                              styles.subCategoryText,
                              activeSubOption === subOption.id &&
                                styles.activeSubCategoryText,
                            ]}
                          >
                            {subOption.name}
                          </Text>
                        </View>
                        {activeSubOption === subOption.id && (
                          <View style={styles.subCategoryCheck}>
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#CC5500"
                            />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render
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
            onSubmitEditing={() => {}}
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
            onSubscribe={handleSubscribe}
            onViewTracks={onViewTracks}
            onViewSubscriptions={onViewSubscriptions}
            subscribedPlaylistIds={subscribedSourcePlaylistIds}
            onLoadMore={loadMorePlaylists}
            loadingMore={isSearchMode ? loadingMoreSearch : loadingMore}
            hasMoreData={isSearchMode ? hasMoreSearchData : hasMoreData}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal />

      {/* Subscription Modal */}
      {selectedPlaylistForSubscription && (
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedPlaylistForSubscription(null);
          }}
          sourcePlaylist={selectedPlaylistForSubscription}
          onSubscribeSuccess={handleSubscribeSuccess}
          userSubscriptions={userSubscriptions}
        />
      )}
    </View>
  );
};