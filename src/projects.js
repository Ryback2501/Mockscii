// Named projects autosaved to the browser's localStorage. Each project is the
// same JSON document Export produces, stored under `mockscii:project:<name>`;
// `mockscii:current` remembers which project to reopen on load. Every storage
// access is guarded — private windows or blocked site data just disable saving.

const PREFIX = 'mockscii:project:';
const CURRENT = 'mockscii:current';
export const DEFAULT_PROJECT = 'Untitled';

export function createProjectStore(storage) {
  const safe = (fn, fallback) => {
    try {
      return storage ? fn() : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    /** Saved project names, alphabetical. */
    list() {
      return safe(() => {
        const names = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(PREFIX)) names.push(key.slice(PREFIX.length));
        }
        return names.sort((a, b) => a.localeCompare(b));
      }, []);
    },
    has: (name) => safe(() => storage.getItem(PREFIX + name) !== null, false),
    /** The parsed document saved under `name`, or null. */
    load(name) {
      return safe(() => {
        const text = storage.getItem(PREFIX + name);
        return text === null ? null : JSON.parse(text);
      }, null);
    },
    /** Save a JSON string under `name`. Returns false if storage refused it. */
    save(name, text) {
      return safe(() => {
        storage.setItem(PREFIX + name, text);
        return true;
      }, false);
    },
    remove: (name) => safe(() => storage.removeItem(PREFIX + name)),
    getCurrent: () => safe(() => storage.getItem(CURRENT), null) || DEFAULT_PROJECT,
    setCurrent: (name) => safe(() => storage.setItem(CURRENT, name)),
  };
}

/**
 * Project name field + project list + New button. The ▾ button lists every
 * saved project; picking one opens it. Typing an existing project's name also
 * opens it; typing a new name renames the current project. New starts an empty
 * "Untitled N".
 */
export function createProjectControl(container, options = {}) {
  const doc = container.ownerDocument;
  const store = options.store;
  const onOpen = options.onOpen ?? (() => {});
  const onRename = options.onRename ?? (() => {});
  const onNew = options.onNew ?? (() => {});
  let current = options.initial ?? DEFAULT_PROJECT;

  const label = doc.createElement('label');
  label.className = 'project-label';
  label.textContent = 'Project';
  label.setAttribute('for', 'project-name');

  const input = doc.createElement('input');
  input.id = 'project-name';
  input.className = 'project-name';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.title = 'Autosaved in this browser. Type a new name to rename this project.';

  const menuButton = doc.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'project-menu-toggle';
  menuButton.textContent = '▾';
  menuButton.title = 'Open a saved project';
  menuButton.setAttribute('aria-haspopup', 'listbox');
  menuButton.setAttribute('aria-expanded', 'false');

  const menu = doc.createElement('div');
  menu.className = 'project-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  const newButton = doc.createElement('button');
  newButton.type = 'button';
  newButton.className = 'project-new';
  newButton.textContent = 'New';
  newButton.title = 'Start a new, empty project';

  const status = doc.createElement('span');
  status.className = 'project-status';

  function refresh() {
    input.value = current;
  }

  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }

  // Rebuild the list from storage each time it opens, current project marked.
  function openMenu() {
    const names = store.list();
    if (!names.includes(current)) names.push(current);
    names.sort((a, b) => a.localeCompare(b));
    menu.replaceChildren(
      ...names.map((name) => {
        const item = doc.createElement('button');
        item.type = 'button';
        item.className = 'project-menu-item';
        item.textContent = name;
        item.setAttribute('role', 'option');
        const on = name === current;
        item.classList.toggle('current', on);
        item.setAttribute('aria-selected', String(on));
        item.addEventListener('click', () => {
          closeMenu();
          if (name === current) return;
          onOpen(name);
          current = name;
          refresh();
        });
        return item;
      }),
    );
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
  }

  menuButton.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  doc.addEventListener('mousedown', (ev) => {
    if (!menu.hidden && !container.contains(ev.target)) closeMenu();
  });
  doc.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !menu.hidden) closeMenu();
  });

  input.addEventListener('change', () => {
    const name = input.value.trim();
    if (!name || name === current) {
      refresh();
      return;
    }
    if (store.has(name)) onOpen(name);
    else onRename(current, name);
    current = name;
    refresh();
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') input.blur();
    if (ev.key === 'Escape') {
      refresh();
      input.blur();
    }
  });

  newButton.addEventListener('click', () => {
    let n = 1;
    let name = DEFAULT_PROJECT;
    while (store.has(name)) name = `${DEFAULT_PROJECT} ${++n}`;
    onNew(name);
    current = name;
    refresh();
  });

  container.replaceChildren(label, input, menuButton, menu, newButton, status);
  refresh();

  return {
    element: container,
    input,
    menuButton,
    menu,
    newButton,
    refresh,
    getName: () => current,
    // Flag an autosave that the browser refused (quota, blocked storage).
    setStatus(ok) {
      status.textContent = ok ? '' : 'Not saved';
      status.title = ok ? '' : 'This browser refused to store the project';
    },
  };
}
