import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from './theme';

export const errorStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            backgroundColor: schemeColors.background,
        },
        title: {
            fontSize: 24,
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: 10,
            color: schemeColors.danger,
        },
        subtitle: {
            fontSize: 16,
            color: schemeColors.textMuted,
            textAlign: 'center',
            marginBottom: 20,
        },
        errorBox: {
            maxHeight: 200,
            width: '100%',
            backgroundColor: schemeColors.surface,
            padding: 10,
            borderRadius: RADIUS.sm, // 5
            marginBottom: 20,
        },
        errorText: {
            fontFamily: 'monospace',
            fontSize: 12,
            color: schemeColors.text,
        },
        button: {
            width: '100%',
            backgroundColor: schemeColors.primary,
        }
    });
};
