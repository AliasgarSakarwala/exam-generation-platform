"use client"

import React, { useEffect, useRef, useState } from 'react'
import CourseListSidebar from '@/app/components/CourseListSidebar'
import CourseListHeader from '@/app/components/CourseListHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/app/loading'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { FaChevronDown, FaChevronUp, FaX } from 'react-icons/fa6'
import { getExamVariants } from '@/services/exam_variant'
import { getStudentsByClassroomID } from '@/services/student'
import { getGrades, uploadGrades } from '@/services/grades'
import { Answer, renderSparkStrip } from '@/app/components/functions/sparkStrip'
import {ExamService} from '@/services/exam'
import { getGradeSettings } from '@/services/grade_settings'

export default function UploadGradesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [fileError, setFileError] = useState<string | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [apiGrades, setApiGrades] = useState<Record<string, any>[] | null>(null)
    const [fileGrades, setFileGrades] = useState<Record<string, any>[] | null>(null)
    const [columns, setColumns] = useState<string[]>([])
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [variants, setVariants] = useState<Record<string, any>[]>([])
    const [students, setStudents] = useState<Record<string, any>[]>([]);
    const [totalPerStudent, setTotalPerStudent] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [gradeSettings, setGradeSettings] = useState({
        highThreshold: 80,
        mediumThreshold: 50,
        lowThreshold: 0,
        highColor: '#10B981',
        mediumColor: '#F59E0B',
        lowColor: '#EF4444'
    });

    useEffect(() => {
        const examId = window.location.pathname.split("/")[3];
        console.log("Exam ID: ", examId);
        const classroomId = window.location.pathname.split("/")[1];

        // Load grade settings
        getGradeSettings(Number(examId))
            .then((data) => {
                setGradeSettings({
                    highThreshold: data.high_grade_threshold,
                    mediumThreshold: data.medium_grade_threshold,
                    lowThreshold: data.low_grade_threshold,
                    highColor: data.high_grade_color,
                    mediumColor: data.medium_grade_color,
                    lowColor: data.low_grade_color
                });
            })
            .catch((err) => {
                console.log('Failed to load grade settings, using defaults:', err);
                // Keep default values
            });

        getStudentsByClassroomID(Number(classroomId)).then((res) => {
            setStudents(res.data.data)
        }).catch((err) => {
            console.log(err)
        })

        getExamVariants(Number(examId)).then((res) => {
            setVariants(res)
            console.log(res)
        }).catch((err) => {
            console.log(err)
        })

        getGrades(Number(classroomId), Number(examId)).then((res) => {
            setApiGrades(res.data)
            console.log(res)
        }).catch((err) => {
            setApiGrades([])
            console.log(err)
        })

    }, []);

    const onUpload = () => {
        setIsLoading(true);
        if (!fileGrades) return;
        const classroomId = window.location.pathname.split("/")[1];
        const examId = window.location.pathname.split("/")[3];
        const payload = [];
        for (const g of fileGrades) {
            const versionNumber = Number(g["Exam Version"]);
            const variantId = variants.find((v) => v.version_number === versionNumber)?.exam_variant_id;
            const answer = [];
            const questionCols = Object.keys(g).filter((k) => k.startsWith("Question"));
            let score = 0;
            for (let i = 0; i < questionCols.length; i++) {
                const ans = g[questionCols[i]].trim();
                answer.push(ans);
                const is_correct = variants.find((v) => v.version_number === versionNumber)?.answer_key?.split(",")[i].trim() === ans.trim()
                if (is_correct) {
                    score++;
                }
            }
            payload.push({
                exam_variant_id: variantId,
                student_id: Number(g["Student ID"]),
                grade_points: questionCols.length,
                raw_score: score,
                answer: answer,
                exam_grade: g["Exam Grade"] ? Number(g["Exam Grade"]) : null // Add exam_grade to payload
            })
        }
       
        uploadGrades(Number(classroomId), Number(examId), payload)
        .then(() => {
            // Then update is_graded to true
            return ExamService.updateExam(Number(examId), { is_graded: true });
        })
        .then(() => {
            setIsLoading(false);
            window.location.reload();
        })
        .catch((err) => {
            setIsLoading(false);
            console.error("Error in upload process:", err);
        });
    }

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
                const data = Papa.parse(csv as string, { header: true, skipEmptyLines: true }).data;
                
                // Validate CSV headers
                const requiredHeaders = ["Student ID", "Exam Version", "Exam Grade"];
                const headers = Object.keys((data as Record<string, any>[])[0] || []);
                
                // Check if all required headers are present
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    setFileError(`Missing required headers: ${missingHeaders.join(", ")}`);
                    return;
                }
                
                // Check if there are any question columns
                const questionCols = headers.filter(h => h.startsWith("Question"));
                if (questionCols.length === 0) {
                    setFileError("No question columns found in the CSV (expected columns like 'Question 1', 'Question 2', etc.)");
                    return;
                }

                const numOfQCols = questionCols.length;
                const studentIDs = (data as Record<string, any>[]).map((g) => Number(g["Student ID"]));
                const numOfQuestions = variants[0]?.answer_key?.split(",").length;
                
                if (!numOfQuestions) {
                    setFileError("Could not determine number of questions in the exam");
                    return;
                }
                
                if (numOfQCols !== numOfQuestions) {
                    setFileError(`Number of questions in CSV (${numOfQCols}) does not match exam (${numOfQuestions})`);
                    return;
                }
                
                const diff = diffArrays(studentIDs, students.map((s) => s.student_id));
                if (diff.onlyInArr2.length > 0) {
                    setFileError("Grade(s) Not uploaded for: " + diff.onlyInArr2.join(", "));
                    if (diff.onlyInArr1.length > 0) {
                        setFileError((prev) => prev + " Invalid Students ID(s): " + diff.onlyInArr1.join(", "));
                    }
                    return;
                }

                setFileGrades(data as Record<string, any>[]);
                const tempColumns = Object.keys((data as Record<string, any>[])[0]);
                const filteredColumns = tempColumns
                    .filter((col) => !col.startsWith("Question"))
                    .filter((col) => col !== "Percentage Score");
                setColumns(filteredColumns);
            };
            reader.readAsText(file);
        } else {
            setIsDragActive(false);
            setFileError("Invalid File Selected");
        }
    };

    const toggle = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
    }

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

    if (!user || !variants || !students || !apiGrades || isLoading) {
        return <Loading />
    }

    return (
        <div className="flex bg-[#EDEDED] h-screen">

            <div className="fixed top-0 left-0 h-screen w-[80px] lg:w-[230px] z-10">
            <CourseListSidebar
                darkMode={false}
                onToggleDarkMode={() => { }}
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
                            router.push(window.location.pathname.replace(`exams/${parts[3]}/upload-grades`, ""))
                        },
                    },
                    {
                        label: 'View Variants',
                        alt: 'View Variants',
                        iconSrc: '/variants.svg',
                        onClick: () => router.push(window.location.pathname.replace("upload-grades", "exam-variant")),
                    },
                    {
                        label: 'Upload Grade',
                        alt: 'Upload Grades',
                        iconSrc: '/mark.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Exam Analytics',
                        alt: 'Exam Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace("/upload-grades", "/examanalytics")),
                    },
                ]}
            />
            </div>
            
            
            <div className="flex flex-col flex-1 p-4 overflow-hidden ml-[80px] lg:ml-[240px]">
                <CourseListHeader
                    search={() => { }}
                    router={router}
                    showBackArrow={true}
                    searchPlaceholder="Search Information..."
                    onSettingsClick={() => {
                        const examId = window.location.pathname.split("/")[3];
                        const classroomId = window.location.pathname.split("/")[1];
                        router.push(`/${classroomId}/exams/${examId}/grades-settings`);
                    }}
                />
                <div className="flex items-center justify-between mb-2 mr-2">
                    <h1 className={`relative inline-block text-3xl font-medium group ''`}>
                        {/* Gradient text (light green) - only visible in light mode */}
                        <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600'}
    group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-green-700
    transition-all duration-500 `}>
                        Upload Grades
                        </span>
                    </h1>
                    <div className="flex items-center">
                        <button
                            className="bg-[#EDEDED] text-[#3774E5] text-sm px-2 py-1 rounded cursor-pointer hover:translate-y-[-5px] transition-all duration-200 flex items-center gap`-2"
                            onClick={() => {
                                const link = document.createElement("a");
                                link.href = "/student_grades_template.zip";
                                link.download = "student_grades_template.zip";
                                link.click();
                            }}
                        >
                            <img src="/export.svg" alt="Export Template" className="w-[25px] h-[25px]" />
                            Export Template
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4">
                        {apiGrades.length > 0 ? (
                            <div className="space-y-2">
                                {apiGrades.map((row, index) => {
                                    // assume your student id field is `student_id` and name is `student_name`
                                    const sid = String(row["Student ID"])
                                    const isOpen = !!expanded[sid]
                                    const examVersion = Number(row["Exam Version"])
                                    const questionKeys = Object.keys(row)
                                        .filter((k) => k.toLowerCase().startsWith("question"))
                                    const answers = questionKeys.map((k) => ({
                                        question: Number(k.replace("Question ", "")),
                                        is_correct: row[k].trim() === variants.find((v) => v.version_number === examVersion)?.answer_key?.split(",")[Number(k.replace("Question ", "")) - 1].trim(),
                                        answer: row[k].trim()
                                    }))

                                    return <GradeAccordian
                                        key={index}
                                        preview={false}
                                        row={row}
                                        toggle={toggle}
                                        isOpen={isOpen}
                                        students={students}
                                        answers={answers}
                                        gradeSettings={gradeSettings}
                                    />
                                })}
                            </div>
                        ) : (
                            <UploadComponent
                                getRootProps={getRootProps}
                                getInputProps={getInputProps}
                                isDragActive={isDragActive}
                                fileError={fileError}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {fileGrades && (
                <div
                    // make the overlay allow scrolling
                    className="fixed inset-0 z-50 bg-black/50"
                    onClick={() => setFileGrades(null)}      // clicking _anywhere_ closes
                >
                    {/* center via flex and add some padding so small screens show scrollbars */}
                    <div className="flex min-h-full items-center justify-center p-4 z-10">
                        <div
                            // this is your “white card”
                            className="relative max-h-[90vh] w-full overflow-y-auto overflow-x-hidden rounded-2xl bg-white px-6 py-4"
                            onClick={(e) => e.stopPropagation()}  // prevent clicks inside from closing
                        >
                            <div className="flex items-center justify-between p-2">
                                <h2 className="text-xl font-semibold">
                                    Preview
                                </h2>
                                <FaX
                                    className="cursor-pointer h-4 w-4 hover:translate-y-[-5px] transition-all duration-200"
                                    onClick={() => setFileGrades(null)}
                                />
                            </div>

                            {fileGrades.map((grade, idx) => {
                                const isOpen = !!expanded[grade["Student ID"]]
                                const examVersion = Number(grade["Exam Version"]);
                                const questionKeys = Object.keys(grade)
                                    .filter((k) => k.toLowerCase().startsWith("question"))
                                const answers = questionKeys.map((k) => ({
                                    question: Number(k.replace("Question ", "")),
                                    is_correct: grade[k].trim() === variants.find((v) => v.version_number === examVersion)?.answer_key?.split(",")[Number(k.replace("Question ", "")) - 1].trim(),
                                    answer: grade[k].trim()
                                }))
                                return (
                                    <div key={idx}>
                                        <GradeAccordian
                                            row={grade}
                                            toggle={toggle}
                                            preview={true}
                                            isOpen={isOpen}
                                            students={students}
                                            answers={answers}
                                            gradeSettings={gradeSettings}
                                        />
                                    </div>
                                )
                            })}

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    className="cursor-pointer rounded bg-gray-200 px-4 py-2 hover:translate-y-[-5px] transition-all duration-200"
                                    onClick={() => setFileGrades(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="cursor-pointer rounded bg-[#3774E5] px-4 py-2 text-white hover:translate-y-[-5px] transition-all duration-200"
                                    onClick={() => onUpload()}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


function UploadComponent({ getRootProps, getInputProps, isDragActive, fileError }: { getRootProps: any, getInputProps: any, isDragActive: any, fileError: any }) {
    return (
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
                            : "Drag & drop a CSV/XLSX here, or click to upload"}
                </p>
                <p className="text-sm text-gray-500">
                    CSV, XLSX, or XLS up to 50MB
                </p>
            </div>
        </div>
    )
}

// Helper function to convert hex color to Tailwind background class
const hexToTailwindBg = (hexColor: string, opacity: number = 50) => {
    // For now, we'll use a simplified approach with inline styles
    // In a production app, you might want to use a more sophisticated color mapping
    return `bg-[${hexColor}] bg-opacity-${opacity}`;
};

// Helper function to get color based on percentage and grade settings
const getColorForPercentage = (percentage: number, gradeSettings: any) => {
    // Use default values if gradeSettings is not properly loaded
    const highThreshold = gradeSettings?.highThreshold || 80;
    const mediumThreshold = gradeSettings?.mediumThreshold || 50;
    const highColor = gradeSettings?.highColor || '#10B981';
    const mediumColor = gradeSettings?.mediumColor || '#F59E0B';
    const lowColor = gradeSettings?.lowColor || '#EF4444';
    
    if (percentage >= highThreshold) {
        return highColor;
    } else if (percentage >= mediumThreshold) {
        return mediumColor;
    } else {
        return lowColor;
    }
};

const getGradeColors = (percentage: number, isPreview: boolean, gradeSettings: any) => {
    if (isPreview) return "border-gray-200 bg-white";
    
    const color = getColorForPercentage(percentage, gradeSettings);
    // Return class names for border and use inline style for background
    return "border-gray-200";
};

const getHoverColors = (percentage: number, isPreview: boolean, gradeSettings: any) => {
    if (isPreview) return "bg-gray-100 hover:bg-gray-200";
    
    const color = getColorForPercentage(percentage, gradeSettings);
    // Return class names for hover and use inline style for background
    return "";
};

function GradeAccordian(
    {
        row,
        toggle,
        isOpen,
        students,
        preview,
        answers,
        gradeSettings,
    }: {
        row: any,
        toggle: (id: string) => void,
        isOpen: boolean,
        students: any[],
        preview?: boolean,
        answers: Answer[],
        gradeSettings: any,
    }) {
    const chunks: Answer[][] = []
    for (let i = 0; i < answers.length; i += 20) {
        chunks.push(answers.slice(i, i + 20))
    }

    const sparkRefs = useRef<Array<HTMLDivElement | null>>([])

    useEffect(() => {
        if (isOpen) {
            chunks.forEach((chunk, idx) => {
                const container = sparkRefs.current[idx]
                if (container) {
                    renderSparkStrip(container, chunk)
                }
            })
        }
    }, [isOpen, answers])

    const examGrade = Number(row["Exam Grade"]);
    const mcqGrade = Number(row["Percentage Score"]);
    const displayGrade = examGrade || mcqGrade; // Use exam grade if available, otherwise fall back to MCQ grade
    
    const gradeColors = getGradeColors(displayGrade, preview === true, gradeSettings);
    const hoverColors = getHoverColors(displayGrade, preview === true, gradeSettings);
    const backgroundColor = preview === true ? "white" : getColorForPercentage(displayGrade, gradeSettings) + "1A";
    const hoverBackgroundColor = preview === true ? "#f3f4f6" : getColorForPercentage(displayGrade, gradeSettings) + "33";


       return (
        <div key={row["Student ID"]}
            className={`border-2 rounded-lg overflow-hidden mb-2 ${gradeColors}`}
            style={{ backgroundColor: backgroundColor }}>
            <button
                onClick={() => toggle(row["Student ID"])}
                className={`w-full flex justify-between items-center px-4 py-3 transition cursor-pointer ${hoverColors}`}
                style={{ 
                    backgroundColor: backgroundColor,
                    '--hover-bg-color': hoverBackgroundColor 
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBackgroundColor;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = backgroundColor;
                }}
            >
                <div className="flex items-center gap-1">
                    <span className="font-medium">
                        {
                            students.find((s) => s.student_id === Number(row["Student ID"]))?.first_name
                            + " "
                            + students.find((s) => s.student_id === Number(row["Student ID"]))?.last_name
                            + " (#" + row["Student ID"] + ")"
                        }
                    </span>
                    <span className="text-xs">
                        Attempted Version {row["Exam Version"]}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {
                        preview === false && (
                            <div className="flex gap-2">
                                {row["Exam Grade"] && (
                                    <div className="border rounded-sm px-2 bg-blue-50 text-blue-700">
                                        Exam: {row["Exam Grade"]}%
                                    </div>
                                )}
                                <div className="border rounded-sm px-2 bg-gray-50 text-gray-700">
                                    MCQ: {row["Percentage Score"]}%
                                </div>
                            </div>
                        )
                    }
                    {isOpen
                        ? <FaChevronUp className="h-4 w-4" />
                        : <FaChevronDown className="h-4 w-4" />
                    }
                </div>
            </button>
            {isOpen && (
                <div className="flex flex-col bg-white px-4 py-3 gap-4">
                    <style>{`
                            .heat {
                                stroke: #ff0000;
                                stroke-width: 0.5;
                                cursor: pointer;
                            }
                        `}
                    </style>
                    {chunks.map((_, idx) => (
                        <div
                            key={idx}
                            ref={el => {
                                sparkRefs.current[idx] = el
                            }}
                            className="w-full"
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

type DiffResult = {
    onlyInArr1: Array<string | number>;
    onlyInArr2: Array<string | number>;
};

/**
 * Compare two arrays as multisets, returning separate diffs.
 *
 * @param arr1
 * @param arr2
 * @returns
 *   - onlyInArr1: elements (with duplicates) that are in arr1 but not in arr2
 *   - onlyInArr2: elements (with duplicates) that are in arr2 but not in arr1
 */
function diffArrays(
    arr1: Array<string | number>,
    arr2: Array<string | number>
): DiffResult {
    const freq1: Record<string | number, number> = {};
    const freq2: Record<string | number, number> = {};

    // build frequency maps
    arr1.forEach(x => { freq1[x] = (freq1[x] || 0) + 1; });
    arr2.forEach(x => { freq2[x] = (freq2[x] || 0) + 1; });

    // prepare output lists
    const onlyInArr1: Array<string | number> = [];
    const onlyInArr2: Array<string | number> = [];

    // consider every unique item
    for (const item of new Set([...arr1, ...arr2])) {
        const c1 = freq1[item] || 0;
        const c2 = freq2[item] || 0;
        const delta = c1 - c2;

        if (delta > 0) {
            // arr1 has `delta` extras
            for (let i = 0; i < delta; i++) {
                onlyInArr1.push(item);
            }
        } else if (delta < 0) {
            // arr2 has `-delta` extras
            for (let i = 0; i < -delta; i++) {
                onlyInArr2.push(item);
            }
        }
    }

    return { onlyInArr1, onlyInArr2 };
}