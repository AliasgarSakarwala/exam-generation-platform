import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CustomDropdown from './CustomDropdown';
import { userManagementService } from '../../services/user_management';

interface Course {
  name: string;
  color: string;
}

interface AddTaDropdownProps {
  open: boolean;
  onClose: () => void;
  onAdd: (tas: NewTA[]) => void;
  courses: Course[];
  roles: string[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export interface NewTA {
  email: string;
  fullName: string;
  courses: string[];
  role: string;
  permissions: string[];
}

const PERMISSIONS = [
  { label: 'View Grades', value: 'view_grades' },
  { label: 'Manage Assignments', value: 'manage_assignments' },
];

const AddTaDropdown: React.FC<AddTaDropdownProps> = ({ open, onClose, onAdd, courses, roles, anchorRef }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const dropdownPortalRef = useRef<HTMLDivElement>(null);
  const [selectedFromDropdown, setSelectedFromDropdown] = useState(false);
  const dropdownJustSelected = useRef(false);

  // Show dropdown when input is focused and has text and results
  const handleEmailFocus = () => {
    if (email.length > 0 && searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  // Hide dropdown on blur (with a short delay to allow click)
  const handleEmailBlur = () => {
    setTimeout(() => {
      if (!dropdownJustSelected.current) {
        setShowSearchResults(false);
      }
      dropdownJustSelected.current = false;
    }, 150);
  };

  // Click outside detection
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node) &&
        (!dropdownPortalRef.current || !dropdownPortalRef.current.contains(event.target as Node))
      ) {
        // Only close if dropdownJustSelected is not set
        if (!dropdownJustSelected.current) {
          onClose();
        }
      }
      // Always reset the flag after any click
      dropdownJustSelected.current = false;
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  // Positioning: dropdown below the button
  useEffect(() => {
    if (open && anchorRef.current && dropdownRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownWidth = 320; // w-80 = 320px
      const dropdownHeight = dropdownRef.current.offsetHeight || 400; // fallback height
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 8;
      // Clamp right edge
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      // Clamp bottom edge
      if (top + dropdownHeight > window.innerHeight + window.scrollY - 16) {
        top = window.innerHeight + window.scrollY - dropdownHeight - 16;
      }
      setDropdownStyle({
        position: 'absolute',
        top,
        left,
        zIndex: 1000,
        minWidth: rect.width,
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        animation: 'fade-in 0.2s',
      });
    }
  }, [open, anchorRef]);

  // Prepare options for CustomDropdown
  const courseOptions = courses.filter(c => c.name !== 'All courses').map(c => ({ label: c.name, value: c.name, color: c.color }));
  const roleOptions = roles.map(r => ({ label: r, value: r }));

  const handleCourseChange = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  const handlePermissionChange = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // Search for TAs
  const searchTAs = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userManagementService.searchTAs(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching TAs:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email.length >= 1) {
        searchTAs(email);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [email]);

  // Calculate dropdown position when search results are shown
  useEffect(() => {
    if (showSearchResults && emailInputRef.current) {
      const rect = emailInputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showSearchResults]);

  // Email validation
  // Examples:
  // Valid: test@example.com, user.name+tag@domain.co.uk
  // Invalid: test@.com, @example.com, test@com
  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    // Improved email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  };

  // Validate on change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
    setSelectedFromDropdown(false);
    // Only open dropdown if there is text and results
    if (e.target.value.length > 0 && searchResults.length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = (user: any) => {
    setEmail(user.email);
    setShowSearchResults(false);
    setEmailError(null);
    setSelectedFromDropdown(true);
    dropdownJustSelected.current = true;
    if (emailInputRef.current) {
      emailInputRef.current.blur();
    }
  };

  // When searchResults change, if input is focused and has text, show dropdown
  useEffect(() => {
    if (document.activeElement === emailInputRef.current && email.length > 0 && searchResults.length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchResults]);

  const handleAdd = () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err || !fullName || selectedCourses.length === 0 || !role) return;
    // One TA per course
    const tas: NewTA[] = selectedCourses.map((course) => ({
      email,
      fullName,
      courses: [course],
      role,
      permissions,
    }));
    onAdd(tas);
    setEmail('');
    setFullName('');
    setSelectedCourses([]);
    setRole('');
    setPermissions([]);
    onClose();
  };

  if (!open) return null;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="w-80 animate-fade-in"
    >
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
        onClick={onClose}
        aria-label="Close"
        type="button"
        style={{ position: 'absolute', top: 12, right: 12 }}
      >
        ×
      </button>
      <h2 className="text-xl font-bold mb-4">Add TA</h2>
      <div className="mb-3 relative" style={{ overflow: 'visible' }}>
        <input
          ref={emailInputRef}
          type="email"
          className={`w-full border ${(!emailError && email && selectedFromDropdown) ? 'border-green-500' : 'border-gray-300'} bg-white rounded px-3 py-2 mb-2 focus:outline-none focus:ring ${emailError ? 'border-red-500' : ''}`}
          placeholder="Search by email"
          value={email}
          onChange={handleEmailChange}
          onFocus={handleEmailFocus}
          onBlur={handleEmailBlur}
          style={{ position: 'relative', zIndex: 20 }}
        />
        {/* Visual confirmation checkmark */}
        {(!emailError && email && selectedFromDropdown) && (
          <span className="absolute right-3 top-3 text-green-600 text-xl">✔</span>
        )}
        {showSearchResults && typeof window !== 'undefined' && createPortal(
          <div
            ref={dropdownPortalRef}
            className="bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999
            }}
          >
            {isSearching ? (
              <div className="p-3 text-gray-500 text-center">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.user_id}
                  className="w-full text-left p-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                  onMouseDown={() => handleSelectSearchResult(user)}
                  type="button"
                >
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </button>
              ))
            ) : email.length >= 1 ? (
              <div className="p-3 text-gray-500 text-center">No TAs found</div>
            ) : null}
          </div>,
          document.body
        )}
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
              onChange={() => handlePermissionChange(perm.value)}
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
          onClick={handleAdd}
          disabled={!!emailError || !email || !fullName || selectedCourses.length === 0 || !role}
          type="button"
        >
          Add
        </button>
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

export default AddTaDropdown; 