'use client';

/**
 * @file Authentication Page Component
 * @description Handles user authentication flows (register, login, password reset)
 */

import React, { useState, useTransition } from "react";
import { notFound } from "next/navigation";
import { ChangeEvent } from "react";
import { FormEvent } from "react";
import { Poppins } from "next/font/google";
import UserVerificationComponent from "@/components/user_verification";
import { login, register, resetPassword } from "@/services/auth";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/services/profile";

// ==================== CONSTANTS & CONFIGURATION ====================

/**
 * Poppins font configuration for the application
 * Only using the 700 weight variant
 */
const poppins = Poppins({
    weight: ['700'],
    subsets: ["latin"],
});

// ==================== MAIN COMPONENT ====================

/**
 * Authentication Page Component
 * @param params - Dynamic route parameters containing the authentication mode
 * @returns {JSX.Element} - The authentication page component
 */
export default function Auth({ params }: {
    params: Promise<{ mode: "register" | "login" | "reset-password" }>
}) {
    // ==================== HOOKS & ROUTER ====================
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // ==================== STATE MANAGEMENT ====================
    const { user, setUser } = useAuth();

    /** Current authentication mode from route params */
    const { mode } = React.use(params);

    /** Toggle for password visibility */
    const [showPassword, setShowPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    /** Selected user role (Professor/TA) - only relevant for registration */
    const [selectedRole, setSelectedRole] = useState<"Professor" | "TA">("Professor");

    /** Form data state - structure varies based on authentication mode */
    const [formData, setFormData] = useState(mode === "register" ? {
        email: "",
        password: "",
        confirmPassword: "",
        role: "Professor",
    } : mode === "login" ? {
        email: "",
        password: ""
    } : {
        email: "",
    });

    /** Form validation errors */
    const [error, setError] = useState<{ [key: string]: { error: boolean, errorText?: string } }>(mode === "register" ? {
        email: { error: false, errorText: undefined },
        password: { error: false, errorText: undefined },
        confirmPassword: { error: false, errorText: undefined }
    } : mode === "login" ? {
        email: { error: false, errorText: undefined },
        password: { error: false, errorText: undefined }
    } : {
        email: { error: false, errorText: undefined },
    });

    /** Password strength validation details - only for registration */
    const [passwordHelperDetails, setPasswordHelperDetails] = useState({
        satisfiedInstruction1: false,  // Length >= 8
        satisfiedInstruction2: false,   // Contains uppercase
        satisfiedInstruction3: false,   // Contains lowercase
        satisfiedInstruction4: false,   // Contains number
    });

    // ==================== VALIDATION & UTILITY FUNCTIONS ====================

    /**
     * Handles input changes and updates form state
     * @param e - Change event from input elements
     */
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Special handling for password field during registration
        if (mode === "register" && name === "password") {
            setPasswordHelperDetails({
                satisfiedInstruction1: value.length >= 8,
                satisfiedInstruction2: value.match(/[A-Z]/) !== null,
                satisfiedInstruction3: value.match(/[a-z]/) !== null,
                satisfiedInstruction4: value.match(/[0-9]/) !== null,
            });
        }
    };

    /**
     * Handles role selection change
     * @param role - Selected role ("Professor" or "TA")
     */
    const handleRoleChange = (role: "Professor" | "TA") => {
        setSelectedRole(role);
    };

    /** Empty error state template for resetting validation errors */
    const emptyErrorState = {
        email: { error: false, errorText: "" },
        password: { error: false, errorText: "" },
        confirmPassword: { error: false, errorText: "" },
    };

    /**
     * Validates form data based on current authentication mode
     * @param mode - Current authentication mode
     * @returns {Object} - Validation errors object
     */
    function validate(mode: string) {
        const errors = { ...emptyErrorState };

        // -- Common email validation for all modes --
        if (!formData.email && mode !== "register") {
            errors.email = { error: true, errorText: "Email is required" };
        }

        // -- Mode-specific validations --
        if (mode === "register") {
            const allowed = /^[A-Za-z0-9@&*\+\-._]+$/;
            // Required fields check
            if (!formData.password || !formData.confirmPassword) {
                if (!formData.password) errors.password = { error: true, errorText: "Password is required" };
                if (!formData.confirmPassword)
                    errors.confirmPassword = { error: true, errorText: "Confirm Password is required" };
            }
            // Password length check
            else if (formData.password.length < 8) {
                const msg = "Password must be at least 8 characters long";
                errors.password = errors.confirmPassword = { error: true, errorText: msg };
            }
            // Password match check
            else if (formData.password !== formData.confirmPassword) {
                errors.password = errors.confirmPassword = { error: true, errorText: "Passwords do not match" };
            }
            // Password character set check
            else if (!formData.password.match(allowed)) {
                errors.password = {
                    error: true,
                    errorText: "Password contains unsupported characters."
                };
            }
        }
        else if (mode === "login") {
            // Password required check for login
            if (!formData.password) {
                errors.password = { error: true, errorText: "Password is required" };
            }
        }

        return errors;
    }

    /**
     * Checks if there are any validation errors
     * @param errors - Validation errors object
     * @returns {boolean} - True if any errors exist
     */
    function hasError(errors: ReturnType<typeof validate>) {
        return Object.values(errors).some(field => field.error);
    }

    // ==================== FORM SUBMISSION HANDLER ====================

    /**
     * Handles form submission for all authentication modes
     * @param e - Form submission event
     */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(emptyErrorState);

        // 1) Validate
        const errors = validate(mode);
        if (hasError(errors)) {
            setError(errors);
            return;
        }

        // 2) If this is a reset-password request, do it immediately
        if (mode === "reset-password") {
            setResetLoading(true);
            try {
                const res = await resetPassword({ email: formData.email });
                if (res?.status >= 200 && res.status < 300) {
                    toast.success("Reset Email Sent Successfully");
                } else if (res.status >= 400 && res.status < 500) {
                    toast.error("Either the email is invalid or MailHog isn't running");
                } else {
                    toast.error("Failed to send reset link");
                }
            } catch (err) {
                toast.error("Network error. Please try again.");
            } finally {
                setResetLoading(false);
            }
            return;  // skip the register/login branch
        }

        // 3) For register/login, keep the transition
        startTransition(async () => {
            let res = null;

            if (mode === "register") {
                res = await changePassword({
                    oldPassword: localStorage.getItem("temp-password")!,
                    newPassword: formData.password!,
                });
            } else if (mode === "login") {
                res = await login({
                    email: formData.email,
                    password: formData.password!,
                });
            }

            if (res && res.status >= 200 && res.status < 300 && (res.data.user.status === "Verified" || mode === "register")) {
                setUser(res.data.user);
                if (res.data.user.role === "Admin") {
                    router.push("/monitor");
                } else {
                    router.push("/");
                }
            } else if (res && res.status >= 200 && res.status < 300 && mode === "login" && res.data.user.status === "Invited") {
                router.push("/auth/register");
                localStorage.setItem("temp-password", formData.password!);
            } else {
                toast.error(
                    res?.data?.message ||
                    res?.data?.error ||
                    res?.data?.status ||
                    "Something went wrong"
                );
            }
        });
    };

    // ==================== RENDER LOGIC ====================

    // Return 404 if mode is invalid
    if (!(mode === "register" || mode === "login" || mode === "reset-password")) {
        return router.replace('/404');
    }

    return (
        <>
            {/* Toaster goes here so it isn’t hidden */}
            <Toaster position="top-right" />

            {/* Loading overlay during API calls */}
            {isPending && <Loading />}

            {/* Main page layout */}
            <div className="w-full h-screen flex lg:flex-row flex-col items-center justify-center">
                {/* Left side - Branding */}
                <div className="lg:w-[45%] lg:h-screen w-full h-[45%] bg-[#3774E5] flex flex-col items-center justify-center">
                    <img
                        src="../ct3_logo.png"
                        alt="CT3 Logo"
                        className="lg:w-[200px] lg:h-[190px] w-[100px] h-[100px] rounded-2xl lg:mt-0 mt-10"
                    />
                    <h1 className={`lg:text-3xl md:text-2xl text-xl ${poppins.className} text-white mt-10 text-center`}>
                        Exam Generation and Analysis System
                    </h1>
                </div>

                {/* Right side - Authentication form */}
                <div className="lg:w-[55%] w-full h-screen bg-[#EDEDED]">
                    {/* Render appropriate form based on mode */}
                    {mode === "register" ? (
                        <UserVerificationComponent
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                            handleRoleChange={handleRoleChange}
                            nameTextInput1="email"
                            nameTextInput2="password"
                            nameTextInput3="confirmPassword"
                            pageDetails={{
                                title: "Create Password",
                                subtitle: "Enter your details to create a password",
                                showTextInput1: false,
                                showTextInput2: true,
                                showTextInput3: true,
                                ctaButtonText: "Create Password",
                                placeholderTextInput1: "Email",
                                mode: "register",
                                errorDetails: error,
                                placeholderTextInput2: "Password",
                                placeholderTextInput3: "Confirm Password",
                                passwordHelperDetails: passwordHelperDetails,
                            }}
                        />
                    ) : mode === "login" ? (
                        <UserVerificationComponent
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                            nameTextInput1="email"
                            nameTextInput2="password"
                            pageDetails={{
                                title: "Sign In to your account",
                                subtitle: "Enter your details to sign in",
                                showTextInput1: true,
                                showTextInput2: true,
                                showTextInput3: false,
                                ctaButtonText: "Sign In",
                                mode: "login",
                                errorDetails: error,
                                placeholderTextInput1: "Email",
                                placeholderTextInput2: "Password"
                            }}
                        />
                    ) : mode === "reset-password" ? (
                        <UserVerificationComponent
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                            nameTextInput1="email"
                            pageDetails={{
                                title: "Reset Password",
                                subtitle: "Enter your details to reset your password",
                                showTextInput1: true,
                                showTextInput2: false,
                                showTextInput3: false,
                                ctaButtonText: "Send Reset Link",
                                mode: "reset-password",
                                errorDetails: error,
                                placeholderTextInput1: "UBC Email",
                            }} nameTextInput2={""} />
                    ) : null}
                </div>
            </div>
        </>
    );
}