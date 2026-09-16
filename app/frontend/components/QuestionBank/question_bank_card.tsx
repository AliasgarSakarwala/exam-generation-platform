import CustomTable from "@/app/components/Table";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";


export interface FileStats {
    total: number
    easy: number
    medium: number
    hard: number
    updatedAt: string
}

export default function QuestionBankCard({
    bank_id,
    name,
    columns,
    questions,
    stats,
    router,
    dataOnboarding
}: {
    bank_id: number,
    name: string,
    columns: string[],
    questions: any[],
    stats: FileStats,
    router: AppRouterInstance,
    dataOnboarding?: string
}) {
    return (
        <div
            key={bank_id}
            className="bg-[#F9F9F9] w-full h-[350px] rounded-2xl shadow-lg flex flex-col overflow-hidden cursor-pointer hover:shadow-md hover:scale-102 transition-all duration-200"
            data-testid="bank"
            onClick={() => router.push(`questions/${bank_id}`)}
            data-onboarding={dataOnboarding}
        >
            {/* Upper: preview */}
            <div
                className="relative w-full h-[200px] overflow-hidden"
            >
                <div className="w-full h-[200px] px-4 py-4 overflow-hidden">
                    <CustomTable
                        columns={columns}
                        rows={questions}
                        onEdit={() => { }}
                        onDelete={() => { }}
                        onView={() => { }}
                    />
                </div>
            </div>

            {/* Lower: metadata grid */}
            <div className="grid grid-cols-2 gap-2 p-4 text-sm auto-rows-min">
                {/* ROW 1 */}
                <div>
                    <label className="block mb-1">Name</label>
                    <input
                        data-testid="bank-name"
                        value={name}
                        readOnly
                        disabled
                        className="w-full border border-gray-400 rounded p-1"
                    />
                </div>
                <div>
                    <label className="block mb-1">Total</label>
                    <input
                        readOnly
                        disabled
                        value={stats.total}
                        className="w-full border border-gray-400 rounded p-1"
                    />
                </div>

                {/* ROW 2 */}
                <div>
                    <label className="block mb-1">Updated</label>
                    <input
                        readOnly
                        disabled
                        value={stats.updatedAt}
                        className="w-full border border-gray-400 rounded p-1"
                    />
                </div>
                <div className="flex space-x-2 items-center justify-center">
                    {["Easy", "Medium", "Hard"].map((level) => (
                        <div key={level} className="flex flex-col items-start">
                            <label className="mb-1">{level}</label>
                            <input
                                readOnly
                                disabled
                                value={stats[level.toLowerCase() as "easy" | "medium" | "hard"]}
                                className="w-full border border-gray-400 rounded p-1"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}