import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
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
  variant?: 'default' | 'list';
  errors?: { amount?: string };
};



const GlassToggle = ({
  transactionType,
  setTransactionType,
  styles: s,
  globalStyle
}: {
  transactionType: 'EXPENSE' | 'INCOME';
  setTransactionType: (t: 'EXPENSE' | 'INCOME') => void;
  styles: any;
  globalStyle: any;
}) => {
  const slideAnim = React.useRef(new Animated.Value(transactionType === 'EXPENSE' ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: transactionType === 'EXPENSE' ? 0 : 1,
      useNativeDriver: false, // backgroundColor interpolation requires false
      bounciness: 12,
      speed: 12,
    }).start();
  }, [transactionType]);

  const leftPos = slideAnim.interpolate({
    inputRange: [-0.05, 1],
    outputRange: ['0%', '50%'],
  });

  const backgroundColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 77, 79, 0.85)', 'rgba(16, 185, 129, 0.85)'], // Glassy Red & Green
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
            <GlassToggle
              transactionType={transactionType}
              setTransactionType={setTransactionType}
              styles={addExpenseStyle}
              globalStyle={globalStyle}
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
            <View style={{ position: 'absolute', bottom: -20, right: 12, backgroundColor: schemeColors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{errors.amount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={openDatePicker} style={[globalStyle.row, { paddingVertical: 16 }]}>
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
        <View style={{ marginBottom: 16 }}>
          <GlassToggle
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            styles={addExpenseStyle}
            globalStyle={globalStyle}
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
          <View style={{ position: 'absolute', bottom: -8, right: 0, backgroundColor: schemeColors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, zIndex: 10 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{errors.amount}</Text>
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
          <Text style={{ fontSize: 20, marginRight: 8 }}>{selectedCategory.icon}</Text>
        )}
        <Text style={{ color: schemeColors.muted }}>
          {selectedCategory ? selectedCategory.label : 'Select category'}
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default ExpenseFormFields;
