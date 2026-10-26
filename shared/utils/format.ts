export function formatDate(date: Date | string, locale = "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}
