import React, { useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { SHADOWS, RADIUS, SPACING } from '../../styles/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MenuItem {
    label: string;
    icon?: string;
    onPress: () => void;
    destructive?: boolean;
}

interface AnchoredMenuProps<T = any> {
    visible: boolean;
    onDismiss: () => void;
    anchor: { x: number; y: number; width: number; height: number } | null;
    menuItems: MenuItem[];
    item?: T;
    renderItem?: (item: T) => React.ReactNode;
}

export default function AnchoredMenu({ visible, onDismiss, anchor, menuItems, item, renderItem }: AnchoredMenuProps) {
    const { schemeColors, scheme } = useTheme();

    // Dynamic Menu Positioning
    const menuPosition = useMemo(() => {
        if (!anchor) return {};

        const MENU_ITEM_HEIGHT = 56;
        const menuHeight = menuItems.length * MENU_ITEM_HEIGHT;
        const padding = 12;

        const spaceBelow = SCREEN_HEIGHT - (anchor.y + anchor.height);
        const spaceAbove = anchor.y;
        const showBelow = spaceBelow >= menuHeight + padding || spaceAbove < spaceBelow; // Prefer below, unless not enough space

        // Auto width logic
        // Calculate max available width from anchor.x to screen edge (minus padding)
        const maxAvailableWidth = SCREEN_WIDTH - anchor.x - 16;

        // If we are too close to the right edge (e.g. less than 180px space), align to right edge instead
        const isTooRight = maxAvailableWidth < 180;

        return {
            top: showBelow ? anchor.y + anchor.height + padding - 12 : undefined,
            bottom: showBelow ? undefined : SCREEN_HEIGHT - anchor.y + padding,

            // Positioning
            left: isTooRight ? 16 : anchor.x + 20,
            right: isTooRight ? 16 : undefined,

            // Sizing
            minWidth: 160,
            maxWidth: 250, // Don't let it get huge if label is long

            position: 'absolute' as 'absolute',
        };
    }, [anchor, menuItems.length, SCREEN_WIDTH]);

    if (!visible || !anchor) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
            <View style={StyleSheet.absoluteFill}>

                {/* 1. Blur Layer - Using experimental method for Android support */}
                <BlurView
                    intensity={25} // Heavy blur
                    tint={scheme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
                    experimentalBlurMethod='dimezisBlurView' // Critical for Android
                    style={StyleSheet.absoluteFill}
                />

                {/* 2. Interaction Wrapper (Dimming removed, reliance on native tint) */}
                <TouchableWithoutFeedback onPress={onDismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                {/* 4. Cloned Item (Highlighted) */}
                {item && renderItem && (
                    <View
                        style={{
                            position: 'absolute',
                            top: anchor.y,
                            left: anchor.x,
                            width: anchor.width,
                            height: anchor.height,
                            zIndex: 20, // VISUALLY ABOVE EVERYTHING
                            // We don't need extra shadow if the item has it, but we can add a subtle glow
                            // shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 15, // Optional Boost
                        }}
                        pointerEvents="none"
                    >
                        {renderItem(item)}
                    </View>
                )}

                {/* 5. Menu */}
                <View style={[styles.menuContainer, menuPosition, { backgroundColor: schemeColors.surface }]}>
                    {menuItems.map((menuItem, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                // index < menuItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: schemeColors.border }
                                // Instagram doesn't always have dividers. Let's keep it clean or use subtle ones.
                            ]}
                            onPress={() => {
                                onDismiss();
                                setTimeout(menuItem.onPress, 100);
                            }}
                        >
                            <MaterialCommunityIcons
                                name={menuItem.icon as any || 'circle-small'}
                                size={22} // Slightly smaller icon for tighter menu
                                color={menuItem.destructive ? schemeColors.danger : schemeColors.text}
                                style={{ marginRight: 12 }}
                            />
                            <Text style={[styles.menuText, { color: menuItem.destructive ? schemeColors.danger : schemeColors.text }]}>
                                {menuItem.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    menuContainer: {
        borderRadius: 14, // More rounded
        ...SHADOWS.lg,
        overflow: 'hidden',
        paddingVertical: 6,
        zIndex: 21,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12, // Taller touch target
    },
    menuText: {
        fontSize: 15, // Slightly smaller text for compact look
        fontWeight: '500',
    },
});
