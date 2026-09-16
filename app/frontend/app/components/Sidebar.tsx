'use client';

import React, { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { House, GraduationCap, UsersRound, CircleArrowRight } from 'lucide-react';

interface SidebarComponents {
    backButton?: ReactNode;
    topRightIcon1?: ReactNode;
    topRightIcon2?: ReactNode;
}

interface SidebarButtonProps {
    label: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
    justifyBetween?: boolean;
    logout?: boolean;
}

function SidebarButton({
    label,
    icon,
    active,
    onClick,
    justifyBetween = false,
    logout = false,
}: SidebarButtonProps) {
    const base = 'lg:w-[200px] w-fit flex items-center gap-2 px-[10px] py-[10px] mb-4 lg:rounded-[8px] rounded-[14px] font-medium text-sm transition-all duration-200 cursor-pointer';
    const activeClasses = 'bg-white text-black';
    const inactiveClasses = 'bg-transparent text-white hover:shadow-lg hover:-translate-y-0.5';

    return (
        <div
            onClick={onClick}
            className={!logout
                ? `${base} ${active ? activeClasses : inactiveClasses} ${justifyBetween ? 'justify-between' : ''}`
                : `${base} ${activeClasses} ${justifyBetween ? 'justify-between' : ''}`}
        >
            {
                logout ? (
                    <>
                        <span className="lg:block hidden">{label}</span>
                        {icon}
                    </>
                ) : (
                    <>
                        {icon}
                        <span className="lg:block hidden">{label}</span>
                    </>
                )
            }
        </div>
    );
}

export default function SidebarFunc({ }: SidebarComponents) {
    const [activeTab, setActiveTab] = useState<'profile' | 'dashboard' | 'courses' | 'logout'>('profile');
    const router = useRouter();

    return (
        <div className="flex min-h-screen">
             <aside className="bg-[#3774E5] flex flex-col items-center justify-center py-6 lg:rounded-[24px] rounded-[14px] m-4 lg:w-[230px] w-[60px] sticky top-0 h-screen overflow-y-auto">
                <div className="w-full flex items-center justify-evenly mb-8 px-[10px]">
                    <img src="/ct3_logo.png" alt="CT3 Logo" width={40} height={40} className="rounded-md" />
                    <span className={`text-white text-2xl font-semibold lg:block hidden`}>CT3 - EGAS</span>
                </div>

                <SidebarButton
                    label="Profile"
                    icon={<UsersRound size={20} />}
                    active={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                />

                <SidebarButton
                    label="Dashboard"
                    icon={<House size={20} />}
                    active={activeTab === 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}
                />

                <SidebarButton
                    label="Question Bank"
                    icon={<GraduationCap size={20} />}
                    active={activeTab === 'courses'}
                    onClick={() => {
                        setActiveTab('courses');
                        router.push('/courses');
                    }}
                />

                <SidebarButton
                    label="Courses"
                    icon={<GraduationCap size={20} />}
                    active={activeTab === 'courses'}
                    onClick={() => {
                        setActiveTab('courses');
                        router.push('/courses');
                    }}
                />

                <div className="flex-grow" />

                <SidebarButton
                    label="Log Out"
                    icon={<CircleArrowRight size={20} />}
                    active={activeTab === 'logout'}
                    justifyBetween={true}
                    logout={true}
                    onClick={() => setActiveTab('logout')}
                />
            </aside>
        </div>
    );
}
