import { Button } from "components/ui/button"
import { Captions, TriangleAlert } from "lucide-react"
import { useState } from "react"

export function GameEventModule() {

    const [curChoicedType, setCurChoicedType] = useState<string>("submissions")

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between select-none">
                <span className="font-bold text-2xl">比赛事件</span>
                <div className="flex items-center overflow-hidden rounded-3xl border-2">
                    <Button 
                        variant={`${curChoicedType === "submissions" ? "default" : "ghost"}`}
                        onClick={() => setCurChoicedType("submissions")}
                        className="rounded-none rounded-l-3xl"
                    >
                        <Captions />
                        提交记录
                    </Button>
                    <Button 
                        variant={`${curChoicedType === "cheats" ? "default" : "ghost"}`} 
                        onClick={() => setCurChoicedType("cheats")}
                        className="rounded-none rounded-r-3xl"
                    >
                        <TriangleAlert />
                        异常记录
                    </Button>
                </div>
            </div>
        </div>
    )
}