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
		// poll must not wipe it.
		let listenerDraft = null;
		let listenerEditor = null;

		/*
		 * The page is built once and then updated in place. A poll that
		 * rebuilds the whole area every few seconds takes the elements away
		 * from under a click, and a switch or a button that silently does
		 * nothing is worse than one that answers a moment late.
		 */
		const ui = {};

		function build() {
			ui.errorAlert = E('div', { 'class': 'alert-message' },
				_('Could not read the dae service state.'));
			ui.errorNote = E('p', { 'class': 'dae-note' },
				_('If luci-app-dae was installed just now, restart rpcd so that its backend is registered.'));

			ui.badge = E('span', { 'class': 'dae-badge dae-badge--stop' }, _('Disabled'));

			ui.openPanel = E('a', {
				'class': 'cbi-button cbi-button-action',
				'href': null,
				'target': '_blank',
				'rel': 'noopener noreferrer'
			}, _('Open panel'));

			ui.toggle = E('button', {
				'class': 'cbi-button cbi-button-action',
				'type': 'button',
				'data-action': 'start'
			}, _('Start'));
			ui.toggle.addEventListener('click', function() {
				runAction(ui.toggle.getAttribute('data-action'));
			});

			ui.restart = E('button', {
				'class': 'cbi-button',
				'type': 'button',
				'data-action': 'restart'
			}, _('Restart'));
			ui.restart.addEventListener('click', function() {
				runAction('restart');
			});

			ui.statusCard = E('section', { 'class': 'dae-card' }, [
				E('div', { 'class': 'dae-card-head' }, [
					E('div', {}, [
						E('h3', { 'class': 'dae-card-title' }, _('Status')),
						ui.badge
					]),
					E('div', { 'class': 'dae-actions' }, [ ui.openPanel, ui.toggle, ui.restart ])
				]),
				E('div', { 'class': 'dae-meta' }, [
					metaItem(_('Listener'), listenerEditorNode())
				])
			]);

			ui.reason = E('p', { 'class': 'dae-note', 'role': 'status' }, '');
			ui.errors = E('ul', { 'class': 'alert-message' });
			ui.statusCard.appendChild(ui.reason);
			ui.statusCard.appendChild(ui.errors);

			ui.boot = E('input', { 'type': 'checkbox', 'name': 'boot_enabled', 'id': 'dae-boot-enabled' });
			ui.boot.addEventListener('change', function() {
				runAction(ui.boot.checked ? 'enable' : 'disable');
			});

			// The permission to write the configuration files is read by the
			// daemon when it starts, so the switch reaches the core through
			// a restart of the service.
			ui.apiWrite = E('input', { 'type': 'checkbox', 'name': 'api_write', 'id': 'dae-api-write' });
			ui.apiWrite.addEventListener('change', function() {
				setApiWrite(ui.apiWrite.checked);
			});

			ui.serviceCard = E('section', { 'class': 'dae-card' }, [
				E('h3', { 'class': 'dae-card-title' }, _('Service')),
				field(_('Start at boot'), ui.boot),
				field(_('Configuration write'), ui.apiWrite),
				E('p', { 'class': 'dae-note' },
					_('Configuration write lets the panel save changes to the dae configuration files.'))
			]);

			ui.secretValue = E('code', { 'class': 'dae-secret' }, _('Loading…'));
			ui.secretShow = E('button', { 'class': 'cbi-button', 'type': 'button' }, _('Show'));
			ui.secretCopy = E('button', { 'class': 'cbi-button', 'type': 'button', 'disabled': true }, _('Copy'));
			ui.secretCard = E('section', { 'class': 'dae-card' }, [
				E('h3', { 'class': 'dae-card-title' }, _('API secret')),
				E('div', { 'class': 'dae-secret-row' }, [ ui.secretValue, ui.secretShow, ui.secretCopy ]),
				E('p', { 'class': 'dae-note' },
					_('The panel asks for this secret the first time it is opened. It is also readable with: uci get dae.main.api_secret'))
			]);

			statusArea.appendChild(ui.errorAlert);
			statusArea.appendChild(ui.errorNote);
			statusArea.appendChild(ui.statusCard);
			statusArea.appendChild(ui.serviceCard);
			statusArea.appendChild(ui.secretCard);
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

				runAction('set_listen', [ addressValue, portValue ]);
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

		function syncListenerEditor(status) {
			if (!listenerEditor)
				return;

			const parts = dae.splitListen(status.listen);
			const active = document.activeElement;

			if (!listenerDraft && active !== listenerEditor.address && active !== listenerEditor.port) {
				if (listenerEditor.address.value !== parts.address)
					listenerEditor.address.value = parts.address;
				if (listenerEditor.port.value !== parts.port)
					listenerEditor.port.value = parts.port;
			}

			listenerEditor.apply.disabled = busy;
		}

		function update(status, error) {
			// A reply without the expected fields is a backend that did not
			// answer, not a service that is switched off: showing it as
			// "disabled" would hide the real problem.
			const unreadable = !!error || !status || typeof status !== 'object' || typeof status.listen !== 'string';

			ui.errorAlert.hidden = !unreadable;
			ui.errorNote.hidden = !unreadable;
			ui.statusCard.hidden = unreadable;
			ui.serviceCard.hidden = unreadable;

			if (unreadable)
				return;

			currentStatus = status;

			const running = status.running === true;
			const enabled = status.enabled === true;

			ui.badge.className = 'dae-badge %s'.format(running ? 'dae-badge--run' : (enabled ? 'dae-badge--idle' : 'dae-badge--stop'));
			ui.badge.textContent = running ? _('Running') : (enabled ? _('Stopped') : _('Disabled'));

			const url = dae.panelUrl(status);
			if (url) {
				ui.openPanel.setAttribute('href', url);
				ui.openPanel.setAttribute('target', '_blank');
				ui.openPanel.setAttribute('rel', 'noopener noreferrer');
			} else {
				ui.openPanel.removeAttribute('href');
			}

			ui.toggle.textContent = running ? _('Stop') : _('Start');
			ui.toggle.setAttribute('data-action', running ? 'stop' : 'start');
			ui.toggle.disabled = busy || !enabled;
			ui.restart.disabled = busy || !enabled;
			ui.restart.hidden = !running;

			// Why the panel cannot be opened, when it cannot be opened.
			let reason = '';
			if (!url) {
				if (!enabled)
					reason = _('The dae service is disabled.');
				else if (!running)
					reason = _('The dae service is not running.');
				else if (status.panel_available === false)
					reason = _('The panel files are missing. Reinstall the luci-app-dae package.');
				else
					reason = _('The panel is not reachable from this browser.');
			}
			ui.reason.textContent = reason;
			ui.reason.hidden = !reason;

			const errors = (Array.isArray(status.errors) ? status.errors : [])
				.filter(function(token) { return token !== 'disabled'; });
			while (ui.errors.firstChild)
				ui.errors.removeChild(ui.errors.firstChild);
			errors.forEach(function(token) {
				ui.errors.appendChild(E('li', {}, dae.statusIssue(token)));
			});
			ui.errors.hidden = !errors.length;

			// While an operation is running the switches keep the state the
			// user gave them: the status is older than the click.
			if (!busy) {
				ui.boot.checked = status.boot_enabled === true;
				ui.apiWrite.checked = status.api_write === true;
			}
			ui.boot.disabled = busy;
			ui.apiWrite.disabled = busy;

			syncListenerEditor(status);
		}

		function runAction(action, args) {
			if (busy)
				return;

			busy = true;
			actionMessage.textContent = _('Working…');
			update(currentStatus, null);

			const call = args ? dae[action].apply(null, args) : dae[action]();

			call.then(dae.ensureOk).then(function(result) {
				actionMessage.textContent = dae.resultMessage(result, _('The operation completed.'));
			}).catch(function(error) {
				actionMessage.textContent = dae.errorMessage(error, _('The operation failed.'));
			}).finally(function() {
				busy = false;
				refresh();
			});
		}

		function setApiWrite(value) {
			runAction('set_api_write', [ value ]);
		}

		function loadSecret() {
			let secretShown = false;

			dae.secret().then(function(result) {
				const secret = result && result.secret;

				if (!secret) {
					ui.secretValue.textContent = _('The secret is not available to this session.');
					ui.secretShow.disabled = true;
					ui.secretCopy.disabled = true;
					return;
				}

				ui.secretValue.textContent = '••••••••••••';
				ui.secretShow.disabled = false;
				ui.secretCopy.disabled = false;

				ui.secretShow.onclick = function() {
					secretShown = !secretShown;
					ui.secretValue.textContent = secretShown ? secret : '••••••••••••';
					ui.secretShow.textContent = secretShown ? _('Hide') : _('Show');
				};

				ui.secretCopy.onclick = function() {
					ui.secretCopy.disabled = true;

					const done = function() {
						ui.secretCopy.textContent = _('Copied');
						setTimeout(function() {
							ui.secretCopy.textContent = _('Copy');
							ui.secretCopy.disabled = false;
						}, 3000);
					};

					// The clipboard can be out of reach: a browser that is
					// not allowed to use it refuses the write. The secret is
					// shown then, so it can still be taken over by hand.
					const failed = function() {
						secretShown = true;
						ui.secretValue.textContent = secret;
						ui.secretShow.textContent = _('Hide');
						ui.secretCopy.disabled = false;
						actionMessage.textContent = _('The secret could not be written to the clipboard. It is shown instead.');
					};

					if (navigator.clipboard && navigator.clipboard.writeText)
						navigator.clipboard.writeText(secret).then(done, failed);
					else
						failed();
				};
			}).catch(function() {
				ui.secretValue.textContent = _('The secret is not available to this session.');
				ui.secretShow.disabled = true;
				ui.secretCopy.disabled = true;
			});
		}

		function refresh() {
			if (busy)
				return Promise.resolve();

			return dae.status().then(function(status) {
				update(status, null);
			}).catch(function() {
				update(null, true);
			});
		}

		page.appendChild(E('div', { 'class': 'dae-header' }, [
			E('h2', {}, _('dae')),
			E('p', { 'class': 'dae-header-sub' },
				_('The doona panel drives the dae engine over its native HTTP API. dae serves the panel itself; this page shows the service state and opens the panel.'))
		]));
		page.appendChild(statusArea);
		page.appendChild(actionMessage);

		build();
		update(data.status, data.error);
		loadSecret();
		poll.add(refresh, 5);

		return page;
	}
});
