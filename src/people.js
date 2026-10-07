function bindSharedFilterFields(
    root,
    {
        schema,
        values,
        prefix,
        onChange =
            () =>
            {}
    }
)
{
    const container =
        [
            ...root.querySelectorAll(
                '[data-shared-filter-root]'
            )
        ].find(element =>
            element.dataset
                .sharedFilterRoot
            === prefix
        );

    if (!container)
    {
        return null;
    }

    const currentValues =
        cloneSharedFilterValues(
            schema,
            values
        );

    const comboboxBindings = [];
    const yearRangeBindings = [];

    const getValues =
        () =>
            cloneSharedFilterValues(
                schema,
                currentValues
            );

    const notifyChange = () =>
    {
        const nextValues =
            getValues();

        onChange(nextValues);

        container.dispatchEvent(
            new CustomEvent(
                'shared-filter-change',
                {
                    bubbles:
                true,

                    detail:
                nextValues
                }
            )
        );
    };

    const closeOtherComboboxes =
        activeBinding =>
        {
            comboboxBindings
                .filter(binding =>
                    binding !== activeBinding
                )
                .forEach(binding =>
                    binding.close()
                );
        };

    schema.forEach(definition =>
    {
        const yearRangeRoot =
            container.querySelector(
                `[data-shared-filter-year-range="${
                    definition.key
                }"]`
            );

        if (yearRangeRoot)
        {
            const controls =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-controls]'
                );

            const modeSelect =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-mode]'
                );

            const fromShell =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from-shell]'
                );

            const fromLabel =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from-label]'
                );

            const fromInput =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from]'
                );

            const toShell =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-to-shell]'
                );

            const toInput =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-to]'
                );

            const errorRoot =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-error]'
                );

            if (
                !controls
          || !modeSelect
          || !fromShell
          || !fromInput
          || !toShell
          || !toInput
          || !errorRoot
            )
            {
                return;
            }

            const updatePresentation =
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    const isBetween =
                        range.mode === 'between';

                    controls.classList.toggle(
                        'is-empty',
                        !range.mode
                    );

                    controls.classList.toggle(
                        'is-between',
                        isBetween
                    );

                    fromShell.hidden =
                        !range.mode;

                    toShell.hidden =
                        !isBetween;

                    if (fromLabel)
                    {
                        fromLabel.textContent =
                            translateText(
                                isBetween
                                    ? 'Year from'
                                    : 'Year'
                            );
                    }

                    fromInput.placeholder =
                        translateText(
                            isBetween
                                ? 'From'
                                : 'Year'
                        );

                    toInput.placeholder =
                        translateText(
                            'To'
                        );

                    const fromYear =
                        sharedFilterYearNumber(
                            range.from
                        );

                    const toYear =
                        sharedFilterYearNumber(
                            range.to
                        );

                    const orderInvalid =
                        isBetween
              && fromYear != null
              && toYear != null
              && fromYear > toYear;

                    const error =
                        sharedFilterYearRangeError(
                            range
                        );

                    errorRoot.hidden =
                        !error;

                    errorRoot.textContent =
                        error;

                    if (
                        range.mode
              && fromYear == null
                    )
                    {
                        fromInput.setAttribute(
                            'aria-invalid',
                            'true'
                        );
                    }
                    else
                    {
                        fromInput.removeAttribute(
                            'aria-invalid'
                        );
                    }

                    if (
                        isBetween
              && (
                  toYear == null
                || orderInvalid
              )
                    )
                    {
                        toInput.setAttribute(
                            'aria-invalid',
                            'true'
                        );
                    }
                    else
                    {
                        toInput.removeAttribute(
                            'aria-invalid'
                        );
                    }
                };

            const sync =
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    currentValues[
                        definition.key
                    ] = range;

                    modeSelect.value =
                        range.mode;

                    fromInput.value =
                        range.from;

                    toInput.value =
                        range.to;

                    updatePresentation();
                };

            modeSelect.addEventListener(
                'change',
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    range.mode =
                        modeSelect.value;

                    if (!range.mode)
                    {
                        range.from = '';
                        range.to = '';
                    }
                    else if (
                        range.mode !== 'between'
                    )
                    {
                        range.to = '';
                    }

                    currentValues[
                        definition.key
                    ] = range;

                    sync();
                    notifyChange();

                    if (range.mode)
                    {
                        requestAnimationFrame(
                            () =>
                            {
                                fromInput.focus({
                                    preventScroll:
                      true
                                });
                            }
                        );
                    }
                }
            );

            const bindYearInput =
                (
                    input,
                    property
                ) =>
                {
                    input.addEventListener(
                        'input',
                        () =>
                        {
                            const sanitized =
                                input.value
                                    .replace(/\D/g, '')
                                    .slice(0, 4);

                            if (
                                input.value !== sanitized
                            )
                            {
                                input.value =
                                    sanitized;
                            }

                            const range =
                                normalizeSharedFilterYearRange(
                                    currentValues[
                                        definition.key
                                    ]
                                );

                            range[property] =
                                sanitized;

                            currentValues[
                                definition.key
                            ] = range;

                            updatePresentation();
                            notifyChange();
                        }
                    );
                };

            bindYearInput(
                fromInput,
                'from'
            );

            bindYearInput(
                toInput,
                'to'
            );

            yearRangeBindings.push({
                definition,
                sync
            });

            sync();
            return;
        }
        const select =
            container.querySelector(
                `[data-shared-filter-select="${
                    definition.key
                }"]`
            );

        if (select)
        {
            select.addEventListener(
                'change',
                () =>
                {
                    currentValues[
                        definition.key
                    ] =
                        select.value;

                    notifyChange();
                }
            );

            return;
        }

        const booleanInput =
            container.querySelector(
                `[data-shared-filter-boolean="${
                    definition.key
                }"]`
            );

        if (booleanInput)
        {
            booleanInput.addEventListener(
                'change',
                () =>
                {
                    currentValues[
                        definition.key
                    ] =
                        Boolean(
                            booleanInput.checked
                        );

                    notifyChange();
                }
            );

            return;
        }

        const combobox =
            container.querySelector(
                `[data-shared-filter-combobox="${
                    definition.key
                }"]`
            );

        if (!combobox)
        {
            return;
        }

        const input =
            combobox.querySelector(
                '[data-shared-filter-input]'
            );

        const toggle =
            combobox.querySelector(
                '[data-shared-filter-toggle]'
            );

        const listbox =
            combobox.querySelector(
                '[data-shared-filter-listbox]'
            );

        const selectedRoot =
            combobox.querySelector(
                '[data-shared-filter-selected]'
            );

        const status =
            combobox.querySelector(
                '[data-shared-filter-status]'
            );

        if (
            !input
          || !toggle
          || !listbox
          || !selectedRoot
        )
        {
            return;
        }

        let query = '';
        let activeIndex = -1;
        let visibleOptions = [];
        let openBeforePointer = null;

        const optionId =
            index =>
                `${
                    listbox.id
                }-option-${
                    index
                }`;

        const selectedValues = () =>
        {
            const value =
                currentValues[
                    definition.key
                ];

            if (definition.multiple)
            {
                return Array.isArray(value)
                    ? value
                    : [];
            }

            return value == null
            || value === ''
                ? []
                : [
                    String(value)
                ];
        };

        const renderSelected = () =>
        {
            const valuesToRender =
                selectedValues();

            selectedRoot.hidden =
                valuesToRender.length === 0;

            selectedRoot.innerHTML =
                valuesToRender.map(value =>
                {
                    const label =
                        sharedFilterOptionLabel(
                            definition,
                            value
                        );

                    return `
                <span
                  class="shared-filter-token">

                  <span
                    class="
                      shared-filter-token-label
                    ">
                    ${escapeHtml(label)}
                  </span>

                  <button
                    class="
                      shared-filter-token-remove
                    "
                    type="button"
                    data-shared-filter-remove="${
                        escapeHtml(value)
                    }"
                    aria-label="${
                        escapeHtml(
                            sharedFilterRemoveValueLabel(
                                label
                            )
                        )
                    }">

                    ${icon.close}
                  </button>
                </span>
              `;
                }).join('');
        };

        const positionListbox = () =>
        {
            const inputShell =
                combobox.querySelector(
                    '.shared-filter-combobox-input'
                )
            || input;

            const rect =
                inputShell
                    .getBoundingClientRect();

            const margin = 12;
            const gap = 5;
            const preferredHeight = 320;

            const spaceBelow =
                window.innerHeight
            - rect.bottom
            - margin
            - gap;

            const spaceAbove =
                rect.top
            - margin
            - gap;

            const openAbove =
                spaceBelow < preferredHeight
            && spaceAbove > spaceBelow;

            const availableHeight =
                Math.max(
                    80,
                    Math.min(
                        preferredHeight,
                        openAbove
                            ? spaceAbove
                            : spaceBelow
                    )
                );

            const width =
                Math.min(
                    rect.width,
                    window.innerWidth
                - margin * 2
                );

            const left =
                Math.min(
                    Math.max(
                        margin,
                        rect.left
                    ),
                    window.innerWidth
                - width
                - margin
                );

            listbox.classList.toggle(
                'is-above',
                openAbove
            );

            listbox.style.left =
                `${left}px`;

            listbox.style.width =
                `${width}px`;

            listbox.style.maxHeight =
                `${availableHeight}px`;

            if (openAbove)
            {
                listbox.style.top =
                    'auto';

                listbox.style.bottom =
                    `${
                        window.innerHeight
                - rect.top
                + gap
                    }px`;
            }
            else
            {
                listbox.style.top =
                    `${rect.bottom + gap}px`;

                listbox.style.bottom =
                    'auto';
            }
        };

        const renderOptions = () =>
        {
            const normalizedQuery =
                normalizeSharedFilterSearch(
                    query
                );

            visibleOptions =
                sharedFilterOptions(
                    definition
                ).filter(option =>
                {
                    if (!normalizedQuery)
                    {
                        return true;
                    }

                    const searchText =
                        [
                            option.label,
                            translateText(
                                option.label
                            ),
                            ...(option.keywords || [])
                        ]
                            .map(
                                normalizeSharedFilterSearch
                            )
                            .join(' ');

                    return searchText.includes(
                        normalizedQuery
                    );
                });

            if (
                activeIndex
            >= visibleOptions.length
            )
            {
                activeIndex =
                    visibleOptions.length - 1;
            }

            if (
                activeIndex < 0
            && visibleOptions.length
            )
            {
                activeIndex = 0;
            }

            const chosen =
                new Set(
                    selectedValues()
                );

            listbox.innerHTML =
                visibleOptions.length
                    ? visibleOptions
                        .map(
                            (option, index) => `
                      <button
                        class="
                          shared-filter-option
                          ${
                                index === activeIndex
                                    ? 'is-active'
                                    : ''
                            }
                        "
                        id="${
                            escapeHtml(
                                optionId(index)
                            )
                        }"
                        type="button"
                        role="option"
                        aria-selected="${
                            chosen.has(
                                option.value
                            )
                                ? 'true'
                                : 'false'
                        }"
                        data-shared-filter-option="${
                            escapeHtml(
                                option.value
                            )
                        }">

                        <span
                          class="
                            shared-filter-option-check
                          "
                          aria-hidden="true">
                          ${icon.check}
                        </span>

                        <span
                          class="
                            shared-filter-option-label
                          ">
                          ${escapeHtml(
                                translateText(
                                    option.label
                                )
                            )}
                        </span>

                        ${
                            option.count == null
                                ? ''
                                : `
                              <span
                                class="
                                  shared-filter-option-count
                                ">
                                ${option.count}
                              </span>
                            `
                        }
                      </button>
                    `
                        )
                        .join('')
                    : `
                  <div
                    class="shared-filter-empty">
                    ${escapeHtml(
                        translateText(
                            'No matching options.'
                        )
                    )}
                  </div>
                `;

            if (
                activeIndex >= 0
            && visibleOptions.length
            )
            {
                input.setAttribute(
                    'aria-activedescendant',
                    optionId(activeIndex)
                );
            }
            else
            {
                input.removeAttribute(
                    'aria-activedescendant'
                );
            }

            if (status)
            {
                status.textContent =
                    sharedFilterOptionStatus(
                        visibleOptions.length
                    );
            }
        };

        const open = () =>
        {
            closeOtherComboboxes(
                binding
            );

            renderOptions();

            listbox.hidden = false;

            combobox.classList.add(
                'is-open'
            );

            input.setAttribute(
                'aria-expanded',
                'true'
            );

            toggle.setAttribute(
                'aria-label',
                translateText(
                    'Close options'
                )
            );

            positionListbox();
        };

        const close = () =>
        {
            listbox.hidden = true;

            combobox.classList.remove(
                'is-open'
            );

            input.setAttribute(
                'aria-expanded',
                'false'
            );

            input.removeAttribute(
                'aria-activedescendant'
            );

            toggle.setAttribute(
                'aria-label',
                translateText(
                    'Open options'
                )
            );
        };

        const setSelectedValue =
            value =>
            {
                const oldValues =
                    selectedValues();

                if (definition.multiple)
                {
                    currentValues[
                        definition.key
                    ] =
                        oldValues.includes(value)
                            ? oldValues.filter(
                                item =>
                                    item !== value
                            )
                            : [
                                ...oldValues,
                                value
                            ];
                }
                else
                {
                    currentValues[
                        definition.key
                    ] =
                        value;

                    close();
                }

                query = '';
                input.value = '';

                renderSelected();
                renderOptions();
                notifyChange();

                input.focus();
            };

        const binding = {
            definition,
            input,
            open,
            close,

            sync()
            {
                renderSelected();
                renderOptions();
            }
        };

        comboboxBindings.push(
            binding
        );

        renderSelected();

        input.addEventListener(
            'focus',
            open
        );

        input.addEventListener(
            'pointerdown',
            () =>
            {
                openBeforePointer = !listbox.hidden;
            }
        );

        input.addEventListener(
            'click',
            () =>
            {
                const wasOpen = openBeforePointer;
                openBeforePointer = null;

                if (wasOpen === true)
                {
                    close();
                }
                else if (listbox.hidden)
                {
                    open();
                }
            }
        );

        input.addEventListener(
            'input',
            () =>
            {
                query =
                    input.value;

                activeIndex = 0;
                open();
            }
        );

        input.addEventListener(
            'keydown',
            event =>
            {
                if (
                    event.key === 'ArrowDown'
                )
                {
                    event.preventDefault();

                    if (listbox.hidden)
                    {
                        open();
                    }
                    else if (
                        visibleOptions.length
                    )
                    {
                        activeIndex =
                            Math.min(
                                activeIndex + 1,
                                visibleOptions.length - 1
                            );

                        renderOptions();
                    }

                    listbox
                        .querySelector(
                            '.shared-filter-option.is-active'
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });

                    return;
                }

                if (
                    event.key === 'ArrowUp'
                )
                {
                    event.preventDefault();

                    if (listbox.hidden)
                    {
                        open();
                    }
                    else if (
                        visibleOptions.length
                    )
                    {
                        activeIndex =
                            Math.max(
                                activeIndex - 1,
                                0
                            );

                        renderOptions();
                    }

                    listbox
                        .querySelector(
                            '.shared-filter-option.is-active'
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });

                    return;
                }

                if (
                    event.key === 'Enter'
              && !listbox.hidden
              && activeIndex >= 0
              && visibleOptions[
                  activeIndex
              ]
                )
                {
                    event.preventDefault();

                    setSelectedValue(
                        visibleOptions[
                            activeIndex
                        ].value
                    );

                    return;
                }

                if (
                    event.key === 'Escape'
              && !listbox.hidden
                )
                {
                    event.preventDefault();
                    event.stopPropagation();

                    close();
                }
            }
        );

        toggle.addEventListener(
            'click',
            () =>
            {
                if (listbox.hidden)
                {
                    input.focus();
                    open();
                }
                else
                {
                    close();
                }
            }
        );

        listbox.addEventListener(
            'pointerdown',
            event =>
            {
                if (
                    event.target.closest(
                        '[data-shared-filter-option]'
                    )
                )
                {
                    event.preventDefault();
                }
            }
        );

        listbox.addEventListener(
            'click',
            event =>
            {
                const option =
                    event.target.closest(
                        '[data-shared-filter-option]'
                    );

                if (!option)
                {
                    return;
                }

                /*
            * setSelectedValue() rebuilds the listbox.
            * Stop this click before its original target
            * is removed and document treats it as an
            * outside click.
            */
                event.preventDefault();
                event.stopPropagation();

                setSelectedValue(
                    option.dataset
                        .sharedFilterOption
                );
            }
        );

        selectedRoot.addEventListener(
            'click',
            event =>
            {
                const removeButton =
                    event.target.closest(
                        '[data-shared-filter-remove]'
                    );

                if (!removeButton)
                {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const value =
                    removeButton.dataset
                        .sharedFilterRemove;

                currentValues[
                    definition.key
                ] =
                    definition.multiple
                        ? selectedValues()
                            .filter(item =>
                                item !== value
                            )
                        : definition.defaultValue
                  ?? '';

                renderSelected();
                renderOptions();
                notifyChange();

                input.focus();
            }
        );

        combobox.addEventListener(
            'focusout',
            () =>
            {
                setTimeout(
                    () =>
                    {
                        if (
                            !combobox.contains(
                                document.activeElement
                            )
                        )
                        {
                            close();
                        }
                    },
                    0
                );
            }
        );
    });

    const panelBody =
        container.closest(
            '.shared-filter-panel-body'
        );

    panelBody?.addEventListener(
        'scroll',
        () =>
        {
            comboboxBindings.forEach(
                binding =>
                    binding.close()
            );
        },
        {
            passive:
            true
        }
    );

    const reset = () =>
    {
        const defaults =
            cloneSharedFilterValues(
                schema,
                {}
            );

        Object.assign(
            currentValues,
            defaults
        );

        schema.forEach(definition =>
        {
            const select =
                container.querySelector(
                    `[data-shared-filter-select="${
                        definition.key
                    }"]`
                );

            if (select)
            {
                select.value =
                    currentValues[
                        definition.key
                    ];
            }

            const booleanInput =
                container.querySelector(
                    `[data-shared-filter-boolean="${
                        definition.key
                    }"]`
                );

            if (booleanInput)
            {
                booleanInput.checked =
                    Boolean(
                        currentValues[
                            definition.key
                        ]
                    );
            }
        });
        yearRangeBindings.forEach(
            binding =>
                binding.sync()
        );
        comboboxBindings.forEach(
            binding =>
                binding.sync()
        );

        notifyChange();
    };

    return {
        getValues,
        reset,

        getErrors()
        {
            return schema
                .filter(definition =>
                    definition.control
                === 'year-range'
                )
                .map(definition =>
                    sharedFilterYearRangeError(
                        currentValues[
                            definition.key
                        ]
                    )
                )
                .filter(Boolean);
        },

        focusFirstInvalid()
        {
            container
                .querySelector(
                    '[aria-invalid="true"]'
                )
                ?.focus({
                    preventScroll:
                true
                });
        },

        openCombobox(key)
        {
            const binding =
                comboboxBindings.find(
                    item =>
                        item.definition.key
                  === key
                );

            if (!binding)
            {
                return;
            }

            binding.input.focus({
                preventScroll:
              true
            });

            binding.open();
        },

        focusFirst()
        {
            container
                .querySelector(
                    [
                        '[data-shared-filter-input]',
                        '[data-shared-filter-year-mode]',
                        '[data-shared-filter-select]'
                    ].join(', ')
                )
                ?.focus();
        }
    };
}

function positionSharedFilterPanel(
    panel,
    anchor
)
{
    if (
        window.innerWidth <= 640
    )
    {
        panel.classList.add(
            'is-mobile'
        );
    }

    const margin = 12;
    const gap = 8;

    const anchorRect =
        anchor.getBoundingClientRect();

    const left =
        window.innerWidth <= 640
            ? margin
            : Math.min(
                Math.max(
                    margin,
                    anchorRect.right - panel.offsetWidth
                ),
                window.innerWidth - panel.offsetWidth - margin
            );

    const below =
        anchorRect.bottom
        + gap;

    const spaceBelow = window.innerHeight - margin - below;
    const spaceAbove = anchorRect.top - gap - margin;
    const placeBelow = panel.offsetHeight <= spaceBelow || spaceBelow >= spaceAbove;
    panel.style.maxHeight = `${Math.max(0, placeBelow ? spaceBelow : spaceAbove)}px`;
    const top = placeBelow ? below : anchorRect.top - gap - panel.offsetHeight;

    panel.style.left =
        `${left}px`;

    panel.style.top =
        `${top}px`;
}

/* ---------- People filter configuration ---------- */

const defaultPeopleFilters =
    Object.freeze({
        surnames:
          Object.freeze([]),

        birthPlaceIds:
          Object.freeze([]),
        birthYear:
          Object.freeze({
              mode:
              '',

              from:
              '',

              to:
              ''
          }),

        living:
          'Any',

        sourceLinks:
          'all',

        reviewStatus:
          ''
    });

function peopleSurnameFilterOptions()
{
    const values =
        new Map();

    getPeople(
        currentProjectId()
    )
        .filter(person =>
            person
          && !person.deleted
        )
        .forEach(person =>
        {
            const surname =
                String(
                    person.names?.last
              || ''
                ).trim();

            if (!surname)
            {
                return;
            }

            const key =
                normalizeSharedFilterSearch(
                    surname
                );

            const existing =
                values.get(key);

            if (existing)
            {
                existing.count += 1;
            }
            else
            {
                values.set(
                    key,
                    {
                        value:
                  surname,

                        label:
                  surname,

                        count:
                  1
                    }
                );
            }
        });

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    return [
        ...values.values()
    ].sort(
        (left, right) =>
            collator.compare(
                left.label,
                right.label
            )
    );
}

function peopleBirthPlaceFilterOptions()
{
    const counts =
        new Map();

    let unknownCount = 0;

    getPeople(
        currentProjectId()
    )
        .filter(person =>
            person
          && !person.deleted
        )
        .forEach(person =>
        {
            const placeId =
                String(
                    person.birth?.placeId
              || ''
                ).trim();

            if (!placeId)
            {
                unknownCount += 1;
                return;
            }

            counts.set(
                placeId,
                (
                    counts.get(placeId)
              || 0
                ) + 1
            );
        });

    const options =
        [
            ...counts.entries()
        ].map(
            ([
                placeId,
                count
            ]) =>
            {
                const place =
                    sampleData.places
                        .find(item =>
                            item.id === placeId
                        );

                return {
                    value:
                placeId,

                    label:
                getPlaceDisplay(
                    placeId
                ),

                    keywords:
                [
                    ...(place
                        ?.alternativeNames
                    || [])
                ],

                    count
                };
            }
        );

    if (unknownCount)
    {
        options.push({
            value:
            SHARED_FILTER_UNKNOWN_VALUE,

            label:
            'Unknown birth place',

            count:
            unknownCount
        });
    }

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    return options.sort(
        (left, right) =>
            collator.compare(
                translateText(
                    left.label
                ),
                translateText(
                    right.label
                )
            )
    );
}

const peopleFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'surnames',

            label:
            'Surname',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search surnames',

            getOptions:
            peopleSurnameFilterOptions
        }),

        Object.freeze({
            key:
            'birthPlaceIds',

            label:
            'Birth place',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search birth places',

            getOptions:
            peopleBirthPlaceFilterOptions
        }),

        Object.freeze({
            key:
            'birthYear',

            label:
            'Birth year',

            control:
            'year-range',

            layout:
            'full',

            defaultValue:
            Object.freeze({
                mode:
                '',

                from:
                '',

                to:
                ''
            })
        }),
        Object.freeze({
            key:
            'living',

            label:
            'Living status',

            control:
            'select',

            defaultValue:
            'Any',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'Any',

                    label:
                  'Any'
                }),

                Object.freeze({
                    value:
                  'Living',

                    label:
                  'Living'
                }),

                Object.freeze({
                    value:
                  'Deceased',

                    label:
                  'Deceased'
                }),

                Object.freeze({
                    value:
                  'Unknown',

                    label:
                  'Unknown'
                })
            ])
        }),
        Object.freeze({
            key:
            'sourceLinks',

            label:
            'Sources',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'Any source status'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'With sources'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Without sources'
                })
            ])
        }),
        Object.freeze({
            key:
            'reviewStatus',

            label:
            'Review status',

            control:
            'select',

            defaultValue:
            '',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  '',

                    label:
                  'Any'
                }),

                Object.freeze({
                    value:
                  'No issues',

                    label:
                  'No issues'
                }),

                Object.freeze({
                    value:
                  'Possible duplicate',

                    label:
                  'Possible duplicate'
                }),

                Object.freeze({
                    value:
                  'Missing facts',

                    label:
                  'Missing facts'
                }),

                Object.freeze({
                    value:
                  'Missing source',

                    label:
                  'Missing source'
                }),

                Object.freeze({
                    value:
                  'Historic records',

                    label:
                  'Historic records'
                })
            ])
        })
    ]);

function peopleFiltersWithDefaults(
    filters = state.peopleFilters
)
{
    return cloneSharedFilterValues(
        peopleFilterSchema,
        {
            ...defaultPeopleFilters,
            ...(filters || {})
        }
    );
}

function renderPeopleFilterFields(
    filters = defaultPeopleFilters,
    prefix = 'people-filter'
)
{
    return renderSharedFilterFields({
        schema:
          peopleFilterSchema,

        values:
          peopleFiltersWithDefaults(
              filters
          ),

        prefix
    });
}

function bindPeopleFilterFields(
    root,
    filters,
    prefix,
    onChange =
        () =>
        {}
)
{
    const controller =
        bindSharedFilterFields(
            root,
            {
                schema:
              peopleFilterSchema,

                values:
              peopleFiltersWithDefaults(
                  filters
              ),

                prefix,
                onChange
            }
        );

    root.peopleFilterController =
        controller;

    return controller;
}

function readPeopleFilterFields(
    root
)
{
    return (
        root
            ?.peopleFilterController
            ?.getValues()
        || peopleFiltersWithDefaults(
            defaultPeopleFilters
        )
    );
}

function resetPeopleFilterFields(
    root
)
{
    root
        ?.peopleFilterController
        ?.reset();
}

const defaultPeopleColumns = Object.freeze({ living: true, birth: true, birthPlace: true, death: true, deathPlace: true, updated: true });
const peopleColumnLabels = { living: 'Living', birth: 'Birth date', birthPlace: 'Birth place', death: 'Death date', deathPlace: 'Death place', updated: 'Updated' };

let peopleSavedViews = [
    {
        id:
          'whiskerfield-line',

        name:
          'Whiskerfield surname',

        description:
          'All Whiskerfield surname records.',

        filters: {
            surnames:
            ['Whiskerfield']
        }
    },

    {
        id:
          'meowbridge-places',

        name:
          'Meowbridge places',

        description:
          'People and records connected to Meowbridge.',

        filters: {
            birthPlaceIds:
            ['place-meowbridge']
        }
    },

    {
        id:
          'historic-records',

        name:
          'Historic records',

        description:
          'Great-grandparents and early evidence.',

        filters: {
            reviewStatus:
            'Historic records'
        }
    }
];

function selectedPeopleRecord()
{
    const records = currentPeopleRecords();
    if (!records.some(person => person.id === state.selectedPeopleId))
    {
        state.selectedPeopleId = records.find(person => person.id === 'silver')?.id || records[0]?.id || '';
    }
    return records.find(person => person.id === state.selectedPeopleId) || records[0] || null;
}

const peopleDateMonths = Object.freeze({
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
});

function peopleDateMonthIndex(value)
{
    const key = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(peopleDateMonths, key)
        ? peopleDateMonths[key]
        : null;
}

function validPeopleDate(year, month, day)
{
    const date = new Date(year, month, day);

    return date.getFullYear() === year
        && date.getMonth() === month
        && date.getDate() === day
        ? date
        : null;
}

function parsePeoplePrototypeDate(value)
{
    if (!value || value === '-') return null;

    const text = String(value).trim();

    let match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match)
    {
        return validPeopleDate(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
        );
    }

    match = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
    if (match)
    {
        const month = peopleDateMonthIndex(match[2]);
        if (month === null) return null;

        return validPeopleDate(
            Number(match[3]),
            month,
            Number(match[1])
        );
    }

    match = text.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match)
    {
        const month = peopleDateMonthIndex(match[1]);
        if (month === null) return null;

        return validPeopleDate(
            Number(match[3]),
            month,
            Number(match[2])
        );
    }

    return null;
}

function peopleSortDateValue(value)
{
    const text = String(value || '').trim().toLowerCase();

    if (!text || text === '-') return Number.NaN;
    if (text === 'just now' || text === 'today') return Number.MAX_SAFE_INTEGER;
    if (text === 'yesterday') return Number.MAX_SAFE_INTEGER - 1;

    const date = parsePeoplePrototypeDate(value);

    return date ? date.getTime() : Number.NaN;
}

function sortPeopleRecords(
    records,
    sort = state.peopleSort
)
{
    return appSortRecords(records, {
        field:
          sort,

        direction:
          state.peopleSortDirection,

        extractors: {
            first: {
                type: 'text',
                get: record =>
                    record.first
            },

            last: {
                type: 'text',
                get: record =>
                    record.surname
            },

            birth: {
                type: 'number',
                get: record =>
                    peopleSortDateValue(
                        record.birth
                    )
            },

            updated: {
                type: 'number',
                get: record =>
                    appSortTimestamp(
                        record.updatedAt
                    )
            },

            created: {
                type: 'number',
                get: record =>
                    appSortTimestamp(
                        record.createdAt
                    )
            }
        },

        getFallback:
          record => record.name
    });
}

function calculatePeopleAge(fromDate, toDate = new Date())
{
    if (!fromDate || !toDate || toDate < fromDate) return null;
    let age = toDate.getFullYear() - fromDate.getFullYear();
    const beforeBirthday = toDate.getMonth() < fromDate.getMonth() || (toDate.getMonth() === fromDate.getMonth() && toDate.getDate() < fromDate.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
}

function peopleHeroLifeSummaryItems(
    person,
    options = {}
)
{
    const birth =
        cleanGenealogyDateText(
            person?.birth
        );

    const death =
        cleanGenealogyDateText(
            person?.death
        );

    const birthDate =
        parsePeoplePrototypeDate(
            person?.birth
        );

    const deathDate =
        parsePeoplePrototypeDate(
            person?.death
        );

    const livingStatus =
        normalizeLivingStatus(
            person?.living
          ?? person?.livingStatus
        );

    const isLiving =
        livingStatus === 'Living';

    const showsDeath =
        livingStatus !== 'Living';

    const birthPlace =
        options.includeBirthPlace
            ? person?.birthPlace || ''
            : '';

    const deathPlace =
        options.includeDeathPlace
            ? person?.deathPlace || ''
            : '';

    const currentAge =
        isLiving && birthDate
            ? calculatePeopleAge(
                birthDate
            )
            : null;

    const items = [
        {
            label: 'Birth',
            value:
            birth || 'Unknown',
            detail:
            currentAge !== null
                ? `Age: ${currentAge}`
                : '',
            place:
            birthPlace
        }
    ];

    if (showsDeath)
    {
        const ageAtDeath =
            birthDate && deathDate
                ? calculatePeopleAge(
                    birthDate,
                    deathDate
                )
                : null;

        items.push({
            label: 'Death',
            value:
            death || 'Unknown',
            detail:
            ageAtDeath !== null
                ? `Age: ${ageAtDeath}`
                : '',
            place:
            deathPlace
        });
    }

    return items;
}

function renderPeopleHeroLifeSummary(
    person,
    options = {}
)
{
    const items =
        peopleHeroLifeSummaryItems(
            person,
            options
        );

    return `
        <div
          class="profile-hero-life"
          role="list">

          ${items
                .map(item => `
              <div
                class="profile-hero-life-item"
                role="listitem">

                <span class="profile-hero-life-label">
                  ${escapeHtml(item.label)}
                </span>

                <div class="profile-hero-life-primary">
                  <strong>
                    ${escapeHtml(item.value)}
                  </strong>

                  ${
                        item.detail
                            ? `
                        <span>
                          ${escapeHtml(item.detail)}
                        </span>
                      `
                            : ''
                    }
                </div>

                ${
                    item.place
                        ? `
                      <span class="profile-hero-life-place">
                        ${escapeHtml(item.place)}
                      </span>
                    `
                        : ''
                }
              </div>
            `)
                .join('')}
        </div>
      `;
}

function peopleColumnsWithDefaults(columns = state.peopleVisibleColumns)
{
    return { ...defaultPeopleColumns, ...(columns || {}) };
}

function peopleColumnsCustomized()
{
    const columns = peopleColumnsWithDefaults();
    return Object.keys(defaultPeopleColumns).some(key => columns[key] !== defaultPeopleColumns[key]);
}

function getPeopleSourceCount(
    person
)
{
    if (!person?.id)
    {
        return 0;
    }

    if (
        Number.isInteger(
            person.sourceCount
        )
    )
    {
        return person.sourceCount;
    }

    const centralPerson =
        getPerson(
            person.id
        );

    if (!centralPerson)
    {
        return 0;
    }

    return sourceIdsForTarget(
        'person',
        centralPerson.id,
        centralPerson.projectId
    ).length;
}

function getPeopleSourceStatus(
    person
)
{
    const count =
        getPeopleSourceCount(
            person
        );

    return `${count} ${
        count === 1
            ? 'source'
            : 'sources'
    } linked`;
}

function getPeopleReviewStatus(
    person
)
{
    const centralPerson =
        getPerson(
            person?.id
        );

    const explicitStatus =
        person?.reviewStatus
        || centralPerson?.meta
            ?.reviewStatus
        || '';

    /*
        Preserve specific review findings.
        Source availability must not hide a
        duplicate or missing-facts warning.
      */
    if (
        explicitStatus
        && explicitStatus !== 'No issues'
        && explicitStatus !== 'Missing source'
    )
    {
        return explicitStatus;
    }

    const sourceCount =
        getPeopleSourceCount(
            person
        );

    if (!sourceCount)
    {
        return 'Missing source';
    }

    /*
        A stale stored “Missing source” status
        must disappear after a Source is linked.
      */
    if (
        explicitStatus === 'Missing source'
    )
    {
        return 'No issues';
    }

    return explicitStatus
        || 'No issues';
}

function hasActivePeopleFilters(
    filters = state.peopleFilters
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    return peopleFilterSchema
        .some(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        );
}

function activePeopleFilterEntries(
    filters = state.peopleFilters
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    return peopleFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        )
        .map(definition => [
            definition.key,
            definition.label,
            sharedFilterDisplayValue(
                definition,
                normalized[
                    definition.key
                ]
            )
        ]);
}

function activePeopleFilterCount(
    filters = state.peopleFilters
)
{
    return activePeopleFilterEntries(
        filters
    ).length;
}

function peopleRecordsMatchingFilters(
    records,
    filters,
    searchQuery =
        state.peopleSearch
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    const selectedSurnames =
        new Set(
            normalized.surnames.map(
                normalizeSharedFilterSearch
            )
        );

    const selectedBirthPlaceIds =
        new Set(
            normalized.birthPlaceIds
        );

    const normalizedQuery =
        normalizeSharedFilterSearch(
            searchQuery
        );

    return records.filter(person =>
    {
        if (
            selectedSurnames.size
          && !selectedSurnames.has(
              normalizeSharedFilterSearch(
                  person.surname
              )
          )
        )
        {
            return false;
        }

        if (
            selectedBirthPlaceIds.size
        )
        {
            const hasKnownPlace =
                Boolean(
                    person.birthPlaceId
                );

            const matchesKnownPlace =
                hasKnownPlace
            && selectedBirthPlaceIds.has(
                person.birthPlaceId
            );

            const matchesUnknownPlace =
                !hasKnownPlace
            && selectedBirthPlaceIds.has(
                SHARED_FILTER_UNKNOWN_VALUE
            );

            if (
                !matchesKnownPlace
            && !matchesUnknownPlace
            )
            {
                return false;
            }
        }

        if (
            !sharedFilterYearMatches(
                person.birthYear,
                normalized.birthYear
            )
        )
        {
            return false;
        }

        if (
            normalized.living !== 'Any'
          && person.living
            !== normalized.living
        )
        {
            return false;
        }

        const sourceCount =
            getPeopleSourceCount(
                person
            );

        if (
            normalized.sourceLinks
            === 'linked'
          && sourceCount === 0
        )
        {
            return false;
        }

        if (
            normalized.sourceLinks
            === 'unlinked'
          && sourceCount > 0
        )
        {
            return false;
        }

        if (
            normalized.reviewStatus
          && getPeopleReviewStatus(person)
            !== normalized.reviewStatus
        )
        {
            return false;
        }

        if (normalizedQuery)
        {
            const searchText =
                normalizeSharedFilterSearch(
                    [
                        person.name,
                        person.birthPlace,
                        person.relation,
                        person.living,
                        getPeopleSourceStatus(
                            person
                        ),
                        getPeopleReviewStatus(
                            person
                        )
                    ]
                        .filter(Boolean)
                        .join(' ')
                );

            if (
                !searchText.includes(
                    normalizedQuery
                )
            )
            {
                return false;
            }
        }

        return true;
    });
}

function peopleFilterResultCount(
    filters
)
{
    return peopleRecordsMatchingFilters(
        currentPeopleRecords(),
        filters
    ).length;
}

function peopleFilterApplyLabel(
    filters
)
{
    const count =
        peopleFilterResultCount(
            filters
        );

    if (
        state.language === 'ru'
    )
    {
        return `Показать ${
            translateCountPhrase(
                `${count} people`
            )
        }`;
    }

    return `Show ${count} ${
        count === 1
            ? 'person'
            : 'people'
    }`;
}

function filteredPeople()
{
    return sortPeopleRecords(
        peopleRecordsMatchingFilters(
            currentPeopleRecords(),
            peopleFiltersWithDefaults()
        )
    );
}

const PEOPLE_ROWS_PER_PAGE_OPTIONS =
    Object.freeze([
        10,
        25,
        50,
        100
    ]);

function normalizePeopleRowsPerPage(
    value = state.peopleRowsPerPage
)
{
    const parsedValue =
        Number(value);

    return PEOPLE_ROWS_PER_PAGE_OPTIONS
        .includes(parsedValue)
        ? parsedValue
        : 25;
}

/*
    * Search, sorting, filters, saved views, and project changes
    * should return the user to the first page.
    *
    * Keeping the reset here avoids duplicating page-reset logic
    * across every filter and search handler.
    */
function peoplePaginationQueryKey()
{
    return JSON.stringify({
        projectId:
          currentProjectId(),

        search:
          String(
              state.peopleSearch || ''
          )
              .trim()
              .toLowerCase(),

        sort: {
            field:
            state.peopleSort
            || 'updated',

            direction:
            normalizeAppSortDirection(
                state.peopleSortDirection
            )
        },

        filters:
          peopleFiltersWithDefaults()
    });
}

function syncPeoplePaginationQuery()
{
    const nextKey =
        peoplePaginationQueryKey();

    if (
        state.peoplePaginationQueryKey
        === nextKey
    )
    {
        return;
    }

    state.peoplePaginationQueryKey =
        nextKey;

    state.peoplePage = 1;
}

function getPeoplePagination(
    totalCount
)
{
    const normalizedTotal =
        Math.max(
            0,
            Number(totalCount) || 0
        );

    const rowsPerPage =
        normalizePeopleRowsPerPage();

    state.peopleRowsPerPage =
        rowsPerPage;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                normalizedTotal
            / rowsPerPage
            )
        );

    const requestedPage =
        Number(state.peoplePage)
        || 1;

    const currentPage =
        Math.min(
            totalPages,
            Math.max(
                1,
                Math.trunc(
                    requestedPage
                )
            )
        );

    state.peoplePage =
        currentPage;

    const startIndex =
        normalizedTotal
            ? (
                currentPage - 1
            ) * rowsPerPage
            : 0;

    const endIndex =
        Math.min(
            startIndex
          + rowsPerPage,
            normalizedTotal
        );

    return {
        totalCount:
          normalizedTotal,

        rowsPerPage,

        totalPages,

        currentPage,

        startIndex,

        endIndex,

        firstVisible:
          normalizedTotal
              ? startIndex + 1
              : 0,

        lastVisible:
          normalizedTotal
              ? endIndex
              : 0
    };
}

function peoplePaginationTokens(
    currentPage,
    totalPages
)
{
    if (
        totalPages <= 7
    )
    {
        return Array.from(
            {
                length:
              totalPages
            },
            (_, index) =>
                index + 1
        );
    }

    const importantPages =
        [
            1,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            totalPages
        ]
            .filter(
                page =>
                    page >= 1
              && page <= totalPages
            );

    const pages =
        [
            ...new Set(
                importantPages
            )
        ].sort(
            (a, b) =>
                a - b
        );

    const tokens = [];
    let previousPage = 0;

    pages.forEach(page =>
    {
        const gap =
            page - previousPage;

        if (
            previousPage
          && gap === 2
        )
        {
            tokens.push(
                previousPage + 1
            );
        }
        else if (
            previousPage
          && gap > 2
        )
        {
            tokens.push(
                'ellipsis'
            );
        }

        tokens.push(page);

        previousPage =
            page;
    });

    return tokens;
}

function renderPeoplePagination(
    pagination
)
{
    if (
        pagination.totalPages <= 1
    )
    {
        return '';
    }

    const tokens =
        peoplePaginationTokens(
            pagination.currentPage,
            pagination.totalPages
        );

    return `
        <nav
          class="pagination"
          aria-label="People pages">

          <button
            class="
              page-button
              icon-rotate-left
            "
            type="button"
            data-people-page="${
                pagination.currentPage - 1
            }"
            aria-label="Previous page"
            ${
                pagination.currentPage === 1
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>

          ${tokens.map(
                (token, index) =>
                {
                    if (
                        token === 'ellipsis'
                    )
                    {
                        return `
                  <span
                    class="
                      pagination-ellipsis
                    "
                    aria-hidden="true"
                    data-pagination-gap="${
                        index
                    }">
                    …
                  </span>
                `;
                    }

                    const active =
                        token
                === pagination.currentPage;

                    return `
                <button
                  class="
                    page-button
                    ${
                        active
                            ? 'active'
                            : ''
                    }
                  "
                  type="button"
                  data-people-page="${
                        token
                    }"
                  aria-label="
                    Go to page ${token}
                  "
                  ${
                        active
                            ? 'aria-current="page"'
                            : ''
                    }>
                  ${token}
                </button>
              `;
                }
            ).join('')}

          <button
            class="page-button"
            type="button"
            data-people-page="${
                pagination.currentPage + 1
            }"
            aria-label="Next page"
            ${
                pagination.currentPage
                === pagination.totalPages
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>
        </nav>
      `;
}

function renderPeopleTableFooter(
    pagination
)
{
    const rangeLabel =
        pagination.totalCount
            ? `${
                pagination.firstVisible
            }–${
                pagination.lastVisible
            }`
            : '0';

    const peopleNoun =
        pagination.totalCount === 1
            ? 'person'
            : 'people';

    return `
        <div
          class="
            table-footer
            people-table-footer
          ">

          <span
            class="
              people-table-footer-summary
            "
            aria-live="polite">
            Showing ${rangeLabel}
            of ${pagination.totalCount}
            ${peopleNoun}
          </span>

          ${renderPeoplePagination(
                pagination
            )}
          <label
            class="people-rows-per-page"
            for="peopleRowsPerPage">

            <span class="people-rows-per-page-label">
              Rows per page
            </span>

            <span
              class="
                common-select-shell
                people-rows-select-shell
              ">

              <select
                class="
                  common-select
                  people-rows-select
                "
                id="peopleRowsPerPage"
                aria-label="Rows per page">

                ${PEOPLE_ROWS_PER_PAGE_OPTIONS
                    .map(option => `
                    <option
                      value="${option}"
                      ${
                            pagination.rowsPerPage
                          === option
                                ? 'selected'
                                : ''
                        }>
                      ${option}
                    </option>
                  `)
                    .join('')}
              </select>

              <span
                class="
                  common-select-chevron
                  people-rows-select-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </label>
        </div>
      `;
}

function peopleSelectedIdSet()
{
    return new Set(Array.isArray(state.peopleSelectedIds) ? state.peopleSelectedIds : []);
}

function peopleSelectedRecords()
{
    const selectedIds = peopleSelectedIdSet();
    return getPeople(currentProjectId()).filter(person => selectedIds.has(person.id));
}

function prunePeopleSelection()
{
    setPeopleSelection(state.peopleSelectedIds);
}

function clearPeopleSelection()
{
    state.peopleSelectedIds = [];
    state.peopleSelectionAnchorId = '';
}

function setPeopleSelection(personIds)
{
    const validIds = new Set(getPeople(currentProjectId()).map(person => person.id));
    state.peopleSelectedIds = [...new Set(Array.isArray(personIds) ? personIds : [])]
        .filter(personId => validIds.has(personId));

    if (!state.peopleSelectedIds.length || !validIds.has(state.peopleSelectionAnchorId))
    {
        state.peopleSelectionAnchorId = '';
    }
}

function togglePeopleSelection(personId, options = {})
{
    const rows = Array.isArray(options.rows) ? options.rows : [];
    const visibleIds = rows.map(person => person.id);
    const selectedIds = peopleSelectedIdSet();
    const anchorIndex = visibleIds.indexOf(state.peopleSelectionAnchorId);
    const personIndex = visibleIds.indexOf(personId);

    if (options.shiftKey && anchorIndex >= 0 && personIndex >= 0)
    {
        const start = Math.min(anchorIndex, personIndex);
        const end = Math.max(anchorIndex, personIndex);
        visibleIds.slice(start, end + 1).forEach(id => selectedIds.add(id));
    }
    else
    {
        if (selectedIds.has(personId)) selectedIds.delete(personId);
        else selectedIds.add(personId);
        state.peopleSelectionAnchorId = personId;
    }

    setPeopleSelection([...selectedIds]);
}

function peopleVisibleSelectionState(rows)
{
    const visibleIds = (Array.isArray(rows) ? rows : []).map(person => person.id);
    const selectedIds = peopleSelectedIdSet();
    const selectedVisibleIds = visibleIds.filter(personId => selectedIds.has(personId));

    return {
        visibleIds,
        selectedVisibleIds,
        allVisibleSelected: visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length,
        someVisibleSelected: selectedVisibleIds.length > 0
    };
}

function renderPeopleActiveFilters()
{
    if (!hasActivePeopleFilters())
    {
        return '';
    }

    const chips = activePeopleFilterEntries()
        .map(([key, label, value]) => `
          <span class="filter-chip active-filter-chip">
            <span class="active-filter-chip-copy">
              <strong>${escapeHtml(label)}:</strong>
              ${escapeHtml(value)}
            </span>

            <button
              class="active-filter-chip-remove"
              type="button"
              data-people-remove-filter="${escapeHtml(key)}"
              aria-label="Remove ${escapeHtml(label)} filter"
              title="Remove filter">
              ${icon.close}
            </button>
          </span>
        `)
        .join('');

    return `
        <div
          class="people-filterbar"
          aria-label="Active People filters">
          ${chips}

          <span class="active-filter-actions">
            <button
              class="link"
              type="button"
              id="peopleClearFilters">
              Clear all
            </button>

            <button
              class="people-save-view"
              type="button"
              id="peopleSaveView">
              Save filter
            </button>
          </span>
        </div>
      `;
}

function renderPeopleNormalToolbar()
{
    const activeFilterCount =
        activePeopleFilterCount();

    const hasActiveFilters =
        activeFilterCount > 0;

    return `
        <div class="people-toolbar people-normal-toolbar">
          <label class="app-search-field people-search-field">
            ${icon.search}

            <input
              id="peopleSearch"
              type="search"
              placeholder="Search people..."
              value="${escapeHtml(state.peopleSearch)}">
          </label>

          <button
            class="button secondary people-columns-button ${
                peopleColumnsCustomized()
                    ? 'active'
                    : ''
            }"
            type="button"
            id="peopleColumnsButton"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-label="Columns"
            title="Columns">
            ${icon.grid}
            <span>Columns</span>
          </button>

          <button
            class="people-filter-button ${
                hasActiveFilters
                    ? 'active'
                    : ''
            }"
            type="button"
            id="peopleFilterButton"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-label="${
                hasActiveFilters
                    ? `Filters, ${activeFilterCount} active`
                    : 'Open people filters'
            }">
            <span
              class="people-filter-icon"
              aria-hidden="true">
              ${
                    hasActiveFilters
                        ? icon.filterclear
                        : icon.filter
                }
            </span>

            <span>Filters</span>

            ${
                hasActiveFilters
                    ? `
                  <span class="people-filter-count">
                    ${activeFilterCount}
                  </span>
                `
                    : ''
            }
          </button>
          ${renderAppSortControl({
                id: 'peopleSort',
                field: state.peopleSort,
                direction: state.peopleSortDirection,
                ariaLabel: 'Sort people',
                options: APP_SORT_OPTIONS.people
            })}
          <button
            class="button primary"
            type="button"
            id="addPeoplePerson"
            aria-label="Add person"
            title="Add person">
            ${icon.plus}
            <span>Add person</span>
          </button>
        </div>
      `;
}

function renderPeopleBulkToolbar(rows)
{
    const count = peopleSelectedRecords().length;
    return `<div class="people-bulk-toolbar" aria-label="Bulk actions for selected people">
        <strong class="people-bulk-summary">${count} selected</strong>
        <div class="people-bulk-actions">
          <button class="button secondary" type="button" data-people-bulk-export>${icon.export} Export selected people</button>
          <button class="button secondary" type="button" data-people-bulk-add-board>${icon.whiteboard} Add selected people to a Geneograph board</button>
          <button class="button danger" type="button" data-people-bulk-delete>${icon.trash} Delete selected</button>
          <button class="button secondary" type="button" data-people-bulk-clear>Clear</button>
        </div>
      </div>`;
}

function renderPeopleDirectoryControls(rows)
{
    const toolbar = state.peopleSelectedIds.length
        ? renderPeopleBulkToolbar(rows)
        : renderPeopleNormalToolbar();

    return `<div class="people-directory-controls">
        <div class="people-toolbar-slot">${toolbar}</div>
        ${renderPeopleActiveFilters()}
      </div>`;
}

function renderPeople()
{
    if (!currentPeopleRecords().length && state.peopleView === 'profile')
        state.peopleView = 'directory';

    workspace.classList.remove(
        'no-sidebar'
    );

    sidebar.innerHTML = '';

    prunePeopleSelection();

    const selected =
        selectedPeopleRecord();

    if (
        state.peopleView === 'profile'
    )
    {
        clearPeopleSelection();

        renderPeopleSidebar();

        renderPeopleProfile(
            selected
        );

        return;
    }

    main.classList.remove(
        'people-profile-main'
    );

    renderPeopleSidebar();

    const hasProjectPeople = currentPeopleRecords().length > 0;

    /*
      * filteredPeople() returns the complete filtered and sorted
      * result. Pagination is deliberately applied afterward.
      */
    const filteredRows =
        filteredPeople();

    syncPeoplePaginationQuery();

    const pagination =
        getPeoplePagination(
            filteredRows.length
        );

    const visibleRows =
        filteredRows.slice(
            pagination.startIndex,
            pagination.endIndex
        );

    main.innerHTML = `
        <div
          class="
            people-layout
            ${
                !hasProjectPeople
                    ? 'no-preview'
                    : state.peoplePreviewCollapsed
                    ? 'preview-collapsed'
                    : ''
            }
          ">

          <section
            class="people-content"
            aria-label="People directory">

            ${renderPeopleDirectoryControls(
                visibleRows
            )}

            <div
              class="people-table-wrap">
              ${renderPeopleTable(
                    visibleRows
                )}
            </div>

            ${renderPeopleTableFooter(
                pagination
            )}
          </section>

          ${hasProjectPeople ? renderPersonSidebar(
                selected?.id,
                'people'
            ) : ''}
        </div>
      `;

    bindPeopleControls(
        visibleRows
    );
}

function renderPeopleSidebar()
{
    sidebar.innerHTML = renderPeopleSidebarInner();
    bindPeopleSidebar(sidebar);
}

function renderPeopleSidebarInner()
{
    const profileAvailable = currentPeopleRecords().length > 0;
    const savedViewsMarkup = peopleSavedViews.map(view =>
    {
        const isActive = state.peopleSavedViewId === view.id;

        return `<div class="people-saved-filter-row ${isActive ? 'active' : ''}">
          <button
            class="people-saved-filter-main"
            type="button"
            data-saved-view="${escapeHtml(view.id)}"
            title="${escapeHtml(view.name)}">
            ${icon.folder}
            <span class="people-saved-filter-name">${escapeHtml(view.name)}</span>
          </button>

          <button
            class="more-button people-saved-filter-more"
            type="button"
            data-saved-view-menu="${escapeHtml(view.id)}"
            aria-label="Actions for ${escapeHtml(view.name)}"
            aria-haspopup="menu">
            ${icon.more}
          </button>
        </div>`;
    }).join('');

    return `<div>
          <div class="side-section-title">Navigation</div>

          <div class="side-nav">
            <button
              class="side-link ${state.peopleView !== 'profile' && state.peopleSide === 'people' ? 'active' : ''}"
              type="button"
              data-people-side="people">
              ${icon.peoplegroup}
              <span>People</span>
            </button>

            <button
              class="side-link ${state.peopleView === 'profile' ? 'active' : ''} ${profileAvailable ? '' : 'people-nav-unavailable'}"
              type="button"
              data-open-profile
              ${profileAvailable ? '' : 'disabled'}>
              ${icon.profile}
              <span>Profile</span>
            </button>

            <button
              class="side-link people-nav-unavailable"
              type="button"
              data-placeholder-view="Review center">
              ${icon.search}
              <span>Review center</span>
              <span class="people-review-count">5</span>
            </button>

            <button
              class="side-link people-nav-unavailable"
              type="button"
              data-placeholder-view="Statistics">
              ${icon.grid}
              <span>Statistics</span>
            </button>
          </div>
        </div>

        <div>
          <div class="side-section-title with-add">
            <span>Saved filters</span>

            <button
              class="side-add-button"
              type="button"
              id="peopleSidebarSaveView"
              aria-label="Create saved filter">
              ${icon.plus}
            </button>
          </div>

          <div class="side-nav">
            ${savedViewsMarkup}
          </div>
        </div>`;
}

function renderPeopleTable(rows)
{
    const columns = peopleColumnsWithDefaults();
    const selectedIds = peopleSelectedIdSet();
    const headers = [
        '<th class="people-select-column"><input class="people-select-checkbox" type="checkbox" data-people-select-visible aria-label="Select all visible people"></th>',
        '<th>Name</th>',
        columns.living ? '<th>Living</th>' : '',
        columns.birth ? '<th>Birth date</th>' : '',
        columns.birthPlace ? '<th>Birth place</th>' : '',
        columns.death ? '<th>Death date</th>' : '',
        columns.deathPlace ? '<th>Death place</th>' : '',
        columns.updated ? '<th>Updated</th>' : '',
        '<th class="people-actions-column">Actions</th>'
    ].join('');
    return `<table class="people-table"><thead><tr>${headers}</tr></thead><tbody>
        ${rows.map(person =>
        {
            const isPreviewed = person.id === state.selectedPeopleId;
            const isSelected = selectedIds.has(person.id);
            const rowClasses = [isPreviewed ? 'is-previewed' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ');
            return `
            <tr
              class="${escapeHtml(
                    rowClasses
                )}"
              data-people-row="${escapeHtml(
                    person.id
                )}"
              ${
                    isPreviewed
                        ? 'aria-current="true"'
                        : ''
                }
              tabindex="0">
            <td class="people-select-column">
            <input class="people-select-checkbox" type="checkbox" data-people-select-id="${escapeHtml(person.id)}" aria-label="Select ${escapeHtml(person.name)}" ${isSelected ? 'checked' : ''}></td>
            <td>
              <div class="person-cell">
                ${renderPersonAvatar(
                    person,
                    'small-avatar'
                )}

                <div class="person-cell-copy">
                  <strong>
                    ${escapeHtml(person.name)}
                  </strong>

                  <span>
                    ${escapeHtml(person.relation)}
                  </span>
                </div>
              </div>
            </td>
                ${columns.living ? `<td>${escapeHtml(person.living)}</td>` : ''}${columns.birth ? `<td>${escapeHtml(person.birth)}</td>` : ''}${columns.birthPlace ? `<td>${escapeHtml(person.birthPlace)}</td>` : ''}${columns.death ? `<td>${escapeHtml(person.death)}</td>` : ''}${columns.deathPlace ? `<td>${escapeHtml(person.deathPlace)}</td>` : ''}${columns.updated ? `<td>${escapeHtml(person.updated)}</td>` : ''}<td class="people-actions-column"><button class="more-button people-row-action" type="button" aria-label="Actions for ${escapeHtml(person.name)}" aria-haspopup="menu" aria-expanded="false" data-people-row-menu="${person.id}">${icon.more}</button></td></tr>`;
        }).join('')}
      </tbody></table>`;
}

const PROFILE_CARD_SECTIONS = Object.freeze([
    Object.freeze({
        id: 'main',
        label: 'Main information'
    }),
    Object.freeze({
        id: 'education',
        label: 'Education'
    }),
    Object.freeze({
        id: 'work',
        label: 'Work'
    }),
    Object.freeze({
        id: 'other',
        label: 'Other'
    })
]);

function normalizeProfileCardSection(value)
{
    return PROFILE_CARD_SECTIONS.some(
        section => section.id === value
    )
        ? value
        : 'main';
}

function renderPeopleProfile(person)
{
    main.classList.add('people-profile-main');

    state.peopleProfileEditTab =
        normalizeProfileCardSection(
            state.peopleProfileEditTab
        );

    if (
        typeof state.peopleProfileEditing
        !== 'boolean'
    )
    {
        state.peopleProfileEditing = false;
    }

    main.innerHTML = `
        <div class="person-profile">
          <header class="profile-hero profile-command-hero">
            <button
              class="profile-back-link"
              type="button"
              id="backPeopleList">

              <span
                class="profile-back-link-icon"
                aria-hidden="true">
                ${icon.arrow}
              </span>

              <span>Back to people</span>
            </button>

            <div class="profile-hero-content">
              ${renderEditablePersonAvatar(
                    person,
                    'profile-hero-photo'
                )}

              <div class="profile-hero-copy">
                <h1>
                  ${escapeHtml(person.name)}
                </h1>
              </div>

              ${renderPeopleHeroLifeSummary(
                    person,
                    {
                        includeBirthPlace: true,
                        includeDeathPlace: true
                    }
                )}

              <p class="profile-hero-relation">
                ${escapeHtml(
                    person.parents
                        ? `Child of ${person.parents}`
                        : person.relation
                )}
              </p>

              <div
                class="
                  app-chip-row
                  app-chip-row--on-accent
                  person-profile-chips
                  profile-hero-tags
                ">

                ${renderLivingStatusChip(
                    person.living
                )}

                <span
                  class="
                    app-chip
                    app-chip--photos
                  ">

                  ${person.photos}
                  ${
                        person.photos === 1
                            ? 'photo'
                            : 'photos'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--files
                  ">

                  ${person.files}
                  ${
                        person.files === 1
                            ? 'file'
                            : 'files'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--notes
                  ">

                  ${person.notes}
                  ${
                        person.notes === 1
                            ? 'note'
                            : 'notes'
                    }
                </span>
              </div>
            </div>

            <div class="profile-hero-actions">
              <button
                class="button ${
                    state.peopleProfileEditing
                        ? 'secondary'
                        : 'primary'
                }"
                type="button"
                id="profileEditButton">

                ${
                    state.peopleProfileEditing
                        ? icon.close
                        : icon.edit
                }

                ${
                    state.peopleProfileEditing
                        ? 'Cancel editing'
                        : 'Edit profile'
                }
              </button>

              <button
                class="button secondary"
                type="button"
                id="profileAddRelative">

                ${icon.addperson}
                Add relative
              </button>

              <button
                class="button secondary"
                type="button"
                id="profileMoreActions"
                aria-haspopup="menu"
                aria-expanded="false">

                ${renderPanelButtonLabel(
                    icon.more,
                    'More actions'
                )}
              </button>
            </div>
          </header>

          <div class="person-profile__top">
            ${renderEditableProfileCard(person)}

            <div class="profile-family-slot">
              ${renderProfileFamilyHub(person)}
            </div>
          </div>

          <div class="person-profile__bottom">
            ${renderProfileConnectedCube(person)}
            ${renderProfileCompactTimeline(person)}
          </div>
        </div>
      `;

    bindPeopleProfileControls(person);
}

function peopleProfileAssets(person)
{
    const archiveMap = {
        silver: [
            { type: 'PDF', name: 'Pawford household register', meta: 'Added Mar 03 2016 - Source assigned', fileId: 'af1' },
            { type: 'JPG', name: 'Silver kitten portrait', meta: 'Added Feb 20 2021 - Personal album', fileId: null },
            { type: 'PDF', name: 'Meowbridge marriage record', meta: 'Added May 7 2026 - Linked to relationship', fileId: 'af5' },
            { type: 'JPG', name: 'Fishmarket Row census extract', meta: 'Added Today - Needs review', fileId: 'af2' }
        ],
        luna: [
            { type: 'JPG', name: 'Luna Purrington portrait', meta: 'Added Apr 30 2026 - Personal album', fileId: null },
            { type: 'PDF', name: 'Meowbridge marriage record', meta: 'Added May 7 2026 - Linked to relationship', fileId: 'af5' }
        ],
        barnaby: [
            { type: 'PDF', name: 'Pawford household register', meta: 'Added May 19 2026 - Source assigned', fileId: 'af5' },
            { type: 'JPG', name: 'Old Cattery burial index', meta: 'Added Apr 3 2026 - Needs review', fileId: 'af6' }
        ],
        daisy: [
            { type: 'PDF', name: 'Meowbridge marriage record', meta: 'Added Today - Source assigned', fileId: 'af1' },
            { type: 'JPG', name: 'Daisy Milkpaw scan', meta: 'Added May 2 2026 - Family album', fileId: null }
        ]
    };
    return {
        archive:
          archiveMap[person.id]
          || [
              {
                  type:
                'PDF',

                  name:
                'Linked archive file.pdf',

                  meta:
                'Added recently - Source assigned',

                  fileId:
                null
              }
          ]
    };
}

function splitProfileName(person)
{
    const centralPerson = getPerson(person?.id);
    const names = centralPerson?.names || {};

    return {
        first: normalizeNameSegment(
            names.first ?? person?.first ?? ''
        ),

        patronym: normalizeNameSegment(
            names.middle ?? ''
        ),

        surname: normalizeNameSegment(
            names.last ?? person?.surname ?? ''
        )
    };
}

function renderProfileInfoRow(label, value)
{
    return `
        <div class="profile-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
}

function renderProfileInfoRowRaw(label, html)
{
    return `
        <div class="profile-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${html}</strong>
        </div>
      `;
}

function renderProfileStatusValue(status)
{
    const safeStatus = status || 'Unknown';

    return `
        <span class="profile-status-inline">
          <span
            class="
              add-person-status-dot
              ${statusDotClass(safeStatus)}
            "
            aria-hidden="true">
          </span>

          ${escapeHtml(safeStatus)}
        </span>
      `;
}

function renderProfilePartnersInfo(person)
{
    const centralPerson = getPerson(person?.id);

    if (!centralPerson)
    {
        return `
          <div class="panel-muted">
            No partners recorded
          </div>
        `;
    }

    const rows = getPartnerRelationships(
        centralPerson.id
    )
        .filter(family =>
            !family.projectId
          || !centralPerson.projectId
          || family.projectId
            === centralPerson.projectId
        )
        .map(family =>
        {
            const partnerId = familyPartnerId(
                family,
                centralPerson.id
            );

            const partner = getPerson(partnerId);

            if (!partner) return '';

            const relationshipType =
                relationshipTypeFromLegacy(family);

            const relationshipLabel =
                relationshipType
            === 'Unknown relationship'
                    ? 'Relationship'
                    : relationshipType;

            const dateLabel =
                partnerRelationshipDateSummary(
                    family
                ).rangeLabel;

            const partnerName =
                partner.names?.display
            || 'Unnamed person';

            return renderProfileInfoRowRaw(
                relationshipLabel,
                `
              <span class="profile-partner-value">
                <button
                  class="profile-partner-link"
                  type="button"
                  data-profile-partner-id="${
                        escapeHtml(partner.id)
                    }">
                  ${escapeHtml(partnerName)}
                </button>

                ${dateLabel
                    ? `
                    <small class="profile-partner-meta">
                      ${escapeHtml(dateLabel)}
                    </small>
                  `
                    : ''}
              </span>
            `
            );
        })
        .filter(Boolean);

    return rows.length
        ? rows.join('')
        : `
          <div class="panel-muted">
            No partners recorded
          </div>
        `;
}

function renderEditableProfileCard(person)
{
    const editing = Boolean(
        state.peopleProfileEditing
    );

    const activeSection =
        normalizeProfileCardSection(
            state.peopleProfileEditTab
        );

    return `
        <article
          class="
            profile-card
            profile-full-card
            ${editing ? 'editing' : 'locked'}
          "
          data-profile-card-root>

          <h3>
            <span class="section-title">
              ${icon.people}
              Profile
            </span>

            <span
              class="
                profile-edit-card-state
                ${editing ? 'editing' : ''}
              ">
              ${editing ? 'Editing' : 'Locked'}
            </span>
          </h3>

          <div class="profile-card-body">
            ${renderProfileCardTabs(activeSection)}

            ${renderProfileCardPanels(
                person,
                editing,
                activeSection
            )}

            ${editing
                ? `
                <div class="profile-edit-inline-actions">
                  <button
                    class="button secondary"
                    type="button"
                    id="profileCancelEdit">
                    Cancel
                  </button>

                  <button
                    class="button primary"
                    type="button"
                    id="profileSaveInlineEdit">
                    Save changes
                  </button>
                </div>
              `
                : ''}
          </div>
        </article>
      `;
}

function renderProfileLockedPanelContent(
    person,
    sectionId
)
{
    const activeSection =
        normalizeProfileCardSection(sectionId);

    const name = splitProfileName(person);
    const details = peopleProfileDetailsFor(person);

    const isDeceased =
        person.living === 'Deceased';

    const isFemale =
        person.gender === 'female';

    const centralPerson = getPerson(person.id);

    const birthLabel =
        formatGenealogyDateLabel(
            centralPerson?.birth || person.birth
        );

    const deathLabel =
        formatGenealogyDateLabel(
            centralPerson?.death || person.death
        );

    const deathPlaceLabel =
        cleanEditFieldValue(person.deathPlace);

    if (activeSection === 'education')
    {
        return `
          <div
            class="
              profile-readonly-grid
              profile-readonly-grid-single
            ">

            <section class="profile-info-block wide">
              <h4>Education</h4>

              ${renderProfileInfoRow(
                    'Institution name',
                    details.educationInstitutionName || '-'
                )}

              ${renderProfileInfoRow(
                    'Institution type',
                    details.educationInstitutionType || '-'
                )}

              ${renderProfileInfoRow(
                    'Education or credential',
                    details.educationValue || '-'
                )}

              ${renderProfileInfoRow(
                    'Place',
                    details.educationPlace || '-'
                )}

              ${renderProfileInfoRow(
                    'From',
                    profileDetailDateLabel(
                        details.educationFromDate
                    )
                )}

              ${renderProfileInfoRow(
                    'To',
                    profileDetailDateLabel(
                        details.educationToDate
                    )
                )}

              ${renderProfileInfoRow(
                    'Notes',
                    details.educationNotes || '-'
                )}
            </section>
          </div>
        `;
    }

    if (activeSection === 'work')
    {
        return `
          <div
            class="
              profile-readonly-grid
              profile-readonly-grid-single
            ">

            <section class="profile-info-block wide">
              <h4>Work</h4>

              ${renderProfileInfoRow(
                    'Company name',
                    details.workCompany || '-'
                )}

              ${renderProfileInfoRow(
                    'Occupation',
                    details.workOccupation || '-'
                )}

              ${renderProfileInfoRow(
                    'From',
                    profileDetailDateLabel(
                        details.workFromDate
                    )
                )}

              ${renderProfileInfoRow(
                    'To',
                    profileDetailDateLabel(
                        details.workToDate
                    )
                )}

              ${renderProfileInfoRow(
                    'Notes',
                    details.workNotes || '-'
                )}
            </section>
          </div>
        `;
    }

    if (activeSection === 'other')
    {
        return `
          <div
            class="
              profile-readonly-grid
              profile-readonly-grid-single
            ">

            <section class="profile-info-block wide">
              <h4>Other</h4>

              ${renderProfileInfoRow(
                    'Religion',
                    normalizeReligionValue(
                        details.religion
                    )
                )}

              ${renderProfileInfoRow(
                    'Baptism date',
                    profileDetailDateLabel(
                        details.baptismDate
                    )
                )}

              ${renderProfileInfoRow(
                    'Baptism place',
                    details.baptismPlace || '-'
                )}

              ${renderProfileInfoRow(
                    'Privacy',
                    person.living === 'Living'
                        ? 'Living person protected'
                        : 'Standard record'
                )}
            </section>
          </div>
        `;
    }

    return `
        <div
          class="
            profile-readonly-grid
            profile-readonly-grid-tabbed
            main
          ">

          <section class="profile-info-block">
            <h4>Main information</h4>

            ${renderProfileInfoRow(
                'First name',
                name.first || '-'
            )}

            ${renderProfileInfoRow(
                'Last name',
                name.surname || '-'
            )}

            ${renderProfileInfoRow(
                'Patronym',
                name.patronym || '-'
            )}

            ${isFemale
                ? renderProfileInfoRow(
                    'Maiden name',
                    details.maidenName || '-'
                )
                : ''}

            ${renderProfileInfoRow(
                'Gender',
                isFemale
                    ? 'Female'
                    : person.gender === 'male'
                        ? 'Male'
                        : 'Unknown'
            )}

            ${renderProfileInfoRowRaw(
                'Living status',
                renderProfileStatusValue(
                    person.living || 'Unknown'
                )
            )}

            ${renderProfileInfoRow(
                'Prefix',
                details.prefix || '-'
            )}

            ${renderProfileInfoRow(
                'Suffix',
                details.suffix || '-'
            )}
          </section>

          <section class="profile-info-block">
            <h4>Birth and life</h4>

            ${renderProfileInfoRow(
                'Birth date',
                birthLabel || '-'
            )}

            ${renderProfileInfoRow(
                'Birth place',
                person.birthPlace || '-'
            )}

            ${isDeceased
                ? `
                ${renderProfileInfoRow(
                    'Death date',
                    deathLabel || '-'
                )}

                ${renderProfileInfoRow(
                    'Death place',
                    deathPlaceLabel || '-'
                )}

                ${renderProfileInfoRow(
                    'Death reason',
                    details.deathReason || '-'
                )}

                ${renderProfileInfoRow(
                    'Burial place',
                    details.burialPlace || '-'
                )}
              `
                : ''}
          </section>

          <section class="profile-info-block">
            <h4>Partners</h4>
            ${renderProfilePartnersInfo(person)}
          </section>
        </div>
      `;
}

function renderProfileCardTabs(activeSection)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div
          class="profile-card-tabs"
          role="tablist"
          aria-label="Profile card sections">

          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                return `
              <button
                class="
                  profile-card-tab
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(tabId)}"
                type="button"
                role="tab"
                aria-selected="${
                    isActive ? 'true' : 'false'
                }"
                aria-controls="${escapeHtml(panelId)}"
                tabindex="${isActive ? '0' : '-1'}"
                data-profile-card-tab="${
                    escapeHtml(section.id)
                }">
                ${escapeHtml(section.label)}
              </button>
            `;
            }).join('')}
        </div>
      `;
}

function renderProfileEditPanelContent(
    person,
    sectionId
)
{
    switch (
        normalizeProfileCardSection(sectionId)
    )
    {
        case 'education':
            return renderProfileEducationEditFields(
                person
            );

        case 'work':
            return renderProfileWorkEditFields(
                person
            );

        case 'other':
            return renderProfileOtherEditFields(
                person
            );

        default:
            return renderProfileMainEditFields(
                person
            );
    }
}

function renderProfileCardPanels(
    person,
    editing,
    activeSection
)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div class="profile-card-panel-stack">
          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                const content = editing
                    ? renderProfileEditPanelContent(
                        person,
                        section.id
                    )
                    : renderProfileLockedPanelContent(
                        person,
                        section.id
                    );

                return `
              <section
                class="
                  profile-card-panel
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(panelId)}"
                role="tabpanel"
                aria-labelledby="${escapeHtml(tabId)}"
                aria-hidden="${
                    isActive ? 'false' : 'true'
                }"
                data-profile-card-panel="${
                    escapeHtml(section.id)
                }"
                ${isActive ? '' : 'inert'}>
                ${content}
              </section>
            `;
            }).join('')}
        </div>
      `;
}

function renderProfileMainEditFields(person)
{
    const name = splitProfileName(person);
    const details = peopleProfileDetailsFor(person);
    const isFemale = person.gender === 'female';
    const currentStatus = person.living === 'Deceased' ? 'Deceased' : person.living === 'Unknown' ? 'Unknown' : 'Living';
    const isDeceased = currentStatus === 'Deceased';
    const genderValue = person.gender === 'female' ? 'Female' : person.gender === 'male' ? 'Male' : 'Unknown';
    const centralPerson = getPerson(person.id);
    const birthPlaceValue = editPlaceValue(centralPerson?.birth?.placeId, centralPerson?.birth?.placeText || person.birthPlace);
    const rawDeathPlace = person.deathPlace === '-' ? '' : (person.deathPlace || '');
    const deathPlaceValue = editPlaceValue(centralPerson?.death?.placeId, centralPerson?.death?.placeText || rawDeathPlace);
    const burialPlaceValue = editPlaceValue(centralPerson?.death?.burialPlaceId, centralPerson?.death?.burialPlaceText || details.burialPlace);
    const birthDateModel = centralPerson?.birth || { date: person.birth, dateLabel: person.birth, dateType: details.birthDateType || 'Unknown' };
    const deathDateModel = centralPerson?.death || { date: person.death, dateLabel: person.death, dateType: details.deathDateType || 'Exact date' };
    return `<div class="profile-main-edit-grid ${isFemale ? 'has-maiden' : 'no-maiden'} ${isDeceased ? 'is-deceased' : ''}">
        <div class="field profile-field-gender add-person-select-field">
          <label>Gender</label>
          <select class="compact-select add-person-select" id="profileInlineGender">
            <option ${genderValue === 'Male' ? 'selected' : ''}>Male</option>
            <option ${genderValue === 'Female' ? 'selected' : ''}>Female</option>
            <option ${genderValue === 'Unknown' ? 'selected' : ''}>Unknown</option>
          </select>
          <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
        </div>
        <div class="field add-person-status-field profile-status-field profile-field-living"><label>Living status</label><button class="add-person-status-button" type="button" id="profileStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(currentStatus)}"></span><span id="profileStatusLabel">${escapeHtml(currentStatus)}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="profileInlineLiving" value="${escapeHtml(currentStatus)}"><div class="add-person-status-menu" id="profileStatusMenu" role="listbox" hidden>${['Living','Deceased','Unknown'].map(status => `<button class="add-person-status-option ${status === currentStatus ? 'active' : ''}" type="button" role="option" aria-selected="${status === currentStatus ? 'true' : 'false'}" data-profile-status-value="${status}"><span><span class="add-person-status-dot ${statusDotClass(status)}"></span>${status}</span><span data-profile-status-check>${status === currentStatus ? icon.check : ''}</span></button>`).join('')}</div></div>

        <div class="field profile-field-first"><label>First name</label><input id="profileInlineFirst" data-source-value="${escapeHtml(name.first)}" value="${escapeHtml(localizedDataFieldValue(name.first))}"></div>
        <div class="field profile-field-last"><label>Last name</label><input id="profileInlineLast" data-source-value="${escapeHtml(name.surname)}" value="${escapeHtml(localizedDataFieldValue(name.surname))}"></div>
        ${renderNameAffixCombobox({ id: 'profileInlinePrefix', label: 'Prefix', value: details.prefix || '', kind: 'prefix', className: 'profile-field-prefix' })}

        <div class="field profile-field-patronym"><label>Patronym</label><input id="profileInlinePatronym" data-source-value="${escapeHtml(name.patronym)}" value="${escapeHtml(localizedDataFieldValue(name.patronym))}"></div>
        <div class="field profile-field-maiden" id="profileInlineMaiden" ${isFemale ? '' : 'hidden'}><label>Maiden Name</label><input id="profileInlineMaidenInput" data-source-value="${escapeHtml(details.maidenName || '')}" value="${escapeHtml(localizedDataFieldValue(details.maidenName || ''))}" placeholder="Maiden surname"></div>
        ${renderNameAffixCombobox({ id: 'profileInlineSuffix', label: 'Suffix', value: details.suffix || '', kind: 'suffix', className: 'profile-field-suffix' })}

        ${renderGenealogyDateField('profileInlineBirthField', 'Birth Date', birthDateModel, {
            inputId: 'profileInlineBirth',
            typeId: 'profileInlineBirthType',
            className: 'profile-field-birth-date genealogy-date-inline-range',
            placeholder: 'e.g. 14 Feb 1915'
        })}
        ${renderPlaceCombobox({
            id: 'profileInlineBirthPlace',
            label: 'Birth Place',
            value: birthPlaceValue,
            selectedPlaceId: centralPerson?.birth?.placeId || '',
            addressValue: centralPerson?.birth?.address || '',
            placeholder: 'e.g. Pawford, England',
            className: 'profile-field-birth-place'
        })}

        <div class="profile-death-fields-group" id="profileInlineDeathFields" ${isDeceased ? '' : 'hidden'}>
          ${renderGenealogyDateField('profileInlineDeathField', 'Death Date', deathDateModel, {
                inputId: 'profileInlineDeath',
                typeId: 'profileInlineDeathType',
                className: 'profile-field-death-date genealogy-date-inline-range',
                placeholder: 'e.g. 20 Oct 1926',
                defaultDateType: 'Exact date'
            })}
          ${renderPlaceCombobox({
                id: 'profileInlineDeathPlace',
                label: 'Death Place',
                value: deathPlaceValue,
                selectedPlaceId: centralPerson?.death?.placeId || '',
                addressValue: centralPerson?.death?.address || '',
                placeholder: 'e.g. Meowbridge, England',
                className: 'profile-field-death-place'
            })}
        </div>
        <div class="profile-death-fields-group" id="profileInlineDeathExtraFields" ${isDeceased ? '' : 'hidden'}>
          <div class="field profile-field-death-reason"><label>Cause of Death</label><input id="profileInlineDeathReason" value="${escapeHtml(details.deathReason || '')}" placeholder="Cause or reason"></div>
          ${renderPlaceCombobox({
                id: 'profileInlineBurialPlace',
                label: 'Burial Place',
                value: burialPlaceValue,
                selectedPlaceId: centralPerson?.death?.burialPlaceId || '',
                addressValue: centralPerson?.death?.burialAddress || '',
                placeholder: 'Burial place',
                className: 'profile-field-burial-place'
            })}
        </div>
      </div>`;
}

function renderProfileEducationEditFields(person)
{
    const centralPerson = ensurePersonCentralStructures(
        getPerson(person.id) || person
    );

    const details = peopleProfileDetailsFor(person);
    const education = personAttributeByTag(centralPerson, 'EDUC');

    return `
        <div class="add-person-fact-grid">
          <div class="field full">
            <label for="profileEducationInstitutionName">
              Institution name
            </label>

            <input
              id="profileEducationInstitutionName"
              placeholder="e.g. Pawford Grammar School"
              data-source-value="${escapeHtml(details.educationInstitutionName || '')}"
              value="${escapeHtml(localizedDataFieldValue(
                    details.educationInstitutionName || ''
                ))}">
          </div>

          <div class="field add-person-select-field">
            <label for="profileEducationInstitutionType">
              Institution type
            </label>

            <select
              class="compact-select add-person-select"
              id="profileEducationInstitutionType">
              ${educationInstitutionTypeOptions(
                    details.educationInstitutionType
                )}
            </select>

            <span
              class="add-person-select-chevron"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </div>

          <div class="field">
            <label for="profileEducationValue">
              Education or credential
            </label>

            <input
              id="profileEducationValue"
              placeholder="e.g. Secondary education, BA, apprenticeship"
              data-source-value="${escapeHtml(details.educationValue || '')}"
              value="${escapeHtml(localizedDataFieldValue(details.educationValue || ''))}">
          </div>

          ${renderPlaceCombobox({
                id: 'profileEducationPlace',
                label: 'Place',
                value: editPlaceValue(
                    education?.placeId,
                    education?.placeText || details.educationPlace
                ),
                selectedPlaceId: education?.placeId || '',
                addressValue: education?.address || '',
                placeholder: 'e.g. Pawford, England',
                className: 'full'
            })}

          <div class="add-person-fact-date-row">
            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'profileEducationFromDate',
                    'Start date',
                    details.educationFromDate,
                    {
                        inputId: 'profileEducationFromDate',
                        typeId: 'profileEducationFromDateType',
                        defaultDateType: 'Year only',
                        placeholder: 'e.g. 1915',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>

            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'profileEducationToDate',
                    'End date',
                    details.educationToDate,
                    {
                        inputId: 'profileEducationToDate',
                        typeId: 'profileEducationToDateType',
                        defaultDateType: 'Year only',
                        placeholder: 'e.g. 1920',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>
          </div>

          <div class="field full">
            <label for="profileEducationNotes">Notes</label>

            <textarea
              id="profileEducationNotes"
              data-source-value="${escapeHtml(details.educationNotes || '')}"
              placeholder="Education notes">${escapeHtml(localizedDataFieldValue(
                    details.educationNotes || ''
                ))}</textarea>
          </div>
        </div>
      `;
}

function renderProfileWorkEditFields(person)
{
    const details = peopleProfileDetailsFor(person);

    return `
        <div class="add-person-fact-grid">
          <div class="field">
            <label for="profileWorkCompany">Company name</label>

            <input
              id="profileWorkCompany"
              placeholder="e.g. Pawford School"
              value="${escapeHtml(details.workCompany || '')}">
          </div>

          <div class="field">
            <label for="profileWorkOccupation">Occupation</label>

            <input
              id="profileWorkOccupation"
              placeholder="e.g. Teacher"
              value="${escapeHtml(details.workOccupation || '')}">
          </div>

          <div class="add-person-fact-date-row">
            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'profileWorkFromDate',
                    'Start date',
                    details.workFromDate,
                    {
                        inputId: 'profileWorkFromDate',
                        typeId: 'profileWorkFromDateType',
                        defaultDateType: 'Exact date',
                        placeholder: 'e.g. 14 Feb 1915',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>

            <div class="profile-edit-date-cell">
              ${renderGenealogyDateField(
                    'profileWorkToDate',
                    'End date',
                    details.workToDate,
                    {
                        inputId: 'profileWorkToDate',
                        typeId: 'profileWorkToDateType',
                        defaultDateType: 'Exact date',
                        placeholder: 'e.g. 14 Feb 1925',
                        className: 'genealogy-date-inline-range'
                    }
                )}
            </div>
          </div>

          <div class="field full">
            <label for="profileWorkNotes">Notes</label>

            <textarea
              id="profileWorkNotes"
              placeholder="Work notes">${escapeHtml(
                    details.workNotes || ''
                )}</textarea>
          </div>
        </div>
      `;
}

function renderProfileOtherEditFields(person)
{
    const centralPerson = ensurePersonCentralStructures(
        getPerson(person.id) || person
    );

    const details = peopleProfileDetailsFor(person);
    const baptism = personEventByTag(centralPerson, 'BAPM');

    return `
        <div class="profile-card-edit-grid two profile-other-edit-grid">
          ${renderReligionField({
                id: 'profileReligion',
                value: details.religion,
                className: 'profile-other-religion'
            })}

          ${renderGenealogyDateField(
                'profileBaptismDate',
                'Baptism date',
                details.baptismDate,
                {
                    inputId: 'profileBaptismDate',
                    typeId: 'profileBaptismDateType',
                    className: 'profile-other-baptism-date genealogy-date-inline-range',
                    defaultDateType: 'Exact date',
                    placeholder: 'e.g. 14 Feb 1915'
                }
            )}

          ${renderPlaceCombobox({
                id: 'profileBaptismPlace',
                label: 'Baptism place',
                value: editPlaceValue(
                    baptism?.placeId,
                    baptism?.placeText || details.baptismPlace
                ),
                selectedPlaceId: baptism?.placeId || '',
                addressValue: baptism?.address || '',
                placeholder: 'e.g. Pawford, England',
                className: 'full profile-other-baptism-place'
            })}
        </div>
      `;
}

function profileResourceNoun(count, singular, plural)
{
    return count === 1 ? singular : plural;
}

function renderProfileResourceEmpty(message)
{
    return `
        <div class="profile-resource-empty">
          ${escapeHtml(message)}
        </div>
      `;
}

function renderProfileResourceCard({
    type,
    iconSvg,
    title,
    count,
    singular,
    plural,
    addLabel,
    addToast,
    addAction = '',
    showFooter = true,
    body
})
{
    const noun = profileResourceNoun(
        count,
        singular,
        plural
    );

    return `
        <article
          class="
            profile-resource-card
            profile-connected-card
            profile-resource-card--${type}
          ">

          <h3 class="profile-connected-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${iconSvg}
              </span>

              <span>${escapeHtml(title)}</span>

              <span
                class="profile-resource-count"
                aria-label="${escapeHtml(`${count} ${noun}`)}">
                ${count}
              </span>
            </span>

            ${addLabel
                    ? `
                <span class="profile-connected-actions">
                  <button
                    class="profile-connected-action"
                    type="button"
                    ${
                        addAction
                            ? `data-profile-resource-action="${escapeHtml(addAction)}"`
                            : `data-toast="${escapeHtml(addToast || '')}"`
                    }>

                    ${icon.plus}

                    <span>
                      ${escapeHtml(addLabel)}
                    </span>
                  </button>
                </span>
              `
                    : ''
            }
          </h3>

          <div class="profile-resource-card__body">
            ${body}
          </div>

          ${showFooter && count > 0
                ? `
              <button
                class="profile-resource-card__footer"
                type="button"
                data-profile-view-all="${type}">
                <span>
                  View all ${count} ${escapeHtml(noun)}
                </span>

                ${icon.chevron}
              </button>
            `
                : ''}
        </article>
      `;
}

function profileArchiveAddedLabel(item)
{
    const meta = String(item?.meta || '').trim();

    if (!meta) return 'Added recently';

    return meta.split(/\s+-\s+/)[0]
        || 'Added recently';
}

function profileConnectedPlaceEventLabel(
    event
)
{
    return (
        cleanEditFieldValue(
            event?.title
        )
        || cleanEditFieldValue(
            event?.type
        )
        || t('Event')
    );
}

function profileConnectedPlaceMeta(
    events
)
{
    const labels = [
        ...new Set(
            events
                .map(
                    profileConnectedPlaceEventLabel
                )
                .filter(Boolean)
        )
    ];

    const visibleLabels =
        labels.slice(0, 2);

    const remainingCount =
        labels.length
        - visibleLabels.length;

    return [
        visibleLabels.join(' · '),

        remainingCount > 0
            ? `+${remainingCount} ${t('more')}`
            : ''
    ]
        .filter(Boolean)
        .join(' · ')
        || t('Linked event');
}

function getProfileConnectedPlaces(
    personId
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return [];
    }

    const groupedPlaces =
        new Map();

    (sampleData.events || [])
        .forEach(event =>
        {
            if (
                event?.projectId
              !== person.projectId
            )
            {
                return;
            }

            if (
                !Array.isArray(
                    event.personIds
                )
            || !event.personIds.includes(
                person.id
            )
            )
            {
                return;
            }

            const place =
                getPlace(event.placeId);

            if (
                !place
            || place.deleted
            || place.projectId
              !== person.projectId
            )
            {
                return;
            }

            const existing =
                groupedPlaces.get(place.id)
            || {
                id: place.id,
                place,
                events: [],
                sortValue:
                Number.POSITIVE_INFINITY
            };

            existing.events.push(event);

            existing.sortValue =
                Math.min(
                    existing.sortValue,
                    parseTimelineSortValue(
                        event
                    )
                );

            groupedPlaces.set(
                place.id,
                existing
            );
        });

    return [
        ...groupedPlaces.values()
    ]
        .map(group => ({
            id: group.place.id,

            title:
            placeDisplayText(
                group.place
            )
            || t('Unnamed place'),

            meta:
            profileConnectedPlaceMeta(
                group.events
            ),

            hasCoordinates:
            placeHasCoordinates(
                group.place
            ),

            sortValue:
            group.sortValue
        }))
        .sort(
            (first, second) =>
                first.sortValue
              - second.sortValue
            || first.title.localeCompare(
                second.title
            )
        );
}

function renderProfileConnectedSources(
    person
)
{
    const centralPerson =
        getPerson(
            person.id
        );

    const sources =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            )
            : [];

    const body =
        centralPerson
            ? renderConnectedSourceList({
                targetType:
                'person',

                targetId:
                centralPerson.id,

                projectId:
                centralPerson.projectId,

                sources,

                emptyText:
                'No sources linked to this person.'
            })
            : renderProfileResourceEmpty(
                'No sources linked to this person.'
            );

    return renderProfileResourceCard({
        type:
          'sources',

        iconSvg:
          icon.archive,

        title:
          'Sources',

        count:
          sources.length,

        singular:
          'source',

        plural:
          'sources',

        addLabel:
          'Add source',

        addAction:
          'add-sources',

        showFooter:
          false,

        body
    });
}

function renderProfileConnectedCube(
    person
)
{
    return `
        <section
          class="profile-connected-cube"
          aria-label="Connected profile items">

          ${renderProfileConnectedPhotos(
                person
            )}
          ${renderProfileConnectedFiles(
                person
            )}
          ${renderProfileConnectedNotes(
                person
            )}
          ${renderProfileConnectedPlaces(
                person
            )}
        </section>
      `;
}

function renderProfileCompactTimeline(person)
{
    const timelineContent =
        renderFamilyTreeTimeline(person.id);

    return `
        <section
          class="profile-compact-timeline profile-connected-card"
          aria-label="Timeline">

          <h3 class="profile-connected-head profile-timeline-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${icon.clock}
              </span>

              <span>Timeline</span>
            </span>

            <span class="profile-connected-actions">
              <button
                class="profile-connected-action"
                type="button"
                data-profile-add-fact>
                ${icon.plus}
                <span>Add fact</span>
              </button>
            </span>
          </h3>

          <div class="profile-compact-timeline-list">
            ${timelineContent}
          </div>
        </section>
      `;
}

function renderProfileConnectedPhotos(person)
{
    const photos = getPhotosForPerson(person.id);
    const hasOverflow = photos.length > 3;
    const trackId = `profilePhotoTrack-${person.id}`;

    const body = photos.length
        ? `
          <div
            class="
              profile-photo-carousel
              ${hasOverflow ? 'has-overflow' : ''}
            "
            data-profile-photo-carousel>

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    previous
                  "
                  type="button"
                  data-profile-photo-prev
                  aria-label="Previous photos"
                  aria-controls="${escapeHtml(trackId)}"
                  disabled>
                  ${icon.arrow}
                </button>
              `
                : ''}

            <div
              class="profile-photo-track"
              id="${escapeHtml(trackId)}"
              data-profile-photo-track
              aria-label="Photos for ${escapeHtml(person.name)}">

              ${photos
                    .map(photo =>
                    {
                        const label =
                            photo.title
                    || photo.filename
                    || 'Photo';

                        return `
                    <div
                      class="
                        person-connected-photo-item
                        profile-photo-item
                      ">

                      <button
                        class="profile-photo-thumb"
                        type="button"
                        data-profile-photo="${escapeHtml(
                            photo.id
                        )}"
                        title="${escapeHtml(
                            label
                        )}"
                        aria-label="Open ${escapeHtml(
                            label
                        )}">

                        ${renderPhotoThumbnail(
                            photo,
                            { label }
                        )}
                      </button>

                      ${renderPersonPhotoUnlinkButton(
                            photo,
                            person.id
                        )}
                    </div>
                  `;
                    })
                    .join('')}
            </div>

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    next
                  "
                  type="button"
                  data-profile-photo-next
                  aria-label="Next photos"
                  aria-controls="${escapeHtml(trackId)}">
                  ${icon.chevron}
                </button>
              `
                : ''}
          </div>
        `
        : renderProfileResourceEmpty('No photos yet');

    return renderProfileResourceCard({
        type: 'photos',
        iconSvg: icon.image,
        title: 'Photos',
        count: photos.length,
        singular: 'photo',
        plural: 'photos',
        addLabel: 'Add photos',
        addAction: 'add-photos',
        body
    });
}

function renderProfileConnectedFiles(
    person
)
{
    const files =
        getArchiveFilesForPerson(
            person.id
        );

    const preview =
        files.slice(
            0,
            3
        );

    const body =
        preview.length
            ? renderConnectedFileList({
                files:
              preview,

                contextType:
              'person',

                contextId:
              person.id,

                emptyText:
              'No archive files linked'
            })
            : renderProfileResourceEmpty(
                'No archive files linked'
            );

    return renderProfileResourceCard({
        type:
          'archive',

        iconSvg:
          icon.file,

        title:
          'Archive',

        count:
          files.length,

        singular:
          'file',

        plural:
          'files',

        addLabel:
          'Add file',

        addAction:
          'add-files',

        body
    });
}

function renderProfileNoteTiles(
    person,
    notes =
        getNotesForPerson(
            person.id
        )
)
{
    const preview =
        notes.slice(
            0,
            3
        );

    if (!preview.length)
    {
        return renderProfileResourceEmpty(
            'No notes yet'
        );
    }

    const personLabel =
        person?.names?.display
        || person?.name
        || 'this person';

    return `
        <div
          class="
            profile-note-tile-grid
          "
          role="list"
          aria-label="Notes linked to ${escapeHtml(
                personLabel
            )}">

          ${preview
                .map(note =>
                {
                    const noteTitle =
                        note.title
                || 'Untitled note';

                    const previewText =
                        noteExcerpt(
                            note,
                            120
                        )
                || 'No note content';

                    const collectionLabel =
                        formatNoteCollectionSummary(
                            note
                        )
                || 'Research note';

                    const updatedLabel =
                        formatNoteRelativeUpdatedAt(
                            note
                        )
                || 'Updated date unknown';

                    return `
                <div
                  class="
                    profile-note-tile
                  "
                  role="listitem">

                  <button
                    class="
                      profile-note-tile__open
                    "
                    type="button"
                    data-connected-note-id="${escapeHtml(
                        note.id
                    )}"
                    data-connected-note-context-type="person"
                    data-connected-note-context-id="${escapeHtml(
                        person.id
                    )}"
                    aria-label="Open note: ${escapeHtml(
                        noteTitle
                    )}">

                    <strong
                      class="
                        profile-note-tile__title
                      "
                      title="${escapeHtml(
                            noteTitle
                        )}">

                      ${escapeHtml(
                            noteTitle
                        )}
                    </strong>

                    <span
                      class="
                        profile-note-tile__preview
                      "
                      title="${escapeHtml(
                            previewText
                        )}">

                      ${escapeHtml(
                            previewText
                        )}
                    </span>

                    <span
                      class="
                        profile-note-tile__collection
                      "
                      title="${escapeHtml(
                            collectionLabel
                        )}">

                      ${escapeHtml(
                            collectionLabel
                        )}
                    </span>

                    <span
                      class="
                        profile-note-tile__updated
                      "
                      title="${escapeHtml(
                            updatedLabel
                        )}">

                      ${escapeHtml(
                            updatedLabel
                        )}
                    </span>
                  </button>

                  <button
                    class="
                      connected-note-unlink
                      profile-note-tile__unlink
                    "
                    type="button"
                    data-connected-note-unlink="${escapeHtml(
                        note.id
                    )}"
                    data-connected-note-context-type="person"
                    data-connected-note-context-id="${escapeHtml(
                        person.id
                    )}"
                    aria-label="Unlink ${escapeHtml(
                        noteTitle
                    )} from ${escapeHtml(
                        personLabel
                    )}"
                    title="Unlink note">

                    ${icon.unlink}
                  </button>
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderProfileConnectedNotes(
    person
)
{
    const notes =
        getNotesForPerson(
            person.id
        );

    return renderProfileResourceCard({
        type:
          'notes',

        iconSvg:
          icon.note,

        title:
          'Notes',

        count:
          notes.length,

        singular:
          'note',

        plural:
          'notes',

        addLabel:
          'Add note',

        addAction:
          'add-note',

        body:
          renderProfileNoteTiles(
              person,
              notes
          )
    });
}

function renderProfileConnectedPlaces(
    person
)
{
    const places =
        getProfileConnectedPlaces(
            person.id
        );

    const preview =
        places.slice(0, 3);

    const coordinateWarning =
        t(
            'Location has no coordinates'
        );

    const body = preview.length
        ? `
          <div
            class="
              profile-resource-list
            ">

            ${preview
                .map(place =>
                {
                    const accessibleLabel = [
                        `Open ${place.title}`,

                        !place.hasCoordinates
                            ? coordinateWarning
                            : ''
                    ]
                        .filter(Boolean)
                        .join('. ');

                    return `
                  <button
                    class="
                      profile-resource-row
                      profile-place-preview-row
                    "
                    type="button"
                    data-profile-place="${escapeHtml(
                        place.id
                    )}"
                    aria-label="${escapeHtml(
                        accessibleLabel
                    )}">

                    <span
                      class="
                        profile-place-preview-title
                      ">

                      <strong>
                        ${escapeHtml(
                            place.title
                        )}
                      </strong>

                      ${
                            !place.hasCoordinates
                                ? `
                            <span
                              class="
                                profile-place-coordinate-warning
                              "
                              role="img"
                              aria-label="${escapeHtml(
                                    coordinateWarning
                                )}"
                              title="${escapeHtml(
                                    coordinateWarning
                                )}">
                              ${icon.warning}
                            </span>
                          `
                                : ''
                        }
                    </span>

                    <small
                      class="
                        profile-place-preview-meta
                      ">
                      ${escapeHtml(
                            place.meta
                        )}
                    </small>
                  </button>
                `;
                })
                .join('')}
          </div>
        `
        : renderProfileResourceEmpty(
            'No places linked'
        );

    return renderProfileResourceCard({
        type: 'places',
        iconSvg: icon.mapPin,
        title: 'Places',
        count: places.length,
        singular: 'place',
        plural: 'places',
        body
    });
}

function renderProfileFamilyHub(person)
{
    const count = relationshipCount(person.id);

    return `
        <section
          class="profile-side-card profile-family-hub"
          aria-label="Family relationships">

          <h3 class="profile-family-head">
            <span class="section-title profile-family-title">
              <span
                class="profile-family-title-icon"
                aria-hidden="true">
                ${icon.peoplegroup}
              </span>

              <span>Family</span>
            </span>

            <span
              class="profile-family-count"
              aria-label="${count} ${
                    count === 1
                        ? 'relationship'
                        : 'relationships'
                }">
              ${count}
            </span>
          </h3>

          <div class="profile-family-scroll">
            ${renderRelationships(person.id)}
          </div>
        </section>
      `;
}

function updateProfilePhotoCarousel(carousel)
{
    const track = carousel?.querySelector(
        '[data-profile-photo-track]'
    );

    const previous = carousel?.querySelector(
        '[data-profile-photo-prev]'
    );

    const next = carousel?.querySelector(
        '[data-profile-photo-next]'
    );

    if (!track || !previous || !next) return;

    previous.disabled = track.scrollLeft <= 2;

    next.disabled =
        track.scrollLeft + track.clientWidth
        >= track.scrollWidth - 2;
}

function bindProfilePhotoCarousels(root = main)
{
    root
        .querySelectorAll('[data-profile-photo-carousel]')
        .forEach(carousel =>
        {
            const track = carousel.querySelector(
                '[data-profile-photo-track]'
            );

            const previous = carousel.querySelector(
                '[data-profile-photo-prev]'
            );

            const next = carousel.querySelector(
                '[data-profile-photo-next]'
            );

            /*
          * Carousels with three or fewer photos do not render
          * navigation buttons.
          */
            if (!track || !previous || !next) return;

            const scrollTrack = direction =>
            {
                track.scrollBy({
                    left:
                Math.max(track.clientWidth * .82, 160)
                * direction,
                    behavior: 'smooth'
                });
            };

            previous.addEventListener('click', () =>
            {
                scrollTrack(-1);
            });

            next.addEventListener('click', () =>
            {
                scrollTrack(1);
            });

            track.addEventListener(
                'scroll',
                () => updateProfilePhotoCarousel(carousel),
                { passive: true }
            );

            requestAnimationFrame(() =>
            {
                updateProfilePhotoCarousel(carousel);
            });
        });
}

function activateProfileCardSection(
    card,
    sectionId,
    {
        focusTab = false
    } = {}
)
{
    if (!card) return;

    const activeSection =
        normalizeProfileCardSection(sectionId);

    state.peopleProfileEditTab =
        activeSection;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    const panels = [
        ...card.querySelectorAll(
            '[data-profile-card-panel]'
        )
    ];

    tabs.forEach(tab =>
    {
        const isActive =
            tab.dataset.profileCardTab
          === activeSection;

        tab.classList.toggle(
            'active',
            isActive
        );

        tab.setAttribute(
            'aria-selected',
            isActive ? 'true' : 'false'
        );

        tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(panel =>
    {
        const isActive =
            panel.dataset.profileCardPanel
          === activeSection;

        panel.classList.toggle(
            'active',
            isActive
        );

        panel.setAttribute(
            'aria-hidden',
            isActive ? 'false' : 'true'
        );

        if (isActive)
        {
            panel.removeAttribute('inert');
        }
        else
        {
            panel.setAttribute('inert', '');
        }
    });

    if (focusTab)
    {
        card.querySelector(
            `[data-profile-card-tab="${
                CSS.escape(activeSection)
            }"]`
        )?.focus();
    }
}

function bindProfileCardTabs(card)
{
    if (!card) return;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    tabs.forEach((tab, index) =>
    {
        tab.addEventListener('click', () =>
        {
            activateProfileCardSection(
                card,
                tab.dataset.profileCardTab
            );
        });

        tab.addEventListener(
            'keydown',
            event =>
            {
                const handledKeys = [
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ];

                if (
                    !handledKeys.includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                let nextIndex = index;

                if (event.key === 'ArrowLeft')
                {
                    nextIndex =
                        (index - 1 + tabs.length)
                % tabs.length;
                }

                if (event.key === 'ArrowRight')
                {
                    nextIndex =
                        (index + 1)
                % tabs.length;
                }

                if (event.key === 'Home')
                {
                    nextIndex = 0;
                }

                if (event.key === 'End')
                {
                    nextIndex = tabs.length - 1;
                }

                activateProfileCardSection(
                    card,
                    tabs[nextIndex]
                        .dataset.profileCardTab,
                    {
                        focusTab: true
                    }
                );
            }
        );
    });
}

function profileEditValidationFailure(
    section,
    message,
    focusSelector
)
{
    return {
        ok: false,
        section,
        message,
        focusSelector
    };
}

function collectProfileMainEdit()
{
    const living =
        main.querySelector(
            '#profileInlineLiving'
        )?.value || 'Unknown';

    const birthDate =
        collectGenealogyDateField(
            'profileInlineBirthField'
        );

    if (!birthDate)
    {
        return profileEditValidationFailure(
            'main',
            'Check the birth date before saving.',
            `
            [data-genealogy-date-field=
              "profileInlineBirthField"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    const deathDate =
        living === 'Deceased'
            ? collectGenealogyDateField(
                'profileInlineDeathField'
            )
            : emptyGenealogyDate(
                'Exact date'
            );

    if (!deathDate)
    {
        return profileEditValidationFailure(
            'main',
            'Check the death date before saving.',
            `
            [data-genealogy-date-field=
              "profileInlineDeathField"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    return {
        ok: true,
        section: 'main',
        payload: {
            first:
            (() =>
            {
                const input = main.querySelector('#profileInlineFirst');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            last:
            (() =>
            {
                const input = main.querySelector('#profileInlineLast');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            patronym:
            (() =>
            {
                const input = main.querySelector('#profileInlinePatronym');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            prefix:
            main.querySelector(
                '#profileInlinePrefix'
            )?.value.trim() || '',

            suffix:
            main.querySelector(
                '#profileInlineSuffix'
            )?.value.trim() || '',

            maidenName:
            (() =>
            {
                const input = main.querySelector('#profileInlineMaidenInput');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            gender:
            main.querySelector(
                '#profileInlineGender'
            )?.value || 'Unknown',

            living,

            birthDate,
            birthPlace:
            readPlaceInputValue(
                '#profileInlineBirthPlace',
                main
            ),

            deathDate,
            deathPlace:
            readPlaceInputValue(
                '#profileInlineDeathPlace',
                main
            ),

            deathReason:
            main.querySelector(
                '#profileInlineDeathReason'
            )?.value.trim() || '',

            burialPlace:
            readPlaceInputValue(
                '#profileInlineBurialPlace',
                main
            )
        }
    };
}

function collectProfileEducationEdit()
{
    const fromDate =
        collectGenealogyDateField(
            'profileEducationFromDate'
        );

    if (!fromDate)
    {
        return profileEditValidationFailure(
            'education',
            'Check the education start date before saving.',
            `
            [data-genealogy-date-field=
              "profileEducationFromDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    const toDate =
        collectGenealogyDateField(
            'profileEducationToDate'
        );

    if (!toDate)
    {
        return profileEditValidationFailure(
            'education',
            'Check the education end date before saving.',
            `
            [data-genealogy-date-field=
              "profileEducationToDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    return {
        ok: true,
        section: 'education',
        payload: {
            institutionName:
            collectLocalizedDataFieldValue(
                main.querySelector(
                    '#profileEducationInstitutionName'
                ),
                main.querySelector(
                    '#profileEducationInstitutionName'
                )?.dataset.sourceValue || ''
            ).trim(),

            institutionType:
            main.querySelector(
                '#profileEducationInstitutionType'
            )?.value || 'Unknown',

            value:
            collectLocalizedDataFieldValue(
                main.querySelector(
                    '#profileEducationValue'
                ),
                main.querySelector(
                    '#profileEducationValue'
                )?.dataset.sourceValue || ''
            ).trim(),

            place:
            readPlaceInputValue(
                '#profileEducationPlace',
                main
            ),

            notes:
            collectLocalizedDataFieldValue(
                main.querySelector(
                    '#profileEducationNotes'
                ),
                main.querySelector(
                    '#profileEducationNotes'
                )?.dataset.sourceValue || ''
            ).trim(),

            fromDate,
            toDate
        }
    };
}

function collectProfileWorkEdit()
{
    const fromDate =
        collectGenealogyDateField(
            'profileWorkFromDate'
        );

    if (!fromDate)
    {
        return profileEditValidationFailure(
            'work',
            'Check the work start date before saving.',
            `
            [data-genealogy-date-field=
              "profileWorkFromDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    const toDate =
        collectGenealogyDateField(
            'profileWorkToDate'
        );

    if (!toDate)
    {
        return profileEditValidationFailure(
            'work',
            'Check the work end date before saving.',
            `
            [data-genealogy-date-field=
              "profileWorkToDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    return {
        ok: true,
        section: 'work',
        payload: {
            company:
            main.querySelector(
                '#profileWorkCompany'
            )?.value.trim() || '',

            occupation:
            main.querySelector(
                '#profileWorkOccupation'
            )?.value.trim() || '',

            notes:
            main.querySelector(
                '#profileWorkNotes'
            )?.value.trim() || '',

            fromDate,
            toDate
        }
    };
}

function collectProfileOtherEdit()
{
    const baptismDate =
        collectGenealogyDateField(
            'profileBaptismDate'
        );

    if (!baptismDate)
    {
        return profileEditValidationFailure(
            'other',
            'Check the baptism date before saving.',
            `
            [data-genealogy-date-field=
              "profileBaptismDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    return {
        ok: true,
        section: 'other',
        payload: {
            religion:
            readReligionField(
                main,
                'profileReligion'
            ),

            baptismDate,

            baptismPlace:
            readPlaceInputValue(
                '#profileBaptismPlace',
                main
            )
        }
    };
}

function collectProfileEditSections()
{
    const results = [
        collectProfileMainEdit(),
        collectProfileEducationEdit(),
        collectProfileWorkEdit(),
        collectProfileOtherEdit()
    ];

    const invalid = results.find(
        result => !result.ok
    );

    if (invalid) return invalid;

    return {
        ok: true,
        payloads: Object.fromEntries(
            results.map(result => [
                result.section,
                result.payload
            ])
        )
    };
}

function applyProfileMainEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    ensurePersonCentralStructures(
        centralPerson
    );

    const first =
        payload.first
        || centralPerson.names.first
        || person.first
        || '';

    const last =
        payload.last
        || centralPerson.names.last
        || person.surname
        || '';

    // display name is derived below via rebuildPersonDisplayName


    const gender =
        String(payload.gender || '')
            .toLowerCase();

    const normalizedGender =
        gender === 'male'
        || gender === 'female'
            ? gender
            : 'unknown';

    const livingStatus =
        normalizeLivingStatus(
            payload.living
        );

    const birthPlace =
        resolvePlaceAssignment(
            payload.birthPlace,
            centralPerson.birth?.placeId
        );

    const deathPlace =
        resolvePlaceAssignment(
            payload.deathPlace,
            centralPerson.death?.placeId
        );

    const burialPlace =
        resolvePlaceAssignment(
            payload.burialPlace,
            centralPerson.death
                ?.burialPlaceId
        );

    centralPerson.names.first = first;
    centralPerson.names.middle = payload.patronym || '';
    centralPerson.names.last = last;
    centralPerson.names.prefix = normalizeNameSegment(payload.prefix);
    centralPerson.names.suffix = normalizeNameSegment(payload.suffix);
    centralPerson.names.maiden = payload.maidenName || '';
    rebuildPersonDisplayName(centralPerson);


    centralPerson.gender =
        normalizedGender;

    centralPerson.livingStatus =
        livingStatus;

    centralPerson.birth = {
        ...payload.birthDate,
        placeId: birthPlace.placeId,
        placeText: birthPlace.placeText,
        address: birthPlace.address
    };

    if (livingStatus === 'Deceased')
    {
        centralPerson.death = {
            ...payload.deathDate,
            placeId: deathPlace.placeId,
            placeText: deathPlace.placeText,
            address: deathPlace.address,
            reason: payload.deathReason,
            cause: payload.deathReason,
            burialPlaceId:
            burialPlace.placeId,
            burialPlaceText:
            burialPlace.placeText,
            burialAddress:
            burialPlace.address
        };
    }
    else
    {
        centralPerson.death = {
            ...emptyGenealogyDate(
                'Exact date'
            ),
            placeId: null,
            placeText: '',
            address: '',
            reason: '',
            cause: '',
            burialPlaceId: null,
            burialPlaceText: '',
            burialAddress: ''
        };
    }

    person.first = first;
    person.surname = last;
    person.name = centralPerson.names.display;
    person.gender = normalizedGender;
    person.living = livingStatus;
    person.birth =
        formatGenealogyDateLabel(
            payload.birthDate
        );
    person.birthPlace =
        birthPlace.placeText;

    if (livingStatus === 'Deceased')
    {
        person.death =
            formatGenealogyDateLabel(
                payload.deathDate
            );

        person.deathPlace =
            deathPlace.placeText;
    }
    else
    {
        person.death = '';
        person.deathPlace = '';
    }
}

function applyProfileEducationEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    const education =
        upsertPersonAttribute(
            centralPerson,
            'EDUC',
            {
                institutionName:
              payload.institutionName,

                institutionType:
              payload.institutionType,

                type:
              payload.institutionType
              === 'Unknown'
                  ? ''
                  : payload.institutionType,

                value:
              payload.value || 'Education',

                notes: payload.notes,

                fromDate:
              genealogyDateOrNull(
                  payload.fromDate,
                  'Year only'
              ),

                toDate:
              genealogyDateOrNull(
                  payload.toDate,
                  'Year only'
              )
            }
        );

    const resolvedPlace =
        resolvePlaceAssignment(
            payload.place,
            education.placeId
        );

    education.placeId =
        resolvedPlace.placeId;

    education.placeText =
        resolvedPlace.placeText;

    education.address =
        resolvedPlace.address;
}

function applyProfileWorkEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    upsertPersonAttribute(
        centralPerson,
        'OCCU',
        {
            company: payload.company,
            value: payload.occupation,
            notes: payload.notes,

            fromDate:
            genealogyDateOrNull(
                payload.fromDate,
                'Exact date'
            ),

            toDate:
            genealogyDateOrNull(
                payload.toDate,
                'Exact date'
            )
        }
    );
}

function applyProfileOtherEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    upsertPersonAttribute(
        centralPerson,
        'RELI',
        {
            value:
            normalizeReligionValue(
                payload.religion
            )
        }
    );

    const baptism =
        upsertPersonEvent(
            centralPerson,
            'BAPM',
            {
                date:
              genealogyDateOrNull(
                  payload.baptismDate,
                  'Exact date'
              )
            }
        );

    const resolvedPlace =
        resolvePlaceAssignment(
            payload.baptismPlace,
            baptism.placeId
        );

    baptism.placeId =
        resolvedPlace.placeId;

    baptism.placeText =
        resolvedPlace.placeText;

    baptism.address =
        resolvedPlace.address;
}

function applyProfileEditSections(
    person,
    payloads
)
{
    applyProfileMainEdit(
        person,
        payloads.main
    );

    applyProfileEducationEdit(
        person,
        payloads.education
    );

    applyProfileWorkEdit(
        person,
        payloads.work
    );

    applyProfileOtherEdit(
        person,
        payloads.other
    );

    person.updated =
        'Just now';

    const centralPerson =
        getPerson(person.id);

    markPersonUpdated(
        centralPerson
    );

    sampleData.events =
        rebuildSampleEventsAndPruneSourceLinks();
}

function showProfileEditValidationError(
    card,
    result
)
{
    activateProfileCardSection(
        card,
        result.section
    );

    showToast(result.message);

    requestAnimationFrame(() =>
    {
        card?.querySelector(
            result.focusSelector
        )?.focus();
    });
}

function cancelPeopleProfileEditing()
{
    state.peopleProfileEditing = false;
    renderPeople();
    showToast('Profile editing cancelled.');
}

function bindPeopleProfileControls(person)
{
    bindToasts(main);
    bindGenealogyDateFields(main);
    bindPlaceComboboxes(main);
    bindNameAffixComboboxes(main);

    bindRelationshipList(main, 'profile');
    bindProfilePhotoCarousels(main);
    bindPersonPhotoUnlinkButtons(main);
    bindConnectedNoteLinks(
        main
    );
    bindConnectedFileLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                renderAfterPersonConnectedResourcesChanged();
            }
        }
    );
    bindTimelineSourceControls(
        main,
        {
            afterSave:
            renderAfterPersonConnectedResourcesChanged
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType
                  === 'person'
                )
                {
                    renderAfterPersonConnectedResourcesChanged();
                }
            }
        }
    );
    const profileCard = main.querySelector(
        '[data-profile-card-root]'
    );
    bindProfileCardTabs(profileCard);
    main.querySelector('#backPeopleList')?.addEventListener('click', () =>
    {
        state.peopleView = 'directory'; state.peopleSide = 'people'; state.peopleProfileEditing = false; renderPeople();
    });
    main
        .querySelector('#profileEditButton')
        ?.addEventListener('click', () =>
        {
            if (state.peopleProfileEditing)
            {
                cancelPeopleProfileEditing();
                return;
            }

            state.peopleProfileEditing = true;
            renderPeople();
        });
    main
        .querySelector('#profileAddRelative')
        ?.addEventListener(
            'click',
            event =>
            {
                openRelativePopover(
                    event.currentTarget,
                    person.id
                );
            }
        );
    main
        .querySelector('#profileMoreActions')
        ?.addEventListener(
            'click',
            event =>
            {
                openPeopleActionsMenu(
                    person.id,
                    event.currentTarget,
                    {
                        includeProfile: false
                    }
                );
            }
        );
    main.querySelector('#profileInlineGender')?.addEventListener('change', event =>
    {
        const isFemale = event.target.value === 'Female';
        const row = main.querySelector('#profileInlineMaiden');
        const editGrid = main.querySelector('.profile-main-edit-grid');
        if (row) row.hidden = !isFemale;
        if (editGrid)
        {
            editGrid.classList.toggle('has-maiden', isFemale);
            editGrid.classList.toggle('no-maiden', !isFemale);
        }
    });
    const profileStatusButton = main.querySelector('#profileStatusButton');
    const profileStatusMenu = main.querySelector('#profileStatusMenu');
    profileStatusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const expanded = profileStatusButton.getAttribute('aria-expanded') === 'true';
        profileStatusButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (profileStatusMenu) profileStatusMenu.hidden = expanded;
    });
    main.querySelectorAll('[data-profile-status-value]').forEach(option => option.addEventListener('click', event =>
    {
        event.stopPropagation();
        const status = option.dataset.profileStatusValue;
        const input = main.querySelector('#profileInlineLiving');
        const label = main.querySelector('#profileStatusLabel');
        const dot = main.querySelector('#profileStatusButton .add-person-status-current .add-person-status-dot');
        if (input) input.value = status;
        if (label) label.textContent = status;
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        main.querySelectorAll('[data-profile-status-value]').forEach(item =>
        {
            const active = item.dataset.profileStatusValue === status;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            const check = item.querySelector('[data-profile-status-check]');
            if (check) check.innerHTML = active ? icon.check : '';
        });
        const isDeceased = status === 'Deceased';
        const deathModel = main.querySelector('[data-genealogy-date-field="profileInlineDeathField"] [data-genealogy-date-model]');
        if (deathModel)
        {
            const currentDeath = normalizeGenealogyDateInput(JSON.parse(deathModel.value || '{}'));
            if (isDeceased && !currentDeath.date && !currentDeath.dateLabel)
            {
                applyGenealogyDateToField('profileInlineDeathField', emptyGenealogyDate('Exact date'));
            }
            if (!isDeceased)
            {
                applyGenealogyDateToField('profileInlineDeathField', emptyGenealogyDate('Exact date'));
            }
        }
        const group = main.querySelector('#profileInlineDeathFields');
        const extraGroup = main.querySelector('#profileInlineDeathExtraFields');
        if (group) group.hidden = !isDeceased;
        if (extraGroup) extraGroup.hidden = !isDeceased;
        main.querySelectorAll('.profile-field-death-date, .profile-field-death-place, .profile-field-death-reason, .profile-field-burial-place').forEach(field =>
        {
            field.hidden = !isDeceased;
        });
        const editGrid = main.querySelector('.profile-main-edit-grid');
        if (editGrid) editGrid.classList.toggle('is-deceased', isDeceased);
        if (profileStatusMenu) profileStatusMenu.hidden = true;
        profileStatusButton?.setAttribute('aria-expanded', 'false');
    }));
    main
        .querySelector('#profileCancelEdit')
        ?.addEventListener(
            'click',
            cancelPeopleProfileEditing
        );

    main
        .querySelector('#profileSaveInlineEdit')
        ?.addEventListener('click', () =>
        {
            const result =
                collectProfileEditSections();

            if (!result.ok)
            {
                showProfileEditValidationError(
                    profileCard,
                    result
                );

                return;
            }

            applyProfileEditSections(
                person,
                result.payloads
            );

            state.peopleProfileEditing = false;

            renderPeople();

            showToast(
                'Profile changes saved.'
            );
        });
    main.querySelector('[data-profile-add-fact]')?.addEventListener('click', () => openAddFactOverlay(person));
    main.querySelectorAll('[data-profile-partner-id]').forEach(button =>
    {
        button.addEventListener('click', () => openProfileFamilyMember(button.dataset.profilePartnerId));
        button.addEventListener('keydown', event =>
        {
            if (event.key === 'Enter' || event.key === ' ')
            {
                event.preventDefault(); openProfileFamilyMember(button.dataset.profilePartnerId);
            }
        });
    });
    main.querySelectorAll('[data-profile-photo]').forEach(button => button.addEventListener('click', () => openProfilePhoto(button.dataset.profilePhoto)));
    main.querySelector('[data-profile-resource-action="add-photos"]') ?.addEventListener('click', () => openAddPhotosToPersonModal(person.id));
    main
        .querySelector(
            '[data-profile-resource-action="add-files"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openPersonFilesModal(
                    person.id
                );
            }
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-note"]'
        )
        ?.addEventListener(
            'click',
            () =>
                openPersonNotesModal(
                    person.id,
                    'profile'
                )
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-sources"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const centralPerson =
                    getPerson(
                        person.id
                    );

                if (!centralPerson)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'person',

                    targetId:
                centralPerson.id,

                    projectId:
                centralPerson.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    centralPerson.names?.display
                  || 'this person'
                }.`,

                    afterSave:
                renderAfterPersonConnectedResourcesChanged
                });
            }
        );
    main.querySelectorAll('[data-profile-place]').forEach(button => button.addEventListener('click', () => openProfilePlace(button.dataset.profilePlace)));
    const profileViewAllActions = {
        archive:
          () =>
              openProfileAllArchive(
                  person.id
              ),

        notes:
          () =>
              openProfileAllNotes(
                  person.id
              ),

        photos:
          () =>
              openProfileAllPhotos(
                  person.id
              ),

        places:
          () =>
              openProfileAllPlaces(
                  person.id
              )
    };

    main
        .querySelectorAll('[data-profile-view-all]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                profileViewAllActions[
                    button.dataset.profileViewAll
                ]?.();
            });
        });
}

function openProfileArchiveFile(fileId)
{
    if (!fileId)
    {
        showToast('Archive item preview is simulated.'); return;
    }
    openFamilyArchiveItem(fileId);
}

function openProfilePhoto(photoId)
{
    openAlbumsForPhoto(photoId);
}

function openProfilePlace(placeId)
{
    if (!placeId)
    {
        showToast('Place record not found.');
        return;
    }

    state.activeModule = 'Places';
    state.placesView = 'all';
    state.selectedPlaceId = placeId;
    render();
}

function openProfileAllArchive(
    personId =
        state.selectedPeopleId
)
{
    openArchiveForPerson(
        personId
    );
}

function openProfileAllNotes(
    personId =
        state.selectedPeopleId
)
{
    openNotesForContext(
        'person',
        personId
    );
}

function openProfileAllPhotos(personId = state.selectedPeopleId)
{
    openAlbumsForPerson(personId);
}

function openProfileAllPlaces(
    personId =
        state.selectedPeopleId
)
{
    const person =
        getPerson(personId);

    state.activeModule = 'Places';
    state.placesView = 'all';

    state.placesSavedFilterId =
        '';

    state.placesFilters = {
        ...defaultPlaceFilters,

        personId:
          person?.id || ''
    };

    state.selectedPlaceId = null;
    state.placesSearch = '';

    render();
}

function openProfileFamilyMember(
    personId
)
{
    if (!personId)
    {
        showToast(
            'Placeholder family member; add a linked person later.'
        );

        return;
    }

    if (!getPerson(personId))
    {
        showToast(
            'This family member is not linked to a People profile yet.'
        );

        return;
    }

    state.selectedPeopleId =
        personId;

    state.selectedPersonId =
        personId;

    state.peopleView =
        'profile';

    state.peopleSide =
        'profile';

    renderPeople();
}

function openAddFactOverlay(person)
{
    const personId = person?.id;

    const centralPerson =
        ensurePersonCentralStructures(
            getPerson(personId)
        );

    if (!centralPerson)
    {
        showToast(
            'Person record was not found.'
        );

        return;
    }

    const existingFact =
        personAttributeByTag(
            centralPerson,
            'FACT'
        );

    const isEditing =
        Boolean(existingFact);

    const personName =
        getPersonDisplayName(personId)
          || centralPerson.names?.display
          || 'this person';

    openModal(`
        <form
          class="modal"
          id="timelineCustomFactForm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="addFactTitle"
          novalidate>

          <div class="modal-header">
            <div>
              <h2 id="addFactTitle">
                ${
                    isEditing
                        ? 'Edit custom fact'
                        : 'Add custom fact'
                }
              </h2>

              <p>
                Record an attribute or characteristic
                for ${escapeHtml(personName)}.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close custom fact dialog">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="add-person-fact-grid">
              ${renderCustomFactFields(
                    'timelineCustomFact',
                    existingFact
                )}
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button primary"
              type="submit">
              ${
                    isEditing
                        ? 'Save changes'
                        : 'Add fact'
                }
            </button>
          </div>
        </form>`);

    bindGenealogyDateFields(
        modalBackdrop
    );

    bindPlaceComboboxes(
        modalBackdrop
    );

    modalBackdrop
        .querySelector(
            '#timelineCustomFactForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const result =
                    collectCustomFactFields(
                        'timelineCustomFact',
                        modalBackdrop
                    );

                if (result.invalid)
                {
                    showToast(
                        result.message
                  || 'Check the custom fact before saving.'
                    );

                    return;
                }

                applyPersonCustomFact(
                    centralPerson,
                    result.value
                );

                markPersonUpdated(
                    centralPerson
                );

                sampleData.events =
                    rebuildSampleEventsAndPruneSourceLinks();

                closeModal();

                if (
                    state.activeModule
              === 'Family Tree'
                )
                {
                    renderFamilyTreePreserveScroll?.()
                || renderFamilyTree();
                }
                else if (
                    state.activeModule
              === 'People'
                )
                {
                    renderPeople();
                }
                else
                {
                    render();
                }

                showToast(
                    isEditing
                        ? 'Custom fact updated.'
                        : 'Custom fact added.'
                );
            }
        );

    modalBackdrop
        .querySelector(
            '#timelineCustomFactType'
        )
        ?.focus({
            preventScroll: true
        });
}

function closePeopleColumnsPopover()
{
    document.getElementById('peopleColumnsPopover')?.remove();
    document.getElementById('peopleColumnsButton')?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closePeopleColumnsOnOutside);
    document.removeEventListener('keydown', closePeopleColumnsOnEscape);
}

function closePeopleColumnsOnOutside(event)
{
    if (!event.target.closest('#peopleColumnsPopover') && !event.target.closest('#peopleColumnsButton')) closePeopleColumnsPopover();
}

function closePeopleColumnsOnEscape(event)
{
    if (event.key === 'Escape') closePeopleColumnsPopover();
}

function positionPeopleColumnsPopover(popover, anchor)
{
    const rect = anchor.getBoundingClientRect();
    popover.style.maxHeight = '';
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const placeBelow = below >= height || below >= above;
    popover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    popover.style.top = `${placeBelow ? rect.bottom + 8 : Math.max(12, rect.top - height - 8)}px`;
    popover.style.maxHeight = `${Math.max(0, placeBelow ? below : above)}px`;
    anchor.setAttribute('aria-expanded', 'true');
}

function openPeopleColumnsPopover(anchor)
{
    if (document.getElementById('peopleColumnsPopover'))
    {
        closePeopleColumnsPopover();
        return;
    }
    closePeopleColumnsPopover();
    closePeopleFilterPopover();
    closeMenu();
    const columns = peopleColumnsWithDefaults();
    const optionalColumns = Object.entries(peopleColumnLabels).map(([key, label]) => `<label class="people-columns-option"><input type="checkbox" data-people-column="${key}" ${columns[key] ? 'checked' : ''}> <span>${escapeHtml(t(label))}</span></label>`).join('');
    const popover = document.createElement('div');
    popover.className = 'people-columns-popover';
    popover.id = 'peopleColumnsPopover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', t('Choose People table columns'));
    popover.innerHTML = `<div class="people-columns-header"><h3>${escapeHtml(t('Columns'))}</h3><p>${escapeHtml(t('Choose which fields are visible in the people table.'))}</p></div><div class="people-columns-list">${optionalColumns}</div><div class="people-columns-footer"><button class="button secondary" type="button" data-people-columns-reset>${escapeHtml(t('Reset columns'))}</button><button class="button primary" type="button" data-people-columns-close>${escapeHtml(t('Done'))}</button></div>`;
    document.body.appendChild(popover);
    positionPeopleColumnsPopover(popover, anchor);
    popover.querySelectorAll('[data-people-column]').forEach(input => input.addEventListener('change', () =>
    {
        state.peopleVisibleColumns = peopleColumnsWithDefaults();
        state.peopleVisibleColumns[input.dataset.peopleColumn] = input.checked;
        renderPeople();
        const newAnchor = document.getElementById('peopleColumnsButton');
        if (newAnchor) positionPeopleColumnsPopover(popover, newAnchor);
    }));
    popover.querySelector('[data-people-columns-reset]')?.addEventListener('click', () =>
    {
        state.peopleVisibleColumns = { ...defaultPeopleColumns };
        popover.querySelectorAll('[data-people-column]').forEach(input => { input.checked = true; });
        renderPeople();
        const newAnchor = document.getElementById('peopleColumnsButton');
        if (newAnchor) positionPeopleColumnsPopover(popover, newAnchor);
    });
    popover.querySelector('[data-people-columns-close]')?.addEventListener('click', closePeopleColumnsPopover);
    setTimeout(() =>
    {
        document.addEventListener('click', closePeopleColumnsOnOutside);
        document.addEventListener('keydown', closePeopleColumnsOnEscape);
    }, 0);
}

let peopleFilterReturnFocus =
    null;

function closePeopleFilterPopover({
    restoreFocus = false
} = {})
{
    document
        .getElementById(
            'peopleFilterPopover'
        )
        ?.remove();
    document.getElementById('peopleFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closePeopleFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closePeopleFilterOnEscape
    );

    if (
        restoreFocus
        && peopleFilterReturnFocus
            ?.isConnected
    )
    {
        peopleFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    peopleFilterReturnFocus =
        null;
}

function closePeopleFilterOnOutside(
    event
)
{
    const popover =
        document.getElementById(
            'peopleFilterPopover'
        );

    const trigger =
        document.getElementById(
            'peopleFilterButton'
        );

    const eventPath =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

    const insidePopover =
        eventPath.length
            ? eventPath.includes(
                popover
            )
            : popover?.contains(
                event.target
            );

    const insideTrigger =
        eventPath.length
            ? eventPath.includes(
                trigger
            )
            : trigger?.contains(
                event.target
            );

    if (
        insidePopover
        || insideTrigger
    )
    {
        return;
    }

    closePeopleFilterPopover();
}

function closePeopleFilterOnEscape(
    event
)
{
    if (
        event.key !== 'Escape'
    )
    {
        return;
    }

    event.preventDefault();

    closePeopleFilterPopover({
        restoreFocus:
          true
    });
}

function peopleFilterOptions(
    values,
    selected
)
{
    /*
      * Retained temporarily because other modules
      * may still use the old native-select helper.
      */
    return values.map(value => `
        <option
          value="${escapeHtml(value)}"
          ${
                value === selected
                    ? 'selected'
                    : ''
            }>
          ${escapeHtml(value || 'Any')}
        </option>
      `).join('');
}

function openPeopleFilterPopover(
    anchor
)
{
    if (document.getElementById('peopleFilterPopover'))
    {
        closePeopleFilterPopover();
        return;
    }
    closePeopleFilterPopover();
    closeAlbumsFilterPopover();
    closePeopleColumnsPopover();
    closeMenu();

    peopleFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const filters =
        peopleFiltersWithDefaults();

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'shared-filter-panel people-filter-popover';

    popover.id =
        'peopleFilterPopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        translateText(
            'Filter people'
        )
    );

    popover.innerHTML = `
        <div
          class="
            shared-filter-panel-header
          ">

          <div>
            <h3>Filter people</h3>
            <p>
              Choose one or more values.
            </p>
          </div>

          <button
            class="
              shared-filter-panel-close
            "
            type="button"
            aria-label="Close"
            data-people-filter-close>

            ${icon.close}
          </button>
        </div>

        <div
          class="
            shared-filter-panel-body
          ">

          ${renderPeopleFilterFields(
                filters,
                'people-popover-filter'
            )}
        </div>

        <div
          class="
            shared-filter-panel-footer
          ">

          <button
            class="link"
            type="button"
            data-people-filter-reset>
            Clear filters
          </button>

          <div
            class="
              shared-filter-panel-actions
            ">

            <button
              class="button secondary"
              type="button"
              data-people-filter-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-people-filter-apply>

              <span
                aria-live="polite"
                data-people-filter-result>
                ${escapeHtml(
                    peopleFilterApplyLabel(
                        filters
                    )
                )}
              </span>
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        popover
    );

    localizeUI(popover);
    const resultLabel =
        popover.querySelector(
            '[data-people-filter-result]'
        );

    const applyButton =
        popover.querySelector(
            '[data-people-filter-apply]'
        );

    let controller = null;

    const updatePeopleFilterPreview =
        nextFilters =>
        {
            if (resultLabel)
            {
                resultLabel.textContent =
                    peopleFilterApplyLabel(
                        nextFilters
                    );
            }

            if (applyButton)
            {
                applyButton.disabled =
                    Boolean(
                        (
                            controller
                                ?.getErrors()
                  || []
                        ).length
                    );
            }
        };

    controller =
        bindPeopleFilterFields(
            popover,
            filters,
            'people-popover-filter',
            updatePeopleFilterPreview
        );

    updatePeopleFilterPreview(
        controller?.getValues()
        || filters
    );

    popover
        .querySelector(
            '[data-people-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                controller?.reset();
            }
        );

    popover
        .querySelector(
            '[data-people-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closePeopleFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-people-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closePeopleFilterPopover({
                    restoreFocus:
                true
                });
            }
        );
    popover
        .querySelector(
            '[data-people-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const errors =
                    controller?.getErrors()
              || [];

                if (errors.length)
                {
                    controller
                        ?.focusFirstInvalid();

                    return;
                }

                clearPeopleSelection();

                state.peopleFilters =
                    controller?.getValues()
              || peopleFiltersWithDefaults();

                state.peopleSavedViewId =
                    '';

                state.peopleSavedView =
                    hasActivePeopleFilters()
                        ? 'Custom filters'
                        : 'All people';

                closePeopleFilterPopover();

                renderPeople();
            }
        );

    positionSharedFilterPanel(
        popover,
        anchor
    );

    requestAnimationFrame(
        () =>
        {
            popover
                .querySelector(
                    '[data-people-filter-close]'
                )
                ?.focus({
                    preventScroll:
                true
                });
        }
    );

    setTimeout(
        () =>
        {
            document.addEventListener(
                'click',
                closePeopleFilterOnOutside
            );

            document.addEventListener(
                'keydown',
                closePeopleFilterOnEscape
            );
        },
        0
    );
}

function clearPeopleFilters()
{
    clearPeopleSelection();

    state.peopleFilters =
        peopleFiltersWithDefaults(
            defaultPeopleFilters
        );

    state.peopleSavedViewId =
        '';

    state.peopleSavedView =
        'All people';

    renderPeople();

    showToast(
        'People filters cleared.'
    );
}

function removePeopleFilter(
    key
)
{
    const definition =
        sharedFilterDefinitionByKey(
            peopleFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    clearPeopleSelection();

    state.peopleFilters =
        peopleFiltersWithDefaults();

    state.peopleFilters[key] =
        cloneSharedFilterValues(
            [definition],
            {}
        )[key];

    state.peopleSavedViewId =
        '';

    state.peopleSavedView =
        hasActivePeopleFilters()
            ? 'Custom filters'
            : 'All people';

    renderPeople();
}

function generatePeopleSavedViewName(
    filters = state.peopleFilters
)
{
    const entries = activePeopleFilterEntries(filters);

    if (!entries.length)
    {
        return 'Custom people filter';
    }

    return entries
        .slice(0, 2)
        .map(([, , value]) => value)
        .join(' - ');
}

function setPeopleSavedViewModalError(message = '', focusSelector = '')
{
    const error = modalBackdrop.querySelector(
        '[data-people-saved-view-error]'
    );

    if (error)
    {
        error.textContent = message;
        error.hidden = !message;
    }

    if (message && focusSelector)
    {
        modalBackdrop.querySelector(focusSelector)?.focus();
    }
}

function openPeopleSavedViewModal({
    mode = 'create',
    viewId = '',
    initialName = '',
    initialDescription = '',
    initialFilters = defaultPeopleFilters
} = {})
{
    const isEdit = mode === 'edit';

    const existingView = isEdit
        ? peopleSavedViews.find(view => view.id === viewId)
        : null;

    if (isEdit && !existingView)
    {
        showToast('Saved filter not found.');
        return;
    }

    const name = existingView?.name || initialName;
    const description = existingView?.description || initialDescription;

    const filters = peopleFiltersWithDefaults(
        existingView?.filters || initialFilters
    );

    const title = isEdit ? 'Edit filter' : 'Create filter';
    const subtitle = isEdit
        ? 'Update the name, description, or filter conditions.'
        : 'Create a reusable filter for the People directory.';

    const submitLabel = isEdit ? 'Save changes' : 'Create filter';

    openModal(`
        <div
          class="modal people-saved-view-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="peopleSavedViewModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="peopleSavedViewModalTitle">${escapeHtml(title)}</h2>
              <p>${escapeHtml(subtitle)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="peopleSavedViewForm">
            <div class="modal-body people-saved-view-body">
              <div class="people-saved-view-identity">
                <div class="field">
                  <label for="peopleSavedViewName">Name</label>
                  <input
                    id="peopleSavedViewName"
                    required
                    maxlength="80"
                    value="${escapeHtml(name)}"
                    placeholder="e.g. Meowbridge relatives">
                </div>

                <div class="field">
                  <label for="peopleSavedViewDescription">Description</label>
                  <textarea
                    id="peopleSavedViewDescription"
                    placeholder="Optional description">${escapeHtml(description)}</textarea>
                </div>
              </div>

              <section
                class="people-saved-view-filters"
                aria-labelledby="peopleSavedViewFiltersTitle">

                <div class="people-saved-view-section-header">
                  <div>
                    <h3 id="peopleSavedViewFiltersTitle">Filters</h3>
                    <p>Choose at least one condition for this saved filter.</p>
                  </div>

                  <button
                    class="link people-saved-view-clear"
                    type="button"
                    data-people-saved-view-clear>
                    Clear filters
                  </button>
                </div>

                ${renderPeopleFilterFields(
                    filters,
                    'people-saved-view-filter'
                )}

                <p
                  class="people-saved-view-error"
                  data-people-saved-view-error
                  role="alert"
                  hidden>
                </p>
              </section>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                ${escapeHtml(submitLabel)}
              </button>
            </div>
          </form>
        </div>
      `);

    const form = modalBackdrop.querySelector('#peopleSavedViewForm');
    const nameInput = modalBackdrop.querySelector('#peopleSavedViewName');

    const savedViewFilterController =
        bindPeopleFilterFields(
            form,
            filters,
            'people-saved-view-filter',
            () =>
            {
                setPeopleSavedViewModalError();
            }
        );

    nameInput?.focus();

    modalBackdrop
        .querySelector('[data-people-saved-view-clear]')
        ?.addEventListener('click', () =>
        {
            resetPeopleFilterFields(form);
            setPeopleSavedViewModalError();
        });

    form?.addEventListener('input', () =>
    {
        setPeopleSavedViewModalError();
    });

    form?.addEventListener('change', () =>
    {
        setPeopleSavedViewModalError();
    });
    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const submittedName =
                nameInput?.value.trim()
            || '';

            const submittedDescription =
                modalBackdrop
                    .querySelector(
                        '#peopleSavedViewDescription'
                    )
                    ?.value
                    .trim()
            || '';

            const submittedFilters =
                readPeopleFilterFields(
                    form
                );

            if (!submittedName)
            {
                setPeopleSavedViewModalError(
                    'Enter a filter name.',
                    '#peopleSavedViewName'
                );

                return;
            }

            const filterErrors =
                savedViewFilterController
                    ?.getErrors()
            || [];

            if (filterErrors.length)
            {
                setPeopleSavedViewModalError(
                    filterErrors[0],
                    '[aria-invalid="true"]'
                );

                savedViewFilterController
                    ?.focusFirstInvalid();

                return;
            }

            const normalizedFilters =
                peopleFiltersWithDefaults(
                    submittedFilters
                );

            if (
                !hasActivePeopleFilters(
                    normalizedFilters
                )
            )
            {
                setPeopleSavedViewModalError(
                    'Choose at least one filter option.',
                    [
                        '[data-shared-filter-input]',
                        '[data-shared-filter-year-mode]',
                        '[data-shared-filter-select]'
                    ].join(', ')
                );

                return;
            }

            const duplicate =
                peopleSavedViews.find(view =>
                    view.id !== viewId
              && view.name
                  .trim()
                  .toLowerCase()
                === submittedName
                    .toLowerCase()
                );

            if (duplicate)
            {
                setPeopleSavedViewModalError(
                    'A saved filter with this name already exists.',
                    '#peopleSavedViewName'
                );

                return;
            }

            if (isEdit)
            {
                const wasActive =
                    state.peopleSavedViewId
              === existingView.id;

                existingView.name =
                    submittedName;

                existingView.description =
                    submittedDescription;

                existingView.filters =
                    peopleFiltersWithDefaults(
                        normalizedFilters
                    );

                if (wasActive)
                {
                    clearPeopleSelection();

                    state.peopleSavedView =
                        submittedName;

                    state.peopleFilters =
                        peopleFiltersWithDefaults(
                            normalizedFilters
                        );
                }

                closeModal();
                renderPeople();
                showToast(
                    'Filter updated.'
                );

                return;
            }

            const id =
                `people-view-${Date.now()}`;

            const savedFilters =
                peopleFiltersWithDefaults(
                    normalizedFilters
                );

            peopleSavedViews.push({
                id,
                name:
              submittedName,

                description:
              submittedDescription,

                filters:
              savedFilters
            });

            clearPeopleSelection();

            state.peopleSavedViewId =
                id;

            state.peopleSavedView =
                submittedName;

            state.peopleFilters =
                peopleFiltersWithDefaults(
                    savedFilters
                );

            state.peopleView =
                'directory';

            closeModal();
            renderPeople();
            showToast(
                'Filter created.'
            );
        }
    );
}

function openCreatePeopleFilterModal()
{
    openPeopleSavedViewModal({
        mode:
          'create',

        initialName:
          '',

        initialDescription:
          '',

        initialFilters:
          peopleFiltersWithDefaults(
              defaultPeopleFilters
          )
    });
}

function openSavePeopleViewModal()
{
    if (!hasActivePeopleFilters())
    {
        showToast('Add filters before saving a filter.');
        return;
    }

    openPeopleSavedViewModal({
        mode: 'create',
        initialName: generatePeopleSavedViewName(),
        initialDescription: '',
        initialFilters: peopleFiltersWithDefaults()
    });
}

function openEditPeopleFilterModal(viewId)
{
    openPeopleSavedViewModal({
        mode: 'edit',
        viewId
    });
}

function openPeopleSavedViewMenu(viewId, anchor)
{
    closeMenu();
    closePeopleFilterPopover();
    closePeopleColumnsPopover();

    const view = peopleSavedViews.find(item => item.id === viewId);
    if (!view || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');

    menu.className = 'menu-popover';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Actions for ${view.name}`);

    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(12, rect.right - 190)}px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitem"
          data-people-saved-view-action="edit">
          Edit filter
        </button>

        <button
          class="danger"
          type="button"
          role="menuitem"
          data-people-saved-view-action="delete">
          Delete filter
        </button>
      `;

    document.body.appendChild(menu);

    menu.addEventListener('click', event =>
    {
        const actionButton = event.target.closest(
            '[data-people-saved-view-action]'
        );

        if (!actionButton) return;

        const action = actionButton.dataset.peopleSavedViewAction;

        closeMenu();

        if (action === 'edit')
        {
            openEditPeopleFilterModal(viewId);
        }

        if (action === 'delete')
        {
            openDeletePeopleFilterConfirm(viewId);
        }
    });

    menu.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        closeMenu();
        anchor.focus();
    });

    setTimeout(() =>
    {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function openDeletePeopleFilterConfirm(viewId)
{
    const view = peopleSavedViews.find(item => item.id === viewId);
    if (!view)
    {
        showToast('Saved filter not found.');
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletePeopleFilterTitle">

          <div class="modal-header">
            <div>
              <h2 id="deletePeopleFilterTitle">Delete filter?</h2>
              <p>This action cannot be undone.</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="people-filter-delete-copy">
              <strong>${escapeHtml(view.name)}</strong>
              will be removed from Saved filters.
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              id="confirmDeletePeopleFilter">
              Delete filter
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector('#confirmDeletePeopleFilter')
        ?.addEventListener('click', () =>
        {
            deletePeopleSavedView(viewId);
        });
}

function deletePeopleSavedView(viewId)
{
    const index = peopleSavedViews.findIndex(view => view.id === viewId);
    if (index < 0)
    {
        closeModal();
        showToast('Saved filter not found.');
        return;
    }

    const wasActive = state.peopleSavedViewId === viewId;

    peopleSavedViews.splice(index, 1);

    if (wasActive)
    {
        clearPeopleSelection();
        state.peopleSavedViewId = '';
        state.peopleSavedView = 'All people';
        state.peopleFilters =
            peopleFiltersWithDefaults(
                defaultPeopleFilters
            );
        state.peopleView = 'directory';
    }

    closeModal();
    renderPeople();
    showToast('Filter deleted.');
}

function applyPeopleSavedView(
    viewId
)
{
    const view =
        peopleSavedViews.find(
            item =>
                item.id === viewId
        );

    if (!view)
    {
        return;
    }

    clearPeopleSelection();

    state.peopleSavedViewId =
        view.id;

    state.peopleSavedView =
        view.name;

    state.peopleFilters =
        peopleFiltersWithDefaults(
            view.filters
        );

    state.peopleView =
        'directory';

    renderPeople();
}

function openPeopleActionsMenu(
    personId,
    anchor,
    {
        includeProfile = true
    } = {}
)
{
    closeMenu();
    closePeopleFilterPopover();
    closePeopleColumnsPopover();

    const person = getPerson(personId);

    if (!person || !anchor) return;

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover people-row-menu';

    menu.id = 'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        `Actions for ${
            person.names?.display || 'person'
        }`
    );

    menu.style.visibility = 'hidden';
    menu.style.top =
        `${rect.bottom + 6}px`;
    menu.style.left = '0px';

    menu.innerHTML = `
        ${includeProfile
            ? `
            <button
              type="button"
              role="menuitem"
              data-people-action="profile">
              Open profile
            </button>
          `
            : ''}

        <button
          type="button"
          role="menuitem"
          data-people-action="tree">
          Show in Family Tree
        </button>

        <button
          type="button"
          role="menuitem"
          class="danger"
          data-people-action="delete">
          Delete person
        </button>
      `;

    document.body.appendChild(menu);

    const viewportPadding = 12;

    const menuWidth =
        menu.getBoundingClientRect().width;

    menu.style.left = `${
        Math.max(
            viewportPadding,
            Math.min(
                rect.right - menuWidth,
                window.innerWidth
              - menuWidth
              - viewportPadding
            )
        )
    }px`;

    menu.style.visibility = 'visible';

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest('[data-people-action]')
                    ?.dataset.peopleAction;

            if (!action) return;

            closeMenu();

            if (action === 'profile')
            {
                openPeopleProfileFromRow(
                    person.id
                );
            }

            if (action === 'edit')
            {
                openEditPersonModal(
                    person.id
                );
            }

            if (action === 'tree')
            {
                showPersonInFamilyTree(
                    person.id
                );
            }

            if (action === 'delete')
            {
                openDeletePeopleConfirm([
                    person.id
                ]);
            }
        }
    );

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closeMenu
        );

        document.addEventListener(
            'scroll',
            closeMenu,
            true
        );
    }, 0);
}

function openPeopleProfileFromRow(personId)
{
    const person = currentPeopleRecords().find(item => item.id === personId);
    if (!person)
    {
        showToast('Person record not found.');
        return;
    }
    state.selectedPeopleId = personId;
    state.selectedPersonId = personId;
    state.peopleView = 'profile';
    state.peopleSide = 'profile';
    state.peoplePreviewCollapsed = false;
    navigateToProjectModule(currentProjectId(), 'People');
}

function showPersonInFamilyTree(personId)
{
    if (!getPerson(personId))
    {
        showToast('This person is not currently shown in the sample Family Tree.'); return;
    }
    state.activeModule = 'Family Tree';
    state.selectedPersonId = personId;
    rememberTreeSelectedPerson(personId);
    state.treeCenterTargetId = personId;
    state.treeInspectorCollapsed = false;
    render();
}

function resetPersonSidebarSections()
{
    ['insights', 'timeline', 'relationships', 'photos', 'archive', 'notes', 'record'].forEach(key =>
    {
        state.inspectorSections[key] = false;
    });
}

function personSidebarSelectedId(context)
{
    return context === 'people' ? state.selectedPeopleId : state.selectedPersonId;
}

function syncPersonSidebarSelection(personId, context)
{
    if (!personId) return;
    state.selectedPersonId = personId;
    if (context === 'tree') rememberTreeSelectedPerson(personId);
    if (context === 'people') state.selectedPeopleId = personId;
}

const personSidebarScrollByContext = {
    tree: 0,
    people: 0
};

function getPersonSidebarElement(
    context
)
{
    return main.querySelector(
        `[data-person-sidebar-context="${
            CSS.escape(context)
        }"]`
    );
}

function syncPersonSidebarLayoutState(
    context
)
{
    if (context === 'people')
    {
        main
            .querySelector('.people-layout')
            ?.classList.toggle(
                'preview-collapsed',
                Boolean(
                    state.peoplePreviewCollapsed
                )
            );

        return;
    }

    main
        .querySelector('.tree-workspace')
        ?.classList.toggle(
            'inspector-collapsed',
            Boolean(
                state.treeInspectorCollapsed
            )
        );
}

function personSidebarCanProvideScroll(
    panel
)
{
    return Boolean(
        panel
        && !panel.classList.contains(
            'collapsed'
        )
        && panel.getClientRects().length
    );
}

function createPersonSidebarElement(
    context
)
{
    const template =
        document.createElement(
            'template'
        );

    template.innerHTML =
        renderPersonSidebar(
            personSidebarSelectedId(
                context
            ),
            context
        ).trim();

    return (
        template.content.firstElementChild
        || null
    );
}

function rerenderPersonSidebarContext(
    context,
    {
        focusSectionId = '',
        scrollSectionId = '',
        preserveScroll = true
    } = {}
)
{
    const currentPanel =
        getPersonSidebarElement(
            context
        );

    /*
      * Safe fallback for an incomplete or
      * unexpected module render.
      */
    if (!currentPanel)
    {
        if (context === 'people')
        {
            renderPeople();
        }
        else
        {
            renderFamilyTreePreserveScroll();
        }

        return;
    }

    /*
      * Accordion changes preserve the current
      * inspector position. Selecting another
      * person intentionally starts the new
      * inspector at the top.
      */
    if (
        preserveScroll
        && personSidebarCanProvideScroll(
            currentPanel
        )
    )
    {
        personSidebarScrollByContext[
            context
        ] = currentPanel.scrollTop;
    }
    else if (!preserveScroll)
    {
        personSidebarScrollByContext[
            context
        ] = 0;
    }

    const nextPanel =
        createPersonSidebarElement(
            context
        );

    if (!nextPanel) return;

    syncPersonSidebarLayoutState(
        context
    );

    currentPanel.replaceWith(
        nextPanel
    );

    bindPersonSidebar(
        nextPanel,
        context
    );

    requestAnimationFrame(() =>
    {
        if (
            !nextPanel.classList.contains(
                'collapsed'
            )
          && nextPanel.getClientRects()
              .length
        )
        {
            const maximumScroll =
                Math.max(
                    0,
                    nextPanel.scrollHeight
              - nextPanel.clientHeight
                );

            const requestedScroll =
                preserveScroll
                    ? (
                        personSidebarScrollByContext[
                            context
                        ] || 0
                    )
                    : 0;

            nextPanel.scrollTop =
                Math.min(
                    requestedScroll,
                    maximumScroll
                );
        }

        if (scrollSectionId)
        {
            const sectionBody =
                nextPanel.querySelector(
                    `#section-${
                        CSS.escape(
                            scrollSectionId
                        )
                    }`
                );

            const section =
                sectionBody?.closest(
                    '.panel-section'
                );

            if (section)
            {
                const panelRect =
                    nextPanel
                        .getBoundingClientRect();

                const sectionRect =
                    section
                        .getBoundingClientRect();

                const targetTop =
                    nextPanel.scrollTop
              + sectionRect.top
              - panelRect.top
              - 12;

                nextPanel.scrollTo({
                    top:
                Math.max(
                    0,
                    targetTop
                ),

                    behavior:
                'smooth'
                });
            }
        }

        if (focusSectionId)
        {
            nextPanel
                .querySelector(
                    `[data-toggle-section="${
                        CSS.escape(
                            focusSectionId
                        )
                    }"]`
                )
                ?.focus({
                    preventScroll: true
                });
        }
    });
}

function relationshipContextFromRow(
    row,
    sidebarContext
)
{
    return {
        sidebarContext,
        kind:
          row?.dataset.relationshipKind || '',
        personId:
          row?.dataset.relationshipPersonId || '',
        relatedPersonId:
          row?.dataset.relationshipRelatedPersonId
          || '',
        familyId:
          row?.dataset.relationshipFamilyId || ''
    };
}

function selectRelationshipPerson(
    personId,
    context = 'tree'
)
{
    if (!personId || !getPerson(personId))
    {
        showToast('Person record not found.');
        return;
    }

    if (context === 'profile')
    {
        openProfileFamilyMember(personId);
        return;
    }

    if (context === 'tree')
    {
        navigateFamilyTreeToPerson(
            personId,
            {
                focusBranch: false,
                center: true
            }
        );
        return;
    }

    syncPersonSidebarSelection(
        personId,
        context
    );

    if (context === 'people')
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
    }
}

function bindRelationshipList(
    root,
    context = 'tree'
)
{
    root
        .querySelectorAll(
            '[data-select-relationship-person]'
        )
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                selectRelationshipPerson(
                    button.dataset.selectRelationshipPerson,
                    context
                );
            });
        });

    root
        .querySelectorAll('[data-edit-relationship]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.stopPropagation();

                const row = button.closest(
                    '[data-relationship-row]'
                );

                openRelationshipEditModal(
                    relationshipContextFromRow(
                        row,
                        context
                    )
                );
            });
        });

    root
        .querySelectorAll('[data-unlink-relationship]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.stopPropagation();

                const row = button.closest(
                    '[data-relationship-row]'
                );

                const relationshipContext =
                    relationshipContextFromRow(
                        row,
                        context
                    );

                if (relationshipContext.personId)
                {
                    syncPersonSidebarSelection(
                        relationshipContext.personId,
                        context
                    );
                }

                openUnlinkRelationshipModal(
                    relationshipContext
                );
            });
        });
}

function bindPersonSidebar(root, context = 'tree')
{
    const selectedId = personSidebarSelectedId(context);
    const selected = personSidebarTreePerson(selectedId);
    root
        .querySelectorAll(
            '[data-person-chip-section]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionId =
                        button.dataset
                            .personChipSection;

                    if (!sectionId)
                    {
                        return;
                    }

                    state.inspectorSections[
                        sectionId
                    ] = true;

                    rerenderPersonSidebarContext(
                        context,
                        {
                            focusSectionId:
                    sectionId,

                            scrollSectionId:
                    sectionId
                        }
                    );
                }
            );
        });
    root.querySelector('#quickEdit')?.addEventListener('click', () =>
    {
        if (!selected?.id) return;
        syncPersonSidebarSelection(selected.id, context);
        openEditPersonModal(selected.id);
    });
    root.querySelector('#familyMoreActions')?.addEventListener('click', event =>
    {
        if (!selected) return;
        event.stopPropagation();
        syncPersonSidebarSelection(selected.id, context);
        openPeopleActionsMenu(selected.id, event.currentTarget, { includeProfile: true });
    });
    root
        .querySelector('#addRelative')
        ?.addEventListener(
            'click',
            event =>
            {
                if (!selected?.id) return;

                syncPersonSidebarSelection(
                    selected.id,
                    context
                );

                openRelativePopover(
                    event.currentTarget,
                    selected.id
                );
            }
        );
    root.querySelector('#connectRelative')?.addEventListener('click', () =>
    {
        if (!selected?.id) return;
        syncPersonSidebarSelection(selected.id, context);
        openConnectRelativeModal(selected.id, { relationshipType: 'parent' });
    });
    root
        .querySelector(
            '[data-person-add-fact]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                if (!selected?.id) return;

                syncPersonSidebarSelection(
                    selected.id,
                    context
                );

                openAddFactOverlay(
                    getPerson(selected.id)
                );
            }
        );
    root
        .querySelectorAll(
            '[data-family-photo]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openFamilyPhoto(
                        button.dataset.familyPhoto
                    )
            );
        });
    bindTimelineSourceControls(
        root,
        {
            afterSave:
            () =>
                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'timeline'
                    }
                )
        }
    );
    bindPersonPhotoUnlinkButtons(
        root
    );
    root
        .querySelectorAll(
            '[data-person-add-photos]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const personId =
                        button.dataset
                            .personAddPhotos;

                    if (!personId)
                    {
                        return;
                    }

                    openAddPhotosToPersonModal(
                        personId
                    );
                }
            );
        });
    root
        .querySelectorAll(
            '[data-person-add-files]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const personId =
                        button.dataset
                            .personAddFiles;

                    if (!personId)
                    {
                        return;
                    }

                    openPersonFilesModal(
                        personId
                    );
                }
            );
        });
    const addNoteButton =
        root.querySelector(
            '[data-person-add-note]'
        );

    addNoteButton
        ?.addEventListener(
            'click',
            () =>
            {
                openPersonNotesModal(
                    addNoteButton.dataset
                        .personAddNote,

                    context
                );
            }
        );
    bindConnectedFileLinks(
        root,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .archive = true;

                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'archive'
                    }
                );
            }
        }
    );
    bindConnectedNoteLinks(
        root,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .notes = true;

                /*
                Use the actual sidebar context:
                - "tree" for Family Tree
                - "people" for People
              */
                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'notes'
                    }
                );
            }
        }
    );
    bindConnectedSourceLinks(
        root,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType
                  !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .sources = true;

                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'sources'
                    }
                );
            }
        }
    );

    root
        .querySelector(
            '[data-person-manage-sources]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const personId =
                    event.currentTarget
                        .dataset
                        .personManageSources;

                const centralPerson =
                    getPerson(
                        personId
                    );

                if (!centralPerson)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'person',

                    targetId:
                centralPerson.id,

                    projectId:
                centralPerson.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    centralPerson.names?.display
                  || 'this person'
                }.`,

                    afterSave:
                () =>
                {
                    state.inspectorSections
                        .sources = true;

                    rerenderPersonSidebarContext(
                        context,
                        {
                            preserveScroll:
                        true,

                            focusSectionId:
                        'sources'
                        }
                    );
                }
                });
            }
        );
    root
        .querySelectorAll(
            '[data-person-resource-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const resource =
                        button.dataset
                            .personResourceView;

                    const personId =
                        button.dataset
                            .personResourcePerson;

                    if (!personId) return;

                    if (
                        resource === 'photos'
                    )
                    {
                        openAlbumsForPerson(
                            personId
                        );

                        return;
                    }

                    if (
                        resource === 'archive'
                    )
                    {
                        openArchiveForPerson(
                            personId
                        );

                        return;
                    }

                    if (
                        resource === 'notes'
                    )
                    {
                        openNotesForPerson(
                            personId
                        );
                    }
                }
            );
        });
    root.querySelector('#collapseInspector')?.addEventListener('click', () =>
    {
        if (context === 'people') state.peoplePreviewCollapsed = true;
        else state.treeInspectorCollapsed = true;
        rerenderPersonSidebarContext(context);
    });
    root.querySelector('#restoreInspector')?.addEventListener('click', () =>
    {
        if (context === 'people') state.peoplePreviewCollapsed = false;
        else state.treeInspectorCollapsed = false;
        rerenderPersonSidebarContext(context);
    });
    root.querySelector('[data-tree-view-profile]')?.addEventListener('click', event =>
    {
        const personId = event.currentTarget.dataset.treeViewProfile;
        if (personId) openPeopleProfileFromRow(personId);
    });
    root
        .querySelectorAll(
            '[data-toggle-section]'
        )
        .forEach(button =>
            button.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            '.link'
                        )
                    )
                    {
                        return;
                    }

                    const id =
                        button.dataset
                            .toggleSection;

                    if (!id) return;

                    state.inspectorSections[
                        id
                    ] = !sectionIsOpen(id);

                    rerenderPersonSidebarContext(
                        context,
                        {
                            focusSectionId: id
                        }
                    );
                }
            )
        );
    bindRelationshipList(root, context);
    bindToasts(root);
}

function openDeletePeopleConfirm(personIds)
{
    const requestedIds = [...new Set(Array.isArray(personIds) ? personIds.filter(Boolean) : [])];
    const validPeople = requestedIds
        .map(personId => getPerson(personId))
        .filter(Boolean);

    if (!validPeople.length) return;

    const validIds = validPeople.map(person => person.id);
    const count = validPeople.length;
    const visibleNames = validPeople.slice(0, 5)
        .map(person => `<li>${escapeHtml(person.names?.display || 'Unnamed person')}</li>`)
        .join('');
    const remaining = count - 5;
    const noun = count === 1 ? 'person' : 'people';

    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deletePeopleTitle"><div class="modal-header"><div><h2 id="deletePeopleTitle">Delete ${count === 1 ? 'person' : `${count} people`}?</h2><p>${count} ${noun} selected</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body"><div class="people-delete-confirm-copy"><p>Deleting ${count === 1 ? 'this person' : 'these people'} will also remove their relationship references.</p><ul>${visibleNames}</ul>${remaining > 0 ? `<p class="people-delete-remaining">And ${remaining} more ${remaining === 1 ? 'person' : 'people'}.</p>` : ''}<p>Linked photos, archive files, notes, and other research material will remain in the project.</p></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-delete-people>Delete ${noun}</button></div></div>`);

    modalBackdrop.querySelector('[data-confirm-delete-people]')
        ?.addEventListener('click', () => deletePeopleRecords(validIds));
}

function deletePeopleRecords(personIds)
{
    const requestedIds = [...new Set(Array.isArray(personIds) ? personIds.filter(Boolean) : [])];
    const validIds = requestedIds.filter(personId => Boolean(getPerson(personId)));
    if (!validIds.length) return;

    const deletedIds = new Set(validIds);
    removeSourceLinksForTargets(
        'person',
        [...deletedIds]
    );
    const partnerAFields = ['fatherId', 'husbandId', 'partnerAId', 'partner1Id', 'personAId'];
    const partnerBFields = ['motherId', 'wifeId', 'partnerBId', 'partner2Id', 'personBId'];
    const partnerAHints = ['partnerARoleHint', 'partner1RoleHint', 'personARoleHint', 'husbandRoleHint'];
    const partnerBHints = ['partnerBRoleHint', 'partner2RoleHint', 'personBRoleHint', 'wifeRoleHint'];

    const now = new Date().toISOString();
    sampleData.media.forEach(photo =>
    {
        const nextPersonIds = (photo.personIds || []).filter(personId => !deletedIds.has(personId));
        if (nextPersonIds.length !== (photo.personIds || []).length)
        {
            photo.personIds = nextPersonIds;
            photo.updatedAt = now;
        }
    });

    sampleData.people = sampleData.people.filter(person => !deletedIds.has(person.id));

    sampleData.projects.forEach(project =>
    {
        if (!deletedIds.has(project.defaultPersonId)) return;
        project.defaultPersonId = getPeople(project.id)[0]?.id || '';
    });

    Object.entries(state.treeProjectViews || {}).forEach(
        ([projectId, view]) =>
        {
            if (deletedIds.has(view.focusPersonId))
            {
                view.focusPersonId = treeDefaultPersonId(projectId);
            }

            view.navigationBackStack = Array.isArray(
                view.navigationBackStack
            )
                ? view.navigationBackStack.filter(entry =>
                    !deletedIds.has(entry?.focusPersonId)
                && !deletedIds.has(entry?.selectedPersonId)
                )
                : [];

            view.navigationForwardStack = Array.isArray(
                view.navigationForwardStack
            )
                ? view.navigationForwardStack.filter(entry =>
                    !deletedIds.has(entry?.focusPersonId)
                && !deletedIds.has(entry?.selectedPersonId)
                )
                : [];
        }
    );

    sampleData.families = centralFamilyRecords().map(family =>
    {
        const removedPartnerA = partnerAFields.some(field => deletedIds.has(family[field]));
        const removedPartnerB = partnerBFields.some(field => deletedIds.has(family[field]));

        partnerAFields.forEach(field =>
        {
            if (deletedIds.has(family[field])) family[field] = '';
        });
        partnerBFields.forEach(field =>
        {
            if (deletedIds.has(family[field])) family[field] = '';
        });
        if (removedPartnerA) partnerAHints.forEach(field =>
        {
            family[field] = '';
        });
        if (removedPartnerB) partnerBHints.forEach(field =>
        {
            family[field] = '';
        });

        unlinkSetFamilyChildren(
            family,
            unlinkFamilyChildrenIds(family).filter(personId => !deletedIds.has(personId))
        );

        family.parentChildTypes = Object.fromEntries(
            Object.entries(sanitizeParentChildTypes(family.parentChildTypes))
                .filter(([key]) => !key.split('|').some(personId => deletedIds.has(personId)))
        );

        return syncFamilyPartnerAliases(family);
    }).filter(family =>
    {
        const memberIds = new Set([
            familyPartnerAId(family),
            familyPartnerBId(family),
            ...unlinkFamilyChildrenIds(family)
        ].filter(Boolean));
        return memberIds.size >= 2;
    });

    const survivingFamilyIds = new Set(sampleData.families.map(family => family.id));
    sampleData.events = (sampleData.events || []).map(event => ({
        ...event,
        personIds: Array.isArray(event.personIds)
            ? event.personIds.filter(personId => !deletedIds.has(personId))
            : event.personIds,
        relatedPersonIds: Array.isArray(event.relatedPersonIds)
            ? event.relatedPersonIds.filter(personId => !deletedIds.has(personId))
            : event.relatedPersonIds
    })).filter(event =>
    {
        if (event.familyId && !survivingFamilyIds.has(event.familyId)) return false;
        return !Array.isArray(event.personIds) || event.personIds.length > 0;
    });

    sampleData.links = (sampleData.links || []).filter(link =>
        !(link.fromType === 'person' && deletedIds.has(link.fromId))
        && !(link.toType === 'person' && deletedIds.has(link.toId))
    );

    clearPeopleSelection();
    const fallbackId = treeDefaultPersonId(currentProjectId());
    if (!getPerson(state.selectedPeopleId)) state.selectedPeopleId = fallbackId;
    if (!getPerson(state.selectedPersonId)) state.selectedPersonId = fallbackId;
    if (deletedIds.has(state.treeCenterTargetId)) state.treeCenterTargetId = fallbackId;

    syncFamilyReciprocalLinks();
    rebuildSampleEventsAndPruneSourceLinks();
    closeModal();
    render();
    showToast(validIds.length === 1 ? 'Person deleted.' : `${validIds.length} people deleted.`);
}
function bindPeopleToolbarControls(rows)
{
    bindSearchInput(main, '#peopleSearch', 'peopleSearch', () =>
    {
        clearPeopleSelection();
        renderPeople();
    });
    bindAppSortControl(main, {
        id: 'peopleSort',
        options: APP_SORT_OPTIONS.people,
        getField: () => state.peopleSort,
        getDirection: () =>
            state.peopleSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.peopleSort = field;
            state.peopleSortDirection =
                direction;

            renderPeople();
        }
    });
    main.querySelector('#peopleColumnsButton')?.addEventListener('click', event => openPeopleColumnsPopover(event.currentTarget));
    main.querySelector('#peopleFilterButton')?.addEventListener('click', event => openPeopleFilterPopover(event.currentTarget));
    main.querySelector('#peopleClearFilters')?.addEventListener('click', clearPeopleFilters);
    main.querySelector('#peopleSaveView')?.addEventListener('click', openSavePeopleViewModal);
    main.querySelectorAll('[data-people-remove-filter]').forEach(button =>
    {
        button.addEventListener('click', () => removePeopleFilter(button.dataset.peopleRemoveFilter));
    });
    main.querySelector('#addPeoplePerson')?.addEventListener('click', () => openAddPersonModal('Add person', 'Create a new person in this project'));
    main.querySelector('[data-people-bulk-export]')?.addEventListener('click', () => showToast('Export selected people'));
    main.querySelector('[data-people-bulk-add-board]')?.addEventListener('click', () => showToast('Add selected people to a Geneograph board'));
    main.querySelector('[data-people-bulk-delete]')?.addEventListener('click', () => openDeletePeopleConfirm(state.peopleSelectedIds));
    main.querySelector('[data-people-bulk-clear]')?.addEventListener('click', () =>
    {
        clearPeopleSelection();
        renderPeople();
    });
}

function bindPeopleSelectionControls(rows)
{
    const selectionState = peopleVisibleSelectionState(rows);
    const headerCheckbox = main.querySelector('[data-people-select-visible]');

    if (headerCheckbox)
    {
        headerCheckbox.checked = selectionState.allVisibleSelected;
        headerCheckbox.indeterminate = selectionState.someVisibleSelected && !selectionState.allVisibleSelected;
        headerCheckbox.disabled = selectionState.visibleIds.length === 0;
        headerCheckbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            const selectedIds = peopleSelectedIdSet();
            if (selectionState.allVisibleSelected)
            {
                selectionState.visibleIds.forEach(personId => selectedIds.delete(personId));
            }
            else
            {
                selectionState.visibleIds.forEach(personId => selectedIds.add(personId));
            }
            setPeopleSelection([...selectedIds]);
            renderPeople();
        });
    }

    main.querySelectorAll('[data-people-select-id]').forEach(checkbox =>
    {
        checkbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            togglePeopleSelection(checkbox.dataset.peopleSelectId, {
                shiftKey: event.shiftKey,
                rows
            });
            renderPeople();
        });
    });
}

function updatePeoplePreviewRows(
    personId
)
{
    main
        .querySelectorAll(
            '[data-people-row]'
        )
        .forEach(row =>
        {
            const isPreviewed =
                row.dataset.peopleRow
            === personId;

            row.classList.toggle(
                'is-previewed',
                isPreviewed
            );

            if (isPreviewed)
            {
                row.setAttribute(
                    'aria-current',
                    'true'
                );
            }
            else
            {
                row.removeAttribute(
                    'aria-current'
                );
            }
        });
}

function previewPeoplePerson(
    personId
)
{
    const person =
        getPerson(personId);

    if (
        !person
        || person.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    if (
        state.selectedPeopleId
        === personId
    )
    {
        return;
    }

    state.selectedPeopleId =
        personId;

    state.selectedPersonId =
        personId;

    resetPersonSidebarSections();

    /*
      * Update only the row preview styling.
      * The table DOM and its scroll position
      * remain untouched.
      */
    updatePeoplePreviewRows(
        personId
    );

    /*
      * Replace only the right-side panel.
      * A different person's panel begins
      * at the top.
      */
    rerenderPersonSidebarContext(
        'people',
        {
            preserveScroll: false
        }
    );
}

function bindPeopleTableNavigation(
    rows
)
{
    main
        .querySelectorAll(
            '[data-people-row]'
        )
        .forEach(row =>
        {
            const previewPerson = () =>
            {
                previewPeoplePerson(
                    row.dataset.peopleRow
                );
            };

            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            [
                                'button',
                                'input',
                                'select',
                                'a',
                                '[data-people-select-id]'
                            ].join(',')
                        )
                    )
                    {
                        return;
                    }

                    previewPerson();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target !== row
                || event.key !== 'Enter'
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    previewPerson();
                }
            );
        });
}

function bindPeopleRowActions(rows)
{
    main.querySelectorAll('[data-people-row-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.stopPropagation();
            openPeopleActionsMenu(button.dataset.peopleRowMenu, button, { includeProfile: true });
        });
    });
}

function bindPeoplePaginationControls()
{
    main
        .querySelectorAll(
            '[data-people-page]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    if (
                        button.disabled
                    )
                    {
                        return;
                    }

                    const nextPage =
                        Number(
                            button.dataset
                                .peoplePage
                        );

                    if (
                        !Number.isInteger(
                            nextPage
                        )
                || nextPage < 1
                    )
                    {
                        return;
                    }

                    state.peoplePage =
                        nextPage;

                    renderPeople();
                }
            );
        });

    main
        .querySelector(
            '#peopleRowsPerPage'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                const rowsPerPage =
                    normalizePeopleRowsPerPage(
                        event.currentTarget.value
                    );

                state.peopleRowsPerPage =
                    rowsPerPage;

                /*
            * Reset to page 1 because the previous page number
            * may represent a completely different item range.
            */
                state.peoplePage = 1;

                renderPeople();
            }
        );
}

function bindPeopleControls(
    rows
)
{
    bindPeopleSidebar(main);

    bindPeopleToolbarControls(
        rows
    );

    bindPeoplePaginationControls();

    bindPeopleSelectionControls(
        rows
    );

    bindPeopleTableNavigation(
        rows
    );

    bindPeopleRowActions(
        rows
    );

    bindPersonSidebar(
        main,
        'people'
    );

    bindToasts(main);
}

function bindPeopleSidebar(root)
{
    root.querySelectorAll('[data-saved-view]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            applyPeopleSavedView(button.dataset.savedView);
        });
    });

    root.querySelectorAll('[data-saved-view-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();

            openPeopleSavedViewMenu(
                button.dataset.savedViewMenu,
                button
            );
        });
    });

    root
        .querySelector('#peopleSidebarSaveView')
        ?.addEventListener('click', openCreatePeopleFilterModal);

    root
        .querySelector('[data-people-side]')
        ?.addEventListener('click', () =>
        {
            clearPeopleSelection();
            state.peopleView = 'directory';
            state.peopleSide = 'people';
            state.peopleSavedViewId = '';
            state.peopleSavedView = 'All people';
            state.peopleFilters =
                peopleFiltersWithDefaults(
                    defaultPeopleFilters
                );

            renderPeople();
        });

    root
        .querySelector('[data-open-profile]')
        ?.addEventListener('click', () =>
        {
            clearPeopleSelection();
            state.peopleView = 'profile';
            renderPeople();
        });

    root.querySelectorAll('[data-placeholder-view]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            showToast(
                `${button.dataset.placeholderView} will be built in a later People iteration.`
            );
        });
    });

    bindToasts(root);
}

function connectedSourceFilterOptions()
{
    return archiveProjectSources()
        .map(source => ({
            value: source.id,
            label: source.title || source.id
        }))
        .sort((a, b) =>
            a.label.localeCompare(
                b.label,
                state.language === 'ru' ? 'ru' : 'en'
            )
        );
}

