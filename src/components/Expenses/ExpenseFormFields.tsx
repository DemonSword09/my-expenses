import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import useTheme from '../../hooks/useTheme';
import type { Category, Payee } from '../../db/models';

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
  variant?: 'default' | 'list';
  errors?: { amount?: string };
};

const GlassToggle = ({
  transactionType,
  setTransactionType,
  styles: s,
  globalStyle,
  schemeColors
}: {
  transactionType: 'EXPENSE' | 'INCOME';
  setTransactionType: (t: 'EXPENSE' | 'INCOME') => void;
  styles: any;
  globalStyle: any;
  schemeColors: any;
}) => {
  const slideAnim = useRef(new Animated.Value(transactionType === 'EXPENSE' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: transactionType === 'EXPENSE' ? 0 : 1,
      useNativeDriver: false, // backgroundColor interpolation requires false
      bounciness: 12,
      speed: 12,
    }).start();
  }, [transactionType, slideAnim]);

  const leftPos = slideAnim.interpolate({
    inputRange: [-0.05, 1],
    outputRange: ['0%', '50%'],
  });

  // Use slightly transparent versions of theme colors if possible, or fallback to theme
  // For simplicity and consistency, using theme colors directly or hardcoded 'glass' variants if theme doesn't support alpha
  // But typically we want consistency. Let's use the theme colors.
  const backgroundColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [schemeColors.danger, schemeColors.success],
  });

  return (
    <View style={[globalStyle.glassBase, s.glassToggleContainer]}>
      <Animated.View
        style={[
          s.glassActivePill,
          {
            left: leftPos,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }
        ]}
      />
      <View style={s.glassTrack}>
        <TouchableOpacity
          style={s.glassItem}
          onPress={() => setTransactionType('EXPENSE')}
          activeOpacity={0.7}
        >
          <Text style={transactionType === 'EXPENSE' ? s.glassLabelActive : s.glassLabel}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.glassItem}
          onPress={() => setTransactionType('INCOME')}
          activeOpacity={0.7}
        >
          <Text style={transactionType === 'INCOME' ? s.glassLabelActive : s.glassLabel}>
            Income
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ExpenseFormFields = ({
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
  errors = {},
}: Props) => {
  const { schemeColors, globalStyle, addExpenseStyle } = useTheme();

  const [suggestions, setSuggestions] = useState<Payee[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onMerchantChange = (text: string) => {
    setMerchant(text);
    if (text.length > 0 && payees.length > 0) {
      const filtered = payees.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
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
      <View style={addExpenseStyle.suggestionsContainer}>
        {suggestions.map((p, index) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => onSuggestionPress(p)}
            style={[
              addExpenseStyle.suggestionItem,
              index === suggestions.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <Text style={addExpenseStyle.suggestionText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (variant === 'list') {
    return (
      <>
        {setTransactionType && (
          <View style={[globalStyle.row, addExpenseStyle.rowContainer]}>
            <GlassToggle
              transactionType={transactionType}
              setTransactionType={setTransactionType}
              styles={addExpenseStyle}
              globalStyle={globalStyle}
              schemeColors={schemeColors}
            />
          </View>
        )}

        <View style={[globalStyle.row, { zIndex: 10 }]}>
          <Text style={globalStyle.rowLabel}>Amount</Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            placeholderTextColor={schemeColors.muted}
            style={[globalStyle.rowInput, { textAlign: 'right' }]}
          />
          {errors.amount && (
            <View style={addExpenseStyle.errorTooltip}>
              <Text style={addExpenseStyle.errorText}>{errors.amount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={openDatePicker} style={[globalStyle.row, { paddingVertical: 16 }]}>
          <Text style={globalStyle.rowLabel}>Date</Text>
          <View style={addExpenseStyle.dateValue}>
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
          <TouchableOpacity onPress={openCategoryPicker} style={addExpenseStyle.categoryButton}>
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

  // Default variant (though likely unused or less critical, let's keep it clean too)
  return (
    <>
      {setTransactionType && (
        <View style={{ marginBottom: 16 }}>
          <GlassToggle
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            styles={addExpenseStyle}
            globalStyle={globalStyle}
            schemeColors={schemeColors}
          />
        </View>
      )}

      <Text style={addExpenseStyle.label}>Amount</Text>
      <View style={{ zIndex: 11, position: 'relative' }}>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={schemeColors.muted}
          style={[globalStyle.searchInput, { marginBottom: 12 }]}
        />
        {errors.amount && (
          <View style={[addExpenseStyle.errorTooltip, { bottom: -8, right: 0, zIndex: 10 }]}>
            <Text style={addExpenseStyle.errorText}>{errors.amount}</Text>
          </View>
        )}
      </View>

      <Text style={addExpenseStyle.label}>Date</Text>
      <TouchableOpacity onPress={openDatePicker} style={[globalStyle.searchInput, addExpenseStyle.dateButton]}>
        <Text style={{ color: schemeColors.muted }}>{format(new Date(dateMs), 'PP')}</Text>
      </TouchableOpacity>

      <View style={{ zIndex: 2000 }}>
        <Text style={addExpenseStyle.label}>Merchant</Text>
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
        {renderSuggestions()}
      </View>

      <Text style={addExpenseStyle.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes"
        placeholderTextColor={schemeColors.muted}
        style={[globalStyle.searchInput, { marginBottom: 12 }]}
      />

      <Text style={addExpenseStyle.label}>Category</Text>
      <TouchableOpacity onPress={openCategoryPicker} style={[globalStyle.searchInput, { flexDirection: 'row', alignItems: 'center' }]}>
        {selectedCategory?.icon && (
          <Text style={{ fontSize: 20, marginRight: 8, color: schemeColors.text }}>{selectedCategory.icon}</Text>
        )}
        <Text style={{ color: schemeColors.muted }}>
          {selectedCategory ? selectedCategory.label : 'Select category'}
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default ExpenseFormFields;
