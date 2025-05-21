import { MacScrollbar } from "mac-scrollbar";
import { Button } from "../ui/button";
import { CirclePlus, Copy, GalleryVerticalEnd, Pencil, Search, Squirrel, Trash, Trash2, Volleyball } from "lucide-react";
import { useTheme } from "next-themes";

import { BadgeCent, Binary, Bot, Bug, ChevronDown, ChevronUp, Chrome, CircleArrowLeft, Earth, FileSearch, Github, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useState } from "react";
import { api, ErrorMessage } from "utils/ApiHelper";
import { ChallengeCategory, AdminChallengeSimpleInfo } from "utils/A1API";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { ConfirmDialog, DialogOption } from "../dialogs/ConfirmDialog";
import { challengeCategoryColorMap, challengeCategoryIcons } from "utils/ClientAssets";
import { useNavigate } from "react-router";

export function ChallengesManageView({ lng }: { lng: string }) {

    const { theme } = useTheme()
    const router = useNavigate()

    const colorMap: { [key: string]: string } = challengeCategoryColorMap

    const cateIcon: { [key: string]: any } = challengeCategoryIcons

    const [curChoicedCategory, setCurChoicedCategory] = useState("all")
    const [challenges, setChallenges] = useState<AdminChallengeSimpleInfo[]>([])

    useEffect(() => {
        api.admin.listChallenge({ size: 100, offset: 0 }).then((res) => {
            setChallenges(res.data.data)
        })
    }, [])

    const [searchContent, setSearchContent] = useState("")
    const [dialogOption, setDialogOption] = useState<DialogOption>({
        isOpen: false,
        message: ""
    })

    const filtedData = challenges.filter((chl) => {
        if (searchContent == "") return curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory;
        else return chl.name.toLowerCase().includes(searchContent.toLowerCase()) && (curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory)
    })

    return (
        <div className="w-full h-full flex flex-col p-5 lg:p-10">
            <ConfirmDialog settings={dialogOption} setSettings={setDialogOption} />
            <div className="flex items-center justify-between mb-6 select-none">
                <div className="flex gap-4 items-center w-[50%]">
                    {/* <div className="h-[36px] border-[1px] flex items-center justify-center rounded-lg gap-2 px-3">
                        <span className="font-bold text-nowrap">{ challenges.length } challenges</span>
                    </div> */}
                    <div className="h-[36px] border-[1px] flex items-center justify-center rounded-lg gap-2 px-3">
                        <Search />
                        <span className="font-bold text-nowrap">Search in {challenges.length} challengs</span>
                    </div>
                    <Input value={searchContent} onChange={(e) => setSearchContent(e.target.value)} placeholder="在这里输入就可以搜索题目标题了"></Input>
                </div>
                <Button onClick={() => {
                    router(`/${lng}/admin/challenges/create`)
                }}>
                    <CirclePlus />
                    添加题目
                </Button>
            </div>
            <div className="w-full h-full flex overflow-hidden gap-2">
                <div className="flex flex-col w-[150px] gap-1 select-none flex-none">
                    <span className="font-bold mb-2">Categories</span>
                    {Object.keys(cateIcon).map((cat, index) => (
                        <Button key={index} className={`flex items-center justify-start gap-2 px-2 pt-[6px] pb-[6px] rounded-lg transition-colors duration-300`}
                            variant={curChoicedCategory === cat ? "default" : "ghost"}
                            onClick={() => setCurChoicedCategory(cat)}
                        >
                            {cateIcon[cat]}
                            <span className="text-md">{cat.substring(0, 1).toUpperCase() + cat.substring(1)}</span>
                            <div className="flex-1" />
                            <Badge className={`p-1 h-[20px] ${curChoicedCategory === cat ? "invert" : ""}`}>{challenges.filter((res) => (cat == "all" || res.category?.toLowerCase() == cat)).length}</Badge>
                        </Button>
                    ))}
                </div>
                {/* <div className="flex-1 overflow-hidden"> */}
                {filtedData.length ? (
                    <MacScrollbar className="overflow-y-auto w-full">
                        <div className="flex flex-col gap-4 w-full p-6 pt-2">
                            {
                                filtedData.map((chal, index) => (
                                    <div className="w-full flex border-2 shadow-lg rounded-lg p-4 px-6 flex-none justify-between items-center" key={index}>
                                        <div className="flex gap-3">
                                            {cateIcon[chal.category?.toLowerCase() || "misc"]}
                                            <span>{chal.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant={"ghost"} size={"icon"}>
                                                <Copy />
                                            </Button>
                                            <Button variant={"ghost"} size={"icon"} onClick={() => {
                                                router(`/${lng}/admin/challenges/${chal.challenge_id}`)
                                            }}>
                                                <Pencil />
                                            </Button>
                                            <Button variant={"ghost"} size={"icon"} className="hover:text-red-500" onClick={() => {
                                                setDialogOption((prev) => (
                                                    {
                                                        ...prev,
                                                        isOpen: true,
                                                        message: "你确定要删除这道题目吗?",
                                                        onConfirm: () => {
                                                            api.admin.deleteChallenge(chal.challenge_id).then(() => {
                                                                toast.success("删除成功")
                                                                setChallenges(challenges.filter((res) => res.challenge_id !== chal.challenge_id))
                                                            }).catch((error: AxiosError) => {
                                                                if (error.response?.status) {
                                                                    const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                                                                    toast.error(errorMessage.message)
                                                                } else {
                                                                    toast.error("Unknow Error")
                                                                }
                                                            })
                                                        },
                                                    }
                                                ))
                                            }}>
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </MacScrollbar>
                ) : (
                    <div className="flex w-full h-full items-center justify-center">
                        <span className="font-bold text-xl">No challenges found</span>
                    </div>
                )}
                {/* </div> */}
            </div>
        </div>
    );
}