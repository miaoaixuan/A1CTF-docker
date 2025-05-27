import { Award, Flag, Medal, Trophy } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import dayjs from "dayjs";

import ReactDOMServer from 'react-dom/server';
import { GameScoreboardData, TeamScore, UserSimpleGameChallenge } from "utils/A1API";

export function ScoreTable ({ scoreBoardModel, setShowUserDetail, challenges }: { scoreBoardModel: GameScoreboardData, setShowUserDetail: Dispatch<SetStateAction<TeamScore>>, challenges: Record<string, UserSimpleGameChallenge[]> }) {

    const tableRef = useRef<HTMLDivElement | null>(null)
    const [pageLines, setPageLines] = useState(10)
    const [challengeCount, setChallengeCount] = useState(20)

    const { theme } = useTheme() 

    const [scoreboardItems, setScoreBoardItems] = useState<TeamScore[]>([])
    const [curPageData, setCurPageData] = useState<TeamScore[]>([])
    const [curPage, setCurPage] = useState(1)
    const [totalPage, setTotalPage] = useState(0)

    const [pageDataLoaded, setPageDataLoaded] = useState(false)

    const handleChangeView = () => {
        if (tableRef.current) {
            setPageLines(Math.floor((tableRef.current!.clientHeight - 8) / 48) - 2)
        }
    }

    useEffect(() => {

        if (tableRef.current) {
            const pageLines = Math.floor((tableRef.current!.clientHeight - 8) / 48) - 2;
            setPageLines(pageLines)
        }

        setScoreBoardItems(scoreBoardModel.teams || [])
        setTotalPage(Math.ceil(scoreBoardModel.teams!.length / pageLines))

        const curPageStart = pageLines * (curPage - 1)
        const pageData: TeamScore[] = [];

        for (let i = curPageStart; i < Math.min(curPageStart + pageLines, scoreBoardModel.teams?.length || 0); i++) {
            pageData.push(scoreBoardModel.teams![i])
        }
        
        setCurPageData(pageData)

        setPageDataLoaded(true)

        window.addEventListener("resize", handleChangeView)

        return () => {
            window.removeEventListener("resize", handleChangeView)
        }
    }, [scoreBoardModel])

    useEffect(() => {
        setTotalPage(Math.ceil(scoreboardItems.length / pageLines))
        const curPageStart = pageLines * (curPage - 1)
        const pageData: TeamScore[] = [];

        for (let i = curPageStart; i < Math.min(curPageStart + pageLines, scoreboardItems.length); i++) {
            pageData.push(scoreboardItems[i])
        }
        
        setCurPageData(pageData)
    }, [scoreboardItems, curPage, pageLines])


    const getRankIcon = (rank: number) => {
        if (rank == 1) return (<Medal className="stroke-[#FFB02E]" />)
        else if (rank == 2) return (<Medal className="stroke-[#BEBEBE]" />)
        else if (rank == 3) return (<Medal className="stroke-[#D3883E]"/>)
        else return (
            <span>{ rank }</span>
        )
    }

    const rankColor = (rank: number) => {
        if (rank == 1) return "#FFB02E"
        else if (rank == 2) return "#BEBEBE"
        else if (rank == 3) return "#D3883E"
    }

    const getSolveStatus = (challenge: UserSimpleGameChallenge, target: TeamScore) => {
        if (!target) return (<></>)

        const targetChallenge = target.solved_challenges?.find((e) => e.challenge_id == challenge.challenge_id)
        

        if (targetChallenge) {

            const cardView = ReactDOMServer.renderToStaticMarkup(
                <div className="flex flex-col text-[12px]">
                    <span>{ target.team_name }</span>
                    <span>{ challenge.challenge_name }</span>
                    <span>{ dayjs(targetChallenge.solve_time).format("YYYY-MM-DD HH:mm:ss") }</span>
                    <span className="text-green-300">+ { challenge.cur_score }</span>
                </div>
            )

            if (targetChallenge.rank == 1) {
                return (
                    <span
                        data-tooltip-id="challengeTooltip"
                        data-tooltip-html={cardView}
                    >
                        <Award className="stroke-[#FFB02E]"/>
                    </span>
                )
            } else if (targetChallenge.rank == 2) {
                return (
                    <span
                        data-tooltip-id="challengeTooltip"
                        data-tooltip-html={cardView}
                    ><Award className="stroke-[#BEBEBE]"/></span>
                )
            } else if (targetChallenge.rank == 3) {
                return (
                    <span
                        data-tooltip-id="challengeTooltip"
                        data-tooltip-html={cardView}
                    ><Award className="stroke-[#D3883E]"/></span>
                )
            } else {
                return (
                    <span
                        data-tooltip-id="challengeTooltip"
                        data-tooltip-html={cardView}
                    ><Flag className="stroke-green-600"/></span>
                )
            }
        } else {
            return (<></>)
        }
    }

    // if (!pageLines) return (<></>)

    return (
        
        <div className="flex flex-col w-full h-full gap-4 pt-4">
            <div className="flex w-full flex-1 overflow-hidden">
                <div id="left-container" className="min-w-[200px] max-w-[18vw] flex-none overflow-hidden">
                    <div className="flex flex-col overflow-hidden">
                        <div className={`w-full border-b-2 h-12 border-t-2 transition-[border-color] duration-300 flex items-center justify-center`}>
                            {/* <span className="font-bold">Username</span> */}
                        </div>
                        <div className={`w-full border-b-2 h-12 transition-[border-color] duration-300 flex items-center justify-center`}>
                            <span className="font-bold">Username</span>
                        </div>
                        { curPageData[0] && curPageData.map((item, index) => (
                            <div className={`w-full border-b-2 transition-[border-color] duration-300 h-12 flex items-center justify-center pl-6 pr-6`} key={`name-${index}`}>
                                <div className="flex w-full gap-2 overflow-hidden">
                                    <div className="w-[32px] flex-none flex justify-center select-none">
                                        { getRankIcon(item.rank || 0) }
                                    </div>
                                    <div className="flex-1 overflow-hidden select-none">
                                        <a className="text-nowrap text-ellipsis overflow-hidden hover:underline focus:underline" data-tooltip-id="challengeTooltip" data-tooltip-html={ `<div class='text-sm'>${item.team_name} - ${ item.score } pts</div>` } 
                                            onClick={() => {
                                                setShowUserDetail(item || {})
                                            }}
                                        >{ item.team_name }</a>
                                    </div>
                                    <div className="justify-end gap-1 hidden lg:flex">
                                        <span>{ item.score }</span>
                                        <span className="text-gray-500">pts</span>
                                    </div>
                                </div>
                            </div>
                        )) }
                    </div>
                </div>
                <div className="flex w-full overflow-hidden">
                    <div className="w-full h-full" >
                        <MacScrollbar className="flex flex-1 h-full overflow-x-auto pb-[18px]" suppressScrollY
                            skin={ theme == "light" ? "light" : "dark" }
                        >
                            <div className="flex" ref={tableRef}>
                                { Object.keys(challenges).map((key, index) => (
                                    <div className="flex flex-col" key={`cate-${index}`} >
                                        <div className={`h-12 border-t-2 border-b-2 flex items-center justify-center flex-none ${ index != Object.keys(challenges).length - 1 ? "border-r-2" : "" }`}
                                            style={{ width: `${96 * challenges[key].length}px` }}
                                        >
                                            <span className="font-bold">{ key }</span>
                                        </div>
                                        <div className="flex">
                                            { challenges[key].map((challenge, idx1) => (
                                                <div className="flex flex-col h-full w-24 flex-shrink-0" key={`col-${idx1}`}>
                                                    <div className={`flex w-full h-12 border-b-2 transition-[border-color] duration-300 items-center justify-center flex-shrink-0 pl-2 pr-2`} >
                                                        <span className="select-none text-nowrap text-ellipsis overflow-hidden font-bold" data-tooltip-id="challengeTooltip" data-tooltip-html={ `<div class='text-sm'>${challenge.challenge_name}</div>` }>{ challenge.challenge_name }</span>
                                                    </div>
                                                    { curPageData[0] && curPageData.map((item, idx2) => (
                                                        <div className={`flex w-full h-12 border-b-2 transition-[border-color] duration-300 items-center justify-center flex-shrink-0`} key={`item-${idx2}`} >
                                                            { getSolveStatus(challenge, item) }
                                                        </div>
                                                    )) }
                                                </div>
                                            )) }
                                        </div>
                                    </div>
                                )) }
                            </div>
                        </MacScrollbar>
                    </div>
                </div>
            </div>
            <div className="flex w-full items-center justify-center gap-2 select-none">
                { totalPage > 7 ? (
                    <>
                        <Button size={"icon"} variant={ curPage == 1 ? "default" : "ghost" } onClick={() => { setCurPage(1) }} >1</Button>
                        { curPage > 3 ? (
                            <>
                                <span>…</span>
                                { curPage <= totalPage - 4 ? (
                                    <>
                                        <Button size={"icon"} variant="ghost" onClick={() => { setCurPage(curPage - 1) }}>{ curPage - 1 }</Button>
                                        <Button size={"icon"} variant="default" onClick={() => { setCurPage(curPage) }}>{ curPage }</Button>
                                        <Button size={"icon"} variant="ghost" onClick={() => { setCurPage(curPage + 1) }}>{ curPage + 1 }</Button>
                                    </>
                                ) : (
                                    <>
                                        
                                    </>
                                ) }
                            </>
                        ) : (
                            <>
                                <Button size={"icon"} variant={ curPage == 2 ? "default" : "ghost" } onClick={() => { setCurPage(2) }}>2</Button>
                                <Button size={"icon"} variant={ curPage == 3 ? "default" : "ghost" } onClick={() => { setCurPage(3) }}>3</Button>
                                <Button size={"icon"} variant={ curPage == 4 ? "default" : "ghost" } onClick={() => { setCurPage(4) }}>4</Button>
                                <Button size={"icon"} variant={ curPage == 5 ? "default" : "ghost" }onClick={() => { setCurPage(5) }}>5</Button>
                            </>
                        ) }
                        
                        { curPage <= totalPage - 4 ? (
                            <>
                                <span>…</span>
                                <Button size={"icon"} variant="ghost" onClick={() => { setCurPage(totalPage) }}>{ totalPage }</Button>
                            </>
                        ) : (
                            <>
                                <Button size={"icon"} variant={ curPage == totalPage - 4 ? "default" : "ghost"} onClick={() => { setCurPage(totalPage - 4) }}>{ totalPage - 4 }</Button>
                                <Button size={"icon"} variant={ curPage == totalPage - 3 ? "default" : "ghost"} onClick={() => { setCurPage(totalPage - 3) }}>{ totalPage - 3 }</Button>
                                <Button size={"icon"} variant={ curPage == totalPage - 2 ? "default" : "ghost"} onClick={() => { setCurPage(totalPage - 2) }}>{ totalPage - 2 }</Button>
                                <Button size={"icon"} variant={ curPage == totalPage - 1 ? "default" : "ghost"} onClick={() => { setCurPage(totalPage - 1) }}>{ totalPage - 1 }</Button>
                                <Button size={"icon"} variant={ curPage == totalPage ? "default" : "ghost"} onClick={() => { setCurPage(totalPage) }}>{ totalPage }</Button>
                            </>
                        ) }
                    </>
                ) : (
                    <>
                        { totalPage > 0 && new Array(totalPage).fill(0).map((e, index) => (
                            <Button size={"icon"} key={`pageX-${index + 1}`} variant={ curPage == index + 1 ? "default" : "ghost"} onClick={() => { setCurPage(index + 1) }}>{ index + 1 }</Button>
                        )) }
                    </>
                ) }
                
            </div>
        </div>
    )
}