import { HandleInput, HandleSide, NodeInput, EdgeInput, Point } from './types';

export interface InternalNode {
  id: string;
  width: number;
  height: number;
  handles: HandleInput[];
  isDummy: boolean;
  layer: number;
  order: number;
  x: number;
  y: number;
}

export interface InternalEdge {
  id: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
  reversed: boolean;
  originalId: string;
}

export class Graph {
  nodes: Map<string, InternalNode> = new Map();
  edges: Map<string, InternalEdge> = new Map();
  outEdges: Map<string, Set<string>> = new Map();
  inEdges: Map<string, Set<string>> = new Map();

  addNode(node: InternalNode): void {
    this.nodes.set(node.id, node);
    if (!this.outEdges.has(node.id)) this.outEdges.set(node.id, new Set());
    if (!this.inEdges.has(node.id)) this.inEdges.set(node.id, new Set());
  }

  addEdge(edge: InternalEdge): void {
    this.edges.set(edge.id, edge);
    if (!this.outEdges.has(edge.from)) this.outEdges.set(edge.from, new Set());
    if (!this.inEdges.has(edge.to)) this.inEdges.set(edge.to, new Set());
    this.outEdges.get(edge.from)!.add(edge.id);
    this.inEdges.get(edge.to)!.add(edge.id);
  }

  removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    this.outEdges.get(edge.from)?.delete(edgeId);
    this.inEdges.get(edge.to)?.delete(edgeId);
    this.edges.delete(edgeId);
  }

  removeNode(nodeId: string): void {
    const outEdgeIds = [...(this.outEdges.get(nodeId) || [])];
    const inEdgeIds = [...(this.inEdges.get(nodeId) || [])];
    for (const eid of outEdgeIds) this.removeEdge(eid);
    for (const eid of inEdgeIds) this.removeEdge(eid);
    this.nodes.delete(nodeId);
    this.outEdges.delete(nodeId);
    this.inEdges.delete(nodeId);
  }

  predecessors(nodeId: string): string[] {
    const result: string[] = [];
    const inEdgeIds = this.inEdges.get(nodeId);
    if (inEdgeIds) {
      for (const eid of inEdgeIds) {
        const edge = this.edges.get(eid);
        if (edge) result.push(edge.from);
      }
    }
    return result;
  }

  successors(nodeId: string): string[] {
    const result: string[] = [];
    const outEdgeIds = this.outEdges.get(nodeId);
    if (outEdgeIds) {
      for (const eid of outEdgeIds) {
        const edge = this.edges.get(eid);
        if (edge) result.push(edge.to);
      }
    }
    return result;
  }
}

export function buildGraph(nodes: NodeInput[], edges: EdgeInput[]): Graph {
  const graph = new Graph();

  for (const node of nodes) {
    graph.addNode({
      id: node.id,
      width: node.width,
      height: node.height,
      handles: node.handles.map(h => ({ ...h, offset: h.offset ?? 0.5 })),
      isDummy: false,
      layer: -1,
      order: -1,
      x: 0,
      y: 0,
    });
  }

  for (const edge of edges) {
    graph.addEdge({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      fromHandle: edge.fromHandle,
      toHandle: edge.toHandle,
      reversed: false,
      originalId: edge.id,
    });
  }

  return graph;
}

/** Compute the absolute position of a handle on a positioned node */
export function getHandlePosition(node: InternalNode, handleId: string): Point {
  const handle = node.handles.find(h => h.id === handleId);
  if (!handle) {
    return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }

  const offset = handle.offset ?? 0.5;

  switch (handle.position) {
    case 'top':
      return { x: node.x + offset * node.width, y: node.y };
    case 'bottom':
      return { x: node.x + offset * node.width, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + offset * node.height };
    case 'right':
      return { x: node.x + node.width, y: node.y + offset * node.height };
  }
}

/** Get the direction vector for exiting/entering a handle */
export function getHandleDirection(side: HandleSide): Point {
  switch (side) {
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
  }
}
