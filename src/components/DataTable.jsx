export default function DataTable({ columns, data, emptyMessage = 'No data found' }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-10 text-center text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
