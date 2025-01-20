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
import { LoadingPage } from "@/components/LoadingPage";

import { Toaster } from "react-hot-toast"

// i18n settings
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {notFound} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {getTranslations} from 'next-intl/server';

// fonts
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

export async function generateMetadata({ params } : { params: any }) {
    const { lng } = await params
    const t = await getTranslations({lng});
    
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
    params: {lng: string};
}>) {
    const { lng } = await params;

    if (!routing.locales.includes(lng as any)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={lng} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <div>
                            <Toaster
                                // position="top-right"
                                reverseOrder={false}
                            />
                        </div>
                        <DelayedSuspense>
                            <TransitionProvider>
                                <TransitionLayout>
                                        {children}
                                </TransitionLayout>
                            </TransitionProvider>
                        </DelayedSuspense>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}