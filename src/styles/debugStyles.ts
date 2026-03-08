import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS } from './theme';

export const debugStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        header: {
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 10,
            color: schemeColors.text,
        },
        section: {
            fontSize: 18,
            fontWeight: '600',
            marginTop: 20,
            marginBottom: 10,
            color: schemeColors.text,
        },
        card: {
            backgroundColor: schemeColors.surface,
            padding: SPACING.md,
            marginBottom: SPACING.md,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: schemeColors.border,
        },
        cardText: {
            color: schemeColors.text,
            marginBottom: 4,
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: SPACING.sm,
            gap: SPACING.sm,
        },
        spacer: {
            height: SPACING.md,
        },
    });
};
