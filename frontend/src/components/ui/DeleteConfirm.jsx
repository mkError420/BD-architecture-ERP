import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirm({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-[fadeInUp_0.2s_ease-out]">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title || 'Delete Confirmation'}</h3>
        <p className="text-sm text-gray-500 mb-6">{message || 'Are you sure you want to delete this? This action cannot be undone.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}
