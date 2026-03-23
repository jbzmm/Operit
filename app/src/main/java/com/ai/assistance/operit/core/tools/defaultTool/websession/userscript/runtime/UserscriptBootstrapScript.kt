package com.ai.assistance.operit.core.tools.defaultTool.websession.userscript.runtime

internal object UserscriptBootstrapScript {
    const val BRIDGE_NAME = "OperitUserscriptBridge"

    fun documentStartScript(): String =
        """
        (function() {
            if (window.__operitUserscriptBootstrapInstalled) {
                return;
            }
            window.__operitUserscriptBootstrapInstalled = true;
            const bridge = window.${BRIDGE_NAME};
            if (!bridge || typeof bridge.postMessage !== 'function') {
                return;
            }

            const runtime = {
                pending: new Map(),
                xhrRequests: new Map(),
                menuCallbacks: new Map(),
                sequence: 0,
                post(type, payload) {
                    const message = JSON.stringify({ type, payload: payload || {} });
                    bridge.postMessage(message);
                },
                request(type, payload) {
                    const requestId = "req_" + (++runtime.sequence) + "_" + Date.now();
                    const message = JSON.stringify({ type, requestId, payload: payload || {} });
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            runtime.pending.delete(requestId);
                            reject(new Error("userscript_host_timeout:" + type));
                        }, 20000);
                        runtime.pending.set(requestId, { resolve, reject, timeout });
                        bridge.postMessage(message);
                    });
                },
                resolvePending(message) {
                    const pending = runtime.pending.get(message.requestId);
                    if (!pending) {
                        return;
                    }
                    runtime.pending.delete(message.requestId);
                    clearTimeout(pending.timeout);
                    if (message.error) {
                        pending.reject(new Error(String(message.error)));
                    } else {
                        pending.resolve(message.payload);
                    }
                },
                normalizeValue(value, fallbackValue) {
                    if (typeof value === "undefined") {
                        return fallbackValue;
                    }
                    return value;
                },
                buildResponseHeaders(headers) {
                    if (!headers || typeof headers !== "object") {
                        return "";
                    }
                    return Object.entries(headers).map(([key, value]) => key + ": " + String(value)).join("\r\n");
                },
                decodeBinaryResponse(response) {
                    const base64 = typeof response === "string" ? response : "";
                    if (!base64) {
                        return new Uint8Array(0);
                    }
                    const raw = atob(base64);
                    const bytes = new Uint8Array(raw.length);
                    for (let index = 0; index < raw.length; index += 1) {
                        bytes[index] = raw.charCodeAt(index);
                    }
                    return bytes;
                },
                parseStoredValues(values) {
                    const parsed = {};
                    Object.entries(values || {}).forEach(([key, raw]) => {
                        try {
                            parsed[key] = JSON.parse(raw);
                        } catch (_) {
                            parsed[key] = raw;
                        }
                    });
                    return parsed;
                },
                addStyle(cssText) {
                    const style = document.createElement("style");
                    style.textContent = String(cssText || "");
                    (document.head || document.documentElement || document.body).appendChild(style);
                    return style;
                },
                installScript(script) {
                    const metadata = JSON.parse(script.metadataJson || "{}");
                    const resourceMap = script.resources || {};
                    const storage = runtime.parseStoredValues(script.values || {});
                    const makeInfo = function() {
                        return {
                            script: metadata,
                            scriptHandler: "Tampermonkey",
                            version: "5.0.0",
                            scriptWillUpdate: !!metadata.updateUrl
                        };
                    };
                    const persistSet = function(key, value) {
                        storage[key] = value;
                        runtime.post("storage_set", {
                            scriptId: script.scriptId,
                            key: key,
                            valueJson: JSON.stringify(value)
                        });
                    };
                    const persistDelete = function(key) {
                        delete storage[key];
                        runtime.post("storage_delete", {
                            scriptId: script.scriptId,
                            key: key
                        });
                    };
                    const registerMenuCommand = function(caption, callback) {
                        const commandId = "menu_" + script.scriptId + "_" + (++runtime.sequence);
                        runtime.menuCallbacks.set(commandId, callback);
                        runtime.post("register_menu_command", {
                            commandId: commandId,
                            title: String(caption || ""),
                            scriptId: script.scriptId
                        });
                        return commandId;
                    };
                    const unregisterMenuCommand = function(commandId) {
                        runtime.menuCallbacks.delete(commandId);
                        runtime.post("unregister_menu_command", {
                            commandId: String(commandId || ""),
                            scriptId: script.scriptId
                        });
                    };
                    const xmlHttpRequest = function(details) {
                        const requestDetails = details || {};
                        const requestId = "xhr_" + script.scriptId + "_" + (++runtime.sequence);
                        runtime.xhrRequests.set(requestId, requestDetails);
                        runtime.post("gm_xmlhttp_request", {
                            requestId,
                            scriptId: script.scriptId,
                            pageUrl: location.href,
                            method: String(requestDetails.method || "GET"),
                            url: String(requestDetails.url || ""),
                            headers: requestDetails.headers || {},
                            data: typeof requestDetails.data === "undefined" ? null : requestDetails.data,
                            responseType: String(requestDetails.responseType || "text"),
                            timeoutMs: Number(requestDetails.timeout || 0),
                            anonymous: !!requestDetails.anonymous
                        });
                        return {
                            abort: function() {
                                runtime.post("gm_abort_request", { requestId: requestId });
                                runtime.xhrRequests.delete(requestId);
                            }
                        };
                    };
                    const download = function(arg1, arg2) {
                        const options = typeof arg1 === "string" ? { url: arg1, name: arg2 } : (arg1 || {});
                        runtime.post("gm_download", {
                            scriptId: script.scriptId,
                            url: String(options.url || ""),
                            fileName: options.name ? String(options.name) : ""
                        });
                        return {
                            abort: function() {}
                        };
                    };
                    const gmObject = {
                        info: makeInfo(),
                        getValue: function(key, defaultValue) {
                            return Promise.resolve(runtime.normalizeValue(storage[key], defaultValue));
                        },
                        setValue: function(key, value) {
                            persistSet(String(key), value);
                            return Promise.resolve();
                        },
                        deleteValue: function(key) {
                            persistDelete(String(key));
                            return Promise.resolve();
                        },
                        listValues: function() {
                            return Promise.resolve(Object.keys(storage));
                        },
                        addStyle: function(cssText) {
                            return runtime.addStyle(cssText);
                        },
                        getResourceText: function(name) {
                            const resource = resourceMap[String(name)] || {};
                            return Promise.resolve(resource.text || "");
                        },
                        getResourceURL: function(name) {
                            const resource = resourceMap[String(name)] || {};
                            return Promise.resolve(resource.dataUrl || "");
                        },
                        xmlHttpRequest: function(details) {
                            return xmlHttpRequest(details);
                        },
                        download: function(arg1, arg2) {
                            return download(arg1, arg2);
                        },
                        openInTab: function(url, options) {
                            runtime.post("gm_open_in_tab", {
                                scriptId: script.scriptId,
                                url: String(url || ""),
                                active: options === false ? false : !(options && options.active === false)
                            });
                            return Promise.resolve();
                        },
                        registerMenuCommand: function(caption, callback) {
                            return Promise.resolve(registerMenuCommand(caption, callback));
                        },
                        unregisterMenuCommand: function(commandId) {
                            unregisterMenuCommand(commandId);
                            return Promise.resolve();
                        },
                        setClipboard: function(text) {
                            runtime.post("gm_set_clipboard", {
                                scriptId: script.scriptId,
                                text: String(text || "")
                            });
                            return Promise.resolve();
                        },
                        notification: function(details) {
                            runtime.post("gm_notification", {
                                scriptId: script.scriptId,
                                title: String((details && details.title) || script.name),
                                text: String((details && (details.text || details.body)) || "")
                            });
                            return Promise.resolve();
                        }
                    };

                    const legacy = {
                        GM_info: makeInfo(),
                        GM_getValue: function(key, defaultValue) {
                            return runtime.normalizeValue(storage[key], defaultValue);
                        },
                        GM_setValue: function(key, value) {
                            persistSet(String(key), value);
                        },
                        GM_deleteValue: function(key) {
                            persistDelete(String(key));
                        },
                        GM_listValues: function() {
                            return Object.keys(storage);
                        },
                        GM_addStyle: function(cssText) {
                            return runtime.addStyle(cssText);
                        },
                        GM_getResourceText: function(name) {
                            const resource = resourceMap[String(name)] || {};
                            return resource.text || "";
                        },
                        GM_getResourceURL: function(name) {
                            const resource = resourceMap[String(name)] || {};
                            return resource.dataUrl || "";
                        },
                        GM_xmlhttpRequest: function(details) {
                            return xmlHttpRequest(details);
                        },
                        GM_download: function(arg1, arg2) {
                            return download(arg1, arg2);
                        },
                        GM_openInTab: function(url, options) {
                            runtime.post("gm_open_in_tab", {
                                scriptId: script.scriptId,
                                url: String(url || ""),
                                active: options === false ? false : !(options && options.active === false)
                            });
                        },
                        GM_registerMenuCommand: registerMenuCommand,
                        GM_unregisterMenuCommand: unregisterMenuCommand,
                        GM_setClipboard: function(text) {
                            runtime.post("gm_set_clipboard", {
                                scriptId: script.scriptId,
                                text: String(text || "")
                            });
                        },
                        GM_notification: function(details) {
                            runtime.post("gm_notification", {
                                scriptId: script.scriptId,
                                title: String((details && details.title) || script.name),
                                text: String((details && (details.text || details.body)) || "")
                            });
                        }
                    };

                    try {
                        runtime.post("script_status", {
                            scriptId: script.scriptId,
                            state: "running",
                            pageUrl: location.href
                        });
                        const before = script.requires || [];
                        const source =
                            String(before.join("\n")) +
                            "\n" +
                            String(script.code || "") +
                            "\n//# sourceURL=userscript:" + encodeURIComponent(String(script.name || "script"));
                        const executor = new Function(
                            "GM",
                            "GM_info",
                            "GM_getValue",
                            "GM_setValue",
                            "GM_deleteValue",
                            "GM_listValues",
                            "GM_addStyle",
                            "GM_getResourceText",
                            "GM_getResourceURL",
                            "GM_xmlhttpRequest",
                            "GM_download",
                            "GM_openInTab",
                            "GM_registerMenuCommand",
                            "GM_unregisterMenuCommand",
                            "GM_setClipboard",
                            "GM_notification",
                            "unsafeWindow",
                            source
                        );
                        executor(
                            gmObject,
                            legacy.GM_info,
                            legacy.GM_getValue,
                            legacy.GM_setValue,
                            legacy.GM_deleteValue,
                            legacy.GM_listValues,
                            legacy.GM_addStyle,
                            legacy.GM_getResourceText,
                            legacy.GM_getResourceURL,
                            legacy.GM_xmlhttpRequest,
                            legacy.GM_download,
                            legacy.GM_openInTab,
                            legacy.GM_registerMenuCommand,
                            legacy.GM_unregisterMenuCommand,
                            legacy.GM_setClipboard,
                            legacy.GM_notification,
                            window
                        );
                        runtime.post("script_status", {
                            scriptId: script.scriptId,
                            state: "success",
                            pageUrl: location.href
                        });
                    } catch (error) {
                        const message = String(error && (error.stack || error.message || error) || "userscript execution failed");
                        runtime.post("script_status", {
                            scriptId: script.scriptId,
                            state: "error",
                            message: message,
                            pageUrl: location.href
                        });
                        runtime.post("runtime_log", {
                            scriptId: script.scriptId,
                            level: "error",
                            message: message,
                            pageUrl: location.href
                        });
                    }
                },
                scheduleScripts(scripts) {
                    const grouped = {
                        "document-start": [],
                        "document-end": [],
                        "document-idle": []
                    };
                    (scripts || []).forEach((script) => {
                        const slot = grouped[String(script.runAt || "document-end")] || grouped["document-end"];
                        slot.push(script);
                    });
                    grouped["document-start"].forEach(runtime.installScript);
                    const runEnd = function() {
                        grouped["document-end"].forEach(runtime.installScript);
                    };
                    const runIdle = function() {
                        const idleRunner = function() {
                            grouped["document-idle"].forEach(runtime.installScript);
                        };
                        if (typeof requestIdleCallback === "function") {
                            requestIdleCallback(idleRunner);
                        } else {
                            setTimeout(idleRunner, 0);
                        }
                    };
                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", runEnd, { once: true });
                    } else {
                        runEnd();
                    }
                    if (document.readyState === "complete") {
                        runIdle();
                    } else {
                        window.addEventListener("load", runIdle, { once: true });
                    }
                },
                handleXhrEvent(message) {
                    const request = runtime.xhrRequests.get(message.requestId);
                    if (!request) {
                        return;
                    }
                    const response = message.payload || {};
                    const callbackName = "on" + String(message.eventType || "");
                    const callback = request[callbackName];
                    if (typeof callback === "function") {
                        let resolvedResponse = typeof response.response !== "undefined" ? response.response : response.responseText;
                        const resolvedResponseType = String(response.responseType || request.responseType || "").toLowerCase();
                        if (response.responseEncoding === "base64") {
                            const bytes = runtime.decodeBinaryResponse(response.response);
                            if (resolvedResponseType === "arraybuffer") {
                                resolvedResponse = bytes.buffer.slice(0);
                            } else if (resolvedResponseType === "blob") {
                                resolvedResponse = new Blob([bytes]);
                            } else {
                                resolvedResponse = bytes;
                            }
                        }
                        callback({
                            status: Number(response.status || 0),
                            statusText: String(response.statusText || ""),
                            readyState: Number(response.readyState || 4),
                            responseHeaders: runtime.buildResponseHeaders(response.headers),
                            finalUrl: String(response.finalUrl || ""),
                            responseText: typeof response.responseText === "string" ? response.responseText : "",
                            response: resolvedResponse,
                            loaded: Number(response.loaded || 0),
                            total: Number(response.total || 0)
                        });
                    }
                    if (message.terminal) {
                        runtime.xhrRequests.delete(message.requestId);
                    }
                },
                invokeMenuCommand(commandId) {
                    const callback = runtime.menuCallbacks.get(String(commandId || ""));
                    if (typeof callback === "function") {
                        callback();
                    }
                }
            };

            bridge.onmessage = function(event) {
                try {
                    const message = JSON.parse(String(event && event.data || "{}"));
                    if (message.type === "rpc_response") {
                        runtime.resolvePending(message);
                        return;
                    }
                    if (message.type === "bootstrap_response") {
                        const payload = JSON.parse(String((message.payload && message.payload.payloadJson) || "{\"scripts\":[]}"));
                        runtime.scheduleScripts(payload.scripts || []);
                        return;
                    }
                    if (message.type === "xhr_event") {
                        runtime.handleXhrEvent(message);
                    }
                } catch (error) {
                    runtime.post("runtime_log", {
                        level: "error",
                        message: String(error && (error.stack || error.message || error) || "userscript bridge parse failed"),
                        pageUrl: location.href
                    });
                }
            };

            window.__operitUserscriptRuntime = runtime;
            runtime.post("menu_reset", {});
            runtime.request("bootstrap_request", {
                href: String(location.href || ""),
                isTopFrame: window.top === window
            }).then(function(payload) {
                const resolved = payload || {};
                const parsed = JSON.parse(String(resolved.payloadJson || "{\"scripts\":[]}"));
                runtime.scheduleScripts(parsed.scripts || []);
            }).catch(function(error) {
                runtime.post("runtime_log", {
                    level: "error",
                    message: String(error && (error.stack || error.message || error) || "userscript bootstrap failed"),
                    pageUrl: location.href
                });
            });
        })();
        """.trimIndent()
}
