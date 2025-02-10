"use client";

import React, { useEffect, useState } from "react";
import { useTransitionContext } from "@/contexts/GameSwitchContext";

export const TransitionLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isChangingGame } = useTransitionContext();
    const [displayChildren, setDisplayChildren] = useState(children);

    useEffect(() => {
        if (!isChangingGame) {
            setDisplayChildren(children);
        }
    }, [isChangingGame, children]);

    return (
        <div>
            {displayChildren}
        </div>
    );
};

