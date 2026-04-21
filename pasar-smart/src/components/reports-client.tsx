"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { senToRmLabel } from "@/lib/money";
import * as XLSX from 'xlsx-js-style';

export default function ReportsClient({ initialData, initialDate }: { initialData: any[]; initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<any[]>(initialData ?? []);
  const [loading, setLoading] = useState(false);

  // Ref for the hidden date input element
  const dateInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  // Constants for styling
  const DEEP_BG = '#020617';
  const DEEP_GOLD = '#FBC901';

  // Helper to format date for display
  const displayDate = date ? format(new Date(date + 'T00:00:00'), 'dd/MM/yy') : '';

  useEffect(() => { setData(initialData ?? []); }, [initialData]);

  async function fetchForDate(d: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan/assignments?date=${d}`);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  // real-time polling to keep occupancy up-to-date
  useEffect(() => {
    let mounted = true;
    // initial fetch if date changed from server-provided
    if (date !== initialDate) fetchForDate(date);
    const id = setInterval(() => {
      if (mounted) fetchForDate(date);
    }, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [date]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = exportMenuRef.current;
      if (el && !el.contains(e.target as Node)) setExportMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [exportMenuOpen]);

  function reportFilenameBase(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `PASAR-SMART_Report_${day}-${month}-${year.slice(-2)}`;
  }

  function csvCell(v: unknown): string {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function occupancyPct(market: any): number {
    const active = parseInt(String(market.bil_penugasan ?? 0), 10);
    const cap = parseInt(String(market.kapasiti_total ?? 0), 10);
    return cap > 0 ? Math.round((active / cap) * 100) : 0;
  }

  async function fetchMarketExportData(isoDate: string): Promise<any[]> {
    const res = await fetch(`/api/laporan/assignments?date=${isoDate}`);
    if (!res.ok) {
      console.error('Failed to fetch report data');
      throw new Error('Failed to fetch report data');
    }
    const json = await res.json();
    return json.data ?? [];
  }

  function downloadCsvFromMarketData(marketData: any[], isoDate: string, displayDateStr: string) {
    const dataRows =
      marketData.length > 0
        ? marketData
        : [{ daerah: '', nama_pasar: '', bil_penugasan: 0, kapasiti_total: 0, anggaran_yuran_sen: 0 }];
    const headers = [
      'Date',
      'District',
      'Market Name',
      'Active Vendors',
      'Total Capacity',
      'Occupancy %',
      'Total Stall Fees (RM)',
    ];
    const lines = [headers.join(',')];
    for (const market of dataRows) {
      const active = parseInt(String(market.bil_penugasan ?? 0), 10);
      const cap = parseInt(String(market.kapasiti_total ?? 0), 10);
      const occ = occupancyPct(market);
      const fees = parseFloat(String((market.anggaran_yuran_sen ?? 0) / 100));
      lines.push(
        [
          csvCell(displayDateStr),
          csvCell(market.daerah || ''),
          csvCell(market.nama_pasar || ''),
          csvCell(active),
          csvCell(cap),
          csvCell(occ),
          csvCell(fees.toFixed(2)),
        ].join(','),
      );
    }
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportFilenameBase(isoDate)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadWordFromMarketData(marketData: any[], isoDate: string, displayDateStr: string) {
    const dataRows =
      marketData.length > 0
        ? marketData
        : [{ daerah: '', nama_pasar: '', bil_penugasan: 0, kapasiti_total: 0, anggaran_yuran_sen: 0 }];
    const headerRow = `<tr style="background:#4c1d95;color:#FBC901;"><th>District</th><th>Market Name</th><th style="text-align:center">Active Vendors</th><th style="text-align:center">Total Capacity</th><th style="text-align:center">Occupancy %</th><th style="text-align:right">Est. fees (RM)</th></tr>`;
    const bodyRows = dataRows
      .map((market) => {
        const active = parseInt(String(market.bil_penugasan ?? 0), 10);
        const cap = parseInt(String(market.kapasiti_total ?? 0), 10);
        const occ = occupancyPct(market);
        const fees = parseFloat(String((market.anggaran_yuran_sen ?? 0) / 100));
        return `<tr><td>${escapeHtml(market.daerah || '—')}</td><td>${escapeHtml(market.nama_pasar || '—')}</td><td align="center">${active}</td><td align="center">${cap}</td><td align="center">${occ}%</td><td align="right">${fees.toFixed(2)}</td></tr>`;
      })
      .join('');
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>PASAR-SMART Report</title></head><body><h1 style="font-family:Arial;font-size:16pt;">PASAR-SMART — Business Report</h1><p style="font-family:Arial">Report date: ${escapeHtml(displayDateStr)}</p><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;font-size:11pt;">${headerRow}${bodyRows}</table></body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportFilenameBase(isoDate)}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Excel export: professional report with market-level details and formatting
  function writeExcelFromMarketData(marketData: any[], isoDate: string, displayDateStr: string) {
    try {
      try {
        // Create worksheet with manual cell construction for formula support
        // Using xlsx-js-style for proper cell styling support
        const ws: any = {};
        const columnHeaders = ['Date', 'District', 'Market Name', 'Active Vendors', 'Total Capacity', 'Occupancy %', 'Total Stall Fees (RM)'];

        // Define header row styling with light yellow fill (FFF9C4)
        // Using xlsx-js-style compatible style object with explicit patternType
        const headerStyle = {
          font: { 
            bold: true, 
            color: { rgb: '000000' },
            size: 11,
          },
          fill: { 
            fgColor: { rgb: 'FFF9C4' }, 
            patternType: 'solid',
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center', 
            wrapText: false,
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };

        // Add header row (A1:G1) with styling
        columnHeaders.forEach((header, colIdx) => {
          const colLetter = XLSX.utils.encode_col(colIdx);
          const cellAddress = `${colLetter}1`;
          ws[cellAddress] = {
            v: header,
            s: headerStyle,
            t: 's',
          };
        });

        // Add data rows with formulas for Occupancy %
        const dataRows = marketData.length > 0 
          ? marketData 
          : [{
              daerah: '',
              nama_pasar: '',
              bil_penugasan: 0,
              kapasiti_total: 0,
              anggaran_yuran_sen: 0,
            }];

        dataRows.forEach((market: any, rowIdx: number) => {
          const rowNum = rowIdx + 2; // Start at row 2 (after header)

          // Column A: Date
          ws[`A${rowNum}`] = { v: displayDateStr, t: 's' };

          // Column B: District
          ws[`B${rowNum}`] = { v: market.daerah || '', t: 's' };

          // Column C: Market Name
          ws[`C${rowNum}`] = { v: market.nama_pasar || '', t: 's' };

          // Column D: Active Vendors (ensure numeric type for formula calculation)
          const activeVendors = parseInt(market.bil_penugasan ?? 0, 10);
          ws[`D${rowNum}`] = { 
            v: activeVendors, 
            t: 'n',
            s: { alignment: { horizontal: 'center' } },
          };

          // Column E: Total Capacity (ensure numeric type for formula calculation)
          const totalCapacity = parseInt(market.kapasiti_total ?? 0, 10);
          ws[`E${rowNum}`] = { 
            v: totalCapacity, 
            t: 'n',
            s: { alignment: { horizontal: 'center' } },
          };

          // Column F: Occupancy % (formula with IFERROR to prevent #DIV/0!)
          // Formula: =IFERROR(D{row}/E{row}, 0) with percentage format
          // Excel automatically handles x100 multiplication with '0%' format
          ws[`F${rowNum}`] = {
            f: `IFERROR(D${rowNum}/E${rowNum},0)`,
            t: 'n',
            s: {
              numFmt: '0%',
              alignment: { horizontal: 'center' },
            },
          };

          // Column G: Total Stall Fees (RM)
          const feesValue = parseFloat((market.anggaran_yuran_sen ?? 0) / 100);
          ws[`G${rowNum}`] = {
            v: feesValue,
            t: 'n',
            s: {
              numFmt: '#,##0.00',
              alignment: { horizontal: 'right' },
            },
          };
        });

        // Set column widths
        ws['!cols'] = [
          { wch: 12 }, // Date
          { wch: 15 }, // District
          { wch: 20 }, // Market Name
          { wch: 15 }, // Active Vendors
          { wch: 15 }, // Total Capacity
          { wch: 15 }, // Occupancy %
          { wch: 20 }, // Total Stall Fees
        ];

        // Set worksheet range
        const totalRows = dataRows.length + 1; // Include header
        ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 6, r: totalRows - 1 } });

        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Market Report');

        const filename = `${reportFilenameBase(isoDate)}.xlsx`;

        // Write and download using xlsx-js-style for style persistence
        XLSX.writeFile(wb, filename);
      } catch (formulaError) {
        console.error('Spreadsheet creation error:', formulaError);
        alert('Error creating spreadsheet with formulas. Attempting fallback export...');
        
        // Fallback: export without formulas (basic xlsx)
        const fallbackRows = marketData.map((market: any) => ({
          Date: displayDateStr,
          District: market.daerah || '',
          'Market Name': market.nama_pasar || '',
          'Active Vendors': parseInt(market.bil_penugasan ?? 0, 10),
          'Total Capacity': parseInt(market.kapasiti_total ?? 0, 10),
          'Occupancy %': parseInt(market.kapasiti_total ?? 0, 10) > 0 
            ? Math.round((parseInt(market.bil_penugasan ?? 0, 10) / parseInt(market.kapasiti_total ?? 0, 10)) * 100)
            : 0,
          'Total Stall Fees (RM)': parseFloat((market.anggaran_yuran_sen ?? 0) / 100),
        }));

        if (fallbackRows.length === 0) {
          fallbackRows.push({
            Date: displayDateStr,
            District: '',
            'Market Name': '',
            'Active Vendors': 0,
            'Total Capacity': 0,
            'Occupancy %': 0,
            'Total Stall Fees (RM)': 0,
          });
        }

        const ws = XLSX.utils.json_to_sheet(fallbackRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Market Report');

        const filename = `${reportFilenameBase(isoDate)}.xlsx`;

        XLSX.writeFile(wb, filename);
        console.log('Fallback export completed without formulas');
      }
    } catch (e) {
      console.error('Failed to export report', e);
      alert('Export failed. Check console for details.');
    }
  }

  async function runExport(kind: 'excel' | 'csv' | 'word') {
    setExportBusy(true);
    setExportMenuOpen(false);
    try {
      const marketData = await fetchMarketExportData(date);
      if (kind === 'excel') writeExcelFromMarketData(marketData, date, displayDate);
      else if (kind === 'csv') downloadCsvFromMarketData(marketData, date, displayDate);
      else downloadWordFromMarketData(marketData, date, displayDate);
    } catch (e) {
      console.error('Failed to export report', e);
      alert('Export failed. Check console for details.');
    } finally {
      setExportBusy(false);
    }
  }

  // Handle calendar icon click to trigger the hidden date input
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dateInputRef.current) {
      // Try showPicker() first (modern browsers)
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch (err) {
          // Fallback to click if showPicker fails
          dateInputRef.current.click();
        }
      } else {
        // Fallback for older browsers
        dateInputRef.current.click();
      }
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm" style={{ backgroundColor: DEEP_BG }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* Date Picker with icon trigger and read-only display */}
          <div className="flex items-center gap-0 rounded-lg border border-[#1e293b] bg-[#0f172a] px-4 py-2.5 shadow-sm relative">
            {/* Hidden date input - positioned absolutely and invisible but accessible via ref */}
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                width: 0,
                height: 0,
              }}
              aria-label="Date picker"
            />

            {/* Clickable Calendar Icon */}
            <button
              onClick={handleCalendarClick}
              className="flex-shrink-0 p-1 rounded-md transition-all hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ color: DEEP_GOLD }}
              title="Click to select date"
              type="button"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
              </svg>
            </button>

            {/* Read-only Date Display */}
            <input
              type="text"
              value={displayDate}
              readOnly
              className="ml-3 bg-transparent text-sm font-medium text-[var(--accent)] cursor-default focus:outline-none w-16"
              title="Selected date"
            />
          </div>
        </div>
        <div ref={exportMenuRef} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportMenuOpen((o) => !o)}
            disabled={exportBusy}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-[var(--abyss)] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: DEEP_GOLD }}
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
          >
            {exportBusy ? 'Preparing…' : 'Download report'} ▾
          </button>
          {exportMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-[#1e293b] bg-[#0f172a] py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[#1e293b]"
                onClick={() => void runExport('word')}
              >
                Word (.doc)
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[#1e293b]"
                onClick={() => void runExport('csv')}
              >
                CSV (.csv)
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[#1e293b]"
                onClick={() => void runExport('excel')}
              >
                Excel (.xlsx)
              </button>
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-4 text-lg font-semibold text-[var(--accent)]">Summary by district</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]" style={{ backgroundColor: '#4c1d95', color: DEEP_GOLD }}>
              <th className="py-3 px-4 font-semibold">District</th>
              <th className="py-3 px-4 font-semibold">Market Name</th>
              <th className="py-3 px-4 font-semibold text-center">Active Vendors</th>
              <th className="py-3 px-4 font-semibold text-center">Total Capacity</th>
              <th className="py-3 px-4 font-semibold text-center">Occupancy %</th>
              <th className="py-3 px-4 font-semibold text-right">Est. fees (RM)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // loading skeleton rows that match table height
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)]">
                  <td className="py-3 px-4"><div className="skeleton h-4 w-24 animate-pulse" /></td>
                  <td className="py-3 px-4"><div className="skeleton h-4 w-40 animate-pulse" /></td>
                  <td className="py-3 px-4"><div className="skeleton h-4 w-16 mx-auto animate-pulse" /></td>
                  <td className="py-3 px-4"><div className="skeleton h-4 w-16 mx-auto animate-pulse" /></td>
                  <td className="py-3 px-4"><div className="skeleton h-4 w-20 mx-auto animate-pulse" /></td>
                  <td className="py-3 px-4"><div className="skeleton h-4 w-24 ml-auto animate-pulse" /></td>
                </tr>
              ))
            ) : (!data || data.length === 0) ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--muted)]">No data for selected date.</td>
              </tr>
            ) : (
              data.map((market, idx) => {
                const activeVendors = parseInt(market.bil_penugasan ?? 0, 10);
                const totalCapacity = parseInt(market.kapasiti_total ?? 0, 10);
                const occupancyPct = totalCapacity > 0 
                  ? Math.round((activeVendors / totalCapacity) * 100) 
                  : 0;
                const fees = parseFloat((market.anggaran_yuran_sen ?? 0) / 100);
                
                return (
                  <tr key={`${market.daerah}-${idx}`} className="border-b border-[var(--border-subtle)] hover:bg-[#0f172a]/50 transition-colors">
                    <td className="py-3 px-4 text-[var(--text)]">{market.daerah || '—'}</td>
                    <td className="py-3 px-4 text-[var(--text)]">{market.nama_pasar || '—'}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-[var(--secondary)]">{activeVendors}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-[var(--secondary)]">{totalCapacity}</td>
                    <td className="py-3 px-4 text-center tabular-nums" style={{ color: DEEP_GOLD }}>{occupancyPct}%</td>
                    <td className="py-3 px-4 text-right tabular-nums text-[var(--accent)]">RM {fees.toFixed(2)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
