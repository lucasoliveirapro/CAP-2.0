import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { formatMinutesToHHMMSS } from "../../../utils/capUtils";

const TreeCard = forwardRef(({ node, isCurrent = false }, ref) => {
  const level = node?.nivel ?? 0;
  const className = isCurrent ? "tree-card tree-card--current" : `tree-card tree-card--rel tree-card--level-${level}`;

  return (
    <div className={className} ref={ref} data-id={node.id}>
      <div className="tree-card__header">
        <span className="tree-card__linha">{node.linha}</span>
        {isCurrent && <span className="tree-card__tag">Esta parada</span>}
        <span className="tree-card__duracao">{formatMinutesToHHMMSS(node.duracao)}</span>
      </div>
      <div className="tree-card__maquina">{node.maquina}</div>
      <div className="tree-card__body">
        {node.causaRaiz && (
          <div className="tree-card__row">
            <span className="tree-card__label">Causa raiz:</span>
            <span className="tree-card__value">{node.causaRaiz}</span>
          </div>
        )}
        {node.modoFalha && node.modoFalha !== "NÃO SE APLICA" && (
          <div className="tree-card__row">
            <span className="tree-card__label">Modo de falha:</span>
            <span className="tree-card__value">{node.modoFalha}</span>
          </div>
        )}
      </div>
    </div>
  );
});

const GraphArrow = ({ x1, y1, x2, y2, type }) => {
  const verticalDistance = Math.abs(y2 - y1);
  const curveOffset = Math.min(verticalDistance * 0.5, 60);
  const path = `M ${x1} ${y1} C ${x1} ${y1 + (y2 > y1 ? curveOffset : -curveOffset)}, ${x2} ${y2 - (y2 > y1 ? curveOffset : -curveOffset)}, ${x2} ${y2}`;
  const color = type === "up" ? "#ef4444" : "#3b82f6";
  const markerId = `arrow-${type}-${Math.round(x1)}-${Math.round(y1)}`;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={color} />
        </marker>
      </defs>
      <path d={path} fill="none" stroke={color} strokeWidth="2" markerEnd={`url(#${markerId})`} opacity="0.6" />
    </g>
  );
};

const useGraphLines = (containerRef, nodeRefsMap, edges) => {
  const [lines, setLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const recomputeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container || !nodeRefsMap.current) return;
    const containerRect = container.getBoundingClientRect();
    setSvgSize({ w: container.offsetWidth, h: container.offsetHeight });

    const getAnchorPoint = (nodeEl, direcao, isSource) => {
      const rect = nodeEl.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = (isSource && direcao === "UP") || (!isSource && direcao === "DOWN") ? rect.top - containerRect.top : rect.bottom - containerRect.top;
      return { x, y };
    };

    const computedLines = edges
      .map((edge) => {
        const fromEl = nodeRefsMap.current.get(edge.from);
        const toEl = nodeRefsMap.current.get(edge.to);
        if (!fromEl || !toEl) return null;
        const from = getAnchorPoint(fromEl, edge.direcao, true);
        const to = getAnchorPoint(toEl, edge.direcao, false);
        return { id: `line-${edge.from}-${edge.to}`, x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: edge.direcao.toLowerCase() };
      })
      .filter(Boolean);

    setLines(computedLines);
  }, [edges, nodeRefsMap, containerRef]);

  useEffect(() => {
    const observer = new ResizeObserver(recomputeLines);
    if (containerRef.current) observer.observe(containerRef.current);
    const timeoutId = setTimeout(recomputeLines, 100);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [recomputeLines, containerRef]);

  return { lines, svgSize };
};

export const CauseEffectGraph = ({ justificativa }) => {
  const nodeRefsMap = useRef(new Map());
  const containerRef = useRef(null);

  if (!justificativa?.grafo) return null;

  const { nodes, edges } = justificativa.grafo;
  const currentId = Number(justificativa.id);

  const nodesWithLevel = nodes.map((node) => {
    const incomingEdge = edges.find((edge) => edge.to === node.id);
    let inferredLevel = 0;
    if (incomingEdge && incomingEdge.direcao === "UP") inferredLevel = -1;
    if (incomingEdge && incomingEdge.direcao === "DOWN") inferredLevel = 1;
    return { ...node, nivel: node.id === currentId ? 0 : node.nivel || inferredLevel };
  });

  const levels = [...new Set(nodesWithLevel.map((node) => node.nivel))].sort((a, b) => a - b);
  const { lines, svgSize } = useGraphLines(containerRef, nodeRefsMap, edges);

  return (
    <div className="relacao-container">
      <h3 className="validation-section-title">Fluxo de Causa e Efeito</h3>
      <div className="relacao-graph" ref={containerRef} style={{ position: "relative" }}>
        <svg className="relacao-graph__svg" width={svgSize.w} height={svgSize.h} style={{ position: "absolute", pointerEvents: "none" }}>
          {lines.map((line) => (
            <GraphArrow key={line.id} {...line} />
          ))}
        </svg>
        {levels.map((level) => (
          <div key={level} className="relacao-graph__level">
            <div className="relacao-graph__level-label">
              {level < 0 ? "Causas Originais" : level > 0 ? "Impactos Gerados" : "Parada Principal"}
            </div>
            <div className="relacao-graph__row">
              {nodesWithLevel
                .filter((node) => node.nivel === level)
                .map((node) => (
                  <TreeCard
                    key={node.id}
                    node={node}
                    isCurrent={node.id === currentId}
                    ref={(el) => (el ? nodeRefsMap.current.set(node.id, el) : nodeRefsMap.current.delete(node.id))}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
