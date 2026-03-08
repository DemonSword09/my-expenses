import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, FONT_SIZE, FONT_WEIGHT } from './theme';

export const importCsvStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: schemeColors.background,
        },
        header: {
            backgroundColor: schemeColors.background,
        },
        headerTitle: {
            color: schemeColors.text,
            fontWeight: FONT_WEIGHT.bold,
        },
        scrollContent: {
            padding: SPACING.lg, // 16
        },
        emptyState: {
            alignItems: 'center',
            marginTop: 50,
        },
        selectFileButton: {
            marginTop: SPACING.xl, // 20
        },
        emptyStateText: {
            marginTop: SPACING.lg, // 16
            color: schemeColors.muted,
            textAlign: 'center',
        },
        previewHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg, // 16
        },
        previewTitle: {
            fontSize: FONT_SIZE.base, // 16
            color: schemeColors.text,
            fontWeight: FONT_WEIGHT.bold,
        },
        confirmButton: {
            marginTop: SPACING.xxl, // 24
            paddingVertical: 6,
        },
        confirmButtonLabel: {
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.bold,
        },
    });
};
