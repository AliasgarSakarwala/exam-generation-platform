"use client";

import React, {
    useEffect,
    useState,
    useTransition,
    useCallback,
    useRef,
} from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Classroom, getClassroomById } from "@/services/classroom";
import Loading from "@/app/loading";
import CourseListSidebar from "@/app/components/CourseListSidebar";
import CourseListHeader from "@/app/components/CourseListHeader";
import CustomTable from "@/app/components/Table";
import { useRouter, notFound } from "next/navigation";
import { createQuestionBank, listQuestionBanks } from "@/services/question_bank";
import QuestionBankCard, { FileStats } from "@/components/QuestionBank/question_bank_card";
import QuestionBankCardPreview, { FileData } from "@/components/QuestionBank/question_bank_preview";
import { toast } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingSteps } from "@/config/onboardingSteps";
import OnboardingStep from "@/components/OnboardingStep";
import { OnboardingPages } from "@/config/onboardingSteps";
import { updateUser } from "@/services/profile";

interface QuestionBankPageProps {
    params: Promise<{ course_id: string }>;
}

const QuestionBankWithOnboarding: React.FC<QuestionBankPageProps> = ({ params }) => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.questionBank);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step’s target
    useEffect(() => {
        if (!state.isActive || !currentStep) {
            setTargetElement(null);
            return;
        }

        const { id: stepId, targetSelector: selector } = currentStep;

        // ——— SKIP “edit-student-0” if no question bank cards present ———
        if (stepId === 'question-bank-card-0') {
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
            <QuestionBank params={params} />
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

export default function QuestionBankWrapper({ params }: QuestionBankPageProps) {
    return <QuestionBankWithOnboarding params={params} />;
};

function QuestionBank({ params }: QuestionBankPageProps) {
    const { course_id } = React.use(params);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [isPending, startTransition] = useTransition();
    const [filesData, setFilesData] = useState<FileData[]>([]);
    const [apiData, setAPIData] = useState<{ [key: string]: Record<string, any>[] }>({});
    const [modalFile, setModalFile] = useState<FileData | null>(null);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [apiQuestionBanks, setApiQuestionBanks] = useState<{ [key: string]: any }[] | null>(null);
    const [filteredQuestionBanks, setFilteredQuestionBanks] = useState<{ [key: string]: any }[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // fetch classroom meta + existing banks
    useEffect(() => {
        setIsLoading(true);
        startTransition(() => {
            getClassroomById(Number(course_id))
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        setClassroom(res.data);
                        listQuestionBanks(Number(course_id))
                            .then((res) => {
                                if (res.status >= 200 && res.status < 300) {
                                    console.log("Question Banks:", res.data);
                                    setApiQuestionBanks(res.data.length ? res.data as { [key: string]: any }[] : []);
                                    setFilteredQuestionBanks(res.data.length ? res.data as { [key: string]: any }[] : []);
                                }
                            })
                            .catch(() => { /* ignore */ });
                    } else {
                        console.log("Invalid classroom ID");
                    }
                })
                .catch(() => console.log("Invalid classroom ID"));
        });
        setIsLoading(false);
    }, [course_id]);

    // handle click "Add New" → open file dialog
    const handleAddNew = () => {
        fileInputRef.current?.click();
    };

    // when file input changes, parse files just like drop
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length) {
            onDrop(files);
            // clear the input so same file can be re-selected if needed
            e.target.value = "";
        }
    };

    const onSave = () => {
        setIsLoading(true);
        startTransition(() => {
            console.log("Saving...", apiData);
            const payload: Record<string, any[]> = {};
            filesData.forEach(({ id, fileName }) => {
                if (!fileName) return;
                fileName = fileName.trim();
                // use the display name as the bank name,
                // but pull the questions from apiData by id
                payload[fileName] = apiData[id];
            });
            console.log("Payload:", payload);
            createQuestionBank(payload, Number(course_id))
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        toast.success("Question Bank(s) Saved Successfully", {
                            position: "top-right",
                            duration: 5000,
                        });
                        setIsLoading(false);
                        window.location.reload();
                    }
                })
                .catch(() => { /* ignore */
                    setIsLoading(false);
                });
        });
    };

    // parse dropped or selected files
    // Update the onDrop function in your component
    const onDrop = useCallback((files: File[]) => {
        setFileError(null);
        const selected = files.slice(0, 10);
        if (!selected.length) {
            setFileError("Invalid File Type. Please Upload a CSV or XLSX file");
            return;
        }
        const parses = selected.map((file) => {
            return new Promise<FileData>((resolve, reject) => {
                const fileName = file.name.replace(".csv", "").replace(".xlsx", "").replace(".xls", "");
                const id = fileName;
                const updatedAt = new Date(file.lastModified).toLocaleDateString();

                const finish = (parsed: Record<string, any>[]) => {
                    // Process each question to handle tags properly
                    const processedQuestions = parsed.map(question => {
                        // Extract tags from both 'tag1-5' and 'Tag 1-5' formats
                        const tags: Record<string, string> = {};
                        for (let i = 1; i <= 5; i++) {
                            const tagValue = question[`tag${i}`] || question[`Tag ${i}`];
                            if (tagValue?.trim()) {
                                tags[`Tag ${i}`] = tagValue.trim();
                            }
                        }

                        // Ensure all required fields are present
                        if (!question.Question || !question.Answer || !question.Difficulty) {
                            throw new Error('Missing required fields in question');
                        }

                        // Process options (1-6)
                        const options: Record<string, string> = {};
                        for (let i = 1; i <= 6; i++) {
                            const optKey = `Option ${i}`;
                            options[optKey] = question[optKey]?.trim() || ' ';
                        }

                        return {
                            ...question,
                            ...options,
                            ...tags
                        };
                    });

                    setAPIData((prev) => ({ ...prev, [fileName]: processedQuestions }));

                    const columns = Object.keys(processedQuestions[0] || {})
                        .filter((key) => !key.startsWith("Option"))
                        .filter((key) => key !== "dbID" && key !== "Answer");

                    const rows = processedQuestions;
                    const easy = rows.filter((r) => r.Difficulty === "Easy").length;
                    const medium = rows.filter((r) => r.Difficulty === "Medium").length;
                    const hard = rows.filter((r) => r.Difficulty === "Hard").length;

                    resolve({
                        id,
                        fileName,
                        columns,
                        rows,
                        stats: { total: rows.length, easy, medium, hard, updatedAt },
                    });
                };

                if (file.name.endsWith(".csv")) {
                    Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: ({ data }) => finish(data as any[]),
                        error: (err) => reject(err),
                    });
                } else {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const wb = XLSX.read(e.target?.result, { type: "array" });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        finish(XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[]);
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsArrayBuffer(file);
                }
            });
        });

        Promise.all(parses)
            .then((newFiles) => {
                setFilesData((prev) => {
                    // build a Set of the names we already have
                    const seen = new Set(prev.map((f) => f.fileName));
                    // only add those that aren't already present
                    const toAdd = newFiles.filter((f) => !seen.has(f.fileName));
                    return [...prev, ...toAdd];
                });
            })
            .catch((error) => {
                console.error("Parsing error:", error);
                setFileError("Error parsing file. Please check the format.");
            });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        maxFiles: 10,
        accept: {
            "text/csv": [".csv"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        noClick: false, // we handle click via Add New
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (apiQuestionBanks) {
            const value = e.target.value.toLowerCase()
            if (!value) {
                setFilteredQuestionBanks(apiQuestionBanks)
            } else {
                const tempQuestionBanks = apiQuestionBanks.filter((questionBank: any) =>
                    questionBank.name.toLowerCase().includes(value)
                )
                setFilteredQuestionBanks(tempQuestionBanks)
            }
        }
    }

    if (isPending || !classroom || isLoading || !user || !apiQuestionBanks) return <Loading />;

    return (
        <div className="flex bg-[#EDEDED] h-screen overflow-hidden">
            {/* hidden file input for Add New */}
            <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileInput}
                style={{ display: "none" }}
            />

            {/* Sidebar */}
            <CourseListSidebar
                darkMode={false}
                archived={user.role === "Admin"}
                onToggleDarkMode={() => { }}
                tutorialPage="questionBank"
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
                        onClick: () => router.push(window.location.pathname.replace("/questions", "")),
                    },
                    {
                        label: 'Question Banks',
                        alt: 'Question Banks',
                        iconSrc: '/question-bank.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Student Roster',
                        alt: 'Student Roster',
                        iconSrc: '/students.svg',
                        onClick: () => router.push(window.location.pathname.replace("/questions", "/students")),
                    },
                    {
                        label: 'Grades Analytics',
                        alt: 'Grades Analytics',
                        iconSrc: '/student-grade.svg',
                        onClick: () => router.push(window.location.pathname.replace('/questions', '/students-grades')),
                    },
                    {
                        label: 'Course Analytics',
                        alt: 'Course Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => router.push(window.location.pathname.replace("/questions", "/courseanalytics")),
                    },
                ]}
            />

            {/* Main panel */}
            <div className="flex flex-col flex-1 p-6 overflow-hidden">
                <CourseListHeader
                    searchPlaceholder="Search Question Banks..."
                    search={handleSearch}
                />

                <div className="flex items-center justify-between mb-2 mr-2">
                    <h1 className={`relative inline-block text-3xl font-medium group ''`}>
                        {/* Gradient text (light orange) - only visible in light mode */}
                        <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
    transition-all duration-500 `}>

                            {classroom.name} – {filesData.length > 0 ? "Add Questions" : "Question Banks"}
                        </span>
                        {(
                            <span className="absolute inset-0 overflow-hidden">
                                <span className="absolute top-0 -left-full w-1/2 h-full 
        bg-white/30 -skew-x-12
        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
        transition-all duration-500 pointer-events-none"></span>
                            </span>
                        )}
                    </h1>

                    {/* EXPORT button */}
                    <div className="flex items-center gap-2">
                        <button
                            className={`relative inline-block text-lg font-medium group ''`}
                            onClick={() => {
                                const link = document.createElement("a");
                                link.href = "/question-bank-template.zip";
                                link.download = "question-bank-template.zip";
                                link.click();
                            }}
                            data-onboarding="export-template"
                        >
                            <div className="flex items-center gap-2">
                                {/* Replace the SVG color with currentColor and let the gradient handle it */}
                                <img
                                    src="/export.svg"
                                    alt="Export Template"
                                    className="w-[25px] h-[25px] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600
                group-hover:from-orange-500 group-hover:to-orange-700"
                                    style={{
                                        filter: 'brightness(0) saturate(100%) invert(61%) sepia(95%) saturate(300%) hue-rotate(330deg) brightness(90%) contrast(90%)',
                                    }}
                                />
                                <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600'}
    group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-700
    transition-all duration-500 `}>Export Template</span>
                            </div>
                        </button>

                        {/* Add Question bank button */}
                        <button
                            className={`
    relative overflow-hidden
    text-white font-medium text-sm border-none rounded-full
    cursor-pointer shadow-lg hover:shadow-xl
    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    flex items-center justify-center
    bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700
    hover:from-orange-600 hover:via-orange-700 hover:to-orange-800
    active:from-orange-700 active:via-orange-800 active:to-orange-900
    focus:outline-none focus:ring-2 focus:ring-orange-400/80 focus:ring-offset-2
    group
    px-4 py-2  // Increased padding 
    min-w-[140px] // Ensures consistent width`}
                            onClick={handleAddNew}
                            data-onboarding='add-question-banks'
                        >
                            <FaPlus className="relative z-10 w-4 h-4 transition-transform duration-600 ease-in-out group-hover:rotate-[720deg]" />

                            {/* Text */}
                            <span className="relative z-10 ml-3 text">Add New QB</span>
                        </button>
                        {filesData.length > 0 && (
                            <button
                                className="bg-[#3774E5] text-white px-4 py-2 rounded cursor-pointer hover:translate-y-[-5px] transition-all duration-200"
                                onClick={onSave}
                            >
                                Save All
                            </button>
                        )}
                    </div>
                </div>

                {/* White card */}
                <div
                    className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden"
                    data-testid="question-bank-container"
                >
                    {filesData.length > 0 ? (
                        <div className="flex-1 overflow-auto p-4 grid gap-4 lg:grid-cols-2 grid-cols-1">
                            {filesData.map((fd) => (
                                <QuestionBankCardPreview
                                    key={fd.id}
                                    {...fd}
                                    setModalFile={setModalFile}
                                    nameOnChange={(id, newName) => {
                                        // only update your display names; apiData still keyed by id
                                        setFilesData(prev =>
                                            prev.map(f =>
                                                f.id === id ? { ...f, fileName: newName } : f
                                            )
                                        );
                                    }}
                                    handleRemove={(id) => {
                                        // remove from both your arrays/maps, by id
                                        setFilesData(prev => prev.filter(f => f.id !== id));
                                        setAPIData(prev => {
                                            const next = { ...prev };
                                            delete next[id];
                                            return next;
                                        });
                                        if (modalFile?.id === id) setModalFile(null);
                                    }}
                                    questionBankName={fd.fileName}
                                />
                            ))}
                        </div>
                    ) : apiQuestionBanks.length > 0 ? (
                        <div className="flex-1 overflow-auto p-4 grid gap-4 lg:grid-cols-2 grid-cols-1">
                            {filteredQuestionBanks!.map((bank, index) => {
                                const bankQuestions = bank[bank.name];
                                const columns = Object.keys(bankQuestions[0])
                                    .filter((key) => !key.startsWith("Option"))
                                    .filter((key) => key !== "dbID" && key !== "Answer");
                                const stats: FileStats = {
                                    total: bank.questions_count,
                                    easy: bank.questions_count,
                                    medium: bank.questions_count,
                                    hard: bank.questions_count,
                                    updatedAt: new Date(bank.updated_at).toLocaleDateString(),
                                };
                                return (
                                    <QuestionBankCard
                                        key={bank.question_bank_id}
                                        bank_id={bank.question_bank_id}
                                        name={bank.name}
                                        columns={columns}
                                        questions={bankQuestions}
                                        stats={stats}
                                        router={router}
                                        dataOnboarding={`question-bank-card-${index}`}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
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
                                            : "Drag & drop a CSV/XLSX here, or click “Add New”"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    CSV, XLSX, or XLS up to 50MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* File-level Modal */}
            {
                modalFile && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        onClick={() => setModalFile(null)}
                    >
                        <div
                            className="bg-white rounded-2xl w-[90%] max-w-5xl max-h-2xl h-[90%] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-full p-6 overflow-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{modalFile.fileName}</h2>
                                    <button
                                        onClick={() => setModalFile(null)}
                                        className="text-gray-500 hover:text-gray-800"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <CustomTable
                                    columns={modalFile.columns}
                                    isPreview
                                    rows={modalFile.rows}
                                    onDelete={() => { }}
                                    onView={(row) => setSelectedRow(row)}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Row-level Modal */}
            {
                selectedRow && (
                    <div
                        className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center"
                        onClick={() => setSelectedRow(null)}
                    >
                        <div
                            className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Question Details</h3>
                                <button onClick={() => setSelectedRow(null)}>✕</button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <p>
                                    <strong>Question:</strong> {selectedRow.Question}
                                </p>
                                {["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"]
                                    .filter((opt) => opt in selectedRow)
                                    .map((opt) => (
                                        <p key={opt} className="indent-5">
                                            <strong>{opt}:</strong> {selectedRow[opt]}
                                        </p>
                                    ))}
                                <p className="mt-2">
                                    <strong>Answer:</strong> {selectedRow.Answer}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}