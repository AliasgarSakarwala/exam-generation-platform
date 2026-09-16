// services/analytics/variantAverageScoreService.ts
import axios from "axios";

interface Grade {
  grade_id: number;
  raw_score: number;
  grade_points: number;
  exam_variant_id: number;
  student: {
    id: number;
    name: string;
  };
}

export interface VariantAverage {
  variant: string;
  average: number;
}

export async function fetchVariantAverages(classroomId: number, examId: number): Promise<VariantAverage[]> {
  try {
    // First fetch all variants
    const variantsRes = await axios.get(`http://localhost:8000/api/exams/${examId}/columns/variant_count`);
    const variantCount = variantsRes.data.variant_count;
        
    // Fetch grades for each variant and calculate averages
    const averages: VariantAverage[] = [];
        
    for (let variantId = 1; variantId <= variantCount; variantId++) {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/classrooms/${classroomId}/exams/${examId}/grades/variant/${variantId}`
        );
        
        // Handle the response structure: { success: true, data: Grade[] }
        const grades: Grade[] = response.data.success ? response.data.data : response.data;

        if (grades.length > 0) {
          const total = grades.reduce((sum, grade) => sum + (grade.raw_score / grade.grade_points), 0);
          const avg = (total / grades.length) * 100; // Convert to percentage
                
          averages.push({
            variant: `Variant ${variantId}`,
            average: parseFloat(avg.toFixed(2)),
          });
        }
      } catch (variantError) {
        console.warn(`No grades found for variant ${variantId}:`, variantError);
        // Continue to next variant if this one fails
      }
    }

    return averages;
  } catch (error) {
    console.error("Failed to fetch variant averages:", error);
    return [];
  }
}