/*
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * The LuCI entry of the dae engine. The doona panel runs in the browser and
 * talks to dae over the engine's native HTTP API, so this page only frames
 * it: the panel URL is the API listener plus /ui/.
 */

'use strict';
'require view';
'require uci';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('dae'),
			view.load(),
		]);
	},

	render: function() {
		const listen = uci.get('dae', 'main', 'api_listen') || '0.0.0.0:9527';
		const port = (listen.match(/:(\d+)$/) || [])[1] || '9527';
		const src = window.location.protocol + '//' + window.location.hostname + ':' + port + '/ui/';

		return E('div', [
			E('h2', {}, _('dae Engine')),
			E('div', { 'class': 'cbi-map-descr' },
				_('The doona panel serves the dae engine over its native HTTP API. It runs in the browser, so this page only frames it.')),
			E('p', { 'style': 'margin: 0 0 10px 0; color: #888; font-size: 90%;' },
				_('The panel asks for the API secret on first use. Read it with: uci get dae.main.api_secret')),
			E('iframe', {
				'class': 'dae-panel-frame',
				'src': src,
				'title': 'dae panel',
				'style': 'width: 100%; height: calc(100vh - 190px); min-height: 560px; border: 0; border-radius: 4px; background: #1c1c1c;',
			}),
		]);
	},
});
