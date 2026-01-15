export const CATEGORY_SEED = [
  {
    name: 'Food',
    icon: 'food-fork-drink',
    color: '#FF7043',
    type: 'expense',
    subcategories: [
      { name: 'Tea', icon: 'cup', color: '#A1887F' },
      { name: 'Canteen', icon: 'silverware-fork-knife', color: '#8D6E63' },
      { name: 'Street', icon: 'food', color: '#FF8A65' },
      { name: 'Drinks', icon: 'glass-cocktail', color: '#FFB74D' },
      { name: 'Grocery', icon: 'cart', color: '#66BB6A' },
      { name: 'Restaurant', icon: 'silverware-clean', color: '#E64A19' },
      { name: 'Sweets', icon: 'cookie', color: '#F06292' },
      { name: 'Bar', icon: 'glass-wine', color: '#AB47BC' },
      { name: 'Baker', icon: 'bread-slice', color: '#D7A86E' },
      { name: 'Self-service', icon: 'silverware-fork-knife', color: '#BCAAA4' },
    ],
  },

  {
    name: 'Transport',
    icon: 'car',
    color: '#42A5F5',
    type: 'expense',
    subcategories: [
      { name: 'Bus', icon: 'bus', color: '#1E88E5' },
      { name: 'Car', icon: 'car', color: '#1976D2' },
      { name: 'Train', icon: 'train', color: '#3949AB' },
      { name: 'Fuel', icon: 'gas-station', color: '#EF5350' },
      { name: 'Rickshaw', icon: 'rickshaw', color: '#26C6DA' },
      { name: 'Metro', icon: 'subway', color: '#5C6BC0' },
      { name: 'Airplane', icon: 'airplane', color: '#29B6F6' },
      { name: 'Toll', icon: 'cash-multiple', color: '#8D6E63' },
      { name: 'Tramway', icon: 'tram', color: '#7E57C2' },
    ],
  },

  {
    name: 'Leisures',
    icon: 'star',
    color: '#FFCA28',
    type: 'expense',
    subcategories: [
      { name: 'Sports', icon: 'basketball', color: '#FF7043' },
      { name: 'Travels', icon: 'airplane', color: '#29B6F6' },
      { name: 'Movies', icon: 'movie', color: '#AB47BC' },
      { name: 'Snooker', icon: 'billiards', color: '#2E7D32' },
      { name: 'Parks', icon: 'tree', color: '#66BB6A' },
      { name: 'Equipment', icon: 'basket', color: '#8D6E63' },
      { name: 'Hotel', icon: 'bed', color: '#5C6BC0' },
      { name: 'Museums/Exhibitions', icon: 'account-group', color: '#26A69A' },
      { name: 'Books', icon: 'book', color: '#8E24AA' },
      { name: 'Bowling', icon: 'bowling', color: '#EC407A' },
      { name: 'Concerts', icon: 'music', color: '#7E57C2' },
      { name: 'Games', icon: 'controller-classic', color: '#42A5F5' },
      { name: 'IT', icon: 'laptop', color: '#546E7A' },
      { name: 'Night club', icon: 'glass-cocktail', color: '#D81B60' },
      { name: 'Video', icon: 'video', color: '#EF5350' },
    ],
  },

  {
    name: 'Care',
    icon: 'human-male-female',
    color: '#EC407A',
    type: 'expense',
    subcategories: [
      { name: 'Clothing', icon: 'tshirt-crew', color: '#7E57C2' },
      { name: 'Hairdresser', icon: 'content-cut', color: '#F06292' },
      { name: 'Grooming', icon: 'face-woman', color: '#BA68C8' },
      { name: 'Beauty', icon: 'lipstick', color: '#D81B60' },
    ],
  },

  {
    name: 'Housing',
    icon: 'home',
    color: '#8D6E63',
    type: 'expense',
    subcategories: [
      { name: 'Rent', icon: 'home', color: '#6D4C41' },
      { name: 'Mobile Phone', icon: 'cellphone', color: '#42A5F5' },
      { name: 'Furniture', icon: 'sofa', color: '#A1887F' },
      { name: 'Charges', icon: 'cash', color: '#FF7043' },
      { name: 'Decoration', icon: 'image-frame', color: '#CE93D8' },
      { name: 'Electricity', icon: 'flash', color: '#FFD54F' },
      { name: 'Equipment', icon: 'tools', color: '#78909C' },
      { name: 'Garden', icon: 'flower', color: '#66BB6A' },
      { name: 'Gas', icon: 'fire', color: '#EF5350' },
      { name: 'Heating', icon: 'house-thermometer', color: '#FF8A65' },
      { name: 'Hotel', icon: 'bed', color: '#5C6BC0' },
      { name: 'House keeper', icon: 'broom', color: '#B0BEC5' },
      { name: 'Phone', icon: 'phone', color: '#26C6DA' },
      { name: 'TV', icon: 'television', color: '#42A5F5' },
      { name: 'Water', icon: 'water', color: '#29B6F6' },
      { name: 'White goods', icon: 'washing-machine', color: '#90A4AE' },
    ],
  },

  {
    name: 'Supermarket',
    icon: 'cart',
    color: '#66BB6A',
    type: 'expense',
    subcategories: [],
  },

  {
    name: 'Salary',
    icon: 'wallet',
    color: '#43A047',
    type: 'income',
    subcategories: [
      { name: 'Leave allowance', icon: 'wallet-giftcard', color: '#66BB6A' },
      { name: 'Misc. premiums', icon: 'wallet-plus', color: '#81C784' },
      { name: 'Net salary', icon: 'cash', color: '#2E7D32' },
      { name: 'Overtime', icon: 'clock-outline', color: '#4CAF50' },
      { name: 'Success fee', icon: 'trophy', color: '#FFD54F' },
      { name: 'Night allowance', icon: 'weather-night', color: '#7986CB' },
    ],
  },

  {
    name: 'Health',
    icon: 'hospital-box',
    color: '#E53935',
    type: 'expense',
    subcategories: [
      { name: 'Chemist', icon: 'pill', color: '#EF5350' },
      { name: 'Doctor', icon: 'stethoscope', color: '#D32F2F' },
      { name: 'Dentist', icon: 'tooth', color: '#F06292' },
      { name: 'Hospital', icon: 'hospital-building', color: '#C62828' },
      { name: 'Insurance', icon: 'shield-check', color: '#43A047' },
      { name: 'Kinesitherapist', icon: 'human-handsup', color: '#26A69A' },
      { name: 'Ophtalmologist', icon: 'eye', color: '#42A5F5' },
      { name: 'Osteopath', icon: 'human', color: '#8D6E63' },
      { name: 'Social security', icon: 'shield-account', color: '#5C6BC0' },
    ],
  },

  {
    name: 'Holidays',
    icon: 'beach',
    color: '#26C6DA',
    type: 'expense',
    subcategories: [
      { name: 'Travels', icon: 'airplane', color: '#29B6F6' },
      { name: 'Housing', icon: 'home', color: '#8D6E63' },
      { name: 'Visits', icon: 'camera', color: '#AB47BC' },
    ],
  },

  {
    name: 'Transfer',
    icon: 'swap-horizontal',
    color: '#78909C',
    type: 'transfer',
    subcategories: [],
  },

  {
    name: 'Financial expenses',
    icon: 'bank',
    color: '#5D4037',
    type: 'expense',
    subcategories: [{ name: 'Bank charges', icon: 'cash-minus', color: '#8D6E63' }],
  },

  {
    name: 'Charges',
    icon: 'cash',
    color: '#FF7043',
    type: 'expense',
    subcategories: [
      { name: 'Loan/Mortgage', icon: 'home-analytics', color: '#6D4C41' },
      { name: 'Refunding', icon: 'cash-refund', color: '#26A69A' },
      { name: 'Misc. income', icon: 'cash', color: '#66BB6A' },
      { name: 'Cashback', icon: 'cash-plus', color: '#43A047' },
      { name: 'Gifts', icon: 'gift', color: '#EC407A' },
      { name: 'Refunds', icon: 'cash-refund', color: '#26C6DA' },
      { name: 'Second hand sales', icon: 'store', color: '#8D6E63' },
    ],
  },

  {
    name: 'Charity',
    icon: 'hand-heart',
    color: '#F06292',
    type: 'expense',
    subcategories: [],
  },

  {
    name: 'Other income',
    icon: 'cash-multiple',
    color: '#4CAF50',
    type: 'income',
    subcategories: [
      { name: 'Family allowance', icon: 'account-group', color: '#81C784' },
      { name: 'Gambling', icon: 'dice-5', color: '#F44336' },
      { name: 'Mutual insurance', icon: 'shield-check', color: '#43A047' },
      { name: 'Social security', icon: 'shield-account', color: '#5C6BC0' },
      { name: 'Tax credit', icon: 'cash-plus', color: '#66BB6A' },
      { name: 'Unemployment benefit', icon: 'account-cash', color: '#26A69A' },
    ],
  },

  {
    name: 'Retirement',
    icon: 'human-cane',
    color: '#9E9E9E',
    type: 'income',
    subcategories: [
      { name: 'Retirement Fund', icon: 'bank', color: '#BDBDBD' },
      { name: 'Supplementary pension', icon: 'cash-plus', color: '#81C784' },
    ],
  },

  {
    name: 'Investment income',
    icon: 'chart-line',
    color: '#388E3C',
    type: 'income',
    subcategories: [
      { name: 'Capital gain', icon: 'trending-up', color: '#2E7D32' },
      { name: 'Dividend', icon: 'cash', color: '#43A047' },
      { name: 'Interest', icon: 'percent', color: '#66BB6A' },
    ],
  },

  {
    name: 'Pets',
    icon: 'paw',
    color: '#8D6E63',
    type: 'expense',
    subcategories: [
      { name: 'Food', icon: 'bone', color: '#FF7043' },
      { name: 'Grooming', icon: 'shower', color: '#26C6DA' },
      { name: 'Various supplies', icon: 'basket', color: '#A1887F' },
      { name: 'Veterinary surgeon', icon: 'hospital', color: '#E53935' },
    ],
  },

  {
    name: 'Insurance',
    icon: 'shield',
    color: '#43A047',
    type: 'expense',
    subcategories: [
      { name: 'Car', icon: 'car', color: '#1E88E5' },
      { name: 'Civil liability', icon: 'scale-balance', color: '#8D6E63' },
      { name: 'Health', icon: 'hospital-box', color: '#E53935' },
      { name: 'House', icon: 'home', color: '#6D4C41' },
      { name: 'Life', icon: 'heart', color: '#D81B60' },
    ],
  },

  {
    name: 'Car',
    icon: 'car',
    color: '#1E88E5',
    type: 'expense',
    subcategories: [
      { name: 'Fines', icon: 'alert-circle', color: '#E53935' },
      { name: 'Fuel', icon: 'gas-station', color: '#EF5350' },
      { name: 'Maintenance', icon: 'wrench', color: '#78909C' },
      { name: 'Parking', icon: 'parking', color: '#5C6BC0' },
      { name: 'Repairs', icon: 'tools', color: '#546E7A' },
    ],
  },

  {
    name: 'Children',
    icon: 'baby-face',
    color: '#F48FB1',
    type: 'expense',
    subcategories: [
      { name: 'Nurse', icon: 'account-child', color: '#CE93D8' },
      { name: 'Studies', icon: 'school', color: '#42A5F5' },
    ],
  },

  {
    name: 'Studies',
    icon: 'school',
    color: '#42A5F5',
    type: 'expense',
    subcategories: [
      { name: 'Books', icon: 'book', color: '#8E24AA' },
      { name: 'Lessons', icon: 'human-male-board', color: '#26A69A' },
      { name: 'School fees', icon: 'cash', color: '#66BB6A' },
    ],
  },

  {
    name: 'Professional expenses',
    icon: 'briefcase',
    color: '#607D8B',
    type: 'expense',
    subcategories: [
      { name: 'Non refundable', icon: 'cash-minus', color: '#EF5350' },
      { name: 'Refundable', icon: 'cash-refund', color: '#26A69A' },
    ],
  },

  {
    name: 'Taxes',
    icon: 'file-document',
    color: '#B71C1C',
    type: 'expense',
    subcategories: [
      { name: 'Income tax', icon: 'cash-multiple', color: '#C62828' },
      { name: 'Land tax', icon: 'home', color: '#8D6E63' },
    ],
  },
];
