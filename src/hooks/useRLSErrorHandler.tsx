import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy, CheckCircle2 } from 'lucide-react';

/**
 * Hook to show RLS policy error dialog
 * This appears when there's a row-level security policy violation
 */
export const useRLSErrorHandler = () => {
  const [showRLSError, setShowRLSError] = useState(false);
  const [copied, setCopied] = useState(false);

  const rlsFixSQL = `DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions: Allow insert" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Questions: Allow update" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Questions: Allow delete" ON public.questions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Question options: Public read access" ON public.question_options;
CREATE POLICY "Question options: Allow insert" ON public.question_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Question options: Allow update" ON public.question_options FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Question options: Allow delete" ON public.question_options FOR DELETE USING (true);

DROP POLICY IF EXISTS "Tests are viewable by everyone" ON public.tests;
CREATE POLICY "Tests: Allow insert" ON public.tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Tests: Allow update" ON public.tests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Tests: Allow delete" ON public.tests FOR DELETE USING (true);`;

  const handleError = (error: any) => {
    if (error?.message?.includes('row-level security') || error?.message?.includes('RLS')) {
      setShowRLSError(true);
      return true;
    }
    return false;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rlsFixSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const RLSErrorDialog = () => {
    if (!showRLSError) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle>Row-Level Security Policy Error</CardTitle>
                <CardDescription>Your Supabase database needs a permissions update</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The database tables need permissions to allow question creation. This is a one-time setup that requires running SQL in your Supabase dashboard.
            </p>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs font-medium mb-2 text-muted-foreground">📋 How to fix:</p>
              <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.supabase.com</a></li>
                <li>Select your project</li>
                <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                <li>Click <strong>+ New Query</strong></li>
                <li>Paste the SQL code below</li>
                <li>Click <strong>Run</strong></li>
                <li>Refresh this page</li>
              </ol>
            </div>

            <div className="bg-black text-white p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{rlsFixSQL}</pre>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                className="flex-1 gap-2"
                size="sm"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy SQL
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                size="sm"
                className="flex-1"
              >
                Refresh Page
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowRLSError(false)}
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return {
    handleError,
    RLSErrorDialog,
    hideDialog: () => setShowRLSError(false),
  };
};

export default useRLSErrorHandler;
