import { marked } from "marked";

// Configure marked for better HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
});

export interface MarkOverOptions {
  mode: "web" | "paged";
  zoom: number;
}

export class MarkOverParser {
  /**
   * Parse MarkOver (.mo) text into HTML
   * Supports:
   * - Standard Markdown syntax
   * - Angle Blocks: <>'classes'...content...</>
   */
  static parse(
    text: string,
    _options: MarkOverOptions = { mode: "web", zoom: 100 }
  ): string {
    if (!text.trim()) return "";

    // Process blocks recursively to handle nesting
    const processed = this.processAllBlocks(text);

    // Process Markdown content that's not inside divs
    const html = this.processMarkdownOutsideDivs(processed);

    return html;
  }

  /**
   * Process Markdown content that's outside of div elements
   */
  private static processMarkdownOutsideDivs(text: string): string {
    // Use a more sophisticated approach to handle nested divs
    const result = this.splitByDivsAndProcessMarkdown(text);
    return result;
  }

  /**
   * Split text by div elements (handling nesting) and process Markdown in non-div parts
   */
  private static splitByDivsAndProcessMarkdown(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
      // Look for the next div opening tag
      const divStart = text.indexOf('<div class="', i);

      if (divStart === -1) {
        // No more divs, process the rest as Markdown
        const remaining = text.substring(i);
        if (remaining.trim()) {
          result += marked.parse(remaining) as string;
        }
        break;
      }

      // Process content before the div as Markdown
      const beforeDiv = text.substring(i, divStart);
      if (beforeDiv.trim()) {
        result += marked.parse(beforeDiv) as string;
      }

      // Find the matching closing div tag (handling nesting)
      const divEnd = this.findMatchingDivEnd(text, divStart);
      if (divEnd === -1) {
        // No matching closing tag, process the rest as Markdown
        const remaining = text.substring(divStart);
        if (remaining.trim()) {
          result += marked.parse(remaining) as string;
        }
        break;
      }

      // Extract the complete div (including nested divs)
      const divContent = text.substring(divStart, divEnd + 6); // +6 for "</div>"
      result += divContent;

      // Move to after this div
      i = divEnd + 6;
    }

    return result;
  }

  /**
   * Find the matching closing div tag for a given opening div tag
   */
  private static findMatchingDivEnd(text: string, startIndex: number): number {
    let depth = 0;
    let i = startIndex;

    while (i < text.length) {
      const divStart = text.indexOf("<div", i);
      const divEnd = text.indexOf("</div>", i);

      if (divStart === -1 && divEnd === -1) {
        break;
      }

      if (divStart !== -1 && (divEnd === -1 || divStart < divEnd)) {
        // Found opening div
        depth++;
        i = divStart + 4; // Move past '<div'
      } else if (divEnd !== -1) {
        // Found closing div
        depth--;
        if (depth === 0) {
          return divEnd;
        }
        i = divEnd + 6; // Move past '</div>'
      } else {
        break;
      }
    }

    return -1; // No matching closing tag found
  }

  /**
   * Process all blocks recursively to handle nesting
   */
  private static processAllBlocks(text: string): string {
    // First, protect code blocks from Angle Block processing
    const { protectedText, codeBlocks } = this.protectCodeBlocks(text);

    let result = protectedText;
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    // Keep processing until no more blocks are found
    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      // Process Angle Blocks - keep processing until no more changes
      const angleProcessed = this.processAngleBlocks(result);
      if (angleProcessed !== result) {
        result = angleProcessed;
        hasChanges = true;
      }
    }

    // If we still have unprocessed Angle Blocks after max iterations,
    // remove them to prevent breaking Markdown processing
    if (result.includes("<>'")) {
      console.warn(
        "Removing unprocessed Angle Blocks to prevent Markdown parsing issues"
      );
      // Remove incomplete Angle Blocks and their content
      result = result.replace(/<>'[^']*'[\s\S]*?(?=<>'|<\/>|$)/g, "");
      // Remove any remaining closing tags that don't have matching opening tags
      result = result.replace(/<\/>/g, "");
    }

    // Restore the protected code blocks
    result = this.restoreCodeBlocks(result, codeBlocks);

    return result;
  }

  /**
   * Process Angle Blocks: <>'classes'...content...</>
   * Converts to <div class="classes">...content...</div>
   * Supports nested blocks by processing recursively
   */
  private static processAngleBlocks(text: string): string {
    const angleBlockRegex = /<>'([^']+)'/g;
    let result = text;
    let match;

    // Find and process the first (innermost) Angle Block
    while ((match = angleBlockRegex.exec(result)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const classes = match[1].trim();

      // Find the matching closing tag
      const closingIndex = this.findMatchingClosingTag(
        result,
        startIndex,
        fullMatch
      );

      if (closingIndex !== -1) {
        const contentStart = startIndex + fullMatch.length;
        const actualContent = result.substring(contentStart, closingIndex);
        const endIndex = closingIndex + 4; // Length of </>

        // Process the content recursively
        const processedContent = this.processAllBlocks(actualContent);

        // Parse the content as Markdown
        const parsedContent = marked.parse(processedContent) as string;

        // Replace the block
        const beforeBlock = result.substring(0, startIndex);
        const afterBlock = result.substring(endIndex);

        result =
          beforeBlock +
          `<div class="${classes}">${parsedContent}</div>` +
          afterBlock;

        // Reset regex to start from the beginning
        angleBlockRegex.lastIndex = 0;
        break; // Process one block at a time
      } else {
        // If no closing tag found, skip this block and continue
        // This prevents breaking the rest of the content
        console.warn("Angle Block not properly closed, skipping:", fullMatch);
        break;
      }
    }

    return result;
  }

  /**
   * Find the matching closing tag for Angle Blocks
   */
  private static findMatchingClosingTag(
    text: string,
    startIndex: number,
    openingTag: string
  ): number {
    // For Angle Blocks: find the next closing tag
    // This handles both nested and multiple blocks at the same level
    let depth = 1;
    let i = startIndex + openingTag.length;

    while (i < text.length && depth > 0) {
      const remainingText = text.substring(i);

      // Look for opening Angle Blocks (complete pattern)
      const openingMatch = remainingText.search(/<>'[^']*'/);

      // Look for closing Angle Blocks
      const closingMatch = remainingText.search(/<\/>/);

      // If both found, use the one that comes first
      if (openingMatch !== -1 && closingMatch !== -1) {
        if (openingMatch < closingMatch) {
          // Found opening tag first, increment depth
          depth++;
          const match = remainingText.match(/<>'[^']*'/);
          i += openingMatch + (match?.[0]?.length || 0);
        } else {
          // Found closing tag first, decrement depth
          depth--;
          if (depth === 0) {
            return i + closingMatch;
          }
          i += closingMatch + 4; // Length of </>
        }
      } else if (openingMatch !== -1) {
        // Only opening tag found
        depth++;
        const match = remainingText.match(/<>'[^']*'/);
        i += openingMatch + (match?.[0]?.length || 0);
      } else if (closingMatch !== -1) {
        // Only closing tag found
        depth--;
        if (depth === 0) {
          return i + closingMatch;
        }
        i += closingMatch + 4; // Length of </>
      } else {
        // No more tags found
        break;
      }
    }
    return -1; // No matching closing tag found
  }

  /**
   * Get the length of a closing tag for Angle Blocks
   */
  private static getClosingTagLength(_openingTag: string): number {
    return 4; // Length of </>
  }

  /**
   * Split content into pages for paged view
   * This implementation provides basic pagination by estimating content height
   */
  static splitIntoPages(html: string, pageHeight: number = 1123): string[] {
    if (!html.trim()) return [""];

    // For a more sophisticated implementation, we would:
    // 1. Parse the HTML into a DOM structure
    // 2. Calculate actual rendered heights
    // 3. Split content while avoiding breaking elements
    // 4. Handle page breaks intelligently

    // For now, we'll estimate based on content length and split roughly
    const estimatedContentHeight = this.estimateContentHeight(html);
    const pagesNeeded = Math.max(
      1,
      Math.ceil(estimatedContentHeight / pageHeight)
    );

    if (pagesNeeded === 1) {
      return [html];
    }

    // Simple splitting by content length (not ideal but functional)
    const contentPerPage = Math.ceil(html.length / pagesNeeded);
    const pages: string[] = [];

    for (let i = 0; i < pagesNeeded; i++) {
      const start = i * contentPerPage;
      const end = Math.min(start + contentPerPage, html.length);
      let pageContent = html.slice(start, end);

      // Try to break at reasonable points (end of tags, paragraphs, etc.)
      if (i < pagesNeeded - 1 && end < html.length) {
        const lastTagEnd = pageContent.lastIndexOf("</");
        const lastParagraphEnd = pageContent.lastIndexOf("</p>");
        const lastHeadingEnd = pageContent.lastIndexOf("</h");
        const lastListEnd = pageContent.lastIndexOf("</ul>");
        const lastOrderedListEnd = pageContent.lastIndexOf("</ol>");

        const breakPoint = Math.max(
          lastTagEnd,
          lastParagraphEnd,
          lastHeadingEnd,
          lastListEnd,
          lastOrderedListEnd
        );

        if (breakPoint > contentPerPage * 0.7) {
          pageContent = pageContent.slice(0, breakPoint + 4); // Include closing tag
        }
      }

      pages.push(pageContent);
    }

    return pages;
  }

  /**
   * Estimate content height based on HTML content
   */
  private static estimateContentHeight(html: string): number {
    // Rough estimation based on content analysis
    let estimatedHeight = 0;

    // Count different elements and estimate their heights
    const headingMatches = html.match(/<h[1-6][^>]*>/g) || [];
    estimatedHeight += headingMatches.length * 40; // ~40px per heading

    const paragraphMatches = html.match(/<p[^>]*>/g) || [];
    estimatedHeight += paragraphMatches.length * 60; // ~60px per paragraph

    const listMatches = html.match(/<(ul|ol)[^>]*>/g) || [];
    estimatedHeight += listMatches.length * 100; // ~100px per list

    const imageMatches = html.match(/<img[^>]*>/g) || [];
    estimatedHeight += imageMatches.length * 200; // ~200px per image

    const codeBlockMatches = html.match(/<pre[^>]*>/g) || [];
    estimatedHeight += codeBlockMatches.length * 150; // ~150px per code block

    const blockquoteMatches = html.match(/<blockquote[^>]*>/g) || [];
    estimatedHeight += blockquoteMatches.length * 80; // ~80px per blockquote

    // Add base height for other content
    estimatedHeight += 200;

    return estimatedHeight;
  }

  /**
   * Get page count for given content
   */
  static getPageCount(html: string, pageHeight: number = 1123): number {
    return this.splitIntoPages(html, pageHeight).length;
  }

  /**
   * Protect code blocks from Angle Block processing
   * Replaces code blocks with placeholders to prevent interference
   */
  private static protectCodeBlocks(text: string): {
    protectedText: string;
    codeBlocks: string[];
  } {
    const codeBlocks: string[] = [];
    let protectedText = text;

    // Protect inline code blocks (backticks)
    protectedText = protectedText.replace(/`([^`]+)`/g, (match) => {
      const placeholder = `__INLINE_CODE_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });

    // Protect fenced code blocks (triple backticks)
    protectedText = protectedText.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `__FENCED_CODE_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });

    return { protectedText, codeBlocks };
  }

  /**
   * Restore code blocks after Angle Block processing
   * Replaces placeholders with original code block content
   */
  private static restoreCodeBlocks(text: string, codeBlocks: string[]): string {
    let result = text;

    // Restore inline code blocks
    result = result.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
      return codeBlocks[parseInt(index)] || match;
    });

    // Restore fenced code blocks
    result = result.replace(/__FENCED_CODE_(\d+)__/g, (match, index) => {
      return codeBlocks[parseInt(index)] || match;
    });

    return result;
  }
}

// Sample MarkOver content for testing
export const sampleMarkOverContent = `# Welcome to MarkOver

MarkOver combines the simplicity of Markdown with the flexibility of HTML + TailwindCSS. It's a new paradigm that goes beyond traditional Markdown and Markup.

## Key Features

- **Simple syntax** like Markdown
- **Powerful layouts** with Angle Blocks
- **Flexible styling** with TailwindCSS classes
- **Nested layouts** for complex designs
- **Live pagination** for print-ready documents
- **Dual preview modes** (Web and Paged)

## Angle Blocks

Angle Blocks use the syntax \`<>'classes'...content...</>\` to apply TailwindCSS classes to content:

<>'flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200'
# Document Title
![Sample Image](https://dummyimage.com/200x120/3b82f6/ffffff.png&text=Logo)
</>

## Flex Layouts with Angle Blocks

You can create flex layouts using Angle Blocks with TailwindCSS flex classes:

<>'flex justify-center items-center gap-8'
# Centered Content
This content is centered using TailwindCSS flex classes.
</>

## Grid Layouts

Create complex layouts with TailwindCSS grid classes:

<>'grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg'
<>'flex flex-col'
### Left Column
This is the left column content. You can put any Markdown content here including:

- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
</>
<>'flex flex-col'

### Right Column  
This is the right column content. The grid system automatically handles the layout.

You can also include code blocks:

\`inline code\` and regular text.
</>
</>

## Code Examples

Here's a JavaScript function:

\`\`\`javascript
function markOverParser(content) {
  // Parse Angle Blocks
  const angleBlocks = content.match(/<>'([^']+)'([\\s\\S]*?)<\\/>/g);
  
  return {
    angleBlocks,
    parsed: true
  };
}
\`\`\`

## Lists and Formatting

### Numbered List
1. First item with **bold text**
2. Second item with *italic text*
3. Third item with \`inline code\`
4. Fourth item with [a link](https://example.com)

### Bullet List
- Bullet point 1
- Bullet point 2
- Bullet point 3
  - Nested bullet
  - Another nested bullet

## Blockquotes

> This is a blockquote example. It can contain multiple paragraphs and other Markdown elements.
> 
> You can even include **bold text** and *italic text* within blockquotes.

## Tables

| Feature | Markdown | MarkOver |
|---------|----------|----------|
| Headers | ✅ | ✅ |
| Lists | ✅ | ✅ |
| Code | ✅ | ✅ |
| Layouts | ❌ | ✅ |
| TailwindCSS | ❌ | ✅ |

## More Layout Examples

<>'bg-gradient-to-r from-purple-400 to-pink-400 text-white p-6 rounded-lg'
# Gradient Header
This header has a beautiful gradient background using TailwindCSS classes.
</>

<>'flex flex-wrap gap-4 p-4 bg-yellow-50 rounded-lg'
### Card 1
Short content
### Card 2  
Medium length content here
### Card 3
This is a longer piece of content that demonstrates how the flex wrap works
</>

## Nested Layouts

MarkOver supports nested Angle Blocks for complex layouts:

<>'grid grid-cols-2 gap-6 p-6 bg-gray-100 rounded-xl'
### Left Side
This is the left column with nested content.

<>'bg-blue-100 p-4 rounded-lg border border-blue-300'
#### Nested Card
This is a nested Angle Block inside the left column.
It can contain any MarkOver content including more nested blocks.
</>

### Right Side
This is the right column.

<>'bg-green-100 p-4 rounded-lg border border-green-300'
#### Another Nested Card
This demonstrates how you can have multiple nested blocks.
</>

<>'flex justify-center items-center gap-4'
### Centered Nested Flex
This is a flex block nested inside an Angle Block using TailwindCSS classes.
</>
</>

## Complex Nested Example

<>'bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-2xl'
# Complex Nested Layout

This demonstrates multiple levels of nesting:

<>'grid grid-cols-3 gap-4 mt-6'
<>'bg-white/20 p-4 rounded-lg backdrop-blur-sm'
### Card A
Content in card A
</>

<>'bg-white/20 p-4 rounded-lg backdrop-blur-sm'
### Card B
Content in card B

<>'bg-white/30 p-2 rounded mt-2'
#### Sub-card
Even deeper nesting!
</>
</>

<>'bg-white/20 p-4 rounded-lg backdrop-blur-sm'
### Card C
Content in card C
</>
</>

<>'flex justify-between items-center mt-6'
### Left Footer
Footer content on the left

### Right Footer
Footer content on the right
</>
</>

## Conclusion

MarkOver provides a powerful yet simple way to create rich documents that combine the best of Markdown and modern CSS frameworks. The dual preview system allows you to see your content both as a continuous web document and as paginated pages ready for printing.

Try editing this content in the left panel to see the live preview update in real-time!
`;
