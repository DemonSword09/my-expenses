import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, FONT_WEIGHT } from './theme';

export const columnMapperStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        container: {
            paddingVertical: SPACING.md,
        },
        title: {
            fontWeight: FONT_WEIGHT.bold,
            marginTop: SPACING.lg,
            marginBottom: SPACING.md,
            color: schemeColors.text,
            fontSize: 16,
        },
        mappingRow: {
            marginVertical: SPACING.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: schemeColors.border,
            paddingBottom: SPACING.sm,
        },
        columnLabel: {
            flex: 1,
            fontWeight: FONT_WEIGHT.medium,
            color: schemeColors.text,
        },
        pickerContainer: {
            flex: 1,
        },
        picker: {
            width: '100%',
            color: schemeColors.text,
        },
    });
};
