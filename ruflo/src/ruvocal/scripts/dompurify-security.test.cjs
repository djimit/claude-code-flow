const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const DOMPurify = require('isomorphic-dompurify');
const createDOMPurify = require('dompurify');
const { JSDOM } = createRequire(require.resolve('isomorphic-dompurify'))('jsdom');

test('CodeBlock sanitizer preserves highlighted code and removes executable markup', () => {
	const code = '<span class="hljs-keyword">const</span> value = 42;';
	assert.equal(DOMPurify.sanitize(code), code);
	assert.equal(DOMPurify.sanitize('<img src="x" onerror="alert(1)"><script>alert(1)</script>'), '<img src="x">');
});

test('template expressions split across removed shadow-root elements are scrubbed', () => {
	const window = new JSDOM('').window;
	try {
		const purify = createDOMPurify(window);
		for (const fragments of [['$', '{7*7}'], ['{', '{7*7}', '}'], ['<', '%7*7%', '>']]) {
			const host = window.document.createElement('div');
			const shadow = host.attachShadow({ mode: 'open' });
			for (const fragment of fragments) {
				shadow.append(fragment, window.document.createElement('object'));
			}
			purify.sanitize(host, { IN_PLACE: true, SAFE_FOR_TEMPLATES: true });
			assert.doesNotMatch(shadow.textContent, /\$\{|\{\{|<%/);
		}
	} finally {
		window.close();
	}
});
