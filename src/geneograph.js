function renderGeneograph()
{
    workspace.classList.remove('no-sidebar');
    if (state.geneoView === 'board')
    {
        const board = selectedGeneographBoard();
        if (!board)
        {
            state.geneoView = 'home';
            state.selectedGeneoBoardId = null;
            renderGeneographHome();
            return;
        }
        const center = geneoCurrentViewportCenter()
          || geneoSavedViewport(board?.id)?.center
          || geneoContentCenter();
        renderGeneographEditor();
        scheduleGeneographViewportRestore(center);
    }
    else
    {
        renderGeneographHome();
    }
}

function selectedGeneographBoard()
{
    return getGeneographBoard(state.selectedGeneoBoardId, {
        projectId: currentProjectId()
    });
}

const GENEO_PERSON_CARD_STYLES =
    Object.freeze([
        'standard',
        'tree',
        'chart',
        'portrait'
    ]);

const GENEO_PERSON_CARD_NAME_FORMATS =
    Object.freeze([
        'full',
        'first-last',
        'surname-first'
    ]);

const GENEO_PERSON_CARD_DATE_FORMATS =
    Object.freeze([
        'full',
        'years'
    ]);

const GENEO_PERSON_CARD_PHOTO_SIZES =
    Object.freeze([
        'small',
        'medium',
        'large'
    ]);

const GENEO_PERSON_CARD_ALIGNMENTS =
    Object.freeze([
        'left',
        'center'
    ]);

const GENEO_PERSON_CARD_ENUMS =
    Object.freeze({
        style:
          GENEO_PERSON_CARD_STYLES,

        nameFormat:
          GENEO_PERSON_CARD_NAME_FORMATS,

        dateFormat:
          GENEO_PERSON_CARD_DATE_FORMATS,

        photoSize:
          GENEO_PERSON_CARD_PHOTO_SIZES,

        alignment:
          GENEO_PERSON_CARD_ALIGNMENTS
    });

const GENEO_PERSON_CARD_GEOMETRY =
    Object.freeze({
        standard: {
            width: 300,
            height: 164,
            minWidth: 260,
            minHeight: 144,
            maxWidth: 600,
            maxHeight: 440
        },

        tree: {
            width: 280,
            height: 170,
            minWidth: 230,
            minHeight: 130,
            maxWidth: 560,
            maxHeight: 340
        },

        chart: {
            width: 260,
            height: 120,
            minWidth: 220,
            minHeight: 100,
            maxWidth: 520,
            maxHeight: 240
        },

        portrait: {
            width: 200,
            height: 330,
            minWidth: 170,
            minHeight: 260,
            maxWidth: 400,
            maxHeight: 660
        }
    });

function geneoPersonCardEnumValue(
    key,
    value,
    fallback
)
{
    return (
        GENEO_PERSON_CARD_ENUMS[key]
            ?.includes(value)
            ? value
            : fallback
    );
}

function geneoPersonCardSettingValueIsValid(
    key,
    value
)
{
    return Boolean(
        GENEO_PERSON_CARD_ENUMS[key]
            ?.includes(value)
    );
}

function geneoEmptyPersonCardOverrides(
    custom = false,
    heightMode = 'auto'
)
{
    return {
        custom:
          Boolean(custom),

        heightMode:
          heightMode === 'manual'
              ? 'manual'
              : 'auto',

        fields: {},
        photoByStyle: {},

        style: null,
        nameFormat: null,
        dateFormat: null,
        photoSize: null,
        alignment: null,
        cornerRadius: null
    };
}

function geneoPersonCardDisplayName(
    person,
    format = 'full'
)
{
    const names =
        normalizeGeneographPersonNames(
            person || {}
        );

    let parts = [];

    if (format === 'first-last')
    {
        parts = [
            names.first,
            names.last
        ];
    }
    else if (
        format === 'surname-first'
    )
    {
        parts = [
            names.last,
            names.first,
            names.middle
        ];
    }
    else
    {
        parts = [
            names.first,
            names.middle,
            names.last
        ];
    }

    return (
        parts
            .filter(Boolean)
            .join(' ')
        || 'Unknown'
    );
}

function geneoPersonCardVitalDateLabel(
    vital,
    dateFormat = 'full'
)
{
    if (dateFormat === 'years')
    {
        return (
            timelineYearFromValue(vital)
          || ''
        );
    }

    return (
        formatGenealogyDateLabel(vital)
        || ''
    );
}

function geneoPersonCardDefaultFields(
    style = 'standard'
)
{
    return {
        photo: style !== 'chart',
        dates: true,
        livingStatus: true,
        birthPlace: false,
        deathPlace: false,
        maidenName: false,
        linkIndicator: false
    };
}

function geneoPersonCardDefaultPhotoPreferences()
{
    return {
        standard: true,
        tree: true,
        chart: false,
        portrait: true
    };
}

function geneoDefaultPersonCardSettings(
    style = 'standard'
)
{
    const normalizedStyle =
        [
            'standard',
            'tree',
            'chart',
            'portrait'
        ].includes(style)
            ? style
            : 'standard';

    return {
        style: normalizedStyle,
        nameFormat: 'full',
        dateFormat: 'full',
        photoSize: 'medium',
        alignment: 'left',

        fields:
          geneoPersonCardDefaultFields(
              normalizedStyle
          ),

        photoByStyle:
          geneoPersonCardDefaultPhotoPreferences(),

        cornerRadius: 8
    };
}

function normalizeGeneographPersonCardSettings(
    value
)
{
    const baseDefaults =
        geneoDefaultPersonCardSettings();

    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const style =
        geneoPersonCardEnumValue(
            'style',
            source.style,
            baseDefaults.style
        );

    const defaults =
        geneoDefaultPersonCardSettings(style);

    const sourceFields =
        source.fields
        && typeof source.fields === 'object'
            ? source.fields
            : {};

    const fields = {};

    const photoByStyle = {
        ...geneoPersonCardDefaultPhotoPreferences()
    };

    const sourcePhotoByStyle =
        source.photoByStyle
        && typeof source.photoByStyle === 'object'
            ? source.photoByStyle
            : {};

    Object.keys(photoByStyle).forEach(key =>
    {
        if (
            typeof sourcePhotoByStyle[key]
          === 'boolean'
        )
        {
            photoByStyle[key] =
                sourcePhotoByStyle[key];
        }
    });

    if (
        typeof sourceFields.photo === 'boolean'
        && !Object.hasOwn(
            sourcePhotoByStyle,
            style
        )
        && style !== 'chart'
    )
    {
        photoByStyle[style] =
            sourceFields.photo;
    }

    Object.keys(
        defaults.fields
    ).forEach(key =>
    {
        fields[key] = key === 'photo'
            ? photoByStyle[style]
            : typeof sourceFields[key]
              === 'boolean'
                ? sourceFields[key]
                : defaults.fields[key];
    });

    return {
        style,

        nameFormat:
          geneoPersonCardEnumValue(
              'nameFormat',
              source.nameFormat,
              defaults.nameFormat
          ),

        dateFormat:
          geneoPersonCardEnumValue(
              'dateFormat',
              source.dateFormat,
              defaults.dateFormat
          ),

        photoSize:
          geneoPersonCardEnumValue(
              'photoSize',
              source.photoSize,
              defaults.photoSize
          ),

        alignment:
          geneoPersonCardEnumValue(
              'alignment',
              source.alignment,
              defaults.alignment
          ),

        fields,
        photoByStyle,

        cornerRadius:
          Math.round(
              geneoNumber(
                  source.cornerRadius,
                  defaults.cornerRadius,
                  0,
                  32
              )
          )
    };
}

function normalizeGeneographPersonCardOverrides(
    value,
    fallbackHeightMode = 'auto'
)
{
    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const heightMode =
        source.heightMode === 'manual'
            ? 'manual'
            : source.heightMode === 'auto'
                ? 'auto'
                : fallbackHeightMode === 'manual'
                    ? 'manual'
                    : 'auto';

    if (source.custom !== true)
    {
        return geneoEmptyPersonCardOverrides(
            false,
            heightMode
        );
    }

    const fields = {};
    const photoByStyle = {};

    const sourceFields =
        source.fields
        && typeof source.fields === 'object'
            ? source.fields
            : {};

    Object.keys(
        geneoDefaultPersonCardSettings()
            .fields
    ).forEach(key =>
    {
        if (
            typeof sourceFields[key]
          === 'boolean'
        )
        {
            fields[key] =
                sourceFields[key];
        }
    });

    const sourcePhotoByStyle =
        source.photoByStyle
        && typeof source.photoByStyle === 'object'
            ? source.photoByStyle
            : {};

    GENEO_PERSON_CARD_STYLES.forEach(style =>
    {
        if (
            typeof sourcePhotoByStyle[style]
          === 'boolean'
        )
        {
            photoByStyle[style] =
                sourcePhotoByStyle[style];
        }
    });

    const radius =
        Number(source.cornerRadius);

    const enumOverride =
        key =>
            geneoPersonCardSettingValueIsValid(
                key,
                source[key]
            )
                ? source[key]
                : null;

    return {
        custom: true,
        heightMode,
        fields,
        photoByStyle,

        style:
          enumOverride('style'),

        nameFormat:
          enumOverride('nameFormat'),

        dateFormat:
          enumOverride('dateFormat'),

        photoSize:
          enumOverride('photoSize'),

        alignment:
          enumOverride('alignment'),

        cornerRadius:
          Number.isFinite(radius)
              ? Math.round(
                  geneoNumber(
                      radius,
                      8,
                      0,
                      32
                  )
              )
              : null
    };
}

function geneoPersonCardEffectiveSettings(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const boardSettings =
        normalizeGeneographPersonCardSettings(
            diagram?.personCardDefaults
        );

    const overrides =
        normalizeGeneographPersonCardOverrides(
            node?.personCard
        );

    if (!overrides.custom)
    {
        return {
            ...boardSettings,
            heightMode: overrides.heightMode
        };
    }

    const value =
        key =>
            overrides[key] === null
          || overrides[key] === undefined
                ? boardSettings[key]
                : overrides[key];

    const style = value('style');

    const inheritedFields = {
        ...boardSettings.fields,
        ...(
            style === boardSettings.style
                ? {}
                : {
                    photo:
                  geneoPersonCardDefaultFields(
                      style
                  ).photo
                }
        )
    };

    const photoOverride =
        typeof overrides.photoByStyle?.[style]
          === 'boolean'
            ? overrides.photoByStyle[style]
            : typeof overrides.fields.photo
              === 'boolean'
                ? overrides.fields.photo
                : null;

    return {
        style,
        heightMode: overrides.heightMode,

        nameFormat:
          value('nameFormat'),

        dateFormat:
          value('dateFormat'),

        photoSize:
          value('photoSize'),

        alignment:
          value('alignment'),

        fields: {
            ...inheritedFields,
            ...overrides.fields,
            ...(
                photoOverride === null
                    ? {}
                    : { photo: photoOverride }
            )
        },

        cornerRadius:
          overrides.cornerRadius === null
              ? boardSettings.cornerRadius
              : overrides.cornerRadius
    };
}

function geneoPersonCardFieldSupported(
    style,
    field
)
{
    if (
        field === 'birthPlace'
        || field === 'deathPlace'
    )
    {
        return (
            style === 'standard'
          || style === 'portrait'
        );
    }

    return true;
}

function geneoPersonHasRecordedDeath(
    person
)
{
    return Boolean(
        formatGenealogyDateLabel(
            person?.death
        )
        || geneoPersonPlaceLabel(
            person?.death
        )
    );
}

function geneoPersonCardViewModel(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const person =
        node?.type === 'person'
            ? (
                diagram?.people || []
            ).find(
                item =>
                    item.id === node.personId
            ) || null
            : null;

    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    const fields =
        settings.fields;

    if (!person)
    {
        return {
            person: null,
            settings,
            fields,
            displayName: 'Unknown',
            maidenName: '',
            showPhoto:
            Boolean(fields.photo),
            lifeSpan: '',
            structuredLife: false,
            birthEvent: null,
            deathEvent: null,
            displayStatus: '',
            linked: false,
            linkTitle: ''
        };
    }

    const displayName =
        geneoPersonCardDisplayName(
            person,
            settings.nameFormat
        );

    const surname =
        String(
            person.names?.last || ''
        ).trim();

    const rawMaidenName =
        person.gender === 'female'
            ? String(
                person.names?.maiden || ''
            ).trim()
            : '';

    const maidenName =
        fields.maidenName
        && rawMaidenName
        && rawMaidenName.localeCompare(
            surname,
            undefined,
            { sensitivity: 'accent' }
        ) !== 0
            ? rawMaidenName
            : '';

    const deceased =
        person.livingStatus ===
        'Deceased';

    const hasRecordedDeath =
        deceased
        && geneoPersonHasRecordedDeath(
            person
        );

    const detailedStyle =
        settings.style === 'standard'
        || settings.style === 'portrait';

    const birthDate =
        fields.dates
            ? geneoPersonCardVitalDateLabel(
                person.birth,
                settings.dateFormat
            )
            : '';

    const deathDate =
        fields.dates
        && deceased
            ? geneoPersonCardVitalDateLabel(
                person.death,
                settings.dateFormat
            )
            : '';

    const birthPlace =
        detailedStyle
        && fields.birthPlace
            ? geneoPersonPlaceLabel(
                person.birth
            )
            : '';

    const deathPlace =
        detailedStyle
        && fields.deathPlace
        && deceased
            ? geneoPersonPlaceLabel(
                person.death
            )
            : '';

    const birthEvent =
        detailedStyle
        && (
            birthDate
          || birthPlace
        )
            ? {
                date: birthDate,
                place: birthPlace
            }
            : null;

    const deathEvent =
        detailedStyle
        && (
            deathDate
          || deathPlace
        )
            ? {
                date: deathDate,
                place: deathPlace
            }
            : null;

    const structuredLife =
        detailedStyle
        && Boolean(
            birthEvent
          || deathEvent
        );

    const lifeSpan =
        fields.dates
        && !detailedStyle
            ? geneoPersonCardLifeSpan(
                person,
                settings.dateFormat
            )
            : '';

    /*
       * Living is intentionally not presented
       * as a card status. Only exceptional or
       * unresolved states appear.
       */
    const displayStatus =
        fields.livingStatus
        && (
            (
                deceased
            && !hasRecordedDeath
            )
          || person.livingStatus ===
            'Unknown'
        )
            ? person.livingStatus
            : '';

    const linked =
        Boolean(
            fields.linkIndicator
          && person.treePersonId
        );

    const linkTitle =
        person.syncState === 'modified'
            ? 'Linked to Family Tree with board changes'
            : 'Linked to Family Tree';

    return {
        person,
        settings,
        fields,
        displayName,
        maidenName,
        showPhoto:
          Boolean(fields.photo),
        lifeSpan,
        structuredLife,
        birthEvent,
        deathEvent,
        displayStatus,
        linked,
        linkTitle
    };
}

function geneoPersonCardReferenceSize(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const style =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        ).style
        || 'standard';

    const base =
        GENEO_PERSON_CARD_GEOMETRY[
            style
        ]
        || GENEO_PERSON_CARD_GEOMETRY
            .standard;

    return {
        width:
          base.width,

        height:
          base.height
    };
}

function geneoPersonCardGeometry(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const style =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        ).style
        || 'standard';

    return (
        GENEO_PERSON_CARD_GEOMETRY[style]
        || GENEO_PERSON_CARD_GEOMETRY.standard
    );
}

function geneoPersonCardDimensionFactors(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    return {
        width:
          geneoNumber(
              Number(node?.width)
              / geometry.width,
              1,
              geometry.minWidth
              / geometry.width,
              geometry.maxWidth
              / geometry.width
          ),

        height:
          geneoNumber(
              Number(node?.height)
              / geometry.height,
              1,
              geometry.minHeight
              / geometry.height,
              geometry.maxHeight
              / geometry.height
          )
    };
}

function geneoSetPersonCardDimensions(
    node,
    factors,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return;
    }

    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    node.width =
        geneoNumber(
            geometry.width
            * geneoNumber(
                factors?.width,
                1
            ),
            geometry.width,
            geometry.minWidth,
            geometry.maxWidth
        );

    node.height =
        geneoNumber(
            geometry.height
            * geneoNumber(
                factors?.height,
                1
            ),
            geometry.height,
            geometry.minHeight,
            geometry.maxHeight
        );
}

function geneoCapturePersonCardDimensions(
    nodes,
    diagram = selectedGeneographDiagram()
)
{
    return new Map(
        (
            Array.isArray(nodes)
                ? nodes
                : []
        )
            .filter(
                node =>
                    node?.type === 'person'
            )
            .map(
                node => [
                    node.id,
                    geneoPersonCardDimensionFactors(
                        node,
                        diagram
                    )
                ]
            )
    );
}

function geneoRestorePersonCardDimensions(
    dimensionMap,
    diagram = selectedGeneographDiagram()
)
{
    if (!(dimensionMap instanceof Map))
    {
        return;
    }

    dimensionMap.forEach(
        (factors, nodeId) =>
        {
            const node =
                getGeneographNode(nodeId);

            if (node?.type !== 'person')
            {
                return;
            }

            geneoSetPersonCardDimensions(
                node,
                factors,
                diagram
            );
        }
    );
}

function geneoPersonCardPhotoBaseSize(
    settings
)
{
    const style =
        settings?.style
        || 'standard';

    const size =
        settings?.photoSize
        || 'medium';

    const values = {
        standard: {
            small: 64,
            medium: 76,
            large: 88
        },

        tree: {
            small: 52,
            medium: 64,
            large: 76
        },

        chart: {
            small: 36,
            medium: 42,
            large: 48
        },

        portrait: {
            small: 96,
            medium: 116,
            large: 136
        }
    };

    return (
        values[style]?.[size]
        || values.standard.medium
    );
}

function geneoPersonCardCssVariables(
    node,
    settings =
        geneoPersonCardEffectiveSettings(
            node
        )
)
{
    const photo =
        geneoPersonCardPhotoBaseSize(
            settings
        );

    return [
        `--geneo-card-photo-target:${photo}px`
    ];
}

function geneoPersonCardMinimumSize(
    node,
    width = node?.width,
    diagram = selectedGeneographDiagram()
)
{
    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    return {
        width: geometry.minWidth,
        height: geometry.minHeight
    };
}

function ensureGeneographPersonCardSize(
    node,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return;
    }

    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    node.width =
        geneoNumber(
            node.width,
            geometry.width,
            geometry.minWidth,
            geometry.maxWidth
        );

    node.height =
        geneoNumber(
            node.height,
            geometry.height,
            geometry.minHeight,
            geometry.maxHeight
        );
}

function geneoPersonCardUsesAutoHeight(
    node,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return false;
    }

    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    return (
        settings.style === 'standard'
        && settings.heightMode === 'auto'
    );
}

function geneoAutoPersonHeightSignature(
    node,
    content,
    diagram
)
{
    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    const person =
        getGeneographPerson(
            node.personId
        );

    return JSON.stringify([
        state.language,
        Math.round(
            geneoNumber(
                node.width,
                0
            ) * 100
        ) / 100,
        settings,
        person?.treePersonId || '',
        person?.photoId || '',
        String(
            content.textContent || ''
        )
            .trim()
            .replace(/\s+/g, ' ')
    ]);
}

function syncGeneographAutoPersonCardHeights()
{
    const diagram = selectedGeneographDiagram();

    if (!diagram) return false;

    const changed = [];

    const signatureCache =
        geneoCanvasRuntime
            .autoPersonHeightSignatures
        || new Map();

    geneoCanvasRuntime
        .autoPersonHeightSignatures =
            signatureCache;

    const autoNodeIds =
        new Set(
            diagram.nodes
                .filter(node =>
                    geneoPersonCardUsesAutoHeight(
                        node,
                        diagram
                    )
                )
                .map(node => node.id)
        );

    for (
        const nodeId
        of signatureCache.keys()
    )
    {
        if (!autoNodeIds.has(nodeId))
        {
            signatureCache.delete(nodeId);
        }
    }

    diagram.nodes
        .filter(node =>
            geneoPersonCardUsesAutoHeight(
                node,
                diagram
            )
        )
        .forEach(node =>
        {
            const element = main.querySelector(
                `article[data-geneo-node="${CSS.escape(node.id)}"]`
            );

            const content = element?.querySelector(
                '.geneo-person-node-content'
            );

            if (!element || !content) return;

            const signature =
                geneoAutoPersonHeightSignature(
                    node,
                    content,
                    diagram
                );

            if (
                signatureCache.get(node.id)
            === signature
            )
            {
                return;
            }

            signatureCache.set(
                node.id,
                signature
            );

            const geometry =
                geneoPersonCardGeometry(
                    node,
                    diagram
                );

            const naturalHeight = Math.ceil(
                content.scrollHeight
            );

            const nextHeight = Math.round(
                geneoNumber(
                    naturalHeight,
                    node.height,
                    geometry.minHeight,
                    geometry.maxHeight
                )
            );

            if (
                Math.abs(nextHeight - node.height)
            < 1
            )
            {
                return;
            }

            node.height = nextHeight;
            element.style.height = `${nextHeight}px`;
            changed.push(node);
        });

    if (!changed.length) return false;

    updateGeneographLiveGeometry(
        changed[0],
        changed
    );

    const selected = selectedGeneographNode();

    if (
        selected
        && changed.some(
            node => node.id === selected.id
        )
    )
    {
        const heightInput = main.querySelector(
            '[data-geneo-layout="height"]'
        );

        if (heightInput)
        {
            heightInput.value = Math.round(
                selected.height
            );
        }
    }

    return true;
}

function geneoPlaceUsesAutoSize(node)
{
    return (
        node?.type === 'place'
        && node.placeSizeMode !== 'manual'
    );
}

function syncGeneographAutoPlaceSizes()
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram)
    {
        return false;
    }

    const changed = [];

    /*
       * Text is measured using the Place label's actual
       * computed font, independently of the current node
       * width. This lets auto-sized nodes both grow and
       * shrink correctly.
       */
    const measurementCanvas =
        document.createElement('canvas');

    const measurementContext =
        measurementCanvas.getContext('2d');

    const cssPixels = value =>
        Number.parseFloat(value) || 0;

    diagram.nodes
        .filter(geneoPlaceUsesAutoSize)
        .forEach(node =>
        {
            const element =
                main.querySelector(
                    `article[data-geneo-node="${
                        CSS.escape(node.id)
                    }"]`
                );

            const content =
                element?.querySelector(
                    '.geneo-place-node-content'
                );

            const iconElement =
                content?.querySelector(
                    '.geneo-place-node-icon'
                );

            const nameElement =
                content?.querySelector(
                    '.geneo-place-node-name'
                );

            if (
                !element
            || !content
            || !iconElement
            || !nameElement
            )
            {
                return;
            }

            const contentStyle =
                getComputedStyle(content);

            const elementStyle =
                getComputedStyle(element);

            const nameStyle =
                getComputedStyle(nameElement);

            let nameWidth =
                nameElement.scrollWidth;

            if (measurementContext)
            {
                measurementContext.font = [
                    nameStyle.fontStyle,
                    nameStyle.fontWeight,
                    nameStyle.fontSize,
                    nameStyle.fontFamily
                ]
                    .filter(Boolean)
                    .join(' ');

                nameWidth =
                    measurementContext.measureText(
                        nameElement.textContent || ''
                    ).width;
            }

            const naturalWidth =
                Math.ceil(
                    cssPixels(
                        contentStyle.paddingLeft
                    )
              + iconElement.offsetWidth
              + cssPixels(
                  contentStyle.columnGap
                || contentStyle.gap
              )
              + nameWidth
              + cssPixels(
                  contentStyle.paddingRight
              )
              + cssPixels(
                  elementStyle.borderLeftWidth
              )
              + cssPixels(
                  elementStyle.borderRightWidth
              )
              + 2
                );

            const defaults =
                geneoNodeDefaults('place');

            const minimumSize =
                geneoNodeMinimumSize(node);

            const maximumSize =
                geneoNodeMaximumSize(node);

            const nextWidth =
                Math.round(
                    geneoNumber(
                        naturalWidth,
                        defaults.width,
                        minimumSize.width,
                        maximumSize.width
                    )
                );

            /*
           * Place content is deliberately one line.
           * Automatic sizing therefore restores its
           * canonical natural height.
           */
            const nextHeight =
                Math.round(
                    geneoNumber(
                        defaults.height,
                        defaults.height,
                        minimumSize.height,
                        maximumSize.height
                    )
                );

            if (
                nextWidth === node.width
            && nextHeight === node.height
            )
            {
                return;
            }

            node.width = nextWidth;
            node.height = nextHeight;

            element.style.width =
                `${nextWidth}px`;

            element.style.height =
                `${nextHeight}px`;

            changed.push(node);
        });

    if (!changed.length)
    {
        return false;
    }

    updateGeneographLiveGeometry(
        changed[0],
        changed
    );

    const selected =
        selectedGeneographNode();

    if (
        selected
        && changed.some(
            node => node.id === selected.id
        )
    )
    {
        const widthInput =
            main.querySelector(
                '[data-geneo-layout="width"]'
            );

        const heightInput =
            main.querySelector(
                '[data-geneo-layout="height"]'
            );

        if (widthInput)
        {
            widthInput.value =
                Math.round(selected.width);
        }

        if (heightInput)
        {
            heightInput.value =
                Math.round(selected.height);
        }
    }

    return true;
}

function geneoNodeCornerRadius(node)
{
    if (node?.type === 'person')
    {
        return (
            geneoPersonCardEffectiveSettings(
                node
            ).cornerRadius
        );
    }

    if (node?.type === 'text')
    {
        return node.appearance.cornerRadius;
    }

    return 8;
}

function createEmptyGeneographDiagram()
{
    return {
        canvas: {
            backgroundPaint: { color: '#0F1413', opacity: 100, enabled: true },
            backgroundPattern: 'dots',
            snapToGrid: false,
            alwaysShowSockets: false,
            colorPersonCardsByGender: false
        },
        personCardDefaults:
          geneoDefaultPersonCardSettings(),
        assets: [],
        people: [],
        families: [],
        nodes: [],
        connections: []
    };
}

function selectedGeneographDiagram()
{
    return selectedGeneographBoard()?.diagram || null;
}

function getGeneographNode(nodeId)
{
    return selectedGeneographDiagram()?.nodes.find(node => node.id === nodeId) || null;
}

function getGeneographConnection(connectionId)
{
    return selectedGeneographDiagram()?.connections.find(connection => connection.id === connectionId) || null;
}

function getGeneographPerson(personId)
{
    return selectedGeneographDiagram()?.people.find(person => person.id === personId) || null;
}

function normalizeGeneographPersonNames(person = {})
{
    const source = person.names && typeof person.names === 'object' ? person.names : {};
    let first = String(source.first || '').trim();
    let middle = String(source.middle || '').trim();
    let last = String(source.last || '').trim();
    const maiden = String(source.maiden || '').trim();
    if (!first && !middle && !last && person.displayName)
    {
        const parts = String(person.displayName).trim().split(/\s+/).filter(Boolean);
        first = parts.shift() || '';
        last = parts.length ? parts.pop() : '';
        middle = parts.join(' ');
    }
    return { first, middle, last, maiden };
}

function normalizeGeneographPersonVital(value, projectId)
{
    const source = value && typeof value === 'object' ? value : {};
    const normalized = normalizeGenealogyDateInput(value || emptyGenealogyDate('Exact date'));
    const requestedPlaceId = cleanDatePlaceId(source.placeId || normalized.placeId);
    const place = requestedPlaceId
        ? (sampleData.places || []).find(item => item.id === requestedPlaceId && item.projectId === projectId && !item.deleted)
        : null;
    return {
        ...normalized,
        placeId: place?.id || null,
        placeText: String(source.placeText || '').trim()
    };
}

function geneoPersonDisplayName(person)
{
    const names = normalizeGeneographPersonNames(person);
    return [names.first, names.middle, names.last].filter(Boolean).join(' ') || 'Unknown';
}

function geneoPersonInitials(person)
{
    const names = normalizeGeneographPersonNames(person);
    const parts = [names.first, names.last].filter(Boolean);
    return (parts.map(value => value[0]).join('').slice(0, 2) || 'U').toUpperCase();
}

function geneoPersonLifeDates(person)
{
    const birth = formatGenealogyDateLabel(person?.birth);
    const death = person?.livingStatus === 'Deceased' ? formatGenealogyDateLabel(person?.death) : '';
    if (birth && death) return `${birth} - ${death}`;
    if (birth) return `Born ${birth}`;
    if (death) return `Died ${death}`;
    return 'Dates unknown';
}

function geneoPersonPlaceLabel(vital)
{
    return getPlaceDisplay(vital?.placeId) || String(vital?.placeText || '').trim();
}

function getGeneographFamily(familyId)
{
    return selectedGeneographDiagram()?.families.find(family => family.id === familyId) || null;
}

function normalizeGeneographIdArray(
    value
)
{
    if (!Array.isArray(value))
    {
        return [];
    }

    return [
        ...new Set(
            value
                .map(item =>
                    String(
                        item || ''
                    ).trim()
                )
                .filter(Boolean)
        )
    ];
}

function getProjectBoards(
    projectId =
        currentProjectId(),
    {
        includeArchived =
            false
    } = {}
)
{
    return (
        sampleData.boards
        || []
    ).filter(board =>
        board.projectId
          === projectId
        && (
            includeArchived
          || !board.archived
        )
    );
}

function getGeneographBoard(
    boardId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const board =
        (
            sampleData.boards
          || []
        ).find(item =>
            item.id === boardId
        )
        || null;

    if (
        !board
        || (
            projectId
          && board.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return board;
}

function getProjectBoardCollections(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.boardCollections
        || []
    ).filter(collection =>
        collection.projectId
          === projectId
    );
}

function getBoardCollection(
    collectionId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const collection =
        (
            sampleData.boardCollections
          || []
        ).find(item =>
            item.id === collectionId
        )
        || null;

    if (
        !collection
        || (
            projectId
          && collection.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return collection;
}

function getCollectionsForBoard(
    boardId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return [];
    }

    return (
        board.collectionIds
        || []
    )
        .map(collectionId =>
            getBoardCollection(
                collectionId,
                {
                    projectId:
                board.projectId
                }
            )
        )
        .filter(Boolean);
}

function getBoardsForCollection(
    collectionId,
    {
        projectId =
            currentProjectId(),

        includeArchived =
            false
    } = {}
)
{
    const collection =
        getBoardCollection(
            collectionId,
            {
                projectId
            }
        );

    if (!collection)
    {
        return [];
    }

    return getProjectBoards(
        collection.projectId,
        {
            includeArchived
        }
    ).filter(board =>
        (
            board.collectionIds
          || []
        ).includes(
            collection.id
        )
    );
}

function setBoardCollections(
    boardId,
    collectionIds,
    {
        projectId =
            currentProjectId(),

        touchModified =
            true
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return null;
    }

    const validCollectionIds =
        new Set(
            getProjectBoardCollections(
                board.projectId
            ).map(collection =>
                collection.id
            )
        );

    const nextCollectionIds =
        normalizeGeneographIdArray(
            collectionIds
        ).filter(collectionId =>
            validCollectionIds.has(
                collectionId
            )
        );

    const unchanged =
        nextCollectionIds.length
          === board.collectionIds.length
        && nextCollectionIds.every(
            (
                collectionId,
                index
            ) =>
                collectionId
              === board.collectionIds[
                  index
              ]
        );

    if (unchanged)
    {
        return board;
    }

    board.collectionIds =
        nextCollectionIds;

    if (touchModified)
    {
        touchGeneographBoard(
            board
        );
    }

    return board;
}

function addBoardToCollection(
    boardId,
    collectionId,
    options = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId:
              options.projectId
              || currentProjectId()
            }
        );

    if (!board)
    {
        return null;
    }

    return setBoardCollections(
        board.id,
        [
            ...board.collectionIds,
            collectionId
        ],
        options
    );
}

function removeBoardFromCollection(
    boardId,
    collectionId,
    options = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId:
              options.projectId
              || currentProjectId()
            }
        );

    if (!board)
    {
        return null;
    }

    return setBoardCollections(
        board.id,
        board.collectionIds.filter(
            id =>
                id !== collectionId
        ),
        options
    );
}

function setGeneographBoardArchived(
    boardId,
    archived,
    {
        projectId =
            currentProjectId(),

        touchModified =
            true
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return null;
    }

    const nextArchived =
        Boolean(
            archived
        );

    if (
        board.archived
          === nextArchived
    )
    {
        return board;
    }

    board.archived =
        nextArchived;

    if (touchModified)
    {
        touchGeneographBoard(
            board
        );
    }

    return board;
}

function createGeneographCollection({
    name,
    description = '',
    projectId =
        currentProjectId()
} = {})
{
    projectId = validProjectById(projectId)?.id || '';
    const normalizedName =
        String(
            name || ''
        ).trim();

    if (!normalizedName || !projectId)
    {
        return null;
    }

    const collection = {
        id:
          createRuntimeId(
              'board-col'
          ),

        projectId,

        name:
          normalizedName,

        description:
          String(
              description || ''
          ).trim()
    };

    sampleData.boardCollections.push(
        collection
    );

    return collection;
}

function activeGeneographCollection()
{
    if (
        state.geneoLibraryView
          !== 'collection'
        || !state
            .geneoActiveCollectionId
    )
    {
        return null;
    }

    return getBoardCollection(
        state.geneoActiveCollectionId
    );
}

function geneographLibraryContext()
{
    const activeCollection =
        activeGeneographCollection();

    if (activeCollection)
    {
        return {
            title:
            activeCollection.name,

            icon:
            icon.folder,

            description:
            activeCollection
                .description
            || '',

            emptyMessage:
            'No boards in this collection yet.'
        };
    }

    const contexts = {
        all: {
            title:
            'All boards',

            icon:
            icon.whiteboard,

            description:
            '',

            emptyMessage:
            'No boards yet.'
        },

        favorites: {
            title:
            'Favourites',

            icon:
            icon.star,

            description:
            '',

            emptyMessage:
            'No favourite boards yet.'
        },

        unassigned: {
            title:
            'Not in collection',

            icon:
            icon.folder,

            description:
            'Boards waiting to be organized.',

            emptyMessage:
            'Every active board belongs to a collection.'
        },

        archived: {
            title:
            'Archived',

            icon:
            icon.archive,

            description:
            'Boards kept outside your active Geneograph workspace.',

            emptyMessage:
            'No archived boards. Archived boards will appear here.'
        },

        collection: {
            title:
            'Collection',

            icon:
            icon.folder,

            description:
            '',

            emptyMessage:
            'No boards in this collection yet.'
        }
    };

    return (
        contexts[
            state.geneoLibraryView
        ]
        || contexts.all
    );
}

function geneographBoardSearchText(
    board
)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        )
            .map(collection =>
                `
              ${collection.name || ''}
              ${collection.description || ''}
            `
            )
            .join(' ');

    return `
        ${board.title || ''}
        ${board.description || ''}
        ${collections}
      `
        .trim()
        .toLowerCase();
}

function geneographBoardModifiedTime(
    board
)
{
    if (
        board.modified
          === 'Just now'
    )
    {
        return Number
            .POSITIVE_INFINITY;
    }

    const timestamp =
        Date.parse(
            board.modified || ''
        );

    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;
}

function renderGeneographHome()
{
    cancelGeneographPencilStroke();
    const filtered =
        filteredGeneographBoards();

    const libraryContext =
        geneographLibraryContext();

    const sectionTitle =
        libraryContext.title;

    const sectionIcon =
        libraryContext.icon;

    const sectionDescription =
        libraryContext.description;

    sidebar.innerHTML = `
        <nav
          class="
            geneo-sidebar
          "
          aria-label="Geneograph navigation">

          <div data-geneo-tour-target="library-navigation">
            <div
              class="
                side-section-title
              ">

              Navigation
            </div>

            <div class="side-nav">
              ${renderGeneoAllBoardsNavigationButton()}

              ${renderGeneoLibraryViewButton(
                    'favorites',
                    'Favourites',
                    icon.star
                )}
              ${renderGeneoLibraryViewButton(
                    'unassigned',
                    'Not in collection',
                    icon.folder
                )}

              ${renderGeneoLibraryViewButton(
                    'archived',
                    'Archived',
                    icon.archive
                )}
            </div>
          </div>

          <div data-geneo-tour-target="library-collections">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>
                Collections
              </span>

              <button
                class="
                  side-add-button
                "
                type="button"
                data-geneo-add-collection
                aria-label="Create collection"
                title="Create collection">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${renderGeneographCollectionSidebarRows()}
            </div>
          </div>

          <div
            class="
              geneo-sidebar-tip
            ">

            <div class="tip-card">
              <div class="tip-title">
                ${icon.tip}
                Tip of the day
              </div>

              <p>
                Use Geneograph boards to collect
                hypotheses before adding relationships
                to the structured Family Tree.
              </p>

              <button
                class="
                  link
                  tip-link
                "
                type="button"
                data-toast="
                  Geneograph learning center
                  will be added later.
                ">

                <span
                  class="
                    tip-link-text
                  ">

                  Learn more
                </span>

                <span
                  class="
                    tip-link-icon
                  "
                  aria-hidden="true">

                  ${icon.openlink}
                </span>
              </button>
            </div>
          </div>
        </nav>
      `;

    main.innerHTML = `
        <section
          class="
            geneo-home-page
          ">

          ${renderArchivePageHead({
                title:
              'Geneograph Visual Boards',

                subtitle:
              'Your personal space for research, visualizations and publications.',

                actions: `
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-import
                disabled
                aria-label="${escapeHtml(t('Import board'))}">

                ${icon.import}
                <span>${escapeHtml(t('Import board'))}</span>
              </button>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-create>

                ${icon.plus}
                New board
              </button>
            `
            })}

          <div
            class="
              geneo-board-toolbar
            ">

            <div
              class="
                geneo-board-toolbar-left
              ">

              <label
                class="
                  app-search-field
                "
                aria-label="Search boards">

                ${icon.search}

                <input
                  id="geneoBoardSearch"
                  type="search"
                  placeholder="Search boards..."
                  value="${escapeHtml(
                        state.geneoBoardSearch
                    )}">
              </label>
            </div>

            <div
              class="
                geneo-board-toolbar-right
              ">
              ${renderAppSortControl({
                    id: 'geneoBoardSort',
                    field: state.geneoBoardSort,
                    direction: state.geneoBoardSortDirection,
                    ariaLabel: 'Sort boards',
                    options: APP_SORT_OPTIONS.geneograph
                })}
              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'grid'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="grid"
                aria-label="Grid view">

                ${icon.grid}
              </button>

              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'list'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="list"
                aria-label="List view">

                ${icon.list}
              </button>
            </div>
          </div>

          <div
            class="
              geneo-board-section
            ">

            <h2
              class="
                section-heading
              ">

              ${sectionIcon}

              ${escapeHtml(
                    sectionTitle
                )}

              (${filtered.length})
            </h2>

            ${
                sectionDescription
                    ? `
                  <p
                    class="
                      geneo-board-section-description
                    ">

                    ${escapeHtml(
                        sectionDescription
                    )}
                  </p>
                `
                    : ''
            }

            ${renderGeneographBoardCollection(
                filtered
            )}
          </div>
        </section>
      `;

    bindGeneographHome();
}

function renderGeneoLibraryViewButton(
    view,
    label,
    iconHtml
)
{
    const active =
        state.geneoLibraryView
          === view;

    return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-geneo-library-view="${escapeHtml(
                view
            )}">

          ${iconHtml}

          <span>
            ${escapeHtml(
                label
            )}
          </span>
        </button>
      `;
}

function renderGeneoAllBoardsNavigationButton({ editor = false } = {})
{
    const active = !editor && state.geneoLibraryView === 'all';
    return `
        <button
          class="side-link ${active ? 'active' : ''}"
          type="button"
          ${editor ? 'data-geneo-all-boards' : 'data-geneo-library-view="all"'}>
          ${icon.whiteboard}
          <span>All Boards</span>
        </button>
      `;
}

function renderGeneographCollectionSidebarRows()
{
    const collections =
        getProjectBoardCollections();

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-collection-sidebar-empty
            ">

            ${escapeHtml(t('No collections yet'))}
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const active =
                state.geneoLibraryView
              === 'collection'
            && state
                .geneoActiveCollectionId
              === collection.id;

            return `
            <div
              class="
                sidebar-entity-row
                ${active ? 'active' : ''}
              ">

              <button
                class="
                  sidebar-entity-main
                "
                type="button"
                data-geneo-collection="${escapeHtml(
                    collection.id
                )}"
                title="${escapeHtml(
                    collection.name
                )}">

                ${icon.folder}

                <span
                  class="
                    sidebar-entity-name
                  ">

                  ${escapeHtml(
                        collection.name
                    )}
                </span>
              </button>

              <button
                class="
                  more-button
                  sidebar-entity-more
                "
                type="button"
                data-geneo-collection-menu="${escapeHtml(
                    collection.id
                )}"
                aria-label="Actions for ${escapeHtml(
                    collection.name
                )}"
                aria-haspopup="menu">

                ${icon.more}
              </button>
            </div>
          `;
        })
        .join('');
}

function filteredGeneographBoards()
{
    const projectId =
        currentProjectId();

    const query =
        state.geneoBoardSearch
            .trim()
            .toLowerCase();

    let list;

    if (
        state.geneoLibraryView
          === 'archived'
    )
    {
        list =
            getProjectBoards(
                projectId,
                {
                    includeArchived:
                true
                }
            ).filter(board =>
                board.archived
            );
    }
    else if (
        state.geneoLibraryView
          === 'collection'
    )
    {
        const collection =
            activeGeneographCollection();

        list =
            collection
                ? getBoardsForCollection(
                    collection.id,
                    {
                        projectId
                    }
                )
                : [];
    }
    else
    {
        list =
            getProjectBoards(
                projectId
            );

        if (
            state.geneoLibraryView
            === 'favorites'
        )
        {
            list =
                list.filter(board =>
                    board.favorite
                );
        }

        if (
            state.geneoLibraryView
            === 'unassigned'
        )
        {
            list =
                list.filter(board =>
                    !(
                        board.collectionIds
                || []
                    ).length
                );
        }
    }

    if (query)
    {
        list =
            list.filter(board =>
                geneographBoardSearchText(
                    board
                ).includes(
                    query
                )
            );
    }
    return appSortRecords(list, {
        field:
          state.geneoBoardSort,

        direction:
          state.geneoBoardSortDirection,

        extractors: {
            name: {
                type: 'text',
                get: board =>
                    board.title
            },

            updated: {
                type: 'number',
                get:
              geneographBoardModifiedTime
            },

            created: {
                type: 'number',
                get: board =>
                    appSortTimestamp(
                        board.createdAt
                    )
            }
        },

        getFallback:
          board => board.title
    });
}

function renderGeneographNewBoardTile()
{
    return `
        <button
          class="
            geneo-board-action-tile
          "
          type="button"
          data-geneo-create
          aria-label="Create a new Geneograph board">

          <span
            class="
              geneo-board-action-tile-icon
            "
            aria-hidden="true">

            ${icon.plus}
          </span>

          <span
            class="
              geneo-board-action-copy
            ">

            <strong>
              New board
            </strong>

            <span>
              Create a visual workspace for
              research, evidence, tree design,
              or publication.
            </span>
          </span>
        </button>
      `;
}

function renderGeneographBoardEmptyState()
{
    const query =
        state.geneoBoardSearch
            .trim();

    const context =
        geneographLibraryContext();

    const message =
        query
            ? 'No boards match this search.'
            : context.emptyMessage;

    return `
        <div class="panel">
          <div
            class="
              panel-body
              geneo-board-empty
            ">

            ${escapeHtml(
                message
            )}
          </div>
        </div>
      `;
}

function renderGeneographBoardCollection(
    list
)
{
    const viewClass =
        state.geneoBoardViewMode
          === 'list'
            ? 'geneo-board-list'
            : 'geneo-board-grid';

    const showNewBoardTile =
        !state.geneoBoardSearch
            .trim()
        && [
            'all',
            'collection',
            'unassigned'
        ].includes(
            state.geneoLibraryView
        );

    if (
        !list.length
        && !showNewBoardTile
    )
    {
        return renderGeneographBoardEmptyState();
    }

    return `
        <div
          class="${viewClass}">

          ${list
                .map(
                    renderGeneographBoardCard
                )
                .join('')}

          ${
                showNewBoardTile
                    ? renderGeneographNewBoardTile()
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCollectionChips(
    board,
    limit = 2
)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        );

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-board-collections
            ">

            <span
              class="
                geneo-board-collection-chip
                no-collection
              "
              title="No collection assigned">

              No collection
            </span>
          </div>
        `;
    }

    const visible =
        collections.slice(
            0,
            limit
        );

    const hiddenCount =
        collections.length
        - visible.length;

    return `
        <div
          class="
            geneo-board-collections
          ">

          ${visible
                .map(collection => `
              <span
                class="
                  geneo-board-collection-chip
                "
                title="
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
                ">
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
              </span>
            `)
                .join('')}

          ${
                hiddenCount > 0
                    ? `
                <span
                  class="
                    geneo-board-collection-chip
                    count
                  "
                  title="${hiddenCount} more collections">

                  +${hiddenCount}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCard(
    board
)
{
    const stats =
        geneographBoardStats(
            board
        );

    const favouriteLabel =
        board.favorite
            ? `Remove ${board.title} from favourites`
            : `Add ${board.title} to favourites`;

    return `
        <article
          class="
            geneo-board-card
          "
          tabindex="0"
          role="button"
          data-geneo-board-id="${escapeHtml(
                board.id
            )}"
          aria-label="Open ${escapeHtml(
                board.title
            )}">

          <div
            class="
              geneo-thumb
              ${
                    board.thumb === 'map'
                        ? 'map'
                        : ''
                }
            "
            aria-hidden="true">
          </div>

          <div
            class="
              geneo-board-body
            ">
          <h3>
            ${escapeHtml(
                board.title
            )}
          </h3>

          <div
            class="
              geneo-board-meta
            ">

            <span
              class="
                geneo-board-meta-item
              "
              title="${escapeHtml(
                    `${stats.people} people`
                )}"
              aria-label="${escapeHtml(
                    `${stats.people} people`
                )}">

              ${icon.peoplegroup}

              <span
                class="
                  geneo-board-meta-value
                "
                aria-hidden="true">

                ${stats.people}
              </span>

              <span
                class="
                  geneo-board-meta-label
                "
                aria-hidden="true">

                people
              </span>
            </span>

            <span
              class="
                geneo-board-meta-item
              "
              title="${escapeHtml(
                    `${stats.items} items`
                )}"
              aria-label="${escapeHtml(
                    `${stats.items} items`
                )}">

              ${icon.file}

              <span
                class="
                  geneo-board-meta-value
                "
                aria-hidden="true">

                ${stats.items}
              </span>

              <span
                class="
                  geneo-board-meta-label
                "
                aria-hidden="true">

                items
              </span>
            </span>

            <span
              class="
                geneo-board-meta-item
              "
              title="${escapeHtml(
                    `${stats.connections} connections`
                )}"
              aria-label="${escapeHtml(
                    `${stats.connections} connections`
                )}">

                ${icon.link}

              <span
                class="
                  geneo-board-meta-value
                "
                aria-hidden="true">

                ${stats.connections}
              </span>

              <span
                class="
                  geneo-board-meta-label
                "
                aria-hidden="true">

                connections
              </span>
            </span>
          </div>

          ${renderGeneographBoardCollectionChips(
                board
            )}

            <div
              class="
                geneo-board-modified
              ">

              ${escapeHtml(
                    formatProjectModified(
                        board
                    )
                )}
            </div>
          </div>

          <div
            class="
              geneo-board-footer
            ">

            <button
              class="
                small-open
              "
              type="button"
              data-geneo-open-board="${escapeHtml(
                    board.id
                )}">

              Open
            </button>

            <div
              class="
                geneo-board-footer-actions
              ">

              <button
                class="
                  geneo-star
                  ${
                        board.favorite
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-fav="${escapeHtml(
                    board.id
                )}"
                aria-label="${escapeHtml(
                    favouriteLabel
                )}"
                aria-pressed="${
                    board.favorite
                        ? 'true'
                        : 'false'
                }">

                ${icon.star}
              </button>

              <button
                class="
                  geneo-more
                "
                type="button"
                data-geneo-board-menu="${escapeHtml(
                    board.id
                )}"
                aria-label="More actions"
                aria-haspopup="menu"
                aria-expanded="false">

                ${icon.more}
              </button>
            </div>
          </div>
        </article>
      `;
}

let geneographBoardMetaResizeObserver =
    null;

function updateGeneographBoardMetaMode(
    meta
)
{
    if (
        !meta
        || !meta.isConnected
    )
    {
        return;
    }

    /*
        Measure the natural expanded version
        before deciding whether compact mode
        is required.
      */
    meta.classList.remove(
        'is-compact'
    );

    const needsCompact =
        meta.scrollWidth
          > meta.clientWidth + 1;

    meta.classList.toggle(
        'is-compact',
        needsCompact
    );
}

function bindGeneographBoardMetaModes()
{
    geneographBoardMetaResizeObserver
        ?.disconnect();

    geneographBoardMetaResizeObserver =
        null;

    const metadataRows = [
        ...main.querySelectorAll(
            '.geneo-board-meta'
        )
    ];

    metadataRows.forEach(
        updateGeneographBoardMetaMode
    );

    if (
        !metadataRows.length
    )
    {
        return;
    }

    geneographBoardMetaResizeObserver =
        new ResizeObserver(
            entries =>
            {
                entries.forEach(
                    entry =>
                    {
                        updateGeneographBoardMetaMode(
                            entry.target
                        );
                    }
                );
            }
        );

    metadataRows.forEach(
        meta =>
        {
            geneographBoardMetaResizeObserver
                .observe(
                    meta
                );
        }
    );
}

function geneographCanvasCountLabel(count)
{
    if (state.language !== 'ru')
    {
        return `${count} ${count === 1 ? 'canvas' : 'canvases'}`;
    }

    const form = new Intl.PluralRules('ru').select(count);
    const noun = {
        one: 'холст',
        few: 'холста',
        many: 'холстов',
        other: 'холста'
    }[form];

    return `${count} ${noun}`;
}

function renderGeneographCollectionChoiceRows(
    projectId,
    selectedCollectionIds,
    query = ''
)
{
    const normalizedQuery =
        String(
            query || ''
        )
            .trim()
            .toLowerCase();

    const collections =
        getProjectBoardCollections(
            projectId
        )
            .filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });

    if (!collections.length)
    {
        if (normalizedQuery)
        {
            return `
            <div
              class="
                album-picker-empty
              ">

              <div
                class="
                  album-picker-empty-card
                ">

                <strong>
                  No collections match this search
                </strong>

                <p>
                  Try another collection name
                  or description.
                </p>

                <button
                  class="
                    button
                    secondary
                  "
                  type="button"
                  data-geneo-collection-clear-search>

                  Clear search
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div
            class="
              album-picker-empty
            ">

            <div
              class="
                album-picker-empty-card
              ">

              <strong>
                No collections yet
              </strong>

              <p>
                Create a collection to organize
                this board.
              </p>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-toggle>

                Create collection
              </button>
            </div>
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const selected =
                selectedCollectionIds.has(
                    collection.id
                );

            const boardCount =
                getBoardsForCollection(
                    collection.id,
                    {
                        projectId
                    }
                ).length;

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
              "
              data-geneo-collection-row="${escapeHtml(
                    collection.id
                )}">

              <span
                class="
                  album-picker-cover
                "
                aria-hidden="true">

                ${icon.folder}
              </span>

              <span
                class="
                  album-picker-copy
                ">

                <strong>
                  ${escapeHtml(
                        localizedDataFieldValue(collection.name)
                    || translateText('Untitled collection')
                    )}
                </strong>

                <span
                  class="
                    album-picker-description
                  ">
                  ${escapeHtml(
                        localizedDataFieldValue(collection.description)
                    || translateText('No description')
                    )}
                </span>

                <span
                  class="
                    album-picker-meta
                  ">
                  ${escapeHtml(geneographCanvasCountLabel(boardCount))}
                </span>
              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    collection.id
                )}"
                data-geneo-collection-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                aria-label="${escapeHtml(
                    `${
                        selected
                            ? 'Remove'
                            : 'Add'
                    } ${
                        collection.name
                    }`
                )}">
            </label>
          `;
        })
        .join('');
}

function renderGeneographCollectionChooser({
    projectId =
        currentProjectId(),

    selectedCollectionIds =
        new Set()
} = {})
{
    const collections =
        getProjectBoardCollections(
            projectId
        );

    return `
        <section
          class="
            geneo-collection-chooser
          "
          aria-labelledby="geneoCollectionChooserLabel">

          <div
            class="
              geneo-collection-chooser-head
            ">

            <label
              id="geneoCollectionChooserLabel">

              Collections
            </label>

            <span>
              Optional
            </span>
          </div>

          <div
            class="
              album-picker-browse
              geneo-collection-browse
            "
            data-geneo-collection-browse>

            <div
              class="
                field
                photo-people-search-field
                album-picker-search
              ">

              <label
                for="geneoCollectionSearch">

                Find collections
              </label>

              <div
                class="
                  search-input
                ">

                ${icon.search}

                <input
                  id="geneoCollectionSearch"
                  type="search"
                  data-geneo-collection-search
                  placeholder="Search collections"
                  autocomplete="off">
              </div>
            </div>

            <section
              class="
                album-picker-results-panel
              ">

              <div
                class="
                  album-picker-results-head
                ">

                <div
                  class="
                    album-picker-results-heading
                  ">

                  <strong
                    data-geneo-collection-results-title>

                    All collections
                  </strong>

                  <span
                    data-geneo-collection-results-meta>

                    ${collections.length}
                    ${
                        collections.length === 1
                            ? 'collection'
                            : 'collections'
                    }
                  </span>
                </div>

                <button
                  class="
                    button
                    secondary
                    compact
                    album-picker-new-button
                  "
                  type="button"
                  data-geneo-inline-collection-toggle>

                  ${icon.plus}
                  New collection
                </button>
              </div>

              <div
                class="
                  photo-people-results
                  album-picker-results
                  geneo-collection-results
                "
                data-geneo-collection-choice-list>

                ${renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds
                )}
              </div>
            </section>
          </div>

          <div
            class="
              album-picker-create
              geneo-collection-create-panel
            "
            data-geneo-inline-collection-panel
            hidden>

            <div
              class="
                album-picker-create-copy
              ">

              <strong>
                Create a new collection
              </strong>

              <span>
                The new collection will be
                selected automatically.
              </span>
            </div>

            <div
              class="
                album-picker-create-fields
              ">

              <div class="field">
                <label
                  for="geneoInlineCollectionName">

                  Collection name
                </label>

                <input
                  id="geneoInlineCollectionName"
                  type="text"
                  maxlength="120"
                  data-geneo-inline-collection-name
                  autocomplete="off"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="geneoInlineCollectionDescription">

                  Description
                </label>

                <textarea
                  id="geneoInlineCollectionDescription"
                  rows="3"
                  maxlength="500"
                  data-geneo-inline-collection-description
                  placeholder="Optional description"></textarea>
              </div>
            </div>

            <div
              class="
                geneo-inline-collection-actions
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-inline-collection-cancel>

                Back
              </button>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-create>

                Create and select
              </button>
            </div>
          </div>
        </section>
      `;
}

function bindGeneographCollectionChooser(
    root,
    {
        projectId =
            currentProjectId(),

        selectedCollectionIds
    }
)
{
    if (
        !root
        || !selectedCollectionIds
    )
    {
        return;
    }

    let query =
        '';

    const browsePanel =
        root.querySelector(
            '[data-geneo-collection-browse]'
        );

    const createPanel =
        root.querySelector(
            '[data-geneo-inline-collection-panel]'
        );

    const resultsHost =
        root.querySelector(
            '[data-geneo-collection-choice-list]'
        );

    const resultsTitle =
        root.querySelector(
            '[data-geneo-collection-results-title]'
        );

    const resultsMeta =
        root.querySelector(
            '[data-geneo-collection-results-meta]'
        );

    const searchInput =
        root.querySelector(
            '[data-geneo-collection-search]'
        );

    const nameInput =
        root.querySelector(
            '[data-geneo-inline-collection-name]'
        );

    const descriptionInput =
        root.querySelector(
            '[data-geneo-inline-collection-description]'
        );

    const visibleCollections =
        () =>
        {
            const normalizedQuery =
                query
                    .trim()
                    .toLowerCase();

            return getProjectBoardCollections(
                projectId
            ).filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });
        };

    const updateResultsMeta = () =>
    {
        const count = visibleCollections().length;
        const selected = selectedCollectionIds.size;

        if (resultsTitle)
        {
            resultsTitle.textContent = translateText(
                query.trim() ? 'Search results' : 'All collections'
            );
        }

        if (resultsMeta)
        {
            resultsMeta.textContent = state.language === 'ru'
                ? `Коллекций: ${count} · Выбрано: ${selected}`
                : `${count} ${
                    count === 1 ? 'collection' : 'collections'
                } · ${selected} selected`;
        }
    };

    const renderResults =
        () =>
        {
            if (!resultsHost)
            {
                return;
            }

            resultsHost.innerHTML =
                renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds,
                    query
                );

            localizeUI(resultsHost);
            updateResultsMeta();
        };

    const showBrowse =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    false;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    true;
            }
        };

    const showCreate =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    true;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    false;
            }

            requestAnimationFrame(
                () =>
                    nameInput?.focus()
            );
        };

    searchInput
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget
                        .value;

                renderResults();
            }
        );

    root.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-geneo-collection-choice]'
                );

            if (!checkbox)
            {
                return;
            }

            const collectionId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedCollectionIds.add(
                    collectionId
                );
            }
            else
            {
                selectedCollectionIds.delete(
                    collectionId
                );
            }

            checkbox
                .closest(
                    '[data-geneo-collection-row]'
                )
                ?.classList.toggle(
                    'is-selected',
                    checkbox.checked
                );

            updateResultsMeta();
        }
    );

    root.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-geneo-inline-collection-toggle]'
                )
            )
            {
                event.preventDefault();

                showCreate();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-inline-collection-cancel]'
                )
            )
            {
                event.preventDefault();

                showBrowse();

                searchInput?.focus();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-collection-clear-search]'
                )
            )
            {
                event.preventDefault();

                query =
                    '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                renderResults();

                searchInput?.focus();

                return;
            }

            if (
                !event.target.closest(
                    '[data-geneo-inline-collection-create]'
                )
            )
            {
                return;
            }

            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description,
                    projectId
                });

            if (!collection)
            {
                return;
            }

            selectedCollectionIds.add(
                collection.id
            );

            if (nameInput)
            {
                nameInput.value =
                    '';
            }

            if (descriptionInput)
            {
                descriptionInput.value =
                    '';
            }

            query =
                '';

            if (searchInput)
            {
                searchInput.value =
                    '';
            }

            showBrowse();

            renderResults();

            requestAnimationFrame(
                () =>
                {
                    root
                        .querySelector(
                            `[data-geneo-collection-row="${
                                CSS.escape(
                                    collection.id
                                )
                            }"]`
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });
                }
            );

            showToast(
                'Collection created.'
            );
        }
    );

    renderResults();
}

function renderGeneographCollectionModal({
    titleId,
    title,
    intro,
    formId,
    nameId,
    descriptionId,
    name = '',
    description = '',
    submitLabel
})
{
    return `
        <div
          class="
            modal
            geneo-collection-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="${escapeHtml(
                titleId
            )}">

          <div class="modal-header">
            <div>
              <h2
                id="${escapeHtml(
                    titleId
                )}">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    intro
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            class="
              geneo-collection-form
            "
            id="${escapeHtml(
                formId
            )}">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="${escapeHtml(
                        nameId
                    )}">

                  Collection name
                </label>

                <input
                  id="${escapeHtml(
                        nameId
                    )}"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="off"
                  value="${escapeHtml(
                        name
                    )}"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="${escapeHtml(
                        descriptionId
                    )}">

                  Description
                </label>

                <textarea
                  id="${escapeHtml(
                        descriptionId
                    )}"
                  rows="4"
                  maxlength="500"
                  placeholder="Optional description">${escapeHtml(
                        description
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openNewGeneographCollectionModal()
{
    openModal(
        renderGeneographCollectionModal({
            titleId:
            'newGeneographCollectionTitle',

            title:
            'Create collection',

            intro:
            'Collections keep related boards together.',

            formId:
            'geneographCollectionForm',

            nameId:
            'geneographCollectionName',

            descriptionId:
            'geneographCollectionDescription',

            submitLabel:
            'Create collection'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description
                });

            if (!collection)
            {
                return;
            }

            state.geneoLibraryView =
                'collection';

            state.geneoActiveCollectionId =
                collection.id;

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection created.'
            );
        }
    );

    requestAnimationFrame(
        () =>
            nameInput?.focus()
    );
}

function openEditGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    openModal(
        renderGeneographCollectionModal({
            titleId:
            'editGeneographCollectionTitle',

            title:
            'Edit collection',

            intro:
            'Update the collection name and description. Boards stay in this collection.',

            formId:
            'geneographEditCollectionForm',

            nameId:
            'geneographEditCollectionName',

            descriptionId:
            'geneographEditCollectionDescription',

            name:
            collection.name,

            description:
            collection.description,

            submitLabel:
            'Save changes'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographEditCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            collection.name =
                name;

            collection.description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection updated.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();
            nameInput?.select();
        }
    );
}

function openDeleteGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const affectedBoards =
        getBoardsForCollection(
            collection.id,
            {
                projectId:
              collection.projectId,

                includeArchived:
              true
            }
        );
    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить коллекцию?'
        : 'Delete collection?';

    const description = ru
        ? 'Коллекция будет удалена. Холсты и их связи с другими коллекциями сохранятся.'
        : 'The collection will be deleted. Its canvases and their links to other collections will remain.';

    const impact = ru
        ? 'Будет удалена только связь с этой коллекцией. Данные холстов сохранятся.'
        : 'Only membership in this collection will be removed. Canvas data will remain unchanged.';

    const collectionLabel =
        localizedDataFieldValue(collection.name)
        || (ru ? 'Коллекция без названия' : 'Untitled collection');

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographCollectionTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographCollectionTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(description)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="notes-evidence-card">
              <strong>${escapeHtml(collectionLabel)}</strong>
              <p>
                ${escapeHtml(
                    geneographCanvasCountLabel(affectedBoards.length)
                )}
              </p>
              <p>${escapeHtml(impact)}</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              id="geneographConfirmDeleteCollection">
              ${ru ? 'Удалить коллекцию' : 'Delete collection'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#geneographConfirmDeleteCollection'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                affectedBoards.forEach(
                    board =>
                    {
                        removeBoardFromCollection(
                            board.id,
                            collection.id,
                            {
                                projectId:
                      collection.projectId,

                                touchModified:
                      false
                            }
                        );
                    }
                );

                const index =
                    sampleData
                        .boardCollections
                        .findIndex(item =>
                            item.id
                    === collection.id
                        );

                if (index >= 0)
                {
                    sampleData
                        .boardCollections
                        .splice(
                            index,
                            1
                        );
                }

                if (
                    state.geneoActiveCollectionId
                === collection.id
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Collection deleted. Boards kept.'
                );
            }
        );
}

function openGeneographCollectionMenu(
    collectionId,
    anchor
)
{
    closeMenu();

    const collection =
        getBoardCollection(
            collectionId
        );

    if (
        !collection
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
                'div'
            );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 200
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">

          Edit collection
        </button>

        <button
          type="button"
          data-action="delete"
          class="danger">

          Delete collection
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographCollectionModal(
                    collection.id
                );

                return;
            }

            if (
                action === 'delete'
            )
            {
                openDeleteGeneographCollectionModal(
                    collection.id
                );
            }
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function bindGeneographHome()
{
    bindGeneographBoardMetaModes();
    main
        .querySelectorAll(
            '[data-geneo-create]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                openCreateGeneographBoardModal
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-library-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        button.dataset
                            .geneoLibraryView;

                    state.geneoActiveCollectionId =
                        null;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        'collection';

                    state.geneoActiveCollectionId =
                        button.dataset
                            .geneoCollection;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelector(
            '[data-geneo-add-collection]'
        )
        ?.addEventListener(
            'click',
            openNewGeneographCollectionModal
        );

    sidebar
        .querySelectorAll(
            '[data-geneo-collection-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographCollectionMenu(
                        button.dataset
                            .geneoCollectionMenu,
                        button
                    );
                }
            );
        });

    bindSearchInput(
        main,
        '#geneoBoardSearch',
        'geneoBoardSearch',
        renderGeneographHome
    );
    bindAppSortControl(main, {
        id: 'geneoBoardSort',
        options:
          APP_SORT_OPTIONS.geneograph,
        getField: () =>
            state.geneoBoardSort,
        getDirection: () =>
            state.geneoBoardSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.geneoBoardSort = field;
            state.geneoBoardSortDirection =
                direction;

            renderGeneographHome();
        }
    });
    main
        .querySelectorAll(
            '[data-geneo-board-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoBoardViewMode =
                        button.dataset
                            .geneoBoardView;

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-open-board]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoard(
                        button.dataset
                            .geneoOpenBoard
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-board-id]'
        )
        .forEach(card =>
        {
            card.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            'button'
                        )
                    )
                    {
                        return;
                    }

                    openGeneographBoard(
                        card.dataset
                            .geneoBoardId
                    );
                }
            );

            card.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target
                  !== card
                    )
                    {
                        return;
                    }

                    if (
                        event.key
                  !== 'Enter'
                && event.key
                  !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    openGeneographBoard(
                        card.dataset
                            .geneoBoardId
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-fav]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const board =
                        getGeneographBoard(
                            button.dataset
                                .geneoFav
                        );

                    if (board)
                    {
                        board.favorite =
                            !board.favorite;

                        touchGeneographBoard(
                            board
                        );
                    }

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-board-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoardMenu(
                        button.dataset
                            .geneoBoardMenu,
                        button
                    );
                }
            );
        });

    bindToasts(
        sidebar
    );
}

function openGeneographBoard(id)
{
    cancelGeneographPencilStroke();
    const previousBoard = selectedGeneographBoard();
    if (state.geneoView === 'board' && previousBoard?.id && previousBoard.id !== id) captureGeneographViewport(previousBoard.id);
    const savedViewport = geneoSavedViewport(id);
    state.selectedGeneoBoardId = id;
    state.geneoView = 'board';
    state.selectedGeneoNodeId = null;
    state.selectedGeneoNodeIds = [];
    state.selectedGeneoConnectionId = null;
    state.selectedGeneoConnectionIds = [];
    state.selectedGeneoWaypointIndex = null;
    cancelGeneographConnectionDraft();
    state.geneoTool = 'pan';
    state.geneoZoom = savedViewport?.zoom || 83;
    state.geneoInlineEditNodeId = null;
    state.geneoLayerRename = null;
    geneoCanvasRuntime = createGeneoCanvasRuntime(id);
    geneoHistoryRuntime = {
        boardId: id,
        undo: [],
        redo: []
    };
    render();
}

function deleteGeneographBoard(
    boardId,
    projectId = currentProjectId()
)
{
    // Recheck the project and record when confirmation is submitted.
    if (projectId !== currentProjectId()) return false;

    const board = getGeneographBoard(boardId, { projectId });
    if (!board) return false;

    const index = sampleData.boards.findIndex(item =>
        item.id === boardId && item.projectId === projectId
    );

    if (index < 0) return false;

    const ownsEditorState =
        state.selectedGeneoBoardId === boardId
        || geneoCanvasRuntime.boardId === boardId;

    if (ownsEditorState)
    {
        // Cancel pending editor interactions before removing the canvas.
        cancelGeneographPencilStroke();
        cancelGeneographConnectionDraft();
        geneoPointerState = null;

        state.selectedGeneoBoardId = null;
        state.selectedGeneoNodeId = null;
        state.selectedGeneoNodeIds = [];
        state.selectedGeneoConnectionId = null;
        state.selectedGeneoConnectionIds = [];
        state.selectedGeneoWaypointIndex = null;
        state.geneoInlineEditNodeId = null;
        state.geneoLayerRename = null;
        state.geneoTool = 'pan';

        geneoCanvasRuntime = createGeneoCanvasRuntime(null);
        geneoPaintRuntime = createGeneoPaintRuntime();
    }

    if (
        ownsEditorState
        || geneoHistoryRuntime.boardId === boardId
    )
    {
        geneoHistoryRuntime = {
            boardId: null,
            undo: [],
            redo: []
        };
    }

    clearGeneographViewport(boardId);

    // Remove the canvas container, not the records it references.
    sampleData.boards.splice(index, 1);

    return true;
}

function openDeleteGeneographBoardConfirm(boardId)
{
    const projectId = currentProjectId();
    const board = getGeneographBoard(boardId, { projectId });

    if (!board) return;

    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить холст?'
        : 'Delete canvas?';

    const boardTitle =
        localizedDataFieldValue(board.title)
        || (ru ? 'Холст без названия' : 'Untitled canvas');

    const explanation = ru
        ? 'Холст, его расположение объектов и содержимое, созданное только на этом холсте, будут удалены. Связанные записи проекта и другие холсты сохранятся.'
        : 'This canvas, its object layout, and content created only on this canvas will be deleted. Linked project records and other canvases will remain.';

    const warning = ru
        ? 'Это действие невозможно отменить.'
        : 'This action cannot be undone.';

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographBoardTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographBoardTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(boardTitle)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>${escapeHtml(explanation)}</p>
            <p><strong>${escapeHtml(warning)}</strong></p>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-geneo-board-delete>
              ${ru ? 'Удалить холст' : 'Delete canvas'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector('[data-confirm-geneo-board-delete]')
        ?.addEventListener('click', event =>
        {
            const button = event.currentTarget;
            button.disabled = true;

            const deleted = deleteGeneographBoard(
                boardId,
                projectId
            );

            closeModal();

            if (!deleted)
            {
                showToast(
                    ru
                        ? 'Холст недоступен. Обновите список и повторите попытку.'
                        : 'The canvas is unavailable. Refresh the list and try again.'
                );
                return;
            }

            // Keep the current collection/filter context.
            // Empty collections remain available.
            state.geneoView = 'home';
            renderGeneographHome();

            showToast(
                ru ? 'Холст удалён.' : 'Canvas deleted.'
            );
        }, { once: true });
}

function openGeneographBoardMenu(
    id,
    anchor
)
{
    closeMenu();

    const board =
        getGeneographBoard(
            id
        );

    if (
        !board
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
                'div'
            );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 190
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">

          Edit
        </button>

        <button
          type="button"
          data-action="duplicate">

          Duplicate
        </button>

        <button
          type="button"
          data-action="archive">

          ${
                board.archived
                    ? 'Unarchive'
                    : 'Archive'
            }
        </button>

        <button
          type="button"
          class="danger"
          data-action="delete">

          Delete
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographBoardModal(
                    board.id
                );

                return;
            }

            if (
                action === 'archive'
            )
            {
                const nextArchived =
                    !board.archived;

                const updatedBoard =
                    setGeneographBoardArchived(
                        board.id,
                        nextArchived,
                        {
                            projectId:
                    board.projectId
                        }
                    );

                if (!updatedBoard)
                {
                    return;
                }

                state.geneoLibraryView =
                    nextArchived
                        ? 'archived'
                        : 'all';

                state.geneoActiveCollectionId =
                    null;

                renderGeneographHome();

                showToast(
                    nextArchived
                        ? 'Board archived.'
                        : 'Board unarchived.'
                );

                return;
            }
            if (action === 'delete')
            {
                openDeleteGeneographBoardConfirm(board.id);
                return;
            }
            showToast(
                `${
                    capitalize(
                        action
                    )
                } board action simulated.`
            );
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function renderGeneoModeTool(
    type,
    iconSvg,
    label
)
{
    const active =
        state.geneoTool === type;

    const localizedLabel =
        t(label);

    return `
        <button
          class="geneo-tool ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-tool="${escapeHtml(type)}"
          aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
          aria-label="${escapeHtml(localizedLabel)}"
          title="${escapeHtml(localizedLabel)}">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-tool-label">
            ${escapeHtml(localizedLabel)}
          </span>
        </button>
      `;
}

function activateGeneographConnectionTool()
{
    cancelGeneographPencilStroke();
    cancelGeneographConnectionDraft();

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        'connect';

    renderGeneographEditorPreserveScroll();
}

function exportGeneographBoard()
{
    runGeneographPngExport();
}

function renderGeneoToolbarObjectButton(
    type,
    iconSvg,
    label
)
{
    const isPlacementTool =
        [
            'panel',
            'sticky',
            'text'
        ].includes(type);

    const active =
        isPlacementTool
        && state.geneoTool === type;

    const actionAttribute =
        isPlacementTool
            ? `data-geneo-placement-tool="${
                escapeHtml(type)
            }"`
            : `data-geneo-add="${
                escapeHtml(type)
            }"`;

    const actionLabel =
        type === 'panel'
            ? `Draw ${label}`
            : isPlacementTool
                ? `Place ${label}`
                : `Add ${label}`;

    const localizedActionLabel =
        translateText(actionLabel);

    return `
        <button
          class="geneo-toolbar-object ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-toolbar-item="${
                escapeHtml(type)
            }"
          ${actionAttribute}
          ${
                isPlacementTool
                    ? `aria-pressed="${
                        active
                            ? 'true'
                            : 'false'
                    }"`
                    : ''
            }
          title="${
                escapeHtml(localizedActionLabel)
            }"
          aria-label="${
                escapeHtml(localizedActionLabel)
            }">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-toolbar-label">
            ${escapeHtml(t(label))}
          </span>
        </button>
      `;
}

function renderGeneoConnectionSplitTool()
{
    const pattern =
        state.geneoConnectorPattern === 'dashed'
            ? 'dashed'
            : 'solid';

    const styleLabel =
        pattern === 'dashed'
            ? 'Dashed'
            : 'Solid';

    const active =
        state.geneoTool === 'connect';

    const title =
        `${t('Connect')}: ${t(styleLabel)}`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="connection"
          data-geneo-toolbar-item="connect">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-connection-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.link}

            <span>
              ${escapeHtml(t('Connect'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-connection-menu
            aria-label="${
                escapeHtml(
                    t('Choose connection style')
                )
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoConnectionStyleMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    closeMenu();
    const pattern = state.geneoConnectorPattern === 'dashed' ? 'dashed' : 'solid';
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Connection style');
    menu.style.top = `${rect.bottom + 7}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left - 118, window.innerWidth - 192))}px`;
    menu.innerHTML = `<button type="button" role="menuitemradio" aria-checked="${pattern === 'solid'}" data-geneo-connector="solid">${icon.link}<span>Solid</span></button><button type="button" role="menuitemradio" aria-checked="${pattern === 'dashed'}" data-geneo-connector="dashed">${icon.link}<span>Dashed</span></button>`;
    document.body.appendChild(menu);
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-connector]');
        if (!button) return;
        cancelGeneographConnectionDraft();
        state.geneoTool = 'connect';
        state.geneoConnectorPattern = button.dataset.geneoConnector;
        closeMenu();
        renderGeneographEditorPreserveScroll();
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            anchor.focus();
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus());
}

function normalizeGeneographContentKind(
    value
)
{
    return value === 'text'
        ? 'text'
        : 'sticky';
}

function renderGeneoContentSplitTool()
{
    const kind =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const active =
        [
            'sticky',
            'text'
        ].includes(state.geneoTool);

    const actionLabel =
        kind === 'text'
            ? 'Place Text'
            : 'Place Sticky note';

    const selectedIcon =
        kind === 'text'
            ? icon.text
            : icon.note;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="content"
          data-geneo-toolbar-item="content">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-content-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${
                escapeHtml(t(actionLabel))
            }"
            title="${
                escapeHtml(t(actionLabel))
            }">

            ${selectedIcon}

            <span>
              ${escapeHtml(t('Notes & text'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-content-menu
            aria-label="${
                escapeHtml(
                    t('Choose content type')
                )
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoContentMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    closeMenu();

    const selected =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('Choose content type')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.left - 118,
                    window.innerWidth - 210
                )
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'sticky'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="sticky">

          ${icon.note}

          <span>
            ${escapeHtml(t('Sticky note'))}
          </span>
        </button>

        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'text'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="text">

          ${icon.text}

          <span>
            ${escapeHtml(t('Text'))}
          </span>
        </button>
      `;

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-content-kind]'
                );

            if (!button) return;

            const kind =
                normalizeGeneographContentKind(
                    button.dataset
                        .geneoContentKind
                );

            state.geneoContentKind =
                kind;

            closeMenu();

            activateGeneographPlacementTool(
                kind
            );
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitemradio"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus();

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[aria-checked="true"]'
                )
                ?.focus();
        }
    );
}

function renderGeneoShapeSplitTool()
{
    const kind =
        normalizeGeneographShapeKind(
            state.geneoShapeKind
        );

    const selectedShapeLabel =
        geneoShapeLabel(kind);

    const active =
        state.geneoTool === 'shape';

    const title =
        `${t('Shapes')}: ${
            t(selectedShapeLabel)
        }`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="shape"
          data-geneo-toolbar-item="shape">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-shape-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.shape}

            <span>
              ${escapeHtml(t('Shapes'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-shape-menu
            aria-label="${
                escapeHtml(t('Choose shape'))
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoShapeMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    closeMenu();
    const selected = normalizeGeneographShapeKind(state.geneoShapeKind);
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu geneo-shape-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Shape');
    menu.style.top = `${rect.bottom + 7}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left - 118, window.innerWidth - 224))}px`;
    menu.innerHTML = GENEO_SHAPE_KINDS.map(shape => `<button type="button" role="menuitemradio" aria-checked="${selected === shape.id}" data-geneo-shape-kind="${escapeHtml(shape.id)}"><span class="geneo-shape-option-preview shape-${escapeHtml(shape.id)}" aria-hidden="true"></span><span>${escapeHtml(shape.label)}</span></button>`).join('');
    document.body.appendChild(menu);
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-shape-kind]');
        if (!button) return;
        state.geneoShapeKind = normalizeGeneographShapeKind(button.dataset.geneoShapeKind);
        closeMenu();
        activateGeneographPlacementTool('shape');
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            anchor.focus();
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus());
}

function geneoToolbarOverflowItems(
    density
)
{
    const items = [];

    if (density === 'minimal')
    {
        items.push(
            {
                action: 'person',
                label: t('Person'),
                icon: icon.profile
            },
            {
                action: 'connect',
                label: t('Connect'),
                icon: icon.link
            },
            {
                action: 'connection-style',
                label: t('Connection style'),
                icon: icon.link
            }
        );
    }

    items.push(
        {
            action: 'place',
            label: t('Place'),
            icon: icon.mapPin
        },
        {
            action: 'image',
            label: t('Image'),
            icon: icon.image
        },
        {
            action: 'sticky',
            label: t('Sticky note'),
            icon: icon.note
        },
        {
            action: 'text',
            label: t('Text'),
            icon: icon.text
        },
        {
            action: 'panel',
            label: t('Panel'),
            icon: icon.shape
        },
        {
            action: 'export',
            label: t('Export board'),
            icon: icon.export
        }
    );

    return items;
}

function openGeneoToolbarOverflowMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    closeMenu();

    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    const density =
        toolbar?.dataset
            .toolbarDensity
        || 'narrow';

    const items =
        geneoToolbarOverflowItems(
            density
        );

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu geneo-toolbar-overflow-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('More board tools')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.right - 220,
                    window.innerWidth - 232
                )
            )
        }px`;

    menu.innerHTML =
        items
            .map(
                item => `
              <button
                type="button"
                role="menuitem"
                data-geneo-toolbar-action="${
                    escapeHtml(item.action)
                }">

                ${item.icon}

                <span>
                  ${escapeHtml(item.label)}
                </span>
              </button>
            `
            )
            .join('');

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-toolbar-action]'
                );

            if (!button) return;

            const action =
                button.dataset
                    .geneoToolbarAction;

            if (
                action === 'connection-style'
            )
            {
                closeMenu();

                requestAnimationFrame(
                    () =>
                    {
                        openGeneoConnectionStyleMenu(
                            anchor
                        );
                    }
                );

                return;
            }

            closeMenu();

            if (
                [
                    'person',
                    'place',
                    'image'
                ].includes(action)
            )
            {
                addGeneographObject(action);
                return;
            }

            if (
                [
                    'sticky',
                    'text'
                ].includes(action)
            )
            {
                state.geneoContentKind =
                    action;

                activateGeneographPlacementTool(
                    action
                );

                return;
            }

            if (action === 'panel')
            {
                activateGeneographPlacementTool(
                    'panel'
                );

                return;
            }

            if (action === 'connect')
            {
                activateGeneographConnectionTool();
                return;
            }

            if (action === 'export')
            {
                exportGeneographBoard();
            }
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitem"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus();

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[role="menuitem"]'
                )
                ?.focus();
        }
    );
}

function geneoToolbarDensityForWidth(
    width
)
{
    if (width >= 1320)
    {
        return 'expanded';
    }

    if (width >= 1040)
    {
        return 'compact';
    }

    if (width >= 720)
    {
        return 'narrow';
    }

    return 'minimal';
}

function geneoVisibleToolbarButtons(
    toolbar
)
{
    if (!toolbar) return [];

    return [
        ...toolbar.querySelectorAll(
            'button:not(:disabled)'
        )
    ].filter(
        button =>
            button.getClientRects().length > 0
          && getComputedStyle(button)
              .visibility !== 'hidden'
    );
}

function syncGeneoToolbarTabStops(
    toolbar,
    preferredButton = null
)
{
    const buttons =
        geneoVisibleToolbarButtons(
            toolbar
        );

    if (!buttons.length) return;

    const current =
        buttons.includes(preferredButton)
            ? preferredButton
            : buttons.includes(
                document.activeElement
            )
                ? document.activeElement
                : buttons.find(
                    button =>
                        button.tabIndex === 0
                )
              || buttons[0];

    buttons.forEach(
        button =>
        {
            button.tabIndex =
                button === current
                    ? 0
                    : -1;
        }
    );
}

function bindGeneographToolbarDensity()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    geneoToolbarResizeObserver
        ?.disconnect();

    const updateDensity =
        width =>
        {
            const density =
                geneoToolbarDensityForWidth(
                    width
                );

            toolbar.dataset
                .toolbarDensity =
                    density;

            syncGeneoToolbarTabStops(
                toolbar
            );
        };

    updateDensity(
        toolbar.getBoundingClientRect()
            .width
    );

    if (
        typeof ResizeObserver
          === 'function'
    )
    {
        geneoToolbarResizeObserver =
            new ResizeObserver(
                entries =>
                {
                    const entry =
                        entries[0];

                    if (!entry) return;

                    updateDensity(
                        entry.contentRect.width
                    );
                }
            );

        geneoToolbarResizeObserver
            .observe(toolbar);
    }
}

function bindGeneographToolbarKeyboard()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    syncGeneoToolbarTabStops(
        toolbar
    );

    toolbar.addEventListener(
        'focusin',
        event =>
        {
            const button =
                event.target.closest('button');

            if (!button) return;

            syncGeneoToolbarTabStops(
                toolbar,
                button
            );
        }
    );

    toolbar.addEventListener(
        'keydown',
        event =>
        {
            if (
                ![
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ].includes(event.key)
            )
            {
                return;
            }

            const current =
                event.target.closest('button');

            if (!current) return;

            const buttons =
                geneoVisibleToolbarButtons(
                    toolbar
                );

            const index =
                buttons.indexOf(current);

            if (index < 0) return;

            event.preventDefault();

            let nextIndex =
                index;

            if (event.key === 'Home')
            {
                nextIndex = 0;
            }
            else if (event.key === 'End')
            {
                nextIndex =
                    buttons.length - 1;
            }
            else
            {
                const direction =
                    event.key === 'ArrowRight'
                        ? 1
                        : -1;

                nextIndex =
                    (
                        index
                + direction
                + buttons.length
                    ) % buttons.length;
            }

            const nextButton =
                buttons[nextIndex];

            syncGeneoToolbarTabStops(
                toolbar,
                nextButton
            );

            nextButton?.focus();
        }
    );
}

function geneographEditorCollectionMeta(board)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        );

    return {
        label: collections.length
            ? collections.length === 1
                ? collections[0].name
                : `${collections[0].name} +${collections.length - 1}`
            : 'Not in collection',
        title: collections.length
            ? collections.map(collection => collection.name).join(', ')
            : 'Not in collection'
    };
}

function validateSampleGeneographCollections(
    warn,
    projectIds
)
{
    const collectionIds =
        new Set();

    (
        sampleData.boardCollections
        || []
    ).forEach(collection =>
    {
        if (!collection.id)
        {
            warn(
                'Board collection is missing an ID'
            );

            return;
        }

        if (
            collectionIds.has(
                collection.id
            )
        )
        {
            warn(
                `Duplicate board collection ID: ${
                    collection.id
                }`
            );
        }

        collectionIds.add(
            collection.id
        );

        if (
            !projectIds.has(
                collection.projectId
            )
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } points to missing project ${
                    collection.projectId
                }`
            );
        }

        if (
            !String(
                collection.name || ''
            ).trim()
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } has no name`
            );
        }
    });

    (
        sampleData.boards
        || []
    ).forEach(board =>
    {
        if (
            !projectIds.has(
                board.projectId
            )
        )
        {
            warn(
                `Board ${
                    board.id
                } points to missing project ${
                    board.projectId
                }`
            );
        }
        if (
            typeof board.archived
            !== 'boolean'
        )
        {
            warn(
                `Board ${
                    board.id
                } has an invalid archived state`
            );
        }
        (
            board.collectionIds
          || []
        ).forEach(collectionId =>
        {
            const collection =
                getBoardCollection(
                    collectionId,
                    {
                        projectId:
                  board.projectId
                    }
                );

            if (!collection)
            {
                warn(
                    `Board ${
                        board.id
                    } points to invalid collection ${
                        collectionId
                    }`
                );
            }
        });

        const diagram =
            board.diagram;

        if (
            !diagram
          || !Array.isArray(diagram.people)
          || !Array.isArray(diagram.families)
          || !Array.isArray(diagram.nodes)
          || !Array.isArray(diagram.connections)
        )
        {
            warn(
                `Board ${board.id} has an invalid diagram`
            );
            return;
        }

        if (!isCanonicalGeneoPaint(diagram.canvas?.backgroundPaint, { mustBeEnabled: true, fixedOpacity: 100 }))
        {
            warn(`Board ${board.id} has an invalid canvas background paint`);
        }

        const peopleIds =
            new Set();
        const nodeIds =
            new Set();
        const familyIds =
            new Set();

        diagram.people
            .forEach(person =>
            {
                if (
                    !person.id
              || peopleIds.has(person.id)
                )
                {
                    warn(
                        `Board ${board.id} has a duplicate or missing person ID`
                    );
                }
                peopleIds.add(person.id);

                if (
                    person.treePersonId
              && !(sampleData.people || [])
                  .some(treePerson =>
                      treePerson.id === person.treePersonId
                  && treePerson.projectId === board.projectId
                  )
                )
                {
                    warn(
                        `Board person ${person.id} has an invalid Family Tree link`
                    );
                }
            });

        diagram.nodes
            .forEach(node =>
            {
                if (
                    !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid node`
                    );
                }
                nodeIds.add(node.id);

                ['fill', 'stroke', 'text'].forEach(property =>
                {
                    if (!isCanonicalGeneoPaint(node.appearance?.[property], { mustBeEnabled: property === 'text' }))
                    {
                        warn(`Node ${node.id} has an invalid ${property} paint`);
                    }
                });
                if (!['solid', 'dashed'].includes(node.appearance?.strokePattern))
                {
                    warn(`Node ${node.id} has an invalid stroke pattern`);
                }
                if (
                    !Number.isInteger(node.appearance?.strokeWidth)
              || node.appearance.strokeWidth < GENEO_STROKE_WIDTH_MIN
              || node.appearance.strokeWidth > GENEO_STROKE_WIDTH_MAX
                )
                {
                    warn(`Node ${node.id} has an invalid stroke width`);
                }

                if (
                    node.type === 'person'
              && !peopleIds.has(node.personId)
                )
                {
                    warn(
                        `Person node ${node.id} points to a missing board person`
                    );
                }
                if (
                    node.type === 'person'
              && !['auto', 'manual'].includes(
                  node.personCard?.heightMode
              )
                )
                {
                    warn(
                        `Person node ${node.id} has an invalid height mode`
                    );
                }
                if (
                    node.type === 'shape'
              && !GENEO_SHAPE_KINDS.some(shape => shape.id === node.shapeKind)
                )
                {
                    warn(`Shape node ${node.id} has an invalid shape kind`);
                }
                if (
                    node.type === 'shape'
              && (
                  !Number.isInteger(node.appearance?.cornerRadius)
                || node.appearance.cornerRadius < 0
                || node.appearance.cornerRadius > 32
              )
                )
                {
                    warn(`Shape node ${node.id} has an invalid corner radius`);
                }
                if (
                    node.type === 'drawing'
              && (
                  !Array.isArray(node.points)
                || node.points.length < 2
                || node.points.some(point =>
                    !Number.isFinite(point?.x)
                  || !Number.isFinite(point?.y)
                  || point.x < 0
                  || point.x > 1
                  || point.y < 0
                  || point.y > 1
                )
              )
                )
                {
                    warn(`Drawing node ${node.id} has invalid points`);
                }
                if (node.type === 'place')
                {
                    const ref = node.placeRef;
                    const projectPlace = ref?.scope === 'project'
                        ? (sampleData.places || []).find(place => place.id === ref.id)
                        : null;
                    if (
                        !ref
                || !['project', 'board'].includes(ref.scope)
                || (ref.scope === 'board' && !String(ref.name || '').trim())
                || (ref.scope === 'project' && (
                    !projectPlace
                  || projectPlace.deleted
                  || projectPlace.projectId !== board.projectId
                ))
                    )
                    {
                        warn(`Place node ${node.id} has an invalid place reference`);
                    }
                    if (
                        ![
                            'auto',
                            'manual'
                        ].includes(
                            node.placeSizeMode
                        )
                    )
                    {
                        warn(
                            `Place node ${node.id} has an invalid size mode`
                        );
                    }
                }
            });

        diagram.families
            .forEach(family =>
            {
                if (
                    !family.id
              || familyIds.has(family.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid family ID`
                    );
                }
                familyIds.add(family.id);

                [
                    ...(family.partnerIds || []),
                    ...(family.children || [])
                        .map(child => child.personId)
                ].forEach(personId =>
                {
                    if (!peopleIds.has(personId))
                    {
                        warn(
                            `Family ${family.id} points to a missing board person`
                        );
                    }
                });
            });

        const connectionIds =
            new Set();

        diagram.connections
            .forEach(connection =>
            {
                if (
                    !connection.id
              || connectionIds.has(connection.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid connection ID`
                    );
                }
                connectionIds.add(connection.id);

                if (!isCanonicalGeneoPaint(connection.style?.line))
                {
                    warn(`Connection ${connection.id} has an invalid line paint`);
                }
                if (
                    !Number.isInteger(connection.style?.width)
              || connection.style.width < GENEO_STROKE_WIDTH_MIN
              || connection.style.width > GENEO_STROKE_WIDTH_MAX
                )
                {
                    warn(`Connection ${connection.id} has an invalid stroke width`);
                }
                if (!['solid', 'dashed'].includes(connection.style?.pattern))
                {
                    warn(`Connection ${connection.id} has an invalid line pattern`);
                }

                [
                    connection.source,
                    connection.target
                ].forEach(reference =>
                {
                    if (
                        reference?.nodeId
                && !nodeIds.has(reference.nodeId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing node`
                        );
                    }
                    if (
                        reference?.familyId
                && !familyIds.has(reference.familyId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing family`
                        );
                    }
                });
            });
    });
}

function openGeneographBoardDetailsModal({
    boardId =
        null
} = {})
{
    const editing =
        Boolean(
            boardId
        );

    const board =
        editing
            ? getGeneographBoard(
                boardId
            )
            : null;

    if (
        editing
        && !board
    )
    {
        showToast(
            'Board not found.'
        );

        return;
    }

    const projectId =
        board?.projectId
        || requireActiveProjectId();
    if (!projectId) return;

    const inheritedCollection =
        !editing
        && state.geneoLibraryView
          === 'collection'
            ? activeGeneographCollection()
            : null;

    const selectedCollectionIds =
        new Set(
            editing
                ? (
                    board.collectionIds
                || []
                )
                : inheritedCollection
                    ? [
                        inheritedCollection.id
                    ]
                    : []
        );

    const modalTitle =
        editing
            ? 'Edit board'
            : 'New board';

    const modalDescription =
        editing
            ? 'Update the board name, description and collections.'
            : 'Create a visual workspace for research, evidence and visual exploration.';

    const submitLabel =
        editing
            ? 'Save changes'
            : 'Create board';

    openModal(`
        <div
          class="
            modal
            geneo-board-create-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneographBoardDetailsTitle">

          <div
            class="
              modal-header
            ">

            <div>
              <h2
                id="geneographBoardDetailsTitle">

                ${escapeHtml(
                    modalTitle
                )}
              </h2>

              <p>
                ${escapeHtml(
                    modalDescription
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            data-geneo-board-details-form>

            <div
              class="
                modal-body
                form-grid
              ">

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsName">

                  Board name
                </label>

                <input
                  id="geneoBoardDetailsName"
                  type="text"
                  required
                  maxlength="160"
                  autocomplete="off"
                  value="${escapeHtml(
                        board?.title
                    || ''
                    )}"
                  placeholder="e.g. Unknown father theory">
              </div>

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsDescription">

                  Description
                </label>

                <textarea
                  id="geneoBoardDetailsDescription"
                  rows="3"
                  maxlength="500"
                  placeholder="Research question or intended output">${escapeHtml(
                        board?.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId,
                    selectedCollectionIds
                })}
            </div>

            <div
              class="
                modal-footer
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.geneo-board-create-modal'
        );

    if (!modal)
    {
        return;
    }

    bindGeneographCollectionChooser(
        modal,
        {
            projectId,
            selectedCollectionIds
        }
    );

    const form =
        modal.querySelector(
            '[data-geneo-board-details-form]'
        );

    const nameInput =
        modal.querySelector(
            '#geneoBoardDetailsName'
        );

    const descriptionInput =
        modal.querySelector(
            '#geneoBoardDetailsDescription'
        );

    form
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const title =
                    nameInput
                        ?.value
                        .trim()
              || '';

                if (!title)
                {
                    nameInput?.focus();

                    showToast(
                        'Enter a board name.'
                    );

                    return;
                }

                const description =
                    descriptionInput
                        ?.value
                        .trim()
              || '';

                if (editing)
                {
                    board.title =
                        title;

                    board.description =
                        description;

                    setBoardCollections(
                        board.id,
                        [
                            ...selectedCollectionIds
                        ],
                        {
                            projectId:
                    board.projectId,

                            touchModified:
                    false
                        }
                    );

                    touchGeneographBoard(
                        board
                    );

                    closeModal();

                    renderGeneographHome();

                    showToast(
                        'Board updated.'
                    );

                    return;
                }
                const now =
                    new Date().toISOString();

                const newBoard = {
                    id:
                createRuntimeId(
                    'board'
                ),

                    projectId,

                    title,

                    description,

                    collectionIds: [
                        ...selectedCollectionIds
                    ],

                    modified:
                'Just now',
                    modifiedAt: now,
                    createdAt: now,
                    favorite:
                false,
                    archived:
                false,
                    thumb:
                'theory',
                    diagram:
                createEmptyGeneographDiagram()
                };

                sampleData.boards.unshift(
                    newBoard
                );

                state.selectedGeneoBoardId =
                    newBoard.id;

                const createdWithCollections =
                    selectedCollectionIds.size
                > 0;

                if (
                    state.geneoLibraryView
                === 'favorites'
              || state.geneoLibraryView
                === 'archived'
              || (
                  state.geneoLibraryView
                  === 'unassigned'
                && createdWithCollections
              )
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Board created.'
                );
            }
        );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();

            if (editing)
            {
                nameInput?.select();
            }
        }
    );
}

function openCreateGeneographBoardModal()
{
    openGeneographBoardDetailsModal();
}

function openEditGeneographBoardModal(
    boardId
)
{
    openGeneographBoardDetailsModal({
        boardId
    });
}

function openGeneographSettingsModal()
{
    cancelGeneographPencilStroke();
    const board =
        selectedGeneographBoard();

    if (!board)
    {
        return;
    }

    const selectedCollectionIds =
        new Set(
            board.collectionIds
          || []
        );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boardSettingsTitle">

          <div class="modal-header">
            <div>
              <h2
                id="boardSettingsTitle">

                Board settings
              </h2>

              <p>
                Update board details and
                collection memberships.
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            id="geneographBoardSettingsForm">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="geneographSettingsName">

                  Board name
                </label>

                <input
                  id="geneographSettingsName"
                  type="text"
                  required
                  maxlength="160"
                  value="${escapeHtml(
                        board.title
                    )}">
              </div>

              <div class="field">
                <label
                  for="geneographSettingsDescription">

                  Description
                </label>

                <textarea
                  id="geneographSettingsDescription"
                  maxlength="500"
                  rows="4">${escapeHtml(
                        board.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId:
                  board.projectId,

                    selectedCollectionIds
                })}
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                Save settings
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.modal'
        );

    bindGeneographCollectionChooser(
        modal,
        {
            projectId:
            board.projectId,

            selectedCollectionIds
        }
    );

    modalBackdrop
        .querySelector(
            '#geneographBoardSettingsForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const name =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.value
                        .trim()
              || '';

                if (!name)
                {
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.focus();

                    return;
                }

                board.title =
                    name;

                board.description =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsDescription'
                        )
                        ?.value
                        .trim()
              || '';

                setBoardCollections(
                    board.id,
                    [
                        ...selectedCollectionIds
                    ],
                    {
                        projectId:
                  board.projectId,

                        touchModified:
                  false
                    }
                );

                touchGeneographBoard(
                    board
                );

                closeModal();

                renderGeneographEditorPreserveScroll();

                showToast(
                    'Board settings updated.'
                );
            }
        );
}

const GENEO_NODE_TYPES = new Set(['person', 'image', 'sticky', 'text', 'panel', 'shape', 'place', 'drawing']);
const GENEO_SHAPE_KINDS = Object.freeze([
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'hexagon', label: 'Hexagon' }
]);
const GENEO_STROKE_WIDTH_MIN = 1;
const GENEO_STROKE_WIDTH_MAX = 12;
const GENEO_GRID_SIZE = 20;
const GENEO_TOP_ROUTE_CLEARANCE = GENEO_GRID_SIZE * 4;
const GENEO_HISTORY_LIMIT = 50;
const GENEO_LAYER_NAME_LIMIT = 80;
let geneoPointerState = null;

let geneoHistoryRuntime = {
    boardId: '',
    undo: [],
    redo: []
};

let geneoToolbarResizeObserver = null;

let geneoCanvasRuntime =
    createGeneoCanvasRuntime();
let geneoPaintRuntime = createGeneoPaintRuntime();
let geneoKeyboardBound = false;
let geneoShiftPressed = false;
let geneoPointerBound = false;
let geneoImageUploadRequestId = 0;

function geneoNumber(value, fallback, min = -Infinity, max = Infinity)
{
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function normalizeGeneographLayerName(value)
{
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, GENEO_LAYER_NAME_LIMIT);
}

function snapGeneographCoordinate(value)
{
    const number = geneoNumber(value, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
    return selectedGeneographDiagram()?.canvas.snapToGrid
        ? Math.round(number / GENEO_GRID_SIZE) * GENEO_GRID_SIZE
        : number;
}

function snapGeneographPoint(point)
{
    if (!point) return null;
    return {
        x: snapGeneographCoordinate(point.x),
        y: snapGeneographCoordinate(point.y)
    };
}

const GENEO_BOARD_COLORS = [
    { color: '#101817', name: 'Ink' },
    { color: '#26312E', name: 'Graphite' },
    { color: '#D9E5E1', name: 'Mist' },
    { color: '#F3F1E9', name: 'Paper' },
    { color: '#173029', name: 'Deep moss' },
    { color: '#172A32', name: 'Archive blue' },
    { color: '#2D2437', name: 'Plum' },
    { color: '#302B1D', name: 'Sepia' },
    { color: '#2FAE74', name: 'Geneograph green' },
    { color: '#62D99A', name: 'Mint' },
    { color: '#4FB3A5', name: 'Teal' },
    { color: '#5DADEC', name: 'Blue' },
    { color: '#AA8CE8', name: 'Violet' },
    { color: '#D4AA6B', name: 'Amber' },
    { color: '#D9828B', name: 'Rose' },
    { color: '#C75B5B', name: 'Conflict red' }
];

function normalizeGeneoHexColor(value, fallback = '#101817')
{
    const text = String(value || '').trim();
    const short = text.match(/^#?([0-9a-f]{3})$/i);
    const full = text.match(/^#?([0-9a-f]{6})$/i);
    if (short)
    {
        return `#${short[1].split('').map(character => `${character}${character}`).join('')}`.toUpperCase();
    }
    if (full) return `#${full[1]}`.toUpperCase();
    const safeFallback = String(fallback || '#101817').match(/^#?([0-9a-f]{6})$/i);
    return safeFallback ? `#${safeFallback[1]}`.toUpperCase() : '#101817';
}

function normalizeGeneoPaint(value, fallback = {}, {
    forceEnabled = false,
    forceOpacity = null
} = {})
{
    const source = value && typeof value === 'object' ? value : {};
    const defaultPaint = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        color: normalizeGeneoHexColor(source.color, defaultPaint.color || '#101817'),
        opacity: forceOpacity === null
            ? Math.round(geneoNumber(source.opacity, defaultPaint.opacity ?? 100, 0, 100))
            : Math.round(geneoNumber(forceOpacity, 100, 0, 100)),
        enabled: forceEnabled ? true : source.enabled !== false
    };
}

function geneoPaintFromLegacy(sourcePaint, legacyColor, fallback, options = {})
{
    if (sourcePaint && typeof sourcePaint === 'object')
    {
        return normalizeGeneoPaint(sourcePaint, fallback, options);
    }
    return normalizeGeneoPaint({
        color: legacyColor,
        opacity: options.legacyOpacity ?? fallback.opacity,
        enabled: options.legacyEnabled ?? fallback.enabled
    }, fallback, options);
}

function geneoHexToRgb(color)
{
    const normalized = normalizeGeneoHexColor(color);
    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16)
    };
}

function geneoPaintCssColor(paint, { disabledColor = 'transparent' } = {})
{
    if (!paint?.enabled) return disabledColor;
    const { r, g, b } = geneoHexToRgb(paint.color);
    return `rgba(${r}, ${g}, ${b}, ${geneoNumber(paint.opacity, 100, 0, 100) / 100})`;
}

function isCanonicalGeneoPaint(paint, { mustBeEnabled = false, fixedOpacity = null } = {})
{
    return Boolean(
        paint
        && typeof paint === 'object'
        && /^#[0-9A-F]{6}$/.test(paint.color)
        && Number.isInteger(paint.opacity)
        && paint.opacity >= 0
        && paint.opacity <= 100
        && typeof paint.enabled === 'boolean'
        && (!mustBeEnabled || paint.enabled)
        && (fixedOpacity === null || paint.opacity === fixedOpacity)
    );
}

function geneoAppearance(value, defaults = {}, nodeType = '')
{
    const source = value && typeof value === 'object' ? value : {};
    const legacyStrokeType = ['dashed', 'solid', 'none'].includes(source.strokeType)
        ? source.strokeType
        : null;
    const defaultPattern = defaults.strokePattern === 'dashed' ? 'dashed' : 'solid';
    const result = { ...defaults, ...source };
    result.fill = geneoPaintFromLegacy(
        source.fill,
        source.backgroundColor,
        defaults.fill,
        { legacyOpacity: nodeType === 'panel' ? 68 : 100 }
    );
    result.stroke = geneoPaintFromLegacy(
        source.stroke,
        source.strokeColor,
        defaults.stroke,
        { legacyEnabled: legacyStrokeType !== 'none' }
    );
    result.text = geneoPaintFromLegacy(
        source.text,
        source.textColor,
        defaults.text,
        { forceEnabled: true }
    );
    if (nodeType === 'person')
    {
        const sourceOverrides =
            source.paintOverrides
          && typeof source.paintOverrides
            === 'object'
                ? source.paintOverrides
                : {};

        result.paintOverrides = {
            fill:
            sourceOverrides.fill
            === true,

            stroke:
            sourceOverrides.stroke
            === true,

            text:
            sourceOverrides.text
            === true
        };
    }
    else
    {
        delete result.paintOverrides;
    }
    result.strokePattern = legacyStrokeType && legacyStrokeType !== 'none'
        ? legacyStrokeType
        : source.strokePattern === 'dashed'
            ? 'dashed'
            : defaultPattern;
    result.strokeWidth = Math.round(geneoNumber(
        source.strokeWidth,
        defaults.strokeWidth || GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MAX
    ));
    if (Number.isFinite(Number(defaults.cornerRadius)))
    {
        result.cornerRadius = Math.round(geneoNumber(
            source.cornerRadius,
            defaults.cornerRadius,
            0,
            32
        ));
    }
    else
    {
        delete result.cornerRadius;
    }
    delete result.backgroundColor;
    delete result.strokeColor;
    delete result.textColor;
    delete result.strokeType;
    return result;
}

function geneoFilenameStem(filename)
{
    return String(filename || '')
        .trim()
        .replace(/\.[^.]+$/, '')
        || 'Image';
}

function geneoImageRecordName(record)
{
    return String(
        record?.title
        || record?.displayName
        || record?.filename
        || ''
    ).trim() || 'Image';
}

function normalizeGeneographImageRef(node)
{
    const source = node?.imageRef;

    if (
        source
        && ['project', 'board'].includes(source.scope)
        && String(source.id || '').trim()
    )
    {
        return {
            scope: source.scope,
            id: String(source.id).trim()
        };
    }

    // One-time migration for the previous Geneograph image model.
    if (String(node?.photoId || '').trim())
    {
        return {
            scope: 'project',
            id: String(node.photoId).trim()
        };
    }

    return null;
}

function normalizeGeneographShapeKind(value)
{
    const kind = String(value || '').trim().toLowerCase();
    if (kind === 'rounded-rectangle') return 'rectangle';
    return GENEO_SHAPE_KINDS.some(shape => shape.id === kind)
        ? kind
        : 'rectangle';
}

function geneoShapeLabel(value)
{
    const kind = normalizeGeneographShapeKind(value);
    return GENEO_SHAPE_KINDS.find(shape => shape.id === kind)?.label || 'Rectangle';
}

function normalizeGeneographDrawingPoints(value)
{
    const points = [];
    (Array.isArray(value) ? value : []).forEach(point =>
    {
        const x = Number(point?.x);
        const y = Number(point?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const next = {
            x: geneoNumber(x, 0, 0, 1),
            y: geneoNumber(y, 0, 0, 1)
        };
        const previous = points.at(-1);
        if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) < 0.0001) return;
        points.push(next);
    });
    return points;
}

function normalizeGeneographPlaceRef(node, projectId = selectedGeneographBoard()?.projectId || '')
{
    const source = node?.placeRef;
    if (source?.scope === 'project')
    {
        const id = String(source.id || '').trim();
        const place = id ? getPlace(id) : null;
        if (place && !place.deleted && place.projectId === projectId)
        {
            return {
                scope: 'project',
                id,
                fallbackName: String(placePrimaryName(place) || place.name || source.fallbackName || 'Place').trim().slice(0, 160)
            };
        }
        const fallbackName = String(source.fallbackName || node?.placeName || '').trim().slice(0, 160);
        return fallbackName ? { scope: 'board', name: fallbackName } : null;
    }
    if (source?.scope === 'board')
    {
        const name = String(source.name || '').replace(/\s+/g, ' ').trim().slice(0, 160);
        return name ? { scope: 'board', name } : null;
    }
    const legacyPlaceId = String(node?.placeId || '').trim();
    const legacyPlace = legacyPlaceId ? getPlace(legacyPlaceId) : null;
    if (legacyPlace && !legacyPlace.deleted && legacyPlace.projectId === projectId)
    {
        return {
            scope: 'project',
            id: legacyPlace.id,
            fallbackName: String(placePrimaryName(legacyPlace) || legacyPlace.name || 'Place').trim().slice(0, 160)
        };
    }
    const legacyName = String(node?.placeName || node?.title || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    return legacyName ? { scope: 'board', name: legacyName } : null;
}

function resolveGeneographPlace(node, board = selectedGeneographBoard())
{
    const ref = normalizeGeneographPlaceRef(node, board?.projectId || '');
    if (!ref) return { ref: null, place: null, linked: false, name: 'Place' };
    if (ref.scope === 'project')
    {
        const place = getPlace(ref.id);
        if (place && !place.deleted && place.projectId === board?.projectId)
        {
            return {
                ref,
                place,
                linked: true,
                name: placePrimaryName(place) || place.name || ref.fallbackName || 'Place'
            };
        }
    }
    return {
        ref,
        place: null,
        linked: false,
        name: ref.name || ref.fallbackName || 'Place'
    };
}

function normalizeGeneographBoardAsset(asset)
{
    if (!asset || typeof asset !== 'object') return null;

    const id = String(asset.id || '').trim();
    const src = String(asset.src || '').trim();
    const mimeType = String(asset.mimeType || '').trim();

    if (
        !id
        || !src
        || !PHOTO_UPLOAD_ALLOWED_TYPES.includes(mimeType)
    )
    {
        return null;
    }

    const filename = String(
        asset.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const now = new Date().toISOString();

    return {
        id,
        kind: 'photo',
        filename,
        displayName:
          String(asset.displayName || '').trim()
          || geneoFilenameStem(filename),
        src,
        mimeType,
        width: geneoNumber(asset.width, 0, 1),
        height: geneoNumber(asset.height, 0, 1),
        sizeBytes: geneoNumber(asset.sizeBytes, 0, 0),
        createdAt:
          Number.isFinite(Date.parse(asset.createdAt))
              ? asset.createdAt
              : now,
        updatedAt:
          Number.isFinite(Date.parse(asset.updatedAt))
              ? asset.updatedAt
              : now
    };
}

function getGeneographBoardAsset(
    assetId,
    diagram = selectedGeneographDiagram()
)
{
    return (
        diagram?.assets || []
    ).find(asset => asset.id === assetId) || null;
}

function resolveGeneographImageSource(
    node,
    {
        board = selectedGeneographBoard(),
        diagram = board?.diagram
    } = {}
)
{
    const ref = normalizeGeneographImageRef(node);

    if (!ref)
    {
        return {
            ref: null,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'No source'
        };
    }

    if (ref.scope === 'project')
    {
        const photo = getPhoto(ref.id, {
            projectId: board?.projectId || ''
        });

        if (!photo || photo.deletedAt)
        {
            return {
                ref,
                available: false,
                photo: null,
                displayName: 'Image',
                filename: '',
                sourceLabel: 'Project photo'
            };
        }

        return {
            ref,
            available: true,
            photo,
            displayName: geneoImageRecordName(photo),
            filename: String(photo.filename || photo.title || '').trim(),
            sourceLabel: 'Project photo',
            width: Number(photo.width) || 0,
            height: Number(photo.height) || 0,
            sizeBytes: Number(photo.sizeBytes) || 0
        };
    }

    const asset = getGeneographBoardAsset(ref.id, diagram);

    if (!asset)
    {
        return {
            ref,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'Board upload'
        };
    }

    return {
        ref,
        available: true,
        photo: asset,
        displayName: geneoImageRecordName(asset),
        filename: String(asset.filename || '').trim(),
        sourceLabel: 'Board upload',
        width: Number(asset.width) || 0,
        height: Number(asset.height) || 0,
        sizeBytes: Number(asset.sizeBytes) || 0
    };
}

function geneoImageSourceName(node)
{
    const source = resolveGeneographImageSource(node);
    return source.available ? source.displayName : 'Image';
}

function pruneGeneographBoardAssets(
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram) return false;

    const referencedIds = new Set(
        diagram.nodes
            .filter(node =>
                node.type === 'image'
            && node.imageRef?.scope === 'board'
            && node.imageRef.id
            )
            .map(node => node.imageRef.id)
    );

    const assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const nextAssets = assets.filter(asset =>
        referencedIds.has(asset.id)
    );

    if (nextAssets.length === assets.length) return false;

    diagram.assets = nextAssets;
    return true;
}

function uniqueGeneographBoardAssetId(
    diagram = selectedGeneographDiagram()
)
{
    let id;

    do
    {
        id = createRuntimeId('geneo-asset');
    } while (
        diagram?.assets?.some(asset => asset.id === id)
    );

    return id;
}

function createGeneographBoardAsset(
    draft,
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram || !photoUploadDraftIsValid(draft)) return null;

    diagram.assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const now = new Date().toISOString();
    const filename = String(
        draft.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const asset = {
        id: uniqueGeneographBoardAssetId(diagram),
        kind: 'photo',
        filename,
        displayName: geneoFilenameStem(filename),
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,
        createdAt: now,
        updatedAt: now
    };

    diagram.assets.push(asset);
    return asset;
}

function geneoImageNodeSize(source)
{
    const defaults = geneoNodeDefaults('image');
    const sourceWidth = Number(source?.width);
    const sourceHeight = Number(source?.height);

    if (
        !Number.isFinite(sourceWidth)
        || !Number.isFinite(sourceHeight)
        || sourceWidth <= 0
        || sourceHeight <= 0
    )
    {
        return {
            width: defaults.width,
            height: defaults.height
        };
    }

    // Exact for normal photo ratios; extreme panoramas remain manageable
    // and are shown uncropped through object-fit: contain.
    const ratio = Math.min(
        2.4,
        Math.max(.45, sourceWidth / sourceHeight)
    );

    let width = defaults.width;
    let height = width / ratio;

    if (height < defaults.minHeight)
    {
        height = defaults.minHeight;
        width = height * ratio;
    }

    if (height > 360)
    {
        height = 360;
        width = height * ratio;
    }

    return {
        width: Math.round(Math.max(defaults.minWidth, width)),
        height: Math.round(Math.max(defaults.minHeight, height))
    };
}

function normalizeGeneographRuntimeData()
{
    state.geneoShapeKind = normalizeGeneographShapeKind(state.geneoShapeKind);
    const projects = new Set((sampleData.projects || []).map(project => project.id));
    const projectPeople = new Map();
    (sampleData.people || []).forEach(person =>
    {
        if (!projectPeople.has(person.projectId)) projectPeople.set(person.projectId, new Set());
        projectPeople.get(person.projectId).add(person.id);
    });
    sampleData.boardCollections = (sampleData.boardCollections || []).filter(Boolean).map(collection => ({
        id: String(collection.id || '').trim(),
        projectId: String(collection.projectId || ''),
        name: String(collection.name || 'Untitled collection').trim(),
        description: String(collection.description || '').trim()
    })).filter(collection => collection.id && projects.has(collection.projectId));
    sampleData.boards = (sampleData.boards || []).filter(Boolean).map(board =>
    {
        board.id = String(board.id || createRuntimeId('board'));
        board.projectId = String(board.projectId || '');
        board.title = String(board.title || 'Untitled board').trim() || 'Untitled board';
        board.description = String(board.description || '').trim();
        board.collectionIds = normalizeGeneographIdArray(board.collectionIds);
        board.favorite = Boolean(board.favorite);
        board.archived = Boolean(board.archived);
        board.modifiedAt = Number.isFinite(Date.parse(board.modifiedAt)) ? board.modifiedAt : new Date().toISOString();
        board.modified = String(board.modified || formatProjectModified?.(board) || 'Just now');
        const source = board.diagram && typeof board.diagram === 'object' ? board.diagram : createEmptyGeneographDiagram();
        const canvas = source.canvas && typeof source.canvas === 'object' ? source.canvas : {};
        const backgroundPattern = ['dots', 'grid', 'clear'].includes(canvas.backgroundPattern)
            ? canvas.backgroundPattern
            : canvas.gridVisible === false ? 'clear' : 'dots';
        const diagram = {
            canvas: {
                backgroundPaint: geneoPaintFromLegacy(
                    canvas.backgroundPaint,
                    canvas.backgroundColor,
                    { color: '#0F1413', opacity: 100, enabled: true },
                    { forceEnabled: true, forceOpacity: 100 }
                ),
                backgroundPattern,
                snapToGrid: Boolean(canvas.snapToGrid),
                alwaysShowSockets: Boolean(canvas.alwaysShowSockets),
                colorPersonCardsByGender:
              Boolean(canvas.colorPersonCardsByGender)
            },
            personCardDefaults:
            normalizeGeneographPersonCardSettings(
                source.personCardDefaults
            ),
            assets: [],
            people: [],
            families: [],
            nodes: [],
            connections: []
        };
        const assetIds = new Set();

        (Array.isArray(source.assets) ? source.assets : [])
            .forEach(sourceAsset =>
            {
                const asset = normalizeGeneographBoardAsset(sourceAsset);

                if (!asset || assetIds.has(asset.id)) return;

                assetIds.add(asset.id);
                diagram.assets.push(asset);
            });
        const personIds = new Set();
        (Array.isArray(source.people) ? source.people : []).forEach(person =>
        {
            if (!person || !person.id || personIds.has(person.id)) return;
            personIds.add(person.id);
            const treePersonId = projectPeople.get(board.projectId)?.has(person.treePersonId) ? person.treePersonId : null;
            const names = normalizeGeneographPersonNames(person);
            const legacyDeath = formatGenealogyDateLabel(person.death);
            const livingStatus = ['Living', 'Deceased', 'Unknown'].includes(person.livingStatus)
                ? person.livingStatus
                : legacyDeath ? 'Deceased' : 'Living';
            diagram.people.push({
                id: String(person.id), treePersonId,
                syncState: ['local', 'linked', 'modified'].includes(person.syncState) ? person.syncState : (treePersonId ? 'linked' : 'local'),
                names,
                gender: ['male', 'female', 'unknown'].includes(String(person.gender || person.sex || '').toLowerCase())
                    ? String(person.gender || person.sex).toLowerCase()
                    : 'unknown',
                livingStatus,
                birth: normalizeGeneographPersonVital(person.birth, board.projectId),
                death: livingStatus === 'Deceased'
                    ? normalizeGeneographPersonVital(person.death, board.projectId)
                    : { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' },
                photoId: person.photoId || null,
                photoCrop:
              person.photoCrop
                  ? normalizePersonPhotoCrop(
                      person.photoCrop
                  )
                  : null
            });
        });
        const nodeIds = new Set();

        (Array.isArray(source.nodes) ? source.nodes : [])
            .forEach((node, index) =>
            {
                if (
                    !node
              || !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    return;
                }

                if (
                    node.type === 'person'
              && !personIds.has(node.personId)
                )
                {
                    return;
                }

                nodeIds.add(node.id);

                const defaults = geneoNodeDefaults(node.type);
                const legacyRoundedShape = node.type === 'shape'
              && String(node.shapeKind || '').trim().toLowerCase() === 'rounded-rectangle';
                const appearanceDefaults = legacyRoundedShape
                    ? { ...defaults.appearance, cornerRadius: 12 }
                    : defaults.appearance;

                const normalizedNode = {
                    ...node,
                    id: String(node.id),
                    type: node.type,
                    name: String(node.name || '').trim().slice(0, 80),
                    x: geneoNumber(
                        node.x,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    y: geneoNumber(
                        node.y,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    width: geneoNumber(
                        node.width,
                        defaults.width,
                        defaults.minWidth,
                        node.type === 'person'
                            ? defaults.maxWidth
                            : 10000
                    ),
                    height: geneoNumber(
                        node.height,
                        defaults.height,
                        defaults.minHeight,
                        node.type === 'person'
                            ? defaults.maxHeight
                            : 10000
                    ),
                    parentPanelId: node.parentPanelId || null,
                    order: geneoNumber(node.order, index + 1),
                    visible: node.visible !== false,
                    locked: Boolean(node.locked),
                    appearance: geneoAppearance(
                        node.appearance,
                        appearanceDefaults,
                        node.type
                    )
                };
                if (node.type === 'person')
                {
                    const sourcePersonCard =
                        node.personCard
                && typeof node.personCard === 'object'
                            ? node.personCard
                            : {};

                    const legacyStyle =
                        geneoPersonCardSettingValueIsValid(
                            'style',
                            sourcePersonCard.style
                        )
                            ? sourcePersonCard.style
                            : diagram.personCardDefaults.style;

                    const legacyDefaultHeight =
                        legacyStyle === 'standard'
                && Math.abs(
                    Number(node.height) - 220
                ) < .5;

                    const legacyPhotoOverride =
                        sourcePersonCard.custom === true
                && typeof sourcePersonCard
                    .fields?.photo === 'boolean'
                && !Object.hasOwn(
                    sourcePersonCard.photoByStyle
                    || {},
                    legacyStyle
                );

                    const personCardSource =
                        legacyPhotoOverride
                            ? {
                                ...sourcePersonCard,
                                fields: {
                                    ...sourcePersonCard.fields,
                                    photo: undefined
                                },
                                photoByStyle: {
                                    ...sourcePersonCard.photoByStyle,
                                    [legacyStyle]:
                          sourcePersonCard
                              .fields.photo
                                }
                            }
                            : sourcePersonCard;

                    normalizedNode.personCard =
                        normalizeGeneographPersonCardOverrides(
                            personCardSource,
                            legacyDefaultHeight
                                ? 'auto'
                                : 'manual'
                        );

                    ensureGeneographPersonCardSize(
                        normalizedNode,
                        diagram
                    );
                }
                if (node.type === 'shape')
                {
                    normalizedNode.shapeKind = normalizeGeneographShapeKind(node.shapeKind);
                }
                else
                {
                    delete normalizedNode.shapeKind;
                }
                if (node.type === 'drawing')
                {
                    normalizedNode.points = normalizeGeneographDrawingPoints(node.points);
                    if (normalizedNode.points.length < 2) return;
                }
                else
                {
                    delete normalizedNode.points;
                }
                if (node.type === 'place')
                {
                    normalizedNode.placeRef =
                        normalizeGeneographPlaceRef(
                            node,
                            board.projectId
                        );

                    if (!normalizedNode.placeRef)
                    {
                        return;
                    }

                    normalizedNode.placeSizeMode =
                        node.placeSizeMode === 'manual'
                            ? 'manual'
                            : 'auto';

                    delete normalizedNode.placeId;
                    delete normalizedNode.placeName;
                    delete normalizedNode.title;
                }
                else
                {
                    delete normalizedNode.placeRef;
                    delete normalizedNode.placeSizeMode;
                }
                if (node.type === 'panel')
                {
                    normalizedNode.title =
                        String(node.title ?? '')
                            .trim()
                            .slice(0, 160);

                    normalizedNode.description =
                        String(node.description || '')
                            .trim()
                            .slice(0, 500);
                }
                else
                {
                    delete normalizedNode.description;
                }

                if (node.type === 'image')
                {
                    const imageRef = normalizeGeneographImageRef(node);
                    normalizedNode.imageRef = imageRef;

                    // Preserve a genuinely custom legacy title as the new layer
                    // name, but do not retain duplicated media titles.
                    const legacyTitle = String(node.title || '').trim();

                    let referencedRecord = null;

                    if (imageRef?.scope === 'project')
                    {
                        referencedRecord = getPhoto(imageRef.id, {
                            projectId: board.projectId
                        });
                    }
                    else if (imageRef?.scope === 'board')
                    {
                        referencedRecord = diagram.assets.find(
                            asset => asset.id === imageRef.id
                        ) || null;
                    }

                    const implicitNames = new Set(
                        [
                            referencedRecord?.title,
                            referencedRecord?.displayName,
                            referencedRecord?.filename,
                            geneoFilenameStem(referencedRecord?.filename)
                        ]
                            .map(value => String(value || '').trim())
                            .filter(Boolean)
                    );

                    if (
                        !normalizedNode.name
                && legacyTitle
                && !implicitNames.has(legacyTitle)
                    )
                    {
                        normalizedNode.name = legacyTitle.slice(0, 80);
                    }

                    delete normalizedNode.photoId;
                    delete normalizedNode.title;
                }

                diagram.nodes.push(normalizedNode);
            });
        diagram.nodes.forEach(node =>
        {
            const parent = diagram.nodes.find(candidate => candidate.id === node.parentPanelId && candidate.type === 'panel');
            if (!parent || parent.id === node.id) node.parentPanelId = null;
        });
        pruneGeneographBoardAssets(diagram);
        const familyIds = new Set();
        (Array.isArray(source.families) ? source.families : []).forEach(family =>
        {
            if (!family || !family.id || familyIds.has(family.id)) return;
            const partnerIds = normalizeGeneographIdArray(family.partnerIds).filter(id => personIds.has(id)).slice(0, 2);
            const children = [];
            (Array.isArray(family.children) ? family.children : []).forEach(child =>
            {
                if (!child || !personIds.has(child.personId) || children.some(item => item.personId === child.personId)) return;
                children.push({ personId: child.personId, parentageType: String(child.parentageType || 'biological') });
            });
            if (!partnerIds.length && !children.length) return;
            familyIds.add(family.id);
            diagram.families.push({
                id: String(family.id),
                partnerIds,
                children,
                relationshipType: String(family.relationshipType || 'Married'),
                relationshipStatus: String(family.relationshipStatus || 'active'),
                marriageType: String(family.marriageType || ''),
                events: Array.isArray(family.events) ? family.events.map(event => ({ ...event, date: normalizeGenealogyDateInput(event.date || event) })) : []
            });
        });
        const connectionIds = new Set();
        (Array.isArray(source.connections) ? source.connections : []).forEach(connection =>
        {
            if (!connection || !connection.id || connectionIds.has(connection.id)) return;
            const sourceValid = connection.source?.nodeId ? nodeIds.has(connection.source.nodeId) : familyIds.has(connection.source?.familyId);
            const targetValid = connection.target?.nodeId ? nodeIds.has(connection.target.nodeId) : familyIds.has(connection.target?.familyId);
            if (!sourceValid || !targetValid) return;
            connectionIds.add(connection.id);
            diagram.connections.push({
                id: String(connection.id),
                kind: ['family-partner', 'family-child', 'family-sibling', 'visual'].includes(connection.kind) ? connection.kind : 'visual',
                name: normalizeGeneographLayerName(
                    connection.name
                ),
                familyId: familyIds.has(connection.familyId) ? connection.familyId : null,
                source: { ...connection.source }, target: { ...connection.target },
                style: {
                    pattern: connection.style?.pattern === 'dashed' ? 'dashed' : 'solid',
                    line: geneoPaintFromLegacy(
                        connection.style?.line,
                        connection.style?.color,
                        { color: '#D9E5E1', opacity: 100, enabled: true }
                    ),
                    width: Math.round(geneoNumber(
                        connection.style?.width,
                        2,
                        GENEO_STROKE_WIDTH_MIN,
                        GENEO_STROKE_WIDTH_MAX
                    ))
                },
                showRelationshipDates: connection.showRelationshipDates !== false,
                route: {
                    mode: connection.route?.mode === 'manual' ? 'manual' : 'auto',
                    waypoints: (Array.isArray(connection.route?.waypoints) ? connection.route.waypoints : []).map(point => ({
                        x: geneoNumber(point?.x, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                        y: geneoNumber(point?.y, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                    }))
                }
            });
        });
        board.diagram = diagram;
        delete board.people;
        delete board.evidence;
        delete board.questions;
        return board;
    });
    const boardIds = new Set(sampleData.boards.map(board => board.id));
    Object.keys(state.geneoBoardViewports || {}).forEach(boardId =>
    {
        if (!boardIds.has(boardId)) clearGeneographViewport(boardId);
    });
}

function geneoNodeDefaults(type)
{
    const common = {
        appearance: {
            fill: { color: '#18211F', opacity: 100, enabled: true },
            stroke: { color: '#52615D', opacity: 100, enabled: true },
            strokeWidth: 1,
            strokePattern: 'solid',
            text: { color: '#F1F5F3', opacity: 100, enabled: true }
        }
    };

    if (type === 'person')
    {
        const geometry =
            GENEO_PERSON_CARD_GEOMETRY
                .standard;

        return {
            ...common,

            appearance: {
                ...common.appearance,

                paintOverrides: {
                    fill: false,
                    stroke: false,
                    text: false
                }
            },

            width:
            geometry.width,

            height:
            geometry.height,

            /*
           * Normalization uses the full style
           * envelope, then applies the selected
           * style limits.
           */
            minWidth: 170,
            maxWidth: 600,
            minHeight: 100,
            maxHeight: 660
        };
    }

    if (type === 'image')
    {
        return {
            ...common,
            width: 280,
            height: 200,
            minWidth: 160,
            minHeight: 120
        };
    }

    if (type === 'sticky')
    {
        return {
            ...common,
            width: 220,
            height: 200,
            minWidth: 160,
            minHeight: 120,
            appearance: {
                ...common.appearance,
                fill: {
                    color: '#D4AA6B',
                    opacity: 100,
                    enabled: true
                },
                stroke: {
                    color: '#A77C3F',
                    opacity: 100,
                    enabled: true
                },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: {
                    color: '#241C10',
                    opacity: 100,
                    enabled: true
                }
            }
        };
    }

    if (type === 'text')
    {
        return {
            ...common,

            width: 320,
            height: 80,
            minWidth: 120,
            minHeight: 48,

            appearance: {
                ...common.appearance,

                /*
             * Text blocks are transparent by default.
             * The stored colors remain available so
             * Background / Stroke can be restored
             * directly from the Appearance inspector.
             */
                fill: {
                    ...common.appearance.fill,
                    enabled: false
                },

                stroke: {
                    ...common.appearance.stroke,
                    enabled: false
                },

                strokeWidth: 1,
                strokePattern: 'solid',

                text: {
                    ...common.appearance.text
                },

                cornerRadius: 8
            }
        };
    }

    if (type === 'shape')
    {
        return {
            ...common,
            width: 180,
            height: 120,
            minWidth: 60,
            minHeight: 60,
            appearance: {
                ...common.appearance,
                fill: { color: '#173029', opacity: 100, enabled: true },
                stroke: { color: '#62D99A', opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid',
                cornerRadius: 8
            }
        };
    }

    if (type === 'drawing')
    {
        return {
            ...common,
            width: 160,
            height: 100,
            minWidth: 12,
            minHeight: 12,
            appearance: {
                ...common.appearance,
                fill: { ...common.appearance.fill, enabled: false },
                stroke: { color: '#D9E5E1', opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid'
            }
        };
    }

    if (type === 'place')
    {
        return {
            ...common,
            width: 240,
            height: 54,
            minWidth: 96,
            minHeight: 44,
            appearance: {
                ...common.appearance,
                fill: { color: '#18211F', opacity: 100, enabled: true },
                stroke: { color: '#52615D', opacity: 100, enabled: true },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: { color: '#F1F5F3', opacity: 100, enabled: true }
            }
        };
    }

    return {
        ...common,
        width: 480,
        height: 320,
        minWidth: 240,
        minHeight: 180,

        appearance: {
            ...common.appearance,

            fill: {
                ...common.appearance.fill,
                opacity: 68
            },

            strokePattern: 'dashed'
        }
    };
}

function geneoNodeMinimumSize(
    node,
    width = node?.width
)
{
    if (node?.type === 'person')
    {
        return geneoPersonCardMinimumSize(
            node,
            width
        );
    }

    const defaults =
        geneoNodeDefaults(
            node?.type
        );

    return {
        width:
          defaults.minWidth,

        height:
          defaults.minHeight
    };
}

function geneoNodeMaximumSize(
    node
)
{
    if (node?.type === 'person')
    {
        const geometry =
            geneoPersonCardGeometry(
                node
            );

        return {
            width: geometry.maxWidth,
            height: geometry.maxHeight
        };
    }

    return {
        width: 10000,
        height: 10000
    };
}

function touchGeneographBoard(board = selectedGeneographBoard())
{
    if (!board) return;
    board.modifiedAt = new Date().toISOString();
    board.modified = 'Just now';
}

function geneoEnsureHistory()
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoHistoryRuntime.boardId !== boardId) geneoHistoryRuntime = { boardId, undo: [], redo: [] };
}

function geneoSnapshot()
{
    return JSON.stringify(selectedGeneographDiagram());
}

function geneoPushHistory()
{
    geneoEnsureHistory();
    const snapshot = geneoSnapshot();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoPushHistorySnapshot(snapshot)
{
    if (!snapshot) return;
    geneoEnsureHistory();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoRestoreSnapshot(
    snapshot
)
{
    const board =
        selectedGeneographBoard();

    if (!board || !snapshot)
    {
        return false;
    }

    try
    {
        board.diagram =
            JSON.parse(snapshot);

        state.geneoLayerRename = null;

        normalizeGeneographRuntimeData();
        touchGeneographBoard(board);

        return true;
    }
    catch (error)
    {
        console.warn(
            'Unable to restore Geneograph history',
            error
        );

        return false;
    }
}

function undoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.undo.pop();
    if (!snapshot) return;
    geneoHistoryRuntime.redo.push(geneoSnapshot());
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function redoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.redo.pop();
    if (!snapshot) return;
    geneoHistoryRuntime.undo.push(geneoSnapshot());
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function geneographBoardStats(board)
{
    const diagram = board?.diagram || createEmptyGeneographDiagram();
    const represented = new Set(diagram.nodes.filter(node => node.type === 'person').map(node => node.personId));
    return {
        people: represented.size,
        items: diagram.nodes.filter(node => node.type !== 'person').length,
        connections: diagram.connections.length
    };
}

function geneoSelectedNodeIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoNodeIds) ? state.selectedGeneoNodeIds : []);
}
function geneoSelectedConnectionIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoConnectionIds) ? state.selectedGeneoConnectionIds : []);
}
function selectedGeneographNodes()
{
    const selectedIds = geneoSelectedNodeIdSet();
    return selectedGeneographDiagram()?.nodes.filter(node => selectedIds.has(node.id)) || [];
}
function selectedGeneographConnections()
{
    const selectedIds = geneoSelectedConnectionIdSet();
    return selectedGeneographDiagram()?.connections.filter(connection => selectedIds.has(connection.id)) || [];
}
function selectedGeneographNode()
{
    return getGeneographNode(state.selectedGeneoNodeId);
}
function selectedGeneographConnection()
{
    return getGeneographConnection(state.selectedGeneoConnectionId);
}
function pruneGeneographSelection()
{
    const nodeIds = [...geneoSelectedNodeIdSet()].filter(id => Boolean(getGeneographNode(id)));
    const connectionIds = [...geneoSelectedConnectionIdSet()].filter(id => Boolean(getGeneographConnection(id)));
    state.selectedGeneoNodeIds = nodeIds;
    state.selectedGeneoConnectionIds = connectionIds;
    if (!nodeIds.includes(state.selectedGeneoNodeId)) state.selectedGeneoNodeId = nodeIds.at(-1) || null;
    if (!connectionIds.includes(state.selectedGeneoConnectionId))
    {
        state.selectedGeneoConnectionId = connectionIds.at(-1) || null;
        state.selectedGeneoWaypointIndex = null;
    }
}
function selectGeneographCanvas()
{
    state.selectedGeneoNodeId = null; state.selectedGeneoNodeIds = []; state.selectedGeneoConnectionId = null; state.selectedGeneoConnectionIds = []; state.selectedGeneoWaypointIndex = null;
}
function setGeneographSelection(nodeIds = [], connectionIds = [], primary = {})
{
    const validIds = [...new Set(Array.isArray(nodeIds) ? nodeIds : [])].filter(id => Boolean(getGeneographNode(id)));
    const validConnectionIds = [...new Set(Array.isArray(connectionIds) ? connectionIds : [])].filter(id => Boolean(getGeneographConnection(id)));
    state.selectedGeneoNodeIds = validIds;
    state.selectedGeneoConnectionIds = validConnectionIds;
    state.selectedGeneoNodeId = validIds.includes(primary.nodeId) ? primary.nodeId : validIds.at(-1) || null;
    state.selectedGeneoConnectionId = validConnectionIds.includes(primary.connectionId) ? primary.connectionId : validConnectionIds.at(-1) || null;
    state.selectedGeneoWaypointIndex = null;
}
function setGeneographNodeSelection(nodeIds, primaryId = '')
{
    setGeneographSelection(nodeIds, [], { nodeId: primaryId });
}
function selectGeneographNode(nodeId, options = {})
{
    const id = getGeneographNode(nodeId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    const current = geneoSelectedNodeIdSet();
    if (options.toggle)
    {
        if (current.has(id)) current.delete(id); else current.add(id);
        setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: current.has(id) ? id : [...current].at(-1) });
    }
    else if (options.add)
    {
        current.add(id); setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: id });
    }
    else
    {
        setGeneographNodeSelection([id], id);
    }
}
function selectGeneographConnection(connectionId, waypointIndex = null, options = {})
{
    const id = getGeneographConnection(connectionId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    if (options.toggle || options.add)
    {
        const nodes = [...geneoSelectedNodeIdSet()];
        const connections = geneoSelectedConnectionIdSet();
        if (options.toggle && connections.has(id)) connections.delete(id); else connections.add(id);
        setGeneographSelection(nodes, [...connections], { connectionId: connections.has(id) ? id : [...connections].at(-1) });
    }
    else
    {
        setGeneographSelection([], [id], { connectionId: id });
    }
    state.selectedGeneoWaypointIndex = Number.isInteger(waypointIndex) && state.selectedGeneoConnectionId === id ? waypointIndex : null;
}

function geneoNodeEffectiveVisible(node)
{
    if (!node?.visible) return false;
    const parent = getGeneographNode(node.parentPanelId);
    return !parent || geneoNodeEffectiveVisible(parent);
}

function geneoConnectionReferenceNodes(reference)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !reference) return [];

    if (reference.nodeId)
    {
        const node = getGeneographNode(reference.nodeId);
        return node ? [node] : [];
    }

    if (!reference.familyId) return [];

    const family = getGeneographFamily(reference.familyId);
    if (!family) return [];

    const partnerIds = new Set(
        family.partnerIds || []
    );

    return diagram.nodes.filter(node =>
        node.type === 'person'
        && partnerIds.has(node.personId)
    );
}

function geneoConnectionReferenceEffectiveVisible(reference)
{
    const nodes = geneoConnectionReferenceNodes(reference);

    return nodes.length > 0
        && nodes.every(geneoNodeEffectiveVisible);
}

function geneoConnectionEffectiveVisible(connection)
{
    return Boolean(
        connection
        && geneoConnectionReferenceEffectiveVisible(
            connection.source
        )
        && geneoConnectionReferenceEffectiveVisible(
            connection.target
        )
    );
}

function geneoNodeEffectiveLocked(node)
{
    if (!node) return true;
    const parent = getGeneographNode(node.parentPanelId);
    return node.locked || (parent ? geneoNodeEffectiveLocked(parent) : false);
}

function geneoNodeFullyInsidePanel(node, panel)
{
    return Boolean(node && panel && panel.type === 'panel' && node.id !== panel.id
        && node.x >= panel.x
        && node.y >= panel.y
        && node.x + node.width <= panel.x + panel.width
        && node.y + node.height <= panel.y + panel.height);
}

function geneoContainingPanelForNode(node)
{
    return selectedGeneographDiagram().nodes
        .filter(item => item.type === 'panel' && item.id !== node?.id && geneoNodeEffectiveVisible(item))
        .sort((a, b) => b.order - a.order)
        .find(panel => geneoNodeFullyInsidePanel(node, panel)) || null;
}

function reconcileGeneographPanelMembership(panelId)
{
    const diagram = selectedGeneographDiagram();
    const panel = getGeneographNode(panelId);
    if (!diagram || panel?.type !== 'panel') return false;
    let changed = false;
    diagram.nodes.forEach(node =>
    {
        if (node.id === panel.id || node.type === 'panel') return;
        const inside = geneoNodeEffectiveVisible(node) && geneoNodeFullyInsidePanel(node, panel);
        if (inside && node.parentPanelId !== panel.id)
        {
            node.parentPanelId = panel.id;
            changed = true;
        }
        else if (!inside && node.parentPanelId === panel.id)
        {
            node.parentPanelId = null;
            changed = true;
        }
    });
    return changed;
}

function geneoDefaultNodeTitle(node)
{
    if (!node) return 'Canvas';

    if (node.type === 'person')
    {
        return geneoPersonDisplayName(
            getGeneographPerson(node.personId)
        );
    }

    if (node.type === 'image')
    {
        return geneoImageSourceName(node);
    }

    if (node.type === 'panel')
    {
        return node.title || 'Panel';
    }

    if (node.type === 'shape')
    {
        return geneoShapeLabel(node.shapeKind);
    }

    if (node.type === 'place')
    {
        return resolveGeneographPlace(node).name;
    }

    if (node.type === 'drawing')
    {
        return 'Pencil stroke';
    }

    /*
      * Sticky content is independent from its layer
      * identity. Users can provide a custom layer name
      * through the Layer section.
      */
    if (node.type === 'sticky')
    {
        return 'Sticky note';
    }

    return (
        String(node.text || 'Text')
            .split(/\r?\n/)[0]
        || 'Untitled'
    );
}

function geneoNodeTitle(node)
{
    return (
        normalizeGeneographLayerName(
            node?.name
        )
        || geneoDefaultNodeTitle(node)
    );
}

function geneoNodeIcon(type)
{
    return type === 'person'
        ? icon.profile
        : type === 'image'
            ? icon.image
            : type === 'sticky'
                ? icon.note
                : type === 'text'
                    ? icon.text
                    : type === 'place'
                        ? icon.mapPin
                        : type === 'drawing'
                            ? icon.edit
                            : icon.shape;
}

function geneoContentBounds(diagram = selectedGeneographDiagram())
{
    const extents = [];
    (diagram?.nodes || []).forEach(node =>
    {
        extents.push({ x: node.x, y: node.y });
        extents.push({ x: node.x + node.width, y: node.y + node.height });
    });
    (diagram?.connections || []).forEach(connection =>
    {
        (connection.route?.waypoints || []).forEach(point => extents.push(point));
    });
    (diagram?.families || []).forEach(family =>
    {
        if (family.partnerIds.length === 2) extents.push(geneoFamilyJunction(family.id));
    });
    if (!extents.length) return { left: -300, top: -220, right: 300, bottom: 220, width: 600, height: 440 };
    const xs = extents.map(point => point.x);
    const ys = extents.map(point => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { left, top, right, bottom, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function geneoDerivedCanvasBounds(diagram = selectedGeneographDiagram())
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoCanvasRuntime.boardId !== boardId)
    {
        geneoCanvasRuntime = createGeneoCanvasRuntime(boardId);
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const viewportWidth = Math.max(900, (wrap?.clientWidth || main.clientWidth || 1200) / zoom);
    const viewportHeight = Math.max(640, (wrap?.clientHeight || main.clientHeight || 760) / zoom);
    const content = geneoContentBounds(diagram);
    let left = Math.floor((content.left - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let top = Math.floor((content.top - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let right = Math.ceil((content.right + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let bottom = Math.ceil((content.bottom + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    const previous = geneoCanvasRuntime.bounds;
    if (previous)
    {
        left = Math.min(left, previous.left);
        top = Math.min(top, previous.top);
        right = Math.max(right, previous.right);
        bottom = Math.max(bottom, previous.bottom);
    }
    const minimumWidth = viewportWidth + GENEO_CANVAS_MARGIN * 2;
    const minimumHeight = viewportHeight + GENEO_CANVAS_MARGIN * 2;
    if (right - left < minimumWidth)
    {
        const extra = (minimumWidth - (right - left)) / 2;
        left -= extra;
        right += extra;
    }
    if (bottom - top < minimumHeight)
    {
        const extra = (minimumHeight - (bottom - top)) / 2;
        top -= extra;
        bottom += extra;
    }
    left = Math.max(-GENEO_WORLD_LIMIT, left);
    top = Math.max(-GENEO_WORLD_LIMIT, top);
    right = Math.min(GENEO_WORLD_LIMIT, right);
    bottom = Math.min(GENEO_WORLD_LIMIT, bottom);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function geneoCurrentViewportCenter()
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + wrap.clientWidth / 2) / zoom,
        y: bounds.top + (wrap.scrollTop + wrap.clientHeight / 2) / zoom
    };
}

function geneoSavedViewport(boardId = selectedGeneographBoard()?.id)
{
    const saved = boardId ? state.geneoBoardViewports?.[boardId] : null;
    if (!saved || !Number.isFinite(saved.center?.x) || !Number.isFinite(saved.center?.y) || !Number.isFinite(saved.zoom)) return null;
    return saved;
}

function captureGeneographViewport(boardId = selectedGeneographBoard()?.id)
{
    if (!boardId) return null;
    const center = geneoCurrentViewportCenter() || geneoSavedViewport(boardId)?.center;
    if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y)) return null;
    const saved = {
        center: { x: center.x, y: center.y },
        zoom: Math.max(25, Math.min(200, Math.round(state.geneoZoom)))
    };
    state.geneoBoardViewports[boardId] = saved;
    return saved;
}

function clearGeneographViewport(boardId)
{
    if (boardId && state.geneoBoardViewports) delete state.geneoBoardViewports[boardId];
}

function restoreGeneographViewportCenter(point)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds || !point) return false;
    const zoom = state.geneoZoom / 100;
    wrap.scrollLeft = (point.x - bounds.left) * zoom - wrap.clientWidth / 2;
    wrap.scrollTop = (point.y - bounds.top) * zoom - wrap.clientHeight / 2;
    return true;
}

function cancelGeneographViewportRestore({ releaseSuppression = false } = {})
{
    if (geneoCanvasRuntime.viewportReleaseFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.viewportReleaseFrame);
    }
    geneoCanvasRuntime.viewportReleaseFrame = null;
    geneoCanvasRuntime.viewportRestoreToken += 1;
    if (releaseSuppression) geneoCanvasRuntime.suppressEdgeExpansion = false;
}

function cancelGeneographEdgeExpansion({ pending = false } = {})
{
    if (geneoCanvasRuntime.edgeExpansionFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    }
    geneoCanvasRuntime.edgeExpansionFrame = null;
    if (pending) geneoCanvasRuntime.pendingEdgeExpansion = true;
}

function scheduleGeneographViewportRestore(point, afterRestore = null)
{
    const boardId = selectedGeneographBoard()?.id || '';
    cancelGeneographViewportRestore();
    const token = geneoCanvasRuntime.viewportRestoreToken;
    geneoCanvasRuntime.suppressEdgeExpansion = true;

    if (
        selectedGeneographBoard()?.id !== boardId
    )
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    if (point && !restoreGeneographViewportCenter(point))
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    afterRestore?.();
    captureGeneographViewport(boardId);

    /*
       * Restoration must complete before another pointer gesture can begin.
       * A frame is used only to release edge-expansion suppression after the
       * browser has painted the already-restored viewport.
       */
    geneoCanvasRuntime.viewportReleaseFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.viewportReleaseFrame = null;
        if (
            token !== geneoCanvasRuntime.viewportRestoreToken
          || selectedGeneographBoard()?.id !== boardId
        )
        {
            return;
        }
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        if (geneoCanvasRuntime.pendingEdgeExpansion && !geneoPointerState)
        {
            geneoCanvasRuntime.pendingEdgeExpansion = false;
            expandGeneographCanvasNearEdge();
        }
    });
}

function geneoViewportPointAtClient(clientX, clientY)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const rect = wrap.getBoundingClientRect();
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + clientX - rect.left) / zoom,
        y: bounds.top + (wrap.scrollTop + clientY - rect.top) / zoom
    };
}

function applyGeneographZoomToDom(options = {})
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const boardSpace = wrap?.querySelector('.geneo-board-space');
    const stage = boardSpace?.querySelector('[data-geneo-stage]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !boardSpace || !stage || !bounds) return false;
    const zoom = state.geneoZoom / 100;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    boardSpace.style.width = `${bounds.width * zoom}px`;
    boardSpace.style.height = `${bounds.height * zoom}px`;
    boardSpace.style.setProperty('--geneo-canvas-zoom', zoom);
    boardSpace.style.setProperty('--geneo-grid-origin-x', `${gridOriginX}px`);
    boardSpace.style.setProperty('--geneo-grid-origin-y', `${gridOriginY}px`);
    stage.style.transform = `scale(${zoom})`;
    const value = main.querySelector('.geneo-zoom-value');
    if (value) value.textContent = `${state.geneoZoom}%`;
    if (options.anchor)
    {
        const rect = wrap.getBoundingClientRect();
        wrap.scrollLeft = (options.anchor.x - bounds.left) * zoom - (options.clientX - rect.left);
        wrap.scrollTop = (options.anchor.y - bounds.top) * zoom - (options.clientY - rect.top);
    }
    else if (options.center)
    {
        wrap.scrollLeft = (options.center.x - bounds.left) * zoom - wrap.clientWidth / 2;
        wrap.scrollTop = (options.center.y - bounds.top) * zoom - wrap.clientHeight / 2;
    }
    if (geneoCanvasRuntime.zoomSettleFrame) cancelAnimationFrame(geneoCanvasRuntime.zoomSettleFrame);
    captureGeneographViewport();
    geneoCanvasRuntime.zoomSettleFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomSettleFrame = null;
        geneoCanvasRuntime.zooming = false;
        geneoCanvasRuntime.suppressEdgeExpansion = false;
    });
    return true;
}

function setGeneographZoom(nextZoom, options = {})
{
    const zoom = Math.max(25, Math.min(200, Math.round(nextZoom)));
    if (zoom === state.geneoZoom) return false;
    const center = options.center || (!options.anchor ? geneoCurrentViewportCenter() : null);
    cancelGeneographViewportRestore({ releaseSuppression: true });
    if (geneoCanvasRuntime.edgeExpansionFrame) cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    geneoCanvasRuntime.edgeExpansionFrame = null;
    geneoCanvasRuntime.zooming = true;
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    state.geneoZoom = zoom;
    return applyGeneographZoomToDom({ ...options, center });
}

function queueGeneographWheelZoom(event)
{
    event.preventDefault();
    geneoCanvasRuntime.zoomDelta = (Number.isFinite(geneoCanvasRuntime.zoomDelta) ? geneoCanvasRuntime.zoomDelta : 0) + event.deltaY;
    geneoCanvasRuntime.zoomClientX = event.clientX;
    geneoCanvasRuntime.zoomClientY = event.clientY;
    if (geneoCanvasRuntime.zoomFrame) return;
    geneoCanvasRuntime.zoomFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomFrame = null;
        const delta = geneoCanvasRuntime.zoomDelta;
        geneoCanvasRuntime.zoomDelta = 0;
        if (!delta) return;
        const clientX = geneoCanvasRuntime.zoomClientX;
        const clientY = geneoCanvasRuntime.zoomClientY;
        const anchor = geneoViewportPointAtClient(clientX, clientY);
        setGeneographZoom(state.geneoZoom + (delta < 0 ? 10 : -10), { anchor, clientX, clientY });
    });
}

function geneoContentCenter()
{
    const content = geneoContentBounds();
    return { x: (content.left + content.right) / 2, y: (content.top + content.bottom) / 2 };
}

function expandGeneographCanvasNearEdge()
{
    if (
        geneoCanvasRuntime.suppressEdgeExpansion
        || geneoCanvasRuntime.zooming
        || geneoPointerState
    )
    {
        geneoCanvasRuntime.pendingEdgeExpansion = true;
        return;
    }
    if (geneoCanvasRuntime.edgeExpansionFrame) return;
    geneoCanvasRuntime.edgeExpansionFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.edgeExpansionFrame = null;
        if (
            geneoCanvasRuntime.suppressEdgeExpansion
          || geneoCanvasRuntime.zooming
          || geneoPointerState
        )
        {
            geneoCanvasRuntime.pendingEdgeExpansion = true;
            return;
        }
        const wrap = main.querySelector('[data-geneo-canvas-wrap]');
        const bounds = geneoCanvasRuntime.bounds;
        if (!wrap || !bounds) return;
        const center = geneoCurrentViewportCenter();
        const zoom = state.geneoZoom / 100;
        const threshold = GENEO_CANVAS_EDGE_THRESHOLD;
        const expansion = GENEO_CANVAS_EXPANSION;
        const next = { ...bounds };
        if (wrap.scrollLeft < threshold && next.left > -GENEO_WORLD_LIMIT) next.left = Math.max(-GENEO_WORLD_LIMIT, next.left - expansion);
        if (wrap.scrollTop < threshold && next.top > -GENEO_WORLD_LIMIT) next.top = Math.max(-GENEO_WORLD_LIMIT, next.top - expansion);
        if (wrap.scrollLeft + wrap.clientWidth > bounds.width * zoom - threshold && next.right < GENEO_WORLD_LIMIT) next.right = Math.min(GENEO_WORLD_LIMIT, next.right + expansion);
        if (wrap.scrollTop + wrap.clientHeight > bounds.height * zoom - threshold && next.bottom < GENEO_WORLD_LIMIT) next.bottom = Math.min(GENEO_WORLD_LIMIT, next.bottom + expansion);
        geneoCanvasRuntime.pendingEdgeExpansion = false;
        if (next.left === bounds.left && next.top === bounds.top && next.right === bounds.right && next.bottom === bounds.bottom) return;
        next.width = next.right - next.left;
        next.height = next.bottom - next.top;
        geneoCanvasRuntime.bounds = next;
        renderGeneographEditorPreserveCenter(center);
    });
}

function geneoCanvasPointForNode(node, port = 'bottom')
{
    if (!node) return { x: 0, y: 0 };
    if (port === 'top') return { x: node.x + node.width / 2, y: node.y };
    if (port === 'left') return { x: node.x, y: node.y + node.height / 2 };
    if (port === 'right') return { x: node.x + node.width, y: node.y + node.height / 2 };
    return { x: node.x + node.width / 2, y: node.y + node.height };
}

function geneoPartnerConnectionForFamily(familyId)
{
    return selectedGeneographDiagram()?.connections.find(connection =>
        connection.kind === 'family-partner'
        && connection.familyId === familyId
        && connection.source?.nodeId
        && connection.target?.nodeId
    ) || null;
}

function geneoPolylineMidpoint(points)
{
    const segments = (Array.isArray(points) ? points : []).slice(0, -1).map((start, index) =>
    {
        const end = points[index + 1];
        return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) };
    }).filter(segment => segment.length > 0);
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    if (!segments.length || !totalLength) return null;
    let remaining = totalLength / 2;
    for (const segment of segments)
    {
        if (remaining <= segment.length)
        {
            const progress = remaining / segment.length;
            return {
                x: segment.start.x + (segment.end.x - segment.start.x) * progress,
                y: segment.start.y + (segment.end.y - segment.start.y) * progress
            };
        }
        remaining -= segment.length;
    }
    return { ...segments.at(-1).end };
}

function geneoFamilyJunction(familyId)
{
    const family = getGeneographFamily(familyId);
    const nodes = (family?.partnerIds || []).map(personId => selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)).filter(Boolean);
    if (!nodes.length) return { x: 0, y: 0 };
    if (nodes.length === 1) return geneoCanvasPointForNode(nodes[0], 'bottom');
    const partnerConnection = geneoPartnerConnectionForFamily(familyId);
    const routedMidpoint = partnerConnection ? geneoPolylineMidpoint(geneoConnectionPoints(partnerConnection)) : null;
    if (routedMidpoint) return routedMidpoint;
    const first = geneoCanvasPointForNode(nodes[0], nodes[0].x < nodes[1].x ? 'right' : 'left');
    const second = geneoCanvasPointForNode(nodes[1], nodes[0].x < nodes[1].x ? 'left' : 'right');
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function geneoConnectionPoint(reference)
{
    if (reference?.familyId) return geneoFamilyJunction(reference.familyId);
    return geneoCanvasPointForNode(getGeneographNode(reference?.nodeId), reference?.port);
}

function geneoConnectionPoints(connection)
{
    const start = geneoConnectionPoint(connection.source);
    const end = geneoConnectionPoint(connection.target);
    if (connection.route?.mode === 'manual' && connection.route.waypoints?.length) return [start, ...connection.route.waypoints, end];
    if (connection.kind === 'family-sibling' && connection.source?.port === 'top' && connection.target?.port === 'top')
    {
        const routeY = snapGeneographCoordinate(Math.min(start.y, end.y) - GENEO_TOP_ROUTE_CLEARANCE);
        return [start, { x: start.x, y: routeY }, { x: end.x, y: routeY }, end];
    }
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(connection.source?.port) || connection.source?.familyId;
    if (vertical)
    {
        const midY = Math.round((start.y + end.y) / 2); return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }
    const midX = Math.round((start.x + end.x) / 2); return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

function geneoPolylinePath(points)
{
    return points.map((point, index) => `${index ? 'L' : 'M'} ${Math.round(point.x)} ${Math.round(point.y)}`).join(' ');
}

function geneoProjectedPointOnSegment(point, start, end)
{
    const horizontal = Math.abs(start.y - end.y) <= Math.abs(start.x - end.x);
    if (horizontal)
    {
        return {
            x: Math.max(Math.min(start.x, end.x), Math.min(Math.max(start.x, end.x), point.x)),
            y: start.y
        };
    }

    return {
        x: start.x,
        y: Math.max(Math.min(start.y, end.y), Math.min(Math.max(start.y, end.y), point.y))
    };
}

function geneoPointInsideRect(point, rect)
{
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function geneoSegmentOrientation(first, second, third)
{
    const value = (second.y - first.y) * (third.x - second.x) - (second.x - first.x) * (third.y - second.y);
    return Math.abs(value) < .001 ? 0 : value > 0 ? 1 : 2;
}

function geneoPointOnSegment(first, point, second)
{
    return point.x <= Math.max(first.x, second.x) + .001 && point.x >= Math.min(first.x, second.x) - .001
        && point.y <= Math.max(first.y, second.y) + .001 && point.y >= Math.min(first.y, second.y) - .001;
}

function geneoSegmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)
{
    const firstA = geneoSegmentOrientation(firstStart, firstEnd, secondStart);
    const firstB = geneoSegmentOrientation(firstStart, firstEnd, secondEnd);
    const secondA = geneoSegmentOrientation(secondStart, secondEnd, firstStart);
    const secondB = geneoSegmentOrientation(secondStart, secondEnd, firstEnd);
    if (firstA !== firstB && secondA !== secondB) return true;
    if (firstA === 0 && geneoPointOnSegment(firstStart, secondStart, firstEnd)) return true;
    if (firstB === 0 && geneoPointOnSegment(firstStart, secondEnd, firstEnd)) return true;
    if (secondA === 0 && geneoPointOnSegment(secondStart, firstStart, secondEnd)) return true;
    return secondB === 0 && geneoPointOnSegment(secondStart, firstEnd, secondEnd);
}

function geneoConnectionIntersectsRect(connection, rect)
{
    if (!geneoConnectionEffectiveVisible(connection)) return false;
    const corners = [
        { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    const points = geneoConnectionPoints(connection);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect) || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function geneoDrawingWorldPoints(node)
{
    if (node?.type !== 'drawing') return [];
    return normalizeGeneographDrawingPoints(node.points).map(point => ({
        x: node.x + point.x * node.width,
        y: node.y + point.y * node.height
    }));
}

function geneoDrawingIntersectsRect(node, rect)
{
    const points = geneoDrawingWorldPoints(node);
    if (points.length < 2) return false;
    const corners = [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom },
        { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect)
          || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function insertGeneographWaypoint(connectionId, point, requestedSegmentIndex = null)
{
    const connection = getGeneographConnection(connectionId);
    if (!connection || !point) return false;
    const points = geneoConnectionPoints(connection);
    if (points.length < 2) return false;
    let segmentIndex = Number.isInteger(requestedSegmentIndex) ? requestedSegmentIndex : 0;
    let insertionPoint = null;
    let bestDistance = Infinity;
    points.slice(0, -1).forEach((start, index) =>
    {
        if (Number.isInteger(requestedSegmentIndex) && index !== requestedSegmentIndex) return;
        const projected = geneoProjectedPointOnSegment(point, start, points[index + 1]);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < bestDistance)
        {
            bestDistance = distance;
            segmentIndex = index;
            insertionPoint = projected;
        }
    });
    if (!insertionPoint || points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    insertionPoint = snapGeneographPoint(insertionPoint);
    if (points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    const waypoints = connection.route?.mode === 'manual'
        ? connection.route.waypoints.map(existing => ({ ...existing }))
        : points.slice(1, -1).map(existing => snapGeneographPoint(existing));
    const insertAt = Math.max(0, Math.min(segmentIndex, waypoints.length));
    geneoPushHistory();
    waypoints.splice(insertAt, 0, insertionPoint);
    connection.route = { mode: 'manual', waypoints };
    touchGeneographBoard();
    selectGeneographConnection(connection.id, insertAt);
    renderGeneographEditorPreserveScroll();
    return true;
}

function geneoConnectionPreviewPoints(reference, end)
{
    const start = geneoConnectionPoint(reference);
    if (!end) return [start, start];
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(reference?.port) || reference?.familyId;
    if (vertical) return [start, { x: start.x, y: end.y }, end];
    return [start, { x: end.x, y: start.y }, end];
}

function renderGeneographConnectors()
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return '';
    const bounds = geneoCanvasRuntime.bounds || geneoDerivedCanvasBounds(diagram);
    const previewPath = state.geneoConnectionDraft
        ? geneoPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoCanvasRuntime.connectionPreviewPoint))
        : '';
    const selectedConnectionIds = geneoSelectedConnectionIdSet();
    const connectionPaintRank = connection => connection.kind === 'family-partner'
        ? 2
        : selectedConnectionIds.has(connection.id) ? 1 : 0;
    const orderedConnections = diagram.connections
        .filter(geneoConnectionEffectiveVisible)
        .sort((first, second) =>
            connectionPaintRank(first)
          - connectionPaintRank(second)
        );
    return `<svg class="geneo-connections" viewBox="${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}" style="--geneo-connection-hit-width:${14 / Math.max(.25, state.geneoZoom / 100)}px;--geneo-segment-hit-width:${18 / Math.max(.25, state.geneoZoom / 100)}px" aria-label="Board connections">
        ${orderedConnections.map(connection =>
        {
            const selected = selectedConnectionIds.has(connection.id);
            const points = geneoConnectionPoints(connection);
            const path = geneoPolylinePath(points);
            const linePaint = connection.style.line;
            const dash = connection.style.pattern === 'dashed' ? 'stroke-dasharray="8 7"' : '';
            const familyJunction = connection.kind === 'family-partner' && connection.familyId
                ? geneoFamilyJunction(connection.familyId)
                : null;
            return `<g class="geneo-connection ${selected ? 'selected' : ''} ${linePaint.enabled ? '' : 'no-stroke'}" data-geneo-connection-group="${escapeHtml(connection.id)}">
            <path class="geneo-connection-hit" d="${path}" data-geneo-connection="${escapeHtml(connection.id)}"></path>
            ${selected ? points.slice(0, -1).map((point, index) =>
            {
                const next = points[index + 1];
                return index > 0 && index < points.length - 2 ? `<line class="geneo-segment-hit" x1="${point.x}" y1="${point.y}" x2="${next.x}" y2="${next.y}" data-geneo-segment="${index}" data-geneo-connection="${escapeHtml(connection.id)}"></line>` : '';
            }).join('') : ''}
            <path class="geneo-connection-line" d="${path}" stroke="${escapeHtml(geneoPaintCssColor(linePaint))}" stroke-width="${connection.style.width}" ${dash}></path>
            <path class="geneo-connection-selection-guide" d="${path}"></path>
            ${renderGeneographRelationshipDateLabel(connection, points)}
            ${selected && connection.route.mode === 'manual' ? connection.route.waypoints.map((point, index) => `<circle class="geneo-waypoint ${state.selectedGeneoConnectionId === connection.id && state.selectedGeneoWaypointIndex === index ? 'selected' : ''}" cx="${point.x}" cy="${point.y}" r="6" data-geneo-waypoint="${index}" data-geneo-connection="${escapeHtml(connection.id)}"></circle>`).join('') : ''}
            ${familyJunction ? `<circle class="geneo-family-junction" cx="${familyJunction.x}" cy="${familyJunction.y}" r="7" data-geneo-family-junction="${escapeHtml(connection.familyId)}" tabindex="0"><title>Connect child to this family</title></circle>` : ''}
          </g>`;
        }).join('')}
        ${state.geneoConnectionDraft ? `<path class="geneo-connection-preview" data-geneo-connection-preview d="${previewPath}"></path>` : ''}
        <path class="geneo-pencil-preview" data-geneo-pencil-preview hidden></path>
      </svg>`;
}

function geneoPersonAvatarModel(person)
{
    const board =
        selectedGeneographBoard();

    const treePerson =
        person?.treePersonId
            ? getPerson(person.treePersonId)
            : null;

    const photoId =
        person?.photoId
        || treePerson?.primaryPhotoId
        || '';

    const usesTreePhoto =
        Boolean(
            treePerson
          && photoId
          && photoId === treePerson.primaryPhotoId
        );

    const displayName =
        geneoPersonDisplayName(person);

    return {
        id:
          `geneo-avatar-${person?.id || 'unknown'}`,
        projectId:
          board?.projectId
          || treePerson?.projectId
          || '',
        names: {
            ...normalizeGeneographPersonNames(person),
            display: displayName,
            initials:
            geneoPersonInitials(person)
        },
        primaryPhotoId: photoId,
        primaryPhotoCrop:
          usesTreePhoto
              ? treePerson.primaryPhotoCrop
              : person?.photoCrop,
        avatarClass:
          treePerson?.avatarClass
          || ''
    };
}

function geneoPersonCardLifeSpan(
    person,
    dateFormat = 'full'
)
{
    const birth =
        geneoPersonCardVitalDateLabel(
            person?.birth,
            dateFormat
        );

    const death =
        person?.livingStatus ===
        'Deceased'
            ? geneoPersonCardVitalDateLabel(
                person?.death,
                dateFormat
            )
            : '';

    if (birth && death)
    {
        return `${birth} – ${death}`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return '';
}

function renderGeneographPersonLifeEvent(
    label,
    event
)
{
    if (
        !event
        || (
            !event.date
          && !event.place
        )
    )
    {
        return '';
    }

    return `
        <div class="geneo-person-life-event">
          <span
            class="geneo-person-life-event-kind">
            ${escapeHtml(label)}
          </span>

          <span
            class="geneo-person-life-event-value">
            ${
                event.date
                    ? `
                  <span
                    class="geneo-person-life-event-date"
                    title="${escapeHtml(
                        event.date
                    )}">
                    ${escapeHtml(
                        event.date
                    )}
                  </span>
                `
                    : ''
            }

            ${
                event.date
              && event.place
                    ? `
                  <span
                    class="geneo-person-life-event-separator"
                    aria-hidden="true">
                    ·
                  </span>
                `
                    : ''
            }

            ${
                event.place
                    ? `
                  <span
                    class="geneo-person-life-event-place"
                    title="${escapeHtml(
                        event.place
                    )}">
                    ${escapeHtml(
                        event.place
                    )}
                  </span>
                `
                    : ''
            }
          </span>
        </div>
      `;
}

function renderGeneographPersonAddRelativeAction(node)
{
    const displayName = geneoPersonCardViewModel(node)?.displayName
        || geneoNodeTitle(node);
    return `
        <button
          class="geneo-person-add-relative"
          type="button"
          data-geneo-add-relative="${escapeHtml(node.id)}"
          aria-label="${escapeHtml(`Add relative to ${displayName}`)}"
          aria-haspopup="dialog"
          aria-expanded="false"
          title="Add relative">
          ${icon.plus}
        </button>
      `;
}

function renderGeneographPersonNode(
    node
)
{
    const model =
        geneoPersonCardViewModel(
            node
        );

    const person =
        model.person;

    if (!person) return '';

    const identityTitle =
        model.maidenName
            ? `${
                model.displayName
            } (${model.maidenName})`
            : model.displayName;

    const avatar =
        model.showPhoto
            ? renderPersonAvatar(
                geneoPersonAvatarModel(
                    person
                ),
                'geneo-person-avatar'
            )
            : '';

    const compactStyle =
        ![
            'standard',
            'portrait'
        ].includes(
            model.settings.style
        );

    const compactLife =
        [
            model.lifeSpan,
            model.displayStatus
        ]
            .filter(Boolean)
            .join(' · ');

    const statusContent =
        model.displayStatus
            ? `
            <span
              class="
                geneo-person-status
                status-dot
                ${statusDotClass(
                    model.displayStatus
                )}
              ">
              ${escapeHtml(
                    model.displayStatus
                )}
            </span>
          `
            : '';

    const lifeContent =
        compactStyle
            ? compactLife
                ? `
              <span
                class="geneo-person-life-summary"
                title="${escapeHtml(
                    compactLife
                )}">
                ${escapeHtml(
                    compactLife
                )}
              </span>
            `
                : ''
            : `
            ${
                model.structuredLife
                    ? `
                  <div
                    class="geneo-person-life-events">
                    ${renderGeneographPersonLifeEvent(
                        'Born',
                        model.birthEvent
                    )}

                    ${renderGeneographPersonLifeEvent(
                        'Died',
                        model.deathEvent
                    )}
                  </div>
                `
                    : model.lifeSpan
                        ? `
                    <span
                      class="geneo-person-life-span"
                      title="${escapeHtml(
                            model.lifeSpan
                        )}">
                      ${escapeHtml(
                            model.lifeSpan
                        )}
                    </span>
                  `
                        : ''
            }

            ${statusContent}
          `;

    const linkIndicator =
        model.linked
            ? `
            <span
              class="
                geneo-person-link-indicator
                ${
                    person.syncState === 'modified'
                        ? 'modified'
                        : ''
                }
              "
              role="img"
              aria-label="${escapeHtml(
                    model.linkTitle
                )}"
              title="${escapeHtml(
                    model.linkTitle
                )}">
              ${icon.link}
            </span>
          `
            : '';

    return `
        <div
          class="
            geneo-person-node-content
            ${
                model.showPhoto
                    ? ''
                    : 'no-photo'
            }
          ">
          ${avatar}

          <div
            class="geneo-person-identity-block">
            <span
              class="geneo-person-name-wrap"
              title="${escapeHtml(
                    identityTitle
                )}">
              <strong
                class="geneo-person-name">
                ${escapeHtml(
                    model.displayName
                )}
              </strong>

              ${
                    model.maidenName
                        ? `
                    <span
                      class="geneo-person-maiden"
                      title="${escapeHtml(
                            `Maiden surname: ${model.maidenName}`
                        )}">
                      (${escapeHtml(
                            model.maidenName
                        )})
                    </span>
                  `
                        : ''
                }
            </span>
          </div>

          ${
                lifeContent
                    ? `
                <div
                  class="geneo-person-life">
                  ${lifeContent}
                </div>
              `
                    : ''
            }

          ${linkIndicator}
        </div>
      `;
}

function geneoRoundedPolygonPath(points, radius = 0)
{
    if (!Array.isArray(points) || points.length < 3) return '';
    const corners = points.map((point, index) =>
    {
        const previous = points[(index - 1 + points.length) % points.length];
        const next = points[(index + 1) % points.length];
        const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y);
        const nextLength = Math.hypot(next.x - point.x, next.y - point.y);
        const distance = Math.max(0, Math.min(radius, previousLength / 2, nextLength / 2));
        const toward = (target, length) => ({
            x: point.x + (target.x - point.x) * (length ? distance / length : 0),
            y: point.y + (target.y - point.y) * (length ? distance / length : 0)
        });
        return {
            point,
            incoming: toward(previous, previousLength),
            outgoing: toward(next, nextLength)
        };
    });
    const number = value => Number(value.toFixed(3));
    return corners.reduce((path, corner, index) =>
    {
        const incoming = `${number(corner.incoming.x)} ${number(corner.incoming.y)}`;
        const vertex = `${number(corner.point.x)} ${number(corner.point.y)}`;
        const outgoing = `${number(corner.outgoing.x)} ${number(corner.outgoing.y)}`;
        return `${path}${index ? ' L' : 'M'} ${incoming} Q ${vertex} ${outgoing}`;
    }, '') + ' Z';
}

function renderGeneographShapeContent(node)
{
    const kind = normalizeGeneographShapeKind(node?.shapeKind);
    const width = Math.max(1, geneoNumber(node?.width, 100));
    const height = Math.max(1, geneoNumber(node?.height, 100));
    const inset = 1;
    const radius = Math.min(
        Math.round(geneoNumber(node?.appearance?.cornerRadius, 8, 0, 32)),
        Math.max(0, Math.min(width, height) / 2 - inset)
    );
    const polygonPoints = {
        diamond: [
            { x: width / 2, y: inset },
            { x: width - inset, y: height / 2 },
            { x: width / 2, y: height - inset },
            { x: inset, y: height / 2 }
        ],
        triangle: [
            { x: width / 2, y: inset },
            { x: width - inset, y: height - inset },
            { x: inset, y: height - inset }
        ],
        hexagon: [
            { x: width * .25, y: inset },
            { x: width * .75, y: inset },
            { x: width - inset, y: height / 2 },
            { x: width * .75, y: height - inset },
            { x: width * .25, y: height - inset },
            { x: inset, y: height / 2 }
        ]
    };
    const geometry = kind === 'rectangle'
        ? `<rect x="${inset}" y="${inset}" width="${Math.max(0, width - inset * 2)}" height="${Math.max(0, height - inset * 2)}" rx="${radius}" ry="${radius}"></rect>`
        : kind === 'ellipse'
            ? `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${Math.max(0, width / 2 - inset)}" ry="${Math.max(0, height / 2 - inset)}"></ellipse>`
            : `<path d="${geneoRoundedPolygonPath(polygonPoints[kind], radius)}"></path>`;
    return `<svg class="geneo-shape-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g vector-effect="non-scaling-stroke">${geometry}</g></svg>`;
}

function geneoDrawingPath(points, width = 1, height = 1)
{
    const resolved = normalizeGeneographDrawingPoints(points).map(point => ({
        x: point.x * width,
        y: point.y * height
    }));
    if (resolved.length < 2) return '';
    const number = value => Number(value.toFixed(3));
    let path = `M ${number(resolved[0].x)} ${number(resolved[0].y)}`;
    for (let index = 1; index < resolved.length - 1; index += 1)
    {
        const point = resolved[index];
        const next = resolved[index + 1];
        path += ` Q ${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
    }
    const last = resolved.at(-1);
    return `${path} L ${number(last.x)} ${number(last.y)}`;
}

function renderGeneographDrawingContent(node)
{
    const width = Math.max(1, geneoNumber(node?.width, 1));
    const height = Math.max(1, geneoNumber(node?.height, 1));
    const path = geneoDrawingPath(node?.points, width, height);
    return `<svg class="geneo-drawing-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="geneo-drawing-line" d="${path}"></path><path class="geneo-drawing-hit" d="${path}"></path></svg>`;
}

function renderGeneographPlaceContent(node)
{
    const resolved = resolveGeneographPlace(node);
    return `<div class="geneo-place-node-content" title="${escapeHtml(resolved.name)}"><span class="geneo-place-node-icon" aria-hidden="true">${icon.mapPin}</span><span class="geneo-place-node-name">${escapeHtml(resolved.name)}</span></div>`;
}

function renderGeneographNodeContent(
    node
)
{
    const editing =
        state.geneoInlineEditNodeId
          === node.id;

    if (node.type === 'person')
    {
        return (
            renderGeneographPersonNode(
                node
            )
        );
    }

    if (node.type === 'image')
    {
        const source =
            resolveGeneographImageSource(
                node
            );

        const layerName =
            geneoNodeTitle(node);

        return `
          <div
            class="geneo-image-node-media">
            ${
                source.available
                    ? renderPhotoThumbnail(
                        source.photo,
                        {
                            label:
                        layerName
                        }
                    )
                    : `
                  <span
                    class="geneo-image-node-missing">
                    ${icon.image}

                    <small>
                      Image unavailable
                    </small>
                  </span>
                `
            }
          </div>

          <span
            class="geneo-image-layer-label"
            aria-hidden="true"
            title="${escapeHtml(
                layerName
            )}">
            ${escapeHtml(
                layerName
            )}
          </span>
        `;
    }

    if (node.type === 'shape')
    {
        return renderGeneographShapeContent(node);
    }

    if (node.type === 'place')
    {
        return renderGeneographPlaceContent(node);
    }

    if (node.type === 'drawing')
    {
        return renderGeneographDrawingContent(node);
    }

    if (
        isGeneographRichTextNode(
            node
        )
    )
    {
        if (editing)
        {
            return `
            <div
              class="
                geneo-rich-text-editor-shell
                geneo-rich-text-editor-${escapeHtml(
                    node.type
                )}
              "
              data-geneo-rich-text-editor-shell>

              <div
                class="geneo-rich-text-editor-host"
                data-geneo-rich-text-editor>
              </div>

              <textarea
                class="geneo-rich-text-fallback"
                data-geneo-rich-text-fallback
                aria-label="${escapeHtml(
                    node.type === 'sticky'
                        ? 'Sticky note content'
                        : 'Text block content'
                )}"
                hidden>${escapeHtml(
                    node.text || ''
                )}</textarea>
            </div>
          `;
        }

        return `
          <div
            class="
              geneo-rich-text-copy
              geneo-${escapeHtml(
                    node.type
                )}-copy
            ">
            ${geneographRichTextDisplayHtml(
                node
            )}
          </div>
        `;
    }

    const panelTitle =
        String(
            node.title ?? ''
        ).trim();

    if (editing)
    {
        return `
          <input
            class="geneo-inline-editor"
            data-geneo-inline-input
            maxlength="160"
            value="${escapeHtml(
                panelTitle
            )}">
        `;
    }

    return panelTitle
        ? `
          <span
            class="geneo-panel-title">
            ${escapeHtml(
                panelTitle
            )}
          </span>
        `
        : '';
}

function renderGeneographPorts(
    node
)
{
    if (node?.type === 'drawing') return '';
    if (
        isGeneographRichTextNode(
            node
        )
        && state.geneoInlineEditNodeId
          === node.id
    )
    {
        return '';
    }

    return [
        'top',
        'right',
        'bottom',
        'left'
    ]
        .map(port => `
          <button
            class="
              geneo-port
              ${
                    state
                        .geneoConnectionDraft
                        ?.nodeId === node.id
                && state
                    .geneoConnectionDraft
                    ?.port === port
                        ? 'active'
                        : ''
                }
            "
            type="button"
            data-geneo-port="${port}"
            data-geneo-port-node="${escapeHtml(
                node.id
            )}"
            aria-label="Connect from ${port}">
          </button>
        `)
        .join('');
}

function renderGeneographResizeHandles(
    node
)
{
    if (
        selectedGeneographNodes().length
          !== 1
        || selectedGeneographConnections()
            .length
        || state.selectedGeneoNodeId
          !== node.id
        || geneoNodeEffectiveLocked(node)
        || (
            isGeneographRichTextNode(
                node
            )
          && state.geneoInlineEditNodeId
            === node.id
        )
    )
    {
        return '';
    }

    const handles = [
        'nw',
        'ne',
        'se',
        'sw',
        ...(
            [
                'person',
                'place'
            ].includes(node.type)
                ? ['n', 'e', 's', 'w']
                : []
        )
    ];

    return handles
        .map(handle => `
          <button
            class="
              ${
                    handle.length === 1
                        ? 'geneo-resize-edge'
                        : 'geneo-resize-handle'
                }
              ${handle}
            "
            type="button"
            data-geneo-resize="${handle}"
            data-geneo-node="${escapeHtml(
                node.id
            )}"
            aria-label="${escapeHtml(
                `Resize ${geneoNodeTitle(node)} from ${
                    {
                        n: 'top edge',
                        e: 'right edge',
                        s: 'bottom edge',
                        w: 'left edge'
                    }[handle] || `${handle} corner`
                }`
            )}">
          </button>
        `)
        .join('');
}

function renderGeneographObject(node)
{
    if (
        !geneoNodeEffectiveVisible(node)
    )
    {
        return '';
    }

    const appearance =
        node.appearance || {};

    const richEditing =
        isGeneographRichTextNode(
            node
        )
        && state.geneoInlineEditNodeId
          === node.id;

    const personSettings =
        node.type === 'person'
            ? geneoPersonCardEffectiveSettings(
                node
            )
            : null;
    const visibleAppearance =
        geneoResolveVisibleNodeAppearance(
            node
        );

    const genderColorClass =
        visibleAppearance.gender
            ? `geneo-person-gender-${
                visibleAppearance.gender
            }`
            : '';

    const visibleFill =
        visibleAppearance.fill;

    const visibleStroke =
        visibleAppearance.stroke;

    const visibleText =
        visibleAppearance.text;

    const strokePattern =
        appearance.strokePattern
          === 'dashed'
            ? 'dashed'
            : 'solid';

    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    const style = [
        `left:${node.x - bounds.left}px`,
        `top:${node.y - bounds.top}px`,
        `width:${node.width}px`,
        `height:${node.height}px`,
        `--geneo-node-bg:${geneoPaintCssColor(
            visibleFill
        )}`,
        `--geneo-node-stroke:${geneoPaintCssColor(
            visibleStroke
        )}`,
        `--geneo-node-stroke-width:${
            appearance.strokeWidth ?? GENEO_STROKE_WIDTH_MIN
        }px`,
        `--geneo-node-stroke-style:${
            visibleStroke?.enabled
                ? strokePattern
                : 'none'
        }`,
        `--geneo-node-text:${geneoPaintCssColor(
            visibleText
        )}`,
        `--geneo-node-radius:${
            geneoNodeCornerRadius(node)
        }px`,

        ...(
            personSettings
                ? geneoPersonCardCssVariables(
                    node,
                    personSettings
                )
                : []
        ),

        `z-index:${
            richEditing
                ? 1000
                : node.type === 'panel'
                    ? Math.max(
                        1,
                        Math.min(
                            10,
                            node.order
                        )
                    )
                    : 20 + node.order
        }`
    ].join(';');

    return `
        <article
          class="
            geneo-node
            geneo-node-${node.type}
            ${
                geneoSelectedNodeIdSet()
                    .has(node.id)
                    ? 'selected'
                    : ''
            }
            ${
                geneoNodeEffectiveLocked(
                    node
                )
                    ? 'locked'
                    : ''
            }
            ${
                richEditing
                    ? 'is-rich-editing'
                    : ''
            }
            ${
                node.type === 'sticky'
              && appearance.fill?.enabled
              && geneoNumber(
                  appearance.fill.opacity,
                  100,
                  0,
                  100
              ) > 0
                    ? 'has-paper-fill'
                    : ''
            }
            ${
                visibleStroke?.enabled
                    ? `stroke-${strokePattern}`
                    : 'stroke-none'
            }
            ${genderColorClass}
          "
          style="${style}"
          data-geneo-node="${escapeHtml(
                node.id
            )}"
          ${node.type === 'shape' ? `data-geneo-shape-kind="${escapeHtml(normalizeGeneographShapeKind(node.shapeKind))}"` : ''}
          ${
                personSettings
                    ? `
                data-geneo-person-card-style="${escapeHtml(
                    personSettings.style
                )}"
                data-geneo-person-card-align="${escapeHtml(
                    personSettings.alignment
                )}"
                data-geneo-person-card-photo="${escapeHtml(
                    personSettings.photoSize
                )}"
                data-geneo-person-card-height-mode="${escapeHtml(
                    personSettings.heightMode
                )}"
              `
                    : ''
            }
          tabindex="0"
          aria-label="${escapeHtml(
                geneoNodeTitle(node)
            )}">
          <div
            class="geneo-node-content">
            ${renderGeneographNodeContent(
                node
            )}
          </div>

          ${
                node.type === 'person'
                    ? renderGeneographPersonAddRelativeAction(node)
                    : ''
            }

          ${renderGeneographRichTextToolbar(
                node
            )}

          ${renderGeneographPorts(
                node
            )}

          ${renderGeneographResizeHandles(
                node
            )}
        </article>
      `;
}

function renderGeneographEditorSidebar(board)
{
    const diagram = board.diagram;
    const query = state.geneoLayerSearch.trim().toLowerCase();
    const matches = node => !query || `${geneoNodeTitle(node)} ${node.type}`.toLowerCase().includes(query);
    const panels = diagram.nodes.filter(node => node.type === 'panel' && !node.parentPanelId && (matches(node) || diagram.nodes.some(child => child.parentPanelId === node.id && matches(child)))).sort((a, b) => b.order - a.order);
    const rootNodes = diagram.nodes.filter(node => node.type !== 'panel' && !node.parentPanelId && matches(node)).sort((a, b) => b.order - a.order);
    const selectedIds = geneoSelectedNodeIdSet();
    const selectedConnectionIds = geneoSelectedConnectionIdSet();
    const collectionMeta = geneographEditorCollectionMeta(board);
    const layersExpanded = state.geneoSidebarSections?.layers !== false;
    const connectionsExpanded = state.geneoSidebarSections?.connections !== false;
    const row = (
        node,
        depth = 0
    ) =>
    {
        const displayName =
            geneoNodeTitle(node);

        const renaming =
            geneoLayerRenameMatches(
                'node',
                node.id
            );

        return `
          <div
            class="geneo-layer-row ${
                selectedIds.has(node.id)
                    ? 'selected'
                    : ''
            }"
            style="--layer-depth:${depth}"
            data-geneo-layer="${
                escapeHtml(node.id)
            }"
            draggable="${!renaming}"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${geneoNodeIcon(node.type)}
            </span>

            ${
                renderGeneographLayerNameCell(
                    'node',
                    node.id,
                    displayName
                )
            }

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-visible="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.visible
                        ? 'Hide'
                        : 'Show'
                } ${escapeHtml(displayName)}">
              ${
                    node.visible
                        ? icon.eye
                        : icon.eyeOff
                }
            </button>

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-lock="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.locked
                        ? 'Unlock'
                        : 'Lock'
                } ${escapeHtml(displayName)}">
              ${
                    node.locked
                        ? icon.lock
                        : icon.unlock
                }
            </button>
          </div>
        `;
    };
    const connectionRow =
        connection =>
        {
            const displayName =
                geneoConnectionLabel(
                    connection
                );

            const renaming =
                geneoLayerRenameMatches(
                    'connection',
                    connection.id
                );

            return `
          <div
            class="geneo-layer-row ${
                selectedConnectionIds.has(
                    connection.id
                )
                    ? 'selected'
                    : ''
            }"
            data-geneo-layer-connection="${
                escapeHtml(connection.id)
            }"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${icon.link}
            </span>

            ${
                renderGeneographLayerNameCell(
                    'connection',
                    connection.id,
                    displayName
                )
            }
            <span class="geneo-layer-paint-status" data-geneo-connection-paint-status ${connection.style.line.enabled ? 'hidden' : ''}>No stroke</span>
          </div>
        `;
        };
    sidebar.innerHTML = `<nav class="geneo-sidebar geneo-board-panel" aria-label="Geneograph board navigation">
        <section class="geneo-sidebar-section navigation"><div class="side-section-title">Navigation</div><div class="side-nav">${renderGeneoAllBoardsNavigationButton({ editor: true })}</div></section>
        <section class="geneo-sidebar-section"><div class="side-section-title">Current board</div><div class="geneo-current-board-summary"><div class="geneo-current-board-copy"><strong title="${escapeHtml(board.title)}">${escapeHtml(board.title)}</strong><span title="${escapeHtml(collectionMeta.title)}">${icon.folder}<span>${escapeHtml(collectionMeta.label)}</span></span></div><button class="geneo-board-square-action" type="button" data-geneo-settings aria-label="Edit ${escapeHtml(board.title)}">${icon.edit}</button></div></section>
        <section class="geneo-sidebar-section geneo-layers"><button class="geneo-sidebar-disclosure" type="button" data-geneo-sidebar-section="layers" aria-expanded="${layersExpanded}"><span>Layers</span><span class="geneo-sidebar-disclosure-meta"><span>${diagram.nodes.length}</span>${icon.chevron}</span></button>${layersExpanded ? `<div class="geneo-sidebar-section-body"><div class="geneo-layer-tools"><input class="geneo-object-search" id="geneoLayerSearch" placeholder="Search layers" value="${escapeHtml(state.geneoLayerSearch)}"></div><div class="geneo-layer-list">${panels.map(panel =>
        {
            const collapsed = Boolean(state.geneoCollapsedPanels[panel.id]); const children = diagram.nodes.filter(node => node.parentPanelId === panel.id && matches(node)).sort((a, b) => b.order - a.order); return `<div class="geneo-layer-panel"><div class="geneo-layer-panel-head"><button class="geneo-layer-disclosure" type="button" data-geneo-collapse-panel="${escapeHtml(panel.id)}" aria-expanded="${!collapsed}">${icon.chevron}</button>${row(panel)}</div>${collapsed ? '' : children.map(node => row(node, 1)).join('')}</div>`;
        }).join('')}${rootNodes.map(node => row(node)).join('')}</div></div>` : ''}</section>
        <section class="geneo-sidebar-section"><button class="geneo-sidebar-disclosure" type="button" data-geneo-sidebar-section="connections" aria-expanded="${connectionsExpanded}"><span>Connections</span><span class="geneo-sidebar-disclosure-meta"><span>${diagram.connections.length}</span>${icon.chevron}</span></button>${connectionsExpanded ? `<div class="geneo-sidebar-section-body"><div class="geneo-layer-list">${diagram.connections.map(connectionRow).join('')}</div></div>` : ''}</section>
      </nav>`;

    localizeUI(
        sidebar,
        {
            suppressObserverReplay: true
        }
    );
}

function geneoDefaultConnectionLabel(
    connection
)
{
    if (
        connection.kind
        === 'family-partner'
    )
    {
        return 'Partner relationship';
    }

    if (
        connection.kind
        === 'family-child'
    )
    {
        return 'Parent-child relationship';
    }

    if (
        connection.kind
        === 'family-sibling'
    )
    {
        return 'Sibling relationship';
    }

    return `${
        connection.style.pattern === 'dashed'
            ? 'Dashed'
            : 'Solid'
    } connector`;
}

function geneoConnectionLabel(
    connection
)
{
    return (
        normalizeGeneographLayerName(
            connection?.name
        )
        || geneoDefaultConnectionLabel(
            connection
        )
    );
}

function getGeneographRenameEntity(
    entityType,
    entityId
)
{
    if (entityType === 'node')
    {
        return getGeneographNode(entityId);
    }

    if (entityType === 'connection')
    {
        return getGeneographConnection(
            entityId
        );
    }

    return null;
}

function geneoRenameEntityDisplayName(
    entityType,
    entity
)
{
    return entityType === 'node'
        ? geneoNodeTitle(entity)
        : geneoConnectionLabel(entity);
}

function geneoLayerRenameMatches(
    entityType,
    entityId
)
{
    return Boolean(
        state.geneoLayerRename
        && state.geneoLayerRename.entityType
          === entityType
        && state.geneoLayerRename.entityId
          === entityId
    );
}

function renameGeneographEntity(
    entityType,
    entityId,
    value
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return false;

    const currentName =
        normalizeGeneographLayerName(
            entity.name
        );

    const nextName =
        normalizeGeneographLayerName(
            value
        );

    if (currentName === nextName)
    {
        return false;
    }

    geneoPushHistory();

    entity.name = nextName;

    touchGeneographBoard();

    return true;
}

function focusGeneographLayerRow(
    entityType,
    entityId
)
{
    const attribute =
        entityType === 'node'
            ? 'data-geneo-layer'
            : 'data-geneo-layer-connection';

    const selector =
        `[${attribute}="${
            CSS.escape(String(entityId))
        }"]`;

    sidebar
        .querySelector(selector)
        ?.focus({
            preventScroll: true
        });
}

function beginGeneographLayerRename(
    entityType,
    entityId
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return;

    if (entityType === 'node')
    {
        selectGeneographNode(entityId);
    }
    else
    {
        selectGeneographConnection(
            entityId
        );
    }

    const originalName =
        normalizeGeneographLayerName(
            entity.name
        );

    const initialDisplay =
        localizedDataFieldValue(
            normalizeGeneographLayerName(
                geneoRenameEntityDisplayName(
                    entityType,
                    entity
                )
            )
        );

    state.geneoLayerRename = {
        entityType,
        entityId,
        originalName,
        initialDisplay,
        draft: initialDisplay
    };

    renderGeneographEditorPreserveScroll();

    requestAnimationFrame(() =>
    {
        const input =
            sidebar.querySelector(
                '[data-geneo-layer-rename-input]'
            );

        if (!input) return;

        input.focus({
            preventScroll: true
        });

        input.select();
    });
}

function finishGeneographLayerRename({
    cancel = false,
    value = '',
    restoreFocus = true
} = {})
{
    const rename =
        state.geneoLayerRename;

    if (!rename) return;

    const {
        entityType,
        entityId,
        originalName,
        initialDisplay
    } = rename;

    state.geneoLayerRename = null;

    if (!cancel)
    {
        const submittedName =
            normalizeGeneographLayerName(
                value
            );

        /*
        * Pressing Enter without editing an
        * automatic fallback should not freeze
        * that fallback as a custom name.
        */
        const nextName =
            submittedName === initialDisplay
                ? originalName
                : submittedName;

        renameGeneographEntity(
            entityType,
            entityId,
            nextName
        );
    }

    renderGeneographEditorPreserveScroll();

    if (!restoreFocus) return;

    requestAnimationFrame(() =>
    {
        focusGeneographLayerRow(
            entityType,
            entityId
        );
    });
}

function renderGeneographLayerNameCell(
    entityType,
    entityId,
    displayName
)
{
    const localizedDisplayName =
        localizedDataFieldValue(
            displayName
        );

    if (
        geneoLayerRenameMatches(
            entityType,
            entityId
        )
    )
    {
        return `
          <input
            class="geneo-layer-name-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${
                escapeHtml(
                    state.geneoLayerRename.draft
                )
            }"
            data-geneo-layer-rename-input
            data-geneo-rename-type="${
                escapeHtml(entityType)
            }"
            data-geneo-rename-id="${
                escapeHtml(entityId)
            }"
            data-user-content
            aria-label="${
                entityType === 'node'
                    ? 'Rename layer'
                    : 'Rename connection'
            }">
        `;
    }

    return `
        <span
          class="name"
          data-geneo-layer-rename-handle
          data-user-content
          title="${escapeHtml(localizedDisplayName)}">
          ${escapeHtml(localizedDisplayName)}
        </span>
      `;
}

function geneoCentralPartnerIdsForFamily(family)
{
    if (!family || family.partnerIds.length !== 2) return [];
    return family.partnerIds.map(personId => getGeneographPerson(personId)?.treePersonId || '').filter(Boolean);
}

function geneoRelationshipForFamily(family, { create = false } = {})
{
    const centralIds = geneoCentralPartnerIdsForFamily(family);
    if (centralIds.length !== 2) return { relationship: family, central: false };
    let relationship = getPartnerRelationshipBetween(centralIds[0], centralIds[1]);
    if (!relationship && create) relationship = connectPartners(centralIds[0], centralIds[1])?.family || null;
    return { relationship: relationship || family, central: Boolean(relationship) };
}

function geneoPartnerRelationshipDateLabel(connection)
{
    if (connection?.kind !== 'family-partner' || connection.showRelationshipDates === false) return '';
    const family = getGeneographFamily(connection.familyId);
    const relationship = geneoRelationshipForFamily(family).relationship;
    return partnerRelationshipDateSummary(relationship).rangeLabel || '';
}

function renderGeneographRelationshipDateLabel(connection, points)
{
    const label = geneoPartnerRelationshipDateLabel(connection);
    const midpoint = label ? geneoPolylineMidpoint(points) : null;
    if (!midpoint) return '';
    const width = Math.max(72, Math.min(260, label.length * 7 + 20));
    return `<g class="geneo-relationship-date" transform="translate(${midpoint.x} ${midpoint.y - 18})" aria-label="Relationship date ${escapeHtml(label)}"><rect x="${-width / 2}" y="-13" width="${width}" height="24" rx="4"></rect><text text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text></g>`;
}

function geneoRgbToHsv({ r, g, b })
{
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    let hue = 0;
    if (delta)
    {
        if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
        else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
        else hue = 60 * ((red - green) / delta + 4);
    }
    if (hue < 0) hue += 360;
    return {
        h: hue,
        s: maximum ? delta / maximum * 100 : 0,
        v: maximum * 100
    };
}

function geneoHsvToHex({ h, s, v })
{
    const hue = ((geneoNumber(h, 0) % 360) + 360) % 360;
    const saturation = geneoNumber(s, 0, 0, 100) / 100;
    const value = geneoNumber(v, 0, 0, 100) / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const offset = value - chroma;
    let channels = [0, 0, 0];
    if (hue < 60) channels = [chroma, x, 0];
    else if (hue < 120) channels = [x, chroma, 0];
    else if (hue < 180) channels = [0, chroma, x];
    else if (hue < 240) channels = [0, x, chroma];
    else if (hue < 300) channels = [x, 0, chroma];
    else channels = [chroma, 0, x];
    return `#${channels.map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function geneoPaintTargetKey(target)
{
    return target ? `${target.scope}:${target.id || 'canvas'}:${target.property}` : '';
}

function resolveGeneoPaintTarget(reference)
{
    if (!reference) return null;
    const { scope, id = '', property } = reference;
    if (scope === 'canvas')
    {
        const canvas = selectedGeneographDiagram()?.canvas;
        if (!canvas || property !== 'background') return null;
        return {
            scope, id: selectedGeneographBoard()?.id || '', property,
            label: 'Background', paint: canvas.backgroundPaint,
            supportsOpacity: false, supportsNone: false, resettable: false,
            defaultPaint: { color: '#0F1413', opacity: 100, enabled: true }
        };
    }
    if (scope === 'connection')
    {
        const connection = getGeneographConnection(id);
        if (!connection || property !== 'line') return null;
        return {
            scope, id, property, entity: connection,
            label: 'Line', paint: connection.style.line,
            supportsOpacity: true, supportsNone: true, resettable: false,
            defaultPaint: {
                color: connection.kind === 'visual' ? '#D4AA6B' : '#8ECDB2',
                opacity: 100, enabled: true
            }
        };
    }
    if (scope !== 'node') return null;
    const node = getGeneographNode(id);
    if (!node || !['fill', 'stroke', 'text'].includes(property)) return null;
    const applicable =
        property === 'text'
            ? node.type !== 'image'
            : true;
    if (!applicable) return null;
    const defaults = geneoNodeDefaults(node.type).appearance;
    return {
        scope, id, property, entity: node,
        label:
          property === 'fill'
              ? (
                  node.type === 'image'
                || node.type === 'text'
                      ? 'Background'
                      : 'Fill'
              )
              : property === 'text'
                  ? node.type === 'panel' ? 'Title text' : 'Text'
                  : 'Stroke',
        paint: node.appearance[property],
        supportsOpacity: true,
        supportsNone: property !== 'text',
        resettable: property === 'text',
        defaultPaint: defaults[property]
    };
}

function geneoPaintReferenceFromElement(element)
{
    const host = element?.closest?.('[data-geneo-paint-scope]');
    if (!host) return null;
    return {
        scope: host.dataset.geneoPaintScope,
        id: host.dataset.geneoPaintId || '',
        property: host.dataset.geneoPaintProperty
    };
}

function geneoPaintDataAttributes(target)
{
    return `data-geneo-paint-scope="${escapeHtml(target.scope)}" data-geneo-paint-id="${escapeHtml(target.id || '')}" data-geneo-paint-property="${escapeHtml(target.property)}"`;
}

function geneoPaintSwatchStyle(paint)
{
    return `--geneo-paint-color:${normalizeGeneoHexColor(paint.color)};--geneo-paint-rendered:${geneoPaintCssColor({ ...paint, enabled: true })}`;
}

function renderGeneoPaintControl(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';

    const paint = target.paint;
    const disabled = !paint.enabled;
    const actionSubject = target.label.toLowerCase();

    const action = target.supportsNone
        ? `
          <button
            class="geneo-paint-action"
            type="button"
            data-geneo-paint-toggle
            aria-label="${escapeHtml(
                disabled
                    ? `Restore ${actionSubject} color`
                    : `Remove ${actionSubject} color`
            )}">
            ${disabled ? 'Restore' : 'Remove'}
          </button>
        `
        : target.resettable
            ? `
            <button
              class="geneo-paint-action"
              type="button"
              data-geneo-paint-reset
              aria-label="${escapeHtml(
                    `Reset ${actionSubject} color to default`
                )}">
              Reset
            </button>
          `
            : '';

    return `
        <div
          class="geneo-paint-row ${disabled ? 'is-none' : ''}"
          ${geneoPaintDataAttributes(target)}>

          <div class="geneo-paint-row-heading">
            <div class="geneo-paint-heading-copy">
              <span class="geneo-paint-label">
                ${escapeHtml(target.label)}
              </span>

              <span
                class="geneo-paint-state"
                data-geneo-paint-state
                ${disabled ? '' : 'hidden'}>
                None
              </span>
            </div>

            ${action}
          </div>

          <div class="geneo-paint-controls ${
                target.supportsOpacity ? '' : 'is-color-only'
            }">
            <button
              class="geneo-paint-swatch"
              type="button"
              data-geneo-paint-open
              style="${geneoPaintSwatchStyle(paint)}"
              aria-label="${escapeHtml(
                    `Edit ${target.label} color, ${
                        disabled
                            ? 'None'
                            : `${paint.color}, ${paint.opacity}% opacity`
                    }`
                )}"
              aria-expanded="false"
              aria-controls="geneoPaintPopover"
              ${disabled ? 'disabled' : ''}>
              <span aria-hidden="true"></span>
            </button>

            <input
              class="geneo-paint-hex"
              type="text"
              value="${escapeHtml(paint.color)}"
              maxlength="7"
              spellcheck="false"
              autocomplete="off"
              data-geneo-paint-hex
              aria-label="${escapeHtml(`${target.label} hex color`)}"
              ${disabled ? 'disabled' : ''}>

            ${
                target.supportsOpacity
                    ? `
                  <label class="geneo-paint-opacity-number">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value="${paint.opacity}"
                      data-geneo-paint-opacity-number
                      aria-label="${escapeHtml(
                            `${target.label} opacity`
                        )}"
                      ${disabled ? 'disabled' : ''}>

                    <span aria-hidden="true">%</span>
                  </label>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function geneoCompositeRgb(foreground, background, alpha)
{
    const amount = geneoNumber(alpha, 1, 0, 1);
    return {
        r: Math.round(foreground.r * amount + background.r * (1 - amount)),
        g: Math.round(foreground.g * amount + background.g * (1 - amount)),
        b: Math.round(foreground.b * amount + background.b * (1 - amount))
    };
}

function geneoRelativeLuminance(rgb)
{
    const channel = value =>
    {
        const normalized = value / 255;
        return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    };
    return .2126 * channel(rgb.r) + .7152 * channel(rgb.g) + .0722 * channel(rgb.b);
}

function geneoContrastRatio(first, second)
{
    const light = Math.max(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    const dark = Math.min(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    return (light + .05) / (dark + .05);
}

const GENEO_PERSON_GENDER_APPEARANCE =
    Object.freeze({
        male: Object.freeze({
            fill: Object.freeze({
                color: '#172A32',
                opacity: 100,
                enabled: true
            }),

            stroke: Object.freeze({
                color: '#5A9BD8',
                opacity: 100,
                enabled: true
            }),

            text: Object.freeze({
                color: '#F2F8FB',
                opacity: 100,
                enabled: true
            })
        }),

        female: Object.freeze({
            fill: Object.freeze({
                color: '#2D2437',
                opacity: 100,
                enabled: true
            }),

            stroke: Object.freeze({
                color: '#8D6CE8',
                opacity: 100,
                enabled: true
            }),

            text: Object.freeze({
                color: '#F6F1FB',
                opacity: 100,
                enabled: true
            })
        })
    });
function geneoPersonGenderAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    if (
        node?.type !== 'person'
        || !diagram?.canvas
            ?.colorPersonCardsByGender
    )
    {
        return null;
    }

    const person =
        (
            diagram.people || []
        ).find(
            item =>
                item.id === node.personId
        );

    const gender =
        person?.gender;

    const appearance =
        GENEO_PERSON_GENDER_APPEARANCE[
            gender
        ];

    return appearance
        ? {
            gender,
            ...appearance
        }
        : null;
}

function geneoResolveVisibleNodeAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    const savedAppearance =
        node?.appearance || {};

    const genderAppearance =
        geneoPersonGenderAppearance(
            node,
            diagram
        );

    if (!genderAppearance)
    {
        return {
            gender: '',
            fill:
            savedAppearance.fill,
            stroke:
            savedAppearance.stroke,
            text:
            savedAppearance.text
        };
    }

    const paintOverrides =
        savedAppearance.paintOverrides
        && typeof savedAppearance
            .paintOverrides === 'object'
            ? savedAppearance
                .paintOverrides
            : {};

    const resolvePaint =
        property =>
            paintOverrides[property]
          === true
                ? savedAppearance[property]
                : genderAppearance[property];

    return {
        gender:
          genderAppearance.gender,

        fill:
          resolvePaint('fill'),

        stroke:
          resolvePaint('stroke'),

        text:
          resolvePaint('text')
    };
}

function geneoTextContrastRatio(
    node
)
{
    if (
        !node
        || node.type === 'image'
    )
    {
        return null;
    }

    const diagram =
        selectedGeneographDiagram();

    const canvasPaint =
        diagram?.canvas
            ?.backgroundPaint;

    const canvasRgb =
        geneoHexToRgb(
            canvasPaint?.color
          || '#0F1413'
        );

    const visibleAppearance =
        geneoResolveVisibleNodeAppearance(
            node,
            diagram
        );

    const fill =
        visibleAppearance.fill;

    const text =
        visibleAppearance.text;

    const background =
        fill?.enabled
            ? geneoCompositeRgb(
                geneoHexToRgb(
                    fill.color
                ),
                canvasRgb,
                fill.opacity / 100
            )
            : canvasRgb;

    const visibleText =
        geneoCompositeRgb(
            geneoHexToRgb(
                text.color
            ),
            background,
            text.opacity / 100
        );

    return geneoContrastRatio(
        visibleText,
        background
    );
}

function renderGeneoContrastWarning(node)
{
    const ratio = geneoTextContrastRatio(node);
    const warning = Number.isFinite(ratio) && ratio < 4.5;
    return `<p class="geneo-contrast-warning" data-geneo-contrast-warning ${warning ? '' : 'hidden'}>${icon.warning}<span><strong>${escapeHtml(t('Low text contrast'))}</strong> <span data-geneo-contrast-ratio>(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).</span> ${escapeHtml(t('Consider a clearer text or fill color.'))}</span></p>`;
}

function geneoPaintTargetMatches(element, target)
{
    const reference = geneoPaintReferenceFromElement(element);
    return geneoPaintTargetKey(reference) === geneoPaintTargetKey(target);
}

function applyGeneoPaintTargetToDom(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    if (target.scope === 'node')
    {
        const node =
            target.entity;

        const element =
            main.querySelector(
                `[data-geneo-node="${
                    CSS.escape(node.id)
                }"]`
            );

        if (element)
        {
            const visibleAppearance =
                geneoResolveVisibleNodeAppearance(
                    node
                );

            const visibleFill =
                visibleAppearance.fill;

            const visibleStroke =
                visibleAppearance.stroke;

            const visibleText =
                visibleAppearance.text;

            element.style.setProperty(
                '--geneo-node-bg',
                geneoPaintCssColor(
                    visibleFill
                )
            );

            element.style.setProperty(
                '--geneo-node-stroke',
                geneoPaintCssColor(
                    visibleStroke
                )
            );

            element.style.setProperty(
                '--geneo-node-stroke-style',
                visibleStroke?.enabled
                    ? node.appearance
                        .strokePattern
                    : 'none'
            );

            element.style.setProperty(
                '--geneo-node-text',
                geneoPaintCssColor(
                    visibleText
                )
            );

            if (node.type === 'sticky')
            {
                element.classList.toggle(
                    'has-paper-fill',
                    Boolean(
                        visibleFill?.enabled
                && geneoNumber(
                    visibleFill.opacity,
                    100,
                    0,
                    100
                ) > 0
                    )
                );
            }
        }
    }
    else if (target.scope === 'connection')
    {
        const group = main.querySelector(`[data-geneo-connection-group="${CSS.escape(target.id)}"]`);
        group?.classList.toggle('no-stroke', !target.paint.enabled);
        group?.querySelector('.geneo-connection-line')?.setAttribute('stroke', geneoPaintCssColor(target.paint));
        const status = sidebar.querySelector(`[data-geneo-layer-connection="${CSS.escape(target.id)}"] [data-geneo-connection-paint-status]`);
        if (status) status.hidden = target.paint.enabled;
    }
    else
    {
        main.querySelector('[data-geneo-canvas-viewport]')?.style.setProperty('--geneo-canvas-background', geneoPaintCssColor(target.paint));
    }
}

function updateGeneoContrastWarning()
{
    const node = selectedGeneographNode();
    const warning = main.querySelector('[data-geneo-contrast-warning]');
    if (!warning || !node) return;
    const ratio = geneoTextContrastRatio(node);
    const visible = Number.isFinite(ratio) && ratio < 4.5;
    warning.hidden = !visible;
    const ratioCopy = warning.querySelector('[data-geneo-contrast-ratio]');
    if (ratioCopy) ratioCopy.textContent = `(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).`;
}

function syncGeneoPaintUi(reference, sourceInput = null)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    document.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        if (!geneoPaintTargetMatches(row, target)) return;
        row.classList.toggle('is-none', !target.paint.enabled);
        const stateLabel = row.querySelector('[data-geneo-paint-state]');
        if (stateLabel) stateLabel.hidden = target.paint.enabled;
        const swatch = row.querySelector('[data-geneo-paint-open]');

        if (swatch)
        {
            swatch.setAttribute(
                'style',
                geneoPaintSwatchStyle(target.paint)
            );

            swatch.setAttribute(
                'aria-label',
                translateAttributeValue(
                    `Edit ${target.label} color, ${
                        target.paint.enabled
                            ? `${target.paint.color}, ${target.paint.opacity}% opacity`
                            : 'None'
                    }`
                )
            );

            swatch.disabled = !target.paint.enabled;

            if (!target.paint.enabled)
            {
                swatch.setAttribute('aria-expanded', 'false');
            }
        }

        const hex = row.querySelector('[data-geneo-paint-hex]');

        if (hex && hex !== sourceInput)
        {
            hex.value = target.paint.color;
        }

        if (hex)
        {
            hex.disabled = !target.paint.enabled;
        }

        const opacity = row.querySelector(
            '[data-geneo-paint-opacity-number]'
        );

        if (opacity && opacity !== sourceInput)
        {
            opacity.value = target.paint.opacity;
        }

        if (opacity)
        {
            opacity.disabled = !target.paint.enabled;
        }

        const toggle = row.querySelector('[data-geneo-paint-toggle]');

        if (toggle)
        {
            const isPopover = row.classList.contains(
                'geneo-paint-popover'
            );

            const visibleLabel = target.paint.enabled
                ? isPopover
                    ? `Remove ${target.label}`
                    : 'Remove'
                : isPopover
                    ? `Restore ${target.label}`
                    : 'Restore';

            toggle.textContent = t(visibleLabel);

            toggle.setAttribute(
                'aria-label',
                translateAttributeValue(
                    target.paint.enabled
                        ? `Remove ${target.label.toLowerCase()} color`
                        : `Restore ${target.label.toLowerCase()} color`
                )
            );
        }
    });
    if (target.scope === 'node' && target.property === 'stroke')
    {
        const pattern = main.querySelector('[data-geneo-stroke-pattern="node"]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    if (target.scope === 'connection')
    {
        const pattern = main.querySelector('[data-geneo-stroke-pattern="connection"]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    applyGeneoPaintTargetToDom(target);
    updateGeneoContrastWarning();
    syncGeneoPaintPopover(target, sourceInput);
}

function geneoPaintOverrideState(
    target
)
{
    if (
        target?.scope !== 'node'
        || target.entity?.type
          !== 'person'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    return target.entity
        .appearance
        ?.paintOverrides
        ?.[target.property]
        === true;
}

function setGeneoPaintOverrideState(
    target,
    overridden
)
{
    if (
        target?.scope !== 'node'
        || target.entity?.type
          !== 'person'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    const appearance =
        target.entity.appearance;

    const previous =
        appearance.paintOverrides
            ?.[target.property]
        === true;

    const next =
        Boolean(overridden);

    appearance.paintOverrides = {
        fill:
          appearance.paintOverrides
              ?.fill === true,

        stroke:
          appearance.paintOverrides
              ?.stroke === true,

        text:
          appearance.paintOverrides
              ?.text === true,

        [target.property]:
          next
    };

    return previous !== next;
}

function beginGeneoPaintInteraction(
    reference
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return null;
    }

    if (
        geneoPaintRuntime.interaction
    )
    {
        commitGeneoPaintInteraction();
    }

    geneoPaintRuntime.interaction = {
        key:
          geneoPaintTargetKey(
              target
          ),

        reference: {
            scope: target.scope,
            id: target.id,
            property: target.property
        },

        beforeDiagram:
          geneoSnapshot(),

        beforePaint:
          structuredClone(
              target.paint
          ),

        beforeOverride:
          geneoPaintOverrideState(
              target
          ),

        lastValidPaint:
          structuredClone(
              target.paint
          )
    };

    return target;
}

function previewGeneoPaint(
    reference,
    changes,
    sourceInput = null
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (
        !target
        || (
            !target.paint.enabled
          && !(
              'enabled' in changes
          )
        )
    )
    {
        return false;
    }

    Object.assign(
        target.paint,
        changes
    );

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    /*
       * A direct paint edit is an explicit
       * object-level override.
       */
    setGeneoPaintOverrideState(
        target,
        true
    );

    const interaction =
        geneoPaintRuntime.interaction;

    if (
        interaction?.key
        === geneoPaintTargetKey(
            target
        )
    )
    {
        interaction.lastValidPaint =
            structuredClone(
                target.paint
            );
    }

    syncGeneoPaintUi(
        target,
        sourceInput
    );

    return true;
}

function commitGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    const paintChanged =
        JSON.stringify(
            interaction.beforePaint
        )
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        interaction.beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    geneoPushHistorySnapshot(
        interaction.beforeDiagram
    );

    touchGeneographBoard();

    return true;
}

function cancelGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    Object.assign(
        target.paint,
        structuredClone(
            interaction.beforePaint
        )
    );

    setGeneoPaintOverrideState(
        target,
        interaction.beforeOverride
    );

    syncGeneoPaintUi(
        target
    );

    return true;
}

function restoreLastValidGeneoPaintInteraction(sourceInput = null)
{
    const interaction = geneoPaintRuntime.interaction;
    if (!interaction) return false;
    const target = resolveGeneoPaintTarget(interaction.reference);
    if (!target) return false;
    Object.assign(target.paint, structuredClone(interaction.lastValidPaint));
    syncGeneoPaintUi(target, sourceInput);
    return true;
}

function commitGeneoPaintAction(
    reference,
    update,
    {
        resetOverride = false
    } = {}
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return false;
    }

    const beforeDiagram =
        geneoSnapshot();

    const beforePaint =
        JSON.stringify(
            target.paint
        );

    const beforeOverride =
        geneoPaintOverrideState(
            target
        );

    update(target);

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    setGeneoPaintOverrideState(
        target,
        !resetOverride
    );

    const paintChanged =
        beforePaint
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    geneoPushHistorySnapshot(
        beforeDiagram
    );

    touchGeneographBoard();

    syncGeneoPaintUi(
        target
    );

    return true;
}

function renderGeneoPaintPopover(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';
    const paint = target.paint;
    const hsv = geneoRgbToHsv(geneoHexToRgb(paint.color));
    geneoPaintRuntime.hsv = hsv;
    const disabled = !paint.enabled;
    return `<div class="geneo-paint-popover" id="geneoPaintPopover" role="dialog" aria-modal="false" aria-labelledby="geneoPaintPopoverTitle" ${geneoPaintDataAttributes(target)}>
        <div class="geneo-paint-popover-header"><strong id="geneoPaintPopoverTitle">${escapeHtml(target.label)}</strong><button type="button" data-geneo-paint-close aria-label="Close ${escapeHtml(target.label)} color picker">${icon.close}</button></div>
        <div class="geneo-paint-popover-body">
          <div class="geneo-paint-sv" tabindex="0" role="slider" aria-label="${escapeHtml(target.label)} saturation and brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hsv.v)}" aria-valuetext="Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%" data-geneo-paint-sv style="--geneo-hue:${Math.round(hsv.h)}"><span style="left:${hsv.s}%;top:${100 - hsv.v}%" aria-hidden="true"></span></div>
          <label class="geneo-paint-slider-row"><span>Hue</span><input type="range" min="0" max="359" step="1" value="${Math.round(hsv.h)}" data-geneo-paint-hue ${disabled ? 'disabled' : ''}></label>
          ${target.supportsOpacity ? `<label class="geneo-paint-slider-row"><span>Opacity</span><input class="geneo-paint-alpha" type="range" min="0" max="100" step="1" value="${paint.opacity}" data-geneo-paint-opacity style="--geneo-paint-color:${paint.color};--geneo-paint-opacity:${paint.opacity}%" ${disabled ? 'disabled' : ''}></label>` : ''}
          <div class="geneo-paint-popover-fields"><label><span>Hex</span><input type="text" maxlength="7" value="${paint.color}" spellcheck="false" autocomplete="off" data-geneo-paint-hex ${disabled ? 'disabled' : ''}></label>${target.supportsOpacity ? `<label><span>Opacity</span><span class="geneo-paint-percent-input"><input type="number" min="0" max="100" step="1" value="${paint.opacity}" data-geneo-paint-opacity-number ${disabled ? 'disabled' : ''}><span aria-hidden="true">%</span></span></label>` : ''}</div>
          <div
            class="geneo-paint-suggestions"
            role="group"
            aria-label="Suggested board colors">
            ${
                GENEO_BOARD_COLORS.map(item =>
                {
                    const selected =
                        normalizeGeneoHexColor(item.color)
                  === normalizeGeneoHexColor(paint.color);

                    return `
                  <button
                    type="button"
                    data-geneo-paint-suggestion="${item.color}"
                    style="--geneo-suggestion:${item.color}"
                    aria-label="${escapeHtml(
                        `${item.name}, ${item.color}`
                    )}"
                    aria-pressed="${selected}"
                    title="${escapeHtml(
                        `${item.name} · ${item.color}`
                    )}"
                    ${disabled ? 'disabled' : ''}>
                  </button>
                `;
                }).join('')
            }
          </div>

          <div class="geneo-paint-popover-footer">
            ${
                target.supportsNone
                    ? `
                  <button
                    class="geneo-paint-none"
                    type="button"
                    data-geneo-paint-toggle>
                    ${escapeHtml(
                        `${disabled ? 'Restore' : 'Remove'} ${target.label}`
                    )}
                  </button>
                `
                    : target.resettable
                        ? `
                    <button
                      class="geneo-paint-none"
                      type="button"
                      data-geneo-paint-reset>
                      Reset to default
                    </button>
                  `
                        : ''
            }
          </div>
      </div>`;
}

function positionGeneoPaintPopover()
{
    const { popover, opener } = geneoPaintRuntime;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!popover || !opener?.isConnected || !inspector) return;
    const inspectorRect = inspector.getBoundingClientRect();
    const openerRect = opener.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(280, Math.min(360, inspectorRect.width - margin * 2));
    popover.style.width = `${width}px`;
    popover.style.maxHeight = `${Math.max(280, inspectorRect.height - margin * 2)}px`;
    const measuredHeight = Math.min(popover.scrollHeight, inspectorRect.height - margin * 2);
    const below = openerRect.bottom + 6;
    const above = openerRect.top - measuredHeight - 6;
    const top = below + measuredHeight <= inspectorRect.bottom - margin
        ? below
        : Math.max(inspectorRect.top + margin, above);
    popover.style.left = `${Math.max(inspectorRect.left + margin, Math.min(openerRect.right - width, inspectorRect.right - width - margin))}px`;
    popover.style.top = `${top}px`;
}

function syncGeneoPaintPopover(reference, sourceInput = null)
{
    const popover = geneoPaintRuntime.popover;
    const target = resolveGeneoPaintTarget(reference);
    if (!popover || !target || geneoPaintTargetKey(target) !== geneoPaintTargetKey(geneoPaintRuntime.target)) return;
    const hsv = geneoRgbToHsv(geneoHexToRgb(target.paint.color));
    geneoPaintRuntime.hsv = hsv;
    popover.classList.toggle('is-none', !target.paint.enabled);
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    if (sv)
    {
        sv.style.setProperty('--geneo-hue', Math.round(hsv.h));
        sv.setAttribute('aria-valuenow', Math.round(hsv.v));
        sv.setAttribute('aria-valuetext', `Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`);
        const marker = sv.querySelector('span');
        if (marker)
        {
            marker.style.left = `${hsv.s}%`; marker.style.top = `${100 - hsv.v}%`;
        }
    }
    const hue = popover.querySelector('[data-geneo-paint-hue]');
    if (hue && hue !== sourceInput) hue.value = Math.round(hsv.h);
    const alpha = popover.querySelector('[data-geneo-paint-opacity]');
    if (alpha && alpha !== sourceInput) alpha.value = target.paint.opacity;
    if (alpha)
    {
        alpha.style.setProperty(
            '--geneo-paint-color',
            target.paint.color
        );

        alpha.style.setProperty(
            '--geneo-paint-opacity',
            `${target.paint.opacity}%`
        );
    }
    const hex = popover.querySelector('[data-geneo-paint-hex]');
    if (hex && hex !== sourceInput) hex.value = target.paint.color;
    const number = popover.querySelector('[data-geneo-paint-opacity-number]');
    if (number && number !== sourceInput) number.value = target.paint.opacity;
    popover.querySelectorAll('input, [data-geneo-paint-suggestion]').forEach(control =>
    {
        if (!control.matches('[data-geneo-paint-close]')) control.disabled = !target.paint.enabled;
    });
    const selectedColor = normalizeGeneoHexColor(
        target.paint.color
    );

    popover
        .querySelectorAll('[data-geneo-paint-suggestion]')
        .forEach(button =>
        {
            const selected =
                normalizeGeneoHexColor(
                    button.dataset.geneoPaintSuggestion
                ) === selectedColor;

            button.setAttribute(
                'aria-pressed',
                String(selected)
            );
        });

    const toggle = popover.querySelector(
        '[data-geneo-paint-toggle]'
    );

    if (toggle)
    {
        toggle.textContent = t(
            `${target.paint.enabled ? 'Remove' : 'Restore'} ${
                target.label
            }`
        );

        toggle.setAttribute(
            'aria-label',
            translateAttributeValue(
                target.paint.enabled
                    ? `Remove ${target.label.toLowerCase()} color`
                    : `Restore ${target.label.toLowerCase()} color`
            )
        );
    }
}

function closeGeneoPaintPopover({ commit = true, restoreFocus = true } = {})
{
    const opener = geneoPaintRuntime.opener;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    const scrollTop = inspector?.scrollTop ?? null;
    if (commit) commitGeneoPaintInteraction();
    else cancelGeneoPaintInteraction();
    geneoPaintRuntime.controller?.abort();
    geneoPaintRuntime.popover?.remove();
    opener?.setAttribute('aria-expanded', 'false');
    geneoPaintRuntime = createGeneoPaintRuntime();
    if (scrollTop !== null && inspector) inspector.scrollTop = scrollTop;
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
}

function updateGeneoPaintFromSv(event, reference, element)
{
    const rect = element.getBoundingClientRect();
    const saturation = geneoNumber((event.clientX - rect.left) / rect.width * 100, 0, 0, 100);
    const value = geneoNumber((rect.bottom - event.clientY) / rect.height * 100, 0, 0, 100);
    const hsv = { ...(geneoPaintRuntime.hsv || { h: 0 }), s: saturation, v: value };
    geneoPaintRuntime.hsv = hsv;
    previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
}

function bindGeneoPaintPopover(reference)
{
    const popover = geneoPaintRuntime.popover;
    if (!popover) return;
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    sv?.addEventListener('pointerdown', event =>
    {
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        beginGeneoPaintInteraction(reference);
        sv.setPointerCapture(event.pointerId);
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointermove', event =>
    {
        if (!sv.hasPointerCapture(event.pointerId)) return;
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointerup', event =>
    {
        if (sv.hasPointerCapture(event.pointerId)) sv.releasePointerCapture(event.pointerId);
        commitGeneoPaintInteraction();
    });
    sv?.addEventListener('keydown', event =>
    {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        const amount = event.shiftKey ? 10 : 1;
        const hsv = { ...geneoPaintRuntime.hsv };
        if (event.key === 'ArrowLeft') hsv.s = Math.max(0, hsv.s - amount);
        if (event.key === 'ArrowRight') hsv.s = Math.min(100, hsv.s + amount);
        if (event.key === 'ArrowDown') hsv.v = Math.max(0, hsv.v - amount);
        if (event.key === 'ArrowUp') hsv.v = Math.min(100, hsv.v + amount);
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
    });
    sv?.addEventListener('keyup', event =>
    {
        if (event.key.startsWith('Arrow')) commitGeneoPaintInteraction();
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-hue]'), reference, input =>
    {
        const hsv = { ...geneoPaintRuntime.hsv, h: Number(input.value) };
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) }, input);
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-opacity]'), reference, input =>
    {
        previewGeneoPaint(reference, { opacity: Number(input.value) }, input);
    });
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
    popover.querySelectorAll('[data-geneo-paint-suggestion]').forEach(button => button.addEventListener('click', () =>
    {
        commitGeneoPaintAction(reference, target =>
        {
            target.paint.color = button.dataset.geneoPaintSuggestion;
        });
    }));
    popover
        .querySelector('[data-geneo-paint-toggle]')
        ?.addEventListener('click', () =>
        {
            const currentTarget = resolveGeneoPaintTarget(reference);
            if (!currentTarget) return;

            const removingPaint = currentTarget.paint.enabled;

            const changed = commitGeneoPaintAction(
                reference,
                target =>
                {
                    target.paint.enabled = !target.paint.enabled;
                }
            );

            if (!changed || !removingPaint) return;

            closeGeneoPaintPopover({
                restoreFocus: false
            });

            requestAnimationFrame(() =>
            {
                const inspectorRow = [
                    ...main.querySelectorAll('.geneo-paint-row')
                ].find(row =>
                    geneoPaintTargetMatches(row, reference)
                );

                inspectorRow
                    ?.querySelector('[data-geneo-paint-toggle]')
                    ?.focus({ preventScroll: true });
            });
        });
    popover
        .querySelector(
            '[data-geneo-paint-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoPaintAction(
                    reference,

                    target =>
                    {
                        Object.assign(
                            target.paint,
                            structuredClone(
                                target.defaultPaint
                            ),
                            {
                                enabled: true
                            }
                        );
                    },

                    {
                        resetOverride: true
                    }
                );
            }
        );
    popover.querySelector('[data-geneo-paint-close]')?.addEventListener('click', () => closeGeneoPaintPopover());
}

function bindGeneoPaintRange(input, reference, update)
{
    if (!input) return;
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        update(input);
    });
    input.addEventListener('change', commitGeneoPaintInteraction);
    input.addEventListener('pointerup', commitGeneoPaintInteraction);
    input.addEventListener('blur', commitGeneoPaintInteraction);
}

function bindGeneoPaintTextInput(input, reference, type)
{
    if (!input) return;
    input.addEventListener('focus', () => beginGeneoPaintInteraction(reference));
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        if (type === 'hex')
        {
            const valid = /^#?[0-9a-f]{3}$/i.test(input.value.trim()) || /^#?[0-9a-f]{6}$/i.test(input.value.trim());
            input.classList.toggle('invalid', !valid);
            input.setAttribute('aria-invalid', String(!valid));
            if (valid) previewGeneoPaint(reference, { color: normalizeGeneoHexColor(input.value) }, input);
        }
        else if (input.value.trim() !== '' && Number.isFinite(Number(input.value)))
        {
            previewGeneoPaint(reference, { opacity: Math.round(geneoNumber(input.value, 100, 0, 100)) }, input);
        }
    });
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault();
            cancelGeneoPaintInteraction();
            input.classList.remove('invalid');
            input.setAttribute('aria-invalid', 'false');
            const target = resolveGeneoPaintTarget(reference);
            if (target) input.value = type === 'hex' ? target.paint.color : target.paint.opacity;
            input.select();
        }
        else if (event.key === 'Enter')
        {
            event.preventDefault();
            input.blur();
        }
    });
    input.addEventListener('blur', () =>
    {
        if (type === 'hex' && input.classList.contains('invalid')) restoreLastValidGeneoPaintInteraction(input);
        if (type === 'opacity' && input.value.trim() === '') restoreLastValidGeneoPaintInteraction(input);
        const target = resolveGeneoPaintTarget(reference);
        if (target) input.value = type === 'hex' ? target.paint.color : target.paint.opacity;
        input.classList.remove('invalid');
        input.setAttribute('aria-invalid', 'false');
        commitGeneoPaintInteraction();
    });
}

function openGeneoPaintPopover(reference, opener)
{
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    const target = resolveGeneoPaintTarget(reference);
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!target || !inspector || !opener) return;
    const scrollTop = inspector.scrollTop;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderGeneoPaintPopover(target).trim();
    const popover = wrapper.firstElementChild;
    document.body.appendChild(popover);
    localizeUI(
        popover,
        {
            suppressObserverReplay: true
        }
    );
    const controller = new AbortController();
    geneoPaintRuntime.target = { scope: target.scope, id: target.id, property: target.property };
    geneoPaintRuntime.opener = opener;
    geneoPaintRuntime.popover = popover;
    geneoPaintRuntime.controller = controller;
    opener.setAttribute('aria-expanded', 'true');
    bindGeneoPaintPopover(geneoPaintRuntime.target);
    positionGeneoPaintPopover();
    inspector.scrollTop = scrollTop;
    popover.querySelector('[data-geneo-paint-sv]')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', event =>
    {
        if (popover.contains(event.target) || opener.contains(event.target)) return;
        closeGeneoPaintPopover();
    }, { capture: true, signal: controller.signal });
    document.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        closeGeneoPaintPopover({ commit: false });
    }, { signal: controller.signal });
    inspector.addEventListener('scroll', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
    window.addEventListener('resize', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
}

function bindGeneoPaintControls()
{
    main.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        const reference = geneoPaintReferenceFromElement(row);
        row.querySelector('[data-geneo-paint-open]')?.addEventListener('click', event => openGeneoPaintPopover(reference, event.currentTarget));
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
        row.querySelector('[data-geneo-paint-toggle]')?.addEventListener('click', () =>
        {
            commitGeneoPaintAction(reference, target =>
            {
                target.paint.enabled = !target.paint.enabled;
            });
        });
        row
            .querySelector(
                '[data-geneo-paint-reset]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    commitGeneoPaintAction(
                        reference,

                        target =>
                        {
                            Object.assign(
                                target.paint,
                                structuredClone(
                                    target.defaultPaint
                                ),
                                {
                                    enabled: true
                                }
                            );
                        },

                        {
                            resetOverride: true
                        }
                    );
                }
            );
    });
}

function renderGeneographInspectorHeader(
    title,
    subtitle,
    iconHtml = ''
)
{
    const hasIcon =
        Boolean(iconHtml);

    return `
        <div class="geneo-inspector-header">
          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
            "
            type="button"
            data-geneo-inspector-toggle
            aria-label="Collapse inspector"
            aria-expanded="true">
            ${icon.doublechevronSidebar}
          </button>

          <div
            class="
              geneo-inspector-identity
              ${hasIcon ? 'has-icon' : ''}
            ">

            ${
                hasIcon
                    ? `
                  <span
                    class="geneo-layer-icon"
                    aria-hidden="true">
                    ${iconHtml}
                  </span>
                `
                    : ''
            }

            <div class="geneo-inspector-title">
              <h2 title="${escapeHtml(title)}">
                ${escapeHtml(title)}
              </h2>

              <span title="${escapeHtml(subtitle)}">
                ${escapeHtml(subtitle)}
              </span>
            </div>
          </div>
        </div>
      `;
}
function geneoPersonCardFieldLabels()
{
    return {
        photo:
          'Photo',

        dates:
          'Life dates',

        livingStatus:
          'Status',

        birthPlace:
          'Birth place',

        deathPlace:
          'Death place',

        maidenName:
          'Maiden surname',

        linkIndicator:
          'Family Tree link indicator'
    };
}

function geneoPersonCardControlOptions()
{
    return {
        style: [
            ['standard', 'Standard'],
            ['tree', 'Tree'],
            ['chart', 'Chart'],
            ['portrait', 'Portrait']
        ],

        nameFormat: [
            ['full', 'Full name'],
            [
                'first-last',
                'First + surname'
            ],
            [
                'surname-first',
                'Surname first'
            ]
        ],

        dateFormat: [
            ['full', 'Full dates'],
            ['years', 'Years only']
        ],

        photoSize: [
            ['small', 'Small'],
            ['medium', 'Medium'],
            ['large', 'Large']
        ],

        alignment: [
            ['left', 'Left'],
            ['center', 'Center']
        ]
    };
}

function renderGeneographPersonCardSelect({
    key,
    label,
    value,
    scope,
    node = null,
    disabled = false,
    help = ''
})
{
    const options =
        geneoPersonCardControlOptions()[
            key
        ] || [];

    const id =
        `geneo-person-card-${
            scope
        }-${
            node?.id || 'board'
        }-${key}`;

    return `
        <div class="geneo-field">
          <label
            for="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </label>

          <select
            class="geneo-select"
            id="${escapeHtml(id)}"
            data-geneo-person-card-setting="${escapeHtml(
                key
            )}"
            data-geneo-person-card-scope="${escapeHtml(
                scope
            )}"
            ${
                node
                    ? `
                  data-geneo-person-card-node="${escapeHtml(
                        node.id
                    )}"
                `
                    : ''
            }
            ${
                disabled
                    ? `
                  disabled
                  aria-disabled="true"
                `
                    : ''
            }>
            ${options
                .map(
                    ([
                        optionValue,
                        optionLabel
                    ]) => `
                  <option
                    value="${escapeHtml(
                        optionValue
                    )}"
                    ${
                        optionValue === value
                            ? 'selected'
                            : ''
                    }>
                    ${escapeHtml(
                        optionLabel
                    )}
                  </option>
                `
                )
                .join('')}
          </select>

          ${
                help
                    ? `
                <span
                  class="geneo-selection-help">
                  ${escapeHtml(help)}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographPersonCardStylePicker({
    scope,
    node = null,
    settings,
    disabled = false
})
{
    const styles = [
        {
            id: 'standard',
            label: 'Standard',
            subtitle: 'Detailed facts'
        },
        {
            id: 'tree',
            label: 'Tree',
            subtitle: 'Compact family view'
        },
        {
            id: 'chart',
            label: 'Chart',
            subtitle: 'Maximum density'
        },
        {
            id: 'portrait',
            label: 'Portrait',
            subtitle: 'Photo-first'
        }
    ];

    return `
        <div
          class="geneo-person-style-picker"
          role="group"
          aria-label="Person card style">
          ${styles
                .map(style => `
              <button
                class="
                  geneo-person-style-option
                  ${
                        settings.style
                    === style.id
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-person-card-style="${escapeHtml(
                    style.id
                )}"
                data-geneo-person-card-scope="${escapeHtml(
                    scope
                )}"
                ${
                    node
                        ? `
                      data-geneo-person-card-node="${escapeHtml(
                            node.id
                        )}"
                    `
                        : ''
                }
                aria-pressed="${
                    settings.style
                  === style.id
                        ? 'true'
                        : 'false'
                }"
                ${
                    disabled
                        ? `
                      disabled
                      aria-disabled="true"
                    `
                        : ''
                }>
                <span
                  class="geneo-person-style-preview-stage"
                  aria-hidden="true">
                  <span
                    class="
                      geneo-person-style-preview
                      preview-${escapeHtml(
                            style.id
                        )}
                    ">
                    <span class="preview-photo"></span>
                    <span class="preview-name"></span>
                    <span class="preview-line one"></span>
                    <span class="preview-line two"></span>
                  </span>
                </span>

                <span class="geneo-person-style-copy">
                  <strong>${escapeHtml(
                        style.label
                    )}</strong>
                  <span>${escapeHtml(
                        style.subtitle
                    )}</span>
                </span>
              </button>
            `)
                .join('')}
        </div>
      `;
}

function renderGeneographPersonCardControls({
    scope,
    node = null
})
{
    const boardSettings =
        normalizeGeneographPersonCardSettings(
            selectedGeneographDiagram()
                ?.personCardDefaults
        );

    const canvas =
        selectedGeneographDiagram()
            ?.canvas;

    const overrides =
        node
            ? normalizeGeneographPersonCardOverrides(
                node.personCard
            )
            : null;

    const settings =
        node
            ? geneoPersonCardEffectiveSettings(
                node
            )
            : boardSettings;

    const custom =
        Boolean(
            node
          && overrides?.custom
        );

    const inherited =
        Boolean(
            node
          && !custom
        );

    const labels =
        geneoPersonCardFieldLabels();

    const select =
        (
            key,
            label,
            help = '',
            dependentDisabled = false
        ) =>
            renderGeneographPersonCardSelect({
                key,
                label,
                help,
                value:
              settings[key],
                scope,
                node,
                disabled:
              inherited
              || dependentDisabled
            });

    return `
        ${
            node
                ? `
              <label class="geneo-check">
                <input
                  type="checkbox"
                  data-geneo-person-card-use-defaults
                  data-geneo-person-card-node="${escapeHtml(
                        node.id
                    )}"
                  ${
                        custom
                            ? ''
                            : 'checked'
                    }>
                Use board defaults
              </label>
            `
                : ''
        }

        <div
          class="geneo-person-card-controls"
          data-geneo-person-card-controls
          data-inherited="${
                inherited
                    ? 'true'
                    : 'false'
            }">
          ${
                inherited
                    ? `
                <p
                  class="
                    geneo-selection-help
                    geneo-person-card-inheritance-note
                  ">
                  These values are inherited from the board.
                  Uncheck “Use board defaults” to edit this card.
                </p>
              `
                    : ''
            }

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Card style
            </strong>

            ${renderGeneographPersonCardStylePicker({
                scope,
                node,
                settings,
                disabled:
                inherited
            })}
          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Formatting
            </strong>

            <div
              class="geneo-person-card-setting-grid">
              ${select(
                    'nameFormat',
                    'Name format'
                )}

              ${select(
                    'dateFormat',
                    'Date format',
                    '',
                    !settings.fields.dates
                )}

              ${select(
                    'photoSize',
                    'Photo size',
                    '',
                    !settings.fields.photo
                )}

              ${
                    settings.style
                  === 'standard'
                        ? select(
                            'alignment',
                            'Text alignment'
                        )
                        : `
                    <div class="geneo-field">
                      <span
                        class="geneo-field-label">
                        Text alignment
                      </span>

                      <span
                        class="geneo-selection-help">
                        ${
                            settings.style
                          === 'portrait'
                          || settings.style
                          === 'chart'
                                ? 'Centered by this style'
                                : 'Defined by this style'
                        }
                      </span>
                    </div>
                  `
                }
            </div>

            <div
              class="geneo-person-card-radius-row">
              <div class="geneo-field">
                <label
                  for="${
                        node
                            ? 'geneoPersonCardRadius'
                            : 'geneoBoardPersonCardRadius'
                    }">
                  Corner radius
                </label>

                <span
                  class="geneo-selection-help">
                  0–32 px
                </span>
              </div>

              <input
                class="geneo-input"
                id="${
                    node
                        ? 'geneoPersonCardRadius'
                        : 'geneoBoardPersonCardRadius'
                }"
                type="number"
                min="0"
                max="32"
                step="1"
                value="${settings.cornerRadius}"
                data-geneo-person-card-radius="${escapeHtml(
                    scope
                )}"
                ${
                    node
                        ? `
                      data-geneo-person-card-node="${escapeHtml(
                            node.id
                        )}"
                    `
                        : ''
                }
                ${
                    inherited
                        ? `
                      disabled
                      aria-disabled="true"
                    `
                        : ''
                }>
            </div>

            ${
                scope === 'board'
                    ? `
                  <label
                    class="
                      geneo-check
                      geneo-gender-color-toggle
                    ">
                    <input
                      type="checkbox"
                      data-geneo-person-gender-colors
                      ${
                            canvas
                                ?.colorPersonCardsByGender
                                ? 'checked'
                                : ''
                        }>

                    <span>
                      Color person cards by gender

                      <small
                        class="geneo-selection-help">
                        Use Family Tree colors for male and female cards.
                        Unknown remains neutral.
                      </small>
                    </span>
                  </label>
                `
                    : ''
            }
          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Displayed information
            </strong>

            <div
              class="geneo-person-card-options">
              ${Object.entries(labels)
                    .map(
                        ([
                            field,
                            label
                        ]) =>
                        {
                            const supported =
                                geneoPersonCardFieldSupported(
                                    settings.style,
                                    field
                                );

                            return `
                    <label
                      class="geneo-check ${
                            supported
                                ? ''
                                : 'is-unavailable'
                        }"
                      ${
                            supported
                                ? ''
                                : 'title="Available in Standard and Portrait cards"'
                        }>
                      <input
                        type="checkbox"
                        data-geneo-person-card-field="${escapeHtml(
                            field
                        )}"
                        data-geneo-person-card-scope="${escapeHtml(
                            scope
                        )}"
                        ${
                            node
                                ? `
                              data-geneo-person-card-node="${escapeHtml(
                                    node.id
                                )}"
                            `
                                : ''
                        }
                        ${
                            settings.fields[
                                field
                            ]
                                ? 'checked'
                                : ''
                        }
                        ${
                            inherited
                          || !supported
                                ? `
                              disabled
                              aria-disabled="true"
                            `
                                : ''
                        }>
                      ${escapeHtml(label)}
                    </label>
                  `;
                        }
                    )
                    .join('')}
            </div>
          </div>
        </div>
      `;
}

function geneoInspectorContextForNode(
    node
)
{
    const supportedContexts = new Set([
        'person',
        'text',
        'sticky',
        'image',
        'panel',
        'place',
        'shape',
        'drawing'
    ]);

    return supportedContexts.has(
        node?.type
    )
        ? node.type
        : 'node';
}

function geneoInspectorSectionIsOpen(
    context,
    id
)
{
    return state
        .geneoInspectorSections
        ?.[context]
        ?.[id] !== false;
}

function renderGeneographInspectorSection({
    context,
    id,
    title,
    content,
    meta = '',
    actionHtml = ''
})
{
    const sectionKey =
        `${context}:${id}`;

    return renderInspectorSection(
        sectionKey,
        title,
        meta,
        content,
        actionHtml,
        {
            open:
            geneoInspectorSectionIsOpen(
                context,
                id
            ),

            toggleAttribute:
            'data-geneo-inspector-section',

            sectionId:
            `geneo-inspector-${context}-${id}`
        }
    );
}

function renderGeneographInspectorDangerAction(
    label
)
{
    return `
        <div class="geneo-inspector-danger">
          <button
            class="button danger"
            type="button"
            data-geneo-delete-selection>
            ${icon.trash}
            ${escapeHtml(label)}
          </button>
        </div>
      `;
}

function bindGeneographInspectorSectionToggles()
{
    if (
        main.dataset
            .geneoInspectorSectionToggleBound
        === 'true'
    )
    {
        return;
    }

    main.dataset
        .geneoInspectorSectionToggleBound =
            'true';

    main.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest?.(
                    '[data-geneo-inspector-section]'
                );

            if (
                !button
            || !main.contains(button)
            )
            {
                return;
            }

            const sectionKey =
                button.dataset
                    .geneoInspectorSection
            || '';

            const separatorIndex =
                sectionKey.indexOf(':');

            if (separatorIndex < 1)
            {
                return;
            }

            const context =
                sectionKey.slice(
                    0,
                    separatorIndex
                );

            const id =
                sectionKey.slice(
                    separatorIndex + 1
                );

            if (!context || !id)
            {
                return;
            }

            const section =
                button.closest(
                    '.panel-section'
                );

            const bodyId =
                button.getAttribute(
                    'aria-controls'
                );

            const body =
                bodyId && section
                    ? section.querySelector(
                        `#${CSS.escape(bodyId)}`
                    )
                    : null;

            if (!section || !body)
            {
                return;
            }

            const open =
                !geneoInspectorSectionIsOpen(
                    context,
                    id
                );

            if (
                !state.geneoInspectorSections[
                    context
                ]
            )
            {
                state.geneoInspectorSections[
                    context
                ] = {};
            }

            state.geneoInspectorSections[
                context
            ][id] = open;

            button.setAttribute(
                'aria-expanded',
                String(open)
            );

            section.classList.toggle(
                'is-open',
                open
            );

            body.hidden = !open;
        }
    );
}

function renderGeneographPersonCardSection(
    node
)
{
    return renderGeneographInspectorSection({
        context: 'person',
        id: 'card',
        title: 'Card style & content',
        content:
          renderGeneographPersonCardControls({
              scope: 'node',
              node
          })
    });
}

function renderGeneographInspector()
{
    if (state.geneoInspectorCollapsed)
    {
        return `
          <aside class="geneo-inspector collapsed">
            <button
              class="
                people-collapse-button
                person-sidebar-restore-button
                sidebar-toggle-icon
                sidebar-toggle-icon-restore
              "
              type="button"
              data-geneo-inspector-toggle
              aria-label="Open inspector"
              aria-expanded="false">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    const selectedNodes =
        selectedGeneographNodes();

    const selectedConnections =
        selectedGeneographConnections();

    if (
        selectedNodes.length
        + selectedConnections.length
        > 1
    )
    {
        return renderGeneographMultiSelectionInspector(
            selectedNodes,
            selectedConnections
        );
    }

    const node =
        selectedGeneographNode();

    const connection =
        selectedGeneographConnection();

    if (connection)
    {
        return renderGeneographConnectionInspector(
            connection
        );
    }

    if (node)
    {
        return renderGeneographNodeInspector(
            node
        );
    }

    const canvas =
        selectedGeneographDiagram().canvas;
    const appearanceContent = `
        ${renderGeneoPaintControl({
            scope: 'canvas',
            property: 'background'
        })}

        <div class="geneo-field">
          <span class="geneo-field-label">
            Background pattern
          </span>

          <div
            class="geneo-background-pattern"
            role="group"
            aria-label="Background pattern">
            ${['dots', 'grid', 'clear']
                .map(pattern =>
                {
                    const label =
                        pattern === 'clear'
                            ? 'No pattern'
                            : capitalize(pattern);

                    return `
                  <button
                    type="button"
                    data-geneo-background-pattern="${pattern}"
                    aria-pressed="${
                        canvas.backgroundPattern
                      === pattern
                    }">
                    ${escapeHtml(
                        t(label)
                    )}
                  </button>
                `;
                })
                .join('')}
          </div>
        </div>

        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-sockets
            ${
                canvas.alwaysShowSockets
                    ? 'checked'
                    : ''
            }>
          Always show sockets
        </label>

        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-snap
            ${
                canvas.snapToGrid
                    ? 'checked'
                    : ''
            }>
          Snap to grid
        </label>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                'Canvas',
                'Board appearance and behavior'
            )}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'appearance',
                title: 'Appearance',
                content: appearanceContent
            })}


            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'personCards',
                title: 'Person cards',
                content:
                renderGeneographPersonCardControls({
                    scope: 'board'
                })
            })}
          </div>
        </aside>
      `;
}

function geneoSharedPersonCardValue(
    nodes,
    getter
)
{
    if (!nodes.length)
    {
        return null;
    }

    const values =
        nodes.map(
            node =>
                getter(
                    geneoPersonCardEffectiveSettings(
                        node
                    )
                )
        );

    return values.every(
        value =>
            value === values[0]
    )
        ? values[0]
        : null;
}

function renderGeneographPersonMultiSelectionControls(
    nodes
)
{
    const options =
        geneoPersonCardControlOptions();

    const sharedSetting =
        key =>
            geneoSharedPersonCardValue(
                nodes,
                settings =>
                    settings[key]
            );

    const sharedField =
        field =>
            geneoSharedPersonCardValue(
                nodes,
                settings =>
                    settings.fields[
                        field
                    ]
            );

    const style =
        sharedSetting(
            'style'
        );

    const renderField =
        (
            field,
            label
        ) =>
        {
            const value =
                sharedField(field);

            const supported =
                style === null
            || geneoPersonCardFieldSupported(
                style,
                field
            );

            return `
            <label
              class="geneo-check ${
                    supported
                        ? ''
                        : 'is-unavailable'
                }"
              ${
                    supported
                        ? ''
                        : 'title="Available in Standard and Portrait cards"'
                }>
              <input
                type="checkbox"
                data-geneo-person-multi-field="${escapeHtml(
                    field
                )}"
                data-mixed="${
                    value === null
                        ? 'true'
                        : 'false'
                }"
                ${
                    value === true
                        ? 'checked'
                        : ''
                }
                ${
                    supported
                        ? ''
                        : 'disabled aria-disabled="true"'
                }>
              ${escapeHtml(label)}
            </label>
          `;
        };

    return renderGeneographInspectorSection({
        context: 'multi',
        id: 'personCards',
        title: 'Person cards',
        content: `
            <div class="geneo-field">
              <label>
                Card style
              </label>

              <select
                class="geneo-select"
                data-geneo-person-multi-setting="style">
                ${
                    style === null
                        ? `
                      <option
                        value=""
                        selected>
                        Mixed
                      </option>
                    `
                        : ''
                }

                ${options.style
                    .map(
                        ([
                            value,
                            label
                        ]) => `
                      <option
                        value="${escapeHtml(
                            value
                        )}"
                        ${
                            style === value
                                ? 'selected'
                                : ''
                        }>
                        ${escapeHtml(
                            label
                        )}
                      </option>
                    `
                    )
                    .join('')}
              </select>
            </div>

            <div
              class="geneo-person-card-options">
              ${renderField(
                    'photo',
                    'Photo'
                )}

              ${renderField(
                    'dates',
                    'Life dates'
                )}

              ${renderField(
                    'livingStatus',
                    'Status'
                )}

              ${renderField(
                    'birthPlace',
                    'Birth place'
                )}

              ${renderField(
                    'deathPlace',
                    'Death place'
                )}
            </div>

            <p class="geneo-selection-help">
              Living is never shown. Deceased appears only when no
              death date or place is recorded. Unknown appears when enabled.
            </p>

            <div
              class="geneo-person-multi-actions">
              <button
                class="button secondary"
                type="button"
                data-geneo-person-multi-use-defaults>
                Use board defaults
              </button>
            </div>

            <div
              class="geneo-person-multi-actions">
              ${[
                    [0.9, '90%'],
                    [1, '100%'],
                    [1.25, '125%']
                ]
                    .map(
                        ([
                            scale,
                            label
                        ]) => `
                    <button
                      class="button secondary compact"
                      type="button"
                      data-geneo-person-multi-size="${scale}">
                      ${label}
                    </button>
                  `
                    )
                    .join('')}
            </div>
        `
    });
}

function renderGeneographMultiSelectionInspector(
    nodes,
    connections = []
)
{
    const labels = [
        ...nodes.map(
            geneoNodeTitle
        ),

        ...connections.map(
            geneoConnectionLabel
        )
    ];

    const visibleNames =
        labels
            .slice(0, 6)
            .map(
                label =>
                    `<li>${escapeHtml(label)}</li>`
            )
            .join('');

    const remaining =
        Math.max(
            0,
            labels.length - 6
        );

    const peopleOnly =
        nodes.length > 0
        && connections.length === 0
        && nodes.every(
            node =>
                node.type === 'person'
        );

    const selectionContent = `
        <ul class="geneo-selection-list">
          ${visibleNames}
        </ul>

        ${
            remaining
                ? `
              <p class="geneo-selection-more">
                and ${remaining} more
              </p>
            `
                : ''
        }

        <p class="geneo-selection-help">
          Drag a selected object or connector to move the selection.
        </p>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                `${labels.length} items selected`,
                'Multiple selection',
                icon.cursorSelect
            )}

            ${renderGeneographInspectorSection({
                context: 'multi',
                id: 'selection',
                title: 'Selection',
                content: selectionContent
            })}

            ${
                peopleOnly
                    ? renderGeneographPersonMultiSelectionControls(
                        nodes
                    )
                    : ''
            }

            ${renderGeneographInspectorDangerAction(
                'Delete selected'
            )}
          </div>
        </aside>
      `;
}

function renderGeneographPersonInspectorContent(
    person
)
{
    const birthPlace =
        geneoPersonPlaceLabel(
            person?.birth
        );

    const deathPlace =
        person?.livingStatus
        === 'Deceased'
            ? geneoPersonPlaceLabel(
                person?.death
            )
            : '';

    const maiden =
        person?.gender === 'female'
            ? String(
                person?.names?.maiden
              || ''
            ).trim()
            : '';

    const details = [
        [
            'Name',
            geneoPersonDisplayName(
                person
            )
        ],

        [
            'Gender',
            capitalize(
                person?.gender
            || 'unknown'
            )
        ],

        [
            'Living status',
            person?.livingStatus
          || 'Unknown'
        ],

        [
            'Life dates',
            geneoPersonLifeDates(
                person
            )
        ],

        maiden
            ? [
                'Maiden surname',
                maiden
            ]
            : null,

        birthPlace
            ? [
                'Birth place',
                birthPlace
            ]
            : null,

        deathPlace
            ? [
                'Death place',
                deathPlace
            ]
            : null
    ].filter(Boolean);

    return `
        <dl class="geneo-person-summary">
          ${details
                .map(
                    ([
                        label,
                        value
                    ]) => `
                <div>
                  <dt>
                    ${escapeHtml(label)}
                  </dt>

                  <dd>
                    ${escapeHtml(value)}
                  </dd>
                </div>
              `
                )
                .join('')}
        </dl>

        <button
          class="button secondary"
          type="button"
          data-geneo-edit-person>
          ${icon.edit}
          Edit details
        </button>
      `;
}

function renderGeneographPersonTreeLinkSection(
    person
)
{
    const linkedPerson =
        person?.treePersonId
            ? getPerson(
                person.treePersonId
            )
            : null;

    const content =
        linkedPerson
            ? (() =>
            {
                const name =
                    personDisplayName(
                        linkedPerson.id
                    );

                const birth =
                    relationBirthMeta(
                        linkedPerson
                    );

                const meta = [
                    'Family Tree person',

                    birth
                        ? `Born ${birth}`
                        : 'Dates unknown'
                ].join(' · ');

                return `
                <div
                  class="
                    relation-row
                    geneo-tree-link-row
                  ">
                  <div
                    class="
                      relation-row-main
                      geneo-tree-link-person-main
                    ">

                    ${renderPersonAvatar(
                    linkedPerson,
                    'small-avatar',
                    {
                        element: 'span'
                    }
                )}

                    <span class="relation-row-copy">
                      <strong
                        title="${escapeHtml(name)}">
                        ${escapeHtml(name)}
                      </strong>

                      <span
                        title="${escapeHtml(meta)}">
                        ${escapeHtml(meta)}
                      </span>
                    </span>
                  </div>

                  <div
                    class="relation-actions"
                    aria-label="Family Tree link actions">

                    <button
                      class="relation-action-button"
                      type="button"
                      data-geneo-link-person
                      aria-label="${escapeHtml(
                    `Change Family Tree link for ${name}`
                )}"
                      title="Change link">
                      ${icon.edit}
                    </button>

                    <button
                      class="
                        relation-action-button
                        danger
                      "
                      type="button"
                      data-geneo-unlink-person
                      aria-label="${escapeHtml(
                    `Unlink ${name} from this board person`
                )}"
                      title="Unlink">
                      ${icon.unlink}
                    </button>
                  </div>
                </div>
              `;
            })()
            : `
            <div
              class="
                relation-row
                geneo-tree-link-row
                is-warning
              ">
              <button
                class="relation-row-main"
                type="button"
                data-geneo-link-person
                aria-label="Link this board person to Family Tree">

                <span
                  class="geneo-tree-link-warning-icon"
                  aria-hidden="true">
                  ${icon.warning}
                </span>

                <span class="relation-row-copy">
                  <strong>
                    Not linked to Family Tree
                  </strong>

                  <span>
                    Link this board person to an existing Family Tree person.
                  </span>
                </span>

                <span
                  class="geneo-tree-link-cta-arrow"
                  aria-hidden="true">
                  ${icon.chevron}
                </span>
              </button>
            </div>
          `;

    return renderGeneographInspectorSection({
        context: 'person',
        id: 'familyTreeLink',
        title: 'Family Tree link',
        content
    });
}

function renderGeneographLayerNameField(
    entityType,
    entity
)
{
    const node =
        entityType === 'node';

    const automaticName =
        node
            ? geneoDefaultNodeTitle(
                entity
            )
            : geneoDefaultConnectionLabel(
                entity
            );

    const value =
        normalizeGeneographLayerName(
            entity.name
        );

    const inputId =
        node
            ? 'geneoNodeLayerName'
            : 'geneoConnectionName';

    const descriptionId =
        `${inputId}Description`;

    return `
        <div class="geneo-field">
          <label for="${inputId}">
            Layer name
          </label>

          <input
            id="${inputId}"
            class="geneo-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${escapeHtml(
                localizedDataFieldValue(
                    value
                )
            )}"
            placeholder="${escapeHtml(
                localizedDataFieldValue(
                    automaticName
                )
            )}"
            data-geneo-entity-name="${escapeHtml(
                entityType
            )}"
            data-geneo-entity-id="${escapeHtml(
                entity.id
            )}"
            data-geneo-entity-source-name="${escapeHtml(
                value
            )}"
            data-user-content
            aria-describedby="${descriptionId}">
        </div>

        <p
          class="geneo-selection-help"
          id="${descriptionId}">
          ${
                node
                    ? 'Board organization only. Card content and linked records are unchanged.'
                    : 'Leave blank to use the automatic relationship or connector name.'
            }
        </p>
      `;
}

function renderGeneographConnectionNameSection(
    connection
)
{
    return renderGeneographInspectorSection({
        context: 'connection',
        id: 'connection',
        title: 'Connection',
        content:
          renderGeneographLayerNameField(
              'connection',
              connection
          )
    });
}

function renderGeneographImageSourceSection(node)
{
    const source = resolveGeneographImageSource(node);

    const dimensions =
        source.width && source.height
            ? `${source.width} × ${source.height}`
            : '';

    const size =
        source.sizeBytes > 0
            ? formatMediaBytes(source.sizeBytes)
            : '';

    const metadata = [dimensions, size]
        .filter(Boolean)
        .join(' · ');

    return renderGeneographInspectorSection({
        context: 'image',
        id: 'imageSource',
        title: 'Image source',
        content: `
            ${
                source.available
                    ? `
                  <div class="geneo-image-source-card">
                    <div class="geneo-image-source-preview">
                      ${renderPhotoThumbnail(source.photo, {
                            label: source.displayName
                        })}
                    </div>

                    <div class="geneo-image-source-copy">
                      <span class="geneo-image-source-badge">
                        ${escapeHtml(source.sourceLabel)}
                      </span>

                      <strong title="${escapeHtml(source.displayName)}">
                        ${escapeHtml(source.displayName)}
                      </strong>

                      ${
                            source.filename
                          && source.filename !== source.displayName
                                ? `
                              <span title="${escapeHtml(source.filename)}">
                                ${escapeHtml(source.filename)}
                              </span>
                            `
                                : ''
                        }

                      ${
                            metadata
                                ? `<span>${escapeHtml(metadata)}</span>`
                                : ''
                        }
                    </div>
                  </div>
                `
                    : `
                  <div class="geneo-image-source-missing" role="status">
                    <strong>Image unavailable</strong>
                    <span>
                      The original ${
                            source.sourceLabel === 'Board upload'
                                ? 'board upload'
                                : 'project photo'
                        } can no longer be found. Replace it to restore this layer.
                    </span>
                  </div>
                `
            }

            <div class="geneo-image-source-actions">
              <button
                class="button secondary"
                type="button"
                data-geneo-replace-image>
                Replace image
              </button>

              ${
                    source.available
                && source.ref?.scope === 'project'
                        ? `
                    <button
                      class="button ghost"
                      type="button"
                      data-geneo-open-project-photo="${escapeHtml(source.ref.id)}">
                      Open photo
                    </button>
                  `
                        : ''
                }
            </div>
        `
    });
}

function renderGeneographNodeLayoutSection(
    node
)
{
    const minimumSize =
        geneoNodeMinimumSize(
            node,
            node.width
        );

    const maximumSize =
        geneoNodeMaximumSize(
            node
        );

    const isPerson =
        node.type === 'person';

    const autoHeight =
        isPerson
        && geneoPersonCardUsesAutoHeight(
            node
        );

    const autoPlaceSize =
        geneoPlaceUsesAutoSize(node);

    return renderGeneographInspectorSection({
        context:
          geneoInspectorContextForNode(
              node
          ),

        id: 'layout',
        title: 'Layout',

        content: `
          <div class="geneo-layout-name">
            ${renderGeneographLayerNameField(
                'node',
                node
            )}
          </div>

          <div class="geneo-layout-grid">
            <div class="geneo-field">
              <label for="geneoNodeLayoutX">
                X
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutX"
                type="number"
                data-geneo-layout="x"
                value="${Math.round(
                    node.x
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutY">
                Y
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutY"
                type="number"
                data-geneo-layout="y"
                value="${Math.round(
                    node.y
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutWidth">
                Width
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutWidth"
                type="number"
                min="${Math.round(
                    minimumSize.width
                )}"
                max="${Math.round(
                    maximumSize.width
                )}"
                data-geneo-layout="width"
                value="${Math.round(
                    node.width
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutHeight">
                Height
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutHeight"
                type="number"
                min="${Math.round(
                    minimumSize.height
                )}"
                max="${Math.round(
                    maximumSize.height
                )}"
                data-geneo-layout="height"
                value="${Math.round(
                    node.height
                )}">
            </div>
          </div>

          ${
                node.type === 'place'
                    ? `
                <div class="geneo-place-size-controls">
                  <span class="geneo-selection-help">
                    ${
                        autoPlaceSize
                            ? 'Size fits the place name automatically'
                            : 'Manual size'
                    }
                  </span>

                  ${
                        autoPlaceSize
                            ? ''
                            : `
                        <button
                          class="button ghost compact"
                          type="button"
                          data-geneo-place-fit-content>
                          Fit to content
                        </button>
                      `
                    }
                </div>
              `
                    : ''
            }

          ${
                isPerson
                    ? `
                <div class="geneo-person-size-controls">
                  <span class="geneo-selection-help">
                    ${
                        autoHeight
                            ? 'Height fits visible content · Width remains freeform'
                            : 'Freeform size · Hold Shift to preserve ratio'
                    }
                  </span>

                  <div
                    class="geneo-person-size-presets"
                    role="group"
                    aria-label="Person card size">

                    ${[
                        [0.9, '90%'],
                        [1, '100%'],
                        [1.25, '125%']
                    ]
                        .map(
                            ([
                                scale,
                                label
                            ]) => `
                          <button
                            class="button secondary compact"
                            type="button"
                            data-geneo-person-size="${scale}">
                            ${label}
                          </button>
                        `
                        )
                        .join('')}
                  </div>

                  ${
                        autoHeight
                            ? ''
                            : `
                        <button
                          class="button ghost compact"
                          type="button"
                          data-geneo-person-fit-height>
                          Fit height to content
                        </button>
                      `
                    }
                </div>
              `
                    : ''
            }

          <label class="geneo-check">
            <input
              type="checkbox"
              data-geneo-node-visible
              ${
                    node.visible
                        ? 'checked'
                        : ''
                }>

            <span>
              Visible
            </span>
          </label>

          <label class="geneo-check">
            <input
              type="checkbox"
              data-geneo-node-locked
              ${
                    node.locked
                        ? 'checked'
                        : ''
                }>

            <span>
              Locked
            </span>
          </label>
        `
    });
}

function renderGeneographStrokeFields({ scope, appearance })
{
    const connection = scope === 'connection';
    const width = connection ? appearance.width : appearance.strokeWidth;
    const pattern = connection ? appearance.pattern : appearance.strokePattern;
    const strokeEnabled = connection ? appearance.line?.enabled : appearance.stroke?.enabled;
    const prefix = connection ? 'Connection' : 'Node';
    return `<div class="geneo-stroke-settings"><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokeWidth">Width</label><div class="geneo-number-unit"><input class="geneo-input" id="geneo${prefix}StrokeWidth" type="number" min="${GENEO_STROKE_WIDTH_MIN}" max="${GENEO_STROKE_WIDTH_MAX}" step="1" value="${Math.round(width)}" data-geneo-stroke-width="${scope}"><span aria-hidden="true">px</span></div></div><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokePattern">Pattern</label><div class="common-select-shell geneo-pattern-select-shell"><select class="common-select geneo-pattern-select" id="geneo${prefix}StrokePattern" data-geneo-stroke-pattern="${scope}" ${strokeEnabled ? '' : 'disabled'}><option value="solid" ${pattern === 'solid' ? 'selected' : ''}>Solid</option><option value="dashed" ${pattern === 'dashed' ? 'selected' : ''}>Dashed</option></select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></div></div></div>`;
}

function renderGeneographPlaceInspectorContent(
    node
)
{
    const resolved =
        resolveGeneographPlace(node);

    const content = `
        <div class="geneo-place-inspector-summary">
          <span aria-hidden="true">
            ${icon.mapPin}
          </span>

          <div>
            <strong>
              ${escapeHtml(resolved.name)}
            </strong>

            <span>
              ${
                    resolved.linked
                        ? 'Linked project place'
                        : 'Board-only place'
                }
            </span>
          </div>
        </div>

        <div class="geneo-place-inspector-actions">
          <button
            class="button secondary"
            type="button"
            data-geneo-edit-place="${escapeHtml(node.id)}">
            Change place
          </button>

          ${
                resolved.linked
                    ? `
                <button
                  class="button secondary"
                  type="button"
                  data-geneo-open-place="${escapeHtml(node.id)}">
                  Open in Places
                </button>

                <button
                  class="button ghost"
                  type="button"
                  data-geneo-place-board-only="${escapeHtml(node.id)}">
                  Make board-only
                </button>
              `
                    : ''
            }
        </div>
      `;

    return renderGeneographInspectorSection({
        context: 'place',
        id: 'content',
        title: 'Content',
        content
    });
}

function renderGeneographShapeInspectorContent(
    node
)
{
    const kind =
        normalizeGeneographShapeKind(
            node.shapeKind
        );

    const radius =
        Math.round(
            geneoNumber(
                node.appearance?.cornerRadius,
                8,
                0,
                32
            )
        );

    const content = `
        <div class="geneo-field">
          <span class="geneo-field-label">
            Shape type
          </span>

          <div class="geneo-shape-kind-value">
            ${escapeHtml(
                geneoShapeLabel(kind)
            )}
          </div>
        </div>

        ${
            kind === 'ellipse'
                ? ''
                : `
              <div class="geneo-field">
                <label for="geneoShapeCornerRadius">
                  Corner radius
                </label>

                <div class="geneo-number-unit">
                  <input
                    class="geneo-input"
                    id="geneoShapeCornerRadius"
                    type="number"
                    min="0"
                    max="32"
                    step="1"
                    value="${radius}"
                    data-geneo-shape-corner-radius>

                  <span aria-hidden="true">
                    px
                  </span>
                </div>
              </div>
            `
        }
      `;

    return renderGeneographInspectorSection({
        context: 'shape',
        id: 'content',
        title: 'Content',
        content
    });
}

function renderGeneographNodeInspector(
    node
)
{
    const context =
        geneoInspectorContextForNode(
            node
        );

    const appearance =
        node.appearance || {};

    const person =
        node.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    const content =
        node.type === 'person'
            ? renderGeneographPersonInspectorContent(
                person
            )
            : node.type === 'panel'
                ? `
              <div class="geneo-field">
                <label for="geneoPanelTitle">
                  Panel title
                </label>

                <input
                  class="geneo-input"
                  id="geneoPanelTitle"
                  type="text"
                  maxlength="160"
                  data-geneo-node-field="title"
                  value="${escapeHtml(node.title || '')}">
              </div>

              <div class="geneo-field">
                <label for="geneoPanelDescription">
                  Panel description
                </label>

                <textarea
                  class="geneo-textarea"
                  id="geneoPanelDescription"
                  maxlength="500"
                  rows="4"
                  data-geneo-node-field="description"
                  placeholder="Describe the purpose or contents of this panel.">${escapeHtml(
                        node.description || ''
                    )}</textarea>

                <p class="geneo-selection-help">
                  Visible in panel properties only.
                </p>
              </div>
            `
                : isGeneographRichTextNode(
                    node
                )
                    ? renderGeneographRichTextInspectorContent(
                        node
                    )
                    : '';

    const contentSection =
        node.type === 'image'
            ? renderGeneographImageSourceSection(
                node
            )
            : node.type === 'place'
                ? renderGeneographPlaceInspectorContent(
                    node
                )
                : node.type === 'shape'
                    ? renderGeneographShapeInspectorContent(
                        node
                    )
                    : node.type === 'drawing'
                        ? ''
                        : renderGeneographInspectorSection({
                            context,
                            id: 'content',
                            title: 'Content',
                            content
                        });

    const appearanceContent = `
        ${
            node.type === 'drawing'
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'fill'
                })}
              </div>
            `
        }

        <div class="geneo-appearance-group">
          ${renderGeneoPaintControl({
                scope: 'node',
                id: node.id,
                property: 'stroke'
            })}

          ${renderGeneographStrokeFields({
                scope: 'node',
                appearance
            })}
        </div>

        ${
            node.type === 'text'
                ? `
              <div
                class="
                  geneo-field
                  geneo-appearance-subfield
                ">
                <label for="geneoTextCornerRadius">
                  Corner radius
                </label>

                <input
                  class="geneo-input"
                  id="geneoTextCornerRadius"
                  type="number"
                  min="0"
                  max="32"
                  step="1"
                  value="${appearance.cornerRadius}"
                  data-geneo-text-corner-radius>

                <span class="geneo-selection-help">
                  0–32 px
                </span>
              </div>
            `
                : ''
        }

        ${
            [
                'image',
                'shape',
                'drawing'
            ].includes(node.type)
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'text'
                })}

                ${renderGeneoContrastWarning(
                    node
                )}
              </div>
            `
        }
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoNodeTitle(node),
                capitalize(node.type),
                geneoNodeIcon(node.type)
            )}

            ${contentSection}

            ${
                node.type === 'person'
                    ? renderGeneographPersonTreeLinkSection(
                        person
                    )
                    : ''
            }

            ${
                node.type === 'person'
                    ? renderGeneographPersonCardSection(
                        node
                    )
                    : ''
            }

            ${renderGeneographInspectorSection({
                context,
                id: 'appearance',
                title: 'Appearance',
                content: appearanceContent
            })}

            ${renderGeneographNodeLayoutSection(
                node
            )}

            ${renderGeneographInspectorDangerAction(
                `Delete ${capitalize(node.type)}`
            )}
          </div>
        </aside>
      `;
}

function renderGeneographConnectionInspector(
    connection
)
{
    const nameSection =
        renderGeneographConnectionNameSection(
            connection
        );

    const family =
        connection.kind === 'family-partner'
            ? getGeneographFamily(
                connection.familyId
            )
            : null;

    const resolved =
        family
            ? geneoRelationshipForFamily(
                family
            )
            : null;

    const relationship =
        resolved?.relationship;

    const relationshipType =
        relationship
            ? relationshipTypeFromLegacy(
                relationship
            )
            : 'Married';

    const startEvent =
        relationship
            ? partnerRelationshipStartEvent(
                relationship,
                relationshipType
            )
            : null;

    const marriageType =
        startEvent?.typeLabel
        || relationship?.marriageType
        || 'Civil';

    const relationshipSection =
        family
            ? renderGeneographInspectorSection({
                context: 'connection',
                id: 'relationship',
                title: 'Relationship details',
                content: `
                <div
                  class="
                    geneo-relationship-editor
                  "
                  data-geneo-relationship-editor>
                  <div class="geneo-field">
                    <label for="geneoRelationshipType">
                      Relationship type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipType"
                      data-geneo-relationship-type>
                      ${addPersonRelationshipTypeOptions(
                            relationshipType
                        )}
                    </select>
                  </div>

                  ${renderPartnerRelationshipDateFields({
                        prefix:
                      'geneoRelationship',
                        relationshipType,
                        family: relationship
                    })}

                  <div
                    class="geneo-field"
                    data-add-person-marriage-type-field
                    ${
                        addPersonRelationshipShowsMarriageType(
                            relationshipType
                        )
                            ? ''
                            : 'hidden'
                    }>
                    <label for="geneoRelationshipMarriageType">
                      Marriage type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipMarriageType"
                      data-geneo-marriage-type>
                      ${addPersonMarriageTypeOptions(
                            marriageType
                        )}
                    </select>
                  </div>

                  <label class="geneo-check">
                    <input
                      type="checkbox"
                      data-geneo-show-relationship-dates
                      ${
                            connection.showRelationshipDates
                        !== false
                                ? 'checked'
                                : ''
                        }>
                    Show relationship date on board
                  </label>

                  <p class="geneo-relationship-storage">
                    ${
                        resolved.central
                            ? 'Linked Family Tree relationship'
                            : 'Board-only relationship'
                    }
                  </p>

                  <button
                    class="button primary"
                    type="button"
                    data-geneo-save-relationship>
                    Save relationship details
                  </button>
                </div>
              `
            })
            : '';

    const appearanceContent = `
        ${renderGeneoPaintControl({
            scope: 'connection',
            id: connection.id,
            property: 'line'
        })}

        ${renderGeneographStrokeFields({
            scope: 'connection',
            appearance: connection.style
        })}

        <div class="geneo-field">
          <label for="geneoConnectionRouting">
            Routing
          </label>

          <select
            class="geneo-select"
            id="geneoConnectionRouting"
            data-geneo-connection-routing>
            <option
              value="auto"
              ${
                    connection.route.mode === 'auto'
                        ? 'selected'
                        : ''
                }>
              Automatic
            </option>

            <option
              value="manual"
              ${
                    connection.route.mode === 'manual'
                        ? 'selected'
                        : ''
                }>
              Manual
            </option>
          </select>
        </div>

        <button
          class="button secondary"
          type="button"
          data-geneo-reset-route>
          Reset route
        </button>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoConnectionLabel(
                    connection
                ),
                'Connection',
                icon.link
            )}

            ${nameSection}
            ${relationshipSection}

            ${renderGeneographInspectorSection({
                context: 'connection',
                id: 'appearance',
                title: 'Appearance',
                content: appearanceContent
            })}

            ${renderGeneographInspectorDangerAction(
                'Delete connection'
            )}
          </div>
        </aside>
      `;
}

function renderGeneographEditor()
{
    const richTextDraft = captureGeneographRichTextDraft();
    destroyGeneographRichTextEditor();
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    normalizeGeneographRuntimeData();
    pruneGeneographSelection();
    if (
        state.geneoLayerRename
        && !getGeneographRenameEntity(
            state.geneoLayerRename.entityType,
            state.geneoLayerRename.entityId
        )
    )
    {
        state.geneoLayerRename = null;
    }
    geneoEnsureHistory();
    const board = selectedGeneographBoard();
    if (!board)
    {
        state.geneoView = 'home'; renderGeneographHome(); return;
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    renderGeneographEditorSidebar(board);
    const diagram = board.diagram;
    const bounds = geneoDerivedCanvasBounds(diagram);
    geneoCanvasRuntime.bounds = bounds;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const ordered = diagram.nodes.slice().sort((a, b) => (a.type === 'panel' ? -1000 : 0) + a.order - ((b.type === 'panel' ? -1000 : 0) + b.order));
    const stageClasses = [
        'geneo-canvas-stage',
        state.geneoTool === 'connect' ? 'connection-tool' : '',
        state.geneoTool === 'panel'
            ? 'panel-tool'
            : '',
        state.geneoTool === 'sticky'
            ? 'sticky-tool'
            : '',
        state.geneoTool === 'text'
            ? 'text-tool'
            : '',
        state.geneoTool === 'shape'
            ? 'shape-tool'
            : '',
        state.geneoTool === 'pencil'
            ? 'pencil-tool'
            : '',
        state.geneoConnectionDraft ? 'is-connecting' : '',
        diagram.canvas.alwaysShowSockets ? 'show-sockets' : ''
    ].filter(Boolean).join(' ');
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    main.innerHTML = `<section class="geneo-editor">
      <div
        class="geneo-editor-toolbar"
        role="toolbar"
        aria-label="${
            escapeHtml(
                t('Geneograph board tools')
            )
        }"
        data-toolbar-density="expanded">

        <div class="geneo-editor-toolbar-left">
          <div
            class="geneo-history-group"
            role="group"
            aria-label="${escapeHtml(t('History'))}">

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-undo
              aria-label="${escapeHtml(t('Undo'))}"
              title="${escapeHtml(t('Undo'))}"
              ${
                    geneoHistoryRuntime.undo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.undo}
            </button>

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-redo
              aria-label="${escapeHtml(t('Redo'))}"
              title="${escapeHtml(t('Redo'))}"
              ${
                    geneoHistoryRuntime.redo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.redo}
            </button>
          </div>

          <div
            class="geneo-tool-group"
            role="group"
            aria-label="${
                escapeHtml(t('Working mode'))
            }">

            ${
                renderGeneoModeTool(
                    'select',
                    icon.cursorSelect,
                    'Select'
                )
            }

            ${
                renderGeneoModeTool(
                    'pan',
                    icon.pan,
                    'Pan'
                )
            }

            ${
                renderGeneoModeTool(
                    'pencil',
                    icon.edit,
                    'Pencil'
                )
            }
          </div>

          ${renderGeneoConnectionSplitTool()}

          <div
            class="geneo-toolbar-objects"
            aria-label="${
                escapeHtml(t('Add objects'))
            }">

            ${
                renderGeneoToolbarObjectButton(
                    'person',
                    icon.profile,
                    'Person'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'place',
                    icon.mapPin,
                    'Place'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'image',
                    icon.image,
                    'Image'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'panel',
                    icon.panel,
                    'Panel'
                )
            }

            ${renderGeneoContentSplitTool()}

            ${renderGeneoShapeSplitTool()}
          </div>
        </div>

        <div class="geneo-editor-toolbar-right">
          <button
            class="geneo-toolbar-button"
            type="button"
            data-geneo-toolbar-item="export"
            data-geneo-export
            aria-label="${
                escapeHtml(t('Export board'))
            }"
            title="${
                escapeHtml(t('Export board'))
            }">

            ${icon.export}
            <span>${escapeHtml(t('Export'))}</span>
          </button>

          <button
            class="geneo-toolbar-button geneo-icon-button geneo-toolbar-overflow"
            type="button"
            data-geneo-toolbar-overflow
            aria-label="${
                escapeHtml(t('More board tools'))
            }"
            title="${
                escapeHtml(t('More board tools'))
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.more}
          </button>
        </div>
      </div>
        <div class="geneo-editor-main ${state.geneoInspectorCollapsed ? 'inspector-collapsed' : ''}"><div class="geneo-canvas-viewport" data-geneo-canvas-viewport style="--geneo-canvas-background:${escapeHtml(geneoPaintCssColor(diagram.canvas.backgroundPaint))}"><div class="geneo-canvas-wrap" data-geneo-canvas-wrap><div class="geneo-board-space pattern-${escapeHtml(diagram.canvas.backgroundPattern)}" style="width:${bounds.width * zoom}px;height:${bounds.height * zoom}px;--geneo-canvas-zoom:${zoom};--geneo-grid-origin-x:${gridOriginX}px;--geneo-grid-origin-y:${gridOriginY}px"><div class="${stageClasses}" data-geneo-stage style="width:${bounds.width}px;height:${bounds.height}px;transform:scale(${zoom})">
          ${renderGeneographConnectors()}<div class="geneo-panel-draft" data-geneo-panel-draft hidden><span data-geneo-panel-draft-size></span></div><div class="geneo-selection-marquee" data-geneo-marquee hidden></div>${ordered.map(renderGeneographObject).join('')}
          </div></div></div><div class="geneo-zoom-overlay canvas-zoom"><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button><span class="geneo-zoom-value zoom-value">${state.geneoZoom}%</span><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="fit" aria-label="Fit board">${icon.home}</button></div></div>${renderGeneographInspector()}</div>
          </section>`;
    localizeUI(
        main,
        {
            suppressObserverReplay: true
        }
    );

    const autoHeightsChanged =
        syncGeneographAutoPersonCardHeights();

    const autoPlaceSizesChanged =
        syncGeneographAutoPlaceSizes();

    if (
        autoHeightsChanged
        || autoPlaceSizesChanged
    )
    {
        localizeUI(
            main.querySelector(
                '.geneo-connections'
            ),
            {
                suppressObserverReplay: true
            }
        );
    }

    bindGeneographEditor();
    ensureGeneographKeyboardBinding();
    const editingNode =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (
        isGeneographRichTextNode(
            editingNode
        )
    )
    {
        const matchingDraft =
            richTextDraft?.nodeId
            === editingNode.id
                ? richTextDraft
                : null;

        requestAnimationFrame(
            () =>
            {
                initializeGeneographRichTextEditor(
                    editingNode,
                    {
                        draft:
                  matchingDraft
                    }
                );
            }
        );
    }
}

function renderGeneographEditorPreserveScroll({
    preserveInspectorScroll = false,
    preserveSidebarScroll = false
} = {})
{
    const center = geneoCurrentViewportCenter();

    const inspectorScrollTop = preserveInspectorScroll
        ? (
            main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            )?.scrollTop ?? null
        )
        : null;
    const sidebarScrollTop = preserveSidebarScroll
        ? sidebar.querySelector('.geneo-sidebar')?.scrollTop ?? null
        : null;

    renderGeneographEditor();

    scheduleGeneographViewportRestore(center, () =>
    {
        if (inspectorScrollTop !== null)
        {
            const inspector = main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            );

            if (inspector)
            {
                const maximumScrollTop = Math.max(
                    0,
                    inspector.scrollHeight - inspector.clientHeight
                );

                inspector.scrollTop = Math.min(
                    inspectorScrollTop,
                    maximumScrollTop
                );
            }
        }

        if (sidebarScrollTop !== null)
        {
            const geneoSidebar = sidebar.querySelector('.geneo-sidebar');
            if (geneoSidebar)
            {
                geneoSidebar.scrollTop = Math.min(
                    sidebarScrollTop,
                    Math.max(0, geneoSidebar.scrollHeight - geneoSidebar.clientHeight)
                );
            }
        }
    });
}

function geneoNodeCenter(
    node
)
{
    if (!node)
    {
        return null;
    }

    return {
        x:
          node.x
          + node.width / 2,

        y:
          node.y
          + node.height / 2
    };
}

function renderGeneographEditorPreserveCenter(center = null)
{
    const point = center || geneoCurrentViewportCenter();
    renderGeneographEditor();
    scheduleGeneographViewportRestore(point);
}

function nextGeneoObjectPosition(width, height)
{
    const center = geneoCurrentViewportCenter() || geneoContentCenter();
    const baseX = center.x - width / 2;
    const baseY = center.y - height / 2;
    const nodes = selectedGeneographDiagram()?.nodes || [];
    const overlaps = candidate => nodes.some(node =>
        candidate.x < node.x + node.width + 18
        && candidate.x + width + 18 > node.x
        && candidate.y < node.y + node.height + 18
        && candidate.y + height + 18 > node.y
    );
    const offsets = [{ x: 0, y: 0 }];
    for (let ring = 1; ring <= 10; ring += 1)
    {
        const step = ring * 34;
        offsets.push(
            { x: step, y: 0 }, { x: step, y: step }, { x: 0, y: step },
            { x: -step, y: step }, { x: -step, y: 0 }, { x: -step, y: -step },
            { x: 0, y: -step }, { x: step, y: -step }
        );
    }
    const candidate = offsets.map(offset => ({
        x: baseX + offset.x,
        y: baseY + offset.y
    })).find(position => !overlaps(position));
    return candidate || { x: baseX, y: baseY };
}

function isGeneographRichTextNode(
    node
)
{
    return Boolean(
        node
        && (
            node.type === 'text'
          || node.type === 'sticky'
        )
    );
}

function geneographRichTextDisplayHtml(
    node
)
{
    const text =
        String(
            node?.text || ''
        );

    if (!text)
    {
        return `
          <span
            class="geneo-rich-text-placeholder">
            Double-click to edit
          </span>
        `;
    }

    return renderRichTextDeltaHtml(
        node.textFormat
          === 'quill-delta-v1'
            ? node.textDelta
            : null,

        text
    );
}

function renderGeneographRichTextInspectorContent(
    node
)
{
    const editing =
        state.geneoInlineEditNodeId
          === node.id;

    if (!editing)
    {
        return `
          <div
            class="
              geneo-rich-text-inspector-preview
              geneo-rich-text-inspector-${escapeHtml(
                    node.type
                )}
            ">
            ${geneographRichTextDisplayHtml(
                node
            )}
          </div>

          <button
            class="button secondary"
            type="button"
            data-geneo-edit-rich-text="${escapeHtml(
                node.id
            )}">
            Edit text
          </button>
        `;
    }

    const toolbarLabel =
        node.type === 'sticky'
            ? 'Sticky note formatting'
            : 'Text formatting';

    return `
        <div
          class="geneo-rich-text-inspector"
          data-geneo-rich-text-inspector="${escapeHtml(
                node.id
            )}">

          <div
            class="geneo-rich-text-inspector-editor-shell"
            data-geneo-inspector-rich-text-editor-shell>

            ${renderRichTextToolbar({
                id:
                'geneoInspectorRichTextToolbar',

                className:
                'geneo-rich-text-inspector-toolbar',

                ariaLabel:
                toolbarLabel
            })}

            <div
              class="geneo-rich-text-inspector-editor"
              data-geneo-inspector-rich-text-editor>
            </div>

            <textarea
              class="geneo-rich-text-inspector-fallback"
              data-geneo-inspector-rich-text-fallback
              aria-label="${escapeHtml(
                    node.type === 'sticky'
                        ? 'Sticky note content'
                        : 'Text block content'
                )}"
              hidden>${escapeHtml(
                    node.text || ''
                )}</textarea>
          </div>

          <div
            class="geneo-rich-text-inspector-actions">
            <button
              class="button secondary"
              type="button"
              data-geneo-rich-text-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-geneo-rich-text-done>
              Done
            </button>
          </div>
        </div>
      `;
}

function renderGeneographRichTextToolbar(
    node
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
        || state.geneoInlineEditNodeId
          !== node.id
    )
    {
        return '';
    }

    return renderRichTextToolbar({
        id:
          'geneoRichTextToolbar',

        className:
          'geneo-rich-text-toolbar',

        ariaLabel:
          node.type === 'sticky'
              ? 'Sticky note formatting'
              : 'Text formatting'
    });
}

function captureGeneographRichTextDraft()
{
    if (
        !geneoRichTextRuntime
            .nodeId
    )
    {
        return null;
    }

    return {
        nodeId:
          geneoRichTextRuntime
              .nodeId,

        delta:
          cloneRichTextDelta(
              geneoRichTextRuntime
                  .draftDelta
          ),

        text:
          geneoRichTextRuntime
              .draftText,

        fallbackActive:
          geneoRichTextRuntime
              .fallbackActive
    };
}

function destroyGeneographRichTextEditor()
{
    Object.entries(
        geneoRichTextRuntime.instances
    ).forEach(([
        surface,
        instance
    ]) =>
    {
        const handler =
            geneoRichTextRuntime
                .textChangeHandlers[
                    surface
                ];

        if (
            instance
          && handler
        )
        {
            instance.off(
                'text-change',
                handler
            );
        }
    });

    if (
        geneoRichTextRuntime
            .outsidePointerHandler
    )
    {
        document.removeEventListener(
            'pointerdown',
            geneoRichTextRuntime
                .outsidePointerHandler,
            true
        );
    }

    if (
        geneoRichTextRuntime
            .keydownHandler
    )
    {
        document.removeEventListener(
            'keydown',
            geneoRichTextRuntime
                .keydownHandler,
            true
        );
    }

    geneoRichTextRuntime.nodeId =
        '';

    geneoRichTextRuntime.instances = {
        canvas: null,
        inspector: null
    };

    geneoRichTextRuntime
        .textChangeHandlers = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .fallbackElements = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            null;

    geneoRichTextRuntime
        .keydownHandler =
            null;

    geneoRichTextRuntime.draftDelta =
        null;

    geneoRichTextRuntime.draftText =
        '';

    geneoRichTextRuntime.syncing =
        false;

    geneoRichTextRuntime
        .fallbackActive =
            false;
}

function bindGeneographRichTextSessionGuards(
    node
)
{
    const selector =
        `[data-geneo-node="${
            CSS.escape(node.id)
        }"]`;

    const outsidePointerHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.target.closest(
                    selector
                )
            || event.target.closest(
                '[data-geneo-rich-text-inspector]'
            )
            )
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            commitGeneoInlineEdit(
                false
            );
        };

    const keydownHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.key === 'Escape'
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    true
                );

                return;
            }

            if (
                event.key === 'Enter'
            && (
                event.ctrlKey
              || event.metaKey
            )
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    false
                );
            }
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            outsidePointerHandler;

    geneoRichTextRuntime
        .keydownHandler =
            keydownHandler;

    document.addEventListener(
        'pointerdown',
        outsidePointerHandler,
        true
    );

    document.addEventListener(
        'keydown',
        keydownHandler,
        true
    );
}

function initializeGeneographRichTextEditor(
    node,
    {
        draft = null
    } = {}
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
    )
    {
        return;
    }

    const nodeElement =
        main.querySelector(
            `[data-geneo-node="${
                CSS.escape(node.id)
            }"]`
        );

    const inspector =
        main.querySelector(
            `[data-geneo-rich-text-inspector="${
                CSS.escape(node.id)
            }"]`
        );

    if (!nodeElement)
    {
        return;
    }

    const matchingDraft =
        draft?.nodeId === node.id
            ? draft
            : null;

    const initialDelta =
        matchingDraft
            ? cloneRichTextDelta(
                matchingDraft.delta
            )
            : cloneRichTextDelta(
                node.textDelta
            );

    const initialText =
        matchingDraft
            ? String(
                matchingDraft.text || ''
            )
            : String(
                node.text || ''
            );

    geneoRichTextRuntime.nodeId =
        node.id;

    geneoRichTextRuntime.draftDelta =
        initialDelta;

    geneoRichTextRuntime.draftText =
        initialText;

    const surfaces = [
        {
            key: 'canvas',

            shell:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor-shell]'
            ),

            toolbar:
            nodeElement.querySelector(
                '#geneoRichTextToolbar'
            ),

            editorHost:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor]'
            ),

            fallback:
            nodeElement.querySelector(
                '[data-geneo-rich-text-fallback]'
            ),

            bounds:
            nodeElement,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        },

        {
            key: 'inspector',

            shell:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor-shell]'
            ),

            toolbar:
            inspector?.querySelector(
                '#geneoInspectorRichTextToolbar'
            ),

            editorHost:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor]'
            ),

            fallback:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-fallback]'
            ),

            bounds:
            inspector,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        }
    ].filter(surface =>
        surface.shell
        && surface.toolbar
        && surface.editorHost
        && surface.fallback
    );

    if (!surfaces.length)
    {
        return;
    }

    bindGeneographRichTextSessionGuards(
        node
    );

    const requestedSurface =
        state.geneoInlineEditSurface
          === 'inspector'
            ? 'inspector'
            : 'canvas';

    const center =
        geneoCurrentViewportCenter();

    /*
       * Plain-text fallback uses both surfaces
       * as synchronized views of the same draft.
       */
    if (
        typeof window.Quill
          !== 'function'
    )
    {
        geneoRichTextRuntime
            .fallbackActive =
                true;

        surfaces.forEach(surface =>
        {
            surface.toolbar.hidden =
                true;

            surface.editorHost.hidden =
                true;

            surface.fallback.hidden =
                false;

            surface.fallback.value =
                initialText;

            geneoRichTextRuntime
                .fallbackElements[
                    surface.key
                ] =
                    surface.fallback;

            surface.fallback.addEventListener(
                'focus',
                () =>
                {
                    state.geneoInlineEditSurface =
                        surface.key;
                }
            );

            surface.fallback.addEventListener(
                'input',
                () =>
                {
                    geneoRichTextRuntime
                        .draftText =
                            surface.fallback.value;

                    geneoRichTextRuntime
                        .draftDelta =
                            null;

                    Object.entries(
                        geneoRichTextRuntime
                            .fallbackElements
                    ).forEach(([
                        key,
                        element
                    ]) =>
                    {
                        if (
                            key !== surface.key
                  && element
                        )
                        {
                            element.value =
                                surface.fallback.value;
                        }
                    });
                }
            );
        });

        const target =
            geneoRichTextRuntime
                .fallbackElements[
                    requestedSurface
                ]
          || geneoRichTextRuntime
              .fallbackElements.canvas
          || geneoRichTextRuntime
              .fallbackElements.inspector;

        requestAnimationFrame(
            () =>
            {
                target?.focus({
                    preventScroll: true
                });

                if (
                    target
              && state
                  .geneoInlineEditSelectAll
                )
                {
                    target.select();
                }

                state
                    .geneoInlineEditSelectAll =
                        false;

                if (
                    requestedSurface
              === 'canvas'
              && center
                )
                {
                    scheduleGeneographViewportRestore(
                        center
                    );
                }
            }
        );

        return;
    }

    const synchronize =
        (
            sourceKey,
            sourceInstance
        ) =>
        {
            if (
                geneoRichTextRuntime.syncing
            )
            {
                return;
            }

            geneoRichTextRuntime.syncing =
                true;

            const delta =
                normalizeRichTextDelta(
                    sourceInstance
                        .getContents()
                );

            geneoRichTextRuntime
                .draftDelta =
                    delta;

            geneoRichTextRuntime
                .draftText =
                    plainTextFromQuill(
                        sourceInstance
                    );

            Object.entries(
                geneoRichTextRuntime
                    .instances
            ).forEach(([
                key,
                instance
            ]) =>
            {
                if (
                    key === sourceKey
              || !instance
                )
                {
                    return;
                }

                if (delta)
                {
                    instance.setContents(
                        delta,
                        'silent'
                    );
                }
                else
                {
                    instance.setText(
                        geneoRichTextRuntime
                            .draftText,
                        'silent'
                    );
                }
            });

            geneoRichTextRuntime.syncing =
                false;
        };

    surfaces.forEach(surface =>
    {
        const instance =
            createRichTextQuill({
                editorHost:
              surface.editorHost,

                toolbar:
              surface.toolbar,

                bounds:
              surface.bounds,

                placeholder:
              node.type === 'sticky'
                  ? 'Write a note…'
                  : 'Enter text…',

                toolbarLabel:
              node.type === 'sticky'
                  ? 'Sticky note formatting'
                  : 'Text formatting',

                editorLabel:
              surface.editorLabel
            });

        if (!instance)
        {
            return;
        }

        if (initialDelta)
        {
            instance.setContents(
                initialDelta,
                'silent'
            );
        }
        else
        {
            instance.setText(
                initialText,
                'silent'
            );
        }

        instance.history.clear();

        geneoRichTextRuntime
            .instances[
                surface.key
            ] =
                instance;

        const textChangeHandler =
            (
                delta,
                oldDelta,
                source
            ) =>
            {
                if (
                    source !== 'user'
              || geneoRichTextRuntime
                  .nodeId !== node.id
                )
                {
                    return;
                }

                synchronize(
                    surface.key,
                    instance
                );
            };

        geneoRichTextRuntime
            .textChangeHandlers[
                surface.key
            ] =
                textChangeHandler;

        instance.on(
            'text-change',
            textChangeHandler
        );

        instance.root.addEventListener(
            'focus',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );

        surface.toolbar.addEventListener(
            'pointerdown',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );
    });

    const targetInstance =
        geneoRichTextRuntime
            .instances[
                requestedSurface
            ]
        || geneoRichTextRuntime
            .instances.canvas
        || geneoRichTextRuntime
            .instances.inspector;

    requestAnimationFrame(
        () =>
        {
            if (!targetInstance)
            {
                return;
            }

            targetInstance.root.focus({
                preventScroll: true
            });

            const contentLength =
                Math.max(
                    0,
                    targetInstance
                        .getLength() - 1
                );

            if (
                state
                    .geneoInlineEditSelectAll
            && contentLength
            )
            {
                targetInstance.setSelection(
                    0,
                    contentLength,
                    'silent'
                );
            }
            else
            {
                targetInstance.setSelection(
                    contentLength,
                    0,
                    'silent'
                );
            }

            state
                .geneoInlineEditSelectAll =
                    false;

            /*
           * Quill's selection update occurs after
           * the board rerender. Reassert the object
           * center after that focus/selection work.
           */
            if (
                requestedSurface
            === 'canvas'
            && center
            )
            {
                scheduleGeneographViewportRestore(
                    center
                );
            }
        }
    );
}

function focusGeneographInlineEditor()
{
    const input = main.querySelector('[data-geneo-inline-input]');
    if (!input)
    {
        state.geneoInlineEditSelectAll = false;
        return;
    }
    input.focus({ preventScroll: true });
    if (state.geneoInlineEditSelectAll && typeof input.select === 'function') input.select();
    state.geneoInlineEditSelectAll = false;
}

function beginGeneographInlineEdit(
    nodeId,
    {
        selectAll = false,
        surface = 'canvas'
    } = {}
)
{
    const node =
        getGeneographNode(
            nodeId
        );

    if (
        !node
        || ![
            'text',
            'sticky',
            'panel'
        ].includes(node.type)
    )
    {
        return;
    }

    if (
        state.geneoInlineEditNodeId
        && state.geneoInlineEditNodeId
          !== nodeId
    )
    {
        commitGeneoInlineEdit(
            false
        );
    }

    selectGeneographNode(
        nodeId
    );

    state.geneoInlineEditNodeId =
        nodeId;

    state.geneoInlineEditSelectAll =
        selectAll;

    state.geneoInlineEditSurface =
        surface === 'inspector'
            ? 'inspector'
            : 'canvas';

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll:
          true
    });

    if (node.type === 'panel')
    {
        requestAnimationFrame(
            focusGeneographInlineEditor
        );
    }
}

function addGeneographObject(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        !GENEO_NODE_TYPES.has(type)
    )
    {
        return;
    }

    if (
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        activateGeneographPlacementTool(
            type
        );

        return;
    }

    const endedPlacementTool =
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(state.geneoTool);

    if (endedPlacementTool)
    {
        finishGeneographPlacementTool();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    }

    cancelGeneographConnectionDraft();

    if (type === 'person')
    {
        openAddGeneographPersonModal();
        return;
    }

    if (type === 'image')
    {
        openGeneographImagePicker();
        return;
    }

    if (type === 'place')
    {
        openGeneographPlaceModal();
    }
}

function geneoCurrentMoveTool()
{
    return ['select', 'pan'].includes(
        state.geneoTool
    )
        ? state.geneoTool
        : 'pan';
}

function finishGeneographPlacementTool()
{
    const returnTool =
        state.geneoPlacementReturnTool;

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        ['select', 'pan'].includes(
            returnTool
        )
            ? returnTool
            : 'pan';
}

function activateGeneographPlacementTool(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        ![
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        return;
    }

    cancelGeneographConnectionDraft();

    const alreadyActive =
        state.geneoTool === type;

    if (alreadyActive)
    {
        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();

        return;
    }

    state.geneoPlacementReturnTool =
        geneoCurrentMoveTool();

    state.geneoTool =
        type;

    renderGeneographEditorPreserveScroll();

    const instruction =
        type === 'panel'
            ? 'Drag on empty canvas to draw a panel.'
            : type === 'shape'
                ? `Drag on empty canvas to draw a ${geneoShapeLabel(state.geneoShapeKind).toLowerCase()}, or click to use the default size.`
                : type === 'sticky'
                    ? 'Click empty canvas or a panel to place a sticky note.'
                    : 'Click empty canvas or a panel to place a text block.';

    showToast(
        instruction
    );
}

function geneoPanelDraftRect(start, current)
{
    const left = Math.min(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const right = Math.max(start.x, current.x);
    const bottom = Math.max(start.y, current.y);

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

function updateGeneographPanelDraftDom(start, current)
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (!draft) return;

    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    const rect = geneoPanelDraftRect(
        start,
        current
    );

    draft.hidden = false;
    draft.style.left = `${rect.x - bounds.left}px`;
    draft.style.top = `${rect.y - bounds.top}px`;
    draft.style.width = `${rect.width}px`;
    draft.style.height = `${rect.height}px`;

    const size = draft.querySelector(
        '[data-geneo-panel-draft-size]'
    );

    if (size)
    {
        size.textContent =
            `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
}

function hideGeneographPanelDraftDom()
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (draft)
    {
        draft.hidden = true;
    }
}

function geneoPointToSegmentDistance(point, start, end)
{
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
    const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}

function simplifyGeneographDrawingPoints(points, tolerance)
{
    if (!Array.isArray(points) || points.length <= 2) return points ? [...points] : [];
    let farthestIndex = 0;
    let farthestDistance = 0;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const distance = geneoPointToSegmentDistance(points[index], points[0], points.at(-1));
        if (distance > farthestDistance)
        {
            farthestDistance = distance;
            farthestIndex = index;
        }
    }
    if (farthestDistance <= tolerance) return [points[0], points.at(-1)];
    const first = simplifyGeneographDrawingPoints(points.slice(0, farthestIndex + 1), tolerance);
    const second = simplifyGeneographDrawingPoints(points.slice(farthestIndex), tolerance);
    return [...first.slice(0, -1), ...second];
}

function geneoSmoothAbsolutePath(points)
{
    if (!Array.isArray(points) || points.length < 2) return '';
    const number = value => Number(value.toFixed(3));
    let path = `M ${number(points[0].x)} ${number(points[0].y)}`;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const point = points[index];
        const next = points[index + 1];
        path += ` Q ${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
    }
    const last = points.at(-1);
    return `${path} L ${number(last.x)} ${number(last.y)}`;
}

function updateGeneographPencilPreview(points = [])
{
    const preview = main.querySelector('[data-geneo-pencil-preview]');
    if (!preview) return;
    const path = geneoSmoothAbsolutePath(points);
    preview.hidden = !path;
    preview.setAttribute('d', path);
}

function cancelGeneographPencilStroke()
{
    if (geneoPointerState?.kind !== 'pencil') return false;
    const activeStroke = geneoPointerState;
    geneoPointerState = null;
    if (activeStroke.wrap?.hasPointerCapture?.(activeStroke.pointerId))
    {
        activeStroke.wrap.releasePointerCapture(activeStroke.pointerId);
    }
    updateGeneographPencilPreview();
    return true;
}

function createGeneographDrawingFromPoints(sourcePoints, beforeSnapshot = null)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('drawing');
    const zoom = Math.max(.25, state.geneoZoom / 100);
    const points = simplifyGeneographDrawingPoints(sourcePoints, 1.5 / zoom);
    if (!diagram || points.length < 2) return null;
    const length = points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
    if (length < 4 / zoom) return null;
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const width = Math.max(defaults.minWidth, maxX - minX);
    const height = Math.max(defaults.minHeight, maxY - minY);
    const x = (minX + maxX) / 2 - width / 2;
    const y = (minY + maxY) / 2 - height / 2;
    const drawing = {
        id: createRuntimeId('geneo-node'),
        type: 'drawing',
        points: points.map(point => ({
            x: geneoNumber((point.x - x) / width, 0, 0, 1),
            y: geneoNumber((point.y - y) / height, 0, 0, 1)
        })),
        x,
        y,
        width,
        height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(defaults.appearance)
    };
    if (beforeSnapshot) geneoPushHistorySnapshot(beforeSnapshot);
    else geneoPushHistory();
    diagram.nodes.push(drawing);
    drawing.parentPanelId = geneoContainingPanelForNode(drawing)?.id || null;
    selectGeneographNode(drawing.id);
    touchGeneographBoard();
    return drawing;
}

function createGeneographPanelFromRect(rect)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('panel');

    if (
        !diagram
        || rect.width < defaults.minWidth
        || rect.height < defaults.minHeight
    )
    {
        return null;
    }

    geneoPushHistory();

    const panel = {
        id: createRuntimeId('geneo-node'),
        type: 'panel',
        title: 'New panel',
        description: '',
        x: snapGeneographCoordinate(rect.x),
        y: snapGeneographCoordinate(rect.y),
        width: rect.width,
        height: rect.height,
        parentPanelId: null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item => item.order || 0)
          ) + 1,
        visible: true,
        locked: false,
        appearance: {
            ...defaults.appearance
        }
    };

    diagram.nodes.push(panel);

    reconcileGeneographPanelMembership(panel.id);
    selectGeneographNode(panel.id);
    touchGeneographBoard();

    return panel;
}

function createGeneographShapeFromRect(rect, { useDefaultSize = false } = {})
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('shape');
    if (!diagram || !rect) return null;
    const source = useDefaultSize
        ? {
            x: rect.x - defaults.width / 2,
            y: rect.y - defaults.height / 2,
            width: defaults.width,
            height: defaults.height
        }
        : rect;
    if (source.width < defaults.minWidth || source.height < defaults.minHeight) return null;
    const position = snapGeneographPoint({ x: source.x, y: source.y });
    const shape = {
        id: createRuntimeId('geneo-node'),
        type: 'shape',
        shapeKind: normalizeGeneographShapeKind(state.geneoShapeKind),
        x: position.x,
        y: position.y,
        width: Math.max(defaults.minWidth, snapGeneographCoordinate(source.width)),
        height: Math.max(defaults.minHeight, snapGeneographCoordinate(source.height)),
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(defaults.appearance)
    };
    geneoPushHistory();
    diagram.nodes.push(shape);
    shape.parentPanelId = geneoContainingPanelForNode(shape)?.id || null;
    selectGeneographNode(shape.id);
    touchGeneographBoard();
    return shape;
}

function createGeneographPlaceNode(placeRef)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('place');
    if (!diagram || !placeRef) return null;
    const position = snapGeneographPoint(nextGeneoObjectPosition(defaults.width, defaults.height));
    const node = {
        id: createRuntimeId('geneo-node'),
        type: 'place',
        placeRef: structuredClone(placeRef),
        placeSizeMode: 'auto',
        x: position.x,
        y: position.y,
        width: defaults.width,
        height: defaults.height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(defaults.appearance)
    };
    diagram.nodes.push(node);
    node.parentPanelId = geneoContainingPanelForNode(node)?.id || null;
    selectGeneographNode(node.id);
    return node;
}

function cleanGeneographPlacePickerName(
    value
)
{
    return String(value || '')
        .replace(
            /[\r\n\u0000-\u001F\u007F]/g,
            ' '
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .slice(
            0,
            160
        );
}

function geneographPlacePickerMatchScore(
    place,
    query
)
{
    const normalizedQuery =
        normalizePlaceLookupText(query);

    if (!normalizedQuery)
    {
        return 1;
    }

    const candidates = [
        place.name,
        placePrimaryName(place),
        placeSecondaryName(place),
        placeCountry(place),
        ...placeAlternativeNames(place)
    ];

    for (const candidate of candidates)
    {
        if (!candidate) continue;

        const normalizedCandidate =
            normalizePlaceLookupText(
                candidate
            );

        if (
            normalizedCandidate.startsWith(
                normalizedQuery
            )
        )
        {
            return 3;
        }

        if (
            normalizedCandidate.includes(
                normalizedQuery
            )
        )
        {
            return 2;
        }
    }

    return 0;
}

function geneographPlacePickerViewModel(
    projectId,
    pickerState
)
{
    const query =
        cleanGeneographPlacePickerName(
            pickerState.query
        );

    const allPlaces =
        projectPlaces(projectId)
            .filter(place =>
                place &&
            !place.deleted
            );

    const exactPlace =
        query
            ? allPlaces.find(place =>
                normalizePlaceLookupText(
                    placeDisplayText(place)
                ) ===
              normalizePlaceLookupText(
                  query
              )
            ) || null
            : null;

    const matches =
        allPlaces
            .map(place => ({
                place,

                score:
              geneographPlacePickerMatchScore(
                  place,
                  query
              ),

                peopleCount:
              getPeopleForPlace(
                  place.id,
                  {
                      projectId
                  }
              ).length
            }))
            .filter(item =>
                item.score > 0
            )
            .sort(
                (left, right) =>
                    right.score - left.score
              || right.peopleCount
                - left.peopleCount
              || placeDisplayText(
                  left.place
              ).localeCompare(
                  placeDisplayText(
                      right.place
                  )
              )
            )
            .map(item =>
                item.place
            );

    return {
        query,
        allPlaces,
        matches,
        exactPlace,

        boardOnlyCandidate:
          query && !exactPlace
              ? query
              : ''
    };
}

function renderGeneographPlacePickerResults(
    model,
    pickerState
)
{
    if (!model.matches.length)
    {
        const noProjectPlaces =
            !model.allPlaces.length;

        const title =
            noProjectPlaces
                ? 'No project places yet.'
                : `No project places match “${model.query}”.`;

        const support =
            noProjectPlaces &&
          !model.query
                ? 'Type a name above to create a board-only place.'
                : '';

        return `
          <div class="geneo-place-picker-empty">
            <div>
              <strong>
                ${escapeHtml(title)}
              </strong>

              ${
                    support
                        ? `
                    <span>
                      ${escapeHtml(support)}
                    </span>
                  `
                        : ''
                }
            </div>
          </div>
        `;
    }

    return model.matches
        .map(place =>
        {
            const selected =
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId === place.id;

            const primary =
                placePrimaryName(place)
            || placeDisplayText(place)
            || 'Unnamed place';

            const context =
                placeSecondaryName(place)
            || 'Project place';

            return `
            <button
              class="
                geneo-place-picker-option
                ${selected ? 'selected' : ''}
              "
              type="button"
              data-geneo-place-picker-choice="project"
              data-geneo-place-picker-id="${escapeHtml(
                    place.id
                )}"
              aria-pressed="${
                    selected
                        ? 'true'
                        : 'false'
                }"
              aria-label="${escapeHtml(
                    `Select ${primary}`
                )}">

              <span
                class="geneo-place-picker-option-copy">
                <strong>
                  ${escapeHtml(primary)}
                </strong>

                <span>
                  ${escapeHtml(context)}
                </span>
              </span>

              <span
                class="geneo-place-picker-check"
                data-geneo-place-picker-check
                aria-hidden="true"
                ${selected ? '' : 'hidden'}>
                ${icon.check}
              </span>
            </button>
          `;
        })
        .join('');
}

function renderGeneographBoardOnlyPlaceChoice(
    model,
    pickerState
)
{
    if (!model.boardOnlyCandidate)
    {
        return '';
    }

    const selected =
        pickerState.choice?.type
          === 'board'
        && normalizePlaceLookupText(
            pickerState.choice.name
        ) ===
          normalizePlaceLookupText(
              model.boardOnlyCandidate
          );

    return `
        <button
          class="
            geneo-place-board-choice
            ${selected ? 'selected' : ''}
          "
          type="button"
          data-geneo-place-picker-choice="board"
          data-geneo-board-place-name="${escapeHtml(
                model.boardOnlyCandidate
            )}"
          aria-pressed="${
                selected
                    ? 'true'
                    : 'false'
            }">

          <span
            class="geneo-place-board-choice-copy">
            <strong>
              Create board-only place
            </strong>

            <span
              class="geneo-place-board-choice-name">
              ${escapeHtml(
                    model.boardOnlyCandidate
                )}
            </span>

            <span
              class="geneo-place-board-choice-meta">
              Only available on this board
            </span>
          </span>

          <span
            class="geneo-place-picker-check"
            data-geneo-place-picker-check
            aria-hidden="true"
            ${selected ? '' : 'hidden'}>
            ${icon.check}
          </span>
        </button>
      `;
}

function geneographPlacePickerPrimaryLabel(
    pickerState,
    editing
)
{
    if (
        pickerState.choice?.type
          === 'board'
    )
    {
        return editing
            ? 'Save board-only place'
            : 'Add board-only place';
    }

    return editing
        ? 'Save changes'
        : 'Add place';
}

function renderGeneographPlacePickerModal({
    editing,
    pickerState,
    model
})
{
    return `
        <div
          class="modal geneo-place-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoPlaceModalTitle">

          <form
            class="geneo-place-picker-form"
            data-geneo-place-form
            novalidate>

            <div class="modal-header">
              <div>
                <h2 id="geneoPlaceModalTitle">
                  ${
                        editing
                            ? 'Edit place object'
                            : 'Add place'
                    }
                </h2>

                <p>
                  Add an existing project place or create a place that exists only on this board.
                </p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="Close">
                ${icon.close}
              </button>
            </div>

            <div
              class="
                modal-body
                geneo-place-picker-body
              ">

              <div
                class="
                  field
                  geneo-place-picker-search
                ">
                <label for="geneoPlacePickerSearch">
                  Search places
                </label>

                <input
                  id="geneoPlacePickerSearch"
                  type="search"
                  value="${escapeHtml(
                        pickerState.query
                    )}"
                  placeholder="Search project places or type a board-only name"
                  autocomplete="off"
                  aria-describedby="geneoPlacePickerHelp"
                  data-geneo-place-picker-search
                  autofocus>
              </div>

              <section
                class="geneo-place-picker-results-section"
                aria-labelledby="geneoPlacePickerResultsTitle">

                <div
                  class="geneo-place-picker-results-heading">
                  <h3 id="geneoPlacePickerResultsTitle">
                    Project places
                  </h3>

                  <span
                    class="geneo-place-picker-count"
                    data-geneo-place-picker-count
                    aria-live="polite">
                    ${model.matches.length}
                  </span>
                </div>

                <div
                  class="geneo-place-picker-results"
                  data-geneo-place-picker-results
                  aria-label="Project place results">
                  ${renderGeneographPlacePickerResults(
                        model,
                        pickerState
                    )}
                </div>
              </section>

              <div
                class="geneo-place-board-choice-host"
                data-geneo-place-board-choice-host>
                ${renderGeneographBoardOnlyPlaceChoice(
                    model,
                    pickerState
                )}
              </div>

              <p
                class="geneo-place-modal-help"
                id="geneoPlacePickerHelp">
                Project places stay linked and reflect future name changes. Board-only places exist only on this board.
              </p>

              <span
                class="
                  field-error
                  geneo-place-picker-error
                "
                data-geneo-place-error
                role="alert"
                aria-live="polite">
              </span>
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
                type="submit"
                data-geneo-place-picker-submit
                ${
                    pickerState.choice
                        ? ''
                        : 'disabled'
                }>
                ${escapeHtml(
                    geneographPlacePickerPrimaryLabel(
                        pickerState,
                        editing
                    )
                )}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openGeneographPlaceModal(
    nodeId = ''
)
{
    const board =
        selectedGeneographBoard();

    const node =
        nodeId
            ? getGeneographNode(
                nodeId
            )
            : null;

    if (
        !board
        || (
            nodeId
          && node?.type !== 'place'
        )
    )
    {
        return;
    }

    const resolved =
        node
            ? resolveGeneographPlace(
                node,
                board
            )
            : null;

    const editing =
        Boolean(node);

    const initialBoardName =
        resolved && !resolved.linked
            ? cleanGeneographPlacePickerName(
                resolved.name
            )
            : '';

    const pickerState = {
        query:
          initialBoardName,

        choice:
          resolved?.linked
              ? {
                  type: 'project',
                  placeId:
                  resolved.place.id
              }
              : null
    };

    if (
        initialBoardName
        && !geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        ).exactPlace
    )
    {
        pickerState.choice = {
            type: 'board',
            name: initialBoardName
        };
    }

    const initialModel =
        geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        );

    openModal(
        renderGeneographPlacePickerModal({
            editing,
            pickerState,
            model: initialModel
        })
    );

    const form =
        modalBackdrop.querySelector(
            '[data-geneo-place-form]'
        );

    const searchInput =
        form?.querySelector(
            '[data-geneo-place-picker-search]'
        );

    const resultsHost =
        form?.querySelector(
            '[data-geneo-place-picker-results]'
        );

    const boardChoiceHost =
        form?.querySelector(
            '[data-geneo-place-board-choice-host]'
        );

    const countElement =
        form?.querySelector(
            '[data-geneo-place-picker-count]'
        );

    const primaryButton =
        form?.querySelector(
            '[data-geneo-place-picker-submit]'
        );

    const errorElement =
        form?.querySelector(
            '[data-geneo-place-error]'
        );

    if (
        !form
        || !searchInput
        || !resultsHost
        || !boardChoiceHost
        || !countElement
        || !primaryButton
    )
    {
        return;
    }

    const clearError = () =>
    {
        if (errorElement)
        {
            errorElement.textContent =
                '';
        }

        searchInput.removeAttribute(
            'aria-invalid'
        );
    };

    const choiceIsSelected = (
        button
    ) =>
    {
        const type =
            button.dataset
                .geneoPlacePickerChoice;

        if (type === 'project')
        {
            return (
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId ===
                button.dataset
                    .geneoPlacePickerId
            );
        }

        if (type === 'board')
        {
            return (
                pickerState.choice?.type
              === 'board'
            && normalizePlaceLookupText(
                pickerState.choice.name
            ) ===
              normalizePlaceLookupText(
                  button.dataset
                      .geneoBoardPlaceName
              )
            );
        }

        return false;
    };

    const updateChoiceUi = () =>
    {
        form
            .querySelectorAll(
                '[data-geneo-place-picker-choice]'
            )
            .forEach(button =>
            {
                const selected =
                    choiceIsSelected(
                        button
                    );

                button.classList.toggle(
                    'selected',
                    selected
                );

                button.setAttribute(
                    'aria-pressed',
                    selected
                        ? 'true'
                        : 'false'
                );

                const check =
                    button.querySelector(
                        '[data-geneo-place-picker-check]'
                    );

                if (check)
                {
                    check.hidden =
                        !selected;
                }
            });

        primaryButton.disabled =
            !pickerState.choice;

        primaryButton.textContent =
            geneographPlacePickerPrimaryLabel(
                pickerState,
                editing
            );
    };

    const refreshResults = () =>
    {
        const model =
            geneographPlacePickerViewModel(
                board.projectId,
                pickerState
            );

        resultsHost.innerHTML =
            renderGeneographPlacePickerResults(
                model,
                pickerState
            );

        boardChoiceHost.innerHTML =
            renderGeneographBoardOnlyPlaceChoice(
                model,
                pickerState
            );

        countElement.textContent =
            String(
                model.matches.length
            );

        updateChoiceUi();
    };

    searchInput.addEventListener(
        'input',
        () =>
        {
            pickerState.query =
                searchInput.value;

            /*
          * Typing changes the candidate but does not implicitly
          * select either a Project place or a board-only place.
          */
            pickerState.choice =
                null;

            clearError();
            refreshResults();
        }
    );

    form.addEventListener(
        'click',
        event =>
        {
            const choiceButton =
                event.target.closest(
                    '[data-geneo-place-picker-choice]'
                );

            if (
                !choiceButton
            || !form.contains(
                choiceButton
            )
            )
            {
                return;
            }

            const choiceType =
                choiceButton.dataset
                    .geneoPlacePickerChoice;

            if (
                choiceType === 'project'
            )
            {
                const place =
                    getPlace(
                        choiceButton.dataset
                            .geneoPlacePickerId
                    );

                if (
                    !place
              || place.deleted
              || place.projectId
                !== board.projectId
                )
                {
                    refreshResults();
                    return;
                }

                pickerState.choice = {
                    type: 'project',
                    placeId: place.id
                };
            }
            else if (
                choiceType === 'board'
            )
            {
                const name =
                    cleanGeneographPlacePickerName(
                        choiceButton.dataset
                            .geneoBoardPlaceName
                    );

                if (!name) return;

                pickerState.choice = {
                    type: 'board',
                    name
                };
            }
            else
            {
                return;
            }

            clearError();

            /*
          * Do not rerender the result buttons after selection.
          * Updating their state in place preserves keyboard focus.
          */
            updateChoiceUi();
        }
    );

    form.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            let nextRef = null;

            if (
                pickerState.choice?.type
              === 'project'
            )
            {
                const projectPlace =
                    getPlace(
                        pickerState.choice
                            .placeId
                    );

                const validProjectPlace =
                    projectPlace
              && !projectPlace.deleted
              && projectPlace.projectId
                === board.projectId;

                if (validProjectPlace)
                {
                    nextRef = {
                        scope: 'project',
                        id: projectPlace.id,
                        fallbackName:
                  String(
                      placePrimaryName(
                          projectPlace
                      )
                    || projectPlace.name
                    || ''
                  )
                      .trim()
                      .slice(
                          0,
                          160
                      )
                    };
                }
            }
            else if (
                pickerState.choice?.type
              === 'board'
            )
            {
                const boardOnlyName =
                    cleanGeneographPlacePickerName(
                        pickerState.choice.name
                    );

                if (boardOnlyName)
                {
                    nextRef = {
                        scope: 'board',
                        name: boardOnlyName
                    };
                }
            }

            if (!nextRef)
            {
                if (errorElement)
                {
                    errorElement.textContent =
                        'Select a project place or the board-only creation choice.';
                }

                searchInput.setAttribute(
                    'aria-invalid',
                    'true'
                );

                searchInput.focus({
                    preventScroll: true
                });

                return;
            }

            geneoPushHistory();

            const target =
                node
            || createGeneographPlaceNode(
                nextRef
            );

            if (!target)
            {
                geneoHistoryRuntime
                    .undo
                    .pop();

                return;
            }

            if (node)
            {
                target.placeRef =
                    nextRef;
            }

            touchGeneographBoard();
            closeModal();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: editing
            });

            requestAnimationFrame(() =>
            {
                main
                    .querySelector(
                        `[data-geneo-node="${CSS.escape(target.id)}"]`
                    )
                    ?.focus({ preventScroll: true });
            });

            showToast(
                editing
                    ? 'Place object updated.'
                    : 'Place added to board.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            searchInput.focus({
                preventScroll: true
            });

            const cursorPosition =
                searchInput.value.length;

            searchInput.setSelectionRange(
                cursorPosition,
                cursorPosition
            );
        }
    );
}

function makeGeneographPlaceBoardOnly(nodeId)
{
    const node = getGeneographNode(nodeId);
    if (node?.type !== 'place') return;
    const name = resolveGeneographPlace(node).name;
    geneoPushHistory();
    node.placeRef = { scope: 'board', name };
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    showToast('Place is now board-only.');
}

function openGeneographPlaceInPlaces(nodeId)
{
    const node = getGeneographNode(nodeId);
    const resolved = node?.type === 'place' ? resolveGeneographPlace(node) : null;
    if (!resolved?.linked) return;
    captureGeneographViewport();
    state.activeModule = 'Places';
    state.placesView = 'list';
    state.selectedPlaceId = resolved.place.id;
    render();
}

function createGeneographRichTextNodeAtPoint(
    type,
    point
)
{
    const diagram =
        selectedGeneographDiagram();

    if (
        !diagram
        || !point
        || ![
            'sticky',
            'text'
        ].includes(type)
    )
    {
        return null;
    }

    const defaults =
        geneoNodeDefaults(type);

    /*
       * The click represents the visual center
       * of the new object.
       */
    const position =
        snapGeneographPoint({
            x:
            point.x
            - defaults.width / 2,

            y:
            point.y
            - defaults.height / 2
        });

    const text =
        type === 'text'
            ? 'New text'
            : '';

    const textDelta =
        type === 'text'
            ? {
                ops: [
                    {
                        insert:
                    'New text'
                    },

                    {
                        insert: '\n',

                        attributes: {
                            header: 2
                        }
                    }
                ]
            }
            : null;

    geneoPushHistory();

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),

        type,

        text,
        textDelta,

        textFormat:
          textDelta
              ? 'quill-delta-v1'
              : '',

        x: position.x,
        y: position.y,

        width:
          defaults.width,

        height:
          defaults.height,

        parentPanelId: null,

        order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

        visible: true,
        locked: false,

        appearance:
          structuredClone(
              defaults.appearance
          )
    };

    diagram.nodes.push(node);

    node.parentPanelId =
        geneoContainingPanelForNode(
            node
        )?.id || null;

    selectGeneographNode(
        node.id
    );

    touchGeneographBoard();

    /*
       * Placement is one-shot. Return to the
       * movement mode that was active before
       * Text/Sticky placement was armed.
       */
    finishGeneographPlacementTool();

    beginGeneographInlineEdit(
        node.id,
        {
            selectAll:
            type === 'text',

            surface:
            'canvas'
        }
    );

    return node;
}

function clearGeneographConnectionClick()
{
    geneoCanvasRuntime.connectionClick = null;
}

function handleGeneographConnectionClick(event)
{
    event.stopPropagation();
    const path = event.currentTarget;
    const connectionId = path?.dataset.geneoConnection || '';
    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
    if (!connectionId || geneoCanvasRuntime.suppressNodeClick)
    {
        clearGeneographConnectionClick();
        return;
    }
    const segmentValue = path.matches('.geneo-segment-hit') ? Number(path.dataset.geneoSegment) : null;
    const segmentIndex = Number.isInteger(segmentValue) ? segmentValue : null;
    const previous = geneoCanvasRuntime.connectionClick;
    const now = performance.now();
    const distance = previous ? Math.hypot(event.clientX - previous.clientX, event.clientY - previous.clientY) : Infinity;
    const isDoubleClick = !modified
        && previous?.connectionId === connectionId
        && now - previous.at <= 450
        && distance <= 7;
    if (isDoubleClick)
    {
        event.preventDefault();
        const requestedSegment = Number.isInteger(segmentIndex) ? segmentIndex : previous.segmentIndex;
        const point = geneoPointerToCanvas(event);
        clearGeneographConnectionClick();
        insertGeneographWaypoint(connectionId, point, Number.isInteger(requestedSegment) ? requestedSegment : null);
        return;
    }
    geneoCanvasRuntime.connectionClick = modified ? null : {
        connectionId,
        segmentIndex,
        clientX: event.clientX,
        clientY: event.clientY,
        at: now
    };
    selectGeneographConnection(connectionId, null, { toggle: modified });
    renderGeneographEditorPreserveScroll();
}

function geneoRelativeDefaultGender(type)
{
    if (
        ['father', 'son', 'brother']
            .includes(type)
    )
    {
        return 'male';
    }

    if (
        ['mother', 'daughter', 'sister']
            .includes(type)
    )
    {
        return 'female';
    }

    return 'unknown';
}

function geneoRelativeLabel(type)
{
    const labels = {
        father: 'father',
        mother: 'mother',
        parent: 'parent',
        partner: 'partner',
        son: 'son',
        daughter: 'daughter',
        child: 'child',
        brother: 'brother',
        sister: 'sister',
        sibling: 'sibling'
    };

    return labels[type] || 'relative';
}

function geneoRelativeCategory(type)
{
    if (
        ['father', 'mother', 'parent']
            .includes(type)
    )
    {
        return 'parent';
    }

    if (
        ['son', 'daughter', 'child']
            .includes(type)
    )
    {
        return 'child';
    }

    if (
        ['brother', 'sister', 'sibling']
            .includes(type)
    )
    {
        return 'sibling';
    }

    return 'partner';
}

function geneoRelativeNodePlacement(
    anchorNode,
    relativeType,
    width,
    height
)
{
    const diagram =
        selectedGeneographDiagram();

    const category =
        geneoRelativeCategory(
            relativeType
        );

    const horizontalGap = 110;
    const verticalGap = 130;

    const centerX =
        anchorNode.x
        + anchorNode.width / 2
        - width / 2;

    const centerY =
        anchorNode.y
        + anchorNode.height / 2
        - height / 2;

    const candidates = [];

    for (let step = 1; step <= 6; step += 1)
    {
        if (category === 'parent')
        {
            const y =
                anchorNode.y
            - height
            - verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else if (category === 'child')
        {
            const y =
                anchorNode.y
            + anchorNode.height
            + verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else
        {
            const distance =
                step
            * (width + horizontalGap);

            candidates.push(
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap
                + (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap
                - (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap,
                    y:
                centerY
                + distance
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap,
                    y:
                centerY
                + distance
                }
            );
        }
    }

    const parentPanel =
        getGeneographNode(
            anchorNode.parentPanelId
        );

    const nodes =
        diagram.nodes.filter(node =>
            node.id !== parentPanel?.id
        );

    const overlaps = position =>
        nodes.some(node =>
            position.x
            < node.x + node.width + 18
          && position.x + width + 18
            > node.x
          && position.y
            < node.y + node.height + 18
          && position.y + height + 18
            > node.y
        );

    const insideParent = position =>
        Boolean(
            parentPanel?.type === 'panel'
          && position.x >= parentPanel.x + 16
          && position.y >= parentPanel.y + 16
          && position.x + width
            <= parentPanel.x
              + parentPanel.width
              - 16
          && position.y + height
            <= parentPanel.y
              + parentPanel.height
              - 16
        );

    const snappedCandidates =
        candidates.map(position =>
            snapGeneographPoint(position)
        );

    let position = parentPanel
        ? snappedCandidates.find(candidate =>
            insideParent(candidate)
            && !overlaps(candidate)
        )
        : null;

    position =
        position
        || snappedCandidates.find(candidate =>
            !overlaps(candidate)
        )
        || nextGeneoObjectPosition(
            width,
            height
        );

    return {
        ...position,
        parentPanelId:
          parentPanel
          && insideParent(position)
              ? parentPanel.id
              : geneoContainingPanelForNode({
                  id: '',
                  type: 'person',
                  ...position,
                  width,
                  height,
                  visible: true
              })?.id || null
    };
}

function connectGeneographCreatedRelative(
    anchorNode,
    relativeNode,
    relativeType
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    const anchorPersonId =
        anchorNode.personId;

    const relativePersonId =
        relativeNode.personId;

    if (category === 'parent')
    {
        createGeneographParentChildRelationship(
            relativePersonId,
            anchorPersonId,
            {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            {
                nodeId: anchorNode.id,
                port: 'top'
            }
        );

        return;
    }

    if (category === 'child')
    {
        createGeneographParentChildRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    if (category === 'sibling')
    {
        createGeneographSiblingRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'top'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    createGeneographPartnerRelationship(
        anchorPersonId,
        relativePersonId,
        {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    );
}

function openGeneographRelativePopover(
    anchor,
    nodeId
)
{
    const node =
        getGeneographNode(nodeId);

    const person =
        node?.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    if (!anchor || !node || !person)
    {
        return;
    }

    closeMenu();

    const displayName =
        geneoPersonDisplayName(person);

    const popover =
        document.createElement('div');

    popover.className =
        'relative-popover geneo-relative-popover';

    popover.id = 'relativePopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        `Add relative to ${displayName}`
    );

    popover.innerHTML = `
        <div class="relative-popover-body">
          <h2>New relative</h2>
          <p>to ${escapeHtml(displayName)}</p>

          <div class="relative-group">
            Parents
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="father">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Father
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="mother">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Mother
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="parent">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Parent
            </button>
          </div>

          <div class="relative-group">
            Partner
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="partner">
              <span class="relative-choice-icon marriage-icon">
                ${icon.marriage}
              </span>
              Partner / Spouse
            </button>
          </div>

          <div class="relative-group">
            Children
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="son">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Son
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="daughter">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Daughter
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="child">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Child
            </button>
          </div>

          <div class="relative-group">
            Siblings
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="brother">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Brother
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="sister">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Sister
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="sibling">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Sibling
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(popover);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    positionRelativePopover(
        popover,
        anchor
    );

    popover
        .querySelectorAll(
            '[data-geneo-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const relativeType =
                        button.dataset.geneoRelative;

                    closeMenu();

                    openGeneographPersonModal(
                        '',
                        {
                            relative: {
                                anchorNodeId: node.id,
                                type: relativeType
                            }
                        }
                    );
                }
            );
        });

    bindMenuLifecycle(anchor);

    requestAnimationFrame(() =>
    {
        popover
            .querySelector(
                '[data-geneo-relative]'
            )
            ?.focus();
    });
}

let geneoPersonPossibleMatchState = {
    selectedPersonId: '',
    refreshFrame: null
};

function collectGeneographPersonDraftForMatching()
{
    const value =
        selector =>
            modalBackdrop
                ?.querySelector(selector)
                ?.value
          || '';

    const firstName =
        normalizeAddPersonMatchText(
            value('#geneoPersonFirstName')
        );

    const middleName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMiddleName')
        );

    const lastName =
        normalizeAddPersonMatchText(
            value('#geneoPersonLastName')
        );

    const maidenName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMaidenName')
        );

    const birthDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthDate')
        );

    const deathDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathDate')
        );

    const birthPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthPlace')
        );

    const deathPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathPlace')
        );

    return {
        firstName,
        middleName,
        lastName,
        maidenName,
        birthDate,
        deathDate,
        birthPlace,
        deathPlace,
        hasSignal: Boolean(
            firstName
          || middleName
          || lastName
          || maidenName
          || birthDate
          || deathDate
          || birthPlace
          || deathPlace
        )
    };
}

function geneoPossibleMatchScoreOptions(
    options = {}
)
{
    const anchorNode =
        options.relative?.anchorNodeId
            ? getGeneographNode(
                options.relative.anchorNodeId
            )
            : null;

    const anchorPerson =
        anchorNode?.type === 'person'
            ? getGeneographPerson(
                anchorNode.personId
            )
            : null;

    return {
        connectToPersonId:
          anchorPerson?.treePersonId
          || ''
    };
}

function findGeneographPersonPossibleMatches(
    options = {}
)
{
    const draft =
        collectGeneographPersonDraftForMatching();

    if (!draft.hasSignal) return [];

    const projectId =
        selectedGeneographBoard()?.projectId
        || currentProjectId();

    const scoreOptions =
        geneoPossibleMatchScoreOptions(
            options
        );

    return getPeople(projectId)
        .filter(person =>
            person?.id
          && !person.deleted
          && person.id
            !== scoreOptions.connectToPersonId
        )
        .map(person => ({
            person,
            score:
            scoreAddPersonPossibleMatch(
                person,
                draft,
                scoreOptions
            )
        }))
        .filter(item => item.score >= 24)
        .sort(
            (first, second) =>
                second.score - first.score
            || connectPersonName(
                first.person
            ).localeCompare(
                connectPersonName(
                    second.person
                )
            )
        )
        .slice(0, 2);
}

function renderGeneographPersonPossibleMatchesCard(
    options = {},
    {
        initial = false
    } = {}
)
{
    const draft =
        initial
            ? { hasSignal: false }
            : collectGeneographPersonDraftForMatching();

    const matches =
        initial
            ? []
            : findGeneographPersonPossibleMatches(
                options
            );

    const selectedStillVisible =
        matches.some(item =>
            item.person.id
          === geneoPersonPossibleMatchState
              .selectedPersonId
        );

    if (
        geneoPersonPossibleMatchState
            .selectedPersonId
        && !selectedStillVisible
    )
    {
        geneoPersonPossibleMatchState
            .selectedPersonId = '';
    }

    const header = `
        <h3>
          Possible matches<br>
          <span class="panel-muted">
            Similar people in Family Tree
          </span>
        </h3>
      `;

    if (!draft.hasSignal)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            Enter a name, date, or place to check the Family Tree.
          </div>
        </div>`;
    }

    if (!matches.length)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            No strong matches found in the Family Tree.
          </div>
        </div>`;
    }

    const relative =
        Boolean(
            options.relative
        );

    return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
        ${header}
        <div class="add-person-match-list">
          ${matches.map(item =>
                renderAddPersonPossibleMatchRow(
                    item,
                    {
                        context: 'geneograph',
                        selectedPersonId:
                  geneoPersonPossibleMatchState
                      .selectedPersonId
                    }
                )
            ).join('')}
        </div>
        <button
          class="button primary add-person-match-action"
          type="button"
          data-geneo-person-match-action
          ${selectedStillVisible ? '' : 'disabled'}>
          ${icon.link}
          <span>
            ${relative ? 'Connect selected' : 'Add selected'}
          </span>
        </button>
      </div>`;
}

function bindGeneographPersonPossibleMatchCard(
    options = {}
)
{
    modalBackdrop
        ?.querySelectorAll(
            '[data-geneo-person-possible-match]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    geneoPersonPossibleMatchState
                        .selectedPersonId =
                            button.dataset
                                .geneoPersonPossibleMatch
                  || '';

                    refreshGeneographPersonPossibleMatches(
                        options,
                        {
                            focusSelected: true
                        }
                    );
                }
            );
        });

    modalBackdrop
        ?.querySelector(
            '[data-geneo-person-match-action]'
        )
        ?.addEventListener(
            'click',
            () =>
                commitGeneographPersonPossibleMatch(
                    options
                )
        );
}

function refreshGeneographPersonPossibleMatches(
    options = {},
    {
        focusSelected = false
    } = {}
)
{
    const current =
        modalBackdrop?.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    if (!current) return;

    const body =
        modalBackdrop.querySelector(
            '.modal-body'
        );

    const scrollTop =
        body?.scrollTop || 0;

    current.outerHTML =
        renderGeneographPersonPossibleMatchesCard(
            options
        );

    const refreshed =
        modalBackdrop.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    localizeUI(
        refreshed,
        {
            suppressObserverReplay: true
        }
    );
    bindGeneographPersonPossibleMatchCard(
        options
    );

    if (body)
    {
        body.scrollTop = scrollTop;
    }

    if (
        focusSelected
        && geneoPersonPossibleMatchState
            .selectedPersonId
    )
    {
        refreshed
            ?.querySelector(
                `[data-geneo-person-possible-match="${CSS.escape(
                    geneoPersonPossibleMatchState
                        .selectedPersonId
                )}"]`
            )
            ?.focus({
                preventScroll: true
            });
    }
}

function scheduleGeneographPersonPossibleMatchesRefresh(
    options = {}
)
{
    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState
        .refreshFrame =
            requestAnimationFrame(() =>
            {
                geneoPersonPossibleMatchState
                    .refreshFrame = null;

                refreshGeneographPersonPossibleMatches(
                    options
                );
            });
}

function renderGeneographPersonStatusField(status)
{
    return `<div class="field add-person-status-field"><label>Living status</label><button class="add-person-status-button" type="button" id="geneoPersonStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(status)}"></span><span id="geneoPersonStatusLabel">${escapeHtml(status)}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="geneoPersonLivingStatus" value="${escapeHtml(status)}"><div class="add-person-status-menu" id="geneoPersonStatusMenu" role="listbox" hidden>${['Living', 'Deceased', 'Unknown'].map(value => `<button class="add-person-status-option ${value === status ? 'active' : ''}" type="button" role="option" aria-selected="${value === status}" data-geneo-person-status="${value}"><span><span class="add-person-status-dot ${statusDotClass(value)}"></span>${value}</span><span data-status-check>${value === status ? icon.check : ''}</span></button>`).join('')}</div></div>`;
}

function renderGeneographPersonModal(
    person = null,
    {
        relative = null
    } = {}
)
{
    const editing = Boolean(person);

    const names =
        normalizeGeneographPersonNames(
            person || {}
        );

    const defaultGender =
        relative
            ? geneoRelativeDefaultGender(
                relative.type
            )
            : 'unknown';

    const gender =
        ['male', 'female', 'unknown']
            .includes(person?.gender)
            ? person.gender
            : defaultGender;

    const status =
        person?.livingStatus
        || 'Living';

    const relativeLabel =
        relative
            ? geneoRelativeLabel(
                relative.type
            )
            : '';

    const modalTitle =
        editing
            ? 'Edit person'
            : relative
                ? `Add ${relativeLabel}`
                : 'Add person';

    const modalDescription =
        editing
            ? 'Update this board person without changing the linked Family Tree record.'
            : relative
                ? 'Create a board-local person and connect them to the selected card.'
                : 'Create a board-local person. You can link them to Family Tree later.';
    const birth = person?.birth || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    const death = person?.death || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    return `<div class="modal add-person-modal geneo-person-modal" role="dialog" aria-modal="true" aria-labelledby="geneoPersonModalTitle">
        <div class="modal-header add-person-header">
          <div class="add-person-icon" aria-hidden="true">
            ${icon.people}
          </div>
          <div>
            <h2 id="geneoPersonModalTitle">${escapeHtml(modalTitle)}</h2>
            <p>${escapeHtml(modalDescription)}</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">
            ${icon.close}
          </button>
        </div>

        <form id="geneoPersonForm">
          <div class="modal-body add-person-grid geneo-person-grid ${editing ? 'is-editing' : ''}">
            <div class="form-grid geneo-person-form">
              <section>
                <h3 class="form-section-title">Identity</h3>
                <div class="two-col-form">
                  <div class="field add-person-select-field">
                    <label for="geneoPersonGender">Gender</label>
                    <select class="compact-select add-person-select" id="geneoPersonGender">
                      <option value="male" ${gender === 'male' ? 'selected' : ''}>Male</option>
                      <option value="female" ${gender === 'female' ? 'selected' : ''}>Female</option>
                      <option value="unknown" ${gender === 'unknown' ? 'selected' : ''}>Unknown</option>
                    </select>
                    <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
                  </div>

                  ${renderGeneographPersonStatusField(status)}

                  <div class="field">
                    <label for="geneoPersonFirstName">First name</label>
                    <input id="geneoPersonFirstName" data-source-value="${escapeHtml(names.first)}" value="${escapeHtml(localizedDataFieldValue(names.first))}" placeholder="e.g. Silver" autofocus>
                  </div>

                  <div class="field">
                    <label for="geneoPersonLastName">Last name</label>
                    <input id="geneoPersonLastName" data-source-value="${escapeHtml(names.last)}" value="${escapeHtml(localizedDataFieldValue(names.last))}" placeholder="e.g. Whiskerfield">
                  </div>

                  <div class="field">
                    <label for="geneoPersonMiddleName">Middle name / Patronym</label>
                    <input id="geneoPersonMiddleName" data-source-value="${escapeHtml(names.middle)}" value="${escapeHtml(localizedDataFieldValue(names.middle))}">
                  </div>

                  <div class="field" data-geneo-maiden-name ${gender === 'female' ? '' : 'hidden'}>
                    <label for="geneoPersonMaidenName">Maiden name</label>
                    <input id="geneoPersonMaidenName" data-source-value="${escapeHtml(names.maiden)}" value="${escapeHtml(localizedDataFieldValue(names.maiden))}">
                  </div>
                </div>
              </section>

              <section>
                <h3 class="form-section-title">Life events</h3>
                <div class="add-person-life-grid">
                  <div class="add-person-life-event-block">
                    ${renderGenealogyDateField('geneoPersonBirth', 'Birth date', birth, {
                        inputId: 'geneoPersonBirthDate',
                        typeId: 'geneoPersonBirthDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonBirthPlace',
                        label: 'Birth place',
                        value: placeInputDisplayValue(birth.placeId, birth.placeText),
                        selectedPlaceId: birth.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>

                  <div class="add-person-life-event-block add-person-death-fields" data-geneo-death-fields ${status === 'Deceased' ? '' : 'hidden'}>
                    ${renderGenealogyDateField('geneoPersonDeath', 'Death date', death, {
                        inputId: 'geneoPersonDeathDate',
                        typeId: 'geneoPersonDeathDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonDeathPlace',
                        label: 'Death place',
                        value: placeInputDisplayValue(death.placeId, death.placeText),
                        selectedPlaceId: death.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>
                </div>
              </section>
            </div>

            ${editing ? '' : `
              <aside class="geneo-person-match-rail">
                ${renderGeneographPersonPossibleMatchesCard({ relative }, { initial: true })}
              </aside>
            `}
          </div>

          <div class="modal-footer add-person-footer">
            <div class="add-person-footer-left"></div>
            <div class="add-person-footer-actions">
              <button class="button secondary" type="button" data-close>Cancel</button>
              <button class="button primary" type="submit">
                ${
                    editing
                        ? 'Save changes'
                        : relative
                            ? `Add ${escapeHtml(relativeLabel)}`
                            : 'Add person'
                }
              </button>
            </div>
          </div>
        </form>
      </div>`;
}

function updateGeneographPersonModalConditionalFields({ clearDeath = false } = {})
{
    const gender = modalBackdrop.querySelector('#geneoPersonGender')?.value || 'unknown';
    const status = modalBackdrop.querySelector('#geneoPersonLivingStatus')?.value || 'Living';
    const deathFields = modalBackdrop.querySelector('[data-geneo-death-fields]');
    const maiden = modalBackdrop.querySelector('[data-geneo-maiden-name]');
    if (maiden) maiden.hidden = gender !== 'female';
    if (deathFields) deathFields.hidden = status !== 'Deceased';
    if (clearDeath && status !== 'Deceased')
    {
        applyGenealogyDateToField('geneoPersonDeath', emptyGenealogyDate('Exact date'));
        const input = modalBackdrop.querySelector('#geneoPersonDeathPlace');
        if (input)
        {
            input.value = ''; input.dataset.placeId = '';
        }
    }
}

function geneoBoardRepresentationForTreePerson(
    treePersonId
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !treePersonId)
    {
        return {
            person: null,
            node: null
        };
    }

    const person =
        diagram.people.find(item =>
            item.treePersonId === treePersonId
        ) || null;

    const node =
        person
            ? diagram.nodes.find(item =>
                item.type === 'person'
              && item.personId === person.id
            ) || null
            : null;

    return {
        person,
        node
    };
}

function createGeneographLinkedBoardPerson(
    treePerson,
    projectId
)
{
    const gender =
        String(
            treePerson?.gender || ''
        ).toLowerCase();

    const recordedDeath =
        geneoPersonHasRecordedDeath(
            treePerson
        );

    const livingStatus =
        [
            'Living',
            'Deceased',
            'Unknown'
        ].includes(
            treePerson?.livingStatus
        )
            ? treePerson.livingStatus
            : recordedDeath
                ? 'Deceased'
                : 'Living';

    return {
        id:
          createRuntimeId(
              'geneo-person'
          ),
        treePersonId:
          treePerson.id,
        syncState: 'linked',
        names:
          normalizeGeneographPersonNames(
              treePerson
          ),
        gender:
          [
              'male',
              'female',
              'unknown'
          ].includes(gender)
              ? gender
              : 'unknown',
        livingStatus,
        birth:
          normalizeGeneographPersonVital(
              treePerson.birth,
              projectId
          ),
        death:
          livingStatus === 'Deceased'
              ? normalizeGeneographPersonVital(
                  treePerson.death,
                  projectId
              )
              : {
                  ...emptyGenealogyDate(
                      'Exact date'
                  ),
                  placeId: null,
                  placeText: ''
              },
        photoId: null,
        photoCrop: null
    };
}

function createGeneographPersonNodeForBoardPerson(
    boardPerson,
    {
        relative = null
    } = {}
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !boardPerson)
    {
        return null;
    }

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    const defaults =
        geneoNodeDefaults('person');

    const personCard =
        geneoEmptyPersonCardOverrides(
            false
        );

    const draftNode = {
        type: 'person',
        personId: boardPerson.id,
        width: defaults.width,
        height: defaults.height,
        personCard
    };

    const reference =
        geneoPersonCardReferenceSize(
            draftNode,
            diagram
        );

    const placement =
        anchorNode && relative
            ? geneoRelativeNodePlacement(
                anchorNode,
                relative.type,
                reference.width,
                reference.height
            )
            : {
                ...nextGeneoObjectPosition(
                    reference.width,
                    reference.height
                ),
                parentPanelId: null
            };

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),
        type: 'person',
        personId: boardPerson.id,
        x: placement.x,
        y: placement.y,
        width: reference.width,
        height: reference.height,
        parentPanelId:
          placement.parentPanelId
          || null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item =>
                  item.order || 0
              )
          ) + 1,
        visible: true,
        locked: false,
        personCard,
        appearance: {
            ...defaults.appearance,
            fill: {
                color: '#173029',
                opacity: 100,
                enabled: true
            },
            stroke: {
                color: '#62D99A',
                opacity: 100,
                enabled: true
            },
            strokeWidth: 2
        }
    };

    diagram.nodes.push(node);
    return node;
}

function geneoRelativeConnectionEndpoints(
    anchorNode,
    relativeNode,
    relativeType
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    if (category === 'parent')
    {
        return {
            source: {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: anchorNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'child')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'sibling')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'top'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    return {
        source: {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        target: {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    };
}

function commitGeneographPersonPossibleMatch(
    options = {}
)
{
    const treePerson =
        getPerson(
            geneoPersonPossibleMatchState
                .selectedPersonId
        );

    const board =
        selectedGeneographBoard();

    const diagram =
        selectedGeneographDiagram();

    if (
        !treePerson
        || !board
        || !diagram
        || treePerson.projectId
          !== board.projectId
        || treePerson.deleted
    )
    {
        showToast(
            'Select a possible match first.'
        );
        return;
    }

    const relative =
        options.relative || null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );
        return;
    }

    let {
        person: boardPerson,
        node
    } = geneoBoardRepresentationForTreePerson(
        treePerson.id
    );

    if (relative && node)
    {
        const endpoints =
            geneoRelativeConnectionEndpoints(
                anchorNode,
                node,
                relative.type
            );

        const validation =
            canCreateGeneographConnection(
                endpoints.source,
                endpoints.target
            );

        if (!validation.valid)
        {
            showToast(
                validation.reason
            || 'This relationship cannot be created.'
            );
            return;
        }
    }

    const creatingPerson =
        !boardPerson;

    const creatingNode =
        !node;

    const connecting =
        Boolean(relative);

    const mutating =
        creatingPerson
        || creatingNode
        || connecting;

    if (mutating)
    {
        geneoPushHistory();
    }

    if (!boardPerson)
    {
        boardPerson =
            createGeneographLinkedBoardPerson(
                treePerson,
                board.projectId
            );

        diagram.people.push(
            boardPerson
        );
    }

    if (!node)
    {
        node =
            createGeneographPersonNodeForBoardPerson(
                boardPerson,
                {
                    relative
                }
            );
    }

    if (!node) return;

    if (relative)
    {
        connectGeneographCreatedRelative(
            anchorNode,
            node,
            relative.type
        );
    }

    selectGeneographNode(
        node.id
    );

    if (mutating)
    {
        touchGeneographBoard();
    }

    closeModal();

    if (
        !mutating
        && node
    )
    {
        renderGeneographEditorPreserveCenter(
            geneoNodeCenter(node)
        );
    }
    else
    {
        renderGeneographEditorPreserveScroll();
    }

    requestAnimationFrame(() =>
    {
        main
            .querySelector(
                `[data-geneo-node="${CSS.escape(node.id)}"]`
            )
            ?.focus({
                preventScroll: true
            });
    });

    const name =
        connectPersonName(
            treePerson
        );

    if (relative)
    {
        showToast(
            `${name} connected as ${geneoRelativeLabel(relative.type)}.`
        );
        return;
    }

    showToast(
        creatingNode
            ? `${name} added to board.`
            : `${name} is already on this board.`
    );
}

function saveGeneographPersonModal(
    personId = '',
    {
        relative = null
    } = {}
)
{
    const existing =
        personId
            ? getGeneographPerson(personId)
            : null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );

        closeModal();
        return;
    }

    const birthDate =
        collectGenealogyDateField(
            'geneoPersonBirth'
        );

    const status =
        modalBackdrop
            .querySelector(
                '#geneoPersonLivingStatus'
            )?.value
        || 'Living';

    const deathDate =
        status === 'Deceased'
            ? collectGenealogyDateField(
                'geneoPersonDeath'
            )
            : emptyGenealogyDate(
                'Exact date'
            );

    if (!birthDate || !deathDate)
    {
        modalBackdrop
            .querySelector(
                '.genealogy-date-field.has-error input'
            )
            ?.focus({
                preventScroll: true
            });

        return;
    }

    const projectId =
        selectedGeneographBoard()
            ?.projectId
        || currentProjectId();

    const birthPlace =
        resolvePlaceAssignment(
            readPlaceInputValue(
                '#geneoPersonBirthPlace',
                modalBackdrop
            ),
            existing?.birth?.placeId || ''
        );

    const deathPlace =
        status === 'Deceased'
            ? resolvePlaceAssignment(
                readPlaceInputValue(
                    '#geneoPersonDeathPlace',
                    modalBackdrop
                ),
                existing?.death?.placeId || ''
            )
            : {
                placeId: null,
                placeText: ''
            };

    const gender =
        modalBackdrop
            .querySelector(
                '#geneoPersonGender'
            )?.value
        || 'unknown';

    const enteredFirstName =
        collectLocalizedDataFieldValue(
            modalBackdrop.querySelector(
                '#geneoPersonFirstName'
            ),
            existing?.names?.first || ''
        ).trim();

    const values = {
        names: {
            first:
            enteredFirstName
            || (
                existing
                    ? ''
                    : 'Unknown'
            ),

            middle:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonMiddleName'
                ),
                existing?.names?.middle || ''
            ).trim(),

            last:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonLastName'
                ),
                existing?.names?.last || ''
            ).trim(),

            maiden:
            gender === 'female'
                ? collectLocalizedDataFieldValue(
                    modalBackdrop.querySelector(
                        '#geneoPersonMaidenName'
                    ),
                    existing?.names?.maiden || ''
                ).trim()
                : ''
        },

        gender,
        livingStatus: status,

        birth:
          normalizeGeneographPersonVital(
              {
                  ...birthDate,
                  placeId:
                birthPlace.placeId || null,
                  placeText:
                birthPlace.placeText || ''
              },
              projectId
          ),

        death:
          status === 'Deceased'
              ? normalizeGeneographPersonVital(
                  {
                      ...deathDate,
                      placeId:
                    deathPlace.placeId
                    || null,
                      placeText:
                    deathPlace.placeText
                    || ''
                  },
                  projectId
              )
              : {
                  ...emptyGenealogyDate(
                      'Exact date'
                  ),
                  placeId: null,
                  placeText: ''
              }
    };

    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !projectId) return;

    geneoPushHistory();

    let createdNode = null;

    if (existing)
    {
        Object.assign(existing, values);

        if (existing.treePersonId)
        {
            existing.syncState = 'modified';
        }
        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
              && node.personId
                === existing.id
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );
    }
    else
    {
        const defaults =
            geneoNodeDefaults('person');

        const person = {
            id:
          createRuntimeId(
              'geneo-person'
          ),

            treePersonId: null,
            syncState: 'local',

            ...values,

            photoId: null,
            photoCrop: null
        };

        diagram.people.push(person);

        const personCard =
            geneoEmptyPersonCardOverrides(
                false
            );

        const draftNode = {
            type: 'person',
            personId: person.id,
            width:
          defaults.width,
            height:
          defaults.height,
            personCard
        };

        const reference =
            geneoPersonCardReferenceSize(
                draftNode,
                diagram
            );

        draftNode.width =
            reference.width;

        draftNode.height =
            reference.height;

        const initialWidth =
            draftNode.width;

        const initialHeight =
            draftNode.height;

        const placement =
            anchorNode && relative
                ? geneoRelativeNodePlacement(
                    anchorNode,
                    relative.type,
                    initialWidth,
                    initialHeight
                )
                : {
                    ...nextGeneoObjectPosition(
                        initialWidth,
                        initialHeight
                    ),

                    parentPanelId: null
                };

        createdNode = {
            id:
          createRuntimeId(
              'geneo-node'
          ),

            type: 'person',
            personId: person.id,

            x: placement.x,
            y: placement.y,

            width:
          initialWidth,

            height:
          initialHeight,

            parentPanelId:
          placement.parentPanelId
          || null,

            order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

            visible: true,
            locked: false,

            personCard,

            appearance: {
                ...defaults.appearance,

                fill: {
                    color: '#173029',
                    opacity: 100,
                    enabled: true
                },

                stroke: {
                    color: '#62D99A',
                    opacity: 100,
                    enabled: true
                },

                strokeWidth: 2
            }
        };

        diagram.nodes.push(
            createdNode
        );

        if (anchorNode && relative)
        {
            connectGeneographCreatedRelative(
                anchorNode,
                createdNode,
                relative.type
            );
        }

        selectGeneographNode(
            createdNode.id
        );
    }

    touchGeneographBoard();

    closeModal();

    renderGeneographEditorPreserveScroll();

    if (createdNode)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(createdNode.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    if (createdNode && relative)
    {
        showToast(
            `${
                capitalize(
                    geneoRelativeLabel(
                        relative.type
                    )
                )
            } added to the board.`
        );

        return;
    }

    showToast(
        existing
            ? 'Board person updated.'
            : 'Person added to board.'
    );
}

function bindGeneographPersonModal(personId = '', options = {})
{
    const form = modalBackdrop.querySelector('#geneoPersonForm');
    const statusButton = modalBackdrop.querySelector('#geneoPersonStatusButton');
    const statusMenu = modalBackdrop.querySelector('#geneoPersonStatusMenu');
    bindGenealogyDateFields(modalBackdrop);
    bindPlaceComboboxes(modalBackdrop);
    modalBackdrop.querySelector('#geneoPersonGender')?.addEventListener('change', () =>
    {
        updateGeneographPersonModalConditionalFields();
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    });
    statusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const open = Boolean(statusMenu?.hidden);
        if (statusMenu) statusMenu.hidden = !open;
        statusButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    statusMenu?.querySelectorAll('[data-geneo-person-status]').forEach(button => button.addEventListener('click', () =>
    {
        const status = button.dataset.geneoPersonStatus;
        modalBackdrop.querySelector('#geneoPersonLivingStatus').value = status;
        modalBackdrop.querySelector('#geneoPersonStatusLabel').textContent = status;
        const dot = modalBackdrop.querySelector('.add-person-status-current .add-person-status-dot');
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        statusMenu.hidden = true;
        statusButton.setAttribute('aria-expanded', 'false');
        statusMenu.querySelectorAll('[data-geneo-person-status]').forEach(option =>
        {
            const selected = option.dataset.geneoPersonStatus === status;
            option.classList.toggle('active', selected);
            option.setAttribute('aria-selected', selected ? 'true' : 'false');
            const check = option.querySelector('[data-status-check]');
            if (check) check.innerHTML = selected ? icon.check : '';
        });
        updateGeneographPersonModalConditionalFields({ clearDeath: true });
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    }));

    bindGeneographPersonPossibleMatchCard(
        options
    );

    [
        '#geneoPersonFirstName',
        '#geneoPersonMiddleName',
        '#geneoPersonLastName',
        '#geneoPersonMaidenName',
        '#geneoPersonBirthDate',
        '#geneoPersonDeathDate',
        '#geneoPersonBirthPlace',
        '#geneoPersonDeathPlace'
    ].forEach(selector =>
    {
        const input =
            modalBackdrop.querySelector(
                selector
            );

        if (!input) return;

        input.addEventListener(
            'input',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );

        input.addEventListener(
            'change',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );
    });

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            saveGeneographPersonModal(
                personId,
                options
            );
        }
    );
    updateGeneographPersonModalConditionalFields();
}

function openGeneographPersonModal(
    personId = '',
    options = {}
)
{
    const person =
        personId
            ? getGeneographPerson(personId)
            : null;

    if (personId && !person) return;

    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState = {
        selectedPersonId: '',
        refreshFrame: null
    };

    openModal(
        renderGeneographPersonModal(
            person,
            options
        )
    );

    bindGeneographPersonModal(
        person?.id || '',
        options
    );
}

function openAddGeneographPersonModal()
{
    openGeneographPersonModal();
}

function resetGeneographImagePickerState()
{
    geneoImageUploadRequestId += 1;

    state.geneoImagePicker = {
        open: false,
        mode: 'add',
        nodeId: null,
        sourceTab: 'project',
        search: '',
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        uploadErrors: [],
        uploadBusy: false
    };
}

function geneoImagePickerProjectId()
{
    return selectedGeneographBoard()?.projectId || '';
}

function geneoImagePickerProjectPhotos()
{
    const projectId = geneoImagePickerProjectId();
    const query = state.geneoImagePicker.search
        .trim()
        .toLowerCase();

    return getProjectPhotos(projectId)
        .filter(photo => !photo.deletedAt)
        .filter(photo =>
            !query || photoSearchText(photo).includes(query)
        );
}

function geneoImagePickerSelectedProjectIds()
{
    return new Set(
        state.geneoImagePicker.selectedProjectPhotoIds || []
    );
}

function geneoImageUploadDraftAsPhoto(draft)
{
    if (!draft) return null;

    return {
        id: draft.id,
        kind: 'photo',
        title: geneoFilenameStem(draft.filename),
        filename: draft.filename,
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,
        placeholder: {
            pattern: 'archive',
            palette: 'moss',
            seed: draft.seed || 1
        }
    };
}

function geneoImagePickerSelectedSources()
{
    const picker = state.geneoImagePicker;
    const projectId = geneoImagePickerProjectId();

    const projectSources = [
        ...geneoImagePickerSelectedProjectIds()
    ]
        .map(photoId =>
            getPhoto(photoId, { projectId })
        )
        .filter(photo => photo && !photo.deletedAt)
        .map(photo => ({
            scope: 'project',
            photo
        }));

    const uploadSources = (
        picker.uploadDrafts || []
    )
        .filter(photoUploadDraftIsValid)
        .map(draft => ({
            scope: 'board',
            photo: geneoImageUploadDraftAsPhoto(draft),
            draft
        }));

    /*
      * Replacement remains a single-source workflow. The active tab
      * determines whether the project photo or uploaded draft is used.
      */
    if (picker.mode === 'replace')
    {
        return picker.sourceTab === 'upload'
            ? uploadSources.slice(0, 1)
            : projectSources.slice(0, 1);
    }

    /*
      * Add mode combines selections from both tabs so users can select
      * project photos, upload additional images, and add them together.
      */
    return [
        ...projectSources,
        ...uploadSources
    ];
}

function geneoImagePickerPendingCount()
{
    return geneoImagePickerSelectedSources().length;
}

function geneoImagePickerCountLabel(count)
{
    if (!count) return 'No images selected';

    return `${count} ${
        count === 1 ? 'image' : 'images'
    } selected`;
}

function geneoImagePickerActionLabel(count)
{
    if (state.geneoImagePicker.mode === 'replace')
    {
        return 'Replace image';
    }

    if (!count) return 'Add images';

    return `Add ${count} ${
        count === 1 ? 'image' : 'images'
    }`;
}

function renderGeneographImageCandidate(photo)
{
    const selected =
        geneoImagePickerSelectedProjectIds().has(photo.id);

    const replacing =
        state.geneoImagePicker.mode === 'replace';

    const title = geneoImageRecordName(photo);

    const metadata = [
        photo.width && photo.height
            ? `${photo.width} × ${photo.height}`
            : '',
        formatPhotoDate(photo)
    ]
        .filter(Boolean)
        .join(' · ');

    const actionLabel = replacing
        ? `Use ${title}`
        : `${selected ? 'Deselect' : 'Select'} ${title}`;

    return `
        <button
          class="
            person-photo-candidate
            person-photos-adder-candidate
          "
          type="button"
          data-geneo-image-candidate="${escapeHtml(photo.id)}"
          aria-pressed="${selected}"
          aria-label="${escapeHtml(actionLabel)}">

          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}

            <span
              class="person-photos-adder-check"
              data-geneo-image-candidate-check
              ${selected ? '' : 'hidden'}
              aria-hidden="true">
              ${icon.check}
            </span>
          </span>

          <span class="person-photo-candidate-copy">
            <strong>${escapeHtml(title)}</strong>
            <span>
              ${escapeHtml(metadata || 'Project photo')}
            </span>
          </span>
        </button>
      `;
}

function renderGeneographImageProjectResults()
{
    const allPhotos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const photos = geneoImagePickerProjectPhotos();
    const hasSearch = Boolean(
        state.geneoImagePicker.search.trim()
    );

    if (!allPhotos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No project photos yet.</strong>
              <span class="muted">
                Upload an image that will stay local to this board.
              </span>
              <button
                class="button primary"
                type="button"
                data-geneo-image-show-upload>
                Upload new image
              </button>
            </div>
          </div>
        `;
    }

    if (!photos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No matching project photos.</strong>

              <div class="person-photo-empty-actions">
                ${
                    hasSearch
                        ? `
                      <button
                        class="button secondary"
                        type="button"
                        data-geneo-image-clear-search>
                        Clear search
                      </button>
                    `
                        : ''
                }

                <button
                  class="button primary"
                  type="button"
                  data-geneo-image-show-upload>
                  Upload new image
                </button>
              </div>
            </div>
          </div>
        `;
    }

    return `
        <div class="person-photo-candidate-grid">
          ${photos.map(renderGeneographImageCandidate).join('')}
        </div>
      `;
}

function renderGeneographImageProjectPanel()
{
    return `
        <div class="person-photo-project-panel">
          <div class="person-photo-project-controls">
            <label
              class="search-input"
              aria-label="Search project photos">
              ${icon.search}

              <input
                type="search"
                data-geneo-image-search
                value="${escapeHtml(state.geneoImagePicker.search)}"
                placeholder="Search project photos">
            </label>
          </div>

          <div
            class="person-photo-project-results"
            data-geneo-image-project-results>
            ${renderGeneographImageProjectResults()}
          </div>
        </div>
      `;
}

function renderGeneographImageUploadDraft(draft)
{
    const photo = geneoImageUploadDraftAsPhoto(draft);
    const title = draft.filename || 'Uploaded image';

    return `
        <article
          class="
            person-photo-candidate
            person-photos-adder-upload-card
          ">

          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}

            <button
              class="person-photos-adder-upload-remove"
              type="button"
              data-geneo-image-remove-upload="${escapeHtml(draft.id)}"
              aria-label="${escapeHtml(`Remove ${title}`)}"
              title="Remove upload">
              ${icon.close}
            </button>
          </span>

          <span class="person-photo-candidate-copy">
            <strong>${escapeHtml(title)}</strong>

            <span>
              ${escapeHtml(
                    `${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}`
                )}
            </span>
          </span>
        </article>
      `;
}

function renderGeneographImageUploadErrors()
{
    const errors =
        state.geneoImagePicker.uploadErrors || [];

    if (!errors.length) return '';

    return `
        <div
          class="person-photos-adder-upload-errors"
          role="alert">
          <strong>
            ${
                errors.length === 1
                    ? 'One file could not be added:'
                    : `${errors.length} files could not be added:`
            }
          </strong>

          <ul>
            ${errors
                .map(error => `
                <li>${escapeHtml(error)}</li>
              `)
                .join('')}
          </ul>
        </div>
      `;
}

function renderGeneographImageUploadPanel()
{
    const picker = state.geneoImagePicker;
    const drafts = picker.uploadDrafts || [];
    const replacing = picker.mode === 'replace';

    const maxMegabytes = Math.round(
        PHOTO_UPLOAD_MAX_BYTES / (1024 * 1024)
    );

    const promptTitle = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Drop an image here'
        : drafts.length
            ? 'Add more images'
            : 'Drop images here';

    const chooseLabel = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Choose image'
        : drafts.length
            ? 'Choose more images'
            : 'Choose images';

    return `
        <div class="person-photo-picker-notice">
          ${
                replacing
                    ? 'This upload will be stored only inside this board and will not appear in Albums.'
                    : 'Uploaded images will stay local to this board and will not appear in Albums.'
            }
        </div>

        <div class="person-photos-adder-upload-panel">
          <div
            class="
              person-photo-upload-dropzone
              person-photos-adder-upload-dropzone
              ${drafts.length ? 'has-drafts' : ''}
            "
            data-geneo-image-dropzone>

            <input
              type="file"
              accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}"
              ${replacing ? '' : 'multiple'}
              data-geneo-image-file
              hidden>

            <div class="person-photo-upload-prompt">
              ${icon.import}

              <strong>${promptTitle}</strong>

              <p>
                JPEG, PNG, or WebP up to
                ${maxMegabytes} MB each.
              </p>

              <button
                class="button primary"
                type="button"
                data-geneo-image-choose-file>
                ${chooseLabel}
              </button>
            </div>
          </div>

          ${renderGeneographImageUploadErrors()}

          ${
                drafts.length
                    ? `
                <div
                  class="
                    person-photo-candidate-grid
                    person-photos-adder-upload-grid
                  ">
                  ${drafts
                        .map(renderGeneographImageUploadDraft)
                        .join('')}
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographImagePickerModal({
    focusSelector = ''
} = {})
{
    const picker = state.geneoImagePicker;
    if (!picker.open) return;

    const replacing = picker.mode === 'replace';
    const count = geneoImagePickerPendingCount();
    const canConfirm = count > 0 && !picker.uploadBusy;

    openModal(`
        <div
          class="
            modal
            person-photo-picker-modal
            geneo-image-picker-modal
          "
          data-geneo-image-picker
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoImagePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="geneoImagePickerTitle">
                ${replacing ? 'Replace image' : 'Add images'}
              </h2>

              <p>
                ${
                    replacing
                        ? 'Choose one project photo or upload a replacement stored locally in this board.'
                        : 'Select project photos, upload new images, or combine both sources in one addition.'
                }
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              person-photo-picker-body
            ">
            <div
              class="person-photo-picker-tabs"
              role="tablist"
              aria-label="Image source">

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="project"
                aria-selected="${
                    picker.sourceTab
                  === 'project'
                }">
                Project photos
              </button>

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="upload"
                aria-selected="${
                    picker.sourceTab
                  === 'upload'
                }">
                Upload new
              </button>
            </div>

            <div
              role="tabpanel"
              aria-label="${
                    picker.sourceTab
                === 'project'
                        ? 'Project photos'
                        : 'Upload new images'
                }">
              ${
                    picker.sourceTab
                === 'project'
                        ? renderGeneographImageProjectPanel()
                        : renderGeneographImageUploadPanel()
                }
            </div>
          </div>

          <div
            class="
              modal-footer
              person-photos-adder-footer
              geneo-image-picker-footer
            "
            data-geneo-image-footer
            ${
                count > 0
                    ? ''
                    : 'hidden'
            }>

            <span
              class="person-photos-adder-count"
              data-geneo-image-count>
              ${escapeHtml(
                    geneoImagePickerCountLabel(
                        count
                    )
                )}
            </span>

            <div class="modal-footer-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-geneo-image-confirm
                ${
                    canConfirm
                        ? ''
                        : 'disabled'
                }>
                ${
                    picker.uploadBusy
                        ? 'Preparing images…'
                        : escapeHtml(
                            geneoImagePickerActionLabel(
                                count
                            )
                        )
                }
              </button>
            </div>
          </div>
        </div>
      `);

    bindGeneographImagePickerModal();

    if (focusSelector)
    {
        requestAnimationFrame(() =>
        {
            modalBackdrop
                .querySelector(focusSelector)
                ?.focus();
        });
    }
}

function refreshGeneographImagePickerSelectionUi()
{
    const modal = modalBackdrop.querySelector(
        '[data-geneo-image-picker]'
    );

    if (!modal) return;

    const picker = state.geneoImagePicker;
    const selectedIds =
        geneoImagePickerSelectedProjectIds();

    modal
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(card =>
        {
            const photoId =
                card.dataset.geneoImageCandidate;

            const selected =
                selectedIds.has(photoId);

            card.setAttribute(
                'aria-pressed',
                String(selected)
            );

            const title =
                card.querySelector(
                    '.person-photo-candidate-copy strong'
                )?.textContent || 'image';

            card.setAttribute(
                'aria-label',
                picker.mode === 'replace'
                    ? `Use ${title}`
                    : `${selected ? 'Deselect' : 'Select'} ${title}`
            );

            const check = card.querySelector(
                '[data-geneo-image-candidate-check]'
            );

            if (check)
            {
                check.hidden = !selected;
            }
        });

    const count = geneoImagePickerPendingCount();

    const footer =
        modal.querySelector(
            '[data-geneo-image-footer]'
        );

    if (footer)
    {
        footer.hidden =
            count === 0;
    }

    const countElement = modal.querySelector(
        '[data-geneo-image-count]'
    );

    if (countElement)
    {
        countElement.textContent =
            geneoImagePickerCountLabel(count);
    }

    const confirmButton = modal.querySelector(
        '[data-geneo-image-confirm]'
    );

    if (confirmButton)
    {
        confirmButton.disabled =
            count === 0 || picker.uploadBusy;

        confirmButton.textContent =
            picker.uploadBusy
                ? 'Preparing images…'
                : geneoImagePickerActionLabel(count);
    }
}

function bindGeneographImageProjectResultActions(
    root = modalBackdrop
)
{
    root
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const photoId =
                    button.dataset.geneoImageCandidate;

                const selectedIds =
                    geneoImagePickerSelectedProjectIds();

                if (state.geneoImagePicker.mode === 'replace')
                {
                    selectedIds.clear();
                    selectedIds.add(photoId);
                }
                else if (selectedIds.has(photoId))
                {
                    selectedIds.delete(photoId);
                }
                else
                {
                    selectedIds.add(photoId);
                }

                state.geneoImagePicker
                    .selectedProjectPhotoIds = [
                        ...selectedIds
                    ];

                /*
            * Update the cards and footer in place. Reopening the modal
            * here would reset its internal scroll position.
            */
                refreshGeneographImagePickerSelectionUi();
            });
        });

    root
        .querySelector('[data-geneo-image-clear-search]')
        ?.addEventListener('click', () =>
        {
            state.geneoImagePicker.search = '';

            renderGeneographImagePickerModal({
                focusSelector: '[data-geneo-image-search]'
            });
        });

    root
        .querySelectorAll('[data-geneo-image-show-upload]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab = 'upload';

                renderGeneographImagePickerModal({
                    focusSelector:
                '[data-geneo-image-choose-file]'
                });
            });
        });
}

function updateGeneographImageProjectResults()
{
    const host = modalBackdrop.querySelector(
        '[data-geneo-image-project-results]'
    );

    if (!host) return;

    host.innerHTML = renderGeneographImageProjectResults();
    bindGeneographImageProjectResultActions(host);
}

async function processGeneographImageUploads(fileList)
{
    const picker = state.geneoImagePicker;

    if (!picker.open) return;

    const replacing = picker.mode === 'replace';

    let files = Array.from(fileList || [])
        .filter(Boolean);

    if (replacing)
    {
        files = files.slice(0, 1);
    }
    else
    {
        const knownSignatures = new Set(
            (picker.uploadDrafts || [])
                .map(draft => draft.signature)
        );

        files = files.filter(file =>
        {
            const signature =
                photoUploadFileSignature(file);

            if (knownSignatures.has(signature))
            {
                return false;
            }

            knownSignatures.add(signature);
            return true;
        });
    }

    if (!files.length) return;

    const requestId =
        ++geneoImageUploadRequestId;

    picker.uploadBusy = true;
    picker.uploadErrors = [];

    refreshGeneographImagePickerSelectionUi();

    const results = await Promise.all(
        files.map(async file =>
        {
            try
            {
                return {
                    draft: await createPhotoUploadDraft(
                        file,
                        {
                            idPrefix:
                    'geneo-image-upload-draft'
                        }
                    ),
                    error: ''
                };
            }
            catch (error)
            {
                return {
                    draft: null,
                    error:
                error?.message
                || `${file.name || 'File'} — could not be read`
                };
            }
        })
    );

    if (
        requestId !== geneoImageUploadRequestId
        || !state.geneoImagePicker.open
    )
    {
        return;
    }

    const drafts = results
        .map(result => result.draft)
        .filter(Boolean);

    if (replacing)
    {
        /*
        * An invalid replacement should not discard a previously
        * prepared valid draft.
        */
        if (drafts.length)
        {
            picker.uploadDrafts = [drafts[0]];
        }
    }
    else
    {
        picker.uploadDrafts = [
            ...picker.uploadDrafts,
            ...drafts
        ];
    }

    picker.uploadErrors = results
        .map(result => result.error)
        .filter(Boolean);

    picker.uploadBusy = false;

    renderGeneographImagePickerModal({
        focusSelector:
          '[data-geneo-image-choose-file]'
    });
}

function geneoImageBatchLayout(
    selections,
    diagram
)
{
    const items = selections.map(selection => ({
        selection,
        size: geneoImageNodeSize(selection.photo)
    }));

    if (items.length === 1)
    {
        const { width, height } = items[0].size;

        return [{
            ...items[0],
            position:
            nextGeneoObjectPosition(width, height)
        }];
    }

    const gap = 24;
    const columns = Math.min(
        4,
        Math.ceil(Math.sqrt(items.length))
    );

    const rows = Math.ceil(
        items.length / columns
    );

    const cellWidth =
        Math.max(...items.map(item => item.size.width))
        + gap;

    const cellHeight =
        Math.max(...items.map(item => item.size.height))
        + gap;

    const center =
        geneoCurrentViewportCenter()
        || geneoContentCenter();

    const baseX =
        center.x - (columns * cellWidth - gap) / 2;

    const baseY =
        center.y - (rows * cellHeight - gap) / 2;

    const basePositions = items.map((item, index) =>
    {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
            x:
            baseX
            + column * cellWidth
            + (cellWidth - gap - item.size.width) / 2,

            y:
            baseY
            + row * cellHeight
            + (cellHeight - gap - item.size.height) / 2
        };
    });

    const existingNodes = diagram.nodes || [];

    const overlapsExistingNode = offset =>
        basePositions.some((position, index) =>
        {
            const width = items[index].size.width;
            const height = items[index].size.height;

            const candidate = {
                x: position.x + offset.x,
                y: position.y + offset.y
            };

            return existingNodes.some(node =>
                candidate.x < node.x + node.width + 18
            && candidate.x + width + 18 > node.x
            && candidate.y < node.y + node.height + 18
            && candidate.y + height + 18 > node.y
            );
        });

    const step = Math.max(
        80,
        Math.round(
            Math.min(cellWidth, cellHeight) / 2
        )
    );

    const offsets = [{ x: 0, y: 0 }];

    for (let ring = 1; ring <= 12; ring += 1)
    {
        const distance = ring * step;

        offsets.push(
            { x: distance, y: 0 },
            { x: distance, y: distance },
            { x: 0, y: distance },
            { x: -distance, y: distance },
            { x: -distance, y: 0 },
            { x: -distance, y: -distance },
            { x: 0, y: -distance },
            { x: distance, y: -distance }
        );
    }

    const offset =
        offsets.find(candidate =>
            !overlapsExistingNode(candidate)
        )
        || offsets[0];

    return items.map((item, index) => ({
        ...item,
        position: {
            x: basePositions[index].x + offset.x,
            y: basePositions[index].y + offset.y
        }
    }));
}

function applyGeneographImagePickerSelection()
{
    const picker = state.geneoImagePicker;
    const selections =
        geneoImagePickerSelectedSources();

    const diagram =
        selectedGeneographDiagram();

    if (
        !picker.open
        || !selections.length
        || !diagram
        || picker.uploadBusy
    )
    {
        return;
    }

    const replacing =
        picker.mode === 'replace';

    const existingNode = replacing
        ? getGeneographNode(picker.nodeId)
        : null;
    let focusNodeId = existingNode?.id || '';

    if (
        replacing
        && existingNode?.type !== 'image'
    )
    {
        return;
    }

    const selection = selections[0];
    const currentRef = existingNode?.imageRef;

    if (
        replacing
        && selection.scope === 'project'
        && currentRef?.scope === 'project'
        && currentRef.id === selection.photo.id
    )
    {
        resetGeneographImagePickerState();
        closeModal({ force: true });
        return;
    }

    geneoPushHistory();

    const createImageRef = source =>
    {
        if (source.scope === 'board')
        {
            const asset = createGeneographBoardAsset(
                source.draft,
                diagram
            );

            return asset
                ? {
                    scope: 'board',
                    id: asset.id
                }
                : null;
        }

        return {
            scope: 'project',
            id: source.photo.id
        };
    };

    if (replacing)
    {
        const imageRef =
            createImageRef(selection);

        if (!imageRef) return;

        existingNode.imageRef = imageRef;
        delete existingNode.photoId;
        delete existingNode.title;
    }
    else
    {
        const defaults =
            geneoNodeDefaults('image');

        const layout =
            geneoImageBatchLayout(
                selections,
                diagram
            );

        let nextOrder =
            Math.max(
                0,
                ...diagram.nodes.map(
                    item => item.order || 0
                )
            );

        const addedNodeIds = [];

        layout.forEach(item =>
        {
            const imageRef =
                createImageRef(item.selection);

            if (!imageRef) return;

            nextOrder += 1;

            const node = {
                id: createRuntimeId('geneo-node'),
                type: 'image',
                imageRef,
                ...item.position,
                width: item.size.width,
                height: item.size.height,
                parentPanelId: null,
                order: nextOrder,
                visible: true,
                locked: false,
                appearance: {
                    ...defaults.appearance
                }
            };

            diagram.nodes.push(node);
            addedNodeIds.push(node.id);
        });

        if (!addedNodeIds.length) return;

        setGeneographNodeSelection(
            addedNodeIds,
            addedNodeIds.at(-1)
        );
        focusNodeId = addedNodeIds.at(-1) || '';
    }

    pruneGeneographBoardAssets(diagram);
    touchGeneographBoard();

    const addedCount = replacing
        ? 1
        : selections.length;

    const message = replacing
        ? 'Image replaced.'
        : `${addedCount} ${
            addedCount === 1 ? 'image' : 'images'
        } added to the board.`;

    resetGeneographImagePickerState();
    closeModal({ force: true });

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: replacing
    });

    if (focusNodeId)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(focusNodeId)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    showToast(message);
}

function bindGeneographImagePickerModal()
{
    modalBackdrop
        .querySelectorAll('[data-geneo-image-tab]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab =
                    button.dataset.geneoImageTab;

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${button.dataset.geneoImageTab}"]`
                });
            });

            button.addEventListener('keydown', event =>
            {
                if (
                    !['ArrowLeft', 'ArrowRight']
                        .includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                state.geneoImagePicker.sourceTab =
                    state.geneoImagePicker.sourceTab === 'project'
                        ? 'upload'
                        : 'project';

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${state.geneoImagePicker.sourceTab}"]`
                });
            });
        });

    modalBackdrop
        .querySelector('[data-geneo-image-search]')
        ?.addEventListener('input', event =>
        {
            state.geneoImagePicker.search =
                event.target.value;

            updateGeneographImageProjectResults();
        });

    bindGeneographImageProjectResultActions(
        modalBackdrop
    );

    const fileInput = modalBackdrop.querySelector(
        '[data-geneo-image-file]'
    );

    modalBackdrop
        .querySelector('[data-geneo-image-choose-file]')
        ?.addEventListener('click', () =>
        {
            fileInput?.click();
        });

    fileInput?.addEventListener('change', () =>
    {
        processGeneographImageUploads(
            fileInput.files
        );
    });

    modalBackdrop
        .querySelectorAll(
            '[data-geneo-image-remove-upload]'
        )
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const draftId =
                    button.dataset.geneoImageRemoveUpload;

                state.geneoImagePicker.uploadDrafts =
                    state.geneoImagePicker.uploadDrafts
                        .filter(draft =>
                            draft.id !== draftId
                        );

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                '[data-geneo-image-choose-file]'
                });
            });
        });

    const dropzone = modalBackdrop.querySelector(
        '[data-geneo-image-dropzone]'
    );

    if (dropzone)
    {
        ['dragenter', 'dragover'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.add(
                    'is-dragging'
                );
            });
        });

        ['dragleave', 'drop'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.remove(
                    'is-dragging'
                );
            });
        });

        dropzone.addEventListener('drop', event =>
        {
            processGeneographImageUploads(
                event.dataTransfer?.files
            );
        });
    }

    modalBackdrop
        .querySelector('[data-geneo-image-confirm]')
        ?.addEventListener(
            'click',
            applyGeneographImagePickerSelection
        );
}

function openGeneographImagePicker({
    mode = 'add',
    nodeId = null
} = {})
{
    const replacing = mode === 'replace';

    const node = replacing
        ? getGeneographNode(nodeId)
        : null;

    if (
        replacing
        && node?.type !== 'image'
    )
    {
        return;
    }

    const photos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const currentRef = replacing
        ? normalizeGeneographImageRef(node)
        : null;

    resetGeneographImagePickerState();

    Object.assign(state.geneoImagePicker, {
        open: true,
        mode: replacing ? 'replace' : 'add',
        nodeId: replacing ? node.id : null,

        sourceTab:
          currentRef?.scope === 'project'
          || photos.length
              ? 'project'
              : 'upload',

        selectedProjectPhotoIds:
          currentRef?.scope === 'project'
              ? [currentRef.id]
              : [],

        uploadDrafts: [],
        uploadErrors: [],
        uploadBusy: false
    });

    renderGeneographImagePickerModal();
}

function openGeneographTreePersonPicker()
{
    const node =
        selectedGeneographNode();

    const boardPerson =
        node?.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    if (!boardPerson) return;

    const initialSelectedId =
        boardPerson.treePersonId
        && getPerson(
            boardPerson.treePersonId
        )
            ? boardPerson.treePersonId
            : '';

    let selectedId =
        initialSelectedId;

    let query = '';

    const changingLink =
        Boolean(
            initialSelectedId
        );

    const people =
        getPeople(
            currentProjectId()
        )
            .filter(person =>
                person?.id
            && !person.deleted
            );

    const personName =
        person =>
            connectPersonName(
                person
            );

    const personContext =
        person =>
            getPlaceEventDisplay(
                person?.birth
            )
          || getPlaceEventDisplay(
              person?.death
          )
          || '';

    const personSearchText =
        person => [
            personName(person),
            person?.names?.first,
            person?.names?.middle,
            person?.names?.last,
            person?.names?.maiden,
            albumPhotoPersonDates(
                person
            ),
            getPlaceEventDisplay(
                person?.birth
            ),
            getPlaceEventDisplay(
                person?.death
            )
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

    const selectionChanged =
        () =>
            Boolean(selectedId)
          && selectedId
            !== initialSelectedId;

    const getCandidates =
        () =>
        {
            const normalizedQuery =
                query
                    .trim()
                    .toLowerCase();

            const candidates =
                people
                    .filter(person =>
                        person.id !== selectedId
                    )
                    .filter(person =>
                        !normalizedQuery
                || personSearchText(
                    person
                ).includes(
                    normalizedQuery
                )
                    )
                    .sort(
                        (first, second) =>
                            personName(first)
                                .localeCompare(
                                    personName(second)
                                )
                    );

            return {
                total:
              candidates.length,

                people:
              candidates.slice(
                  0,
                  5
              )
            };
        };

    const renderSelected =
        () =>
        {
            const person =
                selectedId
                    ? getPerson(
                        selectedId
                    )
                    : null;

            if (!person)
            {
                return '';
            }

            const name =
                personName(person);

            return `
            <div
              class="
                photo-people-selected-head
              ">
              <strong>
                Selected person
              </strong>

              <span>
                1
              </span>
            </div>

            <div
              class="
                photo-people-selected-list
              ">
              <button
                class="
                  photo-people-selected-chip
                "
                type="button"
                data-geneo-tree-person-remove="${escapeHtml(
                    person.id
                )}"
                aria-label="${escapeHtml(
                    `Remove ${name} from the selection`
                )}">

                ${renderPersonAvatar(
                    person,
                    'photo-people-chip-avatar',
                    {
                        element: 'span'
                    }
                )}

                <span
                  class="
                    photo-people-selected-name
                  ">
                  ${escapeHtml(name)}
                </span>

                <span
                  class="
                    photo-people-selected-remove
                  "
                  aria-hidden="true">
                  ${icon.close}
                </span>
              </button>
            </div>
          `;
        };

    const renderResults =
        candidates =>
        {
            if (
                !candidates.people.length
            )
            {
                return `
              <div
                class="
                  photo-people-empty
                ">
                ${
                    query.trim()
                        ? `
                      No matching people found.
                      Try another name, date,
                      place.
                    `
                        : selectedId
                            ? `
                        No additional people
                        to suggest.
                      `
                            : `
                        No Family Tree people
                        are available.
                      `
                }
              </div>
            `;
            }

            return candidates.people
                .map(person =>
                {
                    const name =
                        personName(person);

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                || 'Dates unknown';

                    const context =
                        personContext(person);

                    return `
                <label
                  class="
                    photo-people-result
                  ">

                  ${renderPersonAvatar(
                        person,
                        'photo-people-result-avatar',
                        {
                            element: 'span'
                        }
                    )}

                  <span
                    class="
                      photo-people-result-copy
                    ">
                    <strong
                      title="${escapeHtml(name)}">
                      ${escapeHtml(name)}
                    </strong>

                    <span
                      title="${escapeHtml(dates)}">
                      ${escapeHtml(dates)}
                    </span>

                    ${
                        context
                            ? `
                          <span
                            title="${escapeHtml(
                                context
                            )}">
                            ${escapeHtml(
                                context
                            )}
                          </span>
                        `
                            : ''
                    }
                  </span>

                  <input
                    type="radio"
                    name="geneoTreePersonChoice"
                    value="${escapeHtml(
                        person.id
                    )}"
                    data-geneo-tree-person-choice
                    aria-label="${escapeHtml(
                        `Select ${name}`
                    )}">
                </label>
              `;
                })
                .join('');
        };

    const modalTitle =
        changingLink
            ? 'Change Family Tree link'
            : 'Link to Family Tree';

    const boardPersonName =
        geneoPersonDisplayName(
            boardPerson
        );

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            geneo-tree-person-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            geneoTreePersonPickerTitle
          ">

          <div class="modal-header">
            <div>
              <h2
                id="
                  geneoTreePersonPickerTitle
                ">
                ${escapeHtml(
                    modalTitle
                )}
              </h2>

              <p>
                ${escapeHtml(
                    `Choose one Family Tree person to link with ${boardPersonName}.`
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(
                    `Close ${modalTitle}`
                )}">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              photo-people-body
            ">

            <div
              class="
                field
                photo-people-search-field
              ">
              <label
                for="
                  geneoTreePersonSearch
                ">
                Find a person
              </label>

              <div class="search-input">
                ${icon.search}

                <input
                  id="
                    geneoTreePersonSearch
                  "
                  type="search"
                  data-geneo-tree-person-search
                  placeholder="Search by name, dates, place, or branch"
                  autocomplete="off">
              </div>
            </div>

            <section
              class="
                photo-people-selected-panel
              "
              data-geneo-tree-person-selected-panel
              hidden>
            </section>

            <section
              class="
                photo-people-results-panel
              ">

              <div
                class="
                  photo-people-results-head
                ">
                <strong
                  data-geneo-tree-person-results-title>
                </strong>

                <span
                  data-geneo-tree-person-results-meta>
                </span>
              </div>

              <div
                class="
                  photo-people-results
                "
                data-geneo-tree-person-results>
              </div>
            </section>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
            ">

            <span
              class="
                photo-people-selection-count
              "
              data-geneo-tree-person-selection-count>
            </span>

            <div
              class="
                photo-people-footer-actions
              ">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="
                  button
                  primary
                  photo-people-save
                "
                type="button"
                data-geneo-tree-person-save
                disabled>
                ${
                    changingLink
                        ? 'Change link'
                        : 'Link person'
                }
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.geneo-tree-person-picker-modal'
        );

    if (!modal) return;

    const refresh =
        () =>
        {
            const selectedHtml =
                renderSelected();

            const selectedPanel =
                modal.querySelector(
                    '[data-geneo-tree-person-selected-panel]'
                );

            const candidates =
                getCandidates();

            const queryActive =
                Boolean(
                    query.trim()
                );

            selectedPanel.hidden =
                !selectedHtml;

            selectedPanel.innerHTML =
                selectedHtml;

            modal
                .querySelector(
                    '[data-geneo-tree-person-results-title]'
                )
                .textContent =
                    queryActive
                        ? 'Search results'
                        : 'Suggested people';

            modal
                .querySelector(
                    '[data-geneo-tree-person-results-meta]'
                )
                .textContent =
                    candidates.total
                > candidates.people.length
                        ? `
                  Showing
                  ${candidates.people.length}
                  of ${candidates.total}
                `.replace(
                            /\s+/g,
                            ' '
                        ).trim()
                        : candidates.total
                            ? `
                    ${candidates.total}
                    ${
                        queryActive
                            ? 'match'
                            : 'suggestion'
                    }${
                        candidates.total
                      === 1
                            ? ''
                            : 's'
                    }
                  `.replace(
                            /\s+/g,
                            ' '
                        ).trim()
                            : '';

            modal
                .querySelector(
                    '[data-geneo-tree-person-results]'
                )
                .innerHTML =
                    renderResults(
                        candidates
                    );

            modal
                .querySelector(
                    '[data-geneo-tree-person-selection-count]'
                )
                .textContent =
                    selectedId
                        ? '1 person selected'
                        : 'No person selected';

            modal
                .querySelector(
                    '[data-geneo-tree-person-save]'
                )
                .disabled =
                    !selectionChanged();

            localizeUI(
                modal,
                {
                    suppressObserverReplay: true
                }
            );
        };

    const saveSelection =
        () =>
        {
            if (
                !selectionChanged()
            )
            {
                return;
            }

            geneoPushHistory();

            boardPerson.treePersonId =
                selectedId;

            boardPerson.syncState =
                'linked';

            touchGeneographBoard();
            closeModal();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });

            showToast(
                changingLink
                    ? 'Family Tree link changed.'
                    : 'Person linked to Family Tree.'
            );
        };

    modal
        .querySelector(
            '[data-geneo-tree-person-search]'
        )
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget.value;

                refresh();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-geneo-tree-person-choice]'
                );

            if (!input) return;

            /*
           * Single-selection behavior:
           * selecting a result replaces the previous
           * selected person rather than adding to a set.
           */
            selectedId =
                input.value;

            refresh();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const remove =
                event.target.closest(
                    '[data-geneo-tree-person-remove]'
                );

            if (remove)
            {
                selectedId = '';
                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-tree-person-save]'
                )
            )
            {
                saveSelection();
            }
        }
    );

    refresh();

    modal
        .querySelector(
            '[data-geneo-tree-person-search]'
        )
        ?.focus({
            preventScroll: true
        });
}

function findGeneographFamilyForPartners(firstPersonId, secondPersonId)
{
    return selectedGeneographDiagram()?.families.find(family => family.partnerIds.length === 2 && family.partnerIds.includes(firstPersonId) && family.partnerIds.includes(secondPersonId)) || null;
}

function geneoPersonIdForNode(nodeId)
{
    const node = getGeneographNode(nodeId); return node?.type === 'person' ? node.personId : null;
}

function geneoHasAncestor(ancestorId, personId, seen = new Set())
{
    if (ancestorId === personId) return true;
    if (seen.has(personId)) return false;
    seen.add(personId);
    const parentFamilies = selectedGeneographDiagram().families.filter(family => family.children.some(child => child.personId === personId));
    return parentFamilies.some(family => family.partnerIds.some(parentId => geneoHasAncestor(ancestorId, parentId, seen)));
}

function geneoSiblingFamilyForPerson(personId)
{
    const diagram = selectedGeneographDiagram();
    return diagram?.families.find(family =>
        family.partnerIds.length === 0
        && family.children.some(child => child.personId === personId)
        && diagram.connections.some(connection => connection.kind === 'family-sibling' && connection.familyId === family.id)
    ) || null;
}

function createGeneographSiblingRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    const firstFamily = geneoSiblingFamilyForPerson(firstPersonId);
    const secondFamily = geneoSiblingFamilyForPerson(secondPersonId);
    let family = firstFamily || secondFamily;
    if (!family)
    {
        family = {
            id: createRuntimeId('geneo-family'),
            partnerIds: [],
            children: [],
            relationshipType: 'Sibling relationship',
            relationshipStatus: 'active',
            marriageType: '',
            events: []
        };
        diagram.families.push(family);
    }
    if (firstFamily && secondFamily && firstFamily.id !== secondFamily.id)
    {
        secondFamily.children.forEach(child =>
        {
            if (!firstFamily.children.some(item => item.personId === child.personId)) firstFamily.children.push({ ...child });
        });
        diagram.connections.forEach(connection =>
        {
            if (connection.kind === 'family-sibling' && connection.familyId === secondFamily.id) connection.familyId = firstFamily.id;
        });
        diagram.families = diagram.families.filter(item => item.id !== secondFamily.id);
        family = firstFamily;
    }
    [firstPersonId, secondPersonId].forEach(personId =>
    {
        if (!family.children.some(child => child.personId === personId)) family.children.push({ personId, parentageType: 'unknown' });
    });
    diagram.connections.push(geneoCreateConnection('family-sibling', source, target, family.id));
    return family;
}

function rebuildGeneographSiblingFamily(familyId)
{
    const diagram = selectedGeneographDiagram();
    const family = getGeneographFamily(familyId);
    if (!diagram || !family) return;
    const siblingConnections = diagram.connections.filter(connection => connection.kind === 'family-sibling' && connection.familyId === familyId);
    if (!siblingConnections.length)
    {
        diagram.families = diagram.families.filter(item => item.id !== familyId);
        return;
    }
    const personIds = new Set();
    siblingConnections.forEach(connection =>
    {
        [connection.source?.nodeId, connection.target?.nodeId].forEach(nodeId =>
        {
            const personId = geneoPersonIdForNode(nodeId);
            if (personId) personIds.add(personId);
        });
    });
    family.children = [...personIds].map(personId => ({ personId, parentageType: 'unknown' }));
}

function canCreateGeneographConnection(source, target)
{
    if (!source || !target) return { valid: false, reason: 'Choose two connection points.' };
    if (source.nodeId && source.nodeId === target.nodeId) return { valid: false, reason: 'An item cannot connect to itself.' };
    const sourceNode = getGeneographNode(source.nodeId); const targetNode = getGeneographNode(target.nodeId);
    const sourcePersonId = geneoPersonIdForNode(source.nodeId); const targetPersonId = geneoPersonIdForNode(target.nodeId);
    if (source.familyId && targetPersonId && target.port === 'top')
    {
        const family = getGeneographFamily(source.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === targetPersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(targetPersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: source.familyId, childPersonId: targetPersonId, childReference: target };
    }
    if (target.familyId && sourcePersonId && source.port === 'top')
    {
        const family = getGeneographFamily(target.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === sourcePersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(sourcePersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: target.familyId, childPersonId: sourcePersonId, childReference: source };
    }
    if (sourcePersonId && targetPersonId)
    {
        if (source.port === 'top' && target.port === 'top')
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be siblings.' };
            const sourceFamily = geneoSiblingFamilyForPerson(sourcePersonId);
            const targetFamily = geneoSiblingFamilyForPerson(targetPersonId);
            if (sourceFamily && targetFamily && sourceFamily.id === targetFamily.id) return { valid: false, reason: 'That sibling relationship already exists.' };
            return { valid: true, kind: 'family-sibling', sourcePersonId, targetPersonId };
        }
        const horizontal = ['left', 'right'].includes(source.port) && ['left', 'right'].includes(target.port) && source.port !== target.port;
        if (horizontal)
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be partners.' };
            if (findGeneographFamilyForPartners(sourcePersonId, targetPersonId)) return { valid: false, reason: 'That partner relationship already exists.' };
            return { valid: true, kind: 'family-partner', sourcePersonId, targetPersonId };
        }
        const sourceIsParent = source.port === 'bottom' && target.port === 'top';
        const targetIsParent = target.port === 'bottom' && source.port === 'top';
        if (sourceIsParent || targetIsParent)
        {
            const parentPersonId = sourceIsParent ? sourcePersonId : targetPersonId; const childPersonId = sourceIsParent ? targetPersonId : sourcePersonId;
            if (geneoHasAncestor(childPersonId, parentPersonId)) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
            if (selectedGeneographDiagram().families.some(family => family.partnerIds.includes(parentPersonId) && family.children.some(child => child.personId === childPersonId))) return { valid: false, reason: 'That parent-child relationship already exists.' };
            return {
                valid: true,
                kind: 'family-child',
                parentPersonId,
                childPersonId,
                parentReference: sourceIsParent ? source : target,
                childReference: sourceIsParent ? target : source
            };
        }
        return { valid: false, reason: 'Use side ports for partners and vertical ports for parent-child relationships.' };
    }
    if (sourceNode && targetNode) return { valid: true, kind: 'visual' };
    return { valid: false, reason: 'These points cannot be connected.' };
}

function createGeneographPartnerRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = findGeneographFamilyForPartners(firstPersonId, secondPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [firstPersonId, secondPersonId], children: [], relationshipType: 'Married', relationshipStatus: 'active', marriageType: 'Civil', events: [] }; diagram.families.push(family);
    }
    if (!diagram.connections.some(item => item.kind === 'family-partner' && item.familyId === family.id)) diagram.connections.push(geneoCreateConnection('family-partner', source, target, family.id));
    return family;
}

function addGeneographChildToFamily(familyId, childPersonId, target)
{
    const diagram = selectedGeneographDiagram(); const family = getGeneographFamily(familyId); if (!family) return null;
    if (!family.children.some(child => child.personId === childPersonId)) family.children.push({ personId: childPersonId, parentageType: 'biological' });
    if (!diagram.connections.some(item => item.kind === 'family-child' && item.familyId === familyId && item.target.nodeId === target.nodeId)) diagram.connections.push(geneoCreateConnection('family-child', { familyId, port: 'bottom' }, target, familyId));
    return family;
}

function createGeneographParentChildRelationship(parentPersonId, childPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = diagram.families.find(item => item.partnerIds.length === 1 && item.partnerIds[0] === parentPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [parentPersonId], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] }; diagram.families.push(family);
    }
    addGeneographChildToFamily(family.id, childPersonId, target);
    const connection = diagram.connections.find(item => item.kind === 'family-child' && item.familyId === family.id && item.target.nodeId === target.nodeId);
    if (connection && !connection.source.nodeId) connection.source = { ...source };
    return family;
}

function geneoCreateConnection(kind, source, target, familyId = null)
{
    return { id: createRuntimeId('geneo-connection'), kind, familyId, source: { ...source }, target: { ...target }, showRelationshipDates: true, style: { pattern: state.geneoConnectorPattern === 'dashed' ? 'dashed' : 'solid', line: { color: kind === 'visual' ? '#D4AA6B' : '#8ECDB2', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'auto', waypoints: [] } };
}

function commitGeneographConnection(source, target)
{
    const result = canCreateGeneographConnection(source, target); if (!result.valid)
    {
        showToast(result.reason); return false;
    }
    const diagram = selectedGeneographDiagram();
    const duplicate = diagram.connections.some(connection => JSON.stringify(connection.source) === JSON.stringify(source) && JSON.stringify(connection.target) === JSON.stringify(target) || JSON.stringify(connection.source) === JSON.stringify(target) && JSON.stringify(connection.target) === JSON.stringify(source));
    if (duplicate)
    {
        showToast('That connection already exists.'); return false;
    }
    geneoPushHistory();
    if (result.kind === 'family-partner') createGeneographPartnerRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-sibling') createGeneographSiblingRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-child' && result.familyId) addGeneographChildToFamily(result.familyId, result.childPersonId, result.childReference);
    else if (result.kind === 'family-child') createGeneographParentChildRelationship(result.parentPersonId, result.childPersonId, result.parentReference, result.childReference);
    else diagram.connections.push(geneoCreateConnection('visual', source, target));
    touchGeneographBoard(); return true;
}

function removeGeneographRelationship(connectionId)
{
    const diagram = selectedGeneographDiagram(); const connection = getGeneographConnection(connectionId); if (!connection) return;
    diagram.connections = diagram.connections.filter(item => item.id !== connectionId);
    if (connection.kind === 'family-partner' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId);
        diagram.connections = diagram.connections.filter(item => item.familyId !== connection.familyId);
        diagram.families = diagram.families.filter(item => item.id !== connection.familyId);
    }
    else if (connection.kind === 'family-child' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId); const childId = geneoPersonIdForNode(connection.target.nodeId);
        if (family && childId) family.children = family.children.filter(child => child.personId !== childId);
        if (family && !family.partnerIds.length && !family.children.length) diagram.families = diagram.families.filter(item => item.id !== family.id);
    }
    else if (connection.kind === 'family-sibling' && connection.familyId)
    {
        rebuildGeneographSiblingFamily(connection.familyId);
    }
}

function deleteGeneographSelection()
{
    const diagram = selectedGeneographDiagram();
    const connections = selectedGeneographConnections();
    const nodes = selectedGeneographNodes();
    if (!connections.length && !nodes.length) return;
    geneoPushHistory();
    connections.map(connection => connection.id).forEach(connectionId =>
    {
        if (getGeneographConnection(connectionId)) removeGeneographRelationship(connectionId);
    });
    const deletedIds = new Set(nodes.map(node => node.id));
    const siblingFamilyIds = new Set(diagram.connections.filter(item => item.kind === 'family-sibling' && (deletedIds.has(item.source.nodeId) || deletedIds.has(item.target.nodeId))).map(item => item.familyId).filter(Boolean));
    diagram.nodes.forEach(node =>
    {
        if (node.parentPanelId && deletedIds.has(node.parentPanelId) && !deletedIds.has(node.id)) node.parentPanelId = null;
    });
    diagram.connections = diagram.connections.filter(item => !deletedIds.has(item.source.nodeId) && !deletedIds.has(item.target.nodeId));
    diagram.nodes = diagram.nodes.filter(item => !deletedIds.has(item.id));
    pruneGeneographBoardAssets(diagram);
    siblingFamilyIds.forEach(rebuildGeneographSiblingFamily);
    selectGeneographCanvas(); touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function geneoNodeHasSelectedAncestor(node, selectedIds)
{
    let parentId = node?.parentPanelId;
    while (parentId)
    {
        if (selectedIds.has(parentId)) return true;
        parentId = getGeneographNode(parentId)?.parentPanelId || null;
    }
    return false;
}

function geneoGroupMoveSnapshot(nodes)
{
    const selectedIds = new Set(nodes.map(node => node.id));
    const roots = nodes.filter(node => !geneoNodeHasSelectedAncestor(node, selectedIds));
    const movingIds = new Set();
    const addNodeAndDescendants = node =>
    {
        if (!node || movingIds.has(node.id)) return;
        movingIds.add(node.id);
        if (node.type === 'panel') selectedGeneographDiagram().nodes.filter(child => child.parentPanelId === node.id).forEach(addNodeAndDescendants);
    };
    roots.forEach(addNodeAndDescendants);
    return selectedGeneographDiagram().nodes.filter(node => movingIds.has(node.id) && !geneoNodeEffectiveLocked(node)).map(node => ({ id: node.id, x: node.x, y: node.y }));
}

function geneoReferenceMovesWithNodes(reference, movingNodeIds)
{
    if (reference?.nodeId) return movingNodeIds.has(reference.nodeId);
    if (!reference?.familyId) return false;
    const family = getGeneographFamily(reference.familyId);
    const partnerNodeIds = (family?.partnerIds || []).map(personId =>
        selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)?.id
    ).filter(Boolean);
    return partnerNodeIds.length > 0 && partnerNodeIds.every(nodeId => movingNodeIds.has(nodeId));
}

function geneoConnectionMoveSnapshot(nodes, connections = selectedGeneographConnections())
{
    const movingNodeIds = new Set(nodes.map(node => node.id));
    const selectedConnectionIds = new Set(connections.map(connection => connection.id));
    return selectedGeneographDiagram().connections.flatMap(connection =>
    {
        const selected = selectedConnectionIds.has(connection.id);
        const followsNodes = connection.route?.mode === 'manual'
          && geneoReferenceMovesWithNodes(connection.source, movingNodeIds)
          && geneoReferenceMovesWithNodes(connection.target, movingNodeIds);
        if (!selected && !followsNodes) return [];
        const renderedPoints = geneoConnectionPoints(connection);
        const waypoints = connection.route?.mode === 'manual'
            ? connection.route.waypoints.map(point => ({ ...point }))
            : selected ? renderedPoints.slice(1, -1).map(point => ({ ...point })) : [];
        if (!waypoints.length) return [];
        return [{ id: connection.id, waypoints, materialize: connection.route?.mode !== 'manual' }];
    });
}

function applyGeneographSelectionTranslation(pointerState, dx, dy)
{
    pointerState.nodes.forEach(item =>
    {
        const node = getGeneographNode(item.id);
        if (node)
        {
            node.x = geneoNumber(item.x + dx, node.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
            node.y = geneoNumber(item.y + dy, node.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
        }
    });
    pointerState.connections.forEach(item =>
    {
        const connection = getGeneographConnection(item.id);
        if (!connection) return;
        connection.route = {
            mode: 'manual',
            waypoints: item.waypoints.map(point =>
            {
                const translated = {
                    x: geneoNumber(point.x + dx, point.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                    y: geneoNumber(point.y + dy, point.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                };
                return selectedGeneographDiagram().canvas.snapToGrid ? snapGeneographPoint(translated) : translated;
            })
        };
    });
}

function geneoPointerToCanvas(event)
{
    const stage = main.querySelector('[data-geneo-stage]');
    const rect = stage?.getBoundingClientRect();
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (event.clientX - (rect?.left || 0)) / zoom,
        y: bounds.top + (event.clientY - (rect?.top || 0)) / zoom
    };
}

function cancelGeneographConnectionDraft()
{
    state.geneoConnectionDraft = null;
    clearGeneographConnectionClick();
    geneoCanvasRuntime.connectionPreviewPoint = null;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = null;
}

function activateGeneographConnectionPoint(reference)
{
    if (!state.geneoConnectionDraft)
    {
        state.geneoTool = 'connect';
        state.geneoConnectionDraft = reference;
        geneoCanvasRuntime.connectionPreviewPoint = geneoConnectionPoint(reference);
        renderGeneographEditorPreserveScroll();
        return;
    }
    const created = commitGeneographConnection(state.geneoConnectionDraft, reference);
    if (created)
    {
        cancelGeneographConnectionDraft();
        state.geneoTool = 'pan';
        showToast('Connection created.');
    }
    renderGeneographEditorPreserveScroll();
}

function updateGeneographConnectionPreview(event)
{
    if (!state.geneoConnectionDraft || !event.target.closest?.('[data-geneo-canvas-viewport]')) return;
    const clientX = event.clientX;
    const clientY = event.clientY;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.connectionPreviewFrame = null;
        if (!state.geneoConnectionDraft) return;
        const point = geneoPointerToCanvas({ clientX, clientY });
        geneoCanvasRuntime.connectionPreviewPoint = point;
        const preview = main.querySelector('[data-geneo-connection-preview]');
        if (preview) preview.setAttribute('d', geneoPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, point)));
    });
}

function startGeneographObjectDrag(event)
{
    const nodeElement = event.target.closest('[data-geneo-node]'); if (!nodeElement || event.button !== 0 ||
      event.target.closest(
          [
              'button',
              'input',
              'textarea',
              'select',
              'a',
              '[contenteditable]',
              '.rich-text-toolbar',
              '.ql-tooltip'
          ].join(',')
      ))
        return;
    const node = getGeneographNode(nodeElement.dataset.geneoNode); if (!node || !['select', 'pan'].includes(state.geneoTool)) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (!geneoSelectedNodeIdSet().has(node.id)) selectGeneographNode(node.id);
    event.preventDefault();
    event.stopPropagation();
    if (geneoNodeEffectiveLocked(node)) return;
    geneoPushHistory(); const point = geneoPointerToCanvas(event);
    const selection = selectedGeneographNodes();
    const nodes = geneoGroupMoveSnapshot(selection);
    const connections = geneoConnectionMoveSnapshot(nodes);
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoPointerState = { kind: 'move-group', nodeId: node.id, start: point, x: node.x, y: node.y, nodes, connections, moved: false };
}

function startGeneographConnectionDrag(event)
{
    const path = event.target.closest('.geneo-connection-hit');
    if (!path || event.button !== 0 || !['select', 'pan'].includes(state.geneoTool) || event.shiftKey || event.ctrlKey || event.metaKey) return false;
    const connection = getGeneographConnection(path.dataset.geneoConnection);
    if (!connection) return false;
    if (!geneoSelectedConnectionIdSet().has(connection.id)) selectGeneographConnection(connection.id);
    geneoPushHistory();
    const nodes = geneoGroupMoveSnapshot(selectedGeneographNodes());
    const connections = geneoConnectionMoveSnapshot(nodes, selectedGeneographConnections());
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return true;
    }
    geneoPointerState = {
        kind: 'move-group',
        nodeId: nodes[0]?.id || null,
        start: geneoPointerToCanvas(event),
        x: nodes[0]?.x || 0,
        y: nodes[0]?.y || 0,
        nodes,
        connections,
        moved: false
    };
    event.preventDefault();
    event.stopPropagation();
    return true;
}

function startGeneographResize(
    event
)
{
    const button =
        event.target.closest(
            '[data-geneo-resize]'
        );

    if (
        !button
        || event.button !== 0
    )
    {
        return false;
    }

    const node =
        getGeneographNode(
            button.dataset.geneoNode
        );

    if (
        !node
        || geneoNodeEffectiveLocked(
            node
        )
    )
    {
        return true;
    }

    geneoPushHistory();

    geneoPointerState = {
        kind: 'resize',

        nodeId:
          node.id,

        handle:
          button.dataset.geneoResize,

        start:
          geneoPointerToCanvas(
              event
          ),

        x:
          node.x,

        y:
          node.y,

        width:
          node.width,

        height:
          node.height,

        aspectRatio:
          node.width / node.height,

        lockAspectRatio:
          event.shiftKey
          || geneoShiftPressed,

        moved: false
    };

    event.preventDefault();
    event.stopPropagation();

    return true;
}

function moveGeneographObject(event)
{
    updateGeneographConnectionPreview(event);
    if (!geneoPointerState) return;
    if (geneoPointerState.kind === 'pencil')
    {
        if (event.pointerId !== geneoPointerState.pointerId) return;
        const point = geneoPointerToCanvas(event);
        const previous = geneoPointerState.points.at(-1);
        const minimumDistance = 2 / Math.max(.25, state.geneoZoom / 100);
        if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < minimumDistance) return;
        geneoPointerState.points.push(point);
        geneoPointerState.moved = true;
        updateGeneographPencilPreview(geneoPointerState.points);
        return;
    }
    if (geneoPointerState.kind === 'pan')
    {
        const dx = event.clientX - geneoPointerState.clientX;
        const dy = event.clientY - geneoPointerState.clientY;
        geneoPointerState.wrap.scrollLeft = geneoPointerState.left - dx;
        geneoPointerState.wrap.scrollTop = geneoPointerState.top - dy;
        geneoPointerState.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
        return;
    }
    if (
        geneoPointerState.kind === 'draw-panel'
        || geneoPointerState.kind === 'draw-shape'
    )
    {
        const point = snapGeneographPoint(
            geneoPointerToCanvas(event)
        );

        const rect = geneoPanelDraftRect(
            geneoPointerState.start,
            point
        );

        geneoPointerState.current = point;
        geneoPointerState.moved =
            rect.width > 2
          || rect.height > 2;

        updateGeneographPanelDraftDom(
            geneoPointerState.start,
            point
        );

        return;
    }
    if (geneoPointerState.kind === 'waypoint')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = snapGeneographPoint(geneoPointerToCanvas(event));
        const waypoint = connection?.route.waypoints[geneoPointerState.index];
        if (waypoint)
        {
            clearGeneographConnectionClick(); waypoint.x = geneoNumber(point.x, waypoint.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); waypoint.y = geneoNumber(point.y, waypoint.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); geneoPointerState.moved = true; const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'segment')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = geneoPointerToCanvas(event);
        const dx = point.x - geneoPointerState.start.x;
        const dy = point.y - geneoPointerState.start.y;
        if (Math.hypot(dx, dy) <= 1) return;
        const first = connection?.route.waypoints[geneoPointerState.firstWaypoint];
        const second = connection?.route.waypoints[geneoPointerState.secondWaypoint];
        if (first && second)
        {
            clearGeneographConnectionClick();
            if (geneoPointerState.vertical)
            {
                const x = snapGeneographCoordinate(geneoPointerState.first.x + dx); first.x = x; second.x = x;
            }
            else
            {
                const y = snapGeneographCoordinate(geneoPointerState.first.y + dy); first.y = y; second.y = y;
            }
            geneoPointerState.moved = true;
            const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'marquee')
    {
        const point = geneoPointerToCanvas(event);
        const left = Math.min(geneoPointerState.start.x, point.x);
        const top = Math.min(geneoPointerState.start.y, point.y);
        const right = Math.max(geneoPointerState.start.x, point.x);
        const bottom = Math.max(geneoPointerState.start.y, point.y);
        geneoPointerState.current = point;
        geneoPointerState.moved = Math.abs(right - left) > 2 || Math.abs(bottom - top) > 2;
        const rect = { left, top, right, bottom };
        const hitIds = selectedGeneographDiagram().nodes.filter(node =>
        {
            if (!geneoNodeEffectiveVisible(node)) return false;
            if (node.type === 'drawing') return geneoDrawingIntersectsRect(node, rect);
            return node.x < right && node.x + node.width > left && node.y < bottom && node.y + node.height > top;
        }).map(node => node.id);
        const hitConnectionIds = selectedGeneographDiagram().connections.filter(connection => geneoConnectionIntersectsRect(connection, rect)).map(connection => connection.id);
        const nextIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseIds, ...hitIds])] : hitIds;
        const nextConnectionIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseConnectionIds, ...hitConnectionIds])] : hitConnectionIds;
        setGeneographSelection(nextIds, nextConnectionIds, { nodeId: hitIds.at(-1) || nextIds.at(-1), connectionId: hitConnectionIds.at(-1) || nextConnectionIds.at(-1) });
        const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
        const marquee = main.querySelector('[data-geneo-marquee]');
        if (marquee)
        {
            marquee.hidden = false;
            marquee.style.left = `${left - bounds.left}px`; marquee.style.top = `${top - bounds.top}px`;
            marquee.style.width = `${right - left}px`; marquee.style.height = `${bottom - top}px`;
        }
        const selectedIds = geneoSelectedNodeIdSet();
        main.querySelectorAll('article[data-geneo-node]').forEach(element => element.classList.toggle('selected', selectedIds.has(element.dataset.geneoNode)));
        const selectedConnectionIds = geneoSelectedConnectionIdSet();
        main.querySelectorAll('[data-geneo-connection-group]').forEach(element => element.classList.toggle('selected', selectedConnectionIds.has(element.dataset.geneoConnectionGroup)));
        return;
    }
    const node = getGeneographNode(geneoPointerState.nodeId);
    const point = geneoPointerToCanvas(event); const dx = point.x - geneoPointerState.start.x; const dy = point.y - geneoPointerState.start.y; geneoPointerState.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (geneoPointerState.moved && geneoPointerState.kind === 'resize') clearGeneographConnectionClick();
    if (geneoPointerState.kind === 'move-group')
    {
        if (!geneoPointerState.moved) return;
        let deltaX = dx, deltaY = dy;
        if (selectedGeneographDiagram().canvas.snapToGrid)
        {
            deltaX = node ? snapGeneographCoordinate(geneoPointerState.x + dx) - geneoPointerState.x : Math.round(dx / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            deltaY = node ? snapGeneographCoordinate(geneoPointerState.y + dy) - geneoPointerState.y : Math.round(dy / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
        }
        if (geneoPointerState.moved) clearGeneographConnectionClick();
        applyGeneographSelectionTranslation(geneoPointerState, deltaX, deltaY);
        updateGeneographLiveGeometry(node, geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean));
        return;
    }
    else
    {
        if (!node) return;

        const diagram =
            selectedGeneographDiagram();

        const handle =
            geneoPointerState.handle;

        const west =
            handle.includes('w');

        const north =
            handle.includes('n');

        const east =
            handle.includes('e');

        const south =
            handle.includes('s');

        if (
            node.type === 'person'
          && (north || south)
        )
        {
            node.personCard.heightMode =
                'manual';
        }

        if (
            node.type === 'place'
          && geneoPointerState.moved
        )
        {
            node.placeSizeMode =
                'manual';
        }

        const fixedLeft =
            geneoPointerState.x;

        const fixedTop =
            geneoPointerState.y;

        const fixedRight =
            geneoPointerState.x
          + geneoPointerState.width;

        const fixedBottom =
            geneoPointerState.y
          + geneoPointerState.height;

        let left =
            west
                ? fixedLeft + dx
                : fixedLeft;

        let right =
            east
                ? fixedRight + dx
                : fixedRight;

        let top =
            north
                ? fixedTop + dy
                : fixedTop;

        let bottom =
            south
                ? fixedBottom + dy
                : fixedBottom;

        if (diagram.canvas.snapToGrid)
        {
            if (west)
            {
                left =
                    snapGeneographCoordinate(
                        left
                    );
            }
            else if (east)
            {
                right =
                    snapGeneographCoordinate(
                        right
                    );
            }

            if (north)
            {
                top =
                    snapGeneographCoordinate(
                        top
                    );
            }
            else if (south)
            {
                bottom =
                    snapGeneographCoordinate(
                        bottom
                    );
            }
        }

        const maximumSize =
            geneoNodeMaximumSize(node);

        const baseMinimumSize =
            geneoNodeMinimumSize(
                node
            );

        let width;
        let height;

        const lockPersonRatio =
            node.type === 'person'
          && (
              event.shiftKey
            || geneoShiftPressed
            || geneoPointerState
                .lockAspectRatio
          )
          && (west || east)
          && (north || south);

        if (lockPersonRatio)
        {
            const rawWidth =
                Math.abs(right - left);

            const rawHeight =
                Math.abs(bottom - top);

            const horizontalIntent =
                Math.abs(
                    rawWidth
                / geneoPointerState.width
              - 1
                );

            const verticalIntent =
                Math.abs(
                    rawHeight
                / geneoPointerState.height
              - 1
                );

            const requestedScale =
                horizontalIntent >= verticalIntent
                    ? rawWidth
                / geneoPointerState.width
                    : rawHeight
                / geneoPointerState.height;

            const minimumScale =
                Math.max(
                    baseMinimumSize.width
                / geneoPointerState.width,
                    baseMinimumSize.height
                / geneoPointerState.height
                );

            const maximumScale =
                Math.min(
                    maximumSize.width
                / geneoPointerState.width,
                    maximumSize.height
                / geneoPointerState.height
                );

            const scale =
                geneoNumber(
                    requestedScale,
                    1,
                    minimumScale,
                    maximumScale
                );

            width =
                geneoPointerState.width
            * scale;

            height =
                geneoPointerState.height
            * scale;
        }
        else
        {
            width =
                geneoNumber(
                    right - left,
                    node.width,
                    baseMinimumSize.width,
                    maximumSize.width
                );

            height =
                geneoNumber(
                    bottom - top,
                    node.height,
                    baseMinimumSize.height,
                    maximumSize.height
                );
        }

        /*
        * Preserve the opposite horizontal edge
        * after width clamping.
        */
        if (west)
        {
            left =
                fixedRight - width;

            right =
                fixedRight;
        }
        else
        {
            left =
                fixedLeft;

            right =
                fixedLeft + width;
        }

        /*
        * Preserve the opposite vertical edge
        * after height clamping.
        */
        if (north)
        {
            top =
                fixedBottom - height;

            bottom =
                fixedBottom;
        }
        else
        {
            top =
                fixedTop;

            bottom =
                fixedTop + height;
        }

        node.x =
            geneoNumber(
                left,
                node.x,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.y =
            geneoNumber(
                top,
                node.y,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.width =
            width;

        node.height =
            height;
    }
    updateGeneographLiveGeometry(node, geneoPointerState.kind === 'move-group' ? geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean) : [node]);
}

function updateGeneographLiveGeometry(
    node,
    nodes = [node]
)
{
    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    nodes.forEach(item =>
    {
        const element =
            main.querySelector(
                `article[data-geneo-node="${
                    CSS.escape(
                        item.id
                    )
                }"]`
            );

        if (!element) return;

        element.style.left =
            `${
                item.x - bounds.left
            }px`;

        element.style.top =
            `${
                item.y - bounds.top
            }px`;

        element.style.width =
            `${item.width}px`;

        element.style.height =
            `${item.height}px`;
    });

    const svg =
        main.querySelector(
            '.geneo-connections'
        );

    if (svg)
    {
        svg.outerHTML =
            renderGeneographConnectors();
    }
}

function endGeneographObjectDrag(event)
{
    if (!geneoPointerState) return; const stateBefore = geneoPointerState; geneoPointerState = null;
    if (stateBefore.kind === 'pencil')
    {
        updateGeneographPencilPreview();
        if (stateBefore.wrap?.hasPointerCapture?.(stateBefore.pointerId))
        {
            stateBefore.wrap.releasePointerCapture(stateBefore.pointerId);
        }
        geneoCanvasRuntime.suppressNodeClick = true;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        if (event?.type === 'pointercancel') return;
        const drawing = createGeneographDrawingFromPoints(stateBefore.points, stateBefore.beforeSnapshot);
        if (!drawing) return;
        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(drawing.id)}"]`)?.focus({ preventScroll: true }));
        return;
    }
    if (
        stateBefore.kind === 'draw-panel'
        || stateBefore.kind === 'draw-shape'
    )
    {
        hideGeneographPanelDraftDom();

        geneoCanvasRuntime.suppressNodeClick = true;

        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });

        const rect = geneoPanelDraftRect(
            stateBefore.start,
            stateBefore.current || stateBefore.start
        );

        const drawingShape = stateBefore.kind === 'draw-shape';
        const defaults = geneoNodeDefaults(drawingShape ? 'shape' : 'panel');

        if (drawingShape && !stateBefore.moved)
        {
            const shape = createGeneographShapeFromRect(
                { x: stateBefore.start.x, y: stateBefore.start.y },
                { useDefaultSize: true }
            );
            if (!shape) return;
            finishGeneographPlacementTool();
            renderGeneographEditorPreserveScroll();
            requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(shape.id)}"]`)?.focus({ preventScroll: true }));
            return;
        }

        if (
            !stateBefore.moved
          || rect.width < defaults.minWidth
          || rect.height < defaults.minHeight
        )
        {
            if (stateBefore.moved)
            {
                showToast(
                    `${drawingShape ? 'Shape' : 'Panel'} must be at least ${defaults.minWidth} × ${defaults.minHeight}.`
                );
            }

            return;
        }

        const panel = drawingShape
            ? createGeneographShapeFromRect(rect)
            : createGeneographPanelFromRect(rect);

        if (!panel) return;

        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(panel.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });

        return;
    }
    if (stateBefore.kind === 'pan')
    {
        captureGeneographViewport();
        expandGeneographCanvasNearEdge();
        return;
    }
    if (stateBefore.kind === 'marquee')
    {
        geneoCanvasRuntime.suppressNodeClick = stateBefore.moved;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        renderGeneographEditorPreserveScroll(); return;
    }
    if (!stateBefore.moved)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoCanvasRuntime.suppressNodeClick = true;
    requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.suppressNodeClick = false;
    });
    const node = getGeneographNode(stateBefore.nodeId);
    if (stateBefore.kind === 'resize' && node?.type === 'panel')
    {
        reconcileGeneographPanelMembership(node.id);
    }
    else if (stateBefore.kind === 'move-group')
    {
        const movedNodes = stateBefore.nodes.map(item => getGeneographNode(item.id)).filter(Boolean);
        const movedPanels = movedNodes.filter(item => item.type === 'panel');
        movedPanels.forEach(panel => reconcileGeneographPanelMembership(panel.id));
        if (movedNodes.length === 1 && movedNodes[0].type !== 'panel')
        {
            movedNodes[0].parentPanelId = geneoContainingPanelForNode(movedNodes[0])?.id || null;
        }
    }
    touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function commitGeneoInlineEdit(
    cancel = false
)
{
    const node =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (!node)
    {
        destroyGeneographRichTextEditor();

        state.geneoInlineEditNodeId =
            null;

        state.geneoInlineEditSelectAll =
            false;

        state.geneoInlineEditSurface =
            'canvas';

        return;
    }

    if (
        isGeneographRichTextNode(
            node
        )
    )
    {
        if (!cancel)
        {
            const activeRuntime =
                geneoRichTextRuntime
                    .nodeId === node.id;

            const nextDelta =
                activeRuntime
                    ? cloneRichTextDelta(
                        geneoRichTextRuntime
                            .draftDelta
                    )
                    : cloneRichTextDelta(
                        node.textDelta
                    );

            const nextText =
                activeRuntime
                    ? String(
                        geneoRichTextRuntime
                            .draftText || ''
                    )
                    : String(
                        node.text || ''
                    );

            const changed =
                node.text !== nextText
            || !richTextDeltasEqual(
                node.textDelta,
                nextDelta
            );

            if (changed)
            {
                geneoPushHistory();

                node.text =
                    nextText;

                node.textDelta =
                    nextDelta;

                node.textFormat =
                    nextDelta
                        ? 'quill-delta-v1'
                        : '';

                touchGeneographBoard();
            }
        }

        destroyGeneographRichTextEditor();
    }
    else
    {
        const input =
            main.querySelector(
                '[data-geneo-inline-input]'
            );

        if (
            !cancel
          && input
        )
        {
            const nextTitle =
                String(
                    input.value ?? ''
                )
                    .trim()
                    .slice(0, 160);

            if (
                node.title
            !== nextTitle
            )
            {
                geneoPushHistory();

                node.title =
                    nextTitle;

                touchGeneographBoard();
            }
        }
    }

    state.geneoInlineEditNodeId =
        null;

    state.geneoInlineEditSelectAll =
        false;

    state.geneoInlineEditSurface =
        'canvas';

    renderGeneographEditorPreserveScroll();
}

function saveGeneographPartnerRelationship()
{
    const connection = selectedGeneographConnection();
    const family = connection?.kind === 'family-partner' ? getGeneographFamily(connection.familyId) : null;
    const editor = main.querySelector('[data-geneo-relationship-editor]');
    if (!connection || !family || !editor) return;
    const relationshipType = editor.querySelector('[data-geneo-relationship-type]')?.value || 'Married';
    const definition = partnerRelationshipDefinition(relationshipType);
    const startDate = collectGenealogyDateField('geneoRelationshipStartDate');
    const endDate = definition.hasEnd ? collectGenealogyDateField('geneoRelationshipEndDate') : emptyGenealogyDate('Exact date');
    if (!startDate || (definition.hasEnd && !endDate))
    {
        showToast('Check the relationship dates before saving.'); return;
    }
    if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
    {
        showToast('The relationship end date must be after or equal to the start date.'); return;
    }
    const resolved = geneoRelationshipForFamily(family, { create: true });
    if (!resolved.relationship)
    {
        showToast('The relationship could not be updated.'); return;
    }
    geneoPushHistory();
    upsertPartnerRelationshipEvents(resolved.relationship, {
        relationshipType,
        marriageType: editor.querySelector('[data-geneo-marriage-type]')?.value || 'Civil',
        startDate,
        startPlace: readPlaceInputValue('[data-partner-relationship-start-place]', editor),
        endDate,
        endPlace: definition.hasEnd ? readPlaceInputValue('[data-partner-relationship-end-place]', editor) : { text: '', selectedPlaceId: '' }
    });
    resolved.relationship.updatedAt = 'Just now';
    if (resolved.central)
    {
        syncFamilyReciprocalLinks();
        rebuildSampleEventsAndPruneSourceLinks();
    }
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
    showToast('Relationship details updated.');
}

function bindGeneographInspectorNameField()
{
    const input =
        main.querySelector(
            '[data-geneo-entity-name]'
        );

    if (!input) return;

    const entityType =
        input.dataset.geneoEntityName;

    const entityId =
        input.dataset.geneoEntityId;

    input.addEventListener(
        'keydown',
        event =>
        {
            if (event.key === 'Enter')
            {
                event.preventDefault();
                event.stopPropagation();
                input.blur();
                return;
            }

            if (event.key !== 'Escape')
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const entity =
                getGeneographRenameEntity(
                    entityType,
                    entityId
                );

            input.value =
                localizedDataFieldValue(
                    normalizeGeneographLayerName(
                        entity?.name
                    )
                );

            input.blur();
        }
    );

    input.addEventListener(
        'change',
        event =>
        {
            const changed =
                renameGeneographEntity(
                    entityType,
                    entityId,
                    collectLocalizedDataFieldValue(
                        event.target,
                        event.target.dataset
                            .geneoEntitySourceName
                    )
                );

            if (!changed) return;

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        }
    );
}

function bindGeneographPersonCardControls()
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram) return;

    const commit = (
        scaleMap = null
    ) =>
    {
        if (
            scaleMap instanceof Map
        )
        {
            geneoRestorePersonCardDimensions(
                scaleMap,
                diagram
            );
        }

        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );

        touchGeneographBoard();

        renderGeneographEditorPreserveScroll({
            preserveInspectorScroll: true,
            preserveSidebarScroll: true
        });
    };

    const ensureCustomNode =
        node =>
        {
            if (
                node?.type !== 'person'
            )
            {
                return null;
            }

            if (
                node.personCard?.custom
            !== true
            )
            {
                const heightMode =
                    node.personCard?.heightMode;

                node.personCard =
                    geneoEmptyPersonCardOverrides(
                        true,
                        heightMode
                    );
            }

            node.personCard.fields =
                node.personCard.fields
            || {};

            return node;
        };

    main
        .querySelectorAll(
            '[data-geneo-person-card-style]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const value =
                        button.dataset
                            .geneoPersonCardStyle;

                    const scope =
                        button.dataset
                            .geneoPersonCardScope;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            'style',
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .style
                  === value
                        )
                        {
                            return;
                        }

                        const scales =
                            geneoCapturePersonCardDimensions(
                                diagram.nodes,
                                diagram
                            );

                        geneoPushHistory();

                        const previousStyle =
                            diagram.personCardDefaults.style;

                        const photoByStyle = {
                            ...geneoPersonCardDefaultPhotoPreferences(),
                            ...diagram.personCardDefaults
                                .photoByStyle
                        };

                        photoByStyle[previousStyle] =
                            diagram.personCardDefaults
                                .fields.photo;

                        diagram.personCardDefaults
                            .photoByStyle = photoByStyle;

                        diagram.personCardDefaults
                            .fields.photo =
                                photoByStyle[value];

                        diagram
                            .personCardDefaults
                            .style =
                                value;

                        commit(scales);
                        return;
                    }

                    const node =
                        getGeneographNode(
                            button.dataset
                                .geneoPersonCardNode
                        );

                    if (
                        node?.type !== 'person'
                || node.personCard
                    ?.custom !== true
                    )
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node,
                            diagram
                        );

                    if (
                        effective.style === value
                    )
                    {
                        return;
                    }

                    const scales =
                        geneoCapturePersonCardDimensions(
                            [node],
                            diagram
                        );

                    geneoPushHistory();

                    const boardValue =
                        diagram
                            .personCardDefaults
                            .style;

                    node.personCard.style =
                        value === boardValue
                            ? null
                            : value;

                    commit(scales);
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-person-card-use-defaults]'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                const node =
                    getGeneographNode(
                        event.target.dataset
                            .geneoPersonCardNode
                    );

                if (
                    node?.type !== 'person'
                )
                {
                    return;
                }

                const useDefaults =
                    event.target.checked;

                const current =
                    normalizeGeneographPersonCardOverrides(
                        node.personCard
                    );

                if (
                    useDefaults
              && !current.custom
                )
                {
                    return;
                }

                const scales =
                    geneoCapturePersonCardDimensions(
                        [node],
                        diagram
                    );

                geneoPushHistory();

                node.personCard =
                    geneoEmptyPersonCardOverrides(
                        !useDefaults,
                        current.heightMode
                    );

                commit(scales);
            }
        );

    main
        .querySelectorAll(
            '[data-geneo-person-card-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const key =
                        select.dataset
                            .geneoPersonCardSetting;

                    const scope =
                        select.dataset
                            .geneoPersonCardScope;

                    const value =
                        select.value;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            key,
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            diagram.personCardDefaults[
                                key
                            ] === value
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram.personCardDefaults[
                            key
                        ] = value;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            select.dataset
                                .geneoPersonCardNode
                        );

                    if (
                        node?.type !== 'person'
                || node.personCard
                    ?.custom !== true
                    )
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective[key] === value
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    const boardValue =
                        diagram.personCardDefaults[
                            key
                        ];

                    node.personCard[key] =
                        value === boardValue
                            ? null
                            : value;

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-field]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const field =
                        input.dataset
                            .geneoPersonCardField;

                    const scope =
                        input.dataset
                            .geneoPersonCardScope;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        const current =
                            diagram
                                .personCardDefaults
                                .fields[field];

                        if (
                            current
                  === input.checked
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram
                            .personCardDefaults
                            .fields[field] =
                                input.checked;

                        if (field === 'photo')
                        {
                            diagram.personCardDefaults
                                .photoByStyle = {
                                    ...geneoPersonCardDefaultPhotoPreferences(),
                                    ...diagram.personCardDefaults
                                        .photoByStyle,
                                    [diagram.personCardDefaults.style]:
                        input.checked
                                };
                        }

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (
                        node?.type !== 'person'
                || node.personCard
                    ?.custom !== true
                    )
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective.fields[field]
                === input.checked
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    node.personCard.fields =
                        node.personCard.fields
                || {};

                    const boardSettings =
                        normalizeGeneographPersonCardSettings(
                            diagram.personCardDefaults
                        );

                    const boardValue =
                        field === 'photo'
                && effective.style
                  !== boardSettings.style
                            ? geneoPersonCardDefaultFields(
                                effective.style
                            ).photo
                            : boardSettings.fields[field];

                    if (field === 'photo')
                    {
                        node.personCard.photoByStyle =
                            node.personCard.photoByStyle
                  || {};

                        delete node.personCard
                            .fields.photo;

                        if (input.checked === boardValue)
                        {
                            delete node.personCard
                                .photoByStyle[
                                    effective.style
                                ];
                        }
                        else
                        {
                            node.personCard
                                .photoByStyle[
                                    effective.style
                                ] = input.checked;
                        }
                    }
                    else if (
                        input.checked === boardValue
                    )
                    {
                        delete node.personCard
                            .fields[field];
                    }
                    else
                    {
                        node.personCard
                            .fields[field] =
                                input.checked;
                    }

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-radius]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const radius =
                        Math.round(
                            geneoNumber(
                                input.value,
                                8,
                                0,
                                32
                            )
                        );

                    const scope =
                        input.dataset
                            .geneoPersonCardRadius;

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .cornerRadius
                  === radius
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram
                            .personCardDefaults
                            .cornerRadius =
                                radius;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (
                        node?.type !== 'person'
                || node.personCard
                    ?.custom !== true
                    )
                    {
                        return;
                    }

                    if (
                        geneoPersonCardEffectiveSettings(
                            node
                        ).cornerRadius
                === radius
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    const boardRadius =
                        diagram
                            .personCardDefaults
                            .cornerRadius;

                    node.personCard
                        .cornerRadius =
                            radius === boardRadius
                                ? null
                                : radius;

                    commit();
                }
            );
        });

    /*
       * Multi-person presentation controls.
       */
    main
        .querySelectorAll(
            '[data-geneo-person-multi-field]'
        )
        .forEach(input =>
        {
            input.indeterminate =
                input.dataset.mixed
            === 'true';

            input.addEventListener(
                'change',
                () =>
                {
                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const field =
                        input.dataset
                            .geneoPersonMultiField;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        const effective =
                            geneoPersonCardEffectiveSettings(
                                node,
                                diagram
                            );

                        const boardSettings =
                            normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            );

                        const boardValue =
                            field === 'photo'
                  && effective.style
                    !== boardSettings.style
                                ? geneoPersonCardDefaultFields(
                                    effective.style
                                ).photo
                                : boardSettings.fields[field];

                        if (field === 'photo')
                        {
                            node.personCard.photoByStyle =
                                node.personCard.photoByStyle
                    || {};

                            delete node.personCard
                                .fields.photo;

                            if (input.checked === boardValue)
                            {
                                delete node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ];
                            }
                            else
                            {
                                node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ] = input.checked;
                            }
                        }
                        else if (
                            input.checked === boardValue
                        )
                        {
                            delete node.personCard
                                .fields[field];
                        }
                        else
                        {
                            node.personCard
                                .fields[field] =
                                    input.checked;
                        }
                    });

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-multi-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const value =
                        select.value;

                    const key =
                        select.dataset
                            .geneoPersonMultiSetting;

                    if (
                        !value
                || !geneoPersonCardSettingValueIsValid(
                    key,
                    value
                )
                    )
                    {
                        return;
                    }

                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const scales =
                        geneoCapturePersonCardDimensions(
                            nodes,
                            diagram
                        );

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        const boardValue =
                            diagram
                                .personCardDefaults[
                                    key
                                ];

                        node.personCard[key] =
                            value === boardValue
                                ? null
                                : value;
                    });

                    commit(scales);
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-person-multi-use-defaults]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const nodes =
                    selectedGeneographNodes()
                        .filter(
                            node =>
                                node.type
                    === 'person'
                        );

                if (!nodes.length) return;

                const scales =
                    geneoCapturePersonCardDimensions(
                        nodes,
                        diagram
                    );

                geneoPushHistory();

                nodes.forEach(node =>
                {
                    const heightMode =
                        node.personCard?.heightMode;

                    node.personCard =
                        geneoEmptyPersonCardOverrides(
                            false,
                            heightMode
                        );
                });

                commit(scales);
            }
        );
    main
        .querySelectorAll(
            '[data-geneo-person-multi-size]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const factor =
                        geneoNumber(
                            button.dataset
                                .geneoPersonMultiSize,
                            1,
                            .5,
                            2
                        );

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        geneoSetPersonCardDimensions(
                            node,
                            {
                                width: factor,
                                height: factor
                            },
                            diagram
                        );

                        node.personCard.heightMode =
                            'manual';
                    });

                    touchGeneographBoard();

                    renderGeneographEditorPreserveScroll({
                        preserveInspectorScroll:
                  true,
                        preserveSidebarScroll:
                  true
                    });
                }
            );
        });
}

const GENEO_CANVAS_CLICK_DRAG_THRESHOLD = 6;

const GENEO_CANVAS_INTERACTIVE_SELECTOR = [
    'button',
    'input',
    'textarea',
    'select',
    'a',
    '[contenteditable]',
    '.rich-text-toolbar',
    '.ql-tooltip',
    '[data-geneo-node]',
    '.geneo-connection-hit',
    '.geneo-segment-hit',
    '[data-geneo-waypoint]',
    '[data-geneo-family-junction]'
].join(',');

function geneographCanvasTargetIsInteractive(
    target
)
{
    const element =
        target instanceof Element
            ? target
            : target?.parentElement || null;

    return Boolean(
        element?.closest(
            GENEO_CANVAS_INTERACTIVE_SELECTOR
        )
    );
}

function bindGeneographIntentionalCanvasClick(
    wrap
)
{
    if (!wrap) return;

    const thresholdSquared =
        GENEO_CANVAS_CLICK_DRAG_THRESHOLD
        * GENEO_CANVAS_CLICK_DRAG_THRESHOLD;

    let gesture = null;
    let allowNextCanvasClick = false;

    const removeWindowListeners = () =>
    {
        window.removeEventListener(
            'pointermove',
            handlePointerMove,
            true
        );

        window.removeEventListener(
            'pointerup',
            handlePointerUp,
            true
        );

        window.removeEventListener(
            'pointercancel',
            handlePointerCancel,
            true
        );
    };

    const resetGesture = () =>
    {
        gesture = null;
        removeWindowListeners();
    };

    const handlePointerMove = event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        if (
            deltaX * deltaX + deltaY * deltaY >
          thresholdSquared
        )
        {
            gesture.moved = true;
        }
    };

    const finishPointerGesture = (
        event,
        cancelled = false
    ) =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        const exceededThreshold =
            gesture.moved ||
          deltaX * deltaX + deltaY * deltaY >
            thresholdSquared;

        allowNextCanvasClick =
            !cancelled &&
          gesture.startedOnEmptyCanvas &&
          !geneographCanvasTargetIsInteractive(
              event.target
          ) &&
          !exceededThreshold;

        resetGesture();
    };

    function handlePointerUp(event)
    {
        finishPointerGesture(
            event,
            false
        );
    }

    function handlePointerCancel(event)
    {
        finishPointerGesture(
            event,
            true
        );
    }

    /*
       * Capture phase records the true pointer origin before
       * a node, Quill, or another board control can stop the
       * event from propagating.
       */
    wrap.addEventListener(
        'pointerdown',
        event =>
        {
            allowNextCanvasClick = false;
            resetGesture();

            if (
                event.button !== 0 ||
            event.isPrimary === false
            )
            {
                return;
            }

            gesture = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startedOnEmptyCanvas:
              !geneographCanvasTargetIsInteractive(
                  event.target
              ),
                moved: false
            };

            /*
           * Window listeners let the gesture finish safely
           * even when the pointer leaves the original node.
           * They do not prevent defaults or capture the pointer.
           */
            window.addEventListener(
                'pointermove',
                handlePointerMove,
                true
            );

            window.addEventListener(
                'pointerup',
                handlePointerUp,
                true
            );

            window.addEventListener(
                'pointercancel',
                handlePointerCancel,
                true
            );
        },
        true
    );

    wrap.addEventListener(
        'click',
        event =>
        {
            const intentionalCanvasClick =
                allowNextCanvasClick;

            /*
           * Consume the authorization once. A later synthetic
           * or unrelated click must not inherit it.
           */
            allowNextCanvasClick = false;

            if (
                !intentionalCanvasClick ||
            geneoCanvasRuntime.suppressNodeClick ||
            geneographCanvasTargetIsInteractive(
                event.target
            )
            )
            {
                return;
            }

            if (
                state.geneoTool === 'connect'
            )
            {
            /*
             * Preserve the existing connect-mode behavior:
             * the first empty-canvas click remains inert and
             * the second click in a double-click exits to Pan.
             */
                if (event.detail !== 2)
                {
                    return;
                }

                event.preventDefault();

                cancelGeneographConnectionDraft();
                selectGeneographCanvas();

                state.geneoTool = 'pan';

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });
                return;
            }

            const hadSelection =
                Boolean(
                    state.selectedGeneoNodeId
              || state.selectedGeneoConnectionId
              || state.selectedGeneoNodeIds
                  .length
              || state
                  .selectedGeneoConnectionIds
                  .length
              || Number.isInteger(
                  state.selectedGeneoWaypointIndex
              )
                );

            const hadConnectionDraft =
                Boolean(
                    state.geneoConnectionDraft
                );

            selectGeneographCanvas();
            cancelGeneographConnectionDraft();

            /*
           * Clicking an already selected Canvas is a no-op.
           * Avoid recreating the inspector and losing its
           * current scroll position.
           */
            if (
                !hadSelection
            && !hadConnectionDraft
            )
            {
                return;
            }

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        }
    );
}

function bindGeneographEditor()
{
    bindGeneographInspectorSectionToggles();

    bindGeneographToolbarDensity();
    bindGeneographToolbarKeyboard();

    const wrap = main.querySelector(
        '[data-geneo-canvas-wrap]'
    );
    if (!main.dataset.geneoConnectionClickBoundaryBound)
    {
        main.dataset.geneoConnectionClickBoundaryBound = 'true';
        main.addEventListener('pointerdown', event =>
        {
            if (!event.target.closest('.geneo-connection-hit, .geneo-segment-hit')) clearGeneographConnectionClick();
        }, true);
    }
    main.querySelector('[data-geneo-undo]')?.addEventListener('click', undoGeneographChange); main.querySelector('[data-geneo-redo]')?.addEventListener('click', redoGeneographChange);
    main
        .querySelectorAll('[data-geneo-add]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                addGeneographObject(
                    button.dataset.geneoAdd
                );
            });
        });
    main
        .querySelectorAll(
            '[data-geneo-edit-rich-text]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    beginGeneographInlineEdit(
                        button.dataset
                            .geneoEditRichText,
                        {
                            surface:
                    'inspector'
                        }
                    );
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-rich-text-done]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    false
                );
            }
        );

    main
        .querySelector(
            '[data-geneo-rich-text-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    true
                );
            }
        );
    main
        .querySelectorAll('[data-geneo-placement-tool]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                activateGeneographPlacementTool(
                    button.dataset.geneoPlacementTool
                );
            });
        });
    main
        .querySelectorAll(
            '[data-geneo-tool]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    cancelGeneographPencilStroke();
                    cancelGeneographConnectionDraft();

                    state.geneoPlacementReturnTool =
                        null;

                    state.geneoTool =
                        button.dataset.geneoTool;

                    hideGeneographPanelDraftDom();

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    main
        .querySelector(
            '[data-geneo-connection-main]'
        )
        ?.addEventListener(
            'click',
            activateGeneographConnectionTool
        );
    const connectionMenuButton = main.querySelector('[data-geneo-connection-menu]');
    connectionMenuButton?.addEventListener('click', event =>
    {
        event.preventDefault();
        event.stopPropagation();
        openGeneoConnectionStyleMenu(connectionMenuButton);
    });
    /*
      * Notes & text main action.
      * Repeats the last content type selected
      * from the Notes & text menu.
      */
    main
        .querySelector(
            '[data-geneo-content-main]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const kind =
                    normalizeGeneographContentKind(
                        state.geneoContentKind
                    );

                activateGeneographPlacementTool(
                    kind
                );
            }
        );

    /*
      * Notes & text dropdown.
      */
    const contentMenuButton =
        main.querySelector(
            '[data-geneo-content-menu]'
        );

    contentMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoContentMenu(
                    contentMenuButton
                );
            }
        );

    /*
      * Shapes main action.
      * Activates the currently selected shape.
      */
    main
        .querySelector(
            '[data-geneo-shape-main]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                activateGeneographPlacementTool(
                    'shape'
                );
            }
        );

    /*
      * Shapes dropdown.
      */
    const shapeMenuButton =
        main.querySelector(
            '[data-geneo-shape-menu]'
        );

    shapeMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoShapeMenu(
                    shapeMenuButton
                );
            }
        );

    /*
      * Responsive toolbar overflow menu.
      */
    const toolbarOverflowButton =
        main.querySelector(
            '[data-geneo-toolbar-overflow]'
        );

    toolbarOverflowButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoToolbarOverflowMenu(
                    toolbarOverflowButton
                );
            }
        );
    main
        .querySelectorAll(
            '[data-geneo-add-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openGeneographRelativePopover(
                        button,
                        button.dataset
                            .geneoAddRelative
                    );
                }
            );
        });
    main.querySelectorAll('[data-geneo-port-node]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const reference = { nodeId: button.dataset.geneoPortNode, port: button.dataset.geneoPort };
        activateGeneographConnectionPoint(reference);
    }));
    main.querySelectorAll('[data-geneo-family-junction]').forEach(junction => junction.addEventListener('click', event =>
    {
        event.stopPropagation();
        const reference = { familyId: junction.dataset.geneoFamilyJunction, port: 'bottom' };
        activateGeneographConnectionPoint(reference);
    }));
    main
        .querySelectorAll(
            '[data-geneo-node]'
        )
        .forEach(element =>
        {
            const interactiveSelector =
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    'a',
                    '[contenteditable="true"]',
                    '.rich-text-toolbar',
                    '.ql-tooltip'
                ].join(',');

            element.addEventListener(
                'pointerdown',
                event =>
                {
                    if (
                        !startGeneographResize(
                            event
                        )
                    )
                    {
                        startGeneographObjectDrag(
                            event
                        );
                    }
                }
            );

            element.addEventListener(
                'click',
                event =>
                {
                    if (
                        geneoCanvasRuntime
                            .suppressNodeClick
                || event.target.closest(
                    interactiveSelector
                )
                    )
                    {
                        return;
                    }

                    selectGeneographNode(
                        element.dataset
                            .geneoNode,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            element.addEventListener(
                'dblclick',
                event =>
                {
                    if (
                        event.target.closest(
                            interactiveSelector
                        )
                    )
                    {
                        return;
                    }

                    const node =
                        getGeneographNode(
                            element.dataset
                                .geneoNode
                        );

                    if (
                        node
                && [
                    'sticky',
                    'text',
                    'panel'
                ].includes(
                    node.type
                )
                    )
                    {
                        event.preventDefault();

                        beginGeneographInlineEdit(
                            node.id
                        );
                    }
                }
            );
        });
    main.querySelectorAll('.geneo-connection-hit').forEach(path => path.addEventListener('pointerdown', startGeneographConnectionDrag));
    main.querySelectorAll('.geneo-connection-hit, .geneo-segment-hit').forEach(path => path.addEventListener('click', handleGeneographConnectionClick));
    main.querySelectorAll('[data-geneo-waypoint]').forEach(point =>
    {
        point.addEventListener('click', event =>
        {
            event.stopPropagation(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); renderGeneographEditorPreserveScroll();
        }); point.addEventListener('pointerdown', event =>
        {
            event.preventDefault(); event.stopPropagation(); clearGeneographConnectionClick(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); geneoPushHistory(); geneoPointerState = { kind: 'waypoint', connectionId: point.dataset.geneoConnection, index: Number(point.dataset.geneoWaypoint), moved: false };
        });
    });
    main.querySelectorAll('[data-geneo-segment]').forEach(segment => segment.addEventListener('pointerdown', event =>
    {
        event.preventDefault(); event.stopPropagation();
        const connection = getGeneographConnection(segment.dataset.geneoConnection); if (!connection) return; const index = Number(segment.dataset.geneoSegment); const points = geneoConnectionPoints(connection);
        if (index < 1 || index >= points.length - 2) return;
        geneoPushHistory();
        if (connection.route.mode !== 'manual') connection.route = { mode: 'manual', waypoints: points.slice(1, -1).map(snapGeneographPoint) };
        const firstWaypoint = index - 1, secondWaypoint = index; const first = connection.route.waypoints[firstWaypoint], second = connection.route.waypoints[secondWaypoint]; if (!first || !second) return;
        geneoPointerState = { kind: 'segment', connectionId: connection.id, start: geneoPointerToCanvas(event), firstWaypoint, secondWaypoint, first: { ...first }, second: { ...second }, vertical: Math.abs(first.x - second.x) < Math.abs(first.y - second.y), moved: false };
    }));
    wrap?.addEventListener('pointerdown', () =>
    {
        const pendingExpansion = Boolean(
            geneoCanvasRuntime.edgeExpansionFrame
          || geneoCanvasRuntime.pendingEdgeExpansion
        );
        cancelGeneographEdgeExpansion({ pending: pendingExpansion });
        cancelGeneographViewportRestore({ releaseSuppression: true });
    }, { capture: true });
    wrap?.addEventListener('click', event =>
    {
        bindGeneographIntentionalCanvasClick(
            wrap
        );
    });
    wrap?.addEventListener('pointerdown', event =>
    {
        if (event.button !== 0 || event.isPrimary === false)
        {
            return;
        }
        if (
            state.geneoTool === 'sticky'
          || state.geneoTool === 'text'
        )
        {
            const placementType =
                state.geneoTool;

            /*
           * Text and Sticky can be placed on
           * empty canvas or inside a Panel.
           * Existing objects and interaction
           * controls are not placement surfaces.
           */
            const blockedControl =
                event.target.closest(
                    [
                        'button',
                        'input',
                        'textarea',
                        'select',
                        'a',
                        '[contenteditable="true"]',
                        '.rich-text-toolbar',
                        '.ql-tooltip',
                        '[data-geneo-connection]',
                        '.geneo-connection-hit',
                        '.geneo-segment-hit',
                        '[data-geneo-waypoint]',
                        '[data-geneo-family-junction]'
                    ].join(',')
                );

            if (blockedControl)
            {
                return;
            }

            const nodeElement =
                event.target.closest(
                    '[data-geneo-node]'
                );

            if (nodeElement)
            {
                const clickedNode =
                    getGeneographNode(
                        nodeElement.dataset
                            .geneoNode
                    );

                if (
                    clickedNode?.type
                !== 'panel'
                )
                {
                    return;
                }
            }

            event.preventDefault();
            event.stopPropagation();

            createGeneographRichTextNodeAtPoint(
                placementType,
                geneoPointerToCanvas(
                    event
                )
            );

            return;
        }

        if (state.geneoTool === 'pencil')
        {
            if (event.target.closest([
                'button',
                'input',
                'textarea',
                'select',
                'a',
                '[contenteditable="true"]',
                '.rich-text-toolbar',
                '.ql-tooltip'
            ].join(','))) return;
            event.preventDefault();
            event.stopPropagation();
            const point = geneoPointerToCanvas(event);
            geneoPointerState = {
                kind: 'pencil',
                pointerId: event.pointerId,
                wrap,
                points: [point],
                beforeSnapshot: geneoSnapshot(),
                moved: false
            };
            wrap.setPointerCapture?.(event.pointerId);
            updateGeneographPencilPreview(geneoPointerState.points);
            return;
        }

        const placementNodeElement = event.target.closest('[data-geneo-node]');
        const drawingShapeOnPanel = state.geneoTool === 'shape'
          && getGeneographNode(placementNodeElement?.dataset.geneoNode)?.type === 'panel';
        if (
            event.target.closest(
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    '[data-geneo-connection]',
                    '[data-geneo-waypoint]',
                    '[data-geneo-family-junction]'
                ].join(',')
            )
          || (placementNodeElement && !drawingShapeOnPanel)
        )
        {
            return;
        }

        if (state.geneoTool === 'pan')
        {
            geneoPointerState = {
                kind: 'pan',
                wrap,
                clientX: event.clientX,
                clientY: event.clientY,
                left: wrap.scrollLeft,
                top: wrap.scrollTop,
                moved: false
            };
        }
        else if (state.geneoTool === 'select')
        {
            const additive = event.shiftKey;

            geneoPointerState = {
                kind: 'marquee',
                start: geneoPointerToCanvas(event),
                current: geneoPointerToCanvas(event),
                baseIds: additive
                    ? [...geneoSelectedNodeIdSet()]
                    : [],
                baseConnectionIds: additive
                    ? [...geneoSelectedConnectionIdSet()]
                    : [],
                additive,
                moved: false
            };

            if (!additive)
            {
                setGeneographSelection();
            }
        }
        else if (
            state.geneoTool === 'panel'
          || state.geneoTool === 'shape'
        )
        {
            const point = snapGeneographPoint(
                geneoPointerToCanvas(event)
            );

            geneoPointerState = {
                kind: state.geneoTool === 'shape' ? 'draw-shape' : 'draw-panel',
                start: point,
                current: point,
                moved: false
            };

            updateGeneographPanelDraftDom(
                point,
                point
            );
        }
        else
        {
            return;
        }
        event.preventDefault();
    });
    wrap?.addEventListener('wheel', queueGeneographWheelZoom, { passive: false });
    wrap?.addEventListener('scroll', expandGeneographCanvasNearEdge, { passive: true });
    ensureGeneographPointerBinding();
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('blur', () => commitGeneoInlineEdit(false));
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); commitGeneoInlineEdit(true);
        }
        else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.target.tagName === 'INPUT'))
        {
            event.preventDefault(); commitGeneoInlineEdit(false);
        }
    });
    main.querySelectorAll('[data-geneo-zoom]').forEach(button => button.addEventListener('click', () =>
    {
        const nextZoom = button.dataset.geneoZoom === 'in' ? state.geneoZoom + 10 : button.dataset.geneoZoom === 'out' ? state.geneoZoom - 10 : 65;
        setGeneographZoom(nextZoom, { center: geneoCurrentViewportCenter() });
    }));
    main.querySelector('[data-geneo-inspector-toggle]')?.addEventListener('click', () =>
    {
        state.geneoInspectorCollapsed = !state.geneoInspectorCollapsed; renderGeneographEditorPreserveScroll();
    });
    main
        .querySelector(
            '[data-geneo-export]'
        )
        ?.addEventListener(
            'click',
            exportGeneographBoard
        );
    main
        .querySelectorAll('[data-geneo-node-field]')
        .forEach(input =>
        {
            /*
          * Capture the node identity while binding.
          * Do not resolve through the current selection
          * after the user starts interacting elsewhere.
          */
            const nodeId =
                state.selectedGeneoNodeId;

            input.addEventListener('change', () =>
            {
                const node =
                    getGeneographNode(nodeId);

                if (!node) return;

                const field =
                    input.dataset.geneoNodeField;

                if (!field) return;

                const nextValue =
                    input.value;

                if (node[field] === nextValue)
                {
                    return;
                }

                geneoPushHistory();

                node[field] = nextValue;

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true
                });
            });
        });
    bindGeneoPaintControls();
    main.querySelectorAll('[data-geneo-stroke-pattern]').forEach(input =>
    {
        input.addEventListener('change', event =>
        {
            const scope = event.target.dataset.geneoStrokePattern;
            const entity = scope === 'connection' ? selectedGeneographConnection() : selectedGeneographNode();
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const nextPattern = event.target.value === 'dashed' ? 'dashed' : 'solid';
            if (target[scope === 'connection' ? 'pattern' : 'strokePattern'] === nextPattern) return;
            geneoPushHistory();
            target[scope === 'connection' ? 'pattern' : 'strokePattern'] = nextPattern;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        });
    });
    main.querySelectorAll('[data-geneo-stroke-width]').forEach(input =>
    {
        const scope = input.dataset.geneoStrokeWidth;
        const entityId = scope === 'connection'
            ? state.selectedGeneoConnectionId
            : state.selectedGeneoNodeId;
        const commitStrokeWidth = () =>
        {
            const entity = scope === 'connection'
                ? getGeneographConnection(entityId)
                : getGeneographNode(entityId);
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const key = scope === 'connection' ? 'width' : 'strokeWidth';
            const nextWidth = Math.round(geneoNumber(
                input.value,
                target[key],
                GENEO_STROKE_WIDTH_MIN,
                GENEO_STROKE_WIDTH_MAX
            ));
            input.value = nextWidth;
            if (target[key] === nextWidth) return;
            geneoPushHistory();
            target[key] = nextWidth;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        input.addEventListener('change', commitStrokeWidth);
        input.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitStrokeWidth();
        });
    });
    main
        .querySelector(
            '[data-geneo-text-corner-radius]'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                const node =
                    selectedGeneographNode();

                if (
                    node?.type !== 'text'
                )
                {
                    return;
                }

                const nextRadius =
                    Math.round(
                        geneoNumber(
                            event.target.value,
                            node.appearance.cornerRadius,
                            0,
                            32
                        )
                    );

                if (
                    nextRadius
              === node.appearance.cornerRadius
                )
                {
                    event.target.value =
                        nextRadius;

                    return;
                }

                geneoPushHistory();

                node.appearance.cornerRadius =
                    nextRadius;

                event.target.value =
                    nextRadius;

                touchGeneographBoard();

                main
                    .querySelector(
                        `[data-geneo-node="${
                            CSS.escape(node.id)
                        }"]`
                    )
                    ?.style
                    .setProperty(
                        '--geneo-node-radius',
                        `${nextRadius}px`
                    );
            }
        );
    main
        .querySelectorAll(
            '[data-geneo-layout]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const node =
                        selectedGeneographNode();

                    if (!node) return;

                    const field =
                        input.dataset
                            .geneoLayout;

                    const minimumSize =
                        geneoNodeMinimumSize(
                            node,
                            node.width
                        );

                    const maximumSize =
                        geneoNodeMaximumSize(
                            node
                        );

                    const minimum =
                        field === 'width'
                            ? minimumSize.width
                            : field === 'height'
                                ? minimumSize.height
                                : -GENEO_WORLD_LIMIT;

                    const maximum =
                        field === 'width'
                            ? maximumSize.width
                            : field === 'height'
                                ? maximumSize.height
                                : GENEO_WORLD_LIMIT;

                    const nextValue =
                        geneoNumber(
                            input.value,
                            node[field],
                            minimum,
                            maximum
                        );

                    if (
                        nextValue ===
                node[field]
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    if (
                        node.type === 'person'
                && field === 'height'
                    )
                    {
                        node.personCard.heightMode =
                            'manual';
                    }

                    if (
                        node.type === 'place'
                && [
                    'width',
                    'height'
                ].includes(field)
                    )
                    {
                        node.placeSizeMode =
                            'manual';
                    }

                    node[field] =
                        nextValue;

                    if (
                        node.type === 'panel'
                    )
                    {
                        reconcileGeneographPanelMembership(
                            node.id
                        );
                    }

                    touchGeneographBoard();

                    renderGeneographEditorPreserveScroll({
                        preserveInspectorScroll:
                  true
                    });
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-place-fit-content]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const node =
                    selectedGeneographNode();

                if (
                    node?.type !== 'place'
              || geneoPlaceUsesAutoSize(node)
                )
                {
                    return;
                }

                geneoPushHistory();

                node.placeSizeMode =
                    'auto';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });
            }
        );
    main
        .querySelector(
            '[data-geneo-person-fit-height]'
        )
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (
                node?.type !== 'person'
            || node.personCard?.heightMode === 'auto'
            )
            {
                return;
            }

            geneoPushHistory();
            node.personCard.heightMode = 'auto';
            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        });

    main
        .querySelectorAll(
            '[data-geneo-person-size]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const node =
                        selectedGeneographNode();

                    if (
                        node?.type !== 'person'
                    )
                    {
                        return;
                    }

                    const factor =
                        geneoNumber(
                            button.dataset
                                .geneoPersonSize,
                            1,
                            .5,
                            2
                        );

                    geneoPushHistory();

                    geneoSetPersonCardDimensions(
                        node,
                        {
                            width: factor,
                            height: factor
                        }
                    );

                    node.personCard.heightMode =
                        'manual';

                    touchGeneographBoard();

                    renderGeneographEditorPreserveScroll({
                        preserveInspectorScroll:
                  true
                    });
                }
            );
        });
    main
        .querySelector('[data-geneo-node-visible]')
        ?.addEventListener('change', event =>
        {
            const node =
                selectedGeneographNode();

            if (!node) return;

            geneoPushHistory();

            node.visible =
                event.target.checked;

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });
    main
        .querySelector('[data-geneo-node-locked]')
        ?.addEventListener('change', event =>
        {
            const node =
                selectedGeneographNode();

            if (!node) return;

            geneoPushHistory();

            node.locked =
                event.target.checked;

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });
    main.querySelector('[data-geneo-link-person]')?.addEventListener('click', openGeneographTreePersonPicker);
    main.querySelector('[data-geneo-edit-person]')?.addEventListener('click', () =>
    {
        const person = getGeneographPerson(selectedGeneographNode()?.personId); if (person) openGeneographPersonModal(person.id);
    });
    main
        .querySelector(
            '[data-geneo-unlink-person]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const person =
                    getGeneographPerson(
                        selectedGeneographNode()
                            ?.personId
                    );

                if (!person) return;

                geneoPushHistory();

                person.treePersonId =
                    null;

                person.syncState =
                    'local';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });

                showToast(
                    'Person unlinked from Family Tree.'
                );
            }
        );
    main.querySelector('[data-geneo-edit-place]')?.addEventListener('click', event => openGeneographPlaceModal(event.currentTarget.dataset.geneoEditPlace));
    main.querySelector('[data-geneo-place-board-only]')?.addEventListener('click', event => makeGeneographPlaceBoardOnly(event.currentTarget.dataset.geneoPlaceBoardOnly));
    main.querySelector('[data-geneo-open-place]')?.addEventListener('click', event => openGeneographPlaceInPlaces(event.currentTarget.dataset.geneoOpenPlace));
    const shapeRadiusInput = main.querySelector('[data-geneo-shape-corner-radius]');
    if (shapeRadiusInput)
    {
        const nodeId = state.selectedGeneoNodeId;
        const commitShapeRadius = () =>
        {
            const node = getGeneographNode(nodeId);
            if (node?.type !== 'shape' || normalizeGeneographShapeKind(node.shapeKind) === 'ellipse') return;
            const radius = Math.round(geneoNumber(shapeRadiusInput.value, node.appearance.cornerRadius, 0, 32));
            shapeRadiusInput.value = radius;
            if (node.appearance.cornerRadius === radius) return;
            geneoPushHistory();
            node.appearance.cornerRadius = radius;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        shapeRadiusInput.addEventListener('change', commitShapeRadius);
        shapeRadiusInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitShapeRadius();
        });
    }
    main
        .querySelector('[data-geneo-replace-image]')
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (node?.type === 'image')
            {
                openGeneographImagePicker({
                    mode: 'replace',
                    nodeId: node.id
                });
            }
        });

    main
        .querySelector('[data-geneo-open-project-photo]')
        ?.addEventListener('click', event =>
        {
            const photoId =
                event.currentTarget.dataset.geneoOpenProjectPhoto;

            if (getPhoto(photoId, {
                projectId: selectedGeneographBoard()?.projectId || ''
            }))
            {
                openAlbumsForPhoto(photoId);
            }
        });
    main.querySelector('[data-geneo-delete-selection]')?.addEventListener('click', deleteGeneographSelection);
    const relationshipEditor = main.querySelector('[data-geneo-relationship-editor]');
    if (relationshipEditor)
    {
        bindGenealogyDateFields(relationshipEditor);
        bindPlaceComboboxes(relationshipEditor);
        relationshipEditor.querySelector('[data-geneo-relationship-type]')?.addEventListener('change', event => updatePartnerRelationshipFields(relationshipEditor, event.target.value));
        relationshipEditor.querySelector('[data-geneo-show-relationship-dates]')?.addEventListener('change', event =>
        {
            const connection = selectedGeneographConnection(); if (!connection) return; geneoPushHistory(); connection.showRelationshipDates = event.target.checked; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        });
        relationshipEditor.querySelector('[data-geneo-save-relationship]')?.addEventListener('click', saveGeneographPartnerRelationship);
    }
    main
        .querySelector('[data-geneo-connection-routing]')
        ?.addEventListener('change', event =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            geneoPushHistory();

            connection.route.mode =
                event.target.value;

            if (
                connection.route.mode === 'manual'
            && !connection.route.waypoints.length
            )
            {
                const points =
                    geneoConnectionPoints({
                        ...connection,
                        route: {
                            mode: 'auto',
                            waypoints: []
                        }
                    });

                connection.route.waypoints =
                    points
                        .slice(1, -1)
                        .map(snapGeneographPoint);
            }

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });

    main
        .querySelector('[data-geneo-reset-route]')
        ?.addEventListener('click', () =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            geneoPushHistory();

            connection.route = {
                mode: 'auto',
                waypoints: []
            };

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });
    main.querySelectorAll('[data-geneo-background-pattern]').forEach(button => button.addEventListener('click', () => updateGeneoCanvasSetting('backgroundPattern', button.dataset.geneoBackgroundPattern)));
    main.querySelector('[data-geneo-sockets]')?.addEventListener('change', event => updateGeneoCanvasSetting('alwaysShowSockets', event.target.checked));
    main.querySelector('[data-geneo-snap]')?.addEventListener('change', event => updateGeneoCanvasSetting('snapToGrid', event.target.checked));
    main.querySelector('[data-geneo-person-gender-colors]')?.addEventListener('change', event => updateGeneoCanvasSetting('colorPersonCardsByGender', event.target.checked));
    bindGeneographInspectorNameField();
    bindGeneographPersonCardControls();
    bindGeneographSidebarControls();
    bindToasts(main);
}

function ensureGeneographPointerBinding()
{
    if (geneoPointerBound) return;
    geneoPointerBound = true;
    window.addEventListener('pointermove', moveGeneographObject);
    window.addEventListener('pointerup', endGeneographObjectDrag);
    window.addEventListener('pointercancel', endGeneographObjectDrag);
}

function updateGeneoCanvasSetting(field, value)
{
    const canvas = selectedGeneographDiagram().canvas;

    if (canvas[field] === value) return;

    geneoPushHistory();
    canvas[field] = value;
    touchGeneographBoard();

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: true,
        preserveSidebarScroll: true
    });
}

function bindGeneographSidebarControls()
{
    if (
        !sidebar.dataset
            .geneoLayerRenameBound
    )
    {
        sidebar.dataset
            .geneoLayerRenameBound = 'true';

        /*
        * The sidebar contents are replaced after
        * selection. Detect the second mouse press
        * from the persistent sidebar element.
        */
        sidebar.addEventListener(
            'mousedown',
            event =>
            {
                if (
                    event.button !== 0
              || event.detail !== 2
                )
                {
                    return;
                }

                const handle =
                    event.target.closest?.(
                        '[data-geneo-layer-rename-handle]'
                    );

                if (!handle) return;

                const nodeRow =
                    handle.closest(
                        '[data-geneo-layer]'
                    );

                const connectionRow =
                    handle.closest(
                        '[data-geneo-layer-connection]'
                    );

                if (!nodeRow && !connectionRow)
                {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (nodeRow)
                {
                    beginGeneographLayerRename(
                        'node',
                        nodeRow.dataset.geneoLayer
                    );
                }
                else
                {
                    beginGeneographLayerRename(
                        'connection',
                        connectionRow.dataset
                            .geneoLayerConnection
                    );
                }
            },
            true
        );
    }
    sidebar.querySelector('[data-geneo-all-boards]')?.addEventListener('click', () =>
    {
        captureGeneographViewport(); cancelGeneographConnectionDraft(); state.geneoView = 'home'; selectGeneographCanvas(); renderGeneographHome();
    });
    sidebar.querySelector('[data-geneo-settings]')?.addEventListener('click', openGeneographSettingsModal);
    sidebar.querySelectorAll('[data-geneo-sidebar-section]').forEach(button => button.addEventListener('click', () =>
    {
        const section = button.dataset.geneoSidebarSection;
        if (!['layers', 'connections'].includes(section)) return;
        state.geneoSidebarSections[section] = !state.geneoSidebarSections[section];
        renderGeneographEditorPreserveScroll();
    }));
    sidebar.querySelector('#geneoLayerSearch')?.addEventListener('input', event =>
    {
        state.geneoLayerSearch = event.target.value; renderGeneographEditorPreserveScroll(); requestAnimationFrame(() =>
        {
            const input = sidebar.querySelector('#geneoLayerSearch'); if (input)
            {
                input.focus(); input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer]'
        )
        .forEach(row =>
        {
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            'button,input'
                        )
                    )
                    {
                        return;
                    }

                    selectGeneographNode(
                        row.dataset.geneoLayer,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'node',
                            row.dataset.geneoLayer
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographNode(
                        row.dataset.geneoLayer,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'dragstart',
                event =>
                {
                    if (
                        geneoLayerRenameMatches(
                            'node',
                            row.dataset.geneoLayer
                        )
                    )
                    {
                        event.preventDefault();
                        return;
                    }

                    event.dataTransfer.setData(
                        'text/geneo-node',
                        row.dataset.geneoLayer
                    );
                }
            );

            row.addEventListener(
                'dragover',
                event =>
                {
                    event.preventDefault();
                }
            );

            row.addEventListener(
                'drop',
                event =>
                {
                    event.preventDefault();

                    const moved =
                        getGeneographNode(
                            event.dataTransfer.getData(
                                'text/geneo-node'
                            )
                        );

                    const target =
                        getGeneographNode(
                            row.dataset.geneoLayer
                        );

                    if (
                        !moved
                || !target
                || moved.id === target.id
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    moved.order =
                        target.order + 0.5;

                    selectedGeneographDiagram()
                        .nodes
                        .sort(
                            (first, second) =>
                                first.order
                    - second.order
                        )
                        .forEach(
                            (node, index) =>
                            {
                                node.order = index + 1;
                            }
                        );

                    touchGeneographBoard();
                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer-connection]'
        )
        .forEach(row =>
        {
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest('input')
                    )
                    {
                        return;
                    }

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection,
                        null,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'connection',
                            row.dataset
                                .geneoLayerConnection
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    sidebar.querySelectorAll('[data-geneo-toggle-visible]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleVisible); if (node)
        {
            geneoPushHistory(); node.visible = !node.visible; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-toggle-lock]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleLock); if (node)
        {
            geneoPushHistory(); node.locked = !node.locked; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-collapse-panel]').forEach(button => button.addEventListener('click', () =>
    {
        const id = button.dataset.geneoCollapsePanel; state.geneoCollapsedPanels[id] = !state.geneoCollapsedPanels[id]; renderGeneographEditorPreserveScroll();
    }));
    const renameInput =
        sidebar.querySelector(
            '[data-geneo-layer-rename-input]'
        );

    if (renameInput)
    {
        renameInput.addEventListener(
            'input',
            event =>
            {
                const rename =
                    state.geneoLayerRename;

                if (!rename) return;

                if (
                    rename.entityType
                !== event.target.dataset
                    .geneoRenameType
              || rename.entityId
                !== event.target.dataset
                    .geneoRenameId
                )
                {
                    return;
                }

                rename.draft =
                    event.target.value;
            }
        );

        renameInput.addEventListener(
            'keydown',
            event =>
            {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        value: event.target.value,
                        restoreFocus: true
                    });

                    return;
                }

                if (event.key === 'Escape')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        cancel: true,
                        restoreFocus: true
                    });
                }
            }
        );

        renameInput.addEventListener(
            'blur',
            event =>
            {
                const value =
                    event.target.value;

                const entityType =
                    event.target.dataset
                        .geneoRenameType;

                const entityId =
                    event.target.dataset
                        .geneoRenameId;

                setTimeout(() =>
                {
                    if (
                        !geneoLayerRenameMatches(
                            entityType,
                            entityId
                        )
                    )
                    {
                        return;
                    }

                    finishGeneographLayerRename({
                        value,
                        restoreFocus: false
                    });
                }, 0);
            }
        );
    }
}

function ensureGeneographKeyboardBinding()
{
    if (geneoKeyboardBound) return; geneoKeyboardBound = true;
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = true;
        }
        if (state.activeModule !== 'Geneograph' || state.geneoView !== 'board' || modalBackdrop.classList.contains('open')) return;
        const editable = event.target.closest('input,textarea,select,[contenteditable="true"]');
        if (editable) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z')
        {
            event.preventDefault(); event.shiftKey ? redoGeneographChange() : undoGeneographChange(); return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')
        {
            event.preventDefault(); redoGeneographChange(); return;
        }
        if (event.key === 'Escape' && (state.geneoTool === 'pencil' || geneoPointerState?.kind === 'pencil'))
        {
            event.preventDefault();
            cancelGeneographPencilStroke();
            state.geneoTool = 'pan';
            renderGeneographEditorPreserveScroll();
            return;
        }
        if (
            event.key === 'Escape'
          && (
              state.geneoTool === 'panel'
            || state.geneoTool === 'sticky'
            || state.geneoTool === 'text'
            || state.geneoTool === 'shape'
            || geneoPointerState?.kind
              === 'draw-panel'
            || geneoPointerState?.kind
              === 'draw-shape'
          )
        )
        {
            event.preventDefault();

            geneoPointerState = null;
            hideGeneographPanelDraftDom();

            finishGeneographPlacementTool();

            renderGeneographEditorPreserveScroll();
            return;
        }
        if (event.key === 'Escape' && state.geneoConnectionDraft)
        {
            event.preventDefault(); cancelGeneographConnectionDraft(); renderGeneographEditorPreserveScroll(); return;
        }
        if (event.key === 'Escape' && geneoCanvasRuntime.connectionClick)
        {
            event.preventDefault(); clearGeneographConnectionClick(); return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace')
        {
            if (Number.isInteger(state.selectedGeneoWaypointIndex))
            {
                const connection = selectedGeneographConnection(); if (connection?.route.waypoints[state.selectedGeneoWaypointIndex])
                {
                    geneoPushHistory(); connection.route.waypoints.splice(state.selectedGeneoWaypointIndex, 1); state.selectedGeneoWaypointIndex = null; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
                }
            }
            else deleteGeneographSelection(); return;
        }
        const selectedNodes = selectedGeneographNodes();
        const selectedConnections = selectedGeneographConnections();
        if ((!selectedNodes.length && !selectedConnections.length) || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
        const moving = geneoGroupMoveSnapshot(selectedNodes);
        const movingConnections = geneoConnectionMoveSnapshot(moving, selectedConnections);
        if (!moving.length && !movingConnections.length) return;
        event.preventDefault(); geneoPushHistory();
        const requested = event.shiftKey ? 10 : 1;
        const amount = selectedGeneographDiagram().canvas.snapToGrid ? GENEO_GRID_SIZE : requested;
        const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
        const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        applyGeneographSelectionTranslation({ nodes: moving, connections: movingConnections }, dx, dy);
        touchGeneographBoard(); renderGeneographEditorPreserveScroll();
    });
    document.addEventListener('keyup', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = false;
        }
    });
    window.addEventListener('blur', () =>
    {
        geneoShiftPressed = false;
    });
}

function openSimpleModal(title, message)
{
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="simpleModalTitle"><div class="modal-header"><div><h2 id="simpleModalTitle">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-footer"><button class="button primary" type="button" data-close>Got it</button></div></div>`);
}

