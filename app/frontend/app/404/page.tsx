'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PageNotFound() {
    const router = useRouter();

    return (
        <div className="relative w-full h-screen bg-gray-100 flex flex-col justify-center items-center overflow-hidden px-6">
            {/* left dot grid */}
            <div className="absolute top-1/4 left-8 grid grid-cols-5 gap-2">
                {[...Array(25)].map((_, i) => (
                    <span key={`l${i}`} className="block w-2 h-2 bg-[#3774E54D] rounded-full" />
                ))}
            </div>

            {/* right dot grid */}
            <div className="absolute bottom-1/4 right-8 grid grid-cols-5 gap-2">
                {[...Array(25)].map((_, i) => (
                    <span key={`r${i}`} className="block w-2 h-2 bg-[#3774E54D] rounded-full" />
                ))}
            </div>

            {/* main content */}
            <h1 className="text-[8rem] font-bold text-[#3774E5] leading-none">404</h1>
            <p className="text-3xl font-semibold text-[#3774E5] mb-4">Page Not Found</p>
            <p className="max-w-md text-center text-gray-500 mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            {/* CTA */}
            <button
                onClick={() => router.replace('/')}
                className="bg-[#3774E5] text-white font-medium py-3 px-6 rounded hover:translate-y-[-5px] transition-all duration-200 ease-in-out cursor-pointer"
            >
                Return to Courses
            </button>
        </div>
    );
}
