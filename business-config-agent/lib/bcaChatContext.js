import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'agentic-config-flow-chats';
const SETTINGS_KEY = 'agentic-config-flow-settings';

const generateId = () => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const loadFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { chats: [], currentChatId: null };
    } catch {
        return { chats: [], currentChatId: null };
    }
};

const saveToStorage = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
};

const loadSettings = () => {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { model: '', temperature: 0.3, activeInputFolder: '', attachedPaths: [] };
        return JSON.parse(raw);
    } catch {
        return { model: '', temperature: 0.3, activeInputFolder: '', attachedPaths: [] };
    }
};

const saveSettings = (data) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch {}
};

const BcaChatContext = createContext(null);

export function BcaChatProvider({ children }) {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState('');
    const [temperature, setTemperature] = useState(0.3);
    const [activeInputFolder, setActiveInputFolder] = useState('');
    const [attachedPaths, setAttachedPaths] = useState([]);
    const [toolActivities, setToolActivities] = useState([]);
    const [streamingContent, setStreamingContent] = useState('');
    const [lastUsage, setLastUsage] = useState(null);
    const [artifactRefreshKey, setArtifactRefreshKey] = useState(0);

    const bumpArtifacts = useCallback(() => setArtifactRefreshKey(k => k + 1), []);

    useEffect(() => {
        const data = loadFromStorage();
        setChats(data.chats);
        if (data.currentChatId && data.chats.find(c => c.id === data.currentChatId)) {
            setCurrentChatId(data.currentChatId);
            const chat = data.chats.find(c => c.id === data.currentChatId);
            setCurrentMessages(chat?.messages || []);
        }
        const settings = loadSettings();
        setModel(settings.model || '');
        setTemperature(settings.temperature ?? 0.3);
        setActiveInputFolder(settings.activeInputFolder || '');
        setAttachedPaths(settings.attachedPaths || []);
    }, []);

    useEffect(() => {
        saveToStorage({ chats, currentChatId });
    }, [chats, currentChatId]);

    useEffect(() => {
        saveSettings({ model, temperature, activeInputFolder, attachedPaths });
    }, [model, temperature, activeInputFolder, attachedPaths]);

    const resetRunState = useCallback(() => {
        setToolActivities([]);
        setStreamingContent('');
        setLastUsage(null);
    }, []);

    const createNewChat = useCallback(() => {
        const newChat = {
            id: generateId(),
            title: 'New session',
            createdAt: new Date().toISOString(),
            messages: [],
            activeInputFolder: activeInputFolder || '',
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setCurrentMessages([]);
        resetRunState();
        return newChat.id;
    }, [activeInputFolder, resetRunState]);

    const selectChat = useCallback((chatId) => {
        setCurrentChatId(chatId);
        const chat = chats.find(c => c.id === chatId);
        setCurrentMessages(chat?.messages || []);
        if (chat?.activeInputFolder) setActiveInputFolder(chat.activeInputFolder);
        resetRunState();
    }, [chats, resetRunState]);

    const deleteChat = useCallback((chatId) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
            setCurrentChatId(null);
            setCurrentMessages([]);
            resetRunState();
        }
    }, [currentChatId, resetRunState]);

    const updateCurrentMessages = useCallback((updater) => {
        setCurrentMessages(prev => {
            const newMessages = typeof updater === 'function' ? updater(prev) : updater;
            setChats(chats => chats.map(chat => {
                if (chat.id === currentChatId) {
                    const firstUserMsg = newMessages.find(m => m.role === 'user');
                    const title = firstUserMsg
                        ? firstUserMsg.content.slice(0, 42) + (firstUserMsg.content.length > 42 ? '…' : '')
                        : chat.title;
                    return {
                        ...chat,
                        messages: newMessages,
                        title,
                        activeInputFolder: activeInputFolder || chat.activeInputFolder,
                    };
                }
                return chat;
            }));
            return newMessages;
        });
    }, [currentChatId, activeInputFolder]);

    const setActiveInputFolderPersisted = useCallback((folder) => {
        setActiveInputFolder(folder);
        setChats(prev => prev.map(chat =>
            chat.id === currentChatId ? { ...chat, activeInputFolder: folder } : chat
        ));
    }, [currentChatId]);

    const clearCurrentChat = useCallback(() => {
        setCurrentMessages([]);
        setChats(prev => prev.map(chat =>
            chat.id === currentChatId ? { ...chat, messages: [], title: 'New session' } : chat
        ));
        resetRunState();
    }, [currentChatId, resetRunState]);

    const exportCurrentChat = useCallback(() => {
        const blob = new Blob(
            [JSON.stringify({ messages: currentMessages, model, temperature, exportedAt: new Date().toISOString() }, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agentic-config-flow-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [currentMessages, model, temperature]);

    const value = {
        chats,
        currentChatId,
        currentMessages,
        isLoading,
        setIsLoading,
        model,
        setModel,
        temperature,
        setTemperature,
        activeInputFolder,
        setActiveInputFolder: setActiveInputFolderPersisted,
        attachedPaths,
        setAttachedPaths,
        toolActivities,
        setToolActivities,
        streamingContent,
        setStreamingContent,
        lastUsage,
        setLastUsage,
        artifactRefreshKey,
        bumpArtifacts,
        createNewChat,
        selectChat,
        deleteChat,
        updateCurrentMessages,
        clearCurrentChat,
        exportCurrentChat,
        resetRunState,
    };

    return (
        <BcaChatContext.Provider value={value}>
            {children}
        </BcaChatContext.Provider>
    );
}

export function useBcaChat() {
    const context = useContext(BcaChatContext);
    if (!context) throw new Error('useBcaChat must be used within a BcaChatProvider');
    return context;
}
