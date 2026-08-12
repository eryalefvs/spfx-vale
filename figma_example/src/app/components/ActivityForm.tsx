import { useState } from "react";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { getProcedure, getPro } from "../data/procedures";

interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date" | "checkbox";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const proFormFields: Record<string, Field[]> = {
  "PRO-001107": [
    { id: "local", label: "Local / Site", type: "text", placeholder: "Ex: Sala de Baterias — Torre A", required: true },
    { id: "data", label: "Data da Manutenção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "modelo", label: "Modelo da Bateria", type: "text", placeholder: "Ex: VRLA 12V/200Ah" },
    { id: "qtd", label: "Quantidade de Baterias", type: "number", placeholder: "0" },
    { id: "tensao", label: "Tensão Medida (V)", type: "number", placeholder: "0.00" },
    { id: "densidade", label: "Densidade do Eletrólito", type: "number", placeholder: "1.28" },
    { id: "temp", label: "Temperatura Ambiente (°C)", type: "number", placeholder: "25" },
    { id: "status", label: "Estado Geral", type: "select", options: ["Bom", "Regular", "Crítico", "Substituída"], required: true },
    { id: "proxima", label: "Próxima Manutenção", type: "date" },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Registre anomalias, substituições ou recomendações..." },
  ],
  "PRO-001116": [
    { id: "local", label: "Local / Armário", type: "text", placeholder: "Ex: Armário A3 — Prédio 2", required: true },
    { id: "data", label: "Data da Inspeção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "tensao_entrada", label: "Tensão de Entrada (V)", type: "number", placeholder: "220" },
    { id: "tensao_saida", label: "Tensão de Saída (VCC)", type: "number", placeholder: "48" },
    { id: "corrente", label: "Corrente de Carga (A)", type: "number", placeholder: "0.00" },
    { id: "temp", label: "Temperatura Interna (°C)", type: "number", placeholder: "35" },
    { id: "ventilacao", label: "Ventilação", type: "select", options: ["Normal", "Obstruída", "Defeituosa"], required: true },
    { id: "status", label: "Estado Geral", type: "select", options: ["Conforme", "Não Conforme", "Pendente"], required: true },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Descreva anomalias ou ações corretivas..." },
  ],
  "PRO-001125": [
    { id: "local", label: "Local / Abrigo", type: "text", placeholder: "Ex: Abrigo Retificador — Site 04", required: true },
    { id: "data", label: "Data da Inspeção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "fabricante", label: "Fabricante", type: "text", placeholder: "Ex: Eltek, Emerson" },
    { id: "modelo", label: "Modelo do Retificador", type: "text", placeholder: "Ex: Flatpack2" },
    { id: "tensao_saida", label: "Tensão de Saída (VCC)", type: "number", placeholder: "48.5" },
    { id: "corrente_carga", label: "Corrente de Carga (A)", type: "number", placeholder: "0.00" },
    { id: "alarmes", label: "Alarmes Ativos", type: "select", options: ["Nenhum", "Alarme menor", "Alarme maior", "Crítico"], required: true },
    { id: "limpeza", label: "Limpeza Realizada", type: "checkbox" },
    { id: "status", label: "Estado Geral", type: "select", options: ["Conforme", "Não Conforme", "Substituído"], required: true },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Registre falhas, ajustes ou substituições..." },
  ],
  "PRO-001126": [
    { id: "local", label: "Local / Abrigo", type: "text", placeholder: "Ex: Abrigo Sinalização — KM 42", required: true },
    { id: "data", label: "Data da Inspeção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "tensao_entrada", label: "Tensão de Entrada (V)", type: "number", placeholder: "127" },
    { id: "tensao_bus", label: "Tensão do Barramento (VCC)", type: "number", placeholder: "48" },
    { id: "disjuntores", label: "Estado dos Disjuntores", type: "select", options: ["Normal", "Aquecido", "Defeituoso", "Substituído"] },
    { id: "aterramento", label: "Aterramento", type: "select", options: ["Conforme", "Não Conforme", "Pendente revisão"], required: true },
    { id: "status", label: "Estado Geral do Painel", type: "select", options: ["Conforme", "Não Conforme", "Crítico"], required: true },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Registre irregularidades ou ações corretivas..." },
  ],
  "PRO-001131": [
    { id: "local", label: "Local / Rack", type: "text", placeholder: "Ex: Sala TI — Rack 02", required: true },
    { id: "data", label: "Data da Manutenção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "modelo_switch", label: "Modelo do Switch AFS", type: "text", placeholder: "Ex: AFS 2000" },
    { id: "firmware", label: "Versão de Firmware", type: "text", placeholder: "v2.4.1" },
    { id: "portas_ativas", label: "Portas Ativas", type: "number", placeholder: "24" },
    { id: "latencia", label: "Latência Média (ms)", type: "number", placeholder: "5" },
    { id: "status_link", label: "Status dos Links", type: "select", options: ["Todos UP — Normal", "Degradado", "Porta(s) DOWN"], required: true },
    { id: "limpeza", label: "Limpeza Realizada", type: "checkbox" },
    { id: "status", label: "Estado Geral", type: "select", options: ["Conforme", "Não Conforme", "Substituído"], required: true },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Descreva anomalias ou ações executadas..." },
  ],
  "PRO-001132": [
    { id: "local", label: "Local / Painel", type: "text", placeholder: "Ex: Sala de Telecom — Painel MUX", required: true },
    { id: "data", label: "Data da Manutenção", type: "date", required: true },
    { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
    { id: "fabricante", label: "Fabricante / Modelo", type: "text", placeholder: "Ex: Padtec, ECI" },
    { id: "tributarios_ativos", label: "Tributários Ativos", type: "number", placeholder: "16" },
    { id: "alarmes", label: "Alarmes Ativos", type: "select", options: ["Nenhum", "Alarme menor", "Alarme maior", "Crítico"], required: true },
    { id: "sincronismo", label: "Sincronismo", type: "select", options: ["OK — Livre", "OK — Escravo", "Perda de sincronismo"], required: true },
    { id: "backup", label: "Backup de Configuração", type: "checkbox" },
    { id: "status", label: "Estado Geral", type: "select", options: ["Conforme", "Não Conforme", "Em manutenção"], required: true },
    { id: "obs", label: "Observações", type: "textarea", placeholder: "Registre falhas, tributários com problema ou trocas de peça..." },
  ],
};

/* Fallback generic fields if PRO not mapped */
const defaultFields: Field[] = [
  { id: "local", label: "Local", type: "text", placeholder: "Local da atividade", required: true },
  { id: "data", label: "Data", type: "date", required: true },
  { id: "tecnico", label: "Técnico Responsável", type: "text", placeholder: "Nome completo", required: true },
  { id: "status", label: "Status", type: "select", options: ["Conforme", "Não Conforme", "Pendente"], required: true },
  { id: "obs", label: "Observações", type: "textarea", placeholder: "Descreva a atividade realizada..." },
];

interface ActivityFormProps {
  procedureId: string;
  proId: string;
  onBack: () => void;
}

export function ActivityForm({ procedureId, proId, onBack }: ActivityFormProps) {
  const proc = getProcedure(procedureId);
  const pro = getPro(procedureId, proId);
  const fields = proFormFields[proId] ?? defaultFields;

  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(id: string, val: string | boolean) {
    setValues((v) => ({ ...v, [id]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-8">
        <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-md w-full shadow-sm">
          <div className="flex justify-center mb-4">
            <CheckCircle2 size={52} style={{ color: proc?.barColor ?? "#007E7A" }} />
          </div>
          <h2 className="text-foreground mb-2" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Atividade Registrada
          </h2>
          <p className="text-muted-foreground mb-1" style={{ fontSize: "0.875rem" }}>
            {pro?.title ?? proId}
          </p>
          <p className="text-muted-foreground mb-6" style={{ fontSize: "0.8125rem" }}>
            O procedimento foi salvo com sucesso no sistema.
          </p>
          <button
            onClick={onBack}
            className="w-full rounded-lg px-4 py-2.5 text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: proc?.barColor ?? "#007E7A", fontSize: "0.875rem", fontWeight: 500 }}
          >
            Voltar ao Procedimento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span style={{ fontSize: "0.875rem" }}>Voltar</span>
      </button>

      <div className="flex items-center gap-2 mb-1">
        <span
          className="px-2 py-0.5 rounded"
          style={{ backgroundColor: `${proc?.barColor ?? "#007E7A"}20`, color: proc?.iconColor ?? "#007E7A", fontSize: "0.65rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}
        >
          {proId}
        </span>
      </div>
      <h1 className="text-foreground mb-1" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
        Nova Atividade
      </h1>
      <p className="text-muted-foreground mb-8" style={{ fontSize: "0.875rem" }}>
        {pro?.title ?? proId}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-xl overflow-hidden max-w-2xl" style={{ borderTopColor: proc?.barColor, borderTopWidth: 3 }}>
          <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5">
            {fields.map((field) => {
              if (field.type === "textarea") {
                return (
                  <div key={field.id} className="col-span-2">
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                      {field.label}
                    </label>
                    <textarea
                      value={(values[field.id] as string) || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 transition-shadow"
                      style={{ fontSize: "0.875rem", backgroundColor: "var(--input-background)", focusRingColor: proc?.barColor }}
                    />
                  </div>
                );
              }
              if (field.type === "checkbox") {
                return (
                  <div key={field.id} className="col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={field.id}
                      checked={(values[field.id] as boolean) || false}
                      onChange={(e) => handleChange(field.id, e.target.checked)}
                      className="w-4 h-4"
                      style={{ accentColor: proc?.barColor ?? "#007E7A" }}
                    />
                    <label htmlFor={field.id} className="text-foreground cursor-pointer" style={{ fontSize: "0.875rem" }}>
                      {field.label}
                    </label>
                  </div>
                );
              }
              if (field.type === "select") {
                return (
                  <div key={field.id}>
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <select
                      value={(values[field.id] as string) || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.required}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 transition-shadow"
                      style={{ fontSize: "0.875rem", backgroundColor: "var(--input-background)" }}
                    >
                      <option value="">Selecionar...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <div key={field.id}>
                  <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={(values[field.id] as string) || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow"
                    style={{ fontSize: "0.875rem", backgroundColor: "var(--input-background)" }}
                  />
                </div>
              );
            })}
          </div>

          <div className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ fontSize: "0.875rem", fontWeight: 500, backgroundColor: proc?.barColor ?? "#007E7A" }}
            >
              <Save size={15} />
              Salvar Registro
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
