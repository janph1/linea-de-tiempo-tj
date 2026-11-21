import json
import os
import re
import pymupdf

PDF_PATH = "LÍNEA DE TIEMPO Tj 5.5 x 9 (1).pdf"
OUT_JSON = os.path.join("server", "src", "data", "tjCards.json")
OUT_IMG_DIR = os.path.join("client", "public", "cards")

os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
os.makedirs(OUT_IMG_DIR, exist_ok=True)


def extract_page_lines(page):
    blocks = page.get_text("dict", flags=0)["blocks"]
    lines_info = []
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                txt = "".join(s["text"] for s in l["spans"]).strip()
                if txt:
                    y0 = round(l["bbox"][1], 1)
                    sz = round(l["spans"][0]["size"], 1)
                    lines_info.append((y0, sz, txt))
    dedup = []
    for y0, sz, txt in sorted(lines_info, key=lambda x: (x[0], -x[1])):
        if any(t == txt and abs(y - y0) < 3.5 for y, _, t in dedup):
            continue
        dedup.append((y0, sz, txt))
    return dedup


def classify_era(year, title, hint):
    text = f"{title} {hint}".lower()
    if "chile" in text or "mapudung" in text or "puente alto" in text:
        return "Hito en Chile"
    if year < 1919:
        return "Primeros Años"
    if year < 1950:
        return "Expansión y Radio"
    if year < 1995:
        return "Crecimiento Mundial"
    return "Era Digital"


def main():
    doc = pymupdf.open(PDF_PATH)
    print(f"Abriendo PDF ({len(doc)} páginas)...")

    cards = []
    # Páginas 1 a 120 (índices 0..119) son 60 cartas (par: reverso con año, anverso con '?')
    # Clip exacto de la ilustración rectangular dentro de cada carta (5.5x9 cm -> 156x255 pt)
    art_clip = pymupdf.Rect(9.5, 27.5, 146.5, 157.0)

    for idx in range(0, min(120, len(doc)), 2):
        card_num = idx // 2 + 1
        card_id = f"tj-{card_num:02d}"
        page = doc[idx]  # Reverso (contiene año, título, reseña e ilustración)

        lines = extract_page_lines(page)

        year = None
        title_parts = []
        hint_parts = []

        for y0, sz, txt in lines:
            if y0 < 25 and re.fullmatch(r"\d{4}", txt):
                year = int(txt)
            elif y0 > 234 or "LÍNEA DE TIEMPO TESTIGOS" in txt.upper():
                continue
            elif sz >= 10.5 and y0 >= 145:
                title_parts.append(txt)
            elif y0 >= 175:
                hint_parts.append(txt)

        title = " ".join(title_parts).strip()
        hint = " ".join(hint_parts).strip()

        if year is None or not title:
            raise ValueError(f"Error extrayendo carta {card_id} (pág {idx+1}): year={year}, title={title!r}, lines={lines}")

        # Exportar ilustración recortada en alta calidad (JPEG ligero para web)
        img_filename = f"{card_id}.jpg"
        img_path = os.path.join(OUT_IMG_DIR, img_filename)
        pix = page.get_pixmap(clip=art_clip, dpi=180)
        pix.save(img_path, jpg_quality=85)

        cards.append(
            {
                "id": card_id,
                "title": title,
                "year": year,
                "category": classify_era(year, title, hint),
                "hint": hint,
                "imageUrl": f"/cards/{img_filename}",
                "imageKeyword": card_id,
                "deck": "tj",
                "footerText": "LÍNEA DE TIEMPO TESTIGOS DE JEHOVÁ",
            }
        )

    # Extraer también la portada (página 121) para usar en el lobby / dorso del mazo
    if len(doc) >= 121:
        cover_pix = doc[120].get_pixmap(dpi=180)
        cover_pix.save(os.path.join(OUT_IMG_DIR, "tj-cover.jpg"), jpg_quality=88)

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)

    print(f"Extraídas {len(cards)} cartas correctamente en {OUT_JSON}")
    print(f"Rango de años: {min(c['year'] for c in cards)} - {max(c['year'] for c in cards)}")
    # Verificar que ninguna tiene reseña vacía
    empty_hints = [c["id"] for c in cards if not c["hint"]]
    if empty_hints:
        print("ADVERTENCIA: cartas sin reseña:", empty_hints)
    else:
        print("Todas las 60 cartas tienen año, título, reseña e ilustración verificados.")


if __name__ == "__main__":
    main()
