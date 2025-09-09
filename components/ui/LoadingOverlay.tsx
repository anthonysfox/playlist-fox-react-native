import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#CC5500" />
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
});