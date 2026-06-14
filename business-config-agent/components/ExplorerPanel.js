import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ChevronRight, ChevronLeft, FolderOpen, Folder, FileText,
    Paperclip, Download, RefreshCw, Upload, Package, X,
} from 'lucide-react';
import { useBcaChat } from '../lib/bcaChatContext';
import { useUser } from '../../../contexts/UserContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ExplorerPanel({ inputFolders = [], open, onToggle, artifactRefreshKey = 0 }) {
    const { currentUser } = useUser();
    const { activeInputFolder, setActiveInputFolder, attachedPaths, setAttachedPaths } = useBcaChat();
    const [tab, setTab] = useState('inputs');
    const [browseFolder, setBrowseFolder] = useState('');
    const [browsePath, setBrowsePath] = useState('');
    const [entries, setEntries] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [artifacts, setArtifacts] = useState([]);
    const [loadingArtifacts, setLoadingArtifacts] = useState(false);
    const uploadRef = useRef(null);

    const authHeaders = useCallback((json = false) => {
        const h = {};
        if (json) h['Content-Type'] = 'application/json';
        if (currentUser?.id) h.Authorization = `Bearer ${currentUser.id}`;
        return h;
    }, [currentUser]);

    useEffect(() => {
        if (activeInputFolder && !browseFolder) setBrowseFolder(activeInputFolder);
        else if (!browseFolder && inputFolders.length > 0) {
            setBrowseFolder(inputFolders[0]?.name || inputFolders[0] || '');
        }
    }, [activeInputFolder, inputFolders, browseFolder]);

    const loadFiles = useCallback(async () => {
        if (!browseFolder) return;
        setLoadingFiles(true);
        try {
            const url = new URL(`${API_BASE_URL}/api/bca/files`);
            url.searchParams.set('folder', browseFolder);
            if (browsePath) url.searchParams.set('path', browsePath);
            const res = await fetch(url.toString(), { headers: authHeaders() });
            if (res.ok) setEntries(await res.json());
            else setEntries([]);
        } catch {
            setEntries([]);
        } finally {
            setLoadingFiles(false);
        }
    }, [browseFolder, browsePath, authHeaders]);

    const loadArtifacts = useCallback(async () => {
        setLoadingArtifacts(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bca/artifacts`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setArtifacts(data.items || []);
            } else setArtifacts([]);
        } catch {
            setArtifacts([]);
        } finally {
            setLoadingArtifacts(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        if (open && tab === 'inputs') loadFiles();
    }, [open, tab, loadFiles]);

    useEffect(() => {
        if (open && tab === 'outputs') loadArtifacts();
    }, [open, tab, loadArtifacts, artifactRefreshKey]);

    const navigateInto = (entry) => {
        if (!entry.is_dir) return;
        setBrowsePath(entry.path);
    };

    const navigateUp = () => {
        if (!browsePath) return;
        const parts = browsePath.split('/').filter(Boolean);
        parts.pop();
        setBrowsePath(parts.join('/'));
    };

    const attachFile = (entry) => {
        if (entry.is_dir) return;
        setAttachedPaths(prev => prev.includes(entry.path) ? prev : [...prev, entry.path]);
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        try {
            await fetch(`${API_BASE_URL}/api/bca/upload`, {
                method: 'POST',
                headers: authHeaders(),
                body: form,
            });
            loadArtifacts();
        } catch {}
        e.target.value = '';
    };

    const downloadArtifact = (path) => {
        const url = `${API_BASE_URL}/api/bca/artifacts/download?path=${encodeURIComponent(path)}`;
        window.open(url, '_blank');
    };

    if (!open) {
        return (
            <div style={{ position: 'relative', height: '100%', flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={onToggle}
                    title="Open file explorer"
                    aria-label="Open file explorer"
                    style={{
                        position: 'absolute', left: 0, top: '50%', zIndex: 20,
                        transform: 'translate(-50%, -50%)',
                        width: 28, height: 56, borderRadius: 10,
                        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        color: '#94a3b8', boxShadow: '-4px 0 16px rgba(15,23,42,0.2)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                >
                    <ChevronLeft size={16} />
                    <FolderOpen size={14} />
                </button>
            </div>
        );
    }

    const edgeToggleStyle = {
        position: 'absolute',
        left: 0,
        top: '50%',
        zIndex: 20,
        transform: 'translate(-50%, -50%)',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        width: 28,
        height: 56,
        padding: 0,
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer',
        color: '#64748b',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        boxShadow: '-4px 0 16px rgba(15,23,42,0.08)',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    };

    return (
        <aside style={{
            position: 'relative',
            width: 300, minWidth: 300, height: '100%',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderLeft: '1px solid rgba(148,163,184,0.25)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
            boxShadow: '-8px 0 32px rgba(15,23,42,0.06)',
        }}>
            <button
                type="button"
                onClick={onToggle}
                title="Close explorer"
                aria-label="Close explorer"
                style={edgeToggleStyle}
                onMouseEnter={e => {
                    e.currentTarget.style.background = '#fef2f2';
                    e.currentTarget.style.borderColor = '#fecaca';
                    e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#64748b';
                }}
            >
                <ChevronRight size={14} strokeWidth={2.5} />
                <X size={12} strokeWidth={2.5} />
            </button>

            <div style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 12px 10px', borderBottom: '1px solid #e2e8f0',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Explorer
                </span>
            </div>

            <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                {[
                    { id: 'inputs', label: 'Inputs', Icon: FolderOpen },
                    { id: 'outputs', label: 'Sandbox', Icon: Package },
                ].map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            background: tab === id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                            color: tab === id ? 'white' : '#64748b',
                            boxShadow: tab === id ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                        }}
                    >
                        <Icon size={13} />
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'inputs' && (
                <>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <select
                            value={browseFolder}
                            onChange={e => { setBrowseFolder(e.target.value); setBrowsePath(''); setActiveInputFolder(e.target.value); }}
                            style={{
                                width: '100%', padding: '8px 10px', borderRadius: 10,
                                border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600,
                                color: '#334155', background: 'white',
                            }}
                        >
                            {inputFolders.map(f => (
                                <option key={f.name || f} value={f.name || f}>{f.name || f}</option>
                            ))}
                        </select>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                            fontSize: 11, color: '#64748b', overflow: 'hidden',
                        }}>
                            <button type="button" onClick={() => setBrowsePath('')} style={crumbBtn}>root</button>
                            {browsePath.split('/').filter(Boolean).map((part, i, arr) => (
                                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <ChevronRight size={10} color="#cbd5e1" />
                                    <button
                                        type="button"
                                        onClick={() => setBrowsePath(arr.slice(0, i + 1).join('/'))}
                                        style={crumbBtn}
                                    >
                                        {part}
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={loadFiles} style={miniBtn} disabled={loadingFiles}>
                            <RefreshCw size={12} className={loadingFiles ? 'bca-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                        {browsePath && (
                            <button type="button" onClick={navigateUp} style={entryRow(false, true)}>
                                <Folder size={14} color="#6366f1" />
                                <span>..</span>
                            </button>
                        )}
                        {entries.map(entry => {
                            const attached = attachedPaths.includes(entry.path);
                            const label = entry.path.split('/').pop() || entry.path;
                            return (
                                <div key={entry.path} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                    <button
                                        type="button"
                                        onClick={() => entry.is_dir ? navigateInto(entry) : attachFile(entry)}
                                        style={{ ...entryRow(entry.is_dir, false), flex: 1 }}
                                    >
                                        {entry.is_dir
                                            ? <Folder size={14} color="#6366f1" />
                                            : <FileText size={14} color="#64748b" />}
                                        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {label}
                                        </span>
                                        {!entry.is_dir && (
                                            <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatSize(entry.size)}</span>
                                        )}
                                    </button>
                                    {!entry.is_dir && (
                                        <button
                                            type="button"
                                            onClick={() => attachFile(entry)}
                                            title="Attach to message"
                                            style={{
                                                ...miniIconBtn,
                                                background: attached ? '#eef2ff' : 'white',
                                                color: attached ? '#6366f1' : '#94a3b8',
                                                borderColor: attached ? '#c7d2fe' : '#e2e8f0',
                                            }}
                                        >
                                            <Paperclip size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {!loadingFiles && entries.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                                No files in this folder
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'outputs' && (
                <>
                    <div style={{ padding: '10px 12px', display: 'flex', gap: 6, borderBottom: '1px solid #f1f5f9' }}>
                        <button type="button" onClick={loadArtifacts} style={{ ...miniBtn, flex: 1 }} disabled={loadingArtifacts}>
                            <RefreshCw size={12} className={loadingArtifacts ? 'bca-spin' : ''} />
                            Refresh
                        </button>
                        <button type="button" onClick={() => uploadRef.current?.click()} style={{ ...miniBtn, flex: 1 }}>
                            <Upload size={12} />
                            Upload
                        </button>
                        <input ref={uploadRef} type="file" hidden onChange={handleUpload} />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px' }}>
                        {artifacts.map(item => (
                            <div
                                key={item.path}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                                    background: 'white', border: '1px solid #e2e8f0',
                                }}
                            >
                                <FileText size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.path}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{formatSize(item.size)}</div>
                                </div>
                                <button type="button" onClick={() => downloadArtifact(item.path)} style={miniIconBtn} title="Download">
                                    <Download size={12} />
                                </button>
                            </div>
                        ))}
                        {!loadingArtifacts && artifacts.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
                                No sandbox outputs yet.<br />Agent reports appear here after runs.
                            </div>
                        )}
                    </div>
                </>
            )}
            <style>{`@keyframes bcaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .bca-spin { animation: bcaSpin 0.8s linear infinite; }`}</style>
        </aside>
    );
}

const crumbBtn = {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    fontSize: 11, color: '#6366f1', fontWeight: 600,
};

const miniBtn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#64748b',
};

const miniIconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0',
    background: 'white', cursor: 'pointer', flexShrink: 0,
};

const entryRow = (isDir, isUp) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isDir || isUp ? 600 : 500,
    color: '#334155', background: 'transparent',
    transition: 'background 0.12s',
});
