import { describe, it, expect } from 'vitest';
import { layout, countAllCrossings } from '../src';
import { makeNode, makeEdge, getNode } from './helpers';
import { Graph, buildGraph } from '../src/graph';
import { assignLayers } from '../src/algorithms/layer-assignment';

describe('Crossing Minimization', () => {
  it('should minimize crossings in a simple case', () => {
    // Create a graph where naive ordering would cause crossings:
    // A -> D, B -> C (if ordered [A, B] and [C, D], edges cross)
    const result = layout({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')],
      edges: [
        makeEdge('e1', 'A', 'C'),
        makeEdge('e2', 'B', 'D'),
      ],
    });

    // A and B should be in same layer, C and D should be in same layer
    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;
    const d = getNode(result, 'D')!;

    // Optimal: A before B and C before D (or A after B and C after D)
    // Check that the ordering doesn't cause unnecessary crossings
    const aBeforeB = a.x < b.x;
    const cBeforeD = c.x < d.x;

    // If A is before B, C should be before D (no crossing)
    expect(aBeforeB).toBe(cBeforeD);
  });

  it('should reduce crossings in a more complex case', () => {
    // Create a graph where crossings are unavoidable but should be minimized
    const result = layout({
      nodes: [
        makeNode('A'), makeNode('B'), makeNode('C'),
        makeNode('D'), makeNode('E'), makeNode('F'),
      ],
      edges: [
        makeEdge('e1', 'A', 'D'),
        makeEdge('e2', 'A', 'E'),
        makeEdge('e3', 'B', 'D'),
        makeEdge('e4', 'B', 'F'),
        makeEdge('e5', 'C', 'E'),
        makeEdge('e6', 'C', 'F'),
      ],
    });

    // Verify the result is valid
    expect(result.nodes).toHaveLength(6);
    expect(result.edges).toHaveLength(6);

    // Build internal graph to count crossings
    const graph = buildGraph(result.nodes.map(n => ({
      ...n,
      handles: [
        { id: `${n.id}_in`, type: 'input' as const, position: 'top' as const, offset: 0.5 },
        { id: `${n.id}_out`, type: 'output' as const, position: 'bottom' as const, offset: 0.5 },
      ],
    })), [
      makeEdge('e1', 'A', 'D'),
      makeEdge('e2', 'A', 'E'),
      makeEdge('e3', 'B', 'D'),
      makeEdge('e4', 'B', 'F'),
      makeEdge('e5', 'C', 'E'),
      makeEdge('e6', 'C', 'F'),
    ]);

    const layers = assignLayers(graph);

    // Count crossings
    const crossings = countAllCrossings(graph, layers);
    // With 6 edges between 2 layers of 3 nodes each, maximum crossings = 15
    // The algorithm should reduce this significantly
    expect(crossings).toBeLessThanOrEqual(6);
  });

  it('should produce zero crossings when possible', () => {
    // A -> C, B -> D — no crossing needed
    const result = layout({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')],
      edges: [
        makeEdge('e1', 'A', 'C'),
        makeEdge('e2', 'B', 'D'),
      ],
    });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;
    const d = getNode(result, 'D')!;

    // Should be ordered so no crossings
    const aLeft = a.x < b.x;
    const cLeft = c.x < d.x;
    expect(aLeft).toBe(cLeft);
  });
});
