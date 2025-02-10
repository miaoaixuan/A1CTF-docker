// "use client";

import DelayedSuspense from '@/components/DelayedSuspense';
import { Suspense } from 'react';
import localFont from "next/font/local";

import "./globals.css";
import '@xterm/xterm/css/xterm.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
// import { ThemeProvider } from "@/components/ThemeProvider"

import { ThemeProvider, useTheme } from "next-themes";
import { TransitionProvider } from '@/contexts/TransitionContext'
import { TransitionLayout } from '@/components/TransitionLayout'

import { dir } from 'i18next'
import { LoadingPage } from "@/components/LoadingPage";

import { Toaster } from 'sonner'

// i18n settings
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ClientToaster } from '@/components/ClientToaster';
import { GameSwitchProvider } from '@/contexts/GameSwitchContext';

// fonts

export async function generateMetadata({ params }: { params: any }) {
    const { lng } = await params
    const t = await getTranslations({ lng });

    return {
        title: t('title'),
        content: 'A1CTF for A1natas'
    }
}

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode,
    params: { lng: string };
}>) {
    const { lng } = await params;

    if (!routing.locales.includes(lng as any)) {
        redirect("/zh/404")
    }

    const messages = await getMessages();

    return (
        <html lang={lng} suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />
            </head>
            <body
                className={`antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <DelayedSuspense>
                            <TransitionProvider>
                                <TransitionLayout>
                                    <GameSwitchProvider>
                                        {children}
                                    </GameSwitchProvider>
                                    <ClientToaster/>
                                </TransitionLayout>
                            </TransitionProvider>
                        </DelayedSuspense>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}