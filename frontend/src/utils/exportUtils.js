import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { LOGO_BASE64 } from './logoBase64';

const formatVal = (v) => (v != null ? `₦${Number(v).toLocaleString()}` : '—');
const formatDate = (d) => (d ? format(new Date(d), 'MMM d, yyyy HH:mm') : '—');

// Logo is wider than tall (840x240 ≈ 3.5:1) — keep that ratio when drawing
const LOGO_RATIO = 240 / 840;
const LOGO_WIDTH = 38; // mm
const LOGO_HEIGHT = LOGO_WIDTH * LOGO_RATIO;

// ── Single record → PDF ─────────────────────────────────────────────────
export const exportRecordToPDF = (record) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  try {
    doc.addImage(LOGO_BASE64, 'PNG', 14, y - 6, LOGO_WIDTH, LOGO_HEIGHT);
  } catch (e) { /* logo failed to load, continue without it */ }

  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(20, 35, 60);
  doc.text('ImEx-Tek Global Ltd', 14 + LOGO_WIDTH + 6, y + 2);
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120);
  doc.text('Business Record Detail', 14, y + LOGO_HEIGHT + 4);
  doc.setTextColor(0);
  doc.setDrawColor(220);
  y += LOGO_HEIGHT + 10;
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  const addRow = (label, value) => {
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text(`${label}:`, 14, y);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(String(value ?? '—'), pageWidth - 60);
    doc.text(lines, 55, y);
    y += Math.max(7, lines.length * 6);
  };

  addRow('Title', record.title);
  addRow('Category', record.category);
  addRow('Status', record.status);
  addRow('Value', formatVal(record.value));
  addRow('Description', record.description || '—');
  addRow('Created by', record.created_by_name || '—');
  addRow('Created at', formatDate(record.created_at));
  addRow('Updated at', formatDate(record.updated_at));
  addRow('Record ID', record.id);

  y += 6;
  doc.setDrawColor(220);
  doc.line(14, y, pageWidth - 14, y);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, y + 6);

  doc.save(`record-${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
};

// ── Multiple records → PDF (table list) ─────────────────────────────────
export const exportRecordsListToPDF = (records) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const drawHeader = () => {
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 14, y - 6, LOGO_WIDTH, LOGO_HEIGHT);
    } catch (e) { /* logo failed to load, continue without it */ }

    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(20, 35, 60);
    doc.text('ImEx-Tek Global Ltd', 14 + LOGO_WIDTH + 6, y + 2);
    doc.setTextColor(0);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(120);
    doc.text(`Business Records Export — ${records.length} record(s)`, 14, y + LOGO_HEIGHT + 4);
    doc.setTextColor(0);
    y += LOGO_HEIGHT + 12;
  };

  drawHeader();

  const colX = { title: 14, category: 70, status: 105, value: 130, date: 158 };
  const drawTableHeader = () => {
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(240, 242, 247);
    doc.rect(14, y - 5, pageWidth - 28, 7, 'F');
    doc.text('Title', colX.title, y);
    doc.text('Category', colX.category, y);
    doc.text('Status', colX.status, y);
    doc.text('Value', colX.value, y);
    doc.text('Created', colX.date, y);
    y += 7;
    doc.setFont(undefined, 'normal');
  };

  drawTableHeader();

  records.forEach((r) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
      drawTableHeader();
    }
    doc.setFontSize(8.5);
    const title = doc.splitTextToSize(r.title, 52)[0] || '';
    doc.text(title, colX.title, y);
    doc.text((r.category || '—').substring(0, 14), colX.category, y);
    doc.text(r.status || '—', colX.status, y);
    doc.text(formatVal(r.value), colX.value, y);
    doc.text(format(new Date(r.created_at), 'MMM d, yyyy'), colX.date, y);
    y += 7;
    doc.setDrawColor(235);
    doc.line(14, y - 4, pageWidth - 14, y - 4);
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, pageHeight - 10);

  doc.save(`business-records-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// ── CSV export (single or multiple records) ─────────────────────────────
const csvEscape = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportRecordsToCSV = (records, filenamePrefix = 'business-records') => {
  const headers = ['Title', 'Category', 'Status', 'Value (NGN)', 'Description', 'Created By', 'Created At', 'Updated At', 'Record ID'];
  const rows = records.map((r) => [
    r.title, r.category, r.status, r.value ?? '', r.description ?? '',
    r.created_by_name ?? '', formatDate(r.created_at), formatDate(r.updated_at), r.id,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
