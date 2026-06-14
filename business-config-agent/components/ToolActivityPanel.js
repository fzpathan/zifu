import { CheckCircle2, Circle, Loader2, XCircle, Wrench } from 'lucide-react';

const statusIcon = (status) => {
    if (status === 'running') return <Loader2 size={14} className="bca-spin" />;
    if (status === 'success') return <CheckCircle2 size={14} />;
    if (status === 'error') return <XCircle size={14} />;
    return <Circle size={14} />;
};

const statusColor = (status) => {
    if (status === 'running') return '#6366f1';
    if (status === 'success') return '#10b981';
    if (status === 'error') return '#ef4444';
    return '#94a3b8';
};

export default function ToolActivityPanel({ activities, isActive }) {
    if (!activities?.length) return null;

    return (
        <div style={{
            marginBottom: '14px',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(15,23,42,0.02) 100%)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(99,102,241,0.12)',
                background: 'rgba(255,255,255,0.6)',
            }}>
                <Wrench size={15} color="#6366f1" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Agent activity
                </span>
                {isActive && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                    }}>
                        <Loader2 size={12} className="bca-spin" /> Running
                    </span>
                )}
            </div>
            <div style={{ padding: '8px 12px 12px' }}>
                {activities.map((act) => (
                    <div
                        key={act.call_id || act.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            backgroundColor: act.status === 'running' ? 'rgba(99,102,241,0.08)' : 'transparent',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <span style={{ color: statusColor(act.status), flexShrink: 0, marginTop: '2px' }}>
                            {statusIcon(act.status)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                                {act.label || act.name}
                            </div>
                            {act.output && act.status === 'success' && (
                                <div style={{
                                    fontSize: '11.5px',
                                    color: '#64748b',
                                    marginTop: '3px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {act.output.slice(0, 120)}{act.output.length > 120 ? '…' : ''}
                                </div>
                            )}
                            {act.error && act.status === 'error' && (
                                <div style={{ fontSize: '11.5px', color: '#ef4444', marginTop: '3px' }}>
                                    {act.error}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
