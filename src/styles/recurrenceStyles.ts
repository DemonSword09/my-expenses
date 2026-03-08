import { StyleSheet } from 'react-native';
import { getThemeColors, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from './theme';

export const recurrenceStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);

    return StyleSheet.create({
        // Common
        container: { flex: 1 },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.lg, // 16
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: schemeColors.border,
        },
        closeBtn: { width: 60 },
        title: { fontSize: 17, fontWeight: FONT_WEIGHT.semibold }, // 600

        // RecurrenceCalendarModal
        monthNav: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.lg, // 16
        },
        monthTitle: { fontSize: 18, fontWeight: FONT_WEIGHT.bold },
        calendarGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        dayHeader: {
            width: '14.28%',
            textAlign: 'center',
            marginBottom: SPACING.sm, // 8
            fontSize: FONT_SIZE.sm, // 12
        },
        dayCell: {
            width: '14.28%',
            aspectRatio: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.sm, // 8
        },

        // RecurringScheduleModal
        subtitle: {
            paddingHorizontal: SPACING.lg, // 16
            paddingBottom: SPACING.sm, // 8
            fontSize: FONT_SIZE.md, // 14
        },
        center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        listContent: {
            paddingBottom: 32,
        },
        itemRow: {
            flexDirection: 'row',
            paddingVertical: SPACING.md, // 12
            paddingHorizontal: SPACING.lg, // 16
            borderBottomWidth: 1,
            alignItems: 'center',
        },
        dateCol: {
            width: 60,
            alignItems: 'center',
        },
        dateText: {
            fontWeight: FONT_WEIGHT.bold,
            fontSize: FONT_SIZE.md, // 14
        },
        weekdayText: {
            fontSize: FONT_SIZE.sm, // 12
        },
        detailsCol: {
            flex: 1,
            paddingHorizontal: SPACING.md, // 12
        },
        tplName: {
            fontSize: 16,
            fontWeight: FONT_WEIGHT.medium, // 500
        },
        amount: {
            fontSize: FONT_SIZE.md, // 14
            marginTop: 2,
        },
        statusCol: {
            width: 40,
            alignItems: 'center',
        },

        // RecurringScheduleSkeleton
        skeletonBox: {
            borderRadius: 4,
        },

        // Action Sheet
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        actionSheet: {
            borderTopLeftRadius: RADIUS.lg, // 16
            borderTopRightRadius: RADIUS.lg, // 16
            padding: SPACING.lg, // 16
            paddingBottom: 32,
        },
        actionTitle: {
            fontSize: FONT_SIZE.base, // 16
            fontWeight: FONT_WEIGHT.semibold, // 600
            textAlign: 'center',
            marginBottom: SPACING.lg, // 16
        },
        actionBtn: {
            paddingVertical: SPACING.lg, // 16
            alignItems: 'center',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: schemeColors.border,
        },
    });
};
