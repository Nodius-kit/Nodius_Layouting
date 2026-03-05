import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { checkFinitePositions, checkNoOverlaps, getNode } from './helpers';
import { NodeInput, EdgeInput } from '../src/types';

describe('Handle Positions', () => {
  it('should correctly position handles on all four sides', () => {
    const node: NodeInput = {
      id: 'A',
      width: 200,
      height: 100,
      handles: [
        { id: 'top', type: 'input', position: 'top', offset: 0.5 },
        { id: 'bottom', type: 'output', position: 'bottom', offset: 0.5 },
        { id: 'left', type: 'input', position: 'left', offset: 0.5 },
        { id: 'right', type: 'output', position: 'right', offset: 0.5 },
      ],
    };

    const result = layout({ nodes: [node], edges: [] });
    const a = getNode(result, 'A')!;

    const top = a.handles.find(h => h.id === 'top')!;
    const bottom = a.handles.find(h => h.id === 'bottom')!;
    const left = a.handles.find(h => h.id === 'left')!;
    const right = a.handles.find(h => h.id === 'right')!;

    // Top: center x, y = node.y
    expect(top.x).toBeCloseTo(a.x + 100);
    expect(top.y).toBeCloseTo(a.y);

    // Bottom: center x, y = node.y + height
    expect(bottom.x).toBeCloseTo(a.x + 100);
    expect(bottom.y).toBeCloseTo(a.y + 100);

    // Left: x = node.x, center y
    expect(left.x).toBeCloseTo(a.x);
    expect(left.y).toBeCloseTo(a.y + 50);

    // Right: x = node.x + width, center y
    expect(right.x).toBeCloseTo(a.x + 200);
    expect(right.y).toBeCloseTo(a.y + 50);
  });

  it('should correctly handle offsets', () => {
    const node: NodeInput = {
      id: 'A',
      width: 200,
      height: 100,
      handles: [
        { id: 'top_left', type: 'input', position: 'top', offset: 0.0 },
        { id: 'top_right', type: 'input', position: 'top', offset: 1.0 },
        { id: 'top_quarter', type: 'input', position: 'top', offset: 0.25 },
        { id: 'left_top', type: 'input', position: 'left', offset: 0.0 },
        { id: 'left_bottom', type: 'input', position: 'left', offset: 1.0 },
      ],
    };

    const result = layout({ nodes: [node], edges: [] });
    const a = getNode(result, 'A')!;

    const topLeft = a.handles.find(h => h.id === 'top_left')!;
    const topRight = a.handles.find(h => h.id === 'top_right')!;
    const topQuarter = a.handles.find(h => h.id === 'top_quarter')!;
    const leftTop = a.handles.find(h => h.id === 'left_top')!;
    const leftBottom = a.handles.find(h => h.id === 'left_bottom')!;

    expect(topLeft.x).toBeCloseTo(a.x + 0);
    expect(topRight.x).toBeCloseTo(a.x + 200);
    expect(topQuarter.x).toBeCloseTo(a.x + 50);
    expect(leftTop.y).toBeCloseTo(a.y + 0);
    expect(leftBottom.y).toBeCloseTo(a.y + 100);
  });

  it('should correctly route edges between specific handles', () => {
    const nodes: NodeInput[] = [
      {
        id: 'A',
        width: 150,
        height: 80,
        handles: [
          { id: 'out_right', type: 'output', position: 'right', offset: 0.5 },
          { id: 'out_bottom', type: 'output', position: 'bottom', offset: 0.5 },
        ],
      },
      {
        id: 'B',
        width: 150,
        height: 80,
        handles: [
          { id: 'in_left', type: 'input', position: 'left', offset: 0.5 },
          { id: 'in_top', type: 'input', position: 'top', offset: 0.5 },
        ],
      },
    ];

    const edges: EdgeInput[] = [
      { id: 'e1', from: 'A', to: 'B', fromHandle: 'out_bottom', toHandle: 'in_top' },
    ];

    const result = layout({ nodes, edges });
    expect(result.edges).toHaveLength(1);

    const edge = result.edges[0];
    expect(edge.points.length).toBeGreaterThanOrEqual(2);

    // First point should be at A's out_bottom handle
    const a = getNode(result, 'A')!;
    const firstPoint = edge.points[0];
    expect(firstPoint.x).toBeCloseTo(a.x + 75); // center of A
    expect(firstPoint.y).toBeCloseTo(a.y + 80); // bottom of A

    // Last point should be at B's in_top handle
    const b = getNode(result, 'B')!;
    const lastPoint = edge.points[edge.points.length - 1];
    expect(lastPoint.x).toBeCloseTo(b.x + 75); // center of B
    expect(lastPoint.y).toBeCloseTo(b.y); // top of B

    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle multiple handles on the same side', () => {
    const node: NodeInput = {
      id: 'A',
      width: 200,
      height: 100,
      handles: [
        { id: 'out1', type: 'output', position: 'bottom', offset: 0.2 },
        { id: 'out2', type: 'output', position: 'bottom', offset: 0.5 },
        { id: 'out3', type: 'output', position: 'bottom', offset: 0.8 },
      ],
    };

    const result = layout({ nodes: [node], edges: [] });
    const a = getNode(result, 'A')!;

    const out1 = a.handles.find(h => h.id === 'out1')!;
    const out2 = a.handles.find(h => h.id === 'out2')!;
    const out3 = a.handles.find(h => h.id === 'out3')!;

    // Handles should be ordered left to right
    expect(out1.x).toBeLessThan(out2.x);
    expect(out2.x).toBeLessThan(out3.x);

    // All on bottom
    expect(out1.y).toBeCloseTo(a.y + 100);
    expect(out2.y).toBeCloseTo(a.y + 100);
    expect(out3.y).toBeCloseTo(a.y + 100);
  });

  it('should layout nodes with many handles connected to different targets', () => {
    const nodes: NodeInput[] = [
      {
        id: 'hub',
        width: 200,
        height: 120,
        handles: [
          { id: 'out1', type: 'output', position: 'bottom', offset: 0.2 },
          { id: 'out2', type: 'output', position: 'bottom', offset: 0.4 },
          { id: 'out3', type: 'output', position: 'bottom', offset: 0.6 },
          { id: 'out4', type: 'output', position: 'bottom', offset: 0.8 },
          { id: 'out_r1', type: 'output', position: 'right', offset: 0.3 },
          { id: 'out_r2', type: 'output', position: 'right', offset: 0.7 },
        ],
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `target${i}`,
        width: 100,
        height: 60,
        handles: [
          { id: `target${i}_in`, type: 'input' as const, position: 'top' as const, offset: 0.5 },
        ],
      })),
    ];

    const edges: EdgeInput[] = [
      { id: 'e1', from: 'hub', to: 'target0', fromHandle: 'out1', toHandle: 'target0_in' },
      { id: 'e2', from: 'hub', to: 'target1', fromHandle: 'out2', toHandle: 'target1_in' },
      { id: 'e3', from: 'hub', to: 'target2', fromHandle: 'out3', toHandle: 'target2_in' },
      { id: 'e4', from: 'hub', to: 'target3', fromHandle: 'out4', toHandle: 'target3_in' },
      { id: 'e5', from: 'hub', to: 'target4', fromHandle: 'out_r1', toHandle: 'target4_in' },
      { id: 'e6', from: 'hub', to: 'target5', fromHandle: 'out_r2', toHandle: 'target5_in' },
    ];

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(7);
    expect(result.edges).toHaveLength(6);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });
});
