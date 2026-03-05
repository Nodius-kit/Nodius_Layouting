import { Graph } from '../graph';

/**
 * Assign layers to nodes using the longest path algorithm.
 * Source nodes (no predecessors) get layer 0.
 * Each node's layer = max(predecessors' layers) + 1.
 */
export function assignLayers(graph: Graph): string[][] {
  const layers = new Map<string, number>();
  const visiting = new Set<string>();

  function computeLayer(nodeId: string): number {
    if (layers.has(nodeId)) return layers.get(nodeId)!;
    if (visiting.has(nodeId)) return 0;

    visiting.add(nodeId);

    const preds = graph.predecessors(nodeId);
    let maxPredLayer = -1;

    for (const pred of preds) {
      maxPredLayer = Math.max(maxPredLayer, computeLayer(pred));
    }

    const layer = maxPredLayer + 1;
    layers.set(nodeId, layer);

    const node = graph.nodes.get(nodeId);
    if (node) node.layer = layer;

    visiting.delete(nodeId);
    return layer;
  }

  for (const nodeId of graph.nodes.keys()) {
    computeLayer(nodeId);
  }

  // Build layers array
  let maxLayer = 0;
  for (const layer of layers.values()) {
    maxLayer = Math.max(maxLayer, layer);
  }

  const layersArray: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const [nodeId, layer] of layers) {
    layersArray[layer].push(nodeId);
  }

  return layersArray;
}

/**
 * Insert dummy nodes for edges that span multiple layers.
 * Returns updated layers array.
 */
export function insertDummyNodes(graph: Graph, layers: string[][]): string[][] {
  let dummyCounter = 0;
  const edgesToProcess = [...graph.edges.values()];

  for (const edge of edgesToProcess) {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (!fromNode || !toNode) continue;

    const fromLayer = fromNode.layer;
    const toLayer = toNode.layer;
    const span = toLayer - fromLayer;

    if (span <= 1) continue;

    // Remove original edge
    graph.removeEdge(edge.id);

    // Create chain of dummy nodes and edges
    let prevNodeId = edge.from;
    let prevHandleId = edge.fromHandle;

    for (let l = fromLayer + 1; l < toLayer; l++) {
      const dummyId = `__dummy_${dummyCounter++}`;

      graph.addNode({
        id: dummyId,
        width: 0,
        height: 0,
        handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
          { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        ],
        isDummy: true,
        layer: l,
        order: -1,
        x: 0,
        y: 0,
      });

      layers[l].push(dummyId);

      graph.addEdge({
        id: `__dedge_${dummyCounter}_${l}_in`,
        from: prevNodeId,
        to: dummyId,
        fromHandle: prevHandleId,
        toHandle: 'in',
        reversed: edge.reversed,
        originalId: edge.originalId,
      });

      prevNodeId = dummyId;
      prevHandleId = 'out';
    }

    // Final edge to target
    graph.addEdge({
      id: `__dedge_${dummyCounter}_final`,
      from: prevNodeId,
      to: edge.to,
      fromHandle: prevHandleId,
      toHandle: edge.toHandle,
      reversed: edge.reversed,
      originalId: edge.originalId,
    });
  }

  return layers;
}
