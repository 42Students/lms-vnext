function responseData(error) {
  return error?.response?.data && typeof error.response.data === "object" ? error.response.data : {};
}

function normalizeMessage(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value.map(normalizeMessage).filter(Boolean);
    return messages.length ? messages.join(" ") : null;
  }
  if (value && typeof value === "object") {
    return normalizeMessage(value.message ?? value.defaultMessage ?? value.error);
  }
  return null;
}

function fieldEntries(error) {
  const data = responseData(error);
  const sources = [data.fieldErrors, data.validationErrors, data.errors];

  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      const entries = source
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const field = item.field ?? item.name ?? item.property ?? item.path;
          const message = normalizeMessage(item.message ?? item.defaultMessage ?? item.error);
          return field && message ? [String(field), message] : null;
        })
        .filter(Boolean);
      if (entries.length) return entries;
      continue;
    }
    if (typeof source === "object") {
      const entries = Object.entries(source)
        .map(([field, value]) => {
          const message = normalizeMessage(value);
          return message ? [field, message] : null;
        })
        .filter(Boolean);
      if (entries.length) return entries;
    }
  }
  return [];
}

export function getServerFormError(error, fallback = "The form could not be saved. Please review it and try again.") {
  const data = responseData(error);
  return normalizeMessage(data.message)
    || normalizeMessage(data.error)
    || normalizeMessage(error?.message)
    || fallback;
}

/**
 * Maps structured server validation errors into Ant Design Form fields.
 * Returns true when at least one field error was applied.
 */
export function applyServerFieldErrors(form, error, aliases = {}) {
  if (!form?.setFields) return false;
  const entries = fieldEntries(error);
  if (!entries.length) return false;

  form.setFields(entries.map(([field, message]) => ({
    name: aliases[field] ?? field,
    errors: [message],
  })));
  return true;
}
