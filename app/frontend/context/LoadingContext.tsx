// context/LoadingContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    loading: boolean;
    setLoading: (v: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(false);
    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error('useLoading must be inside LoadingProvider');
    return ctx;
}
