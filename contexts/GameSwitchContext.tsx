"use client";

import { BasicGameInfoModel } from "@/utils/GZApi";
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

interface TransitionContextType {
    isChangingGame: boolean;
    curSwitchingGame: BasicGameInfoModel;
    posterData: string;
    setIsChangingGame: Dispatch<SetStateAction<boolean>>;
    setCurSwitchingGame: Dispatch<SetStateAction<BasicGameInfoModel>>;
    setPosterData: Dispatch<SetStateAction<string>>;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useGameSwitchContext = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error("useGameSwitchContext must be used within a TransitionProvider");
    }
    return context;
};

export const GameSwitchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isChangingGame, setIsChangingGame] = useState(false);
    const [curSwitchingGame, setCurSwitchingGame] = useState<BasicGameInfoModel>({
        id: 0,
        title: "error",
        summary: "none",
        poster: "#",
        limit: 0,
        start: 0,
        end: 0
    })

    const [posterData, setPosterData] = useState("")

    return (
        <TransitionContext.Provider value={{ isChangingGame, curSwitchingGame, posterData, setIsChangingGame, setCurSwitchingGame, setPosterData }}>
            {children}
        </TransitionContext.Provider>
    );
};

