import { api, BasicGameInfoModel, ProfileUserInfoModel } from "utils/GZApi";
import { AxiosError } from "axios";
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { browserName } from "react-device-detect";

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
    BGAnimation: boolean;
}

interface GlobalVariableContextType {
    curProfile: ProfileUserInfoModel;
    updateProfile: (callback?: () => void) => void;
    serialOptions: React.MutableRefObject<echarts.SeriesOption[]>;
    clientConfig: ClientConfig;
    updateClientConfg: (key: keyof ClientConfig, value: any) => void;
}

const globalVariableContext = createContext<GlobalVariableContextType | undefined>(undefined);

export const useGlobalVariableContext = () => {
    const context = useContext(globalVariableContext);
    if (!context) {
        throw new Error("useGlobalVariableContext must be used within a GlobalVariableContextProvider");
    }
    return context;
};

export const GlobalVariableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [cookies, setCookie, removeCookie] = useCookies(["uid", "clientConfig"])
    const [curProfile, setCurProfile] = useState<ProfileUserInfoModel>({})

    const defaultClientConfig: ClientConfig = {
        FancyBackGroundIconWhite: "/images/ctf_white.png",
        FancyBackGroundIconBlack: "/images/ctf_black.png",
        DefaultBGImage: "/images/defaultbg.jpg",
        SVGIcon: "/images/A1natas.svg",
        SVGAltData: "A1natas",
        TrophysGold: "/images/trophys/gold_trophy.png",
        TrophysSilver: "/images/trophys/silver_trophy.png",
        TrophysBronze: "/images/trophys/copper_trophy.png",
        SchoolLogo: "/images/zjnu_logo.png",
        SchoolSmallIcon: "/images/zjnu_small_logo.png",
        SchoolUnionAuthText: "ZJNU Union Authserver",
        BGAnimation: false
    }

    const [clientConfig, setClientConfig] = useState<ClientConfig>({} as ClientConfig)

    const updateClientConfg = (key: keyof ClientConfig, value: any) => {
        setClientConfig((prevConfig) => ({
            ...prevConfig,
            [key]: value
        }))
        setCookie("clientConfig", { ...clientConfig, [key]: value }, { path: "/" })
    }

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

        if (cookies.clientConfig) {
            setClientConfig(cookies.clientConfig)
        } else {
            const copiedConfig = { ...defaultClientConfig }
            console.log(browserName)
            if (browserName.includes("Chrome")) {
                copiedConfig.BGAnimation = true
            }
            setClientConfig(copiedConfig)
            setCookie("clientConfig", defaultClientConfig, { path: "/" })
        }
    }, [])

    return (
        <globalVariableContext.Provider value={{ curProfile, updateProfile, serialOptions, clientConfig, updateClientConfg}}>
            {children}
        </globalVariableContext.Provider>
    );
};
