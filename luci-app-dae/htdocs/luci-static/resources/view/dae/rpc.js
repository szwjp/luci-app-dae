// SPDX-License-Identifier: GPL-3.0-only

'use strict';
'require baseclass';
'require rpc';

/*
 * "reject: true" makes a failing ubus call raise instead of resolving with
 * an empty object: LuCI replaces a reply that does not match the "expect"
 * shape with a bare "{}", so without it a backend that is not registered
 * looks like a service that is merely disabled.
 */
const callStatus = rpc.declare({ object: 'dae', method: 'status', expect: { '': {} }, reject: true });
const callSecret = rpc.declare({ object: 'dae', method: 'secret', expect: { '': {} }, reject: true });
const callStart = rpc.declare({ object: 'dae', method: 'start', expect: { '': {} }, reject: true });
const callStop = rpc.declare({ object: 'dae', method: 'stop', expect: { '': {} }, reject: true });
const callRestart = rpc.declare({ object: 'dae', method: 'restart', expect: { '': {} }, reject: true });
const callEnable = rpc.declare({ object: 'dae', method: 'enable', expect: { '': {} }, reject: true });
const callDisable = rpc.declare({ object: 'dae', method: 'disable', expect: { '': {} }, reject: true });
const callSetListen = rpc.declare({
	object: 'dae',
	method: 'set_listen',
	params: [ 'address', 'port' ],
	expect: { '': {} },
	reject: true
});
const callSetApiWrite = rpc.declare({
	object: 'dae',
	method: 'set_api_write',
	params: [ 'value' ],
	expect: { '': {} },
	reject: true
});

let pageStylesInstalled = false;

/*
 * The browser keeps a stylesheet in its cache, so a page that is opened
 * after the package was upgraded would still use the stylesheet of the
 * older version. The version on the URL makes it fetch the current one.
 * It has to be raised whenever dae.css changes.
 */
const STYLE_VERSION = '20261102';

function installStyles() {
	if (pageStylesInstalled || document.getElementById('dae-page-styles'))
		return;

	const stylesheet = document.createElement('link');
	stylesheet.id = 'dae-page-styles';
	stylesheet.rel = 'stylesheet';
	stylesheet.href = L.resource('view/dae/dae.css', '?v=' + STYLE_VERSION);
	document.head.appendChild(stylesheet);
	pageStylesInstalled = true;
}

function isIpLiteral(host) {
	const bare = String(host || '').replace(/^\[|\]$/g, '');
	if (!bare)
		return false;

	if (bare.indexOf(':') >= 0)
		return true;

	const octets = bare.split('.');
	return octets.length === 4 && octets.every(function(part) {
		return /^\d{1,3}$/.test(part) && Number(part) <= 255;
	});
}

function authorityHost(host) {
	const bare = String(host || '').replace(/^\[|\]$/g, '');
	return bare.indexOf(':') >= 0 ? '[' + bare + ']' : bare;
}

function isLoopback(host) {
	const bare = String(host || '').replace(/^\[|\]$/g, '').toLowerCase();
	if (bare === 'localhost' || bare === '::1' || bare === '0:0:0:0:0:0:0:1')
		return true;

	const octets = bare.split('.');
	if (octets.length !== 4 || !octets.every(function(part) { return /^\d{1,3}$/.test(part); }))
		return false;

	// 0.0.0.0 is the unspecified address, not a loopback one.
	if (octets.every(function(part) { return Number(part) === 0; }))
		return false;

	return Number(octets[0]) === 127;
}

function isWildcard(host) {
	const bare = String(host || '').replace(/^\[|\]$/g, '');
	return bare === '0.0.0.0' || bare === '::' || bare === '';
}

// The host part of a "host:port" listener address.
function listenHost(listen) {
	const value = String(listen || '');
	const cut = value.lastIndexOf(':');
	return cut < 0 ? '' : value.slice(0, cut);
}

/*
 * The listener address as the two parts the page edits: the host and the
 * port. The brackets of an IPv6 literal are dropped, because the field that
 * holds the address takes the bare address and the backend adds the brackets
 * back.
 */
function splitListen(listen) {
	const value = String(listen || '');
	const cut = value.lastIndexOf(':');

	if (cut < 0)
		return { address: value, port: '' };

	return {
		address: value.slice(0, cut).replace(/^\[|\]$/g, ''),
		port: value.slice(cut + 1)
	};
}

/*
 * The address the panel is reached at.
 *
 * dae serves the panel from its API listener, so the page has to name the
 * same host the daemon answers on:
 *
 *   - a wildcard bind answers on every address, so the address the browser
 *     already uses for the router is the right one;
 *   - a bind to one address answers there only, so that address is the right
 *     one;
 *   - a loopback bind answers on the router itself, which a browser on
 *     another machine cannot reach.
 *
 * The API checks the Host header: with a wildcard bind it accepts an IP
 * literal or "localhost" only, so a router that was reached by name cannot use
 * the browser's own host.
 *
 * Which address that leaves is not something the backend can know: a router
 * with an uplink and a LAN has an address on each, and only the browser knows
 * which one it can reach. The backend therefore reports a list of candidates
 * and the page takes the first one that belongs to the network the browser is
 * already talking to. Guessing with the LAN address is what made the button
 * point at 192.168.2.1 for a browser that had reached the router at
 * 192.168.1.140.
 */
function panelUrl(status) {
	if (!status || !status.running || !status.panel_available)
		return null;

	const port = Number(status.port);
	if (!Number.isInteger(port) || port < 1 || port > 65535)
		return null;

	const browserHost = (window.location && window.location.hostname) || '';
	const bound = listenHost(status.listen);

	let host;
	if (isWildcard(bound)) {
		host = browserHost;
		if (!isIpLiteral(host) && host !== 'localhost')
			host = pickReachableAddress(status, browserHost);
	}
	else {
		host = bound;
	}

	if (!host)
		return null;

	// A loopback address only reaches a browser on the router itself.
	if (isLoopback(host) && !isLoopback(browserHost))
		return null;

	return 'http://' + authorityHost(host) + ':' + port + '/ui/';
}

// The first reported address that is close enough to the browser to be worth
// trying, or the first reported address when none is.
//
// "Close enough" means the same /24: a router answers on several networks, and
// the one the browser sits in is the one it can always reach. Without a list,
// from an older backend, the single lan_address is used as before.
function pickReachableAddress(status, browserHost) {
	const candidates = Array.isArray(status.lan_addresses) && status.lan_addresses.length
		? status.lan_addresses.filter(isIpLiteral)
		: [];
	if (!candidates.length && status.lan_address)
		candidates.push(status.lan_address);

	if (!candidates.length)
		return '';

	const prefixOf = function(host) {
		const bare = String(host || '').replace(/^\[|\]$/g, '');
		const parts = bare.split('.');
		return parts.length === 4 ? parts.slice(0, 3).join('.') : null;
	};

	const browserPrefix = isIpLiteral(browserHost) ? prefixOf(browserHost) : null;
	if (browserPrefix) {
		const sameNetwork = candidates.find(function(address) {
			return prefixOf(address) === browserPrefix;
		});
		if (sameNetwork)
			return sameNetwork;
	}

	return candidates[0];
}

function statusIssue(token) {
	const messages = {
		disabled: _('The dae service is disabled.'),
		service_not_running: _('The dae service is enabled but not running.'),
		// The secret is created by the first start, but only a start that the
		// init script is allowed to perform: a disabled service is not started
		// at all, so "restart the service" was advice that did nothing on a
		// fresh install. The page only ever shows this after the service was
		// enabled, where starting it really does generate the secret.
		secret_missing: _('The API secret is missing. Restart the service to generate one.'),
		panel_missing: _('The panel files are missing. Reinstall the luci-app-dae package.'),
		loopback_listener: _('The API listens on the router itself, so the panel is not reachable from another machine.'),
		invalid_listener: _('The API listener address is invalid. Check dae.main.api_listen.'),
		started: _('The dae service started.'),
		stopped: _('The dae service stopped.'),
		restarted: _('The dae service restarted.'),
		enabled: _('The dae service starts at boot.'),
		disabled_action: _('The dae service no longer starts at boot.'),
		start_failed: _('The dae service did not start. Check the system log.'),
		stop_failed: _('The dae service did not stop. Check the system log.'),
		restart_failed: _('The dae service did not restart. Check the system log.'),
		enable_failed: _('The dae service was not enabled. Check the system log.'),
		listener_applied: _('The listener address was saved and the service was restarted.'),
		listener_saved: _('The listener address was saved. It takes effect at the next start.'),
		listener_invalid: _('The listener address is invalid. Use a numeric address and a port between 1 and 65535.'),
		listener_reverted: _('The listener address was not accepted: the service did not come up with it, so the previous address was restored.'),
		api_write_applied: _('The configuration write permission was saved and the service was restarted.'),
		api_write_saved: _('The configuration write permission was saved. It takes effect at the next start.'),
		api_write_reverted: _('The configuration write permission was not accepted: the service did not come up with it, so the previous setting was restored.'),
		invalid_value: _('The value is not valid.'),
		invalid_request: _('The request was not understood.'),
		settings_write_failed: _('The settings could not be written. Check the system log.'),
		invalid_operation: _('The operation is not known.')
	};

	return messages[token] || token || _('The dae service reported an issue.');
}

function resultMessage(result, fallback) {
	return result && statusIssue(result.message) || fallback;
}

function errorMessage(error, fallback) {
	return error && statusIssue(error.message) || fallback;
}

function ensureOk(result) {
	if (!result || result.ok !== true)
		throw new Error(result && result.message ? result.message : _('The backend did not confirm the operation.'));

	return result;
}

return baseclass.extend({
	status: callStatus,
	secret: callSecret,
	start: callStart,
	stop: callStop,
	restart: callRestart,
	enable: callEnable,
	disable: callDisable,
	set_listen: callSetListen,
	set_api_write: callSetApiWrite,
	panelUrl: panelUrl,
	splitListen: splitListen,
	statusIssue: statusIssue,
	resultMessage: resultMessage,
	errorMessage: errorMessage,
	ensureOk: ensureOk,
	installStyles: installStyles
});
