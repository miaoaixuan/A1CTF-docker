import SignupPage from "@/components/SignupPage";


export default async function SignupPageMain({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <SignupPage lng={lng} /> 
    )
}
