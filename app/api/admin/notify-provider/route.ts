import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';

interface NotifyRequestBody {
  providerEmail?: string;
  email?: string;
  providerName?: string;
  name?: string;
  actionType: 'suspended' | 'approved' | 'needs_revision' | 'restored' | 'welcome';
  userType?: 'provider' | 'client' | 'engineer';
  reason?: string;
  suspendedUntil?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequestBody = await request.json();
    const { actionType, reason, suspendedUntil, userType } = body;
    const recipientEmail = (body.providerEmail || body.email || '').trim();
    const recipientName = (body.providerName || body.name || 'شريكنا العزيز').trim();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'البريد الإلكتروني للطرف المستلم غير صالح' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[NotifyProviderAPI] RESEND_API_KEY is not defined in environment variables.');
      return NextResponse.json(
        { warning: 'لم يتم العثور على مفتاح RESEND_API_KEY في ملف البيئة. تم تسجيل الإجراء.' },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);

    // Build email content based on action type
    let subject = '';
    let badgeText = '';
    let badgeBg = '';
    let title = '';
    let mainMessage = '';
    let actionButtonText = '➕ أضف معداتك وأجهزتك المساحية الآن';
    let actionButtonUrl = 'https://survsta.com/provider/dashboard#equipment';
    let secondaryButtonText = 'الدخول إلى لوحة التحكم';
    let secondaryButtonUrl = 'https://survsta.com/provider/dashboard';

    switch (actionType) {
      case 'welcome':
        if (userType === 'client') {
          subject = '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس';
          badgeText = 'أهلاً بك في مجتمعنا';
          badgeBg = '#0284c7';
          title = `أهلاً ومرحباً بك معنا، ${recipientName} 👋`;
          mainMessage = `
            يسعدنا انضمامك إلى <strong>منصة Survsta</strong> — المنصة الرقمية الرائدة في مصر لربط المكاتب الاستشارية وشركات المقاولات بأكبر شبكة لمزودي المعدات والخدمات المساحية المعتمدة.<br/><br/>
            <strong>ماذا تقدم لك المنصة؟</strong>
            <ul style="margin: 12px 0; padding-right: 20px; line-height: 1.9; color: #334155;">
              <li><strong>تأجير وشراء الأجهزة المساحية:</strong> محطات رصد متكاملة (Total Stations)، أجهزة GPS / GNSS RTK، وموازين ليزرية بأعلى دقة وأفضل أسعار بالسوق.</li>
              <li><strong>مكاتب معتمدة وموثوقة:</strong> تواصل مباشر وفوري مع كبرى مكاتب وشركات المساحة في محافظتك بضمان جودة الأجهزة والمعايرة الدورية.</li>
              <li><strong>إدارة ذكية لطلباتك:</strong> تتبع طلبات الإيجار وفترات العمل والمستخلصات بكل سهولة من لوحة تحكم واحدة.</li>
            </ul>
            <p style="margin-top: 14px;">نتمنى لك تجربة استثنائية تسهم في إنجاز مشاريعك الهندسية بأعلى كفاءة ودقة.</p>
          `;
          actionButtonText = 'تصفح سوق الأجهزة والمعدات الآن';
          actionButtonUrl = 'https://survsta.com/equipment';
          secondaryButtonText = 'لوحة التحكم';
          secondaryButtonUrl = 'https://survsta.com/client/dashboard';
        } else {
          // Provider Welcome - Try fetching dynamic template from platform_settings
          let dynamicLoaded = false;
          try {
            const { data: settingRow } = await supabase
              .from('platform_settings')
              .select('setting_value')
              .eq('setting_key', 'template_welcome_email')
              .maybeSingle();

            if (settingRow?.setting_value) {
              const tpl = typeof settingRow.setting_value === 'string'
                ? JSON.parse(settingRow.setting_value)
                : settingRow.setting_value;

              subject = (tpl.subject || '').replace(/\{recipient_name\}|\{provider_name\}/g, recipientName) ||
                '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس';
              badgeText = tpl.badge_text || 'شريك معتمد جديد';
              badgeBg = tpl.badge_bg || '#0284c7';
              title = (tpl.title || '').replace(/\{recipient_name\}|\{provider_name\}/g, recipientName) ||
                `أهلاً ومرحباً بك معنا، ${recipientName} 👋`;

              const rawMsg = tpl.main_message || '';
              mainMessage = rawMsg
                .replace(/\{recipient_name\}|\{provider_name\}/g, recipientName)
                .replace(/\n\n/g, '<br/><br/>')
                .replace(/\n/g, '<br/>');

              actionButtonText = tpl.cta_text || '➕ أضف معداتك وأجهزتك المساحية الآن';
              actionButtonUrl = tpl.cta_url || 'https://survsta.com/provider/dashboard#equipment';
              secondaryButtonText = tpl.secondary_cta_text || 'الدخول إلى لوحة التحكم';
              secondaryButtonUrl = tpl.secondary_cta_url || 'https://survsta.com/provider/dashboard';
              dynamicLoaded = true;
            }
          } catch (dbErr) {
            console.warn('[NotifyProviderAPI] Failed reading dynamic welcome template from DB:', dbErr);
          }

          if (!dynamicLoaded) {
            subject = '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس';
            badgeText = 'أهلاً بك شريكنا العزيز';
            badgeBg = '#0284c7';
            title = `أهلاً ومرحباً بك معنا، ${recipientName} 👋`;
            mainMessage = `
              يسعدنا ويشرفنا انضمامك إلى <strong>منصة Survsta</strong> — المنظومة الرقمية الأولى والأشمل في مصر المتخصصة في خدمات وأجهزة المساحة والجيوماتكس.<br/><br/>
              <strong>آفاق جديدة لتنمية أعمال مكتبك المساحي:</strong>
              <ul style="margin: 12px 0; padding-right: 20px; line-height: 1.9; color: #334155;">
                <li><strong>عرض أجهزتك وتأجيرها:</strong> انشر معداتك المساحية لتصل إلى آلاف المهندسين وشركات المقاولات الباحثة عن أجهزة للإيجار يومياً.</li>
                <li><strong>حضور رسمي وتوثيق مهني:</strong> احجز مكان مكتبك في دليل المساحة المعتمد لتعزيز ثقة العملاء وزيادة العقود المباشرة.</li>
                <li><strong>فرص عمل واستقطاب كوادر:</strong> أعلن عن الشواغر الوظيفية في مكتبك واستقطب أكفأ مهندسي وفنيي المساحة.</li>
              </ul>
              <p style="margin-top: 14px;">ابدأ الآن بإضافة أول جهاز مساحي إلى كتالوج مكتبك لتفعيل ظهورك الفوري بالسوق وتلقي طلبات الحجز المباشرة.</p>
            `;
            actionButtonText = '➕ أضف معداتك وأجهزتك المساحية الآن';
            actionButtonUrl = 'https://survsta.com/provider/dashboard#equipment';
            secondaryButtonText = 'الدخول إلى لوحة التحكم';
            secondaryButtonUrl = 'https://survsta.com/provider/dashboard';
          }
        }
        break;

      case 'suspended':
        subject = '⚠️ إشعار هام: تم تعليق حساب المزود الخاص بك في منصة Survsta';
        badgeText = 'تنبيه إداري عاجل';
        badgeBg = '#ef4444';
        title = `عزيزنا الشريك: ${recipientName}`;
        mainMessage = `
          نود إعلامكم بأنه تم إيقاف وتجميد حساب المزود الخاص بكم في منصة <strong>Survsta</strong> مؤقتاً.<br/>
          ${reason ? `<div style="margin: 14px 0; padding: 12px; background: #fef2f2; border-right: 4px solid #ef4444; border-radius: 6px;"><strong>سبب الإجراء:</strong> ${reason}</div>` : ''}
          ${suspendedUntil ? `<p><strong>مدة الإيقاف حتى:</strong> ${new Date(suspendedUntil).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : '<p><strong>نوع الإيقاف:</strong> حظر إداري دائم لحين مراجعة الأوراق مع الإدارة.</p>'}
          خلال فترة الإيقاف، سيتم إخفاء كافة الأجهزة والمعدات والوظائف التابعة لمكتبكم من سوق المنصة حرصاً على موثوقية العمليات.
        `;
        actionButtonText = 'تواصل مع الدعم الفني';
        actionButtonUrl = 'https://survsta.com/contact';
        secondaryButtonText = '';
        secondaryButtonUrl = '';
        break;

      case 'approved':
        subject = '🎉 تهانينا! تم اعتماد حساب المزود الخاص بكم رسمياً في Survsta';
        badgeText = 'اعتماد رسمي معتمد';
        badgeBg = '#10b981';
        title = `أهلاً بك شريكنا المعتمد: ${recipientName}`;
        mainMessage = `
          يسعدنا إبلاغكم بأنه تمت مراجعة واعتماد أوراق مكتبكم المساحي بنجاح من قِبل إدارة منصة <strong>Survsta</strong>.<br/>
          حسابكم الآن نشط وموثق بالكامل، ويمكنكم رفع معداتكم واستقبال طلبات الإيجار والشراء المباشرة من شركات المقاولات والمهندسين في كافة محافظات مصر.
        `;
        actionButtonText = '➕ أضف معداتك وأجهزتك المساحية الآن';
        actionButtonUrl = 'https://survsta.com/provider/dashboard#equipment';
        secondaryButtonText = 'إدارة الأجهزة من لوحة التحكم';
        secondaryButtonUrl = 'https://survsta.com/provider/dashboard';
        break;

      case 'restored':
        subject = '✅ تم رفع الحظر واستعادة تفعيل حسابكم في Survsta';
        badgeText = 'تم استعادة الحساب';
        badgeBg = '#06b6d4';
        title = `شريكنا: ${recipientName}`;
        mainMessage = `
          نحيطكم علماً بأنه تم رفع الإيقاف عن حسابكم بنجاح. عادت أجهزتكم ووظائفكم للظهور بكامل طاقتها في السوق العام للدليل.
        `;
        actionButtonText = 'فتح لوحة المزود';
        actionButtonUrl = 'https://survsta.com/provider/dashboard';
        break;

      case 'needs_revision':
        subject = '📝 مطلوب استكمال وتعديل بيانات حسابكم في Survsta';
        badgeText = 'مطلوب مراجعة أوراق';
        badgeBg = '#f59e0b';
        title = `مرحباً ${recipientName}`;
        mainMessage = `
          أثناء مراجعة حسابكم المساحي، تبيّن وجود بعض البيانات أو المستندات الناقصة (مثل السجل التجاري، رخصة مزاولة المهنة، أو صور الأجهزة).<br/>
          ${reason ? `<div style="margin: 14px 0; padding: 12px; background: #fffbeb; border-right: 4px solid #f59e0b; border-radius: 6px;"><strong>ملاحظات الإدارة:</strong> ${reason}</div>` : ''}
          يرجى تسجيل الدخول وإعادة رفع الأوراق المطلوبة لنتمكن من تفعيل حسابكم فوراً.
        `;
        actionButtonText = 'تعديل البيانات الآن';
        actionButtonUrl = 'https://survsta.com/provider/verification';
        break;
    }

    const htmlContent = `
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
            .badge { display: inline-block; background: ${badgeBg}; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
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
              <div class="badge">${badgeText}</div>
              <div class="title">${title}</div>
              <div class="content">
                ${mainMessage}
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionButtonUrl}" class="btn" style="background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; border: 1px solid #38bdf8; display: inline-block;">${actionButtonText} ←</a>
                ${secondaryButtonUrl ? `
                <div style="margin-top: 14px;">
                  <a href="${secondaryButtonUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">${secondaryButtonText}</a>
                </div>` : ''}
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; pt: 16px;">
                هذه الرسالة آلية من إدارة منصة Survsta لشركائها المعتمدين. إذا كان لديك أي استفسار، يرجى الرد على هذا البريد أو التواصل عبر قنوات الدعم الرسمية.
              </p>
            </div>
            <div class="footer">
              جميع الحقوق محفوظة © ${new Date().getFullYear()} منصة Survsta لخدمات المساحة والجيوماتكس • جمهورية مصر العربية
            </div>
          </div>
        </body>
      </html>
    `;

    const sendRes = await resend.emails.send({
      from: 'Survsta Platform <notifications@survsta.com>',
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data: sendRes });
  } catch (err: any) {
    console.error('[NotifyProviderAPI] Error sending email:', err);
    return NextResponse.json({ error: err.message || 'فشل إرسال البريد الإلكتروني' }, { status: 500 });
  }
}
