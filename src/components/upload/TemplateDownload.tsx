import { Download } from 'lucide-react';
import { generateTemplateCSV } from '@/lib/csvParser';

export function TemplateDownload() {
  const handleDownload = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-performance-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md"
    >
      <Download className="h-4 w-4 text-muted-foreground" />
      Download CSV Template
    </button>
  );
}
