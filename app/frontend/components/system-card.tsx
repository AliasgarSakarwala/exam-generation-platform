'use client';

interface SystemCardProps {
    label: string;
    iconSrc: string;
    isDelete?: boolean;
    onClick: () => void;
}
export default function SystemCard({ label, iconSrc, onClick, isDelete}: SystemCardProps) {
    const base = 'rounded-[12px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 h-[120px] w-[200px] mt-2';

    return (
        <div onClick={onClick} className={`${base} ${isDelete ? 'bg-red-100': 'bg-blue-100'}`}>
            <div className="mb-2 h-[40px] w-[40px] rounded-full flex items-center justify-center">
                <img src={iconSrc} alt={label} width={30} height={30} />
            </div>
            <p className={`text-[#3774E5]`}>{label}</p>
        </div>
    );
}