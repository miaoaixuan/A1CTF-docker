import { log } from "console";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { useTheme } from "next-themes";
import React, { useRef, useEffect } from "react";
import * as StackBlur from 'stackblur-canvas';

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset {
    x: number;
    y: number;
}

interface SquaresProps {
    direction?: "diagonal" | "up" | "right" | "down" | "left";
    speed?: number;
    borderColor?: CanvasStrokeStyle;
    imageSizeX?: number;
    imageSizeY?: number;
    rotation?: number;
    hoverFillColor?: CanvasStrokeStyle;
}

const LogoBackgroundAnimation: React.FC<SquaresProps> = ({
    direction = "right",
    speed = 1,
    borderColor = "#999",
    imageSizeX = 40,
    imageSizeY = 40,
    rotation = -5,
    hoverFillColor = "#222",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const numSquaresX = useRef<number>(0);
    const numSquaresY = useRef<number>(0);
    const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });

    const { clientConfig } = useGlobalVariableContext()

    const { theme, systemTheme } = useTheme()
    const themeRef = useRef(theme)
    const systemThemeRef = useRef(systemTheme)

    const logoImage = useRef<HTMLImageElement>(new Image())

    const animationMrk = useRef<number>(200);
    const shouldAnimation = useRef<boolean>(true)

    useEffect(() => {
        themeRef.current = theme
        systemThemeRef.current = systemTheme
        animationMrk.current = 200
        setImageLogo()
    }, [theme, systemTheme])

    useEffect(() => {
        shouldAnimation.current = clientConfig.BGAnimation
        if (clientConfig.BGAnimation) {
            animationMrk.current = 200
        }
    }, [clientConfig.BGAnimation])

    const setImageLogo = () => {
        const theme = themeRef.current
        const systemTheme = systemThemeRef.current
        if (theme == "system") {
            if (systemTheme == "dark") {
                logoImage.current.src = clientConfig.FancyBackGroundIconWhite
            }
            else {
                logoImage.current.src = clientConfig.FancyBackGroundIconBlack
            }
        } else {
            if (theme == "light") {
                logoImage.current.src = clientConfig.FancyBackGroundIconBlack
            }
            else {
                logoImage.current.src = clientConfig.FancyBackGroundIconWhite
            }
        }
    }

    const getGradientColors = () => {
        const theme = themeRef.current
        const systemTheme = systemThemeRef.current
        if (theme == "system") {
            if (systemTheme == "dark") return {
                imageSrc: clientConfig.FancyBackGroundIconWhite,
                gradientFrom: "rgba(0, 0, 0, 0)",
                gradientTo: "#060606"
            }
            else return {
                imageSrc: clientConfig.FancyBackGroundIconBlack,
                gradientFrom: "rgba(255, 255, 255, 0)",
                gradientTo: "#fff"
            }
        } else {
            if (theme == "light") return {
                imageSrc: clientConfig.FancyBackGroundIconBlack,
                gradientFrom: "rgba(255, 255, 255, 0)",
                gradientTo: "#fff"
            }
            else return {
                imageSrc: clientConfig.FancyBackGroundIconWhite,
                gradientFrom: "rgba(0, 0, 0, 0)",
                gradientTo: "#060606"
            }
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            numSquaresX.current = Math.ceil(canvas.width / imageSizeX) + 1;
            numSquaresY.current = Math.ceil(canvas.height / imageSizeY) + 1;

            animationMrk.current = 200
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const drawGrid = () => {
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const startX = Math.floor(gridOffset.current.x / imageSizeX) * imageSizeX;
            const startY = Math.floor(gridOffset.current.y / imageSizeY) * imageSizeY;

            for (let x = startX; x < canvas.width + imageSizeX; x += imageSizeX) {
                for (let y = startY; y < canvas.height + imageSizeY; y += imageSizeY) {
                    const squareX = x - (gridOffset.current.x % imageSizeX);
                    const squareY = y - (gridOffset.current.y % imageSizeY);

                    // 计算图片中心点
                    const centerX = squareX + imageSizeX / 2;
                    const centerY = squareY + imageSizeY / 2;

                    // 确定旋转角度
                    let currentRotation = rotation * Math.PI / 180;

                    // 保存当前绘图状态
                    ctx.save();

                    // 将原点移动到图片中心
                    ctx.translate(centerX, centerY);

                    // 旋转画布
                    ctx.rotate(currentRotation);

                    // 绘制旋转后的图片（注意要移动回原点）
                    ctx.drawImage(logoImage.current, -imageSizeX / 2, -imageSizeY / 2, imageSizeX, imageSizeY);

                    // 恢复画布状态
                    ctx.restore();
                }
            }

            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            );

            const colors = getGradientColors()
            gradient.addColorStop(0, colors.gradientFrom);
            gradient.addColorStop(1, colors.gradientTo);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const updateAnimation = () => {
            let effectiveSpeed = Math.max(speed, 0.1);
            if (!shouldAnimation.current) effectiveSpeed = 0;
            switch (direction) {
                case "right":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + imageSizeX) % imageSizeX;
                    break;
                case "left":
                    gridOffset.current.x =
                        (gridOffset.current.x + effectiveSpeed + imageSizeX) % imageSizeX;
                    break;
                case "up":
                    gridOffset.current.y =
                        (gridOffset.current.y + effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                case "down":
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                case "diagonal":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + imageSizeX) % imageSizeX;
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                default:
                    break;
            }


            if (animationMrk.current) {
                drawGrid();

                if (!shouldAnimation.current) animationMrk.current -= 1
            }
            requestRef.current = requestAnimationFrame(updateAnimation);
        };

        requestRef.current = requestAnimationFrame(updateAnimation);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [direction, speed, borderColor, hoverFillColor, imageSizeX, clientConfig]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full border-none block opacity-10 blur-[2px]"
        ></canvas>
    );
};

export default LogoBackgroundAnimation;
