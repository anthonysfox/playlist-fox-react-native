import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApiService, SpotifyPlaylist } from "@/services/api";

interface UserPlaylist {
  id: string;
  name: string;
  owner: {
    id: string;
    display_name: string;
  };
  images?: Array<{
    url: string;
  }>;
  tracks: {
    total: number;
  };
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  sourcePlaylist: SpotifyPlaylist;
  onSubscribeSuccess: () => void;
  userSubscriptions?: any[];
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  sourcePlaylist,
  onSubscribeSuccess,
  userSubscriptions = [],
}) => {
  const [selectedDestination, setSelectedDestination] = useState<UserPlaylist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [createNewPlaylist, setCreateNewPlaylist] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("WEEKLY");
  const [syncQuantity, setSyncQuantity] = useState(5);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [existingManagedPlaylist, setExistingManagedPlaylist] = useState<any>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const apiService = useApiService();

  const syncFrequencyOptions = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
  ];

  const syncQuantityOptions = [
    { value: 1, label: "1 song" },
    { value: 3, label: "3 songs" },
    { value: 5, label: "5 songs" },
    { value: 10, label: "10 songs" },
    { value: 15, label: "15 songs" },
  ];

  // Load user playlists when modal opens
  useEffect(() => {
    if (visible) {
      loadUserPlaylists();
    }
  }, [visible]);

  const loadUserPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      // Request only user-owned/editable playlists from the backend
      const playlists = await apiService.getUserPlaylists(0, 50, true); // ownedOnly = true
      
      // Backend filters for ownership, we just need basic validation and sorting
      const validPlaylists = playlists
        .filter(playlist => {
          // Basic validation - must have required fields
          return playlist && 
                 playlist.id && 
                 playlist.name && 
                 playlist.owner &&
                 playlist.tracks !== undefined;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`Loaded ${playlists.length} owned playlists, ${validPlaylists.length} valid for selection`);
      setUserPlaylists(validPlaylists);
    } catch (error) {
      console.error('Failed to load user playlists:', error);
      Alert.alert('Error', 'Failed to load your playlists. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };


  // Check if selected playlist is already managed and update settings accordingly
  const handleDestinationSelection = (playlist: UserPlaylist) => {
    setSelectedDestination(playlist);
    
    // Check if this playlist is already a managed playlist
    const managedPlaylist = userSubscriptions.find(mp => mp.spotifyPlaylistId === playlist.id);
    
    if (managedPlaylist) {
      setExistingManagedPlaylist(managedPlaylist);
      // Update sync settings to match the existing managed playlist
      setSyncFrequency(managedPlaylist.syncInterval || 'WEEKLY');
      setSyncQuantity(managedPlaylist.syncQuantityPerSource || 5);
    } else {
      setExistingManagedPlaylist(null);
      // Reset to default settings for new managed playlist
      setSyncFrequency('WEEKLY');
      setSyncQuantity(5);
    }
  };

  const handleSubscribe = async () => {
    if (!createNewPlaylist && !selectedDestination) {
      Alert.alert('Selection Required', 'Please select a destination playlist or create a new one.');
      return;
    }

    if (createNewPlaylist && !newPlaylistName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the new playlist.');
      return;
    }

    setSubscribing(true);
    try {
      const subscriptionData = {
        sourcePlaylist: {
          id: sourcePlaylist.id,
          name: sourcePlaylist.name,
          imageUrl: sourcePlaylist.images?.[0]?.url || "",
          trackCount: sourcePlaylist.tracks?.total || 0,
        },
        syncFrequency,
        syncQuantityPerSource: syncQuantity,
        runImmediateSync: true,
        syncMode: "APPEND",
        explicitContentFilter: false,
        trackAgeLimit: 0,
      };

      if (createNewPlaylist) {
        // Create new playlist
        await apiService.subscribeToPlaylist({
          ...subscriptionData,
          newPlaylistName: newPlaylistName.trim(),
        });
      } else {
        // Use existing playlist
        await apiService.subscribeToPlaylist({
          ...subscriptionData,
          managedPlaylist: {
            id: selectedDestination!.id,
            name: selectedDestination!.name,
            imageUrl: selectedDestination!.images?.[0]?.url || "",
            trackCount: selectedDestination!.tracks?.total || 0,
          },
        });
      }

      Alert.alert(
        'Success!', 
        `Successfully subscribed to "${sourcePlaylist.name}". Songs will be synced ${syncFrequency.toLowerCase()}.`,
        [{ text: 'OK', onPress: () => {
          onSubscribeSuccess();
          onClose();
        }}]
      );
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      if (error.message?.includes('Already subscribed')) {
        Alert.alert('Already Subscribed', 'You are already subscribed to this playlist with the selected destination.');
      } else {
        Alert.alert('Error', 'Failed to create subscription. Please try again.');
      }
    } finally {
      setSubscribing(false);
    }
  };

  const resetModal = () => {
    setSelectedDestination(null);
    setNewPlaylistName("");
    setCreateNewPlaylist(false);
    setSyncFrequency("WEEKLY");
    setSyncQuantity(5);
    setExistingManagedPlaylist(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Subscribe to Playlist</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Source Playlist Info */}
          <View style={styles.sourceSection}>
            <Text style={styles.sectionTitle}>Source Playlist</Text>
            <View style={styles.playlistCard}>
              <View style={styles.playlistInfo}>
                <Ionicons name="musical-notes" size={20} color="#CC5500" />
                <View style={styles.playlistDetails}>
                  <Text style={styles.playlistName}>{sourcePlaylist.name}</Text>
                  <Text style={styles.playlistMeta}>
                    {sourcePlaylist.tracks?.total || 0} tracks • By {sourcePlaylist.owner?.display_name}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Destination Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destination</Text>
            <Text style={styles.sectionDescription}>
              Choose where to add the synced songs
            </Text>

            {/* Create New Playlist Option */}
            <TouchableOpacity
              style={[styles.optionCard, !!createNewPlaylist ? styles.optionCardActive : null]}
              onPress={() => {
                setCreateNewPlaylist(true);
                setSelectedDestination(null);
              }}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIcon, !!createNewPlaylist ? styles.optionIconActive : null]}>
                  <Ionicons 
                    name="add-circle-outline" 
                    size={20} 
                    color={createNewPlaylist ? "#CC5500" : "#6B7280"} 
                  />
                </View>
                <Text style={[styles.optionText, !!createNewPlaylist ? styles.optionTextActive : null]}>
                  Create New Playlist
                </Text>
                {!!createNewPlaylist && <Ionicons name="checkmark" size={20} color="#CC5500" />}
              </View>
            </TouchableOpacity>

            {!!createNewPlaylist && (
              <View style={styles.newPlaylistInput}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter playlist name"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  maxLength={100}
                />
              </View>
            )}

            {/* Existing Playlists */}
            <TouchableOpacity
              style={[styles.optionCard, !createNewPlaylist ? styles.optionCardActive : null]}
              onPress={() => {
                setCreateNewPlaylist(false);
                setNewPlaylistName("");
              }}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIcon, !createNewPlaylist ? styles.optionIconActive : null]}>
                  <Ionicons 
                    name="library-outline" 
                    size={20} 
                    color={!createNewPlaylist ? "#CC5500" : "#6B7280"} 
                  />
                </View>
                <Text style={[styles.optionText, !createNewPlaylist ? styles.optionTextActive : null]}>
                  Use Existing Playlist
                </Text>
                {!createNewPlaylist && <Ionicons name="checkmark" size={20} color="#CC5500" />}
              </View>
            </TouchableOpacity>

            {!createNewPlaylist && (
              <View style={styles.playlistDropdown}>
                {loadingPlaylists ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#CC5500" />
                    <Text style={styles.loadingText}>Loading your playlists...</Text>
                  </View>
                ) : (
                  <>
                    {userPlaylists.length === 0 ? (
                      <Text style={styles.emptyText}>No playlists found</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowPlaylistPicker(true)}
                      >
                        <View style={styles.dropdownContent}>
                          <View style={styles.dropdownText}>
                            <Text style={styles.dropdownLabel}>Selected Playlist</Text>
                            <Text style={styles.dropdownValue}>
                              {selectedDestination 
                                ? `${selectedDestination.name} (${selectedDestination.tracks.total} tracks)`
                                : 'Tap to select a playlist'
                              }
                            </Text>
                          </View>
                          <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Existing Managed Playlist Warning */}
            {!createNewPlaylist && !!existingManagedPlaylist && (
              <View style={styles.warningSection}>
                <View style={styles.warningCard}>
                  <Ionicons name="information-circle" size={20} color="#F59E0B" />
                  <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>Adding to Existing Sync</Text>
                    <Text style={styles.warningText}>
                      This playlist is already syncing from {existingManagedPlaylist.subscriptions?.length || 0} source{existingManagedPlaylist.subscriptions?.length === 1 ? '' : 's'}. 
                      Your new source will use the same sync settings.
                    </Text>
                    {existingManagedPlaylist.subscriptions?.length > 0 && (
                      <Text style={styles.warningSourceList}>
                        Current sources: {existingManagedPlaylist.subscriptions.map((sub: any) => sub.sourcePlaylist.name).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Sync Settings */}
          <View style={styles.section}>
            <View style={styles.syncSettingsHeader}>
              <Text style={styles.sectionTitle}>Sync Settings</Text>
              {!createNewPlaylist && !!existingManagedPlaylist && (
                <View style={styles.settingsLockedBadge}>
                  <Ionicons name="lock-closed" size={12} color="#6B7280" />
                  <Text style={styles.settingsLockedText}>Locked</Text>
                </View>
              )}
            </View>
            
            {/* Frequency */}
            <View style={styles.settingGroup}>
              <Text style={[
                styles.settingLabel,
                (!createNewPlaylist && !!existingManagedPlaylist) ? styles.settingLabelDisabled : null
              ]}>
                How often to sync?
                {(!createNewPlaylist && !!existingManagedPlaylist) && (
                  <Text style={styles.settingExplanation}> (Set by destination playlist)</Text>
                )}
              </Text>
              <View style={styles.optionsRow}>
                {syncFrequencyOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      syncFrequency === option.value && styles.optionChipActive,
                      (!createNewPlaylist && !!existingManagedPlaylist) ? styles.optionChipDisabled : null,
                    ]}
                    onPress={() => {
                      if (createNewPlaylist || !existingManagedPlaylist) {
                        setSyncFrequency(option.value);
                      }
                    }}
                    disabled={!createNewPlaylist && !!existingManagedPlaylist}
                  >
                    <Text style={[
                      styles.optionChipText,
                      syncFrequency === option.value && styles.optionChipTextActive,
                      (!createNewPlaylist && !!existingManagedPlaylist) ? styles.optionChipTextDisabled : null,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.settingGroup}>
              <Text style={[
                styles.settingLabel,
                (!createNewPlaylist && !!existingManagedPlaylist) ? styles.settingLabelDisabled : null
              ]}>
                How many songs to add each time?
                {(!createNewPlaylist && !!existingManagedPlaylist) && (
                  <Text style={styles.settingExplanation}> (Set by destination playlist)</Text>
                )}
              </Text>
              <View style={styles.optionsRow}>
                {syncQuantityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      syncQuantity === option.value && styles.optionChipActive,
                      (!createNewPlaylist && !!existingManagedPlaylist) ? styles.optionChipDisabled : null,
                    ]}
                    onPress={() => {
                      if (createNewPlaylist || !existingManagedPlaylist) {
                        setSyncQuantity(option.value);
                      }
                    }}
                    disabled={!createNewPlaylist && !!existingManagedPlaylist}
                  >
                    <Text style={[
                      styles.optionChipText,
                      syncQuantity === option.value && styles.optionChipTextActive,
                      (!createNewPlaylist && !!existingManagedPlaylist) ? styles.optionChipTextDisabled : null,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                {!createNewPlaylist && !!existingManagedPlaylist ? (
                  <>
                    "{sourcePlaylist.name}" will be added as a source to "{selectedDestination?.name}". 
                    It will sync {syncQuantity} songs {syncFrequency.toLowerCase()} along with {existingManagedPlaylist.subscriptions?.length || 0} other source{existingManagedPlaylist.subscriptions?.length === 1 ? '' : 's'}.
                  </>
                ) : (
                  <>
                    {syncQuantity} songs will be added {syncFrequency.toLowerCase()} from "{sourcePlaylist.name}" to{" "}
                    {createNewPlaylist 
                      ? `a new playlist "${newPlaylistName}"` 
                      : selectedDestination 
                        ? `"${selectedDestination.name}"` 
                        : "your selected playlist"
                    }.
                  </>
                )}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={Boolean(
              subscribing || 
              (!createNewPlaylist && !selectedDestination) || 
              (createNewPlaylist && !newPlaylistName.trim())
            )}
          >
            {subscribing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="notifications" size={20} color="white" />
                <Text style={styles.subscribeButtonText}>Subscribe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Playlist Picker Modal */}
      <Modal 
        visible={showPlaylistPicker} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlaylistPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity 
              onPress={() => setShowPlaylistPicker(false)}
              style={styles.pickerCloseButton}
            >
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Playlist</Text>
            <View style={styles.pickerHeaderSpacer} />
          </View>
          
          <ScrollView style={styles.pickerContent}>
            {userPlaylists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={[
                  styles.playlistOption,
                  selectedDestination?.id === playlist.id && styles.selectedPlaylistOption
                ]}
                onPress={() => {
                  handleDestinationSelection(playlist);
                  setShowPlaylistPicker(false);
                }}
              >
                <View style={styles.playlistOptionContent}>
                  <View style={styles.playlistOptionInfo}>
                    <Text style={styles.playlistOptionName}>{playlist.name}</Text>
                    <Text style={styles.playlistOptionTracks}>
                      {playlist.tracks.total} tracks
                    </Text>
                  </View>
                  {selectedDestination?.id === playlist.id && (
                    <Ionicons name="checkmark" size={20} color="#CC5500" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sourceSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  playlistCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  playlistInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  playlistDetails: {
    marginLeft: 12,
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 14,
    color: "#6B7280",
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: "#CC5500",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionIconActive: {
    backgroundColor: "#FEE2E2",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },
  optionTextActive: {
    color: "#CC5500",
  },
  newPlaylistInput: {
    marginTop: 12,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  playlistDropdown: {
    marginTop: 12,
  },
  dropdownButton: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    padding: 20,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionChipActive: {
    backgroundColor: "#CC5500",
    borderColor: "#CC5500",
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  optionChipTextActive: {
    color: "white",
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#FEF3F2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CC5500",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#DC2626",
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  subscribeButton: {
    backgroundColor: "#CC5500",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  subscribeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Warning section styles
  warningSection: {
    marginTop: 16,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningContent: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
    marginBottom: 8,
  },
  warningSourceList: {
    fontSize: 13,
    color: "#78350F",
    fontWeight: "500",
    fontStyle: "italic",
  },
  // Sync settings disabled styles
  syncSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  settingsLockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  settingsLockedText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  settingLabelDisabled: {
    color: "#9CA3AF",
  },
  settingExplanation: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  optionChipDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.6,
  },
  optionChipTextDisabled: {
    color: "#9CA3AF",
  },
  
  // Playlist picker modal styles
  pickerContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickerCloseText: {
    fontSize: 16,
    color: "#CC5500",
    fontWeight: "600",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  pickerHeaderSpacer: {
    width: 60,
  },
  pickerContent: {
    flex: 1,
    padding: 16,
  },
  playlistOption: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPlaylistOption: {
    borderColor: "#CC5500",
    backgroundColor: "#FEF3F2",
  },
  playlistOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  playlistOptionInfo: {
    flex: 1,
  },
  playlistOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  playlistOptionTracks: {
    fontSize: 14,
    color: "#6B7280",
  },
});