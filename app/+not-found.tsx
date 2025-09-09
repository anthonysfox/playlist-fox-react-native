import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export default function NotFoundScreen() {
  const router = useRouter();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes-outline" size={80} color="#CC5500" />
          </View>

          {/* Error Message */}
          <Text style={styles.title}>Oops! Page Not Found</Text>
          <Text style={styles.message}>
            The page you're looking for doesn't exist or has been moved.
          </Text>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>

            <Link href="/discover" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="compass-outline" size={20} color="#CC5500" />
                <Text style={styles.secondaryButtonText}>Discover Music</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC5500',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CC5500',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#CC5500',
    fontSize: 16,
    fontWeight: '600',
  },
});
