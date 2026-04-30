import PDFDocument from 'pdfkit';

/**
 * Genera un PDF del albarán con los datos de usuario, cliente, proyecto y albarán.
 * @param {object} deliveryNote - Albarán con populate de user, client y project
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
export const generateDeliveryNotePdf = (deliveryNote) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === CABECERA ===
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('ALBARÁN', { align: 'center' });

      doc.moveDown(0.5);

      // Línea separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke('#333333');

      doc.moveDown(1);

      // === DATOS DE LA COMPAÑÍA / USUARIO ===
      const user = deliveryNote.user || {};
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Emisor:', { continued: true })
        .font('Helvetica')
        .text(` ${user.name || ''} ${user.surnames || ''}`.trim() || ' Sin nombre');

      doc
        .font('Helvetica-Bold')
        .text('Email:', { continued: true })
        .font('Helvetica')
        .text(` ${user.email || 'N/A'}`);

      doc.moveDown(0.5);

      // === DATOS DEL CLIENTE ===
      const client = deliveryNote.client || {};
      doc
        .font('Helvetica-Bold')
        .text('Cliente:', { continued: true })
        .font('Helvetica')
        .text(` ${client.name || 'N/A'}`);

      if (client.cif) {
        doc
          .font('Helvetica-Bold')
          .text('CIF:', { continued: true })
          .font('Helvetica')
          .text(` ${client.cif}`);
      }

      if (client.email) {
        doc
          .font('Helvetica-Bold')
          .text('Email cliente:', { continued: true })
          .font('Helvetica')
          .text(` ${client.email}`);
      }

      if (client.address) {
        const addr = client.address;
        const addressStr = [addr.street, addr.number, addr.postal, addr.city, addr.province]
          .filter(Boolean)
          .join(', ');
        if (addressStr) {
          doc
            .font('Helvetica-Bold')
            .text('Dirección:', { continued: true })
            .font('Helvetica')
            .text(` ${addressStr}`);
        }
      }

      doc.moveDown(0.5);

      // === DATOS DEL PROYECTO ===
      const project = deliveryNote.project || {};
      doc
        .font('Helvetica-Bold')
        .text('Proyecto:', { continued: true })
        .font('Helvetica')
        .text(` ${project.name || 'N/A'}`);

      if (project.projectCode) {
        doc
          .font('Helvetica-Bold')
          .text('Código:', { continued: true })
          .font('Helvetica')
          .text(` ${project.projectCode}`);
      }

      doc.moveDown(1);

      // Línea separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke('#cccccc');

      doc.moveDown(1);

      // === DATOS DEL ALBARÁN ===
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Detalle del albarán');

      doc.moveDown(0.5);
      doc.fontSize(10);

      // Fecha de trabajo
      const workDate = deliveryNote.workDate
        ? new Date(deliveryNote.workDate).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'N/A';

      doc
        .font('Helvetica-Bold')
        .text('Fecha de trabajo:', { continued: true })
        .font('Helvetica')
        .text(` ${workDate}`);

      doc
        .font('Helvetica-Bold')
        .text('Tipo:', { continued: true })
        .font('Helvetica')
        .text(` ${deliveryNote.format === 'hours' ? 'Horas' : 'Material'}`);

      if (deliveryNote.description) {
        doc
          .font('Helvetica-Bold')
          .text('Descripción:', { continued: true })
          .font('Helvetica')
          .text(` ${deliveryNote.description}`);
      }

      doc.moveDown(0.5);

      // === CONTENIDO SEGÚN FORMATO ===
      if (deliveryNote.format === 'material') {
        // Tabla de materiales
        doc.font('Helvetica-Bold');

        const tableTop = doc.y;
        doc.text('Material', 50, tableTop);
        doc.text('Cantidad', 300, tableTop);
        doc.text('Unidad', 420, tableTop);

        doc
          .moveTo(50, doc.y + 5)
          .lineTo(545, doc.y + 5)
          .stroke('#cccccc');

        doc.moveDown(0.5);
        doc.font('Helvetica');

        const rowY = doc.y;
        doc.text(deliveryNote.material || 'N/A', 50, rowY);
        doc.text(String(deliveryNote.quantity || 0), 300, rowY);
        doc.text(deliveryNote.unit || 'N/A', 420, rowY);

        doc.moveDown(1);
      } else if (deliveryNote.format === 'hours') {
        if (deliveryNote.workers && deliveryNote.workers.length > 0) {
          // Tabla de trabajadores
          doc.font('Helvetica-Bold');

          const tableTop = doc.y;
          doc.text('Trabajador', 50, tableTop);
          doc.text('Horas', 420, tableTop);

          doc
            .moveTo(50, doc.y + 5)
            .lineTo(545, doc.y + 5)
            .stroke('#cccccc');

          doc.moveDown(0.5);
          doc.font('Helvetica');

          let totalHours = 0;
          for (const worker of deliveryNote.workers) {
            const rowY = doc.y;
            doc.text(worker.name || 'N/A', 50, rowY);
            doc.text(String(worker.hours || 0), 420, rowY);
            totalHours += worker.hours || 0;
            doc.moveDown(0.3);
          }

          doc
            .moveTo(50, doc.y + 5)
            .lineTo(545, doc.y + 5)
            .stroke('#cccccc');

          doc.moveDown(0.5);
          doc.font('Helvetica-Bold');
          const totalY = doc.y;
          doc.text('Total horas:', 300, totalY);
          doc.text(String(totalHours), 420, totalY);
        } else {
          doc
            .font('Helvetica-Bold')
            .text('Horas totales:', { continued: true })
            .font('Helvetica')
            .text(` ${deliveryNote.hours || 0}`);
        }

        doc.moveDown(1);
      }

      // === FIRMA ===
      doc.moveDown(1);

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke('#cccccc');

      doc.moveDown(1);

      if (deliveryNote.signed) {
        doc
          .font('Helvetica-Bold')
          .text('Estado: FIRMADO', { align: 'center' });

        if (deliveryNote.signedAt) {
          const signedDate = new Date(deliveryNote.signedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(`Firmado el ${signedDate}`, { align: 'center' });
        }
      } else {
        doc
          .font('Helvetica')
          .fillColor('#999999')
          .text('Pendiente de firma', { align: 'center' })
          .fillColor('#000000');
      }

      // === PIE DE PÁGINA ===
      doc.moveDown(2);
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          `Generado por BildyApp — ${new Date().toLocaleDateString('es-ES')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        )
        .fillColor('#000000');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
