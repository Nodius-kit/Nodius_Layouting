import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { makeNode, makeEdge, makeChain, makeDiamond, checkNoOverlaps, checkFinitePositions, checkEdgeValidity, getNode } from './helpers';

describe('Basic Layout', () => {
  it('should layout a single node', () => {
    const result = layout({
      nodes: [makeNode('A')],
      edges: [],
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('A');
    expect(result.nodes[0].x).toBeGreaterThanOrEqual(0);
    expect(result.nodes[0].y).toBeGreaterThanOrEqual(0);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout two connected nodes', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);

    const nodeA = getNode(result, 'A')!;
    const nodeB = getNode(result, 'B')!;

    // In TB direction, A should be above B
    expect(nodeA.y).toBeLessThan(nodeB.y);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout a chain of nodes', () => {
    const result = layout(makeChain(5));

    expect(result.nodes).toHaveLength(5);
    expect(result.edges).toHaveLength(4);

    // Nodes should be in order from top to bottom
    for (let i = 0; i < 4; i++) {
      const curr = getNode(result, `n${i}`)!;
      const next = getNode(result, `n${i + 1}`)!;
      expect(curr.y).toBeLessThan(next.y);
    }

    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout a diamond graph', () => {
    const result = layout(makeDiamond());

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;
    const d = getNode(result, 'D')!;

    // A should be on top, D on bottom
    expect(a.y).toBeLessThan(b.y);
    expect(a.y).toBeLessThan(c.y);
    expect(b.y).toBeLessThan(d.y);
    expect(c.y).toBeLessThan(d.y);

    // B and C should be on the same layer
    expect(b.y).toBeCloseTo(c.y, 0);

    // B and C should not overlap
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should layout disconnected nodes', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [],
    });

    expect(result.nodes).toHaveLength(3);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle empty graph', () => {
    const result = layout({ nodes: [], edges: [] });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('should output correct node dimensions', () => {
    const result = layout({
      nodes: [makeNode('A', 200, 100)],
      edges: [],
    });

    const a = getNode(result, 'A')!;
    expect(a.width).toBe(200);
    expect(a.height).toBe(100);
  });

  it('should output handle positions', () => {
    const result = layout({
      nodes: [makeNode('A')],
      edges: [],
    });

    const a = getNode(result, 'A')!;
    expect(a.handles).toHaveLength(2);

    const inHandle = a.handles.find(h => h.id === 'A_in')!;
    const outHandle = a.handles.find(h => h.id === 'A_out')!;

    // Input handle on top center
    expect(inHandle.x).toBeCloseTo(a.x + a.width / 2);
    expect(inHandle.y).toBeCloseTo(a.y);

    // Output handle on bottom center
    expect(outHandle.x).toBeCloseTo(a.x + a.width / 2);
    expect(outHandle.y).toBeCloseTo(a.y + a.height);
  });

  it('should respect nodeSpacing option', () => {
    const result = layout(
      {
        nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
        edges: [
          makeEdge('e1', 'A', 'C'),
          makeEdge('e2', 'B', 'C'),
        ],
      },
      { nodeSpacing: 80 }
    );

    // A and B are on the same layer
    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;

    // They should be at least 80px apart
    const gap = Math.abs(a.x - (b.x + b.width));
    const gap2 = Math.abs(b.x - (a.x + a.width));
    const minGap = Math.min(gap, gap2);
    expect(minGap).toBeGreaterThanOrEqual(79.9); // Small tolerance for floating point
  });

  it('should respect layerSpacing option', () => {
    const result = layout(
      {
        nodes: [makeNode('A', 120, 60), makeNode('B', 120, 60)],
        edges: [makeEdge('e1', 'A', 'B')],
      },
      { layerSpacing: 100 }
    );

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;

    const gap = b.y - (a.y + a.height);
    expect(gap).toBeGreaterThanOrEqual(99.9);
  });

  it('should preserve all node IDs in output', () => {
    const input = makeChain(10);
    const result = layout(input);

    const outputIds = new Set(result.nodes.map(n => n.id));
    for (const node of input.nodes) {
      expect(outputIds.has(node.id)).toBe(true);
    }
  });

  it('should preserve all edge IDs in output', () => {
    const input = makeDiamond();
    const result = layout(input);

    const outputIds = new Set(result.edges.map(e => e.id));
    for (const edge of input.edges) {
      expect(outputIds.has(edge.id)).toBe(true);
    }
  });
});
