"use client";

import React, { Suspense, useState, useEffect } from 'react';

interface DelayedSuspenseProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
    delay?: number;
}

export function DelayedSuspense({ children, fallback, delay = 150 }: DelayedSuspenseProps) {
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowFallback(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <Suspense fallback={showFallback ? fallback : null}>
            {children}
        </Suspense>
    );
}