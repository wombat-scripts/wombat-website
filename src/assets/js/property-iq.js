(function () {
  var form = document.getElementById("piq-form");
  if (!form) return;

  var submitBtn = document.getElementById("piq-submit");
  var errorEl = document.getElementById("piq-error");
  var waitEl = document.getElementById("piq-wait");
  var elapsedEl = document.getElementById("piq-elapsed");
  var elapsedTimer = null;
  var elapsedStarted = 0;
  var addressInput = document.getElementById("piq-address");
  var suggestList = document.getElementById("piq-suggest-list");
  var suggestStatus = document.getElementById("piq-suggest-status");
  var busy = false;
  var HANDOVER_TIMEOUT_MS = 40000;
  var READY_DELAY_MS = 35000;
  var NOTIFY_TIMEOUT_MS = 15000;
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

  function formatElapsed(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Getting your report…" : "Run your report";
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    waitEl.hidden = !on;
    if (elapsedTimer) {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
    }
    if (!on) return;
    elapsedStarted = Date.now();
    if (elapsedEl) elapsedEl.textContent = "0:00";
    elapsedTimer = setInterval(function () {
      if (elapsedEl) elapsedEl.textContent = formatElapsed(Date.now() - elapsedStarted);
    }, 1000);
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

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function notifyReport(email, address, url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, NOTIFY_TIMEOUT_MS);
    return fetch("/.netlify/functions/propiq-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, address: address, url: url }),
      signal: controller.signal,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; });
      })
      .then(function (body) { return body.emailSent === true; })
      .catch(function () { return false; })
      .finally(function () { clearTimeout(timer); });
  }

  function showSuccess(url, emailSent) {
    var success = document.getElementById("piq-success");
    var copy = document.getElementById("piq-success-copy");
    var open = document.getElementById("piq-open");
    form.querySelectorAll(".ads-form__field, #piq-submit, #piq-wait").forEach(function (el) {
      el.hidden = true;
    });
    copy.textContent = emailSent
      ? "Check your email. The PropIQ report link for this address is on its way, and Tom is copied."
      : "The email may not have sent. You can still open the report from this page.";
    open.href = url;
    success.hidden = false;
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
        if (result.status === 201 && typeof url === "string" && url.indexOf("https://") === 0) {
          return wait(READY_DELAY_MS).then(function () {
            return notifyReport(payload.email, payload.address, url).then(function (emailSent) {
              setBusy(false);
              showSuccess(url, emailSent);
              if (window.umami) {
                window.umami.track("property-iq-ready", {
                  location: "property-iq",
                  emailSent: emailSent ? "yes" : "no",
                });
              }
            });
          });
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
