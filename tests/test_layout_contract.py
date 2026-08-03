import re
import struct
import unittest
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LayoutContractTests(unittest.TestCase):
    def test_professional_footer_is_consistent_sitewide(self):
        expected_links = [
            "index.html", "index.html#agents", "index.html#economy", "index.html#plans",
            "index.html#lead", "profiles.html", "mailto:hello@agentsofnews.com",
            "investors.html", "assets/presentations/agents-of-news-investor-deck.pdf",
            "https://awake.vc",
        ]
        for page in ("index.html", "profiles.html", "investors.html"):
            with self.subTest(page=page):
                html = (ROOT / page).read_text()
                footer = re.search(r'<footer class="site-footer">(.*?)</footer>', html, re.DOTALL).group(1)
                self.assertIn("Every point of view can become a newsroom.", footer)
                self.assertIn("All rights reserved.", footer)
                self.assertEqual(re.findall(r'href="([^"]+)"', footer), expected_links)
                self.assertIn('href="https://awake.vc" target="_blank" rel="noopener noreferrer">An Awake Venture</a>', footer)

    def test_primary_navigation_items_are_consistent_sitewide(self):
        expected_labels = ["News agents", "How you earn", "Plans", "Investors", "Launch yours"]
        expected_hrefs = {
            "index.html": ["#agents", "#economy", "#plans", "investors.html", "#lead"],
            "profiles.html": ["index.html#agents", "index.html#economy", "index.html#plans", "investors.html", "index.html#lead"],
            "investors.html": ["index.html#agents", "index.html#economy", "index.html#plans", "investors.html", "index.html#lead"],
        }
        for page, hrefs in expected_hrefs.items():
            with self.subTest(page=page):
                html = (ROOT / page).read_text()
                nav = re.search(r'<nav id="site-nav"[^>]*>(.*?)</nav>', html, re.DOTALL).group(1)
                links = re.findall(r'<a\s+([^>]*)>(.*?)</a>', nav, re.DOTALL)
                labels = [re.sub(r'<[^>]+>|&#8599;', '', body).strip() for _, body in links]
                actual_hrefs = [re.search(r'href="([^"]+)"', attributes).group(1) for attributes, _ in links]
                self.assertEqual(labels, expected_labels)
                self.assertEqual(actual_hrefs, hrefs)

    def test_awake_venture_attribution_is_linked_sitewide(self):
        expected_link = '<a href="https://awake.vc" target="_blank" rel="noopener noreferrer">An Awake Venture</a>'
        expected_counts = {"index.html": 2, "profiles.html": 1, "investors.html": 2}
        for page, count in expected_counts.items():
            with self.subTest(page=page):
                html = (ROOT / page).read_text()
                self.assertNotIn("A Fractals venture", html)
                self.assertEqual(html.count(expected_link), count)

    def test_social_cards_have_complete_open_graph_metadata(self):
        image_url = "https://www.agentsofnews.com/assets/images/og-agents-of-news.png"
        expected = {
            "index.html": (
                "Turn Your Point of View Into a Newsroom | Agents of News",
                "Launch an AI-powered journalist, grow a community around what you know, and claim your place in the new news economy.",
                "https://www.agentsofnews.com/",
            ),
            "profiles.html": (
                "Meet the People Behind the Perspective | Agents of News",
                "Eight distinct voices turning expertise, curiosity, and cultural context into living AI-powered newsrooms.",
                "https://www.agentsofnews.com/profiles.html",
            ),
            "investors.html": (
                "The Newsroom Is Becoming a Network | Agents of News",
                "Explore the opportunity behind Agents of News and the new creator-led news economy for the age of AI.",
                "https://www.agentsofnews.com/investors.html",
            ),
        }
        for page, (title, description, url) in expected.items():
            with self.subTest(page=page):
                head = (ROOT / page).read_text().split("</head>", 1)[0]
                expected_meta = {
                    "og:title": title,
                    "og:description": description,
                    "og:url": url,
                    "og:image": image_url,
                    "og:image:type": "image/png",
                    "og:image:width": "1200",
                    "og:image:height": "630",
                    "twitter:card": "summary_large_image",
                    "twitter:title": title,
                    "twitter:description": description,
                    "twitter:image": image_url,
                }
                for key, content in expected_meta.items():
                    matches = re.findall(
                        rf'<meta (?:property|name)="{re.escape(key)}" content="([^"]*)">',
                        head,
                    )
                    self.assertEqual(matches, [content], f"{page}: {key}")
                self.assertEqual(len(re.findall(r'<meta property="og:image:alt" content="[^"]+">', head)), 1)
                self.assertEqual(len(re.findall(r'<meta name="twitter:image:alt" content="[^"]+">', head)), 1)
                self.assertEqual(head.count(f'<link rel="canonical" href="{url}">'), 1)

    def test_social_card_has_platform_safe_dimensions(self):
        image = (ROOT / "assets/images/og-agents-of-news.png").read_bytes()
        self.assertEqual(image[:8], b"\x89PNG\r\n\x1a\n")
        width, height = struct.unpack(">II", image[16:24])
        self.assertEqual((width, height), (1200, 630))
        self.assertLess(len(image), 5 * 1024 * 1024)

        chunks = []
        offset = 8
        while offset < len(image):
            length = struct.unpack(">I", image[offset:offset + 4])[0]
            chunk_type = image[offset + 4:offset + 8]
            chunk_data = image[offset + 8:offset + 8 + length]
            checksum = struct.unpack(">I", image[offset + 8 + length:offset + 12 + length])[0]
            self.assertEqual(checksum, zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF)
            chunks.append(chunk_type)
            offset += 12 + length
        self.assertEqual(offset, len(image))
        self.assertEqual(chunks[0], b"IHDR")
        self.assertIn(b"IDAT", chunks)
        self.assertEqual(chunks[-1], b"IEND")

    def test_tally_embed_uses_dynamic_height(self):
        html = (ROOT / "index.html").read_text()
        self.assertIn('data-tally-src="https://tally.so/embed/jarDr9', html)
        self.assertIn("dynamicHeight=1", html)
        self.assertNotIn('loading="lazy"', html[html.index('class="tally-embed"'):])

        css = (ROOT / "styles.css").read_text()
        self.assertNotRegex(css, r"\.tally-embed\s*\{[^}]*height:")

    def test_tally_widget_runtime_is_initialized(self):
        script = (ROOT / "script.js").read_text()
        self.assertIn("https://tally.so/widgets/embed.js", script)
        self.assertIn("Tally.loadEmbeds", script)

    def test_tally_widget_failure_keeps_the_form_usable(self):
        script = (ROOT / "script.js").read_text()
        self.assertIn("setTimeout(showTallyFallback", script)
        self.assertIn("tallyEmbed.scrolling = 'auto'", script)
        self.assertIn("tallyScript.onerror = showTallyFallback", script)

    def test_tally_loader_checks_for_an_existing_resize(self):
        script = (ROOT / "script.js").read_text()
        self.assertIn("if (isTallySized()) return", script)
        initialize = script.index("const initializeTally")
        self.assertLess(
            script.index("heightObserver.observe", initialize),
            script.index("if (window.Tally)", initialize),
        )

    def test_investor_deck_is_self_hosted_and_downloadable(self):
        html = (ROOT / "investors.html").read_text()
        self.assertNotIn("slideserve.com", html.lower())
        self.assertIn('data-investor-slideshow data-slide-count="14"', html)
        self.assertIn('assets/presentations/slides/slide-01.png', html)
        self.assertIn('assets/presentations/agents-of-news-investor-deck.pdf', html)
        self.assertNotIn('.pptx', html.lower())

        deck = ROOT / "assets/presentations/agents-of-news-investor-deck.pdf"
        self.assertTrue(deck.is_file())
        self.assertGreater(deck.stat().st_size, 100_000)
        self.assertEqual(deck.read_bytes()[:5], b"%PDF-")
        for slide_number in range(1, 15):
            slide = ROOT / f"assets/presentations/slides/slide-{slide_number:02d}.png"
            self.assertTrue(slide.is_file(), slide.name)
            self.assertGreater(slide.stat().st_size, 10_000)

    def test_investor_slideshow_runtime_has_controls_and_keyboard_support(self):
        script = (ROOT / "script.js").read_text()
        self.assertIn("const showSlide", script)
        self.assertIn("event.key === 'ArrowRight'", script)
        self.assertIn("requestFullscreen", script)
        self.assertIn("(nextIndex + slideCount) % slideCount", script)


if __name__ == "__main__":
    unittest.main()
