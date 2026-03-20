import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Backend API Service for Chat
 * Connects to the NEXUS FastAPI backend for complete RAG interactions.
 */

const API_BASE_URL = 'http://localhost:8000/api';

class ChatService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Check if the backend is running and accessible
     */
    async checkConnection() {
        try {
            const token = useAuthStore.getState().token;
            // Hit root to see if backend is alive
            await axios.get('http://localhost:8000/');

            // Try to get models via backend if possible, or fallback
            try {
                const response = await axios.get(`${this.baseURL}/meta/models`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return { connected: true, models: response.data || [] };
            } catch (e) {
                // Return default models if backend metadata endpoint not fully ready
                return {
                    connected: true,
                    models: [{ name: "mistral", size: 4100000000 }, { name: "llama3", size: 4700000000 }]
                };
            }

        } catch (error) {
            console.error('Backend connection error:', error);
            return { connected: false, models: [], error: error.message };
        }
    }

    /**
     * Generate a chat completion (streaming) via backend RAG
     */
    async chat(model, messages, onChunk) {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${this.baseURL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Backend API error: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message && data.message.content !== undefined) {
                            fullResponse += data.message.content;
                            if (onChunk) {
                                onChunk(data.message.content, fullResponse, data.done);
                            }
                        }
                        if (data.done) return fullResponse;
                    } catch (e) {
                        // Handle potential partial JSON
                    }
                }
            }

            return fullResponse;
        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }

    /**
     * Generate a non-streaming completion via backend
     */
    async chatNonStreaming(model, messages) {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.post(`${this.baseURL}/chat/message`, {
                model,
                messages,
                stream: false,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data.message.content;
        } catch (error) {
            console.error('Chat error:', error);
            throw new Error('Failed to get response from backend');
        }
    }
}

export const ollamaService = new ChatService();
export default ollamaService;
