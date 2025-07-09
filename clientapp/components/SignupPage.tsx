import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "components/LoginForm"

import ThemeSwitcher from "components/ToggleTheme"
import { RegisterForm } from "components/RegisterForm";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { useNavigate } from "react-router";

export default function SignupPage() {

    const { clientConfig } = useGlobalVariableContext()
    const navigate = useNavigate()

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-between">
                    <div onClick={() => {
                        navigate(`/`)
                    }} className="flex items-center gap-2 font-medium">
                        <img
                            className="dark:invert"
                            src={clientConfig.SVGIcon}
                            alt={clientConfig.SVGAltData}
                            width={40}
                            height={40}
                        />
                        <span className="font-bold text-lg">A1natas SSO</span>
                    </div>
                    <ThemeSwitcher />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-[400px]">
                        <RegisterForm />
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
            </div>
        </div>
    )
}