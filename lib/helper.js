'use strict';

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const marked = require('marked');
marked.use({
  mangle: false,
  headerIds: false
});

const typeMap = {
  any: 'object',
  number: 'int?',
  boolean: 'bool?',
  object: 'Dictionary<string, object>',
  integer: 'int?',
  map: 'Dictionary<string, string>',
  uint16: 'ushort?',
  int16: 'short?',
  uint8: 'byte',
  int8: 'byte',
  uint32: 'uint?',
  int32: 'int?',
  uint64: 'ulong?',
  int64: 'long?',
  readable: 'Stream',
  writable: 'Stream',
  $Request: 'TeaRequest',
  $Response: 'TeaResponse',
  $Model: 'TeaModel',
  void: 'void',
  bytes: 'byte[]',
  float: 'float?',
  double: 'double?',
  class: 'Type',
  long: 'long?',
  ulong: 'ulong?'
};

function _name(str) {
  var name = str.lexeme;
  if (!name && str.name) {
    name = str.name;
  }
  return name;
}

function _upperFirst(str) {
  return str[0].toUpperCase() + str.substring(1);
}

function _lowerFirst(str) {
  return str[0].toLowerCase() + str.substring(1);
}

function _string(str) {
  return str.string;
}

function _prop(name) {
  return `['${name}']`;
}

function _type(name) {
  if (typeMap[name]) {
    name = typeMap[name];
  }

  return name;
}

function _avoidReserveName(name) {
  const reserves = [
    'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case',
    'catch', 'char', 'checked', 'class', 'const', 'continue',
    'decimal', 'default', 'delegate', 'do', 'double', 'else',
    'enum', 'event', 'explicit', 'extern', 'false', 'finally',
    'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
    'in', 'int', 'interface', 'internal', 'is', 'lock', 'long',
    'namespace', 'new', 'null', 'object', 'operator', 'out',
    'override', 'params', 'private', 'protected', 'public',
    'readonly', 'ref', 'return', 'sbyte', 'switch', 'this',
    'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked',
    'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile',
    'while', 'Equals'
  ];

  if (reserves.indexOf(name) !== -1) {
    return `${name}_`;
  }

  return name;
}

function remove(...filesPath) {
  filesPath.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach((file, index) => {
          let curPath = path.join(filePath, file);
          if (fs.statSync(curPath).isDirectory()) {
            remove(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
}

function _vid(vid) {
  return `_${_name(vid).substr(1)}`;
}

function parse(xml) {
  let _err, _result;
  xml2js.parseString(xml, function (err, result) {
    if (err) {
      _err = err;
      return;
    }
    _result = result;
  });
  if (_err) {
    throw _err;
  }

  return _result;
}

function render(template, params = {}) {
  Object.keys(params).forEach((key) => {
    template = template.split('${' + key + '}').join(params[key]);
  });
  return template;
}

function _format(str) {
  return str.replace(/<p>/g, '<para>')
    .replace(/<\/p>/g, '</para>')
    .replace(/<ul>/g, '<list type="bullet">')
    .replace(/<\/ul>/g, '</list>')
    .replace(/<li>/g, '<item><description>')
    .replace(/<\/li>/g, '</description></item>')
    .replace(/<strong>/g, '<b>')
    .replace(/<\/strong>/g, '</b>')
    .replace(/<code>/g, '<c>')
    .replace(/<\/code>/g, '</c>')
    .replace(/<blockquote>/g, '<remarks>')
    .replace(/<\/blockquote>/g, '</remarks>');
}

function md2Html(mdText) {
  let htmlText = marked.parse(mdText).trimEnd();
  return htmlText;
}

module.exports = {
  _name, _upperFirst, _string, _prop, _type, _lowerFirst,
  _avoidReserveName, remove, _vid, parse, render, _format, md2Html
};