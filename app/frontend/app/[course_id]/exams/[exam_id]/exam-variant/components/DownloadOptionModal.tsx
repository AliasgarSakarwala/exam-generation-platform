import React, { useState } from 'react';

interface ExamVariantData {
  exam_variant_id: number;
  version_number: number;
  answer_key?: string | null;
  questions: ExamVariantQuestionData[];
}

interface ExamVariantQuestionData {
  question_text: string;
  question_number: number;
  options: string[];
  correct_options: string[];
}

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF: (variant: ExamVariantData) => void;
  onDownloadWord: (variant: ExamVariantData) => void;
  onDownloadAll?: (format: 'PDF' | 'Word') => void;
  fileName?: string;
  variants: ExamVariantData[];
}

const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  isOpen,
  onClose,
  onDownloadPDF,
  onDownloadWord,
  onDownloadAll = () => {},
  fileName = 'exam',
  variants,
}) => {
  const [activeFormat, setActiveFormat] = useState<'PDF' | 'Word' | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [downloadMode, setDownloadMode] = useState<'single' | 'all'>('single');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!activeFormat) return;
    
    setIsLoading(true);
    
    try {
      if (downloadMode === 'all') {
        onDownloadAll(activeFormat);
      } else {
        if (selectedVariant === null) return;
        const variant = variants.find(v => v.exam_variant_id === selectedVariant);
        if (variant) {
          if (activeFormat === 'PDF') {
            onDownloadPDF(variant);
          } else if (activeFormat === 'Word') {
            onDownloadWord(variant);
          }
        }
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const showAllOption = typeof onDownloadAll === 'function';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                <i className="fas fa-download mr-2 text-blue-500 dark:text-blue-400"></i>
                Download Exam
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Download exam in your preferred format
            </p>
          </div>

          <div className="px-6 py-5 space-y-6">
            {showAllOption && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setDownloadMode('single')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    downloadMode === 'single'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Single Variant
                </button>
                <button
                  onClick={() => setDownloadMode('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    downloadMode === 'all'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Variants (ZIP)
                </button>
              </div>
            )}

            {downloadMode === 'single' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Exam Variant
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.exam_variant_id}
                      onClick={() => setSelectedVariant(variant.exam_variant_id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedVariant === variant.exam_variant_id
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            selectedVariant === variant.exam_variant_id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {variant.version_number}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            Version {variant.version_number}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {variant.questions.length} questions
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Format
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF Card (Red) */}
                <div
                  onClick={() => setActiveFormat('PDF')}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    activeFormat === 'PDF'
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 ring-2 ring-red-500/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50/30 dark:hover:bg-red-900/5 hover:ring-2 hover:ring-red-500/30'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        activeFormat === 'PDF'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                        <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.645 20 20 0 0 0 1.062-2.227 7.3 7.3 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a11 11 0 0 0 .98 1.686 5.8 5.8 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.86.86 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.7 5.7 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.3 11.3 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.8.8 0 0 1-.58.029m1.379-1.901q-.25.115-.459.238c-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361q.016.032.026.044l.035-.012c.137-.056.355-.235.635-.572a8 8 0 0 0 .45-.606m1.64-1.33a13 13 0 0 1 1.01-.193 12 12 0 0 1-.51-.858 21 21 0 0 1-.5 1.05zm2.446.45q.226.245.435.41c.24.19.407.253.498.256a.1.1 0 0 0 .07-.015.3.3 0 0 0 .094-.125.44.44 0 0 0 .059-.2.1.1 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a4 4 0 0 0-.612-.053zM8.078 7.8a7 7 0 0 0 .2-.828q.046-.282.038-.465a.6.6 0 0 0-.032-.198.5.5 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822q.036.167.09.346z" />
                      </svg>
                    </div>
                    <h4
                      className={`font-medium mb-1 transition-colors ${
                        activeFormat === 'PDF'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      PDF
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Portable Document Format
                    </p>
                  </div>
                </div>

                {/* Word Card (Blue) */}
                <div
                  onClick={() => setActiveFormat('Word')}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    activeFormat === 'Word'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/5 hover:ring-2 hover:ring-blue-500/30'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        activeFormat === 'Word'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.485 6.879a.5.5 0 1 0-.97.242l1.5 6a.5.5 0 0 0 .967.01L8 9.402l1.018 3.73a.5.5 0 0 0 .967-.01l1.5-6a.5.5 0 0 0-.97-.242l-1.036 4.144-.997-3.655a.5.5 0 0 0-.964 0l-.997 3.655L5.485 6.88z" />
                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                      </svg>
                    </div>
                    <h4
                      className={`font-medium mb-1 transition-colors ${
                        activeFormat === 'Word'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      Word
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Microsoft Word Document
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={!activeFormat || (downloadMode === 'single' && selectedVariant === null) || isLoading}
              className={`px-4 py-2 text-white rounded-lg transition ${
                activeFormat && (downloadMode === 'all' || selectedVariant !== null) && !isLoading
                  ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {!isLoading ? (
                'Download'
              ) : (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptionsModal;