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
		value && value.nodeType
			? value
			: (value == null || value === '' ? '—' : String(value))
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

		// The listener address is edited in place. The page polls every few
		// seconds, so the edit that is not applied yet is kept aside: the
		// poll must not wipe it, and it must not take the focus away from
		// the field that is being typed in.
		let listenerDraft = null;
		let listenerEditor = null;

		function renderStatus(status, error) {
			while (statusArea.firstChild)
				statusArea.removeChild(statusArea.firstChild);

			if (error) {
				statusArea.appendChild(E('div', { 'class': 'alert-message' },
					_('Could not read the dae service state.')));
				statusArea.appendChild(E('p', { 'class': 'dae-note' },
					_('If luci-app-dae was installed just now, restart rpcd so that its backend is registered.')));
				return;
			}

			// A reply without the expected fields is a backend that did not
			// answer, not a service that is switched off: showing it as
			// "disabled" would hide the real problem.
			if (!status || typeof status !== 'object' || typeof status.listen !== 'string') {
				statusArea.appendChild(E('div', { 'class': 'alert-message' },
					_('Could not read the dae service state.')));
				statusArea.appendChild(E('p', { 'class': 'dae-note' },
					_('If luci-app-dae was installed just now, restart rpcd so that its backend is registered.')));
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
					metaItem(_('Listener'), listenerEditorNode())
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

			const errors = (Array.isArray(status.errors) ? status.errors : [])
				.filter(function(token) { return token !== 'disabled'; });
			if (errors.length)
				statusCard.appendChild(E('ul', { 'class': 'alert-message' },
					errors.map(function(token) { return E('li', {}, dae.statusIssue(token)); })));

			statusArea.appendChild(statusCard);
			statusArea.appendChild(renderDetails(status));
			statusArea.appendChild(renderSecret(status));
		}

		/*
		 * The listener address is edited in place: an address field and a
		 * port field, and a button that saves them. The editor is built
		 * once and kept, so a poll does not take the focus away from the
		 * field that is being typed in.
		 */
		function listenerEditorNode() {
			if (!listenerEditor)
				createListenerEditor();

			const parts = dae.splitListen(currentStatus ? currentStatus.listen : '');
			const active = document.activeElement;

			if (!listenerDraft && active !== listenerEditor.address && active !== listenerEditor.port) {
				if (listenerEditor.address.value !== parts.address)
					listenerEditor.address.value = parts.address;
				if (listenerEditor.port.value !== parts.port)
					listenerEditor.port.value = parts.port;
			}

			listenerEditor.apply.disabled = busy;
			return listenerEditor.node;
		}

		function createListenerEditor() {
			const address = E('input', { 'class': 'dae-listen-input', 'type': 'text', 'placeholder': '0.0.0.0' });
			const port = E('input', { 'class': 'dae-listen-input dae-listen-port', 'type': 'number', 'min': '1', 'max': '65535' });
			const apply = E('button', { 'class': 'cbi-button cbi-button-action', 'type': 'button' }, _('Apply'));

			const remember = function() {
				listenerDraft = { address: address.value.trim(), port: port.value.trim() };
			};
			address.addEventListener('input', remember);
			port.addEventListener('input', remember);

			apply.addEventListener('click', function() {
				const addressValue = address.value.trim();
				const portValue = parseInt(port.value, 10);

				if (!addressValue || !Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
					actionMessage.textContent = _('The listener address is invalid. Use a numeric address and a port between 1 and 65535.');
					return;
				}

				busy = true;
				actionMessage.textContent = _('Working…');
				renderStatus(currentStatus, null);

				dae.setListen(addressValue, portValue).then(dae.ensureOk).then(function(result) {
					listenerDraft = null;
					actionMessage.textContent = dae.resultMessage(result, _('The operation completed.'));
				}).catch(function(error) {
					actionMessage.textContent = dae.errorMessage(error, _('The operation failed.'));
				}).finally(function() {
					busy = false;
					refresh();
				});
			});

			listenerEditor = {
				node: E('span', { 'class': 'dae-listen-editor' }, [
					address,
					E('span', { 'class': 'dae-listen-sep' }, ':'),
					port,
					apply
				]),
				address: address,
				port: port,
				apply: apply
			};
		}

		function editorFocused() {
			if (!listenerEditor)
				return false;

			const active = document.activeElement;
			return active === listenerEditor.address || active === listenerEditor.port;
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
				// A rebuild takes the focus away from the field that is being
				// typed in, so the page waits until that field is left.
				if (editorFocused())
					return;

				renderStatus(status, null);
			}).catch(function() {
				if (editorFocused())
					return;

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
