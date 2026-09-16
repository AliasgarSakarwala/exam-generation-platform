// app/services/gradeStatisticsService.ts
export class GradeStatisticsService {
  static calculatePercentageStats(grades: any[]) {
    if (!grades || grades.length === 0) {
      return {
        mean: 0,
        median: 0,
        low: 0,
        high: 0,
        upperQuartile: 0,
        lowerQuartile: 0,
      };
    }

    try {
      const percentages = grades
        .map(grade => {
          const raw = Number(grade.raw_score);
          const total = Number(grade.grade_points);
          const pct = total > 0 ? (raw / total) * 100 : 0;
          return isNaN(pct) ? 0 : pct;
        })
        .filter(val => val !== null && val !== undefined);

      if (percentages.length === 0) {
        return {
          mean: 0,
          median: 0,
          low: 0,
          high: 0,
          upperQuartile: 0,
          lowerQuartile: 0,
        };
      }

      const sorted = [...percentages].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / sorted.length;
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      const lowerHalf = sorted.slice(0, mid);
      const upperHalf = sorted.slice(sorted.length % 2 === 0 ? mid : mid + 1);
      const lowerQuartile = lowerHalf.length > 0
        ? lowerHalf[Math.floor(lowerHalf.length / 2)]
        : 0;
      const upperQuartile = upperHalf.length > 0
        ? upperHalf[Math.floor(upperHalf.length / 2)]
        : 0;

      return {
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        low,
        high,
        upperQuartile: parseFloat(upperQuartile.toFixed(2)),
        lowerQuartile: parseFloat(lowerQuartile.toFixed(2)),
      };
    } catch (error) {
      console.error('Error in calculatePercentageStats:', error);
      return {
        mean: 0,
        median: 0,
        low: 0,
        high: 0,
        upperQuartile: 0,
        lowerQuartile: 0,
      };
    }
  }
}
