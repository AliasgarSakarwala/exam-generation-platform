import api from '../lib/api';
import { saveActivity } from './activity';


export interface APIGrade {
  grade_id: number;
  student: {
    student_id: number;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
  };
  raw_score: number;
  normalized_score: number | null;
  letter_grade: string | null;
  grade_points: number;
  percentile: number | null;
  exam_grade: number | null; // Added
  exam_variant_id: number;
  version: number;
  answers: {
    selected_option: string;
    question_number: number;
  }[];
}

export interface GradeStatistics {
  meanRawScore: number;
  meanGradePoints: number;
  count: number;
  medianRawScore?: number;
  minRawScore?: number;
  maxRawScore?: number;
  lowerQuartileRawScore?: number;
  upperQuartileRawScore?: number;
}

export interface GradesByVariant {
  [exam_variant_id: number]: {
    grades: APIGrade[];
    statistics: GradeStatistics;
  };
}

export interface ExamAggregatedStats {
  mean: number;
  median: number;
  lowerQuartile: number;
  upperQuartile: number;
  min: number;
  max: number;
  totalStudents: number;
  totalExams: number;
}

export interface APIExamVariant {
  exam_variant_id: number;
  version_number: number;
  instructions: string | null;
  created_at: string;
  answer_key: string[];
}

export interface APIExam {
  exam_id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  total_points: number;
  question_count: number;
  variant_count: number;
  available_from: string;
  variants: APIExamVariant[];
}

export interface UploadGradePayload {
  exam_variant_id: number;
  student_id: number;
  raw_score: number;
  normalized_score?: number | null;
  letter_grade?: string | null;
  grade_points: number;
  percentile?: number | null;
  exam_grade?: number | null; // Added
  answer: string[];
}

export const computeStats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;

  const mean =
    count > 0 ? sorted.reduce((sum, v) => sum + v, 0) / count : 0;
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

  const getQuartile = (arr: number[], q: number) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  };

  const lowerQuartile = getQuartile(sorted, 0.25);
  const upperQuartile = getQuartile(sorted, 0.75);
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  return {
    mean,
    median,
    min,
    max,
    lowerQuartile,
    upperQuartile,
  };
};

export const uploadGrades = async (classroomId: number, examVariantId: number, payload: any) => {
  const res = await api.post(`/classrooms/${classroomId}/exams/${examVariantId}/grades`, payload)
  await saveActivity({
    route: `/classrooms/${classroomId}/exams/${examVariantId}/grades`,
    method: 'POST',
    status_code: res.status,
    payload: { ...payload, examVariantId },
    action: 'Upload',
    entity: 'Grade',
    classroom_id: classroomId,
    description: `UPLOAD-GRADES-EXAM-VARIANT-${examVariantId}-CLASSROOM-${classroomId}`
  });
  return { data: res.data, status: res.status }
}

export const groupGradesByVariant = (grades: APIGrade[]): GradesByVariant => {
  const grouped: GradesByVariant = {};

  for (const grade of grades) {
    const variantId = grade.exam_variant_id;
    if (!grouped[variantId]) {
      grouped[variantId] = {
        grades: [],
        statistics: { meanRawScore: 0, meanGradePoints: 0, count: 0 }
      };
    }
    grouped[variantId].grades.push(grade);
  }

  for (const variantId in grouped) {
    const g = grouped[variantId].grades;
    const count = g.length;

    // Convert each raw_score to a percentage using grade_points as the denominator
    const rawPercentages = g.map(gr => {
      const raw = gr.raw_score ?? 0;
      const max = gr.grade_points ?? 1; // Avoid division by zero
      return (raw / max) * 100;
    });

    const rawStats = computeStats(rawPercentages);

    grouped[variantId].statistics = {
      meanRawScore: rawStats.mean, // Now in %
      meanGradePoints: 100,        // All percentages, so this is always 100
      count: count,
      medianRawScore: rawStats.median,
      minRawScore: rawStats.min,
      maxRawScore: rawStats.max,
      lowerQuartileRawScore: rawStats.lowerQuartile,
      upperQuartileRawScore: rawStats.upperQuartile,
    };
  }

  return grouped;
};

export const getAllGradesByExam = async (
  classroomId: number,
  examId: number
): Promise<{ data: APIGrade[]; grouped: GradesByVariant; status: number }> => {
  const res = await api.get(`/classrooms/${classroomId}/exams/${examId}/grades`);
  const grades: APIGrade[] = res.data;
  const grouped = groupGradesByVariant(grades);

  return {
    data: grades,
    grouped,
    status: res.status
  };
};

export const getGrades = async (classroomId: number, examId: number) => {
  const res = await api.get(`/classrooms/${classroomId}/exams/${examId}/grades`);
  const data: APIGrade[] = res.data;
  const apiGrades = [];

  for (const grade of data) {
    const map: Record<string, any> = {};
    map['Student ID'] = grade.student.student_id;
    map['Exam Version'] = grade.version;
    map['Variant ID'] = grade.exam_variant_id;
    map['Exam Grade'] = grade.exam_grade; // Added exam_grade to the output
    for (const answer of grade.answers) {
      map['Question ' + answer.question_number] = answer.selected_option;
    }
    map['Percentage Score'] = ((grade.raw_score / grade.grade_points) * 100).toFixed(1);
    apiGrades.push(map);
  }

  return { data: apiGrades, status: res.status }
};

export const getAllExamsData = async (classroomId: number): Promise<APIExam[]> => {
  try {
    const res = await api.get(`/exams/classroom/${classroomId}`);

    // Handle different response formats
    let exams = res.data;

    // If response is wrapped in a data property
    if (exams && typeof exams === 'object' && exams.data) {
      exams = exams.data;
    }

    // Ensure we return an array
    if (Array.isArray(exams)) {
      return exams;
    } else if (exams) {
      // If it's a single exam object, wrap it in an array
      return [exams];
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error getting exams for classroom ${classroomId}:`, error);
    return [];
  }
};