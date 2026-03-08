// src/components/EditCategoryModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import useTheme from '../../hooks/useTheme';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import IconPickerModal from './IconPickerModal';

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
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

const ICONS = [
    'folder', 'food', 'car', 'home', 'shopping', 'gift', 'gamepad-variant',
    'school', 'briefcase', 'bank', 'hospital-box', 'airplane'
];

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
    const { schemeColors, globalStyle, actionModalStyle } = useTheme();
    const [label, setLabel] = useState(initialLabel);
    const [selectedIcon, setSelectedIcon] = useState(() => {
        if (initialIcon?.startsWith('file://') || initialIcon?.startsWith('http://') || initialIcon?.startsWith('https://')) return 'image';
        return initialIcon;
    });
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [saving, setSaving] = useState(false);
    const [customImageUri, setCustomImageUri] = useState(() => {
        if (initialIcon?.startsWith('file://') || initialIcon?.startsWith('http://') || initialIcon?.startsWith('https://')) return initialIcon;
        return '';
    });

    // Custom Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    const styles = actionModalStyle; // Action modal styles cover most parts

    useEffect(() => {
        if (visible) {
            setLabel(initialLabel);
            
            if (initialIcon?.startsWith('file://') || initialIcon?.startsWith('http://') || initialIcon?.startsWith('https://')) {
                setCustomImageUri(initialIcon);
                setSelectedIcon('image');
            } else {
                setCustomImageUri('');
                setSelectedIcon(initialIcon);
            }
            setSelectedColor(initialColor);
            setSaving(false);
            setShowColorPicker(false);
        }
    }, [visible, initialLabel, initialIcon, initialColor]);

    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const manipulated = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 256 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
                );

                // Just temporarily hold the manipulated URI.
                // We will copy it to the persistent document directory inside `handleSave` once we know the final label name.
                setCustomImageUri(manipulated.uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick or process the image.');
        }
    };

    const handleSave = async () => {
        if (!label.trim()) return;
        setSaving(true);
        try {
            let finalIcon = customImageUri.trim();
            
            // If there's a custom image and it's from the cache (e.g. newly picked), move it to document directory named after the category
            if (finalIcon && finalIcon.startsWith('file://') && !finalIcon.includes(FileSystem.Paths.document.uri)) {
                const safeLabel = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                const filename = `cat_${safeLabel}_${Date.now()}.webp`; // keep timestamp to prevent aggressive caching issues when modifying same category
                const destFile = new FileSystem.File(FileSystem.Paths.document, filename);
                const sourceFile = new FileSystem.File(finalIcon);
                sourceFile.copy(destFile);
                finalIcon = destFile.uri;
            } else if (!finalIcon) {
                finalIcon = selectedIcon;
            }

            await onSave(label.trim(), finalIcon, selectedColor);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const onSelectColor = ({ hex }: { hex: string }) => {
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
                            <Text style={[styles.label, { color: schemeColors.muted }]}>CUSTOM IMAGE (optional)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                                {customImageUri ? (
                                    <View style={{ position: 'relative' }}>
                                        <Image source={{ uri: customImageUri }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: schemeColors.bgMid }} resizeMode="cover" />
                                        <TouchableOpacity 
                                            style={{ position: 'absolute', top: -5, right: -5, backgroundColor: schemeColors.error, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                                            onPress={() => setCustomImageUri('')}
                                        >
                                            <MaterialCommunityIcons name="close" size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                <TouchableOpacity
                                    style={[globalStyle.primaryButton, { paddingHorizontal: 16, paddingVertical: 8, flex: 1, backgroundColor: schemeColors.bgMid }]}
                                    onPress={pickImage}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <MaterialCommunityIcons name="upload" size={18} color={schemeColors.text} />
                                        <Text style={{ color: schemeColors.text, fontWeight: 'bold' }}>Pick Local Image</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[globalStyle.input, { backgroundColor: schemeColors.bgMid, borderColor: schemeColors.border, fontSize: 13, paddingVertical: 8, marginTop: 4 }]}
                                value={customImageUri}
                                onChangeText={setCustomImageUri}
                                placeholder="Or enter image URL (https://...)"
                                placeholderTextColor={schemeColors.muted}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: schemeColors.muted }]}>OR SELECT ICON</Text>
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
