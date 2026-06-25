import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Badge } from 'app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';

type IntegrityCheck = {
  name: string;
  severity: string;
  count: number;
};

type IntegrityReport = {
  success: boolean;
  data?: {
    checks: IntegrityCheck[];
  };
};

const severityColors: Record<string, string> = {
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

export const SmartLogPanel = () => {
  const { fetcher } = use(ApiContext);

  const { data } = useSuspenseQuery({
    queryKey: ['admin-integrity'],
    queryFn: async () => {
      const response = await fetcher<IntegrityReport>(
        '/admin/integrity-report',
      );
      return response.data;
    },
    refetchInterval: 10000,
  });

  const checks = data?.data?.checks ?? [];

  if (checks.length === 0) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <p className="text-sm text-green-600">All checks passed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-sm sm:text-base">
          Integrity Issues ({checks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
        {checks.map((check) => (
          <div
            key={check.name}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Badge
              className={`${severityColors[check.severity] ?? 'bg-gray-500'} text-white`}
            >
              {check.severity}
            </Badge>
            <span className="flex-1">{check.name}</span>
            <span className="font-mono">{check.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
