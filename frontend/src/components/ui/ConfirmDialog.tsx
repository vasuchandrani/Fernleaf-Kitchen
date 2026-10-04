'use client';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  isDestructive = false
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog 
      ref={dialogRef} 
      className="premium-card glass-overlay"
      onCancel={onClose}
      style={{
        margin: 'auto',
        maxWidth: '400px',
        width: '100%',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        padding: '0'
      }}
    >
      <div style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{description}</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={isDestructive ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
