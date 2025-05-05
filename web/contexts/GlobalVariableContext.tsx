"use client";

import { api, BasicGameInfoModel, ProfileUserInfoModel } from "@/utils/GZApi";
import { AxiosError } from "axios";
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";

interface ClientConfig {
    FancyBackGroundIconWhite: string;
    FancyBackGroundIconBlack: string;
    DefaultBGImage: string;
    SVGIcon: string;
    SVGAltData: string;
    TrophysGold: string;
    TrophysSilver: string;
    TrophysBronze: string;
    SchoolLogo: string;
    SchoolSmallIcon: string;
    SchoolUnionAuthText: string;
}

interface TransitionContextType {
    curProfile: ProfileUserInfoModel;
    updateProfile: (callback?: () => void) => void;
    serialOptions: React.MutableRefObject<echarts.SeriesOption[]>;
    clientConfig: ClientConfig;
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
    const [clientConfig, setClientConfig] = useState<ClientConfig>(
        {
            FancyBackGroundIconWhite: "/images/ctf_white.png",
            FancyBackGroundIconBlack: "/images/ctf_black.png",
            DefaultBGImage: "/images/defaultbg.jpg",
            SVGIcon: "/images/A1natas.svg",
            SVGAltData: "A1natas",
            TrophysGold: "/images/trophy/gold_trophy.png",
            TrophysSilver: "/images/trophy/silver_trophy.png",
            TrophysBronze: "/images/trophy/copper_trophy.png",
            SchoolLogo: "/images/zjnu_logo.png",
            SchoolSmallIcon: "/images/zjnu_small_logo.png",
            SchoolUnionAuthText: "ZJNU Union Authserver"
        }
    )

    const serialOptions = useRef<echarts.SeriesOption[]>([])

    const updateProfile = (callback?: () => void) => {
        api.account.accountProfile().then((res) => {
            setCurProfile(res.data)
            setCookie("uid", res.data.userId, { path: "/" })
        }).catch((error: AxiosError) => {
            removeCookie("uid")
        }).finally(() => {
            if (callback) callback()
        })
    }
    
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
        <TransitionContext.Provider value={{ curProfile, updateProfile, serialOptions, clientConfig}}>
            {children}
        </TransitionContext.Provider>
    );
};
