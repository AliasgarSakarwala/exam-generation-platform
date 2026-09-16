import React, { useState } from 'react';
import { ExamService } from '../../services/exam';
import { createExamVariant } from '../../services/exam_variant';
import { ExamVariantQuestionService } from '../../services/exam_variant_question';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ExamCardUpload = () => {
    const [isLoading, setIsLoading] = useState(false);

    //forced nested O(VQ) implmentation of uplaod varinats and their question, keeping as it migh tbe beneficial in future in case it proves to be better

    // const handleUpload = async () => {
    //     setIsLoading(true);
    //     const toastId = toast.info(
    //         <div className="flex items-center">
    //             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    //                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    //                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    //             </svg>
    //             <span>Uploading exam data...</span>
    //         </div>,
    //         {
    //             autoClose: false,
    //             closeButton: false,
    //         }
    //     );

    //     try {
    //         // Get data from localStorage
    //         const examData = JSON.parse(localStorage.getItem('examData') || '{}');
    //         const examVariants = JSON.parse(localStorage.getItem('examVariants22') || '[]');
    //         console.log('exam mmm: ',examVariants);

    //         if (!examData.examTitle || !examVariants || examVariants.length === 0) {
    //             throw new Error('No valid exam data found');
    //         }

    //         const pathArray = window.location.pathname.split('/');
    //         const classroomId = parseInt(pathArray[1]);

    //         // Create the exam
    //         const newExam = await ExamService.createExam({
    //             classroom_id: classroomId,
    //             title: examData.examTitle,
    //             description: 'Uploaded from localStorage',
    //             total_points: 100,
    //             question_count: parseInt(examData.numQuestions) || 0,
    //             variant_count: parseInt(examData.numVariants) || 0,
    //             available_from: null,
    //             available_to: null,
    //             is_published: false,
    //             is_graded: false,
    //         });

    //         // Create variants and questions
    //         for (const variantData of examVariants) {
    //             // Create the variant
    //             const newVariant = await createExamVariant(newExam.exam_id, {
    //                 version_number: variantData.version_number,
    //                 answer_key: variantData.answer_key,
    //                 instructions: '',
    //             });

    //             // Create questions for this variant

    //             if (variantData.questions?.length > 0) {
    //                 const questions = variantData.questions.map((q: { question_id: any, question_text: any; question_number: any; options: any; correct_options: any; }) => ({


    //                     question_id: q.question_id,
    //                     question_text: q.question_text,
    //                     question_number: q.question_number,
    //                     options: q.options,
    //                     correct_options: q.correct_options,
    //                     mandatory: false

    //                 }));


    //                 await ExamVariantQuestionService.createQuestionsForVariant(
    //                     newVariant.exam_variant_id,
    //                     questions
    //                 );
    //             }
    //         }

    //         // Clear local storage
    //         localStorage.removeItem('examData');
    //         localStorage.removeItem('examVariants22');

    //         toast.dismiss(toastId);
    //         toast.success('Exam and all variants/questions saved successfully!', {
    //             autoClose: 3000,
    //         });

    //         // Redirect after successful upload
    //         setTimeout(() => {
    //             const currentPath = window.location.pathname;
    //             const basePath = currentPath.split('/').slice(0, 2).join('/');
    //             window.location.href = basePath;
    //         }, 1500);

    //     } catch (error) {
    //         console.error('Upload failed:', error);
    //         toast.dismiss(toastId);
    //         toast.error(`Failed to upload exam data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
    //             autoClose: 3000,
    //         });
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleUpload = async () => {
        setIsLoading(true);
        const toastId = toast.info(
            <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading exam data...</span>
            </div>,
            {
                autoClose: false,
                closeButton: false,
            }
        );

        try {
            // Get data from localStorage
            const examData = JSON.parse(localStorage.getItem('examData') || '{}');
            const examVariants = JSON.parse(localStorage.getItem('examVariants22') || '[]');

            if (!examData.examTitle || !examVariants || examVariants.length === 0) {
                throw new Error('No valid exam data found');
            }

            const pathArray = window.location.pathname.split('/');
            const classroomId = parseInt(pathArray[1]);

            // Create the exam first
            const newExam = await ExamService.createExam({
                classroom_id: classroomId,
                title: examData.examTitle,
                description: 'Uploaded from localStorage',
                total_points: 100,
                question_count: parseInt(examData.numQuestions) || 0,
                variant_count: parseInt(examData.numVariants) || 0,
                available_from: null,
                available_to: null,
                is_published: false,
                is_graded: false,
            });

            // Prepare all variant creation promises
            const variantPromises = examVariants.map((variantData: { version_number: any; answer_key: any; }) =>
                createExamVariant(newExam.exam_id, {
                    version_number: variantData.version_number,
                    answer_key: variantData.answer_key,
                    instructions: '',
                })
            );

            // Create all variants in parallel
            const variants = await Promise.all(variantPromises);

            // Prepare all question creation promises
            const questionPromises = variants.map((variant, index) => {
                const variantQuestions = examVariants[index].questions || [];
                if (variantQuestions.length === 0) return Promise.resolve();

                const questions = variantQuestions.map((q: { question_id: any; question_text: any; question_number: any; options: any; correct_options: any; }) => ({
                    question_id: q.question_id,
                    question_text: q.question_text,
                    question_number: q.question_number,
                    options: q.options,
                    correct_options: q.correct_options,
                    mandatory: false
                }));

                return ExamVariantQuestionService.createQuestionsForVariant(
                    variant.exam_variant_id,
                    questions
                );
            });

            // Create all questions in parallel
            await Promise.all(questionPromises);

            // Clear local storage
            localStorage.removeItem('examData');
            localStorage.removeItem('examVariants22');

            toast.dismiss(toastId);
            toast.success('Exam and all variants/questions saved successfully!', {
                autoClose: 3000,
            });

            // Redirect after successful upload
            setTimeout(() => {
                const currentPath = window.location.pathname;
                const basePath = currentPath.split('/').slice(0, 2).join('/');
                window.location.href = basePath;
            }, 1500);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.dismiss(toastId);
            toast.error(`Failed to upload exam data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                autoClose: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <ToastContainer
                position="top-right"
                newestOnTop
                pauseOnFocusLoss={false}
            />

            <button
                onClick={handleUpload}
                disabled={isLoading}
                className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl
        text-white font-medium shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 via-teal-500/90 to-teal-600 hover:from-teal-600 hover:via-teal-600/90 hover:to-teal-700 active:from-teal-700 active:via-teal-700/90 active:to-teal-800'
                    }
        focus:outline-none focus:ring-2 focus:ring-teal-400/80 focus:ring-offset-2
        ${!isLoading &&
                    'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                    }
        overflow-hidden
        group
      `}
            >
                {/* Gradient overlay */}
                <span className="absolute inset-0 bg-gradient-to-r 
        from-teal-400/10 via-teal-500/20 to-teal-600/30 
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-700 ease-in-out"></span>

                {/* Shine effect */}
                <span className="absolute inset-0 overflow-hidden">
                    <span className="absolute top-0 -left-full w-1/2 h-full 
          bg-white/20 -skew-x-12
          group-hover:animate-shine group-hover:[animation-duration:1.8s] 
          transition-all duration-500 pointer-events-none"></span>
                </span>

                {isLoading ? (
                    <>
                        <span className="relative z-10">Variants Being Uploaded</span>
                        <svg
                            className="w-5 h-5 animate-spin relative z-10"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </>
                ) : (
                    <>
                        <span className="relative z-10 drop-shadow-sm">Select Variants</span>
                        <svg
                            className="w-5 h-5 relative z-10 transition-all duration-300 
            group-hover:scale-110 group-hover:animate-pulse group-hover:drop-shadow-glow"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </>
                )}
            </button>
        </div>
    );
};
    export default ExamCardUpload;