import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, RadioButton, Divider } from 'react-native-paper';
import useTheme from '../hooks/useTheme';

interface ExportOptionsModalProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (delimiter: string, dateFormat: string) => void;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ visible, onDismiss, onConfirm }) => {
    const { schemeColors, globalStyle } = useTheme();
    const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
    const [dateFormat, setDateFormat] = useState('yyyy-MM-dd');

    const dateFormats = [
        { label: 'YYYY-MM-DD (2023-12-31)', value: 'yyyy-MM-dd' },
        { label: 'DD/MM/YYYY (31/12/2023)', value: 'dd/MM/yyyy' },
        { label: 'MM/DD/YYYY (12/31/2023)', value: 'MM/dd/yyyy' },
        { label: 'DD-MMM-YYYY (31-Dec-2023)', value: 'dd-MMM-yyyy' },
    ];

    const delimiters = [
        { label: 'Comma (,)', value: ',' },
        { label: 'Semicolon (;)', value: ';' },
        { label: 'Tab (\\t)', value: '\t' },
    ];

    const styles = getStyles(schemeColors);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
                <View style={styles.container}>
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
                        <Text style={styles.title}>Export CSV Options</Text>

                        <Text style={styles.sectionTitle}>Delimiter</Text>
                        <View style={styles.optionGroup}>
                            {delimiters.map((item) => (
                                <View key={item.label} style={styles.row}>
                                    <RadioButton
                                        value={item.value}
                                        status={delimiter === item.value ? 'checked' : 'unchecked'}
                                        onPress={() => setDelimiter(item.value as any)}
                                        color={schemeColors.primary}
                                    />
                                    <Text style={{ color: schemeColors.text }} onPress={() => setDelimiter(item.value as any)}>{item.label}</Text>
                                </View>
                            ))}
                        </View>

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Date Format</Text>
                        <View style={styles.optionGroup}>
                            {dateFormats.map((item) => (
                                <View key={item.label} style={styles.row}>
                                    <RadioButton
                                        value={item.value}
                                        status={dateFormat === item.value ? 'checked' : 'unchecked'}
                                        onPress={() => setDateFormat(item.value)}
                                        color={schemeColors.primary}
                                    />
                                    <Text style={{ color: schemeColors.text }} onPress={() => setDateFormat(item.value)}>{item.label}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.actions}>
                            <Button mode="text" onPress={onDismiss} textColor={schemeColors.text}>
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => onConfirm(delimiter, dateFormat)}
                                buttonColor={schemeColors.primary}
                                style={styles.exportBtn}
                            >
                                Export
                            </Button>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        borderRadius: 16,
        padding: 20,
        backgroundColor: colors.surface,
        elevation: 5,
        maxWidth: 400,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: colors.textStrong,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 4,
        textTransform: 'uppercase',
        opacity: 0.8,
        color: colors.primary,
    },
    optionGroup: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    divider: {
        marginVertical: 12,
        backgroundColor: colors.divider,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 12,
    },
    exportBtn: {
        paddingHorizontal: 16,
    }
});

export default ExportOptionsModal;
