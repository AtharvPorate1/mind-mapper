import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlertCircle, Download, ZoomIn, ZoomOut } from 'lucide-react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIResponse {
  mermaidCode: string;
  error?: string;
}

const AIMermaidEditor: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const svgRef = useRef<HTMLDivElement>(null);

  const renderMermaid = useCallback((code: string) => {
    mermaid.render('mermaid-diagram', code).then(
      ({ svg }) => {
        setSvg(svg);
        setError('');
      },
      (error) => {
        console.error('Mermaid rendering error:', error);
        setError('Error rendering the diagram. Please check your Mermaid syntax.');
        setSvg('');
      }
    );
  }, []);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleMermaidCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setMermaidCode(newCode);
    renderMermaid(newCode);
  };

  const handleExtractAndGenerate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-mermaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIResponse = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMermaidCode(data.mermaidCode);
        renderMermaid(data.mermaidCode);
      }
    } catch (err) {
      setError('An error occurred while processing your request. Please try again.');
      console.error('API call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  };

  return (
    <div className="flex flex-col space-y-4 p-4 min-h-screen bg-gray-100">
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">AI-Powered Mermaid Editor</h1>
          <div className="flex space-x-4 mb-4">
            <Input
              type="text"
              placeholder="Paste the link here"
              value={url}
              onChange={handleUrlChange}
              className="flex-grow"
            />
            <Button onClick={handleExtractAndGenerate} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Generate Diagram'}
            </Button>
          </div>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Mermaid Code</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="border p-4 h-[calc(100vh-300px)] overflow-auto bg-white relative">
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button onClick={handleZoomIn} size="sm"><ZoomIn className="h-4 w-4" /></Button>
                      <Button onClick={handleZoomOut} size="sm"><ZoomOut className="h-4 w-4" /></Button>
                    </div>
                    <div 
                      ref={svgRef}
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                      dangerouslySetInnerHTML={{ __html: svg }} 
                    />
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="code">
              <Textarea
                value={mermaidCode}
                onChange={handleMermaidCodeChange}
                className="w-full h-[calc(100vh-300px)] font-mono text-sm resize-none"
                placeholder="Enter or edit your Mermaid code here..."
              />
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <Button onClick={handleDownloadSVG} disabled={!svg}>
              <Download className="mr-2 h-4 w-4" /> Download SVG
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMermaidEditor;