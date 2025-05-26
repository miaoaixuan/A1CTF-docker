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
        throw new Error("这个错误会被 ErrorBoundary 捕获！");
    }

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminHeader />
                        <Button className="bg-red-500 text-white" onClick={() => {setShouldError(true) }}>
                            <FileWarning className="w-4 h-4" />
                            Throw Error
                        </Button>
                        <div className="w-full h-full p-8 flex items-center justify-center">
                            <span className="text-3xl font-bold">Admin</span>
                        </div>
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}