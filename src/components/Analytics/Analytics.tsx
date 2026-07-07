import { useApp } from '@/app/Context/UserContext'
import { ApiResponse } from '@/types/ApiResponse';
import axios from 'axios'
import { Activity, CircleAlert, Cpu, Layers, Loader2, TrendingUp } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner';
import { easeInOut, motion } from "framer-motion"

interface DailyStat {
    date: string;
    totalRequests: number;
    averageLatency: number;
}

interface metricsData {
    totalRequests: number,
    averageLatency: number,
    methods: {
        GET: number;
        POST: number;
        PUT: number;
        DELETE: number;
        PATCH: number;
    };
    statusCodes: {
        "2xx": number;
        "3xx": number;
        "4xx": number;
        "5xx": number;
    };
    dailyStats?: DailyStat[];
}

export default function Analytics() {
    const { activeWorkspace } = useApp();
    const [metrics, setMetrics] = useState<metricsData>({
        totalRequests: 0,
        averageLatency: 0,
        methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 },
        statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
        dailyStats: []
    });

    const getNiceMax = (val: number) => {
        if (val <= 0) return 10;
        const digits = Math.floor(Math.log10(val));
        const scale = Math.pow(10, digits);
        return Math.ceil(val / (scale / 2)) * (scale / 2);
    };

    const getDailyStatsList = () => {
        if (metrics.dailyStats && metrics.dailyStats.length > 0) {
            return metrics.dailyStats;
        }
        const list = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            list.push({
                date: d.toISOString().split("T")[0],
                totalRequests: 0,
                averageLatency: 0
            });
        }
        return list;
    };

    const getBezierPath = (points: { x: number; y: number }[]) => {
        if (points.length === 0) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 3;
            const cp1y = curr.y;
            const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
            const cp2y = next.y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }
        return d;
    };

    const formatDateLabel = (dateStr: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length >= 3) {
            return `${parts[1]}-${parts[2]}`;
        }
        return dateStr;
    };

    const cachedMetricsKey = `metrics_${activeWorkspace?._id}`
    useEffect(() => {
        const getMetrics = async () => {
            if (!activeWorkspace?._id) return;
            try {
                const res = await axios.get<ApiResponse>(`/api/workspace/${activeWorkspace._id}/stats`);

                if (res.data.success) {
                    const newMetrics = res.data.data;
                    const cachedMetricsString = localStorage.getItem(cachedMetricsKey);

                    if (JSON.stringify(newMetrics) !== cachedMetricsString)
                        setMetrics(newMetrics)
                    localStorage.setItem(cachedMetricsKey, JSON.stringify(newMetrics))
                    toast.success("Metrics Loaded Successfully.")
                }
            } catch (err: any) {
                toast.error("Failed to Load Metrics", {
                    description: err.response?.data?.error || err.message
                });
            }
        }

        const cachedData = localStorage.getItem(cachedMetricsKey);

        if (cachedData) {
            setMetrics(JSON.parse(cachedData))
            getMetrics();
        }
        else {
            getMetrics();
        }

    }, [activeWorkspace?._id])



    const total = metrics.totalRequests;
    const errors = (metrics.statusCodes["4xx"] || 0) + (metrics.statusCodes['5xx'] || 0)
    const errorRate = total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0;

    const latencyColorSelector = (latency: number) => {
        if (latency < 100) {
            return {
                class: "text-method-get",
                status: "Excellent"
            }

        }
        else if (latency < 200) {
            return {
                class: "text-method-post",
                status: "Normal"
            }
        }

        return {
            class: "text-method-delete",
            status: "Degraded"
        }
    }

    const getMethodStatPercentage = (method: keyof typeof metrics.methods) => {
        return total > 0 ? (Number((metrics.methods[method] || 0) / total) * 100).toFixed(2) : 0
    }

    const getResponseCodePercentage = (statusCode: keyof typeof metrics.statusCodes) => {
        return total > 0 ? (Number((metrics.statusCodes[statusCode] || 0) / total) * 100).toFixed(2) : 0
    }

    return (
        <div className='bg-background flex h-full w-full flex-col'>
            <header className='w-full py-4 px-6 flex items-center flex-row justify-start gap-2 bg-method-get/3'>
                <div className='size-9 p-2 bg-panel-hover rounded-md border border-border-dark'>
                    <Activity className='text-method-get size-5' />
                </div>
                <div>
                    <h2 className='text-sm text-text-white font-bold'>Workspace Performance Metrics</h2>
                    <p className='text-[11px] text-text-muted font-mono'>Visualizing atomic aggregated summary statistics</p>
                </div>
            </header>

            <Suspense
                fallback={
                    <div className='flex h-full w-full items-center justify-center flex-col gap-3 text-text-white text-lg'>
                        <Loader2 className='size-5 text-method-patch animate-spin' />
                        Loading Analytics...
                    </div>
                }
            >
                <div className='overflow-y-scroll'>

                    <div className='p-6 space-y-6 max-w-6xl mx-auto w-full'>

                        {/* Upper Metrics Containers */}
                        <div className='flex flex-row gap-3 w-full '>
                            {[
                                {
                                    name: "Total Handled Requests",
                                    data: new Intl.NumberFormat('en-IN').format(metrics.totalRequests),
                                    subtext: "Sum of totalRequests",
                                    color: "text-text-white"
                                },
                                {
                                    name: "Average Response Latency",
                                    data: `${new Intl.NumberFormat('en-IN').format(metrics.averageLatency)} ms`,
                                    subtext: "totalLatency / totalRequests",
                                    color: `${(latencyColorSelector(metrics.averageLatency).class)}`
                                },
                                {
                                    name: "API Request Error Rate",
                                    data: `${errorRate}%`,
                                    subtext: "(4xx + 5xx) / totalRequests",
                                    color: "text-method-delete"
                                },
                            ].map((el) => (
                                <div
                                    key={el.name}
                                    className={`p-3 flex flex-col gap-1 w-full h-full rounded-md items-start justify-center bg-panel-hover/60 border border-border-dark`}
                                >
                                    <p className='text-text-grey text-[10px] font-mono uppercase text-left flex items-center justify-between w-full'>
                                        {el.name}
                                        {el.name === "Average Response Latency" && (
                                            <span className={`text-[11px] font-mono ${latencyColorSelector(metrics.averageLatency).class}`}>
                                                {latencyColorSelector(metrics.averageLatency).status}
                                            </span>
                                        )}
                                    </p>
                                    <h2 className={`text-2xl ${el.color} font-bold`}>{el.data}</h2>
                                    <p className='text-text-muted text-[10px] font-mono'>{el.subtext}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {/* Left Chart: Request Traffic Volume */}
                            <div className='p-5 rounded-lg bg-panel-hover/60 border border-border-hover space-y-4 flex flex-col justify-between'>
                                <header className='flex items-center justify-between'>
                                    <div>
                                        <p className='uppercase text-[10px] text-text-muted font-mono tracking-wider'>Temporal Distribution</p>
                                        <h3 className='flex flex-row gap-2 items-center justify-start text-xs mt-0.5 font-bold'>
                                            <TrendingUp className='text-method-get size-3.5' />
                                            Request Traffic Volume (7D)
                                        </h3>
                                    </div>
                                    <span className='text-[10px] text-text-muted font-mono'>totalRequests</span>
                                </header>
                                <div className='w-full h-[180px]'>
                                    {(() => {
                                        const list = getDailyStatsList();
                                        const rawMax = Math.max(...list.map(d => d.totalRequests), 0);
                                        const maxY = Math.max(getNiceMax(rawMax), 4);

                                        const width = 500;
                                        const height = 180;
                                        const marginLeft = 45;
                                        const marginRight = 15;
                                        const marginTop = 15;
                                        const marginBottom = 30;

                                        const chartWidth = width - marginLeft - marginRight;
                                        const chartHeight = height - marginTop - marginBottom;

                                        const points = list.map((d, i) => {
                                            const x = marginLeft + (i / 6) * chartWidth;
                                            const y = marginTop + chartHeight - (d.totalRequests / maxY) * chartHeight;
                                            return { x, y };
                                        });

                                        const linePath = getBezierPath(points);
                                        const areaPath = points.length > 0
                                            ? `${linePath} L ${points[points.length - 1].x} ${marginTop + chartHeight} L ${points[0].x} ${marginTop + chartHeight} Z`
                                            : "";

                                        const yLabels = [maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0];

                                        return (
                                            <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-full text-text-muted select-none'>
                                                <defs>
                                                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                                                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Grid Lines */}
                                                {yLabels.map((val, idx) => {
                                                    const y = marginTop + (idx / 4) * chartHeight;
                                                    return (
                                                        <line
                                                            key={`h-line-${idx}`}
                                                            x1={marginLeft}
                                                            y1={y}
                                                            x2={width - marginRight}
                                                            y2={y}
                                                            stroke="#27272a"
                                                            strokeDasharray="4 4"
                                                            strokeWidth="1"
                                                        />
                                                    );
                                                })}

                                                {list.map((_, i) => {
                                                    const x = marginLeft + (i / 6) * chartWidth;
                                                    return (
                                                        <line
                                                            key={`v-line-${i}`}
                                                            x1={x}
                                                            y1={marginTop}
                                                            x2={x}
                                                            y2={marginTop + chartHeight}
                                                            stroke="#27272a"
                                                            strokeDasharray="4 4"
                                                            strokeWidth="1"
                                                        />
                                                    );
                                                })}

                                                {/* Y Axis Labels */}
                                                {yLabels.map((val, idx) => {
                                                    const y = marginTop + (idx / 4) * chartHeight;
                                                    return (
                                                        <text
                                                            key={`y-label-${idx}`}
                                                            x={marginLeft - 8}
                                                            y={y + 3.5}
                                                            fill="#71717a"
                                                            className="font-mono text-[9px] font-medium"
                                                            textAnchor="end"
                                                        >
                                                            {new Intl.NumberFormat('en-IN').format(val)}
                                                        </text>
                                                    );
                                                })}

                                                {/* X Axis Labels */}
                                                {list.map((d, i) => {
                                                    const x = marginLeft + (i / 6) * chartWidth;
                                                    return (
                                                        <text
                                                            key={`x-label-${i}`}
                                                            x={x}
                                                            y={marginTop + chartHeight + 15}
                                                            fill="#71717a"
                                                            className="font-mono text-[9px] font-medium"
                                                            textAnchor="middle"
                                                        >
                                                            {formatDateLabel(d.date)}
                                                        </text>
                                                    );
                                                })}

                                                {/* Area path */}
                                                {areaPath && (
                                                    <path
                                                        d={areaPath}
                                                        fill="url(#greenGrad)"
                                                    />
                                                )}

                                                {/* Line path */}
                                                {linePath && (
                                                    <path
                                                        d={linePath}
                                                        fill="none"
                                                        stroke="#22c55e"
                                                        strokeWidth="1.5"
                                                    />
                                                )}
                                            </svg>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Right Chart: Mean API Response Speed */}
                            <div className='p-5 rounded-lg bg-panel-hover/60 border border-border-hover space-y-4 flex flex-col justify-between'>
                                <header className='flex items-center justify-between'>
                                    <div>
                                        <p className='uppercase text-[10px] text-text-muted font-mono tracking-wider'>Performance Metric</p>
                                        <h3 className='flex flex-row gap-2 items-center justify-start text-xs mt-0.5 font-bold'>
                                            <Cpu className='text-method-post size-3.5' />
                                            Mean API Response Speed (7D)
                                        </h3>
                                    </div>
                                    <span className='text-[10px] text-text-muted font-mono'>totalLatency / totalRequests</span>
                                </header>
                                <div className='w-full h-[180px]'>
                                    {(() => {
                                        const list = getDailyStatsList();
                                        const rawMax = Math.max(...list.map(d => d.averageLatency), 0);
                                        const maxY = Math.max(getNiceMax(rawMax), 40);

                                        const width = 500;
                                        const height = 180;
                                        const marginLeft = 45;
                                        const marginRight = 15;
                                        const marginTop = 15;
                                        const marginBottom = 30;

                                        const chartWidth = width - marginLeft - marginRight;
                                        const chartHeight = height - marginTop - marginBottom;

                                        const points = list.map((d, i) => {
                                            const x = marginLeft + (i / 6) * chartWidth;
                                            const y = marginTop + chartHeight - (d.averageLatency / maxY) * chartHeight;
                                            return { x, y };
                                        });

                                        const linePath = getBezierPath(points);
                                        const yLabels = [maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0];

                                        return (
                                            <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-full text-text-muted select-none'>
                                                {/* Grid Lines */}
                                                {yLabels.map((val, idx) => {
                                                    const y = marginTop + (idx / 4) * chartHeight;
                                                    return (
                                                        <line
                                                            key={`h-line-${idx}`}
                                                            x1={marginLeft}
                                                            y1={y}
                                                            x2={width - marginRight}
                                                            y2={y}
                                                            stroke="#27272a"
                                                            strokeDasharray="4 4"
                                                            strokeWidth="1"
                                                        />
                                                    );
                                                })}

                                                {list.map((_, i) => {
                                                    const x = marginLeft + (i / 6) * chartWidth;
                                                    return (
                                                        <line
                                                            key={`v-line-${i}`}
                                                            x1={x}
                                                            y1={marginTop}
                                                            x2={x}
                                                            y2={marginTop + chartHeight}
                                                            stroke="#27272a"
                                                            strokeDasharray="4 4"
                                                            strokeWidth="1"
                                                        />
                                                    );
                                                })}

                                                {/* Y Axis Labels */}
                                                {yLabels.map((val, idx) => {
                                                    const y = marginTop + (idx / 4) * chartHeight;
                                                    return (
                                                        <text
                                                            key={`y-label-${idx}`}
                                                            x={marginLeft - 8}
                                                            y={y + 3.5}
                                                            fill="#71717a"
                                                            className="font-mono text-[9px] font-medium"
                                                            textAnchor="end"
                                                        >
                                                            {val}ms
                                                        </text>
                                                    );
                                                })}

                                                {/* X Axis Labels */}
                                                {list.map((d, i) => {
                                                    const x = marginLeft + (i / 6) * chartWidth;
                                                    return (
                                                        <text
                                                            key={`x-label-${i}`}
                                                            x={x}
                                                            y={marginTop + chartHeight + 15}
                                                            fill="#71717a"
                                                            className="font-mono text-[9px] font-medium"
                                                            textAnchor="middle"
                                                        >
                                                            {formatDateLabel(d.date)}
                                                        </text>
                                                    );
                                                })}

                                                {/* Line path */}
                                                {linePath && (
                                                    <path
                                                        d={linePath}
                                                        fill="none"
                                                        stroke="#f59e0b"
                                                        strokeWidth="1.5"
                                                    />
                                                )}

                                                {/* Dots */}
                                                {points.map((p, i) => (
                                                    <circle
                                                        key={`point-${i}`}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r="3.5"
                                                        fill="#f59e0b"
                                                        stroke="#09090b"
                                                        strokeWidth="1.5"
                                                    />
                                                ))}
                                            </svg>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Req Distribution Tables */}
                        <div className='w-full grid grid-cols-2 gap-6'>
                            {/* HTTP Method Frequencies */}
                            <div className='p-5 rounded-lg bg-panel-hover/60 border border-border-hover space-y-4'>
                                <header>
                                    <p className='uppercase text-[10px] text-text-muted font-mono tracking-wider'>Routing Distribution</p>
                                    <h3 className='flex flex-row gap-2 items-center justify-start text-xs mt-0.5 font-bold'><Layers className='text-method-put size-3.5' />HTTP Method Frequencies</h3>
                                </header>

                                <div className='space-y-3.5 pt-1'>
                                    {([
                                        "GET", "POST", "PUT", "DELETE", "PATCH"
                                    ] as const).map((method) => (
                                        <div
                                            key={method}
                                            className='space-y-1'
                                        >
                                            <div className='flex justify-between text-xs font-mono text-text-grey'>
                                                {/* Method Name */}
                                                <p>{method} calls</p>
                                                {/* Its percentage */}
                                                <p className='text-[11px] text-text-muted'>{`${metrics.methods[method]} (${getMethodStatPercentage(method)}%)`}</p>
                                            </div>

                                            <div className='h-1.5 w-full border border-border-dark bg-background rounded-full overflow-hidden'>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${getMethodStatPercentage(method)}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className={`bg-method-${method.toLowerCase()} h-full`}
                                                >
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Response status Distribution */}
                            <div className='p-5 rounded-lg bg-panel-hover/60 border border-border-hover space-y-4'>
                                <header>
                                    <p className='uppercase text-[10px] text-text-muted font-mono tracking-wider'>Response Analysis</p>
                                    <h3 className='flex flex-row gap-2 items-center justify-start text-xs mt-0.5 font-bold'><CircleAlert className='text-method-patch size-3.5' />Response Status Distribution</h3>
                                </header>

                                <div className='space-y-3.5 pt-1'>
                                    {([
                                        {
                                            res: "2xx",
                                            status: "Success",
                                            bgClass: "bg-success"
                                        },
                                        {
                                            res: "3xx",
                                            status: "Redirect",
                                            bgClass: "bg-method-put"
                                        },
                                        {
                                            res: "4xx",
                                            status: "Client Err",
                                            bgClass: "bg-method-post"
                                        },
                                        {
                                            res: "5xx",
                                            status: "Server Err",
                                            bgClass: "bg-danger"
                                        }

                                    ] as const).map((code) => (
                                        <div
                                            key={code.res}
                                            className='space-y-1'
                                        >
                                            <div className='flex justify-between text-xs font-mono text-text-grey'>
                                                {/* Response Status */}
                                                <p>{code.res} {code.status}</p>
                                                {/* Its percentage */}
                                                <p className='text-[11px] text-text-muted text- '>{`${metrics.statusCodes[code.res]} (${getResponseCodePercentage(code.res)}%)`}</p>
                                            </div>

                                            <div className='h-1.5 w-full border border-border-dark bg-background rounded-full overflow-hidden'>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${getResponseCodePercentage(code.res)}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className={`${code.bgClass} h-full`}
                                                >
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </Suspense>
        </div>
    )
}
