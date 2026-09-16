// context/AuthContext.tsx
"use client";

import { useRouter } from 'next/navigation';
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import api from '../lib/api';

interface User {
    user_id: number;
    role: 'Admin' | 'Professor' | 'TA';
    comp_tutorial_pages: string[];
    status: "Verified" | "Invited";
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const res = await api.get('/user-data');
                if (res.status !== 200) throw new Error('Failed to fetch user');
                const userData = await res.data;
                console.log("user data: ", userData);
                setUser(userData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, error, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};