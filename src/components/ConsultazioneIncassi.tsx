import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./SessionContextProvider";

const CARD_STYLE = "flex-1 min-w-[140px] bg-secondary p-4 rounded-lg shadow text-center";

export const ConsultazioneIncassi = () => {
  const [periodo, setPeriodo] = React.useState("tutto");
  const [tipo, setTipo] = React.useState("tutti");
  const [da, setDa] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [a, setA] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [incassi, setIncassi] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const session = useSession();

  React.useEffect(() => {
    if (!session) return;
    setLoading(true);
    supabase
      .from("incassi")
      .select("*")
      .eq("user_id", session.user.id)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) return;
        setIncassi(data || []);
      });
  }, [session]);

  // Calcolo intervallo date
  let startDate = new Date();
  let endDate = new Date();
  let useDateFilter = true;
  if (periodo === "tutto") {
    useDateFilter = false;
  } else if (periodo === "oggi") {
    startDate = endDate = new Date();
  } else if (periodo === "7") {
    startDate = subDays(new Date(), 6);
    endDate = new Date();
  } else if (periodo === "30") {
    startDate = subDays(new Date(), 29);
    endDate = new Date();
  } else if (periodo === "manuale") {
    startDate = new Date(da);
    endDate = new Date(a);
  }

  // Filtro e aggregazione
  const filtered = incassi
    .filter((i) => {
      const d = typeof i.data === "string" ? parseISO(i.data) : i.data;
      const inRange = !useDateFilter || isWithinInterval(d, { start: startDate, end: endDate });
      const tipoMatch = tipo === "tutti" ? true : i.tipo === tipo;
      return inRange && tipoMatch;
    })
    .sort((a, b) => {
      // Ordina per data decrescente
      const da = typeof a.data === "string" ? parseISO(a.data) : a.data;
      const db = typeof b.data === "string" ? parseISO(b.data) : b.data;
      return db.getTime() - da.getTime();
    });

  const totali = {
    totale: filtered.reduce((sum, i) => sum + Number(i.importo), 0),
    contanti: filtered.filter(i => i.tipo === "contanti").reduce((sum, i) => sum + Number(i.importo), 0),
    pos: filtered.filter(i => i.tipo === "pos").reduce((sum, i) => sum + Number(i.importo), 0),
    app: filtered.filter(i => i.tipo === "app").reduce((sum, i) => sum + Number(i.importo), 0),
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div>
          <Label>Periodo</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutto">Tutto</SelectItem>
              <SelectItem value="oggi">Oggi</SelectItem>
              <SelectItem value="7">Ultimi 7 giorni</SelectItem>
              <SelectItem value="30">Ultimi 30 giorni</SelectItem>
              <SelectItem value="manuale">Da/A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {periodo === "manuale" && (
          <div className="flex gap-2 items-end">
            <div>
              <Label>Da</Label>
              <Input
                type="date"
                value={da}
                onChange={e => setDa(e.target.value)}
                className="w-36"
              />
            </div>
            <div>
              <Label>A</Label>
              <Input
                type="date"
                value={a}
                onChange={e => setA(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        )}
        <div>
          <Label>Tipo Pagamento</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti</SelectItem>
              <SelectItem value="contanti">Contanti</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="app">Applicazione</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className={CARD_STYLE}>
          <div className="text-lg font-semibold">Totale Incassato</div>
          <div className="text-2xl font-bold mt-2">€ {totali.totale.toFixed(2)}</div>
        </div>
        <div className={CARD_STYLE}>
          <div className="text-lg font-semibold">Totale Contanti</div>
          <div className="text-2xl font-bold mt-2">€ {totali.contanti.toFixed(2)}</div>
        </div>
        <div className={CARD_STYLE}>
          <div className="text-lg font-semibold">Totale POS</div>
          <div className="text-2xl font-bold mt-2">€ {totali.pos.toFixed(2)}</div>
        </div>
        <div className={CARD_STYLE}>
          <div className="text-lg font-semibold">Totale App</div>
          <div className="text-2xl font-bold mt-2">€ {totali.app.toFixed(2)}</div>
        </div>
      </div>
      {loading && <div className="mt-4 text-center text-gray-500">Caricamento dati...</div>}

      {/* Tabella storico */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Storico Incassi</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-right">Importo (€)</th>
                <th className="px-3 py-2 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">
                    Nessun incasso trovato per il periodo selezionato.
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      {typeof i.data === "string"
                        ? format(parseISO(i.data), "dd/MM/yyyy")
                        : format(i.data, "dd/MM/yyyy")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {Number(i.importo).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center capitalize">
                      {i.tipo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};