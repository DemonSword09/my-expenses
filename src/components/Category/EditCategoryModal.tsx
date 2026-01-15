// src/components/EditCategoryModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
// import { BlurView } from 'expo-blur'; // If available, or just use View
// We don't have expo-blur in package.json, so standard View.

type Props = {
    visible: boolean;
    onClose: () => void;
    onSave: (label: string, icon: string, color: string) => Promise<void>;
    initialLabel?: string;
    initialIcon?: string;
    initialColor?: string;
    mode: 'create' | 'edit';
    parentLabel?: string;
};

// Simple color palette
const COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6B7280', // Gray
];

const ICONS = [
    'folder', 'food', 'car', 'home', 'shopping', 'gift', 'gamepad-variant',
    'school', 'briefcase', 'bank', 'hospital-box', 'airplane'
];

import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import IconPickerModal from './IconPickerModal';

// ... existing imports

export default function EditCategoryModal({
    visible,
    onClose,
    onSave,
    initialLabel = '',
    initialIcon = 'folder',
    initialColor = '#6B7280',
    mode,
    parentLabel
}: Props) {
    const { schemeColors, globalStyle } = useTheme();
    const [label, setLabel] = useState(initialLabel);
    const [selectedIcon, setSelectedIcon] = useState(initialIcon);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [saving, setSaving] = useState(false);

    // Custom Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setLabel(initialLabel);
            setSelectedIcon(initialIcon);
            setSelectedColor(initialColor);
            setSaving(false);
            setShowColorPicker(false);
        }
    }, [visible, initialLabel, initialIcon, initialColor]);

    const handleSave = async () => {
        if (!label.trim()) return;
        setSaving(true);
        try {
            await onSave(label.trim(), selectedIcon, selectedColor);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const onSelectColor = ({ hex }: { hex: string }) => {
        // We don't verify here, just wait for user to close or update live
        setSelectedColor(hex);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}>
                    <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                </TouchableOpacity>

                <View style={[styles.card, { backgroundColor: schemeColors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: schemeColors.text }]}>
                            {mode === 'create' ? (parentLabel ? `New Subcategory in ${parentLabel}` : 'New Category') : 'Edit Category'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={schemeColors.muted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }}>
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: schemeColors.muted }]}>NAME</Text>
                            <TextInput
                                style={[globalStyle.input, { backgroundColor: schemeColors.bgMid, borderColor: schemeColors.border }]}
                                value={label}
                                onChangeText={setLabel}
                                placeholder="e.g. Groceries"
                                placeholderTextColor={schemeColors.muted}
                                autoFocus
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: schemeColors.muted }]}>COLOR</Text>
                            <View style={styles.rowWrap}>
                                {COLORS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setSelectedColor(c)}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: c },
                                            selectedColor === c && styles.selectedRing
                                        ]}
                                    />
                                ))}
                                {/* Custom Color Button */}
                                <TouchableOpacity
                                    onPress={() => setShowColorPicker(true)}
                                    style={[styles.colorCircle, { backgroundColor: schemeColors.bgMid, alignItems: 'center', justifyContent: 'center' }]}
                                >
                                    <MaterialCommunityIcons name="plus" size={20} color={schemeColors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: schemeColors.muted }]}>ICON</Text>
                            <View style={styles.rowWrap}>
                                {/* Ensure selected icon is always visible/first if not in quick list */}
                                {[
                                    ...(ICONS.includes(selectedIcon) ? [] : [selectedIcon]),
                                    ...ICONS
                                ].map(i => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedIcon(i)}
                                        style={[
                                            styles.iconCircle,
                                            { backgroundColor: selectedIcon === i ? schemeColors.primary : schemeColors.bgMid }
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={i as any}
                                            size={20}
                                            color={selectedIcon === i ? '#fff' : schemeColors.text}
                                        />
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.iconCircle, { backgroundColor: schemeColors.bgMid }]}
                                    onPress={() => setShowIconPicker(true)}
                                >
                                    <MaterialCommunityIcons name="dots-horizontal" size={24} color={schemeColors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[globalStyle.primaryButton, { flex: 1, opacity: saving ? 0.7 : 1 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={globalStyle.primaryButtonText}>{saving ? 'Saving...' : 'Save Category'}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>

            {/* Icon Picker Modal */}
            <IconPickerModal
                visible={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={(icon) => {
                    setSelectedIcon(icon);
                    setShowIconPicker(false);
                }}
                currentIcon={selectedIcon}
            />

            {/* Color Picker Modal */}
            <Modal visible={showColorPicker} animationType='slide' transparent onRequestClose={() => setShowColorPicker(false)}>
                <View style={styles.pickerOverlay}>
                    <View style={[styles.pickerCard, { backgroundColor: schemeColors.surface }]}>
                        <View style={styles.pickerHeader}>
                            <Text style={[styles.title, { color: schemeColors.text }]}>Pick Color</Text>
                            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={schemeColors.text} />
                            </TouchableOpacity>
                        </View>

                        <ColorPicker style={{ width: '100%' }} value={selectedColor} onComplete={onSelectColor}>
                            <Preview />
                            <Panel1 />
                            <HueSlider />
                            <OpacitySlider />
                        </ColorPicker>

                        <TouchableOpacity
                            style={[globalStyle.primaryButton, { marginTop: 24 }]}
                            onPress={() => setShowColorPicker(false)}
                        >
                            <Text style={globalStyle.primaryButtonText}>Select Color</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        maxWidth: 500,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1,
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
    }
});
