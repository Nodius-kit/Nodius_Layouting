import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { makeNode, makeEdge, checkNoOverlaps, checkFinitePositions, getNode } from './helpers';

describe('Layout Directions', () => {
  const simpleGraph = {
    nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
    edges: [
      makeEdge('e1', 'A', 'B'),
      makeEdge('e2', 'B', 'C'),
    ],
  };

  it('should layout top-to-bottom (TB)', () => {
    const result = layout(simpleGraph, { direction: 'TB' });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;

    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout left-to-right (LR)', () => {
    const result = layout(simpleGraph, { direction: 'LR' });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;

    // In LR, nodes should progress left to right
    expect(a.x).toBeLessThan(b.x);
    expect(b.x).toBeLessThan(c.x);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout bottom-to-top (BT)', () => {
    const result = layout(simpleGraph, { direction: 'BT' });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;

    // In BT, source node should be at the bottom (higher y)
    expect(a.y).toBeGreaterThan(b.y);
    expect(b.y).toBeGreaterThan(c.y);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout right-to-left (RL)', () => {
    const result = layout(simpleGraph, { direction: 'RL' });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;

    // In RL, source node should be on the right (higher x)
    expect(a.x).toBeGreaterThan(b.x);
    expect(b.x).toBeGreaterThan(c.x);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should maintain no overlaps in LR direction with many nodes', () => {
    const nodes = Array.from({ length: 15 }, (_, i) => makeNode(`n${i}`));
    const edges = [
      makeEdge('e1', 'n0', 'n1'),
      makeEdge('e2', 'n0', 'n2'),
      makeEdge('e3', 'n0', 'n3'),
      makeEdge('e4', 'n1', 'n4'),
      makeEdge('e5', 'n2', 'n5'),
      makeEdge('e6', 'n3', 'n6'),
      makeEdge('e7', 'n4', 'n7'),
      makeEdge('e8', 'n5', 'n7'),
      makeEdge('e9', 'n6', 'n8'),
      makeEdge('e10', 'n7', 'n9'),
      makeEdge('e11', 'n8', 'n9'),
      makeEdge('e12', 'n9', 'n10'),
    ];

    const result = layout({ nodes, edges }, { direction: 'LR' });

    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });
});
