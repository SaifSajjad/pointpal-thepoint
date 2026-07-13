"""Streamlit interface for PointPal."""

import streamlit as st

from pointpal import (
    BUSINESS,
    FOODPANDA_URL,
    INSTAGRAM_URL,
    MENU,
    MENU_CHECKED,
    WEBSITE_URL,
    answer,
)


st.set_page_config(
    page_title="PointPal · The Point Concierge",
    page_icon="☕",
    layout="wide",
    initial_sidebar_state="collapsed",
)


CSS = """
<style>
:root {
  --ink: #211b17;
  --espresso: #241a14;
  --roast: #4c3326;
  --caramel: #c88d52;
  --cream: #f6f0e6;
  --paper: #fffdf8;
  --line: #dfd2c2;
  --sage: #66725b;
}

.stApp {
  background:
    radial-gradient(circle at 8% 4%, rgba(200, 141, 82, .14), transparent 28rem),
    radial-gradient(circle at 92% 18%, rgba(102, 114, 91, .12), transparent 25rem),
    var(--cream);
  color: var(--ink);
}

[data-testid="stHeader"] { background: transparent; }
[data-testid="stToolbar"] { right: 1rem; }
.block-container { max-width: 1080px; padding-top: 2.5rem; padding-bottom: 7rem; }

.hero {
  position: relative;
  overflow: hidden;
  min-height: 290px;
  padding: clamp(1.8rem, 5vw, 3.5rem);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 32px;
  background:
    radial-gradient(circle at 86% 26%, rgba(200,141,82,.38), transparent 19rem),
    linear-gradient(135deg, #1d1713 0%, #36251c 58%, #55402f 100%);
  box-shadow: 0 24px 70px rgba(53, 35, 25, .2);
  color: #fffaf2;
}

.hero::after {
  content: "";
  position: absolute;
  width: 250px;
  height: 250px;
  right: -70px;
  bottom: -110px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 50%;
  box-shadow: 0 0 0 35px rgba(255,255,255,.035), 0 0 0 70px rgba(255,255,255,.025);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .38rem .72rem;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  color: #f3d7b8;
  font-size: .72rem;
  font-weight: 750;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hero h1 {
  max-width: 730px;
  margin: 1.1rem 0 .7rem;
  color: #fffaf2;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3rem, 8vw, 5.25rem);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: .94;
}

.hero h1 em { color: #dca56e; font-style: normal; }
.hero p { max-width: 620px; margin: 0; color: #e8ded3; font-size: 1.05rem; line-height: 1.6; }

.hero-meta { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.5rem; }
.hero-meta span {
  padding: .38rem .7rem;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  color: #f3e8db;
  font-size: .78rem;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .8rem;
  margin: 1rem 0 2rem;
}

.fact-card {
  padding: 1rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255,253,248,.84);
  box-shadow: 0 8px 25px rgba(53,35,25,.05);
}
.fact-card small { display: block; color: #7a6a5d; font-size: .68rem; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.fact-card strong { display: block; margin-top: .3rem; color: var(--ink); font-size: .93rem; }

.section-kicker { margin: 0 0 .1rem; color: var(--sage); font-size: .73rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.section-title { margin: 0 0 .15rem; color: var(--ink); font-family: Georgia, "Times New Roman", serif; font-size: 1.9rem; font-weight: 500; }
.section-copy { margin: 0 0 1rem; color: #76685c; font-size: .9rem; }

[data-testid="stButton"] button {
  min-height: 3rem;
  border: 1px solid #d8c6b3;
  border-radius: 16px;
  background: rgba(255,253,248,.9);
  color: #3e2b20;
  font-weight: 650;
  transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease;
}
[data-testid="stButton"] button:hover {
  border-color: var(--caramel);
  color: #2b1d16;
  box-shadow: 0 8px 20px rgba(75,48,32,.09);
  transform: translateY(-1px);
}
[data-testid="stButton"] button:focus-visible { outline: 3px solid rgba(200,141,82,.28); outline-offset: 2px; }

[data-testid="stChatMessage"] {
  margin-bottom: .7rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(216,198,179,.82);
  border-radius: 20px;
  background: rgba(255,253,248,.88);
  box-shadow: 0 8px 28px rgba(55,38,27,.045);
}
[data-testid="stChatMessage"] p { line-height: 1.62; }
[data-testid="stChatMessageAvatarUser"] { background: #e4d7c8; }
[data-testid="stChatMessageAvatarAssistant"] { background: #32231b; color: #fff; }

.source-chip {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  margin-top: .35rem;
  padding: .24rem .55rem;
  border: 1px solid #dfd2c2;
  border-radius: 999px;
  background: #f7f0e6;
  color: #6d5949 !important;
  font-size: .72rem;
  font-weight: 700;
  text-decoration: none !important;
}
.source-chip:hover { border-color: var(--caramel); color: #3a281e !important; }

[data-testid="stChatInput"] { border-color: #cdbba7; border-radius: 18px; background: var(--paper); box-shadow: 0 10px 35px rgba(54,36,25,.1); }
[data-testid="stChatInput"]:focus-within { border-color: var(--caramel); box-shadow: 0 0 0 3px rgba(200,141,82,.17); }

.trust-note {
  margin-top: 1.2rem;
  padding: .9rem 1rem;
  border-left: 3px solid var(--caramel);
  border-radius: 0 12px 12px 0;
  background: rgba(255,253,248,.62);
  color: #746357;
  font-size: .8rem;
  line-height: 1.55;
}

[data-testid="stSidebar"] { background: #f3ebdf; }
[data-testid="stSidebar"] hr { border-color: #d9cab9; }

@media (max-width: 720px) {
  .block-container { padding: 1.1rem .9rem 6.5rem; }
  .hero { min-height: 260px; padding: 1.6rem 1.3rem; border-radius: 24px; }
  .hero h1 { font-size: 3.2rem; }
  .fact-grid { grid-template-columns: 1fr; }
  .fact-card { padding: .8rem .95rem; }
}
</style>
"""

st.markdown(CSS, unsafe_allow_html=True)


if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "Welcome to **PointPal**. I use verified public information to help with "
                "The Point’s menu, list prices, budgets, hours, location and delivery. "
                "What are you in the mood for?"
            ),
            "source_label": "",
            "source_url": "",
        }
    ]


with st.sidebar:
    st.markdown("## PointPal ☕")
    st.caption("A grounded, no-paid-API fellowship demo.")
    if st.button("Start a new chat", use_container_width=True):
        st.session_state.messages = st.session_state.messages[:1]
        st.rerun()
    st.divider()
    st.markdown("**Verified sources**")
    st.markdown(f"- [Official website]({WEBSITE_URL})")
    st.markdown(f"- [Foodpanda menu]({FOODPANDA_URL})")
    st.markdown(f"- [Instagram]({INSTAGRAM_URL})")
    st.caption(
        f"Menu snapshot checked {MENU_CHECKED}. Prices and promotions can change "
        "and may differ in-store."
    )
    st.divider()
    st.markdown("**How it works**")
    st.caption(
        "Deterministic intent matching and retrieval over a curated local knowledge "
        "base. No API key, paid model or user data collection."
    )


st.markdown(
    """
    <section class="hero">
      <div class="eyebrow">The Point × QD Fellowship · Innovation &amp; AI</div>
      <h1>Meet <em>PointPal.</em></h1>
      <p>Your smart café concierge for a better brew, bite and budget — grounded in The Point’s public information.</p>
      <div class="hero-meta">
        <span>☕ Menu-aware</span>
        <span>◎ English + Roman Urdu</span>
        <span>◇ No paid API</span>
      </div>
    </section>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    f"""
    <div class="fact-grid">
      <div class="fact-card"><small>Opening hours</small><strong>Official listings conflict · Confirm first</strong></div>
      <div class="fact-card"><small>Location</small><strong>DHA Phase 6 · Lahore</strong></div>
      <div class="fact-card"><small>Verified menu</small><strong>{len(MENU)} items · Checked {MENU_CHECKED}</strong></div>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown('<p class="section-kicker">Try PointPal</p>', unsafe_allow_html=True)
st.markdown('<h2 class="section-title">Start with a quick question</h2>', unsafe_allow_html=True)
st.markdown('<p class="section-copy">Or type anything about the café or menu below.</p>', unsafe_allow_html=True)

suggestions = (
    "Best coffee under Rs. 800",
    "Recommend something cold",
    "Any desserts under Rs. 700?",
    "Koi sasti coffee suggest kro",
)
columns = st.columns(2)
clicked = None
for index, label in enumerate(suggestions):
    if columns[index % 2].button(label, key=f"suggestion-{index}", use_container_width=True):
        clicked = label

st.markdown("<br>", unsafe_allow_html=True)
st.markdown('<p class="section-kicker">Conversation</p>', unsafe_allow_html=True)
st.markdown('<h2 class="section-title">Ask your café concierge</h2>', unsafe_allow_html=True)

for message in st.session_state.messages:
    avatar = "☕" if message["role"] == "assistant" else "👤"
    with st.chat_message(message["role"], avatar=avatar):
        st.markdown(message["content"])
        if message.get("source_url"):
            st.markdown(
                f'<a class="source-chip" href="{message["source_url"]}" target="_blank">↗ Source · {message["source_label"]}</a>',
                unsafe_allow_html=True,
            )

prompt = st.chat_input("Ask about prices, budgets, hours, location or delivery…")
prompt = clicked or prompt
if prompt:
    st.session_state.messages.append(
        {"role": "user", "content": prompt, "source_label": "", "source_url": ""}
    )
    reply = answer(prompt)
    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": reply.text,
            "source_label": reply.source_label,
            "source_url": reply.source_url,
        }
    )
    st.rerun()

st.markdown(
    f"""
    <div class="trust-note">
      <strong>Grounded by design.</strong> PointPal answers only from the official website,
      the public Foodpanda menu and The Point’s public Instagram. Menu list prices were checked
      {MENU_CHECKED}; prices, promotions and in-store availability may change.
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("About this fellowship demo"):
    st.write(
        "PointPal uses lightweight, deterministic retrieval rather than a generative AI API. "
        "That keeps answers fast, transparent, grounded and free to host. The same retrieval "
        "layer can later connect to a live menu source or customer-messaging channel."
    )
    st.markdown(
        f"Questions about information not listed publicly can be confirmed with The Point at **{BUSINESS['phone']}**."
    )
