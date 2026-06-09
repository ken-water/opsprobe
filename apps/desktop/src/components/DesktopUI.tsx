import type { CSSProperties, ReactNode } from "react";

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
  width?: string;
}

interface DesktopDataTableProps<T> {
  columns: Array<DesktopDataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  emptyTitle: string;
  emptyDetail: string;
  isLoading?: boolean;
  loadingTitle?: string;
  loadingDetail?: string;
}

interface DesktopEmptyStateProps {
  title: string;
  detail: string;
}

interface DesktopLoadingStateProps {
  title: string;
  detail: string;
}

export function DesktopEmptyState({
  title,
  detail,
}: DesktopEmptyStateProps) {
  return (
    <div className="history-empty-state data-table-empty">
      <div className="empty-state-mark" aria-hidden="true">
        <svg className="empty-state-mark-svg" viewBox="0 0 64 64" role="img">
          <path d="M14 14h18c11.046 0 20 8.954 20 20s-8.954 20-20 20H14V14z" />
          <path d="M22 22h10c6.627 0 12 5.373 12 12s-5.373 12-12 12H22V22z" />
          <path d="M41 12h9L31 52h-9z" />
          <circle cx="43" cy="20" r="4" />
        </svg>
      </div>
      <strong className="empty-state-title">{title}</strong>
      <p className="empty-state-copy">{detail}</p>
    </div>
  );
}

export function DesktopLoadingState({
  title,
  detail,
}: DesktopLoadingStateProps) {
  return (
    <div className="history-empty-state data-table-empty loading-state-shell" aria-busy="true">
      <div className="loading-state-mark" aria-hidden="true">
        <span className="loading-state-dot" />
        <span className="loading-state-dot" />
        <span className="loading-state-dot" />
      </div>
      <strong className="empty-state-title">{title}</strong>
      <p className="empty-state-copy">{detail}</p>
    </div>
  );
}

export function DesktopDataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  isRowActive,
  emptyTitle,
  emptyDetail,
  isLoading = false,
  loadingTitle = "Loading",
  loadingDetail = "Fetching the latest local data.",
}: DesktopDataTableProps<T>) {
  if (isLoading) {
    return <DesktopLoadingState title={loadingTitle} detail={loadingDetail} />;
  }

  if (rows.length === 0) {
    return <DesktopEmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <div
      className="data-table-shell"
      style={
        {
          "--ops-table-columns": columns.map((column) => column.width ?? "minmax(140px, 1fr)").join(" "),
        } as CSSProperties
      }
    >
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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatListDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatStatusLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
