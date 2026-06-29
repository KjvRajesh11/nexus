'use client';

interface ProfileMenuProps {
  onClose: () => void;
  onSettings: () => void;
}

export default function ProfileMenu({ onClose, onSettings }: ProfileMenuProps) {
  return (
    <div className="nx-pmenu">
      <div style={{ 
        padding: "8px 10px 8px", 
        borderBottom: "1px solid rgba(255,255,255,0.07)", 
        marginBottom: 4 
      }}>
        <div style={{ fontSize: "var(--fs-card)", fontWeight: 500 }}>Kjv Rajesh</div>
        <div style={{ fontSize: "var(--fs-meta)", color: "#888" }}>rajeshwind123@gmail.com</div>
      </div>

      <button className="nx-pmitem" onClick={onClose}>
        👤 Your profile
      </button>
      <button className="nx-pmitem" onClick={onClose}>
        👑 Upgrade to Pro
      </button>
      <button className="nx-pmitem" onClick={onClose}>
        🔌 Integrations
      </button>
      <button className="nx-pmitem" onClick={onClose}>
        🔑 API access
      </button>

      <div style={{ 
        borderTop: "1px solid rgba(255,255,255,0.07)", 
        marginTop: 4, 
        paddingTop: 4 
      }}>
        <button 
          className="nx-pmitem" 
          onClick={() => { 
            onClose(); 
            onSettings(); 
          }}
        >
          ⚙️ Settings
        </button>
        <button className="nx-pmitem danger" onClick={onClose}>
          🚪 Sign out
        </button>
      </div>
    </div>
  );
}