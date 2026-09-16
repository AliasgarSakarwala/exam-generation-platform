import { getExamVariants } from "@/services/exam_variant";
import { ExamVariantQuestionService } from "@/services/exam_variant_question";
import { getQuestionById } from "@/services/question";
import { useState, useEffect } from "react";

interface ExamCardDetailsProps {
  examId: number;
}

interface ExamVariantWithQuestions {
  exam_variant_id: number;
  version_number: number;
  answer_key?: string | null;
  questions: Array<{
    question_id: number;
    question_text: string;
    question_number: number;
    options: string[];
    correct_options: string[];
    tag: string;
  }>;
}

export const useExamCardDetails = (examId: number | null) => {
  const [examData, setExamData] = useState<ExamVariantWithQuestions[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      return;
    }

    const fetchExamData = async () => {
      try {
        setLoading(true);
        
        const cachedData = localStorage.getItem(`ExamCardDetails-${examId}`);
        if (cachedData) {
          setExamData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
        
        const variants = await getExamVariants(examId);
        
        const variantsWithQuestions = await Promise.all(
          variants.map(async (variant) => {
            const response = await ExamVariantQuestionService.getQuestionsByVariant(variant.exam_variant_id);
            const questionsData = Array.isArray(response) ? response : 
                                (response.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
            
            // Fetch tags for each question
            const questionsWithTags = await Promise.all(
              questionsData.map(async (q: any) => {
                try {
                  // Get the full question details including tags
                  const questionDetails = await getQuestionById(q.question_id);
                  console.log('question id',q.question_id,'details question',questionDetails)
                  const firstTag = questionDetails.tags?.length > 0 
                    ? questionDetails.tags[0] 
                    : 'Rogue';
                  
                  return {
                    question_id: q.question_id,
                    question_text: q.question_text,
                    question_number: q.question_number,
                    options: q.options || [],
                    correct_options: q.correct_options || [],
                    tag: firstTag
                  };
                } catch (err) {
                  console.error(`Error fetching tags for question ${q.question_id}:`, err);
                  return {
                    question_id: q.question_id,
                    question_text: q.question_text,
                    question_number: q.question_number,
                    options: q.options || [],
                    correct_options: q.correct_options || [],
                    tag: 'Rogue'
                  };
                }
              })
            );
            
            return {
              exam_variant_id: variant.exam_variant_id,
              version_number: variant.version_number,
              answer_key: variant.answer_key || '',
              questions: questionsWithTags
            };
          })
        );
        
        setExamData(variantsWithQuestions);
        localStorage.setItem(`ExamCardDetails-${examId}`, JSON.stringify(variantsWithQuestions));
      } catch (err) {
        setError('Failed to fetch exam data');
        console.error('Error fetching exam data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId]);

  return { examData, loading, error };
};