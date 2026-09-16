# Capstone Team Charter Development Guide

## Purpose of the Team Charter
- The team charter is a foundational document that sets clear expectations for how your team will operate throughout the capstone project. It defines your shared goals, norms, and working agreements. A well-crafted charter promotes alignment, accountability, and collaboration—critical to your success over two terms.
---

## THE TEAM CHARTER

### 1. Team Name and Members
- **Team name:** *THE CT3*

- **Full names and student numbers of all members & Roles**:

    | Name               | Student Number | Role | Logs Link |
    |--------------------|----------------|------|-----------|
    | Ali Afoud          | 34031898       | - Back End   | [Ali's Logs](../weekly%20logs/Ali_logs/) |
    | Sahil Chawla       | 86751112       | - Back End   | [Sahil's Logs](../weekly%20logs/Sahil_logs/) |
    | Christian Eziekwu  | 38425443              | - Back End  | [Christian's Logs](../weekly%20logs/Christian_logs/) |
    | Samyak Jain        | 91182204       | - Front End   | [Samyak's Logs](../weekly%20logs/Samyak_logs/) |
    | Cooper Ross        | 29366861       | - Front End  | [Cooper's Logs](../weekly%20logs/Cooper_logs/) |
    | Aliasgar Sakarwala | 74608282              | - Front End  | [Aliasgar's Logs](../weekly%20logs/Aliasgar_logs/) |
    | Arjun Sampat       | 58816430       | - Front End  | [Arjun's Logs](../weekly%20logs/Arjun_logs/) |

<br>

### 2. Mission Statement / Project Goal

#### A concise description of the project and its intended purpose:
- **Goal:**
    To develop a web application that enables professors to:
     - **Generate multiple exam versions** with minimized similarity in correct answer sequences.
     - **Grade student responses** efficiently (via optical mark recognition or bulk uploads).
     - **Analyze exam performance** through interactive visualizations (grade distributions, question difficulty, scalability, and more).

- **Why it matters and what problem it aims to solve:**
    This system streamlines exam creation for professors while delivering key benefits:
     - **Enhanced Cheating Prevention:** Minimized answer pattern similarity across exam versions.
     - **Time-Saving Automation:** Generates exams and grades responses with minimal manual effort.
     - **Data-Driven Teaching:** Clear visualizations highlight student performance trends and knowledge gaps.
     - **Organized Question & Exam Storage:** Centralized database for easy reuse and historical analysis.
    By replacing tedious manual processes with automation and analytics, educators can focus on teaching and not administrative overhead.

- **Problem Solved:**
    Manual exam generation is a time-consuming, tedious process that diverts professors from meaningful teaching tasks. As class sizes grow and academic demands increase, so does the complexity of **Preventing cheating, Analyzing student performance, and Maintaining consistency while managing limited time and resources.
    <br>
    Our Exam Generator & Analysis App eliminates this administrative burden by 
    - Automating exam creation by Generate multiple, cheat-resistant versions in seconds.
    - Simplifying performance insights by Interactive analytics spotlight student strengths/weaknesses instantly.
    - Freeing up time by Reducing manual work so educators can focus on what matters: teaching.

<br><br>

### 3. Team Goals
- **Academic goals** 
     - Achieving a 90+ (A+) in the course grade
     - Master Docker containerization and real-world use cases
     - Build DevOps competencies (CI/CD, cloud deployment, monitoring)
     - Learn Advance backend development skills and processes understanding
     - Develop database architecture and optimization skills
     - Strengthen project management abilities 
     - Improve technical visioning and requirement scoping
     
- **Collaboration goals:** 
    - Maintian constant communication and feedback between teammates
    - Maintain biweekly meetings for feedback and retrospective
    - Stay on schedule and ahead of schedule when possible
    - Create new friendships and Colleagues
    - Resolve all PRs within 24hours

- **Deliverables and milestones**
    - ***PHASE 1:***
         - Complete project Planning 
         - Complete primary Project Design and Vision
         - Have initial development set up Ready to go

    - ***PHASE 2:***
        - Complete Project Design 
        - Have an intial figma prototype to know what to go for
        - Complete intial Docker setup
        - Complete CI pipeline setup
    
    - ***PHASE 3:*** 
        - Developing primary seed Database of Users(Professors)
        - Setting up Initial seed Database
        - Develop UI of intial dashboard in front-end
        - Develop UI of intial Login and Registration page in front-end

    - ***Phase 4:***
        - Reaserch Algorithms to optimize permutation logic of exam versions
        - Reaserch Fuctions to optimize max Cap of allowed exam version
        - Developing Login and registration Functionlity and logic
        - Develop logic for creating classrooms, and Classroom UI
    
    - ***PHASE 5:***
        - Create Exam generation window UI
        - Set up logic for import and export of documents (csv, excel, pdf)
        - Set up Authentication and security measure for log-in

    - ***PHASE 6:***
        - Set up Exam cap restriction logic
        - Set up algoritm for optimized MCQ permutation throughout different versions
        - Set up Database of exam files
        - Create UI for Student analytics window

     - ***PHASE 7:***
        - Set up import of CSV file for studnet answer
        - Develop parsing for student answer CSV
        - Grading logic dev
        - Develop Analytics tool for student grades scale and exam performance
        - Implement visual graph and tools for better understanding analytics

    - ***PHASE 8:***
        - Admin UI set up
        - Admin permission and functionality set up 
    
    *In every phase we create test of next phase objectives*

    <br><br>    
### 4. Roles and Responsibilities

- **Team Roles and Responsibilities**
    #### **Technical Roles**

    | Role                | Team Member(s)                              | Key Responsibilities |
    |---------------------|---------------------------------------------|----------------------|
    | **Project Lead**    | Ali Afoud                                   | Oversees timelines, coordinates teams, ensures goal alignment |
    | **Backend Lead**    | Sahil Chawla                                | Database architecture, API development, performance optimization |
    | **Backend Dev**     | Ali Afoud, Christian Eziekwu, Sahil Chawla, Samyak Jain | Implement backend functionality, support API development |
    | **Frontend Lead**   | Samyak Jain                                 | Leads UI development, ensures design implementation |
    | **Frontend Dev**    | Aliasgar Sakarwala, Samyak Jain, Arjun Sampat, Cooper Ross | Build responsive interfaces, integrate visualization tools |
    | **DevOps Lead**     | Arjun Sampat                                | Containerization, cloud deployment, CI/CD pipeline management |
    | **DevOps Support**  | Ali Afoud, Arjun Sampat, Christian Eziekwu  | Assist with infrastructure, deployment, and monitoring |
    | **QA/Testing**      | Aliasgar Sakarwala, Cooper Ross             | Conduct testing, identify bugs, ensure software quality |



    #### **Organizational Roles:**

    | Role                          | Team Member(s)      | Key Responsibilities |
    |-------------------------------|---------------------|----------------------|
    | **Documentation Lead**        | Ali Afoud , Cooper Ross         | Maintain technical docs, create user manuals |
    | **UI/UX Designer**            | Aliasgar Sakarwala  | Design interfaces, conduct usability testing |
    | **Security & Compliance**     | Arjun Sampat        | Implement security measures, ensure data privacy compliance |
    | **Data & Algorithm Analyst**  | Christian Eziekwu   | Develop exam versioning logic, analyze performance metrics |

***Note on Role Evolution:***  
Team roles and responsibilities outlined in this document are subject to change based on:  

- Project requirements and scope adjustments  
- Team member availability and skill development  
- Evolving technical needs during development  
- Feedback from stakeholders and testing phases  

**Guidelines for Adaptability:**  
1. Role adjustments will be communicated during weekly standups  
2. Temporary role sharing may occur during critical phases  
3. All members are encouraged to develop cross-functional skills  
4. Major responsibility shifts require team consensus  

<br><br>

### 5. Working Norms and Expectations

#### **Communication**
- **Primary Tool:** Discord (for all team discussions)  
- **Urgent Matters:** Direct messaging (DM) + @mention in relevant channel  
- **Response Expectations:**  
  - Non-urgent: Within 24 hours  
  - Urgent (@mention): Within 2 hours  

#### **Meetings**
- **Weekly Cadence:**  
  1. **Kickoff Meeting** (Monday):  
     - Review weekly goals  
     - Assign priority tasks  
  2. **Retrospective Meeting** (Friday):  
     - Progress check  
     - Blockers discussion  
     - Plan adjustments  
- **Format:** 30-45 mins max, agenda shared in advance  

#### **Git Workflow**
- **Branching Model:** Hybrid feature branching  
```
master (prod-ready) ← dev1 (staging) ← [feature branches]
                        │
                        ├── frontend/feature-name
                        ├── backend/feature-name
                        ├── planning/docs-updates
                        └── logs/debug-fixes
```
- **Conventions:**  
- Branch names: `kebab-case` (e.g., `frontend/auth-page`)  
- Merging:  
  - Feature branches → `dev1` after code review  
  - `dev1` → `master` only for releases  


#### **Task Management**  
- **Tool:** GitHub Projects (Kanban-style)  
- **Structure:**  
- Separate project boards per phase (e.g., "Phase 1: Auth Setup")  
- Columns: `To Do` → `In Progress` → `Review` → `Done`  
- **Issue Guidelines:**  
- Label by priority (`P0`, `P1`, `P2`)  
- Assign to specific owners  
 

#### **Additional Norms**  
- **Code Reviews:** Required before merging to `dev1`  
- **Documentation Updates:** Concurrent with feature completion  
- **Conflict Resolution:** Escalate to Project Lead if unresolved after 24h 

<br><br>

### 6. Conflict Resolution Plan
#### Disagreement Protocol

1. **Direct Discussion**  
   - Involved parties attempt to resolve privately within 24 hours
   - Expected to use Discord DMs or voice chat

2. **Project Lead Mediation**  
   - If unresolved after 24h, Project Lead arranges mediation session
   - Goal: Identify compromise with written agreement

3. **Team Intervention**  
   - Issue presented anonymously at next team meeting
   - Team votes on resolution (majority rules)

4. **Instructor Escalation**  
   - Required if:
     - Conflict affects project timeline
     - Behavior violates code of conduct
     - Conflict doesn't cease after intervention

#### Underperformance Protocol

**Response Timeline**
| Duration | Action |
|----------|--------|
| <24h-48h inactive | Teammates check in via DM |
| 72h inactive | Project Lead issues formal warning |
| 72h inactive | Tasks reassigned |
| 1 week inactive | Instructor notified |

### Support Process
- **First Occurrence**  
  Team offers:
  - Pair programming
  - Deadline extension
  - Task simplification
  - personal help and support if necessary

- **Recurring Issues**  
  Documented for peer evaluation with:
  - Screenshots of missed commitments
  - List of reallocated tasks

**Documentation Requirements in event of escalation**
All incidents require:
- Date/timestamp
- Platform (Discord/email/etc)
- Summary of issue
- Proposed solutions

<br><bt>

### 7. Decision-Making Process
We use a **modified consensus** approach:
1. **Discussion Phase**  
   - All members present opinions during scheduled meetings  
   - Minimum 5-minute debate per major decision  
   - Project Lead ensures all voices are heard  

2. **Voting Mechanism**  
   | Scenario | Process |  
   |----------|---------|  
   | Routine decisions | Simple majority (4/7 votes) |  
   | Technical disputes | Relevant domain lead casts deciding vote (Backend/Frontend/DevOps) |  
   | Tied votes (absentees) | Coin flip | 

<br><br>

### 8. Accountability and Commitment
#### Basic Expectations
- **Attend** all classes and scheduled meetings  
- **Communicate** absences in advance (except emergencies)  
- **Complete** assigned tasks by deadlines  
- **Be active** in discusiion and chat
- Keep constant communication with team
- **Write good, detailed and comprehensive PRs**

**What Happens If Someone Fails to Meet Expectations?** Follow protocol from section ***6***

<br><br>

### 9. Review and Revision
#### Charter Review Schedule
- **Trigger Points**:
  - Before starting each new project phase
  - After completing major milestones
  - When significant scope changes occur

#### Responsibilities
| Role | Task |
|------|------|
| Project Lead | Updates document and shares changes |
| All Members | Review and approve revisions |
| DevOps Lead | Maintains version history in github |

#### Change Process
1. Proposed edits discussed in team meeting
2. Majority vote required for approval
3. Updated charter committed to `docs/` folder

<br><br>

### 10. Agreement
- **Signatures or typed names of all team members confirming agreement.  The document needs to be reviewed and merged with a PR and each team member *MUST* review as part of the signoff process.**

---
