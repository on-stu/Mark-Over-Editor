"use client";

import React, { useState, useMemo } from "react";
import { MarkOverParser, sampleMarkOverContent } from "@/lib/markover-parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";

export type ViewMode = "web" | "paged";

export interface MarkOverEditorProps {
  initialContent?: string;
  className?: string;
}

export function MarkOverEditor({
  initialContent = sampleMarkOverContent,
  className = "",
}: MarkOverEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>("web");
  const [zoom, setZoom] = useState(100);

  // Parse the content
  const parsedHtml = useMemo(() => {
    const result = MarkOverParser.parse(content, { mode: viewMode, zoom });
    return result;
  }, [content, viewMode, zoom]);

  // Get page count for paged view
  const pageCount = useMemo(() => {
    return MarkOverParser.getPageCount(parsedHtml);
  }, [parsedHtml]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const resetContent = () => {
    setContent(sampleMarkOverContent);
  };

  const loadSampleContent = () => {
    setContent(sampleMarkOverContent);
  };

  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">MarkOver Editor</h1>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "web" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("web")}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Web View
            </Button>
            <Button
              variant={viewMode === "paged" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("paged")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Paged View
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4" />
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={60}
              max={140}
              step={10}
              className="w-24"
            />
            <ZoomIn className="w-4 h-4" />
            <span className="text-sm text-muted-foreground w-12">{zoom}%</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetContent}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={loadSampleContent}>
              <Upload className="w-4 h-4 mr-2" />
              Sample
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="text-sm font-medium text-muted-foreground">
              MarkOver Source (.mo)
            </h2>
          </div>
          <div className="flex-1 p-4">
            <ScrollArea className="h-screen">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your MarkOver content here..."
                className="w-full min-h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
              />
              <div className="h-20" />
              <div className="h-20" />
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Preview ({viewMode === "web" ? "Web View" : "Paged View"})
            </h2>
            {viewMode === "paged" && (
              <span className="text-xs text-muted-foreground">
                {pageCount} page{pageCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {viewMode === "web" ? (
              <WebView html={parsedHtml} zoom={zoom} />
            ) : (
              <PagedView html={parsedHtml} zoom={zoom} pageCount={pageCount} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Web View Component
function WebView({ html, zoom }: { html: string; zoom: number }) {
  return (
    <div
      className="markover-content"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top left",
        width: `${100 / (zoom / 100)}%`,
      }}
    >
      <div
        className="markover-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

// Paged View Component
function PagedView({
  html,
  zoom,
  pageCount,
}: {
  html: string;
  zoom: number;
  pageCount: number;
}) {
  const pages = MarkOverParser.splitIntoPages(html);

  return (
    <div
      className="space-y-4"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top left",
        width: `${100 / (zoom / 100)}%`,
      }}
    >
      {pages.map((pageHtml, index) => (
        <Card key={index} className="shadow-lg">
          <CardContent
            className="p-8"
            style={{
              width: "794px",
              minHeight: "1123px",
              maxHeight: "1123px",
              overflow: "hidden",
            }}
          >
            <div
              className="markover-content h-full"
              dangerouslySetInnerHTML={{ __html: pageHtml }}
            />
          </CardContent>
          <div className="text-center py-2 text-xs text-muted-foreground border-t">
            Page {index + 1} of {pageCount}
          </div>
        </Card>
      ))}
    </div>
  );
}
