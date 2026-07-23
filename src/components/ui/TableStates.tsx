export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-netfive-border">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function TableEmptyState({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-netfive-gray-500">
          {message}
        </td>
      </tr>
    </tbody>
  );
}

export function TableErrorState({
  colSpan,
  message,
  onRetry,
}: {
  colSpan: number;
  message: string;
  onRetry: () => void;
}) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-netfive-red">
          <p className="mb-2">{message}</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </td>
      </tr>
    </tbody>
  );
}
