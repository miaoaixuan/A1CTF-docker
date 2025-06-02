import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Skeleton } from "components/ui/skeleton";

export default function AvatarUsername({
    avatar_url, username, size = 35, fontSize = 16
} : {
    avatar_url: string | null | undefined,
    username: string,
    size?: number,
    fontSize?: number
}) {
    return (
        <Avatar className="select-none flex-shrink-0"
            style={{ width: size, height: size }}
        >
            { avatar_url ? (
                <>
                    <AvatarImage src={avatar_url || "#"} alt="@shadcn"
                        className={`rounded-2xl`}
                    />
                    <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                </>
            ) : ( 
                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                    <span className='text-background' style={{ fontSize: fontSize }}> { username.substring(0, 2) } </span>
                </div>
            ) }
        </Avatar>
    )
}