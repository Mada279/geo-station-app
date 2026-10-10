import { Resend } from 'resend';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export type ProviderMailAction =
  | 'welcome'
  | 'approved'
  | 'suspended'
  | 'restored'
  | 'needs_revision';

export type MailUserType = 'provider' | 'client' | 'engineer';

export interface ProviderMailInput {
  actionType: ProviderMailAction;
  recipientName: string;
  userType?: MailUserType;
  reason?: string;
  suspendedUntil?: string;
}

/**
 * Only free-text coming from a request body needs escaping. Template strings
 * stored in platform_settings are admin-authored HTML and pass through as-is.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface TemplateParts {
  subject: string;
  badgeText: string;
  badgeBg: string;
  title: string;
  mainMessage: string;
  actionButtonText: string;
  actionButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
}

const SITE_URL = 'https://survsta.com';

async function loadWelcomeTemplate(recipientName: string): Promise<TemplateParts> {
  const parts: TemplateParts = {
    subject: '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس',
    badgeText: 'شريك معتمد جديد',
    badgeBg: '#0284c7',
    title: `أهلاً ومرحباً بك معنا، ${recipientName} 👋`,
    mainMessage: `
      يسعدنا ويشرفنا انضمامك إلى <strong>منصة Survsta</strong> — المنظومة الرقمية الأولى والأشمل في مصر المتخصصة في خدمات وأجهزة المساحة والجيوماتكس.<br/><br/>
      <strong>آفاق جديدة لتنمية أعمال مكتبك المساحي:</strong>
      <ul style="margin: 12px 0; padding-right: 20px; line-height: 1.9; color: #334155;">
        <li><strong>عرض أجهزتك وتأجيرها:</strong> انشر معداتك المساحية لتصل إلى آلاف المهندسين وشركات المقاولات الباحثة عن أجهزة للإيجار يومياً.</li>
        <li><strong>حضور رسمي وتوثيق مهني:</strong> احجز مكان مكتبك في دليل المساحة المعتمد لتعزيز ثقة العملاء وزيادة العقود المباشرة.</li>
        <li><strong>فرص عمل واستقطاب كوادر:</strong> أعلن عن الشواغر الوظيفية في مكتبك واستقطب أكفأ مهندسي وفنيي المساحة.</li>
      </ul>
      <p style="margin-top: 14px;">ابدأ الآن بإضافة أول جهاز مساحي إلى كتالوج مكتبك لتفعيل ظهورك الفوري بالسوق وتلقي طلبات الحجز المباشرة.</p>
    `,
    actionButtonText: '➕ أضف معداتك وأجهزتك المساحية الآن',
    actionButtonUrl: `${SITE_URL}/provider/dashboard#equipment`,
    secondaryButtonText: 'الدخول إلى لوحة التحكم',
    secondaryButtonUrl: `${SITE_URL}/provider/dashboard`,
  };

  // Service role: platform_settings rows can be admin-only readable and must not
  // depend on who happens to be signed in when the mail is rendered.
  const { data: settingRow, error } = await supabaseAdmin
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'template_welcome_email')
    .maybeSingle();

  if (error) {
    console.warn('[providerEmail] Could not read welcome template, using defaults:', error.message);
    return parts;
  }
  if (!settingRow?.setting_value) return parts;

  let tpl: Record<string, any>;
  try {
    tpl =
      typeof settingRow.setting_value === 'string'
        ? JSON.parse(settingRow.setting_value)
        : settingRow.setting_value;
  } catch {
    return parts;
  }
  if (!tpl || typeof tpl !== 'object') return parts;

  const fill = (value: string) =>
    value.replace(/\{recipient_name\}|\{provider_name\}/g, recipientName);

  if (typeof tpl.subject === 'string' && tpl.subject) parts.subject = fill(tpl.subject);
  if (typeof tpl.badge_text === 'string' && tpl.badge_text) parts.badgeText = tpl.badge_text;
  if (typeof tpl.badge_bg === 'string' && tpl.badge_bg) parts.badgeBg = tpl.badge_bg;
  if (typeof tpl.title === 'string' && tpl.title) parts.title = fill(tpl.title);
  if (typeof tpl.main_message === 'string' && tpl.main_message) {
    parts.mainMessage = fill(tpl.main_message)
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }
  if (typeof tpl.cta_text === 'string' && tpl.cta_text) parts.actionButtonText = tpl.cta_text;
  if (typeof tpl.cta_url === 'string' && tpl.cta_url) parts.actionButtonUrl = tpl.cta_url;
  if (typeof tpl.secondary_cta_text === 'string') parts.secondaryButtonText = tpl.secondary_cta_text;
  if (typeof tpl.secondary_cta_url === 'string') parts.secondaryButtonUrl = tpl.secondary_cta_url;

  return parts;
}

export async function buildProviderEmail(input: ProviderMailInput): Promise<{ subject: string; html: string }> {
  const recipientName = escapeHtml(input.recipientName || 'شريكنا العزيز');
  const reason = input.reason ? escapeHtml(input.reason) : '';
  let parts: TemplateParts;

  switch (input.actionType) {
    case 'welcome':
    case 'approved':
      if (input.actionType === 'welcome' && input.userType === 'client') {
        parts = {
          subject: '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس',
          badgeText: 'أهلاً بك في مجتمعنا',
          badgeBg: '#0284c7',
          title: `أهلاً ومرحباً بك معنا، ${recipientName} 👋`,
          mainMessage: `
            يسعدنا انضمامك إلى <strong>منصة Survsta</strong> — المنصة الرقمية الرائدة في مصر لربط المكاتب الاستشارية وشركات المقاولات بأكبر شبكة لمزودي المعدات والخدمات المساحية المعتمدة.<br/><br/>
            <strong>ماذا تقدم لك المنصة؟</strong>
            <ul style="margin: 12px 0; padding-right: 20px; line-height: 1.9; color: #334155;">
              <li><strong>تأجير وشراء الأجهزة المساحية:</strong> محطات رصد متكاملة (Total Stations)، أجهزة GPS / GNSS RTK، وموازين ليزرية بأعلى دقة وأفضل أسعار بالسوق.</li>
              <li><strong>مكاتب معتمدة وموثوقة:</strong> تواصل مباشر وفوري مع كبرى مكاتب وشركات المساحة في محافظتك بضمان جودة الأجهزة والمعايرة الدورية.</li>
              <li><strong>إدارة ذكية لطلباتك:</strong> تتبع طلبات الإيجار وفترات العمل والمستخلصات بكل سهولة من لوحة تحكم واحدة.</li>
            </ul>
            <p style="margin-top: 14px;">نتمنى لك تجربة استثنائية تسهم في إنجاز مشاريعك الهندسية بأعلى كفاءة ودقة.</p>
          `,
          actionButtonText: 'تصفح سوق الأجهزة والمعدات الآن',
          actionButtonUrl: `${SITE_URL}/equipment`,
          secondaryButtonText: 'لوحة التحكم',
          secondaryButtonUrl: `${SITE_URL}/client/dashboard`,
        };
      } else {
        parts = await loadWelcomeTemplate(recipientName);
      }
      break;

    case 'suspended':
      parts = {
        subject: '⚠️ إشعار هام: تم تعليق حساب المزود الخاص بك في منصة Survsta',
        badgeText: 'تنبيه إداري عاجل',
        badgeBg: '#ef4444',
        title: `عزيزنا الشريك: ${recipientName}`,
        mainMessage: `
          نود إعلامكم بأنه تم إيقاف وتجميد حساب المزود الخاص بكم في منصة <strong>Survsta</strong> مؤقتاً.<br/>
          ${reason ? `<div style="margin: 14px 0; padding: 12px; background: #fef2f2; border-right: 4px solid #ef4444; border-radius: 6px;"><strong>سبب الإجراء:</strong> ${reason}</div>` : ''}
          ${
            input.suspendedUntil
              ? `<p><strong>مدة الإيقاف حتى:</strong> ${new Date(input.suspendedUntil).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
              : '<p><strong>نوع الإيقاف:</strong> حظر إداري دائم لحين مراجعة الأوراق مع الإدارة.</p>'
          }
          خلال فترة الإيقاف، سيتم إخفاء كافة الأجهزة والمعدات والوظائف التابعة لمكتبكم من سوق المنصة حرصاً على موثوقية العمليات.
        `,
        actionButtonText: 'تواصل مع الدعم الفني',
        actionButtonUrl: `${SITE_URL}/contact`,
        secondaryButtonText: '',
        secondaryButtonUrl: '',
      };
      break;

    case 'restored':
      parts = {
        subject: '✅ تم رفع الحظر واستعادة تفعيل حسابكم في Survsta',
        badgeText: 'تم استعادة الحساب',
        badgeBg: '#06b6d4',
        title: `شريكنا: ${recipientName}`,
        mainMessage: `نحيطكم علماً بأنه تم رفع الإيقاف عن حسابكم بنجاح. عادت أجهزتكم ووظائفكم للظهور بكامل طاقتها في السوق العام للدليل.`,
        actionButtonText: 'فتح لوحة المزود',
        actionButtonUrl: `${SITE_URL}/provider/dashboard`,
        secondaryButtonText: '',
        secondaryButtonUrl: '',
      };
      break;

    case 'needs_revision':
    default:
      parts = {
        subject: '📝 مطلوب استكمال وتعديل بيانات حسابكم في Survsta',
        badgeText: 'مطلوب مراجعة أوراق',
        badgeBg: '#f59e0b',
        title: `مرحباً ${recipientName}`,
        mainMessage: `
          أثناء مراجعة حسابكم المساحي، تبيّن وجود بعض البيانات أو المستندات الناقصة (مثل السجل التجاري، رخصة مزاولة المهنة، أو صور الأجهزة).<br/>
          ${reason ? `<div style="margin: 14px 0; padding: 12px; background: #fffbeb; border-right: 4px solid #f59e0b; border-radius: 6px;"><strong>ملاحظات الإدارة:</strong> ${reason}</div>` : ''}
          يرجى تسجيل الدخول وإعادة رفع الأوراق المطلوبة لنتمكن من تفعيل حسابكم فوراً.
        `,
        actionButtonText: 'تعديل البيانات الآن',
        actionButtonUrl: `${SITE_URL}/provider/verification`,
        secondaryButtonText: '',
        secondaryButtonUrl: '',
      };
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #081933; padding: 28px; text-align: center; border-bottom: 2px solid #06b6d4; }
          .brand { color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
          .brand span { color: #06b6d4; }
          .body { padding: 32px 28px; }
          .badge { display: inline-block; background: ${parts.badgeBg}; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 16px; }
          .content { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 28px; }
          .btn { display: inline-block; background: #081933; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; border: 1px solid #06b6d4; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Surv<span>sta</span>.com</div>
            <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس</div>
          </div>
          <div class="body">
            <div class="badge">${parts.badgeText}</div>
            <div class="title">${parts.title}</div>
            <div class="content">${parts.mainMessage}</div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${parts.actionButtonUrl}" class="btn" style="background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; border: 1px solid #38bdf8; display: inline-block;">${parts.actionButtonText} ←</a>
              ${
                parts.secondaryButtonUrl
                  ? `<div style="margin-top: 14px;"><a href="${parts.secondaryButtonUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">${parts.secondaryButtonText}</a></div>`
                  : ''
              }
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              هذه الرسالة رسمية من إدارة منصة Survsta لشركائها المعتمدين. إذا كان لديك أي استفسار، يرجى الرد على هذا البريد أو التواصل عبر قنوات الدعم الرسمية.
            </p>
          </div>
          <div class="footer">
            جميع الحقوق محفوظة © ${new Date().getFullYear()} منصة Survsta لخدمات المساحة والجيوماتكس • جمهورية مصر العربية
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject: parts.subject, html };
}

export interface SendResult {
  sent: boolean;
  error?: string;
  warning?: string;
}

export async function sendPlatformEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[providerEmail] RESEND_API_KEY is not set; mail skipped.');
    return { sent: false, warning: 'لم يتم العثور على مفتاح RESEND_API_KEY في ملف البيئة. تم تسجيل الإجراء دون إرسال.' };
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Survsta Platform <notifications@survsta.com>';

  const first = await resend.emails.send({ from: fromAddress, to: [to], subject, html });
  if (!first.error) return { sent: true };

  console.warn('[providerEmail] Resend rejected the primary sender:', first.error.message);
  // The custom domain is not verified in every environment (notably a fresh VPS).
  if (first.error.message?.includes('domain') || first.error.name === 'validation_error') {
    const fallback = await resend.emails.send({
      from: 'Survsta Platform <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });
    if (!fallback.error) return { sent: true };
    return { sent: false, error: fallback.error.message || 'فشل إرسال البريد الإلكتروني' };
  }

  return { sent: false, error: first.error.message || 'فشل إرسال البريد الإلكتروني' };
}
