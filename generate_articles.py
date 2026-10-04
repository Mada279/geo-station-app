#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Survsta SEO Content Engine - Live OpenAI Geomatics Article Generator
=====================================================================
Generates 100% unique, authoritative, technically deep surveying articles in
Formal Modern Standard Arabic (فصحى) based on the Survsta SEO Master Roadmap.

Key Objectives:
1. Zero Boilerplate Enforcement: No generic introductions like "إذا كنت تبحث عن...".
   Every article plunges directly into domain-specific engineering principles.
2. Subcluster Specificity:
   - GNSS/RTK: RTCM 3.2, NTRIP, Base/Rover UHF (410-470 MHz), PDOP < 2.0, multi-frequency (L1/L2/L5).
   - Total Station: EDM types (phase-shift vs time-of-flight), angular accuracy (1" vs 5"), Prism Constants, PPM equation.
   - Calibration: Collimator benches, Dual-axis compensators, ISO 17123-3/4 standards.
   - Surveyors/Jobs/Offices: Civil 3D, TIN surfaces, Breaklines, Egyptian Survey Authority (ESA) & Law 9/2022.
3. Dynamic CTA: Integrates exact 'Primary Existing Destination' from the Excel row.
4. UI Integration: Saves individual .md files in survsta_articles/, updates generated_articles.json,
   and writes 'window.SURVSTA_ARTICLES = [...]' directly to articles_data.js for the Dark Mode dashboard.
"""

import os
import sys
import json
import re
import time
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any

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

# Attempt openpyxl import for direct Excel parsing
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

# Attempt requests import for REST API fallback
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Attempt openai import
try:
    from openai import OpenAI
    HAS_OPENAI_SDK = True
except ImportError:
    HAS_OPENAI_SDK = False

# Default paths
BASE_DIR = Path(__file__).resolve().parent
DOCS_MARKETING_DIR = BASE_DIR / "docs_marketing"
EXCEL_PATH = DOCS_MARKETING_DIR / "SURVSTA_SEO_100_Topics_Mapped_to_Existing_Platform (2).xlsx"
MANIFEST_PATH = DOCS_MARKETING_DIR / "topics_manifest.json"
OUTPUT_DIR = BASE_DIR / "survsta_articles"
DASHBOARD_JSON_PATH = DOCS_MARKETING_DIR / "generated_articles.json"
DASHBOARD_JS_PATH = DOCS_MARKETING_DIR / "articles_data.js"


# =====================================================================
# Specialized Domain Knowledge Bank for Egyptian & Arab Geomatics
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


def clean_text(text: str) -> str:
    """Strip unnecessary whitespace and normalize text."""
    if text is None:
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


def load_topics_from_excel(path: Path) -> List[Dict[str, Any]]:
    """Load topics directly from the SEO Excel file."""
    if not HAS_OPENPYXL or not path.exists():
        return []

    wb = openpyxl.load_workbook(str(path), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [clean_text(h) for h in rows[0]]
    topics = []

    for r in rows[1:]:
        if not r or not any(r):
            continue
        row_dict = {}
        for h, val in zip(headers, r):
            if h:
                row_dict[h] = clean_text(val) if val is not None else ""
        if row_dict.get("ID"):
            topics.append(row_dict)
    return topics


def load_topics_from_manifest(path: Path) -> List[Dict[str, Any]]:
    """Load topics from pre-extracted JSON manifest."""
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_all_topics() -> List[Dict[str, Any]]:
    """Load topics prioritizing Excel then JSON fallback."""
    topics = []
    if EXCEL_PATH.exists() and HAS_OPENPYXL:
        try:
            topics = load_topics_from_excel(EXCEL_PATH)
        except Exception as e:
            print(f"[!] Warning reading Excel: {e}")

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
# Upgraded LLM Prompts with Bulletproof Anti-Duplication Enforcement
# =====================================================================

SYSTEM_PROMPT = """أنت مهندس مساحة وجيوديسيا استشاري وخبير محتوى تقني وهندسي أول (Senior Geomatics Engineer & Technical SEO Specialist) بخبرة عملية تتجاوز 20 عاماً في المشروعات الهندسية والبنية التحتية في مصر والشرق الأوسط، وتكتب لصالح منصة "سيرفستا" (Survsta) - المنصة الرقمية الرائدة في سوق معدات وخدمات المساحة.

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
     * يجب تفصيل بروتوكول تصحيحات RTCM 3.2 وسيرفرات NTRIP Caster مقابل موجات الراديو UHF (410-470 MHz).
     * شرح متطلبات المحطة الثابتة والمتحركة (Base & Rover) وفرق الترددات (L1/L2/L5).
     * معايير الدقة: حل Fixed مقابل Float، ومعامل تشتت الدقة الهندسية PDOP < 2.0، وتجنب انعكاس الإشارة Multipath.
     * التحويل الإحداثي إلى نظام الإسقاط المصري (ETM Red Belt / Purple Belt) وحساب الارتفاع الأرثومتري عبر الجيويد (H = h - N).
   - إذا كان الموضوع يخص Total Station:
     * مناقشة تقنيات قياس المسافات الكهروبصري EDM (إزاحة الطور Phase-shift مقابل النبضات الليزرية السريعة Time-of-flight).
     * دقة قياس الزوايا (1 ثانية للمراقبة الإنشائية، 2 ثانية للمباني، 5 ثوانٍ للمسح العام).
     * تأثير ثابت العاكس Prism Constant (-30mm, 0mm, +17.5mm) ومعادلة تصحيح الضغط والحرارة الجوية PPM.
     * فحص تسامت المحاور Collimation Error ومعوض المحور الثنائي Dual-Axis Liquid Compensator.
   - إذا كان الموضوع يخص المعايرة ومراكز الصيانة (Calibration):
     * تفصيل معايير الأيزو القياسية ISO 17123-3 للزوايا و ISO 17123-4 للمسافات EDM.
     * مناضد الكوليماتور البصرية متعددة البؤر وقواعد المعايرة الميدانية Geodetic Baselines.
     * معايرة فقاعة قاعدة التثبيت Tribrach والتأكد من شهادة المعايرة المعتمدة وسريانها.
   - إذا كان الموضوع يخص المساحين، الوظائف، التدريب، أو المكاتب:
     * تفصيل سير العمل في Autodesk Civil 3D (إنشاء أسطح المقارنة TIN Surfaces، خطوط الكسر Breaklines، ميزانية شبكية وحساب كميات الحفر والردم).
     * الإجراءات الرسمية للرفع المساحي الرقمي طبقاً للقانون رقم 9 لسنة 2022 والشهر العقاري وهيئة المساحة المصرية (ESA).
     * اشتراطات استلام نقاط الروبير الموقعية TBMs ومصفوفة توزيع الأخطاء.

3. الهيكل الإلزامي للمقال (بتنسيق Markdown):
   - # العنوان الرئيسي للمقال (بدون مقدمات مكررة).
   - الفقرة الافتتاحية: دخول هندسي فوري ومباشر في جوهر المشكلة أو العملية المساحية.
   - ## العمق الهندسي والأسس الفنية والفيزيائية (تفصيل الآلية الفيزيائية، المعادلات، ونماذج الرصد).
   - ## بروتوكول العمل الميداني وقائمة الفحص الفني (Field Checklist) (خطوات عملية نقطية محددة بالأرقام).
   - ## الأخطاء الميدانية الشائعة ومعايير التفاوت والتحمل (Tolerances) (حدود الخطأ المسموح، التنبيهات لتفادي الخسائر).
   - ## التوجيه العملي المباشر عبر منصة سيرفستا (Survsta Actionable CTA) (ربط القارئ بالحل المتاح على منصة سيرفستا مع رابط التحويل المباشر).

4. لغة الكتابة:
   - لغة عربية فصحى هندسية متينة، رصينة، تستخدم المصطلحات الهندسية المتعارف عليها ميدانياً في مصر والوطن العربي مع ذكر المصطلح الإنجليزي المقابل أينما لزم."""


def build_user_prompt(topic: Dict[str, Any]) -> str:
    """Build a detailed, context-rich user prompt for a specific topic."""
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
- قرار الـ SEO: {topic.get('SEO Decision')}

المفاهيم الهندسية والفيزيائية الدقيقة الواجب معالجتها وتفصيلها في هذا المقال:
{concepts_str}

الأخطاء الميدانية وحدود التسامح التي يجب توضيحها للمهندسين والمقاولين:
{pitfalls_str}

شروط الخاتمة ورابط التحويل:
في القسم الأخير من المقال (تحت عنوان "## التوجيه العملي المباشر عبر منصة سيرفستا (Survsta)")، اشرح كيف توفر منصة سيرفستا الحل الأمثل لهذه المسألة، وضع رابطاً مباشراً بصيغة Markdown على النحو التالي:
👉 **[{cta_text}](https://survsta.com{dest_url})**

تذكر: ممنوع أي مقدمة إنشائية مكررة، ابدأ فوراً بالعنوان H1 متبوعاً بالتحليل الهندسي المباشر."""


def generate_article_with_ai(
    topic: Dict[str, Any],
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: Optional[str] = None,
    max_retries: int = 3
) -> Optional[str]:
    """Call OpenAI API with exponential backoff retry logic."""
    user_prompt = build_user_prompt(topic)

    for attempt in range(1, max_retries + 1):
        # 1. Try official SDK
        if HAS_OPENAI_SDK:
            try:
                client_kwargs = {"api_key": api_key}
                if base_url:
                    client_kwargs["base_url"] = base_url
                client = OpenAI(**client_kwargs)

                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2800
                )
                content = response.choices[0].message.content
                if content and len(content.strip()) > 300:
                    return content.strip()
            except Exception as e:
                err_str = str(e)
                print(f"      [!] OpenAI SDK attempt {attempt}/{max_retries} failed: {err_str[:90]}")
                if attempt < max_retries:
                    sleep_time = attempt * 5
                    print(f"      [*] Waiting {sleep_time}s before retry...")
                    time.sleep(sleep_time)

        # 2. HTTP Requests fallback
        if HAS_REQUESTS:
            try:
                endpoint = f"{base_url.rstrip('/')}/chat/completions" if base_url else "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2800
                }
                resp = requests.post(endpoint, json=payload, headers=headers, timeout=90)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    if content and len(content.strip()) > 300:
                        return content.strip()
                else:
                    print(f"      [!] HTTP attempt {attempt}/{max_retries} failed with status {resp.status_code}: {resp.text[:90]}")
                    if attempt < max_retries:
                        time.sleep(attempt * 5)
            except Exception as e:
                print(f"      [!] HTTP attempt {attempt}/{max_retries} error: {str(e)[:90]}")
                if attempt < max_retries:
                    time.sleep(attempt * 5)

    return None


def generate_deterministic_article(topic: Dict[str, Any]) -> str:
    """
    Deterministic High-Fidelity Engineering Generator (Mock / Fallback).
    Used ONLY when the user explicitly passes --mock.
    """
    cluster = topic.get("Cluster", "")
    subcluster = topic.get("Subcluster", "")
    topic_id = topic.get("ID", "SV-000")
    keyword = topic.get("Keyword", "").split("|")[0].strip()
    title = topic.get("Article Title", "").split("|")[0].strip()
    city = topic.get("City", "مصر").split("|")[0].strip()
    target_url = topic.get("Primary Existing Destination", topic.get("Recommended URL", "/equipment"))
    cta_text = topic.get("CTA", "").split("|")[0].strip() or "استكشف الخدمات والأجهزة المتاحة على سيرفستا"

    knowledge = select_knowledge_context(cluster, subcluster)
    pitfalls = knowledge["field_pitfalls"]

    formula_ortho = r"$$\text{Orthometric Height } H = h - N$$"
    formula_ppm = r"$$\text{PPM} = 281.8 - \left(\frac{0.29065 \times P}{1 + 0.00366 \times T}\right)$$"
    formula_traverse = r"$$\Delta \theta \le 2'' \sqrt{n}$$"

    if "GNSS" in subcluster or "GNSS" in cluster:
        intro_lead = f"تتطلب عمليات الرصد الجيوديسي عالية الدقة المعتمدة على تقنية {keyword} فهماً صارماً لسلوك إشارات الأقمار الصناعية ومعاملات تشتت الدقة الهندسية (PDOP)."
        deep_dive = f"""ترتكز دقة أجهزة GNSS RTK على معالجة الطور الناقل (Carrier Phase Tracking) لترددات L1 و L2 و L5 عبر الأبراج الأربعة الرئيسية (GPS, GLONASS, Galileo, BeiDou). عند استقبال الإشارات وتطبيق تصحيحات المحطة الثابتة (Base Station) عبر موجات UHF بترددات 410-470 MHz أو عبر سيرفرات NTRIP Caster ببروتوكول RTCM 3.2 MSM7، يتحقق الرصد الأفقي بدقة تصل إلى ±8 مم + 1 ppm ورأسياً ±15 مم + 1 ppm.

كما يُعد التحويل الإحداثي الجيوديسي من النظام العالمي WGS84 إلى نظام الإسقاط المصري (Egyptian Transverse Mercator - ETM Red Belt) ركيزة أساسية لتفادي أخطاء التشوه الإسقاطي وعوامل المقياس (Scale Factor k). ولتحقيق المناسيب الأرثومترية الدقيقة، يجب تطبيق نموذج الجيويد المحلي لحساب الفارق بين الارتفاع الإهليلجي والمنسوب الحقيقي:
{formula_ortho}
حيث يمثل h الارتفاع المقاس من السطح الإهليلجي و N حيود الجيويد (Geoid Undulation)."""

        field_checklist = """1. **فحص بيئة الرصد ومستوى الأفق:** التأكد من خلو زاوية الارتفاع (Mask Angle > 15°) من المعوقات الفيزيائية وعوازل الإشارة لتجنب ظاهرة انعكاس الموجات (Multipath).
2. **التحقق من حالة التثبيت (Fix Status):** حظر تسجيل أي نقطة مساحية قبل الحصول على حالة Fix كاملة بعدد أقمار لا يقل عن 18 قمراً وقيمة PDOP أقل من 1.8.
3. **معايرة فقاعة عكاز الرصد (Pole Bubble):** فحص حساسية واستقامة فقاعة التسوية الميكانيكية لعمود الرصد بدقة ±2 مم.
4. **الربط على نقاط الضبط الأرضية (GCPs):** فحص إحداثيات محطة الأساس على نقطة مثلثات معتمدة والتحقق من نقاط المراقبة المحلية."""

        tolerances_section = """- التفاوت الأفقي المسموح في الرفع المساحي التفصيلي: ±15 مم.
- التفاوت في التوقيع الإنشائي الدقيق: لا يتجاوز ±5 مم إلى ±10 مم.
- معايير انزلاق الطور (Cycle Slips): إعادة تهيئة المودم الراديوي في حال انقطاع تصحيح RTCM لأكثر من ثانيتين."""

    elif "Total Station" in subcluster or "Total Station" in cluster:
        intro_lead = f"تعتمد موثوقية قياس الزوايا والمسافات الكهروبصرية في منظومة {keyword} على الضبط الدقيق لمحاور الرؤية والتسامت ومعاملات الانكسار الجوي."
        deep_dive = f"""تتحدد دقة جهاز التوتال ستيشن (Total Station) بناءً على دقة قراءة الدائرة الأفقية والرأسية (1 ثانية، 2 ثانية، أو 5 ثوانٍ) وتقنية قياس المسافات الكهروبصري EDM (سواء بنظام إزاحة الطور Phase-shift أو النبضات الليزرية السريعة Time-of-flight). 

يخضع قياس المسافة لتصحيح التغيرات الجوية الميدانية عبر معامل التصحيح بالمليون (PPM) وفق المعادلة الجيوديسية:
{formula_ppm}
حيث P الضغط الجوي بوحدة هكتوباسكال (hPa) و T درجة الحرارة بالسليزيوس. يؤدي إغفال ضبط قيمة PPM وثابت العاكس (Prism Constant: مثل -30 مم للعواكس القياسية أو 0 مم أو +17.5 مم لعواكس لايكا) إلى توليد خطأ نظامي تراكمي ينتقل إلى كامل شبكة الإحداثيات المنفذة."""

        field_checklist = """1. **معايرة خطأ تسامت المحور (Collimation Test 2c):** رصد نقطة ثابتة في الوضعين المتعامدين للقرص (Face I & Face II) والتأكد من بقاء الخطأ دون 4 ثوانٍ.
2. **فحص خطأ مؤشر الدائرة الرأسية (Vertical Index Error i):** التحقق من قراءة زاوية السمت في الوضعين وحفظ قيمة التصحيح في ذاكرة الجهاز.
3. **فحص التسامت البصري/الليزري لقاعدة التثبيت (Tribrach):** تدوير القاعدة 180 درجة ومراقبة مطابقة مركز النقطة الأرضية.
4. **تثبيت الأرجل واستقرار التربة:** غرس رؤوس حامل التثبيت (Tripod) بعمق كافٍ في الأرض الطبيعية لتلافي هبوط الجهاز أثناء الرصد."""

        tolerances_section = f"""- تفاوت قفل المضلع الزاوي (Angular Misclosure): {formula_traverse} حيث n عدد زوايا المضلع.
- دقة قياس المسافات القياسية: 1 mm + 1.5 ppm في النمط العاكس الموشوري.
- الحد الأقصى لميل المحور الرأسي قبل تفعيل تحذير المعوض الإلكتروني (Dual-Axis Compensator): ±4 دقائق."""

    elif "Calibration" in cluster or "معايرة" in title:
        intro_lead = f"تُمثل المعايرة الدورية للمعدات المساحية المتوافقة مع معايير ISO 17123 صمام الأمان الفني لمنع حدوث انحرافات هندسية جسيمة في المشروعات القومية والإنشائية."
        deep_dive = """تجري معايرة الأجهزة الجيوديسية في مختبرات متخصصة ومجهزة بمناضد كوليماتور بصرية متعددة البؤر (Multi-Collimator Optical Benches) وقواعد معايرة المسافات (EDM Baseline Calibration). تنقسم الاختبارات إلى فحص التوازي التام بين محور التسديد الضوئي ومحور الشعاع الليزري ومحور الدوران الميكانيكي، وضبط حساسات الميل الإلكترونية ثنائية المحور (Dual-Axis Tilt Sensors) بدقة تصل إلى أعشار الثانية القوسية.

تتضمن المعايرة الهندسية فحص معاملات التوهين البصري وتوافق استجابة التردد الإلكتروني لبلورات الكوارتز المذبذبة المحددة لمسافات EDM، ويتم إصدار شهادة المعايرة الرسمية مرفقة بسجل الانحراف المعياري (Standard Deviation) لضمان اعتماد تقارير الاستلام من المكاتب الاستشارية وجهات الإشراف الهندسي."""

        field_checklist = """1. **التحقق من سلامة الأقفال الميكانيكية ومسامير الحركة البطيئة:** التأكد من عدم وجود أي بوش أو فراغ ميكانيكي أثناء التوجيه الدقيق.
2. **الفحص البصري للمستشعرات والعدسات:** خلو العدسات الشيئية والعينية من الخدوش أو التكثف الداخلي للرطوبة (تحقيق معيار IP66/IP67).
3. **فحص بطاريات الطاقة والشواحن:** قياس استقرار الفولتية تحت الحمل التشغيلي الكامل لمنع انخفاض الطاقة أثناء الرصد.
4. **مطابقة شهادة المعايرة:** فحص الرقم التسلسلي للمعدة وتاريخ الصلاحية وحدود الخطأ المسجلة."""

        tolerances_section = """- انحراف زاوية التسديد في الكوليماتور: يجب ألا يتجاوز ±2 ثانية قوسية.
- خطأ المقياس في مسافات EDM: لا يتجاوز ±1 مم على خط قاعدة 500 متر.
- صلاحية شهادة المعايرة القياسية: 6 أشهر إلى سنة كحد أقصى وفق متطلبات الجودة بالمشروع."""

    elif "Offices" in cluster or "مكتب" in keyword:
        intro_lead = f"يستلزم اختيار مكتب مساحة معتمد لتنفيذ أعمال الرفع الطبوغرافي والتوثيق العقاري في {city} الالتزام ببروتوكولات الهيئة المصرية العامة للمساحة ونقابة المهندسين."
        deep_dive = """يخضع العمل المساحي التعاقدي لمنظومة دقيقة تبدأ من التحقق من رخصة الاستشارات الهندسية المساحية المعتمدة، واعتماد مهندسي المساحة المقيدين بنقابة المهندسين. تتطلب المعاملات الرسمية — لاسيما تسجيل العقارات وفق أحكام القانون رقم 9 لسنة 2022 واستخراج شهادات المطابقة المساحية المؤمنة — إعداد رفوعات مساحية رقمية مرتبطة بالشبكة الجيوديسية الوطنية (ETM Red Belt).

يقوم المكتب المعتمد بتطبيق الميزانيات الشبكية الدقيقة وحساب كميات الحفر والردم وربط الإحداثيات بنقاط الروبير التابعة لهيئة المساحة، مع تصدير المخططات بصيغ كاد وبيانات جغرافية (DWG, DXF, Shapefiles) مدعمة بتقارير فنية موقعة ومعتمدة تضمن عدم تعرض ملفات الترخيص أو التسجيل للرفض."""

        field_checklist = """1. **التأكد من اعتماد المكتب وسجل القيد الهندسي:** التحقق من سريان ترخيص المكتب الاستشاري.
2. **فحص شهادات معايرة الأجهزة الميدانية:** التأكد من حيازة المكتب لأجهزة Total Station و GNSS سارية المعايرة.
3. **مراجعة بروتوكول تسليم النقاط المرجعية (TBMs):** تثبيت وحماية ما لا يقل عن 3 نقاط روبير خرسانية ثابتة بالموقع.
4. **التدقيق الإحداثي للمخططات:** مراجعة معاملات الإسقاط الجيوديسي وعدم استخدام إحداثيات افتراضية في المعاملات الرسمية."""

        tolerances_section = """- دقة الرفع المساحي للمباني السكنية والمنشآت: ±1 سم.
- تفاوت مساحات العقارات المسجلة بالشهر العقاري: لا يتعدى النسب المسموح بها قانوناً في الرفع الرقمي الموحد.
- اشتراطات تسليم الملفات: تسليم تقرير جيوديسي متكامل يتضمن شبكة الترافرس ومصفوفة الأخطاء."""

    else:
        intro_lead = f"تتطلب إدارة المشروعات الهندسية والتنفيذية التي تستهدف {keyword} التنسيق المتكامل بين دقة البيانات الميدانية وكفاءة البرمجيات الهندسية التحليلية."
        deep_dive = """يشمل العمل المساحي المتقدم دورة حياة هندسية تبدأ بالتخطيط المكتبي وإنشاء شبكات المثلثات ومضلعات الرصد الأولية، مروراً بعمليات الرفع والتوقيع الميداني، وانتهاءً بمعالجة السحب النقطية ونماذج الارتفاعات الرقمية في برمجيات مثل Autodesk Civil 3D و Trimble Business Center.

يتم اشتقاق أسطح المقارنة التضاريسية (Composite TIN Surfaces) لحساب مكعبات الحفر والردم بدقة عالية عبر مطابقة خطوط الكسر (Breaklines) ومحددات الحدود (Boundaries)، مما يمنع التقديرات العشوائية في مستخلصات المقاولين ويوفر دقة قياس معيارية تحت إشراف طواقم هندسية محترفة."""

        field_checklist = """1. **تحديد نطاق الأعمال ومعايير الدقة التعاقدية:** توثيق حدود التسامح المسموح بها في كراسة الشروط والمواصفات الفنية.
2. **فحص كفاءة الطاقم الهندسي الميداني:** التحقق من خبرات مهندس المساحة في التعامل مع برمجيات الربط الميداني وتنسيق البيانات.
3. **تأمين وحماية محطات الرصد:** تثبيت علامات حديدية أو خرسانية واضحة للنقاط المساحية الأساسية.
4. **التوثيق اليومي لدفاتر الرصد:** مراجعة القراءات والأرصاد وحفظ النسخ الاحتياطية من ملفات Raw Data يومياً."""

        tolerances_section = """- التفاوت المسموح في ميزانية تسوية الطرق: ±3 مم إلى ±5 مم.
- خطأ إغلاق الترافرس النسبي: لا يقل عن 1:10000 في الأعمال الهندسية الحضرية.
- اعتماد تقارير الكميات: استخدام طريقة متوسط المساحتين مع التحقق من سطوح TIN البرمجية."""

    article_md = f"""# {title}

{intro_lead}

## العمق الهندسي والأسس الفنية والفيزيائية
{deep_dive}

## بروتوكول العمل الميداني وقائمة الفحص الفني (Field Checklist)
{field_checklist}

## الأخطاء الميدانية الشائعة ومعايير التفاوت والتحمل (Tolerances)
{tolerances_section}

### تنبيهات هندسية هامة لتفادي هدر الموارد:
- **تنبيه رقم 1:** {pitfalls[0] if len(pitfalls) > 0 else 'عدم التحقق من دقة التمركز فوق النقطة المرجعية.'}
- **تنبيه رقم 2:** {pitfalls[1] if len(pitfalls) > 1 else 'إهمال تصحيحات الميل والحرارة في الأرصاد الطويلة.'}

## التوجيه العملي المباشر عبر منصة سيرفستا (Survsta)
توفر منصة **سيرفستا (Survsta)** المنظومة الرقمية الرائدة في مصر لربط الشركات الهندسية والمقاولين بأفضل الحلول المساحية المعتمدة، سواء كنت بحاجة إلى أجهزة مساحية عالية الدقة مفحوصة ومرفقة بشهادات المعايرة، أو تبحث عن مكاتب استشارية ومهندسي مساحة معتمدين لإنجاز مشروعاتك في {city} بكفاءة واحترافية.

> [!TIP]
> **ابدأ الآن عبر سيرفستا:** يمكنك فوراً الاطلاع على الأجهزة المتاحة وعروض الأسعار التنافسية أو طلب الطواقم الفنية المتخصصة عبر الرابط التالي:
> 
> 👉 **[{cta_text}](https://survsta.com{target_url})**
"""
    return article_md.strip()


def format_article_with_frontmatter(topic: Dict[str, Any], content: str) -> str:
    """Add standardized YAML frontmatter at the head of the article."""
    topic_id = topic.get("ID", "SV-000")
    title = topic.get("Article Title", "").split("|")[0].strip()
    keyword = topic.get("Keyword", "").split("|")[0].strip()
    cluster = topic.get("Cluster", "")
    subcluster = topic.get("Subcluster", "")
    intent = topic.get("Search Intent", "").split("|")[0].strip()
    city = topic.get("City", "مصر").split("|")[0].strip()
    target_url = topic.get("Primary Existing Destination", topic.get("Recommended URL", "/equipment"))
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
    # 1. JSON
    with open(DASHBOARD_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    # 2. Offline JS Bundle (zero CORS restrictions)
    with open(DASHBOARD_JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.SURVSTA_ARTICLES = " + json.dumps(database, ensure_ascii=False) + ";\n")


# =====================================================================
# Main Execution Pipeline
# =====================================================================

def parse_args():
    parser = argparse.ArgumentParser(description="Survsta 100 SEO Articles Live AI Generator")
    parser.add_argument("--api-key", type=str, default=os.getenv("OPENAI_API_KEY"), help="OpenAI API Key (or set $env:OPENAI_API_KEY)")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="LLM Model to use (default: gpt-4o-mini)")
    parser.add_argument("--base-url", type=str, default=None, help="Custom API Base URL")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of articles to generate (e.g. --limit 5)")
    parser.add_argument("--id", type=str, default=None, help="Generate for a specific topic ID (e.g. --id SV-001)")
    parser.add_argument("--cluster", type=str, default=None, help="Filter by cluster name")
    parser.add_argument("--mock", action="store_true", help="Force offline mock mode without calling OpenAI API")
    parser.add_argument("--force", action="store_true", help="Overwrite existing generated files in survsta_articles/")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR), help="Directory to save articles")
    return parser.parse_args()


def main():
    args = parse_args()
    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print(" Survsta SEO Automation: Live High-Authority Geomatics Articles Generator")
    print("=" * 75)

    # Check API key requirement
    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key and not args.mock:
        print("\n[!] خطأ حرج: لم يتم العثور على مفتاح OpenAI API Key!")
        print("    لتوليد المقالات الحية عالية الجودة، يرجى تعيين المفتاح في بيئة PowerShell عبر الأمر:")
        print('    $env:OPENAI_API_KEY="sk-..."')
        print("    ثم إعادة تشغيل الأمر:")
        print("    python generate_articles.py --force\n")
        print("    أو تمرير المفتاح مباشرة كمعامل:")
        print('    python generate_articles.py --api-key "sk-..." --force\n')
        print("    (ملاحظة: إذا كنت ترغب عمداً بتوليد قوالب تجريبية بدون مفتاح، أضف العلم --mock)")
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

    # Determine generation mode
    if args.mock:
        print("[*] Mode: Offline Deterministic Mock Mode (--mock enabled).")
    else:
        print(f"[*] Mode: LIVE OpenAI Generation using model: '{args.model}'")
        masked_key = api_key[:7] + "..." + api_key[-4:] if api_key and len(api_key) > 12 else "VALID_KEY"
        print(f"[*] Authenticated with API Key: {masked_key}")

    # Process topics
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
            content = None
            if not args.mock and api_key:
                print(f"    - [AI LIVE] Generating high-authority article via OpenAI ({args.model})...")
                raw_article = generate_article_with_ai(
                    topic,
                    api_key=api_key,
                    model=args.model,
                    base_url=args.base_url
                )
                if raw_article:
                    content = format_article_with_frontmatter(topic, raw_article)
                else:
                    print(f"    [!] Failed to generate live article for {topic_id} after retries.")
                    failed_count += 1
                    continue
            else:
                raw_article = generate_deterministic_article(topic)
                content = format_article_with_frontmatter(topic, raw_article)

            # Write markdown file
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"    [OK] Successfully saved markdown to: {filename}")
            success_count += 1

        # Store in combined database for dashboard consumption
        cluster_val = topic.get("Cluster", "")
        subcluster_val = topic.get("Subcluster", "")
        city_val = topic.get("City", "مصر").split("|")[0].strip()
        art_title = topic.get("Article Title", "").split("|")[0].strip()
        fb_title = topic.get("Facebook Title", "").split("|")[0].strip()

        generated_database.append({
            "id": topic_id,
            "filename": filename,
            "metadata": topic,
            "markdown": content,
            "featured_image": resolve_featured_image(cluster_val, subcluster_val),
            "social_title": fb_title if fb_title else art_title,
            "social_summary": build_social_summary(art_title, cluster_val, city_val)
        })

        # Progressively update dashboard files every 5 articles so progress is immediately saved
        if idx % 5 == 0 or idx == len(topics):
            save_dashboard_files(generated_database)

    # Final save for the Single Page Application Dashboard
    save_dashboard_files(generated_database)
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
