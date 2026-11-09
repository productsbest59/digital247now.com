// Use the provider's standard form flow so its CAPTCHA runs before delivery.
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const message = document.getElementById('formMessage');
  const name = form.elements.namedItem('name');
  const button = form.querySelector('button[type="submit"]');
  const strings = {
    name: ['נא להזין שם מלא, ללא קישורים או פרסומות.', 'Please enter your full name without links or advertisements.'],
    spam: ['לא ניתן לשלוח הודעת פרסומת זו.', 'This promotional submission cannot be sent.'],
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
  function validName() {
    const value = name.value.trim();
    const containsLink = /https?:\/\/|www\.|google\.com\/share\.google/i.test(value);
    name.setCustomValidity(value.length < 2 || containsLink ? localized('name') : '');
  }

  name.addEventListener('input', () => {
    validName();
    message.style.display = 'none';
  });
  form.addEventListener('submit', event => {
    if (submitting) {
      event.preventDefault();
      return;
    }
    message.style.display = 'none';
    validName();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    const honey = form.elements.namedItem('_honey');
    const values = ['name', 'email', 'phone', 'message']
      .map(key => form.elements.namedItem(key).value).join(' ');
    if (honey.value || /promo\s+code\s+grab|google\.com\/share\.google/i.test(values)) {
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
    button.disabled = false;
    button.textContent = button.getAttribute(document.documentElement.lang === 'en' ? 'data-en' : 'data-he');
  });
})();
