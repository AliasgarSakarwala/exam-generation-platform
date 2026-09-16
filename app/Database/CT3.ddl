-- =============================================
-- SECTION 1: SCHEMA CLEANUP
-- =============================================

-- Drop tables in reverse dependency order to maintain referential integrity
DROP TABLE IF EXISTS student_classroom_stat CASCADE;
DROP TABLE IF EXISTS classroom_stat CASCADE;
DROP TABLE IF EXISTS grade CASCADE;
DROP TABLE IF EXISTS exam_stat CASCADE;
DROP TABLE IF EXISTS student_answer CASCADE;
DROP TABLE IF EXISTS exam_result CASCADE;
DROP TABLE IF EXISTS exam_variant_question CASCADE;
DROP TABLE IF EXISTS exam_variant CASCADE;
DROP TABLE IF EXISTS question_tag CASCADE;
DROP TABLE IF EXISTS question_option CASCADE;
DROP TABLE IF EXISTS question CASCADE;
DROP TABLE IF EXISTS question_bank CASCADE;
DROP TABLE IF EXISTS exam CASCADE;
DROP TABLE IF EXISTS classroom_student CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS classroom_ta CASCADE;
DROP TABLE IF EXISTS classroom CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS ta CASCADE;
DROP TABLE IF EXISTS professor CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

DROP TABLE IF EXISTS tag CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- =============================================
-- SECTION 2: USER MANAGEMENT
-- =============================================

-- Core user accounts for the system
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    role VARCHAR(10) NOT NULL 
        CHECK (role IN ('Professor', 'TA', 'Admin')),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE
        CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    password_hash VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL
        CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar')),
    mode VARCHAR(5) DEFAULT 'light' NOT NULL
        CHECK (mode IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Professor specialization table
CREATE TABLE professor (
    user_id INT PRIMARY KEY 
        REFERENCES "user"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teaching Assistant specialization table
CREATE TABLE ta (
    user_id INT PRIMARY KEY 
        REFERENCES "user"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Administrator specialization table
CREATE TABLE admin (
    user_id INT PRIMARY KEY 
        REFERENCES "user"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SECTION 3: CLASSROOM MANAGEMENT
-- =============================================

-- Academic courses/classrooms
CREATE TABLE classroom (
    classroom_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    section VARCHAR(3),
    description TEXT,
    professor_id INT NOT NULL 
        REFERENCES professor(user_id) ON DELETE RESTRICT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    term VARCHAR(50),
    
    student_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Add unique constraint for the combination of fields
    CONSTRAINT unique_classroom_combination UNIQUE (code, section, start_date, end_date, professor_id)
);

-- Teaching assistant assignments to classrooms
CREATE TABLE classroom_ta (
    classroom_id INT NOT NULL 
        REFERENCES classroom(classroom_id) ON DELETE CASCADE,
    ta_id INT NOT NULL 
        REFERENCES ta(user_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (classroom_id, ta_id)
);

-- =============================================
-- SECTION 4: STUDENT MANAGEMENT
-- =============================================

-- Student records
CREATE TABLE student (
    student_id INT NOT NULL UNIQUE PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollment in classrooms
CREATE TABLE classroom_student (
    classroom_id INT NOT NULL 
        REFERENCES classroom(classroom_id) ON DELETE CASCADE,
    student_id INT NOT NULL,
    student_fullname VARCHAR(100) NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (enrollment_status IN ('Active', 'Dropped', 'Completed')),
    PRIMARY KEY (classroom_id, student_id)
);

-- =============================================
-- SECTION 5: EXAM MANAGEMENT
-- =============================================

-- Exams within classrooms
CREATE TABLE exam (
    exam_id SERIAL PRIMARY KEY,
    classroom_id INT NOT NULL 
        REFERENCES classroom(classroom_id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_points INT NOT NULL
        CHECK (total_points > 0),
    question_count INT NOT NULL
        CHECK (question_count > 0),
    variant_count INT NOT NULL DEFAULT 1
        CHECK (variant_count > 0),
    available_from TIMESTAMP WITH TIME ZONE,
    available_to TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (classroom_id, exam_id)
);

-- Question banks for exams
CREATE TABLE question_bank (
    question_bank_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL 
        REFERENCES exam(exam_id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SECTION 6: QUESTIONS & TAGS
-- =============================================

-- Tags for categorizing questions
CREATE TABLE tag (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Individual questions within question banks
CREATE TABLE question (
    question_id SERIAL PRIMARY KEY,
    question_bank_id INT NOT NULL 
        REFERENCES question_bank(question_bank_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL
        CHECK (question_type IN ('MultipleChoice', 'TrueFalse')),
    difficulty_level INT 
        CHECK (difficulty_level BETWEEN 1 AND 5),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INT NOT NULL 
        REFERENCES professor(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Answer options for questions
CREATE TABLE question_option (
    question_option_id SERIAL PRIMARY KEY,
    question_id INT NOT NULL 
        REFERENCES question(question_id) ON DELETE CASCADE,
    option_letter CHAR(1) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (question_id, option_letter)
);

-- Question tagging relationships
CREATE TABLE question_tag (
    question_id INT NOT NULL 
        REFERENCES question(question_id) ON DELETE CASCADE,
    tag_id INT NOT NULL 
        REFERENCES tag(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- =============================================
-- SECTION 7: EXAM VARIANTS
-- =============================================

-- Different versions of exams
CREATE TABLE exam_variant (
    exam_variant_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL 
        REFERENCES exam(exam_id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, version_number)
);



-- =============================================
-- SECTION 8: EXAM RESULTS & GRADING
-- =============================================

-- Student exam results
CREATE TABLE exam_result (
    exam_result_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL 
        REFERENCES exam(exam_id) ON DELETE CASCADE,
    student_id INT NOT NULL 
        REFERENCES student(student_id) ON DELETE CASCADE,
    exam_variant_id INT NOT NULL 
        REFERENCES exam_variant(exam_variant_id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE,
    percentage_score NUMERIC(5,2)
        CHECK (percentage_score BETWEEN 0 AND 100),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Started'
        CHECK (status IN ('Started', 'Submitted', 'Graded', 'RegradeRequested')),
    UNIQUE (exam_id, student_id)
);

-- Individual student answers to questions
CREATE TABLE student_answer (
    student_answer_id SERIAL PRIMARY KEY,
    exam_result_id INT NOT NULL 
        REFERENCES exam_result(exam_result_id) ON DELETE CASCADE,
    question_id INT NOT NULL 
        REFERENCES question(question_id) ON DELETE CASCADE,
    selected_option CHAR(1),
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SECTION 9: STATISTICS & ANALYTICS
-- =============================================

-- Aggregate statistics for exams
CREATE TABLE exam_stat (
    exam_stat_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL UNIQUE 
        REFERENCES exam(exam_id) ON DELETE CASCADE,
    average_score NUMERIC(5,2) NOT NULL
        CHECK (average_score BETWEEN 0 AND 100),
    median_score NUMERIC(5,2) NOT NULL
        CHECK (median_score BETWEEN 0 AND 100),
    pass_rate NUMERIC(5,2) NOT NULL
        CHECK (pass_rate BETWEEN 0 AND 100),
    high_score NUMERIC(5,2) NOT NULL,
    low_score NUMERIC(5,2) NOT NULL,
    standard_deviation NUMERIC(5,2) NOT NULL,
    question_count INT NOT NULL,
    student_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Individual grades tied to statistics
CREATE TABLE grade (
    grade_id SERIAL PRIMARY KEY,
    exam_stat_id INT NOT NULL 
        REFERENCES exam_stat(exam_stat_id) ON DELETE CASCADE,
    student_id INT NOT NULL 
        REFERENCES student(student_id) ON DELETE CASCADE,
    raw_score NUMERIC(7,2) NOT NULL,
    normalized_score NUMERIC(5,2) NOT NULL,
    letter_grade CHAR(2) NOT NULL,
    grade_points NUMERIC(3,2) NOT NULL,
    percentile INT NOT NULL
        CHECK (percentile BETWEEN 0 AND 100)
);

-- Classroom-level statistics
CREATE TABLE classroom_stat (
    classroom_stat_id SERIAL PRIMARY KEY,
    classroom_id INT NOT NULL 
        REFERENCES classroom(classroom_id) ON DELETE CASCADE,
    exam_count INT NOT NULL,
    average_score NUMERIC(5,2) NOT NULL,
    median_score NUMERIC(5,2) NOT NULL,
    pass_rate NUMERIC(5,2) NOT NULL,
    high_score NUMERIC(5,2) NOT NULL,
    low_score NUMERIC(5,2) NOT NULL,
    standard_deviation NUMERIC(5,2) NOT NULL,
    student_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Student-level statistics within classrooms
CREATE TABLE student_classroom_stat (
    student_classroom_stat_id SERIAL PRIMARY KEY,
    classroom_id INT NOT NULL 
        REFERENCES classroom(classroom_id) ON DELETE CASCADE,
    student_id INT NOT NULL 
        REFERENCES student(student_id) ON DELETE CASCADE,
    exam_count INT NOT NULL,
    average_score NUMERIC(5,2) NOT NULL,
    median_score NUMERIC(5,2) NOT NULL,
    pass_rate NUMERIC(5,2) NOT NULL,
    high_score NUMERIC(5,2) NOT NULL,
    low_score NUMERIC(5,2) NOT NULL,
    completion_rate NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (classroom_id, student_id)
);

-- =============================================
-- SECTION 10: INDEXES FOR PERFORMANCE
-- =============================================

-- user access patterns
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_active ON "user"(is_active);

-- Classroom access patterns
CREATE INDEX idx_classroom_professor ON classroom(professor_id);
CREATE INDEX idx_classroom_archived ON classroom(is_archived);
CREATE INDEX idx_classroom_code ON classroom(code);
CREATE INDEX idx_classroom_dates ON classroom(end_date);

-- Exam access patterns
CREATE INDEX idx_exam_classroom ON exam(classroom_id);
CREATE INDEX idx_exam_dates ON exam(available_from, available_to);
CREATE INDEX idx_exam_published ON exam(is_published);

-- Question access patterns
CREATE INDEX idx_question_bank ON question(question_bank_id);
CREATE INDEX idx_question_type ON question(question_type);
CREATE INDEX idx_question_required ON question(is_required);

-- Result access patterns
CREATE INDEX idx_examresult_exam ON exam_result(exam_id);
CREATE INDEX idx_examresult_student ON exam_result(student_id);
CREATE INDEX idx_examresult_score ON exam_result(percentage_score);
CREATE INDEX idx_examresult_status ON exam_result(status);

-- Statistics access patterns
CREATE INDEX idx_classroomstat_class ON classroom_stat(classroom_id);
CREATE INDEX idx_studentclassroomstat_composite ON student_classroom_stat(classroom_id, student_id);


-- =============================================
-- SECTION 11: ACTIVITY LOGS
-- =============================================

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL,
    classroom_id INT NULL,
    exam_id INT NULL,
    action VARCHAR(100) NULL,
    entity VARCHAR(100) NULL,
    description TEXT NULL, -- Human-readable summary of the user action for audit/UX
    route VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    payload JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REVERSIBLE PLAN: To remove the description column if needed:
-- ALTER TABLE activity_logs DROP COLUMN description;

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_classroom ON activity_logs(classroom_id);
CREATE INDEX idx_activity_logs_exam ON activity_logs(exam_id);
