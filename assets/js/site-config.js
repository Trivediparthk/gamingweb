export const siteConfig = {
  name: "Robloxsplay",
  shortName: "ROBLOXSPLAY",
  tagline: "Small games. Sharp ideas.",
  description:
    "An independent browser arcade for original, quick-to-play games. No installs, no accounts, no filler.",
  domain: "",
  canonicalBase: "",
  contactEmail: "",
  legalEntity: "",
  locale: "en_GB",
  launched: "2026",
  thirdPartyIntegrationTarget: 15,
};

export function getContactState() {
  const email = siteConfig.contactEmail.trim();
  return {
    configured: Boolean(email),
    email,
    message: email
      ? `Email ${email} and we will reply within two working days.`
      : "Contact delivery is not configured in this build. The client must supply a monitored contact address before launch.",
  };
}
