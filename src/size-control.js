// Canvas size control: cols x rows number inputs plus a Fit button. Blank
// inputs mean auto-fit (their placeholders show the live fitted size); entering
// a size fixes the grid at exactly that many cells. A blank axis next to a
// filled one keeps the grid's current value for that axis (shown as its
// placeholder).
export function createSizeControl(container, options = {}) {
  const doc = container.ownerDocument;
  const onChange = options.onChange ?? (() => {});
  const getDims = options.getDims ?? (() => ({ cols: 0, rows: 0 }));

  const label = doc.createElement('label');
  label.className = 'size-label';
  label.textContent = 'Size';
  label.setAttribute('for', 'size-cols');

  const makeInput = (id, title) => {
    const input = doc.createElement('input');
    input.type = 'number';
    input.id = id;
    input.className = 'size-input';
    input.min = '1';
    input.max = '1000';
    input.step = '1';
    input.title = title;
    return input;
  };
  const colsInput = makeInput('size-cols', 'Columns');
  const rowsInput = makeInput('size-rows', 'Rows');

  const times = doc.createElement('span');
  times.className = 'size-times';
  times.textContent = '×';

  const fitButton = doc.createElement('button');
  fitButton.type = 'button';
  fitButton.className = 'size-fit';
  fitButton.textContent = 'Fit';
  fitButton.title = 'Auto-fit the canvas to the window';

  const parse = (input) => {
    const n = Math.floor(Number(input.value));
    return input.value !== '' && n > 0 ? n : null;
  };

  function commit() {
    const cols = parse(colsInput);
    const rows = parse(rowsInput);
    if (cols === null && rows === null) {
      onChange(null);
    } else {
      const dims = getDims();
      onChange({ cols: cols ?? dims.cols, rows: rows ?? dims.rows });
    }
    refresh();
  }

  // Show the live grid size as placeholders and mark Fit active when auto-fitting.
  function refresh() {
    const dims = getDims();
    colsInput.placeholder = String(dims.cols);
    rowsInput.placeholder = String(dims.rows);
    const fitting = colsInput.value === '' && rowsInput.value === '';
    fitButton.classList.toggle('active', fitting);
    fitButton.setAttribute('aria-pressed', String(fitting));
  }

  colsInput.addEventListener('change', commit);
  rowsInput.addEventListener('change', commit);
  fitButton.addEventListener('click', () => {
    colsInput.value = '';
    rowsInput.value = '';
    commit();
  });

  container.replaceChildren(label, colsInput, times, rowsInput, fitButton);
  refresh();

  return {
    element: container,
    colsInput,
    rowsInput,
    fitButton,
    refresh,
    // Reflect a size set elsewhere (e.g. an imported file) without firing onChange.
    setValue(size) {
      colsInput.value = size ? String(size.cols) : '';
      rowsInput.value = size ? String(size.rows) : '';
      refresh();
    },
  };
}
