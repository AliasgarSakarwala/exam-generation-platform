"use client"

import React from 'react'
import CourseListSidebar from '@/app/components/CourseListSidebar'
import CourseListHeader from '@/app/components/CourseListHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/app/loading'

export default function ExamInfoPage() {
    const router = useRouter();
    const { user } = useAuth();

    if (!user) {
        return <Loading />
    }

    return (
        <div className="flex bg-[#EDEDED] h-screen">
            <CourseListSidebar
                darkMode={false}
                onToggleDarkMode={() => { }}
                archived={user?.role === 'Admin'}
                middleButtons={[
                    {

                        label: 'Active Courses',
                        alt: 'Active Courses',

                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'View Variants',
                        alt: 'View Variants',
                        iconSrc: '/home.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Exam Analytics',
                        alt: 'Exam Analytics',
                        iconSrc: '/line-chart-line.svg',
                        onClick: () => window.location.reload(),
                    },
                    {
                        label: 'Upload Grades',
                        alt: 'Upload Grades',
                        iconSrc: '/students.svg',
                        onClick: () => router.push(window.location.pathname + "/upload-grades"),
                    },
                ]}
            />
            <div className="flex-1 p-4 overflow-y-auto">
                <CourseListHeader
                    search={() => { }}
                    router={router}
                    showBackArrow={true}
                    searchPlaceholder="Search Information..."
                />
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-[#3774E5]">
                        Exam Information
                    </h1>
                </div>
            </div>
        </div>
    )
}