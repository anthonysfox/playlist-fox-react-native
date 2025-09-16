import { StyleSheet } from "react-native";
import { theme } from "../../../styles/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Search styles
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },

  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },

  searchIcon: {
    marginRight: theme.spacing.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  clearButton: {
    padding: theme.spacing.xs,
  },

  // Filter button styles
  filterButtonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: "flex-end",
  },

  filterButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    ...theme.shadows.sm,
  },

  filterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },

  filterSubText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  filterDivider: {
    width: 1,
    height: 14,
    backgroundColor: theme.colors.border.strong,
    marginHorizontal: 2,
  },

  chevronIcon: {
    marginLeft: theme.spacing.xs,
  },

  // Filter modal styles
  filterModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 60,
  },

  filterModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius["2xl"],
    padding: 0,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    ...theme.shadows.xl,
    overflow: "hidden",
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  filterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  filterHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.lg,
  },

  filterTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  filterSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },

  filterScrollContent: {
    flex: 1,
  },

  // Categories section
  categoriesSection: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    letterSpacing: theme.typography.letterSpacing.tight,
  },

  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },

  categoryCard: {
    width: "47%",
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    padding: theme.spacing.xl,
    alignItems: "center",
    minHeight: 100,
    position: "relative",
  },

  activeCategoryCard: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },

  activeCategoryIconContainer: {
    backgroundColor: theme.colors.primary,
  },

  categoryName: {
    fontSize: theme.typography.fontSize.base - 1,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: "center",
    letterSpacing: theme.typography.letterSpacing.normal,
  },

  activeCategoryName: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },

  activeIndicator: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
  },

  // Subcategories section
  subCategoriesSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing["2xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  subCategoriesList: {
    gap: theme.spacing.md,
  },

  subCategoryItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    paddingHorizontal: 18,
    paddingVertical: theme.spacing.lg,
  },

  activeSubCategoryItem: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },

  subCategoryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  subCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border.strong,
    marginRight: theme.spacing.md,
  },

  activeSubCategoryDot: {
    backgroundColor: theme.colors.primary,
  },

  subCategoryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    letterSpacing: theme.typography.letterSpacing.wide,
  },

  activeSubCategoryText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  subCategoryCheck: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer
  filterFooter: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },

  applyButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.normal,
  },

  // Content styles
  playlistsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: theme.spacing.lg,
  },

  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: 48,
  },

  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptyMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },

  // Error styles
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: 48,
  },

  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },

  errorHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
    fontStyle: "italic",
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },

  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
