function openPlacesMapContextMenu(event)
{
    if (!placesMapRuntime.map)
    {
        return;
    }
    closeMenu();
    const point = event.originalEvent;
    const selected = getPlace(state.selectedPlaceId);
    const menu = document.createElement('div');
    menu.className = 'menu-popover';
    menu.id = 'projectMenu';
    menu.style.left = `${Math.min(window.innerWidth - 230, Math.max(12, point.clientX))}px`;
    menu.style.top = `${Math.min(window.innerHeight - 210, Math.max(12, point.clientY))}px`;
    menu.innerHTML = `<button type="button" data-action="add">Add place here</button><button type="button" data-action="move" ${selected ? '' : 'disabled'}>Move selected place here</button><button type="button" data-action="copy">Copy coordinates</button><button type="button" data-action="centre">Centre map here</button>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', clickEvent =>
    {
        const action = clickEvent.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        if (action === 'add')
        {
            enterPlacesMapAddMode(); updatePlacesDraftCoordinates(event.latlng);
        }
        if (action === 'move')
        {
            enterPlacesMapMoveMode(selected.id); updatePlacesDraftCoordinates(event.latlng);
        }
        if (action === 'copy') navigator.clipboard?.writeText(formatMapCoordinatePair(event.latlng));
        if (action === 'centre') placesMapRuntime.map?.panTo(event.latlng);
        closeMenu();
    });
    bindMenuLifecycle();
}

function createPlaceLeafletMarker(place)
{
    const latLng = placeLatLng(place);
    if (!latLng || !window.L) return null;
    const marker = L.marker(latLng, {
        icon: createPlaceMarkerIcon(place, place.id === state.selectedPlaceId),
        keyboard: true,
        title: place.name,
        alt: place.name,
        riseOnHover: true
    });
    marker.placeId = place.id;
    marker.bindTooltip(escapeHtml(place.name), { direction: 'top', offset: [0, -12] });
    marker.on('click', () => selectPlace(place.id, { source: 'map', focusMap: false }));
    marker.on('add', () => bindPlaceMarkerElement(marker, place));
    return marker;
}

function bindPlaceMarkerElement(marker, place)
{
    const markerElement = marker?.getElement();
    if (!markerElement || markerElement.dataset.placeMarkerBound === 'true') return;
    markerElement.dataset.placeMarkerBound = 'true';
    markerElement.setAttribute('aria-label', `Select ${place.name}`);
    markerElement.addEventListener('click', event =>
    {
        event.stopPropagation();
        selectPlace(place.id, { source: 'map', focusMap: false });
    }, { capture: true });
    markerElement.addEventListener('keydown', event =>
    {
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        selectPlace(place.id, { source: 'map', focusMap: false });
    });
}

function capturePlacesMapView()
{
    const map = placesMapRuntime.map;
    if (!map || placesMapRuntime.suppressViewCapture) return;
    const center = map.getCenter();
    state.placesMapView.center = { lat: center.lat, lng: center.lng };
    state.placesMapView.zoom = map.getZoom();
    state.placesMapView.userMoved = true;
}

function restorePlacesMapView(places)
{
    const map = placesMapRuntime.map;
    if (!map) return;
    const view = state.placesMapView;
    placesMapRuntime.suppressViewCapture = true;
    if (view?.center && validLatitude(view.center.lat) && validLongitude(view.center.lng))
    {
        map.setView([view.center.lat, view.center.lng], Number.isFinite(view.zoom) ? view.zoom : PLACES_MAP_CONFIG.defaultZoom, { animate: false });
    }
    else
    {
        fitPlacesMap(places, { markUserMoved: false });
    }
    requestAnimationFrame(() =>
    {
        placesMapRuntime.suppressViewCapture = false;
    });
}

function destroyPlacesMap()
{
    clearTimeout(placesSearchTimer);
    removePlacesDraftMarker();
    if (placesMapRuntime.resizeObserver) placesMapRuntime.resizeObserver.disconnect();
    placesMapRuntime.resizeObserver = null;
    if (placesMapRuntime.tileLayer) placesMapRuntime.tileLayer.off();
    if (placesMapRuntime.map)
    {
        placesMapRuntime.map.off();
        placesMapRuntime.map.remove();
    }
    placesMapRuntime.map = null;
    placesMapRuntime.host = null;
    placesMapRuntime.tileLayer = null;
    placesMapRuntime.markerLayer = null;
    placesMapRuntime.routeLayer = null;
    placesMapRuntime.markersById.clear();
    placesMapRuntime.tileErrorCount = 0;
    placesMapRuntime.tilesAvailable = false;
    placesMapRuntime.mode = 'browse';
    placesMapRuntime.editingPlaceId = null;
    placesMapRuntime.mountedListKey = '';
    placesMapRuntime.currentPlaces = [];
    placesMapRuntime.suppressViewCapture = false;
}

function mountPlacesMap(places)
{
    const host = document.getElementById('placesLeafletMap');
    if (!host || state.activeModule !== 'Places' || state.placesViewMode === 'list') return;
    if (!window.L)
    {
        setPlacesMapStatus('Map library unavailable', 'Leaflet could not be loaded. The place list and editor remain available.', { retry: true });
        return;
    }
    if (placesMapRuntime.map && placesMapRuntime.host === host)
    {
        updatePlacesMapData(places);
        return;
    }
    destroyPlacesMap();
    placesMapRuntime.host = host;
    placesMapRuntime.currentPlaces = [...(places || [])];
    placesMapRuntime.map = L.map(host, {
        zoomControl: false,
        attributionControl: true,
        minZoom: PLACES_MAP_CONFIG.minZoom,
        maxZoom: PLACES_MAP_CONFIG.maxZoom,
        preferCanvas: false
    });
    placesMapRuntime.markerLayer = L.featureGroup().addTo(placesMapRuntime.map);
    placesMapRuntime.tileLayer = createPlacesTileLayer();
    if (placesMapRuntime.tileLayer)
    {
        placesMapRuntime.tileLayer.addTo(placesMapRuntime.map);
    }
    else
    {
        setPlacesMapStatus('Map configuration required', 'Add a protected MapTiler browser key to window.GENEOGRAPH_CONFIG.maptilerKey.', { retry: true });
    }
    placesMapRuntime.map.on('moveend zoomend', capturePlacesMapView);
    placesMapRuntime.map.on(
        'click',
        handlePlacesMapClick
    );
    placesMapRuntime.map.on('contextmenu', openPlacesMapContextMenu);
    placesMapRuntime.resizeObserver = new ResizeObserver(() =>
    {
        placesMapRuntime.map?.invalidateSize({ pan: false, debounceMoveend: true });
    });
    placesMapRuntime.resizeObserver.observe(host.parentElement || host);
    updatePlacesMapData(places, { force: true });
    restorePlacesMapView(places);
    updatePlacesMapToolControls();
}

function updatePlacesMapData(places, { force = false } = {})
{
    const map = placesMapRuntime.map;
    const markerLayer = placesMapRuntime.markerLayer;
    if (!map || !markerLayer) return;
    const list = (places || []).filter(place => !place.deleted);
    const key = placesMapDataKey(list);
    placesMapRuntime.currentPlaces = [...list];
    if (!force && key === placesMapRuntime.mountedListKey)
    {
        updatePlacesMapSelection(state.selectedPlaceId);
        renderPlacesRouteLayer();
        return;
    }
    markerLayer.clearLayers();
    placesMapRuntime.markersById.clear();
    list.filter(placeHasCoordinates).forEach(place =>
    {
        const marker = createPlaceLeafletMarker(place);
        if (!marker) return;
        marker.addTo(markerLayer);
        bindPlaceMarkerElement(marker, place);
        placesMapRuntime.markersById.set(place.id, marker);
    });
    placesMapRuntime.mountedListKey = key;
    updatePlacesMapSelection(state.selectedPlaceId);
    renderPlacesRouteLayer();
    updatePlacesRouteControl();
    updatePlacesMapToolControls();
}

function updatePlacesMapSelection(placeId, { focusMap = false } = {})
{
    placesMapRuntime.markersById.forEach((marker, id) =>
    {
        const place = getPlace(id);
        if (place) marker.setIcon(createPlaceMarkerIcon(place, id === placeId));
    });
    const place = getPlace(placeId);
    if (focusMap && placeHasCoordinates(place) && placesMapRuntime.map)
    {
        const padding = placesMapPadding();
        placesMapRuntime.map.panInside(placeLatLng(place), {
            paddingTopLeft: padding.topLeft,
            paddingBottomRight: padding.bottomRight
        });
    }
}

function placesMapPadding()
{
    const width = placesMapRuntime.host?.clientWidth || 900;
    const height = placesMapRuntime.host?.clientHeight || 600;
    return {
        topLeft: [Math.round(Math.min(420, Math.max(48, width * 0.34))), Math.round(Math.min(80, Math.max(32, height * 0.1)))],
        bottomRight: [Math.round(Math.min(240, Math.max(36, width * 0.12))), Math.round(Math.min(100, Math.max(40, height * 0.12)))]
    };
}

function getProjectRouteSurnames(projectId = currentProjectId())
{
    const counts = new Map();
    getPeople(projectId)
        .filter(person => person && !person.deleted)
        .forEach(person =>
        {
            const surname = String(person?.names?.last || '').trim();
            if (surname) counts.set(surname, (counts.get(surname) || 0) + 1);
        });
    return [...counts.entries()]
        .map(([surname, count]) => ({ surname, count }))
        .sort((a, b) => a.surname.localeCompare(b.surname, undefined, { sensitivity: 'base' }));
}

function getPersonRouteEvents(personId)
{
    const person = getPerson(personId);
    if (!person || person.deleted || person.projectId !== currentProjectId()) return [];
    return (sampleData.events || []).filter(event =>
        event?.projectId === person.projectId
        && Array.isArray(event.personIds)
        && event.personIds.includes(person.id)
    );
}

function getSurnameRoutePeople(surname)
{
    const expected = String(surname || '').trim();
    if (!expected) return [];
    return getPeople(currentProjectId()).filter(person =>
        person && !person.deleted && String(person?.names?.last || '').trim() === expected
    );
}

function getSurnameRouteEvents(surname)
{
    const personIds = new Set(getSurnameRoutePeople(surname).map(person => person.id));
    const events = new Map();
    (sampleData.events || []).forEach(event =>
    {
        if (event?.projectId !== currentProjectId()) return;
        if (!(event.personIds || []).some(personId => personIds.has(personId))) return;
        if (event.id && !events.has(event.id)) events.set(event.id, event);
    });
    return [...events.values()];
}

function normalizeRouteEvent(event)
{
    const date = normalizeGenealogyDateInput(event || {});
    const rawSortDate = String(date.sortDate || event?.sortDate || '').replace(/\D/g, '');
    const sortValue = rawSortDate
        ? Number(rawSortDate.slice(0, 8).padEnd(8, '0'))
        : Number.POSITIVE_INFINITY;
    const place = getPlace(event?.placeId);
    const placeIsValid = Boolean(place && !place.deleted && place.projectId === currentProjectId());
    const coordinates = placeIsValid ? placeLatLng(place) : null;
    const hasSortableDate = Number.isFinite(sortValue);
    const hasCoordinates = Boolean(
        coordinates && validLatitude(coordinates[0]) && validLongitude(coordinates[1])
    );
    const exclusionReason = !hasSortableDate
        ? 'missingDate'
        : !placeIsValid
            ? 'missingPlace'
            : !hasCoordinates
                ? 'missingCoordinates'
                : '';
    return {
        event,
        eventId: String(event?.id || ''),
        personIds: [...new Set((event?.personIds || []).filter(Boolean))],
        place,
        placeId: place?.id || '',
        coordinates,
        date,
        dateLabel: formatGenealogyDateLabel(date),
        sortValue,
        hasSortableDate,
        exclusionReason,
        eligible: Boolean(hasSortableDate && placeIsValid && hasCoordinates)
    };
}

function sortRouteEvents(events)
{
    return (events || [])
        .map((event, index) => ({ ...event, originalIndex: index }))
        .sort((a, b) => a.sortValue - b.sortValue || a.originalIndex - b.originalIndex);
}

function routeStopDateLabel(stop)
{
    const first = stop?.events?.[0]?.dateLabel || '';
    const last = stop?.events?.[stop.events.length - 1]?.dateLabel || '';
    if (first && last && first !== last) return `${first} - ${last}`;
    return first || last || t('Date unknown');
}

function collapseConsecutiveRouteStops(events)
{
    const stops = [];
    (events || []).forEach(item =>
    {
        const previous = stops[stops.length - 1];
        if (previous && !item.breakBefore && previous.placeId === item.placeId)
        {
            previous.events.push(item);
            previous.eventIds = [...new Set([...previous.eventIds, item.eventId].filter(Boolean))];
            previous.personIds = [...new Set([...previous.personIds, ...item.personIds])];
            previous.lastSortValue = item.sortValue;
            previous.dateLabel = routeStopDateLabel(previous);
            return;
        }
        stops.push({
            place: item.place,
            placeId: item.placeId,
            coordinates: item.coordinates,
            events: [item],
            eventIds: item.eventId ? [item.eventId] : [],
            personIds: [...item.personIds],
            firstSortValue: item.sortValue,
            lastSortValue: item.sortValue,
            breakBefore: Boolean(item.breakBefore),
            dateLabel: item.dateLabel || t('Date unknown')
        });
    });
    return stops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
}

function derivePlacesRoute(selection = {})
{
    const mode = ['person', 'surname'].includes(selection.mode) ? selection.mode : 'none';
    const person = mode === 'person' ? getPerson(selection.personId) : null;
    const surname = mode === 'surname' ? String(selection.surname || '').trim() : '';
    const people = mode === 'surname' ? getSurnameRoutePeople(surname) : (person ? [person] : []);
    const validSubject = mode === 'person'
        ? Boolean(person && !person.deleted && person.projectId === currentProjectId())
        : Boolean(surname && people.length);
    const sourceEvents = validSubject
        ? (mode === 'person' ? getPersonRouteEvents(person.id) : getSurnameRouteEvents(surname))
        : [];
    const normalized = sortRouteEvents(sourceEvents.map(normalizeRouteEvent));
    let breakBefore = false;
    const eligible = [];
    normalized.forEach(item =>
    {
        if (!item.eligible)
        {
            if (item.hasSortableDate) breakBefore = true;
            return;
        }
        eligible.push({ ...item, breakBefore });
        breakBefore = false;
    });
    const stops = collapseConsecutiveRouteStops(eligible);
    const distinctPositions = new Set(stops.map(stop =>
        `${Number(stop.coordinates[0]).toFixed(6)},${Number(stop.coordinates[1]).toFixed(6)}`
    ));
    const excludedByReason = normalized.reduce((counts, item) =>
    {
        if (item.eligible || !item.exclusionReason) return counts;
        counts[item.exclusionReason] += 1;
        return counts;
    }, { missingDate: 0, missingPlace: 0, missingCoordinates: 0 });
    const available = stops.length >= 2 && distinctPositions.size >= 2;
    const firstDate = stops[0]?.events?.[0]?.dateLabel || '';
    const finalStop = stops[stops.length - 1];
    const lastDate = finalStop?.events?.[finalStop.events.length - 1]?.dateLabel || '';
    return {
        mode,
        configured: validSubject,
        subject: mode === 'person' ? (person?.names?.display || person?.name || '') : surname,
        personId: person?.id || '',
        surname,
        people,
        peopleCount: people.length,
        sourceEventCount: sourceEvents.length,
        excludedCount: normalized.filter(item => !item.eligible).length,
        excludedByReason,
        stops,
        distinctPlaceCount: distinctPositions.size,
        available,
        dateSpan: firstDate && lastDate && firstDate !== lastDate
            ? `${firstDate} - ${lastDate}`
            : firstDate || lastDate || ''
    };
}

function derivePlacesRouteSegments(route)
{
    const segments = [];
    (route?.stops || []).forEach(stop =>
    {
        if (!segments.length || stop.breakBefore) segments.push([]);
        segments[segments.length - 1].push(stop);
    });
    return segments;
}

function currentPlacesRouteSelection()
{
    return {
        mode: state.placesRouteMode,
        personId: state.placesRoutePersonId,
        surname: state.placesRouteSurname
    };
}

function currentPlacesRoute()
{
    return derivePlacesRoute(currentPlacesRouteSelection());
}

function normalizePlacesRouteSelection()
{
    const route = currentPlacesRoute();
    if (state.placesRouteMode !== 'none' && !route.configured)
    {
        clearPlacesRoute();
        return derivePlacesRoute({ mode: 'none' });
    }
    return route;
}

function clearPlacesRoute()
{
    state.placesRouteMode = 'none';
    state.placesRoutePersonId = '';
    state.placesRouteSurname = '';
    state.placesShowRoute = false;
}

function createPlacesRouteStopIcon(stop, totalStops)
{
    const isStart = stop.sequence === 1;
    const isEnd = stop.sequence === totalStops;
    return L.divIcon({
        className: 'places-route-marker-icon',
        html: `<span class="places-route-marker ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''}" aria-hidden="true"><span>${stop.sequence}</span></span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function renderPlacesRouteLayer()
{
    const map = placesMapRuntime.map;
    if (!map || !window.L) return;
    if (placesMapRuntime.routeLayer)
    {
        placesMapRuntime.routeLayer.remove();
        placesMapRuntime.routeLayer = null;
    }
    const route = normalizePlacesRouteSelection();
    if (!state.placesShowRoute || !route.available) return;
    const layer = L.layerGroup().addTo(map);
    derivePlacesRouteSegments(route).forEach(segment =>
    {
        if (segment.length < 2) return;
        L.polyline(segment.map(stop => stop.coordinates), {
            className: 'places-leaflet-route',
            color: '#62D99A',
            weight: 3,
            opacity: 0.78,
            dashArray: '9 8'
        }).addTo(layer);
    });
    route.stops.forEach(stop =>
    {
        const eventContext = stop.events
            .map(item => item.event?.title || item.event?.type || t('Event'))
            .join(', ');
        const accessibleName = `${stop.sequence} of ${route.stops.length}: ${stop.place.name}; ${stop.dateLabel}; ${route.subject}; ${eventContext}`;
        const marker = L.marker(stop.coordinates, {
            icon: createPlacesRouteStopIcon(stop, route.stops.length),
            keyboard: true,
            title: accessibleName,
            alt: accessibleName,
            riseOnHover: true,
            zIndexOffset: 600
        }).addTo(layer);
        marker.bindTooltip(`
          <strong>${stop.sequence}. ${escapeHtml(stop.place.name)}</strong><br>
          ${escapeHtml(stop.dateLabel)}${eventContext ? `<br>${escapeHtml(eventContext)}` : ''}
        `, { direction: 'top', offset: [0, -14], opacity: 0.96 });
        marker.on('click', () => selectPlace(stop.placeId, { focusMap: false }));
    });
    placesMapRuntime.routeLayer = layer;
}

function updatePlacesRouteControl()
{
    const button = document.getElementById('placesRouteMenu');
    if (!button) return;
    const route = normalizePlacesRouteSelection();
    const active = Boolean(state.placesShowRoute && route.configured);
    button.classList.toggle('active', active);
    button.setAttribute('aria-label', route.configured
        ? `${t('Route settings')}: ${route.subject}; ${t(route.available ? 'Active' : 'Needs attention')}`
        : t('Route settings'));
    button.title = route.configured
        ? `${route.subject} - ${t(route.available ? 'Active' : 'Needs attention')}`
        : t('Route settings');
}

function fitPlacesMap(places = placesMapRuntime.currentPlaces || [], { markUserMoved = true } = {})
{
    const map = placesMapRuntime.map;
    if (!map) return;
    const points = (places || []).filter(placeHasCoordinates);
    const padding = placesMapPadding();
    placesMapRuntime.suppressViewCapture = !markUserMoved;
    if (points.length > 1)
    {
        map.fitBounds(L.latLngBounds(points.map(placeLatLng)), {
            paddingTopLeft: padding.topLeft,
            paddingBottomRight: padding.bottomRight,
            maxZoom: PLACES_MAP_CONFIG.fitMaxZoom,
            animate: false
        });
    }
    else if (points.length === 1)
    {
        map.setView(placeLatLng(points[0]), Math.min(11, PLACES_MAP_CONFIG.fitMaxZoom), { animate: false });
    }
    else
    {
        map.setView([PLACES_MAP_CONFIG.defaultCenter.lat, PLACES_MAP_CONFIG.defaultCenter.lng], PLACES_MAP_CONFIG.defaultZoom, { animate: false });
        setPlacesMapStatus('No mapped places', 'Add coordinates to a place to show it on the map.');
    }
    state.placesMapView.lastFitKey = placesMapDataKey(points);
    state.placesMapView.userMoved = markUserMoved;
    requestAnimationFrame(() =>
    {
        placesMapRuntime.suppressViewCapture = false;
    });
}

function bindPlacesMapEditingControls()
{
    main
        .querySelector(
            '#placesMapInfoToggle'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                state.placesMapInfoExpanded =
                    !state.placesMapInfoExpanded;

                const panel =
                    main.querySelector(
                        '#placesMapInfoPanel'
                    );

                if (panel)
                {
                    panel.hidden =
                        !state.placesMapInfoExpanded;
                }

                event.currentTarget
                    .setAttribute(
                        'aria-expanded',
                        String(
                            state.placesMapInfoExpanded
                        )
                    );

                event.currentTarget
                    .classList
                    .toggle(
                        'active',
                        state.placesMapInfoExpanded
                    );
            }
        );

    main
        .querySelector(
            '#placesUseMapCentre'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const center =
                    placesMapRuntime
                        .map
                        ?.getCenter();

                if (center)
                {
                    updatePlacesDraftCoordinates(
                        center
                    );
                }
            }
        );

    main
        .querySelector(
            '#placesCopyCoordinates'
        )
        ?.addEventListener(
            'click',
            async () =>
            {
                const pending =
                    placesMapRuntime
                        .pendingLatLng;

                if (!pending)
                {
                    return;
                }

                const text =
                    formatMapCoordinatePair(
                        pending
                    );

                try
                {
                    await navigator
                        .clipboard
                        .writeText(text);

                    showToast(
                        'Coordinates copied.'
                    );
                }
                catch
                {
                    showToast(text);
                }
            }
        );

    main
        .querySelector(
            '#placesCancelMapEdit'
        )
        ?.addEventListener(
            'click',
            cancelPlacesMapEditing
        );

    main
        .querySelector(
            '#placesConfirmMapEdit'
        )
        ?.addEventListener(
            'click',
            completePlaceEditorMapSelection
        );

    updatePlacesMapToolControls();
}

function projectPlaces(projectId = currentProjectId(), { includeDeleted = false } = {})
{
    return (sampleData.places || []).filter(place => place.projectId === projectId && (includeDeleted || !place.deleted));
}

function placeSavedFiltersForProject(
    projectId = currentProjectId()
)
{
    return (
        sampleData.placeSavedFilters || []
    ).filter(savedFilter =>
        savedFilter.projectId === projectId
    );
}

function placeSavedFilterById(savedFilterId)
{
    return placeSavedFiltersForProject()
        .find(savedFilter =>
            savedFilter.id === savedFilterId
        ) || null;
}

function uniquePlaceSavedFilterId()
{
    const usedIds = new Set(
        (
            sampleData.placeSavedFilters || []
        ).map(savedFilter =>
            savedFilter.id
        )
    );

    let index = Date.now();
    let id = `place-saved-filter-${index}`;

    while (usedIds.has(id))
    {
        index += 1;
        id = `place-saved-filter-${index}`;
    }

    return id;
}

function placeFiltersWithDefaults(
    filters = state.placesFilters
)
{
    const source =
        filters && typeof filters === 'object'
            ? filters
            : {};

    return {
        personId:
          String(
              source.personId || ''
          ).trim(),

        surname:
          String(
              source.surname || ''
          ).trim(),

        yearFrom:
          String(
              source.yearFrom || ''
          ).trim(),

        yearTo:
          String(
              source.yearTo || ''
          ).trim(),

        eventType:
          String(
              source.eventType || ''
          ).trim(),

        country:
          String(
              source.country || ''
          ).trim(),

        mapped:
          [
              'all',
              'mapped',
              'unmapped'
          ].includes(source.mapped)
              ? source.mapped
              : 'all'
    };
}

function projectPeopleForPlaceFilters()
{
    return (
        sampleData.people || []
    )
        .filter(person =>
            person.projectId === currentProjectId()
        )
        .sort((a, b) =>
            placeFilterPersonName(a)
                .localeCompare(
                    placeFilterPersonName(b)
                )
        );
}

function placeFilterPersonName(person)
{
    return (
        person?.names?.display
        || person?.name
        || 'Unnamed person'
    );
}

function placeFilterPersonSurname(person)
{
    return String(
        person?.names?.last
        || person?.surname
        || ''
    ).trim();
}

function placeFilterSurnames()
{
    return [
        ...new Set(
            projectPeopleForPlaceFilters()
                .map(placeFilterPersonSurname)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b)
    );
}

function placeFilterCountries()
{
    return [
        ...new Set(
            projectPlaces()
                .map(place =>
                    placeCountry(place)
                )
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b)
    );
}

const placeEventTypeLabels =
    Object.freeze({
        birth: 'Birth',
        childBirth: 'Birth of child',
        marriage: 'Marriage',
        death: 'Death',
        baptism: 'Baptism',
        burial: 'Burial',
        education: 'Education',
        occupation: 'Occupation',
        customFact: 'Other fact'
    });

function placeEventTypeLabel(type)
{
    if (!type)
    {
        return 'Other event';
    }

    if (placeEventTypeLabels[type])
    {
        return placeEventTypeLabels[type];
    }

    return String(type)
        .replace(
            /([a-z])([A-Z])/g,
            '$1 $2'
        )
        .replace(
            /^./,
            character =>
                character.toUpperCase()
        );
}

function placeFilterEventTypes()
{
    const types = new Map();

    (
        sampleData.events || []
    )
        .filter(event =>
            event.projectId
            === currentProjectId()
          && event.placeId
        )
        .forEach(event =>
        {
            const type =
                String(
                    event.type || ''
                ).trim();

            if (type)
            {
                types.set(
                    type,
                    placeEventTypeLabel(type)
                );
            }
        });

    return [
        ...types.entries()
    ].sort((a, b) =>
        a[1].localeCompare(b[1])
    );
}

function placeFilterOption(
    value,
    label,
    selectedValue
)
{
    return `
        <option
          value="${escapeHtml(value)}"
          ${
                value === selectedValue
                    ? 'selected'
                    : ''
            }>
          ${escapeHtml(label)}
        </option>
      `;
}

function renderPlaceFilterFields(
    filters = defaultPlaceFilters,
    prefix = 'place-filter'
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const peopleOptions =
        projectPeopleForPlaceFilters()
            .map(person =>
                placeFilterOption(
                    person.id,
                    placeFilterPersonName(person),
                    normalized.personId
                )
            )
            .join('');

    const surnameOptions =
        placeFilterSurnames()
            .map(surname =>
                placeFilterOption(
                    surname,
                    surname,
                    normalized.surname
                )
            )
            .join('');

    const eventTypeOptions =
        placeFilterEventTypes()
            .map(([type, label]) =>
                placeFilterOption(
                    type,
                    label,
                    normalized.eventType
                )
            )
            .join('');

    const countryOptions =
        placeFilterCountries()
            .map(country =>
                placeFilterOption(
                    country,
                    country,
                    normalized.country
                )
            )
            .join('');

    return `
        <div class="people-filter-field full">
          <label for="${prefix}-person">
            Person
          </label>

          <select
            id="${prefix}-person"
            data-place-filter-input="personId">
            ${placeFilterOption(
                '',
                'Any person',
                normalized.personId
            )}
            ${peopleOptions}
          </select>
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-surname">
            Surname
          </label>

          <select
            id="${prefix}-surname"
            data-place-filter-input="surname">
            ${placeFilterOption(
                '',
                'Any surname',
                normalized.surname
            )}
            ${surnameOptions}
          </select>
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-event-type">
            Event type
          </label>

          <select
            id="${prefix}-event-type"
            data-place-filter-input="eventType">
            ${placeFilterOption(
                '',
                'Any event',
                normalized.eventType
            )}
            ${eventTypeOptions}
          </select>
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-year-from">
            Year from
          </label>

          <input
            id="${prefix}-year-from"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="4"
            pattern="[0-9]{1,4}"
            placeholder="Any year"
            value="${escapeHtml(
                normalized.yearFrom
            )}"
            data-place-filter-input="yearFrom">
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-year-to">
            Year to
          </label>

          <input
            id="${prefix}-year-to"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="4"
            pattern="[0-9]{1,4}"
            placeholder="Any year"
            value="${escapeHtml(
                normalized.yearTo
            )}"
            data-place-filter-input="yearTo">
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-country">
            Country
          </label>

          <select
            id="${prefix}-country"
            data-place-filter-input="country">
            ${placeFilterOption(
                '',
                'Any country',
                normalized.country
            )}
            ${countryOptions}
          </select>
        </div>

        <div class="people-filter-field">
          <label for="${prefix}-mapped">
            Map status
          </label>

          <select
            id="${prefix}-mapped"
            data-place-filter-input="mapped">

            ${placeFilterOption(
                'all',
                'All places',
                normalized.mapped
            )}

            ${placeFilterOption(
                'mapped',
                'On map',
                normalized.mapped
            )}

            ${placeFilterOption(
                'unmapped',
                'Not on map',
                normalized.mapped
            )}
          </select>
        </div>

      `;
}

function readPlaceFilterFields(root)
{
    const readValue = key =>
        root
            .querySelector(
                `[data-place-filter-input="${key}"]`
            )
            ?.value
            ?.trim()
        || '';

    return placeFiltersWithDefaults({
        personId:
          readValue('personId'),

        surname:
          readValue('surname'),

        yearFrom:
          readValue('yearFrom'),

        yearTo:
          readValue('yearTo'),

        eventType:
          readValue('eventType'),

        country:
          readValue('country'),

        mapped:
          readValue('mapped')
          || 'all'
    });
}

function resetPlaceFilterFields(root)
{
    root
        .querySelectorAll(
            '[data-place-filter-input]'
        )
        .forEach(input =>
        {
            const key =
                input.dataset
                    .placeFilterInput;

            if (input.type === 'checkbox')
            {
                input.checked =
                    Boolean(
                        defaultPlaceFilters[key]
                    );
                return;
            }

            input.value =
                defaultPlaceFilters[key]
            ?? '';
        });
}

function placeFilterYearError(filters)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const from =
        normalized.yearFrom;

    const to =
        normalized.yearTo;

    if (
        from
        && (
            !/^\d{1,4}$/.test(from)
          || Number(from) < 1
          || Number(from) > 9999
        )
    )
    {
        return 'Enter a valid starting year.';
    }

    if (
        to
        && (
            !/^\d{1,4}$/.test(to)
          || Number(to) < 1
          || Number(to) > 9999
        )
    )
    {
        return 'Enter a valid ending year.';
    }

    if (
        from
        && to
        && Number(from) > Number(to)
    )
    {
        return 'The starting year must not be later than the ending year.';
    }

    return '';
}

function activePlaceFilterEntries(
    filters = state.placesFilters
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const entries = [];

    if (normalized.personId)
    {
        const person =
            projectPeopleForPlaceFilters()
                .find(item =>
                    item.id === normalized.personId
                );

        entries.push([
            'personId',
            'Person',
            person
                ? placeFilterPersonName(person)
                : 'Unknown person'
        ]);
    }

    if (normalized.surname)
    {
        entries.push([
            'surname',
            'Surname',
            normalized.surname
        ]);
    }

    if (
        normalized.yearFrom
        || normalized.yearTo
    )
    {
        let value = '';

        if (
            normalized.yearFrom
          && normalized.yearTo
        )
        {
            value =
                `${normalized.yearFrom}–${normalized.yearTo}`;
        }
        else if (normalized.yearFrom)
        {
            value =
                `From ${normalized.yearFrom}`;
        }
        else
        {
            value =
                `Until ${normalized.yearTo}`;
        }

        entries.push([
            'dateRange',
            'Date',
            value
        ]);
    }

    if (normalized.eventType)
    {
        entries.push([
            'eventType',
            'Event',
            placeEventTypeLabel(
                normalized.eventType
            )
        ]);
    }

    if (normalized.country)
    {
        entries.push([
            'country',
            'Country',
            normalized.country
        ]);
    }

    if (normalized.mapped === 'mapped')
    {
        entries.push([
            'mapped',
            'Map',
            'On map'
        ]);
    }

    if (
        normalized.mapped
          === 'unmapped'
    )
    {
        entries.push([
            'mapped',
            'Map',
            'Not on map'
        ]);
    }

    return entries;
}

function hasActivePlaceFilters(
    filters = state.placesFilters
)
{
    return (
        activePlaceFilterEntries(
            filters
        ).length > 0
    );
}

function activePlaceFilterCount(
    filters = state.placesFilters
)
{
    return activePlaceFilterEntries(
        filters
    ).length;
}

function renderPlacesActiveFilters()
{
    if (!hasActivePlaceFilters())
    {
        return '';
    }

    const chips =
        activePlaceFilterEntries()
            .map(([key, label, value]) => `
            <span
              class="
                filter-chip
                active-filter-chip
              ">

              <span
                class="
                  active-filter-chip-copy
                ">
                <strong>
                  ${escapeHtml(label)}:
                </strong>

                ${escapeHtml(value)}
              </span>

              <button
                class="
                  active-filter-chip-remove
                "
                type="button"
                data-places-remove-filter="${
                    escapeHtml(key)
                }"
                aria-label="Remove ${
                    escapeHtml(label)
                } filter"
                title="Remove filter">
                ${icon.close}
              </button>
            </span>
          `)
            .join('');

    return `
        <div
          class="
            people-filterbar
            places-filterbar
          "
          aria-label="Active Places filters">

          ${chips}

          <span class="active-filter-actions">
            <button
              class="link"
              type="button"
              id="placesClearFilters">
              Clear all
            </button>

            <button
              class="people-save-view"
              type="button"
              id="placesSaveFilter">
              Save filter
            </button>
          </span>
        </div>
      `;
}

function removePlaceFilter(key)
{
    const filters =
        placeFiltersWithDefaults();

    if (key === 'dateRange')
    {
        filters.yearFrom = '';
        filters.yearTo = '';
    }
    else if (key === 'mapped')
    {
        filters.mapped = 'all';
    }
    else if (
        Object.prototype
            .hasOwnProperty
            .call(filters, key)
    )
    {
        filters[key] = '';
    }

    state.placesFilters = filters;
    state.placesSavedFilterId =
        '';

    renderPlaces();
}

function clearPlaceFilters()
{
    state.placesFilters = {
        ...defaultPlaceFilters
    };

    state.placesSavedFilterId = '';
    renderPlaces();
    showToast(
        'Place filters cleared.'
    );
}

const PLACE_REVIEW_COORDINATE_ISSUE_TYPES = Object.freeze([
    'missing_coordinates',
    'invalid_coordinates'
]);

function placeCoordinateReviewState(place)
{
    const coordinates = place?.coordinates;
    const latitude = coordinates?.lat;
    const longitude = coordinates?.lng;
    const hasLatitude = latitude !== null && latitude !== undefined && String(latitude).trim() !== '';
    const hasLongitude = longitude !== null && longitude !== undefined && String(longitude).trim() !== '';

    if (!hasLatitude && !hasLongitude)
    {
        return { missing: true, invalid: false };
    }

    return {
        missing: false,
        invalid: !hasLatitude || !hasLongitude || !validLatitude(latitude) || !validLongitude(longitude)
    };
}

function placeReviewConnectionCount(placeId)
{
    return Object.values(getPlaceConnectionCounts(placeId))
        .reduce((total, count) => total + Number(count || 0), 0);
}

function getPlaceReviewIssues(place)
{
    if (!place || place.deleted || place.projectId !== currentProjectId()) return [];
    const coordinateState = placeCoordinateReviewState(place);
    const connectionCount = placeReviewConnectionCount(place.id);
    const issues = [];

    if (coordinateState.invalid)
    {
        issues.push({
            type: 'invalid_coordinates',
            title: 'Coordinates need attention',
            description: 'The saved coordinates are incomplete or outside the valid range.',
            actionLabel: 'Fix coordinates'
        });
    }
    else if (coordinateState.missing)
    {
        issues.push({
            type: 'missing_coordinates',
            title: 'No map position',

            description:
            connectionCount > 0
                ? `This place is connected to ${connectionCount} ${
                    connectionCount === 1
                        ? 'record'
                        : 'records'
                } but has no map position.`
                : 'This place has no map position.',

            actionLabel: 'Add position'
        });
    }

    return issues;
}

function isPlaceReviewIssueDismissed(placeId, issueType)
{
    return (sampleData.placeIssues || []).some(issue =>
        issue.projectId === currentProjectId()
        && issue.placeId === placeId
        && issue.type === issueType
        && issue.status === 'dismissed'
    );
}

function getActivePlaceReviewIssues(place)
{
    return getPlaceReviewIssues(place).filter(issue =>
        !isPlaceReviewIssueDismissed(place.id, issue.type)
    );
}

function placeNeedsReview(place)
{
    return getActivePlaceReviewIssues(place).length > 0;
}

function getPlacesNeedingReview()
{
    return projectPlaces().filter(placeNeedsReview);
}

function dismissPlaceReviewIssue(placeId, issueType)
{
    const place = getPlace(placeId);
    if (!place || place.deleted || place.projectId !== currentProjectId()) return false;
    if (!getPlaceReviewIssues(place).some(issue => issue.type === issueType)) return false;
    const existing = (sampleData.placeIssues || []).find(issue =>
        issue.projectId === currentProjectId()
        && issue.placeId === placeId
        && issue.type === issueType
    );
    const dismissedAt = new Date().toISOString();
    if (existing)
    {
        existing.status = 'dismissed';
        existing.dismissedAt = dismissedAt;
    }
    else
    {
        sampleData.placeIssues.push({
            id: `place-issue-dismissal-${Date.now()}`,
            projectId: currentProjectId(),
            placeId,
            type: issueType,
            status: 'dismissed',
            dismissedAt
        });
    }
    return true;
}

function clearPlaceReviewDismissals(placeId, issueTypes = [])
{
    const types = new Set(issueTypes);
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        !(issue.projectId === currentProjectId() && issue.placeId === placeId && types.has(issue.type))
    );
}

function selectPlace(
    placeId,
    {
        source = 'list',
        focusMap = true
    } = {}
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || place.deleted
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    const placeChanged =
        state.selectedPlaceId
          !== place.id;

    state.selectedPlaceId =
        place.id;

    if (placeChanged)
    {
        state
            .placesInspectorShowAllEvents =
                false;
    }

    main
        .querySelectorAll(
            '[data-place-id]'
        )
        .forEach(row =>
        {
            const selected =
                row.dataset.placeId
              === place.id;

            row.classList.toggle(
                'active',
                selected
            );

            row.setAttribute(
                'aria-selected',
                String(selected)
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-tree-item]'
        )
        .forEach(row =>
        {
            row.classList.toggle(
                'active',
                row.dataset
                    .placeTreeItem
              === place.id
            );
        });

    rerenderPlacesInspector({
        preserveScroll:
          false
    });

    updatePlacesMapSelection(
        place.id,
        {
            focusMap:
            focusMap
            && source !== 'map'
        }
    );

    updatePlacesMapToolControls();
}

function showPlaceOnMap(
    placeId,
    {
        editPosition = false
    } = {}
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || place.deleted
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    closeMenu();

    state.selectedPlaceId =
        place.id;

    state.placesViewMode =
        'map';

    if (
        state.activeModule !== 'Places'
        || !main.querySelector(
            '#placesLeafletMap'
        )
    )
    {
        state.activeModule =
            'Places';

        render();
    }
    else
    {
        selectPlace(
            place.id,
            {
                source: 'list',
                focusMap: true
            }
        );
    }

    requestAnimationFrame(() =>
    {
        selectPlace(
            place.id,
            {
                source: 'list',
                focusMap: true
            }
        );

        if (
            !placeHasCoordinates(place)
        )
        {
            setPlacesMapStatus(
                'This place is not on the map',
                'Choose Edit position to add a map point.'
            );
        }
        else
        {
            setPlacesMapStatus();
        }

        if (editPosition)
        {
            enterPlacesMapMoveMode(
                place.id
            );
        }
    });
}

function renderPlaces()
{
    if (
        ![
            'all',
            'review'
        ].includes(state.placesView)
    )
    {
        state.placesView = 'all';
    }

    if (
        ![
            'map',
            'list'
        ].includes(
            state.placesViewMode
        )
    )
    {
        state.placesViewMode =
            'map';
    }

    state.placesFilters =
        placeFiltersWithDefaults();

    if (state.placesView === 'review')
    {
        destroyPlacesMap();
    }

    renderPlacesSidebar();
    renderPlacesMain();
}

function renderPlacesSidebar()
{
    const issueCount =
        getPlacesNeedingReview().length;

    const savedFilters =
        placeSavedFiltersForProject();

    const savedFilterMarkup =
        savedFilters
            .map(savedFilter =>
            {
                const active =
                    state.placesSavedFilterId
                === savedFilter.id;

                return `
              <div
                class="
                  people-saved-filter-row
                  ${active ? 'active' : ''}
                ">

                <button
                  class="
                    people-saved-filter-main
                  "
                  type="button"
                  data-place-saved-filter="${
                        escapeHtml(
                            savedFilter.id
                        )
                    }"
                  title="${
                        escapeHtml(
                            savedFilter.name
                        )
                    }">

                  ${icon.folder}

                  <span
                    class="
                      people-saved-filter-name
                    ">
                    ${
                        escapeHtml(
                            savedFilter.name
                        )
                    }
                  </span>
                </button>

                <button
                  class="
                    more-button
                    people-saved-filter-more
                  "
                  type="button"
                  data-place-saved-filter-menu="${
                        escapeHtml(
                            savedFilter.id
                        )
                    }"
                  aria-label="Actions for ${
                        escapeHtml(
                            savedFilter.name
                        )
                    }"
                  aria-haspopup="menu">

                  ${icon.more}
                </button>
              </div>
            `;
            })
            .join('');

    sidebar.innerHTML = `
        <nav
          class="places-sidebar"
          aria-label="Places navigation">

          <div class="places-sidebar-section">
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav places-nav">
              <button
                class="side-link ${
                    state.placesView === 'all'
                  && !state.placesSavedFilterId
                  && !hasActivePlaceFilters()
                        ? 'active'
                        : ''
                }"
                type="button"
                data-places-view="all">

                ${icon.mapPin}
                <span>All places</span>
              </button>

              <button
                class="side-link ${
                    state.placesView === 'review'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-places-view="review">

                ${icon.warning}
                <span>Needs review</span>

                <span class="badge">
                  ${issueCount}
                </span>
              </button>
            </div>
          </div>

          ${state.placesView === 'review' ? '' : `<div class="places-sidebar-section">
            <div class="side-section-title">
              Countries
            </div>

            <div
              class="places-country-tree"
              aria-label="Places by country">
              ${renderPlacesCountryTree()}
            </div>
          </div>

          <div class="places-sidebar-section">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Saved filters</span>

              <button
                class="side-add-button"
                type="button"
                id="placesSavedFilterPlus"
                aria-label="Create saved filter"
                title="Create saved filter">

                ${icon.plus}
              </button>
            </div>

            <div
              class="
                side-nav
                places-saved-filter-list
              ">

              ${
                    savedFilterMarkup
                || `
                  <p
                    class="
                      places-sidebar-empty
                    ">
                    No saved filters
                  </p>
                `
                }
            </div>
          </div>`}
        </nav>
      `;

    bindPlacesSidebarControls();
}

function renderPlacesCountryTree()
{
    const countries = new Map();
    filteredPlaces().forEach(place =>
    {
        const country = placeCountry(place) || 'Unknown country';
        if (!countries.has(country)) countries.set(country, []);
        countries.get(country).push(place);
    });
    return [...countries.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([country, places]) =>
    {
        const expanded = state.placesExpandedCountries?.includes(country);
        return `<div class="places-country-group">
          <button class="places-country-row" type="button" data-place-country-disclosure="${escapeHtml(country)}" aria-expanded="${expanded}"><span>${escapeHtml(country)}</span>${icon.chevron}</button>
          <div class="places-country-children" ${expanded ? '' : 'hidden'}>${places.sort((a, b) => a.name.localeCompare(b.name)).map(place => `<div class="places-country-place ${state.selectedPlaceId === place.id ? 'active' : ''}" data-place-tree-item="${escapeHtml(place.id)}"><button type="button" data-place-tree-select="${escapeHtml(place.id)}">${icon.mapPin}<span>${escapeHtml(placePrimaryName(place))}</span></button><button class="places-row-more" type="button" data-place-menu="${escapeHtml(place.id)}" aria-label="Actions for ${escapeHtml(placePrimaryName(place))}">${icon.more}</button></div>`).join('')}</div>
        </div>`;
    }).join('') || '<p class="places-sidebar-empty">No places</p>';
}

function bindPlacesSidebarControls()
{
    sidebar
        .querySelectorAll(
            '[data-places-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.placesView =
                        button.dataset
                            .placesView;

                    state.placesSavedFilterId =
                        '';

                    state.placesFilters = {
                        ...defaultPlaceFilters
                    };

                    state.placesSearch = '';

                    renderPlaces();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-country-disclosure]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const country =
                        button.dataset
                            .placeCountryDisclosure;

                    const expanded =
                        new Set(
                            state
                                .placesExpandedCountries
                  || []
                        );

                    if (expanded.has(country))
                    {
                        expanded.delete(country);
                    }
                    else
                    {
                        expanded.add(country);
                    }

                    state.placesExpandedCountries =
                        [...expanded];

                    renderPlacesSidebar();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-tree-select]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    selectPlace(
                        button.dataset
                            .placeTreeSelect
                    );
                }
            );

            button.addEventListener(
                'dblclick',
                () =>
                {
                    showPlaceOnMap(
                        button.dataset
                            .placeTreeSelect
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openPlaceActionsMenu(
                        button.dataset
                            .placeMenu,
                        button
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-saved-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    applyPlaceSavedFilter(
                        button.dataset
                            .placeSavedFilter
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-saved-filter-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openPlaceSavedFilterMenu(
                        button.dataset
                            .placeSavedFilterMenu,
                        button
                    );
                }
            );
        });

    sidebar
        .querySelector(
            '#placesSavedFilterPlus'
        )
        ?.addEventListener(
            'click',
            openCreatePlaceSavedFilterModal
        );
}

function applyPlaceSavedFilter(
    savedFilterId
)
{
    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (!savedFilter)
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    state.placesView =
        'all';

    state.placesSavedFilterId =
        savedFilter.id;

    state.placesFilters = {
        ...defaultPlaceFilters,
        ...savedFilter.filters
    };

    renderPlaces();
}

function generatePlaceSavedFilterName(
    filters = state.placesFilters
)
{
    const entries =
        activePlaceFilterEntries(
            filters
        );

    if (!entries.length)
    {
        return 'Custom place filter';
    }

    return entries
        .slice(0, 2)
        .map(([, , value]) =>
            value
        )
        .join(' - ');
}

function setPlaceSavedFilterModalError(
    message = '',
    focusSelector = ''
)
{
    const error =
        modalBackdrop
            .querySelector(
                '[data-place-saved-filter-error]'
            );

    if (error)
    {
        error.textContent =
            message;

        error.hidden =
            !message;
    }

    if (
        message
        && focusSelector
    )
    {
        modalBackdrop
            .querySelector(
                focusSelector
            )
            ?.focus();
    }
}

function openPlaceSavedFilterModal({
    mode = 'create',
    savedFilterId = '',
    initialName = '',
    initialDescription = '',
    initialFilters =
        defaultPlaceFilters
} = {})
{
    const isEdit =
        mode === 'edit';

    const existing =
        isEdit
            ? placeSavedFilterById(
                savedFilterId
            )
            : null;

    if (
        isEdit
        && !existing
    )
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    const name =
        existing?.name
        || initialName;

    const description =
        existing?.description
        || initialDescription;

    const filters =
        placeFiltersWithDefaults(
            existing?.filters
          || initialFilters
        );

    const title =
        isEdit
            ? 'Edit filter'
            : 'Create filter';

    const subtitle =
        isEdit
            ? 'Update the name, description, or filter conditions.'
            : 'Create a reusable filter for Places.';

    const submitLabel =
        isEdit
            ? 'Save changes'
            : 'Create filter';

    openModal(`
        <div
          class="
            modal
            people-saved-view-modal
            places-saved-filter-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="placeSavedFilterModalTitle">

          <div class="modal-header">
            <div>
              <h2
                id="placeSavedFilterModalTitle">
                ${escapeHtml(title)}
              </h2>

              <p>
                ${escapeHtml(subtitle)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="placeSavedFilterForm">
            <div
              class="
                modal-body
                people-saved-view-body
              ">

              <div
                class="
                  people-saved-view-identity
                ">

                <div class="field">
                  <label
                    for="placeSavedFilterName">
                    Name
                  </label>

                  <input
                    id="placeSavedFilterName"
                    required
                    maxlength="80"
                    value="${
                        escapeHtml(name)
                    }"
                    placeholder="e.g. Whiskerfield places">
                </div>

                <div class="field">
                  <label
                    for="placeSavedFilterDescription">
                    Description
                  </label>

                  <textarea
                    id="placeSavedFilterDescription"
                    placeholder="Optional description">${
                        escapeHtml(
                            description
                        )
                    }</textarea>
                </div>
              </div>

              <section
                class="
                  people-saved-view-filters
                "
                aria-labelledby="placeSavedFilterFieldsTitle">

                <div
                  class="
                    people-saved-view-section-header
                  ">

                  <div>
                    <h3
                      id="placeSavedFilterFieldsTitle">
                      Filters
                    </h3>

                    <p>
                      Choose at least one condition
                      for this saved filter.
                    </p>
                  </div>

                  <button
                    class="
                      link
                      people-saved-view-clear
                    "
                    type="button"
                    data-place-saved-filter-clear>
                    Clear filters
                  </button>
                </div>

                <div class="people-filter-grid">
                  ${renderPlaceFilterFields(
                        filters,
                        'place-saved-filter'
                    )}
                </div>

                <p
                  class="
                    people-saved-view-error
                  "
                  data-place-saved-filter-error
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
                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop
            .querySelector(
                '#placeSavedFilterForm'
            );

    const nameInput =
        modalBackdrop
            .querySelector(
                '#placeSavedFilterName'
            );

    nameInput?.focus();

    modalBackdrop
        .querySelector(
            '[data-place-saved-filter-clear]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                resetPlaceFilterFields(
                    form
                );

                setPlaceSavedFilterModalError();
            }
        );

    form?.addEventListener(
        'input',
        () =>
        {
            setPlaceSavedFilterModalError();
        }
    );

    form?.addEventListener(
        'change',
        () =>
        {
            setPlaceSavedFilterModalError();
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const submittedName =
                nameInput
                    ?.value
                    .trim()
            || '';

            const submittedDescription =
                modalBackdrop
                    .querySelector(
                        '#placeSavedFilterDescription'
                    )
                    ?.value
                    .trim()
            || '';

            const submittedFilters =
                readPlaceFilterFields(
                    form
                );

            if (!submittedName)
            {
                setPlaceSavedFilterModalError(
                    'Enter a filter name.',
                    '#placeSavedFilterName'
                );

                return;
            }

            const yearError =
                placeFilterYearError(
                    submittedFilters
                );

            if (yearError)
            {
                setPlaceSavedFilterModalError(
                    yearError,
                    '[data-place-filter-input="yearFrom"]'
                );

                return;
            }

            if (
                !hasActivePlaceFilters(
                    submittedFilters
                )
            )
            {
                setPlaceSavedFilterModalError(
                    'Choose at least one filter option.',
                    '[data-place-filter-input]'
                );

                return;
            }

            const duplicate =
                placeSavedFiltersForProject()
                    .find(savedFilter =>
                        savedFilter.id
                  !== savedFilterId
                && savedFilter.name
                    .trim()
                    .toLowerCase()
                  === submittedName
                      .toLowerCase()
                    );

            if (duplicate)
            {
                setPlaceSavedFilterModalError(
                    'A saved filter with this name already exists.',
                    '#placeSavedFilterName'
                );

                return;
            }

            if (isEdit)
            {
                const wasActive =
                    state.placesSavedFilterId
                === existing.id;

                existing.name =
                    submittedName;

                existing.description =
                    submittedDescription;

                existing.filters = {
                    ...submittedFilters
                };

                existing.updatedAt =
                    new Date()
                        .toISOString();

                if (wasActive)
                {
                    state.placesFilters = {
                        ...submittedFilters
                    };
                }

                closeModal();
                renderPlaces();

                showToast(
                    'Filter updated.'
                );

                return;
            }

            const savedFilter = {
                id:
              uniquePlaceSavedFilterId(),

                projectId:
              currentProjectId(),

                name:
              submittedName,

                description:
              submittedDescription,

                filters: {
                    ...submittedFilters
                },

                createdAt:
              new Date()
                  .toISOString(),

                updatedAt:
              new Date()
                  .toISOString()
            };

            sampleData
                .placeSavedFilters
                .push(savedFilter);

            state.placesView =
                'all';

            state.placesSavedFilterId =
                savedFilter.id;

            state.placesFilters = {
                ...submittedFilters
            };

            closeModal();
            renderPlaces();

            showToast(
                'Filter created.'
            );
        }
    );
}

function openCreatePlaceSavedFilterModal()
{
    openPlaceSavedFilterModal({
        mode: 'create',
        initialFilters: {
            ...defaultPlaceFilters
        }
    });
}

function openSaveCurrentPlaceFilterModal()
{
    if (!hasActivePlaceFilters())
    {
        showToast(
            'Add filters before saving a filter.'
        );

        return;
    }

    openPlaceSavedFilterModal({
        mode: 'create',
        initialName:
          generatePlaceSavedFilterName(),

        initialFilters:
          placeFiltersWithDefaults()
    });
}

function openEditPlaceSavedFilterModal(
    savedFilterId
)
{
    openPlaceSavedFilterModal({
        mode: 'edit',
        savedFilterId
    });
}

function openPlaceSavedFilterMenu(
    savedFilterId,
    anchor
)
{
    closeMenu();

    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (
        !savedFilter
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

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
        `Actions for ${savedFilter.name}`
    );

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
          role="menuitem"
          data-place-saved-filter-action="edit">
          Edit filter
        </button>

        <button
          class="danger"
          type="button"
          role="menuitem"
          data-place-saved-filter-action="delete">
          Delete filter
        </button>
      `;

    document.body
        .appendChild(menu);

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-place-saved-filter-action]'
                    )
                    ?.dataset
                    .placeSavedFilterAction;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (action === 'edit')
            {
                openEditPlaceSavedFilterModal(
                    savedFilter.id
                );
            }
            else if (
                action === 'delete'
            )
            {
                openDeletePlaceSavedFilterConfirm(
                    savedFilter.id
                );
            }
        }
    );

    bindMenuLifecycle(anchor);
}

function openDeletePlaceSavedFilterConfirm(
    savedFilterId
)
{
    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (!savedFilter)
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletePlaceSavedFilterTitle">

          <div class="modal-header">
            <div>
              <h2
                id="deletePlaceSavedFilterTitle">
                Delete saved filter?
              </h2>

              <p>
                Places and linked records
                will not be deleted.
              </p>
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
              <strong>
                ${escapeHtml(
                    savedFilter.name
                )}
              </strong>
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
              id="confirmDeletePlaceSavedFilter">
              Delete filter
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#confirmDeletePlaceSavedFilter'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const wasActive =
                    state.placesSavedFilterId
                === savedFilter.id;

                sampleData
                    .placeSavedFilters =
                        (
                            sampleData
                                .placeSavedFilters
                  || []
                        )
                            .filter(item =>
                                item.id
                      !== savedFilter.id
                            );

                if (wasActive)
                {
                    state.placesSavedFilterId =
                        '';

                    state.placesFilters = {
                        ...defaultPlaceFilters
                    };

                    state.placesView =
                        'all';
                }

                closeModal();
                renderPlaces();

                showToast(
                    'Filter deleted.'
                );
            }
        );
}

function filteredPlaces()
{
    let list =
        projectPlaces();

    const filters =
        placeFiltersWithDefaults();

    const context =
        createPlaceFilterContext(list);

    list =
        list.filter(place =>
            placeMatchesFilters(
                place,
                filters,
                context
            )
        );

    const query =
        String(
            state.placesSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        list =
            list.filter(place =>
                [
                    place.name,
                    placePrimaryName(place),
                    placeSecondaryName(place),
                    placeCountry(place),
                    ...placeAlternativeNames(
                        place
                    )
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query)
            );
    }

    return appSortRecords(list, {
        field:
          state.placesSort,

        direction:
          state.placesSortDirection,

        extractors: {
            name: {
                type: 'text',

                get: place =>
                    placePrimaryName(place)
              || place.name
            },

            updated: {
                type: 'number',

                get: place =>
                    appSortTimestamp(
                        place.updatedAt
                    )
            },

            created: {
                type: 'number',

                get: place =>
                    appSortTimestamp(
                        place.createdAt
                    )
            }
        },

        getFallback:
          place => place.name
    });
}

function placesPageTitle()
{
    if (
        state.placesSavedFilterId
    )
    {
        return (
            placeSavedFilterById(
                state.placesSavedFilterId
            )?.name
          || 'Saved filter'
        );
    }

    if (
        hasActivePlaceFilters()
    )
    {
        return 'Filtered places';
    }

    return 'Places';
}

function placesPageSubtitle()
{
    if (
        state.placesSavedFilterId
    )
    {
        const savedFilter =
            placeSavedFilterById(
                state.placesSavedFilterId
            );

        return (
            savedFilter?.description
          || 'Explore places matching this saved genealogy filter.'
        );
    }

    if (
        hasActivePlaceFilters()
    )
    {
        return 'Explore places matching the active genealogy filters.';
    }

    return 'Map and organize the places connected to your family history.';
}

function openPlacesNeedsReview(placeId = '')
{
    state.placesView = 'review';
    state.placesSavedFilterId = '';
    state.placesFilters = { ...defaultPlaceFilters };
    if (placeId) state.selectedPlaceId = placeId;
    state.placesReviewFocusId = placeId;
    renderPlaces();
}

function selectedPlaceFromVisibleList(list)
{
    const selected = selectedPlaceFromList(list);
    state.selectedPlaceId = selected?.id || null;
    return selected;
}

function placesInspectorShellClasses()
{
    return [
        'places-shell',
        state.placesInspectorCollapsed ? 'inspector-collapsed' : ''
    ].filter(Boolean).join(' ');
}

function renderPlacesInspectorAside(place)
{
    return `<aside class="places-inspector ${state.placesInspectorCollapsed ? 'collapsed' : ''}" data-places-inspector aria-label="Selected place inspector">${renderPlacesInspector(place)}</aside>`;
}

function placesReviewSearchResults()
{
    const query = String(state.placesSearch || '').trim().toLowerCase();
    return getPlacesNeedingReview()
        .filter(place =>
        {
            if (!query) return true;
            const issueTitles = getActivePlaceReviewIssues(place).map(issue => issue.title);
            return [place.name, ...placeAlternativeNames(place), ...issueTitles]
                .join(' ')
                .toLowerCase()
                .includes(query);
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

function placeReviewConnectionTotal(place)
{
    return Object.values(getPlaceConnectionCounts(place.id))
        .reduce((total, count) => total + Number(count || 0), 0);
}

function renderPlaceReviewListRow(place)
{
    const issues = getActivePlaceReviewIssues(place);
    const linked = placeReviewConnectionTotal(place);
    const issueSummary = issues.map(issue => `<span><strong>${escapeHtml(issue.title)}</strong><span>${escapeHtml(issue.description)}</span></span>`).join('');
    const quickActions = issues.map(issue => `<button class="button secondary" type="button" data-place-review-fix="${escapeHtml(place.id)}" data-place-review-type="${escapeHtml(issue.type)}">${escapeHtml(issue.actionLabel)}</button><button class="button ghost places-review-dismiss-button" type="button" data-place-review-dismiss="${escapeHtml(place.id)}" data-place-review-type="${escapeHtml(issue.type)}">Dismiss</button>`).join('');
    return `<div class="places-list-row places-review-list-row ${place.id === state.selectedPlaceId ? 'active' : ''}" data-place-id="${escapeHtml(place.id)}" tabindex="0" role="row" aria-selected="${place.id === state.selectedPlaceId}">
        <div><strong>${escapeHtml(placePrimaryName(place))}</strong><span>${escapeHtml(placeSecondaryName(place) || 'No broader place recorded')}</span></div>
        <div class="places-review-issue-summary">${issueSummary}</div>
        <span>${linked} ${linked === 1 ? 'record' : 'records'}</span>
        <span>${escapeHtml(formatPlaceUpdatedAt(place.updatedAt))}</span>
        <div class="places-review-row-actions">${quickActions}</div>
      </div>`;
}

function renderPlacesNeedsReviewPage()
{
    const allReviewPlaces = getPlacesNeedingReview();
    const reviewPlaces = placesReviewSearchResults();
    const selected = selectedPlaceFromVisibleList(reviewPlaces);
    const query = String(state.placesSearch || '').trim();
    let content = '';

    if (!reviewPlaces.length)
    {
        content = query
            ? `<div class="places-review-empty"><strong>No matching review items</strong><span>Try a different search.</span></div>`
            : `<div class="places-review-empty"><strong>All clear</strong><span>No places currently need review.<br>New flags will appear here when a place has an obvious issue.</span></div>`;
    }
    else
    {
        content = `<div class="places-list-panel places-review-list-panel" role="table" aria-label="Places needing review"><div class="places-list-head places-review-list-head" role="row"><span>Place</span><span>Issue</span><span>Connected</span><span>Updated</span><span>Quick actions</span></div>${reviewPlaces.map(renderPlaceReviewListRow).join('')}</div>`;
    }

    main.innerHTML = `<div class="${placesInspectorShellClasses()}">
        <section class="places-main"><div class="places-review-shell">
          <header class="places-page-head places-review-head">
            <div class="places-title"><h1 class="app-page-title">Needs review</h1><p>Places with details that may need your attention.</p></div>
            <strong class="places-review-total">${allReviewPlaces.length} ${allReviewPlaces.length === 1 ? 'place' : 'places'}</strong>
          </header>
          <div class="places-review-controls">
            <label class="app-search-field" aria-label="Search places needing review">${icon.search}<input id="placesReviewSearch" type="search" placeholder="Search review items..." value="${escapeHtml(state.placesSearch || '')}"></label>
          </div>
          <div class="places-review-content">${content}</div>
        </div></section>
        ${renderPlacesInspectorAside(selected)}
      </div>`;

    bindPlacesNeedsReviewControls();
    const focusId = state.placesReviewFocusId;
    state.placesReviewFocusId = '';
    if (focusId) requestAnimationFrame(() =>
    {
        const row = main.querySelector(`.places-review-list-panel [data-place-id="${CSS.escape(focusId)}"]`);
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row?.focus({ preventScroll: true });
    });
}

function bindPlacesNeedsReviewControls()
{
    bindSearchInput(main, '#placesReviewSearch', 'placesSearch', renderPlaces);
    bindPlaceListRows(main);
    main.querySelectorAll('[data-place-review-fix]').forEach(button => button.addEventListener('click', () =>
    {
        const placeId = button.dataset.placeReviewFix;
        selectPlace(placeId, { focusMap: false });
        if (button.dataset.placeReviewType === 'invalid_coordinates') openPlaceModalForCoordinateReview(placeId);
        else openPlaceModal(placeId);
    }));
    main.querySelectorAll('[data-place-review-dismiss]').forEach(button => button.addEventListener('click', () =>
    {
        if (!dismissPlaceReviewIssue(button.dataset.placeReviewDismiss, button.dataset.placeReviewType)) return;
        renderPlaces();
        showToast('Review item dismissed.');
    }));
    bindPlacesInspectorControls(main.querySelector('[data-places-inspector]') || main);
    bindToasts(main);
}


function renderPlacesMain()
{
    if (state.placesView === 'review')
    {
        renderPlacesNeedsReviewPage();
        return;
    }

    const list =
        filteredPlaces();

    const selected =
        selectedPlaceFromVisibleList(list);

    const isPlacesListView =
        state.placesViewMode === 'list';
    const activeFilterCount =
        activePlaceFilterCount();
    const hasActiveFilters =
        activeFilterCount > 0;
    const route =
        normalizePlacesRouteSelection();
    const routeIsShown =
        !isPlacesListView
        && state.placesShowRoute
        && route.configured;
    const shellClasses =
        placesInspectorShellClasses();

    main.innerHTML = `
        <div class="${shellClasses}">
          <section class="places-main">
            <div class="places-page">
              <header class="places-page-head">
                <div class="places-title">
                  <h1 class="app-page-title">
                    ${escapeHtml(placesPageTitle())}
                  </h1>

                  <p>
                    ${escapeHtml(
                        typeof placesPageSubtitle
                        === 'function'
                            ? placesPageSubtitle()
                            : 'Map and organize the places connected to your family history.'
                    )}
                  </p>
                </div>

                <div class="places-header-actions">
                  <button
                    class="button primary"
                    type="button"
                    id="placesAddPlace"
                    aria-label="Add place"
                    title="Add place">
                    ${icon.plus}
                    <span>Add place</span>
                  </button>
                </div>
              </header>

              <div
                class="places-toolbar"
                aria-label="Place controls">

                <div class="places-toolbar-left">
                  <label
                    class="app-search-field"
                    aria-label="Search places">

                    ${icon.search}

                    <input
                      id="placesSearch"
                      type="search"
                      placeholder="Search places..."
                      value="${escapeHtml(
                            state.placesSearch || ''
                        )}">
                  </label>
                </div>
                <div class="places-toolbar-right">
                  <button
                    class="
                      people-filter-button
                      places-filter-button
                      ${
                            hasActiveFilters
                                ? 'active'
                                : ''
                        }
                    "
                    type="button"
                    id="placesFilterButton"
                    aria-haspopup="dialog"
                    aria-controls="placesFilterPopover"
                    aria-expanded="false"
                    aria-label="${
                        hasActiveFilters
                            ? `Filters, ${activeFilterCount} active`
                            : 'Open place filters'
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
                          <span
                            class="people-filter-count">
                            ${activeFilterCount}
                          </span>
                        `
                            : ''
                    }
                  </button>
                  ${
                        isPlacesListView
                            ? renderAppSortControl({
                                id:
                            'placesSort',

                                field:
                            state.placesSort,

                                direction:
                            state.placesSortDirection,

                                ariaLabel:
                            'Sort places',

                                options:
                            APP_SORT_OPTIONS.places
                            })
                            : ''
                    }
                  ${!isPlacesListView ? `
                        <button
                          class="
                            button
                            secondary
                            places-route-toolbar-button
                            ${routeIsShown ? 'active' : ''}
                          "
                          type="button"
                          id="placesRouteMenu"
                          aria-label="Route settings"
                          aria-haspopup="dialog"
                          aria-expanded="false"
                          title="Route settings">

                          ${icon.link}

                          <span>Routes</span>
                        </button>
                      `
                            : ''
                    }

                  <div
                    class="albums-view-switch places-view-switch"
                    role="group"
                    aria-label="Places view mode">

                    <button
                      class="
                        toolbar-button
                        albums-view-button
                        places-view-button
                        ${
                            state.placesViewMode === 'map'
                                ? 'active'
                                : ''
                        }
                      "
                      type="button"
                      data-places-mode="map"
                      aria-label="Map view"
                      title="Map view"
                      aria-pressed="${
                            state.placesViewMode === 'map'
                        }">

                      ${icon.map}
                    </button>

                    <button
                      class="
                        toolbar-button
                        albums-view-button
                        places-view-button
                        ${
                            state.placesViewMode === 'list'
                                ? 'active'
                                : ''
                        }
                      "
                      type="button"
                      data-places-mode="list"
                      aria-label="List view"
                      title="List view"
                      aria-pressed="${
                            state.placesViewMode === 'list'
                        }">

                      ${icon.list}
                    </button>
                  </div>
                </div>
              </div>

              ${renderPlacesActiveFilters()}

              ${
                    state.placesViewMode === 'list'
                        ? renderPlacesListPanel(list)
                        : `
                    <div class="places-content map">
                      ${renderPlacesMapShell(list)}
                    </div>
                  `
                }
            </div>
          </section>

          ${renderPlacesInspectorAside(selected)}
        </div>
      `;
    bindPlacesControls(list);
    if (state.placesViewMode === 'map') requestAnimationFrame(() => mountPlacesMap(list));
}

function placeFilterRecordPlaceIds(record)
{
    return [
        record?.placeId,
        record?.birthPlaceId,
        record?.deathPlaceId,
        record?.burialPlaceId,
        ...(
            Array.isArray(record?.placeIds)
                ? record.placeIds
                : []
        )
    ].filter(Boolean);
}

function createPlaceFilterContext(
    places = projectPlaces()
)
{
    const projectId =
        currentProjectId();

    const placeIds =
        new Set(
            places.map(place =>
                place.id
            )
        );

    const eventsByPlaceId =
        new Map();

    const peopleByPlaceId =
        new Map();

    places.forEach(place =>
    {
        eventsByPlaceId.set(
            place.id,
            []
        );

        peopleByPlaceId.set(
            place.id,
            getPeopleForPlace(
                place.id,
                {
                    projectId
                }
            )
        );
    });

    (
        sampleData.events || []
    )
        .filter(event =>
            event.projectId
            === projectId
        )
        .forEach(event =>
        {
            placeFilterRecordPlaceIds(
                event
            ).forEach(placeId =>
            {
                if (!placeIds.has(placeId))
                {
                    return;
                }

                eventsByPlaceId
                    .get(placeId)
                    ?.push(event);
            });
        });

    return {
        eventsByPlaceId,
        peopleByPlaceId
    };
}

function placeFilterDateText(value)
{
    if (
        value === null
        || value === undefined
    )
    {
        return '';
    }

    if (
        typeof value === 'string'
        || typeof value === 'number'
    )
    {
        return String(value);
    }

    return (
        formatGenealogyDateLabel(value)
        || ''
    );
}

function placeEventYearRange(event)
{
    const values = [
        event?.dateLabel,
        event?.date,
        event?.date2Label,
        event?.date2,
        event?.dateRangeLabel,
        event?.fromDate,
        event?.toDate,

        typeof formatGenealogyDateStartLabel
          === 'function'
            ? formatGenealogyDateStartLabel(
                event
            )
            : '',

        typeof formatGenealogyDateEndLabel
          === 'function'
            ? formatGenealogyDateEndLabel(
                event
            )
            : ''
    ];

    const years =
        values
            .map(placeFilterDateText)
            .flatMap(value =>
                String(value)
                    .match(
                        /\b[1-9]\d{2,3}\b/g
                    )
            || []
            )
            .map(Number)
            .filter(year =>
                Number.isInteger(year)
            && year >= 1
            && year <= 9999
            );

    if (!years.length)
    {
        return null;
    }

    return {
        from: Math.min(...years),
        to: Math.max(...years)
    };
}

function placeEventMatchesDateRange(
    event,
    filters
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    if (
        !normalized.yearFrom
        && !normalized.yearTo
    )
    {
        return true;
    }

    const range =
        placeEventYearRange(event);

    if (!range)
    {
        return false;
    }

    const filterFrom =
        normalized.yearFrom
            ? Number(normalized.yearFrom)
            : Number.NEGATIVE_INFINITY;

    const filterTo =
        normalized.yearTo
            ? Number(normalized.yearTo)
            : Number.POSITIVE_INFINITY;

    return (
        range.from <= filterTo
        && range.to >= filterFrom
    );
}

function eventLinkedPersonIds(event)
{
    return new Set([
        ...(
            Array.isArray(event?.personIds)
                ? event.personIds
                : []
        ),

        ...(
            Array.isArray(
                event?.relatedPersonIds
            )
                ? event.relatedPersonIds
                : []
        )
    ]);
}

function placeMatchesFilters(
    place,
    filters,
    context
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    if (
        normalized.country
        && placeCountry(place)
          !== normalized.country
    )
    {
        return false;
    }

    if (
        normalized.mapped === 'mapped'
        && !placeHasCoordinates(place)
    )
    {
        return false;
    }

    if (
        normalized.mapped === 'unmapped'
        && placeHasCoordinates(place)
    )
    {
        return false;
    }

    const linkedPeople =
        context.peopleByPlaceId
            .get(place.id)
        || [];

    const hasPersonCondition =
        Boolean(
            normalized.personId
          || normalized.surname
        );

    const matchingPeople =
        linkedPeople.filter(person =>
        {
            if (
                normalized.personId
            && person.id
              !== normalized.personId
            )
            {
                return false;
            }

            if (
                normalized.surname
            && placeFilterPersonSurname(
                person
            ).toLowerCase()
              !== normalized.surname
                  .toLowerCase()
            )
            {
                return false;
            }

            return true;
        });

    if (
        hasPersonCondition
        && !matchingPeople.length
    )
    {
        return false;
    }

    const hasEventCondition =
        Boolean(
            normalized.eventType
          || normalized.yearFrom
          || normalized.yearTo
        );

    if (hasEventCondition)
    {
        const linkedEvents =
            context.eventsByPlaceId
                .get(place.id)
          || [];

        const matchingPersonIds =
            new Set(
                matchingPeople.map(person =>
                    person.id
                )
            );

        const eventMatches =
            linkedEvents.some(event =>
            {
                if (
                    normalized.eventType
              && event.type
                !== normalized.eventType
                )
                {
                    return false;
                }

                if (
                    !placeEventMatchesDateRange(
                        event,
                        normalized
                    )
                )
                {
                    return false;
                }

                /*
            * When person/surname and event/date
            * filters are combined, require one
            * event associated with the matching
            * person rather than unrelated records
            * at the same place.
            */
                if (
                    hasPersonCondition
                )
                {
                    const eventPeople =
                        eventLinkedPersonIds(
                            event
                        );

                    if (
                        ![
                            ...matchingPersonIds
                        ].some(personId =>
                            eventPeople.has(personId)
                        )
                    )
                    {
                        return false;
                    }
                }

                return true;
            });

        if (!eventMatches)
        {
            return false;
        }
    }

    return true;
}

function renderPlacesListPanel(list)
{
    if (!list.length) return '<div class="places-empty"><strong>No places found</strong><span>Try clearing the search or filters.</span></div>';
    return `
        <div class="places-list-panel">

          <div class="places-list-head">
            <span>Place</span>
            <span>Country</span>
            <span>Map</span>
            <span>Linked people</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          ${list.map(place =>
            {
                const counts =
                    getPlaceConnectionCounts(
                        place.id
                    );

                const linkedPeople = counts.people;
                const issueCount = getActivePlaceReviewIssues(place).length;
                const reviewIndicator = issueCount
                    ? `<button class="places-list-review" type="button" data-place-review-link="${escapeHtml(place.id)}">${issueCount > 1 ? `${issueCount} issues` : 'Needs review'}</button>`
                    : '';
                return `<div class="places-list-row ${place.id === state.selectedPlaceId ? 'active' : ''}" data-place-id="${escapeHtml(place.id)}" tabindex="0" role="row" aria-selected="${place.id === state.selectedPlaceId}"><div><strong>${escapeHtml(placePrimaryName(place))}</strong><span>${escapeHtml(placeSecondaryName(place) || 'No broader place recorded')}</span>${reviewIndicator}</div><span>${escapeHtml(placeCountry(place) || 'Unknown')}</span><span>${placeHasCoordinates(place) ? 'On map' : 'Not on map'}</span><span>${linkedPeople}</span><span>${escapeHtml(formatPlaceUpdatedAt(place.updatedAt))}</span><button class="places-row-more" type="button" data-place-menu="${escapeHtml(place.id)}" aria-label="More actions for ${escapeHtml(place.name)}" aria-haspopup="menu">${icon.more}</button></div>`;
            }).join('')}</div>`;
}

function routeExcludedReasonSummary(route)
{
    const counts = route?.excludedByReason || {};
    return [
        counts.missingDate ? `${counts.missingDate} ${t('undated')}` : '',
        counts.missingPlace ? `${counts.missingPlace} ${t('without place')}` : '',
        counts.missingCoordinates ? `${counts.missingCoordinates} ${t('unmapped')}` : ''
    ].filter(Boolean).join(' - ');
}

function renderPlacesRouteSummary()
{
    if (!state.placesShowRoute) return '';
    const route = normalizePlacesRouteSelection();
    if (!route.configured) return '';
    const metrics = [
        `${route.stops.length} ${t(route.stops.length === 1 ? 'stop' : 'stops')}`,
        `${route.distinctPlaceCount} ${t(route.distinctPlaceCount === 1 ? 'place' : 'places')}`,
        route.mode === 'surname'
            ? `${route.peopleCount} ${t(route.peopleCount === 1 ? 'person' : 'people')}`
            : '',
        route.dateSpan
    ].filter(Boolean).join(' - ');
    const excludedSummary = routeExcludedReasonSummary(route);
    return `
        <section class="places-route-summary ${route.available ? '' : 'is-unavailable'}" aria-live="polite" aria-label="${escapeHtml(t('Active route'))}">
          <div class="places-route-summary-head">
            <div class="places-route-summary-icon" aria-hidden="true">${route.available ? icon.link : icon.warning}</div>
            <div class="places-route-summary-title">
              <strong>${escapeHtml(route.subject)}</strong>
              <span>${escapeHtml(t(route.mode === 'surname' ? 'Surname route' : 'Person route'))}</span>
            </div>
            <div class="places-route-summary-actions">
              <button class="places-route-change" type="button" data-route-change>${escapeHtml(t('Change'))}</button>
              <button class="places-route-clear" type="button" data-route-panel-clear aria-label="${escapeHtml(t('Clear route'))}" title="${escapeHtml(t('Clear route'))}">${icon.close}</button>
            </div>
          </div>
          ${route.available
                ? `<div class="places-route-summary-metrics">${escapeHtml(metrics)}</div>`
                : `<div class="places-route-summary-warning">${escapeHtml(t('Route needs at least two dated, mapped places.'))}</div>`}
          ${route.excludedCount > 0
                ? `<div class="places-route-summary-excluded">${route.excludedCount} ${escapeHtml(t(route.excludedCount === 1 ? 'event excluded' : 'events excluded'))}${excludedSummary ? ` - ${escapeHtml(excludedSummary)}` : ''}</div>`
                : ''}
        </section>`;
}

function renderPlacesMapShell(list)
{
    const route = normalizePlacesRouteSelection();
    return `
        <section
          class="places-map-panel"
          aria-label="Places map">

          <div
            id="placesLeafletMap"
            class="places-leaflet-map">
          </div>

          ${renderPlacesRouteSummary()}

          <div class="places-map-navigation-wrap">
            <div
              class="places-map-legend"
              id="placesMapInfoPanel"
              role="region"
              aria-label="Map legend"
              ${
                    state.placesMapInfoExpanded
                        ? ''
                        : 'hidden'
                }>

              <strong class="places-map-legend-title">
                Map legend
              </strong>

              <div class="places-map-legend-item">
                <span
                  class="places-map-legend-marker"
                  aria-hidden="true">
                </span>

                <span>Place</span>
              </div>

              <div class="places-map-legend-item">
                <span
                  class="
                    places-map-legend-marker
                    selected
                  "
                  aria-hidden="true">
                </span>

                <span>Selected place</span>
              </div>

              ${state.placesShowRoute && route.available ? `
                <div class="places-map-legend-item">
                  <span class="places-map-legend-route" aria-hidden="true"></span>
                  <span>${escapeHtml(t(route.mode === 'surname' ? 'Surname route' : 'Person route'))}</span>
                </div>` : ''}
            </div>

            <div
              class="places-map-navigation"
              aria-label="Map navigation">

              <button
                type="button"
                data-map-zoom-out
                aria-label="Zoom out"
                title="Zoom out">
                ${icon.minus || icon.close}
              </button>

              <button
                type="button"
                data-map-zoom-in
                aria-label="Zoom in"
                title="Zoom in">
                ${icon.plus}
              </button>

              <button
                type="button"
                data-map-fit
                aria-label="Centre map on places"
                title="Centre map on places">
                ${icon.mapCenter}
              </button>

              <button
                class="${
                    state.placesMapInfoExpanded
                        ? 'active'
                        : ''
                }"
                type="button"
                id="placesMapInfoToggle"
                aria-label="Show map legend"
                title="Map legend"
                aria-controls="placesMapInfoPanel"
                aria-expanded="${
                    state.placesMapInfoExpanded
                }">
                ${icon.help || icon.tip}
              </button>
            </div>
          </div>

          <div
            class="places-map-status"
            data-places-map-status
            hidden>
          </div>

          <div
            class="places-coordinate-bar"
            data-places-coordinate-bar
            hidden>

            <div class="places-coordinate-summary">
              <strong data-places-coordinate-output>
                No point selected
              </strong>

              <span
                data-places-map-instruction
                hidden>
              </span>
            </div>

            <button
              class="button secondary"
              type="button"
              id="placesUseMapCentre">
              Use map centre
            </button>

            <button
              class="button secondary"
              type="button"
              id="placesCopyCoordinates"
              disabled>
              Copy
            </button>

            <button
              class="button secondary"
              type="button"
              id="placesCancelMapEdit">
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              id="placesConfirmMapEdit"
              disabled>
              Use position
            </button>
          </div>
        </section>
      `;
}

const PLACE_INSPECTOR_LIMITS =
    Object.freeze({
        personGroups: 5,
        eventsPerPerson: 3,
        photos: 3,
        files: 3,
        notes: CONNECTED_NOTES_PREVIEW_LIMIT
    });

function placesInspectorSectionState()
{
    const defaults = {
        names: true,
        events: true,
        photos: false,
        files: false,
        notes: false,
        sources: false
    };

    state.placesInspectorSections = {
        ...defaults,
        ...(
            state.placesInspectorSections
          || {}
        )
    };

    return state
        .placesInspectorSections;
}

function placesInspectorSectionIsOpen(
    key
)
{
    return Boolean(
        placesInspectorSectionState()[
            key
        ]
    );
}

function placeInspectorCountLabel(
    count,
    singular,
    plural = `${singular}s`
)
{
    return `${count} ${
        count === 1
            ? singular
            : plural
    }`;
}

function placeInspectorPersonName(
    person
)
{
    return (
        person?.names?.display
        || person?.name
        || 'Unnamed person'
    );
}

function placeInspectorEventLabel(
    event
)
{
    if (event?.title)
    {
        return event.title;
    }

    if (event?.eventType)
    {
        return event.eventType;
    }

    if (event?.typeLabel)
    {
        return event.typeLabel;
    }

    if (
        typeof placeEventTypeLabel
          === 'function'
    )
    {
        return placeEventTypeLabel(
            event?.type
        );
    }

    return event?.type
        || 'Event';
}

function placeInspectorEventDateLabel(
    event
)
{
    const label =
        formatGenealogyDateLabel(
            event?.date || event
        )
        || event?.dateLabel
        || event?.date?.dateLabel
        || 'Date unknown';

    /*
      * Use natural day formatting in the compact
      * inspector: "2 Jan" rather than "02 Jan".
      */
    return String(label)
        .replace(
            /^0(?=\d(?:\s|[./-]))/,
            ''
        );
}

function placeInspectorEventSortValue(
    event
)
{
    const rawSortDate =
        String(
            event?.date?.sortDate
          || event?.sortDate
          || ''
        )
            .replace(/\D/g, '');

    if (rawSortDate)
    {
        return Number(
            rawSortDate
                .slice(0, 8)
                .padEnd(8, '0')
        );
    }

    const dateLabel =
        placeInspectorEventDateLabel(
            event
        );

    const year =
        dateLabel.match(
            /\b[1-9]\d{3}\b/
        );

    return year
        ? Number(year[0]) * 10000
        : Number.MAX_SAFE_INTEGER;
}

function placeInspectorEventOwnerIds(
    event
)
{
    const personIds = [
        ...new Set(
            (
                Array.isArray(
                    event?.personIds
                )
                    ? event.personIds
                    : []
            ).filter(Boolean)
        )
    ];

    if (personIds.length)
    {
        return personIds;
    }

    /*
      * Fall back to related people only for records
      * that do not define a primary event owner.
      */
    return [
        ...new Set(
            (
                Array.isArray(
                    event?.relatedPersonIds
                )
                    ? event.relatedPersonIds
                    : []
            ).filter(Boolean)
        )
    ];
}

function placeInspectorEventRelatedPeople(
    event,
    personId
)
{
    const relatedIds = [
        ...new Set([
            ...(
                Array.isArray(
                    event?.personIds
                )
                    ? event.personIds
                    : []
            ),

            ...(
                Array.isArray(
                    event?.relatedPersonIds
                )
                    ? event.relatedPersonIds
                    : []
            )
        ])
    ]
        .filter(id =>
            id
          && id !== personId
        );

    return relatedIds
        .map(id =>
            getPerson(id)
        )
        .filter(Boolean);
}

function placeInspectorChildRoleLabel(
    person
)
{
    if (
        person?.gender === 'female'
    )
    {
        return 'Daughter';
    }

    if (
        person?.gender === 'male'
    )
    {
        return 'Son';
    }

    return 'Child';
}

function placeInspectorEventPresentation(
    event,
    personId
)
{
    const date =
        placeInspectorEventDateLabel(
            event
        );

    if (
        event?.type === 'childBirth'
    )
    {
        const child =
            (
                event.relatedPersonIds
            || []
            )
                .map(id =>
                    getPerson(id)
                )
                .find(Boolean);

        const relationship =
            child
                ? `${
                    placeInspectorChildRoleLabel(
                        child
                    )
                } ${
                    placeInspectorPersonName(
                        child
                    )
                }`
                : String(
                    event.description || ''
                ).trim();

        return {
            title:
            event.title
            || 'Birth of child',

            date,

            relationship
        };
    }

    if (
        event?.type === 'marriage'
    )
    {
        const spouses =
            placeInspectorEventRelatedPeople(
                event,
                personId
            );

        return {
            title:
            event.title
            || 'Marriage',

            date,

            relationship:
            spouses.length
                ? `${
                    spouses.length === 1
                        ? 'Spouse'
                        : 'Spouses'
                } ${
                    spouses
                        .map(
                            placeInspectorPersonName
                        )
                        .join(' and ')
                }`
                : ''
        };
    }

    const relatedPeople =
        placeInspectorEventRelatedPeople(
            event,
            personId
        );

    return {
        title:
          placeInspectorEventLabel(
              event
          ),

        date,

        relationship:
          relatedPeople.length
              ? `Related to ${
                  relatedPeople
                      .map(
                          placeInspectorPersonName
                      )
                      .join(', ')
              }`
              : ''
    };
}

function placeInspectorEventGroups(
    events
)
{
    const groups =
        new Map();

    const otherEvents =
        [];

    (
        Array.isArray(events)
            ? events
            : []
    ).forEach(event =>
    {
        const ownerIds =
            placeInspectorEventOwnerIds(
                event
            );

        let addedToPerson =
            false;

        ownerIds.forEach(personId =>
        {
            const person =
                getPerson(personId);

            if (!person)
            {
                return;
            }

            let group =
                groups.get(person.id);

            if (!group)
            {
                group = {
                    person,
                    events: []
                };

                groups.set(
                    person.id,
                    group
                );
            }

            group.events.push(
                event
            );

            addedToPerson =
                true;
        });

        if (!addedToPerson)
        {
            otherEvents.push(
                event
            );
        }
    });

    const sortedGroups =
        [...groups.values()]
            .map(group => ({
                ...group,

                events:
              group.events
                  .slice()
                  .sort(
                      (
                          first,
                          second
                      ) =>
                          placeInspectorEventSortValue(
                              first
                          )
                    - placeInspectorEventSortValue(
                        second
                    )
                  )
            }))
            .sort(
                (
                    first,
                    second
                ) =>
                {
                    const firstDate =
                        first.events.length
                            ? placeInspectorEventSortValue(
                                first.events[0]
                            )
                            : Number.MAX_SAFE_INTEGER;

                    const secondDate =
                        second.events.length
                            ? placeInspectorEventSortValue(
                                second.events[0]
                            )
                            : Number.MAX_SAFE_INTEGER;

                    return (
                        firstDate
                - secondDate
                || placeInspectorPersonName(
                    first.person
                ).localeCompare(
                    placeInspectorPersonName(
                        second.person
                    )
                )
                    );
                }
            );

    otherEvents.sort(
        (
            first,
            second
        ) =>
            placeInspectorEventSortValue(
                first
            )
          - placeInspectorEventSortValue(
              second
          )
    );

    return {
        groups:
          sortedGroups,

        otherEvents
    };
}

function renderPlaceInspectorEventRows(
    events,
    personId = '',
    showAll = false
)
{
    const source =
        Array.isArray(events)
            ? events
            : [];

    if (!source.length)
    {
        return `
          <span
            class="
              places-inspector-person-empty
            ">
            No dated events recorded.
          </span>
        `;
    }

    const visibleEvents =
        showAll
            ? source
            : source.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .eventsPerPerson
            );

    return `
        <span
          class="
            places-inspector-event-list
          ">

          ${visibleEvents
                .map(event =>
                {
                    const presentation =
                        placeInspectorEventPresentation(
                            event,
                            personId
                        );

                    return `
                <span
                  class="
                    places-inspector-event-row
                  ">

                  <strong
                    class="
                      places-inspector-event-title
                    ">
                    ${escapeHtml(
                        presentation.title
                    )}
                  </strong>

                  <span
                    class="
                      places-inspector-event-meta
                    ">

                    <span
                      class="
                        places-inspector-event-date
                      ">
                      ${escapeHtml(
                            presentation.date
                        )}
                    </span>

                    ${
                        presentation.relationship
                            ? `
                          <span
                            class="
                              places-inspector-event-separator
                            "
                            aria-hidden="true">
                            ·
                          </span>

                          <span
                            class="
                              places-inspector-event-relationship
                            ">
                            ${escapeHtml(
                                presentation.relationship
                            )}
                          </span>
                        `
                            : ''
                    }
                  </span>
                </span>
              `;
                })
                .join('')}

          ${
                !showAll
            && source.length
              > visibleEvents.length
                    ? `
                <span
                  class="
                    places-inspector-more-count
                  ">
                  +${
                        source.length
                    - visibleEvents.length
                    } more events
                </span>
              `
                    : ''
            }
        </span>
      `;
}

function renderPlaceInspectorEvents(
    events
)
{
    if (!events.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected events.
          </div>
        `;
    }

    const {
        groups,
        otherEvents
    } =
        placeInspectorEventGroups(
            events
        );

    const showAll =
        Boolean(
            state
                .placesInspectorShowAllEvents
        );

    const visibleGroups =
        showAll
            ? groups
            : groups.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .personGroups
            );

    const visibleOtherEvents =
        showAll
            ? otherEvents
            : otherEvents.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .eventsPerPerson
            );

    const canToggle =
        groups.length
          > PLACE_INSPECTOR_LIMITS
              .personGroups
        || groups.some(group =>
            group.events.length
            > PLACE_INSPECTOR_LIMITS
                .eventsPerPerson
        )
        || otherEvents.length
          > PLACE_INSPECTOR_LIMITS
              .eventsPerPerson;

    const toggleMarkup =
        canToggle
            ? `
            <button
              class="
                panel-section-view-all
                places-inspector-events-toggle
              "
              type="button"
              data-place-events-toggle>
              <span>${showAll ? 'Show less' : 'View all events'}</span>
              <span class="panel-section-view-all-icon" aria-hidden="true">${icon.chevron}</span>
            </button>
          `
            : '';

    return `
        <div
          class="
            places-inspector-person-groups
          ">

          ${
                showAll
                    ? toggleMarkup
                    : ''
            }

          ${visibleGroups
                .map(group =>
                {
                    const eventCountLabel =
                        placeInspectorCountLabel(
                            group.events.length,
                            'connected event'
                        );

                    return `
                <button
                  class="
                    places-inspector-person-card
                  "
                  type="button"
                  data-place-connected-person="${
                        escapeHtml(
                            group.person.id
                        )
                    }"
                  aria-label="Open ${
                        escapeHtml(
                            placeInspectorPersonName(
                                group.person
                            )
                        )
                    } profile">

                  ${renderPersonAvatar(
                        group.person,
                        'places-inspector-person-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span
                    class="
                      places-inspector-person-card-body
                    ">

                    <span
                      class="
                        places-inspector-person-card-header
                      ">

                      <span
                        class="
                          places-inspector-person-identity
                        ">

                        <strong>
                          ${escapeHtml(
                                placeInspectorPersonName(
                                    group.person
                                )
                            )}
                        </strong>

                        <span>
                          ${escapeHtml(
                                eventCountLabel
                            )}
                        </span>
                      </span>

                      <span
                        class="
                          places-inspector-person-chevron
                        "
                        aria-hidden="true">
                        ${icon.chevron}
                      </span>
                    </span>

                    ${renderPlaceInspectorEventRows(
                        group.events,
                        group.person.id,
                        showAll
                    )}
                  </span>
                </button>
              `;
                })
                .join('')}

          ${
                visibleOtherEvents.length
                    ? `
                <div
                  class="
                    places-inspector-other-events
                  ">

                  <strong>
                    Other events
                  </strong>

                  ${renderPlaceInspectorEventRows(
                        visibleOtherEvents,
                        '',
                        true
                    )}
                </div>
              `
                    : ''
            }

          ${toggleMarkup}
        </div>
      `;
}

function renderPlaceInspectorPhotos(
    photos
)
{
    if (!photos.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected photos.
          </div>
        `;
    }

    const visible =
        photos.slice(
            0,
            PLACE_INSPECTOR_LIMITS.photos
        );

    return `
        <div class="connected-photo-grid">
          ${visible
                .map(photo =>
                {
                    const label =
                        photo.title
                || photo.filename
                || 'Photo';

                    return `
                <button
                  class="connected-photo-button"
                  type="button"
                  data-place-connected-photo="${
                        escapeHtml(photo.id)
                    }"
                  title="${
                        escapeHtml(label)
                    }"
                  aria-label="Open ${
                        escapeHtml(label)
                    }">

                  ${renderPhotoThumbnail(
                        photo,
                        { label }
                    )}
                </button>
              `;
                })
                .join('')}
        </div>

        <button
          class="panel-section-view-all"
          type="button"
          data-place-view-all-photos>
          <span>View all photos</span>
          <span
            class="panel-section-view-all-icon"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorFiles(
    files,
    placeId =
        ''
)
{
    if (!files.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">

            No connected files.
          </div>
        `;
    }

    const visible =
        files.slice(
            0,
            PLACE_INSPECTOR_LIMITS
                .files
        );

    return `
        ${renderConnectedFileList({
            files:
            visible,

            contextType:
            'place',

            contextId:
            placeId,

            emptyText:
            'No connected files.'
        })}

        <button
          class="
            panel-section-view-all
          "
          type="button"
          data-place-view-all-files>

          <span>
            View all files
          </span>

          <span
            class="
              panel-section-view-all-icon
            "
            aria-hidden="true">

            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorNotes(
    notes
)
{
    if (!notes.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected notes.
          </div>
        `;
    }

    const placeId =
        state.selectedPlaceId
        || '';

    const list =
        renderConnectedNoteList({
            notes,

            contextType:
            'place',

            contextId:
            placeId,

            limit:
            PLACE_INSPECTOR_LIMITS
                .notes,

            emptyText:
            'No connected notes.'
        });

    return `
        ${list}

        <button
          class="
            panel-section-view-all
          "
          type="button"
          data-place-view-all-notes>

          <span>View all notes</span>

          <span
            class="
              panel-section-view-all-icon
            "
            aria-hidden="true">

            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorSection({
    key,
    title,
    countLabel = '',
    content,
    actionHtml = ''
})
{
    const open =
        placesInspectorSectionIsOpen(
            key
        );

    return `
        <details
          class="
            places-inspector-section
            ${
                actionHtml
                    ? 'has-action'
                    : ''
            }
          "
          id="placeInspectorSection-${escapeHtml(
                key
            )}"
          data-place-inspector-section="${escapeHtml(
                key
            )}"
          ${open ? 'open' : ''}>

          <summary>
            <span>
              ${escapeHtml(title)}
            </span>

            <span
              class="
                places-inspector-section-summary-meta
              ">

              ${
                    countLabel
                        ? `
                    <span
                      class="
                        places-inspector-section-count
                      ">
                      ${escapeHtml(
                            countLabel
                        )}
                    </span>
                  `
                        : ''
                }

              <span
                class="
                  places-inspector-section-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </summary>

          ${
                actionHtml
                    ? `
                <div
                  class="
                    places-inspector-section-action
                  ">
                  ${actionHtml}
                </div>
              `
                    : ''
            }

          <div
            class="
              places-inspector-section-body
            ">
            ${content}
          </div>
        </details>
      `;
}

function rerenderPlacesInspector({
    preserveScroll = true
} = {})
{
    const inspector =
        main.querySelector(
            '[data-places-inspector]'
        );

    if (!inspector)
    {
        return;
    }

    const previousScrollTop =
        inspector.scrollTop;

    inspector.innerHTML =
        renderPlacesInspector(
            getPlace(
                state.selectedPlaceId
            )
        );

    bindPlacesInspectorControls(
        inspector
    );

    if (preserveScroll)
    {
        requestAnimationFrame(() =>
        {
            inspector.scrollTop =
                previousScrollTop;
        });
    }
}

function renderPlacesInspector(
    place
)
{
    if (
        state.placesInspectorCollapsed
    )
    {
        return `
          <button
            class="
              people-collapse-button
              person-sidebar-restore-button
              albums-detail-restore
              sidebar-toggle-icon
              sidebar-toggle-icon-restore
            "
            type="button"
            data-places-inspector-toggle
            aria-label="Expand place inspector"
            aria-expanded="false"
            title="Expand place inspector">
            ${icon.doublechevronSidebar}
          </button>
        `;
    }

    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            albums-detail-collapse
          "
          type="button"
          data-places-inspector-toggle
          aria-label="Collapse place inspector"
          aria-expanded="true"
          title="Collapse place inspector">
          ${icon.doublechevronSidebar}
        </button>
      `;

    const toolbar = `
        <div
          class="
            albums-detail-toolbar
            places-inspector-toolbar
          ">

          ${collapseButton}

          <span
            class="
              albums-detail-toolbar-spacer
            ">
          </span>

          ${
                place
                    ? `
                <button
                  class="
                    albums-detail-action
                  "
                  type="button"
                  data-places-inspector-edit="${
                        escapeHtml(place.id)
                    }"
                  aria-label="Edit place"
                  title="Edit place">
                  ${icon.edit}
                </button>

                <button
                  class="
                    albums-detail-action
                  "
                  type="button"
                  data-place-menu="${
                        escapeHtml(place.id)
                    }"
                  aria-label="More actions for ${
                        escapeHtml(
                            placePrimaryName(place)
                        )
                    }"
                  aria-haspopup="menu"
                  title="More actions">
                  ${icon.more}
                </button>
              `
                    : ''
            }
        </div>
      `;

    if (!place)
    {
        return `
          ${toolbar}

          <div
            class="
              places-inspector-empty
            ">

            <strong>
              No place selected
            </strong>

            <span>
              Select a place to view
              its information.
            </span>
          </div>
        `;
    }

    const people =
        getPeopleForPlace(
            place.id
        );

    const events =
        getEventsForPlace(
            place.id
        );

    const photos =
        getPhotosForPlace(
            place.id
        );

    const files =
        getArchiveFilesForPlace(
            place.id
        );

    const notes =
        getNotesForPlace(
            place.id
        );

    const sources =
        sourcesForTarget(
            'place',
            place.id,
            place.projectId
        );

    const alternatives =
        placeAlternativeNames(
            place
        );

    const reviewIssues =
        getActivePlaceReviewIssues(place);

    const firstReviewIssue =
        reviewIssues[0] || null;

    const bannerOwnsCoordinateAction =
        Boolean(
            firstReviewIssue
          && PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(
              firstReviewIssue.type
          )
        );

    const hasCoordinates =
        placeHasCoordinates(
            place
        );

    const tags = [
        {
            key: 'people',
            target: 'events',
            label:
            placeInspectorCountLabel(
                people.length,
                'person',
                'people'
            )
        },
        {
            key: 'events',
            target: 'events',
            label:
            placeInspectorCountLabel(
                events.length,
                'event'
            )
        },
        {
            key: 'photos',
            target: 'photos',
            label:
            placeInspectorCountLabel(
                photos.length,
                'photo'
            )
        },
        {
            key: 'files',
            target: 'files',
            label:
            placeInspectorCountLabel(
                files.length,
                'file'
            )
        },
        {
            key: 'notes',
            target: 'notes',
            label:
            placeInspectorCountLabel(
                notes.length,
                'note'
            )
        },
        {
            key:
            'sources',

            target:
            'sources',

            label:
            placeInspectorCountLabel(
                sources.length,
                'source'
            )
        }
    ];

    const namesContent =
        alternatives.length
            ? `
            <div
              class="
                places-inspector-name-list
              ">
              ${alternatives
                    .map(name => `
                  <span>
                    ${escapeHtml(name)}
                  </span>
                `)
                    .join('')}
            </div>
          `
            : `
            <div
              class="
                places-inspector-section-empty
              ">
              No historical or
              alternative names recorded.
            </div>
          `;

    return `
        ${toolbar}

        <div
          class="
            places-inspector-content
          ">

          <section
            class="
              places-inspector-summary
            ">

            <h2>
              ${escapeHtml(
                    placePrimaryName(place)
                )}
            </h2>

            <p>
              ${escapeHtml(
                    placeSecondaryName(place)
                || 'No broader place recorded'
                )}
            </p>

            <div
              class="
                places-inspector-tags
                app-chip-row
              "
              aria-label="Connected records">

              ${tags
                    .map(tag => `
                  <button
                    class="
                      app-chip
                      app-chip--${escapeHtml(
                            tag.key
                        )}
                    "
                    type="button"
                    data-place-inspector-jump="${
                        escapeHtml(
                            tag.target
                        )
                    }"
                    aria-controls="placeInspectorSection-${
                        escapeHtml(
                            tag.target
                        )
                    }">
                    ${escapeHtml(
                        tag.label
                    )}
                  </button>
                `)
                    .join('')}
            </div>

            ${
                firstReviewIssue
                    ? `
                  <div class="places-attention" role="group" aria-label="Needs review: ${escapeHtml(firstReviewIssue.title)}">
                    <div class="places-attention-header">
                      <div class="places-attention-copy">
                        ${icon.warning}
                        <span><strong>${escapeHtml(firstReviewIssue.title)}</strong>${reviewIssues.length > 1 ? `<small>${reviewIssues.length} issues</small>` : ''}</span>
                      </div>
                      ${state.placesView === 'review' ? '' : `
                        <button class="places-attention-open" type="button" data-place-review-view="${escapeHtml(place.id)}" aria-label="Open review for ${escapeHtml(placePrimaryName(place))}">
                          ${icon.openlink}
                          <span>Open review</span>
                        </button>
                      `}
                    </div>
                    <p class="places-attention-description">${escapeHtml(firstReviewIssue.description)}</p>
                    <div class="places-attention-actions">
                      <button class="places-attention-fix" type="button" data-place-review-fix="${escapeHtml(place.id)}" data-place-review-type="${escapeHtml(firstReviewIssue.type)}">
                        ${icon.mapPin}
                        <span>${escapeHtml(firstReviewIssue.actionLabel)}</span>
                      </button>
                      <button class="places-attention-dismiss" type="button" data-place-review-dismiss="${escapeHtml(place.id)}" data-place-review-type="${escapeHtml(firstReviewIssue.type)}">
                        ${icon.close}
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                `
                    : ''
            }
          </section>

          <div
            class="
              places-inspector-coordinate-row
            ">

            <span
              class="
                places-inspector-coordinate-label
              ">
              Coordinates
            </span>

            <strong>
              ${escapeHtml(
                    hasCoordinates
                        ? formatPlaceCoordinates(
                            place
                        )
                        : 'Not on map'
                )}
            </strong>

            ${bannerOwnsCoordinateAction ? '' : `
              <button
                class="
                  places-inspector-coordinate-action
                "
                type="button"
                data-places-edit-position="${
                    escapeHtml(place.id)
                }"
                aria-label="${
                    hasCoordinates
                        ? 'Edit position'
                        : 'Add position'
                }"
                title="${
                    hasCoordinates
                        ? 'Edit position'
                        : 'Add position'
                }">

                ${icon.edit}

                <span>
                  ${
                        hasCoordinates
                            ? 'Edit'
                            : 'Add'
                    }
                </span>
              </button>
            `}
          </div>

          ${renderPlaceInspectorSection({
                key:
              'names',

                title:
              'Historical / alternative names',

                countLabel:
              placeInspectorCountLabel(
                  alternatives.length,
                  'name'
              ),

                content:
              namesContent
            })}

          ${renderPlaceInspectorSection({
                key:
              'events',
                title:
              'Connected events',
                countLabel:
              placeInspectorCountLabel(
                  events.length,
                  'event'
              ),
                content:
              renderPlaceInspectorEvents(
                  events
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'photos',

                title:
              'Connected photos',

                countLabel:
              placeInspectorCountLabel(
                  photos.length,
                  'photo'
              ),

                content:
              renderPlaceInspectorPhotos(
                  photos
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'files',

                title:
              'Connected files',

                countLabel:
              placeInspectorCountLabel(
                  files.length,
                  'file'
              ),

                content:
              renderPlaceInspectorFiles(
                  files,
                  place.id
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'notes',

                title:
              'Connected notes',

                countLabel:
              placeInspectorCountLabel(
                  notes.length,
                  'note'
              ),

                content:
              renderPlaceInspectorNotes(
                  notes
              )
            })}
          ${renderPlaceInspectorSection({
                key:
              'sources',

                title:
              'Connected sources',

                countLabel:
              placeInspectorCountLabel(
                  sources.length,
                  'source'
              ),

                content:
              renderConnectedSourceList({
                  targetType:
                  'place',

                  targetId:
                  place.id,

                  projectId:
                  place.projectId,

                  sources,

                  emptyText:
                  'No sources linked to this place.'
              })
            })}
        </div>
      `;
}

function bindPlacesInspectorControls(
    root
)
{
    bindConnectedNoteLinks(
        root
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
                !== 'place'
                )
                {
                    return;
                }

                rerenderPlacesInspector({
                    preserveScroll:
                  true
                });
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
                    targetType !== 'place'
                )
                {
                    return;
                }

                placesInspectorSectionState()
                    .sources = true;

                rerenderPlacesInspector({
                    preserveScroll:
                  true
                });
            }
        }
    );
    root
        .querySelector(
            '[data-places-inspector-toggle]'
        )
        ?.addEventListener(
            'click',
            togglePlacesInspector
        );

    root
        .querySelector(
            '[data-places-inspector-edit]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                openPlaceModal(
                    event.currentTarget
                        .dataset
                        .placesInspectorEdit
                );
            }
        );

    root
        .querySelector(
            '[data-place-menu]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();

                openPlaceActionsMenu(
                    event.currentTarget
                        .dataset
                        .placeMenu,

                    event.currentTarget
                );
            }
        );

    root
        .querySelector(
            '[data-places-edit-position]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                enterPlacesMapMoveMode(
                    event.currentTarget
                        .dataset
                        .placesEditPosition
                );
            }
        );

    root.querySelector('[data-place-review-fix]')?.addEventListener('click', event =>
    {
        const button = event.currentTarget;
        if (button.dataset.placeReviewType === 'invalid_coordinates') openPlaceModalForCoordinateReview(button.dataset.placeReviewFix);
        else openPlaceModal(button.dataset.placeReviewFix);
    });

    root.querySelector('[data-place-review-view]')?.addEventListener('click', event =>
    {
        openPlacesNeedsReview(event.currentTarget.dataset.placeReviewView);
    });

    root.querySelector('[data-place-review-dismiss]')?.addEventListener('click', event =>
    {
        const button = event.currentTarget;
        if (!dismissPlaceReviewIssue(button.dataset.placeReviewDismiss, button.dataset.placeReviewType)) return;
        renderPlaces();
        showToast('Review item dismissed.');
    });

    root
        .querySelectorAll(
            '[data-place-inspector-section]'
        )
        .forEach(details =>
        {
            details.addEventListener(
                'toggle',
                () =>
                {
                    const key =
                        details.dataset
                            .placeInspectorSection;

                    if (!key)
                    {
                        return;
                    }

                    placesInspectorSectionState()[
                        key
                    ] = details.open;
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-inspector-jump]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const key =
                        button.dataset
                            .placeInspectorJump;

                    if (!key)
                    {
                        return;
                    }

                    placesInspectorSectionState()[
                        key
                    ] = true;

                    rerenderPlacesInspector();

                    requestAnimationFrame(() =>
                    {
                        main
                            .querySelector(
                                `#placeInspectorSection-${key}`
                            )
                            ?.scrollIntoView({
                                behavior:
                      'smooth',

                                block:
                      'start'
                            });
                    });
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-connected-person]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openPlaceInspectorPerson(
                        button.dataset
                            .placeConnectedPerson
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-connected-photo]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openAlbumsForPhoto(
                        button.dataset
                            .placeConnectedPhoto
                    );
                }
            );
        });
    root
        .querySelector(
            '[data-place-view-all-photos]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openAlbumsForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-view-all-files]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openArchiveForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-view-all-notes]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openNotesForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-events-toggle]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state
                    .placesInspectorShowAllEvents =
                        !state
                            .placesInspectorShowAllEvents;

                rerenderPlacesInspector();
            }
        );
}

function togglePlacesInspector()
{
    state.placesInspectorCollapsed =
        !state.placesInspectorCollapsed;

    const shell =
        main.querySelector(
            '.places-shell'
        );

    const inspector =
        main.querySelector(
            '[data-places-inspector]'
        );

    shell
        ?.classList
        .toggle(
            'inspector-collapsed',
            state.placesInspectorCollapsed
        );

    inspector
        ?.classList
        .toggle(
            'collapsed',
            state.placesInspectorCollapsed
        );

    rerenderPlacesInspector({
        preserveScroll:
          false
    });

    /*
      * First frame applies the inspector-width change.
      * The second lets Leaflet measure the final map.
      */
    requestAnimationFrame(() =>
    {
        requestAnimationFrame(() =>
        {
            placesMapRuntime
                .map
                ?.invalidateSize({
                    pan: false
                });
        });
    });
}

function bindPlaceListRows(root, { showOnMapOnDoubleClick = false } = {})
{
    root.querySelectorAll('.places-list-panel [data-place-id]').forEach(row =>
    {
        row.addEventListener('click', event =>
        {
            if (event.target.closest('button,input,select,a')) return;
            selectPlace(row.dataset.placeId, { focusMap: false });
        });
        row.addEventListener('keydown', event =>
        {
            if (!['Enter', ' '].includes(event.key) || event.target.closest('button,input,select,a')) return;
            event.preventDefault();
            selectPlace(row.dataset.placeId, { focusMap: false });
        });
        if (showOnMapOnDoubleClick)
        {
            row.addEventListener('dblclick', event =>
            {
                if (event.target.closest('button,input,select,a')) return;
                showPlaceOnMap(row.dataset.placeId);
            });
        }
    });
}

function bindPlaceListMenus(root)
{
    root.querySelectorAll('.places-list-panel [data-place-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.stopPropagation();
            openPlaceActionsMenu(button.dataset.placeMenu, button);
        });
    });
}

function bindPlacesControls(list)
{
    bindSearchInput(
        main,
        '#placesSearch',
        'placesSearch',
        renderPlaces
    );
    main.querySelector('#placesAddPlace')?.addEventListener('click', () => openPlaceModal());
    main.querySelector('#placesFilterButton')?.addEventListener('click', event =>
    {
        openPlacesFilterPopover(event.currentTarget);
    });
    bindAppSortControl(main, {
        id: 'placesSort',
        options: APP_SORT_OPTIONS.places,
        getField: () => state.placesSort,
        getDirection: () =>
            state.placesSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.placesSort = field;
            state.placesSortDirection =
                direction;

            renderPlacesMain();
        }
    });
    main
        .querySelector(
            '#placesClearFilters'
        )
        ?.addEventListener(
            'click',
            clearPlaceFilters
        );

    main
        .querySelector(
            '#placesSaveFilter'
        )
        ?.addEventListener(
            'click',
            openSaveCurrentPlaceFilterModal
        );

    main
        .querySelectorAll(
            '[data-places-remove-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    removePlaceFilter(
                        button.dataset
                            .placesRemoveFilter
                    );
                }
            );
        });
    main.querySelectorAll('[data-places-mode]').forEach(button => button.addEventListener('click', () =>
    {
        if (placesMapRuntime.mode !== 'browse') cancelPlacesMapEditing();
        state.placesViewMode = button.dataset.placesMode;
        if (state.placesViewMode === 'list') destroyPlacesMap();
        renderPlacesMain();
    }));
    bindPlaceListRows(main, { showOnMapOnDoubleClick: state.placesViewMode === 'list' });
    bindPlaceListMenus(main);
    main.querySelectorAll('[data-place-review-link]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        openPlacesNeedsReview(button.dataset.placeReviewLink);
    }));
    main
        .querySelector(
            '#placesRouteMenu'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                openPlacesRouteMenu(
                    event.currentTarget
                );
            }
        );
    main.querySelector('[data-route-change]')?.addEventListener('click', event =>
    {
        openPlacesRouteMenu(event.currentTarget);
    });
    main.querySelector('[data-route-panel-clear]')?.addEventListener('click', () =>
    {
        clearPlacesRoute();
        renderPlacesMain();
    });
    bindPlacesInspectorControls(main.querySelector('[data-places-inspector]') || main);
    if (state.placesViewMode === 'map')
    {
        bindPlacesMapEditingControls();
        main.querySelector('[data-map-zoom-in]')?.addEventListener('click', () => placesMapRuntime.map?.zoomIn());
        main.querySelector('[data-map-zoom-out]')?.addEventListener('click', () => placesMapRuntime.map?.zoomOut());
        main.querySelector('[data-map-fit]')?.addEventListener('click', () => fitPlacesMap(list));
    }
    bindToasts(main);
}

function closePlacesFilterPopover()
{
    document
        .getElementById(
            'placesFilterPopover'
        )
        ?.remove();

    document
        .getElementById(
            'placesFilterButton'
        )
        ?.setAttribute(
            'aria-expanded',
            'false'
        );

    document.removeEventListener(
        'click',
        closePlacesFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closePlacesFilterOnEscape
    );
}

function closePlacesFilterOnOutside(
    event
)
{
    if (
        !event.target.closest(
            '#placesFilterPopover'
        )
        && !event.target.closest(
            '#placesFilterButton'
        )
    )
    {
        closePlacesFilterPopover();
    }
}

function closePlacesFilterOnEscape(
    event
)
{
    if (event.key === 'Escape')
    {
        closePlacesFilterPopover();
    }
}

function setPlacesFilterPopoverError(
    popover,
    message = ''
)
{
    const error =
        popover.querySelector(
            '[data-place-filter-error]'
        );

    if (!error)
    {
        return;
    }

    error.textContent =
        message;

    error.hidden =
        !message;
}

function openPlacesFilterPopover(
    anchor
)
{
    if (document.getElementById('placesFilterPopover'))
    {
        closePlacesFilterPopover();
        return;
    }
    closePlacesFilterPopover();
    closeMenu();
    const filters =
        placeFiltersWithDefaults();
    const popover =
        document.createElement(
            'div'
        );
    popover.className = `
        people-filter-popover
        places-filter-popover
      `;
    popover.id =
        'placesFilterPopover';
    popover.setAttribute(
        'role',
        'dialog'
    );
    popover.setAttribute(
        'aria-label',
        'Filter places'
    );
    popover.innerHTML = `
        <div
          class="people-filter-popover-header">

          <h3>Filter places</h3>

          <p>
            Refine places by people,
            surnames, dates, event type,
            country, map status, and review.
          </p>
        </div>

        <div class="people-filter-grid">
          ${renderPlaceFilterFields(
                filters,
                'places-popover-filter'
            )}
        </div>

        <p
          class="places-filter-error"
          data-place-filter-error
          role="alert"
          hidden>
        </p>

        <div class="people-filter-footer">
          <button
            class="button secondary"
            type="button"
            data-place-filter-reset>
            Reset
          </button>

          <button
            class="button primary"
            type="button"
            data-place-filter-apply>
            Apply filters
          </button>
        </div>
      `;

    document.body
        .appendChild(popover);

    const rect =
        anchor
            .getBoundingClientRect();

    const margin = 12;

    const left =
        Math.min(
            Math.max(
                margin,
                rect.right
              - popover.offsetWidth
            ),
            Math.max(
                margin,
                window.innerWidth
              - popover.offsetWidth
              - margin
            )
        );

    const below =
        rect.bottom + 8;

    const spaceBelow = window.innerHeight - margin - below;
    const spaceAbove = rect.top - 8 - margin;
    const placeBelow = popover.offsetHeight <= spaceBelow || spaceBelow >= spaceAbove;
    popover.style.maxHeight = `${Math.max(0, placeBelow ? spaceBelow : spaceAbove)}px`;
    const top = placeBelow ? below : rect.top - 8 - popover.offsetHeight;

    popover.style.left =
        `${left}px`;

    popover.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    popover
        .querySelector(
            '[data-place-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                resetPlaceFilterFields(
                    popover
                );

                setPlacesFilterPopoverError(
                    popover
                );
            }
        );

    popover
        .querySelector(
            '[data-place-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const submitted =
                    readPlaceFilterFields(
                        popover
                    );

                const yearError =
                    placeFilterYearError(
                        submitted
                    );

                if (yearError)
                {
                    setPlacesFilterPopoverError(
                        popover,
                        yearError
                    );

                    popover
                        .querySelector(
                            '[data-place-filter-input="yearFrom"]'
                        )
                        ?.focus();

                    return;
                }

                state.placesFilters = {
                    ...submitted
                };

                state.placesSavedFilterId =
                    '';
                closePlacesFilterPopover();
                renderPlaces();
            }
        );

    popover.addEventListener(
        'input',
        () =>
        {
            setPlacesFilterPopoverError(
                popover
            );
        }
    );

    popover.addEventListener(
        'change',
        () =>
        {
            setPlacesFilterPopoverError(
                popover
            );
        }
    );

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closePlacesFilterOnOutside
        );

        document.addEventListener(
            'keydown',
            closePlacesFilterOnEscape
        );
    }, 0);
}

function openPlaceActionsMenu(
    placeId,
    anchor
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || !anchor
    )
    {
        return;
    }

    closeMenu();

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement(
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
                Math.min(
                    window.innerWidth - 220,
                    rect.right - 200
                )
            )
        }px`;

    const hasCoordinates =
        placeHasCoordinates(
            place
        );

    menu.innerHTML = `
        <button
          type="button"
          data-action="map">
          Show on map
        </button>

        <button
          type="button"
          data-action="edit">
          Edit place
        </button>

        ${
            hasCoordinates
                ? `
              <button
                type="button"
                data-action="copy-coordinates">
                Copy coordinates
              </button>
            `
                : ''
        }

        <button
          class="danger"
          type="button"
          data-action="delete">
          Delete place
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        async event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset
                    .action;

            if (!action)
            {
                return;
            }

            if (action === 'map')
            {
                showPlaceOnMap(
                    place.id
                );

                return;
            }

            if (action === 'edit')
            {
                closeMenu();

                openPlaceModal(
                    place.id
                );

                return;
            }

            if (action === 'delete')
            {
                closeMenu();

                openDeletePlaceModal(
                    place.id
                );

                return;
            }

            if (
                action
              === 'copy-coordinates'
            )
            {
                const coordinates =
                    formatPlaceCoordinates(
                        place
                    );

                closeMenu();

                try
                {
                    await navigator
                        .clipboard
                        .writeText(
                            coordinates
                        );

                    showToast(
                        'Coordinates copied.'
                    );
                }
                catch
                {
                    showToast(
                        coordinates
                    );
                }
            }
        }
    );

    bindMenuLifecycle(anchor);
}

function currentPlacesRouteInitialPersonId()
{
    const candidates = [
        state.placesRoutePersonId,
        state.selectedPersonId,
        state.selectedPeopleId
    ];

    return candidates.find(personId =>
    {
        const person =
            getPerson(personId);

        return Boolean(
            person
          && !person.deleted
          && person.projectId
            === currentProjectId()
        );
    }) || '';
}

function placesRoutePopupCount(
    count,
    singular,
    plural
)
{
    return `${
        count
    } ${
        t(
            count === 1
                ? singular
                : plural
        )
    }`;
}

function placesRoutePopupStopSummary(
    route
)
{
    return `${
        placesRoutePopupCount(
            route.stops.length,
            'stop',
            'stops'
        )
    } ${
        t('across')
    } ${
        placesRoutePopupCount(
            route.distinctPlaceCount,
            'place',
            'places'
        )
    }`;
}

function placesRoutePopupPersonLifeLine(
    person
)
{
    const birth =
        formatGenealogyDateLabel(
            person?.birth
        );

    const death =
        formatGenealogyDateLabel(
            person?.death
        );

    if (birth && death)
    {
        return `${birth} - ${death}`;
    }

    if (birth)
    {
        return birth;
    }

    if (death)
    {
        return `${t('Died')} ${death}`;
    }

    return t('Dates unknown');
}

function placesRoutePopupSelectionMatches(
    route
)
{
    if (
        !route?.configured
        || !state.placesShowRoute
    )
    {
        return false;
    }

    if (
        route.mode
          !== state.placesRouteMode
    )
    {
        return false;
    }

    return route.mode === 'person'
        ? route.personId
            === state.placesRoutePersonId
        : route.surname
            === state.placesRouteSurname;
}

function placesRoutePopupOptions(
    mode,
    people,
    surnames
)
{
    if (mode === 'surname')
    {
        return surnames.map(item =>
        {
            const route =
                derivePlacesRoute({
                    mode: 'surname',
                    surname: item.surname
                });

            return {
                value: item.surname,
                label: item.surname,

                selectedMeta:
              placesRoutePopupCount(
                  item.count,
                  'person',
                  'people'
              ),

                resultMeta:
              route.available
                  ? `${
                      placesRoutePopupCount(
                          item.count,
                          'person',
                          'people'
                      )
                  } · ${
                      placesRoutePopupCount(
                          route
                              .distinctPlaceCount,
                          'place',
                          'places'
                      )
                  }`
                  : `${
                      placesRoutePopupCount(
                          item.count,
                          'person',
                          'people'
                      )
                  } · ${
                      t(
                          'Not enough mapped history'
                      )
                  }`,

                person: null
            };
        });
    }

    return people.map(person =>
    {
        const route =
            derivePlacesRoute({
                mode: 'person',
                personId: person.id
            });

        return {
            value: person.id,

            label:
            person.names?.display
            || person.name
            || t('Unnamed person'),

            selectedMeta:
            placesRoutePopupPersonLifeLine(
                person
            ),

            resultMeta:
            route.available
                ? placesRoutePopupStopSummary(
                    route
                )
                : t(
                    'Not enough mapped history'
                ),

            person
        };
    });
}

function renderPlacesRoutePopupPicker({
    draft,
    options,
    matches,
    open,
    activeIndex
})
{
    const selectedValue =
        draft.mode === 'person'
            ? draft.personId
            : draft.surname;

    const selected =
        options.find(
            option =>
                option.value
              === selectedValue
        );

    const isSurname =
        draft.mode === 'surname';

    const label =
        t(
            isSurname
                ? 'Surname'
                : 'Person'
        );

    const placeholder =
        t(
            isSurname
                ? 'Search surnames...'
                : 'Search people...'
        );

    const emptyLabel =
        t(
            isSurname
                ? 'No matching surnames.'
                : 'No matching people.'
        );

    return `
        <div
          class="
            places-route-popup-field
          ">

          <span
            class="
              places-route-popup-label
            ">
            ${escapeHtml(label)}
          </span>

          <div
            class="
              places-route-popup-picker
              ${open ? 'is-open' : ''}
            ">

            ${
                selected && !open
                    ? `
                  <button
                    class="
                      places-route-popup-subject
                      ${
                            isSurname
                                ? 'is-surname'
                                : ''
                        }
                    "
                    type="button"
                    data-route-subject-open
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="
                      placesRouteSubjectResults
                    ">

                    ${
                        selected.person
                            ? renderPersonAvatar(
                                selected.person,
                                'places-route-popup-avatar',
                                {
                                    element: 'span',
                                    attrs:
                                'aria-hidden="true"'
                                }
                            )
                            : ''
                    }

                    <span
                      class="
                        places-route-popup-subject-copy
                      ">
                      <strong>
                        ${escapeHtml(
                            selected.label
                        )}
                      </strong>

                      <small>
                        ${escapeHtml(
                            selected
                                .selectedMeta
                        )}
                      </small>
                    </span>

                    <span
                      class="
                        places-route-popup-change
                      ">
                      ${escapeHtml(
                            t('Change')
                        )}
                    </span>
                  </button>
                `
                    : `
                  <label
                    class="
                      app-search-field
                      places-route-popup-search
                    "
                    aria-label="${
                        escapeHtml(
                            placeholder
                        )
                    }">

                    ${icon.search}

                    <input
                      id="
                        placesRouteSubjectSearch
                      "
                      type="search"
                      role="combobox"
                      autocomplete="off"
                      aria-autocomplete="list"
                      aria-expanded="${open}"
                      aria-controls="
                        placesRouteSubjectResults
                      "
                      aria-activedescendant="${
                            activeIndex >= 0
                                ? `placesRouteSubjectOption${activeIndex}`
                                : ''
                        }"
                      value="${escapeHtml(
                            draft.query
                        )}"
                      placeholder="${escapeHtml(
                            placeholder
                        )}">
                  </label>
                `
            }

            <div
              id="placesRouteSubjectResults"
              class="
                places-route-popup-options
              "
              role="listbox"
              ${open ? '' : 'hidden'}>

              ${
                    matches.length
                        ? matches
                            .map(
                                (
                                    option,
                                    index
                                ) =>
                                {
                                    const
                                        optionSelected =
                                            option.value
                              === selectedValue;

                                    return `
                            <button
                              id="
                                placesRouteSubjectOption${index}
                              "
                              class="
                                places-route-popup-option
                                ${
                                    isSurname
                                        ? 'is-surname'
                                        : ''
                                }
                                ${
                                    optionSelected
                                        ? 'selected'
                                        : ''
                                }
                                ${
                                    index
                                    === activeIndex
                                        ? 'highlighted'
                                        : ''
                                }
                              "
                              type="button"
                              role="option"
                              aria-selected="${
                                    optionSelected
                                }"
                              data-route-subject-value="${
                                    escapeHtml(
                                        option.value
                                    )
                                }">

                              ${
                                    option.person
                                        ? renderPersonAvatar(
                                            option.person,
                                            'places-route-popup-avatar',
                                            {
                                                element:
                                          'span',
                                                attrs:
                                          'aria-hidden="true"'
                                            }
                                        )
                                        : ''
                                }

                              <span
                                class="
                                  places-route-popup-option-copy
                                ">
                                <strong>
                                  ${escapeHtml(
                                        option.label
                                    )}
                                </strong>

                                <small>
                                  ${escapeHtml(
                                        option
                                            .resultMeta
                                    )}
                                </small>
                              </span>

                              ${
                                    optionSelected
                                        ? `
                                    <span
                                      class="
                                        places-route-popup-option-check
                                      "
                                      aria-hidden="true">
                                      ${icon.check}
                                    </span>
                                  `
                                        : '<span></span>'
                                }
                            </button>
                          `;
                                }
                            )
                            .join('')
                        : `
                    <span
                      class="
                        places-route-popup-empty
                      ">
                      ${escapeHtml(
                            emptyLabel
                        )}
                    </span>
                  `
                }
            </div>
          </div>
        </div>
      `;
}

function renderPlacesRoutePopupPreview(
    route
)
{
    if (!route.configured)
    {
        return `
          <p
            class="
              places-route-popup-hint
            ">
            ${escapeHtml(
                t(
                    route.mode === 'surname'
                        ? 'Select a surname to preview its route.'
                        : 'Select a person to preview their route.'
                )
            )}
          </p>
        `;
    }

    const excludedSummary =
        routeExcludedReasonSummary(
            route
        )
            .split(' - ')
            .join(' · ');

    const metrics = [
        route.mode === 'surname'
            ? placesRoutePopupCount(
                route.peopleCount,
                'person',
                'people'
            )
            : '',

        placesRoutePopupStopSummary(
            route
        ),

        route.dateSpan
    ].filter(Boolean);

    return `
        <div
          class="
            places-route-popup-preview
            ${
                route.available
                    ? ''
                    : 'is-unavailable'
            }
          "
          role="status"
          aria-live="polite">

          <span
            class="
              places-route-popup-preview-icon
            "
            aria-hidden="true">
            ${
                route.available
                    ? icon.check
                    : icon.warning
            }
          </span>

          <div
            class="
              places-route-popup-preview-copy
            ">

            <strong>
              ${escapeHtml(
                    t(
                        route.available
                            ? 'Route available'
                            : 'Not enough mapped history'
                    )
                )}
            </strong>

            ${
                route.available
                    ? metrics
                        .map(
                            metric => `
                        <span>
                          ${escapeHtml(
                                metric
                            )}
                        </span>
                      `
                        )
                        .join('')
                    : `
                  <span>
                    ${escapeHtml(
                        t(
                            'At least two dated, mapped places are needed.'
                        )
                    )}
                  </span>
                `
            }

            ${
                route.excludedCount > 0
                    ? `
                  <small>
                    <strong>
                      ${
                            route.excludedCount
                        } ${
                            escapeHtml(
                                t(
                                    route
                                        .excludedCount
                              === 1
                                        ? 'event excluded'
                                        : 'events excluded'
                                )
                            )
                        }
                    </strong>

                    ${
                        excludedSummary
                            ? `
                          <span>
                            ${escapeHtml(
                                excludedSummary
                            )}
                          </span>
                        `
                            : ''
                    }
                  </small>
                `
                    : ''
            }

            ${
                !route.available
              && route
                  .excludedByReason
                  .missingCoordinates > 0
                    ? `
                  <button
                    class="
                      places-route-popup-review
                    "
                    type="button"
                    data-route-review-unmapped>
                    ${escapeHtml(
                        t(
                            'Review unmapped places'
                        )
                    )}
                  </button>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function openPlacesRouteMenu(
    anchor
)
{
    closeMenu();

    const people =
        getPeople(
            currentProjectId()
        )
            .filter(
                person =>
                    person
              && !person.deleted
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    (
                        first.names?.display
                || first.name
                || ''
                    )
                        .localeCompare(
                            second.names
                                ?.display
                  || second.name
                  || ''
                        )
            );

    const surnames =
        getProjectRouteSurnames();

    const draft = {
        mode:
          [
              'person',
              'surname'
          ].includes(
              state.placesRouteMode
          )
              ? state.placesRouteMode
              : 'person',

        personId:
          state
              .placesRoutePersonId
          || currentPlacesRouteInitialPersonId(),

        surname:
          state
              .placesRouteSurname
          || '',

        query: ''
    };

    let resultsOpen = false;
    let activeIndex = -1;

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'menu-popover places-route-popover';

    popover.id =
        'projectMenu';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-modal',
        'false'
    );

    popover.setAttribute(
        'aria-labelledby',
        'placesRoutePopoverTitle'
    );

    popover.setAttribute(
        'aria-describedby',
        'placesRoutePopoverDescription'
    );

    popover.addEventListener(
        'click',
        event =>
            event.stopPropagation()
    );

    const allOptions = () =>
        placesRoutePopupOptions(
            draft.mode,
            people,
            surnames
        );

    const visibleOptions = () =>
    {
        const query =
            draft.query
                .trim()
                .toLowerCase();

        return allOptions()
            .filter(
                option =>
                    !query
              || option.label
                  .toLowerCase()
                  .includes(query)
            )
            .slice(
                0,
                draft.mode === 'person'
                    ? 12
                    : 16
            );
    };

    const selectedValue = () =>
        draft.mode === 'person'
            ? draft.personId
            : draft.surname;

    const setSelectedValue =
        value =>
        {
            if (
                draft.mode === 'person'
            )
            {
                draft.personId = value;
            }
            else
            {
                draft.surname = value;
            }
        };

    const positionPopover = () =>
    {
        const rect =
            anchor
                .getBoundingClientRect();

        const width =
            Math.min(
                400,
                window.innerWidth - 24
            );

        const below =
            rect.bottom + 8;

        const above =
            rect.top
          - popover.offsetHeight
          - 8;

        const top =
            below
          + popover.offsetHeight
          <= window.innerHeight - 12
                ? below
                : Math.max(
                    12,
                    above
                );

        popover.style.width =
            `${width}px`;

        popover.style.left =
            `${
                Math.max(
                    12,
                    Math.min(
                        rect.right - width,
                        window.innerWidth
                  - width
                  - 12
                    )
                )
            }px`;

        popover.style.top =
            `${top}px`;
    };

    const positionOptions = () =>
    {
        const picker =
            popover.querySelector(
                '.places-route-popup-picker.is-open'
            );

        const options =
            picker?.querySelector(
                '.places-route-popup-options:not([hidden])'
            );

        if (
            !picker
          || !options
        )
        {
            return;
        }

        const rect =
            picker.getBoundingClientRect();

        const availableBelow =
            window.innerHeight
          - rect.bottom
          - 12;

        const availableAbove =
            rect.top - 12;

        const expectedHeight =
            Math.min(
                options.scrollHeight,
                240
            );

        picker.classList.toggle(
            'opens-up',
            availableBelow
            < expectedHeight
          && availableAbove
            > availableBelow
        );
    };

    const focusControl =
        controlName =>
        {
            const selectors = {
                search:
              '#placesRouteSubjectSearch',

                subject:
              '[data-route-subject-open]',

                personMode:
              '[data-route-mode="person"]',

                surnameMode:
              '[data-route-mode="surname"]'
            };

            requestAnimationFrame(
                () =>
                {
                    positionOptions();

                    const control =
                        popover
                            .querySelector(
                                selectors[
                                    controlName
                                ]
                            );

                    control?.focus({
                        preventScroll: true
                    });

                    if (
                        control
                instanceof
                  HTMLInputElement
                    )
                    {
                        control
                            .setSelectionRange(
                                control.value.length,
                                control.value.length
                            );
                    }

                    if (
                        activeIndex >= 0
                    )
                    {
                        popover
                            .querySelector(
                                `#placesRouteSubjectOption${activeIndex}`
                            )
                            ?.scrollIntoView({
                                block: 'nearest'
                            });
                    }
                }
            );
        };

    const selectOption =
        value =>
        {
            setSelectedValue(value);

            draft.query = '';
            resultsOpen = false;
            activeIndex = -1;

            renderPopover({
                focus: 'subject'
            });
        };

    const renderPopover = ({
        focus = ''
    } = {}) =>
    {
        const options =
            allOptions();

        const matches =
            visibleOptions();

        const draftRoute =
            derivePlacesRoute({
                mode: draft.mode,

                personId:
              draft.mode === 'person'
                  ? draft.personId
                  : '',

                surname:
              draft.mode === 'surname'
                  ? draft.surname
                  : ''
            });

        const currentRoute =
            currentPlacesRoute();

        const routeShown =
            placesRoutePopupSelectionMatches(
                draftRoute
            );

        const hasShownRoute =
            Boolean(
                state.placesShowRoute
            && currentRoute.configured
            );

        popover.innerHTML = `
          <div
            class="
              places-route-popover-head
            ">

            <strong
              id="
                placesRoutePopoverTitle
              ">
              ${escapeHtml(
                    t('Calculate route')
                )}
            </strong>

            <span
              id="
                placesRoutePopoverDescription
              ">
              ${escapeHtml(
                    t(
                        'Choose a person or surname. Routes use dated events with mapped places.'
                    )
                )}
            </span>
          </div>

          <div
            class="
              places-route-mode
            "
            role="group"
            aria-label="${escapeHtml(
                t('Route mode')
            )}">

            <button
              type="button"
              data-route-mode="person"
              class="${
                    draft.mode === 'person'
                        ? 'active'
                        : ''
                }"
              aria-pressed="${
                    draft.mode === 'person'
                }">
              ${escapeHtml(
                    t('Person')
                )}
            </button>

            <button
              type="button"
              data-route-mode="surname"
              class="${
                    draft.mode === 'surname'
                        ? 'active'
                        : ''
                }"
              aria-pressed="${
                    draft.mode === 'surname'
                }">
              ${escapeHtml(
                    t('Surname')
                )}
            </button>
          </div>

          <div
            class="
              places-route-popup-body
            ">

            ${renderPlacesRoutePopupPicker({
                draft,
                options,
                matches,
                open: resultsOpen,
                activeIndex
            })}

            ${renderPlacesRoutePopupPreview(
                draftRoute
            )}
          </div>

          <div
            class="
              places-route-popover-actions
            ">

            ${
                hasShownRoute
                    ? `
                  <button
                    class="
                      button
                      ghost
                    "
                    type="button"
                    data-route-clear>
                    ${escapeHtml(
                        t(
                            'Clear shown route'
                        )
                    )}
                  </button>
                `
                    : '<span></span>'
            }

            <button
              class="
                button
                primary
              "
              type="button"
              data-route-show
              ${
                    !draftRoute.available
                || routeShown
                        ? 'disabled'
                        : ''
                }>
              ${escapeHtml(
                    t(
                        routeShown
                            ? 'Route shown'
                            : 'Show route'
                    )
                )}
            </button>
          </div>
        `;

        popover
            .querySelectorAll(
                '[data-route-mode]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        const mode =
                            button.dataset
                                .routeMode;

                        if (
                            mode === draft.mode
                        )
                        {
                            return;
                        }

                        draft.mode = mode;
                        draft.query = '';
                        resultsOpen = false;
                        activeIndex = -1;

                        renderPopover({
                            focus:
                    mode === 'person'
                        ? 'personMode'
                        : 'surnameMode'
                        });
                    }
                );
            });

        popover
            .querySelector(
                '[data-route-subject-open]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    draft.query = '';
                    resultsOpen = true;
                    activeIndex = -1;

                    renderPopover({
                        focus: 'search'
                    });
                }
            );

        const search =
            popover.querySelector(
                '#placesRouteSubjectSearch'
            );
        let openBeforePointer = null;

        const openResults = () =>
        {
            if (resultsOpen)
            {
                return;
            }

            resultsOpen = true;
            activeIndex = -1;

            renderPopover({
                focus: 'search'
            });
        };

        search?.addEventListener(
            'focus',
            openResults
        );

        search?.addEventListener(
            'pointerdown',
            () =>
            {
                openBeforePointer = resultsOpen;
            }
        );

        search?.addEventListener(
            'click',
            () =>
            {
                const wasOpen = openBeforePointer;
                openBeforePointer = null;
                if (wasOpen === true)
                {
                    resultsOpen = false;
                    activeIndex = -1;
                    popover.querySelector('#placesRouteSubjectResults').hidden = true;
                    search.setAttribute('aria-expanded', 'false');
                    search.removeAttribute('aria-activedescendant');
                }
                else if (wasOpen === false || !resultsOpen)
                {
                    openResults();
                }
            }
        );

        search?.addEventListener(
            'input',
            event =>
            {
                draft.query =
                    event.target.value;

                resultsOpen = true;
                activeIndex = -1;

                renderPopover({
                    focus: 'search'
                });
            }
        );

        search?.addEventListener(
            'keydown',
            event =>
            {
                const matchesNow =
                    visibleOptions();

                if (
                    event.key
                === 'ArrowDown'
              || event.key
                === 'ArrowUp'
                )
                {
                    event.preventDefault();

                    const direction =
                        event.key
                  === 'ArrowDown'
                            ? 1
                            : -1;

                    if (!resultsOpen)
                    {
                        resultsOpen = true;

                        activeIndex =
                            direction > 0
                                ? 0
                                : Math.max(
                                    0,
                                    matchesNow
                                        .length - 1
                                );
                    }
                    else if (
                        matchesNow.length
                    )
                    {
                        activeIndex =
                            activeIndex < 0
                                ? (
                                    direction > 0
                                        ? 0
                                        : matchesNow
                                            .length - 1
                                )
                                : (
                                    activeIndex
                        + direction
                        + matchesNow
                            .length
                                )
                      % matchesNow
                          .length;
                    }

                    renderPopover({
                        focus: 'search'
                    });

                    return;
                }

                if (
                    event.key === 'Enter'
              && activeIndex >= 0
                )
                {
                    event.preventDefault();

                    const option =
                        matchesNow[
                            activeIndex
                        ];

                    if (option)
                    {
                        selectOption(
                            option.value
                        );
                    }

                    return;
                }

                if (
                    event.key === 'Escape'
              && resultsOpen
                )
                {
                    event.preventDefault();
                    event.stopPropagation();

                    resultsOpen = false;
                    activeIndex = -1;

                    renderPopover({
                        focus:
                  selectedValue()
                      ? 'subject'
                      : (
                          draft.mode
                          === 'person'
                              ? 'personMode'
                              : 'surnameMode'
                      )
                    });
                }
            }
        );

        popover
            .querySelectorAll(
                '[data-route-subject-value]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        selectOption(
                            button.dataset
                                .routeSubjectValue
                        );
                    }
                );
            });

        popover
            .querySelector(
                '[data-route-review-unmapped]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    closeMenu();
                    openPlacesNeedsReview();
                }
            );

        popover
            .querySelector(
                '[data-route-show]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    const route =
                        derivePlacesRoute({
                            mode: draft.mode,

                            personId:
                    draft.mode
                      === 'person'
                        ? draft.personId
                        : '',

                            surname:
                    draft.mode
                      === 'surname'
                        ? draft.surname
                        : ''
                        });

                    if (!route.available)
                    {
                        return;
                    }

                    state.placesRouteMode =
                        draft.mode;

                    state
                        .placesRoutePersonId =
                            draft.mode
                    === 'person'
                                ? draft.personId
                                : '';

                    state
                        .placesRouteSurname =
                            draft.mode
                    === 'surname'
                                ? draft.surname
                                : '';

                    state.placesShowRoute =
                        true;

                    closeMenu();
                    renderPlacesMain();

                    requestAnimationFrame(
                        () =>
                            requestAnimationFrame(
                                () =>
                                {
                                    const activeRoute =
                                        currentPlacesRoute();

                                    if (
                                        activeRoute.available
                                    )
                                    {
                                        fitPlacesMap(
                                            activeRoute
                                                .stops
                                                .map(
                                                    stop =>
                                                        stop.place
                                                )
                                        );
                                    }
                                }
                            )
                    );
                }
            );

        popover
            .querySelector(
                '[data-route-clear]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    clearPlacesRoute();
                    closeMenu();
                    renderPlacesMain();
                }
            );

        positionPopover();

        if (focus)
        {
            focusControl(focus);
        }
        else
        {
            requestAnimationFrame(
                positionOptions
            );
        }
    };

    document.body.appendChild(
        popover
    );

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    renderPopover();
    bindMenuLifecycle(anchor);
}

function formatPlaceUpdatedAt(value)
{
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium' }).format(new Date(timestamp)) : 'Unknown';
}

function clonePlaceEditorCoordinates(value)
{
    if (!value || !validLatitude(value.lat) || !validLongitude(value.lng)) return null;
    return { lat: Number(value.lat), lng: Number(value.lng) };
}

function placeEditorCoordinateText(coordinates)
{
    const value = clonePlaceEditorCoordinates(coordinates);
    return {
        latitude: value ? value.lat.toFixed(6) : '',
        longitude: value ? value.lng.toFixed(6) : ''
    };
}

function placeEditorCoordinateTextFromStored(coordinates)
{
    const normalized = clonePlaceEditorCoordinates(coordinates);
    if (normalized) return placeEditorCoordinateText(normalized);
    if (!coordinates || typeof coordinates !== 'object')
    {
        return { latitude: '', longitude: '' };
    }
    return {
        latitude: coordinates.lat === null || coordinates.lat === undefined ? '' : String(coordinates.lat),
        longitude: coordinates.lng === null || coordinates.lng === undefined ? '' : String(coordinates.lng)
    };
}

function storedPlaceCoordinateKey(coordinates)
{
    return JSON.stringify(placeEditorCoordinateTextFromStored(coordinates));
}

function parsePlaceEditorCoordinate(value, { label, minimum, maximum, example })
{
    const raw = String(value ?? '').trim();
    if (!raw) return { empty: true, valid: false, value: null, formatted: '', message: '' };
    const normalizedMinus = raw.replace(/\u2212/g, '-');
    const separatorCount = (normalizedMinus.match(/[.,]/g) || []).length;
    const normalized = separatorCount === 1 && normalizedMinus.includes(',')
        ? normalizedMinus.replace(',', '.')
        : normalizedMinus;
    if (separatorCount > 1 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))
    {
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must use decimal degrees, for example ${example}.` };
    }
    const number = Number(normalized);
    if (!Number.isFinite(number))
    {
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must be a valid number.` };
    }
    if (number < minimum || number > maximum)
    {
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must be between ${minimum} and ${maximum}.` };
    }
    return { empty: false, valid: true, value: number, formatted: number.toFixed(6), message: '' };
}

function readPlaceEditorCoordinateState(latitudeText, longitudeText)
{
    const latitude = parsePlaceEditorCoordinate(latitudeText, {
        label: 'Latitude', minimum: -90, maximum: 90, example: '53.959400'
    });
    const longitude = parsePlaceEditorCoordinate(longitudeText, {
        label: 'Longitude', minimum: -180, maximum: 180, example: '-1.082000'
    });
    const hasAnyValue = Boolean(String(latitudeText || '').trim() || String(longitudeText || '').trim());
    if (!hasAnyValue)
    {
        return { valid: true, hasAnyValue: false, hasCoordinates: false, coordinates: null, latitude, longitude, message: '' };
    }
    if (latitude.empty || longitude.empty)
    {
        return { valid: false, hasAnyValue: true, hasCoordinates: false, coordinates: null, latitude, longitude, message: 'Enter both latitude and longitude.' };
    }
    if (!latitude.valid || !longitude.valid)
    {
        return { valid: false, hasAnyValue: true, hasCoordinates: false, coordinates: null, latitude, longitude, message: latitude.message || longitude.message };
    }
    return {
        valid: true,
        hasAnyValue: true,
        hasCoordinates: true,
        coordinates: { lat: latitude.value, lng: longitude.value },
        latitude,
        longitude,
        message: ''
    };
}

function createPlaceEditorDraft(placeId = null, { initialCoordinates = null } = {})
{
    const existing = placeId ? getPlace(placeId) : null;
    const coordinates = clonePlaceEditorCoordinates(initialCoordinates || existing?.coordinates);
    const alternativeNames = placeAlternativeNames(existing).slice();
    const coordinateText = initialCoordinates
        ? placeEditorCoordinateText(coordinates)
        : placeEditorCoordinateTextFromStored(existing?.coordinates);
    const original = {
        name: existing?.name || '',
        alternativeNames: alternativeNames.slice(),
        coordinates: clonePlaceEditorCoordinates(existing?.coordinates),
        coordinateText: placeEditorCoordinateTextFromStored(existing?.coordinates)
    };
    return {
        mode: existing ? 'edit' : 'add',
        placeId: existing?.id || null,
        name: existing?.name || '',
        alternativeNames,
        coordinates,
        coordinateText,
        original,
        dirty: Boolean(initialCoordinates && !existing),
        selectedSuggestion: null,
        existingCandidateId: null,
        duplicateOverride: false,
        dismissedDuplicateId: null,
        disclosures: {
            alternativeNames: alternativeNames.length > 0,
            coordinates: false
        },
        query: existing?.name || '',
        searchTouched: false,
        externalState: 'idle',
        externalError: '',
        externalResults: [],
        externalQuery: '',
        lastExternalQuery: '',
        renderedSuggestions: [],
        activeSuggestionIndex: -1,
        mapSession: null
    };
}

function resetPlaceEditorDraft()
{
    clearTimeout(
        placeGeocoderTimer
    );

    placeGeocoderTimer =
        null;

    placeGeocoderController
        ?.abort();

    placeGeocoderController =
        null;

    placeEditorDraft =
        null;

    placeEditorCompletion =
        null;
}

function placeEditorDraftPersonalityKey(draft)
{
    return JSON.stringify({
        name: draft.name,
        alternativeNames: draft.alternativeNames,
        coordinateText: draft.coordinateText
    });
}

function updatePlaceEditorDraftDirty(draft = placeEditorDraft)
{
    if (!draft) return false;
    draft.dirty = placeEditorDraftPersonalityKey(draft) !== JSON.stringify({
        name: draft.original.name,
        alternativeNames: draft.original.alternativeNames,
        coordinateText: draft.original.coordinateText
    });
    return draft.dirty;
}

function normalizePlaceEditorName(value)
{
    return String(value || '').trim().replace(/[ \t\f\v]+/g, ' ');
}

function validatePlaceEditorName(value)
{
    const raw = String(value || '');
    if (!raw.trim()) return { valid: false, value: '', message: 'Enter a place name.' };
    if (/[\r\n\u0000-\u001f\u007f]/.test(raw))
    {
        return { valid: false, value: raw.trim(), message: 'Place names cannot contain line breaks or control characters.' };
    }
    return { valid: true, value: normalizePlaceEditorName(raw), message: '' };
}

function syncPlaceEditorDraftFromModal()
{
    const draft = placeEditorDraft;
    const root = modalBackdrop.querySelector('[data-place-editor]');
    if (!draft || !root) return draft;
    draft.name = root.querySelector('#placeNameInput')?.value || '';
    draft.query = draft.name;
    draft.alternativeNames = (root.querySelector('#placeAlternativeNamesInput')?.value || '').split('\n');
    draft.coordinateText = {
        latitude: root.querySelector('#placeLatitudeInput')?.value || '',
        longitude: root.querySelector('#placeLongitudeInput')?.value || ''
    };
    const coordinateState = readPlaceEditorCoordinateState(draft.coordinateText.latitude, draft.coordinateText.longitude);
    draft.coordinates = coordinateState.hasCoordinates ? coordinateState.coordinates : null;
    draft.disclosures.alternativeNames = Boolean(root.querySelector('[data-place-alternative-details]')?.open);
    draft.disclosures.coordinates = Boolean(root.querySelector('[data-place-coordinate-details]')?.open);
    updatePlaceEditorDraftDirty(draft);
    return draft;
}

function placeEditorExistingMatches(query)
{
    const normalized = normalizePlaceLookupText(query);
    if (!normalized) return [];
    return projectPlaces().map(place =>
    {
        const names = [place.name, ...placeAlternativeNames(place)];
        const normalizedNames = names.map(normalizePlaceLookupText);
        const exact = normalizedNames.some(value => value === normalized);
        const starts = normalizedNames.some(value => value.startsWith(normalized));
        const contains = normalizedNames.some(value => value.includes(normalized));
        return { place, rank: exact ? 0 : starts ? 1 : contains ? 2 : 9 };
    }).filter(result => result.rank < 9).sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name)).slice(0, 6).map(result => result.place);
}

function placeEditorMapResult(feature, index)
{
    const center = Array.isArray(feature?.center) ? feature.center : [];
    const lng = Number(center[0]);
    const lat = Number(center[1]);
    if (!validLatitude(lat) || !validLongitude(lng)) return null;
    const name = cleanEditFieldValue(feature.place_name || feature.text);
    if (!name) return null;
    const primary = cleanEditFieldValue(feature.text || name.split(',')[0]);
    const context = Array.isArray(feature.context)
        ? feature.context.map(item => cleanEditFieldValue(item.text)).filter(Boolean).join(', ')
        : cleanEditFieldValue(name.split(',').slice(1).join(','));
    return { id: `map-result-${index}`, kind: 'map', name, primary: primary || name, context, coordinates: { lat, lng } };
}

function closePlaceEditorSuggestions()
{
    const input = modalBackdrop.querySelector('#placeNameInput');
    const list = modalBackdrop.querySelector('#placeEditorSuggestions');
    if (list) list.hidden = true;
    input?.setAttribute('aria-expanded', 'false');
    input?.removeAttribute('aria-activedescendant');
    if (placeEditorDraft) placeEditorDraft.activeSuggestionIndex = -1;
}

function renderPlaceEditorSuggestions({ open = true } = {})
{
    const draft = placeEditorDraft;
    const input = modalBackdrop.querySelector('#placeNameInput');
    const list = modalBackdrop.querySelector('#placeEditorSuggestions');
    if (!draft || !input || !list) return;
    const entered = input.value.trim();
    if (!entered)
    {
        draft.renderedSuggestions = [];
        list.innerHTML = '';
        closePlaceEditorSuggestions();
        return;
    }
    const suggestions = [];
    const existing = placeEditorExistingMatches(entered);
    const mapResults = draft.externalQuery === entered ? draft.externalResults : [];
    let html = '';
    if (existing.length)
    {
        html += '<div class="place-editor-suggestion-group" role="presentation"><span>Existing places</span></div>';
        existing.forEach(place =>
        {
            const option = { kind: 'existing', id: place.id, name: place.name };
            const index = suggestions.push(option) - 1;
            html += `<button class="place-editor-suggestion" id="placeEditorOption${index}" type="button" role="option" aria-selected="false" data-place-editor-option="${index}"><span><strong>${escapeHtml(place.name)}</strong><small>Existing place${place.id === draft.placeId ? ' / Current place' : ''}</small></span><em>${placeHasCoordinates(place) ? 'On map' : 'Not on map'}</em></button>`;
        });
    }
    html += '<div class="place-editor-suggestion-group" role="presentation"><span>Map results</span></div>';
    if (draft.externalState === 'loading')
    {
        html += '<div class="place-editor-suggestion-status">Searching map results...</div>';
    }
    else if (draft.externalState === 'unavailable')
    {
        html += `<div class="place-editor-suggestion-status"><span>${escapeHtml(draft.externalError || 'Map search is unavailable.')}</span><button type="button" data-place-editor-retry>Retry</button></div>`;
    }
    else if (draft.externalState === 'empty' && draft.externalQuery === entered)
    {
        html += '<div class="place-editor-suggestion-status">No matching map results. You can still use the entered text.</div>';
    }
    else if (entered.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
    {
        html += `<div class="place-editor-suggestion-status">Type at least ${PLACE_EDITOR_GEOCODER_MIN_LENGTH} characters for map results.</div>`;
    }
    else if (mapResults.length)
    {
        mapResults.forEach(result =>
        {
            const index = suggestions.push(result) - 1;
            html += `<button class="place-editor-suggestion" id="placeEditorOption${index}" type="button" role="option" aria-selected="false" data-place-editor-option="${index}"><span><strong>${escapeHtml(result.primary)}</strong><small>${escapeHtml(result.context || result.name)}</small></span><em>${result.coordinates.lat.toFixed(5)}, ${result.coordinates.lng.toFixed(5)}</em></button>`;
        });
    }
    else
    {
        html += '<div class="place-editor-suggestion-status">Map results will appear here.</div>';
    }
    const manual = { kind: 'manual', id: 'manual', name: entered };
    const manualIndex = suggestions.push(manual) - 1;
    html += '<div class="place-editor-suggestion-group" role="presentation"><span>Use entered text</span></div>';
    html += `<button class="place-editor-suggestion manual" id="placeEditorOption${manualIndex}" type="button" role="option" aria-selected="false" data-place-editor-option="${manualIndex}">${icon.edit}<span><strong>Use “${escapeHtml(entered)}” as entered</strong><small>Keep a historical or custom place name</small></span></button>`;
    draft.renderedSuggestions = suggestions;
    draft.activeSuggestionIndex = Math.min(draft.activeSuggestionIndex, suggestions.length - 1);
    list.innerHTML = html;
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    updatePlaceEditorActiveSuggestion();
}

function updatePlaceEditorActiveSuggestion()
{
    const draft = placeEditorDraft;
    const input = modalBackdrop.querySelector('#placeNameInput');
    const options = [...modalBackdrop.querySelectorAll('[data-place-editor-option]')];
    if (!draft || !input) return;
    options.forEach((option, index) =>
    {
        const active = index === draft.activeSuggestionIndex;
        option.classList.toggle('active', active);
        option.setAttribute('aria-selected', String(active));
    });
    const active = options[draft.activeSuggestionIndex];
    if (active)
    {
        input.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
    }
    else
    {
        input.removeAttribute('aria-activedescendant');
    }
}

async function searchPlaceEditorMapResults(query, { retry = false } = {})
{
    const draft = placeEditorDraft;
    const normalizedQuery = String(query || '').trim();
    if (!draft || normalizedQuery.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH) return;
    if (!retry && draft.lastExternalQuery === normalizedQuery && ['ready', 'empty'].includes(draft.externalState)) return;
    const key = placesMaptilerKey();
    if (!key)
    {
        draft.externalState = 'unavailable';
        draft.externalError = 'Map search is unavailable because no MapTiler browser key is configured.';
        draft.externalQuery = normalizedQuery;
        renderPlaceEditorSuggestions();
        return;
    }
    placeGeocoderController?.abort();
    const controller = new AbortController();
    placeGeocoderController = controller;
    draft.externalState = 'loading';
    draft.externalError = '';
    draft.externalQuery = normalizedQuery;
    renderPlaceEditorSuggestions();
    try
    {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(normalizedQuery)}.json?key=${encodeURIComponent(key)}&limit=5`, { signal: controller.signal });
        if (!response.ok) throw new Error('Map search could not be completed.');
        const data = await response.json();
        if (placeEditorDraft !== draft || controller.signal.aborted || draft.query.trim() !== normalizedQuery) return;
        draft.externalResults = (Array.isArray(data.features) ? data.features : []).map(placeEditorMapResult).filter(Boolean);
        draft.externalState = draft.externalResults.length ? 'ready' : 'empty';
        draft.externalQuery = normalizedQuery;
        draft.lastExternalQuery = normalizedQuery;
    }
    catch (error)
    {
        if (error.name === 'AbortError' || placeEditorDraft !== draft) return;
        draft.externalResults = [];
        draft.externalState = 'unavailable';
        draft.externalError = 'Map search is unavailable. You can retry or use the entered text.';
        draft.externalQuery = normalizedQuery;
    }
    renderPlaceEditorSuggestions();
}

function schedulePlaceEditorMapSearch(query, { immediate = false } = {})
{
    const draft = placeEditorDraft;
    if (!draft) return;
    clearTimeout(placeGeocoderTimer);
    placeGeocoderTimer = null;
    placeGeocoderController?.abort();
    const value = String(query || '').trim();
    if (value.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
    {
        draft.externalState = 'idle';
        draft.externalResults = [];
        draft.externalQuery = '';
        renderPlaceEditorSuggestions();
        return;
    }
    if (!draft.searchTouched && normalizePlaceLookupText(value) === normalizePlaceLookupText(draft.original.name)) return;
    draft.externalState = 'loading';
    draft.externalQuery = value;
    renderPlaceEditorSuggestions();
    placeGeocoderTimer = setTimeout(() => searchPlaceEditorMapResults(value, { retry: immediate }), immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
}

function placeEditorNameSimilarity(left, right)
{
    const a = normalizePlaceLookupText(left);
    const b = normalizePlaceLookupText(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1)
    {
        const current = [i];
        for (let j = 1; j <= b.length; j += 1)
        {
            current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        previous.splice(0, previous.length, ...current);
    }
    return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function placeEditorCoordinateDistanceKm(left, right)
{
    if (!clonePlaceEditorCoordinates(left) || !clonePlaceEditorCoordinates(right)) return Infinity;
    const radians = value => value * Math.PI / 180;
    const latDelta = radians(right.lat - left.lat);
    const lngDelta = radians(right.lng - left.lng);
    const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(lngDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findPlaceEditorDuplicate(draft = placeEditorDraft)
{
    if (!draft) return null;
    if (draft.existingCandidateId)
    {
        const place = getPlace(draft.existingCandidateId);
        if (place && place.id !== draft.placeId && !place.deleted && place.projectId === currentProjectId())
        {
            return {
                place,
                exact: true,
                similar: true,
                close: placeEditorCoordinateDistanceKm(draft.coordinates, place.coordinates) <= PLACE_EDITOR_CLOSE_COORDINATE_KM,
                alternativeConflict: placeAlternativeNames(place).some(name => normalizePlaceLookupText(name) === normalizePlaceLookupText(draft.name))
            };
        }
    }
    const canonical = normalizePlaceLookupText(draft.name);
    const alternatives = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    let best = null;
    projectPlaces().filter(place => place.id !== draft.placeId).forEach(place =>
    {
        const names = [place.name, ...placeAlternativeNames(place)];
        const exact = names.some(name => normalizePlaceLookupText(name) === canonical);
        const alternativeConflict = alternatives.some(alternative => names.some(name => normalizePlaceLookupText(name) === normalizePlaceLookupText(alternative)));
        const similarity = Math.max(...names.map(name => placeEditorNameSimilarity(draft.name, name)));
        const distance = placeEditorCoordinateDistanceKm(draft.coordinates, place.coordinates);
        const close = distance <= PLACE_EDITOR_CLOSE_COORDINATE_KM;
        const likely = exact || alternativeConflict || similarity >= 0.88 || close || (similarity >= 0.72 && distance <= 2);
        if (!likely) return;
        const score = (exact ? 100 : 0) + (alternativeConflict ? 80 : 0) + similarity * 20 + (close ? 30 : 0);
        if (!best || score > best.score) best = { place, exact, alternativeConflict, similar: similarity >= 0.88, similarity, close, distance, score };
    });
    return best;
}

function renderPlaceEditorDuplicateWarning({ force = false } = {})
{
    if (document.querySelector('[data-place-duplicate-menu]'))
    {
        closeMenu();
    }
    const draft = placeEditorDraft;
    const host = modalBackdrop.querySelector('[data-place-duplicate-warning]');

    if (!draft || !host) return null;

    const duplicate = findPlaceEditorDuplicate(draft);

    if (
        !duplicate
        || (!force && duplicate.place.id === draft.dismissedDuplicateId)
    )
    {
        host.hidden = true;
        host.innerHTML = '';
        return duplicate;
    }

    if (duplicate.alternativeConflict)
    {
        draft.disclosures.alternativeNames = true;
        const details = modalBackdrop.querySelector('[data-place-alternative-details]');
        if (details) details.open = true;
    }

    const reasons = [
        duplicate.exact ? 'The entered name matches this place.' : '',
        duplicate.alternativeConflict
            ? 'An alternative name conflicts with this place.'
            : '',
        duplicate.similar && !duplicate.exact
            ? 'The names are very similar.'
            : '',
        duplicate.close ? 'The map positions are very close.' : ''
    ].filter(Boolean);

    const place = duplicate.place;
    const savedText = placeEditorCoordinateTextFromStored(place.coordinates);
    const savedPosition = readPlaceEditorCoordinateState(
        savedText.latitude,
        savedText.longitude
    );

    const positionText = savedPosition.hasCoordinates
        ? `${savedPosition.coordinates.lat.toFixed(6)}, ${savedPosition.coordinates.lng.toFixed(6)}`
        : t('No position set');

    const alternativeNames = placeAlternativeNames(place);

    host.hidden = false;
    host.innerHTML = `
        <div class="place-duplicate-heading">
          ${icon.warning}
          <strong>${escapeHtml(t('Possible duplicate'))}</strong>
        </div>

        <div class="place-duplicate-name" data-i18n-skip>
          ${escapeHtml(place.name)}
        </div>

        <p>${escapeHtml(reasons.map(reason => t(reason)).join(' '))}</p>

        <button
          class="button ghost compact icon-only place-duplicate-more"
          type="button"
          data-place-duplicate-more="${escapeHtml(place.id)}"
          aria-label="${escapeHtml(t('More actions'))}"
          title="${escapeHtml(t('More actions'))}"
          aria-haspopup="menu"
          aria-expanded="false">
          ${icon.more}
        </button>

        <div
          class="place-duplicate-review"
          id="placeDuplicateReview"
          hidden>

          <strong>${escapeHtml(t('Saved place details'))}</strong>

          <dl>
            <div>
              <dt>${escapeHtml(t('Place'))}</dt>
              <dd data-i18n-skip>${escapeHtml(place.name)}</dd>
            </div>

            <div>
              <dt>${escapeHtml(t('Map location'))}</dt>
              <dd>${escapeHtml(positionText)}</dd>
            </div>

            ${alternativeNames.length ? `
              <div>
                <dt>${escapeHtml(t('Historical / alternative names'))}</dt>
                <dd>
                  <ul data-i18n-skip>
                    ${alternativeNames.map(name => `
                      <li>${escapeHtml(name)}</li>
                    `).join('')}
                  </ul>
                </dd>
              </div>
            ` : ''}
          </dl>

          ${draft.mode === 'add' ? `
            <button
              class="button secondary compact"
              type="button"
              data-place-use-existing="${escapeHtml(place.id)}">
              ${escapeHtml(t('Use existing place'))}
            </button>
          ` : ''}
        </div>
      `;

    localizeUI(host, { suppressObserverReplay: true });
    return duplicate;
}

function updatePlaceEditorAlternativeSummary()
{
    const draft = placeEditorDraft;
    const textarea = modalBackdrop.querySelector('#placeAlternativeNamesInput');
    const count = modalBackdrop.querySelector('[data-place-alternative-count]');
    if (!draft || !textarea || !count) return;
    draft.alternativeNames = textarea.value.split('\n');
    const normalized = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    count.textContent = normalized.length ? ` · ${normalized.length}` : '';
    updatePlaceEditorDraftDirty(draft);
}

function updatePlaceEditorCoordinateUi({ formatValues = false } = {})
{
    const draft = placeEditorDraft;
    const root = modalBackdrop.querySelector('[data-place-editor]');
    const latitudeInput = root?.querySelector('#placeLatitudeInput');
    const longitudeInput = root?.querySelector('#placeLongitudeInput');

    if (!draft || !latitudeInput || !longitudeInput) return null;

    const result = readPlaceEditorCoordinateState(
        latitudeInput.value,
        longitudeInput.value
    );

    if (formatValues)
    {
        if (result.latitude.valid) latitudeInput.value = result.latitude.formatted;
        if (result.longitude.valid) longitudeInput.value = result.longitude.formatted;
    }

    draft.coordinateText = {
        latitude: latitudeInput.value,
        longitude: longitudeInput.value
    };
    draft.coordinates = result.hasCoordinates ? result.coordinates : null;

    latitudeInput.setAttribute('aria-invalid', String(
        result.hasAnyValue && (result.latitude.empty || !result.latitude.valid)
    ));
    longitudeInput.setAttribute('aria-invalid', String(
        result.hasAnyValue && (result.longitude.empty || !result.longitude.valid)
    ));

    const error = root.querySelector('#placeCoordinateError');
    if (error) error.textContent = translateText(result.message || '');

    const copy = root.querySelector('[data-place-copy-coordinates]');
    if (copy) copy.disabled = !result.hasCoordinates;

    const remove = root.querySelector('[data-place-remove-position]');
    if (remove) remove.hidden = !result.hasAnyValue;

    const choose = root.querySelector('[data-place-choose-map]');
    if (choose)
    {
        choose.textContent = t(
            result.hasCoordinates ? 'Edit on map' : 'Choose on map'
        );
    }

    const status = root.querySelector('[data-place-map-status]');
    if (status)
    {
        status.textContent = t(
            result.hasCoordinates
                ? 'Position set'
                : result.hasAnyValue
                    ? 'Coordinates need attention'
                    : 'No position set'
        );
    }

    const summary = root.querySelector('[data-place-map-summary]');
    if (summary)
    {
        summary.hidden = !result.hasCoordinates;
        summary.textContent = result.hasCoordinates
            ? `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}`
            : '';
    }

    const details = root.querySelector('[data-place-coordinate-details]');
    if (!result.valid && details)
    {
        details.open = true;
        draft.disclosures.coordinates = true;
    }

    updatePlaceEditorDraftDirty(draft);
    return result;
}

function updatePlaceEditorSelectionNotice()
{
    const draft = placeEditorDraft;
    const notice = modalBackdrop.querySelector('[data-place-selection-notice]');
    if (!draft || !notice) return;
    if (draft.selectedSuggestion?.kind === 'map')
    {
        notice.hidden = false;
        notice.textContent = draft.mode === 'edit'
            ? 'Map result selected. The draft name and map position were updated; review both before saving.'
            : 'Map result selected. Review the draft name and map position before creating the place.';
    }
    else
    {
        notice.hidden = true;
        notice.textContent = '';
    }
}

function selectPlaceEditorSuggestion(index)
{
    const draft = placeEditorDraft;
    const suggestion = draft?.renderedSuggestions?.[Number(index)];
    const input = modalBackdrop.querySelector('#placeNameInput');
    if (!draft || !suggestion || !input) return;
    draft.selectedSuggestion = suggestion;
    draft.duplicateOverride = false;
    draft.dismissedDuplicateId = null;
    if (suggestion.kind === 'existing')
    {
        draft.existingCandidateId = suggestion.id;
        draft.name = suggestion.name;
        input.value = suggestion.name;
    }
    else if (suggestion.kind === 'map')
    {
        draft.existingCandidateId = null;
        draft.name = suggestion.name;
        input.value = suggestion.name;
        draft.coordinates = clonePlaceEditorCoordinates(suggestion.coordinates);
        draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
        const latitude = modalBackdrop.querySelector('#placeLatitudeInput');
        const longitude = modalBackdrop.querySelector('#placeLongitudeInput');
        if (latitude) latitude.value = draft.coordinateText.latitude;
        if (longitude) longitude.value = draft.coordinateText.longitude;
        draft.disclosures.coordinates = true;
        const details = modalBackdrop.querySelector('[data-place-coordinate-details]');
        if (details) details.open = true;
        updatePlaceEditorCoordinateUi();
    }
    else
    {
        draft.existingCandidateId = null;
        draft.name = suggestion.name;
        input.value = suggestion.name;
    }
    draft.query = draft.name;
    updatePlaceEditorDraftDirty(draft);
    updatePlaceEditorSelectionNotice();
    renderPlaceEditorDuplicateWarning();
    closePlaceEditorSuggestions();
}

function useExistingPlaceFromEditor(
    placeId
)
{
    const place =
        getPlace(
            placeId
        );

    if (
        !place
        || place.deleted
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    const wasEditing =
        placeEditorDraft?.mode
          === 'edit';

    const completion =
        placeEditorCompletion;

    resetPlaceEditorDraft();

    closeModal({
        force: true
    });

    if (
        completion?.onComplete
    )
    {
        showToast(
            'Existing place selected. No duplicate was created.'
        );

        requestAnimationFrame(
            () =>
            {
                completion.onComplete(
                    place,
                    {
                        usedExisting:
                  true
                    }
                );
            }
        );

        return;
    }

    state.selectedPlaceId =
        place.id;

    state.placesDetailOpen =
        false;

    renderPlaces();

    showToast(
        wasEditing
            ? 'Existing place opened. The edited place was not changed.'
            : 'Existing place selected. No duplicate was created.'
    );
}

function setPlaceEditorNameError(message = '')
{
    const input = modalBackdrop.querySelector('#placeNameInput');
    const error = modalBackdrop.querySelector('#placeNameError');
    if (error) error.textContent = message;
    input?.setAttribute('aria-invalid', String(Boolean(message)));
}

function commitPlaceEditorDraft({ allowDuplicate = false } = {})
{
    const draft = syncPlaceEditorDraftFromModal();
    if (!draft) return;
    const nameResult = validatePlaceEditorName(draft.name);
    if (!nameResult.valid)
    {
        setPlaceEditorNameError(nameResult.message);
        modalBackdrop.querySelector('#placeNameInput')?.focus();
        return;
    }
    draft.name = nameResult.value;
    const coordinateState = updatePlaceEditorCoordinateUi({ formatValues: true });
    if (!coordinateState?.valid)
    {
        const details = modalBackdrop.querySelector('[data-place-coordinate-details]');
        if (details) details.open = true;
        (modalBackdrop.querySelector('[aria-invalid="true"]') || modalBackdrop.querySelector('#placeLatitudeInput'))?.focus();
        return;
    }
    draft.coordinates = coordinateState.coordinates;
    draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
    draft.alternativeNames = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    const duplicate = findPlaceEditorDuplicate(draft);
    if (duplicate && !(allowDuplicate || draft.duplicateOverride))
    {
        draft.existingCandidateId = duplicate.place.id;
        renderPlaceEditorDuplicateWarning({ force: true });
        modalBackdrop.querySelector('[data-place-duplicate-warning]')?.scrollIntoView({ block: 'nearest' });
        return;
    }
    const existing = draft.placeId ? getPlace(draft.placeId) : null;
    if (draft.mode === 'edit' && !existing)
    {
        setPlaceEditorNameError('This place is no longer available.');
        return;
    }
    const projectId = existing?.projectId || requireActiveProjectId();
    if (!projectId) return;
    const place = existing || {
        id: uniquePlaceIdFromText(draft.name),
        projectId,
        deleted: false
    };
    const coordinatesChanged = Boolean(
        existing
        && storedPlaceCoordinateKey(existing.coordinates) !== storedPlaceCoordinateKey(draft.coordinates)
    );
    place.name = draft.name;
    place.alternativeNames = draft.alternativeNames.slice();
    place.coordinates = clonePlaceEditorCoordinates(draft.coordinates);
    place.updatedAt = new Date().toISOString();
    if (coordinatesChanged)
    {
        clearPlaceReviewDismissals(place.id, PLACE_REVIEW_COORDINATE_ISSUE_TYPES);
    }
    if (!existing) sampleData.places.unshift(place);
    state.selectedPlaceId =
        place.id;

    const completion =
        placeEditorCompletion;

    resetPlaceEditorDraft();

    closeModal({
        force: true
    });

    showToast(
        existing
            ? 'Place updated.'
            : 'Place created.'
    );

    if (
        completion?.onComplete
    )
    {
        requestAnimationFrame(
            () =>
            {
                completion.onComplete(
                    place,
                    {
                        created:
                  !existing
                    }
                );
            }
        );

        return;
    }

    renderPlaces();
}

function renderPlaceEditorModal(draft)
{
    const coordinateState = readPlaceEditorCoordinateState(
        draft.coordinateText.latitude,
        draft.coordinateText.longitude
    );

    const alternativeCount = normalizePlaceAlternativeNames(
        draft.alternativeNames,
        draft.name
    ).length;

    return `
        <div
          class="modal place-editor-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="placeModalTitle"
          data-place-editor>

          <div class="modal-header">
            <div>
              <h2 id="placeModalTitle">
                ${escapeHtml(t(draft.mode === 'edit' ? 'Edit place' : 'Add place'))}
              </h2>
              <p>
                ${escapeHtml(t('Names and map position are saved together only when you confirm.'))}
              </p>
            </div>
            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">
              ${icon.close}
            </button>
          </div>

          <form id="placeForm" novalidate>
            <div class="modal-body form-grid place-editor-body">

              <div class="field full place-editor-place-field">
                <label for="placeNameInput">${escapeHtml(t('Place'))}</label>

                <p class="place-editor-support" id="placeNameSupport">
                  ${escapeHtml(t('Search existing places or map results, or enter a historical place name manually.'))}
                </p>

                <div class="place-editor-combobox" data-place-editor-combobox>
                  <input
                    id="placeNameInput"
                    value="${escapeHtml(draft.name)}"
                    placeholder="${escapeHtml(t('e.g. Pawford, North Yorkshire, England'))}"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="false"
                    aria-controls="placeEditorSuggestions"
                    aria-describedby="placeNameSupport placeNameError"
                    aria-invalid="false"
                    autocomplete="off">

                  <div
                    class="place-editor-suggestions"
                    id="placeEditorSuggestions"
                    role="listbox"
                    aria-label="${escapeHtml(t('Place suggestions'))}"
                    hidden>
                  </div>
                </div>

                <span
                  class="place-editor-field-error"
                  id="placeNameError"
                  role="alert"></span>

                <div
                  class="place-editor-duplicate"
                  data-place-duplicate-warning
                  hidden>
                </div>
              </div>

              <p
                class="place-editor-selection-notice full"
                data-place-selection-notice
                hidden>
              </p>

              <section
                class="place-map-location full"
                aria-labelledby="placeMapLocationHeading">

                <h3 id="placeMapLocationHeading">
                  ${escapeHtml(t('Map location'))}
                </h3>

                <div class="place-map-location-row">
                  <div class="place-map-status">
                    ${icon.mapPin}

                    <div class="place-map-status-copy">
                      <strong data-place-map-status></strong>
                      <span data-place-map-summary hidden></span>
                    </div>
                  </div>

                  <div class="place-map-location-actions">
                    <button
                      class="button secondary compact"
                      type="button"
                      data-place-choose-map>
                      ${escapeHtml(t(
                            coordinateState.hasCoordinates
                                ? 'Edit on map'
                                : 'Choose on map'
                        ))}
                    </button>

                    <button
                      class="place-editor-text-action"
                      type="button"
                      data-place-remove-position
                      ${coordinateState.hasAnyValue ? '' : 'hidden'}>
                      ${escapeHtml(t('Remove position'))}
                    </button>
                  </div>
                </div>

                <details
                  class="field full places-editor-disclosure"
                  data-place-coordinate-details
                  ${draft.disclosures.coordinates || !coordinateState.valid ? 'open' : ''}>

                  <summary>
                    <span class="places-editor-disclosure-summary-label">
                      ${escapeHtml(t('Advanced coordinates'))}
                    </span>
                    <span class="places-editor-disclosure-chevron" aria-hidden="true">
                      ${icon.chevron}
                    </span>
                  </summary>

                  <p class="place-coordinate-help" id="placeCoordinateHelp">
                    ${escapeHtml(t('Enter decimal degrees. Latitude must be between -90 and 90; longitude must be between -180 and 180.'))}
                  </p>

                  <div class="place-coordinate-fields">
                    <label for="placeLatitudeInput">
                      ${escapeHtml(t('Latitude'))}
                      <input
                        id="placeLatitudeInput"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        spellcheck="false"
                        maxlength="24"
                        value="${escapeHtml(draft.coordinateText.latitude)}"
                        placeholder="53.959400"
                        aria-describedby="placeCoordinateHelp placeCoordinateError">
                    </label>

                    <label for="placeLongitudeInput">
                      ${escapeHtml(t('Longitude'))}
                      <input
                        id="placeLongitudeInput"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        spellcheck="false"
                        maxlength="24"
                        value="${escapeHtml(draft.coordinateText.longitude)}"
                        placeholder="-1.082000"
                        aria-describedby="placeCoordinateHelp placeCoordinateError">
                    </label>

                    <button
                      class="place-coordinate-copy-button"
                      type="button"
                      data-place-copy-coordinates
                      aria-label="${escapeHtml(t('Copy coordinates'))}"
                      title="${escapeHtml(t('Copy coordinates'))}"
                      ${coordinateState.hasCoordinates ? '' : 'disabled'}>
                      ${icon.copy}
                    </button>
                  </div>

                  <span
                    class="place-coordinate-error"
                    id="placeCoordinateError"
                    role="alert"
                    aria-live="polite"></span>
                </details>
              </section>

              <details
                class="field full places-editor-disclosure"
                data-place-alternative-details
                ${draft.disclosures.alternativeNames ? 'open' : ''}>

                <summary>
                  <span class="places-editor-disclosure-summary-label">
                    ${escapeHtml(t('Historical / alternative names'))}
                    <span data-place-alternative-count>
                      ${alternativeCount ? ` · ${alternativeCount}` : ''}
                    </span>
                  </span>
                  <span class="places-editor-disclosure-chevron" aria-hidden="true">
                    ${icon.chevron}
                  </span>
                </summary>

                <p class="place-editor-support">
                  ${escapeHtml(t('Enter one full historical or alternative place name per line.'))}
                </p>

                <label for="placeAlternativeNamesInput">
                  ${escapeHtml(t('Alternative names'))}
                </label>
                <textarea id="placeAlternativeNamesInput">${escapeHtml(
                    draft.alternativeNames.join('\n')
                )}</textarea>
              </details>

            </div>

            <div class="modal-footer">
              <button class="button secondary" type="button" data-close>
                ${escapeHtml(t('Cancel'))}
              </button>
              <button class="button primary" type="submit">
                ${escapeHtml(t(draft.mode === 'edit' ? 'Save changes' : 'Create place'))}
              </button>
            </div>
          </form>
        </div>
      `;
}

function startPlaceEditorMapSelection()
{
    const draft = syncPlaceEditorDraftFromModal();
    if (!draft) return;
    draft.mapSession = {
        returnToModal: true,
        coordinates: clonePlaceEditorCoordinates(draft.coordinates),
        coordinateText: { ...draft.coordinateText }
    };
    clearTimeout(placeGeocoderTimer);
    placeGeocoderController?.abort();
    closeModal({ force: true, preservePlaceEditor: true });
    state.placesViewMode = 'map';
    renderPlacesMain();
    requestAnimationFrame(() => requestAnimationFrame(() =>
    {
        if (draft.mode === 'edit') enterPlacesMapMoveMode(draft.placeId);
        else enterPlacesMapAddMode();
    }));
}

function openPlaceDuplicateMenu(anchor, placeId)
{
    const root = anchor.closest('[data-place-editor]');
    const draft = placeEditorDraft;

    if (!root || !draft) return;

    if (
        document.querySelector('[data-place-duplicate-menu]')
        && menuLifecycleAnchor === anchor
    )
    {
        closeMenu();
        return;
    }

    closeMenu();

    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover';
    menu.dataset.placeDuplicateMenu = '';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('More actions'));

    menu.innerHTML = `
        <button
          type="button"
          role="menuitem"
          data-duplicate-action="details">
          ${escapeHtml(t('Place details'))}
        </button>

        <button
          type="button"
          role="menuitem"
          data-duplicate-action="ignore">
          ${escapeHtml(t('Ignore'))}
        </button>
      `;

    // Keep the menu inside the modal's focus boundary,
    // but outside its scrolling content.
    modalBackdrop.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    const left = Math.max(
        12,
        Math.min(rect.right - menuRect.width,
            window.innerWidth - menuRect.width - 12)
    );

    const preferredTop = rect.bottom + 6;
    const top = preferredTop + menuRect.height <= window.innerHeight - 12
        ? preferredTop
        : Math.max(12, rect.top - menuRect.height - 6);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    anchor.setAttribute('aria-expanded', 'true');
    bindMenuLifecycle(anchor);

    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-duplicate-action]')
            ?.dataset.duplicateAction;

        if (!action) return;

        closeMenu();

        if (!root.isConnected || placeEditorDraft !== draft) return;

        if (action === 'details')
        {
            const panel = root.querySelector('#placeDuplicateReview');
            if (panel) panel.hidden = !panel.hidden;

            anchor.focus({ preventScroll: true });
            return;
        }

        if (action === 'ignore')
        {
            draft.dismissedDuplicateId = placeId;
            draft.existingCandidateId = null;
            draft.duplicateOverride = true;

            renderPlaceEditorDuplicateWarning();

            root.querySelector('[data-place-choose-map]')?.focus({
                preventScroll: true
            });
        }
    });

    const items = [...menu.querySelectorAll('[role="menuitem"]')];

    menu.addEventListener('keydown', event =>
    {
        const index = items.indexOf(document.activeElement);
        let next;

        if (event.key === 'ArrowDown') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp')
        {
            next = (index - 1 + items.length) % items.length;
        }
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'Tab')
        {
            event.preventDefault();
            closeMenu();
            anchor.focus({ preventScroll: true });
            return;
        }
        else
        {
            return;
        }

        event.preventDefault();
        items[next].focus({ preventScroll: true });
    });

    items[0]?.focus({ preventScroll: true });
}

function bindPlaceEditor()
{
    const draft =
        placeEditorDraft;

    const root =
        modalBackdrop.querySelector(
            '[data-place-editor]'
        );

    const input =
        root?.querySelector(
            '#placeNameInput'
        );

    if (
        !draft
        || !root
        || !input
    )
    {
        return;
    }

    /*
      * The editor focuses the Place field when the
      * modal opens. Do not treat that programmatic
      * focus as a request to open suggestions.
      */
    let suppressInitialSuggestionOpen =
        true;
    let openBeforePointer = null;

    input.addEventListener(
        'pointerdown',
        () =>
        {
            suppressInitialSuggestionOpen =
                false;
            openBeforePointer = input.getAttribute('aria-expanded') === 'true';
        }
    );

    input.addEventListener(
        'focus',
        () =>
        {
            if (
                !suppressInitialSuggestionOpen
            )
            {
                renderPlaceEditorSuggestions();
            }
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
                closePlaceEditorSuggestions();
            }
            else if (input.getAttribute('aria-expanded') !== 'true')
            {
                renderPlaceEditorSuggestions();
            }
        }
    );
    input.addEventListener('input', () =>
    {
        draft.name = input.value;
        draft.query = input.value;
        draft.searchTouched = true;
        draft.selectedSuggestion = null;
        draft.existingCandidateId = null;
        draft.duplicateOverride = false;
        draft.dismissedDuplicateId = null;
        setPlaceEditorNameError();
        updatePlaceEditorDraftDirty(draft);
        renderPlaceEditorDuplicateWarning();
        renderPlaceEditorSuggestions();
        schedulePlaceEditorMapSearch(input.value);
    });
    input.addEventListener('keydown', event =>
    {
        const count = draft.renderedSuggestions.length;
        if (event.key === 'ArrowDown' && count)
        {
            event.preventDefault();
            draft.activeSuggestionIndex = (draft.activeSuggestionIndex + 1 + count) % count;
            updatePlaceEditorActiveSuggestion();
        }
        else if (event.key === 'ArrowUp' && count)
        {
            event.preventDefault();
            draft.activeSuggestionIndex = (draft.activeSuggestionIndex - 1 + count) % count;
            updatePlaceEditorActiveSuggestion();
        }
        else if (event.key === 'Enter')
        {
            event.preventDefault();
            if (draft.activeSuggestionIndex >= 0) selectPlaceEditorSuggestion(draft.activeSuggestionIndex);
            else closePlaceEditorSuggestions();
        }
        else if (event.key === 'Escape')
        {
            event.stopPropagation();
            closePlaceEditorSuggestions();
        }
        else if (event.key === 'Tab')
        {
            closePlaceEditorSuggestions();
        }
    });
    root.querySelector('[data-place-editor-combobox]')?.addEventListener('focusout', () => setTimeout(() =>
    {
        if (!root.querySelector('[data-place-editor-combobox]')?.contains(document.activeElement)) closePlaceEditorSuggestions();
    }, 0));
    root.querySelector('#placeEditorSuggestions')?.addEventListener('mousedown', event => event.preventDefault());
    root.querySelector('#placeEditorSuggestions')?.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-place-editor-option]');
        if (option) selectPlaceEditorSuggestion(option.dataset.placeEditorOption);
        if (event.target.closest('[data-place-editor-retry]')) schedulePlaceEditorMapSearch(input.value, { immediate: true });
    });
    root.querySelector('#placeAlternativeNamesInput')?.addEventListener('input', () =>
    {
        draft.dismissedDuplicateId = null;
        draft.duplicateOverride = false;
        updatePlaceEditorAlternativeSummary();
        renderPlaceEditorDuplicateWarning();
    });
    root.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () =>
    {
        if (details.matches('[data-place-alternative-details]')) draft.disclosures.alternativeNames = details.open;
        if (details.matches('[data-place-coordinate-details]')) draft.disclosures.coordinates = details.open;
    }));
    ['#placeLatitudeInput', '#placeLongitudeInput'].forEach(selector =>
    {
        root.querySelector(selector)?.addEventListener('input', () =>
        {
            draft.selectedSuggestion = null;
            draft.dismissedDuplicateId = null;
            draft.duplicateOverride = false;
            updatePlaceEditorSelectionNotice();
            updatePlaceEditorCoordinateUi();
            renderPlaceEditorDuplicateWarning();
        });
        root.querySelector(selector)?.addEventListener('blur', () => updatePlaceEditorCoordinateUi({ formatValues: true }));
    });
    root.querySelector('[data-place-copy-coordinates]')?.addEventListener('click', async () =>
    {
        const result = updatePlaceEditorCoordinateUi({ formatValues: true });
        if (!result?.hasCoordinates) return;
        const text = `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}`;
        try
        {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            showToast('Coordinates copied.');
        }
        catch
        {
            showToast(text);
        }
    });
    root.querySelector('[data-place-remove-position]')?.addEventListener('click', () =>
    {
        root.querySelector('#placeLatitudeInput').value = '';
        root.querySelector('#placeLongitudeInput').value = '';

        draft.selectedSuggestion = null;
        draft.duplicateOverride = false;
        draft.dismissedDuplicateId = null;

        updatePlaceEditorSelectionNotice();
        updatePlaceEditorCoordinateUi();
        renderPlaceEditorDuplicateWarning();

        root.querySelector('[data-place-choose-map]')?.focus({
            preventScroll: true
        });
    });
    root.querySelector('[data-place-choose-map]')?.addEventListener('click', startPlaceEditorMapSelection);
    root.querySelector('[data-place-duplicate-warning]')?.addEventListener('click', event =>
    {
        const moreButton = event.target.closest('[data-place-duplicate-more]');

        if (moreButton)
        {
            openPlaceDuplicateMenu(
                moreButton,
                moreButton.dataset.placeDuplicateMore
            );
            return;
        }

        const existingId = event.target.closest('[data-place-use-existing]')
            ?.dataset.placeUseExisting;

        if (existingId && draft.mode === 'add')
        {
            useExistingPlaceFromEditor(existingId);
        }
    });
    root.querySelector('#placeForm')?.addEventListener('submit', event =>
    {
        event.preventDefault();
        commitPlaceEditorDraft();
    });
    updatePlaceEditorAlternativeSummary();
    updatePlaceEditorCoordinateUi();
    updatePlaceEditorSelectionNotice();
    renderPlaceEditorDuplicateWarning();
    requestAnimationFrame(
        () =>
        {
            input.focus({
                preventScroll: true
            });

            suppressInitialSuggestionOpen =
                false;
        }
    );
}

function openPlaceModal(
    placeId = null,
    {
        initialCoordinates = null,
        draft = null,
        completion = undefined
    } = {}
)
{
    const mode =
        placeId
            ? 'edit'
            : 'add';

    if (draft)
    {
        placeEditorDraft =
            draft;
    }
    else if (
        !placeEditorDraft
        || placeEditorDraft.mode
          !== mode
        || placeEditorDraft.placeId
          !== placeId
    )
    {
        resetPlaceEditorDraft();

        placeEditorDraft =
            createPlaceEditorDraft(
                placeId,
                {
                    initialCoordinates
                }
            );
    }
    else if (initialCoordinates)
    {
        placeEditorDraft.coordinates =
            clonePlaceEditorCoordinates(
                initialCoordinates
            );

        placeEditorDraft.coordinateText =
            placeEditorCoordinateText(
                placeEditorDraft.coordinates
            );
    }

    if (!placeEditorDraft)
    {
        return;
    }
    if (
        completion !== undefined
    )
    {
        placeEditorCompletion =
            completion;
    }

    placeEditorDraft.mapSession =
        null;

    openModal(
        renderPlaceEditorModal(
            placeEditorDraft
        )
    );

    bindPlaceEditor();
}

function openPlaceModalForCoordinateReview(placeId)
{
    resetPlaceEditorDraft();
    const draft = createPlaceEditorDraft(placeId);
    if (!draft) return;
    draft.disclosures.coordinates = true;
    openPlaceModal(placeId, { draft });
    requestAnimationFrame(() =>
    {
        const invalidInput = modalBackdrop.querySelector('[data-place-coordinate-details] [aria-invalid="true"]');
        (invalidInput || modalBackdrop.querySelector('#placeLatitudeInput'))?.focus({ preventScroll: true });
    });
}
function openDeletePlaceModal(placeId, { returnToEditor = false } = {})
{
    const place = getPlace(placeId); if (!place) return;
    const returnAttribute = returnToEditor && placeEditorDraft ? ' data-return-to-place-editor' : '';
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deletePlaceTitle" data-place-delete-confirm${returnAttribute}><div class="modal-header"><div><h2 id="deletePlaceTitle">Delete place permanently?</h2><p>This action cannot be undone.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body place-delete-confirm"><strong>${escapeHtml(place.name)}</strong><ul><li>The place will no longer appear in calculated routes.</li><li>Structured links from connected records will be cleared.</li><li>Connected people, events, files, photos, and notes will remain.</li><li>Textual mentions may remain in free-text content.</li></ul></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-delete-place>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-confirm-delete-place]')?.addEventListener('click', () =>
    {
        resetPlaceEditorDraft();
        (sampleData.boards || []).forEach(board =>
        {
            let repairedBoardPlace = false;
            (board.diagram?.nodes || []).forEach(node =>
            {
                if (node.type !== 'place' || node.placeRef?.scope !== 'project' || node.placeRef.id !== place.id) return;
                node.placeRef = {
                    scope: 'board',
                    name: String(node.placeRef.fallbackName || placePrimaryName(place) || place.name || 'Place').trim()
                };
                repairedBoardPlace = true;
            });
            if (repairedBoardPlace) board.updatedAt = new Date().toISOString();
        });
        removeSourceLinksForTarget(
            'place',
            place.id
        );
        sampleData.places = sampleData.places.filter(item => item.id !== place.id);
        sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue => issue.placeId !== place.id);
        sampleData.people.forEach(person => [person, person.birth, person.death, ...(person.events || []), ...(person.attributes || [])].filter(Boolean).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        centralFamilyRecords().forEach(family => [family, ...(family.events || [])].forEach(record => clearStructuredPlaceReferences(record, place.id)));
        [sampleData.media, sampleData.archiveFiles, sampleData.sources, sampleData.notes].forEach(records => (records || []).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        sampleData.links = sampleData.links.filter(link => !placeLinkMatches(link, place.id));
        sampleData.events =
            rebuildSampleEventsAndPruneSourceLinks();

        state.selectedPlaceId =
            projectPlaces()
                .find(item =>
                    !item.deleted
                )
                ?.id
          || null;

        closeModal();
        renderPlaces();

        showToast(
            'Place deleted permanently.'
        );
    });
}

const publishTypes = [
    { id: 'report', title: 'Family report', label: 'Report', desc: 'Create a readable person, branch, ancestor, or descendant report.', formats: ['PDF', 'DOCX later', 'HTML later'], best: 'Narrative family history with sources and notes.' },
    { id: 'chart', title: 'Family chart', label: 'Chart', desc: 'Create a visual ancestor, descendant, fan, or tree snapshot.', formats: ['PDF', 'PNG', 'SVG later'], best: 'Printable visual overview for relatives.' },
    { id: 'export', title: 'Data export', label: 'Export', desc: 'Prepare a structured data package for backup or sharing.', formats: ['GEDCOM', 'GEDZip later', 'Media package later'], best: 'Moving data between genealogy tools.' }
];

sampleData.publishDrafts = [
    { id: 'pub1', title: 'Who was Luna Purrington-s father?', type: 'report', preview: 'report', scope: 'Research case report', updated: 'Just now', privacy: 'Draft', sources: '8 sources', format: 'PDF', status: 'draft', details: ['18 pages', '3 people', '8 sources', '6 notes'] },
    { id: 'pub2', title: 'The Whiskerfield Family - Our Story', type: 'report', preview: 'book', scope: 'Book project', updated: '2 days ago', privacy: 'In progress', sources: '116 sources', format: 'PDF', status: 'draft', details: ['12 chapters', '42 photos', '116 sources', '78% complete'] },
    { id: 'pub3', title: 'Maternal Line - Geneograph Board', type: 'chart', preview: 'chart', scope: 'Geneograph poster', updated: '3 days ago', privacy: 'Ready to export', sources: '1 board', format: 'PNG', status: 'draft', details: ['A3 landscape', 'Includes 1 board', 'High resolution'] },
    { id: 'pub4', title: 'Migration of the Whiskerfield Family', type: 'chart', preview: 'map', scope: 'Migration map', updated: '6 days ago', privacy: 'Ready to export', sources: 'Places and events included', format: 'PDF', status: 'draft', details: ['Places: 14', 'Events: 32', 'Time range: 1860-1970'] },
    { id: 'pub5', title: 'Metric Book 1887 - Index', type: 'export', preview: 'index', scope: 'Archive index', updated: '1 week ago', privacy: 'Published', sources: 'Archive files included', format: 'CSV', status: 'exported', details: ['Pages: 248', 'Extracted entries: 381', 'People: 192', 'Places: 37'] },
    { id: 'pub6', title: 'Barnaby Whiskerfield - Biography', type: 'report', preview: 'biography', scope: 'Person biography', updated: '1 week ago', privacy: 'Draft', sources: '46 sources', format: 'PDF', status: 'draft', details: ['24 pages', '27 photos', '46 sources', '2 maps'] }
].map(draft => ({
    ...draft,
    projectId: 'p1'
}));

function getProjectPublishDrafts(projectId = currentProjectId())
{
    if (!projectId) return [];
    return (sampleData.publishDrafts || []).filter(draft =>
        draft.projectId === projectId
    );
}

function getPublishDraft(draftId, projectId = currentProjectId())
{
    return getProjectPublishDrafts(projectId).find(draft => draft.id === draftId) || null;
}

function publishProjectPeople()
{
    return getPeople(currentProjectId());
}

function publishFocusPerson()
{
    const people = publishProjectPeople();
    const selected = people.find(person => person.id === state.publishFocusPersonId);
    return selected || people[0] || null;
}

function publishTypeNeedsPeople(typeId)
{
    return typeId === 'report' || typeId === 'chart';
}

