import type { ReactNode } from "react";

interface DesktopSectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function DesktopSectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
}: DesktopSectionHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {actions || meta ? (
        <div className="section-header-side">
          {meta ? <div className="section-header-meta">{meta}</div> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

interface DesktopDataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DesktopDataTableProps<T> {
  columns: Array<DesktopDataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  emptyTitle: string;
  emptyDetail: string;
}

export function DesktopDataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  isRowActive,
  emptyTitle,
  emptyDetail,
}: DesktopDataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="history-empty-state data-table-empty">
        <strong>{emptyTitle}</strong>
        <p>{emptyDetail}</p>
      </div>
    );
  }

  return (
    <div className="data-table-shell">
      <div className="data-table-header">
        {columns.map((column) => (
          <span className="data-table-cell data-table-head" key={column.key}>
            {column.header}
          </span>
        ))}
      </div>

      <div className="data-table-body">
        {rows.map((row) => {
          const rowKey = getRowKey(row);
          const active = isRowActive?.(row) ?? false;
          const content = (
            <>
              {columns.map((column) => (
                <span className="data-table-cell" key={`${rowKey}-${column.key}`}>
                  {column.render(row)}
                </span>
              ))}
            </>
          );

          if (onRowClick) {
            return (
              <button
                className={`data-table-row ${active ? "data-table-row-active" : ""}`}
                key={rowKey}
                onClick={() => onRowClick(row)}
                type="button"
              >
                {content}
              </button>
            );
          }

          return (
            <div className={`data-table-row ${active ? "data-table-row-active" : ""}`} key={rowKey}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
