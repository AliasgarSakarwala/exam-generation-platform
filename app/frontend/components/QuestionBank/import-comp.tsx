import React from 'react'

export default function ImportComponent({
    setShowAddModal,
    setSingleEntry,
    fileInputRef,
    title
}: {
    setShowAddModal: (value: boolean) => void,
    setSingleEntry: (value: boolean) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    title: string
}) {
    return (
        <div className='fixed inset-0 bg-black/40 z-60 flex items-center justify-center' onClick={() => setShowAddModal(false)}>
            <div className='bg-white rounded-2xl p-6 w-11/12 max-w-md' onClick={(e) => e.stopPropagation()}>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PDF Card (Red) */}
                    <div
                        onClick={() => {
                            setShowAddModal(false);
                            fileInputRef.current?.click();
                        }}
                        className="border rounded-lg p-4 cursor-pointer transition-all duration-300 border-gray-200 hover:border-red-500 hover:bg-red-50/30 hover:ring-2 hover:ring-red-500/30"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z" />
                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                                </svg>
                            </div>
                            <h4 className="font-medium mb-1 transition-colors text-gray-900">
                                Import from File
                            </h4>
                            <p className="text-xs text-gray-500">
                                Import data from a CSV or XLSX file
                            </p>
                        </div>
                    </div>

                    {/* Word Card (Blue) */}
                    <div
                        onClick={() => {
                            setShowAddModal(false);
                            setSingleEntry(true);
                        }}
                        className="border rounded-lg p-4 cursor-pointer transition-all duration-300 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 hover:ring-2 hover:ring-blue-500/30"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    width="30"
                                    height="30"
                                    fill="currentColor"
                                    viewBox="0 0 16 16">
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                </svg>
                            </div>
                            <h4 className="font-medium mb-1 transition-colors text-gray-900">
                                Single Entry
                            </h4>
                            <p className="text-xs text-gray-500">
                                Add a single entry using our intuitive interface
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}