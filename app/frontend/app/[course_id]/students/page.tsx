"use client"

import React, { useEffect, useState, useRef, useMemo } from 'react'
import CourseListSidebar from '@/app/components/CourseListSidebar'
import CourseListHeader from '@/app/components/CourseListHeader'
import { getClassroomById, updateClassroom } from '@/services/classroom'
import { notFound, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Classroom } from '@/services/classroom'
import { addStudentsToCourse, deleteStudent, getStudentsByClassroomID, updateStudent, deleteStudentsBulk } from '@/services/student'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import Loading from '@/app/loading'
import { toast } from 'react-hot-toast'
import { FaPlus } from 'react-icons/fa6'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { getOnboardingSteps } from '@/config/onboardingSteps'
import OnboardingStep from '@/components/OnboardingStep'
import { OnboardingPages } from '@/config/onboardingSteps'
import { updateUser } from '@/services/profile'
import ImportComponent from '@/components/QuestionBank/import-comp'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import CustomTable from '@/app/components/Table'

const StudentManagementPageWithOnboarding: React.FC = () => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.studentManagement);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step’s target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP “edit-student-0” if no question bank cards present ———
        if (stepId === 'edit-studentManagement-0' || stepId === 'delete-studentManagement-0') {
            const cards = document.querySelectorAll(selector);
            if (cards.length === 0) {
                completeStep(stepId);
                if (stepId === steps[steps.length - 1].id) {
                    updateDBwithCompletedOnboarding();
                }
                return; // bail out, we marked it complete
            }
        }

        let interval: number;

        const findAndScroll = () => {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (el) {
                setTargetElement(el);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        };

        // try immediately, then poll every 100ms
        if (!findAndScroll()) {
            interval = window.setInterval(() => {
                if (findAndScroll()) {
                    clearInterval(interval);
                }
            }, 100);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isActive, state.currentStep, currentStep, completeStep]);

    const handleNext = () => {
        if (currentStep) {
            completeStep(currentStep.id);
        }
        if (currentStep.id === steps[steps.length - 1].id) {
            updateDBwithCompletedOnboarding();
        }
    };

    const updateDBwithCompletedOnboarding = () => {
        const payload = {
            comp_tutorial_page: 'studentManagement'
        }
        updateUser({ payload });
    }

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <StudentManagement />
            {state.isActive && currentStep && (
                <OnboardingStep
                    stepId={currentStep.id}
                    cardPosition={currentStep.cardPosition}
                    message={currentStep.message}
                    targetElement={targetElement}
                    onNext={handleNext}
                    onSkip={handleSkip}
                    isVisible={state.isActive}
                />
            )}
        </>
    );
}

// Export the wrapped component
export default function StudentManagementWrapper() {
    return <StudentManagementPageWithOnboarding />;
};

function StudentManagement() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [classroom, setClassroom] = useState<Classroom | null>(null)
    const [fileStudents, setFileStudents] = useState<any>([])
    const [apiStudents, setApiStudents] = useState<Record<string, any>[] | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
    const [filteredStudents, setFilteredStudents] = useState<any>([]);
    const [deletingRow, setDeletingRow] = useState<Record<string, any> | null>(null);
    const { user } = useAuth();
    const { startOnboarding } = useOnboarding();
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [singleStudent, setSingleStudent] = useState(false);
    const [singleStudentData, setSingleStudentData] = useState<Record<string, any>>({});

    // Bulk delete state
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Dropped':
                return 'bg-red-100 text-red-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    useEffect(() => {
        if (user) {
            if (!(user?.comp_tutorial_pages.includes('studentManagement'))) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('onboarding_studentManagement_')) {
                        localStorage.removeItem(key);
                    }
                }
                // now kick off the onboarding tour
                startOnboarding('studentManagement');
            }
        }
        startTransition(() => {
            const course_id = Number(window.location.pathname.split("/")[1])
            getClassroomById(course_id)
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        setClassroom(res.data)
                        getStudentsByClassroomID(course_id)
                            .then((res) => {
                                if (res.status >= 200 && res.status < 300) {
                                    const tempStudents = [];
                                    console.log("Students:", res.data.data)
                                    for (const student of res.data.data) {
                                        tempStudents.push({
                                            "ID": String(res.data.data.indexOf(student) + 1),
                                            "First Name": student.first_name,
                                            "Last Name": student.last_name,
                                            "Student ID": student.student_id,
                                            "Preferred Name": student.preferred_name,
                                            "Status": student.enrollment_status,
                                        })
                                    }
                                    console.log("Students:", tempStudents)
                                    setApiStudents(tempStudents)
                                    setFilteredStudents(tempStudents)
                                    // Update classroom's student_count to match loaded students
                                    updateClassroom(course_id, { student_count: tempStudents.length });
                                } else {
                                    console.log(res.status)
                                }
                            })
                            .catch((err) => {
                                console.log(err)
                            });
                    } else {
                        console.log(res.status)
                    }
                })
                .catch((err) => {
                    console.log(err)
                });
        });
    }, []);

    const onDrop = (files: File[]) => {
        const file = files[0];
        if (file) {
            setFile(file);
            setIsDragActive(false);
            const reader = new FileReader();
            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => {
                const csv = reader.result;
                const data = Papa.parse(csv as string, { header: true }).data;
                setFileStudents(data);
            };
            reader.readAsText(file);
        } else {
            setIsDragActive(false);
            setFileError("Invalid File Selected");
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        }
    });

    const onSave = () => {
        const course_id = Number(window.location.pathname.split("/")[1])
        setIsLoading(true);
        const payload = [];
        for (const student of fileStudents) {
            payload.push({
                first_name: student["First Name"],
                last_name: student["Last Name"],
                preferred_name: student["Preferred Name"],
                student_id: Number(student["Student ID"]),
                is_active: true,
            })
        }
        console.log("Saving...", payload)
        addStudentsToCourse(payload, course_id)
            .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    // Calculate new student count
                    const newCount = (apiStudents?.length || 0) + fileStudents.length;
                    // Update classroom's student_count
                    updateClassroom(course_id, { student_count: newCount })
                        .then(() => {
                            setIsLoading(false);
                            toast.success("Students added and classroom updated successfully.", { duration: 5000 })
                            window.location.reload();
                        })
                        .catch((err) => {
                            setIsLoading(false);
                            toast.error("Failed to update classroom student count.", { duration: 5000 })
                        });
                } else if (res.status === 403) {
                    toast.error("You do not have permission to add students to this course.", { duration: 5000 })
                } else {
                    console.log(res.status)
                }
            })
            .catch((err) => {
                console.log(err)
                setIsLoading(false);
            });
    }

    const onSaveSingle = () => {
        const course_id = Number(window.location.pathname.split("/")[1])
        setIsLoading(true);
        const payload = [];
        payload.push({
            first_name: singleStudentData["First Name"],
            last_name: singleStudentData["Last Name"],
            student_id: Number(singleStudentData["Student ID"]),
            is_active: true,
        })
        console.log("Saving...", payload)
        addStudentsToCourse(payload, course_id)
            .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    // Calculate new student count
                    const newCount = (apiStudents?.length || 0) + 1;
                    // Update classroom's student_count
                    updateClassroom(course_id, { student_count: newCount })
                        .then(() => {
                            setIsLoading(false);
                            toast.success("Student added and classroom updated successfully.", { duration: 5000 })
                            window.location.reload();
                        })
                        .catch((err) => {
                            setIsLoading(false);
                            toast.error("Failed to update classroom student count.", { duration: 5000 })
                        });
                } else if (res.status === 403) {
                    toast.error("You do not have permission to add students to this course.", { duration: 5000 })
                } else {
                    console.log(res.status)
                }
            })
            .catch((err) => {
                console.log(err)
                setIsLoading(false);
            });
    }

    const handleAddNew = () => {
        setShowAddStudentModal(true);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase()
        if (!value) {
            setFilteredStudents(apiStudents)
        } else {
            const tempStudents = apiStudents!.filter((student: any) =>
                student["First Name"].toLowerCase().includes(value)
            )
            setFilteredStudents(tempStudents)
        }
    }

    const updateStudentInfo = () => {
        if (!editingRow) return;

        const course_id = Number(window.location.pathname.split("/")[1])
        setIsLoading(true);
        const student_id = Number(editingRow["Student ID"]);
        const payload = {
            first_name: editingRow["First Name"],
            last_name: editingRow["Last Name"],
            enrollment_status: editingRow["Status"],
        }
        updateStudent(student_id, course_id, payload)
            .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    setIsLoading(false);
                    toast.success("Student updated successfully.", { duration: 5000 })
                    window.location.reload();
                } else if (res.status === 403) {
                    toast.error("You do not have permission to update this student.", { duration: 5000 })
                } else {
                    console.log(res.status)
                }
            })
            .catch((err) => {
                console.log(err)
                setIsLoading(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    const deleteStudentFromClassroom = () => {
        if (!deletingRow) return;

        const course_id = Number(window.location.pathname.split("/")[1])
        setIsLoading(true);
        const student_id = Number(deletingRow["Student ID"]);
        deleteStudent(student_id, course_id)
            .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    setIsLoading(false);
                    toast.success("Student deleted successfully.", { duration: 5000 })
                    window.location.reload();
                } else if (res.status === 403) {
                    toast.error("You do not have permission to delete this student.", { duration: 5000 })
                } else {
                    console.log(res.status)
                }
            })
            .catch((err) => {
                console.log(err)
                setIsLoading(false);
            })
            .finally(() => {
                setIsLoading(false);
                setDeletingRow(null);
            });
    }

    const isSingleSaveDisabled = useMemo(() => {
        const sid = singleStudentData["Student ID"] && Number(singleStudentData["Student ID"]) > 0;
        const fn = singleStudentData["First Name"];
        const ln = singleStudentData["Last Name"];
        return !sid || !fn || !ln;
    }, [singleStudentData]);

    // Bulk selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allStudentIds = new Set<string>(filteredStudents.map((student: any) => student["Student ID"].toString()));
            setSelectedStudents(allStudentIds);
        } else {
            setSelectedStudents(new Set<string>());
        }
    };

    const handleSelectStudent = (studentId: string, checked: boolean) => {
        const newSelected = new Set(selectedStudents);
        if (checked) {
            newSelected.add(studentId);
        } else {
            newSelected.delete(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const isAllSelected = useMemo(() => {
        return filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
    }, [filteredStudents, selectedStudents]);

    const isIndeterminate = useMemo(() => {
        return selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;
    }, [filteredStudents, selectedStudents]);

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return;

        setIsBulkDeleting(true);
        const course_id = Number(window.location.pathname.split("/")[1]);
        const studentIds = Array.from(selectedStudents).map(id => Number(id));

        try {
            const response = await deleteStudentsBulk(studentIds, course_id);
            
            if (response.status >= 200 && response.status < 300) {
                // Update local state
                const newStudents = filteredStudents.filter((student: any) => 
                    !selectedStudents.has(student["Student ID"].toString())
                );
                setFilteredStudents(newStudents);
                setApiStudents(newStudents);
                
                // Update classroom student count
                const newCount = Math.max((apiStudents?.length || 0) - selectedStudents.size, 0);
                await updateClassroom(course_id, { student_count: newCount });
                
                // Clear selection
                setSelectedStudents(new Set<string>());
                setShowBulkDeleteModal(false);
                
                toast.success(`${selectedStudents.size} student(s) deleted successfully.`, { duration: 5000 });
            } else {
                toast.error("Failed to delete selected students.", { duration: 5000 });
            }
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("An error occurred while deleting students.", { duration: 5000 });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    if (isLoading || isPending || !classroom || !apiStudents || !user) return <Loading />

    return (
        <div className="flex h-screen bg-[#EDEDED]">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    onDrop(files);
                    e.target.value = "";
                }}
            />
            <div className="fixed top-0 left-0 h-screen w-[80px] lg:w-[230px] z-10">
            <CourseListSidebar
                darkMode={false}
                archived={user.role === "Admin"}
                onToggleDarkMode={() => { }}
                tutorialPage="studentManagement"
                middleButtons={[
                    {
                        label: 'Active Courses',
                        alt: 'Active Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Exam Dashboard',
                        alt: 'Exam Dashboard',
                        iconSrc: '/home.svg',
                        onClick: () => router.push(window.location.pathname.replace("/students", "")),
                    },
                    {
                        label: 'Question Banks',
                        alt: 'Question Banks',
                        iconSrc: '/question-bank.svg',
                        onClick: () => router.push(window.location.pathname.replace("/students", "/questions")),
                    },
                    {
                        label: 'Student Roster',
                        alt: 'Student Roster',
                        iconSrc: '/students.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Grades Analytics',
                        alt: 'Grades Analytics',
                        iconSrc: '/student-grade.svg',
                        onClick: () => router.push(window.location.pathname.replace('/students', '/students-grades')),
                    },
                    {
                        label: 'Course Analytics',
                        alt: 'Course Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace("/students", "/courseanalytics")),
                    },
                ]}
            />
            </div>
            <div className="flex flex-col flex-1 p-6 overflow-hidden ml-[80px] lg:ml-[230px]">
                <CourseListHeader
                    searchPlaceholder="Search Students..."
                    search={handleSearch}
                />


                <div className="flex items-center justify-between mb-4 px-4">
                    <h1 className={`relative inline-block text-3xl font-medium group`}>
                        {/* Gradient text (light orange) - only visible in light mode */}
                        <span className={`
            text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600
            group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
            transition-all duration-500
        `}>
                            {classroom?.name + " - " + "Students"}
                        </span>
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            className={`relative inline-flex items-center gap-2 text-lg font-medium group`}
                            onClick={() => {
                                const link = document.createElement("a");
                                link.href = "/student_template.zip";
                                link.download = "student_template.zip";
                                link.click();
                            }}
                        >
                            <img
                                src="/export.svg"
                                alt="Export Template"
                                className="w-6 h-6"
                                style={{
                                    filter: 'brightness(0) saturate(100%) invert(61%) sepia(95%) saturate(300%) hue-rotate(330deg) brightness(90%) contrast(90%)',
                                }}
                            />
                            <span className={`
                text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600
                group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
                transition-all duration-500
            `}>
                                Export Template
                            </span>
                        </button>

                        <button
                            className={`
                relative overflow-hidden
                text-white font-medium text-sm border-none rounded-full
                cursor-pointer shadow-lg hover:shadow-xl
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                inline-flex items-center justify-center gap-2
                bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700
                hover:from-orange-600 hover:via-orange-700 hover:to-orange-800
                active:from-orange-700 active:via-orange-800 active:to-orange-900
                focus:outline-none focus:ring-2 focus:ring-orange-400/80 focus:ring-offset-2
                group
                px-4 py-2
                min-w-[140px]
            `}
                            onClick={handleAddNew}
                            data-onboarding="add-students"
                        >
                            <FaPlus className="relative z-10 w-4 h-4 transition-transform duration-600 ease-in-out group-hover:rotate-[720deg]" />
                            Add New Student
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Toolbar */}
                <div 
                    className={`transition-all duration-300 ease-in-out transform ${
                        selectedStudents.size > 0 
                            ? 'opacity-100 translate-y-0 max-h-20 mb-4' 
                            : 'opacity-0 -translate-y-4 max-h-0 mb-0 overflow-hidden'
                    }`}
                >
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 transition-all duration-200">
                                    <span className="font-medium text-blue-600">{selectedStudents.size}</span> student{selectedStudents.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
                                    onClick={() => setSelectedStudents(new Set<string>())}
                                >
                                    Clear Selection
                                </button>
                                <button
                                    className="bg-red-500 text-white text-sm px-4 py-2 rounded cursor-pointer hover:bg-red-600 transition-all duration-200 flex items-center gap-2 hover:scale-105"
                                    onClick={() => setShowBulkDeleteModal(true)}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden" data-testid="student-management-container">
                    <div className="flex-1 overflow-y-auto">
                        {apiStudents.length > 0 ? (
                            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left">
                                                <div className="transition-all duration-200 ease-in-out">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                                                        checked={isAllSelected}
                                                        ref={(input) => {
                                                            if (input) {
                                                                input.indeterminate = isIndeterminate;
                                                            }
                                                        }}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                First Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Preferred Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student: any, index: number) => (
                                            <tr 
                                                key={student["Student ID"]}
                                                className={`transition-all duration-200 ease-in-out ${
                                                    selectedStudents.has(student["Student ID"].toString())
                                                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="transition-all duration-200 ease-in-out">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                                                            checked={selectedStudents.has(student["Student ID"].toString())}
                                                            onChange={(e) => handleSelectStudent(student["Student ID"].toString(), e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student["First Name"]}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student["Last Name"]}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student["Preferred Name"] || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student["Student ID"]}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student["Status"])}`}>
                                                        {student["Status"]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setEditingRow(student)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-5 w-5" data-onboarding={`edit-studentManagement-${index}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingRow(student)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-5 w-5" data-onboarding={`delete-studentManagement-${index}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-4 h-full">
                                <div
                                    {...getRootProps()}
                                    className={`w-full max-w-xl flex flex-col items-center justify-center border-2 border-dashed rounded-2xl px-10 py-20 cursor-pointer ${isDragActive
                                        ? "border-[#3774E5] bg-[#3774E51A]"
                                        : fileError
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-300 bg-white"
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {fileError ? (
                                        <img
                                            src="/error.svg"
                                            alt="error"
                                            width={60}
                                            height={60}
                                            className="mb-4"
                                        />
                                    ) : (
                                        <img
                                            src="/cloud-add.svg"
                                            alt="upload"
                                            width={60}
                                            height={60}
                                            className="mb-4"
                                        />
                                    )}
                                    <p
                                        className={`mb-1 ${isDragActive
                                            ? "text-[#3774E5]"
                                            : fileError
                                                ? "text-red-500"
                                                : "text-gray-600"
                                            }`}
                                    >
                                        {isDragActive
                                            ? "Drop your CSV/XLSX here…"
                                            : fileError
                                                ? fileError
                                                : "Drag & drop a CSV/XLSX here, or click 'Add New'"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        CSV, XLSX, or XLS up to 50MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {fileStudents.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                    onClick={() => setFileStudents([])}
                >
                    <div
                        className="bg-white rounded-2xl w-[90%] max-w-5xl max-h-2xl h-[90%] overflow-hidden z-10 ml-[80px] lg:ml-[230px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-full p-6 overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">File Preview</h2>
                                <button
                                    onClick={() => setFileStudents([])}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    ✕
                                </button>
                            </div>
                            <CustomTable
                                columns={Object.keys(fileStudents[0])}
                                rows={fileStudents}
                            />
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => onSave()}
                                    className="text-white bg-[#3774E5] px-4 py-2 rounded text-sm flex items-center hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {editingRow && (
                <div
                    className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center"
                    onClick={() => setEditingRow(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-11/12 max-w-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">Edit Student</h3>

                        {/* 1) Editable Question text */}
                        <label className="block mb-2 font-medium">First Name</label>
                        <input
                            className="w-full border rounded p-2 mb-4"
                            value={editingRow["First Name"]}
                            onChange={e =>
                                setEditingRow({ ...editingRow, "First Name": e.target.value })
                            }
                        />

                        <label className="block mb-2 font-medium">Last Name</label>
                        <input
                            className="w-full border rounded p-2 mb-4"
                            value={editingRow["Last Name"]}
                            onChange={e =>
                                setEditingRow({ ...editingRow, "Last Name": e.target.value })
                            }
                        />

                        {/* 2) Options with radio buttons */}
                        <label className="block mb-2 font-medium">Status</label>
                        {["Active", "Dropped", "Completed"].map((i) => {
                            return (
                                <div key={i} className="flex items-center mb-2">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        value={i}
                                        checked={editingRow.Status === i}
                                        onChange={(e) =>
                                            setEditingRow({ ...editingRow, Status: e.target.value })
                                        }
                                        className="mr-2 h-5 w-5"
                                    />

                                    <input
                                        type="text"
                                        className="flex-1 border rounded p-1"
                                        readOnly
                                        placeholder={i}
                                    />
                                </div>
                            )
                        })}

                        {/* 4) Actions */}
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                onClick={() => setEditingRow(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-[#3774E5] text-white rounded hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                onClick={() => updateStudentInfo()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deletingRow && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-lg font-semibold mb-4">Are you sure you want to delete this student?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                onClick={() => setDeletingRow(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                onClick={() => deleteStudentFromClassroom()}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAddStudentModal === true && (
                <ImportComponent
                    setShowAddModal={setShowAddStudentModal}
                    setSingleEntry={setSingleStudent}
                    fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    title="Add New Student"
                />
            )}
            {singleStudent === true && (
                <div
                    className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center"
                    onClick={() => setSingleStudent(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-11/12 max-w-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">Add New Student</h3>

                        {/* 1) Editable Question text */}
                        <label className="block mb-2 font-medium">Student ID</label>
                        <input
                            className="w-full border rounded p-2 mb-4"
                            placeholder="Enter Student ID (e.g. 123456)"
                            maxLength={10}
                            onChange={e =>
                                setSingleStudentData({ ...singleStudentData, "Student ID": e.target.value })
                            }
                        />

                        {/* 1) Editable Question text */}
                        <label className="block mb-2 font-medium">First Name</label>
                        <input
                            className="w-full border rounded p-2 mb-4"
                            placeholder="Enter First Name (e.g. John)"
                            onChange={e =>
                                setSingleStudentData({ ...singleStudentData, "First Name": e.target.value })
                            }
                        />

                        <label className="block mb-2 font-medium">Last Name</label>
                        <input
                            className="w-full border rounded p-2 mb-4"
                            placeholder="Enter Last Name (e.g. Doe)"
                            onChange={e =>
                                setSingleStudentData({ ...singleStudentData, "Last Name": e.target.value })
                            }
                        />

                        {/* 3) Actions */}
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                                onClick={() => setSingleStudent(false)}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSingleSaveDisabled}
                                className={`px-4 py-2 rounded transition-all duration-200
                                ${isSingleSaveDisabled
                                        ? "bg-[#3774E54D] text-gray-600 cursor-not-allowed"
                                        : "bg-[#3774E5] text-white hover:translate-y-[-5px]"}
                                `}
                                onClick={onSaveSingle}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            <div 
                className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
                    showBulkDeleteModal 
                        ? 'opacity-100 pointer-events-auto' 
                        : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                        showBulkDeleteModal ? 'opacity-40' : 'opacity-0'
                    }`}
                    onClick={() => setShowBulkDeleteModal(false)}
                />
                
                {/* Modal Container */}
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div 
                        className={`bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transition-all duration-300 ease-out transform ${
                            showBulkDeleteModal 
                                ? 'opacity-100 scale-100 translate-y-0' 
                                : 'opacity-0 scale-95 translate-y-4'
                        }`}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center p-6 pb-4">
                            <div className="flex-shrink-0">
                                <div className={`transition-all duration-300 delay-100 ${
                                    showBulkDeleteModal ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
                                }`}>
                                    <TrashIcon className="h-6 w-6 text-red-500" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <h3 className={`text-lg font-semibold text-gray-900 transition-all duration-300 delay-150 ${
                                    showBulkDeleteModal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                                }`}>
                                    Delete Selected Students
                                </h3>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="px-6 pb-4">
                            <p className={`text-sm text-gray-600 transition-all duration-300 delay-200 ${
                                showBulkDeleteModal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                            }`}>
                                Are you sure you want to delete{' '}
                                <span className="font-semibold text-red-600">{selectedStudents.size}</span>
                                {' '}selected student{selectedStudents.size !== 1 ? 's' : ''}? 
                                This action cannot be undone.
                            </p>
                        </div>
                        
                        {/* Modal Actions */}
                        <div className={`flex justify-end gap-3 p-6 pt-2 transition-all duration-300 delay-300 ${
                            showBulkDeleteModal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                onClick={() => setShowBulkDeleteModal(false)}
                                disabled={isBulkDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                                    isBulkDeleting 
                                        ? 'bg-red-400 text-white' 
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                            >
                                <span className="flex items-center gap-2">
                                    {isBulkDeleting && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {isBulkDeleting ? 'Deleting...' : 'Delete'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}