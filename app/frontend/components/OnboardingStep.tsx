// components/OnboardingStep.tsx
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import ReactDOM from 'react-dom';

interface Position {
  side: 'top' | 'bottom' | 'left' | 'right';
  alignment: 'start' | 'center' | 'end';
}

interface OnboardingStepProps {
  stepId: string;
  cardPosition: Position;
  message: string;
  targetElement: HTMLElement | null;
  onNext: () => void;
  onSkip: () => void;
  isVisible: boolean;
}

// padding around the highlight
const HIGHLIGHT_PADDING = 6;

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  stepId,
  cardPosition,
  message,
  targetElement,
  onNext,
  onSkip,
  isVisible
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<Position>({ side: 'bottom', alignment: 'center' });

  // 1) Highlight + outline
  useEffect(() => {
    if (!isVisible || !targetElement) return;
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const rect = targetElement.getBoundingClientRect();
    setHighlightRect(new DOMRect(
      rect.left - HIGHLIGHT_PADDING,
      rect.top - HIGHLIGHT_PADDING,
      rect.width + HIGHLIGHT_PADDING * 2,
      rect.height + HIGHLIGHT_PADDING * 2
    ));
    const prev = targetElement.style.outline;
    targetElement.style.outline = '2px solid white';
    return () => {
      targetElement.style.outline = prev;
      setHighlightRect(null);
    };
  }, [isVisible, targetElement]);

  // 2) Decide logical side (override or defaults)
  useEffect(() => {
    if (!isVisible) return;
    // special steps
    if (stepId === 'ellipsis-menu' || stepId === 'archived-button') {
      setPosition({ side: 'right', alignment: 'center' });
      return;
    }
    // explicit override
    if (cardPosition) {
      setPosition(cardPosition);
      return;
    }
    // else leave as default bottom/center
  }, [isVisible, stepId, cardPosition]);

  // don't render until we have a highlight
  if (!isVisible || !highlightRect) return null;

  // 3) Build the dark overlay mask
  const overlay = ReactDOM.createPortal(
    <>
      <div className="fixed bg-black/70 z-40 pointer-events-none"
        style={{ top: 0, left: 0, right: 0, height: highlightRect.top }} />
      <div className="fixed bg-black/70 z-40 pointer-events-none"
        style={{ top: highlightRect.bottom, left: 0, right: 0, bottom: 0 }} />
      <div className="fixed bg-black/70 z-40 pointer-events-none"
        style={{ top: highlightRect.top, left: 0, width: highlightRect.left, height: highlightRect.height }} />
      <div className="fixed bg-black/70 z-40 pointer-events-none"
        style={{ top: highlightRect.top, left: highlightRect.right, width: `calc(100vw - ${highlightRect.right}px)`, height: highlightRect.height }} />
    </>,
    document.body
  );

  // 4) Compute popup coords + transform
  const style: CSSProperties = { position: 'fixed' };
  let transform = '';
  const M = 8; // gap in px
  const SIDEBAR_EXTRA_SPACING = 20; // extra spacing for sidebar elements
  
  // Check if this is a sidebar element (Activity Monitor, etc.)
  const isSidebarElement = stepId === 'activity-monitor' || targetElement?.closest('[data-sidebar]');
  
  switch (position.side) {
    case 'left':
      style.left = highlightRect.left;
      style.top = highlightRect.top + highlightRect.height / 2;
      transform = 'translate(-100%, -50%)';
      break;
    case 'right':
      style.left = highlightRect.right + (isSidebarElement ? SIDEBAR_EXTRA_SPACING : 0);
      style.top = highlightRect.top + highlightRect.height / 2;
      transform = 'translate(0, -50%)';
      break;
    case 'top':
      style.left = highlightRect.left + highlightRect.width / 2;
      style.top = highlightRect.top;
      transform = 'translate(-50%, -100%)';
      break;
    default: // bottom
      style.left = highlightRect.left + highlightRect.width / 2;
      style.top = highlightRect.bottom;
      transform = 'translate(-50%, 0)';
  }
  style.transform = transform;

  // 5) Arrow position class
  const arrowClass = () => {
    switch (position.side) {
      case 'top': return 'top-full    left-1/2 -translate-x-1/2 -mt-2';
      case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 -mb-2';
      case 'left': return 'left-full   top-1/2 -translate-y-1/2 -ml-2';
      case 'right': return 'right-full  top-1/2 -translate-y-1/2 -mr-2';
    }
  };

  return (
    <>
      {overlay}
      <div ref={popupRef} className="z-50" style={style}>
        <div
          className={`absolute w-4 h-4 bg-white transform rotate-45 border border-gray-300 shadow-sm ${arrowClass()}`}
        />
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl min-w-[280px] max-w-[320px] backdrop-blur-sm">
          <div className="px-4 py-4">
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <button onClick={onSkip} className="text-gray-500 hover:text-gray-700 text-sm">
              Skip Tour
            </button>
            <button onClick={onNext} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingStep;
