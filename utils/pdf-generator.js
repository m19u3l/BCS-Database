import PDFDocument from 'pdfkit';
import fs from 'fs'; // Although fs isn't strictly needed for piping to res, it's often imported.

/**
 * Generates a simple PDF invoice and pipes it to the response stream.
 * @param {object} res - The Express response object.
 * @param {object} invoiceData - The data needed to populate the invoice.
 */
function generateInvoicePdf(res, invoiceData) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set the response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoiceData.invoice_number}.pdf"`);
    
    // Pipe the PDF content directly to the HTTP response stream
    doc.pipe(res);

    // --- 1. Header ---
    doc.fontSize(20).text(invoiceData.company_name, 50, 50)
       .fontSize(10).text(`Invoice #${invoiceData.invoice_number}`, 400, 65)
       .text(`Issue Date: ${invoiceData.date_of_issue}`, 400, 80);

    // --- 2. Client Details ---
    doc.fontSize(12).text('Bill To:', 50, 150)
       .fontSize(10).text(invoiceData.client_name || 'N/A', 50, 165) // Use || 'N/A' for safety
       .text(invoiceData.client_address || '', 50, 180)
       .moveDown();

    // --- 3. Items Table (Simple Example) ---
    const tableTop = 250;
    doc.fontSize(10)
       .text('Description', 50, tableTop)
       .text('Rate', 300, tableTop, { width: 90, align: 'right' })
       .text('Qty', 400, tableTop, { width: 90, align: 'right' })
       .text('Total', 450, tableTop, { width: 90, align: 'right' });

    doc.lineCap('butt').moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    // Example item line (Ensure line_items is defined)
    const firstItem = invoiceData.line_items?.[0] || { description: 'No Line Items', rate: 0, quantity: 0, total: 0 };
    let itemY = tableTop + 35;
    doc.text(firstItem.description, 50, itemY)
       .text(firstItem.rate.toFixed(2), 300, itemY, { width: 90, align: 'right' })
       .text(firstItem.quantity.toFixed(1), 400, itemY, { width: 90, align: 'right' })
       .text(firstItem.total.toFixed(2), 450, itemY, { width: 90, align: 'right' });

    // --- 4. Totals ---
    let totalY = itemY + 50;
    doc.fontSize(10).text(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, 400, totalY, { align: 'right' });
    totalY += 15;
    
    const taxRate = invoiceData.tax_rate || 0.0;
    const taxAmount = invoiceData.tax || 0.0;

    doc.text(`Tax (${(taxRate * 100).toFixed(1)}%): $${taxAmount.toFixed(2)}`, 400, totalY, { align: 'right' });
    totalY += 25;
    doc.fontSize(12).text(`Total Due: $${invoiceData.total.toFixed(2)}`, 400, totalY, { align: 'right' });

    // Finalize the PDF and end the stream
    doc.end();
}

export { generateInvoicePdf };
