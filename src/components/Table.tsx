import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = '暫無資料',
}: TableProps<T>) {
  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead className="data-table__header">
          <tr className="data-table__header-row">
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={column.align ? `data-table__cell--${column.align}` : ''}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table__body">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className={`data-table__row ${onRowClick ? 'data-table__row--clickable' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align ? `data-table__cell data-table__cell--${column.align}` : 'data-table__cell'}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
