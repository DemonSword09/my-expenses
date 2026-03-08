// src/styles/csvPreviewStyles.ts
import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, FONT_SIZE, FONT_WEIGHT } from './theme';

export const csvPreviewStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        container: {
            marginTop: SPACING.lg,
        },
        headerRow: {
            flexDirection: 'row',
        },
        headerCell: {
            width: 120,
            marginRight: SPACING.sm,
        },
        headerText: {
            fontWeight: FONT_WEIGHT.bold, // 700
            fontSize: FONT_SIZE.sm, // 12
            color: schemeColors.textStrong,
        },
        picker: {
            backgroundColor: schemeColors.bgDark,
        },
        pickerItem: {
            fontSize: FONT_SIZE.sm, // 13 -> 12 (standardize)
            color: schemeColors.textStrong,
            backgroundColor: schemeColors.bgDark,
        },
        row: {
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: schemeColors.border,
            paddingVertical: SPACING.sm,
        },
        cellText: {
            width: 120,
            marginRight: SPACING.sm,
            fontSize: FONT_SIZE.sm, // 13 -> 12
            color: schemeColors.textStrong,
        },
    });
};
