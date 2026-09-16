"use client";

import React, { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateClassroom, CreateClassroomParams } from "../../../services/classroom";

interface EditModalProps {
    darkMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (updatedData: {
        name: string;
        code: string;
        section: string;
        startDate: string;
        endDate: string;
        term: string;
        class_colour: string;
        courseId: number;
    }) => void;
    initialData: {
        name: string;
        code: string;
        section: string;
        startDate: string;
        endDate: string;
        term: string;
        class_colour: string;
        courseId: number;
        student_count: number;
    };
}

interface AnimatedDropdownProps {
    value: string;
    onChange: (value: string) => void;
    darkMode: boolean;
}

const AnimatedTermDropdown: React.FC<AnimatedDropdownProps> = ({ value, onChange, darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const termOptions = [
        "Fall - Term 1",
        "Winter - Term 1 & 2",
        "Winter - Term 2",
        "Summer - Term 1 & 2",
        "Summer - Term 1",
        "Summer - Term 2",
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    const baseClasses = "w-full p-3 text-sm rounded-lg border transition-colors duration-200";
    const modeClasses = darkMode
        ? "bg-zinc-700 border-zinc-600 text-white focus:ring-blue-500 focus:border-blue-500"
        : "bg-white border-gray-300 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500";

    const dropdownMenuClasses = darkMode
        ? "bg-zinc-700 border-zinc-600"
        : "bg-white border-gray-200";

    return (
        <div className="relative" ref={dropdownRef}>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Term <span className="text-red-500">*</span>
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`${baseClasses} ${modeClasses} flex justify-between items-center text-left`}
            >
                <span>{value || "Select Term"}</span>
                <svg
                    className={`w-4 h-4 transition-transform duration-300 transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <div
                className={`absolute z-20 w-full mt-2 rounded-lg shadow-xl overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${dropdownMenuClasses}
                    ${isOpen ? "transform opacity-100 scale-100" : "transform opacity-0 scale-95 pointer-events-none"}`}
            >
                <ul className="max-h-60 overflow-y-auto">
                    {termOptions.map((option) => (
                        <li
                            key={option}
                            onClick={() => handleSelect(option)}
                            className={`p-3 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between
                                ${darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-100"}
                                ${value === option ? (darkMode ? "bg-zinc-600" : "bg-gray-100") : ""}`}
                        >
                            {option}
                            {value === option && (
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default function EditModal({
    darkMode = false,
    isOpen,
    onClose,
    onSubmit,
    initialData,
}: EditModalProps) {
    const [courseData, setCourseData] = useState({
        name: initialData.name,
        code: initialData.code,
        section: initialData.section,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        term: initialData.term,
        class_colour: initialData.class_colour,
        student_count: initialData.student_count,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form when initialData changes
    useEffect(() => {
        setCourseData({
            name: initialData.name,
            code: initialData.code,
            section: initialData.section,
            startDate: initialData.startDate,
            endDate: initialData.endDate,
            term: initialData.term,
            class_colour: initialData.class_colour,
            student_count: initialData.student_count,
        });
    }, [initialData]);

    useEffect(() => {
        if (courseData.startDate && courseData.endDate) {
            const start = new Date(courseData.startDate);
            const end = new Date(courseData.endDate);

            if (end < start) {
                toast.error("End date must be after start date");
                return;
            }

            const startMonth = start.getMonth() + 1;
            const endMonth = end.getMonth() + 1;

            let term = "";
            if ((startMonth >= 9 && startMonth <= 12) && (endMonth >= 1 && endMonth <= 4)) {
                term = "Winter - Term 1 & 2";
            } else if (startMonth >= 9 && endMonth <= 12) {
                term = "Fall - Term 1";
            } else if (startMonth >= 1 && endMonth <= 4) {
                term = "Winter - Term 2";
            } else if (startMonth >= 5 && endMonth <= 8) {
                if (startMonth <= 6 && endMonth >= 7) {
                    term = "Summer - Term 1 & 2";
                } else if (endMonth <= 6) {
                    term = "Summer - Term 1";
                } else {
                    term = "Summer - Term 2";
                }
            }

            setCourseData(prev => ({ ...prev, term }));
        }
    }, [courseData.startDate, courseData.endDate]);

    const handleTermChange = (term: string) => {
        let startDate = "";
        let endDate = "";

        switch (term) {
            case "Fall - Term 1":
                startDate = `${new Date().getFullYear()}-09-01`;
                endDate = `${new Date().getFullYear()}-12-31`;
                break;
            case "Winter - Term 1 & 2":
                startDate = `${new Date().getFullYear()}-09-01`;
                endDate = `${new Date().getFullYear() + 1}-04-30`;
                break;
            case "Winter - Term 2":
                startDate = `${new Date().getFullYear() + 1}-01-01`;
                endDate = `${new Date().getFullYear() + 1}-04-30`;
                break;
            case "Summer - Term 1 & 2":
                startDate = `${new Date().getFullYear() + 1}-05-01`;
                endDate = `${new Date().getFullYear() + 1}-08-31`;
                break;
            case "Summer - Term 1":
                startDate = `${new Date().getFullYear() + 1}-05-01`;
                endDate = `${new Date().getFullYear() + 1}-06-30`;
                break;
            case "Summer - Term 2":
                startDate = `${new Date().getFullYear() + 1}-07-01`;
                endDate = `${new Date().getFullYear() + 1}-08-31`;
                break;
        }

        setCourseData(prev => ({ ...prev, term, startDate, endDate }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCourseData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const randomizeColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        setCourseData(prev => ({ ...prev, class_colour: color }));
    };

    const validateCourseCode = (code: string) => {
        return /^[A-Za-z]{3,4}-\d{3}$/.test(code);
    };

    const validateSection = (section: string) => {
        if (!section) return true;
        return /^\d{1,3}$/.test(section);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!courseData.name) {
            toast.error("Please enter a course title");
            return;
        }
        if (!courseData.code) {
            toast.error("Please enter a course code");
            return;
        }
        if (!validateCourseCode(courseData.code)) {
            toast.warning("Course code should be in format ABC-123");
            return;
        }
        if (!courseData.startDate) {
            toast.error("Please select a start date");
            return;
        }
        if (!courseData.endDate) {
            toast.error("Please select an end date");
            return;
        }
        if (!courseData.term) {
            toast.error("Please select a term");
            return;
        }
        if (courseData.section && !validateSection(courseData.section.toString())) {
            toast.warning("Section number should be 1-3 digits if provided");
            return;
        }
        if (new Date(courseData.endDate) < new Date(courseData.startDate)) {
            toast.warning("End date must be after start date");
            return;
        }

        setIsSubmitting(true);

        try {
            const classroomData: CreateClassroomParams = {
                name: courseData.name,
                code: courseData.code,
                section: courseData.section,
                start_date: courseData.startDate,
                end_date: courseData.endDate,
                term: courseData.term,
                class_colour: courseData.class_colour,
                student_count: courseData.student_count,
            };

            console.log("Updating classroom with data:", classroomData);

            const response = await updateClassroom(initialData.courseId, classroomData);

            // Show success toast first
            toast.success(
                `Course updated successfully!`,
                {
                    position: "bottom-center",
                }
            );

            if (onSubmit) {
                onSubmit({
                    ...courseData,
                    courseId: initialData.courseId,
                });
            }

            // Close modal after a small delay
            setTimeout(() => {
                onClose();
            }, 1000); // 1 second delay
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
            console.error("Error updating course:", err);
            toast.error(`Failed to update course: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <ToastContainer
                position="bottom-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={darkMode ? "dark" : "light"}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Modal container */}
                <div
                    className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? "bg-zinc-800" : "bg-white"
                        } shadow-2xl border ${darkMode ? "border-zinc-600" : "border-gray-200"
                        }`}
                >
                    {/* Header */}
                    <div className={`px-6 py-4 rounded-t-xl ${darkMode ? "bg-zinc-700" : "bg-gray-100"}`}>
                        <h2 className="text-lg font-semibold">
                            <span style={{ color: '#3774E5' }}>Edit Course</span>
                        </h2>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-1 rounded-full ${darkMode
                            ? "hover:bg-zinc-600 text-gray-300"
                            : "hover:bg-gray-200 text-gray-500"
                            }`}
                        aria-label="Close modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    {/* Form content */}
                    <form onSubmit={handleFormSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Course Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={courseData.code}
                                        onChange={handleInputChange}
                                        placeholder="COSC-101"
                                        className={`w-full p-3 text-sm rounded-lg border ${darkMode
                                            ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                                            : "bg-white border-gray-300 placeholder-gray-500"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Course Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={courseData.name}
                                        onChange={handleInputChange}
                                        placeholder="Introduction to Computer Science"
                                        className={`w-full p-3 text-sm rounded-lg border ${darkMode
                                            ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                                            : "bg-white border-gray-300 placeholder-gray-500"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Section No.
                                    </label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={courseData.section}
                                        onChange={handleInputChange}
                                        placeholder="001"
                                        className={`w-full p-3 text-sm rounded-lg border ${darkMode
                                            ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                                            : "bg-white border-gray-300 placeholder-gray-500"
                                            }`}
                                        maxLength={3}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={courseData.startDate}
                                        onChange={handleInputChange}
                                        className={`w-full p-3 text-sm rounded-lg border ${darkMode
                                            ? "bg-zinc-700 border-zinc-600 text-white"
                                            : "bg-white border-gray-300"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={courseData.endDate}
                                        onChange={handleInputChange}
                                        min={courseData.startDate}
                                        className={`w-full p-3 text-sm rounded-lg border ${darkMode
                                            ? "bg-zinc-700 border-zinc-600 text-white"
                                            : "bg-white border-gray-300"
                                            }`}
                                    />
                                </div>

                                <div>
                                    <AnimatedTermDropdown
                                        value={courseData.term}
                                        onChange={handleTermChange}
                                        darkMode={darkMode}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div className="mb-6">
                            <label className={`block mb-3 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                Course Color <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex items-center justify-center">
                                    <div
                                        className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
                                        style={{ backgroundColor: courseData.class_colour }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <HexColorPicker
                                        color={courseData.class_colour}
                                        onChange={(class_colour) => setCourseData(prev => ({ ...prev, class_colour }))}
                                        className="w-full h-32 rounded-lg overflow-hidden"
                                    />
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Hex:</span>
                                        <input
                                            type="text"
                                            value={courseData.class_colour}
                                            onChange={(e) => setCourseData(prev => ({ ...prev, class_colour: e.target.value }))}
                                            className={`flex-1 p-2 text-sm rounded-lg border ${darkMode
                                                ? "bg-zinc-700 border-zinc-600 text-white"
                                                : "bg-white border-gray-300"
                                                }`}
                                            pattern="^#[0-9A-Fa-f]{6}$"
                                            title="Hex color code (e.g., #3b82f6)"
                                        />
                                        <button
                                            type="button"
                                            onClick={randomizeColor}
                                            className={`px-3 py-2 rounded-lg text-sm ${darkMode
                                                ? "bg-zinc-700 text-white hover:bg-zinc-600"
                                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                }`}
                                        >
                                            Random
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form action buttons */}
                        <div className="pt-6 mt-6 border-t border-gray-200">
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-medium ${darkMode
                                            ? "bg-zinc-700 text-white hover:bg-zinc-600"
                                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isSubmitting ? "Updating..." : "Update Course"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}