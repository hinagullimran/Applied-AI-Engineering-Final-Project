"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

export type AgentStatus = "pending" | "running" | "complete" | "error";

interface PipelineStep {
  agent: string;
  label: string;
  status: AgentStatus;
  details?: string;
}

export default function PipelineProgress({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto my-12 shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        Multi-Agent Orchestration
      </h3>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.agent} className="relative">
            {index < steps.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-800" />
            )}
            
            <div className="flex items-start gap-4">
              <div className="relative z-10">
                {step.status === "complete" ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 bg-slate-950 rounded-full" />
                ) : step.status === "running" ? (
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center ring-2 ring-indigo-500/50">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  </div>
                ) : step.status === "error" ? (
                  <AlertCircle className="w-8 h-8 text-rose-500 bg-slate-950 rounded-full" />
                ) : (
                  <Circle className="w-8 h-8 text-slate-700 bg-slate-950 rounded-full" />
                )}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-semibold ${step.status === "running" ? "text-indigo-400" : "text-slate-300"}`}>
                    {step.label}
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    {step.agent}
                  </span>
                </div>
                {step.details && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-slate-500"
                  >
                    {step.details}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
