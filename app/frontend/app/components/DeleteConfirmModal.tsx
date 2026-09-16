import React, { useEffect, useRef } from 'react';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taName: string;
  course: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ open, onClose, onConfirm, taName, course }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm backdrop-brightness-95 transition-opacity duration-300 animate-fade-in-overlay">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fade-in-modal transition-all duration-300"
      >
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="mb-6 text-gray-700 text-center">
          Would you like to remove <span className="font-bold">{taName}</span> from <span className="font-bold">{course}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={onConfirm}
            type="button"
          >
            Okay
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in-overlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-overlay {
          animation: fade-in-overlay 0.3s ease;
        }
        @keyframes fade-in-modal {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-modal {
          animation: fade-in-modal 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default DeleteConfirmModal; 