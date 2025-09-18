# MarkOver Editor Guide

## What is MarkOver?

MarkOver is a new document format that combines the simplicity of Markdown with the flexibility of HTML + TailwindCSS. It introduces a new `.mo` file format that extends Markdown with powerful layout capabilities.

## Key Features

- **Simple Markdown syntax** - All standard Markdown features work
- **Angle Blocks** - Apply TailwindCSS classes to content blocks
- **Legacy Flex Blocks** - Backward-compatible flex layout syntax
- **Dual preview modes** - Web view (continuous) and Paged view (A4 print-ready)
- **Live pagination** - Automatic page breaks for print documents
- **Zoom controls** - 60-140% zoom for comfortable editing

## MarkOver Syntax

### Angle Blocks

Use `<>'classes'...content...</>` to apply TailwindCSS classes:

```
<>'flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg'
# Title
![Image](https://example.com/image.png)
</>
```

This renders as:

```html
<div class="flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg">
  <h1>Title</h1>
  <img src="https://example.com/image.png" alt="Image" />
</div>
```

### Legacy Flex Blocks

Use `:::flex...:::` for backward compatibility:

```
:::flex justify=center align=center gap=8
# Centered Content
This content is centered.
:::
```

Supported properties:

- `justify` - flex justification (start, end, center, between, around, evenly)
- `align` - flex alignment (start, end, center, stretch, baseline)
- `gap` - gap between items (number in pixels)
- `direction` - flex direction (row, column, row-reverse, column-reverse)
- `wrap` - flex wrap (nowrap, wrap, wrap-reverse)

### Standard Markdown

All standard Markdown features are supported:

- Headers (`#`, `##`, `###`, etc.)
- **Bold** and _italic_ text
- `inline code` and code blocks
- Lists (ordered and unordered)
- Links and images
- Tables
- Blockquotes
- Horizontal rules

## Using the Editor

### Interface

- **Left Panel**: MarkOver source editor (textarea)
- **Right Panel**: Live preview with two modes
- **Toolbar**: Mode switching, zoom controls, and actions

### Preview Modes

1. **Web View**: Continuous scroll, similar to standard Markdown preview
2. **Paged View**: A4-sized pages (794×1123px) with live pagination

### Controls

- **Web/Paged View Toggle**: Switch between preview modes
- **Zoom Slider**: Adjust preview size (60-140%)
- **Reset**: Clear the editor
- **Sample**: Load sample MarkOver content
- **Export**: Export functionality (to be implemented)

## Examples

### Grid Layout

```
<>'grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg'
### Left Column
Content for the left side.

### Right Column
Content for the right side.
</>
```

### Gradient Header

```
<>'bg-gradient-to-r from-purple-400 to-pink-400 text-white p-6 rounded-lg'
# Beautiful Header
With gradient background
</>
```

### Card Layout

```
<>'flex flex-wrap gap-4 p-4 bg-yellow-50 rounded-lg'
### Card 1
Short content
### Card 2
Medium content
### Card 3
Longer content that wraps
</>
```

## Technical Details

### File Format

- Extension: `.mo`
- Encoding: UTF-8
- MIME type: `text/markover` (proposed)

### Parsing Order

1. Angle Blocks (`<>'classes'...content...</>`)
2. Legacy Flex Blocks (`:::flex...:::`)
3. Standard Markdown

### Pagination

- A4 page size: 794×1123px at 96 DPI
- Automatic content splitting
- Intelligent break points (avoids breaking headings, images, etc.)
- Page numbers in footer

## Getting Started

1. Open the MarkOver Editor
2. Start typing in the left panel
3. Use the sample content as a reference
4. Switch between Web and Paged views
5. Adjust zoom for comfortable editing
6. Experiment with Angle Blocks and TailwindCSS classes

## Future Enhancements

- Export to PDF
- File save/load functionality
- Syntax highlighting
- More sophisticated pagination
- Plugin system
- Collaborative editing
- Version control integration

---

_MarkOver Editor - Bridging the gap between Markdown simplicity and HTML flexibility._
