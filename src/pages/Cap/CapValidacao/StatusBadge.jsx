import { getStatusColor } from "../../../utils/capUtils";

// `textstatus` is the internal status code (e.g. "PENDENTE_VALIDACAO") used
// to pick the badge color; `status` is the human-readable label to display.
export const StatusBadge = ({ textstatus, status }) => {
  const color = getStatusColor(textstatus);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.3px",
        whiteSpace: "normal",
        color: "#fff",
        backgroundColor: color,
        textAlign: "center",
      }}
    >
      {status || "-"}
    </span>
  );
};
