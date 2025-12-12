import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailType } from '@prisma/client';

/**
 * Directory template email
 */
const TEMPLATES_DIR = path.join(process.cwd(), 'backend/src/templates/email');

/**
 * Registra helper Handlebars personalizzati
 */
function registerHandlebarsHelpers() {
  // Formatta data in formato italiano
  Handlebars.registerHelper('formatDate', (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  // Formatta currency
  Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
    }).format(amount);
  });

  // Uppercase
  Handlebars.registerHelper('uppercase', (str: string) => {
    return str?.toUpperCase() || '';
  });

  // Condizionale
  Handlebars.registerHelper('eq', (a: any, b: any) => {
    return a === b;
  });
}

// Registra helper al primo import
registerHandlebarsHelpers();

/**
 * Carica template da file o usa template inline
 */
function loadTemplate(templateName: string): string {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
  
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
  } catch (error) {
    console.warn(`Template file not found: ${templatePath}, using inline template`);
  }

  // Fallback a template inline
  return getInlineTemplate(templateName);
}

/**
 * Template inline (fallback se file non esiste)
 */
function getInlineTemplate(templateName: string): string {
  const templates: Record<string, string> = {
    welcome: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Benvenuto in IdroDesk!</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>La tua azienda è stata registrata con successo su IdroDesk.</p>
      <p>Puoi iniziare a gestire i tuoi clienti, preventivi e lavori.</p>
      <p>Buon lavoro!</p>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    subscription_expiring: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Abbonamento in Scadenza</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tuo abbonamento scadrà tra <strong>{{daysUntilExpiry}} giorni</strong> ({{expiryDate}}).</p>
      <p>Rinnova ora per continuare a usare IdroDesk senza interruzioni.</p>
      <a href="{{renewUrl}}" class="button">Rinnova Abbonamento</a>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    subscription_expired: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔴 Abbonamento Scaduto</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tuo abbonamento è scaduto il {{expiryDate}}.</p>
      <p>Per continuare a usare IdroDesk, rinnova il tuo abbonamento.</p>
      <a href="{{renewUrl}}" class="button">Rinnova Abbonamento</a>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    payment_success: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pagamento Confermato</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tuo pagamento di <strong>{{amount}}</strong> è stato confermato con successo.</p>
      <p>Il tuo abbonamento è attivo fino al {{expiryDate}}.</p>
      <p>Grazie per la fiducia!</p>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    payment_failed: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Pagamento Fallito</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tentativo di pagamento di <strong>{{amount}}</strong> è fallito.</p>
      <p>Motivo: {{errorMessage}}</p>
      <p>Per favore, verifica i dati di pagamento e riprova.</p>
      <a href="{{retryUrl}}" class="button">Riprova Pagamento</a>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    plan_upgrade: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Upgrade Piano</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tuo piano è stato aggiornato a <strong>{{newPlan}}</strong>.</p>
      <p>Ora hai accesso a tutte le funzionalità del nuovo piano.</p>
      <p>Buon lavoro!</p>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
    plan_downgrade: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📉 Downgrade Piano</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>{{companyName}}</strong>,</p>
      <p>Il tuo piano è stato modificato a <strong>{{newPlan}}</strong>.</p>
      <p>Alcune funzionalità potrebbero non essere più disponibili.</p>
    </div>
    <div class="footer">
      <p>IdroDesk - Gestione professionale per idraulici</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return templates[templateName] || templates.welcome;
}

/**
 * Renderizza template email con dati
 */
export function renderEmailTemplate(
  templateName: string,
  data: Record<string, any>
): string {
  const templateSource = loadTemplate(templateName);
  const template = Handlebars.compile(templateSource);
  return template(data);
}

/**
 * Ottiene template name da EmailType
 */
export function getTemplateName(emailType: EmailType): string {
  const mapping: Record<EmailType, string> = {
    WELCOME: 'welcome',
    SUBSCRIPTION_EXPIRING: 'subscription_expiring',
    SUBSCRIPTION_EXPIRED: 'subscription_expired',
    SUBSCRIPTION_RENEWED: 'payment_success',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    PLAN_UPGRADE: 'plan_upgrade',
    PLAN_DOWNGRADE: 'plan_downgrade',
    INVOICE: 'payment_success',
    CUSTOM: 'welcome', // Fallback
  };

  return mapping[emailType] || 'welcome';
}

/**
 * Prepara dati per template in base al tipo
 */
export function prepareTemplateData(
  emailType: EmailType,
  context: Record<string, any>
): Record<string, any> {
  const baseData = {
    companyName: context.companyName || context.ragioneSociale || 'Cliente',
    frontendUrl: process.env.FRONTEND_URL || 'https://idrodesk.netlify.app',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@idrodesk.com',
  };

  switch (emailType) {
    case 'WELCOME':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
      };

    case 'SUBSCRIPTION_EXPIRING':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
        daysUntilExpiry: context.daysUntilExpiry,
        expiryDate: context.expiryDate || context.dataScadenza,
        renewUrl: `${baseData.frontendUrl}/subscription/renew`,
      };

    case 'SUBSCRIPTION_EXPIRED':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
        expiryDate: context.expiryDate || context.dataScadenza,
        renewUrl: `${baseData.frontendUrl}/subscription/renew`,
      };

    case 'PAYMENT_SUCCESS':
    case 'SUBSCRIPTION_RENEWED':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
        amount: context.amount,
        expiryDate: context.expiryDate || context.dataScadenza,
      };

    case 'PAYMENT_FAILED':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
        amount: context.amount,
        errorMessage: context.errorMessage || 'Errore sconosciuto',
        retryUrl: `${baseData.frontendUrl}/subscription/renew`,
      };

    case 'PLAN_UPGRADE':
    case 'PLAN_DOWNGRADE':
      return {
        ...baseData,
        companyName: context.companyName || context.ragioneSociale,
        newPlan: context.newPlan || context.pianoAbbonamento,
        oldPlan: context.oldPlan || context.pianoPrecedente,
      };

    default:
      return {
        ...baseData,
        ...context,
      };
  }
}

