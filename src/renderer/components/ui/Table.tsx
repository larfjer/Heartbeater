import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`table-container ${className}`}>
      <table className="md-table">{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead className="md-table-head">{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="md-table-body">{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  className?: string;
}

export function TableRow({
  children,
  onClick,
  selected = false,
  expandable = false,
  expanded = false,
  className = "",
}: TableRowProps) {
  const classes = [
    "md-table-row",
    onClick ? "md-table-row-clickable" : "",
    selected ? "md-table-row-selected" : "",
    expandable ? "md-table-row-expandable" : "",
    expanded ? "md-table-row-expanded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={classes} onClick={onClick}>
      {children}
    </tr>
  );
}

interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
}

export function TableHeaderCell({
  children,
  sortable = false,
  sorted = null,
  onSort,
  className = "",
  ...props
}: TableHeaderCellProps) {
  const classes = [
    "md-table-header-cell",
    sortable ? "md-table-header-cell-sortable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <th className={classes} onClick={sortable ? onSort : undefined} {...props}>
      <div className="md-table-header-content">
        {children}
        {sortable && sorted && (
          <span className="material-icons md-table-sort-icon">
            {sorted === "asc" ? "arrow_upward" : "arrow_downward"}
          </span>
        )}
      </div>
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({
  children,
  className = "",
  ...props
}: TableCellProps) {
  return (
    <td className={`md-table-cell ${className}`} {...props}>
      {children}
    </td>
  );
}

// Empty state component for tables
interface TableEmptyProps {
  icon?: string;
  message: string;
  colSpan: number;
}

export function TableEmpty({
  icon = "inbox",
  message,
  colSpan,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="md-table-empty">
        <span className="material-icons md-table-empty-icon">{icon}</span>
        <p>{message}</p>
      </td>
    </tr>
  );
}
