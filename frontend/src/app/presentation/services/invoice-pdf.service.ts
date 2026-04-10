import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../../domain/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {
  async generate(invoice: Invoice): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const brandColor: [number, number, number] = [19, 78, 74];
    const accentColor: [number, number, number] = [15, 118, 110];
    const totalAmount =
      invoice.totalAmount ??
      invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    this.renderHeader(doc, pageWidth, brandColor, accentColor);
    this.renderCompanyBlock(doc, margin, 38);
    this.renderInvoiceMeta(doc, invoice, pageWidth - margin - 78, 38, totalAmount);

    autoTable(doc, {
      startY: 70,
      head: [['Item', 'Produto', 'Qtd', 'Vlr. Unit.', 'Subtotal']],
      body: invoice.items.map((item, index) => [
        String(index + 1),
        item.productId,
        String(item.quantity),
        this.formatCurrency(item.unitPrice),
        this.formatCurrency(item.quantity * item.unitPrice),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [224, 231, 235],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: brandColor,
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 74 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 92;
    this.renderSummary(doc, margin, finalY + 10, pageWidth, totalAmount);
    this.renderFooter(doc, pageWidth, margin);

    const pdfBlob = doc.output('blob');
    const previewUrl = URL.createObjectURL(pdfBlob);
    const previewWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

    if (!previewWindow) {
      doc.save(`nota-fiscal-${invoice.sequentialNumber}.pdf`);
    }

    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
  }

  private renderHeader(doc: jsPDF, pageWidth: number, brandColor: [number, number, number], accentColor: [number, number, number]) {
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFillColor(...accentColor);
    doc.circle(22, 16, 9, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KTB', 17.5, 18.5);

    doc.setFontSize(16);
    doc.text('Korp Teste Tavilo Breno', 40, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Gestão de produtos e faturamento', 40, 21);
  }

  private renderCompanyBlock(doc: jsPDF, left: number, top: number) {
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Korp Teste Tavilo Breno LTDA', left, top);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('CNPJ ficticio: 00.000.000/0001-00', left, top + 6);
    doc.text('Av. Central, 123 - Centro - Sao Paulo/SP', left, top + 11);
    doc.text('contato@korp-teste.local | (11) 99999-0000', left, top + 16);
  }

  private renderInvoiceMeta(doc: jsPDF, invoice: Invoice, left: number, top: number, totalAmount: number) {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(left, top, 64, 34, 2, 2, 'FD');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`NF ${invoice.sequentialNumber.toString().padStart(6, '0')}`, left + 4, top + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Status: ${invoice.status}`, left + 4, top + 14);
    doc.text(`Criada em: ${this.formatDate(invoice.createdAt)}`, left + 4, top + 19);
    doc.text(`Fechada em: ${invoice.closedAt ? this.formatDate(invoice.closedAt) : 'Em aberto'}`, left + 4, top + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${this.formatCurrency(totalAmount)}`, left + 4, top + 30);
  }

  private renderSummary(doc: jsPDF, left: number, top: number, pageWidth: number, totalAmount: number) {
    const boxWidth = pageWidth - left * 2;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(left, top, boxWidth, 26, 2, 2, 'FD');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Resumo financeiro', left + 4, top + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Cliente demonstrativo: Consumidor Final', left + 4, top + 14);
    doc.text('Condição: Documento gerado automaticamente para validação do fluxo.', left + 4, top + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(this.formatCurrency(totalAmount), pageWidth - left - 4, top + 14, { align: 'right' });
  }

  private renderFooter(doc: jsPDF, pageWidth: number, margin: number) {
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, 278, pageWidth - margin, 278);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Documento ficticio gerado pelo sistema Korp para demonstracao.', margin, 283);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
