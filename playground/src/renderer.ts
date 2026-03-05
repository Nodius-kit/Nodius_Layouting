import type { LayoutInput, LayoutResult, NodeOutput, EdgeOutput, Point } from 'nodius-layouting';

const PADDING = 40;
const ARROW_SIZE = 8;

export function renderInput(container: HTMLElement, input: LayoutInput): void {
  // Render input with a simple grid placement (before layout)
  const tempNodes: NodeOutput[] = input.nodes.map((n, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return {
      id: n.id,
      x: col * 200 + 20,
      y: row * 150 + 20,
      width: n.width,
      height: n.height,
      handles: n.handles.map(h => {
        const offset = h.offset ?? 0.5;
        let hx = 0, hy = 0;
        const nx = col * 200 + 20;
        const ny = row * 150 + 20;
        switch (h.position) {
          case 'top': hx = nx + offset * n.width; hy = ny; break;
          case 'bottom': hx = nx + offset * n.width; hy = ny + n.height; break;
          case 'left': hx = nx; hy = ny + offset * n.height; break;
          case 'right': hx = nx + n.width; hy = ny + offset * n.height; break;
        }
        return { id: h.id, type: h.type, position: h.position, x: hx, y: hy };
      }),
    };
  });

  const tempEdges: EdgeOutput[] = input.edges.map(e => {
    const fromNode = tempNodes.find(n => n.id === e.from);
    const toNode = tempNodes.find(n => n.id === e.to);
    const fromHandle = fromNode?.handles.find(h => h.id === e.fromHandle);
    const toHandle = toNode?.handles.find(h => h.id === e.toHandle);
    return {
      id: e.id,
      from: e.from,
      to: e.to,
      fromHandle: e.fromHandle,
      toHandle: e.toHandle,
      points: [
        fromHandle ? { x: fromHandle.x, y: fromHandle.y } : { x: 0, y: 0 },
        toHandle ? { x: toHandle.x, y: toHandle.y } : { x: 0, y: 0 },
      ],
    };
  });

  renderSVG(container, { nodes: tempNodes, edges: tempEdges });
}

export function renderResult(container: HTMLElement, result: LayoutResult): void {
  renderSVG(container, result);
}

function renderSVG(container: HTMLElement, result: LayoutResult): void {
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const node of result.nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  for (const edge of result.edges) {
    for (const p of edge.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 400; maxY = 300;
  }

  const width = maxX - minX + PADDING * 2;
  const height = maxY - minY + PADDING * 2;
  const offsetX = -minX + PADDING;
  const offsetY = -minY + PADDING;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);

  // Arrow marker
  parts.push(`<defs><marker id="arrowhead" markerWidth="${ARROW_SIZE}" markerHeight="${ARROW_SIZE}" refX="${ARROW_SIZE}" refY="${ARROW_SIZE / 2}" orient="auto"><polygon points="0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}" class="edge-arrow"/></marker></defs>`);

  // Render edges first (behind nodes) using bezier curves
  for (const edge of result.edges) {
    if (edge.points.length < 2) continue;
    const pts = edge.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
    const pathData = pointsToBezierPath(pts);
    parts.push(`<path d="${pathData}" class="edge-path" marker-end="url(#arrowhead)"/>`);
  }

  // Render nodes
  for (const node of result.nodes) {
    const nx = node.x + offsetX;
    const ny = node.y + offsetY;

    // Node rectangle
    parts.push(`<rect x="${nx}" y="${ny}" width="${node.width}" height="${node.height}" class="node-rect" rx="6" ry="6"/>`);

    // Node label
    const labelX = nx + node.width / 2;
    const labelY = ny + node.height / 2;
    const label = escapeXml(node.id);
    parts.push(`<text x="${labelX}" y="${labelY}" class="node-label">${label}</text>`);

    // Handles
    for (const handle of node.handles) {
      const hx = handle.x + offsetX;
      const hy = handle.y + offsetY;
      const cls = handle.type === 'input' ? 'handle-input' : 'handle-output';
      parts.push(`<circle cx="${hx}" cy="${hy}" class="handle-dot ${cls}"/>`);
    }
  }

  parts.push('</svg>');
  container.innerHTML = parts.join('\n');
}

/**
 * Convert a series of waypoints into a smooth cubic bezier SVG path.
 * Uses Catmull-Rom-to-Bezier conversion for interior segments,
 * and simple cubic curves for the first/last segments.
 */
function pointsToBezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    const [a, b] = pts;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Single cubic bezier with control points at 1/3 and 2/3
    const c1x = a.x + dx * 0.3;
    const c1y = a.y + dy * 0.3;
    const c2x = a.x + dx * 0.7;
    const c2y = a.y + dy * 0.7;
    return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
  }

  // For 3+ points, build a smooth path through all waypoints
  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    // Catmull-Rom to cubic bezier control points (tension = 0.5)
    const tension = 6;
    const c1x = p1.x + (p2.x - p0.x) / tension;
    const c1y = p1.y + (p2.y - p0.y) / tension;
    const c2x = p2.x - (p3.x - p1.x) / tension;
    const c2y = p2.y - (p3.y - p1.y) / tension;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
