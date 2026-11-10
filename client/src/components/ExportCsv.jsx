import { downloadCsv } from './StockMovements';

// "Export Excel" button for any admin list: a CSV file Excel opens. `rows` is an array of arrays in the same order as `header`.
export default function ExportCsv({ name, header, rows, label = 'Export Excel', className = 'dpos-btn outline' }) {
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <button type="button" className={className} disabled={!rows?.length} onClick={() => downloadCsv(`${name}-${stamp}.csv`, header, rows)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, verticalAlign: '-2px' }}><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /></svg>{label}
    </button>
  );
}
