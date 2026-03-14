/**
 * blocks/definitions.ts — Built-in block type definitions.
 *
 * Registers the core block types that ship with the editor: text,
 * heading, image, and code.  Each definition specifies default data,
 * HTML serialisation, and an accessible label.
 *
 * These blocks are always available.  Optional blocks (e.g. D3 graph)
 * live in separate modules and are registered by the consumer.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { BlockDefinition } from '../core/types';
import { registerBlock } from '../core/registry';

// ── Data shapes ───────────────────────────────────────────────────────────

export interface TextBlockData {
  html: string;
}

export interface HeadingBlockData {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ImageBlockData {
  src: string;
  alt: string;
  caption: string;
}

export interface CodeBlockData {
  language: string;
  code: string;
}

// ── Definitions ───────────────────────────────────────────────────────────

export const textBlockDef: BlockDefinition<TextBlockData> = {
  type: 'text',
  displayName: 'Text',
  description: 'A rich-text paragraph block.',
  icon: '📝',
  category: 'text',
  defaultData: () => ({ html: '' }),
  toHTML: (data) => `<div class="block-text">${data.html}</div>`,
  ariaLabel: (data) => {
    // Strip HTML tags iteratively to handle any residual fragments
    let plain = data.html;
    let prev = '';
    while (prev !== plain) {
      prev = plain;
      plain = plain.replace(/<[^>]*>/g, '');
    }
    plain = plain.slice(0, 80).trim();
    return plain ? `Text block: ${plain}` : 'Empty text block';
  },
};

export const headingBlockDef: BlockDefinition<HeadingBlockData> = {
  type: 'heading',
  displayName: 'Heading',
  description: 'A heading (H1–H6) to structure content.',
  icon: '🔤',
  category: 'text',
  defaultData: () => ({ level: 2, text: '' }),
  toHTML: (data) => `<h${data.level}>${data.text}</h${data.level}>`,
  ariaLabel: (data) =>
    data.text
      ? `Heading level ${data.level}: ${data.text}`
      : `Empty heading level ${data.level}`,
};

export const imageBlockDef: BlockDefinition<ImageBlockData> = {
  type: 'image',
  displayName: 'Image',
  description: 'An image with alt text and optional caption.',
  icon: '🖼️',
  category: 'media',
  defaultData: () => ({ src: '', alt: '', caption: '' }),
  toHTML: (data) => {
    const caption = data.caption
      ? `<figcaption>${data.caption}</figcaption>`
      : '';
    return (
      `<figure class="block-image">` +
      `<img src="${data.src}" alt="${data.alt}" />` +
      `${caption}</figure>`
    );
  },
  ariaLabel: (data) =>
    data.alt ? `Image: ${data.alt}` : 'Image block (no alt text set)',
};

export const codeBlockDef: BlockDefinition<CodeBlockData> = {
  type: 'code',
  displayName: 'Code',
  description: 'A code snippet with optional language tag.',
  icon: '💻',
  category: 'text',
  defaultData: () => ({ language: '', code: '' }),
  toHTML: (data) => {
    const lang = data.language ? ` class="language-${data.language}"` : '';
    return `<pre><code${lang}>${data.code}</code></pre>`;
  },
  ariaLabel: (data) => {
    const lang = data.language ? ` (${data.language})` : '';
    const preview = data.code.slice(0, 60);
    return preview ? `Code block${lang}: ${preview}` : `Empty code block${lang}`;
  },
};

// ── Bulk registration ─────────────────────────────────────────────────────

/**
 * Register all built-in block types.
 * Call once during application initialisation.
 */
export function registerBuiltinBlocks(): void {
  registerBlock(textBlockDef);
  registerBlock(headingBlockDef);
  registerBlock(imageBlockDef);
  registerBlock(codeBlockDef);
}
