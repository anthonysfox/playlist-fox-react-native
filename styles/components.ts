import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const commonStyles = StyleSheet.create({
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius['2xl'],
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  
  // Card styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  
  activeCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    ...theme.shadows.md,
  },
  
  // Text styles
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  
  body: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.letterSpacing.normal,
  },
  
  // Icon containers
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  
  iconContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  
  iconContainerMedium: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  
  iconContainerLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});

// Style utilities
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: typeof theme) => T
): T => {
  return styleCreator(theme);
};