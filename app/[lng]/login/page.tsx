import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/LoginForm"
import { Label } from "@radix-ui/react-dropdown-menu"

import Image from "next/image";

import ThemeSwitcher from "@/components/ToggleTheme"
import { TransitionLink } from "@/components/TransitionLink";

export default async function LoginPage({ params }: { params: Promise<{ lng: string }> }) {

    const { lng } = await params;

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
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
                        <Label className="font-bold text-lg">A1natas SSO</Label>
                    </TransitionLink>
                    <ThemeSwitcher lng={lng} />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <LoginForm lang={lng} />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src="/images/123691039_p0.jpg"
                    alt="Image"
                    width={4000}
                    height={2000}
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7] dark:grayscale"
                />
            </div>
        </div>
    )
}
