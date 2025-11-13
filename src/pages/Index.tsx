import { IncassiTabs } from "@/components/IncassiTabs";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="py-4 shadow bg-white flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold text-center flex-1">Gestione Incassi Corse</h1>
        <div className="flex-1 flex justify-end">
          <UserMenu />
        </div>
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