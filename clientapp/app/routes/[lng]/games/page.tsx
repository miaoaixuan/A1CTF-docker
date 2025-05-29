import PageHeader from "components/A1Headers"
import { ChangeGames } from "components/ChangeGames";
import FancyBackground from "components/modules/FancyBackground";
import SafeComponent from "components/SafeComponent";
import { Button } from "components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { re } from "mathjs";

export default function Games() {

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader />
            <div className="w-full flex-1 overflow-hidden"> 
                <SafeComponent animation={false}>
                    <>
                        {/* <FancyBackground /> */}
                        <ChangeGames />
                    </>
                </SafeComponent>
            </div>
        </div>
    );
}
