import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Classroom, toggleClassroomStatus, deleteClassroom } from "../../services/classroom";
import toast from "react-hot-toast";
import Modal from './sub-components/Modal';

// ======================
// SECTION: Type Definitions
// ======================
/**
 * Props for the CourseCard component.
 * @interface CourseCardProps
 * @property {string} id - Unique identifier for the draggable card.
 * @property {Classroom} classroom - Classroom data to display.
 * @property {boolean} [darkMode=false] - Whether dark mode is enabled.
 * @property {() => void} refreshCourses - Callback to refresh the course list.
 */
interface CourseCardProps {
  id: string;
  classroom: Classroom;
  darkMode?: boolean;
  refreshCourses: () => void;
}

// ======================
// SECTION: Main Component
// ======================
/**
 * A draggable card component representing a classroom/course.
 * Supports editing, archiving, deleting, and navigation to course details.
 * @component
 * @param {CourseCardProps} props - Component props.
 * @returns {JSX.Element} The rendered CourseCard.
 */
const CourseCard: React.FC<CourseCardProps> = ({
  id,
  classroom,
  darkMode = false,
  refreshCourses,
}) => {
  // ======================
  // SECTION: State & Refs
  // ======================
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ======================
  // SECTION: Drag & Drop Setup
  // ======================
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
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  // ======================
  // SECTION: Event Handlers
  // ======================
  /**
   * Closes the menu when clicking outside of it.
   * @callback handleClickOutside
   * @param {MouseEvent} event - The mouse event.
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsMenuOpen(false);
    }
  }, []);

  /**
   * Toggles the options menu visibility.
   * @param {React.MouseEvent} e - The click event.
   */
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  /**
   * Converts a hex color to RGBA format with custom opacity.
   * @param {string} hex - The hex color code (e.g., "#3B82F6").
   * @param {number} opacity - The opacity value (0-1).
   * @returns {string} RGBA color string.
   */
  const hexToRgba = (hex: string, opacity: number): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  /**
   * Handles navigation to the course details page if not dragging.
   * @callback handleCardClick
   */
  const handleCardClick = useCallback(() => {
    if (!isDragging) {
      const currentUrl = window.location.pathname;
      const newUrl = currentUrl.endsWith('/')
        ? `${currentUrl}${classroom.classroom_id}`
        : `${currentUrl}/${classroom.classroom_id}`;
      window.location.href = newUrl;
    }
  }, [classroom.classroom_id, isDragging]);

  /**
   * Archives or unarchives the course.
   * @async
   */
  const handleArchive = async () => {
    try {
      await toggleClassroomStatus(classroom.classroom_id);
      refreshCourses();
      toast.success(`Course ${classroom.is_archived ? 'unarchived' : 'archived'} successfully!`, {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        }
      });
    } catch (error) {
      toast.error('Failed to update course status', {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        }
      });
    }
  };

  /**
   * Deletes the course.
   * @async
   */
  const handleDelete = async () => {
    try {
      await deleteClassroom(classroom.classroom_id);
      refreshCourses();
      toast.success('Course deleted successfully!', {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        }
      });
    } catch (error) {
      toast.error('Failed to delete course', {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        }
      });
    }
  };

  /**
   * Opens the edit modal.
   */
  const handleEdit = () => {
    setIsEditModalOpen(true);
    setIsMenuOpen(false);
  };

  // ======================
  // SECTION: Side Effects
  // ======================
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // ======================
  // SECTION: Render
  // ======================
  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          ...({ '--shadow-color': hexToRgba(classroom.class_colour ?? "#3B82F6", 0.2) } as React.CSSProperties),
        }}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={`flex lg:w-[300px] lg:h-[180px] w-[250px] h-[150px] rounded-[20px] overflow-hidden bg-white m-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.4,1)] relative ${isDragging ? 'shadow-lg scale-105 cursor-grabbing' : 'cursor-grab'
          } hover:scale-[1.02] hover:shadow-[0_12px_28px_var(--shadow-color),0_3px_6px_rgba(0,0,0,0.1)]`}
      >
        {/* Left (content) section */}
        <div className="flex-1 flex flex-col justify-between py-5 px-4">
          <div>
            <div className="font-medium text-[16px] text-[#222] mb-2">
              {classroom.code.toUpperCase()}{classroom.section ? ` - ${classroom.section}` : ''}
            </div>
            <div className="font-semibold text-[20px] text-[#222]">
            {classroom.name}
            </div>
          </div>

          <div className="text-[14px] text-[#222]">
            <div>Students: {classroom.student_count || 0}</div>
            <div>End Date: {new Date(classroom.end_date).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Right (color + menu) section */}
        <div
          className="w-[90px] rounded-tr-[20px] rounded-br-[20px] relative"
          style={{ backgroundColor: classroom.class_colour ?? "#3B82F6" }}
        >
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-all duration-200 group"
            aria-label="More options"
            data-onboarding="ellipsis-menu"
          >
            <div className="flex flex-col items-center justify-center space-y-1 h-6 w-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-30 group-hover:opacity-100 group-hover:[animation:wave_1s_infinite_ease-in-out_0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-30 group-hover:opacity-100 group-hover:[animation:wave_1s_infinite_ease-in-out_0.4s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-30 group-hover:opacity-100 group-hover:[animation:wave_1s_infinite_ease-in-out_0.6s]" />
            </div>
          </button>

          {/* Options menu */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-1 w-[120px] bg-white rounded-lg shadow-lg z-10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={handleArchive}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {classroom.is_archived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          mode="edit"
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={() => refreshCourses()}
          darkMode={darkMode}
          initialData={{
            name: classroom.name || "",
            code: classroom.code || "",
            section: classroom.section || "",
            startDate: classroom.start_date || "",
            endDate: classroom.end_date || "",
            term: classroom.term || "",
            class_colour: classroom.class_colour || "#3B82F6",
            courseId: classroom.classroom_id,
            student_count: classroom.student_count || 0,
          }}
        />
      )}

      {/* Animation style for menu dots */}
      <style>{`
        @keyframes wave {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
};

export default CourseCard;