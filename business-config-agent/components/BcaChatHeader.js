import { useState } from 'react';
import { Bot, Trash2, Download, Workflow, FolderOpen, X, Thermometer, PanelRight } from 'lucide-react';
import Logo from '../../../components/Logo';
import { useBcaChat } from '../lib/bcaChatContext';
import { SUB_AGENTS } from '../lib/slashCommands';

export default function BcaChatHeader({
    backendOnline = null,
    models = [],
    inputFolders = [],
    healthInfo = null,
    explorerOpen = false,
    onToggleExplorer,
}) {
    const { model, setModel, temperature, setTemperature, clearCurrentChat, exportCurrentChat, activeInputFolder, setActiveInputFolder } = useBcaChat();
    const [showInfo, setShowInfo] = useState(false);

    const statusColor = backendOnline === null ? '#94a3b8' : backendOnline ? '#10b981' : '#ef4444';
    const statusLabel = backendOnline === null ? 'Connecting…' : backendOnline ? 'Online' : 'Offline';

    return (
        <>
            <header style={{
                padding: '0 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '72px',
                flexShrink: 0,
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(148,163,184,0.2)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
                zIndex: 30,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    <Logo height={48} />
                    <div style={{ width: '1px', height: '36px', background: 'linear-gradient(180deg, transparent, #cbd5e1, transparent)' }} />
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                    }}>
                        <Workflow size={22} color="white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 750, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Agentic Config Flow
                        </h1>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                            {healthInfo
                                ? `Inspect · Profile · Report · ${healthInfo.tools} tools · ${healthInfo.sub_agents} sub-agents`
                                : 'AI agent for config inspection, validation & reporting'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '20px',
                        background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(148,163,184,0.2)',
                    }}>
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            backgroundColor: statusColor,
                            boxShadow: backendOnline ? `0 0 8px ${statusColor}` : 'none',
                        }} />
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>{statusLabel}</span>
                    </div>

                    {inputFolders.length > 0 && (
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 10px', borderRadius: '10px',
                            background: 'white', border: '1px solid #e2e8f0',
                            fontSize: '12px', fontWeight: 600, color: '#475569',
                        }}>
                            <FolderOpen size={13} color="#6366f1" />
                            <select
                                value={activeInputFolder}
                                onChange={e => setActiveInputFolder(e.target.value)}
                                aria-label="Input folder"
                                style={{
                                    border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: '12px', fontWeight: 600, color: '#334155',
                                    cursor: 'pointer', maxWidth: '140px',
                                }}
                            >
                                <option value="">All inputs</option>
                                {inputFolders.map(f => (
                                    <option key={f.name || f} value={f.name || f}>{f.name || f}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {models.length > 0 && (
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 10px', borderRadius: '10px',
                            background: 'white', border: '1px solid #e2e8f0',
                        }}>
                            <Bot size={13} color="#6366f1" />
                            <select
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                aria-label="Model"
                                style={{
                                    border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: '12px', fontWeight: 600, color: '#334155',
                                    cursor: 'pointer', maxWidth: '160px',
                                }}
                            >
                                {models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 8px', borderRadius: '10px',
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: '12px', color: '#475569',
                    }} title="Temperature">
                        <Thermometer size={13} color="#6366f1" />
                        <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={temperature}
                            onChange={e => setTemperature(parseFloat(e.target.value || '0.3'))}
                            style={{
                                width: 48, border: 'none', outline: 'none', background: 'transparent',
                                fontSize: '12px', fontWeight: 600, color: '#334155',
                            }}
                        />
                    </label>

                    <HeaderBtn onClick={onToggleExplorer} title={explorerOpen ? 'Close explorer' : 'Open file explorer'} active={explorerOpen}>
                        <PanelRight size={14} />
                    </HeaderBtn>
                    <HeaderBtn onClick={() => setShowInfo(true)} title="Agent info">
                        <Workflow size={14} />
                    </HeaderBtn>
                    <HeaderBtn onClick={exportCurrentChat} title="Export chat">
                        <Download size={14} />
                    </HeaderBtn>
                    <HeaderBtn onClick={clearCurrentChat} title="Clear chat" danger>
                        <Trash2 size={14} />
                    </HeaderBtn>
                </div>
            </header>

            {showInfo && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={() => setShowInfo(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} />
                    <div style={{
                        position: 'relative', width: '400px', height: '100%',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '-8px 0 40px rgba(15,23,42,0.15)',
                        padding: '28px', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Agent capabilities</h2>
                            <button type="button" onClick={() => setShowInfo(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        {healthInfo && (
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px',
                            }}>
                                {[
                                    ['Tools', healthInfo.tools],
                                    ['Sub-agents', healthInfo.sub_agents],
                                    ['Input folders', healthInfo.input_folders?.length ?? 0],
                                    ['Model', healthInfo.model?.split('/').pop()],
                                ].map(([label, val]) => (
                                    <div key={label} style={{
                                        padding: '12px', borderRadius: '12px',
                                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, margin: '0 0 16px' }}>
                            Agentic Config Flow uses tool-calling agents to inspect input data, profile configs, validate transforms, and generate reports — with live progress as each tool runs.
                        </p>
                        <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sub-agents</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {SUB_AGENTS.map(agent => (
                                <div key={agent.name} style={{
                                    padding: '10px 12px', borderRadius: 10,
                                    background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{agent.label}</span>
                                        <code style={{ fontSize: 11, color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: 4 }}>{agent.slash}</code>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{agent.description}</p>
                                </div>
                            ))}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
                            <li>Read &amp; browse input folder files</li>
                            <li>Profile data and detect anomalies</li>
                            <li>Validate config transforms</li>
                            <li>Write reports to your sandbox</li>
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
}

function HeaderBtn({ children, onClick, title, danger, active }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px',
                background: danger ? 'rgba(219,0,17,0.06)' : active ? '#eef2ff' : 'white',
                border: `1px solid ${danger ? 'rgba(219,0,17,0.2)' : active ? '#c7d2fe' : '#e2e8f0'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                color: danger ? '#db0011' : active ? '#6366f1' : '#64748b',
                transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {children}
        </button>
    );
}
