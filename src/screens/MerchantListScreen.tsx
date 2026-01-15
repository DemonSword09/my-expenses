// src/screens/MerchantListScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { PayeeRepo } from '../db/repositories/PayeeRepo';
import type { Payee } from '../db/models';
import { useAppData } from '../context/AppDataProvider';

export default function MerchantListScreen() {
    const { schemeColors, globalStyle } = useTheme();
    const navigation = useNavigation();
    const { refreshData } = useAppData(); // To refresh context if needed

    const [payees, setPayees] = useState<Payee[]>([]);
    const [query, setQuery] = useState('');
    const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
    const [editName, setEditName] = useState('');

    const loadPayees = useCallback(async () => {
        try {
            const list = await PayeeRepo.listAll();
            setPayees(list);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPayees();
        }, [loadPayees])
    );

    const filteredPayees = payees.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleDelete = (payee: Payee) => {
        Alert.alert(
            'Delete Merchant',
            `Are you sure you want to delete "${payee.name}"? Transactions will be unlinked.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await PayeeRepo.delete(payee.id);
                            await loadPayees();
                            await refreshData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete merchant');
                        }
                    }
                }
            ]
        );
    };

    const startEdit = (payee: Payee) => {
        setEditingPayee(payee);
        setEditName(payee.name);
    };

    const saveEdit = async () => {
        if (!editingPayee || !editName.trim()) return;
        try {
            await PayeeRepo.update(editingPayee.id, editName.trim());
            setEditingPayee(null);
            setEditName('');
            await loadPayees();
            await refreshData();
        } catch (err) {
            Alert.alert('Error', 'Failed to update merchant');
        }
    };

    return (
        <View style={globalStyle.container}>
            <Appbar.Header style={{ backgroundColor: schemeColors.surface }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
                <Appbar.Content title="Merchants" titleStyle={{ color: schemeColors.text }} />
            </Appbar.Header>

            <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: schemeColors.border }}>
                <TextInput
                    placeholder="Search merchants"
                    placeholderTextColor={schemeColors.muted}
                    value={query}
                    onChangeText={setQuery}
                    style={[globalStyle.searchInput, { marginBottom: 0 }]}
                />
            </View>

            {editingPayee && (
                <View style={{ padding: 16, backgroundColor: schemeColors.surface, borderBottomWidth: 1, borderBottomColor: schemeColors.border }}>
                    <Text style={{ color: schemeColors.muted, marginBottom: 8 }}>Editing: {editingPayee.name}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={[globalStyle.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                            autoFocus
                        />
                        <TouchableOpacity onPress={saveEdit} style={globalStyle.addButton}>
                            <Text style={globalStyle.addButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingPayee(null)} style={{ justifyContent: 'center', padding: 8, marginLeft: 8 }}>
                            <Text style={{ color: schemeColors.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={filteredPayees}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[globalStyle.row, { justifyContent: 'space-between' }]}>
                        <Text style={[globalStyle.rowLabel, { flex: 1 }]}>{item.name}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => startEdit(item)} style={{ padding: 8 }}>
                                <MaterialCommunityIcons name="pencil" size={20} color={schemeColors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: schemeColors.muted }}>No merchants found.</Text>
                    </View>
                }
            />
        </View>
    );
}

