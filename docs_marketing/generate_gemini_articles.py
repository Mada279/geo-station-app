import os
import time
import json
import argparse
from pathlib import Path
import pandas as pd
import google.generativeai as genai

# إعداد مفتاح API
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ خطأ: لم يتم العثور على مفتاح GEMINI_API_KEY في النظام.")
    exit(1)

genai.configure(api_key=api_key)

# استخدام الطريقة الآمنة لاستدعاء النموذج في الإصدارات المتاحة
try:
    model = genai.GenerativeModel('gemini-pro')
except Exception:
    # بديل في حال لم يتوفر
    model = genai.GenerativeModel('models/gemini-pro')

# القاموس الهندسي الإلزامي لمنع التكرار (Zero-Boilerplate)
DEPTH_BLOCK = {
    "GNSS": "بروتوكول RTCM 3.2، سيرفرات NTRIP Caster، موجات UHF 410-470 MHz، إعدادات Base/Rover، دقة Fix vs Float، معامل PDOP < 2.0، التحويل لإسقاط ETM Red Belt، الارتفاع الأرثومتري H=h-N",
    "Total Station": "قياس المسافات EDM (إزاحة الطور Phase-shift أو Time-of-flight)، دقة الزوايا (1\" vs 5\")، ثابت العاكس Prism Constant، تصحيح الغلاف الجوي PPM، معوض المحور الثنائي Dual-Axis Compensator",
    "Calibration": "معايير ISO 17123-3 و ISO 17123-4، مناضد الكوليماتور متعددة البؤر، الانحراف المعياري، معايرة قواعد التثبيت Tribrach",
    "Surveyors": "برمجيات Civil 3D، أسطح المقارنة TIN Surfaces، خطوط الكسر Breaklines، حساب مكعبات الحفر والردم، اشتراطات هيئة المساحة المصرية (ESA)",
    "Roads": "ميزانية تسوية الطرق، منحنيات الانتقال، حساب سمك طبقات الإحلال والرصف، مقاطع عرضية وطولية",
    "Buildings": "رفع As-built، توقيع المحاور والأعمدة، نقل المناسيب (روبير)، أجهزة الليزر الدقيقة",
    "General": "الدقة المكانية، ضبط الجودة، التسامت والميل، التقارير المساحية المعتمدة"
}

def build_prompt(row):
    subcluster = str(row.get("Subcluster", "General"))
    city = str(row.get("City", "مصر")).split("|")[0].strip()
    keyword = str(row.get("Keyword", "")).split("|")[0].strip()
    title = str(row.get("Article Title", ""))
    cta = str(row.get("CTA", "اضغط هنا"))
    dest = str(row.get("Primary Existing Destination", "/"))
    
    depth_terms = DEPTH_BLOCK.get(subcluster, DEPTH_BLOCK["General"])
    
    prompt = f"""
أنت مهندس مساحة خبير واستشاري تقني لمنصة Survsta في مصر.
المطلوب كتابة مقال SEO تقني وعميق باللغة العربية الفصحى.

# معلومات المقال:
- العنوان: {title}
- الكلمة المفتاحية: {keyword}
- المدينة/الموقع: {city}

# قواعد حاسمة (تجاهلها سيؤدي لرفض المقال):
1. **بدون مقدمات إنشائية (Zero-Boilerplate):** يُمنع تماماً البدء بعبارات مثل "إذا كنت تبحث عن" أو "تعتبر المساحة مهمة". ابدأ المقال فوراً من الكلمة الأولى بحقيقة هندسية أو مبدأ تقني قوي يخص الموضوع.
2. **العمق التقني:** يجب أن يتضمن المقال شرحاً باستخدام هذه المصطلحات الهندسية: {depth_terms}.
3. **الارتباط الواقعي:** اذكر مثالاً عملياً لمشروع في ({city}) يوضح كيفية تطبيق هذه التقنية.
4. **التنسيق:** استخدم Markdown، عناوين (H2, H3)، وقوائم نقطية. لا تكتب عنوان H1 لأننا نملكه بالفعل.
5. **الخاتمة (CTA):** يجب أن يختتم المقال بجملة تشجيعية تتضمن هذا الرابط الحرفي (بدون اختراع روابط أخرى):
[{cta}](https://survsta.com{dest})
"""
    return prompt

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="عدد المقالات للتجربة")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    excel_file = "SURVSTA_SEO_100_Topics_Mapped_to_Existing_Platform (2).xlsx"
    if not os.path.exists(excel_file):
        print(f"❌ خطأ: ملف الإكسيل '{excel_file}' غير موجود في المجلد الحالي!")
        exit(1)

    print(f"📂 جاري قراءة البيانات من ملف الإكسيل...")
    df = pd.read_excel(excel_file).fillna("")
    rows = df.to_dict(orient="records")
    
    rows_to_process = rows[:args.limit] if args.limit > 0 else rows
    print(f"🚀 بدء توليد {len(rows_to_process)} مقال باستخدام Google Generative AI...")

    generated_articles = []
    output_file = Path("articles_data.js")

    for i, row in enumerate(rows_to_process, 1):
        print(f"⏳ جاري معالجة [{i}/{len(rows_to_process)}]: {row.get('ID', '')}...")
        prompt = build_prompt(row)
        
        try:
            response = model.generate_content(prompt)
            markdown_content = response.text
            
            article_data = {
                "id": row.get("ID", f"SV-{i}"),
                "metadata": row,
                "markdown": markdown_content
            }
            generated_articles.append(article_data)
            
            js_content = f"window.SURVSTA_ARTICLES = {json.dumps(generated_articles, ensure_ascii=False, indent=2)};"
            output_file.write_text(js_content, encoding="utf-8")
            print(f"✅ تم بنجاح.")
            
            if i < len(rows_to_process):
                time.sleep(4)
                
        except Exception as e:
            print(f"❌ خطأ أثناء التوليد: {e}")
            time.sleep(10)

    print(f"🎉 اكتمل العمل! تم حفظ المقالات في {output_file.name}")

if __name__ == "__main__":
    main()