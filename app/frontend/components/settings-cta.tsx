'use client';

export default function CTAButton({
    value,
    onClick,
    isLoading = false,
}: {
    value: string;
    onClick: () => void;
    isLoading?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`bg-[#3774E5] text-white rounded-[6px] p-2 text-sm cursor-pointer transform transition duration-200 ease-out hover:-translate-y-1 hover:scale-105 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            <div className="flex items-center gap-1">
                <img src="/edit-icon.svg" alt="Edit" width={20} height={20} />
                <p>{value}</p>
            </div>
        </button>
    );
}
