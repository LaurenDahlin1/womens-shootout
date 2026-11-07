const CONTACT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSclAXxG3iZwWPn2FGfBRdRfg8orZdwh_wFm3Ey4A5KO2nCFTQ/formResponse";

const ENTRY = {
  firstName: "108047567",
  lastName: "297840056",
  email: "2034485289",
  subject: "1460484486",
  message: "1152255235",
};

export async function submitContactForm({ firstName, lastName, email, subject, message }) {
  const body = new URLSearchParams();
  body.set(`entry.${ENTRY.firstName}`, firstName);
  body.set(`entry.${ENTRY.lastName}`, lastName);
  body.set(`entry.${ENTRY.email}`, email);
  body.set(`entry.${ENTRY.subject}`, subject);
  body.set(`entry.${ENTRY.message}`, message);

  try {
    await fetch(CONTACT_FORM_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new Error("Could not send your message. Please try again.");
  }
}
