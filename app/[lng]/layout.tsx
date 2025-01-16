// "use client";

import DelayedSuspense from '@/components/DelayedSuspense';
import { Suspense } from 'react';
import localFont from "next/font/local";
import "./globals.css";
// import { ThemeProvider } from "@/components/ThemeProvider"

import {ThemeProvider} from "next-themes";
import { TransitionProvider } from '@/contexts/TransitionContext'
import { TransitionLayout } from '@/components/TransitionLayout'


import { dir } from 'i18next'
import { languages, fallbackLng } from '../i18n/settings'
import { useTranslation } from '../i18n'
import { LoadingPage } from "@/components/LoadingPage";

const geistSans = localFont({
    src: "../fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "../fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export async function generateStaticParams() {
    return languages.map((lng) => ({ lng }))
}

export async function generateMetadata({ params } : { params: any }) {
    let { lng } = await params
    if (languages.indexOf(lng) < 0) lng = fallbackLng
    const { t } = await useTranslation(lng)
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
    params: {
        lng: string
    }
}>) {
    const { lng } = await params;

    return (
        <html lang={lng} dir={dir(lng)} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                 <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <DelayedSuspense>
                        <TransitionProvider>
                            <TransitionLayout>
                                    {children}
                            </TransitionLayout>
                        </TransitionProvider>
                    </DelayedSuspense>
                </ThemeProvider>
            </body>
        </html>
    );
}