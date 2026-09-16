"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import CourseListSidebar from "@/app/components/CourseListSidebar";
import Loading from "@/app/loading";
import LoginStats from "@/components/Admin/login-stats";
import { FaAngleDown } from "react-icons/fa6";
import CustomTable from "../components/Table";
import { getActivityStats, getKPIStats, getClassroomActivities, getUserActivities, getAllSystemActivities } from "@/services/activity";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface KPICard {
    title: string;
    value: number;
    icon: string;
    accentColor: string;
    textColor: string;
    subtitle: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [KPICards, setKPICards] = useState<KPICard[] | null>(null);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showReportFilters, setShowReportFilters] = useState(false);
    const [reportFilters, setReportFilters] = useState({
        includeKPIs: true,
        includeWeeklyUsers: true,
        includeTopUsers: true,
        includeTopCourses: true,
        includeAllActivities: false,
        dateRange: 'all', // 'all', 'week', 'month', 'custom'
        activityType: 'all', // 'all', 'create', 'update', 'delete', 'view'
        userType: 'all', // 'all', 'professor', 'student', 'admin', 'ta'
        anonymizeUsers: false // anonymize usernames for privacy
    });
    const [activityData, setActivityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [classroomActivities, setClassroomActivities] = useState<any[]>([]);
    const [userActivities, setUserActivities] = useState<any[]>([]);
    const [modalType, setModalType] = useState<'classroom' | 'user'>('classroom');

    const handleSearch = (searchTerm: string) => {
        console.log('Search term:', searchTerm);
    };

    const handleFilter = (filter: string) => {
        console.log('Filter:', filter);
    };

    // Function to anonymize usernames while maintaining consistency
    const anonymizeUsername = (username: string, userMap: Map<string, string>) => {
        if (!reportFilters.anonymizeUsers) return username;
        
        if (!userMap.has(username)) {
            const anonymousId = `User ${userMap.size + 1}`;
            userMap.set(username, anonymousId);
        }
        
        return userMap.get(username) || username;
    };

    const fetchKPICards = async () => {
        try {
            const response = await getKPIStats();
            if (response.status === 200) {
                setKPICards(response.data);
            }
        } catch (error) {
            console.error('Error fetching KPI cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityData = async () => {
        try {
            const response = await getActivityStats();
            if (response.status === 200) {
                setActivityData(response.data);
            }
        } catch (error) {
            console.error('Error fetching activity data:', error);
        }
    };

    const handleViewClassroomActivities = async (classroomId: number) => {
        try {
            setSelectedClassroomId(classroomId);
            setModalType('classroom');
            const response = await getClassroomActivities(classroomId);
            if (response.status === 200) {
                setClassroomActivities(response.data);
                setShowActivityModal(true);
            }
        } catch (error) {
            console.error('Error fetching classroom activities:', error);
        }
    };

    const handleViewUserActivities = async (userId: number) => {
        try {
            setSelectedUserId(userId);
            setModalType('user');
            const response = await getUserActivities(userId);
            if (response.status === 200) {
                setUserActivities(response.data);
                setShowActivityModal(true);
            }
        } catch (error) {
            console.error('Error fetching user activities:', error);
        }
    };

    const fetchAllActivities = async () => {
        try {
            const filters = {
                dateRange: reportFilters.dateRange,
                activityType: reportFilters.activityType,
                userType: reportFilters.userType,
                per_page: 1000 // Get more activities for reports
            };
            
            const response = await getAllSystemActivities(filters);
            
            if (response.status === 200 && response.data?.data) {
                // Create a user mapping for consistent anonymization
                const userMap = new Map<string, string>();
                
                // The Laravel paginated response has data in response.data.data
                return response.data.data.map((activity: any) => {
                    const originalUsername = activity.user?.username || 'Unknown User';
                    const anonymizedUsername = anonymizeUsername(originalUsername, userMap);
                    
                    return {
                        user: anonymizedUsername,
                        action: activity.action,
                        entity: activity.entity,
                        description: activity.description,
                        created_at: activity.created_at,
                        route: activity.route,
                        method: activity.method,
                        status_code: activity.status_code,
                        classroom: activity.classroom?.name || 'N/A'
                    };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching all activities:', error);
            return [];
        }
    };

    const handleDownloadExcel = async () => {
        if (!activityData || !KPICards) {
            alert('No data available for report.');
            return;
        }

        const today = new Date().toLocaleDateString();
        const workbook = XLSX.utils.book_new();

        // Prepare filtered report data
        const allData = [
            [`Activity Monitor Report - ${reportFilters.dateRange === 'all' ? 'All Time' : reportFilters.dateRange.charAt(0).toUpperCase() + reportFilters.dateRange.slice(1)}`],
            ["Generated on", today],
            ["Filters Applied", `Activity Type: ${reportFilters.activityType}, User Type: ${reportFilters.userType}`],
            []
        ];

        // Add KPI Summary if selected
        if (reportFilters.includeKPIs) {
            allData.push(
                ["KPI Summary"],
                ...KPICards.map(card => [card.title, card.value]),
                []
            );
        }

        // Add Weekly Active Users if selected
        if (reportFilters.includeWeeklyUsers) {
            const userMap = new Map<string, string>();
            allData.push(
                ["Weekly Active Users"],
                ["User Name"],
                ...activityData.weekly_active_users?.map((user: any) => [
                    anonymizeUsername(user.name, userMap)
                ]) || [["No data"]],
                []
            );
        }

        // Add Top Users if selected
        if (reportFilters.includeTopUsers) {
            const userMap = new Map<string, string>();
            allData.push(
                ["Top Users"],
                ["User Name", "Activity Count"],
                ...activityData.top_users?.map((user: any) => [
                    anonymizeUsername(user.name, userMap), 
                    user.activity_count
                ]) || [["No data", "0"]],
                []
            );
        }

        // Add Top Courses if selected
        if (reportFilters.includeTopCourses) {
            allData.push(
                ["Top Courses"],
                ["Course Name", "Activity Count"],
                ...activityData.top_courses?.map((course: any) => [course.name, course.activity_count]) || [["No data", "0"]],
                []
            );
        }

        // Add All Activities if selected
        if (reportFilters.includeAllActivities) {
            const allActivities = await fetchAllActivities();
            allData.push(
                ["All System Activities"],
                ["User", "Action", "Entity", "Description", "Date", "Route", "Status"],
                ...(allActivities.length > 0 ? 
                    allActivities.map((activity: any) => [
                        activity.user || '-',
                        activity.action || '-',
                        activity.entity || '-',
                        activity.description || '-',
                        activity.created_at ? new Date(activity.created_at).toLocaleString() : '-',
                        activity.route || '-',
                        (activity.status_code || '-').toString()
                    ]) : 
                    [["No activities found"]]
                )
            );
        }

        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 10 }];

        // Apply styles
        const styleCell = (cellAddress: string, style: any) => {
            if (!worksheet[cellAddress]) {
                worksheet[cellAddress] = { t: 's', v: '' };
            }
            worksheet[cellAddress].s = style;
        };

        styleCell("A1", { font: { bold: true, sz: 16 } });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Report");
        const anonymizedSuffix = reportFilters.anonymizeUsers ? '_Anonymized' : '';
        const fileName = `Activity_Monitor_Report_${reportFilters.dateRange}${anonymizedSuffix}_${today.replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const handleDownloadPDF = async () => {
        if (!activityData || !KPICards) {
            alert('No data available for report.');
            return;
        }

        const doc = new jsPDF();
        const today = new Date().toLocaleDateString();

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Activity Monitor Report - ${reportFilters.dateRange === 'all' ? 'All Time' : reportFilters.dateRange.charAt(0).toUpperCase() + reportFilters.dateRange.slice(1)}`, 105, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${today}`, 105, 22, { align: 'center' });
        doc.text(`Filters: Activity Type: ${reportFilters.activityType}, User Type: ${reportFilters.userType}`, 105, 28, { align: 'center' });

        let y = 40;

        // KPI Summary (if selected)
        if (reportFilters.includeKPIs) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("KPI Summary", 14, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            KPICards.forEach((card, index) => {
                doc.text(`${card.title}: ${card.value}`, 14, y + (index * 7));
            });
            y += (KPICards.length * 7) + 10;
        }

        // Weekly Active Users (if selected)
        if (reportFilters.includeWeeklyUsers) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Weekly Active Users", 14, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (activityData.weekly_active_users && activityData.weekly_active_users.length > 0) {
                const userMap = new Map<string, string>();
                activityData.weekly_active_users.forEach((user: any, index: number) => {
                    const displayName = anonymizeUsername(user.name, userMap);
                    doc.text(`• ${displayName}`, 14, y + (index * 6));
                    if (y + (index * 6) > 270) {
                        doc.addPage();
                        y = 20;
                    }
                });
                y += (activityData.weekly_active_users.length * 6) + 10;
            } else {
                doc.text("No active users found", 14, y);
                y += 16;
            }
        }

        // Top Users (if selected)
        if (reportFilters.includeTopUsers) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Top Users", 14, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (activityData.top_users && activityData.top_users.length > 0) {
                const userMap = new Map<string, string>();
                activityData.top_users.forEach((user: any, index: number) => {
                    const displayName = anonymizeUsername(user.name, userMap);
                    doc.text(`• ${displayName}: ${user.activity_count} activities`, 14, y + (index * 6));
                    if (y + (index * 6) > 270) {
                        doc.addPage();
                        y = 20;
                    }
                });
                y += (activityData.top_users.length * 6) + 10;
            } else {
                doc.text("No users found", 14, y);
                y += 16;
            }
        }

        // Top Courses (if selected)
        if (reportFilters.includeTopCourses) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Top Courses", 14, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (activityData.top_courses && activityData.top_courses.length > 0) {
                activityData.top_courses.forEach((course: any, index: number) => {
                    doc.text(`• ${course.name}: ${course.activity_count} activities`, 14, y + (index * 6));
                    if (y + (index * 6) > 270) {
                        doc.addPage();
                        y = 20;
                    }
                });
                y += (activityData.top_courses.length * 6) + 10;
            } else {
                doc.text("No courses found", 14, y);
                y += 16;
            }
        }

        // All Activities (if selected)
        if (reportFilters.includeAllActivities) {
            const allActivities = await fetchAllActivities();
            
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("All System Activities", 14, y);
            y += 8;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            if (allActivities.length > 0) {
                // Table headers
                doc.setFont('helvetica', 'bold');
                doc.text("User", 14, y);
                doc.text("Action", 50, y);
                doc.text("Entity", 80, y);
                doc.text("Date", 120, y);
                doc.text("Status", 160, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                allActivities.forEach((activity: any, index: number) => {
                    const userText = doc.splitTextToSize(activity.user || '-', 30);
                    const actionText = doc.splitTextToSize(activity.action || '-', 25);
                    const entityText = doc.splitTextToSize(activity.entity || '-', 35);
                    const dateText = activity.created_at ? new Date(activity.created_at).toLocaleDateString() : '-';
                    const statusText = (activity.status_code || '-').toString();

                    doc.text(userText[0] || '', 14, y);
                    doc.text(actionText[0] || '', 50, y);
                    doc.text(entityText[0] || '', 80, y);
                    doc.text(dateText, 120, y);
                    doc.text(statusText, 160, y);
                    
                    y += 5;
                    if (y > 280) {
                        doc.addPage();
                        y = 20;
                        // Re-add headers on new page
                        doc.setFont('helvetica', 'bold');
                        doc.text("User", 14, y);
                        doc.text("Action", 50, y);
                        doc.text("Entity", 80, y);
                        doc.text("Date", 120, y);
                        doc.text("Status", 160, y);
                        y += 6;
                        doc.setFont('helvetica', 'normal');
                    }
                });
            } else {
                doc.text("No activities found", 14, y);
            }
        }

        const anonymizedSuffix = reportFilters.anonymizeUsers ? '_Anonymized' : '';
        const fileName = `Activity_Monitor_Report_${reportFilters.dateRange}${anonymizedSuffix}_${today.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    };

    useEffect(() => {
        if (!user) return;
        fetchKPICards();
        fetchActivityData();
    }, [user]);

    if (!user || loading) {
        return <Loading />
    }

    return (
        <div
            className={`flex min-h-[450px] min-w-[500px] overflow-hidden transition-colors duration-300 bg-[#EDEDED]`}
            style={{ height: '100vh', maxHeight: '100vh' }}
            onClick={(e) => { 
                // Only close if clicking outside the report modal area
                if (showReportOptions && !e.target.closest('.report-modal')) {
                    setShowReportOptions(false);
                    setShowReportFilters(false);
                }
            }}
        >
            {/* SIDEBAR COMPONENT */}
            <CourseListSidebar
                darkMode={darkMode}
                archived={true}
                onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                middleButtons={[
                    {
                        label: 'Live Courses',
                        alt: 'Live Courses',
                        iconSrc: '/cap.svg',
                        onClick: () => router.push('/'),
                    },
                    {
                        label: 'Archived',
                        alt: 'Archived',
                        iconSrc: '/Archived.svg',
                        onClick: () => router.push('/archived'),
                    },
                    {
                        label: 'Database',
                        alt: 'Database',
                        iconSrc: '/database.svg',
                        onClick: () => router.push('/visualizer')
                    },
                    {
                        label: 'Manage Users',
                        alt: 'Manage Users',
                        iconSrc: '/um.svg',
                        onClick: () => router.push('/user-management')
                    },
                    {
                        label: 'Activity Monitor',
                        alt: 'Activity Monitor',
                        iconSrc: '/performance.svg',
                        onClick: () => router.push('/monitor')
                    }
                ]}
            />
            {/* MAIN CONTENT */}
            <div className="flex flex-col flex-1 gap-4 lg:py-8 px-6 py-6 overflow-y-auto">
                {/* COURSE LIST HEADER */}
                <div className="flex items-center gap-4 w-full">
                    <div className="grid grid-cols-6 items-center justify-evenly gap-5 w-full">
                        {/* Tables Loaded */}
                        {KPICards?.map((card: KPICard, index: number) => (
                            <div
                                key={index}
                                className="p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 bg-white overflow-hidden relative"
                            >
                                <div className={`absolute top-0 right-0 w-10 h-10 rounded-bl-full ${card.accentColor} opacity-50`} />
                                <h3 className="font-medium text-gray-500 mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold" data-testid="viz-tables-loaded">{card.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-3 items-center justify-evenly w-full gap-4">
                    <div className="flex flex-col gap-4 bg-blue-50 rounded-xl h-[25em] p-3 shadow-lg">
                        <div>
                            <h2
                                className={`relative inline-block text-2xl font-medium group ${darkMode ? "text-white" : ""
                                    }`}
                            >
                                {/* Gradient text (light blue) - only visible in light mode */}
                                <span
                                    className={`
    ${darkMode
                                            ? "text-white"
                                            : "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
                                        }
    group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700
    transition-all duration-500`}
                                >Weekly Active Users</span></h2>
                            <p className="text-gray-500 text-sm">Users who have used the system in the past week</p>
                        </div>
                        <div className="overflow-y-auto h-full">
                            <CustomTable
                                columns={["User"]}
                                rows={activityData?.weekly_active_users?.map((user: any) => ({
                                    User: user.name,
                                    user_id: user.user_id
                                })) || [
                                        { User: "No active users found" }
                                    ]}
                                onView={(row) => handleViewUserActivities(row.user_id)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-green-50 rounded-xl h-[25em] p-3 shadow-lg">
                        <div>
                            <h2
                                className={`relative inline-block text-2xl font-medium group ${darkMode ? "text-white" : ""
                                    }`}
                            >
                                {/* Gradient text (light blue) - only visible in light mode */}
                                <span
                                    className={`
    ${darkMode
                                            ? "text-white"
                                            : "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
                                        }
    group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700
    transition-all duration-500`}
                                >Top Users</span></h2>
                            <p className="text-gray-500 text-sm">Users with the most system activity</p>
                        </div>
                        <div className="overflow-y-auto h-full">
                            <CustomTable
                                columns={["User", "Activity Count"]}
                                rows={activityData?.top_users?.map((user: any) => ({
                                    User: user.name,
                                    "Activity Count": user.activity_count,
                                    user_id: user.user_id
                                })) || [
                                        { User: "No users found", "Activity Count": "0" }
                                    ]}
                                onView={(row) => handleViewUserActivities(row.user_id)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-yellow-50 rounded-xl h-[25em] p-3 shadow-lg">
                        <div>
                            <h2
                                className={`relative inline-block text-2xl font-medium group ${darkMode ? "text-white" : ""
                                    }`}
                            >
                                {/* Gradient text (light blue) - only visible in light mode */}
                                <span
                                    className={`
    ${darkMode
                                            ? "text-white"
                                            : "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
                                        }
    group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700
    transition-all duration-500`}
                                >Top Courses</span></h2>
                            <p className="text-gray-500 text-sm">Courses with the most system activity</p>
                        </div>
                        <div className="overflow-y-auto h-full">
                            <CustomTable
                                columns={["Course", "Activity Count"]}
                                rows={activityData?.top_courses?.map((course: any) => ({
                                    Course: course.name,
                                    "Activity Count": course.activity_count,
                                    classroom_id: course.classroom_id
                                })) || [
                                        { Course: "No courses found", "Activity Count": "0" }
                                    ]}
                                onView={(row) => handleViewClassroomActivities(row.classroom_id)}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <LoginStats />
                </div>
            </div>
            {/* Generate Report Button */}
            <button
                onClick={() => setShowReportOptions(prev => !prev)}
                className="fixed bottom-6 right-6 bg-[#3774E5] text-white rounded-lg p-3 flex items-center hover:translate-y-[-5px] transition-all duration-200 cursor-pointer"
                aria-label="Generate Report"
            >
                {showReportOptions ? (
                    <FaAngleDown />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                )}

                {!showReportOptions &&
                    <span className="ml-2 whitespace-nowrap text-sm">
                        Generate Report
                    </span>
                }
            </button>

            {/* Report Options Modal */}
            {showReportOptions && (
                <div 
                    className="fixed bottom-20 right-6 bg-white shadow-2xl border border-gray-400 rounded-xl z-[9999] max-w-sm report-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4">
                        {!showReportFilters ? (
                            // Main Options
                            <div className="space-y-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowReportFilters(true);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 rounded-md transition-colors duration-200 flex items-center text-blue-600"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                        />
                                    </svg>
                                    Configure Filters
                                </button>
                                <hr className="my-2" />
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadExcel();
                                        setShowReportOptions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-md transition-colors duration-200 flex items-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 mr-2 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Download as Excel
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadPDF();
                                        setShowReportOptions(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-md transition-colors duration-200 flex items-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 mr-2 text-red-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Download as PDF
                                </button>
                            </div>
                        ) : (
                            // Filter Configuration
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700">Report Filters</h3>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowReportFilters(false);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Content Filters */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Include in Report:</label>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'includeKPIs', label: 'KPI Summary' },
                                            { key: 'includeWeeklyUsers', label: 'Weekly Active Users' },
                                            { key: 'includeTopUsers', label: 'Top Users' },
                                            { key: 'includeTopCourses', label: 'Top Courses' },
                                            { key: 'includeAllActivities', label: 'All System Activities' }
                                        ].map((filter) => (
                                            <label key={filter.key} className="flex items-center text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={reportFilters[filter.key as keyof typeof reportFilters] as boolean}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        setReportFilters(prev => ({
                                                            ...prev,
                                                            [filter.key]: e.target.checked
                                                        }));
                                                    }}
                                                    className="mr-2 h-3 w-3"
                                                />
                                                {filter.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date Range:</label>
                                    <select
                                        value={reportFilters.dateRange}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setReportFilters(prev => ({ ...prev, dateRange: e.target.value }));
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="week">Past Week</option>
                                        <option value="month">Past Month</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>

                                {/* Activity Type Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Activity Type:</label>
                                    <select
                                        value={reportFilters.activityType}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setReportFilters(prev => ({ ...prev, activityType: e.target.value }));
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">All Activities</option>
                                        <option value="create">Create Actions</option>
                                        <option value="update">Update Actions</option>
                                        <option value="delete">Delete Actions</option>
                                        <option value="view">View Actions</option>
                                    </select>
                                </div>

                                {/* User Type Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">User Type:</label>
                                    <select
                                        value={reportFilters.userType}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setReportFilters(prev => ({ ...prev, userType: e.target.value }));
                                        }}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="professor">Professors</option>
                                        <option value="student">Students</option>
                                        <option value="admin">Admins</option>
                                        <option value="ta">Teaching Assistants</option>
                                    </select>
                                </div>

                                {/* Privacy Options */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Privacy Options:</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center text-xs">
                                            <input
                                                type="checkbox"
                                                checked={reportFilters.anonymizeUsers}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    setReportFilters(prev => ({
                                                        ...prev,
                                                        anonymizeUsers: e.target.checked
                                                    }));
                                                }}
                                                className="mr-2 h-3 w-3"
                                            />
                                            Anonymize User Names (User 1, User 2, etc.)
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2 pt-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadExcel();
                                            setShowReportOptions(false);
                                            setShowReportFilters(false);
                                        }}
                                        className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors duration-200"
                                    >
                                        Excel
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadPDF();
                                            setShowReportOptions(false);
                                            setShowReportFilters(false);
                                        }}
                                        className="flex-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors duration-200"
                                    >
                                        PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 rounded-t-xl bg-gray-100">
                            <h2 className="text-lg font-semibold">
                                <span style={{ color: '#3774E5' }}>
                                    {modalType === 'classroom'
                                        ? `Classroom Activities ${selectedClassroomId ? `(ID: ${selectedClassroomId})` : ''}`
                                        : `User Activities ${selectedUserId ? `(ID: ${selectedUserId})` : ''}`
                                    }
                                </span>
                            </h2>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setShowActivityModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 text-gray-500"
                            aria-label="Close modal"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Table content */}
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            {modalType === 'classroom' ? (
                                                <>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Entity</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Classroom</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Entity</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
                                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(modalType === 'classroom' ? classroomActivities : userActivities).length > 0 ? (
                                            (modalType === 'classroom' ? classroomActivities : userActivities).map((activity, index) => (
                                                <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">
                                                        {modalType === 'classroom' ? activity.user : activity.classroom}
                                                    </td>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">{activity.action || '-'}</td>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">{activity.entity || '-'}</td>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">{activity.description || '-'}</td>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800">
                                                        {activity.created_at ? new Date(activity.created_at).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-800 font-mono">{activity.route}</td>
                                                    <td className="border-b border-gray-100 px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${activity.status_code >= 200 && activity.status_code < 300
                                                                ? 'bg-green-100 text-green-800'
                                                                : activity.status_code >= 400
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {activity.status_code}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-4xl mb-2">📭</div>
                                                        <div className="text-lg font-medium">No activities found</div>
                                                        <div className="text-sm">
                                                            {modalType === 'classroom' ? 'for this classroom' : 'for this user'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div >
    )
}