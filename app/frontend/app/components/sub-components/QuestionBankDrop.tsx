import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import QuestionBankBox, { Question, QuestionBank } from "./QuestionBankBox";

type DifficultyStyle = {
  text: string;
  bg: string;
  textColor: string;
};

type DifficultyStyles = {
  [key: number]: DifficultyStyle;
};

const difficultyStyles: DifficultyStyles = {
  1: { text: 'Easy', bg: 'bg-green-100', textColor: 'text-green-800' },
  2: { text: 'Medium', bg: 'bg-yellow-100', textColor: 'text-yellow-800' },
  3: { text: 'Hard', bg: 'bg-red-100', textColor: 'text-red-800' }
};


interface QuestionBankDropProps {
  questionBanks: QuestionBank[];
  setQuestionBanks: React.Dispatch<React.SetStateAction<QuestionBank[]>>;
}

export default function QuestionBankDrop({ questionBanks, setQuestionBanks }: QuestionBankDropProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPosition, setModalPosition] = useState({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 - 400 : 100,
        y: 100
    });
    const [isLoading, setIsLoading] = useState(false);

    // Simulate loading (replace with actual loading logic)
    const handleOpenModal = () => {
        setIsLoading(true);
        setIsModalOpen(true);
        
        // Simulate API fetch
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

  // Get all selected questions
  const selectedQuestions = questionBanks.flatMap(bank =>
    bank.questions.filter(q => q.selected)
  );

  const toggleQuestionSelect = (bankId: number, questionId: number) => {
    setQuestionBanks(prevBanks =>
      prevBanks.map(bank => {
        if (bank.id === bankId) {
          const updatedQuestions = bank.questions.map(question => {
            if (question.id === questionId) {
              const newSelected = !question.selected;
              return {
                ...question,
                selected: newSelected,
                mandatory: newSelected ? question.mandatory : false
              };
            }
            return question;
          });
          return { ...bank, questions: updatedQuestions };
        }
        return bank;
      })
    );
  };

  const toggleQuestionMandatory = (bankId: number, questionId: number) => {
    setQuestionBanks(prevBanks =>
      prevBanks.map(bank => {
        if (bank.id === bankId) {
          const updatedQuestions = bank.questions.map(question => {
            if (question.id === questionId) {
              const newMandatory = !question.mandatory;
              return {
                ...question,
                mandatory: newMandatory,
                selected: newMandatory ? true : question.selected
              };
            }
            return question;
          });
          return { ...bank, questions: updatedQuestions };
        }
        return bank;
      })
    );
  };

  const deselectAllQuestions = () => {
    setQuestionBanks(prevBanks =>
      prevBanks.map(bank => ({
        ...bank,
        questions: bank.questions.map(question => ({
          ...question,
          selected: false,
          mandatory: false
        }))
      }))
    );
  };

  return (
        <>
            <div className="flex flex-col items-center justify-start h-full w-full border-2 border-dashed border-gray-300 rounded-xl p-4 min-h-[200px] bg-gray-50/50 hover:bg-gray-50 transition-colors">
                {selectedQuestions.length > 0 ? (
                    <>
                        <div className="w-full space-y-2 mb-4 overflow-y-auto max-h-[300px] pr-2">
                            {selectedQuestions.map((question) => (
                                <div 
                                    key={question.id} 
                                    className="flex items-center justify-between p-3 border rounded-lg bg-white hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center">
                                        {question.mandatory && (
                                            <span className="text-red-500 mr-2 font-bold">*</span>
                                        )}
                                        <span className="text-sm text-gray-800">
                                            {question.text}
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${difficultyStyles[question.difficulty].bg} ${difficultyStyles[question.difficulty].textColor}`}>
                                                {difficultyStyles[question.difficulty].text}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={question.mandatory}
                                                onChange={() => {
                                                    const bank = questionBanks.find(b =>
                                                        b.questions.some(q => q.id === question.id)
                                                    );
                                                    if (bank) {
                                                        toggleQuestionMandatory(bank.id, question.id);
                                                    }
                                                }}
                                                disabled={!question.selected}
                                                className={`w-4 h-4 rounded focus:ring-blue-500 transition ${!question.selected ? 'text-gray-300' : 'text-red-600'}`}
                                            />
                                            <span className="ml-2 text-xs text-red-700">Mandatory</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const bank = questionBanks.find(b =>
                                                    b.questions.some(q => q.id === question.id)
                                                );
                                                if (bank) {
                                                    toggleQuestionSelect(bank.id, question.id);
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="w-full flex justify-between mt-auto">
                            <button
                                onClick={handleOpenModal}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add More Questions
                            </button>
                            <button
                                onClick={deselectAllQuestions}
                                className="text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                                Deselect All
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 h-full w-full transition-colors"
                        onClick={handleOpenModal}
                    >
                        <Plus className="w-8 h-8" />
                        <span className="mt-2 text-lg">Add Questions</span>
                    </button>
                )}
            </div>

            <QuestionBankBox
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                questionBanks={questionBanks}
                onQuestionBanksChange={setQuestionBanks}
                position={modalPosition}
                onPositionChange={setModalPosition}
                isLoading={isLoading}
            />
        </>
    );
}