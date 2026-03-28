const { useState, useEffect } = React;

// SVG Icons
const Icons = {
    Edit: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
    ),
    Trash: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    ),
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    ),
    LogOut: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
    )
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('app_token'));
    const [user, setUser] = useState(localStorage.getItem('app_user'));

    const login = (jwt, username) => {
        setToken(jwt);
        setUser(username);
        localStorage.setItem('app_token', jwt);
        localStorage.setItem('app_user', username);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('app_token');
        localStorage.removeItem('app_user');
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            {!token ? (
                <Login onLogin={login} />
            ) : (
                <Dashboard onLogout={logout} user={user} />
            )}
        </div>
    );
}

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!res.ok) throw new Error('Invalid credentials. Use admin / password123');
            
            const data = await res.json();
            onLogin(data.token, data.username);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-card">
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
                    <p>Enter your credentials to access your dashboard</p>
                </div>
                
                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            placeholder="e.g. admin"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input 
                            type="password" 
                            className="input-field" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
                        {loading ? <div className="spinner"></div> : "Sign In"}
                    </button>
                    
                    <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', textAlign: 'center', opacity: 0.7 }}>
                        Demo Credentials: admin / password123
                    </p>
                </form>
            </div>
        </div>
    );
}

function Dashboard({ onLogout, user }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [status, setStatus] = useState('Active');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/items');
            const data = await res.json();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const payload = { name, description: desc, status };
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            closeModal();
            fetchItems();
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await fetch(`/api/items/${id}`, { method: 'DELETE' });
            fetchItems();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setDesc(item.description);
            setStatus(item.status);
        } else {
            setEditingItem(null);
            setName('');
            setDesc('');
            setStatus('Active');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="container">
            <header className="dashboard-header">
                <div>
                    <h2>Project Dashboard</h2>
                    <p>Manage your resources and applications</p>
                </div>
                <div className="flex-center" style={{ gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Welcome, {user}</span>
                    <button onClick={onLogout} className="btn btn-danger" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <Icons.LogOut /> Logout
                    </button>
                    <button onClick={() => openModal()} className="btn">
                        <Icons.Plus /> New Item
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-center" style={{ height: '300px' }}>
                    <div className="spinner" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent', width: '40px', height: '40px' }}></div>
                </div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                                        No items available. Click "New Item" to get started.
                                    </td>
                                </tr>
                            ) : items.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</td>
                                    <td>{item.description}</td>
                                    <td>
                                        <span className={`badge badge-${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => openModal(item)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-accent)', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Edit"
                                            >
                                                <Icons.Edit />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Delete"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                            {editingItem ? 'Edit Item' : 'Create New Item'}
                        </h3>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label className="input-label">Item Name</label>
                                <input 
                                    className="input-field" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    required
                                    placeholder="Enter application name"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description</label>
                                <input 
                                    className="input-field" 
                                    value={desc} 
                                    onChange={e => setDesc(e.target.value)} 
                                    required
                                    placeholder="Brief description"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Status</label>
                                <select 
                                    className="input-field" 
                                    value={status} 
                                    onChange={e => setStatus(e.target.value)}
                                    style={{ appearance: 'none' }}
                                >
                                    <option value="Active" style={{ background: 'var(--bg-primary)' }}>Active</option>
                                    <option value="Pending" style={{ background: 'var(--bg-primary)' }}>Pending</option>
                                    <option value="Inactive" style={{ background: 'var(--bg-primary)' }}>Inactive</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', flex: 1 }} onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
                                    {editingItem ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
