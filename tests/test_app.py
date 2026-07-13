"""Streamlit smoke tests for the rendered PointPal conversation flow."""

import unittest

from streamlit.testing.v1 import AppTest


class PointPalAppTests(unittest.TestCase):
    def make_app(self):
        app = AppTest.from_file("app.py").run(timeout=30)
        self.assertFalse(list(app.exception))
        return app

    def test_fresh_app_renders_welcome_and_chat_input(self):
        app = self.make_app()

        self.assertEqual(len(app.chat_input), 1)
        self.assertEqual(len(app.chat_message), 1)
        self.assertIn("Welcome to **PointPal**", app.chat_message[0].markdown[0].value)
        self.assertEqual(len(app.button), 5)

    def test_chat_input_renders_exact_price_and_caveat(self):
        app = self.make_app()
        app.chat_input[0].set_value("What is the price of Iced Spanish?").run(timeout=30)

        self.assertFalse(list(app.exception))
        self.assertEqual(len(app.chat_message), 3)
        markdown = "\n".join(str(element.value) for element in app.markdown)
        self.assertIn("Iced Spanish — Rs. 790", markdown)
        self.assertIn("Prices and promotions can change", markdown)
        self.assertIn("Foodpanda menu", markdown)

    def test_quick_prompt_runs_through_chat(self):
        app = self.make_app()
        labels = [button.label for button in app.button]
        index = labels.index("Best coffee under Rs. 800")
        app.button[index].click().run(timeout=30)

        self.assertFalse(list(app.exception))
        self.assertEqual(len(app.chat_message), 3)
        markdown = "\n".join(str(element.value) for element in app.markdown)
        self.assertIn("coffee picks within Rs. 800", markdown)
        self.assertIn("Foodpanda menu", markdown)


if __name__ == "__main__":
    unittest.main(verbosity=2)
