    // ---------- Archive: genealogy file manager MVP ----------

    sampleData.archiveFolders = [
      { id: 'pawford', projectId: 'p1', parentId: 'null', name: 'Archives', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
      { id: 'fond12', projectId: 'p1', parentId: 'pawford', name: 'United Kingdom', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
      { id: 'opis3', projectId: 'p1', parentId: 'fond12', name: 'North Yorkshire', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
      { id: 'delo44', projectId: 'p1', parentId: 'opis3', name: 'Pawford registers', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
      { id: 'delo45', projectId: 'p1', parentId: 'opis3', name: 'Household books', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-28T10:00:00Z' },
      { id: 'documents', projectId: 'p1', parentId: 'null', name: 'Family documents', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
      { id: 'certificates', projectId: 'p1', parentId: 'documents', name: 'Certificates', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
      { id: 'interviews', projectId: 'p1', parentId: 'null', name: 'Interviews and correspondence', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' },
      { id: 'albums-origin', projectId: 'p1', parentId: 'null', name: 'Books and reference', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z' },
      { id: 'unsorted', projectId: 'p1', parentId: 'null', name: 'Scanned material', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
      { id: 'inbox', projectId: 'p1', parentId: 'null', name: 'Unfiled', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' }
    ];

    const SOURCE_CATEGORIES =
      Object.freeze([
        Object.freeze({
          value:
            'institution',

          label:
            'Archive, library, or institution',

          shortLabel:
            'Institutions'
        }),

        Object.freeze({
          value:
            'online',

          label:
            'Website or online database',

          shortLabel:
            'Online sources'
        }),

        Object.freeze({
          value:
            'publication',

          label:
            'Book, newspaper, or publication',

          shortLabel:
            'Publications'
        }),

        Object.freeze({
          value:
            'person',

          label:
            'Person, interview, or correspondence',

          shortLabel:
            'People & correspondence'
        }),

        Object.freeze({
          value:
            'private-collection',

          label:
            'Family or personal collection',

          shortLabel:
            'Family & personal'
        }),

        Object.freeze({
          value:
            'other',

          label:
            'Other source',

          shortLabel:
            'Other'
        })
      ]);

    const SOURCE_CATEGORY_BY_VALUE =
      new Map(
        SOURCE_CATEGORIES.map(
          category => [
            category.value,
            category
          ]
        )
      );

    function sourceCategoryLabel(
      value,
      fallback =
        'Not categorized'
    ) {
      return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.label
        || fallback;
    }

    function localizedSourceCategoryLabel(
      value,
      fallback =
        'Not categorized'
    ) {
      const label =
        sourceCategoryLabel(
          value,
          fallback
        );

      return label
        ? translateText(label)
        : '';
    }

    sampleData.sources = [
      {
        id:
          'as1',

        projectId:
          'p1',

        title:
          'Pawford County Archive — parish and household registers',

        category:
          'institution',

        providedBy:
          'Pawford County Archive',

        location:
          'North Yorkshire, England',

        reference:
          'Register collection 12 / household series 3',

        url:
          '',

        accessedDate:
          '2026-05-24',

        notes:
          'County archive material used for Pawford household and parish research.',

        favorite:
          true,

        createdAt:
          '2026-01-04T10:00:00Z',

        updatedAt:
          '2026-06-02T10:00:00Z'
      },

      {
        id:
          'as2',

        projectId:
          'p1',

        title:
          'Pawford household register continuation, 1947–1952',

        category:
          'institution',

        providedBy:
          'Pawford County Archive',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Household series 3, continuation volume',

        url:
          '',

        accessedDate:
          '2026-05-28',

        notes:
          'Continuation volume for Pawford household entries after 1946.',

        favorite:
          false,

        createdAt:
          '2026-02-01T10:00:00Z',

        updatedAt:
          '2026-05-28T10:00:00Z'
      },

      {
        id:
          'as3',

        projectId:
          'p1',

        title:
          'Meowbridge marriage certificate held in family documents',

        category:
          'private-collection',

        providedBy:
          'Whiskerfield family documents',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Certificate folder, item 2',

        url:
          '',

        accessedDate:
          '',

        notes:
          'Original certificate scan retained by the family.',

        favorite:
          true,

        createdAt:
          '2026-03-01T10:00:00Z',

        updatedAt:
          '2026-05-19T10:00:00Z'
      },

      {
        id:
          'as4',

        projectId:
          'p1',

        title:
          'Interview with Luna Purrington, 2 April 2026',

        category:
          'person',

        providedBy:
          'Luna Purrington',

        location:
          'Online interview',

        reference:
          'Audio interview 2026-04-02',

        url:
          '',

        accessedDate:
          '2026-04-02',

        notes:
          'Recorded family-history interview covering stories from 1940 to 1990.',

        favorite:
          false,

        createdAt:
          '2026-04-02T10:00:00Z',

        updatedAt:
          '2026-04-05T10:00:00Z'
      },

      {
        id:
          'as5',

        projectId:
          'p1',

        title:
          'Whiskerfield family reference collection',

        category:
          'private-collection',

        providedBy:
          'Silver Whiskerfield',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Reference box A',

        url:
          '',

        accessedDate:
          '',

        notes:
          'Mixed family reference material, clippings, and album documentation.',

        favorite:
          false,

        createdAt:
          '2026-03-20T10:00:00Z',

        updatedAt:
          '2026-03-29T10:00:00Z'
      },

      {
        id:
          'as6',

        projectId:
          'p1',

        title:
          'Regional genealogy database — Pawford records',

        category:
          'online',

        providedBy:
          'Regional genealogy database',

        location:
          '',

        reference:
          'Pawford record collection, 1900–1950',

        url:
          'https://example.org/pawford-records',

        accessedDate:
          '2026-06-01',

        notes:
          'Online index and document extracts for the Pawford area.',

        favorite:
          false,

        createdAt:
          '2026-06-01T10:00:00Z',

        updatedAt:
          '2026-06-01T10:00:00Z'
      }
    ];

    function sourceCategoryShortLabel(
      value,
      fallback =
        'Not categorized'
    ) {
      return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.shortLabel
        || fallback;
    }

    function localizedSourceCategoryShortLabel(
      value,
      fallback =
        'Not categorized'
    ) {
      const label =
        sourceCategoryShortLabel(
          value,
          fallback
        );

      return label
        ? translateText(label)
        : '';
    }

    const archiveMarriageEventId =
      (sampleData.events || []).find(event =>
        event.type === 'marriage'
        && (event.personIds || []).includes('barnaby')
        && (event.personIds || []).includes('luna')
      )?.id || '';

    sampleData.archiveFiles = [
      {
        id: 'af1', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_register_1946.pdf', kind: 'pdf', type: 'PDF document', mimeType: 'application/pdf', size: '3.2 MB', sizeBytes: 3355443,
        favorite: true, description: 'Household register extract supporting Daisy Milkpaw’s birth and household context.',
        documentDate: { type: 'Exact date', value: '1946' }, linkedPersonIds: ['daisy'], linkedEventIds: ['event-daisy-birth'], linkedNoteIds: [], linkedPlaceIds: ['place-old-cattery'], placeIds: ['place-old-cattery'],
        addedAt: '2026-06-02T09:20:00Z', updatedAt: '2026-06-02T09:20:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
      },
      {
        id: 'af2', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_1940_scan.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '4.8 MB', sizeBytes: 5033165,
        favorite: false, description: 'Household scan that may connect members of the Whiskerfield family in Pawford.',
        documentDate: { type: 'Exact date', value: '1940' }, linkedPersonIds: ['barnaby'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'], 
        addedAt: '2026-06-02T08:40:00Z', updatedAt: '2026-06-02T08:40:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
      },
      {
        id: 'af3', projectId: 'p1', folderId: 'delo44', name: 'index_page_044_12.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '1.7 MB', sizeBytes: 1782579,
        favorite: false, description: 'Index page from the Pawford register collection.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], 
        addedAt: '2026-06-01T14:10:00Z', updatedAt: '2026-06-01T14:10:00Z', added: 'Jun 1, 2026', updated: 'Jun 1, 2026'
      },
      {
        id: 'af4', projectId: 'p1', folderId: 'delo45', name: 'family_register_1951.pdf', kind: 'pdf', type: 'PDF document', mimeType: 'application/pdf', size: '5.1 MB', sizeBytes: 5347738,
        favorite: false, description: 'Continuation register containing entries connected to Luna Purrington’s family.',
        documentDate: { type: 'Exact date', value: '1951' }, linkedPersonIds: ['luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'], 
        addedAt: '2026-05-28T12:00:00Z', updatedAt: '2026-05-28T12:00:00Z', added: 'May 28, 2026', updated: 'May 28, 2026'
      },
      {
        id: 'af5', projectId: 'p1', folderId: 'certificates', name: 'meowbridge_marriage_record.pdf', kind: 'pdf', type: 'PDF document', mimeType: 'application/pdf', size: '2.1 MB', sizeBytes: 2202009,
        favorite: true, description: 'Marriage certificate linked to the family relationship and Meowbridge.',
        documentDate: { type: 'Exact date', value: '1989' }, linkedPersonIds: ['barnaby', 'luna'], linkedEventIds: archiveMarriageEventId ? [archiveMarriageEventId] : [], linkedNoteIds: [], linkedPlaceIds: ['place-meowbridge'], placeIds: ['place-meowbridge'], 
        addedAt: '2026-05-19T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z', added: 'May 19, 2026', updated: 'May 19, 2026'
      },
      {
        id: 'af6', projectId: 'p1', folderId: 'interviews', name: 'luna_family_memories_2026_04_02.mp3', kind: 'audio', type: 'Audio', mimeType: 'audio/mpeg', size: '28 MB', sizeBytes: 29360128,
        favorite: true, description: 'Recorded oral-history interview with Luna Purrington.',
        documentDate: { type: 'Exact date', value: '2 Apr 2026' }, linkedPersonIds: ['luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], 
        addedAt: '2026-04-03T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z', added: 'Apr 3, 2026', updated: 'Apr 5, 2026'
      },
      {
        id: 'af7', projectId: 'p1', folderId: 'albums-origin', name: 'whiskerfield_family_reference_cover.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '2.6 MB', sizeBytes: 2726298,
        favorite: false, description: 'Reference image stored in Archive; it is not duplicated into Albums.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: ['silver'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], 
        addedAt: '2026-03-29T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z', added: 'Mar 29, 2026', updated: 'Mar 29, 2026'
      },
      {
        id: 'af8', projectId: 'p1', folderId: 'unsorted', name: 'scan_0007_unknown_record.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '1.9 MB', sizeBytes: 1992294,
        favorite: false, description: 'Unidentified scan retained for later organization.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [],
        addedAt: '2026-06-02T11:00:00Z', updatedAt: '2026-06-02T11:00:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
      },
      {
        id: 'af9', projectId: 'p1', folderId: 'inbox', name: 'online_extract_pawford_records.pdf', kind: 'pdf', type: 'PDF document', mimeType: 'application/pdf', size: '900 KB', sizeBytes: 921600,
        favorite: false, description: 'Downloaded extract from the regional Pawford records database.',
        documentDate: { type: 'Between', value: '1900–1950' }, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'], 
        addedAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z', added: 'Jun 1, 2026', updated: 'Jun 1, 2026'
      }
    ];

    sampleData.archiveFiles.forEach(file => {
      const place =
        archiveDocumentPlace(
          file
        );

      archiveApplyDocumentPlace(
        file,
        place.placeId,
        place.placeText
      );
    });

    sampleData.archiveImports = [];
    sampleData.archiveIssues = [];

    function archiveFolderById(id, projectId = currentProjectId()) {
      if (!id || !projectId) return null;
      return (sampleData.archiveFolders || []).find(folder =>
        folder.id === id
        && folder.projectId === projectId
      ) || null;
    }

    function archiveFileById(id, projectId = currentProjectId()) {
      if (!id || !projectId) return null;
      return (sampleData.archiveFiles || []).find(file =>
        file.id === id
        && file.projectId === projectId
      ) || null;
    }

    function archiveSourceById(id, projectId = currentProjectId()) {
      if (!id || !projectId) return null;
      return (sampleData.sources || []).find(source =>
        source.id === id
        && source.projectId === projectId
      ) || null;
    }

    const SOURCE_LINK_TARGET_TYPES =
      Object.freeze([
        'file',
        'photo',
        'person',
        'event',
        'note',
        'place'
      ]);

    function sourceTargetRecord(
      targetType,
      targetId,
      projectId =
        currentProjectId()
    ) {
      if (
        !SOURCE_LINK_TARGET_TYPES.includes(
          targetType
        )
        || !targetId
      ) {
        return null;
      }

      let record =
        null;

      if (targetType === 'file') {
        record =
          archiveFileById(
            targetId,
            projectId
          );
      } else if (
        targetType === 'photo'
      ) {
        record =
          getPhoto(
            targetId,
            {
              projectId
            }
          );
      } else if (
        targetType === 'person'
      ) {
        record =
          getPerson(
            targetId
          );
      } else if (
        targetType === 'event'
      ) {
        record =
          (
            sampleData.events || []
          ).find(event =>
            event.id === targetId
          )
          || null;
      } else if (
        targetType === 'note'
      ) {
        record =
          getNote(
            targetId,
            {
              projectId,
              includeArchived:
                true
            }
          );
      } else if (
        targetType === 'place'
      ) {
        record =
          getPlace(
            targetId
          );
      }

      if (
        !record
        || (
          projectId
          && record.projectId
          && record.projectId
            !== projectId
        )
      ) {
        return null;
      }

      return record;
    }

    function sourceLinksForProject(
      projectId =
        currentProjectId()
    ) {
      return (
        sampleData.sourceLinks || []
      ).filter(link =>
        !projectId
        || link.projectId
          === projectId
      );
    }

    function sourceLinksForSource(
      sourceId,
      targetType = '',
      projectId =
        currentProjectId()
    ) {
      return sourceLinksForProject(
        projectId
      ).filter(link =>
        link.sourceId === sourceId
        && (
          !targetType
          || link.targetType
            === targetType
        )
      );
    }

    function sourceLinksForTarget(
      targetType,
      targetId,
      projectId =
        currentProjectId()
    ) {
      return sourceLinksForProject(
        projectId
      ).filter(link =>
        link.targetType === targetType
        && link.targetId === targetId
      );
    }

    function sourceTargetIds(
      sourceId,
      targetType,
      projectId =
        currentProjectId()
    ) {
      return archiveUniqueIds(
        sourceLinksForSource(
          sourceId,
          targetType,
          projectId
        ).map(link =>
          link.targetId
        )
      );
    }

    function sourceIdsForTarget(
      targetType,
      targetId,
      projectId =
        currentProjectId()
    ) {
      return archiveUniqueIds(
        sourceLinksForTarget(
          targetType,
          targetId,
          projectId
        ).map(link =>
          link.sourceId
        )
      );
    }

    function connectedSourceTargetLabel(
      targetType,
      target
    ) {
      if (!target) {
        return 'record';
      }

      if (targetType === 'person') {
        return (
          personResourceDisplayName(target)
          || target.name
          || 'person'
        );
      }

      if (targetType === 'photo') {
        return (
          target.title
          || target.filename
          || 'photo'
        );
      }

      if (targetType === 'file') {
        return (
          target.name
          || target.title
          || 'file'
        );
      }

      if (targetType === 'event') {
        return (
          target.title
          || target.typeLabel
          || target.type
          || 'event'
        );
      }

      if (targetType === 'note') {
        return (
          target.title
          || 'note'
        );
      }

      if (targetType === 'place') {
        return (
          placeDisplayText(target)
          || target.name
          || 'place'
        );
      }

      return (
        target.title
        || target.name
        || 'record'
      );
    }

    function currentArchiveSourceTargetFilter() {
      const filter =
        state.archiveSourceTargetFilter;

      if (
        !filter
        || !SOURCE_LINK_TARGET_TYPES.includes(
          filter.targetType
        )
        || !filter.targetId
        || filter.projectId
          !== currentProjectId()
      ) {
        return null;
      }

      const target =
        sourceTargetRecord(
          filter.targetType,
          filter.targetId,
          filter.projectId
        );

      return target
        ? {
            ...filter,
            target
          }
        : null;
    }

    function openArchiveSourcesForTarget({
      targetType,
      targetId,
      projectId =
        currentProjectId()
    }) {
      const target =
        sourceTargetRecord(
          targetType,
          targetId,
          projectId
        );

      if (!target) {
        showToast(
          'The connected record is no longer available.'
        );

        return;
      }

      const sourceIds =
        sourceIdsForTarget(
          targetType,
          targetId,
          projectId
        );

      const activated =
        activateProject(
          projectId,
          {
            moduleName:
              'Archive',

            renderNow:
              false,

            reset:
              false
          }
        );

      if (!activated) {
        return;
      }

      state.archiveView =
        'sources';

      state.archiveSearch =
        '';

      state.archiveSourceCategoryFilter =
        'all';

      state.archiveSourceConnectionFilter =
        'all';

      state.archiveSourceFavouriteOnly =
        false;

      state.archiveSourceTargetFilter = {
        targetType,
        targetId,
        projectId
      };

      state.archiveSelectedSourceId =
        sourceIds[0]
        || null;

      state.archiveSelectedFileId =
        null;

      state.archiveSelectedFileIds =
        [];

      state.archiveInspectorCollapsed =
        false;

      render();
    }

    function setSourceIdsForTarget(
      targetType,
      targetId,
      nextSourceIds,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const target =
        sourceTargetRecord(
          targetType,
          targetId,
          projectId
        );

      if (!target) {
        return null;
      }

      const targetProjectId =
        target.projectId
        || projectId;

      const normalizedSourceIds =
        archiveUniqueIds(
          nextSourceIds
        );

      const sources =
        normalizedSourceIds.map(
          sourceId =>
            archiveSourceById(
              sourceId,
              targetProjectId
            )
        );

      if (
        sources.some(source =>
          !source
        )
      ) {
        return null;
      }

      const desiredIds =
        new Set(
          normalizedSourceIds
        );

      const currentLinks =
        sourceLinksForTarget(
          targetType,
          targetId,
          targetProjectId
        );

      const affectedSourceIds =
        new Set([
          ...currentLinks.map(link =>
            link.sourceId
          ),
          ...normalizedSourceIds
        ]);

      sampleData.sourceLinks =
        (
          sampleData.sourceLinks || []
        ).filter(link => {
          const sameTarget =
            link.projectId
              === targetProjectId
            && link.targetType
              === targetType
            && link.targetId
              === targetId;

          return (
            !sameTarget
            || desiredIds.has(
              link.sourceId
            )
          );
        });

      const retainedIds =
        new Set(
          sourceIdsForTarget(
            targetType,
            targetId,
            targetProjectId
          )
        );

      normalizedSourceIds.forEach(
        sourceId => {
          if (
            retainedIds.has(
              sourceId
            )
          ) {
            return;
          }

          sampleData.sourceLinks.push({
            id:
              createRuntimeId(
                'source-link'
              ),

            projectId:
              targetProjectId,

            sourceId,
            targetType,
            targetId
          });
        }
      );

      const now =
        new Date().toISOString();

      affectedSourceIds.forEach(
        sourceId => {
          const source =
            archiveSourceById(
              sourceId,
              targetProjectId
            );

          if (source) {
            source.updatedAt =
              now;
          }
        }
      );

      target.updatedAt =
        now;

      if (targetType === 'file') {
        target.updated =
          'Just now';
      }

      return sourceIdsForTarget(
        targetType,
        targetId,
        targetProjectId
      );
    }

    function setSourceLink(
      sourceId,
      targetType,
      targetId,
      shouldLink = true,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const currentIds =
        sourceIdsForTarget(
          targetType,
          targetId,
          projectId
        );

      const nextIds =
        shouldLink
          ? archiveUniqueIds([
              ...currentIds,
              sourceId
            ])
          : currentIds.filter(id =>
              id !== sourceId
            );

      const savedIds =
        setSourceIdsForTarget(
          targetType,
          targetId,
          nextIds,
          {
            projectId
          }
        );

      if (!savedIds) {
        return false;
      }

      return shouldLink
        ? savedIds.includes(
            sourceId
          )
        : !savedIds.includes(
            sourceId
          );
    }

    function sourcesForTarget(
      targetType,
      targetId,
      projectId =
        currentProjectId()
    ) {
      if (
        !sourceTargetRecord(
          targetType,
          targetId,
          projectId
        )
      ) {
        return [];
      }

      return sourceIdsForTarget(
        targetType,
        targetId,
        projectId
      )
        .map(sourceId =>
          archiveSourceById(
            sourceId,
            projectId
          )
        )
        .filter(Boolean);
    }

    function connectedSourceMeta(
      source
    ) {
      return [
        localizedSourceCategoryLabel(
          source?.category,
          ''
        ),

        source?.providedBy,

        source?.reference
      ]
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
        || 'Source record';
    }

    function connectedSourceOrigin(
      source
    ) {
      return String(
        source?.providedBy
        || source?.location
        || ''
      ).trim()
      || 'Origin not specified';
    }

    function connectedSourceDetailMeta(
      source
    ) {
      const category =
        localizedSourceCategoryLabel(
          source?.category,
          ''
        );

      const reference =
        String(
          source?.reference
          || ''
        ).trim();

      const accessed =
        source?.accessedDate
          ? `Accessed ${
              archiveFormatDate(
                source.accessedDate
              )
            }`
          : '';

      return [
        category,

        /*
          Where-found information is more useful in
          a connected item than the accessed date.
          Use the date only as a fallback.
        */
        reference || accessed
      ]
        .filter(Boolean)
        .join(' · ')
        || 'Source record';
    }

    function openConnectedSource(
      sourceId,
      projectId =
        currentProjectId()
    ) {
      const source =
        archiveSourceById(
          sourceId,
          projectId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      if (
        state.activeModule === 'Archive'
        && typeof archiveRememberCurrentLocation
          === 'function'
      ) {
        archiveRememberCurrentLocation();
      }

      state.activeModule =
        'Archive';

      state.archiveView =
        'sources';

      state.archiveSearch =
        '';

      state.archiveSourceCategoryFilter =
        'all';

      state.archiveSourceConnectionFilter =
        'all';

      state.archiveSourceFavouriteOnly =
        false;

      state.archiveSelectedSourceId =
        source.id;

      state.archiveInspectorCollapsed =
        false;

      state.archiveSelectedFileIds =
        [];

      render();
    }
        function renderConnectedSourceList({
      targetType,
      targetId,

      projectId =
        currentProjectId(),

      sources =
        sourcesForTarget(
          targetType,
          targetId,
          projectId
        ),

      emptyText =
        'No sources linked.',

      readOnly =
        false
    }) {
      const validSources =
        (
          Array.isArray(sources)
            ? sources
            : []
        ).filter(Boolean);

      const visibleSources =
        validSources.slice(0, 4);

      if (!visibleSources.length) {
        return renderInspectorSectionEmpty(
          emptyText
        );
      }

      const sourceItems =
        visibleSources
          .map(source => {
            const title =
              source.title
              || 'Untitled source';

            const sourceProjectId =
              source.projectId
              || projectId;

            const origin =
              connectedSourceOrigin(
                source
              );

            const metadata =
              connectedSourceDetailMeta(
                source
              );

            const mainContent = `
              <span
                class="connected-source-icon"
                aria-hidden="true">

                <span
                  class="connected-source-icon-record">
                  ${icon.archive}
                </span>

                <span
                  class="connected-source-icon-link">
                  ${icon.link}
                </span>
              </span>

              <span class="connected-source-copy">
                <strong
                  class="connected-source-title"
                  title="${escapeHtml(title)}">

                  ${escapeHtml(title)}
                </strong>

                <span
                  class="connected-source-origin"
                  title="${escapeHtml(origin)}">

                  ${escapeHtml(origin)}
                </span>

                <span
                  class="connected-source-meta"
                  title="${escapeHtml(metadata)}">

                  ${escapeHtml(metadata)}
                </span>
              </span>
            `;

            return `
              <div
                class="
                  relation-row
                  connected-source-item
                ">

                ${
                  readOnly
                    ? `
                      <div
                        class="
                          relation-row-main
                          connected-source-main
                        ">

                        ${mainContent}
                      </div>
                    `
                    : `
                      <button
                        class="
                          relation-row-main
                          connected-source-main
                        "
                        type="button"
                        data-connected-source-open="${escapeHtml(
                          source.id
                        )}"
                        data-connected-source-project="${escapeHtml(
                          sourceProjectId
                        )}"
                        aria-label="Open source ${escapeHtml(
                          title
                        )}">

                        ${mainContent}
                      </button>
                    `
                }

                ${
                  readOnly
                    ? ''
                    : `
                      <div class="relation-actions">
                        <button
                          class="
                            relation-action-button
                            danger
                          "
                          type="button"
                          data-connected-source-unlink="${escapeHtml(
                            source.id
                          )}"
                          data-connected-source-target-type="${escapeHtml(
                            targetType
                          )}"
                          data-connected-source-target-id="${escapeHtml(
                            targetId
                          )}"
                          data-connected-source-project="${escapeHtml(
                            sourceProjectId
                          )}"
                          aria-label="Unlink ${escapeHtml(
                            title
                          )}"
                          title="Unlink source">

                          ${icon.unlink}
                        </button>
                      </div>
                    `
                }
              </div>
            `;
          })
          .join('');

      return `
        <div
          class="relationship-list connected-source-list"
          data-connected-source-list>
          ${sourceItems}
        </div>

        <div class="panel-section-footer">
          <button
            class="panel-section-view-all"
            type="button"
            data-connected-source-view-all
            data-connected-source-target-type="${escapeHtml(targetType)}"
            data-connected-source-target-id="${escapeHtml(targetId)}"
            data-connected-source-project="${escapeHtml(projectId)}"
            aria-label="View all ${validSources.length} sources">

            <span>View all sources</span>

            <span
              class="panel-section-view-all-icon"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </div>
      `;
    }

    function openConnectedSourceUnlinkConfirm({
      sourceId,
      targetType,
      targetId,
      projectId = currentProjectId(),
      onUnlinked = null
    }) {
      const source =
        archiveSourceById(sourceId, projectId);

      const target =
        sourceTargetRecord(
          targetType,
          targetId,
          projectId
        );

      if (!source || !target) {
        showToast(
          t('The source or connected record is no longer available.')
        );
        return;
      }

      const sourceLabel =
        source.title || t('Untitled source');

      const targetLabel =
        connectedSourceTargetLabel(targetType, target);

      const question = t(
        'Remove the connection between “{source}” and “{record}”?'
      ).replace(
        /\{source\}|\{record\}/g,
        token =>
          token === '{source}'
            ? sourceLabel
            : targetLabel
      );

      openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedSourceUnlinkTitle"
          aria-describedby="connectedSourceUnlinkQuestion">

          <div class="modal-header">
            <div>
              <h2 id="connectedSourceUnlinkTitle">
                ${escapeHtml(t('Unlink source?'))}
              </h2>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p id="connectedSourceUnlinkQuestion">
              ${escapeHtml(question)}
            </p>

            <div class="unlink-relationship-warning">
              <span>
                ${escapeHtml(t(
                  'Only this connection will be removed. Both records and their other connections will remain in the project.'
                ))}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(t('Cancel'))}
            </button>

            <button
              class="button danger"
              type="button"
              data-connected-source-confirm-unlink>
              ${escapeHtml(t('Unlink'))}
            </button>
          </div>
        </div>
      `);

      const confirmButton =
        modalBackdrop.querySelector(
          '[data-connected-source-confirm-unlink]'
        );

      confirmButton?.addEventListener('click', () => {
        // Recheck the records before committing the change.
        const currentSource =
          archiveSourceById(sourceId, projectId);

        const currentTarget =
          sourceTargetRecord(
            targetType,
            targetId,
            projectId
          );

        if (!currentSource || !currentTarget) {
          showToast(t(
            'The source or connected record is no longer available.'
          ));
          return;
        }

        confirmButton.disabled = true;

        const removed = setSourceLink(
          sourceId,
          targetType,
          targetId,
          false,
          { projectId }
        );

        if (!removed) {
          confirmButton.disabled = false;
          showToast(t(
            'The source link could not be removed.'
          ));
          return;
        }

        closeModal();

        if (typeof onUnlinked === 'function') {
          onUnlinked({
            sourceId,
            targetType,
            targetId,
            projectId
          });
        }

        showToast(t('Source unlinked.'));
      });
    }

    function bindConnectedSourceLinks(
      root,
      { onUnlinked = null } = {}
    ) {
      if (!root) {
        return;
      }

      root.querySelectorAll(
        '[data-connected-source-view-all]'
      ).forEach(button => {
        button.addEventListener('click', () => {
          openArchiveSourcesForTarget({
            targetType:
              button.dataset.connectedSourceTargetType,
            targetId:
              button.dataset.connectedSourceTargetId,
            projectId:
              button.dataset.connectedSourceProject
              || currentProjectId()
          });
        });
      });

      root.querySelectorAll(
        '[data-connected-source-open]'
      ).forEach(button => {
        button.addEventListener('click', () => {
          openConnectedSource(
            button.dataset.connectedSourceOpen,
            button.dataset.connectedSourceProject
              || currentProjectId()
          );
        });
      });

      root.querySelectorAll(
        '[data-connected-source-unlink]'
      ).forEach(button => {
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();

          openConnectedSourceUnlinkConfirm({
            sourceId:
              button.dataset.connectedSourceUnlink,
            targetType:
              button.dataset.connectedSourceTargetType,
            targetId:
              button.dataset.connectedSourceTargetId,
            projectId:
              button.dataset.connectedSourceProject
              || currentProjectId(),
            onUnlinked
          });
        });
      });
    }

    function openSourcesForTargetModal({
      targetType,
      targetId,

      projectId =
        currentProjectId(),

      title =
        'Add sources',

      subtitle =
        'Connect existing sources to this record.',

      afterSave =
        null
    }) {
      const target =
        sourceTargetRecord(
          targetType,
          targetId,
          projectId
        );

      if (!target) {
        showToast(
          'The connected record is no longer available.'
        );

        return;
      }

      const records =
        (sampleData.sources || [])
          .filter(source =>
            source.projectId
              === projectId
          )
          .slice()
          .sort((first, second) =>
            String(
              first.title || ''
            ).localeCompare(
              String(
                second.title || ''
              )
            )
          );

      const recordIds =
        new Set(
          records.map(source =>
            source.id
          )
        );

      /*
        Existing connections are protected by this
        additive modal. They are never removed here.
      */
      const existingIds =
        new Set(
          sourceIdsForTarget(
            targetType,
            targetId,
            projectId
          ).filter(sourceId =>
            recordIds.has(sourceId)
          )
        );

      /*
        Only newly selected sources belong here.
        Existing connections do not contribute to
        the footer count.
      */
      const selectedIds =
        new Set();

      let query = '';

      const normalizeQuery =
        value =>
          String(value || '')
            .trim()
            .toLocaleLowerCase(
              state.language === 'ru'
                ? 'ru'
                : 'en'
            );

      const sourceSearchText =
        source =>
          [
            source.title,
            source.providedBy,
            source.location,
            source.reference,
            localizedSourceCategoryLabel(
              source.category,
              ''
            ),
            source.notes
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              state.language === 'ru'
                ? 'ru'
                : 'en'
            );

      const visibleSources =
        () => {
          const normalized =
            normalizeQuery(query);

          return records
            .filter(source =>
              !selectedIds.has(
                source.id
              )
            )
            .filter(source => {
              if (normalized) {
                return sourceSearchText(
                  source
                ).includes(normalized);
              }

              /*
                Hide existing connections from the
                default suggestions. A direct search
                can still reveal them.
              */
              return !existingIds.has(
                source.id
              );
            });
        };

      const sourceCountText =
        count =>
          translateDynamicPhrase(
            `${count} ${
              count === 1
                ? 'source'
                : 'sources'
            }`
          );

      const renderChoice =
        source => {
          const sourceTitle =
            source.title
            || 'Untitled source';

          const alreadyLinked =
            existingIds.has(
              source.id
            );

          return `
            <label
              class="
                source-picker-choice
                ${
                  alreadyLinked
                    ? 'already-linked'
                    : ''
                }
              ">

              <span
                class="connected-source-icon"
                aria-hidden="true">

                <span
                  class="connected-source-icon-record">
                  ${icon.archive}
                </span>

                <span
                  class="connected-source-icon-link">
                  ${icon.link}
                </span>
              </span>

              <span
                class="source-picker-choice-copy">

                <strong
                  class="source-picker-choice-title"
                  title="${escapeHtml(
                    sourceTitle
                  )}">

                  ${escapeHtml(
                    sourceTitle
                  )}
                </strong>

                <span
                  class="source-picker-choice-origin">

                  ${escapeHtml(
                    connectedSourceOrigin(
                      source
                    )
                  )}
                </span>

                <span
                  class="source-picker-choice-meta">

                  ${escapeHtml(
                    connectedSourceDetailMeta(
                      source
                    )
                  )}
                </span>
              </span>

              ${
                alreadyLinked
                  ? `
                    <span
                      class="source-picker-choice-status">
                      Already linked
                    </span>
                  `
                  : ''
              }

              <input
                type="checkbox"
                value="${escapeHtml(
                  source.id
                )}"
                data-target-source-choice
                ${
                  alreadyLinked
                    ? 'checked disabled'
                    : ''
                }
                aria-label="${
                  alreadyLinked
                    ? `Already linked: ${escapeHtml(
                        sourceTitle
                      )}`
                    : `Select ${escapeHtml(
                        sourceTitle
                      )}`
                }">
            </label>
          `;
        };

      const renderSelectedSources =
        () => {
          const selectedSources =
            [...selectedIds]
              .map(sourceId =>
                records.find(source =>
                  source.id === sourceId
                )
              )
              .filter(Boolean)
              .sort((first, second) =>
                String(
                  first.title || ''
                ).localeCompare(
                  String(
                    second.title || ''
                  )
                )
              );

          if (!selectedSources.length) {
            return '';
          }

          return `
            <div
              class="notes-related-selected-head">
              <strong>
                Selected sources
              </strong>
            </div>

            <div
              class="source-picker-selected-list">

              ${selectedSources
                .map(source => {
                  const sourceTitle =
                    source.title
                    || 'Untitled source';

                  return `
                    <div
                      class="source-picker-selected-row">

                      <span
                        title="${escapeHtml(
                          sourceTitle
                        )}">
                        ${escapeHtml(
                          sourceTitle
                        )}
                      </span>

                      <button
                        class="relation-action-button"
                        type="button"
                        data-target-source-remove="${escapeHtml(
                          source.id
                        )}"
                        aria-label="Remove ${escapeHtml(
                          sourceTitle
                        )} from selection"
                        title="Remove from selection">

                        ${icon.close}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `;
        };

      const renderEmptyState =
        () => {
          const normalized =
            normalizeQuery(query);

          if (!records.length) {
            return `
              <div class="notes-related-empty">
                <strong>
                  No sources available
                </strong>

                <span>
                  Create a source first, then return
                  here to link it.
                </span>
              </div>
            `;
          }

          if (normalized) {
            return `
              <div class="notes-related-empty">
                <strong>
                  No sources match this search
                </strong>

                <span>
                  Try another source name, origin,
                  location, or reference.
                </span>

                <button
                  class="button secondary"
                  type="button"
                  data-target-source-clear-search>
                  Clear search
                </button>
              </div>
            `;
          }

          const unlinkedSources =
            records.filter(source =>
              !existingIds.has(
                source.id
              )
            );

          if (!unlinkedSources.length) {
            return `
              <div class="notes-related-empty">
                <strong>
                  All available sources are linked
                </strong>

                <span>
                  No additional sources are available
                  for this item.
                </span>
              </div>
            `;
          }

          if (
            unlinkedSources.every(source =>
              selectedIds.has(
                source.id
              )
            )
          ) {
            return `
              <div class="notes-related-empty">
                <strong>
                  All available sources are selected
                </strong>

                <span>
                  Every unlinked source is already in
                  the current selection.
                </span>
              </div>
            `;
          }

          return `
            <div class="notes-related-empty">
              <strong>
                No sources available
              </strong>
            </div>
          `;
        };

      openModal(`
        <div
          class="
            modal
            notes-related-modal
            target-source-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="targetSourcesModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="targetSourcesModalTitle">
                ${escapeHtml(title)}
              </h2>

              <p>
                ${escapeHtml(subtitle)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close source picker">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              notes-related-modal-body
            ">

            <section
              class="notes-related-picker-view">

              <div
                class="notes-related-toolbar">

                <label
                  class="app-search-field"
                  aria-label="Search sources">

                  ${icon.search}

                  <input
                    type="search"
                    autocomplete="off"
                    data-target-source-search
                    placeholder="Search sources...">
                </label>

                <button
                  class="button secondary"
                  type="button"
                  data-target-source-create>

                  ${icon.plus}
                  Create source
                </button>
              </div>

              <section
                class="
                  notes-related-selected-panel
                  target-source-selected-panel
                "
                data-target-source-selected
                hidden>
              </section>

              <section
                class="notes-related-results-panel">

                <div
                  class="notes-related-results-head">

                  <div>
                    <strong
                      data-target-source-results-title>
                      Suggested sources
                    </strong>

                    <span
                      data-target-source-results-meta>
                    </span>
                  </div>
                </div>

                <div
                  class="
                    notes-related-results
                    source-picker-results
                  "
                  data-target-source-results>
                </div>
              </section>
            </section>
          </div>

          <div
            class="
              modal-footer
              notes-related-footer
            ">

            <span
              class="notes-related-selection-count"
              data-target-source-count
              aria-live="polite">
              0 sources selected
            </span>

            <div
              class="notes-related-footer-actions">

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-target-source-save
                disabled>
                Add sources
              </button>
            </div>
          </div>
        </div>
      `);

      const modal =
        modalBackdrop.querySelector(
          '.target-source-picker-modal'
        );

      if (!modal) {
        return;
      }

      const searchInput =
        modal.querySelector(
          '[data-target-source-search]'
        );

      const selectedHost =
        modal.querySelector(
          '[data-target-source-selected]'
        );

      const resultsHost =
        modal.querySelector(
          '[data-target-source-results]'
        );

      const resultsTitle =
        modal.querySelector(
          '[data-target-source-results-title]'
        );

      const resultsMeta =
        modal.querySelector(
          '[data-target-source-results-meta]'
        );

      const countElement =
        modal.querySelector(
          '[data-target-source-count]'
        );

      const saveButton =
        modal.querySelector(
          '[data-target-source-save]'
        );

      const refresh =
        () => {
          const visible =
            visibleSources();

          const normalized =
            normalizeQuery(query);

          resultsTitle.textContent =
            t(
              normalized
                ? 'Search results'
                : 'Suggested sources'
            );

          const availableCount =
            visible.filter(source =>
              !existingIds.has(
                source.id
              )
            ).length;

          resultsMeta.textContent =
            state.language === 'ru'
              ? `Доступно: ${
                  sourceCountText(
                    availableCount
                  )
                } · Уже связано: ${
                  sourceCountText(
                    existingIds.size
                  )
                }`
              : `${
                  sourceCountText(
                    availableCount
                  )
                } available · ${
                  sourceCountText(
                    existingIds.size
                  )
                } already linked`;

          resultsHost.innerHTML =
            visible.length
              ? visible
                  .map(renderChoice)
                  .join('')
              : renderEmptyState();

          const selectedHtml =
            renderSelectedSources();

          selectedHost.hidden =
            !selectedHtml;

          selectedHost.innerHTML =
            selectedHtml;

          const selectedCount =
            selectedIds.size;

          countElement.textContent =
            `${selectedCount} ${
              selectedCount === 1
                ? 'source'
                : 'sources'
            } selected`;

          saveButton.disabled =
            selectedCount === 0;

          saveButton.textContent =
            selectedCount === 0
              ? t('Add sources')
              : selectedCount === 1
                ? t('Add source')
                : state.language === 'ru'
                  ? `Добавить ${
                      sourceCountText(
                        selectedCount
                      )
                    }`
                  : `Add ${
                      sourceCountText(
                        selectedCount
                      )
                    }`;

          localizeUI(
            modal,
            {
              suppressObserverReplay:
                true
            }
          );
        };

      searchInput.addEventListener(
        'input',
        event => {
          query =
            event.currentTarget.value;

          refresh();
        }
      );

      modal.addEventListener(
        'change',
        event => {
          const input =
            event.target.closest(
              '[data-target-source-choice]'
            );

          if (
            !input
            || input.disabled
          ) {
            return;
          }

          if (input.checked) {
            selectedIds.add(
              input.value
            );
          } else {
            selectedIds.delete(
              input.value
            );
          }

          refresh();
        }
      );

      modal.addEventListener(
        'click',
        event => {
          const removeButton =
            event.target.closest(
              '[data-target-source-remove]'
            );

          if (removeButton) {
            selectedIds.delete(
              removeButton.dataset
                .targetSourceRemove
            );

            refresh();
            return;
          }

          const clearButton =
            event.target.closest(
              '[data-target-source-clear-search]'
            );

          if (clearButton) {
            query = '';
            searchInput.value = '';

            refresh();

            searchInput.focus({
              preventScroll: true
            });
          }
        }
      );

      saveButton.addEventListener(
        'click',
        () => {
          if (!selectedIds.size) {
            return;
          }

          const nextSourceIds =
            archiveUniqueIds([
              ...existingIds,
              ...selectedIds
            ]);

          const savedIds =
            setSourceIdsForTarget(
              targetType,
              targetId,
              nextSourceIds,
              {
                projectId
              }
            );

          const savedSet =
            new Set(
              savedIds || []
            );

          const savedCorrectly =
            Array.isArray(savedIds)
            && nextSourceIds.every(
              sourceId =>
                savedSet.has(
                  sourceId
                )
            );

          if (!savedCorrectly) {
            showToast(
              'Source links could not be updated.'
            );

            return;
          }

          closeModal();

          if (
            typeof afterSave
              === 'function'
          ) {
            afterSave();
          }

          showToast(
            'Source links updated.'
          );
        }
      );

      modal
        .querySelector(
          '[data-target-source-create]'
        )
        .addEventListener(
          'click',
          () => {
            const pendingSourceIds =
              [...selectedIds];

            closeModal();

            openArchiveSourceModal(
              '',
              {
                onCreated:
                  createdSource => {
                    const nextSourceIds =
                      archiveUniqueIds([
                        ...existingIds,
                        ...pendingSourceIds,
                        createdSource.id
                      ]);

                    const savedIds =
                      setSourceIdsForTarget(
                        targetType,
                        targetId,
                        nextSourceIds,
                        {
                          projectId
                        }
                      );

                    const savedSet =
                      new Set(
                        savedIds || []
                      );

                    const savedCorrectly =
                      Array.isArray(
                        savedIds
                      )
                      && nextSourceIds.every(
                        sourceId =>
                          savedSet.has(
                            sourceId
                          )
                      );

                    if (!savedCorrectly) {
                      showToast(
                        'Source created, but it could not be linked.'
                      );

                      return;
                    }

                    if (
                      typeof afterSave
                        === 'function'
                    ) {
                      afterSave();
                    }

                    showToast(
                      'Source created and linked.'
                    );
                  }
              }
            );
          }
        );

      refresh();

      requestAnimationFrame(() => {
        searchInput.focus({
          preventScroll: true
        });
      });
    }

    function removeSourceLinksForSource(
      sourceId
    ) {
      sampleData.sourceLinks =
        (
          sampleData.sourceLinks || []
        ).filter(link =>
          link.sourceId !== sourceId
        );
    }

    function removeSourceLinksForTarget(
      targetType,
      targetId
    ) {
      sampleData.sourceLinks =
        (
          sampleData.sourceLinks || []
        ).filter(link =>
          !(
            link.targetType
              === targetType
            && link.targetId
              === targetId
          )
        );
    }

    function removeSourceLinksForTargets(
      targetType,
      targetIds
    ) {
      const ids =
        new Set(
          targetIds || []
        );

      sampleData.sourceLinks =
        (
          sampleData.sourceLinks || []
        ).filter(link =>
          !(
            link.targetType
              === targetType
            && ids.has(
              link.targetId
            )
          )
        );
    }

    function pruneInvalidSourceLinks() {
      const seen =
        new Set();

      sampleData.sourceLinks =
        (
          sampleData.sourceLinks || []
        ).filter(link => {
          if (
            !link
            || !link.id
            || !link.projectId
            || !link.sourceId
            || !link.targetId
            || !SOURCE_LINK_TARGET_TYPES
              .includes(
                link.targetType
              )
          ) {
            return false;
          }

          const source =
            archiveSourceById(
              link.sourceId,
              link.projectId
            );

          const target =
            sourceTargetRecord(
              link.targetType,
              link.targetId,
              link.projectId
            );

          const key =
            [
              link.projectId,
              link.sourceId,
              link.targetType,
              link.targetId
            ].join('|');

          if (
            !source
            || !target
            || seen.has(key)
          ) {
            return false;
          }

          seen.add(
            key
          );

          return true;
        });
    }

    const ARCHIVE_ROOT_PICKER_VALUE =
      '__archive_root__';

    const ARCHIVE_ROOT_LABEL =
      'All files';

    const ARCHIVE_MOVE_NO_DESTINATION =
      '__archive_move_no_destination__';

    function archiveMoveHasDestination(
      folderId
    ) {
      return folderId
        !== ARCHIVE_MOVE_NO_DESTINATION;
    }

    function archiveIsRootLocation(
      folderId
    ) {
      return (
        folderId === null
        || folderId === undefined
        || folderId === ''
      );
    }

    function archiveNormalizeFolderId(
      folderId
    ) {
      if (
        archiveIsRootLocation(
          folderId
        )
      ) {
        return null;
      }

      return archiveFolderById(
        folderId
      )?.id
      || null;
    }

    function archiveFileFolderId(
      file
    ) {
      return archiveNormalizeFolderId(
        file?.folderId
      );
    }

    function archiveFolderParentId(
      folder
    ) {
      if (!folder) {
        return null;
      }

      return archiveNormalizeFolderId(
        folder.parentId
        ?? folder.parent
        ?? null
      );
    }

    function archiveFolderChildren(
      folderId = null
    ) {
      const rootLocation =
        archiveIsRootLocation(
          folderId
        );

      if (
        !rootLocation
        && !archiveFolderById(
          folderId
        )
      ) {
        return [];
      }

      const parentId =
        rootLocation
          ? null
          : folderId;

      return (
        sampleData.archiveFolders
        || []
      )
        .filter(folder =>
          folder.projectId === currentProjectId()
          &&
          archiveFolderParentId(
            folder
          ) === parentId
        )
        .sort((a, b) =>
          String(
            a.name || ''
          ).localeCompare(
            String(
              b.name || ''
            )
          )
        );
    }

    function archiveFolderAncestors(
      folderId
    ) {
      if (
        archiveIsRootLocation(
          folderId
        )
      ) {
        return [];
      }

      const result = [];
      const seen =
        new Set();

      let current =
        archiveFolderById(
          folderId
        );

      while (
        current
        && !seen.has(
          current.id
        )
      ) {
        result.unshift(
          current
        );

        seen.add(
          current.id
        );

        current =
          archiveFolderById(
            archiveFolderParentId(
              current
            )
          );
      }

      return result;
    }

    function archiveFolderPath(
      folderId
    ) {
      const folders =
        archiveFolderAncestors(
          folderId
        );

      if (!folders.length) {
        return ARCHIVE_ROOT_LABEL;
      }

      return folders
        .map(folder =>
          folder.name
        )
        .join(' / ');
    }

    /*
      Returns every physical folder inside a
      location. At the virtual root, null is also
      included so root-level files belong to the
      scope.
    */

    function archiveFolderScopeIds(
      folderId
    ) {
      const ids =
        new Set();

      const visit =
        id => {
          ids.add(
            id
          );

          archiveFolderChildren(
            id
          ).forEach(child =>
            visit(
              child.id
            )
          );
        };

      if (
        archiveIsRootLocation(
          folderId
        )
      ) {
        ids.add(
          null
        );

        archiveFolderChildren(
          null
        ).forEach(child =>
          visit(
            child.id
          )
        );

        return ids;
      }

      const normalizedId =
        archiveNormalizeFolderId(
          folderId
        );

      if (normalizedId) {
        visit(
          normalizedId
        );
      }

      return ids;
    }

    /*
      This helper is for real-folder operations
      such as delete and move. The virtual root is
      deliberately excluded.
    */

    function archiveFolderDescendantIds(
      folderId,
      {
        includeSelf =
          true
      } = {}
    ) {
      const folder =
        archiveFolderById(
          folderId
        );

      if (!folder) {
        return [];
      }

      const ids = [];

      const visit =
        id => {
          if (
            !ids.includes(
              id
            )
          ) {
            ids.push(
              id
            );
          }

          archiveFolderChildren(
            id
          ).forEach(child =>
            visit(
              child.id
            )
          );
        };

      visit(
        folder.id
      );

      return includeSelf
        ? ids
        : ids.filter(
            id =>
              id !== folder.id
          );
    }

    function archiveFlattenFolders(
      parentId = null,
      depth = 0
    ) {
      return archiveFolderChildren(
        parentId
      )
        .flatMap(folder => [
          {
            folder,
            depth
          },

          ...archiveFlattenFolders(
            folder.id,
            depth + 1
          )
        ]);
    }

    function archiveFolderImpact(
      folderId
    ) {
      const folder =
        archiveFolderById(
          folderId
        );

      if (!folder) {
        return {
          folderIds:
            [],

          folders:
            0,

          files:
            0
        };
      }

      const descendantIds =
        new Set(
          archiveFolderDescendantIds(
            folder.id
          )
        );

      return {
        folderIds:
          [
            ...descendantIds
          ],

        folders:
          Math.max(
            0,
            descendantIds.size - 1
          ),

        files:
          archiveProjectFiles()
            .filter(file =>
              descendantIds.has(
                archiveFileFolderId(
                  file
                )
              )
            )
            .length
      };
    }

    function archiveFolderIdFromChoice(
      value
    ) {
      return value
        === ARCHIVE_ROOT_PICKER_VALUE
          ? null
          : archiveNormalizeFolderId(
              value
            );
    }

    const defaultArchiveFileFilters =
      Object.freeze({
        scope: 'all',
        fileType: 'all',
        connections: 'all',
        sourceId: '',
        personIds:
          Object.freeze([]),
        placeIds:
          Object.freeze([]),
        documentYears:
          Object.freeze({
            mode:
              '',
            from:
              '',
            to:
              ''
          }),

        favouriteOnly:
          false
      });

    function archiveFilePersonIds(
      file
    ) {
      return archiveUniqueIds(
        file?.linkedPersonIds
        || []
      );
    }

    function archiveFilePlaceIds(
      file
    ) {
      const documentPlace =
        archiveDocumentPlace(
          file
        );

      return archiveUniqueIds([
        documentPlace.placeId,

        ...(
          file?.linkedPlaceIds
          || []
        ),

        ...(
          file?.placeIds
          || []
        )
      ]);
    }

    function archiveFilterCollator() {
      return new Intl.Collator(
        state.language === 'ru'
          ? 'ru'
          : 'en',
        {
          sensitivity:
            'base'
        }
      );
    }

    function archivePersonFilterOptions() {
      const files =
        archiveProjectFiles();

      const counts =
        new Map();

      files.forEach(file => {
        archiveFilePersonIds(
          file
        ).forEach(personId => {
          counts.set(
            personId,
            (
              counts.get(personId)
              || 0
            ) + 1
          );
        });
      });

      return getPeople(
        currentProjectId()
      )
        .filter(person =>
          counts.has(person.id)
        )
        .map(person => ({
          value:
            person.id,

          label:
            personResourceDisplayName(
              person
            ),

          count:
            counts.get(person.id)
            || 0
        }))
        .sort(
          (left, right) =>
            archiveFilterCollator()
              .compare(
                left.label,
                right.label
              )
        );
    }

    function archivePlaceFilterOptions() {
      const files =
        archiveProjectFiles();

      const counts =
        new Map();

      files.forEach(file => {
        archiveFilePlaceIds(
          file
        ).forEach(placeId => {
          counts.set(
            placeId,
            (
              counts.get(placeId)
              || 0
            ) + 1
          );
        });
      });

      return [
        ...counts.entries()
      ]
        .map(([
          placeId,
          count
        ]) => {
          const place =
            getPlace(placeId);

          return {
            value:
              placeId,

            label:
              getPlaceDisplay(
                placeId
              )
              || place?.name
              || placeId,

            /*
            * Alternative names improve searching,
            * but are not displayed or localized.
            */
            keywords:
              place?.alternativeNames
              || [],

            count
          };
        })
        .sort(
          (left, right) =>
            archiveFilterCollator()
              .compare(
                left.label,
                right.label
              )
        );
    }

    const archiveFileFilterSchema =
      Object.freeze([
        Object.freeze({
          key: 'sourceId',
          label: 'Source',
          control: 'combobox',
          multiple: false,
          layout: 'full',
          placeholder: 'Search sources...',
          defaultValue: '',
          getOptions: connectedSourceFilterOptions
        }),
        Object.freeze({
          key:
            'scope',

          label:
            'Location',

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
                  'All Archive'
              }),

              Object.freeze({
                value:
                  'folder',

                label:
                  'Current folder and subfolders'
              })
            ])
        }),

        Object.freeze({
          key:
            'fileType',

          label:
            'File type',

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
                  'All types'
              }),

              Object.freeze({
                value:
                  'pdf',

                label:
                  'PDF'
              }),

              Object.freeze({
                value:
                  'img',

                label:
                  'Images'
              }),

              Object.freeze({
                value:
                  'doc',

                label:
                  'Documents'
              }),

              Object.freeze({
                value:
                  'sheet',

                label:
                  'Spreadsheets'
              }),

              Object.freeze({
                value:
                  'audio',

                label:
                  'Audio'
              }),

              Object.freeze({
                value:
                  'archive',

                label:
                  'Archive files'
              })
            ])
        }),

        Object.freeze({
          key:
            'connections',

          label:
            'Connections',

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
                  'All files'
              }),

              Object.freeze({
                value:
                  'linked',

                label:
                  'Linked files'
              }),

              Object.freeze({
                value:
                  'unlinked',

                label:
                  'Unlinked files'
              })
            ])
        }),

        Object.freeze({
          key:
            'favouriteOnly',

          label:
            'Favourites',

          control:
            'boolean',

          defaultValue:
            false,

          checkboxLabel:
            'Favourites only'
        }),

        Object.freeze({
          key:
            'personIds',

          label:
            'People',

          control:
            'combobox',

          multiple:
            true,

          layout:
            'full',

          placeholder:
            'Search people',

          defaultValue:
            Object.freeze([]),

          getOptions:
            archivePersonFilterOptions
        }),

        Object.freeze({
          key:
            'placeIds',

          label:
            'Places',

          control:
            'combobox',

          multiple:
            true,

          layout:
            'full',

          placeholder:
            'Search places',

          defaultValue:
            Object.freeze([]),

          getOptions:
            archivePlaceFilterOptions
        }),

        Object.freeze({
          key:
            'documentYears',

          label:
            'Document date',

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
      ]);

    const archiveSourceFilterSchema =
      Object.freeze([
        Object.freeze({
          key:
            'sourceCategory',

          label:
            'Source category',

          control:
            'select',

          defaultValue:
            'all',

          getOptions:
            () => [
              {
                value:
                  'all',

                label:
                  'All source categories'
              },

              ...SOURCE_CATEGORIES.map(
                category => ({
                  value:
                    category.value,

                  label:
                    category.label
                })
              )
            ]
        }),
        Object.freeze({
          key:
            'sourceConnections',

          label:
            'Connection status',

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
                  'Any connection status'
              }),

              Object.freeze({
                value:
                  'linked',

                label:
                  'With connections'
              }),

              Object.freeze({
                value:
                  'unlinked',

                label:
                  'Without connections'
              })
            ])
        }),
        Object.freeze({
          key:
            'sourceFavouriteOnly',

          label:
            'Favourites',

          control:
            'boolean',

          defaultValue:
            false,

          checkboxLabel:
            'Favourite sources only'
        })
      ]);

    function archiveFileFiltersWithDefaults(
      filters =
        state.archiveFileFilters
    ) {
      return cloneSharedFilterValues(
        archiveFileFilterSchema,
        {
          ...defaultArchiveFileFilters,
          ...(filters || {})
        }
      );
    }

    function archiveEffectiveFileFilters() {
      const filters =
        archiveFileFiltersWithDefaults();

      /*
      * The Favourites sidebar item is a shortcut
      * into the same predicate, not a second
      * filtering implementation.
      */
      if (
        state.archiveView
          === 'favorites'
      ) {
        filters.favouriteOnly =
          true;
      }

      return filters;
    }

    function archiveFileFilteringActive(
      filters =
        archiveEffectiveFileFilters()
    ) {
      const structuredFilterActive =
        archiveFileFilterSchema
          .filter(definition =>
            definition.key !== 'scope'
          )
          .some(definition =>
            sharedFilterValueIsActive(
              definition,
              filters[
                definition.key
              ]
            )
          );

      return Boolean(
        String(
          state.archiveSearch || ''
        ).trim()
        || structuredFilterActive
      );
    }

    function archiveFileFilterCount() {
      const filters =
        archiveEffectiveFileFilters();

      return archiveFileFilterSchema
        .filter(definition =>
          sharedFilterValueIsActive(
            definition,
            filters[
              definition.key
            ]
          )
        )
        .length;
    }

    const ARCHIVE_NAVIGATION_HISTORY_LIMIT =
      50;

    function archiveIsLocationView(
      view
    ) {
      return (
        view === 'files'
        || view === 'favorites'
      );
    }

    function archiveNormalizeLocationSnapshot(
      snapshot = {}
    ) {
      const view =
        snapshot.view === 'favorites'
          ? 'favorites'
          : 'files';

      const selectedFile =
        archiveFileById(
          snapshot.selectedFileId
        );

      const fileFilters =
        archiveFileFiltersWithDefaults(
          snapshot.fileFilters
        );

      if (view === 'favorites') {
        fileFilters.favouriteOnly =
          true;
      }

      return {
        view,

        folderId:
          archiveNormalizeFolderId(
            snapshot.folderId
          ),

        search:
          String(
            snapshot.search || ''
          ),

        fileFilters,

        filterPresentation:
          snapshot.filterPresentation
            === 'folders'
              ? 'folders'
              : 'flat',

        filterScopeFolderId:
          archiveNormalizeFolderId(
            snapshot.filterScopeFolderId
          ),

        selectedFileId:
          selectedFile?.id
          || null,

        inspectorCollapsed:
          Boolean(
            snapshot.inspectorCollapsed
          )
      };
    }

    function archiveCurrentLocationSnapshot() {
      return archiveNormalizeLocationSnapshot({
        view:
          state.archiveView,

        folderId:
          state.archiveSelectedFolderId,

        search:
          state.archiveSearch,

        fileFilters:
          state.archiveFileFilters,

        filterPresentation:
          state.archiveFilterPresentation,

        filterScopeFolderId:
          state.archiveFilterScopeFolderId,

        selectedFileId:
          state.archiveSelectedFileId,

        inspectorCollapsed:
          state.archiveInspectorCollapsed
      });
    }

    function archiveLocationSnapshotKey(
      snapshot
    ) {
      const normalized =
        archiveNormalizeLocationSnapshot(
          snapshot
        );

      return JSON.stringify([
        normalized.view,
        normalized.folderId,
        normalized.search,
        normalized.fileFilters,
        normalized.filterPresentation,
        normalized.filterScopeFolderId,
        normalized.selectedFileId,
        normalized.inspectorCollapsed
      ]);
    }

    function archivePushHistoryEntry(
      stack,
      snapshot
    ) {
      const normalized =
        archiveNormalizeLocationSnapshot(
          snapshot
        );

      const previous =
        stack[
          stack.length - 1
        ];

      if (
        previous
        && archiveLocationSnapshotKey(
          previous
        )
          === archiveLocationSnapshotKey(
            normalized
          )
      ) {
        return;
      }

      stack.push(
        normalized
      );

      if (
        stack.length
          > ARCHIVE_NAVIGATION_HISTORY_LIMIT
      ) {
        stack.splice(
          0,
          stack.length
            - ARCHIVE_NAVIGATION_HISTORY_LIMIT
        );
      }
    }

    function archiveRememberCurrentLocation() {
      if (
        !archiveIsLocationView(
          state.archiveView
        )
      ) {
        return;
      }

      archivePushHistoryEntry(
        state.archiveNavigationBackStack,
        archiveCurrentLocationSnapshot()
      );
    }

    function archiveApplyLocationSnapshot(
      snapshot
    ) {
      const normalized =
        archiveNormalizeLocationSnapshot(
          snapshot
        );

      state.archiveView =
        normalized.view;

      state.archiveSelectedFolderId =
        normalized.folderId;

      state.archiveSearch =
        normalized.search;

      state.archiveFileFilters =
        archiveFileFiltersWithDefaults(
          normalized.fileFilters
        );

      state.archiveFilterPresentation =
        normalized.filterPresentation;

      state.archiveFilterScopeFolderId =
        normalized.filterScopeFolderId;

      state.archiveSelectedFileId =
        normalized.selectedFileId;

      state.archiveSelectedFolderItemId =
        null;

      state.archiveSelectedFileIds =
        [];

      state.archiveInspectorCollapsed =
        normalized.inspectorCollapsed;
    }

    function archivePrepareTreeForLocation(
      folderId,
      {
        expandCurrent =
          false
      } = {}
    ) {
      const normalizedFolderId =
        archiveNormalizeFolderId(
          folderId
        );

      if (!normalizedFolderId) {
        state.archivePendingTreeRevealId =
          null;

        return;
      }

      const path =
        archiveFolderAncestors(
          normalizedFolderId
        );

      const foldersToExpand =
        expandCurrent
          ? path
          : path.slice(
              0,
              -1
            );

      foldersToExpand.forEach(
        folder => {
          state
            .archiveExpandedFolders[
              folder.id
            ] = true;
        }
      );

      state.archivePendingTreeRevealId =
        normalizedFolderId;
    }

    function archiveNavigateToLocationCommit(
      location = {},
      {
        recordHistory =
          true,

        clearForward =
          true,

        expandCurrent =
          false,

        renderMode =
          'archive'
      } = {}
    ) {
      const currentIsLocation =
        archiveIsLocationView(
          state.archiveView
        );

      const current =
        archiveCurrentLocationSnapshot();

      const base =
        currentIsLocation
          ? current
          : archiveNormalizeLocationSnapshot({
              view:
                location.view
                || 'files',

              folderId:
                null,

              search:
                '',

              fileFilters:
                archiveFileFiltersWithDefaults(
                  state.archiveFileFilters
                ),

              filterPresentation:
                state.archiveFilterPresentation,

              filterScopeFolderId:
                state.archiveFilterScopeFolderId,

              selectedFileId:
                null,

              inspectorCollapsed:
                false
            });

      const target =
        archiveNormalizeLocationSnapshot({
          ...base,
          ...location
        });

      const changed =
        !currentIsLocation
        || archiveLocationSnapshotKey(
          current
        )
          !== archiveLocationSnapshotKey(
            target
          );

      if (
        recordHistory
        && currentIsLocation
        && changed
      ) {
        archivePushHistoryEntry(
          state.archiveNavigationBackStack,
          current
        );
      }

      if (
        clearForward
        && changed
      ) {
        state.archiveNavigationForwardStack =
          [];
      }

      archiveApplyLocationSnapshot(
        target
      );

      archivePrepareTreeForLocation(
        target.folderId,
        {
          expandCurrent
        }
      );

      ensureArchiveSelection();

      if (
        renderMode === 'app'
      ) {
        render();
      } else {
        renderArchive();
      }
    }

    function archiveNavigationCanGoBack() {
      return Boolean(
        state
          .archiveNavigationBackStack
          .length
      );
    }

    function archiveNavigationCanGoForward() {
      return Boolean(
        state
          .archiveNavigationForwardStack
          .length
      );
    }

    function archiveNavigationCanGoUp() {
      return Boolean(
        archiveFolderById(
          state.archiveSelectedFolderId
        )
      );
    }

    function archiveNavigateBackCommit() {
      const target =
        state
          .archiveNavigationBackStack
          .pop();

      if (!target) {
        return;
      }

      if (
        archiveIsLocationView(
          state.archiveView
        )
      ) {
        archivePushHistoryEntry(
          state.archiveNavigationForwardStack,
          archiveCurrentLocationSnapshot()
        );
      }

      archiveApplyLocationSnapshot(
        target
      );

      archivePrepareTreeForLocation(
        target.folderId
      );

      ensureArchiveSelection();
      renderArchive();
    }

    function archiveNavigateForwardCommit() {
      const target =
        state
          .archiveNavigationForwardStack
          .pop();

      if (!target) {
        return;
      }

      if (
        archiveIsLocationView(
          state.archiveView
        )
      ) {
        archivePushHistoryEntry(
          state.archiveNavigationBackStack,
          archiveCurrentLocationSnapshot()
        );
      }

      archiveApplyLocationSnapshot(
        target
      );

      archivePrepareTreeForLocation(
        target.folderId
      );

      ensureArchiveSelection();
      renderArchive();
    }

    function archiveNavigateUpCommit() {
      const currentFolder =
        archiveFolderById(
          state.archiveSelectedFolderId
        );

      if (!currentFolder) {
        return;
      }

      const scopeRoot =
        archiveFileFilteringActive()
        && archiveEffectiveFileFilters()
          .scope === 'folder'
          ? archiveNormalizeFolderId(
              state.archiveFilterScopeFolderId
            )
          : null;

      if (
        scopeRoot
        && currentFolder.id === scopeRoot
      ) {
        return;
      }

      archiveNavigateToLocationCommit({
        folderId:
          archiveFolderParentId(
            currentFolder
          ),

        selectedFileId:
          null,

        inspectorCollapsed:
          false
      });
    }
    /*
      Public navigation functions always protect
      an active file-edit draft.
    */

    function archiveNavigateToLocation(
      location = {},
      options = {}
    ) {
      runAfterArchiveFileEditGuard(
        () => {
          archiveNavigateToLocationCommit(
            location,
            options
          );
        }
      );
    }

    function archiveNavigateBack() {
      runAfterArchiveFileEditGuard(
        archiveNavigateBackCommit
      );
    }

    function archiveNavigateForward() {
      runAfterArchiveFileEditGuard(
        archiveNavigateForwardCommit
      );
    }

    function archiveNavigateUp() {
      runAfterArchiveFileEditGuard(
        archiveNavigateUpCommit
      );
    }

    function selectArchiveFolderItem(
      folderId
    ) {
      const folder =
        archiveFolderById(
          folderId
        );

      if (!folder) {
        return;
      }

      runAfterArchiveFileEditGuard(
        () => {
          state.archiveSelectedFolderItemId =
            folder.id;

          /*
            File and folder detail selection are
            mutually exclusive.
          */
          state.archiveSelectedFileId =
            null;

          state.archiveInspectorCollapsed =
            false;

          renderArchiveMain();
        }
      );
    }

    function archiveOpenFolder(
      folderId
    ) {
      const folder =
        archiveFolderById(
          folderId
        );

      if (!folder) {
        return;
      }

      archiveNavigateToLocation(
        {
          view:
            state.archiveView
              === 'favorites'
                ? 'favorites'
                : 'files',

          folderId:
            folder.id,

          selectedFileId:
            null,

          inspectorCollapsed:
            false
        },
        {
          expandCurrent:
            true
        }
      );
    }

    function archivePruneNavigationHistory() {
      const cleanStack =
        stack => {
          const result = [];

          stack.forEach(
            snapshot => {
              const folderValid =
                archiveIsRootLocation(
                  snapshot.folderId
                )
                || Boolean(
                  archiveFolderById(
                    snapshot.folderId
                  )
                );

              if (!folderValid) {
                return;
              }

              const normalized =
                archiveNormalizeLocationSnapshot(
                  snapshot
                );

              const previous =
                result[
                  result.length - 1
                ];

              if (
                previous
                && archiveLocationSnapshotKey(
                  previous
                )
                  === archiveLocationSnapshotKey(
                    normalized
                  )
              ) {
                return;
              }

              result.push(
                normalized
              );
            }
          );

          return result.slice(
            -ARCHIVE_NAVIGATION_HISTORY_LIMIT
          );
        };

      state.archiveNavigationBackStack =
        cleanStack(
          state.archiveNavigationBackStack
          || []
        );

      state.archiveNavigationForwardStack =
        cleanStack(
          state.archiveNavigationForwardStack
          || []
        );
    }

    function openArchiveLocation(
      location,
      {
        recordHistory =
          true,

        expandCurrent =
          false
      } = {}
    ) {
      state.activeModule =
        'Archive';

      archiveNavigateToLocation(
        location,
        {
          recordHistory,
          expandCurrent,
          renderMode:
            'app'
        }
      );
    }

    function archiveProjectFiles() {
      const projectId = currentProjectId();
      return projectId
        ? (sampleData.archiveFiles || []).filter(file => file.projectId === projectId)
        : [];
    }

    function archiveProjectSources() {
      const projectId = currentProjectId();
      return projectId
        ? (sampleData.sources || []).filter(source => source.projectId === projectId)
        : [];
    }

    function archiveFileKind(file) {
      const value = String(file?.kind || file?.type || '').toLowerCase();
      if (value.includes('folder')) return 'folder';
      if (value.includes('pdf')) return 'pdf';
      if (value.includes('image') || value.includes('img') || /\.(jpg|jpeg|png|tif|tiff|webp)$/i.test(file?.name || '')) return 'img';
      if (value.includes('audio') || /\.(mp3|wav|m4a)$/i.test(file?.name || '')) return 'audio';
      if (value.includes('spreadsheet') || /\.(xlsx|xls|csv)$/i.test(file?.name || '')) return 'sheet';
      if (value.includes('document') || /\.(docx|doc|rtf|txt)$/i.test(file?.name || '')) return 'doc';
      if (/\.(zip|7z|rar)$/i.test(file?.name || '')) return 'archive';
      return 'file';
    }

    function archiveFileTypeLabel(file) {
      const kind = archiveFileKind(file);
      return ({
        folder: 'Folder',
        pdf: 'PDF document',
        img: 'Image',
        audio: 'Audio',
        sheet: 'Spreadsheet',
        doc: 'Document',
        archive: 'Archive file',
        file: file?.type || 'File'
      })[kind];
    }

    function archiveFileIcon(file) {
      const kind = archiveFileKind(file);
      if (kind === 'folder') return `<span class="archive-file-icon folder" aria-hidden="true">${icon.folder}</span>`;
      const label = ({ pdf: 'PDF', img: 'IMG', audio: 'AUD', sheet: 'XLS', doc: 'DOC', archive: 'ZIP', file: 'FILE' })[kind];
      return `<span class="archive-file-icon ${kind}" aria-hidden="true">${escapeHtml(label)}</span>`;
    }

    function connectedFileMeta(
      file
    ) {
      if (!file) {
        return 'Archive file';
      }

      return [
        archiveFileTypeLabel(
          file
        ),

        String(
          file.size || ''
        ).trim()
      ]
        .filter(Boolean)
        .join(' · ')
        || 'Archive file';
    }

    function connectedFileContextConfig(
      contextType
    ) {
      return {
        person: {
          noun:
            'person',

          record:
            contextId =>
              getPerson(
                contextId
              ),

          label:
            record =>
              record?.names?.display
              || record?.name
              || 'this person',

          isLinked:
            (
              file,
              contextId
            ) =>
              archiveConnectionIds(
                'file',
                file.id,
                'person'
              ).includes(
                contextId
              ),

          unlink:
            (
              file,
              contextId
            ) =>
              archiveSetConnection(
                'file',
                file.id,
                'person',
                contextId,
                false
              )
        },

        note: {
          noun:
            'note',

          record:
            contextId =>
              getNote(
                contextId,
                {
                  includeArchived:
                    true
                }
              ),

          label:
            record =>
              record?.title
              || 'Untitled note',

          isLinked:
            (
              file,
              contextId
            ) =>
              archiveConnectionIds(
                'file',
                file.id,
                'note'
              ).includes(
                contextId
              ),

          unlink:
            (
              file,
              contextId
            ) =>
              archiveSetConnection(
                'file',
                file.id,
                'note',
                contextId,
                false
              )
        },

        place: {
          noun:
            'place',

          record:
            contextId =>
              getPlace(
                contextId
              ),

          label:
            record =>
              record?.name
              || 'this place',

          isLinked:
            (
              file,
              contextId
            ) =>
              archiveConnectionIds(
                'file',
                file.id,
                'place'
              ).includes(
                contextId
              ),

          unlink:
            (
              file,
              contextId
            ) =>
              archiveSetConnection(
                'file',
                file.id,
                'place',
                contextId,
                false
              )
        },

        source: {
          noun:
            'source',

          record:
            contextId =>
              archiveSourceById(
                contextId
              ),

          label:
            record =>
              record?.title
              || 'Untitled source',

          isLinked:
            (
              file,
              contextId
            ) =>
              archiveConnectionIds(
                'source',
                contextId,
                'file'
              ).includes(
                file.id
              ),

          unlink:
            (
              file,
              contextId
            ) =>
              archiveSetConnection(
                'source',
                contextId,
                'file',
                file.id,
                false
              )
        }
      }[
        contextType
      ] || null;
    }

    function renderConnectedFileItem({
      file,

      contextType =
        '',

      contextId =
        '',

      allowUnlink =
        true
    } = {}) {
      if (!file) {
        return '';
      }

      const title =
        file.name
        || file.title
        || 'Untitled file';

      const meta =
        connectedFileMeta(
          file
        );

      const contextConfig =
        connectedFileContextConfig(
          contextType
        );

      const unlinkSupported =
        Boolean(
          allowUnlink
          && contextId
          && contextConfig
        );

      return `
        <div
          class="
            connected-file-item

            ${
              unlinkSupported
                ? 'can-unlink'
                : ''
            }
          ">

          <button
            class="
              connected-file-main
            "
            type="button"
            data-connected-file-id="${escapeHtml(
              file.id
            )}"
            aria-label="Open ${escapeHtml(
              title
            )} in Archive">

            ${archiveFileIcon(
              file
            )}

            <span
              class="
                connected-file-copy
              ">

              <strong
                class="
                  connected-file-title
                "
                title="${escapeHtml(
                  title
                )}">

                ${escapeHtml(
                  title
                )}
              </strong>

              <span
                class="
                  connected-file-meta
                "
                title="${escapeHtml(
                  meta
                )}">

                ${escapeHtml(
                  meta
                )}
              </span>
            </span>
          </button>

          ${
            unlinkSupported
              ? `
                <button
                  class="
                    connected-file-unlink
                  "
                  type="button"
                  data-connected-file-unlink="${escapeHtml(
                    file.id
                  )}"
                  data-connected-file-context-type="${escapeHtml(
                    contextType
                  )}"
                  data-connected-file-context-id="${escapeHtml(
                    contextId
                  )}"
                  aria-label="Unlink ${escapeHtml(
                    title
                  )} from this ${escapeHtml(
                    contextConfig.noun
                  )}"
                  title="Unlink file">

                  ${icon.unlink}
                </button>
              `
              : ''
          }
        </div>
      `;
    }

    function renderConnectedFileList({
      files =
        [],

      limit =
        null,

      emptyText =
        'No files linked.',

      contextType =
        '',

      contextId =
        '',

      allowUnlink =
        true
    } = {}) {
      const validFiles =
        (
          Array.isArray(
            files
          )
            ? files
            : []
        )
          .filter(Boolean);

      if (!validFiles.length) {
        return `
          <div
            class="
              connected-file-empty
            ">

            ${escapeHtml(
              emptyText
            )}
          </div>
        `;
      }

      /*
        null means "no extra limit".
        Do not convert null to Number(null) === 0.
      */
      const hasLimit =
        limit !== null
        && limit !== undefined
        && Number.isFinite(
          Number(
            limit
          )
        )
        && Number(
          limit
        ) >= 0;

      const visibleFiles =
        hasLimit
          ? validFiles.slice(
              0,
              Number(
                limit
              )
            )
          : validFiles;

      return `
        <div
          class="
            connected-file-list
          ">

          ${visibleFiles
            .map(file =>
              renderConnectedFileItem({
                file,

                contextType,

                contextId,

                allowUnlink
              })
            )
            .join('')}
        </div>
      `;
    }

    function connectedFileRelationshipExists({
      fileId,
      contextType,
      contextId
    }) {
      const file =
        archiveFileById(
          fileId
        );

      const config =
        connectedFileContextConfig(
          contextType
        );

      if (
        !file
        || !config
        || !contextId
      ) {
        return false;
      }

      return Boolean(
        config.isLinked(
          file,
          contextId
        )
      );
    }

    function unlinkConnectedFileRelationship({
      fileId,
      contextType,
      contextId
    }) {
      const file =
        archiveFileById(
          fileId
        );

      const config =
        connectedFileContextConfig(
          contextType
        );

      if (
        !file
        || !config
        || !contextId
      ) {
        return false;
      }

      if (
        !config.isLinked(
          file,
          contextId
        )
      ) {
        return false;
      }

      return Boolean(
        config.unlink(
          file,
          contextId
        )
      );
    }

    function openConnectedFileUnlinkConfirm({
      fileId,
      contextType,
      contextId,
      onUnlinked =
        null
    } = {}) {
      const file =
        archiveFileById(
          fileId
        );

      const config =
        connectedFileContextConfig(
          contextType
        );

      if (
        !file
        || !config
        || !contextId
      ) {
        return;
      }

      if (
        !connectedFileRelationshipExists({
          fileId,
          contextType,
          contextId
        })
      ) {
        showToast(
          'This file is no longer linked.'
        );

        return;
      }

      const contextRecord =
        config.record(
          contextId
        );

      if (!contextRecord) {
        showToast(
          'Linked record not found.'
        );

        return;
      }

      const fileName =
        file.name
        || file.title
        || 'Untitled file';

      const contextName =
        config.label(
          contextRecord
        );

      openModal(`
        <div
          class="
            modal
            connected-file-unlink-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedFileUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2
                id="connectedFileUnlinkTitle">

                Unlink file from
                ${escapeHtml(
                  config.noun
                )}?
              </h2>

              <p>
                ${escapeHtml(
                  fileName
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close unlink confirmation">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              unlink-relationship-body
            ">

            <div
              class="
                unlink-relationship-warning
                connected-file-unlink-warning
              ">

              <strong>
                The file will not be deleted.
              </strong>

              <span>
                Only the connection between
                “${escapeHtml(
                  fileName
                )}” and
                “${escapeHtml(
                  contextName
                )}” will be removed.
                The file will remain available
                in Archive and keep all its
                other connections.
              </span>
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
                danger
              "
              type="button"
              data-confirm-connected-file-unlink>

              Unlink file
            </button>
          </div>
        </div>
      `);

      modalBackdrop
        .querySelector(
          '[data-confirm-connected-file-unlink]'
        )
        ?.addEventListener(
          'click',
          () => {
            const unlinked =
              unlinkConnectedFileRelationship({
                fileId:
                  file.id,

                contextType,

                contextId
              });

            /*
              Match the Connected Note flow:
              close before rerendering the source
              inspector.
            */
            closeModal();

            if (!unlinked) {
              showToast(
                'The file could not be unlinked.'
              );

              return;
            }

            if (
              typeof onUnlinked
              === 'function'
            ) {
              onUnlinked({
                fileId:
                  file.id,

                contextType,

                contextId
              });
            } else {
              render();
            }

            showToast(
              `File unlinked from ${
                config.noun
              }.`
            );
          }
        );
    }

    function bindConnectedFileLinks(
      root,
      {
        onUnlinked =
          null
      } = {}
    ) {
      if (!root) {
        return;
      }

      root
        .querySelectorAll(
          '[data-connected-file-id]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              openFamilyArchiveItem(
                button.dataset
                  .connectedFileId
              );
            }
          );
        });

      root
        .querySelectorAll(
          '[data-connected-file-unlink]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            event => {
              event.preventDefault();
              event.stopPropagation();

              openConnectedFileUnlinkConfirm({
                fileId:
                  button.dataset
                    .connectedFileUnlink,

                contextType:
                  button.dataset
                    .connectedFileContextType
                  || '',

                contextId:
                  button.dataset
                    .connectedFileContextId
                  || '',

                onUnlinked
              });
            }
          );
        });
    }

    function archiveDateValue(value) {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function archiveFormatDate(value, fallback = 'Unknown') {
      const parsed = Date.parse(value || '');
      if (!Number.isFinite(parsed)) return value || fallback;
      return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }).format(new Date(parsed));
    }

    function archiveUniqueIds(values) {
      return [...new Set((values || []).filter(Boolean))];
    }

    function restoreModalChoiceFocus({
      modal,
      selector,
      value,
      index = 0,
      fallbackSelector = 'input[type="search"]'
    }) {
      requestAnimationFrame(() => {
        const choices = [
          ...(
            modal?.querySelectorAll(
              selector
            ) || []
          )
        ].filter(choice =>
          !choice.disabled
        );

        const matchingChoice =
          choices.find(choice =>
            choice.value === value
          );

        const nextChoice =
          matchingChoice
          || choices[
            Math.min(
              Math.max(index, 0),
              Math.max(choices.length - 1, 0)
            )
          ];

        if (nextChoice) {
          nextChoice.focus();
          return;
        }

        modal
          ?.querySelector(
            fallbackSelector
          )
          ?.focus();
      });
    }

    function archiveEventLabel(event) {
      if (!event) return 'Event';
      const people = (event.personIds || []).map(id => getPerson(id)?.names?.display).filter(Boolean);
      return [event.title || event.type || 'Event', people.join(' & ')].filter(Boolean).join(' · ');
    }

    function archiveEventMeta(event) {
      const date = event?.dateLabel || event?.dateText || event?.sortDate || event?.date || '';
      const place = getPlaceDisplay(event?.placeId) || event?.placeText || '';
      return [date, place].filter(Boolean).join(' · ') || event?.description || 'Genealogy event';
    }

    function archiveNoteIdsForFile(file) {
      const reciprocal = (sampleData.notes || [])
        .filter(note => (note.linkedArchiveFileIds || []).includes(file.id))
        .map(note => note.id);
      return archiveUniqueIds([...(file.linkedNoteIds || []), ...reciprocal]);
    }

    function archiveNoteIdsForSource(
      source
    ) {
      return source
        ? sourceTargetIds(
            source.id,
            'note',
            source.projectId
          )
        : [];
    }

    function archiveFilesForSource(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        return [];
      }

      return sourceTargetIds(
        source.id,
        'file',
        source.projectId
      )
        .map(fileId =>
          archiveFileById(
            fileId,
            source.projectId
          )
        )
        .filter(Boolean);
    }

    function archiveConnectionIds(
      ownerType,
      ownerId,
      entityType
    ) {
      if (ownerType === 'file') {
        const file =
          archiveFileById(
            ownerId
          );

        if (!file) {
          return [];
        }

        if (entityType === 'person') {
          return file.linkedPersonIds || [];
        }

        if (entityType === 'event') {
          return file.linkedEventIds || [];
        }

        if (entityType === 'note') {
          return archiveNoteIdsForFile(
            file
          );
        }

        if (entityType === 'place') {
          const placeId =
            archiveDocumentPlace(
              file
            ).placeId;

          return placeId
            ? [placeId]
            : [];
        }

        if (entityType === 'source') {
          return sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
          );
        }
      }

      if (ownerType === 'source') {
        const source =
          archiveSourceById(
            ownerId
          );

        if (!source) {
          return [];
        }

        return sourceTargetIds(
          source.id,
          entityType,
          source.projectId
        );
      }

      return [];
    }

    function archiveEntityConfig(type) {
      const projectId = currentProjectId();
      const configs = {
        person: {
          singular: 'person', title: 'People', addLabel: 'Add people',
          records: () => (sampleData.people || []).filter(person => !person.deleted && person.projectId === projectId),
          label: record => record?.names?.display || record?.name || 'Person',
          meta: record =>
            archiveFilePersonMeta(
              record
            )
        },
        event: {
          singular: 'event', title: 'Events', addLabel: 'Add events',
          records: () => (sampleData.events || []).filter(event => event.projectId === projectId),
          label: archiveEventLabel,
          meta: archiveEventMeta
        },
        note: {
          singular: 'note', title: 'Notes', addLabel: 'Add notes',
          records: () => typeof getProjectNotes === 'function' ? getProjectNotes(projectId, { includeArchived: false }) : (sampleData.notes || []).filter(note => note.projectId === projectId && !note.archived),
          label: record => record?.title || 'Untitled note',
          meta: record => typeof noteExcerpt === 'function' ? (noteExcerpt(record, 90) || 'No note content') : 'Research note'
        },
        place: {
          singular: 'place', title: 'Places', addLabel: 'Add places',
          records: () => (sampleData.places || []).filter(place => !place.deleted && place.projectId === projectId),
          label: record => record?.name || 'Place',
          meta: record => (record?.alternativeNames || []).slice(0, 2).join(' · ') || 'Place record'
        },
        photo: {
          singular:
            'photo',

          title:
            'Photos',

          addLabel:
            'Add photos',

          records:
            () =>
              getProjectPhotos(
                projectId
              ),

          label:
            record =>
              record?.title
              || record?.filename
              || 'Untitled photo',

          meta:
            record =>
              [
                formatPhotoDate(
                  record
                ),

                record?.filename
              ]
                .filter(Boolean)
                .join(' · ')
              || 'Photo'
        },
        source: {
          singular: 'source', title: 'Sources', addLabel: 'Add sources',
          records: archiveProjectSources,
          label: record => record?.title || 'Untitled source',
          meta:
            record =>
              [
                localizedSourceCategoryLabel(
                  record?.category,
                  ''
                ),

                record?.providedBy
              ]
                .filter(Boolean)
                .join(' · ')
              || 'Source record'
        },
        file: {
          singular: 'file', title: 'Files', addLabel: 'Add files',
          records: archiveProjectFiles,
          label: record => record?.name || 'Untitled file',
          meta: record => [archiveFileTypeLabel(record), archiveFolderPath(record?.folderId)].filter(Boolean).join(' · ')
        }
      };
      return configs[type] || null;
    }

    function archiveConnectionRecord(
      type,
      id
    ) {
      if (type === 'person') {
        return getPerson(
          id
        );
      }

      if (type === 'event') {
        return (
          sampleData.events || []
        ).find(event =>
          event.id === id
        ) || null;
      }

      if (type === 'note') {
        return typeof getNote
          === 'function'
            ? getNote(
                id,
                {
                  includeArchived:
                    true
                }
              )
            : (
                sampleData.notes || []
              ).find(note =>
                note.id === id
              ) || null;
      }

      if (type === 'place') {
        return getPlace(
          id
        );
      }

      if (type === 'photo') {
        return getPhoto(
          id,
          {
            projectId:
              currentProjectId()
          }
        );
      }

      if (type === 'source') {
        return archiveSourceById(
          id
        );
      }

      if (type === 'file') {
        return archiveFileById(
          id
        );
      }

      return null;
    }

    function archiveSyncNoteLink(
      noteId,
      entityType,
      entityId,
      shouldLink
    ) {
      if (entityType !== 'file') {
        return;
      }

      const note =
        getNote(
          noteId,
          {
            includeArchived:
              true
          }
        );

      if (!note) {
        return;
      }

      const nextIds =
        new Set(
          note.linkedArchiveFileIds
          || []
        );

      if (shouldLink) {
        nextIds.add(
          entityId
        );
      } else {
        nextIds.delete(
          entityId
        );
      }

      setNoteEntityLinks(
        note.id,
        'archiveFile',
        [...nextIds],
        {
          projectId:
            note.projectId
        }
      );
    }

    function archiveSetConnection(
      ownerType,
      ownerId,
      entityType,
      entityId,
      shouldLink
    ) {
      if (
        ownerType === 'file'
        && entityType === 'source'
      ) {
        const file =
          archiveFileById(
            ownerId
          );

        return Boolean(
          file
          && setSourceLink(
            entityId,
            'file',
            file.id,
            shouldLink,
            {
              projectId:
                file.projectId
            }
          )
        );
      }

      if (ownerType === 'source') {
        const source =
          archiveSourceById(
            ownerId
          );

        if (
          !source
          || !SOURCE_LINK_TARGET_TYPES
            .includes(
              entityType
            )
        ) {
          return false;
        }

        return setSourceLink(
          source.id,
          entityType,
          entityId,
          shouldLink,
          {
            projectId:
              source.projectId
          }
        );
      }

      if (ownerType !== 'file') {
        return false;
      }

      const file =
        archiveFileById(
          ownerId
        );

      const record =
        archiveConnectionRecord(
          entityType,
          entityId
        );

      if (
        !file
        || (
          shouldLink
          && !record
        )
        || (
          record?.projectId
          && file.projectId
          && record.projectId
            !== file.projectId
        )
      ) {
        return false;
      }

      if (entityType === 'place') {
        const currentPlaceId =
          archiveDocumentPlace(
            file
          ).placeId;

        if (shouldLink) {
          archiveApplyDocumentPlace(
            file,
            entityId,
            ''
          );
        } else if (
          currentPlaceId === entityId
        ) {
          archiveApplyDocumentPlace(
            file,
            '',
            ''
          );
        } else {
          return false;
        }
      } else {
        const field =
          ({
            person:
              'linkedPersonIds',

            event:
              'linkedEventIds',

            note:
              'linkedNoteIds'
          })[entityType];

        if (!field) {
          return false;
        }

        const ids =
          new Set(
            file[field] || []
          );

        if (shouldLink) {
          ids.add(
            entityId
          );
        } else {
          ids.delete(
            entityId
          );
        }

        file[field] =
          [...ids];

        if (entityType === 'note') {
          archiveSyncNoteLink(
            entityId,
            'file',
            file.id,
            shouldLink
          );
        }
      }

      file.updatedAt =
        new Date().toISOString();

      file.updated =
        'Just now';

      const savedIds =
        archiveConnectionIds(
          'file',
          file.id,
          entityType
        );

      return shouldLink
        ? savedIds.includes(
            entityId
          )
        : !savedIds.includes(
            entityId
          );
    }

    function archiveSetConnectionsAtomically(
      writes = []
    ) {
      const normalizedWrites =
        writes.map(write => ({
          ownerType:
            write?.ownerType || '',

          ownerId:
            String(write?.ownerId || '').trim(),

          entityType:
            write?.entityType || '',

          entityId:
            String(write?.entityId || '').trim(),

          shouldLink:
            write?.shouldLink !== false
        }));

      const valid =
        normalizedWrites.every(write => {
          const owner =
            archiveConnectionRecord(
              write.ownerType,
              write.ownerId
            );

          const record =
            archiveConnectionRecord(
              write.entityType,
              write.entityId
            );

          if (
            !owner
            || !write.entityType
            || !write.entityId
          ) {
            return false;
          }

          if (
            write.shouldLink
            && !record
          ) {
            return false;
          }

          return !(
            write.shouldLink
            && owner.projectId
            && record?.projectId
            && owner.projectId
              !== record.projectId
          );
        });

      if (!valid) {
        return {
          ok: false,
          changedCount: 0
        };
      }

      const applied =
        [];

      for (const write of normalizedWrites) {
        const previousPlace =
          write.ownerType === 'file'
          && write.entityType === 'place'
            ? archiveDocumentPlace(
                archiveFileById(
                  write.ownerId
                )
              )
            : null;

        const wasLinked =
          archiveConnectionIds(
            write.ownerType,
            write.ownerId,
            write.entityType
          ).includes(
            write.entityId
          );

        if (
          wasLinked
            === write.shouldLink
        ) {
          continue;
        }

        if (
          !archiveSetConnection(
            write.ownerType,
            write.ownerId,
            write.entityType,
            write.entityId,
            write.shouldLink
          )
        ) {
          applied
            .slice()
            .reverse()
            .forEach(previous => {
              if (
                previous.ownerType === 'file'
                && previous.entityType === 'place'
              ) {
                const file =
                  archiveFileById(
                    previous.ownerId
                  );

                if (file) {
                  archiveApplyDocumentPlace(
                    file,
                    previous.previousPlace?.placeId
                      || '',

                    previous.previousPlace?.placeText
                      || ''
                  );

                  file.updatedAt =
                    new Date().toISOString();

                  file.updated =
                    'Just now';
                }
              } else {
                archiveSetConnection(
                  previous.ownerType,
                  previous.ownerId,
                  previous.entityType,
                  previous.entityId,
                  previous.wasLinked
                );
              }
            });

          return {
            ok: false,
            changedCount: 0
          };
        }

        applied.push({
          ...write,
          wasLinked,
          previousPlace
        });
      }

      return {
        ok: true,
        changedCount:
          applied.length
      };
    }

    function archiveFileEditIsActive(
      fileId =
        state.archiveSelectedFileId
    ) {
      return Boolean(
        state.archiveFileEditing
        && state.archiveFileEditDraft
          ?.fileId === fileId
      );
    }

    function archiveDocumentDateModel(
      file
    ) {
      const stored =
        file?.documentDate
        || {};

      /*
        Canonical records already use the shared
        genealogy-date model.
      */
      if (
        stored.dateType
        || stored.date
        || stored.dateLabel
        || stored.originalText
      ) {
        return normalizeGenealogyDateInput(
          stored,
          stored.dateType
          || 'Exact date'
        );
      }

      /*
        Convert the existing Archive prototype's
        { type, value } format.
      */
      const legacyType =
        String(
          stored.type || ''
        ).trim();

      const legacyValue =
        String(
          stored.value || ''
        ).trim();

      if (
        !legacyValue
        || legacyType === 'Unknown'
      ) {
        return emptyGenealogyDate(
          'Exact date'
        );
      }

      let dateType =
        legacyType
        || 'Exact date';

      /*
        Existing Archive data stores year-only
        values as Exact date.
      */
      if (
        dateType === 'Exact date'
        && /^\d{4}$/.test(
          legacyValue
        )
      ) {
        dateType =
          'Year only';
      }

      if (
        dateType === 'Between'
      ) {
        const parts =
          legacyValue
            .split(
              /\s+(?:-|to)\s+|[–—]/i
            )
            .map(value =>
              value.trim()
            )
            .filter(Boolean);

        if (
          parts.length >= 2
        ) {
          const parsed =
            parseGenealogyDateTextAsType(
              parts[0],
              'Between',
              {
                date2:
                  parts[1],

                date2Label:
                  parts[1]
              }
            );

          if (parsed.valid) {
            return parsed.value;
          }
        }
      }

      const parsed =
        parseGenealogyDateTextAsType(
          legacyValue,
          dateType
        );

      return parsed.valid
        ? parsed.value
        : {
            ...emptyGenealogyDate(
              dateType
            ),

            originalText:
              legacyValue
          };
    }

    function archiveDocumentPlace(
      file
    ) {
      const placeId =
        file?.documentPlaceId
        || (
          file?.linkedPlaceIds
          || []
        )[0]
        || (
          file?.placeIds
          || []
        )[0]
        || '';

      return {
        placeId,

        placeText:
          String(
            file?.documentPlaceText
            || ''
          ).trim()
      };
    }

    function archiveApplyDocumentPlace(
      file,
      placeId,
      placeText
    ) {
      const normalizedPlaceId =
        String(
          placeId || ''
        ).trim();

      file.documentPlaceId =
        normalizedPlaceId
        || null;

      file.documentPlaceText =
        String(
          placeText || ''
        ).trim();

      /*
        Preserve compatibility with Places and
        Archive search while making document place
        the single inspector concept.
      */
      file.linkedPlaceIds =
        normalizedPlaceId
          ? [
              normalizedPlaceId
            ]
          : [];

      file.placeIds =
        [
          ...file.linkedPlaceIds
        ];
    }

    function archiveFileEditDraftFromFile(
      file
    ) {
      const place =
        archiveDocumentPlace(
          file
        );

      return {
        fileId:
          file.id,

        name:
          file.name
          || '',

        description:
          file.description
          || '',

        documentDate: {
          ...archiveDocumentDateModel(
            file
          )
        },

        documentPlaceId:
          place.placeId
          || '',

        documentPlaceText:
          place.placeText
          || ''
      };
    }

    function normalizedArchiveFileEditDraft(
      draft
    ) {
      return {
        name:
          String(
            draft?.name || ''
          ).trim(),

        description:
          String(
            draft?.description || ''
          ).trim(),

        documentDate:
          mediaDateFromGenealogyModel(
            draft?.documentDate
            || {}
          ),

        documentPlaceId:
          String(
            draft?.documentPlaceId
            || ''
          ),

        documentPlaceText:
          String(
            draft?.documentPlaceText
            || ''
          ).trim()
      };
    }

    function collectArchiveFileEditDraft({
      allowInvalidDate =
        false
    } = {}) {
      if (
        !state.archiveFileEditing
      ) {
        return null;
      }

      const documentDate =
        collectGenealogyDateField(
          'archiveFileDocumentDate',
          {
            allowInvalid:
              allowInvalidDate
          }
        );

      if (!documentDate) {
        return null;
      }

      /*
        Draft collection must be side-effect free.

        readPlaceInputValue() reads the typed value
        without creating a new Place record.
      */
      const place =
        readPlaceInputValue(
          '#archiveFileDocumentPlace',
          main
        );

      return {
        fileId:
          state.archiveSelectedFileId,

        name:
          main
            .querySelector(
              '#archiveFileName'
            )
            ?.value
            .trim()
          || '',

        description:
          main
            .querySelector(
              '#archiveFileDescription'
            )
            ?.value
            .trim()
          || '',

        documentDate,

        documentPlaceId:
          place.selectedPlaceId
          || '',

        documentPlaceText:
          place.text
          || ''
      };
    }

    function archiveFileEditIsDirty() {
      if (
        !state.archiveFileEditing
        || !state.archiveFileEditOriginal
      ) {
        return false;
      }

      const current =
        collectArchiveFileEditDraft({
          allowInvalidDate:
            true
        });

      /*
        An invalid live date is still an unsaved
        change and must trigger the discard guard.
      */
      if (
        !current
        || current.documentDate
          ?.invalid
      ) {
        return true;
      }

      return JSON.stringify(
        normalizedArchiveFileEditDraft(
          current
        )
      ) !== JSON.stringify(
        normalizedArchiveFileEditDraft(
          state.archiveFileEditOriginal
        )
      );
    }

    function resetArchiveFileEditState() {
      state.archiveFileEditing =
        false;

      state.archiveFileEditOriginal =
        null;

      state.archiveFileEditDraft =
        null;
    }

    function beginArchiveFileEdit() {
      const file =
        archiveFileById(
          state.archiveSelectedFileId
        );

      if (!file) {
        return;
      }

      const draft =
        archiveFileEditDraftFromFile(
          file
        );

      state.archiveFileEditing =
        true;

      state.archiveFileEditOriginal = {
        ...draft,

        documentDate: {
          ...draft.documentDate
        }
      };

      state.archiveFileEditDraft = {
        ...draft,

        documentDate: {
          ...draft.documentDate
        }
      };

      state.archiveInspectorSections
        .details =
          true;

      renderArchiveMain();
    }

    function cancelArchiveFileEdit() {
      resetArchiveFileEditState();
      renderArchiveMain();
    }

    function saveArchiveFileEdit() {
      const file =
        archiveFileById(
          state.archiveSelectedFileId
        );

      if (!file) {
        resetArchiveFileEditState();
        renderArchiveMain();

        return;
      }

      const draft =
        collectArchiveFileEditDraft();

      if (!draft) {
        showToast(
          'Check the historical date before saving.'
        );

        return;
      }

      if (!draft.name.trim()) {
        showToast(
          'Enter a file name before saving.'
        );

        main
          .querySelector(
            '#archiveFileName'
          )
          ?.focus();

        return;
      }

      file.name =
        draft.name.trim();

      file.description =
        draft.description
        || '';

      /*
        Store the canonical genealogy-date model.
        The old { type, value } representation is
        no longer written.
      */
      file.documentDate =
        normalizeGenealogyDateInput(
          draft.documentDate,
          draft.documentDate
            ?.dateType
          || 'Exact date'
        );

      const resolvedPlace =
        resolvePlaceInputValue(
          draft.documentPlaceText,
          draft.documentPlaceId
        );

      archiveApplyDocumentPlace(
        file,
        resolvedPlace.placeId,
        resolvedPlace.placeText
      );

      file.updatedAt =
        new Date()
          .toISOString();

      file.updated =
        'Just now';

      resetArchiveFileEditState();
      renderArchive();
      showToast(
        'File updated.'
      );
    }

    function runAfterArchiveFileEditGuard(
      action
    ) {
      if (
        !state.archiveFileEditing
      ) {
        action();

        return;
      }

      if (
        !archiveFileEditIsDirty()
      ) {
        resetArchiveFileEditState();
        action();

        return;
      }

      openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discardArchiveFileEditTitle">

          <div class="modal-header">
            <div>
              <h2
                id="discardArchiveFileEditTitle">
                Discard file changes?
              </h2>

              <p>
                Your unsaved file name and detail
                changes will be lost.
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

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Continue editing
            </button>

            <button
              class="button danger"
              type="button"
              data-discard-archive-file-edit>

              Discard changes
            </button>
          </div>
        </div>
      `);

      modalBackdrop
        .querySelector(
          '[data-discard-archive-file-edit]'
        )
        ?.addEventListener(
          'click',
          () => {
            closeModal();
            resetArchiveFileEditState();
            action();
          }
        );
    }

    function archiveInspectorSectionIsOpen(
      sectionId
    ) {
      return state
        .archiveInspectorSections[
          sectionId
        ] !== false;
    }

    function renderArchiveFileSection(
      sectionId,
      title,
      content,
      actionHtml = '',
      meta = ''
    ) {
      return renderInspectorSection(
        sectionId,
        title,
        meta,
        content,
        actionHtml,
        {
          inlineAction:
            Boolean(
              actionHtml
            ),

          alwaysShowAction:
            true,

          open:
            archiveInspectorSectionIsOpen(
              sectionId
            ),

          toggleAttribute:
            'data-archive-section-toggle',

          sectionId:
            `archive-file-section-${sectionId}`
        }
      );
    }

    function renderArchiveFileSectionAction(
      entityType,
      label,
      locked
    ) {
      if (locked) {
        return '';
      }

      const attribute =
        {
          person:
            'data-archive-add-file-person',

          event:
            'data-archive-add-file-event',

          note:
            'data-archive-add-file-note',

          source:
            'data-archive-add-file-source'
        }[entityType];

      if (!attribute) {
        return '';
      }

      return `
        <button
          class="link"
          type="button"
          ${attribute}>

          ${renderPanelButtonLabel(
            icon.plus,
            label
          )}
        </button>
      `;
    }

    function archiveSearchText(file) {
      const people =
        archiveFilePersonIds(file)
          .map(id =>
            getPerson(id)
              ?.names?.display
            || ''
          )
          .join(' ');

      const events =
        (
          file.linkedEventIds
          || []
        )
          .map(id =>
            archiveEventLabel(
              archiveConnectionRecord(
                'event',
                id
              )
            )
          )
          .join(' ');

      const notes =
        archiveNoteIdsForFile(file)
          .map(id =>
            archiveConnectionRecord(
              'note',
              id
            )?.title
            || ''
          )
          .join(' ');

      const places =
        archiveFilePlaceIds(file)
          .map(id =>
            getPlace(id)?.name
            || ''
          )
          .join(' ');

      const sources =
        sourceIdsForTarget(
          'file',
          file.id,
          file.projectId
        )
          .map(sourceId =>
            archiveSourceById(
              sourceId,
              file.projectId
            )?.title
            || ''
          )
          .join(' ');

      return [
        file.name,
        file.description,
        archiveFolderPath(
          file.folderId
        ),
        people,
        events,
        notes,
        places,
        sources
      ]
        .join(' ')
        .toLocaleLowerCase(
          state.language === 'ru'
            ? 'ru'
            : 'en'
        );
    }

    function archiveFileHasLinks(
      file
    ) {
      if (!file) {
        return false;
      }

      return Boolean(
        archiveFilePersonIds(
          file
        ).length

        || (
          file.linkedEventIds
          || []
        ).length

        || archiveNoteIdsForFile(
          file
        ).length

        || archiveFilePlaceIds(
          file
        ).length

        || sourceIdsForTarget(
          'file',
          file.id,
          file.projectId
        ).length
      );
    }

    function archiveDocumentYearInterval(
      file
    ) {
      const model =
        archiveDocumentDateModel(
          file
        );

      const text = [
        model.date,
        model.dateLabel,
        model.originalText,
        model.date2,
        model.date2Label
      ]
        .filter(Boolean)
        .join(' ');

      const years =
        (
          text.match(
            /\b\d{4}\b/g
          )
          || []
        )
          .map(Number)
          .filter(year =>
            Number.isInteger(year)
            && year >= 1
            && year <= 9999
          );

      if (!years.length) {
        return null;
      }

      const type =
        String(
          model.dateType || ''
        )
          .trim()
          .toLowerCase();

      const firstYear =
        years[0];

      if (type === 'before') {
        return {
          from:
            1,

          to:
            Math.max(
              1,
              firstYear - 1
            )
        };
      }

      if (type === 'after') {
        return {
          from:
            Math.min(
              9999,
              firstYear + 1
            ),

          to:
            9999
        };
      }

      if (
        type === 'between'
        && years.length >= 2
      ) {
        return {
          from:
            Math.min(
              years[0],
              years[1]
            ),

          to:
            Math.max(
              years[0],
              years[1]
            )
        };
      }

      return {
        from:
          firstYear,

        to:
          firstYear
      };
    }

    function archiveDocumentYearMatches(
      file,
      value
    ) {
      const range =
        normalizeSharedFilterYearRange(
          value
        );

      if (!range.mode) {
        return true;
      }

      if (
        sharedFilterYearRangeError(
          range
        )
      ) {
        return false;
      }

      const fileInterval =
        archiveDocumentYearInterval(
          file
        );

      if (!fileInterval) {
        return false;
      }

      const fromYear =
        sharedFilterYearNumber(
          range.from
        );

      let filterFrom = 1;
      let filterTo = 9999;

      if (range.mode === 'before') {
        filterTo =
          Math.max(
            1,
            fromYear - 1
          );
      }

      if (range.mode === 'after') {
        filterFrom =
          Math.min(
            9999,
            fromYear + 1
          );
      }

      if (range.mode === 'between') {
        filterFrom =
          fromYear;

        filterTo =
          sharedFilterYearNumber(
            range.to
          );
      }

      /*
      * Historical date ranges match when they
      * overlap the requested period.
      */
      return (
        fileInterval.from
          <= filterTo

        && fileInterval.to
          >= filterFrom
      );
    }

    function archiveFileMatchesFilters(
      file,
      filters,
      query
    ) {
      if (
        filters.sourceId
        && !archiveFilesForSource(filters.sourceId)
          .some(linkedFile => linkedFile.id === file.id)
      ) {
        return false;
      }
      if (
        query
        && !archiveSearchText(
          file
        ).includes(query)
      ) {
        return false;
      }

      if (
        filters.fileType !== 'all'
        && archiveFileKind(file)
          !== filters.fileType
      ) {
        return false;
      }

      if (
        filters.connections === 'linked'
        && !archiveFileHasLinks(file)
      ) {
        return false;
      }

      if (
        filters.connections === 'unlinked'
        && archiveFileHasLinks(file)
      ) {
        return false;
      }

      if (
        filters.favouriteOnly
        && !file.favorite
      ) {
        return false;
      }

      if (
        filters.personIds.length
        && !archiveFilePersonIds(file)
          .some(personId =>
            filters.personIds.includes(
              personId
            )
          )
      ) {
        return false;
      }

      if (
        filters.placeIds.length
        && !archiveFilePlaceIds(file)
          .some(placeId =>
            filters.placeIds.includes(
              placeId
            )
          )
      ) {
        return false;
      }

      if (
        !archiveDocumentYearMatches(
          file,
          filters.documentYears
        )
      ) {
        return false;
      }

      return true;
    }

    function archiveSortFilteredFiles(
      files
    ) {
      return appSortRecords(files, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
          name: {
            type:
              'text',

            get:
              file => file.name
          },

          updated: {
            type:
              'number',

            get:
              file =>
                appSortTimestamp(
                  file.updatedAt
                )
          },

          added: {
            type:
              'number',

            get:
              file =>
                appSortTimestamp(
                  file.addedAt
                )
          },

          type: {
            type:
              'text',

            get:
              archiveFileTypeLabel
          }
        },

        getFallback:
          file => file.name
      });
    }

    function archiveMatchingFiles() {
      const filters =
        archiveEffectiveFileFilters();

      const query =
        String(
          state.archiveSearch || ''
        )
          .trim()
          .toLocaleLowerCase(
            state.language === 'ru'
              ? 'ru'
              : 'en'
          );

      /*
      * Without a filter, Archive remains ordinary
      * direct-folder browsing.
      */
      if (
        !archiveFileFilteringActive(
          filters
        )
      ) {
        return archiveSortFilteredFiles(
          archiveProjectFiles()
            .filter(file =>
              archiveFileFolderId(
                file
              ) ===
              archiveNormalizeFolderId(
                state.archiveSelectedFolderId
              )
            )
        );
      }

      let files =
        archiveProjectFiles();

      if (filters.scope === 'folder') {
        const scopeRoot =
          archiveNormalizeFolderId(
            state.archiveFilterScopeFolderId
          );

        const scopeIds =
          archiveFolderScopeIds(
            scopeRoot
          );

        files =
          files.filter(file =>
            scopeIds.has(
              archiveFileFolderId(
                file
              )
            )
          );
      }

      return archiveSortFilteredFiles(
        files.filter(file =>
          archiveFileMatchesFilters(
            file,
            filters,
            query
          )
        )
      );
    }

    function archiveFolderMatchProjection(
      matchingFiles =
        archiveMatchingFiles()
    ) {
      const visibleFolderIds =
        new Set();

      const matchingCountByFolder =
        new Map();

      const filters =
        archiveEffectiveFileFilters();

      const scopeRoot =
        filters.scope === 'folder'
          ? archiveNormalizeFolderId(
              state.archiveFilterScopeFolderId
            )
          : null;

      matchingFiles.forEach(file => {
        let folderId =
          archiveFileFolderId(
            file
          );

        while (folderId) {
          visibleFolderIds.add(
            folderId
          );

          matchingCountByFolder.set(
            folderId,
            (
              matchingCountByFolder.get(
                folderId
              )
              || 0
            ) + 1
          );

          if (
            scopeRoot
            && folderId === scopeRoot
          ) {
            break;
          }

          const folder =
            archiveFolderById(
              folderId
            );

          folderId =
            archiveFolderParentId(
              folder
            );
        }
      });

      return {
        visibleFolderIds,
        matchingCountByFolder
      };
    }

    function archiveVisibleFiles(
      matchingFiles =
        archiveMatchingFiles()
    ) {
      if (
        !archiveFileFilteringActive()
        || state.archiveFilterPresentation
          === 'flat'
      ) {
        return matchingFiles;
      }

      const folderId =
        archiveNormalizeFolderId(
          state.archiveSelectedFolderId
        );

      return matchingFiles.filter(file =>
        archiveFileFolderId(
          file
        ) === folderId
      );
    }

    function archiveVisibleChildFolders(
      matchingFiles =
        archiveMatchingFiles()
    ) {
      if (
        !archiveFileFilteringActive()
      ) {
        return archiveFolderChildren(
          archiveNormalizeFolderId(
            state.archiveSelectedFolderId
          )
        );
      }

      if (
        state.archiveFilterPresentation
          === 'flat'
      ) {
        return [];
      }

      const projection =
        archiveFolderMatchProjection(
          matchingFiles
        );

      return archiveFolderChildren(
        archiveNormalizeFolderId(
          state.archiveSelectedFolderId
        )
      ).filter(folder =>
        projection.visibleFolderIds.has(
          folder.id
        )
      );
    }

    function archiveSourceConnectedSearchText(
      source
    ) {
      if (!source) {
        return '';
      }

      return sourceLinksForSource(
        source.id,
        '',
        source.projectId
      )
        .flatMap(link => {
          const record =
            sourceTargetRecord(
              link.targetType,
              link.targetId,
              link.projectId
            );

          const config =
            archiveEntityConfig(
              link.targetType
            );

          if (!record || !config) {
            return [];
          }

          return [
            config.title,
            config.singular,
            config.label(
              record
            ),
            config.meta(
              record
            )
          ];
        })
        .filter(Boolean)
        .join(' ');
    }

    function archiveSourceSearchText(
      source
    ) {
      return [
        source?.title,

        sourceCategoryLabel(
          source?.category,
          ''
        ),

        localizedSourceCategoryLabel(
          source?.category,
          ''
        ),

        source?.providedBy,
        source?.location,
        source?.reference,
        source?.url,
        source?.notes,

        archiveSourceConnectedSearchText(
          source
        )
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(
          state.language === 'ru'
            ? 'ru'
            : 'en'
        );
    }

    function archiveFilteredSources() {
      const query =
        String(
          state.archiveSearch || ''
        )
          .trim()
          .toLocaleLowerCase(
            state.language === 'ru'
              ? 'ru'
              : 'en'
          );

      let sources =
        archiveProjectSources();

      const targetFilter =
        currentArchiveSourceTargetFilter();

      if (targetFilter) {
        const connectedSourceIds =
          new Set(
            sourceIdsForTarget(
              targetFilter.targetType,
              targetFilter.targetId,
              targetFilter.projectId
            )
          );

        sources =
          sources.filter(source =>
            connectedSourceIds.has(
              source.id
            )
          );
      }

      if (
        state.archiveSourceCategoryFilter
        && state.archiveSourceCategoryFilter
          !== 'all'
      ) {
        sources =
          sources.filter(source =>
            source.category
              === state
                .archiveSourceCategoryFilter
          );
      }
      if (
        state.archiveSourceConnectionFilter
          === 'linked'
      ) {
        sources =
          sources.filter(source =>
            archiveSourceConnectionCount(
              source
            ) > 0
          );
      }

      if (
        state.archiveSourceConnectionFilter
          === 'unlinked'
      ) {
        sources =
          sources.filter(source =>
            archiveSourceConnectionCount(
              source
            ) === 0
          );
      }
      if (
        state.archiveSourceFavouriteOnly
      ) {
        sources =
          sources.filter(source =>
            source.favorite
          );
      }

      if (query) {
        sources =
          sources.filter(source =>
            archiveSourceSearchText(
              source
            ).includes(
              query
            )
          );
      }

      return appSortRecords(
        sources,
        {
          field:
            state.archiveSourceSort,

          direction:
            state.archiveSourceSortDirection,

          extractors: {
            name: {
              type:
                'text',

              get:
                source =>
                  source.title
            },

            updated: {
              type:
                'number',

              get:
                source =>
                  appSortTimestamp(
                    source.updatedAt
                  )
            },

            created: {
              type:
                'number',

              get:
                source =>
                  appSortTimestamp(
                    source.createdAt
                  )
            }
          },

          getFallback:
            source =>
              source.title
        }
      );
    }

    function ensureArchiveSelection() {
      state.archiveSelectedFolderId =
        archiveNormalizeFolderId(
          state.archiveSelectedFolderId
        );

      state.archiveSelectedFileIds =
        archiveUniqueIds(
          state.archiveSelectedFileIds
        )
          .filter(id =>
            archiveFileById(
              id
            )
          );

      if (
        (
          state.archiveView
            === 'files'
          || state.archiveView
            === 'favorites'
        )
        && state.archiveSelectedFileId
        && !archiveFileById(
          state.archiveSelectedFileId
        )
      ) {
        state.archiveSelectedFileId =
          null;
      }

      /*
        A selected folder item is valid only when
        it is a direct child of the current Files
        location and folders are actually visible.
      */
      const selectedFolderItem =
        archiveFolderById(
          state.archiveSelectedFolderItemId
        );

      const currentFolderId =
        archiveNormalizeFolderId(
          state.archiveSelectedFolderId
        );

      const folderItemVisible =
        state.archiveView === 'files'
        && !archiveFileFilteringActive()
        && selectedFolderItem
        && archiveFolderParentId(
          selectedFolderItem
        ) === currentFolderId;

      if (
        !folderItemVisible
        || state.archiveSelectedFileId
      ) {
        state.archiveSelectedFolderItemId =
          null;
      }

      if (
        state.archiveView
          === 'sources'
        && state.archiveSelectedSourceId
        && !archiveSourceById(
          state.archiveSelectedSourceId
        )
      ) {
        state.archiveSelectedSourceId =
          null;
      }

      if (
        state.archiveView
          === 'sources'
      ) {
        state.archiveSelectedFolderItemId =
          null;
      }

      if (
        state.archiveView
          === 'sources'
        && !state.archiveSelectedSourceId
      ) {
        state.archiveSelectedSourceId =
          archiveFilteredSources()[0]?.id
          || null;
      }
    }

    function renderArchive() {
      workspace.classList.remove(
        'no-sidebar'
      );

      archivePruneNavigationHistory();
      ensureArchiveSelection();

      renderArchiveSidebar();
      renderArchiveMain();
    }

    function renderArchivePreservingSourceInspectorScroll() {
      if (
        state.archiveView !== 'sources'
        || !state.archiveSelectedSourceId
      ) {
        renderArchive();
        return;
      }

      const sourceId =
        state.archiveSelectedSourceId;

      const currentScroller =
        main.querySelector(
          '.archive-inspector-scroll'
        );

      const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

      renderArchive();

      requestAnimationFrame(() => {
        /*
          Do not restore an old position if rendering
          changed the selected Source or left Sources.
        */
        if (
          state.archiveView !== 'sources'
          || state.archiveSelectedSourceId
            !== sourceId
        ) {
          return;
        }

        const nextScroller =
          main.querySelector(
            '.archive-inspector-scroll'
          );

        if (!nextScroller) {
          return;
        }

        const maximumScrollTop =
          Math.max(
            0,
            nextScroller.scrollHeight
              - nextScroller.clientHeight
          );

        nextScroller.scrollTop =
          Math.min(
            previousScrollTop,
            maximumScrollTop
          );
      });
    }

    function renderArchivePreservingFileInspectorScroll() {
      if (
        !archiveIsLocationView(
          state.archiveView
        )
        || !state.archiveSelectedFileId
      ) {
        renderArchive();
        return;
      }

      const fileId =
        state.archiveSelectedFileId;

      const currentScroller =
        main.querySelector(
          '.archive-inspector-scroll'
        );

      const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

      renderArchive();

      requestAnimationFrame(() => {
        /*
          Do not restore the previous position if the
          selected file or Archive view changed while
          the inspector was rendering.
        */
        if (
          !archiveIsLocationView(
            state.archiveView
          )
          || state.archiveSelectedFileId
            !== fileId
        ) {
          return;
        }

        const nextScroller =
          main.querySelector(
            '.archive-inspector-scroll'
          );

        if (!nextScroller) {
          return;
        }

        const maximumScrollTop =
          Math.max(
            0,
            nextScroller.scrollHeight
              - nextScroller.clientHeight
          );

        nextScroller.scrollTop =
          Math.min(
            previousScrollTop,
            maximumScrollTop
          );
      });
    }
    
    function renderArchiveSidebarNavItem(
      id,
      label,
      svg
    ) {
      const active =
        id === 'files'
          ? state.archiveView === 'files'
            && archiveIsRootLocation(
              state.archiveSelectedFolderId
            )
          : state.archiveView === id;

      return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-archive-view="${escapeHtml(id)}"
          aria-current="${
            active
              ? 'page'
              : 'false'
          }">

          ${svg}

          <span>
            ${escapeHtml(label)}
          </span>
        </button>
      `;
    }

    function renderArchiveFolderTree(
      parentId = null,
      depth = 0
    ) {
      const folders =
        archiveFolderChildren(
          parentId
        );

      return folders
        .map(folder => {
          const children =
            archiveFolderChildren(
              folder.id
            );

          const expanded =
            Boolean(
              state
                .archiveExpandedFolders[
                  folder.id
                ]
            );

          const active =
            folder.id
            === archiveNormalizeFolderId(
              state.archiveSelectedFolderId
            );

          return `
            <div
              role="treeitem"
              aria-selected="${
                active
                  ? 'true'
                  : 'false'
              }"
              ${
                children.length
                  ? `aria-expanded="${String(
                      expanded
                    )}"`
                  : ''
              }>

              <div
                class="
                  archive-folder-row
                  ${
                    active
                      ? 'active'
                      : ''
                  }
                "
                style="padding-left:${
                  Math.max(
                    4,
                    depth * 14 + 4
                  )
                }px">

                ${
                  children.length
                    ? `
                      <button
                        class="
                          archive-folder-toggle
                          ${
                            expanded
                              ? 'expanded'
                              : ''
                          }
                        "
                        type="button"
                        data-archive-toggle-folder="${escapeHtml(
                          folder.id
                        )}"
                        aria-label="${
                          expanded
                            ? 'Collapse'
                            : 'Expand'
                        } ${escapeHtml(
                          folder.name
                        )}">

                        ${icon.chevron}
                      </button>
                    `
                    : `
                      <span
                        aria-hidden="true">
                      </span>
                    `
                }

                <button
                  class="
                    archive-folder-main
                  "
                  type="button"
                  data-archive-folder="${escapeHtml(
                    folder.id
                  )}"
                  title="${escapeHtml(
                    folder.name
                  )}">

                  ${icon.folderyellow}

                  <span>
                    ${escapeHtml(
                      folder.name
                    )}
                  </span>
                </button>
              </div>

              ${
                children.length
                && expanded
                  ? `
                    <div role="group">
                      ${renderArchiveFolderTree(
                        folder.id,
                        depth + 1
                      )}
                    </div>
                  `
                  : ''
              }
            </div>
          `;
        })
        .join('');
    }

    function archiveRevealPendingFolderInSidebar() {
      const folderId =
        state.archivePendingTreeRevealId;

      if (!folderId) {
        return;
      }

      requestAnimationFrame(
        () => {
          const button =
            [
              ...sidebar.querySelectorAll(
                '[data-archive-folder]'
              )
            ].find(item =>
              item.dataset
                .archiveFolder
                === folderId
            );

          button?.scrollIntoView({
            block:
              'nearest',

            inline:
              'nearest'
          });

          state.archivePendingTreeRevealId =
            null;
        }
      );
    }

    function renderArchiveSourceFilters() {
      const sources =
        archiveProjectSources();

      const populatedCategories =
        SOURCE_CATEGORIES.filter(
          category =>
            sources.some(source =>
              source.category
                === category.value
            )
        );

      const button = ({
        value,
        label,
        active,
        title = ''
      }) => `
        <button
          class="
            archive-source-filter
            ${active ? 'active' : ''}
          "
          type="button"
          data-archive-source-filter="${escapeHtml(value)}"
          aria-pressed="${active ? 'true' : 'false'}"
          ${
            title
              ? `title="${escapeHtml(title)}"`
              : ''
          }>

          <span class="archive-source-filter-label">
            ${escapeHtml(label)}
          </span>
        </button>
      `;

      return `
        <div class="archive-source-browser">
          <div
            class="archive-source-filter-list"
            role="group"
            aria-label="Browse sources">

            ${button({
              value:
                'all',

              label:
                'All sources',

              active:
                state.archiveSourceCategoryFilter
                  === 'all'
            })}
          </div>

          ${
            populatedCategories.length
              ? `
                <div>
                  <div class="side-section-title">
                    Source categories
                  </div>

                  <div
                    class="archive-source-filter-list"
                    role="group"
                    aria-label="Source categories">

                    ${populatedCategories
                      .map(category =>
                        button({
                          value:
                            category.value,

                          label:
                            category.shortLabel,

                          title:
                            category.label,

                          active:
                            state
                              .archiveSourceCategoryFilter
                              === category.value
                        })
                      )
                      .join('')}
                  </div>
                </div>
              `
              : ''
          }
        </div>
      `;
    }

    function openArchiveCreateFolderFromTrigger(
      button
    ) {
      const parentId =
        button?.dataset
          .archiveParentFolder
        || state.archiveSelectedFolderId;

      runAfterArchiveFileEditGuard(
        () => {
          openArchiveCreateFolderModal(
            parentId
          );
        }
      );
    }

    function renderArchiveSidebar() {
      const sourceView =
        state.archiveView
          === 'sources';
        sidebar.innerHTML = `
          <nav
            class="archive-sidebar"
            aria-label="Archive navigation">

            <section class="archive-sidebar-section">
              <div class="side-section-title">
                Navigation
              </div>

              <div class="side-nav">
                ${renderArchiveSidebarNavItem(
                  'files',
                  ARCHIVE_ROOT_LABEL,
                  icon.folder
                )}

                ${renderArchiveSidebarNavItem(
                  'favorites',
                  'Favourites',
                  icon.star
                )}

                ${renderArchiveSidebarNavItem(
                  'sources',
                  'Sources',
                  icon.archive
                )}
              </div>
            </section>

            <section
              class="
                archive-sidebar-section
                archive-sidebar-tree-section
              ">

              <div
                class="
                  side-section-title
                  ${
                    sourceView
                      ? ''
                      : 'with-add'
                  }
                ">

                <span>
                  ${
                    sourceView
                      ? 'Browse sources'
                      : 'Folders'
                  }
                </span>

                ${
                  sourceView
                    ? ''
                    : `
                      <button
                        class="side-add-button"
                        type="button"
                        data-archive-create-folder
                        aria-label="Create folder"
                        title="Create folder">

                        ${icon.plus}
                      </button>
                    `
                }
              </div>

              ${
                sourceView
                  ? renderArchiveSourceFilters()
                  : `
                    <div
                      class="
                        archive-folder-tree
                        archive-sidebar-folder-tree
                      "
                      role="tree"
                      aria-label="Archive folder tree">

                      ${renderArchiveFolderTree()}
                    </div>
                  `
              }
            </section>
          </nav>
        `;

      sidebar
        .querySelectorAll(
          '[data-archive-view]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const nextView =
                button.dataset
                  .archiveView;

            if (
              nextView === 'sources'
            ) {
              runAfterArchiveFileEditGuard(
                () => {
                  archiveRememberCurrentLocation();

                  state.archiveView =
                    'sources';

                  state.archiveSearch =
                    '';

                  state.archiveSelectedFileId =
                    null;

                  state.archiveSelectedFileIds =
                    [];

                  state.archiveInspectorCollapsed =
                    false;
                  state.archiveSourceTargetFilter = null;
                  ensureArchiveSelection();
                  renderArchive();
                }
              );

              return;
            }

              archiveNavigateToLocation({
                view:
                  nextView,

                folderId:
                  null,

                search:
                  '',

                fileFilters: {
                  ...archiveFileFiltersWithDefaults(
                    state.archiveFileFilters
                  ),

                  favouriteOnly:
                    nextView === 'favorites'
                },

                filterPresentation:
                  nextView === 'favorites'
                    ? 'flat'
                    : state.archiveFilterPresentation,

                filterScopeFolderId:
                  null,

                selectedFileId:
                  null,

                inspectorCollapsed:
                  false
              });
            }
          );
        });

    sidebar
      .querySelectorAll(
        '[data-archive-source-filter]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            const value =
              button.dataset
                .archiveSourceFilter;

            if (
              value !== 'all'
              && !SOURCE_CATEGORY_BY_VALUE
                .has(value)
            ) {
              return;
            }
            state.archiveSourceTargetFilter = null;
            state.archiveSourceCategoryFilter =
              value;

            state.archiveSelectedSourceId =
              null;

            renderArchive();
          }
        );
      });

    sidebar
      .querySelector(
        '[data-archive-create-folder]'
      )
      ?.addEventListener(
        'click',
        event => {
          event.stopPropagation();

          openArchiveCreateFolderFromTrigger(
            event.currentTarget
          );
        }
      );

      sidebar
        .querySelectorAll(
          '[data-archive-toggle-folder]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            event => {
              event.stopPropagation();

              const id =
                button.dataset
                  .archiveToggleFolder;

              state.archiveExpandedFolders[id] =
                !state
                  .archiveExpandedFolders[id];

              renderArchiveSidebar();
            }
          );
        });

      sidebar
        .querySelectorAll(
          '[data-archive-folder]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              archiveNavigateToLocation(
                {
                  view:
                    state.archiveView
                      === 'favorites'
                        ? 'favorites'
                        : 'files',

                  folderId:
                    button.dataset
                      .archiveFolder,

                  search:
                    '',

                  searchScope:
                    'folder',

                  personFilterId:
                    '',

                  selectedFileId:
                    null,

                  inspectorCollapsed:
                    false
                },
                {
                  expandCurrent:
                    true
                }
              );
            }
          );
        });

      localizeUI(
        sidebar
      );

      archiveRevealPendingFolderInSidebar();
    }

    function ensureArchiveVisibleSelection() {
      if (
        state.archiveView === 'sources'
      ) {
        const visibleSources =
          archiveFilteredSources();

        const visibleSourceIds =
          new Set(
            visibleSources.map(
              source =>
                source.id
            )
          );

        if (
          state.archiveSelectedSourceId
          && !visibleSourceIds.has(
            state.archiveSelectedSourceId
          )
        ) {
          state.archiveSelectedSourceId =
            visibleSources[0]?.id
            || null;
        }

        return;
      }

      const visibleFiles =
        archiveVisibleFiles();

      const visibleFileIds =
        new Set(
          visibleFiles.map(
            file =>
              file.id
          )
        );

      /*
        Do not retain hidden batch selections.
        Otherwise actions could affect files the
        user cannot currently see.
      */
      state.archiveSelectedFileIds =
        (
          state.archiveSelectedFileIds
          || []
        ).filter(
          fileId =>
            visibleFileIds.has(
              fileId
            )
        );

      if (
        state.archiveSelectedFileId
        && !visibleFileIds.has(
          state.archiveSelectedFileId
        )
      ) {
        state.archiveSelectedFileId =
          null;
      }
    }

    function renderArchiveMain() {
      ensureArchiveVisibleSelection();

      main.innerHTML = `
        <div
          class="
            archive-shell

            ${
              state.archiveInspectorCollapsed
                ? 'inspector-collapsed'
                : ''
            }

            ${
              archiveFileEditIsActive()
                ? 'file-editing'
                : ''
            }
          ">

          <section
            class="archive-main"
            aria-label="Archive workspace">

            ${
              state.archiveView
                === 'sources'
                  ? renderArchiveSourcesView()
                  : renderArchiveFilesView()
            }
          </section>

          ${
            state.archiveInspectorCollapsed
              ? renderArchiveInspectorCollapsed()
              : renderArchiveInspector()
          }
        </div>
      `;

      bindArchiveControls();
      localizeUI(main);
    }

    function renderArchivePageHead({
      title,
      subtitle,
      actions = ''
    }) {
      return `
        <header
          class="
            archive-page-head
          ">

          <div
            class="
              archive-page-head-copy
            ">

            <h1 class="app-page-title">
              ${escapeHtml(
                title
              )}
            </h1>

            <p>
              ${escapeHtml(
                subtitle
              )}
            </p>
          </div>

          ${
            actions
              ? `
                <div
                  class="
                    archive-page-actions
                  ">

                  ${actions}
                </div>
              `
              : ''
          }
        </header>
      `;
    }

    function archiveFilesViewSubtitle(
      currentFolder,
      person
    ) {
      if (person) {
        return `Files linked to ${
          personResourceDisplayName(
            person
          )
        }.`;
      }

      if (
        state.archiveView
          === 'favorites'
      ) {
        return currentFolder
          ? `Favourite files in ${
              currentFolder.name
            }.`
          : 'Files marked as favourites.';
      }

      if (!currentFolder) {
        return 'Organize your research files and folders.';
      }

      return `Browse files and subfolders in ${
        currentFolder.name
      }.`;
    }

    function renderArchiveFilesHeaderActions() {
      const favoritesView =
        state.archiveView
          === 'favorites';

      return `
        ${
          favoritesView
            ? ''
            : `
              <button
                class="
                  button secondary
                "
                type="button"
                data-archive-create-folder>

                ${icon.folder}
                New folder
              </button>
            `
        }

        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-files>

          ${icon.plus}
          Add files
        </button>
      `;
    }

    function archiveSourcesViewSubtitle() {
      return 'Document where your research files and information came from.';
    }

    function renderArchiveSourcesHeaderActions() {
      return `
        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-source>

          ${icon.plus}
          Add source
        </button>
      `;
    }

    function renderArchiveLocationButton(
      action,
      label,
      modifier,
      disabled
    ) {
      return `
        <button
          class="
            archive-location-button
            ${modifier}
          "
          type="button"
          data-archive-nav-${action}
          aria-label="${escapeHtml(
            label
          )}"
          title="${escapeHtml(
            label
          )}"
          ${
            disabled
              ? 'disabled aria-disabled="true"'
              : ''
          }>

          ${icon.arrow}
        </button>
      `;
    }

    function renderArchiveBreadcrumbs() {
      const folders =
        archiveFolderAncestors(
          state.archiveSelectedFolderId
        );

      const favoritesView =
        state.archiveView
          === 'favorites';

      const rootLabel =
        favoritesView
          ? 'Favourites'
          : ARCHIVE_ROOT_LABEL;

      const rootCurrent =
        !folders.length;

      return `
        <nav
          class="
            archive-breadcrumbs
          "
          aria-label="Folder path">

          <span
            class="
              archive-breadcrumb-leading-icon
            "
            aria-hidden="true">

            ${
              favoritesView
                ? icon.star
                : icon.folderyellow
            }
          </span>

          <ol>
            <li
              class="
                archive-breadcrumb-item
                archive-breadcrumb-item--root
              ">

              ${
                rootCurrent
                  ? `
                    <span
                      class="
                        archive-breadcrumb-current
                      "
                      aria-current="page"
                      title="${escapeHtml(
                        rootLabel
                      )}">

                      ${escapeHtml(
                        rootLabel
                      )}
                    </span>
                  `
                  : `
                    <button
                      type="button"
                      data-archive-breadcrumb-root
                      aria-label="Go to ${escapeHtml(
                        rootLabel
                      )} root"
                      title="${escapeHtml(
                        rootLabel
                      )}">

                      ${escapeHtml(
                        rootLabel
                      )}
                    </button>
                  `
              }
            </li>

            ${folders
              .map(
                (
                  folder,
                  index
                ) => {
                  const current =
                    index
                      === folders.length - 1;

                  return `
                    <li
                      class="
                        archive-breadcrumb-item
                        ${
                          current
                            ? 'archive-breadcrumb-item--current'
                            : 'archive-breadcrumb-item--middle'
                        }
                      ">

                      <span
                        class="
                          archive-breadcrumb-separator
                        "
                        aria-hidden="true">

                        ${icon.chevron}
                      </span>

                      ${
                        current
                          ? `
                            <span
                              class="
                                archive-breadcrumb-current
                              "
                              aria-current="page"
                              title="${escapeHtml(
                                folder.name
                              )}">

                              ${escapeHtml(
                                folder.name
                              )}
                            </span>
                          `
                          : `
                            <button
                              type="button"
                              data-archive-breadcrumb="${escapeHtml(
                                folder.id
                              )}"
                              aria-label="Open ${escapeHtml(
                                folder.name
                              )}"
                              title="${escapeHtml(
                                folder.name
                              )}">

                              ${escapeHtml(
                                folder.name
                              )}
                            </button>
                          `
                      }
                    </li>
                  `;
                }
              )
              .join('')}
          </ol>
        </nav>
      `;
    }

    function renderArchiveLocationRow() {
      return `
        <div
          class="
            archive-location-row
          ">

          <div
            class="
              archive-location-controls
            "
            role="toolbar"
            aria-label="Folder navigation">

            ${renderArchiveLocationButton(
              'back',
              'Go back',
              'archive-location-button--back',
              !archiveNavigationCanGoBack()
            )}

            ${renderArchiveLocationButton(
              'forward',
              'Go forward',
              'archive-location-button--forward',
              !archiveNavigationCanGoForward()
            )}

            ${renderArchiveLocationButton(
              'up',
              'Go up one level',
              'archive-location-button--up',
              !archiveNavigationCanGoUp()
            )}
          </div>

          ${renderArchiveBreadcrumbs()}
        </div>
      `;
    }

    function renderArchiveFilterResultsBar(
      matchingCount
    ) {
      if (
        !archiveFileFilteringActive()
      ) {
        return '';
      }

      const fileLabel =
        `${matchingCount} ${
          matchingCount === 1
            ? 'file'
            : 'files'
        }`;

      return `
        <div
          class="archive-filter-results-bar">

          <strong>
            ${escapeHtml(fileLabel)}
          </strong>

          <div
            class="archive-filter-presentation"
            role="group"
            aria-label="Filtered result layout">

            <button
              type="button"
              class="${
                state.archiveFilterPresentation
                  === 'flat'
                    ? 'active'
                    : ''
              }"
              data-archive-filter-presentation="flat"
              aria-pressed="${
                state.archiveFilterPresentation
                  === 'flat'
              }">

              Files only
            </button>

            <button
              type="button"
              class="${
                state.archiveFilterPresentation
                  === 'folders'
                    ? 'active'
                    : ''
              }"
              data-archive-filter-presentation="folders"
              aria-pressed="${
                state.archiveFilterPresentation
                  === 'folders'
              }">

              Folder structure
            </button>
          </div>
        </div>
      `;
    }

    function renderArchiveSelectionBar(files) {
      const selected = state.archiveSelectedFileIds.filter(id => archiveFileById(id));
      if (!selected.length) return '';
      const allFavorite = selected.every(id => archiveFileById(id)?.favorite);
      return `<div class="archive-selection-bar"><strong>${selected.length} ${selected.length === 1 ? 'file' : 'files'} selected</strong><div class="archive-selection-actions">
        <button class="button secondary" type="button" data-archive-selection-action="move">Move</button>
        <button class="button secondary" type="button" data-archive-selection-action="links">Add links</button>
        <button class="button secondary" type="button" data-archive-selection-action="favorite">${allFavorite ? 'Remove from favourites' : 'Add to favourites'}</button>
        <button class="button danger" type="button" data-archive-selection-action="delete">Delete permanently</button>
        <button class="button ghost" type="button" data-archive-selection-action="clear">Cancel</button>
      </div></div>`;
    }

    function archiveSortFoldersForTable(
      folders
    ) {
      return appSortRecords(folders, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
          name: {
            type: 'text',
            get: folder =>
              folder.name
          },

          updated: {
            type: 'number',
            get: folder =>
              appSortTimestamp(
                folder.updatedAt
                || folder.createdAt
              )
          },

          added: {
            type: 'number',
            get: folder =>
              appSortTimestamp(
                folder.createdAt
              )
          },

          /*
          * All these records have the same type.
          * The fallback name determines their
          * order within the Folder group.
          */
          type: {
            type: 'text',
            get: () => 'Folder'
          }
        },

        getFallback:
          folder => folder.name
      });
    }

    function renderArchiveTableGroupRow(
      label
    ) {
      return `
        <tr
          class="
            archive-table-group-row
          ">

          <th
            scope="rowgroup"
            colspan="7">

            ${escapeHtml(
              label
            )}
          </th>
        </tr>
      `;
    }

    function renderArchiveFolderTableRow(
      folder,
      matchingFileCount = null
    ) {
      const directFiles =
        archiveProjectFiles()
          .filter(file =>
            archiveFileFolderId(
              file
            ) === folder.id
          )
          .length;

      const childFolders =
        archiveFolderChildren(
          folder.id
        ).length;

      const filtering =
        Number.isFinite(
          matchingFileCount
        );

      const itemCount =
        filtering
          ? matchingFileCount
          : directFiles
            + childFolders;

      const itemLabel =
        filtering
          ? `${itemCount} ${
              itemCount === 1
                ? 'matching file'
                : 'matching files'
            }`
          : `${itemCount} ${
              itemCount === 1
                ? 'item'
                : 'items'
            }`;

      const detailSelected =
        state.archiveSelectedFolderItemId
          === folder.id;

      return `
        <tr
          class="
            archive-table-folder-row

            ${
              detailSelected
                ? 'selected-detail'
                : ''
            }
          "
          data-archive-folder-row="${escapeHtml(
            folder.id
          )}"
          tabindex="0">

          <td></td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon({
                kind:
                  'folder'
              })}

              <div
                class="
                  archive-name-copy
                ">
                <div
                  class="
                    archive-folder-name-line
                  ">

                  <strong
                    title="${escapeHtml(
                      folder.name
                    )}">

                    ${escapeHtml(
                      folder.name
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </td>

          <td>
            Folder
          </td>

          <td>
            ${escapeHtml(
              itemLabel
            )}
          </td>

          <td>
            ${escapeHtml(
              archiveFormatDate(
                folder.updatedAt
                || folder.createdAt
              )
            )}
          </td>

          <td></td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="folder"
              data-archive-row-id="${escapeHtml(
                folder.id
              )}"
              aria-label="Folder actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
    }

    function archiveVisibleSelectionState(
      files =
        archiveVisibleFiles()
    ) {
      const visibleIds =
        (
          Array.isArray(
            files
          )
            ? files
            : []
        )
          .map(file =>
            file?.id
          )
          .filter(Boolean);

      const selectedIds =
        new Set(
          state.archiveSelectedFileIds
          || []
        );

      const selectedVisibleIds =
        visibleIds.filter(id =>
          selectedIds.has(
            id
          )
        );

      return {
        visibleIds,

        selectedVisibleIds,

        allVisibleSelected:
          visibleIds.length > 0
          && selectedVisibleIds.length
            === visibleIds.length,

        someVisibleSelected:
          selectedVisibleIds.length > 0
      };
    }

    function toggleAllVisibleArchiveFiles(
      files =
        archiveVisibleFiles()
    ) {
      const selection =
        archiveVisibleSelectionState(
          files
        );

      const selectedIds =
        new Set(
          state.archiveSelectedFileIds
          || []
        );

      selection.visibleIds
        .forEach(id => {
          if (
            selection.allVisibleSelected
          ) {
            selectedIds.delete(
              id
            );
          } else {
            selectedIds.add(
              id
            );
          }
        });

      state.archiveSelectedFileIds = [
        ...selectedIds
      ];

      renderArchiveMain();
    }

    function toggleArchiveFileSelection(
      fileId
    ) {
      const file =
        archiveFileById(
          fileId
        );

      if (!file) {
        return;
      }

      const selectedIds =
        new Set(
          state.archiveSelectedFileIds
          || []
        );

      if (
        selectedIds.has(
          file.id
        )
      ) {
        selectedIds.delete(
          file.id
        );
      } else {
        selectedIds.add(
          file.id
        );
      }

      state.archiveSelectedFileIds = [
        ...selectedIds
      ];

      /*
        Match Albums: selecting through the checkbox
        also makes that record the inspector item.
      */
      
      state.archiveSelectedFolderItemId = null;
      state.archiveSelectedFileId =
        file.id;

      state.archiveInspectorCollapsed =
        false;

      renderArchiveMain();
    }

    function renderArchiveFileTableRow(
      file,
      showPath = false
    ) {
      const detailSelected =
        state.archiveSelectedFileId
          === file.id;

      const checked =
        state.archiveSelectedFileIds
          .includes(
            file.id
          );

      const secondaryLabel =
        showPath
          ? archiveFolderPath(
              file.folderId
            )
          : (
              file.description
              || archiveFolderPath(
                file.folderId
              )
            );

      return `
        <tr
          class="
            ${
              detailSelected
                ? 'selected-detail'
                : ''
            }

            ${
              checked
                ? 'is-checked'
                : ''
            }
          "
          data-archive-file-row="${escapeHtml(
            file.id
          )}"
          tabindex="0"
          aria-selected="${String(
            checked
          )}">

          <td
            class="
              archive-col-check
            ">

            <input
              class="
                albums-select-checkbox
              "
              type="checkbox"
              data-archive-file-checkbox="${escapeHtml(
                file.id
              )}"
              ${
                checked
                  ? 'checked'
                  : ''
              }
              aria-label="${escapeHtml(
                `${
                  checked
                    ? 'Deselect'
                    : 'Select'
                } ${file.name}`
              )}">
          </td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon(
                file
              )}

              <div
                class="
                  archive-name-copy
                ">

                <strong
                  title="${escapeHtml(
                    file.name
                  )}">

                  ${escapeHtml(
                    file.name
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    secondaryLabel
                  )}
                </span>
              </div>
            </div>
          </td>

          <td>
            ${escapeHtml(
              archiveFileTypeLabel(
                file
              )
            )}
          </td>

          <td>
            ${escapeHtml(
              file.size
              || '—'
            )}
          </td>

          <td>
            ${escapeHtml(
              archiveFormatDate(
                file.updatedAt,
                file.updated
                || 'Unknown'
              )
            )}
          </td>

          <td
            style="
              text-align:
                center;
            ">

            <button
              class="
                archive-row-icon-button
                ${
                  file.favorite
                    ? 'active'
                    : ''
                }
              "
              type="button"
              data-archive-toggle-favorite="${escapeHtml(
                file.id
              )}"
              aria-label="${
                file.favorite
                  ? 'Remove from favourites'
                  : 'Add to favourites'
              }">

              ${icon.star}
            </button>
          </td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="file"
              data-archive-row-id="${escapeHtml(
                file.id
              )}"
              aria-label="File actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
    }

    function renderArchiveFileTable(
      files,
      folders,
      {
        showPaths =
          false,

        matchingCountByFolder =
          new Map()
      } = {}
    ) {
      const sortedFolders =
        archiveSortFoldersForTable(
          folders
        );

      const showGroupLabels =
        Boolean(
          sortedFolders.length
          && files.length
        );

      const folderRows = `
        ${
          showGroupLabels
            ? renderArchiveTableGroupRow(
                'Folders'
              )
            : ''
        }

        ${sortedFolders
          .map(folder =>
            renderArchiveFolderTableRow(
              folder,
              matchingCountByFolder.has(
                folder.id
              )
                ? matchingCountByFolder.get(
                    folder.id
                  )
                : null
            )
          )
          .join('')}
      `;

      const fileRows = `
        ${
          showGroupLabels
            ? renderArchiveTableGroupRow(
                'Files'
              )
            : ''
        }

        ${files
          .map(file =>
            renderArchiveFileTableRow(
              file,
              showPaths
            )
          )
          .join('')}
      `;

      return `
        <div
          class="
            archive-table-wrap
          ">

          <table
            class="
              archive-table
            "
            aria-label="Archive files and folders">

            <thead>
              <tr>
                <th
                  class="
                    archive-col-check
                  ">

                <input
                  class="
                    albums-select-checkbox
                  "
                  type="checkbox"
                  data-archive-select-all
                  aria-label="Select all visible files">
                </th>

                <th
                  class="
                    archive-col-name
                  ">
                  Name
                </th>

                <th
                  class="
                    archive-col-type
                  ">
                  Type
                </th>

                <th
                  class="
                    archive-col-size
                  ">
                  Size / Items
                </th>

                <th
                  class="
                    archive-col-modified
                  ">
                  Modified
                </th>

                <th
                  class="
                    archive-col-favorite
                  "
                  aria-label="Favourite">

                  ${icon.star}
                </th>

                <th
                  class="
                    archive-col-actions
                  ">
                </th>
              </tr>
            </thead>

            <tbody>
              ${folderRows}
              ${fileRows}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderArchiveEmpty(
      title,
      copy,
      action = ''
    ) {
      return `
        <div class="archive-empty">
          <div>
            <h2>
              ${escapeHtml(
                title
              )}
            </h2>

            <p>
              ${escapeHtml(
                copy
              )}
            </p>

            ${action}
          </div>
        </div>
      `;
    }

    function renderArchiveFileDropzone(
      folder = null
    ) {
      const folderName =
        folder?.name
        || 'Files';

      return `
        <button
          class="
            archive-empty
            archive-empty-dropzone
          "
          type="button"
          data-archive-empty-add-files
          aria-label="${escapeHtml(
            `Add files to ${folderName}`
          )}">

          <span
            class="
              archive-empty-dropzone-content
            ">

            <span
              class="
                archive-empty-dropzone-icon
              "
              aria-hidden="true">

              ${icon.import}
            </span>

            <strong
              class="
                archive-empty-dropzone-title
              ">

              Drop files here
            </strong>

            <span
              class="
                archive-empty-dropzone-copy
              ">

              ${escapeHtml(
                folder
                  ? `Drop files here to add them to “${folder.name}”, or click to choose files.`
                  : 'Drop files here to add them to Archive, or click to choose files.'
              )}
            </span>

            <span
              class="
                archive-empty-dropzone-action
              ">

              Click to choose files
            </span>
          </span>
        </button>
      `;
    }

    function renderArchiveFilesView() {
      const matchingFiles =
        archiveMatchingFiles();

      const files =
        archiveVisibleFiles(
          matchingFiles
        );

      const folders =
        archiveVisibleChildFolders(
          matchingFiles
        );

      const projection =
        archiveFolderMatchProjection(
          matchingFiles
        );

      const filtering =
        archiveFileFilteringActive();

      const flatResults =
        filtering
        && state.archiveFilterPresentation
          === 'flat';

      const currentFolder =
        archiveFolderById(
          state.archiveSelectedFolderId
        );

      const title =
        state.archiveView
          === 'favorites'
            ? 'Favourites'
            : currentFolder
              ? 'Files'
              : ARCHIVE_ROOT_LABEL;

      const subtitle =
        filtering
          ? 'Browse files matching the active filters.'
          : archiveFilesViewSubtitle(
              currentFolder
            );

      const hasRows =
        files.length
        || folders.length;

      const emptyTitle =
        flatResults
          ? 'No files match these filters.'
          : 'No folders contain matching files.';

      const emptyCopy =
        'Change or clear the active filters and try again.';

      return `
        <div class="archive-page">
          ${renderArchivePageHead({
            title,
            subtitle,
            actions:
              renderArchiveFilesHeaderActions()
          })}

          ${renderArchiveToolbar()}

          ${renderArchiveActiveFilterbar()}

          ${renderArchiveFilterResultsBar(
            matchingFiles.length
          )}

          ${
            flatResults
              ? ''
              : renderArchiveLocationRow()
          }

          ${renderArchiveSelectionBar(
            files
          )}

          ${
            hasRows
              ? renderArchiveFileTable(
                  files,
                  folders,
                  {
                    showPaths:
                      flatResults,

                    matchingCountByFolder:
                      projection
                        .matchingCountByFolder
                  }
                )
              : filtering
                ? renderArchiveEmpty(
                    emptyTitle,
                    emptyCopy
                  )
                : renderArchiveFileDropzone(
                    currentFolder
                  )
          }
        </div>
      `;
    }

    function archiveToolbarIsSources() {
      return state.archiveView
        === 'sources';
    }

    function archiveToolbarFilterCount() {
      if (
        archiveToolbarIsSources()
      ) {
        return [
          state.archiveSourceCategoryFilter
            && state.archiveSourceCategoryFilter
              !== 'all',

          state.archiveSourceConnectionFilter
            && state.archiveSourceConnectionFilter
              !== 'all',

          state.archiveSourceFavouriteOnly
        ]
          .filter(Boolean)
          .length;
      }

      return [
        Boolean(
          currentArchiveSourceTargetFilter()
        ),
        state.archiveSearchScope
          === 'all',

        state.archiveFileTypeFilter
          && state.archiveFileTypeFilter
            !== 'all',

        state.archiveLinkFilter
          && state.archiveLinkFilter
            !== 'all'
      ]
        .filter(Boolean)
        .length;
    }

    function archiveToolbarSearchPlaceholder() {
      if (
        archiveToolbarIsSources()
      ) {
        return 'Search sources...';
      }

      if (
        state.archiveView
          === 'favorites'
      ) {
        return state.archiveSearchScope
          === 'all'
            ? 'Search favourite files'
            : 'Search favourites in this folder';
      }

      return state.archiveSearchScope
        === 'all'
          ? 'Search all files...'
          : 'Search this folder...';
    }

    function renderArchiveToolbar() {
      const sourcesView =
        archiveToolbarIsSources();

      const activeFilterCount =
        archiveToolbarFilterCount();

      const searchPlaceholder =
        archiveToolbarSearchPlaceholder();

      return `
        <div
          class="
            archive-toolbar
          "
          aria-label="${
            sourcesView
              ? 'Source controls'
              : 'File controls'
          }">

          <div
            class="
              archive-toolbar-left
            ">

            <label
              class="
                app-search-field
              "
              aria-label="${
                sourcesView
                  ? 'Search sources'
                  : 'Search files'
              }">

              ${icon.search}

              <input
                id="archiveSearch"
                type="search"
                data-archive-search
                value="${escapeHtml(
                  state.archiveSearch
                  || ''
                )}"
                placeholder="${escapeHtml(
                  searchPlaceholder
                )}">
            </label>
          </div>

          <div
            class="
              archive-toolbar-right
            ">

            <button
              class="
                module-filter-button
                ${
                  activeFilterCount
                    ? 'active'
                    : ''
                }
              "
              type="button"
              id="archiveFilterButton"
              aria-label="${
                activeFilterCount
                  ? `Filters, ${activeFilterCount} active`
                  : sourcesView
                    ? 'Open source filters'
                    : 'Open file filters'
              }"
              aria-expanded="false">

              <span
                class="
                  module-filter-icon
                "
                aria-hidden="true">

                ${
                  activeFilterCount
                    ? icon.filterclear
                    : icon.filter
                }
              </span>

              <span>
                Filters
              </span>

              ${
                activeFilterCount
                  ? `
                    <span
                      class="
                        module-filter-count
                      ">

                      ${activeFilterCount}
                    </span>
                  `
                  : ''
              }
            </button>
            ${renderAppSortControl({
              id: 'archiveSort',
              field:
                sourcesView
                  ? state.archiveSourceSort
                  : state.archiveFileSort,
              direction:
                sourcesView
                  ? state.archiveSourceSortDirection
                  : state.archiveFileSortDirection,
              ariaLabel:
                sourcesView
                  ? 'Sort sources'
                  : 'Sort files',
              options:
                sourcesView
                  ? APP_SORT_OPTIONS.archiveSources
                  : APP_SORT_OPTIONS.archiveFiles
            })}
          </div>
        </div>
      `;
    }

    let archiveFilterReturnFocus =
      null;

    function closeArchiveFilterPopover({
      restoreFocus =
        false
    } = {}) {
      document
        .getElementById(
          'archiveFilterPopover'
        )
        ?.remove();

      document.removeEventListener(
        'click',
        closeArchiveFilterOnOutside
      );

      document.removeEventListener(
        'keydown',
        closeArchiveFilterOnEscape
      );

      if (
        restoreFocus
        && archiveFilterReturnFocus
          ?.isConnected
      ) {
        archiveFilterReturnFocus.focus({
          preventScroll:
            true
        });
      }

      archiveFilterReturnFocus =
        null;
    }

    function closeArchiveFilterOnOutside(
      event
    ) {
      const panel =
        document.getElementById(
          'archiveFilterPopover'
        );

      const trigger =
        document.getElementById(
          'archiveFilterButton'
        );

      if (!panel) {
        return;
      }

      const path =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

      const insidePanel =
        path.length
          ? path.includes(panel)
          : panel.contains(
              event.target
            );

      const insideTrigger =
        path.length
          ? path.includes(trigger)
          : trigger?.contains(
              event.target
            );

      if (
        insidePanel
        || insideTrigger
      ) {
        return;
      }

      closeArchiveFilterPopover();
    }

    function closeArchiveFilterOnEscape(
      event
    ) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();

      closeArchiveFilterPopover({
        restoreFocus:
          true
      });
    }

    function openArchiveFilterPopover(
      anchor
    ) {
      closeArchiveFilterPopover();
      closeAlbumsFilterPopover();
      closePeopleFilterPopover();
      closeMenu();

      archiveFilterReturnFocus =
        anchor;

      const sourcesView =
        archiveToolbarIsSources();

      const schema =
        sourcesView
          ? archiveSourceFilterSchema
          : archiveFileFilterSchema;

      const values =
        sourcesView
          ? {
              sourceCategory:
                state.archiveSourceCategoryFilter
                || 'all',

              sourceConnections:
                state.archiveSourceConnectionFilter
                || 'all',

              sourceFavouriteOnly:
                Boolean(
                  state.archiveSourceFavouriteOnly
                )
            }
          : archiveFileFiltersWithDefaults();

      const prefix =
        sourcesView
          ? 'archive-source-filter'
          : 'archive-file-filter';

      const panel =
        document.createElement(
          'div'
        );

      panel.className =
        'shared-filter-panel archive-shared-filter-popover';

      panel.id =
        'archiveFilterPopover';

      panel.setAttribute(
        'role',
        'dialog'
      );

      panel.setAttribute(
        'aria-label',
        translateText(
          sourcesView
            ? 'Filter sources'
            : 'Filter files'
        )
      );

      panel.innerHTML = `
        <div class="shared-filter-panel-header">
          <div>
            <h3>
              ${
                sourcesView
                  ? 'Filter sources'
                  : 'Filter files'
              }
            </h3>

            <p>
              ${
                sourcesView
                  ? 'Narrow sources by category, connection status, or favourite status.'
                  : 'Filter files across Archive and choose how results are displayed.'
              }
            </p>
          </div>

          <button
            class="shared-filter-panel-close"
            type="button"
            aria-label="Close"
            data-archive-filter-close>

            ${icon.close}
          </button>
        </div>

        <div class="shared-filter-panel-body">
          ${renderSharedFilterFields({
            schema,
            values,
            prefix
          })}
        </div>

        <div class="shared-filter-panel-footer">
          <button
            class="link"
            type="button"
            data-archive-filter-reset>

            Clear filters
          </button>

          <div class="shared-filter-panel-actions">
            <button
              class="button secondary"
              type="button"
              data-archive-filter-cancel>

              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-archive-filter-apply>

              Apply filters
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(
        panel
      );

      localizeUI(panel);

      const controller =
        bindSharedFilterFields(
          panel,
          {
            schema,
            values,
            prefix
          }
        );

      panel
        .querySelector(
          '[data-archive-filter-reset]'
        )
        ?.addEventListener(
          'click',
          () => {
            controller?.reset();
          }
        );

      panel
        .querySelector(
          '[data-archive-filter-close]'
        )
        ?.addEventListener(
          'click',
          () => {
            closeArchiveFilterPopover({
              restoreFocus:
                true
            });
          }
        );

      panel
        .querySelector(
          '[data-archive-filter-cancel]'
        )
        ?.addEventListener(
          'click',
          () => {
            closeArchiveFilterPopover({
              restoreFocus:
                true
            });
          }
        );

      panel
        .querySelector(
          '[data-archive-filter-apply]'
        )
        ?.addEventListener(
          'click',
          () => {
            const errors =
              controller?.getErrors()
              || [];

            if (errors.length) {
              controller
                ?.focusFirstInvalid();

              return;
            }

            const nextValues =
              controller?.getValues()
              || values;

            if (sourcesView) {
              state.archiveSourceCategoryFilter =
                nextValues.sourceCategory
                || 'all';

              state.archiveSourceConnectionFilter =
                nextValues.sourceConnections
                || 'all';

              state.archiveSourceFavouriteOnly =
                Boolean(
                  nextValues
                    .sourceFavouriteOnly
                );

              state.archiveSelectedSourceId =
                null;
            } else {
              const wasFiltering =
                archiveFileFilteringActive();

              state.archiveFileFilters =
                archiveFileFiltersWithDefaults(
                  nextValues
                );

              state.archiveFilterScopeFolderId =
                nextValues.scope === 'folder'
                  ? archiveNormalizeFolderId(
                      state.archiveSelectedFolderId
                    )
                  : null;

              if (
                state.archiveView
                  === 'favorites'
                && !nextValues
                  .favouriteOnly
              ) {
                state.archiveView =
                  'files';
              }

              /*
              * Start a newly filtered hierarchy at
              * its logical root.
              */
              if (
                !wasFiltering
                || state.archiveFilterPresentation
                  === 'folders'
              ) {
                state.archiveSelectedFolderId =
                  nextValues.scope === 'folder'
                    ? state
                        .archiveFilterScopeFolderId
                    : null;
              }

              state.archiveSelectedFolderItemId =
                null;

              state.archiveSelectedFileId =
                null;

              state.archiveSelectedFileIds =
                [];
            }

            closeArchiveFilterPopover();
            renderArchive();
          }
        );

      positionSharedFilterPanel(
        panel,
        anchor
      );

      requestAnimationFrame(() => {
        controller?.focusFirst();
      });

      setTimeout(() => {
        document.addEventListener(
          'click',
          closeArchiveFilterOnOutside
        );

        document.addEventListener(
          'keydown',
          closeArchiveFilterOnEscape
        );
      }, 0);
    }

    function archiveActiveToolbarFilters() {
      if (
        archiveToolbarIsSources()
      ) {
        const filters =
          [];

        const targetFilter =
          currentArchiveSourceTargetFilter();

        if (targetFilter) {
          filters.push({
            key:
              'sourceTarget',

            label:
              `${t('Connected to')}: ${
                connectedSourceTargetLabel(
                  targetFilter.targetType,
                  targetFilter.target
                )
              }`
          });
        }
        if (
          state.archiveSourceCategoryFilter
          && state.archiveSourceCategoryFilter
            !== 'all'
        ) {
          filters.push({
            key:
              'sourceCategory',

            label:
              localizedSourceCategoryLabel(
                state
                  .archiveSourceCategoryFilter
              )
          });
        }
        if (
          state.archiveSourceConnectionFilter
          && state.archiveSourceConnectionFilter
            !== 'all'
        ) {
          filters.push({
            key:
              'sourceConnections',

            label:
              state.archiveSourceConnectionFilter
                === 'linked'
                  ? translateText(
                      'With connections'
                    )
                  : translateText(
                      'Without connections'
                    )
          });
        }
        if (
          state.archiveSourceFavouriteOnly
        ) {
          filters.push({
            key:
              'sourceFavouriteOnly',

            label:
              translateText(
                'Favourite sources'
              )
          });
        }

        return filters;
      }

      const filters =
        archiveEffectiveFileFilters();

      return archiveFileFilterSchema
        .filter(definition =>
          sharedFilterValueIsActive(
            definition,
            filters[
              definition.key
            ]
          )
        )
        .map(definition => {
          let label;

          if (
            definition.control
              === 'boolean'
          ) {
            label =
              definition.checkboxLabel
              || definition.label;
          } else {
            label =
              sharedFilterDisplayValue(
                definition,
                filters[
                  definition.key
                ]
              );
          }

          return {
            key:
              definition.key,

            label
          };
        });
    }

    function renderArchiveActiveFilterbar() {
      const filters =
        archiveActiveToolbarFilters();

      if (!filters.length) {
        return '';
      }

      return `
        <div
          class="
            module-active-filterbar
          "
          aria-label="Active Archive filters">

          ${filters
            .map(filter => `
              <span
                class="
                  filter-chip
                  active-filter-chip
                ">

                <span
                  class="
                    active-filter-chip-copy
                  ">

                  ${escapeHtml(
                    filter.label
                  )}
                </span>

                <button
                  class="
                    active-filter-chip-remove
                  "
                  type="button"
                  data-archive-remove-filter="${escapeHtml(
                    filter.key
                  )}"
                  aria-label="Remove ${escapeHtml(
                    filter.label
                  )} filter"
                  title="Remove filter">

                  ${icon.close}
                </button>
              </span>
            `)
            .join('')}

          <span
            class="
              active-filter-actions
            ">

            <button
              class="link"
              type="button"
              id="archiveClearFilters">

              Clear all
            </button>
          </span>
        </div>
      `;
    }

    function removeArchiveToolbarFilter(
      key
    ) {
      if (key === 'sourceTarget') {
        state.archiveSourceTargetFilter =
          null;

        state.archiveSelectedSourceId =
          null;

        renderArchive();

        return;
      }
      if (
        key === 'sourceCategory'
      ) {
        state.archiveSourceCategoryFilter =
          'all';

        state.archiveSelectedSourceId =
          null;

        renderArchive();

        return;
      }
      if (
        key === 'sourceConnections'
      ) {
        state.archiveSourceConnectionFilter =
          'all';

        state.archiveSelectedSourceId =
          null;

        renderArchive();

        return;
      }
      if (
        key === 'sourceFavouriteOnly'
      ) {
        state.archiveSourceFavouriteOnly =
          false;

        state.archiveSelectedSourceId =
          null;

        renderArchive();

        return;
      }

      const definition =
        sharedFilterDefinitionByKey(
          archiveFileFilterSchema,
          key
        );

      if (!definition) {
        return;
      }

      const defaults =
        archiveFileFiltersWithDefaults(
          {}
        );

      state.archiveFileFilters = {
        ...archiveFileFiltersWithDefaults(),
        [key]:
          defaults[key]
      };

      if (key === 'scope') {
        state.archiveFilterScopeFolderId =
          null;
      }

      if (
        key === 'favouriteOnly'
        && state.archiveView
          === 'favorites'
      ) {
        state.archiveView =
          'files';
      }

      state.archiveSelectedFileId =
        null;

      state.archiveSelectedFileIds =
        [];

      renderArchive();
    }

    function clearArchiveToolbarFilters() {
      if (
        archiveToolbarIsSources()
      ) {
        state.archiveSourceCategoryFilter =
          'all';
        state.archiveSourceConnectionFilter =
          'all';
        state.archiveSourceFavouriteOnly =
          false;
        state.archiveSourceTargetFilter = null;
        state.archiveSelectedSourceId =
          null;
      } else {
        state.archiveFileFilters =
          archiveFileFiltersWithDefaults(
            {}
          );

        state.archiveFilterScopeFolderId =
          null;

        state.archiveFilterPresentation =
          'flat';

        if (
          state.archiveView
            === 'favorites'
        ) {
          state.archiveView =
            'files';
        }

        state.archiveSelectedFileId =
          null;

        state.archiveSelectedFileIds =
          [];
      }

      renderArchive();
    }

    function archiveSourceConnectionCount(
      source
    ) {
      if (!source) {
        return 0;
      }

      return sourceLinksForSource(
        source.id,
        '',
        source.projectId
      ).length;
    }

    function archiveSourceOriginLabel(
      source
    ) {
      if (!source) {
        return 'Source record';
      }

      const values =
        [
          source.providedBy,
          source.location
        ]
          .map(value =>
            String(value || '').trim()
          )
          .filter(
            (
              value,
              index,
              records
            ) =>
              value
              && records.indexOf(value)
                === index
          );

      return values.join(' · ')
        || 'Source record';
    }

    function archiveSourceWebsiteHost(
      value
    ) {
      const normalized =
        String(value || '').trim();

      if (!normalized) {
        return '';
      }

      try {
        return new URL(
          normalized
        )
          .hostname
          .replace(
            /^www\./i,
            ''
          );
      } catch {
        return normalized;
      }
    }

    function archiveSourceReferenceLabel(
      source
    ) {
      if (!source) {
        return 'Not specified';
      }

      const values =
        [
          source.reference,
          archiveSourceWebsiteHost(
            source.url
          )
        ]
          .map(value =>
            String(value || '').trim()
          )
          .filter(
            (
              value,
              index,
              records
            ) =>
              value
              && records.indexOf(value)
                === index
          );

      return values.join(' · ')
        || 'Not specified';
    }

    function renderArchiveSourceTable(
      sources
    ) {
      return `
        <div class="archive-table-wrap">
          <table
            class="
              archive-table
              archive-source-table
            "
            aria-label="Sources">

            <thead>
              <tr>
                <th class="archive-col-name">
                  Source
                </th>

                <th class="archive-col-source-category">
                  Category
                </th>

                <th class="archive-col-source-reference">
                  Where found
                </th>

                <th class="archive-col-source-connections">
                  Connections
                </th>

                <th class="archive-col-source-accessed">
                  Accessed
                </th>

                <th
                  class="archive-col-favorite"
                  aria-label="Favourite">
                  ${icon.star}
                </th>

                <th class="archive-col-actions">
                </th>
              </tr>
            </thead>

            <tbody>
              ${sources.map(source => {
                const selected =
                  state.archiveSelectedSourceId
                    === source.id;

                const categoryLabel =
                  localizedSourceCategoryShortLabel(
                    source.category
                  );

                const fullCategoryLabel =
                  localizedSourceCategoryLabel(
                    source.category
                  );

                const originLabel =
                  archiveSourceOriginLabel(
                    source
                  );

                const referenceLabel =
                  archiveSourceReferenceLabel(
                    source
                  );

                const connectionCount =
                  archiveSourceConnectionCount(
                    source
                  );

                const accessedLabel =
                  source.accessedDate
                    ? archiveFormatDate(
                        source.accessedDate
                      )
                    : 'Not specified';

                return `
                  <tr
                    class="
                      archive-source-row
                      ${
                        selected
                          ? 'selected-detail'
                          : ''
                      }
                    "
                    data-archive-source-row="${escapeHtml(source.id)}"
                    tabindex="0"
                    aria-selected="${
                      selected
                        ? 'true'
                        : 'false'
                    }">

                    <td>
                      <div class="archive-source-title-cell">
                        <strong
                          title="${escapeHtml(source.title)}">
                          ${escapeHtml(source.title)}
                        </strong>

                        <span
                          class="archive-source-origin"
                          title="${escapeHtml(originLabel)}">
                          ${escapeHtml(originLabel)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        class="archive-source-category-text"
                        title="${escapeHtml(fullCategoryLabel)}">
                        ${escapeHtml(categoryLabel)}
                      </span>
                    </td>

                    <td>
                      <span
                        class="archive-source-reference-text"
                        title="${escapeHtml(referenceLabel)}">
                        ${escapeHtml(referenceLabel)}
                      </span>
                    </td>

                    <td
                      class="
                        archive-col-source-connections
                        archive-source-connections-cell
                      ">

                      ${connectionCount}
                    </td>

                    <td>
                      <span
                        class="archive-source-accessed-text"
                        title="${escapeHtml(accessedLabel)}">
                        ${escapeHtml(accessedLabel)}
                      </span>
                    </td>

                    <td class="archive-source-favourite-cell">
                      <button
                        class="
                          archive-row-icon-button
                          ${
                            source.favorite
                              ? 'active'
                              : ''
                          }
                        "
                        type="button"
                        data-archive-source-favorite="${escapeHtml(source.id)}"
                        aria-label="${
                          source.favorite
                            ? 'Remove source from favourites'
                            : 'Add source to favourites'
                        }">
                        ${icon.star}
                      </button>
                    </td>

                    <td>
                      <button
                        class="
                          archive-row-icon-button
                          archive-source-row-actions
                        "
                        type="button"
                        data-archive-row-actions="source"
                        data-archive-row-id="${escapeHtml(source.id)}"
                        aria-label="Source actions">
                        ${icon.more}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderArchiveSourcesView() {
      const sources =
        archiveFilteredSources();

      return `
        <div
          class="
            archive-page
          ">

          ${renderArchivePageHead({
            title:
              'Sources',

            subtitle:
              archiveSourcesViewSubtitle(),

            actions:
              renderArchiveSourcesHeaderActions()
          })}

          ${renderArchiveToolbar()}

          ${renderArchiveActiveFilterbar()}

          ${
            sources.length
              ? renderArchiveSourceTable(
                  sources
                )
              : renderArchiveEmpty(
                  'No sources found',

                  state.archiveSearch
                    ? 'Try a different search term or source type.'
                    : 'Create a lightweight source record to document where files and information came from.'
                )
          }
        </div>
      `;
    }

    function archiveInspectorToolbarContext() {
      if (
        state.archiveView
          === 'sources'
      ) {
        const source =
          archiveSourceById(
            state.archiveSelectedSourceId
          );

        return source
          ? {
              type:
                'source',

              id:
                source.id,

              label:
                source.title
                || 'Source',

              favorite:
                Boolean(
                  source.favorite
                ),

              supportsFavourite:
                true
            }
          : null;
      }

      const file =
        archiveFileById(
          state.archiveSelectedFileId
        );

      if (file) {
        return {
          type:
            'file',

          id:
            file.id,

          label:
            file.name
            || 'File',

          favorite:
            Boolean(
              file.favorite
            ),

          supportsFavourite:
            true
        };
      }

      const selectedFolder =
        archiveFolderById(
          state.archiveSelectedFolderItemId
        );

      if (selectedFolder) {
        return {
          type:
            'folder',

          id:
            selectedFolder.id,

          label:
            selectedFolder.name
            || 'Folder',

          folderMode:
            'selected',

          favorite:
            false,

          supportsFavourite:
            false
        };
      }

      const currentFolder =
        archiveFolderById(
          state.archiveSelectedFolderId
        );

      if (currentFolder) {
        return {
          type:
            'folder',

          id:
            currentFolder.id,

          label:
            currentFolder.name
            || 'Folder',

          folderMode:
            'current',

          favorite:
            false,

          supportsFavourite:
            false
        };
      }

      /*
        The virtual Files root is a location, not
        a stored record, so it has no favourite or
        more-actions control.
      */

      return null;
    }

    function renderArchiveInspectorFolderOpenButton(
      context
    ) {
      if (
        context?.type !== 'folder'
        || context.folderMode
          !== 'selected'
      ) {
        return '';
      }

      return `
        <button
          class="
            archive-inspector-action
            archive-inspector-action-text
          "
          type="button"
          data-archive-inspector-open-folder="${escapeHtml(
            context.id
          )}"
          aria-label="Open folder"
          title="Open folder">

          Open
        </button>
      `;
    }

    function renderArchiveInspectorRenameButton(
      context
    ) {
      if (
        context?.type !== 'folder'
      ) {
        return '';
      }

      return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-rename-folder="${escapeHtml(
            context.id
          )}"
          aria-label="Rename folder"
          title="Rename folder">

          ${icon.edit}
        </button>
      `;
    }

    function renderArchiveInspectorMoveButton(
      context
    ) {
      if (
        !context
        || ![
          'file',
          'folder'
        ].includes(
          context.type
        )
      ) {
        return '';
      }

      const itemLabel =
        context.type === 'file'
          ? 'file'
          : 'folder';

      return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-move="${escapeHtml(
            context.type
          )}"
          data-archive-inspector-move-id="${escapeHtml(
            context.id
          )}"
          aria-label="Move ${escapeHtml(
            itemLabel
          )}"
          title="Move ${escapeHtml(
            itemLabel
          )}">

          ${icon.movefolder}
        </button>
      `;
    }

    function renderArchiveInspectorFavouriteButton(
      context
    ) {
      if (
        !context
        || !context.supportsFavourite
      ) {
        return '';
      }

      const actionLabel =
        context.favorite
          ? 'Remove from favourites'
          : 'Add to favourites';

      const dataAttribute =
        context.type
          === 'source'
            ? `
              data-archive-source-favorite="${escapeHtml(
                context.id
              )}"
            `
            : `
              data-archive-toggle-favorite="${escapeHtml(
                context.id
              )}"
            `;

      return `
        <button
          class="
            archive-inspector-action
            ${
              context.favorite
                ? 'active'
                : ''
            }
          "
          type="button"
          ${dataAttribute}
          aria-label="${escapeHtml(
            actionLabel
          )}"
          aria-pressed="${String(
            context.favorite
          )}"
          title="${escapeHtml(
            actionLabel
          )}">

          ${icon.star}
        </button>
      `;
    }

    function renderArchiveInspectorToolbar() {
      const context =
        archiveInspectorToolbarContext();

      const editing =
        context?.type === 'file'
        && archiveFileEditIsActive(
          context.id
        );

      const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            archive-inspector-collapse
          "
          type="button"
          data-archive-inspector-collapse="true"
          aria-label="Collapse Archive inspector"
          title="Collapse inspector">

          ${icon.doublechevronSidebar}
        </button>
      `;

      if (editing) {
        return `
          <div
            class="
              archive-inspector-toolbar
            "
            role="toolbar"
            aria-label="Edit Archive file">

            ${collapseButton}

            <span
              class="
                archive-inspector-toolbar-spacer
              "
              aria-hidden="true">
            </span>

            <div
              class="
                archive-inspector-edit-actions
              ">

              <button
                class="button secondary"
                type="button"
                id="archiveCancelFileEdit">

                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                id="archiveSaveFileEdit">

                Save
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div
          class="
            archive-inspector-toolbar
          "
          role="toolbar"
          aria-label="Archive inspector actions">

          ${collapseButton}

          <span
            class="
              archive-inspector-toolbar-spacer
            "
            aria-hidden="true">
          </span>
          ${
            context?.type === 'file'
              ? `
                <button
                  class="
                    archive-inspector-action
                  "
                  type="button"
                  id="archiveEditFile"
                  aria-label="Edit file"
                  title="Edit file">

                  ${icon.edit}
                </button>
              `
              : context?.type === 'source'
                ? `
                  <button
                    class="
                      archive-inspector-action
                    "
                    type="button"
                    data-archive-edit-source="${escapeHtml(
                      context.id
                    )}"
                    aria-label="Edit source"
                    title="Edit source">

                    ${icon.edit}
                  </button>
                `
                : ''
          }

          ${renderArchiveInspectorFolderOpenButton(
            context
          )}

          ${renderArchiveInspectorRenameButton(
            context
          )}

          ${renderArchiveInspectorMoveButton(
            context
          )}

          ${renderArchiveInspectorFavouriteButton(
            context
          )}
          ${
            context
              ? `
                <button
                  class="
                    archive-inspector-action
                  "
                  type="button"
                  data-archive-row-actions="${escapeHtml(
                    context.type
                  )}"
                  data-archive-row-id="${escapeHtml(
                    context.id
                  )}"
                  aria-label="More actions for ${escapeHtml(
                    context.label
                  )}"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  title="More actions">

                  ${icon.more}
                </button>
              `
              : ''
          }
        </div>
      `;
    }

    function renderArchiveInspectorCollapsed() {
      return `
        <aside
          class="
            archive-inspector-collapsed
          "
          aria-label="Archive inspector collapsed">

          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
              archive-inspector-restore
            "
            type="button"
            data-archive-inspector-collapse="false"
            aria-label="Open Archive inspector"
            title="Open inspector">

            ${icon.doublechevronSidebar}
          </button>
        </aside>
      `;
    }

    function renderArchiveRootInspector() {
      const favoritesView =
        state.archiveView
          === 'favorites';

      return renderArchiveInspectorShell({
        title:
          favoritesView
            ? 'Favourites'
            : ARCHIVE_ROOT_LABEL,

        subtitle:
          'No item selected',

        content:
          renderInspectorSectionEmpty(
            'Select a file or folder to view its details.'
          )
      });
    }

    function renderArchiveInspector() {
      if (
        state.archiveView
          === 'sources'
      ) {
        return renderArchiveSourceInspector();
      }

      const file =
        archiveFileById(
          state.archiveSelectedFileId
        );

      if (file) {
        return renderArchiveFileInspector(
          file
        );
      }

      const selectedFolder =
        archiveFolderById(
          state.archiveSelectedFolderItemId
        );

      if (selectedFolder) {
        return renderArchiveFolderInspector(
          selectedFolder,
          {
            mode:
              'selected'
          }
        );
      }

      const currentFolder =
        archiveFolderById(
          state.archiveSelectedFolderId
        );

      return currentFolder
        ? renderArchiveFolderInspector(
            currentFolder,
            {
              mode:
                'current'
            }
          )
        : renderArchiveRootInspector();
    }

    function renderArchiveInspectorHeader(
      title,
      subtitle = ''
    ) {
      return `
        <div
          class="
            archive-inspector-head
          ">

          <div
            class="
              archive-inspector-head-copy
            ">

            <h2>
              ${escapeHtml(
                title
              )}
            </h2>

            ${
              subtitle
                ? `
                  <p>
                    ${escapeHtml(
                      subtitle
                    )}
                  </p>
                `
                : ''
            }
          </div>
        </div>
      `;
    }

    function renderArchiveInspectorShell({
      content,
      title = '',
      subtitle = '',
      showHeader = true,
      bodyClass =
        'archive-inspector-body',
      className = ''
    }) {
      return `
        <aside
          class="
            archive-inspector
            ${className}
          "
          aria-label="Archive inspector">

          ${renderArchiveInspectorToolbar()}

          <div
            class="
              archive-inspector-scroll
            ">

            ${
              showHeader
                ? renderArchiveInspectorHeader(
                    title,
                    subtitle
                  )
                : ''
            }

            <div
              class="${escapeHtml(
                bodyClass
              )}">

              ${content}
            </div>
          </div>
        </aside>
      `;
    }

    function renderArchivePreview(
      file
    ) {
      const kind =
        archiveFileKind(
          file
        );

      const imageSource =
        file.previewUrl
        || file.thumbnailUrl
        || file.src
        || '';

      if (
        kind === 'img'
        && imageSource
      ) {
        return `
          <div
            class="
              archive-file-preview
            ">

            <img
              class="
                archive-file-preview-image
              "
              src="${escapeHtml(
                imageSource
              )}"
              alt="">
          </div>
        `;
      }

      const previewIcon =
        kind === 'img'
          ? icon.image
          : kind === 'audio'
            ? icon.note
            : icon.file;

      const title =
        {
          pdf:
            'PDF preview',

          img:
            'Image preview',

          audio:
            'Audio preview',

          sheet:
            'Spreadsheet preview',

          doc:
            'Document preview',

          archive:
            'Archive-file preview',

          file:
            'File preview'
        }[kind]
        || 'File preview';

      const description =
        [
          'pdf',
          'img',
          'audio'
        ].includes(
          kind
        )
          ? 'The file preview is represented conceptually in this prototype.'
          : 'Preview is not available for this file type. Open the original file to view it.';

      return `
        <div
          class="
            archive-file-preview
          ">

          <div
            class="
              archive-file-preview-content
            ">

            ${previewIcon}

            <strong>
              ${escapeHtml(
                title
              )}
            </strong>

            <span>
              ${escapeHtml(
                description
              )}
            </span>
          </div>
        </div>
      `;
    }

    function renderArchiveFileOpenAction(
      file
    ) {
      return `
        <button
          class="
            button
            primary
            archive-file-open
          "
          type="button"
          data-archive-open-file="${escapeHtml(
            file.id
          )}">

          Open file
        </button>
      `;
    }

    function renderArchiveFileIdentity(
      file,
      editing
    ) {
      const draft =
        state.archiveFileEditDraft
        || archiveFileEditDraftFromFile(
          file
        );

      const summary =
        [
          archiveFileTypeLabel(
            file
          ),

          file.size
          || (
            Number.isFinite(
              Number(
                file.sizeBytes
              )
            )
              ? formatMediaBytes(
                  file.sizeBytes
                )
              : ''
          )
        ]
          .filter(Boolean)
          .join(' · ');

      return `
        <div
          class="
            archive-file-identity
          ">

          ${
            editing
              ? `
                <label
                  class="
                    archive-file-title-field
                  ">

                  <span>
                    File name
                  </span>

                  <input
                    id="archiveFileName"
                    maxlength="220"
                    value="${escapeHtml(
                      draft.name
                      || ''
                    )}">
                </label>
              `
              : `
                <h2>
                  ${escapeHtml(
                    file.name
                    || 'Untitled file'
                  )}
                </h2>
              `
          }

          <p
            class="
              archive-file-summary
            ">

            ${escapeHtml(
              summary
              || 'File'
            )}
          </p>
        </div>
      `;
    }

    function renderArchiveFileHero(
      file,
      editing
    ) {
      return `
        <div
          class="
            archive-file-hero
          ">

          ${renderArchivePreview(
            file
          )}

          ${renderArchiveFileOpenAction(
            file
          )}

          ${renderArchiveFileIdentity(
            file,
            editing
          )}
        </div>
      `;
    }

    function renderArchiveFileDetails(
      file,
      editing
    ) {
      if (editing) {
        const draft =
          state.archiveFileEditDraft
          || archiveFileEditDraftFromFile(
            file
          );

        return `
          <div
            class="
              archive-file-form-grid
            ">

            ${renderGenealogyDateField(
              'archiveFileDocumentDate',
              'Date',
              draft.documentDate,
              {
                inputId:
                  'archiveFileDocumentDateInput',

                typeId:
                  'archiveFileDocumentDateType',

                defaultDateType:
                  'Exact date',

                className:
                  'genealogy-date-inline-range'
              }
            )}

            ${renderPlaceCombobox({
              id:
                'archiveFileDocumentPlace',

              label:
                'Place',

              value:
                getPlaceDisplay(
                  draft.documentPlaceId
                )
                || draft.documentPlaceText
                || '',

              selectedPlaceId:
                draft.documentPlaceId
                || '',

              showAddress:
                false,

              className:
                'full'
            })}

            <div
              class="
                archive-file-field
              ">

              <label
                for="archiveFileDescription">

                Description
              </label>

              <textarea
                id="archiveFileDescription"
                maxlength="1200"
                placeholder="Add a description of this file">${escapeHtml(
                  draft.description
                  || ''
                )}</textarea>
            </div>
          </div>
        `;
      }

      const dateLabel =
        formatGenealogyDateLabel(
          archiveDocumentDateModel(
            file
          )
        )
        || 'Date unknown';

      const place =
        archiveDocumentPlace(
          file
        );

      const placeLabel =
        getPlaceDisplay(
          place.placeId
        )
        || place.placeText
        || 'Place not recorded';

      const description =
        String(
          file.description
          || ''
        ).trim()
        || 'No description';

      return `
        <dl
          class="
            archive-file-read-list
          ">

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              Date
            </dt>

            <dd>
              ${escapeHtml(
                dateLabel
              )}
            </dd>
          </div>

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              Place
            </dt>

            <dd>
              ${escapeHtml(
                placeLabel
              )}
            </dd>
          </div>

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              Description
            </dt>
            <dd class="archive-file-read-description">${escapeHtml(
              description
            )}</dd>
          </div>
        </dl>
      `;
    }

    function archiveFilePersonMeta(
      person
    ) {
      const birth =
        formatGenealogyDateLabel(
          person?.birth
        );

      const death =
        formatGenealogyDateLabel(
          person?.death
        );

      if (
        birth
        && death
      ) {
        return `${birth} – ${death}`;
      }

      if (birth) {
        return `Born ${birth}`;
      }

      if (death) {
        return `Died ${death}`;
      }

      return 'Person profile';
    }

    function renderArchiveFileConnectionRow({
      file,
      entityType,
      record,
      leadingHtml,
      readOnly = false
    }) {
      const config =
        archiveEntityConfig(
          entityType
        );

      if (
        !config
        || !record
      ) {
        return '';
      }

      const label =
        config.label(
          record
        );

      const meta =
        entityType === 'person'
          ? archiveFilePersonMeta(
              record
            )
          : config.meta(
              record
            );

      const mainContent = `
        ${leadingHtml}

        <span
          class="
            relation-row-copy
          ">

          <strong>
            ${escapeHtml(
              label
            )}
          </strong>

          <span>
            ${escapeHtml(
              meta
            )}
          </span>
        </span>
      `;

      return `
        <div
          class="
            relation-row
          ">

          ${
            readOnly
              ? `
                <div
                  class="
                    relation-row-main
                  ">

                  ${mainContent}
                </div>
              `
              : `
                <button
                  class="
                    relation-row-main
                  "
                  type="button"
                  data-archive-open-connection="${escapeHtml(
                    entityType
                  )}"
                  data-archive-connection-id="${escapeHtml(
                    record.id
                  )}"
                  aria-label="Open ${escapeHtml(
                    label
                  )}">

                  ${mainContent}
                </button>
              `
          }

          ${
            readOnly
              ? ''
              : `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                    "
                    type="button"
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                      file.id
                    )}"
                    data-archive-unlink-type="${escapeHtml(
                      entityType
                    )}"
                    data-archive-unlink-id="${escapeHtml(
                      record.id
                    )}"
                    aria-label="Unlink ${escapeHtml(
                      label
                    )}"
                    title="Unlink">

                    ${icon.unlink}
                  </button>
                </div>
              `
          }
        </div>
      `;
    }

    function renderArchiveFilePeople(
      file,
      readOnly
    ) {
      const people =
        (
          file.linkedPersonIds
          || []
        )
          .map(id =>
            getPerson(
              id
            )
          )
          .filter(Boolean);

      if (!people.length) {
        return renderInspectorSectionEmpty(
          'No people linked to this file.'
        );
      }

      return `
        <div
          class="
            relationship-list
          ">

          ${people
            .map(person =>
              renderArchiveFileConnectionRow({
                file,
                entityType:
                  'person',
                record:
                  person,
                leadingHtml:
                  renderPersonAvatar(
                    person,
                    'small-avatar',
                    {
                      element:
                        'span'
                    }
                  ),
                readOnly
              })
            )
            .join('')}
        </div>
      `;
    }

    function archiveFileEventRecords(
      file
    ) {
      return (
        file?.linkedEventIds
        || []
      )
        .map(id =>
          archiveConnectionRecord(
            'event',
            id
          )
        )
        .filter(event =>
          Boolean(
            eventRelationItemModel(
              event
            )
          )
        );
    }

    function renderArchiveFileEvents(
      file,
      readOnly
    ) {
      const events =
        archiveFileEventRecords(
          file
        );

      if (!events.length) {
        return renderInspectorSectionEmpty(
          'No events linked to this file.'
        );
      }

      return `
        <div
          class="
            relationship-list
            notes-event-list
          ">

          ${events
            .map(event =>
              renderEventRelationItem({
                event,

                openAttributes:
                  `
                    data-archive-open-connection="event"
                    data-archive-connection-id="${escapeHtml(
                      event.id
                    )}"
                  `,

                removeAttributes:
                  `
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                      file.id
                    )}"
                    data-archive-unlink-type="event"
                    data-archive-unlink-id="${escapeHtml(
                      event.id
                    )}"
                  `,

                removeContextLabel:
                  'file',

                readOnly
              })
            )
            .join('')}
        </div>
      `;
    }

    function archiveFileNoteRecords(
      file
    ) {
      return archiveNoteIdsForFile(
        file
      )
        .map(id =>
          archiveConnectionRecord(
            'note',
            id
          )
        )
        .filter(Boolean);
    }

    function renderArchiveFileNotes(file, readOnly) {
      const notes = archiveFileNoteRecords(file);

      if (!notes.length) {
        return renderInspectorSectionEmpty(
          'No notes linked to this file.'
        );
      }

      const items = notes.slice(0, CONNECTED_NOTES_PREVIEW_LIMIT).map(note =>
        renderRelatedNoteRelationItem({
          note,

          openAttributes: `
            data-archive-open-connection="note"
            data-archive-connection-id="${escapeHtml(note.id)}"
          `,

          removeAttributes: `
            data-archive-unlink-owner-type="file"
            data-archive-unlink-owner-id="${escapeHtml(file.id)}"
            data-archive-unlink-type="note"
            data-archive-unlink-id="${escapeHtml(note.id)}"
          `,

          removeContextLabel: 'file',
          readOnly
        })
      ).join('');

      return `
        <div class="relationship-list notes-related-list">
          ${items}
        </div>

        ${renderConnectedNotesFooter({
          contextType: 'archiveFile',
          contextId: file.id,
          count: notes.length
        })}
      `;
    }

    function renderArchiveFileSources(
      file,
      readOnly
    ) {
      return renderConnectedSourceList({
        targetType:
          'file',

        targetId:
          file.id,

        projectId:
          file.projectId,

        /*
          The Archive inspector must show every
          connected source rather than the four-item
          preview used in some other panels.
        */
        limit:
          Number.POSITIVE_INFINITY,

        emptyText:
          'No sources linked to this file.',

        readOnly
      });
    }

    function renderArchiveFileMetadata(
      file
    ) {
      const rows = [
        [
          'Folder',
          archiveFolderPath(
            file.folderId
          )
        ],

        [
          'Date added',
          archiveFormatDate(
            file.addedAt,
            file.added
          )
        ],

        [
          'Date modified',
          archiveFormatDate(
            file.updatedAt,
            file.updated
          )
        ],

        file.originalName
        && file.originalName
          !== file.name
          ? [
              'Original filename',
              file.originalName
            ]
          : null,

        file.mimeType
          ? [
              'MIME type',
              file.mimeType
            ]
          : null,

        [
          'File ID',
          file.id
        ]
      ].filter(Boolean);

      return `
        <div
          class="
            archive-file-metadata-list
          ">

          ${rows
            .map(([
              label,
              value
            ]) => `
              <div
                class="
                  archive-file-metadata-row
                ">

                <span>
                  ${escapeHtml(
                    label
                  )}
                </span>

                <strong>
                  ${escapeHtml(
                    value
                    || 'Unknown'
                  )}
                </strong>
              </div>
            `)
            .join('')}
        </div>
      `;
    }

    function renderArchiveSourceSection(
      sectionId,
      title,
      content,
      actionHtml = '',
      meta = '',
      footerHtml = ''
    ) {
      const stateKey = `source-${sectionId}`;

      return renderInspectorSection(
        stateKey,
        title,
        meta,
        content,
        actionHtml,
        {
          inlineAction: Boolean(actionHtml),
          alwaysShowAction: true,
          open: archiveInspectorSectionIsOpen(stateKey),
          toggleAttribute: 'data-archive-section-toggle',
          sectionId: `archive-source-section-${sectionId}`,
          footerHtml
        }
      );
    }

    function archiveSourceConnectionRecords(
      source,
      entityType
    ) {
      if (!source) {
        return [];
      }

      if (entityType === 'file') {
        return archiveFilesForSource(
          source.id
        );
      }

      return archiveConnectionIds(
        'source',
        source.id,
        entityType
      )
        .map(id =>
          archiveConnectionRecord(
            entityType,
            id
          )
        )
        .filter(Boolean);
    }

    function renderArchiveSourceSectionAction(
      source,
      entityType
    ) {
      const config =
        archiveEntityConfig(
          entityType
        );

      if (!source || !config) {
        return '';
      }

      return `
        <button
          class="link"
          type="button"
          data-archive-add-connection="${escapeHtml(
            entityType
          )}"
          data-archive-owner-type="source"
          data-archive-owner-id="${escapeHtml(
            source.id
          )}">

          ${renderPanelButtonLabel(
            icon.plus,
            config.addLabel
          )}
        </button>
      `;
    }

    function renderArchiveSourceConnectionContent(
      source,
      entityType,
      records
    ) {
      const config =
        archiveEntityConfig(
          entityType
        );

      if (!config) {
        return '';
      }

      const validRecords =
        (
          Array.isArray(
            records
          )
            ? records
            : []
        )
          .filter(Boolean);

      if (!validRecords.length) {
        return renderInspectorSectionEmpty(
          `No ${config.title.toLowerCase()} linked.`
        );
      }

      const previewLimits = {
        photo: PERSON_PANEL_PREVIEW_LIMITS.photos,
        file: PERSON_PANEL_PREVIEW_LIMITS.archive,
        note: CONNECTED_NOTES_PREVIEW_LIMIT
      };

      const visibleRecords = validRecords.slice(
        0,
        previewLimits[entityType] ?? 4
      );

      const openAttributes =
        recordId => `
          data-archive-open-connection="${escapeHtml(
            entityType
          )}"
          data-archive-connection-id="${escapeHtml(
            recordId
          )}"
        `;

      const removeAttributes =
        recordId => `
          data-archive-unlink-owner-type="source"
          data-archive-unlink-owner-id="${escapeHtml(
            source.id
          )}"
          data-archive-unlink-type="${escapeHtml(
            entityType
          )}"
          data-archive-unlink-id="${escapeHtml(
            recordId
          )}"
        `;

      const renderRelationRemoveAction =
        (
          recordId,
          label
        ) => `
          <div class="relation-actions">
            <button
              class="
                relation-action-button
                danger
              "
              type="button"
              ${removeAttributes(
                recordId
              )}
              aria-label="Remove ${escapeHtml(
                label
              )} from source"
              title="Remove link">

              ${icon.close}
            </button>
          </div>
        `;

      /*
        Notes uses the shared connected-file
        component for linked Archive files.
      */
      if (entityType === 'file') {
        return renderConnectedFileList({
          files:
            visibleRecords,

          contextType:
            'source',

          contextId:
            source.id,

          emptyText:
            'No files linked.'
        });
      }

      /*
        Reuse the Notes linked-photo grid.
      */
      if (entityType === 'photo') {
        return `
          <div
            class="
              connected-photo-grid
              notes-linked-photo-grid
            ">

            ${visibleRecords
              .map(photo => {
                const label =
                  config.label(
                    photo
                  );

                return `
                  <div
                    class="
                      notes-linked-photo-item
                      person-connected-photo-item
                    ">

                    <button
                      class="connected-photo-button"
                      type="button"
                      ${openAttributes(
                        photo.id
                      )}
                      title="${escapeHtml(
                        label
                      )}"
                      aria-label="Open ${escapeHtml(
                        label
                      )} in Albums">

                      ${renderPhotoThumbnail(
                        photo,
                        {
                          label
                        }
                      )}
                    </button>

                    <button
                      class="
                        connected-note-unlink
                        connected-photo-unlink
                      "
                      type="button"
                      ${removeAttributes(
                        photo.id
                      )}
                      aria-label="Unlink ${escapeHtml(
                        label
                      )} from source"
                      title="Unlink photo">

                      ${icon.unlink}
                    </button>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }

      /*
        Reuse the person rows from the
        Notes right-side panel.
      */
      if (entityType === 'person') {
        return `
          <div
            class="
              relationship-list
              notes-people-list
            ">

            ${visibleRecords
              .map(person => {
                const name =
                  person.names?.display
                  || person.name
                  || 'Unnamed person';

                const dates =
                  albumPhotoPersonDates(
                    person
                  )
                  || config.meta(
                    person
                  );

                return `
                  <div class="relation-row">
                    <button
                      class="relation-row-main"
                      type="button"
                      ${openAttributes(
                        person.id
                      )}
                      aria-label="Open profile for ${escapeHtml(
                        name
                      )}">

                      ${renderPersonAvatar(
                        person,
                        'small-avatar',
                        {
                          element:
                            'span'
                        }
                      )}

                      <span class="relation-row-copy">
                        <strong>
                          ${escapeHtml(
                            name
                          )}
                        </strong>

                        <span>
                          ${escapeHtml(
                            dates
                          )}
                        </span>
                      </span>
                    </button>

                    ${renderRelationRemoveAction(
                      person.id,
                      name
                    )}
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }

      /*
        renderEventRelationItem() is already
        shared by Notes and Archive.
      */
      if (entityType === 'event') {
        return `
          <div
            class="
              relationship-list
              notes-event-list
            ">

            ${visibleRecords
              .map(event =>
                renderEventRelationItem({
                  event,

                  openAttributes:
                    openAttributes(
                      event.id
                    ),

                  removeAttributes:
                    removeAttributes(
                      event.id
                    ),

                  removeContextLabel:
                    'source'
                })
              )
              .join('')}
          </div>
        `;
      }

      /*
        Related-note rows already have a
        reusable renderer.
      */
      if (entityType === 'note') {
        return `
          <div
            class="
              relationship-list
              notes-related-list
            ">

            ${visibleRecords
              .map(note =>
                renderRelatedNoteRelationItem({
                  note,

                  openAttributes:
                    openAttributes(
                      note.id
                    ),

                  removeAttributes:
                    removeAttributes(
                      note.id
                    ),

                  removeContextLabel:
                    'source'
                })
              )
              .join('')}
          </div>
        `;
      }

      /*
        Reuse the full place presentation
        from the Notes inspector.
      */
      if (entityType === 'place') {
        return `
          <div
            class="
              relationship-list
              notes-place-list
            ">

            ${visibleRecords
              .map(place => {
                const primaryName =
                  placePrimaryName(
                    place
                  )
                  || place.name
                  || 'Unnamed place';

                const secondaryName =
                  placeSecondaryName(
                    place
                  )
                  || 'No broader place recorded';

                const connectionCounts =
                  getPlaceConnectionCounts(
                    place.id,
                    {
                      projectId:
                        place.projectId
                        || currentProjectId()
                    }
                  );

                const connectionTotal =
                  Object.values(
                    connectionCounts
                  ).reduce(
                    (
                      total,
                      count
                    ) =>
                      total
                      + Number(
                          count || 0
                        ),
                    0
                  );

                const connectionLabel =
                  `${connectionTotal} ${
                    connectionTotal === 1
                      ? 'connected record'
                      : 'connected records'
                  }`;

                const metadata =
                  placeHasCoordinates(
                    place
                  )
                    ? connectionLabel
                    : `${connectionLabel} · No map position`;

                return `
                  <div
                    class="
                      relation-row
                      notes-place-item
                    ">

                    <button
                      class="
                        relation-row-main
                        notes-place-main
                      "
                      type="button"
                      ${openAttributes(
                        place.id
                      )}
                      aria-label="Open ${escapeHtml(
                        primaryName
                      )} in Places">

                      <span
                        class="notes-place-icon"
                        aria-hidden="true">

                        ${icon.mapPin}
                      </span>

                      <span class="notes-place-copy">
                        <strong>
                          ${escapeHtml(
                            primaryName
                          )}
                        </strong>

                        <span class="notes-place-secondary">
                          ${escapeHtml(
                            secondaryName
                          )}
                        </span>

                        <span class="notes-place-meta">
                          ${escapeHtml(
                            metadata
                          )}
                        </span>
                      </span>
                    </button>

                    ${renderRelationRemoveAction(
                      place.id,
                      primaryName
                    )}
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }

      /*
        Safe fallback for any connection type
        added to the Source inspector later.
      */
      return `
        <div class="notes-linked-list">
          ${visibleRecords
            .map(record => {
              const label =
                config.label(
                  record
                );

              const metadata =
                config.meta(
                  record
                );

              return `
                <div class="notes-linked-row">
                  <button
                    class="notes-linked-main"
                    type="button"
                    ${openAttributes(
                      record.id
                    )}
                    aria-label="Open ${escapeHtml(
                      label
                    )}">

                    <strong>
                      ${escapeHtml(
                        label
                      )}
                    </strong>

                    <span>
                      ${escapeHtml(
                        metadata
                      )}
                    </span>
                  </button>

                  <div class="notes-linked-actions">
                    <button
                      class="
                        notes-linked-action
                        danger
                      "
                      type="button"
                      ${removeAttributes(
                        record.id
                      )}
                      aria-label="Remove ${escapeHtml(
                        label
                      )} from source"
                      title="Remove link">

                      ${icon.close}
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    function renderSourceConnectionViewAll(source, entityType, count) {
      const labels = {
        photo: ['photo', 'photos'],
        file: ['file', 'files'],
        note: ['note', 'notes']
      };

      const nouns = labels[entityType];

      if (!source?.id || !count || !nouns) return '';

      const label = translateText(
        `View all ${count} ${count === 1 ? nouns[0] : nouns[1]}`
      );

      return `
        <button
          class="panel-section-view-all"
          type="button"
          data-source-connected-view-all="${escapeHtml(entityType)}"
          data-source-connected-owner="${escapeHtml(source.id)}">
          <span>${escapeHtml(label)}</span>
          <span
            class="panel-section-view-all-icon"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </button>
      `;
    }

    function renderArchiveSourceConnectionSection(
      source,
      entityType
    ) {
      const config =
        archiveEntityConfig(
          entityType
        );

      if (!source || !config) {
        return '';
      }

      const records =
        archiveSourceConnectionRecords(
          source,
          entityType
        );
      const countLabel =
        state.language === 'ru'
        && entityType === 'photo'
          ? `${
              RU_NUMBER_FORMATTER.format(
                records.length
              )
            } фото`
          : translateText(
              `${records.length} ${
                records.length === 1
                  ? config.singular
                  : config.title.toLowerCase()
              }`
            );
      return renderArchiveSourceSection(
        entityType,
        config.title,
        renderArchiveSourceConnectionContent(
          source,
          entityType,
          records
        ),
        renderArchiveSourceSectionAction(
          source,
          entityType
        ),
        countLabel,
        renderSourceConnectionViewAll(
          source,
          entityType,
          records.length
        )
        );
    }

    function renderArchiveSourceDetails(
      source,
      categoryLabel
    ) {
      const url =
        String(
          source.url
          || ''
        ).trim();

      const rows = [
        {
          label:
            'Category',

          value:
            categoryLabel
            || 'Not specified'
        },
        {
          label:
            'Obtained from',

          value:
            source.providedBy
            || 'Not specified'
        },
        {
          label:
            'Location',

          value:
            source.location
            || 'Not specified'
        },
        {
          label:
            'Where can it be found?',

          value:
            source.reference
            || 'Not specified'
        },
        {
          label:
            'Website or link',

          value:
            url
            || 'Not specified',

          isLink:
            Boolean(
              url
            )
        },
        {
          label:
            'Date accessed or received',

          value:
            source.accessedDate
              ? archiveFormatDate(
                  source.accessedDate
                )
              : 'Not specified'
        }
      ];

      return `
        <dl
          class="
            archive-file-read-list
            archive-source-read-list
          ">

          ${rows
            .map(row => `
              <div class="archive-file-read-row">
                <dt>
                  ${escapeHtml(
                    row.label
                  )}
                </dt>

                <dd>
                  ${
                    row.isLink
                      ? `
                        <a
                          class="
                            link
                            archive-source-url
                          "
                          href="${escapeHtml(
                            row.value
                          )}"
                          target="_blank"
                          rel="noopener noreferrer">

                          ${escapeHtml(
                            row.value
                          )}
                        </a>
                      `
                      : escapeHtml(
                          row.value
                        )
                  }
                </dd>
              </div>
            `)
            .join('')}
        </dl>

        ${
          source.notes
            ? `
              <div class="archive-source-notes">
                <strong>
                  Source notes
                </strong>

                <p>${escapeHtml(
                    source.notes
                  )}</p>
              </div>
            `
            : ''
        }
      `;
    }

    function openArchiveSourceFilesModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        return;
      }

      const existingFileIds =
        archiveFilesForSource(
          source.id
        ).map(file =>
          file.id
        );

      openConnectedFilesModal({
        projectId:
          source.projectId
          || currentProjectId(),

        title:
          'Add files',

        subtitle:
          `Connect Archive files to “${
            source.title
            || 'this source'
          }”.`,

        existingFileIds,

        onSave:
          fileIds => {
            const currentSource =
              archiveSourceById(
                source.id
              );

            if (!currentSource) {
              return {
                ok:
                  false
              };
            }

            const writes =
              fileIds.map(fileId => ({
                ownerType:
                  'source',

                ownerId:
                  currentSource.id,

                entityType:
                  'file',

                entityId:
                  fileId,

                shouldLink:
                  true
              }));

            const committed =
              archiveSetConnectionsAtomically(
                writes
              );

            return {
              ...committed,

              ok:
                committed.ok
                && committed.changedCount
                  === writes.length
            };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
            `${count} ${
              count === 1
                ? 'file'
                : 'files'
            } added to source.`
      });
    }

    function renderArchiveFileInspector(
      file
    ) {
      if (
        state.archiveFileEditing
        && state.archiveFileEditDraft
          ?.fileId !== file.id
      ) {
        resetArchiveFileEditState();
      }

      const editing =
        archiveFileEditIsActive(
          file.id
        );

      const peopleCount =
        (
          file.linkedPersonIds
          || []
        ).length;

      const eventCount =
        archiveFileEventRecords(
          file
        ).length;

      const noteCount =
        archiveFileNoteRecords(
          file
        ).length;

      const sourceCount =
        sourceIdsForTarget(
          'file',
          file.id,
          file.projectId
        ).length;

      const content = `
        ${renderArchiveFileHero(
          file,
          editing
        )}

        ${renderArchiveFileSection(
          'details',
          'Details',
          renderArchiveFileDetails(
            file,
            editing
          )
        )}

        ${renderArchiveFileSection(
          'people',
          'People',
          renderArchiveFilePeople(
            file,
            editing
          ),
          renderArchiveFileSectionAction(
            'person',
            'Add person',
            editing
          ),
          `${peopleCount} ${
            peopleCount === 1
              ? 'person'
              : 'people'
          }`
        )}

        ${renderArchiveFileSection(
          'events',
          'Events',
          renderArchiveFileEvents(
            file,
            editing
          ),
          renderArchiveFileSectionAction(
            'event',
            'Add event',
            editing
          ),
          `${eventCount} ${
            eventCount === 1
              ? 'event'
              : 'events'
          }`
        )}

        ${renderArchiveFileSection(
          'notes',
          'Notes',
          renderArchiveFileNotes(
            file,
            editing
          ),
          renderArchiveFileSectionAction(
            'note',
            'Add note',
            editing
          ),
          `${noteCount} ${
            noteCount === 1
              ? 'note'
              : 'notes'
          }`
        )}

        ${renderArchiveFileSection(
          'sources',
          'Sources',
          renderArchiveFileSources(
            file,
            editing
          ),
          renderArchiveFileSectionAction(
            'source',
            'Add source',
            editing
          ),
          `${sourceCount} ${
            sourceCount === 1
              ? 'source'
              : 'sources'
          }`
        )}

        ${renderArchiveFileSection(
          'metadata',
          'File metadata',
          renderArchiveFileMetadata(
            file
          )
        )}
      `;

      return renderArchiveInspectorShell({
        showHeader:
          false,

        bodyClass:
          'archive-file-inspector-content',

        className:
          editing
            ? 'is-editing'
            : '',

        content
      });
    }

    function archiveFolderInspectorPath(
      folder
    ) {
      if (!folder) {
        return 'Files';
      }

      const names =
        archiveFolderAncestors(
          folder.id
        )
          .map(item =>
            item?.name
          )
          .filter(Boolean);

      return [
        'Files',
        ...names
      ].join(
        ' / '
      );
    }

    function renderArchiveFolderInspector(
      folder,
      {
        mode =
          'current'
      } = {}
    ) {
      if (!folder) {
        return renderArchiveRootInspector();
      }

      const selectedFolder =
        mode === 'selected';

      const impact =
        archiveFolderImpact(
          folder.id
        );

      const directFolders =
        archiveFolderChildren(
          folder.id
        ).length;

      const directFiles =
        archiveProjectFiles()
          .filter(file =>
            archiveFileFolderId(
              file
            ) === folder.id
          )
          .length;

      const location =
        archiveFolderInspectorPath(
          folder
        );

      const body = `
        <div
          class="
            archive-inspector-actions
            archive-folder-inspector-actions
          ">

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-create-folder
            data-archive-parent-folder="${escapeHtml(
              folder.id
            )}">

            ${icon.plus}
            New subfolder
          </button>

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-add-files
            data-archive-parent-folder="${escapeHtml(
              folder.id
            )}">

            ${icon.plus}
            Add file
          </button>
        </div>

        <section
          class="
            archive-inspector-section
          ">

          <div
            class="
              archive-inspector-section-head
            ">

            <strong>
              Folder details
            </strong>
          </div>

          <div
            class="
              archive-inspector-section-body
            ">

          <div
            class="
              archive-kv-list
            ">

            <div
              class="
                archive-kv
              ">

              <span>
                Location
              </span>

              <span>
                ${escapeHtml(
                  location
                )}
              </span>
            </div>

            <div
              class="
                archive-kv
              ">

              <span>
                Created
              </span>

              <span>
                ${escapeHtml(
                  archiveFormatDate(
                    folder.createdAt
                  )
                )}
              </span>
            </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Folders
                </span>

                <span>
                  ${directFolders}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Files
                </span>

                <span>
                  ${directFiles}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Nested files
                </span>

                <span>
                  ${impact.files}
                </span>
              </div>
            </div>
          </div>
        </section>
      `;

      return renderArchiveInspectorShell({
        title:
          folder.name,

        subtitle:
          selectedFolder
            ? 'Selected folder'
            : 'Current folder',

        content:
          body
      });
    }

    function renderArchiveSourceInspector() {
      const source =
        archiveSourceById(
          state.archiveSelectedSourceId
        )
        || archiveFilteredSources()[0]
        || null;

      if (!source) {
        return renderArchiveInspectorShell({
          title:
            'Sources',

          subtitle:
            'No source selected',

          content:
            renderInspectorSectionEmpty(
              'Select or create a source record.'
            )
        });
      }

      const categoryLabel =
        localizedSourceCategoryLabel(
          source.category
        );

      const content = `
        ${renderArchiveSourceSection(
          'details',
          'Source details',
          renderArchiveSourceDetails(source, categoryLabel)
        )}

        ${renderArchiveSourceConnectionSection(source, 'person')}
        ${renderArchiveSourceConnectionSection(source, 'event')}
        ${renderArchiveSourceConnectionSection(source, 'photo')}
        ${renderArchiveSourceConnectionSection(source, 'file')}
        ${renderArchiveSourceConnectionSection(source, 'note')}
        ${renderArchiveSourceConnectionSection(source, 'place')}
      `;

      return renderArchiveInspectorShell({
        title:
          source.title,

        subtitle:
          categoryLabel,

        bodyClass:
          'archive-source-inspector-content',

        content
      });
    }

    function openArchiveAddFilesModal() {
      showToast('File adding will be available in the working MVP.');
    }

    function connectedFilesForProject(
      projectId =
        currentProjectId()
    ) {
      return (
        sampleData.archiveFiles
        || []
      )
        .filter(file =>
          !file.deleted
          && Boolean(projectId)
          && file.projectId === projectId
        );
    }

    function connectedFilePickerSearchText(
      file
    ) {
      if (!file) {
        return '';
      }

      return [
        archiveSearchText(
          file
        ),

        archiveFileTypeLabel(
          file
        ),

        archiveFolderPath(
          file.folderId
        ),

        file.size
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    }

    function connectedFilesSelectionLabel(
      count
    ) {
      return `${count} ${
        count === 1
          ? 'file'
          : 'files'
      } selected`;
    }

    function connectedFilesActionLabel(
      count
    ) {
      if (!count) {
        return 'Add files';
      }

      return `Add ${count} ${
        count === 1
          ? 'file'
          : 'files'
      }`;
    }

    function openConnectedFilesModal({
      projectId =
        currentProjectId(),

      title =
        'Add files',

      subtitle =
        'Connect existing Archive files or add new files.',

      existingFileIds =
        [],

      onSave =
        null,

      afterSave =
        null,

      successMessage =
        null,

      modalOpener =
        openModal
    } = {}) {
      const allFiles =
        connectedFilesForProject(
          projectId
        );

      const validFileIds =
        new Set(
          allFiles.map(file =>
            file.id
          )
        );

      const existingIds =
        new Set(
          archiveUniqueIds(
            existingFileIds
          ).filter(id =>
            validFileIds.has(
              id
            )
          )
        );

      const selectedIds =
        new Set();

      let query =
        '';

      let sourceTab =
        allFiles.length
          ? 'archive'
          : 'new';

      const compactTitle = translateText('Add files');
      const contextTitle = String(title || '').trim();

      const compactSubtitle =
        contextTitle && contextTitle !== 'Add files'
          ? `${translateText(contextTitle)}. ${translateText(subtitle)}`
          : translateText(subtitle);

      modalOpener(`
        <div
          class="
            modal
            connected-files-modal
          "
          data-connected-files-modal
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedFilesTitle">

          <div class="modal-header">
            <div>
              <h2
                id="connectedFilesTitle">
                ${escapeHtml(compactTitle)}
              </h2>

              <p>
                ${escapeHtml(compactSubtitle)}
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
              connected-files-modal-body
            ">

            <div
              class="
                connected-files-tabs
              "
              role="tablist"
              aria-label="File source">

              <button
                class="
                  connected-files-tab
                "
                type="button"
                role="tab"
                data-connected-files-tab="archive"
                aria-selected="${
                  sourceTab === 'archive'
                }">

                Archive files
              </button>

              <button
                class="
                  connected-files-tab
                "
                type="button"
                role="tab"
                data-connected-files-tab="new"
                aria-selected="${
                  sourceTab === 'new'
                }">

                Add new
              </button>
            </div>

            <section
              class="connected-files-panel connected-files-archive-panel"
              data-connected-files-panel="archive"
              ${sourceTab === 'archive' ? '' : 'hidden'}>

              <label
                class="app-search-field connected-files-search"
                aria-label="${escapeHtml(translateText('Search files'))}">
                ${icon.search}
                <input
                  type="search"
                  data-connected-files-search
                  placeholder="${escapeHtml(translateText('Search files'))}"
                  autocomplete="off">
              </label>

              <section
                class="notes-related-selected-panel"
                data-connected-files-selected
                hidden>
              </section>

              <section class="notes-related-results-panel">
                <div class="notes-related-results-head">
                  <div>
                    <strong data-connected-files-results-title></strong>
                    <span data-connected-files-results-meta></span>
                  </div>
                </div>

                <div
                  class="connected-files-results"
                  data-connected-files-results>
                </div>
              </section>
            </section>

            <section
              class="
                connected-files-panel
                connected-files-add-new-panel
              "
              data-connected-files-panel="new"
              ${
                sourceTab === 'new'
                  ? ''
                  : 'hidden'
              }>

              <div
                class="
                  connected-files-dropzone
                "
                data-connected-files-dropzone
                role="button"
                tabindex="0"
                aria-label="Add new files">

                <div
                  class="
                    connected-files-dropzone-content
                  ">

                  ${icon.import}

                  <strong>
                    Drop files here
                  </strong>

                  <p>
                    Add new files to Archive,
                    then connect them to this
                    record. File upload is
                    simulated in this prototype.
                  </p>

                  <button
                    class="
                      button
                      primary
                    "
                    type="button"
                    data-connected-files-add-new>

                    Add files
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div
            class="
              modal-footer
              connected-files-footer
            ">

            <span
              class="
                connected-files-footer-count
              "
              data-connected-files-count>

              0 files selected
            </span>

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
              type="button"
              data-connected-files-save
              disabled>

              Add files
            </button>
          </div>
        </div>
      `);

      const modal =
        modalBackdrop.querySelector(
          '[data-connected-files-modal]'
        );

      if (!modal) {
        return;
      }

      const resultsHost =
        modal.querySelector(
          '[data-connected-files-results]'
        );

      const searchInput =
        modal.querySelector(
          '[data-connected-files-search]'
        );

      const countElement =
        modal.querySelector(
          '[data-connected-files-count]'
        );

      const saveButton =
        modal.querySelector(
          '[data-connected-files-save]'
        );

      const dropzone =
        modal.querySelector(
          '[data-connected-files-dropzone]'
        );

      const pickerText = (english, russian) =>
        state.language === 'ru' ? russian : english;

      const selectedHost = modal.querySelector(
        '[data-connected-files-selected]'
      );

      const resultsTitle = modal.querySelector(
        '[data-connected-files-results-title]'
      );

      const resultsMeta = modal.querySelector(
        '[data-connected-files-results-meta]'
      );

      const fileLabel = file =>
        file.name || file.title || pickerText(
          'Untitled file',
          'Файл без названия'
        );

      const visibleFiles = () => {
        const normalizedQuery = query.trim().toLowerCase();

        return allFiles
          .filter(file => !existingIds.has(file.id))
          .filter(file =>
            !normalizedQuery
            || connectedFilePickerSearchText(file)
              .includes(normalizedQuery)
          )
          .sort((a, b) =>
            fileLabel(a).localeCompare(
              fileLabel(b),
              state.language === 'ru' ? 'ru' : 'en'
            )
          );
      };

      const renderChoice = file => {
        const selected = selectedIds.has(file.id);
        const name = fileLabel(file);
        const path = archiveFolderPath(file.folderId);

        return `
          <label class="connected-files-choice ${
            selected ? 'is-selected' : ''
          }">
            ${archiveFileIcon(file)}

            <span class="connected-files-choice-copy">
              <strong title="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </strong>

              <span class="connected-files-choice-meta">
                ${escapeHtml(translateText(connectedFileMeta(file)))}
              </span>

              <span
                class="connected-files-choice-path"
                title="${escapeHtml(path)}">
                ${escapeHtml(path)}
              </span>
            </span>

            <input
              class="albums-select-checkbox"
              type="checkbox"
              data-connected-files-choice
              value="${escapeHtml(file.id)}"
              ${selected ? 'checked' : ''}
              aria-label="${escapeHtml(
                pickerText('Select file: ', 'Выбрать файл: ') + name
              )}">
          </label>
        `;
      };

      const renderSelectedFiles = () => {
        if (!selectedHost) return;

        const selected = allFiles.filter(file =>
          selectedIds.has(file.id)
        );

        selectedHost.hidden = selected.length === 0;

        selectedHost.innerHTML = selected.length
          ? `
            <div class="notes-related-selected-list">
              ${selected.map(file => {
                const name = fileLabel(file);
                const removeLabel = pickerText(
                  'Remove from selection',
                  'Убрать из выбранного'
                );

                return `
                  <div class="notes-related-selected-row">
                    <span title="${escapeHtml(name)}">
                      ${escapeHtml(name)}
                    </span>
                    <button
                      class="relation-action-button"
                      type="button"
                      data-connected-files-remove="${escapeHtml(file.id)}"
                      title="${escapeHtml(removeLabel)}"
                      aria-label="${escapeHtml(`${removeLabel}: ${name}`)}">
                      ${icon.close}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          `
          : '';
      };

      const renderResults = () => {
        if (!resultsHost) return;

        const scrollTop = resultsHost.scrollTop;
        const files = visibleFiles();
        const searching = Boolean(query.trim());

        resultsTitle.textContent = searching
          ? pickerText('Search results', 'Результаты поиска')
          : pickerText('Suggested files', 'Предлагаемые файлы');

        resultsMeta.textContent = pickerText(
          `${files.length} ${
            files.length === 1 ? 'file' : 'files'
          } available · ${existingIds.size} already linked`,
          `Доступно файлов: ${files.length} · Уже связано: ${existingIds.size}`
        );

        renderSelectedFiles();

        if (files.length) {
          resultsHost.innerHTML = `
            <div class="connected-files-choice-list">
              ${files.map(renderChoice).join('')}
            </div>
          `;
        } else {
          const message = !allFiles.length
            ? pickerText(
                'No Archive files yet. Open Add new to add files.',
                'В архиве пока нет файлов. Откройте вкладку «Добавить новые».'
              )
            : searching
              ? pickerText(
                  'No files match this search.',
                  'По вашему запросу файлы не найдены.'
                )
              : pickerText(
                  'All available files are already linked.',
                  'Все доступные файлы уже связаны.'
                );

          resultsHost.innerHTML = `
            <div class="connected-files-empty">
              <div class="connected-files-empty-content">
                <strong>${escapeHtml(message)}</strong>
                ${searching ? `
                  <button
                    class="button secondary"
                    type="button"
                    data-connected-files-clear-search>
                    ${escapeHtml(
                      pickerText('Clear search', 'Очистить поиск')
                    )}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }

        resultsHost.scrollTop = scrollTop;
      };

      const refreshFooter =
        () => {
          const count =
            selectedIds.size;

          if (countElement) {
            countElement.textContent =
              translateText(
                connectedFilesSelectionLabel(
                  count
                )
              );
          }

          if (saveButton) {
            saveButton.disabled =
              count === 0;

            saveButton.textContent =
              translateText(
                connectedFilesActionLabel(
                  count
                )
              );
          }
        };
      modal.addEventListener('click', event => {
        const button = event.target.closest(
          '[data-connected-files-remove]'
        );

        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        selectedIds.delete(button.dataset.connectedFilesRemove);
        refreshSelection();
      });
      const refreshSelection =
        () => {
          renderResults();
          refreshFooter();
        };

      const setTab =
        (
          nextTab,
          {
            focus =
              true
          } = {}
        ) => {
          if (
            ![
              'archive',
              'new'
            ].includes(
              nextTab
            )
          ) {
            return;
          }

          sourceTab =
            nextTab;

          modal
            .querySelectorAll(
              '[data-connected-files-tab]'
            )
            .forEach(button => {
              const selected =
                button.dataset
                  .connectedFilesTab
                  === sourceTab;

              button.setAttribute(
                'aria-selected',
                String(
                  selected
                )
              );
            });

          modal
            .querySelectorAll(
              '[data-connected-files-panel]'
            )
            .forEach(panel => {
              panel.hidden =
                panel.dataset
                  .connectedFilesPanel
                  !== sourceTab;
            });

          if (!focus) {
            return;
          }

          requestAnimationFrame(
            () => {
              if (
                sourceTab === 'archive'
              ) {
                searchInput?.focus({
                  preventScroll:
                    true
                });

                return;
              }

              dropzone?.focus({
                preventScroll:
                  true
              });
            }
          );
        };

      modal
        .querySelectorAll(
          '[data-connected-files-tab]'
        )
        .forEach(
          (
            tab,
            index,
            tabs
          ) => {
            tab.addEventListener(
              'click',
              () => {
                setTab(
                  tab.dataset
                    .connectedFilesTab
                );
              }
            );

            tab.addEventListener(
              'keydown',
              event => {
                if (
                  ![
                    'ArrowLeft',
                    'ArrowRight'
                  ].includes(
                    event.key
                  )
                ) {
                  return;
                }

                event.preventDefault();

                const direction =
                  event.key
                    === 'ArrowRight'
                      ? 1
                      : -1;

                const nextIndex =
                  (
                    index
                    + direction
                    + tabs.length
                  )
                  % tabs.length;

                const next =
                  tabs[
                    nextIndex
                  ];

                setTab(
                  next.dataset
                    .connectedFilesTab,
                  {
                    focus:
                      false
                  }
                );

                next.focus();
              }
            );
          }
        );

      searchInput
        ?.addEventListener(
          'input',
          event => {
            query =
              event.currentTarget
                .value;

            renderResults();
          }
        );

      modal.addEventListener(
        'change',
        event => {
          const input =
            event.target.closest(
              '[data-connected-files-choice]'
            );

          if (
            !input
            || input.disabled
          ) {
            return;
          }

          if (
            input.checked
          ) {
            selectedIds.add(
              input.value
            );
          } else {
            selectedIds.delete(
              input.value
            );
          }

          refreshSelection();
        }
      );

      modal.addEventListener(
        'click',
        event => {
          if (
            event.target.closest(
              '[data-connected-files-clear-search]'
            )
          ) {
            query =
              '';

            if (searchInput) {
              searchInput.value =
                '';
            }

            renderResults();

            searchInput?.focus({
              preventScroll:
                true
            });

            return;
          }

          if (
            event.target.closest(
              '[data-connected-files-show-new]'
            )
          ) {
            setTab(
              'new'
            );

            return;
          }

          if (
            event.target.closest(
              '[data-connected-files-add-new]'
            )
          ) {
            event.preventDefault();
            event.stopPropagation();

            openArchiveAddFilesModal();

            return;
          }
        }
      );

      if (dropzone) {
        dropzone.addEventListener(
          'click',
          event => {
            if (
              event.target.closest(
                '[data-connected-files-add-new]'
              )
            ) {
              return;
            }

            openArchiveAddFilesModal();
          }
        );

        dropzone.addEventListener(
          'keydown',
          event => {
            if (
              ![
                'Enter',
                ' '
              ].includes(
                event.key
              )
            ) {
              return;
            }

            if (
              event.target.closest(
                'button'
              )
            ) {
              return;
            }

            event.preventDefault();

            openArchiveAddFilesModal();
          }
        );

        [
          'dragenter',
          'dragover'
        ].forEach(type => {
          dropzone.addEventListener(
            type,
            event => {
              event.preventDefault();

              dropzone
                .classList
                .add(
                  'is-dragging'
                );
            }
          );
        });

        [
          'dragleave',
          'drop'
        ].forEach(type => {
          dropzone.addEventListener(
            type,
            event => {
              event.preventDefault();

              dropzone
                .classList
                .remove(
                  'is-dragging'
                );
            }
          );
        });

        dropzone.addEventListener(
          'drop',
          () => {
            openArchiveAddFilesModal();
          }
        );
      }

      saveButton
        ?.addEventListener(
          'click',
          () => {
            const fileIds = [
              ...selectedIds
            ];

            if (
              !fileIds.length
            ) {
              return;
            }

            const result =
              typeof onSave
                === 'function'
                  ? onSave(
                      fileIds
                    )
                  : false;

            const saved =
              result === true
              || (
                result
                && typeof result
                  === 'object'
                && result.ok
                  !== false
              );

            if (!saved) {
              showToast(
                'No file links were added.'
              );

              return;
            }

            closeModal();

            if (
              typeof afterSave
                === 'function'
            ) {
              afterSave(
                fileIds,
                result
              );
            }

            const message =
              typeof successMessage
                === 'function'
                  ? successMessage(
                      fileIds.length,
                      result
                    )
                  : String(
                      successMessage
                      || ''
                    );

            if (message) {
              showToast(
                message
              );
            }
          }
        );

      renderResults();
      refreshFooter();
      setTab(
        sourceTab,
        {
          focus:
            false
        }
      );

      requestAnimationFrame(
        () => {
          if (
            sourceTab === 'archive'
          ) {
            searchInput?.focus({
              preventScroll:
                true
            });
          }
        }
      );
    }

    function createArchiveFolderRecord(
      name,
      parentId = null
    ) {
      const projectId = requireActiveProjectId();
      if (!projectId) return null;
      const normalizedName =
        String(
          name || ''
        ).trim();

      if (!normalizedName) {
        return null;
      }

      const normalizedParentId =
        archiveNormalizeFolderId(
          parentId
        );

      let id =
        `folder-${Date.now()}`;

      let suffix =
        1;

      while (
        archiveFolderById(
          id
        )
      ) {
        id =
          `folder-${Date.now()}-${suffix}`;

        suffix +=
          1;
      }

      const now =
        new Date()
          .toISOString();

      const folder = {
        id,

        projectId,

        parentId:
          normalizedParentId,

        name:
          normalizedName,

        createdAt:
          now,

        updatedAt:
          now
      };

      sampleData.archiveFolders =
        sampleData.archiveFolders
        || [];

      sampleData
        .archiveFolders
        .push(
          folder
        );

      if (
        normalizedParentId
      ) {
        state.archiveExpandedFolders[
          normalizedParentId
        ] = true;
      }

      return folder;
    }

    function openArchiveCreateFolderModal(
      parentId =
        state.archiveSelectedFolderId
    ) {
      const initialParentId =
        archiveNormalizeFolderId(
          parentId
        );

      let selectedParentId =
        initialParentId;

      let query =
        '';

      const expandedIds =
        new Set([
          null
        ]);

      /*
        Reveal the initially selected parent and
        all of its ancestors.
      */
      archiveFolderAncestors(
        initialParentId
      ).forEach(folder => {
        expandedIds.add(
          folder.id
        );
      });

      if (initialParentId) {
        expandedIds.add(
          initialParentId
        );
      }

      openModal(`
        <div
          class="
            modal
            archive-create-folder-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveNewFolderTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveNewFolderTitle">

                New folder
              </h2>

              <p>
                Enter a folder name and choose
                where it should be created.
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

          <form
            class="
              archive-create-folder-form
            "
            data-archive-create-folder-form>

            <div
              class="
                modal-body
                archive-create-folder-body
              ">

              <div
                class="
                  field
                  archive-create-folder-name-field
                ">

                <label
                  for="archiveCreateFolderName">

                  Folder name
                </label>

                <input
                  id="archiveCreateFolderName"
                  data-archive-folder-name
                  required
                  maxlength="160"
                  placeholder="e.g. Civil records">
              </div>

              <div
                class="
                  archive-create-folder-parent-picker
                "
                data-archive-create-folder-parent-picker>
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

                Create folder
              </button>
            </div>
          </form>
        </div>
      `);

      const modal =
        modalBackdrop.querySelector(
          '.archive-create-folder-modal'
        );

      const form =
        modal?.querySelector(
          '[data-archive-create-folder-form]'
        );

      const nameInput =
        form?.querySelector(
          '[data-archive-folder-name]'
        );

      const parentPickerRoot =
        form?.querySelector(
          '[data-archive-create-folder-parent-picker]'
        );

      const renderParentPicker =
        ({
          focusSearch =
            false
        } = {}) => {
          if (!parentPickerRoot) {
            return;
          }

          const parentPath =
            archiveMoveFolderPath(
              selectedParentId
            );

          parentPickerRoot.innerHTML = `
            <label
              class="
                app-search-field
                archive-create-folder-search
              "
              aria-label="Search folders">

              ${icon.search}

              <input
                type="search"
                data-archive-create-folder-search
                placeholder="Search folders"
                value="${escapeHtml(
                  query
                )}">
            </label>

            <div
              class="
                archive-move-destination
              "
              aria-live="polite">

              <span
                class="
                  archive-move-destination-label
                ">

                Parent folder
              </span>

              <strong
                class="
                  archive-move-destination-value
                ">

                ${escapeHtml(
                  parentPath
                )}
              </strong>
            </div>

            <div
              class="
                archive-move-section-label
              ">

              Folders
            </div>

            ${renderArchiveMovePicker({
              query,

              selectedId:
                selectedParentId,

              expandedIds,

              /*
                The Create modal has no unavailable
                moving/current folder. Every folder
                is a valid parent destination.
              */
              movingFolder:
                null,

              /*
                This argument is used by the latest
                shared picker implementation. Older
                signatures safely ignore it.
              */
              currentFolderState:
                null
            })}
          `;

          /*
           * This picker is rendered after openModal()
           * has localized the initial modal content.
           *
           * Localize the newly inserted subtree
           * explicitly. The same function also runs
           * after search, selection, and expand/collapse
           * rerenders.
           */
          localizeUI(
            parentPickerRoot,
            {
              suppressObserverReplay:
                true
            }
          );

          requestAnimationFrame(
            () => {
              if (!focusSearch) {
                return;
              }

              const searchInput =
                parentPickerRoot
                  .querySelector(
                    '[data-archive-create-folder-search]'
                  );

              searchInput?.focus();

              const end =
                searchInput?.value
                  .length
                || 0;

              searchInput
                ?.setSelectionRange(
                  end,
                  end
                );
            }
          );
        };

      /*
        Search is delegated because the picker
        content is rerendered after every query.
      */
      modal?.addEventListener(
        'input',
        event => {
          const searchInput =
            event.target.closest(
              '[data-archive-create-folder-search]'
            );

          if (!searchInput) {
            return;
          }

          query =
            searchInput.value;

          renderParentPicker({
            focusSearch:
              true
          });
        }
      );

      /*
        Reuse the Move picker expand and select
        controls inside this modal only.
      */
      modal?.addEventListener(
        'click',
        event => {
          const toggle =
            event.target.closest(
              '[data-archive-move-toggle]'
            );

          if (toggle) {
            const folderId =
              archiveFolderIdFromChoice(
                toggle.dataset
                  .archiveMoveToggle
              );

            if (
              expandedIds.has(
                folderId
              )
            ) {
              expandedIds.delete(
                folderId
              );
            } else {
              expandedIds.add(
                folderId
              );
            }

            renderParentPicker();

            return;
          }

          const destination =
            event.target.closest(
              '[data-archive-move-select]'
            );

          if (!destination) {
            return;
          }

          if (
            destination.disabled
            || destination.getAttribute(
              'aria-disabled'
            ) === 'true'
          ) {
            return;
          }

          selectedParentId =
            archiveFolderIdFromChoice(
              destination.dataset
                .archiveMoveSelect
            );

          /*
            Ensure a parent selected through search
            is revealed when the search is cleared.
          */
          archiveFolderAncestors(
            selectedParentId
          ).forEach(folder => {
            expandedIds.add(
              folder.id
            );
          });

          if (selectedParentId) {
            expandedIds.add(
              selectedParentId
            );
          }

          renderParentPicker();
        }
      );

      form?.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          const name =
            nameInput
              ?.value
              .trim()
            || '';

          if (!name) {
            nameInput?.focus();

            return;
          }

          const folder =
            createArchiveFolderRecord(
              name,
              selectedParentId
            );

          if (!folder) {
            nameInput?.focus();

            return;
          }

          closeModal();

          archiveNavigateToLocation(
            {
              view:
                'files',

              folderId:
                folder.id,

              search:
                '',

              searchScope:
                'folder',

              personFilterId:
                '',

              selectedFileId:
                null,

              inspectorCollapsed:
                false
            },
            {
              expandCurrent:
                true
            }
          );

          showToast(
            'Folder created.'
          );
        }
      );

      renderParentPicker();

      requestAnimationFrame(
        () => {
          nameInput?.focus();
        }
      );
    }

    function archiveSourceAccessedDateToIso(
      dateModel
    ) {
      if (
        !dateModel
        || (
          !dateModel.date
          && !dateModel.dateLabel
          && !dateModel.originalText
        )
      ) {
        return '';
      }

      const sortDate =
        String(
          dateModel.sortDate
          || ''
        );

      if (
        !/^\d{8}$/.test(
          sortDate
        )
      ) {
        return null;
      }

      const year =
        sortDate.slice(
          0,
          4
        );

      const month =
        sortDate.slice(
          4,
          6
        );

      const day =
        sortDate.slice(
          6,
          8
        );

      if (
        month === '00'
        || day === '00'
        || !isValidGregorianDate(
          year,
          month,
          day
        )
      ) {
        return null;
      }

      return `${year}-${month}-${day}`;
    }

    function collectArchiveSourceAccessedDate() {
      const fieldId =
        'archiveSourceAccessed';

      const fieldRoot =
        modalBackdrop
          ?.querySelector(
            `[data-genealogy-date-field="${fieldId}"]`
          );

      const dateModel =
        collectGenealogyDateField(
          fieldId
        );

      if (!dateModel) {
        return null;
      }

      const isoDate =
        archiveSourceAccessedDateToIso(
          dateModel
        );

      if (isoDate === null) {
        setGenealogyDateFieldError(
          fieldRoot,
          'Enter a complete date with day, month, and year.'
        );

        return null;
      }

      return isoDate;
    }

    function openArchiveSourceModal(
      sourceId = '',
      {
        onCreated =
          null
      } = {}
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      const editing =
        Boolean(
          source
        );

      const categoryOptions =
        SOURCE_CATEGORIES
          .map(category => `
            <option
              value="${escapeHtml(category.value)}"
              ${
                source?.category
                  === category.value
                    ? 'selected'
                    : ''
              }>
              ${escapeHtml(category.label)}
            </option>
          `)
          .join('');

      openModal(`
        <div
          class="modal archive-source-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveSourceModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveSourceModalTitle">
                ${
                  editing
                    ? 'Edit source'
                    : 'Add source'
                }
              </h2>

              <p>
                Record where this file or information came from.
                Only the source name is required.
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

          <form
            class="archive-source-form"
            data-archive-source-form>

            <div
              class="
                modal-body
                archive-source-form-body
              ">

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceBasicHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceBasicHeading">
                    Basic information
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceName">
                    Source name

                    <span
                      class="archive-source-required"
                      aria-hidden="true">
                      *
                    </span>
                  </label>

                  <input
                    id="archiveSourceName"
                    data-archive-source-title
                    required
                    aria-required="true"
                    autocomplete="off"
                    value="${escapeHtml(source?.title || '')}"
                    placeholder="e.g. Pawford household register">
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-identity
                  ">

                  <div class="field">
                    <label for="archiveSourceCategory">
                      Source category
                    </label>

                    <select
                      id="archiveSourceCategory"
                      class="compact-select"
                      data-archive-source-form-category>

                      <option value="">
                        Choose category
                      </option>

                      ${categoryOptions}
                    </select>
                  </div>

                  <div class="field">
                    <label for="archiveSourceProvidedBy">
                      Where or who did it come from?
                    </label>

                    <input
                      id="archiveSourceProvidedBy"
                      data-archive-source-provided-by
                      autocomplete="off"
                      value="${escapeHtml(source?.providedBy || '')}"
                      placeholder="Person, archive, website, library, or family collection">
                  </div>
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceFindingHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceFindingHeading">
                    Finding details
                  </h3>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-location
                  ">

                  <div class="field">
                    <label for="archiveSourceLocation">
                      Location
                    </label>

                    <input
                      id="archiveSourceLocation"
                      data-archive-source-location
                      autocomplete="off"
                      value="${escapeHtml(source?.location || '')}"
                      placeholder="Town, archive location, or where the item is kept">
                  </div>

                  <div class="field">
                    <label for="archiveSourceReference">
                      Where can it be found?
                    </label>

                    <input
                      id="archiveSourceReference"
                      data-archive-source-reference
                      autocomplete="off"
                      value="${escapeHtml(source?.reference || '')}"
                      placeholder="Collection, folder, volume, page, call number, or item">
                  </div>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-access
                  ">

                  <div class="field">
                    <label for="archiveSourceUrl">
                      Website or link
                    </label>

                    <input
                      id="archiveSourceUrl"
                      type="url"
                      inputmode="url"
                      autocomplete="url"
                      data-archive-source-url
                      value="${escapeHtml(source?.url || '')}"
                      placeholder="https://">
                  </div>

                  ${renderGenealogyDateField(
                    'archiveSourceAccessed',
                    'Date accessed or received',
                    source?.accessedDate
                      || '',
                    {
                      inputId:
                        'archiveSourceAccessedInput',

                      typeId:
                        'archiveSourceAccessedType',

                      defaultDateType:
                        'Exact date',

                      placeholder:
                        'e.g. 24 May 2026',

                      className:
                        'archive-source-accessed-date',

                      exactOnly:
                        true
                    }
                  )}
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceNotesHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceNotesHeading">
                    Additional notes
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceNotes">
                    Notes
                  </label>

                  <textarea
                    id="archiveSourceNotes"
                    data-archive-source-notes
                    placeholder="Add anything that will help you recognize or find this source again">${escapeHtml(source?.notes || '')}</textarea>
                </div>
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
                ${
                  editing
                    ? 'Save source'
                    : 'Create source'
                }
              </button>
            </div>
          </form>
        </div>
      `);

      const form =
        modalBackdrop.querySelector(
          '[data-archive-source-form]'
        );

      bindGenealogyDateFields(
        modalBackdrop
      );

      requestAnimationFrame(
        () => {
          modalBackdrop
            .querySelector(
              '#archiveSourceName'
            )
            ?.focus({
              preventScroll: true
            });
        }
      );

      form?.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          const projectId =
            source?.projectId
            || requireActiveProjectId();

          if (!projectId) {
            return;
          }

          const title =
            form
              .querySelector(
                '[data-archive-source-title]'
              )
              .value
              .trim();

          if (!title) {
            return;
          }

          const accessedDate =
            collectArchiveSourceAccessedDate();

          if (accessedDate === null) {
            form
              .querySelector(
                '[data-genealogy-date-input]'
              )
              ?.focus({
                preventScroll: true
              });

            return;
          }

          const now =
            new Date().toISOString();

          const target =
            source
            || {
              id:
                createRuntimeId(
                  'source'
                ),

              projectId,

              favorite:
                false,

              createdAt:
                now
            };

          target.title =
            title;

          target.category =
            form
              .querySelector(
                '[data-archive-source-form-category]'
              )
              .value;

          target.providedBy =
            form
              .querySelector(
                '[data-archive-source-provided-by]'
              )
              .value
              .trim();

          target.location =
            form
              .querySelector(
                '[data-archive-source-location]'
              )
              .value
              .trim();

          target.reference =
            form
              .querySelector(
                '[data-archive-source-reference]'
              )
              .value
              .trim();

          target.url =
            form
              .querySelector(
                '[data-archive-source-url]'
              )
              .value
              .trim();

          target.accessedDate =
            accessedDate;

          target.notes =
            form
              .querySelector(
                '[data-archive-source-notes]'
              )
              .value
              .trim();

          target.updatedAt =
            now;

          const created =
            !source;

          if (created) {
            sampleData.sources.unshift(
              target
            );
          }

          if (
            created
            && typeof onCreated
              === 'function'
          ) {
            closeModal();

            onCreated(
              target
            );

            return;
          }

          state.archiveView =
            'sources';

          state.archiveSelectedSourceId =
            target.id;

          state.archiveSearch =
            '';

          closeModal();
          renderArchive();

          showToast(
            editing
              ? 'Source updated.'
              : 'Source created.'
          );
        }
      );
    }

    function openArchiveRenameItemModal(
      type,
      id
    ) {
      const file =
        type === 'file'
          ? archiveFileById(
              id
            )
          : null;

      const folder =
        type === 'folder'
          ? archiveFolderById(
              id
            )
          : null;

      const item =
        file
        || folder;

      if (!item) {
        return;
      }

      const itemType =
        file
          ? 'file'
          : 'folder';

      const currentName =
        file?.name
        || folder?.name
        || '';

      const title =
        file
          ? 'Rename file'
          : 'Rename folder';

      const description =
        file
          ? 'Update the file name without changing its contents, folder, or links.'
          : 'Update the folder name without changing its contents or location.';

      openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveRenameItemTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveRenameItemTitle">

                ${escapeHtml(
                  title
                )}
              </h2>

              <p>
                ${escapeHtml(
                  description
                )}
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

          <form
            data-archive-rename-item-form>

            <div class="modal-body">
              <div class="field">
                <label
                  for="archiveRenameItemValue">

                  Name
                </label>

                <input
                  id="archiveRenameItemValue"
                  required
                  maxlength="220"
                  value="${escapeHtml(
                    currentName
                  )}">
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

                Rename
              </button>
            </div>
          </form>
        </div>
      `);

      const form =
        modalBackdrop.querySelector(
          '[data-archive-rename-item-form]'
        );

      const input =
        form?.querySelector(
          '#archiveRenameItemValue'
        );

      form?.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          const value =
            input
              ?.value
              .trim()
            || '';

          if (!value) {
            input?.focus();

            return;
          }

          const now =
            new Date()
              .toISOString();

          if (file) {
            file.name =
              value;

            file.updatedAt =
              now;

            file.updated =
              'Just now';
          }

          if (folder) {
            folder.name =
              value;

            folder.updatedAt =
              now;
          }

          closeModal();
          renderArchive();

          showToast(
            `${
              itemType === 'file'
                ? 'File'
                : 'Folder'
            } renamed.`
          );
        }
      );

      requestAnimationFrame(
        () => {
          input?.focus();
          input?.select();
        }
      );
    }

    function archiveMoveFolderPath(
      folderId
    ) {
      const folders =
        archiveFolderAncestors(
          folderId
        );

      return [
        ARCHIVE_ROOT_LABEL,

        ...folders.map(
          folder =>
            folder.name
        )
      ].join(
        ' / '
      );
    }

    function archiveMoveCurrentFolderState({
      movingFolder,
      files
    }) {
      /*
        When moving a folder, the folder itself is
        the unavailable "Current folder" row.
      */
      if (movingFolder) {
        return {
          hasCurrentFolder:
            true,

          folderId:
            movingFolder.id
        };
      }

      /*
        A single current folder exists only when
        all selected files share the same folder.
      */
      const folderIds =
        [
          ...new Set(
            files.map(file =>
              archiveFileFolderId(
                file
              )
            )
          )
        ];

      return {
        hasCurrentFolder:
          folderIds.length === 1,

        folderId:
          folderIds.length === 1
            ? folderIds[0]
            : null
      };
    }

    function archiveMoveNewFolderParentId({
      movingFolder,
      selectedId,
      currentFolderState
    }) {
      /*
        Create inside the explicitly selected
        destination whenever one exists.
      */
      if (
        archiveMoveHasDestination(
          selectedId
        )
      ) {
        return selectedId;
      }

      /*
        A new destination for a moving folder
        must not be created inside that folder.
        Default to its existing parent.
      */
      if (movingFolder) {
        return archiveFolderParentId(
          movingFolder
        );
      }

      /*
        For files from one location, creating a
        subfolder inside their current folder is
        a useful default.
      */
      if (
        currentFolderState
          .hasCurrentFolder
      ) {
        return currentFolderState
          .folderId;
      }

      /*
        Mixed-origin bulk selection defaults to
        the Files root.
      */
      return null;
    }

    const ARCHIVE_FOLDER_DOUBLE_CLICK_MS =
      420;

    let archiveLastFolderRowClick = {
      folderId:
        null,

      at:
        0
    };

    function archiveFolderRowWasDoubleClick(
      folderId
    ) {
      const now =
        performance.now();

      const repeated =
        archiveLastFolderRowClick
          .folderId === folderId
        && now
          - archiveLastFolderRowClick.at
          <= ARCHIVE_FOLDER_DOUBLE_CLICK_MS;

      archiveLastFolderRowClick = {
        folderId,

        at:
          now
      };

      return repeated;
    }

    function resetArchiveFolderRowClick() {
      archiveLastFolderRowClick = {
        folderId:
          null,

        at:
          0
      };
    }

    function archiveMoveInitialRevealFolderId({
      movingFolder,
      files,
      currentFolderState
    }) {
      if (movingFolder) {
        return movingFolder.id;
      }

      if (
        currentFolderState
          .hasCurrentFolder
      ) {
        return currentFolderState
          .folderId;
      }

      return archiveFileFolderId(
        files[0]
      );
    }

    function renderArchiveMoveItemSummary({
      movingFolder,
      files
    }) {
      let itemIcon =
        icon.file;

      let itemName =
        '';

      let itemMeta =
        '';

      if (movingFolder) {
        const impact =
          archiveFolderImpact(
            movingFolder.id
          );

        itemIcon =
          icon.folder;

        itemName =
          movingFolder.name
          || 'Untitled folder';

        itemMeta =
          `${impact.files} ${
            impact.files === 1
              ? 'file'
              : 'files'
          } · ${impact.folders} ${
            impact.folders === 1
              ? 'subfolder'
              : 'subfolders'
          }`;
      } else if (
        files.length === 1
      ) {
        const file =
          files[0];

        itemName =
          file.name
          || 'Untitled file';

        itemMeta =
          [
            archiveFileTypeLabel(
              file
            ),

            file.size
            || ''
          ]
            .filter(Boolean)
            .join(' · ');
      } else {
        itemName =
          `${files.length} files`;

        itemMeta =
          'Selected files';
      }

      return `
        <div
          class="
            archive-move-item-summary
          ">

          <span
            class="
              archive-move-context-label
            ">

            Moving
          </span>

          <div
            class="
              archive-move-item-row
            ">

            <span
              class="
                archive-move-item-icon
              "
              aria-hidden="true">

              ${itemIcon}
            </span>

            <span
              class="
                archive-move-item-copy
              ">

              <strong>
                ${escapeHtml(
                  itemName
                )}
              </strong>

              ${
                itemMeta
                  ? `
                    <span>
                      ${escapeHtml(
                        itemMeta
                      )}
                    </span>
                  `
                  : ''
              }
            </span>

            <button
              class="
                button
                secondary
                archive-move-item-action
              "
              type="button"
              data-archive-move-new-folder
              aria-label="Create a new destination folder"
              title="New folder">

              ${icon.plus}

              New folder
            </button>
          </div>
        </div>
      `;
    }

    function archiveMoveSelectionStats({
      movingFolder,
      files,
      selectedId
    }) {
      if (
        !archiveMoveHasDestination(
          selectedId
        )
      ) {
        return {
          canMove:
            false,

          movableFiles:
            [],

          movableCount:
            0,

          alreadyThere:
            0
        };
      }

      if (movingFolder) {
        const currentParentId =
          archiveFolderParentId(
            movingFolder
          );

        const canMove =
          currentParentId
            !== selectedId;

        return {
          canMove,

          movableFiles:
            [],

          movableCount:
            canMove
              ? 1
              : 0,

          alreadyThere:
            canMove
              ? 0
              : 1
        };
      }

      const movableFiles =
        files.filter(file =>
          archiveFileFolderId(
            file
          ) !== selectedId
        );

      return {
        canMove:
          movableFiles.length > 0,

        movableFiles,

        movableCount:
          movableFiles.length,

        alreadyThere:
          files.length
          - movableFiles.length
      };
    }

    function archiveMoveHighlightMatch(
      label,
      query
    ) {
      const normalizedLabel =
        String(
          label || ''
        );

      const normalizedQuery =
        String(
          query || ''
        )
          .trim();

      if (!normalizedQuery) {
        return escapeHtml(
          normalizedLabel
        );
      }

      const index =
        normalizedLabel
          .toLowerCase()
          .indexOf(
            normalizedQuery
              .toLowerCase()
          );

      if (index < 0) {
        return escapeHtml(
          normalizedLabel
        );
      }

      const before =
        normalizedLabel.slice(
          0,
          index
        );

      const match =
        normalizedLabel.slice(
          index,
          index
            + normalizedQuery.length
        );

      const after =
        normalizedLabel.slice(
          index
            + normalizedQuery.length
        );

      return `
        ${escapeHtml(
          before
        )}<mark>${escapeHtml(
          match
        )}</mark>${escapeHtml(
          after
        )}
      `;
    }

    function renderArchiveMoveSelectedMark() {
      return `
        <span
          class="
            archive-move-selected-mark
          "
          aria-hidden="true">

          ${icon.check}
        </span>
      `;
    }

    function renderArchiveMoveTreeFolderRows({
      parentId,
      depth,
      selectedId,
      expandedIds,
      movingFolderId,
      currentFolderState
    }) {
      return archiveFolderChildren(
        parentId
      )
        .map(folder => {
          const isMovingFolder =
            folder.id
              === movingFolderId;

          const isCurrentFolder =
            Boolean(
              currentFolderState
                ?.hasCurrentFolder
              && folder.id
                === currentFolderState
                  .folderId
            );

          const children =
            archiveFolderChildren(
              folder.id
            );

          const hasChildren =
            children.length > 0;

          const expanded =
            expandedIds.has(
              folder.id
            );

          const selected =
            archiveMoveHasDestination(
              selectedId
            )
            && selectedId
              === folder.id;

          return `
            <div
              class="
                archive-move-tree-row
              "
              style="
                --archive-move-depth:
                  ${depth};
              ">

              ${
                hasChildren
                && !isMovingFolder
                  ? `
                    <button
                      class="
                        archive-move-tree-toggle
                        ${
                          expanded
                            ? 'is-expanded'
                            : ''
                        }
                      "
                      type="button"
                      data-archive-move-toggle="${escapeHtml(
                        folder.id
                      )}"
                      aria-label="${
                        expanded
                          ? 'Collapse'
                          : 'Expand'
                      } ${escapeHtml(
                        folder.name
                      )}"
                      aria-expanded="${String(
                        expanded
                      )}">

                      ${icon.chevron}
                    </button>
                  `
                  : `
                    <span
                      class="
                        archive-move-tree-toggle
                        is-placeholder
                      "
                      aria-hidden="true">
                    </span>
                  `
              }

              <button
                class="
                  archive-move-tree-main

                  ${
                    selected
                      ? 'is-selected'
                      : ''
                  }

                  ${
                    isCurrentFolder
                      ? 'is-current-folder'
                      : ''
                  }
                "
                type="button"
                data-archive-move-select="${escapeHtml(
                  folder.id
                )}"
                aria-pressed="${String(
                  selected
                )}"
                ${
                  isCurrentFolder
                    ? 'disabled aria-disabled="true"'
                    : ''
                }>

                ${icon.folder}

                <span
                  class="
                    archive-move-folder-copy
                  ">

                  <strong>
                    ${escapeHtml(
                      folder.name
                    )}
                  </strong>

                  ${
                    isCurrentFolder
                      ? `
                        <span>
                          Current folder
                        </span>
                      `
                      : ''
                  }
                </span>

                ${
                  selected
                    ? renderArchiveMoveSelectedMark()
                    : ''
                }
              </button>
            </div>

            ${
              hasChildren
              && expanded
              && !isMovingFolder
                ? renderArchiveMoveTreeFolderRows({
                    parentId:
                      folder.id,

                    depth:
                      depth + 1,

                    selectedId,

                    expandedIds,

                    movingFolderId,

                    currentFolderState
                  })
                : ''
            }
          `;
        })
        .join('');
    }

    function renderArchiveMoveTree({
      selectedId,
      expandedIds,
      movingFolderId,
      currentFolderState
    }) {
      const rootExpanded =
        expandedIds.has(
          null
        );

      const rootCurrent =
        Boolean(
          currentFolderState
            ?.hasCurrentFolder
          && archiveIsRootLocation(
            currentFolderState
              .folderId
          )
        );

      const rootSelected =
        archiveMoveHasDestination(
          selectedId
        )
        && archiveIsRootLocation(
          selectedId
        );

      const rootHasChildren =
        archiveFolderChildren(
          null
        ).length > 0;

      return `
        <div
          class="
            archive-move-tree
          ">

          <div
            class="
              archive-move-tree-row
            "
            style="
              --archive-move-depth:
                0;
            ">

            ${
              rootHasChildren
                ? `
                  <button
                    class="
                      archive-move-tree-toggle
                      ${
                        rootExpanded
                          ? 'is-expanded'
                          : ''
                      }
                    "
                    type="button"
                    data-archive-move-toggle="${ARCHIVE_ROOT_PICKER_VALUE}"
                    aria-label="${
                      rootExpanded
                        ? `Collapse ${ARCHIVE_ROOT_LABEL}`
                        : `Expand ${ARCHIVE_ROOT_LABEL}`
                    }"
                    aria-expanded="${String(
                      rootExpanded
                    )}">

                    ${icon.chevron}
                  </button>
                `
                : `
                  <span
                    class="
                      archive-move-tree-toggle
                      is-placeholder
                    "
                    aria-hidden="true">
                  </span>
                `
            }

            <button
              class="
                archive-move-tree-main

                ${
                  rootSelected
                    ? 'is-selected'
                    : ''
                }

                ${
                  rootCurrent
                    ? 'is-current-folder'
                    : ''
                }
              "
              type="button"
              data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
              aria-pressed="${String(
                rootSelected
              )}"
              ${
                rootCurrent
                  ? 'disabled aria-disabled="true"'
                  : ''
              }>

              ${icon.folder}

              <span
                class="
                  archive-move-folder-copy
                ">

                <strong>
                  ${ARCHIVE_ROOT_LABEL}
                </strong>

                <span>
                  ${
                    rootCurrent
                      ? 'Current folder'
                      : 'Top level'
                  }
                </span>
              </span>

              ${
                rootSelected
                  ? renderArchiveMoveSelectedMark()
                  : ''
              }
            </button>
          </div>

          ${
            rootExpanded
              ? renderArchiveMoveTreeFolderRows({
                  parentId:
                    null,

                  depth:
                    1,

                  selectedId,

                  expandedIds,

                  movingFolderId,

                  currentFolderState
                })
              : ''
          }
        </div>
      `;
    }

    function renderArchiveMoveSearchResults({
      query,
      selectedId,
      movingFolder,
      currentFolderState
    }) {
      const normalizedQuery =
        String(
          query || ''
        )
          .trim()
          .toLowerCase();

      const blockedDescendantIds =
        new Set(
          movingFolder
            ? archiveFolderDescendantIds(
                movingFolder.id,
                {
                  includeSelf:
                    false
                }
              )
            : []
        );

      const rootMatches =
        `${ARCHIVE_ROOT_LABEL} files top level`
          .toLowerCase()
          .includes(
            normalizedQuery
          );

      const rootCurrent =
        Boolean(
          currentFolderState
            ?.hasCurrentFolder
          && archiveIsRootLocation(
            currentFolderState
              .folderId
          )
        );

      const rootSelected =
        archiveMoveHasDestination(
          selectedId
        )
        && archiveIsRootLocation(
          selectedId
        );

      const folders =
        archiveFlattenFolders()
          .map(item =>
            item.folder
          )
          .filter(folder =>
            !blockedDescendantIds.has(
              folder.id
            )
            && String(
              folder.name || ''
            )
              .toLowerCase()
              .includes(
                normalizedQuery
              )
          );

      if (
        !rootMatches
        && !folders.length
      ) {
        return `
          <div
            class="
              archive-move-empty
            ">

            No folders match “${escapeHtml(
              query
            )}”.
          </div>
        `;
      }

      return `
        <div
          class="
            archive-move-search-results
          ">

          ${
            rootMatches
              ? `
                <button
                  class="
                    archive-move-search-result

                    ${
                      rootSelected
                        ? 'is-selected'
                        : ''
                    }

                    ${
                      rootCurrent
                        ? 'is-current-folder'
                        : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
                  aria-pressed="${String(
                    rootSelected
                  )}"
                  ${
                    rootCurrent
                      ? 'disabled aria-disabled="true"'
                      : ''
                  }>

                  ${icon.folder}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                        ARCHIVE_ROOT_LABEL,
                        query
                      )}
                    </strong>

                    <span>
                      ${
                        rootCurrent
                          ? 'Current folder'
                          : 'Top level'
                      }
                    </span>
                  </span>

                  ${
                    rootSelected
                      ? renderArchiveMoveSelectedMark()
                      : ''
                  }
                </button>
              `
              : ''
          }

          ${folders
            .map(folder => {
              const isCurrentFolder =
                Boolean(
                  currentFolderState
                    ?.hasCurrentFolder
                  && folder.id
                    === currentFolderState
                      .folderId
                );

              const selected =
                archiveMoveHasDestination(
                  selectedId
                )
                && selectedId
                  === folder.id;

              return `
                <button
                  class="
                    archive-move-search-result

                    ${
                      selected
                        ? 'is-selected'
                        : ''
                    }

                    ${
                      isCurrentFolder
                        ? 'is-current-folder'
                        : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${escapeHtml(
                    folder.id
                  )}"
                  aria-pressed="${String(
                    selected
                  )}"
                  ${
                    isCurrentFolder
                      ? 'disabled aria-disabled="true"'
                      : ''
                  }>

                  ${icon.folder}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                        folder.name,
                        query
                      )}
                    </strong>

                    <span>
                      ${
                        isCurrentFolder
                          ? 'Current folder'
                          : escapeHtml(
                              archiveMoveFolderPath(
                                archiveFolderParentId(
                                  folder
                                )
                              )
                            )
                      }
                    </span>
                  </span>

                  ${
                    selected
                      ? renderArchiveMoveSelectedMark()
                      : ''
                  }
                </button>
              `;
            })
            .join('')}
        </div>
      `;
    }

    function renderArchiveMovePicker({
      query,
      selectedId,
      expandedIds,
      movingFolder,
      currentFolderState
    }) {
      return `
        <div
          class="
            archive-move-picker
          "
          data-archive-move-picker>

          ${
            String(
              query || ''
            ).trim()
              ? renderArchiveMoveSearchResults({
                  query,
                  selectedId,
                  movingFolder,
                  currentFolderState
                })
              : renderArchiveMoveTree({
                  selectedId,
                  expandedIds,

                  movingFolderId:
                    movingFolder?.id
                    || '',

                  currentFolderState
                })
          }
        </div>
      `;
    }

    function openArchiveMoveModal({
      fileIds = [],
      folderId = ''
    } = {}) {
      const movingFolder =
        folderId
          ? archiveFolderById(
              folderId
            )
          : null;

      const files =
        [
          ...new Set(
            fileIds
          )
        ]
          .map(id =>
            archiveFileById(
              id
            )
          )
          .filter(Boolean);

      if (
        !movingFolder
        && !files.length
      ) {
        return;
      }

      const currentFolderState =
        archiveMoveCurrentFolderState({
          movingFolder,
          files
        });

      let selectedId =
        ARCHIVE_MOVE_NO_DESTINATION;

      let query =
        '';

      let creatingFolder =
        false;

      const expandedIds =
        new Set([
          null
        ]);

      const revealFolderId =
        archiveMoveInitialRevealFolderId({
          movingFolder,
          files,
          currentFolderState
        });

      archiveFolderAncestors(
        revealFolderId
      ).forEach(folder => {
        expandedIds.add(
          folder.id
        );
      });

      if (revealFolderId) {
        expandedIds.add(
          revealFolderId
        );
      }

      const title =
        movingFolder
          ? 'Move folder'
          : files.length === 1
            ? 'Move file'
            : `Move ${files.length} files`;

      openModal(`
        <div
          class="
            modal
            archive-move-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveMoveTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveMoveTitle">

                ${escapeHtml(
                  title
                )}
              </h2>

              <p>
                Choose a destination folder.
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
            ">

            ${renderArchiveMoveItemSummary({
              movingFolder,
              files
            })}

            <div
              class="
                archive-move-content
              "
              data-archive-move-content>
            </div>
          </div>

          <div
            class="
              modal-footer
            "
            data-archive-move-footer>
          </div>
        </div>
      `);

      const modal =
        modalBackdrop.querySelector(
          '.archive-move-modal'
        );

      const contentRoot =
        modal?.querySelector(
          '[data-archive-move-content]'
        );

      const footerRoot =
        modal?.querySelector(
          '[data-archive-move-footer]'
        );

      const getNewFolderParentId =
        () =>
          archiveMoveNewFolderParentId({
            movingFolder,
            selectedId,
            currentFolderState
          });

      const renderMoveContent =
        ({
          focusSearch =
            false,

          focusFolderName =
            false
        } = {}) => {
          const stats =
            archiveMoveSelectionStats({
              movingFolder,
              files,
              selectedId
            });

      const hasDestination =
        archiveMoveHasDestination(
          selectedId
        );

      const destinationPath =
        hasDestination
          ? archiveMoveFolderPath(
              selectedId
            )
          : 'Choose a folder';

      const newFolderParentId =
        getNewFolderParentId();

      const newFolderParentPath =
        archiveMoveFolderPath(
          newFolderParentId
        );

          if (contentRoot) {
            contentRoot.innerHTML = `
              <label
                class="
                  app-search-field
                  archive-move-search-field
                "
                aria-label="Search folders">

                ${icon.search}

                <input
                  type="search"
                  data-archive-move-search
                  placeholder="Search folders"
                  value="${escapeHtml(
                    query
                  )}">
              </label>

              <div
                class="
                  archive-move-destination
                "
                aria-live="polite">

                <span
                  class="
                    archive-move-destination-label
                  ">

                  Destination
                </span>

                <strong
                  class="
                    archive-move-destination-value

                    ${
                      hasDestination
                        ? ''
                        : 'is-placeholder'
                    }
                  ">

                  ${escapeHtml(
                    destinationPath
                  )}
                </strong>
              </div>

              ${
                creatingFolder
                  ? `
                    <form
                      class="
                        archive-move-new-folder-form
                      "
                      data-archive-move-new-folder-form>

                      <div
                        class="
                          archive-move-new-folder-context
                        ">

                        <span>
                          Create inside
                        </span>

                        <strong>
                          ${escapeHtml(
                            newFolderParentPath
                          )}
                        </strong>
                      </div>

                      <div
                        class="
                          archive-move-new-folder-fields
                        ">

                        <input
                          data-archive-move-new-folder-name
                          required
                          maxlength="160"
                          placeholder="Folder name">

                        <button
                          class="
                            button
                            secondary
                          "
                          type="button"
                          data-archive-move-cancel-new-folder>

                          Cancel
                        </button>

                        <button
                          class="
                            button
                            primary
                          "
                          type="submit">

                          Create
                        </button>
                      </div>
                    </form>
                  `
                  : ''
              }

              <div
                class="
                  archive-move-section-label
                ">

                Folders
              </div>

              ${renderArchiveMovePicker({
                query,
                selectedId,
                expandedIds,
                movingFolder,
                currentFolderState
              })}
            `;
          }

          if (footerRoot) {
            const buttonLabel =
              !archiveMoveHasDestination(selectedId)
              || movingFolder
              || files.length === 1
                ? 'Move here'
                : `Move ${stats.movableCount} files`;

            footerRoot.innerHTML = `
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-move-confirm
                ${stats.canMove ? '' : 'disabled aria-disabled="true"'}>
                ${escapeHtml(buttonLabel)}
              </button>
            `;

            // The footer is recreated on every render, so bind its new button.
            footerRoot
              .querySelector('[data-close]')
              ?.addEventListener('click', closeModal);
          }

          // Translate after both the folder picker and footer have been rendered.
          localizeUI(modal, {
            suppressObserverReplay: true
          });

          requestAnimationFrame(
            () => {
              if (focusSearch) {
                const searchInput =
                  modal?.querySelector(
                    '[data-archive-move-search]'
                  );

                searchInput?.focus();

                const end =
                  searchInput?.value
                    .length
                  || 0;

                searchInput?.setSelectionRange(
                  end,
                  end
                );
              }

              if (focusFolderName) {
                modal
                  ?.querySelector(
                    '[data-archive-move-new-folder-name]'
                  )
                  ?.focus();
              }
            }
          );
        };

      const commitMove =
        () => {
          if (
            !archiveMoveHasDestination(
              selectedId
            )
          ) {
            return;
          }
          if (
            selectedId
            && !archiveFolderById(
              selectedId
            )
          ) {
            return;
          }

          const stats =
            archiveMoveSelectionStats({
              movingFolder,
              files,
              selectedId
            });

          if (!stats.canMove) {
            return;
          }

          const destinationPath =
            archiveMoveFolderPath(
              selectedId
            );

          const now =
            new Date()
              .toISOString();

          const folderSnapshot =
            movingFolder
              ? {
                  id:
                    movingFolder.id,

                  parentId:
                    archiveFolderParentId(
                      movingFolder
                    ),

                  updatedAt:
                    movingFolder.updatedAt
                }
              : null;

          const fileSnapshots =
            stats.movableFiles
              .map(file => ({
                id:
                  file.id,

                folderId:
                  archiveFileFolderId(
                    file
                  ),

                updatedAt:
                  file.updatedAt,

                updated:
                  file.updated
              }));

          if (movingFolder) {
            movingFolder.parentId =
              selectedId;

            movingFolder.updatedAt =
              now;

            if (selectedId) {
              state.archiveExpandedFolders[
                selectedId
              ] = true;
            }
          } else {
            stats.movableFiles
              .forEach(file => {
                file.folderId =
                  selectedId;

                file.updatedAt =
                  now;

                file.updated =
                  'Just now';
              });

            state.archiveSelectedFileIds =
              [];

            if (
              stats.movableFiles
                .some(file =>
                  file.id
                    === state.archiveSelectedFileId
                )
            ) {
              state.archiveSelectedFileId =
                null;
            }
          }

          const movedCount =
            movingFolder
              ? 1
              : stats.movableCount;

          const movedMessage =
            movingFolder
              ? `${
                  movingFolder.name
                  || 'Folder'
                } moved to ${destinationPath}.`
              : movedCount === 1
                ? `${
                    stats.movableFiles[0]
                      ?.name
                    || 'File'
                  } moved to ${destinationPath}.`
                : `${movedCount} files moved to ${destinationPath}.`;

          const openFolderId =
            movingFolder
              ? movingFolder.id
              : selectedId;

          closeModal();
          renderArchive();

          showActionToast({
            message:
              movedMessage,

            actions: [
              {
                label:
                  'Undo',

                onClick:
                  () => {
                    if (folderSnapshot) {
                      const folder =
                        archiveFolderById(
                          folderSnapshot.id
                        );

                      if (folder) {
                        folder.parentId =
                          folderSnapshot.parentId;

                        folder.updatedAt =
                          folderSnapshot.updatedAt;
                      }
                    }

                    fileSnapshots
                      .forEach(snapshot => {
                        const file =
                          archiveFileById(
                            snapshot.id
                          );

                        if (!file) {
                          return;
                        }

                        file.folderId =
                          snapshot.folderId;

                        file.updatedAt =
                          snapshot.updatedAt;

                        file.updated =
                          snapshot.updated;
                      });

                    renderArchive();

                    showToast(
                      'Move undone.'
                    );
                  }
              },

              {
                label:
                  'Open folder',

                onClick:
                  () => {
                    archiveNavigateToLocation(
                      {
                        view:
                          'files',

                        folderId:
                          openFolderId,

                        search:
                          '',

                        searchScope:
                          'folder',

                        personFilterId:
                          '',

                        selectedFileId:
                          null,

                        inspectorCollapsed:
                          false
                      },
                      {
                        expandCurrent:
                          true
                      }
                    );
                  }
              }
            ]
          });
        };

      modal?.addEventListener(
        'input',
        event => {
          const searchInput =
            event.target.closest(
              '[data-archive-move-search]'
            );

          if (!searchInput) {
            return;
          }

          query =
            searchInput.value;

          renderMoveContent({
            focusSearch:
              true
          });
        }
      );

      modal?.addEventListener(
        'submit',
        event => {
          const form =
            event.target.closest(
              '[data-archive-move-new-folder-form]'
            );

          if (!form) {
            return;
          }

          event.preventDefault();

          const name =
            form
              .querySelector(
                '[data-archive-move-new-folder-name]'
              )
              ?.value
              .trim()
            || '';

          const parentId =
            getNewFolderParentId();

          const folder =
            createArchiveFolderRecord(
              name,
              parentId
            );

          if (!folder) {
            form
              .querySelector(
                '[data-archive-move-new-folder-name]'
              )
              ?.focus();

            return;
          }

          expandedIds.add(
            parentId
          );

          selectedId =
            folder.id;

          query =
            '';

          creatingFolder =
            false;

          renderMoveContent();
        }
      );

      modal?.addEventListener(
        'click',
        event => {
          const toggle =
            event.target.closest(
              '[data-archive-move-toggle]'
            );

          if (toggle) {
            const folderId =
              archiveFolderIdFromChoice(
                toggle.dataset
                  .archiveMoveToggle
              );

            if (
              expandedIds.has(
                folderId
              )
            ) {
              expandedIds.delete(
                folderId
              );
            } else {
              expandedIds.add(
                folderId
              );
            }

            renderMoveContent();

            return;
          }

          const destination =
            event.target.closest(
              '[data-archive-move-select]'
            );

          if (destination) {
            if (
              destination.disabled
              || destination.getAttribute(
                'aria-disabled'
              ) === 'true'
            ) {
              return;
            }

            selectedId =
              archiveFolderIdFromChoice(
                destination.dataset
                  .archiveMoveSelect
              );

            renderMoveContent();

            return;
          }

          if (
            event.target.closest(
              '[data-archive-move-new-folder]'
            )
          ) {
            if (
              creatingFolder
            ) {
              modal
                ?.querySelector(
                  '[data-archive-move-new-folder-name]'
                )
                ?.focus();

              return;
            }

            creatingFolder =
              true;

            renderMoveContent({
              focusFolderName:
                true
            });

            return;
          }

          if (
            event.target.closest(
              '[data-archive-move-cancel-new-folder]'
            )
          ) {
            creatingFolder =
              false;

            renderMoveContent();

            return;
          }

          if (
            event.target.closest(
              '[data-archive-move-confirm]'
            )
          ) {
            commitMove();
          }
        }
      );

      renderMoveContent();
    }

    function archiveFilesForLinkAction(
      fileIds
    ) {
      const files =
        archiveUniqueIds(
          fileIds
        )
          .map(id =>
            archiveFileById(
              id
            )
          )
          .filter(Boolean);

      if (!files.length) {
        return [];
      }

      const projectId =
        files[0].projectId
        || currentProjectId();

      return files.filter(file =>
        (
          file.projectId
          || currentProjectId()
        ) === projectId
      );
    }

    function archiveCommonFileConnectionIds(
      files,
      entityType
    ) {
      if (!files.length) {
        return [];
      }

      const remainingSets =
        files
          .slice(1)
          .map(file =>
            new Set(
              archiveConnectionIds(
                'file',
                file.id,
                entityType
              )
            )
          );

      return archiveUniqueIds(
        archiveConnectionIds(
          'file',
          files[0].id,
          entityType
        )
      ).filter(recordId =>
        remainingSets.every(set =>
          set.has(
            recordId
          )
        )
      );
    }

    function archiveCommitFileConnections({
      fileIds =
        [],

      entityType =
        '',

      recordIds =
        []
    } = {}) {
      const normalizedFileIds =
        archiveUniqueIds(
          fileIds
        );

      const normalizedRecordIds =
        archiveUniqueIds(
          recordIds
        );

      const result = {
        ok:
          false,

        fileCount:
          normalizedFileIds.length,

        recordCount:
          normalizedRecordIds.length,

        changedFileCount:
          0,

        addedLinkCount:
          0,

        failedWrites:
          []
      };

      if (
        !normalizedFileIds.length
        || !normalizedRecordIds.length
      ) {
        return result;
      }

      if (
        entityType === 'place'
        && normalizedRecordIds.length > 1
      ) {
        result.failedWrites.push({
          fileId: '',
          recordId: '',
          reason: 'Archive files support one place'
        });

        return result;
      }

      const files =
        normalizedFileIds.map(fileId =>
          archiveFileById(fileId)
        );

      const records =
        normalizedRecordIds.map(recordId =>
          archiveConnectionRecord(
            entityType,
            recordId
          )
        );

      files.forEach((file, index) => {
        if (!file) {
          result.failedWrites.push({
            fileId:
              normalizedFileIds[index],

            recordId: '',
            reason: 'File not found'
          });
        }
      });

      records.forEach((record, index) => {
        if (!record) {
          result.failedWrites.push({
            fileId: '',
            recordId:
              normalizedRecordIds[index],

            reason: 'Linked record not found'
          });
        }
      });

      files.filter(Boolean).forEach(file => {
        records.filter(Boolean).forEach(record => {
          if (
            file.projectId
            && record.projectId
            && file.projectId
              !== record.projectId
          ) {
            result.failedWrites.push({
              fileId:
                file.id,

              recordId:
                record.id,

              reason:
                'Records belong to different projects'
            });
          }
        });
      });

      if (result.failedWrites.length) {
        console.warn(
          '[Archive bulk links]',
          result.failedWrites
        );

        return result;
      }

      const writes =
        files.flatMap(file =>
          normalizedRecordIds
            .filter(recordId =>
              !archiveConnectionIds(
                'file',
                file.id,
                entityType
              ).includes(recordId)
            )
            .map(recordId => ({
              ownerType: 'file',
              ownerId: file.id,
              entityType,
              entityId: recordId,
              shouldLink: true
            }))
        );

      if (!writes.length) {
        return result;
      }

      const committed =
        archiveSetConnectionsAtomically(
          writes
        );

      if (!committed.ok) {
        result.failedWrites.push({
          fileId: '',
          recordId: '',
          reason: 'Relationships were not written'
        });

        console.warn(
          '[Archive bulk links]',
          result.failedWrites
        );

        return result;
      }

      result.addedLinkCount =
        committed.changedCount;

      result.changedFileCount =
        new Set(
          writes.map(write =>
            write.ownerId
          )
        ).size;

      result.ok =
        result.addedLinkCount > 0;

      if (
        result.failedWrites.length
      ) {
        console.warn(
          '[Archive bulk links]',
          result.failedWrites
        );
      }

      return result;
    }

    function archiveBulkLinkSubtitle(
      files
    ) {
      if (
        files.length === 1
      ) {
        return files[0].name
          || 'Untitled file';
      }

      return `${files.length} selected files`;
    }

    function finishArchiveBulkLinkAction(
      fileIds
    ) {
      const normalizedFileIds =
        archiveUniqueIds(
          fileIds
        );

      const firstFile =
        normalizedFileIds
          .map(fileId =>
            archiveFileById(
              fileId
            )
          )
          .find(Boolean);

      state.archiveSelectedFileIds =
        [];

      state.archiveSelectedFileId =
        firstFile?.id
        || state.archiveSelectedFileId;

      state.archiveInspectorCollapsed =
        false;

      renderArchive();
    }

    function openArchiveFilesNoteModal(
      fileIds
    ) {
      const files =
        archiveFilesForLinkAction(
          fileIds
        );

      const ids =
        files.map(file =>
          file.id
        );

      if (!files.length) {
        return;
      }

      const singleFile =
        files.length === 1
          ? files[0]
          : null;

      const existingNoteIds =
        singleFile
          ? archiveNoteIdsForFile(
              singleFile
            )
          : archiveCommonFileConnectionIds(
              files,
              'note'
            );

      openNoteLinkPickerModal({
        projectId:
          files[0].projectId
          || currentProjectId(),

        title:
          singleFile
            ? 'Add note'
            : 'Add notes',

        description:
          singleFile
            ? `Link existing notes to “${
                singleFile.name
                || 'this file'
              }”.`
            : `Link existing notes to ${
                files.length
              } selected files.`,

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          singleFile
            ? 'already linked'
            : 'linked to all selected files',

        createLabel:
          'Create linked note',

        /*
          Creating a Note from an Archive context
          currently accepts one owner only. Preserve
          it for one file and hide it in bulk mode.
        */
        onCreate:
          singleFile
            ? () =>
                openNewNoteForContext(
                  'archiveFile',
                  singleFile.id
                )
            : null,

        onSave:
          selectedNoteIds => {
            if (singleFile) {
              const currentFile =
                archiveFileById(
                  singleFile.id
                );

              if (!currentFile) {
                return false;
              }

              const result =
                archiveCommitFileConnections({
                  fileIds: [
                    currentFile.id
                  ],

                  entityType:
                    'note',

                  recordIds:
                    selectedNoteIds
                });

              return result.ok
                ? result
                : false;
            }

            const result =
              archiveCommitFileConnections({
                fileIds:
                  ids,

                entityType:
                  'note',

                recordIds:
                  selectedNoteIds
              });

            if (!result.ok) {
              showToast(
                'No notes were linked.'
              );

              return false;
            }

            return result;
          },

        afterSave:
          singleFile
            ? renderArchive
            : () => {
                finishArchiveBulkLinkAction(
                  ids
                );
              },

        successMessage:
          singleFile
            ? count =>
                `${count} ${
                  count === 1
                    ? 'note was'
                    : 'notes were'
                } linked to the file.`
            : count =>
                `${count} ${
                  count === 1
                    ? 'link was'
                    : 'links were'
                } added to ${files.length} files.`
      });
    }

    function openArchiveFileNoteModal(
      fileId
    ) {
      openArchiveFilesNoteModal(
        [
          fileId
        ]
      );
    }

    function openArchiveFilesPlaceModal(
      fileIds
    ) {
      const files =
        archiveFilesForLinkAction(
          fileIds
        );

      if (!files.length) {
        return;
      }

      const config =
        archiveEntityConfig(
          'place'
        );

      const records =
        config.records();

      const currentPlaceIds =
        files.map(file =>
          archiveDocumentPlace(
            file
          ).placeId
          || ''
        );

      const commonPlaceId =
        currentPlaceIds.length
        && currentPlaceIds.every(id =>
          id === currentPlaceIds[0]
        )
          ? currentPlaceIds[0]
          : '';

      let query =
        '';

      let selectedPlaceId =
        commonPlaceId;

      openModal(`
        <div
          class="modal notes-related-modal archive-link-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archivePlacePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="archivePlacePickerTitle">
                ${files.length === 1 ? 'Set file place' : 'Set place for files'}
              </h2>
              <p>
                Choose one project place. It will replace the current place in File details${files.length === 1 ? '.' : ' for every selected file.'}
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

          <div class="modal-body form-grid">
            <label
              class="app-search-field archive-link-picker-search"
              aria-label="Search places">
              ${icon.search}
              <input
                type="search"
                data-archive-place-search
                placeholder="Search places..."
                autocomplete="off"
                aria-label="Search places">
            </label>

            <div
              class="archive-modal-list"
              data-archive-place-results
              role="radiogroup"
              aria-label="Project places">
            </div>
          </div>

          <div class="modal-footer">
            <span
              class="archive-link-picker-status"
              data-archive-place-status
              aria-live="polite">
            </span>

            <div class="archive-modal-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-place-save>
                Save place
              </button>
            </div>
          </div>
        </div>
      `);

      const modal =
        modalBackdrop.querySelector(
          '.archive-link-picker-modal'
        );

      const results =
        modal.querySelector(
          '[data-archive-place-results]'
        );

      const status =
        modal.querySelector(
          '[data-archive-place-status]'
        );

      const save =
        modal.querySelector(
          '[data-archive-place-save]'
        );

      const updateStatus = () => {
        const changedFiles =
          selectedPlaceId
            ? currentPlaceIds.filter(id =>
                id !== selectedPlaceId
              ).length
            : 0;

        status.textContent =
          selectedPlaceId
            ? changedFiles
              ? `${changedFiles} ${changedFiles === 1 ? 'file' : 'files'} will be updated`
              : 'This place is already linked'
            : 'Select one place';

        save.disabled =
          !selectedPlaceId
          || changedFiles === 0;
      };

      const refresh = () => {
        const normalizedQuery =
          query.trim().toLowerCase();

        const visible =
          records.filter(record =>
            [
              config.label(record),
              config.meta(record),
              ...(record.alternativeNames || [])
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)
          );

        results.innerHTML =
          visible.length
            ? visible.map(record => {
                const selected =
                  record.id === selectedPlaceId;

                const current =
                  currentPlaceIds.includes(
                    record.id
                  );

                return `
                  <label class="archive-modal-choice">
                    <input
                      type="radio"
                      name="archiveFilePlace"
                      data-archive-place-choice
                      value="${escapeHtml(record.id)}"
                      ${selected ? 'checked' : ''}>

                    <span class="archive-modal-choice-copy">
                      <strong>${escapeHtml(config.label(record))}</strong>
                      <span>${escapeHtml(config.meta(record))}</span>
                    </span>

                    <span>${current ? 'Current' : ''}</span>
                  </label>
                `;
              }).join('')
            : '<div class="archive-section-empty">No matching places.</div>';

        updateStatus();
      };

      modal
        .querySelector(
          '[data-archive-place-search]'
        )
        ?.addEventListener(
          'input',
          event => {
            query =
              event.currentTarget.value;

            refresh();
          }
        );

      modal.addEventListener(
        'change',
        event => {
          const input =
            event.target.closest(
              '[data-archive-place-choice]'
            );

          if (!input) {
            return;
          }

          selectedPlaceId =
            input.value;

          updateStatus();
        }
      );

      save.addEventListener(
        'click',
        () => {
          if (
            !selectedPlaceId
            || save.disabled
          ) {
            return;
          }

          const changedFiles =
            files.filter(file =>
              archiveDocumentPlace(file).placeId
                !== selectedPlaceId
            );

          const writes =
            changedFiles.flatMap(file => {
              const currentPlaceId =
                archiveDocumentPlace(
                  file
                ).placeId;

              return [
                ...(currentPlaceId
                  ? [{
                      ownerType: 'file',
                      ownerId: file.id,
                      entityType: 'place',
                      entityId: currentPlaceId,
                      shouldLink: false
                    }]
                  : []),

                {
                  ownerType: 'file',
                  ownerId: file.id,
                  entityType: 'place',
                  entityId: selectedPlaceId,
                  shouldLink: true
                }
              ];
            });

          const committed =
            archiveSetConnectionsAtomically(
              writes
            );

          if (!committed.ok) {
            showToast(
              'The place could not be linked to every file.'
            );

            return;
          }

          const changedCount =
            changedFiles.length;

          closeModal();
          finishArchiveBulkLinkAction(
            files.map(file =>
              file.id
            )
          );

          showToast(
            changedCount === 1
              ? 'File place updated.'
              : `${changedCount} file places updated.`
          );
        }
      );

      refresh();

      requestAnimationFrame(() =>
        modal
          .querySelector(
            '[data-archive-place-search]'
          )
          ?.focus()
      );
    }

    function openArchiveSourcePeopleModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      const projectId =
        source.projectId
        || currentProjectId();

      const initialPersonIds =
        sourceTargetIds(
          source.id,
          'person',
          projectId
        );

      /*
        People connected to files from this source
        receive priority in Suggested people.
        All project people remain searchable.
      */
      const suggestedPersonIds =
        archiveUniqueIds(
          archiveFilesForSource(
            source.id
          ).flatMap(file =>
            file.linkedPersonIds
            || []
          )
        );

      openPeopleLinkModal({
        projectId,

        title:
          'Add people',

        subtitle:
          source.title
          || 'Untitled source',

        initialPersonIds,

        suggestedPersonIds,

        selectedHeading:
          'Linked people',

        saveLabel:
          'Save people',

        onSave:
          nextPersonIds => {
            const currentSource =
              archiveSourceById(
                source.id,
                projectId
              );

            if (!currentSource) {
              showToast(
                'The source is no longer available.'
              );

              return false;
            }

            const currentIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'person',
                  projectId
                )
              );

            const desiredIds =
              new Set(
                archiveUniqueIds(
                  nextPersonIds
                )
              );

            /*
              Save the entire edited selection:
              remove deselected people and add newly
              selected people in one atomic operation.
            */
            const writes = [
              ...[...currentIds]
                .filter(personId =>
                  !desiredIds.has(
                    personId
                  )
                )
                .map(personId => ({
                  ownerType:
                    'source',

                  ownerId:
                    currentSource.id,

                  entityType:
                    'person',

                  entityId:
                    personId,

                  shouldLink:
                    false
                })),

              ...[...desiredIds]
                .filter(personId =>
                  !currentIds.has(
                    personId
                  )
                )
                .map(personId => ({
                  ownerType:
                    'source',

                  ownerId:
                    currentSource.id,

                  entityType:
                    'person',

                  entityId:
                    personId,

                  shouldLink:
                    true
                }))
            ];

            const committed =
              archiveSetConnectionsAtomically(
                writes
              );

            if (!committed.ok) {
              showToast(
                'People links could not be updated.'
              );

              return false;
            }

            /*
              Verify that the canonical sourceLinks
              collection now matches the modal state.
            */
            const savedIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'person',
                  projectId
                )
              );

            const savedCorrectly =
              savedIds.size
                === desiredIds.size
              && [...desiredIds].every(
                personId =>
                  savedIds.has(
                    personId
                  )
              );

            if (!savedCorrectly) {
              showToast(
                'People links could not be updated.'
              );

              return false;
            }

            return committed;
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          'Linked people updated.'
      });
    }

    function openArchiveSourceEventsModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      const projectId =
        source.projectId
        || currentProjectId();

      const initiallyLinkedEventIds =
        sourceTargetIds(
          source.id,
          'event',
          projectId
        );

      /*
        People connected directly to the Source
        appear first in the Notes-style person list.
      */
      const primaryPersonIds =
        sourceTargetIds(
          source.id,
          'person',
          projectId
        );

      /*
        People connected through files from this
        Source are useful secondary suggestions.
      */
      const secondaryPersonIds =
        archiveUniqueIds(
          archiveFilesForSource(
            source.id
          ).flatMap(file =>
            file.linkedPersonIds
            || []
          )
        );

      openEventLinkModal({
        projectId,

        title:
          'Add events',

        subtitle:
          source.title
          || 'Untitled source',

        initiallyLinkedEventIds,

        primaryPersonIds,

        secondaryPersonIds,

        alreadyLinkedTarget:
          'this source',

        onSave:
          selectedEventIds => {
            const currentSource =
              archiveSourceById(
                source.id,
                projectId
              );

            if (!currentSource) {
              showToast(
                'The source is no longer available.'
              );

              return false;
            }

            const currentEventIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'event',
                  projectId
                )
              );

            /*
              openEventLinkModal is additive:
              previously linked Events are disabled,
              and selectedEventIds contains new choices.
            */
            const eventIdsToAdd =
              archiveUniqueIds(
                selectedEventIds
              ).filter(eventId =>
                !currentEventIds.has(
                  eventId
                )
              );

            const writes =
              eventIdsToAdd.map(
                eventId => ({
                  ownerType:
                    'source',

                  ownerId:
                    currentSource.id,

                  entityType:
                    'event',

                  entityId:
                    eventId,

                  shouldLink:
                    true
                })
              );

            const committed =
              archiveSetConnectionsAtomically(
                writes
              );

            if (!committed.ok) {
              showToast(
                'No events were linked.'
              );

              return false;
            }

            /*
              Verify the canonical sourceLinks data,
              including the unlikely case where the
              Source changed while the modal was open.
            */
            const savedEventIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'event',
                  projectId
                )
              );

            const savedCorrectly =
              selectedEventIds.every(
                eventId =>
                  savedEventIds.has(
                    eventId
                  )
              );

            if (!savedCorrectly) {
              showToast(
                'No events were linked.'
              );

              return false;
            }

            return {
              ...committed,

              addedLinkCount:
                eventIdsToAdd.length
            };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
            `${count} ${
              count === 1
                ? 'event'
                : 'events'
            } added to source.`
      });
    }

    function openArchiveSourceNotesModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      const projectId =
        source.projectId
        || currentProjectId();

      const existingNoteIds =
        sourceTargetIds(
          source.id,
          'note',
          projectId
        );

      openNoteLinkPickerModal({
        projectId,

        title:
          'Add notes',

        description:
          `Link existing notes to “${
            source.title
            || 'Untitled source'
          }”.`,

        helperText:
          'Linked notes remain available in the Notes module.',

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        onCreate:
          () => {
            const currentSource =
              archiveSourceById(
                source.id,
                projectId
              );

            if (!currentSource) {
              showToast(
                'The source is no longer available.'
              );

              return;
            }

            /*
              Source is already supported by the
              canonical Notes context model.
            */
            openNewNoteForContext(
              'source',
              currentSource.id
            );
          },

        onSave:
          selectedNoteIds => {
            const currentSource =
              archiveSourceById(
                source.id,
                projectId
              );

            if (!currentSource) {
              showToast(
                'The source is no longer available.'
              );

              return false;
            }

            const currentNoteIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'note',
                  projectId
                )
              );

            const noteIdsToAdd =
              archiveUniqueIds(
                selectedNoteIds
              ).filter(noteId =>
                !currentNoteIds.has(
                  noteId
                )
              );

            const writes =
              noteIdsToAdd.map(
                noteId => ({
                  ownerType:
                    'source',

                  ownerId:
                    currentSource.id,

                  entityType:
                    'note',

                  entityId:
                    noteId,

                  shouldLink:
                    true
                })
              );

            const committed =
              archiveSetConnectionsAtomically(
                writes
              );

            if (!committed.ok) {
              showToast(
                'No notes were linked.'
              );

              return false;
            }

            return {
              ...committed,

              addedLinkCount:
                committed.changedCount
            };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          'Notes linked to source.'
      });
    }

    function openArchiveSourcePhotosModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      const projectId =
        source.projectId
        || currentProjectId();

      const initialPhotoIds =
        sourceTargetIds(
          source.id,
          'photo',
          projectId
        );

      openPhotoLinkModal({
        projectId,

        title:
          'Add photos to source',

        description:
          `Selected and uploaded photos will be linked to ${
            source.title
            || 'Untitled source'
          }.`,

        ownerLabel:
          'this source',

        initiallyLinkedPhotoIds:
          initialPhotoIds,

        uploadDraftIdPrefix:
          'source-photo-upload-draft',

        uploadedPhotoIdPrefix:
          `photo-source-${source.id}`,

        onSave:
          addedIds => {
            const currentSource =
              archiveSourceById(
                source.id,
                projectId
              );

            if (!currentSource) {
              return false;
            }

            const currentIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'photo',
                  projectId
                )
              );

            const photoIdsToAdd =
              archiveUniqueIds(
                addedIds
              ).filter(photoId =>
                !currentIds.has(
                  photoId
                )
              );

            const writes =
              photoIdsToAdd.map(
                photoId => ({
                  ownerType:
                    'source',

                  ownerId:
                    currentSource.id,

                  entityType:
                    'photo',

                  entityId:
                    photoId,

                  shouldLink:
                    true
                })
              );

            const committed =
              archiveSetConnectionsAtomically(
                writes
              );

            if (!committed.ok) {
              return false;
            }

            const savedIds =
              new Set(
                sourceTargetIds(
                  currentSource.id,
                  'photo',
                  projectId
                )
              );

            const savedCorrectly =
              addedIds.every(
                photoId =>
                  savedIds.has(
                    photoId
                  )
              );

            return {
              ...committed,
              ok:
                savedCorrectly
            };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
            `${count} ${
              count === 1
                ? 'photo'
                : 'photos'
            } added to source.`
      });
    }

    function openArchiveSourcePlacesModal(
      sourceId
    ) {
      const source =
        archiveSourceById(
          sourceId
        );

      if (!source) {
        showToast(
          'The source is no longer available.'
        );

        return;
      }

      const projectId =
        source.projectId
        || currentProjectId();

      const initialPlaceIds =
        sourceTargetIds(
          source.id,
          'place',
          projectId
        );

      const filePlaceIds =
        archiveFilesForSource(
          source.id
        )
          .map(file =>
            archiveDocumentPlace(
              file
            ).placeId
          )
          .filter(Boolean);

      const notePlaceIds =
        sourceTargetIds(
          source.id,
          'note',
          projectId
        ).flatMap(noteId => {
          const note =
            getNote(
              noteId,
              {
                projectId,
                includeArchived:
                  true
              }
            );

          return note?.linkedPlaceIds
            || [];
        });

      const eventPlaceIds =
        sourceTargetIds(
          source.id,
          'event',
          projectId
        )
          .map(eventId =>
            archiveConnectionRecord(
              'event',
              eventId
            )?.placeId
          )
          .filter(Boolean);

      const suggestedPlaceIds =
        archiveUniqueIds([
          ...filePlaceIds,
          ...notePlaceIds,
          ...eventPlaceIds
        ]);

      openNotesPlacesModal({
        linkContext: {
          projectId,

          title:
            'Add places',

          subtitle:
            source.title
            || 'Untitled source',

          initialPlaceIds,

          suggestedPlaceIds,

          renderContext:
            renderArchivePreservingSourceInspectorScroll,

          onSave:
            nextPlaceIds => {
              const currentSource =
                archiveSourceById(
                  source.id,
                  projectId
                );

              if (!currentSource) {
                showToast(
                  'The source is no longer available.'
                );

                return false;
              }

              const currentIds =
                new Set(
                  sourceTargetIds(
                    currentSource.id,
                    'place',
                    projectId
                  )
                );

              const desiredIds =
                new Set(
                  archiveUniqueIds(
                    nextPlaceIds
                  )
                );

              const writes = [
                ...[...currentIds]
                  .filter(placeId =>
                    !desiredIds.has(
                      placeId
                    )
                  )
                  .map(placeId => ({
                    ownerType:
                      'source',

                    ownerId:
                      currentSource.id,

                    entityType:
                      'place',

                    entityId:
                      placeId,

                    shouldLink:
                      false
                  })),

                ...[...desiredIds]
                  .filter(placeId =>
                    !currentIds.has(
                      placeId
                    )
                  )
                  .map(placeId => ({
                    ownerType:
                      'source',

                    ownerId:
                      currentSource.id,

                    entityType:
                      'place',

                    entityId:
                      placeId,

                    shouldLink:
                      true
                  }))
              ];

              const committed =
                archiveSetConnectionsAtomically(
                  writes
                );

              if (!committed.ok) {
                showToast(
                  'Place links could not be updated.'
                );

                return false;
              }

              const savedIds =
                new Set(
                  sourceTargetIds(
                    currentSource.id,
                    'place',
                    projectId
                  )
                );

              const savedCorrectly =
                savedIds.size
                  === desiredIds.size
                && [...desiredIds].every(
                  placeId =>
                    savedIds.has(
                      placeId
                    )
                );

              if (!savedCorrectly) {
                showToast(
                  'Place links could not be updated.'
                );

                return false;
              }

              return committed;
            },

          afterSave:
            renderArchivePreservingSourceInspectorScroll,

          successMessage:
            'Place links updated.'
        }
      });
    }

    function openArchiveConnectionPicker({ ownerType, ownerIds, entityType }) {
      const config = archiveEntityConfig(entityType);
      const ids = archiveUniqueIds(ownerIds);
      if (!config || !ids.length) return;
      const records = config.records();
      const existingSets = ids.map(ownerId => new Set(archiveConnectionIds(ownerType, ownerId, entityType)));
      const linkedToAll = recordId => existingSets.every(set => set.has(recordId));
      let query = '';
      const selected = new Set();
      openModal(`<div class="modal notes-related-modal archive-link-picker-modal" role="dialog" aria-modal="true" aria-labelledby="archiveLinkPickerTitle"><div class="modal-header"><div><h2 id="archiveLinkPickerTitle">${escapeHtml(config.addLabel)}</h2><p>Choose existing ${escapeHtml(config.title.toLowerCase())} to link. Linking does not move or duplicate records.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body form-grid"><div class="archive-link-picker-toolbar"><label class="app-search-field archive-link-picker-search" aria-label="Search ${escapeHtml(config.title.toLowerCase())}">${icon.search}<input type="search" data-archive-link-search placeholder="Search ${escapeHtml(config.title.toLowerCase())}..." aria-label="Search ${escapeHtml(config.title.toLowerCase())}" autocomplete="off"></label>${entityType === 'source' ? `<button class="button secondary" type="button" data-archive-create-source-from-picker>${icon.plus} Create source</button>` : ''}</div><div class="archive-modal-list" data-archive-link-results></div></div><div class="modal-footer"><span class="archive-link-picker-status" data-archive-link-count aria-live="polite">0 selected</span><div class="archive-modal-actions"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-archive-link-save disabled>Add links</button></div></div></div>`);
      const modal = modalBackdrop.querySelector('.modal');
      const results = modal.querySelector('[data-archive-link-results]');
      const count = modal.querySelector('[data-archive-link-count]');
      const save = modal.querySelector('[data-archive-link-save]');
      const updateSelectionStatus = () => {
        count.textContent = `${selected.size} selected`;
        save.disabled = selected.size === 0;
      };
      const refresh = () => {
        const visible = records.filter(record => [config.label(record), config.meta(record)].join(' ').toLowerCase().includes(query.toLowerCase()));
        results.innerHTML = visible.length ? visible.map(record => {
          const existing = linkedToAll(record.id);
          return `<label class="archive-modal-choice"><input type="checkbox" data-archive-link-choice value="${escapeHtml(record.id)}" ${existing ? 'checked disabled' : selected.has(record.id) ? 'checked' : ''}><span class="archive-modal-choice-copy"><strong>${escapeHtml(config.label(record))}</strong><span>${escapeHtml(config.meta(record))}</span></span><span>${existing ? 'Already linked' : ''}</span></label>`;
        }).join('') : `<div class="archive-section-empty">No matching ${escapeHtml(config.title.toLowerCase())}.</div>`;
        updateSelectionStatus();
      };
      modal.querySelector('[data-archive-link-search]')?.addEventListener('input', event => { query = event.currentTarget.value; refresh(); });
      modal.addEventListener('change', event => {
        const input = event.target.closest('[data-archive-link-choice]');
        if (!input || input.disabled) return;
        if (input.checked) selected.add(input.value); else selected.delete(input.value);
        updateSelectionStatus();
      });
      modal
        .querySelector(
          '[data-archive-create-source-from-picker]'
        )
        ?.addEventListener(
          'click',
          () => {
            closeModal();

            openArchiveSourceModal(
              '',
              {
                onCreated:
                  createdSource => {
                    const committed =
                      archiveSetConnectionsAtomically(
                        ids.map(ownerId => ({
                          ownerType,
                          ownerId,
                          entityType: 'source',
                          entityId: createdSource.id,
                          shouldLink: true
                        }))
                      );

                    if (
                      !committed.ok
                      || committed.changedCount
                        !== ids.length
                    ) {
                      showToast(
                        'Source created, but it could not be linked.'
                      );

                      return;
                    }

                    state.archiveSelectedFileIds =
                      [];

                    if (
                      ownerType === 'file'
                    ) {
                      state.archiveView =
                        'files';

                      state.archiveSelectedFileId =
                        ids[0]
                        || null;
                    }

                    renderArchive();

                    showToast(
                      'Source created and linked.'
                    );
                  }
              }
            );
          }
        );
      save.addEventListener(
        'click',
        () => {
          if (!selected.size) {
            return;
          }

          /*
            File bulk relationships use the verified
            Archive commit path.
          */
          if (
            ownerType === 'file'
          ) {
            const result =
              archiveCommitFileConnections({
                fileIds:
                  ids,

                entityType,

                recordIds: [
                  ...selected
                ]
              });

            if (!result.ok) {
              showToast(
                `No ${
                  config.title.toLowerCase()
                } were linked.`
              );

              return;
            }

            closeModal();

            finishArchiveBulkLinkAction(
              ids
            );

            showToast(
              `${result.addedLinkCount} ${
                result.addedLinkCount === 1
                  ? 'link was'
                  : 'links were'
              } added to ${
                result.changedFileCount
              } ${
                result.changedFileCount === 1
                  ? 'file'
                  : 'files'
              }.`
            );

            return;
          }

          /*
            Preserve the existing Source-inspector
            relationship workflow.
          */
          const writes =
            ids.flatMap(ownerId =>
              [...selected]
                .filter(recordId =>
                  !archiveConnectionIds(
                    ownerType,
                    ownerId,
                    entityType
                  ).includes(recordId)
                )
                .map(recordId => ({
                  ownerType,
                  ownerId,
                  entityType,
                  entityId: recordId,
                  shouldLink: true
                }))
            );

          const committed =
            archiveSetConnectionsAtomically(
              writes
            );

          const addedCount =
            committed.ok
              ? committed.changedCount
              : 0;

          if (!addedCount) {
            showToast(
              'No links were added.'
            );

            return;
          }

          closeModal();

          if (
            ownerType === 'source'
          ) {
            renderArchivePreservingSourceInspectorScroll();
          } else {
            renderArchive();
          }

          showToast(
            `${addedCount} ${
              addedCount === 1
                ? 'link was'
                : 'links were'
            } added.`
          );
        }
      );
      refresh();
      requestAnimationFrame(() => modal.querySelector('[data-archive-link-search]')?.focus());
    }

    function openArchiveFilesSourceModal(
      fileIds
    ) {
      const files =
        archiveFilesForLinkAction(
          fileIds
        );

      if (!files.length) {
        return;
      }

      /*
        A single selected file uses the same additive
        source picker as People, Albums, and Places.
      */
      if (files.length === 1) {
        const file =
          files[0];

        const fileLabel =
          file.name
          || file.title
          || 'this file';

        openSourcesForTargetModal({
          targetType:
            'file',

          targetId:
            file.id,

          projectId:
            file.projectId,

          title:
            'Add sources',

          subtitle:
            `Connect existing sources to ${
              fileLabel
            }.`,

          afterSave:
            renderArchivePreservingFileInspectorScroll
        });

        return;
      }

      /*
        Keep the multi-owner Archive picker for bulk
        linking because the shared picker currently
        operates on one target record.
      */
      openArchiveConnectionPicker({
        ownerType:
          'file',

        ownerIds:
          files.map(file =>
            file.id
          ),

        entityType:
          'source'
      });
    }

    function openArchiveBulkLinkModal(
      fileIds,
      entityType
    ) {
      const ids =
        archiveFilesForLinkAction(
          fileIds
        ).map(file =>
          file.id
        );

      if (!ids.length) {
        return;
      }

      if (
        entityType === 'person'
      ) {
        openArchiveFilesPeopleModal(
          ids
        );

        return;
      }

      if (
        entityType === 'event'
      ) {
        openArchiveFilesEventsModal(
          ids
        );

        return;
      }

      if (
        entityType === 'note'
      ) {
        openArchiveFilesNoteModal(
          ids
        );

        return;
      }

      if (
        entityType === 'source'
      ) {
        openArchiveFilesSourceModal(
          ids
        );

        return;
      }

      if (
        entityType === 'place'
      ) {
        openArchiveFilesPlaceModal(
          ids
        );

        return;
      }
    }

    function openArchiveAddLinksMenu(
      fileIds
    ) {
      const files =
        archiveFilesForLinkAction(
          fileIds
        );

      if (!files.length) {
        return;
      }

      const ids =
        files.map(file =>
          file.id
        );

      openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveAddLinksTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveAddLinksTitle">

                Add links
              </h2>

              <p>
                Connect the selected ${
                  ids.length === 1
                    ? 'file'
                    : 'files'
                } to genealogy records.
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

          <div class="modal-body">
            <div
              class="
                archive-action-grid
              ">

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="person">

                ${icon.profile}
                People
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="event">

                ${icon.calendar}
                Events
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="note">

                ${icon.note}
                Notes
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="place">

                ${icon.mapPin}
                Places
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="source">

                ${icon.archive}
                Sources
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Cancel
            </button>
          </div>
        </div>
      `);

      modalBackdrop
        .querySelectorAll(
          '[data-archive-link-menu]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const entityType =
                button.dataset
                  .archiveLinkMenu;

              closeModal();

              openArchiveBulkLinkModal(
                ids,
                entityType
              );
            }
          );
        });
    }

    function openArchiveUnlinkConfirm({
      ownerType,
      ownerId,
      entityType,
      entityId
    }) {
      const config =
        archiveEntityConfig(
          entityType
        );

      const record =
        archiveConnectionRecord(
          entityType,
          entityId
        );

      const owner =
        ownerType === 'source'
          ? archiveSourceById(
              ownerId
            )
          : ownerType === 'file'
            ? archiveFileById(
                ownerId
              )
            : null;

      if (
        !config
        || !record
        || !owner
      ) {
        return;
      }

      const recordLabel =
        config.label(record);

      const ownerLabel =
        ownerType === 'source'
          ? (
              owner.title
              || 'Untitled source'
            )
          : (
              owner.name
              || owner.title
              || 'Untitled file'
            );

      const ownerKind =
        ownerType === 'source'
          ? 'source'
          : 'file';

      const relationshipCopy =
        state.language === 'ru'
          ? `Связь между «${recordLabel}» и ${
              ownerType === 'source'
                ? 'источником'
                : 'файлом'
            } «${ownerLabel}» будет удалена. Обе записи останутся в проекте.`
          : `“${recordLabel}” will no longer be linked to the ${ownerKind} “${ownerLabel}”. Neither record will be deleted.`;

      openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveUnlinkTitle">
                ${escapeHtml(
                  t(
                    `Unlink ${config.singular}?`
                  )
                )}
              </h2>

              <p>
                ${escapeHtml(
                  recordLabel
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(
                t('Close')
              )}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="unlink-relationship-warning">
              <strong>
                ${escapeHtml(
                  t(
                    'Only the connection will be removed.'
                  )
                )}
              </strong>

              <span>
                ${escapeHtml(
                  relationshipCopy
                )}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(
                t('Cancel')
              )}
            </button>

            <button
              class="button danger"
              type="button"
              data-archive-unlink-confirm>
              ${escapeHtml(
                t('Unlink')
              )}
            </button>
          </div>
        </div>
      `);

      modalBackdrop
        .querySelector(
          '[data-archive-unlink-confirm]'
        )
        ?.addEventListener(
          'click',
          () => {
            if (
              !archiveSetConnection(
                ownerType,
                ownerId,
                entityType,
                entityId,
                false
              )
            ) {
              showToast(
                'The link could not be removed.'
              );

              return;
            }

            closeModal();

            if (
              ownerType === 'source'
              && state.archiveView
                === 'sources'
            ) {
              renderArchivePreservingSourceInspectorScroll();
            } else {
              renderArchive();
            }

            showToast(
              'Link removed.'
            );
          }
        );
    }

    function deleteArchiveFilesPermanently(fileIds) {
      const ids = new Set(fileIds);
      removeSourceLinksForTargets(
        'file',
        [...ids]
      );
      (sampleData.notes || []).forEach(note => {
        note.linkedArchiveFileIds = (note.linkedArchiveFileIds || []).filter(id => !ids.has(id));
      });
      sampleData.archiveFiles = (sampleData.archiveFiles || []).filter(file => !ids.has(file.id));
      state.archiveSelectedFileIds = [];
      if (ids.has(state.archiveSelectedFileId)) state.archiveSelectedFileId = null;
    }

    function openArchiveDeleteFileConfirm(fileIds) {
      const files = archiveUniqueIds(fileIds).map(archiveFileById).filter(Boolean);
      if (!files.length) return;
      const label = files.length === 1 ? files[0].name : `${files.length} files`;
      openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFileTitle"><div class="modal-header"><div><h2 id="archiveDeleteFileTitle">Delete permanently?</h2><p>${escapeHtml(label)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>The ${files.length === 1 ? 'file' : 'files'} and all links to People, Events, Notes, Places, and Sources will be removed. Connected records will not be deleted.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-file-confirm>Delete permanently</button></div></div>`);
      modalBackdrop.querySelector('[data-archive-delete-file-confirm]')?.addEventListener('click', () => {
        deleteArchiveFilesPermanently(files.map(file => file.id));
        closeModal();
        renderArchive();
        showToast(files.length === 1 ? 'File permanently deleted.' : 'Files permanently deleted.');
      });
    }

    function openArchiveDeleteFolderConfirm(folderId) {
      const folder = archiveFolderById(folderId);
      if (!folder) {
        return;
      }
      const impact = archiveFolderImpact(folder.id);
      openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFolderTitle"><div class="modal-header"><div><h2 id="archiveDeleteFolderTitle">Delete folder permanently?</h2><p>${escapeHtml(folder.name)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>${impact.folders} nested ${impact.folders === 1 ? 'folder' : 'folders'} and ${impact.files} ${impact.files === 1 ? 'file' : 'files'} will be permanently deleted. Connections will be removed; connected genealogy records will remain.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-folder-confirm>Delete permanently</button></div></div>`);
      modalBackdrop
        .querySelector(
          '[data-archive-delete-folder-confirm]'
        )
        ?.addEventListener(
          'click',
          () => {
            const parentId =
              archiveFolderParentId(
                folder
              );

            const ids =
              new Set(
                impact.folderIds
              );

            deleteArchiveFilesPermanently(
              archiveProjectFiles()
                .filter(file =>
                  ids.has(
                    archiveFileFolderId(
                      file
                    )
                  )
                )
                .map(file =>
                  file.id
                )
            );

            sampleData.archiveFolders =
              (
                sampleData.archiveFolders
                || []
              ).filter(item =>
                !ids.has(
                  item.id
                )
              );

            closeModal();

            archiveNavigateToLocation(
              {
                view:
                  'files',

                folderId:
                  parentId,

                search:
                  '',

                searchScope:
                  'folder',

                personFilterId:
                  '',

                selectedFileId:
                  null,

                inspectorCollapsed:
                  false
              },
              {
                recordHistory:
                  false,

                expandCurrent:
                  true
              }
            );

            showToast(
              'Folder permanently deleted.'
            );
          }
        );
    }

    function openArchiveDeleteSourceConfirm(sourceId) {
      const source = archiveSourceById(sourceId);
      if (!source) return;
      openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteSourceTitle"><div class="modal-header"><div><h2 id="archiveDeleteSourceTitle">Delete source permanently?</h2><p>${escapeHtml(source.title)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>The Source record cannot be restored.</strong><span>Its connections will be removed. Linked files, Photos, People, Events, Notes, and Places will not be deleted.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-source-confirm>Delete permanently</button></div></div>`);
      modalBackdrop.querySelector('[data-archive-delete-source-confirm]')?.addEventListener('click', () => {
        removeSourceLinksForSource(
          source.id
        );
        sampleData.sources = (sampleData.sources || []).filter(item => item.id !== source.id);
        state.archiveSelectedSourceId = null;
        closeModal();
        renderArchive();
        showToast('Source permanently deleted.');
      });
    }

    function openArchiveItemActionsPopover(
      type,
      id,
      anchor
    ) {
      if (
        !(anchor instanceof HTMLElement)
      ) {
        return;
      }

      const file =
        type === 'file'
          ? archiveFileById(
              id
            )
          : null;

      const folder =
        type === 'folder'
          ? archiveFolderById(
              id
            )
          : null;
      const folderIsCurrentLocation =
        Boolean(
          folder
          && folder.id
            === archiveNormalizeFolderId(
              state.archiveSelectedFolderId
            )
        );
      const source =
        type === 'source'
          ? archiveSourceById(
              id
            )
          : null;
      const sourceMenuInInspector =
        Boolean(
          source
          && anchor.closest(
            '.archive-inspector-toolbar'
          )
        );
      const item =
        file
        || folder
        || source;

      if (!item) {
        return;
      }

      /*
        Clicking the active More button again
        closes its menu instead of reopening it.
      */
      const alreadyOpen =
        anchor.getAttribute(
          'aria-expanded'
        ) === 'true'
        && Boolean(
          document.getElementById(
            'projectMenu'
          )
        );

      closeMenu();

      if (alreadyOpen) {
        return;
      }

      const label =
        file?.name
        || folder?.name
        || source?.title
        || 'Item';

      const menu =
        document.createElement(
          'div'
        );

      menu.className =
        'menu-popover';

      menu.id =
        'projectMenu';

      menu.setAttribute(
        'role',
        'menu'
      );

      menu.setAttribute(
        'aria-label',
        `More actions for ${label}`
      );

      if (file) {
        menu.innerHTML = `
          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
      }

      if (folder) {
        menu.innerHTML = `
          ${
            folderIsCurrentLocation
              ? ''
              : `
                <button
                  type="button"
                  role="menuitem"
                  data-archive-item-action="open">

                  Open folder
                </button>
              `
          }

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
      }

      if (source) {
        menu.innerHTML =
          sourceMenuInInspector
            ? `
              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `
            : `
              <button
                type="button"
                role="menuitem"
                data-archive-item-action="edit">

                Edit source
              </button>

              <button
                type="button"
                role="menuitem"
                data-archive-item-action="favorite">

                ${
                  source.favorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'
                }
              </button>

              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `;
      }

      document.body.appendChild(
        menu
      );

      /*
        Position after mounting so the actual
        menu dimensions are available.
      */
      const rect =
        anchor.getBoundingClientRect();

      const viewportMargin =
        12;

      const gap =
        6;

      const left =
        Math.min(
          Math.max(
            viewportMargin,
            rect.right
              - menu.offsetWidth
          ),
          Math.max(
            viewportMargin,
            window.innerWidth
              - menu.offsetWidth
              - viewportMargin
          )
        );

      const belowTop =
        rect.bottom
        + gap;

      const top =
        belowTop
          + menu.offsetHeight
          <= window.innerHeight
            - viewportMargin
          ? belowTop
          : Math.max(
              viewportMargin,
              rect.top
                - menu.offsetHeight
                - gap
            );

      menu.style.left =
        `${left}px`;

      menu.style.top =
        `${top}px`;

      anchor.setAttribute(
        'aria-expanded',
        'true'
      );

      menu.addEventListener(
        'click',
        event => {
          const actionButton =
            event.target.closest(
              '[data-archive-item-action]'
            );

          if (!actionButton) {
            return;
          }

          const action =
            actionButton.dataset
              .archiveItemAction;

          closeMenu();

          if (file) {
            if (
              action === 'rename'
            ) {
              openArchiveRenameItemModal(
                'file',
                file.id
              );

              return;
            }

            if (
              action === 'move'
            ) {
              openArchiveMoveModal({
                fileIds:
                  [
                    file.id
                  ]
              });

              return;
            }

            if (
              action === 'delete'
            ) {
              openArchiveDeleteFileConfirm(
                [
                  file.id
                ]
              );
            }

            return;
          }

          if (folder) {
            if (
              action === 'open'
            ) {
              archiveOpenFolder(
                folder.id
              );

              return;
            }

            if (
              action === 'rename'
            ) {
              openArchiveRenameItemModal(
                'folder',
                folder.id
              );

              return;
            }

            if (
              action === 'move'
            ) {
              openArchiveMoveModal({
                folderId:
                  folder.id
              });

              return;
            }

            if (
              action === 'delete'
            ) {
              openArchiveDeleteFolderConfirm(
                folder.id
              );
            }

            return;
          }

          if (source) {
            if (
              action === 'edit'
            ) {
              openArchiveSourceModal(
                source.id
              );

              return;
            }

            if (
              action === 'favorite'
            ) {
              source.favorite =
                !source.favorite;

              renderArchive();

              return;
            }

            if (
              action === 'delete'
            ) {
              openArchiveDeleteSourceConfirm(
                source.id
              );
            }
          }
        }
      );

      bindMenuLifecycle(
        anchor
      );

      requestAnimationFrame(
        () => {
          menu
            .querySelector(
              '[role="menuitem"]'
            )
            ?.focus();
        }
      );
    }

    function openArchiveConnectedRecordCommit(
      type,
      id
    ) {
      if (
        type === 'photo'
      ) {
        openAlbumsForPhoto(
          id
        );

        return;
      }
      if (
        type === 'person'
      ) {
        openPlaceInspectorPerson(
          id
        );

        return;
      }

      if (
        type === 'note'
      ) {
        openCentralNoteFromContext(
          id,

          state.archiveView
            === 'sources'
              ? {
                  type:
                    'source',

                  id:
                    state.archiveSelectedSourceId
                    || ''
                }
              : {
                  type:
                    'archiveFile',

                  id:
                    state.archiveSelectedFileId
                    || ''
                }
        );

        return;
      }

      if (
        type === 'place'
      ) {
        state.activeModule =
          'Places';

        state.placesView =
          'all';

        state.selectedPlaceId =
          id;

        render();

        return;
      }

      if (
        type === 'source'
      ) {
        archiveRememberCurrentLocation();

        state.archiveView =
          'sources';

        state.archiveSelectedSourceId =
          id;

        state.archiveInspectorCollapsed =
          false;

        renderArchive();

        return;
      }

      if (
        type === 'file'
      ) {
        const file =
          archiveFileById(
            id
          );

        archiveNavigateToLocationCommit(
          {
            view:
              'files',

            folderId:
              archiveFileFolderId(
                file
              ),

            search:
              '',

            searchScope:
              'folder',

            personFilterId:
              '',

            selectedFileId:
              file?.id
              || null,

            inspectorCollapsed:
              false
          },
          {
            expandCurrent:
              true
          }
        );

        return;
      }

      if (
        type === 'event'
      ) {
        const event =
          archiveConnectionRecord(
            'event',
            id
          );

        const personId =
          event?.personIds?.[0];

        if (personId) {
          openPlaceInspectorPerson(
            personId
          );
        } else {
          showToast(
            'Opening this event is simulated.'
          );
        }
      }
    }

    function openArchiveConnectedRecord(
      type,
      id
    ) {
      runAfterArchiveFileEditGuard(
        () => {
          openArchiveConnectedRecordCommit(
            type,
            id
          );
        }
      );
    }

    function openSourceConnectedItems(sourceId, entityType) {
      const source = archiveSourceById(sourceId);
      if (!source) return;

      if (entityType === 'note') {
        openNotesForContext('source', source.id);
        return;
      }

      const records = archiveSourceConnectionRecords(
        source,
        entityType
      );

      if (entityType === 'photo') {
        state.activeModule = 'Albums';
        state.albumsView = 'all';
        state.activeAlbumId = null;

        state.albumsFilters = {
          ...defaultAlbumFilters,
          sourceId: source.id
        };

        state.albumsSearch = '';
        state.selectedPhotoIds = [];
        state.selectedPhotoId = records[0]?.id || null;
        state.albumsDetailCollapsed = false;

        resetAlbumsPage();
        render();
        return;
      }

      if (entityType === 'file') {
        openArchiveLocation({
          view: 'files',
          folderId: null,
          search: '',
          fileFilters: {
            ...defaultArchiveFileFilters,
            sourceId: source.id
          },
          filterPresentation: 'flat',
          filterScopeFolderId: null,
          selectedFileId: records[0]?.id || null,
          inspectorCollapsed: true
        });
      }
    }

    function bindArchiveControls() {
      const root = main.querySelector('.archive-shell');
      if (!root) return;
      root
        .querySelectorAll('[data-source-connected-view-all]')
        .forEach(button => {
          button.onclick = event => {
            event.preventDefault();
            event.stopPropagation();

            openSourceConnectedItems(
              button.dataset.sourceConnectedOwner,
              button.dataset.sourceConnectedViewAll
            );
          };
        });
      bindConnectedNotesFooters(root);
      bindConnectedFileLinks(
        root,
        {
          onUnlinked:
            ({
              contextType
            }) => {
              if (
                contextType
                !== 'source'
              ) {
                return;
              }

              renderArchivePreservingSourceInspectorScroll();
            }
        }
      );

      bindConnectedSourceLinks(
        root,
        {
          onUnlinked:
            ({
              targetType,
              targetId
            }) => {
              if (
                targetType !== 'file'
                || targetId
                  !== state.archiveSelectedFileId
              ) {
                renderArchive();
                return;
              }

              renderArchivePreservingFileInspectorScroll();
            }
        }
      );

      bindGenealogyDateFields(
        root
      );

      bindPlaceComboboxes(
        root
      );
    root
      .querySelector(
        '[data-archive-inspector-open-folder]'
      )
      ?.addEventListener(
        'click',
        event => {
          archiveOpenFolder(
            event.currentTarget
              .dataset
              .archiveInspectorOpenFolder
          );
        }
      );

    root
      .querySelector(
        '[data-archive-inspector-rename-folder]'
      )
      ?.addEventListener(
        'click',
        event => {
          const folderId =
            event.currentTarget
              .dataset
              .archiveInspectorRenameFolder;

          if (!folderId) {
            return;
          }

          openArchiveRenameItemModal(
            'folder',
            folderId
          );
        }
      );
    root
      .querySelector(
        '[data-archive-inspector-move]'
      )
      ?.addEventListener(
        'click',
        event => {
          const button =
            event.currentTarget;

          const type =
            button.dataset
              .archiveInspectorMove;

          const id =
            button.dataset
              .archiveInspectorMoveId;

          if (
            !type
            || !id
          ) {
            return;
          }

          if (
            type === 'file'
          ) {
            openArchiveMoveModal({
              fileIds: [
                id
              ]
            });

            return;
          }

          if (
            type === 'folder'
          ) {
            openArchiveMoveModal({
              folderId:
                id
            });
          }
        }
      );

      root
        .querySelector(
          '#archiveCancelFileEdit'
        )
        ?.addEventListener(
          'click',
          cancelArchiveFileEdit
        );

      root
        .querySelector(
          '#archiveSaveFileEdit'
        )
        ?.addEventListener(
          'click',
          saveArchiveFileEdit
        );
      root
        .querySelectorAll(
          '[data-archive-section-toggle]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            event => {
              if (
                event.target.closest(
                  '.link'
                )
              ) {
                return;
              }

              const sectionId =
                button.dataset
                  .archiveSectionToggle;

              const open =
                !archiveInspectorSectionIsOpen(
                  sectionId
                );

              state.archiveInspectorSections[
                sectionId
              ] = open;

              const section =
                button.closest(
                  '.panel-section'
                );

              const body =
                section?.querySelector(
                  '.panel-section-body'
                );

              section
                ?.classList
                .toggle(
                  'is-open',
                  open
                );

              button.setAttribute(
                'aria-expanded',
                String(
                  open
                )
              );

              if (body) {
                body.hidden =
                  !open;
              }
            }
          );
        });
      root
        .querySelector(
          '[data-archive-add-file-person]'
        )
        ?.addEventListener(
          'click',
          () => {
            openArchiveFilePeopleModal(
              state.archiveSelectedFileId
            );
          }
        );
      root
        .querySelector(
          '[data-archive-add-file-event]'
        )
        ?.addEventListener(
          'click',
          () => {
            openArchiveFileEventsModal(
              state.archiveSelectedFileId
            );
          }
        );

      root
        .querySelector(
          '[data-archive-add-file-note]'
        )
        ?.addEventListener(
          'click',
          () => {
            openArchiveFileNoteModal(
              state.archiveSelectedFileId
            );
          }
        );

      root
        .querySelector(
          '[data-archive-add-file-source]'
        )
        ?.addEventListener(
          'click',
          () => {
            const fileId =
              state.archiveSelectedFileId;

            if (!fileId) {
              return;
            }

            openArchiveFilesSourceModal([
              fileId
            ]);
          }
        );
      root.querySelector('[data-archive-search]')?.addEventListener('input', event => {
        const value = event.currentTarget.value;
        const selectionStart = event.currentTarget.selectionStart;
        state.archiveSearch = value;
        renderArchiveMain();
        requestAnimationFrame(() => {
          const input = main.querySelector('[data-archive-search]');
          if (!input) return;
          input.focus({ preventScroll: true });
          const position = Math.min(selectionStart ?? value.length, input.value.length);
          input.setSelectionRange(position, position);
        });
      });
      const sortingSources =
        archiveToolbarIsSources();

      bindAppSortControl(root, {
        id: 'archiveSort',

        options:
          sortingSources
            ? APP_SORT_OPTIONS
                .archiveSources
            : APP_SORT_OPTIONS
                .archiveFiles,

        getField: () =>
          sortingSources
            ? state.archiveSourceSort
            : state.archiveFileSort,

        getDirection: () =>
          sortingSources
            ? state
                .archiveSourceSortDirection
            : state
                .archiveFileSortDirection,

        onChange: ({
          field,
          direction
        }) => {
          if (sortingSources) {
            state.archiveSourceSort =
              field;

            state
              .archiveSourceSortDirection =
              direction;
          } else {
            state.archiveFileSort =
              field;

            state
              .archiveFileSortDirection =
              direction;
          }

          renderArchiveMain();
        }
      });
      root.querySelector('#archiveFilterButton') ?.addEventListener('click', event => {openArchiveFilterPopover(event.currentTarget);});
      root
        .querySelectorAll(
          '[data-archive-filter-presentation]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const presentation =
                button.dataset
                  .archiveFilterPresentation;

              if (
                presentation !== 'flat'
                && presentation !== 'folders'
              ) {
                return;
              }

              state.archiveFilterPresentation =
                presentation;

              if (
                presentation === 'folders'
              ) {
                const filters =
                  archiveEffectiveFileFilters();

                state.archiveSelectedFolderId =
                  filters.scope === 'folder'
                    ? archiveNormalizeFolderId(
                        state
                          .archiveFilterScopeFolderId
                      )
                    : null;
              }

              state.archiveSelectedFolderItemId =
                null;

              state.archiveSelectedFileId =
                null;

              state.archiveSelectedFileIds =
                [];

              renderArchive();
            }
          );
        });
      root.querySelectorAll('[data-archive-remove-filter]').forEach(button => {button.addEventListener('click', () => {removeArchiveToolbarFilter(button.dataset.archiveRemoveFilter);});});
      root
        .querySelector(
          '#archiveClearFilters'
        )
        ?.addEventListener(
          'click',
          clearArchiveToolbarFilters
        );
      root
        .querySelector(
          '[data-archive-nav-back]'
        )
        ?.addEventListener(
          'click',
          archiveNavigateBack
        );

      root
        .querySelector(
          '[data-archive-nav-forward]'
        )
        ?.addEventListener(
          'click',
          archiveNavigateForward
        );

      root
        .querySelector(
          '[data-archive-nav-up]'
        )
        ?.addEventListener(
          'click',
          archiveNavigateUp
        );
      root
        .querySelectorAll(
          '[data-archive-add-files]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            openArchiveAddFilesModal
          );
        });
      const emptyFileDropzone =
        root.querySelector(
          '[data-archive-empty-add-files]'
        );

      emptyFileDropzone
        ?.addEventListener(
          'click',
          openArchiveAddFilesModal
        );
      if (
        emptyFileDropzone
      ) {
        emptyFileDropzone
          .addEventListener(
            'dragenter',
            event => {
              event.preventDefault();

              emptyFileDropzone
                .classList
                .add(
                  'is-drag-over'
                );
            }
          );

        emptyFileDropzone
          .addEventListener(
            'dragover',
            event => {
              event.preventDefault();

              emptyFileDropzone
                .classList
                .add(
                  'is-drag-over'
                );
            }
          );

        emptyFileDropzone
          .addEventListener(
            'dragleave',
            event => {
              if (
                emptyFileDropzone
                  .contains(
                    event.relatedTarget
                  )
              ) {
                return;
              }

              emptyFileDropzone
                .classList
                .remove(
                  'is-drag-over'
                );
            }
          );

        emptyFileDropzone
          .addEventListener(
            'drop',
            event => {
              event.preventDefault();

              emptyFileDropzone
                .classList
                .remove(
                  'is-drag-over'
                );

              openArchiveAddFilesModal();
            }
          );
      }
      root
        .querySelectorAll(
          '[data-archive-create-folder]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              openArchiveCreateFolderFromTrigger(
                button
              );
            }
          );
        });
      root.querySelectorAll('[data-archive-add-source]').forEach(button => button.addEventListener('click', () => openArchiveSourceModal()));
      root
        .querySelector(
          '[data-archive-breadcrumb-root]'
        )
        ?.addEventListener(
          'click',
          () => {
            archiveNavigateToLocation({
              folderId:
                null,

              search:
                '',

              searchScope:
                'folder',

              personFilterId:
                '',

              selectedFileId:
                null,

              inspectorCollapsed:
                false
            });
          }
        );

      root
        .querySelectorAll(
          '[data-archive-breadcrumb]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              archiveNavigateToLocation({
                folderId:
                  button.dataset
                    .archiveBreadcrumb,

                search:
                  '',

                searchScope:
                  'folder',

                personFilterId:
                  '',

                selectedFileId:
                  null,

                inspectorCollapsed:
                  false
              });
            }
          );
        });
      root
        .querySelectorAll(
          '[data-archive-file-row]'
        )
        .forEach(row => {
          const open =
            () => {
              runAfterArchiveFileEditGuard(
                () => {
                  state.archiveSelectedFolderItemId =
                    null;
                  state.archiveSelectedFileId =
                    row.dataset
                      .archiveFileRow;
                  state.archiveInspectorCollapsed =
                    false;

                  renderArchiveMain();
                }
              );
            };

          row.addEventListener(
            'click',
            event => {
              if (
                !event.target.closest(
                  'button,input,select,a'
                )
              ) {
                open();
              }
            }
          );

          row.addEventListener(
            'keydown',
            event => {
              if (
                event.key === 'Enter'
              ) {
                event.preventDefault();
                open();
              }
            }
          );
        });
      root
        .querySelectorAll(
          '[data-archive-folder-row]'
        )
        .forEach(row => {
          const folderId =
            row.dataset
              .archiveFolderRow;

          row.addEventListener(
            'click',
            event => {
              if (
                event.target.closest(
                  'button,input,select,a'
                )
              ) {
                return;
              }

              /*
                First click:
                select and inspect.

                Second quick click on the same folder:
                open the folder.
              */
              if (
                archiveFolderRowWasDoubleClick(
                  folderId
                )
              ) {
                resetArchiveFolderRowClick();

                archiveOpenFolder(
                  folderId
                );

                return;
              }

              selectArchiveFolderItem(
                folderId
              );
            }
          );

          row.addEventListener(
            'keydown',
            event => {
              if (
                event.key === 'Enter'
              ) {
                event.preventDefault();

                resetArchiveFolderRowClick();

                archiveOpenFolder(
                  folderId
                );

                return;
              }

              if (
                event.key === ' '
                || event.key
                  === 'Spacebar'
              ) {
                event.preventDefault();

                resetArchiveFolderRowClick();

                selectArchiveFolderItem(
                  folderId
                );
              }
            }
          );
        });
      root.querySelectorAll('[data-archive-source-row]').forEach(row => {
        const open = () => { state.archiveSelectedSourceId = row.dataset.archiveSourceRow; state.archiveInspectorCollapsed = false; renderArchiveMain(); };
        row.addEventListener('click', event => { if (!event.target.closest('button,input,select,a')) open(); });
        row.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); open(); } });
      });
      root
        .querySelectorAll(
          '[data-archive-file-checkbox]'
        )
        .forEach(input => {
          /*
            Prevent checkbox interaction from also
            activating the table row.
          */
          input.addEventListener(
            'click',
            event => {
              event.stopPropagation();
            }
          );

          input.addEventListener(
            'change',
            () => {
              toggleArchiveFileSelection(
                input.dataset
                  .archiveFileCheckbox
              );
            }
          );
        });
      const visibleSelection =
        archiveVisibleSelectionState();

      const selectVisibleCheckbox =
        root.querySelector(
          '[data-archive-select-all]'
        );

      if (
        selectVisibleCheckbox
      ) {
        selectVisibleCheckbox.checked =
          visibleSelection
            .allVisibleSelected;

        selectVisibleCheckbox.indeterminate =
          visibleSelection
            .someVisibleSelected
          && !visibleSelection
            .allVisibleSelected;

        selectVisibleCheckbox.disabled =
          visibleSelection
            .visibleIds
            .length === 0;

        selectVisibleCheckbox
          .addEventListener(
            'click',
            event => {
              event.stopPropagation();

              toggleAllVisibleArchiveFiles();
            }
          );
      }
      root.querySelectorAll('[data-archive-toggle-favorite]').forEach(button => button.addEventListener('click', event => {
        event.stopPropagation();
        const file = archiveFileById(button.dataset.archiveToggleFavorite);
        if (file) { file.favorite = !file.favorite; renderArchive(); }
      }));
      root.querySelectorAll('[data-archive-source-favorite]').forEach(button => button.addEventListener('click', event => {
        event.stopPropagation();
        const source = archiveSourceById(button.dataset.archiveSourceFavorite);
        if (source) { source.favorite = !source.favorite; renderArchive(); }
      }));
      root
        .querySelectorAll(
          '[data-archive-row-actions]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            event => {
              event.stopPropagation();

              openArchiveItemActionsPopover(
                button.dataset
                  .archiveRowActions,

                button.dataset
                  .archiveRowId,

                button
              );
            }
          );
        });
      root.querySelectorAll('[data-archive-selection-action]').forEach(button => button.addEventListener('click', () => {
        const ids = state.archiveSelectedFileIds.slice();
        if (button.dataset.archiveSelectionAction === 'clear') { state.archiveSelectedFileIds = []; renderArchiveMain(); }
        if (button.dataset.archiveSelectionAction === 'move') openArchiveMoveModal({ fileIds: ids });
        if (button.dataset.archiveSelectionAction === 'links') openArchiveAddLinksMenu(ids);
        if (button.dataset.archiveSelectionAction === 'favorite') {
          const allFavorite = ids.every(id => archiveFileById(id)?.favorite);
          ids.forEach(id => { const file = archiveFileById(id); if (file) file.favorite = !allFavorite; });
          state.archiveSelectedFileIds = [];
          renderArchive();
        }
        if (button.dataset.archiveSelectionAction === 'delete') openArchiveDeleteFileConfirm(ids);
      }));
      root
        .querySelectorAll(
          '[data-archive-inspector-collapse]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const collapsed =
                button.dataset
                  .archiveInspectorCollapse
                === 'true';

              runAfterArchiveFileEditGuard(
                () => {
                  state.archiveInspectorCollapsed =
                    collapsed;

                  renderArchiveMain();
                }
              );
            }
          );
        });
      root.querySelectorAll('[data-archive-open-file]').forEach(button => button.addEventListener('click', () => showToast('Opening the original file is simulated.')));
      root.querySelectorAll('[data-archive-delete-source]').forEach(button => button.addEventListener('click', () => openArchiveDeleteSourceConfirm(button.dataset.archiveDeleteSource)));
      root.querySelectorAll('[data-archive-edit-source]').forEach(button => button.addEventListener('click', () => openArchiveSourceModal(button.dataset.archiveEditSource)));
      root
        .querySelectorAll(
          '[data-archive-add-connection]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const ownerType =
                button.dataset
                  .archiveOwnerType;

              const ownerId =
                button.dataset
                  .archiveOwnerId;

              const entityType =
                button.dataset
                  .archiveAddConnection;

              /*
                Sources use the specialized shared
                relationship modals for People and Files.
              */
              if (
                ownerType === 'source'
              ) {
                if (
                  entityType === 'photo'
                ) {
                  openArchiveSourcePhotosModal(
                    ownerId
                  );

                  return;
                }
                if (
                  entityType === 'person'
                ) {
                  openArchiveSourcePeopleModal(
                    ownerId
                  );

                  return;
                }

                if (
                  entityType === 'event'
                ) {
                  openArchiveSourceEventsModal(
                    ownerId
                  );

                  return;
                }

                if (
                  entityType === 'note'
                ) {
                  openArchiveSourceNotesModal(
                    ownerId
                  );

                  return;
                }

                if (
                  entityType === 'place'
                ) {
                  openArchiveSourcePlacesModal(
                    ownerId
                  );

                  return;
                }

                if (
                  entityType === 'file'
                ) {
                  openArchiveSourceFilesModal(
                    ownerId
                  );

                  return;
                }
              }

              openArchiveConnectionPicker({
                ownerType,

                ownerIds: [
                  ownerId
                ],

                entityType
              });
            }
          );
        });
      root.querySelectorAll('[data-archive-unlink-id]').forEach(button => button.addEventListener('click', () => openArchiveUnlinkConfirm({ ownerType: button.dataset.archiveUnlinkOwnerType, ownerId: button.dataset.archiveUnlinkOwnerId, entityType: button.dataset.archiveUnlinkType, entityId: button.dataset.archiveUnlinkId })));
      root.querySelectorAll('[data-archive-open-connection]').forEach(button => button.addEventListener('click', () => openArchiveConnectedRecord(button.dataset.archiveOpenConnection, button.dataset.archiveConnectionId)));
      root.addEventListener(
        'keydown',
        event => {
          if (
            !archiveIsLocationView(
              state.archiveView
            )
          ) {
            return;
          }

          if (
            !event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey
          ) {
            return;
          }

          if (
            event.target.closest(
              `
                input,
                textarea,
                select,
                [contenteditable="true"]
              `
            )
          ) {
            return;
          }

          if (
            event.key === 'ArrowLeft'
            && archiveNavigationCanGoBack()
          ) {
            event.preventDefault();
            archiveNavigateBack();

            return;
          }

          if (
            event.key === 'ArrowRight'
            && archiveNavigationCanGoForward()
          ) {
            event.preventDefault();
            archiveNavigateForward();

            return;
          }

          if (
            event.key === 'ArrowUp'
            && archiveNavigationCanGoUp()
          ) {
            event.preventDefault();
            archiveNavigateUp();
          }
        }
      );
      lockArchiveWorkspaceDuringFileEdit(
        root
      );
      bindToasts(root);
    }

    function lockArchiveWorkspaceDuringFileEdit(
      root
    ) {
      if (
        !archiveFileEditIsActive()
      ) {
        return;
      }

      root
        .querySelectorAll(`
          .archive-main
          button,

          .archive-main
          input,

          .archive-main
          select
        `)
        .forEach(control => {
          control.disabled =
            true;

          control.setAttribute(
            'aria-disabled',
            'true'
          );
        });
    }

    function openArchiveCreateSourceModal(prefill = '') {
      openArchiveSourceModal();
      if (prefill) {
        requestAnimationFrame(() => {
          const input = modalBackdrop.querySelector('[data-archive-source-title]');
          if (input && !input.value) input.value = `${prefill} source`;
        });
      }
    }

    function openArchiveAssignSourceModal() {
      const ids = state.archiveSelectedFileIds.length ? state.archiveSelectedFileIds : [state.archiveSelectedFileId].filter(Boolean);
      openArchiveConnectionPicker({ ownerType: 'file', ownerIds: ids, entityType: 'source' });
    }

    function openArchiveLinkPersonModal() {
      const ids = state.archiveSelectedFileIds.length ? state.archiveSelectedFileIds : [state.archiveSelectedFileId].filter(Boolean);
      openArchiveConnectionPicker({ ownerType: 'file', ownerIds: ids, entityType: 'person' });
    }

    const EXPECTED_CANONICAL_NOTE_COUNT = 12;
    const EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT = 4;
    sampleData.noteCollections = [
      {
        id:
          'note-col-pawford',

        projectId:
          'p1',

        name:
          'Pawford research',

        description:
          'Records, places, and open questions connected to Pawford.'
      },

      {
        id:
          'note-col-whiskerfield',

        projectId:
          'p1',

        name:
          'Whiskerfield family',

        description:
          'Family history, surname research, and household context.'
      },

      {
        id:
          'note-col-sources',

        projectId:
          'p1',

        name:
          'Source analysis',

        description:
          'Transcriptions, extracts, and interpretation of research sources.'
      },

      {
        id:
          'note-col-interviews',

        projectId:
          'p1',

        name:
          'Family interviews',

        description:
          'Interview preparation, recollections, and follow-up questions.'
      }
    ];

    sampleData.notes = (() => {
      const body = (...lines) =>
        lines.join('\n');

      const note = record => ({
        id: '',
        projectId: 'p1',
        title: '',
        body: '',
        bodyDelta: null,
        bodyFormat: '',
        collectionIds: [],
        favorite: false,
        archived: false,
        checklist: [],
        linkedPersonIds: [],
        linkedPlaceIds: [],
        linkedEventIds: [],
        linkedPhotoIds: [],
        linkedArchiveFileIds: [],
        relatedNoteIds: [],
        createdAt:
          '2026-01-01T00:00:00Z',
        updatedAt:
          '2026-01-01T00:00:00Z',
        ...record
      });

      return [
        note({
          id:
            'note-daisy-parentage',

          title:
            'Who was Daisy Milkpaw’s father?',

          body: body(
            'Research question',
            'Who was Daisy Milkpaw’s father?',
            '',
            'Current observations',
            'Daisy’s records place her in the Pawford area, where the Whiskerfield household appears in the available register material.',
            'Barnaby Whiskerfield is a plausible lead, but no direct parentage statement has been found.',
            '',
            'Next steps',
            'Review the father entry in the Pawford register.',
            'Compare household members and witnesses.',
            'Record evidence both for and against the Whiskerfield connection.'
          ),

          collectionIds: [
            'note-col-pawford',
            'note-col-whiskerfield'
          ],

          favorite: true,

          checklist: [
            {
              id:
                'note-daisy-parentage-check-register',

              text:
                'Check the Pawford register father entry',

              done:
                false
            },

            {
              id:
                'note-daisy-parentage-check-households',

              text:
                'Compare Daisy and Whiskerfield household records',

              done:
                false
            },

            {
              id:
                'note-daisy-parentage-review-evidence',

              text:
                'Review additional evidence before changing relationships',

              done:
                false
            }
          ],

          linkedPersonIds: [
            'daisy',
            'barnaby'
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          linkedPhotoIds: [
            'photo-daisy-school',
            'photo-grandparents-garden'
          ],

          linkedArchiveFileIds: [
            'af1',
            'af2'
          ],

          relatedNoteIds: [
            'note-pawford-household',
            'note-whiskerfield-surname'
          ],

          createdAt:
            '2026-06-27T09:00:00Z',

          updatedAt:
            '2026-07-22T16:30:00Z'
        }),

        note({
          id:
            'note-old-cattery-burial',

          title:
            'Old Cattery burial index observations',

          body: body(
            'The burial index contains several entries connected to the Old Cattery area.',
            '',
            'Pearl Velvetpaw’s entry is clear, but nearby entries should be checked for relatives and alternate surname spellings.',
            'Daisy’s connection remains indirect and should not be treated as evidence of residence without another record.',
            '',
            'The index should be compared with cemetery and household records before adding new facts.'
          ),

          collectionIds: [
            'note-col-sources'
          ],

          archived:
            true,

          linkedPersonIds: [
            'daisy',
            'pearl'
          ],

          linkedPlaceIds: [
            'place-old-cattery'
          ],

          createdAt:
            '2026-05-14T10:00:00Z',

          updatedAt:
            '2026-06-28T11:15:00Z'
        }),

        note({
          id:
            'note-meowbridge-transcription',

          title:
            'Meowbridge record transcription',

          body: body(
            'Source details',
            'Meowbridge record held with the family certificate material.',
            '',
            'Extract or transcription',
            'The record names Meowbridge and confirms the event location. Several handwritten details remain uncertain.',
            '',
            'Interpretation',
            'The place is consistent with other records connected to Daisy and the later Whiskerfield family.',
            '',
            'Questions',
            'Confirm the witnesses and compare their names with household records.'
          ),

          collectionIds: [
            'note-col-sources'
          ],

          linkedPersonIds: [
            'daisy'
          ],

          linkedPlaceIds: [
            'place-meowbridge'
          ],

          linkedArchiveFileIds: [
            'af5'
          ],

          createdAt:
            '2026-06-24T09:30:00Z',

          updatedAt:
            '2026-07-13T14:10:00Z'
        }),

        note({
          id:
            'note-pawford-household',

          title:
            'Pawford household register notes',

          body: body(
            'The Pawford household material contains several Whiskerfield entries that may help reconstruct the family group.',
            '',
            'Barnaby appears in the correct district and age range to merit further research.',
            'The current scan does not establish Daisy’s relationship to the household.',
            '',
            'Names, occupations, addresses, and witnesses should be transcribed before drawing conclusions.'
          ),

          collectionIds: [
            'note-col-pawford',
            'note-col-sources',
            'note-col-whiskerfield'
          ],

          favorite:
            true,

          checklist: [
            {
              id:
                'note-pawford-household-transcribe',

              text:
                'Transcribe every household member',

              done:
                true
            },

            {
              id:
                'note-pawford-household-address',

              text:
                'Compare the recorded address with nearby events',

              done:
                false
            },

            {
              id:
                'note-pawford-household-continuation',

              text:
                'Check the register continuation',

              done:
                false
            }
          ],

          linkedPersonIds: [
            'barnaby',
            'daisy'
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          linkedArchiveFileIds: [
            'af1',
            'af2'
          ],

          relatedNoteIds: [
            'note-daisy-parentage'
          ],

          createdAt:
            '2026-06-22T08:00:00Z',

          updatedAt:
            '2026-07-21T18:20:00Z'
        }),

        note({
          id:
            'note-whiskerfield-album',

          title:
            'Whiskerfield family album context',

          body: body(
            'The family album appears to combine photographs from several Whiskerfield households.',
            '',
            'Silver and Luna can identify some recent photographs. Barnaby and Daisy may appear in older images, but the captions are incomplete.',
            '',
            'Album order, handwriting, paper type, and repeated backgrounds may help group unidentified portraits.'
          ),

          collectionIds: [
            'note-col-whiskerfield'
          ],

          favorite:
            true,

          linkedPersonIds: [
            'silver',
            'luna',
            'barnaby',
            'daisy'
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          linkedPhotoIds: [
            'photo-family-table',
            'photo-grandparents-garden'
          ],

          linkedArchiveFileIds: [
            'af7'
          ],

          relatedNoteIds: [
            'note-luna-interview'
          ],

          createdAt:
            '2026-06-18T10:00:00Z',

          updatedAt:
            '2026-07-18T12:45:00Z'
        }),

        note({
          id:
            'note-whiskerfield-surname',

          title:
            'Whiskerfield surname variants',

          body: body(
            'Searches should include likely handwriting and transcription variants of Whiskerfield.',
            '',
            'Potential differences include omitted letters, altered vowel groups, and spacing introduced by indexers.',
            'Every variant should be recorded with its source rather than added as a confirmed family name automatically.'
          ),

          collectionIds: [
            'note-col-whiskerfield',
            'note-col-pawford'
          ],

          linkedPersonIds: [
            'silver',
            'barnaby',
            'archibald'
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          linkedArchiveFileIds: [
            'af9'
          ],

          relatedNoteIds: [
            'note-daisy-parentage'
          ],

          createdAt:
            '2026-06-15T09:10:00Z',

          updatedAt:
            '2026-07-17T15:00:00Z'
        }),

        note({
          id:
            'note-rupert-death',

          title:
            'Rupert death details to verify',

          body: body(
            'Rupert Purrington’s death details are incomplete in the current family record.',
            '',
            'The available online extract may contain a matching entry, but identity has not been confirmed.',
            'Check age, residence, relatives, and registration district before entering a death date.'
          ),

          collectionIds: [
            'note-col-sources'
          ],

          checklist: [
            {
              id:
                'note-rupert-death-check-index',

              text:
                'Check the regional death index',

              done:
                false
            },

            {
              id:
                'note-rupert-death-compare-residence',

              text:
                'Compare residence and family details',

              done:
                false
            }
          ],

          linkedPersonIds: [
            'rupert'
          ],

          linkedPlaceIds: [
            'place-fishmarket-row'
          ],

          linkedArchiveFileIds: [
            'af9'
          ],

          createdAt:
            '2026-06-10T13:30:00Z',

          updatedAt:
            '2026-07-16T17:05:00Z'
        }),

        note({
          id:
            'note-purrington-surname',

          title:
            'Purrington surname variants',

          body: body(
            'Purrington entries may be indexed with shortened or misread letter groups.',
            '',
            'Search plans should include common handwriting substitutions while keeping the recorded spelling attached to each source.',
            'No variant should replace the central surname without supporting evidence.'
          ),

          collectionIds: [],

          archived:
            true,

          linkedPersonIds: [
            'rupert',
            'luna'
          ],

          createdAt:
            '2026-05-01T11:00:00Z',

          updatedAt:
            '2026-06-30T09:20:00Z'
        }),

        note({
          id:
            'note-silver-luna-marriage',

          title:
            'Silver and Luna marriage record notes',

          body: body(
            'The marriage record links Silver Whiskerfield and Luna Purrington in Meowbridge.',
            '',
            'The names and place are legible. Witness names and the exact certificate reference should be transcribed separately.',
            '',
            'The event should remain linked to the original certificate source and scan.'
          ),

          collectionIds: [
            'note-col-whiskerfield',
            'note-col-sources'
          ],

          linkedPersonIds: [
            'silver',
            'luna'
          ],

          linkedPlaceIds: [
            'place-meowbridge'
          ],

          linkedEventIds: [
            'event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'
          ],

          linkedPhotoIds: [
            'photo-silver-luna-wedding'
          ],

          linkedArchiveFileIds: [
            'af5'
          ],

          relatedNoteIds: [
            'note-silver-profile-checklist'
          ],

          createdAt:
            '2026-05-19T10:15:00Z',

          updatedAt:
            '2026-07-20T13:35:00Z'
        }),

        note({
          id:
            'note-silver-profile-checklist',

          title:
            'Silver profile research checklist',

          body: '',

          collectionIds: [
            'note-col-whiskerfield'
          ],

          checklist: [
            {
              id:
                'note-silver-profile-residence',

              text:
                'Add residence sources',

              done:
                false
            },

            {
              id:
                'note-silver-profile-photos',

              text:
                'Review context for linked photographs',

              done:
                true
            },

            {
              id:
                'note-silver-profile-events',

              text:
                'Verify event dates and places',

              done:
                false
            }
          ],

          linkedPersonIds: [
            'silver'
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          relatedNoteIds: [
            'note-silver-luna-marriage'
          ],

          createdAt:
            '2026-06-05T08:40:00Z',

          updatedAt:
            '2026-07-19T10:25:00Z'
        }),

        note({
          id:
            'note-luna-interview',

          title:
            'Family interview with Luna',

          body: body(
            'Interview focus',
            'Family movement, the Whiskerfield album, and memories connected to Meowbridge.',
            '',
            'Current recollections',
            'Luna remembers family stories about movement between nearby villages and Pawford.',
            'She may be able to identify the owner of the old family album.',
            '',
            'Follow-up questions',
            'Who originally kept the album?',
            'Which relatives lived in Meowbridge?',
            'Did Daisy discuss siblings or parentage?'
          ),

          collectionIds: [
            'note-col-interviews',
            'note-col-whiskerfield'
          ],

          checklist: [
            {
              id:
                'note-luna-interview-follow-up',

              text:
                'Schedule a follow-up conversation',

              done:
                false
            },

            {
              id:
                'note-luna-interview-album',

              text:
                'Prepare unidentified album photographs',

              done:
                false
            }
          ],

          linkedPersonIds: [
            'luna',
            'silver'
          ],

          linkedPlaceIds: [
            'place-meowbridge'
          ],

          linkedArchiveFileIds: [
            'af6'
          ],

          relatedNoteIds: [
            'note-whiskerfield-album'
          ],

          createdAt:
            '2026-04-02T14:00:00Z',

          updatedAt:
            '2026-07-15T11:50:00Z'
        }),

        note({
          id:
            'note-pawford-archive-visit',

          title:
            'Pawford archive visit checklist',

          body: body(
            'Prepare a focused archive visit for Pawford household and register material.',
            '',
            'Capture complete references and adjacent pages rather than isolated entries.',
            'Record negative searches as well as useful findings.'
          ),

          collectionIds: [
            'note-col-pawford',
            'note-col-sources'
          ],

          checklist: [
            {
              id:
                'note-pawford-archive-continuation',

              text:
                'Review the register continuation',

              done:
                false
            },

            {
              id:
                'note-pawford-archive-households',

              text:
                'Capture surrounding household pages',

              done:
                false
            },

            {
              id:
                'note-pawford-archive-spellings',

              text:
                'Search surname spelling variants',

              done:
                false
            },

            {
              id:
                'note-pawford-archive-images',

              text:
                'Record image and folder references',

              done:
                false
            }
          ],

          linkedPlaceIds: [
            'place-pawford'
          ],

          linkedArchiveFileIds: [
            'af1',
            'af4'
          ],

          createdAt:
            '2026-06-01T08:00:00Z',

          updatedAt:
            '2026-07-14T16:20:00Z'
        })
      ];
    })();

    sampleData.sourceLinks = [
      // Source → People
      ['as1', 'person', 'barnaby'],
      ['as1', 'person', 'daisy'],
      ['as2', 'person', 'luna'],
      ['as3', 'person', 'barnaby'],
      ['as3', 'person', 'luna'],
      ['as4', 'person', 'luna'],
      ['as5', 'person', 'silver'],

      // Source → Places
      ['as1', 'place', 'place-archive'],
      ['as1', 'place', 'place-pawford'],
      ['as2', 'place', 'place-pawford'],
      ['as3', 'place', 'place-meowbridge'],
      ['as5', 'place', 'place-pawford'],
      ['as6', 'place', 'place-pawford'],

      // Source → Archive files
      ['as1', 'file', 'af1'],
      ['as1', 'file', 'af2'],
      ['as1', 'file', 'af3'],
      ['as2', 'file', 'af4'],
      ['as3', 'file', 'af5'],
      ['as4', 'file', 'af6'],
      ['as5', 'file', 'af7'],
      ['as6', 'file', 'af9'],

      // Source → Notes
      ['as1', 'note', 'note-daisy-parentage'],
      ['as1', 'note', 'note-pawford-household'],
      ['as1', 'note', 'note-pawford-archive-visit'],
      ['as2', 'note', 'note-pawford-archive-visit'],
      ['as3', 'note', 'note-meowbridge-transcription'],
      ['as3', 'note', 'note-silver-luna-marriage'],
      ['as4', 'note', 'note-luna-interview'],
      ['as5', 'note', 'note-whiskerfield-album'],
      ['as6', 'note', 'note-whiskerfield-surname'],
      ['as6', 'note', 'note-rupert-death']
    ].map(
      (
        [
          sourceId,
          targetType,
          targetId
        ],
        index
      ) => ({
        id:
          `source-link-seed-${index + 1}`,

        projectId:
          'p1',

        sourceId,
        targetType,
        targetId
      })
    );

    let runtimeIdSequence = 0;

    function createRuntimeId(
      prefix
    ) {
      runtimeIdSequence += 1;

      const randomPart =
        typeof crypto !== 'undefined'
        && typeof crypto.randomUUID
          === 'function'
          ? crypto.randomUUID()
              .replaceAll('-', '')
              .slice(0, 10)
          : Math.random()
              .toString(36)
              .slice(2, 12);

      return `${prefix}-${
        Date.now().toString(36)
      }-${runtimeIdSequence.toString(36)}-${
        randomPart
      }`;
    }

    function noteTimestamp(
      note,
      field = 'updatedAt'
    ) {
      const timestamp =
        Date.parse(
          note?.[field] || ''
        );

      return Number.isFinite(timestamp)
        ? timestamp
        : 0;
    }

    function getProjectNotes(
      projectId =
        currentProjectId(),
      {
        includeArchived = false
      } = {}
    ) {
      return (
        sampleData.notes || []
      )
        .filter(note =>
          note.projectId
            === projectId
          && (
            includeArchived
            || !note.archived
          )
        )
        .slice()
        .sort(
          (first, second) =>
            noteTimestamp(
              second,
              'updatedAt'
            )
            - noteTimestamp(
                first,
                'updatedAt'
              )
        );
    }

    function getNote(
      noteId,
      {
        projectId =
          currentProjectId(),
        includeArchived = true
      } = {}
    ) {
      const note =
        (
          sampleData.notes || []
        ).find(
          item =>
            item.id === noteId
        )
        || null;

      if (
        !note
        || (
          projectId
          && note.projectId
            !== projectId
        )
        || (
          !includeArchived
          && note.archived
        )
      ) {
        return null;
      }

      return note;
    }

    function getProjectNoteCollections(
      projectId =
        currentProjectId()
    ) {
      return (
        sampleData.noteCollections
        || []
      ).filter(
        collection =>
          collection.projectId
            === projectId
      );
    }

    function getNoteCollection(
      collectionId,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const collection =
        (
          sampleData.noteCollections
          || []
        ).find(
          item =>
            item.id
              === collectionId
        )
        || null;

      if (
        !collection
        || (
          projectId
          && collection.projectId
            !== projectId
        )
      ) {
        return null;
      }

      return collection;
    }

    function getCollectionsForNote(
      noteId,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId,
            includeArchived: true
          }
        );

      if (!note) {
        return [];
      }

      return (
        note.collectionIds || []
      )
        .map(collectionId =>
          getNoteCollection(
            collectionId,
            {
              projectId:
                note.projectId
            }
          )
        )
        .filter(Boolean);
    }

    function getNotesForCollection(
      collectionId,
      {
        projectId =
          currentProjectId(),
        includeArchived = false
      } = {}
    ) {
      const collection =
        getNoteCollection(
          collectionId,
          {
            projectId
          }
        );

      if (!collection) {
        return [];
      }

      return getProjectNotes(
        collection.projectId,
        {
          includeArchived
        }
      ).filter(note =>
        (
          note.collectionIds || []
        ).includes(
          collection.id
        )
      );
    }

    function getNotesLinkedById(
      field,
      linkedId,
      {
        projectId =
          currentProjectId(),
        includeArchived = false
      } = {}
    ) {
      if (!linkedId) {
        return [];
      }

      return getProjectNotes(
        projectId,
        {
          includeArchived
        }
      ).filter(note =>
        (
          note[field] || []
        ).includes(linkedId)
      );
    }

    const NOTE_ENTITY_TYPES =
      Object.freeze({
        person: Object.freeze({
          field:
            'linkedPersonIds',

          sectionKey:
            'people',

          iconSvg:
            icon.people,

          chipTone:
            'people',

          contextLabel:
            'Person',

          title:
            'People',

          singular:
            'person',

          plural:
            'people',

          records:
            projectId =>
              (
                sampleData.people || []
              ).filter(
                person =>
                  person.projectId
                    === projectId
                  && !person.deleted
              ),

          label:
            record =>
              personResourceDisplayName(
                record
              )
              || 'Unnamed person',

          meta:
            record => {
              const dates = [
                formatGenealogyDateLabel(
                  record.birth
                ),

                formatGenealogyDateLabel(
                  record.death
                )
              ]
                .filter(Boolean)
                .join(' – ');

              return (
                dates
                || 'Person record'
              );
            },

          open:
            record => {
              openPlaceInspectorPerson(
                record.id
              );
            }
        }),

        place: Object.freeze({
          field:
            'linkedPlaceIds',

          sectionKey:
            'places',

          iconSvg:
            icon.mapPin,

          chipTone:
            'places',

          contextLabel:
            'Place',

          title:
            'Places',

          singular:
            'place',

          plural:
            'places',

          records:
            projectId =>
              (
                sampleData.places || []
              ).filter(
                place =>
                  place.projectId
                    === projectId
                  && !place.deleted
              ),

          label:
            record =>
              placeDisplayText(
                record
              )
              || 'Unnamed place',

          meta:
            () =>
              'Place record',

          open:
            record => {
              state.activeModule =
                'Places';

              state.placesView =
                'all';

              state.selectedPlaceId =
                record.id;

              state.placesInspectorCollapsed =
                false;

              render();
            }
        }),

        event: Object.freeze({
          field:
            'linkedEventIds',

          sectionKey:
            'events',

          iconSvg:
            icon.calendar,

          chipTone:
            'events',

          contextLabel:
            'Event',

          title:
            'Events',

          singular:
            'event',

          plural:
            'events',

          records:
            projectId =>
              (
                sampleData.events || []
              ).filter(
                event =>
                  event.projectId
                    === projectId
              ),

          label:
            record =>
              record.title
              || record.typeLabel
              || record.type
              || 'Event',

          meta:
            record =>
              [
                timelineDateLabel(
                  record
                ),

                record.placeId
                  ? getPlaceDisplay(
                      record.placeId
                    )
                  : record.placeText
              ]
                .filter(Boolean)
                .join(' · ')
              || 'Event record',

          open:
            record => {
              const owner =
                placeInspectorEventOwnerIds(
                  record
                )
                  .map(personId =>
                    getPerson(
                      personId
                    )
                  )
                  .find(person =>
                    person
                    && !person.deleted
                    && (
                      !record.projectId
                      || person.projectId
                        === record.projectId
                    )
                  );

              if (!owner) {
                showToast(
                  'This event has no valid person owner.'
                );

                return;
              }

              openPlaceInspectorPerson(
                owner.id
              );
            }
        }),

        photo: Object.freeze({
          field:
            'linkedPhotoIds',

          sectionKey:
            'photos',

          iconSvg:
            icon.image,

          chipTone:
            'photos',

          contextLabel:
            'Photo',

          title:
            'Photos',

          singular:
            'photo',

          plural:
            'photos',

          records:
            projectId =>
              getProjectPhotos(
                projectId
              ),

          label:
            record =>
              record.title
              || record.filename
              || 'Untitled photo',

          meta:
            record =>
              [
                formatPhotoDate(
                  record
                ),

                getPlaceDisplay(
                  record.placeId
                )
                || record.placeText
              ]
                .filter(Boolean)
                .join(' · ')
              || 'Photo',

          open:
            record => {
              openAlbumsForPhoto(
                record.id
              );
            }
        }),

        source: Object.freeze({
          field:
            null,

          sectionKey:
            'sources',

          iconSvg:
            icon.archive,

          chipTone:
            'sources',

          contextLabel:
            'Source',

          title:
            'Sources',

          singular:
            'source',

          plural:
            'sources',

          records:
            projectId =>
              (
                sampleData.sources || []
              ).filter(
                source =>
                  source.projectId
                    === projectId
              ),

          label:
            record =>
              record.title
              || record.name
              || record.citation
              || record.id,

          meta:
            record =>
              [
                record.providedBy,
                record.reference
              ]
                .filter(Boolean)
                .join(' · ')
              || 'Source record',

          open:
            record => {
              state.activeModule =
                'Archive';

              state.archiveView =
                'sources';

              state.archiveSelectedSourceId =
                record.id;

              state.archiveInspectorCollapsed =
                false;

              render();
            }
        }),

        archiveFile: Object.freeze({
          field:
            'linkedArchiveFileIds',

          sectionKey:
            'files',

          iconSvg:
            icon.file,

          chipTone:
            'files',

          contextLabel:
            'File',

          title:
            'Archive',

          singular:
            'file',

          plural:
            'files',

          records:
            projectId =>
              (
                sampleData.archiveFiles
                || []
              ).filter(
                file =>
                  !file.deleted
                  && (
                    !file.projectId
                    || file.projectId
                      === projectId
                  )
              ),

          label:
            record =>
              record.name
              || record.title
              || record.id,

          meta:
            record =>
              record.type
              || record.kind
              || 'Archive file',

          open:
            record => {
              openPlaceInspectorArchiveFile(
                record.id
              );
            }
        })
      });

    function getNoteEntityConfig(
      type
    ) {
      return (
        NOTE_ENTITY_TYPES[type]
        || null
      );
    }

    function noteEntityLinkedIds(
      note,
      type
    ) {
      const config =
        getNoteEntityConfig(
          type
        );

      if (!note || !config) {
        return [];
      }

      if (type === 'source') {
        return sourceIdsForTarget(
          'note',
          note.id,
          note.projectId
        );
      }

      return normalizeCentralNoteIdArray(
        note[config.field] || []
      );
    }

    function noteEntityRecordsForNote(
      note,
      type
    ) {
      if (
        !note
        || !getNoteEntityConfig(type)
      ) {
        return [];
      }

      return noteEntityLinkedIds(
        note,
        type
      )
        .map(id =>
          noteEntityById(
            type,
            id,
            note.projectId
          )
        )
        .filter(Boolean);
    }

    function noteEntityRecords(
      type,
      projectId =
        currentProjectId()
    ) {
      const config =
        getNoteEntityConfig(type);

      if (!config) {
        return [];
      }

      return config
        .records(projectId)
        .slice()
        .sort(
          (
            first,
            second
          ) =>
            config
              .label(first)
              .localeCompare(
                config.label(second)
              )
        );
    }

    function noteEntityById(
      type,
      id,
      projectId =
        currentProjectId()
    ) {
      if (!id) {
        return null;
      }

      const config =
        getNoteEntityConfig(type);

      if (!config) {
        return null;
      }

      return (
        config
          .records(projectId)
          .find(
            record =>
              record.id === id
          )
        || null
      );
    }

    function noteEntityLabel(
      type,
      record
    ) {
      const config =
        getNoteEntityConfig(type);

      return (
        config && record
          ? config.label(record)
          : ''
      );
    }

    function noteEntityMeta(
      type,
      record
    ) {
      const config =
        getNoteEntityConfig(type);

      return (
        config && record
          ? config.meta(record)
          : ''
      );
    }

    function openNoteEntity(
      type,
      record
    ) {
      const config =
        getNoteEntityConfig(type);

      if (!config || !record) {
        return;
      }

      config.open(record);
    }

    function getNotesForEntity(
      type,
      id,
      {
        projectId =
          currentProjectId(),

        includeArchived =
          false
      } = {}
    ) {
      const record =
        noteEntityById(
          type,
          id,
          projectId
        );

      if (!record) {
        return [];
      }

      return getProjectNotes(
        projectId,
        {
          includeArchived
        }
      ).filter(note =>
        noteEntityLinkedIds(
          note,
          type
        ).includes(
          id
        )
      );
    }

    function getNotesForEvent(
      eventId,
      options = {}
    ) {
      return getNotesForEntity(
        'event',
        eventId,
        options
      );
    }

    function getNotesForSource(
      sourceId,
      options = {}
    ) {
      return getNotesForEntity(
        'source',
        sourceId,
        options
      );
    }

    function getNotesForArchiveFile(
      fileId,
      options = {}
    ) {
      return getNotesForEntity(
        'archiveFile',
        fileId,
        options
      );
    }

    function getNotesForPhoto(
      photoId,
      options = {}
    ) {
      return getNotesForEntity(
        'photo',
        photoId,
        options
      );
    }

    function getPhotosForNote(
      noteId,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId,
            includeArchived: true
          }
        );

      if (!note) {
        return [];
      }

      return (
        note.linkedPhotoIds || []
      )
        .map(photoId =>
          getPhoto(
            photoId,
            {
              projectId:
                note.projectId
            }
          )
        )
        .filter(Boolean);
    }

    /*
      Shared mutation path for every
      Note-to-entity relationship.
    */
    function setNoteEntityLinks(
      noteId,
      type,
      linkedIds,
      {
        projectId =
          currentProjectId(),

        touchUpdatedAt =
          true,

        refreshPreview =
          true
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId,
            includeArchived:
              true
          }
        );

      const config =
        getNoteEntityConfig(
          type
        );

      if (!note || !config) {
        return null;
      }

      const validIds =
        new Set(
          noteEntityRecords(
            type,
            note.projectId
          ).map(record =>
            record.id
          )
        );

      const nextIds =
        normalizeCentralNoteIdArray(
          linkedIds
        ).filter(id =>
          validIds.has(id)
        );

      const currentIds =
        noteEntityLinkedIds(
          note,
          type
        );

      const unchanged =
        nextIds.length
          === currentIds.length
        && nextIds.every(
          (
            id,
            index
          ) =>
            id === currentIds[index]
        );

      if (unchanged) {
        return note;
      }

      if (type === 'source') {
        const savedIds =
          setSourceIdsForTarget(
            'note',
            note.id,
            nextIds,
            {
              projectId:
                note.projectId
            }
          );

        if (!savedIds) {
          return null;
        }
      } else {
        note[config.field] =
          nextIds;
      }

      if (touchUpdatedAt) {
        if (
          state.activeModule === 'Notes'
          && state.selectedNoteId
            === note.id
        ) {
          touchNote(
            note,
            {
              refreshPreview
            }
          );
        } else {
          note.updatedAt =
            new Date().toISOString();
        }
      }

      return note;
    }

    function setNotePhotoLinks(
      noteId,
      photoIds,
      options = {}
    ) {
      return setNoteEntityLinks(
        noteId,
        'photo',
        photoIds,
        options
      );
    }

    function removePhotosFromAllNotes(
      photoIds
    ) {
      const ids =
        new Set(
          (
            Array.isArray(photoIds)
              ? photoIds
              : [photoIds]
          ).filter(Boolean)
        );

      if (!ids.size) {
        return;
      }

      const now =
        new Date()
          .toISOString();

      sampleData.notes.forEach(
        note => {
          const current =
            note.linkedPhotoIds || [];

          const next =
            current.filter(
              photoId =>
                !ids.has(photoId)
            );

          if (
            next.length
              === current.length
          ) {
            return;
          }

          note.linkedPhotoIds =
            next;

          note.updatedAt =
            now;
        }
      );
    }

    function clearNotesContext() {
      state.notesContext =
        null;
    }

    function setNotesContext(
      type,
      id,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      const record =
        noteEntityById(
          type,
          id,
          projectId
        );

      if (!record) {
        clearNotesContext();

        return null;
      }

      state.notesContext = {
        type,
        id:
          record.id,

        projectId
      };

      return record;
    }

    function activeNotesContext() {
      const context =
        state.notesContext;

      if (!context) {
        return null;
      }

      if (
        context.projectId
          !== currentProjectId()
      ) {
        clearNotesContext();

        return null;
      }

      const config =
        getNoteEntityConfig(
          context.type
        );

      const record =
        noteEntityById(
          context.type,
          context.id,
          context.projectId
        );

      if (!config || !record) {
        clearNotesContext();

        return null;
      }

      return {
        ...context,

        field:
          config.field,

        label:
          config.contextLabel,

        name:
          config.label(record),

        record
      };
    }

    function getNotesForContext(
      type,
      id,
      options = {}
    ) {
      return getNotesForEntity(
        type,
        id,
        options
      );
    }

    function openNotesForContext(
      type,
      id
    ) {
      const record =
        setNotesContext(
          type,
          id
        );

      if (!record) {
        return;
      }

      state.activeModule =
        'Notes';

      state.notesView =
        'all';

      state.notesActiveCollectionId =
        null;

      state.selectedNoteId =
        null;

      state.notesSearch =
        '';

      state.notesRightCollapsed =
        true;

      render();
    }

    function openCentralNoteFromContext(
      noteId,
      {
        type = '',
        id = ''
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            includeArchived:
              true
          }
        );

      if (!note) {
        return;
      }

      state.activeModule =
        'Notes';

      clearNotesContext();

      const config =
        getNoteEntityConfig(type);

      if (
        config
        && id
        && noteEntityLinkedIds(
          note,
          type
        ).includes(id)
      ) {
        setNotesContext(
          type,
          id,
          {
            projectId:
              note.projectId
          }
        );
      }

      state.notesView =
        note.archived
          ? 'archived'
          : 'all';

      state.notesActiveCollectionId =
        null;

      state.selectedNoteId =
        note.id;

      state.notesSearch =
        '';

      state.notesRightCollapsed =
        false;

      state.notesMobilePane =
        'editor';

      render();
    }

    function openNewNoteForContext(
      type,
      id
    ) {
      const record =
        noteEntityById(
          type,
          id
        );

      if (!record) {
        return null;
      }

      return createCentralNote({
        contextType:
          type,

        contextId:
          record.id
      });
    }

    

    

    function getRelatedNotes(
      noteId,
      {
        projectId =
          currentProjectId(),
        includeArchived = false
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId,
            includeArchived: true
          }
        );

      if (!note) {
        return [];
      }

      const relatedIds =
        new Set(
          note.relatedNoteIds || []
        );

      return getProjectNotes(
        note.projectId,
        {
          includeArchived
        }
      ).filter(relatedNote =>
        relatedIds.has(
          relatedNote.id
        )
      );
    }

    function noteExcerpt(
      note,
      maxLength = 160
    ) {
      const text =
        String(
          state.language === 'ru'
            ? translateText(
                note?.body || ''
              )
            : note?.body || ''
        )
          .replace(/\s+/g, ' ')
          .trim();

      if (
        !text
        || text.length <= maxLength
      ) {
        return text;
      }

      const draft =
        text.slice(
          0,
          maxLength + 1
        );

      const boundary =
        draft.lastIndexOf(' ');

      const clipped =
        boundary > maxLength * 0.65
          ? draft.slice(0, boundary)
          : draft.slice(0, maxLength);

      return `${clipped.trim()}…`;
    }

    function noteExternalEntityCount(
      note
    ) {
      return Object.keys(
        NOTE_ENTITY_TYPES
      ).reduce(
        (
          total,
          type
        ) =>
          total
          + new Set(
              noteEntityLinkedIds(
                note,
                type
              )
            ).size,

        0
      );
    }

    function noteLinkedEntityCount(
      note
    ) {
      return (
        noteExternalEntityCount(
          note
        )
        + new Set(
            note?.relatedNoteIds
            || []
          ).size
      );
    }

    function formatNoteUpdatedAt(
      note
    ) {
      const timestamp =
        Date.parse(
          note?.updatedAt || ''
        );

      if (
        !Number.isFinite(timestamp)
      ) {
        return 'Unknown date';
      }

      return new Intl.DateTimeFormat(
        state.language === 'ru' ? 'ru-RU' : 'en-GB',
        {
          dateStyle: 'medium'
        }
      ).format(
        new Date(timestamp)
      );
    }

    function setNoteCollections(
      noteId,
      collectionIds,
      {
        projectId =
          currentProjectId(),
        touchUpdatedAt = true
      } = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId,
            includeArchived: true
          }
        );

      if (!note) {
        return null;
      }

      const validCollectionIds =
        new Set(
          getProjectNoteCollections(
            note.projectId
          ).map(
            collection =>
              collection.id
          )
        );

      const nextCollectionIds =
        normalizeCentralNoteIdArray(
          Array.isArray(collectionIds)
            ? collectionIds
            : []
        ).filter(collectionId =>
          validCollectionIds.has(
            collectionId
          )
        );

      const unchanged =
        nextCollectionIds.length
          === note.collectionIds.length
        && nextCollectionIds.every(
          (
            collectionId,
            index
          ) =>
            collectionId
              === note.collectionIds[
                index
              ]
        );

      if (unchanged) {
        return note;
      }

      note.collectionIds =
        nextCollectionIds;

      if (touchUpdatedAt) {
        note.updatedAt =
          new Date().toISOString();
      }

      return note;
    }

    function addNoteToCollection(
      noteId,
      collectionId,
      options = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId:
              options.projectId
              || currentProjectId(),
            includeArchived: true
          }
        );

      if (!note) {
        return null;
      }

      return setNoteCollections(
        note.id,
        [
          ...note.collectionIds,
          collectionId
        ],
        options
      );
    }

    function removeNoteFromCollection(
      noteId,
      collectionId,
      options = {}
    ) {
      const note =
        getNote(
          noteId,
          {
            projectId:
              options.projectId
              || currentProjectId(),
            includeArchived: true
          }
        );

      if (!note) {
        return null;
      }

      return setNoteCollections(
        note.id,
        note.collectionIds.filter(
          id =>
            id !== collectionId
        ),
        options
      );
    }

    function destroyNotesRichTextEditor() {
      const instance =
        notesRichTextRuntime
          .instance;

      if (
        instance
        && notesRichTextRuntime
          .textChangeHandler
      ) {
        instance.off(
          'text-change',
          notesRichTextRuntime
            .textChangeHandler
        );
      }

      if (
        instance
        && notesRichTextRuntime
          .selectionChangeHandler
      ) {
        instance.off(
          'selection-change',
          notesRichTextRuntime
            .selectionChangeHandler
        );
      }

      notesRichTextRuntime.instance =
        null;

      notesRichTextRuntime.noteId =
        '';

      notesRichTextRuntime.toolbarElement =
        null;

      notesRichTextRuntime.editorElement =
        null;

      notesRichTextRuntime.fallbackElement =
        null;

      notesRichTextRuntime.textChangeHandler =
        null;

      notesRichTextRuntime.selectionChangeHandler =
        null;

      notesRichTextRuntime.lastSelection =
        null;

      notesRichTextRuntime.initializing =
        false;

      notesRichTextRuntime.fallbackActive =
        false;
    }

    function plainTextFromQuill(
      instance
    ) {
      if (!instance) {
        return '';
      }

      const text =
        String(
          instance.getText() || ''
        );

      return text.endsWith('\n')
        ? text.slice(0, -1)
        : text;
    }

    function createRichTextQuill({
      editorHost,
      toolbar,
      bounds,
      placeholder =
        'Start writing…',

      toolbarLabel =
        'Text formatting',

      editorLabel =
        'Rich text'
    }) {
      if (
        !editorHost
        || !toolbar
        || typeof window.Quill
          !== 'function'
      ) {
        return null;
      }

      const instance =
        new window.Quill(
          editorHost,
          {
            theme: 'snow',

            placeholder: t(placeholder),

            bounds,

            formats: [
              'header',
              'size',

              'bold',
              'italic',
              'underline',
              'strike',

              'color',
              'background',

              'blockquote',
              'list',
              'align',
              'indent',

              'link'
            ],

            modules: {
              toolbar: {
                container:
                  toolbar
              },

              history: {
                delay: 1000,
                maxStack: 100,
                userOnly: true
              }
            }
          }
        );

      prepareRichTextAccessibility(
        instance,
        toolbar,
        {
          toolbarLabel,
          editorLabel
        }
      );

      configureRichTextLinkControl(
        instance
      );

      return instance;
    }

    function prepareRichTextAccessibility(
      instance,
      toolbar,
      {
        toolbarLabel =
          'Text formatting',

        editorLabel =
          'Rich text'
      } = {}
    ) {
      if (!instance || !toolbar) {
        return;
      }

      toolbar.setAttribute(
        'role',
        'toolbar'
      );

      toolbar.setAttribute(
        'aria-label',
        toolbarLabel
      );

      const controlLabels = [
        [
          'button.ql-bold',
          'Bold'
        ],

        [
          'button.ql-italic',
          'Italic'
        ],

        [
          'button.ql-underline',
          'Underline'
        ],

        [
          'button.ql-strike',
          'Strikethrough'
        ],

        [
          'button.ql-list[value="bullet"]',
          'Bulleted list'
        ],

        [
          'button.ql-list[value="ordered"]',
          'Numbered list'
        ],

        [
          'button.ql-indent[value="-1"]',
          'Decrease indent'
        ],

        [
          'button.ql-indent[value="+1"]',
          'Increase indent'
        ],

        [
          'button.ql-blockquote',
          'Block quote'
        ],

        [
          'button.ql-link',
          'Link'
        ],

        [
          'button.ql-clean',
          'Clear formatting'
        ]
      ];

      controlLabels.forEach(([
        selector,
        label
      ]) => {
        const control =
          toolbar.querySelector(
            selector
          );

        if (!control) {
          return;
        }

        control.setAttribute(
          'aria-label',
          label
        );

        control.setAttribute(
          'title',
          label
        );
      });

      const pickerLabels = [
        [
          '.ql-picker.ql-header',
          'Text style'
        ],

        [
          '.ql-picker.ql-size',
          'Font size'
        ],

        [
          '.ql-picker.ql-color',
          'Text color'
        ],

        [
          '.ql-picker.ql-background',
          'Highlight color'
        ],

        [
          '.ql-picker.ql-align',
          'Alignment'
        ]
      ];

      pickerLabels.forEach(([
        selector,
        label
      ]) => {
        const picker =
          toolbar.querySelector(
            selector
          );

        const pickerLabel =
          picker?.querySelector(
            '.ql-picker-label'
          );

        if (!pickerLabel) {
          return;
        }

        pickerLabel.setAttribute(
          'aria-label',
          label
        );

        pickerLabel.setAttribute(
          'title',
          label
        );
      });

      const sizeLabels = {
        small: 'Small',
        large: 'Large',
        huge: 'Huge'
      };

      toolbar
        .querySelectorAll(
          '.ql-picker.ql-size .ql-picker-item'
        )
        .forEach(item => {
          const value =
            item.dataset.value || '';

          const label =
            sizeLabels[value]
            || 'Normal';

          item.setAttribute(
            'aria-label',
            label
          );

          item.setAttribute(
            'title',
            label
          );
        });

      const alignmentLabels = {
        center: 'Center',
        right: 'Right',
        justify: 'Justify'
      };

      toolbar
        .querySelectorAll(
          '.ql-picker.ql-align .ql-picker-item'
        )
        .forEach(item => {
          const value =
            item.dataset.value || '';

          const label =
            alignmentLabels[value]
            || 'Left';

          item.setAttribute(
            'aria-label',
            label
          );

          item.setAttribute(
            'title',
            label
          );
        });

      [
        [
          '.ql-picker.ql-color',
          'Text color',
          'Default text color'
        ],

        [
          '.ql-picker.ql-background',
          'Highlight',
          'No highlight'
        ]
      ].forEach(([
        selector,
        prefix,
        defaultLabel
      ]) => {
        toolbar
          .querySelectorAll(
            `${selector} .ql-picker-item`
          )
          .forEach(item => {
            const value =
              item.dataset.value || '';

            const label =
              value
                ? `${prefix} ${value}`
                : defaultLabel;

            item.setAttribute(
              'aria-label',
              label
            );

            item.setAttribute(
              'title',
              label
            );
          });
      });

      instance.root.setAttribute(
        'aria-label',
        editorLabel
      );

      instance.root.setAttribute(
        'aria-multiline',
        'true'
      );

      instance.root.setAttribute(
        'spellcheck',
        'true'
      );
    }

    function configureRichTextLinkControl(
      instance
    ) {
      if (!instance) {
        return;
      }

      const toolbarModule =
        instance.getModule(
          'toolbar'
        );

      const tooltip =
        instance.theme
          ?.tooltip;

      if (
        !toolbarModule
        || !tooltip
      ) {
        return;
      }

      const getLinkInput =
        () =>
          tooltip.textbox
          || tooltip.root
            ?.querySelector(
              'input[type="text"]'
            )
          || null;

      const prepareLinkInput =
        () => {
          const input =
            getLinkInput();

          if (!input) {
            return null;
          }

          input.placeholder =
            'Paste or enter a URL';

          input.setAttribute(
            'aria-label',
            'Link URL'
          );

          input.setAttribute(
            'autocomplete',
            'url'
          );

          input.setAttribute(
            'inputmode',
            'url'
          );

          return input;
        };

      /*
        Override Quill Snow's default handler.

        The standard handler copies selected
        editor text into the URL input. For
        GeneoGraph, new links should begin with
        an empty URL field.
      */
      toolbarModule.addHandler(
        'link',
        value => {
          /*
            Quill passes false when the active
            Link button is clicked. Preserve
            the normal unlink behaviour.
          */
          if (!value) {
            instance.format(
              'link',
              false,
              'user'
            );

            return;
          }

          /*
            focus=true restores Quill's saved
            selection after the toolbar button
            receives focus.
          */
          const range =
            instance.getSelection(
              true
            );

          if (
            !range
            || range.length === 0
          ) {
            showToast(
              'Select text before adding a link.'
            );

            return;
          }

          /*
            Open Quill's normal link editor,
            but pass an empty preview value
            instead of the selected word.
          */
          tooltip.edit(
            'link',
            ''
          );

          const input =
            prepareLinkInput();

          if (!input) {
            return;
          }

          input.value =
            '';

          requestAnimationFrame(
            () => {
              input.focus();

              if (
                typeof input
                  .setSelectionRange
                  === 'function'
              ) {
                input.setSelectionRange(
                  0,
                  0
                );
              }
            }
          );
        }
      );

      prepareLinkInput();
    }

    function bindNotesBodyFallback(
      note,
      {
        announce = true
      } = {}
    ) {
      const shell =
        main.querySelector(
          '.notes-rich-editor-shell'
        );

      const toolbar =
        main.querySelector(
          '#notesRichTextToolbar'
        );

      const editorHost =
        main.querySelector(
          '#notesRichTextEditor'
        );

      const textarea =
        main.querySelector(
          '#notesBodyInput'
        );

      if (!textarea) {
        return;
      }

      toolbar?.setAttribute(
        'hidden',
        ''
      );

      editorHost?.setAttribute(
        'hidden',
        ''
      );

      textarea.hidden =
        false;

      textarea.value =
        localizedDataFieldValue(
          String(
            note?.body || ''
          )
        );

      shell?.classList.add(
        'is-fallback'
      );

      notesRichTextRuntime.fallbackActive =
        true;

      notesRichTextRuntime.noteId =
        note?.id || '';

      notesRichTextRuntime.fallbackElement =
        textarea;

      textarea.addEventListener(
        'input',
        event => {
          const currentNote =
            getNote(
              note.id,
              {
                projectId:
                  note.projectId,

                includeArchived:
                  true
              }
            );

          if (!currentNote) {
            return;
          }

          currentNote.body =
            event.currentTarget.value;

          currentNote.bodyDelta =
            null;

          currentNote.bodyFormat =
            '';

          autoSizeNoteBody(
            event.currentTarget
          );

          touchNote(
            currentNote
          );
        }
      );

      autoSizeNoteBody(
        textarea
      );

      if (
        announce
        && !notesRichTextRuntime
          .fallbackToastShown
      ) {
        notesRichTextRuntime.fallbackToastShown =
          true;

        showToast(
          'Rich text is unavailable. Note opened in plain-text mode.'
        );
      }
    }

    function initializeNotesRichTextEditor(
      note
    ) {
      if (!note) {
        return;
      }

      const shell =
        main.querySelector(
          '.notes-rich-editor-shell'
        );

      const toolbar =
        main.querySelector(
          '#notesRichTextToolbar'
        );

      const editorHost =
        main.querySelector(
          '#notesRichTextEditor'
        );

      const fallback =
        main.querySelector(
          '#notesBodyInput'
        );

      if (
        !shell
        || !toolbar
        || !editorHost
        || !fallback
      ) {
        return;
      }

      if (
        typeof window.Quill
          !== 'function'
      ) {
        bindNotesBodyFallback(
          note
        );

        return;
      }

      notesRichTextRuntime.initializing =
        true;

      try {
        toolbar.hidden =
          false;

        editorHost.hidden =
          false;

        fallback.hidden =
          true;

        shell.classList.remove(
          'is-fallback'
        );

        const instance =
          createRichTextQuill({
            editorHost,
            toolbar,
            bounds: shell,

            placeholder:
              'Start writing…',

            toolbarLabel:
              'Note formatting',

            editorLabel:
              'Note body'
          });

        if (!instance) {
          bindNotesBodyFallback(
            note
          );

          notesRichTextRuntime.initializing =
            false;

          return;
        }

        const storedDelta =
          cloneRichTextDelta(
            note.bodyDelta
          );

        if (storedDelta) {
          instance.setContents(
            storedDelta,
            'silent'
          );
        } else {
          instance.setText(
            localizedDataFieldValue(
              String(
                note.body || ''
              )
            ),
            'silent'
          );
        }

        instance.history.clear();

        notesRichTextRuntime.instance =
          instance;

        notesRichTextRuntime.noteId =
          note.id;

        notesRichTextRuntime.toolbarElement =
          toolbar;

        notesRichTextRuntime.editorElement =
          editorHost;

        notesRichTextRuntime.fallbackElement =
          fallback;

        notesRichTextRuntime.fallbackActive =
          false;

        const textChangeHandler = (
          delta,
          oldDelta,
          source
        ) => {
          if (
            source !== 'user'
            || notesRichTextRuntime
              .instance !== instance
            || notesRichTextRuntime
              .noteId !== note.id
          ) {
            return;
          }

          const currentNote =
            getNote(
              note.id,
              {
                projectId:
                  note.projectId,

                includeArchived:
                  true
              }
            );

          if (!currentNote) {
            return;
          }

          currentNote.bodyDelta =
            normalizeRichTextDelta(
              instance.getContents()
            );

          currentNote.bodyFormat =
            currentNote.bodyDelta
              ? 'quill-delta-v1'
              : '';

          currentNote.body =
            plainTextFromQuill(
              instance
            );

          touchNote(
            currentNote
          );
        };

        const selectionChangeHandler =
          range => {
            notesRichTextRuntime.lastSelection =
              range
                ? {
                    index:
                      range.index,

                    length:
                      range.length
                  }
                : null;
          };

        notesRichTextRuntime.textChangeHandler =
          textChangeHandler;

        notesRichTextRuntime.selectionChangeHandler =
          selectionChangeHandler;

        instance.on(
          'text-change',
          textChangeHandler
        );

        instance.on(
          'selection-change',
          selectionChangeHandler
        );

        notesRichTextRuntime.initializing =
          false;
      } catch (error) {
        console.warn(
          '[Notes rich text]',
          error
        );

        destroyNotesRichTextEditor();

        bindNotesBodyFallback(
          note
        );
      }
    }

