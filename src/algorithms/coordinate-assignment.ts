import { Graph } from '../graph';
import { LayoutDirection, ResolvedOptions } from '../types';

/**
 * Assign x,y coordinates to all nodes using a median-based iterative approach.
 */
export function assignCoordinates(
  graph: Graph,
  layers: string[][],
  options: ResolvedOptions
): void {
  const isHorizontal = options.direction === 'LR' || options.direction === 'RL';
  const isReversed = options.direction === 'BT' || options.direction === 'RL';

  assignRankPositions(graph, layers, options, isHorizontal, isReversed);
  assignOrderPositions(graph, layers, options, isHorizontal);
  optimizePositions(graph, layers, options, isHorizontal);
}

/**
 * Assign positions along the rank axis (y for TB/BT, x for LR/RL).
 */
function assignRankPositions(
  graph: Graph,
  layers: string[][],
  options: ResolvedOptions,
  isHorizontal: boolean,
  isReversed: boolean
): void {
  // Compute layer sizes (max node size in rank direction)
  const layerSizes: number[] = [];
  for (const layer of layers) {
    let maxSize = 0;
    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      const size = isHorizontal ? node.width : node.height;
      maxSize = Math.max(maxSize, size);
    }
    layerSizes.push(maxSize);
  }

  // Compute cumulative positions
  const layerPositions: number[] = [];
  let pos = 0;
  for (let l = 0; l < layers.length; l++) {
    layerPositions.push(pos);
    pos += layerSizes[l] + options.layerSpacing;
  }

  // If reversed, flip positions
  if (isReversed) {
    const totalSize = pos - options.layerSpacing;
    for (let l = 0; l < layerPositions.length; l++) {
      layerPositions[l] = totalSize - layerPositions[l] - layerSizes[l];
    }
  }

  // Assign positions
  for (let l = 0; l < layers.length; l++) {
    for (const nodeId of layers[l]) {
      const node = graph.nodes.get(nodeId)!;
      const nodeSize = isHorizontal ? node.width : node.height;
      const offset = (layerSizes[l] - nodeSize) / 2;

      if (isHorizontal) {
        node.x = layerPositions[l] + offset;
      } else {
        node.y = layerPositions[l] + offset;
      }
    }
  }
}

/**
 * Assign positions along the order axis (x for TB/BT, y for LR/RL).
 * Initial even spacing, centered.
 */
function assignOrderPositions(
  graph: Graph,
  layers: string[][],
  options: ResolvedOptions,
  isHorizontal: boolean
): void {
  for (const layer of layers) {
    let pos = 0;

    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      const size = isHorizontal ? node.height : node.width;

      if (isHorizontal) {
        node.y = pos;
      } else {
        node.x = pos;
      }

      pos += size + options.nodeSpacing;
    }

    // Center the layer
    const totalSize = pos - options.nodeSpacing;
    const centerOffset = -totalSize / 2;

    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      if (isHorizontal) {
        node.y += centerOffset;
      } else {
        node.x += centerOffset;
      }
    }
  }
}

/**
 * Iteratively optimize positions by aligning nodes with their connected neighbors.
 */
function optimizePositions(
  graph: Graph,
  layers: string[][],
  options: ResolvedOptions,
  isHorizontal: boolean
): void {
  for (let iter = 0; iter < options.coordinateOptimizationIterations; iter++) {
    // Down sweep
    for (let l = 0; l < layers.length; l++) {
      optimizeLayer(graph, layers[l], options, isHorizontal);
    }

    // Up sweep
    for (let l = layers.length - 1; l >= 0; l--) {
      optimizeLayer(graph, layers[l], options, isHorizontal);
    }
  }

  centerAllLayers(graph, layers, isHorizontal);
}

function optimizeLayer(
  graph: Graph,
  layer: string[],
  options: ResolvedOptions,
  isHorizontal: boolean
): void {
  if (layer.length === 0) return;

  // Compute desired positions
  const desired = new Map<string, number>();

  for (const nodeId of layer) {
    const node = graph.nodes.get(nodeId)!;
    const connected = [...graph.predecessors(nodeId), ...graph.successors(nodeId)];

    if (connected.length === 0) {
      desired.set(nodeId, getOrderPos(node, isHorizontal));
      continue;
    }

    // Median of connected nodes' center positions
    const positions = connected
      .map(cId => {
        const c = graph.nodes.get(cId)!;
        return getOrderPos(c, isHorizontal) + getOrderSize(c, isHorizontal) / 2;
      })
      .sort((a, b) => a - b);

    const nodeSize = getOrderSize(node, isHorizontal);
    const median = positions.length % 2 === 0
      ? (positions[positions.length / 2 - 1] + positions[positions.length / 2]) / 2
      : positions[Math.floor(positions.length / 2)];

    desired.set(nodeId, median - nodeSize / 2);
  }

  // Forward pass: apply desired positions with spacing constraints
  for (let i = 0; i < layer.length; i++) {
    const nodeId = layer[i];
    const node = graph.nodes.get(nodeId)!;
    let desiredPos = desired.get(nodeId)!;

    if (i > 0) {
      const prevId = layer[i - 1];
      const prev = graph.nodes.get(prevId)!;
      const prevEnd = getOrderPos(prev, isHorizontal) + getOrderSize(prev, isHorizontal);
      desiredPos = Math.max(desiredPos, prevEnd + options.nodeSpacing);
    }

    setOrderPos(node, isHorizontal, desiredPos);
  }

  // Backward pass: fix overlaps from right
  for (let i = layer.length - 2; i >= 0; i--) {
    const nodeId = layer[i];
    const node = graph.nodes.get(nodeId)!;
    const nextId = layer[i + 1];
    const next = graph.nodes.get(nextId)!;

    const nodeEnd = getOrderPos(node, isHorizontal) + getOrderSize(node, isHorizontal);
    const nextStart = getOrderPos(next, isHorizontal);

    if (nodeEnd + options.nodeSpacing > nextStart) {
      setOrderPos(node, isHorizontal, nextStart - options.nodeSpacing - getOrderSize(node, isHorizontal));
    }
  }
}

function centerAllLayers(
  graph: Graph,
  layers: string[][],
  isHorizontal: boolean
): void {
  if (layers.length === 0) return;

  // Find global bounds
  let globalMin = Infinity;
  let globalMax = -Infinity;

  for (const layer of layers) {
    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      const pos = getOrderPos(node, isHorizontal);
      const size = getOrderSize(node, isHorizontal);
      globalMin = Math.min(globalMin, pos);
      globalMax = Math.max(globalMax, pos + size);
    }
  }

  // Shift everything so the layout starts at 0
  const offset = -globalMin;
  for (const layer of layers) {
    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      setOrderPos(node, isHorizontal, getOrderPos(node, isHorizontal) + offset);
    }
  }

  // Also shift rank positions to start at 0
  let rankMin = Infinity;
  for (const layer of layers) {
    for (const nodeId of layer) {
      const node = graph.nodes.get(nodeId)!;
      const pos = isHorizontal ? node.x : node.y;
      rankMin = Math.min(rankMin, pos);
    }
  }

  if (rankMin !== 0) {
    for (const layer of layers) {
      for (const nodeId of layer) {
        const node = graph.nodes.get(nodeId)!;
        if (isHorizontal) {
          node.x -= rankMin;
        } else {
          node.y -= rankMin;
        }
      }
    }
  }
}

function getOrderPos(node: { x: number; y: number }, isHorizontal: boolean): number {
  return isHorizontal ? node.y : node.x;
}

function setOrderPos(node: { x: number; y: number }, isHorizontal: boolean, value: number): void {
  if (isHorizontal) {
    node.y = value;
  } else {
    node.x = value;
  }
}

function getOrderSize(node: { width: number; height: number }, isHorizontal: boolean): number {
  return isHorizontal ? node.height : node.width;
}
