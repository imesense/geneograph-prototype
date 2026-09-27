    // ---------- Canonical media access ----------
    function getPhoto(
      photoId,
      {
        projectId = ''
      } = {}
    ) {
      const photo =
        sampleData.media.find(
          item =>
            item.id === photoId
        )
        || null;

      if (
        !photo
        || (
          projectId
          && photo.projectId
            !== projectId
        )
      ) {
        return null;
      }

      return photo;
    }

    function getProjectPhotos(
      projectId =
        currentProjectId()
    ) {
      return projectId
        ? sampleData.media.filter(photo => photo.projectId === projectId)
        : [];
    }

    function getProjectAlbums(projectId = currentProjectId()) {
      return projectId
        ? sampleData.albums.filter(album => album.projectId === projectId)
        : [];
    }

    function photoIsTaggedWithPerson(
      photo,
      personOrId
    ) {
      const personId =
        typeof personOrId === 'string'
          ? personOrId
          : personOrId?.id;

      return Boolean(
        personId
        && Array.isArray(
          photo?.personIds
        )
        && photo.personIds.includes(
          personId
        )
      );
    }

    function getPhotosForPerson(
      personId,
      options = {}
    ) {
      const person =
        getPerson(personId);

      if (!person) {
        return [];
      }

      return getProjectPhotos(
        person.projectId,
        options
      ).filter(photo =>
        photoIsTaggedWithPerson(
          photo,
          person
        )
      );
    }

    function getPhotoPeople(photo) {
      if (!photo) return [];
      return [...new Set(photo.personIds || [])]
        .map(getPerson)
        .filter(person => person && person.projectId === photo.projectId);
    }

    function getPersonPhotoCount(personId) {
      return getPhotosForPerson(personId).length;
    }

    function getAlbumPhotoCount(albumId) {
      const album = sampleData.albums.find(item => item.id === albumId);
      if (!album) return 0;
      return getProjectPhotos(album.projectId).filter(photo =>
        Array.isArray(photo.albumIds) && photo.albumIds.includes(albumId)
      ).length;
    }

    function getAlbumName(albumId) {
      return sampleData.albums.find(album => album.id === albumId)?.name || '';
    }

    function getAlbumPreviewPhoto(albumId) {
      const album =
        getProjectAlbums().find(
          item => item.id === albumId
        );

      if (!album) return null;

      return getProjectPhotos(
        album.projectId
      ).find(photo =>
        (photo.albumIds || [])
          .includes(album.id)
      ) || null;
    }

    function getAlbumSelectedPhotoMembership(
      albumId,
      photoIds
    ) {
      const ids = [
        ...new Set(photoIds || [])
      ];

      const existingCount =
        ids.reduce(
          (count, photoId) => {
            const photo =
              getPhoto(
                photoId,
                {
                  projectId:
                    currentProjectId()
                }
              );

            return (
              count
              + (
                photo?.albumIds
                  ?.includes(albumId)
                  ? 1
                  : 0
              )
            );
          },
          0
        );

      return {
        selectedPhotoCount:
          ids.length,

        existingCount,

        missingCount:
          Math.max(
            0,
            ids.length
            - existingCount
          ),

        complete:
          ids.length > 0
          && existingCount
            === ids.length
      };
    }

    function albumPickerSearchText(album) {
      return [
        album?.name || '',
        album?.description || ''
      ]
        .join(' ')
        .toLowerCase();
    }

    function addPhotosToAlbums(
      photoIds,
      albumIds
    ) {
      const projectId =
        currentProjectId();

      const validAlbumIds =
        new Set(
          getProjectAlbums(projectId)
            .map(album => album.id)
        );

      const destinationIds = [
        ...new Set(albumIds || [])
      ].filter(albumId =>
        validAlbumIds.has(albumId)
      );

      const changedPhotoIds =
        new Set();

      const changedAlbumIds =
        new Set();

      let membershipCount = 0;

      const now =
        new Date().toISOString();

      [
        ...new Set(photoIds || [])
      ].forEach(photoId => {
        const photo =
          getPhoto(
            photoId,
            {
              projectId
            }
          );

        if (!photo) return;

        const currentIds =
          new Set(
            photo.albumIds || []
          );

        let changed = false;

        destinationIds.forEach(
          albumId => {
            if (
              currentIds.has(albumId)
            ) {
              return;
            }

            currentIds.add(albumId);
            changed = true;
            membershipCount += 1;

            changedAlbumIds.add(
              albumId
            );
          }
        );

        if (!changed) return;

        photo.albumIds = [
          ...currentIds
        ];

        photo.updatedAt = now;

        changedPhotoIds.add(
          photo.id
        );
      });

      return {
        changedPhotoCount:
          changedPhotoIds.size,

        changedAlbumCount:
          changedAlbumIds.size,

        membershipCount
      };
    }

    function photoDateModel(photo) {
      const date = photo?.date || {};
      return normalizeGenealogyDateInput({
        ...date,
        date: date.fromDate || date.date || '',
        date2: date.toDate || '',
        date2Label: date.toDate || ''
      }, date.dateType || 'Exact date');
    }

    function mediaDateFromGenealogyModel(
      value
    ) {
      const date =
        normalizeGenealogyDateInput(
          value,
          value?.dateType
          || 'Exact date'
        );

      return {
        date:
          date.dateType === 'Between'
            ? ''
            : date.date || '',

        dateLabel:
          date.dateLabel || '',

        dateType:
          date.dateType
          || 'Exact date',

        fromDate:
          date.dateType === 'Between'
            ? date.date || ''
            : '',

        toDate:
          date.dateType === 'Between'
            ? date.date2 || ''
            : '',

        calendar:
          GENEALOGY_CALENDARS.includes(
            date.calendar
          )
            ? date.calendar
            : 'Gregorian'
      };
    }

    function formatPhotoDate(photo) {
      const model = photoDateModel(photo);
      if (model.dateType === 'Between') {
        const from = formatGenealogyDateStartLabel(model);
        const to = formatGenealogyDateEndLabel(model);
        return from && to ? `${from} - ${to}` : from || to || 'Unknown date';
      }
      return formatGenealogyDateLabel(model) || 'Unknown date';
    }

    function formatMediaBytes(sizeBytes) {
      const bytes = Number(sizeBytes);
      if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
      return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    }

    function formatMediaTimestamp(value) {
      const timestamp = Date.parse(value || '');
      if (!Number.isFinite(timestamp)) return 'Unknown';
      return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric'
      }).format(new Date(timestamp));
    }

    const ALBUMS_JUSTIFIED_LAYOUT = Object.freeze({
      targetHeight: 184,
      minHeight: 150,
      maxHeight: 220,
      minCardWidth: 180,
      preferredMaxCardWidth: 360,
      gap: 12,
      lastRowMaxScale: 1.15,
      narrowBreakpoint: 720
    });

    function photoAspectRatio(photo) {
      const width = Number(photo?.width);
      const height = Number(photo?.height);
      const ratio = Number.isFinite(width)
        && Number.isFinite(height)
        && width > 0
        && height > 0
          ? width / height
          : 4 / 3;

      return Math.min(3, Math.max(0.45, ratio));
    }

    function buildJustifiedPhotoRows(photos, containerWidth, options = {}) {
      const settings = {
        ...ALBUMS_JUSTIFIED_LAYOUT,
        ...options
      };
      const width = Number(containerWidth);

      if (!Number.isFinite(width) || width <= 0) return [];

      const minimumLayoutRatio = settings.minCardWidth / settings.minHeight;
      const source = (Array.isArray(photos) ? photos : []).map(photo => {
        const naturalRatio = photoAspectRatio(photo);
        return {
          photo,
          ratio: Math.max(naturalRatio, minimumLayoutRatio)
        };
      });
      const rows = [];
      let pending = [];

      const rowHeight = items => {
        const photoWidth = width - settings.gap * Math.max(0, items.length - 1);
        const ratioTotal = items.reduce((sum, item) => sum + item.ratio, 0);
        return ratioTotal > 0 ? photoWidth / ratioTotal : settings.targetHeight;
      };

      const rowScore = items => {
        if (!items.length) return Number.POSITIVE_INFINITY;
        const height = rowHeight(items);
        const narrowest = Math.min(...items.map(item => item.ratio * height));
        const widest = Math.max(...items.map(item => item.ratio * height));
        let score = Math.abs(height - settings.targetHeight);
        if (height < settings.minHeight) score += (settings.minHeight - height) * 4;
        if (height > settings.maxHeight) score += (height - settings.maxHeight) * 3;
        if (narrowest < settings.minCardWidth) score += (settings.minCardWidth - narrowest) * 2;
        if (widest > settings.preferredMaxCardWidth) score += widest - settings.preferredMaxCardWidth;
        return score;
      };

      const justify = items => {
        const height = rowHeight(items);
        const available = Math.round(width - settings.gap * Math.max(0, items.length - 1));
        const itemWidths = items.map(item => Math.floor(height * item.ratio));
        const difference = available - itemWidths.reduce((sum, itemWidth) => sum + itemWidth, 0);
        itemWidths[itemWidths.length - 1] += difference;
        return {
          height: Math.round(height * 10) / 10,
          justified: true,
          items: items.map((item, index) => ({
            photo: item.photo,
            width: itemWidths[index]
          }))
        };
      };

      const natural = items => {
        let height = settings.targetHeight;
        if (items.length === 1) {
          height = Math.min(
            settings.targetHeight,
            settings.preferredMaxCardWidth / items[0].ratio
          );
        }
        return {
          height: Math.round(height * 10) / 10,
          justified: false,
          items: items.map(item => ({
            photo: item.photo,
            width: Math.round(item.ratio * height)
          }))
        };
      };

      source.forEach(item => {
        pending.push(item);
        const height = rowHeight(pending);
        if (height > settings.targetHeight) return;

        if (pending.length > 1) {
          const withoutLast = pending.slice(0, -1);

          if (height < settings.minHeight) {
            rows.push(justify(withoutLast));
            pending = [item];
            return;
          }

          if (
            rowScore(withoutLast) < rowScore(pending)
          ) {
            rows.push(justify(withoutLast));
            pending = [item];
            return;
          }
        }

        rows.push(justify(pending));
        pending = [];
      });

      if (pending.length === 1 && rows.length) {
        const previous = rows[rows.length - 1];
        if (previous.items.length >= 3) {
          const previousSource = previous.items.map(item => {
            const naturalRatio = photoAspectRatio(item.photo);
            return {
              photo: item.photo,
              ratio: Math.max(naturalRatio, minimumLayoutRatio)
            };
          });
          const moved = previousSource.pop();
          const rebalancedHeight = rowHeight(previousSource);
          if (rebalancedHeight >= settings.minHeight && rebalancedHeight <= settings.maxHeight) {
            rows[rows.length - 1] = justify(previousSource);
            pending.unshift(moved);
          }
        }
      }

      if (pending.length) {
        const height = rowHeight(pending);
        const canJustify = pending.length > 1
          && height >= settings.minHeight
          && height <= settings.targetHeight * settings.lastRowMaxScale;
        rows.push(canJustify ? justify(pending) : natural(pending));
      }

      return rows;
    }

    const PHOTO_ABSTRACT_PATTERNS = Object.freeze(['orbit', 'bands', 'window', 'fold', 'halo', 'archive']);
    const PHOTO_ABSTRACT_PALETTES = Object.freeze(['moss', 'plum', 'amber', 'mono', 'sea', 'rose']);

    function photoAbstractModel(photo) {
      const placeholder = photo?.placeholder || {};
      const seed = Number.isInteger(placeholder.seed) && placeholder.seed > 0
        ? placeholder.seed
        : [...String(photo?.id || 'photo')].reduce((total, character) => total + character.charCodeAt(0), 0);
      const pattern = PHOTO_ABSTRACT_PATTERNS.includes(placeholder.pattern)
        ? placeholder.pattern
        : PHOTO_ABSTRACT_PATTERNS[seed % PHOTO_ABSTRACT_PATTERNS.length];
      const palette = PHOTO_ABSTRACT_PALETTES.includes(placeholder.palette)
        ? placeholder.palette
        : PHOTO_ABSTRACT_PALETTES[seed % PHOTO_ABSTRACT_PALETTES.length];
      return {
        pattern,
        palette,
        rotation: (seed * 29) % 180,
        offsetX: 18 + ((seed * 17) % 64),
        offsetY: 16 + ((seed * 23) % 68)
      };
    }

    function renderPhotoAbstract(photo) {
      const model = photoAbstractModel(photo);
      return `<span class="photo-abstract pattern-${escapeHtml(model.pattern)} palette-${escapeHtml(model.palette)}" style="--photo-abstract-angle:${model.rotation}deg;--photo-abstract-x:${model.offsetX}%;--photo-abstract-y:${model.offsetY}%" aria-hidden="true"><span class="photo-abstract-layer one"></span><span class="photo-abstract-layer two"></span><span class="photo-abstract-layer three"></span></span>`;
    }

    function renderPhotoThumbnail(
      photo,
      options = {}
    ) {
      if (!photo) {
        return '';
      }

      const className = [
        'photo-thumbnail',
        options.className || ''
      ]
        .filter(Boolean)
        .join(' ');

      const label =
        options.label
        || photo.title
        || photo.filename
        || 'Photo';

      const src =
        typeof photo.src === 'string'
          ? photo.src.trim()
          : '';

      const useBackdrop =
        Boolean(
          src
          && options.backdrop
        );

      return `
        <span
          class="${escapeHtml(
            className
          )}${src ? ' has-image' : ''}${
            useBackdrop
              ? ' has-image-backdrop'
              : ''
          }"
          data-photo-thumbnail
          role="img"
          aria-label="${escapeHtml(label)}">

          ${renderPhotoAbstract(photo)}

          ${
            useBackdrop
              ? `
                <img
                  class="
                    thumb-img-backdrop
                  "
                  src="${escapeHtml(src)}"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  draggable="false">
              `
              : ''
          }

          ${
            src
              ? `
                <img
                  class="thumb-img"
                  src="${escapeHtml(src)}"
                  alt=""
                  loading="lazy"
                  draggable="false"
                  onerror="
                    const root =
                      this.closest(
                        '[data-photo-thumbnail]'
                      );

                    root?.classList.remove(
                      'has-image',
                      'has-image-backdrop'
                    );

                    root
                      ?.querySelector(
                        '.thumb-img-backdrop'
                      )
                      ?.remove();

                    this.remove();
                  ">
              `
              : ''
          }
        </span>
      `;
    }

    const PERSON_PHOTO_CROP_DEFAULT = Object.freeze({
      centerX: 0.5,
      centerY: 0.5,
      zoom: 1,
      rotation: 0
    });
    const PERSON_PHOTO_ZOOM_MIN = 1;
    const PERSON_PHOTO_ZOOM_MAX = 3;
    const PERSON_PHOTO_ROTATIONS = Object.freeze([0, 90, 180, 270]);

    function clampPersonPhotoValue(value, minimum, maximum, fallback) {
      const number = Number(value);
      return Number.isFinite(number)
        ? Math.min(maximum, Math.max(minimum, number))
        : fallback;
    }

    function normalizePersonPhotoCrop(crop) {
      const rotation = Number(crop?.rotation);
      return {
        centerX: clampPersonPhotoValue(crop?.centerX, 0, 1, PERSON_PHOTO_CROP_DEFAULT.centerX),
        centerY: clampPersonPhotoValue(crop?.centerY, 0, 1, PERSON_PHOTO_CROP_DEFAULT.centerY),
        zoom: clampPersonPhotoValue(crop?.zoom, PERSON_PHOTO_ZOOM_MIN, PERSON_PHOTO_ZOOM_MAX, PERSON_PHOTO_CROP_DEFAULT.zoom),
        rotation: PERSON_PHOTO_ROTATIONS.includes(rotation) ? rotation : PERSON_PHOTO_CROP_DEFAULT.rotation
      };
    }

    function repairPrimaryPhotoReferences(photoIds = []) {
      const ids = new Set(photoIds);
      sampleData.people.forEach(person => {
        if (!person.primaryPhotoId || (ids.size && !ids.has(person.primaryPhotoId))) return;
        const photo = getPhoto(person.primaryPhotoId, { projectId: person.projectId });
        if (
          !photo
          || !photoIsTaggedWithPerson(
            photo,
            person
          )
        ) {
          person.primaryPhotoId = '';
          person.primaryPhotoCrop = null;
        }
      });
    }

    function setPhotoPersonIds(photoId, personIds, { rerender = true } = {}) {
      const photo = getPhoto(photoId);
      if (!photo) return false;
      const validIds = [...new Set(personIds || [])].filter(personId =>
        getPerson(personId)?.projectId === photo.projectId
      );
      photo.personIds = validIds;
      photo.updatedAt = new Date().toISOString();
      repairPrimaryPhotoReferences([photo.id]);
      if (rerender) render();
      return true;
    }

    function setPersonPhotoIds(personId, photoIds, { rerender = true } = {}) {
      const person = getPerson(personId);
      if (!person) return false;
      const selected = new Set(
        [...new Set(photoIds || [])].filter(photoId =>
          Boolean(getPhoto(photoId, { projectId: person.projectId }))
        )
      );
      getProjectPhotos(person.projectId).forEach(photo => {
        const ids = new Set(photo.personIds || []);
        if (selected.has(photo.id)) ids.add(person.id);
        else ids.delete(person.id);
        photo.personIds = [...ids];
        photo.updatedAt = new Date().toISOString();
      });
      repairPrimaryPhotoReferences();
      if (rerender) render();
      return true;
    }

    function setPersonPrimaryPhoto(personId, photoId, crop = null, { rerender = true, notify = true } = {}) {
      const person = getPerson(personId);
      const photo = getPhoto(photoId, { projectId: person?.projectId || '' });
      if (!person || !photo || !(photo.personIds || []).includes(personId)) return false;
      const previousPhotoId = person.primaryPhotoId || '';
      person.primaryPhotoId = photo.id;
      person.primaryPhotoCrop = normalizePersonPhotoCrop(
        crop || (previousPhotoId === photo.id ? person.primaryPhotoCrop : null)
      );
      markPersonUpdated(person);
      if (rerender) render();
      if (notify) showToast('Primary photo updated.');
      return true;
    }

    function openAlbumsForPhoto(
      photoId
    ) {
      const photo =
        getPhoto(
          photoId
        );

      if (!photo) {
        showToast(
          'The photo is no longer available.'
        );

        return;
      }

      state.activeModule =
        'Albums';

      state.albumsView =
        'all';

      state.activeAlbumId =
        null;

      resetAlbumsPage();

      state.albumsFilters = {
        ...defaultAlbumFilters
      };

      state.selectedPhotoId =
        photo.id;

      state.selectedPhotoIds =
        [];

      state.albumsDetailCollapsed =
        false;

      render();
    }

    function openAlbumsForPerson(personId) {
      const person = getPerson(personId);
      if (!person) return;
      state.activeModule = 'Albums';
      state.albumsView = 'all';
      state.activeAlbumId = null;
      resetAlbumsPage();
      state.albumsFilters = { ...defaultAlbumFilters, personId };
      state.albumsSearch = '';
      state.selectedPhotoIds = [];
      state.selectedPhotoId = getPhotosForPerson(personId)[0]?.id || null;
      state.albumsDetailCollapsed = false;
      render();
    }

    function openPlaceInspectorPerson(
      personId
    ) {
      const person =
        getPerson(personId);

      if (!person) {
        showToast(
          'This person is not linked to a People profile.'
        );

        return;
      }

      state.activeModule =
        'People';

      state.selectedPeopleId =
        person.id;

      state.selectedPersonId =
        person.id;

      state.peopleView =
        'profile';

      state.peopleSide =
        'profile';

      render();
    }

    function openAlbumsForPlace(
      placeId
    ) {
      const place =
        getPlace(placeId);

      if (!place) {
        return;
      }

      const photos =
        getPhotosForPlace(
          place.id
        );

      state.activeModule =
        'Albums';

      state.albumsView =
        'all';

      state.activeAlbumId =
        null;

      resetAlbumsPage();

      state.albumsFilters = {
        ...defaultAlbumFilters,
        placeId:
          place.id
      };

      state.albumsSearch =
        '';

      state.selectedPhotoIds =
        [];

      state.selectedPhotoId =
        photos[0]?.id
        || null;

      state.albumsDetailCollapsed =
        false;

      render();
    }

    function openPlaceInspectorArchiveFile(
      fileId
    ) {
      if (!fileId) {
        return;
      }

      state.archiveSearch =
        '';

      openFamilyArchiveItem(
        fileId
      );
    }

    function openArchiveForPlace(
      placeId
    ) {
      const place =
        getPlace(placeId);

      if (!place) {
        return;
      }

      const files =
        getArchiveFilesForPlace(
          place.id
        );

      openArchiveLocation({
        view:
          'files',

        folderId:
          null,

        search:
          '',

        fileFilters: {
          ...defaultArchiveFileFilters,
          placeIds: [
            place.id
          ]
        },

        filterPresentation:
          'flat',

        filterScopeFolderId:
          null,

        selectedFileId:
          files[0]?.id
          || null,

        inspectorCollapsed:
          false
      });
    }

    function openNotesForPlace(
      placeId
    ) {
      openNotesForContext(
        'place',
        placeId
      );
    }

    function openArchiveForPerson(
      personId
    ) {
      const person =
        getPerson(personId);

      if (!person) {
        return;
      }

      const files =
        getArchiveFilesForPerson(
          person.id
        );

      openArchiveLocation({
        view:
          'files',

        folderId:
          null,

        search:
          '',

        fileFilters: {
          ...defaultArchiveFileFilters,
          personIds: [
            person.id
          ]
        },

        filterPresentation:
          'flat',

        filterScopeFolderId:
          null,

        selectedFileId:
          files[0]?.id
          || null,

        inspectorCollapsed:
          true
      });
    }

    function openNotesForPerson(
      personId
    ) {
      openNotesForContext(
        'person',
        personId
      );
    }

    function getPlace(placeId) {
      return sampleData.places.find(place => place.id === placeId) || null;
    }

    function validLatitude(value) {
      if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false;
      const number = Number(value);
      return Number.isFinite(number) && number >= -90 && number <= 90;
    }

    function validLongitude(value) {
      if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false;
      const number = Number(value);
      return Number.isFinite(number) && number >= -180 && number <= 180;
    }

    function parseLegacyCoordinateString(value) {
      if (typeof value !== 'string') return null;
      const parts = value.split(',').map(part => Number(part.trim()));
      if (parts.length !== 2 || !validLatitude(parts[0]) || !validLongitude(parts[1])) return null;
      return { lat: parts[0], lng: parts[1] };
    }

    function normalizePlaceCoordinates(place) {
      const source = place?.coordinates || parseLegacyCoordinateString(place?.coords);
      if (!source || !validLatitude(source.lat) || !validLongitude(source.lng)) return null;
      return { lat: Number(source.lat), lng: Number(source.lng) };
    }

    function placeHasCoordinates(place) {
      return Boolean(
        place?.coordinates
        && validLatitude(place.coordinates.lat)
        && validLongitude(place.coordinates.lng)
      );
    }

    function placeLatLng(place) {
      const coordinates = normalizePlaceCoordinates(place);
      return coordinates ? [coordinates.lat, coordinates.lng] : null;
    }

    function formatPlaceCoordinates(place) {
      const coordinates = normalizePlaceCoordinates(place);
      return coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : 'No coordinates recorded';
    }

    function placeNameParts(place) {
      return String(place?.name || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    }

    function placePrimaryName(place) {
      return placeNameParts(place)[0] || 'Unnamed place';
    }

    function placeSecondaryName(place) {
      return placeNameParts(place).slice(1).join(', ');
    }

    function placeCountry(place) {
      const parts = placeNameParts(place);
      return parts.length > 1 ? parts.at(-1) : 'Other places';
    }

    function placeAlternativeNames(place) {
      return Array.isArray(place?.alternativeNames) ? place.alternativeNames : [];
    }

    function normalizePlaceAlternativeNames(values, canonicalName = '') {
      const canonicalKey = normalizePlaceLookupText(canonicalName);
      const seen = new Set();
      return (Array.isArray(values) ? values : []).map(value => String(value || '').trim()).filter(value => {
        const key = normalizePlaceLookupText(value);
        if (!key || key === canonicalKey || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function placeUpdatedLabel(place) {
      const timestamp = Date.parse(place?.updatedAt || '');
      if (!Number.isFinite(timestamp)) return 'Unknown';
      return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
    }

    function getPlaceDisplay(placeId) {
      return placeId ? getPlace(placeId)?.name || '' : '';
    }

    function placeLinkMatches(link, placeId) {
      if (!link || !placeId) return false;
      return (
        (link.sourceType === 'place' && link.sourceId === placeId)
        || (link.targetType === 'place' && link.targetId === placeId)
        || (link.fromType === 'place' && link.fromId === placeId)
        || (link.toType === 'place' && link.toId === placeId)
      );
    }

    function recordHasPlaceReference(record, placeId) {
      if (!record || !placeId) return false;
      if (record.placeId === placeId || record.birthPlaceId === placeId || record.deathPlaceId === placeId || record.burialPlaceId === placeId) return true;
      if (Array.isArray(record.placeIds) && record.placeIds.includes(placeId)) return true;
      return false;
    }

    function clearStructuredPlaceReferences(record, placeId) {
      if (!record || !placeId) return;
      ['placeId', 'birthPlaceId', 'deathPlaceId', 'burialPlaceId'].forEach(key => {
        if (record[key] === placeId) record[key] = null;
      });
      if (Array.isArray(record.placeIds)) {
        record.placeIds = record.placeIds.filter(id => id !== placeId);
      }
    }

    function getEventsForPlace(placeId, { projectId = currentProjectId() } = {}) {
      return (sampleData.events || []).filter(event =>
        event.projectId === projectId
        && recordHasPlaceReference(event, placeId)
      );
    }

    function getPeopleForPlace(placeId, { projectId = currentProjectId() } = {}) {
      const eventPersonIds = new Set(
        getEventsForPlace(placeId, { projectId }).flatMap(event => event.personIds || [])
      );
      return (sampleData.people || []).filter(person => {
        if (person.projectId !== projectId) return false;
        return eventPersonIds.has(person.id)
          || recordHasPlaceReference(person.birth, placeId)
          || recordHasPlaceReference(person.death, placeId)
          || (person.attributes || []).some(attribute => recordHasPlaceReference(attribute, placeId))
          || (person.events || []).some(event => recordHasPlaceReference(event, placeId));
      });
    }

    function getPhotosForPlace(
      placeId,
      {
        projectId =
          currentProjectId()
      } = {}
    ) {
      return getProjectPhotos(
        projectId
      ).filter(
        photo =>
          photo.placeId === placeId
      );
    }

    function getArchiveFilesForPlace(placeId, { projectId = currentProjectId(), includeDeleted = false } = {}) {
      const linkedFileIds = new Set((sampleData.links || []).filter(link =>
        link.projectId === projectId
        && placeLinkMatches(link, placeId)
      ).flatMap(link => {
        if (link.sourceType === 'archive' || link.sourceType === 'archiveFile') return [link.sourceId];
        if (link.targetType === 'archive' || link.targetType === 'archiveFile') return [link.targetId];
        if (link.fromType === 'archive' || link.fromType === 'archiveFile') return [link.fromId];
        if (link.toType === 'archive' || link.toType === 'archiveFile') return [link.toId];
        return [];
      }));
      return (sampleData.archiveFiles || []).filter(file =>
        file.projectId === projectId
        && (includeDeleted || !file.deleted)
        && (recordHasPlaceReference(file, placeId) || linkedFileIds.has(file.id))
      );
    }

    function getNotesForPlace(
      placeId,
      options = {}
    ) {
      return getNotesForEntity(
        'place',
        placeId,
        options
      );
    }

    function getPlaceConnectionCounts(placeId, { projectId = currentProjectId() } = {}) {
      return {
        people: getPeopleForPlace(placeId, { projectId }).length,
        events: getEventsForPlace(placeId, { projectId }).length,
        files: getArchiveFilesForPlace(placeId, { projectId }).length,
        photos: getPhotosForPlace(placeId, { projectId }).length,
        notes: getNotesForPlace(placeId, { projectId }).length
      };
    }
    function getPlaceEventDisplay(event) {
      const linked = cleanEditFieldValue(getPlaceDisplay(event?.placeId));
      return linked || cleanEditFieldValue(event?.placeText);
    }

    // ---------- Name prefix / suffix (shared) ----------
    const PREFIX_SUGGESTIONS = ['Dr.', 'Prof.', 'Rev.', 'Sir', 'Lady', 'Capt.'];
    const SUFFIX_SUGGESTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'PhD'];

    function normalizeNameSegment(value) {
      return String(value == null ? '' : value).trim();
    }

    function formatPersonFullName(person) {
      const n = person?.names || {};
      return [n.prefix, n.first, n.middle, n.last, n.suffix]
        .map(normalizeNameSegment)
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function formatPersonInitials(person) {
      const n = person?.names || {};
      const f = normalizeNameSegment(n.first);
      const l = normalizeNameSegment(n.last);
      const initials = `${f[0] || ''}${l[0] || ''}`.toUpperCase();
      return initials || (n.initials || '??');
    }

    function rebuildPersonDisplayName(person) {
      if (!person || !person.names) return person;

      person.names.display = formatPersonFullName(person);
      person.names.initials = formatPersonInitials(person);

      return person;
    }

    function collectNameAffixValue(inputEl) {
      if (!inputEl) return '';
      return normalizeNameSegment(inputEl.value);
    }

    function nameAffixSuggestionList(kind) {
      return kind === 'prefix' ? PREFIX_SUGGESTIONS : SUFFIX_SUGGESTIONS;
    }

    function renderNameAffixCombobox({ id, label, value = '', kind = 'prefix', className = 'full', inputAttrs = '' } = {}) {
      const listId = `${id}List`;
      const placeholder = kind === 'prefix' ? 'e.g. Dr., Sir, Lady' : 'e.g. Jr., III, PhD';
      return `<div class="field ${escapeHtml(className)} place-combobox-field name-affix-combobox-field" data-name-affix-combobox data-name-affix-kind="${escapeHtml(kind)}">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <div class="place-combobox-shell">
          <input
            id="${escapeHtml(id)}"
            data-source-value="${escapeHtml(value)}"
            value="${escapeHtml(localizedDataFieldValue(value))}"
            placeholder="${escapeHtml(placeholder)}"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="${escapeHtml(listId)}"
            autocomplete="off"
            data-name-affix-input
            ${inputAttrs}>
          <div class="place-combobox-list" id="${escapeHtml(listId)}" role="listbox" hidden></div>
        </div>
      </div>`;
    }

    function bindNameAffixComboboxes(root = document) {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      root.querySelectorAll('[data-name-affix-combobox]').forEach(field => {
        if (field.dataset.nameAffixBound) return;
        field.dataset.nameAffixBound = 'true';
        const input = field.querySelector('[data-name-affix-input]');
        const list = field.querySelector('.place-combobox-list');
        if (!input || !list) return;
        const kind = field.dataset.nameAffixKind === 'suffix' ? 'suffix' : 'prefix';
        const suggestions = nameAffixSuggestionList(kind);
        let activeIndex = -1;
        let currentOptions = [];

        function buildOptions(query) {
          const q = (query || '').trim().toLowerCase();
          if (!q) return suggestions.slice();
          return suggestions.filter(s => s.toLowerCase().includes(q));
        }

        function renderList() {
          if (!currentOptions.length) {
            list.hidden = true;
            list.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            return;
          }
          list.innerHTML = currentOptions.map((opt, i) => {
            const active = i === activeIndex ? ' active' : '';
            const optId = `${input.id}-opt-${i}`;
            return `<div class="place-combobox-option${active}" role="option" id="${escapeHtml(optId)}" aria-selected="${i === activeIndex ? 'true' : 'false'}" data-name-affix-opt="${i}">
              <div class="place-combobox-copy"><strong>${escapeHtml(opt)}</strong></div>
            </div>`;
          }).join('');
          list.hidden = false;
          input.setAttribute('aria-expanded', 'true');
          if (activeIndex >= 0) {
            input.setAttribute('aria-activedescendant', `${input.id}-opt-${activeIndex}`);
          } else {
            input.removeAttribute('aria-activedescendant');
          }
        }

        function refresh() {
          currentOptions = buildOptions(input.value);
          activeIndex = currentOptions.length ? 0 : -1;
          renderList();
        }

        function close() {
          list.hidden = true;
          list.innerHTML = '';
          input.setAttribute('aria-expanded', 'false');
          input.removeAttribute('aria-activedescendant');
          activeIndex = -1;
          currentOptions = [];
        }

        function chooseOption(value) {
          if (value == null) return;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          close();
        }

        input.addEventListener('focus', refresh);
        input.addEventListener('input', refresh);
        input.addEventListener('keydown', event => {
          if (list.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            refresh();
            event.preventDefault();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!currentOptions.length) return;
            activeIndex = (activeIndex + 1) % currentOptions.length;
            renderList();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!currentOptions.length) return;
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            renderList();
          } else if (event.key === 'Home' && !list.hidden) {
            event.preventDefault();
            activeIndex = 0;
            renderList();
          } else if (event.key === 'End' && !list.hidden) {
            event.preventDefault();
            activeIndex = currentOptions.length - 1;
            renderList();
          } else if (event.key === 'Enter') {
            if (!list.hidden && activeIndex >= 0) {
              event.preventDefault();
              chooseOption(currentOptions[activeIndex]);
            }
          } else if (event.key === 'Escape') {
            if (!list.hidden) {
              event.preventDefault();
              close();
            }
          } else if (event.key === 'Tab') {
            close();
          }
        });
        input.addEventListener('blur', () => setTimeout(close, 120));
        list.addEventListener('mousedown', event => {
          const opt = event.target.closest('[data-name-affix-opt]');
          if (!opt) return;
          event.preventDefault();
          const idx = Number(opt.dataset.nameAffixOpt);
          chooseOption(currentOptions[idx]);
        });
      });
    }
    // ---------- end name affix ----------

    function centralFamilyRecords() {
      sampleData.families = Array.isArray(sampleData.families) ? sampleData.families : [];
      return sampleData.families;
    }

    function familyPartnerAId(family) {
      return family?.partnerAId || family?.partner1Id || family?.personAId || '';
    }

    function familyPartnerBId(family) {
      return family?.partnerBId || family?.partner2Id || family?.personBId || '';
    }

    function familyPartnerRole(family, personId) {
      if (!family || !personId) return '';
      const partnerA = familyPartnerAId(family);
      const partnerB = familyPartnerBId(family);
      const hint = partnerA === personId
        ? family.partnerARoleHint || family.partner1RoleHint || family.personARoleHint || family.husbandRoleHint || ''
        : partnerB === personId
          ? family.partnerBRoleHint || family.partner2RoleHint || family.personBRoleHint || family.wifeRoleHint || ''
          : '';
      const text = String(hint || '').trim().toLowerCase();
      if (['husb', 'husband', 'father', 'male', 'dad'].includes(text)) return 'father';
      if (['wife', 'mother', 'female', 'mom', 'mum'].includes(text)) return 'mother';
      const gender = String(getPerson(personId)?.gender || '').toLowerCase();
      if (gender === 'male') return 'father';
      if (gender === 'female') return 'mother';
      return '';
    }

    function familyFatherId(family) {
      const ids = [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
      return ids.find(id => familyPartnerRole(family, id) === 'father') || '';
    }

    function familyMotherId(family) {
      const ids = [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
      return ids.find(id => familyPartnerRole(family, id) === 'mother') || '';
    }

    function normalizedFamilyPair(family) {
      const rawA = familyPartnerAId(family);
      const rawB = familyPartnerBId(family);
      let fatherId = family.fatherId || family.husbandId || familyFatherId(family);
      let motherId = family.motherId || family.wifeId || familyMotherId(family);
      const ids = [rawA, rawB].filter(Boolean);

      if (!fatherId && !motherId && ids.length === 2) {
        fatherId = ids[0];
        motherId = ids[1];
      } else if (!fatherId && !motherId && ids.length === 1) {
        const role = familyPartnerRole(family, ids[0]);
        if (role === 'mother') motherId = ids[0];
        else fatherId = ids[0];
      }

      return { fatherId: fatherId || '', motherId: motherId || '' };
    }

    function familyPairKey(fatherId = '', motherId = '') {
      return `${fatherId || ''}|${motherId || ''}`;
    }

    function familyIncludesPerson(family, personId) {
      return familyPartnerAId(family) === personId || familyPartnerBId(family) === personId;
    }

    function familyPartnerId(family, personId) {
      return familyPartnerAId(family) === personId ? familyPartnerBId(family) : familyPartnerAId(family);
    }

    const PARENT_CHILD_RELATIONSHIP_TYPES = Object.freeze([
      'Biological',
      'Adoptive',
      'Step',
      'Foster',
      'Guardian'
    ]);

    function normalizeParentChildRelationshipType(
      value
    ) {
      const normalized = String(value || '').trim();

      return PARENT_CHILD_RELATIONSHIP_TYPES.includes(
        normalized
      )
        ? normalized
        : 'Biological';
    }

    function sanitizeParentChildTypes(types) {
      if (
        !types
        || typeof types !== 'object'
        || Array.isArray(types)
      ) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(types)
          .filter(([key]) => Boolean(key))
          .map(([key, value]) => [
            key,
            normalizeParentChildRelationshipType(value)
          ])
      );
    }

      function buildFamiliesFromRelationshipRecords(records = []) {
      const source = Array.isArray(records) ? records : [];
      const familyMap = new Map();
      const pairToFamilyId = new Map();
      const parentChildRecords = source.filter(record => record?.type === 'parentChild');

      const rememberFamily = family => {
        const pair = normalizedFamilyPair(family);
        const normalized = {
          ...family,
          type: 'family',
          fatherId: pair.fatherId,
          motherId: pair.motherId,
          partnerAId: pair.fatherId || '',
          partnerBId: pair.motherId || '',
          partner1Id: pair.fatherId || '',
          partner2Id: pair.motherId || '',
          personAId: pair.fatherId || '',
          personBId: pair.motherId || '',
          partnerARoleHint: pair.fatherId ? 'HUSB' : '',
          partnerBRoleHint: pair.motherId ? 'WIFE' : '',
          childIds: [...new Set([...(family.childIds || []), ...(family.childrenIds || [])].filter(Boolean))],
          events: Array.isArray(family.events) ? family.events : [],
          attributes: Array.isArray(family.attributes) ? family.attributes : [],
          notes: Array.isArray(family.notes) ? family.notes : [],
          citations: Array.isArray(family.citations) ? family.citations : [],
          mediaIds: Array.isArray(family.mediaIds) ? family.mediaIds : [],
          parentChildTypes: sanitizeParentChildTypes(
            family.parentChildTypes
          ),
        };
        normalized.relationshipType = relationshipTypeFromLegacy(normalized);
        normalized.relationshipStatus = normalized.relationshipStatus || 'active';
        normalized.gedcomXref = normalized.gedcomXref || `@F${normalized.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
        const key = familyPairKey(normalized.fatherId, normalized.motherId);
        const existingId = (normalized.fatherId || normalized.motherId) ? pairToFamilyId.get(key) : '';
        if (existingId && existingId !== normalized.id && familyMap.has(existingId)) {
          const existing = familyMap.get(existingId);
          existing.childIds = [...new Set([...(existing.childIds || []), ...(normalized.childIds || [])])];
          existing.events = [...(existing.events || []), ...(normalized.events || [])];
          existing.attributes = [...(existing.attributes || []), ...(normalized.attributes || [])];
          existing.notes = [...(existing.notes || []), ...(normalized.notes || [])];
          existing.citations = [...(existing.citations || []), ...(normalized.citations || [])];
          existing.mediaIds = [...new Set([...(existing.mediaIds || []), ...(normalized.mediaIds || [])])];
          existing.parentChildTypes = {
            ...sanitizeParentChildTypes(
              existing.parentChildTypes
            ),
            ...sanitizeParentChildTypes(
              normalized.parentChildTypes
            )
          };
          return existing;
        }
        familyMap.set(normalized.id, normalized);
        if ((normalized.fatherId || normalized.motherId) && !pairToFamilyId.has(key)) pairToFamilyId.set(key, normalized.id);
        return normalized;
      };

      source.filter(record => isFamilyRelationship(record)).forEach(record => {
        const partnerAId = relationshipPartnerAId(record);
        const partnerBId = relationshipPartnerBId(record);
        const id = record.id || relationshipIdForPartners(partnerAId, partnerBId);
        rememberFamily({ ...record, id, partnerAId, partnerBId, partner1Id: partnerAId, partner2Id: partnerBId, personAId: partnerAId, personBId: partnerBId });
      });

      const parentLinksByChild = new Map();
      parentChildRecords.forEach(link => {
        if (!link.parentId || !link.childId) return;
        if (!parentLinksByChild.has(link.childId)) parentLinksByChild.set(link.childId, { childId: link.childId, projectId: link.projectId, fatherId: '', motherId: '' });
        const group = parentLinksByChild.get(link.childId);
        const role = String(link.parentRole || getPerson(link.parentId)?.gender || '').toLowerCase();
        if (role === 'mother' || role === 'female') group.motherId = link.parentId;
        else group.fatherId = link.parentId;
      });

      const ensureParentFamily = group => {
        const key = familyPairKey(group.fatherId, group.motherId);
        let familyId = pairToFamilyId.get(key);
        if (!familyId) {
          const idBits = [group.fatherId || 'unknown-father', group.motherId || 'unknown-mother', group.childId].join('-');
          familyId = `fam-${idBits}`;
          const family = rememberFamily({
            id: familyId,
            projectId: group.projectId,
            type: 'family',
            fatherId: group.fatherId,
            motherId: group.motherId,
            partnerAId: group.fatherId || '',
            partnerBId: group.motherId || '',
            relationshipType: 'Unknown relationship',
            relationshipStatus: 'active',
            childIds: []
          });
          pairToFamilyId.set(key, family.id);
        }
        const family = familyMap.get(familyId);
        if (family && !family.childIds.includes(group.childId)) family.childIds.push(group.childId);
      };

      parentLinksByChild.forEach(ensureParentFamily);

      const preferredChildFamily = new Map();
      Array.from(familyMap.values()).forEach(family => {
        family.childIds = (family.childIds || []).filter(childId => {
          if (!preferredChildFamily.has(childId)) {
            preferredChildFamily.set(childId, family.id);
            return true;
          }
          return preferredChildFamily.get(childId) === family.id;
        });
      });

      return Array.from(familyMap.values());
    }

    function syncFamilyReciprocalLinks() {
      sampleData.people.forEach(person => {
        person.familyAsSpouseIds = [];
        person.familyAsChildIds = [];
      });
      centralFamilyRecords().forEach(family => {
        [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean).forEach(personId => {
          const person = getPerson(personId);
          if (person && !person.familyAsSpouseIds.includes(family.id)) person.familyAsSpouseIds.push(family.id);
        });
        (family.childIds || []).forEach(personId => {
          const person = getPerson(personId);
          if (person && !person.familyAsChildIds.includes(family.id)) person.familyAsChildIds.push(family.id);
        });
      });
    }

    function uniquePeopleById(people) {
      const seen = new Set();

      return people.filter(person => {
        if (!person?.id || seen.has(person.id)) {
          return false;
        }

        seen.add(person.id);
        return true;
      });
    }

    function getParents(personId) {
      const parents = centralFamilyRecords()
        .filter(family =>
          (family.childIds || []).includes(personId)
        )
        .flatMap(family =>
          [
            familyPartnerAId(family),
            familyPartnerBId(family)
          ]
            .filter(Boolean)
            .map(parentId => {
              const parent = getPerson(parentId);

              if (!parent) return null;

              return {
                ...parent,
                parentRole:
                  familyPartnerRole(family, parentId)
                  || 'parent'
              };
            })
        )
        .filter(Boolean);

      return uniquePeopleById(parents);
    }

    function getChildren(personId) {
      const childIds = new Set(
        centralFamilyRecords()
          .filter(family =>
            familyIncludesPerson(family, personId)
          )
          .flatMap(family => family.childIds || [])
      );

      return [...childIds]
        .map(childId => getPerson(childId))
        .filter(Boolean);
    }

    function isFamilyRelationship(rel) {
      return rel?.type === 'family' || rel?.type === 'partner';
    }

    function relationshipPartnerAId(rel) {
      return rel?.partnerAId || rel?.partner1Id || rel?.personAId || '';
    }

    function relationshipPartnerBId(rel) {
      return rel?.partnerBId || rel?.partner2Id || rel?.personBId || '';
    }

    function relationshipIncludesPerson(rel, personId) {
      return isFamilyRelationship(rel) && (relationshipPartnerAId(rel) === personId || relationshipPartnerBId(rel) === personId);
    }

    function getPartnerRelationships(personId) {
      const id = String(personId || '');

      return centralFamilyRecords()
        .filter(family => {
          if (!familyIncludesPerson(family, id)) return false;

          const partnerId = familyPartnerId(family, id);
          return Boolean(partnerId && getPerson(partnerId));
        });
    }

    function getRelationshipPartnerId(rel, personId) {
      return relationshipPartnerAId(rel) === personId ? relationshipPartnerBId(rel) : relationshipPartnerAId(rel);
    }

    function getRelationshipPartner(rel, personId) {
      return getPerson(getRelationshipPartnerId(rel, personId));
    }

    function getPartners(personId) {
      return getPartnerRelationships(personId)
        .map(rel => getRelationshipPartner(rel, personId))
        .filter(Boolean);
    }

    function genderedPersonRelationship(
      personId,
      {
        male,
        female,
        neutral
      }
    ) {
      const gender =
        String(
          getPerson(personId)?.gender
          || ''
        ).toLowerCase();

      if (gender === 'male') {
        return male;
      }

      if (gender === 'female') {
        return female;
      }

      return neutral;
    }

    function addPersonRelationshipGraphEdge(
      graph,
      fromPersonId,
      edge
    ) {
      if (
        !fromPersonId
        || !edge?.personId
        || fromPersonId === edge.personId
        || !graph.has(fromPersonId)
        || !graph.has(edge.personId)
      ) {
        return;
      }

      const edges =
        graph.get(fromPersonId);

      const duplicate =
        edges.some(existing =>
          existing.personId === edge.personId
          && existing.kind === edge.kind
          && existing.familyId === edge.familyId
        );

      if (!duplicate) {
        edges.push(edge);
      }
    }

    function buildPersonRelationshipGraph(
      projectId
    ) {
      const people =
        getPeople(projectId)
          .filter(person =>
            person?.id
            && !person.deleted
          );

      const graph =
        new Map(
          people.map(person => [
            person.id,
            []
          ])
        );

      centralFamilyRecords()
        .filter(family =>
          family
          && family.relationshipStatus
            !== 'deleted'
          && (
            !projectId
            || !family.projectId
            || family.projectId
              === projectId
          )
        )
        .forEach(family => {
          const firstPartnerId =
            familyPartnerAId(family);

          const secondPartnerId =
            familyPartnerBId(family);

          if (
            firstPartnerId
            && secondPartnerId
          ) {
            addPersonRelationshipGraphEdge(
              graph,
              firstPartnerId,
              {
                personId:
                  secondPartnerId,

                kind:
                  'partner',

                familyId:
                  family.id,

                family
              }
            );

            addPersonRelationshipGraphEdge(
              graph,
              secondPartnerId,
              {
                personId:
                  firstPartnerId,

                kind:
                  'partner',

                familyId:
                  family.id,

                family
              }
            );
          }

          const parentIds =
            [
              firstPartnerId,
              secondPartnerId
            ].filter(Boolean);

          const childIds =
            [
              ...new Set([
                ...(family.childIds || []),
                ...(family.childrenIds || [])
              ])
            ].filter(Boolean);

          childIds.forEach(childId => {
            parentIds.forEach(parentId => {
              const parentRole =
                familyPartnerRole(
                  family,
                  parentId
                )
                || 'parent';

              addPersonRelationshipGraphEdge(
                graph,
                parentId,
                {
                  personId:
                    childId,

                  kind:
                    'child',

                  parentRole,

                  familyId:
                    family.id,

                  family
                }
              );

              addPersonRelationshipGraphEdge(
                graph,
                childId,
                {
                  personId:
                    parentId,

                  kind:
                    'parent',

                  parentRole,

                  familyId:
                    family.id,

                  family
                }
              );
            });
          });
        });

      return graph;
    }

    function partnerRelationshipLabel(
      edge
    ) {
      const family =
        edge?.family;

      const relationshipType =
        relationshipTypeFromLegacy(
          family
        );

      const relationshipStatus =
        String(
          family?.relationshipStatus
          || ''
        ).trim().toLowerCase();

      const formerTypes =
        new Set([
          'Former partner',
          'Separated',
          'Divorced',
          'Annulled'
        ]);

      if (
        relationshipStatus === 'ended'
        || formerTypes.has(
          relationshipType
        )
      ) {
        return 'Former partner';
      }

      if (
        relationshipType === 'Married'
      ) {
        return 'Spouse';
      }

      return 'Partner';
    }

    function ancestorRelationshipLabel(
      personId,
      depth,
      firstParentRole = '',
      {
        inLaw = false
      } = {}
    ) {
      let label = '';

      if (depth === 1) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Father',

              female:
                'Mother',

              neutral:
                'Parent'
            }
          );
      } else if (depth === 2) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Grandfather',

              female:
                'Grandmother',

              neutral:
                'Grandparent'
            }
          );

        if (!inLaw) {
          const side =
            firstParentRole === 'father'
              ? 'Paternal'
              : firstParentRole === 'mother'
                ? 'Maternal'
                : '';

          if (side) {
            label =
              `${side} ${
                label.toLowerCase()
              }`;
          }
        }
      } else if (depth === 3) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Great-grandfather',

              female:
                'Great-grandmother',

              neutral:
                'Great-grandparent'
            }
          );
      } else {
        return 'Distant ancestor';
      }

      return inLaw
        ? `${label}-in-law`
        : label;
    }

    function descendantRelationshipLabel(
      personId,
      depth,
      {
        inLaw = false
      } = {}
    ) {
      if (
        inLaw
        && depth !== 1
      ) {
        return 'Relative';
      }

      let label = '';

      if (depth === 1) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Son',

              female:
                'Daughter',

              neutral:
                'Child'
            }
          );
      } else if (depth === 2) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Grandson',

              female:
                'Granddaughter',

              neutral:
                'Grandchild'
            }
          );
      } else if (depth === 3) {
        label =
          genderedPersonRelationship(
            personId,
            {
              male:
                'Great-grandson',

              female:
                'Great-granddaughter',

              neutral:
                'Great-grandchild'
            }
          );
      } else {
        return 'Distant descendant';
      }

      return inLaw
        ? `${label}-in-law`
        : label;
    }

    function siblingRelationshipLabel(
      personId,
      {
        inLaw = false
      } = {}
    ) {
      const label =
        genderedPersonRelationship(
          personId,
          {
            male:
              'Brother',

            female:
              'Sister',

            neutral:
              'Sibling'
          }
        );

      return inLaw
        ? `${label}-in-law`
        : label;
    }

    function stepParentRelationshipLabel(
      personId
    ) {
      return genderedPersonRelationship(
        personId,
        {
          male:
            'Stepfather',

          female:
            'Stepmother',

          neutral:
            'Stepparent'
        }
      );
    }

    function stepChildRelationshipLabel(
      personId
    ) {
      return genderedPersonRelationship(
        personId,
        {
          male:
            'Stepson',

          female:
            'Stepdaughter',

          neutral:
            'Stepchild'
        }
      );
    }

    function pathHasRelationshipKinds(
      path,
      kinds
    ) {
      return (
        path.length === kinds.length
        && path.every(
          (edge, index) =>
            edge.kind === kinds[index]
        )
      );
    }

    function personRelationshipLabelFromPath(
      personId,
      path
    ) {
      if (!path.length) {
        return 'Self';
      }

      if (
        path.length === 1
        && path[0].kind === 'partner'
      ) {
        return partnerRelationshipLabel(
          path[0]
        );
      }

      if (
        path.every(edge =>
          edge.kind === 'parent'
        )
      ) {
        return ancestorRelationshipLabel(
          personId,
          path.length,
          path[0]?.parentRole || ''
        );
      }

      if (
        path.every(edge =>
          edge.kind === 'child'
        )
      ) {
        return descendantRelationshipLabel(
          personId,
          path.length
        );
      }

      if (
        pathHasRelationshipKinds(
          path,
          [
            'parent',
            'child'
          ]
        )
      ) {
        return siblingRelationshipLabel(
          personId
        );
      }

      /*
      * Ancestor of a partner:
      * partner -> parent -> parent...
      */
      if (
        path[0]?.kind === 'partner'
        && path
          .slice(1)
          .every(edge =>
            edge.kind === 'parent'
          )
      ) {
        const ancestorPath =
          path.slice(1);

        return ancestorRelationshipLabel(
          personId,
          ancestorPath.length,
          ancestorPath[0]
            ?.parentRole
            || '',
          {
            inLaw:
              true
          }
        );
      }

      /*
      * Partner of a child.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'child',
            'partner'
          ]
        )
      ) {
        return descendantRelationshipLabel(
          personId,
          1,
          {
            inLaw:
              true
          }
        );
      }

      /*
      * Partner of a parent.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'parent',
            'partner'
          ]
        )
      ) {
        return stepParentRelationshipLabel(
          personId
        );
      }

      /*
      * Child of a partner.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'partner',
            'child'
          ]
        )
      ) {
        return stepChildRelationshipLabel(
          personId
        );
      }

      /*
      * Partner's sibling or sibling's partner.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'partner',
            'parent',
            'child'
          ]
        )
        || pathHasRelationshipKinds(
          path,
          [
            'parent',
            'child',
            'partner'
          ]
        )
      ) {
        return siblingRelationshipLabel(
          personId,
          {
            inLaw:
              true
          }
        );
      }

      /*
      * Parent's sibling.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'parent',
            'parent',
            'child'
          ]
        )
      ) {
        return genderedPersonRelationship(
          personId,
          {
            male:
              'Uncle',

            female:
              'Aunt',

            neutral:
              "Parent's sibling"
          }
        );
      }

      /*
      * Sibling's child.
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'parent',
            'child',
            'child'
          ]
        )
      ) {
        return genderedPersonRelationship(
          personId,
          {
            male:
              'Nephew',

            female:
              'Niece',

            neutral:
              "Sibling's child"
          }
        );
      }

      /*
      * First cousin:
      * parent -> grandparent ->
      * grandparent's child -> cousin
      */
      if (
        pathHasRelationshipKinds(
          path,
          [
            'parent',
            'parent',
            'child',
            'child'
          ]
        )
      ) {
        return 'First cousin';
      }

      return 'Relative';
    }

    function buildPersonRelationshipLabelMap(
      projectId,
      referencePersonId =
        treeDefaultPersonId(projectId)
    ) {
      const graph =
        buildPersonRelationshipGraph(
          projectId
        );

      const labels =
        new Map(
          [...graph.keys()].map(personId => [
            personId,
            'Relative'
          ])
        );

      if (
        !referencePersonId
        || !graph.has(referencePersonId)
      ) {
        return labels;
      }

      const paths =
        new Map([
          [
            referencePersonId,
            []
          ]
        ]);

      const queue =
        [referencePersonId];

      for (
        let index = 0;
        index < queue.length;
        index += 1
      ) {
        const currentPersonId =
          queue[index];

        const currentPath =
          paths.get(currentPersonId)
          || [];

        (
          graph.get(currentPersonId)
          || []
        ).forEach(edge => {
          if (
            paths.has(edge.personId)
          ) {
            return;
          }

          paths.set(
            edge.personId,
            [
              ...currentPath,
              edge
            ]
          );

          queue.push(edge.personId);
        });
      }

      paths.forEach(
        (path, personId) => {
          labels.set(
            personId,
            personRelationshipLabelFromPath(
              personId,
              path
            )
          );
        }
      );

      return labels;
    }

    function personRelationshipLabel(
      personId,
      referencePersonId = ''
    ) {
      const person =
        getPerson(personId);

      if (!person) {
        return 'Relative';
      }

      const projectId =
        person.projectId
        || currentProjectId();

      const resolvedReferencePersonId =
        referencePersonId
        || treeDefaultPersonId(
          projectId
        );

      return (
        buildPersonRelationshipLabelMap(
          projectId,
          resolvedReferencePersonId
        ).get(personId)
        || 'Relative'
      );
    }

    function relationshipTypeLabel(type) {
      const value = String(type || '').trim();
      return value || 'Partner';
    }

    function relationshipTypeFromLegacy(rel) {
      if (rel?.relationshipType) return rel.relationshipType;
      const label = String(rel?.label || '').toLowerCase();
      if (label.includes('spouse') || label.includes('married')) return 'Married';
      if (label.includes('former')) return 'Former partner';
      return 'Partner';
    }

    function relationshipEventByTag(rel, tag) {
      return (rel?.events || []).find(event => event.gedcomTag === tag) || null;
    }

    function relationshipHasMeaningfulEvent(event) {
      const date = normalizeGenealogyDateInput(event?.date || {}, 'Exact date');
      return Boolean(formatGenealogyDateLabel(date) || cleanDatePlaceId(event?.placeId) || cleanEditFieldValue(event?.placeText));
    }

    function createRelationshipEvent(tag, eventType, values = {}) {
      const date = normalizeGenealogyDateInput(values.date || {}, 'Exact date');
      return {
        id: values.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventType,
        gedcomTag: tag,
        typeLabel: values.typeLabel || '',
        date,
        placeId: cleanDatePlaceId(values.placeId),
        placeText: values.placeText || '',
        sortDate: date.sortDate || '',
        confidence: values.confidence || ''
      };
    }

    function getSiblings(personId) {
      const parentIds = getParents(personId).map(parent => parent.id);
      if (!parentIds.length) return [];
      const siblingIds = new Set();
      parentIds.forEach(parentId => getChildren(parentId).forEach(child => {
        if (child.id !== personId) siblingIds.add(child.id);
      }));
      return Array.from(siblingIds).map(getPerson).filter(Boolean);
    }

    function getEventsForPerson(personId) {
      return sampleData.events.filter(event => event.personIds?.includes(personId));
    }

    const GENEALOGY_DATE_TYPES = ['Exact date', 'Year only', 'About / Circa', 'Before', 'After', 'Between'];
    const GENEALOGY_MONTHS = [
      ['01', 'Jan', 'January', 'янв.', 'январь'],
      ['02', 'Feb', 'February', 'февр.', 'февраль'],
      ['03', 'Mar', 'March', 'мар.', 'март'],
      ['04', 'Apr', 'April', 'апр.', 'апрель'],
      ['05', 'May', 'May', 'май', 'май'],
      ['06', 'Jun', 'June', 'июн.', 'июнь'],
      ['07', 'Jul', 'July', 'июл.', 'июль'],
      ['08', 'Aug', 'August', 'авг.', 'август'],
      ['09', 'Sep', 'September', 'сент.', 'сентябрь'],
      ['10', 'Oct', 'October', 'окт.', 'октябрь'],
      ['11', 'Nov', 'November', 'нояб.', 'ноябрь'],
      ['12', 'Dec', 'December', 'дек.', 'декабрь']
    ];
    const GENEALOGY_CALENDARS = ['Gregorian', 'Julian'];
    let genealogyDatePopover = null;
    let genealogyDateOutsideHandler = null;
    let genealogyDateKeyHandler = null;

    function genealogyDateTypeOptions(
      selected = 'Exact date'
    ) {
      const active =
        normalizeGenealogyDateType(
          selected
        );

      return GENEALOGY_DATE_TYPES
        .map(type => `
          <option
            value="${escapeHtml(type)}"
            ${
              type === active
                ? 'selected'
                : ''
            }>
            ${escapeHtml(t(type))}
          </option>
        `)
        .join('');
    }

    function genealogyMonthOptions(selected = '') {
      const active = String(selected || '').padStart(2, '0');
      return `<option value="">${t('Month')}</option>${GENEALOGY_MONTHS.map(([value, short, long, shortRu, longRu]) => `<option value="${value}" ${value === active ? 'selected' : ''}>${state.language === 'ru' ? `${shortRu} - ${longRu}` : `${short} - ${long}`}</option>`).join('')}`;
    }

    function normalizeGenealogyDateType(type) {
      const text = String(type || '').trim().toLowerCase();
      const aliases = {
        exact: 'Exact date',
        'exact date': 'Exact date',
        year: 'Year only',
        'year only': 'Year only',
        about: 'About / Circa',
        circa: 'About / Circa',
        'about / circa': 'About / Circa',
        before: 'Before',
        after: 'After',
        between: 'Between',
      };
      return aliases[text] || (GENEALOGY_DATE_TYPES.includes(type) ? type : 'Exact date');
    }

    function cleanGenealogyDateText(value) {
      const text = String(value ?? '').trim();
      if (!text) return '';
      const lowered = text.toLowerCase();
      if (['-', '--', '—', 'unknown', 'null', 'undefined', 'not applicable', 'n/a'].includes(lowered)) return '';
      if (text === 'вЂ”') return '';
      return text;
    }

    function cleanDatePlaceId(placeId) {
      const text = String(placeId ?? '').trim();
      return !text || text === 'null' || text === '-' || text === '—' ? null : text;
    }

    function emptyGenealogyDate(dateType = 'Exact date') {
      return {
        date: '',
        dateLabel: '',
        dateType: normalizeGenealogyDateType(dateType),
        sortDate: '',
        calendar: 'Gregorian',
        originalText: '',
        date2: '',
        date2Label: '',
        sortDate2: ''
      };
    }

    function monthByName(value) {
      const text = String(value || '').trim().toLowerCase().replace(/\.$/, '');
      const match = GENEALOGY_MONTHS.find(([, short, long, shortRu, longRu]) => [short, long, shortRu, longRu].some(name => String(name).toLowerCase().replace(/\.$/, '') === text));
      return match?.[0] || '';
    }

    function monthShort(value) {
      const match = GENEALOGY_MONTHS.find(([number]) => number === String(value || '').padStart(2, '0'));
      return match?.[1] || '';
    }

    function isValidGregorianDate(year, month, day) {
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);
      if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
      if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false;
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
    }

    function sortDateFromParts(year, month = '00', day = '00') {
      const y = String(year || '').padStart(4, '0');
      if (!/^\d{4}$/.test(y) || Number(y) <= 0) return '';
      const m = String(month || '00').padStart(2, '0');
      const d = String(day || '00').padStart(2, '0');
      return `${y}${m}${d}`;
    }

    function dateLabelFromParts(year, month = '', day = '') {
      const y = String(year || '').trim();
      const rawMonth = String(month || '').trim();
      const rawDay = String(day || '').trim();

      const m = rawMonth ? rawMonth.padStart(2, '0') : '';
      const d = rawDay ? rawDay.padStart(2, '0') : '';

      if (d && m && y) return `${d} ${monthShort(m)} ${y}`;
      if (m && y) return `${monthShort(m)} ${y}`;
      return y;
    }

    function dateValueFromParts(year, month = '', day = '') {
      const y = String(year || '').trim();
      const rawMonth = String(month || '').trim();
      const rawDay = String(day || '').trim();

      const m = rawMonth ? rawMonth.padStart(2, '0') : '';
      const d = rawDay ? rawDay.padStart(2, '0') : '';

      if (d && m && y) return `${d}.${m}.${y}`;
      if (m && y) return `${m}.${y}`;
      return y;
    }

    function parseBaseGenealogyDate(text) {
      const raw = cleanGenealogyDateText(text);
      if (!raw) return null;

      let match = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
      if (match) {
        const [, dayRaw, monthRaw, year] = match;
        const day = dayRaw.padStart(2, '0');
        const month = monthRaw.padStart(2, '0');
        if (!isValidGregorianDate(year, month, day)) return { invalid: true, message: 'Enter a valid calendar date.' };
        return { precision: 'day', year, month, day, date: dateValueFromParts(year, month, day), dateLabel: dateLabelFromParts(year, month, day), sortDate: sortDateFromParts(year, month, day) };
      }

      match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        const [, year, monthRaw, dayRaw] = match;
        const month = monthRaw.padStart(2, '0');
        const day = dayRaw.padStart(2, '0');
        if (!isValidGregorianDate(year, month, day)) return { invalid: true, message: 'Enter a valid calendar date.' };
        return { precision: 'day', year, month, day, date: dateValueFromParts(year, month, day), dateLabel: dateLabelFromParts(year, month, day), sortDate: sortDateFromParts(year, month, day) };
      }

      match = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
      if (match) {
        const [, dayRaw, monthName, year] = match;
        const day = dayRaw.padStart(2, '0');
        const month = monthByName(monthName);
        if (!month || !isValidGregorianDate(year, month, day)) return { invalid: true, message: 'Enter a valid calendar date.' };
        return { precision: 'day', year, month, day, date: dateValueFromParts(year, month, day), dateLabel: dateLabelFromParts(year, month, day), sortDate: sortDateFromParts(year, month, day) };
      }

      match = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
      if (match) {
        const [, monthName, year] = match;
        const month = monthByName(monthName);
        if (!month) return null;
        return { precision: 'month', year, month, day: '', date: dateValueFromParts(year, month), dateLabel: dateLabelFromParts(year, month), sortDate: sortDateFromParts(year, month) };
      }

      match = raw.match(/^(\d{4})$/);
      if (match) {
        const year = match[1];
        return { precision: 'year', year, month: '', day: '', date: year, dateLabel: year, sortDate: sortDateFromParts(year) };
      }

      return null;
    }

    function genealogyDateFromBase(base, type, originalText = '', calendar = 'Gregorian', secondBase = null) {
      if (!base || base.invalid) return { valid: false, message: base?.message || 'Enter a supported genealogy date.' };
      const normalizedType = normalizeGenealogyDateType(type);
      const prefixMap = {
        'About / Circa': 'About',
        Before: 'Before',
        After: 'After'
      };
      if (normalizedType === 'Exact date' && !['day', 'month'].includes(base.precision)) {
        return { valid: false, message: 'Exact dates need at least a month and year. Use Year only for year-only dates.' };
      }
      if (normalizedType === 'Year only' && base.precision !== 'year') return { valid: false, message: 'Year only dates should contain only a year.' };

      const value = {
        ...emptyGenealogyDate(normalizedType),
        date: base.date,
        dateLabel: prefixMap[normalizedType] ? `${prefixMap[normalizedType]} ${base.dateLabel}` : base.dateLabel,
        sortDate: base.sortDate,
        calendar: GENEALOGY_CALENDARS.includes(calendar) ? calendar : 'Gregorian',
        originalText: cleanGenealogyDateText(originalText) || base.dateLabel
      };

      if (normalizedType === 'Between') {
        if (!secondBase || secondBase.invalid) return { valid: false, message: 'Between dates need a valid second date.' };
        if (Number(secondBase.sortDate || 0) < Number(base.sortDate || 0)) return { valid: false, message: 'The second date must be after or equal to the first date.' };
        value.date2 = secondBase.date;
        value.date2Label = secondBase.dateLabel;
        value.sortDate2 = secondBase.sortDate;
        value.dateLabel = `Between ${base.dateLabel} and ${secondBase.dateLabel}`;
      }

      return { valid: true, value };
    }

    function parseGenealogyDateTextAsType(text, type, options = {}) {
      const normalizedType = normalizeGenealogyDateType(type);
      const raw = cleanGenealogyDateText(text);
      const calendar = options.calendar || 'Gregorian';
      if (!raw) {
        return { valid: true, value: emptyGenealogyDate(normalizedType) };
      }

      if (normalizedType === 'Between') {
        const between = raw.match(/^between\s+(.+?)\s+and\s+(.+)$/i);
        const firstText = between ? between[1] : raw;
        const secondText = between ? between[2] : options.date2 || options.date2Label || '';
        return genealogyDateFromBase(parseBaseGenealogyDate(firstText), normalizedType, raw, calendar, parseBaseGenealogyDate(secondText));
      }

      const prefixPattern = /^(about|circa|ca\.?|before|after)\s+/i;
      const baseText = raw.replace(prefixPattern, '');
      return genealogyDateFromBase(parseBaseGenealogyDate(baseText), normalizedType, raw, calendar);
    }

    function parseGenealogyDateText(text) {
      const raw = cleanGenealogyDateText(text);
      if (!raw) return { valid: true, value: emptyGenealogyDate('Exact date') };
      if (/^(unknown|not applicable|n\/a)$/i.test(raw)) return { valid: false, message: 'Enter a date.' };
      if (/^between\s+/i.test(raw)) return parseGenealogyDateTextAsType(raw, 'Between');
      if (/^(about|circa|ca\.?)\s+/i.test(raw)) return parseGenealogyDateTextAsType(raw, 'About / Circa');
      if (/^before\s+/i.test(raw)) return parseGenealogyDateTextAsType(raw, 'Before');
      if (/^after\s+/i.test(raw)) return parseGenealogyDateTextAsType(raw, 'After');

      const base = parseBaseGenealogyDate(raw);
      if (!base || base.invalid) return { valid: false, message: base?.message || 'Enter a supported genealogy date.' };
      const type = base.precision === 'year' ? 'Year only' : 'Exact date';
      return genealogyDateFromBase(base, type, raw);
    }

    function buildGenealogyDateFromParts(type, parts = {}) {
      const normalizedType = normalizeGenealogyDateType(type);
      const firstYear = String(parts.year || '').trim();
      const firstMonth = String(parts.month || '').trim();
      const firstDay = String(parts.day || '').trim();
      const firstText = firstDay && firstMonth && firstYear
        ? dateValueFromParts(firstYear, firstMonth, firstDay)
        : firstMonth && firstYear
          ? dateLabelFromParts(firstYear, firstMonth)
          : firstYear;
      const secondYear = String(parts.year2 || '').trim();
      const secondMonth = String(parts.month2 || '').trim();
      const secondDay = String(parts.day2 || '').trim();
      const secondText = secondDay && secondMonth && secondYear
        ? dateValueFromParts(secondYear, secondMonth, secondDay)
        : secondMonth && secondYear
          ? dateLabelFromParts(secondYear, secondMonth)
          : secondYear;
      return parseGenealogyDateTextAsType(firstText, normalizedType, {
        calendar: parts.calendar,
        date2: secondText,
        date2Label: secondText
      });
    }

    function normalizeGenealogyDateInput(input, fallbackType = 'Exact date') {
      if (!input) return emptyGenealogyDate(fallbackType);
      if (typeof input === 'string') {
        const parsed = parseGenealogyDateText(input);
        return parsed.valid ? parsed.value : { ...emptyGenealogyDate(fallbackType), originalText: cleanGenealogyDateText(input) };
      }
      const explicitType = normalizeGenealogyDateType(input.dateType || fallbackType);
      const text = cleanGenealogyDateText(input.originalText || input.dateLabel || input.date);
      if (!text) {
        return {
          ...emptyGenealogyDate(explicitType),
          calendar: GENEALOGY_CALENDARS.includes(input.calendar) ? input.calendar : 'Gregorian',
          placeId: cleanDatePlaceId(input.placeId),
          reason: input.reason || '',
          burialPlaceId: cleanDatePlaceId(input.burialPlaceId)
        };
      }
      const parsed = parseGenealogyDateTextAsType(text, explicitType, {
        calendar: input.calendar,
        date2: input.date2 || input.date2Label
      });
      const value = parsed.valid ? parsed.value : emptyGenealogyDate(explicitType);
      return {
        ...value,
        date: cleanGenealogyDateText(value.date || input.date),
        dateLabel: cleanGenealogyDateText(value.dateLabel || input.dateLabel),
        sortDate: value.sortDate || input.sortDate || '',
        calendar: GENEALOGY_CALENDARS.includes(input.calendar) ? input.calendar : (value.calendar || 'Gregorian'),
        originalText: cleanGenealogyDateText(input.originalText || text),
        date2: cleanGenealogyDateText(value.date2 || input.date2),
        date2Label: cleanGenealogyDateText(value.date2Label || input.date2Label),
        sortDate2: value.sortDate2 || input.sortDate2 || '',
        placeId: cleanDatePlaceId(input.placeId),
        reason: input.reason || '',
        burialPlaceId: cleanDatePlaceId(input.burialPlaceId)
      };
    }

    function formatGenealogyDateLabel(input) {
      const value = normalizeGenealogyDateInput(input);
      return cleanGenealogyDateText(value.dateLabel || value.date || value.originalText);
    }

    function formatGenealogyDateStartLabel(input) {
      const value =
        normalizeGenealogyDateInput(input);
      const base =
        parseBaseGenealogyDate(
          value.date || ''
        );
      return cleanGenealogyDateText(
        base?.dateLabel
        || value.date
        || ''
      );
    }

    function formatGenealogyDateEndLabel(input) {
      const value = normalizeGenealogyDateInput(input);
      const base = parseBaseGenealogyDate(value.date2Label || value.date2 || '');
      return cleanGenealogyDateText(base?.dateLabel || value.date2Label || value.date2 || '');
    }

    function genealogyDatePartsFromModel(model = {}) {
      const value = normalizeGenealogyDateInput(model);
      const firstSource = value.dateType === 'Between'
        ? value.date || value.originalText || value.dateLabel
        : value.dateLabel || value.date || value.originalText;
      const secondSource = value.dateType === 'Between'
        ? value.date2 || value.date2Label
        : value.date2Label || value.date2 || '';
      const first = parseBaseGenealogyDate(firstSource || '') || {};
      const second = parseBaseGenealogyDate(secondSource || '') || {};
      return {
        day: first.day || '',
        month: first.month || '',
        year: first.year || '',
        day2: second.day || '',
        month2: second.month || '',
        year2: second.year || ''
      };
    }

    function renderGenealogyDateField(
      fieldId,
      label,
      dateInput,
      options = {}
    ) {
      const defaultDateType =
        options.defaultDateType
        || options.defaultType
        || 'Exact date';

      const exactOnly =
        Boolean(
          options.exactOnly
        );

      const initialModel =
        normalizeGenealogyDateInput(
          dateInput
          || emptyGenealogyDate(
            defaultDateType
          ),
          defaultDateType
        );

      const model =
        exactOnly
          ? {
              ...initialModel,

              dateType:
                'Exact date',

              calendar:
                'Gregorian',

              date2:
                '',

              date2Label:
                '',

              sortDate2:
                ''
            }
          : initialModel;

      const inputId =
        options.inputId
        || `${fieldId}Date`;

      const typeId =
        options.typeId
        || `${fieldId}DateType`;

      const inputToId =
        options.inputToId
        || `${inputId}To`;

      const placeholder =
        options.placeholder
        || 'e.g. 14 Feb 1915';

      const fieldClass =
        options.className
        || '';

      const isBetween =
        !exactOnly
        && model.dateType
          === 'Between';

      const hiddenValue =
        escapeHtml(
          JSON.stringify(
            model
          )
        );

      const startValue =
        formatGenealogyDateStartLabel(
          model
        );

      const endValue =
        formatGenealogyDateEndLabel(
          model
        );

      return `
        <div
          class="
            field
            genealogy-date-field
            ${isBetween ? 'is-between' : ''}
            ${exactOnly ? 'is-exact-only' : ''}
            ${escapeHtml(fieldClass)}
          "
          data-genealogy-date-field="${escapeHtml(
            fieldId
          )}"
          data-genealogy-date-exact-only="${
            exactOnly
              ? 'true'
              : 'false'
          }">

          <label for="${escapeHtml(inputId)}">
            ${escapeHtml(label)}
          </label>

          <div class="genealogy-date-controls">
            <div
              class="
                common-select-shell
                genealogy-date-type-shell
              ">

              <select
                class="
                  compact-select
                  common-select
                  genealogy-date-type
                "
                id="${escapeHtml(typeId)}"
                data-genealogy-date-type>

                ${genealogyDateTypeOptions(
                  model.dateType
                )}
              </select>

              <span
                class="common-select-chevron"
                aria-hidden="true">

                ${icon.chevron}
              </span>
            </div>

            <div
              class="genealogy-date-range-shell"
              data-genealogy-date-range-shell>

              <div class="genealogy-date-range-cell">
                <span>From</span>

                <input
                  class="genealogy-date-input"
                  id="${escapeHtml(inputId)}"
                  data-genealogy-date-input
                  data-source-value="${escapeHtml(
                    startValue
                  )}"
                  value="${escapeHtml(
                    localizedDataFieldValue(
                      startValue
                    )
                  )}"
                  placeholder="${escapeHtml(
                    placeholder
                  )}">
              </div>

              <div
                class="genealogy-date-range-cell"
                data-genealogy-date-to-cell>

                <span>To</span>

                <input
                  class="genealogy-date-input"
                  id="${escapeHtml(inputToId)}"
                  data-genealogy-date-input-to
                  data-source-value="${escapeHtml(
                    endValue
                  )}"
                  value="${escapeHtml(
                    localizedDataFieldValue(
                      endValue
                    )
                  )}"
                  placeholder="e.g. 14 Feb 1925">
              </div>
            </div>

            <button
              class="genealogy-date-details-button"
              type="button"
              data-genealogy-date-details="${escapeHtml(
                fieldId
              )}"
              aria-label="Edit ${escapeHtml(
                label
              )} details"
              aria-expanded="false">

              ${icon.calendar}
            </button>
          </div>

          <input
            type="hidden"
            data-genealogy-date-model
            value="${hiddenValue}">

          <div
            class="genealogy-date-standard-status"
            data-genealogy-date-status>

            ${
              model.calendar === 'Julian'
                ? 'Julian calendar stored; conversion is not implemented.'
                : ''
            }
          </div>

          <div
            class="genealogy-date-validation"
            data-genealogy-date-validation>
          </div>
        </div>
      `;
    }

    function readGenealogyDateModel(fieldRoot) {
      try {
        return JSON.parse(fieldRoot?.querySelector('[data-genealogy-date-model]')?.value || '{}');
      } catch {
        return emptyGenealogyDate();
      }
    }

    function setGenealogyDateFieldError(
      fieldRoot,
      message = ''
    ) {
      if (!fieldRoot) return;

      fieldRoot.classList.toggle(
        'has-error',
        Boolean(message)
      );

      const validation =
        fieldRoot.querySelector(
          '[data-genealogy-date-validation]'
        );

      if (validation) {
        validation.textContent =
          message
            ? t(message)
            : '';
      }
    }

    function collectGenealogyDateField(fieldId, options = {}) {
      const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
      if (!root) return emptyGenealogyDate();
      const model = readGenealogyDateModel(root);
      const type = root.querySelector('[data-genealogy-date-type]')?.value || model.dateType || 'Unknown';
      const input = root.querySelector('[data-genealogy-date-input]');
      const inputTo = root.querySelector('[data-genealogy-date-input-to]');
      const text = collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '');
      const text2 = collectLocalizedDataFieldValue(inputTo, inputTo?.dataset.sourceValue || '');
      const parsed = parseGenealogyDateTextAsType(text, type, {
        calendar: model.calendar,
        date2: type === 'Between' ? text2 : model.date2 || model.date2Label,
        date2Label: type === 'Between' ? text2 : model.date2 || model.date2Label
      });
      if (!parsed.valid) {
        setGenealogyDateFieldError(root, parsed.message);
        return options.allowInvalid ? { ...emptyGenealogyDate(type), invalid: true, message: parsed.message } : null;
      }
      const value = {
        ...parsed.value,
        placeId: cleanDatePlaceId(model.placeId),
        reason: model.reason || '',
        burialPlaceId: cleanDatePlaceId(model.burialPlaceId)
      };
      applyGenealogyDateToField(fieldId, value, { silent: true });
      return value;
    }

    function applyGenealogyDateToField(fieldId, dateInput, options = {}) {
      const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
      if (!root) return;
      const value = normalizeGenealogyDateInput(dateInput);
      const input = root.querySelector('[data-genealogy-date-input]');
      const inputTo = root.querySelector('[data-genealogy-date-input-to]');
      const type = root.querySelector('[data-genealogy-date-type]');
      const model = root.querySelector('[data-genealogy-date-model]');
      const status = root.querySelector('[data-genealogy-date-status]');
      const rangeShell = root.querySelector('[data-genealogy-date-range-shell]');
      if (type) type.value = value.dateType;
      if (input) {
        const source = formatGenealogyDateStartLabel(value);
        input.dataset.sourceValue = source;
        input.value = localizedDataFieldValue(source);
      }
      if (inputTo) {
        const source = value.dateType === 'Between' ? formatGenealogyDateEndLabel(value) : '';
        inputTo.dataset.sourceValue = source;
        inputTo.value = localizedDataFieldValue(source);
      }
      if (rangeShell) rangeShell.classList.toggle('is-between', value.dateType === 'Between');
      const controls = root.querySelector('.genealogy-date-controls');
      root.classList.toggle('is-between', value.dateType === 'Between');
      if (controls) controls.classList.toggle('is-between', value.dateType === 'Between');
      if (model) model.value = JSON.stringify(value);
      if (status) {
        status.textContent =
          value.calendar === 'Julian'
            ? t(
                'Julian calendar stored; conversion is not implemented.'
              )
            : '';
      }
      if (!options.keepError) setGenealogyDateFieldError(root, '');
    }

    function closeGenealogyDateEditor() {
      if (genealogyDatePopover) genealogyDatePopover.remove();
      genealogyDatePopover = null;
      document.querySelectorAll('[data-genealogy-date-details][aria-expanded="true"]').forEach(button => button.setAttribute('aria-expanded', 'false'));
      if (genealogyDateOutsideHandler) document.removeEventListener('click', genealogyDateOutsideHandler);
      if (genealogyDateKeyHandler) document.removeEventListener('keydown', genealogyDateKeyHandler);
      genealogyDateOutsideHandler = null;
      genealogyDateKeyHandler = null;
    }

    function updateGenealogyDateEditorVisibility(popover) {
      const type = normalizeGenealogyDateType(popover.querySelector('[data-editor-type]')?.value);
      const needsDateParts = type === 'Exact date'
        || type === 'About / Circa'
        || type === 'Before'
        || type === 'After'
        || type === 'Between';

      const needsDay = needsDateParts;
      const needsMonth = needsDateParts;
      const firstRow = popover.querySelector('[data-editor-first-date-row]');
      if (firstRow) firstRow.hidden = false;
      popover.querySelectorAll('[data-editor-day-field]').forEach(field => { field.hidden = !needsDay; });
      popover.querySelectorAll('[data-editor-month-field]').forEach(field => { field.hidden = !needsMonth; });
      const second = popover.querySelector('.genealogy-date-second-date');
      if (second) second.hidden = type !== 'Between';
      const note = popover.querySelector('[data-editor-note]');
      if (note) {
        note.textContent = t(
          'Julian calendar can be stored; conversion is not implemented in this prototype.'
        );
      }
    }

    function openGenealogyDateEditor(anchor, fieldId) {
      const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
      if (!root) return;
      const exactOnly =
        root.dataset
          .genealogyDateExactOnly
          === 'true';
      closeGenealogyDateEditor();
      anchor?.setAttribute('aria-expanded', 'true');
      const existingModel = readGenealogyDateModel(root);
      const liveType = root.querySelector('[data-genealogy-date-type]')?.value || existingModel.dateType;
      const liveInput = root.querySelector('[data-genealogy-date-input]');
      const liveInputTo = root.querySelector('[data-genealogy-date-input-to]');
      const liveText = collectLocalizedDataFieldValue(liveInput, liveInput?.dataset.sourceValue || '');
      const liveText2 = collectLocalizedDataFieldValue(liveInputTo, liveInputTo?.dataset.sourceValue || '');
      const normalizedLiveType = normalizeGenealogyDateType(liveType);
      const liveParsed = (liveText || (normalizedLiveType === 'Between' && liveText2))
        ? parseGenealogyDateTextAsType(liveText, normalizedLiveType, {
          calendar: existingModel.calendar,
          date2: normalizedLiveType === 'Between' ? liveText2 : existingModel.date2 || existingModel.date2Label,
          date2Label: normalizedLiveType === 'Between' ? liveText2 : existingModel.date2 || existingModel.date2Label
        })
        : null;
      const model = liveParsed?.valid
        ? { ...liveParsed.value, placeId: existingModel.placeId, reason: existingModel.reason || '', burialPlaceId: existingModel.burialPlaceId }
        : {
          ...existingModel,
          dateType: normalizedLiveType,
          date: normalizedLiveType === 'Between' && liveText ? liveText : existingModel.date,
          dateLabel: normalizedLiveType === 'Between' && liveText ? liveText : existingModel.dateLabel,
          date2: normalizedLiveType === 'Between' && liveText2 ? liveText2 : existingModel.date2,
          date2Label: normalizedLiveType === 'Between' && liveText2 ? liveText2 : existingModel.date2Label
        };
      const parts = genealogyDatePartsFromModel(model);
      const popover = document.createElement('div');
      popover.className = 'genealogy-date-popover';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-label', 'Genealogy date details');
      popover.innerHTML = `<div class="genealogy-date-popover-header"><div><strong>Date details</strong></div><button class="close-button" type="button" data-genealogy-date-close aria-label="Close date details">${icon.close}</button></div>
        <div class="genealogy-date-editor-grid">
          <div class="genealogy-date-part-field full"><label>Smart date</label><input data-editor-smart value="${escapeHtml(formatGenealogyDateLabel(model) || model.originalText || '')}" placeholder="e.g. 14 Feb 1915"></div>
          <div
            class="genealogy-date-part-field"
            ${exactOnly ? 'hidden' : ''}>

            <label>Date type</label>

            <select
              class="compact-select"
              data-editor-type>

              ${genealogyDateTypeOptions(
                exactOnly
                  ? 'Exact date'
                  : model.dateType
              )}
            </select>
          </div>
          <div
            class="genealogy-date-part-field"
            ${exactOnly ? 'hidden' : ''}>

            <label>Calendar</label>

            <select
              class="compact-select"
              data-editor-calendar>

              ${GENEALOGY_CALENDARS
                .map(calendar => `
                  <option
                    value="${escapeHtml(calendar)}"
                    ${
                      calendar
                        === (
                          model.calendar
                          || 'Gregorian'
                        )
                          ? 'selected'
                          : ''
                    }>
                    ${escapeHtml(t(calendar))}
                  </option>
                `)
                .join('')}
            </select>
          </div>
          <div class="genealogy-date-parts-row full" data-editor-first-date-row>
            <div class="genealogy-date-part-field" data-editor-day-field><label>Day</label><input data-editor-day inputmode="numeric" value="${escapeHtml(parts.day)}" placeholder="DD"></div>
            <div class="genealogy-date-part-field" data-editor-month-field><label>Month</label><select data-editor-month>${genealogyMonthOptions(parts.month)}</select></div>
            <div class="genealogy-date-part-field"><label>Year</label><input data-editor-year inputmode="numeric" value="${escapeHtml(parts.year)}" placeholder="YYYY"></div>
          </div>
          <div class="genealogy-date-second-date full" hidden>
            <div class="genealogy-date-parts-row">
              <div class="genealogy-date-part-field" data-editor-day-field><label>Second day</label><input data-editor-day2 inputmode="numeric" value="${escapeHtml(parts.day2)}" placeholder="DD"></div>
              <div class="genealogy-date-part-field" data-editor-month-field><label>Second month</label><select data-editor-month2>${genealogyMonthOptions(parts.month2)}</select></div>
              <div class="genealogy-date-part-field"><label>Second year</label><input data-editor-year2 inputmode="numeric" value="${escapeHtml(parts.year2)}" placeholder="YYYY"></div>
            </div>
          </div>
          <div
            class="genealogy-date-editor-note full"
            data-editor-note
            ${exactOnly ? 'hidden' : ''}>

            Julian calendar can be stored; conversion is not implemented in this prototype.
          </div>
          <div class="genealogy-date-validation full" data-editor-validation></div>
        </div>
        <div class="genealogy-date-actions"><button class="button secondary" type="button" data-genealogy-date-close>Cancel</button><button class="button primary" type="button" data-genealogy-date-apply>Apply</button></div>`;
      document.body.appendChild(popover);
      genealogyDatePopover = popover;

      updateGenealogyDateEditorVisibility(
        popover
      );

      localizeUI(
        popover,
        {
          suppressObserverReplay: true
        }
      );

      popover
        .querySelector(
          '[data-editor-type]'
        )
        ?.addEventListener(
          'change',
          () =>
            updateGenealogyDateEditorVisibility(
              popover
            )
        );
      popover.querySelectorAll('[data-genealogy-date-close]').forEach(button => button.addEventListener('click', closeGenealogyDateEditor));
      popover.querySelector('[data-genealogy-date-apply]')?.addEventListener('click', () => {
        const type = popover.querySelector('[data-editor-type]')?.value || 'Unknown';
        const calendar = popover.querySelector('[data-editor-calendar]')?.value || 'Gregorian';
        const partsValue = {
          calendar,
          day: popover.querySelector('[data-editor-day]')?.value.trim(),
          month: popover.querySelector('[data-editor-month]')?.value,
          year: popover.querySelector('[data-editor-year]')?.value.trim(),
          day2: popover.querySelector('[data-editor-day2]')?.value.trim(),
          month2: popover.querySelector('[data-editor-month2]')?.value,
          year2: popover.querySelector('[data-editor-year2]')?.value.trim()
        };
        const hasStructured = partsValue.year || partsValue.month || partsValue.day || partsValue.year2 || partsValue.month2 || partsValue.day2;
        const smart = popover.querySelector('[data-editor-smart]')?.value || '';
        const parsed = hasStructured
          ? buildGenealogyDateFromParts(type, partsValue)
          : parseGenealogyDateTextAsType(smart, type, { calendar });
        if (!parsed.valid) {
          const validation = popover.querySelector('[data-editor-validation]');
          if (validation) {
            validation.textContent = t(parsed.message);
            validation.style.display = 'block';
          }
          return;
        }
        applyGenealogyDateToField(fieldId, { ...parsed.value, calendar });
        closeGenealogyDateEditor();
      });
      genealogyDateOutsideHandler = event => {
        if (popover.contains(event.target) || anchor.contains(event.target)) return;
        closeGenealogyDateEditor();
      };
      genealogyDateKeyHandler = event => {
        if (event.key === 'Escape') closeGenealogyDateEditor();
      };
      setTimeout(() => document.addEventListener('click', genealogyDateOutsideHandler), 0);
      document.addEventListener('keydown', genealogyDateKeyHandler);
      popover.querySelector('[data-editor-smart]')?.focus({ preventScroll: true });
    }

    function setPlaceAddressDisclosureState(
      field,
      expanded,
      {
        clear = false,
        focus = false
      } = {}
    ) {
      const disclosure =
        field?.querySelector(
          '[data-place-address-disclosure]'
        );

      const toggle =
        disclosure?.querySelector(
          '[data-place-address-toggle]'
        );

      const toggleLabel =
        disclosure?.querySelector(
          '[data-place-address-toggle-label]'
        );

      const addressFields =
        disclosure?.querySelector(
          '[data-place-address-fields]'
        );

      const addressInput =
        disclosure?.querySelector(
          '[data-place-address]'
        );

      if (
        !disclosure
        || !toggle
        || !addressFields
      ) {
        return;
      }

      const isExpanded =
        Boolean(expanded);

      if (
        clear
        && addressInput
      ) {
        addressInput.value = '';
        addressInput.dataset.sourceValue = '';

        addressInput.dispatchEvent(
          new Event(
            'input',
            {
              bubbles: true
            }
          )
        );

        addressInput.dispatchEvent(
          new Event(
            'change',
            {
              bubbles: true
            }
          )
        );
      }

      disclosure.classList.toggle(
        'has-address',
        isExpanded
      );

      toggle.classList.toggle(
        'is-remove',
        isExpanded
      );

      toggle.setAttribute(
        'aria-expanded',
        isExpanded
          ? 'true'
          : 'false'
      );

      addressFields.hidden =
        !isExpanded;

      if (toggleLabel) {
        toggleLabel.textContent =
          t(
            isExpanded
              ? '- Remove address'
              : '+ Add address'
          );
      }

      if (
        isExpanded
        && focus
        && addressInput
      ) {
        requestAnimationFrame(
          () => {
            addressInput.focus({
              preventScroll: true
            });
          }
        );
      }
    }

    function bindPlaceComboboxes(root = document) {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      const fields = root.querySelectorAll('[data-place-combobox]');
      fields.forEach(field => {
        if (field.dataset.placeBound) return;

        field.dataset.placeBound = 'true';

        const addressToggle =
          field.querySelector(
            '[data-place-address-toggle]'
          );

        const addressFields =
          field.querySelector(
            '[data-place-address-fields]'
          );

        if (
          addressToggle
          && addressFields
        ) {
          setPlaceAddressDisclosureState(
            field,
            !addressFields.hidden
          );

          addressToggle.addEventListener(
            'click',
            () => {
              const expanded =
                addressToggle.getAttribute(
                  'aria-expanded'
                ) === 'true';

              setPlaceAddressDisclosureState(
                field,
                !expanded,
                {
                  clear: expanded,
                  focus: !expanded
                }
              );
            }
          );
        }

        const input =
          field.querySelector(
            '[data-place-input]'
          );

        const list =
          field.querySelector(
            '.place-combobox-list'
          );

        if (!input || !list) return;

        let activeIndex = -1;
        let currentOptions = []; // [{type:'place'|'create', place?, text?}]

        function placeMatchScore(place, q) {
          const nq = normalizePlaceLookupText(q);
          if (!nq) return 1;
          const candidates = [place.name, placePrimaryName(place), placeSecondaryName(place), placeCountry(place), ...placeAlternativeNames(place)]
            .flatMap(value => [value, localizedDataFieldValue(value)]);
          for (const c of candidates) {
            if (!c) continue;
            const nc = normalizePlaceLookupText(c);
            if (nc.startsWith(nq)) return 3;
            if (nc.includes(nq)) return 2;
          }
          return 0;
        }

        function buildOptions(query) {
          const projectId = String(input.dataset.placeProjectId || '').trim();
          const pool = projectId
            ? (sampleData.places || []).filter(p => !p.deleted && p.projectId === projectId)
            : [];
          const trimmed = (query || '').trim();
          const scored = pool
            .map(p => ({ place: p, score: placeMatchScore(p, trimmed) }))
            .filter(x => x.score > 0)
            .sort((a, b) => (b.score - a.score) || (getPeopleForPlace(b.place.id, { projectId: b.place.projectId }).length - getPeopleForPlace(a.place.id, { projectId: a.place.projectId }).length) || a.place.name.localeCompare(b.place.name))
            .slice(0, 8)
            .map(x => ({ type: 'place', place: x.place }));
          const opts = scored;
          if (trimmed) {
            const nq = normalizePlaceLookupText(trimmed);
            const hasExact = pool.some(p => [placeDisplayText(p), localizedDataFieldValue(placeDisplayText(p))].some(value => normalizePlaceLookupText(value) === nq));
            if (!hasExact) opts.push({ type: 'create', text: trimmed });
          }
          return opts;
        }

        function renderList() {
          if (!currentOptions.length) {
            list.hidden = true;
            list.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
            return;
          }
          list.innerHTML = currentOptions.map((opt, i) => {
            const active = i === activeIndex ? ' active' : '';
            if (opt.type === 'create') {
              const createLabel = field.dataset.placeCreateLabel || 'Create new place';
              return `<div class="place-combobox-option${active}" role="option" data-place-opt="${i}" data-place-create="1">
                <div class="place-combobox-copy"><strong>${escapeHtml(createLabel)}</strong><span>${escapeHtml(opt.text)}</span></div>
              </div>`;
            }
            const p = opt.place;
            const primary = placePrimaryName(p) || 'Place';
            const secondary = placeSecondaryName(p);
            return `<div class="place-combobox-option${active}" role="option" data-place-opt="${i}" data-place-id="${escapeHtml(p.id)}">
              <div class="place-combobox-copy"><strong>${escapeHtml(primary)}</strong>${secondary ? `<span>${escapeHtml(secondary)}</span>` : ''}</div>
            </div>`;
          }).join('');
          list.hidden = false;
          input.setAttribute('aria-expanded', 'true');
        }

        function refresh() {
          currentOptions = buildOptions(input.value);
          activeIndex = currentOptions.length ? 0 : -1;
          renderList();
        }

        function close() {
          list.hidden = true;
          list.innerHTML = '';
          input.setAttribute('aria-expanded', 'false');
          activeIndex = -1;
          currentOptions = [];
        }

        function chooseOption(opt) {
          if (!opt) return;
          if (opt.type === 'place') {
            const source = placeDisplayText(opt.place) || opt.place.name || '';
            input.dataset.sourceValue = source;
            input.value = localizedDataFieldValue(source);
            input.dataset.placeId = opt.place.id;
          } else {
            // create: keep typed text; clear selection so save-time creates the record
            input.dataset.placeId = '';
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          close();
        }

        input.addEventListener('focus', refresh);
        input.addEventListener('input', () => {
          // if typed text no longer matches selected place display, clear selection
          if (input.dataset.placeId) {
            const sel = getPlace(input.dataset.placeId);
            const selectedDisplay = sel
              ? localizedDataFieldValue(placeDisplayText(sel))
              : '';
            if (!sel || normalizePlaceLookupText(input.value) !== normalizePlaceLookupText(selectedDisplay)) {
              input.dataset.placeId = '';
            }
          }
          refresh();
        });
        input.addEventListener('keydown', event => {
          if (list.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            refresh();
            event.preventDefault();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!currentOptions.length) return;
            activeIndex = (activeIndex + 1) % currentOptions.length;
            renderList();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!currentOptions.length) return;
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            renderList();
          } else if (event.key === 'Enter') {
            if (!list.hidden && activeIndex >= 0) {
              event.preventDefault();
              chooseOption(currentOptions[activeIndex]);
            }
          } else if (event.key === 'Escape') {
            if (!list.hidden) {
              event.preventDefault();
              close();
            }
          }
        });
        input.addEventListener('blur', () => {
          setTimeout(close, 120);
        });
        list.addEventListener('mousedown', event => {
          const opt = event.target.closest('[data-place-opt]');
          if (!opt) return;
          event.preventDefault();
          const idx = Number(opt.dataset.placeOpt);
          chooseOption(currentOptions[idx]);
        });
      });
    }

    function normalizeGenealogyDateStartControl(
      field
    ) {
      const model =
        readGenealogyDateModel(field);

      const input =
        field.querySelector(
          '[data-genealogy-date-input]'
        );

      const inputTo =
        field.querySelector(
          '[data-genealogy-date-input-to]'
        );

      if (!input) {
        return;
      }

      /*
      * Use the previous model type. When the change event
      * runs, the select already contains the new type.
      */
      const previousType =
        normalizeGenealogyDateType(
          model.dateType
        );

      const text =
        collectLocalizedDataFieldValue(
          input,
          input.dataset.sourceValue || ''
        );

      const text2 =
        collectLocalizedDataFieldValue(
          inputTo,
          inputTo?.dataset.sourceValue || ''
        );

      const parsed =
        parseGenealogyDateTextAsType(
          text,
          previousType,
          {
            calendar:
              model.calendar
              || 'Gregorian',

            date2:
              previousType === 'Between'
                ? text2
                : model.date2
                  || model.date2Label
                  || '',

            date2Label:
              previousType === 'Between'
                ? text2
                : model.date2
                  || model.date2Label
                  || ''
          }
        );

      /*
      * Preserve genuinely invalid user input so validation
      * can report it instead of silently replacing it.
      */
      if (!parsed.valid) {
        return;
      }

      const source =
        formatGenealogyDateStartLabel(
          parsed.value
        );

      input.dataset.sourceValue =
        source;

      input.value =
        localizedDataFieldValue(
          source
        );
    }

    function bindGenealogyDateFields(root = document) {
      root.querySelectorAll('[data-genealogy-date-details]').forEach(button => {
        if (button.dataset.dateBound) return;
        button.dataset.dateBound = 'true';
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          openGenealogyDateEditor(button, button.dataset.genealogyDateDetails);
        });
      });
      root.querySelectorAll('[data-genealogy-date-field]').forEach(field => {
        const type = field.querySelector('[data-genealogy-date-type]');
        const input = field.querySelector('[data-genealogy-date-input]');
        const inputTo = field.querySelector('[data-genealogy-date-input-to]');
        const clearError = () => setGenealogyDateFieldError(field, '');
        if (type && !type.dataset.dateBound) {
          type.dataset.dateBound = 'true';
          type.addEventListener('change', () => {
            normalizeGenealogyDateStartControl(
              field
            );

            const currentModel =
              readGenealogyDateModel(field);
            const selectedType = normalizeGenealogyDateType(type.value);
            field.classList.toggle('is-between', selectedType === 'Between');
            if (
              selectedType !== 'Between'
              && inputTo
            ) {
              inputTo.value = '';
              inputTo.dataset.sourceValue = '';
            }
            const model = field.querySelector('[data-genealogy-date-model]');
            if (model) model.value = JSON.stringify({ ...currentModel, dateType: selectedType, date2: selectedType === 'Between' ? currentModel.date2 || '' : '', date2Label: selectedType === 'Between' ? currentModel.date2Label || '' : '', sortDate2: selectedType === 'Between' ? currentModel.sortDate2 || '' : '' });
            clearError();
          });
        }
        if (input && !input.dataset.dateBound) {
          input.dataset.dateBound = 'true';
          input.addEventListener('input', clearError);
        }
        if (inputTo && !inputTo.dataset.dateBound) {
          inputTo.dataset.dateBound = 'true';
          inputTo.addEventListener('input', clearError);
        }
      });
    }

    function cleanTreeNamePart(value) {
      return String(value || '')
        .trim()
        .replace(/\s+/g, ' ');
    }

    function comparableTreeSurname(value) {
      return cleanTreeNamePart(value)
        .normalize('NFKC')
        .toLocaleLowerCase();
    }

    function treeMarriageSortKey(
      family
    ) {
      const marriageEvent =
        relationshipEventByTag(
          family,
          'MARR'
        );

      const marriageDate =
        normalizeGenealogyDateInput(
          marriageEvent?.date
          || {},
          'Exact date'
        );

      const sortValue =
        marriageDate.sortDate
        || marriageEvent?.sortDate
        || family?.startSortDate
        || '';

      const numericValue =
        Number(sortValue);

      return Number.isFinite(
        numericValue
      )
        ? numericValue
        : 0;
    }

    function activeTreeMarriages(
      personId
    ) {
      return getPartnerRelationships(
        personId
      )
        .filter(family => {
          const relationshipType =
            cleanTreeNamePart(
              relationshipTypeFromLegacy(
                family
              )
            );

          const relationshipStatus =
            cleanTreeNamePart(
              family.relationshipStatus
              || 'active'
            ).toLocaleLowerCase();

          return (
            relationshipType === 'Married'
            && relationshipStatus === 'active'
          );
        })
        .sort((left, right) => {
          const dateDifference =
            treeMarriageSortKey(right)
            - treeMarriageSortKey(left);

          if (dateDifference) {
            return dateDifference;
          }

          return String(
            left.id || ''
          ).localeCompare(
            String(
              right.id || ''
            )
          );
        });
    }

    function marriedSpouseSurnameForTree(
      person
    ) {
      if (!person?.id) {
        return '';
      }

      const marriage =
        activeTreeMarriages(
          person.id
        )
          .map(family => ({
            family,

            spouse:
              getRelationshipPartner(
                family,
                person.id
              )
          }))
          .find(entry =>
            cleanTreeNamePart(
              entry.spouse
                ?.names
                ?.last
            )
          );

      return cleanTreeNamePart(
        marriage
          ?.spouse
          ?.names
          ?.last
      );
    }

    function treePersonDisplayName(
      person
    ) {
      const names =
        person?.names
        || {};

      const firstName =
        cleanTreeNamePart(
          names.first
        );

      const middleName =
        cleanTreeNamePart(
          names.middle
        );

      const isFemale =
        String(
          person?.gender || ''
        ).toLocaleLowerCase()
          === 'female';

      let effectiveSurname =
        cleanTreeNamePart(
          names.last
        );

      /*
      * This is a display fallback only. Never persist
      * the spouse's surname to the person's record.
      */
      if (
        isFemale
        && !effectiveSurname
      ) {
        effectiveSurname =
          marriedSpouseSurnameForTree(
            person
          );
      }

      const maidenSurname =
        isFemale
          ? cleanTreeNamePart(
              names.maiden
            )
          : '';

      const baseName =
        [
          firstName,
          middleName,
          effectiveSurname
        ]
          .filter(Boolean)
          .join(' ')
        || cleanTreeNamePart(
          names.display
        )
        || 'Unnamed person';

      const shouldShowMaiden =
        Boolean(
          maidenSurname
          && comparableTreeSurname(
            maidenSurname
          ) !== comparableTreeSurname(
            effectiveSurname
          )
        );

      return shouldShowMaiden
        ? `${baseName} (${maidenSurname})`
        : baseName;
    }
        
    function toTreePerson(person) {
      return {
        id: person.id,
        name:
          treePersonDisplayName(
            person
          ),
        short: person.names.initials,
        gender: person.gender,
        birth: formatGenealogyDateLabel(person.birth),
        place: getPlaceEventDisplay(person.birth),
        death: formatGenealogyDateLabel(person.death),
        deathPlace: getPlaceEventDisplay(person.death),
        status: person.livingStatus,
        avatar: person.avatarClass,
        primaryPhotoId: person.primaryPhotoId || '',
        photos: getPersonPhotoCount(person.id),
        files:
          getArchiveFilesForPerson(
            person.id
          ).length,
        notes:
          getNotesForPerson(
            person.id
          ).length
      };
    }

    function markPersonUpdated(
      person,
      now = new Date().toISOString()
    ) {
      if (!person) {
        return;
      }

      person.meta =
        person.meta || {};

      person.meta.updated =
        'Just now';

      person.updatedAt =
        now;
    }

    function toPeopleRecord(
      person,
      relationshipLabels = null
    ) {
      const sourceCount =
        sourceIdsForTarget(
          'person',
          person.id,
          person.projectId
        ).length;
      return {
        id: person.id,
        initials: person.names.initials,
        name: person.names.display,
        first: person.names.first,
        surname: person.names.last,
        living: person.livingStatus,
        birth: formatGenealogyDateLabel(person.birth),
        birthYear:
          timelineYearFromValue(
            person.birth
          ),
        birthPlace: getPlaceEventDisplay(person.birth),
        birthPlaceId:
          person.birth?.placeId
          || '',
        death: formatGenealogyDateLabel(person.death),
        deathPlace: getPlaceEventDisplay(person.death),
        updated: person.meta.updated,
        updatedAt:
          person.updatedAt || '',

        createdAt:
          person.createdAt || '',
        gender: person.gender,
        relation:
          relationshipLabels
            ?.get(person.id)
          || personRelationshipLabel(
            person.id,
            treeDefaultPersonId(
              person.projectId
            )
          ),
        photos: getPersonPhotoCount(person.id),
        files: getArchiveFilesForPerson(person.id).length,
        notes:
          getNotesForPerson(
            person.id
          ).length,
        sourceCount,
        reviewStatus: person.meta.reviewStatus,
        avatarClass: person.avatarClass,
        primaryPhotoId: person.primaryPhotoId || '',
        parents: getParents(person.id).map(parent => parent.names.display).join(' and ') || 'Unknown parents'
      };
    }

    function getTreePeopleFromSampleData(projectId) {
      return getPeople(projectId).map(toTreePerson);
    }

    function getPeopleRecordsFromSampleData(
      projectId
    ) {
      const referencePersonId =
        treeDefaultPersonId(
          projectId
        );

      const relationshipLabels =
        buildPersonRelationshipLabelMap(
          projectId,
          referencePersonId
        );

      return getPeople(projectId)
        .filter(person =>
          !person.deleted
        )
        .map(person =>
          toPeopleRecord(
            person,
            relationshipLabels
          )
        );
    }

        function getTreeFamiliesFromSampleData(projectId) {
      const childOwner = new Map();
      return centralFamilyRecords()
        .filter(family => Boolean(projectId) && family.projectId === projectId)
        .map(family => {
          const pair = normalizedFamilyPair(family);
          const partnerIds = [...new Set([familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean))];
          let leftId = pair.fatherId || null;
          let rightId = pair.motherId || null;

          if (!leftId && !rightId) {
            [leftId, rightId = null] = partnerIds;
          } else if (!leftId) {
            leftId = partnerIds.find(id => id !== rightId) || null;
          } else if (!rightId) {
            rightId = partnerIds.find(id => id !== leftId) || null;
          }

          const children = [...new Set([...(family.childIds || []), ...(family.childrenIds || [])].filter(Boolean))]
            .filter(childId => {
              if (childOwner.has(childId)) return false;
              childOwner.set(childId, family.id);
              return true;
            });
          return {
            id: family.id,
            sourceFamilyId: family.id,
            fatherId: pair.fatherId || null,
            motherId: pair.motherId || null,
            left: leftId,
            right: rightId,
            children,
            missingFather: !pair.fatherId,
            missingMother: !pair.motherId,
            relationshipType: family.relationshipType || 'Partner'
          };
        })
        .filter(family => family.left || family.right || family.children.length);
    }

    function normalizeSampleGenealogyDates() {
      sampleData.people.forEach(person => {
        person.birth = {
          ...normalizeGenealogyDateInput(person.birth, 'Unknown'),
          placeId: cleanDatePlaceId(person.birth?.placeId),
          placeText: person.birth?.placeText || '',
          address: person.birth?.address || ''
        };

        if (person.livingStatus === 'Living') {
          person.death = {
            ...emptyGenealogyDate('Exact date'),
            placeId: null,
            placeText: '',
            address: '',
            reason: '',
            burialPlaceId: null,
            burialPlaceText: '',
            burialAddress: ''
          };
        } else {
          person.death = {
            ...normalizeGenealogyDateInput(person.death, 'Unknown'),
            placeId: cleanDatePlaceId(person.death?.placeId),
            placeText: person.death?.placeText || '',
            address: person.death?.address || '',
            reason: person.death?.reason || '',
            burialPlaceId: cleanDatePlaceId(person.death?.burialPlaceId),
            burialPlaceText: person.death?.burialPlaceText || '',
            burialAddress: person.death?.burialAddress || ''
          };
        }
      });

      (sampleData.educationSeed || []).forEach(fact => {
        const person = getPerson(fact.personId);
        if (!person || personAttributeByTag(person, 'EDUC')) return;
        upsertPersonAttribute(person, 'EDUC', {
          id: fact.id || `education-${person.id}`,
          value: fact.value || fact.title || 'Education',
          type: fact.type || fact.institutionType || '',
          institutionName: fact.institutionName || fact.agency || '',
          institutionType: fact.institutionType || fact.type || '',
          placeId: cleanDatePlaceId(fact.placeId),
          placeText: fact.placeText || getPlaceDisplay(fact.placeId),
          address: fact.address || '',
          notes: fact.description || '',
          fromDate: genealogyDateOrNull({ date: fact.date, dateLabel: fact.dateLabel, dateType: fact.dateType || 'Year only' }, 'Year only'),
          toDate: null
        });
      });
      delete sampleData.educationSeed;

      const barnaby = getPerson('barnaby');
      if (barnaby && !personAttributeByTag(barnaby, 'OCCU')) {
        upsertPersonAttribute(barnaby, 'OCCU', {
          value: 'Archive clerk',
          company: 'Pawford records room',
          notes: 'Sample occupation fact kept on the centralized person record.',
          fromDate: genealogyDateOrNull({ date: '1976', dateLabel: '1976', dateType: 'Year only' }, 'Year only'),
          toDate: genealogyDateOrNull({ date: '1995', dateLabel: '1995', dateType: 'Year only' }, 'Year only')
        });
      }

      const pearl = getPerson('pearl');
      if (pearl && !personEventByTag(pearl, 'BAPM')) {
        upsertPersonEvent(pearl, 'BAPM', {
          date: genealogyDateOrNull({ date: '1928', dateLabel: '1928', dateType: 'Year only' }, 'Year only'),
          placeId: 'place-old-cattery',
          placeText: getPlaceDisplay('place-old-cattery')
        });
      }

      const legacyRelationships = Array.isArray(sampleData.relationshipSeed) ? sampleData.relationshipSeed : [];
      const gedcomRelationships = Array.isArray(sampleData.relationships) ? sampleData.relationships : [];
      const existingFamilies = Array.isArray(sampleData.families) && sampleData.families.length ? sampleData.families : [];
      sampleData.families = buildFamiliesFromRelationshipRecords([...existingFamilies, ...gedcomRelationships, ...legacyRelationships]);
      sampleData.families.forEach(family => {
        const partnerAId = familyPartnerAId(family);
        const partnerBId = familyPartnerBId(family);
        const relationshipType = relationshipTypeFromLegacy(family);
        const startDate = normalizeGenealogyDateInput({
          date: family.startDate,
          dateLabel: family.startDateLabel,
          dateType: family.startDateType || (cleanGenealogyDateText(family.startDate || family.startDateLabel) ? 'Exact date' : 'Exact date'),
          sortDate: family.startSortDate,
          calendar: family.startCalendar,
          originalText: family.startOriginalText
        }, 'Exact date');

        family.type = 'family';
        family.relationshipType = relationshipType;
        family.relationshipStatus = family.relationshipStatus || 'active';
        family.partnerAId = partnerAId;
        family.partnerBId = partnerBId;
        family.partner1Id = partnerAId;
        family.partner2Id = partnerBId;
        family.personAId = partnerAId;
        family.personBId = partnerBId;
        family.partnerARoleHint = family.partnerARoleHint || (getPerson(partnerAId)?.gender === 'male' ? 'HUSB' : getPerson(partnerAId)?.gender === 'female' ? 'WIFE' : '');
        family.partnerBRoleHint = family.partnerBRoleHint || (getPerson(partnerBId)?.gender === 'male' ? 'HUSB' : getPerson(partnerBId)?.gender === 'female' ? 'WIFE' : '');
        family.gedcomXref = family.gedcomXref || `@F${family.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
        family.childIds = [...new Set(family.childIds || [])];
        family.events = Array.isArray(family.events) ? family.events : [];
        family.attributes = Array.isArray(family.attributes) ? family.attributes : [];
        family.notes = Array.isArray(family.notes) ? family.notes : [];
        family.citations = Array.isArray(family.citations) ? family.citations : [];
        family.mediaIds = Array.isArray(family.mediaIds) ? family.mediaIds : [];

        family.startDate = startDate.date;
        family.startDateLabel = startDate.dateLabel;
        family.startDateType = startDate.dateType;
        family.startSortDate = startDate.sortDate;
        family.startCalendar = startDate.calendar;
        family.startOriginalText = startDate.originalText;
        family.startPlaceId = cleanDatePlaceId(family.startPlaceId);

        let marriage = relationshipEventByTag(family, 'MARR');
        if (!marriage) {
          marriage = createRelationshipEvent('MARR', 'Marriage', {
            id: `${family.id}-marriage`,
            typeLabel: family.marriageType || 'Civil',
            date: startDate,
            placeId: family.startPlaceId,
            placeText: family.startPlaceText || getPlaceDisplay(family.startPlaceId),
            address: family.startAddress || ''
          });
          if (relationshipType === 'Married' || formatGenealogyDateLabel(startDate) || family.startPlaceId) family.events.push(marriage);
        } else {
          marriage.date = normalizeGenealogyDateInput(marriage.date || startDate, 'Exact date');
          marriage.placeId = cleanDatePlaceId(marriage.placeId || family.startPlaceId);
          marriage.placeText = marriage.placeText || getPlaceDisplay(marriage.placeId);
          marriage.address = marriage.address || family.startAddress || '';
          marriage.typeLabel = marriage.typeLabel || family.marriageType || 'Civil';
          marriage.sortDate = marriage.date.sortDate || '';
        }
      });
      delete sampleData.relationshipSeed;
      syncFamilyReciprocalLinks();
    }

    function eventDateFields(dateInput) {
      const value = normalizeGenealogyDateInput(dateInput);
      return {
        date: value.date,
        dateLabel: value.dateLabel,
        dateType: value.dateType,
        sortDate: value.sortDate,
        calendar: value.calendar,
        originalText: value.originalText,
        date2: value.date2,
        date2Label: value.date2Label,
        sortDate2: value.sortDate2
      };
    }

    function timelineOptionalGenealogyDate(dateInput, fallbackType = 'Exact date') {
      if (!dateInput) return null;

      const normalized = normalizeGenealogyDateInput(dateInput, fallbackType);
      return hasGenealogyDateValue(normalized, fallbackType) ? normalized : null;
    }

    function timelineUnknownGenealogyDate(fallbackType = 'Exact date') {
      return emptyGenealogyDate(fallbackType);
    }

    function timelineDatePayload(dateInput, fallbackType = 'Exact date') {
      return eventDateFields(dateInput || timelineUnknownGenealogyDate(fallbackType));
    }

    function familyStartDateForTimeline(family) {
      return normalizeGenealogyDateInput({
        date: family?.startDate || '',
        dateLabel: family?.startDateLabel || '',
        dateType: family?.startDateType || 'Exact date',
        sortDate: family?.startSortDate || '',
        calendar: family?.startCalendar || 'Gregorian',
        originalText: family?.startOriginalText || ''
      }, 'Exact date');
    }

    function familyLooksMarriedForTimeline(family) {
      const relationshipType = cleanEditFieldValue(family?.relationshipType).toLowerCase();
      const marriageType = cleanEditFieldValue(family?.marriageType);
      const startDate = familyStartDateForTimeline(family);

      return Boolean(
        relationshipType === 'married'
          || relationshipType.includes('marriage')
          || marriageType
          || hasGenealogyDateValue(startDate, 'Exact date')
          || family?.startPlaceId
      );
    }

    function relationshipEventTag(event) {
      return event?.gedcomTag || event?.tag || '';
    }

    function timelineMarriageTitle(event = {}) {
      const label = cleanEditFieldValue(event.typeLabel || event.value || '');

      if (!label) return 'Marriage';
      if (/wedding/i.test(label)) return 'Wedding';
      if (/marriage/i.test(label)) return label;

      return `${label} marriage`;
    }

    function familyMarriageEventsForTimeline(family) {
      const storedMarriageEvents = (family?.events || [])
        .filter(event => relationshipEventTag(event) === 'MARR');

      if (storedMarriageEvents.length) {
        return storedMarriageEvents;
      }

      if (!familyLooksMarriedForTimeline(family)) {
        return [];
      }

      const startDate = familyStartDateForTimeline(family);

      return [{
        id: `${family.id}-marriage-derived`,
        gedcomTag: 'MARR',
        typeLabel: family.marriageType || '',
        date: startDate,
        placeId: family.startPlaceId || null,
        placeText: getPlaceDisplay(family.startPlaceId),
        derived: true
      }];
    }

    function timelineAttributeHasContent(attribute, fields = []) {
      return fields.some(field => cleanEditFieldValue(attribute?.[field]))
        || Boolean(attribute?.placeId)
        || cleanEditFieldValue(attribute?.placeText);
    }

    function timelineDateRangeLabel(fromDate, toDate) {
      const from = formatGenealogyDateLabel(fromDate);
      const to = formatGenealogyDateLabel(toDate);

      if (from && to) return `${from} to ${to}`;
      if (from) return `From ${from}`;
      if (to) return `Until ${to}`;

      return '';
    }

    function buildSampleEvents() {
      const events = [];

      sampleData.people.forEach(person => {
        ensurePersonCentralStructures(person);
        const birthDate = eventDateFields(person.birth);
        events.push({
          id: `event-${person.id}-birth`,
          projectId: person.projectId,
          type: 'birth',
          personIds: [person.id],
          relatedPersonIds: [],
          ...birthDate,
          placeId: person.birth?.placeId || null,
          placeText: person.birth?.placeText || '',
          address: person.birth?.address || '',
          title: 'Birth',
          description: `Birth of ${person.names.display}`
        });
      });

      centralFamilyRecords().forEach(family => {
        const personA = getPerson(familyPartnerAId(family));
        const personB = getPerson(familyPartnerBId(family));
        if (personA && personB) {
          familyMarriageEventsForTimeline(family).forEach(event => {
            const eventDate = timelineDatePayload(event.date, 'Exact date');
            const partnerAId = familyPartnerAId(family);
            const partnerBId = familyPartnerBId(family);
            const placeId = cleanDatePlaceId(event.placeId || family.startPlaceId) || null;

            events.push({
              id: `event-${family.id}-${event.id || 'marriage'}`,
              projectId: family.projectId || personA.projectId || personB.projectId,
              type: 'marriage',
              dateKind: 'point',
              familyId: family.id,
              personIds: [partnerAId, partnerBId],
              relatedPersonIds: [partnerAId, partnerBId],
              ...eventDate,
              placeId,
              placeText: event.placeText || getPlaceDisplay(placeId),
              address: event.address || family.startAddress || '',
              title: timelineMarriageTitle(event),
              description: `Marriage of ${personA.names.display} and ${personB.names.display}`,
              marriageType: event.typeLabel || family.marriageType || ''
            });
          });
        }

        (family.childIds || []).forEach(childId => {
          const child = getPerson(childId);
          if (!child) return;
          const childBirthDate = eventDateFields(child.birth);
          const parentIds =
            [
              ...new Set([
                familyPartnerAId(
                  family
                ),

                familyPartnerBId(
                  family
                )
              ])
            ]
              .filter(Boolean)
              .filter(parentId => {
                const parent =
                  getPerson(
                    parentId
                  );

                return Boolean(
                  parent
                  && !parent.deleted
                );
              });

          if (!parentIds.length) {
            return;
          }

          events.push({
            id:
              `event-${family.id}-${childId}-child-birth`,

            projectId:
              family.projectId
              || child.projectId,

            type:
              'childBirth',

            personIds:
              parentIds,

            relatedPersonIds:
              [childId],

            ...childBirthDate,

            placeId:
              child.birth?.placeId
              || null,

            placeText:
              child.birth?.placeText
              || '',

            address:
              child.birth?.address
              || '',

            title:
              `Birth of ${
                child.gender === 'female'
                  ? 'daughter'
                  : child.gender === 'male'
                    ? 'son'
                    : 'child'
              }`,

            description:
              child.names.display
          });
        });
      });

      sampleData.people.forEach(person => {
        ensurePersonCentralStructures(person);
        if (person.livingStatus === 'Deceased') {
          const deathDate = eventDateFields(person.death);
          events.push({
            id: `event-${person.id}-death`,
            projectId: person.projectId,
            type: 'death',
            personIds: [person.id],
            relatedPersonIds: [],
            ...deathDate,
            placeId: person.death?.placeId || null,
            placeText: person.death?.placeText || '',
            address: person.death?.address || '',
            title: 'Death',
            description: `Death of ${person.names.display}`
          });
        }

        (person.attributes || []).forEach(attribute => {
          if (attribute.tag === 'EDUC') {
            const fromDate = timelineOptionalGenealogyDate(attribute.fromDate || attribute.date, 'Year only');
            const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Year only');
            const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Year only');

            const institutionName = educationInstitutionLabel(attribute);
            const educationValue = educationValueLabel(attribute);

            const hasEducationContent = Boolean(
              fromDate
                || toDate
                || timelineAttributeHasContent(attribute, ['institutionName', 'agency', 'value', 'type', 'institutionType'])
            );

            if (!hasEducationContent) return;

            const eventDate = timelineDatePayload(primaryDate, 'Year only');

            events.push({
              id: `event-${attribute.id || `${person.id}-education`}`,
              projectId: person.projectId,
              type: 'education',
              dateKind: 'span',
              personIds: [person.id],
              relatedPersonIds: [],
              ...eventDate,
              fromDate,
              toDate,
              placeId: attribute.placeId || null,
              placeText: attribute.placeText || '',
              address: attribute.address || '',
              title: 'Education',
              description: educationTimelineDescription(attribute),
              institutionName,
              institutionType: educationInstitutionTypeLabel(attribute),
              educationValue,
              dateRangeLabel: timelineDateRangeLabel(fromDate, toDate)
            });
          }

          if (attribute.tag === 'OCCU') {
            const fromDate = timelineOptionalGenealogyDate(attribute.fromDate || attribute.date, 'Year only');
            const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Year only');
            const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Year only');

            const company = cleanEditFieldValue(attribute.company || attribute.agency);
            const occupation = cleanEditFieldValue(attribute.value || attribute.occupation);

            const hasOccupationContent = Boolean(
              fromDate
                || toDate
                || company
                || occupation
                || timelineAttributeHasContent(attribute, ['type'])
            );

            if (!hasOccupationContent) return;

            const eventDate = timelineDatePayload(primaryDate, 'Year only');

            events.push({
              id: `event-${attribute.id || `${person.id}-occupation`}`,
              projectId: person.projectId,
              type: 'occupation',
              dateKind: 'span',
              personIds: [person.id],
              relatedPersonIds: [],
              ...eventDate,
              fromDate,
              toDate,
              placeId: attribute.placeId || null,
              placeText: attribute.placeText || '',
              address: attribute.address || '',
              title: 'Occupation',
              description: [occupation, company].filter(Boolean).join(' at ') || 'Occupation fact',
              company,
              occupation,
              dateRangeLabel: timelineDateRangeLabel(fromDate, toDate)
            });
          }

            if (attribute.tag === 'FACT') {
              const factType =
                cleanEditFieldValue(
                  attribute.type
                );

              const factValue =
                cleanEditFieldValue(
                  attribute.value
                );

              const factNotes =
                cleanEditFieldValue(
                  attribute.notes
                );

              const factDate =
                timelineOptionalGenealogyDate(
                  attribute.date,
                  'Exact date'
                );

              const hasFactContent = Boolean(
                factType
                  && (
                    factValue
                    || factNotes
                    || factDate
                    || attribute.placeId
                    || cleanEditFieldValue(
                      attribute.placeText
                    )
                  )
              );

              if (!hasFactContent) {
                return;
              }

              events.push({
                id:
                  `event-${
                    attribute.id
                      || `${person.id}-fact`
                  }`,

                projectId:
                  person.projectId,

                type:
                  'customFact',

                dateKind:
                  'point',

                personIds:
                  [person.id],

                relatedPersonIds:
                  [],

                ...timelineDatePayload(
                  factDate
                    || timelineUnknownGenealogyDate(
                      'Exact date'
                    ),
                  'Exact date'
                ),

                placeId:
                  attribute.placeId || null,

                placeText:
                  attribute.placeText || '',

                address:
                  attribute.address || '',

                title:
                  factType,

                description:
                  factValue,

                notes:
                  factNotes
              });
            }
        });

        (person.events || []).forEach(event => {
          const tag = event.tag || event.gedcomTag;
          if (!['BAPM', 'BURI'].includes(tag)) return;
          const eventDate = eventDateFields(event.date || emptyGenealogyDate('Exact date'));
          events.push({
            id: `event-${event.id || `${person.id}-${tag.toLowerCase()}`}`,
            projectId: person.projectId,
            type: tag === 'BAPM' ? 'baptism' : 'burial',
            personIds: [person.id],
            relatedPersonIds: [],
            ...eventDate,
            placeId: event.placeId || null,
            placeText: event.placeText || '',
            address: event.address || '',
            title: tag === 'BAPM' ? 'Baptism' : 'Burial',
            description: event.notes || event.placeText || `${tag === 'BAPM' ? 'Baptism' : 'Burial'} of ${person.names.display}`
          });
        });
      });

      return events;
    }

    function rebuildSampleEventsAndPruneSourceLinks() {
      sampleData.events =
        buildSampleEvents();

      /*
        Source links are populated later than the
        first generated-event build during startup.
      */
      if (
        Array.isArray(
          sampleData.sourceLinks
        )
        && sampleData.sourceLinks.length
      ) {
        pruneInvalidSourceLinks();
      }

      return sampleData.events;
    }

    function validateSampleNotesFixture(
      warn = message =>
        console.warn(
          '[sampleData]',
          message
        )
    ) {
      if (
        sampleData.notes.length
          !== EXPECTED_CANONICAL_NOTE_COUNT
      ) {
        warn(
          `Expected exactly ${
            EXPECTED_CANONICAL_NOTE_COUNT
          } seeded notes; found ${
            sampleData.notes.length
          }`
        );
      }

      if (
        sampleData.noteCollections.length
          !== EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT
      ) {
        warn(
          `Expected exactly ${
            EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT
          } seeded note collections; found ${
            sampleData.noteCollections.length
          }`
        );
      }
    }

