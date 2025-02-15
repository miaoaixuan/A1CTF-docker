import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/LoginForm"

import Image from "next/image";

import ThemeSwitcher from "@/components/ToggleTheme"
import { TransitionLink } from "@/components/TransitionLink";

export default async function LoginPage() {

    return (
        <div className="grid min-h-svh lg:grid-cols-2 select-none">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-between">
                    <TransitionLink href="/" className="flex items-center gap-2 font-medium">
                        <Image
                            className="dark:invert"
                            src="/images/A1natas.svg"
                            alt="A1natas"
                            width={40}
                            height={40}
                            priority
                        />
                        <span className="font-bold text-lg">A1natas SSO</span>
                    </TransitionLink>
                    <ThemeSwitcher/>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-[400px]">
                        <LoginForm/>
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src="/images/123691039_p0.jpg"
                    alt="Image"
                    width={4000}
                    height={2000}
                    placeholder="blur"
                    blurDataURL="/images/123691039_p0.jpg"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7] dark:grayscale"
                />
            </div>
        </div>
    )
}
