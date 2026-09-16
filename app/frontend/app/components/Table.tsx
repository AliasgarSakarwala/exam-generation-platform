import React from 'react'
import { EditIcon } from '../../components/svgs/EditIcon'
import { DeleteIcon } from '../../components/svgs/DeleteIcon'
import { EyeIcon } from '../../components/svgs/EyeIcon'

interface TableProps {
    columns: string[];
    rows: Record<string, any>[];
    onEdit?: (row: Record<string, any>) => void;
    onDelete?: (row: Record<string, any>) => void;
    onView?: (row: Record<string, any>) => void;
    colorCoding?: boolean;
    codingOnColumn?: string;
    isPreview?: boolean;
    tutorialPage?: 'course' | 'exam' | 'questionBank' | 'questionBankDetails' | 'analytics' | 'studentManagement';
}

const CustomTable = ({ columns, rows, onEdit, onDelete, onView, colorCoding, codingOnColumn, isPreview, tutorialPage }: TableProps) => {
    return (
        <div className="min-h-0 w-full">
            <table className="min-w-full table-auto border-collapse rounded-xl" data-testid="ct3-table">
                <thead className="bg-[#3774E54D]">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={col}
                                className={
                                    "border-b px-4 py-2 text-left text-sm font-medium text-gray-600 " +
                                    (idx === 0 ? "rounded-tl-xl " : "")
                                }
                            >
                                {col}
                            </th>
                        ))}
                        <th
                            className="border-b px-4 py-2 text-left text-sm font-medium text-gray-600 rounded-tr-xl"
                        >
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className={
                                `${row[codingOnColumn!] ?
                                    row[codingOnColumn!] > 6 ? "bg-green-200" : row[codingOnColumn!] > 4 && row[codingOnColumn!] <= 6 ? "bg-yellow-200" : "bg-red-200"
                                    : i % 2 === 1 ? "bg-[#EDEDED]" : "bg-white"} ${row[codingOnColumn!] && "border-b"}`
                            }
                        >
                            {columns.map((col) => (
                                <td
                                    key={col}
                                    className="px-4 py-2 text-sm text-gray-800"
                                >
                                    {row[col]}
                                </td>
                            ))}
                            <td
                                className="px-4 py-2 text-sm text-gray-800"
                            >
                                <div className="flex items-center gap-2">
                                    {onView &&
                                        <button
                                            className="p-1 rounded cursor-pointer hover:translate-y-[-3px] transition-all duration-200"
                                            onClick={() => onView?.(row)}
                                            data-testid="row-view-button"
                                            data-onboarding={`view-${tutorialPage}-${i}`}
                                        >
                                            <EyeIcon width={18} height={18} />
                                        </button>
                                    }
                                    {onEdit &&
                                        <button
                                            className="p-1 rounded cursor-pointer hover:translate-y-[-3px] transition-all duration-200"
                                            onClick={() => onEdit?.(row)}
                                            data-testid="row-edit-button"
                                            data-onboarding={`edit-${tutorialPage}-${i}`}
                                        >
                                            <EditIcon width={18} height={18} />
                                        </button>
                                    }
                                    {onDelete &&
                                        <button
                                            className="p-1 rounded cursor-pointer hover:translate-y-[-3px] transition-all duration-200"
                                            onClick={() => onDelete?.(row)}
                                            data-testid="row-delete-button"
                                            data-onboarding={`delete-${tutorialPage}-${i}`}
                                        >
                                            <DeleteIcon width={18} height={18} />
                                        </button>
                                    }
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default CustomTable