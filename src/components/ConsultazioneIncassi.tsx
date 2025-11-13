import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./SessionContextProvider";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CARD_STYLE = "flex-1 min-w-[140px] bg-secondary p-4 rounded-lg shadow text-center";
const SMALL_CARD_STYLE = "bg-secondary p-3 rounded-lg shadow text-center flex flex-col items-center justify-center h-full";

function onlyDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

type SortKey = "data" | "importo" | "tipo";
type SortDir = "asc" | "desc";

const PIE_COLORS = ["#2563eb", "#059669", "#f59e42", "#a21caf"];
const TIPO_LABELS: Record<string, string> = {
  contanti: "Contanti",
  pos: "POS",
  app: "APP",
  globix: "Globix",
};

export const ConsultazioneIncassi = () => {
  const [periodo, setPeriodo] = React.useState("tutto");
  const [tipo, setTipo] = React.useState("tutti");
  const [da, setDa] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [a, setA] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [incassi, setIncassi] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("data");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const session = useSession();

  // Per la responsività del grafico
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Funzione per cancellare un record
  const handleDelete = async (id: string) => {
    const conferma = window.confirm("Sei sicuro di voler cancellare questo incasso?");
    if (!conferma) return;
    const { error } = await supabase.from("incassi").delete().eq("id", id);
    if (error) {
      toast.error("Errore nella cancellazione: " + error.message);
      return;
    }
    setIncassi((prev) => prev.filter((i) => i.id !== id));
    toast.success("Incasso cancellato.");
  };

  // Calcolo intervallo date
  let startDate = new Date();
  let endDate = new Date();
  let useDateFilter = true;
  let filterOggi = false;
  let filterManuale = false;
  if (periodo === "tutto") {
    useDateFilter = false;
  } else if (periodo === "oggi") {
    filterOggi = true;
  } else if (periodo === "7") {
    startDate = subDays(new Date(), 6);
    endDate = new Date();
  } else if (periodo === "30") {
    startDate = subDays(new Date(), 29);
    endDate = new Date();
  } else if (periodo === "manuale") {
    filterManuale = true;
    startDate = new Date(da);
    endDate = new Date(a);
  }

  // Filtro e aggregazione
  let filtered = incassi
    .filter((i) => {
      const d = typeof i.data === "string" ? parseISO(i.data) : i.data;
      let inRange = true;
      if (filterOggi) {
        inRange = isSameDay(d, new Date());
      } else if (filterManuale) {
        // Confronta solo la parte di data, ignorando l'orario
        const dDate = onlyDate(d);
        const start = onlyDate(startDate);
        const end = onlyDate(endDate);
        inRange = dDate >= start && dDate <= end;
      } else if (useDateFilter) {
        inRange = isWithinInterval(d, { start: startDate, end: endDate });
      }
      const tipoMatch = tipo === "tutti" ? true : i.tipo === tipo;
      return inRange && tipoMatch;
    });

  // Ordinamento
  filtered = filtered.sort((a, b) => {
    let res = 0;
    if (sortKey === "data") {
      const da = typeof a.data === "string" ? parseISO(a.data) : a.data;
      const db = typeof b.data === "string" ? parseISO(b.data) : b.data;
      res = da.getTime() - db.getTime();
    } else if (sortKey === "importo") {
      res = Number(a.importo) - Number(b.importo);
    } else if (sortKey === "tipo") {
      res = (a.tipo || "").localeCompare(b.tipo || "");
    }
    return sortDir === "asc" ? res : -res;
  });

  const totali = {
    totale: filtered.reduce((sum, i) => sum + Number(i.importo), 0),
    contanti: filtered.filter(i => i.tipo === "contanti").reduce((sum, i) => sum + Number(i.importo), 0),
    pos: filtered.filter(i => i.tipo === "pos").reduce((sum, i) => sum + Number(i.importo), 0),
    app: filtered.filter(i => i.tipo === "app").reduce((sum, i) => sum + Number(i.importo), 0),
    globix: filtered.filter(i => i.tipo === "globix").reduce((sum, i) => sum + Number(i.importo), 0),
  };

  // Dati per il grafico a torta
  const pieData = [
    { tipo: "contanti", value: totali.contanti },
    { tipo: "pos", value: totali.pos },
    { tipo: "app", value: totali.app },
    { tipo: "globix", value: totali.globix },
  ].filter(d => d.value > 0);

  // Funzione export Excel
  const handleExportExcel = () => {
    // Prepara i dati per Excel
    const dataToExport = filtered.map(i => ({
      Data: typeof i.data === "string"
        ? format(parseISO(i.data), "dd/MM/yyyy")
        : format(i.data, "dd/MM/yyyy"),
      Importo: Number(i.importo).toFixed(2).replace(".", ","),
      Tipo:
        i.tipo === "app"
          ? "APP"
          : i.tipo === "globix"
          ? "Globix"
          : i.tipo.charAt(0).toUpperCase() + i.tipo.slice(1),
    }));

    if (dataToExport.length === 0) {
      alert("Nessun dato da esportare per il periodo selezionato.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incassi");
    XLSX.writeFile(wb, "incassi.xlsx");
  };

  // Gestione click intestazione per ordinamento
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "data" ? "desc" : "asc");
    }
  }

  function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return <span className="inline-block w-3" />;
    return dir === "asc" ? (
      <ArrowUp size={14} className="inline-block ml-1 -mt-0.5" />
    ) : (
      <ArrowDown size={14} className="inline-block ml-1 -mt-0.5" />
    );
  }

  // Tooltip personalizzato per la torta
  function PieTooltip({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null;
    const { tipo, value } = payload[0].payload;
    const percent = totali.totale > 0 ? (value / totali.totale) * 100 : 0;
    return (
      <div className="bg-white border rounded shadow px-3 py-2 text-sm">
        <div className="font-semibold">{TIPO_LABELS[tipo]}</div>
        <div>Totale: € {value.toFixed(2)}</div>
        <div>Percentuale: {percent.toFixed(1)}%</div>
      </div>
    );
  }

  // Responsività: nascondi etichette se troppo stretto (<500px)
  const showPieLabels = windowWidth > 500;
  // Raggio dinamico: più grande su mobile
  const pieRadius =
    windowWidth > 700
      ? 110
      : windowWidth > 500
      ? 90
      : 90; // mobile: 90

  // Altezza dinamica: più alta su mobile
  const pieHeight =
    windowWidth > 700
      ? 320
      : windowWidth > 500
      ? 320
      : 380; // mobile: 380px

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="min-w-[150px] flex-1">
          <Label>Periodo</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full min-w-[120px]">
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
          <div className="flex gap-2 items-end min-w-[260px]">
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
        <div className="min-w-[150px] flex-1">
          <Label>Tipo Pagamento</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-full min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti</SelectItem>
              <SelectItem value="contanti">Contanti</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="app">APP</SelectItem>
              <SelectItem value="globix">Globix</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Totale Incassato grande */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="w-full max-w-xs">
          <div className={CARD_STYLE}>
            <div className="text-lg font-semibold">Totale Incassato</div>
            <div className="text-2xl font-bold mt-2">€ {totali.totale.toFixed(2)}</div>
          </div>
        </div>
        {/* Griglia 2x2 per i 4 metodi */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full max-w-xs">
          <div className={SMALL_CARD_STYLE}>
            <div className="text-sm font-medium">Contanti</div>
            <div className="text-base font-semibold mt-1">€ {totali.contanti.toFixed(2)}</div>
          </div>
          <div className={SMALL_CARD_STYLE}>
            <div className="text-sm font-medium">POS</div>
            <div className="text-base font-semibold mt-1">€ {totali.pos.toFixed(2)}</div>
          </div>
          <div className={SMALL_CARD_STYLE}>
            <div className="text-sm font-medium">APP</div>
            <div className="text-base font-semibold mt-1">€ {totali.app.toFixed(2)}</div>
          </div>
          <div className={SMALL_CARD_STYLE}>
            <div className="text-sm font-medium">Globix</div>
            <div className="text-base font-semibold mt-1">€ {totali.globix.toFixed(2)}</div>
          </div>
        </div>
      </div>
      {loading && <div className="mt-4 text-center text-gray-500">Caricamento dati...</div>}

      {/* Titolo e bottone esporta */}
      <div className="mt-8 flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold mb-0">Storico Incassi</h2>
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm font-medium transition-colors"
        >
          Esporta Excel
        </button>
      </div>
      {/* Tabella storico */}
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th
                  className="px-3 py-2 text-left cursor-pointer select-none"
                  onClick={() => handleSort("data")}
                  title="Ordina per data"
                >
                  Data
                  <SortIcon active={sortKey === "data"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-2 text-right cursor-pointer select-none"
                  onClick={() => handleSort("importo")}
                  title="Ordina per importo"
                >
                  Importo (€)
                  <SortIcon active={sortKey === "importo"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-2 text-center cursor-pointer select-none"
                  onClick={() => handleSort("tipo")}
                  title="Ordina per tipo"
                >
                  Tipo
                  <SortIcon active={sortKey === "tipo"} dir={sortDir} />
                </th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Nessun incasso trovato per il periodo selezionato.
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((i) => (
                    <tr key={i.id} className="border-b last:border-b-0 group">
                      <td className="px-3 py-2">
                        {typeof i.data === "string"
                          ? format(parseISO(i.data), "dd/MM/yyyy")
                          : format(i.data, "dd/MM/yyyy")}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {Number(i.importo).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center capitalize">
                        {i.tipo === "app"
                          ? "APP"
                          : i.tipo === "globix"
                          ? "Globix"
                          : i.tipo.charAt(0).toUpperCase() + i.tipo.slice(1)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          title="Cancella"
                          onClick={() => handleDelete(i.id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-3 py-2 text-right">Totale</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {totali.totale.toFixed(2)}
                    </td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pie chart sotto la tabella */}
      <div className="mt-8 flex flex-col items-center w-full">
        <h3 className="text-base font-semibold mb-2">Ripartizione per Tipo di Incasso</h3>
        {pieData.length === 0 ? (
          <div className="text-gray-500 text-sm">Nessun dato da visualizzare.</div>
        ) : (
          <div className="w-full" style={{ minHeight: pieHeight }}>
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={pieRadius}
                  label={showPieLabels
                    ? ({ tipo, value }) => {
                        const percent = totali.totale > 0 ? (value / totali.totale) * 100 : 0;
                        return `${TIPO_LABELS[tipo]}: €${value.toFixed(2)} (${percent.toFixed(1)}%)`;
                      }
                    : false
                  }
                  labelLine={showPieLabels}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={entry.tipo} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};