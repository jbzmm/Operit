package com.ai.assistance.operit.core.tools.javascript

internal fun buildComposeDslContextBridgeDefinition(): String {
    return """
        var OperitComposeDslRuntime = (function() {
            function cloneObject(input) {
                if (!input || typeof input !== 'object' || Array.isArray(input)) {
                    return {};
                }
                var out = {};
                for (var key in input) {
                    if (Object.prototype.hasOwnProperty.call(input, key)) {
                        out[key] = input[key];
                    }
                }
                return out;
            }

            function normalizeChildren(children) {
                if (!children) {
                    return [];
                }
                if (Array.isArray(children)) {
                    return children;
                }
                return [children];
            }

            function invokeNative(methodName, args) {
                try {
                    if (
                        typeof NativeInterface === 'undefined' ||
                        !NativeInterface ||
                        typeof NativeInterface[methodName] !== 'function'
                    ) {
                        return undefined;
                    }
                    return NativeInterface[methodName].apply(NativeInterface, args || []);
                } catch (e) {
                    console.error('Native bridge call failed for ' + methodName + ':', e);
                    return undefined;
                }
            }

            function formatTemplateInternal(template, values) {
                var result = String(template || '');
                var source = values && typeof values === 'object' ? values : {};
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        var value = source[key];
                        var placeholder = '{' + key + '}';
                        result = result.split(placeholder).join(value == null ? '' : String(value));
                    }
                }
                return result;
            }

            function parseJsonSafely(raw, fallbackValue) {
                if (raw === undefined || raw === null) {
                    return fallbackValue;
                }
                if (typeof raw === 'object') {
                    return raw;
                }
                var text = String(raw || '').trim();
                if (!text) {
                    return fallbackValue;
                }
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return fallbackValue;
                }
            }

            function stringifyJsonSafely(value, fallbackLiteral) {
                try {
                    if (value === undefined) {
                        return JSON.stringify(null);
                    }
                    return JSON.stringify(value);
                } catch (e) {
                    return fallbackLiteral || 'null';
                }
            }

            function normalizeNamespace(value) {
                return String(value || '').trim();
            }

            function normalizeDatastoreKey(value) {
                return String(value || '').trim();
            }

            function createContext(runtimeOptions) {
                var options = runtimeOptions && typeof runtimeOptions === 'object' ? runtimeOptions : {};
                var runtime = {
                    stateStore: cloneObject(options.state),
                    memoStore: cloneObject(options.memo),
                    moduleSpec:
                        options.moduleSpec && typeof options.moduleSpec === 'object'
                            ? options.moduleSpec
                            : {},
                    packageName: String(options.packageName || options.__operit_ui_package_name || ''),
                    toolPkgId: String(options.toolPkgId || options.__operit_ui_toolpkg_id || ''),
                    uiModuleId: String(options.uiModuleId || options.__operit_ui_module_id || ''),
                    actionStore: {},
                    actionCounter: 0,
                    stateChangeListeners: []
                };

                function registerAction(handler) {
                    runtime.actionCounter += 1;
                    var actionId = '__action_' + runtime.actionCounter;
                    runtime.actionStore[actionId] = handler;
                    return actionId;
                }

                function notifyStateChanged() {
                    if (!runtime.stateChangeListeners || runtime.stateChangeListeners.length <= 0) {
                        return;
                    }
                    var listeners = runtime.stateChangeListeners.slice();
                    for (var i = 0; i < listeners.length; i += 1) {
                        try {
                            listeners[i]();
                        } catch (e) {
                            try {
                                console.warn('compose_dsl state listener failed:', e);
                            } catch (__ignore) {
                            }
                        }
                    }
                }

                function subscribeStateChange(listener) {
                    if (typeof listener !== 'function') {
                        return function() {};
                    }
                    runtime.stateChangeListeners.push(listener);
                    var active = true;
                    return function() {
                        if (!active) {
                            return;
                        }
                        active = false;
                        var index = runtime.stateChangeListeners.indexOf(listener);
                        if (index >= 0) {
                            runtime.stateChangeListeners.splice(index, 1);
                        }
                    };
                }

                function normalizePropValue(value) {
                    if (typeof value === 'function') {
                        return { __actionId: registerAction(value) };
                    }
                    if (Array.isArray(value)) {
                        return value.map(function(item) {
                            return normalizePropValue(item);
                        });
                    }
                    if (value && typeof value === 'object') {
                        var normalized = {};
                        for (var key in value) {
                            if (Object.prototype.hasOwnProperty.call(value, key)) {
                                normalized[key] = normalizePropValue(value[key]);
                            }
                        }
                        return normalized;
                    }
                    return value;
                }

                function createNode(type, props, children) {
                    var rawProps = props && typeof props === 'object' ? props : {};
                    var normalizedProps = {};
                    for (var key in rawProps) {
                        if (Object.prototype.hasOwnProperty.call(rawProps, key)) {
                            normalizedProps[key] = normalizePropValue(rawProps[key]);
                        }
                    }
                    return {
                        type: String(type || ''),
                        props: normalizedProps,
                        children: normalizeChildren(children)
                    };
                }

                function resolvePackageName(value) {
                    var name = String(value || runtime.packageName || '').trim();
                    return name;
                }

                function useState(key, initialValue) {
                    var stateKey = String(key || '').trim();
                    if (!stateKey) {
                        throw new Error('useState key is required');
                    }
                    if (!Object.prototype.hasOwnProperty.call(runtime.stateStore, stateKey)) {
                        runtime.stateStore[stateKey] = initialValue;
                    }
                    return [
                        runtime.stateStore[stateKey],
                        function(nextValue) {
                            runtime.stateStore[stateKey] = nextValue;
                            notifyStateChanged();
                        }
                    ];
                }

                function useMemo(key, factory, deps) {
                    var memoKey = String(key || '').trim();
                    if (!memoKey) {
                        throw new Error('useMemo key is required');
                    }
                    if (!Object.prototype.hasOwnProperty.call(runtime.memoStore, memoKey)) {
                        runtime.memoStore[memoKey] =
                            typeof factory === 'function' ? factory() : factory;
                    }
                    return runtime.memoStore[memoKey];
                }

                function normalizeToolName(targetPackage, toolName) {
                    var basePackage = String(targetPackage || '').trim();
                    var normalizedTool = String(toolName || '').trim();
                    if (!normalizedTool) {
                        return '';
                    }
                    if (normalizedTool.indexOf(':') >= 0 || !basePackage) {
                        return normalizedTool;
                    }
                    return basePackage + ':' + normalizedTool;
                }

                var ctx = {
                    useState: useState,
                    useMemo: useMemo,
                    callTool: function(toolName, params) {
                        return toolCall(toolName, params || {});
                    },
                    toolCall: function() {
                        return toolCall.apply(null, arguments);
                    },
                    getEnv: function(key) {
                        return getEnv(key);
                    },
                    setEnv: function(key, value) {
                        invokeNative('setEnv', [
                            String(key || ''),
                            value === undefined || value === null ? '' : String(value)
                        ]);
                        return Promise.resolve();
                    },
                    setEnvs: function(values) {
                        var payload = values && typeof values === 'object' ? values : {};
                        invokeNative('setEnvs', [JSON.stringify(payload)]);
                        return Promise.resolve();
                    },
                    app: {
                        listRoutes: function() {
                            var routes = parseJsonSafely(invokeNative('listRouteExtensionsJson', []), []);
                            if (!Array.isArray(routes)) {
                                return Promise.resolve([]);
                            }
                            return Promise.resolve(routes);
                        },
                        navigateToRoute: function(routeId, args) {
                            var targetRouteId = String(routeId || '').trim();
                            if (!targetRouteId) {
                                return Promise.reject(new Error('routeId is required'));
                            }
                            var payload = args && typeof args === 'object' ? args : {};
                            var result = parseJsonSafely(
                                invokeNative('navigateToRoute', [
                                    targetRouteId,
                                    stringifyJsonSafely(payload, '{}')
                                ]),
                                { success: false, error: 'navigateToRoute bridge failed' }
                            );
                            if (result && result.success === false) {
                                return Promise.reject(new Error(String(result.error || 'navigateToRoute failed')));
                            }
                            return Promise.resolve(result);
                        },
                        getActiveProfileId: function() {
                            var profileId = invokeNative('getActiveProfileId', []);
                            return Promise.resolve(String(profileId || 'default'));
                        }
                    },
                    chat: {
                        listAttachmentEntries: function() {
                            var entries =
                                parseJsonSafely(
                                    invokeNative('listAttachmentExtensionsJson', []),
                                    []
                                );
                            if (!Array.isArray(entries)) {
                                return Promise.resolve([]);
                            }
                            return Promise.resolve(entries);
                        },
                        triggerAttachment: function(entryId, payload) {
                            var targetEntryId = String(entryId || '').trim();
                            if (!targetEntryId) {
                                return Promise.reject(new Error('entryId is required'));
                            }
                            var payloadValue = payload === undefined ? {} : payload;
                            var result =
                                parseJsonSafely(
                                    invokeNative('triggerAttachmentEntry', [
                                        targetEntryId,
                                        stringifyJsonSafely(payloadValue, '{}')
                                    ]),
                                    { success: false, error: 'triggerAttachment bridge failed' }
                                );
                            if (result && result.success === false) {
                                return Promise.reject(new Error(String(result.error || 'triggerAttachment failed')));
                            }
                            return Promise.resolve(result);
                        },
                        listSettingBarEntries: function() {
                            var entries =
                                parseJsonSafely(
                                    invokeNative('listChatSettingBarExtensionsJson', []),
                                    []
                                );
                            if (!Array.isArray(entries)) {
                                return Promise.resolve([]);
                            }
                            return Promise.resolve(entries);
                        },
                        triggerSettingBar: function(entryId, payload) {
                            var targetEntryId = String(entryId || '').trim();
                            if (!targetEntryId) {
                                return Promise.reject(new Error('entryId is required'));
                            }
                            var payloadValue = payload === undefined ? {} : payload;
                            var result =
                                parseJsonSafely(
                                    invokeNative('triggerChatSettingBarEntry', [
                                        targetEntryId,
                                        stringifyJsonSafely(payloadValue, '{}')
                                    ]),
                                    { success: false, error: 'triggerSettingBar bridge failed' }
                                );
                            if (result && result.success === false) {
                                return Promise.reject(new Error(String(result.error || 'triggerSettingBar failed')));
                            }
                            return Promise.resolve(result);
                        },
                        listHooks: function(event) {
                            var eventName = String(event || '').trim();
                            var entries =
                                parseJsonSafely(
                                    invokeNative('listChatHookExtensionsJson', [eventName]),
                                    []
                                );
                            if (!Array.isArray(entries)) {
                                return Promise.resolve([]);
                            }
                            return Promise.resolve(entries);
                        }
                    },
                    datastore: {
                        get: function(namespace, key) {
                            var ns = normalizeNamespace(namespace);
                            var k = normalizeDatastoreKey(key);
                            if (!ns || !k) {
                                return Promise.reject(new Error('namespace and key are required'));
                            }
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreGet', [ns, k]),
                                    { success: false, error: 'datastore.get bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.get failed')));
                            }
                            return Promise.resolve(result.value);
                        },
                        set: function(namespace, key, value) {
                            var ns = normalizeNamespace(namespace);
                            var k = normalizeDatastoreKey(key);
                            if (!ns || !k) {
                                return Promise.reject(new Error('namespace and key are required'));
                            }
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreSet', [ns, k, stringifyJsonSafely(value, 'null')]),
                                    { success: false, error: 'datastore.set bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.set failed')));
                            }
                            return Promise.resolve(result);
                        },
                        batchSet: function(namespace, entries) {
                            var ns = normalizeNamespace(namespace);
                            if (!ns) {
                                return Promise.reject(new Error('namespace is required'));
                            }
                            var payload = entries && typeof entries === 'object' ? entries : {};
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreBatchSet', [ns, stringifyJsonSafely(payload, '{}')]),
                                    { success: false, error: 'datastore.batchSet bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.batchSet failed')));
                            }
                            return Promise.resolve(result);
                        },
                        observe: function(namespace, keys) {
                            var ns = normalizeNamespace(namespace);
                            if (!ns) {
                                return Promise.reject(new Error('namespace is required'));
                            }
                            var keyList = Array.isArray(keys) ? keys : [];
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreObserve', [ns, stringifyJsonSafely(keyList, '[]')]),
                                    { success: false, error: 'datastore.observe bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.observe failed')));
                            }
                            return Promise.resolve(result.values || {});
                        },
                        sqlQuery: function(sql, params) {
                            var statement = String(sql || '').trim();
                            if (!statement) {
                                return Promise.reject(new Error('sql is required'));
                            }
                            var argList = Array.isArray(params) ? params : [];
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreSqlQuery', [
                                        statement,
                                        stringifyJsonSafely(argList, '[]')
                                    ]),
                                    { success: false, error: 'datastore.sqlQuery bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.sqlQuery failed')));
                            }
                            return Promise.resolve(result.result || result);
                        },
                        sqlExecute: function(sql, params) {
                            var statement = String(sql || '').trim();
                            if (!statement) {
                                return Promise.reject(new Error('sql is required'));
                            }
                            var argList = Array.isArray(params) ? params : [];
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreSqlExecute', [
                                        statement,
                                        stringifyJsonSafely(argList, '[]')
                                    ]),
                                    { success: false, error: 'datastore.sqlExecute bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.sqlExecute failed')));
                            }
                            return Promise.resolve(result.result || result);
                        },
                        sqlTransaction: function(operations) {
                            var ops = Array.isArray(operations) ? operations : [];
                            var result =
                                parseJsonSafely(
                                    invokeNative('datastoreSqlTransaction', [
                                        stringifyJsonSafely(ops, '[]')
                                    ]),
                                    { success: false, error: 'datastore.sqlTransaction bridge failed' }
                                );
                            if (!result || result.success === false) {
                                return Promise.reject(new Error(String((result && result.error) || 'datastore.sqlTransaction failed')));
                            }
                            return Promise.resolve(result.results || []);
                        }
                    },
                    readResource: function(key) {
                        var resourceKey = String(key || '').trim();
                        if (!resourceKey) {
                            return Promise.reject(new Error('resource key is required'));
                        }
                        var resourceTarget = String(runtime.packageName || runtime.toolPkgId || '').trim();
                        if (!resourceTarget) {
                            return Promise.reject(new Error('package/toolpkg runtime target is empty'));
                        }
                        var filePath = invokeNative('readToolPkgResource', [
                            resourceTarget,
                            resourceKey,
                            ''
                        ]);
                        if (typeof filePath === 'string' && filePath.trim()) {
                            return Promise.resolve(filePath);
                        }
                        return Promise.reject(
                            new Error('resource not found: ' + resourceKey)
                        );
                    },
                    navigate: function(route, args) {
                        return ctx.app.navigateToRoute(route, args);
                    },
                    showToast: function(message) {
                        return toolCall('toast', { message: String(message || '') });
                    },
                    reportError: function(error) {
                        console.error('compose_dsl reportError:', error);
                        return Promise.resolve();
                    },
                    getModuleSpec: function() {
                        return runtime.moduleSpec;
                    },
                    getLocale: function() {
                        return getLang();
                    },
                    formatTemplate: function(template, values) {
                        return formatTemplateInternal(template, values);
                    },
                    getCurrentPackageName: function() {
                        return runtime.packageName || undefined;
                    },
                    getCurrentToolPkgId: function() {
                        return runtime.toolPkgId || undefined;
                    },
                    getCurrentUiModuleId: function() {
                        return runtime.uiModuleId || undefined;
                    },
                    isPackageImported: function(packageName) {
                        var target = resolvePackageName(packageName);
                        if (!target) {
                            return Promise.resolve(false);
                        }
                        var result = invokeNative('isPackageImported', [target]);
                        if (result === true || result === false || result === 'true' || result === 'false') {
                            return Promise.resolve(result === true || result === 'true');
                        }
                        return toolCall('is_package_imported', { package_name: target });
                    },
                    importPackage: function(packageName) {
                        var target = resolvePackageName(packageName);
                        if (!target) {
                            return Promise.resolve('');
                        }
                        var result = invokeNative('importPackage', [target]);
                        if (result !== undefined && result !== null) {
                            return Promise.resolve(result);
                        }
                        return toolCall('import_package', { package_name: target });
                    },
                    removePackage: function(packageName) {
                        var target = resolvePackageName(packageName);
                        if (!target) {
                            return Promise.resolve('');
                        }
                        var result = invokeNative('removePackage', [target]);
                        if (result !== undefined && result !== null) {
                            return Promise.resolve(result);
                        }
                        return toolCall('remove_package', { package_name: target });
                    },
                    usePackage: function(packageName) {
                        var target = resolvePackageName(packageName);
                        if (!target) {
                            return Promise.resolve('');
                        }
                        var result = invokeNative('usePackage', [target]);
                        if (result !== undefined && result !== null) {
                            return Promise.resolve(result);
                        }
                        return toolCall('use_package', { package_name: target });
                    },
                    listImportedPackages: function() {
                        var json = invokeNative('listImportedPackagesJson', []);
                        if (typeof json === 'string' && json.trim()) {
                            try {
                                return Promise.resolve(JSON.parse(json));
                            } catch (e) {
                                return Promise.resolve([]);
                            }
                        }
                        return toolCall('list_imported_packages', {});
                    },
                    resolveToolName: function(request) {
                        var req = request && typeof request === 'object' ? request : {};
                        var packageName = String(req.packageName || runtime.packageName || '');
                        var subpackageId = String(req.subpackageId || '');
                        var toolName = String(req.toolName || '');
                        var preferImported = req.preferImported === false ? 'false' : 'true';
                        if (!toolName) {
                            return Promise.resolve('');
                        }
                        var result = invokeNative('resolveToolName', [
                            packageName,
                            subpackageId,
                            toolName,
                            preferImported
                        ]);
                        if (typeof result === 'string' && result.trim()) {
                            return Promise.resolve(result);
                        }
                        return Promise.resolve(normalizeToolName(packageName, toolName));
                    },
                    Column: function(props, children) {
                        return createNode('Column', props, children);
                    },
                    Row: function(props, children) {
                        return createNode('Row', props, children);
                    },
                    Box: function(props, children) {
                        return createNode('Box', props, children);
                    },
                    Spacer: function(props) {
                        return createNode('Spacer', props, []);
                    },
                    Text: function(props) {
                        return createNode('Text', props, []);
                    },
                    TextField: function(props) {
                        return createNode('TextField', props, []);
                    },
                    Switch: function(props) {
                        return createNode('Switch', props, []);
                    },
                    Checkbox: function(props) {
                        return createNode('Checkbox', props, []);
                    },
                    Button: function(props, children) {
                        return createNode('Button', props, children);
                    },
                    IconButton: function(props) {
                        return createNode('IconButton', props, []);
                    },
                    Card: function(props, children) {
                        return createNode('Card', props, children);
                    },
                    Icon: function(props) {
                        return createNode('Icon', props, []);
                    },
                    GraphCanvas: function(props) {
                        return createNode('GraphCanvas', props, []);
                    },
                    LazyColumn: function(props, children) {
                        return createNode('LazyColumn', props, children);
                    },
                    LinearProgressIndicator: function(props) {
                        return createNode('LinearProgressIndicator', props, []);
                    },
                    CircularProgressIndicator: function(props) {
                        return createNode('CircularProgressIndicator', props, []);
                    },
                    SnackbarHost: function(props) {
                        return createNode('SnackbarHost', props, []);
                    }
                };

                return {
                    ctx: ctx,
                    state: runtime.stateStore,
                    memo: runtime.memoStore,
                    invokeAction: function(actionId, payload) {
                        var id = String(actionId || '').trim();
                        if (!id) {
                            throw new Error('compose action id is required');
                        }
                        var handler = runtime.actionStore[id];
                        if (typeof handler !== 'function') {
                            throw new Error('compose action not found: ' + id);
                        }
                        return handler(payload);
                    },
                    subscribeStateChange: subscribeStateChange
                };
            }

            return {
                createContext: createContext
            };
        })();
    """.trimIndent()
}
