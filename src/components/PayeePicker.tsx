import React, { useState, useMemo } from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import type { Payee } from '../db/models';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  payees: Payee[];
  onPayeePress: (p: Payee) => void;
};

export default function PayeePicker({
  visible,
  onRequestClose,
  payees,
  onPayeePress,
}: Props) {
  const { schemeColors, globalStyle } = useTheme();
  const [query, setQuery] = useState('');

  const filteredPayees = useMemo(() => {
    if (!query) return payees;
    const lower = query.toLowerCase();
    return payees.filter((p) => p.name.toLowerCase().includes(lower));
  }, [payees, query]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: schemeColors.border }]}>
          <TouchableOpacity onPress={onRequestClose} style={styles.headerButton}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: schemeColors.text }]}>Select Payee</Text>
          
          <View style={styles.headerButton} /> 
        </View>

        {/* Search */}
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: schemeColors.border }}>
             <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search payees"
                placeholderTextColor={schemeColors.muted}
                style={[globalStyle.searchInput, { marginBottom: 0 }]}
                autoFocus={true} // Auto focus when modal opens usually nice
             />
        </View>

        {/* List */}
        <FlatList
          data={filteredPayees}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onPayeePress(item)}
              style={[globalStyle.row, { marginBottom: 0, borderBottomWidth: 1, borderBottomColor: schemeColors.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={[globalStyle.rowLabel, { flex: 1 }]}>{item.name}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={schemeColors.muted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: schemeColors.muted }}>No payees found.</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
