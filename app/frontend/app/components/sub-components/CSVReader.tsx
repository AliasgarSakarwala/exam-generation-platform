"use client";

import React from "react";
import toast from "react-hot-toast";

/**
 * TYPE DEFINITIONS AND GLOBAL VARIABLES
 * 
 * Defines the core data structures and shared state used throughout the component.
 * The globalStudents array serves as a centralized store for student data that
 * can be accessed across different components in the application.
 */

/**
 * Represents a student entity with essential academic information.
 * @property {number} studentId - Unique identifier for the student
 * @property {string} fullname - The student's complete name
 * @property {number} courseId - Identifier for the associated course
 */
interface Student {
  studentId: number;
  fullname: string;
  courseId: number;
}

/**
 * Global in-memory store for student records.
 * This array persists between component renders and can be imported by other modules.
 * Note: In a production environment, consider using state management instead.
 */
let globalStudents: Student[] = [];

/**
 * Component Props Interface
 * 
 * Defines the configuration options and callbacks for the CSVReader component.
 * @property {boolean} darkMode - Enables dark theme styling when true
 * @property {(students: Student[]) => void} onStudentsParsed - Callback invoked after successful CSV parsing
 * @property {number} initialStudentCount - Display value showing previously loaded students
 * @property {Student[]} [initialStudents] - Optional initial student data (not currently used in component)
 */
interface CSVReaderProps {
  darkMode: boolean;
  onStudentsParsed: (students: Student[]) => void;
  initialStudentCount: number;
  initialStudents?: Student[];
}

/**
 * CSVReader Component
 * 
 * A reusable file input component that:
 * - Accepts CSV files containing student data
 * - Validates and parses the file contents
 * - Provides visual feedback via toast notifications
 * - Maintains global student data
 * - Supports light/dark theme modes
 * 
 * The component expects CSV files formatted as: fullname,studentId
 */
export default function CSVReader({
  darkMode = false,
  onStudentsParsed,
  initialStudentCount,
}: CSVReaderProps) {

  /**
   * CSV PARSING ENGINE
   * 
   * Converts raw CSV text into structured student data.
   * Implements strict validation for data integrity.
   * 
   * @param {string} csvText - The complete contents of the uploaded CSV file
   * @param {number} courseId - Temporary course identifier (currently hardcoded to 0)
   * @returns {Student[]} - Array of validated student records
   * @throws {Error} - When encountering:
   *                   - Malformed CSV lines
   *                   - Missing required fields
   *                   - Invalid student ID formats
   */
  const parseCSV = (csvText: string, courseId: number): Student[] => {
    // Split file into individual lines and initialize storage
    const lines = csvText.split("\n");
    const students: Student[] = [];

    // Process each line sequentially
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;

      // Destructure and clean line components
      const [fullname, studentId] = trimmedLine
        .split(",")
        .map((part) => part.trim());

      // Validate required fields exist
      if (!fullname || !studentId) {
        throw new Error(
          `Invalid CSV format in line: "${line}" - expected "fullname,studentId"`
        );
      }

      // Convert and validate student ID as number
      const id = parseInt(studentId);
      if (isNaN(id)) {
        throw new Error(
          `Invalid student ID: "${studentId}" in line: "${line}"`
        );
      }

      // Create and store new student record
      students.push({
        fullname,
        studentId: id,
        courseId,
      });
    }

    return students;
  };

  /**
   * FILE UPLOAD HANDLER
   * 
   * Manages the complete file processing pipeline:
   * 1. File selection from input
   * 2. Text content extraction
   * 3. Data parsing and validation
   * 4. Global state update
   * 5. Parent component notification
   * 6. User feedback via toast notifications
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract first file from input
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Read file contents as text
      const text = await file.text();
      
      // Temporary course ID (would typically come from props or context)
      const tempCourseId = 0;
      
      // Parse and validate CSV content
      const parsedStudents = parseCSV(text, tempCourseId);

      // Update global student store
      globalStudents = parsedStudents;

      // Development logging (consider removing in production)
      console.log("Initial Students array:", globalStudents);

      // Notify parent component of new data
      onStudentsParsed(parsedStudents);

      // Show success notification with dynamic styling
      toast.success(`Found ${parsedStudents.length} students in file`, {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
    } catch (err) {
      // Handle and display errors to user
      const message =
        err instanceof Error ? err.message : "Failed to parse CSV file";
      toast.error(message + " ❌", {
        position: "bottom-center",
        style: {
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
    }
  };

  /**
   * COMPONENT RENDER
   * 
   * Visual presentation including:
   * - File input with theme-appropriate styling
   * - Format guidance for users
   * - Current student count display
   */
  return (
    <div>
      {/* Input label with formatting instructions */}
      <label
        className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"
          }`}
      >
        Student List (CSV)
        <span className="block text-xs text-gray-500 mt-1">
          Format: fullname,studentId
        </span>
      </label>

      {/* File input element with dynamic theme classes */}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className={`w-full p-2 text-sm rounded border ${darkMode
            ? "bg-zinc-700 border-zinc-600 text-white"
            : "bg-white border-gray-300"
          }`}
      />

      {/* Student count display (conditional) */}
      {initialStudentCount > 0 && (
        <div
          className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"
            }`}
        >
          <p>Students found: {initialStudentCount}</p>
        </div>
      )}
    </div>
  );
}

/**
 * MODULE EXPORTS
 * 
 * Provides access to:
 * - The global students store
 * - The Student type definition
 * for use throughout the application
 */
export { globalStudents };
export type { Student };