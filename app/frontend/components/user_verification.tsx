import React from 'react'
import { Poppins } from 'next/font/google';
import TextInput from './text-input';
import { FaUserAlt } from 'react-icons/fa';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa6';
import { FormEvent } from 'react';
import { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import CreatePasswordHelper from './create-password-helper';
import Tooltip from './Tooltip';
import { HelpCircle } from 'lucide-react';

const poppins = Poppins({
    weight: ['700'],
    subsets: ["latin"],
});

type RegisterProps = {
    showPassword: boolean,
    nameTextInput1: string,
    nameTextInput2: string,
    nameTextInput3?: string,
    setShowPassword: (showPassword: boolean) => void,
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
    handleSubmit: (e: FormEvent) => void,
    pageDetails: PageProps,
    handleRoleChange?: (role: "Professor" | "TA") => void,
}

type PageProps = {
    title: string,
    subtitle: string,
    showTextInput1: boolean,
    showTextInput2: boolean,
    showTextInput3: boolean,
    ctaButtonText: string,
    placeholderTextInput1: string,
    placeholderTextInput2?: string,
    mode: "register" | "login" | "reset-password",
    placeholderTextInput3?: string,
    errorDetails?: { [key: string]: { error: boolean, errorText?: string } }
    passwordHelperDetails?: PasswordHelperProps,
    selectRole?: boolean,
    selectedRole?: "Professor" | "TA",
}

type PasswordHelperProps = {
    satisfiedInstruction1: boolean,
    satisfiedInstruction2: boolean,
    satisfiedInstruction3: boolean,
    satisfiedInstruction4: boolean,
}

const UserVerificationComponent = ({
    showPassword,
    setShowPassword,
    handleChange,
    handleSubmit,
    pageDetails,
    nameTextInput1,
    nameTextInput2,
    nameTextInput3,
    handleRoleChange,
}: RegisterProps) => {
    const router = useRouter();
    return (
        <div className="w-full h-full flex flex-col items-center justify-between lg:py-20 py-10">
            <div className="w-screen flex flex-col items-center lg:gap-2 gap-1">
                <h1 className={`lg:text-3xl md:text-2xl text-xl ${poppins.className} text-[#3774E5]`}>{pageDetails.title}</h1>
                <p className="lg:text-xl md:text-lg text-base text-[#3774E5] lg:mb-0 md:mb-0 mb-2">{pageDetails.subtitle}</p>
            </div>
            <div className="w-screen h-[80%] flex flex-col items-center lg:gap-5 md:gap-3 gap-2 justify-center">
                {pageDetails.showTextInput1 && (
                    <div>
                        <TextInput
                            leadingIcon={<FaUserAlt />}
                            placeholder={pageDetails.placeholderTextInput1}
                            name={nameTextInput1}
                            error={pageDetails.errorDetails?.[nameTextInput1]?.error}
                            errorText={pageDetails.errorDetails?.[nameTextInput1]?.errorText}
                            onChange={handleChange}
                            tooltipContent={pageDetails.mode === "reset-password" ? "Enter your registered email to receive a reset link" : undefined}
                            tooltipPosition="top"
                        />
                        {
                            pageDetails.mode === "reset-password" &&
                            <p
                                className="text-[rgba(0,0,0,0.3)] lg:text-sm md:text-sm text-xs lg:w-[300px] md:w-[300px] w-[250px] mt-2 ml-3"
                                data-testid="reset-password--info"
                            >
                                <span className="text-red-500">*</span>We will send a reset link if the email entered is registered with us
                            </p>
                        }
                    </div>
                )}
                {pageDetails.showTextInput2 && (
                    <div className="w-full flex flex-col items-center justify-center">
                        <TextInput
                            leadingIcon={<FaLock />}
                            placeholder={pageDetails.placeholderTextInput2 ?? "Password"}
                            name={nameTextInput2}
                            type={showPassword ? "text" : "password"}
                            trailingIcon={showPassword ?
                                <FaEyeSlash className="ml-2 cursor-pointer" onClick={() => setShowPassword(false)} /> :
                                <FaEye className="ml-2 cursor-pointer" onClick={() => setShowPassword(true)} />
                            }
                            error={pageDetails.errorDetails?.[nameTextInput2]?.error}
                            errorText={pageDetails.errorDetails?.[nameTextInput2]?.errorText}
                            onChange={handleChange}
                            tooltipContent={pageDetails.mode === "login" ? "Enter your password to sign in to your account" : undefined}
                            tooltipPosition="top"
                        />
                        {pageDetails.mode === "register" && (
                            <div className="grid grid-cols-1 grid-rows-4 lg:gap-3 md:gap-2 gap-1 lg:pt-4 md:pt-3 pt-2" data-testid="password--helper">
                                {/* now you can drop in 6 children, they’ll fill a 2×3 grid */}
                                <CreatePasswordHelper
                                    text="Minimum 8 Characters"
                                    satisfied={pageDetails.passwordHelperDetails?.satisfiedInstruction1 === true}
                                />
                                <CreatePasswordHelper
                                    text="Contains at least one uppercase letter"
                                    satisfied={pageDetails.passwordHelperDetails?.satisfiedInstruction2 === true}
                                />
                                <CreatePasswordHelper
                                    text="Contains at least one lowercase letter"
                                    satisfied={pageDetails.passwordHelperDetails?.satisfiedInstruction3 === true}
                                />
                                <CreatePasswordHelper
                                    text="Contains at least one number"
                                    satisfied={pageDetails.passwordHelperDetails?.satisfiedInstruction4 === true}
                                />
                            </div>
                        )}
                    </div>
                )}
                {pageDetails.showTextInput3 && <TextInput
                    leadingIcon={<FaLock />}
                    placeholder={pageDetails.placeholderTextInput3 ?? "Confirm Password"}
                    name={nameTextInput3 ?? "confirmPassword"}
                    type={showPassword ? "text" : "password"}
                    trailingIcon={showPassword
                        ? <FaEyeSlash className="ml-2 cursor-pointer" onClick={() => setShowPassword(false)} />
                        : <FaEye className="ml-2 cursor-pointer" onClick={() => setShowPassword(true)}
                        />}
                    error={pageDetails.errorDetails?.[nameTextInput3 ?? "confirmPassword"]?.error}
                    errorText={pageDetails.errorDetails?.[nameTextInput3 ?? "confirmPassword"]?.errorText}
                    onChange={handleChange}
                />}
                {pageDetails.selectRole && handleRoleChange &&
                    <div className="relative">
                        <div
                            className="lg:w-[250px] md:w-[250px] w-[200px] h-[40px] flex border border-[#3774E5] rounded-xl overflow-hidden"
                        >
                            <div className="flex w-full h-full">
                                {/* Left half */}
                                <div
                                    className={`flex items-center justify-center w-1/2 ${pageDetails.selectedRole === "Professor" ? "bg-[#3774E566]" : ""}`}
                                    onClick={() => handleRoleChange("Professor")}
                                >
                                    <p className="text-[#3774E5] text-center">
                                        Professor
                                    </p>
                                </div>
                                {/* Right half */}
                                <div
                                    className={`flex items-center justify-center w-1/2 ${pageDetails.selectedRole === "TA" ? "bg-[#3774E566]" : ""}`}
                                    onClick={() => handleRoleChange("TA")}
                                >
                                    <p className="text-[#3774E5] text-center">
                                        TA
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                            <Tooltip content="Choose the account type based on your role" position="top">
                                <HelpCircle className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" />
                            </Tooltip>
                        </div>
                    </div>
                }

                <button
                    data-testid={`${pageDetails.mode}--submit`}
                    onClick={handleSubmit}
                    className="w-[250px] h-[40px] bg-[#3774E5] rounded-2xl text-white lg:mt-0 mt-2 shadow transition-all duration-200 ease-out hover:shadow-xl hover:-translate-y-0.5 transform focus:outline-none cursor-pointer"
                >
                    {pageDetails.ctaButtonText}
                </button>
            </div>
            {pageDetails.mode !== "register" &&
                <div className="w-full flex lg:flex-row flex-col items-center justify-end px-10">
                    {pageDetails.mode !== "login" &&
                        <div className="w-screen flex items-center lg:justify-start justify-center">
                            <p>Don't have an account?</p>
                            <button
                                data-testid={`${pageDetails.mode}--redirect`}
                                onClick={() => {
                                    if (pageDetails.mode === "login") {
                                        router.push("/auth/register");
                                    } else {
                                        router.push("/auth/login");
                                    }
                                }}
                                className="relative text-[#3774E5] ml-1 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#3774E5] after:transition-all after:duration-300 hover:after:w-full"
                            >
                                Register
                            </button>
                        </div>
                    }
                    <div className="flex items-center lg:justify-end justify-center">
                        <button
                            data-testid={pageDetails.mode === "login" ? "forgot-password" : "need-help"}
                            onClick={() => {
                                if (pageDetails.mode === "login") router.push("/auth/reset-password");
                            }}
                            className="relative text-[#3774E5] ml-1 cursor-pointer inline-flex whitespace-nowrap flex-shrink-0 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#3774E5] after:transition-all after:duration-300 hover:after:w-full">
                            {pageDetails.mode === "login" ? "Forgot Password?" : "Need Help?"}
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}

export default UserVerificationComponent