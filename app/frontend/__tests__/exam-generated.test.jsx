/**
 * __tests__/ExamGeneratedPage.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExamGeneratedPage from '../app/[course_id]/examgenerated/page';
import * as nextNav from 'next/navigation';

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            role: 'Admin',
            username: 'John Doe',
            email: 'john.doe@example.com',
            language: 'en',
            mode: 'light',
            is_active: true,
        },
    }),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
    error: jest.fn(),
}));

describe('ExamGeneratedPage', () => {
    const push = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();

        jest.spyOn(nextNav, 'useRouter').mockReturnValue({ push });

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { pathname: '/123/examgenerated', reload: jest.fn() },
        });

        window.localStorage.setItem(
            'selectedVariant',
            JSON.stringify([
                { id: 1, title: 'T1', courseTitle: 'C1', questions: [] },
                { id: 2, title: 'T2', courseTitle: 'C1', questions: [] },
            ])
        );
        window.localStorage.setItem('examData', JSON.stringify({
            "examTitle": "Exam 2",
            "numQuestions": "10",
            "numVariants": "3",
            "difficultyDistribution": {
                "easy": "20",
                "medium": "20",
                "hard": "60"
            },
            "selectedQuestions": [
                {
                    "id": 238,
                    "text": "Which of the following is the correct way to declare a variable in JavaScript?",
                    "mandatory": true,
                    "options": [
                        {
                            "id": 1,
                            "text": "var a;",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "let a;",
                            "isCorrect": true
                        },
                        {
                            "id": 3,
                            "text": "const a;",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "a = 1;",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 239,
                    "text": "What will typeof null evaluate to?",
                    "mandatory": true,
                    "options": [
                        {
                            "id": 1,
                            "text": "object",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "null",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "undefined",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "number",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 240,
                    "text": "Which method converts a JSON string into a JavaScript object?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "JSON.parse()",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "JSON.stringify()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "eval()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "$.parseJSON()",
                            "isCorrect": false
                        },
                        {
                            "id": 5,
                            "text": "Response.json()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 241,
                    "text": "What is the result of 2 + \"2\" in JavaScript?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "\"22\"",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "4",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "NaN",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "\"4\"",
                            "isCorrect": false
                        },
                        {
                            "id": 5,
                            "text": "undefined",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 242,
                    "text": "Which keyword is used to create a constant in JavaScript?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "var",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "let",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "const",
                            "isCorrect": true
                        },
                        {
                            "id": 4,
                            "text": "static",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 243,
                    "text": "Which of these is NOT a JavaScript data type?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "String",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "Number",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "Undefined",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "Character",
                            "isCorrect": true
                        },
                        {
                            "id": 5,
                            "text": "Boolean",
                            "isCorrect": false
                        },
                        {
                            "id": 6,
                            "text": "Symbol",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 244,
                    "text": "How do you write a single-line comment in JavaScript?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "// comment",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "/* comment */",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "# comment",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "<!-- comment -->",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 245,
                    "text": "What does the === operator do?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "Compares value only",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "Compares value and type",
                            "isCorrect": true
                        },
                        {
                            "id": 3,
                            "text": "Assigns value",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "Converts types and compares",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 246,
                    "text": "Which function is used to schedule a callback after a delay?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "setTimeout()",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "setInterval()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "delay()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "process.nextTick()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 247,
                    "text": "What is the output of Boolean(\"\")?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "true",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "false",
                            "isCorrect": true
                        },
                        {
                            "id": 3,
                            "text": "\"false\"",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "0",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 248,
                    "text": "Which array method returns a new array with each element processed by a function?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "map()",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "forEach()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "filter()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "reduce()",
                            "isCorrect": false
                        },
                        {
                            "id": 5,
                            "text": "slice()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 250,
                    "text": "Which of the following will NOT create a new object?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "{}",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "Object.create(null)",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "new Object()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "Object.prototype",
                            "isCorrect": true
                        }
                    ]
                },
                {
                    "id": 251,
                    "text": "How do you write a function in JavaScript?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "function myFunc() {}",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "var myFunc = function() {}",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "const myFunc = () => {}",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "def myFunc() {}",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 252,
                    "text": "Which keyword makes a variable scoped to the nearest enclosing block?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "var",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "let",
                            "isCorrect": true
                        },
                        {
                            "id": 3,
                            "text": "const",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "static",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 254,
                    "text": "Which event fires when the user clicks on an element?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "click",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "mouseover",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "keypress",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "change",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 255,
                    "text": "What is the default value of an uninitialized variable?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "undefined",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "null",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "0",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 258,
                    "text": "In a regular function, what does `this` refer to?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "calling object",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "global object",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "undefined",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "function itself",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 259,
                    "text": "How do you create a Set from an array `arr`?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "new Set(arr)",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "Set.from(arr)",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "Array.toSet(arr)",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "voidSet(arr)",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 260,
                    "text": "Which syntax merges properties into a new object?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "{...obj}",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "Object.assign()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "merge(obj)",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "$.extend()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 262,
                    "text": "How do you declare an async function named `fetchData`?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "async function fetchData() {}",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "function async fetchData() {}",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "function fetchData() async {}",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "fetchData = async () => {}",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 263,
                    "text": "Which keyword pauses execution until a promise resolves?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "await",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "then",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "catch",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "finally",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 264,
                    "text": "What does the `?.` operator do in JavaScript?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "optional chaining",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "nullish coalescing",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "safe access",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "error handling",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 266,
                    "text": "Which method returns the index of the first matched element?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "findIndex()",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "find()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "indexOf()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "filter()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 267,
                    "text": "How can you deeply clone a simple object `obj`?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "JSON.parse(JSON.stringify(obj))",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "Object.assign({}, obj)",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "Object.create(obj)",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "_.clone(obj)",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 268,
                    "text": "What does the `map()` method return?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "a new array",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "the original array",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "undefined",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "a string",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 269,
                    "text": "Which keyword defines a class in ES6?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "class",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "function",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "struct",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "new",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 271,
                    "text": "What will `0 || 'default'` evaluate to?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "default'",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "0",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "FALSE",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "undefined",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 272,
                    "text": "How do you check if `x` is null or undefined in a single comparison?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "x == null",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "x === null",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "x === undefined",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "x != null",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 273,
                    "text": "Which function schedules code to run after a delay?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "setTimeout()",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "setInterval()",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "requestAnimationFrame()",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "process.nextTick()",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 275,
                    "text": "How do you write a template literal with variable `name`?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "`Hello ${name}`",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "Hello ${name}'",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "\\Hello ${name}\\\"\"",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "Hello ${name}",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 276,
                    "text": "What does `console.log(typeof Symbol())` print?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "\\symbol\\\"\"",
                            "isCorrect": true
                        },
                        {
                            "id": 2,
                            "text": "\\object\\\"\"",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "\\function\\\"\"",
                            "isCorrect": false
                        },
                        {
                            "id": 4,
                            "text": "\\undefined\\\"\"",
                            "isCorrect": false
                        }
                    ]
                },
                {
                    "id": 277,
                    "text": "What is the type of Symbol('id')?",
                    "mandatory": false,
                    "options": [
                        {
                            "id": 1,
                            "text": "string",
                            "isCorrect": false
                        },
                        {
                            "id": 2,
                            "text": "object",
                            "isCorrect": false
                        },
                        {
                            "id": 3,
                            "text": "symbol",
                            "isCorrect": true
                        },
                        {
                            "id": 4,
                            "text": "number",
                            "isCorrect": false
                        }
                    ]
                }
            ]
        }));
    });

    it('renders its layout and children in light mode by default', () => {
        render(<ExamGeneratedPage />);

        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('exam-header')).toBeInTheDocument();
        expect(screen.getByTestId('exam-stats')).toBeInTheDocument();
        expect(screen.getByTestId('download-button')).toBeInTheDocument();
        expect(screen.getByTestId('exam-roulette')).toBeInTheDocument();
    });

    it('navigates via sidebar buttons correctly', () => {
        render(<ExamGeneratedPage />);

        fireEvent.click(screen.getByText('Live Courses'));
        expect(push).toHaveBeenCalledWith('/');

        fireEvent.click(screen.getByText('Dashboard'));
        expect(push).toHaveBeenCalledWith('/123');

        fireEvent.click(screen.getByText('Question Banks'));
        expect(push).toHaveBeenCalledWith('/123/questions');

        fireEvent.click(screen.getByText('Students'));
        expect(push).toHaveBeenCalledWith('/123/students');

        fireEvent.click(screen.getByText('Analytics'));
        expect(push).not.toHaveBeenCalledWith(expect.stringContaining('analytics'));
    });
});
