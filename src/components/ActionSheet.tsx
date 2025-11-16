// src/components/ActionSheet.tsx
import React from 'react';
import { Modal, View, TouchableOpacity, Text, Alert, StyleProp, ViewStyle } from 'react-native';
import useTheme from '../hooks/useTheme';
import { Transaction } from '@src/db/models';
import { TransactionRepo } from '@src/db/repositories/TransactionRepo';
import { useNavigation } from '@react-navigation/native';
import useExpenses from '@src/hooks/useExpenses';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onRefresh: () => void;
  activeTransaction: Transaction | null;
  setActionModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ActionSheet({
  visible,
  activeTransaction,
  onRefresh,
  setActionModalVisible,
  setConfirmModalVisible,
}: Props) {
  const { expenseListStyle, globalStyle, schemeColors } = useTheme();
  const navigation = useNavigation();
  const onEdit = () => {
    if (!activeTransaction) return;
    setActionModalVisible(false);
    (navigation as any).navigate('AddExpense', { id: activeTransaction.id });
  };
  const isVoid = activeTransaction?.deleted;
  const onClone = async () => {
    if (!activeTransaction) return;
    try {
      await TransactionRepo.clone(activeTransaction.id);
      setActionModalVisible(false);
      onRefresh();
    } catch (err) {
      console.error('Clone failed', err);
      Alert.alert('Clone failed', 'Unable to clone the transaction.');
    }
  };
  const onUndelete = async () => {
    if (!activeTransaction) return;
    TransactionRepo.update(activeTransaction.id, { deleted: 0 });
    setActionModalVisible(false);
    onRefresh();
    return;
  };
  const onDeleteRequested = () => {
    setActionModalVisible(false);
    setConfirmModalVisible(true);
  };
  const onRequestClose = () => setActionModalVisible(false);
  const modalRow: StyleProp<ViewStyle> = { paddingVertical: 8, flexDirection: 'row' };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <TouchableOpacity style={globalStyle.modalOverlay} activeOpacity={0} onPress={onRequestClose}>
        <View style={globalStyle.modalSheet}>
          {isVoid ? (
            <TouchableOpacity onPress={onUndelete} style={modalRow}>
              <MaterialCommunityIcons
                name="delete-restore"
                size={22}
                style={{ color: schemeColors.primary }}
              />
              <Text style={globalStyle.modalRowText}>UnDelete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onEdit} style={modalRow}>
              <MaterialCommunityIcons
                name="cash-edit"
                size={24}
                style={{ color: schemeColors.primary }}
              />
              <Text style={globalStyle.modalRowText}>Edit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClone} style={modalRow}>
            <MaterialCommunityIcons
              name="content-duplicate"
              size={22}
              style={{ color: schemeColors.primary }}
            />
            <Text style={globalStyle.modalRowText}>Clone</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDeleteRequested} style={modalRow}>
            <MaterialCommunityIcons
              name="delete"
              size={22}
              style={{ color: schemeColors.danger }}
            />
            <Text style={[globalStyle.modalRowText, { color: schemeColors.danger }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRequestClose} style={modalRow}>
            <MaterialCommunityIcons
              name="cancel"
              size={22}
              style={{ color: schemeColors.primary }}
            />
            <Text style={globalStyle.modalRowText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
