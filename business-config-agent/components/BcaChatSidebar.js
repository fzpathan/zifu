import { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { useBcaChat } from '../lib/bcaChatContext';
import { useUser } from '../../../contexts/UserContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function BcaChatSidebar() {
    const { currentUser } = useUser();
    const { chats, currentChatId, createNewChat, selectChat, deleteChat } = useBcaChat();
    const [collapsed, setCollapsed] = useState(false);
    const [serverChats, setServerChats] = useState([]);

    const refreshServerChats = useCallback(async () => {
        try {
            const headers = {};
            if (currentUser?.id) headers.Authorization = `Bearer ${currentUser.id}`;
            const res = await fetch(`${API_BASE_URL}/api/bca/conversations`, { headers });
            if (res.ok) setServerChats(await res.json());
        } catch {}
    }, [currentUser]);

    useEffect(() => {
        refreshServerChats();
    }, [currentChatId, chats.length, refreshServerChats]);

    const handleDelete = (chatId, e) => {
        e.stopPropagation();
        deleteChat(chatId);
    };

    if (collapsed) {
        return (
            <div style={{
                width: '52px', minWidth: '52px', height: '100%',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: '16px', flexShrink: 0,
            }}>
                <button
                    type="button"
                    onClick={() => setCollapsed(false)}
                    title="Expand"
                    style={iconBtnStyle}
                >
                    <ChevronRight size={16} color="#94a3b8" />
                </button>
            </div>
        );
    }

    return (
        <aside style={{
            width: '280px', minWidth: '280px', height: '100%',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        }}>
            <div style={{ padding: '18px 16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Sparkles size={16} color="#818cf8" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Sessions
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={createNewChat}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '11px 14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white', border: 'none', borderRadius: '12px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Plus size={15} strokeWidth={2.5} /> New session
                    </button>
                    <button type="button" onClick={refreshServerChats} title="Refresh from server" style={iconBtnStyle}>
                        <RefreshCw size={14} color="#94a3b8" />
                    </button>
                    <button type="button" onClick={() => setCollapsed(true)} title="Collapse" style={iconBtnStyle}>
                        <ChevronLeft size={16} color="#94a3b8" />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 12px' }}>
                {chats.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        <MessageSquare size={28} style={{ marginBottom: '12px', opacity: 0.35, color: '#818cf8' }} />
                        <div style={{ fontWeight: 600, color: '#cbd5e1' }}>No sessions yet</div>
                        <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>Start a new agent session</div>
                    </div>
                ) : (
                    chats.map(chat => {
                        const isActive = currentChatId === chat.id;
                        return (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                style={{
                                    padding: '11px 12px', borderRadius: '12px', marginBottom: '4px',
                                    cursor: 'pointer',
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.15) 100%)'
                                        : 'transparent',
                                    border: isActive ? '1px solid rgba(129,140,248,0.35)' : '1px solid transparent',
                                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <MessageSquare size={15} color={isActive ? '#a5b4fc' : '#64748b'} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '13px', fontWeight: isActive ? 700 : 500,
                                        color: isActive ? '#e0e7ff' : '#cbd5e1',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {chat.title}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                                        {formatDate(chat.createdAt)}
                                        {(chat.messages?.length || 0) > 0 && ` · ${chat.messages.length} msgs`}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={e => handleDelete(chat.id, e)}
                                    style={{
                                        background: 'none', border: 'none', color: '#475569',
                                        cursor: 'pointer', padding: '2px', flexShrink: 0,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })
                )}
                {serverChats
                    .filter(sc => !chats.some(c => c.id === sc.id))
                    .map(sc => (
                        <div
                            key={sc.id}
                            onClick={() => selectChat(sc.id)}
                            style={{
                                padding: '11px 12px', borderRadius: '12px', marginBottom: '4px',
                                cursor: 'pointer', opacity: 0.75,
                                border: '1px dashed rgba(129,140,248,0.25)',
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                            }}
                            title="Server-side conversation (select to open locally)"
                        >
                            <MessageSquare size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sc.title} (server)
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                                    {sc.message_count || 0} msgs
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {chats.length > 0 && (
                <div style={{
                    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '11px', color: '#64748b', textAlign: 'center',
                }}>
                    {chats.length} session{chats.length !== 1 ? 's' : ''}
                </div>
            )}
        </aside>
    );
}

const iconBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '36px', height: '36px', flexShrink: 0,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', cursor: 'pointer',
};
