import { HebrewMapper } from "./features/hebrew-mapper/HebrewMapper";

export function App() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Personal Utils</h1>
          <p className="text-muted-foreground mt-2">A collection of handy tools</p>
        </header>
        <HebrewMapper />
      </div>
    </main>
  );
}
