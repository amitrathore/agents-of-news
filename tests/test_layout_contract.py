import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LayoutContractTests(unittest.TestCase):
    def test_builder_intro_does_not_stick_over_the_form(self):
        css = (ROOT / "styles.css").read_text()
        rule = re.search(r"\.builder-intro\s*\{([^}]*)\}", css)
        self.assertIsNotNone(rule)
        self.assertNotIn("position: sticky", rule.group(1))

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


if __name__ == "__main__":
    unittest.main()
