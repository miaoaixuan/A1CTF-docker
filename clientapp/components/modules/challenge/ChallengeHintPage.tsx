import { MacScrollbar } from "mac-scrollbar";
import ChallengeHintCard from "./ChallengeHintCard";
import { useTheme } from "next-themes";
import { randomInt } from "mathjs";
import SafeComponent from "components/SafeComponent";
import dayjs from "dayjs";
import { UserDetailGameChallenge } from "utils/A1API";
import { Dispatch, SetStateAction } from "react";
import { Button } from "components/ui/button";
import { X } from "lucide-react";
import {
    animated,
    useTransition,
} from '@react-spring/web'

export default function ChallengeHintPage(
    {
        curChallenge,
        visible,
        setVisible
    }: {
        curChallenge: UserDetailGameChallenge | undefined,
        visible: boolean,
        setVisible: Dispatch<SetStateAction<boolean>>
    }
) {

    const { theme } = useTheme()

    function generateRandomString(regex: RegExp, length: number): string {
        let result = '';
        const validChars = [];

        // 根据正则表达式找到字符集
        for (let i = 0; i < 256; i++) {
            const char = String.fromCharCode(i);
            if (regex.test(char)) {
                validChars.push(char);
            }
        }

        // 生成随机字符串
        while (result.length < length) {
            const randomIndex = Math.floor(Math.random() * validChars.length);
            result += validChars[randomIndex];
        }

        return result;
    }

    const transitions = useTransition(visible, {
        from: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transform: 'translateY(40px)'
        },
        enter: {
            opacity: 1,
            backdropFilter: 'blur(8px)',
            transform: 'translateY(0)'
        },
        leave: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transform: 'translateY(40px)'
        },
        config: { tension: 220, friction: 20 }
    });

    if (!visible) {
        return <></>
    }

    return (
        <SafeComponent animation={false}>
            {transitions((style, item) =>
                item && (
                    <div>
                        <animated.div className="absolute top-0 left-0 w-screen h-screen z-30" 
                            style={{
                                opacity: style.opacity,
                                backdropFilter: style.backdropFilter
                            }}
                        />
                        <animated.div className="absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-30 overflow-hidden"
                            style={{
                                opacity: style.opacity,
                                // transform: style.transform
                            }}
                        >
                            <MacScrollbar
                                className="w-full h-full overflow-auto flex flex-col"
                                skin={theme == "light" ? "light" : "dark"}
                            >
                                <div className="w-full p-10 pb-0 mb-8 flex items-center">
                                    <span className="font-bold text-3xl">Hints</span>
                                    <div className="flex-1" />
                                    <Button className='w-[50px] h-[50px] [&_svg]:size-8 rounded-lg' variant="default"
                                        onClick={() => {
                                            setVisible(false)
                                        }}
                                    >
                                        <X />
                                    </Button>
                                </div>
                                {curChallenge?.hints?.length ? (
                                    <div className="flex flex-col w-full h-full gap-8 px-10 pb-8">
                                        {curChallenge?.hints?.map((hint, index) => (
                                            <ChallengeHintCard key={index}
                                                hint={hint.content}
                                                index={index + 1}
                                                publish_time={dayjs(hint.create_time)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex w-full h-full items-center justify-center">
                                        <span className="font-bold text-3xl">No hints</span>
                                    </div>
                                )}
                            </MacScrollbar>
                        </animated.div>
                    </div>
                ))}
        </SafeComponent>
    )
}