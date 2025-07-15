import { Upload } from "lucide-react";
import { useRef } from "react";

export default function ImageUploader(
    { src, onChange, backgroundTheme = "light" } : { 
        src: string, 
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
        backgroundTheme?: "light" | "dark"
    }
) {

    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={`w-28 border-2 mt-2 aspect-square rounded-xl group relative overflow-hidden ${backgroundTheme == "light" ? "bg-white" : "bg-black"}`}
            onClick={() => {
                fileInputRef.current?.click();
            }}
        >
            {src && (
                <img src={src} alt="比赛图标" className='w-full h-full object-cover' />
            )}
            <div className={`w-full h-full absolute top-0 left-0 opacity-0 group-hover:opacity-80 bg-white transition-opacity duration-300 flex items-center justify-center`}>
                <Upload size={48} />
            </div>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onChange}
            />
        </div>
    )
}