import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { hebrewToEnglish } from "./hebrewMapping";

export function HebrewMapper() {
  const [hebrewInput, setHebrewInput] = useState("");
  const [copied, setCopied] = useState(false);

  const englishOutput = hebrewToEnglish(hebrewInput);

  async function handleCopy() {
    await navigator.clipboard.writeText(englishOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="hebrew-mapper">
      <CardHeader>
        <CardTitle data-testid="heading">Hebrew Keyboard Mapper</CardTitle>
        <CardDescription>
          Type Hebrew characters to see the English keys that produced them on a US keyboard layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="hebrew-input" className="text-sm font-medium">
            Hebrew Input
          </label>
          <Textarea
            id="hebrew-input"
            dir="rtl"
            placeholder="הקלד כאן..."
            value={hebrewInput}
            onChange={(e) => setHebrewInput(e.target.value)}
            className="min-h-[100px] text-lg"
            data-testid="hebrew-input"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">English Output</p>
          <div
            className="min-h-[100px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono tracking-widest break-all"
            aria-live="polite"
            aria-label="English output"
            data-testid="english-output"
          >
            {englishOutput || (
              <span className="text-muted-foreground">Output will appear here…</span>
            )}
          </div>
        </div>

        <Button
          onClick={handleCopy}
          disabled={englishOutput.length === 0}
          variant="outline"
          className="w-full"
          data-testid="copy-button"
        >
          <Copy className="mr-2 h-4 w-4" />
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>
      </CardContent>
    </Card>
  );
}
