'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface SidebarButtonProps {
    /** Icon image source path */
    iconSrc: string;
    /** Alt text for the icon */
    alt: string;
    /** Label text to display */
    label: string;
    /** Tailwind classes for icon size, e.g. 'w-5 h-5' */
    iconSizeClass?: string;
    /** Click handler */
    onClick: () => void;
    darkMode: boolean;
    /** Data attribute for onboarding */
    dataOnboarding?: string;
}



export default function SidebarButton({
    iconSrc,
    alt,
    label,
    iconSizeClass = 'w-5 h-5',
    onClick,
    darkMode,
    dataOnboarding,
}: SidebarButtonProps) {
    const [hoverStates, setHoverStates] = useState({
        live: false,
        archived: false,
        theme: false,
        logout: false,
    });

    const handleHover = (key: keyof typeof hoverStates, value: boolean) => {
        setHoverStates(prev => ({ ...prev, [key]: value }));
    };

    const handleFeatureNotAvailable = () => {
        toast.error('This feature is not yet available ❌', {
            position: 'bottom-center',
            style: {
                background: darkMode ? '#1e293b' : '#3774E5',
                color: 'white',
            },
        });
    };

    return (
        <div
            onClick={onClick}
            data-testid={label}
            className="flex items-center cursor-pointer w-full max-w-[180px] group"
            {...(dataOnboarding && { 'data-onboarding': dataOnboarding })}
        >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-transparent transition-all duration-200 group-hover:bg-[#7093f0] group-hover:shadow-sm">
                <img
                    src={iconSrc}
                    alt={alt}
                    className={`transition-transform duration-200 group-hover:scale-110 ${iconSizeClass}`}
                />
            </div>
            <span className="ml-3 text-white font-medium text-base opacity-80 transition-opacity duration-200 group-hover:opacity-100 lg:block hidden">
                {label}
            </span>
        </div>
    );
}