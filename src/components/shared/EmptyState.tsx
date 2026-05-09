import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-sky-200 bg-white/85 p-10 text-center shadow-[0_28px_80px_-44px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        {icon}
      </div>
      <div className="mx-auto mt-6 max-w-xl space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="text-base leading-7 text-slate-600">{description}</p>
      </div>
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}
