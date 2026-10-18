(function () {
  "use strict";
  const form = document.getElementById("support-form");
  const status = document.getElementById("support-status");

  function showError(fieldName, message) {
    document.querySelector('[data-error="' + fieldName + '"]').textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;

    ["name", "email", "subject", "message"].forEach(function (field) { showError(field, ""); });
    if (name.length < 2) { showError("name", "Enter at least two characters."); valid = false; }
    if (!emailPattern.test(email)) { showError("email", "Enter a valid email address."); valid = false; }
    if (subject.length < 3) { showError("subject", "Enter a more specific subject."); valid = false; }
    if (message.length < 10) { showError("message", "Enter at least ten characters."); valid = false; }
    if (!valid) { status.textContent = "Fix the highlighted fields. No email was opened or sent."; return; }

    const body = "Name: " + name + "\nReply email: " + email + "\n\n" + message;
    status.textContent = "Your email app is opening with a draft. Nexora has not sent this message, and you still need to choose a recipient and press Send.";
    window.location.href = "mailto:?subject=" + encodeURIComponent("Nexora: " + subject) + "&body=" + encodeURIComponent(body);
  });
})();
