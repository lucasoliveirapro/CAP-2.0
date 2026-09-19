export const getStatusColor = (status) => {
  switch (status) {
    case "PENDENTE_VALIDACAO":
      return "#f0ad4e";
    case "EM_REVISAO":
      return "#0275d8";
    case "FINALIZADA":
      return "#5cb85c";
    default:
      return "#6c757d";
  }
};

export const formatMinutesToHHMM = (minutes) => {
  if (!minutes || isNaN(minutes)) return "00:00";
  const totalMinutes = Math.round(minutes * 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

export const formatMinutesToHHMMSS = (minutes) => {
  if (minutes == null || minutes === "") return "00:00:00";
  const parsed = parseFloat(minutes);
  if (isNaN(parsed)) return "00:00:00";
  const totalSeconds = Math.round(parsed * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
