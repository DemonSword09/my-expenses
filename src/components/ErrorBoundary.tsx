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

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.danger,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorBox: {
        maxHeight: 200,
        width: '100%',
        backgroundColor: colors.surface,
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    errorText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: colors.text,
    },
    button: {
        width: '100%',
        backgroundColor: colors.primary,
    }
});

// Wrapper to inject theme hooks
export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
    const { schemeColors } = useTheme();
    const styles = getStyles(schemeColors);
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

                    <Button
                        mode="contained"
                        onPress={this.handleRestart}
                        style={styles.button}
                    >
                        Try Again
                    </Button>
                </View>
            );
        }

        return this.props.children;
    }
}
