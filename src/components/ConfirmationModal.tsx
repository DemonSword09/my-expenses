import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { SPACING, RADIUS } from '../styles/theme';

interface Props {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (explicitMarkVoid?: boolean) => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    allowVoid?: boolean;
}

export default function ConfirmationModal({
    visible,
    onCancel,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    isDestructive = false,
    allowVoid = false,
}: Props) {
    const { globalStyle, schemeColors } = useTheme();
    const [markVoid, setMarkVoid] = useState(false);

    useEffect(() => {
        if (!visible) setMarkVoid(false); // reset on close
    }, [visible]);

    const handleConfirm = () => {
        onConfirm(markVoid);
    };

    const handleCancel = () => {
        onCancel();
        setMarkVoid(false);
    };

    const toggleVoid = () => setMarkVoid((v) => !v);

    const styles = getStyles(schemeColors);

    // Determine confirm button color
    const confirmBtnColor = (isDestructive && !markVoid) ? schemeColors.danger : schemeColors.primary;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <TouchableOpacity
                style={globalStyle.modalOverlay}
                activeOpacity={1}
                onPress={handleCancel}
            >
                {/* Modal Sheet */}
                <View style={[globalStyle.modalSheet, styles.sheetContainer]}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Void Checkbox */}
                    {allowVoid && (
                        <TouchableOpacity
                            onPress={toggleVoid}
                            style={styles.checkboxRow}
                            activeOpacity={0.8}
                        >
                            <View style={[
                                styles.checkbox,
                                markVoid && { backgroundColor: schemeColors.primary, borderColor: schemeColors.primary }
                            ]}>
                                {markVoid && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                            </View>

                            <Text style={styles.checkboxLabel}>Mark as void instead</Text>
                        </TouchableOpacity>
                    )}

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={[styles.confirmBtn, { backgroundColor: confirmBtnColor }]}
                        >
                            <Text style={styles.confirmText}>
                                {allowVoid && markVoid ? 'Mark Void' : confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    sheetContainer: {
        paddingBottom: SPACING.xl,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: SPACING.sm,
        color: colors.textStrong,
    },
    message: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: SPACING.md,
        lineHeight: 22,
    },
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
        borderColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    checkboxLabel: {
        marginLeft: SPACING.md,
        fontSize: 15,
        color: colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: SPACING.lg,
    },
    cancelBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginRight: SPACING.sm,
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: colors.text,
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
        color: '#FFFFFF', // Always white on primary/danger buttons
        fontWeight: '700',
    },
});
