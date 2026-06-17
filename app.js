(() => {
  const state = {
    activeSection: 'recipes',
    selectedRecipeIndex: null,
    recipes: [],
    espresso: [],
    filters: {
      recipes: '',
      espresso: ''
    }
  };

  const elements = {};
  const ESPRESSO_API_BASE_URL = window.ESPRESSO_API_BASE_URL || 'https://api.icecoke.kr';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindElements();
    bindEvents();
    setStatus('데이터를 불러오는 중입니다.');

    try {
      const [recipes, espresso] = await Promise.all([
        fetchJson('./data/recipes.json'),
        fetchJsonWithFallback(`${ESPRESSO_API_BASE_URL}/espresso`, './data/espresso-normalized-recipes.json')
      ]);

      state.recipes = Array.isArray(recipes) ? recipes : [];
      state.espresso = normalizeEspressoData(espresso);

      clearStatus();
      renderAll();
    } catch (error) {
      showError(error);
    }
  }

  function bindElements() {
    elements.status = document.getElementById('status');
    elements.tabs = Array.from(document.querySelectorAll('.section-tab'));
    elements.recipesSection = document.getElementById('recipes-section');
    elements.espressoSection = document.getElementById('espresso-section');
    elements.recipesSummary = document.getElementById('recipes-summary');
    elements.espressoSummary = document.getElementById('espresso-summary');
    elements.recipesSearch = document.getElementById('recipes-search');
    elements.espressoSearch = document.getElementById('espresso-search');
    elements.recipesList = document.getElementById('recipes-list');
    elements.recipesDetail = document.getElementById('recipes-detail');
    elements.espressoList = document.getElementById('espresso-list');
    elements.recipesEmpty = document.getElementById('recipes-empty');
    elements.espressoEmpty = document.getElementById('espresso-empty');
  }

  function bindEvents() {
    elements.tabs.forEach((tab) => {
      tab.addEventListener('click', () => setActiveSection(tab.dataset.section));
    });

    elements.recipesSearch.addEventListener('input', (event) => {
      state.filters.recipes = event.target.value;
      state.selectedRecipeIndex = null;
      renderRecipes();
    });

    elements.espressoSearch.addEventListener('input', (event) => {
      state.filters.espresso = event.target.value;
      renderEspresso();
    });
  }

  function setActiveSection(section) {
    state.activeSection = section;
    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.section === section;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    });

    elements.recipesSection.hidden = section !== 'recipes';
    elements.espressoSection.hidden = section !== 'espresso';
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`데이터를 불러오지 못했습니다: ${path} (${response.status})`);
    }
    const json = await response.json();
    return json?.success === true && Object.hasOwn(json, 'data') ? json.data : json;
  }

  async function fetchJsonWithFallback(primaryPath, fallbackPath) {
    try {
      return await fetchJson(primaryPath);
    } catch (error) {
      return fetchJson(fallbackPath);
    }
  }

  function normalizeEspressoData(data) {
    if (data?.schemaVersion === 1 && Array.isArray(data.beans)) {
      return data.beans;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((bean, beanIndex) => ({
      id: `legacy-bean-${beanIndex + 1}`,
      name: safeString(bean?.title || '원두 기록'),
      goals: asArray(bean?.recipe?.[0]?.goals),
      defaultEquipment: bean?.recipe?.[0]?.equipment || {},
      logs: asArray(bean?.recipe).map((log, logIndex) => ({
        id: `legacy-log-${beanIndex + 1}-${logIndex + 1}`,
        type: safeString(log?.type || 'espresso-log'),
        title: safeString(log?.name || log?.type || '추출 기록'),
        rounds: asArray(log?.rounds).map((round, roundIndex) => ({
          ...round,
          id: `legacy-round-${beanIndex + 1}-${logIndex + 1}-${roundIndex + 1}`,
          roundNumber: Number(round?.round || roundIndex + 1),
          analysis: {
            changes: asArray(round?.changes),
            notes: asArray(round?.notes),
            judgments: asArray(round?.judgment),
            inferences: asArray(round?.inference),
            conclusions: asArray(round?.conclusion),
            plannedComparisons: asArray(round?.plannedComparison)
          },
          nextActions: asArray(round?.nextAction)
        })),
        currentAnalysis: log?.currentAnalysis,
        adjustmentGuide: log?.adjustmentGuide,
        finalHypothesis: log?.finalHypothesis,
        nextTest: log?.nextTest,
        nextDirection: log?.nextDirection
      }))
    }));
  }

  function renderAll() {
    setActiveSection(state.activeSection);
    renderRecipes();
    renderEspresso();
  }

  function renderRecipes() {
    const query = normalize(state.filters.recipes);
    const filtered = state.recipes
      .map((recipe, index) => ({ recipe, index }))
      .filter(({ recipe }) => recipeMatches(recipe, query));

    if (state.selectedRecipeIndex != null) {
      renderRecipeDetail(state.selectedRecipeIndex);
      return;
    }

    elements.recipesSummary.textContent = `총 ${state.recipes.length}개 중 ${filtered.length}개 표시`;
    renderEmptyState(elements.recipesEmpty, filtered.length, '검색 결과가 없습니다.');
    elements.recipesList.hidden = false;
    elements.recipesDetail.hidden = true;
    elements.recipesDetail.replaceChildren();
    elements.recipesList.replaceChildren(...filtered.map(({ recipe, index }) => createRecipeCard(recipe, index)));
  }

  function renderEspresso() {
    const query = normalize(state.filters.espresso);
    const filtered = state.espresso.filter((bean) => recipeMatches(bean, query));

    elements.espressoSummary.textContent = `총 ${state.espresso.length}개 중 ${filtered.length}개 표시`;
    renderEmptyState(elements.espressoEmpty, filtered.length, '검색 결과가 없습니다.');
    elements.espressoList.replaceChildren(...filtered.map(createBeanCard));
  }

  function renderEmptyState(element, count, message) {
    if (count === 0) {
      element.textContent = message;
      element.hidden = false;
    } else {
      element.hidden = true;
      element.textContent = '';
    }
  }

  function renderRecipeDetail(index) {
    const recipe = state.recipes[index];
    if (!recipe) {
      state.selectedRecipeIndex = null;
      renderRecipes();
      return;
    }

    elements.recipesSummary.textContent = '상세 보기';
    elements.recipesEmpty.hidden = true;
    elements.recipesList.hidden = true;
    elements.recipesDetail.hidden = false;
    elements.recipesDetail.replaceChildren(createRecipeDetail(recipe));
  }

  function createRecipeCard(recipe, index) {
    const article = createElement('article', 'recipe-card');
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `${safeString(recipe?.name || '이름 없음')} 상세 보기`);
    article.dataset.recipeIndex = String(index);
    article.addEventListener('click', () => openRecipeDetail(index));
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openRecipeDetail(index);
      }
    });

    const title = createElement('h3');
    title.textContent = safeString(recipe?.name || '이름 없음');
    article.appendChild(title);

    const meta = createElement('div', 'card-meta');
    for (const tag of asArray(recipe?.tags)) {
      meta.appendChild(pill(tag));
    }
    article.appendChild(meta);

    const summary = createElement('p', 'recipe-card-summary');
    summary.textContent = `재료 ${asArray(recipe?.ingredients).length}개 · 단계 ${asArray(recipe?.recipe).length}개`;
    article.appendChild(summary);

    const hint = createElement('span', 'card-hint');
    hint.textContent = '상세 보기';
    article.appendChild(hint);

    return article;
  }

  function openRecipeDetail(index) {
    state.selectedRecipeIndex = index;
    renderRecipes();
  }

  function createRecipeDetail(recipe) {
    const article = createElement('article', 'recipe-detail-card');

    const backButton = createElement('button', 'back-button');
    backButton.type = 'button';
    backButton.dataset.action = 'back-to-recipes';
    backButton.textContent = '레시피 목록';
    backButton.addEventListener('click', () => {
      state.selectedRecipeIndex = null;
      renderRecipes();
    });
    article.appendChild(backButton);

    const title = createElement('h3');
    title.textContent = safeString(recipe?.name || '이름 없음');
    article.appendChild(title);

    const meta = createElement('div', 'card-meta');
    for (const tag of asArray(recipe?.tags)) {
      meta.appendChild(pill(tag));
    }
    article.appendChild(meta);

    article.appendChild(createGroup('재료', listFrom(recipe?.ingredients)));
    article.appendChild(createGroup('만드는 법', orderedListFrom(recipe?.recipe)));

    const sourceUrl = safeHttpUrl(recipe?.source?.url);
    if (sourceUrl) {
      const group = createElement('div', 'content-group');
      const heading = createElement('h4');
      heading.textContent = '출처';
      group.appendChild(heading);

      const link = document.createElement('a');
      link.href = sourceUrl;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.textContent = recipe?.source?.type ? `${safeString(recipe.source.type)} 링크` : '링크';
      group.appendChild(link);
      article.appendChild(group);
    }

    return article;
  }

  function createBeanCard(bean) {
    const article = createElement('article', 'bean-card espresso-bean-card');

    const logs = asArray(bean?.logs);
    article.appendChild(createBeanHeader(bean, logs));
    appendObjectSection(article, '원두 정보', bean?.productInfo);

    if (logs.length === 0) {
      article.appendChild(messageBlock('등록된 로그가 없습니다.'));
      return article;
    }

    for (const log of logs) {
      article.appendChild(createLogCard(log, bean));
    }

    return article;
  }

  function createBeanHeader(bean, logs) {
    const header = createElement('div', 'espresso-bean-header');
    const titleBlock = createElement('div', 'espresso-bean-title');

    const eyebrow = createElement('p', 'eyebrow');
    eyebrow.textContent = '에스프레소 기록';
    titleBlock.appendChild(eyebrow);

    const title = createElement('h3');
    title.textContent = safeString(bean?.name || '원두 기록');
    titleBlock.appendChild(title);

    const goals = asArray(bean?.goals);
    if (goals.length) {
      const goalsRow = createElement('div', 'espresso-goals');
      goals.forEach((goal) => goalsRow.appendChild(pill(goal)));
      titleBlock.appendChild(goalsRow);
    }

    header.appendChild(titleBlock);

    const rounds = logs.flatMap((log) => asArray(log?.rounds));
    const stats = createElement('div', 'espresso-stats');
    stats.appendChild(statBlock('기록', `${logs.length}개`));
    stats.appendChild(statBlock('라운드', `${rounds.length}회`));
    if (rounds.length) {
      const latest = rounds[rounds.length - 1];
      stats.appendChild(statBlock('최근 추출', formatValue(latest?.recipe?.extractionTime || latest?.result?.extractionTime || '-')));
    }
    header.appendChild(stats);

    return header;
  }

  function createLogCard(log, bean) {
    const card = createElement('section', 'log-section espresso-log');
    const header = createElement('div', 'espresso-log-header');

    const heading = createElement('h4');
    heading.textContent = safeString(log?.title || log?.type || '추출 기록');
    header.appendChild(heading);

    const logType = log?.type ? pill(log.type) : null;
    if (logType) {
      const meta = createElement('div', 'card-meta');
      meta.appendChild(logType);
      header.appendChild(meta);
    }
    card.appendChild(header);

    const equipment = objectToPairs(log?.equipment || bean?.defaultEquipment);
    if (equipment.length) {
      card.appendChild(specGrid('장비', equipment));
    }

    const rounds = asArray(log?.rounds);
    if (rounds.length) {
      const group = createElement('div', 'content-group espresso-rounds');
      const title = createElement('h4');
      title.textContent = '추출 라운드';
      group.appendChild(title);
      const roundList = createElement('div', 'espresso-round-list');
      rounds.forEach((round) => {
        roundList.appendChild(createRoundCard(round));
      });
      group.appendChild(roundList);
      card.appendChild(group);
    }

    appendObjectSection(card, '현재 분석', log?.currentAnalysis);
    appendArraySection(card, '조정 가이드', log?.adjustmentGuide);
    appendArraySection(card, '최종 가설', log?.finalHypothesis);
    appendNextPanel(card, '다음 테스트', log?.nextTest);
    appendNextPanel(card, '다음 방향', log?.nextDirection);

    return card;
  }

  function createRoundCard(round) {
    const card = createElement('section', 'round-section espresso-round-card');
    const header = createElement('div', 'round-header');

    const title = createElement('h5');
    title.textContent = `라운드 ${safeString(round?.roundNumber || '-')}`;
    header.appendChild(title);

    const badge = createElement('div', 'round-badge');
    badge.textContent = round?.date ? safeString(round.date) : '';
    header.appendChild(badge);
    card.appendChild(header);

    const recipe = objectToPairs(round?.recipe);
    if (recipe.length) {
      card.appendChild(specGrid('추출 조건', recipe));
    }
    appendObjectSection(card, '결과', round?.result);
    appendArraySection(card, '변경 사항', round?.analysis?.changes);
    appendArraySection(card, '메모', round?.analysis?.notes);
    appendArraySection(card, '비교 메모', round?.analysis?.plannedComparisons);
    appendArraySection(card, '판단', round?.analysis?.judgments);
    appendArraySection(card, '추론', round?.analysis?.inferences);
    appendArraySection(card, '결론', round?.analysis?.conclusions);
    appendArraySection(card, '다음 액션', round?.nextActions);

    return card;
  }

  function statBlock(label, value) {
    const block = createElement('div', 'espresso-stat');
    const labelNode = createElement('span');
    labelNode.textContent = label;
    const valueNode = createElement('strong');
    valueNode.textContent = value;
    block.append(labelNode, valueNode);
    return block;
  }

  function specGrid(title, pairs) {
    const section = createElement('section', 'info-block espresso-spec-section');
    const heading = createElement('h5');
    heading.textContent = title;
    section.appendChild(heading);

    const grid = createElement('div', 'espresso-spec-grid');
    for (const [label, value] of pairs) {
      const item = createElement('div', 'espresso-spec');
      const labelNode = createElement('span');
      labelNode.textContent = label;
      const valueNode = createElement('strong');
      valueNode.textContent = value || '-';
      item.append(labelNode, valueNode);
      grid.appendChild(item);
    }
    section.appendChild(grid);
    return section;
  }

  function appendNextPanel(parent, title, value) {
    const content = nextPanelContent(value);
    if (!content) {
      return;
    }

    const panel = createElement('section', 'espresso-next-panel');
    const heading = createElement('h4');
    heading.textContent = title;
    panel.append(heading, content);
    parent.appendChild(panel);
  }

  function nextPanelContent(value) {
    const arrayValue = asArray(value);
    if (arrayValue.length) {
      return listFrom(arrayValue);
    }

    const pairs = objectToPairs(value);
    if (pairs.length) {
      const list = createElement('div', 'info-list');
      for (const [label, item] of pairs) {
        const row = createElement('div', 'info-item');
        const labelNode = createElement('div', 'info-label');
        labelNode.textContent = label;
        const valueNode = createElement('div', 'info-value');
        valueNode.textContent = item;
        row.append(labelNode, valueNode);
        list.appendChild(row);
      }
      return list;
    }

    return null;
  }

  function appendObjectSection(parent, title, value) {
    const pairs = objectToPairs(value);
    if (!pairs.length) {
      return;
    }
    parent.appendChild(infoCard(title, pairs));
  }

  function appendArraySection(parent, title, value) {
    const items = asArray(value);
    if (!items.length) {
      return;
    }
    parent.appendChild(createGroup(title, listFrom(items)));
  }

  function createGroup(title, contentNode) {
    const wrapper = createElement('div', 'content-group');
    const heading = createElement('h4');
    heading.textContent = title;
    wrapper.appendChild(heading);
    wrapper.appendChild(contentNode);
    return wrapper;
  }

  function infoCard(title, pairs) {
    const card = createElement('section', 'info-block');
    const heading = createElement('h5');
    heading.textContent = title;
    card.appendChild(heading);

    const list = createElement('div', 'info-list');
    for (const [label, value] of pairs) {
      const item = createElement('div', 'info-item');
      const labelEl = createElement('div', 'info-label');
      labelEl.textContent = label;
      const valueEl = createElement('div', 'info-value');
      valueEl.textContent = value;
      item.append(labelEl, valueEl);
      list.appendChild(item);
    }
    card.appendChild(list);
    return card;
  }

  function messageBlock(message) {
    const block = createElement('p', 'empty-copy');
    block.textContent = message;
    return block;
  }

  function pill(text) {
    const span = createElement('span', 'pill');
    span.textContent = safeString(text);
    return span;
  }

  function listFrom(value) {
    const items = asArray(value);
    if (!items.length) {
      return messageBlock('없음');
    }
    const list = document.createElement('ul');
    for (const item of items) {
      const listItem = document.createElement('li');
      listItem.textContent = formatValue(item);
      list.appendChild(listItem);
    }
    return list;
  }

  function orderedListFrom(value) {
    const items = asArray(value);
    if (!items.length) {
      return messageBlock('없음');
    }
    const list = document.createElement('ol');
    for (const item of items) {
      const listItem = document.createElement('li');
      listItem.textContent = formatValue(item);
      list.appendChild(listItem);
    }
    return list;
  }

  function objectToPairs(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }
    return Object.entries(value).map(([key, item]) => [prettyLabel(key), formatValue(item)]);
  }

  function formatValue(value) {
    if (value == null) {
      return '';
    }
    if (isMeasurement(value)) {
      return formatMeasurement(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => formatValue(item)).join('\n');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, item]) => `${prettyLabel(key)}: ${formatValue(item)}`)
        .join('\n');
    }
    return safeString(value);
  }

  function isMeasurement(value) {
    return Boolean(
      value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof value.unit === 'string' &&
        (typeof value.value === 'number' || typeof value.min === 'number' || typeof value.max === 'number')
    );
  }

  function formatMeasurement(measurement) {
    const unit = unitLabel(measurement.unit);
    if (typeof measurement.value === 'number') {
      return `${formatNumber(measurement.value)}${unit}`;
    }

    const min = typeof measurement.min === 'number' ? formatNumber(measurement.min) : '';
    const max = typeof measurement.max === 'number' ? formatNumber(measurement.max) : '';
    return `${min}${min && max ? '~' : ''}${max}${unit}`;
  }

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/0+$/, '').replace(/\.$/, '');
  }

  function unitLabel(unit) {
    const unitMap = {
      bar: 'bar',
      celsius: '도',
      g: 'g',
      sec: '초'
    };
    return unitMap[unit] || safeString(unit);
  }

  function recipeMatches(value, query) {
    if (!query) {
      return true;
    }
    return collectSearchText(value).includes(query);
  }

  function collectSearchText(value) {
    if (value == null) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return normalize(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => collectSearchText(item)).join(' ');
    }
    if (typeof value === 'object') {
      return Object.values(value)
        .map((item) => collectSearchText(item))
        .join(' ');
    }
    return '';
  }

  function normalize(value) {
    return safeString(value).trim().toLowerCase();
  }

  function safeString(value) {
    return value == null ? '' : String(value);
  }

  function prettyLabel(key) {
    const labelMap = {
      action: '조치',
      adjustments: '조정',
      basket: '바스켓',
      capturedAt: '수집일',
      changes: '변경 사항',
      conditions: '상태',
      conclusion: '결론',
      conclusions: '결론',
      currentAnalysis: '현재 분석',
      date: '날짜',
      defaultEquipment: '기본 장비',
      dose: '도징',
      expectedResult: '예상 결과',
      extractionTime: '추출 시간',
      flow: '유량',
      foodType: '식품 유형',
      freeShippingThresholdKRW: '무료 배송 기준',
      grind: '분쇄도',
      grindOptions: '분쇄 옵션',
      goals: '목표',
      ingredients: '원재료',
      inference: '추론',
      inferences: '추론',
      judgment: '판단',
      judgments: '판단',
      machine: '머신',
      manufacturedAtDescription: '제조일자 안내',
      manufacturer: '제조/판매원',
      method: '방법',
      nextAction: '다음 액션',
      nextActions: '다음 액션',
      nextDirection: '다음 방향',
      nextTest: '다음 테스트',
      notes: '메모',
      plannedComparison: '비교 메모',
      plannedComparisons: '비교 메모',
      preinfusion: '프리인퓨전',
      pressure: '압력',
      priceKRW: '판매가',
      productInfo: '원두 정보',
      result: '결과',
      round: '라운드',
      roundNumber: '라운드',
      recipe: '레시피',
      roaster: '로스터',
      shelfLife: '소비기한',
      shippingFeeKRW: '배송비',
      sizes: '내용량',
      sourceUrl: '출처',
      suspectedIssues: '의심 문제',
      tamper: '탬퍼',
      taste: '맛',
      targetExtractionTime: '목표 추출 시간',
      targetRoundNumber: '목표 라운드',
      temperature: '온도',
      time: '시간',
      steps: '단계',
      targetTotalExtractionTime: '목표 총 추출 시간',
      totalExtractionTime: '총 추출 시간',
      type: '유형',
      yield: '추출량'
    };

    if (Object.prototype.hasOwnProperty.call(labelMap, key)) {
      return labelMap[key];
    }

    return safeString(key)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^\w/, (char) => char.toUpperCase());
  }

  function asArray(value) {
    return Array.isArray(value) ? value.filter((item) => item != null && item !== '') : [];
  }

  function createElement(tag, className) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }

  function safeHttpUrl(value) {
    if (!value) {
      return '';
    }

    try {
      const url = new URL(safeString(value), window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function setStatus(message) {
    elements.status.hidden = false;
    elements.status.className = 'status';
    elements.status.textContent = message;
  }

  function clearStatus() {
    elements.status.hidden = true;
    elements.status.textContent = '';
  }

  function showError(error) {
    elements.status.hidden = false;
    elements.status.className = 'status is-error';
    elements.status.replaceChildren();

    const row = document.createElement('div');
    row.className = 'status-row';

    const text = document.createElement('div');
    text.textContent = error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.';
    row.appendChild(text);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '다시 시도';
    button.addEventListener('click', () => {
      window.location.reload();
    });
    row.appendChild(button);

    elements.status.appendChild(row);
  }
})();
