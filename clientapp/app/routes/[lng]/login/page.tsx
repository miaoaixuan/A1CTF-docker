import LoginPage from "components/LoginPage";
import { useParams } from "react-router";

export default function LoginPageMain() {

    const { lng } =  useParams();

    if (!lng) {
        return <div>No language provided</div>;
    }

    return (
        <LoginPage lng={lng} />
    )
}
