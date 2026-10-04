#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Survsta SEO Content Engine - Google Gemini API Articles Generator
===================================================================
Generates 100% unique, authoritative, technically deep surveying articles in
Formal Modern Standard Arabic (فصحى) using Google Gemini API (gemini-1.5-flash / pro).

Key Features:
1. Strict Anti-Duplication Prompting: Zero boilerplate intros. Direct plunge into engineering principles.
2. Subcluster Specificity:
   - GNSS/RTK: RTCM 3.2, NTRIP, Base/Rover, PDOP < 2.0, multi-frequency (L1/L2/L5).
   - Total Station: EDM types (phase-shift vs time-of-flight), angular accuracy (1" vs 5"), Prism Constants, PPM equation.
   - Calibration: Collimator benches, Dual-axis compensators, ISO 17123 standards.
   - Surveyors/Jobs/Offices: Civil 3D, TIN surfaces, Breaklines, coordinate systems (ETM Red Belt).
3. Continuous Persistence: Saves .md files in survsta_articles/, updates generated_articles.json,
   and writes 'window.SURVSTA_ARTICLES = [...]' directly to articles_data.js after every article.
4. Rate Limiting: Includes automatic delay (default 4 seconds) to safely respect Google Free Tier (15 RPM).
"""

import os
import sys
import json
import re
import time
import argparse
import warnings
from pathlib import Path
from typing import Dict, List, Optional, Any

# Suppress version & cryptography deprecation warnings on older Python
warnings.filterwarnings("ignore")

# Ensure safe console output on Windows (CP1256 / UTF-8)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Attempt pandas import
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

# Attempt requests import for REST fallback
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Attempt google-generativeai SDK
try:
    import google.generativeai as genai
    HAS_GEMINI_SDK = True
except ImportError:
    HAS_GEMINI_SDK = False

# File Paths
BASE_DIR = Path(__file__).resolve().parent
DOCS_MARKETING_DIR = BASE_DIR / "docs_marketing"
EXCEL_PATH = DOCS_MARKETING_DIR / "SURVSTA_SEO_100_Topics_Mapped_to_Existing_Platform (2).xlsx"
MANIFEST_PATH = DOCS_MARKETING_DIR / "topics_manifest.json"
OUTPUT_DIR = BASE_DIR / "survsta_articles"
DASHBOARD_JSON_PATH = DOCS_MARKETING_DIR / "generated_articles.json"
DASHBOARD_JS_PATH = DOCS_MARKETING_DIR / "articles_data.js"


# =====================================================================
# Domain Knowledge Bank for Egyptian & Arab Geomatics
# =====================================================================

DOMAIN_KNOWLEDGE_BANK = {
    "Equipment_Total_Station": {
        "technical_focus": "قياس المسافات الكهروبصري EDM وزوايا التوجيه والتسامت",
        "core_concepts": [
            "تقنيات قياس المسافات الكهروبصري (EDM): إزاحة الطور (Phase-shift) للأهداف العاكسة مقابل زمن التحليق الليزري (Time-of-flight) للرصد بدون عاكس (Reflectorless)",
            "معايير دقة قياس الزوايا: 1 ثانية (1\") لمراقبة الهبوط والمنشآت الحرجة، 2\" للإنشاءات الهندسية، و 5\" للرفع الطبوغرافي العام",
            "ثابت العاكس (Prism Constant): الفرق بين العاكس القياسي (-30mm)، والعاكس الصفري (0mm)، وعواكس لايكا (+17.5mm) وأثر الخطأ الثابت على كامل شبكة النقاط",
            "معامل تصحيح الغلاف الجوي بالمليون PPM بمعادلة: PPM = 281.8 - (0.29065 * P / (1 + 0.00366 * T)) لضبط الضغط والحرارة",
            "معوض المحور الثنائي السائل (Dual-Axis Liquid Tilt Compensator) بمدى تصحيح ±3' إلى ±6'",
            "أخطاء التسامت والتسديد: خطأ تسامت المحور الأفقي (Collimation error 2c) وخطأ مؤشر الدائرة الرأسية (Vertical index error i)"
        ],
        "field_pitfalls": [
            "تجاهل ضبط قيمة ثابت العاكس (Prism Constant) في سوفتوير الجهاز مما يولد إزاحة خطية متكررة في جميع المسافات المقاسة",
            "التمركز والتسوية على حوامل غير مستقرة أو في تربة طينية رخوة تؤدي إلى انحراف فقاعة التسوية أثناء الدوران",
            "إهمال إدخال درجة الحرارة والضغط الجوي الفعلي للموقع في الأيام الحارة ذات التباين الحراري العالي"
        ]
    },
    "Equipment_GNSS": {
        "technical_focus": "الرصد الجيوديسي بالأقمار الصناعية وتقنيات التصحيح اللحظي RTK",
        "core_concepts": [
            "تتبع الأبراج المتعددة والترددات: GPS (L1/L2/L5), GLONASS (G1/G2), Galileo (E1/E5a/E5b), BeiDou (B1/B2/B3)",
            "بروتوكول التصحيحات اللحظية: بروتوكول RTCM 3.2 MSM7 عبر شبكات الإنترنت NTRIP Caster مقابل موجات الراديو UHF (410-470 MHz)",
            "إعدادات المحطة الثابتة والمتحركة (Base & Rover Setup) وتحديد زمن الانتقال (Latency < 1 sec)",
            "معامل تشتت الدقة الهندسي (PDOP < 2.0, GDOP, HDOP) وتأثير توزيع الأقمار على دقة الإحداثيات",
            "إسقاط الإحداثيات والتحويل الجيوديسي: التحويل من WGS84 إلى نظام الإسقاط المصري (ETM Red Belt / Purple Belt)",
            "حساب المنسوب الأرثومتري الحقيقي باستخدام نموذج الجيويد المحلي: H = h - N"
        ],
        "field_pitfalls": [
            "تسجيل نقاط الرفع المساحي تحت حالة الحل التقريبي (Float Solution) بدلاً من انتظار التثبيت الكامل (Fix Solution)",
            "الرصد بجوار واجهات الأبراج الزجاجية أو خطوط الجهد العالي مما يولد ظاهرة تعدد المسارات (Multipath) وانزلاق الطور (Cycle Slips)",
            "تجاوز أطوال خطوط القاعدة المسموح بها (Baseline > 15-20 km) في أجهزة RTK الفردية دون شبكات VRS"
        ]
    },
    "Calibration": {
        "technical_focus": "المعايرة المخبرية والميدانية المعتمدة للأجهزة المساحية",
        "core_concepts": [
            "معايير الجودة الدولية المعتمدة: ISO 17123-3 لقياس الزوايا، و ISO 17123-4 لقياس المسافات الكهروبصرية EDM",
            "فحص المحاذاة ومحاور الرؤية على منضدة الكوليماتور البصرية متعددة البؤر (Multi-Collimator Bench)",
            "معايرة خط القاعدة الميداني (EDM Baseline Calibration) ومقارنة القراءات بمسافات جيوديسية ميكرومترية",
            "معايرة مسامير وحساسات فقاعة قاعدة التثبيت (Tribrach Optical & Laser Plummet Calibration) بحساسية 20\"/2mm",
            "شهادات المعايرة المعتمدة: توثيق الانحراف المعياري، وحدود التسامح المقبولة، وتاريخ انتهاء الصلاحية المعتمد"
        ],
        "field_pitfalls": [
            "استخدام أجهزة منتهية شهادة المعايرة مما يؤدي إلى رفض استشاري المشروع لمستندات الاستلام والتقارير المساحية",
            "إجراء ضبط ميداني للمسامير دون توفير بيئة استقرار حراري للمعدة قبل القياس"
        ]
    },
    "Surveyors_Roads_Buildings": {
        "technical_focus": "الأعمال المساحية التنفيذية، التوقيع الإنشائي، والرفع الطبوغرافي",
        "core_concepts": [
            "توقيع المحاور الإنشائية والخوازيق بدقة مليمترية (±2mm) والربط مع شبكة نقاط التحكم الأولية (Primary Control Network)",
            "أعمال الميزانية الشبكية وحساب مكعبات الحفر والردم في برنامج Autodesk Civil 3D بنظام أسطح المقارنة TIN Surfaces",
            "تعريف خطوط الكسر (Breaklines) ومحددات الحدود (Boundaries) لضمان موثوقية النماذج الرقمية للأرض DTM",
            "مسح وتوقيع منحنيات الطرق الأفقية والرأسية ونقاط التماس (PI, PC, PT, Transition Spirals)",
            "الرفع المساحي النهائي للمنشآت (As-Built Survey) لمطابقة الواقع التنفيذي مع المخططات التصميمية المعتمدة"
        ],
        "field_pitfalls": [
            "الاعتماد على نقاط روبير موقعية (TBMs) دون إجراء فحص دوري للتأكد من عدم هبوطها أو إزاحتها بفعل آليات الموقع",
            "إهمال خطوط الكسر أثناء بناء السطح في Civil 3D مما يؤدي إلى أخطاء فادحة في كميات الحفر والردم بمستخلصات المقاولين"
        ]
    },
    "Offices_Legal_Cadastral": {
        "technical_focus": "الخدمات المساحية للمكاتب الهندسية، الرفع المساحي الرقمي، والشهر العقاري",
        "core_concepts": [
            "إجراءات الرفع المساحي الرقمي المعتمد وفقاً لأحكام القانون رقم 9 لسنة 2022 لتسجيل العقارات في مصر",
            "استخراج شهادات الإحداثيات والمطابقة والمخططات المعتمدة من الهيئة المصرية العامة للمساحة (ESA)",
            "إسقاط الملكيات على خرائط الحزام المساحي المعتمد (الحزام الأحمر ETM Red Belt / الحزام البنفسجي Purple Belt)",
            "اعتماد المكاتب الاستشارية لدى نقابة المهندسين المصرية لمراجعة وتوثيق الرفوعات الطبوغرافية",
            "تسليم تقارير تسليم النقاط المساحية الثابتة والمخططات بصيغ CAD / GIS (DWG, DXF, Shapefiles)"
        ],
        "field_pitfalls": [
            "التعامل مع مكاتب مساحية غير معتمدة أو غير مرخصة مما يتسبب في رفض المعاملة بمكاتب الشهر العقاري والجهات الحكومية",
            "الخلط بين النظام المرجعي القديم (Helmert 1906 / القديم) ونظام WGS84 دون تطبيق مصفوفة التحويل الجيوديسي المعتمدة"
        ]
    },
    "Training_Software": {
        "technical_focus": "تأهيل المهندسين، البرمجيات التخصصية، ومعالجة البيانات المساحية",
        "core_concepts": [
            "إتقان برنامج Autodesk Civil 3D للمساحين: إدارة نقاط COGO، بناء الأسطح TIN، ومسارات الطرق والمقاطع العرضية",
            "معالجة شبكات الرصد وضبط الترافرسات ببرامج Trimble Business Center (TBC) و Leica Geo Office / Infinity",
            "إدارة البيانات المكانية والخرائط الرقمية في برمجيات نظم المعلومات الجغرافية ArcGIS Pro و QGIS",
            "فهم واستيعاب مصفوفات الأخطاء وتوزيع انحرافات القفل الزاوي والضلعي قبل التصدير للعمل الميداني"
        ],
        "field_pitfalls": [
            "التركيز على واجهة البرنامج دون فهم الأسس الهندسية والجيوديسية وراء الخوارزميات الحسابية",
            "تصدير إحداثيات بدون تحديد دقيق للمرجع الجيوديسي ومنطقة الإسقاط الجغرافي"
        ]
    }
}


def clean_text(text: Any) -> str:
    """Strip whitespace and handle NaN/None."""
    if text is None or pd.isna(text):
        return ""
    return str(text).strip()


def slugify(text: str) -> str:
    """Convert text into a safe filename slug."""
    text = clean_text(text)
    main_part = text.split("|")[0].strip()
    slug = re.sub(r'[^\w\s-]', '', main_part, flags=re.UNICODE)
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')
    return slug[:60] if slug else "article"


# High-resolution Geomatics / Engineering stock images curated by Cluster & Subcluster
IMAGE_MAPPING = {
    "Total Station": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "GNSS": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80",
    "Calibration": "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
    "Maintenance": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "Offices": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    "Surveyors": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    "Training": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    "Civil 3D": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    "GIS": "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
    "Jobs": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    "Local SEO": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
    "Marketplace": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
    "Trust": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    "Default": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"
}

def resolve_featured_image(cluster: str, subcluster: str) -> str:
    c = str(cluster).strip()
    sc = str(subcluster).strip()
    if "GNSS" in sc or "GNSS" in c: return IMAGE_MAPPING["GNSS"]
    if "Total Station" in sc or "Total Station" in c: return IMAGE_MAPPING["Total Station"]
    if "Civil 3D" in sc: return IMAGE_MAPPING["Civil 3D"]
    if "GIS" in sc: return IMAGE_MAPPING["GIS"]
    if "Calibration" in c: return IMAGE_MAPPING["Calibration"]
    if "Maintenance" in c: return IMAGE_MAPPING["Maintenance"]
    if "Offices" in c: return IMAGE_MAPPING["Offices"]
    if "Training" in c: return IMAGE_MAPPING["Training"]
    if "Jobs" in c: return IMAGE_MAPPING["Jobs"]
    if "Local SEO" in c: return IMAGE_MAPPING["Local SEO"]
    if "Marketplace" in c: return IMAGE_MAPPING["Marketplace"]
    if "Trust" in c: return IMAGE_MAPPING["Trust"]
    if "Surveyors" in c: return IMAGE_MAPPING["Surveyors"]
    return IMAGE_MAPPING["Default"]

def build_social_summary(title: str, cluster: str, city: str) -> str:
    city_str = f"في {city}" if city and city != "مصر" else "في المشروعات الهندسية"
    return (
        f"دليل هندسي متخصص من منصة سيرفستا (Survsta) يغطي أدق التفاصيل والمعايير الفنية لـ: {title}. "
        f"يتضمن فحص الدقة والتفاوتات المسموح بها ميدانياً {city_str}، مع كيفية الوصول المباشر لأفضل الأجهزة والمكاتب المعتمدة."
    )


def load_topics_via_pandas(path: Path) -> List[Dict[str, Any]]:
    """Load topics from Excel file using pandas."""
    if not HAS_PANDAS or not path.exists():
        return []

    df = pd.read_excel(str(path))
    # Replace NaN with empty string
    df = df.fillna("")
    
    topics = []
    for _, row in df.iterrows():
        row_dict = {str(k).strip(): clean_text(v) for k, v in row.items()}
        if row_dict.get("ID"):
            topics.append(row_dict)
    return topics


def load_topics_from_manifest(path: Path) -> List[Dict[str, Any]]:
    """Load topics from pre-extracted JSON manifest fallback."""
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_all_topics() -> List[Dict[str, Any]]:
    """Load topics using pandas from Excel, falling back to manifest."""
    topics = []
    if EXCEL_PATH.exists() and HAS_PANDAS:
        try:
            topics = load_topics_via_pandas(EXCEL_PATH)
        except Exception as e:
            print(f"[!] Warning reading Excel via pandas: {e}")

    if not topics and MANIFEST_PATH.exists():
        topics = load_topics_from_manifest(MANIFEST_PATH)

    return topics


def select_knowledge_context(cluster: str, subcluster: str) -> Dict[str, Any]:
    """Retrieve tailored engineering terms and guidelines based on cluster/subcluster."""
    c_lower = cluster.lower()
    sc_lower = subcluster.lower()

    if "gnss" in sc_lower or "gps" in sc_lower or "rtk" in sc_lower:
        return DOMAIN_KNOWLEDGE_BANK["Equipment_GNSS"]
    elif "total station" in sc_lower or "توتال" in sc_lower:
        return DOMAIN_KNOWLEDGE_BANK["Equipment_Total_Station"]
    elif "calibration" in c_lower or "معايرة" in sc_lower or "صيانة" in c_lower:
        return DOMAIN_KNOWLEDGE_BANK["Calibration"]
    elif "office" in c_lower or "legal" in sc_lower or "شهادة" in sc_lower:
        return DOMAIN_KNOWLEDGE_BANK["Offices_Legal_Cadastral"]
    elif "training" in c_lower or "civil 3d" in sc_lower or "gis" in sc_lower:
        return DOMAIN_KNOWLEDGE_BANK["Training_Software"]
    else:
        return DOMAIN_KNOWLEDGE_BANK["Surveyors_Roads_Buildings"]


# =====================================================================
# Gemini Prompt Engineering (Step 1)
# =====================================================================

SYSTEM_INSTRUCTION = """أنت مهندس مساحة وجيوديسيا استشاري وخبير محتوى تقني وهندسي أول (Senior Geomatics Engineer & Technical SEO Specialist) بخبرة عملية تتجاوز 20 عاماً في المشروعات الهندسية والبنية التحتية في مصر والشرق الأوسط، وتكتب لصالح منصة "سيرفستا" (Survsta) - المنصة الرقمية الرائدة في سوق معدات وخدمات المساحة.

القواعد الفنية الصارمة والإلزامية لكتابة المقال:
1. قاعدة الحظر الصارم للمقدمات الإنشائية والمكررة (Zero Boilerplate Rule - صارم جداً):
   - يُمنع منعاً باتاً وقاطعاً البدء بعبارات إنشائية أو عامة مثل:
     * "إذا كنت تبحث عن..."
     * "في هذا المقال سنتناول..."
     * "تعتبر المساحة من أهم العلوم الهندسية..."
     * "تلعب أجهزة المساحة دوراً حيوياً..."
     * "مما لا شك فيه أن..."
   - يجب الدخول فوراً ومن الكلمة الأولى في صلب الموضوع: ابدأ بتحديد التحدي الهندسي الميداني الدقيق، أو الأساس الفيزيائي/الرياضي، أو المعيار الجيوديسي المنظم لهذه العملية.

2. التخصص الدقيق وفق التصنيف الفرعي (Subcluster Specificity):
   - إذا كان الموضوع يخص GNSS / RTK:
     * ناقش بروتوكول تصحيحات RTCM 3.2 وسيرفرات NTRIP Caster مقابل موجات الراديو UHF (410-470 MHz).
     * بين متطلبات المحطة الثابتة والمتحركة (Base & Rover) وتتبع الترددات المتعددة (L1/L2/L5).
     * اشرح دقة Fix مقابل Float، ومعامل تشتت الدقة الهندسي PDOP < 2.0، وتجنب انعكاس الإشارة Multipath.
     * اشرح التحويل الإحداثي إلى نظام الإسقاط المصري (ETM Red Belt / Purple Belt) وحساب الارتفاع الأرثومتري عبر الجيويد (H = h - N).
   - إذا كان الموضوع يخص Total Station:
     * ناقش تقنيات قياس المسافات الكهروبصري EDM (إزاحة الطور Phase-shift مقابل النبضات الليزرية السريعة Time-of-flight).
     * وضح دقة قياس الزوايا (1 ثانية للمراقبة الإنشائية، 2 ثانية للمباني، 5 ثوانٍ للمسح العام).
     * فصّل تأثير ثابت العاكس Prism Constant (-30mm, 0mm, +17.5mm) ومعادلة تصحيح الضغط والحرارة الجوية PPM.
     * بيّن فحص تسامت المحاور Collimation Error 2c ومعوض المحور الثنائي Dual-Axis Liquid Compensator.
   - إذا كان الموضوع يخص المعايرة ومراكز الصيانة (Calibration):
     * فصّل معايير الأيزو القياسية ISO 17123-3 للزوايا و ISO 17123-4 للمسافات EDM.
     * اشرح مناضد الكوليماتور البصرية متعددة البؤر وقواعد المعايرة الميدانية Geodetic Baselines.
     * بيّن معايرة فقاعة قاعدة التثبيت Tribrach والتأكد من شهادة المعايرة المعتمدة وسريانها.
   - إذا كان الموضوع يخص المساحين، الوظائف، التدريب، أو المكاتب:
     * فصّل سير العمل في Autodesk Civil 3D (إنشاء أسطح المقارنة TIN Surfaces، خطوط الكسر Breaklines، ميزانية شبكية وحساب كميات الحفر والردم).
     * اشرح الإجراءات الرسمية للرفع المساحي الرقمي طبقاً للقانون رقم 9 لسنة 2022 والشهر العقاري وهيئة المساحة المصرية (ESA).
     * وضّح اشتراطات استلام نقاط الروبير الموقعية TBMs ومصفوفة توزيع الأخطاء.

3. الهيكل الإلزامي للمقال (بتنسيق Markdown القياسي):
   - # العنوان الرئيسي للمقال (بدون مقدمات مكررة).
   - الفقرة الافتتاحية: دخول هندسي فوري ومباشر في جوهر المشكلة أو العملية المساحية.
   - ## العمق الهندسي والأسس الفنية والفيزيائية (تفصيل الآلية الفيزيائية، المعادلات، ونماذج الرصد).
   - ## بروتوكول العمل الميداني وقائمة الفحص الفني (Field Checklist) (خطوات عملية نقطية محددة بالأرقام).
   - ## الأخطاء الميدانية الشائعة ومعايير التفاوت والتحمل (Tolerances) (حدود الخطأ المسموح، التنبيهات لتفادي الخسائر).
   - ## التوجيه العملي المباشر عبر منصة سيرفستا (Survsta Actionable CTA) (ربط القارئ بالحل المتاح على منصة سيرفستا مع رابط التحويل المباشر).

4. لغة الكتابة:
   - لغة عربية فصحى هندسية متينة ورصينة تخاطب كبار مهندسي المساحة والمقاولين، مع كتابة المصطلح الإنجليزي المقابل للمفاهيم الأساسية."""


def build_gemini_prompt(topic: Dict[str, Any]) -> str:
    """Build the specific user prompt for Gemini."""
    knowledge = select_knowledge_context(topic.get("Cluster", ""), topic.get("Subcluster", ""))
    concepts_str = "\n- " + "\n- ".join(knowledge["core_concepts"])
    pitfalls_str = "\n- " + "\n- ".join(knowledge["field_pitfalls"])

    dest_url = topic.get("Primary Existing Destination") or topic.get("Recommended URL") or "/equipment"
    cta_text = topic.get("CTA") or "استكشف الخدمات والأجهزة على منصة سيرفستا"
    if "|" in cta_text:
        cta_text = cta_text.split("|")[0].strip()

    title = topic.get("Article Title", "").split("|")[0].strip()
    keyword = topic.get("Keyword", "").split("|")[0].strip()
    city = topic.get("City", "مصر").split("|")[0].strip()

    return f"""المطلوب كتابة مقال SEO تقني شامل وفريد 100% ومكتوب خصيصاً لهذا الموضوع دون أي تشابه أو تكرار:
- المعرف (ID): {topic.get('ID')}
- الكلمة المفتاحية المستهدفة: {keyword}
- عنوان المقال: {title}
- التصنيف (Cluster): {topic.get('Cluster')} | الفرع (Subcluster): {topic.get('Subcluster')}
- القصد البحثي (Intent): {topic.get('Search Intent')}
- النطاق الجغرافي / المدينة: {city}
- رابط الوجهة المستهدفة في المنصة: {dest_url}
- نص الدعوة للإجراء (CTA): {cta_text}
- مرحلة القمع التسويقي: {topic.get('Funnel Stage')}

المفاهيم الهندسية والفيزيائية الدقيقة الواجب معالجتها وتفصيلها في هذا المقال:
{concepts_str}

الأخطاء الميدانية وحدود التسامح التي يجب توضيحها للمهندسين والمقاولين:
{pitfalls_str}

شروط الخاتمة ورابط التحويل:
في القسم الأخير من المقال (تحت عنوان "## التوجيه العملي المباشر عبر منصة سيرفستا (Survsta)")، اشرح كيف توفر منصة سيرفستا الحل الأمثل لهذه المسألة، وضع رابطاً مباشراً بصيغة Markdown على النحو التالي:
👉 **[{cta_text}](https://survsta.com{dest_url})**

تذكر: ممنوع أي مقدمة إنشائية مكررة، ابدأ فوراً بالعنوان H1 متبوعاً بالتحليل الهندسي المباشر."""


# =====================================================================
# Gemini API Execution (SDK with REST Fallback & Retries)
# =====================================================================

def call_gemini_api(
    topic: Dict[str, Any],
    api_key: str,
    model_name: str = "gemini-1.5-flash",
    max_retries: int = 3
) -> Optional[str]:
    """Call Google Gemini API via google-generativeai SDK or REST API."""
    user_prompt = build_gemini_prompt(topic)

    for attempt in range(1, max_retries + 1):
        # 1. Official google-generativeai SDK (if GenerativeModel available)
        if HAS_GEMINI_SDK and hasattr(genai, "GenerativeModel"):
            try:
                genai.configure(api_key=api_key)
                # Configure model with system instruction
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=SYSTEM_INSTRUCTION,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 3000
                    }
                )
                response = model.generate_content(user_prompt)
                if response and response.text and len(response.text.strip()) > 300:
                    return response.text.strip()
            except Exception as e:
                err_str = str(e)
                print(f"      [!] Gemini SDK attempt {attempt}/{max_retries} failed: {err_str[:90]}")
                if "ResourceExhausted" in err_str or "429" in err_str:
                    wait_sec = attempt * 10
                    print(f"      [*] Rate limit reached. Backing off for {wait_sec}s...")
                    time.sleep(wait_sec)
                elif attempt < max_retries:
                    time.sleep(attempt * 4)

        # 2. REST API Fallback
        if HAS_REQUESTS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "system_instruction": {
                        "parts": [{"text": SYSTEM_INSTRUCTION}]
                    },
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": user_prompt}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 3000
                    }
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=90)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in text_parts)
                        if len(text.strip()) > 300:
                            return text.strip()
                elif resp.status_code == 429:
                    wait_sec = attempt * 12
                    print(f"      [!] Gemini REST 429 Rate Limit. Waiting {wait_sec}s...")
                    time.sleep(wait_sec)
                else:
                    print(f"      [!] Gemini REST attempt {attempt} failed ({resp.status_code}): {resp.text[:90]}")
                    if attempt < max_retries:
                        time.sleep(attempt * 4)
            except Exception as e:
                print(f"      [!] Gemini REST exception: {str(e)[:90]}")
                if attempt < max_retries:
                    time.sleep(attempt * 4)

    return None


def format_article_with_frontmatter(topic: Dict[str, Any], content: str) -> str:
    """Add standardized YAML frontmatter at the head of the article."""
    topic_id = topic.get("ID", "SV-000")
    title = topic.get("Article Title", "").split("|")[0].strip()
    keyword = topic.get("Keyword", "").split("|")[0].strip()
    cluster = topic.get("Cluster", "")
    subcluster = topic.get("Subcluster", "")
    intent = topic.get("Search Intent", "").split("|")[0].strip()
    city = topic.get("City", "مصر").split("|")[0].strip()
    target_url = topic.get("Primary Existing Destination") or topic.get("Recommended URL") or "/equipment"
    cta = topic.get("CTA", "").split("|")[0].strip()
    priority = topic.get("Priority", "P2")
    funnel = topic.get("Funnel Stage", "Consideration")
    publish_date = topic.get("Publish Date", "2026-10-01")
    slug = slugify(title)

    body = content.strip()

    frontmatter = f"""---
id: "{topic_id}"
title: "{title}"
slug: "{slug}"
keyword: "{keyword}"
cluster: "{cluster}"
subcluster: "{subcluster}"
search_intent: "{intent}"
city: "{city}"
target_url: "{target_url}"
cta_text: "{cta}"
priority: "{priority}"
funnel_stage: "{funnel}"
publish_date: "{publish_date}"
---

"""
    return frontmatter + body


def save_dashboard_files(database: List[Dict[str, Any]]):
    """Save both JSON and window.SURVSTA_ARTICLES JS bundle for instant dashboard use."""
    # 1. Save JSON
    with open(DASHBOARD_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    # 2. Save offline JS bundle (window.SURVSTA_ARTICLES = [...])
    with open(DASHBOARD_JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.SURVSTA_ARTICLES = " + json.dumps(database, ensure_ascii=False) + ";\n")


# =====================================================================
# Main Execution Pipeline
# =====================================================================

def parse_args():
    parser = argparse.ArgumentParser(description="Survsta 100 SEO Articles Google Gemini Generator")
    parser.add_argument("--api-key", type=str, default=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
                        help="Google Gemini API Key (or set $env:GEMINI_API_KEY)")
    parser.add_argument("--model", type=str, default="gemini-1.5-flash",
                        help="Gemini Model (default: gemini-1.5-flash, or gemini-1.5-pro)")
    parser.add_argument("--sleep", type=float, default=4.0,
                        help="Seconds to sleep between calls to respect 15 RPM limit (default: 4.0)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of articles to generate (e.g. --limit 5)")
    parser.add_argument("--id", type=str, default=None,
                        help="Generate for a specific topic ID (e.g. --id SV-001)")
    parser.add_argument("--cluster", type=str, default=None,
                        help="Filter by cluster name")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing generated files in survsta_articles/")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR),
                        help="Directory to save articles")
    return parser.parse_args()


def main():
    args = parse_args()
    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print(" Survsta SEO Automation: Google Gemini Geomatics Articles Generator")
    print("=" * 75)

    api_key = args.api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("\n[!] خطأ حرج: لم يتم العثور على مفتاح Gemini API Key!")
        print("    لتوليد المقالات عبر نموذج Google Gemini، يرجى إدخال المفتاح في PowerShell:")
        print('    $env:GEMINI_API_KEY="AIzaSy..."')
        print("    ثم إعادة تشغيل السكربت:")
        print("    python generate_gemini_articles.py --force\n")
        print("    أو تمرير المفتاح مباشرة كمعامل:")
        print('    python generate_gemini_articles.py --api-key "AIzaSy..." --force\n')
        sys.exit(1)

    # 1. Load Topics
    topics = load_all_topics()
    if not topics:
        print("[!] Error: No topics loaded. Please ensure Excel or topics_manifest.json exists.")
        sys.exit(1)
    print(f"[*] Successfully loaded {len(topics)} topics from master roadmap.")

    # 2. Filter topics if requested
    if args.id:
        topics = [t for t in topics if t.get("ID", "").strip().upper() == args.id.strip().upper()]
        if not topics:
            print(f"[!] Error: Topic ID '{args.id}' not found.")
            sys.exit(1)
        print(f"[*] Target ID specified: Generating for {topics[0]['ID']}.")

    if args.cluster:
        topics = [t for t in topics if args.cluster.lower() in t.get("Cluster", "").lower()]
        print(f"[*] Filtered by cluster '{args.cluster}': {len(topics)} topics remaining.")

    if args.limit and args.limit > 0:
        topics = topics[:args.limit]
        print(f"[*] Limiting run to {len(topics)} topics.")

    masked_key = api_key[:7] + "..." + api_key[-4:] if len(api_key) > 12 else "VALID_KEY"
    print(f"[*] Authenticated with Gemini API Key: {masked_key}")
    print(f"[*] Target Model: {args.model}")
    print(f"[*] Inter-call Sleep Delay: {args.sleep}s (Free Tier Safe: 15 RPM)")

    # Read existing database if present to preserve progress
    existing_db = {}
    if DASHBOARD_JSON_PATH.exists():
        try:
            with open(DASHBOARD_JSON_PATH, "r", encoding="utf-8") as f:
                old_list = json.load(f)
                for item in old_list:
                    if "id" in item:
                        existing_db[item["id"]] = item
        except Exception:
            pass

    generated_database = []
    success_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, topic in enumerate(topics, start=1):
        topic_id = topic.get("ID", f"SV-{idx:03d}")
        title = topic.get("Article Title", "").split("|")[0].strip()
        slug = slugify(title)
        filename = f"{topic_id}_{slug}.md"
        filepath = output_path / filename

        print(f"\n[{idx}/{len(topics)}] Processing {topic_id}: {title[:55]}...")

        if filepath.exists() and not args.force:
            print(f"    - Already exists. Loading existing file: {filename}")
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            skipped_count += 1
        else:
            print(f"    - [GEMINI LIVE] Querying {args.model} for unique content...")
            raw_article = call_gemini_api(
                topic,
                api_key=api_key,
                model_name=args.model
            )

            if raw_article:
                content = format_article_with_frontmatter(topic, raw_article)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"    [OK] Successfully generated & saved: {filename}")
                success_count += 1
            else:
                print(f"    [!] Failed to generate content for {topic_id} after retries.")
                failed_count += 1
                # If existing content available, keep it
                content = existing_db.get(topic_id, {}).get("markdown", "")
                if not content:
                    continue

            # Sleep between calls to respect rate limit (15 RPM)
            if idx < len(topics) and args.sleep > 0:
                time.sleep(args.sleep)

        # Store in combined database
        cluster_val = topic.get("Cluster", "")
        subcluster_val = topic.get("Subcluster", "")
        city_val = str(topic.get("City", "مصر")).split("|")[0].strip()
        art_title = str(topic.get("Article Title", "")).split("|")[0].strip()
        fb_title = str(topic.get("Facebook Title", "")).split("|")[0].strip()

        article_entry = {
            "id": topic_id,
            "filename": filename,
            "metadata": topic,
            "markdown": content,
            "featured_image": resolve_featured_image(cluster_val, subcluster_val),
            "social_title": fb_title if fb_title else art_title,
            "social_summary": build_social_summary(art_title, cluster_val, city_val)
        }
        generated_database.append(article_entry)
        existing_db[topic_id] = article_entry

        # Continuous saving: Update dashboard files on every single article!
        save_dashboard_files(list(existing_db.values()))

    # Final Save
    save_dashboard_files(list(existing_db.values()))
    print(f"\n[*] Dashboard database saved to: {DASHBOARD_JSON_PATH}")
    print(f"[*] Offline JS bundle saved to: {DASHBOARD_JS_PATH}")

    print("\n" + "=" * 75)
    print(" Execution Summary:")
    print(f" - Total Processed: {len(topics)}")
    print(f" - Generated Fresh: {success_count}")
    print(f" - Reused Existing: {skipped_count}")
    print(f" - Failed: {failed_count}")
    print(f" - Output Directory: {output_path.resolve()}")
    print("=" * 75)


if __name__ == "__main__":
    main()
