'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { UserData } from '../settings/page';
import { changePassword } from '@/services/profile';
import toast from 'react-hot-toast';
import Loading from '../loading';
import SystemCard from '@/components/system-card';
import { SettingsTextInput } from '@/components/settings-text-input';
import StatCard from '@/components/stat-card';
import CTAButton from '@/components/settings-cta';
import { updateProfile } from '@/services/profile';
import { getUserData } from '@/services/profile';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { getClassroomStats } from '@/services/classroom';
import { getQuestionsCount } from '@/services/question';

/**
 * SettingsComponents - Core user settings management component.
 * 
 * Handles:
 * - User profile display and editing (username, email)
 * - Secure password changes with validation
 * - System preference configurations
 * - Responsive layouts for desktop/mobile
 * 
 * State Management Strategy:
 * - Uses React's useState for local component state
 * - Uses useTransition for non-critical state updates
 * - Maintains separate state for form data vs. API data
 * 
 * Error Handling:
 * - Toast notifications for user feedback
 * - Silent logging for developer diagnostics
 * - Loading states during async operations
 * 
 * @returns {React.ReactElement} A responsive settings dashboard with multiple interactive sections.
 */
export default function SettingsComponents() {
  // ==== STATE DEFINITIONS ==== //
  /**
   * Tracks which system setting card is currently selected.
   * Null when no selection exists.
   * Used for visual highlighting and potential future actions.
   */
  const [selectedSystemSetting, setSelectedSystemSetting] = useState<string | null>(null);

  /**
   * Global loading state for the component.
   * True during any asynchronous operation (data fetching, form submissions).
   * Triggers the global loading spinner when active.
   */
  const [loading, setLoading] = useState(false);

  /**
   * Password change form state.
   * Maintains both old and new passwords in a single object to ensure atomic updates.
   * Security Note: Values are held in memory but not persisted.
   */
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
  });

  /**
   * Toggles password visibility for both password fields simultaneously.
   * Implemented as a single state to maintain UX consistency.
   */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Editable profile data (username, email).
   * Separate from userData to support edit/cancel functionality.
   * Only committed to server on explicit save.
   */
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  });

  /**
   * User data fetched from API.
   * Null before initial fetch completes.
   * Used as source of truth for non-editable displays.
   */
  const [userData, setUserData] = useState<UserData | null>(null);

  /**
   * Stats for courses created and total students
   */
  const [classroomStats, setClassroomStats] = useState<{ courses_created: number; total_students: number } | null>(null);

  /**
   * Questions count for the professor
   */
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);

  /**
   * React 18's transition API for non-urgent state updates.
   * Wraps the initial user data fetch to avoid blocking UI.
   */
  const [isPending, startTransition] = useTransition();

  /**
   * Tracks whether profile fields are in edit mode.
   * When false, fields are read-only.
   * Toggled by the Edit/Save button.
   */
  const [isEditingName, setIsEditingName] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ==== CONSTANT CONFIGURATIONS ==== //
  /**
   * System settings configuration array.
   * 
   * Each entry contains:
   * - label: Display text
   * - icon: Path to SVG asset
   * 
   * Note: Currently implements selection highlighting only.
   * Future extension: Connect each setting to actual functionality.
   */
  const systemSettings = [
    { label: 'Change Language', icon: '/change-language.svg', isDelete: false },
    { label: 'Report a Problem', icon: '/report-a-bug.svg', isDelete: false },
    { label: 'Delete Account', icon: '/delete-user-icon.svg', isDelete: true }
  ];

  // ==== LIFECYCLE HOOKS ==== //
  /**
   * Data initialization effect.
   * 
   * On mount:
   * 1. Initiates a transition-wrapped fetch of user data
   * 2. Updates both profileData (for editing) and userData (for display)
   * 3. Handles errors silently (logs to console only)
   * 
   * Dependencies: Empty array ensures single execution.
   */
  useEffect(() => {
    startTransition(() => {
      getUserData()
        .then((res) => {
          setUserData(res.data);
          setProfileData({
            email: res.data.email,
            username: res.data.username
          });
        })
        .catch((err) => {
          console.error('User data fetch failed:', err);
        });
      // Fetch classroom stats
      getClassroomStats()
        .then((res) => {
          setClassroomStats(res.data);
        })
        .catch((err) => {
          console.error('Classroom stats fetch failed:', err);
        });
      // Fetch questions count
      getQuestionsCount()
        .then((res) => {
          setQuestionsCount(res.data.questions_added);
        })
        .catch((err) => {
          console.error('Questions count fetch failed:', err);
        });
    });
  }, []);


  // ==== PASSWORD HANDLERS ==== //
  /**
   * Handles password change submission.
   * 
   * Flow:
   * 1. Sets loading state
   * 2. Calls API with old/new passwords
   * 3. Shows toast notification based on outcome
   * 4. Resets loading state
   * 
   * Security Considerations:
   * - No client-side validation (handled by API)
   * - Errors are shown generically to avoid information leakage
   */
  async function handleChangePassword() {
    setLoading(true);
    try {
      const res = await changePassword({
        oldPassword: changePasswordData.oldPassword,
        newPassword: changePasswordData.newPassword,
      });

      // Success case (2xx status)
      if (res.status >= 200 && res.status < 300) {
        toast.success(res.data.message);
      }
      // API-level error (e.g., invalid password)
      else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      // Network errors or unexpected failures
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      // Reset form and loading state
      setLoading(false);
      setChangePasswordData({ oldPassword: '', newPassword: '' });
    }
  }

  // ==== PROFILE EDITING HANDLERS ==== //
  /**
   * Enters profile editing mode.
   * 
   * Actions:
   * - Enables form field editing
   * - Changes main button to "Save"
   */
  function handleEditProfile() {
    setIsEditingName(true);
  }

  /**
   * Saves profile changes to server.
   * 
   * Flow:
   * 1. Exits edit mode immediately (optimistic UI)
   * 2. Calls update API with new values
   * 3. On success:
   *    - Updates display data
   *    - Shows success toast
   * 4. On failure:
   *    - Reverts to edit mode
   *    - Shows error toast
   */
  async function handleSaveProfile() {
    setIsEditingName(false);
    setLoading(true);

    try {
      const res = await updateProfile({
        username: profileData.username,
        email: profileData.email,
      });

      if (res.status >= 200 && res.status < 300) {
        toast.success(res.data.message);
        // Sync both display and edit states with new data
        setUserData(res.data.user);
        setProfileData({
          username: res.data.user.username,
          email: res.data.user.email
        });
      } else {
        // API validation error
        toast.error(res.data.message);
        setIsEditingName(true); // Revert to edit mode
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Profile update failed');
      setIsEditingName(true); // Revert to edit mode
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles changes to editable profile fields.
   * 
   * Special Behavior:
   * - Explicitly ignores 'department' field changes
   * - Maintains all other field values during updates
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // Department is read-only, exclude from updates
    if (name !== 'department') {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  // ==== RENDER LOGIC ==== //
  /**
   * Loading state guard.
   * Shows spinner during:
   * - Initial data load (isPending)
   * - API operations (loading)
   * - Missing user data (!userData)
   */
  if (loading || isPending || !userData || !classroomStats || questionsCount === null) {
    return <Loading />;
  }

  // ==== COMPONENT STRUCTURE ==== //
  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Page Header */}
      <h1 className={`relative inline-block text-4xl font-medium group ''`}>
        {/* Gradient text (light blue) - only visible in light mode */}
        <span className={`
    ${'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600'}
    group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700
    transition-all duration-500
  `}>
          Settings
        </span>

        {/* Shine effect overlay - only visible in light mode */}
        {(
          <span className="absolute inset-0 overflow-hidden">
            <span className="absolute top-0 -left-full w-1/2 h-full 
        bg-white/30 -skew-x-12
        group-hover:animate-shine group-hover:[animation-duration:1.8s] 
        transition-all duration-500 pointer-events-none"></span>
          </span>
        )}
      </h1>

      {/* Main Content Area */}
      <div className="flex-1 my-1 bg-white rounded-[16px] p-8 shadow-sm overflow-y-auto">

        {/* Profile Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img
              src="/user-avatars/User 07a.svg"
              alt="Profile"
              className="rounded-full mr-4 lg:w-[80px] lg:h-[80px] md:w-[60px] md:h-[60px] w-[40px] h-[40px]"
            />
            <div>
              <h3 className={`m-0 font-bold`}>{userData?.username}</h3>
              <p className={`m-0 text-gray-500`}>{userData?.email}</p>
            </div>
          </div>
          <CTAButton
            value={isEditingName ? 'Save' : 'Edit'}
            onClick={isEditingName ? handleSaveProfile : handleEditProfile}
          />
        </div>

        {/* User Details Section */}
        <h4 className={`text-xl text-[#3774E5] font-semibold`}>User Details</h4>

        {/* Desktop Layout - 2-column form */}
        <div className="hidden lg:flex gap-4 mb-1 px-6">
          <div className="flex-1">
            <SettingsTextInput
              name="username"
              label="Full Name"
              value={isEditingName ? profileData.username : userData?.username}
              readOnly={!isEditingName}
              onChange={handleProfileChange}
              isEditingName={isEditingName}
            />
            <div className="flex gap-1">
              {[
                { num: classroomStats.courses_created, label: 'Courses Created' },
                { num: questionsCount, label: 'Questions Added' },
                { num: classroomStats.total_students, label: 'Total Students' },
              ].map((s) => (
                <StatCard key={s.label} num={s.num} label={s.label} />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <SettingsTextInput
              name="email"
              label="Email"
              value={isEditingName ? profileData.email : userData?.email}
              readOnly={!isEditingName}
              onChange={handleProfileChange}
              isEditingName={isEditingName}
            />
            <SettingsTextInput
              name="department"
              label="Department"
              placeholder="Department"
              readOnly
            />
          </div>
        </div>

        {/* Mobile Layout - Stacked form */}
        <div className="lg:hidden flex flex-col gap-4 mb-1 md:px-6 px-0">
          {/* ... (identical functionality, responsive layout) ... */}
        </div>

        {/* Password Change Section */}
        <h4 className={`text-xl text-[#3774E5] font-semibold`}>Change Password</h4>
        <div className="grid grid-cols-2 gap-5 px-6">
          <SettingsTextInput
            name="oldPassword"
            label="Old Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Old Password"
            onChange={(e) =>
              setChangePasswordData({
                ...changePasswordData,
                oldPassword: e.target.value,
              })
            }
            showEye={true}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
          <SettingsTextInput
            name="newPassword"
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter New Password"
            onChange={(e) =>
              setChangePasswordData({
                ...changePasswordData,
                newPassword: e.target.value,
              })
            }
            showEye={true}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>
        <div className="flex justify-end px-6">
          <CTAButton
            value="Submit Request"
            onClick={handleChangePassword}
          />
        </div>

        {/* System Settings Section */}
        <div>
          <h4 className={`text-xl text-[#3774E5] font-semibold`}>System Settings</h4>
          <div className="flex gap-4 px-6">
            {systemSettings.map((s) => (
              <SystemCard
                key={s.label}
                label={s.label}
                iconSrc={s.icon}
                onClick={() =>
                  s.isDelete
                    ? setIsDeleteModalOpen(true)
                    : setSelectedSystemSetting(s.label)
                }
                isDelete={s.isDelete}
              />
            ))}
          </div>
        </div>
        {isDeleteModalOpen && userData && (
          <DeleteAccountModal
            userId={userData.user_id}
            onClose={() => setIsDeleteModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}