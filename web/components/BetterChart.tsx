import React, { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption, SeriesOption, DataZoomComponentOption } from 'echarts';
import dayjs from 'dayjs';
import { useGlobalVariableContext } from '@/contexts/GlobalVariableContext';
import { clear } from 'console';
import { UserFullGameInfo } from '@/utils/A1API';

interface SmartUpdateChartProps {
    theme?: 'light' | 'dark';
    gameInfo: UserFullGameInfo;
}

interface ViewState {
    xAxis: {
        inside?: {
            startValue?: number;
            endValue?: number;
        };
        slider?: {
            startValue?: number;
            endValue?: number;
        };
    },
    yAxis: {
        inside?: {
            startValue?: number;
            endValue?: number;
        };
        slider?: {
            startValue?: number;
            endValue?: number;
        };
    }
}

const BetterChart: React.FC<SmartUpdateChartProps> = ({
    theme = 'light',
    gameInfo,
}) => {
    const chartRef = useRef<ReactECharts>(null);
    const lastViewState = useRef<ViewState | null>(null);
    const serData = React.useRef<echarts.SeriesOption[]>([])
    const lastSerData = useRef<string>("")

    const { serialOptions } = useGlobalVariableContext()

    useEffect(() => {
        console.log("ReDrawing.....")

    }, [serData]);

    useEffect(() => {

        const updateChartMethod = () => {
            const chartInstance: ECharts | undefined = chartRef.current?.getEchartsInstance();
            if (!chartInstance) return;

            // 保存当前的选择范围
            const option: EChartsOption = chartInstance.getOption() as EChartsOption;
            const dataZooms = option.dataZoom as DataZoomComponentOption[];

            lastViewState.current = {
                xAxis: {
                    inside: dataZooms[0] ? {
                        startValue: dataZooms[0].startValue !== undefined ? Number(dataZooms[0].startValue) : undefined,
                        endValue: dataZooms[0].endValue !== undefined ? Number(dataZooms[0].endValue) : undefined
                    } : undefined,
                    slider: dataZooms[1] ? {
                        startValue: dataZooms[1].startValue !== undefined ? Number(dataZooms[1].startValue) : undefined,
                        endValue: dataZooms[1].endValue !== undefined ? Number(dataZooms[1].endValue) : undefined
                    } : undefined
                },
                yAxis: {
                    inside: dataZooms[2] ? {
                        startValue: dataZooms[2].startValue !== undefined ? Number(dataZooms[2].startValue) : undefined,
                        endValue: dataZooms[2].endValue !== undefined ? Number(dataZooms[2].endValue) : undefined
                    } : undefined,
                    slider: dataZooms[3] ? {
                        startValue: dataZooms[3].startValue !== undefined ? Number(dataZooms[3].startValue) : undefined,
                        endValue: dataZooms[3].endValue !== undefined ? Number(dataZooms[3].endValue) : undefined
                    } : undefined
                }
            };

            // 静默更新
            chartInstance.setOption({
                series: serialOptions.current
            }, {
                silent: true,
                replaceMerge: ['series'] // Only replace series data
            });

            // 恢复之前的视窗
            if (lastViewState.current) {
                // 恢复x轴缩放
                if (lastViewState.current.xAxis.inside) {
                    chartInstance.dispatchAction({
                        type: 'dataZoom',
                        dataZoomIndex: 0, // 第一个x轴inside dataZoom
                        startValue: lastViewState.current.xAxis.inside.startValue,
                        endValue: lastViewState.current.xAxis.inside.endValue
                    });
                }

                if (lastViewState.current.xAxis.slider) {
                    chartInstance.dispatchAction({
                        type: 'dataZoom',
                        dataZoomIndex: 1, // 第二个x轴slider dataZoom
                        startValue: lastViewState.current.xAxis.slider.startValue,
                        endValue: lastViewState.current.xAxis.slider.endValue
                    });
                }

                // 恢复y轴缩放
                if (lastViewState.current.yAxis.inside) {
                    chartInstance.dispatchAction({
                        type: 'dataZoom',
                        dataZoomIndex: 2, // 第一个y轴inside dataZoom
                        startValue: lastViewState.current.yAxis.inside.startValue,
                        endValue: lastViewState.current.yAxis.inside.endValue
                    });
                }

                if (lastViewState.current.yAxis.slider) {
                    chartInstance.dispatchAction({
                        type: 'dataZoom',
                        dataZoomIndex: 3, // 第二个y轴slider dataZoom
                        startValue: lastViewState.current.yAxis.slider.startValue,
                        endValue: lastViewState.current.yAxis.slider.endValue
                    });
                }
            }


            // 更新完成
            lastSerData.current = JSON.stringify(serialOptions.current[1].data)
        }

        updateChartMethod()
        const updateIns = setInterval(() => {
            if (JSON.stringify(serialOptions.current[1].data) == lastSerData.current) return
            updateChartMethod()
        }, 1000)

        return () => {
            clearInterval(updateIns)
        }
    })

    const end = dayjs(gameInfo.end_time);
    const isGameEnded = end.diff(dayjs(), 's') < 0;

    const chartOption: EChartsOption = {
        backgroundColor: 'transparent',
        animation: false,
        tooltip: {
            trigger: 'axis',
            borderWidth: 0,
            textStyle: {
                fontSize: 12,
                color: theme === "dark" ? "#121212" : "#FFFFFF",
            },
            backgroundColor: theme === "dark" ? "#FFFFFF" : "#121212"
        },
        title: {
            left: 'center',
            text: `${gameInfo.name} - TOP10`,
            textStyle: {
                color: theme === "dark" ? "#FFFFFF" : "#121212",
            }
        },
        toolbox: {
            show: false,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'time',
            min: dayjs(gameInfo.start_time).toDate(),
            max: dayjs(gameInfo.end_time).toDate(),
            splitLine: {
                show: false,
            },
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            max: (value: { max: number }) => (Math.floor(value.max / 1000) + 1) * 1000,
            splitLine: {
                show: true,
            },
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100,
                xAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'slider',
                xAxisIndex: 0,
                start: 0,
                end: 100,
                height: 20, // 滑块高度
                bottom: 10, // 距离底部位置
                showDetail: true,
                labelFormatter: (value: number) => dayjs(value).format('YYYY-MM-DD HH:mm'),
                textStyle: {
                    color: '#666',
                    fontSize: 12
                },
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                handleStyle: {
                    color: '#1890ff',
                    shadowBlur: 3,
                    shadowColor: 'rgba(0, 0, 0, 0.6)',
                    shadowOffsetX: 2,
                    shadowOffsetY: 2
                }
            },
            {
                type: 'inside',
                start: 0,
                end: 100,
                yAxisIndex: 0,
                filterMode: 'none',
            },
            {
                type: 'slider',
                yAxisIndex: 0,
                start: 0,
                end: 100,
                width: 20, // 滑块宽度
                right: 10, // 距离右侧位置
                showDetail: true,
                labelFormatter: (value: number) => value.toFixed(0),
                textStyle: {
                    color: '#666',
                    fontSize: 12
                },
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                handleStyle: {
                    color: '#1890ff',
                    shadowBlur: 3,
                    shadowColor: 'rgba(0, 0, 0, 0.6)',
                    shadowOffsetX: 2,
                    shadowOffsetY: 2
                }
            },
        ],
        series: []
    };

    return (
        <div className='w-full h-full pr-[2%]'>
            <ReactECharts
                className='ml-[-5%]'
                ref={chartRef}
                option={chartOption}
                style={{ height: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
};

export default React.memo(BetterChart);