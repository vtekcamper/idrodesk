import { Request, Response } from 'express';
import prisma from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Assicurati che la directory esista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accetta immagini e documenti
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato'));
    }
  },
});

export const addAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const userId = req.user!.userId;
    const { tipo, descrizione } = req.body;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File non fornito' });
    }

    // URL relativo o assoluto (per ora locale, poi S3)
    const fileUrl = `/uploads/${req.file.filename}`;

    const attachment = await prisma.jobAttachment.create({
      data: {
        jobId: id,
        tipo: tipo || 'FOTO',
        fileUrl,
        descrizione,
        uploadedBy: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
    });

    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Add attachment error:', error);
    res.status(500).json({ error: error.message || 'Errore nel caricamento allegato' });
  }
};

export const getAttachments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const job = await prisma.job.findFirst({
      where: { id, companyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Lavoro non trovato' });
    }

    const attachments = await prisma.jobAttachment.findMany({
      where: { jobId: id },
      include: {
        uploader: {
          select: {
            id: true,
            nome: true,
            cognome: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(attachments);
  } catch (error: any) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: error.message || 'Errore nel recupero allegati' });
  }
};

