let mobileSurface = null;
let mobileSurfaceReturnFocus = null;
let mobileBodyOverflow = '';
let mobileDetailModule = null;

function mobileDetailTarget()
{
    const selectors = {
        'Family Tree': '.tree-inspector',
        People: '.people-person-sidebar',
        Albums: '.albums-detail:not(.collapsed)',
        Archive: '.archive-inspector',
        Places: '.places-inspector',
        Geneograph: '.geneo-inspector:not(.collapsed)'
    };
    return main.querySelector(selectors[state.activeModule] || '.no-mobile-detail');
}

function expandMobileDetailTarget()
{
    if (state.activeModule === 'Family Tree' && state.treeInspectorCollapsed)
    {
        state.treeInspectorCollapsed = false;
        renderFamilyTreePreserveScroll();
    }
    else if (state.activeModule === 'People' && state.peoplePreviewCollapsed)
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
    }
    else if (state.activeModule === 'Albums' && state.albumsDetailCollapsed)
    {
        state.albumsDetailCollapsed = false;
        renderAlbumsPreserveViewport();
    }
    else if (state.activeModule === 'Archive' && state.archiveInspectorCollapsed)
    {
        state.archiveInspectorCollapsed = false;
        renderArchive();
    }
    else if (state.activeModule === 'Places' && state.placesInspectorCollapsed)
    {
        state.placesInspectorCollapsed = false;
        renderPlaces();
    }
    else if (state.activeModule === 'Geneograph' && state.geneoInspectorCollapsed)
    {
        state.geneoInspectorCollapsed = false;
        renderGeneographEditorPreserveScroll();
    }
}

function closeMobileSurface(restoreFocus = true)
{
    if (!mobileSurface) return;
    const wasSections = mobileSurface === 'sections';
    mobileSurface = null;
    document.querySelector('#mobileSurfaceBackdrop')?.remove();
    document.querySelector('#mobileModuleDrawer')?.remove();
    document.querySelector('#mobileSectionsHeader')?.remove();
    document.querySelector('#mobileDetailsClose')?.remove();
    document.body.classList.remove('mobile-surface-open', 'mobile-sections-open', 'mobile-details-open');
    mobileDetailModule = null;
    topbar.querySelectorAll('[data-mobile-menu], [data-mobile-sections], [data-mobile-details]')
        .forEach(button => button.setAttribute('aria-expanded', 'false'));
    document.body.style.overflow = mobileBodyOverflow;
    if (wasSections)
    {
        sidebar.removeAttribute('role');
        sidebar.removeAttribute('aria-modal');
        sidebar.removeAttribute('aria-label');
    }
    document.removeEventListener('keydown', handleMobileSurfaceKeydown, true);
    if (restoreFocus && mobileSurfaceReturnFocus?.isConnected)
        mobileSurfaceReturnFocus.focus({ preventScroll: true });
    mobileSurfaceReturnFocus = null;
}

function handleMobileSurfaceKeydown(event)
{
    if (!mobileSurface) return;
    if (event.key === 'Escape')
    {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMobileSurface();
        return;
    }
    if (event.key !== 'Tab') return;
    if (modalBackdrop.classList.contains('open')) return;
    const surface = mobileSurface === 'sections' ? sidebar : mobileSurface === 'details' ? mobileDetailTarget() : document.querySelector('#mobileModuleDrawer');
    if (!surface) return;
    const focusable = [...surface.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')]
        .filter(item => item.getClientRects().length);
    if (mobileSurface === 'details') focusable.unshift(document.querySelector('#mobileDetailsClose'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first)
    {
        event.preventDefault(); last.focus();
    }
    else if (!event.shiftKey && document.activeElement === last)
    {
        event.preventDefault(); first.focus();
    }
}

function openMobileSurface(kind)
{
    if (window.innerWidth > (kind === 'details' ? 1180 : 900)) return;
    if (kind === 'details') expandMobileDetailTarget();
    if (mobileSurface === kind)
    {
        closeMobileSurface();
        return;
    }
    closeMobileSurface(false);
    mobileSurface = kind;
    mobileSurfaceReturnFocus = document.activeElement;
    mobileSurfaceReturnFocus?.setAttribute?.('aria-expanded', 'true');
    mobileBodyOverflow = document.body.style.overflow;
    document.body.classList.add('mobile-surface-open');
    document.body.style.overflow = 'hidden';

    const backdrop = document.createElement('div');
    backdrop.id = 'mobileSurfaceBackdrop';
    backdrop.className = 'mobile-surface-backdrop';
    backdrop.addEventListener('click', () => closeMobileSurface());
    document.body.appendChild(backdrop);

    if (kind === 'details')
    {
        if (!mobileDetailTarget())
        {
            closeMobileSurface();
            return;
        }
        mobileDetailModule = state.activeModule;
        document.body.classList.add('mobile-details-open');
        const close = document.createElement('button');
        close.id = 'mobileDetailsClose';
        close.type = 'button';
        close.setAttribute('aria-label', t('Close details'));
        close.innerHTML = `${icon.close}<span>${escapeHtml(t('Close'))}</span>`;
        close.addEventListener('click', () => closeMobileSurface());
        document.body.appendChild(close);
        close.focus();
    }
    else if (kind === 'sections')
    {
        document.body.classList.add('mobile-sections-open');
        sidebar.setAttribute('role', 'dialog');
        sidebar.setAttribute('aria-modal', 'true');
        sidebar.setAttribute('aria-label', t('Sections'));
        sidebar.insertAdjacentHTML('afterbegin', `<div class="mobile-drawer-heading" id="mobileSectionsHeader"><strong>${escapeHtml(t('Sections'))}</strong><button type="button" data-mobile-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>`);
        sidebar.querySelector('[data-mobile-close]')?.addEventListener('click', () => closeMobileSurface());
        sidebar.querySelector('[data-mobile-close]')?.focus();
    }
    else
    {
        const drawer = document.createElement('div');
        drawer.id = 'mobileModuleDrawer';
        drawer.className = 'mobile-module-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', t('Modules'));
        const icons = { 'Family Tree': icon.tree, People: icon.people, Geneograph: icon.whiteboard, Albums: icon.image, Archive: icon.archive, Notes: icon.note, Places: icon.mapPin };
        drawer.innerHTML = `<div class="mobile-drawer-heading"><strong>${escapeHtml(t('Modules'))}</strong><button type="button" data-mobile-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
            <nav aria-label="${escapeHtml(t('Modules'))}">
                <button type="button" data-mobile-destination="library" ${!state.projectOpen ? 'aria-current="page"' : ''}>${icon.home}<span>${escapeHtml(t('All projects'))}</span></button>
                ${state.projectOpen ? `<button type="button" data-mobile-destination="overview" ${state.activeModule === 'Projects' ? 'aria-current="page"' : ''}>${icon.grid}<span>${escapeHtml(t('Project overview'))}</span></button>
                    ${modules.map(module => `<button type="button" data-mobile-destination="${escapeHtml(module)}" ${state.activeModule === module ? 'aria-current="page"' : ''}>${icons[module] || icon.grid}<span>${escapeHtml(t(module))}</span></button>`).join('')}
                    <button type="button" class="mobile-drawer-utility" data-mobile-destination="notifications">${icon.bell}<span>${escapeHtml(t('Notifications'))}</span></button>` : ''}
            </nav>`;
        document.body.appendChild(drawer);
        drawer.querySelector('[data-mobile-close]').addEventListener('click', () => closeMobileSurface());
        drawer.querySelectorAll('[data-mobile-destination]').forEach(button => button.addEventListener('click', () =>
        {
            const destination = button.dataset.mobileDestination;
            closeMobileSurface(false);
            if (destination === 'notifications')
            {
                openTopbarPopover('notifications', topbar.querySelector('[data-mobile-menu]'));
                return;
            }
            if (destination === 'library')
            {
                if (state.activeModule === 'Family Tree') captureTreeCanvasScroll(currentProjectId());
                if (state.activeModule === 'Geneograph' && state.geneoView === 'board') captureGeneographViewport();
                state.projectOpen = false;
                state.currentProjectId = null;
                state.activeModule = 'Projects';
                render();
            }
            else navigateToProjectModule(currentProjectId(), destination === 'overview' ? 'Projects' : destination);
            requestAnimationFrame(() =>
            {
                main.tabIndex = -1;
                main.focus({ preventScroll: true });
            });
        }));
        drawer.querySelector('[data-mobile-close]').focus();
    }
    document.addEventListener('keydown', handleMobileSurfaceKeydown, true);
}

window.addEventListener('resize', () =>
{
    if (window.innerWidth > (mobileSurface === 'details' ? 1180 : 900)) closeMobileSurface(false);
});

sidebar.addEventListener('click', event =>
{
    if (mobileSurface !== 'sections') return;
    const button = event.target.closest('button');
    if (!button || (button.hasAttribute('aria-expanded') && !button.hasAttribute('aria-haspopup'))) return;
    requestAnimationFrame(() =>
    {
        if (mobileSurface === 'sections' && !modalBackdrop.classList.contains('open'))
            closeMobileSurface(false);
    });
}, true);

main.addEventListener('click', event =>
{
    if (mobileSurface !== 'details' || !mobileDetailTarget()?.contains(event.target)
        || !event.target.closest('button[aria-haspopup]')) return;
    requestAnimationFrame(() =>
    {
        if (mobileSurface === 'details' && !modalBackdrop.classList.contains('open'))
            closeMobileSurface(false);
    });
}, true);

function render()
{
    if (mobileSurface !== 'details' || mobileDetailModule !== state.activeModule)
        closeMobileSurface(false);
    geneoProductTourOnRender();
    closeMenu();
    disposeTreeSearch();

    if (state.activeModule !== 'Notes')
    {
        destroyNotesRichTextEditor();
    }

    if (state.activeModule !== 'People' && state.peopleSelectedIds.length)
    {
        clearPeopleSelection();
    }
    if (state.activeModule !== 'Albums')
    {
        disconnectAlbumsGridResizeObserver();
    }
    if (state.activeModule !== 'Places')
    {
        destroyPlacesMap();
        if (placeEditorDraft) resetPlaceEditorDraft();
    }
    applyLanguage();
    main.classList.remove('people-profile-main');
    renderTopbar();
    if (mobileSurface === 'details') requestAnimationFrame(() =>
    {
        if (mobileSurface === 'details' && !mobileDetailTarget()) closeMobileSurface(false);
    });
    workspace.classList.toggle('no-sidebar', state.activeModule === 'Family Tree');
    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTree();
        return;
    }
    if (state.activeModule === 'People')
    {
        renderPeople();
        return;
    }
    if (state.activeModule === 'Geneograph')
    {
        renderGeneograph();
        return;
    }
    if (state.activeModule === 'Albums')
    {
        renderAlbums();
        return;
    }
    if (state.activeModule === 'Archive')
    {
        renderArchive();
        return;
    }
    if (state.activeModule === 'Notes')
    {
        renderNotes();
        return;
    }
    if (state.activeModule === 'Places')
    {
        renderPlaces();
        return;
    }
    if (state.activeModule === 'Publish')
    {
        renderPublish();
        return;
    }
    if (state.activeModule !== 'Projects')
    {
        renderModulePlaceholder();
        return;
    }
    if (state.projectOpen) renderOpenProject();
    else renderStartup();
}

function restoreSearchInputFocus(selector, selectionStart, selectionEnd)
{
    requestAnimationFrame(() =>
    {
        const input = document.querySelector(selector);
        if (!input) return;
        input.focus({ preventScroll: true });
        if (typeof input.setSelectionRange !== 'function') return;
        const valueLength = input.value.length;
        const start = Math.min(selectionStart ?? valueLength, valueLength);
        const end = Math.min(selectionEnd ?? start, valueLength);
        input.setSelectionRange(start, end);
    });
}

function handleSearchInput(event, { stateKey, render, selector })
{
    const input = event.target;
    const nextValue = input.value;
    const fallbackPosition = nextValue.length;
    const selectionStart = typeof input.selectionStart === 'number' ? input.selectionStart : fallbackPosition;
    const selectionEnd = typeof input.selectionEnd === 'number' ? input.selectionEnd : selectionStart;
    state[stateKey] = nextValue;
    render();
    restoreSearchInputFocus(selector || `#${input.id}`, selectionStart, selectionEnd);
}

function bindSearchInput(root, selector, stateKey, render)
{
    root.querySelector(selector)?.addEventListener('input', event => handleSearchInput(event, { stateKey, render, selector }));
}

function renderTopbar()
{
    const showModules = state.projectOpen;
    const showSections = showModules && state.activeModule !== 'Family Tree';
    const showDetails = showModules && ['Family Tree', 'People', 'Albums', 'Archive', 'Places', 'Geneograph'].includes(state.activeModule)
        && !(state.activeModule === 'Family Tree' && !currentTreePeople().length)
        && !(state.activeModule === 'People' && !currentPeopleRecords().length)
        && !(state.activeModule === 'People' && state.peopleView === 'profile')
        && !(state.activeModule === 'Geneograph' && state.geneoView !== 'board');
    const signedLabel = state.userSignedIn ? 'SW' : 'IN';
    topbar.innerHTML = `
        <button class="mobile-menu-trigger" type="button" data-mobile-menu aria-label="${escapeHtml(t('Modules'))}" title="${escapeHtml(t('Modules'))}" aria-haspopup="dialog" aria-expanded="false">${icon.menu}</button>
        <button class="home-tab ${state.activeModule === 'Projects' ? 'active' : ''}" type="button" data-home aria-label="Projects home">${icon.home}</button>
        <button class="mobile-sections-trigger" type="button" data-mobile-sections aria-label="${escapeHtml(t('Sections'))}" title="${escapeHtml(t('Sections'))}" aria-haspopup="dialog" aria-expanded="false" ${showSections ? '' : 'hidden'}>${icon.panel}</button>
        <button class="mobile-details-trigger" type="button" data-mobile-details data-mobile-detail-module="${escapeHtml(state.activeModule)}" aria-label="${escapeHtml(t('Details'))}" title="${escapeHtml(t('Details'))}" aria-haspopup="dialog" aria-expanded="false" ${showDetails ? '' : 'hidden'}>${icon.info}</button>
        ${showModules ? `<nav class="topnav" aria-label="Project modules">
          ${modules.map(module => `
            <button
              class="tab ${
                    state.activeModule === module
                        ? 'active'
                        : ''
                }"
              type="button"
              data-module="${escapeHtml(module)}">
              ${escapeHtml(t(module))}
            </button>
          `).join('')}
          </nav>` : '<div style="flex:1"></div>'}
        <div class="top-actions">
          ${showModules ? `<div class="global-search">${icon.search}<span>Search anything...</span><span class="shortcut">Ctrl + K</span></div>` : ''}
          <button class="top-icon" type="button" data-topbar-help aria-haspopup="dialog" aria-label="Help">${icon.help}</button>
          ${showModules ? `<button class="top-icon has-dot" type="button" data-topbar-notifications aria-haspopup="dialog" aria-label="Notifications">${icon.bell}${state.unreadNotifications ? '<span class="topbar-dot" aria-hidden="true"></span>' : ''}</button>` : ''}
          <button class="top-icon" type="button" data-topbar-settings aria-haspopup="dialog" aria-label="Settings">${icon.settings}</button>
          <button class="avatar" type="button" data-topbar-profile aria-haspopup="dialog" aria-label="User profile">${signedLabel}</button>
        </div>
      `;
    topbar.querySelector('[data-home]')?.addEventListener('click', () =>
    {
        closeTopbarPopover();
        if (state.projectOpen) navigateToProjectModule(currentProjectId(), 'Projects');
        else
        {
            state.activeModule = 'Projects'; render();
        }
    });
    topbar.querySelector('[data-mobile-menu]')?.addEventListener('click', () => openMobileSurface('modules'));
    topbar.querySelector('[data-mobile-sections]')?.addEventListener('click', () => openMobileSurface('sections'));
    topbar.querySelector('[data-mobile-details]')?.addEventListener('click', () => openMobileSurface('details'));
    topbar.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () =>
    {
        closeTopbarPopover();
        if (state.projectOpen && state.activeModule === button.dataset.module) return;
        navigateToProjectModule(currentProjectId(), button.dataset.module);
    }));
    topbar.querySelector('[data-topbar-help]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('help', event.currentTarget);
    });
    topbar.querySelector('[data-topbar-notifications]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('notifications', event.currentTarget);
    });
    topbar.querySelector('[data-topbar-settings]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); closeTopbarPopover(); openGlobalSettingsModal();
    });
    topbar.querySelector('[data-topbar-profile]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('profile', event.currentTarget);
    });
    localizeUI(
        topbar,
        {
            suppressObserverReplay: true
        }
    );
}


function openTopbarPopover(type, anchor)
{
    closeMenu();
    closeTopbarPopover();
    const html = type === 'help' ? renderHelpPopover() : type === 'notifications' ? renderNotificationsPopover() : renderProfilePopover();
    const popover = document.createElement('div');
    popover.className = `topbar-popover ${type === 'notifications' ? 'wide' : ''}`;
    popover.id = 'topbarPopover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', type === 'help' ? 'Help center' : type === 'notifications' ? 'Notifications' : 'Profile menu');
    popover.innerHTML = html;
    document.body.appendChild(popover);
    const rect = anchor.getBoundingClientRect();
    const width = popover.offsetWidth || (type === 'notifications' ? 404 : 360);
    popover.style.top = `${rect.bottom + 8}px`;
    popover.style.left = `${Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width))}px`;
    bindTopbarPopover(popover, type);
    localizeUI(
        popover,
        {
            suppressObserverReplay: true
        }
    );
    setTimeout(() => document.addEventListener('click', closeTopbarPopoverOnOutside), 0);
}

function closeTopbarPopover()
{
    document.getElementById('topbarPopover')?.remove();
    document.removeEventListener('click', closeTopbarPopoverOnOutside);
}

function closeTopbarPopoverOnOutside(event)
{
    if (!event.target.closest('#topbarPopover') && !event.target.closest('[data-topbar-help], [data-topbar-notifications], [data-topbar-settings], [data-topbar-profile]')) closeTopbarPopover();
}

function renderHelpPopover()
{
    return `<div class="topbar-popover-header"><div><h2>Help center</h2><p>Find guides, shortcuts, and support for GeneoGraph.</p></div></div>
        <div class="topbar-popover-list">
            <button class="topbar-popover-row" type="button" data-help-tour>
                <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.compass}</span>
                <span class="topbar-popover-copy"><strong>Take the tour</strong><span>Explore the sample project across GeneoGraph.</span></span>
                <span class="topbar-popover-arrow">${icon.chevron}</span>
            </button>
            <button class="topbar-popover-row help-center-unavailable" type="button" disabled>
                <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.file}</span>
                <span class="topbar-popover-copy"><strong>Help center</strong><span>Coming later</span></span>
            </button>
        </div>
        <div class="topbar-popover-footer help-popover-footer">
            <a class="topbar-text-button" href="https://geneograph.com/contact.html" target="_blank" rel="noopener noreferrer" data-help-support>Contact support</a>
        </div>`;
}

function renderNotificationsPopover()
{
    const rows = projectNotifications().map(item => `<button class="topbar-popover-row" type="button" data-notification-id="${item.id}"><span class="topbar-popover-icon topbar-topic-icon ${item.tone === 'warn' ? 'warn' : item.tone === 'blue' ? 'blue' : item.tone === 'purple' ? 'purple' : ''}" aria-hidden="true">${item.icon}</span><span class="topbar-popover-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></span><span class="topbar-popover-arrow">${icon.chevron}</span></button>`).join('');
    return `<div class="topbar-popover-header"><div><h2>Notifications</h2><p>${state.unreadNotifications ? `${state.unreadNotifications} items need attention` : 'No unread notifications'}</p></div><button class="topbar-text-button" type="button" data-notifications-read>Mark all read</button></div><div class="topbar-popover-list">${rows}</div><div class="topbar-popover-footer"><button class="topbar-text-button" type="button" data-notifications-all>View all notifications</button></div>`;
}

function renderProfilePopover()
{
    if (!state.userSignedIn)
    {
        return `<div class="profile-popover-head">
          <div class="profile-popover-avatar">IN</div>
          <div>
            <strong>GeneoGraph account</strong>
            <span>You are not signed in.</span>
          </div>
        </div>
        <div class="topbar-popover-list">
          <button class="topbar-popover-row" type="button" data-profile-action="sign-in">
            <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.profile}</span>
            <span class="topbar-popover-copy">
              <strong>Sign in</strong>
              <span>Connect your GeneoGraph account.</span>
            </span>
            <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
          </button>
          <button class="topbar-popover-row" type="button" data-profile-action="create">
            <span class="topbar-popover-icon topbar-topic-icon blue" aria-hidden="true">${icon.plus}</span>
            <span class="topbar-popover-copy">
              <strong>Create account</strong>
              <span>Account creation is visual only.</span>
            </span>
            <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
          </button>
        </div>`;
    }

    return `<div class="profile-popover-head">
        <div class="profile-popover-avatar">SW</div>
        <div>
          <strong>Silver Whiskerfield</strong>
          <span>silver@example.com</span>
            <span>Signed in</span>
          </span>
        </div>
      </div>
      <div class="topbar-popover-list">
        <button class="topbar-popover-row" type="button" data-profile-action="account">
          <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.profile}</span>
          <span class="topbar-popover-copy">
            <strong>My account</strong>
            <span>Profile, subscription, and account details.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
        <button class="topbar-popover-row" type="button" data-profile-action="account-settings">
          <span class="topbar-popover-icon topbar-topic-icon blue" aria-hidden="true">${icon.settings}</span>
          <span class="topbar-popover-copy">
            <strong>Account settings</strong>
            <span>Manage account preferences.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
        <div class="topbar-divider"></div>
        <button class="topbar-popover-row" type="button" data-profile-action="sign-out">
          <span class="topbar-popover-icon topbar-topic-icon warn" aria-hidden="true">${icon.warning}</span>
          <span class="topbar-popover-copy">
            <strong>Sign out</strong>
            <span>Visual account action only.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
      </div>`;
}

function bindTopbarPopover(popover, type)
{
    popover.querySelector('[data-help-tour]')?.addEventListener('click', () =>
    {
        closeTopbarPopover();
        startGeneoProductTour();
    });
    popover.querySelectorAll('[data-notification-id]').forEach(button => button.addEventListener('click', () => activateTopbarNotification(button.dataset.notificationId)));
    popover.querySelector('[data-notifications-read]')?.addEventListener('click', () =>
    {
        state.unreadNotifications = 0; closeTopbarPopover(); renderTopbar(); showToast('Notifications marked as read.');
    });
    popover.querySelector('[data-notifications-all]')?.addEventListener('click', () => showToast('Full notifications center is a placeholder.'));
    popover.querySelectorAll('[data-profile-action]').forEach(button => button.addEventListener('click', () => handleProfileAction(button.dataset.profileAction)));
}

function activateTopbarNotification(id)
{
    const item = projectNotifications().find(notification => notification.id === id);
    if (!item) return;
    closeTopbarPopover();
    if (item.openSide)
    {
        state.activeModule = 'Projects';
        state.openSide = item.openSide;
        persistProjectContinuation({ projectId: currentProjectId(), module: 'Projects', openedAt: new Date().toISOString() });
        render();
        return;
    }
    if (item.module && state.projectOpen)
    {
        if (item.module === 'Places' && item.placesView === 'review')
        {
            state.placesView = 'review';
            state.placesSearch = '';
        }
        navigateToProjectModule(currentProjectId(), item.module);
        return;
    }
    showToast(item.title);
}

function handleProfileAction(action)
{
    if (action === 'sign-out')
    {
        state.userSignedIn = false;
        closeTopbarPopover();
        renderTopbar();
        showToast('Signed out visually for this prototype.');
        return;
    }
    if (action === 'sign-in')
    {
        state.userSignedIn = true;
        closeTopbarPopover();
        renderTopbar();
        showToast('Signed in visually for this prototype.');
        return;
    }
    if (action === 'account-settings')
    {
        closeTopbarPopover();
        openGlobalSettingsModal('general');
        return;
    }
    showToast(`${action === 'account' ? 'My account' : 'Account'} flow is a visual placeholder.`);
}

let globalSettingsStartupPreview = 'picker';

function openGlobalSettingsModal(section = state.globalSettingsSection, preservePreview = false)
{
    closeTopbarPopover();
    if (modalBackdrop.classList.contains('open')) closeModal();
    if (!preservePreview) globalSettingsStartupPreview = 'picker';
    state.globalSettingsSection = ['general', 'storage', 'about'].includes(section) ? section : 'general';
    openModal(`<div class="modal global-settings-modal" role="dialog" aria-modal="true" aria-labelledby="globalSettingsTitle"><div class="modal-header"><div><h2 id="globalSettingsTitle">Global settings</h2><p>App-wide preferences for GeneoGraph. Project-specific settings stay inside each project.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body" style="padding:0"><div class="global-settings-layout"><nav class="global-settings-nav" aria-label="Global settings sections">${renderGlobalSettingsNav()}</nav><section class="global-settings-panel">${renderGlobalSettingsPanel(state.globalSettingsSection)}</section></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Close</button></div></div>`);
    modalBackdrop.querySelectorAll('[data-global-settings-section]').forEach(button => button.addEventListener('click', () => openGlobalSettingsModal(button.dataset.globalSettingsSection, true)));
    modalBackdrop.querySelector('#globalStartupPreview')?.addEventListener('change', event =>
    {
        globalSettingsStartupPreview = event.target.value;
    });
    modalBackdrop.querySelector('#globalLanguageSelect')?.addEventListener('change', event =>
    {
        setLanguage(event.target.value, false);
        render();
        openGlobalSettingsModal(state.globalSettingsSection, true);
        showToast(
            'Interface language updated.'
        );
    });
    modalBackdrop.querySelector('[data-global-settings-tour]')?.addEventListener('click', () =>
    {
        closeModal();
        startGeneoProductTour();
    });
    localizeUI(modalBackdrop);
}

function renderGlobalSettingsNav()
{
    const sections = [
        ['general', 'General', icon.settings],
        ['storage', 'Storage & backup', icon.syncoffline],
        ['about', 'About', icon.info]
    ];

    return sections.map(([id, label, glyph]) => `<button class="global-settings-nav-button ${state.globalSettingsSection === id ? 'active' : ''}" type="button" data-global-settings-section="${id}">
        <span class="global-settings-nav-icon" aria-hidden="true">${glyph}</span>
        <span class="global-settings-nav-label">${escapeHtml(label)}</span>
      </button>`).join('');
}

function renderGlobalSettingsPanel(section)
{
    if (section === 'storage') return `<h3>Storage & backup</h3><p>Backup and sync are not available in this demo.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>Local backups</strong><span>This demo cannot create backup files.</span></div></div><div class='global-settings-row'><div><strong>Cloud sync</strong><span>This demo does not connect to cloud storage.</span></div></div></div>`;
    if (section === 'about') return `<h3>About GeneoGraph</h3><p>Prototype information and useful links.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>GeneoGraph prototype</strong><span>Version 0.1 prototype - local-first genealogy workspace</span></div></div><div class='global-settings-row'><div><strong>Product tour</strong><span>Explore the sample project across GeneoGraph.</span></div><button class='button secondary' type='button' data-global-settings-tour>Take the tour</button></div><div class='global-settings-row'><div><strong>Help center</strong><span>Coming soon</span></div><button class='button secondary global-settings-unavailable' type='button' disabled>Open</button></div><div class='global-settings-row'><div><strong>Privacy policy</strong><span>Read how GeneoGraph handles privacy.</span></div><a class='button secondary' href='https://geneograph.com/privacy.html' target='_blank' rel='noopener noreferrer'>Read policy</a></div><div class='global-settings-row'><div><strong>Contact us</strong><span>Get in touch with the GeneoGraph team.</span></div><a class='button secondary' href='https://geneograph.com/contact.html' target='_blank' rel='noopener noreferrer'>Contact us</a></div><div class='global-settings-row'><div><strong>GeneoGraph website</strong><span>Learn more about GeneoGraph.</span></div><a class='button secondary' href='https://geneograph.com/' target='_blank' rel='noopener noreferrer'>Visit website</a></div></div>`;
    return `<h3>General</h3><p>Basic app-wide preferences.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>Interface theme</strong><span>GeneoGraph currently uses the dark archival theme.</span></div><span class='global-settings-value'>Dark archival</span></div><div class='global-settings-row'><div><strong>Startup behavior</strong><span>Preview only; this choice does not change what opens when the demo starts.</span></div><select class='global-settings-control' id='globalStartupPreview' aria-label='Startup behavior'><option value='picker' ${globalSettingsStartupPreview === 'picker' ? 'selected' : ''}>Show project picker</option><option value='last' ${globalSettingsStartupPreview === 'last' ? 'selected' : ''}>Open last project</option></select></div><div class='global-settings-row'><div><strong>Language</strong><span>App interface language.</span></div><select class='global-settings-control' id='globalLanguageSelect' aria-label='Language'><option value='en' ${state.language === 'en' ? 'selected' : ''}>English</option><option value='ru' ${state.language === 'ru' ? 'selected' : ''}>Русский</option></select></div><div class='global-settings-row'><div><strong>Time zone</strong><span>Used for activity timestamps.</span></div><span class='global-settings-value'>System default</span></div></div>`;
}

