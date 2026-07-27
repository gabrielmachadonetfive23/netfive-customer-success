export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  leftSlot,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Conteúdo opcional (ex.: seletor de itens por página) exibido à esquerda da contagem. */
  leftSlot?: React.ReactNode;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-netfive-gray-500">
      <div className="flex flex-wrap items-center gap-4">
        {leftSlot}
        <span>
          {total === 0 ? "0 resultados" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="px-2 py-1.5">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
