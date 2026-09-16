'use client';

interface StatCardProps {
    num: number;
    label: string;
}

export default function StatCard({ num, label }: StatCardProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center border border-[#3774E5] rounded-[8px] text-gray-500 h-[70px]">
            <p className="text-[20px] font-bold text-[#3774E5]">{num}</p>
            <p className="text-[16px] font-medium text-gray-500">{label}</p>
        </div>
    );
}