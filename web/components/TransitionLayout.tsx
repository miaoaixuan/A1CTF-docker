"use client";

import React, { useEffect, useState } from "react";
import { useTransitionContext } from "@/contexts/TransitionContext";

export const TransitionLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isTransitioning } = useTransitionContext();
    const [displayChildren, setDisplayChildren] = useState(children);

    useEffect(() => {
        if (!isTransitioning) {
            setDisplayChildren(children);
        }
    }, [isTransitioning, children]);

    return (
        <div className={`transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
            {displayChildren}
        </div>
    );
};

