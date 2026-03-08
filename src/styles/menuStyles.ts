import { StyleSheet } from 'react-native';
import { getThemeColors, SHADOWS, FONT_SIZE, FONT_WEIGHT } from './theme';

export const menuStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        menuContainer: {
            borderRadius: 14,
            ...SHADOWS.lg,
            overflow: 'hidden',
            paddingVertical: 6,
            zIndex: 21,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        menuText: {
            fontSize: 15,
            fontWeight: FONT_WEIGHT.medium, // 500
        },
    });
};
