import SignupPage from "components/SignupPage";
import { useParams } from "react-router";

export default function SignupPageMain() {

    const { lng } = useParams();

    if (!lng) {
        return <div>Not found</div>;
    }

    return (
        <SignupPage lng={lng} /> 
    )
}
