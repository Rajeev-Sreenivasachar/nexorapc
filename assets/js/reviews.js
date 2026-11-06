(function () {
  "use strict";

  const REVIEWS_KEY = "nexora_genuine_feedback_v1";
  const form = document.getElementById("review-form");
  const list = document.getElementById("reviews-list");
  const emptyState = document.getElementById("reviews-empty");
  const textInput = document.getElementById("review-text");

  function getReviews() {
    const saved = window.Nexora.readJson(REVIEWS_KEY, []);
    if (!Array.isArray(saved)) return [];
    return saved.filter(function (review) {
      return review && typeof review.text === "string" && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5;
    });
  }

  function starText(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  function createReviewCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";
    const top = document.createElement("div");
    top.className = "review-card-top";
    const person = document.createElement("div");
    const name = document.createElement("h2");
    name.textContent = review.name || "Anonymous visitor";
    const date = document.createElement("small");
    date.textContent = new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    person.append(name, date);
    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = starText(review.rating);
    stars.setAttribute("aria-label", review.rating + " out of 5 stars");
    top.append(person, stars);
    const copy = document.createElement("p");
    copy.textContent = review.text;
    const label = document.createElement("small");
    label.className = "local-review-label";
    label.textContent = "Website feedback · stored on this device";
    card.append(top, copy, label);
    return card;
  }

  function render() {
    const reviews = getReviews();
    list.replaceChildren();
    reviews.slice().reverse().forEach(function (review) { list.appendChild(createReviewCard(review)); });
    emptyState.hidden = reviews.length > 0;
    list.hidden = reviews.length === 0;
    const count = document.getElementById("review-count");
    const average = document.getElementById("review-average");
    const stars = document.getElementById("summary-stars");
    if (!reviews.length) {
      count.textContent = "No feedback submitted yet";
      average.textContent = "—";
      stars.textContent = "☆☆☆☆☆";
      stars.setAttribute("aria-label", "No rating yet");
      return;
    }
    const score = reviews.reduce(function (total, review) { return total + review.rating; }, 0) / reviews.length;
    count.textContent = reviews.length + (reviews.length === 1 ? " genuine submission" : " genuine submissions") + " on this device";
    average.textContent = score.toFixed(1);
    stars.textContent = starText(Math.round(score));
    stars.setAttribute("aria-label", score.toFixed(1) + " out of 5 stars");
  }

  textInput.addEventListener("input", function () {
    document.getElementById("review-character-count").textContent = textInput.value.length;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const reviews = getReviews();
    reviews.push({
      id: String(Date.now()),
      name: document.getElementById("review-name").value.trim().slice(0, 40),
      rating: Number(document.getElementById("review-rating").value),
      text: textInput.value.trim().slice(0, 600),
      createdAt: new Date().toISOString()
    });
    window.Nexora.writeJson(REVIEWS_KEY, reviews.slice(-50));
    form.reset();
    document.getElementById("review-character-count").textContent = "0";
    render();
    window.Nexora.showToast("Your feedback was saved on this device.");
  });

  render();
})();
