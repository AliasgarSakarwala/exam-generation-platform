import CustomTable from "@/app/components/Table";
import { FileStats } from "./question_bank_card";

export interface FileData {
    id: string            // e.g. UUID or name-based key
    fileName: string
    columns: string[]
    rows: Record<string, any>[]
    stats: FileStats
}

export default function QuestionBankCardPreview({ id,
    fileName,
    columns,
    rows,
    stats,
    setModalFile,
    nameOnChange,
    handleRemove,
    questionBankName,
}: {
    id: string,
    fileName: string,
    columns: string[],
    rows: any[],
    stats: FileStats,
    nameOnChange: (id: string, newName: string) => void,
    handleRemove: (id: string) => void,
    setModalFile: React.Dispatch<React.SetStateAction<FileData | null>>,
    questionBankName: string,
}) {
    return (
        <div
            className="bg-[#F9F9F9] w-full h-[400px] rounded-2xl shadow-lg flex flex-col overflow-hidden"
            data-testid="bank"
        >
            {/* Upper: preview */}
            <div
                className="relative group w-full h-[200px] overflow-hidden cursor-pointer"
                onClick={() => setModalFile({ id, fileName, columns, rows, stats })}
            >
                <div className="w-full h-[200px] px-4 py-4 overflow-hidden hover:cursor-pointer hover:text-[#3774E5]" data-testid="preview">
                    <CustomTable
                        columns={columns}
                        rows={rows.slice(0, 3)}
                        onEdit={() => { }}
                        onDelete={() => { }}
                        onView={() => { }}
                    />
                </div>
                <div
                    className="absolute inset-0 bg-[#3774E580] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    <span className="text-white font-semibold">Show Preview</span>
                </div>
            </div>

            {/* Lower: metadata grid */}
            <div className="grid grid-cols-2 gap-2 p-4 text-sm auto-rows-min">
                {/* ROW 1 */}
                <div>
                    <label className="block mb-1">Name</label>
                    <input
                        value={questionBankName}
                        onChange={e => {
                            // let them type anything (even spaces or empty)
                            nameOnChange(id, e.target.value);
                        }}
                        placeholder="Name Your Question Bank..."
                        className="w-full border rounded p-1"
                    />
                </div>
                <div>
                    <label className="block mb-1">Total</label>
                    <input
                        readOnly
                        value={stats.total}
                        className="w-full border rounded p-1"
                    />
                </div>

                {/* ROW 2 */}
                <div>
                    <label className="block mb-1">Updated</label>
                    <input
                        readOnly
                        value={stats.updatedAt}
                        className="w-full border rounded p-1"
                    />
                </div>
                <div className="flex space-x-2 items-center justify-center">
                    {["Easy", "Medium", "Hard"].map((level) => (
                        <div key={level} className="flex flex-col items-start">
                            <label className="mb-1">{level}</label>
                            <input
                                readOnly
                                value={stats[level.toLowerCase() as "easy" | "medium" | "hard"]}
                                className="w-full border rounded p-1"
                            />
                        </div>
                    ))}
                </div>

                {/* ROW 3 */}
                <div className="flex col-start-2 justify-end pt-2">
                    <button
                        className="bg-red-500 text-white px-2 py-2 rounded cursor-pointer hover:translate-y-[-5px] transition-all duration-200 flex items-center gap-2"
                        onClick={e => {
                            e.stopPropagation();
                            handleRemove(id);
                        }}
                    >
                        <img src="/delete.svg" alt="delete" className="w-[25px] h-[25px]" />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    )
}