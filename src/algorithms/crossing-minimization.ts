import { Graph } from '../graph';

/**
 * Minimize edge crossings using barycenter heuristic with transpose improvement.
 */
export function minimizeCrossings(
  graph: Graph,
  layers: string[][],
  iterations: number
): string[][] {
  if (layers.length <= 1) return layers;

  const totalNodes = layers.reduce((s, l) => s + l.length, 0);

  // Adaptive: reduce iterations for large graphs
  const effectiveIter = totalNodes > 500
    ? Math.min(iterations, 6)
    : totalNodes > 200
      ? Math.min(iterations, 12)
      : iterations;

  // Skip transpose for very large layers
  const skipTranspose = totalNodes > 800;

  // Initialize node orders
  for (let l = 0; l < layers.length; l++) {
    for (let i = 0; i < layers[l].length; i++) {
      const node = graph.nodes.get(layers[l][i]);
      if (node) node.order = i;
    }
  }

  let bestLayers = layers.map(l => [...l]);
  let bestCrossings = countAllCrossings(graph, layers);
  let noImprovementCount = 0;

  for (let iter = 0; iter < effectiveIter; iter++) {
    // Down sweep
    for (let l = 1; l < layers.length; l++) {
      orderByBarycenter(graph, layers, l, 'up');
    }

    // Up sweep
    for (let l = layers.length - 2; l >= 0; l--) {
      orderByBarycenter(graph, layers, l, 'down');
    }

    // Transpose improvement
    if (!skipTranspose) {
      for (let l = 0; l < layers.length; l++) {
        if (layers[l].length <= 100) {
          transposeImprove(graph, layers, l);
        }
      }
    }

    const crossings = countAllCrossings(graph, layers);
    if (crossings < bestCrossings) {
      bestCrossings = crossings;
      bestLayers = layers.map(l => [...l]);
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
    }

    if (crossings === 0 || noImprovementCount >= 3) break;
  }

  // Restore best ordering
  for (let l = 0; l < layers.length; l++) {
    layers[l] = bestLayers[l];
    for (let i = 0; i < layers[l].length; i++) {
      const node = graph.nodes.get(layers[l][i]);
      if (node) node.order = i;
    }
  }

  return layers;
}

function orderByBarycenter(
  graph: Graph,
  layers: string[][],
  layerIndex: number,
  direction: 'up' | 'down'
): void {
  const layer = layers[layerIndex];
  const adjLayerIndex = direction === 'up' ? layerIndex - 1 : layerIndex + 1;

  if (adjLayerIndex < 0 || adjLayerIndex >= layers.length) return;

  // Build position lookup for adjacent layer using node.order
  const adjLayerSet = new Set(layers[adjLayerIndex]);

  const barycenters = new Map<string, number>();

  for (let i = 0; i < layer.length; i++) {
    const nodeId = layer[i];

    // Get neighbor positions directly using node.order
    let sum = 0;
    let count = 0;

    if (direction === 'up') {
      const inEdgeIds = graph.inEdges.get(nodeId);
      if (inEdgeIds) {
        for (const eid of inEdgeIds) {
          const edge = graph.edges.get(eid);
          if (edge && adjLayerSet.has(edge.from)) {
            const neighbor = graph.nodes.get(edge.from);
            if (neighbor) {
              sum += neighbor.order;
              count++;
            }
          }
        }
      }
    } else {
      const outEdgeIds = graph.outEdges.get(nodeId);
      if (outEdgeIds) {
        for (const eid of outEdgeIds) {
          const edge = graph.edges.get(eid);
          if (edge && adjLayerSet.has(edge.to)) {
            const neighbor = graph.nodes.get(edge.to);
            if (neighbor) {
              sum += neighbor.order;
              count++;
            }
          }
        }
      }
    }

    barycenters.set(nodeId, count > 0 ? sum / count : i);
  }

  layer.sort((a, b) => barycenters.get(a)! - barycenters.get(b)!);

  for (let i = 0; i < layer.length; i++) {
    const node = graph.nodes.get(layer[i]);
    if (node) node.order = i;
  }
}

function transposeImprove(graph: Graph, layers: string[][], layerIndex: number): void {
  const layer = layers[layerIndex];
  if (layer.length <= 1) return;

  let improved = true;
  let passes = 0;

  while (improved && passes < 2) {
    improved = false;
    passes++;
    for (let i = 0; i < layer.length - 1; i++) {
      const nodeA = layer[i];
      const nodeB = layer[i + 1];

      const crossingsBefore = countPairCrossings(graph, layers, layerIndex, nodeA, nodeB);

      // Swap in-place
      layer[i] = nodeB;
      layer[i + 1] = nodeA;
      const nA = graph.nodes.get(nodeA);
      const nB = graph.nodes.get(nodeB);
      if (nA) nA.order = i + 1;
      if (nB) nB.order = i;

      const crossingsAfter = countPairCrossings(graph, layers, layerIndex, nodeB, nodeA);

      if (crossingsAfter < crossingsBefore) {
        improved = true;
      } else {
        // Revert
        layer[i] = nodeA;
        layer[i + 1] = nodeB;
        if (nA) nA.order = i;
        if (nB) nB.order = i + 1;
      }
    }
  }
}

/**
 * Count crossings involving a specific pair of adjacent nodes using node.order directly.
 */
function countPairCrossings(
  graph: Graph,
  layers: string[][],
  layerIndex: number,
  nodeA: string,
  nodeB: string
): number {
  let crossings = 0;

  // Check with upper layer
  if (layerIndex > 0) {
    const upperLayer = new Set(layers[layerIndex - 1]);

    const predsA: number[] = [];
    const predsB: number[] = [];

    const inA = graph.inEdges.get(nodeA);
    if (inA) {
      for (const eid of inA) {
        const edge = graph.edges.get(eid);
        if (edge && upperLayer.has(edge.from)) {
          const n = graph.nodes.get(edge.from);
          if (n) predsA.push(n.order);
        }
      }
    }

    const inB = graph.inEdges.get(nodeB);
    if (inB) {
      for (const eid of inB) {
        const edge = graph.edges.get(eid);
        if (edge && upperLayer.has(edge.from)) {
          const n = graph.nodes.get(edge.from);
          if (n) predsB.push(n.order);
        }
      }
    }

    for (const pA of predsA) {
      for (const pB of predsB) {
        if (pA > pB) crossings++;
      }
    }
  }

  // Check with lower layer
  if (layerIndex < layers.length - 1) {
    const lowerLayer = new Set(layers[layerIndex + 1]);

    const succsA: number[] = [];
    const succsB: number[] = [];

    const outA = graph.outEdges.get(nodeA);
    if (outA) {
      for (const eid of outA) {
        const edge = graph.edges.get(eid);
        if (edge && lowerLayer.has(edge.to)) {
          const n = graph.nodes.get(edge.to);
          if (n) succsA.push(n.order);
        }
      }
    }

    const outB = graph.outEdges.get(nodeB);
    if (outB) {
      for (const eid of outB) {
        const edge = graph.edges.get(eid);
        if (edge && lowerLayer.has(edge.to)) {
          const n = graph.nodes.get(edge.to);
          if (n) succsB.push(n.order);
        }
      }
    }

    for (const sA of succsA) {
      for (const sB of succsB) {
        if (sA > sB) crossings++;
      }
    }
  }

  return crossings;
}

export function countAllCrossings(graph: Graph, layers: string[][]): number {
  let total = 0;
  for (let l = 0; l < layers.length - 1; l++) {
    total += countLayerCrossings(graph, layers[l], layers[l + 1]);
  }
  return total;
}

/**
 * Count crossings between two adjacent layers using merge-sort based
 * inversion counting. O(E log V) instead of O(E^2).
 */
function countLayerCrossings(
  graph: Graph,
  upperLayer: string[],
  lowerLayer: string[]
): number {
  const lowerPos = new Map<string, number>();
  lowerLayer.forEach((id, pos) => lowerPos.set(id, pos));

  // Collect edge endpoint pairs sorted by upper position
  const edgePairs: [number, number][] = [];
  for (let uPos = 0; uPos < upperLayer.length; uPos++) {
    const nodeId = upperLayer[uPos];
    const outEdgeIds = graph.outEdges.get(nodeId);
    if (!outEdgeIds) continue;
    for (const eid of outEdgeIds) {
      const edge = graph.edges.get(eid);
      if (!edge) continue;
      const lp = lowerPos.get(edge.to);
      if (lp !== undefined) {
        edgePairs.push([uPos, lp]);
      }
    }
  }

  if (edgePairs.length <= 1) return 0;

  // Sort by upper position, then by lower
  edgePairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Count inversions in the lower positions
  const lowerPositions = edgePairs.map(e => e[1]);
  return mergeSortCount(lowerPositions);
}

function mergeSortCount(arr: number[]): number {
  if (arr.length <= 1) return 0;

  const mid = arr.length >> 1;
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  let count = mergeSortCount(left) + mergeSortCount(right);

  let i = 0, j = 0, k = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      arr[k++] = left[i++];
    } else {
      count += left.length - i;
      arr[k++] = right[j++];
    }
  }

  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];

  return count;
}
