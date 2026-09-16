'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ExamService from '@/services/exam';
import { Exam } from '@/services/exam';

interface ExamLayoutProps {
    children: ReactNode;
}

export default function ExamLayout({ children }: ExamLayoutProps) {
    const router = useRouter();
    const { exam_id } = useParams();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // wrap in an async fn so we can await
        async function validate() {
            const res = await ExamService.getExamById(Number(exam_id));
            console.log(res);
            if ((res as Exam).exam_id) {
                setChecking(false);
            } else {
                router.replace('/404');
            }
        }
        validate();
    }, [exam_id, router]);

    // don’t show the inner pages until we know this classroom is valid
    if (checking) {
        return null;              // or <Loading /> if you prefer
    }

    return <>{children}</>;
}
