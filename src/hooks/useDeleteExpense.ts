// src/hooks/useDeleteExpense.ts
import { Alert } from 'react-native';
import { TransactionRepo } from '../db/repositories/TransactionRepo';

export default function useDeleteExpense() {
  /**
   * deleteExpense - performs either a hard delete or soft-void by setting deleted=1
   * returns: Promise<void>
   */
  const deleteExpense = async (id: string, markVoid = false) => {
    try {
      if (markVoid) {
        await TransactionRepo.update(id, { deleted: 1 });
      } else {
        await TransactionRepo.delete(id);
      }
    } catch (err) {
      console.error('useDeleteExpense: failed', err);
      // bubble up or show a generic alert
      Alert.alert('Operation failed', 'Unable to delete/mark void the transaction.');
      throw err;
    }
  };

  return { deleteExpense };
}
