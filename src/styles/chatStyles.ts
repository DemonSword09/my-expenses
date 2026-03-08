import { StyleSheet } from 'react-native';
import { getThemeColors, RADIUS, SPACING, FONT_SIZE, LINE_HEIGHT } from './theme';
import { globalStyles } from './globalStyles';

export const chatStyles = (scheme: any) => {
    const schemeColors = getThemeColors(scheme);
    const globalStyle = globalStyles(scheme);

    return StyleSheet.create({
        listContent: {
            padding: SPACING.lg,
            paddingBottom: SPACING.xl,
        },
        messageContainer: {
            marginBottom: SPACING.md,
            // Shared base style
        },
        userMessageContainer: {
            alignSelf: 'flex-end',
            alignItems: 'flex-end',
            maxWidth: '80%', // Standard bubbles for user
        },
        botMessageContainer: {
            alignSelf: 'flex-start',
            alignItems: 'flex-start',
            width: '80%',     // Explicit width ensures background covers table
            maxWidth: '95%',
        },
        bubble: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm + 2, // 10
            borderRadius: RADIUS.lg + 4, // 20
            alignSelf: 'stretch',
            backgroundColor: schemeColors.danger,
        },
        messageText: {
            fontSize: FONT_SIZE.base, // 16
            lineHeight: LINE_HEIGHT.base, // 24
        },
        timestamp: {
            fontSize: FONT_SIZE.xs, // 10
            color: schemeColors.textMuted,
            marginTop: SPACING.xs,
            marginHorizontal: SPACING.xs
        },

        // Input Area
        inputContainer: {
            padding: SPACING.sm + 2, // 10
            paddingBottom: SPACING.sm + 2,
        },
        pillContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 30, // Custom shape
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs + 2,
            minHeight: 50,
            overflow: 'hidden',
            backgroundColor: schemeColors.glassBg,
            // Extend Global Glass Base
            ...globalStyle.glassBase,
        },
        input: {
            flex: 1,
            height: 40,
            fontSize: FONT_SIZE.base, // 16
            paddingHorizontal: SPACING.md,
            marginLeft: SPACING.xs,
            color: schemeColors.text
        },
        sendButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: SPACING.sm,
        },
    });
};
