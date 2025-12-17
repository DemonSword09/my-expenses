export const CATEGORY_SEED = [
  {
    name: 'Food',
    icon: 'food-fork-drink',
    type: 'expense',
    subcategories: [
      { name: 'Tea', icon: 'cup' },
      { name: 'Canteen', icon: 'silverware-fork-knife' },
      { name: 'Street', icon: 'food' },
      { name: 'Drinks', icon: 'glass-cocktail' },
      { name: 'Grocery', icon: 'cart' },
      { name: 'Restaurant', icon: 'food-steak' },
      { name: 'Sweets', icon: 'cookie' },
      { name: 'Bar', icon: 'beer' },
      { name: 'Baker', icon: 'bread-slice' },
      { name: 'Self-service', icon: 'food' },
    ],
  },

  {
    name: 'Transport',
    icon: 'car',
    type: 'expense',
    subcategories: [
      { name: 'Bus', icon: 'bus' },
      { name: 'Car', icon: 'car' },
      { name: 'Train', icon: 'train' },
      { name: 'Fuel', icon: 'gas-station' },
      { name: 'Rickshaw', icon: 'rickshaw' },
      { name: 'Metro', icon: 'subway' },
      { name: 'Airplane', icon: 'airplane' },
      { name: 'Toll', icon: 'cash-multiple' },
      { name: 'Tramway', icon: 'tram' },
    ],
  },

  {
    name: 'Leisures',
    icon: 'star',
    type: 'expense',
    subcategories: [
      { name: 'Sports', icon: 'basketball' },
      { name: 'Travels', icon: 'airplane' },
      { name: 'Movies', icon: 'movie' },
      { name: 'Snooker', icon: 'billiards' },
      { name: 'Parks', icon: 'tree' },
      { name: 'Equipment', icon: 'basket' },
      { name: 'Hotel', icon: 'bed' },
      { name: 'Museums/Exhibitions', icon: 'account-group' },
      { name: 'Books', icon: 'book' },
      { name: 'Bowling', icon: 'bowling' },
      { name: 'Concerts', icon: 'music' },
      { name: 'Games', icon: 'controller-classic' },
      { name: 'IT', icon: 'laptop' },
      { name: 'Night club', icon: 'glass-cocktail' },
      { name: 'Video', icon: 'video' },
    ],
  },

  {
    name: 'Care',
    icon: 'human-male-female',
    type: 'expense',
    subcategories: [
      { name: 'Clothing', icon: 'tshirt-crew' },
      { name: 'Hairdresser', icon: 'content-cut' },
      { name: 'Grooming', icon: 'face-woman' },
      { name: 'Beauty', icon: 'lipstick' },
    ],
  },

  {
    name: 'Housing',
    icon: 'home',
    type: 'expense',
    subcategories: [
      { name: 'Rent', icon: 'home' },
      { name: 'Mobile Phone', icon: 'cellphone' },
      { name: 'Furniture', icon: 'sofa' },
      { name: 'Charges', icon: 'cash' },
      { name: 'Decoration', icon: 'image-frame' },
      { name: 'Electricity', icon: 'flash' },
      { name: 'Equipment', icon: 'tools' },
      { name: 'Garden', icon: 'flower' },
      { name: 'Gas', icon: 'fire' },
      { name: 'Heating', icon: 'fire' },
      { name: 'Hotel', icon: 'bed' },
      { name: 'House keeper', icon: 'broom' },
      { name: 'Phone', icon: 'phone' },
      { name: 'TV', icon: 'television' },
      { name: 'Water', icon: 'water' },
      { name: 'White goods', icon: 'washing-machine' },
    ],
  },

  {
    name: 'Supermarket',
    icon: 'cart',
    type: 'expense',
    subcategories: [],
  },

  {
    name: 'Salary',
    icon: 'wallet',
    type: 'income',
    subcategories: [
      { name: 'Leave allowance', icon: 'wallet-giftcard' },
      { name: 'Misc. premiums', icon: 'wallet-plus' },
      { name: 'Net salary', icon: 'cash' },
      { name: 'Overtime', icon: 'clock-outline' },
      { name: 'Success fee', icon: 'trophy' },
      { name: 'Night allowance', icon: 'weather-night' },
    ],
  },

  {
    name: 'Health',
    icon: 'hospital-box',
    type: 'expense',
    subcategories: [
      { name: 'Chemist', icon: 'pill' },
      { name: 'Doctor', icon: 'stethoscope' },
      { name: 'Dentist', icon: 'tooth' },
      { name: 'Hospital', icon: 'hospital-building' },
      { name: 'Insurance', icon: 'shield-check' },
      { name: 'Kinesitherapist', icon: 'human-handsup' },
      { name: 'Ophtalmologist', icon: 'eye' },
      { name: 'Osteopath', icon: 'human' },
      { name: 'Social security', icon: 'shield-account' },
    ],
  },

  {
    name: 'Holidays',
    icon: 'beach',
    type: 'expense',
    subcategories: [
      { name: 'Travels', icon: 'airplane' },
      { name: 'Housing', icon: 'home' },
      { name: 'Visits', icon: 'camera' },
    ],
  },

  {
    name: 'Transfer',
    icon: 'swap-horizontal',
    type: 'transfer',
    subcategories: [],
  },

  {
    name: 'Financial expenses',
    icon: 'bank',
    type: 'expense',
    subcategories: [{ name: 'Bank charges', icon: 'cash-minus' }],
  },

  {
    name: 'Charges',
    icon: 'cash',
    type: 'expense',
    subcategories: [
      { name: 'Loan/Mortgage', icon: 'home-analytics' },
      { name: 'Refunding', icon: 'cash-refund' },
      { name: 'Misc. income', icon: 'cash' },
      { name: 'Cashback', icon: 'cash-plus' },
      { name: 'Gifts', icon: 'gift' },
      { name: 'Refunds', icon: 'cash-refund' },
      { name: 'Second hand sales', icon: 'store' },
    ],
  },

  {
    name: 'Charity',
    icon: 'hand-heart',
    type: 'expense',
    subcategories: [],
  },

  {
    name: 'Other income',
    icon: 'cash-multiple',
    type: 'income',
    subcategories: [
      { name: 'Family allowance', icon: 'account-group' },
      { name: 'Gambling', icon: 'dice-5' },
      { name: 'Mutual insurance', icon: 'shield-check' },
      { name: 'Social security', icon: 'shield-account' },
      { name: 'Tax credit', icon: 'cash-plus' },
      { name: 'Unemployment benefit', icon: 'account-cash' },
    ],
  },

  {
    name: 'Retirement',
    icon: 'human-cane',
    type: 'income',
    subcategories: [
      { name: 'Retirement Fund', icon: 'bank' },
      { name: 'Supplementary pension', icon: 'cash-plus' },
    ],
  },

  {
    name: 'Investment income',
    icon: 'chart-line',
    type: 'income',
    subcategories: [
      { name: 'Capital gain', icon: 'trending-up' },
      { name: 'Dividend', icon: 'cash' },
      { name: 'Interest', icon: 'percent' },
    ],
  },

  {
    name: 'Pets',
    icon: 'paw',
    type: 'expense',
    subcategories: [
      { name: 'Food', icon: 'bone' },
      { name: 'Grooming', icon: 'shower' },
      { name: 'Various supplies', icon: 'basket' },
      { name: 'Veterinary surgeon', icon: 'hospital' },
    ],
  },

  {
    name: 'Insurance',
    icon: 'shield',
    type: 'expense',
    subcategories: [
      { name: 'Car', icon: 'car' },
      { name: 'Civil liability', icon: 'scale-balance' },
      { name: 'Health', icon: 'hospital-box' },
      { name: 'House', icon: 'home' },
      { name: 'Life', icon: 'heart' },
    ],
  },

  {
    name: 'Car',
    icon: 'car',
    type: 'expense',
    subcategories: [
      { name: 'Fines', icon: 'alert-circle' },
      { name: 'Fuel', icon: 'gas-station' },
      { name: 'Maintenance', icon: 'wrench' },
      { name: 'Parking', icon: 'parking' },
      { name: 'Repairs', icon: 'tools' },
    ],
  },

  {
    name: 'Children',
    icon: 'baby-face',
    type: 'expense',
    subcategories: [
      { name: 'Nurse', icon: 'account-child' },
      { name: 'Studies', icon: 'school' },
    ],
  },

  {
    name: 'Studies',
    icon: 'school',
    type: 'expense',
    subcategories: [
      { name: 'Books', icon: 'book' },
      { name: 'Lessons', icon: 'human-male-board' },
      { name: 'School fees', icon: 'cash' },
    ],
  },

  {
    name: 'Professional expenses',
    icon: 'briefcase',
    type: 'expense',
    subcategories: [
      { name: 'Non refundable', icon: 'cash-minus' },
      { name: 'Refundable', icon: 'cash-refund' },
    ],
  },

  {
    name: 'Taxes',
    icon: 'file-document',
    type: 'expense',
    subcategories: [
      { name: 'Income tax', icon: 'cash-multiple' },
      { name: 'Land tax', icon: 'home' },
    ],
  },
];
