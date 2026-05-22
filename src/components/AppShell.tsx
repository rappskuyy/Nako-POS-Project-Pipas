import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {title && (
          <header className="border-b bg-card px-6 py-4 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </header>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
