(function () {
  const root = document.documentElement;
  const toast = document.querySelector("[data-toast]");
  const themeButton = document.querySelector("[data-theme-toggle]");
  const langButtons = Array.from(document.querySelectorAll("[data-lang]"));
  const menuButton = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const toTop = document.getElementById("to-top");
  const originalTitle = document.title;
  const textRecords = [];
  const attrRecords = [];
  let currentLang = (() => {
    try { return localStorage.getItem("meridian-ds-lang") || "es"; } catch (_) { return "es"; }
  })();
  let clickId = null;
  let clickUntil = 0;

  const TEXT_EN = {
    "Saltar al contenido": "Skip to content",
    "Overview": "Overview",
    "Átomos": "Atoms",
    "Moléculas": "Molecules",
    "Componentes": "Components",
    "Versión": "Version",
    "Actualizado": "Updated",
    "Propietario": "Owner",
    "Equipo de marca": "Brand team",
    "secciones": "sections",
    "capas de tokens": "token layers",
    "secciones auditables": "auditable sections",
    "contraste por estado": "state contrast",
    "Repositorio independiente para convertir la identidad Meridian en un sistema de producto: tokens DTCG/OpenPencil, componentes documentados, estados accesibles y patrones listos para Figma/Pencil.dev.": "A standalone repository that turns the Meridian identity into a product design system: DTCG/OpenPencil tokens, documented components, accessible states, and patterns ready for Figma/Pencil.dev.",
    "Arquitectura de tokens": "Token architecture",
    "La capa primitive trae valores del brand guide; semantic asigna intención por modo; component fija decisiones por UI. Esto permite que Figma, Pencil.dev y CSS consuman el mismo contrato.": "The primitive layer carries brand guide values; semantic assigns intent by mode; component locks UI decisions. Figma, Pencil.dev, and CSS can consume the same contract.",
    "Color brand/neutral, tipografía, espacio, radio, shadow, motion, z-index.": "Brand/neutral color, typography, space, radius, shadow, motion, and z-index.",
    "Roles de interfaz: fondo, superficie, texto, borde, acción, foco, status.": "Interface roles: background, surface, text, border, action, focus, and status.",
    "Button, input, card, badge, modal y navegación con estados explícitos.": "Button, input, card, badge, modal, and navigation with explicit states.",
    "Token": "Token",
    "Uso": "Use",
    "Canvas base": "Base canvas",
    "Lectura principal": "Primary reading",
    "Teclado y accesibilidad": "Keyboard and accessibility",
    "Secciones heredadas del brand guide": "Brand guide inheritance",
    "El design system no copia el brand book completo: integra las secciones que gobiernan UI y handoff. Estrategia, voz, aplicaciones físicas y legal permanecen en el brand guide; color, tipografía, accesibilidad, dark mode, iconografía, grid, motion y data-viz viven aquí como reglas operativas.": "The design system does not copy the full brand book. It integrates the sections that govern UI and handoff. Strategy, voice, physical applications, and legal stay in the brand guide; color, typography, accessibility, dark mode, iconography, grid, motion, and data visualization live here as operating rules.",
    "Escalas brand/neutral, pares AA y roles semánticos para light/dark.": "Brand/neutral scales, AA pairs, and semantic roles for light/dark.",
    "Space Grotesk, Inter y Space Mono convertidas a tokens de texto y estilos.": "Space Grotesk, Inter, and Space Mono converted into text tokens and styles.",
    "Contraste, foco visible, ARIA y estados no dependientes sólo de color.": "Contrast, visible focus, ARIA, and states that do not rely on color alone.",
    "Re-mapeo por roles, sin inversión literal de assets ni swatches.": "Role-based remapping, with no literal inversion of assets or swatches.",
    "Tabler-style outline, grid de 24 px, stroke 2 px y tamaños 16/20/24.": "Tabler-style outline, 24 px grid, 2 px stroke, and 16/20/24 sizes.",
    "Escala 8pt, contenedores, gutters y breakpoints para producto.": "8pt scale, containers, gutters, and product breakpoints.",
    "Duración, easing, reduced motion y estados loading.": "Duration, easing, reduced motion, and loading states.",
    "Series, leyendas y estados de tabla/reportes sin depender sólo de color.": "Series, legends, and table/report states that do not rely on color alone.",
    "Los átomos son las variables que Figma debe importar como primitives y que CSS consume como custom properties. Cada átomo muestra token path, valor visual, tipo DTCG y scope de uso.": "Atoms are the variables Figma imports as primitives and CSS consumes as custom properties. Each atom shows token path, visual value, DTCG type, and usage scope.",
    "familias y jerarquía": "families and hierarchy",
    "escala 4-96 px": "4-96 px scale",
    "Color primitives": "Color primitives",
    "token": "copy",
    "Brand cobalt": "Brand cobalt",
    "Neutral scale": "Neutral scale",
    "Type scale": "Type scale",
    "Spacing 8pt": "Spacing 8pt",
    "Gaps, padding, gutters y ritmos verticales salen de esta escala.": "Gaps, padding, gutters, and vertical rhythm come from this scale.",
    "Radius + elevation": "Radius + elevation",
    "Icon atoms": "Icon atoms",
    "Grid 24 px, stroke 2 px, outline sin rellenos decorativos.": "24 px grid, 2 px stroke, outline style, no decorative fills.",
    "Border + opacity": "Border + opacity",
    "Cada molécula documenta variantes, estados, ARIA y el token responsable de cada decisión visual. Los ejemplos usan `data-component` para que agentes puedan parsearlos.": "Each molecule documents variants, states, ARIA, and the token behind each visual decision. Examples use `data-component` so agents can parse them.",
    "Se usa para aprobaciones y handoff.": "Used for approvals and handoff.",
    "Falta el estado final: default, hover o disabled.": "Missing the final state: default, hover, or disabled.",
    "Tokens exportados para Figma y Pencil.dev.": "Tokens exported for Figma and Pencil.dev.",
    "Alias roto: revisa la referencia antes del build.": "Broken alias: check the reference before build.",
    "Los componentes están pensados para SaaS/admin: densos, escaneables, sin composición de marketing. Cada uno expone estructura y estados suficientes para implementación.": "Components are built for SaaS/admin: dense, scannable, and free of marketing composition. Each one exposes enough structure and state for implementation.",
    "Generación, tokens, accesibilidad y handoff listos para publicar.": "Generation, tokens, accessibility, and handoff are ready to ship.",
    "La librería se versionará como": "The library will be versioned as",
    "Cancelar": "Cancel",
    "Publicar": "Publish",
    "Tipo": "Type",
    "Modo": "Mode",
    "Estado": "State",
    "Los layouts traducen la sección de grid/espaciado del brand guide a patrones de producto: navegación lateral, superficies de tabla, formularios y documentación.": "Layouts translate the brand guide grid/spacing section into product patterns: side navigation, table surfaces, forms, and documentation.",
    "Motion, z-index y estados": "Motion, z-index, and states",
    "La guía de motion se vuelve tokens de duración/easing; z-index evita stacks arbitrarios; los estados garantizan que hover/focus/disabled/loading/error tengan definición visible y accesible.": "Motion guidance becomes duration/easing tokens; z-index prevents arbitrary stacks; states make hover/focus/disabled/loading/error visible and accessible.",
    "Exportación y handoff": "Export and handoff",
    "El contrato vive en": "The contract lives in",
    ": formato DTCG, metadata Figma y extensiones OpenPencil. El build valida aliases, secciones y ejemplos `data-component`.": ": DTCG format, Figma metadata, and OpenPencil extensions. The build validates aliases, sections, and `data-component` examples.",
    ", alias y descripciones.": ", aliases, and descriptions.",
    "Collections, modes, scopes y code syntax para variables.": "Collections, modes, scopes, and code syntax for variables.",
    "Manifest de componentes, estados, ARIA y atributos para agentes.": "Component manifest, states, ARIA, and agent-readable attributes.",
    "Inicio": "Home",
    "Descargar": "Download",
    "Copiado": "Copied"
  };

  const ATTR_EN = {
    "Cambiar a oscuro": "Switch to dark",
    "Cambiar a claro": "Switch to light",
    "Menú": "Menu",
    "En esta página": "On this page",
    "Resumen del design system": "Design system summary",
    "Resumen de átomos": "Atoms summary",
    "Escala cobalt": "Cobalt scale",
    "Escala neutral": "Neutral scale",
    "Colores de estado": "Status colors",
    "Tamaños de iconos": "Icon sizes",
    "Estados de botón": "Button states",
    "Cerrar": "Close",
    "Progreso 78%": "Progress 78%",
    "Breakpoints responsive": "Responsive breakpoints",
    "Volver arriba": "Back to top"
  };

  function uiText(es, en) {
    return currentLang === "en" ? en : es;
  }

  function translateText(text) {
    if (currentLang !== "en") return text;
    return TEXT_EN[text] || text;
  }

  function translateAttr(value) {
    if (currentLang !== "en") return value;
    return ATTR_EN[value] || value;
  }

  // DMXAiStudio feed: sustituye el nombre demo "Meridian" por la marca del proyecto (mayúscula
  // solamente; los tokens en minúscula de codeSyntax/tailwind quedan intactos).
  function brandSwap(s) {
    var b = window.__DSBRAND;
    return b && b !== "Meridian" ? String(s).replace(/Meridian/g, b) : s;
  }

  function rememberLanguageNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script,style,code,pre")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const match = node.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
      if (match) textRecords.push({ node, before: match[1], text: match[2], after: match[3] });
    }
    document.querySelectorAll("[aria-label], [title]").forEach((el) => {
      ["aria-label", "title"].forEach((name) => {
        if (el.hasAttribute(name)) attrRecords.push({ el, name, value: el.getAttribute(name) || "" });
      });
    });
  }

  function refreshUiLabels() {
    if (themeButton) {
      const dark = currentTheme() === "dark";
      themeButton.setAttribute("aria-label", dark ? uiText("Cambiar a claro", "Switch to light") : uiText("Cambiar a oscuro", "Switch to dark"));
    }
    if (menuButton) menuButton.setAttribute("aria-label", uiText("Menú", "Menu"));
  }

  function applyLanguage(lang, persist = true) {
    currentLang = lang === "en" ? "en" : "es";
    root.setAttribute("lang", currentLang);
    if (persist) {
      try { localStorage.setItem("meridian-ds-lang", currentLang); } catch (_) {}
    }
    textRecords.forEach(({ node, before, text, after }) => {
      node.nodeValue = `${before}${brandSwap(translateText(text))}${after}`;
    });
    attrRecords.forEach(({ el, name, value }) => {
      el.setAttribute(name, brandSwap(translateAttr(value)));
    });
    document.title = brandSwap(currentLang === "en" ? "Meridian · Design System Guidelines" : originalTitle);
    langButtons.forEach((button) => {
      const on = button.dataset.lang === currentLang;
      button.classList.toggle("on", on);
      button.setAttribute("aria-pressed", String(on));
    });
    refreshUiLabels();
  }

  function initLanguage() {
    rememberLanguageNodes();
    langButtons.forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.lang || "es"));
    });
    applyLanguage(currentLang, false);
  }

  function currentTheme() {
    return root.getAttribute("data-theme") || "light";
  }

  function setTheme(theme, persist = true) {
    root.setAttribute("data-theme", theme);
    if (window.__applyDSTokens) window.__applyDSTokens(theme); // re-aplica tokens de marca al alternar
    if (persist) {
      try { localStorage.setItem("meridian-ds-theme", theme); } catch (_) {}
    }
    if (themeButton) {
      const dark = theme === "dark";
      themeButton.setAttribute("aria-label", dark ? uiText("Cambiar a claro", "Switch to light") : uiText("Cambiar a oscuro", "Switch to dark"));
      const icon = themeButton.querySelector("i");
      if (icon) icon.className = `ti ${dark ? "ti-sun" : "ti-moon"}`;
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1400);
  }

  function setActive(id) {
    document.querySelectorAll(".subnav a").forEach((link) => {
      link.classList.toggle("active", link.dataset.sec === id);
    });
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href === `#${id}`);
      if (href === `#${id}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function pickSection(sections) {
    const navH = parseInt(getComputedStyle(root).getPropertyValue("--nav-h"), 10) || 60;
    const subH = parseInt(getComputedStyle(root).getPropertyValue("--subnav-h"), 10) || 49;
    const lineY = navH + subH + 20;
    if (Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2) {
      return sections[sections.length - 1]?.id;
    }
    let current = sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= lineY) current = section.id;
      else break;
    }
    return current;
  }

  function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll("#overview, main > section[id]"));
    if (!sections.length) return;
    let ticking = false;
    function update() {
      ticking = false;
      setActive(Date.now() < clickUntil && clickId ? clickId : pickSection(sections));
    }
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    document.querySelectorAll(".subnav a, .nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        clickId = (link.getAttribute("href") || "").replace("#", "");
        clickUntil = Date.now() + 900;
        if (clickId) setActive(clickId);
        navLinks?.classList.remove("open");
        menuButton?.setAttribute("aria-expanded", "false");
      });
    });
    update();
  }

  function initNavHide() {
    const navH = parseInt(getComputedStyle(root).getPropertyValue("--nav-h"), 10) || 60;
    let lastY = Math.max(0, window.scrollY);
    let ticking = false;
    function update() {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return;
      if (delta > 0 && y > navH * 1.6) document.body.classList.add("nav-up");
      else if (delta < 0) document.body.classList.remove("nav-up");
      lastY = y;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  function initToTop() {
    if (!toTop) return;
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  themeButton?.addEventListener("click", () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  menuButton?.addEventListener("click", () => {
    const open = navLinks?.classList.toggle("open") || false;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    const icon = menuButton.querySelector("i");
    if (icon) icon.className = `ti ${open ? "ti-x" : "ti-menu-2"}`;
  });

  document.addEventListener("click", (event) => {
    if (!navLinks?.classList.contains("open")) return;
    if (event.target instanceof Node && !document.getElementById("site-nav")?.contains(event.target)) {
      navLinks.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navLinks?.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        showToast(`${uiText("Copiado", "Copied")}: ${value}`);
      } catch (_) {
        showToast(value);
      }
    });
  });

  initLanguage();
  setTheme(currentTheme(), false);
  initScrollSpy();
  initNavHide();
  initToTop();
})();
