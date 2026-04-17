"use client";

import { useMemo, useState } from "react";
import { DiffCompare } from "../components/DiffCompare";
import { HowItWorks } from "../components/HowItWorks";
import { formatTasksForDisplay, transformNotes, type FlowFixResult } from "../lib/flowfix";

const sampleInput = `quick catch-up with sara: decide timeline for onboarding demo
check dev branch for the build issue, fix install script asap
follow up with design about menu labels
schedule product sync for friday
note: add more examples to the pitch deck
review analytics once the data pipeline is green`;

const stepLabels = ["Input", "Processing", "Output"];

export default function HomePage() {
  const [inputText, setInputText] = useState(sampleInput);
  const [result, setResult] = useState<FlowFixResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const outputText = useMemo(() => {
    if (!result) {
      return "Paste messy notes and tap FlowFix to see the structured action items here.";
    }
    return formatTasksForDisplay(result.actionItems);
  }, [result]);

  const handleProcess = () => {
    setIsProcessing(true);
    setActiveStep(2);
    window.setTimeout(() => {
      setResult(transformNotes(inputText));
      setIsProcessing(false);
      setActiveStep(3);
    }, 260);
  };

  const taskCount = result?.actionItems.length ?? 0;
  const confidence = result?.confidence ?? 0;
  const timeSaved = result?.timeSavedMinutes ?? 0;

  return (
    <main className="min-h-screen px-6 py-10 text-slate-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 shadow-soft backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">FlowFix</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Turn chaos into clarity — instantly.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                FlowFix converts messy notes into clean, prioritized action items with exact change visibility, confidence scoring, and time-saved estimates.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 text-slate-300 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Demo flow</p>
              <div className="mt-4 grid gap-3">
                {stepLabels.map((label, index) => (
                  <div key={label} className="flex items-center gap-4 rounded-3xl border px-4 py-3 text-sm">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${activeStep === index + 1 ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {index + 1}
                    </div>
                    <span className={activeStep === index + 1 ? "text-white" : "text-slate-500"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">1. Input</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Paste the messy notes</h2>
                </div>
                <button
                  onClick={() => setInputText(sampleInput)}
                  className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                >
                  Load sample
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                rows={12}
                className="w-full resize-none rounded-[1.75rem] border border-slate-800 bg-slate-950/95 p-5 text-sm text-slate-100 outline-none ring-2 ring-transparent transition focus:border-brand-500 focus:ring-brand-300/20"
                aria-label="Paste messy notes"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Time saved</p>
                <p className="mt-4 text-3xl font-semibold text-white">{timeSaved} min</p>
                <p className="mt-2 text-sm text-slate-400">Estimated time saved by avoiding manual cleanup.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Confidence</p>
                <p className="mt-4 text-3xl font-semibold text-white">{confidence}%</p>
                <p className="mt-2 text-sm text-slate-400">Output quality is scored from deterministic parsing and task signal strength.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">2. Processing</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Transform notes quickly</h2>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {activeStep === 2 ? "Working" : activeStep === 3 ? "Done" : "Ready"}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                FlowFix applies deterministic rules first, then refines the result with structured AI guidance. Exact prompt details are shown below.
              </p>
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing}
                className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {isProcessing ? "Processing…" : "Run FlowFix"}
              </button>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Prompt engine</p>
              <pre className="mt-4 rounded-3xl bg-slate-900/90 p-4 text-xs leading-6 text-slate-200">
                {result?.prompt ?? `Extract structured tasks from messy notes. Return clean action items with priority and category. No extra prose.`}
              </pre>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">3. Output</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Clean action item summary</h2>
              </div>
              <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                {taskCount} item{taskCount === 1 ? "" : "s"} extracted
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">Use FlowFix output directly in task trackers, meeting notes, or sprint planning. Every change is visible in the before/after diff.</p>
          </div>

          <DiffCompare original={inputText} structured={outputText} highlights={result?.highlightMap ?? {}} />

          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Clean output</p>
              <pre className="mt-4 whitespace-pre-wrap rounded-3xl bg-slate-900/90 p-5 text-sm leading-6 text-slate-100">
                {outputText}
              </pre>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Explanation</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p>FlowFix detects task cues, urgency signals, and deadline language, then converts them into structured action items.</p>
                <p>The deterministic rules ensure consistency first; the AI-style prompt refines output wording and category labels second.</p>
                <p>Every result is transparent: you can see the exact prompt and the changes applied.</p>
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
      </div>
    </main>
  );
}
