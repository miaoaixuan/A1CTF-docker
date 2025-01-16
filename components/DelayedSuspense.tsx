'use client'; // 必须添加这行声明为客户端组件

import React, { useState, useEffect, Suspense } from 'react';
import { LoadingPage } from './LoadingPage';

function DelayedSuspense({ children }: { children: React.ReactNode }) {
    return (
        <>
            <LoadingPage />
            <Suspense fallback={<LoadingPage />}>
                {children}
            </Suspense>
        </>
    );
}

export default DelayedSuspense;
