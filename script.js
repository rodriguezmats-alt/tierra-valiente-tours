// ============================================
// TIERRA VALIENTE TOURS
// JavaScript principal - Edición Completa y Corregida
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // MENÚ MÓVIL
  // ============================================
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navigation = document.querySelector('#main-navigation');
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const sectionDialog = document.querySelector('#menu-section-dialog');
  const sectionDialogContent = document.querySelector('#menu-section-dialog-content');
  const sectionDialogTitle = document.querySelector('#menu-section-title');
  const sectionDialogClose = document.querySelector('#menu-section-dialog-close');
  const siteHeader = document.querySelector('.site-header');
  const whatsappMessages = new Map(
    [...document.querySelectorAll('a[href*="wa.me/"]')]
      .map((link) => {
        const url = new URL(link.href);
        const message = url.searchParams.get('text');
        return message ? [link, message] : null;
      })
      .filter(Boolean)
  );
  const updateWhatsAppLinks = () => {
    whatsappMessages.forEach((message, link) => {
      const url = new URL(link.href);
      url.searchParams.set('text', window.TIERRA_VALIENTE_I18N?.translate(message) || message);
      link.href = url.toString();
    });
  };

  document.addEventListener('tierralanguagechange', updateWhatsAppLinks);

  const languageService = window.TIERRA_VALIENTE_I18N;
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const languagePreferenceKey = 'tierra-valiente-language';

  if (!languageService) {
    console.error('No se pudo iniciar el selector de idioma.');
    languageButtons.forEach((button) => {
      button.disabled = true;
    });
  } else {
    let preferredLanguage = 'es';
    try {
      const storedLanguage = window.localStorage.getItem(languagePreferenceKey);
      if (storedLanguage === 'es' || storedLanguage === 'en') preferredLanguage = storedLanguage;
    } catch (error) {
      console.error('No se pudo leer la preferencia de idioma guardada:', error);
    }

    languageService.applyLanguage(preferredLanguage);
    languageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selectedLanguage = button.dataset.language;
        languageService.applyLanguage(selectedLanguage);
        try {
          window.localStorage.setItem(languagePreferenceKey, selectedLanguage);
        } catch (error) {
          console.error('No se pudo guardar la preferencia de idioma:', error);
        }
      });
    });
  }

  const updateHeaderDensity = () => {
    siteHeader?.classList.toggle('is-compact', window.scrollY > 24);
  };

  window.addEventListener('scroll', updateHeaderDensity, { passive: true });
  updateHeaderDensity();

  const floatingWhatsappLink = document.querySelector('.floating-whatsapp');
  const gallerySection = document.querySelector('#galeria');

  if (floatingWhatsappLink && gallerySection && 'IntersectionObserver' in window) {
    const galleryVisibilityObserver = new IntersectionObserver(([entry]) => {
      floatingWhatsappLink.classList.toggle('is-obscured', entry.isIntersecting);
    });

    galleryVisibilityObserver.observe(gallerySection);
  }

  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  if (revealTargets.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.body.classList.add('has-reveal');
    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-revealed'));
  }

  // Las secciones se mueven temporalmente al panel fijo; así el documento principal no se desplaza.
  const sections = navLinks
    .map((link) => {
      const target = link.getAttribute('href');
      return target && target.startsWith('#') ? document.querySelector(target) : null;
    })
    .filter((el) => el !== null);
  const experienceValues = document.querySelector('.values-section');
  const relatedSections = new Map(
    experienceValues
      ? [[document.querySelector('#experiencias'), [experienceValues]]]
      : []
  );
  const managedSections = [...new Set([...sections, ...relatedSections.values()].flat())];
  const sectionPlaceholders = new Map();
  let activeSection = null;
  let activeRelatedSections = [];
  let lockedScrollY = 0;

  const loadSectionImages = (section) => {
    section.querySelectorAll('img[data-deferred-src]').forEach((image) => {
      image.src = image.dataset.deferredSrc;
      delete image.dataset.deferredSrc;
    });
  };

  const lockPageScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };

  const unlockPageScroll = () => {
    const scrollY = lockedScrollY;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    const restoreScroll = () => window.scrollTo(0, scrollY);
    document.documentElement.style.scrollBehavior = 'auto';
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    window.setTimeout(() => {
      restoreScroll();
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    }, 50);
  };

  managedSections.forEach((section) => {
    const placeholder = document.createComment(`Lugar original de ${section.id}`);
    section.parentNode?.insertBefore(placeholder, section);
    sectionPlaceholders.set(section, placeholder);
    if (section.id !== 'inicio') {
      section.querySelectorAll('img[src]').forEach((image) => {
        image.dataset.deferredSrc = image.getAttribute('src');
        image.removeAttribute('src');
      });
      section.hidden = true;
    }
  });

  const toggleMenu = (isOpen) => {
    menuToggle?.setAttribute('aria-expanded', String(isOpen));
    navigation?.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    toggleMenu(!isOpen);
  });

  const setActiveNavLink = (activeLink) => {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const restoreActiveSection = () => {
    if (!activeSection) return;

    activeRelatedSections.forEach((section) => {
      const placeholder = sectionPlaceholders.get(section);
      if (placeholder?.parentNode) {
        placeholder.parentNode.insertBefore(section, placeholder.nextSibling);
      }
      section.hidden = true;
    });

    const placeholder = sectionPlaceholders.get(activeSection);
    if (placeholder?.parentNode) {
      placeholder.parentNode.insertBefore(activeSection, placeholder.nextSibling);
    }

    if (activeSection.id !== 'inicio') activeSection.hidden = true;
    activeSection = null;
    activeRelatedSections = [];
  };

  const closeSectionDialog = () => {
    if (!activeSection && !sectionDialog?.open && !document.body.classList.contains('menu-section-dialog-open')) return;

    restoreActiveSection();
    document.body.classList.remove('menu-section-dialog-open');
    if (sectionDialog?.open) sectionDialog.close();
    unlockPageScroll();
  };

  const openSectionDialog = (link) => {
    const targetSelector = link.getAttribute('href');
    const targetSection = targetSelector ? document.querySelector(targetSelector) : null;

    if (!targetSection || !sectionDialog || !sectionDialogContent) return;

    closeSectionDialog();
    lockPageScroll();
    activeSection = targetSection;
    activeSection.hidden = false;
    activeSection.classList.add('is-revealed');
    sectionDialogContent.append(activeSection);
    loadSectionImages(activeSection);
    activeSection.querySelectorAll('video[autoplay]').forEach((video) => {
      video.muted = true;
      video.play().catch(() => {});
    });
    activeRelatedSections = relatedSections.get(activeSection) || [];
    activeRelatedSections.forEach((section) => {
      section.hidden = false;
      section.classList.add('is-revealed');
      sectionDialogContent.append(section);
      loadSectionImages(section);
    });
    sectionDialogTitle.textContent = link.textContent.trim();
    setActiveNavLink(link);
    document.body.classList.add('menu-section-dialog-open');

    if (typeof sectionDialog.showModal === 'function') {
      sectionDialog.showModal();
    } else {
      sectionDialog.setAttribute('open', '');
    }

    sectionDialogClose?.focus();
  };

  document.addEventListener('tierralanguagechange', () => {
    if (!activeSection || !sectionDialogTitle) return;

    const activeLink = navLinks.find((link) => link.getAttribute('href') === `#${activeSection.id}`);
    if (activeLink) sectionDialogTitle.textContent = activeLink.textContent.trim();
  });

  // Las opciones del menú abren paneles de contenido y evitan el desplazamiento de la página.
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      toggleMenu(false);

      if (link.getAttribute('href') === '#inicio') {
        closeSectionDialog();
        setActiveNavLink(link);
        document.querySelector('#inicio')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      openSectionDialog(link);
    });
  });

  sectionDialogClose?.addEventListener('click', closeSectionDialog);

  sectionDialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSectionDialog();
  });

  sectionDialog?.addEventListener('click', (event) => {
    if (event.target === sectionDialog) closeSectionDialog();
  });

  // Los enlaces internos siguen funcionando dentro del panel sin romper la navegación.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.closest('.main-nav')) return;

    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    if (sectionDialog?.open && sectionDialogContent?.contains(target)) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const targetNavLink = navLinks.find((navLink) => navLink.getAttribute('href') === `#${target.id}`);
    const parentNavLink = targetNavLink ? null : navLinks.find((navLink) => {
      const parent = document.querySelector(navLink.getAttribute('href'));
      return parent && parent !== target && parent.id !== 'inicio' && parent.contains(target);
    });

    if (parentNavLink) {
      event.preventDefault();
      openSectionDialog(parentNavLink);
      if (target.matches('details')) target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    if (targetNavLink && target.id !== 'inicio') {
      event.preventDefault();
      openSectionDialog(targetNavLink);
      return;
    }

    if (sectionDialog?.open) {
      closeSectionDialog();
    }
  });

  document.addEventListener('click', (event) => {
    if (!navigation || !menuToggle || !navigation.classList.contains('is-open')) return;
    if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (lightbox?.open) return;

    if (sectionDialog?.open) {
      event.preventDefault();
      closeSectionDialog();
      return;
    }

    if (navigation?.classList.contains('is-open')) {
      toggleMenu(false);
      menuToggle?.focus();
    }
  });

  // La opción activa se actualiza al abrir cada panel del menú.

  // ============================================
  // BÚSQUEDA DE EXPERIENCIAS Y RESERVAS
  // ============================================
  const tripSearchForm = document.querySelector('#trip-search');
  const tripOrigin = document.querySelector('#trip-origin');
  const tripDestination = document.querySelector('#trip-destination');
  const tripDate = document.querySelector('#trip-date');
  const tripTravelers = document.querySelector('#trip-travelers');
  const tripSearchStatus = document.querySelector('#trip-search-status');
  const tripCards = [...document.querySelectorAll('.destination-card[data-destination]')];
  const bookingButtons = [...document.querySelectorAll('[data-booking-destination]')];
  const contactNavLink = navLinks.find((link) => link.getAttribute('href') === '#contacto');
  const destinationsNavLink = navLinks.find((link) => link.getAttribute('href') === '#destinos');
  const contactDestination = document.querySelector('#destino');
  const contactTravelers = document.querySelector('#viajeros');
  const contactDate = document.querySelector('#fecha-viaje');
  const contactMessage = document.querySelector('#mensaje');

  let tripSearchState = null;
  const renderTripSearchResult = () => {
    if (!tripSearchState || !tripSearchStatus) return;

    const isEnglish = window.TIERRA_VALIENTE_I18N?.currentLanguage() === 'en';
    if (!tripSearchState.foundCount) {
      tripSearchStatus.textContent = isEnglish
        ? 'We could not find an experience matching those criteria. Try another destination.'
        : 'No encontramos una experiencia con esos criterios. Prueba con otro destino.';
      return;
    }

    const count = tripSearchState.foundCount;
    const destinationLabel = tripSearchState.selectedDestination
      ? [...(tripDestination?.options || [])].find((option) => option.value === tripSearchState.selectedDestination)?.textContent
      : isEnglish ? 'all destinations' : 'todos los destinos';
    const originLabel = tripSearchState.origin
      ? `${isEnglish ? ' from ' : ' desde '}${tripSearchState.origin}`
      : '';
    const locale = window.TIERRA_VALIENTE_I18N?.locale() || 'es-GT';
    const date = tripSearchState.date
      ? new Date(`${tripSearchState.date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
      : '';
    const dateLabel = date ? `${isEnglish ? ' for ' : ' para el '}${date}` : '';
    const travelerLabel = [...(tripTravelers?.options || [])]
      .find((option) => option.value === tripSearchState.travelers)?.textContent;
    const travelersLabel = travelerLabel
      ? ` · ${travelerLabel}`
      : '';
    const resultLabel = count === 1
      ? isEnglish ? 'experience found' : 'experiencia encontrada'
      : isEnglish ? 'experiences found' : 'experiencias encontradas';
    const availability = isEnglish
      ? 'Availability will be confirmed when we receive your request.'
      : 'La disponibilidad se confirma al recibir tu solicitud.';

    tripSearchStatus.textContent = `${count} ${resultLabel} ${isEnglish ? 'in' : 'en'} ${destinationLabel}${originLabel}${dateLabel}${travelersLabel}. ${availability}`;
  };

  const getGuatemalaDate = () => {
    const dateParts = Object.fromEntries(
      new Intl.DateTimeFormat('en', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date()).map(({ type, value }) => [type, value])
    );

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  };

  const minimumTripDate = getGuatemalaDate();
  if (tripDate) tripDate.min = minimumTripDate;
  if (contactDate) contactDate.min = minimumTripDate;

  const translate = (value) => window.TIERRA_VALIENTE_I18N?.translate(value) || value;

  tripSearchForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedDestination = tripDestination?.value || '';
    const visibleCards = tripCards.filter((card) => !selectedDestination || card.dataset.destination === selectedDestination);

    tripCards.forEach((card) => {
      card.hidden = selectedDestination !== '' && card.dataset.destination !== selectedDestination;
      card.classList.toggle('is-recommended', visibleCards.length === 1 && visibleCards.includes(card));
    });

    tripSearchState = {
      foundCount: visibleCards.length,
      selectedDestination,
      origin: tripOrigin?.value.trim() || '',
      date: tripDate?.value || '',
      travelers: tripTravelers?.value || ''
    };
    renderTripSearchResult();
  });

  let generatedQuote = null;

  const updateGeneratedQuote = () => {
    if (!generatedQuote || !contactMessage) return;

    const originText = generatedQuote.origin ? ` ${translate('Saldríamos desde')} ${generatedQuote.origin}.` : '';
    const dateText = generatedQuote.date ? ` ${translate('Fecha tentativa')}: ${generatedQuote.date}.` : '';
    contactMessage.value = `${translate('Me interesa solicitar una cotización personalizada para')} ${translate(generatedQuote.destination)}.${originText}${dateText}`;
  };

  const fillBookingForm = (destination) => {
    generatedQuote = {
      destination,
      origin: tripOrigin?.value.trim() || '',
      date: tripDate?.value || ''
    };

    if (contactDestination) {
      const destinationLabels = [destination, translate(destination)].map(normalizeText).filter(Boolean);
      const destinationOptions = [...contactDestination.options];
      const exactOption = destinationOptions.find((item) => destinationLabels.includes(normalizeText(item.textContent)));
      const option = exactOption || destinationOptions.find((item) => {
        const optionLabel = normalizeText(item.textContent);
        return destinationLabels.some((label) => optionLabel.includes(label) || label.includes(optionLabel));
      });
      if (option) contactDestination.value = option.value;
    }

    if (contactTravelers && tripTravelers?.value) {
      const travelerValue = tripTravelers.value;
      contactTravelers.value = travelerValue === '1' ? '1 persona' : travelerValue === '2' ? '2 personas' : travelerValue === '3-5' ? '3 a 5 personas' : 'Más de 5 personas';
    }

    if (contactDate && tripDate?.value) contactDate.value = tripDate.value;

    updateGeneratedQuote();
  };

  contactMessage?.addEventListener('input', () => {
    generatedQuote = null;
  });
  document.addEventListener('tierralanguagechange', () => {
    updateGeneratedQuote();
    renderTripSearchResult();
  });

  bookingButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!contactNavLink) return;
      fillBookingForm(button.dataset.bookingDestination || '');
      openSectionDialog(contactNavLink);
    });
  });

  // ============================================
  // PROGRESO DE LECTURA Y BUSCADOR DE EXPERIENCIAS
  // ============================================
  const progressBar = document.querySelector('.scroll-progress');
  const updateScrollProgress = () => {
    if (!progressBar) return;

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  const finderForm = document.querySelector('#hero-finder');
  const finderInput = document.querySelector('#experience-search');
  const finderStatus = document.querySelector('#finder-status');
  const destinationSection = document.querySelector('#destinos');
  const destinationCards = [...document.querySelectorAll('.destination-card')];
  const finderAliases = {
    naturaleza: ['naturaleza', 'agua', 'selva', 'lago', 'rio'],
    cultura: ['cultura', 'maya', 'historia', 'colonial', 'patrimonio'],
    aventura: ['aventura', 'montaña', 'volcan', 'trekking', 'selva'],
    montaña: ['montaña', 'volcan', 'acatenango', 'trekking'],
    agua: ['agua', 'lago', 'rio', 'semuc', 'atitlan'],
    cultural: ['cultura', 'maya', 'historia', 'colonial']
  };

  const normalizeText = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const updateFinderResults = (query, shouldScroll = false) => {
    const normalizedQuery = normalizeText(query.trim());

    if (!normalizedQuery) {
      destinationCards.forEach((card) => card.classList.remove('is-recommended'));
      if (finderStatus) finderStatus.textContent = '';
      return [];
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const expandedTokens = tokens.flatMap((token) => finderAliases[token] || [token]);
    const matches = destinationCards.filter((card) => {
      const searchableText = normalizeText(`${card.dataset.keywords || ''} ${card.textContent}`);
      return expandedTokens.some((token) => searchableText.includes(normalizeText(token)));
    });

    destinationCards.forEach((card) => {
      card.classList.toggle('is-recommended', matches.includes(card));
    });

    if (finderStatus) {
      finderStatus.textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? 'experiencia relacionada' : 'experiencias relacionadas'} con “${query.trim()}”.`
        : 'No encontramos una coincidencia exacta. Prueba con naturaleza, cultura o aventura.';
    }

    if (shouldScroll) {
      if (destinationsNavLink && destinationSection?.hidden) {
        openSectionDialog(destinationsNavLink);
      } else {
        destinationSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    return matches;
  };

  finderInput?.addEventListener('input', () => {
    updateFinderResults(finderInput.value);
  });

  finderForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateFinderResults(finderInput?.value || '', true);
  });

  // ============================================
  // LIGHTBOX
  // ============================================
  const lightbox = document.querySelector('#gallery-lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxTitle = document.querySelector('#lightbox-title');
  const lightboxDescription = document.querySelector('#lightbox-description');
  const lightboxCategory = document.querySelector('#lightbox-category');
  const lightboxInfoToggle = document.querySelector('#lightbox-info-toggle');
  const lightboxCopy = document.querySelector('#lightbox-details');
  const lightboxCopyright = document.querySelector('#lightbox-copyright');
  const lightboxSource = document.querySelector('#lightbox-source');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrevious = document.querySelector('.lightbox-previous');
  const lightboxNext = document.querySelector('.lightbox-next');
  const lightboxCounter = document.querySelector('#lightbox-counter');
  const galleryGrid = document.querySelector('#gallery-grid');
  const galleryFilters = document.querySelector('#gallery-filters');
  const gallerySearch = document.querySelector('#gallery-search');
  const galleryResultCount = document.querySelector('#gallery-result-count');
  const galleryEmpty = document.querySelector('#gallery-empty');
  const galleryLoadMore = document.querySelector('#gallery-load-more');
  const galleryPageSize = 18;
  const galleryCategoryOrder = [
    'Atitlán y naturaleza',
    'Rostro Maya y aventura',
    'Pueblos y cultura',
    'Sabores locales',
    'Naturaleza y experiencias',
    'Personas y experiencias',
    'Otros destinos'
  ];
  const galleryDuplicatePhotoIds = new Set([
    '013-amaneceres-impresionantes-jpg',
    '028-avejas-mays1',
    '047-comida2',
    '075-mirador-3',
    '078-mirador',
    '091-paisajes-lago-jpg',
    '097-paseos-pueblos',
    '100-postal-2',
    '103-postal-lancha',
    '104-postal-turista',
    '105-postal3',
    '106-postal4',
    '123-rostro-maya-jpg',
    '142-turistas',
    '143-turistas2',
    '153-volcanes-fondo'
  ]);
  const galleryEditorialTitleThemes = {
    lake: {
      bases: [['Atitlán, donde el tiempo se aquieta', 'Atitlán, where time slows down'], ['El lago de los siete colores', 'The lake of seven colors'], ['Volcanes que abrazan el horizonte', 'Volcanoes embracing the horizon'], ['Una mirada serena a Atitlán', 'A peaceful view of Atitlán'], ['El corazón azul de Guatemala', 'Guatemala’s blue heart'], ['La calma vive junto al lago', 'Calm lives by the lake'], ['Entre volcanes y aguas profundas', 'Between volcanoes and deep waters'], ['Un rincón para mirar sin prisa', 'A place to take in without rushing']],
      endings: [['entre agua y volcanes', 'between water and volcanoes'], ['un paisaje que permanece', 'a landscape to remember'], ['la esencia del altiplano', 'the spirit of the highlands'], ['donde cada orilla cuenta', 'where every shore has a story'], ['una invitación a explorar', 'an invitation to explore'], ['la belleza de lo cotidiano', 'beauty in the everyday'], ['un horizonte que inspira', 'an inspiring horizon']]
    },
    dawn: {
      bases: [['El lago despierta', 'The lake awakens'], ['Primeras luces sobre Atitlán', 'First light over Atitlán'], ['Un alba para recordar', 'A sunrise to remember']],
      endings: [['entre volcanes', 'among the volcanoes'], ['junto al agua', 'by the water']]
    },
    dusk: {
      bases: [['La hora dorada del lago', 'The lake at golden hour'], ['Atitlán al caer la tarde', 'Atitlán at dusk']],
      endings: [['un instante de calma', 'a moment of calm'], ['cielo encendido', 'beneath a glowing sky']]
    },
    boats: {
      bases: [['Rumbo a la otra orilla', 'Across the lake'], ['Atitlán en movimiento', 'Atitlán in motion'], ['Una travesía entre volcanes', 'A journey between volcanoes'], ['La vida sigue el ritmo del lago', 'Life moves to the lake’s rhythm'], ['Pueblos unidos por el agua', 'Villages connected by water'], ['El lago desde la lancha', 'The lake from the boat']],
      endings: [['una ruta para descubrir', 'a route waiting to be explored'], ['paisajes que enamoran', 'scenery to fall in love with'], ['un viaje entre pueblos', 'a journey between villages']]
    },
    highland: {
      bases: [['Atitlán a tus pies', 'Atitlán at your feet'], ['Una vista que recompensa el camino', 'A view worth the climb'], ['El paisaje desde Rostro Maya', 'The landscape from Rostro Maya'], ['Un mirador entre cielo y lago', 'A viewpoint between sky and lake'], ['El camino también es destino', 'The trail is part of the journey'], ['Aventura con vista al lago', 'Adventure with a lake view'], ['La cumbre revela otro horizonte', 'The summit reveals another horizon'], ['Senderos que conducen a grandes vistas', 'Trails that lead to sweeping views']],
      endings: [['volcanes en el horizonte', 'volcanoes on the horizon'], ['una cima para recordar', 'a summit to remember'], ['una ruta que inspira', 'an inspiring route'], ['Guatemala desde otra perspectiva', 'Guatemala from a different perspective'], ['el premio de llegar más alto', 'the reward of reaching higher'], ['un paisaje que invita a continuar', 'a landscape that invites you onward']]
    },
    cacao: {
      bases: [['Cacao: una historia para saborear', 'Cacao: a story to savor'], ['Del grano a la tradición', 'From bean to tradition'], ['El sabor profundo de Guatemala', 'The rich flavors of Guatemala'], ['Un viaje al origen del chocolate', 'A journey to chocolate’s roots']],
      endings: [['saberes mayas', 'Maya knowledge'], ['hecho con historia', 'steeped in history'], ['una experiencia sensorial', 'a sensory experience']]
    },
    coffee: {
      bases: [['Café con aroma de Atitlán', 'Coffee with the aroma of Atitlán'], ['Una pausa con sabor local', 'A pause with local flavor'], ['El café también cuenta historias', 'Coffee has stories to tell']],
      endings: [['entre montañas', 'among the mountains'], ['servido sin prisa', 'served without a rush']]
    },
    bees: {
      bases: [['Pequeñas guardianas del paisaje', 'Small guardians of the landscape'], ['El dulce mundo de las abejas', 'The sweet world of native bees'], ['Naturaleza que también produce miel', 'Nature that brings its own sweetness']],
      endings: [['biodiversidad local', 'local biodiversity'], ['una visita con propósito', 'a meaningful visit']]
    },
    textiles: {
      bases: [['Hilos que guardan una historia', 'Threads that hold a story'], ['El arte de tejer en Atitlán', 'The art of weaving in Atitlán'], ['Tradición que se lleva puesta', 'Tradition woven to wear']],
      endings: [['manos que crean', 'made by hand'], ['color con identidad', 'color with identity']]
    },
    art: {
      bases: [['Calles que florecen en color', 'Streets blooming with color'], ['El arte vive en cada rincón', 'Art lives around every corner'], ['Una galería a cielo abierto', 'An open-air gallery'], ['Colores que cuentan historias', 'Colors that tell stories']],
      endings: [['el encanto de los pueblos', 'the charm of the villages'], ['una parada con carácter', 'a stop with character'], ['San Juan en sus detalles', 'San Juan in its details']]
    },
    cacao: {
      bases: [['Cacao: una historia para saborear', 'Cacao: a story to savor'], ['Del grano a la tradición', 'From bean to tradition'], ['El sabor profundo de Guatemala', 'The rich flavors of Guatemala'], ['Un viaje al origen del chocolate', 'A journey to chocolate’s roots']],
      endings: [['saberes mayas', 'Maya knowledge'], ['hecho con historia', 'steeped in history'], ['una experiencia sensorial', 'a sensory experience']]
    },
    coffee: {
      bases: [['Café con aroma de Atitlán', 'Coffee with the aroma of Atitlán'], ['Una pausa con sabor local', 'A pause with local flavor'], ['El café también cuenta historias', 'Coffee has stories to tell']],
      endings: [['entre montañas', 'among the mountains'], ['servido sin prisa', 'served without a rush']]
    },
    culture: {
      bases: [['Guatemala en sus pequeños detalles', 'Guatemala in the little details'], ['Una tradición por descubrir', 'A tradition waiting to be discovered'], ['Colores que cuentan historias', 'Colors that tell stories'], ['El encanto de lo auténtico', 'The charm of the authentic'], ['La vida del pueblo, paso a paso', 'Village life, one step at a time']],
      endings: [['cultura viva', 'living culture'], ['un paseo con sentido', 'a meaningful walk'], ['momentos para recordar', 'moments to remember']]
    },
    people: {
      bases: [['Los encuentros hacen el viaje', 'The people make the journey'], ['Guatemala se descubre en buena compañía', 'Discover Guatemala in good company'], ['Historias que se comparten', 'Stories worth sharing'], ['Una sonrisa en el camino', 'A smile along the way']],
      endings: [['momentos para recordar', 'moments to remember'], ['viajar con mirada local', 'travel with a local perspective']]
    },
    flavors: {
      bases: [['Sabores que cuentan Guatemala', 'Flavors that tell Guatemala’s story'], ['Una mesa llena de tradición', 'A table rich with tradition'], ['La cocina local, de cerca', 'A closer look at local cuisine']],
      endings: [['recetas con identidad', 'recipes with identity'], ['un gusto por descubrir', 'a flavor worth discovering']]
    },
    destinations: {
      bases: [['Guatemala, un viaje extraordinario', 'Guatemala, an extraordinary journey'], ['Paisajes para descubrir', 'Landscapes waiting to be explored'], ['La aventura comienza aquí', 'The adventure begins here'], ['Un destino que sorprende', 'A destination full of wonder'], ['Atitlán, una belleza que permanece', 'Atitlán, a beauty that stays with you']],
      endings: [['historia y naturaleza', 'history and nature'], ['una ruta inolvidable', 'an unforgettable route'], ['el encanto de Guatemala', 'the charm of Guatemala'], ['con todos los sentidos', 'with all your senses']]
    }
  };
  const getGalleryEditorialThemeKey = (photo) => {
    const subject = normalizeText(`${photo.id} ${photo.title}`);
    const isRostroMaya = photo.category === 'Rostro Maya y aventura';

    if (/001-lago-atitlan/.test(subject)) return 'lake';
    if (/amanecer/.test(subject)) return 'dawn';
    if (/atardecer/.test(subject)) return 'dusk';
    if (isRostroMaya) return 'highland';
    if (/lancha|lanchero|embarcadero|paseos/.test(subject)) return 'boats';
    if (/cacao|chocol/.test(subject)) return 'cacao';
    if (/cafe|cafecito/.test(subject)) return 'coffee';
    if (/abej/.test(subject)) return 'bees';
    if (/textil|tejido|tejed|hilo/.test(subject)) return 'textiles';
    if (/mural|arte|sombrilla|sombrero/.test(subject)) return 'art';
    if (/turista|viajero|angelina|firu/.test(subject)) return 'people';
    if (/comida|alimentaci|xoxolat/.test(subject)) return 'flavors';
    if (/tikal|antigua|rio-dulce|semuc|acatenango|san-cristobal|mototaxi|iglesia|calle|mercado|pueblo|ceremonia|ancestral/.test(subject)) return 'culture';
    if (photo.category === 'Pueblos y cultura') return 'culture';
    if (photo.category === 'Personas y experiencias') return 'people';
    if (photo.category === 'Sabores locales') return 'flavors';
    if (photo.category === 'Atitlán y naturaleza') return 'lake';
    return 'destinations';
  };
  const galleryEditorialThemeUses = new Map();
  const gallerySpecificTitleUses = new Map();
  const getGalleryEditorialTitle = (photo) => {
    const subject = normalizeText(`${photo.id} ${photo.title}`);
    const specificTitles = [
      [/antigua/, ['Antigua: encanto colonial entre volcanes', 'Antigua: colonial charm among volcanoes']],
      [/tikal/, ['Tikal: la grandeza maya en la selva', 'Tikal: Maya grandeur in the rainforest']],
      [/rio-dulce/, ['Río Dulce: naturaleza en movimiento', 'Río Dulce: nature in motion']],
      [/semuc/, ['Semuc Champey: agua en tonos turquesa', 'Semuc Champey: waters in shades of turquoise']],
      [/acatenango/, ['Acatenango: aventura sobre las nubes', 'Acatenango: adventure above the clouds']],
      [/san-cristobal/, ['San Cristóbal: un balcón sobre Atitlán', 'San Cristóbal: a balcony over Atitlán']]
    ];
    const specificTitle = specificTitles.find(([pattern]) => pattern.test(subject));
    if (specificTitle) {
      const key = specificTitle[0].source;
      const index = gallerySpecificTitleUses.get(key) || 0;
      gallerySpecificTitleUses.set(key, index + 1);
      if (index > 0) {
        const alternatives = {
          antigua: ['Antigua: historia colonial a cada paso', 'Antigua: colonial history at every turn'],
          tikal: ['Tikal: ecos de la civilización maya', 'Tikal: echoes of the Maya civilization'],
          'rio-dulce': ['Río Dulce: una ruta entre selva y agua', 'Río Dulce: a route through jungle and water'],
          semuc: ['Semuc Champey: pozas esmeralda en la selva', 'Semuc Champey: emerald pools in the rainforest'],
          acatenango: ['Acatenango: un ascenso hacia las nubes', 'Acatenango: a climb toward the clouds'],
          'san-cristobal': ['San Cristóbal: calles con vista al lago', 'San Cristóbal: streets with a view of the lake']
        };
        const patternKey = Object.keys(alternatives).find((name) => key.includes(name));
        if (patternKey) return alternatives[patternKey];
      }
      return specificTitle[1];
    }

    const themeKey = getGalleryEditorialThemeKey(photo);
    const theme = galleryEditorialTitleThemes[themeKey];
    const index = galleryEditorialThemeUses.get(themeKey) || 0;
    galleryEditorialThemeUses.set(themeKey, index + 1);
    const base = theme.bases[index % theme.bases.length];
    const ending = theme.endings[Math.floor(index / theme.bases.length) % theme.endings.length];

    return [`${base[0]} · ${ending[0]}`, `${base[1]} · ${ending[1]}`];
  };
  const getGalleryCopyLanguageIndex = () => document.documentElement.lang === 'en' ? 1 : 0;
  const galleryEditorialText = (photo, key) => {
    if (key === 'editorialTitle') return photo.editorialTitle[getGalleryCopyLanguageIndex()];
    if (key === 'caption' && photo.editorialCaption) return photo.editorialCaption[getGalleryCopyLanguageIndex()];
    return getGalleryCopyLanguageIndex() === 1 ? translate(photo.caption) : photo.caption;
  };
  const getGalleryPhotoCaption = (photo, editorialTitle = photo.title) => {
    const subject = normalizeText(`${photo.id} ${photo.title}`);
    const title = editorialTitle.replace(/\s+\d+$/, '').toLowerCase();
    const isRostroMaya = photo.category === 'Rostro Maya y aventura';

    if (/mototaxi/.test(subject)) return 'Un paseo entre los colores y la vida de los pueblos';
    if (/mujeres-tejedoras/.test(subject)) return 'Manos expertas mantienen vivo el arte del telar';
    if (/miniatura-reel/.test(subject)) return 'Una obra de arte llena de movimiento y color';
    if (/mirador-nido-del-colibri/.test(subject)) return 'Un colibrí de colores recibe a quienes llegan al mirador';
    if (/mirador-colibri/.test(subject)) return 'El colibrí inspira una parada llena de color';
    if (/mirador-del-abuelo/.test(subject)) return 'Una artesanía colorida enmarca la vista del lago';
    if (/rostro-maya-face/.test(subject)) return 'Volcanes y senderos se descubren desde lo alto';
    if (/rostro-maya1-jpg/.test(subject)) return 'Una silueta contempla el horizonte desde el Rostro Maya';
    if (/entrada-rostro|paseos-pueblos/.test(subject)) return 'Un portal de madera abre el camino entre jardines';
    if (/lago1/.test(subject)) return 'Aguas cristalinas invitan a descubrir un rincón escondido';
    if (/sanpedro/.test(subject)) return 'Una figura colorida da la bienvenida a San Pedro';
    if (/santiago/.test(subject)) return 'Tradición y vida cotidiana se encuentran en Santiago';
    if (/xoxolat/.test(subject)) return 'Sabores y colores locales cuentan una historia maya';
    if (/unnamed-2/.test(subject)) return 'Una celebración llena de música, color y tradición';
    if (/angelina/.test(subject)) return 'Una artista local comparte su universo de colores';
    if (/ceremonia-maya/.test(subject)) return 'El fuego y la tradición iluminan una ceremonia maya';
    if (/paisajes-del-lago|paisajes-lago/.test(subject)) return 'Nubes de luz se abren sobre el lago y sus volcanes';
    if (/lago-volcanes/.test(subject)) return 'La silueta de los volcanes se refleja al caer la tarde';

    if (isRostroMaya) {
      if (subject.includes('amanecer')) return 'Un amanecer desde las alturas del Rostro Maya';
      if (subject.includes('atardecer')) return 'El Rostro Maya bajo la luz del atardecer';
      if (/mirador|vista|paisaje/.test(subject)) return 'Una vista que recompensa cada paso';
      return 'Una aventura con el Lago de Atitlán a tus pies';
    }
    if (/abej|avej/.test(subject)) return 'El dulce legado de las abejas mayas';
    if (/cacao|chocol/.test(subject)) return 'Del cacao ancestral a un sabor inolvidable';
    if (/cafe|cafecito/.test(subject)) return 'Una pausa con aroma a café guatemalteco';
    if (/comida|alimentaci/.test(subject)) return 'Sabores que guardan la historia maya';
    if (/cuatrimoto/.test(subject)) return 'Aventura sobre ruedas por los senderos de Atitlán';
    if (/amanecer|amaneceres/.test(subject)) return 'El día comienza entre volcanes y aguas tranquilas';
    if (/atardecer/.test(subject)) return 'La última luz del día sobre Atitlán';
    if (/lancha|lanchas|lanchero|embarcadero|paseos/.test(subject)) return 'Entre volcanes, el lago marca el rumbo';
    if (/textil|tejido|tejjido|hilo/.test(subject)) return 'Tradición maya tejida hilo a hilo';
    if (/sombrilla|sombrero|mural|arte|cultural|ceremonia|ancestral/.test(subject)) {
      return 'Colores y memoria en cada rincón';
    }
    if (/iglesia/.test(subject)) return 'Historia que permanece entre calles';
    if (/turista|viajero|angelina|firu/.test(subject)) return 'Encuentros locales que hacen único cada viaje';
    if (/sanpedro/.test(subject)) return 'San Pedro: vida local a orillas del lago';
    if (/santiago/.test(subject)) return 'Santiago: cultura viva entre lago y volcanes';
    if (/xoxolat/.test(subject)) return 'Tradición y sabor en un rincón de Guatemala';
    if (/tikal/.test(subject)) return 'Templos mayas que emergen entre la selva';
    if (/antigua/.test(subject)) return 'Calles coloniales llenas de historia y color';
    if (/rio-dulce/.test(subject)) return 'La selva acompaña el curso del Río Dulce';
    if (/semuc/.test(subject)) return 'Pozas turquesa escondidas en la selva';
    if (/acatenango/.test(subject)) return 'Un gigante volcánico que toca el cielo';
    if (/san-cristobal/.test(subject)) return 'San Cristóbal y el lago, una vista para recordar';
    if (/postal|postales/.test(subject)) return 'Una postal de Guatemala que dan ganas de vivir';
    if (/paisaje|paisajes|mirador|vista/.test(subject)) return 'Un horizonte para respirar hondo';
    if (/atitlan|lago|volcan|sol/.test(subject)) {
      return 'La inmensidad de Atitlán en una postal';
    }
    if (photo.category === 'Pueblos y cultura') return `La imagen de ${title} conserva un detalle de la vida cultural de la región`;
    if (photo.category === 'Personas y experiencias') return `Un encuentro retratado durante ${title} en Guatemala`;
    if (photo.category === 'Sabores locales') return `Un acercamiento a ${title} y a los sabores de Guatemala`;
    if (photo.category === 'Naturaleza y experiencias') return `La fotografía de ${title} muestra la naturaleza guatemalteca`;
    if (photo.category === 'Atitlán y naturaleza') return `La escena de ${title} muestra otra faceta del Lago de Atitlán`;
    if (photo.category === 'Otros destinos') return `Una mirada a ${title}, uno de los paisajes de Guatemala`;

    return `Una fotografía de ${title} tomada durante un recorrido por Guatemala`;
  };
  const getGalleryEnglishCaption = (photo, editorialTitle) => {
    const title = editorialTitle[1];
    const subject = normalizeText(`${photo.id} ${photo.title}`);
    if (/abej|avej/.test(subject)) return `Meet Guatemala’s native bees and discover their role in local biodiversity: ${title}.`;
    if (/cacao|chocol/.test(subject)) return `Explore the roots of Guatemala’s cacao and chocolate traditions: ${title}.`;
    if (/cafe|cafecito/.test(subject)) return `Discover the coffee culture and flavors of the Guatemalan highlands: ${title}.`;
    if (/amanecer/.test(subject)) return `Start the day with the changing light over Lake Atitlán: ${title}.`;
    if (/atardecer/.test(subject)) return `Take in the evening light over Atitlán: ${title}.`;
    if (/lancha|lanchero|embarcadero|paseos/.test(subject)) return `Travel between lakeside villages and take in the scenery along the way: ${title}.`;
    if (/textil|tejido|tejed|hilo/.test(subject)) return `Discover the weaving traditions and handmade textiles of the region: ${title}.`;
    if (/mural|arte|sombrilla|sombrero/.test(subject)) return `Explore the color and creativity found in Guatemala’s villages: ${title}.`;
    if (photo.category === 'Atitlán y naturaleza') return `A fresh perspective on Lake Atitlán: ${title}.`;
    if (photo.category === 'Rostro Maya y aventura') return `A glimpse of the trails and highland views around Rostro Maya: ${title}.`;
    if (photo.category === 'Pueblos y cultura') return `Discover the stories and creativity of Guatemala’s villages through ${title}.`;
    if (photo.category === 'Sabores locales') return `A glimpse of Guatemala’s food traditions: ${title}.`;
    if (photo.category === 'Naturaleza y experiencias') return `Explore Guatemala’s natural richness through ${title}.`;
    if (photo.category === 'Personas y experiencias') return `Local encounters are part of every journey: ${title}.`;
    return `A moment among Guatemala’s many destinations: ${title}.`;
  };
  const getDistinctGalleryPhotoCaption = (photo, subject) => {
    const photoSubject = normalizeText(`${photo.id} ${photo.title}`);
    if (/abej|avej/.test(photoSubject)) {
      return `La diversidad de abejas nativas, destacada en ${subject}, forma parte del equilibrio local`;
    }
    if (/cacao|chocol/.test(photoSubject)) {
      return `En torno al cacao, ${subject} revela una tradición de sabor y conocimiento local`;
    }
    if (/cafe|cafecito/.test(photoSubject)) {
      return `El café guatemalteco también cuenta historias: ${subject} invita a conocer sus aromas y tradiciones`;
    }
    if (/amanecer/.test(photoSubject)) {
      return `Desde Atitlán, ${subject} celebra la primera luz sobre el lago`;
    }
    if (/atardecer/.test(photoSubject)) {
      return `Al caer la tarde, ${subject} enmarca los últimos tonos de luz sobre Atitlán`;
    }
    if (/lancha|lanchero|embarcadero|paseos/.test(photoSubject)) {
      return `Entre pueblos del lago, ${subject} acompaña una travesía por Atitlán`;
    }
    if (/textil|tejido|tejed|hilo/.test(photoSubject)) {
      return `La tradición del tejido cobra vida en ${subject}, con técnicas transmitidas entre generaciones`;
    }
    if (/mural|arte|sombrilla|sombrero/.test(photoSubject)) {
      return `El color y la creatividad de los pueblos se encuentran en ${subject}`;
    }
    if (photo.category === 'Atitlán y naturaleza') {
      return `En Atitlán, ${subject} muestra un instante junto al lago`;
    }
    if (photo.category === 'Rostro Maya y aventura') {
      return `En Rostro Maya, ${subject} ofrece una perspectiva de la ruta y sus miradores`;
    }
    if (photo.category === 'Pueblos y cultura') {
      return `${subject} refleja la vida cultural de los pueblos de la región`;
    }
    if (photo.category === 'Sabores locales') {
      return `${subject} acerca a los sabores y saberes de Guatemala`;
    }
    if (photo.category === 'Naturaleza y experiencias') {
      return `${subject} permite descubrir un detalle natural de la ruta`;
    }
    if (photo.category === 'Personas y experiencias') {
      return `${subject} guarda un encuentro de viaje en Guatemala`;
    }

    return `${subject} muestra otra de las facetas de Guatemala`;
  };
  const usedGalleryCaptions = new Set();
  const galleryPhotos = Array.isArray(window.TIERRA_VALIENTE_GALLERY)
    ? window.TIERRA_VALIENTE_GALLERY
      .filter((photo) => photo?.src && photo?.title && photo?.category && !galleryDuplicatePhotoIds.has(photo.id))
      .map((photo) => {
        const editorialTitle = getGalleryEditorialTitle(photo);
        let caption = getGalleryPhotoCaption(photo, editorialTitle[0]);
        if (usedGalleryCaptions.has(caption)) {
          let distinctCaption = getDistinctGalleryPhotoCaption(photo, editorialTitle[0]);
          if (usedGalleryCaptions.has(distinctCaption)) {
            distinctCaption = getDistinctGalleryPhotoCaption(photo, `${editorialTitle[0]}: una nueva mirada`);
          }
          caption = distinctCaption;
          let suffix = 2;
          while (usedGalleryCaptions.has(caption)) {
            caption = `${distinctCaption} (${suffix})`;
            suffix += 1;
          }
        }
        usedGalleryCaptions.add(caption);
        return {
          ...photo,
          editorialTitle,
          editorialCaption: [caption, getGalleryEnglishCaption(photo, editorialTitle)],
          caption
        };
      })
      .sort((first, second) => {
        const categoryDifference = galleryCategoryOrder.indexOf(first.category) - galleryCategoryOrder.indexOf(second.category);
        return categoryDifference || first.title.localeCompare(second.title, 'es');
      })
    : [];
  let activeGalleryCategory = 'Todas';
  let activeGalleryQuery = '';
  let galleryVisibleCount = galleryPageSize;
  let filteredGalleryPhotos = [];
  let lightboxGalleryPhotos = [];
  let lightboxGalleryIndex = -1;

  const closeLightbox = () => {
    if (!lightbox) return;

    if (typeof lightbox.close === 'function') {
      lightbox.close();
    } else {
      lightbox.classList.remove('is-open');
    }
    if (lightboxImage) lightboxImage.src = '';
    setLightboxInfoVisible(false);
    lightboxGalleryPhotos = [];
    lightboxGalleryIndex = -1;
  };

  const setLightboxInfoVisible = (isVisible) => {
    if (!lightboxCopy || !lightboxInfoToggle) return;

    lightbox?.classList.toggle('has-info', isVisible);
    lightboxCopy.hidden = !isVisible;
    lightboxInfoToggle.setAttribute('aria-expanded', String(isVisible));
    lightboxInfoToggle.textContent = translate(isVisible ? 'Ocultar información' : 'Más información');
  };

  const openLightbox = (openButton) => {
    if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxDescription || !lightboxSource) {
      return;
    }

    lightboxGalleryPhotos = [];
    lightboxGalleryIndex = -1;
    if (lightboxPrevious) lightboxPrevious.hidden = true;
    if (lightboxNext) lightboxNext.hidden = true;
    if (lightboxCounter) lightboxCounter.hidden = true;
    const imageUrl = openButton.dataset.lightboxImage || '';
    lightboxImage.src = imageUrl;
    lightboxImage.alt = openButton.dataset.lightboxAlt || '';
    lightboxTitle.textContent = openButton.dataset.lightboxTitle || '';
    lightboxDescription.textContent = openButton.dataset.lightboxDescription || openButton.dataset.lightboxAlt || '';
    lightboxDescription.hidden = !lightboxDescription.textContent;
    if (lightboxCategory) lightboxCategory.textContent = 'Vista ampliada';
    if (lightboxInfoToggle) lightboxInfoToggle.hidden = !lightboxDescription.textContent;
    setLightboxInfoVisible(false);

    const sourceUrl = openButton.dataset.lightboxSource || '';
    lightboxSource.href = sourceUrl;
    lightboxSource.hidden = !sourceUrl;
    if (lightboxCopyright) {
      lightboxCopyright.hidden = !imageUrl.startsWith('assets/optimized/propias/');
    }

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.classList.add('is-open');
    }
  };

  const updateGalleryLightbox = (index) => {
    if (!lightboxGalleryPhotos.length || !lightboxImage || !lightboxTitle || !lightboxDescription) return;

    lightboxGalleryIndex = (index + lightboxGalleryPhotos.length) % lightboxGalleryPhotos.length;
    const photo = lightboxGalleryPhotos[lightboxGalleryIndex];
    const editorialTitle = galleryEditorialText(photo, 'editorialTitle');
    lightboxImage.src = photo.src;
    lightboxImage.alt = editorialTitle;
    lightboxTitle.textContent = editorialTitle;
    lightboxDescription.textContent = galleryEditorialText(photo, 'caption');
    lightboxDescription.hidden = false;
    if (lightboxCategory) lightboxCategory.textContent = translate(photo.category);
    if (lightboxInfoToggle) lightboxInfoToggle.hidden = false;
    setLightboxInfoVisible(false);
    if (lightboxCopyright) {
      const photoNumber = Number.parseInt(photo.id, 10);
      lightboxCopyright.hidden = !photo.src.startsWith('assets/optimized/gallery/')
        || photoNumber < 7
        || photoNumber > 154;
    }
    if (lightboxSource) lightboxSource.hidden = true;
    if (lightboxPrevious) lightboxPrevious.hidden = false;
    if (lightboxNext) lightboxNext.hidden = false;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${lightboxGalleryIndex + 1} de ${lightboxGalleryPhotos.length}`;
      lightboxCounter.hidden = false;
    }
  };

  const openGalleryLightbox = (photoIndex) => {
    if (!lightbox || !filteredGalleryPhotos.length) return;

    lightboxGalleryPhotos = filteredGalleryPhotos;
    updateGalleryLightbox(photoIndex);
    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.classList.add('is-open');
    }
  };

  const createGalleryPhotoCard = (photo, index) => {
    const card = document.createElement('article');
    card.className = 'gallery-photo-card';

    const button = document.createElement('button');
    button.className = 'gallery-photo-open';
    button.type = 'button';
    button.dataset.galleryIndex = String(index);
    const editorialTitle = galleryEditorialText(photo, 'editorialTitle');
    const enlargeLabel = getGalleryCopyLanguageIndex() === 1 ? 'Enlarge photo: ' : 'Ampliar fotografía: ';
    button.setAttribute('aria-label', `${enlargeLabel}${editorialTitle}`);

    const imageWrap = document.createElement('span');
    imageWrap.className = 'gallery-photo-image';
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = editorialTitle;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = photo.width;
    image.height = photo.height;
    image.sizes = '(max-width: 700px) 48vw, (max-width: 980px) 32vw, 24vw';

    const openHint = document.createElement('span');
    openHint.className = 'gallery-photo-hint';
    openHint.textContent = 'Ampliar';
    imageWrap.append(image, openHint);

    const copy = document.createElement('span');
    copy.className = 'gallery-photo-copy';
    const category = document.createElement('span');
    category.className = 'gallery-photo-category';
    category.textContent = photo.category;
    const title = document.createElement('span');
    title.className = 'gallery-photo-title';
    title.textContent = editorialTitle;
    copy.append(category, title);
    button.append(imageWrap, copy);
    card.append(button);
    return card;
  };

  const updateGalleryResults = (append = false) => {
    if (!galleryGrid || !galleryFilters || !galleryResultCount || !galleryEmpty || !galleryLoadMore) return;

    const query = normalizeText(activeGalleryQuery.trim());
    filteredGalleryPhotos = galleryPhotos.filter((photo) => {
      const matchesCategory = activeGalleryCategory === 'Todas' || photo.category === activeGalleryCategory;
      const searchableText = normalizeText(`${photo.title} ${photo.editorialTitle.join(' ')} ${photo.caption} ${photo.category}`);
      return matchesCategory && (!query || searchableText.includes(query));
    });

    if (!append) {
      galleryGrid.replaceChildren();
      galleryVisibleCount = galleryPageSize;
    }

    const start = append ? galleryGrid.children.length : 0;
    const end = Math.min(galleryVisibleCount, filteredGalleryPhotos.length);
    for (let index = start; index < end; index += 1) {
      galleryGrid.append(createGalleryPhotoCard(filteredGalleryPhotos[index], index));
    }

    galleryResultCount.textContent = filteredGalleryPhotos.length
      ? `Mostrando ${end} de ${filteredGalleryPhotos.length} fotografías${activeGalleryCategory === 'Todas' ? '' : ` · ${activeGalleryCategory}`}.`
      : 'No hay fotografías que coincidan con esta búsqueda.';
    galleryEmpty.hidden = filteredGalleryPhotos.length > 0;
    galleryLoadMore.hidden = end >= filteredGalleryPhotos.length;
  };

  const initializeGallery = () => {
    if (!galleryGrid || !galleryFilters || !gallerySearch || !galleryResultCount || !galleryLoadMore) return;

    if (!galleryPhotos.length) {
      galleryResultCount.textContent = 'No se pudo cargar el archivo de fotografías.';
      galleryLoadMore.hidden = true;
      console.error('La galería no tiene fotografías locales configuradas.');
      return;
    }

    const categoryCounts = new Map();
    galleryPhotos.forEach((photo) => categoryCounts.set(photo.category, (categoryCounts.get(photo.category) || 0) + 1));
    const categories = ['Todas', ...galleryCategoryOrder.filter((category) => categoryCounts.has(category))];

    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = 'gallery-filter';
      button.type = 'button';
      button.textContent = `${category} (${category === 'Todas' ? galleryPhotos.length : categoryCounts.get(category)})`;
      button.setAttribute('aria-pressed', String(category === activeGalleryCategory));
      if (category === activeGalleryCategory) button.classList.add('is-active');
      button.addEventListener('click', () => {
        activeGalleryCategory = category;
        galleryFilters.querySelectorAll('.gallery-filter').forEach((filter) => {
          const isActive = filter === button;
          filter.classList.toggle('is-active', isActive);
          filter.setAttribute('aria-pressed', String(isActive));
        });
        updateGalleryResults();
      });
      galleryFilters.append(button);
    });

    gallerySearch.addEventListener('input', () => {
      activeGalleryQuery = gallerySearch.value;
      updateGalleryResults();
    });

    galleryLoadMore.addEventListener('click', () => {
      galleryVisibleCount += galleryPageSize;
      updateGalleryResults(true);
    });

    galleryGrid.addEventListener('click', (event) => {
      const button = event.target.closest('.gallery-photo-open');
      if (!button || !galleryGrid.contains(button)) return;
      openGalleryLightbox(Number(button.dataset.galleryIndex));
    });

    updateGalleryResults();
  };

  initializeGallery();

  document.addEventListener('tierralanguagechange', () => {
    updateGalleryResults();
    if (lightboxGalleryPhotos.length) updateGalleryLightbox(lightboxGalleryIndex);
  });

  document.querySelectorAll('.gallery-card-action').forEach((openButton) => {
    openButton.addEventListener('click', () => openLightbox(openButton));
  });

  document.querySelectorAll('.rostro-gallery-item img').forEach((image) => {
    const openButton = image.closest('.rostro-gallery-item')?.querySelector('.gallery-card-action');
    if (!openButton) return;

    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Ampliar fotografía: ${openButton.dataset.lightboxTitle || image.alt}`);
    image.addEventListener('click', () => openLightbox(openButton));
    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      openLightbox(openButton);
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxInfoToggle?.addEventListener('click', () => {
    setLightboxInfoVisible(lightboxCopy?.hidden ?? false);
  });
  lightboxPrevious?.addEventListener('click', () => updateGalleryLightbox(lightboxGalleryIndex - 1));
  lightboxNext?.addEventListener('click', () => updateGalleryLightbox(lightboxGalleryIndex + 1));

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox?.open && lightboxGalleryPhotos.length && event.key === 'ArrowLeft') {
      event.preventDefault();
      updateGalleryLightbox(lightboxGalleryIndex - 1);
      return;
    }

    if (lightbox?.open && lightboxGalleryPhotos.length && event.key === 'ArrowRight') {
      event.preventDefault();
      updateGalleryLightbox(lightboxGalleryIndex + 1);
      return;
    }

    if (event.key === 'Escape' && lightbox?.open) {
      event.preventDefault();
      closeLightbox();
    }
  });

  // ============================================
  // RESEÑAS DE VIAJEROS
  // ============================================
  const reviewForm = document.querySelector('#review-form');
  const reviewsList = document.querySelector('#reviews-list');
  const reviewEmptyNote = reviewsList?.querySelector('.review-empty-note');
  const reviewStatus = document.querySelector('#review-status');
  const reviewSubmitButton = reviewForm?.querySelector('button[type="submit"]');
  const supabaseConfig = window.TIERRA_VALIENTE_SUPABASE;
  const supabaseUrl = supabaseConfig?.url;
  const supabaseAnonKey = supabaseConfig?.anonKey;
  const isSupabaseClientLoaded = Boolean(window.supabase?.createClient);
  const isSupabaseConfigured = Boolean(
    supabaseUrl
    && supabaseAnonKey
    && !supabaseUrl.includes('YOUR_PROJECT_ID')
    && !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
  );
  let supabaseClient = null;

  if (isSupabaseConfigured && isSupabaseClientLoaded) {
    try {
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('La configuración de Supabase no es válida:', error);
    }
  }

  const getInitials = (name) => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const updateReviewMetadata = (metadata) => {
    const destination = metadata.dataset.reviewDestination;
    const createdAt = metadata.dataset.reviewDate;
    const isEnglish = window.TIERRA_VALIENTE_I18N?.currentLanguage() === 'en';
    const locale = window.TIERRA_VALIENTE_I18N?.locale() || 'es-GT';
    const date = createdAt ? new Date(createdAt) : null;
    const publishedDate = date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)
      : '';
    const publicationLabel = publishedDate
      ? `${isEnglish ? 'Posted on' : 'Publicado el'} ${publishedDate}`
      : isEnglish ? 'Review posted' : 'Reseña publicada';

    metadata.textContent = `${destination} · ${publicationLabel}`;
  };

  const renderReview = (review) => {
    if (!reviewsList) return;

    reviewEmptyNote?.remove();

    const card = document.createElement('figure');
    card.className = 'testimonial-card testimonial-card--review';
    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.setAttribute('aria-label', `${review.rating} de 5 estrellas`);
    stars.textContent = `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`;

    const message = document.createElement('blockquote');
    message.textContent = review.message;
    message.dataset.noTranslate = 'true';

    const caption = document.createElement('figcaption');
    const avatar = document.createElement('span');
    avatar.className = 'avatar avatar-review';
    avatar.textContent = getInitials(review.name);

    const details = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = review.name;
    name.dataset.noTranslate = 'true';
    const metadata = document.createElement('small');
    metadata.dataset.noTranslate = 'true';
    metadata.dataset.reviewDestination = review.destination;
    metadata.dataset.reviewDate = review.created_at || '';
    updateReviewMetadata(metadata);

    details.append(name, metadata);
    caption.append(avatar, details);
    card.append(stars, message, caption);
    reviewsList.append(card);
  };

  document.addEventListener('tierralanguagechange', () => {
    reviewsList?.querySelectorAll('[data-review-destination]').forEach(updateReviewMetadata);
  });

  const setReviewStatus = (message) => {
    if (!reviewStatus) return;
    reviewStatus.textContent = message;
    reviewStatus.classList.add('is-visible');
  };

  const loadReviews = async () => {
    if (!reviewsList || !reviewStatus) return;

    if (!supabaseClient) {
      reviewEmptyNote?.remove();
      const message = !isSupabaseConfigured
        ? 'Las reseñas compartidas aún no están configuradas. Agrega la URL y la clave pública de Supabase en supabase-config.js.'
        : !isSupabaseClientLoaded
          ? 'No se pudo cargar el servicio de reseñas. Revisa tu conexión e inténtalo de nuevo.'
          : 'No se pudo iniciar Supabase. Revisa la URL y la clave pública configuradas.';
      setReviewStatus(message);
      if (reviewSubmitButton) reviewSubmitButton.disabled = true;
      return;
    }

    reviewStatus.classList.remove('is-visible');

    const pageSize = 1000;
    let offset = 0;
    let hasMoreReviews = true;

    try {
      while (hasMoreReviews) {
        const { data, error } = await supabaseClient
          .from('reviews')
          .select('id, name, destination, rating, message, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('No se pudieron cargar las reseñas de Supabase:', error);
          reviewEmptyNote?.remove();
          setReviewStatus('No pudimos cargar las reseñas. Recarga la página o inténtalo más tarde.');
          return;
        }

        data.forEach(renderReview);
        hasMoreReviews = data.length === pageSize;
        offset += pageSize;
      }

      if (!reviewsList.querySelector('.testimonial-card--review') && reviewEmptyNote) {
        reviewEmptyNote.textContent = 'Todavía no hay reseñas publicadas. Si ya viajaste con nosotros, comparte tu experiencia; la revisaremos antes de publicarla.';
      }
    } catch (error) {
      console.error('No se pudieron cargar las reseñas de Supabase:', error);
      reviewEmptyNote?.remove();
      setReviewStatus('No pudimos cargar las reseñas. Recarga la página o inténtalo más tarde.');
    }
  };

  reviewForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!reviewForm.reportValidity()) return;

    const formData = new FormData(reviewForm);
    const review = {
      name: String(formData.get('review-name') || '').trim(),
      destination: String(formData.get('review-destination') || '').trim(),
      rating: Number(formData.get('review-rating') || 0),
      message: String(formData.get('review-message') || '').trim()
    };

    if (
      !review.name
      || review.name.length > 60
      || !review.destination
      || review.destination.length > 100
      || !review.message
      || review.message.length > 500
      || !Number.isInteger(review.rating)
      || review.rating < 1
      || review.rating > 5
    ) {
      setReviewStatus('Completa tu nombre, destino, valoración y experiencia para publicar la reseña.');
      return;
    }

    if (!supabaseClient) {
      setReviewStatus('No se pueden publicar reseñas todavía porque falta configurar Supabase.');
      return;
    }

    if (reviewSubmitButton) reviewSubmitButton.disabled = true;
    setReviewStatus('Publicando tu experiencia…');

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .insert(review);

      if (error) {
        console.error('No se pudo enviar la reseña a Supabase:', error);
        setReviewStatus('No pudimos publicar tu reseña. Inténtalo de nuevo más tarde.');
        return;
      }

      reviewForm.reset();
      setReviewStatus('¡Gracias! Recibimos tu reseña. La publicaremos cuando termine la revisión.');
    } catch (error) {
      console.error('No se pudo publicar la reseña en Supabase:', error);
      setReviewStatus('No pudimos publicar tu reseña. Inténtalo de nuevo más tarde.');
    } finally {
      if (reviewSubmitButton) reviewSubmitButton.disabled = false;
    }
  });

  loadReviews();

  // ============================================
  // FORMULARIO DE CONTACTO Y RESERVAS
  // ============================================
  document.querySelector('.contact-form')?.addEventListener('submit', (event) => {
    const form = event.currentTarget;
    const status = form.querySelector('.form-status');

    if (!form.reportValidity()) {
      event.preventDefault();
      if (status) {
        status.textContent = 'Completa los campos obligatorios para continuar.';
        status.classList.add('is-visible');
      }
      return;
    }

    const email = form.email?.value.trim() || '';
    const replyTo = form.querySelector('#reply-to');

    if (replyTo) {
      replyTo.value = email;
    }

    if (status) {
      status.textContent = 'Enviando tu solicitud de cotización…';
      status.classList.add('is-visible');
    }
    // El envío continúa de forma nativa hacia FormSubmit para evitar depender del cliente de correo del visitante.
  });
});
