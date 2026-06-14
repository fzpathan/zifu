import { useRef, useState, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { SLASH_COMMANDS, GROUP_META, groupCommands } from '../lib/slashCommands';
import { CHAT_MAX_WIDTH } from '../lib/layout';

export default function BcaMessageInput({ onSendMessage, isLoading, onStop, onCommand, dynamicCommands = [], disabled }) {
    const [message, setMessage] = useState('');
    const [focused, setFocused] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const textareaRef = useRef(null);

    const builtinNames = new Set(SLASH_COMMANDS.map(c => c.name));
    const allCommands = [
        ...SLASH_COMMANDS,
        ...dynamicCommands
            .filter(c => !builtinNames.has(c.name))
            .map(c => ({ ...c, group: 'skill' })),
    ];

    const query = message.toLowerCase().split(' ')[0];
    const filtered = message.startsWith('/')
        ? allCommands.filter(c => c.label.startsWith(query))
        : [];
    const menuOpen = filtered.length > 0;
    const grouped = groupCommands(filtered);

    useEffect(() => { setActiveIdx(0); }, [message]);
    useEffect(() => {
        if (!disabled && !isLoading) textareaRef.current?.focus();
    }, [disabled, isLoading]);

    const selectCommand = (cmd) => {
        if (cmd.type === 'action') {
            setMessage('');
            onCommand?.(cmd.name);
        } else {
            setMessage(cmd.prompt);
            setTimeout(() => textareaRef.current?.focus(), 0);
        }
    };

    const submit = () => {
        const text = message.trim();
        if (!text || isLoading || menuOpen) return;
        onSendMessage(text);
        setMessage('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (menuOpen) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i + 1) % filtered.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => (i - 1 + filtered.length) % filtered.length); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); selectCommand(filtered[activeIdx]); return; }
            if (e.key === 'Escape') { e.preventDefault(); setMessage(''); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    };

    let flatIdx = -1;
    const canSend = message.trim() && !isLoading && !disabled && !menuOpen;

    return (
        <div style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            flexShrink: 0,
        }}>
            <div style={{ maxWidth: CHAT_MAX_WIDTH, margin: '0 auto', position: 'relative' }}>
                {menuOpen && (
                    <div style={{
                        position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                        background: 'white', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 14, boxShadow: '0 12px 40px rgba(15,23,42,0.12)',
                        zIndex: 100, maxHeight: 360, overflowY: 'auto',
                    }}>
                        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Slash commands</span>
                            <span style={{ fontSize: 10, color: '#cbd5e1' }}>{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</span>
                        </div>
                        {grouped.map(({ group, commands: cmds }) => {
                            const meta = GROUP_META[group] || GROUP_META.skill;
                            return (
                                <div key={group}>
                                    <div style={{ padding: '5px 14px 3px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color, background: '#fafafa' }}>
                                        {meta.label}
                                    </div>
                                    {cmds.map(cmd => {
                                        flatIdx += 1;
                                        const myIdx = flatIdx;
                                        const active = myIdx === activeIdx;
                                        return (
                                            <div
                                                key={cmd.name}
                                                style={{
                                                    display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 14px',
                                                    cursor: 'pointer', background: active ? '#eef2ff' : 'transparent',
                                                    borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
                                                }}
                                                onMouseEnter={() => setActiveIdx(myIdx)}
                                                onMouseDown={e => { e.preventDefault(); selectCommand(cmd); }}
                                            >
                                                <span style={{ fontWeight: 700, fontSize: 13, color: '#6366f1', minWidth: 96, flexShrink: 0 }}>{cmd.label}</span>
                                                <span style={{ fontSize: 12.5, color: '#475569', flex: 1 }}>{cmd.description}</span>
                                                <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, background: meta.bg, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                                                    {cmd.type === 'action' ? 'action' : group === 'skill' ? 'skill' : group === 'sub-agents' ? 'sub-agent' : group}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        <div style={{ padding: '5px 14px 8px', fontSize: 10, color: '#cbd5e1', borderTop: '1px solid #f1f5f9' }}>
                            arrows · enter/tab · esc
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 12,
                    border: `1px solid ${focused ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.22)'}`,
                    borderRadius: 16, padding: '12px 14px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
                    boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 8px 32px rgba(15,23,42,0.06)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <Sparkles size={18} color="#6366f1" style={{ flexShrink: 0, marginBottom: 8, opacity: 0.7 }} />
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Ask about your config, or type / for commands & skills"
                        disabled={disabled}
                        rows={1}
                        style={{
                            flex: 1, border: 'none', outline: 'none', resize: 'none',
                            fontSize: 14.5, color: '#0f172a', background: 'transparent',
                            fontFamily: 'inherit', lineHeight: 1.65, maxHeight: 160, overflowY: 'auto',
                        }}
                    />
                    {isLoading ? (
                        <button type="button" onClick={onStop} title="Stop" style={sendBtnStyle(true, true)}>
                            <Square size={14} fill="white" />
                        </button>
                    ) : (
                        <button type="button" onClick={submit} disabled={!canSend} title="Send" style={sendBtnStyle(canSend, false)}>
                            <Send size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div style={{ maxWidth: CHAT_MAX_WIDTH, margin: '8px auto 0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', padding: '0 4px' }}>
                <span>Shift+Enter · type / for sub-agents &amp; skills</span>
                <span>Agentic Config Flow</span>
            </div>
        </div>
    );
}

function sendBtnStyle(enabled, isStop) {
    if (isStop) {
        return {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 42, height: 42, flexShrink: 0,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', borderRadius: 12, cursor: 'pointer', color: 'white',
            boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
        };
    }
    return {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 42, height: 42, flexShrink: 0,
        background: enabled ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#e2e8f0',
        border: 'none', borderRadius: 12,
        cursor: enabled ? 'pointer' : 'not-allowed',
        color: enabled ? 'white' : '#94a3b8',
        boxShadow: enabled ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
    };
}
