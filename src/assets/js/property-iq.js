(function () {
  var form = document.getElementById("piq-form");
  if (!form) return;

  var submitBtn = document.getElementById("piq-submit");
  var errorEl = document.getElementById("piq-error");
  var waitEl = document.getElementById("piq-wait");
  var waitLabel = document.getElementById("piq-wait-label");
  var waitCopy = document.getElementById("piq-wait-copy");
  var addressInput = document.getElementById("piq-address");
  var suggestList = document.getElementById("piq-suggest-list");
  var suggestStatus = document.getElementById("piq-suggest-status");
  var busy = false;
  var HANDOVER_TIMEOUT_MS = 30000;
  var NOTIFY_TIMEOUT_MS = 15000;
  var EMBED_LOAD_MS = 12000;
  var suggestions = [];
  var activeIndex = -1;
  var suggestTimer = null;
  var suggestAbort = null;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Starting your report…" : "Get my report";
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    waitEl.hidden = !on;
    if (!on) return;
    if (waitLabel) waitLabel.textContent = "Starting your report";
    if (waitCopy) {
      waitCopy.textContent = "PropIQ is opening your report. This usually takes a few seconds. Please keep this tab open.";
    }
  }

  function isHandoverUrl(value) {
    try {
      var parsed = new URL(String(value || ""));
      var host = parsed.hostname.toLowerCase();
      return parsed.protocol === "https:" && (host === "pifiproperty.com" || host.endsWith(".pifiproperty.com"));
    } catch (err) {
      return false;
    }
  }

  function markAddressHint() {
    var value = addressInput.value.trim();
    var weak = value.length > 0 && (!/[A-Za-z]/.test(value) || !/\d/.test(value));
    addressInput.setAttribute("aria-invalid", weak ? "true" : "false");
  }

  function closeSuggestions() {
    suggestions = [];
    activeIndex = -1;
    suggestList.innerHTML = "";
    suggestList.hidden = true;
    addressInput.setAttribute("aria-expanded", "false");
    addressInput.removeAttribute("aria-activedescendant");
  }

  function renderSuggestions() {
    suggestList.innerHTML = "";
    if (!suggestions.length) {
      suggestList.hidden = true;
      addressInput.setAttribute("aria-expanded", "false");
      return;
    }
    suggestions.forEach(function (item, index) {
      var li = document.createElement("li");
      li.className = "piq-suggest__option" + (index === activeIndex ? " is-active" : "");
      li.id = "piq-opt-" + index;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
      li.textContent = item.label;
      li.addEventListener("mousedown", function (event) {
        event.preventDefault();
        chooseSuggestion(index);
      });
      suggestList.appendChild(li);
    });
    suggestList.hidden = false;
    addressInput.setAttribute("aria-expanded", "true");
    if (activeIndex >= 0) {
      addressInput.setAttribute("aria-activedescendant", "piq-opt-" + activeIndex);
    } else {
      addressInput.removeAttribute("aria-activedescendant");
    }
  }

  function typedUnit(value) {
    var text = String(value || "").trim();
    var match = text.match(/^(unit|flat|apartment|apt)\s+(\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?)/i);
    if (match) {
      var word = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      return word + " " + match[2].replace(/\s*\/\s*/g, "/");
    }
    match = text.match(/^(\d+[a-z]?)\s*\/\s*(\d+[a-z]?)/i);
    if (match) return match[1] + "/" + match[2];
    return "";
  }

  function withTypedUnit(typed, suggestion) {
    var unit = typedUnit(typed);
    if (!unit) return suggestion;
    if (suggestion.toLowerCase().indexOf(unit.toLowerCase() + " ") === 0) return suggestion;
    return suggestion.replace(/^\s*(?:unit|flat|apartment|apt)\s+\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?\s*|^\s*\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?\s*/i, unit + " ");
  }

  function chooseSuggestion(index) {
    var item = suggestions[index];
    if (!item) return;
    addressInput.value = withTypedUnit(addressInput.value, item.address);
    markAddressHint();
    if (suggestStatus) suggestStatus.textContent = "Address set to " + item.address;
    closeSuggestions();
  }

  function requestSuggestions(query) {
    if (suggestAbort) suggestAbort.abort();
    suggestAbort = new AbortController();
    fetch("/.netlify/functions/address-suggest?q=" + encodeURIComponent(query), {
      signal: suggestAbort.signal,
      headers: { Accept: "application/json" },
    })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        if (addressInput.value.trim() !== query) return;
        suggestions = (Array.isArray(body.suggestions) ? body.suggestions.slice(0, 8) : []).map(function (item) {
          var address = withTypedUnit(query, item.address || item.label || "");
          return { label: address, address: address };
        });
        activeIndex = suggestions.length ? 0 : -1;
        renderSuggestions();
        if (suggestStatus) {
          suggestStatus.textContent = suggestions.length
            ? suggestions.length + " address suggestions"
            : "No matching address yet";
        }
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        closeSuggestions();
      });
  }

  addressInput.addEventListener("input", function () {
    markAddressHint();
    var query = addressInput.value.trim();
    clearTimeout(suggestTimer);
    if (query.length < 3 || !/[A-Za-z]/.test(query)) {
      closeSuggestions();
      return;
    }
    suggestTimer = setTimeout(function () { requestSuggestions(query); }, 280);
  });

  addressInput.addEventListener("keydown", function (event) {
    if (suggestList.hidden || !suggestions.length) {
      if (event.key === "Escape") closeSuggestions();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
      renderSuggestions();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
      renderSuggestions();
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSuggestions();
    }
  });

  addressInput.addEventListener("blur", function () {
    setTimeout(closeSuggestions, 150);
  });

  function notifyReport(email, address, url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, NOTIFY_TIMEOUT_MS);
    fetch("/.netlify/functions/propiq-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, address: address, url: url }),
      signal: controller.signal,
      keepalive: true,
    }).catch(function () {}).finally(function () { clearTimeout(timer); });
  }

  function hideFormFields() {
    form.querySelectorAll(".ads-form__field, #piq-wait").forEach(function (el) {
      el.hidden = true;
    });
    submitBtn.hidden = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-hidden", "true");
  }

  function openTab(url) {
    var opened = null;
    try {
      opened = window.open(url, "_blank");
    } catch (err) {
      opened = null;
    }
    if (!opened) return false;
    try { opened.opener = null; } catch (err) { /* some browsers lock opener */ }
    return true;
  }

  function showNewTab(url, opened) {
    var success = document.getElementById("piq-success");
    var copy = document.getElementById("piq-success-copy");
    var open = document.getElementById("piq-open");
    var embed = document.getElementById("piq-embed");
    var frame = document.getElementById("piq-frame");
    var stage = document.getElementById("piq-stage");
    if (!url || !success || !open) return;
    if (frame) frame.src = "about:blank";
    if (embed) {
      embed.hidden = true;
      embed.classList.remove("is-visible");
    }
    if (stage) stage.classList.remove("is-embed");
    form.classList.remove("is-embed");
    form.classList.add("is-success");
    hideFormFields();
    copy.textContent = opened
      ? "Your report is open in a new tab, and you're still on Wombat. Open it again any time. A copy may also arrive by email."
      : "You're still on Wombat. Open your report with the button. A copy may also arrive by email.";
    open.href = url;
    success.hidden = false;
    success.classList.add("is-visible");
    if (window.umami) {
      window.umami.track("property-iq-new-tab", { location: "property-iq" });
    }
  }

  function showEmbed(url) {
    var embed = document.getElementById("piq-embed");
    var frame = document.getElementById("piq-frame");
    var pop = document.getElementById("piq-pop");
    var stage = document.getElementById("piq-stage");
    if (!embed || !frame) {
      showNewTab(url, openTab(url));
      return;
    }
    form.classList.add("is-embed");
    if (stage) stage.classList.add("is-embed");
    hideFormFields();
    if (pop) pop.href = url;
    embed.hidden = false;
    embed.classList.add("is-visible");
    var settled = false;
    function giveUp() {
      if (settled) return;
      settled = true;
      showNewTab(url, openTab(url));
    }
    var timer = setTimeout(giveUp, EMBED_LOAD_MS);
    frame.addEventListener("error", function () {
      clearTimeout(timer);
      giveUp();
    }, { once: true });
    frame.addEventListener("load", function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
    }, { once: true });
    frame.src = url;
    if (window.umami) {
      window.umami.track("property-iq-embed", { location: "property-iq" });
    }
  }

  function presentReport(url, email, address, embed) {
    notifyReport(email, address, url);
    setBusy(false);
    if (embed) {
      showEmbed(url);
      return;
    }
    showNewTab(url, openTab(url));
  }

  markAddressHint();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    clearError();

    var email = form.email.value;
    var address = form.address.value.trim();
    var consent = form.consent.checked;

    var emailTrimmed = email.trim();
    if (!emailTrimmed) {
      showError("Add your email so PropIQ can open the report.");
      return;
    }
    if (email !== emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      showError("That doesn't look like an email, have another go.");
      return;
    }
    if (!address) {
      showError("Add a street address so we know which place to look up.");
      return;
    }
    if (address.length > 300 || !/[A-Za-z]/.test(address) || !/\d/.test(address)) {
      showError("We couldn't match that address. Check the spelling, or try the full street including suburb.");
      return;
    }
    if (!consent) {
      showError("Tick the box so we can pass your details to PropIQ and open the report.");
      return;
    }

    var payload = {
      email: email.trim(),
      address: address,
    };

    setBusy(true);
    if (window.umami) {
      window.umami.track("property-iq-submit", { location: "property-iq" });
    }

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, HANDOVER_TIMEOUT_MS);

    fetch("/.netlify/functions/pifi-handover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { status: res.status, body: body };
        });
      })
      .then(function (result) {
        clearTimeout(timer);
        var url = result.body && result.body.url;
        if (result.status === 201 && isHandoverUrl(url)) {
          presentReport(url, payload.email, payload.address, result.body.embed === true);
          return;
        }
        setBusy(false);
        showError(result.body && result.body.message
          ? result.body.message
          : "Something didn't go through. Try again in a minute. If it keeps failing, email us and we'll sort it.");
      })
      .catch(function () {
        setBusy(false);
        showError("Something didn't go through. Try again in a minute. If it keeps failing, email us and we'll sort it.");
      });
  });
})();
