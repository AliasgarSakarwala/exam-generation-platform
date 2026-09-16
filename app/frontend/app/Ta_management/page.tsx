'use client';

import React, { useState, useRef, useEffect } from "react";
import CourseListSidebar from "../components/CourseListSidebar";
import TaCard from "../components/TaCard";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AddTaDropdown, { NewTA } from "../components/AddTaDropdown";
import CustomDropdown from "../components/CustomDropdown";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditTaModal from "../components/EditTaModal";
import { userManagementService } from "../../services/user_management";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

// Type definitions
type TA = {
  id: string;
  fullName: string;
  email: string;
  courses: string[];
  color: string;
  role: string;
  status: string;
  view_grades?: boolean;
  manage_assignments?: boolean;
};

type Columns = {
  invited: TA[];
  active: TA[];
  archived: TA[];
};

// Droppable Column Component
const DroppableColumn = ({ 
  id, 
  title, 
  children, 
  className 
}: { 
  id: string; 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow p-4 min-h-[400px] ${className || ''}`}
      data-column={id}
    >
      <h2 className="font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
};

const roles = ["Grader", "Lab TA", "Lead TA"];


export default function TaManagementPage() {
  const [selectedCourse, setSelectedCourse] = useState("All courses");
  const [columns, setColumns] = useState<Columns>({ invited: [], active: [], archived: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [newTA, setNewTA] = useState({ email: "", role: "Grader", course: "", color: "" });
  const [draggedItem, setDraggedItem] = useState<TA | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fullName: string; course: string; column: keyof Columns } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  
  // Refs for column positions
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // State for real classrooms
  const [realClassrooms, setRealClassrooms] = useState<any[]>([]);

  // Create a map of course names to colors for easy lookup
  const courseColors: { [key: string]: string } = {};
  if (Array.isArray(realClassrooms)) {
    realClassrooms.forEach(classroom => {
      courseColors[classroom.name] = classroom.color;
    });
  }

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch real classroom data
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const classrooms = await userManagementService.getAvailableClassrooms();
        setRealClassrooms(classrooms);
      } catch (error) {
        console.error('Error fetching classrooms:', error);
      }
    };

    fetchClassrooms();
  }, []);

  // Fetch TA data from backend
  useEffect(() => {
    const fetchUserManagement = async () => {
      try {
        const userManagementData = await userManagementService.getAll();
        
        // Transform backend data to frontend TA format
        const transformedData: Columns = {
          invited: [],
          active: [],
          archived: []
        };

        userManagementData.forEach((item: any) => {
          // Convert backend permissions to frontend format
          const permissions = [];
          if (item.view_grades) permissions.push('view_grades');
          if (item.manage_assignments) permissions.push('manage_assignments');
          
          const ta: TA = {
            id: item.um_id.toString(),
            fullName: item.full_name || item.user?.username || 'Unknown User',
            email: item.user?.email || '',
            courses: item.classroom ? [item.classroom.code] : [],
            color: item.classroom?.class_colour || '#6B7280',
            role: item.responsibility,
            status: item.status.toLowerCase(),
            view_grades: item.view_grades,
            manage_assignments: item.manage_assignments
          };

          // Map backend status to frontend columns
          switch (item.status.toLowerCase()) {
            case 'invited':
              transformedData.invited.push(ta);
              break;
            case 'active':
              transformedData.active.push(ta);
              break;
            case 'archived':
              transformedData.archived.push(ta);
              break;
            default:
              transformedData.invited.push(ta);
          }
        });

        setColumns(transformedData);
      } catch (error) {
        console.error('Error fetching user management data:', error);
      }
    };

    fetchUserManagement();
  }, []);

  // Filter TAs based on selected course
  const getFilteredColumns = (): Columns => {
    if (selectedCourse === "All courses") {
      return columns;
    }
    
    const filteredColumns: Columns = {
      invited: columns.invited.filter((ta: TA) => ta.courses.includes(selectedCourse)),
      active: columns.active.filter((ta: TA) => ta.courses.includes(selectedCourse)),
      archived: columns.archived.filter((ta: TA) => ta.courses.includes(selectedCourse)),
    };
    
    return filteredColumns;
  };

  // Get available courses for dropdown
  const getAvailableCourses = () => {
    const dummyCourses = [
      { name: "All courses", color: "#6B7280" }
    ];
    
    // Add real classrooms from backend, safely
    const realCourses = Array.isArray(realClassrooms)
      ? realClassrooms.map(classroom => ({
          name: classroom.name,
          color: classroom.color
        }))
      : [];

    return [...dummyCourses, ...realCourses];
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    
    // Find the dragged item data
    let foundItem: TA | null = null;
    (Object.keys(columns) as Array<keyof Columns>).forEach((columnKey) => {
      const columnArr: TA[] = columns[columnKey];
      const item = columnArr.find((ta: TA) => ta.id === activeId);
      if (item) {
        foundItem = item;
      }
    });
    
    setDraggedItem(foundItem);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active item is in
    let activeColumn: keyof Columns | null = null;
    (Object.keys(columns) as Array<keyof Columns>).forEach((columnKey) => {
      const columnArr: TA[] = columns[columnKey];
      if (columnArr.find((ta: TA) => ta.id === activeId)) {
        activeColumn = columnKey;
      }
    });

    if (!activeColumn) {
      setDraggedItem(null);
      return;
    }

    // Determine target column and index
    let targetColumn: keyof Columns | null = null;
    let targetIndex = 0;

    // Check if dropping on a column container
    if (['invited', 'active', 'archived'].includes(overId)) {
      targetColumn = overId as keyof Columns;
      targetIndex = columns[targetColumn].length; // Add to end
    } else {
      // Dropping on another item
      (Object.keys(columns) as Array<keyof Columns>).forEach((columnKey) => {
        const columnArr: TA[] = columns[columnKey];
        const itemIndex = columnArr.findIndex((ta: TA) => ta.id === overId);
        if (itemIndex !== -1) {
          targetColumn = columnKey;
          targetIndex = itemIndex;
        }
      });
    }

    if (!targetColumn) {
      setDraggedItem(null);
      return;
    }

    // If dropping in the same column, just reorder
    if (activeColumn === targetColumn) {
      const columnArr: TA[] = columns[activeColumn];
      const oldIndex = columnArr.findIndex((ta: TA) => ta.id === activeId);
      const newIndex = targetIndex;

      if (oldIndex === newIndex) {
        setDraggedItem(null);
        return; // No change needed
      }

      const newColumn = [...columnArr];
      const [removed] = newColumn.splice(oldIndex, 1);
      newColumn.splice(newIndex, 0, removed);

      const newColumns = {
        ...columns,
        [activeColumn]: newColumn,
      };
      
      setColumns(newColumns);
    } else {
      // Moving between columns
      const activeColumnArr: TA[] = columns[activeColumn];
      const targetColumnArr: TA[] = columns[targetColumn];
      
      const activeItem = activeColumnArr.find((ta: TA) => ta.id === activeId);
      if (!activeItem) {
        setDraggedItem(null);
        return;
      }

      const newActiveColumn = activeColumnArr.filter((ta: TA) => ta.id !== activeId);
      const newTargetColumn = [...targetColumnArr];
      
      // Update the status of the moved item
      const updatedItem = { ...activeItem, status: targetColumn };
      newTargetColumn.splice(targetIndex, 0, updatedItem);

      const newColumns = {
        ...columns,
        [activeColumn]: newActiveColumn,
        [targetColumn]: newTargetColumn,
      };
      
      setColumns(newColumns);

      // Update backend with new status
      try {
                const newStatus = targetColumn;
        
        await userManagementService.update(parseInt(activeId), {
          status: newStatus
        });
      } catch (error) {
        console.error('Error updating user management status:', error);
        // Revert the change if backend update fails
        setColumns(columns);
      }
    }

    setDraggedItem(null);
  };

  // Add TA handler for modal
  const handleAddTAs = async (tas: NewTA[]) => {
    try {
      for (const ta of tas) {
        // Find the user ID from the search results or backend (for now, assume email is unique and search for user)
        const users = await userManagementService.searchTAs(ta.email);
        const user = users.find((u: any) => u.email === ta.email);
        if (!user) continue;
        for (const course of ta.courses) {
          const classroom = realClassrooms.find((c: any) => c.name === course);
          if (!classroom) continue;
          await userManagementService.create({
            classroom_id: classroom.classroom_id,
            user_id: user.user_id,
            responsibility: ta.role,
            status: 'invited',
            full_name: ta.fullName,
            view_grades: ta.permissions.includes('view_grades'),
            manage_assignments: ta.permissions.includes('manage_assignments')
          });
        }
      }
      // Refresh TA list
      const userManagementData = await userManagementService.getAll();
      const transformedData: Columns = { invited: [], active: [], archived: [] };
      userManagementData.forEach((item: any) => {
        // Convert backend permissions to frontend format
        const permissions = [];
        if (item.view_grades) permissions.push('view_grades');
        if (item.manage_assignments) permissions.push('manage_assignments');
        
        const ta: TA = {
          id: item.um_id.toString(),
          fullName: item.full_name || item.user?.username || 'Unknown User',
          email: item.user?.email || '',
          courses: item.classroom ? [item.classroom.code] : [],
          color: item.classroom?.class_colour || '#6B7280',
          role: item.responsibility,
          status: item.status.toLowerCase(),
          view_grades: item.view_grades,
          manage_assignments: item.manage_assignments
        };
        switch (item.status.toLowerCase()) {
          case 'invited':
            transformedData.invited.push(ta);
            break;
          case 'active':
            transformedData.active.push(ta);
            break;
          case 'archived':
            transformedData.archived.push(ta);
            break;
          default:
            transformedData.invited.push(ta);
        }
      });
      setColumns(transformedData);
    } catch (error) {
      console.error('Error adding TA(s):', error);
    }
  };

  // Delete handler for TaCard
  const handleDeleteClick = (id: string, fullName: string, course: string, column: keyof Columns) => {
    setDeleteTarget({ id, fullName, course, column });
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, column } = deleteTarget;
    
    try {
      // Call backend to delete the record
      await userManagementService.delete(parseInt(id));
      
      // Update frontend state after successful deletion
      const newColumns = {
        ...columns,
        [column]: (columns[column as keyof Columns] as TA[]).filter((ta: any) => ta.id !== id),
      };
      setColumns(newColumns);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting TA:', error);
      // You could add a toast notification here for user feedback
      alert('Failed to delete TA. Please try again.');
    }
  };

  // Edit handler for TaCard
  const handleEditClick = (ta: any, column: keyof Columns) => {
    // Convert backend permissions to frontend format
    const permissions = [];
    if (ta.view_grades) permissions.push('view_grades');
    if (ta.manage_assignments) permissions.push('manage_assignments');
    
    setEditTarget({ 
      ...ta, 
      column,
      permissions 
    });
    setEditModalOpen(true);
  };

  // Confirm edit
  const handleSaveEdit = async (updatedTA: any) => {
    if (!editTarget) return;
    const { id, column } = editTarget;
    
    try {
      // Prepare the update data
      const updateData: any = {};
      
      // Map frontend fields to backend fields
      if (updatedTA.role) updateData.responsibility = updatedTA.role;
      if (updatedTA.fullName) updateData.full_name = updatedTA.fullName;
      if (updatedTA.permissions) {
        updateData.view_grades = updatedTA.permissions.includes('view_grades');
        updateData.manage_assignments = updatedTA.permissions.includes('manage_assignments');
      }
      
      // Call backend to update the record
      await userManagementService.update(parseInt(id), updateData);
      
      // Update frontend state after successful update
      const newColumns = {
        ...columns,
        [column]: (columns[column as keyof Columns] as TA[]).map((ta: any) =>
          ta.id === id ? { ...ta, ...updatedTA } : ta
        ),
      };
      setColumns(newColumns);
      setEditModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      console.error('Error updating TA:', error);
      // You could add a toast notification here for user feedback
      alert('Failed to update TA. Please try again.');
    }
  };

  // Get filtered columns for display
  const filteredColumns = getFilteredColumns();

  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const { user } = useAuth ? useAuth() : { user: null };

  // Sidebar buttons (same as course/exam page)
  const middleButtons = [
    {
      label: 'Live Courses',
      alt: 'Live Courses',
      iconSrc: '/cap.svg',
      onClick: () => router.push('/'),
    },
    {
      label: 'Dashboard',
      alt: 'Dashboard',
      iconSrc: '/home.svg',
      onClick: () => window.location.reload(),
    },
    {
      label: 'Question Banks',
      alt: 'Question Banks',
      iconSrc: '/question-bank.svg',
      onClick: () => router.push('/[course_id]/questions'),
    },
    {
      label: 'Students',
      alt: 'Students',
      iconSrc: '/students.svg',
      onClick: () => router.push('/[course_id]/students'),
    },
    {
      label: 'Course Analytics',
      alt: 'Course Analytics',
      iconSrc: '/line-chart-line.svg',
      onClick: () => router.push('/[course_id]/analytics'),
    },
    {
      label: 'Users',
      alt: 'Users',
      iconSrc: '/ManageTAs.svg',
      onClick: () => router.push('/Ta_management'),
    },
  ];

  // Don't render drag and drop components until client-side
  if (!isClient) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <CourseListSidebar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          archived={user?.role === 'Admin'}
          middleButtons={middleButtons}
        />
        <div className="flex-1 bg-gray-50 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Manage TAs</h1>
                          <CustomDropdown
              options={getAvailableCourses().map(c => ({ label: c.name, value: c.name, color: c.color }))}
              value={selectedCourse}
              onChange={v => setSelectedCourse(typeof v === 'string' ? v : v[0])}
              placeholder="All courses"
              labelRenderer={opt => (
                <span className="font-semibold" style={{ color: opt.color }}>{opt.label}</span>
              )}
              className="min-w-[140px]"
            />
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setShowAdd(true)}
            >
              + Add TA
            </button>
          </div>

          {/* Loading state */}
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#EDEDED" }}>
      <CourseListSidebar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        archived={user?.role === 'Admin'}
        middleButtons={middleButtons}
      />
      <div className="flex-1 p-8">    
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Manage TAs</h1>
            <CustomDropdown
              options={getAvailableCourses().map(c => ({ label: c.name, value: c.name, color: c.color }))}
              value={selectedCourse}
              onChange={v => setSelectedCourse(typeof v === 'string' ? v : v[0])}
              placeholder="All courses"
              labelRenderer={opt => (
                <span className="font-semibold" style={{ color: opt.color }}>{opt.label}</span>
              )}
              className="min-w-[140px]"
            />
          </div>
          <button
            ref={addButtonRef}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowAdd((prev) => !prev)}
          >
            + Add TA
          </button>
          <AddTaDropdown
            open={showAdd}
            onClose={() => setShowAdd(false)}
            onAdd={handleAddTAs}
            courses={Array.isArray(realClassrooms) ? realClassrooms.map(c => ({ name: c.name, color: c.color })) : []}
            roles={["Grader", "Lab TA", "Lead TA"]}
            anchorRef={addButtonRef}
          />
        </div>

        {/* Course filter info */}
        {selectedCourse !== "All courses" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            Showing TAs for: <strong>{selectedCourse}</strong>
          </div>
        )}

        <DeleteConfirmModal
          open={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
          onConfirm={handleConfirmDelete}
          taName={deleteTarget?.fullName || ''}
          course={deleteTarget?.course || ''}
        />

        <EditTaModal
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditTarget(null); }}
          onSave={handleSaveEdit}
          ta={editTarget}
          courses={Array.isArray(realClassrooms) ? realClassrooms.map(c => ({ name: c.name, color: c.color })) : []}
          roles={["Grader", "Lab TA", "Lead TA"]}
        />

        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Invited Column */}
            <DroppableColumn id="invited" title="Invited" className="bg-white/80 border border-gray-300 rounded-xl shadow-md p-6 min-h-[500px] transition-shadow">
              <SortableContext items={filteredColumns.invited.map((ta) => ta.id)} strategy={verticalListSortingStrategy}>
                {filteredColumns.invited.map((ta) => (
                  <TaCard 
                    key={ta.id} 
                    id={ta.id}
                    fullName={ta.fullName} 
                    courses={ta.courses} 
                    color={ta.color} 
                    role={ta.role} 
                    courseColors={courseColors}
                    onDelete={() => handleDeleteClick(ta.id, ta.fullName, ta.courses[0], "invited")}
                    onEdit={() => handleEditClick(ta, "invited")}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
            {/* Active Column */}
            <DroppableColumn id="active" title="Active" className="bg-white/80 border border-gray-300 rounded-xl shadow-md p-6 min-h-[500px] transition-shadow">
              <SortableContext items={filteredColumns.active.map((ta) => ta.id)} strategy={verticalListSortingStrategy}>
                {filteredColumns.active.map((ta) => (
                  <TaCard 
                    key={ta.id} 
                    id={ta.id}
                    fullName={ta.fullName} 
                    courses={ta.courses} 
                    color={ta.color} 
                    role={ta.role} 
                    courseColors={courseColors}
                    onDelete={() => handleDeleteClick(ta.id, ta.fullName, ta.courses[0], "active")}
                    onEdit={() => handleEditClick(ta, "active")}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
            {/* Archived Column */}
            <DroppableColumn id="archived" title="Archived" className="bg-white/80 border border-gray-300 rounded-xl shadow-md p-6 min-h-[500px] transition-shadow">
              <SortableContext items={filteredColumns.archived.map((ta) => ta.id)} strategy={verticalListSortingStrategy}>
                {filteredColumns.archived.map((ta) => (
                  <TaCard 
                    key={ta.id} 
                    id={ta.id}
                    fullName={ta.fullName} 
                    courses={ta.courses} 
                    color={ta.color} 
                    role={ta.role} 
                    courseColors={courseColors}
                    onDelete={() => handleDeleteClick(ta.id, ta.fullName, ta.courses[0], "archived")}
                    onEdit={() => handleEditClick(ta, "archived")}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          </div>
          
          {/* Drag Overlay - This keeps the card visible during drag */}
          <DragOverlay>
            {draggedItem ? (
              <div className="bg-white rounded shadow p-3 mb-3 flex items-center justify-between cursor-grabbing opacity-90 transform rotate-2 scale-105">
                <div>
                  <div className="font-medium text-gray-900">{draggedItem.fullName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-semibold rounded px-2 py-1"
                      style={{ backgroundColor: draggedItem.color, color: "#222" }}
                    >
                      {draggedItem.courses.join(", ")}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1">
                      {draggedItem.role}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
} 