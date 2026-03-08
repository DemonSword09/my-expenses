import { StyleSheet, Platform } from 'react-native';
import { getThemeColors, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from './theme';

export const pickerModalStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        // Common Modal Container
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg, // 16
            height: 56,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: schemeColors.border,
            paddingTop: Platform.OS === 'ios' ? 0 : 0, // Adjusted based on context usage, usually safe to be 0 if in Modal presentationStyle pageSheet
        },
        headerButton: {
            minWidth: 60,
        },
        headerTitle: {
            fontSize: 17,
            fontWeight: FONT_WEIGHT.semibold, // 600
        },

        // CategoryPicker Specific
        card: {
            borderRadius: 14,
            overflow: 'hidden',
            // Shadow
            ...SHADOWS.sm,
            elevation: 2,
        },
        mainSelectArea: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12, // Compact
        },
        iconBox: {
            width: 36, // Compact
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
        },
        mainLabel: {
            fontSize: 15, // Slightly smaller
            fontWeight: FONT_WEIGHT.semibold, // 600
            marginRight: 8,
        },
        childrenContainer: {
            backgroundColor: 'rgba(0,0,0,0.02)',
            paddingBottom: 4,
        },
        childRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10, // Compact
            paddingHorizontal: 12,
            borderTopWidth: 1,
        },
        childTreeLine: {
            width: 1,
            height: '150%',
            position: 'absolute',
            left: 29, // Adjusted for new icon size/padding (12 pad + 36/2 center ~= 30)
            top: -18,
        },
        miniIcon: {
            width: 22,
            height: 22,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 36, // Indent
            marginRight: 10,
        },
        childLabel: {
            fontSize: FONT_SIZE.md, // 14
        },

        // IconPickerModal Specific
        titleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg, // 16
        },
        title: {
            fontSize: 20,
            fontWeight: FONT_WEIGHT.bold,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            height: 48,
            paddingHorizontal: 8,
        },
        input: {
            flex: 1,
            height: '100%',
            marginLeft: 8,
            fontSize: 16,
        },
        listContent: {
            padding: SPACING.lg, // 16
            paddingBottom: 40,
        },
        categorySection: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 13,
            fontWeight: '700',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        columnWrapper: {
            gap: 8,
            marginBottom: 8,
        },
        iconItem: {
            width: '23%',
            aspectRatio: 1,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
        },
        iconText: {
            fontSize: 10,
            marginTop: 4,
            textAlign: 'center',
        },
        sectionHeader: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        pickerHeader: {
            padding: SPACING.lg, // 16
            paddingTop: Platform.OS === 'ios' ? 16 : 16,
        },
    });
};
