(function () {
  var form = document.getElementById("piq-form");
  if (!form) return;

  var submitBtn = document.getElementById("piq-submit");
  var errorEl = document.getElementById("piq-error");
  var waitEl = document.getElementById("piq-wait");
  var addressInput = document.getElementById("piq-address");
  var busy = false;
  var CLIENT_TIMEOUT_MS = 35000;

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
    submitBtn.textContent = on ? "Opening your PropIQ report…" : "Get my free report";
    waitEl.hidden = !on;
  }

  addressInput.addEventListener("input", function () {
    var value = addressInput.value.trim();
    var weak = value.length > 0 && (!/[A-Za-z]/.test(value) || !/\d/.test(value));
    addressInput.setAttribute("aria-invalid", weak ? "true" : "false");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    clearError();

    var email = form.email.value;
    var address = form.address.value.trim();
    var journeyInput = form.querySelector('input[name="journey"]:checked');
    var context = form.context.value.trim();
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
    if (!journeyInput) {
      showError("Pick the closest. It shapes the report, not a hard commitment.");
      return;
    }
    if (!consent) {
      showError("Tick the box so we can pass your details to PropIQ and open the report.");
      return;
    }

    var payload = {
      email: email.trim(),
      address: address,
      journey: journeyInput.value,
    };
    if (context) payload.context = context;

    setBusy(true);
    if (window.umami) {
      window.umami.track("property-iq-submit", { location: "property-iq" });
    }

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, CLIENT_TIMEOUT_MS);

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
        var url = result.body && result.body.url;
        if (result.status === 201 && typeof url === "string" && url.indexOf("https://") === 0) {
          if (window.umami) {
            window.umami.track("property-iq-opened", { location: "property-iq" });
          }
          window.location.assign(url);
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
      })
      .finally(function () {
        clearTimeout(timer);
      });
  });
})();
