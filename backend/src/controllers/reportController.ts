import { Request, Response } from 'express';
import prisma from '../config/database';
import PDFDocument from 'pdfkit';
import path from 'path';

export const generateReportPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        site: true,
        tecnico: {
          select: {
            nome: true,
            cognome: true,
          },
        },
        quote: {
          include: {
            items: true,
          },
        },
        materials: {
          include: {
            material: true,
          },
        },
        checklists: {
          include: {
            checklist: {
              include: {
                items: {
                  orderBy: { ordine: 'asc' },
                },
              },
            },
            responses: {
              include: {
                checklistItem: true,
              },
            },
          },
        },
        attachments: {
          where: { tipo: 'FOTO' },
          take: 5,
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    // Crea PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapportino-${job.id}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('RAPPORTINO DI LAVORO', { align: 'center' });
    doc.moveDown();

    // Dati Cliente
    doc.fontSize(14).text('DATI CLIENTE', { underline: true });
    doc.fontSize(12);
    doc.text(`Cliente: ${job.client.nome} ${job.client.cognome || ''}`);
    if (job.client.indirizzo) {
      doc.text(`Indirizzo: ${job.client.indirizzo}`);
    }
    if (job.client.citta) {
      doc.text(`Città: ${job.client.citta} ${job.client.cap || ''}`);
    }
    if (job.client.telefono) {
      doc.text(`Telefono: ${job.client.telefono}`);
    }
    if (job.site) {
      doc.text(`Sito: ${job.site.descrizione}`);
      if (job.site.indirizzo) {
        doc.text(`Indirizzo sito: ${job.site.indirizzo}`);
      }
    }
    doc.moveDown();

    // Dati Lavoro
    doc.fontSize(14).text('DATI LAVORO', { underline: true });
    doc.fontSize(12);
    doc.text(`Titolo: ${job.titolo}`);
    if (job.descrizione) {
      doc.text(`Descrizione: ${job.descrizione}`);
    }
    doc.text(`Stato: ${job.stato}`);
    if (job.dataProgrammata) {
      doc.text(`Data: ${new Date(job.dataProgrammata).toLocaleDateString('it-IT')}`);
    }
    if (job.oraProgrammata) {
      doc.text(`Ora: ${job.oraProgrammata}`);
    }
    if (job.tecnico) {
      doc.text(`Tecnico: ${job.tecnico.nome} ${job.tecnico.cognome}`);
    }
    doc.moveDown();

    // Checklist
    if (job.checklists.length > 0) {
      job.checklists.forEach((jobChecklist) => {
        doc.fontSize(14).text(`CHECKLIST: ${jobChecklist.checklist.nome}`, { underline: true });
        doc.fontSize(12);
        
        jobChecklist.checklist.items.forEach((item) => {
          const response = jobChecklist.responses.find((r) => r.checklistItemId === item.id);
          
          let responseText = '';
          if (response) {
            if (item.tipoCampo === 'CHECKBOX' || item.tipoCampo === 'SI_NO') {
              responseText = response.valoreBoolean ? 'Sì' : 'No';
            } else if (item.tipoCampo === 'NUMERO') {
              responseText = response.valoreNumero?.toString() || '-';
            } else {
              responseText = response.valoreTesto || '-';
            }
            if (response.note) {
              responseText += ` (${response.note})`;
            }
          } else {
            responseText = 'Non compilato';
          }
          
          doc.text(`• ${item.descrizione}: ${responseText}`);
        });
        
        doc.moveDown();
      });
    }

    // Materiali
    if (job.materials.length > 0) {
      doc.fontSize(14).text('MATERIALI USATI', { underline: true });
      doc.fontSize(12);
      
      let totaleMateriali = 0;
      job.materials.forEach((mat) => {
        const totale = Number(mat.totale);
        totaleMateriali += totale;
        doc.text(`${mat.descrizione} - Qty: ${mat.quantita} - Totale: €${totale.toFixed(2)}`);
      });
      
      doc.moveDown();
      doc.fontSize(12).text(`Totale materiali: €${totaleMateriali.toFixed(2)}`);
      doc.moveDown();
    }

    // Note
    if (job.attachments.length > 0) {
      doc.fontSize(14).text('ALLEGATI', { underline: true });
      doc.fontSize(12);
      doc.text(`Numero foto/documenti: ${job.attachments.length}`);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(
      `Generato il ${new Date().toLocaleString('it-IT')}`,
      { align: 'center' }
    );

    doc.end();
  } catch (error: any) {
    console.error('Generate report PDF error:', error);
    res.status(500).json({ error: error.message || 'Errore nella generazione PDF' });
  }
};

