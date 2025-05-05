"use client";

import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/LoginForm"

import Image from "next/image";

import ThemeSwitcher from "@/components/ToggleTheme"
import { TransitionLink } from "@/components/TransitionLink";
import { RegisterForm } from "@/components/RegisterForm";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";

export default function SignupPage({ lng } : { lng: string }) {

    const { clientConfig } = useGlobalVariableContext()

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-between">
                    <TransitionLink href="/" className="flex items-center gap-2 font-medium">
                        <Image
                            className="dark:invert"
                            src={clientConfig.SVGIcon}
                            alt={clientConfig.SVGAltData}
                            width={40}
                            height={40}
                            priority
                        />
                        <span className="font-bold text-lg">A1natas SSO</span>
                    </TransitionLink>
                    <ThemeSwitcher lng={lng} />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-[400px]">
                        <RegisterForm lng={lng} />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src={clientConfig.DefaultBGImage}
                    alt="Image"
                    width={4000}
                    height={2000}
                    placeholder="blur"
                    blurDataURL={clientConfig.DefaultBGImage}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>
        </div>
    )
}