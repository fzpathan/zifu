import { useEffect, useState } from 'react';
import { BcaChatProvider, useBcaChat } from './lib/bcaChatContext';
import BcaChatHeader from './components/BcaChatHeader';
import BcaChatSidebar from './components/BcaChatSidebar';
import BcaChatArea from './components/BcaChatArea';
import ExplorerPanel from './components/ExplorerPanel';
import { useUser } from '../../contexts/UserContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function ModelSync({ models, defaultModel }) {
    const { model, setModel } = useBcaChat();

    useEffect(() => {
        if (model) return;
        if (models.length > 0) {
            const def = models.find(m => m.default) || models[0];
            setModel(def.id);
        } else if (defaultModel) {
            setModel(defaultModel);
        }
    }, [models, defaultModel, model, setModel]);

    return null;
}

function BcaChatPageInner({ backendOnline, models, inputFolders, healthInfo }) {
    const [explorerOpen, setExplorerOpen] = useState(false);
    const { artifactRefreshKey } = useBcaChat();

    return (
        <div style={{
            minHeight: '100vh',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
        }}>
            <BcaChatHeader
                backendOnline={backendOnline}
                models={models}
                inputFolders={inputFolders}
                healthInfo={healthInfo}
                explorerOpen={explorerOpen}
                onToggleExplorer={() => setExplorerOpen(o => !o)}
            />
            <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
                <BcaChatSidebar />
                <BcaChatArea />
                <ExplorerPanel
                    inputFolders={inputFolders}
                    open={explorerOpen}
                    onToggle={() => setExplorerOpen(o => !o)}
                    artifactRefreshKey={artifactRefreshKey}
                />
            </div>
            <ModelSync models={models} defaultModel={healthInfo?.model} />
        </div>
    );
}

export default function BusinessConfigAgentPage() {
    const { currentUser, hasAccess, loading } = useUser();
    const [backendOnline, setBackendOnline] = useState(null);
    const [models, setModels] = useState([]);
    const [inputFolders, setInputFolders] = useState([]);
    const [healthInfo, setHealthInfo] = useState(null);

    useEffect(() => {
        document.title = 'Agentic Config Flow';
    }, []);

    useEffect(() => {
        if (!hasAccess('business-config-agent')) return;

        const init = async () => {
            const headers = {};
            if (currentUser?.id) headers.Authorization = `Bearer ${currentUser.id}`;

            try {
                const res = await fetch(`${API_BASE_URL}/api/bca/health`, { headers });
                if (res.ok) {
                    setBackendOnline(true);
                    const data = await res.json();
                    setHealthInfo(data);

                    const modelsRes = await fetch(`${API_BASE_URL}/api/bca/models`, { headers });
                    if (modelsRes.ok) {
                        const modelsData = await modelsRes.json();
                        setModels(modelsData.models || []);
                    }

                    const foldersRes = await fetch(`${API_BASE_URL}/api/bca/input-folders`, { headers });
                    if (foldersRes.ok) {
                        const foldersData = await foldersRes.json();
                        setInputFolders(foldersData || []);
                    }
                } else {
                    setBackendOnline(false);
                }
            } catch {
                setBackendOnline(false);
            }
        };
        if (!loading) init();
    }, [currentUser, hasAccess, loading]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Loading…</span>
            </div>
        );
    }

    if (!hasAccess('business-config-agent')) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(180deg, #fef2f2 0%, #fff 100%)', padding: '32px',
            }}>
                <div style={{
                    maxWidth: '420px', padding: '32px', borderRadius: '16px',
                    background: 'white', border: '1px solid #fecaca',
                    boxShadow: '0 8px 32px rgba(220,38,38,0.08)', textAlign: 'center',
                }}>
                    <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: '18px' }}>Access denied</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                        Agentic Config Flow requires administrator permissions.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <BcaChatProvider>
            <BcaChatPageInner
                backendOnline={backendOnline}
                models={models}
                inputFolders={inputFolders}
                healthInfo={healthInfo}
            />
        </BcaChatProvider>
    );
}
