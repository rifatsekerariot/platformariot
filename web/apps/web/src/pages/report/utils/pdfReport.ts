import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfReportHistoryPoint {
    timestamp: string;
    value: string;
}

export interface PdfReportRow {
    entityName: string;
    unit: string;
    last: number | string;
    min: number | string;
    max: number | string;
    avg: number | string;
    /** Timestamped telemetry list in date range (timestamp formatted, value as string) */
    history?: PdfReportHistoryPoint[];
}

export interface PdfReportDeviceSection {
    deviceName: string;
    rows: PdfReportRow[];
}

export interface PdfReportOptions {
    title: string;
    companyName?: string;
    dashboardName?: string;
    dateRange: string;
    deviceSections: PdfReportDeviceSection[];
    generatedAt: string;
    defaultTitle: string;
    generatedAtLabel: string;
    ariotLabel: string;
    dashboardLabel: string;
    deviceLabel: string;
    tableHeaders: {
        entityName: string;
        unit: string;
        last: string;
        min: string;
        max: string;
        avg: string;
        timestamp?: string;
        value?: string;
    };
}

const fmt = (v: number | string): string =>
    typeof v === 'number' ? (Number.isNaN(v) ? '—' : String(v)) : (v ?? '—');

/**
 * Builds a telemetry PDF with device-based sections and returns a Blob.
 */
export function buildTelemetryPdf(options: PdfReportOptions): Blob {
    const doc = new jsPDF();
    const {
        title,
        companyName,
        dashboardName,
        dateRange,
        deviceSections,
        generatedAt,
        defaultTitle,
        generatedAtLabel,
        ariotLabel,
        dashboardLabel,
        deviceLabel,
        tableHeaders,
    } = options;
    const reportTitle = title?.trim() || defaultTitle;
    const deviceLabelText: string = (deviceLabel ?? 'Device') as string;
    const dashboardLabelText: string = (dashboardLabel ?? 'Dashboard') as string;
    const generatedAtLabelText: string = (generatedAtLabel ?? 'Generated at') as string;
    const ariotLabelText: string = (ariotLabel ?? 'ARIOT') as string;
    let y = 16;

    // Report title
    doc.setFontSize(16);
    doc.text(reportTitle, 14, y);
    y += 10;

    // Company name (optional)
    if (companyName?.trim()) {
        doc.setFontSize(11);
        doc.text(companyName.trim(), 14, y);
        y += 6;
    }

    // Dashboard name
    if (dashboardName?.trim()) {
        doc.setFontSize(11);
        const dashboardText = `${dashboardLabelText}: ${dashboardName.trim()}`;
        doc.text(dashboardText, 14, y);
        y += 6;
    }

    // Date range
    doc.setFontSize(10);
    doc.text(dateRange, 14, y);
    y += 8;

    const timestampHeader = (tableHeaders as { timestamp?: string }).timestamp ?? 'Timestamp';
    const valueHeader = (tableHeaders as { value?: string }).value ?? 'Value';

    // Device sections
    if (deviceSections.length > 0) {
        for (let i = 0; i < deviceSections.length; i++) {
            const section = deviceSections[i];
            if (section.rows.length === 0) continue;

            // Device name header
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            const deviceHeaderText = `${deviceLabelText}: ${section.deviceName}`;
            doc.text(deviceHeaderText, 14, y);
            y += 6;

            // Summary table for this device
            autoTable(doc, {
                startY: y,
                head: [
                    [
                        tableHeaders.entityName,
                        tableHeaders.unit,
                        tableHeaders.last,
                        tableHeaders.min,
                        tableHeaders.max,
                        tableHeaders.avg,
                    ],
                ],
                body: section.rows.map(r => [
                    r.entityName,
                    r.unit || '—',
                    fmt(r.last),
                    fmt(r.min),
                    fmt(r.max),
                    fmt(r.avg),
                ]),
                theme: 'grid',
                headStyles: { fillColor: [66, 139, 202], textColor: 255 },
                margin: { left: 14, right: 14 },
            });
            let tbl = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
            y = tbl?.finalY ?? y + 10;

            // Per-entity history tables (timestamp | value)
            for (const r of section.rows) {
                const hist = r.history;
                if (!hist || hist.length === 0) continue;
                y += 4;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`${r.entityName} (${r.unit || '—'}) – ${hist.length}`, 14, y);
                y += 5;
                autoTable(doc, {
                    startY: y,
                    head: [[timestampHeader, valueHeader]],
                    body: hist.map(h => [h.timestamp, h.value]),
                    theme: 'grid',
                    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
                    margin: { left: 14, right: 14 },
                });
                tbl = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
                y = tbl?.finalY ?? y + 10;
            }

            // Add spacing between device sections (except last)
            if (i < deviceSections.length - 1) {
                y += 5;
            }
        }
    }

    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const generatedAtText = `${generatedAtLabelText} ${generatedAt}`;
    doc.text(generatedAtText, 14, y);
    y += 5;
    doc.text(ariotLabelText, 14, y);

    return doc.output('blob');
}
