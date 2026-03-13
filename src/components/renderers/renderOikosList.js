export function renderOikosList(data) {
  const wrapper = document.createElement("section");
  wrapper.className = "oikos-list";

  if (data.title) {
    const heading = document.createElement("h3");
    heading.className = "oikos-list__title";
    heading.textContent = data.title;
    wrapper.appendChild(heading);
  }

  const list = document.createElement("div");
  list.className = "oikos-list__items";

  (data.items || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "oikos-list__item";

    if (item.name) {
      const name = document.createElement("h4");
      name.className = "oikos-list__name";
      name.textContent = item.name;
      card.appendChild(name);
    }

    if (item.relationship) {
      const relationship = document.createElement("div");
      relationship.className = "oikos-list__relationship";
      relationship.textContent = item.relationship;
      card.appendChild(relationship);
    }

    if (item.notes) {
      const notes = document.createElement("p");
      notes.className = "oikos-list__notes";
      notes.textContent = item.notes;
      card.appendChild(notes);
    }

    list.appendChild(card);
  });

  wrapper.appendChild(list);

  return wrapper;
}