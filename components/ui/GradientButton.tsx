import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  title, 
  onPress, 
  icon, 
  disabled = false 
}) => {
  const handlePress = () => {
    console.log('Button pressed!');
    onPress();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={disabled} 
      style={styles.button}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#9CA3AF', '#6B7280'] : ['#CC5500', '#A0522D']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={styles.text}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
  },
  gradient: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 12,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});