'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var sideUtils = require('@seleniumhq/side-utils');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
var config = {
  silenceErrors: false,
  skipStdLibEmitting: false
};

// Licensed to the Software Freedom Conservancy (SFC) under one
const hooks = [];
async function emit(project, options = config, snapshot) {
  const configHooks = (await Promise.all(hooks.map(hook => hook({
    name: project.name
  })))).join('');

  if (!options.skipStdLibEmitting) {
    return `global.Key = require('selenium-webdriver').Key;global.URL = require('url').URL;global.BASE_URL = configuration.baseUrl || '${sideUtils.stringEscape(project.url)}';let vars = {};${configHooks}${snapshot ? snapshot : ''}`;
  } else {
    if (configHooks) {
      return {
        snapshot: configHooks
      };
    } else {
      return {
        skipped: true
      };
    }
  }
}

function registerHook(hook) {
  hooks.push(hook);
}

var ConfigurationEmitter = {
  emit,
  registerHook
};

// Licensed to the Software Freedom Conservancy (SFC) under one
const hooks$1 = [];
function emit$1(suite, tests, options = config, snapshot) {
  return new Promise(async (res, _rej) => {
    // eslint-disable-line no-unused-vars
    const suiteTests = suite.tests.map(testId => tests[testId].test);
    const hookResults = (await Promise.all(hooks$1.map(hook => hook({
      id: suite.id,
      name: suite.name,
      tests: suiteTests
    })))).reduce((code, result) => code + (result.beforeAll ? `beforeAll(async () => {${result.beforeAll}});` : '') + (result.before ? `beforeEach(async () => {${result.before}});` : '') + (result.after ? `afterEach(async () => {${result.after}});` : '') + (result.afterAll ? `afterAll(async () => {${result.afterAll}});` : ''), '');

    if (!options.skipStdLibEmitting) {
      const suiteName = sideUtils.stringEscape(suite.name);
      const suiteTimeout = sideUtils.stringEscape(Math.floor(suite.timeout).toString());
      let testsCode = await Promise.all(suite.tests.map(testId => tests[testId].emitted).map(test => test.test));

      if (suite.parallel) {
        testsCode = testsCode.map((code, index) => ({
          name: tests[suite.tests[index]].emitted.name,
          code: `${code.replace(/^it/, `jest.setTimeout(${suiteTimeout * 1000});test`)}${hookResults}${snapshot ? snapshot.hook : ''}`
        }));
        return res(testsCode);
      }

      let result = `jest.setTimeout(${suiteTimeout * 1000});describe("${suiteName}", () => {${hookResults}${snapshot ? snapshot.hook : ''}`;
      result += testsCode.join('');
      result += '});';
      res({
        code: result
      });
    } else {
      res(hookResults ? {
        snapshot: {
          hook: hookResults
        }
      } : {
        skipped: true
      });
    }
  });
}
function registerHook$1(hook) {
  hooks$1.push(hook);
}
var SuiteEmitter = {
  emit: emit$1,
  registerHook: registerHook$1
};

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
const emitters = {
  id: emitId,
  name: emitName,
  link: emitLink,
  linkText: emitLink,
  partialLinkText: emitPartialLinkText,
  css: emitCss,
  xpath: emitXpath
};
function emit$2(location) {
  return new Promise(async (res, rej) => {
    if (/^\/\//.test(location)) {
      return res((await emitters.xpath(location)));
    }

    const fragments = location.split('=');
    const type = fragments.shift();
    const selector = fragments.join('=');

    if (emitters[type]) {
      let result = await emitters[type](selector);
      res(result);
    } else {
      rej(new Error(type ? `Unknown locator ${type}` : "Locator can't be empty"));
    }
  });
}
var LocationEmitter = {
  emit: emit$2
};

function emitId(selector) {
  return Promise.resolve(`By.id(\`${selector}\`)`);
}

function emitName(selector) {
  return Promise.resolve(`By.name(\`${selector}\`)`);
}

function emitLink(selector) {
  return Promise.resolve(`By.linkText(\`${selector}\`)`);
}

function emitPartialLinkText(selector) {
  return Promise.resolve(`By.partialLinkText(\`${selector}\`)`);
}

function emitCss(selector) {
  return Promise.resolve(`By.css(\`${selector}\`)`);
}

function emitXpath(selector) {
  return Promise.resolve(`By.xpath(\`${selector}\`)`);
}

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
const emitters$1 = {
  id: emitId$1,
  value: emitValue,
  label: emitLabel,
  index: emitIndex
};
function emit$3(location) {
  return new Promise(async (res, rej) => {
    const [type, selector] = location.split('=');

    if (emitters$1[type] && selector) {
      let result = await emitters$1[type](selector);
      res(result);
    } else if (!selector) {
      // no selector strategy given, assuming label
      res((await emitters$1['label'](type)));
    } else {
      rej(new Error(`Unknown selection locator ${type}`));
    }
  });
}
var SelectionEmitter = {
  emit: emit$3
};

function emitId$1(id) {
  return Promise.resolve(`By.css(\`*[id="${id}"]\`)`);
}

function emitValue(value) {
  return Promise.resolve(`By.css(\`*[value="${value}"]\`)`);
}

function emitLabel(label) {
  return Promise.resolve(`By.xpath(\`//option[. = '${label}']\`)`);
}

function emitIndex(index) {
  return Promise.resolve(`By.css(\`*:nth-child(${index})\`)`);
}

// Licensed to the Software Freedom Conservancy (SFC) under one
const emitters$2 = {
  open: emitOpen,
  click: emitClick,
  clickAt: emitClick,
  check: emitCheck,
  uncheck: emitUncheck,
  debugger: emitDebugger,
  doubleClick: emitDoubleClick,
  doubleClickAt: emitDoubleClick,
  dragAndDropToObject: emitDragAndDrop,
  type: emitType,
  sendKeys: emitSendKeys,
  echo: emitEcho,
  run: emitRun,
  runScript: emitRunScript,
  executeScript: emitExecuteScript,
  executeAsyncScript: emitExecuteAsyncScript,
  pause: emitPause,
  verifyChecked: emitVerifyChecked,
  verifyNotChecked: emitVerifyNotChecked,
  verifyEditable: emitVerifyEditable,
  verifyNotEditable: emitVerifyNotEditable,
  verifyElementPresent: emitVerifyElementPresent,
  verifyElementNotPresent: emitVerifyElementNotPresent,
  verifySelectedValue: emitVerifySelectedValue,
  verifyNotSelectedValue: emitVerifyNotSelectedValue,
  verifyValue: emitVerifyValue,
  verifyText: emitVerifyText,
  verifyTitle: emitVerifyTitle,
  verifyNotText: emitVerifyNotText,
  verifySelectedLabel: emitVerifySelectedLabel,
  assertChecked: emitVerifyChecked,
  assertNotChecked: emitVerifyNotChecked,
  assertEditable: emitVerifyEditable,
  assertNotEditable: emitVerifyNotEditable,
  assertElementPresent: emitVerifyElementPresent,
  assertElementNotPresent: emitVerifyElementNotPresent,
  assertSelectedValue: emitVerifySelectedValue,
  assertNotSelectedValue: emitVerifyNotSelectedValue,
  assertValue: emitVerifyValue,
  assertText: emitVerifyText,
  assertTitle: emitVerifyTitle,
  assertSelectedLabel: emitVerifySelectedLabel,
  store: emitStore,
  storeText: emitStoreText,
  storeJson: emitStoreJson,
  storeValue: emitStoreValue,
  storeTitle: emitStoreTitle,
  storeWindowHandle: emitStoreWindowHandle,
  storeXpathCount: emitStoreXpathCount,
  storeAttribute: emitStoreAttribute,
  select: emitSelect,
  addSelection: emitSelect,
  removeSelection: emitSelect,
  selectFrame: emitSelectFrame,
  selectWindow: emitSelectWindow,
  close: emitClose,
  mouseDown: emitMouseDown,
  mouseDownAt: emitMouseDown,
  mouseUp: emitMouseUp,
  mouseUpAt: emitMouseUp,
  mouseMove: emitMouseMove,
  mouseMoveAt: emitMouseMove,
  mouseOver: emitMouseMove,
  mouseOut: emitMouseOut,
  assertAlert: emitAssertAlertAndAccept,
  assertNotText: emitVerifyNotText,
  assertPrompt: emitAssertAlert,
  assertConfirmation: emitAssertAlert,
  webdriverAnswerOnVisiblePrompt: emitAnswerOnNextPrompt,
  webdriverChooseOkOnVisibleConfirmation: emitChooseOkOnNextConfirmation,
  webdriverChooseCancelOnVisibleConfirmation: emitChooseCancelOnNextConfirmation,
  webdriverChooseCancelOnVisiblePrompt: emitChooseCancelOnNextConfirmation,
  editContent: emitEditContent,
  submit: emitSubmit,
  answerOnNextPrompt: skip,
  chooseCancelOnNextConfirmation: skip,
  chooseCancelOnNextPrompt: skip,
  chooseOkOnNextConfirmation: skip,
  setSpeed: emitSetSpeed,
  setWindowSize: emitSetWindowSize,
  do: emitControlFlowDo,
  else: emitControlFlowElse,
  elseIf: emitControlFlowElseIf,
  end: emitControlFlowEnd,
  forEach: emitControlFlowForEach,
  if: emitControlFlowIf,
  repeatIf: emitControlFlowRepeatIf,
  times: emitControlFlowTimes,
  while: emitControlFlowWhile,
  assert: emitAssert,
  verify: emitAssert,
  waitForElementPresent: emitWaitForElementPresent,
  waitForElementNotPresent: emitWaitForElementNotPresent,
  waitForElementVisible: emitWaitForElementVisible,
  waitForElementNotVisible: emitWaitForElementNotVisible,
  waitForElementEditable: emitWaitForElementEditable,
  waitForElementNotEditable: emitWaitForElementNotEditable,
  waitForText: emitWaitForText
};
function emit$4(command, options = config, snapshot) {
  return new Promise(async (res, rej) => {
    if (emitters$2[command.command]) {
      if (options.skipStdLibEmitting && !emitters$2[command.command].isAdditional) return res({
        skipped: true
      });

      try {
        const ignoreEscaping = command.command === 'storeJson';
        let result = await emitters$2[command.command](preprocessParameter(command.target, emitters$2[command.command].target, {
          ignoreEscaping
        }), preprocessParameter(command.value, emitters$2[command.command].value, {
          ignoreEscaping
        }));
        if (command.opensWindow) result = emitNewWindowHandling(result, command);
        res(result);
      } catch (e) {
        rej(e);
      }
    } else if (options.skipStdLibEmitting) {
      res({
        skipped: true
      });
    } else {
      if (!command.command || command.command.startsWith('//')) {
        res();
      } else if (snapshot) {
        res(snapshot);
      } else {
        rej(new Error(`Unknown command ${command.command}`));
      }
    }
  });
}
function canEmit(commandName) {
  return !!emitters$2[commandName];
}

function preprocessParameter(param, preprocessor, {
  ignoreEscaping
}) {
  const escapedParam = escapeString(param, {
    preprocessor,
    ignoreEscaping
  });

  if (preprocessor) {
    return preprocessor(escapedParam);
  }

  return defaultPreprocessor(escapedParam);
}

function escapeString(string, {
  preprocessor,
  ignoreEscaping
}) {
  if (ignoreEscaping) return string;else if (preprocessor && preprocessor.name === 'scriptPreprocessor') return string.replace(/"/g, "'");else return sideUtils.stringEscape(string);
}

function emitNewWindowHandling(emitted, command) {
  return `vars.__handles = await driver.getAllWindowHandles();${emitted}vars.${command.windowHandleName} = await utils.waitForWindow(driver, vars.__handles, ${command.windowTimeout});`;
}

function defaultPreprocessor(param) {
  return param ? param.replace(/\$\{/g, '${vars.') : param;
}

function scriptPreprocessor(script) {
  let value = script.replace(/^\s+/, '').replace(/\s+$/, '');
  let r2;
  let parts = [];
  const variablesUsed = {};
  const argv = [];
  let argl = 0; // length of arguments

  if (/\$\{/.exec(value)) {
    const regexp = /\$\{(.*?)\}/g;
    let lastIndex = 0;

    while (r2 = regexp.exec(value)) {
      const variableName = r2[1];

      if (r2.index - lastIndex > 0) {
        parts.push(value.substring(lastIndex, r2.index));
      }

      if (!variablesUsed.hasOwnProperty(variableName)) {
        variablesUsed[variableName] = argl;
        argv.push(variableName);
        argl++;
      }

      parts.push(`arguments[${variablesUsed[variableName]}]`);
      lastIndex = regexp.lastIndex;
    }

    if (lastIndex < value.length) {
      parts.push(value.substring(lastIndex, value.length));
    }

    return {
      script: parts.join(''),
      argv
    };
  } else {
    return {
      script: value,
      argv
    };
  }
}

function keysPreprocessor(str) {
  let keys = [];
  let match = str.match(/\$\{\w+\}/g);

  if (!match) {
    keys.push(str);
  } else {
    let i = 0;

    while (i < str.length) {
      let currentKey = match.shift(),
          currentKeyIndex = str.indexOf(currentKey, i);

      if (currentKeyIndex > i) {
        // push the string before the current key
        keys.push(str.substr(i, currentKeyIndex - i));
        i = currentKeyIndex;
      }

      if (currentKey) {
        if (/^\$\{KEY_\w+\}/.test(currentKey)) {
          // is a key
          let keyName = currentKey.match(/\$\{KEY_(\w+)\}/)[1];
          keys.push(`Key["${keyName}"]`);
        } else {
          // not a key, assume stored variables interpolation
          keys.push(defaultPreprocessor(currentKey));
        }

        i += currentKey.length;
      } else if (i < str.length) {
        // push the rest of the string
        keys.push(str.substr(i, str.length));
        i = str.length;
      }
    }
  }

  return keys;
}

function generateScript(script, isExpression = false) {
  return `await driver.executeScript(\`${isExpression ? `return (${script.script})` : script.script}\`${script.argv.length ? ',' : ''}${script.argv.map(n => `vars["${n}"]`).join(',')});`;
}

function registerEmitter(command, emitter) {
  if (!canEmit(command)) {
    emitters$2[command] = emitter;
    emitters$2[command].isAdditional = true;
  }
}
var CommandEmitter = {
  canEmit,
  emit: emit$4,
  registerEmitter
};

async function emitOpen(target) {
  const url = /^(file|http|https):\/\//.test(target) ? `"${target}"` : `(new URL(\`${target}\`, BASE_URL)).href`;
  let myScript = `let a = document.createElement('a');let linkText = document.createTextNode('$url');a.appendChild(linkText);a.title = '$url';a.href = '$url';document.body.appendChild(a);`;
  let clickCmd = await emitClick('css=a');
  return Promise.resolve(`
    let url = ${url};
    let page = await driver.get('about:blank');
    let script = "${myScript}";
    script = script.replace(/\\$url/g, url);
    await driver.executeScript(script);
    ${clickCmd};
  `); //return Promise.resolve(`await driver.get(${url});`)
}

async function emitClick(target) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(target)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(target)}).then(element => {
      return element.click().catch(err => {
        const retry = function(numTries) {
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              element = driver.findElement(${await LocationEmitter.emit(target)});
              if(!numTries) {
                return reject(err);
              }
              element.click().then(function() {
                resolve();
              }).catch(function() {
                retry(--numTries).then(resolve).catch(reject);
              });
            }, 1000);
          });
        };
        return retry(5);
      });
    });`);
}

async function emitDebugger() {
  return Promise.resolve('debugger;');
}

async function emitDoubleClick(target) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(target)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(target)}).then(element => {return driver.actions({bridge: true}).doubleClick(element).perform();});`);
}

async function emitDragAndDrop(dragged, dropzone) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(dragged)}), configuration.timeout);await driver.wait(until.elementLocated(${await LocationEmitter.emit(dropzone)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(dragged)}).then(dragged => {return driver.findElement(${await LocationEmitter.emit(dropzone)}).then(dropzone => {return driver.actions({bridge: true}).dragAndDrop(dragged, dropzone).perform();});});`);
}

async function emitType(target, value) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(target)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(target)}).then(element => {return element.clear().then(() => {return element.sendKeys(\`${value}\`);});});`);
}

async function emitSendKeys(target, value) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(target)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(target)}).then(element => {return element.sendKeys(${value.map(s => s.startsWith('Key[') ? s : `\`${s}\``).join(',')});});`);
}

emitSendKeys.value = keysPreprocessor;

async function emitEcho(message) {
  return Promise.resolve(`console.log(\`${message}\`);`);
}

async function emitCheck(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.isSelected().then(selected => {if(!selected) {return element.click();}}); });`);
}

async function emitUncheck(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.isSelected().then(selected => {if(selected) {return element.click();}}); });`);
}

async function emitRun(testCase) {
  return Promise.resolve(`await tests["${testCase}"](driver, vars, { isNested: true });`);
}

async function emitRunScript(script) {
  return Promise.resolve(generateScript(script));
}

emitRunScript.target = scriptPreprocessor;

async function emitExecuteScript(script, varName) {
  return Promise.resolve((varName ? `vars["${varName}"] = ` : '') + generateScript(script));
}

emitExecuteScript.target = scriptPreprocessor;

async function emitExecuteAsyncScript(script, varName) {
  return Promise.resolve((varName ? `vars["${varName}"] = ` : '') + `await driver.executeAsyncScript(\`var callback = arguments[arguments.length - 1];${script.script}.then(callback).catch(callback);\`${script.argv.length ? ',' : ''}${script.argv.map(n => `vars["${n}"]`).join(',')});`);
}

emitExecuteAsyncScript.target = scriptPreprocessor;

async function emitPause(time) {
  return Promise.resolve(`await driver.sleep(${time});`);
}

async function emitVerifyChecked(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.toBeChecked();`);
}

async function emitVerifyNotChecked(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.not.toBeChecked();`);
}

async function emitVerifyEditable(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.toBeEditable();`);
}

async function emitVerifyNotEditable(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.not.toBeEditable();`);
}

async function emitVerifyElementPresent(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElements(${await LocationEmitter.emit(locator)})).resolves.toBePresent();`);
}

async function emitVerifyElementNotPresent(locator) {
  return Promise.resolve(`await expect(driver.findElements(${await LocationEmitter.emit(locator)})).resolves.not.toBePresent();`);
}

async function emitVerifySelectedValue(locator, value) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.toHaveSelectedValue(\`${value}\`);`);
}

async function emitVerifySelectedLabel(locator, labelValue) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.getAttribute("value").then(selectedValue => {return element.findElement(By.xpath('option[@value="'+selectedValue+'"]')).then(selectedOption => {return selectedOption.getText().then(selectedLabel => {return expect(selectedLabel).toBe(\`${labelValue}\`);});});});});`);
}

async function emitVerifyNotSelectedValue(locator, value) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.not.toHaveSelectedValue(\`${value}\`);`);
}

async function emitVerifyValue(locator, value) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.toHaveValue(\`${value}\`);`);
}

async function emitVerifyText(locator, text) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await expect(driver.findElement(${await LocationEmitter.emit(locator)})).resolves.toHaveText(\`${text}\`);`);
}

async function emitVerifyNotText(locator, text) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.getText().then(text => {return expect(text).not.toBe(\`${text}\`)});});`);
}

async function emitVerifyTitle(title) {
  return Promise.resolve(`await driver.getTitle().then(title => {return expect(title).toBe(\`${title}\`);});`);
}

async function emitStore(value, varName) {
  return Promise.resolve(`vars["${varName}"] = \`${value}\`;`);
}

async function emitStoreText(locator, varName) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.getText().then(text => {return vars["${varName}"] = text;});});`);
}

async function emitStoreJson(json, varName) {
  return Promise.resolve(`vars["${varName}"] = JSON.parse('${json}');`);
}

async function emitStoreValue(locator, varName) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.getAttribute("value").then(value => {return vars["${varName}"] = value;});});`);
}

async function emitStoreTitle(_, varName) {
  return Promise.resolve(`await driver.getTitle().then(title => {return vars["${varName}"] = title;});`);
}

async function emitStoreWindowHandle(varName) {
  return Promise.resolve(`await driver.getWindowHandle().then(handle => {return vars["${varName}"] = handle;});`);
}

async function emitStoreXpathCount(locator, varName) {
  return Promise.resolve(`await driver.findElements(${await LocationEmitter.emit(locator)}).then(elements => {return vars["${varName}"] = elements.length;});`);
}

async function emitStoreAttribute(locator, varName) {
  const attributePos = locator.lastIndexOf('@');
  const elementLocator = locator.slice(0, attributePos);
  const attributeName = locator.slice(attributePos + 1);
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(elementLocator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(elementLocator)}).then(element => element.getAttribute("${attributeName}").then(attribute => {return vars["${varName}"] = attribute;}));`);
}

async function emitSelect(selectElement, option) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(selectElement)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(selectElement)}).then(element => {return element.findElement(${await SelectionEmitter.emit(option)}).then(option => {return option.click();});});`);
}

async function emitSelectFrame(frameLocation) {
  if (frameLocation === 'relative=top') {
    return Promise.resolve('await driver.switchTo().frame();');
  } else if (frameLocation === 'relative=parent') {
    return Promise.resolve('await driver.switchTo().parentFrame();');
  } else if (/^index=/.test(frameLocation)) {
    return Promise.resolve(`await driver.switchTo().frame(${frameLocation.split('index=')[1]});`);
  } else {
    return Promise.resolve(`await driver.findElement(${await LocationEmitter.emit(frameLocation)}).then(frame => {return driver.switchTo().frame(frame);});`);
  }
}

async function emitSelectWindow(windowLocation) {
  if (/^handle=/.test(windowLocation)) {
    return Promise.resolve(`await driver.switchTo().window(\`${windowLocation.split('handle=')[1]}\`);`);
  } else if (/^name=/.test(windowLocation)) {
    return Promise.resolve(`await driver.switchTo().window(\`${windowLocation.split('name=')[1]}\`);`);
  } else if (/^win_ser_/.test(windowLocation)) {
    if (windowLocation === 'win_ser_local') {
      return Promise.resolve('await driver.switchTo().window((await driver.getAllWindowHandles())[0]);');
    } else {
      const index = parseInt(windowLocation.substr('win_ser_'.length));
      return Promise.resolve(`await driver.switchTo().window((await driver.getAllWindowHandles())[${index}]);`);
    }
  } else {
    return Promise.reject(new Error('Can only emit `select window` using handles'));
  }
}

async function emitClose() {
  return Promise.resolve(`await driver.close();`);
}

async function emitMouseDown(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return driver.actions({bridge: true}).move({origin: element}).press().perform();});`);
}

async function emitMouseUp(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return driver.actions({bridge: true}).move({origin: element}).release().perform();});`);
}

async function emitMouseMove(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return driver.actions({bridge: true}).move({origin: element}).perform();});`);
}

async function emitMouseOut(_locator) {
  return Promise.resolve(`await driver.actions({bridge: true}).move({x: 0, y: 0}).perform();`);
}

function emitAssertAlert(alertText) {
  return Promise.resolve(`await driver.switchTo().alert().then(alert => {return alert.getText().then(text => {return expect(text).toBe(\`${alertText}\`);});});`);
}

function emitAssertAlertAndAccept(alertText) {
  return Promise.resolve(`await driver.switchTo().alert().then(alert => {return alert.getText().then(text => {expect(text).toBe(\`${alertText}\`);return alert.accept();});});`);
}

function emitChooseOkOnNextConfirmation() {
  return Promise.resolve('await driver.switchTo().alert().then(alert => {return alert.accept();});');
}

function emitChooseCancelOnNextConfirmation() {
  return Promise.resolve('await driver.switchTo().alert().then(alert => {return alert.dismiss();});');
}

function emitAnswerOnNextPrompt(textToSend) {
  return Promise.resolve(`await driver.switchTo().alert().then(alert => {return alert.sendKeys(\`${textToSend}\`).then(() => {return alert.accept();});});`);
}

async function emitEditContent(locator, content) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return driver.executeScript(\`if(arguments[0].contentEditable === 'true') {arguments[0].innerHTML = '${content}'}\`, element);});`);
}

async function emitSubmit(locator) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), configuration.timeout);await driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {return element.submit();});`);
}

function skip() {
  return Promise.resolve();
}

function emitControlFlowDo() {
  return Promise.resolve('do {');
}

function emitControlFlowElse() {
  return Promise.resolve('} else {');
}

function emitControlFlowElseIf(script) {
  return Promise.resolve(`} else if (!!${generateScript(script, true).slice(0, -1)}) {`);
}

emitControlFlowElseIf.target = scriptPreprocessor;

function emitControlFlowEnd() {
  return Promise.resolve('}');
}

function emitControlFlowIf(script) {
  return Promise.resolve(`if (!!${generateScript(script, true).slice(0, -1)}) {`);
}

emitControlFlowIf.target = scriptPreprocessor;

function emitControlFlowRepeatIf(target) {
  return Promise.resolve(`} while (!!${generateScript(target, true).slice(0, -1)});`);
}

emitControlFlowRepeatIf.target = scriptPreprocessor;

function emitControlFlowTimes(target) {
  return Promise.resolve(`const times = ${target};for(let i = 0; i < times; i++) {`);
}

function emitControlFlowWhile(target) {
  return Promise.resolve(`while (!!${generateScript(target, true).slice(0, -1)}) {`);
}

function emitControlFlowForEach(collectionVarName, iteratorVarName) {
  return Promise.resolve(`for (let i = 0; i < vars.${collectionVarName}.length; i++) {vars["${iteratorVarName}"]  = vars.${collectionVarName}[i];`);
}

emitControlFlowWhile.target = scriptPreprocessor;

function emitAssert(varName, value) {
  if (value == 'true' || value == 'false') {
    return Promise.resolve(`expect(vars.${varName} == ${value}).toBeTruthy();`);
  } else {
    return Promise.resolve(`expect(vars.${varName} == \`${value}\`).toBeTruthy();`);
  }
}

function emitSetSpeed() {
  return Promise.resolve("console.warn('`set speed` is a no-op in the runner, use `pause instead`');");
}

function emitSetWindowSize(size) {
  const [width, height] = size.split('x');
  return Promise.resolve(`try {
      await driver.manage().window().setRect({ width: ${width}, height: ${height} });
    } catch(error) {
      console.log('Unable to resize window. Skipping.');
    };`);
}

async function emitWaitForElementPresent(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.elementLocated(${await LocationEmitter.emit(locator)}), ${Math.floor(timeout)});`);
}

async function emitWaitForElementNotPresent(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.stalenessOf(await driver.findElement(${await LocationEmitter.emit(locator)})), ${Math.floor(timeout)});`);
}

async function emitWaitForElementVisible(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.elementIsVisible(await driver.findElement(${await LocationEmitter.emit(locator)})), ${Math.floor(timeout)});`);
}

async function emitWaitForElementNotVisible(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.elementIsNotVisible(await driver.findElement(${await LocationEmitter.emit(locator)})), ${Math.floor(timeout)});`);
}

async function emitWaitForElementEditable(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.elementIsEnabled(await driver.findElement(${await LocationEmitter.emit(locator)})), ${Math.floor(timeout)});`);
}

async function emitWaitForElementNotEditable(locator, timeout) {
  return Promise.resolve(`await driver.wait(until.elementIsDisabled(await driver.findElement(${await LocationEmitter.emit(locator)})), ${Math.floor(timeout)});`);
}

async function emitWaitForText(locator, text) {
  const timeout = 30000;
  return Promise.resolve(`await driver.wait(until.elementTextIs(await driver.findElement(${await LocationEmitter.emit(locator)}), \`${text}\`), ${Math.floor(timeout)});`);
}

const hooks$2 = [];
function emit$5(test, options = config, snapshot) {
  return new Promise(async (res, rej) => {
    // eslint-disable-line no-unused-vars
    const hookResults = await Promise.all(hooks$2.map(hook => hook(test)));
    const setupHooks = hookResults.map(hook => hook.setup || '').filter(hook => !!hook);
    const teardownHooks = hookResults.map(hook => hook.teardown || '').filter(hook => !!hook);
    let errors = [];
    const commands = await Promise.all(test.commands.map((command, index) => CommandEmitter.emit(command, options, snapshot ? snapshot.commands[command.id] : undefined).catch(e => {
      if (options.silenceErrors) {
        return `throw new Error("${e.message}");`;
      } else {
        errors.push(_objectSpread(_objectSpread({
          index: index + 1
        }, command), {}, {
          message: e
        }));
      }
    })));

    if (errors.length) {
      rej(_objectSpread(_objectSpread({}, test), {}, {
        commands: errors
      }));
    }

    if (!options.skipStdLibEmitting) {
      // emit everything
      const testName = sideUtils.stringEscape(test.name);
      let emittedTest = `it("${testName}", async () => {`;
      emittedTest += setupHooks.join('').concat(snapshot ? snapshot.setupHooks.join('') : '');
      emittedTest += `await tests["${testName}"](driver, vars);`;
      emittedTest += 'expect(true).toBeTruthy();';
      emittedTest += teardownHooks.join('').concat(snapshot ? snapshot.teardownHooks.join('') : '');
      emittedTest += '});';
      let _commands = ['let times = []; let timeStart = new Date().getTime(); let timeNow; let took;'];
      commands.forEach((c, idx) => {
        let originalCommand = test.commands[idx];
        let commandName = `${originalCommand.command} on ${originalCommand.target}`;

        if (originalCommand.value) {
          commandName += ` with value ${originalCommand.value}`;
        }

        _commands.push(c);

        _commands.push(`timeNow = new Date().getTime(); took = timeNow - timeStart; times.push({name: '${sideUtils.stringEscape(commandName)}', took, unit: 'millisecond'}); timeStart = timeNow;`);
      });

      _commands.push(`require('fs').writeFileSync(require('path').join(process.cwd(), '..', '${testName}_execution_time.json'), JSON.stringify(times, null, 4));`);

      let func = `tests["${testName}"] = async (driver, vars, opts = {}) => {`;
      func += _commands.join('');
      func += '}';
      res({
        id: test.id,
        name: testName,
        test: emittedTest,
        function: func
      });
    } else {
      // emit only additional hooks
      let snapshot = {
        commands: commands.reduce((snapshot, emittedCommand, index) => {
          if (!emittedCommand.skipped) {
            snapshot[test.commands[index].id] = emittedCommand;
          }

          return snapshot;
        }, {}),
        setupHooks,
        teardownHooks
      };

      if (Object.keys(snapshot.commands).length || snapshot.setupHooks.length || snapshot.teardownHooks.length) {
        // if we even snapshotted anything
        res({
          id: test.id,
          snapshot
        });
      } else {
        // resolve to nothing if there is no snapshot
        res({});
      }
    }
  });
}
function registerHook$2(hook) {
  hooks$2.push(hook);
}
function clearHooks() {
  hooks$2.length = 0;
}
var TestCaseEmitter = {
  emit: emit$5,
  registerHook: registerHook$2,
  clearHooks
};

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
function convertToSnake(string) {
  return string.replace(/(\s|\+|-|\*|\/|\\|%|!|\||&|=|\?|>|<|\(|\)|\[|\]|{|}|@|#|\^|:|;|'|"|`|\.|,)/g, '_');
}
function getUtilsFile() {
  return `
async function waitForWindow(driver, handles, timeout) {
  await driver.sleep(timeout);
  const hndls = await driver.getAllWindowHandles();
  if (hndls.length > handles.length) {
    return hndls.find(h => (!handles.includes(h)));
  }
  throw new Error("New window did not appear before timeout");
}

module.exports = {
  waitForWindow
};`;
}
var utils = {
  convertToSnake,
  getUtilsFile
};

/**
 * @typedef Project a Selenium IDE project (.side)
 * @property {string} id the id of the project
 * @property {string} name the name of the project
 * @property {string} url
 * @property {Test[]} tests
 * @property {Suite[]} suites
 * @property {string[]} urls
 * @property {any[]} plugins
 * @property {string} version
 *
 * @typedef Suite a suite of tests
 * @property {string} id the suite's id
 * @property {string} name the name of the suite
 * @property {boolean} parallel
 * @property {number} timeout
 * @property {string[]} tests an array of test id's
 *
 * @typedef Test a test
 * @property {string} id the id of the test
 * @property {string} name the name of the test
 * @property {Command[]} commands the name of the test
 *
 * @typedef Command a command
 * @property {string} id
 * @property {string} comment
 * @property {string} command
 * @property {string} target
 * @property {string[]} targets
 * @property {string} value
 *
 */

/**
 * Exports a Selenium IDE project (.side) to executable javascript code
 * @param {Project} project
 * @param {{ silenceErrors?: boolean, skipStdLibEmitting?: boolean }} _opts
 * @param {*} snapshot
 */

function Selianize(project, _opts, snapshot = {}) {
  const options = _objectSpread(_objectSpread({}, config), _opts);

  return new Promise(async (res, rej) => {
    // eslint-disable-line no-unused-vars
    const configuration = await ConfigurationEmitter.emit(project, options, snapshot.globalConfig ? snapshot.globalConfig.snapshot : undefined);
    let errors = [];
    const tests = await Promise.all(project.tests.map(test => {
      const testSnapshot = snapshot.tests ? snapshot.tests.find(snapshotTest => test.id === snapshotTest.id) : undefined;
      return TestCaseEmitter.emit(test, options, testSnapshot ? testSnapshot.snapshot : undefined).catch(e => {
        errors.push(e);
      });
    }));

    if (errors.length) {
      return rej({
        name: project.name,
        tests: errors
      });
    }

    const testsHashmap = project.tests.reduce((map, test, index) => {
      map[test.id] = {
        emitted: tests[index],
        test
      };
      return map;
    }, {});
    const suites = await Promise.all(project.suites.map(suite => SuiteEmitter.emit(suite, testsHashmap, options, snapshot.suites ? snapshot.suites.find(snapshotSuite => suite.name === snapshotSuite.name).snapshot : undefined)));
    const emittedTests = tests.filter(test => !!test.id).map(test => ({
      id: test.id,
      name: test.name,
      code: test.function,
      snapshot: test.snapshot
    }));
    const emittedSuites = suites.filter(suite => !suite.skipped).map((suiteCode, index) => ({
      name: project.suites[index].name,
      persistSession: project.suites[index].persistSession,
      code: !Array.isArray(suiteCode) ? suiteCode.code : undefined,
      tests: Array.isArray(suiteCode) ? suiteCode : undefined,
      snapshot: suiteCode.snapshot ? {
        hook: suiteCode.snapshot.hook
      } : undefined
    }));
    const results = {
      globalConfig: !configuration.skipped ? configuration : undefined,
      suites: emittedSuites.length ? emittedSuites : undefined,
      tests: emittedTests.length ? emittedTests : undefined
    };

    if (results.globalConfig || results.suites || results.tests) {
      return res(results);
    } else {
      return res(undefined);
    }
  });
}
function RegisterConfigurationHook(hook) {
  ConfigurationEmitter.registerHook(hook);
}
function RegisterSuiteHook(hook) {
  SuiteEmitter.registerHook(hook);
}
function RegisterTestHook(hook) {
  TestCaseEmitter.registerHook(hook);
}
function RegisterEmitter(command, emitter) {
  CommandEmitter.registerEmitter(command, emitter);
}
function ParseError(error) {
  return error.tests.map(test => `## ${sideUtils.stringEscape(test.name)}\n`.concat(test.commands.map(command => `${command.index}. ${command.message}\n`).join('').concat('\n'))).join('');
}
const Location = LocationEmitter;
const Command = CommandEmitter;
function getUtilsFile$1() {
  return utils.getUtilsFile();
}

exports.default = Selianize;
exports.RegisterConfigurationHook = RegisterConfigurationHook;
exports.RegisterSuiteHook = RegisterSuiteHook;
exports.RegisterTestHook = RegisterTestHook;
exports.RegisterEmitter = RegisterEmitter;
exports.ParseError = ParseError;
exports.Location = Location;
exports.Command = Command;
exports.getUtilsFile = getUtilsFile$1;
