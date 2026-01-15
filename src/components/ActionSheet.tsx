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
  const navigation = useNavigation<any>(); // Cast to any or helper type if specific routes aren't global

  const onEdit = () => {
    if (!activeTransaction) return;
    setActionModalVisible(false);
    navigation.navigate('AddExpense', { id: activeTransaction.id });
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <TouchableOpacity style={globalStyle.modalOverlay} activeOpacity={1} onPress={onRequestClose}>
        <View style={globalStyle.modalSheet}>
          {isVoid ? (
            <TouchableOpacity onPress={onUndelete} style={globalStyle.modalRow}>
              <MaterialCommunityIcons
                name="delete-restore"
                size={22}
                color={schemeColors.primary}
              />
              <Text style={globalStyle.modalRowText}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onEdit} style={globalStyle.modalRow}>
              <MaterialCommunityIcons
                name="pencil"
                size={22}
                color={schemeColors.primary}
              />
              <Text style={globalStyle.modalRowText}>Edit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClone} style={globalStyle.modalRow}>
            <MaterialCommunityIcons
              name="content-duplicate"
              size={22}
              color={schemeColors.primary}
            />
            <Text style={globalStyle.modalRowText}>Clone</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDeleteRequested} style={globalStyle.modalRow}>
            <MaterialCommunityIcons
              name="delete"
              size={22}
              color={schemeColors.danger}
            />
            <Text style={[globalStyle.modalRowText, { color: schemeColors.danger }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRequestClose} style={globalStyle.modalRow}>
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={schemeColors.text}
            />
            <Text style={globalStyle.modalRowText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
