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
import 'mac-scrollbar/dist/mac-scrollbar.css';

import { ClientToaster } from 'components/ClientToaster';
import { GameSwitchProvider } from 'contexts/GameSwitchContext';
import { CookiesProvider } from 'react-cookie';
import { GlobalVariableProvider } from 'contexts/GlobalVariableContext';
import { CanvasProvider } from 'contexts/CanvasProvider';
import { ThemeProvider } from "components/ThemeProvider";
import FancyBackground from 'components/modules/FancyBackground';
import { I18nextProvider } from "react-i18next";

import i18n from 'i18n';
import GameSwitchHover from "components/GameSwitchHover";

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

export function Layout({ children }: { children: React.ReactNode }) {

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
                    <I18nextProvider i18n={i18n}>
                        <CookiesProvider>
                            <GlobalVariableProvider>
                                <GameSwitchProvider>
                                    <CanvasProvider>
                                        <ClientToaster />
                                        {animationPresent && <FancyBackground />}
                                        <GameSwitchHover animation={true} />
                                        {children}
                                    </CanvasProvider>
                                </GameSwitchProvider>
                            </GlobalVariableProvider>
                        </CookiesProvider>
                    </I18nextProvider>
                </ThemeProvider>
                {/* </NextIntlClientProvider> */}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
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
    } else if (error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <html>
            <head>
                <title>0ops, we encounter an fatal errr0r.</title>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    
                    .container {
                        width: 100%;
                        @media (width >= 40rem /* 640px */) {
                            max-width: 40rem /* 640px */;
                        }
                        @media (width >= 48rem /* 768px */) {
                            max-width: 48rem /* 768px */;
                        }
                        @media (width >= 64rem /* 1024px */) {
                            max-width: 64rem /* 1024px */;
                        }
                        @media (width >= 80rem /* 1280px */) {
                            max-width: 80rem /* 1280px */;
                        }
                        @media (width >= 96rem /* 1536px */) {
                            max-width: 96rem /* 1536px */;
                        }
                    }

                    .my-button {
                        padding: 10px;
                        background-color: white;
                        border-radius: 8px;
                        border: 0;
                        padding-left: 20px;
                        padding-right: 20px;
                        font-size: 16px;
                        font-weight: 600;
                        color: black;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }

                    .my-button2 {
                        padding: 10px;
                        background-color: black;
                        border: 1.5px solid white;
                        color: white;
                        border-radius: 8px;
                        padding-left: 20px;
                        padding-right: 20px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }

                    .my-button:hover {
                        background-color: rgba(255, 255, 255, 0.8);
                    }

                    .my-button2:hover {
                        background-color: rgba(255, 255, 255, 0.2);
                    }
                    `
                }} />
            </head>
            <body style={{
                backgroundColor: "black",
                userSelect: "none",
                fontFamily: "Consolas, monospace"
            }}>
                <div
                    style={{
                        width: "100vw",
                        height: "100vh",
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        left: 0,
                        top: 0,
                        backgroundColor: "black",
                        color: "white",
                    }}
                >
                    <div className="container"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div style={{
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <span
                                style={{
                                    fontSize: "54px",
                                    fontWeight: "bold",
                                    fontFamily: "Consolas, monospace"
                                }}
                            >{message}</span>
                            <span
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    marginBottom: "20px",
                                    fontFamily: "Consolas, monospace"
                                }}
                            >We're sorry, but something went wrong.</span>
                            {stack && (
                                <pre style={{
                                    overflowX: "auto",
                                    padding: "22px",
                                    boxShadow: "5px 5px 10px rgba(255, 255, 255, 0.4)",
                                    border: "2px solid white",
                                    borderRadius: "8px",
                                    backgroundColor: "#121212",
                                }}>
                                    <code
                                        style={{
                                            fontFamily: "Consolas, monospace"
                                        }}
                                    >{stack}</code>
                                </pre>
                            )}
                        </div>
                        <div style={{
                            display: "flex",
                            gap: "20px"
                        }}>
                            <button className="my-button"
                                style={{
                                    marginTop: "16px",
                                    fontSize: "16px",
                                    fontFamily: "Consolas, monospace"
                                }}
                                onClick={() => {
                                    window.location.reload();
                                }}
                            >Refresh</button>
                            <button className="my-button2"
                                style={{
                                    marginTop: "16px",
                                    fontSize: "16px",
                                    fontFamily: "Consolas, monospace"
                                }}
                                onClick={() => {
                                    navigator.clipboard.writeText(stack || details || "No error message");
                                }}
                            >Copy the error message</button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
