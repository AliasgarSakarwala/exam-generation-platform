"use client";

import React, { useState, useEffect } from "react";
import CourseListSidebar from "../components/CourseListSidebar";
import CourseListHeader from "../components/CourseListHeader";
import CourseCard from "../components/CourseCard";
import { getArchivedClassrooms, Classroom } from "@/services/classroom";
import toast from "react-hot-toast";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRouter } from "next/navigation";

/**
 * ArchivedCoursesPage - Main component for displaying and managing archived courses.
 * 
 * Features:
 * - Dark mode toggle
 * - Archived course fetching and display
 * - Drag-and-drop course reordering
 * - Search and filter functionality
 * - Error handling with toast notifications
 * - Responsive grid layout
 * 
 * State Management:
 * - Uses React hooks for local state
 * - Maintains separate states for original and filtered courses
 * - Loading and error states for API calls
 * 
 * Dependencies:
 * - dnd-kit for drag-and-drop functionality
 * - react-hot-toast for notifications
 * - Next.js router for navigation
 */
export default function ArchivedCoursesPage() {
    // ==== THEME STATE ====
    const [darkMode, setDarkMode] = useState(false);

    // ==== COURSE DATA STATES ====
    const [courses, setCourses] = useState<Classroom[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Classroom[]>([]);

    // ==== LOADING STATES ====
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==== HOOK INITIALIZATION ====
    const router = useRouter();

    // ==== DRAG AND DROP CONFIGURATION ====
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 0 },
        }),
        useSensor(KeyboardSensor)
    );

    // ==== DATA FETCHING ====
    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getArchivedClassrooms();

            if (response.status === 200) {
                setCourses(response.data);
                setFilteredCourses(response.data);
            } else {
                throw new Error('Failed to fetch archived courses');
            }
        } catch (err) {
            setError('Failed to load archived courses');
            toast.error('Failed to load archived courses ❌', {
                position: "bottom-center",
                style: {
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch courses on component mount
    useEffect(() => {
        fetchCourses();
    }, []);

    // ==== DRAG AND DROP HANDLERS ====
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFilteredCourses((items) => {
                const oldIndex = items.findIndex(item => item.classroom_id.toString() === active.id);
                const newIndex = items.findIndex(item => item.classroom_id.toString() === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // ==== COURSE MANAGEMENT HANDLERS ====
    const handleCourseCreated = () => {
        fetchCourses();
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const filteredCourses = courses.filter((course) =>
            course.name.toLowerCase().includes(value.toLowerCase()));
        setFilteredCourses(filteredCourses);
    };

    const handleFilter = (filter: string) => {
        let sorted: Classroom[];
        if (filter === 'code-asc') {
            sorted = [...filteredCourses].sort((a, b) => +a.code - +b.code);
        } else if (filter === 'code-desc') {
            sorted = [...filteredCourses].sort((a, b) => +b.code - +a.code);
        } else {
            toast.error('Feature not available yet', {
                position: "bottom-center",
                style: {
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                }
            });
            return;
        }
        setFilteredCourses(sorted);
    };

    // ==== RENDER LOGIC ====
    return (
        <div className={`flex min-h-[450px] min-w-[500px] overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}
            style={{ height: '100vh', maxHeight: '100vh' }}>
            {/* SIDEBAR COMPONENT */}
            <CourseListSidebar
                darkMode={darkMode}
                archived={true}

                onToggleDarkMode={() => setDarkMode((prev) => !prev)}

                middleButtons={[
                    {
                        label: 'Live Courses',
                        alt: 'Live Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Archived',
                        alt: 'Archived',
                        iconSrc: '/Archived.svg',
                        onClick: () => router.push('/archived'),
                    },
                ]}
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col flex-1 lg:px-8 lg:py-8 px-6 py-6 overflow-hidden">
                {/* HEADER WITH SEARCH/FILTER */}
                <CourseListHeader search={handleSearch} handleFilter={handleFilter} />
                <div className="mt-6" />

                {/* COURSE LIST HEADER */}
                <div className="flex items-center justify-between mb-8 px-6">
                    <h2 className={`text-2xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Archived Courses
                    </h2>
                </div>

                {/* COURSE LIST CONTENT */}
                <div className="flex-1 overflow-y-auto px-6 min-h-[200px]">
                    {isLoading ? (
                        // Loading state
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        // Error state
                        <div className={`text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                            {error}
                        </div>
                    ) : courses.length === 0 ? (
                        // Empty state
                        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-full h-full flex items-center justify-center text-xl`}>
                            No archived courses found
                        </div>
                    ) : (
                        // Course grid with drag-and-drop context
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[
                                ({ transform }) => ({
                                    ...transform,
                                    x: transform.x * 1.25,
                                    y: transform.y * 1.25,
                                }),
                            ]}
                        >
                            <SortableContext
                                items={filteredCourses.map(course => course.classroom_id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 md:gap-6 gap-1 pb-8">
                                    {filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course.classroom_id}
                                            id={course.classroom_id.toString()}
                                            classroom={course}
                                            darkMode={darkMode}
                                            refreshCourses={fetchCourses}
                                            //isArchived={true}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}