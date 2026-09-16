'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ExamCard from './ExamCard';
import { usePathname } from 'next/navigation';

interface QuestionOption {
    id: number;
    text: string;
    letter?: string;
    isCorrect: boolean;
}

export interface Question {
    id: number;
    text: string;
    selected: boolean;
    mandatory: boolean;
    options: QuestionOption[];
    tag: string;
}

export interface ExamData {
    examTitle: string;
    numQuestions: string;
    numVariants: string;
    difficultyDistribution: { easy: string; medium: string; hard: string };
    selectedQuestions: Question[];
}

export interface ExamVariantData {
    exam_variant_id: number;
    version_number: number;
    answer_key?: string | null;
    questions: {
        question_text: string;
        question_number: number;
        options: string[];
        correct_options: string[];
        tag: string;
    }[];
}

interface ExamCardRouletteProps {

    coursetitle: string;
    coursecode: string;
    examVariants: ExamVariantData[];
}

const ExamCardRoulette = ({ coursetitle, coursecode, examVariants }: ExamCardRouletteProps) => {
    const pathname = usePathname();
    const isExamGeneratedPage = pathname.includes('examgenerated');
    const isExamVariantPage = pathname.includes('exam-variant');

    // State
    const [loading, setLoading] = useState(false);

    // Carousel state
    const transitionDuration = 400;
    const [displayIndex, setDisplayIndex] = useState(0);
    const [transitionEnabled, setTransitionEnabled] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate card IDs based on exam variants
    const examCards = useMemo(() => {
        return examVariants.map((_, index) => index);
    }, [examVariants]);

    // Calculate current visible card index
    const currentIndex = displayIndex % examCards.length;

    // Create virtual card array for infinite loop effect
    const virtualCards = [...examCards, ...examCards, ...examCards];

    // Animation parameters
    const visibleCardCount = Math.min(5, examCards.length);
    const maxVisibleDistance = Math.floor(visibleCardCount / 2);

    const CARD_WIDTH = '22rem';
    const CARD_HEIGHT = '600';
    const CARD_SPACING = examCards.length <= 3 ? 450 : 400;
    const CARD_SCALE_FACTOR = 0.08;
    const CARD_Z_TRANSLATE = 80;
    const HOVER_ELEVATION = 10;
    const VERTICAL_OFFSET = 10;

    const getCardStyle = (virtualIndex: number): React.CSSProperties => {
        const offset = virtualIndex - displayIndex;
        const absOffset = Math.abs(offset);
        const direction = Math.sign(offset);
        const actualIndex = virtualIndex % examCards.length;

        if (absOffset > maxVisibleDistance + 2) {
            return { display: 'none' };
        }

        const isHovered = hoveredIndex === actualIndex;
        const hoverEffect = isHovered ? `translateY(${-HOVER_ELEVATION}px)` : '';
        const scale = Math.max(0.7, 1 - absOffset * CARD_SCALE_FACTOR);
        const opacity = Math.max(0, 1 - absOffset * 0.3);

        return {
            zIndex: isHovered ? 100 : 50 - absOffset,
            opacity: opacity,
            transform: `
                translateX(calc(-50% + ${offset * CARD_SPACING}px))
                translateY(calc(-50% + ${VERTICAL_OFFSET}px))
                scale(${scale})
                rotateY(${direction * 15}deg)
                translateZ(${-absOffset * CARD_Z_TRANSLATE}px)
                ${hoverEffect}
            `,
            transition: transitionEnabled
                ? `all ${transitionDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`
                : 'none',
            transformOrigin: 'center center',
            willChange: 'transform, opacity, filter',
            filter: isHovered ? 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))' : 'none',
            pointerEvents: absOffset > maxVisibleDistance ? 'none' : 'auto'
        };
    };

    // Navigation controls
    const navigateToCard = (vIndex: number) => {
        if (vIndex === displayIndex) return;
        setTransitionEnabled(true);
        setDisplayIndex(vIndex);
    };

    const nextCard = useCallback(() => {
        setDisplayIndex(prev => prev + 1);
    }, []);

    const prevCard = useCallback(() => {
        setDisplayIndex(prev => prev - 1);
    }, []);

    // Infinite loop handling
    useEffect(() => {
        if (examCards.length === 0) return;

        const inFirstSet = displayIndex < examCards.length;
        const inThirdSet = displayIndex >= examCards.length * 2;

        if (inFirstSet || inThirdSet) {
            const timer = setTimeout(() => {
                setTransitionEnabled(false);
                const newIndex = (displayIndex % examCards.length) + examCards.length;
                setDisplayIndex(newIndex);
                requestAnimationFrame(() => {
                    setTransitionEnabled(true);
                });
            }, transitionDuration);
            return () => clearTimeout(timer);
        }
    }, [displayIndex, examCards.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (examCards.length <= 1) return;
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextCard, prevCard, examCards.length]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-gray-500">
                Loading exam data...
            </div>
        );
    }

    if (examVariants.length === 0) {
        return (
            <div className="flex justify-center items-center h-full text-gray-500">
                No exam variants available.
            </div>
        );
    }

    return (
        <div className="relative w-full flex flex-col items-center px-4 sm:px-6" style={{ minHeight: '80vh' }}>
            {/* Indicator Dots */}
            {examCards.length > 1 && (
                <div className="mb-4 sm:mb-8 flex justify-center gap-2 w-full py-4">
                    {examCards.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentLap = Math.floor(displayIndex / examCards.length);
                                navigateToCard(currentLap * examCards.length + index);
                            }}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all relative overflow-hidden ${index === currentIndex ? 'bg-blue-600 w-4 sm:w-6' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Go to card ${index + 1}`}
                        >
                            <span className="absolute inset-0 bg-white opacity-0 hover:opacity-30 transition-opacity rounded-full"></span>
                        </button>
                    ))}
                </div>
            )}
            <div
                ref={containerRef}
                className="relative w-full mx-auto"
                style={{
                    height: '475px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}
                data-testid="exam-roulette"
            >
                {/* 3D Perspective Container */}
                <div className="absolute inset-0" style={{
                    perspective: '1400px',
                    perspectiveOrigin: 'center center',
                }}>
                    {/* Virtual Card Rendering */}
                    {virtualCards.map((cardId, virtualIndex) => {
                        const style = getCardStyle(virtualIndex);
                        if (style.display === 'none') return null;

                        const actualIndex = virtualIndex % examCards.length;
                        const variant = examVariants[actualIndex];

                        // Transform questions to match ExamCard's expected format
                        const questions: Question[] = variant.questions.map((q, qIndex) => ({
                            id: qIndex + 1,
                            text: q.question_text,
                            selected: false,
                            mandatory: true,
                            options: q.options.map((opt, oIndex) => {
                                const letter = String.fromCharCode(65 + oIndex); // A, B, C...
                                return {
                                    id: oIndex + 1,
                                    text: opt,
                                    letter: letter,
                                    isCorrect: q.correct_options.includes(letter)
                                };
                            }),
                            tag: q.tag
                        }));

                        return (
                            <div
                                key={`${variant.exam_variant_id}-${virtualIndex}`}
                                className="absolute top-1/2 left-1/2 cursor-pointer card"
                                style={{ ...style, width: CARD_WIDTH, height: CARD_HEIGHT }}
                                onClick={() => navigateToCard(virtualIndex)}
                                onMouseEnter={() => setHoveredIndex(actualIndex)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <ExamCard
                                    id={variant.exam_variant_id}
                                    coursetitle={coursetitle}
                                    version={variant.version_number}
                                    questions={questions}
                                    coursecode={coursecode}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Buttons */}
                {examCards.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prevCard(); }}
                            className="fixed left-4 translate-x-60 top-[calc(50%_+_var(--vertical-offset))] -translate-y-1/2  bg-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 group"
                            style={{ '--vertical-offset': `${VERTICAL_OFFSET}px` } as React.CSSProperties}
                            aria-label="Previous card"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 rounded-full transition-opacity"></div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 group-hover:text-blue-600 transition-colors">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </div>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextCard(); }}
                            className="fixed right-4 top-[calc(50%_+_var(--vertical-offset))] -translate-y-1/2 bg-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 group"
                            style={{ '--vertical-offset': `${VERTICAL_OFFSET}px` } as React.CSSProperties}
                            aria-label="Next card"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 rounded-full transition-opacity"></div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 group-hover:text-blue-600 transition-colors">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </div>
                        </button>
                    </>
                )}


            </div>
        </div>
    );
};

export default ExamCardRoulette;