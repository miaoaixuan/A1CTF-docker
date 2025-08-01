import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "components/LoginForm"

import ThemeSwitcher from "components/ToggleTheme"
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

export default function LoginPage() {


    const { clientConfig, getSystemLogo } = useGlobalVariableContext()

    return (
        <div className="grid min-h-svh lg:grid-cols-2 select-none">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex gap-2 justify-between">
                    <a href="/" className="flex items-center gap-2 font-medium">
                        <img
                            src={getSystemLogo()}
                            alt={clientConfig.SVGAltData}
                            width={40}
                            height={40}
                        />
                        <span className="font-bold text-lg">{ clientConfig.systemName } SSO</span>
                    </a>
                    <ThemeSwitcher />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-[400px]">
                        <LoginForm />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <img
                    src={clientConfig.DefaultBGImage}
                    alt="Image"
                    width={4000}
                    height={2000}
                    className="absolute inset-0 h-full w-full object-cover"
                />
                { /* dark:brightness-[0.7] dark:grayscale */ }
            </div>
        </div>
    )
}