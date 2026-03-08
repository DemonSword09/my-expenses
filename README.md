# My Expenses

A powerful, offline-first personal finance tracker built with React Native and Expo. Track your daily expenses, manage recurring payments, and analyze your spending habits with ease.

## 🚀 Features

- **💸 Expense Tracking**: Log income and expenses with detailed metadata (payee, category, account, notes).
- **🔄 Recurring Transactions**: Flexible recurrence engine for daily, weekly, monthly, or custom schedules.
- **📂 Categorization**: Hierarchical categories with custom icons and colors.
- **📥 CSV Import**: Import bank statements to quickly populate your transaction history.
- **🌓 Dynamic Theming**: Automatic Dark/Light mode support based on system settings.
- **🔒 Offline First**: All data is stored locally using SQLite for privacy and speed.
- **🛡️ Type Safe**: Built with TypeScript for robustness.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (via [Expo](https://expo.dev/))
- **Database**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [React Native Paper](https://callstack.github.io/react-native-paper/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Yarn](https://yarnpkg.com/) or npm
- [Expo Go](https://expo.dev/client) app on your mobile device (Android/iOS)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd my-expenses
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    # or
    npm install
    ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

- **Scan the QR code** with the **Expo Go** app on your phone.
- Press `a` to open in an **Android Emulator**.
- Press `i` to open in an **iOS Simulator** (macOS only).
- Press `w` to run in a **Web Browser**.

## 📜 Scripts

- `yarn start`: Start the dev server.
- `yarn android`: Run on Android emulator/device.
- `yarn ios`: Run on iOS simulator/device.
- `yarn lint`: Run ESLint.
- `yarn typecheck`: Run TypeScript compiler check.
- `yarn test`: Run Jest tests.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
