import type { LayoutInput } from 'nodius-layouting';

export const examples: Record<string, LayoutInput> = {
  'Simple Chain': {
    nodes: [
      { id: 'A', width: 120, height: 60, handles: [
        { id: 'A_in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'A_out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'B', width: 120, height: 60, handles: [
        { id: 'B_in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'B_out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'C', width: 120, height: 60, handles: [
        { id: 'C_in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'C_out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
    ],
    edges: [
      { id: 'e1', from: 'A', to: 'B', fromHandle: 'A_out', toHandle: 'B_in' },
      { id: 'e2', from: 'B', to: 'C', fromHandle: 'B_out', toHandle: 'C_in' },
    ],
  },

  'Diamond': {
    nodes: [
      { id: 'Start', width: 140, height: 60, handles: [
        { id: 'out1', type: 'output', position: 'bottom', offset: 0.3 },
        { id: 'out2', type: 'output', position: 'bottom', offset: 0.7 },
      ]},
      { id: 'Left', width: 120, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Right', width: 120, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'End', width: 140, height: 60, handles: [
        { id: 'in1', type: 'input', position: 'top', offset: 0.3 },
        { id: 'in2', type: 'input', position: 'top', offset: 0.7 },
      ]},
    ],
    edges: [
      { id: 'e1', from: 'Start', to: 'Left', fromHandle: 'out1', toHandle: 'in' },
      { id: 'e2', from: 'Start', to: 'Right', fromHandle: 'out2', toHandle: 'in' },
      { id: 'e3', from: 'Left', to: 'End', fromHandle: 'out', toHandle: 'in1' },
      { id: 'e4', from: 'Right', to: 'End', fromHandle: 'out', toHandle: 'in2' },
    ],
  },

  'Data Pipeline': {
    nodes: [
      { id: 'Source A', width: 100, height: 60, handles: [
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Source B', width: 100, height: 60, handles: [
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Transform', width: 160, height: 80, handles: [
        { id: 'in1', type: 'input', position: 'top', offset: 0.3 },
        { id: 'in2', type: 'input', position: 'top', offset: 0.7 },
        { id: 'out1', type: 'output', position: 'bottom', offset: 0.3 },
        { id: 'out2', type: 'output', position: 'bottom', offset: 0.7 },
        { id: 'err', type: 'output', position: 'right', offset: 0.5 },
      ]},
      { id: 'Filter', width: 120, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'pass', type: 'output', position: 'bottom', offset: 0.3 },
        { id: 'reject', type: 'output', position: 'bottom', offset: 0.7 },
      ]},
      { id: 'Aggregate', width: 140, height: 70, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Error Log', width: 120, height: 60, handles: [
        { id: 'in', type: 'input', position: 'left', offset: 0.5 },
      ]},
      { id: 'Output 1', width: 100, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
      ]},
      { id: 'Output 2', width: 100, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
      ]},
    ],
    edges: [
      { id: 'e1', from: 'Source A', to: 'Transform', fromHandle: 'out', toHandle: 'in1' },
      { id: 'e2', from: 'Source B', to: 'Transform', fromHandle: 'out', toHandle: 'in2' },
      { id: 'e3', from: 'Transform', to: 'Filter', fromHandle: 'out1', toHandle: 'in' },
      { id: 'e4', from: 'Transform', to: 'Aggregate', fromHandle: 'out2', toHandle: 'in' },
      { id: 'e5', from: 'Transform', to: 'Error Log', fromHandle: 'err', toHandle: 'in' },
      { id: 'e6', from: 'Filter', to: 'Output 1', fromHandle: 'pass', toHandle: 'in' },
      { id: 'e7', from: 'Filter', to: 'Output 2', fromHandle: 'reject', toHandle: 'in' },
      { id: 'e8', from: 'Aggregate', to: 'Output 1', fromHandle: 'out', toHandle: 'in' },
    ],
  },

  'Multi-Handle Hub': {
    nodes: [
      { id: 'Hub', width: 200, height: 120, handles: [
        { id: 'out1', type: 'output', position: 'bottom', offset: 0.15 },
        { id: 'out2', type: 'output', position: 'bottom', offset: 0.35 },
        { id: 'out3', type: 'output', position: 'bottom', offset: 0.55 },
        { id: 'out4', type: 'output', position: 'bottom', offset: 0.75 },
        { id: 'out_r1', type: 'output', position: 'right', offset: 0.3 },
        { id: 'out_r2', type: 'output', position: 'right', offset: 0.7 },
      ]},
      ...['Worker 1', 'Worker 2', 'Worker 3', 'Worker 4', 'Monitor A', 'Monitor B'].map((name, i) => ({
        id: name,
        width: 110,
        height: 50,
        handles: [
          { id: `${name}_in`, type: 'input' as const, position: 'top' as const, offset: 0.5 },
          { id: `${name}_out`, type: 'output' as const, position: 'bottom' as const, offset: 0.5 },
        ],
      })),
      { id: 'Collector', width: 160, height: 60, handles: [
        { id: 'in1', type: 'input', position: 'top', offset: 0.2 },
        { id: 'in2', type: 'input', position: 'top', offset: 0.4 },
        { id: 'in3', type: 'input', position: 'top', offset: 0.6 },
        { id: 'in4', type: 'input', position: 'top', offset: 0.8 },
      ]},
    ],
    edges: [
      { id: 'e1', from: 'Hub', to: 'Worker 1', fromHandle: 'out1', toHandle: 'Worker 1_in' },
      { id: 'e2', from: 'Hub', to: 'Worker 2', fromHandle: 'out2', toHandle: 'Worker 2_in' },
      { id: 'e3', from: 'Hub', to: 'Worker 3', fromHandle: 'out3', toHandle: 'Worker 3_in' },
      { id: 'e4', from: 'Hub', to: 'Worker 4', fromHandle: 'out4', toHandle: 'Worker 4_in' },
      { id: 'e5', from: 'Hub', to: 'Monitor A', fromHandle: 'out_r1', toHandle: 'Monitor A_in' },
      { id: 'e6', from: 'Hub', to: 'Monitor B', fromHandle: 'out_r2', toHandle: 'Monitor B_in' },
      { id: 'e7', from: 'Worker 1', to: 'Collector', fromHandle: 'Worker 1_out', toHandle: 'in1' },
      { id: 'e8', from: 'Worker 2', to: 'Collector', fromHandle: 'Worker 2_out', toHandle: 'in2' },
      { id: 'e9', from: 'Worker 3', to: 'Collector', fromHandle: 'Worker 3_out', toHandle: 'in3' },
      { id: 'e10', from: 'Worker 4', to: 'Collector', fromHandle: 'Worker 4_out', toHandle: 'in4' },
    ],
  },

  'Binary Tree': (() => {
    const nodes: LayoutInput['nodes'] = [];
    const edges: LayoutInput['edges'] = [];
    for (let i = 0; i < 15; i++) {
      nodes.push({
        id: `N${i}`,
        width: 80,
        height: 40,
        handles: [
          { id: `N${i}_in`, type: 'input', position: 'top', offset: 0.5 },
          { id: `N${i}_out_l`, type: 'output', position: 'bottom', offset: 0.3 },
          { id: `N${i}_out_r`, type: 'output', position: 'bottom', offset: 0.7 },
        ],
      });
      if (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        const isLeft = i % 2 === 1;
        edges.push({
          id: `e_${parent}_${i}`,
          from: `N${parent}`,
          to: `N${i}`,
          fromHandle: isLeft ? `N${parent}_out_l` : `N${parent}_out_r`,
          toHandle: `N${i}_in`,
        });
      }
    }
    return { nodes, edges };
  })(),

  'Cycle Example': {
    nodes: [
      { id: 'Init', width: 100, height: 50, handles: [
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Process', width: 130, height: 60, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'feedback_in', type: 'input', position: 'left', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ]},
      { id: 'Check', width: 110, height: 50, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'ok', type: 'output', position: 'bottom', offset: 0.5 },
        { id: 'retry', type: 'output', position: 'left', offset: 0.5 },
      ]},
      { id: 'Done', width: 100, height: 50, handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
      ]},
    ],
    edges: [
      { id: 'e1', from: 'Init', to: 'Process', fromHandle: 'out', toHandle: 'in' },
      { id: 'e2', from: 'Process', to: 'Check', fromHandle: 'out', toHandle: 'in' },
      { id: 'e3', from: 'Check', to: 'Done', fromHandle: 'ok', toHandle: 'in' },
      { id: 'e4', from: 'Check', to: 'Process', fromHandle: 'retry', toHandle: 'feedback_in' },
    ],
  },
};
