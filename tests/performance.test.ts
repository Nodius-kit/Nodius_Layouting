import { describe, it, expect } from 'vitest';
import { layout, IncrementalLayout } from '../src';
import { makeRandomDAG, checkNoOverlaps, checkFinitePositions, checkEdgeValidity } from './helpers';

describe('Performance', () => {
  it('should layout 500 nodes in under 5 seconds', () => {
    const input = makeRandomDAG(500, 0.01);

    const start = performance.now();
    const result = layout(input);
    const elapsed = performance.now() - start;

    expect(result.nodes).toHaveLength(500);
    expect(elapsed).toBeLessThan(5000);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);

    console.log(`500 nodes: ${elapsed.toFixed(1)}ms`);
  });

  it('should layout 1000 nodes in under 15 seconds', () => {
    const input = makeRandomDAG(1000, 0.005);

    const start = performance.now();
    const result = layout(input);
    const elapsed = performance.now() - start;

    expect(result.nodes).toHaveLength(1000);
    expect(elapsed).toBeLessThan(15000);
    expect(checkFinitePositions(result)).toBe(true);

    console.log(`1000 nodes: ${elapsed.toFixed(1)}ms`);
  });

  it('should layout 100 densely connected nodes', () => {
    const input = makeRandomDAG(100, 0.15, 123);

    const start = performance.now();
    const result = layout(input);
    const elapsed = performance.now() - start;

    expect(result.nodes).toHaveLength(100);
    expect(elapsed).toBeLessThan(10000);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);

    console.log(`100 dense nodes: ${elapsed.toFixed(1)}ms, ${result.edges.length} edges`);
  });

  it('should layout 200 nodes with many handles', () => {
    const input = makeRandomDAG(200, 0.03, 456);

    const start = performance.now();
    const result = layout(input);
    const elapsed = performance.now() - start;

    expect(result.nodes).toHaveLength(200);
    expect(elapsed).toBeLessThan(10000);
    expect(checkFinitePositions(result)).toBe(true);

    const totalHandles = result.nodes.reduce((sum, n) => sum + n.handles.length, 0);
    console.log(`200 nodes with ${totalHandles} total handles: ${elapsed.toFixed(1)}ms`);
  });

  it('should perform well on repeated incremental updates', () => {
    const inc = new IncrementalLayout();

    // Start with 50 nodes
    const initial = makeRandomDAG(50, 0.1, 789);
    inc.setGraph(initial);

    const start = performance.now();

    // Add 50 more nodes, 5 at a time
    for (let batch = 0; batch < 10; batch++) {
      const newNodes = Array.from({ length: 5 }, (_, i) => ({
        id: `new_${batch}_${i}`,
        width: 100,
        height: 60,
        handles: [
          { id: `new_${batch}_${i}_in`, type: 'input' as const, position: 'top' as const, offset: 0.5 },
          { id: `new_${batch}_${i}_out`, type: 'output' as const, position: 'bottom' as const, offset: 0.5 },
        ],
      }));

      const newEdges = newNodes.map((n, i) => ({
        id: `new_edge_${batch}_${i}`,
        from: `n${batch % 50}`,
        to: n.id,
        fromHandle: `n${batch % 50}_out`,
        toHandle: `${n.id}_in`,
      }));

      inc.addNodes(newNodes, newEdges);
    }

    const elapsed = performance.now() - start;

    const result = inc.getResult()!;
    expect(result.nodes).toHaveLength(100);
    expect(elapsed).toBeLessThan(10000);
    expect(checkFinitePositions(result)).toBe(true);

    console.log(`10 incremental batches: ${elapsed.toFixed(1)}ms`);
  });
});
