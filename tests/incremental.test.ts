import { describe, it, expect } from 'vitest';
import { IncrementalLayout } from '../src';
import { makeNode, makeEdge, checkNoOverlaps, checkFinitePositions, checkEdgeValidity, getNode } from './helpers';

describe('Incremental Layout', () => {
  it('should compute initial layout with setGraph', () => {
    const inc = new IncrementalLayout();
    const result = inc.setGraph({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should add a node incrementally', () => {
    const inc = new IncrementalLayout();

    // Initial layout: A -> B
    const result1 = inc.setGraph({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    expect(result1.nodes).toHaveLength(2);

    // Add node C connected to B
    const result2 = inc.addNodes(
      [makeNode('C')],
      [makeEdge('e2', 'B', 'C')]
    );

    expect(result2.nodes).toHaveLength(3);
    expect(result2.edges).toHaveLength(2);
    expect(checkNoOverlaps(result2)).toBe(true);
    expect(checkFinitePositions(result2)).toBe(true);

    // C should be below B
    const b = getNode(result2, 'B')!;
    const c = getNode(result2, 'C')!;
    expect(b.y).toBeLessThan(c.y);
  });

  it('should maintain stability when adding nodes', () => {
    const inc = new IncrementalLayout();

    const result1 = inc.setGraph({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'A', 'C'),
      ],
    });

    const aPos1 = getNode(result1, 'A')!;
    const bPos1 = getNode(result1, 'B')!;

    // Add a new node D connected to B
    const result2 = inc.addNodes(
      [makeNode('D')],
      [makeEdge('e3', 'B', 'D')]
    );

    const aPos2 = getNode(result2, 'A')!;

    // A's position should not have changed dramatically
    const distA = Math.sqrt(
      Math.pow(aPos1.x - aPos2.x, 2) + Math.pow(aPos1.y - aPos2.y, 2)
    );

    // Allow some movement but not drastic
    expect(distA).toBeLessThan(200);
  });

  it('should remove nodes', () => {
    const inc = new IncrementalLayout();

    const result1 = inc.setGraph({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'B', 'C'),
      ],
    });

    expect(result1.nodes).toHaveLength(3);

    // Remove B (should also remove connected edges)
    const result2 = inc.removeNodes(['B']);

    expect(result2.nodes).toHaveLength(2);
    expect(result2.edges).toHaveLength(0);
    expect(checkNoOverlaps(result2)).toBe(true);
    expect(checkFinitePositions(result2)).toBe(true);
  });

  it('should add edges between existing nodes', () => {
    const inc = new IncrementalLayout();

    inc.setGraph({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    const result = inc.addEdges([makeEdge('e2', 'A', 'C')]);

    expect(result.edges).toHaveLength(2);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should remove edges', () => {
    const inc = new IncrementalLayout();

    inc.setGraph({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    const result = inc.removeEdges(['e1']);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(0);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle multiple incremental additions', () => {
    const inc = new IncrementalLayout();

    inc.setGraph({
      nodes: [makeNode('A')],
      edges: [],
    });

    // Add B
    inc.addNodes([makeNode('B')], [makeEdge('e1', 'A', 'B')]);

    // Add C
    inc.addNodes([makeNode('C')], [makeEdge('e2', 'B', 'C')]);

    // Add D
    const result = inc.addNodes([makeNode('D')], [makeEdge('e3', 'C', 'D')]);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);

    // Should be in order A -> B -> C -> D
    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const c = getNode(result, 'C')!;
    const d = getNode(result, 'D')!;

    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);
    expect(c.y).toBeLessThan(d.y);

    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle setGraph after incremental updates', () => {
    const inc = new IncrementalLayout();

    inc.setGraph({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    inc.addNodes([makeNode('C')], [makeEdge('e2', 'B', 'C')]);

    // Reset with new graph
    const result = inc.setGraph({
      nodes: [makeNode('X'), makeNode('Y')],
      edges: [makeEdge('e1', 'X', 'Y')],
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map(n => n.id).sort()).toEqual(['X', 'Y']);
  });

  it('should return current result via getResult', () => {
    const inc = new IncrementalLayout();

    expect(inc.getResult()).toBeNull();

    inc.setGraph({
      nodes: [makeNode('A')],
      edges: [],
    });

    const result = inc.getResult();
    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(1);
  });

  it('should add multiple nodes at once', () => {
    const inc = new IncrementalLayout();

    inc.setGraph({
      nodes: [makeNode('root')],
      edges: [],
    });

    const result = inc.addNodes(
      [makeNode('A'), makeNode('B'), makeNode('C')],
      [
        makeEdge('e1', 'root', 'A'),
        makeEdge('e2', 'root', 'B'),
        makeEdge('e3', 'root', 'C'),
      ]
    );

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });
});
