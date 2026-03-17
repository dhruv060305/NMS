import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '◉' },
    { path: '/devices', label: 'Devices', icon: '⬡' },
    { path: '/alerts', label: 'Alerts', icon: '⚠' },
    { path: '/logs', label: 'Logs', icon: '☰' },
    { path: '/reports', label: 'Reports', icon: '◧' },
];

export default function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('nms_token');
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="sidebar w-60 flex flex-col p-4 shrink-0">
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm pulse-glow">
                            NM
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
                                NetMonitor
                            </h1>
                            <p className="text-[0.65rem] text-surface-500 tracking-wider uppercase">Security Suite</p>
                        </div>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="text-lg leading-none">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto pt-4 border-t border-surface-800/50">
                    <button onClick={handleLogout} className="nav-link w-full text-left text-red-400 hover:text-red-300">
                        <span className="text-lg leading-none">⏻</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto p-6" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
                <Outlet />
            </main>
        </div>
    );
}
