import { normalizeSearchText } from '@/utils/search';

export const PAGE_SIZE = 12;

export const SORT_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre: A – Z' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];
const DEFAULT_SORT: SortValue = 'recientes';

export interface FilterState {
  category: string;
  query: string;
  sort: SortValue;
}

interface ProductItem {
  element: HTMLElement;
  category: string;
  search: string;
  name: string;
  price: number;
  date: number;
}

const isSortValue = (value: string | null): value is SortValue =>
  SORT_OPTIONS.some((option) => option.value === value);

export function parseFilters(
  params: URLSearchParams,
  validCategories: readonly string[],
): FilterState {
  const category = params.get('categoria') ?? '';
  const sort = params.get('orden');
  return {
    category: validCategories.includes(category) ? category : '',
    query: (params.get('q') ?? '').trim(),
    sort: isSortValue(sort) ? sort : DEFAULT_SORT,
  };
}

/** Only non-default values go in the URL so shared links stay short. */
export function serializeFilters(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category) params.set('categoria', state.category);
  if (state.query) params.set('q', state.query);
  if (state.sort !== DEFAULT_SORT) params.set('orden', state.sort);
  const search = params.toString();
  return search ? `?${search}` : '';
}

function matches(item: ProductItem, state: FilterState): boolean {
  if (state.category && item.category !== state.category) return false;
  if (!state.query) return true;
  const terms = normalizeSearchText(state.query).split(/\s+/);
  return terms.every((term) => item.search.includes(term));
}

const COMPARATORS: Record<SortValue, (a: ProductItem, b: ProductItem) => number> = {
  recientes: (a, b) => b.date - a.date,
  'precio-asc': (a, b) => a.price - b.price,
  'precio-desc': (a, b) => b.price - a.price,
  nombre: (a, b) => a.name.localeCompare(b.name, 'es'),
};

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export function initCatalogFilters(): void {
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const grid = document.querySelector<HTMLElement>('[data-product-grid]');
  const searchInput = form?.querySelector<HTMLInputElement>('[data-filter-search]');
  const sortSelect = form?.querySelector<HTMLSelectElement>('[data-filter-sort]');
  const status = form?.querySelector<HTMLElement>('[data-results-status]');
  const resetButton = form?.querySelector<HTMLButtonElement>('[data-filters-reset]');
  const emptyState = document.querySelector<HTMLElement>('[data-empty-state]');
  const loadMore = document.querySelector<HTMLButtonElement>('[data-load-more]');
  const loadMoreWrapper = document.querySelector<HTMLElement>('[data-load-more-wrapper]');
  const progress = document.querySelector<HTMLElement>('[data-load-progress]');
  if (!form || !grid || !searchInput || !sortSelect || !status || !resetButton) return;

  const categoryInputs = [...form.querySelectorAll<HTMLInputElement>('[data-filter-category]')];
  const validCategories = categoryInputs.map((input) => input.value).filter(Boolean);

  const items: ProductItem[] = [...grid.querySelectorAll<HTMLElement>('[data-product-item]')].map(
    (element) => {
      const card = element.querySelector<HTMLElement>('[data-product]');
      return {
        element,
        category: card?.dataset['category'] ?? '',
        search: card?.dataset['search'] ?? '',
        name: card?.dataset['name'] ?? '',
        price: Number(card?.dataset['price'] ?? 0),
        date: Number(card?.dataset['date'] ?? 0),
      };
    },
  );

  let visibleLimit = PAGE_SIZE;
  let searchTimer: number | undefined;

  const readForm = (): FilterState => {
    const checked = categoryInputs.find((input) => input.checked);
    return {
      category: checked?.value ?? '',
      query: searchInput.value.trim(),
      sort: isSortValue(sortSelect.value) ? sortSelect.value : DEFAULT_SORT,
    };
  };

  const writeForm = (state: FilterState) => {
    searchInput.value = state.query;
    sortSelect.value = state.sort;
    categoryInputs.forEach((input) => {
      input.checked = input.value === state.category;
    });
  };

  const render = ({ announce }: { announce: boolean }) => {
    const state = readForm();
    const matching = items.filter((item) => matches(item, state)).sort(COMPARATORS[state.sort]);
    const matchingSet = new Set(matching);

    // Reordering the DOM (not just CSS order) keeps tab order consistent with the visual order.
    const fragment = document.createDocumentFragment();
    matching.forEach((item, index) => {
      item.element.hidden = index >= visibleLimit;
      fragment.append(item.element);
    });
    items.forEach((item) => {
      if (!matchingSet.has(item)) {
        item.element.hidden = true;
        fragment.append(item.element);
      }
    });
    grid.append(fragment);

    const shown = Math.min(matching.length, visibleLimit);
    const hasFilters = Boolean(state.category || state.query || state.sort !== DEFAULT_SORT);

    grid.hidden = matching.length === 0;
    if (emptyState) emptyState.hidden = matching.length > 0;
    if (loadMoreWrapper) loadMoreWrapper.hidden = shown >= matching.length;
    if (progress) progress.textContent = `Mostrando ${shown} de ${matching.length}`;
    resetButton.disabled = !hasFilters;

    if (announce) {
      status.textContent =
        matching.length === 0
          ? 'No se encontraron productos'
          : `${pluralize(matching.length, 'producto encontrado', 'productos encontrados')}`;
    }

    const url = `${window.location.pathname}${serializeFilters(state)}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    return matching;
  };

  const update = () => {
    visibleLimit = PAGE_SIZE;
    render({ announce: true });
  };

  const reset = () => {
    writeForm({ category: '', query: '', sort: DEFAULT_SORT });
    update();
  };

  writeForm(parseFilters(new URLSearchParams(window.location.search), validCategories));
  render({ announce: false });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.clearTimeout(searchTimer);
    update();
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    reset();
    searchInput.focus();
  });
  categoryInputs.forEach((input) => input.addEventListener('change', update));
  sortSelect.addEventListener('change', update);
  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(update, 250);
  });

  document.querySelector('[data-empty-reset]')?.addEventListener('click', () => {
    reset();
    searchInput.focus();
  });

  loadMore?.addEventListener('click', () => {
    const previousLimit = visibleLimit;
    visibleLimit += PAGE_SIZE;
    const matching = render({ announce: false });
    // Move focus to the first newly revealed product so keyboard users continue from there.
    matching[previousLimit]?.element.querySelector<HTMLAnchorElement>('a')?.focus();
  });
}
