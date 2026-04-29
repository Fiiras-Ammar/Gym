import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AppMenu } from "./AppMenu";

export const AppLayout = ({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) => {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <AppMenu />
        </div>
        {title && (
          <header className="mb-5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
      <BottomNav />
    </div>
  );
};
