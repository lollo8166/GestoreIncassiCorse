import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { InserimentoIncasso } from "./InserimentoIncasso";
import { ConsultazioneIncassi } from "./ConsultazioneIncassi";

export const IncassiTabs = () => {
  const [tab, setTab] = React.useState("inserimento");

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-2">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full flex justify-center mb-4">
          <TabsTrigger value="inserimento" className="flex-1">
            Inserimento Dati
          </TabsTrigger>
          <TabsTrigger value="consultazione" className="flex-1">
            Consultazione Dati
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inserimento">
          <Card>
            <CardContent>
              <InserimentoIncasso />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="consultazione">
          <Card>
            <CardContent>
              <ConsultazioneIncassi />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};