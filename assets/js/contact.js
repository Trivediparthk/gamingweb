import { getContactState } from "./site-config.js";
import "./site-chrome.js?v=20261027herodeck";

const form = document.querySelector("[data-contact-form]");
const status = document.querySelector("[data-contact-status]");
const channel = document.querySelector("[data-contact-channel]");
const state = getContactState();

if (channel) {
  if (state.configured) {
    channel.innerHTML = `<a class="text-link" href="mailto:${encodeURIComponent(state.email)}">${state.email} <span aria-hidden="true">↗</span></a>`;
  } else {
    channel.innerHTML = `
      <p class="eyebrow eyebrow--plain" style="margin-top:.9rem">Contact details pending launch</p>
      <p style="margin-top:.5rem">A monitored contact address will be published here before launch. This preview form prepares a draft but does not transmit it.</p>
    `;
  }
}

function setStatus(message, success = false) {
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("is-success", success);
}

async function copyDraft(draft) {
  try {
    await navigator.clipboard.writeText(draft);
    setStatus(
      "Your message draft has been copied to the clipboard. Automatic delivery is not enabled in this release, so it has not been sent. Please use the channel through which this preview was shared.",
      true,
    );
  } catch {
    setStatus(
      "This build has no message delivery configured. Please use the channel through which the preview was shared and include the details from this form.",
    );
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const name = data.get("name")?.toString().trim() || "";
  const email = data.get("email")?.toString().trim() || "";
  const topic = data.get("topic")?.toString() || "General enquiry";
  const message = data.get("message")?.toString().trim() || "";
  const draft = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic}`,
    "",
    message,
  ].join("\n");

  if (state.configured) {
    const subject = encodeURIComponent(`[Robloxsplay] ${topic}`);
    const body = encodeURIComponent(draft);
    window.location.href = `mailto:${state.email}?subject=${subject}&body=${body}`;
    setStatus(
      "Your email app should now open with the message prepared. Nothing is sent until you choose to send it.",
      true,
    );
    return;
  }

  await copyDraft(draft);
});

const topicSelect = form?.querySelector('select[name="topic"]');
if (topicSelect) {
  topicSelect.addEventListener("change", () => {
    if (topicSelect.value === "Game submission") {
      setStatus(
        "For third-party submissions, include the provider, official embed URL and written authorisation. Nothing is published without both.",
      );
    }
  });
}
