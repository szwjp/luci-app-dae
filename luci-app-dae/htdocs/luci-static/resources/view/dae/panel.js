// SPDX-License-Identifier: GPL-3.0-only
//
// The LuCI page of the dae engine. The doona panel drives dae over its native
// HTTP API and is served by dae itself, so this page does not frame it: it
// shows the state of the service, the address the panel lives at and the
// secret the panel asks for, and it opens the panel in its own tab.

'use strict';
'require poll';
'require view';
'require view.dae.rpc as dae';

function metaItem(label, value) {
	return E('span', { 'class': 'dae-meta-item' }, [
		E('span', { 'class': 'dae-meta-label' }, label),
		value == null || value === '' ? '—' : String(value)
	]);
}

function field(label, value) {
	return E('div', { 'class': 'cbi-value' }, [
		E('label', { 'class': 'cbi-value-title' }, label),
		E('div', { 'class': 'cbi-value-field' }, value)
	]);
}

return view.extend({
	handleSave: null,
	handleSaveApply: null,
	handleReset: null,

	load: function() {
		return dae.status().then(function(status) {
			return { status: status };
		}).catch(function(error) {
			return { error: error.message || String(error) };
		});
	},

	render: function(data) {
		dae.installStyles();

		const page = E('div', { 'class': 'cbi-map dae-page' });
		const statusArea = E('div');
		const actionMessage = E('p', { 'class': 'dae-status-msg', 'role': 'status' }, '');
		let currentStatus = data.status;
		let busy = false;

		function renderStatus(status, error) {
			while (statusArea.firstChild)
				statusArea.removeChild(statusArea.firstChild);

			if (error) {
				statusArea.appendChild(E('div', { 'class': 'alert-message' },
					_('Could not read the dae service state.')));
				return;
			}

			currentStatus = status;

			const running = status.running === true;
			const enabled = status.enabled === true;
			const badge = E('span', {
				'class': 'dae-badge %s'.format(running ? 'dae-badge--run' : (enabled ? 'dae-badge--idle' : 'dae-badge--stop'))
			}, running ? _('Running') : (enabled ? _('Stopped') : _('Disabled')));

			const url = dae.panelUrl(status);
			const openPanel = E(url ? 'a' : 'button', {
				'class': 'cbi-button cbi-button-action',
				'href': url || null,
				'target': url ? '_blank' : null,
				'rel': url ? 'noopener noreferrer' : null,
				'type': url ? null : 'button',
				'disabled': url ? null : true
			}, _('Open panel'));

			const toggle = E('button', {
				'class': 'cbi-button cbi-button-action',
				'type': 'button',
				'data-action': running ? 'stop' : 'start'
			}, running ? _('Stop') : _('Start'));
			toggle.disabled = busy || !enabled;

			const restart = E('button', { 'class': 'cbi-button', 'type': 'button', 'data-action': 'restart' },
				_('Restart'));
			restart.disabled = busy || !enabled;

			const actions = [ openPanel, toggle ];
			if (running)
				actions.push(restart);

			const statusCard = E('section', { 'class': 'dae-card' }, [
				E('div', { 'class': 'dae-card-head' }, [
					E('div', {}, [
						E('h3', { 'class': 'dae-card-title' }, _('Status')),
						badge
					]),
					E('div', { 'class': 'dae-actions' }, actions)
				]),
				E('div', { 'class': 'dae-meta' }, [
					metaItem(_('Listener'), status.listen),
					metaItem(_('Port'), status.port),
					metaItem(_('Panel'), status.ui_path)
				])
			]);

			if (!url) {
				let reason;
				if (!enabled)
					reason = _('The dae service is disabled.');
				else if (!running)
					reason = _('The dae service is not running.');
				else if (status.panel_available === false)
					reason = _('The panel files are missing. Reinstall the luci-app-dae package.');
				else
					reason = _('The panel is not reachable from this browser.');
				statusCard.appendChild(E('p', { 'class': 'dae-note', 'role': 'status' }, reason));
			}
			else {
				// The panel asks for this address on its first run, so it is
				// shown in a form that can be copied.
				statusCard.appendChild(E('p', { 'class': 'dae-note' }, [
					E('span', {}, _('Panel address')),
					E('code', { 'class': 'dae-secret' }, url)
				]));
			}

			const errors = (Array.isArray(status.errors) ? status.errors : [])
				.filter(function(token) { return token !== 'disabled'; });
			if (errors.length)
				statusCard.appendChild(E('ul', { 'class': 'alert-message' },
					errors.map(function(token) { return E('li', {}, dae.statusIssue(token)); })));

			statusArea.appendChild(statusCard);
			statusArea.appendChild(renderDetails(status));
			statusArea.appendChild(renderSecret(status));
		}

		function renderDetails(status) {
			const card = E('section', { 'class': 'dae-card' });
			const boot = E('input', { 'type': 'checkbox', 'name': 'boot_enabled', 'id': 'dae-boot-enabled' });
			boot.checked = status.boot_enabled === true;
			boot.disabled = busy;
			boot.addEventListener('change', function() {
				runAction(boot.checked ? 'enable' : 'disable');
			});

			card.appendChild(E('h3', { 'class': 'dae-card-title' }, _('Service')));
			card.appendChild(field(_('Start at boot'), boot));
			card.appendChild(field(_('Configuration write'),
				E('span', {}, status.api_write === true ? _('Enabled') : _('Disabled'))));
			card.appendChild(E('p', { 'class': 'dae-note' },
				_('Configuration write lets the panel save changes to the dae configuration files.')));
			return card;
		}

		function renderSecret(status) {
			const card = E('section', { 'class': 'dae-card' });
			const value = E('code', { 'class': 'dae-secret' }, _('Loading…'));
			const show = E('button', { 'class': 'cbi-button', 'type': 'button' }, _('Show'));
			const copy = E('button', { 'class': 'cbi-button', 'type': 'button', 'disabled': true }, _('Copy'));

			function renderSecretValue(secret) {
				if (!secret) {
					value.textContent = _('The secret is not available to this session.');
					show.disabled = true;
					copy.disabled = true;
					return;
				}

				value.textContent = secret;
				show.disabled = false;
				copy.disabled = false;
				copy.onclick = function() {
					copy.disabled = true;
					const done = function() {
						copy.textContent = _('Copied');
						setTimeout(function() {
							copy.textContent = _('Copy');
							copy.disabled = false;
						}, 1500);
					};
					if (navigator.clipboard && navigator.clipboard.writeText)
						navigator.clipboard.writeText(secret).then(done, function() {
							copy.disabled = false;
						});
					else
						copy.disabled = false;
				};
			}

			card.appendChild(E('h3', { 'class': 'dae-card-title' }, _('API secret')));
			card.appendChild(E('div', { 'class': 'dae-secret-row' }, [ value, show, copy ]));
			card.appendChild(E('p', { 'class': 'dae-note' },
				_('The panel asks for this secret the first time it is opened. It is also readable with: uci get dae.main.api_secret')));

			dae.secret().then(function(result) {
				renderSecretValue(result && result.secret);
			}).catch(function() {
				renderSecretValue(null);
			});

			return card;
		}

		function refresh() {
			if (busy)
				return Promise.resolve();

			return dae.status().then(function(status) {
				renderStatus(status, null);
			}).catch(function() {
				renderStatus(null, true);
			});
		}

		function runAction(action) {
			if (busy)
				return;

			busy = true;
			actionMessage.textContent = _('Working…');
			renderStatus(currentStatus, null);

			dae[action]().then(dae.ensureOk).then(function(result) {
				actionMessage.textContent = dae.resultMessage(result, _('The operation completed.'));
			}).catch(function(error) {
				actionMessage.textContent = dae.errorMessage(error, _('The operation failed.'));
			}).finally(function() {
				busy = false;
				refresh();
			});
		}

		page.appendChild(E('div', { 'class': 'dae-header' }, [
			E('h2', {}, _('dae')),
			E('p', { 'class': 'dae-header-sub' },
				_('The doona panel drives the dae engine over its native HTTP API. dae serves the panel itself; this page shows the service state and opens the panel.'))
		]));
		page.appendChild(statusArea);
		page.appendChild(actionMessage);

		renderStatus(data.status, data.error);
		poll.add(refresh, 5);

		return page;
	}
});
