function render()
{
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
    const signedLabel = state.userSignedIn ? 'SW' : 'IN';
    topbar.innerHTML = `
        <button class="home-tab ${state.activeModule === 'Projects' ? 'active' : ''}" type="button" data-home aria-label="Projects home">${icon.home}</button>
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

