import React from 'react';
import { Trash2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  open: boolean;
  targetPath: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  targetPath,
  onConfirm,
  onCancel,
}) => {
  if (!open || !targetPath) return null;

  const fileName = targetPath.split('/').pop() || targetPath;

  return (
    <div className="swrite-modal-overlay" onClick={onCancel}>
      <div
        className="swrite-dialog-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div className="dialog-icon-wrap danger">
            <Trash2 size={18} />
          </div>
          <div className="dialog-title-block">
            <h3>Move "{fileName}" to Trash?</h3>
            <p className="dialog-subtitle">
              The file will be safely moved to <code>.swrite/trash/</code> and can be recovered if needed.
            </p>
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel} className="dialog-btn secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="dialog-btn danger">
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
};
