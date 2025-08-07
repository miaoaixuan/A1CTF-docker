import SafeComponent from "components/SafeComponent"
import { CreateChallengeView } from "components/admin/CreateChallengeView";

export default function Home () {

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <CreateChallengeView  />
            </SafeComponent>
        </div>
    );
}