import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const CARD_STYLE = "flex-1 min-w-[140px] bg-secondary p-4 rounded-lg shadow text-center";

export const ConsultazioneIncassi = () => {
  // Placeholder: dati mock
  const [periodo, setPeriodo] = React.useState("oggi");
  const [tipo, setTipo] = React.useState("tutti");
  const [da, setDa] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [a, setA] = React.useState(format(new Date(), "yyyy-MM-dd"));

  // Placeholder: dati aggregati mock
  const totali = {
    totale: 0,
    contanti: 0,
    pos: 0,
    app: 0,
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
    </div>
  );
};