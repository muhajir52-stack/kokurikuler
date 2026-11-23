import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type {
  Activity,
  ActivityDocumentation,
  ActivityEvaluation,
  ActivityJournal,
  ActivityReport,
  ActivitySchedule,
  Approval,
  SchoolProfile,
  Student,
  StudentReflection,
  Teacher,
} from '../types';

export interface ImportedStudentRow {
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  parentPhone: string;
  participationStatus: 'Terdaftar' | 'Hadir' | 'Izin' | 'Tidak Hadir';
  notes: string;
}

export async function parseStudentsExcel(file: File): Promise<ImportedStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });

  return rows
    .map((row) => {
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        normalized[k.trim().toLowerCase()] = String(v ?? '').trim();
      }
      const nis = normalized['nis'] || normalized['nomor induk'] || normalized['nomor induk siswa'] || '';
      const name = normalized['nama'] || normalized['nama siswa'] || normalized['name'] || '';
      const className = normalized['kelas'] || normalized['class'] || 'XI IPA 1';
      const rawGender = (normalized['jenis kelamin'] || normalized['jk'] || normalized['gender'] || 'L').toUpperCase();
      const gender: 'L' | 'P' = rawGender.startsWith('P') || rawGender === 'PEREMPUAN' ? 'P' : 'L';
      const parentPhone =
        normalized['no hp orang tua'] ||
        normalized['kontak orang tua'] ||
        normalized['telepon'] ||
        normalized['parentphone'] ||
        '';
      const rawStatus = normalized['status'] || normalized['status keikutsertaan'] || 'Terdaftar';
      const validStatuses = ['Terdaftar', 'Hadir', 'Izin', 'Tidak Hadir'] as const;
      const participationStatus = validStatuses.includes(rawStatus as (typeof validStatuses)[number])
        ? (rawStatus as (typeof validStatuses)[number])
        : 'Terdaftar';
      const notes = normalized['keterangan'] || normalized['notes'] || '';
      return { nis, name, className, gender, parentPhone, participationStatus, notes };
    })
    .filter((item) => item.nis.length > 0 && item.name.length > 0);
}

export function exportTableToExcel(
  fileName: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[i] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });
  worksheet['!cols'] = colWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

function drawKopSuratPdf(doc: jsPDF, school?: SchoolProfile | null): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const schoolName = (school?.schoolName || 'SMA DARUL ULUM KEPOHBARU').toUpperCase();
  const addressLine = `${school?.address || 'Jl. Raya Kepohbaru No. 45'}, Kec. ${school?.district || 'Kepohbaru'}, Kab. ${school?.regency || 'Bojonegoro'}, ${school?.province || 'Jawa Timur'} ${school?.postalCode || '62194'}`;
  const contactLine = `Telp. ${school?.phone || '(0353) 331452'} | Email: ${school?.email || 'info@smadarululum-kepohbaru.sch.id'} | NPSN: ${school?.npsn || '20541289'}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 37, 71);
  doc.text('YAYASAN PENDIDIKAN ISLAM DARUL ULUM', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(15);
  doc.text(schoolName, pageWidth / 2, 20.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(addressLine, pageWidth / 2, 25.5, { align: 'center' });
  doc.text(contactLine, pageWidth / 2, 29.8, { align: 'center' });

  doc.setDrawColor(15, 37, 71);
  doc.setLineWidth(0.9);
  doc.line(15, 33, pageWidth - 15, 33);
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.4);
  doc.line(15, 34.4, pageWidth - 15, 34.4);

  return 41;
}

function addPdfPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `SIPK SMA Darul Ulum Kepohbaru — Bojonegoro | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: 'center' }
    );
  }
}

export function exportTableToPdf(params: {
  fileName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  school?: SchoolProfile | null;
  orientation?: 'portrait' | 'landscape';
}): void {
  const doc = new jsPDF({
    orientation: params.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const startY = drawKopSuratPdf(doc, params.school);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(params.title.toUpperCase(), pageWidth / 2, startY + 2, { align: 'center' });

  let tableY = startY + 8;
  if (params.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(params.subtitle, pageWidth / 2, startY + 7.5, { align: 'center' });
    tableY = startY + 13;
  }

  autoTable(doc, {
    startY: tableY,
    head: [params.headers],
    body: params.rows,
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [15, 37, 71], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15, bottom: 18 },
  });

  addPdfPageNumbers(doc);
  doc.save(params.fileName.endsWith('.pdf') ? params.fileName : `${params.fileName}.pdf`);
}

export interface FullReportBundle {
  report: ActivityReport;
  school?: SchoolProfile | null;
  activity?: Activity | null;
  students: Student[];
  teachers: Teacher[];
  schedules: ActivitySchedule[];
  journals: ActivityJournal[];
  documentation: ActivityDocumentation[];
  reflections: StudentReflection[];
  evaluations: ActivityEvaluation[];
  approval?: Approval | null;
}

export function exportReportToPdf(bundle: FullReportBundle): void {
  const { report, school, activity, students, teachers, schedules, reflections, approval } = bundle;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;

  // --- Cover Page ---
  doc.setDrawColor(15, 37, 71);
  doc.setLineWidth(1.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 37, 71);
  doc.text('LAPORAN PERTANGGUNGJAWABAN KEGIATAN KOKURIKULER', pageWidth / 2, 48, { align: 'center' });

  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(report.title.toUpperCase(), contentWidth - 10);
  doc.text(titleLines, pageWidth / 2, 68, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  const themeLines = doc.splitTextToSize(
    `Tema: ${activity?.theme || 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia'}`,
    contentWidth - 16
  );
  doc.text(themeLines, pageWidth / 2, 92, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(163, 123, 20);
  doc.text(`Nomor Dokumen: ${report.reportNumber}`, pageWidth / 2, 118, { align: 'center' });
  doc.text(`Tahun Pelajaran ${report.academicYear}`, pageWidth / 2, 125, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 37, 71);
  doc.text((school?.schoolName || 'SMA DARUL ULUM KEPOHBARU').toUpperCase(), pageWidth / 2, 232, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `${school?.district || 'Kec. Kepohbaru'}, Kab. ${school?.regency || 'Bojonegoro'}, ${school?.province || 'Jawa Timur'}`,
    pageWidth / 2,
    240,
    { align: 'center' }
  );
  doc.text(`TAHUN ${activity?.year || 2026}`, pageWidth / 2, 248, { align: 'center' });

  // --- Table of Contents Page ---
  doc.addPage();
  let y = drawKopSuratPdf(doc, school);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 37, 71);
  doc.text('DAFTAR ISI', pageWidth / 2, y + 4, { align: 'center' });
  y += 14;

  const tocEntries = [
    ['HALAMAN SAMPUL', 'i'],
    ['DAFTAR ISI', 'ii'],
    ['BAB I PENDAHULUAN', '1'],
    ['   1.1 Latar Belakang, Dasar Pelaksanaan, Tujuan & Manfaat', '1'],
    ['BAB II PELAKSANAAN KEGIATAN', '2'],
    ['   2.1 Identitas, Waktu, Peserta, Pendamping & Uraian Pelaksanaan', '2'],
    ['BAB III HASIL KEGIATAN', '3'],
    ['   3.1 Hasil Kunjungan, Observasi, Nasionalisme & Refleksi Siswa', '3'],
    ['BAB IV EVALUASI KEGIATAN', '4'],
    ['   4.1 Evaluasi Pelaksanaan, Faktor Pendukung, Kendala & Rekomendasi', '4'],
    ['BAB V PENUTUP', '5'],
    ['   5.1 Kesimpulan & Saran', '5'],
    ['LAMPIRAN-LAMPIRAN', '6'],
  ];

  doc.setFontSize(10);
  for (const [label, refPage] of tocEntries) {
    doc.setFont('helvetica', label.startsWith('   ') ? 'normal' : 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(label, marginX, y);
    doc.text(refPage, pageWidth - marginX, y, { align: 'right' });
    y += 7;
  }

  // Helper to write sections cleanly across pages
  const startSectionPage = (chapterTitle: string) => {
    doc.addPage();
    y = drawKopSuratPdf(doc, school);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 37, 71);
    doc.text(chapterTitle, pageWidth / 2, y + 2, { align: 'center' });
    y += 11;
  };

  const writeSubSection = (heading: string, body?: string) => {
    if (y > pageHeight - 34) {
      doc.addPage();
      y = 22;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 37, 71);
    doc.text(heading, marginX, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize((body && body.trim()) || '-', contentWidth);
    for (const line of lines) {
      if (y > pageHeight - 22) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, marginX, y);
      y += 5.2;
    }
    y += 4;
  };

  // BAB I
  startSectionPage('BAB I PENDAHULUAN');
  writeSubSection('1.1 Latar Belakang', report.bab1Background);
  writeSubSection('1.2 Dasar Pelaksanaan', report.bab1Basis);
  writeSubSection('1.3 Tujuan Kegiatan', report.bab1Purpose);
  writeSubSection('1.4 Manfaat Kegiatan', report.bab1Benefits);

  // BAB II
  startSectionPage('BAB II PELAKSANAAN KEGIATAN');
  writeSubSection('2.1 Identitas Kegiatan', report.bab2Identity);
  writeSubSection('2.2 Waktu dan Tempat Pelaksanaan', report.bab2ScheduleTimePlace);
  writeSubSection('2.3 Peserta Kegiatan', report.bab2ParticipantsSummary);
  writeSubSection('2.4 Guru Pendamping', report.bab2TeachersSummary);
  writeSubSection('2.5 Uraian Pelaksanaan Kegiatan', report.bab2ExecutionNarrative);

  // BAB III
  startSectionPage('BAB III HASIL KEGIATAN');
  writeSubSection('3.1 Hasil Kunjungan Edukatif', report.bab3VisitResults);
  writeSubSection('3.2 Hasil Observasi Siswa', report.bab3StudentObservations);
  writeSubSection('3.3 Nilai Sejarah dan Nasionalisme', report.bab3NationalismValues);
  writeSubSection('3.4 Ringkasan Refleksi Pembelajaran', report.bab3ReflectionSummary);

  // BAB IV
  startSectionPage('BAB IV EVALUASI KEGIATAN');
  writeSubSection('4.1 Evaluasi Pelaksanaan', report.bab4Evaluation);
  writeSubSection('4.2 Faktor Pendukung', report.bab4SupportingFactors);
  writeSubSection('4.3 Kendala dan Solusi', report.bab4ObstaclesSolutions);
  writeSubSection('4.4 Rekomendasi Kegiatan Selanjutnya', report.bab4Recommendations);

  // BAB V + Signature Block
  startSectionPage('BAB V PENUTUP');
  writeSubSection('5.1 Kesimpulan', report.bab5Conclusion);
  writeSubSection('5.2 Saran', report.bab5Suggestions);

  if (y > pageHeight - 62) {
    doc.addPage();
    y = 28;
  } else {
    y += 8;
  }

  const signDate = `Bojonegoro, ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(signDate, pageWidth - marginX - 65, y);
  y += 6;
  doc.text('Mengetahui,', marginX, y);
  doc.text('Ketua Pelaksana Kegiatan,', pageWidth - marginX - 65, y);
  y += 5;
  doc.text('Kepala SMA Darul Ulum Kepohbaru', marginX, y);
  if (approval?.status === 'Disetujui') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('[DISETUJUI SECARA DIGITAL]', marginX, y + 10);
    doc.setTextColor(15, 23, 42);
  }
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(school?.principalName || 'Drs. H. Ahmad Muhajir, M.Pd.', marginX, y);
  doc.text(activity?.chiefExecutive || report.authorName, pageWidth - marginX - 65, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${school?.principalNip || '-'}`, marginX, y);

  // LAMPIRAN
  doc.addPage();
  y = drawKopSuratPdf(doc, school);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 37, 71);
  doc.text('LAMPIRAN: DAFTAR GURU PENDAMPING & RUNDOWN KEGIATAN', pageWidth / 2, y + 2, { align: 'center' });

  autoTable(doc, {
    startY: y + 8,
    head: [['No', 'Nama Guru Pendamping', 'NIP/NUPTK', 'Jabatan', 'Tugas Pendampingan']],
    body: teachers.map((t, idx) => [idx + 1, t.name, t.nipNuptk || '-', t.position, t.mentoringTask]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 37, 71], textColor: [255, 255, 255] },
    margin: { left: 15, right: 15 },
  });

  const afterTeachersY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || y + 50;
  autoTable(doc, {
    startY: afterTeachersY + 8,
    head: [['No', 'Waktu', 'Kegiatan', 'Lokasi', 'Penanggung Jawab']],
    body: schedules
      .slice()
      .sort((a, b) => a.orderNo - b.orderNo)
      .map((s) => [s.orderNo, s.timeRange, s.activityTitle, s.location, s.personInCharge]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 37, 71], textColor: [255, 255, 255] },
    margin: { left: 15, right: 15 },
  });

  if (students.length > 0) {
    doc.addPage();
    y = drawKopSuratPdf(doc, school);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 37, 71);
    doc.text('LAMPIRAN: DAFTAR PESERTA DIDIK & KEHADIRAN', pageWidth / 2, y + 2, { align: 'center' });
    autoTable(doc, {
      startY: y + 8,
      head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Status Kehadiran']],
      body: students.map((s, idx) => [idx + 1, s.nis, s.name, s.className, s.gender, s.participationStatus]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 37, 71], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
    });
  }

  if (reflections.length > 0) {
    doc.addPage();
    y = drawKopSuratPdf(doc, school);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 37, 71);
    doc.text('LAMPIRAN: RINGKASAN REFLEKSI PEMBELAJARAN SISWA', pageWidth / 2, y + 2, { align: 'center' });
    autoTable(doc, {
      startY: y + 8,
      head: [['No', 'Nama Siswa', 'Kelas', 'Nilai Sejarah & Kesimpulan', 'Skor']],
      body: reflections.map((r, idx) => [
        idx + 1,
        r.studentName,
        r.className,
        r.learningConclusion.slice(0, 140),
        r.teacherScore !== undefined ? String(r.teacherScore) : '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 37, 71], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
    });
  }

  addPdfPageNumbers(doc);
  doc.save(`Laporan_Kokurikuler_SMA_Darul_Ulum_${activity?.year || 2026}.pdf`);
}

export async function exportReportToDocx(bundle: FullReportBundle): Promise<void> {
  const { report, school, activity, students, teachers, schedules, reflections, approval } = bundle;
  const schoolName = school?.schoolName || 'SMA Darul Ulum Kepohbaru';

  const makeHeading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 180 },
    });

  const makeSubHeading = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, color: '0F2547' })],
      spacing: { before: 180, after: 80 },
    });

  const makeBody = (text?: string) =>
    (text || '-')
      .split('\n')
      .map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 100 },
            alignment: AlignmentType.JUSTIFIED,
          })
      );

  const makeSimpleTable = (headers: string[], rows: string[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                shading: { fill: '0F2547' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
                  }),
                ],
              })
          ),
        }),
        ...rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: cell, size: 18 })],
                      }),
                    ],
                  })
              ),
            })
        ),
      ],
    });

  const doc = new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${schoolName} — Halaman `, size: 18, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '64748B' }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Cover
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000, after: 200 },
            children: [
              new TextRun({
                text: 'LAPORAN PERTANGGUNGJAWABAN KEGIATAN KOKURIKULER',
                bold: true,
                size: 28,
                color: '0F2547',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: report.title.toUpperCase(),
                bold: true,
                size: 32,
                color: '0F2547',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Tema: ${activity?.theme || 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno'}`,
                size: 24,
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 1800 },
            children: [
              new TextRun({
                text: `Nomor: ${report.reportNumber} | Tahun Pelajaran ${report.academicYear}`,
                bold: true,
                size: 22,
                color: 'A37B14',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${schoolName.toUpperCase()}\nKec. ${school?.district || 'Kepohbaru'}, Kab. ${school?.regency || 'Bojonegoro'}, Jawa Timur\nTAHUN ${activity?.year || 2026}`,
                bold: true,
                size: 24,
                color: '0F2547',
              }),
            ],
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // Kop Surat Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'YAYASAN PENDIDIKAN ISLAM DARUL ULUM\n',
                bold: true,
                size: 22,
                color: '0F2547',
              }),
              new TextRun({
                text: `${schoolName.toUpperCase()}\n`,
                bold: true,
                size: 28,
                color: '0F2547',
              }),
              new TextRun({
                text: `${school?.address || 'Jl. Raya Kepohbaru No. 45'}, Bojonegoro | Telp. ${school?.phone || '(0353) 331452'}`,
                size: 18,
                color: '475569',
              }),
            ],
            spacing: { after: 300 },
          }),

          makeHeading('BAB I PENDAHULUAN'),
          makeSubHeading('1.1 Latar Belakang'),
          ...makeBody(report.bab1Background),
          makeSubHeading('1.2 Dasar Pelaksanaan'),
          ...makeBody(report.bab1Basis),
          makeSubHeading('1.3 Tujuan Kegiatan'),
          ...makeBody(report.bab1Purpose),
          makeSubHeading('1.4 Manfaat Kegiatan'),
          ...makeBody(report.bab1Benefits),

          new Paragraph({ children: [new PageBreak()] }),
          makeHeading('BAB II PELAKSANAAN KEGIATAN'),
          makeSubHeading('2.1 Identitas Kegiatan'),
          ...makeBody(report.bab2Identity),
          makeSubHeading('2.2 Waktu dan Tempat Pelaksanaan'),
          ...makeBody(report.bab2ScheduleTimePlace),
          makeSubHeading('2.3 Peserta Kegiatan'),
          ...makeBody(report.bab2ParticipantsSummary),
          makeSubHeading('2.4 Guru Pendamping'),
          ...makeBody(report.bab2TeachersSummary),
          makeSubHeading('2.5 Uraian Pelaksanaan Kegiatan'),
          ...makeBody(report.bab2ExecutionNarrative),

          new Paragraph({ children: [new PageBreak()] }),
          makeHeading('BAB III HASIL KEGIATAN'),
          makeSubHeading('3.1 Hasil Kunjungan Edukatif'),
          ...makeBody(report.bab3VisitResults),
          makeSubHeading('3.2 Hasil Observasi Siswa'),
          ...makeBody(report.bab3StudentObservations),
          makeSubHeading('3.3 Nilai Sejarah dan Nasionalisme'),
          ...makeBody(report.bab3NationalismValues),
          makeSubHeading('3.4 Ringkasan Refleksi Pembelajaran'),
          ...makeBody(report.bab3ReflectionSummary),

          new Paragraph({ children: [new PageBreak()] }),
          makeHeading('BAB IV EVALUASI KEGIATAN'),
          makeSubHeading('4.1 Evaluasi Pelaksanaan'),
          ...makeBody(report.bab4Evaluation),
          makeSubHeading('4.2 Faktor Pendukung'),
          ...makeBody(report.bab4SupportingFactors),
          makeSubHeading('4.3 Kendala dan Solusi'),
          ...makeBody(report.bab4ObstaclesSolutions),
          makeSubHeading('4.4 Rekomendasi Kegiatan Selanjutnya'),
          ...makeBody(report.bab4Recommendations),

          new Paragraph({ children: [new PageBreak()] }),
          makeHeading('BAB V PENUTUP'),
          makeSubHeading('5.1 Kesimpulan'),
          ...makeBody(report.bab5Conclusion),
          makeSubHeading('5.2 Saran'),
          ...makeBody(report.bab5Suggestions),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: `Mengetahui,\nKepala ${schoolName}\n\n${approval?.status === 'Disetujui' ? '[DISETUJUI SECARA DIGITAL]\n' : '\n'}\n${school?.principalName || 'Drs. H. Ahmad Muhajir, M.Pd.'}\nNIP. ${school?.principalNip || '-'}`,
                size: 20,
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),
          makeHeading('LAMPIRAN'),
          makeSubHeading('Lampiran 1. Daftar Guru Pendamping'),
          makeSimpleTable(
            ['No', 'Nama Guru', 'NIP/NUPTK', 'Jabatan', 'Tugas Pendampingan'],
            teachers.map((t, i) => [String(i + 1), t.name, t.nipNuptk || '-', t.position, t.mentoringTask])
          ),
          makeSubHeading('Lampiran 2. Rundown Kegiatan'),
          makeSimpleTable(
            ['No', 'Waktu', 'Kegiatan', 'Lokasi', 'PJ'],
            schedules
              .slice()
              .sort((a, b) => a.orderNo - b.orderNo)
              .map((s) => [String(s.orderNo), s.timeRange, s.activityTitle, s.location, s.personInCharge])
          ),
          makeSubHeading('Lampiran 3. Daftar Peserta Didik'),
          makeSimpleTable(
            ['No', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Status'],
            students.map((s, i) => [String(i + 1), s.nis, s.name, s.className, s.gender, s.participationStatus])
          ),
          makeSubHeading('Lampiran 4. Ringkasan Refleksi Siswa'),
          makeSimpleTable(
            ['No', 'Nama Siswa', 'Kelas', 'Kesimpulan Pembelajaran', 'Skor'],
            reflections.map((r, i) => [
              String(i + 1),
              r.studentName,
              r.className,
              r.learningConclusion.slice(0, 120),
              r.teacherScore !== undefined ? String(r.teacherScore) : '-',
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Laporan_Kokurikuler_SMA_Darul_Ulum_${activity?.year || 2026}.docx`);
}
