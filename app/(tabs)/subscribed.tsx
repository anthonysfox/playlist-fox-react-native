import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/ui/AppHeader';

export default function SubscribedScreen() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
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
});