import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from "expo-image";
import { LinearGradient } from 'expo-linear-gradient';
import { useSSO } from '@clerk/clerk-expo';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();

  const handleSignInWithSpotify = React.useCallback(async () => {
    console.log('Spotify sign-in handler called!');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_spotify'
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.error('SSO error', err);
    }
  }, [startSSOFlow]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#F7FAFC', '#FFF7ED']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.iconContainer}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.icon}
                  contentFit="contain"
                />
              </View>
              
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.titleText, { color: '#CC5500' }]}>Playlist</Text>
                  <Text style={[styles.titleText, { color: '#111827' }]}>Fox</Text>
                </View>
                <Text style={styles.subtitle}>
                  Keep your Spotify playlists fresh with automatic track updates
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <FeatureCard
                icon={<Ionicons name="time" size={20} color="white" />}
                title="Auto-Sync"
                description="Fresh tracks added on your schedule"
              />
              
              <FeatureCard
                icon={<Ionicons name="flame" size={20} color="white" />}
                title="Smart Discovery"
                description="Find new music from artists you love"
              />
              
              <FeatureCard
                icon={<Ionicons name="list" size={20} color="white" />}
                title="Organized"
                description="Manage playlists in one place"
              />
            </View>

            {/* CTA Button */}
            <View style={styles.ctaSection}>
              <GradientButton
                title="Continue with Spotify"
                onPress={handleSignInWithSpotify}
                icon={<Ionicons name="musical-notes" size={20} color="white" />}
              />
              
              <View style={styles.noticeContainer}>
                <View style={styles.noticeContent}>
                  <Ionicons name="information-circle" size={16} color="#D97706" />
                  <Text style={styles.noticeText}>
                    Spotify Premium required
                  </Text>
                </View>
              </View>
            </View>
            
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 384,
    alignSelf: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 128,
    height: 128,
  },
  icon: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  titleContainer: {
    flexDirection: 'row',
  },
  titleText: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 24,
  },
  ctaSection: {
    paddingTop: 8,
  },
  noticeContainer: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
  },
});