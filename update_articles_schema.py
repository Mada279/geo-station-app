#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Survsta SEO Schema Upgrade Script
=================================
Enriches all 100 articles with:
1. `featured_image`: Dedicated high-res geomatics/engineering stock banner URL.
2. `social_title`: Clean copy title optimized for Facebook/LinkedIn sharing.
3. `social_summary`: Clean social media post copy / summary in Arabic.
Saves to generated_articles.json and articles_data.js.
"""

import os
import sys
import json
from pathlib import Path

# Safe console output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
DOCS_MARKETING_DIR = BASE_DIR / "docs_marketing"
JSON_PATH = DOCS_MARKETING_DIR / "generated_articles.json"
JS_PATH = DOCS_MARKETING_DIR / "articles_data.js"

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

    if "GNSS" in sc or "GNSS" in c:
        return IMAGE_MAPPING["GNSS"]
    if "Total Station" in sc or "Total Station" in c:
        return IMAGE_MAPPING["Total Station"]
    if "Civil 3D" in sc:
        return IMAGE_MAPPING["Civil 3D"]
    if "GIS" in sc:
        return IMAGE_MAPPING["GIS"]
    if "Calibration" in c:
        return IMAGE_MAPPING["Calibration"]
    if "Maintenance" in c:
        return IMAGE_MAPPING["Maintenance"]
    if "Offices" in c:
        return IMAGE_MAPPING["Offices"]
    if "Training" in c:
        return IMAGE_MAPPING["Training"]
    if "Jobs" in c:
        return IMAGE_MAPPING["Jobs"]
    if "Local SEO" in c:
        return IMAGE_MAPPING["Local SEO"]
    if "Marketplace" in c:
        return IMAGE_MAPPING["Marketplace"]
    if "Trust" in c:
        return IMAGE_MAPPING["Trust"]
    if "Surveyors" in c:
        return IMAGE_MAPPING["Surveyors"]
    
    return IMAGE_MAPPING["Default"]

def clean_arabic_title(raw: str) -> str:
    if not raw:
        return ""
    return str(raw).split("|")[0].strip()

def build_social_summary(title: str, cluster: str, subcluster: str, city: str, dest: str) -> str:
    city_str = f"في {city}" if city and city != "مصر" else "في المشروعات الهندسية"
    return (
        f"دليل هندسي متخصص من منصة سيرفستا (Survsta) يغطي أدق التفاصيل والمعايير الفنية لـ: {title}. "
        f"يتضمن فحص الدقة والتفاوتات المسموح بها ميدانياً {city_str}، مع كيفية الوصول المباشر لأفضل الأجهزة والمكاتب المعتمدة."
    )

def main():
    if not JSON_PATH.exists():
        print(f"[!] File not found: {JSON_PATH}")
        sys.exit(1)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        articles = json.load(f)

    print(f"[*] Processing {len(articles)} articles to enrich schema...")

    for item in articles:
        meta = item.get("metadata", {})
        cluster = meta.get("Cluster", "")
        subcluster = meta.get("Subcluster", "")
        city = clean_arabic_title(meta.get("City", "مصر"))
        dest = meta.get("Primary Existing Destination") or meta.get("Recommended URL") or "/equipment"
        
        # 1. Featured Image
        featured_image = resolve_featured_image(cluster, subcluster)
        item["featured_image"] = featured_image

        # 2. Social Title
        fb_title = clean_arabic_title(meta.get("Facebook Title", ""))
        article_title = clean_arabic_title(meta.get("Article Title", ""))
        social_title = fb_title if fb_title else article_title
        item["social_title"] = social_title

        # 3. Social Summary
        social_summary = build_social_summary(article_title, cluster, subcluster, city, dest)
        item["social_summary"] = social_summary

    # Write back to JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"[OK] Saved updated JSON: {JSON_PATH}")

    # Write back to articles_data.js
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.SURVSTA_ARTICLES = " + json.dumps(articles, ensure_ascii=False) + ";\n")
    print(f"[OK] Saved updated JS bundle: {JS_PATH}")

if __name__ == "__main__":
    main()
