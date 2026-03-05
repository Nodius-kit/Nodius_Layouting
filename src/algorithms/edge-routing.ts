import { Graph, getHandlePosition, getHandleDirection } from '../graph';
import { Point, HandleSide, LayoutDirection } from '../types';

export interface RoutedEdge {
  id: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
  points: Point[];
}

/**
 * Route all edges with orthogonal paths.
 * Reconstructs original edges from dummy node chains.
 */
export function routeEdges(
  graph: Graph,
  direction: LayoutDirection,
  edgeMargin: number
): RoutedEdge[] {
  const chains = collectEdgeChains(graph);
  const routes: RoutedEdge[] = [];

  for (const chain of chains) {
    routes.push(routeChain(graph, chain, direction, edgeMargin));
  }

  return routes;
}

interface EdgeChain {
  originalId: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
  dummyNodes: string[];
  reversed: boolean;
}

function collectEdgeChains(graph: Graph): EdgeChain[] {
  const chains: EdgeChain[] = [];
  const visited = new Set<string>();

  for (const [edgeId, edge] of graph.edges) {
    if (visited.has(edgeId)) continue;

    const fromNode = graph.nodes.get(edge.from);
    if (!fromNode || fromNode.isDummy) continue;

    const dummyNodes: string[] = [];
    let currentEdge = edge;
    visited.add(edgeId);

    // Follow through dummy nodes
    while (true) {
      const toNode = graph.nodes.get(currentEdge.to);
      if (!toNode || !toNode.isDummy) break;

      dummyNodes.push(currentEdge.to);

      const outEdgeIds = graph.outEdges.get(currentEdge.to);
      if (!outEdgeIds || outEdgeIds.size === 0) break;

      // Find the edge with matching originalId
      let nextEdge = null;
      for (const eid of outEdgeIds) {
        const e = graph.edges.get(eid);
        if (e && e.originalId === edge.originalId) {
          nextEdge = e;
          visited.add(eid);
          break;
        }
      }

      if (!nextEdge) {
        // Fallback: take any outgoing edge
        const eid = outEdgeIds.values().next().value;
        if (!eid) break;
        nextEdge = graph.edges.get(eid);
        if (!nextEdge) break;
        visited.add(eid);
      }

      currentEdge = nextEdge;
    }

    chains.push({
      originalId: edge.originalId,
      from: edge.from,
      to: currentEdge.to,
      fromHandle: edge.fromHandle,
      toHandle: currentEdge.toHandle,
      dummyNodes,
      reversed: edge.reversed,
    });
  }

  return chains;
}

function routeChain(
  graph: Graph,
  chain: EdgeChain,
  direction: LayoutDirection,
  margin: number
): RoutedEdge {
  const fromNode = graph.nodes.get(chain.from)!;
  const toNode = graph.nodes.get(chain.to)!;

  // Determine actual from/to based on reversal
  const actualFrom = chain.reversed ? chain.to : chain.from;
  const actualTo = chain.reversed ? chain.from : chain.to;
  const actualFromHandle = chain.reversed ? chain.toHandle : chain.fromHandle;
  const actualToHandle = chain.reversed ? chain.fromHandle : chain.toHandle;

  const sourceNode = chain.reversed ? toNode : fromNode;
  const targetNode = chain.reversed ? fromNode : toNode;

  const sourcePos = getHandlePosition(sourceNode, actualFromHandle);
  const targetPos = getHandlePosition(targetNode, actualToHandle);

  const sourceHandle = sourceNode.handles.find(h => h.id === actualFromHandle);
  const targetHandle = targetNode.handles.find(h => h.id === actualToHandle);

  const sourceSide = sourceHandle?.position || getDefaultSourceSide(direction);
  const targetSide = targetHandle?.position || getDefaultTargetSide(direction);

  // Build waypoints
  const rawPoints: Point[] = [];

  // Source handle
  rawPoints.push(sourcePos);

  // Exit point
  const exitDir = getHandleDirection(sourceSide);
  rawPoints.push({
    x: sourcePos.x + exitDir.x * margin,
    y: sourcePos.y + exitDir.y * margin,
  });

  // Dummy node positions (in correct order based on reversal)
  const dummies = chain.reversed ? [...chain.dummyNodes].reverse() : chain.dummyNodes;
  for (const dummyId of dummies) {
    const dummy = graph.nodes.get(dummyId)!;
    rawPoints.push({ x: dummy.x, y: dummy.y });
  }

  // Entry point
  const entryDir = getHandleDirection(targetSide);
  rawPoints.push({
    x: targetPos.x + entryDir.x * margin,
    y: targetPos.y + entryDir.y * margin,
  });

  // Target handle
  rawPoints.push(targetPos);

  // Make orthogonal
  const points = makeOrthogonal(rawPoints, direction);

  return {
    id: chain.originalId,
    from: actualFrom,
    to: actualTo,
    fromHandle: actualFromHandle,
    toHandle: actualToHandle,
    points,
  };
}

/**
 * Insert bends to make the path orthogonal (only horizontal/vertical segments).
 */
function makeOrthogonal(points: Point[], direction: LayoutDirection): Point[] {
  if (points.length < 2) return points;

  const result: Point[] = [points[0]];
  const isVerticalFlow = direction === 'TB' || direction === 'BT';

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];

    const dx = Math.abs(prev.x - curr.x);
    const dy = Math.abs(prev.y - curr.y);

    // If already aligned, just add the point
    if (dx < 0.01 || dy < 0.01) {
      result.push(curr);
      continue;
    }

    // Need a bend
    if (isVerticalFlow) {
      // Prefer vertical-then-horizontal routing
      const midY = (prev.y + curr.y) / 2;
      result.push({ x: prev.x, y: midY });
      result.push({ x: curr.x, y: midY });
    } else {
      // Prefer horizontal-then-vertical routing
      const midX = (prev.x + curr.x) / 2;
      result.push({ x: midX, y: prev.y });
      result.push({ x: midX, y: curr.y });
    }

    result.push(curr);
  }

  return cleanupPoints(result);
}

/**
 * Remove redundant collinear points.
 */
function cleanupPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Skip if collinear
    const sameX = Math.abs(prev.x - curr.x) < 0.01 && Math.abs(curr.x - next.x) < 0.01;
    const sameY = Math.abs(prev.y - curr.y) < 0.01 && Math.abs(curr.y - next.y) < 0.01;

    if (!sameX && !sameY) {
      result.push(curr);
    } else if (sameX || sameY) {
      // Collinear - skip this point
      continue;
    } else {
      result.push(curr);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

function getDefaultSourceSide(direction: LayoutDirection): HandleSide {
  switch (direction) {
    case 'TB': return 'bottom';
    case 'BT': return 'top';
    case 'LR': return 'right';
    case 'RL': return 'left';
  }
}

function getDefaultTargetSide(direction: LayoutDirection): HandleSide {
  switch (direction) {
    case 'TB': return 'top';
    case 'BT': return 'bottom';
    case 'LR': return 'left';
    case 'RL': return 'right';
  }
}
