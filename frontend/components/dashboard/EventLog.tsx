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
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[300px] overflow-hidden shadow-sm">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-black" />
                    System Event Log
                </h3>
                <span className="text-[10px] font-medium text-gray-400">Recent 10 events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Info className="w-5 h-5 opacity-20" />
                        <p className="text-[10px]">No events recorded yet</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={clsx(
                                "p-2 rounded-lg border text-xs transition-all animate-slide-in-top",
                                log.type === "info" && "bg-blue-50/50 border-blue-100 text-blue-800",
                                log.type === "warning" && "bg-amber-50/50 border-amber-100 text-amber-800",
                                log.type === "success" && "bg-green-50/50 border-green-100 text-green-800",
                                log.type === "action" && "bg-purple-50/50 border-purple-100 text-purple-800"
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
                                    <p className="text-[9px] opacity-60 mt-1">
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
