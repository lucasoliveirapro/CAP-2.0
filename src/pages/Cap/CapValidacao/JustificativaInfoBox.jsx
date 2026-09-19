import { StatusBadge } from "./StatusBadge";

const InfoField = ({ label, value }) => (
  <p>
    <strong>{label}:</strong> {value ?? "-"}
  </p>
);

export const JustificativaInfoBox = ({ justificativa, latestHistory, editableData, handleChange, isFinalized = false }) => {
  const interventor = justificativa.interventor;

  return (
    <div className="validation-info-box">
      <InfoField label="Linha" value={justificativa.linha} />
      <InfoField label="Data" value={new Date(justificativa.data).toLocaleDateString("pt-BR")} />
      <InfoField label="Hora" value={justificativa.hora} />
      <p>
        <strong>Duração:</strong>{" "}
        {isFinalized ? (
          editableData?.duracao ?? "-"
        ) : (
          <input
            type="text"
            value={editableData?.duracao ?? ""}
            onChange={(event) => handleChange("duracao", event.target.value)}
            placeholder="HH:MM:SS"
            maxLength={8}
            style={{ width: "90px", padding: "4px 6px" }}
          />
        )}
      </p>
      <InfoField label="Responsável" value={justificativa.responsavel} />
      <InfoField label="Status" value={<StatusBadge textstatus={justificativa.status?.nome} status={justificativa.status?.texto} />} />
      <InfoField label="Validador" value={justificativa.validador} />
      {interventor && <InfoField label="Interventor" value={justificativa.interventor} />}
      <InfoField label="Criador" value={latestHistory.criador?.nome ?? "-"} />
    </div>
  );
};
