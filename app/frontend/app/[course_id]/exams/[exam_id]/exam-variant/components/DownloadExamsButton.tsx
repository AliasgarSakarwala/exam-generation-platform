'use client';

import React, { useState, useCallback } from 'react';
import DownloadOptionsModal from './DownloadOptionModal';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Packer } from "docx";

interface ExamVariantData {
    exam_variant_id: number;
    version_number: number;
    answer_key?: string | null;
    questions: ExamVariantQuestionData[];
}

interface ExamVariantQuestionData {
    question_text: string;
    question_number: number;
    options: string[];
    correct_options: string[];
}

interface DownloadExamButtonProps {
    examId: number;
    title: string;
}

const DownloadExamButton = ({ examId, title }: DownloadExamButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Get the stored variants from localStorage
    const getStoredVariants = (): ExamVariantData[] => {
        try {
            const storedData = localStorage.getItem(`ExamCardDetails-${examId}`);
            return storedData ? JSON.parse(storedData) : [];
        } catch (err) {
            console.error('Error parsing stored variants:', err);
            return [];
        }
    };

    const storedVariants = getStoredVariants();

    const generateDocxForVariant = async (variant: ExamVariantData) => {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Exam Title
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: title,
                                bold: true,
                                size: 24,
                            })
                        ],
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),

                    // Version Number
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Version ${variant.version_number}`,
                                bold: true,
                                size: 20,
                            })
                        ],
                        heading: HeadingLevel.HEADING_4,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),

                    // Horizontal rule
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "_____________________________________________________________",
                                color: "1a3a6e",
                            }),
                        ],
                        spacing: { after: 400 },
                    }),

                    // Student Information section
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Student Information:",
                                bold: true,
                                size: 18,
                            })
                        ],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 200 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Name: __________________________________________________",
                                size: 14,
                            })
                        ],
                        spacing: { after: 200 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Student ID: ____________________________________________",
                                size: 14,
                            })
                        ],
                        spacing: { after: 200 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Date: ________________________",
                                size: 14,
                            })
                        ],
                        spacing: { after: 400 },
                    }),

                    // Instructions section
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Instructions:",
                                bold: true,
                                size: 18,
                            })
                        ],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 200 },
                    }),

                    ...[
                        '1. This examination consists of multiple-choice questions.',
                        '2. Answer all questions by marking the appropriate box on the answer sheet.',
                        '3. Each question has only one correct answer.',
                        '4. Unauthorized materials are not permitted during this examination.',
                        '5. Write clearly and ensure your student information is complete.'
                    ].map(instruction => new Paragraph({
                        children: [new TextRun({ text: instruction, size: 14 })],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 100 },
                    })),

                    // Questions section header
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "_____________________________________________________________",
                                color: "1a3a6e",
                            }),
                        ],
                        spacing: { before: 400, after: 400 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Multiple Choice Questions",
                                italics: true,
                                bold: true,
                                color: "1a3a6e",
                                size: 18,
                            })
                        ],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 400 },
                    }),

                    // Questions
                    ...variant.questions.flatMap((question, index) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${question.question_number}. `,
                                    bold: true,
                                    size: 14,
                                }),
                                new TextRun({
                                    text: question.question_text,
                                    size: 14,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        ...question.options.map((option, optionIndex) => new Paragraph({
                            children: [
                                new TextRun({
                                    text: `   ${String.fromCharCode(65 + optionIndex)}. `,
                                    bold: true,
                                    size: 14,
                                }),
                                new TextRun({
                                    text: option,
                                    color: "333333",
                                    size: 14,
                                }),
                            ],
                            indent: { left: convertInchesToTwip(0.4) },
                            spacing: { after: 100 },
                        })),

                        // Add space between questions
                        new Paragraph({
                            children: [new TextRun({ text: "" })],
                            spacing: { after: 200 },
                        }),
                    ]),

                    // Footer
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "_____________________________________________________________",
                                color: "808080",
                            }),
                        ],
                        spacing: { before: 800 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "End of Examination",
                                italics: true,
                                color: "808080",
                                size: 14,
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                ],
            }],
        });

        // Generate the blob
        const blob = await Packer.toBlob(doc);
        return blob;
    };

    const generatePdfForVariant = async (variant: ExamVariantData) => {
        const pdfDoc = await PDFDocument.create();
        const pageSize: [number, number] = [595, 842]; // A4 size in points
        let page = pdfDoc.addPage(pageSize);

        // Design constants
        const margin = { top: 70, bottom: 60, left: 60, right: 60 };
        const contentWidth = pageSize[0] - margin.left - margin.right;
        let yPosition = pageSize[1] - margin.top;

        // Colors
        const black = rgb(0, 0, 0);
        const darkGray = rgb(0.2, 0.2, 0.2);
        const mediumGray = rgb(0.5, 0.5, 0.5);
        const lightGray = rgb(0.8, 0.8, 0.8);
        const primaryColor = rgb(0.1, 0.3, 0.6);

        // Fonts
        const mainFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
        const boldItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

        // Exam Title
        page.drawText(title, {
            x: margin.left,
            y: yPosition,
            size: 16,
            font: boldFont,
            color: primaryColor,
            maxWidth: contentWidth,
            lineHeight: 18,
        });
        yPosition -= 30;

        // Version Number
        page.drawText(`Version ${variant.version_number}`, {
            x: margin.left,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: primaryColor,
        });
        yPosition -= 30;

        // Horizontal rule
        page.drawLine({
            start: { x: margin.left, y: yPosition },
            end: { x: pageSize[0] - margin.right, y: yPosition },
            thickness: 1,
            color: primaryColor,
        });
        yPosition -= 30;

        // Student information section
        page.drawText('Student Information:', {
            x: margin.left,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: black,
        });
        yPosition -= 20;

        const studentInfoLines = [
            `Name: __________________________________________________`,
            `Student ID: ____________________________________________`,
            `Date: ________________________`
        ];

        studentInfoLines.forEach(line => {
            page.drawText(line, {
                x: margin.left,
                y: yPosition,
                size: 12,
                font: mainFont,
                color: black,
            });
            yPosition -= 20;
        });

        // Instructions section
        yPosition -= 20;
        page.drawText('Instructions:', {
            x: margin.left,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: black,
        });
        yPosition -= 15;

        const instructions = [
            '1. This examination consists of multiple-choice questions.',
            '2. Answer all questions by marking the appropriate box on the answer sheet.',
            '3. Each question has only one correct answer.',
            '4. Unauthorized materials are not permitted during this examination.',
            '5. Write clearly and ensure your student information is complete.'
        ];

        instructions.forEach(instruction => {
            page.drawText(instruction, {
                x: margin.left + 10,
                y: yPosition,
                size: 11,
                font: mainFont,
                color: darkGray,
            });
            yPosition -= 14;
        });

        // Questions section header
        yPosition -= 30;
        page.drawLine({
            start: { x: margin.left, y: yPosition },
            end: { x: pageSize[0] - margin.right, y: yPosition },
            thickness: 1,
            color: primaryColor,
        });
        yPosition -= 20;

        page.drawText('Multiple Choice Questions', {
            x: margin.left,
            y: yPosition,
            size: 14,
            font: boldItalicFont,
            color: primaryColor,
        });
        yPosition -= 25;

        // Process questions
        variant.questions.forEach((question, index) => {
            const questionText = `${question.question_number}. ${question.question_text}`;
            const questionLines = Math.ceil(questionText.length / 90) + 1;
            const optionsSpace = question.options.length * 18;
            const totalSpace = (questionLines * 14) + optionsSpace + 30;

            // Check if we need a new page
            if (yPosition - totalSpace < margin.bottom) {
                page = pdfDoc.addPage(pageSize);
                yPosition = pageSize[1] - margin.top;
            }

            // Question text
            page.drawText(`${question.question_number}.`, {
                x: margin.left,
                y: yPosition,
                size: 12,
                font: boldFont,
                color: black,
            });

            page.drawText(question.question_text, {
                x: margin.left + 20,
                y: yPosition,
                size: 12,
                font: mainFont,
                color: black,
                maxWidth: contentWidth - 20,
                lineHeight: 14,
            });

            const questionHeight = Math.max(14, (question.question_text.split('\n').length * 14));
            yPosition -= questionHeight + 10;

            // Options
            question.options.forEach((option, optionIndex) => {
                page.drawText(`${String.fromCharCode(65 + optionIndex)}.`, {
                    x: margin.left + 30,
                    y: yPosition,
                    size: 11,
                    font: boldFont,
                    color: black,
                });

                page.drawText(option, {
                    x: margin.left + 50,
                    y: yPosition,
                    size: 11,
                    font: mainFont,
                    color: darkGray,
                    maxWidth: contentWidth - 50,
                    lineHeight: 12,
                });

                yPosition -= 18;
            });

            yPosition -= 15;

            // Add separator line between questions
            if (index < variant.questions.length - 1) {
                page.drawLine({
                    start: { x: margin.left, y: yPosition + 5 },
                    end: { x: pageSize[0] - margin.right, y: yPosition + 5 },
                    thickness: 0.3,
                    color: lightGray,
                    opacity: 0.7,
                });
                yPosition -= 15;
            }
        });

        // Footer
        yPosition -= 30;
        page.drawLine({
            start: { x: margin.left, y: yPosition },
            end: { x: pageSize[0] - margin.right, y: yPosition },
            thickness: 0.5,
            color: mediumGray,
        });
        yPosition -= 20;

        page.drawText('End of Examination', {
            x: margin.left + (contentWidth / 2) - 50,
            y: yPosition,
            size: 12,
            font: italicFont,
            color: mediumGray,
        });

        return await pdfDoc.save();
    };

    const generateAnswerKeyCsv = (variants: ExamVariantData[]) => {
        if (variants.length === 0) return '';

        // Get the maximum number of questions from all variants
        const maxQuestions = Math.max(...variants.map(v => v.questions.length));

        // Create header row
        const headers = ['Variant', ...Array.from({ length: maxQuestions }, (_, i) => `Q${i + 1}`)];
        let csv = headers.join(',') + '\n';

        // Process each variant
        variants.forEach(variant => {
            const answers = variant.questions.map(question => {
                // Join correct options with commas and wrap in quotes
                return `"${question.correct_options.join(', ')}"`;
            });

            // Pad with empty strings if this variant has fewer questions than others
            while (answers.length < maxQuestions) {
                answers.push('""');
            }

            csv += `${variant.version_number},${answers.join(',')}\n`;
        });

        return csv;
    };

    const handleDownloadPDF = useCallback(async (variant: ExamVariantData) => {
        setIsLoading(true);
        setError(null);

        try {
            const pdfBytes = await generatePdfForVariant(variant);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, `Exam_Variant_${variant.version_number}.pdf`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate PDF');
            console.error('PDF generation error:', err);
        } finally {
            setIsLoading(false);
            setShowModal(false);
        }
    }, [title]);

    const handleDownloadWord = useCallback(async (variant: ExamVariantData) => {
        setIsLoading(true);
        setError(null);

        try {
            const docxBlob = await generateDocxForVariant(variant);
            saveAs(docxBlob, `Exam_Variant_${variant.version_number}.docx`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate Word document');
            console.error('Word generation error:', err);
        } finally {
            setIsLoading(false);
            setShowModal(false);
        }
    }, [title]);

    const handleDownloadAll = useCallback(async (format: 'PDF' | 'Word') => {
        setIsLoading(true);
        setError(null);

        try {
            const zip = new JSZip();
            const variants = getStoredVariants();

            if (variants.length === 0) {
                throw new Error('No exam variants found to download.');
            }

            // Generate files for each variant
            for (const variant of variants) {
                if (format === 'PDF') {
                    const pdfBytes = await generatePdfForVariant(variant);
                    zip.file(`Exam_Variant_${variant.version_number}.pdf`, pdfBytes);
                } else {
                    const docxBlob = await generateDocxForVariant(variant);
                    zip.file(`Exam_Variant_${variant.version_number}.docx`, docxBlob);
                }
            }

            // Add answer key
            const csvContent = generateAnswerKeyCsv(variants);
            zip.file('Answer_Keys.csv', csvContent);

            // Generate and download the zip
            const zipContent = await zip.generateAsync({ type: 'blob' });
            saveAs(zipContent, `Exam_Variants_${format}.zip`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate files');
            console.error('Download error:', err);
        } finally {
            setIsLoading(false);
            setShowModal(false);
        }
    }, [examId, title]);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="relative">
                <button
                    data-onboarding="download-exams"
                    onClick={() => setShowModal(true)}
                    disabled={isLoading || storedVariants.length === 0}
                    className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl
        text-white font-medium shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isLoading || storedVariants.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-500 via-teal-500/90 to-teal-600 hover:from-teal-600 hover:via-teal-600/90 hover:to-teal-700 active:from-teal-700 active:via-teal-700/90 active:to-teal-800'
                        }
        focus:outline-none focus:ring-2 focus:ring-teal-400/80 focus:ring-offset-2
        ${!isLoading && storedVariants.length > 0 &&
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
                            <span className="relative z-10">Preparing Download...</span>
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
                            <span className="relative z-10 drop-shadow-sm">Download Exam</span>
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                        </>
                    )}
                </button>

                <DownloadOptionsModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadWord={handleDownloadWord}
                    onDownloadAll={handleDownloadAll}
                    variants={storedVariants}
                    fileName={`Exam_Variants`}
                />
            </div>
        </div>
    );
};

export default DownloadExamButton;