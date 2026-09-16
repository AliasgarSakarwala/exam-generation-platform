import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// If using Next.js Image, uncomment the next line:
// import Image from 'next/image';

interface TaCardProps {
  id: string;
  fullName: string;
  courses: string[];
  color: string;
  role: string;
  onDelete?: () => void;
  onEdit?: () => void;
  courseColors?: { [key: string]: string }; // Map of course name to color
}

const TaCard: React.FC<TaCardProps> = ({ id, fullName, courses, color, role, onDelete, onEdit, courseColors }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Function to calculate appropriate text color based on background color
  const getContrastTextColor = (backgroundColor: string): string => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Ensure courses is always an array
  const coursesArray = courses || [];

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-lg p-4 mb-6 flex flex-col justify-between min-h-[90px] transition-shadow hover:shadow-xl">
      {/* Edit icon top right */}
      <button
        className="absolute top-2 right-2 p-1 z-10"
        onClick={onEdit}
        aria-label="Edit TA"
        type="button"
      >
        <img
          src="/edit.svg"
          alt="Edit"
          width={20}
          height={20}
          className="transition-transform duration-150 hover:scale-125 hover:filter hover:brightness-125 hover:drop-shadow-[0_2px_6px_rgba(59,130,246,0.15)]"
        />
      </button>
      {/* Delete icon bottom right */}
      <button
        className="absolute bottom-2 right-2 p-1 z-10"
        onClick={onDelete}
        aria-label="Delete TA"
        type="button"
      >
        <img
          src="/delete.svg"
          alt="Delete"
          width={20}
          height={20}
          className="transition-transform duration-150 hover:scale-125 hover:filter-[invert(18%)_sepia(99%)_saturate(7493%)_hue-rotate(1deg)_brightness(97%)_contrast(119%)]"
        />
      </button>
      
      {/* Draggable content area */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div>
          <div className="font-medium text-gray-900">{fullName}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {coursesArray.map((course) => {
              const bgColor = courseColors?.[course] || color;
              const textColor = getContrastTextColor(bgColor);
              return (
                <span
                  key={course}
                  className="text-xs font-semibold rounded px-2 py-1"
                  style={{ 
                    backgroundColor: bgColor, 
                    color: textColor 
                  }}
                >
                  {course}
                </span>
              );
            })}
            <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1">
              {role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaCard; 