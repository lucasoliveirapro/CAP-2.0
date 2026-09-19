const HISTORY_COLUMNS = ["Data/Hora", "Causa Raiz", "Tipo de Perda", "Máquina", "Componente", "Modo de Falha", "Responsável", "Comentário", "Criador"];

const HistoryRow = ({ item }) => (
  <tr>
    <td>{item.criadoEm ? new Date(item.criadoEm).toLocaleString("pt-BR") : "-"}</td>
    <td>{item.causaRaiz || "-"}</td>
    <td>{item.tipoPerdaCap ?? item.tipo_perda_cap ?? "-"}</td>
    <td>{item.maquina || "-"}</td>
    <td>{item.componente || "-"}</td>
    <td>{item.descricao || "-"}</td>
    <td>{item.responsavel || "-"}</td>
    <td className="comment-cell">{item.comentario || "-"}</td>
    <td>{item.criador?.nome || "-"}</td>
  </tr>
);

export const HistoryTable = ({ historico }) => {
  if (!historico.length) return null;

  return (
    <div className="validation-history">
      <h3 className="validation-section-title">Histórico de Alterações ({historico.length})</h3>
      <div className="table-responsive">
        <table className="validation-table">
          <thead>
            <tr>
              {HISTORY_COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...historico].reverse().map((item, index) => (
              <HistoryRow key={item.id ?? index} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
