const matrix = document.querySelector<HTMLElement>("[data-matrix]");
if (matrix) {
  const form = matrix.querySelector<HTMLFormElement>("[data-filters]")!;
  const query = form.elements.namedItem("q") as HTMLInputElement;
  const category = form.elements.namedItem("category") as HTMLSelectElement;
  const availability = form.elements.namedItem(
    "availability",
  ) as HTMLSelectElement;
  const rows = [...matrix.querySelectorAll<HTMLElement>("[data-record-row]")];
  const defaultDetail = matrix.querySelector<HTMLElement>(
    "[data-default-detail]",
  )!;
  const detail = matrix.querySelector<HTMLElement>("[data-selected-detail]")!;
  let selected = "";
  const select = (id: string) => {
    const template = [
      ...matrix.querySelectorAll<HTMLTemplateElement>("[data-detail-template]"),
    ].find((item) => item.dataset.detailTemplate === id);
    detail.replaceChildren();
    selected = template ? id : "";
    defaultDetail.hidden = Boolean(template);
    if (template) detail.append(template.content.cloneNode(true));
    rows.forEach((row) => {
      const a = row.querySelector("a")!;
      if (row.dataset.id === selected) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  const updateUrl = () => {
    const url = new URL(location.href);
    [
      ["q", query.value.trim()],
      ["category", category.value === "all" ? "" : category.value],
      ["availability", availability.value === "all" ? "" : availability.value],
      ["record", selected],
    ].forEach(([key, value]) =>
      value ? url.searchParams.set(key!, value) : url.searchParams.delete(key!),
    );
    history.replaceState(null, "", url);
  };
  const filter = (writeUrl = true) => {
    const value = query.value.trim().toLocaleLowerCase();
    let count = 0;
    rows.forEach((row) => {
      row.hidden = !(
        (category.value === "all" || row.dataset.category === category.value) &&
        (availability.value === "all" ||
          row.dataset.availability === availability.value) &&
        (row.dataset.search || "").toLocaleLowerCase().includes(value)
      );
      if (!row.hidden) count++;
    });
    matrix
      .querySelectorAll<HTMLElement>("[data-category-group]")
      .forEach((group) => {
        group.hidden = ![
          ...group.querySelectorAll<HTMLElement>("[data-record-row]"),
        ].some((row) => !row.hidden);
      });
    const active = Boolean(
      value || category.value !== "all" || availability.value !== "all",
    );
    matrix.querySelector<HTMLElement>("[data-result-count]")!.textContent =
      active
        ? `${count} 条匹配记录 / 共 ${rows.length} 条公开记录`
        : `${rows.length} 条公开记录`;
    matrix.querySelector<HTMLElement>("[data-no-results]")!.hidden = !(
      count === 0 && active
    );
    const initial = matrix.querySelector<HTMLElement>("[data-initial-empty]");
    if (initial) initial.hidden = active;
    if (
      selected &&
      !rows.some((row) => row.dataset.id === selected && !row.hidden)
    )
      select("");
    if (writeUrl) updateUrl();
  };
  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    query.value = params.get("q") || "";
    category.value = params.get("category") || "all";
    if (!category.value) category.value = "all";
    availability.value = params.get("availability") || "all";
    if (!availability.value) availability.value = "all";
    select(params.get("record") || "");
    filter(false);
  };
  form.hidden = false;
  readUrl();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filter();
  });
  form.addEventListener("input", () => filter());
  form.addEventListener("change", () => filter());
  form.addEventListener("reset", () => {
    query.value = "";
    category.value = "all";
    availability.value = "all";
    select("");
    filter();
  });
  matrix.querySelector("[data-clear]")?.addEventListener("click", () => {
    form.reset();
    query.focus();
  });
  matrix
    .querySelectorAll<HTMLAnchorElement>("[data-record-link]")
    .forEach((link) =>
      link.addEventListener("click", (event) => {
        if (
          !matchMedia("(min-width: 1024px)").matches ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        select(link.dataset.recordLink!);
        updateUrl();
      }),
    );
  addEventListener("popstate", readUrl);
}
