// src/components/ConfirmDeleteModal.tsx
import React, { SetStateAction, useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, Text, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { Transaction } from '@src/db/models';
import { TransactionRepo } from '@src/db/repositories/TransactionRepo';

interface Props {
  visible: boolean;
  activeTransaction: Transaction | null;
  onRefresh: () => void;
  onCancel: () => void;
  setActionModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTransaction: React.Dispatch<SetStateAction<Transaction | null>>;
  title?: string;
  message?: string;
}

export default function ConfirmDeleteModal({
  visible,
  activeTransaction,
  onRefresh,
  onCancel,
  setConfirmModalVisible,
  setActionModalVisible,
  setActiveTransaction,
  title = 'Delete transaction',
  message = 'This action cannot be undone. You can mark the transaction as void instead so it remains in your history.',
}: Props) {
  const { globalStyle, schemeColors } = useTheme();
  const [markVoid, setMarkVoid] = useState(false);
  const onConfirmDelete = async (explicitMarkVoid?: boolean) => {
    if (!activeTransaction) return;

    // explicitMarkVoid allows buttons to pass explicit choice; otherwise use local state
    const useVoid = typeof explicitMarkVoid === 'boolean' ? explicitMarkVoid : markVoid;
    // console.log(useVoid);

    try {
      if (useVoid) {
        // soft-void
        await TransactionRepo.update(activeTransaction.id, { deleted: 1 });
      } else {
        // hard delete
        await TransactionRepo.delete(activeTransaction.id);
      }

      // close modals and refresh
      setConfirmModalVisible(false);
      setActionModalVisible(false);
      setMarkVoid(false);
      setActiveTransaction(null);
      onRefresh(); // your existing loader
    } catch (err) {
      console.error('Delete/void failed', err);
      Alert.alert('Operation failed', 'Unable to delete/mark void the transaction.');
    }
  };
  useEffect(() => {
    if (!visible) setMarkVoid(false);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        onCancel();
        setMarkVoid(false);
      }}
    >
      <TouchableOpacity
        style={globalStyle.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          onCancel();
          setMarkVoid(false);
        }}
      >
        <View style={[globalStyle.modalSheet, { paddingBottom: 18 }]}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 8,
              color: schemeColors.text,
            }}
          >
            {title}
          </Text>

          <Text style={{ color: schemeColors.muted, marginBottom: 12 }}>{message}</Text>

          {/* checkbox row */}
          <TouchableOpacity
            onPress={() => setMarkVoid((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: markVoid ? schemeColors.primary : schemeColors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: markVoid ? schemeColors.primary : 'transparent',
              }}
            >
              {markVoid ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
            </View>

            <Text style={{ marginLeft: 12, fontSize: 15, color: schemeColors.text }}>
              Mark as void instead
            </Text>
          </TouchableOpacity>

          {/* action buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => {
                onCancel();
                setMarkVoid(false);
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}
            >
              <Text style={{ fontSize: 15, color: schemeColors.text }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onConfirmDelete(markVoid)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: markVoid ? schemeColors.primary : schemeColors.danger,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {markVoid ? 'Mark void' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
