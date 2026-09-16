// app/providers.tsx
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import api from '../lib/api';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { LoadingProvider, useLoading } from '@/context/LoadingContext';
import Loading from './loading';

export default function Providers({ children }: { children: ReactNode }) {
    // 1️⃣ Axios interceptor for auth token
    useEffect(() => {
        const id = api.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        return () => {
            api.interceptors.request.eject(id);
        };
    }, []);

    // 2️⃣ Toast position state
    const [toastPos, setToastPos] = useState<'top-right' | 'bottom-center'>('bottom-center');
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setToastPos(e.matches ? 'top-right' : 'bottom-center');
        };
        onChange(mq);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return (
        <LoadingProvider>
            <AuthProvider>
                {/* children (your pages) */}
                {children}

                {/* global loading spinner */}
                <GlobalLoading />

                {/* toast container */}
                <Toaster
                    position={toastPos}
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#3774E5',
                            color: '#ffffff',
                            borderRadius: '1rem',
                        },
                    }}
                />
            </AuthProvider>
        </LoadingProvider>
    );
}

function GlobalLoading() {
    const { loading } = useLoading();
    return loading ? <Loading /> : null;
}
