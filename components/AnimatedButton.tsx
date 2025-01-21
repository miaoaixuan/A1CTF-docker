'use client';

import GameSwitchHover from "./GameSwitchHover";
import { Button } from "./ui/button";
import { useRef, useState } from "react";

export default function AnimatedButton({ children, id }: { children: React.ReactNode, id: number }) {

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // const rect = buttonRef?.current!.getBoundingClientRect();
        const x = event.clientX - 20; // 鼠标的水平位置
        const y = event.clientY - 20; // 鼠标的垂直位置

        setHoverPosition({ x, y });
    }

    return (
        <div>
            <Button ref={buttonRef} onClick={ handleClick }>
                { children }
            </Button>

            {hoverPosition && <GameSwitchHover x={hoverPosition.x} y={hoverPosition.y} id={id} />}
        </div>
    );
}
