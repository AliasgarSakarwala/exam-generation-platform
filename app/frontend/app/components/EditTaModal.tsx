import React, { useState, useEffect, useRef } from 'react';
import CustomDropdown from './CustomDropdown';

interface Course {
  name: string;
  color: string;
}

interface EditTaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (ta: any) => void;
  ta: {
    id: string;
    fullName: string;
    email: string;
    courses: string[];
    role: string;
    permissions: string[];
    column: string;
  } | null;
  courses: Course[];
  roles: string[];
}

const PERMISSIONS = [
  { label: 'View Grades', value: 'view_grades' },
  { label: 'Manage Assignments', value: 'manage_assignments' },
];

const EditTaModal: React.FC<EditTaModalProps> = ({ open, onClose, onSave, ta, courses, roles }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Prefill fields when TA changes
  useEffect(() => {
    if (ta) {
      setEmail(ta.email || '');
      setFullName(ta.fullName || '');
      setSelectedCourses(ta.courses || []);
      setRole(ta.role || '');
      setPermissions(ta.permissions || []);
      setEmailError(null);
    }
  }, [ta, open]);

  // Click outside to close
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

  // Email validation
  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
  };

  const handleSave = () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err || !fullName || selectedCourses.length === 0 || !role) return;
    onSave({
      ...ta,
      email,
      fullName,
      courses: selectedCourses,
      role,
      permissions,
    });
  };

  if (!open || !ta) return null;

  const courseOptions = courses.filter(c => c.name !== 'All courses').map(c => ({ label: c.name, value: c.name, color: c.color }));
  const roleOptions = roles.map(r => ({ label: r, value: r }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm backdrop-brightness-95 animate-fade-in-overlay">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fade-in-modal transition-all duration-300"
      >
        <h2 className="text-xl font-bold mb-4">Edit TA</h2>
        <div className="mb-3">
          <input
            type="email"
            className={`w-full border rounded px-3 py-2 mb-2 focus:outline-none focus:ring ${emailError ? 'border-red-500' : ''}`}
            placeholder="Search or enter email..."
            value={email}
            onChange={handleEmailChange}
          />
          {emailError && <div className="text-red-500 text-sm mb-1">{emailError}</div>}
          <input
            type="text"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block font-medium mb-1">Courses</label>
          <CustomDropdown
            options={courseOptions}
            value={selectedCourses}
            onChange={v => setSelectedCourses(Array.isArray(v) ? v : [v])}
            placeholder="Select course(s)..."
            multi
            labelRenderer={opt => (
              <span className="font-semibold" style={{ color: opt.color }}>{opt.label}</span>
            )}
          />
        </div>
        <div className="mb-3">
          <label className="block font-medium mb-1">Role</label>
          <CustomDropdown
            options={roleOptions}
            value={role}
            onChange={v => setRole(typeof v === 'string' ? v : v[0])}
            placeholder="Select role..."
          />
        </div>
        <div className="mb-4">
          {PERMISSIONS.map((perm) => (
            <label key={perm.value} className="flex items-center gap-2 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.includes(perm.value)}
                onChange={() => setPermissions(prev => prev.includes(perm.value) ? prev.filter(p => p !== perm.value) : [...prev, perm.value])}
                className="accent-blue-600"
              />
              <span>{perm.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={!!emailError || !email || !fullName || selectedCourses.length === 0 || !role}
            type="button"
          >
            Save
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

export default EditTaModal; 