"use client";

import React, { useEffect, useState } from "react";
import CourseListSidebar from "@/app/components/CourseListSidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import OnboardingStep from "@/components/OnboardingStep";
import { getOnboardingSteps, OnboardingPages } from "@/config/onboardingSteps";
import Loading from "@/app/loading";
import { TrashIcon, EyeIcon } from "lucide-react";
import { getTables } from "@/services/visualizer";
import { generateRandomPassword } from "@/services/auth";
import { register, sendInvite } from "@/services/auth";
import toast, { Toaster } from "react-hot-toast";
import { deleteAccount } from "@/services/profile";
import { updateUser } from "@/services/profile";
import { FaPlus } from "react-icons/fa";
import { getUserActivities } from "@/services/activity";

// Onboarding wrapper component
const UserManagementPageWithOnboarding: React.FC = () => {
    const { state, completeStep, skipTour } = useOnboarding();
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const steps = getOnboardingSteps(OnboardingPages.userManagement);
    const currentStep = steps[state.currentStep];

    // Unified finder for the current onboarding step's target
    useEffect(() => {
        if (!state.isActive || currentStep == null) {
            setTargetElement(null);
            return;
        }

        const selector = currentStep.targetSelector;

        let interval: number;

        const findAndScroll = () => {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (el) {
                setTargetElement(el);
                // scroll it into view (you can adjust block/inline as you like)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                return true;
            }
            return false;
        };

        // try immediately, then poll
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
    }, [state.isActive, state.currentStep]);

    const handleNext = () => {
        if (currentStep) {
            completeStep(currentStep.id);
        }
        if (currentStep && currentStep.id === steps[steps.length - 1].id) {
            updateDBwithCompletedOnboarding();
        }
    };

    const updateDBwithCompletedOnboarding = () => {
        const payload = {
            comp_tutorial_page: "userManagement",
        };
        updateUser({ payload });
    };

    const handleSkip = () => {
        skipTour();
        updateDBwithCompletedOnboarding();
    };

    return (
        <>
            <UserManagementPage />
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
};

// Export the wrapped component
export default function UserManagementPageWrapper() {
    return <UserManagementPageWithOnboarding />;
}

function UserManagementPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [apiUsers, setApiUsers] = useState<Record<string, any>[] | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [addUserModal, setAddUserModal] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"Admin" | "Professor" | "TA">("Admin");
    const { user } = useAuth();
    const { startOnboarding } = useOnboarding();
    const [loading, setLoading] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [userActivities, setUserActivities] = useState<any[]>([]);

    useEffect(() => {
        getTables()
            .then((res) => {
                const tempColumns = Object.keys(res.data.data.user.rows[0]);
                const c = tempColumns
                    .filter((column) => column !== "id")
                    .filter((column) => column !== "created_at")
                    .filter((column) => column !== "last_updated_at")
                    .filter((column) => column !== "password_hash")
                    .filter((column) => column !== "is_active")
                    .filter((column) => column !== "comp_tutorial_pages")
                    .filter((column) => column !== "remember_token")
                    .filter((column) => column !== "language")
                    .filter((column) => column !== "mode");

                setColumns(c);

                setApiUsers(res.data.data.user.rows);
            })
            .catch((err) => {
                setApiUsers([]);
                toast.error("Failed to fetch users");
            });
    }, [user]);

    // Start onboarding if not completed
    useEffect(() => {
        if (!user) return;

        // Check if user management tutorial is completed
        if (user) {
            // Helper function to safely check if tutorial page is completed
            const isTutorialCompleted = (pageName: string) => {
                return (
                    Array.isArray(user?.comp_tutorial_pages) &&
                    user.comp_tutorial_pages.includes(pageName)
                );
            };

            if (!isTutorialCompleted("userManagement")) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key?.startsWith("onboarding_userManagement_")) {
                        localStorage.removeItem(key);
                    }
                }
                // now kick off the onboarding tour
                startOnboarding("userManagement");
            }
        }
    }, [user]); // Removed startOnboarding from dependencies

    const handleViewUserActivities = async (userId: number) => {
        try {
            setSelectedUserId(userId);
            const response = await getUserActivities(userId);
            if (response.status === 200) {
                setUserActivities(response.data);
                setShowActivityModal(true);
            }
        } catch (error) {
            console.error('Error fetching user activities:', error);
        }
    };

    if (!user || !apiUsers || loading) {
        return <Loading />;
    }

    const handleSaveUser = async () => {
        setLoading(true);
        const password = generateRandomPassword(10);
        const registerResponse = await register({
            name: fullName,
            email,
            password,
            password_confirmation: password,
            role,
            status: "Invited",
        });
        if (registerResponse && registerResponse.status === 201) {
            const inviteResponse = await sendInvite({
                email,
                name: fullName,
                temp_password: password,
            });
            if (inviteResponse && inviteResponse.status === 201) {
                setLoading(false);
                setAddUserModal(false);
                // Reset form
                setFullName("");
                setEmail("");
                setRole("Admin");
                toast.success("User Invited Successfully");
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            } else {
                setLoading(false);
                toast.error("Failed to send invite");
            }
        } else {
            setLoading(false);
            toast.error("Failed to add user");
        }
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        console.log(id);
        const deleteAccountResponse = await deleteAccount(id);
        if (deleteAccountResponse && deleteAccountResponse.status === 200) {
            toast.success("User deleted successfully");
            setLoading(false);
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } else {
            toast.error("Failed to delete user");
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toaster goes here so it isn’t hidden */}
            <Toaster position="top-right" />

            <div
                className={`flex min-h-[450px] min-w-[500px] overflow-hidden transition-colors duration-300 bg-[#EDEDED]`}
                style={{ height: "100vh", maxHeight: "100vh" }}
            >
                {/* SIDEBAR COMPONENT */}
                <CourseListSidebar
                    darkMode={darkMode}
                    archived={true}
                    onToggleDarkMode={() => setDarkMode((prev) => !prev)}
                    tutorialPage="userManagement"
                    middleButtons={[
                        {
                            label: "Live Courses",
                            alt: "Live Courses",
                            iconSrc: "/cap.svg",
                            onClick: () => router.push("/"),
                        },
                        {
                            label: "Archived",
                            alt: "Archived",
                            iconSrc: "/Archived.svg",
                            onClick: () => router.push("/archived"),
                        },
                        {
                            label: "Database",
                            alt: "Database",
                            iconSrc: "/database.svg",
                            onClick: () => router.push("/visualizer"),
                        },
                        {
                            label: "Manage Users",
                            alt: "Manage Users",
                            iconSrc: "/um.svg",
                            onClick: () => router.push("/user-management"),
                        },
                        {
                            label: "Activity Monitor",
                            alt: "Activity Monitor",
                            iconSrc: "/performance.svg",
                            onClick: () => router.push("/monitor"),
                            dataOnboarding: "activity-monitor",
                        },
                    ]}
                />
                {/* MAIN CONTENT */}
                <div className="flex flex-col flex-1 gap-4 lg:py-8 px-6 py-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h1
                            className={`relative inline-block text-3xl font-medium group ${darkMode ? "text-white" : ""
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
                            >
                                User Management
                            </span>
                        </h1>
                        <button
                            className={`
    relative overflow-hidden
    text-white font-medium text-sm border-none rounded-full
    cursor-pointer shadow-lg hover:shadow-xl
    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    flex items-center justify-center
    bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700
    hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
    active:from-blue-700 active:via-blue-800 active:to-blue-900
    focus:outline-none focus:ring-2 focus:ring-blue-400/80 focus:ring-offset-2
    group
    px-6 py-3  // Increased padding 
    min-w-[140px] // Ensures consistent width`}
                            onClick={() => {
                                setAddUserModal(true);
                            }}
                            data-onboarding="add-user"
                        >
                            {/* Plus icon with rotation animation */}
                            <FaPlus className="relative z-10 w-5 h-5 transition-transform duration-600 ease-in-out group-hover:rotate-[720deg]" />

                            {/* Text */}
                            <span className="relative z-10 ml-3 text-lg">Add User</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto shadow-md sm:rounded-lg">
                        <CT3Table
                            columns={columns}
                            rows={apiUsers}
                            handleDelete={handleDelete}
                            handleViewUserActivities={handleViewUserActivities}
                        />
                    </div>
                </div>
                {addUserModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-lg font-semibold mb-4">Add User</h2>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-700">
                                        Role
                                    </span>
                                    <div className="mt-1 flex items-center space-x-6">
                                        {["Admin", "Professor", "TA"].map((r) => (
                                            <label key={r} className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={r}
                                                    checked={role === r}
                                                    onChange={() => setRole(r as any)}
                                                    className="form-radio h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-gray-700">{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setAddUserModal(false)}
                                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveUser}
                                        className="px-4 py-2 rounded bg-[#3774E5] text-white hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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
                                        {`User Activities ${selectedUserId ? `(ID: ${selectedUserId})` : ''}`}
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
                                                {(
                                                    <>
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
                                            {userActivities.length > 0 ? (
                                                userActivities.map((activity, index) => (
                                                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
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
                                                                {'for this user'}
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
            </div>
        </>
    );
}

function CT3Table({
    columns,
    rows,
    handleDelete,
    handleViewUserActivities,
}: {
    columns: string[];
    rows: any[];
    handleDelete: (id: number) => void;
    handleViewUserActivities: (id: number) => void;
}) {
    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {columns.map((column, index) => (
                        <th
                            key={index}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {column}
                        </th>
                    ))}
                    <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row: any, index: number) => (
                    <tr key={index}>
                        {columns.map((column) => (
                            <td
                                key={column}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                                {row[column]}
                            </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleViewUserActivities(row.user_id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Activities"
                                >
                                    <EyeIcon
                                        className="h-5 w-5"
                                    />
                                </button>
                                <button
                                    onClick={() => handleDelete(row.user_id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete"
                                >
                                    <TrashIcon
                                        className="h-5 w-5"
                                        data-onboarding={index === 0 ? "delete-user-0" : undefined}
                                    />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
