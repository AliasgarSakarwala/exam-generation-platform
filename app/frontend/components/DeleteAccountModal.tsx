import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccount as apiDeleteAccount } from '@/services/profile';
import { logout } from '@/services/auth';

interface DeleteAccountModalProps {
  userId: number;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ userId, onClose }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log('User ID for deletion:', userId);
  }, [userId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE') {
      setError('You must type DELETE to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      const res: {data: Record<string, any>, status: number} = await apiDeleteAccount(userId);
      console.log("RESPONSE on DELETE: ", res);
      if(res.status >= 200 && res.status < 300) {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white light:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Confirm Account Deletion</h2>
        <p className="mb-4">This action will <strong>permanently</strong> erase all your data. This cannot be undone.</p>
        <p className="mb-2">Type <code className="font-mono bg-gray-100 px-1">DELETE</code> to confirm:</p>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => { setConfirmationText(e.target.value); setError(''); }}
          className="w-full border rounded px-3 py-2 mb-2"
          disabled={isDeleting}
        />
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
