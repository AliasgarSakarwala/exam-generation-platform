import React, { useRef } from 'react'
import Tooltip from './Tooltip'
import { HelpCircle } from 'lucide-react'

const TextInput = ({ 
    leadingIcon, 
    placeholder, 
    name, 
    trailingIcon, 
    type, 
    onChange, 
    error, 
    errorText,
    tooltipContent,
    tooltipPosition = 'top'
}: { 
    leadingIcon: React.ReactNode, 
    trailingIcon?: React.ReactNode, 
    placeholder: string, 
    name: string, 
    type?: string, 
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    error?: boolean, 
    errorText?: string,
    tooltipContent?: string,
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    return (
        <div className="relative">
            <div
                // clicking anywhere here will focus the input
                onClick={() => inputRef.current?.focus()}
                className={`flex items-center justify-between lg:w-[300px] md:w-[300px] w-[250px] h-[40px] border ${error ? "border-red-500" : "border-black"} focus-within:border-blue-500 focus-within:border-2 rounded-xl px-2 py-1 bg-[#F5F5F5] lg:text-md md:text-md text-sm`}
            >
                <div className="flex items-center">
                    {leadingIcon}
                    <input
                        ref={inputRef}
                        data-testid={`${name}--input`}
                        name={name}
                        type={type ?? "text"}
                        placeholder={placeholder}
                        onChange={onChange}
                        className="focus:outline-none focus:ring-0 ml-2 lg:w-[220px] md:w-[220px] w-[190px]"
                    />
                </div>
                <div className="flex items-center mr-2">
                    {trailingIcon}
                </div>
            </div>
            {tooltipContent && (
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                    <Tooltip content={tooltipContent} position={tooltipPosition}>
                        <HelpCircle className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" />
                    </Tooltip>
                </div>
            )}
            {error && (
                <p className="text-red-500 ml-2 mt-1 text-sm" data-testid={`${name}--error`}>{errorText}</p>
            )}
        </div>
    )
}

export default TextInput
