# My Expenses

> **v0.0.2-beta** · Android · Offline-First

A powerful, offline-first personal finance tracker built with React Native and Expo. Track your daily expenses, manage recurring payments, query your data with natural language, and analyze your spending habits — all without an internet connection.

## 🚀 Features

- **💸 Expense Tracking**: Log income and expenses with detailed metadata (payee, category, account, notes).
- **🤖 AI Chat**: Ask natural language questions about your finances — powered by an on-device ONNX model with intent classification and slot extraction. No cloud required.
- **🔄 Recurring Transactions**: Flexible recurrence engine for daily, weekly, monthly, or custom cron-based schedules with auto-generation.
- **📂 Categorization**: Hierarchical categories with custom icons and colors.
- **🏪 Merchant Management**: Track and manage payees/merchants across transactions.
- **📋 Templates**: Save and reuse transaction templates for quick entry.
- **📊 Distribution Analytics**: Visualize spending breakdowns by category with interactive charts.
- **🔍 Filters**: Powerful filtering by date range, category, type, and more.
- **📥 CSV Import**: Import bank statements with smart column mapping and date format auto-detection.
- **📤 Export**: Export your transaction data for backup or sharing.
- **🌓 Dynamic Theming**: Automatic Dark/Light mode support based on system settings.
- **🔒 Offline First**: All data is stored locally using SQLite — no account needed, your data never leaves your device.
- **🛡️ Type Safe**: Built with TypeScript for robustness.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.81 (via [Expo](https://expo.dev/) SDK 54)
- **Database**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [React Native Paper](https://callstack.github.io/react-native-paper/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **ML Inference**: [ONNX Runtime](https://onnxruntime.ai/) (React Native)
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Yarn](https://yarnpkg.com/) or npm
- Android SDK (for native builds)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/DemonSword09/my-expenses.git
    cd my-expenses
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the App

Start the development server:

```bash
npx expo start
```

- Press `a` to open in an **Android Emulator** or connected device.
- Press `i` to open in an **iOS Simulator** (macOS only).

> **Note:** This app uses native modules (ONNX Runtime) and requires a development build — it does not run in Expo Go.

## 📜 Scripts

- `npm start`: Start the dev server.
- `npm run android`: Run on Android emulator/device.
- `npm run ios`: Run on iOS simulator/device.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: Run TypeScript compiler check.
- `npm test`: Run Jest tests.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
