import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Check, Bot, User, Wrench, AlertCircle } from 'lucide-react';
import MarkdownRenderer from '../../config-assistant/components/MarkdownRenderer';

export default function BcaMessageBubble({ message }) {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const isUser = message.role === 'user';

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message.content || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    if (message.role === 'tool') {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', marginBottom: 8, borderRadius: 10,
                background: 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
                border: '1px solid rgba(99,102,241,0.15)',
                fontSize: 12, color: '#4338ca',
            }}>
                <Wrench size={14} />
                <span style={{ flex: 1 }}>{message.content}</span>
            </div>
        );
    }

    if (message.role === 'error') {
        return (
            <div style={{
                display: 'flex', gap: 10, padding: '12px 16px', marginBottom: 10,
                borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca',
                color: '#991b1b', fontSize: 13,
            }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{message.content}</span>
            </div>
        );
    }

    const timeAgo = message.timestamp
        ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
        : 'Just now';

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', gap: 14, padding: '18px 20px', marginBottom: 12,
                background: isUser
                    ? 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.9) 100%)'
                    : 'rgba(255,255,255,0.92)',
                borderRadius: 16,
                border: isUser ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(99,102,241,0.18)',
                borderLeft: isUser ? '3px solid #64748b' : '3px solid #6366f1',
                boxShadow: hovered
                    ? '0 12px 40px rgba(99,102,241,0.1)'
                    : '0 4px 20px rgba(15,23,42,0.04)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: isUser
                    ? 'linear-gradient(135deg, #475569, #334155)'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isUser ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 16px rgba(99,102,241,0.35)',
            }}>
                {isUser ? <User color="white" size={18} /> : <Bot color="white" size={20} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: isUser ? '#1e293b' : '#4338ca',
                        }}>
                            {isUser ? 'You' : 'Agentic Config Flow'}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo}</span>
                    </div>
                    <button
                        type="button"
                        onClick={copyMessage}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: copied ? '#ecfdf5' : 'rgba(248,250,252,0.8)',
                            border: `1px solid ${copied ? '#bbf7d0' : '#e2e8f0'}`,
                            borderRadius: 8, color: copied ? '#16a34a' : '#64748b',
                            cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontWeight: 600,
                            opacity: hovered || copied ? 1 : 0.4,
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <div style={{ color: '#1e293b', fontSize: 14.5, lineHeight: 1.75, wordBreak: 'break-word' }}>
                    {isUser ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    ) : (
                        <MarkdownRenderer content={message.content} />
                    )}
                </div>
            </div>
        </div>
    );
}
