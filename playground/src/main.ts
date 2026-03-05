import { layout } from 'nodius-layouting';
import type { LayoutInput, LayoutOptions } from 'nodius-layouting';
import { examples } from './examples';
import { renderInput, renderResult } from './renderer';

// DOM elements
const exampleSelect = document.getElementById('example-select') as HTMLSelectElement;
const directionSelect = document.getElementById('direction-select') as HTMLSelectElement;
const nodeSpacingInput = document.getElementById('node-spacing') as HTMLInputElement;
const layerSpacingInput = document.getElementById('layer-spacing') as HTMLInputElement;
const nodeSpacingValue = document.getElementById('node-spacing-value') as HTMLSpanElement;
const layerSpacingValue = document.getElementById('layer-spacing-value') as HTMLSpanElement;
const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement;
const timingSpan = document.getElementById('timing') as HTMLSpanElement;
const jsonEditor = document.getElementById('json-editor') as HTMLTextAreaElement;
const svgBefore = document.getElementById('svg-before') as HTMLDivElement;
const svgAfter = document.getElementById('svg-after') as HTMLDivElement;

// Populate example selector
for (const name of Object.keys(examples)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  exampleSelect.appendChild(option);
}

// State
let currentInput: LayoutInput = examples[Object.keys(examples)[0]];

function loadExample(name: string): void {
  const example = examples[name];
  if (!example) return;
  currentInput = example;
  jsonEditor.value = JSON.stringify(example, null, 2);
  renderInput(svgBefore, currentInput);
  applyLayout();
}

function applyLayout(): void {
  try {
    // Parse JSON from editor
    currentInput = JSON.parse(jsonEditor.value) as LayoutInput;
  } catch (e) {
    timingSpan.textContent = 'Invalid JSON';
    return;
  }

  const options: LayoutOptions = {
    direction: directionSelect.value as LayoutOptions['direction'],
    nodeSpacing: parseInt(nodeSpacingInput.value),
    layerSpacing: parseInt(layerSpacingInput.value),
  };

  renderInput(svgBefore, currentInput);

  const start = performance.now();
  const result = layout(currentInput, options);
  const elapsed = performance.now() - start;

  renderResult(svgAfter, result);
  timingSpan.textContent = `Layout: ${elapsed.toFixed(1)}ms | ${result.nodes.length} nodes, ${result.edges.length} edges`;
}

// Event listeners
exampleSelect.addEventListener('change', () => loadExample(exampleSelect.value));
applyBtn.addEventListener('click', applyLayout);

nodeSpacingInput.addEventListener('input', () => {
  nodeSpacingValue.textContent = nodeSpacingInput.value;
});

layerSpacingInput.addEventListener('input', () => {
  layerSpacingValue.textContent = layerSpacingInput.value;
});

// Ctrl+Enter to apply
jsonEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    applyLayout();
  }
});

// Initialize
loadExample(Object.keys(examples)[0]);
