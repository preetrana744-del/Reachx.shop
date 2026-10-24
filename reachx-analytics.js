/* ReachX GA4 custom interaction tracking.
 * Only fixed service/plan/section labels are sent; no form values, customer
 * details, URL queries, payment links or free-text input are collected here.
 * Contact/payment clicks indicate intent, not completed enquiries or payments.
 */
(() => {
  'use strict';
  const measurementId = 'G-5PS7FT8WVV';
  const plans = new Set(['Basic', 'Pro', 'Advanced']);
  const services = new Set([
    'Website Development', 'Social Media Marketing', 'Local Marketing',
    'SEO & Google Visibility', 'Lead Generation', 'Branding & Creative Content',
    'AI-powered Marketing Strategies', 'AI SEO & Generative Search'
  ]);
  const sections = new Map([
    ['home', 'home'], ['phase1', 'website_and_plans'],
    ['services', 'marketing_services'], ['project-enquiry', 'project_enquiry'],
    ['contact', 'contact']
  ]);
  let selectedPlan = 'unknown';
  function planName(value) {
    const name = String(value || '').trim();
    return plans.has(name) ? name : 'unknown';
  }
  function billingName(value) {
    const name = String(value || '').trim();
    return new Map([['1', '1 month'], ['3', '3 months'], ['1 month', '1 month'], ['3 months', '3 months']]).get(name) || 'unknown';
  }
  function modalPlanName() {
    const name = new Map([['Basic Plan', 'Basic'], ['Pro Plan', 'Pro'], ['Advanced Plan', 'Advanced']])
      .get(document.getElementById('planModalTitle')?.textContent?.trim());
    return name || selectedPlan;
  }
  function checkoutDetails() {
    return {
      plan_name: planName(document.getElementById('summaryPlan')?.textContent) !== 'unknown'
        ? planName(document.getElementById('summaryPlan')?.textContent) : selectedPlan,
      billing_period: billingName(document.getElementById('summaryBilling')?.textContent)
    };
  }
  function send(name, details = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      send_to: measurementId,
      page_path: window.location.pathname,
      ...details
    });
  }
  function trackCard(target) {
    const plan = target.closest('.planCard');
    if (plan) {
      selectedPlan = planName(plan.dataset.plan);
      send('plan_select', { plan_name: selectedPlan });
      return;
    }
    const service = target.closest('.service');
    if (service) {
      const name = service.dataset.service || service.querySelector('.serviceTitle')?.textContent?.trim();
      if (services.has(name)) send('service_select', { service_name: name });
    }
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
          } else if (url.hostname === 'mail.google.com' && url.searchParams.get('view') === 'cm') {
            send('contact_click', { contact_method: 'email', contact_channel: 'gmail' });
          }
        } catch (_) { /* Ignore invalid/non-web links. */ }
      }
    }
    trackCard(target);
    if (target.closest('#planModalCta')) {
      const authPanel = document.getElementById('planAuthPanel');
      send('plan_continue_click', { plan_name: modalPlanName(), requires_login: !!authPanel && !authPanel.hidden });
      // This CTA opens checkout only for authenticated visitors; otherwise it opens login.
      if (authPanel?.hidden) send('begin_checkout', { plan_name: modalPlanName(), billing_period: '3 months' });
    }
    if (target.closest('#checkoutToReview')) {
      const form = document.getElementById('checkoutForm');
      if (form?.checkValidity()) send('checkout_review', checkoutDetails());
    }
    if (target.closest('#checkoutToPayment')) send('checkout_payment_step', checkoutDetails());
    if (target.closest('#payWithWise')) {
      send('payment_link_click', {
        payment_provider: 'wise',
        plan_name: planName(document.getElementById('paymentPlan')?.textContent),
        billing_period: billingName(document.getElementById('paymentBilling')?.textContent)
      });
    }
    const chapter = target.closest('.chapterNav button[data-target]');
    if (chapter) {
      const sectionName = new Map([['0', 'home'], ['1', 'website_and_plans'], ['2', 'marketing_services'], ['3', 'project_enquiry'], ['4', 'contact']]).get(chapter.dataset.target);
      if (sectionName) send('section_navigation', { section_name: sectionName });
    }
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    const card = target.closest('.planCard, .service');
    // Existing cards are DIVs whose keyboard handlers open directly, without a click.
    // Native buttons/links already dispatch a click and must not be counted twice.
    if (card?.tagName === 'DIV' && card.getAttribute('role') === 'button') trackCard(target);
  }, true);
  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('#billingOptions') && target.name === 'billing') {
      const billing = billingName(target.value);
      if (billing !== 'unknown') send('billing_select', { plan_name: checkoutDetails().plan_name, billing_period: billing });
    }
  }, true);
  document.addEventListener('submit', (event) => {
    if (event.target?.id === 'queryForm') {
      // An attempt is separate from the backend-confirmed generate_lead event.
      send('enquiry_submit_attempt');
    }
  }, true);
  if (typeof window.IntersectionObserver === 'function') {
    const seen = new Set();
    const observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        const name = sections.get(entry.target.id);
        if (name && entry.isIntersecting && entry.intersectionRatio >= 0.15 && !seen.has(name)) {
          seen.add(name);
          send('section_view', { section_name: name });
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-section]').forEach(section => {
      if (sections.has(section.id)) observer.observe(section);
    });
  }
})();
