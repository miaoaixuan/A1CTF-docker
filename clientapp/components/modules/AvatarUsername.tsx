import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Skeleton } from "components/ui/skeleton";

export default function AvatarUsername({
    avatar_url, username
} : {
    avatar_url: string | null | undefined,
    username: string
}) {
    return (
        <Avatar className="select-none w-[35px] h-[35px]">
            { avatar_url ? (
                <>
                    <AvatarImage src={avatar_url || "#"} alt="@shadcn"
                        className={`rounded-2xl`}
                    />
                    <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                </>
            ) : ( 
                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                    <span className='text-background text-md'> { username.substring(0, 2) } </span>
                </div>
            ) }
        </Avatar>
    )
}