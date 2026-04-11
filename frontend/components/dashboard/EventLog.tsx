"use client";

import React from "react";
import { ScrollText, Info, AlertTriangle, CheckCircle, PlusCircle } from "lucide-react";
import clsx from "clsx";

export interface LogEntry {
    id: string;
    message: string;
    type: "info" | "warning" | "success" | "action";
    timestamp: Date;
}

interface EventLogProps {
    logs: LogEntry[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
    return (
        <div className="card flex flex-col h-[300px] overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between bg-background-surface">
                <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-foreground-primary" />
                    System Event Log
                </h3>
                <span className="text-[10px] font-medium text-foreground-muted">Recent 10 events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-foreground-muted gap-2">
                        <Info className="w-5 h-5 opacity-30" />
                        <p className="text-[10px]">No events recorded yet</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={clsx(
                                "p-2 rounded-lg border text-xs transition-all animate-slide-in-top",
                                log.type === "info" && "bg-info-muted border-info/20 text-info",
                                log.type === "warning" && "bg-warning-muted border-warning/20 text-warning",
                                log.type === "success" && "bg-success-muted border-success/20 text-success",
                                log.type === "action" && "bg-accent-muted border-accent/20 text-accent"
                            )}
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5">
                                    {log.type === "info" && <Info className="w-3 h-3" />}
                                    {log.type === "warning" && <AlertTriangle className="w-3 h-3" />}
                                    {log.type === "success" && <CheckCircle className="w-3 h-3" />}
                                    {log.type === "action" && <PlusCircle className="w-3 h-3" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium leading-tight">{log.message}</p>
                                    <p className="text-[9px] text-foreground-muted mt-1">
                                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventLog;
