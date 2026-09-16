import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [smartPosition, setSmartPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  // Smart positioning logic
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let newPosition = position;
      
      // Check if tooltip would be cut off at the top
      if (position === 'top' && rect.top < tooltipRect.height + 10) {
        newPosition = 'bottom';
      }
      // Check if tooltip would be cut off at the bottom
      else if (position === 'bottom' && rect.bottom + tooltipRect.height + 10 > window.innerHeight) {
        newPosition = 'top';
      }
      // Check if tooltip would be cut off on the left
      else if (position === 'left' && rect.left < tooltipRect.width + 10) {
        newPosition = 'right';
      }
      // Check if tooltip would be cut off on the right
      else if (position === 'right' && rect.right + tooltipRect.width + 10 > window.innerWidth) {
        newPosition = 'left';
      }
      
      setSmartPosition(newPosition);
    }
  }, [isVisible, position]);

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div ref={tooltipRef} className={`absolute z-50 ${positionClasses[smartPosition]}`}>
          <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-4 max-w-md shadow-lg">
            <div className="whitespace-normal break-words leading-relaxed">
              {content}
            </div>
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              smartPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              smartPosition === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              smartPosition === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip; 