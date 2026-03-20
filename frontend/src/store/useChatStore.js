import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Chat Store - Manages chat conversations and state
 */
const useChatStore = create(
    persist(
        (set, get) => ({
            // State
            conversations: [],
            currentConversationId: null,
            selectedModel: 'mistral',
            isStreaming: false,
            ollamaConnected: false,
            availableModels: [],

            // Actions
            setOllamaConnected: (connected) => set({ ollamaConnected: connected }),

            setAvailableModels: (models) => set({ availableModels: models }),

            setSelectedModel: (model) => set({ selectedModel: model }),

            createConversation: (title = 'New Chat') => {
                const newConversation = {
                    id: Date.now().toString(),
                    title,
                    messages: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                set((state) => ({
                    conversations: [newConversation, ...state.conversations],
                    currentConversationId: newConversation.id,
                }));

                return newConversation.id;
            },

            selectConversation: (conversationId) => {
                set({ currentConversationId: conversationId });
            },

            deleteConversation: (conversationId) => {
                set((state) => ({
                    conversations: state.conversations.filter((c) => c.id !== conversationId),
                    currentConversationId:
                        state.currentConversationId === conversationId
                            ? null
                            : state.currentConversationId,
                }));
            },

            renameConversation: (conversationId, newTitle) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === conversationId
                            ? { ...c, title: newTitle, updatedAt: new Date().toISOString() }
                            : c
                    ),
                }));
            },

            addMessage: (conversationId, role, content) => {
                const message = {
                    id: Date.now().toString() + Math.random(),
                    role, // 'user' or 'assistant'
                    content,
                    timestamp: new Date().toISOString(),
                };

                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === conversationId
                            ? {
                                ...c,
                                messages: [...c.messages, message],
                                updatedAt: new Date().toISOString(),
                            }
                            : c
                    ),
                }));

                return message;
            },

            updateLastMessage: (conversationId, content) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === conversationId
                            ? {
                                ...c,
                                messages: c.messages.map((msg, idx) =>
                                    idx === c.messages.length - 1 ? { ...msg, content } : msg
                                ),
                                updatedAt: new Date().toISOString(),
                            }
                            : c
                    ),
                }));
            },

            setStreaming: (isStreaming) => set({ isStreaming }),

            getCurrentConversation: () => {
                const state = get();
                return state.conversations.find(
                    (c) => c.id === state.currentConversationId
                );
            },

            clearAllConversations: () => {
                set({ conversations: [], currentConversationId: null });
            },
        }),
        {
            name: 'nexus-chat-storage',
            partialize: (state) => ({
                conversations: state.conversations,
                currentConversationId: state.currentConversationId,
                selectedModel: state.selectedModel,
            }),
        }
    )
);

export default useChatStore;
