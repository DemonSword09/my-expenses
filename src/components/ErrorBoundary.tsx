import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { Logger } from '../utils/Logger';

import useTheme from '../hooks/useTheme';
interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Wrapper to inject theme hooks
export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
    const { schemeColors, errorStyle } = useTheme();
    const styles = errorStyle;
    return <ErrorBoundaryInner styles={styles}>{children}</ErrorBoundaryInner>;
}

// Inner Class Component to handle lifecycle
class ErrorBoundaryInner extends Component<{ children: ReactNode; styles: any }, State> {
    constructor(props: { children: ReactNode; styles: any }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        Logger.error('ErrorBoundary caught error', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { styles } = this.props;
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>
                        An unexpected error occurred. We have logged this issue.
                    </Text>

                    <ScrollView style={styles.errorBox}>
                        <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                        <Button
                            mode="outlined"
                            onPress={() => Logger.shareLogs()}
                            style={[styles.button, { flex: 1 }]}
                        >
                            Share Logs
                        </Button>
                        <Button
                            mode="contained"
                            onPress={this.handleRestart}
                            style={[styles.button, { flex: 1 }]}
                        >
                            Try Again
                        </Button>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}
