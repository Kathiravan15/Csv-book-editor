import React from "react";

function SortIndicator({ state }) {
  if (!state) return null;
  return state === "asc" ? <span>⬆️</span> : <span>⬇️</span>;
}

export default function TableEditor({
  columns,
  rows,
  onCellChange,
  onSort,
  sortConfig,
  modifiedIds,
}) {
  return (
    <div className="table-wrap">
      <table className="books-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.accessor} onClick={() => onSort(col.accessor)}>
                {col.Header}{" "}
                <SortIndicator
                  state={
                    sortConfig.key === col.accessor
                      ? sortConfig.direction
                      : null
                  }
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isModified = modifiedIds.has(row.id);
            return (
              <tr key={row.id} className={isModified ? "modified-row" : ""}>
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className={isModified ? "modified-cell" : ""}
                  >
                    <input
                      value={row[col.accessor] ?? ""}
                      onChange={(e) =>
                        onCellChange(row.id, col.accessor, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
