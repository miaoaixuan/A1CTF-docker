import { Loader2, LoaderPinwheel } from "lucide-react";
import { LoadingPage } from "./LoadingPage";

export default function HydrateFallbackPage() {
    return (
        <div className={`w-screen h-screen select-none flex justify-center items-center z-50 absolute bg-background transition-opacity duration-300 ease-in-out overflow-hidden opacity-100`}>
            <div className="flex">
                <Loader2 className="animate-spin" />
                <span className="font-bold ml-3">Page Loading...</span>
            </div>
        </div>
    )
}