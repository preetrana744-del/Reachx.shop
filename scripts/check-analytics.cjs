// Behavioral tests for custom event dispatch, consent-independent payload safety,
// keyboard parity, invalid forms, login gating and section visibility deduplication.
// No browser requests, mail clients, payment pages or customer data are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const trackerPath = process.argv[2] || require('node:path').join(__dirname, '..', 'reachx-analytics.js');
const listeners = new Map();
let sent = [];
let observer;
const sections = [{ id: 'home' }, { id: 'services' }, { id: 'PRIVATE_CUSTOMER_VALUE' }];
const nodes = new Map([
  ['checkoutForm', { checkValidity: () => true }],
  ['summaryPlan', { textContent: 'Pro' }],
  ['summaryBilling', { textContent: '3 months' }],
  ['paymentPlan', { textContent: 'Pro' }],
  ['paymentBilling', { textContent: '3 months' }],
  ['planModalTitle', { textContent: 'Pro Plan' }],
  ['planAuthPanel', { hidden: false }]
]);
class Observer {
  constructor(callback, options) { this.callback = callback; this.options = options; this.observed = []; this.unobserved = []; observer = this; }
  observe(node) { this.observed.push(node); }
  unobserve(node) { this.unobserved.push(node); }
}
const record = (...args) => sent.push(args);
const context = {
  URL,
  window: { location: { pathname: '/', href: 'https://reachx.shop/?email=PRIVATE_CUSTOMER_VALUE' }, gtag: record, IntersectionObserver: Observer },
  document: {
    addEventListener: (type, fn) => listeners.set(type, [...(listeners.get(type) || []), fn]),
    getElementById: id => nodes.get(id) || null,
    querySelectorAll: selector => selector === '[data-section]' ? sections : []
  }
};
vm.runInNewContext(fs.readFileSync(trackerPath, 'utf8'), context, { filename: trackerPath });

function el(matches = {}, properties = {}) {
  return { closest: selector => matches[selector] || null, ...properties };
}
function dispatch(type, target, event = {}) {
  sent = [];
  for (const listener of listeners.get(type) || []) listener({ target, ...event });
  return sent.map(args => ({ name: args[1], ...args[2] }));
}
function click(matches, props) { return dispatch('click', el(matches, props)); }
function anchor(href) { return { getAttribute: key => key === 'href' ? href : null }; }
function cardEvents(type, selector, card, event) {
  return dispatch(type, el({ [selector]: card, '.planCard, .service': card }), event);
}
const plan = name => ({ dataset: { plan: name }, tagName: 'DIV', getAttribute: key => key === 'role' ? 'button' : null });
const service = name => ({ dataset: { service: name }, tagName: 'DIV', getAttribute: key => key === 'role' ? 'button' : null });

for (const href of ['mailto:reachx.shop@gmail.com?body=PRIVATE_CUSTOMER_VALUE', 'https://mail.google.com/mail/?view=cm&fs=1&to=reachx.shop@gmail.com&body=PRIVATE_CUSTOMER_VALUE']) {
  const found = click({ 'a[href]': anchor(href) });
  assert.equal(found.length, 1);
  assert.equal(found[0].name, 'contact_click');
  assert.equal(found[0].contact_method, 'email');
  assert(!JSON.stringify(found).includes('PRIVATE_CUSTOMER_VALUE'));
}
assert.equal(click({ 'a[href]': anchor('https://mail.google.com/mail/') }).length, 0);
assert.equal(click({ 'a[href]': anchor('https://mail.google.com.bad.example/?view=cm') }).length, 0);
for (const href of ['https://wa.me/18268886971', 'https://api.whatsapp.com/send?phone=PRIVATE_CUSTOMER_VALUE']) {
  assert.equal(click({ 'a[href]': anchor(href) })[0].contact_method, 'whatsapp');
}
assert.equal(click({ 'a[href]': anchor('https://wa.me.bad.example/') }).length, 0);

const pro = plan('Pro');
assert.equal(cardEvents('click', '.planCard', pro)[0].plan_name, 'Pro');
assert.equal(cardEvents('keydown', '.planCard', pro, { key: 'Enter' })[0].name, 'plan_select');
assert.equal(cardEvents('keydown', '.planCard', pro, { key: ' ' })[0].plan_name, 'Pro');
assert.equal(cardEvents('keydown', '.planCard', pro, { key: 'Enter', repeat: true }).length, 0);
assert.equal(cardEvents('keydown', '.planCard', { ...pro, tagName: 'BUTTON' }, { key: 'Enter' }).length, 0);
assert.equal(cardEvents('keydown', '.planCard', pro, { key: 'Tab' }).length, 0);
assert.equal(cardEvents('click', '.planCard', plan('PRIVATE_CUSTOMER_VALUE'))[0].plan_name, 'unknown');

const seo = service('SEO & Google Visibility');
assert.equal(cardEvents('click', '.service', seo)[0].name, 'service_select');
assert.equal(cardEvents('keydown', '.service', seo, { key: 'Enter' })[0].service_name, 'SEO & Google Visibility');
assert.equal(cardEvents('keydown', '.service', seo, { key: ' ' })[0].service_name, 'SEO & Google Visibility');
assert.equal(cardEvents('click', '.service', service('PRIVATE_CUSTOMER_VALUE')).length, 0);
const website = { ...service(undefined), querySelector: selector => selector === '.serviceTitle' ? { textContent: 'Website Development' } : null };
assert.equal(cardEvents('click', '.service', website)[0].service_name, 'Website Development');

let found = click({ '#planModalCta': {} });
assert.equal(found.length, 1);
assert.equal(found[0].name, 'plan_continue_click');
assert.equal(found[0].requires_login, true);
nodes.set('planAuthPanel', { hidden: true });
found = click({ '#planModalCta': {} });
assert.equal(found.find(event => event.name === 'begin_checkout').plan_name, 'Pro');
assert.equal(found.find(event => event.name === 'begin_checkout').billing_period, '3 months');

nodes.set('checkoutForm', { checkValidity: () => false });
assert.equal(click({ '#checkoutToReview': {} }).length, 0);
nodes.set('checkoutForm', { checkValidity: () => true });
found = click({ '#checkoutToReview': {} });
assert.equal(found[0].name, 'checkout_review');
assert.equal(found[0].plan_name, 'Pro');
assert.equal(click({ '#checkoutToPayment': {} })[0].name, 'checkout_payment_step');
found = click({ '#payWithWise': {} });
assert.equal(found[0].name, 'payment_link_click');
assert.equal(found[0].payment_provider, 'wise');
assert.equal(found[0].billing_period, '3 months');
assert.equal(found.some(event => ['purchase', 'generate_lead'].includes(event.name)), false);

found = dispatch('change', el({ '#billingOptions': {} }, { name: 'billing', value: '1' }));
assert.equal(found[0].name, 'billing_select');
assert.equal(found[0].billing_period, '1 month');
assert.equal(found[0].plan_name, 'Pro');
assert.equal(dispatch('change', el({ '#billingOptions': {} }, { name: 'billing', value: 'PRIVATE_CUSTOMER_VALUE' })).length, 0);
assert.equal(dispatch('change', el({ '#billingOptions': {} }, { name: 'billing', value: 'constructor' })).length, 0);
assert.equal(dispatch('change', el({}, { name: 'email', value: 'PRIVATE_CUSTOMER_VALUE' })).length, 0);
assert.equal(dispatch('submit', el({}, { id: 'queryForm', email: 'PRIVATE_CUSTOMER_VALUE' }))[0].name, 'enquiry_email_open');
assert.equal(dispatch('submit', el({}, { id: 'topAuthForm', email: 'PRIVATE_CUSTOMER_VALUE' })).length, 0);

assert.equal(click({ '.chapterNav button[data-target]': { dataset: { target: '3' } } })[0].section_name, 'project_enquiry');
assert.equal(click({ '.chapterNav button[data-target]': { dataset: { target: 'constructor' } } }).length, 0);
assert.equal(observer.observed.length, 2);
sent = [];
observer.callback([{ target: sections[0], isIntersecting: true, intersectionRatio: 0.05 }]);
assert.equal(sent.length, 0);
observer.callback([{ target: sections[0], isIntersecting: true, intersectionRatio: 0.25 }]);
assert.equal(sent.length, 1);
assert.equal(sent[0][1], 'section_view');
assert.equal(sent[0][2].section_name, 'home');
observer.callback([{ target: sections[0], isIntersecting: true, intersectionRatio: 0.5 }]);
assert.equal(sent.length, 1);
observer.callback([{ target: sections[2], isIntersecting: true, intersectionRatio: 1 }]);
assert.equal(sent.length, 1);
assert.equal(observer.unobserved[0], sections[0]);
assert.equal(sent[0][2].send_to, 'G-5PS7FT8WVV');
assert.equal(sent[0][2].page_path, '/');
assert(!JSON.stringify(sent).includes('PRIVATE_CUSTOMER_VALUE'));

context.window.gtag = undefined;
assert.doesNotThrow(() => click({ 'a[href]': anchor('mailto:reachx.shop@gmail.com') }));
assert.doesNotThrow(() => dispatch('click', null));
console.log('PASS: existing event names; email/Gmail/WhatsApp; mouse/keyboard service + plan parity; login-gated checkout; invalid form suppression; billing; safe section views + deduplication.');
console.log('PASS: fixed allowlists reject arbitrary customer-like text, query strings and unsafe values; no fake lead or purchase event; missing gtag does not break the UI.');
console.log('Scope: isolated behavioral tests only; GA4 ingestion must be verified separately in the live browser/Analytics.');
