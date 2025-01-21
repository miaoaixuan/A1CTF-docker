'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { LoadingPage } from './LoadingPage';

function DelayedSuspense({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* <LoadingPage /> */}
            <Suspense fallback={<LoadingPage visible={true} />}>
                {children}
            </Suspense>
        </>
    );
}

export default DelayedSuspense;
