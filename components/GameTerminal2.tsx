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

import { useTranslations } from "next-intl";

export function GameTerminal({ gameid, challenge, pSize, userName, setChallengeSolved }: { gameid: string, challenge: ChallengeDetailModel, pSize: number, userName: string, setChallengeSolved: (id: number) => void }) {

    const t = useTranslations('game_terminal');

    const { theme, systemTheme } = useTheme();
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

    const [ terminalTheme, setTerminalTheme ] = useState(lightTheme)
    const [ terminalConfig, setTerminalConfig ] = useState({
        // fontFamily: '"Fira Code", monospace, "Powerline Extra Symbols"'
        theme: lightTheme,
        fontFamily: "'JetBrains Mono', sans-serif",
        lineHeight: 1,
        cursorBlink: true,
        cursorInactiveStyle: "outline",
        cursorStyle: 'underline',
        altClickMovesCursor: false,
        // allowTransparency: true,
    })

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


        let curTheme = lightTheme
        if (theme == "system") {
            if (systemTheme == "dark") curTheme = darkTheme
            else curTheme = lightTheme
        } else {
            if (theme == "light") curTheme = lightTheme
            else curTheme = darkTheme
        }

        const terminal = new Terminal({
            // fontFamily: '"Fira Code", monospace, "Powerline Extra Symbols"'
            theme: curTheme,
            fontFamily: "'JetBrains Mono', sans-serif",
            lineHeight: 1,
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
        };

        const commands: CommandType = {
            "help": t("help_message_help"),
            "submit": t("help_message_submit"),
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
                            t("help_prefix"),
                            ...Object.keys(commands).map(e => formatMessage(e, commands[e as keyof CommandType]))
                        ].join("\n\r"));
                        break
                    case "submit":
                        if (args.length != 2) {
                            terminal.writeln(chalk.hex("#FC7E65")(`[?] ${t("format_warn")}:: submit <flag_text_here>`));
                            break
                        }

                        const { data: submitID } = await api.game.gameSubmit(gmid, challenge.id || 0, { flag: args[1] })

                        terminal.writeln(chalk.ansi256(141)(t("waiting_for_result")));

                        await new Promise((res) => setTimeout(res, 1000))

                        const { data: flagStatus } = await api.game.gameStatus(gmid, challenge.id || 0, submitID)

                        switch (flagStatus) {
                            case AnswerResult.Accepted:
                                terminal.writeln(chalk.ansi256(84)(t("submit_correct")));
                                setChallengeSolved(challenge.id || 0)
                                break
                            case AnswerResult.WrongAnswer:
                                terminal.writeln(chalk.hex("#FC7E65")(t("submit_wrong")));
                                break
                            default:
                                terminal.writeln(chalk.hex("#FC7E65")(t("submit_unknow_error")));
                                break
                        }
                        break
                    case "cheat":
                        terminal.writeln(chalk.ansi256(141).bold(t("fake_cheat")));
                        setChallengeSolved(challenge.id || 0)
                        break
                    default:
                        terminal.writeln(chalk.hex("#FC7E65")(`${t("command_unknow_prefix")} '${args[0]}'. ${t("command_unknow_suffix")}`));
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
        terminal.writeln(`${chalk.ansi256(141).bold("[+]")} PS: ${ t("terminal_hint_part1") } \`${chalk.green('submit')} ${chalk.ansi256(210)("flag")}\` ${ t("terminal_hint_part2") } -> ${chalk.green("help")} ${t("terminal_hint_part3")}`)
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
                const curChar = text.charAt(getCursorAnsiIndex(cursorX, text))
                return encoder.encode(curChar).length == 1
            }

            const deleteCursorChar = (cursorX: number, text: string) => {
                const curCharIndex = getCursorAnsiIndex(cursorX, text) + 1
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

                    // 只允许 Ascii 字符
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
    }, [challenge]); // 当 challenge 改变时执行

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
