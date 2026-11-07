export const MAILERLITE_ACCOUNT_ID = "2775560";
export const MAILERLITE_FORM_ID = "203448778604151877";
export const MAILERLITE_SUBSCRIBE_URL = `https://assets.mailerlite.com/jsonp/${MAILERLITE_ACCOUNT_ID}/forms/${MAILERLITE_FORM_ID}/subscribe`;
export const COMMENT_MAX_LENGTH = 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || "").trim());
}

export function truncateComments(value) {
  return String(value || "").slice(0, COMMENT_MAX_LENGTH);
}

function fieldParams({ firstName, lastName, email, comments }) {
  const params = new URLSearchParams({
    "fields[name]": firstName,
    "fields[last_name]": lastName,
    "fields[email]": email,
    "ml-submit": "1",
    anticsrf: "true",
  });
  if (comments) params.set("fields[comments]", truncateComments(comments));
  return params;
}

function subscribeViaJsonp(fields) {
  return new Promise((resolve, reject) => {
    const callback = `mlcb_${Date.now()}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callback];
      script.remove();
    };
    window[callback] = (data) => {
      cleanup();
      if (data?.success === false) {
        reject(new Error(data.message || "Could not join the list. Please try again."));
        return;
      }
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the email list. Please try again."));
    };
    script.src = `${MAILERLITE_SUBSCRIBE_URL}?${fieldParams(fields).toString()}&callback=${callback}`;
    document.body.appendChild(script);
  });
}

export async function subscribeToMailerLite(fields) {
  try {
    const response = await fetch(MAILERLITE_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: fieldParams(fields),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Could not join the list. Please try again.");
    }
    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      return subscribeViaJsonp(fields);
    }
    throw error;
  }
}
