export function HowItWorks() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">How it works</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">Three crisp steps to clarity</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "1. Paste raw notes",
            description: "Drop messy text, chat snippets, or task dumps into the editor.",
          },
          {
            title: "2. Apply FlowFix rules",
            description: "Deterministic parsing finds tasks, urgency cues, and categories first.",
          },
          {
            title: "3. Review clean output",
            description: "See transformed action items, exact prompt, and time savings instantly.",
          },
        ].map(item => (
          <div key={item.title} className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-5">
            <p className="text-sm font-semibold text-slate-100">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
