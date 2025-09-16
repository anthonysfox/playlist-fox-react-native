import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title = "PlaylistFox" }: AppHeaderProps) {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleProfilePress = () => {
    Alert.alert("Account", "Choose an option:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Left side - Simple brand */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>{title}</Text>
        </View>

        {/* Right side - Profile only */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandSection: {
    flex: 1,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
  },
  actionsSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
