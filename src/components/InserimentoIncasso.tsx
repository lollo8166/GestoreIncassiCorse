import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./SessionContextProvider";

export const InserimentoIncasso = () => {
  const [data, setData] = React.useState<Date>(new Date());
  const [importo, setImporto] = React.useState("");
  const [tipo, setTipo] = React.useState("contanti");
  const [loading, setLoading] = React.useState(false);
  const session = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || isNaN(Number(importo))) {
      toast.error("Inserisci un importo valido.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("incassi").insert([
      {
        user_id: session?.user.id,
        data: format(data, "yyyy-MM-dd"),
        importo: Number(importo),
        tipo,
      },
    ]);
    setLoading(false);
    if (error) {
      toast.error("Errore nel salvataggio: " + error.message);
      return;
    }
    toast.success("Incasso registrato!");
    setImporto("");
    setTipo("contanti");
    setData(new Date());
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Data della Corsa</Label>
        <div>
          <Input
            type="date"
            value={format(data, "yyyy-MM-dd")}
            onChange={e => setData(new Date(e.target.value))}
            className="max-w-xs"
            required
          />
        </div>
      </div>
      <div>
        <Label>Importo (€)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={importo}
          onChange={e => setImporto(e.target.value)}
          placeholder="0.00"
          required
          className="max-w-xs"
        />
      </div>
      <div>
        <Label>Tipo di Pagamento</Label>
        <RadioGroup
          value={tipo}
          onValueChange={setTipo}
          className="flex flex-row gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="contanti" id="contanti" />
            <Label htmlFor="contanti">Contanti</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pos" id="pos" />
            <Label htmlFor="pos">POS</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="app" id="app" />
            <Label htmlFor="app">APP</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="globix" id="globix" />
            <Label htmlFor="globix">Globix</Label>
          </div>
        </RadioGroup>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvataggio..." : "Registra Incasso"}
      </Button>
    </form>
  );
};