import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { useChatAgent } from '../hooks/useChatAgent';
import { ChatMessage } from '../services/ChatService';
import { useNavigation } from '@react-navigation/native';

export default function ChatScreen() {
    const { schemeColors, globalStyle } = useTheme();
    const navigation = useNavigation();
    const { messages, sendMessage, isTyping } = useChatAgent();
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.botMessageContainer
            ]}>
                <View style={[
                    styles.bubble,
                    isUser ? { backgroundColor: schemeColors.primary } : { backgroundColor: schemeColors.glassBg }
                ]}>
                    <Text
                        selectable={true}
                        style={[
                            styles.messageText,
                            isUser ? { color: '#ffffff' } : { color: schemeColors.text }
                        ]}>
                        {item.text}
                    </Text>
                </View>
                <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View >
        );
    };

    return (
        <SafeAreaView style={[globalStyle.container]} edges={['top', 'left', 'right']}>
            <StatusBar style="auto" />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: schemeColors.divider }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={schemeColors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '600', marginLeft: 16, color: schemeColors.text }}>Expense Assistant</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // ~ Header height + Status bar
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    style={{ flex: 1 }}
                />

                {isTyping && (
                    <View style={{ padding: 10, marginLeft: 10 }}>
                        <Text style={{ color: schemeColors.textMuted }}>Agent is typing...</Text>
                    </View>
                )}

                <View style={[styles.inputContainer, { backgroundColor: schemeColors.surface, borderTopColor: schemeColors.divider }]}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: schemeColors.background,
                            color: schemeColors.text,
                            borderColor: schemeColors.divider,
                            borderWidth: 1
                        }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a command..."
                        placeholderTextColor={schemeColors.textMuted}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        style={[styles.sendButton, { backgroundColor: inputText.trim() ? schemeColors.primary : schemeColors.surface }]}
                    >
                        <Ionicons name="send" size={20} color={inputText.trim() ? '#ffffff' : schemeColors.textMuted} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    botMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        marginHorizontal: 4
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        fontSize: 16,
        marginRight: 10,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
