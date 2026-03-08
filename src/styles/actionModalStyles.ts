import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from './theme';

export const actionModalStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        // Common Overlay/Sheet
        sheetContainer: {
            paddingBottom: SPACING.xl,
        },
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
        },
        modalContainer: { // For Export/Filter modals centered or sheet-like
            maxHeight: '80%',
        },

        // Titles & Headers
        title: {
            fontSize: 20,
            fontWeight: FONT_WEIGHT.bold,
            marginBottom: SPACING.lg, // 16
            color: schemeColors.textStrong,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg,
        },

        // Sections
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: schemeColors.primary,
            textTransform: 'uppercase',
            marginBottom: SPACING.md,
            marginTop: SPACING.sm,
            opacity: 0.8,
        },
        label: {
            fontSize: 12,
            fontWeight: '700',
            marginBottom: 8,
            letterSpacing: 1,
            color: schemeColors.textMuted,
        },

        // Content
        content: {
            paddingBottom: 20
        },
        message: {
            fontSize: 16,
            color: schemeColors.textMuted,
            marginBottom: SPACING.md,
            lineHeight: 22,
        },

        // Controls
        chipRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: SPACING.md,
        },
        chip: {
            backgroundColor: schemeColors.surface,
            borderColor: schemeColors.divider,
        },
        dateRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
        },
        dateBtn: {
            backgroundColor: schemeColors.background,
            padding: SPACING.sm,
            borderRadius: RADIUS.sm,
            width: '45%'
        },
        dateText: {
            fontSize: 16,
            color: schemeColors.text,
            fontWeight: '500'
        },
        selectorRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: schemeColors.glassBorder
        },
        selectorLabel: {
            fontSize: 16,
            color: schemeColors.text,
            marginLeft: 10
        },
        valuePlaceholder: {
            fontSize: 16,
            color: schemeColors.textMuted,
            marginRight: 8
        },
        valueActive: {
            fontSize: 16,
            color: schemeColors.primary,
            fontWeight: '600',
            marginRight: 8
        },

        // Export Options
        optionGroup: {
            marginBottom: 12,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
        },

        // Actions
        actions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20,
            gap: 12,
        },
        actionRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: SPACING.lg,
        },
        applyBtn: {
            marginTop: SPACING.md
        },
        exportBtn: {
            paddingHorizontal: 16,
        },
        cancelBtn: {
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            marginRight: SPACING.sm,
            justifyContent: 'center',
        },
        cancelText: {
            fontSize: 16,
            color: schemeColors.text,
            fontWeight: '500',
        },
        confirmBtn: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm + 2,
            borderRadius: RADIUS.md,
            justifyContent: 'center',
        },
        confirmText: {
            fontSize: 16,
            color: '#FFFFFF',
            fontWeight: '700',
        },

        // Checkbox
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            marginBottom: SPACING.xs,
        },
        checkbox: {
            width: 22,
            height: 22,
            borderRadius: RADIUS.sm,
            borderWidth: 1,
            borderColor: schemeColors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },
        checkboxLabel: {
            marginLeft: SPACING.md,
            fontSize: 15,
            color: schemeColors.text,
        },

        // Edit Category Specific
        card: {
            width: '100%',
            borderRadius: 20,
            padding: 24,
            maxWidth: 500,
            ...SHADOWS.md,
            elevation: 8,
        },
        rowWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        colorCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        selectedRing: {
            borderWidth: 2,
            borderColor: '#fff',
        },
        iconCircle: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        footer: {
            marginTop: 8,
            flexDirection: 'row',
        },
        pickerOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        pickerCard: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            paddingBottom: 40,
            height: '60%',
        },
        pickerHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
        },

        // Dividers
        divider: {
            marginVertical: SPACING.md, // 12
            backgroundColor: schemeColors.divider,
        },
        dividerLg: {
            marginVertical: SPACING.lg,
            backgroundColor: schemeColors.divider,
        }
    });
};
