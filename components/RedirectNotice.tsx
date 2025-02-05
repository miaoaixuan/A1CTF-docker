import { AnimatePresence, motion } from "framer-motion";
import { FileWarning } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";

export function RedirectNotice({ redirectURL, setRedirectURL } : { redirectURL: string, setRedirectURL: Dispatch<SetStateAction<string>> }) {
    return (
        <AnimatePresence>
            { redirectURL && (
                <motion.div
                    className="absolute top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center"
                    initial={{
                        backdropFilter: "blur(0px)",
                        opacity: 0
                    }}
                    animate={{
                        backdropFilter: "blur(8px)",
                        opacity: 1
                    }}
                    exit={{
                        backdropFilter: "blur(0px)",
                        opacity: 0
                    }}
                    transition={{
                        duration: 0.3
                    }}
                >
                    <div className="flex flex-col justify-center items-center gap-4">
                        <FileWarning size={60} />
                        <span className="text-xl font-bold">准备重定向到: {redirectURL}</span>
                        <span className="text-xl font-bold text-red-400">请注意检查链接是否安全合法</span>
                        <div className="flex w-full justify-center gap-4">
                            <Button variant="destructive" className="w-[90px]" onClick={() => {
                                window.open(redirectURL)
                                setRedirectURL("")
                            }}>继续跳转</Button>
                            <Button variant="ghost" className="w-[90px]" onClick={() => setRedirectURL("")}>取消</Button>
                        </div>
                    </div>
                </motion.div>
            ) }
        </AnimatePresence>
    )
}