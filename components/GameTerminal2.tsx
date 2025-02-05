"use client";


import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";


import { Terminal, ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { LinkProvider } from '@/components/LinkProvider';

import api, { ChallengeDetailModel, AnswerResult, FlagSubmitModel } from '@/utils/GZApi'

import { Chalk } from 'chalk';
import dayjs from "dayjs";
import stringWidth from 'string-width';

export function GameTerminal({ gameid, challenge, pSize, userName, setChallengeSolved }: { gameid: string, challenge: ChallengeDetailModel, pSize: number, userName: string, setChallengeSolved: (id: number) => void }) {

    const { theme } = useTheme();
    const [instance, setInstance] = useState<any>(null);
    const chalk = new Chalk({ level: 3 });

    const gmid = parseInt(gameid, 10)

    const [terminal, setTerminal] = useState<Terminal>()
    const [fitAddon, setFitAddon] = useState<FitAddon>()


    const darkTheme = {
        foreground: '#F8F8F8',
        cursor: '#F8F8F8',
        background: '#2D2E2C',
        selectionBackground: 'rgba(255, 255, 255, 0.5)',
        selectionInactiveBackground: 'transparent',
        black: '#1E1E1D',
        brightBlack: '#262625',
        red: '#CE5C5C',
        brightRed: '#FF7272',
        green: '#5BCC5B',
        brightGreen: '#72FF72',
        yellow: '#CCCC5B',
        brightYellow: '#FFFF72',
        blue: '#5D5DD3',
        brightBlue: '#7279FF',
        magenta: '#BC5ED1',
        brightMagenta: '#E572FF',
        cyan: '#5DA5D5',
        brightCyan: '#72F0FF',
        white: '#F8F8F8',
        brightWhite: '#FFFFFF'
    } satisfies ITheme;

    const lightTheme = {
        foreground: '#000000',
        background: '#2D2E2C',
        selectionBackground: 'rgba(255, 255, 255, 0.5)',
        selectionInactiveBackground: 'transparent',
        cursor: "#000000",
        black: '#1E1E1D',
        brightBlack: '#262625',
        red: '#CE5C5C',
        brightRed: '#FF7272',
        green: '#5BCC5B',
        brightGreen: '#72FF72',
        yellow: '#CCCC5B',
        brightYellow: '#FFFF72',
        blue: '#5D5DD3',
        brightBlue: '#7279FF',
        magenta: '#BC5ED1',
        brightMagenta: '#E572FF',
        cyan: '#5DA5D5',
        brightCyan: '#72F0FF',
        white: '#F8F8F8',
        brightWhite: '#FFFFFF'
    } satisfies ITheme;

    useEffect(() => {

        const padddingText = (left: string, right: string, chr?: string) => {
            const repeatCount = Math.max(Math.floor((terminal.cols - stringWidth(left) - stringWidth(right) - 2) / (chr?.length || 1)), 0)
            return left + " " + (chr ? chr : "─").repeat(repeatCount) + " " + right
        }

        const prompt = () => {
            terminal.writeln(padddingText(`${chalk.ansi256(172)(userName)}@A1CTF ${challenge.title ? `-> ${chalk.ansi256(74)("~/" + challenge.title)}` : ""}`, `${chalk.ansi256(34)('✚')} ${chalk.ansi256(80)('✭')} [${dayjs().format("HH:mm:ss")}]`, " ") || "")
            terminal.write(`\r${chalk.ansi256(210)('%')} `)
        }

        const generateClickableLink = (linkText: string, url: string) => {
            const linkStart = '\x1b]8;;';
            const linkEnd = '\x1b\\';

            return `${linkStart}${url}${linkEnd}${linkText}${linkStart}${linkEnd}`;
        }

        const terminal = new Terminal({
            // fontFamily: '"Fira Code", monospace, "Powerline Extra Symbols"'
            theme: theme == "dark" ? darkTheme : lightTheme,
            fontFamily: "var(--font-jetbrain-mono), Microsoft YaHei, monospace",
            lineHeight: 1.5,
            cursorBlink: true,
            cursorInactiveStyle: "outline",
            cursorStyle: 'underline',
            altClickMovesCursor: false,
            // allowTransparency: true,
        });

        const fitAddon = new FitAddon();
        const unicode11Addon = new Unicode11Addon();
        const webLink = new WebLinksAddon((event, url) => {
            alert(url)
        });

        type CommandType = {
            help: string;
            submit: string;
            ls: string;
            poweron: string;
            poweroff: string;
            extend: string;
        };

        const commands: CommandType = {
            "help": "Show this message",
            "submit": "Submit your flag! format: submit <flag>",
            "ls": "List all the attachments.",
            "poweron": "Start your instance",
            "poweroff": "Close your instance",
            "extend": "Extend your instance time"
        }

        const handleCommnd = async (command: string) => {
            const args = command.split(" ")
            if (args.length) {
                if (args[0] == "") {
                    terminal.writeln("")
                    prompt()
                    return
                }
                switch (args[0]) {
                    case "clear":
                        terminal.write('\x1b[A\x1b[M');
                        terminal.clear()
                        prompt()
                        return
                    case "help":
                        const padding = 10;
                        const formatMessage = (name: string, description: string) => {
                            const maxLength = terminal.cols - padding - 3;
                            const words = description.split(' '); // 先将 description 按空格分词
                            let line = '';
                            const d: string[] = [];
                        
                            // 将 description 拆分为多个行
                            for (const word of words) {
                                if ((line + word).length + 1 <= maxLength) {
                                    line += (line ? ' ' : '') + word; // 如果当前行能容纳该词，则加入当前行
                                } else {
                                    d.push(line); // 将当前行添加到结果数组
                                    line = word; // 当前行变为当前词
                                }
                            }
                            if (line) d.push(line); // 将最后一行添加到结果数组
                        
                            // 格式化最终消息
                            const message = (
                                `  ${chalk.ansi256(141).bold(name.padEnd(padding))}${d[0]}` +
                                d.slice(1).map(e => `\r\n  ${' '.repeat(padding)} ${e}`).join('')
                            );
                        
                            return message;
                        }                            
                        terminal.writeln([
                            `Here are some useful commands below :)`,
                            ...Object.keys(commands).map(e => formatMessage(e, commands[e as keyof CommandType]))
                        ].join("\n\r"));
                        break
                    case "submit":
                        if (args.length != 2) {
                            terminal.writeln(chalk.hex("#FC7E65")(`[?] format:: submit <flag_text_here>`));
                            break
                        }

                        const { data: submitID } = await api.game.gameSubmit(gmid, challenge.id || 0, { flag: args[1] })
                        const { data: flagStatus } = await api.game.gameStatus(gmid, challenge.id || 0, submitID)

                        switch (flagStatus) {
                            case AnswerResult.Accepted:
                                terminal.writeln(chalk.ansi256(84)(`[!] Correct!`));
                                setChallengeSolved(challenge.id || 0)
                                break
                            case AnswerResult.WrongAnswer:
                                terminal.writeln(chalk.hex("#FC7E65")(`[?] This flag is wrong!`));
                                break
                            default:
                                terminal.writeln(chalk.hex("#FC7E65")(`[?] Unknow error!`));
                                break
                        }
                        break
                    default:
                        terminal.writeln(chalk.hex("#FC7E65")(`[?] Unknow command '${args[0]}'. Click \'help\' for more information!`));
                }
                terminal.writeln("")
                prompt()
            }
        }

        const simulateInput = (command: string) => {
            cursorX = 0
            terminal.writeln(command)
            handleCommnd(command)
            inputedData = ""
        }

        Object.keys(commands).forEach((commandName: string) => {
            terminal.registerLinkProvider(
                new LinkProvider(
                    terminal,
                    new RegExp(`(${commandName})`, "gu"),
                    (_event, text) => {
                        simulateInput(text)
                    }
                )
            )
        })

        window.addEventListener('resize', function () {
            fitAddon.fit()
        });

        setTerminal(terminal)
        setFitAddon(fitAddon)

        terminal.options.allowProposedApi = true
        terminal.options.allowTransparency = true

        terminal.loadAddon(fitAddon)

        terminal.loadAddon(unicode11Addon);
        terminal.loadAddon(webLink);

        terminal.unicode.activeVersion = '11';

        setInstance(terminal);
        terminal.open(document.getElementById('terminal-container')!);
        fitAddon.fit()

        terminal.writeln(`Welcome to ${chalk.ansi256(141).bold("A1::CTF")} Terminal`)
        terminal.writeln(`${chalk.ansi256(141).bold("[+]")} PS: 使用指令 \`${chalk.green('submit')} ${chalk.ansi256(210)("flag")}\` 来提交flag, 点击 -> ${chalk.green("help")} 来获取更多的帮助。`)
        terminal.writeln("")
        prompt()

        let cursorX = 0;
        let inputedData = "";

        terminal.onData((data: string) => {
            const line = terminal.buffer.active.getLine(terminal.buffer.active.cursorY);

            const getCursorAnsiIndex = (cursorX: number, text: string) => {
                let curIndex = 0
                let curCharIndex = 0
                let curChar = text.charAt(0)
                const encoder = new TextEncoder()
                while (curIndex < cursorX) {
                    curChar = text.charAt(curCharIndex)
                    curIndex += encoder.encode(curChar).length == 3 ? 2 : 1
                    curCharIndex += 1
                }
                return curCharIndex - 1
            }

            const isCursorAnsi = (cursorX: number, text: string) => {
                const encoder = new TextEncoder()
                let curChar = text.charAt(getCursorAnsiIndex(cursorX, text))
                return encoder.encode(curChar).length == 1
            }

            const deleteCursorChar = (cursorX: number, text: string) => {
                let curCharIndex = getCursorAnsiIndex(cursorX, text) + 1
                return text.substring(0, curCharIndex) + text.substring(curCharIndex + 1, text.length)
            }

            const getStrLenght = (text: string) => {
                let ans = 0;
                const encoder = new TextEncoder()
                for (let i = 0; i < text.length; i++) {
                    ans += encoder.encode(text.charAt(i)).length == 3 ? 2 : 1;
                }
                return ans;
            }

            if (data === '\r') { // enter
                cursorX = 0
                terminal.writeln("")
                handleCommnd(inputedData)
                inputedData = ""
            } else if (data === '\u007f') { // backspace
                if (line && cursorX) {
                    const lineText = inputedData;
                    if (!isCursorAnsi(cursorX, lineText)) {
                        terminal.write('\x1b[D');
                        terminal.write('\x1b[D');
                        cursorX -= 2
                    } else {
                        terminal.write('\x1b[D');
                        cursorX -= 1
                    }
                    terminal.write('\x1b[P');
                    inputedData = deleteCursorChar(cursorX, inputedData)
                }
            } else if (data === '\x1b[C') { // right
                if (line && cursorX < getStrLenght(inputedData)) {
                    const encoder = new TextEncoder()
                    const length = encoder.encode(inputedData.charAt(getCursorAnsiIndex(cursorX, inputedData) + 1)).length == 3 ? 2 : 1;
                    cursorX += length
                    terminal.write('\x1b[C'.repeat(length))
                    // console.log(cursorX, inputedData, inputedData.length)
                }
            } else if (data === '\x1b[D') {  // left
                if (line && cursorX > 0) {
                    const length = isCursorAnsi(cursorX, inputedData) ? 1 : 2;
                    cursorX -= length
                    terminal.write('\x1b[D'.repeat(length))
                    // console.log(cursorX, inputedData, inputedData.length)
                }
            } else {
                if (inputedData.length < 100) {

                    if (data.startsWith('\x1b')) return

                    data = data.replace(/[^ -~\t\n\r]/g, '')

                    const length = getStrLenght(data)

                    const index = getCursorAnsiIndex(cursorX, inputedData) + 1

                    inputedData = inputedData.substring(0, index) + data + inputedData.substring(index, inputedData.length)
                    cursorX += length

                    // console.log(inputedData, cursorX)

                    terminal.write('\x1b[@'.repeat(length))
                    terminal.write(data);
                }
            }
        })

        return () => {
            terminal.dispose();
            fitAddon.dispose();
            webLink.dispose();
        };
    }, [challenge]); // 当 theme 改变时执行

    useEffect(() => {
        if (terminal) {
            terminal.options.theme = theme == "dark" ? darkTheme : lightTheme;
        }
    }, [theme])

    useEffect(() => {
        if (fitAddon && terminal) {
            fitAddon.fit()
        }
    }, [pSize, fitAddon])

    return (
        <div className="w-full h-full relative">
            <div className="w-full h-full pt-6 pl-6 pb-4">
                <div id="terminal-container" style={{
                    width: '100%',
                    height: '100%',
                    overflow: "hidden",
                    backgroundColor: "transparent"
                }} className="transition-colors duration-300" />
            </div>
        </div>
    );
}
