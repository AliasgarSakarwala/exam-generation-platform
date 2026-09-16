// service/question_bank.ts

import api from '../lib/api'
import { saveActivity } from './activity';

interface RawOption {
    question_option_id: number
    question_id: number
    option_letter: string    // "A"–"F"
    option_text: string
    is_correct: boolean
    created_at: string
    updated_at?: string
}

interface RawQuestion {
    question_id: number
    question_bank_id: number
    question_text: string
    question_type: string
    difficulty_level: number    // 1,2,3
    tags: string[]             // Array of tag strings
    created_at: string
    updated_at?: string
    options: RawOption[]
}

interface RawQuestionPreview {
    question_id: number
    question_bank_id: number
    question_text: string
    question_type: string
    difficulty_level: number
    tags: string[]             // Array of tag strings
}

interface RawBank {
    question_bank_id: number
    name: string
    description: string
    user_id: number
    created_at: string
    updated_at: string
    questions?: RawQuestion[]
}

// ——— The shape you actually want to feed your UI ———

export interface PostedQuestion {
    ID: string       // note: string to match your POST
    Question: string
    'Option 1': string
    'Option 2': string
    'Option 3': string
    'Option 4': string
    'Option 5': string
    'Option 6': string
    Answer: string
    Difficulty: string       // "Easy"|"Medium"|"Hard"
    'Tag 1'?: string
    'Tag 2'?: string
    'Tag 3'?: string
    'Tag 4'?: string
    'Tag 5'?: string
}

export interface PostedQuestionPreview {
    question_bank_id: number;
    description: string;
    created_at: string;
    name: string;
    user_id: number;
    updated_at: string;
    questions_count: number;
    [key: string]: number | string | PreviewTable[];
}

export interface PreviewTable {
    ID: string
    Question: string
    Difficulty: string
    Tags?: string[]
}

interface RawBankPreview {
    question_bank_id: number
    name: string
    description: string
    user_id: number
    created_at: string
    updated_at: string
    questions_count: number         // from withCount('questions')
    questions?: RawQuestionPreview[]  // limited to first 3 by your controller
}

export type QuestionBanksPayload = Record<string, any>

export async function createQuestionBank(data: any, classroom_id: number): Promise<{ status: number; data: any }> {
    const res = await api.post(`/classrooms/${classroom_id}/question-banks`, data)
    await saveActivity({
      route: `/classrooms/${classroom_id}/question-banks`,
      method: 'POST',
      status_code: res.status,
      payload: data,
      action: 'Create',
      entity: 'QuestionBank',
      classroom_id: classroom_id,
      description: `CREATE-QUESTION-BANK-${data.name}`
    });
    return { status: res.status, data: res.data }
}

export async function listQuestionBanks(classroom_id: number): Promise<{ status: number, data: QuestionBanksPayload }> {
    const res = await api.get<RawBankPreview[]>(`/classrooms/${classroom_id}/question-banks`)

    const diffMap: Record<number, string> = {
        1: 'Easy',
        2: 'Medium',
        3: 'Hard',
    }

    const payload: QuestionBanksPayload[] = []

    res.data.forEach((bank) => {
        // map each preview Question → PostedQuestion
        const arr: any[] = bank.questions!.map((q, index) => {
            return {
                ID: (index + 1).toString(),
                dbID: q.question_id,
                Question: q.question_text,
                Difficulty: diffMap[q.difficulty_level] || 'Unknown',
                Tags: q.tags || []
            }
        })

        delete bank.questions;
        payload.push({ ...bank, [bank.name]: arr })
    })

    return { status: res.status, data: payload }
}

export async function getQuestionBankByID(id: number, classroom_id: number): Promise<{ status: number; data: any }> {
    const res = await api.get<RawBank>(`/classrooms/${classroom_id}/question-banks/${id}`)
    const raw = res.data

    const diffMap: Record<number, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }

    const posted: PostedQuestion[] = raw.questions!.map((q, index) => {
        const opts: Partial<PostedQuestion> = {}
        for (let i = 1; i <= 6; i++) {
            const letter = String.fromCharCode(64 + i)
            const found = q.options.find((o) => o.option_letter === letter)
            opts[`Option ${i}` as keyof PostedQuestion] = (found?.option_text || ' ') as any
        }

        // Process tags (0-5 tags)
        const tagFields: Partial<PostedQuestion> = {}
        q.tags?.forEach((tag, i) => {
            if (i < 5) { // Only up to 5 tags
                tagFields[`Tag ${i + 1}` as keyof PostedQuestion] = tag
            }
        })

        const correct = q.options.find((o) => o.is_correct)?.option_text || ''
        return {
            ID: (index + 1).toString(),
            dbID: q.question_id,
            Question: q.question_text,
            ...opts,
            ...tagFields,
            Answer: correct,
            Difficulty: diffMap[q.difficulty_level] || 'Unknown',
        } as PostedQuestion
    })

    delete raw.questions;
    const resp = { ...raw, questions: posted }

    return {
        status: res.status,
        data: resp
    }
}

export async function deleteQuestionBank(id: number, classroom_id: number): Promise<{ status: number; data: any }> {
    const res = await api.delete(`/classrooms/${classroom_id}/question-banks/${id}`)
    await saveActivity({
      route: `/classrooms/${classroom_id}/question-banks/${id}`,
      method: 'DELETE',
      status_code: res.status,
      action: 'Delete',
      entity: 'QuestionBank',
      classroom_id: classroom_id,
      payload: { question_bank_id: id },
      description: `DELETE-QUESTION-BANK-ID-${id}`
    });
    return { status: res.status, data: res.data }
}

export async function updateQuestionBank(id: number, classroom_id: number, data: any): Promise<{ status: number; data: any }> {
    const res = await api.patch(`/classrooms/${classroom_id}/question-banks/${id}`, data)
    await saveActivity({
      route: `/classrooms/${classroom_id}/question-banks/${id}`,
      method: 'PATCH',
      status_code: res.status,
      payload: data,
      action: 'Update',
      entity: 'QuestionBank',
      classroom_id: classroom_id,
      description: `UPDATE-QUESTION-BANK-${data.name || `ID-${id}`}`
    });
    return { status: res.status, data: res.data }
}
