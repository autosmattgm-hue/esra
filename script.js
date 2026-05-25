(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  body.classList.add("is-loading");

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    var themeMeta = qs('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#070606" : "#fbf6ec");
    qsa("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
    try {
      localStorage.setItem("eg-theme", theme);
    } catch (error) {
      return;
    }
  }

  function initTheme() {
    var activeTheme = root.getAttribute("data-theme") || "light";
    setTheme(activeTheme);
    qsa("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });
    });
  }

  function initLoader() {
    var loader = qs("[data-loader]");
    var hidden = false;

    function hideLoader() {
      if (hidden) return;
      hidden = true;
      window.setTimeout(function () {
        if (loader) loader.classList.add("is-hidden");
        body.classList.remove("is-loading");
      }, 350);
    }

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }

    window.setTimeout(hideLoader, 1200);
  }

  function initMobileMenu() {
    var toggle = qs("[data-menu-toggle]");
    var panel = qs("[data-mobile-panel]");
    if (!toggle || !panel) return;

    function closeMenu() {
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      body.classList.remove("menu-open");
    }

    toggle.addEventListener("click", function () {
      var willOpen = !panel.classList.contains("is-open");
      toggle.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      panel.classList.toggle("is-open", willOpen);
      panel.setAttribute("aria-hidden", willOpen ? "false" : "true");
      body.classList.toggle("menu-open", willOpen);
    });

    qsa("a", panel).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  function initScrollUI() {
    var header = qs("[data-header]");
    var progress = qs("[data-scroll-progress]");
    var heroImage = qs(".hero__image");
    var ticking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var progressWidth = height > 0 ? (scrollTop / height) * 100 : 0;

      if (progress) progress.style.width = progressWidth + "%";
      if (header) header.classList.toggle("is-scrolled", scrollTop > 24);
      if (heroImage && !reduceMotion) {
        var offset = Math.min(scrollTop * 0.12, 80);
        heroImage.style.transform = "translate3d(0, " + offset + "px, 0) scale(1.05)";
      }
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  function initReveal() {
    var reveals = qsa(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    reveals.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 4, 3) * 70 + "ms";
      observer.observe(el);
    });
  }

  function initLazyEmbeds() {
    var embeds = qsa("iframe[data-src]");
    if (!("IntersectionObserver" in window)) {
      embeds.forEach(loadEmbed);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            loadEmbed(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "320px 0px", threshold: 0.01 }
    );

    embeds.forEach(function (embed) {
      observer.observe(embed);
    });

    function loadEmbed(embed) {
      if (embed.dataset.src) {
        embed.src = embed.dataset.src;
        embed.removeAttribute("data-src");
        embed.addEventListener("load", function () {
          embed.classList.add("is-loaded");
        });
      }
    }
  }

  function initMarquees() {
    qsa("[data-marquee]").forEach(function (row) {
      var track = qs(".marquee-track", row);
      if (!track || track.dataset.ready === "true") return;

      var children = qsa(":scope > *", track);
      children.forEach(function (child) {
        var clone = child.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });

      track.style.setProperty("--duration", (row.dataset.speed || 42) + "s");
      track.dataset.ready = "true";

      row.addEventListener("pointerdown", function () {
        row.classList.add("is-touching");
      });
      row.addEventListener("pointerup", function () {
        row.classList.remove("is-touching");
      });
      row.addEventListener("pointercancel", function () {
        row.classList.remove("is-touching");
      });
      row.addEventListener("mouseleave", function () {
        row.classList.remove("is-touching");
      });
    });
  }

  function initParticles() {
    var container = qs("[data-particles]");
    if (!container || reduceMotion) return;
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < 28; i += 1) {
      var particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = 4 + Math.random() * 92 + "%";
      particle.style.top = 8 + Math.random() * 84 + "%";
      particle.style.setProperty("--duration", 5 + Math.random() * 6 + "s");
      particle.style.setProperty("--delay", Math.random() * -7 + "s");
      particle.style.setProperty("--rotate", -28 + Math.random() * 56 + "deg");
      fragment.appendChild(particle);
    }
    container.appendChild(fragment);
  }

  function initCursor() {
    var cursor = qs("[data-cursor]");
    if (!cursor || window.matchMedia("(pointer: coarse)").matches || reduceMotion) return;
    var dot = qs(".cursor__dot", cursor);
    var ring = qs(".cursor__ring", cursor);
    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var ringPos = { x: mouse.x, y: mouse.y };

    document.addEventListener("pointermove", function (event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      cursor.classList.add("is-visible");
      if (dot) dot.style.transform = "translate3d(" + mouse.x + "px, " + mouse.y + "px, 0) translate(-50%, -50%)";
    });

    qsa("a, button, input, textarea, select, .gallery-card, .collection-card").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("is-active");
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-active");
      });
    });

    function animateRing() {
      ringPos.x += (mouse.x - ringPos.x) * 0.18;
      ringPos.y += (mouse.y - ringPos.y) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + ringPos.x + "px, " + ringPos.y + "px, 0) translate(-50%, -50%)";
      window.requestAnimationFrame(animateRing);
    }
    animateRing();
  }

  function initForms() {
    var contact = qs("[data-contact-form]");
    var note = qs("[data-form-note]");
    if (contact) {
      contact.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!contact.checkValidity()) {
          contact.reportValidity();
          return;
        }
        var data = new FormData(contact);
        var message =
          "Styling request from " +
          data.get("name") +
          " | Contact: " +
          data.get("contact") +
          " | Interest: " +
          data.get("interest") +
          " | Message: " +
          data.get("message");
        if (note) note.textContent = "Request prepared. Please send it through Instagram or boutique contact.";
        try {
          sessionStorage.setItem("eg-last-request", message);
        } catch (error) {
          return;
        }
        contact.reset();
      });
    }

    var newsletter = qs("[data-newsletter]");
    var newsletterNote = qs("[data-newsletter-note]");
    if (newsletter) {
      newsletter.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!newsletter.checkValidity()) {
          newsletter.reportValidity();
          return;
        }
        if (newsletterNote) newsletterNote.textContent = "Thank you. You are on the private list.";
        newsletter.reset();
      });
    }
  }

  function initAIConcierge() {
    var concierge = qs("[data-ai-concierge]");
    if (!concierge) return;

    var toggle = qs("[data-ai-toggle]", concierge);
    var close = qs("[data-ai-close]", concierge);
    var panel = qs("[data-ai-panel]", concierge);
    var form = qs("[data-ai-form]", concierge);
    var input = qs("#ai-input", concierge);
    var messages = qs("[data-ai-messages]", concierge);
    var promptButtons = qsa("[data-ai-prompt]", concierge);
    var endpoint = window.ESRA_AI_ENDPOINT || "/api/ai";
    var conversation = [];
    var isThinking = false;

    var boutiqueContext =
      "You are Élise d’Or, the AI Couture Concierge for Esra Güvener, a luxury women's fashion boutique. " +
      "Brand facts: Sempre, USA Original, Italy and France inspired, luxury woman wearing, high-quality limited edition. " +
      "Policy: Değişim 3 gün. İade yok. Location: Google Maps link https://g.co/kgs/5kCNJYR. " +
      "Tone: elegant, concise, warm, premium, conversion-minded. Never invent live inventory or prices. Invite users to visit, send Instagram message, or view the gallery.";

    function setOpen(open) {
      if (!toggle || !panel) return;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      body.classList.toggle("ai-open", open);
      if (open && input) {
        window.setTimeout(function () {
          input.focus();
        }, 120);
      }
    }

    function appendMessage(role, text, typing) {
      if (!messages) return null;
      var article = document.createElement("article");
      article.className = "ai-message ai-message--" + role + (typing ? " is-typing" : "");

      var mark = document.createElement("span");
      mark.textContent = role === "user" ? "Me" : "É";

      var paragraph = document.createElement("p");
      paragraph.textContent = text;

      article.appendChild(mark);
      article.appendChild(paragraph);
      messages.appendChild(article);
      messages.scrollTop = messages.scrollHeight;
      return article;
    }

    function scrollToRelevantSection(message) {
      var lower = message.toLowerCase();
      var target = null;
      if (lower.indexOf("gallery") >= 0 || lower.indexOf("look") >= 0) target = "#gallery";
      if (lower.indexOf("bag") >= 0 || lower.indexOf("collection") >= 0 || lower.indexOf("arrival") >= 0) target = "#collections";
      if (lower.indexOf("visit") >= 0 || lower.indexOf("map") >= 0 || lower.indexOf("location") >= 0) target = "#visit";
      if (lower.indexOf("contact") >= 0 || lower.indexOf("request") >= 0) target = "#contact";
      if (!target) return;
      var section = qs(target);
      if (section) section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    function localReply(message) {
      var lower = message.toLowerCase();

      if (lower.indexOf("return") >= 0 || lower.indexOf("exchange") >= 0 || lower.indexOf("policy") >= 0 || lower.indexOf("iade") >= 0) {
        return "The boutique policy is beautifully simple: Değişim 3 gün, and İade yok. For the smoothest experience, confirm sizing and condition in person before purchase.";
      }

      if (lower.indexOf("visit") >= 0 || lower.indexOf("map") >= 0 || lower.indexOf("location") >= 0 || lower.indexOf("where") >= 0) {
        return "For a boutique visit, use the official Google Maps listing: https://g.co/kgs/5kCNJYR. I recommend viewing New Arrivals first, then finishing with Luxury Bags for a complete look.";
      }

      if (lower.indexOf("bag") >= 0 || lower.indexOf("accessor") >= 0) {
        return "Start with the Luxury Bags edit. A structured red or warm neutral bag adds immediate polish to cream, polka-dot, and monochrome sets. View the collection section, then ask for the bag that best matches your outfit mood.";
      }

      if (lower.indexOf("dress") >= 0 || lower.indexOf("dinner") >= 0 || lower.indexOf("evening") >= 0 || lower.indexOf("wedding") >= 0) {
        return "For an elegant dinner or event, choose a limited dress or polished set with one statement accessory. Keep the palette soft cream, black, nude pink, or champagne gold, then add a luxury bag for contrast.";
      }

      if (lower.indexOf("limited") >= 0 || lower.indexOf("arrival") >= 0 || lower.indexOf("collection") >= 0 || lower.indexOf("new") >= 0) {
        return "The strongest path is New Arrivals for freshness, Limited Edition for scarcity, and European Collection for a refined Italy-France mood. Because pieces are limited, visit or message quickly when a look feels right.";
      }

      if (lower.indexOf("style") >= 0 || lower.indexOf("outfit") >= 0 || lower.indexOf("wear") >= 0 || lower.indexOf("recommend") >= 0) {
        return "I would style you in a complete premium set first: tailored proportion, a feminine silhouette, and a single luxury bag. Choose cream or black for quiet luxury, nude pink for softness, or champagne gold accents for evening presence.";
      }

      return "For Esra Güvener, I recommend starting with the cinematic gallery, choosing one hero piece, then building the look with a premium set or luxury bag. Tell me the occasion, preferred color, and whether you want soft feminine or bold editorial styling.";
    }

    function askRemoteAI(message) {
      if (!endpoint) return Promise.reject(new Error("No secure AI endpoint configured."));

      var remoteMessages = [{ role: "system", content: boutiqueContext }].concat(conversation.slice(-8));

      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "meta/llama-4-maverick-17b-128e-instruct",
          messages: remoteMessages,
          max_tokens: 512,
          temperature: 0.78,
          top_p: 0.92,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false
        })
      })
        .then(function (response) {
          if (!response.ok) throw new Error("AI endpoint unavailable.");
          return response.json();
        })
        .then(function (data) {
          if (data.reply) return data.reply;
          if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
          throw new Error("Unexpected AI response.");
        });
    }

    function submitMessage(rawMessage) {
      var message = rawMessage.trim();
      if (!message || isThinking) return;

      isThinking = true;
      appendMessage("user", message);
      conversation.push({ role: "user", content: message });
      if (input) input.value = "";
      scrollToRelevantSection(message);

      var typing = appendMessage("assistant", "Curating a refined answer", true);

      askRemoteAI(message)
        .catch(function () {
          return window.Promise.resolve(localReply(message));
        })
        .then(function (reply) {
          if (typing) typing.remove();
          appendMessage("assistant", reply);
          conversation.push({ role: "assistant", content: reply });
        })
        .finally(function () {
          isThinking = false;
          if (input) input.focus();
        });
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        setOpen(panel ? panel.hidden : true);
      });
    }

    if (close) {
      close.addEventListener("click", function () {
        setOpen(false);
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!input || !input.value.trim()) return;
        submitMessage(input.value);
      });
    }

    promptButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var prompt = button.getAttribute("data-ai-prompt") || button.textContent;
        setOpen(true);
        submitMessage(prompt);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel && !panel.hidden) setOpen(false);
    });
  }

  function initBackTop() {
    var button = qs("[data-back-top]");
    if (!button) return;
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  function initImageStates() {
    qsa("img").forEach(function (image) {
      if (image.complete) image.classList.add("is-loaded");
      image.addEventListener("load", function () {
        image.classList.add("is-loaded");
      });
      image.addEventListener("error", function () {
        image.classList.add("is-error");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initLoader();
    initMobileMenu();
    initScrollUI();
    initReveal();
    initLazyEmbeds();
    initMarquees();
    initParticles();
    initCursor();
    initForms();
    initAIConcierge();
    initBackTop();
    initImageStates();
  });
})();
