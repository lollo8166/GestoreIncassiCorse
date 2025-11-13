import { IncassiTabs } from "@/components/IncassiTabs";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="py-4 shadow bg-white">
        <h1 className="text-2xl font-bold text-center">Gestione Incassi Corse</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start">
        <IncassiTabs />
      </main>
      <footer>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;