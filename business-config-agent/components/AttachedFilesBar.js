import { X } from 'lucide-react';
import { useBcaChat } from '../lib/bcaChatContext';
import { CHAT_MAX_WIDTH } from '../lib/layout';

export default function AttachedFilesBar() {
    const { attachedPaths, setAttachedPaths, activeInputFolder } = useBcaChat();

    if (!attachedPaths.length) return null;

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            padding: '8px 24px', maxWidth: CHAT_MAX_WIDTH, margin: '0 auto',
            borderTop: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(248,250,252,0.8)',
            alignItems: 'center',
        }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                Attached{activeInputFolder ? ` from ${activeInputFolder}` : ''}:
            </span>
            {attachedPaths.map(p => (
                <span key={p} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', background: 'white',
                    border: '1px solid #e2e8f0', borderRadius: 999,
                    fontSize: 12, color: '#334155',
                }}>
                    {p}
                    <button
                        type="button"
                        onClick={() => setAttachedPaths(prev => prev.filter(x => x !== p))}
                        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'inline-flex' }}
                        title="Remove"
                    >
                        <X size={12} />
                    </button>
                </span>
            ))}
        </div>
    );
}
