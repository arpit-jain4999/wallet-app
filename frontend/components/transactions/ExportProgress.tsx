'use client';

import { ExportJob, ExportJobStatus } from '@/types/export';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';
import { exportService } from '@/services/export.service';
import { useState } from 'react';

interface ExportProgressProps {
  job: ExportJob | null;
  progress: number;
  isExporting: boolean;
  onCancel: () => void;
}

export function ExportProgress({
  job,
  progress,
  isExporting,
  onCancel,
}: ExportProgressProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isExporting && !job) {
    return null;
  }

  // Don't show if user dismissed it
  if (isDismissed) {
    return null;
  }

  const handleClose = () => {
    setIsDismissed(true);
  };

  const handleDownloadAgain = () => {
    if (job?.downloadUrl) {
      const filename = `transactions-${job.walletId}-${Date.now()}.csv`;
      exportService.downloadFile(job.downloadUrl, filename);
    }
  };

  const getStatusIcon = () => {
    if (!job) return <Loader2 className="h-5 w-5 animate-spin" />;

    switch (job.status) {
      case ExportJobStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ExportJobStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case ExportJobStatus.PROCESSING:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getStatusText = () => {
    if (!job) return 'Starting export...';

    switch (job.status) {
      case ExportJobStatus.PENDING:
        return 'Preparing export...';
      case ExportJobStatus.PROCESSING:
        return `Exporting ${job.processedRecords?.toLocaleString() || 0} of ${job.totalRecords?.toLocaleString() || 0} transactions`;
      case ExportJobStatus.COMPLETED:
        return 'Export completed!';
      case ExportJobStatus.FAILED:
        return 'Export failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    if (!job) return 'text-muted-foreground';

    switch (job.status) {
      case ExportJobStatus.COMPLETED:
        return 'text-green-600 dark:text-green-400';
      case ExportJobStatus.FAILED:
        return 'text-red-600 dark:text-red-400';
      case ExportJobStatus.PROCESSING:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="mb-4 border-2 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <Typography variant={TypographyVariant.SMALL} className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </Typography>
                {job?.error && (
                  <Typography variant={TypographyVariant.SMALL} className="text-red-600 mt-1">
                    {job.error}
                  </Typography>
                )}
              </div>
            </div>

            {/* Cancel/Close button */}
            <Button
              variant={ButtonVariant.GHOST}
              size="sm"
              onClick={job?.status === ExportJobStatus.COMPLETED || job?.status === ExportJobStatus.FAILED ? handleClose : onCancel}
              className="h-8 w-8 p-0"
              title={job?.status === ExportJobStatus.COMPLETED || job?.status === ExportJobStatus.FAILED ? "Close" : "Cancel"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          {job?.status !== ExportJobStatus.COMPLETED && job?.status !== ExportJobStatus.FAILED && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between">
                <Typography variant={TypographyVariant.SMALL} className="text-muted-foreground">
                  {progress}% complete
                </Typography>
                {job?.totalRecords && (
                  <Typography variant={TypographyVariant.SMALL} className="text-muted-foreground">
                    {job.totalRecords.toLocaleString()} records
                  </Typography>
                )}
              </div>
            </div>
          )}

          {/* Success message with download link */}
          {job?.status === ExportJobStatus.COMPLETED && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Download className="h-4 w-4" />
                <Typography variant={TypographyVariant.SMALL}>
                  Your CSV file has been downloaded
                </Typography>
              </div>
              {job.downloadUrl && (
                <button
                  onClick={handleDownloadAgain}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  You can download it here again
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
