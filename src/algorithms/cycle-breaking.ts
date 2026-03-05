import { Graph } from '../graph';

/**
 * Break cycles in the graph using DFS-based back edge detection.
 * Reverses back edges to make the graph a DAG.
 * Returns the set of reversed edge IDs.
 */
export function breakCycles(graph: Graph): Set<string> {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const state = new Map<string, number>();
  const reversed = new Set<string>();

  for (const nodeId of graph.nodes.keys()) {
    state.set(nodeId, WHITE);
  }

  // Process nodes with more outgoing than incoming edges first
  const nodeIds = [...graph.nodes.keys()].sort((a, b) => {
    const aDiff = (graph.outEdges.get(a)?.size || 0) - (graph.inEdges.get(a)?.size || 0);
    const bDiff = (graph.outEdges.get(b)?.size || 0) - (graph.inEdges.get(b)?.size || 0);
    return bDiff - aDiff;
  });

  function dfs(nodeId: string): void {
    state.set(nodeId, GRAY);

    const outEdgeIds = graph.outEdges.get(nodeId);
    if (outEdgeIds) {
      for (const edgeId of outEdgeIds) {
        const edge = graph.edges.get(edgeId);
        if (!edge) continue;

        const targetState = state.get(edge.to);
        if (targetState === GRAY) {
          reversed.add(edgeId);
        } else if (targetState === WHITE) {
          dfs(edge.to);
        }
      }
    }

    state.set(nodeId, BLACK);
  }

  for (const nodeId of nodeIds) {
    if (state.get(nodeId) === WHITE) {
      dfs(nodeId);
    }
  }

  // Reverse the back edges in the graph
  for (const edgeId of reversed) {
    const edge = graph.edges.get(edgeId);
    if (!edge) continue;

    graph.removeEdge(edgeId);
    graph.addEdge({
      ...edge,
      from: edge.to,
      to: edge.from,
      fromHandle: edge.toHandle,
      toHandle: edge.fromHandle,
      reversed: !edge.reversed,
    });
  }

  return reversed;
}
