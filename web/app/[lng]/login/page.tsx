import LoginPage from "@/components/LoginPage";

export default async function LoginPageMain({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <LoginPage lng={lng} />
    )
}
