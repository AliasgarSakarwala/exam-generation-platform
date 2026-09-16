import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
  color?: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multi?: boolean;
  labelRenderer?: (option: Option) => React.ReactNode;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multi = false,
  labelRenderer,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Handle select
  const handleSelect = (option: Option) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.includes(option.value)) {
        onChange(arr.filter((v) => v !== option.value));
      } else {
        onChange([...arr, option.value]);
      }
    } else {
      onChange(option.value);
      setOpen(false);
    }
  };

  // Render selected label(s)
  let displayLabel: React.ReactNode = placeholder;
  if (multi && Array.isArray(value) && value.length > 0) {
    const selectedOptions = options.filter((opt) => value.includes(opt.value));
    displayLabel = selectedOptions.map((opt, index) => (
      <React.Fragment key={opt.value}>
        {labelRenderer ? labelRenderer(opt) : opt.label}
        {index < selectedOptions.length - 1 && ', '}
      </React.Fragment>
    ));
  } else if (!multi && typeof value === 'string' && value) {
    const opt = options.find((o) => o.value === value);
    displayLabel = opt ? (labelRenderer ? labelRenderer(opt) : opt.label) : placeholder;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ minWidth: 180 }}>
      <button
        type="button"
        className={`w-full flex items-center justify-between border rounded px-3 py-2 bg-white focus:outline-none focus:ring transition shadow-sm ${open ? 'ring-2 ring-blue-400' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate text-left flex-1">{displayLabel}</span>
        <svg className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-lg z-50 max-h-60 overflow-auto animate-fade-in">
          {options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 ${multi ? '' : 'transition'}`}
              onClick={() => handleSelect(option)}
            >
              {multi && (
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={() => handleSelect(option)}
                  className="accent-blue-600 mr-2"
                  onClick={e => e.stopPropagation()}
                />
              )}
              {labelRenderer ? labelRenderer(option) : (
                <span className="truncate" style={option.color ? { color: option.color } : {}}>{option.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown; 