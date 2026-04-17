"use client";

import React from "react";

type DiffCompareProps = {
  original: string;
  structured: string;
  highlights: Record<string, boolean>;
};


export function DiffCompare({ original, structured, highlights }: DiffCompareProps) {
  const originalLines = original
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.trim());

  const structuredLines = structured
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.trim());

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Before</p>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Raw input</span>
        </div>
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          {originalLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              className={`rounded-2xl px-3 py-2 ${highlights[line] ? "bg-emerald-100 text-emerald-900" : "bg-slate-50 text-slate-700"}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-slate-950/95 p-6 shadow-soft text-white">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">After</p>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">Clean output</span>
        </div>
        <div className="space-y-3 text-sm leading-6 text-slate-100">
          {structuredLines.map((line, index) => (
            <div key={`${line}-${index}`} className="rounded-2xl bg-slate-900/70 px-3 py-2 transition-colors duration-200 hover:bg-white/5">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
