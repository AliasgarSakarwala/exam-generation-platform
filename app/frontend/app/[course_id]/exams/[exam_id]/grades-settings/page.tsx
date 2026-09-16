"use client"

import React, { useState, useEffect, useCallback } from 'react'
import CourseListSidebar from '@/app/components/CourseListSidebar'
import CourseListHeader from '@/app/components/CourseListHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/app/loading'
import { SettingsTextInput } from '@/components/settings-text-input'
import CTAButton from '@/components/settings-cta'
import { HexColorPicker } from "react-colorful";
import { getGradeSettings, updateGradeSettings, resetGradeSettings, GradeSettings as GradeSettingsType } from '@/services/grade_settings'

export default function GradesSettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State for grade settings
    const [gradeSettings, setGradeSettings] = useState({
        highThreshold: 80 as number | string,
        mediumThreshold: 50 as number | string,
        lowThreshold: 0 as number | string,
        highColor: '#10B981', // emerald-500
        mediumColor: '#F59E0B', // amber-500
        lowColor: '#EF4444', // red-500
        includeStudentNames: true,
        includeQuestionDetails: true
    });

    // State for validation errors
    const [errors, setErrors] = useState<string[]>([]);

    // State to track which color picker is open
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

    // State for success popup
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Auto-dismiss popup after 3 seconds
    useEffect(() => {
        if (showSuccessPopup) {
            const timer = setTimeout(() => {
                setShowSuccessPopup(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [showSuccessPopup]);

    // Extract examId and classroomId
    const examId = typeof window !== 'undefined' ? window.location.pathname.split("/")[3] : null;
    const classroomId = typeof window !== 'undefined' ? window.location.pathname.split("/")[1] : null;

    // Load grade settings from backend
    useEffect(() => {
        if (!user || !examId) {
            setIsLoading(false);
            return;
        }

        const loadGradeSettings = async () => {
            try {
                setIsLoading(true);

                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
                );

                const dataPromise = getGradeSettings(parseInt(examId));
                const data = await Promise.race([dataPromise, timeoutPromise]);

                setGradeSettings({
                    highThreshold: data.high_grade_threshold,
                    mediumThreshold: data.medium_grade_threshold,
                    lowThreshold: data.low_grade_threshold,
                    highColor: data.high_grade_color,
                    mediumColor: data.medium_grade_color,
                    lowColor: data.low_grade_color,
                    includeStudentNames: !data.anonymous_student_names,
                    includeQuestionDetails: true
                });

                setOpenColorPicker(null); // Close any open color picker
                setSuccessMessage('Grade settings loaded successfully!');
                setShowSuccessPopup(true);
            } catch (error) {
                setSuccessMessage('Failed to load grade settings. Using default values.');
                setShowSuccessPopup(true);
                // Use default values if API fails
                setGradeSettings({
                    highThreshold: 80,
                    mediumThreshold: 50,
                    lowThreshold: 0,
                    highColor: '#10B981',
                    mediumColor: '#F59E0B',
                    lowColor: '#EF4444',
                    includeStudentNames: true,
                    includeQuestionDetails: true
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadGradeSettings();
    }, [user, examId]);

    // Handle clicking outside to close color picker
    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.color-picker-container') && openColorPicker) {
            setOpenColorPicker(null);
        }
    }, [openColorPicker]);

    useEffect(() => {
        if (openColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openColorPicker, handleClickOutside]);

    // Show loading if user is not authenticated or data is loading
    if (!user || isLoading) {
        return <Loading />
    }

    // Ensure examId exists before proceeding
    if (!examId) {
        return <div>Error: Exam ID not found</div>
    }

    // Handle grade settings changes (no validation during typing)
    const handleGradeSettingChange = (setting: string, value: any) => {
        let newValue = value;

        // Handle empty string (when user deletes everything)
        if (value === '') {
            newValue = '';
        } else {
            // Ensure value is a number
            if (typeof newValue === 'string') {
                newValue = parseInt(newValue) || 0;
            }

            // Clamp value between 0 and 100
            newValue = Math.max(0, Math.min(100, newValue));
        }

        setGradeSettings(prev => ({
            ...prev,
            [setting]: newValue
        }));
    };

    // Handle color changes
    const handleColorChange = (setting: string, color: string) => {
        setGradeSettings(prev => ({
            ...prev,
            [setting]: color
        }));
    };

    // Toggle color picker visibility
    const toggleColorPicker = (pickerName: string) => {
        setOpenColorPicker(openColorPicker === pickerName ? null : pickerName);
    };

    // Reset to default colors
    const resetToDefaults = async () => {
        try {
            setIsSaving(true);
            const response = await resetGradeSettings(parseInt(examId!));
            
            // Check if response exists and has data property
            const data = response?.data || response;
            
            // Use nullish coalescing to provide fallback values
            setGradeSettings({
                highThreshold: data?.high_grade_threshold ?? 80,
                mediumThreshold: data?.medium_grade_threshold ?? 50,
                lowThreshold: data?.low_grade_threshold ?? 0,
                highColor: data?.high_grade_color ?? '#10B981',
                mediumColor: data?.medium_grade_color ?? '#F59E0B',
                lowColor: data?.low_grade_color ?? '#EF4444',
                includeStudentNames: !(data?.anonymous_student_names ?? false),
                includeQuestionDetails: true
            });

            setOpenColorPicker(null);
            setSuccessMessage('Grade settings reset to defaults!');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error('Failed to reset grade settings:', error);
            setSuccessMessage('Failed to reset grade settings. Using default values.');
            setShowSuccessPopup(true);
            // Fallback to hardcoded defaults if API fails
            setGradeSettings({
                highThreshold: 80,
                mediumThreshold: 50,
                lowThreshold: 0,
                highColor: '#10B981',
                mediumColor: '#F59E0B',
                lowColor: '#EF4444',
                includeStudentNames: true,
                includeQuestionDetails: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Validate grade thresholds
    const validateGradeSettings = () => {
        const newErrors: string[] = [];

        // Check if thresholds are empty or in valid range
        if (gradeSettings.highThreshold === '' || (typeof gradeSettings.highThreshold === 'number' && (gradeSettings.highThreshold < 0 || gradeSettings.highThreshold > 100))) {
            newErrors.push("High grade threshold must be between 0 and 100");
        }
        if (gradeSettings.mediumThreshold === '' || (typeof gradeSettings.mediumThreshold === 'number' && (gradeSettings.mediumThreshold < 0 || gradeSettings.mediumThreshold > 100))) {
            newErrors.push("Medium grade threshold must be between 0 and 100");
        }
        if (gradeSettings.lowThreshold === '' || (typeof gradeSettings.lowThreshold === 'number' && (gradeSettings.lowThreshold < 0 || gradeSettings.lowThreshold > 100))) {
            newErrors.push("Low grade threshold must be between 0 and 100");
        }

        // Only check crossover issues if all values are numbers
        if (typeof gradeSettings.highThreshold === 'number' && typeof gradeSettings.mediumThreshold === 'number' && typeof gradeSettings.lowThreshold === 'number') {
            // Check for crossover issues
            if (gradeSettings.highThreshold <= gradeSettings.mediumThreshold) {
                newErrors.push("High grade threshold must be greater than medium grade threshold");
            }
            if (gradeSettings.mediumThreshold <= gradeSettings.lowThreshold) {
                newErrors.push("Medium grade threshold must be greater than low grade threshold");
            }
            if (gradeSettings.highThreshold <= gradeSettings.lowThreshold) {
                newErrors.push("High grade threshold must be greater than low grade threshold");
            }

            // Check for logical order
            if (gradeSettings.highThreshold === gradeSettings.mediumThreshold) {
                newErrors.push("High and medium grade thresholds cannot be the same");
            }
            if (gradeSettings.mediumThreshold === gradeSettings.lowThreshold) {
                newErrors.push("Medium and low grade thresholds cannot be the same");
            }
            if (gradeSettings.highThreshold === gradeSettings.lowThreshold) {
                newErrors.push("High and low grade thresholds cannot be the same");
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // Handle save settings
    const handleSaveSettings = async () => {
        // Clear previous errors
        setErrors([]);

        // Validate settings
        if (!validateGradeSettings()) {
            setSuccessMessage('Please fix the validation errors before saving.');
            setShowSuccessPopup(true);
            return; // Don't save if validation fails
        }

        try {
            setIsSaving(true);
            await updateGradeSettings(parseInt(examId!), {
                high_grade_threshold: typeof gradeSettings.highThreshold === 'number' ? gradeSettings.highThreshold : parseInt(gradeSettings.highThreshold as string),
                medium_grade_threshold: typeof gradeSettings.mediumThreshold === 'number' ? gradeSettings.mediumThreshold : parseInt(gradeSettings.mediumThreshold as string),
                low_grade_threshold: typeof gradeSettings.lowThreshold === 'number' ? gradeSettings.lowThreshold : parseInt(gradeSettings.lowThreshold as string),
                high_grade_color: gradeSettings.highColor,
                medium_grade_color: gradeSettings.mediumColor,
                low_grade_color: gradeSettings.lowColor,
                anonymous_student_names: !gradeSettings.includeStudentNames
            });
            setSuccessMessage('Grade settings saved to database successfully!');
            setShowSuccessPopup(true);
        } catch (error) {
            setSuccessMessage('Failed to save grade settings. Please try again.');
            setShowSuccessPopup(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex bg-[#EDEDED] h-screen">
            <CourseListSidebar
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                archived={user?.role === 'Admin'}
                middleButtons={[
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
                        onClick: () => {
                            const parts = window.location.pathname.split("/");
                            router.push(window.location.pathname.replace(`exams/${parts[3]}/grades-settings`, ""))
                        },
                    },
                    {
                        label: 'View Variants',
                        alt: 'View Variants',
                        iconSrc: '/variants.svg',
                        onClick: () => router.push(window.location.pathname.replace("grades-settings", "exam-variant")),
                    },
                    {
                        label: 'Upload Grade',
                        alt: 'Upload Grades',
                        iconSrc: '/mark.svg',
                        onClick: () => router.push(window.location.pathname.replace("grades-settings", "upload-grades")),
                    },
                    {
                        label: 'Exam Analytics',
                        alt: 'Exam Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace("/grades-settings", "/examanalytics")),
                    },
                ]}
            />
            <div className="flex-1 p-4 overflow-y-auto">
                <CourseListHeader
                    search={() => { }}
                    router={router}
                    showBackArrow={true}
                    searchPlaceholder="Search Settings..."
                    settingsButton={null} // Hide settings button on settings page
                />

                <div className="flex flex-col flex-1 h-full">
                    {/* Page Header */}
                    <h2 className="mx-1 lg:text-2xl md:text-xl text-lg text-[#3774E5] font-semibold">
                        Grades Settings
                    </h2>

                    {/* Main Content Area */}
                    <div className="flex-1 my-1 bg-white rounded-[16px] p-8 shadow-sm overflow-y-auto">

                        {/* Profile Header Section */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center">
                                <img
                                    src="/user-avatars/User 07a.svg"
                                    alt="Profile"
                                    className="rounded-full mr-4 lg:w-[80px] lg:h-[80px] md:w-[60px] md:h-[60px] w-[40px] h-[40px]"
                                />
                                <div>
                                    <h3 className="m-0 font-bold">Exam Grades</h3>
                                    <p className="m-0 text-gray-500">Configure grade display and export settings</p>
                                </div>
                            </div>
                            <CTAButton
                                value="Save Settings"
                                onClick={handleSaveSettings}
                                isLoading={isSaving}
                            />
                        </div>

                        {/* Grade Display Settings Section */}
                        <div className="mb-8 px-6">
                            <h4 className="text-xl text-[#3774E5] font-semibold mb-6">Grade Display Settings</h4>

                            {/* Color Selection */}
                            <div className="mb-6">
                                <label className="block mb-4 text-sm font-medium text-gray-700">
                                    Grade Colors
                                </label>

                                {/* Desktop Layout - Horizontal */}
                                <div className="hidden lg:flex items-start justify-between gap-8">
                                    {/* High Grade Color */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="relative color-picker-container mb-3">
                                            <button
                                                onClick={() => toggleColorPicker('high')}
                                                className="w-20 h-20 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                style={{ backgroundColor: gradeSettings.highColor }}
                                                title="Click to change High Grade color"
                                                aria-label="High Grade color picker"
                                            />
                                            {openColorPicker === 'high' && (
                                                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                    <HexColorPicker
                                                        color={gradeSettings.highColor}
                                                        onChange={(color) => handleColorChange('highColor', color)}
                                                        className="w-48 h-48 rounded-lg overflow-hidden"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-medium text-gray-700 mb-1">High Grade</span>
                                            <span className="text-xs text-gray-500">≥ {gradeSettings.highThreshold}%</span>
                                        </div>
                                    </div>

                                    {/* Medium Grade Color */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="relative color-picker-container mb-3">
                                            <button
                                                onClick={() => toggleColorPicker('medium')}
                                                className="w-20 h-20 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                style={{ backgroundColor: gradeSettings.mediumColor }}
                                                title="Click to change Medium Grade color"
                                                aria-label="Medium Grade color picker"
                                            />
                                            {openColorPicker === 'medium' && (
                                                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                    <HexColorPicker
                                                        color={gradeSettings.mediumColor}
                                                        onChange={(color) => handleColorChange('mediumColor', color)}
                                                        className="w-48 h-48 rounded-lg overflow-hidden"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-medium text-gray-700 mb-1">Medium Grade</span>
                                            <span className="text-xs text-gray-500">{typeof gradeSettings.highThreshold === 'number' ? gradeSettings.highThreshold - 1 : '79'}% - {gradeSettings.mediumThreshold}%</span>
                                        </div>
                                    </div>

                                    {/* Low Grade Color */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="relative color-picker-container mb-3">
                                            <button
                                                onClick={() => toggleColorPicker('low')}
                                                className="w-20 h-20 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                style={{ backgroundColor: gradeSettings.lowColor }}
                                                title="Click to change Low Grade color"
                                                aria-label="Low Grade color picker"
                                            />
                                            {openColorPicker === 'low' && (
                                                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                    <HexColorPicker
                                                        color={gradeSettings.lowColor}
                                                        onChange={(color) => handleColorChange('lowColor', color)}
                                                        className="w-48 h-48 rounded-lg overflow-hidden"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-medium text-gray-700 mb-1">Low Grade</span>
                                            <span className="text-xs text-gray-500">&lt; {gradeSettings.mediumThreshold}%</span>
                                        </div>
                                    </div>

                                    {/* Reset Button */}
                                    <div className="flex flex-col items-center justify-start pt-2">
                                        <button
                                            onClick={resetToDefaults}
                                            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                        >
                                            Reset to Defaults
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile Layout - Vertical Stack */}
                                <div className="lg:hidden space-y-6">
                                    {/* High Grade Color */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative color-picker-container">
                                                <button
                                                    onClick={() => toggleColorPicker('high')}
                                                    className="w-16 h-16 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    style={{ backgroundColor: gradeSettings.highColor }}
                                                    title="Click to change High Grade color"
                                                    aria-label="High Grade color picker"
                                                />
                                                {openColorPicker === 'high' && (
                                                    <div className="absolute top-20 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                        <HexColorPicker
                                                            color={gradeSettings.highColor}
                                                            onChange={(color) => handleColorChange('highColor', color)}
                                                            className="w-40 h-40 rounded-lg overflow-hidden"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-gray-700">High Grade</span>
                                                <span className="text-xs text-gray-500">≥ {gradeSettings.highThreshold}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medium Grade Color */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative color-picker-container">
                                                <button
                                                    onClick={() => toggleColorPicker('medium')}
                                                    className="w-16 h-16 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    style={{ backgroundColor: gradeSettings.mediumColor }}
                                                    title="Click to change Medium Grade color"
                                                    aria-label="Medium Grade color picker"
                                                />
                                                {openColorPicker === 'medium' && (
                                                    <div className="absolute top-20 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                        <HexColorPicker
                                                            color={gradeSettings.mediumColor}
                                                            onChange={(color) => handleColorChange('mediumColor', color)}
                                                            className="w-40 h-40 rounded-lg overflow-hidden"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-gray-700">Medium Grade</span>
                                                <span className="text-xs text-gray-500">{typeof gradeSettings.highThreshold === 'number' ? gradeSettings.highThreshold - 1 : '79'}% - {gradeSettings.mediumThreshold}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Low Grade Color */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative color-picker-container">
                                                <button
                                                    onClick={() => toggleColorPicker('low')}
                                                    className="w-16 h-16 rounded-full border-3 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    style={{ backgroundColor: gradeSettings.lowColor }}
                                                    title="Click to change Low Grade color"
                                                    aria-label="Low Grade color picker"
                                                />
                                                {openColorPicker === 'low' && (
                                                    <div className="absolute top-20 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                                                        <HexColorPicker
                                                            color={gradeSettings.lowColor}
                                                            onChange={(color) => handleColorChange('lowColor', color)}
                                                            className="w-40 h-40 rounded-lg overflow-hidden"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-gray-700">Low Grade</span>
                                                <span className="text-xs text-gray-500">&lt; {gradeSettings.mediumThreshold}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reset Button - Mobile */}
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={resetToDefaults}
                                            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                        >
                                            Reset to Defaults
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grade Thresholds Section */}
                        <h4 className="text-xl text-[#3774E5] font-semibold">Grade Thresholds</h4>
                        <SettingsTextInput
                            name="highThreshold"
                            label="High Grade Threshold (%)"
                            value={gradeSettings.highThreshold?.toString() || ''}
                            onChange={(e) => handleGradeSettingChange('highThreshold', e.target.value)}
                        />
                        <SettingsTextInput
                            name="mediumThreshold"
                            label="Medium Grade Threshold (%)"
                            value={gradeSettings.mediumThreshold?.toString() || ''}
                            onChange={(e) => handleGradeSettingChange('mediumThreshold', e.target.value)}
                        />

                        {/* Export Settings Section */}
                        <h4 className="text-xl text-[#3774E5] font-semibold">Export Settings</h4>
                        <div className="grid grid-cols-2 gap-5 px-6">
                            <div className="mb-5 mt-1">
                                <label className="block font-medium mb-1.5 text-gray-500 text-md">
                                    Include Student Names
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="include-names"
                                        checked={gradeSettings.includeStudentNames}
                                        onChange={(e) => handleGradeSettingChange('includeStudentNames', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="include-names" className="ml-2 text-sm text-gray-700">
                                        Include student names in exported grade reports
                                    </label>
                                </div>
                            </div>

                        </div>

                        {/* Error Display */}
                        {errors.length > 0 && (
                            <div className="mt-6 px-6">
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <ul className="list-disc list-inside space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index} className="text-red-700 text-sm">{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {successMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}