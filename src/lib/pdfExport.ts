import { jsPDF } from 'jspdf';
import { DreamLeaf, AppSettings } from '../types';

export const exportLeavesToPDF = (leaves: DreamLeaf[], settings: AppSettings) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  // --- COVER PAGE ---
  const drawLowPoly = () => {
    const colors = [
      [46, 125, 50],
      [56, 142, 60],
      [76, 175, 80],
      [102, 187, 106],
      [129, 199, 132],
      [200, 230, 201],
      [255, 235, 59],
    ];

    for (let i = 0; i < 60; i++) {
      const x1 = Math.random() * pageWidth;
      const y1 = Math.random() * pageHeight;
      const x2 = x1 + (Math.random() - 0.5) * 80;
      const y2 = y1 + (Math.random() - 0.5) * 80;
      const x3 = x1 + (Math.random() - 0.5) * 80;
      const y3 = y1 + (Math.random() - 0.5) * 80;

      const color = colors[Math.floor(Math.random() * colors.length)];
      doc.setFillColor(color[0], color[1], color[2]);
      (doc as any).setGState(new (doc as any).GState({ opacity: 0.3 }));
      doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
    }
  };

  drawLowPoly();

  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  doc.setTextColor(27, 94, 32);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text((settings.appTitle || 'Pohon Impian').toUpperCase(), pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 142, 60);
  doc.text(settings.appSubtitle || 'Harapan Masa Depanku', pageWidth / 2, 95, { align: 'center' });

  doc.setDrawColor(56, 142, 60);
  doc.setLineWidth(1.5);
  doc.line(pageWidth / 2 - 30, 105, pageWidth / 2 + 30, 105);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 120, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(50);
  doc.text(`${leaves.length} Harapan Siswa Terkumpul`, pageWidth / 2, 140, { align: 'center' });

  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', pageWidth / 2 - 20, 160, 40, 40);
    } catch (e) {
      console.error('Failed to add logo to PDF', e);
    }
  }

  // --- CONTENT PAGES ---
  const margin = 10;
  const gridCols = 2;
  const gridRows = 3;
  const cellWidth = (pageWidth - (margin * 2)) / gridCols;
  const cellHeight = (pageHeight - (margin * 2)) / gridRows;

  let currentPage = 1;
  leaves.forEach((leaf, index) => {
    const pageIndex = index % 6;
    if (pageIndex === 0) {
      doc.addPage();
      currentPage++;
    }

    const col = pageIndex % gridCols;
    const row = Math.floor(pageIndex / gridCols);
    const x = margin + (col * cellWidth);
    const y = margin + (row * cellHeight);

    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.rect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

    doc.setFontSize(14);
    doc.setTextColor(45, 45, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(leaf.studentName.toUpperCase(), x + (cellWidth / 2), y + 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    const dateStr = new Date(leaf.timestamp).toLocaleDateString('id-ID');
    doc.text(`Tanam Harapan: ${dateStr}`, x + (cellWidth / 2), y + 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('"Aku berharap suatu saat akan..."', x + (cellWidth / 2), y + 32, { align: 'center' });

    try {
      const imgWidth = cellWidth - 25;
      const imgY = y + 40;
      doc.addImage(leaf.signatureDataUrl, 'PNG', x + 12.5, imgY, imgWidth, (imgWidth * 0.6));
    } catch (e) {
      console.error('Failed to add image to PDF', e);
    }

    doc.setFillColor(leaf.color);
    doc.circle(x + cellWidth - 12, y + 12, 4, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(200);
    doc.text(`Halaman ${currentPage}`, pageWidth - 15, pageHeight - 5);
  });

  doc.save(`Harapan_Siswa_${new Date().toISOString().split('T')[0]}.pdf`);
};
