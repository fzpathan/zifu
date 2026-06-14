import { useRef, useEffect, useCallback, useState } from 'react';
import { Bot, ChevronDown, FileSearch, ShieldCheck, BarChart3, FileText } from 'lucide-react';
import BcaMessageBubble from './BcaMessageBubble';
import MarkdownRenderer from '../../config-assistant/components/MarkdownRenderer';
import BcaMessageInput from './BcaMessageInput';
import AttachedFilesBar from './AttachedFilesBar';
import ToolActivityPanel from './ToolActivityPanel';
import { useBcaChat } from '../lib/bcaChatContext';
import { buildHelpText } from '../lib/slashCommands';
import { CHAT_MAX_WIDTH } from '../lib/layout';
import { useUser } from '../../../contexts/UserContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const PROMPT_SUGGESTIONS = [
    { Icon: FileSearch, text: 'Inspect the input files and summarise available datasets', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { Icon: ShieldCheck, text: 'Validate transform config against sample input data', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { Icon: BarChart3, text: 'Profile the main data file and highlight quality issues', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { Icon: FileText, text: 'Generate a config analysis report for the active input folder', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
];

const assistantCardStyle = {
    display: 'flex', gap: '14px', padding: '18px 20px', marginBottom: '10px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '14px',
    border: '1px solid rgba(99,102,241,0.15)',
    boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
};

export default function BcaChatArea() {
    const { currentUser } = useUser();
    const {
        currentMessages,
        currentChatId,
        isLoading,
        setIsLoading,
        model,
        temperature,
        activeInputFolder,
        attachedPaths,
        toolActivities,
        setToolActivities,
        streamingContent,
        setStreamingContent,
        lastUsage,
        setLastUsage,
        updateCurrentMessages,
        createNewChat,
        clearCurrentChat,
        resetRunState,
        bumpArtifacts,
    } = useBcaChat();

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [dynamicCommands, setDynamicCommands] = useState([]);

    const authHeaders = useCallback(() => {
        const headers = { 'Content-Type': 'application/json' };
        if (currentUser?.id) headers.Authorization = `Bearer ${currentUser.id}`;
        return headers;
    }, [currentUser]);

    useEffect(() => {
        const url = new URL(`${API_BASE_URL}/api/bca/input-skills`);
        if (activeInputFolder) url.searchParams.set('folder', activeInputFolder);
        fetch(url.toString(), { headers: authHeaders() })
            .then(r => r.ok ? r.json() : { skills: [] })
            .then(data => setDynamicCommands(data.skills || []))
            .catch(() => setDynamicCommands([]));
    }, [activeInputFolder, authHeaders]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, streamingContent, toolActivities]);

    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    }, []);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const streamRequest = useCallback(async (chatId, messages) => {
        abortControllerRef.current = new AbortController();
        resetRunState();
        setStreamingContent('');

        let accumulatedContent = '';
        const toolCards = [];

        try {
            const response = await fetch(`${API_BASE_URL}/api/bca/chat`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    conversation_id: chatId,
                    model: model || undefined,
                    temperature,
                    messages: messages.filter(m => m.role !== 'error').map(m => ({ role: m.role, content: m.content })),
                    active_input_folder: activeInputFolder || null,
                    attached_paths: attachedPaths,
                    environment: 'dev',
                }),
                signal: abortControllerRef.current.signal,
            });

            if (response.status === 403) {
                throw new Error('Access denied — admin permission required for Agentic Config Flow.');
            }
            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                throw new Error(errText || `HTTP error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    let data;
                    try { data = JSON.parse(line.slice(6)); } catch { continue; }

                    const type = data.type;

                    if (type === 'tool_call_start') {
                        toolCards.push({ name: data.name, call_id: data.call_id, status: 'running' });
                        setToolActivities(prev => [...prev, {
                            call_id: data.call_id,
                            name: data.name,
                            label: data.tool_label || data.name,
                            status: 'running',
                        }]);
                    } else if (type === 'tool_call_complete') {
                        const card = toolCards.find(t => t.call_id === data.call_id);
                        if (card) card.status = data.success ? 'ok' : 'failed';
                        setToolActivities(prev => prev.map(t =>
                            t.call_id === data.call_id
                                ? {
                                    ...t,
                                    status: data.success ? 'success' : 'error',
                                    output: data.output,
                                    error: data.error,
                                }
                                : t
                        ));
                    } else if (type === 'message') {
                        accumulatedContent += data.content || '';
                        setStreamingContent(accumulatedContent);
                    } else if (type === 'error') {
                        throw new Error(data.error || 'Unknown agent error');
                    } else if (type === 'agent_end') {
                        if (data.usage) setLastUsage(data.usage);
                        bumpArtifacts();
                    }
                }
            }

            if (accumulatedContent) {
                updateCurrentMessages(prev => [...prev, {
                    id: `msg-${Date.now()}-ai`,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                }]);
            }
            for (const t of toolCards) {
                updateCurrentMessages(prev => [...prev, {
                    id: `tool-${Date.now()}-${t.call_id || t.name}`,
                    role: 'tool',
                    content: `${t.name} — ${t.status}`,
                    timestamp: new Date().toISOString(),
                }]);
            }
            setStreamingContent('');
        } catch (error) {
            if (error.name !== 'AbortError') {
                updateCurrentMessages(prev => [...prev, {
                    id: `msg-${Date.now()}-error`,
                    role: 'assistant',
                    content: `Error: ${error.message}`,
                    timestamp: new Date().toISOString(),
                }]);
            }
        } finally {
            setIsLoading(false);
            setStreamingContent('');
            abortControllerRef.current = null;
        }
    }, [
        model, temperature, activeInputFolder, attachedPaths, authHeaders, resetRunState, setStreamingContent,
        setToolActivities, setLastUsage, updateCurrentMessages, setIsLoading, bumpArtifacts,
    ]);

    const handleSendMessage = useCallback(async (content) => {
        if (!content.trim() || isLoading) return;
        if (!model) {
            window.alert('Pick a model in the header first.');
            return;
        }

        let chatId = currentChatId;
        if (!chatId) chatId = createNewChat();

        const userMessage = {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date().toISOString(),
        };
        const allMessages = [...currentMessages, userMessage];
        updateCurrentMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        await streamRequest(chatId, allMessages);
    }, [currentChatId, currentMessages, isLoading, model, createNewChat, updateCurrentMessages, setIsLoading, streamRequest]);

    const handleCommand = useCallback((name) => {
        if (name === 'clear') {
            clearCurrentChat();
        } else if (name === 'new') {
            createNewChat();
        } else if (name === 'help') {
            let chatId = currentChatId;
            if (!chatId) chatId = createNewChat();
            updateCurrentMessages(prev => [...prev, {
                id: `msg-${Date.now()}-help`,
                role: 'assistant',
                content: buildHelpText(dynamicCommands),
                timestamp: new Date().toISOString(),
            }]);
        }
    }, [clearCurrentChat, createNewChat, currentChatId, updateCurrentMessages, dynamicCommands]);

    const stopGeneration = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    };

    const hasContent = currentMessages.length > 0 || streamingContent || toolActivities.length > 0;

    return (
        <main style={{
            flex: 1, minWidth: 0, minHeight: 0,
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            background: `
                radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent),
                radial-gradient(ellipse 60% 40% at 100% 100%, rgba(124,58,237,0.06), transparent),
                linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)
            `,
        }}>
            <div ref={scrollContainerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
                {!hasContent ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: '100%', padding: '48px 28px', textAlign: 'center',
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px',
                            boxShadow: '0 16px 48px rgba(99,102,241,0.35)',
                        }}>
                            <Bot size={32} color="white" strokeWidth={1.8} />
                        </div>
                        <h2 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                            What should the agent explore?
                        </h2>
                        <p style={{ margin: '0 0 36px', fontSize: '15px', color: '#64748b', maxWidth: '520px', lineHeight: 1.7 }}>
                            Describe your config task — or type <code style={{ background: '#eef2ff', padding: '2px 6px', borderRadius: 4, color: '#6366f1' }}>/</code> for sub-agents, workflow commands, and folder skills.
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '14px', width: '100%', maxWidth: CHAT_MAX_WIDTH,
                        }}>
                            {PROMPT_SUGGESTIONS.map(({ Icon, text, gradient }) => (
                                <button
                                    key={text}
                                    type="button"
                                    onClick={() => handleSendMessage(text)}
                                    style={{
                                        padding: '16px 18px', textAlign: 'left',
                                        background: 'rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(148,163,184,0.25)',
                                        borderRadius: '14px', cursor: 'pointer',
                                        fontSize: '13.5px', fontWeight: 600, color: '#1e293b',
                                        lineHeight: 1.45,
                                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                                        boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.12)';
                                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                                    }}
                                >
                                    <span style={{
                                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                        background: gradient,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={17} color="white" />
                                    </span>
                                    <span>{text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '28px 32px', maxWidth: CHAT_MAX_WIDTH, margin: '0 auto', width: '100%' }}>
                        {currentMessages.map(msg => <BcaMessageBubble key={msg.id} message={msg} />)}

                        <ToolActivityPanel activities={toolActivities} isActive={isLoading} />

                        {streamingContent && (
                            <div style={assistantCardStyle}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Bot color="white" size={20} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', marginBottom: '6px' }}>
                                        Agentic Config Flow
                                    </div>
                                    <div style={{ color: '#1e293b', fontSize: '14.5px', lineHeight: 1.75 }}>
                                        {streamingContent.length > 80 ? (
                                            <MarkdownRenderer content={streamingContent} />
                                        ) : (
                                            <span style={{ whiteSpace: 'pre-wrap' }}>
                                                {streamingContent}
                                                <span className="bca-cursor" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {lastUsage && !isLoading && (
                            <div style={{
                                display: 'flex', gap: '12px', padding: '6px 4px 12px',
                                fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap',
                            }}>
                                <span>{lastUsage.prompt_tokens?.toLocaleString()} prompt</span>
                                <span>{lastUsage.completion_tokens?.toLocaleString()} completion</span>
                                <span style={{ fontWeight: 600, color: '#64748b' }}>
                                    {lastUsage.total_tokens?.toLocaleString()} tokens
                                </span>
                            </div>
                        )}

                        {isLoading && !streamingContent && toolActivities.length === 0 && (
                            <div style={{ ...assistantCardStyle, alignItems: 'center', padding: '16px 20px' }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Bot color="white" size={20} />
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="bca-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {showScrollBtn && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    style={{
                        position: 'absolute', bottom: '100px', right: '28px',
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none', color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.4)', zIndex: 10,
                    }}
                >
                    <ChevronDown size={18} />
                </button>
            )}

            <AttachedFilesBar />

            <BcaMessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onStop={stopGeneration}
                onCommand={handleCommand}
                dynamicCommands={dynamicCommands}
                disabled={!model}
            />

            <style>{`
                .bca-cursor {
                    display: inline-block;
                    width: 2px; height: 16px;
                    background: #6366f1;
                    margin-left: 2px;
                    vertical-align: text-bottom;
                    animation: bcaBlink 0.9s step-end infinite;
                }
                .bca-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #6366f1;
                    animation: bcaBounce 1.2s ease-in-out infinite;
                }
                .bca-spin { animation: bcaSpin 0.8s linear infinite; }
                @keyframes bcaBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes bcaBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
                @keyframes bcaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
