export default function DataTable({ columns, data, loading, emptyText = 'No records found.' }) {
  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted text-sm">
          <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="py-12 text-center text-muted text-sm">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bdr">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-3 px-4 text-[10px] text-muted uppercase tracking-widest font-normal whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-bdr/40 hover:bg-surface2/60 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-slate-300">
                  {col.render ? col.render(row) : (row[col.key] ?? <span className="text-muted">—</span>)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}