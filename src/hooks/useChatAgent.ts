// src/hooks/useChatAgent.ts
import { useState, useCallback } from 'react';
import { ChatService, ChatMessage, ResponseFormat } from '../services/ChatService';
import { uuidSync } from '../utils/uuid';

export function useChatAgent() {
    const welcomeResponse = ChatService.getWelcomeMessage();

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: welcomeResponse.text,
            format: welcomeResponse.format,
            sender: 'bot',
            timestamp: Date.now(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: uuidSync(),
            text,
            format: 'PLAIN' as ResponseFormat,
            sender: 'user',
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const response = await ChatService.processMessage(text);

            // Skip empty responses (superseded jobs)
            if (!response.text) {
                setIsTyping(false);
                return;
            }

            const botMsg: ChatMessage = {
                id: uuidSync(),
                text: response.text,
                format: response.format,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Chat error", err);
            const botMsg: ChatMessage = {
                id: uuidSync(),
                text: "Oops! 😅 Something went wrong. Let me try that again...",
                format: 'PLAIN',
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setIsTyping(false);
        }
    }, []);

    return {
        messages,
        sendMessage,
        isTyping
    };
}
