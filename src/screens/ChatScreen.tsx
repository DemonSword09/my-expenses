import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    Text,
    KeyboardAvoidingView,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

import useTheme from '../hooks/useTheme';
import { useChatAgent } from '../hooks/useChatAgent';
import { ChatMessage } from '../services/ChatService';
import { ConversationContext } from '../services/chat/ConversationContext';
import SimpleMarkdown from '../components/SimpleMarkdown';

export default function ChatScreen() {
    const { schemeColors, globalStyle, chatStyle, chatScreenStyle } = useTheme();
    const navigation = useNavigation();
    const { messages, sendMessage, isTyping } = useChatAgent();
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
            setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
            setKeyboardVisible(false)
        );
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
            ConversationContext.reset();
        };
    }, []);

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
    }, [messages, isKeyboardVisible]);

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';
        const textColor = isUser ? '#ffffff' : schemeColors.text;

        return (
            <View
                style={[
                    chatStyle.messageContainer,
                    isUser
                        ? chatStyle.userMessageContainer
                        : chatStyle.botMessageContainer,
                ]}
            >
                <View
                    style={[
                        chatStyle.bubble,
                        isUser
                            ? { backgroundColor: schemeColors.primary }
                            : { backgroundColor: schemeColors.glassBg },
                    ]}
                >
                    {isUser ? (
                        <Text
                            selectable={true}
                            style={[chatStyle.messageText, { color: textColor }]}
                        >
                            {item.text}
                        </Text>
                    ) : (
                        <SimpleMarkdown
                            text={item.text}
                            format={item.format || 'PLAIN'}
                            baseStyle={{ ...chatStyle.messageText, color: textColor }}
                            boldColor={schemeColors.primary}
                        />
                    )}
                </View>
                <Text style={chatStyle.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={chatScreenStyle.keyboardView}
            behavior="padding"
            keyboardVerticalOffset={isKeyboardVisible ? 0 : 40}
        >
            <SafeAreaView
                style={[globalStyle.container, { flex: 1 }]}
                edges={['top', 'left', 'right', 'bottom']}
            >
                <StatusBar style="auto" />

                <View style={chatScreenStyle.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={chatScreenStyle.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={schemeColors.text} />
                    </TouchableOpacity>
                    <Text style={chatScreenStyle.headerTitle}>Expense Assistant</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={chatStyle.listContent}
                    style={{ flex: 1 }}
                />

                {isTyping && (
                    <View style={chatScreenStyle.typingIndicator}>
                        <Text style={chatScreenStyle.typingText}>Agent is typing...</Text>
                    </View>
                )}

                <View style={[chatStyle.inputContainer, { backgroundColor: 'transparent' }]}>
                    <BlurView intensity={80} tint="dark" style={chatStyle.pillContainer}>
                        <TextInput
                            style={chatStyle.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a command..."
                            placeholderTextColor={schemeColors.textMuted}
                            onSubmitEditing={handleSend}
                            selectionColor={schemeColors.primary}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            style={[
                                chatStyle.sendButton,
                                {
                                    backgroundColor: inputText.trim()
                                        ? schemeColors.primary
                                        : 'rgba(255,255,255,0.1)',
                                },
                            ]}
                        >
                            <Ionicons name="arrow-up" size={24} color={'#ffffff'} />
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
