import { LayoutInput, LayoutOptions, LayoutResult, NodeOutput, EdgeOutput, HandleOutput, resolveOptions, ResolvedOptions } from './types';
import { Graph, buildGraph, getHandlePosition } from './graph';
import { breakCycles } from './algorithms/cycle-breaking';
import { assignLayers, insertDummyNodes } from './algorithms/layer-assignment';
import { minimizeCrossings } from './algorithms/crossing-minimization';
import { assignCoordinates } from './algorithms/coordinate-assignment';
import { routeEdges } from './algorithms/edge-routing';

/**
 * Compute a complete layout for the given graph.
 * This is the main entry point for one-shot layout computation.
 */
export function layout(input: LayoutInput, options?: LayoutOptions): LayoutResult {
  const resolved = resolveOptions(options);
  const graph = buildGraph(input.nodes, input.edges);
  return computeLayout(graph, resolved);
}

/**
 * Internal layout computation on an already-built graph.
 */
export function computeLayout(graph: Graph, options: ResolvedOptions): LayoutResult {
  if (graph.nodes.size === 0) {
    return { nodes: [], edges: [] };
  }

  // Phase 1: Break cycles
  breakCycles(graph);

  // Phase 2: Assign layers
  let layers = assignLayers(graph);

  // Phase 3: Insert dummy nodes for long edges
  layers = insertDummyNodes(graph, layers);

  // Phase 4: Minimize crossings
  layers = minimizeCrossings(graph, layers, options.crossingMinimizationIterations);

  // Phase 5: Assign coordinates
  assignCoordinates(graph, layers, options);

  // Phase 6: Route edges
  const routedEdges = routeEdges(graph, options.direction, options.edgeMargin);

  // Build output (exclude dummy nodes)
  return buildResult(graph, routedEdges);
}

function buildResult(graph: Graph, routedEdges: { id: string; from: string; to: string; fromHandle: string; toHandle: string; points: { x: number; y: number }[] }[]): LayoutResult {
  const nodes: NodeOutput[] = [];
  const edges: EdgeOutput[] = [];

  for (const [, node] of graph.nodes) {
    if (node.isDummy) continue;

    const handles: HandleOutput[] = node.handles.map(h => {
      const pos = getHandlePosition(node, h.id);
      return {
        id: h.id,
        type: h.type,
        position: h.position,
        x: pos.x,
        y: pos.y,
      };
    });

    nodes.push({
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      handles,
    });
  }

  for (const route of routedEdges) {
    edges.push({
      id: route.id,
      from: route.from,
      to: route.to,
      fromHandle: route.fromHandle,
      toHandle: route.toHandle,
      points: route.points,
    });
  }

  return { nodes, edges };
}
