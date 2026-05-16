
import React from 'react';
import { ThemeConfig } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  config: ThemeConfig;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = "Confirm Delete", 
  description = "Are you sure you want to delete this? This action cannot be undone.",
  config 
}) => {
  useScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-white/5 backdrop-blur-[1px] detail-view-container" 
        onClick={onCancel} 
      />
      <div className={`relative w-full max-w-[320px] p-8 rounded-[2rem] border shadow-2xl ${config.card} text-center flex flex-col items-center animate-in zoom-in-95 duration-300`}>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-xs text-white/50 mb-8 leading-relaxed px-2">{description}</p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg active:scale-95 text-sm"
          >
            Delete
          </button>
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors active:scale-95 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
