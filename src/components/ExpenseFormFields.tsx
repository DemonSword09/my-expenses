import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import useTheme from '../hooks/useTheme';
import type { Category, Payee } from '../db/models';

type Props = {
  amount: string;
  setAmount: (v: string) => void;
  merchant: string;
  setMerchant: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  dateMs: number;
  openDatePicker: () => void;
  selectedCategory: Category | null;
  openCategoryPicker: () => void;
  payees?: Payee[];
  onMerchantSelect?: (p: Payee) => void;
  transactionType?: 'EXPENSE' | 'INCOME';
  setTransactionType?: (t: 'EXPENSE' | 'INCOME') => void;
};

export default function ExpenseFormFields({
  amount,
  setAmount,
  merchant,
  setMerchant,
  notes,
  setNotes,
  dateMs,
  openDatePicker,
  selectedCategory,
  openCategoryPicker,
  variant = 'default',
  payees = [],
  onMerchantSelect,
  transactionType = 'EXPENSE',
  setTransactionType,
}: Props & { variant?: 'default' | 'list' }) {
  const { scheme, schemeColors, globalStyle } = useTheme();
  const s = require('../styles/addExpenseStyles').addExpenseStyles(scheme);

  const [suggestions, setSuggestions] = React.useState<Payee[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const onMerchantChange = (text: string) => {
    setMerchant(text);
    if (text.length > 0 && payees.length > 0) {
      const filtered = payees.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()));
      setSuggestions(filtered.slice(0, 5)); // limit to 5
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const onSuggestionPress = (p: Payee) => {
    setMerchant(p.name);
    setShowSuggestions(false);
    if (onMerchantSelect) {
      onMerchantSelect(p);
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <View style={{ 
        backgroundColor: schemeColors.surface, 
        opacity: 1, 
        borderWidth: 1, 
        borderColor: schemeColors.border,
        borderRadius: 12,
        marginTop: 4,
        maxHeight: 150,
        position: 'absolute',
        top: 40, // adjust based on input height
        right: 0,
        minWidth: 150,
        zIndex: 1000,
      }}>
        {suggestions.map((p, index) => (
          <TouchableOpacity 
            key={p.id} 
            onPress={() => onSuggestionPress(p)}
            style={{ 
              padding: 12, 
              borderBottomWidth: index === suggestions.length - 1 ? 0 : 0.5, 
              borderBottomColor: schemeColors.border 
            }}
          >
            <Text style={{ color: schemeColors.text }}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (variant === 'list') {
    return (
      <>
        {setTransactionType && (
          <View style={[globalStyle.row, { justifyContent: 'center', paddingVertical: 12 }]}>
            <View style={{ flexDirection: 'row', backgroundColor: schemeColors.background, borderRadius: 8, padding: 2 }}>
              <TouchableOpacity
                onPress={() => setTransactionType('EXPENSE')}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: transactionType === 'EXPENSE' ? schemeColors.danger : 'transparent',
                }}
              >
                <Text style={{ 
                  color: transactionType === 'EXPENSE' ? '#fff' : schemeColors.text,
                  fontWeight: '600'
                }}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTransactionType('INCOME')}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: transactionType === 'INCOME' ? schemeColors.success : 'transparent',
                }}
              >
                <Text style={{ 
                  color: transactionType === 'INCOME' ? '#fff' : schemeColors.text,
                  fontWeight: '600'
                }}>Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={globalStyle.row}>
          <Text style={globalStyle.rowLabel}>Amount</Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={schemeColors.muted}
            style={[globalStyle.rowInput, { textAlign: 'right' }]}
          />
        </View>

        <TouchableOpacity onPress={openDatePicker} style={[globalStyle.row,{paddingVertical:16}]}>
          <Text style={globalStyle.rowLabel}>Date</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
             <Text style={globalStyle.rowValue}>{format(new Date(dateMs), 'PP')}</Text>
          </View>
        </TouchableOpacity>

        <View style={[globalStyle.row, { zIndex: 2000 }]}>
          <Text style={globalStyle.rowLabel}>Merchant</Text>
            <TextInput
              value={merchant}
              onChangeText={onMerchantChange}
              onFocus={() => {
                if (merchant.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // delay hiding to allow press
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Starbucks"
              placeholderTextColor={schemeColors.muted}
              style={[globalStyle.rowInput, { textAlign: 'right' }]}
            />
            {renderSuggestions()}
        </View>

        <View style={[globalStyle.row, { zIndex: 1000 }]}>
          <Text style={globalStyle.rowLabel}>Category</Text>
          <TouchableOpacity onPress={openCategoryPicker} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            {selectedCategory?.icon && (
              <MaterialCommunityIcons 
                name={selectedCategory.icon as any} 
                size={20} 
                color={schemeColors.primary} 
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={[globalStyle.rowInput, !selectedCategory && globalStyle.rowPlaceholder, { textAlign: 'right', flex: 0 }]}>
              {selectedCategory ? selectedCategory.label : 'Select category'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[globalStyle.row, { borderBottomWidth: 0 }]}>
          <Text style={globalStyle.rowLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={schemeColors.muted}
            style={[globalStyle.rowInput, { textAlign: 'right' }]}
          />
        </View>
      </>
    );
  }

  return (
    <>
      {setTransactionType && (
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setTransactionType('EXPENSE')}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: transactionType === 'EXPENSE' ? schemeColors.danger : schemeColors.surface,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderWidth: 1,
              borderColor: transactionType === 'EXPENSE' ? schemeColors.danger : schemeColors.border,
            }}
          >
            <Text style={{ 
              color: transactionType === 'EXPENSE' ? '#fff' : schemeColors.text,
              fontWeight: '600'
            }}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTransactionType('INCOME')}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: transactionType === 'INCOME' ? schemeColors.success : schemeColors.surface,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderWidth: 1,
              borderColor: transactionType === 'INCOME' ? schemeColors.success : schemeColors.border,
              borderLeftWidth: 0,
            }}
          >
            <Text style={{ 
              color: transactionType === 'INCOME' ? '#fff' : schemeColors.text,
              fontWeight: '600'
            }}>Income</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.label}>Amount</Text>
      <TextInput
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={schemeColors.muted}
        style={[globalStyle.searchInput, { marginBottom: 12 }]}
      />

      <Text style={s.label}>Date</Text>
      <TouchableOpacity onPress={openDatePicker} style={[globalStyle.searchInput, s.dateButton]}>
        <Text style={{ color: schemeColors.muted }}>{format(new Date(dateMs), 'PP')}</Text>
      </TouchableOpacity>

      <View style={{ zIndex: 2000 }}>
        <Text style={s.label}>Merchant</Text>
        <TextInput
          value={merchant}
          onChangeText={onMerchantChange}
          onFocus={() => {
            if (merchant.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
             setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Starbucks"
          placeholderTextColor={schemeColors.muted}
          style={[globalStyle.searchInput, { marginBottom: 12 }]}
        />
        {/* Render suggestions for default variant too if needed, but positioning might differ */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={{ 
            backgroundColor: schemeColors.surface, 
            borderWidth: 1, 
            borderColor: schemeColors.border,
            borderRadius: 8,
            marginTop: -10,
            marginBottom: 10,
            maxHeight: 150,
            elevation: 5,
          }}>
            {suggestions.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                onPress={() => onSuggestionPress(p)}
                style={{ padding: 12, borderBottomWidth: 0.5, borderBottomColor: schemeColors.border }}
              >
                <Text style={{ color: schemeColors.text }}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={s.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes"
        placeholderTextColor={schemeColors.muted}
        style={[globalStyle.searchInput, { marginBottom: 12 }]}
      />

      <Text style={s.label}>Category</Text>
      <TouchableOpacity onPress={openCategoryPicker} style={[globalStyle.searchInput, { flexDirection: 'row', alignItems: 'center' }]}>
        {selectedCategory?.icon && (
          <Text style={{ fontSize: 20, marginRight: 8 }}>{selectedCategory.icon}</Text>
        )}
        <Text style={{ color: schemeColors.muted }}>
          {selectedCategory ? selectedCategory.label : 'Select category'}
        </Text>
      </TouchableOpacity>
    </>
  );
}
