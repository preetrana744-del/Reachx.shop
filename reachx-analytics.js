/* ReachX GA4 custom interaction tracking.
 * No customer names, email addresses, phone numbers or form values are sent.
 * Click events indicate intent, not completed enquiries or successful payments.
 */
(() => {
  'use strict';
  const measurementId = 'G-5PS7FT8WW';
  function send(name, details) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      send_to: measurementId,
      page_path: window.location.pathname,
      ...details
    });
  }
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    const link = target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (/^mailto:/i.test(href)) {
        send('contact_click', { contact_method: 'email' });
      } else {
        try {
          const url = new URL(href, window.location.href);
          if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com') {
            send('contact_click', { contact_method: 'whatsapp' });
          }
        } catch (_) { /* Ignore invalid/non-web links. */ }
      }
    }
    const plan = target.closest('.planCard');
    if (plan) {
      send('plan_select', { plan_name: String(plan.dataset.plan || 'unknown').slice(0, 40) });
    }
    if (target.closest('#checkoutToReview')) {
      const form = document.getElementById('checkoutForm');
      if (!form || form.checkValidity()) send('checkout_review', {});
    }
    if (target.closest('#checkoutToPayment')) send('checkout_payment_step', {});
    if (target.closest('#payWithWise')) {
      send('payment_link_click', {
        payment_provider: 'wise',
        plan_name: String(document.getElementById('paymentPlan')?.textContent || 'unknown').trim().slice(0, 40),
        billing_period: String(document.getElementById('paymentBilling')?.textContent || 'unknown').trim().slice(0, 40)
      });
    }
  }, true);
  document.addEventListener('submit', (event) => {
    if (event.target?.id === 'queryForm') {
      // The contact form opens a mail client; the email is not necessarily sent.
      send('enquiry_email_open', {});
    }
  }, true);
})();
