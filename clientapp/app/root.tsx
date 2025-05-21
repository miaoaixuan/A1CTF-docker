import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import "app/css/sonner.css";

// 引入i18next相关

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { TransitionProvider } from 'contexts/TransitionContext'
import { TransitionLayout } from 'components/TransitionLayout'

import { ClientToaster } from 'components/ClientToaster';
import { GameSwitchProvider } from 'contexts/GameSwitchContext';
import { CookiesProvider } from 'react-cookie';
import { GlobalVariableProvider } from 'contexts/GlobalVariableContext';
import { Tooltip } from 'react-tooltip';
import SafeComponent from 'components/SafeComponent';
import { CanvasProvider } from 'contexts/CanvasProvider';
import { ThemeProvider } from "components/ThemeProvider";
import FancyBackground from 'components/modules/FancyBackground';
import LanguageProvider from 'components/LanguageProvider';
import { I18nextProvider } from "react-i18next";

import i18n from 'i18n';

export const links: Route.LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
    },
];

const AnimationPresent = (path: string) => {
    // if (new RegExp(/\/games\/\d+/).test(path)) {
    //     return false;
    // }
    if (new RegExp(/\/admin/).test(path)) {
        return false;
    }
    if (new RegExp(/\/login/).test(path)) {
        return false;
    }
    if (new RegExp(/\/signup/).test(path)) {
        return false;
    }
    return true;
}

export default function Layout({ children }: { children: React.ReactNode }) {

    const href = useLocation().pathname
    const animationPresent = AnimationPresent(href)

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {/* <NextIntlClientProvider messages={messages}> */}
                <ThemeProvider
                    attribute="class"
                    enableSystem
                >
                    <TransitionProvider>
                        <I18nextProvider i18n={i18n}>
                            {/* <LanguageProvider> */}
                                <CookiesProvider>
                                    <GlobalVariableProvider>
                                        <GameSwitchProvider>
                                            <CanvasProvider>
                                                <ClientToaster />
                                                {animationPresent && <FancyBackground />}
                                                {children}
                                                <Outlet />
                                            </CanvasProvider>
                                        </GameSwitchProvider>
                                    </GlobalVariableProvider>
                                </CookiesProvider>
                            {/* </LanguageProvider> */}
                        </I18nextProvider>
                    </TransitionProvider>
                </ThemeProvider>
                {/* </NextIntlClientProvider> */}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
