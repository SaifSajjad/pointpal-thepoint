"""Grounded FAQ and menu retrieval for PointPal.

The module deliberately uses deterministic matching instead of a paid language-model
API.  Keeping the retrieval logic separate from Streamlit makes it easy to test and
reuse in another interface later.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Iterable, Optional, Sequence, Tuple


WEBSITE_URL = "https://www.thepoint.cafe/"
FOODPANDA_URL = "https://www.foodpanda.pk/restaurant/vb7p/the-point-vb7p"
INSTAGRAM_URL = "https://www.instagram.com/thepointlhr/"
MENU_CHECKED = "13 July 2026"

BUSINESS = {
    "hours": "Conflicting official listings — confirm before visiting",
    "hours_footer": "8:00 AM – 1:00 AM",
    "hours_phase6": "9:00 AM – 12:00 AM (Mon–Sun)",
    "location": "290 MB, Sector H, DHA Phase 6, Lahore, Pakistan",
    "phone": "+92 327 4777957",
    "website": WEBSITE_URL,
    "instagram": INSTAGRAM_URL,
    "foodpanda": FOODPANDA_URL,
}

PRICE_NOTE = (
    f"Foodpanda list prices checked {MENU_CHECKED}. Prices and promotions can "
    "change and may differ in-store."
)


@dataclass(frozen=True)
class MenuItem:
    name: str
    price: int
    category: str
    description: str
    tags: Tuple[str, ...]
    popular: bool = False


@dataclass(frozen=True)
class Reply:
    text: str
    source_label: str = ""
    source_url: str = ""
    intent: str = "unknown"
    items: Tuple[MenuItem, ...] = ()
    budget: Optional[int] = None


def _item(
    name: str,
    price: int,
    category: str,
    description: str,
    *tags: str,
    popular: bool = False,
) -> MenuItem:
    return MenuItem(name, price, category, description, tuple(tags), popular)


# Undiscounted list prices are used because temporary Foodpanda promotions change.
# Descriptions are concise paraphrases of the public Foodpanda listing.
MENU: Tuple[MenuItem, ...] = (
    _item("Tuscan Chicken Panini", 1270, "Sandwiches", "Grilled chicken, creamy Tuscan-style sauce, cheese and herbs in toasted panini bread.", "food", "sandwich", "panini", "savory", popular=True),
    _item("Beef Sandwich", 1350, "Sandwiches", "Slow-cooked beef brisket, melted cheese and sauce in toasted bread.", "food", "sandwich", "savory"),
    _item("Chicken Jalapeño Sandwich", 1200, "Sandwiches", "Grilled chicken, jalapeños, lettuce, tomato and mayo on a toasted bun.", "food", "sandwich", "savory"),
    _item("Chicken Jalapeño Wrap", 1020, "Wrap", "Grilled chicken, jalapeños, cheese and sauce in a warm tortilla.", "food", "wrap", "savory", popular=True),
    _item("San Sebastian Cheesecake", 1100, "Dessert & Croissant", "A slice of creamy cheesecake.", "dessert", "sweet", "cake", "cheesecake", popular=True),
    _item("Lisbon Cake", 900, "Dessert & Croissant", "Soft buttery cake with light citrus notes.", "dessert", "sweet", "cake"),
    _item("Dark Chocolate Cookie", 650, "Dessert & Croissant", "Soft-baked cookie with rich dark chocolate.", "dessert", "sweet", "cookie", "chocolate"),
    _item("Banana Bread", 590, "Dessert & Croissant", "Moist, soft banana bread with a comforting homemade style.", "dessert", "sweet", "cake", "bread", popular=True),
    _item("Dark Chocolate Fudge Brownie", 580, "Dessert & Croissant", "Dense dark chocolate brownie with a gooey centre.", "dessert", "sweet", "brownie", "chocolate"),
    _item("Salted Caramel Brownie", 640, "Dessert & Croissant", "Fudgy chocolate brownie layered with salted caramel.", "dessert", "sweet", "brownie", "chocolate", "caramel"),
    _item("Butter Croissant", 750, "Dessert & Croissant", "Flaky golden croissant with buttery layers.", "dessert", "sweet", "croissant", "bakery"),
    _item("Almond Croissant", 810, "Dessert & Croissant", "Butter croissant with almond cream and toasted almonds.", "dessert", "sweet", "croissant", "bakery", popular=True),
    _item("Hazelnut Cinnamon Roll", 730, "Dessert & Croissant", "Soft cinnamon roll with roasted hazelnut filling and a light glaze.", "dessert", "sweet", "cinnamon roll", "bakery"),
    _item("Classic Cinnamon Roll", 680, "Dessert & Croissant", "Soft cinnamon roll with cinnamon sugar and creamy frosting.", "dessert", "sweet", "cinnamon roll", "bakery"),
    _item("Pistachio Croissant", 900, "Dessert & Croissant", "Butter croissant with pistachio cream and crushed pistachios.", "dessert", "sweet", "croissant", "bakery"),
    _item("Chocolate Croissant", 680, "Dessert & Croissant", "Flaky butter croissant filled with dark chocolate.", "dessert", "sweet", "croissant", "bakery", "chocolate"),
    _item("Nutella Stuffed Cookie", 610, "Dessert & Croissant", "Soft butter cookie filled with chocolate-hazelnut spread.", "dessert", "sweet", "cookie", "chocolate"),
    _item("Lindt Cookie", 850, "Dessert & Croissant", "A premium chocolate cookie with a smooth, rich flavour.", "dessert", "sweet", "cookie", "chocolate"),
    _item("Espresso", 550, "Specialty Coffee", "A concentrated shot with a bold, full-bodied coffee flavour.", "coffee", "hot"),
    _item("Macchiato", 580, "Specialty Coffee", "Strong espresso topped with a touch of milk foam.", "coffee", "hot"),
    _item("Latte", 740, "Specialty Coffee", "Smooth espresso and steamed milk.", "coffee", "hot", "latte"),
    _item("Cappuccino", 740, "Specialty Coffee", "Espresso, steamed milk and airy milk foam.", "coffee", "hot"),
    _item("Cortado", 670, "Specialty Coffee", "Espresso balanced with a small amount of warm milk.", "coffee", "hot"),
    _item("Piccolo", 670, "Specialty Coffee", "A short espresso topped with lightly steamed milk.", "coffee", "hot"),
    _item("Americano", 740, "Specialty Coffee", "Espresso and hot water for a smooth black coffee.", "coffee", "hot", "black coffee"),
    _item("Flat White", 740, "Specialty Coffee", "Espresso with velvety micro-foamed milk.", "coffee", "hot"),
    _item("Honey Latte", 790, "Hot", "Espresso and milk naturally sweetened with honey.", "coffee", "hot", "latte"),
    _item("Dark Mocha", 790, "Hot", "Espresso, dark chocolate and milk.", "coffee", "hot", "mocha", "chocolate"),
    _item("Spanish Latte", 820, "Hot", "Creamy espresso sweetened with condensed milk.", "coffee", "hot", "latte"),
    _item("Hazelnut Latte", 790, "Hot", "Espresso and milk with a nutty hazelnut flavour.", "coffee", "hot", "latte"),
    _item("Vanilla Latte", 790, "Hot", "Espresso, milk and subtle vanilla sweetness.", "coffee", "hot", "latte"),
    _item("Caramel Latte", 790, "Hot", "A smooth latte with rich caramel flavour.", "coffee", "hot", "latte", "caramel"),
    _item("Tiramisu Latte", 790, "Hot", "A creamy espresso drink with tiramisu-inspired cocoa notes.", "coffee", "hot", "latte"),
    _item("Pistachio Latte", 960, "Hot", "Creamy espresso and milk with pistachio flavour.", "coffee", "hot", "latte"),
    _item("Hot Chocolate", 800, "Hot", "Rich cocoa and steamed milk; this is not a coffee drink.", "hot", "chocolate", "non-coffee"),
    _item("Point Tea", 450, "Hot", "Traditional tea brewed with milk.", "tea", "chai", "hot", "non-coffee"),
    _item("Salted Caramel Latte", 850, "Hot", "Espresso, steamed milk and salted caramel.", "coffee", "hot", "latte", "caramel"),
    _item("Iced Americano", 590, "Cold", "Chilled espresso and cold water for a crisp black coffee.", "coffee", "cold", "iced", "black coffee"),
    _item("Iced Spanish", 790, "Cold", "Chilled espresso and condensed milk for a rich, creamy coffee.", "coffee", "cold", "iced", "latte", popular=True),
    _item("Iced Hazelnut", 790, "Cold", "Iced latte with a nutty hazelnut flavour.", "coffee", "cold", "iced", "latte", popular=True),
    _item("Iced Vanilla", 790, "Cold", "Iced latte with vanilla flavour.", "coffee", "cold", "iced", "latte"),
    _item("Iced Caramel", 790, "Cold", "Iced latte with caramel flavour.", "coffee", "cold", "iced", "latte", "caramel"),
    _item("Iced Dark Mocha", 790, "Cold", "Cold espresso with dark chocolate and milk.", "coffee", "cold", "iced", "mocha", "chocolate", popular=True),
    _item("Iced Pistachio", 900, "Cold", "Iced latte with pistachio flavour.", "coffee", "cold", "iced", "latte"),
    _item("Iced Tiramisu", 790, "Cold", "Iced latte with tiramisu flavour.", "coffee", "cold", "iced", "latte"),
    _item("Kinder Frappe", 1050, "Frappuccino", "A cold blended chocolate drink inspired by Kinder chocolate.", "cold", "frappe", "chocolate", "non-coffee", popular=True),
    _item("Lotus Biscoff Frappe", 1150, "Frappuccino", "A creamy blended drink with caramelised biscuit flavour.", "cold", "frappe", "non-coffee"),
    _item("Oreo Frappe", 1000, "Frappuccino", "A blended chocolate drink with crushed Oreo cookies.", "cold", "frappe", "chocolate", "non-coffee"),
    _item("Mocha Frappe", 1000, "Frappuccino", "Cold blended espresso and chocolate.", "cold", "frappe", "coffee", "mocha", "chocolate"),
    _item("Popcorn Frappe", 1050, "Frappuccino", "A creamy coffee blend with sweet popcorn and caramel flavours.", "cold", "frappe", "coffee", "caramel"),
    _item("Salted Caramel Frappe", 1050, "Frappuccino", "A creamy frozen caramel drink with a sweet-and-salty finish.", "cold", "frappe", "caramel", "non-coffee"),
    _item("Pistachio Frappe", 1250, "Frappuccino", "A creamy frozen pistachio drink with crushed pistachios.", "cold", "frappe", "non-coffee"),
    _item("Kit Kat Frappe", 1250, "Frappuccino", "A creamy frozen chocolate-wafer drink.", "cold", "frappe", "chocolate", "non-coffee"),
    _item("Mango with Coconut", 1050, "Matcha", "Matcha blended with mango and coconut.", "matcha", "non-coffee"),
    _item("Honey Matcha", 920, "Matcha", "Smooth matcha naturally sweetened with honey.", "matcha", "non-coffee"),
    _item("Strawberry Matcha", 1050, "Matcha", "Creamy matcha with strawberry flavour.", "matcha", "non-coffee"),
    _item("Dirty Matcha", 1050, "Matcha", "Matcha with a shot of espresso and red berry notes.", "matcha", "coffee"),
    _item("Pistachio Matcha", 1150, "Matcha", "Creamy matcha with pistachio flavour.", "matcha", "non-coffee"),
    _item("Peach Iced Tea", 650, "Iced Tea", "Chilled black tea with peach flavour.", "tea", "cold", "iced", "non-coffee"),
    _item("Lychee Iced Tea", 650, "Iced Tea", "Light iced tea with sweet lychee notes.", "tea", "cold", "iced", "non-coffee"),
    _item("Mixed Berry Iced Tea", 650, "Iced Tea", "Iced tea with sweet and tangy mixed berries.", "tea", "cold", "iced", "non-coffee"),
    _item("Strawberry Fizz", 700, "Iced Tea", "A chilled fizzy drink with strawberry flavour.", "fizz", "cold", "non-coffee"),
    _item("Peach Fizz", 650, "Iced Tea", "A chilled fizzy drink with peach flavour.", "fizz", "cold", "non-coffee"),
    _item("Lemon Fizz", 500, "Iced Tea", "A chilled lemon drink with a fizzy finish.", "fizz", "cold", "non-coffee"),
    _item("Mixed Berry Fizz", 650, "Iced Tea", "A cold fizzy blend of mixed berry flavours.", "fizz", "cold", "non-coffee"),
    _item("Mixed Berry Smoothie", 700, "Smoothies", "A smooth blended mixed-berry drink.", "smoothie", "cold", "non-coffee"),
    _item("Biscoff Latte", 990, "Signature Brew", "Espresso and caramelised biscuit spread with a spiced sweetness.", "coffee", "hot", "latte"),
    _item("Biscoff Iced Latte", 990, "Signature Brew", "Espresso and caramelised biscuit spread served over ice.", "coffee", "cold", "iced", "latte"),
    _item("Bourbon Hot Latte", 820, "Signature Brew", "Espresso with warm vanilla bourbon-inspired notes; no alcohol is claimed by the listing.", "coffee", "hot", "latte"),
    _item("Bourbon Iced Latte", 820, "Signature Brew", "Espresso with bourbon-inspired notes served over ice; no alcohol is claimed by the listing.", "coffee", "cold", "iced", "latte", popular=True),
    _item("V60", 990, "Pour Over", "Hand-brewed coffee designed to highlight clean, delicate flavours.", "coffee", "hot", "pour over"),
    _item("Aeropress", 950, "Pour Over", "A smooth, rich hand-brewed coffee with low acidity.", "coffee", "hot", "pour over"),
    _item("Cheesecake Latte", 1400, "On Point", "Espresso, milk and cheesecake-inspired flavours.", "coffee", "latte", "sweet"),
    _item("Mascarpone Latte", 1400, "On Point", "Espresso, steamed milk and creamy mascarpone flavour.", "coffee", "latte", "sweet"),
    _item("Matcha Tiramisu", 1450, "On Point", "A layered matcha and mascarpone dessert with espresso-soaked ladyfingers.", "dessert", "sweet", "matcha", "coffee"),
)


CATEGORY_ALIASES = {
    "coffee": ("coffee", "coffees", "cofee", "coffi"),
    "cold": ("cold", "chilled", "iced", "thanda", "thandi", "thanday"),
    "hot": ("hot", "warm", "garam"),
    "dessert": ("dessert", "desserts", "sweet", "sweets", "meetha", "meethi", "mithai"),
    "food": ("food", "meal", "khana", "savory", "savoury"),
    "sandwich": ("sandwich", "sandwiches", "panini"),
    "wrap": ("wrap", "wraps"),
    "frappe": ("frappe", "frappes", "frappuccino"),
    "matcha": ("matcha",),
    "tea": ("tea", "chai"),
    "smoothie": ("smoothie", "smoothies"),
    "brownie": ("brownie", "brownies"),
    "cookie": ("cookie", "cookies"),
    "croissant": ("croissant", "croissants"),
    "cake": ("cake", "cakes", "cheesecake"),
    "fizz": ("fizz", "fizzy"),
    "latte": ("latte", "lattes"),
}

CHEAP_WORDS = (
    "cheap",
    "cheapest",
    "lowest price",
    "affordable",
    "value",
    "sasta",
    "sasti",
    "saste",
    "kam price",
    "kam qeemat",
    "budget friendly",
)

RECOMMEND_WORDS = (
    "recommend",
    "recommendation",
    "suggest",
    "suggestion",
    "best",
    "popular",
    "what should i get",
    "what should i order",
    "kya loon",
    "kia loon",
    "kya lu",
    "kia lu",
    "koi acha",
    "koi achi",
    "koi achha",
)

STOP_WORDS = {
    "a", "an", "any", "are", "can", "do", "for", "from", "give", "have",
    "how", "i", "in", "is", "it", "ka", "ki", "ko", "koi", "kro", "me",
    "menu", "of", "on", "please", "price", "prices", "show", "something",
    "the", "to", "what", "with", "you", "your",
}


def normalize(text: str) -> str:
    """Return lowercase, accent-insensitive text with predictable spacing."""
    folded = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", folded.lower()).strip()


def money(value: int) -> str:
    return f"Rs. {value:,}"


def _contains_phrase(text: str, phrases: Iterable[str]) -> bool:
    padded = f" {text} "
    return any(f" {normalize(phrase)} " in padded for phrase in phrases)


def extract_budget(question: str) -> Optional[int]:
    """Extract common English and Roman Urdu budget expressions."""
    q = normalize(question)
    currency = r"(?:rs|pkr|rupees?)?\s*"
    number = r"([0-9][0-9,]*)"
    patterns = (
        rf"(?:under|below|within|upto|up to|max|maximum)\s*{currency}{number}",
        rf"budget(?:\s+(?:is|of|around))?\s*{currency}{number}",
        rf"{currency}{number}\s*(?:or less|or below|tak|se kam|ke andar)",
        rf"(?:kam|andar|tak)\s*{currency}{number}",
        rf"(?:rs|pkr)\s*{number}",
    )
    for pattern in patterns:
        match = re.search(pattern, q)
        if match:
            return int(match.group(1).replace(",", ""))
    return None


def requested_tags(question: str) -> Tuple[str, ...]:
    q = normalize(question)
    found = []
    for tag, aliases in CATEGORY_ALIASES.items():
        if _contains_phrase(q, aliases):
            found.append(tag)
    # "cold coffee" should satisfy both constraints, not either one.
    return tuple(found)


def _matches_all_tags(item: MenuItem, tags: Sequence[str]) -> bool:
    item_tags = set(item.tags)
    return all(tag in item_tags for tag in tags)


def filter_menu(tags: Sequence[str] = (), budget: Optional[int] = None) -> Tuple[MenuItem, ...]:
    items = [item for item in MENU if _matches_all_tags(item, tags)]
    if budget is not None:
        items = [item for item in items if item.price <= budget]
    return tuple(items)


def _mentioned_item(question: str) -> Optional[MenuItem]:
    q = normalize(question)
    matches = [item for item in MENU if f" {normalize(item.name)} " in f" {q} "]
    if not matches:
        return None
    return max(matches, key=lambda item: len(normalize(item.name)))


def _rank(items: Sequence[MenuItem], value_first: bool = False) -> Tuple[MenuItem, ...]:
    if value_first:
        return tuple(sorted(items, key=lambda item: (item.price, not item.popular, item.name)))
    return tuple(sorted(items, key=lambda item: (not item.popular, item.price, item.name)))


def _menu_cards(items: Sequence[MenuItem], intro: str) -> str:
    lines = [intro]
    for item in items[:5]:
        badge = " · *Popular on Foodpanda*" if item.popular else ""
        lines.append(
            f"- **{item.name} — {money(item.price)}**{badge}  \n"
            f"  {item.description}"
        )
    lines.append(f"*{PRICE_NOTE}*")
    return "\n\n".join(lines)


def _menu_reply(
    text: str,
    intent: str,
    items: Sequence[MenuItem] = (),
    budget: Optional[int] = None,
) -> Reply:
    return Reply(text, "Foodpanda menu", FOODPANDA_URL, intent, tuple(items), budget)


def _faq_reply(question: str) -> Optional[Reply]:
    q = normalize(question)
    tokens = set(q.split())

    if tokens.intersection({"delivery", "deliver", "foodpanda"}) or _contains_phrase(
        q, ("home delivery", "order online", "ghar bhej", "ghar mangwa")
    ):
        return Reply(
            "Foodpanda currently lists **delivery and pick-up** for The Point. "
            "Delivery availability and fees depend on your address — check the live "
            f"[Foodpanda listing]({FOODPANDA_URL}) before ordering.",
            "Foodpanda",
            FOODPANDA_URL,
            "delivery",
        )

    if tokens.intersection({"hours", "hour", "timing", "timings"}) or _contains_phrase(
        q, ("opening time", "closing time", "what time", "kitne baje", "kab khul", "kab band", "open kab", "close kab")
    ) or tokens.intersection({"open", "close", "closing"}):
        return Reply(
            "The official website currently shows **conflicting hours**: its site "
            f"footer says **{BUSINESS['hours_footer']}**, while the Phase 6 outlet "
            f"listing says **{BUSINESS['hours_phase6']}**. Please confirm before visiting "
            f"by calling **{BUSINESS['phone']}** or checking "
            f"[@thepointlhr]({INSTAGRAM_URL}).",
            "Official website · conflicting listings",
            f"{WEBSITE_URL}location",
            "hours",
        )

    if tokens.intersection({"location", "address", "kidhar", "kahan", "pata"}) or _contains_phrase(
        q, ("where are you", "where is the point", "where located", "how to reach")
    ):
        return Reply(
            f"The Point is at **{BUSINESS['location']}**. "
            f"You can confirm it on the [official website]({WEBSITE_URL}).",
            "Official website",
            WEBSITE_URL,
            "location",
        )

    if tokens.intersection({"phone", "contact", "call", "number", "rabta"}) or _contains_phrase(
        q, ("get in touch", "phone number", "contact details")
    ):
        return Reply(
            f"The official contact number is **{BUSINESS['phone']}**.",
            "Official website",
            WEBSITE_URL,
            "contact",
        )

    if "instagram" in tokens or "thepointlhr" in tokens:
        return Reply(
            f"The Point’s public Instagram profile is [@thepointlhr]({INSTAGRAM_URL}).",
            "Instagram",
            INSTAGRAM_URL,
            "instagram",
        )
    return None


def _fuzzy_matches(question: str) -> Tuple[MenuItem, ...]:
    q = normalize(question)
    query_tokens = {token for token in q.split() if len(token) > 2 and token not in STOP_WORDS}
    if not query_tokens:
        return ()

    scored = []
    for item in MENU:
        haystack = normalize(" ".join((item.name, item.category, item.description, *item.tags)))
        item_tokens = set(haystack.split())
        overlap = len(query_tokens.intersection(item_tokens))
        name_similarity = SequenceMatcher(None, q, normalize(item.name)).ratio()
        if overlap:
            score = overlap * 2 + name_similarity
            scored.append((score, item))

    scored.sort(key=lambda pair: (-pair[0], pair[1].price, pair[1].name))
    if not scored or scored[0][0] < 2.25:
        return ()
    best = scored[0][0]
    return tuple(item for score, item in scored if score >= best - 0.55)[:5]


def answer(question: str) -> Reply:
    """Answer a user question using only the verified local knowledge base."""
    if not question or not question.strip():
        return Reply(
            "Ask me about The Point’s menu, list prices, hours, location, contact or delivery.",
            intent="empty",
        )

    faq = _faq_reply(question)
    if faq:
        return faq

    q = normalize(question)
    budget = extract_budget(question)
    tags = requested_tags(question)
    exact_item = _mentioned_item(question)

    # Entity lookup takes priority over broad category words such as "iced".
    if exact_item:
        comparison = ""
        if budget is not None:
            comparison = (
                f" It is within your {money(budget)} budget."
                if exact_item.price <= budget
                else f" It is above your {money(budget)} budget."
            )
        text = (
            f"**{exact_item.name} — {money(exact_item.price)}**  \n"
            f"{exact_item.description}{comparison}\n\n*{PRICE_NOTE}*"
        )
        return _menu_reply(text, "item_lookup", (exact_item,), budget)

    candidates = filter_menu(tags, budget)
    cheap = _contains_phrase(q, CHEAP_WORDS)
    recommend = cheap or _contains_phrase(q, RECOMMEND_WORDS)

    if tags or budget is not None:
        if not candidates:
            nearest = _rank(filter_menu(tags), value_first=True)
            detail = ""
            if nearest:
                detail = f" The lowest-priced match is **{nearest[0].name} — {money(nearest[0].price)}**."
            scope = " and ".join(tags) if tags else "menu item"
            limit = f" within {money(budget)}" if budget is not None else ""
            return _menu_reply(
                f"I couldn’t find a listed {scope}{limit}.{detail}\n\n*{PRICE_NOTE}*",
                "no_match",
                nearest[:1],
                budget,
            )

        ranked = _rank(candidates, value_first=cheap)
        scope = " ".join(tags) if tags else "menu"
        budget_text = f" within {money(budget)}" if budget is not None else ""
        if cheap:
            intro = f"Here are the best-value {scope} options{budget_text}:"
        elif recommend:
            intro = f"Here are a few strong {scope} picks{budget_text}:"
        else:
            intro = f"These {scope} options match{budget_text}:"
        return _menu_reply(_menu_cards(ranked, intro), "recommendation", ranked[:5], budget)

    if recommend:
        ranked = _rank(MENU, value_first=cheap)
        intro = "Here are the lowest-priced options:" if cheap else "Here are a few popular picks across the menu:"
        return _menu_reply(_menu_cards(ranked, intro), "recommendation", ranked[:5])

    fuzzy = _fuzzy_matches(question)
    if fuzzy:
        return _menu_reply(
            _menu_cards(_rank(fuzzy, value_first=True), "Closest menu matches:"),
            "search",
            fuzzy,
        )

    return Reply(
        "I couldn’t verify that from The Point’s public sources, so I don’t want to guess. "
        "I can help with **menu items and prices, recommendations by budget, opening hours, "
        "location, contact, Instagram, and delivery**. Try: “Cold coffee under Rs. 800.”",
        intent="unknown",
    )


__all__ = [
    "BUSINESS",
    "FOODPANDA_URL",
    "INSTAGRAM_URL",
    "MENU",
    "MENU_CHECKED",
    "MenuItem",
    "PRICE_NOTE",
    "Reply",
    "WEBSITE_URL",
    "answer",
    "extract_budget",
    "filter_menu",
    "money",
    "normalize",
    "requested_tags",
]
