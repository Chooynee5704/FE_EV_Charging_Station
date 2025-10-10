import "./index.scss";

const StaffSidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: "overview", icon: "🧭", label: "Tổng quan", path: "" },
        {
            id: "charging-sessions",
            icon: "🔌",
            label: "Quản lý phiên sạc",
            path: "charging-sessions",
        },
        {
            id: "payment",
            icon: "💳",
            label: "Thanh toán tại trạm",
            path: "payment",
        },
        {
            id: "station-status",
            icon: "📡",
            label: "Tình trạng điểm sạc",
            path: "station-status",
        },
        {
            id: "reports",
            icon: "🧾",
            label: "Báo cáo & Sự cố",
            path: "reports",
        },
        {
            id: "profile",
            icon: "👤",
            label: "Hồ sơ cá nhân",
            path: "profile",
        },
    ];

    return (
        <aside className="staff-sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">⚡</span>
                    <h2>EV Staff</h2>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                        onClick={() => setActiveTab(item.id, item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {activeTab === item.id && <div className="active-indicator"></div>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">S</div>
                    <div className="user-info">
                        <span className="user-name">Nhân viên</span>
                        <span className="user-role">Trạm sạc</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default StaffSidebar;
