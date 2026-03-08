import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, FONT_SIZE, FONT_WEIGHT } from './theme';

export const chatScreenStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            borderBottomWidth: 1,
            borderBottomColor: schemeColors.divider,
        },
        backButton: {
            padding: SPACING.sm,
        },
        headerTitle: {
            fontSize: FONT_SIZE.xl,
            fontWeight: FONT_WEIGHT.semibold,
            marginLeft: SPACING.lg,
            color: schemeColors.text,
        },
        typingIndicator: {
            padding: SPACING.md,
            marginLeft: SPACING.md,
        },
        typingText: {
            color: schemeColors.textMuted,
        },
        keyboardView: {
            flex: 1,
            backgroundColor: schemeColors.background,
        },
    });
};
