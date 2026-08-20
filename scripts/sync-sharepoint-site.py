#!/usr/bin/env python3
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

SITE_ID = "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17"
LIBRARY_NAME = "MIDIAS_SITE"
CMS_ROOT = "CMS_SITE"
CMS_DATA = f"{CMS_ROOT}/site-data.json"
CMS_IMAGES = f"{CMS_ROOT}/imagens"
PUBLIC_DATA = pathlib.Path("site-data/publicacoes-publicas.json")
PUBLIC_IMAGES = pathlib.Path("imagens/publicacoes")
GRAPH = "https://graph.microsoft.com/v1.0"


def graph_token():
    token = os.environ.get("GRAPH_TOKEN", "").strip()
    if not token:
        raise RuntimeError("GRAPH_TOKEN ausente")
    return token


def request_json(url):
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {graph_token()}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def request_bytes(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {graph_token()}"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def encoded_path(path):
    return urllib.parse.quote(path, safe="/")


def find_library_drive():
    data = request_json(f"{GRAPH}/sites/{SITE_ID}/drives?$select=id,name,webUrl")
    for drive in data.get("value", []):
        if drive.get("name") == LIBRARY_NAME:
            return drive["id"]
    raise RuntimeError(f"Biblioteca {LIBRARY_NAME} não encontrada")


def load_cms_data(drive_id):
    url = f"{GRAPH}/drives/{drive_id}/root:/{encoded_path(CMS_DATA)}:/content"
    try:
        raw = request_bytes(url)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            print("CMS SharePoint ainda não provisionado; nada a sincronizar.")
            return None
        raise
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise RuntimeError("CMS_SITE/site-data.json inválido")
    if not isinstance(data.get("publicacoes", []), list):
        raise RuntimeError("Campo publicacoes inválido no CMS")
    return data


def normalize_public_data(data):
    result = dict(data)
    result["origem"] = "SHAREPOINT_CMS"
    result["cache"] = "sincronizado automaticamente pelo GitHub Actions"
    result.setdefault("home", {})
    result.setdefault("publicacoes", [])
    result.setdefault("banners", [])
    result.setdefault("avisos", [])
    result.setdefault("destaques", [])
    return result


def write_public_data(data):
    PUBLIC_DATA.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    PUBLIC_DATA.write_text(text, encoding="utf-8")


def sync_images(drive_id, data):
    PUBLIC_IMAGES.mkdir(parents=True, exist_ok=True)
    names = set()
    for item in data.get("publicacoes", []):
        image = str(item.get("imagem") or "").strip()
        prefix = "/imagens/publicacoes/"
        if image.startswith(prefix):
            name = pathlib.PurePosixPath(image).name
            if name:
                names.add(name)

    copied = 0
    missing = []
    for name in sorted(names):
        target = PUBLIC_IMAGES / name
        source_path = f"{CMS_IMAGES}/{name}"
        url = f"{GRAPH}/drives/{drive_id}/root:/{encoded_path(source_path)}:/content"
        try:
            content = request_bytes(url)
        except urllib.error.HTTPError as exc:
            if exc.code == 404 and target.exists():
                continue
            if exc.code == 404:
                missing.append(name)
                continue
            raise
        if not target.exists() or target.read_bytes() != content:
            target.write_bytes(content)
            copied += 1

    if missing:
        raise RuntimeError("Imagens referenciadas ausentes no SharePoint: " + ", ".join(missing))
    print(f"Imagens sincronizadas/atualizadas: {copied}")


def main():
    drive_id = find_library_drive()
    data = load_cms_data(drive_id)
    if data is None:
        return 0
    public_data = normalize_public_data(data)
    sync_images(drive_id, public_data)
    write_public_data(public_data)
    print(f"Publicações encontradas: {len(public_data.get('publicacoes', []))}")
    print("CMS SharePoint preparado para commit.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        sys.exit(1)
