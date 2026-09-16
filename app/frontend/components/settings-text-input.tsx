
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

interface TextInputProps {
    label: string;
    value?: string;
    readOnly?: boolean;
    type?: string;
    placeholder?: string;
    showEye?: boolean;
    showPassword?: boolean;
    setShowPassword?: (value: boolean) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEditingName?: boolean;
    name: string;
}

export function SettingsTextInput({
    label,
    value,
    readOnly = false,
    type = 'text',
    placeholder,
    showEye = false,
    showPassword = false,
    onChange,
    setShowPassword,
    isEditingName = false,
    name,
}: TextInputProps) {



    return (
        <div className="mb-5 mt-1">
            <label
                className={`block font-medium mb-1.5 text-gray-500 text-md`}
            >
                {label}
            </label>
            <div className="relative">
                <input
                    name={name}
                    type={type === 'password' && showPassword ? 'text' : type}
                    value={value}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    onChange={onChange}
                    className={`w-full h-[40px] pr-10 px-4 py-3 rounded-[8px] ${isEditingName ? `border-2` : `border-1`} ${isEditingName ? 'border-[#3774E5]' : 'border-gray-300'} bg-gray-50 text-gray-500`}
                />
                {/* Eye icon */}
                {showEye && (
                    showPassword ? (
                        <FaEyeSlash
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                            size={18}
                            onClick={() => {
                                setShowPassword!(false);
                            }}
                        />
                    ) : (
                        <FaEye
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                            size={18}
                            onClick={() => {
                                setShowPassword!(true);
                            }}
                        />
                    )
                )}
            </div>
        </div>
    );
}