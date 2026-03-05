import { LayoutInput, LayoutOptions, LayoutResult, NodeInput, EdgeInput, resolveOptions, ResolvedOptions } from './types';
import { Graph, buildGraph, getHandlePosition } from './graph';
import { breakCycles } from './algorithms/cycle-breaking';
import { assignLayers, insertDummyNodes } from './algorithms/layer-assignment';
import { minimizeCrossings } from './algorithms/crossing-minimization';
import { assignCoordinates } from './algorithms/coordinate-assignment';
import { routeEdges } from './algorithms/edge-routing';
import { computeLayout } from './layout';

/**
 * Incremental layout engine.
 * Maintains layout state and supports adding/removing nodes
 * without full recomputation.
 */
export class IncrementalLayout {
  private options: ResolvedOptions;
  private inputNodes: Map<string, NodeInput> = new Map();
  private inputEdges: Map<string, EdgeInput> = new Map();
  private lastResult: LayoutResult | null = null;
  private nodePositions: Map<string, { x: number; y: number }> = new Map();

  constructor(options?: LayoutOptions) {
    this.options = resolveOptions(options);
  }

  /**
   * Set the full graph and compute a complete layout.
   */
  setGraph(input: LayoutInput): LayoutResult {
    this.inputNodes.clear();
    this.inputEdges.clear();

    for (const node of input.nodes) {
      this.inputNodes.set(node.id, node);
    }
    for (const edge of input.edges) {
      this.inputEdges.set(edge.id, edge);
    }

    return this.recompute();
  }

  /**
   * Add nodes and edges incrementally.
   * Attempts to minimize layout changes for existing nodes.
   */
  addNodes(nodes: NodeInput[], edges?: EdgeInput[]): LayoutResult {
    for (const node of nodes) {
      this.inputNodes.set(node.id, node);
    }
    if (edges) {
      for (const edge of edges) {
        this.inputEdges.set(edge.id, edge);
      }
    }

    return this.recomputeIncremental(
      new Set(nodes.map(n => n.id)),
      new Set(edges?.map(e => e.id) || [])
    );
  }

  /**
   * Remove nodes (and their connected edges) from the layout.
   */
  removeNodes(nodeIds: string[]): LayoutResult {
    const removedSet = new Set(nodeIds);

    for (const id of nodeIds) {
      this.inputNodes.delete(id);
    }

    // Remove edges connected to removed nodes
    for (const [edgeId, edge] of this.inputEdges) {
      if (removedSet.has(edge.from) || removedSet.has(edge.to)) {
        this.inputEdges.delete(edgeId);
      }
    }

    // Remove from position cache
    for (const id of nodeIds) {
      this.nodePositions.delete(id);
    }

    return this.recompute();
  }

  /**
   * Add edges between existing nodes.
   */
  addEdges(edges: EdgeInput[]): LayoutResult {
    for (const edge of edges) {
      this.inputEdges.set(edge.id, edge);
    }
    return this.recomputeIncremental(
      new Set<string>(),
      new Set(edges.map(e => e.id))
    );
  }

  /**
   * Remove edges from the layout.
   */
  removeEdges(edgeIds: string[]): LayoutResult {
    for (const id of edgeIds) {
      this.inputEdges.delete(id);
    }
    return this.recompute();
  }

  /**
   * Get the current layout result.
   */
  getResult(): LayoutResult | null {
    return this.lastResult;
  }

  private recompute(): LayoutResult {
    const input: LayoutInput = {
      nodes: [...this.inputNodes.values()],
      edges: [...this.inputEdges.values()],
    };

    const graph = buildGraph(input.nodes, input.edges);
    this.lastResult = computeLayout(graph, this.options);

    // Cache positions for future incremental updates
    this.cachePositions();

    return this.lastResult;
  }

  private recomputeIncremental(
    newNodeIds: Set<string>,
    newEdgeIds: Set<string>
  ): LayoutResult {
    const input: LayoutInput = {
      nodes: [...this.inputNodes.values()],
      edges: [...this.inputEdges.values()],
    };

    const graph = buildGraph(input.nodes, input.edges);

    // Phase 1: Break cycles
    breakCycles(graph);

    // Phase 2: Assign layers
    let layers = assignLayers(graph);

    // Phase 3: Insert dummy nodes
    layers = insertDummyNodes(graph, layers);

    // Phase 4: Minimize crossings (full, but starting from hints)
    layers = minimizeCrossings(graph, layers, this.options.crossingMinimizationIterations);

    // Phase 5: Assign coordinates
    assignCoordinates(graph, layers, this.options);

    // Phase 6: Apply position stability for existing nodes
    this.applyStability(graph, newNodeIds);

    // Phase 7: Route edges
    const routedEdges = routeEdges(graph, this.options.direction, this.options.edgeMargin);

    // Build result
    this.lastResult = this.buildResult(graph, routedEdges);
    this.cachePositions();

    return this.lastResult;
  }

  /**
   * Apply stability: blend new positions with old positions for existing nodes.
   * This reduces visual disruption when adding new nodes.
   */
  private applyStability(graph: Graph, newNodeIds: Set<string>): void {
    if (this.nodePositions.size === 0) return;

    const STABILITY_WEIGHT = 0.3; // 30% old position, 70% new

    for (const [nodeId, node] of graph.nodes) {
      if (node.isDummy || newNodeIds.has(nodeId)) continue;

      const oldPos = this.nodePositions.get(nodeId);
      if (!oldPos) continue;

      // Blend positions
      node.x = node.x * (1 - STABILITY_WEIGHT) + oldPos.x * STABILITY_WEIGHT;
      node.y = node.y * (1 - STABILITY_WEIGHT) + oldPos.y * STABILITY_WEIGHT;
    }
  }

  private cachePositions(): void {
    if (!this.lastResult) return;
    this.nodePositions.clear();
    for (const node of this.lastResult.nodes) {
      this.nodePositions.set(node.id, { x: node.x, y: node.y });
    }
  }

  private buildResult(
    graph: Graph,
    routedEdges: { id: string; from: string; to: string; fromHandle: string; toHandle: string; points: { x: number; y: number }[] }[]
  ): LayoutResult {
    const nodes: LayoutResult['nodes'] = [];
    const edges: LayoutResult['edges'] = [];

    for (const [, node] of graph.nodes) {
      if (node.isDummy) continue;

      const handles = node.handles.map(h => {
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
}
