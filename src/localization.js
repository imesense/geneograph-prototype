const SUPPORTED_LANGUAGES = ['en', 'ru'];
const LANGUAGE_STORAGE_KEY = 'geneograph.language';
const PROJECT_CONTINUATION_STORAGE_KEY = 'geneograph.projectContinuation';
const RU_UI_SHARED = Object.freeze({
    'Projects': 'Проекты',
    'Family Tree': 'Семейное древо',
    'People': 'Люди',
    'Geneograph': 'Генеограф',
    'Albums': 'Альбомы',
    'Archive': 'Архив',
    'Notes': 'Заметки',
    'Places': 'Места',
    'Publish': 'Публикация',
    'Sources': 'Источники',
    'Search anything...': 'Поиск по всему...',
    'Ctrl + K': 'Ctrl + K',
    'Help': 'Справка',
    'Notifications': 'Уведомления',
    'Settings': 'Настройки',
    'User profile': 'Профиль пользователя',
    'Learn more': 'Подробнее',
    'Updated': 'Обновлено',
    'Name': 'Название',
    'Any': 'Любой',
    'Search results': 'Результаты поиска',
    'Continue': 'Продолжить',
    'Tip of the day':
        'Совет дня',

    'Create and select': 'Создать и выбрать',
    'Connections': 'Связи',
    'This action cannot be undone.': 'Это действие невозможно отменить.',
    'Search people...': 'Поиск людей...',
    'Continue editing':'Продолжить редактирование',
    'Change': 'Изменить',
    'Low text contrast':
        'Низкая контрастность текста',

    'Consider a clearer text or fill color.':
        'Выберите более контрастный цвет текста или заливки.',

    'Dates unknown':
        'Даты неизвестны',

    'Died':
        'Смерть:',

    'Event':
        'Событие',

    'Linked event':
        'Связанное событие',

    'Location has no coordinates':
        'У места нет координат',

    'Surname':
        'Фамилия',

    'Unnamed person':
        'Человек без имени',

    'Unnamed place':
        'Место без названия',
    'across':
        'в',

    'more':
        'ещё',

    'undated':
        'без даты',

    'without place':
        'без места',
    'e.g.':'Например,',
    'is already a descendant of': 'уже является потомком',
    'is already an ancestor of' : 'уже является предком',
    'Connecting them as a parent would create a cycle.': 'Установление родительской связи создаст цикл.',
    'Connecting them as a child would create a cycle.': 'Установление связи с ребенком создаст цикл.',

    'unmapped':
        'без координат',
    'Clear search': 'Очистить поиск',
    'Clear': 'Сброс',
    'Choose file': 'Выбрать файл',
    'Open': 'Открыть',
    'More actions': 'Другие действия',
    'Rename': 'Переименовать',
    'Duplicate': 'Создать копию',
    'Delete': 'Удалить',
    'Unarchive': 'Вернуть из архива',
    'Modified': 'Изменено',
    'Last modified': 'Последнее изменение',
    'Created': 'Создано',
    'Recent activity': 'Недавние действия',
    'View all': 'Показать все',
    'Save': 'Сохранить',
    'Close': 'Закрыть',
    'Cancel': 'Отмена',
    'Save changes': 'Сохранить изменения',
    'This action cannot be undone during this prototype session.': 'Это действие нельзя отменить в текущем сеансе прототипа.',
    'Disabled': 'Отключено',
    'On': 'Включено',
    'Off': 'Выключено',
    'Date format': 'Формат даты',
    'DD MMM YYYY': 'ДД МММ ГГГГ',
    'DD.MM.YYYY': 'ДД.ММ.ГГГГ',
    'YYYY-MM-DD': 'ГГГГ-ММ-ДД',
    'Enter a complete date with day, month, and year.': 'Введите полную дату, указав день, месяц и год.',
    'e.g. 24 May 2026': 'Например, 24 мая 2026',
    'Reset changes': 'Сбросить изменения',
    'Description': 'Описание',
    'Help center': 'Справочный центр',
    'Profile menu': 'Меню профиля',
    'Find guides, shortcuts, and support for GeneoGraph.': 'Здесь доступны руководства, сочетания клавиш и справка по GeneoGraph.',
    'Getting started': 'Начало работы',
    'Create, open, and import projects.': 'Создание, открытие и импорт проектов.',
    'Family Tree basics': 'Основы семейного древа',
    'Add relatives, edit people, and navigate the tree.': 'Добавляйте родственников, редактируйте людей и перемещайтесь по древу.',
    'Archive & sources': 'Архив и источники',
    'Organize files and connect evidence.': 'Организуйте файлы и связывайте подтверждающие материалы.',
    'Albums and notes': 'Альбомы и заметки',
    'Manage photos, captions, notes, and cases.': 'Работайте с фотографиями, подписями, заметками и исследовательскими задачами.',
    'Keyboard shortcuts': 'Сочетания клавиш',
    'Search, selection, overlays, and navigation.': 'Поиск, выделение, всплывающие элементы и навигация.',
    'Open Help Center': 'Открыть справочный центр',
    'Contact support': 'Связаться с поддержкой',
    'Getting started help would open here.': 'Здесь откроется справка по началу работы.',
    'Family Tree basics help would open here.': 'Здесь откроется справка по основам семейного древа.',
    'Archive & sources help would open here.': 'Здесь откроется справка по архиву и источникам.',
    'Albums and notes help would open here.': 'Здесь откроется справка по альбомам и заметкам.',
    'Keyboard shortcuts help would open here.': 'Здесь откроется справка по сочетаниям клавиш.',
    'Help Center would open here.': 'Здесь откроется справочный центр.',
    'Contact support flow is a placeholder.': 'Обращение в поддержку пока является заглушкой.',
    '5 items need attention': '5 уведомлений требуют внимания',
    'No unread notifications': 'Нет непрочитанных уведомлений',
    'Mark all read': 'Отметить все как прочитанные',
    'View all notifications': 'Показать все уведомления',
    'Notifications marked as read.': 'Уведомления отмечены как прочитанные.',
    'Full notifications center is a placeholder.': 'Полный центр уведомлений пока является заглушкой.',
    'GeneoGraph account': 'Аккаунт GeneoGraph',
    'You are not signed in.': 'Вы не вошли в аккаунт.',
    'Sign in': 'Войти',
    'Connect your GeneoGraph account.': 'Подключите свой аккаунт GeneoGraph.',
    'Create account': 'Создать аккаунт',
    'Account creation is visual only.': 'Создание аккаунта здесь только демонстрируется.',
    'Signed in': 'Выполнен вход',
    'My account': 'Мой аккаунт',
    'Profile, subscription, and account details.': 'Профиль, подписка и сведения об аккаунте.',
    'Account settings': 'Настройки аккаунта',
    'Manage account preferences.': 'Управление настройками аккаунта.',
    'Sign out': 'Выйти',
    'Visual account action only.': 'Действие с аккаунтом здесь только демонстрируется.',
    'Signed out visually for this prototype.': 'Выход из аккаунта смоделирован в прототипе.',
    'Signed in visually for this prototype.': 'Вход в аккаунт смоделирован в прототипе.',
    'My account flow is a visual placeholder.': 'Раздел «Мой аккаунт» пока является визуальной заглушкой.',
    'Account flow is a visual placeholder.': 'Работа с аккаунтом пока является визуальной заглушкой.',
    'Global settings': 'Общие настройки',
    'App-wide preferences for GeneoGraph. Project-specific settings stay inside each project.': 'Общие настройки GeneoGraph. Параметры отдельных проектов настраиваются внутри соответствующих проектов.',
    'Global settings sections': 'Разделы общих настроек',
    'General': 'Основные',
    'Storage & backup': 'Хранилище и резервные копии',
    'Privacy': 'Конфиденциальность',
    'Accessibility': 'Специальные возможности',
    'About': 'О программе',
    'Interface language updated.': 'Язык интерфейса обновлён.',
    'Global settings saved.': 'Общие настройки сохранены.',
    'Basic app-wide preferences.': 'Основные настройки приложения.',
    'Interface theme': 'Тема интерфейса',
    'GeneoGraph currently uses the dark archival theme.': 'Сейчас GeneoGraph использует тёмную архивную тему.',
    'Dark archival': 'Тёмная архивная',
    'Startup behavior': 'Поведение при запуске',
    'Choose what opens when the app starts.': 'Выберите, что открывать при запуске приложения.',
    'Show project picker': 'Показывать выбор проекта',
    'Open last project': 'Открывать последний проект',
    'Language': 'Язык',
    'App interface language.': 'Язык интерфейса приложения.',
    'English': 'Английский',
    'Default date display across the app.': 'Формат отображения дат по умолчанию во всём приложении.',
    'MM/DD/YYYY': 'ММ/ДД/ГГГГ',
    'Time zone': 'Часовой пояс',
    'Used for activity timestamps.': 'Используется для времени в журнале действий.',
    'System default': 'Системный',
    'Set global storage defaults for local-first projects.': 'Настройте общие параметры хранения для локальных проектов.',
    'Default project folder': 'Папка проектов по умолчанию',
    'New local projects are created here.': 'Здесь создаются новые локальные проекты.',
    'Local backups': 'Локальные резервные копии',
    'Create local backup reminders.': 'Напоминать о создании локальных резервных копий.',
    'Backup frequency': 'Частота резервного копирования',
    'Default reminder cadence.': 'Частота напоминаний по умолчанию.',
    'Weekly': 'Еженедельно',
    'Daily': 'Ежедневно',
    'Manual': 'Вручную',
    'Cloud sync': 'Облачная синхронизация',
    'Optional cloud backup is disabled by default.': 'Необязательное облачное резервное копирование по умолчанию отключено.',
    'Enable sync': 'Включить синхронизацию',
    'Cloud sync setup is a placeholder.': 'Настройка облачной синхронизации пока является заглушкой.',
    'Set defaults used by publishing, exports, and living-person handling.': 'Настройте параметры по умолчанию для публикации, экспорта и данных живущих людей.',
    'Hide living people in Publish outputs': 'Скрывать живущих людей в публикациях',
    'Recommended for family sharing.': 'Рекомендуется для семейного доступа.',
    'Exclude private notes from exports': 'Исключать личные заметки из экспорта',
    'Private research notes stay out of shared files.': 'Личные исследовательские заметки не попадут в общие файлы.',
    'Warn before exporting unsourced facts': 'Предупреждать перед экспортом фактов без источников',
    'Show a privacy/source warning during Publish.': 'Показывать предупреждение о конфиденциальности и источниках при публикации.',
    'Confirm permanent delete': 'Подтверждать безвозвратное удаление',
    'Require confirmation for destructive actions.': 'Требовать подтверждение для необратимых действий.',
    'Choose which app reminders appear in the notification overlay.': 'Выберите, какие напоминания показывать в уведомлениях.',
    'Archive organization reminders': 'Напоминания об организации архива',
    'Files without folders or genealogy links.': 'Файлы без папок или связей с генеалогическими записями.',
    'Backup reminders': 'Напоминания о резервном копировании',
    'Remind me when a local backup is recommended.': 'Напоминать, когда рекомендуется создать локальную резервную копию.',
    'Needs review place reminders': 'Напоминания о местах, требующих проверки',
    'Imported place names and missing coordinates.': 'Импортированные названия мест и отсутствующие координаты.',
    'Photo organization reminders': 'Напоминания об организации фотографий',
    'Photos not assigned to albums.': 'Фотографии, не добавленные в альбомы.',
    'Product tips': 'Советы по работе',
    'Occasional workflow tips inside the app.': 'Периодические советы по работе в приложении.',
    'Adjust interface density, contrast, and motion behavior.': 'Настройте плотность интерфейса, контрастность и анимацию.',
    'Reduce motion': 'Уменьшить анимацию',
    'Limit non-essential transitions.': 'Ограничить необязательные анимационные переходы.',
    'Increase contrast': 'Повысить контрастность',
    'Strengthen borders and text contrast.': 'Сделать границы и текст контрастнее.',
    'Interface density': 'Плотность интерфейса',
    'Choose comfortable or compact spacing.': 'Выберите обычные или компактные отступы.',
    'Comfortable': 'Обычная',
    'Compact': 'Компактная',
    'Font size': 'Размер шрифта',
    'Default app text size.': 'Размер текста приложения по умолчанию.',
    'Default': 'По умолчанию',
    'Large': 'Крупный',
    'Always show focus outlines': 'Всегда показывать рамку фокуса',
    'Keep keyboard focus visible.': 'Всегда показывать клавиатурный фокус.',
    'About GeneoGraph': 'О GeneoGraph',
    'Prototype information and reference links.': 'Информация о прототипе и справочные ссылки.',
    'GeneoGraph prototype': 'Прототип GeneoGraph',
    'Version 0.1 prototype - local-first genealogy workspace': 'Версия 0.1 — прототип локального рабочего пространства для генеалогии',
    'Active': 'Активно',
    'Guides and support documentation placeholder.': 'Заглушка для руководств и справочной документации.',
    'Release notes': 'Примечания к выпуску',
    'Product updates and prototype changes.': 'Обновления продукта и изменения прототипа.',
    'View': 'Просмотреть',
    'Release notes are a placeholder.': 'Примечания к выпуску пока являются заглушкой.',
    'Privacy policy': 'Политика конфиденциальности',
    'Privacy documentation placeholder.': 'Заглушка для документации о конфиденциальности.',
    'Privacy policy would open here.': 'Здесь откроется политика конфиденциальности.',
    'Navigation': 'Навигация',
    'Back': 'Назад',
    'Forward': 'Вперёд',
    'Add': 'Добавить',
    'Edit': 'Изменить',
    'Export': 'Экспорт',
    'Print': 'Печать',
    'Actions': 'Действия',
    'Photos': 'Фотографии',
    'Timeline': 'Хронология',
    'Insights': 'Подсказки',
    'Record Info': 'Сведения о записи',
    'Quick edit': 'Изменить',
    'View profile': 'Открыть профиль',
    'Profile': 'Профиль',
    'Statistics': 'Статистика',
    'Birth date': 'Дата рождения',
    'Birth place': 'Место рождения',
    'Death date': 'Дата смерти',
    'Death place': 'Место смерти',
    'Rows per page': 'Строк на странице',
    'Favourites': 'Избранное',
    'Favourite': 'В избранном',
    'Add to favourites': 'Добавить в избранное',
    'Remove from favourites': 'Убрать из избранного',
    'Archived': 'Архивные',
    'Collections': 'Коллекции',
    'Filter': 'Фильтр',
    'Folder': 'Папка',
    'Folders': 'Папки',
    'Type': 'Тип',
    'Details': 'Сведения',
    'Metadata': 'Метаданные',
    'Place': 'Место',
    'Date': 'Дата',
    'Title': 'Название',
    'Files': 'Файлы',
    'Events': 'События',
    'Saved': 'Сохранено',
    'Unknown date': 'Дата неизвестна',
    'Unfiled': 'Без папки',
    'Unmapped places': 'Места без координат',
    'Historic family places': 'Исторические семейные места',
    'Connected records': 'Связанные записи',
    'Collapse person sidebar': 'Свернуть панель человека',
    'Connect relative': 'Установить связь',
    'Selected person details': 'Сведения о выбранном человеке',
    'Added': 'Добавлено',
    'Age': 'Возраст',
    'Family': 'Семья',
    'Family relationships': 'Семейные связи',
    'Locked': 'Заблокировано',
    'Review status': 'Статус проверки',
    'Source status': 'Статус источников',
    'Sources linked':
        'Источники привязаны',

    'No sources linked':
        'Источники не привязаны',

    'Any source status':
        'Любой статус источников',

    'With sources':
        'С источниками',

    'Without sources':
        'Без источников',

    'Connection status':
        'Статус связей',

    'Any connection status':
        'Любой статус связей',

    'With connections':
        'Со связями',

    'Without connections':
        'Без связей',
    'Relationship actions': 'Действия со связью',
    'First name': 'Имя',
    'Last name': 'Фамилия',
    'Patronym': 'Отчество',
    'Gender': 'Пол',
    'Living status': 'Жизненный статус',
    'Prefix': 'Префикс',
    'Suffix': 'Суффикс',
    'Work': 'Работа',
    'Other': 'Другое',
    'Previous photos': 'Предыдущие фотографии',
    'Next photos': 'Следующие фотографии',
    'Add fact': 'Добавить факт',
    'No insights found': 'Подсказок пока нет',
    'Columns': 'Столбцы',
    'Editing': 'Редактирование',
    'Cancel editing': 'Отменить редактирование',
    'Change photo': 'Изменить фотографию',
    '+ Add address': '+ Добавить адрес',
    '- Remove address': '- Удалить адрес',
    'Address': 'Адрес',
    'Street, house, parish, or site details': 'Улица, дом, приход или описание места',
    'Search or type a place': 'Найдите или введите место',
    'e.g. Dr., Sir, Lady': 'Например, д-р, сэр, леди',
    'e.g. Jr., III, PhD': 'Например, мл., III, PhD',
    'e.g. 14 Feb 1915': 'Например, 14 февр. 1915',
    'e.g. Pawford, England': 'Например, Поуфорд, Англия',
    'e.g. Meowbridge, England': 'Например, Мяубридж, Англия',
    'Month': 'Месяц',
    'Favorite': 'В избранном',
    'Audio': 'Аудио',
    'Country': 'Страна',
    'Map': 'Карта',
    'Dismiss': 'Скрыть',
    'Connection': 'Связь',
    'Line': 'Линия',
    'Line hex color': 'HEX-код линии',
    'Line opacity': 'Непрозрачность линии',
    'Marriage date': 'Дата брака',
    'Marriage place': 'Место брака',
    'Marriage type': 'Тип брака',
    'Relationship type': 'Тип отношений',
    'Death reason': 'Причина смерти',
    'Cause of Death': 'Причина смерти',
    'No partners recorded': 'Партнёры не указаны',
    'No archive files linked': 'Архивные файлы не связаны',
    'linked records': 'связанных записей',
    'and': 'и',
    'Zoom in': 'Увеличить масштаб',
    'Zoom out': 'Уменьшить масштаб',
    'Born:': 'Рождение:',
    'Died:': 'Смерть:',
    'father': 'отец',
    'mother': 'мать',
    'fact': 'факт',
    'Items': 'Элементы',
    'Sort by': 'Сортировать по',
    'Direction': 'Направление',
    'Ascending': 'По возрастанию',
    'Descending': 'По убыванию',
    'Last updated': 'Последнее изменение',
    'Date created': 'Дата создания',
    'Advanced': 'Дополнительно',
    'Project photos': 'Фотографии проекта',
    'Upload new': 'Загрузить новые',
    'Search project photos': 'Поиск фотографий проекта',
    'selected': 'выбрано',
    'file from person':'файла с человеком',
    'note from person':'заметки с человеком',
    'The file will not be deleted.':'Файл не будет удален.',
    'Only the connection between':'Только связь между',
    'will be removed.':'будет удалена.',
    'Deleting this person will also remove their relationship references.': 'Удаление этого человека удалит его связь с другими людьми.',
    'Linked photos, archive files, notes, и other research material will remain in the project.': 'Связанные фотографии, архивные файлы, заметки и прочие материалы остануться в проекте.',
    'The file will remain available in Archive and keep all its other connections.':'Файл останется доступен в архиве и сохранит остальные связи.',
    'The note will remain available in Notes and keep all its other links.':'Заметка останется доступна в Заметках и сохранит остальные связи.',
    'Similar people in this project': 'Похожие люди в этом проекте',
    'Enter a name, date, or place to check for existing people.': 'Введите имя, дату или место для запуска проверки.',
    'on': 'вкл.'
});

const RU_UI_PROJECTS = Object.freeze({
    'Projects home': 'Главная проектов',
    'Project modules': 'Модули проекта',
    'Family history workspace': 'Ваша семейная история',
    'Welcome back!': 'С возвращением!',
    'Here you can create, open, and manage your family-history projects.': 'Здесь можно создавать, открывать и управлять проектами по истории семьи.',
    'Create family tree': 'Создать древо',
    'Import GEDCOM': 'Импорт GEDCOM',
    'Open project': 'Открыть проект',
    'You can drag and drop a GEDCOM file anywhere to import it.': 'Чтобы импортировать GEDCOM, перетащите файл в окно приложения.',
    'File picker would open here.': 'Здесь откроется окно выбора файла.',
    'Learning center is outside this prototype.': 'Учебный центр не входит в этот прототип.',
    'Search projects': 'Поиск проектов',
    'Search projects...': 'Поиск проектов...',
    'Sort projects': 'Сортировка проектов',
    'People count': 'Число людей',
    'Grid view': 'Плитка',
    'List view': 'Список',
    'All projects': 'Все проекты',
    'Continue where you left off': 'Продолжить с последнего места',
    'Last opened': 'Последнее открытие',
    'No projects yet': 'Проектов пока нет',
    'Create a family tree or import a GEDCOM file': 'Создайте семейное древо или импортируйте файл GEDCOM',
    'to begin your family-history workspace.': 'чтобы начать работу с семейной историей.',
    'No projects match': 'Нет проектов по запросу',
    'Try another project name or clear the search.': 'Попробуйте другое название проекта или очистите поиск.',
    '1 project': '1 проект',
    '1 of 1 project': '1 из 1 проекта',
    '0 of 1 project': '0 из 1 проекта',
    'Open or import a GeneoGraph or GEDCOM file': 'Открыть или импортировать файл GeneoGraph или GEDCOM',
    'Open or import a file': 'Открыть или импортировать файл',
    'Drop a .ggproj or .ged file here': 'Перетащите сюда файл .ggproj или .ged',
    'Choose a .ggproj or .ged file.': 'Выберите файл .ggproj или .ged.',
    'Update cover': 'Изменить обложку',
    'Local project': 'Локальный проект',
    'Sync status': 'Синхронизация',
    'Sync now': 'Синхронизировать',
    'Cloud sync is optional. Your current projects are stored locally.': 'Облачная синхронизация необязательна. Текущие проекты хранятся локально.',
    'All files are stored locally': 'Все файлы хранятся локально',
    'Your projects, photos, archive files, notes, and boards stay on this device.': 'Все проекты, фото и файлы хранятся на этом устройстве.',
    'Enable cloud sync to protect your files.': 'Включите облачную синхронизацию для дополнительной защиты файлов.',
    'Project': 'Проект',
    'Project overview': 'Обзор проекта',
    'Project settings': 'Настройки проекта',
    'Back to all projects': 'Назад ко всем проектам',
    'Edit project name': 'Изменить название проекта',
    'Project actions': 'Действия с проектом',
    'Export project': 'Экспорт проекта',
    'Export project options will be defined in the Publish module.': 'Параметры экспорта проекта будут доступны в модуле «Публикация».',
    'Delete project': 'Удалить проект',
    'Structured relationship canvas': 'Структурированная схема родственных связей',
    'Browse and clean records': 'Просмотр и уточнение записей',
    'Photos and albums': 'Фотографии и альбомы',
    'Files and sources': 'Файлы и источники',
    'Drop a GEDCOM file here to import': 'Перетащите сюда файл GEDCOM для импорта',
    'Supports .ged files': 'Поддерживаются файлы .ged',
    'Project insights': 'Подсказки по проекту',
    'Missing source data': 'Не указан источник',
    'Unsorted photos': 'Неразобранные фотографии',
    'Place cleanup': 'Уточнение мест',
    'Open People for Missing facts': 'Открыть раздел «Люди» для проверки недостающих сведений',
    'Open Archive for Missing source data': 'Открыть «Архив» для проверки данных об источниках',
    'Open Albums for Unsorted photos': 'Открыть «Альбомы» для разбора фотографий',
    'Open Places for Place cleanup': 'Открыть «Места» для уточнения данных',
    'Offline project': 'Синхронизация отключена',
    'Cloud sync is optional. This project is currently stored locally.': 'Облачная синхронизация необязательна. Этот проект сейчас хранится локально.',
    'Cloud backup is disabled. Project files, photos, archive files, notes, and boards stay on this device.': 'Облачное копирование отключено. Ваши проекты, фотографии и файлы хранятся на этом устройстве.',
    'Learn more about cloud backup': 'Подробнее об облачном копировании',
    'Cloud backup help is a placeholder for a later flow.': 'Справка по облачному резервному копированию пока является заглушкой.',
    'Project name': 'Название проекта',
    'Project name cannot be empty.': 'Название проекта не может быть пустым.',
    'Project name updated.': 'Название проекта обновлено.',
    'Rename project': 'Переименовать проект',
    'Update the project name shown throughout GeneoGraph.': 'Измените название проекта, отображаемое во всех разделах GeneoGraph.',
    'Project renamed.': 'Проект переименован.',
    'Project duplicated.': 'Копия проекта создана.',
    'Choose the cover shown on this project card.': 'Выберите обложку для карточки проекта.',
    'Cover style': 'Стиль обложки',
    'Archival paper': 'Архивная бумага',
    'Family tree': 'Семейное древо',
    'Family photo': 'Семейная фотография',
    'Project cover updated.': 'Обложка проекта обновлена.',
    'Delete project?': 'Удалить проект?',
    'Project deleted.': 'Проект удалён.',
    'Project identity': 'Сведения о проекте',
    'Project description': 'Описание проекта',
    'Cover image': 'Обложка',
    'Custom image': 'Своё изображение',
    'Custom cover upload is a placeholder.': 'Загрузка своей обложки пока является заглушкой.',
    'Project location': 'Расположение проекта',
    'Cloud backup disabled': 'Облачное резервное копирование отключено',
    'Last local backup': 'Последняя локальная резервная копия',
    'Cloud backup': 'Облачное резервное копирование',
    'View in folder': 'Показать в папке',
    'Move project': 'Переместить проект',
    'Create local backup': 'Создать локальную резервную копию',
    'Data and privacy': 'Данные и конфиденциальность',
    'Living-person protection': 'Защита данных живущих людей',
    'Publish living people': 'Публикация данных живущих людей',
    'Hide by default': 'Скрывать по умолчанию',
    'Anonymize names': 'Анонимизировать имена',
    'Include with warning': 'Включать с предупреждением',
    'Private notes in exports': 'Личные заметки при экспорте',
    'Exclude by default': 'Исключать по умолчанию',
    'Not created yet': 'Ещё не создана',
    'This would open the project folder on your computer.': 'Здесь откроется папка проекта на вашем компьютере.',
    'Local backup created.': 'Локальная резервная копия создана.',
    'Cover style updated. Save settings to keep other changes.': 'Стиль обложки обновлён. Сохраните настройки, чтобы применить остальные изменения.',
    'Project settings saved.': 'Настройки проекта сохранены.',
    'Choose a new local folder for this project. This is simulated in the prototype.': 'Выберите новую локальную папку для проекта. В прототипе это действие имитируется.',
    'Current location': 'Текущее расположение',
    'New location': 'Новое расположение',
    'Moving a project would relocate the local project package and keep existing people, sources, photos, archive files, notes, boards, and settings together.': 'При перемещении пакет проекта будет перенесён в новое место вместе со всеми людьми, источниками, фотографиями, архивными файлами, заметками, холстами и настройками.',
    'Choose a project location.': 'Выберите расположение проекта.',
    'Project location updated.': 'Расположение проекта обновлено.',
    'Start a new GeneoGraph project for a family line or research case.': 'Создайте новый проект GeneoGraph для семейной линии или исследовательской задачи.',
    'e.g. Whiskerfield Family History': 'Например, История семьи Вискерфильдов',
    'Family line, location, archive focus, or research goal': 'Семейная линия, место, архивное направление или цель исследования',
    'Starting point': 'Начальный вариант',
    'Blank project': 'Пустой проект',
    'Add people manually.': 'Добавить людей вручную.',
    'Coming later': 'Будет доступно позже',
    'This starting point is not available yet.': 'Этот начальный вариант пока недоступен.',
    'Project name is required.': 'Укажите название проекта.',
    'Project created.': 'Проект создан.',
    'Open a project before creating records.': 'Откройте проект перед созданием записей.',
    'Add first person': 'Добавить первого человека',
    'Start your family tree': 'Начните семейное древо',
    'Add the first person to begin building this project\'s family tree.': 'Добавьте первого человека, чтобы начать семейное древо этого проекта.',
    'No project activity yet': 'В проекте пока нет действий',
    'Activity will appear as you add and edit project records.': 'Действия появятся после добавления и изменения записей проекта.',
    'Start by adding a person or opening a project module.': 'Начните с добавления человека или откройте модуль проекта.',
    'Add people before creating person-based publications.': 'Добавьте людей, прежде чем создавать публикации о людях.',
    'Bring an existing tree.': 'Импортировать существующее древо.',
    'Start from person': 'Начать с человека',
    'Create the first profile now.': 'Создать первый профиль сейчас.',
    'GEDCOM file': 'Файл GEDCOM',
    'Drop a GEDCOM file here or choose a file': 'Перетащите сюда файл GEDCOM или выберите файл',
    'Supports .ged and .gedcom files': 'Поддерживаются файлы .ged и .gedcom',
    'Create project': 'Создать проект',
    'Project creation simulated.': 'Создание проекта смоделировано.',
    'Import an existing family tree file into a new or open project.': 'Импортируйте существующий файл семейного древа в новый или открытый проект.',
    'Drop a GEDCOM file here': 'Перетащите сюда файл GEDCOM',
    'File handling is simulated in this prototype.': 'Работа с файлами смоделирована в этом прототипе.'
});

const RU_DATA_PROJECTS = Object.freeze({
    'Whiskerfield Family Tree': 'Семейное древо Вискерфильдов',
    'Whiskerfield Family History': 'История семьи Вискерфильдов',
    'Whiskerfield Family Tree copy': 'Копия семейного древа Вискерфильдов',
    'Research into the Whiskerfield and Purrington family lines from Pawford, Meowbridge, Fishmarket Row, and Old Cattery.': 'Исследование родов Вискерфильд и Пуррингтон из Поуфорда, Мяубриджа, Фишмаркет-Роу и Олд-Кэттери.'
});

const RU_DATA_PROJECT_COMPOSITES = Object.freeze({
    'Open Whiskerfield Family Tree': 'Открыть проект «Семейное древо Вискерфильдов»',
    'Preview of Whiskerfield Family Tree cover': 'Предпросмотр обложки проекта «Семейное древо Вискерфильдов»',
    'Delete Whiskerfield Family Tree and all people, relationships, media, and research records owned by this project.': 'Удалить проект «Семейное древо Вискерфильдов» и все принадлежащие ему записи о людях, родственных связях, медиафайлах и исследованиях.'
});

const RU_DATA_PROJECT_ACTIVITY = Object.freeze({
    '4 photos added': 'Добавлено 4 фотографии',
    'Whiskerfield family album photos are ready to organize': 'Фотографии из семейного альбома Вискерфильдов готовы к сортировке',
    'Profile updated': 'Профиль обновлён',
    'Luna Purrington now has a verified birth place': 'Место рождения Луны Пуррингтон подтверждено',
    'GEDCOM import reviewed': 'Импорт GEDCOM проверен',
    '17 people were added to the project': 'В проект добавлено 17 человек',
    'Whiskerfield Family Tree · Albums': 'Семейное древо Вискерфильдов · Альбомы',
    'Whiskerfield Family Tree · People': 'Семейное древо Вискерфильдов · Люди',
    'Whiskerfield Family Tree · Family Tree': 'Семейное древо Вискерфильдов · Семейное древо',
    'Open Whiskerfield Family Tree Albums activity': 'Открыть действия модуля «Альбомы» проекта «Семейное древо Вискерфильдов»',
    'Open Whiskerfield Family Tree People activity': 'Открыть действия модуля «Люди» проекта «Семейное древо Вискерфильдов»',
    'Open Whiskerfield Family Tree Family Tree activity': 'Открыть действия модуля «Семейное древо» проекта «Семейное древо Вискерфильдов»',
    'Photos added': 'Добавлены фотографии',
    '4 photos added to Family photos': '4 фотографии добавлены в альбом «Семейные фотографии»',
    'Person updated': 'Данные человека обновлены',
    'Luna Purrington profile updated': 'Профиль Луны Пуррингтон обновлён',
    'GEDCOM imported': 'GEDCOM импортирован',
    '24 people imported from GEDCOM': 'Из GEDCOM импортировано 24 человека',
    'Research note added': 'Добавлена исследовательская заметка',
    'Surname origin note updated': 'Заметка о происхождении фамилии обновлена',
    'Relationship connected': 'Добавлена родственная связь',
    'Luna Purrington was connected to the tree': 'Луна Пуррингтон добавлена в семейное древо',
    'Archive file linked': 'Архивный файл привязан',
    'Pawford household register linked to Silver Whiskerfield': 'Домовая ведомость Поуфорда связана с Сильвером Вискерфильдом',
    'Duplicate reviewed': 'Возможный дубликат проверен',
    'Possible duplicate was marked reviewed': 'Возможный дубликат отмечен как проверенный',
    'Photo tags added': 'Добавлены отметки на фотографиях',
    'Three portraits were linked to people': 'Три портрета связаны с записями о людях'
});

const RU_DATA_PROJECT_INSIGHTS = Object.freeze({
    'Cleo Whiskerfield is missing a confirmed birth date and place.': 'У Клео Вискерфильд не подтверждены дата и место рождения.',
    '6 archive files in this project are missing source or provenance information.': 'У 6 архивных файлов этого проекта не указан источник.',
    '8 photos are not assigned to an album.': '8 фотографий не добавлены ни в один альбом.',
    '3 imported place names need coordinates or hierarchy review.': 'Для 3 импортированных названий мест нужно проверить координаты или иерархию.',
    'Whiskerfield Family Tree · Cleo Whiskerfield is missing a confirmed birth date and place.': 'Семейное древо Вискерфильдов · У Клео Вискерфильд не подтверждены дата и место рождения.',
    'Whiskerfield Family Tree · 6 archive files in this project are missing source or provenance information.': 'Семейное древо Вискерфильдов · У 6 архивных файлов этого проекта не указаны источник.',
    'Whiskerfield Family Tree · 8 photos are not assigned to an album.': 'Семейное древо Вискерфильдов · 8 фотографий не добавлены ни в один альбом.',
    'Whiskerfield Family Tree · 3 imported place names need coordinates or hierarchy review.': 'Семейное древо Вискерфильдов · Для 3 импортированных названий мест нужно проверить координаты или иерархию.'
});

const RU_DATA_PEOPLE = Object.freeze({
    'Silver Whiskerfield': 'Сильвер Вискерфильд',
    'Luna Purrington': 'Луна Пуррингтон',
    'Cleo Whiskerfield': 'Клео Вискерфильд',
    'Oliver Whiskerfield': 'Оливер Вискерфильд',
    'Mochi Whiskerfield': 'Мочи Вискерфильд',
    'Barnaby Whiskerfield': 'Барнаби Вискерфильд',
    'Daisy Milkpaw': 'Дейзи Милкпоу',
    'Rupert Purrington': 'Руперт Пуррингтон',
    'Mabel Softtail': 'Мейбл Софттейл',
    'Archibald Whiskerfield': 'Арчибальд Вискерфильд',
    'Edith Mackerelton': 'Эдит Макрельтон',
    'Percival Milkpaw': 'Персиваль Милкпоу',
    'Nora Creamfur': 'Нора Кримфюр',
    'Algernon Purrington': 'Алджернон Пуррингтон',
    'Beatrice Threadtail': 'Беатрис Тредтейл',
    'Felix Softtail': 'Феликс Софттейл',
    'Pearl Velvetpaw': 'Пёрл Велветпоу',
    'Solomon Velvetpaw': 'Соломон Велветпоу',
    'Opal Silktail': 'Опал Силктейл',
    'Horatio Threadtail': 'Горацио Тредтейл',
    'Clementine Purrington': 'Клементина Пуррингтон',
    'Augustus Whiskerfield': 'Августус Вискерфильд',
    'Tobias Creamfur': 'Тобиас Кримфюр',
    'Marigold Butterpaws': 'Мэриголд Баттерпоуз',
    'Barnaby Whiskerfield and Daisy Milkpaw':
        'Барнаби Вискерфильд и Дейзи Милкпоу',
    'Meowbridge places': 'Места Мяубриджа',
    'Whiskerfield surname': 'Фамилия Вискерфильд',
    'Silver\'s places': 'Места Сильвера',
    'Whiskerfield places': 'Места Вискерфильдов',
    'School education': 'Школьное образование',
    'Reset columns': 'По умолчанию',
    'Done': 'Готово',
    'Studied in Meowbridge': 'Учился в Мяубридже'
});

const RU_DATA_ALBUMS = Object.freeze({
    'Family photos': 'Семейные фотографии',
    'Family album': 'Семейный альбом',
    'Personal album': 'Личный альбом',
    'Old portraits': 'Старые портреты',
    'Unsorted scans': 'Неразобранные сканы',
    'Identified and unidentified historical portraits.': 'Опознанные и неопознанные исторические портреты.',
    'Old portraits and scans from the family album.': 'Старые портреты и сканы из семейного альбома.',
    'Personal album of Silver Whiskerfield.': 'Личный альбом Сильвера Вискерфильда.',
    'Recently added scans waiting for review.': 'Недавно добавленные сканы, ожидающие проверки.',
    'Shared family portraits and gatherings.': 'Общие семейные портреты и фотографии встреч.',
    'Dimensions': 'Разрешение'
});

const RU_DATA_ARCHIVE = Object.freeze({
    'Pawford household register': 'Домовая ведомость Поуфорда',
    'Archives': 'Архивы',
    'Family documents': 'Семейные документы',
    'North Yorkshire': 'Северный Йоркшир',
    'United Kingdom': 'Великобритания',
    'Certificates': 'Свидетельства',
    'Household books': 'Домовые книги',
    'Interviews and correspondence': 'Интервью и переписка',
    'Books and reference': 'Книги и справочные материалы',
    'Pawford registers': 'Реестры Поуфорда',
    'Scanned material': 'Сканированные материалы',
    'Burial index': 'Указатель захоронений',
    'Census extract': 'Выписка из переписи',
    'Fishmarket Row census extract': 'Выписка из переписи по Фишмаркет-Роу',
    'Household register': 'Домовая ведомость',
    'Marriage record': 'Запись о браке',
    'Meowbridge marriage record': 'Запись о браке из Мяубриджа',
    'Old Cattery burial index': 'Указатель захоронений Олд-Кэттери',
    'Marriage certificate linked to the family relationship and Meowbridge.': 'Свидетельство о браке связанное с семейными отношениями и Мяубриджем.',
    'Recorded oral-history interview with Luna Purrington.': 'Запись устного интервью с Луной Пуррингтон.',
    'Continuation register containing entries connected to Luna Purrington’s family.': 'Реестр, содержащий записи, относящиеся к семье Луны Пуррингтон.',
    'Reference image stored in Archive; it is not duplicated into Albums.': 'Пример изображения, которое хранится в архиве; оно не дублируется в альбомы.',
    'Unidentified scan retained for later organization.': 'Неопознанный скан сохраненный для последующей обработки.',
    'Downloaded extract from the regional Pawford records database.': 'Выдержка из региональной базы данных архивов города Поуфорд.',
    'Register': 'Реестр',
    'Household register extract supporting Daisy Milkpaw’s birth and household context.': 'Выписка из домовой ведомости, подтверждающая сведения о рождении Дейзи Милкпоу и составе домохозяйства.',
    'Household scan that may connect members of the Whiskerfield family in Pawford.': 'Скан домовой книги, который может связывать членов семьи Вискерфильдов в Поуфорде.',
    'Index page from the Pawford register collection.': 'Страница указателя из коллекции реестров Поуфорда.',
    'Started at Pawford tutoring circle': 'Начал обучение в учебном кружке Поуфорда'
});

const RU_DATA_NOTIFICATIONS = Object.freeze({
    'Archive files are ready to organize': 'Архивные файлы готовы к организации',
    'Archive · Files': 'Архив · Файлы',
    'Albums - Cleanup': 'Альбомы — Разбор',
    '8 photos are not assigned to an album': '8 фотографий не добавлены ни в один альбом',
    'Places may need review': 'Места требуют проверки',
    'Places - Review': 'Места — Проверка',
    'Local backup recommended': 'Рекомендуется локальная резервная копия',
    'Project settings - Stored locally': 'Настройки проекта — Хранится локально',
    'Living people are hidden by default in exports': 'Данные живущих людей по умолчанию скрыты при экспорте',
    'Publish - Privacy reminder': 'Публикация — Напоминание о конфиденциальности'
});

const RU_UI_FAMILY_TREE = {
    'Recently viewed people selector will open here.':
        'Здесь откроется список недавно просмотренных людей.',

    'Tree view mode':
        'Режим отображения древа',

    'Classic':
        'Классический',

    'Pedigree':
        'Родословная',

    'Fan':
        'Веер',

    'Classic view':
        'Классический вид',

    'Pedigree view will be added later.':
        'Режим родословной будет добавлен позже.',

    'Fan view will be added later.':
        'Веерный вид будет добавлен позже.',

    'Export is planned for the Publish iteration.':
        'Экспорт запланирован для этапа разработки модуля «Публикация».',

    'Print preview will be added later.':
        'Предпросмотр печати будет добавлен позже.',

    'Tree settings are not part of this build yet.':
        'Настройки древа пока не входят в эту сборку.',

    'Tree Settings':
        'Настройки древа',

    'Focus':
        'Фокус',

    'Current focus':
        'Текущий фокус',

    'Current focus person':
        'Текущий основной человек',

    'Focus person':
        'Основной человек',

    'Focus branch':
        'Показать ветвь',

    'Recently selected people':
        'Недавно выбранные люди',

    'No recently selected people':
        'Недавно выбранных людей нет',

    'Selected':
        'Выбрано',

    'Return to main person':
        'Вернуться к основному человеку',

    'Parent family':
        'Родительская семья',

    'Shared parent family':
        'Общая родительская семья',

    'Family for this child':
        'Семья для этого ребёнка',

    'Select a parent family':
        'Выберите родительскую семью',

    'No parent family available':
        'Нет доступной родительской семьи',

    'The new sibling will be added to this existing parent family.':
        'Новый брат или сестра будет добавлен в эту родительскую семью.',

    'This determines which parent or partner family receives the child.':
        'Здесь выбирается семья родителя или партнёров, в которую будет добавлен ребёнок.',

    'Choose the parent family the siblings share.':
        'Выберите общую родительскую семью для братьев и сестёр.',

    'Choose the family this child will be added to.':
        'Выберите семью, в которую будет добавлен ребёнок.',

    'Add or connect a parent before creating a sibling.':
        'Сначала добавьте или свяжите родителя, затем создайте брата или сестру.',

    'The selected parent family is no longer available.':
        'Выбранная родительская семья больше недоступна.',

    'Choose how much of the branch around the focus person is shown.':
        'Выберите, какая часть ветви вокруг основного человека будет показана.',

    'Ancestor generations':
        'Поколения предков',

    'Descendant generations':
        'Поколения потомков',

    '0–6 generations':
        '0–6 поколений',

    '0–5 generations':
        '0–5 поколений',

    'Show cousins of the focus person':
        'Показывать двоюродных родственников основного человека',

    'Collateral branches are limited to cousins of the current focus person.':
        'Боковые ветви ограничены двоюродными родственниками текущего основного человека.',

    'Apply settings':
        'Применить настройки',

    'Family tree canvas':
        'Холст семейного древа',

    'Fit tree':
        'Вместить древо',

    'Add father':
        'Добавить отца',

    'Add mother':
        'Добавить мать',

    'Fan view':
        'Веерный вид',

    'Pedigree view':
        'Родословная',

    'Add relative':
        'Новый родственник',

    'New relative':
        'Новый родственник',

    'Connect existing person':
        'Установить связь',

    'Link someone already in this tree':
        'Присоединить из семейного древа',

    'Open profile':
        'Открыть профиль',

    'Show in Family Tree':
        'Показать в семейном древе',

    'Delete person':
        'Удалить человека',

    'No insights found for this person.':
        'Для этого человека пока нет подсказок.',

    'Find person':
        'Найти человека',

    'Select relationship':
        'Выберите связь',

    'Existing children':
        'Существующие дети',

    'Add new partner as the children\'s father':
        'Добавить нового партнёра как отца детей',

    'Add new partner as the children\'s mother':
        'Добавить нового партнёра как мать детей',

    'Add new partner as the children\'s parent':
        'Добавить нового партнёра как родителя детей',

    'Keep the children with the single parent only':
        'Оставить детей связанными только с текущим родителем',

    'Choose whether the new partner becomes a parent of the existing children.':
        'Выберите, станет ли новый партнёр родителем существующих детей.',

    'Warning!':
        'Предупреждение',

    'Can’t find the person?':
        'Не нашли человека?',

    'No matching people found. Try another name or create a new person.':
        'Подходящие люди не найдены. Попробуйте другое имя или создайте нового человека.',
    'Removing this fact will clear the saved suffix data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved prefix data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved cause of death data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved burial place data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved education data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved occupation data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved religion data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved custom fact data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved baptism data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Removing this fact will clear the saved alternative names data when you save the person.':'Это действие удалит факт при сохранении данных.',
    'Record an attribute or characteristic for': 'Добавьте факт или характеристику для',
    'Connect':
        'Связать'
};
const RU_UI_PEOPLE = {
    'People directory': 'Список людей',
    'People pages': 'Страницы списка людей',
    'Active People filters': 'Активные фильтры людей',
    'Open people filters': 'Открыть фильтры людей',
    'Sort people': 'Сортировать людей',
    'Person name': 'Имя',
    'Create and add another': 'Создать и добавить ещё одного',
    'Add person and reopen this window': 'Добавить человека и снова открыть это окно',
    'Create': 'Создать',

    'Bulk actions for selected people': 'Массовые действия с выбранными людьми',
    'Export selected people': 'Экспортировать выбранных людей',
    'Add selected people to a Geneograph board': 'Добавить выбранных людей на холст Генеографа',
    'Select all visible people': 'Выбрать всех видимых людей',

    'Review center': 'Центр проверки',
    'All people': 'Все люди',
    'Custom people filter': 'Пользовательский фильтр людей',

    'Choose People table columns': 'Выбрать столбцы таблицы людей',
    'Choose which fields are visible in the people table.': 'Выберите поля, которые будут отображаться в таблице людей.',

    'Filter people': 'Фильтровать людей',
    'Choose one or more values.':
        'Выберите одно или несколько значений.',

    'Search surnames':
        'Поиск фамилий',

    'Search birth places':
        'Поиск мест рождения',
    'Birth year':
        'Год рождения',

    'Enter a valid year.':
        'Введите корректный год.',

    'Unknown birth place':
        'Неизвестное место рождения',

    'No matching options.':
        'Подходящих вариантов нет.',

    'Open options':
        'Открыть варианты',

    'Close options':
        'Закрыть варианты',
    'Refine the directory by surname, birth place, living status, and review needs.': 'Уточните список по фамилии, месту рождения, жизненному статусу и необходимости проверки.',
    'People filters cleared.': 'Фильтры людей очищены.',
    'Create a reusable filter for the People directory.': 'Создайте многоразовый фильтр для списка людей.',
    'e.g. Meowbridge relatives': 'Например, Родственники из Мяубриджа',

    'Back to people': 'Назад к списку людей',
    'Edit profile': 'Изменить профиль',
    'Main information': 'Основные сведения',
    'Birth and life': 'Рождение и жизнь',
    'Profile card sections': 'Разделы карточки профиля',
    'Connected profile items': 'Связанные материалы профиля',

    'Profile editing cancelled.': 'Редактирование профиля отменено.',
    'Profile changes saved.': 'Изменения профиля сохранены.',

    'Place record not found.': 'Место не найдено.',

    'Placeholder family member; add a linked person later.': 'Это пока заглушка для члена семьи; связанного человека можно добавить позже.',
    'This family member is not linked to a People profile yet.': 'Этот член семьи пока не связан с профилем в разделе «Люди».',

    'Review center will be built in a later People iteration.': 'Центр проверки будет добавлен на одном из следующих этапов разработки раздела «Люди».',
    'Statistics will be built in a later People iteration.': 'Статистика будет добавлена на одном из следующих этапов разработки раздела «Люди».'
    ,
    'Identity': 'Основные сведения',
    'Middle name / Patronym': 'Второе имя / отчество',
    'Life events': 'События жизни',
    'Attach to this person': 'Связать с этим человеком',
    'Add File': 'Добавить файл',
    'Choose or connect a file': 'Выберите или свяжите файл',
    'Add Note': 'Добавить заметку',
    'Create or connect a note': 'Создайте или свяжите заметку',
    'Additional facts': 'Дополнительные сведения',
    'Optional': 'Необязательно',
    'Institution name': 'Название учреждения',
    'Institution type': 'Тип учреждения',
    'Education or credential': 'Образование или квалификация',
    'Start date': 'Дата начала',
    'End date': 'Дата окончания',
    'Education notes': 'Заметки об образовании',
    'Fact name *': 'Название факта *',
    'Fact details': 'Сведения о факте',
    'Date or period': 'Дата или период',
    'Required. Use a short category that describes the fact.': 'Обязательное поле. Укажите короткую категорию, описывающую факт.',
    'Research context or additional details': 'Исследовательский контекст или дополнительные сведения',
    'Company name': 'Название организации',
    'e.g. Pawford School': 'Например, Школа Поуфорда',
    'e.g. Teacher': 'Например, Учитель',
    'Work notes': 'Заметки о работе',
    'Baptism place': 'Место крещения',
    'Baptism date': 'Дата крещения',
    'Cause or reason': 'Причина или обстоятельства',
    'Nickname, spelling variant, or former name': 'Прозвище, вариант написания или прежнее имя',
    'e.g. Pawford Grammar School': 'Например, Поуфордская школа',
    'e.g. Secondary education, BA, apprenticeship': 'Например, среднее образование, степень бакалавра, ученичество',
    'e.g. Skill, membership, physical description': 'Например, навык, членство, внешняя особенность',
    'e. g. Woodworking, served in the army, etc.': 'Например, столярное дело, служба в армии и т. п.',
    'Parent–child connection': 'Связь родителя и ребёнка',
    'will be removed from Saved filters.': 'будет удален из сохраненных фильтров.',
    'This value describes how this parent and child are connected. It does not change either person record.': 'Это значение описывает связь родителя и ребёнка и не изменяет записи людей.',
    'Save relationship': 'Сохранить связь'
};
const RU_UI_GENEO = {
    // ========================================
    // Module
    // ========================================

    'Geneograph navigation':
        'Навигация Генеографа',

    'Geneograph Visual Boards':
        'Генеограф - Интерактивный холст',

    'Your personal space for research, visualizations and publications.':
        'Личное пространство для исследований, визуализаций и публикаций.',

    'Import board':
        'Импортировать холст',

    'New board':
        'Новый холст',

    'Search boards':
        'Поиск холстов',

    'Search boards...':
        'Поиск холстов...',

    'Sort boards':
        'Сортировать холсты',

    'All Boards':
        'Все холсты',

    'All boards':
        'Все холсты',

    'Not in collection':
        'Без коллекции',

    'Boards waiting to be organized.':
        'Холсты, ожидающие распределения по коллекциям.',

    'No boards yet.':
        'Холстов пока нет.',

    'No boards in this collection yet.':
        'В этой коллекции пока нет холстов.',

    'No favourite boards yet.':
        'Избранных холстов пока нет.',

    'Every active board belongs to a collection.':
        'Все активные холсты добавлены в коллекции.',

    'Boards kept outside your active Geneograph workspace.':
        'Холсты, хранящиеся вне активного рабочего пространства Генеографа.',

    'No archived boards. Archived boards will appear here.':
        'Архивных холстов пока нет. После архивации они появятся здесь.',

    // ========================================
    // Home tip
    // ========================================


    'Use Geneograph boards to collect hypotheses before adding relationships to the structured Family Tree.':
        'Используйте интерактивный холст - Генеограф - для сбора гипотез, прежде чем добавлять связи в структурированное семейное древо.',

    'Geneograph learning center will be added later.':
        'Учебный центр Генеографа будет добавлен позже.',

    // ========================================
    // Board creation / editing
    // ========================================

    'Board not found.':
        'Холст не найден.',

    'Edit board':
        'Изменить холст',

    'Create board':
        'Создать холст',

    'Board name':
        'Название холста',

    'e.g. Unknown father theory':
        'Например, Гипотеза о неизвестном отце',

    'Research question or intended output':
        'Исследовательский вопрос или предполагаемый результат',

    'Update the board name, description and collections.':
        'Измените название, описание и коллекции холста.',

    'Create a visual workspace for research, evidence and visual exploration.':
        'Создайте визуальное пространство для исследований, доказательств и изучения связей.',

    'Enter a board name.':
        'Введите название холста.',

    'Board updated.':
        'Холст обновлен.',

    'Board created.':
        'Холст создан.',

    'Board settings':
        'Настройки холста',

    'Update board details and collection memberships.':
        'Измените сведения о холсте и его принадлежность к коллекциям.',

    'Save settings':
        'Сохранить настройки',

    'Board settings updated.':
        'Настройки холста обновлены.',

    // ========================================
    // Geneograph collection chooser
    // ========================================

    'Find collections':
        'Найти коллекции',

    'Search collections':
        'Поиск коллекций',

    'All collections':
        'Все коллекции',

    'New collection':
        'Новая коллекция',

    'Create a new collection':
        'Создать новую коллекцию',

    'The new collection will be selected automatically.':
        'Новая коллекция будет выбрана автоматически.',

    'No collections match this search':
        'По этому запросу коллекции не найдены',

    'Try another collection name or description.':
        'Попробуйте другое название или описание коллекции.',

    'Create a collection to organize this board.':
        'Создайте коллекцию, чтобы организовать этот холст.',

    'Enter a collection name.':
        'Введите название коллекции.',

    // ========================================
    // Board editor
    // ========================================

    'Geneograph board navigation':
        'Навигация по холсту Генеографа',

    'Geneograph board tools':
        'Инструменты холста Генеографа',

    'Current board':
        'Текущий холст',

    'Layers':
        'Слои',

    'Search layers':
        'Поиск слоёв',

    'Add objects':
        'Добавить объекты',

    'History':
        'История',

    'Working mode':
        'Режим работы',

    'Notes & text':
        'Заметки и текст',

    'Choose content type':
        'Выбрать тип содержимого',

    'Shapes':
        'Фигуры',

    'More board tools':
        'Другие инструменты холста',

    'Sticky note':
        'Стикер',

    'Panel':
        'Панель',

    'Export board':
        'Экспортировать холст',

    'Preparing PNG…':
        'Подготовка PNG…',

    'PNG download started.':
        'Загрузка PNG началась.',

    'PNG exported at reduced resolution.':
        'PNG экспортирован с уменьшенным разрешением.',

    'Add visible objects before exporting this board.':
        'Добавьте видимые объекты перед экспортом холста.',

    'A required board image or the logo is unavailable. Check the asset and try again.':
        'Не удалось загрузить изображение холста или логотип. Проверьте файл и повторите попытку.',

    'This browser blocks local image access for PNG export. Serve the prototype locally and try again.':
        'Браузер блокирует доступ к локальным изображениям при экспорте PNG. Запустите прототип через локальный сервер и повторите попытку.',

    'This board is too large to export as one PNG.':
        'Этот холст слишком велик для экспорта в один PNG.',

    'The PNG could not be created. Try again or use a smaller board.':
        'Не удалось создать PNG. Повторите попытку или уменьшите холст.',

    'Created with GeneoGraph':
        'Создано в GeneoGraph',

    'Fit board':
        'Вместить холст',

    'Double-click to edit':
        'Дважды щёлкните для редактирования',

    'No stroke':
        'Без обводки',

    'Rename layer':
        'Переименовать слой',

    'Rename connection':
        'Переименовать связь',

    // ========================================
    // Connections
    // ========================================

    'Partner relationship':
        'Связь партнёров',

    'Parent-child relationship':
        'Связь «родитель — ребёнок»',

    'Sibling relationship':
        'Связь между братьями и сёстрами',

    'Solid connector':
        'Сплошной соединитель',

    'Dashed connector':
        'Пунктирный соединитель',

    'Choose connection style':
        'Выбрать стиль связи',

    'Connection style':
        'Стиль связи',

    'Draw solid connection':
        'Нарисовать сплошную связь',

    'Draw dashed connection':
        'Нарисовать пунктирную связь',

    'Solid':
        'Сплошная',

    'Dashed':
        'Пунктирная',

    'Relationship details':
        'Сведения о связи',

    'Show relationship date on board':
        'Показывать дату отношений на холсте',

    'Linked Family Tree relationship':
        'Связь из семейного древа',

    'Board-only relationship':
        'Связь только на этом холсте',

    'Save relationship details':
        'Сохранить сведения о связи',

    'Routing':
        'Маршрут линии',

    'Automatic':
        'Автоматический',

    'Reset route':
        'Сбросить маршрут',

    'Delete connection':
        'Удалить связь',

    'Collection name':
        'Название коллекции',

    'Delete collection':
        'Удалить коллекцию',

    // ========================================
    // Shapes
    // ========================================

    'Choose shape':
        'Выбрать фигуру',

    'Shape':
        'Фигура',

    'Shape type':
        'Тип фигуры',

    'Rectangle':
        'Прямоугольник',

    'Ellipse':
        'Эллипс',

    'Diamond':
        'Ромб',

    'Triangle':
        'Треугольник',

    'Hexagon':
        'Шестиугольник',

    // ========================================
    // Inspector
    // ========================================

    'Collapse inspector':
        'Свернуть инспектор',

    'Open inspector':
        'Открыть инспектор',

    'Board appearance and behavior':
        'Оформление и поведение холста',

    'Background pattern':
        'Узор фона',

    'Always show sockets':
        'Всегда показывать точки подключения',

    'Snap to grid':
        'Привязка к сетке',

    'Person cards':
        'Карточки людей',

    'Card style & content':
        'Стиль и содержимое карточки',

    'Multiple selection':
        'Множественный выбор',

    'Selection':
        'Выбор',

    'Drag a selected object or connector to move the selection.':
        'Перетащите выбранный объект или соединитель, чтобы переместить всё выделение.',

    // ========================================
    // Person card settings
    // ========================================

    'Person card style':
        'Стиль карточки человека',

    'Card style':
        'Стиль карточки',

    'Use board defaults':
        'Использовать настройки холста',

    'These values are inherited from the board. Uncheck “Use board defaults” to edit this card.':
        'Эти значения наследуются от холста. Снимите флажок «Использовать настройки холста», чтобы изменить эту карточку.',

    'Formatting':
        'Форматирование',

    'Name format':
        'Формат имени',

    'Photo size':
        'Размер фотографии',

    'Text alignment':
        'Выравнивание текста',

    'Centered by this style':
        'По центру для этого стиля',

    'Defined by this style':
        'Определяется выбранным стилем',

    'Corner radius':
        'Радиус скругления',

    'Color person cards by gender':
        'Окрашивать карточки людей по полу',

    'Use Family Tree colors for male and female cards. Unknown remains neutral.':
        'Использовать цвета семейного древа для мужских и женских карточек. Неизвестный пол остаётся нейтральным.',

    'Displayed information':
        'Отображаемые сведения',

    'Available in Standard and Portrait cards':
        'Доступно для карточек «Стандарт» и «Портрет»',

    'Family Tree link indicator':
        'Индикатор связи с семейным древом',

    // Card styles
    'Standard':
        'Стандарт',

    'Tree':
        'Древо',

    'Chart':
        'Схема',

    'Portrait':
        'Портрет',

    'Detailed facts':
        'Подробные сведения',

    'Compact family view':
        'Компактный семейный вид',

    'Maximum density':
        'Максимальная плотность',

    'Photo-first':
        'Акцент на фотографии',

    // ========================================
    // Person inspector / Family Tree linking
    // ========================================

    'Edit details':
        'Изменить сведения',

    'Family Tree link':
        'Связь с семейным древом',

    'Family Tree person':
        'Человек из семейного древа',

    'Family Tree link actions':
        'Действия со связью с семейным древом',

    'Change link':
        'Изменить связь',

    'Not linked to Family Tree':
        'Не связан с семейным древом',

    'Link this board person to an existing Family Tree person.':
        'Свяжите человека на этом холсте с существующим человеком в семейном древе.',

    'Link this board person to Family Tree':
        'Связать человека на холсте с семейным древом',

    'Change Family Tree link':
        'Изменить связь с семейным древом',

    'Link to Family Tree':
        'Связать с семейным древом',

    'Update this board person without changing the linked Family Tree record.':
        'Измените человека на этом холсте, не меняя связанную запись в семейном древе.',

    'Create a board-local person and connect them to the selected card.':
        'Создайте человека только для этого холста и свяжите его с выбранной карточкой.',

    'Create a board-local person. You can link them to Family Tree later.':
        'Создайте человека только для этого холста. Позже его можно связать с семейным древом.',

    'No additional people to suggest.':
        'Других людей для предложения нет.',

    'No Family Tree people are available.':
        'В семейном древе нет доступных людей.',

    'Search by name, dates, place, or branch':
        'Поиск по имени, датам, месту или ветви',

    // ========================================
    // Layer organization / layout
    // ========================================

    'Layer name':
        'Название слоя',

    'Board organization only. Card content and linked records are unchanged.':
        'Это влияет только на организацию холста. Содержимое карточки и связанные записи не изменяются.',

    'Leave blank to use the automatic relationship or connector name.':
        'Оставьте поле пустым, чтобы использовать автоматическое название связи или соединителя.',

    'Person card size':
        'Размер карточки человека',

    // ========================================
    // Panels
    // ========================================

    'Panel title':
        'Название панели',

    'Panel description':
        'Описание панели',

    'Describe the purpose or contents of this panel.':
        'Опишите назначение или содержимое этой панели.',

    'Visible in panel properties only.':
        'Отображается только в свойствах панели.',

    // ========================================
    // Places on Geneograph boards
    // ========================================

    'Linked project place':
        'Связанное место проекта',

    'Board-only place':
        'Место только на холсте',

    'Change place':
        'Изменить место',

    'Open in Places':
        'Открыть в разделе «Места»',

    'Make board-only':
        'Сделать местом только на холсте',

    'Edit place object':
        'Изменить объект места',

    'Add an existing project place or create a place that exists only on this board.':
        'Добавьте существующее место проекта или создайте место, которое будет существовать только на этом холсте.',

    'Search project places or type a board-only name':
        'Найдите место проекта или введите название места только для этого холста',

    'Project places':
        'Места проекта',

    'Project place results':
        'Результаты поиска мест проекта',

    'Project place':
        'Место проекта',

    'No project places yet.':
        'В проекте пока нет мест.',

    'Type a name above to create a board-only place.':
        'Введите название выше, чтобы создать место только для этого холста.',

    'Create board-only place':
        'Создать место только на холсте',

    'Only available on this board':
        'Доступно только на этом холсте',

    'Save board-only place':
        'Сохранить место только на холсте',

    'Add board-only place':
        'Добавить место только на холст',

    'Project places stay linked and reflect future name changes. Board-only places exist only on this board.':
        'Места проекта остаются связанными и отражают последующие изменения названий. Места только на холсте существуют исключительно на этом холсте.',

    'Select a project place or the board-only creation choice.':
        'Выберите место проекта или вариант создания места только на холсте.',

    // ========================================
    // Images on Geneograph boards
    // ========================================

    'Image source':
        'Источник изображения',

    'Image unavailable':
        'Изображение недоступно',

    'Board upload':
        'Загрузка на холст',

    'Replace image':
        'Заменить изображение',

    'Open photo':
        'Открыть фотографию',

    'Add images':
        'Добавить изображения',

    'Choose one project photo or upload a replacement stored locally in this board.':
        'Выберите одну фотографию проекта или загрузите замену, которая будет храниться только на этом холсте.',

    'Select project photos, upload new images, or combine both sources in one addition.':
        'Выберите фотографии проекта, загрузите новые изображения или объедините оба источника за одно добавление.',

    'Upload new images':
        'Загрузить новые изображения',

    'This upload will be stored only inside this board and will not appear in Albums.':
        'Эта загрузка будет храниться только на этом холсте и не появится в Альбомах.',

    'Uploaded images will stay local to this board and will not appear in Albums.':
        'Загруженные изображения останутся только на этой холсте и не появятся в Альбомах.',

    'Preparing images…':
        'Подготовка изображений…',

    'Appearance': 'Оформление',
    'Background': 'Фон',
    'Background color': 'Цвет фона',
    'Background hex color': 'HEX-код фона',
    'Canvas': 'Холст',
    'No pattern': 'Без узора',
    'Dots': 'Точки',
    'Grid': 'Сетка',
    'Life dates': 'Даты жизни',
    'Maiden surname': 'Девичья фамилия',
    'Pan': 'Перемещение',
    'Pencil': 'Карандаш',
    'Photo': 'Фотография',
    'Select': 'Выделение',
    'Status': 'Статус',
    'Undo': 'Отм.',
    'Redo': 'Повт.',
    'Born': 'Рождение',
    'Date modified': 'Дата изменения',
    'Full name': 'Полное имя',
    'First + surname': 'Имя + фамилия',
    'Surname first': 'Сначала фамилия',
    'Full dates': 'Полные даты',
    'Years only': 'Только годы',
    'Small': 'Маленький',
    'Medium': 'Средний',
    'Left': 'По левому краю',
    'Center': 'По центру',
    'Board connections': 'Связи на холсте',
    'Connect child to this family': 'Связать ребёнка с этой семьёй',
    'Connect from top': 'Начать связь сверху',
    'Connect from right': 'Начать связь справа',
    'Connect from bottom': 'Начать связь снизу',
    'Connect from left': 'Начать связь слева',
    'Place Text': 'Разместить текст',
    'Place Sticky note': 'Разместить стикер',
    'Content': 'Содержимое',
    'Fill': 'Заливка',
    'Stroke': 'Обводка',
    'Text': 'Текст',
    'Layout': 'Расположение',
    'Pattern': 'Стиль линии',
    'Remove': 'Убрать',
    'Reset': 'Сбросить',
    'Visible': 'Видимый',
    'Width': 'Ширина',
    'Height': 'Высота',
    'Unlink': 'Удалить связь',
    'Fill hex color': 'HEX-код заливки',
    'Stroke hex color': 'HEX-код обводки',
    'Text hex color': 'HEX-код текста',
    'Fill opacity': 'Непрозрачность заливки',
    'Stroke opacity': 'Непрозрачность обводки',
    'Text opacity': 'Непрозрачность текста',
    'Remove fill color': 'Убрать заливку',
    'Remove stroke color': 'Убрать обводку',
    'Reset text color to default': 'Сбросить цвет текста',
    'Fit height to content': 'Подогнать высоту по содержимому',
    'Living is never shown. Deceased appears only when no death date or place is recorded. Unknown appears when enabled.':
        'Статус «Жив(а)» не показывается. Статус «Умер(ла)» отображается только при отсутствии даты и места смерти. Статус «Неизвестно» отображается, если он включён.',
    'Height fits visible content · Width remains freeform':
        'Высота подстраивается под содержимое · Ширину можно менять свободно',
    'Board organization only. Card content and linked records are unchanged.':
        'Это влияет только на организацию холста. Содержимое карточки и связанные записи не изменяются.',

    'Create a visual workspace for research, evidence, tree design, or publication.':
        'Создайте визуальное пространство для исследований, доказательств, проектирования древа или публикации.',

    'Create a new Geneograph board':
        'Создать новый холст Генеографа',

    'Create collection':
        'Создать коллекцию',

    'No stroke':
        'Без линии'
};
const RU_UI_ALBUMS = {
    // ========================================
    // Navigation / views
    // ========================================

    'Albums navigation':
        'Навигация по альбомам',

    'All photos':
        'Все фотографии',

    'Not in an album':
        'Без альбома',

    'Create album':
        'Создать альбом',

    'Album photos':
        'Фотографии альбома',

    'This album has no photos yet.':
        'В этом альбоме пока нет фотографий.',

    'Photos marked as favourites.':
        'Фотографии, добавленные в избранное.',

    'No favorite photos yet.':
        'В избранном пока нет фотографий.',

    'Photos waiting to be organized.':
        'Фотографии, ожидающие распределения по альбомам.',

    'Every active photo belongs to an album.':
        'Все активные фотографии добавлены в альбомы.',

    'Your photos and visual memories.':
        'Ваши фотографии и визуальные воспоминания.',

    'No photos match this view.':
        'В этом представлении нет подходящих фотографий.',

    'Unlink note from photo?': 'Разорвать связь заметки с фото?',
    'The photo will be removed from Albums and all other linked records.': 'Эта фотография будет удалена из альбомов и всех связанных записей.',

    // ========================================
    // Albums tip
    // ========================================

    'Add people, dates, and places as you identify them. Even partial details make photos easier to find later.':
        'Добавляйте людей, даты и места по мере их определения. Даже частичные сведения помогут быстрее находить фотографии позже.',

    'More photo organization guidance will be added later.':
        'Дополнительные рекомендации по организации фотографий будут добавлены позже.',

    // ========================================
    // Photo browser
    // ========================================

    'Add photos':
        'Добавить фотографии',

    'Photo controls':
        'Управление фотографиями',

    'Search photos...':
        'Поиск фотографий...',

    'Open photo filters':
        'Открыть фильтры фотографий',

    'Sort photos':
        'Сортировать фотографии',

    'Oldest added':
        'Дата добавления',

    'Photo pages':
        'Страницы фотографий',

    'Select all visible photos':
        'Выбрать все видимые фотографии',

    'Select all':
        'Выбрать все',

    'Photo actions':
        'Действия с фотографией',

    'No people tagged':
        'Люди не отмечены',

    'No people':
        'Нет людей',

    'Mark as favorite':
        'Добавить в избранное',

    'Mark as favourite':
        'Добавить в избранное',

    'Try a different search or clear the active filters.':
        'Попробуйте другой запрос или очистите активные фильтры.',

    'Add a prototype photo to begin organizing this collection.':
        'Добавьте тестовую фотографию, чтобы начать организацию этой коллекции.',

    'Clear search and filters':
        'Очистить поиск и фильтры',
    'Drag the photo to reposition it inside the crop.': 'Передвигайте фотографию для изменения выделенной области',
    'Rotate left': 'Повернуть влево',
    'Rotate right': 'Повернуть вправо',
    'Use photo': 'Использовать фото',
    'This photo will appear in Family Tree, People, and Profile.': 'Это фото отобразиться в Семейном древе, Людях и Профиле.',
    'Family Tree preview': 'Превью - Семейное древо',
    'Profile preview': 'Превью - Профиль',
    'Your selected photo and crop adjustments will not be saved.': 'Выбранная фотография и настройки положения не будут сохранены.',
    'Remove this photo from': 'Убрать фотографию из',

    // ========================================
    // Filters
    // ========================================

    'Active Albums filters':
        'Активные фильтры альбомов',

    'Filter photos':
        'Фильтровать фотографии',

    'Use filters to narrow down the view.':
        'Используйте фильтры, чтобы сузить список фотографий.',

    'No known place':
        'Место не указано',

    'Any date':
        'Любая дата',

    'Known date':
        'Дата известна',

    'Favourites only':
        'Только избранные',

    'All Archive':
        'Весь архив',

    'Current folder and subfolders':
        'Текущая папка и подпапки',

    'Document date':
        'Дата документа',

    'Files only':
        'Только файлы',

    'Folder structure':
        'Структура папок',

    'Filtered result layout':
        'Вид отфильтрованных результатов',

    'Browse files matching the active filters.':
        'Просматривайте файлы, соответствующие активным фильтрам.',

    'No files match these filters.':
        'Нет файлов, соответствующих этим фильтрам.',

    'No folders contain matching files.':
        'Нет папок с подходящими файлами.',

    'Change or clear the active filters and try again.':
        'Измените или сбросьте активные фильтры и повторите попытку.',

    'Filter files across Archive and choose how results are displayed.':
        'Фильтруйте файлы во всём архиве и выбирайте способ отображения результатов.',

    'photo selected': 'фото выбрано',

    // ========================================
    // Selection / album membership
    // ========================================

    'Add to album':
        'Добавить в альбом',

    'Add to albums':
        'Добавить в альбомы',

    'Remove from album':
        'Удалить из альбома',

    // ========================================
    // Photo inspector
    // ========================================

    'Photo inspector':
        'Инспектор фотографии',

    'Collapsed photo inspector':
        'Свёрнутый инспектор фотографии',

    'Collapse photo inspector':
        'Свернуть инспектор фотографии',

    'Show photo inspector':
        'Показать инспектор фотографии',

    'Edit photo':
        'Изменить фотографию',

    'More photo actions':
        'Другие действия с фотографией',

    'Open preview':
        'Открыть предпросмотр',

    'Photo name':
        'Название фотографии',

    'Historical date':
        'Историческая дата',

    'Caption':
        'Подпись',

    'Add a description of this photo':
        'Добавьте описание фотографии',

    'No caption added.':
        'Подпись не добавлена.',

    'Unknown place':
        'Неизвестное место',

    'No people tagged on this photo.':
        'На этой фотографии никто не отмечен.',

    'This photo is not in an album.':
        'Эта фотография не добавлена ни в один альбом.',

    'No notes linked to this photo.':
        'К этой фотографии не привязаны заметки.',

    'No sources linked to this photo.':
        'К этой фотографии не привязаны источники.',

    'Source linking will be added later.':
        'Связывание с источниками будет добавлено позже.',

    'Check the historical date before saving.':
        'Проверьте историческую дату перед сохранением.',

    'Enter a photo name before saving.':
        'Введите название фотографии перед сохранением.',

    'Photo updated.':
        'Фотография обновлена.',

    // ========================================
    // Unsaved photo edits
    // ========================================

    'Discard photo changes?':
        'Отменить изменения фотографии?',

    'Your unsaved title and detail changes will be lost.':
        'Несохранённые изменения названия и сведений будут потеряны.',

    'Discard changes':
        'Отменить изменения',

    // ========================================
    // Tag people
    // ========================================

    'Tag person':
        'Отметить человека',

    'Tag people':
        'Отметить людей',

    'Tagged people':
        'Отмеченные люди',

    'Close tag people dialog':
        'Закрыть диалог отметки людей',

    'Save people':
        'Сохранить отметки',

    'People tags updated.':
        'Отметки людей обновлены.',

    'Remove primary photo tags?':
        'Удалить отметки основной фотографии?',

    'Remove primary photo tag?':
        'Удалить отметку основной фотографии?',

    'This photo is the person\'s primary photo. Removing the tag will clear the primary photo.':
        'Эта фотография является основной для человека. При удалении отметки основная фотография будет сброшена.',

    'Person tag removed.':
        'Отметка человека удалена.',

    'Remove tag':
        'Удалить отметку',

    'Use as primary photo':
        'Использовать как основную фотографию',

    'Remove as primary photo':
        'Убрать основную фотографию',

    'Primary photo removed.':
        'Основная фотография удалена.',

    // ========================================
    // Photo actions / deletion
    // ========================================

    'Delete photo':
        'Удалить фотографию',

    'Delete photo permanently?':
        'Удалить фотографию безвозвратно?',

    'Delete permanently':
        'Удалить безвозвратно',

    'Any affected primary-photo assignments will be cleared.':
        'Если фотография используется в качестве фото профиля, она будет удалена.',

    'Save copy':
        'Сохранить копию',

    'Save copy will be available when real photo files are implemented.':
        'Сохранение копии станет доступно после реализации работы с реальными файлами фотографий.',

    // ========================================
    // Create / edit albums
    // ========================================

    'New album':
        'Новый альбом',

    'Create a named group of photos.':
        'Создайте именованную группу фотографий.',

    'Album name':
        'Название альбома',

    'e.g. Whiskerfield family photos':
        'Например, Фотографии семьи Вискерфильдов',

    'e.g. Portraits, documents, and family photos connected to the Whiskerfield family.':
        'Например, Портреты, документы и семейные фотографии, связанные с семьёй Вискерфильдов.',

    'Album created.':
        'Альбом создан.',

    'Edit album':
        'Изменить альбом',

    'Album updated.':
        'Альбом обновлён.',

    'Delete album':
        'Удалить альбом',

    'Delete album?':
        'Удалить альбом?',

    'Photos remain in All photos. Album membership will be removed.':
        'Фотографии останутся в разделе «Все фотографии». Связь с альбомом будет удалена.',

    'Album deleted. Photos remain in All photos.':
        'Альбом удалён. Фотографии остались в разделе «Все фотографии».',

    'Open album':
        'Открыть альбом',

    // ========================================
    // Add photos
    // ========================================

    'Add new photos to your project.':
        'Добавьте новые фотографии в проект.',

    'Add photo':
        'Добавить фотографию',

    'New photos will be added to the current project and album.':
        'Новые фотографии будут добавлены в текущий проект и альбом.',

    // ========================================
    // Add to album picker
    // ========================================

    'Close add to album dialog':
        'Закрыть диалог добавления в альбом',

    'Find albums':
        'Найти альбомы',

    'Search albums':
        'Поиск альбомов',

    'All albums':
        'Все альбомы',

    'Create a new album':
        'Создать новый альбом',

    'The new album will be selected automatically.':
        'Новый альбом будет выбран автоматически.',

    'Untitled album':
        'Альбом без названия',

    'Already contains all selected photos':
        'Уже содержит все выбранные фотографии',

    'No albums match this search':
        'По этому запросу альбомы не найдены',

    'Try another album name or description.':
        'Попробуйте другое название или описание альбома.',

    'No albums yet':
        'Альбомов пока нет',

    'Create an album to organize the selected photos.':
        'Создайте альбом, чтобы организовать выбранные фотографии.',

    'Add to albums':
        'Добавить в альбомы',

    // ========================================
    // Remove from album
    // ========================================

    'Remove from album?':
        'Удалить из альбома?',

    'The photo will remain in All photos and in any other albums.':
        'Фотография останется в разделе «Все фотографии» и во всех остальных альбомах.',

    'It will disappear from the current album after removal.':
        'После удаления фотография исчезнет из текущего альбома.',

    'Add people, dates, and places as you identify them. Even partial details make photos easier to find later.':
        'Добавляйте людей, даты и места по мере их определения. Даже неполные сведения помогают быстрее находить фотографии.',

    'View mode':
        'Режим просмотра',

    'Full-size photo preview':
        'Полноразмерный просмотр фотографии',

    'Add source':
        'Добавить источник'
};
const RU_UI_ARCHIVE = {
    // ========================================
    // Archive workspace / navigation
    // ========================================

    'Archive workspace':
        'Рабочая область Архива',

    'Archive folder tree':
        'Дерево папок Архива',

    'All files':
        'Все файлы',

    'Where found':
        'Где найти',

    'New folder':
        'Новая папка',

    'Add files':
        'Добавить файлы',

    'Organize your research files and folders.':
        'Организуйте документы связанные с вашим исследованием.',

    'Document where your research files and information came from.':
        'Укажите, откуда получены ваши исследовательские файлы и сведения.',

    'Files marked as favourites.':
        'Файлы, добавленные в избранное.',

    'No favourite files':
        'Нет избранных файлов',

    'Mark frequently used files as favourites to find them here.':
        'Добавляйте часто используемые файлы в избранное, чтобы быстро находить их здесь.',

    'No files match this search':
        'По этому запросу файлы не найдены',

    'Try a different search term or clear the active filters.':
        'Попробуйте другой запрос или очистите активные фильтры.',

    'Drop files here':
        'Перетащите файлы сюда',

    'Drop files here to add them to Archive, or click to choose files.':
        'Перетащите файлы сюда, чтобы добавить их в Архив, или нажмите, чтобы выбрать файлы.',

    'Click to choose files':
        'Нажмите, чтобы выбрать файлы',

    'Folder path':
        'Путь к папке',

    'Folder navigation':
        'Навигация по папкам',

    'Go back':
        'Назад',

    'Go forward':
        'Вперёд',

    'Go up one level':
        'На уровень выше',

    'Archive files and folders':
        'Файлы и папки Архива',

    'Select all visible files':
        'Выбрать все видимые файлы',

    'Size / Items':
        'Размер / Элементы',

    'Folder actions':
        'Действия с папкой',

    'File actions':
        'Действия с файлом',

    'Source actions':
        'Действия с источником',

    // ========================================
    // Toolbar / search
    // ========================================

    'File controls':
        'Управление файлами',

    'Source controls':
        'Управление источниками',

    'Search files':
        'Поиск файлов',

    'Search sources...':
        'Поиск источников...',

    'Search favourite files':
        'Поиск среди избранных файлов',

    'Search favourites in this folder':
        'Поиск избранных файлов в этой папке',

    'Search all files...':
        'Поиск по всем файлам...',

    'Search this folder...':
        'Поиск в этой папке...',

    'Open file filters':
        'Открыть фильтры файлов',

    'Open source filters':
        'Открыть фильтры источников',

    'Sort files':
        'Сортировать файлы',

    'Sort sources':
        'Сортировать источники',

    'Date added':
        'Дата добавления',

    'Location':
        'Расположение',

    'Go to All Files root':
        'Перейти в корень «Все файлы»',

    'Add Person':
        'Добавить человека',

    'Add Event':
        'Добавить событие',

    'Find people':
        'Найти людей',

    'Find a person':
        'Найти человека',

    'Suggested people':
        'Предложенные люди',

    'Already added':
        'Уже добавлено',

    'Search by person, event, date, or place':
        'Поиск по человеку, событию, дате или месту',

    'Person events':
        'События человека',

    'Create linked note':
        'Создать связанную заметку',

    'No photos linked.': 'Нет связанных фото',
    'Unlink person?':
        'Удалить связь с человеком?',

    'Unlink event?':
        'Удалить связь с событием?',

    'Unlink note?':
        'Удалить связь с заметкой?',

    'Unlink place?':
        'Удалить связь с местом?',

    'Unlink photo?':
        'Удалить связь с фотографией?',

    'Unlink source?':
        'Удалить связь с источником?',

    'Only the connection will be removed.':
        'Будет удалена только связь.',

    // ========================================
    // Filters
    // ========================================

    'Search scope':
        'Область поиска',

    'This folder':
        'Эта папка',

    'File type':
        'Тип файла',

    'All types':
        'Все типы',

    'Linked files':
        'Связанные файлы',

    'Unlinked files':
        'Несвязанные файлы',

    'Source category':
        'Категория источника',

    'All source categories':
        'Все категории источников',

    'Favourite sources only':
        'Только избранные источники',

    'Favourite sources':
        'Избранные источники',

    'Filter files':
        'Фильтровать файлы',

    'Filter sources':
        'Фильтровать источники',

    'Narrow sources by category, connection status, or favourite status.':
        'Уточните список источников по типу или статусу избранного.',

    'Choose where to search and narrow files by type or connections.':
        'Выберите область поиска и уточните список файлов по типу или наличию связей.',

    'Active Archive filters':
        'Активные фильтры Архива',

    // ========================================
    // Sources view
    // ========================================

    'Source': 'Источник',
    'All sources':
        'Все источники',

    'Source categories':
        'Категории источников',

    'Browse sources':
        'Просмотр источников',

    'Institutions':
        'Учреждения',

    'Online sources':
        'Онлайн-источники',

    'Publications':
        'Публикации',

    'People & correspondence':
        'Люди и переписка',

    'Family & personal':
        'Семейные и личные',

    'No sources found':
        'Источники не найдены',

    'Try a different search term or source type.':
        'Попробуйте другой запрос или тип источника.',

    'Create a lightweight source record to document where files and information came from.':
        'Создайте краткую запись об источнике, чтобы зафиксировать происхождение файлов и сведений.',

    'Source record':
        'Запись об источнике',

    'Add sources':
        'Добавить источники',

    'Selected sources':
        'Выбранные источники',

    'Suggested sources':
        'Предложенные источники',

    'Close source picker':
        'Закрыть выбор источников',

    'Untitled source':
        'Источник без названия',

    'Origin not specified':
        'Происхождение не указано',

    'No sources available':
        'Нет доступных источников',

    'Create a source first, then return here to link it.':
        'Сначала создайте источник, а затем вернитесь сюда, чтобы связать его.',

    'No sources match this search':
        'По этому запросу источники не найдены',

    'Try another source name, origin, location, or reference.':
        'Попробуйте другое название, происхождение, расположение или архивный шифр.',

    'All available sources are linked':
        'Все доступные источники уже связаны',

    'No additional sources are available for this item.':
        'Для этого объекта нет дополнительных доступных источников.',

    'All available sources are selected':
        'Все доступные источники выбраны',

    'Every unlinked source is already in the current selection.':
        'Все несвязанные источники уже добавлены в текущий выбор.',

    'Source links could not be updated.':
        'Не удалось обновить связи с источниками.',

    'Source links updated.':
        'Связи с источниками обновлены.',

    'Source created and linked.':
        'Источник создан и связан.',

    'Source created, but it could not be linked.':
        'Источник создан, но связать его не удалось.',

    'Add source to favourites':
        'Добавить источник в избранное',

    'Remove source from favourites':
        'Удалить источник из избранного',

    // ========================================
    // Source taxonomy
    // ========================================

    'Archive, library, or institution':
        'Архив, библиотека или учреждение',

    'Website or online database':
        'Веб-сайт или онлайн-база данных',

    'Book, newspaper, or publication':
        'Книга, газета или публикация',

    'Person, interview, or correspondence':
        'Человек, интервью или переписка',

    'Family or personal collection':
        'Семейная или личная коллекция',

    'Other source':
        'Другой источник',

    'Category':
        'Категория',

    'Choose category':
        'Выберите категорию',

    'Not categorized':
        'Без категории',

    'Obtained from':
        'Получено от',

    // ========================================
    // Archive inspector
    // ========================================

    'Archive inspector':
        'Инспектор Архива',

    'Archive inspector collapsed':
        'Свёрнутый инспектор Архива',

    'Open Archive inspector':
        'Открыть инспектор Архива',

    'Collapse Archive inspector':
        'Свернуть инспектор Архива',

    'Edit Archive file':
        'Редактирование файла Архива',

    'Archive inspector actions':
        'Действия инспектора Архива',

    'No item selected':
        'Ничего не выбрано',

    'Select a file or folder to view its details.':
        'Выберите файл или папку, чтобы просмотреть сведения.',

    // ========================================
    // File preview / inspector
    // ========================================

    'PDF preview':
        'Предпросмотр PDF',

    'Image preview':
        'Предпросмотр изображения',

    'Audio preview':
        'Предпросмотр аудио',

    'Spreadsheet preview':
        'Предпросмотр таблицы',

    'Document preview':
        'Предпросмотр документа',

    'Archive-file preview':
        'Предпросмотр архивного файла',

    'File preview':
        'Предпросмотр файла',

    'The file preview is represented conceptually in this prototype.':
        'Предпросмотр файла представлен в этом прототипе условно.',

    'Preview is not available for this file type. Open the original file to view it.':
        'Предпросмотр недоступен для этого типа файла. Откройте исходный файл, чтобы просмотреть его.',

    'Open file':
        'Открыть файл',

    'Edit file':
        'Изменить файл',

    'Add a description of this file':
        'Добавьте описание файла',

    'Date unknown':
        'Дата неизвестна',

    'Place not recorded':
        'Место не указано',

    'No people linked to this file.':
        'С этим файлом не связаны люди.',

    'No events linked to this file.':
        'С этим файлом не связаны события.',

    'No notes linked to this file.':
        'С этим файлом не связаны заметки.',

    'No sources linked to this file.':
        'С этим файлом не связаны источники.',

    'File metadata':
        'Метаданные файла',

    'Original filename':
        'Исходное имя файла',

    'MIME type':
        'MIME-тип',

    'File ID':
        'ID файла',

    // ========================================
    // File editing
    // ========================================

    'Discard file changes?':
        'Отменить изменения файла?',

    'Your unsaved file name and detail changes will be lost.':
        'Несохранённые изменения имени файла и сведений будут потеряны.',

    'File updated.':
        'Файл обновлён.',

    // ========================================
    // Folder inspector
    // ========================================

    'New subfolder':
        'Новая подпапка',

    'Add file':
        'Добавить файл',

    'Folder details':
        'Сведения о папке',

    'Nested files':
        'Файлы во вложенных папках',

    'Selected folder':
        'Выбранная папка',

    'Current folder':
        'Текущая папка',

    'Top level':
        'Верхний уровень',

    'Parent folder':
        'Корневая папка',

    // ========================================
    // Create folder
    // ========================================

    'Enter a folder name and choose where it should be created.':
        'Введите название папки и выберите, где её создать.',

    'Folder name':
        'Название папки',

    'e.g. Civil records':
        'Например, Акты гражданского состояния',

    'Create folder':
        'Создать папку',

    'Search folders':
        'Поиск папок',

    // ========================================
    // Rename files / folders
    // ========================================

    'Rename file':
        'Переименовать файл',

    'Rename folder':
        'Переименовать папку',

    'Update the file name without changing its contents, folder, or links.':
        'Измените имя файла, не меняя его содержимое, папку или связи.',

    'Update the folder name without changing its contents or location.':
        'Измените название папки, не меняя её содержимое или расположение.',

    'File renamed.':
        'Файл переименован.',

    'Folder renamed.':
        'Папка переименована.',

    // ========================================
    // Move files / folders
    // ========================================

    'Move folder':
        'Переместить папку',

    'Move file':
        'Переместить файл',

    'Move': 'Переместить',

    'Choose a destination folder.':
        'Выберите папку назначения.',

    'Moving':
        'Перемещение',

    'Choose a folder':
        'Выберите папку',

    'Destination':
        'Назначение',

    'Create inside':
        'Создать внутри',

    'Move here':
        'Переместить сюда',

    'Move undone.':
        'Перемещение отменено.',

    'Open folder':
        'Открыть папку',

    // ========================================
    // Source inspector / editor
    // ========================================

    'No source selected':
        'Источник не выбран',

    'Select or create a source record.':
        'Выберите или создайте запись об источнике.',

    'Genealogy source record':
        'Генеалогический источник',

    'Edit source':
        'Изменить источник',

    'Toggle source favourite':
        'Добавить или удалить источник из избранного',

    'Source details':
        'Сведения об источнике',

    'Source notes':
        'Заметки об источнике',

    'No people linked.':
        'Связанных людей нет.',

    'No events linked.':
        'Связанных событий нет.',

    'No notes linked.':
        'Связанных заметок нет.',

    'No places linked.':
        'Связанных мест нет.',

    'Repository / owner':
        'Хранилище / владелец',

    'Accessed':
        'Дата обращения',

    'Delete source permanently':
        'Удалить источник безвозвратно',

    'Record where this file or information came from. Only the source name is required.':
        'Укажите, откуда получен этот файл или информация. Обязательно только название источника.',

    'Source name':
        'Название источника',

    'e.g. Pawford household register':
        'Например, домовая книга Поуфорда',

    'Where or who did it come from?':
        'Откуда или от кого это получено?',

    'Basic information':
        'Основная информация',

    'Finding details':
        'Данные для поиска',

    'Additional notes':
        'Дополнительные заметки',

    'Person, archive, website, library, or family collection':
        'Человек, архив, веб-сайт, библиотека или семейная коллекция',

    'Town, archive location, or where the item is kept':
        'Город, расположение архива или место хранения',

    'Where can it be found?':
        'Где найти?',

    'Collection, folder, volume, page, call number, or item':
        'Коллекция, папка или архивный шифр',

    'Website or link':
        'Веб-сайт или ссылка',

    'Date accessed or received':
        'Дата обращения',

    'Add anything that will help you recognize or find this source again':
        'Добавьте сведения, которые помогут снова распознать или найти этот источник',

    'Obtained from':
        'Получено от',

    'Save source':
        'Сохранить источник',

    'Create source':
        'Создать источник',

    'Source updated.':
        'Источник обновлён.',

    'Source created.':
        'Источник создан.',
    'View all sources':
        'Показать все источники',

    'View all files': 'Показать все файлы',
    'View all notes': 'Показать все заметки',

    'Remove the connection between “{source}” and “{record}”?':
        'Удалить связь между «{source}» и «{record}»?',

    'Only this connection will be removed. Both records and their other connections will remain in the project.':
        'Будет удалена только эта связь. Обе записи и их остальные связи сохранятся в проекте.',

    'The source or connected record is no longer available.':
        'Источник или связанная запись больше недоступны.',

    'The source link could not be removed.':
        'Не удалось удалить связь с источником.',

    'Source unlinked.':
        'Связь с источником удалена.',

    'Connected to':
        'Связано с',

    // ========================================
    // Permanent deletion
    // ========================================

    'Delete permanently?':
        'Удалить безвозвратно?',

    'File permanently deleted.':
        'Файл удалён безвозвратно.',

    'Files permanently deleted.':
        'Файлы удалены безвозвратно.',

    'Delete folder permanently?':
        'Удалить папку безвозвратно?',

    'Folder permanently deleted.':
        'Папка удалена безвозвратно.',

    'Delete source permanently?':
        'Удалить источник безвозвратно?',

    'The Source record cannot be restored.':
        'Запись об источнике нельзя будет восстановить.',

    'Its connections will be removed. Linked files, Photos, People, Events, Notes, and Places will not be deleted.':
        'Её связи будут удалены. Связанные файлы, фото, люди, события, заметки и места удалены не будут.',

    'Source permanently deleted.':
        'Источник удалён безвозвратно.',

    // ========================================
    // Prototype states
    // ========================================

    'File adding will be available in the working MVP.':
        'Добавление файлов будет доступно в рабочей версии MVP.',

    'Opening this event is simulated.':
        'Открытие этого события смоделировано.',

    'Select a file or folder to view its details.':
        'Выберите файл или папку, чтобы просмотреть сведения.',

    'Collapse folder':
        'Свернуть папку',

    'Expand folder':
        'Развернуть папку'
};
const RU_UI_NOTES = {
    // ========================================
    // Notes navigation / browser
    // ========================================

    'Notes navigation':
        'Навигация по заметкам',

    'All notes':
        'Все заметки',

    'Archived notes':
        'Архивные заметки',

    'Notes browser':
        'Список заметок',

    'Capture, organize and connect research notes across your family history.':
        'Пишите исследовательские заметки о вашей семейной истории.',

    'Add note':
        'Добавить заметку',

    'Search notes':
        'Поиск заметок',

    'Search notes...':
        'Поиск заметок...',

    'Filter notes':
        'Фильтровать заметки',

    'Sort notes':
        'Сортировать заметки',

    'Active Notes filter':
        'Активный фильтр заметок',

    'Active note filters':
        'Активные фильтры заметок',

    'Narrow the current Notes view.':
        'Уточните текущий список заметок.',

    // ========================================
    // Notes tip
    // ========================================

    'Link notes to people, places, sources and files to keep your research connected.':
        'Связывайте заметки с людьми, местами, источниками и файлами, чтобы сохранять контекст исследования.',

    'Notes can link directly to people, places, events, photos, sources and files.':
        'Заметки можно напрямую связывать с людьми, местами, событиями, фотографиями, источниками и файлами.',

    // ========================================
    // Browser metadata
    // ========================================

    'No collections':
        'Без коллекций',

    'No collection assigned':
        'Коллекция не назначена',

    'No collection':
        'Без коллекции',

    'Updated date unknown':
        'Дата обновления неизвестна',

    'Updated today':
        'Обновлено сегодня',

    'Updated yesterday':
        'Обновлено вчера',

    'No note content':
        'Нет содержимого заметки',

    // ========================================
    // Filters
    // ========================================

    'Has linked records':
        'Есть связанные записи',

    'No linked records':
        'Нет связанных записей',

    'Has related notes':
        'Есть связанные заметки',

    'No related notes':
        'Нет связанных заметок',

    'In a collection':
        'В коллекции',

    // ========================================
    // Empty states
    // ========================================

    'Try a different search term or clear the search.':
        'Попробуйте другой запрос или очистите поиск.',

    'No archived notes':
        'Нет архивных заметок',

    'Archived notes will appear here.':
        'Архивные заметки будут отображаться здесь.',

    'No notes here':
        'Здесь пока нет заметок',

    'No results':
        'Нет результатов',

    'Create a note to start collecting research thoughts.':
        'Создайте заметку, чтобы начать фиксировать результаты и идеи исследования.',

    // ========================================
    // Note editor
    // ========================================

    'Collapsed note editor':
        'Свёрнутый редактор заметки',

    'Show note editor':
        'Показать редактор заметки',

    'Resize notes browser':
        'Изменить ширину списка заметок',

    'Note editor':
        'Редактор заметки',

    'Back to notes':
        'Назад к заметкам',

    'Collapse note editor':
        'Свернуть редактор заметки',

    'More note actions':
        'Другие действия с заметкой',

    'Untitled note':
        'Заметка без названия',

    'Note title':
        'Название заметки',

    'Note connections':
        'Связи заметки',

    'Note body':
        'Текст заметки',

    'Note formatting':
        'Форматирование заметки',

    'Start writing…':
        'Начните писать…',

    'Text style':
        'Стиль текста',

    'Bold':
        'Полужирный',

    'Italic':
        'Курсив',

    'Underline':
        'Подчёркивание',

    'Strikethrough':
        'Зачёркивание',

    'Text color':
        'Цвет текста',

    'Highlight color':
        'Цвет выделения',

    'Bulleted list':
        'Маркированный список',

    'Numbered list':
        'Нумерованный список',

    'Decrease indent':
        'Уменьшить отступ',

    'Increase indent':
        'Увеличить отступ',

    'Alignment':
        'Выравнивание',

    'Block quote':
        'Блочная цитата',

    'Link':
        'Ссылка',

    'Clear formatting':
        'Очистить форматирование',

    // ========================================
    // Collections inside a Note
    // ========================================

    'This note is not in a collection.':
        'Эта заметка не добавлена ни в одну коллекцию.',

    'Remove from this note':
        'Удалить из этой заметки',

    'Add to collection':
        'Добавить в коллекцию',

    'Create a collection to organize this note.':
        'Создайте коллекцию, чтобы организовать эту заметку.',

    'e.g. Pawford archive questions':
        'Например, Вопросы по архиву Поуфорда',

    'Collections keep related notes together.':
        'Коллекции помогают хранить связанные заметки вместе.',

    'Update the collection name and description. Notes inside stay in this collection.':
        'Измените название и описание коллекции. Заметки останутся в этой коллекции.',

    'The collection will be removed. Notes and their other collection memberships will remain.':
        'Коллекция будет удалена. Заметки и их принадлежность к другим коллекциям сохранятся.',

    'Collection deleted. Notes kept.':
        'Коллекция удалена. Заметки сохранены.',

    // ========================================
    // Checklist
    // ========================================

    'Checklist':
        'Контрольный список',

    'No checklist items.':
        'В контрольном списке пока нет пунктов.',

    'No items':
        'Нет пунктов',

    'Add item':
        'Добавить пункт',

    'Checklist item':
        'Пункт контрольного списка',

    'Delete checklist item':
        'Удалить пункт контрольного списка',

    // ========================================
    // Related Notes
    // ========================================

    'Related notes':
        'Связанные заметки',

    'No related notes.':
        'Связанных заметок нет.',

    'Link existing notes.':
        'Свяжите существующие заметки.',

    'Search by title, content, person, place, or source':
        'Поиск по названию или содержимому',

    'No notes available':
        'Нет доступных заметок',

    'Create a Note first, then return here to link it.':
        'Сначала создайте заметку, а затем вернитесь сюда, чтобы связать её.',

    'No notes match this search':
        'По этому запросу заметки не найдены',

    'Try another title, person, place, collection, or source.':
        'Попробуйте другое название, человека, место, коллекцию или источник.',

    'All available notes are linked':
        'Все доступные заметки уже связаны',

    'No additional Notes are available for this item.':
        'Для этого объекта нет дополнительных доступных заметок.',

    'No active notes available':
        'Нет доступных активных заметок',

    'Enable “Show archived” to review archived Notes.':
        'Включите «Показывать архивные», чтобы просмотреть архивные заметки.',

    'Selected notes':
        'Выбранные заметки',

    'Show archived':
        'Показывать архивные',

    'Suggested notes':
        'Предложенные заметки',

    'Close note picker':
        'Закрыть выбор заметок',

    // ========================================
    // Linking / unlinking Notes
    // ========================================

    'Note not found.':
        'Заметка не найдена.',

    'This note is no longer linked.':
        'Эта заметка больше не связана с записью.',

    'Linked record not found.':
        'Связанная запись не найдена.',

    'The note will not be deleted.':
        'Заметка не будет удалена.',

    'Unlink note':
        'Удалить связь с заметкой',

    'Close unlink confirmation':
        'Закрыть подтверждение удаления связи',

    'The note could not be unlinked.':
        'Не удалось удалить связь с заметкой.',

    // ========================================
    // Note-specific linked-record flows
    // ========================================

    'The note is no longer available.':
        'Эта заметка больше недоступна.',

    'The source is no longer available.':
        'Этот источник больше недоступен.',

    'Notes linked to source.':
        'Заметки связаны с источником.',

    'Place links could not be updated.':
        'Не удалось обновить связи с местами.',

    'Linked notes remain available in the Notes module.':
        'Связанные заметки остаются доступными в разделе «Заметки».',

    'People links could not be updated.':
        'Не удалось обновить связи с людьми.',

    'Linked people updated.':
        'Связанные люди обновлены.',

    'People links updated.':
        'Связи заметки с людьми обновлены.',

    'Create a place before linking it to this note.':
        'Создайте место, прежде чем связывать его с этой заметкой.',

    'All available places are already selected':
        'Все доступные места уже выбраны',

    'Choose a Person to view Events that belong to or involve them.':
        'Выберите человека, чтобы просмотреть события, которые относятся к нему или в которых он участвует.',

    'Events must be created from this Person’s profile before they can be linked to the Note.':
        'События необходимо создать в профиле этого человека, прежде чем их можно будет связать с заметкой.',

    // ========================================
    // Note information
    // ========================================

    'Note info':
        'Сведения о заметке',

    'Words':
        'Слова',

    'Characters':
        'Символы',

    // ========================================
    // Note lifecycle
    // ========================================

    'Note created.':
        'Заметка создана.',

    'Note duplicated.':
        'Копия заметки создана.',

    'Delete note?':
        'Удалить заметку?',

    'This permanently removes the note and cannot be undone.':
        'Заметка будет удалена безвозвратно. Это действие нельзя отменить.',

    'Links to this note will also be removed.':
        'Все связи с этой заметкой также будут удалены.',

    'Note deleted.':
        'Заметка удалена.',

    'Link notes to people, places, sources and files to keep your research connected.':
        'Связывайте заметки с людьми, местами, источниками и файлами, чтобы сохранять контекст исследования.',

    'Linked records':
        'Связанные записи'
};
const RU_UI_PLACES = Object.freeze({
    // ========================================
    // Navigation / page
    // ========================================

    'Places navigation':
        'Навигация по местам',

    'All places':
        'Все места',

    'Needs review':
        'Нужна проверка',

    'Countries':
        'Страны',

    'Places by country':
        'Места по странам',

    'Saved filters':
        'Сохранённые фильтры',

    'Create saved filter':
        'Создать сохранённый фильтр',

    'No saved filters':
        'Нет сохранённых фильтров',

    'Unknown country':
        'Неизвестная страна',

    'No places':
        'Нет мест',

    'Filtered places':
        'Отфильтрованные места',

    'Explore places matching this saved genealogy filter.':
        'Просматривайте места, соответствующие этому сохранённому генеалогическому фильтру.',

    'Explore places matching the active genealogy filters.':
        'Просматривайте места, соответствующие активным генеалогическим фильтрам.',

    'Map and organize the places connected to your family history.':
        'Отмечайте на карте и систематизируйте места, связанные с историей вашей семьи.',

    'Apply filters':
        'Применить фильтры',

    'Add place':
        'Добавить место',

    'Place controls':
        'Управление местами',

    'Search places':
        'Поиск мест',

    'Search places...':
        'Поиск мест...',

    'Search people':
        'Поиск людей',

    'Open place filters':
        'Открыть фильтры мест',

    'Sort places':
        'Сортировать места',

    'Recently updated':
        'Недавно обновлённые',

    'Places view mode':
        'Режим отображения мест',

    'Unlink file from place?': 'Удалить связь с файлом?',
    'Unlink note from place?': 'Удалить связь с заметкой?',

    'Map view':
        'Карта',

    // ========================================
    // Active filters
    // ========================================

    'Filters':
        'Фильтры',

    'Clear all':
        'Очистить все',

    'Save filter':
        'Сохранить фильтр',

    'Filter places':
        'Фильтровать места',

    'Refine places by people, surnames, dates, event type, country, map status, and review.':
        'Уточните список мест по людям, фамилиям, датам, типу события, стране, наличию на карте и статусу проверки.',

    'Any person':
        'Любой человек',

    'Any surname':
        'Любая фамилия',

    'Event type':
        'Тип события',

    'Any event':
        'Любое событие',

    'Year from':
        'Год с',

    'Year to':
        'Год по',

    'Any year':
        'Любой год',

    'Any country':
        'Любая страна',

    'Map status':
        'Статус на карте',

    'On map':
        'На карте',

    'Not on map':
        'Не на карте',

    'Enter a valid starting year.':
        'Введите корректный начальный год.',

    'Enter a valid ending year.':
        'Введите корректный конечный год.',

    'The starting year must not be later than the ending year.':
        'Начальный год не может быть позже конечного.',

    // ========================================
    // Saved filters
    // ========================================

    'Saved filter not found.':
        'Сохранённый фильтр не найден.',

    'Custom place filter':
        'Пользовательский фильтр мест',

    'Edit filter':
        'Редактировать фильтр',

    'Create filter':
        'Создать фильтр',

    'Update the name, description, or filter conditions.':
        'Измените название, описание или условия фильтра.',

    'Create a reusable filter for Places.':
        'Создайте сохранённый фильтр для повторного использования в разделе «Места».',

    'e.g. Whiskerfield places':
        'Например, места Вискерфильдов',

    'Choose at least one condition for this saved filter.':
        'Выберите хотя бы одно условие для этого сохранённого фильтра.',

    'Clear filters':
        'Очистить фильтры',

    'Enter a filter name.':
        'Введите название фильтра.',

    'Choose at least one filter option.':
        'Выберите хотя бы один параметр фильтра.',

    'A saved filter with this name already exists.':
        'Сохранённый фильтр с таким названием уже существует.',

    'Filter updated.':
        'Фильтр обновлён.',

    'Filter created.':
        'Фильтр создан.',

    'Add filters before saving a filter.':
        'Добавьте условия фильтра перед его сохранением.',

    'Delete filter':
        'Удалить фильтр',

    'Delete saved filter?':
        'Удалить сохранённый фильтр?',

    'Places and linked records will not be deleted.':
        'Места и связанные записи не будут удалены.',

    'Filter deleted.':
        'Фильтр удалён.',

    // ========================================
    // Places list
    // ========================================

    'No places found':
        'Места не найдены',

    'Try clearing the search or filters.':
        'Попробуйте очистить поиск или фильтры.',

    'Linked people':
        'Связанные люди',

    'No broader place recorded':
        'Вышестоящее место не указано',

    // ========================================
    // Needs review
    // ========================================

    'Coordinates need attention':
        'Координаты требуют проверки',

    'The saved coordinates are incomplete or outside the valid range.':
        'Сохранённые координаты неполные или выходят за допустимый диапазон.',

    'Fix coordinates':
        'Исправить координаты',

    'No map position':
        'Нет позиции на карте',

    'This place has no map position.':
        'Для этого места не указана позиция на карте.',

    'Add position':
        'Добавить позицию',

    'No matching review items':
        'Нет подходящих элементов для проверки',

    'Try a different search.':
        'Попробуйте другой запрос.',

    'All clear':
        'Всё в порядке',

    'No places currently need review.':
        'Сейчас нет мест, требующих проверки.',

    'New flags will appear here when a place has an obvious issue.':
        'Новые предупреждения появятся здесь, если у места будет обнаружена явная проблема.',

    'Places needing review':
        'Места, требующие проверки',

    'Issue':
        'Проблема',

    'Connected':
        'Связано',

    'Quick actions':
        'Быстрые действия',

    'Places with details that may need your attention.':
        'Места с данными, которые могут требовать вашего внимания.',

    'Search places needing review':
        'Поиск мест, требующих проверки',

    'Search review items...':
        'Поиск элементов для проверки...',

    'Open review':
        'Открыть проверку',

    'Review item dismissed.':
        'Элемент проверки скрыт.',

    // ========================================
    // Map
    // ========================================

    'Places map':
        'Карта мест',

    'Map legend':
        'Легенда карты',

    'Selected place':
        'Выбранное место',

    'Map navigation':
        'Навигация по карте',

    'Centre map on places':
        'Показать все места на карте',

    'Show map legend':
        'Показать легенду карты',

    'No point selected':
        'Точка не выбрана',

    'Use map centre':
        'Центр карты',

    'Copy':
        'Копировать',

    'Use position':
        'Использовать позицию',

    'Add place here':
        'Добавить место здесь',

    'Move selected place here':
        'Переместить выбранное место сюда',

    'Centre map here':
        'Центрировать карту здесь',

    'Draft place position':
        'Черновая позиция места',

    'Loading map tiles':
        'Загрузка карты',

    'Retrying the hosted map connection.':
        'Повторное подключение к картографическому сервису.',

    'Map tiles could not be loaded':
        'Не удалось загрузить карту',

    'Retry': 'Повторить',

    'Markers and routes remain available. Check the MapTiler key or network connection.':
        'Маркеры и маршруты остаются доступными. Проверьте ключ MapTiler или подключение к сети.',

    'Map connection restored':
        'Подключение к карте восстановлено',

    'The map is not ready yet.':
        'Карта ещё не готова.',

    'Click the map to place a new location, or use the map centre.':
        'Щёлкните по карте, чтобы указать новое место, или используйте центр карты.',

    'Coordinates copied.':
        'Координаты скопированы.',

    // ========================================
    // Routes
    // ========================================

    'Route settings':
        'Настройки маршрута',

    'Routes':
        'Маршруты',

    'Active route':
        'Активный маршрут',

    'Surname route':
        'Маршрут по фамилии',

    'Person route':
        'Маршрут человека',

    'Clear route':
        'Очистить маршрут',

    'Route needs at least two dated, mapped places.':
        'Для маршрута нужны как минимум два места с датами и координатами.',

    'Calculate route':
        'Рассчитать маршрут',

    'Choose a person or surname. Routes use dated events with mapped places.':
        'Выберите человека или фамилию. Маршруты строятся по датированным событиям в местах, отмеченных на карте.',

    'Route mode':
        'Режим маршрута',

    'Search surnames...':
        'Поиск фамилий...',

    'No matching surnames.':
        'Подходящие фамилии не найдены.',

    'No matching people.':
        'Подходящие люди не найдены.',

    'Select a surname to preview its route.':
        'Выберите фамилию, чтобы предварительно просмотреть маршрут.',

    'Select a person to preview their route.':
        'Выберите человека, чтобы предварительно просмотреть его маршрут.',

    'Route available':
        'Маршрут доступен',

    'Not enough mapped history':
        'Недостаточно данных на карте',

    'At least two dated, mapped places are needed.':
        'Нужны как минимум два места с датами и координатами.',

    'Review unmapped places':
        'Проверить места без координат',

    'Clear shown route':
        'Убрать показанный маршрут',

    'Route shown':
        'Маршрут показан',

    'Show route':
        'Показать маршрут',

    // ========================================
    // Place inspector
    // ========================================

    'Selected place inspector':
        'Панель выбранного места',

    'Expand place inspector':
        'Развернуть панель места',

    'Collapse place inspector':
        'Свернуть панель места',

    'Edit place':
        'Редактировать место',

    'No place selected':
        'Место не выбрано',

    'Select a place to view its information.':
        'Выберите место, чтобы просмотреть информацию о нём.',

    'Coordinates':
        'Координаты',

    'Edit position':
        'Изменить позицию',

    'Historical / alternative names':
        'Исторические / альтернативные названия',

    'No historical or alternative names recorded.':
        'Исторические или альтернативные названия не указаны.',

    'Connected events':
        'Связанные события',

    'Connected photos':
        'Связанные фотографии',

    'Connected files':
        'Связанные файлы',

    'Connected notes':
        'Связанные заметки',
    'Connected sources':
        'Связанные источники',
    'No dated events recorded.':
        'Датированные события не указаны.',

    'No connected events.':
        'Связанных событий нет.',

    'Other events':
        'Другие события',

    'View all events':
        'Показать все события',

    'Show less':
        'Показать меньше',

    'No connected photos.':
        'Связанных фотографий нет.',

    'View all photos':
        'Показать все фотографии',

    'No connected files.':
        'Связанных файлов нет.',

    'No connected notes.':
        'Связанных заметок нет.',

    'No sources linked to this place.': 'Связанных источников нет.',

    // ========================================
    // Place actions
    // ========================================

    'Show on map':
        'Показать на карте',

    'Copy coordinates':
        'Копировать координаты',

    'Delete place':
        'Удалить место',

    // ========================================
    // Place editor
    // ========================================

    'Names and map position are saved together only when you confirm.':
        'Название и позиция на карте сохраняются вместе только после подтверждения.',

    'Search existing places or map results, or enter a historical place name manually.':
        'Найдите существующее место или результат на карте либо введите историческое название вручную.',

    'e.g. Pawford, North Yorkshire, England':
        'Например, Поуфорд, Северный Йоркшир, Англия',

    'Place suggestions':
        'Предложения мест',

    'Map location':
        'Позиция на карте',

    'Choose on map':
        'Выбрать на карте',

    'Remove position':
        'Удалить позицию',

    'Enter one full historical or alternative place name per line.':
        'Введите по одному полному историческому или альтернативному названию места в каждой строке.',

    'Advanced coordinates':
        'Расширенные настройки координат',

    'Place details':
        'Сведения о месте',

    'Ignore':
        'Игнорировать',

    'Saved place details':
        'Сведения о сохранённом месте',

    'Position set':
        'Позиция указана',

    'No position set':
        'Позиция не указана',

    'Edit on map':
        'Изменить на карте',

    'Enter decimal degrees. Latitude must be between -90 and 90; longitude must be between -180 and 180.':
        'Введите координаты в десятичных градусах. Широта должна быть от −90 до 90, долгота — от −180 до 180.',

    'Latitude':
        'Широта',

    'Longitude':
        'Долгота',

    'Deleting this place clears its structured links but keeps connected research records.':
        'Удаление этого места очистит структурированные связи, но сохранит связанные исследовательские записи.',

    'Create place':
        'Создать место',

    // ========================================
    // Place search / suggestions
    // ========================================

    'Existing places':
        'Существующие места',

    'Existing place':
        'Существующее место',

    'Current place':
        'Текущее место',

    'Map results':
        'Результаты на карте',

    'Searching map results...':
        'Поиск результатов на карте...',

    'Map search is unavailable.':
        'Поиск по карте недоступен.',

    'No matching map results. You can still use the entered text.':
        'Подходящие результаты на карте не найдены. Вы всё равно можете использовать введённый текст.',

    'Map results will appear here.':
        'Результаты поиска по карте появятся здесь.',

    'Use entered text':
        'Использовать введённый текст',

    'Keep a historical or custom place name':
        'Сохранить историческое или пользовательское название места',

    'Map search is unavailable because no MapTiler browser key is configured.':
        'Поиск по карте недоступен, поскольку ключ MapTiler для браузера не настроен.',

    'Map search could not be completed.':
        'Не удалось выполнить поиск по карте.',

    'Map search is unavailable. You can retry or use the entered text.':
        'Поиск по карте недоступен. Попробуйте ещё раз или используйте введённый текст.',

    // ========================================
    // Validation / duplicate handling
    // ========================================

    'Enter a place name.':
        'Введите название места.',

    'Place names cannot contain line breaks or control characters.':
        'Название места не может содержать переносы строк или управляющие символы.',

    'Enter both latitude and longitude.':
        'Введите и широту, и долготу.',


    'The entered name matches this place.':
        'Введённое название совпадает с этим местом.',

    'An alternative name conflicts with this place.':
        'Альтернативное название совпадает с названием этого места.',

    'The names are very similar.':
        'Названия очень похожи.',

    'The map positions are very close.':
        'Позиции на карте находятся очень близко.',

    'Use existing place':
        'Использовать существующее место',

    'Create another place':
        'Создать другое место',

    'Map result selected. The draft name and map position were updated; review both before saving.':
        'Выбран результат на карте. Название и позиция в черновике обновлены; проверьте их перед сохранением.',

    'Map result selected. Review the draft name and map position before creating the place.':
        'Выбран результат на карте. Проверьте название и позицию в черновике перед созданием места.',

    'Existing place selected. No duplicate was created.':
        'Выбрано существующее место. Дубликат не создан.',

    'Existing place opened. The edited place was not changed.':
        'Открыто существующее место. Редактируемое место не изменено.',

    'This place is no longer available.':
        'Это место больше недоступно.',

    'Place updated.':
        'Место обновлено.',

    'Place created.':
        'Место создано.',

    // ========================================
    // Permanent delete
    // ========================================

    'Delete place permanently?':
        'Удалить место навсегда?',

    'The place will no longer appear in calculated routes.':
        'Место больше не будет использоваться в рассчитанных маршрутах.',

    'Structured links from connected records will be cleared.':
        'Структурированные связи из связанных записей будут удалены.',

    'Connected people, events, files, photos, and notes will remain.':
        'Связанные люди, события, файлы, фотографии и заметки сохранятся.',

    'Textual mentions may remain in free-text content.':
        'Текстовые упоминания могут сохраниться в полях со свободным текстом.',

    'Place deleted permanently.':
        'Место удалено навсегда.',

    'Image':
        'Изображение',

    'PDF document':
        'Документ PDF'
});
const RU_UI_PUBLISH = Object.freeze({});

const RU_TERMS_GENEALOGY = {
    // Core genealogy concepts
    'Person':
        'Человек',

    'Birth':
        'Рождение',

    'Death':
        'Смерть',

    'Marriage':
        'Брак',

    'Wedding':
        'Свадьба',

    'Civil marriage':
        'Гражданский брак',

    'Education':
        'Образование',

    'Occupation':
        'Профессия',

    'Occupation fact':
        'Сведения о профессии',

    'Baptism':
        'Крещение',

    'Burial':
        'Погребение',

    'Religion':
        'Религия',

    // Life-event vocabulary
    'Birth of son':
        'Рождение сына',

    'Birth of daughter':
        'Рождение дочери',

    'Birth of child':
        'Рождение ребёнка',

    // Identity / biographical vocabulary
    'Male':
        'Мужской',

    'Female':
        'Женский',

    'Maiden name':
        'Девичья фамилия',

    'Cause of death':
        'Причина смерти',

    'Burial place':
        'Место погребения',

    'Alternative names':
        'Альтернативные имена',

    'Custom fact':
        'Пользовательский факт',

    'Additional fact':
        'Дополнительный факт',

    // Genealogy date types
    'Exact date':
        'Точная дата',

    'Year only':
        'Только год',

    'About / Circa':
        'Около / приблизительно',

    'Before':
        'До',

    'After':
        'После',

    'Between':
        'Между',

    // Calendars
    'Gregorian':
        'Григорианский',

    'Julian':
        'Юлианский',

    // Religion values
    'Orthodox':
        'Православие',

    'Catholic':
        'Католицизм',

    'Jewish':
        'Иудаизм',

    'Muslim':
        'Ислам',

    // Education / institution taxonomy
    'School':
        'Школа',

    'University':
        'Университет',

    'College':
        'Колледж',

    'Seminary':
        'Семинария',

    'Apprenticeship':
        'Ученичество',

    'Private tutoring':
        'Частное обучение',

    'Military academy':
        'Военная академия',

    'Religious instruction':
        'Религиозное обучение',

    'Home education':
        'Домашнее обучение'
};
const RU_TERMS_RELATIONSHIPS = {
    // General relationship vocabulary
    'Relationship':
        'Отношения',

    'Relationships':
        'Близкие родственники',

    'Relative':
        'Родственник',

    'Parents':
        'Родители',

    // Immediate family
    'Father':
        'Отец',

    'Mother':
        'Мать',

    'Parent':
        'Родитель',

    'Brother':
        'Брат',

    'Sister':
        'Сестра',

    'Sibling':
        'Брат или сестра',

    'Son':
        'Сын',

    'Daughter':
        'Дочь',

    'Child':
        'Ребёнок',

    'Partner':
        'Партнёр',

    'Partners':
        'Партнёры',

    'Spouse':
        'Супруг(а)',

    'Siblings':
        'Братья и сёстры',

    'Children':
        'Дети',

    'Self':
        'Я',

    // Extended-family roles
    'Paternal grandfather':
        'Дедушка по отцовской линии',

    'Paternal grandmother':
        'Бабушка по отцовской линии',

    'Maternal grandfather':
        'Дедушка по материнской линии',

    'Maternal grandmother':
        'Бабушка по материнской линии',

    'Great-grandfather':
        'Прадедушка',

    'Great-grandmother':
        'Прабабушка',

    'Grandfather':
        'Дедушка',

    'Grandmother':
        'Бабушка',

    'Grandparent':
        'Дедушка или бабушка',

    'Paternal grandparent':
        'Дедушка или бабушка по отцовской линии',

    'Maternal grandparent':
        'Дедушка или бабушка по материнской линии',

    'Great-grandparent':
        'Прадедушка или прабабушка',

    'Grandson':
        'Внук',

    'Granddaughter':
        'Внучка',

    'Grandchild':
        'Внук или внучка',

    'Great-grandson':
        'Правнук',

    'Great-granddaughter':
        'Правнучка',

    'Great-grandchild':
        'Правнук или правнучка',

    'Uncle':
        'Дядя',

    'Aunt':
        'Тётя',

    'Parent\'s sibling':
        'Брат или сестра родителя',

    'Nephew':
        'Племянник',

    'Niece':
        'Племянница',

    'Sibling\'s child':
        'Ребёнок брата или сестры',

    'First cousin':
        'Двоюродный брат или сестра',

    'Father-in-law':
        'Тесть или свёкор',

    'Mother-in-law':
        'Тёща или свекровь',

    'Parent-in-law':
        'Родитель супруга или супруги',

    'Grandfather-in-law':
        'Дедушка супруга или супруги',

    'Grandmother-in-law':
        'Бабушка супруга или супруги',

    'Grandparent-in-law':
        'Дедушка или бабушка супруга или супруги',

    'Great-grandfather-in-law':
        'Прадедушка супруга или супруги',

    'Great-grandmother-in-law':
        'Прабабушка супруга или супруги',

    'Great-grandparent-in-law':
        'Прадедушка или прабабушка супруга или супруги',

    'Son-in-law':
        'Зять',

    'Daughter-in-law':
        'Невестка',

    'Child-in-law':
        'Супруг или супруга ребёнка',

    'Brother-in-law':
        'Брат супруга или супруги',

    'Sister-in-law':
        'Сестра супруга или супруги',

    'Sibling-in-law':
        'Брат или сестра супруга или супруги',

    'Stepfather':
        'Отчим',

    'Stepmother':
        'Мачеха',

    'Stepparent':
        'Неродной родитель',

    'Stepson':
        'Пасынок',

    'Stepdaughter':
        'Падчерица',

    'Stepchild':
        'Неродной ребёнок',

    'Distant ancestor':
        'Дальний предок',

    'Distant descendant':
        'Дальний потомок',

    // Parentage types
    'Biological':
        'Биологическая',

    'Adoptive':
        'Приёмная',

    'Step':
        'Неродная',

    'Foster':
        'Патронатная',

    'Guardian':
        'Опекунская',

    // Partner relationship types
    'Married':
        'В браке',

    'Unmarried partner':
        'Партнёр без брака',

    'Former partner':
        'Бывший партнёр',

    'Separated':
        'Раздельно проживают',

    'Divorced':
        'Разведены',

    'Annulled':
        'Брак аннулирован',

    'Engaged':
        'Помолвлены',

    'Unknown relationship':
        'Неизвестный тип отношений',

    'Single parent':
        'Один родитель',

    // Relationship events
    'Partnership':
        'Партнёрство',

    'Partnership began':
        'Начало партнёрства',

    'Partnership ended':
        'Окончание партнёрства',

    'Separation':
        'Раздельное проживание',

    'Divorce':
        'Развод',

    'Annulment':
        'Аннулирование брака',

    'Engagement':
        'Помолвка',

    'Relationship began':
        'Начало отношений',

    // Marriage types
    'Civil':
        'Гражданский',

    'Religious':
        'Религиозный',

    'Common law':
        'Фактический',

    'Customary':
        'По обычаю',

    'Tribal custom':
        'По племенному обычаю'
};
const RU_TERMS_STATUSES = {
    // General / living status
    'Unknown':
        'Неизвестно',

    'Living':
        'Жив(а)',

    'Deceased':
        'Умер(ла)',

    // Source status
    'Fully sourced':
        'Полностью подтверждено источниками',

    'Partly sourced':
        'Частично подтверждено источниками',

    'Unsourced':
        'Без источников',

    'Needs source':
        'Требуется источник',

    // Review status
    'No issues':
        'Нет проблем',

    'Possible duplicate':
        'Возможный дубликат',

    'Missing facts':
        'Недостающие сведения',

    'Missing source':
        'Нет источника',

    'Historic records':
        'Исторические записи',

    'Check birth details':
        'Проверить сведения о рождении',

    'Missing death details':
        'Не хватает сведений о смерти',

    'Check death place':
        'Проверить место смерти',

    'New record':
        'Новая запись'
};

const RU_DATA_NAMES_FIRST = {
    'Silver': 'Сильвер',
    'Luna': 'Луна',
    'Oliver': 'Оливер',
    'Mochi': 'Мочи',
    'Cleo': 'Клео',

    'Barnaby': 'Барнаби',
    'Daisy': 'Дейзи',
    'Rupert': 'Руперт',
    'Mabel': 'Мейбл',

    'Archibald': 'Арчибальд',
    'Edith': 'Эдит',
    'Percival': 'Персиваль',
    'Nora': 'Нора',
    'Algernon': 'Алджернон',
    'Beatrice': 'Беатрис',
    'Felix': 'Феликс',
    'Pearl': 'Пёрл',

    'Solomon': 'Соломон',
    'Opal': 'Опал',
    'Horatio': 'Горацио',
    'Clementine': 'Клементина',
    'Augustus': 'Августус',
    'Tobias': 'Тобиас',
    'Marigold': 'Мэриголд',

    // Geneograph-local seeded people
    'Iris': 'Ирис',
    'Theo': 'Тео'
};
const RU_DATA_NAMES_MIDDLE = Object.freeze({});
const RU_DATA_NAMES_SURNAMES = {
    'Whiskerfield': 'Вискерфильд',
    'Purrington': 'Пуррингтон',
    'Milkpaw': 'Милкпоу',
    'Softtail': 'Софттейл',
    'Mackerelton': 'Макрельтон',
    'Creamfur': 'Кримфюр',
    'Threadtail': 'Тредтейл',
    'Velvetpaw': 'Велветпоу',
    'Silktail': 'Силктейл',
    'Butterpaws': 'Баттерпоуз'
};
const RU_DATA_PLACES = {
    // Canonical place records
    'Pawford, North Yorkshire, England':
        'Поуфорд, Северный Йоркшир, Англия',

    'Meowbridge, North Yorkshire, England':
        'Мяубридж, Северный Йоркшир, Англия',

    'Fishmarket Row, North Yorkshire, England':
        'Фишмаркет-Роу, Северный Йоркшир, Англия',

    'Old Cattery, North Yorkshire, England':
        'Олд-Кэттери, Северный Йоркшир, Англия',

    'Unidentified village near Pawford, North Yorkshire, England':
        'Неизвестная деревня близ Поуфорда, Северный Йоркшир, Англия',

    'Whiskerfield family garden, Pawford, North Yorkshire, England':
        'Семейный сад Вискерфильдов, Поуфорд, Северный Йоркшир, Англия',

    'Meowbridge School, North Yorkshire, England':
        'Школа Мяубриджа, Северный Йоркшир, Англия',

    'Pawford County Archive, North Yorkshire, England':
        'Архив округа Поуфорд, Северный Йоркшир, Англия',

    'Whiskerfield residence near Pawford, North Yorkshire, England':
        'Дом Вискерфильдов близ Поуфорда, Северный Йоркшир, Англия',

    'Pawford Cemetery, North Yorkshire, England':
        'Кладбище Поуфорда, Северный Йоркшир, Англия',

    // Alternative names
    'Pawford town':
        'город Поуфорд',

    'Meow Bridge':
        'Мяу-Бридж',

    'Fish Market Row':
        'Фиш-Маркет-Роу',

    'The Old Cattery':
        'Старая Кошатня',

    'Village near Pawford':
        'Деревня близ Поуфорда',

    'Pawford family garden':
        'Семейный сад в Поуфорде',

    'Meowbridge school':
        'Школа Мяубриджа',

    'Pawford archive':
        'Архив Поуфорда',

    'Whiskerfield family house':
        'Семейный дом Вискерфильдов',

    'Pawford burial ground':
        'Место захоронения в Поуфорде',

    'Duplicate Pawford record':
        'Дублирующая запись Поуфорда',

    // Short place/display values
    'Pawford':
        'Поуфорд',

    'Meowbridge':
        'Мяубридж',

    'Fishmarket Row':
        'Фишмаркет-Роу',

    'Old Cattery':
        'Олд-Кэттери',

    'Pawford garden':
        'Сад в Поуфорде',

    'North quay studio':
        'Студия на Северной набережной',

    'Pawford tutoring circle':
        'Учебный кружок Поуфорда',

    'England':
        'Англия',

    'North Yorkshire, England':
        'Северный Йоркшир, Англия',

    'Meowbridge School':
        'Школа Мяубриджа',

    'Pawford Cemetery':
        'Кладбище Поуфорда',

    'Pawford County Archive':
        'Архив округа Поуфорд',

    'Unidentified village near Pawford':
        'Неизвестная деревня близ Поуфорда',

    'Whiskerfield family garden':
        'Семейный сад Вискерфильдов',

    'Whiskerfield residence near Pawford':
        'Дом Вискерфильдов близ Поуфорда',

    'Places connected to members of the Whiskerfield family.':
        'Места, связанные с членами семьи Вискерфильдов.',

    'Places connected to Silver Whiskerfield.':
        'Места, связанные с Сильвером Вискерфильдом.',

    'Places linked to events before 1900.':
        'Места, связанные с событиями до 1900 года.',

    'Places that do not yet have coordinates.':
        'Места, для которых ещё не указаны координаты.'
};

const RU_DATA_SOURCES =
    Object.freeze({
        // ========================================
        // Source as1
        // ========================================

        'Pawford County Archive — parish and household registers':
          'Архив округа Поуфорд — приходские и домовые книги',

        'Register collection 12 / household series 3':
          'Коллекция реестров 12 / серия домовых книг 3',

        'County archive material used for Pawford household and parish research.':
          'Материалы окружного архива, использованные для изучения домохозяйств и прихода Поуфорда.',

        // ========================================
        // Source as2
        // ========================================

        'Pawford household register continuation, 1947–1952':
          'Продолжение домовой книги Поуфорда, 1947–1952',

        'Household series 3, continuation volume':
          'Серия домовых книг 3, том-продолжение',

        'Continuation volume for Pawford household entries after 1946.':
          'Том-продолжение с записями о домохозяйствах Поуфорда после 1946 года.',

        // ========================================
        // Source as3
        // ========================================

        'Meowbridge marriage certificate held in family documents':
          'Свидетельство о браке в Мяубридже из семейных документов',

        'Whiskerfield family documents':
          'Семейные документы Вискерфильдов',

        'Certificate folder, item 2':
          'Папка со свидетельствами, документ 2',

        'Original certificate scan retained by the family.':
          'Скан оригинала свидетельства хранится в семье.',

        // ========================================
        // Source as4
        // ========================================

        'Interview with Luna Purrington, 2 April 2026':
          'Интервью с Луной Пуррингтон, 2 апреля 2026 года',

        'Online interview':
          'Онлайн-интервью',

        'Audio interview 2026-04-02':
          'Аудиоинтервью от 02.04.2026',

        'Recorded family-history interview covering stories from 1940 to 1990.':
          'Записанное интервью по семейной истории с рассказами о периоде с 1940 по 1990 год.',

        // ========================================
        // Source as5
        // ========================================

        'Whiskerfield family reference collection':
          'Справочная коллекция семьи Вискерфильдов',

        'Reference box A':
          'Коробка со справочными материалами A',

        'Mixed family reference material, clippings, and album documentation.':
          'Смешанная коллекция семейных справочных материалов, вырезок и описаний альбомов.',

        // ========================================
        // Source as6
        // ========================================

        'Regional genealogy database — Pawford records':
          'Региональная генеалогическая база данных — записи Поуфорда',

        'Regional genealogy database':
          'Региональная генеалогическая база данных',

        'Pawford record collection, 1900–1950':
          'Коллекция записей Поуфорда, 1900–1950',

        'Online index and document extracts for the Pawford area.':
          'Онлайн-указатель и выписки из документов по району Поуфорда.'
    });
const RU_DATA_PHOTOS = {
    // Titles
    'Silver portrait':
        'Портрет Сильвера',

    'Family table':
        'Семейный стол',

    'Barnaby portrait':
        'Портрет Барнаби',

    'Luna portrait':
        'Портрет Луны',

    'Grandparents in the garden':
        'Бабушка и дедушка в саду',

    'Daisy school portrait':
        'Школьный портрет Дейзи',

    'Silver and Luna':
        'Сильвер и Луна',

    'Purrington family visit':
        'Визит семьи Пуррингтон',

    'Oliver portrait':
        'Портрет Оливера',

    'Pearl portrait':
        'Портрет Пёрл',

    'Young Whiskerfield family':
        'Молодая семья Вискерфильдов',

    'Unidentified studio portrait':
        'Неопознанный студийный портрет',

    'Archive storage':
        'Хранилище архива',

    'Archibald at the workshop':
        'Арчибальд у мастерской',

    // Captions
    'Portrait of Silver Whiskerfield.':
        'Портрет Сильвера Вискерфильда.',

    'Family table after a celebration.':
        'Семейный стол после праздника.',

    'Barnaby Whiskerfield in Pawford.':
        'Барнаби Вискерфильд в Поуфорде.',

    'Portrait of Luna Purrington.':
        'Портрет Луны Пуррингтон.',

    'Barnaby and Daisy in the family garden.':
        'Барнаби и Дейзи в семейном саду.',

    'Early portrait of Daisy Milkpaw.':
        'Ранний портрет Дейзи Милкпоу.',

    'Silver and Luna at their wedding celebration.':
        'Сильвер и Луна на свадебном торжестве.',

    'A Purrington family visit.':
        'Визит семьи Пуррингтон.',

    'Oliver Whiskerfield portrait.':
        'Портрет Оливера Вискерфильда.',

    'Portrait identified as Pearl Velvetpaw.':
        'Портрет, опознанный как Пёрл Велветпоу.',

    'The young Whiskerfield household.':
        'Молодая семья Вискерфильдов.',

    'Unidentified portrait awaiting research.':
        'Неопознанный портрет, ожидающий исследования.',

    'View of the Pawford archive storage.':
        'Вид в хранилище архива Поуфорда.',

    'Archibald Whiskerfield at his workshop.':
        'Арчибальд Вискерфильд у мастерской.',

    // Origin labels
    'Family upload':
        'Семейная загрузка',

    'Personal album scan':
        'Скан из личного альбома',

    'Family album scan':
        'Скан из семейного альбома',

    'Luna upload':
        'Загрузка Луны',

    'Inherited print':
        'Унаследованный отпечаток',

    'Rupert collection':
        'Коллекция Руперта',

    'Old Cattery collection':
        'Коллекция Олд-Кэттери',

    'Household upload':
        'Семейная загрузка',

    'Unsorted envelope':
        'Неразобранный конверт',

    'Pawford archive copy':
        'Копия из архива Поуфорда'
};
const RU_DATA_NOTES = {
    // Daisy parentage research
    'Who was Daisy Milkpaw’s father?':
        'Кто был отцом Дейзи Милкпоу?',

    'Research question':
        'Исследовательский вопрос',

    'Current observations':
        'Текущие наблюдения',

    'Daisy’s records place her in the Pawford area, where the Whiskerfield household appears in the available register material.':
        'Записи о Дейзи связывают её с районом Поуфорда, где в доступных реестровых материалах встречается домохозяйство Вискерфильдов.',

    'Barnaby Whiskerfield is a plausible lead, but no direct parentage statement has been found.':
        'Барнаби Вискерфильд — правдоподобная версия, но прямых сведений о родстве пока не найдено.',

    'Next steps':
        'Следующие шаги',

    'Review the father entry in the Pawford register.':
        'Проверить запись об отце в реестре Поуфорда.',

    'Compare household members and witnesses.':
        'Сопоставить членов домохозяйства и свидетелей.',

    'Record evidence both for and against the Whiskerfield connection.':
        'Зафиксировать доказательства как в пользу связи с Вискерфильдами, так и против неё.',

    'Check the Pawford register father entry':
        'Проверить запись об отце в реестре Поуфорда',

    'Compare Daisy and Whiskerfield household records':
        'Сопоставить записи о Дейзи и домохозяйстве Вискерфильдов',

    'Review additional evidence before changing relationships':
        'Проверить дополнительные доказательства перед изменением родственных связей',

    // Old Cattery burial research
    'Old Cattery burial index observations':
        'Наблюдения по указателю захоронений Олд-Кэттери',

    'The burial index contains several entries connected to the Old Cattery area.':
        'В указателе захоронений есть несколько записей, связанных с районом Олд-Кэттери.',

    'Pearl Velvetpaw’s entry is clear, but nearby entries should be checked for relatives and alternate surname spellings.':
        'Запись Пёрл Велветпоу читается ясно, но соседние записи следует проверить на родственников и варианты написания фамилий.',

    'Daisy’s connection remains indirect and should not be treated as evidence of residence without another record.':
        'Связь Дейзи остаётся косвенной и без дополнительной записи не должна считаться доказательством проживания.',

    'The index should be compared with cemetery and household records before adding new facts.':
        'Перед добавлением новых фактов указатель следует сопоставить с кладбищенскими и домовыми записями.',

    // Meowbridge transcription
    'Meowbridge record transcription':
        'Расшифровка записи из Мяубриджа',

    'Meowbridge record held with the family certificate material.':
        'Запись из Мяубриджа хранится вместе с семейными свидетельствами.',

    'Extract or transcription':
        'Выписка или расшифровка',

    'The record names Meowbridge and confirms the event location. Several handwritten details remain uncertain.':
        'В записи указан Мяубридж и подтверждено место события. Некоторые рукописные детали остаются неясными.',

    'Interpretation':
        'Интерпретация',

    'The place is consistent with other records connected to Daisy and the later Whiskerfield family.':
        'Это место согласуется с другими записями, связанными с Дейзи и более поздней семьёй Вискерфильдов.',

    'Questions':
        'Вопросы',

    'Confirm the witnesses and compare their names with household records.':
        'Подтвердить личности свидетелей и сопоставить их имена с домовыми записями.',

    // Pawford household register
    'Pawford household register notes':
        'Заметки по домовой ведомости Поуфорда',

    'The Pawford household material contains several Whiskerfield entries that may help reconstruct the family group.':
        'Материалы домохозяйств Поуфорда содержат несколько записей об Вискерфильдах, которые могут помочь восстановить состав семьи.',

    'Barnaby appears in the correct district and age range to merit further research.':
        'Барнаби встречается в подходящем районе и возрастном диапазоне, поэтому запись стоит исследовать дальше.',

    'The current scan does not establish Daisy’s relationship to the household.':
        'Текущий скан не подтверждает связь Дейзи с этим домохозяйством.',

    'Names, occupations, addresses, and witnesses should be transcribed before drawing conclusions.':
        'Перед выводами следует расшифровать имена, занятия, адреса и сведения о свидетелях.',

    'Transcribe every household member':
        'Расшифровать данные каждого члена домохозяйства',

    'Compare the recorded address with nearby events':
        'Сопоставить указанный адрес с ближайшими событиями',

    'Check the register continuation':
        'Проверить продолжение реестра',

    // Family album research
    'Whiskerfield family album context':
        'Контекст семейного альбома Вискерфильдов',

    'The family album appears to combine photographs from several Whiskerfield households.':
        'Похоже, семейный альбом объединяет фотографии нескольких семей Вискерфильдов.',

    'Silver and Luna can identify some recent photographs. Barnaby and Daisy may appear in older images, but the captions are incomplete.':
        'Сильвер и Луна могут опознать некоторые недавние фотографии. Барнаби и Дейзи, возможно, присутствуют на более старых снимках, но подписи к ним неполные.',

    'Album order, handwriting, paper type, and repeated backgrounds may help group unidentified portraits.':
        'Порядок снимков в альбоме, почерк, тип бумаги и повторяющиеся фоны могут помочь сгруппировать неопознанные портреты.',

    // Whiskerfield surname research
    'Whiskerfield surname variants':
        'Варианты фамилии Вискерфильд',

    'Searches should include likely handwriting and transcription variants of Whiskerfield.':
        'При поиске следует учитывать вероятные рукописные и транскрипционные варианты фамилии Вискерфильд.',

    'Potential differences include omitted letters, altered vowel groups, and spacing introduced by indexers.':
        'Возможны пропуски букв, изменения групп гласных и пробелы, внесённые индексаторами.',

    'Every variant should be recorded with its source rather than added as a confirmed family name automatically.':
        'Каждый вариант следует фиксировать вместе с источником, а не автоматически добавлять как подтверждённую фамилию семьи.',

    // Rupert death research
    'Rupert death details to verify':
        'Сведения о смерти Руперта для проверки',

    'Rupert Purrington’s death details are incomplete in the current family record.':
        'Сведения о смерти Руперта Пуррингтона в текущей семейной записи неполны.',

    'The available online extract may contain a matching entry, but identity has not been confirmed.':
        'Доступная онлайн-выписка может содержать подходящую запись, но личность пока не подтверждена.',

    'Check age, residence, relatives, and registration district before entering a death date.':
        'Перед внесением даты смерти проверить возраст, место жительства, родственников и регистрационный округ.',

    'Check the regional death index':
        'Проверить региональный указатель смертей',

    'Compare residence and family details':
        'Сопоставить место жительства и сведения о семье',

    // Purrington surname research
    'Purrington surname variants':
        'Варианты фамилии Пуррингтон',

    'Purrington entries may be indexed with shortened or misread letter groups.':
        'Записи Пуррингтонов могут быть проиндексированы с сокращёнными или неверно прочитанными группами букв.',

    'Search plans should include common handwriting substitutions while keeping the recorded spelling attached to each source.':
        'В план поиска следует включить типичные рукописные замены, сохраняя за каждым источником указанное в нём написание.',

    'No variant should replace the central surname without supporting evidence.':
        'Ни один вариант не должен заменять основную фамилию без подтверждающих доказательств.',

    // Marriage research
    'Silver and Luna marriage record notes':
        'Заметки о записи брака Сильвера и Луны',

    'The marriage record links Silver Whiskerfield and Luna Purrington in Meowbridge.':
        'Запись о браке связывает Сильвера Вискерфильда и Луну Пуррингтон в Мяубридже.',

    'The names and place are legible. Witness names and the exact certificate reference should be transcribed separately.':
        'Имена и место читаются ясно. Имена свидетелей и точную ссылку на свидетельство следует расшифровать отдельно.',

    'The event should remain linked to the original certificate source and scan.':
        'Событие должно оставаться связанным с источником оригинального свидетельства и его сканом.',

    // Silver checklist
    'Silver profile research checklist':
        'Контрольный список исследования профиля Сильвера',

    'Add residence sources':
        'Добавить источники о месте жительства',

    'Review context for linked photographs':
        'Проверить контекст связанных фотографий',

    'Verify event dates and places':
        'Проверить даты и места событий',

    // Luna interview
    'Family interview with Luna':
        'Семейное интервью с Луной',

    'Interview focus':
        'Тема интервью',

    'Family movement, the Whiskerfield album, and memories connected to Meowbridge.':
        'Перемещения семьи, альбом Вискерфильдов и воспоминания, связанные с Мяубриджем.',

    'Current recollections':
        'Текущие воспоминания',

    'Luna remembers family stories about movement between nearby villages and Pawford.':
        'Луна помнит семейные рассказы о переездах между соседними деревнями и Поуфордом.',

    'She may be able to identify the owner of the old family album.':
        'Возможно, она сможет установить, кому принадлежал старый семейный альбом.',

    'Follow-up questions':
        'Дополнительные вопросы',

    'Who originally kept the album?':
        'У кого первоначально хранился альбом?',

    'Which relatives lived in Meowbridge?':
        'Кто из родственников жил в Мяубридже?',

    'Did Daisy discuss siblings or parentage?':
        'Рассказывала ли Дейзи о братьях, сёстрах или родителях?',

    'Schedule a follow-up conversation':
        'Запланировать дополнительную беседу',

    'Prepare unidentified album photographs':
        'Подготовить неопознанные фотографии из альбома',

    // Pawford archive visit
    'Pawford archive visit checklist':
        'Контрольный список посещения архива Поуфорда',

    'Prepare a focused archive visit for Pawford household and register material.':
        'Подготовить целевой визит в архив для работы с домовыми и реестровыми материалами Поуфорда.',

    'Capture complete references and adjacent pages rather than isolated entries.':
        'Фиксировать полные ссылки и соседние страницы, а не отдельные записи.',

    'Record negative searches as well as useful findings.':
        'Фиксировать как безрезультатные поиски, так и полезные находки.',

    'Review the register continuation':
        'Просмотреть продолжение реестра',

    'Capture surrounding household pages':
        'Зафиксировать соседние страницы домовой книги',

    'Search surname spelling variants':
        'Проверить варианты написания фамилии',

    'Record image and folder references':
        'Зафиксировать ссылки на изображения и папки'
};
const RU_DATA_NOTE_COLLECTIONS = {
    'Pawford research':
        'Исследование Поуфорда',

    'Records, places, and open questions connected to Pawford.':
        'Записи, места и открытые вопросы, связанные с Поуфордом.',

    'Whiskerfield family':
        'Семья Вискерфильдов',

    'Family history, surname research, and household context.':
        'История семьи, исследование фамилии и сведения о домохозяйстве.',

    'Source analysis':
        'Анализ источников',

    'Transcriptions, extracts, and interpretation of research sources.':
        'Расшифровки, выписки и интерпретация исследовательских источников.',

    'Family interviews':
        'Семейные интервью',

    'Interview preparation, recollections, and follow-up questions.':
        'Подготовка к интервью, воспоминания и дополнительные вопросы.'
};
const RU_DATA_GENEO = {
    // Collections
    'Research theory':
        'Исследовательские гипотезы',

    'Boards for hypotheses, theories and unresolved research questions.':
        'Холст для гипотез, теорий и нерешённых исследовательских вопросов.',

    'Tree design':
        'Проектирование древа',

    'Visual family-tree layouts and structural explorations.':
        'Визуальные схемы семейного древа и исследование его структуры.',

    'Evidence map':
        'Карта доказательств',

    'Boards connecting sources, evidence and research conclusions.':
        'Холсты, связывающие источники, доказательства и исследовательские выводы.',

    'DNA':
        'ДНК',

    'DNA research, matches and relationship hypotheses.':
        'Исследования ДНК, совпадения и гипотезы о родственных связях.',

    'Publication':
        'Публикация',

    'Layouts and visual material prepared for publication.':
        'Макеты и визуальные материалы, подготовленные для публикации.',

    // Seeded board
    'Whiskerfield family diagram':
        'Схема семьи Вискерфильд',

    'A genealogy-first visual diagram showing family relationships, research media and working annotations.':
        'Генеалогическая визуальная схема, показывающая родственные связи, исследовательские материалы и рабочие заметки.',

    // Seeded board objects
    'Whiskerfield household':
        'Семья Вискерфильд',

    'Compare the household register with the family album before exporting this branch.':
        'Сравнить домовую ведомость с семейным альбомом перед экспортом этой ветви.',

    'Possible Purrington branch':
        'Возможная ветвь Пуррингтон',

    'Whiskerfield branch board':
        'Холст ветви Вискерфильдов',

    'Working board for branch evidence and open questions.':
        'Рабочий холст для доказательств по ветви и открытых вопросов.'
};

function buildLocalizationMap(
    mapName,
    blocks
)
{
    const result = {};
    const owners = {};

    Object.entries(
        blocks
    ).forEach(
        ([
            blockName,
            block
        ]) =>
        {
            if (
                !block
            || typeof block !== 'object'
            || Array.isArray(block)
            )
            {
                throw new TypeError(
                    `Localization block "${blockName}" in ${mapName} must be an object.`
                );
            }

            Object.entries(
                block
            ).forEach(
                ([
                    key,
                    value
                ]) =>
                {
                    const normalizedKey =
                        String(key).trim();

                    if (!normalizedKey)
                    {
                        throw new Error(
                            `Empty localization key in ${mapName}.${blockName}.`
                        );
                    }

                    if (
                        typeof value !== 'string'
                || !value.trim()
                    )
                    {
                        throw new Error(
                            `Localization value for "${normalizedKey}" in ${mapName}.${blockName} must be a non-empty string.`
                        );
                    }

                    if (
                        Object.prototype
                            .hasOwnProperty.call(
                                result,
                                normalizedKey
                            )
                    )
                    {
                        throw new Error(
                            `Duplicate localization key "${normalizedKey}" in ${mapName}: ${owners[normalizedKey]} and ${blockName}.`
                        );
                    }

                    result[normalizedKey] =
                        value;

                    owners[normalizedKey] =
                        blockName;
                }
            );
        }
    );

    return Object.freeze(
        result
    );
}

const RU_UI_COMPLETION = {
    'Primary photo updated.': 'Основная фотография обновлена.',
    'The photo is no longer available.': 'Эта фотография больше недоступна.',
    'This person is not linked to a People profile.': 'Этот человек не связан с профилем в разделе «Люди».',
    'No coordinates recorded': 'Координаты не указаны',
    'Other places': 'Другие места',
    // Advanced genealogy date editor
    'Date details':
        'Сведения о дате',

    'Genealogy date details':
        'Сведения о генеалогической дате',

    'Close date details':
        'Закрыть сведения о дате',

    'Smart date':
        'Дата в свободной форме',

    'Date type':
        'Тип даты',

    'Calendar':
        'Календарь',

    'Day':
        'День',

    'Year':
        'Год',

    'Second day':
        'День окончания',

    'Second month':
        'Месяц окончания',

    'Second year':
        'Год окончания',

    'From':
        'С',

    'To':
        'По',

    'Apply':
        'Применить',

    'DD':
        'ДД',

    'YYYY':
        'ГГГГ',

    'Julian calendar can be stored; conversion is not implemented in this prototype.':
        'Можно сохранить дату по юлианскому календарю; преобразование календарей в этом прототипе не реализовано.',

    'Julian calendar stored; conversion is not implemented.':
        'Дата сохранена по юлианскому календарю; преобразование календарей не реализовано.',

    'about / circa':
        'около / приблизительно',

    'Enter a valid calendar date.':
        'Введите допустимую календарную дату.',

    'Enter a supported genealogy date.':
        'Введите дату в поддерживаемом генеалогическом формате.',

    'Exact dates need at least a month and year. Use Year only for year-only dates.':
        'Для точной даты укажите как минимум месяц и год. Если известен только год, выберите тип «Только год».',

    'Year only dates should contain only a year.':
        'Дата типа «Только год» должна содержать только год.',

    'Between dates need a valid second date.':
        'Для диапазона укажите допустимую вторую дату.',

    'The second date must be after or equal to the first date.':
        'Вторая дата должна быть не раньше первой.',

    'Enter a date.':
        'Введите дату.',
    'Create new place': 'Создать новое место',
    'Link is missing an ID': 'У связи отсутствует идентификатор',
    'Show person sidebar': 'Показать панель человека',
    'Person record not found.': 'Запись человека не найдена.',
    'Connect existing Archive files or add new files.': 'Установите связь с существующими файлами Архива или добавьте новые.',
    'Selected and uploaded photos will be tagged with this person.':
        'Выбранные и загруженные фотографии будут связаны с этим человеком.',
    'Add new':
        'Добавить новые',
    'Browse all project photos' : 'Все фото',
    'Upload new photo': 'Загрузить фото',
    'Add new files to Archive, then connect them to this record. File upload is simulated in this prototype.':
        'Добавьте новые файлы в Архив, затем свяжите их с этой записью. Загрузка файлов имитируется в прототипе.',
    'Tagged with this person': 'Связанные с этим человеком',
    'No photos are tagged with': 'Нет фотографий связанных с',
    'Remove current photo': 'Убрать текущее фото',
    'Not tagged': 'Не связано',
    'Current photo': 'Текущее фото',
    'Already selected':
        'Уже выбрано',
    'No archive files linked to this person.': 'С этим человеком не связано ни одного файла Архива.',
    'No notes linked to this person.': 'С этим человеком не связано ни одной заметки.',
    'No photos linked to this person.':'С этим человеком не связано ни одной фотографии',
    'Already linked': 'Уже связано',
    'The person is no longer available.': 'Этот человек больше недоступен.',
    'Archive item preview is simulated.': 'Предпросмотр элемента Архива имитируется в прототипе.',
    'Selected person sidebar collapsed': 'Панель выбранного человека свёрнута',
    'Unknown person': 'Неизвестный человек',
    'Cannot connect': 'Невозможно связать',
    'This relationship cannot be created.': 'Эту родственную связь невозможно создать.',
    'Suggested matches': 'Предлагаемые совпадения',
    'Could not connect these people.': 'Не удалось связать этих людей.',
    'Relationship date': 'Дата связи',
    'Relationship place': 'Место связи',
    'From place': 'Место начала',
    'To place': 'Место окончания',
    'Engagement date': 'Дата помолвки',
    'Engagement place': 'Место помолвки',
    'Selected person': 'Выбранный человек',
    'Check the relationship dates before saving.': 'Проверьте даты родственной связи перед сохранением.',
    'The relationship end date must be after or equal to the start date.': 'Дата окончания связи должна быть не раньше даты начала.',
    'Missing person': 'Человек не найден',
    'Select a person to connect.': 'Выберите человека для связи.',
    'Person not found': 'Человек не найден',
    'Invalid relationship': 'Недопустимая связь',
    'A person cannot be connected to themselves.': 'Нельзя связать человека с самим собой.',
    'Already connected': 'Уже связано',
    'Relationship loop': 'Циклическая родственная связь',
    'Add a name or at least one identifying fact before creating a person.': 'Перед созданием человека укажите имя или хотя бы один идентифицирующий факт.',
    'Check the additional facts before creating.': 'Проверьте дополнительные факты перед созданием.',
    'Check the relationship details before creating.': 'Проверьте сведения о связи перед созданием.',
    'Person created, but could not connect the relationship.': 'Человек создан, но родственную связь добавить не удалось.',
    'Person created.': 'Человек создан.',
    'Create a new person in this project': 'Создать нового человека в этом проекте',
    'Connect selected': 'Связать выбранного',
    'Add selected': 'Добавить выбранного',
    'Open selected': 'Открыть выбранного',
    'Possible matches': 'Возможные совпадения',
    'Similar people in Family Tree': 'Похожие люди в семейном древе',
    'Enter a name, date, or place to check the Family Tree.': 'Введите имя, дату или место, чтобы проверить семейное древо.',
    'No strong matches found in the Family Tree.': 'В семейном древе не найдено достаточно близких совпадений.',
    'New person': 'Новый человек',
    'File picker will be added in a later step.': 'Выбор файла будет добавлен позже.',
    'Note picker will be added in a later step.': 'Выбор заметки будет добавлен позже.',
    'Attachment picker will be added in a later step.': 'Выбор вложения будет добавлен позже.',
    'Remove relationship?':
        'Удалить родственную связь?',
    'This changes the relationship only. People records will remain in the project.':
        'Изменится только родственная связь. Записи людей останутся в проекте.',
    'Unlink relationship':
        'Удалить связь',
    'Children connected through this relationship':
        'Дети, связанные через эту родственную связь',
    'Choose which parent should keep the children after unlinking.':
        'Выберите родителя, с которым останутся дети после удаления связи.',
    'Relationship information is missing.': 'Сведения о родственной связи отсутствуют.',
    'Relationship record not found.': 'Запись родственной связи не найдена.',
    'This parent-child relationship has already been removed.': 'Эта связь родителя и ребёнка уже удалена.',
    'Relationship unlinked.': 'Родственная связь удалена.',
    'Choose which parent should keep the children.': 'Выберите родителя, с которым останутся дети.',
    'Sibling relationships come from shared parents. Remove or edit parent-child links instead.': 'Связи братьев и сестёр определяются общими родителями. Измените или удалите связь родителя и ребёнка.',
    'Unsupported relationship type.': 'Неподдерживаемый тип родственной связи.',
    'Choose parent to keep children': 'Выберите родителя, с которым останутся дети',
    'This will remove the selected relationship. No person will be deleted.': 'Выбранная связь будет удалена. Люди удалены не будут.',
    'Relationship cannot be unlinked.': 'Не удалось удалить родственную связь.',
    'Relationship could not be unlinked.': 'Не удалось удалить родственную связь.',
    'Sibling relationships are derived from shared parents.': 'Связи братьев и сестёр определяются общими родителями.',
    'Relationship updated.': 'Родственная связь обновлена.',
    'Relationship cannot be edited.': 'Эту родственную связь нельзя изменить.',
    'Select a possible match first.': 'Сначала выберите возможное совпадение.',
    'Check the relationship details before connecting.': 'Проверьте сведения о связи перед добавлением.',
    'Could not connect the selected match.': 'Не удалось связать выбранное совпадение.',
    'Cancel removing fact': 'Отменить удаление факта',
    'Enter a short name for this fact.': 'Введите краткое название факта.',
    'Enter a name for the custom fact.': 'Введите название пользовательского факта.',
    'Check the custom fact date before saving.': 'Проверьте дату пользовательского факта перед сохранением.',
    'Add a value, date, place, or note.': 'Добавьте значение, дату, место или примечание.',
    'Add some information to the custom fact.': 'Добавьте сведения в пользовательский факт.',
    'Check the education dates before saving.': 'Проверьте даты образования перед сохранением.',
    'Check the occupation dates before saving.': 'Проверьте даты работы перед сохранением.',
    'Check the baptism date before saving.': 'Проверьте дату крещения перед сохранением.',
    'Person record was not found.': 'Запись человека не найдена.',
    'Check the additional facts before saving.': 'Проверьте дополнительные факты перед сохранением.',
    'Check the relationship details before saving.': 'Проверьте сведения о связи перед сохранением.',
    'Check the birth date before saving.': 'Проверьте дату рождения перед сохранением.',
    'Check the death date before saving.': 'Проверьте дату смерти перед сохранением.',
    'Person updated.': 'Сведения о человеке обновлены.',
    'Previous page': 'Предыдущая страница',
    'Next page': 'Следующая страница',
    'Remove filter': 'Удалить фильтр',
    'Living person protected': 'Данные живущего человека защищены',
    'Standard record': 'Обычная запись',
    'No photos yet': 'Фотографий пока нет',
    'No notes yet': 'Заметок пока нет',
    'Research note': 'Исследовательская заметка',
    'No places linked': 'Связанных мест нет',
    'Check the education start date before saving.': 'Проверьте дату начала обучения перед сохранением.',
    'Check the education end date before saving.': 'Проверьте дату окончания обучения перед сохранением.',
    'Check the work start date before saving.': 'Проверьте дату начала работы перед сохранением.',
    'Check the work end date before saving.': 'Проверьте дату окончания работы перед сохранением.',
    'Close custom fact dialog': 'Закрыть окно пользовательского факта',
    'Check the custom fact before saving.': 'Проверьте пользовательский факт перед сохранением.',
    'Custom fact updated.': 'Пользовательский факт обновлён.',
    'Custom fact added.': 'Пользовательский факт добавлен.',
    'This person is not currently shown in the sample Family Tree.': 'Этот человек сейчас не отображается в демонстрационном семейном древе.',
    'Person deleted.': 'Человек удалён.',
    'No matching project photos.': 'Подходящих фотографий проекта не найдено.',
    'Project photo scope': 'Область фотографий проекта',
    'Drag to reposition photo': 'Перетащите фотографию, чтобы изменить её положение',
    'Photo zoom': 'Масштаб фотографии',
    'Avatar previews': 'Предпросмотр аватара',
    'File cannot be read.': 'Не удалось прочитать файл.',
    'File cannot be read as an image.': 'Не удалось прочитать файл как изображение.',
    'Unsupported file type. Choose a JPEG, PNG, or WebP image.': 'Неподдерживаемый тип файла. Выберите изображение JPEG, PNG или WebP.',
    'Photo has invalid or missing image dimensions.': 'Размеры фотографии отсутствуют или недопустимы.',
    'One file could not be added:': 'Не удалось добавить один файл:',
    'One or more uploaded photos are no longer valid. Remove them and choose the files again.': 'Одна или несколько загруженных фотографий больше недоступны. Удалите их и выберите файлы заново.',
    'No valid photos were added.': 'Не добавлено ни одной подходящей фотографии.',
    'The uploaded photo is no longer valid. Choose it again.': 'Загруженная фотография больше недоступна. Выберите её заново.',
    'The photo is no longer available for this person.': 'Эта фотография больше недоступна для данного человека.',
    'The photo could not be prepared for adjustment.': 'Не удалось подготовить фотографию к настройке.',
    'File name': 'Имя файла',
    'File format': 'Формат файла',
    'File size': 'Размер файла',
    'No caption.': 'Подпись отсутствует.',
    'Selected photo': 'Выбранная фотография',
    'No photos match this search.': 'По этому запросу фотографии не найдены.',
    'This project has no photos yet.': 'В этом проекте пока нет фотографий.',
    'No description': 'Без описания',
    'Linked to Family Tree with board changes': 'Связано с семейным древом, есть изменения на холсте',
    'Linked to Family Tree': 'Связано с семейным древом',
    'Board import is a placeholder in this iteration. Real .ggboard import will be added later.': 'Импорт холста в этой версии имитируется. Поддержка файлов .ggboard будет добавлена позже.',
    'No boards match this search.': 'По этому запросу холсты не найдены.',
    'Collections keep related boards together.': 'Коллекции помогают объединять связанные холсты.',
    'Update the collection name and description. Boards stay in this collection.': 'Измените название и описание коллекции. Холсты останутся в этой коллекции.',
    'Collection deleted. Boards kept.': 'Коллекция удалена. Холсты сохранены.',
    'Board archived.': 'Холст перемещен в архив.',
    'Board unarchived.': 'Холст восстановлен из архива.',
    'Board collection is missing an ID': 'У коллекции досок отсутствует идентификатор',
    'No source': 'Без источника',
    'Unable to restore Geneograph history': 'Не удалось восстановить историю Генеографа',
    'Pencil stroke': 'Штрих карандаша',
    'Title text': 'Текст заголовка',
    'Suggested board colors': 'Предлагаемые цвета холста',
    'Delete selected': 'Удалить выбранное',
    'Freeform size · Hold Shift to preserve ratio': 'Свободный размер · Удерживайте Shift для сохранения пропорций',
    'Write a note…': 'Введите заметку…',
    'Enter text…': 'Введите текст…',
    'Drag on empty canvas to draw a panel.': 'Перетащите указатель по пустому холсту, чтобы нарисовать панель.',
    'Click empty canvas or a panel to place a sticky note.': 'Щёлкните по пустому холсту или панели, чтобы разместить стикер.',
    'Click empty canvas or a panel to place a text block.': 'Щёлкните по пустому холсту или панели, чтобы разместить текстовый блок.',
    'New panel': 'Новая панель',
    'Place object updated.': 'Объект места обновлён.',
    'Place added to board.': 'Место добавлено на холст.',
    'Place is now board-only.': 'Место теперь существует только на холсте.',
    'The original person card is no longer available.': 'Исходная карточка человека больше недоступна.',
    'Board person updated.': 'Человек на холсте обновлён.',
    'Person added to board.': 'Человек добавлен на холсте.',
    'No images selected': 'Изображения не выбраны',
    'Drop an image here': 'Перетащите изображение сюда',
    'Add more images': 'Добавить ещё изображения',
    'Drop images here': 'Перетащите изображения сюда',
    'Choose image': 'Выбрать изображение',
    'Choose more images': 'Выбрать ещё изображения',
    'Choose images': 'Выбрать изображения',
    'Image replaced.': 'Изображение заменено.',
    'Link person': 'Связать человека',
    'No person selected': 'Человек не выбран',
    'Family Tree link changed.': 'Связь с семейным древом изменена.',
    'Person linked to Family Tree.': 'Человек связан с семейным древом.',
    'Choose two connection points.': 'Выберите две точки связи.',
    'An item cannot connect to itself.': 'Объект нельзя связать с самим собой.',
    'That family is no longer available.': 'Эта семья больше недоступна.',
    'That child already belongs to this family.': 'Этот ребёнок уже входит в эту семью.',
    'This relationship would create an ancestry cycle.': 'Эта связь создаст цикл в родословной.',
    'Direct ancestors cannot be siblings.': 'Прямые предки не могут быть братьями или сёстрами.',
    'That sibling relationship already exists.': 'Такая связь братьев или сестёр уже существует.',
    'Direct ancestors cannot be partners.': 'Прямые предки не могут быть партнёрами.',
    'That partner relationship already exists.': 'Такая партнёрская связь уже существует.',
    'That parent-child relationship already exists.': 'Такая связь родителя и ребёнка уже существует.',
    'Use side ports for partners and vertical ports for parent-child relationships.': 'Для партнёров используйте боковые точки, а для связей родителя и ребёнка — вертикальные.',
    'These points cannot be connected.': 'Эти точки нельзя соединить.',
    'That connection already exists.': 'Такая связь уже существует.',
    'Connection created.': 'Связь создана.',
    'The relationship could not be updated.': 'Не удалось обновить родственную связь.',
    'Relationship details updated.': 'Сведения о родственной связи обновлены.',
    'Export Geneograph board': 'Экспортировать холст Генеографа',
    'Person unlinked from Family Tree.': 'Связь человека с семейным древом удалена.',
    'No files linked.': 'Связанных файлов нет.',
    'This file is no longer linked.': 'Этот файл больше не связан.',
    'The file could not be unlinked.': 'Не удалось удалить связь с файлом.',
    'Genealogy event': 'Генеалогическое событие',
    'Enter a file name before saving.': 'Введите имя файла перед сохранением.',
    'No file links were added.': 'Связи с файлами не добавлены.',
    'Create a new destination folder': 'Создать новую папку назначения',
    'Archive files support one place': 'Файл Архива может быть связан только с одним местом',
    'File not found': 'Файл не найден',
    'Linked record not found': 'Связанная запись не найдена',
    'Records belong to different projects': 'Записи принадлежат разным проектам',
    'Relationships were not written': 'Связи не были сохранены',
    'No notes were linked.': 'Заметки не были связаны.',
    'Set file place': 'Указать место файла',
    'Set place for files': 'Указать место для файлов',
    'for every selected file.': 'для каждого выбранного файла.',
    'This place is already linked': 'Это место уже связано',
    'Select one place': 'Выберите одно место',
    'The place could not be linked to every file.': 'Не удалось связать место с каждым файлом.',
    'File place updated.': 'Место файла обновлено.',
    'No links were added.': 'Связи не добавлены.',
    'The link could not be removed.': 'Не удалось удалить связь.',
    'Link removed.': 'Связь удалена.',
    'Opening the original file is simulated.': 'Открытие исходного файла имитируется в прототипе.',
    'Person record': 'Запись человека',
    'Place record': 'Запись места',
    'Event record': 'Запись события',
    'This event has no valid person owner.': 'У этого события нет действительного владельца.',
    'Text formatting': 'Форматирование текста',
    'Rich text': 'Форматированный текст',
    'Default text color': 'Цвет текста по умолчанию',
    'No highlight': 'Без выделения',
    'Paste or enter a URL': 'Вставьте или введите URL',
    'Link URL': 'URL ссылки',
    'Select text before adding a link.': 'Перед добавлением ссылки выделите текст.',
    'Rich text is unavailable. Note opened in plain-text mode.': 'Форматированный текст недоступен. Заметка открыта в режиме обычного текста.',
    'No files linked to this note.': 'С этой заметкой не связано ни одного файла.',
    'No people linked to this note.': 'С этой заметкой не связано ни одного человека.',
    'No events linked to this note.': 'С этой заметкой не связано ни одного события.',
    'No photos linked to this note.': 'С этой заметкой не связано ни одного фото.',
    'No places linked to this note.': 'С этой заметкой не связано ни одного места.',
    'No sources linked to this note.': 'С этой заметкой не связано ни одного источника.',
    'Remove photo link': 'Удалить связь с фотографией',
    'Add to collections': 'Добавить в коллекции',
    'Close add to collection dialog': 'Закрыть окно добавления в коллекции',
    'A collection with this name already exists.': 'Коллекция с таким названием уже существует.',
    'Close add people dialog': 'Закрыть окно добавления людей',
    'People to add': 'Добавляемые люди',
    'No people were linked.': 'Люди не были связаны.',
    'Close add places dialog': 'Закрыть окно добавления мест',
    'Search by name, broader place, or historical name': 'Поиск по названию, более широкому месту или историческому названию',
    'Suggested places': 'Предлагаемые места',
    '{count} place available':
        'Доступно мест: {count}',

    '{count} places available':
        'Доступно мест: {count}',

    '{count} match':
        'Найдено: {count}',

    '{count} matches':
        'Найдено: {count}',

    '{count} already connected':
        'Уже связано: {count}',
    'Place links updated.': 'Связи с местами обновлены.',
    'Close add events dialog': 'Закрыть окно добавления событий',
    'No events were linked.': 'События не были связаны.',
    'Search records': 'Поиск записей',
    'Search records...': 'Поиск записей...',
    'The relationship will appear in both notes.': 'Связь появится в обеих заметках.',
    'Already related': 'Уже связано',
    'Added to favourites.': 'Добавлено в избранное.',
    'Removed from favourites.': 'Удалено из избранного.',
    'Removed from collection.': 'Удалено из коллекции.',
    'New checklist item': 'Новый пункт списка',
    'Relationship removed from both notes.': 'Связь удалена из обеих заметок.',
    'Map library unavailable': 'Библиотека карты недоступна',
    'Leaflet could not be loaded. The place list and editor remain available.': 'Не удалось загрузить Leaflet. Список и редактор мест остаются доступными.',
    'Map configuration required': 'Требуется настройка карты',
    'Add a protected MapTiler browser key to window.GENEOGRAPH_CONFIG.maptilerKey.': 'Добавьте защищённый браузерный ключ MapTiler в window.GENEOGRAPH_CONFIG.maptilerKey.',
    'Needs attention': 'Требует внимания',
    'No mapped places': 'Нет мест на карте',
    'Add coordinates to a place to show it on the map.': 'Добавьте координаты места, чтобы показать его на карте.',
    'Other fact': 'Другой факт',
    'Other event': 'Другое событие',
    'Active Places filters': 'Активные фильтры мест',
    'Place filters cleared.': 'Фильтры мест очищены.',
    'This place is not on the map': 'Это место не отмечено на карте',
    'Saved filter': 'Сохранённый фильтр',
    'Clipboard unavailable': 'Буфер обмена недоступен',
    'Unknown size': 'Размер неизвестен',
    'Just now': 'Только что',
    'Unknown parents': 'Неизвестные родители',
    'Archive clerk': 'Архивный служащий',
    'Pawford records room': 'Хранилище документов Поуфорда',
    'Sample occupation fact kept on the centralized person record.': 'Демонстрационный факт о работе хранится в центральной записи человека.',
    'e.g. Old Cattery, England': 'Например, Олд-Кэттери, Англия',
    'e.g. 12 Jun 2025': 'Например, 12 июн. 2025',
    'e.g. Silver': 'Например, Сильвер',
    'e.g. Whiskerfield': 'Например, Вискерфильд',
    'e.g. Purrington': 'Например, Пуррингтон',
    'e.g. Milkpaw': 'Например, Милкпоу',
    'Add person': 'Добавить человека',
    'Edit person': 'Изменить человека',
    'All Whiskerfield surname records.': 'Все записи, связанные с фамилией Вискерфильд.',
    'People and records connected to Meowbridge.': 'Люди и записи, связанные с Мяубриджем.',
    'Great-grandparents and early evidence.': 'Прадеды, прабабушки и ранние свидетельства.',
    'Birth Date': 'Дата рождения',
    'Birth Place': 'Место рождения',
    'Death Date': 'Дата смерти',
    'Death Place': 'Место смерти',
    'Burial Place': 'Место захоронения',
    'Added recently': 'Добавлено недавно',
    'Edit custom fact': 'Изменить пользовательский факт',
    'Add custom fact': 'Добавить пользовательский факт',
    'Custom filters': 'Пользовательские фильтры',
    'Optional description': 'Необязательное описание',
    'This person': 'Этот человек',
    'Photo source': 'Источник фотографии',
    'Adjust photo': 'Настроить фотографию',
    'Choose photo': 'Выбрать фотографию',
    'Uploaded photo': 'Загруженная фотография',
    'Untitled photo': 'Фотография без названия',
    'Remove upload': 'Удалить загрузку',
    'Add more photos': 'Добавить ещё фотографии',
    'Drop photos here': 'Перетащите фотографии сюда',
    'Choose photos': 'Выбрать фотографии',
    'Remove upload': 'Удалить загруженную фотографию',
    'Close add photos dialog': 'Закрыть окно добавления фотографий',
    'Upload new photos': 'Загрузить новые фотографии',
    'Untitled collection': 'Коллекция без названия',
    'e.g. Pawford research': 'Например, Исследование Поуфорда',
    'Collection created.': 'Коллекция создана.',
    'Edit collection': 'Изменить коллекцию',
    'Collection updated.': 'Коллекция обновлена.',
    'Deep moss': 'Глубокий мох',
    'Archive blue': 'Архивный синий',
    'Geneograph green': 'Зелёный Генеографа',
    'Conflict red': 'Красный конфликта',
    'Uploaded image': 'Загруженное изображение',
    'Project photo': 'Фотография проекта',
    'Untitled board': 'Холст без названия',
    'Sticky note content': 'Содержимое стикера',
    'Text block content': 'Содержимое текстового блока',
    'Sticky note formatting': 'Форматирование стикера',
    'New text': 'Новый текст',
    'Choose a different image': 'Выбрать другое изображение',
    'Archive file': 'Файл Архива',
    'Untitled file': 'Файл без названия',
    'Unlink file': 'Удалить связь с файлом',
    'Add people': 'Добавить людей',
    'Person profile': 'Профиль человека',
    'Add events': 'Добавить события',
    'Add notes': 'Добавить заметки',
    'Add places': 'Добавить места',
    'Archive files': 'Файлы Архива',
    'Add event': 'Добавить событие',
    'Not specified': 'Не указано',
    'File source': 'Источник файла',
    'Search Archive files': 'Поиск файлов Архива',
    'Add new files': 'Добавить новые файлы',
    'Folder created.': 'Папка создана.',
    'Untitled folder': 'Папка без названия',
    'Selected files': 'Выбранные файлы',
    'Remove link': 'Удалить связь',
    'The file is no longer available.': 'Этот файл больше недоступен.',
    'Remove place': 'Удалить место',
    'Remove from selection': 'Убрать из выбранного',
    'Create note': 'Создать заметку',
    'Add related notes': 'Добавить связанные заметки'
};

const RU_UI_MODULE_BLOCKS = Object.freeze({
    shared: RU_UI_SHARED,
    completion: RU_UI_COMPLETION,
    projects: RU_UI_PROJECTS,
    familyTree: RU_UI_FAMILY_TREE,
    people: RU_UI_PEOPLE,
    geneograph: RU_UI_GENEO,
    albums: RU_UI_ALBUMS,
    archive: RU_UI_ARCHIVE,
    notes: RU_UI_NOTES,
    places: RU_UI_PLACES,
    publish: RU_UI_PUBLISH
});

const RU_TERM_BLOCKS = Object.freeze({
    genealogy: RU_TERMS_GENEALOGY,
    relationships: RU_TERMS_RELATIONSHIPS,
    statuses: RU_TERMS_STATUSES
});

const RU_DATA_BLOCKS = Object.freeze({
    projects: RU_DATA_PROJECTS,
    projectComposites: RU_DATA_PROJECT_COMPOSITES,
    projectActivity: RU_DATA_PROJECT_ACTIVITY,
    projectInsights: RU_DATA_PROJECT_INSIGHTS,
    people: RU_DATA_PEOPLE,
    namesFirst: RU_DATA_NAMES_FIRST,
    namesMiddle: RU_DATA_NAMES_MIDDLE,
    namesSurnames: RU_DATA_NAMES_SURNAMES,
    places: RU_DATA_PLACES,
    photos: RU_DATA_PHOTOS,
    albums: RU_DATA_ALBUMS,
    archive: RU_DATA_ARCHIVE,
    sources: RU_DATA_SOURCES,
    notes: RU_DATA_NOTES,
    noteCollections: RU_DATA_NOTE_COLLECTIONS,
    geneograph: RU_DATA_GENEO,
    notifications: RU_DATA_NOTIFICATIONS
});

const RU_UI = buildLocalizationMap(
    'RU_UI',
    {
        ...RU_UI_MODULE_BLOCKS,
        ...RU_TERM_BLOCKS
    }
);

const RU_DATA = buildLocalizationMap(
    'RU_DATA',
    RU_DATA_BLOCKS
);

const RU_EXACT = buildLocalizationMap(
    'RU_EXACT',
    {
        ui: RU_UI,
        data: RU_DATA
    }
);


const RU_PLURALS = {
    people: {
        one: 'человек',
        few: 'человека',
        many: 'человек',
        other: 'человека'
    },

    person: {
        one: 'человек',
        few: 'человека',
        many: 'человек',
        other: 'человека'
    },

    photos: {
        one: 'фотография',
        few: 'фотографии',
        many: 'фотографий',
        other: 'фотографии'
    },

    photo: {
        one: 'фотография',
        few: 'фотографии',
        many: 'фотографий',
        other: 'фотографии'
    },

    albums: {
        one: 'альбом',
        few: 'альбома',
        many: 'альбомов',
        other: 'альбома'
    },

    album: {
        one: 'альбом',
        few: 'альбома',
        many: 'альбомов',
        other: 'альбома'
    },

    files: {
        one: 'файл',
        few: 'файла',
        many: 'файлов',
        other: 'файла'
    },

    file: {
        one: 'файл',
        few: 'файла',
        many: 'файлов',
        other: 'файла'
    },

    subfolder: {
        one: 'вложенная папка',
        few: 'вложенные папки',
        many: 'вложенных папок',
        other: 'вложенной папки'
    },

    subfolders: {
        one: 'вложенная папка',
        few: 'вложенные папки',
        many: 'вложенных папок',
        other: 'вложенной папки'
    },

    notes: {
        one: 'заметка',
        few: 'заметки',
        many: 'заметок',
        other: 'заметки'
    },

    note: {
        one: 'заметка',
        few: 'заметки',
        many: 'заметок',
        other: 'заметки'
    },

    events: {
        one: 'событие',
        few: 'события',
        many: 'событий',
        other: 'события'
    },

    event: {
        one: 'событие',
        few: 'события',
        many: 'событий',
        other: 'события'
    },

    sources: {
        one: 'источник',
        few: 'источника',
        many: 'источников',
        other: 'источника'
    },

    source: {
        one: 'источник',
        few: 'источника',
        many: 'источников',
        other: 'источника'
    },

    questions: {
        one: 'вопрос',
        few: 'вопроса',
        many: 'вопросов',
        other: 'вопроса'
    },

    question: {
        one: 'вопрос',
        few: 'вопроса',
        many: 'вопросов',
        other: 'вопроса'
    },

    projects: {
        one: 'проект',
        few: 'проекта',
        many: 'проектов',
        other: 'проекта'
    },

    project: {
        one: 'проект',
        few: 'проекта',
        many: 'проектов',
        other: 'проекта'
    },

    places: {
        one: 'место',
        few: 'места',
        many: 'мест',
        other: 'места'
    },

    place: {
        one: 'место',
        few: 'места',
        many: 'мест',
        other: 'места'
    },

    stops: {
        one: 'остановка',
        few: 'остановки',
        many: 'остановок',
        other: 'остановки'
    },

    stop: {
        one: 'остановка',
        few: 'остановки',
        many: 'остановок',
        other: 'остановки'
    },

    Objects: {
        one: 'объект',
        few: 'объекта',
        many: 'объектов',
        other: 'объекта'
    },

    objects: {
        one: 'объект',
        few: 'объекта',
        many: 'объектов',
        other: 'объекта'
    },

    object: {
        one: 'объект',
        few: 'объекта',
        many: 'объектов',
        other: 'объекта'
    },

    boards: {
        one: 'холст',
        few: 'холсты',
        many: 'холстов',
        other: 'холсты'
    },

    board: {
        one: 'холст',
        few: 'холсты',
        many: 'холстов',
        other: 'холсты'
    },

    connections: {
        one: 'связь',
        few: 'связи',
        many: 'связей',
        other: 'связи'
    },

    connection: {
        one: 'связь',
        few: 'связи',
        many: 'связей',
        other: 'связи'
    },

    relationships: {
        one: 'родственная связь',
        few: 'родственные связи',
        many: 'родственных связей',
        other: 'родственной связи'
    },

    relationship: {
        one: 'родственная связь',
        few: 'родственные связи',
        many: 'родственных связей',
        other: 'родственной связи'
    },

    items: {
        one: 'элемент',
        few: 'элемента',
        many: 'элементов',
        other: 'элемента'
    },

    item: {
        one: 'элемент',
        few: 'элемента',
        many: 'элементов',
        other: 'элемента'
    },

    names: {
        one: 'название',
        few: 'названия',
        many: 'названий',
        other: 'названия'
    },

    name: {
        one: 'название',
        few: 'названия',
        many: 'названий',
        other: 'названия'
    },

    years: {
        one: 'год',
        few: 'года',
        many: 'лет',
        other: 'года'
    },

    year: {
        one: 'год',
        few: 'года',
        many: 'лет',
        other: 'года'
    },

    records: {
        one: 'запись',
        few: 'записи',
        many: 'записей',
        other: 'записи'
    },

    record: {
        one: 'запись',
        few: 'записи',
        many: 'записей',
        other: 'записи'
    },

    collections: {
        one: 'коллекция',
        few: 'коллекции',
        many: 'коллекций',
        other: 'коллекции'
    },

    collection: {
        one: 'коллекция',
        few: 'коллекции',
        many: 'коллекций',
        other: 'коллекции'
    }
};

const RU_PLURAL_RULES_FORMATTER =
    new Intl.PluralRules('ru');

const RU_NUMBER_FORMATTER =
    new Intl.NumberFormat('ru');

const LOCALIZATION_TEXT_CACHE_LIMIT =
    4096;

const localizationTextCache =
    new Map();

function cacheLocalizedText(
    source,
    translated
)
{
    if (
        !localizationTextCache.has(source)
        && localizationTextCache.size
          >= LOCALIZATION_TEXT_CACHE_LIMIT
    )
    {
        localizationTextCache.delete(
            localizationTextCache
                .keys()
                .next()
                .value
        );
    }

    localizationTextCache.set(
        source,
        translated
    );

    return translated;
}

const RU_LOCALIZATION = Object.freeze({
    ui: RU_UI_MODULE_BLOCKS,
    terms: RU_TERM_BLOCKS,
    data: RU_DATA_BLOCKS,
    plurals: RU_PLURALS
});


const DEFAULT_DOCUMENT_TITLE =
    document.title;

const LOCALIZABLE_DOM_ATTRIBUTES =
    Object.freeze([
        'placeholder',
        'aria-label',
        'aria-description',
        'aria-valuetext',
        'aria-placeholder',
        'title',
        'alt',
        'data-toast'
    ]);

const LOCALIZABLE_DOM_ATTRIBUTE_SELECTOR =
    LOCALIZABLE_DOM_ATTRIBUTES
        .map(attribute =>
            `[${attribute}]`
        )
        .join(',');

function escapeLocalizationRegExp(
    value
)
{
    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );
}

/*
    * Attribute values often contain composed copy:
    *
    * "Open Silver Whiskerfield profile"
    * "Actions for Luna Purrington"
    *
    * Translate known RU_UI fragments, but only at
    * token boundaries so short keys do not corrupt
    * unrelated words.
    *
    * Example:
    * "Off" must not mutate "Office".
    */
const RU_EXACT_EMBEDDED_RULES =
    Object.keys(
        RU_EXACT
    )
        .filter(key =>
            key.length > 2
          && RU_EXACT[key] !== key
        )
        .sort(
            (left, right) =>
                right.length
            - left.length
        )
        .map(key => ({
            translation:
            RU_EXACT[key],

            pattern:
            new RegExp(
                `(^|[^\\p{L}\\p{N}_])${escapeLocalizationRegExp(
                    key
                )}(?=$|[^\\p{L}\\p{N}_])`,
                'gu'
            )
        }));


function isTechnicalLocalizationValue(
    value
)
{
    const source =
        String(value || '').trim();

    if (!source)
    {
        return false;
    }

    /*
      * Do not translate URL or filesystem contents.
      * These are data/identifiers, not localized UI.
      */
    return /^(?:https?:\/\/|mailto:|tel:|[a-z]:\\|\/(?:[^/\s]+\/)+)/i
        .test(source);
}

function normalizeLang(lang)
{
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function initialLanguage()
{
    const url = new URL(window.location.href);
    const requested = url.searchParams.get('lang');
    if (!SUPPORTED_LANGUAGES.includes(requested))
    {
        return normalizeLang(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
    }

    localStorage.setItem(LANGUAGE_STORAGE_KEY, requested);
    url.searchParams.delete('lang');
    try
    {
        history.replaceState(history.state, '', url.href);
    }
    catch (_error)
    {
        // Some direct-file browsers disallow history replacement.
    }
    return requested;
}

function translateExact(value)
{
    if (!value) return value;

    const trimmed =
        String(value).trim();

    return (
        state.language === 'ru'
        && Object.prototype
            .hasOwnProperty.call(
                RU_EXACT,
                trimmed
            )
    )
        ? RU_EXACT[trimmed]
        : trimmed;
}

function t(
    key
)
{
    const source =
        key == null
            ? ''
            : String(key);

    if (
        state.language !== 'ru'
    )
    {
        return source;
    }

    return Object.prototype
        .hasOwnProperty.call(
            RU_UI,
            source
        )
        ? RU_UI[source]
        : source;
}

function translateCountPhrase(
    text
)
{
    if (
        state.language !== 'ru'
    )
    {
        return text;
    }

    return String(text).replace(
        /(\d[\d\s.,]*)\s+(people|person|places|place|stops|stop|photos|photo|albums|album|files|file|notes|note|events|event|sources|source|questions|question|projects|project|objects|object|boards|board|connections|connection|relationships|relationship|items|item|names|name|years|year|records|record|collections|collection|subfolders|subfolder)\b/gi,
        (
            match,
            rawNumber,
            noun
        ) =>
        {
            const number =
                Number(
                    String(rawNumber)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            if (
                !Number.isFinite(
                    number
                )
            )
            {
                return match;
            }

            const forms =
                RU_PLURALS[noun]
            || RU_PLURALS[
                noun.toLowerCase()
            ];

            if (!forms)
            {
                return match;
            }

            const rule =
                RU_PLURAL_RULES_FORMATTER
                    .select(number);

            const word =
                forms[rule]
            || forms.other;

            return `${
                RU_NUMBER_FORMATTER
                    .format(number)
            } ${word}`;
        }
    );
}

function translateDynamicPhrase(core)
{
    if (
        state.language !== 'ru'
        || core == null
        || core === ''
    )
    {
        return core;
    }

    const folderDropMessage = String(core).trim().match(
        /^Drop files here to add them to “([\s\S]*)”, or click to choose files\.$/
    );

    if (folderDropMessage)
    {
        const folderName = folderDropMessage[1];

        return `Перетащите файлы сюда, чтобы добавить их в папку «${folderName}», или нажмите, чтобы выбрать файлы.`;
    }

    const movePlaceInstruction = String(core).trim().match(
        /^Drag the draft marker or click the map to reposition ([\s\S]+)\.$/
    );

    if (movePlaceInstruction)
    {
        return `Перетащите маркер или нажмите на карту, чтобы изменить положение места «${movePlaceInstruction[1]}».`;
    }

    const positionPlaceInstruction = String(core).trim().match(
        /^Click the map to position ([\s\S]+), or use the map centre\.$/
    );

    if (positionPlaceInstruction)
    {
        return `Нажмите на карту, чтобы указать положение места «${positionPlaceInstruction[1]}», или используйте центр карты.`;
    }

    let out =
        String(core).trim();

    const repl =
        (pattern, replacement) =>
        {
            out = out.replace(
                pattern,
                replacement
            );
        };

    const formatNumber =
        value =>
        {
            const number =
                Number(
                    String(value)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            return Number.isFinite(number)
                ? RU_NUMBER_FORMATTER
                    .format(number)
                : String(value);
        };

    /*
        Translate an exact dynamic value when possible.

        This is important for database values such as:
        - project names
        - person names
        - places
        - modules
        - statuses
        - sample-data labels

        If a lowercase dynamic value such as "projects"
        is received, also try the capitalized RU_UI key.
      */
    const translateValue =
        value =>
        {
            const source =
                String(value || '').trim();

            if (!source)
            {
                return source;
            }

            const exact =
                translateExact(source);

            if (exact !== source)
            {
                return exact;
            }

            const capitalized =
                source.charAt(0)
                    .toUpperCase()
            + source.slice(1);

            const capitalizedTranslation =
                translateExact(
                    capitalized
                );

            if (
                capitalizedTranslation
              !== capitalized
            )
            {
                return capitalizedTranslation;
            }

            return source;
        };

    /*
       * Places map-position summaries.
       *
       * Supports both the standalone status and
       * the summary containing coordinates.
       */
    repl(
        /^Mapped(?:\s+at\s+(.+))?$/i,
        (
            _match,
            coordinates
        ) =>
            coordinates
                ? `На карте: ${coordinates}`
                : 'На карте'
    );

    /*
        formatProjectDate() currently produces English
        month abbreviations. Translate them when they occur
        inside generated date phrases.
      */
    const translateDateValue =
        value =>
        {
            const translated =
                translateValue(value);

            const monthNames = {
                jan: 'янв.',
                january: 'января',
                feb: 'февр.',
                february: 'февраля',
                mar: 'мар.',
                march: 'марта',
                apr: 'апр.',
                april: 'апреля',
                may: 'мая',
                jun: 'июн.',
                june: 'июня',
                jul: 'июл.',
                july: 'июля',
                aug: 'авг.',
                august: 'августа',
                sep: 'сент.',
                september: 'сентября',
                oct: 'окт.',
                october: 'октября',
                nov: 'нояб.',
                november: 'ноября',
                dec: 'дек.',
                december: 'декабря'
            };

            return String(translated)
                .replace(
                    /\btoday at\b/gi,
                    'сегодня в'
                )
                .replace(
                    /\byesterday at\b/gi,
                    'вчера в'
                )
                .replace(
                    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
                    match =>
                        monthNames[
                            match.toLowerCase()
                        ] || match
                );
        };

    const pluralWord =
        (noun, count) =>
        {
            const source =
                String(noun || '');

            const forms =
                RU_PLURALS[source]
            || RU_PLURALS[
                source.toLowerCase()
            ];

            if (!forms)
            {
                return translateValue(
                    source
                );
            }

            const numericCount =
                Number(count);

            const rule =
                RU_PLURAL_RULES_FORMATTER
                    .select(
                        Number.isFinite(
                            numericCount
                        )
                            ? numericCount
                            : 0
                    );

            return forms[rule]
            || forms.other;
        };

    const countPhrase =
        (count, noun) =>
        {
            const numericCount =
                Number(
                    String(count)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            if (
                !Number.isFinite(
                    numericCount
                )
            )
            {
                return `${count} ${translateValue(noun)}`;
            }

            return `${
                RU_NUMBER_FORMATTER
                    .format(numericCount)
            } ${
                pluralWord(
                    noun,
                    numericCount
                )
            }`;
        };

    // Project insights: translate descriptions for any count.
    repl(
        /\b(\d+)\s+(?:person is|people are)\s+missing birth details\.$/i,
        (_, count) =>
            `Неполные сведения о рождении: ${
                translateCountPhrase(`${count} people`)
            }.`
    );

    repl(
        /\b(\d+)\s+archive\s+(?:file is|files are)\s+missing source information\.$/i,
        (_, count) =>
            `Архивные файлы без источника: ${formatNumber(count)}.`
    );

    repl(
        /\b(\d+)\s+(?:photo is|photos are)\s+not assigned to an album\.$/i,
        (_, count) =>
            `Фото вне альбомов: ${formatNumber(count)}.`
    );

    repl(
        /\b(\d+)\s+(?:place needs|places need)\s+review\.$/i,
        (_, count) =>
            `Места для проверки: ${formatNumber(count)}.`
    );

    const countNouns =
        'people|person|places|place|stops|stop|photos|photo|albums|album|files|file|notes|note|events|event|sources|source|questions|question|projects|project|objects|object|boards|board|connections|connection|relationships|relationship|items|item|names|name|years|year|records|record|collections|collection|subfolders|subfolder';

    /*
        Sorting / searching / pagination
      */

    repl(
        /^Sort:\s*(.+)$/i,
        (_, value) =>
            `Сортировка: ${
                translateValue(value)
            }`
    );

    repl(
        /^Search\s+(.+?)(\.{3})?$/i,
        (_, value, ellipsis) =>
            `Поиск: ${
                translateValue(value)
            }${ellipsis || ''}`
    );

    repl(
        /^Rows per page:\s*(\d+)$/i,
        (_, number) =>
            `Строк на странице: ${
                formatNumber(number)
            }`
    );

    repl(
        new RegExp(
            `^Showing\\s+(.+?)\\s+of\\s+(\\d+)\\s+(${countNouns})$`,
            'i'
        ),
        (
            _,
            range,
            total,
            noun
        ) =>
            `Показано ${range} из ${
                formatNumber(total)
            } ${
                pluralWord(
                    noun,
                    Number(total)
                )
            }`
    );

    repl(
        /^Showing\s+(\d+)\s+of\s+(\d+)$/i,
        (_, current, total) =>
            `Показано ${formatNumber(current)} из ${formatNumber(total)}`
    );

    /*
        Example:
        1 of 4 projects
      */
    repl(
        new RegExp(
            `^(\\d+)\\s+of\\s+(\\d+)\\s+(${countNouns})$`,
            'i'
        ),
        (
            _,
            current,
            total,
            noun
        ) =>
            `${
                formatNumber(current)
            } из ${
                formatNumber(total)
            } ${
                pluralWord(
                    noun,
                    Number(total)
                )
            }`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+selected$`,
            'i'
        ),
        (_, number, noun) =>
            `Выбрано: ${countPhrase(number, noun)}`
    );

    repl(
        /^(\d+)\s+selected$/i,
        (_, number) =>
            `Выбрано: ${
                formatNumber(number)
            }`
    );

    repl(
        /^(\d+)\s+events?\s+added to source\.$/i,
        (_, number) =>
            `К источнику добавлено ${
                countPhrase(
                    number,
                    'event'
                )
            }.`
    );
    repl(
        /^(\d+)\s+sources?\s+linked$/i,
        (_, number) =>
            `Связано: ${
                countPhrase(
                    number,
                    'source'
                )
            }`
    );
    /*
        Notification count.
      */
    repl(
        /^(\d+)\s+items?\s+need\s+attention$/i,
        (_, number) =>
            `Требуют внимания: ${
                formatNumber(number)
            }`
    );

    /*
        Relative dates and timestamps
      */

    repl(
        /^today at\s+(.+)$/i,
        (_, value) =>
            `сегодня в ${value}`
    );

    repl(
        /^yesterday at\s+(.+)$/i,
        (_, value) =>
            `вчера в ${value}`
    );

    repl(
        /^Last opened\s+(.+)$/i,
        (_, value) =>
            `Открыто: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Last modified\s+(.+)$/i,
        (_, value) =>
            `Последнее изменение: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Modified\s+(.+)$/i,
        (_, value) =>
            `Изменено: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Created\s+(.+)$/i,
        (_, value) =>
            `Создано: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Added\s+(.+)$/i,
        (_, value) =>
            `Добавлено: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Updated\s+(.+)$/i,
        (_, value) =>
            `Обновлено: ${
                translateDateValue(value)
            }`
    );

    /*
        Count + action.

        Examples:
        4 photos added
        17 people added
      */
    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+added$`,
            'i'
        ),
        (
            _,
            number,
            noun
        ) =>
            `Добавлено ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        /^(\d+)\s+added$/i,
        (_, number) =>
            `Добавлено: ${formatNumber(number)}`
    );

    /*
        Person / genealogy phrases
      */

    repl(
        /^Keep children with\s+(.+)$/i,
        (
            _,
            person
        ) =>
            `Оставить детей с: ${
                translateValue(person)
            }`
    );

    repl(
        /^This will remove\s+(.+?)\s+as\s+(.+?)[’']s parent\. Neither person will be deleted\.$/i,
        (
            _,
            parent,
            child
        ) =>
            `Будет удалена связь «${
                translateValue(parent)
            } — родитель ${
                translateValue(child)
            }». Записи людей останутся в проекте.`
    );

    repl(
        /^This will remove\s+(.+?)\s+as\s+(.+?)[’']s child\. Neither person will be deleted\.$/i,
        (
            _,
            child,
            parent
        ) =>
            `Будет удалена связь «${
                translateValue(child)
            } — ребёнок ${
                translateValue(parent)
            }». Записи людей останутся в проекте.`
    );

    repl(
        /^This will remove the partner relationship between\s+(.+?)\s+and\s+(.+?)\. Neither person will be deleted\.(?:\s+(Choose which parent should keep the children after unlinking\.))?$/i,
        (
            _,
            firstPerson,
            secondPerson,
            childDecision
        ) =>
            `Партнёрская связь между «${
                translateValue(firstPerson)
            }» и «${
                translateValue(secondPerson)
            }» будет удалена. Записи людей останутся в проекте.${
                childDecision
                    ? ' Выберите родителя, с которым останутся дети после удаления связи.'
                    : ''
            }`
    );

    repl(
        /^Born:?\s+(.+?)\s*\((living person|deceased)\)$/i,
        (
            _,
            date,
            status
        ) =>
        {
            const statusKey =
                status.toLowerCase()
              === 'deceased'
                    ? 'Deceased'
                    : 'Living';

            return `Рождение: ${
                translateDateValue(date)
            } · ${
                translateValue(
                    statusKey
                )
            }`;
        }
    );

    repl(
        /^Born:?\s+(.+)$/i,
        (_, value) =>
            `Рождение: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Died:?\s+(.+)$/i,
        (_, value) =>
            `Смерть: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^(\d+)\s+relationships?$/i,
        (_, number) =>
            `${formatNumber(number)} родственных связей`
    );

    repl(
        /^(\d+)\s+items?$/i,
        (_, number) =>
            `${formatNumber(number)} элементов`
    );

    repl(
        /^(\d+)\s+linked records?(?:\s+·\s+Updated\s+(.+))?$/i,
        (_, number, date) =>
            `${formatNumber(number)} связанных записей${
                date
                    ? ` · Обновлено ${translateDateValue(date)}`
                    : ''
            }`
    );

    repl(
        /^(\d+)\s+connected events?$/i,
        (_, number) =>
            `${formatNumber(number)} связанных событий`
    );

    repl(
        /^(.+?)\s+\((\d+)\)$/,
        (_, value, number) =>
            `${translateValue(value)} (${formatNumber(number)})`
    );

    repl(
        /^(About|After|Before)\s+(.+)$/i,
        (_, qualifier, value) =>
        {
            const labels = {
                about: 'Около',
                after: 'После',
                before: 'До'
            };

            return `${labels[qualifier.toLowerCase()]} ${translateDateValue(value)}`;
        }
    );

    repl(
        /^Child of\s+(.+)\s+and\s+(.+)$/i,
        (_, first, second) =>
            `Родители ${
                translateValue(first)
            } и ${
                translateValue(second)
            }`
    );

    repl(
        /^Child of unknown parents$/i,
        () =>
            'Родители не указаны'
    );

    repl(
        /^Child of\s+(.+)$/i,
        (_, parent) =>
            `Родитель: ${
                translateValue(parent)
            }`
    );

    repl(
        /^Father of\s+(.+)$/i,
        (_, person) =>
            `Отец ${
                translateValue(person)
            }`
    );

    repl(
        /^Mother of\s+(.+)$/i,
        (_, person) =>
            `Мать ${
                translateValue(person)
            }`
    );

    repl(
        /^Parent of\s+(.+)$/i,
        (_, person) =>
            `Родитель ${
                translateValue(person)
            }`
    );

    /*
        Project-copy names.
      */

    repl(
        /^(.+?)\s+copy(?:\s+(\d+))?$/i,
        (
            _,
            value,
            suffix
        ) =>
            `Копия «${
                translateValue(value)
            }»${
                suffix
                    ? ` ${suffix}`
                    : ''
            }`
    );

    /*
        Add-to-album modal counts.
      */

    repl(
        new RegExp(
            `^(\\d+)\\s+selected\\s+(${countNouns})$`,
            'i'
        ),
        (_, number, noun) =>
            `Выбрано: ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+selected\\s*·\\s*(\\d+)\\s+(${countNouns})\\s+chosen$`,
            'i'
        ),
        (
            _,
            firstCount,
            firstNoun,
            secondCount,
            secondNoun
        ) =>
            `Выбрано: ${
                countPhrase(
                    firstCount,
                    firstNoun
                )
            } · Выбрано: ${
                countPhrase(
                    secondCount,
                    secondNoun
                )
            }`
    );

    repl(
        /^Add to\s+(\d+)\s+(albums?)$/i,
        (_, number, noun) =>
            `Добавить в ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        /^(\d+)\s+of\s+(\d+)\s+already added$/i,
        (_, existing, total) =>
            `Уже добавлено: ${
                formatNumber(existing)
            } из ${
                formatNumber(total)
            }`
    );

    /*
        Dynamic accessible labels / actions.
      */

    repl(
        /^Preview of\s+(.+?)\s+cover$/i,
        (_, value) =>
            `Предпросмотр обложки проекта «${
                translateValue(value)
            }»`
    );

    repl(
        /^Open\s+(.+?)\s+(Projects|Family Tree|People|Geneograph|Albums|Archive|Notes|Places|Publish)\s+activity$/i,
        (
            _,
            project,
            module
        ) =>
            `Открыть действия: ${
                translateValue(project)
            } · ${
                translateValue(module)
            }`
    );

    repl(
        /^Open\s+(Projects|Family Tree|People|Geneograph|Albums|Archive|Notes|Places|Publish)\s+for\s+(.+)$/i,
        (
            _,
            module,
            context
        ) =>
            `Открыть ${
                translateValue(module)
            }: ${
                translateValue(context)
            }`
    );

    repl(
        /^Actions for\s+(.+)$/i,
        (_, value) =>
            `Действия: ${translateValue(value)}`
    );

    repl(
        /^More actions for\s+(.+)$/i,
        (_, value) =>
            `Другие действия: ${translateValue(value)}`
    );

    repl(
        /^Add\s+(father|mother)\s+for\s+(.+)$/i,
        (_, relation, value) =>
            `Добавить ${
                relation.toLowerCase() === 'father'
                    ? 'отца'
                    : 'мать'
            } для ${translateValue(value)}`
    );

    repl(
        /^Remove photo from\s+(.+)$/i,
        (_, value) =>
            `Удалить фотографию из альбома «${translateValue(value)}»`
    );

    repl(
        /^Open full-size preview of\s+(.+)$/i,
        (_, value) =>
            `Открыть полноразмерный просмотр: ${translateValue(value)}`
    );

    repl(
        /^Open profile for\s+(.+)$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Open\s+(.+?)\s+profile$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Open\s+(.+?)\s+in\s+(Archive|Albums|Notes|Places)$/i,
        (_, value, module) =>
            `Открыть ${translateValue(value)} в разделе «${translateValue(module)}»`
    );

    repl(
        /^Open review for\s+(.+)$/i,
        (_, value) =>
            `Открыть проверку: ${translateValue(value)}`
    );

    repl(
        /^(?:Add|Change) photo for\s+(.+)$/i,
        (_, value) =>
            `Изменить фотографию: ${translateValue(value)}`
    );

    repl(
        /^Age:\s*(\d+)$/i,
        (_, number) =>
            `Возраст: ${formatNumber(number)}`
    );

    repl(
        /^From\s+(.+)$/i,
        (_, value) =>
            `С ${translateDateValue(value)}`
    );

    repl(
        /^With\s+(.+)$/i,
        (_, value) =>
            `С ${translateValue(value)}`
    );

    repl(
        /^Unlink\s+(?!.*\s+from this board person$)(.+)$/i,
        (_, value) =>
            `Удалить связь ${translateValue(value)}`
    );

    repl(
        /^Edit relationship with\s+(.+)$/i,
        (_, value) =>
            `Изменить связь с ${translateValue(value)}`
    );

    repl(
        /^(Photos|Notes)\s+(?:for|linked to)\s+(.+)$/i,
        (_, kind, value) =>
            `${translateValue(kind)}: ${translateValue(value)}`
    );

    repl(
        /^Open note:\s*(.+)$/i,
        (_, value) =>
            `Открыть заметку: ${translateValue(value)}`
    );

    repl(
        /^(Hide|Show|Lock|Unlock)\s+(.+)$/i,
        (_, action, value) =>
        {
            const labels = {
                hide: 'Скрыть',
                show: 'Показать',
                lock: 'Заблокировать',
                unlock: 'Разблокировать'
            };

            return `${labels[action.toLowerCase()]}: ${translateValue(value)}`;
        }
    );

    repl(
        /^Draw\s+(.+)$/i,
        (_, value) =>
            `Нарисовать: ${translateValue(value)}`
    );

    repl(
        /^(?:Change|Edit)\s+(.+?)\s+color,\s*(#[0-9A-F]{6}),\s*(\d+)%\s+opacity$/i,
        (_, property, color, opacity) =>
        {
            const properties = {
                fill: 'заливку',
                stroke: 'обводку',
                text: 'текст',
                line: 'линию',
                background: 'фон',
                'title text': 'текст заголовка'
            };

            return `Изменить ${
                properties[property.toLowerCase()]
            || translateValue(property).toLowerCase()
            }: ${color}, непрозрачность ${opacity}%`;
        }
    );

    repl(
        /^(Remove|Restore)\s+(.+?)\s+color$/i,
        (_, action, property) =>
        {
            const properties = {
                fill: 'заливку',
                stroke: 'обводку',
                line: 'линию',
                background: 'фон'
            };
            const verb = action.toLowerCase() === 'remove'
                ? 'Убрать'
                : 'Восстановить';

            return `${verb} ${
                properties[property.toLowerCase()]
            || translateValue(property).toLowerCase()
            }`;
        }
    );

    repl(
        /^Edit\s+(.+?)\s+details$/i,
        (_, field) =>
        {
            const fields = {
                'birth date': 'дату рождения',
                'death date': 'дату смерти',
                'marriage date': 'дату брака',
                'divorce date': 'дату развода',
                'start date': 'дату начала',
                'end date': 'дату окончания'
            };

            return `Изменить ${
                fields[field.toLowerCase()]
            || translateValue(field).toLowerCase()
            }`;
        }
    );

    repl(
        /^This place is connected to\s+(\d+)\s+records?\s+but has no map position\.$/i,
        (_, number) =>
            `Это место связано с ${countPhrase(number, 'records')}, но не отмечено на карте.`
    );

    repl(
        /^Resize\s+(.+?)\s+from\s+(top|right|bottom|left)\s+edge$/i,
        (_, value, edge) =>
        {
            const labels = {
                top: 'верхнюю',
                right: 'правую',
                bottom: 'нижнюю',
                left: 'левую'
            };

            return `Изменить размер «${translateValue(value)}» за ${labels[edge.toLowerCase()]} границу`;
        }
    );

    repl(
        /^Resize\s+(.+?)\s+from\s+(nw|ne|se|sw)\s+corner$/i,
        (_, value, corner) =>
        {
            const labels = {
                nw: 'верхний левый',
                ne: 'верхний правый',
                se: 'нижний правый',
                sw: 'нижний левый'
            };

            return `Изменить размер «${translateValue(value)}» за ${labels[corner.toLowerCase()]} угол`;
        }
    );

    repl(
        /^Add relative to\s+(.+)$/i,
        (_, value) =>
            `Добавить родственника для ${translateValue(value)}`
    );

    repl(
        /^to\s+(.+)$/i,
        (_, value) =>
            `для ${translateValue(value)}`
    );

    repl(
        /^Create a new person and add as\s+(.+?)[\u2019']s\s+(father|mother|parent|son|daughter|child|brother|sister|partner|spouse|relative)$/i,
        (_, personName, relationship) =>
        {
            const labels = {
                father: 'отца',
                mother: 'мать',
                parent: 'родителя',
                son: 'сына',
                daughter: 'дочь',
                child: 'ребёнка',
                brother: 'брата',
                sister: 'сестру',
                partner: 'партнёра',
                spouse: 'супруга',
                relative: 'родственника'
            };

            return `Создать нового человека и добавить как ${labels[relationship.toLowerCase()]} для ${translateValue(personName)}`;
        }
    );

    repl(
        /^Find a person in this project and connect them to\s+(.+)\.$/i,
        (_, value) =>
            `Найдите человека в этом проекте и свяжите его с ${translateValue(value)}.`
    );

    repl(
        /^(.+?)\s+already has recorded parents\. The selected person will be connected as an additional parent\.$/i,
        (_, value) =>
            `У ${translateValue(value)} уже указаны родители. Выбранный человек будет добавлен как ещё один родитель.`
    );

    repl(
        /^Create a new person and connect as\s+(parent|child|partner)$/i,
        (_, relationship) =>
        {
            const labels = {
                parent: 'родителя',
                child: 'ребёнка',
                partner: 'партнёра'
            };

            return `Создать нового человека и привязать в качестве ${labels[relationship.toLowerCase()]}`;
        }
    );

    repl(
        /^(?:Change|Edit) Family Tree link for\s+(.+)$/i,
        (_, value) =>
            `Изменить связь с семейным древом: ${translateValue(value)}`
    );

    repl(
        /^(\d+)\s+of\s+(\d+)\s+complete$/i,
        (_, completed, total) =>
            `Выполнено ${formatNumber(completed)} из ${formatNumber(total)}`
    );

    repl(
        /^Complete\s+(.+)$/i,
        (_, value) =>
            `Отметить выполненным: ${translateValue(value)}`
    );

    repl(
        /^Remove\s+(.+?)\s+from this note$/i,
        (_, value) =>
            `Удалить «${translateValue(value)}» из этой заметки`
    );

    repl(
        /^Browse files and subfolders in\s+(.+)\.$/i,
        (_, value) =>
            `Файлы и вложенные папки: ${translateValue(value)}.`
    );

    repl(
        /^Go to\s+(.+?)\s+root$/i,
        (_, value) =>
            `Перейти в корень «${translateValue(value)}»`
    );

    repl(
        /^Close add\s+(.+?)\s+dialog$/i,
        (_, value) =>
            `Закрыть окно добавления: ${translateValue(value)}`
    );

    repl(
        /^View events for\s+(.+)$/i,
        (_, value) =>
            `Просмотреть события: ${translateValue(value)}`
    );

    repl(
        /^(.+?)\s+is already linked to this file$/i,
        (_, value) =>
            `«${translateValue(value)}» уже связано с этим файлом`
    );

    repl(
        /^(\d+)\s+recorded events$/i,
        (_, number) =>
            `Записано событий: ${formatNumber(number)}`
    );

    repl(
        /^(\d+)\s+notes available\s+·\s+(\d+)\s+already\s+(linked|selected)$/i,
        (_, available, existing, status) =>
            `Доступно заметок: ${formatNumber(available)} · ${
                status.toLowerCase() === 'selected'
                    ? 'уже выбрано'
                    : 'уже связано'
            }: ${formatNumber(existing)}`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+excluded$`,
            'i'
        ),
        (_, number, noun) =>
            `Исключено: ${countPhrase(number, noun)}`
    );

    repl(
        /^Unlink\s+(.+?)\s+from this board person$/i,
        (_, value) =>
            `Удалить связь «${translateValue(value)}» с человеком на холсте`
    );

    repl(
        /^Unlink\s+(.+?)\s+from this person$/i,
        (_, value) =>
            `Удалить связь «${translateValue(value)}» с этим человеком`
    );

    repl(
        /^Select\s+(.+)$/i,
        (_, value) =>
            `Выбрать: ${translateValue(value)}`
    );

    repl(
        /^Collapse\s+(.+)$/i,
        (_, value) =>
            `Свернуть: ${translateValue(value)}`
    );

    repl(
        /^Show\s+(.+)$/i,
        (_, value) =>
            `Показать: ${translateValue(value)}`
    );

    repl(
        /^View\s+(.+?)\s+profile$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Remove\s+(.+?)\s+from favourites$/i,
        (_, value) =>
            `Убрать из избранного: ${translateValue(value)}`
    );

    repl(
        /^Add\s+(.+?)\s+to favourites$/i,
        (_, value) =>
            `Добавить в избранное: ${translateValue(value)}`
    );

    repl(
        /^(Son|Daughter)\s+(.+)$/i,
        (_, relation, value) =>
            `${translateValue(relation)} ${translateValue(value)}`
    );

    /*
        Person-resource modal titles and descriptions.

        These rules must run before the generic /^Add ...$/
        fallback. Otherwise "Add photos for Name" becomes the
        mixed-language "Добавить: photos for Name".
      */

    repl(
        /^Add photos for\s+(.+)$/i,
        (_, personName) =>
            `Добавить фотографии — ${translateValue(personName)}`
    );

    repl(
        /^Add files to\s+(.+)$/i,
        (_, personName) =>
            `Добавить файлы — ${translateValue(personName)}`
    );

    repl(
        /^Link existing notes to\s+[“"](.+)[”"]\.$/i,
        (_, personName) =>
            `Связать существующие заметки с «${translateValue(personName)}».`
    );

    repl(
        /^Link existing notes to\s+(.+)\.$/i,
        (_, personName) =>
            `Связать существующие заметки с «${translateValue(personName)}».`
    );

    /*
        Generic CRUD fallbacks.

        Common UI actions should still have exact RU_UI
        pairs. These rules cover dynamically constructed
        labels that do not have an exact pair.
      */

    repl(
        /^Create\s+(.+)$/i,
        (_, value) =>
            `Создать ${
                translateValue(value)
            }`
    );

    repl(
        /^Add\s+(.+)$/i,
        (_, value) =>
            `Добавить ${
                translateValue(value)
            }`
    );

    repl(
        /^Edit\s+(.+)$/i,
        (_, value) =>
            `Изменить ${
                translateValue(value)
            }`
    );

    repl(
        /^Open\s+(.+)$/i,
        (_, value) =>
            `Открыть ${
                translateValue(value)
            }`
    );

    repl(
        /^Delete\s+(.+)\?$/i,
        (_, value) =>
            `Удалить «${
                translateValue(value)
            }»?`
    );

    /*
        Empty states
      */

    repl(
        /^No\s+(.+?)\s+found\.?$/i,
        (_, value) =>
            `Не найдено: ${
                translateValue(value)
            }`
    );

    repl(
        /^No\s+(.+?)\s+match(?:es)?\.?$/i,
        (_, value) =>
            `Нет совпадений: ${
                translateValue(value)
            }`
    );

    repl(
        /^No\s+(.+?)\s+yet\.?$/i,
        (_, value) =>
            `Пока нет: ${
                translateValue(value)
            }`
    );

    /*
        Prototype / placeholder messages
      */

    repl(
        /^(.+?)\s+will be added later\.?$/i,
        (_, value) =>
            `Будет добавлено позже: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+is simulated\.?$/i,
        (_, value) =>
            `Смоделировано: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+is a placeholder\.?$/i,
        (_, value) =>
            `Заглушка: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+flow is a visual placeholder\.?$/i,
        (_, value) =>
            `Сценарий «${
                translateValue(value)
            }» пока является визуальной заглушкой.`
    );

    repl(
        /^(.+?)\s+help would open here\.?$/i,
        (_, value) =>
            `Здесь откроется справка «${
                translateValue(value)
            }».`
    );

    repl(
        /^(.+?)\s+would open here\.?$/i,
        (_, value) =>
            `Здесь откроется: ${
                translateValue(value)
            }.`
    );

    if (
        /(?:\d.*\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b.*\d)/i
            .test(out)
    )
    {
        out = translateDateValue(out);
    }

    RU_EXACT_EMBEDDED_RULES
        .forEach(rule =>
        {
            rule.pattern.lastIndex = 0;
            out = out.replace(
                rule.pattern,
                (match, prefix) =>
                    `${prefix}${rule.translation}`
            );
        });

    const directTranslation =
        translateValue(out);

    if (
        directTranslation !== out
    )
    {
        out = directTranslation;
    }

    return translateCountPhrase(out);
}

function translateText(
    value
)
{
    if (
        state.language !== 'ru'
        || value == null
    )
    {
        return value;
    }

    const raw =
        String(value);

    const leading =
        raw.match(/^\s*/)[0];

    const trailing =
        raw.match(/\s*$/)[0];

    const core =
        raw
            .trim()
            .replace(/\s+/g, ' ');

    if (!core)
    {
        return raw;
    }

    let exact =
        localizationTextCache.get(
            core
        );

    if (exact === undefined)
    {
        exact =
            Object.prototype
                .hasOwnProperty.call(
                    RU_EXACT,
                    core
                )
                ? RU_EXACT[core]
                : translateDynamicPhrase(
                    core
                );

        cacheLocalizedText(
            core,
            exact
        );
    }

    return (
        leading
        + exact
        + trailing
    );
}

function translateAttributeValue(
    value
)
{
    if (
        state.language !== 'ru'
        || !value
    )
    {
        return value;
    }

    const source =
        String(value);

    if (
        isTechnicalLocalizationValue(
            source
        )
    )
    {
        return source;
    }

    return translateText(source);
}

/*
    * Database-backed editable controls need different
    * treatment from normal DOM text.
    *
    * Display the localized value, but retain the canonical
    * source value if the user saves without editing it.
    */
function localizedDataFieldValue(
    value
)
{
    const source =
        value == null
            ? ''
            : String(value);

    return state.language === 'ru'
        ? translateText(source)
        : source;
}

function collectLocalizedDataFieldValue(
    control,
    sourceValue
)
{
    const source =
        sourceValue == null
            ? ''
            : String(sourceValue);

    if (!control)
    {
        return source;
    }

    const current =
        String(
            control.value ?? ''
        );

    const localizedSource =
        localizedDataFieldValue(
            source
        );

    /*
      * If the rendered localized value was never changed,
      * return the original canonical database value.
      *
      * If the user actually edited it, return their edit.
      */
    return current
        === localizedSource
        ? source
        : current;
}

function applyLanguage()
{
    state.language =
        normalizeLang(
            state.language
          || localStorage.getItem(
              LANGUAGE_STORAGE_KEY
          )
          || 'en'
        );

    document.documentElement.lang =
        state.language;

    document.title =
        state.language === 'ru'
            ? translateText(
                DEFAULT_DOCUMENT_TITLE
            )
            : DEFAULT_DOCUMENT_TITLE;
}

function setLanguage(
    lang,
    rerender = true
)
{
    const next =
        normalizeLang(lang);

    if (
        state.language === next
    )
    {
        return;
    }

    state.language =
        next;

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        next
    );

    applyLanguage();

    if (rerender)
    {
        render();
    }
}

function shouldLocalizeTextNode(
    node
)
{
    if (
        !node
        || node.nodeType
          !== Node.TEXT_NODE
        || !node.nodeValue
            ?.trim()
    )
    {
        return false;
    }

    const parent =
        node.parentElement;

    if (!parent)
    {
        return false;
    }

    /*
      * Never mutate implementation content.
      */
    if (
        parent.closest(
            'script, style, svg, [data-i18n-skip]'
        )
    )
    {
        return false;
    }

    /*
      * Explicit user-authored content remains canonical.
      *
      * Geneograph layer names currently use this marker.
      */
    if (
        parent.closest(
            '[data-user-content]'
        )
    )
    {
        return false;
    }

    /*
      * Do not rewrite live editor models from the DOM.
      *
      * Textareas and rich-text editors must use the
      * localizedDataFieldValue pattern (or their own
      * model-level equivalent) instead.
      */
    if (
        parent.closest(
            'textarea, [contenteditable="true"]'
        )
    )
    {
        return false;
    }

    return true;
}

function localizeTextNode(
    node
)
{
    if (
        state.language !== 'ru'
        || !shouldLocalizeTextNode(
            node
        )
    )
    {
        return;
    }

    const parent =
        node.parentElement;

    const source =
        node.nodeValue;

    /*
      * An <option> without an explicit value normally
      * uses its visible text as its value.
      *
      * Preserve the original English value before
      * translating its label so application logic keeps
      * receiving its canonical enum.
      */
    if (
        parent?.tagName === 'OPTION'
        && !parent.hasAttribute(
            'value'
        )
    )
    {
        parent.setAttribute(
            'value',
            source.trim()
        );
    }

    const translated =
        translateText(source);

    /*
      * Important because MutationObserver also watches
      * characterData. Do not create another mutation when
      * nothing changed.
      */
    if (
        translated !== source
    )
    {
        node.nodeValue =
            translated;
    }
}

function localizeElementAttribute(
    element,
    attribute
)
{
    if (
        state.language !== 'ru'
        || !(element instanceof Element)
        || !LOCALIZABLE_DOM_ATTRIBUTES
            .includes(attribute)
        || element.closest(
            '[data-i18n-skip], [data-user-content]'
        )
        || !element.hasAttribute(
            attribute
        )
    )
    {
        return;
    }

    const source =
        element.getAttribute(
            attribute
        );

    const translated =
        translateAttributeValue(
            source
        );

    if (
        translated !== source
    )
    {
        element.setAttribute(
            attribute,
            translated
        );
    }
}

function localizeElementAttributes(
    element
)
{
    if (
        !(element instanceof Element)
    )
    {
        return;
    }

    LOCALIZABLE_DOM_ATTRIBUTES
        .forEach(attribute =>
        {
            localizeElementAttribute(
                element,
                attribute
            );
        });
}

const explicitlyLocalizedRoots =
    new Set();

function markLocalizationRootHandled(
    root
)
{
    if (
        !root
        || root.nodeType
          === Node.TEXT_NODE
    )
    {
        return;
    }

    explicitlyLocalizedRoots.add(
        root
    );

    queueMicrotask(() =>
    {
        explicitlyLocalizedRoots.delete(
            root
        );
    });
}

function localizationMutationIsHandled(
    node
)
{
    if (!node) return false;

    const target =
        node.nodeType
          === Node.TEXT_NODE
            ? node.parentNode
            : node;

    if (!target) return false;

    for (
        const root
        of explicitlyLocalizedRoots
    )
    {
        if (
            root === target
          || root.contains?.(target)
        )
        {
            return true;
        }
    }

    return false;
}

function localizeUI(
    root = document.body,
    {
        suppressObserverReplay = false
    } = {}
)
{
    applyLanguage();

    if (
        state.language !== 'ru'
        || !root
    )
    {
        return;
    }

    if (suppressObserverReplay)
    {
        markLocalizationRootHandled(
            root
        );
    }

    /*
      * MutationObserver can pass an individual Text node.
      * TreeWalker does not process its root as nextNode(),
      * so handle it explicitly.
      */
    if (
        root.nodeType
          === Node.TEXT_NODE
    )
    {
        localizeTextNode(root);
        return;
    }

    /*
      * querySelectorAll() does not include root itself.
      * The old implementation therefore missed attributes
      * on newly-added root elements.
      */
    if (
        root instanceof Element
    )
    {
        localizeElementAttributes(
            root
        );
    }

    const walker =
        document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT
        );

    const textNodes =
        [];

    while (
        walker.nextNode()
    )
    {
        textNodes.push(
            walker.currentNode
        );
    }

    textNodes.forEach(
        localizeTextNode
    );

    root.querySelectorAll?.(
        LOCALIZABLE_DOM_ATTRIBUTE_SELECTOR
    ).forEach(
        localizeElementAttributes
    );
}

// Centralized GEDCOM-style sample data for the prototype.

/*
      Source of truth
      ---------------
      People, family records, places, events, media links, and notes live in this
      centralized in-file model. Family Tree and People derive their display data
      from this structure rather than legacy module arrays.
    */
