"""Behavioral regression tests for PointPal's grounded retrieval layer.

The suite intentionally uses only :mod:`unittest` so it can run on a fresh clone
without adding a test dependency.  Assertions focus on public behavior and data
grounding rather than Markdown whitespace or recommendation tie-breaking.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pointpal import (  # noqa: E402 - add the project root before importing
    BUSINESS,
    FOODPANDA_URL,
    MENU,
    MENU_CHECKED,
    PRICE_NOTE,
    WEBSITE_URL,
    answer,
    extract_budget,
    filter_menu,
    normalize,
    requested_tags,
)


class PointPalTestCase(unittest.TestCase):
    """Common assertions for menu-backed replies."""

    def assert_grounded_menu_reply(self, reply) -> None:
        self.assertEqual(reply.source_label, "Foodpanda menu")
        self.assertEqual(reply.source_url, FOODPANDA_URL)
        self.assertIn(PRICE_NOTE, reply.text)
        self.assertIn("Prices and promotions can change", reply.text)


class RequiredDemoQuestionTests(PointPalTestCase):
    """The eight questions requested for the fellowship recording."""

    def test_where_are_you_located(self) -> None:
        reply = answer("Where are you located?")

        self.assertEqual(reply.intent, "location")
        self.assertIn("290 MB, Sector H, DHA Phase 6, Lahore, Pakistan", reply.text)
        self.assertEqual(reply.source_label, "Official website")
        self.assertEqual(reply.source_url, WEBSITE_URL)
        self.assertFalse(reply.items)

    def test_what_are_your_opening_hours(self) -> None:
        reply = answer("What are your opening hours?")

        self.assertEqual(reply.intent, "hours")
        self.assertIn("conflicting hours", reply.text.lower())
        self.assertIn("8:00 AM", reply.text)
        self.assertIn("1:00 AM", reply.text)
        self.assertIn("9:00 AM", reply.text)
        self.assertIn("12:00 AM", reply.text)
        self.assertIn(BUSINESS["phone"], reply.text)
        self.assertEqual(reply.source_url, f"{WEBSITE_URL}location")

    def test_best_coffee_under_rs_800(self) -> None:
        reply = answer("Best coffee under Rs. 800")

        self.assertEqual(reply.intent, "recommendation")
        self.assertEqual(reply.budget, 800)
        self.assertTrue(reply.items)
        self.assertLessEqual(len(reply.items), 5)
        for item in reply.items:
            with self.subTest(item=item.name):
                self.assertIn("coffee", item.tags)
                self.assertLessEqual(item.price, 800)
                self.assertIn(item.name, reply.text)
        self.assert_grounded_menu_reply(reply)

    def test_recommend_something_cold(self) -> None:
        reply = answer("Recommend something cold")

        self.assertEqual(reply.intent, "recommendation")
        self.assertTrue(reply.items)
        for item in reply.items:
            with self.subTest(item=item.name):
                self.assertIn("cold", item.tags)
        self.assert_grounded_menu_reply(reply)

    def test_desserts_under_rs_700(self) -> None:
        reply = answer("Any desserts under Rs. 700?")

        self.assertEqual(reply.intent, "recommendation")
        self.assertEqual(reply.budget, 700)
        self.assertTrue(reply.items)
        for item in reply.items:
            with self.subTest(item=item.name):
                self.assertIn("dessert", item.tags)
                self.assertLessEqual(item.price, 700)
        self.assert_grounded_menu_reply(reply)

    def test_roman_urdu_value_coffee_request(self) -> None:
        reply = answer("Koi sasti coffee suggest kro")

        self.assertEqual(reply.intent, "recommendation")
        self.assertTrue(reply.items)
        self.assertEqual(reply.items[0].name, "Espresso")
        self.assertEqual(reply.items[0].price, 550)
        self.assertEqual(
            [item.price for item in reply.items],
            sorted(item.price for item in reply.items),
        )
        self.assertTrue(all("coffee" in item.tags for item in reply.items))
        self.assertIn("best-value", reply.text.lower())

    def test_delivery_question(self) -> None:
        reply = answer("Do you offer delivery?")

        self.assertEqual(reply.intent, "delivery")
        self.assertIn("delivery", reply.text.lower())
        self.assertIn("pick-up", reply.text.lower())
        self.assertIn("depend", reply.text.lower())
        self.assertEqual(reply.source_label, "Foodpanda")
        self.assertEqual(reply.source_url, FOODPANDA_URL)

    def test_exact_iced_spanish_price(self) -> None:
        reply = answer("What is the price of Iced Spanish?")

        self.assertEqual(reply.intent, "item_lookup")
        self.assertEqual(len(reply.items), 1)
        self.assertEqual(reply.items[0].name, "Iced Spanish")
        self.assertEqual(reply.items[0].price, 790)
        self.assertIn("Rs. 790", reply.text)
        self.assert_grounded_menu_reply(reply)


class BusinessFaqTests(unittest.TestCase):
    def test_contact_question_is_grounded_in_official_site(self) -> None:
        reply = answer("What is your contact number?")

        self.assertEqual(reply.intent, "contact")
        self.assertIn("+92 327 4777957", reply.text)
        self.assertEqual(reply.source_url, WEBSITE_URL)

    def test_basic_roman_urdu_faq_phrases(self) -> None:
        cases = {
            "Open kab hota hai?": "hours",
            "Aap kahan located ho?": "location",
            "Rabta number kya hai?": "contact",
            "Ghar mangwa sakte hain?": "delivery",
        }
        for question, intent in cases.items():
            with self.subTest(question=question):
                self.assertEqual(answer(question).intent, intent)

    def test_empty_question_has_helpful_prompt(self) -> None:
        reply = answer("   ")

        self.assertEqual(reply.intent, "empty")
        self.assertIn("Ask me", reply.text)
        self.assertIn("menu", reply.text.lower())


class FilteringAndBudgetTests(PointPalTestCase):
    def test_requested_composite_tags_are_all_retained(self) -> None:
        self.assertEqual(
            set(requested_tags("Best cold coffee under Rs. 800")),
            {"coffee", "cold"},
        )

    def test_filter_menu_uses_and_not_or_for_composite_tags(self) -> None:
        items = filter_menu(("coffee", "cold"), budget=800)

        self.assertTrue(items)
        self.assertTrue(all("coffee" in item.tags for item in items))
        self.assertTrue(all("cold" in item.tags for item in items))
        self.assertTrue(all(item.price <= 800 for item in items))
        self.assertNotIn("Espresso", {item.name for item in items})
        self.assertNotIn("Peach Iced Tea", {item.name for item in items})

    def test_answer_preserves_every_composite_constraint(self) -> None:
        reply = answer("Best cold coffee under Rs. 800")

        self.assertEqual(reply.intent, "recommendation")
        self.assertEqual(reply.budget, 800)
        self.assertTrue(reply.items)
        for item in reply.items:
            with self.subTest(item=item.name):
                self.assertIn("coffee", item.tags)
                self.assertIn("cold", item.tags)
                self.assertLessEqual(item.price, 800)

    def test_zero_is_a_real_budget_not_a_missing_budget(self) -> None:
        for question in ("Anything under Rs. 0?", "My budget is Rs 0"):
            with self.subTest(question=question):
                self.assertEqual(extract_budget(question), 0)
                reply = answer(question)
                self.assertEqual(reply.budget, 0)
                self.assertEqual(reply.intent, "no_match")
                self.assertIn("couldn", normalize(reply.text))
                self.assertIn("within rs 0", normalize(reply.text))
                self.assertTrue(all(item.price > 0 for item in reply.items))
        self.assertEqual(filter_menu(budget=0), ())

    def test_roman_urdu_budget_forms(self) -> None:
        cases = {
            "Koi coffee Rs 800 tak": 800,
            "Coffee 800 se kam": 800,
            "Coffee 800 ke andar": 800,
            "Mera budget 800 hai": 800,
            "Kam Rs 800 mein coffee": 800,
        }
        for question, expected in cases.items():
            with self.subTest(question=question):
                self.assertEqual(extract_budget(question), expected)

    def test_roman_urdu_budget_and_category_are_applied_together(self) -> None:
        reply = answer("Koi coffee Rs 800 ke andar suggest kro")

        self.assertEqual(reply.intent, "recommendation")
        self.assertEqual(reply.budget, 800)
        self.assertTrue(reply.items)
        self.assertTrue(all("coffee" in item.tags for item in reply.items))
        self.assertTrue(all(item.price <= 800 for item in reply.items))

    def test_value_phrases_rank_lowest_price_first(self) -> None:
        for question in (
            "Koi sasti coffee suggest kro",
            "Affordable coffee please",
            "Best value coffee",
            "Kam qeemat coffee suggest kro",
        ):
            with self.subTest(question=question):
                reply = answer(question)
                prices = [item.price for item in reply.items]
                self.assertEqual(reply.intent, "recommendation")
                self.assertTrue(prices)
                self.assertEqual(prices, sorted(prices))


class GroundingAndDataQualityTests(PointPalTestCase):
    def test_menu_has_expected_count_and_unique_names(self) -> None:
        self.assertEqual(len(MENU), 75)
        normalized_names = [normalize(item.name) for item in MENU]
        self.assertEqual(len(normalized_names), len(set(normalized_names)))

    def test_every_menu_record_is_complete_and_sane(self) -> None:
        for item in MENU:
            with self.subTest(item=item.name):
                self.assertTrue(item.name.strip())
                self.assertIs(type(item.price), int)
                self.assertGreater(item.price, 0)
                self.assertTrue(item.category.strip())
                self.assertTrue(item.description.strip())
                self.assertTrue(item.tags)
                self.assertEqual(len(item.tags), len(set(item.tags)))

    def test_exact_menu_lookup_is_unique(self) -> None:
        matches = [item for item in MENU if item.name == "Iced Spanish"]

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].price, 790)
        reply = answer("Iced Spanish price")
        self.assertEqual(reply.items, (matches[0],))

    def test_price_note_has_date_and_change_caveat(self) -> None:
        self.assertTrue(MENU_CHECKED)
        self.assertIn(MENU_CHECKED, PRICE_NOTE)
        self.assertIn("Foodpanda list prices", PRICE_NOTE)
        self.assertIn("can change", PRICE_NOTE)
        self.assertIn("differ in-store", PRICE_NOTE)

    def test_all_menu_response_shapes_include_source_and_price_caveat(self) -> None:
        cases = (
            "Iced Spanish price",
            "Recommend a cold drink",
            "Dessert under Rs 1",
            "Spanish lattee price",
        )
        for question in cases:
            with self.subTest(question=question):
                self.assert_grounded_menu_reply(answer(question))

    def test_public_source_urls_are_the_expected_sources(self) -> None:
        self.assertEqual(WEBSITE_URL, "https://www.thepoint.cafe/")
        self.assertEqual(
            FOODPANDA_URL,
            "https://www.foodpanda.pk/restaurant/vb7p/the-point-vb7p",
        )
        self.assertEqual(BUSINESS["website"], WEBSITE_URL)
        self.assertEqual(BUSINESS["foodpanda"], FOODPANDA_URL)


class IntentSafetyTests(unittest.TestCase):
    def test_unsupported_questions_are_not_guessed(self) -> None:
        questions = (
            "Do you have Wi-Fi?",
            "Do you have vegan options?",
            "Is parking available?",
        )
        for question in questions:
            with self.subTest(question=question):
                reply = answer(question)
                self.assertEqual(reply.intent, "unknown")
                self.assertFalse(reply.items)
                self.assertFalse(reply.source_url)
                self.assertIn("couldn", normalize(reply.text))
                self.assertIn("verify", normalize(reply.text))
                self.assertIn("guess", normalize(reply.text))

    def test_delivery_intent_precedes_item_and_other_faq_intents(self) -> None:
        questions = (
            "Do you offer delivery of Iced Spanish?",
            "Can you deliver an Iced Spanish?",
            "What are the delivery hours and location?",
        )
        for question in questions:
            with self.subTest(question=question):
                reply = answer(question)
                self.assertEqual(reply.intent, "delivery")
                self.assertEqual(reply.source_url, FOODPANDA_URL)
                self.assertFalse(reply.items)

    def test_bounded_fuzzy_search_handles_a_typo_with_identifying_context(self) -> None:
        cases = {
            "Spanish lattee price": "Spanish Latte",
            "Salted caramel browni price": "Salted Caramel Brownie",
            "Pistachio macha": "Pistachio Matcha",
        }
        for question, expected_first in cases.items():
            with self.subTest(question=question):
                reply = answer(question)
                self.assertEqual(reply.intent, "search")
                self.assertTrue(reply.items)
                self.assertEqual(reply.items[0].name, expected_first)


if __name__ == "__main__":
    unittest.main(verbosity=2)
