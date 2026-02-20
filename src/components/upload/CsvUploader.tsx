import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCSV } from '@/lib/csvParser';
import { useProjectData } from '@/hooks/useProjectData';
import { useNavigate } from 'react-router-dom';

export function CsvUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { loadCsvData } = useProjectData();
  const navigate = useNavigate();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a CSV file');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await parseCSV(file);
      if (result.errors.length > 0 && result.data.length === 0) {
        setError(result.errors.join('\n'));
        return;
      }
      loadCsvData(result.data);
      navigate('/dashboard');
    } catch {
      setError('Failed to parse CSV file. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCsvData, navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleChange}
          className="hidden"
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Parsing your data...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4">
              {isDragging ? (
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export function SampleDataButton() {
  const { loadSampleData } = useProjectData();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  const handleClick = () => {
    loadSampleData();
    setLoaded(true);
    setTimeout(() => navigate('/dashboard'), 300);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md"
    >
      {loaded ? (
        <CheckCircle2 className="h-4 w-4 text-gain" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-primary" />
      )}
      Try with Sample Data
    </button>
  );
}
