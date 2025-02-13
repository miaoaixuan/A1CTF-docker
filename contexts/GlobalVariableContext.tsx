"use client";

import api, { BasicGameInfoModel, ProfileUserInfoModel } from "@/utils/GZApi";
import { AxiosError } from "axios";
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

interface TransitionContextType {
    curProfile: ProfileUserInfoModel
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useGlobalVariableContext = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error("useGlobalVariableContext must be used within a TransitionProvider");
    }
    return context;
};

export const GlobalVariableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])
    const [curProfile, setCurProfile] = useState<ProfileUserInfoModel>({})
    
    useEffect(() => {
        if (!curProfile.userId) {
            api.account.accountProfile().then((res) => {
                setCurProfile(res.data)
                setCookie("uid", res.data.userId, { path: "/" })
            }).catch((error: AxiosError) => {
                removeCookie("uid")
            })
        }
    }, [])

    return (
        <TransitionContext.Provider value={{ curProfile }}>
            {children}
        </TransitionContext.Provider>
    );
};

