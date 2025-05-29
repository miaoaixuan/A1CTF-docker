import React, { createContext, useContext, useState } from "react";

interface TransitionContextType {
    isTransitioning: boolean;
    startTransition: (callback: () => void) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransitionContext = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error("useTransitionContext must be used within a TransitionProvider");
    }
    return context;
};

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTransitioning, setIsTransitioning] = useState(false);

    const startTransition = (callback: () => void) => {
        // setIsTransitioning(true);
        // setTimeout(() => {
        //     callback();
        //     setTimeout(() => {
        //         setIsTransitioning(false);
        //     }, 150);
        // }, 150);
        callback();
    };

    return (
        <TransitionContext.Provider value={{ isTransitioning, startTransition }}>
            {children}
        </TransitionContext.Provider>
    );
};

