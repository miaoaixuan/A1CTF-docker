import { Cable, ContactRound, Dices, Flag, Package, Settings, User, UserRound, UsersRound } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export function AdminHeader() {

    const path = useLocation().pathname.split("/").slice(-1)[0];
    const router = useNavigate()

    const get_button_style = function(name: string) {
        return path == name ? "default" : "ghost";
    }

    const move_to_page = function(name: string) {
        if (path != name) router(`/admin/${name}`)
    }

    useEffect(() => {
        
    }, [])
    
    return (
        <header className="h-14 backdrop-blur-sm select-none flex-shrink-0">
            <div className="w-full h-full flex items-center px-4 border-b-[1px] gap-2">
                <span className="text-lg font-bold mr-4" onClick={() => move_to_page("")}>A1CTF Admin</span>
                <Button variant={get_button_style("games")} onClick={() => move_to_page("games")} className="font-bold"><Flag/>比赛管理</Button>
                <Button variant={get_button_style("challenges")} onClick={() => move_to_page("challenges")} className="font-bold"><Dices/>题目管理</Button>
                <Button variant={get_button_style("users")} onClick={() => move_to_page("users")} className="font-bold"><ContactRound/>用户管理</Button>
                {/* <Button variant={get_button_style("teams")} onClick={() => move_to_page("teams")} className="font-bold"><UsersRound/>队伍管理</Button> */}
                {/* <Button variant={get_button_style("containers")} onClick={() => move_to_page("containers")} className="font-bold"><Package/>容器管理</Button> */}
                <Button variant={get_button_style("logs")} onClick={() => move_to_page("logs")} className="font-bold"><Cable/>系统日志</Button>
                <div className="flex-1" />
                <Button variant={get_button_style("system")} onClick={() => move_to_page("system")} className="font-bold"><Settings/>系统设置</Button>
            </div>
        </header>
    )
}