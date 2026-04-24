#!/usr/bin/env python3
"""
Refresh the cached Instagram snapshot for @vaffisalon.

- Calls Instagram's unofficial web_profile_info endpoint with the
  app-id header that the instagram.com site itself uses. No auth token.
- Downloads the 12 most-recent post images into images/instagram/.
- Writes images/instagram/posts.json with metadata + an updated_at stamp.
- Removes any stale post-XX.jpg files that are no longer in the latest set.

This is the same approach used by many static-site IG widgets (behold.so,
lightwidget, etc.) and is intentionally server-side — browsers can't
call this endpoint due to CORS.

Run locally:   python3 scripts/refresh_instagram.py
Run in CI:     see .github/workflows/refresh-instagram.yml
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

USERNAME = os.environ.get("IG_USERNAME", "vaffisalon")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "images", "instagram")
OUT_DIR = os.path.normpath(OUT_DIR)

# These two headers are what instagram.com itself sends from the browser.
# The app-id is a public, widely-documented constant.
HEADERS = {
    "User-Agent": "Instagram 219.0.0.12.117 Android",
    "X-IG-App-ID": "936619743392459",
    "Accept": "*/*",
}

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"
)

MAX_POSTS = 12


def fetch_profile(username: str) -> dict:
    url = f"https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def download(url: str, dest: str) -> int:
    req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    return len(data)


def clean_caption(text: str) -> str:
    if not text:
        return ""
    first = text.strip().split("\n", 1)[0]
    # strip hashtags
    first = re.sub(r"#\S+", "", first).strip()
    return first[:120]


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)

    try:
        payload = fetch_profile(USERNAME)
    except urllib.error.HTTPError as e:
        print(f"error: IG returned HTTP {e.code}: {e.reason}", file=sys.stderr)
        return 2
    except Exception as e:  # noqa: BLE001
        print(f"error: couldn't fetch profile: {e}", file=sys.stderr)
        return 2

    try:
        edges = payload["data"]["user"]["edge_owner_to_timeline_media"]["edges"]
    except (KeyError, TypeError):
        print("error: unexpected response shape", file=sys.stderr)
        return 2

    if not edges:
        print("warning: profile returned zero posts")

    posts: list[dict] = []
    used_files: set[str] = set()

    for i, e in enumerate(edges[:MAX_POSTS], 1):
        n = e.get("node", {})
        shortcode = n.get("shortcode") or ""
        is_video = bool(n.get("is_video"))
        display_url = n.get("display_url")
        if not display_url:
            continue
        caption_edges = n.get("edge_media_to_caption", {}).get("edges", [])
        caption = caption_edges[0]["node"]["text"] if caption_edges else ""
        short = clean_caption(caption) or f"Post {i}"

        fname = f"post-{i:02d}.jpg"
        path = os.path.join(OUT_DIR, fname)
        try:
            size = download(display_url, path)
        except Exception as ex:  # noqa: BLE001
            print(f"skip  {fname}  download failed: {ex}")
            continue
        used_files.add(fname)
        posts.append({
            "file": fname,
            "shortcode": shortcode,
            "is_video": is_video,
            "caption": caption,
            "short": short,
            "url": f"https://www.instagram.com/p/{shortcode}/" if shortcode else "https://www.instagram.com/vaffisalon/",
        })
        print(f"ok    {size:>8}B  {fname}  {short[:60]}")

    if not posts:
        print("error: no posts downloaded, not overwriting existing snapshot", file=sys.stderr)
        return 3

    # prune stale post files
    for existing in os.listdir(OUT_DIR):
        if existing.startswith("post-") and existing.endswith(".jpg") and existing not in used_files:
            os.remove(os.path.join(OUT_DIR, existing))
            print(f"prune {existing}")

    manifest = {
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": f"https://www.instagram.com/{USERNAME}",
        "posts": posts,
    }
    with open(os.path.join(OUT_DIR, "posts.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nwrote posts.json — {len(posts)} posts @ {manifest['updated_at']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
