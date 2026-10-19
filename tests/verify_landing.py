"""Sanity checks for the static landing and its outbound sales links."""

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.videos = []
        self.json_blocks = []
        self.in_json = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "a":
            self.links.append(attrs)
        if tag == "button" and attrs.get("data-video-id"):
            self.videos.append(attrs["data-video-id"])
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_json = True

    def handle_data(self, data):
        if self.in_json:
            self.json_blocks.append(data)

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_json = False


page = PageParser()
page.feed((ROOT / "index.html").read_text(encoding="utf-8"))
assert len(page.ids) == len(set(page.ids)), "Duplicate HTML ids"
assert page.videos == ["TSISdheL8D8"], "Main presentation video changed"
assert len([link for link in page.links if "youtube.com/watch" in link.get("href", "")]) == 4

sales_links = [link for link in page.links if "go.hotmart.com" in link.get("href", "")]
assert len(sales_links) >= 4, "Missing sales CTAs"
for link in sales_links:
    url = urlparse(link["href"])
    assert url.netloc == "go.hotmart.com" and url.path == "/D1064872390"
    assert {"utm_source", "utm_medium", "utm_campaign", "utm_content"} <= parse_qs(url.query).keys()
    assert {"sponsored", "nofollow"} <= set(link.get("rel", "").split())
    assert link.get("data-cta-id")

for link in page.links:
    href = link.get("href", "")
    if href.startswith("#"):
        assert href[1:] in page.ids, f"Broken anchor: {href}"
    if href.endswith(".html"):
        assert (ROOT / href).is_file(), f"Missing local page: {href}"

course = json.loads("".join(page.json_blocks))
assert course["@type"] == "Course"
assert "InitiateCheckout" not in (ROOT / "analytics.js").read_text(encoding="utf-8").split("function initTracking()")[1]
print("Landing structure, videos, navigation and affiliate links: OK")
