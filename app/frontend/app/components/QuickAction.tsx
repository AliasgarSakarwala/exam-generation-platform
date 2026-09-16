'use client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import React from 'react';
import { useRouter } from 'next/navigation';
import { PerformanceRecord } from './LineCurveGraph';

type QuickActionProps = {
  data: Array<{ id: string; grade: number }>;
  reportData?: PerformanceRecord[];
  statistics?: {
    mean: number;
    median: number;
    min: number;
    max: number;
    lowerQuartile: number;
    upperQuartile: number;
    totalExams?: number;
    totalVariants?: number;
  };
  onSelectItem: (id: string) => void;
  labelPrefix?: string;
  defaultLabel?: string;
  showCompareButton?: boolean;
  labelMode?: 'exam' | 'variant'; 
};

const QuickAction: React.FC<QuickActionProps> = ({ 
  data, 
  reportData = [],
  statistics,
  onSelectItem,
  labelPrefix = 'Variant ',
  defaultLabel = 'All Variants',
  showCompareButton = true,
  labelMode = 'variant' 
}) => {
  const router = useRouter();
  const items = Array.from(new Set(data.map(d => d.id)))
    .sort()
    .filter(Boolean);

  const [showReportOptions, setShowReportOptions] = React.useState(false);

  const handleDownloadExcel = () => {
    if (!reportData || reportData.length === 0 || !statistics) {
      alert('No data available for report.');
      return;
    }

    const {
      mean,
      median,
      min,
      max,
      lowerQuartile,
      upperQuartile,
      totalExams,
      totalVariants
    } = statistics;

    const today = new Date().toLocaleDateString();

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Prepare all data - keeping variants/exams but removing student info
    const allData = [
      [labelMode === 'variant' ? "Exam Variant Report" : "Course Exam Report"],
      ["Generated on", today],
      [],
      ["Summary Statistics"],
      ["Mean", mean.toFixed(2)],
      ["Median", median.toFixed(2)],
      ["Minimum", min.toFixed(2)],
      ["Maximum", max.toFixed(2)],
      ["Lower Quartile (Q1)", lowerQuartile.toFixed(2)],
      ["Upper Quartile (Q3)", upperQuartile.toFixed(2)],
      [labelMode === 'variant' ? "Total Variants" : "Total Exams", 
      labelMode === 'variant' ? totalVariants || 'N/A' : totalExams || 'N/A'],
      [],
      ["Performance Data"],
      [
        labelMode === 'variant' ? "Variant" : "Exam",
        "Grade (%)"
      ],
      ...reportData.map(item => [
        labelMode === 'variant' ? item.variant : `{item.exam} ${item.variant}`.trim(), //fix item.exam does not exist
        item.grade.toFixed(2)
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 }, // Exam/Variant column
      { wch: 10 }  // Grade column
    ];

    // Apply styles
    const styleCell = (cellAddress: string, style: any) => {
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }
      worksheet[cellAddress].s = style;
    };

    // Style title
    styleCell("A1", { font: { bold: true, sz: 16 } });

    // Style section headers
    styleCell("A4", { font: { bold: true } });
    styleCell("A14", { font: { bold: true } });

    // Style column headers
    ["A15", "B15"].forEach(cell => {
      styleCell(cell, { font: { bold: true } });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Report");
    
    // Dynamic filename based on report type
    const fileName = labelMode === 'variant' 
      ? `Exam_Variant_Report_${today.replace(/\//g, '-')}.xlsx`
      : `Course_Exam_Report_${today.replace(/\//g, '-')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadPDF = () => {
    if (!reportData || reportData.length === 0 || !statistics) {
      alert('No data available for report.');
      return;
    }

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Title (dynamic based on labelMode)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      labelMode === 'variant' ? "Exam Variant Report" : "Course Exam Report", 
      105, 
      15, 
      { align: 'center' }
    );
    
    // Generation date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${today}`, 105, 22, { align: 'center' });

    // Summary Statistics
    const {
      mean,
      median,
      min,
      max,
      lowerQuartile,
      upperQuartile,
      totalExams,
      totalVariants
    } = statistics;

    let y = 32; // Starting Y position after title

    // Summary header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Summary Statistics", 14, y);
    y += 8;

    // Summary content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryLeft = [
      `Mean: ${mean.toFixed(2)}`,
      `Median: ${median.toFixed(2)}`,
      `Minimum: ${min.toFixed(2)}`,
      `Maximum: ${max.toFixed(2)}`
    ];

    const summaryRight = [
      `Lower Quartile: ${lowerQuartile.toFixed(2)}`,
      `Upper Quartile: ${upperQuartile.toFixed(2)}`,
      labelMode === 'variant' 
        ? `Total Variants: ${totalVariants || 'N/A'}`
        : `Total Exams: ${totalExams || 'N/A'}`
    ];

    // Draw two-column summary
    summaryLeft.forEach((text, index) => {
      doc.text(text, 14, y + (index * 7));
      if (summaryRight[index]) {
        doc.text(summaryRight[index], 105, y + (index * 7));
      }
    });

    y += (summaryLeft.length * 7) + 10;

    // Results section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(
      labelMode === 'variant' ? "Variant Results" : "Exam Results", 
      14, 
      y
    );
    y += 8;

    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text(labelMode === 'variant' ? "Variant" : "Exam", 14, y);
    doc.text("Grade (%)", 120, y);
    y += 7;

    // Table rows
    doc.setFont('helvetica', 'normal');
    reportData.forEach(item => {
      const displayText = labelMode === 'variant' 
        ? item.variant 
        : `{item.exam} ${item.variant}`.trim(); //fix item.exam does not exist
      
      const examText = doc.splitTextToSize(displayText, 80);
      const gradeText = item.grade.toFixed(2);

      let textHeight = 0;
      examText.forEach((line: string) => {
        doc.text(line, 14, y + textHeight);
        textHeight += 7;
      });

      doc.text(gradeText, 120, y);
      y += Math.max(textHeight, 7);
      
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    // Dynamic filename based on report type
    const fileName = labelMode === 'variant' 
      ? `Exam_Variant_Report_${today.replace(/\//g, '-')}.pdf`
      : `Course_Exam_Report_${today.replace(/\//g, '-')}.pdf`;

    doc.save(fileName);
  };

  const handleCompareItems = () => {
    router.push('/compareAnalytic');
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-white">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <div className="relative">
          <button 
            onClick={() => setShowReportOptions(!showReportOptions)}
            className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm text-left hover:bg-blue-100 transition-colors"
          >
            Generate Reports
          </button>

          {showReportOptions && (
            <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-md shadow-md z-20">
              <button 
                onClick={() => {
                  handleDownloadExcel();
                  setShowReportOptions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Download as Excel
              </button>
              <button 
                onClick={() => {
                  handleDownloadPDF();
                  setShowReportOptions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Download as PDF
              </button>
            </div>
          )}
        </div>
        
        {showCompareButton && (
          <button 
            onClick={handleCompareItems} 
            className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm text-left hover:bg-blue-100 transition-colors"
          >
            Compare {labelPrefix.trim() + 's'}
          </button>
        )}
        
        <select
          className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
          onChange={(e) => onSelectItem(e.target.value)}
          defaultValue=""
        >
          <option value="">{defaultLabel}</option>
          {items.map((item, index) => (
            <option key={`${labelPrefix}-${item}`} value={item}>
              {labelPrefix}{index+1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuickAction;