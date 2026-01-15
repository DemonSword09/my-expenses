// src/hooks/useChatAgent.ts
import { useState, useCallback } from 'react';
import { ChatService, ChatMessage } from '../services/ChatService';
import { uuidSync } from '../utils/uuid';

export function useChatAgent() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: "Hi! I'm your Expense Agent. You can ask me to 'list all categories', 'show top expenses', or add a transaction like 'Lunch for 20'.",
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
            sender: 'user',
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const responseText = await ChatService.processMessage(text);
            const botMsg: ChatMessage = {
                id: uuidSync(),
                text: responseText,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Chat error", err);
            const botMsg: ChatMessage = {
                id: uuidSync(),
                text: "Sorry, I encountered an error processing that request.",
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
