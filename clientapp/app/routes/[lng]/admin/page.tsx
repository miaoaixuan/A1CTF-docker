import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";
import { EditChallengePage } from "components/admin/EditChallengePage";
import { Button } from "components/ui/button";
import { FileWarning } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

export default function Home () {

    const [shouldError, setShouldError] = useState(false);

    if (shouldError) {
        throw new Error("Error！");
    }

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminHeader />
                        <div className="w-full h-full p-8 flex flex-col items-center justify-center gap-2">
                            <span className="text-5xl font-bold">Welcome admin!</span>
                            {/* <Button className="bg-red-500 text-white" onClick={() => {setShouldError(true) }}>
                                <FileWarning className="w-4 h-4" />
                                Throw Error
                            </Button> */}
                        </div>
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}