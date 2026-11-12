// Use the provider's standard form flow so its CAPTCHA runs before delivery.
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const message = document.getElementById('formMessage');
  const name = form.elements.namedItem('name');
  const button = form.querySelector('button[type="submit"]');
  const strings = {
    name: ['נא להזין שם מלא, ללא קישורים או פרסומות.', 'Please enter your full name without links or advertisements.'],
    links: ['Links are not allowed in the name or message. Remove the link to send.', 'Links are not allowed in the name or message. Remove the link to send.'],
    spam: ['נא להסיר קישורים ומילות פרסום מהשם ומתוכן ההודעה לפני השליחה.', 'Please remove links and promotional words from your name and message before sending.'],
    sent: ['הפנייה נשלחה בהצלחה.', 'Your message has been sent successfully.'],
    sending: ['מעבירים אותך לאימות ושליחה…', 'Continuing to verification and sending…']
  };
  let submitting = false;

  function localized(key) {
    return strings[key][document.documentElement.lang === 'en' ? 1 : 0];
  }
  function showMessage(key) {
    message.setAttribute('data-he', strings[key][0]);
    message.setAttribute('data-en', strings[key][1]);
    message.textContent = localized(key);
    message.style.display = 'block';
  }
  function normalized(value) {
    return value.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
  }
  function hasLink(value) {
    return /(?:https?:\/\/|ftp:\/\/|www\.|(?:[\p{L}\p{N}-]+\.)+(?:[\p{L}]{2,63}|xn--[a-z0-9-]+)(?=$|[^\p{L}\p{N}-]))/iu.test(normalized(value));
  }
  function hasBlockedWords(value) {
    return /(?:^|[^\p{L}\p{N}])(?:casino|casinos|promo|promos|code|codes|קזינו|קוד|קודים|פרומו)(?=$|[^\p{L}\p{N}])/iu.test(normalized(value));
  }
  function validName() {
    const value = name.value.trim();
    const containsLink = hasLink(value) || hasBlockedWords(value);
    name.setCustomValidity(hasLink(value) ? localized('links') : value.length < 2 || containsLink ? localized('name') : '');
  }

  const messageField = form.elements.namedItem('message');
  function validateLinks() {
    validName();
    const blocked = hasLink(name.value) || hasLink(messageField.value);
    messageField.setCustomValidity(hasLink(messageField.value) ? localized('links') : '');
    button.disabled = submitting || blocked;
    if (blocked) showMessage('links');
    else if (strings.links.includes(message.textContent)) message.style.display = 'none';
  }
  name.addEventListener('input', validateLinks);
  messageField.addEventListener('input', validateLinks);
  form.addEventListener('submit', event => {
    if (submitting) {
      event.preventDefault();
      return;
    }
    message.style.display = 'none';
    validateLinks();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    const honey = form.elements.namedItem('_honey');
    const messageText = form.elements.namedItem('message').value;
    if (honey.value || hasLink(messageText) || hasBlockedWords(messageText)) {
      event.preventDefault();
      showMessage('spam');
      return;
    }
    // Allow native submission; do not send through the CAPTCHA-free AJAX endpoint.
    submitting = true;
    button.disabled = true;
    button.textContent = localized('sending');
  });

  // The provider returns here after its verification and successful submission.
  const url = new URL(location.href);
  if (url.searchParams.get('contact') === 'sent') {
    showMessage('sent');
    url.searchParams.delete('contact');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  // Back navigation from verification must leave the form usable.
  window.addEventListener('pageshow', () => {
    submitting = false;
    validateLinks();
    button.textContent = button.getAttribute(document.documentElement.lang === 'en' ? 'data-en' : 'data-he');
  });
})();
