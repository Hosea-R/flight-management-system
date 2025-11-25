const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Service pour l'envoi d'emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Initialiser le transporteur (lazy loading)
   */
  getTransporter() {
    if (!this.transporter) {
      try {
        this.transporter = nodemailer.createTransporter({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } catch (error) {
        logger.error('Failed to create email transporter:', error);
        return null;
      }
    }
    return this.transporter;
  }

  /**
   * Envoyer un email générique
   */
  async sendEmail(to, subject, html) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('Email credentials not configured, skipping email send');
        return { success: false, message: 'Email non configuré' };
      }

      const transporter = this.getTransporter();
      if (!transporter) {
        logger.error('Email transporter not available');
        return { success: false, message: 'Transporter non disponible' };
      }

      const mailOptions = {
        from: `"FIDS - Publicités" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Alerte d'expiration de contrat
   */
  async sendExpirationAlert(advertisement, daysRemaining) {
    const emails = advertisement.alerts?.expirationWarning?.notifyEmails || 
                   [process.env.ALERT_EMAILS];

    if (!emails || emails.length === 0) return;

    const subject = `⚠️ Votre publicité expire dans ${daysRemaining} jour(s)`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #f59e0b;">⚠️ Alerte d'expiration</h2>
        
        <p>Bonjour,</p>
        
        <p>Votre publicité <strong>"${advertisement.title}"</strong> expire bientôt.</p>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Jours restants:</strong> ${daysRemaining}</p>
          <p style="margin: 5px 0;"><strong>Date de fin:</strong> ${advertisement.endDate.toLocaleDateString('fr-FR')}</p>
          ${advertisement.contract?.number ? `<p style="margin: 5px 0;"><strong>Contrat №:</strong> ${advertisement.contract.number}</p>` : ''}
        </div>
        
        <p>Pour renouveler votre publicité, veuillez contacter votre gestionnaire de compte.</p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Cet email est envoyé automatiquement par le système FIDS.
        </p>
      </div>
    `;

    for (const email of emails) {
      await this.sendEmail(email, subject, html);
    }
  }

  /**
   * Alerte de quota atteint
   */
  async sendQuotaAlert(advertisement, percentageUsed) {
    const emails = advertisement.alerts?.quotaWarning?.notifyEmails || 
                   [process.env.ALERT_EMAILS];

    if (!emails || emails.length === 0) return;

    const subject = `📊 Quota de vues atteint à ${Math.round(percentageUsed)}%`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #f59e0b;">📊 Alerte de quota</h2>
        
        <p>Bonjour,</p>
        
        <p>Le quota de vues de votre publicité <strong>"${advertisement.title}"</strong> est bientôt atteint.</p>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Quota utilisé:</strong> ${Math.round(percentageUsed)}%</p>
          <p style="margin: 5px 0;"><strong>Vues actuelles:</strong> ${advertisement.viewCount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Quota maximum:</strong> ${advertisement.contract.maxViews.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Vues restantes:</strong> ${(advertisement.contract.maxViews - advertisement.viewCount).toLocaleString()}</p>
        </div>
        
        <p>La publicité sera automatiquement désactivée une fois le quota atteint.</p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Cet email est envoyé automatiquement par le système FIDS.
        </p>
      </div>
    `;

    for (const email of emails) {
      await this.sendEmail(email, subject, html);
    }
  }

  /**
   * Confirmation de renouvellement
   */
  async sendRenewalConfirmation(advertisement, newEndDate) {
    const email = advertisement.client?.contact?.email || process.env.ALERT_EMAILS;

    if (!email) return;

    const subject = `✅ Confirmation de renouvellement - ${advertisement.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #10b981;">✅ Renouvellement confirmé</h2>
        
        <p>Bonjour ${advertisement.client?.name || ''},</p>
        
        <p>Votre publicité <strong>"${advertisement.title}"</strong> a été renouvelée avec succès.</p>
        
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Nouvelle date de fin:</strong> ${new Date(newEndDate).toLocaleDateString('fr-FR')}</p>
          ${advertisement.contract?.number ? `<p style="margin: 5px 0;"><strong>Contrat №:</strong> ${advertisement.contract.number}</p>` : ''}
          ${advertisement.contract?.pricing?.amount ? `<p style="margin: 5px 0;"><strong>Montant:</strong> ${advertisement.contract.pricing.amount.toLocaleString()} ${advertisement.contract.pricing.currency}</p>` : ''}
        </div>
        
        <p>Merci pour votre confiance !</p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Cet email est envoyé automatiquement par le système FIDS.
        </p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Rapport mensuel
   */
  async sendMonthlyReport(adManagerEmail, stats) {
    const subject = `📊 Rapport mensuel - Publicités FIDS`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #3b82f6;">📊 Rapport mensuel</h2>
        
        <p>Bonjour,</p>
        
        <p>Voici le rapport de performance de vos publicités pour le mois dernier :</p>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Publicités actives:</strong> ${stats.activeAds || 0}</p>
          <p style="margin: 5px 0;"><strong>Vues totales:</strong> ${(stats.totalViews || 0).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Revenus générés:</strong> ${(stats.totalRevenue || 0).toLocaleString()} MGA</p>
          <p style="margin: 5px 0;"><strong>Moyenne vues/jour:</strong> ${Math.round(stats.avgViewsPerDay || 0).toLocaleString()}</p>
        </div>
        
        <h3>Top 3 publicités</h3>
        <ol>
          ${(stats.topAds || []).map(ad => `
            <li><strong>${ad.title}</strong> - ${ad.views.toLocaleString()} vues</li>
          `).join('')}
        </ol>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Cet email est envoyé automatiquement le 1er de chaque mois.
        </p>
      </div>
    `;

    await this.sendEmail(adManagerEmail, subject, html);
  }
}

// Export singleton
module.exports = new EmailService();
