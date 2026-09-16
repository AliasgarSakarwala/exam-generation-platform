'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClassroomById } from '@/services/classroom';

interface CourseLayoutProps {
    children: ReactNode;
}

export default function CourseLayout({ children }: CourseLayoutProps) {
    const router = useRouter();
    const { course_id } = useParams();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // wrap in an async fn so we can await
        async function validate() {
            const res = await getClassroomById(Number(course_id));
            if (res.status === 200) {
                setChecking(false);
            } else {
                // client‐side redirect to your 404
                router.replace('/404');
            }
        }
        validate();
    }, [course_id, router]);

    // don’t show the inner pages until we know this classroom is valid
    if (checking) {
        return null;              // or <Loading /> if you prefer
    }

    return <>{children}</>;
}
