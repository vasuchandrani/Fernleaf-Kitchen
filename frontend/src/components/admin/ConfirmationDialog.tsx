'use client';

import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="glass-overlay animate-fade-in" style={overlay} role="presentation" onClick={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div className="premium-card" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" style={dialog}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={icon}><AlertTriangle size={18} /></div>
            <div>
              <h3 id="confirmation-title" style={{ margin: '0 0 6px' }}>{title}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
            </div>
          </div>
          <button className="btn-secondary icon-button" onClick={onCancel} aria-label="Close confirmation"><X size={16} /></button>
        </div>
        <div style={actions}>
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm} disabled={busy} style={{ background: '#b42318' }}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: 'fixed' as const, inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,.45)' };
const dialog = { width: '100%', maxWidth: 460, display: 'grid', gap: 24 };
const icon = { width: 36, height: 36, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 10, background: '#fef3f2', color: '#b42318' };
const actions = { display: 'flex', justifyContent: 'flex-end', gap: 10 };
