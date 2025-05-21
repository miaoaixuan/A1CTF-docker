import { useCanvas } from "contexts/CanvasProvider";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import React, { useRef, useEffect, useState } from "react";

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface ImagesProps {
    direction?: "diagonal" | "up" | "right" | "down" | "left";
    speed?: number;
    borderColor?: CanvasStrokeStyle;
    imageSizeX?: number;
    imageSizeY?: number;
    hoverFillColor?: CanvasStrokeStyle;
    imageSrc?: string;
    showBorder?: boolean;
    opacity?: number;
    rotation?: number;
    rotationSpeed?: number;
    randomRotation?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
}

const Squares: React.FC<ImagesProps> = ({
    direction = "right",
    speed = 1,
    borderColor = "#999",
    imageSizeX = 80,
    imageSizeY = 80,
    hoverFillColor = "#222",
    imageSrc = "/api/placeholder/80/80", // 默认使用占位图片
    showBorder = false,
    opacity = 1,
    rotation = 0,
    rotationSpeed = 0,
    randomRotation = false,
    gradientFrom = "rgba(255, 255, 255, 0)",
    gradientTo = "#fff",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const numImagesX = useRef<number>(0);
    const numImagesY = useRef<number>(0);
    const [isReady, setIsReady] = useState<boolean>(false);

    const { clientConfig } = useGlobalVariableContext()

    const animationMrk = useRef<number>(1);

    const {
        canvasState,
        updateGridOffset,
        updateRotationAngle,
        updateHoveredSquare,
        updateImageRotation,
        initializeRandomRotations,
        getImage,
        loadImage,
        loadedImages
    } = useCanvas();

    useEffect(() => {
        // 使用异步函数加载图片
        const prepareImage = async () => {
            try {
                // 尝试加载图片
                await loadImage(imageSrc);
                setIsReady(true);
            } catch (error) {
                console.error("图片准备失败:", error);
            }
        };

        // 检查图片是否已加载
        if (loadedImages.has(imageSrc)) {
            setIsReady(true);
        } else {
            prepareImage();
        }
    }, [imageSrc, loadImage, loadedImages]);

    useEffect(() => {
        if (!isReady) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // 从Context中获取缓存的图片
        const cachedImage = getImage(imageSrc);
        if (!cachedImage) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            numImagesX.current = Math.ceil(canvas.width / imageSizeX) + 1;
            numImagesY.current = Math.ceil(canvas.height / imageSizeY) + 1;

            animationMrk.current = 100

            // 初始化随机旋转角度（仅在randomRotation启用且旋转集合为空时）
            if (randomRotation && canvasState.imageRotations.size === 0) {
                initializeRandomRotations(numImagesY.current, numImagesX.current);
            }
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const drawGrid = () => {
            if (!ctx) return;

            // 清除画布，但只清除绘制的区域
            const offsetX = Math.floor(canvasState.gridOffset.x / imageSizeX) * imageSizeX;
            const offsetY = Math.floor(canvasState.gridOffset.y / imageSizeY) * imageSizeY;

            ctx.clearRect(offsetX, offsetY, canvas.width, canvas.height);
            ctx.globalAlpha = opacity;

            const startX = Math.floor(canvasState.gridOffset.x / imageSizeX) * imageSizeX;
            const startY = Math.floor(canvasState.gridOffset.y / imageSizeY) * imageSizeY;

            for (let x = startX; x < canvas.width + imageSizeX; x += imageSizeX) {
                for (let y = startY; y < canvas.height + imageSizeY; y += imageSizeY) {
                    const imageX = x - (canvasState.gridOffset.x % imageSizeX);
                    const imageY = y - (canvasState.gridOffset.y % imageSizeY);

                    // 计算图片中心点
                    const centerX = imageX + imageSizeX / 2;
                    const centerY = imageY + imageSizeY / 2;

                    // 确定旋转角度
                    let currentRotation = canvasState.rotationAngle;

                    // 如果使用随机旋转，获取该图片的随机角度
                    if (randomRotation) {
                        const gridX = Math.floor((x - startX) / imageSizeX);
                        const gridY = Math.floor((y - startY) / imageSizeY);
                        const key = `${gridX}-${gridY}`;
                        const rotationFromMap = canvasState.imageRotations.get(key);
                        if (rotationFromMap !== undefined) {
                            currentRotation = rotationFromMap;
                        }
                    }

                    // 保存当前绘图状态
                    ctx.save();

                    // 将原点移动到图片中心
                    ctx.translate(centerX, centerY);

                    // 旋转画布
                    ctx.rotate(currentRotation);

                    // 绘制旋转后的图片（注意要移动回原点）
                    ctx.drawImage(cachedImage, -imageSizeX / 2, -imageSizeY / 2, imageSizeX, imageSizeY);

                    // 恢复画布状态
                    ctx.restore();
                }
            }

            // 添加渐变遮罩效果
            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            );
            gradient.addColorStop(0, gradientFrom);
            gradient.addColorStop(1, gradientTo);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // console.log("Draw")
        };

        const updateAnimation = (timestamp: number) => {

            // 计算移动偏移量
            const effectiveSpeed = speed

            // 获取当前gridOffset
            const currentOffset = { ...canvasState.gridOffset };

            // 根据方向更新gridOffset
            switch (direction) {
                case "right":
                    currentOffset.x = (currentOffset.x - effectiveSpeed + imageSizeX) % imageSizeX;
                    break;
                case "left":
                    currentOffset.x = (currentOffset.x + effectiveSpeed + imageSizeX) % imageSizeX;
                    break;
                case "up":
                    currentOffset.y = (currentOffset.y + effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                case "down":
                    currentOffset.y = (currentOffset.y - effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                case "diagonal":
                    currentOffset.x = (currentOffset.x - effectiveSpeed + imageSizeX) % imageSizeX;
                    currentOffset.y = (currentOffset.y - effectiveSpeed + imageSizeY) % imageSizeY;
                    break;
                default:
                    break;
            }

            // 更新Context中的gridOffset
            updateGridOffset(currentOffset.x, currentOffset.y);

            if (animationMrk.current) {
                drawGrid();

                if (!clientConfig.BGAnimation) animationMrk.current -= 1
            }

            requestRef.current = requestAnimationFrame(updateAnimation);
        };

        updateRotationAngle(rotation * Math.PI / 180);
        
        requestRef.current = requestAnimationFrame(updateAnimation);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            // clearInterval(drawInter)
        };
    }, [
        direction,
        speed,
        borderColor,
        hoverFillColor,
        imageSizeX,
        imageSizeY,
        isReady,
        showBorder,
        opacity,
        rotation,
        rotationSpeed,
        randomRotation,
        canvasState,
        updateGridOffset,
        updateRotationAngle,
        updateHoveredSquare,
        initializeRandomRotations,
        imageSrc,
        getImage,
        gradientFrom,
        gradientTo,
        clientConfig.BGAnimation
    ]);

    useEffect(() => {
        animationMrk.current = 1

    }, [clientConfig.BGAnimation])

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full border-none block"
        ></canvas>
    );
};

export default Squares;
