'use client'; // 必须添加这行声明为客户端组件

import React, { useState, useEffect, Suspense } from 'react';
import { LoadingPage } from './LoadingPage';

function DelayedSuspense({ children }: { children: React.ReactNode }) {
    const [showFallback, setShowFallback] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowFallback(false), 500); // 最小延迟时间为 500ms
        return () => clearTimeout(timer); // 清理定时器
    }, []);

    return (
        <>
            {showFallback ? (
                <div>
                    <LoadingPage />
                    {children}
                </div>
            ) : (
                <Suspense fallback={<LoadingPage />}>
                    {children}
                </Suspense>
            )}
        </>
    );
}

export default DelayedSuspense;
