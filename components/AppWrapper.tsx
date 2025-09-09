import { useAuth } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LoginScreen from "./auth/LoginScreen";

export function AppWrapper() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading screen while auth state is loading
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CC5500" />
      </View>
    );
  }

  // If not signed in, show login screen
  if (!isSignedIn) {
    console.log("here");
    return <LoginScreen />;
  }

  // If signed in, show the main app with tabs
  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
});
