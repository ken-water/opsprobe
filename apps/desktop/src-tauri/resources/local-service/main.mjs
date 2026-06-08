import { createRequire as __opsprobeCreateRequire } from 'node:module'; const require = __opsprobeCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "../../node_modules/postgres-array/index.js"(exports) {
    "use strict";
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// ../../node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "../../node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    var array = require_postgres_array();
    module.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// ../../node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "../../node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// ../../node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "../../node_modules/xtend/mutable.js"(exports, module) {
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// ../../node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "../../node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// ../../node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "../../node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    var bufferFrom = Buffer.from || Buffer;
    module.exports = function parseBytea(input2) {
      if (/^\\x/.test(input2)) {
        return bufferFrom(input2.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input2.length) {
        if (input2[i] !== "\\") {
          output += input2[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input2.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input2.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input2.length && input2[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    };
  }
});

// ../../node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "../../node_modules/pg-types/lib/textParsers.js"(exports, module) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module.exports = {
      init
    };
  }
});

// ../../node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "../../node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module.exports = readInt8;
  }
});

// ../../node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "../../node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module.exports = {
      init
    };
  }
});

// ../../node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "../../node_modules/pg-types/lib/builtins.js"(exports, module) {
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// ../../node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "../../node_modules/pg-types/index.js"(exports) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// ../../node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "../../node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    var user;
    try {
      user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
    } catch {
    }
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// ../../node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "../../node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    var defaults2 = require_defaults();
    var { isDate } = __require("util/types");
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result += ",";
        }
        let item = val[i];
        if (item == null) {
          result += "NULL";
        } else if (Array.isArray(item)) {
          result += arrayString(item);
        } else if (ArrayBuffer.isView(item)) {
          if (!(item instanceof Buffer)) {
            item = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(item));
        }
      }
      result += "}";
      return result;
    }
    var prepareValue = function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          return Buffer.from(val.buffer, val.byteOffset, val.byteLength);
        }
        if (isDate(val)) {
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    function normalizeQueryConfig(config2, values, callback) {
      config2 = typeof config2 === "string" ? { text: config2 } : config2;
      if (values) {
        if (typeof values === "function") {
          config2.callback = values;
        } else {
          config2.values = values;
        }
      }
      if (callback) {
        config2.callback = callback;
      }
      return config2;
    }
    var escapeIdentifier2 = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var escapeLiteral2 = function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// ../../node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/pg/lib/crypto/utils.js"(exports, module) {
    var nodeCrypto = __require("crypto");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// ../../node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "../../node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// ../../node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "../../node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    var crypto = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function saslprep(password) {
      const nonAsciiSpace = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g;
      const mappedToNothing = /[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g;
      return password.replace(nonAsciiSpace, " ").replace(mappedToNothing, "").normalize("NFKC");
    }
    var DEFAULT_MAX_SCRAM_ITERATIONS = 1e5;
    function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse",
        scramMaxIterations
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const scramMaxIterations = typeof session.scramMaxIterations === "number" ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS;
      if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations) {
        throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count " + sv.iteration + " exceeds scramMaxIterations of " + scramMaxIterations
        );
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto.deriveKey(saslprep(password), saltBytes, sv.iteration);
      const clientKey = await crypto.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto.sha256(clientKey);
      const clientSignature = await crypto.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const error = attrPairs.get("e");
      const serverSignature = attrPairs.get("v");
      if (error) {
        throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`);
      }
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module.exports = {
      startSession,
      continueSession,
      finalizeSession,
      DEFAULT_MAX_SCRAM_ITERATIONS
    };
  }
});

// ../../node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "../../node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// ../../node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "../../node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config3 = str.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = /* @__PURE__ */ Object.create(null);
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
        throw err;
      }
      for (const entry of result.searchParams.entries()) {
        config2[entry[0]] = entry[1];
      }
      config2.user = config2.user || decodeURIComponent(result.username);
      config2.password = config2.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config2.host = decodeURI(result.pathname);
        config2.database = result.searchParams.get("db");
        config2.client_encoding = result.searchParams.get("encoding");
        return config2;
      }
      const hostname2 = dummyHost ? "" : result.hostname;
      if (!config2.host) {
        config2.host = decodeURIComponent(hostname2);
      } else if (hostname2 && /^%2f/i.test(hostname2)) {
        result.pathname = hostname2 + result.pathname;
      }
      if (!config2.port) {
        config2.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config2.database = pathname ? decodeURI(pathname) : null;
      if (config2.ssl === "true" || config2.ssl === "1") {
        config2.ssl = true;
      }
      if (config2.ssl === "0") {
        config2.ssl = false;
      }
      if (config2.sslcert || config2.sslkey || config2.sslrootcert || config2.sslmode) {
        config2.ssl = {};
      }
      const fs = config2.sslcert || config2.sslkey || config2.sslrootcert ? __require("fs") : null;
      if (config2.sslcert) {
        config2.ssl.cert = fs.readFileSync(config2.sslcert).toString();
      }
      if (config2.sslkey) {
        config2.ssl.key = fs.readFileSync(config2.sslkey).toString();
      }
      if (config2.sslrootcert) {
        config2.ssl.ca = fs.readFileSync(config2.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config2.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config2.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config2.sslrootcert) {
              config2.ssl.checkServerIdentity = function() {
              };
            } else {
              config2.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config2.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config2.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            if (config2.sslmode !== "verify-full") {
              deprecatedSslModeWarning(config2.sslmode);
            }
            break;
          }
          case "no-verify": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config2;
    }
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return connectionOptions;
    }
    function toClientConfig(config2) {
      const poolConfig = Object.entries(config2).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return poolConfig;
    }
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
    }
    function deprecatedSslModeWarning(sslmode) {
      if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
        deprecatedSslModeWarning.warned = true;
        process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
      }
    }
    module.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// ../../node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "../../node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    var dns = __require("dns");
    var defaults2 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = function(key, config2, envVar) {
      if (config2[key]) {
        return config2[key];
      }
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return envVar || defaults2[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config2, paramName) {
      const value = config2[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config2) {
        config2 = typeof config2 === "string" ? parse(config2) : config2 || {};
        if (config2.connectionString) {
          config2 = Object.assign({}, config2, parse(config2.connectionString));
        }
        this.user = val("user", config2);
        this.database = val("database", config2);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config2), 10);
        this.host = val("host", config2);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config2)
        });
        this.binary = val("binary", config2);
        this.options = val("options", config2);
        this.ssl = typeof config2.ssl === "undefined" ? readSSLConfigFromEnvironment() : config2.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config2);
        this.replication = val("replication", config2);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config2, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config2, false);
        this.statement_timeout = val("statement_timeout", config2, false);
        this.lock_timeout = val("lock_timeout", config2, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config2, false);
        this.query_timeout = val("query_timeout", config2, false);
        if (config2.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config2.connectionTimeoutMillis / 1e3);
        }
        if (config2.keepAlive === false) {
          this.keepalives = 0;
        } else if (config2.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config2.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config2.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// ../../node_modules/pg/lib/result.js
var require_result = __commonJS({
  "../../node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = /* @__PURE__ */ Object.create(null);
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// ../../node_modules/pg/lib/query.js
var require_query = __commonJS({
  "../../node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    var { EventEmitter } = __require("events");
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter {
      constructor(config2, values, callback) {
        super();
        config2 = utils.normalizeQueryConfig(config2, values, callback);
        this.text = config2.text;
        this.values = config2.values;
        this.rows = config2.rows;
        this.types = config2.types;
        this.name = config2.name;
        this.queryMode = config2.queryMode;
        this.binary = config2.binary;
        this.portal = config2.portal || "";
        this.callback = config2.callback;
        this._rowMode = config2.rowMode;
        if (process.domain && config2.callback) {
          this.callback = process.domain.bind(config2.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// ../../node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "../../node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// ../../node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "../../node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports.Writer = Writer;
  }
});

// ../../node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "../../node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query = (text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse = (query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query2.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    };
    var bind = (config2 = {}) => {
      const portal = config2.portal || "";
      const statement = config2.statement || "";
      const binary = config2.binary || false;
      const values = config2.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config2.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config2) => {
      if (!config2 || !config2.portal && !config2.rows) {
        return emptyExecute;
      }
      const portal = config2.portal || "";
      const rows = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports.serialize = serialize;
  }
});

// ../../node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "../../node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// ../../node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "../../node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var LATEINIT_LENGTH = -1;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        reader.setBuffer(offset, bytes);
        let message;
        switch (code) {
          case 50:
            message = messages_1.bindComplete;
            break;
          case 49:
            message = messages_1.parseComplete;
            break;
          case 51:
            message = messages_1.closeComplete;
            break;
          case 110:
            message = messages_1.noData;
            break;
          case 115:
            message = messages_1.portalSuspended;
            break;
          case 99:
            message = messages_1.copyDone;
            break;
          case 87:
            message = messages_1.replicationStart;
            break;
          case 73:
            message = messages_1.emptyQuery;
            break;
          case 68:
            message = parseDataRowMessage(reader);
            break;
          case 67:
            message = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message = parseNotificationMessage(reader);
            break;
          case 82:
            message = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message = parseParameterStatusMessage(reader);
            break;
          case 75:
            message = parseBackendKeyData(reader);
            break;
          case 69:
            message = parseErrorMessage(reader, "error");
            break;
          case 78:
            message = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message = parseCopyInMessage(reader);
            break;
          case 72:
            message = parseCopyOutMessage(reader);
            break;
          case 100:
            message = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message.length = length;
        return message;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = (reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    };
    var parseCommandCompleteMessage = (reader) => {
      const text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
    };
    var parseCopyData = (reader, length) => {
      const chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    };
    var parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse");
    var parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse");
    var parseCopyMessage = (reader, messageName) => {
      const isBinary = reader.byte() !== 0;
      const columnCount = reader.int16();
      const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message.columnTypes[i] = reader.int16();
      }
      return message;
    };
    var parseNotificationMessage = (reader) => {
      const processId = reader.int32();
      const channel = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
    };
    var parseRowDescriptionMessage = (reader) => {
      const fieldCount = reader.int16();
      const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message.fields[i] = parseField(reader);
      }
      return message;
    };
    var parseField = (reader) => {
      const name = reader.cstring();
      const tableID = reader.uint32();
      const columnID = reader.int16();
      const dataTypeID = reader.uint32();
      const dataTypeSize = reader.int16();
      const dataTypeModifier = reader.int32();
      const mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    };
    var parseParameterDescriptionMessage = (reader) => {
      const parameterCount = reader.int16();
      const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message.dataTypeIDs[i] = reader.int32();
      }
      return message;
    };
    var parseDataRowMessage = (reader) => {
      const fieldCount = reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    };
    var parseParameterStatusMessage = (reader) => {
      const name = reader.cstring();
      const value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    };
    var parseBackendKeyData = (reader) => {
      const processID = reader.int32();
      const secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    };
    var parseAuthenticationResponse = (reader, length) => {
      const code = reader.int32();
      const message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message.length === 8) {
            message.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            const salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue";
          message.data = reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal";
          message.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    };
    var parseErrorMessage = (reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message.severity = fields.S;
      message.code = fields.C;
      message.detail = fields.D;
      message.hint = fields.H;
      message.position = fields.P;
      message.internalPosition = fields.p;
      message.internalQuery = fields.q;
      message.where = fields.W;
      message.schema = fields.s;
      message.table = fields.t;
      message.column = fields.c;
      message.dataType = fields.d;
      message.constraint = fields.n;
      message.file = fields.F;
      message.line = fields.L;
      message.routine = fields.R;
      return message;
    };
  }
});

// ../../node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = exports.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    exports.parse = parse;
  }
});

// ../../node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "../../node_modules/pg-cloudflare/dist/empty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {};
  }
});

// ../../node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "../../node_modules/pg/lib/stream.js"(exports, module) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = __require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        const tls = __require("tls");
        return tls.connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
        return navigator.userAgent === "Cloudflare-Workers";
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
  }
});

// ../../node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "../../node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var { parse, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter {
      constructor(config2) {
        super();
        config2 = config2 || {};
        this.stream = config2.stream || getStream(config2.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config2);
        }
        this._keepAlive = config2.keepAlive;
        this._keepAliveInitialDelayMillis = config2.keepAliveInitialDelayMillis;
        this.parsedStatements = {};
        this.ssl = config2.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          const net = __require("net");
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config2) {
        this.stream.write(serialize.startup(config2));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config2) {
        this._send(serialize.bind(config2));
      }
      // send execute message
      execute(config2) {
        this._send(serialize.execute(config2));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// ../../node_modules/split2/index.js
var require_split2 = __commonJS({
  "../../node_modules/split2/index.js"(exports, module) {
    "use strict";
    var { Transform } = __require("stream");
    var { StringDecoder } = __require("string_decoder");
    var kLast = Symbol("last");
    var kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    function noop(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    module.exports = split;
  }
});

// ../../node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "../../node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var Stream = __require("stream").Stream;
    var split = require_split2();
    var util = __require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// ../../node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = __require("fs");
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// ../../node_modules/pg/lib/client.js
var require_client = __commonJS({
  "../../node_modules/pg/lib/client.js"(exports, module) {
    var EventEmitter = __require("events").EventEmitter;
    var utils = require_utils();
    var nodeUtils = __require("util");
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto = require_utils2();
    var activeQueryDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.activeQuery is deprecated and will be removed in pg@9.0"
    );
    var queryQueueDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.queryQueue is deprecated and will be removed in pg@9.0."
    );
    var pgPassDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code."
    );
    var byoPromiseDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0."
    );
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    function coerceNumberOrDefault(value, defaultValue) {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : defaultValue;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
      }
      return defaultValue;
    }
    var Client2 = class extends EventEmitter {
      constructor(config2) {
        super();
        this.connectionParameters = new ConnectionParameters(config2);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config2 || {};
        if (c.Promise) {
          byoPromiseDeprecationNotice();
        }
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this._activeQuery = null;
        this._txStatus = null;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this._queryQueue = [];
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      get activeQuery() {
        activeQueryDeprecationNotice();
        return this._activeQuery;
      }
      set activeQuery(val) {
        activeQueryDeprecationNotice();
        this._activeQuery = val;
      }
      _getActiveQuery() {
        return this._activeQuery;
      }
      _errorAllQueries(err) {
        const enqueueError = (query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        };
        const activeQuery = this._getActiveQuery();
        if (activeQuery) {
          enqueueError(activeQuery);
          this._activeQuery = null;
        }
        this._queryQueue.forEach(enqueueError);
        this._queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(this);
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      _getPassword(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                pgPassDeprecationNotice();
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._getPassword(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._getPassword(async () => {
          try {
            const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._getPassword(() => {
          try {
            this.saslSession = sasl.startSession(
              msg.mechanisms,
              this.enableChannelBinding && this.connection.stream,
              this.scramMaxIterations
            );
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const activeQuery = this._getActiveQuery();
        this._activeQuery = null;
        this._txStatus = msg?.status ?? null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this._getActiveQuery();
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this._activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected rowDescription message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected dataRow message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected portalSuspended message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected emptyQuery message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (activeQuery.name) {
          this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyInResponse message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyData message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client._queryQueue.indexOf(query) !== -1) {
          client._queryQueue.splice(client._queryQueue.indexOf(query), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this._activeQuery = this._queryQueue.shift();
          const activeQuery = this._getActiveQuery();
          if (activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this._activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config2, values, callback) {
        let query;
        let result;
        if (config2 == null) {
          throw new TypeError("Client was passed a null or undefined query");
        }
        if (typeof config2.submit === "function") {
          result = query = config2;
          if (!query.callback) {
            if (typeof values === "function") {
              query.callback = values;
            } else if (callback) {
              query.callback = callback;
            }
          }
        } else {
          query = new Query2(config2, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          } else if (typeof query.callback !== "function") {
            throw new TypeError("callback is not a function");
          }
        }
        const readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        if (readTimeout) {
          const queryCallback = query.callback || (() => {
          });
          const readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            });
            queryCallback(error);
            query.callback = () => {
            };
            const index = this._queryQueue.indexOf(query);
            if (index > -1) {
              this._queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._queryQueue.length > 0) {
          queryQueueLengthDeprecationNotice();
        }
        this._queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      getTransactionStatus() {
        return this._txStatus;
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
            return;
          } else {
            return this._Promise.resolve();
          }
        }
        if (this._getActiveQuery() || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
      get queryQueue() {
        queryQueueDeprecationNotice();
        return this._queryQueue;
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// ../../node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "../../node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify3(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err, client) {
        err ? rej(err) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool, client) {
      return function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        });
        pool._remove(client);
        pool.emit("error", err, client);
      };
    }
    var Pool2 = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _promiseTry(f) {
        const Promise2 = this.Promise;
        if (typeof Promise2.try === "function") {
          return Promise2.try(f);
        }
        return new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context = this;
        client.end(() => {
          context.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify3(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            if (client.connection) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.connection.stream.destroy();
            } else if (!client.isConnected()) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.end();
            }
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client);
                  client.end(() => {
                    this._pulseQueue();
                    if (!pendingItem.timedOut) {
                      pendingItem.callback(hookErr, void 0, NOOP);
                    }
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime");
            this._expired.add(client);
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err, client2, clientRelease) => clientRelease()),
                idleListener,
                false
              );
            }
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref();
          client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, true);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            if (this._isAboveMin()) {
              this.log("remove idle client");
              this._remove(client, this._pulseQueue.bind(this));
            }
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify3(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify3(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = (err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify3(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool2;
  }
});

// ../../node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "../../node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var utils = require_utils();
    var NativeQuery = module.exports = function(config2, values, callback) {
      EventEmitter.call(this);
      config2 = utils.normalizeQueryConfig(config2, values, callback);
      this.text = config2.text;
      this.values = config2.values;
      this.name = config2.name;
      this.queryMode = config2.queryMode;
      this.callback = config2.callback;
      this.state = "new";
      this._arrayMode = config2.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// ../../node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "../../node_modules/pg/lib/native/client.js"(exports, module) {
    var nodeUtils = __require("util");
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    var Client2 = module.exports = function(config2) {
      EventEmitter.call(this);
      config2 = config2 || {};
      this._Promise = config2.Promise || global.Promise;
      this._types = new TypeOverrides2(config2.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp = this.connectionParameters = new ConnectionParameters(config2);
      if (config2.nativeConnectionString) cp.nativeConnectionString = config2.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = (query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb(null, this);
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(this);
          }
        });
      });
    };
    Client2.prototype.query = function(config2, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config2 === null || config2 === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config2.submit === "function") {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        result = query = config2;
        if (typeof values === "function") {
          config2.callback = values;
        }
      } else {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config2, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback || (() => {
        });
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      if (this._queryQueue.length > 0) {
        queryQueueLengthDeprecationNotice();
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (this._connecting && !this._connected) {
        this.once("connect", () => {
          this.end(() => {
          });
        });
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err) => err ? reject(err) : resolve();
        });
      }
      this.native.end(function() {
        self._connected = false;
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    Client2.prototype.isConnected = function() {
      return this._connected;
    };
    Client2.prototype.getTransactionStatus = function() {
      return this.native.getTransactionStatus();
    };
  }
});

// ../../node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "../../node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    module.exports = require_client2();
  }
});

// ../../node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "../../node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool2 {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor2) {
      this.defaults = defaults2;
      this.Client = clientConstructor2;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    };
    var clientConstructor = Client2;
    var forceNative = false;
    try {
      forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
    } catch {
    }
    if (forceNative) {
      clientConstructor = require_native();
    }
    module.exports = new PG(clientConstructor);
    Object.defineProperty(module.exports, "native", {
      configurable: true,
      enumerable: false,
      get() {
        let native = null;
        try {
          native = new PG(require_native());
        } catch (err) {
          if (err.code !== "MODULE_NOT_FOUND") {
            throw err;
          }
        }
        Object.defineProperty(module.exports, "native", {
          value: native
        });
        return native;
      }
    });
  }
});

// src/main.ts
import { mkdir as mkdir6, readFile as readFile6, rm as rm2, writeFile as writeFile5 } from "node:fs/promises";
import { existsSync as existsSync2 } from "node:fs";
import { stdin as input } from "node:process";

// ../../packages/checks/src/index.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
var builtInLinuxChecks = [
  {
    id: "linux.cpu.usage",
    title: "CPU Usage",
    description: "Checks whether CPU usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.cpu.usage",
        title: "CPU Usage",
        status: "warning",
        severity: "warning",
        summary: "CPU usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "78%" }
        ],
        remediation: "Inspect top CPU-consuming processes and review workload spikes."
      };
    }
  },
  {
    id: "linux.memory.usage",
    title: "Memory Usage",
    description: "Checks whether memory usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.memory.usage",
        title: "Memory Usage",
        status: "pass",
        severity: "info",
        summary: "Memory usage is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "53%" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.disk.usage",
    title: "Disk Usage",
    description: "Checks whether root filesystem usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.disk.usage",
        title: "Disk Usage",
        status: "warning",
        severity: "warning",
        summary: "Disk usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "81%" }
        ],
        remediation: "Review filesystem growth, log retention, and cleanup opportunities."
      };
    }
  },
  {
    id: "linux.load.average",
    title: "Load Average",
    description: "Checks whether load average is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.load.average",
        title: "Load Average",
        status: "pass",
        severity: "info",
        summary: "Load average is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Load", value: "0.42 0.37 0.35" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.time.sync",
    title: "Time Synchronization",
    description: "Checks whether the host clock is synchronized.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.time.sync",
        title: "Time Synchronization",
        status: "critical",
        severity: "critical",
        summary: "Clock drift exceeds the expected threshold.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Offset", value: "+4.2s" }
        ],
        remediation: "Verify chronyd or ntpd configuration and re-sync the host clock."
      };
    }
  },
  {
    id: "linux.process.sshd",
    title: "Key Process Status",
    description: "Checks whether the sshd process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.process.sshd",
        title: "Key Process Status",
        status: "pass",
        severity: "info",
        summary: "sshd is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "sshd" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.port.22",
    title: "Key Port Listening",
    description: "Checks whether TCP port 22 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.port.22",
        title: "Key Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 22 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "22/tcp" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.reboot.age",
    title: "Last Reboot Time",
    description: "Checks how long ago the host was rebooted.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.reboot.age",
        title: "Last Reboot Time",
        status: "pass",
        severity: "info",
        summary: "Recent reboot information was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Last Boot", value: "2026-06-01 09:12:00" }
        ],
        remediation: "Review reboot timing if unexpected restarts are observed."
      };
    }
  },
  {
    id: "linux.log.usage",
    title: "Log Directory Usage",
    description: "Checks whether /var/log usage is within a healthy range.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.log.usage",
        title: "Log Directory Usage",
        status: "warning",
        severity: "warning",
        summary: "/var/log usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "76%" }
        ],
        remediation: "Review log rotation, retention, and oversized log files in /var/log."
      };
    }
  },
  {
    id: "linux.nginx.process",
    title: "Nginx Process Status",
    description: "Checks whether the nginx process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.process",
        title: "Nginx Process Status",
        status: "pass",
        severity: "info",
        summary: "nginx is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "nginx" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.nginx.config",
    title: "Nginx Configuration Validation",
    description: "Checks whether nginx configuration passes syntax validation.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.config",
        title: "Nginx Configuration Validation",
        status: "pass",
        severity: "info",
        summary: "nginx configuration test passed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "nginx -t" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.nginx.vhost.inventory",
    title: "Nginx Virtual Host Inventory",
    description: "Collects nginx server block and server_name inventory for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.vhost.inventory",
        title: "Nginx Virtual Host Inventory",
        status: "pass",
        severity: "info",
        summary: "nginx virtual host inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "server blocks and server_name directives" }
        ],
        remediation: "Review unexpected listeners or server names before the next release window."
      };
    }
  },
  {
    id: "linux.nginx.tls.expiry",
    title: "Nginx TLS Certificate Expiry",
    description: "Checks static nginx TLS certificate expiry dates for upcoming renewal risk.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.tls.expiry",
        title: "Nginx TLS Certificate Expiry",
        status: "warning",
        severity: "warning",
        summary: "nginx TLS certificate expiry should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "ssl_certificate directives" }
        ],
        remediation: "Review certificate expiry dates and renew certificates before they reach the warning window."
      };
    }
  },
  {
    id: "linux.nginx.upstream.hints",
    title: "Nginx Upstream Configuration Hints",
    description: "Collects upstream block and proxy_pass hints for recurring reverse-proxy review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.upstream.hints",
        title: "Nginx Upstream Configuration Hints",
        status: "pass",
        severity: "info",
        summary: "Nginx upstream configuration hints were collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "upstream blocks, proxy_pass targets, fastcgi_pass targets" }
        ],
        remediation: "Review unexpected upstream targets, stale backends, or missing load-balancing intent before the next rollout."
      };
    }
  },
  {
    id: "linux.nginx.log.risk",
    title: "Nginx Error Log Risk",
    description: "Collects recent error-log hints so operators can spot failing requests and upstream trouble faster.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.log.risk",
        title: "Nginx Error Log Risk",
        status: "warning",
        severity: "warning",
        summary: "Recent Nginx error-log activity should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "recent error-level log lines from nginx error.log locations" }
        ],
        remediation: "Review recent upstream failures, permission errors, and TLS handshake problems before they accumulate into user-facing incidents."
      };
    }
  },
  {
    id: "linux.nginx.tls.posture",
    title: "Nginx TLS Posture",
    description: "Collects TLS protocol and stapling hints from Nginx configuration for recurring edge-service review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.tls.posture",
        title: "Nginx TLS Posture",
        status: "warning",
        severity: "warning",
        summary: "Nginx TLS posture should be reviewed for edge-facing services.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "ssl_protocols, ssl_stapling, ssl_ciphers, listen 443 presence" }
        ],
        remediation: "Review TLS protocol policy, stapling posture, and edge listener coverage if this host serves production HTTPS traffic."
      };
    }
  },
  {
    id: "linux.nginx.config.drift.hints",
    title: "Nginx Config Drift Hints",
    description: "Collects recent Nginx config file changes so operators can spot unexpected drift faster.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.nginx.config.drift.hints",
        title: "Nginx Config Drift Hints",
        status: "warning",
        severity: "warning",
        summary: "Recent Nginx config changes should be reviewed for unexpected drift.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "recently modified nginx config files under /etc/nginx" }
        ],
        remediation: "Review recent config-file changes and confirm they match the intended rollout or maintenance activity."
      };
    }
  },
  {
    id: "linux.mysql.process",
    title: "MySQL Process Status",
    description: "Checks whether mysql or mariadb process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.process",
        title: "MySQL Process Status",
        status: "pass",
        severity: "info",
        summary: "mysql or mariadb process is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "mysqld or mariadbd" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.mysql.port.3306",
    title: "MySQL Port Listening",
    description: "Checks whether TCP port 3306 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.port.3306",
        title: "MySQL Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 3306 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "3306/tcp" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.mysql.runtime.info",
    title: "MySQL Runtime Configuration",
    description: "Collects version, data directory, and read-only runtime signals from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.runtime.info",
        title: "MySQL Runtime Configuration",
        status: "pass",
        severity: "info",
        summary: "MySQL runtime configuration was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Runtime", value: "version, datadir, read_only, super_read_only" }
        ],
        remediation: "Review role and write-path expectations if read-only signals differ from the intended database role."
      };
    }
  },
  {
    id: "linux.mysql.schema.inventory",
    title: "MySQL Schema Inventory",
    description: "Collects non-system schema count and sample names for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.schema.inventory",
        title: "MySQL Schema Inventory",
        status: "pass",
        severity: "info",
        summary: "MySQL schema inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Inventory", value: "non-system schema count and sample names" }
        ],
        remediation: "Review unexpected schema growth or missing tenant schemas before the next maintenance window."
      };
    }
  },
  {
    id: "linux.mysql.connection.pressure",
    title: "MySQL Connection Pressure",
    description: "Collects connection and thread pressure signals from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.connection.pressure",
        title: "MySQL Connection Pressure",
        status: "warning",
        severity: "warning",
        summary: "MySQL connection pressure should be reviewed before it affects availability.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "Threads_connected, Threads_running, Max_used_connections, max_connections" }
        ],
        remediation: "Review connection pooling, burst traffic, and idle session cleanup if connection utilization remains elevated."
      };
    }
  },
  {
    id: "linux.mysql.replication.hints",
    title: "MySQL Replication Hints",
    description: "Collects replica-role and replication-health hints from MySQL or MariaDB.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.replication.hints",
        title: "MySQL Replication Hints",
        status: "pass",
        severity: "info",
        summary: "MySQL replication role hints were collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "read_only, super_read_only, replica IO/SQL state, lag hints" }
        ],
        remediation: "Review replica lag, IO state, and read-only posture if the database is expected to follow an upstream source."
      };
    }
  },
  {
    id: "linux.mysql.slow-query.risk",
    title: "MySQL Slow Query Risk",
    description: "Collects slow-query logging posture and accumulated slow-query count hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.slow-query.risk",
        title: "MySQL Slow Query Risk",
        status: "warning",
        severity: "warning",
        summary: "MySQL slow-query posture should be reviewed for recurring performance issues.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "slow_query_log, long_query_time, log_output, Slow_queries" }
        ],
        remediation: "Enable or review slow-query logging and investigate repeated slow-query growth before user-facing latency increases."
      };
    }
  },
  {
    id: "linux.mysql.temp-disk-table.risk",
    title: "MySQL Temp Disk Table Risk",
    description: "Collects temporary table spill-to-disk hints that often indicate sort, join, or buffer pressure.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.mysql.temp-disk-table.risk",
        title: "MySQL Temp Disk Table Risk",
        status: "warning",
        severity: "warning",
        summary: "MySQL temporary table spill risk should be reviewed for heavier query patterns.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "Created_tmp_tables, Created_tmp_disk_tables, tmp_table_size, max_heap_table_size" }
        ],
        remediation: "Review temporary table growth, query patterns, and temp table sizing if disk-based temp tables keep increasing."
      };
    }
  },
  {
    id: "linux.redis.process",
    title: "Redis Process Status",
    description: "Checks whether the redis-server process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.process",
        title: "Redis Process Status",
        status: "pass",
        severity: "info",
        summary: "redis-server is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "redis-server" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.redis.port.6379",
    title: "Redis Port Listening",
    description: "Checks whether TCP port 6379 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.port.6379",
        title: "Redis Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 6379 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "6379/tcp" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.redis.runtime.info",
    title: "Redis Runtime Configuration",
    description: "Collects Redis version, port, uptime, and persistence signals for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.runtime.info",
        title: "Redis Runtime Configuration",
        status: "pass",
        severity: "info",
        summary: "Redis runtime configuration was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Runtime",
            value: "redis_version, tcp_port, uptime_in_days, loading, rdb_last_bgsave_status, aof_enabled"
          }
        ],
        remediation: "Review persistence mode and runtime identity if this host is expected to serve a different Redis role."
      };
    }
  },
  {
    id: "linux.redis.replication.info",
    title: "Redis Replication Role",
    description: "Collects Redis role and replication health signals where available.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.replication.info",
        title: "Redis Replication Role",
        status: "pass",
        severity: "info",
        summary: "Redis replication metadata was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Replication",
            value: "role, connected_slaves, master_host, master_link_status"
          }
        ],
        remediation: "Review unexpected replica wiring or degraded master link state before the next maintenance window."
      };
    }
  },
  {
    id: "linux.redis.memory.pressure",
    title: "Redis Memory Pressure",
    description: "Collects Redis memory usage, maxmemory posture, and eviction-policy hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.memory.pressure",
        title: "Redis Memory Pressure",
        status: "warning",
        severity: "warning",
        summary: "Redis memory pressure should be reviewed before it impacts latency or writes.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "used_memory, maxmemory, maxmemory_policy, used_memory_peak" }
        ],
        remediation: "Review maxmemory sizing, eviction policy, and workload growth if Redis memory usage remains elevated."
      };
    }
  },
  {
    id: "linux.redis.persistence.risk",
    title: "Redis Persistence Risk",
    description: "Collects Redis RDB or AOF persistence posture and recent save status hints.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.persistence.risk",
        title: "Redis Persistence Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis persistence posture should be reviewed for recoverability expectations.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "aof_enabled, rdb_last_bgsave_status, rdb_changes_since_last_save, aof_last_write_status" }
        ],
        remediation: "Review save behavior, AOF posture, and recent persistence failures before relying on this node for recovery."
      };
    }
  },
  {
    id: "linux.redis.blocking.risk",
    title: "Redis Blocking Risk",
    description: "Collects blocked client and command-processing risk hints for recurring operational review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.blocking.risk",
        title: "Redis Blocking Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis blocking risk should be reviewed if clients or operations are stalling.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "blocked_clients, instantaneous_ops_per_sec, latest_fork_usec" }
        ],
        remediation: "Review blocked clients, slow commands, and fork-related pressure if Redis responsiveness has degraded."
      };
    }
  },
  {
    id: "linux.redis.eviction.risk",
    title: "Redis Eviction And Rejection Risk",
    description: "Collects evicted key and rejected connection hints that indicate user-facing pressure.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.redis.eviction.risk",
        title: "Redis Eviction And Rejection Risk",
        status: "warning",
        severity: "warning",
        summary: "Redis eviction or connection rejection risk should be reviewed before it impacts clients.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Signals", value: "evicted_keys, rejected_connections, maxclients, connected_clients" }
        ],
        remediation: "Review memory ceilings, client-count limits, and eviction activity before Redis starts dropping useful data or refusing clients."
      };
    }
  },
  {
    id: "linux.docker.process",
    title: "Docker Daemon Status",
    description: "Checks whether the Docker daemon is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.process",
        title: "Docker Daemon Status",
        status: "pass",
        severity: "info",
        summary: "docker daemon is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "dockerd" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.docker.info",
    title: "Docker Runtime Info",
    description: "Checks whether docker info can be collected from the host.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.info",
        title: "Docker Runtime Info",
        status: "pass",
        severity: "info",
        summary: "docker runtime info was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "docker info" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.docker.containers",
    title: "Docker Container Inventory",
    description: "Checks the number of running and stopped Docker containers.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.containers",
        title: "Docker Container Inventory",
        status: "pass",
        severity: "info",
        summary: "docker container inventory was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "docker ps -a" }
        ],
        remediation: "Review unexpected exited containers if service continuity is important on this host."
      };
    }
  },
  {
    id: "linux.docker.runtime.summary",
    title: "Docker Runtime Summary",
    description: "Collects Docker engine, driver, and container-count signals for recurring host review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.runtime.summary",
        title: "Docker Runtime Summary",
        status: "pass",
        severity: "info",
        summary: "Docker runtime summary was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Runtime",
            value: "server version, storage driver, cgroup driver, running/stopped containers, image count"
          }
        ],
        remediation: "Review runtime drift and unexpected container-count changes before the next maintenance window."
      };
    }
  },
  {
    id: "linux.docker.image.inventory",
    title: "Docker Image And Exited Container Inventory",
    description: "Collects image count plus exited or unhealthy container samples for recurring operator review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.docker.image.inventory",
        title: "Docker Image And Exited Container Inventory",
        status: "warning",
        severity: "warning",
        summary: "Docker image and abnormal container inventory should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Inventory",
            value: "image count, exited containers, restarting containers, unhealthy container samples"
          }
        ],
        remediation: "Review unexpected image growth and investigate exited, restarting, or unhealthy containers before the next release window."
      };
    }
  },
  {
    id: "linux.kubelet.process",
    title: "Kubelet Process Status",
    description: "Checks whether the kubelet process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.process",
        title: "Kubelet Process Status",
        status: "pass",
        severity: "info",
        summary: "kubelet is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "kubelet" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.kubelet.port.10250",
    title: "Kubelet Port Listening",
    description: "Checks whether kubelet secure port 10250 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.port.10250",
        title: "Kubelet Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 10250 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "10250/tcp" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.kubernetes.node.runtime",
    title: "Kubernetes Node Runtime",
    description: "Checks node-side runtime information through crictl or container runtime CLI.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.runtime",
        title: "Kubernetes Node Runtime",
        status: "pass",
        severity: "info",
        summary: "node runtime information was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Command", value: "crictl info or docker info" }
        ],
        remediation: "No action required."
      };
    }
  },
  {
    id: "linux.kubernetes.node.summary",
    title: "Kubernetes Node Summary",
    description: "Collects kubelet version, runtime endpoint, and pod-count signals from the node.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.summary",
        title: "Kubernetes Node Summary",
        status: "pass",
        severity: "info",
        summary: "Kubernetes node summary was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Node",
            value: "kubelet version, runtime endpoint, static pod path, running pod count, container count"
          }
        ],
        remediation: "Review node runtime endpoint drift and unexpected pod-count changes before the next maintenance window."
      };
    }
  },
  {
    id: "linux.kubernetes.static-pod.inventory",
    title: "Kubernetes Static Pod Inventory",
    description: "Collects static pod manifests and critical control-plane container samples where available.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.static-pod.inventory",
        title: "Kubernetes Static Pod Inventory",
        status: "warning",
        severity: "warning",
        summary: "Kubernetes static pod and critical container inventory should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Inventory",
            value: "static pod manifest count, manifest sample, critical container sample, non-running critical count"
          }
        ],
        remediation: "Review missing static pod manifests or non-running critical node containers before the next release window."
      };
    }
  },
  {
    id: "linux.kubelet.health.summary",
    title: "Kubelet Health Summary",
    description: "Collects kubelet service state, restart count, and recent failure hints for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubelet.health.summary",
        title: "Kubelet Health Summary",
        status: "warning",
        severity: "warning",
        summary: "Kubelet health summary should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Kubelet",
            value: "systemd active state, sub state, restart count, recent failure sample"
          }
        ],
        remediation: "Review unexpected restart growth or recent kubelet failures before the next maintenance window."
      };
    }
  },
  {
    id: "linux.kubernetes.node.pressure",
    title: "Kubernetes Node Pressure Signals",
    description: "Collects node pressure and eviction-related signals from the host for recurring review.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.kubernetes.node.pressure",
        title: "Kubernetes Node Pressure Signals",
        status: "warning",
        severity: "warning",
        summary: "Kubernetes node pressure signals should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          {
            label: "Pressure",
            value: "memory.available, imagefs.available, nodefs.available, PID pressure, eviction sample"
          }
        ],
        remediation: "Review memory, filesystem, or PID pressure before the node begins evicting workloads."
      };
    }
  }
];
var builtInInspectionTemplateDefinitions = [
  {
    id: "template.linux.default",
    name: "Linux Host Baseline",
    description: "Balanced Linux host baseline with capacity and state checks.",
    assetKind: "linux-host",
    checkIds: builtInLinuxChecks.map((check) => check.id)
  },
  {
    id: "template.linux.capacity",
    name: "Linux Capacity Review",
    description: "Focus on CPU, memory, disk, load, and log growth pressure.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.log.usage"
    ]
  },
  {
    id: "template.linux.state",
    name: "Linux Access and State Review",
    description: "Focus on time sync, SSH reachability indicators, reboot age, and log state.",
    assetKind: "linux-host",
    checkIds: [
      "linux.time.sync",
      "linux.process.sshd",
      "linux.port.22",
      "linux.reboot.age",
      "linux.log.usage"
    ]
  },
  {
    id: "template.linux.nginx",
    name: "Linux Nginx Baseline",
    description: "Linux host baseline plus nginx process and configuration checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.nginx.process",
      "linux.nginx.config",
      "linux.nginx.vhost.inventory"
    ]
  },
  {
    id: "template.linux.nginx.edge",
    name: "Linux Nginx Edge Review",
    description: "Deeper nginx review with upstream, log, TLS posture, and certificate-expiry checks for recurring edge service operations.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.nginx.process",
      "linux.nginx.config",
      "linux.nginx.vhost.inventory",
      "linux.nginx.upstream.hints",
      "linux.nginx.log.risk",
      "linux.nginx.tls.posture",
      "linux.nginx.config.drift.hints",
      "linux.nginx.tls.expiry"
    ]
  },
  {
    id: "template.linux.mysql",
    name: "Linux MySQL Baseline",
    description: "Linux host baseline plus deeper mysql or mariadb runtime, schema, connection, replication, and slow-query checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.mysql.process",
      "linux.mysql.port.3306",
      "linux.mysql.runtime.info",
      "linux.mysql.schema.inventory",
      "linux.mysql.connection.pressure",
      "linux.mysql.replication.hints",
      "linux.mysql.slow-query.risk",
      "linux.mysql.temp-disk-table.risk"
    ]
  },
  {
    id: "template.linux.redis",
    name: "Linux Redis Baseline",
    description: "Linux host baseline plus Redis process, listener, runtime, replication, memory, persistence, and blocking-risk checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.redis.process",
      "linux.redis.port.6379",
      "linux.redis.runtime.info",
      "linux.redis.replication.info",
      "linux.redis.memory.pressure",
      "linux.redis.persistence.risk",
      "linux.redis.blocking.risk",
      "linux.redis.eviction.risk"
    ]
  },
  {
    id: "template.linux.docker",
    name: "Linux Docker Host Baseline",
    description: "Linux host baseline plus Docker daemon, runtime, container, and image inventory checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.docker.process",
      "linux.docker.info",
      "linux.docker.containers",
      "linux.docker.runtime.summary",
      "linux.docker.image.inventory"
    ]
  },
  {
    id: "template.linux.kubernetes",
    name: "Linux Kubernetes Node Baseline",
    description: "Linux host baseline plus kubelet health, node runtime, static pod inventory, and pressure checks.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.time.sync",
      "linux.log.usage",
      "linux.kubelet.process",
      "linux.kubelet.port.10250",
      "linux.kubernetes.node.runtime",
      "linux.kubernetes.node.summary",
      "linux.kubernetes.static-pod.inventory",
      "linux.kubelet.health.summary",
      "linux.kubernetes.node.pressure"
    ]
  }
];
function findBuiltInTemplateDefinition(templateId) {
  return builtInInspectionTemplateDefinitions.find((template) => template.id === templateId);
}
function resolveTemplateChecks(templateId) {
  const template = findBuiltInTemplateDefinition(templateId) ?? builtInInspectionTemplateDefinitions[0];
  const checkMap = new Map(builtInLinuxChecks.map((check) => [check.id, check]));
  return template.checkIds.map((checkId) => checkMap.get(checkId)).filter((check) => Boolean(check));
}

// ../../packages/core/src/index.ts
function createInspectionTemplate(input2) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...input2,
    createdAt: now,
    updatedAt: now
  };
}
function summarizeResults(results) {
  return results.reduce(
    (summary, result) => {
      summary.total += 1;
      if (result.status === "pass") {
        summary.passed += 1;
      } else if (result.status === "warning") {
        summary.warning += 1;
      } else if (result.status === "critical") {
        summary.critical += 1;
      } else {
        summary.unknown += 1;
      }
      return summary;
    },
    {
      total: 0,
      passed: 0,
      warning: 0,
      critical: 0,
      unknown: 0
    }
  );
}

// src/config.ts
function createDefaultLocalServiceConfig() {
  const globalProcess = typeof globalThis === "object" && "process" in globalThis ? globalThis.process : void 0;
  const rootDir = globalProcess?.env?.HOME ? `${globalProcess.env.HOME}/.opsprobe` : "~/.opsprobe";
  const postgresPortRaw = globalProcess?.env?.OPSPROBE_POSTGRES_PORT;
  const postgresPort = Number.parseInt(postgresPortRaw ?? "15432", 10);
  return {
    paths: {
      rootDir,
      configDir: `${rootDir}/config`,
      desktopSettingsFile: `${rootDir}/config/desktop-settings.json`,
      schedulesFile: `${rootDir}/config/inspection-schedules.json`,
      dataDir: `${rootDir}/data`,
      reportDir: `${rootDir}/reports`,
      logDir: `${rootDir}/logs`,
      runtimeDir: `${rootDir}/runtime`,
      postgresDataDir: `${rootDir}/data/postgres`,
      postgresLogDir: `${rootDir}/logs/postgres`,
      postgresCtlLogFile: `${rootDir}/logs/postgres/managed-postgres.log`,
      postgresPidFile: `${rootDir}/data/postgres/postmaster.pid`,
      servicePidFile: `${rootDir}/runtime/local-service.pid`,
      serviceStatusFile: `${rootDir}/runtime/local-service-status.json`
    },
    postgres: {
      port: Number.isNaN(postgresPort) ? 15432 : postgresPort,
      version: null
    }
  };
}

// ../../packages/runner/src/index.ts
async function runInspection(input2, adapter) {
  const connection = await adapter.testConnection(input2.asset);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let results = [];
  let status = "completed";
  if (connection.ok) {
    results = await Promise.all(
      input2.checks.map((check) => {
        if (adapter.executeCheck) {
          return adapter.executeCheck(input2.asset, check);
        }
        return check.run({
          assetId: input2.asset.id,
          assetName: input2.asset.name,
          protocol: input2.asset.protocol,
          collectedAt: now
        });
      })
    );
  } else {
    status = "failed";
  }
  return {
    id: `run-${input2.task.id}`,
    taskId: input2.task.id,
    assetId: input2.asset.id,
    templateId: input2.template.id,
    status,
    results,
    summary: summarizeResults(results),
    createdAt: now,
    updatedAt: now
  };
}

// src/ssh.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
function validateSshAsset(asset) {
  if (asset.host.trim().length === 0) {
    throw new Error("Host is required.");
  }
  if (asset.credential.username.trim().length === 0) {
    throw new Error("Username is required.");
  }
  if (asset.credential.secretRef.trim().length === 0) {
    throw new Error(
      asset.credential.method === "private-key" ? "Private key path is required for private-key authentication." : "Password is required for password authentication."
    );
  }
}
async function runProcess(command, args) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024
    });
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      ok: true
    };
  } catch (error) {
    const failure = error;
    return {
      stdout: (failure.stdout ?? "").trim(),
      stderr: (failure.stderr ?? failure.message ?? "").trim(),
      ok: false
    };
  }
}
async function runSshCommand(asset, remoteCommand) {
  validateSshAsset(asset);
  const target = `${asset.credential.username}@${asset.host}`;
  const args = [
    "-o",
    "StrictHostKeyChecking=no",
    "-o",
    "ConnectTimeout=5",
    "-p",
    String(asset.port)
  ];
  if (asset.credential.method === "private-key") {
    args.push("-o", "BatchMode=yes", "-i", asset.credential.secretRef);
    return runProcess("ssh", [...args, target, remoteCommand]);
  }
  const sshpassCheck = await runProcess("sshpass", ["-V"]);
  if (!sshpassCheck.ok) {
    throw new Error("Password mode requires sshpass to be installed on the local machine.");
  }
  args.push("-o", "PreferredAuthentications=password", "-o", "PubkeyAuthentication=no");
  return runProcess("sshpass", ["-p", asset.credential.secretRef, "ssh", ...args, target, remoteCommand]);
}
async function sshOutput(asset, remoteCommand, checkId) {
  const output = await runSshCommand(asset, remoteCommand);
  if (output.ok) {
    if (output.stdout.length === 0) {
      throw new Error("Remote command returned empty output.");
    }
    return output.stdout;
  }
  throw new Error(output.stderr || `SSH command failed for ${checkId}.`);
}
function normalizedResult(input2, status, severity, summary, evidence, remediation) {
  return {
    checkId: input2.check.id,
    title: input2.check.title,
    status,
    severity,
    summary,
    evidence,
    remediation
  };
}
async function mysqlShellOutput(asset, shellScript, checkId) {
  const output = await sshOutput(asset, `sh -lc "${shellScript}"`, checkId);
  if (output.startsWith("__opsprobe_missing_mysql_client__")) {
    throw new Error("MySQL client is not available on the host.");
  }
  if (output.startsWith("__opsprobe_mysql_query_failed__")) {
    const detail = output.split("\n").slice(1).join(" ").trim();
    throw new Error(detail || "MySQL query execution failed.");
  }
  return output;
}
function parseMysqlKeyValueRows(output) {
  return new Map(
    output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).map((line) => line.split("	")).filter((parts) => parts.length >= 2).map(([key, value]) => [key, value])
  );
}
async function redisInfoOutput(asset, section, checkId) {
  const output = await sshOutput(
    asset,
    `sh -lc "if ! command -v redis-cli >/dev/null 2>&1; then echo __opsprobe_missing_redis_cli__; exit 0; fi; result=$(redis-cli INFO ${section} 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_redis_info_failed__\\n%s\\n' "$result"; exit 0; fi; printf '%s\\n' "$result""`,
    checkId
  );
  if (output.startsWith("__opsprobe_missing_redis_cli__")) {
    throw new Error("redis-cli is not available on the host.");
  }
  if (output.startsWith("__opsprobe_redis_info_failed__")) {
    const detail = output.split("\n").slice(1).join(" ").trim();
    throw new Error(detail || "Redis INFO query failed.");
  }
  return output;
}
function parseRedisInfo(output) {
  return new Map(
    output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#")).map((line) => line.split(":", 2)).filter((parts) => parts.length === 2).map(([key, value]) => [key, value])
  );
}
function evaluateMysqlConnectionPressure(output) {
  const rows = parseMysqlKeyValueRows(output);
  const threadsConnected = Number.parseInt(rows.get("Threads_connected") ?? "", 10);
  const threadsRunning = Number.parseInt(rows.get("Threads_running") ?? "", 10);
  const maxUsedConnections = Number.parseInt(rows.get("Max_used_connections") ?? "", 10);
  const maxConnections = Number.parseInt(rows.get("max_connections") ?? "", 10);
  if ([threadsConnected, threadsRunning, maxUsedConnections, maxConnections].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected MySQL connection pressure output: ${output}`);
  }
  const utilization = maxConnections > 0 ? maxUsedConnections / maxConnections * 100 : 0;
  const evidence = [
    { label: "Threads Connected", value: String(threadsConnected) },
    { label: "Threads Running", value: String(threadsRunning) },
    { label: "Max Used Connections", value: String(maxUsedConnections) },
    { label: "max_connections", value: String(maxConnections) },
    { label: "Peak Utilization", value: `${utilization.toFixed(1)}%` }
  ];
  if (utilization >= 85 || threadsRunning >= 32) {
    return {
      status: "critical",
      severity: "critical",
      summary: `MySQL connection pressure is high at ${utilization.toFixed(1)}% of max_connections.`,
      evidence,
      remediation: "Review connection pooling, long-running sessions, and whether max_connections or application concurrency limits need immediate adjustment."
    };
  }
  if (utilization >= 65 || threadsRunning >= 16) {
    return {
      status: "warning",
      severity: "warning",
      summary: `MySQL connection pressure is elevated at ${utilization.toFixed(1)}% of max_connections.`,
      evidence,
      remediation: "Review idle session cleanup, burst traffic, and pool sizing before connection pressure reaches availability risk."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: `MySQL connection pressure is within range at ${utilization.toFixed(1)}% of max_connections.`,
    evidence,
    remediation: "Review connection pooling and session churn if workload patterns change materially."
  };
}
function evaluateMysqlReplicationHints(output) {
  const readOnlyMatch = output.match(/read_only\t([^\n]+)/);
  const superReadOnlyMatch = output.match(/super_read_only\t([^\n]+)/);
  const ioMatch = output.match(/(?:Replica_IO_Running|Slave_IO_Running):\s*(\S+)/);
  const sqlMatch = output.match(/(?:Replica_SQL_Running|Slave_SQL_Running):\s*(\S+)/);
  const lagMatch = output.match(/(?:Seconds_Behind_Source|Seconds_Behind_Master):\s*(\S+)/);
  const sourceHostMatch = output.match(/(?:Source_Host|Master_Host):\s*(\S+)/);
  const readOnly = readOnlyMatch?.[1] ?? "unknown";
  const superReadOnly = superReadOnlyMatch?.[1] ?? "unknown";
  const ioState = ioMatch?.[1] ?? "not-reported";
  const sqlState = sqlMatch?.[1] ?? "not-reported";
  const lag = lagMatch?.[1] ?? "not-reported";
  const sourceHost = sourceHostMatch?.[1] ?? "standalone-or-primary";
  const evidence = [
    { label: "read_only", value: readOnly },
    { label: "super_read_only", value: superReadOnly },
    { label: "Replica IO", value: ioState },
    { label: "Replica SQL", value: sqlState },
    { label: "Lag", value: lag },
    { label: "Upstream", value: sourceHost }
  ];
  if ((ioState === "No" || sqlState === "No") && sourceHost !== "standalone-or-primary") {
    return {
      status: "critical",
      severity: "critical",
      summary: "MySQL replica health is degraded.",
      evidence,
      remediation: "Inspect replica IO or SQL thread failures, relay-log errors, and upstream reachability before relying on this node for failover or read traffic."
    };
  }
  if ((readOnly === "ON" || superReadOnly === "ON") && sourceHost === "standalone-or-primary") {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL is read-only but no replica status was reported.",
      evidence,
      remediation: "Confirm whether this host is intentionally pinned read-only or whether replica configuration drift removed expected upstream state."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: sourceHost === "standalone-or-primary" ? "MySQL appears to be standalone or primary with no replica status reported." : "MySQL replication hints were collected successfully.",
    evidence,
    remediation: "Review replica lag, read-only posture, and upstream state if this host participates in replication."
  };
}
function evaluateMysqlSlowQueryRisk(output) {
  const rows = parseMysqlKeyValueRows(output);
  const slowQueryLog = (rows.get("slow_query_log") ?? "unknown").toUpperCase();
  const longQueryTime = Number.parseFloat(rows.get("long_query_time") ?? "");
  const slowQueries = Number.parseInt(rows.get("Slow_queries") ?? "", 10);
  const logOutput = rows.get("log_output") ?? "unknown";
  if (Number.isNaN(longQueryTime) || Number.isNaN(slowQueries)) {
    throw new Error(`Unexpected MySQL slow-query output: ${output}`);
  }
  const evidence = [
    { label: "slow_query_log", value: slowQueryLog },
    { label: "long_query_time", value: String(longQueryTime) },
    { label: "log_output", value: logOutput },
    { label: "Slow_queries", value: String(slowQueries) }
  ];
  if (slowQueryLog !== "ON") {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL slow-query logging is disabled.",
      evidence,
      remediation: "Enable slow-query logging or confirm an alternative query-observability path before recurring performance issues become harder to diagnose."
    };
  }
  if (slowQueries >= 1e3 || longQueryTime > 5) {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL slow-query risk should be reviewed.",
      evidence,
      remediation: "Review accumulated slow-query count, tune long_query_time for your workload, and inspect repeated expensive query patterns."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "MySQL slow-query posture is within the expected range.",
    evidence,
    remediation: "Continue reviewing slow-query growth during recurring performance checks."
  };
}
function evaluateMysqlTempDiskTableRisk(output) {
  const rows = parseMysqlKeyValueRows(output);
  const createdTmpTables = Number.parseInt(rows.get("Created_tmp_tables") ?? "", 10);
  const createdTmpDiskTables = Number.parseInt(rows.get("Created_tmp_disk_tables") ?? "", 10);
  const tmpTableSize = Number.parseInt(rows.get("tmp_table_size") ?? "", 10);
  const maxHeapTableSize = Number.parseInt(rows.get("max_heap_table_size") ?? "", 10);
  if ([createdTmpTables, createdTmpDiskTables, tmpTableSize, maxHeapTableSize].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected MySQL temp table output: ${output}`);
  }
  const spillRatio = createdTmpTables > 0 ? createdTmpDiskTables / createdTmpTables * 100 : 0;
  const evidence = [
    { label: "Created_tmp_tables", value: String(createdTmpTables) },
    { label: "Created_tmp_disk_tables", value: String(createdTmpDiskTables) },
    { label: "Disk Spill Ratio", value: `${spillRatio.toFixed(1)}%` },
    { label: "tmp_table_size", value: String(tmpTableSize) },
    { label: "max_heap_table_size", value: String(maxHeapTableSize) }
  ];
  if (spillRatio >= 25 || createdTmpDiskTables >= 1e3) {
    return {
      status: "critical",
      severity: "critical",
      summary: "MySQL temporary table spill-to-disk risk is high.",
      evidence,
      remediation: "Inspect heavy sort or aggregation queries and review tmp_table_size, max_heap_table_size, and execution plans before disk-backed temp tables affect latency."
    };
  }
  if (spillRatio >= 10 || createdTmpDiskTables >= 250) {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL temporary table spill-to-disk risk is elevated.",
      evidence,
      remediation: "Review query patterns and temporary table sizing if disk-backed temp table growth continues during normal workload periods."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "MySQL temporary table spill-to-disk risk is within the expected range.",
    evidence,
    remediation: "Continue monitoring temporary table spill behavior as workload shape changes."
  };
}
function evaluateRedisMemoryPressure(output) {
  const info = parseRedisInfo(output);
  const usedMemory = Number.parseInt(info.get("used_memory") ?? "", 10);
  const maxmemory = Number.parseInt(info.get("maxmemory") ?? "", 10);
  const peakMemory = Number.parseInt(info.get("used_memory_peak") ?? "", 10);
  const policy = info.get("maxmemory_policy") ?? "unknown";
  if ([usedMemory, peakMemory].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected Redis memory output: ${output}`);
  }
  const hasMemoryLimit = !Number.isNaN(maxmemory) && maxmemory > 0;
  const utilization = hasMemoryLimit ? usedMemory / maxmemory * 100 : 0;
  const evidence = [
    { label: "used_memory", value: String(usedMemory) },
    { label: "used_memory_peak", value: String(peakMemory) },
    { label: "maxmemory", value: hasMemoryLimit ? String(maxmemory) : "0" },
    { label: "maxmemory_policy", value: policy },
    { label: "Utilization", value: hasMemoryLimit ? `${utilization.toFixed(1)}%` : "unbounded" }
  ];
  if (!hasMemoryLimit) {
    return {
      status: "warning",
      severity: "warning",
      summary: "Redis has no maxmemory limit configured.",
      evidence,
      remediation: "Set maxmemory and an intentional eviction policy if this Redis instance should not grow without bounds."
    };
  }
  if (utilization >= 90) {
    return {
      status: "critical",
      severity: "critical",
      summary: `Redis memory pressure is high at ${utilization.toFixed(1)}% of maxmemory.`,
      evidence,
      remediation: "Review dataset growth, eviction behavior, and memory sizing before Redis starts rejecting writes or evicting unexpectedly."
    };
  }
  if (utilization >= 75) {
    return {
      status: "warning",
      severity: "warning",
      summary: `Redis memory pressure is elevated at ${utilization.toFixed(1)}% of maxmemory.`,
      evidence,
      remediation: "Review dataset growth and eviction posture before Redis memory utilization approaches the configured ceiling."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: `Redis memory pressure is within range at ${utilization.toFixed(1)}% of maxmemory.`,
    evidence,
    remediation: "Continue monitoring Redis memory growth as workload shape changes."
  };
}
function evaluateRedisPersistenceRisk(output) {
  const info = parseRedisInfo(output);
  const aofEnabled = (info.get("aof_enabled") ?? "unknown").toLowerCase();
  const rdbStatus = (info.get("rdb_last_bgsave_status") ?? "unknown").toLowerCase();
  const aofStatus = (info.get("aof_last_write_status") ?? "unknown").toLowerCase();
  const changesSinceSave = Number.parseInt(info.get("rdb_changes_since_last_save") ?? "", 10);
  if (Number.isNaN(changesSinceSave)) {
    throw new Error(`Unexpected Redis persistence output: ${output}`);
  }
  const evidence = [
    { label: "aof_enabled", value: aofEnabled },
    { label: "rdb_last_bgsave_status", value: rdbStatus },
    { label: "aof_last_write_status", value: aofStatus },
    { label: "rdb_changes_since_last_save", value: String(changesSinceSave) }
  ];
  if (rdbStatus === "err" || aofStatus === "err") {
    return {
      status: "critical",
      severity: "critical",
      summary: "Redis persistence has recent save or write failures.",
      evidence,
      remediation: "Inspect Redis persistence errors, disk health, and background save or AOF write failures before relying on this node for recovery."
    };
  }
  if (aofEnabled !== "1" && changesSinceSave >= 1e4) {
    return {
      status: "warning",
      severity: "warning",
      summary: "Redis has accumulated many unsaved changes without AOF enabled.",
      evidence,
      remediation: "Review save cadence and whether AOF or more frequent snapshots are needed for the expected recovery objective."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "Redis persistence posture is within the expected range.",
    evidence,
    remediation: "Continue reviewing Redis save cadence and persistence mode against recovery expectations."
  };
}
function evaluateRedisBlockingRisk(output) {
  const info = parseRedisInfo(output);
  const blockedClients = Number.parseInt(info.get("blocked_clients") ?? "", 10);
  const opsPerSec = Number.parseInt(info.get("instantaneous_ops_per_sec") ?? "", 10);
  const latestForkUsec = Number.parseInt(info.get("latest_fork_usec") ?? "", 10);
  if ([blockedClients, opsPerSec, latestForkUsec].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected Redis blocking output: ${output}`);
  }
  const evidence = [
    { label: "blocked_clients", value: String(blockedClients) },
    { label: "instantaneous_ops_per_sec", value: String(opsPerSec) },
    { label: "latest_fork_usec", value: String(latestForkUsec) }
  ];
  if (blockedClients >= 5 || latestForkUsec >= 1e6) {
    return {
      status: "critical",
      severity: "critical",
      summary: "Redis blocking risk is high.",
      evidence,
      remediation: "Inspect blocked clients, slow commands, and fork stalls before Redis responsiveness impacts dependent applications."
    };
  }
  if (blockedClients > 0 || latestForkUsec >= 25e4) {
    return {
      status: "warning",
      severity: "warning",
      summary: "Redis blocking risk is elevated.",
      evidence,
      remediation: "Review blocked clients, persistence fork overhead, and expensive commands if Redis latency has started to drift."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "Redis blocking risk is within the expected range.",
    evidence,
    remediation: "Continue monitoring blocked client count and fork overhead during busy periods."
  };
}
function evaluateRedisEvictionRisk(output) {
  const info = parseRedisInfo(output);
  const evictedKeys = Number.parseInt(info.get("evicted_keys") ?? "", 10);
  const rejectedConnections = Number.parseInt(info.get("rejected_connections") ?? "", 10);
  const maxclients = Number.parseInt(info.get("maxclients") ?? "", 10);
  const connectedClients = Number.parseInt(info.get("connected_clients") ?? "", 10);
  if ([evictedKeys, rejectedConnections, maxclients, connectedClients].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected Redis eviction output: ${output}`);
  }
  const clientUtilization = maxclients > 0 ? connectedClients / maxclients * 100 : 0;
  const evidence = [
    { label: "evicted_keys", value: String(evictedKeys) },
    { label: "rejected_connections", value: String(rejectedConnections) },
    { label: "connected_clients", value: String(connectedClients) },
    { label: "maxclients", value: String(maxclients) },
    { label: "Client Utilization", value: `${clientUtilization.toFixed(1)}%` }
  ];
  if (evictedKeys > 0 || rejectedConnections > 0) {
    return {
      status: "critical",
      severity: "critical",
      summary: "Redis has already started evicting keys or rejecting connections.",
      evidence,
      remediation: "Inspect maxmemory behavior, client surges, and whether Redis is already dropping data or refusing clients under current load."
    };
  }
  if (clientUtilization >= 80) {
    return {
      status: "warning",
      severity: "warning",
      summary: `Redis client-count pressure is elevated at ${clientUtilization.toFixed(1)}% of maxclients.`,
      evidence,
      remediation: "Review client churn, pooling behavior, and maxclients sizing before Redis starts refusing new connections."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "Redis eviction and rejection risk is within the expected range.",
    evidence,
    remediation: "Continue monitoring eviction and connection-rejection counters as workload concurrency grows."
  };
}
function evaluateNginxLogRisk(output) {
  const lines = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0 || lines.length === 1 && lines[0] === "clean") {
    return {
      status: "pass",
      severity: "info",
      summary: "No recent high-signal Nginx error log activity was detected.",
      evidence: [{ label: "Recent Error Entries", value: "clean" }],
      remediation: "Continue monitoring recent Nginx error-log activity during deploys and traffic changes."
    };
  }
  if (lines.length >= 5) {
    return {
      status: "critical",
      severity: "critical",
      summary: "Recent Nginx error log activity is high.",
      evidence: [{ label: "Recent Error Entries", value: lines.slice(0, 3).join(" | ") }],
      remediation: "Inspect repeated upstream failures, permission errors, or TLS handshake problems before they turn into a broader outage."
    };
  }
  return {
    status: "warning",
    severity: "warning",
    summary: "Recent Nginx error log activity should be reviewed.",
    evidence: [{ label: "Recent Error Entries", value: lines.slice(0, 3).join(" | ") }],
    remediation: "Review recent upstream failures, permission errors, or TLS handshake problems before they accumulate into user-facing incidents."
  };
}
function evaluateNginxTlsPosture(output) {
  const hasTls12Or13 = /(TLSv1\.2|TLSv1\.3)/.test(output);
  const hasListen443 = /listen_443:(present|yes)/.test(output);
  const hasStapling = /ssl_stapling:(on|present)/.test(output);
  const evidence = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).slice(0, 6).map((line) => {
    const [label, value] = line.split(":", 2);
    return { label, value: value ?? "" };
  });
  if (!hasListen443) {
    return {
      status: "warning",
      severity: "warning",
      summary: "Nginx TLS listener coverage should be reviewed.",
      evidence,
      remediation: "Confirm whether this edge host is expected to terminate HTTPS and whether the intended TLS listeners are present."
    };
  }
  if (!hasTls12Or13) {
    return {
      status: "critical",
      severity: "critical",
      summary: "Nginx TLS protocol posture is weak or missing expected modern protocols.",
      evidence,
      remediation: "Review ssl_protocols and edge policy so TLS 1.2 or TLS 1.3 is available for intended client traffic."
    };
  }
  if (!hasStapling) {
    return {
      status: "warning",
      severity: "warning",
      summary: "Nginx TLS stapling posture should be reviewed.",
      evidence,
      remediation: "Review ssl_stapling posture and certificate-response caching if this host serves production HTTPS traffic."
    };
  }
  return {
    status: "pass",
    severity: "info",
    summary: "Nginx TLS posture is within the expected range.",
    evidence,
    remediation: "Continue reviewing TLS protocol and stapling posture as certificate or edge policy changes."
  };
}
function evaluateNginxConfigDriftHints(output) {
  const lines = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0 || lines.length === 1 && lines[0] === "clean") {
    return {
      status: "pass",
      severity: "info",
      summary: "No recent Nginx config drift hints were detected.",
      evidence: [{ label: "Recent Config Changes", value: "clean" }],
      remediation: "Continue reviewing config-file change history during planned rollouts and emergency fixes."
    };
  }
  return {
    status: "warning",
    severity: "warning",
    summary: "Recent Nginx config changes should be reviewed for unexpected drift.",
    evidence: [{ label: "Recent Config Changes", value: lines.slice(0, 3).join(" | ") }],
    remediation: "Review recent config-file changes and confirm they match the intended rollout or maintenance activity."
  };
}
async function executeLinuxCheck(input2) {
  switch (input2.check.id) {
    case "linux.cpu.usage": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v vmstat >/dev/null 2>&1; then vmstat 1 2 | tail -1 | awk '{print 100-$15}'; elif command -v top >/dev/null 2>&1; then top -bn2 | grep 'Cpu(s)' | tail -1 | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100-$1}'; else echo unsupported; fi"`,
        input2.check.id
      );
      if (output === "unsupported") {
        return normalizedResult(
          input2,
          "unknown",
          "warning",
          "CPU usage could not be collected because neither vmstat nor top is available.",
          [{ label: "Collector", value: "missing vmstat/top" }],
          "Install procps or provide a supported CPU metrics command on the host."
        );
      }
      const usage = Number.parseFloat(output);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse CPU usage output: ${output}`);
      }
      if (usage >= 85) {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          `CPU usage is high at ${usage.toFixed(1)}%.`,
          [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
          "Inspect top CPU-consuming processes and review workload spikes."
        );
      }
      if (usage >= 70) {
        return normalizedResult(
          input2,
          "warning",
          "warning",
          `CPU usage is elevated at ${usage.toFixed(1)}%.`,
          [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
          "Inspect top CPU-consuming processes and review workload spikes."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        `CPU usage is within range at ${usage.toFixed(1)}%.`,
        [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
        "Inspect top CPU-consuming processes and review workload spikes."
      );
    }
    case "linux.memory.usage": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "free -m | awk '/Mem:/ {printf \\"%s %s %s\\", $2, $3, ($3*100)/$2}'"`,
        input2.check.id
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected memory output: ${output}`);
      }
      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse memory usage output: ${output}`);
      }
      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Memory", value: `${parts[1]} MiB` },
        { label: "Total Memory", value: `${parts[0]} MiB` }
      ];
      if (usage >= 90) {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          `Memory usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review large processes, memory leaks, and swap activity if usage remains elevated."
        );
      }
      if (usage >= 75) {
        return normalizedResult(
          input2,
          "warning",
          "warning",
          `Memory usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review large processes, memory leaks, and swap activity if usage remains elevated."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        `Memory usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review large processes, memory leaks, and swap activity if usage remains elevated."
      );
    }
    case "linux.disk.usage": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "df -P / | awk 'NR==2 {gsub(/%/, \\"\\", $5); printf \\"%s %s %s\\", $2, $3, $5}'"`,
        input2.check.id
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected disk output: ${output}`);
      }
      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse disk usage output: ${output}`);
      }
      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Blocks", value: parts[1] },
        { label: "Total Blocks", value: parts[0] }
      ];
      if (usage >= 90) {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          `Root filesystem usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review filesystem growth, log retention, and cleanup opportunities on the root volume."
        );
      }
      if (usage >= 80) {
        return normalizedResult(
          input2,
          "warning",
          "warning",
          `Root filesystem usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review filesystem growth, log retention, and cleanup opportunities on the root volume."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        `Root filesystem usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review filesystem growth, log retention, and cleanup opportunities on the root volume."
      );
    }
    case "linux.load.average": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "cat /proc/loadavg | awk '{printf \\"%s %s %s\\", $1, $2, $3}'"`,
        input2.check.id
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected load output: ${output}`);
      }
      const load1 = Number.parseFloat(parts[0]);
      const load5 = Number.parseFloat(parts[1]);
      const load15 = Number.parseFloat(parts[2]);
      if ([load1, load5, load15].some((value) => Number.isNaN(value))) {
        throw new Error(`Unable to parse load output: ${output}`);
      }
      const evidence = [
        { label: "Load 1m", value: load1.toFixed(2) },
        { label: "Load 5m", value: load5.toFixed(2) },
        { label: "Load 15m", value: load15.toFixed(2) }
      ];
      if (load1 >= 4) {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          `Load average is high at ${load1.toFixed(2)}.`,
          evidence,
          "Review CPU saturation, blocked IO, and queued work if load remains elevated."
        );
      }
      if (load1 >= 2) {
        return normalizedResult(
          input2,
          "warning",
          "warning",
          `Load average is elevated at ${load1.toFixed(2)}.`,
          evidence,
          "Review CPU saturation, blocked IO, and queued work if load remains elevated."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        `Load average is within range at ${load1.toFixed(2)}.`,
        evidence,
        "Review CPU saturation, blocked IO, and queued work if load remains elevated."
      );
    }
    case "linux.time.sync": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "if command -v timedatectl >/dev/null 2>&1; then timedatectl show -p NTPSynchronized --value; else echo unknown; fi"',
        input2.check.id
      );
      const lowered = output.toLowerCase();
      if (lowered === "yes") {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "Host clock is synchronized.",
          [{ label: "NTPSynchronized", value: output }],
          "No action required."
        );
      }
      if (lowered === "no") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "Host clock is not synchronized.",
          [{ label: "NTPSynchronized", value: output }],
          "Verify chronyd or systemd-timesyncd configuration and re-sync the host clock."
        );
      }
      return normalizedResult(
        input2,
        "unknown",
        "warning",
        "Time synchronization state could not be determined.",
        [{ label: "Collector", value: output }],
        "Verify whether timedatectl is available and confirm the host time service status."
      );
    }
    case "linux.process.sshd": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "pgrep -x sshd >/dev/null && echo running || echo stopped"',
        input2.check.id
      );
      if (output === "running") {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "sshd is running.",
          [{ label: "Process", value: "sshd" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "sshd is not running.",
        [{ label: "Process", value: "sshd" }],
        "Start sshd and verify the service is enabled if remote access is expected."
      );
    }
    case "linux.port.22": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :22 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:22$/ {count++} END {print count+0}'; else echo unsupported; fi"`,
        input2.check.id
      );
      if (output === "unsupported") {
        return normalizedResult(
          input2,
          "unknown",
          "warning",
          "Listening port state could not be collected because ss/netstat is unavailable.",
          [{ label: "Collector", value: "missing ss/netstat" }],
          "Install iproute2 or net-tools to allow port inspection."
        );
      }
      const listeners = Number.parseInt(output, 10);
      if (Number.isNaN(listeners)) {
        throw new Error(`Unable to parse port listener output: ${output}`);
      }
      if (listeners > 0) {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "Port 22 is listening.",
          [{ label: "Port", value: "22/tcp" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "Port 22 is not listening.",
        [{ label: "Port", value: "22/tcp" }],
        "Verify sshd is running and listening on the expected interface and port."
      );
    }
    case "linux.reboot.age": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v who >/dev/null 2>&1; then who -b | sed 's/.*system boot  *//'; else uptime -s; fi"`,
        input2.check.id
      );
      return normalizedResult(
        input2,
        "pass",
        "info",
        "Recent reboot information was collected successfully.",
        [{ label: "Last Boot", value: output }],
        "Review reboot timing if unexpected restarts are observed."
      );
    }
    case "linux.log.usage": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "df -P /var/log | awk 'NR==2 {gsub(/%/, \\"\\", $5); printf \\"%s %s %s\\", $2, $3, $5}'"`,
        input2.check.id
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected /var/log output: ${output}`);
      }
      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse /var/log usage output: ${output}`);
      }
      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Blocks", value: parts[1] },
        { label: "Total Blocks", value: parts[0] }
      ];
      if (usage >= 85) {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          `/var/log usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review log rotation, retention, and oversized log files in /var/log."
        );
      }
      if (usage >= 70) {
        return normalizedResult(
          input2,
          "warning",
          "warning",
          `/var/log usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review log rotation, retention, and oversized log files in /var/log."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        `/var/log usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review log rotation, retention, and oversized log files in /var/log."
      );
    }
    case "linux.nginx.process": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "pgrep -x nginx >/dev/null && echo running || echo stopped"',
        input2.check.id
      );
      if (output === "running") {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "nginx is running.",
          [{ label: "Process", value: "nginx" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "nginx is not running.",
        [{ label: "Process", value: "nginx" }],
        "Start nginx and confirm the service is enabled or supervised before routing traffic back to this host."
      );
    }
    case "linux.nginx.config": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "if command -v nginx >/dev/null 2>&1; then nginx -t 2>&1; else echo missing-nginx; fi"',
        input2.check.id
      );
      if (output === "missing-nginx") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "nginx binary is not available on the host.",
          [{ label: "Command", value: "nginx -t" }],
          "Install nginx or confirm that this host is expected to serve traffic through a different web stack."
        );
      }
      if (/test is successful/i.test(output)) {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "nginx configuration test passed.",
          [{ label: "Command", value: "nginx -t" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "nginx configuration test failed.",
        [{ label: "Command Output", value: output.split("\n").slice(-1)[0] ?? output }],
        "Review the failing nginx configuration file and test again before reloading the service."
      );
    }
    case "linux.nginx.vhost.inventory": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v nginx >/dev/null 2>&1; then nginx -T 2>/dev/null | awk '/server_name|listen / {print}' | head -n 20; else echo missing-nginx; fi"`,
        input2.check.id
      );
      if (output === "missing-nginx") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "nginx binary is not available on the host.",
          [{ label: "Inventory", value: "nginx -T unavailable" }],
          "Install nginx or confirm that this host is expected to serve traffic through a different web stack."
        );
      }
      const lines = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      return normalizedResult(
        input2,
        "pass",
        "info",
        "nginx virtual host inventory was collected successfully.",
        [
          { label: "Inventory Count", value: String(lines.length) },
          { label: "Inventory Sample", value: lines.slice(0, 3).join(" | ") || "none" }
        ],
        "Review unexpected listeners or server names before the next release window."
      );
    }
    case "linux.nginx.upstream.hints": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v nginx >/dev/null 2>&1; then nginx -T 2>/dev/null | awk '/upstream |proxy_pass |fastcgi_pass / {print}' | head -n 20; else echo missing-nginx; fi"`,
        input2.check.id
      );
      if (output === "missing-nginx") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "nginx binary is not available on the host.",
          [{ label: "Signals", value: "nginx -T unavailable" }],
          "Install nginx or confirm that this host is expected to serve traffic through a different web stack."
        );
      }
      const lines = output.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      return normalizedResult(
        input2,
        "pass",
        "info",
        "Nginx upstream configuration hints were collected successfully.",
        [
          { label: "Upstream Count", value: String(lines.length) },
          { label: "Upstream Sample", value: lines.slice(0, 3).join(" | ") || "none" }
        ],
        "Review unexpected upstream targets, stale backends, or missing load-balancing intent before the next rollout."
      );
    }
    case "linux.nginx.log.risk": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if [ -f /var/log/nginx/error.log ]; then tail -n 20 /var/log/nginx/error.log | grep -Ei 'crit|error|emerg|alert|upstream|SSL|handshake' || echo clean; else echo clean; fi"`,
        input2.check.id
      );
      const evaluation = evaluateNginxLogRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.nginx.tls.posture": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v nginx >/dev/null 2>&1; then nginx -T 2>/dev/null | awk '/ssl_protocols|ssl_stapling|ssl_ciphers|listen 443/ {print}' | sed 's/listen 443/listen_443:present/; s/ssl_protocols/ssl_protocols:/; s/ssl_stapling/ssl_stapling:/; s/ssl_ciphers/ssl_ciphers:/' | head -n 20; else echo listen_443:missing; fi"`,
        input2.check.id
      );
      const evaluation = evaluateNginxTlsPosture(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.nginx.config.drift.hints": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if [ -d /etc/nginx ]; then find /etc/nginx -type f \\( -name '*.conf' -o -path '/etc/nginx/sites-*/*' \\) -mtime -7 -printf '%TY-%Tm-%Td %TH:%TM %p\\n' | sort -r | head -n 10; else echo clean; fi"`,
        input2.check.id
      );
      const evaluation = evaluateNginxConfigDriftHints(output || "clean");
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.nginx.tls.expiry": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v nginx >/dev/null 2>&1; then nginx -T 2>/dev/null | awk '/ssl_certificate / {print $2}' | head -n 5 | tr '\\n' ' '; else echo missing-nginx; fi"`,
        input2.check.id
      );
      if (output === "missing-nginx") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "nginx binary is not available on the host.",
          [{ label: "Inventory", value: "nginx -T unavailable" }],
          "Install nginx or confirm that this host is expected to serve traffic through a different web stack."
        );
      }
      return normalizedResult(
        input2,
        "warning",
        "warning",
        "nginx TLS certificate expiry should be reviewed.",
        [{ label: "Certificate Inventory", value: output || "no ssl_certificate directives found" }],
        "Review certificate expiry dates and renew certificates before they reach the warning window."
      );
    }
    case "linux.mysql.process": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "pgrep -x mysqld >/dev/null || pgrep -x mariadbd >/dev/null && echo running || echo stopped"',
        input2.check.id
      );
      if (output === "running") {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "mysql or mariadb process is running.",
          [{ label: "Process", value: "mysqld or mariadbd" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "mysql or mariadb process is not running.",
        [{ label: "Process", value: "mysqld or mariadbd" }],
        "Start the database service and verify service-manager or container restart expectations."
      );
    }
    case "linux.mysql.port.3306": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :3306 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:3306$/ {count++} END {print count+0}'; else echo unsupported; fi"`,
        input2.check.id
      );
      if (output === "unsupported") {
        return normalizedResult(
          input2,
          "unknown",
          "warning",
          "MySQL listener state could not be collected because ss/netstat is unavailable.",
          [{ label: "Collector", value: "missing ss/netstat" }],
          "Install iproute2 or net-tools to allow listener inspection."
        );
      }
      const listeners = Number.parseInt(output, 10);
      if (Number.isNaN(listeners)) {
        throw new Error(`Unable to parse MySQL listener output: ${output}`);
      }
      if (listeners > 0) {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "Port 3306 is listening.",
          [{ label: "Port", value: "3306/tcp" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "Port 3306 is not listening.",
        [{ label: "Port", value: "3306/tcp" }],
        "Verify database bind-address, service state, and whether MySQL is expected to accept TCP connections on this host."
      );
    }
    case "linux.mysql.runtime.info": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"select @@version, @@version_comment, @@datadir, @@read_only, @@innodb_buffer_pool_size;\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const parts = output.split("	");
      if (parts.length < 5) {
        throw new Error(`Unexpected MySQL runtime output: ${output}`);
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        "MySQL runtime configuration was collected successfully.",
        [
          { label: "Version", value: parts[0] },
          { label: "Distribution", value: parts[1] },
          { label: "Data Directory", value: parts[2] },
          { label: "read_only", value: parts[3] },
          { label: "InnoDB Buffer Pool", value: `${parts[4]} bytes` }
        ],
        "Review role and write-path expectations if read-only posture or data-directory placement differs from the intended database role."
      );
    }
    case "linux.mysql.schema.inventory": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"select count(*), coalesce(group_concat(schema_name order by schema_name separator ', '), '') from information_schema.schemata where schema_name not in ('information_schema','mysql','performance_schema','sys');\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const parts = output.split("	");
      if (parts.length < 2) {
        throw new Error(`Unexpected MySQL schema inventory output: ${output}`);
      }
      const count = Number.parseInt(parts[0], 10);
      if (Number.isNaN(count)) {
        throw new Error(`Unable to parse MySQL schema count: ${output}`);
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        count === 0 ? "No non-system MySQL schemas were found." : `Collected inventory for ${count} non-system MySQL schema(s).`,
        [
          { label: "Schema Count", value: String(count) },
          { label: "Sample Schemas", value: parts[1] || "none" }
        ],
        "Review unexpected schema growth, missing tenant schemas, or leftover temporary databases before the next maintenance window."
      );
    }
    case "linux.mysql.connection.pressure": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"show global status like 'Threads_connected'; show global status like 'Threads_running'; show global status like 'Max_used_connections'; show variables like 'max_connections';\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const evaluation = evaluateMysqlConnectionPressure(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.mysql.replication.hints": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"show variables like 'read_only'; show variables like 'super_read_only'; show replica status\\\\G; show slave status\\\\G;\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const evaluation = evaluateMysqlReplicationHints(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.mysql.slow-query.risk": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"show variables like 'slow_query_log'; show variables like 'long_query_time'; show variables like 'log_output'; show global status like 'Slow_queries';\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const evaluation = evaluateMysqlSlowQueryRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.mysql.temp-disk-table.risk": {
      const output = await mysqlShellOutput(
        input2.asset,
        `client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\"show global status like 'Created_tmp_tables'; show global status like 'Created_tmp_disk_tables'; show variables like 'tmp_table_size'; show variables like 'max_heap_table_size';\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' "$output"; exit 0; fi; printf '%s\\n' "$output"`,
        input2.check.id
      );
      const evaluation = evaluateMysqlTempDiskTableRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.redis.process": {
      const output = await sshOutput(
        input2.asset,
        'sh -lc "pgrep -x redis-server >/dev/null && echo running || echo stopped"',
        input2.check.id
      );
      if (output === "running") {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "redis-server is running.",
          [{ label: "Process", value: "redis-server" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "redis-server is not running.",
        [{ label: "Process", value: "redis-server" }],
        "Start Redis and verify service-manager or container restart expectations before dependent applications reconnect."
      );
    }
    case "linux.redis.port.6379": {
      const output = await sshOutput(
        input2.asset,
        `sh -lc "if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :6379 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:6379$/ {count++} END {print count+0}'; else echo unsupported; fi"`,
        input2.check.id
      );
      if (output === "unsupported") {
        return normalizedResult(
          input2,
          "unknown",
          "warning",
          "Redis listener state could not be collected because ss/netstat is unavailable.",
          [{ label: "Collector", value: "missing ss/netstat" }],
          "Install iproute2 or net-tools to allow listener inspection."
        );
      }
      const listeners = Number.parseInt(output, 10);
      if (Number.isNaN(listeners)) {
        throw new Error(`Unable to parse Redis listener output: ${output}`);
      }
      if (listeners > 0) {
        return normalizedResult(
          input2,
          "pass",
          "info",
          "Port 6379 is listening.",
          [{ label: "Port", value: "6379/tcp" }],
          "No action required."
        );
      }
      return normalizedResult(
        input2,
        "critical",
        "critical",
        "Port 6379 is not listening.",
        [{ label: "Port", value: "6379/tcp" }],
        "Verify bind configuration, protected-mode expectations, and whether Redis should accept TCP traffic on this host."
      );
    }
    case "linux.redis.runtime.info": {
      const output = await redisInfoOutput(input2.asset, "server persistence", input2.check.id);
      const info = parseRedisInfo(output);
      const evidence = [
        { label: "redis_version", value: info.get("redis_version") ?? "unknown" },
        { label: "tcp_port", value: info.get("tcp_port") ?? "unknown" },
        { label: "uptime_in_days", value: info.get("uptime_in_days") ?? "unknown" },
        { label: "loading", value: info.get("loading") ?? "unknown" },
        { label: "aof_enabled", value: info.get("aof_enabled") ?? "unknown" },
        { label: "rdb_last_bgsave_status", value: info.get("rdb_last_bgsave_status") ?? "unknown" }
      ];
      return normalizedResult(
        input2,
        "pass",
        "info",
        "Redis runtime configuration was collected successfully.",
        evidence,
        "Review runtime identity, port, and persistence posture if this host is expected to serve a different Redis role."
      );
    }
    case "linux.redis.replication.info": {
      const output = await redisInfoOutput(input2.asset, "replication", input2.check.id);
      const info = parseRedisInfo(output);
      const role = info.get("role") ?? "unknown";
      const masterLinkStatus = info.get("master_link_status") ?? "not-reported";
      const connectedSlaves = info.get("connected_slaves") ?? "0";
      const masterHost = info.get("master_host") ?? "standalone-or-primary";
      const evidence = [
        { label: "role", value: role },
        { label: "connected_slaves", value: connectedSlaves },
        { label: "master_host", value: masterHost },
        { label: "master_link_status", value: masterLinkStatus }
      ];
      if (role === "slave" && masterLinkStatus !== "up") {
        return normalizedResult(
          input2,
          "critical",
          "critical",
          "Redis replica link is degraded.",
          evidence,
          "Inspect upstream reachability, auth configuration, and replication backlog state before relying on this replica."
        );
      }
      return normalizedResult(
        input2,
        "pass",
        "info",
        "Redis replication metadata was collected successfully.",
        evidence,
        "Review unexpected replica wiring or degraded master link state before the next maintenance window."
      );
    }
    case "linux.redis.memory.pressure": {
      const output = await redisInfoOutput(input2.asset, "memory", input2.check.id);
      const evaluation = evaluateRedisMemoryPressure(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.redis.persistence.risk": {
      const output = await redisInfoOutput(input2.asset, "persistence", input2.check.id);
      const evaluation = evaluateRedisPersistenceRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.redis.blocking.risk": {
      const output = await redisInfoOutput(input2.asset, "stats persistence", input2.check.id);
      const evaluation = evaluateRedisBlockingRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    case "linux.redis.eviction.risk": {
      const output = await redisInfoOutput(input2.asset, "stats clients", input2.check.id);
      const evaluation = evaluateRedisEvictionRisk(output);
      return normalizedResult(
        input2,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation
      );
    }
    default:
      return normalizedResult(
        input2,
        "unknown",
        "warning",
        `Check ${input2.check.id} is not implemented in the local-service SSH runner yet.`,
        [{ label: "Check", value: input2.check.id }],
        "Implement the missing SSH command mapping for this check."
      );
  }
}
var LocalServicePreviewAdapter = class {
  async testConnection(asset) {
    return {
      ok: true,
      message: `Local service preview accepted ${asset.host}:${asset.port} for orchestration.`
    };
  }
};
var LocalServiceSshRunnerAdapter = class {
  async testConnection(asset) {
    try {
      validateSshAsset(asset);
      const output = await runSshCommand(asset, "exit");
      return {
        ok: output.ok,
        message: output.ok ? `SSH connectivity to ${asset.host}:${asset.port} succeeded.` : output.stderr || `SSH connectivity to ${asset.host}:${asset.port} failed.`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH connectivity test failed.";
      return {
        ok: false,
        message
      };
    }
  }
  async executeCheck(asset, check) {
    try {
      return await executeLinuxCheck({ asset, check });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check execution failed.";
      return {
        checkId: check.id,
        title: check.title,
        status: "unknown",
        severity: "warning",
        summary: message,
        evidence: [{ label: "Execution", value: "Failed before result normalization" }],
        remediation: "Verify SSH connectivity, command availability, and host permissions."
      };
    }
  }
};

// src/inspection.ts
function resolveTemplate(templateId) {
  const definition = (templateId ? findBuiltInTemplateDefinition(templateId) : void 0) ?? builtInInspectionTemplateDefinitions[0];
  return createInspectionTemplate(definition);
}
function createInspectionTaskWithTrigger(asset, taskId, templateId, trigger) {
  return {
    id: taskId,
    assetId: asset.id,
    templateId,
    trigger,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createTaskId(prefix) {
  return `${prefix}-${Date.now()}`;
}
async function buildRun(asset, taskId, templateId, adapter, trigger = "manual") {
  const template = resolveTemplate(templateId);
  const task = createInspectionTaskWithTrigger(asset, taskId, template.id, trigger);
  return runInspection(
    {
      asset,
      task,
      template,
      checks: resolveTemplateChecks(template.id)
    },
    adapter
  );
}
async function buildInspectionPreview(request) {
  return {
    ok: true,
    run: await buildRun(
      request.asset,
      createTaskId("task-local-service-preview"),
      request.templateId,
      new LocalServicePreviewAdapter()
    ),
    source: "local-service"
  };
}
async function buildInspectionExecution(request, storage2) {
  const run = await buildRun(
    request.asset,
    request.taskId ?? createTaskId("task-local-service-run"),
    request.templateId,
    new LocalServiceSshRunnerAdapter(),
    request.trigger ?? "manual"
  );
  await storage2.inspectionRuns.save(run);
  return {
    ok: true,
    run,
    source: "local-service"
  };
}
async function readInspectionHistory(storage2, request = {}) {
  const limit = request.limit ?? 20;
  const candidateRuns = await storage2.inspectionRuns.listRecent(Math.max(limit, 200));
  const filteredRuns = candidateRuns.filter((run) => {
    if (request.assetId && run.assetId !== request.assetId) {
      return false;
    }
    if (request.dateFrom && run.createdAt < request.dateFrom) {
      return false;
    }
    if (request.dateTo && run.createdAt > request.dateTo) {
      return false;
    }
    return true;
  });
  return {
    ok: true,
    runs: filteredRuns.slice(0, limit),
    source: "local-service"
  };
}

// src/migration.ts
import { hostname } from "node:os";
function maskAsset(asset) {
  return {
    ...asset,
    credential: {
      method: asset.credential.method,
      username: asset.credential.username,
      bindingStatus: "rebind-required"
    }
  };
}
function rebindAsset(asset) {
  return {
    ...asset,
    credential: {
      method: asset.credential.method,
      username: asset.credential.username,
      secretRef: "",
      bindingStatus: "rebind-required"
    }
  };
}
function maskSettings(settings) {
  return {
    ...settings,
    activeAsset: settings.activeAsset ? maskAsset(settings.activeAsset) : void 0
  };
}
function rebindSettings(settings) {
  return {
    ...settings,
    activeAsset: settings.activeAsset ? rebindAsset(settings.activeAsset) : void 0
  };
}
async function exportLocalConfig(storage2, scheduleStore2, desktopSettingsStore2, config2) {
  const [assets, templates, schedules, desktop] = await Promise.all([
    storage2.assets.list(),
    storage2.templates.list(),
    scheduleStore2.list(),
    desktopSettingsStore2.get()
  ]);
  const exportedTemplates = templates.length > 0 ? templates : builtInInspectionTemplateDefinitions.map((definition) => createInspectionTemplate(definition));
  const portableSchedules = schedules.map((schedule) => ({
    id: schedule.id,
    assetId: schedule.asset.id,
    templateId: schedule.templateId,
    intervalMinutes: schedule.intervalMinutes,
    enabled: schedule.enabled,
    nextRunAt: schedule.nextRunAt,
    lastRunAt: schedule.lastRunAt,
    lastRunStatus: schedule.lastRunStatus,
    lastError: schedule.lastError,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  }));
  return {
    ok: true,
    package: {
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      origin: {
        machineName: hostname(),
        exportedFromRoot: config2.paths.rootDir
      },
      assets: assets.map(maskAsset),
      templates: exportedTemplates,
      schedules: portableSchedules,
      settings: {
        postgresPort: config2.postgres.port,
        desktop: maskSettings(desktop)
      }
    },
    source: "local-service"
  };
}
function buildImportedSchedule(schedule, assetsById) {
  const asset = assetsById.get(schedule.assetId);
  if (!asset) {
    return null;
  }
  return {
    id: schedule.id,
    asset,
    templateId: schedule.templateId ?? builtInInspectionTemplateDefinitions[0].id,
    intervalMinutes: schedule.intervalMinutes,
    enabled: asset.credential.bindingStatus === "linked" ? schedule.enabled : false,
    nextRunAt: schedule.nextRunAt,
    lastRunAt: schedule.lastRunAt,
    lastRunStatus: schedule.lastRunStatus,
    lastError: asset.credential.bindingStatus === "linked" ? schedule.lastError : "Credential verification is required before this schedule can resume.",
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  };
}
async function importLocalConfig(request, storage2, scheduleStore2, desktopSettingsStore2) {
  const assets = request.package.assets.map(rebindAsset);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  for (const asset of assets) {
    await storage2.assets.upsert(asset);
  }
  for (const template of request.package.templates) {
    await storage2.templates.upsert(template);
  }
  let importedSchedules = 0;
  let disabledSchedules = 0;
  for (const schedule of request.package.schedules) {
    const importedSchedule = buildImportedSchedule(schedule, assetsById);
    if (!importedSchedule) {
      continue;
    }
    await scheduleStore2.saveImported(importedSchedule);
    importedSchedules += 1;
    if (!importedSchedule.enabled) {
      disabledSchedules += 1;
    }
  }
  if (request.package.settings.desktop) {
    await desktopSettingsStore2.upsert({
      settings: rebindSettings(request.package.settings.desktop)
    });
  }
  return {
    ok: true,
    importedAssets: assets.length,
    importedTemplates: request.package.templates.length,
    importedSchedules,
    requiresCredentialRebind: assets.filter((asset) => asset.credential.bindingStatus === "rebind-required").length,
    disabledSchedules,
    recommendedNextSteps: [
      "Rebind each imported asset with a machine-local password or key path.",
      "Run a successful SSH test for every imported asset before trusting recurring schedules.",
      "Review disabled schedules and resume them only after credential verification succeeds."
    ],
    importedFrom: {
      machineName: request.package.origin?.machineName ?? "unknown-machine",
      exportedAt: request.package.exportedAt
    },
    source: "local-service"
  };
}

// src/report.ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// ../../packages/report/src/index.ts
var SEVERITY_ORDER = ["critical", "warning", "info"];
function emptyStatusSummary() {
  return {
    pass: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
    total: 0
  };
}
function emptySeveritySummary() {
  return {
    info: 0,
    warning: 0,
    critical: 0,
    total: 0
  };
}
function summarizeStatuses(results) {
  return results.reduce((summary, result) => {
    summary[result.status] += 1;
    summary.total += 1;
    return summary;
  }, emptyStatusSummary());
}
function summarizeSeverities(results) {
  return results.reduce((summary, result) => {
    summary[result.severity] += 1;
    summary.total += 1;
    return summary;
  }, emptySeveritySummary());
}
function addStatusSummary(target, source) {
  target.pass += source.pass;
  target.warning += source.warning;
  target.critical += source.critical;
  target.unknown += source.unknown;
  target.total += source.total;
}
function addSeveritySummary(target, source) {
  target.info += source.info;
  target.warning += source.warning;
  target.critical += source.critical;
  target.total += source.total;
}
function buildAssetMap(assets = []) {
  return new Map(
    assets.map((asset) => [
      asset.id,
      {
        id: asset.id,
        name: asset.name,
        host: asset.host
      }
    ])
  );
}
function resolveTemplateSnapshot(run) {
  const template = findBuiltInTemplateDefinition(run.templateId);
  return {
    id: run.templateId,
    name: template?.name ?? run.templateId,
    description: template?.description ?? "Template metadata is unavailable for this run."
  };
}
function toReportCheckView(run, asset, template, result) {
  const actionFocus = deriveActionFocus(result);
  const evidenceHighlight = deriveEvidenceHighlight(result);
  return {
    assetId: run.assetId,
    assetName: asset.name,
    host: asset.host,
    templateId: template.id,
    templateName: template.name,
    templateDescription: template.description,
    runId: run.id,
    runStatus: run.status,
    collectedAt: run.createdAt,
    checkId: result.checkId,
    title: result.title,
    status: result.status,
    severity: result.severity,
    summary: result.summary,
    evidence: result.evidence,
    evidenceHighlight,
    remediation: result.remediation,
    actionFocus
  };
}
function deriveActionFocus(result) {
  const firstSentence = result.remediation.split(/[.;]/)[0]?.trim();
  if (result.checkId === "linux.kubelet.health.summary") {
    return "Inspect kubelet state, restart growth, and recent failures first.";
  }
  if (result.checkId === "linux.kubernetes.node.pressure") {
    return "Check eviction hints and filesystem or memory pressure first.";
  }
  if (result.checkId === "linux.kubernetes.static-pod.inventory") {
    return "Confirm critical static pod manifests and control-plane containers first.";
  }
  if (result.checkId === "linux.kubernetes.node.summary") {
    return "Verify runtime endpoint and unexpected pod-count drift first.";
  }
  if (firstSentence && firstSentence.length > 0) {
    return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
  }
  return "Review the finding and confirm the next operator action.";
}
function deriveEvidenceHighlight(result) {
  if (result.evidence.length === 0) {
    return "No evidence recorded.";
  }
  return result.evidence.slice(0, 2).map((item) => `${item.label}: ${item.value}`).join(" | ");
}
function checkKey(check) {
  return `${check.runId}:${check.checkId}:${check.collectedAt}`;
}
function severityRank(severity) {
  return SEVERITY_ORDER.indexOf(severity);
}
function highestSeverity(checks) {
  return checks.reduce((highest, check) => {
    return severityRank(check.severity) < severityRank(highest) ? check.severity : highest;
  }, "info");
}
function latestCollectedAt(checks) {
  return checks.reduce((latest, check) => {
    return check.collectedAt > latest ? check.collectedAt : latest;
  }, checks[0]?.collectedAt ?? "");
}
function uniqueStrings(values, limit) {
  const deduped = Array.from(new Set(values.filter((value) => value.trim().length > 0)));
  return typeof limit === "number" ? deduped.slice(0, limit) : deduped;
}
function labelForService(service) {
  switch (service) {
    case "nginx":
      return "Nginx edge service";
    case "mysql":
      return "MySQL service";
    case "redis":
      return "Redis service";
    case "docker":
      return "Docker runtime";
    case "kubernetes":
      return "Kubernetes node";
    default:
      return "host";
  }
}
function labelForConcern(concern) {
  switch (concern) {
    case "capacity":
      return "capacity";
    case "storage":
      return "storage and log";
    case "availability":
      return "availability";
    case "configuration":
      return "configuration";
    case "tls":
      return "TLS";
    case "runtime":
      return "runtime";
    case "pressure":
      return "pressure";
    default:
      return "operational";
  }
}
function classifyCheck(check) {
  if (check.checkId === "linux.cpu.usage" || check.checkId === "linux.memory.usage" || check.checkId === "linux.load.average") {
    return { layer: "host", service: "host", concern: "capacity" };
  }
  if (check.checkId === "linux.disk.usage" || check.checkId === "linux.log.usage") {
    return { layer: "host", service: "host", concern: "storage" };
  }
  if (check.checkId === "linux.time.sync") {
    return { layer: "host", service: "host", concern: "availability" };
  }
  if (check.checkId.startsWith("linux.nginx.")) {
    if (check.checkId === "linux.nginx.process") {
      return { layer: "service", service: "nginx", concern: "availability" };
    }
    if (check.checkId === "linux.nginx.log.risk") {
      return { layer: "service", service: "nginx", concern: "storage" };
    }
    if (check.checkId === "linux.nginx.tls.expiry" || check.checkId === "linux.nginx.tls.posture") {
      return { layer: "service", service: "nginx", concern: "tls" };
    }
    return { layer: "service", service: "nginx", concern: "configuration" };
  }
  if (check.checkId.startsWith("linux.mysql.")) {
    if (check.checkId === "linux.mysql.process" || check.checkId === "linux.mysql.port.3306") {
      return { layer: "service", service: "mysql", concern: "availability" };
    }
    if (check.checkId === "linux.mysql.temp-disk-table.risk") {
      return { layer: "service", service: "mysql", concern: "storage" };
    }
    if (check.checkId === "linux.mysql.connection.pressure" || check.checkId === "linux.mysql.slow-query.risk") {
      return { layer: "service", service: "mysql", concern: "capacity" };
    }
    return { layer: "service", service: "mysql", concern: "runtime" };
  }
  if (check.checkId.startsWith("linux.redis.")) {
    if (check.checkId === "linux.redis.process" || check.checkId === "linux.redis.port.6379") {
      return { layer: "service", service: "redis", concern: "availability" };
    }
    if (check.checkId === "linux.redis.persistence.risk") {
      return { layer: "service", service: "redis", concern: "storage" };
    }
    return { layer: "service", service: "redis", concern: "capacity" };
  }
  if (check.checkId.startsWith("linux.docker.")) {
    return { layer: "service", service: "docker", concern: "runtime" };
  }
  if (check.checkId === "linux.kubelet.health.summary" || check.checkId === "linux.kubernetes.static-pod.inventory") {
    return { layer: "service", service: "kubernetes", concern: "availability" };
  }
  if (check.checkId === "linux.kubernetes.node.pressure") {
    return { layer: "service", service: "kubernetes", concern: "pressure" };
  }
  if (check.checkId.startsWith("linux.kubelet.") || check.checkId.startsWith("linux.kubernetes.")) {
    return { layer: "service", service: "kubernetes", concern: "runtime" };
  }
  return { layer: "host", service: "host", concern: "general" };
}
function combineActionFocus(checks) {
  const focuses = uniqueStrings(checks.map((check) => check.actionFocus), 2);
  return focuses.join(" Then ");
}
function combineRemediation(checks) {
  const actions = uniqueStrings(checks.map((check) => check.remediation), 2);
  return actions.join(" Then ");
}
function formatConcernPhrase(concern) {
  switch (concern) {
    case "capacity":
      return "capacity pressure";
    case "storage":
      return "storage pressure";
    case "availability":
      return "availability risk";
    case "configuration":
      return "configuration drift";
    case "tls":
      return "TLS risk";
    case "runtime":
      return "runtime drift";
    case "pressure":
      return "node pressure";
    default:
      return "operational risk";
  }
}
function priorityConcernWeight(concern) {
  switch (concern) {
    case "availability":
      return 20;
    case "tls":
      return 18;
    case "pressure":
      return 16;
    case "storage":
      return 14;
    case "capacity":
      return 12;
    case "configuration":
      return 8;
    case "runtime":
      return 6;
    default:
      return 4;
  }
}
function computePriorityScore(checks, correlationKind, concern) {
  const severity = highestSeverity(checks);
  const severityScore = severity === "critical" ? 100 : severity === "warning" ? 60 : 0;
  const correlationScore = correlationKind === "host-service" ? 28 : correlationKind === "service-cluster" ? 18 : correlationKind === "host-cluster" ? 12 : 0;
  const relatedScore = Math.min(checks.length, 4) * 5;
  return severityScore + correlationScore + relatedScore + priorityConcernWeight(concern);
}
function deriveUrgencyLabel(priorityScore) {
  if (priorityScore >= 110) {
    return "immediate";
  }
  if (priorityScore >= 75) {
    return "next-window";
  }
  return "planned";
}
function buildPriorityActionView(checks, correlationKind) {
  const first = checks[0];
  const metadata = checks.map((check) => ({ check, meta: classifyCheck(check) }));
  const services = uniqueStrings(
    metadata.map(({ meta }) => meta.service).filter((service) => service !== "host").map((service) => labelForService(service))
  );
  const concerns = uniqueStrings(metadata.map(({ meta }) => labelForConcern(meta.concern)));
  const hostSignalCount = metadata.filter(({ meta }) => meta.layer === "host").length;
  const serviceSignalCount = metadata.filter(({ meta }) => meta.layer === "service").length;
  const serviceLabel = services[0] ?? "service";
  const concernLabel = concerns[0] ?? "operational";
  const dominantConcern = metadata[0]?.meta.concern ?? "general";
  const concernPhrase = formatConcernPhrase(dominantConcern);
  const priorityScore = computePriorityScore(checks, correlationKind, dominantConcern);
  const urgencyLabel = deriveUrgencyLabel(priorityScore);
  let title = first.title;
  let summary = first.summary;
  let rationale = checks.length > 1 ? `${checks.length} related signals are pointing at the same underlying problem.` : "A direct abnormal finding needs follow-up.";
  if (correlationKind === "host-service") {
    title = `Stabilize ${serviceLabel} by addressing host ${concernPhrase}`;
    summary = `${hostSignalCount} host signal(s) and ${serviceSignalCount} ${serviceLabel} signal(s) suggest the service is being affected by the same host-side ${concernLabel} issue.`;
    rationale = `Cross-layer evidence links host ${concernLabel} findings to active ${serviceLabel} symptoms, so this should be treated as one repair track.`;
  } else if (correlationKind === "service-cluster") {
    title = `Handle related ${serviceLabel} ${concernPhrase} together`;
    summary = `${serviceSignalCount} related ${serviceLabel} finding(s) should be worked as one queue item instead of isolated follow-ups.`;
    rationale = `Multiple service-side findings point to the same ${concernLabel} theme, so separate remediation would duplicate work.`;
  } else if (correlationKind === "host-cluster") {
    title = `Resolve shared host ${concernPhrase}`;
    summary = `${hostSignalCount} host-level finding(s) indicate one shared ${concernLabel} problem that should be handled together.`;
    rationale = `The affected checks are all host-side, so one host remediation pass should clear several findings at once.`;
  } else {
    title = `Direct action: ${first.title}`;
    summary = first.summary;
    rationale = first.severity === "critical" ? "This is a standalone critical finding, so it stays in the queue even without correlated host or service evidence." : "This finding does not yet cluster with other checks, but it still needs direct follow-up.";
  }
  return {
    assetId: first.assetId,
    assetName: first.assetName,
    host: first.host,
    severity: highestSeverity(checks),
    correlationKind,
    priorityRank: 0,
    priorityScore,
    urgencyLabel,
    title,
    summary,
    rationale,
    actionFocus: combineActionFocus(checks),
    remediation: combineRemediation(checks),
    relatedCheckCount: checks.length,
    relatedCheckTitles: checks.map((check) => check.title),
    evidenceHighlights: uniqueStrings(checks.map((check) => check.evidenceHighlight), 3),
    latestCollectedAt: latestCollectedAt(checks)
  };
}
function buildPriorityActions(checks) {
  const abnormalChecks = checks.filter((check) => check.severity !== "info").sort((left, right) => {
    const severityDelta = severityRank(left.severity) - severityRank(right.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return right.collectedAt.localeCompare(left.collectedAt);
  });
  const byAsset = /* @__PURE__ */ new Map();
  const consumed = /* @__PURE__ */ new Set();
  const actions = [];
  for (const check of abnormalChecks) {
    const existing = byAsset.get(check.assetId) ?? [];
    existing.push(check);
    byAsset.set(check.assetId, existing);
  }
  for (const assetChecks of byAsset.values()) {
    const metadata = assetChecks.map((check) => ({ check, meta: classifyCheck(check) }));
    const hostChecks = metadata.filter(({ meta }) => meta.layer === "host");
    const serviceChecks = metadata.filter(({ meta }) => meta.layer === "service");
    const services = uniqueStrings(serviceChecks.map(({ meta }) => meta.service));
    for (const service of services) {
      const serviceMetadata = serviceChecks.filter(({ meta }) => meta.service === service);
      const concerns = uniqueStrings(serviceMetadata.map(({ meta }) => meta.concern));
      for (const concern of concerns) {
        const hostMatches = hostChecks.filter(({ meta }) => meta.concern === concern).map(({ check }) => check).filter((check) => !consumed.has(checkKey(check)));
        const serviceMatches = serviceMetadata.filter(({ meta }) => meta.concern === concern).map(({ check }) => check).filter((check) => !consumed.has(checkKey(check)));
        if (hostMatches.length === 0 || serviceMatches.length === 0) {
          continue;
        }
        const grouped = hostMatches.concat(serviceMatches);
        actions.push(buildPriorityActionView(grouped, "host-service"));
        for (const check of grouped) {
          consumed.add(checkKey(check));
        }
      }
    }
    for (const service of services) {
      const remainingServiceChecks = serviceChecks.filter(({ meta }) => meta.service === service).map(({ check, meta }) => ({ check, concern: meta.concern })).filter(({ check }) => !consumed.has(checkKey(check)));
      const concerns = uniqueStrings(remainingServiceChecks.map(({ concern }) => concern));
      for (const concern of concerns) {
        const grouped = remainingServiceChecks.filter((item) => item.concern === concern).map((item) => item.check);
        if (grouped.length < 2) {
          continue;
        }
        actions.push(buildPriorityActionView(grouped, "service-cluster"));
        for (const check of grouped) {
          consumed.add(checkKey(check));
        }
      }
    }
    const remainingHostChecks = hostChecks.map(({ check, meta }) => ({ check, concern: meta.concern })).filter(({ check }) => !consumed.has(checkKey(check)));
    const hostConcerns = uniqueStrings(remainingHostChecks.map(({ concern }) => concern));
    for (const concern of hostConcerns) {
      const grouped = remainingHostChecks.filter((item) => item.concern === concern).map((item) => item.check);
      if (grouped.length < 2) {
        continue;
      }
      actions.push(buildPriorityActionView(grouped, "host-cluster"));
      for (const check of grouped) {
        consumed.add(checkKey(check));
      }
    }
  }
  for (const check of abnormalChecks) {
    if (consumed.has(checkKey(check))) {
      continue;
    }
    actions.push(buildPriorityActionView([check], "single"));
  }
  const correlationRank = {
    "host-service": 0,
    "service-cluster": 1,
    "host-cluster": 2,
    single: 3
  };
  const sortedActions = actions.sort((left, right) => {
    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }
    if (correlationRank[left.correlationKind] !== correlationRank[right.correlationKind]) {
      return correlationRank[left.correlationKind] - correlationRank[right.correlationKind];
    }
    if (right.relatedCheckCount !== left.relatedCheckCount) {
      return right.relatedCheckCount - left.relatedCheckCount;
    }
    return right.latestCollectedAt.localeCompare(left.latestCollectedAt);
  });
  return sortedActions.map((action, index) => ({
    ...action,
    priorityRank: index + 1
  }));
}
function buildRecurringActions(checks) {
  const recurringMap = /* @__PURE__ */ new Map();
  for (const check of checks) {
    if (check.severity === "info") {
      continue;
    }
    const key = `${check.assetId}:${check.checkId}:${check.actionFocus}`;
    const existing = recurringMap.get(key);
    if (!existing) {
      recurringMap.set(key, {
        assetId: check.assetId,
        assetName: check.assetName,
        host: check.host,
        checkId: check.checkId,
        title: check.title,
        severity: check.severity,
        occurrences: 1,
        latestCollectedAt: check.collectedAt,
        evidenceHighlight: check.evidenceHighlight,
        actionFocus: check.actionFocus,
        remediation: check.remediation
      });
      continue;
    }
    existing.occurrences += 1;
    if (check.collectedAt > existing.latestCollectedAt) {
      existing.latestCollectedAt = check.collectedAt;
      existing.evidenceHighlight = check.evidenceHighlight;
      existing.remediation = check.remediation;
      if (check.severity === "critical") {
        existing.severity = "critical";
      }
    }
  }
  return Array.from(recurringMap.values()).filter((item) => item.occurrences > 1).sort((left, right) => {
    if (right.occurrences !== left.occurrences) {
      return right.occurrences - left.occurrences;
    }
    const severityDelta = SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return right.latestCollectedAt.localeCompare(left.latestCollectedAt);
  });
}
function groupChecksBySeverity(checks) {
  return SEVERITY_ORDER.map((severity) => {
    const severityChecks = checks.filter((check) => check.severity === severity);
    return {
      severity,
      checks: severityChecks,
      summary: summarizeStatuses(severityChecks)
    };
  }).filter((group) => group.checks.length > 0);
}
function summarizeStatusesFromCheckViews(checks) {
  return checks.reduce((summary, check) => {
    summary[check.status] += 1;
    summary.total += 1;
    return summary;
  }, emptyStatusSummary());
}
function fallbackAsset(run) {
  return {
    id: run.assetId,
    name: run.assetId,
    host: "unknown-host"
  };
}
function buildInspectionReportView(input2) {
  const assetMap = buildAssetMap(input2.assets);
  const hostMap = /* @__PURE__ */ new Map();
  const allChecks = [];
  for (const run of input2.runs) {
    const asset = assetMap.get(run.assetId) ?? fallbackAsset(run);
    const template = resolveTemplateSnapshot(run);
    const runStatusSummary = summarizeStatuses(run.results);
    const runSeveritySummary = summarizeSeverities(run.results);
    const hostKey = asset.id;
    const hostChecks = run.results.map((result) => toReportCheckView(run, asset, template, result));
    allChecks.push(...hostChecks);
    const existingHost = hostMap.get(hostKey);
    if (!existingHost) {
      hostMap.set(hostKey, {
        assetId: asset.id,
        assetName: asset.name,
        host: asset.host,
        templateIds: [template.id],
        templateNames: [template.name],
        runs: [
          {
            runId: run.id,
            templateId: template.id,
            templateName: template.name,
            templateDescription: template.description,
            status: run.status,
            createdAt: run.createdAt,
            summary: runStatusSummary,
            severitySummary: runSeveritySummary
          }
        ],
        summary: runStatusSummary,
        severitySummary: runSeveritySummary,
        severityGroups: groupChecksBySeverity(hostChecks)
      });
      continue;
    }
    existingHost.runs.push({
      runId: run.id,
      templateId: template.id,
      templateName: template.name,
      templateDescription: template.description,
      status: run.status,
      createdAt: run.createdAt,
      summary: runStatusSummary,
      severitySummary: runSeveritySummary
    });
    if (!existingHost.templateIds.includes(template.id)) {
      existingHost.templateIds.push(template.id);
    }
    if (!existingHost.templateNames.includes(template.name)) {
      existingHost.templateNames.push(template.name);
    }
    addStatusSummary(existingHost.summary, runStatusSummary);
    addSeveritySummary(existingHost.severitySummary, runSeveritySummary);
    const mergedChecks = existingHost.severityGroups.flatMap((group) => group.checks).concat(hostChecks);
    existingHost.severityGroups = groupChecksBySeverity(mergedChecks);
  }
  const overallSummary = summarizeStatusesFromCheckViews(allChecks);
  const overallSeveritySummary = allChecks.reduce((summary, check) => {
    summary[check.severity] += 1;
    summary.total += 1;
    return summary;
  }, emptySeveritySummary());
  const hosts = Array.from(hostMap.values()).sort((left, right) => left.assetName.localeCompare(right.assetName));
  for (const host of hosts) {
    host.runs.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    hosts,
    overallSummary,
    overallSeveritySummary,
    severityGroups: groupChecksBySeverity(allChecks),
    recurringActions: buildRecurringActions(allChecks),
    priorityActions: buildPriorityActions(allChecks)
  };
}
function buildSingleRunReportView(run, asset) {
  return buildInspectionReportView({
    runs: [run],
    assets: asset ? [asset] : void 0
  });
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderStatusSummary(summary) {
  return `
    <ul class="summary-list">
      <li>Total <strong>${summary.total}</strong></li>
      <li>Pass <strong>${summary.pass}</strong></li>
      <li>Warning <strong>${summary.warning}</strong></li>
      <li>Critical <strong>${summary.critical}</strong></li>
      <li>Unknown <strong>${summary.unknown}</strong></li>
    </ul>
  `;
}
function renderEvidence(check) {
  if (check.evidence.length === 0) {
    return '<p class="helper">No evidence was recorded.</p>';
  }
  return `
    <ul class="evidence-list">
      ${check.evidence.map(
    (item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`
  ).join("")}
    </ul>
  `;
}
function renderSeveritySummary(summary) {
  return `
    <ul class="summary-list">
      <li>Critical <strong>${summary.critical}</strong></li>
      <li>Warning <strong>${summary.warning}</strong></li>
      <li>Info <strong>${summary.info}</strong></li>
      <li>Total <strong>${summary.total}</strong></li>
    </ul>
  `;
}
function highestRiskLabel(view) {
  if (view.overallSeveritySummary.critical > 0) {
    return "critical";
  }
  if (view.overallSeveritySummary.warning > 0) {
    return "warning";
  }
  return "stable";
}
function renderInspectionReportHtml(view, options = {}) {
  const title = options.title ?? "OpsProbe Inspection Report";
  const audience = options.audience ?? "operator";
  const abnormalChecks = view.severityGroups.filter((group) => group.severity !== "info").flatMap((group) => group.checks);
  const priorityActions = view.priorityActions.slice(0, 8);
  const recurringActions = view.recurringActions.slice(0, 8);
  const immediatePriorityActions = view.priorityActions.filter((action) => action.urgencyLabel === "immediate");
  const nextWindowPriorityActions = view.priorityActions.filter((action) => action.urgencyLabel === "next-window");
  const leadPriorityAction = view.priorityActions[0];
  const criticalChecks = abnormalChecks.filter((check) => check.severity === "critical");
  const warningChecks = abnormalChecks.filter((check) => check.severity === "warning");
  const managerHighlights = [
    criticalChecks.length > 0 ? `${criticalChecks.length} critical item(s) need immediate attention.` : "No critical items were detected.",
    immediatePriorityActions.length > 0 ? `${immediatePriorityActions.length} priority action(s) are marked immediate.` : "No priority actions are currently marked immediate.",
    nextWindowPriorityActions.length > 0 ? `${nextWindowPriorityActions.length} priority action(s) fit the next maintenance window.` : "No priority actions are currently queued for the next maintenance window.",
    warningChecks.length > 0 ? `${warningChecks.length} warning item(s) should be scheduled into the next maintenance window.` : "No warning items were detected.",
    `${view.hosts.length} host(s) are included in this inspection summary.`
  ];
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        color: #182028;
        background: #f6f4ee;
      }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(255, 201, 92, 0.28), transparent 30%),
          linear-gradient(135deg, #f8f4ea 0%, #ecf2f6 54%, #dde7ee 100%);
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 24px 72px;
      }
      h1, h2, h3 { margin: 0; }
      p { line-height: 1.7; }
      .hero, .panel, .check-card {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(24, 32, 40, 0.08);
        border-radius: 24px;
        box-shadow: 0 16px 44px rgba(51, 67, 84, 0.08);
      }
      .hero, .panel { padding: 24px; margin-top: 24px; }
      .eyebrow {
        margin-bottom: 10px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #8a4b17;
      }
      .summary-list, .evidence-list {
        margin: 12px 0 0;
        padding-left: 18px;
        line-height: 1.7;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .host-grid, .checks-grid {
        display: grid;
        gap: 16px;
        margin-top: 18px;
      }
      .host-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .checks-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .check-card {
        padding: 18px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .severity-critical, .status-critical {
        background: #ffd8d8;
        color: #8a1f1f;
      }
      .severity-warning, .status-warning {
        background: #fff0cc;
        color: #8a5b00;
      }
      .severity-info, .status-pass {
        background: #dcefdc;
        color: #2e6a34;
      }
      .status-unknown {
        background: #e2e7ed;
        color: #495663;
      }
      .urgency-immediate {
        background: #ffe1d6;
        color: #9a3412;
      }
      .urgency-next-window {
        background: #fff0cc;
        color: #8a5b00;
      }
      .urgency-planned {
        background: #dcefdc;
        color: #2e6a34;
      }
      .meta {
        color: #475463;
        font-size: 0.95rem;
      }
      .helper {
        color: #5a6673;
      }
      .spaced {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .host-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .run-list {
        margin-top: 14px;
        padding-left: 18px;
        line-height: 1.7;
      }
      @media (max-width: 720px) {
        main {
          padding: 24px 16px 56px;
        }
        .spaced, .host-header {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">OpsProbe Report</p>
        <div class="spaced">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="meta">Generated at ${escapeHtml(view.generatedAt)}</p>
          </div>
          <div class="pill status-pass">${view.hosts.length} host${view.hosts.length === 1 ? "" : "s"}</div>
        </div>
        ${renderStatusSummary(view.overallSummary)}
      </section>

      <section class="panel">
        <p class="eyebrow">Overview</p>
        <div class="grid">
          <div>
            <h3>Status Summary</h3>
            ${renderStatusSummary(view.overallSummary)}
          </div>
          <div>
            <h3>Severity Summary</h3>
            ${renderSeveritySummary(view.overallSeveritySummary)}
          </div>
        </div>
      </section>

      <section class="panel">
        <p class="eyebrow">${audience === "manager" ? "Executive Summary" : "Abnormal Items"}</p>
        ${audience === "manager" ? `<div class="grid">
                <article class="check-card">
                  <h3>Overall Risk</h3>
                  <p class="meta">Highest active severity</p>
                  <p><span class="pill severity-${highestRiskLabel(view) === "stable" ? "info" : highestRiskLabel(view)}">${escapeHtml(highestRiskLabel(view))}</span></p>
                  ${renderSeveritySummary(view.overallSeveritySummary)}
                </article>
                <article class="check-card">
                  <h3>Key Highlights</h3>
                  <ul class="summary-list">
                    ${managerHighlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </article>
                <article class="check-card">
                  <h3>Lead Queue Item</h3>
                  ${leadPriorityAction ? `<p class="meta">P${escapeHtml(leadPriorityAction.priorityRank.toString())} \xB7 ${escapeHtml(leadPriorityAction.urgencyLabel)}</p>
                        <p><strong>${escapeHtml(leadPriorityAction.title)}</strong></p>
                        <p>${escapeHtml(leadPriorityAction.summary)}</p>
                        <p><strong>Why now:</strong> ${escapeHtml(leadPriorityAction.rationale)}</p>` : '<p class="helper">No priority queue items are active for this report.</p>'}
                </article>
              </div>` : abnormalChecks.length > 0 ? `<div class="checks-grid">
                ${abnormalChecks.map(
    (check) => `
                  <article class="check-card">
                    <div class="spaced">
                    <div>
                      <h3>${escapeHtml(check.title)}</h3>
                        <p class="meta">${escapeHtml(check.assetName)} \xB7 ${escapeHtml(check.host)} \xB7 ${escapeHtml(check.templateName)}</p>
                      </div>
                      <span class="pill severity-${check.severity}">${escapeHtml(check.severity)}</span>
                    </div>
                    <p>${escapeHtml(check.summary)}</p>
                    <p><strong>Action focus:</strong> ${escapeHtml(check.actionFocus)}</p>
                    ${renderEvidence(check)}
                    <p><strong>Suggestion:</strong> ${escapeHtml(check.remediation)}</p>
                  </article>`
  ).join("")}
              </div>` : '<p class="helper">No abnormal items were found in this report.</p>'}
      </section>

      <section class="panel">
        <p class="eyebrow">${audience === "manager" ? "Asset Summary" : "Hosts"}</p>
        <div class="host-grid">
          ${view.hosts.map(
    (host) => `
            <article class="check-card">
              <div class="host-header">
                <div>
                  <h3>${escapeHtml(host.assetName)}</h3>
                  <p class="meta">${escapeHtml(host.assetId)} \xB7 ${escapeHtml(host.host)}</p>
                  <p class="meta">Templates: ${escapeHtml(host.templateNames.join(", "))}</p>
                </div>
                <span class="pill status-pass">${host.runs.length} run${host.runs.length === 1 ? "" : "s"}</span>
              </div>
              ${renderStatusSummary(host.summary)}
              <ul class="run-list">
                ${host.runs.map(
      (run) => `<li>${escapeHtml(run.createdAt)} \xB7 ${escapeHtml(run.runId)} \xB7 ${escapeHtml(run.templateName)} \xB7 ${escapeHtml(run.status)}</li>`
    ).join("")}
              </ul>
            </article>`
  ).join("")}
        </div>
      </section>

      <section class="panel">
        <p class="eyebrow">Recurring Actions</p>
        ${recurringActions.length > 0 ? `<div class="checks-grid">
              ${recurringActions.map(
    (item) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(item.title)}</h3>
                      <p class="meta">${escapeHtml(item.assetName)} \xB7 ${escapeHtml(item.host)}</p>
                    </div>
                    <span class="pill severity-${item.severity}">${item.occurrences}x</span>
                  </div>
                  <p><strong>Evidence signal:</strong> ${escapeHtml(item.evidenceHighlight)}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(item.actionFocus)}</p>
                  <p><strong>Suggested next step:</strong> ${escapeHtml(item.remediation)}</p>
                  <p class="meta">Last seen ${escapeHtml(item.latestCollectedAt)}</p>
                </article>`
  ).join("")}
            </div>` : '<p class="helper">No repeated abnormal actions were detected across the included runs.</p>'}
      </section>

      ${audience === "manager" ? `<section class="panel">
        <p class="eyebrow">Priority Actions</p>
        ${priorityActions.length > 0 ? `<div class="checks-grid">
              ${priorityActions.map(
    (action) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(action.title)}</h3>
                      <p class="meta">P${escapeHtml(action.priorityRank.toString())} \xB7 ${escapeHtml(action.assetName)} \xB7 ${escapeHtml(action.host)} \xB7 ${escapeHtml(action.relatedCheckCount.toString())} related signal(s)</p>
                    </div>
                    <div class="spaced">
                      <span class="pill severity-${action.severity}">${escapeHtml(action.severity)}</span>
                      <span class="pill urgency-${action.urgencyLabel}">${escapeHtml(action.urgencyLabel)}</span>
                    </div>
                  </div>
                  <p>${escapeHtml(action.summary)}</p>
                  <p><strong>Why now:</strong> ${escapeHtml(action.rationale)}</p>
                  <p><strong>Related checks:</strong> ${escapeHtml(action.relatedCheckTitles.join(", "))}</p>
                  <p><strong>Evidence signal:</strong> ${escapeHtml(action.evidenceHighlights.join(" | "))}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(action.actionFocus)}</p>
                  <p><strong>Suggested next step:</strong> ${escapeHtml(action.remediation)}</p>
                </article>`
  ).join("")}
            </div>` : '<p class="helper">No priority actions are required from this inspection run.</p>'}
      </section>` : `<section class="panel">
        <p class="eyebrow">Action Queue</p>
        ${priorityActions.length > 0 ? `<div class="checks-grid">
              ${priorityActions.map(
    (action) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(action.title)}</h3>
                      <p class="meta">P${escapeHtml(action.priorityRank.toString())} \xB7 ${escapeHtml(action.assetName)} \xB7 ${escapeHtml(action.host)} \xB7 ${escapeHtml(action.relatedCheckCount.toString())} related signal(s)</p>
                    </div>
                    <div class="spaced">
                      <span class="pill severity-${action.severity}">${escapeHtml(action.severity)}</span>
                      <span class="pill urgency-${action.urgencyLabel}">${escapeHtml(action.urgencyLabel)}</span>
                    </div>
                  </div>
                  <p>${escapeHtml(action.summary)}</p>
                  <p><strong>Why now:</strong> ${escapeHtml(action.rationale)}</p>
                  <p><strong>Related checks:</strong> ${escapeHtml(action.relatedCheckTitles.join(", "))}</p>
                  <p><strong>Evidence signal:</strong> ${escapeHtml(action.evidenceHighlights.join(" | "))}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(action.actionFocus)}</p>
                  <p><strong>Suggested next step:</strong> ${escapeHtml(action.remediation)}</p>
                </article>`
  ).join("")}
            </div>` : '<p class="helper">No operator action queue is required from this inspection run.</p>'}
      </section>
      <section class="panel">
        <p class="eyebrow">Detailed Results</p>
        ${view.severityGroups.map(
    (group) => `
          <section class="panel">
            <div class="spaced">
              <div>
                <h2>${escapeHtml(group.severity)} checks</h2>
                <p class="meta">${group.checks.length} item${group.checks.length === 1 ? "" : "s"}</p>
              </div>
              <span class="pill severity-${group.severity}">${escapeHtml(group.severity)}</span>
            </div>
            <div class="checks-grid">
              ${group.checks.map(
      (check) => `
                <article class="check-card">
                  <div class="spaced">
                    <div>
                      <h3>${escapeHtml(check.title)}</h3>
                      <p class="meta">${escapeHtml(check.assetName)} \xB7 ${escapeHtml(check.host)} \xB7 ${escapeHtml(check.templateName)} \xB7 ${escapeHtml(check.runId)}</p>
                    </div>
                    <span class="pill status-${check.status}">${escapeHtml(check.status)}</span>
                  </div>
                  <p>${escapeHtml(check.summary)}</p>
                  <p><strong>Evidence signal:</strong> ${escapeHtml(check.evidenceHighlight)}</p>
                  <p><strong>Action focus:</strong> ${escapeHtml(check.actionFocus)}</p>
                  ${renderEvidence(check)}
                  <p><strong>Suggestion:</strong> ${escapeHtml(check.remediation)}</p>
                </article>`
    ).join("")}
            </div>
          </section>`
  ).join("")}
      </section>`}
    </main>
  </body>
</html>`;
}

// src/report.ts
async function exportHtmlReport(request) {
  const view = buildSingleRunReportView(request.run, request.asset);
  const audience = request.audience ?? "operator";
  const title = request.asset ? `OpsProbe ${audience === "manager" ? "Summary" : "Report"} - ${request.asset.name}` : `OpsProbe ${audience === "manager" ? "Summary" : "Report"} - ${request.run.assetId}`;
  const html = renderInspectionReportHtml(view, { title, audience });
  await mkdir(dirname(request.path), { recursive: true });
  await writeFile(request.path, html, "utf8");
  return {
    ok: true,
    message: `Exported ${audience} HTML report to ${request.path}.`
  };
}

// src/scheduler.ts
import { mkdir as mkdir2, readFile } from "node:fs/promises";
var SCHEDULES_STATE_KEY = "inspection-schedules";
var CREDENTIAL_REVALIDATION_MESSAGE = "Credential verification is required before this schedule can resume.";
function emptyScheduleSnapshot() {
  return {
    schedules: []
  };
}
function normalizeSchedule(schedule) {
  return {
    ...schedule,
    templateId: schedule.templateId ?? builtInInspectionTemplateDefinitions[0].id
  };
}
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function createScheduleId() {
  return `schedule-${Date.now()}`;
}
function computeNextRunAt(intervalMinutes, from = /* @__PURE__ */ new Date()) {
  return new Date(from.getTime() + intervalMinutes * 6e4).toISOString();
}
function cloneAsset(asset) {
  return JSON.parse(JSON.stringify(asset));
}
function credentialReadyForSchedules(asset) {
  return asset.credential.bindingStatus === "linked" && asset.credential.secretRef.trim().length > 0;
}
var LocalScheduleStore = class {
  config;
  getStorage;
  constructor(config2, getStorage) {
    this.config = config2;
    this.getStorage = getStorage;
  }
  async list() {
    return (await this.readSnapshot()).schedules;
  }
  async listResponse() {
    return {
      ok: true,
      schedules: await this.list(),
      source: "local-service"
    };
  }
  async upsert(request) {
    const snapshot = await this.readSnapshot();
    const timestamp = nowIso2();
    const existing = request.id ? snapshot.schedules.find((item) => item.id === request.id) : void 0;
    const intervalMinutes = Math.max(5, Math.floor(request.intervalMinutes));
    const asset = await this.resolveLatestAsset(request.asset);
    const requestedEnabled = request.enabled ?? existing?.enabled ?? true;
    if (requestedEnabled && !credentialReadyForSchedules(asset)) {
      throw new Error(CREDENTIAL_REVALIDATION_MESSAGE);
    }
    const schedule = existing ? {
      ...existing,
      asset: cloneAsset(asset),
      templateId: request.templateId,
      intervalMinutes,
      enabled: request.enabled ?? existing.enabled,
      updatedAt: timestamp,
      nextRunAt: request.enabled === false ? existing.nextRunAt : existing.enabled || request.enabled !== false ? existing.nextRunAt : computeNextRunAt(intervalMinutes),
      lastError: request.enabled === true ? void 0 : existing.lastError,
      lastRunAt: existing.lastRunAt,
      lastRunStatus: existing.lastRunStatus
    } : {
      id: request.id ?? createScheduleId(),
      asset: cloneAsset(asset),
      templateId: request.templateId,
      intervalMinutes,
      enabled: request.enabled ?? true,
      nextRunAt: computeNextRunAt(intervalMinutes),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    if (existing) {
      snapshot.schedules = snapshot.schedules.map((item) => item.id === schedule.id ? schedule : item);
    } else {
      snapshot.schedules.push(schedule);
    }
    await this.writeSnapshot(snapshot);
    return {
      ok: true,
      schedule,
      source: "local-service"
    };
  }
  async delete(request) {
    const snapshot = await this.readSnapshot();
    snapshot.schedules = snapshot.schedules.filter((item) => item.id !== request.id);
    await this.writeSnapshot(snapshot);
  }
  async save(schedule) {
    const snapshot = await this.readSnapshot();
    snapshot.schedules = snapshot.schedules.map((item) => item.id === schedule.id ? schedule : item);
    await this.writeSnapshot(snapshot);
  }
  async saveImported(schedule) {
    const snapshot = await this.readSnapshot();
    const asset = await this.resolveLatestAsset(schedule.asset);
    const requiresVerification = !credentialReadyForSchedules(asset);
    const importedSchedule = {
      ...schedule,
      asset,
      enabled: requiresVerification ? false : schedule.enabled,
      lastError: requiresVerification ? CREDENTIAL_REVALIDATION_MESSAGE : schedule.lastError
    };
    const existing = snapshot.schedules.some((item) => item.id === schedule.id);
    snapshot.schedules = existing ? snapshot.schedules.map((item) => item.id === schedule.id ? importedSchedule : item) : [...snapshot.schedules, importedSchedule];
    await this.writeSnapshot(snapshot);
  }
  async summarizeFailures() {
    const schedules = await this.list();
    const failedSchedules = schedules.filter((item) => Boolean(item.lastError));
    return {
      total: schedules.length,
      failedSchedules,
      enabledSchedules: schedules.filter((item) => item.enabled).length,
      templateLabels: schedules.map((item) => findBuiltInTemplateDefinition(item.templateId)?.name ?? item.templateId).slice(0, 3)
    };
  }
  async readSnapshot() {
    const persisted = await this.getStorage().state.get(SCHEDULES_STATE_KEY);
    if (persisted) {
      return {
        schedules: (persisted.schedules ?? []).map(normalizeSchedule)
      };
    }
    const migrated = await this.readLegacySnapshot();
    if (migrated) {
      const normalized = {
        schedules: migrated.schedules.map(normalizeSchedule)
      };
      await this.getStorage().state.set(SCHEDULES_STATE_KEY, normalized);
      return normalized;
    }
    return emptyScheduleSnapshot();
  }
  async readLegacySnapshot() {
    await mkdir2(this.config.paths.configDir, { recursive: true });
    try {
      const raw = await readFile(this.config.paths.schedulesFile, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  async writeSnapshot(snapshot) {
    await this.getStorage().state.set(SCHEDULES_STATE_KEY, snapshot);
  }
  async resolveLatestAsset(asset) {
    const assets = await this.getStorage().assets.list();
    return assets.find((candidate) => candidate.id === asset.id) ?? asset;
  }
};
var LocalScheduler = class {
  runningScheduleIds = /* @__PURE__ */ new Set();
  store;
  storage;
  constructor(store, storage2) {
    this.store = store;
    this.storage = storage2;
  }
  async runDueSchedules() {
    const schedules = await this.store.list();
    const dueSchedules = schedules.filter(
      (schedule) => schedule.enabled && !this.runningScheduleIds.has(schedule.id) && new Date(schedule.nextRunAt).getTime() <= Date.now()
    );
    for (const schedule of dueSchedules) {
      this.runningScheduleIds.add(schedule.id);
      let latestAsset = schedule.asset;
      try {
        const assets = await this.storage.assets.list();
        latestAsset = assets.find((candidate) => candidate.id === schedule.asset.id) ?? schedule.asset;
        if (!credentialReadyForSchedules(latestAsset)) {
          await this.store.save({
            ...schedule,
            asset: latestAsset,
            enabled: false,
            lastRunAt: nowIso2(),
            lastRunStatus: "failed",
            lastError: CREDENTIAL_REVALIDATION_MESSAGE,
            updatedAt: nowIso2()
          });
          continue;
        }
        const response = await buildInspectionExecution(
          {
            asset: latestAsset,
            templateId: schedule.templateId,
            trigger: "scheduled",
            taskId: `task-schedule-${schedule.id}-${Date.now()}`
          },
          this.storage
        );
        await this.store.save({
          ...schedule,
          asset: latestAsset,
          nextRunAt: computeNextRunAt(schedule.intervalMinutes),
          lastRunAt: response.run.createdAt,
          lastRunStatus: response.run.status,
          lastError: response.run.status === "failed" ? "Scheduled run returned a failed status." : void 0,
          updatedAt: nowIso2()
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Scheduled run failed.";
        await this.store.save({
          ...schedule,
          asset: latestAsset,
          nextRunAt: computeNextRunAt(schedule.intervalMinutes),
          lastRunAt: nowIso2(),
          lastRunStatus: "failed",
          lastError: message,
          updatedAt: nowIso2()
        });
      } finally {
        this.runningScheduleIds.delete(schedule.id);
      }
    }
  }
};

// src/service-status.ts
import { readFile as readFile2, rename, writeFile as writeFile2 } from "node:fs/promises";
async function readPersistedServiceMode(statusFile) {
  try {
    const raw = await readFile2(statusFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed.snapshot?.status === "stopped" ? "stopped" : "starting";
  } catch {
    await quarantineMalformedStatusFile(statusFile);
    return "starting";
  }
}
async function quarantineMalformedStatusFile(statusFile) {
  try {
    const raw = await readFile2(statusFile, "utf8");
    const quarantinePath = `${statusFile}.corrupt-${Date.now()}`;
    try {
      await rename(statusFile, quarantinePath);
      await writeFile2(
        `${quarantinePath}.note.txt`,
        "OpsProbe quarantined a malformed local-service status snapshot during automatic recovery.\n",
        "utf8"
      );
    } catch {
      await writeFile2(quarantinePath, raw, "utf8");
    }
  } catch {
  }
}

// ../../packages/storage/src/index.ts
import { mkdir as mkdir3, readFile as readFile3, rename as rename2, writeFile as writeFile3 } from "node:fs/promises";
import { dirname as dirname2 } from "node:path";

// ../../node_modules/pg/esm/index.mjs
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;

// ../../packages/storage/src/index.ts
var EMPTY_FILE_STORAGE_SNAPSHOT = {
  assets: [],
  templates: [],
  inspectionRuns: [],
  state: {}
};
function serializeRun(run) {
  return JSON.stringify(run);
}
function deserializeRun(raw) {
  return JSON.parse(raw);
}
var PostgresStorageAdapter = class {
  pool;
  config;
  constructor(config2) {
    this.config = config2;
    this.pool = new Pool({
      database: config2.database,
      host: config2.host,
      port: config2.port,
      user: config2.user
    });
    this.pool.on("error", () => {
    });
  }
  assets = {
    list: async () => {
      const result = await this.pool.query(
        `
          select payload
          from opsprobe_assets
          order by updated_at desc
        `
      );
      return result.rows.map(
        (row) => typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload
      );
    },
    upsert: async (asset) => {
      await this.pool.query(
        `
          insert into opsprobe_assets (
            id,
            updated_at,
            payload
          )
          values ($1, $2, $3::jsonb)
          on conflict (id) do update set
            updated_at = excluded.updated_at,
            payload = excluded.payload
        `,
        [asset.id, asset.updatedAt, JSON.stringify(asset)]
      );
    }
  };
  templates = {
    list: async () => {
      const result = await this.pool.query(
        `
          select payload
          from opsprobe_templates
          order by updated_at desc
        `
      );
      return result.rows.map(
        (row) => typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload
      );
    },
    upsert: async (template) => {
      await this.pool.query(
        `
          insert into opsprobe_templates (
            id,
            updated_at,
            payload
          )
          values ($1, $2, $3::jsonb)
          on conflict (id) do update set
            updated_at = excluded.updated_at,
            payload = excluded.payload
        `,
        [template.id, template.updatedAt, JSON.stringify(template)]
      );
    }
  };
  inspectionRuns = {
    save: async (run) => {
      await this.pool.query(
        `
          insert into opsprobe_inspection_runs (
            id,
            task_id,
            asset_id,
            template_id,
            status,
            created_at,
            updated_at,
            payload
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          on conflict (id) do update set
            task_id = excluded.task_id,
            asset_id = excluded.asset_id,
            template_id = excluded.template_id,
            status = excluded.status,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            payload = excluded.payload
        `,
        [
          run.id,
          run.taskId,
          run.assetId,
          run.templateId,
          run.status,
          run.createdAt,
          run.updatedAt,
          serializeRun(run)
        ]
      );
    },
    listRecent: async (limit) => {
      const result = await this.pool.query(
        `
          select payload
          from opsprobe_inspection_runs
          order by created_at desc
          limit $1
        `,
        [limit]
      );
      return result.rows.map(
        (row) => typeof row.payload === "string" ? deserializeRun(row.payload) : row.payload
      );
    }
  };
  state = {
    get: async (key) => {
      const result = await this.pool.query(
        `
          select payload
          from opsprobe_state
          where key = $1
        `,
        [key]
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    },
    set: async (key, value) => {
      await this.pool.query(
        `
          insert into opsprobe_state (
            key,
            updated_at,
            payload
          )
          values ($1, now(), $2::jsonb)
          on conflict (key) do update set
            updated_at = excluded.updated_at,
            payload = excluded.payload
        `,
        [key, JSON.stringify(value)]
      );
    }
  };
  async bootstrap() {
    await this.pool.query(`
      create table if not exists opsprobe_assets (
        id text primary key,
        updated_at timestamptz not null,
        payload jsonb not null
      )
    `);
    await this.pool.query(`
      create table if not exists opsprobe_templates (
        id text primary key,
        updated_at timestamptz not null,
        payload jsonb not null
      )
    `);
    await this.pool.query(`
      create table if not exists opsprobe_inspection_runs (
        id text primary key,
        task_id text not null,
        asset_id text not null,
        template_id text not null,
        status text not null,
        created_at timestamptz not null,
        updated_at timestamptz not null,
        payload jsonb not null
      )
    `);
    await this.pool.query(`
      create table if not exists opsprobe_state (
        key text primary key,
        updated_at timestamptz not null,
        payload jsonb not null
      )
    `);
    await this.pool.query(`
      create index if not exists idx_opsprobe_assets_updated_at
      on opsprobe_assets (updated_at desc)
    `);
    await this.pool.query(`
      create index if not exists idx_opsprobe_templates_updated_at
      on opsprobe_templates (updated_at desc)
    `);
    await this.pool.query(`
      create index if not exists idx_opsprobe_inspection_runs_created_at
      on opsprobe_inspection_runs (created_at desc)
    `);
    await this.pool.query(`
      create index if not exists idx_opsprobe_state_updated_at
      on opsprobe_state (updated_at desc)
    `);
    return {
      ok: true,
      detail: `PostgreSQL storage adapter is ready on ${this.config.host}:${this.config.port}/${this.config.database}.`
    };
  }
  async health() {
    try {
      await this.pool.query("select 1");
      return {
        status: "pass",
        detail: `PostgreSQL storage is reachable on ${this.config.host}:${this.config.port}/${this.config.database}.`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PostgreSQL storage failure.";
      return {
        status: "critical",
        detail: message
      };
    }
  }
  async shutdown() {
    await this.pool.end();
  }
};
var LocalFileStorageAdapter = class {
  filePath;
  constructor(filePath) {
    this.filePath = filePath;
  }
  assets = {
    list: async () => (await this.readSnapshot()).assets,
    upsert: async (asset) => {
      const snapshot = await this.readSnapshot();
      const nextAssets = snapshot.assets.filter((item) => item.id !== asset.id);
      nextAssets.push(asset);
      await this.writeSnapshot({
        ...snapshot,
        assets: nextAssets
      });
    }
  };
  templates = {
    list: async () => (await this.readSnapshot()).templates,
    upsert: async (template) => {
      const snapshot = await this.readSnapshot();
      const nextTemplates = snapshot.templates.filter((item) => item.id !== template.id);
      nextTemplates.push(template);
      await this.writeSnapshot({
        ...snapshot,
        templates: nextTemplates
      });
    }
  };
  inspectionRuns = {
    save: async (run) => {
      const snapshot = await this.readSnapshot();
      const nextRuns = snapshot.inspectionRuns.filter((item) => item.id !== run.id);
      nextRuns.unshift(run);
      await this.writeSnapshot({
        ...snapshot,
        inspectionRuns: nextRuns
      });
    },
    listRecent: async (limit) => (await this.readSnapshot()).inspectionRuns.slice(0, limit)
  };
  state = {
    get: async (key) => {
      const snapshot = await this.readSnapshot();
      return snapshot.state[key] ?? null;
    },
    set: async (key, value) => {
      const snapshot = await this.readSnapshot();
      await this.writeSnapshot({
        ...snapshot,
        state: {
          ...snapshot.state,
          [key]: value
        }
      });
    }
  };
  async bootstrap() {
    await this.ensureFile();
    return {
      ok: true,
      detail: `Local file storage adapter is ready at ${this.filePath}.`
    };
  }
  async health() {
    await this.ensureFile();
    return {
      status: "warning",
      detail: "Local service is using a transitional file-backed storage adapter until managed PostgreSQL is wired in."
    };
  }
  async shutdown() {
    return;
  }
  async ensureFile() {
    await mkdir3(dirname2(this.filePath), { recursive: true });
    try {
      await readFile3(this.filePath, "utf8");
    } catch {
      await this.writeSnapshot(EMPTY_FILE_STORAGE_SNAPSHOT);
    }
  }
  async readSnapshot() {
    await this.ensureFile();
    const raw = await readFile3(this.filePath, "utf8");
    try {
      const snapshot = JSON.parse(raw);
      return {
        assets: snapshot.assets ?? [],
        templates: snapshot.templates ?? [],
        inspectionRuns: snapshot.inspectionRuns ?? [],
        state: snapshot.state ?? {}
      };
    } catch {
      await this.quarantineCorruptedSnapshot(raw);
      await this.writeSnapshot(EMPTY_FILE_STORAGE_SNAPSHOT);
      return EMPTY_FILE_STORAGE_SNAPSHOT;
    }
  }
  async writeSnapshot(snapshot) {
    await mkdir3(dirname2(this.filePath), { recursive: true });
    await writeFile3(this.filePath, `${JSON.stringify(snapshot, null, 2)}
`, "utf8");
  }
  async quarantineCorruptedSnapshot(raw) {
    const quarantinePath = `${this.filePath}.corrupt-${Date.now()}`;
    try {
      await rename2(this.filePath, quarantinePath);
      await writeFile3(`${quarantinePath}.note.txt`, "OpsProbe quarantined a malformed local storage snapshot during automatic recovery.\n", "utf8");
    } catch {
      await writeFile3(quarantinePath, raw, "utf8");
    }
  }
};

// src/runtime.ts
import { existsSync } from "node:fs";
import { mkdir as mkdir4, readFile as readFile4, rm, writeFile as writeFile4 } from "node:fs/promises";
import { execFile as execFile2 } from "node:child_process";
import { createServer } from "node:net";
import { delimiter, join } from "node:path";
import { promisify as promisify2 } from "node:util";
var execFileAsync2 = promisify2(execFile2);
var commonPostgresBinDirs = [
  "/usr/lib/postgresql/16/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/lib/postgresql/14/bin",
  "/usr/local/pgsql/bin"
];
function buildCommandSearchPath(extraDirs = []) {
  const envPath = process.env.PATH ?? "";
  const segments = envPath.split(delimiter).filter(Boolean);
  const merged = [...extraDirs, ...segments];
  return Array.from(new Set(merged)).join(delimiter);
}
function resolvePostgresCommand(command) {
  const configuredDir = process.env.OPSPROBE_POSTGRES_BIN_DIR;
  const candidates = [
    ...configuredDir ? [join(configuredDir, command)] : [],
    command,
    ...commonPostgresBinDirs.map((dir) => join(dir, command))
  ];
  return Array.from(new Set(candidates));
}
async function runCommand(command, args, extraDirs = []) {
  try {
    const { stdout, stderr } = await execFileAsync2(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        PATH: buildCommandSearchPath(extraDirs)
      }
    });
    return {
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    const failure = error;
    return {
      ok: false,
      stdout: (failure.stdout ?? "").trim(),
      stderr: (failure.stderr ?? failure.message ?? "").trim()
    };
  }
}
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}
async function inspectPostgresBinaries() {
  const commands = ["postgres", "pg_ctl", "initdb"];
  const checks = await Promise.all(
    commands.map(async (command) => {
      const candidates = resolvePostgresCommand(command);
      let chosen = candidates[0] ?? command;
      let result = {
        ok: false,
        stdout: "",
        stderr: ""
      };
      for (const candidate of candidates) {
        result = await runCommand(candidate, ["--version"], commonPostgresBinDirs);
        chosen = candidate;
        if (result.ok) {
          break;
        }
      }
      return {
        name: command,
        command,
        resolvedPath: chosen,
        available: result.ok,
        detail: result.ok ? result.stdout || `${chosen} is available.` : result.stderr || `${command} is not available.`
      };
    })
  );
  return {
    version: checks.find((item) => item.name === "postgres" && item.available)?.detail ?? null,
    checks
  };
}
async function inspectCommandBinary(command, args = ["-V"]) {
  const result = await runCommand(command, args);
  return {
    available: result.ok,
    detail: result.ok ? result.stdout || `${command} is available.` : result.stderr || `${command} is not available.`
  };
}
async function isReportDirWritable(path) {
  try {
    await mkdir4(path, { recursive: true });
    const probeFile = `${path}/.opsprobe-write-test`;
    await writeFile4(probeFile, "ok\n", "utf8");
    await rm(probeFile, { force: true });
    return {
      writable: true,
      detail: `Report directory is writable at ${path}.`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown report directory write failure.";
    return {
      writable: false,
      detail: `Report directory is not writable at ${path}: ${message}`
    };
  }
}
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function buildPostgresAutoConfig(config2) {
  return [
    "# Managed by OpsProbe",
    "listen_addresses = '127.0.0.1'",
    `port = ${config2.postgres.port}`,
    `unix_socket_directories = '${config2.paths.runtimeDir}'`,
    "logging_collector = on",
    `log_directory = '${config2.paths.postgresLogDir}'`,
    "log_filename = 'opsprobe-postgres-%Y-%m-%d_%H%M%S.log'",
    ""
  ].join("\n");
}
async function readManagedPostgresPid(config2) {
  if (!existsSync(config2.paths.postgresPidFile)) {
    return null;
  }
  const raw = (await readFileSafe(config2.paths.postgresPidFile)).trim();
  const pid = Number.parseInt(raw.split("\n")[0] ?? "", 10);
  return Number.isNaN(pid) ? null : pid;
}
async function inspectManagedPostgresProcess(config2, binaries, initialized) {
  const pid = await readManagedPostgresPid(config2);
  if (pid !== null && isProcessAlive(pid)) {
    return {
      running: true,
      pid,
      detail: `Managed PostgreSQL is running with pid ${pid}.`
    };
  }
  const pgCtlCheck = binaries.checks.find((item) => item.name === "pg_ctl");
  if (initialized && pgCtlCheck?.available) {
    const status = await runCommand(pgCtlCheck.resolvedPath, ["-D", config2.paths.postgresDataDir, "status"], commonPostgresBinDirs);
    const detail = status.stdout || status.stderr;
    if (status.ok && detail.includes("server is running") && !detail.includes("single-user server")) {
      return {
        running: true,
        pid,
        detail: detail || "Managed PostgreSQL is running."
      };
    }
  }
  return {
    running: false,
    pid: pid ?? null,
    detail: initialized ? "Managed PostgreSQL data directory is initialized, but the process is not running." : "Managed PostgreSQL data directory is not initialized yet."
  };
}
var ManagedLocalServiceBootstrap = class {
  config;
  constructor(config2) {
    this.config = config2;
  }
  async ensureRuntime() {
    const binaries = await inspectPostgresBinaries();
    const sshBinary = await inspectCommandBinary("ssh", ["-V"]);
    const sshpassBinary = await inspectCommandBinary("sshpass", ["-V"]);
    const reportDir = await isReportDirWritable(this.config.paths.reportDir);
    const initialized = existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`);
    const missingBinaries = binaries.checks.filter((item) => !item.available);
    const postgresProcess = await inspectManagedPostgresProcess(this.config, binaries, initialized);
    const portAvailable = postgresProcess.running ? false : await isPortAvailable(this.config.postgres.port);
    const servicePid = existsSync(this.config.paths.servicePidFile) ? Number.parseInt(await readFileSafe(this.config.paths.servicePidFile), 10) : Number.NaN;
    const serviceProcessRunning = !Number.isNaN(servicePid) && isProcessAlive(servicePid);
    const checks = [
      {
        id: "service.bootstrap",
        label: "Bootstrap Contract",
        status: missingBinaries.length === 0 ? "pass" : "critical",
        detail: missingBinaries.length === 0 ? "Managed PostgreSQL prerequisites were inspected successfully." : `Missing PostgreSQL binaries: ${missingBinaries.map((item) => item.command).join(", ")}.`
      },
      {
        id: "service.process",
        label: "Managed Service Process",
        status: serviceProcessRunning ? "pass" : "warning",
        detail: serviceProcessRunning ? `The local service background process is running with pid ${servicePid}.` : "The local service background process is not running."
      },
      {
        id: "local.binary.ssh",
        label: "SSH Client",
        status: sshBinary.available ? "pass" : "critical",
        detail: sshBinary.detail
      },
      {
        id: "local.binary.sshpass",
        label: "Password Auth Helper",
        status: sshpassBinary.available ? "pass" : "warning",
        detail: sshpassBinary.available ? sshpassBinary.detail : "sshpass is not installed. Key-based SSH remains available, but password mode will fail until sshpass is installed."
      },
      {
        id: "local.report_dir",
        label: "Report Directory",
        status: reportDir.writable ? "pass" : "critical",
        detail: reportDir.detail
      },
      ...binaries.checks.map((item) => ({
        id: `postgres.binary.${item.name}`,
        label: `PostgreSQL Binary: ${item.command}`,
        status: item.available ? "pass" : "critical",
        detail: item.detail
      })),
      {
        id: "postgres.data_dir",
        label: "Managed PostgreSQL Data Directory",
        status: initialized ? "pass" : "warning",
        detail: initialized ? `Managed PostgreSQL data directory is initialized at ${this.config.paths.postgresDataDir}.` : `Managed PostgreSQL data directory has not been initialized yet at ${this.config.paths.postgresDataDir}.`
      },
      {
        id: "postgres.port",
        label: "Managed PostgreSQL Port",
        status: postgresProcess.running || portAvailable ? "pass" : "critical",
        detail: postgresProcess.running ? `Port ${this.config.postgres.port} is in use by the managed PostgreSQL runtime.` : portAvailable ? `Port ${this.config.postgres.port} is available for the managed PostgreSQL runtime.` : `Port ${this.config.postgres.port} is already occupied and cannot be used by OpsProbe.`
      },
      {
        id: "postgres.process",
        label: "Managed PostgreSQL Process",
        status: postgresProcess.running ? "pass" : initialized && missingBinaries.length === 0 ? "warning" : "critical",
        detail: postgresProcess.running ? postgresProcess.detail : initialized && missingBinaries.length === 0 ? postgresProcess.detail : "Managed PostgreSQL cannot be started until prerequisites and initialization are complete."
      }
    ];
    let status = "degraded";
    if (missingBinaries.length > 0 || !portAvailable && !postgresProcess.running) {
      status = "error";
    } else if (postgresProcess.running) {
      status = "ready";
    } else if (initialized) {
      status = "starting";
    }
    return {
      status,
      runtime: {
        mode: "managed",
        port: this.config.postgres.port,
        dataDir: this.config.paths.postgresDataDir,
        logDir: this.config.paths.postgresLogDir,
        version: binaries.version
      },
      checks,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async bootstrapPostgres() {
    await Promise.all([
      mkdir4(this.config.paths.postgresDataDir, { recursive: true }),
      mkdir4(this.config.paths.postgresLogDir, { recursive: true }),
      mkdir4(this.config.paths.runtimeDir, { recursive: true })
    ]);
    if (existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      await this.writeManagedPostgresConfig();
      return "Managed PostgreSQL data directory is already initialized.";
    }
    const binaries = await inspectPostgresBinaries();
    const initdbBinary = binaries.checks.find((item) => item.name === "initdb")?.resolvedPath ?? "initdb";
    const initdb = await runCommand(initdbBinary, [
      "-D",
      this.config.paths.postgresDataDir,
      "-U",
      "opsprobe",
      "--auth=trust"
    ], commonPostgresBinDirs);
    if (!initdb.ok) {
      throw new Error(
        initdb.stderr || "initdb is unavailable or failed during managed PostgreSQL bootstrap."
      );
    }
    await this.writeManagedPostgresConfig();
    return "Managed PostgreSQL data directory initialized for OpsProbe.";
  }
  async startPostgres() {
    const binaries = await inspectPostgresBinaries();
    const missingBinaries = binaries.checks.filter((item) => !item.available);
    if (missingBinaries.length > 0) {
      throw new Error(
        `Managed PostgreSQL cannot start because required binaries are missing: ${missingBinaries.map((item) => item.command).join(", ")}.`
      );
    }
    if (!existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      await this.bootstrapPostgres();
    } else {
      await this.writeManagedPostgresConfig();
    }
    const processState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (processState.running) {
      return processState.detail;
    }
    const portAvailable = await isPortAvailable(this.config.postgres.port);
    if (!portAvailable) {
      throw new Error(
        `Port ${this.config.postgres.port} is already occupied and managed PostgreSQL cannot be started.`
      );
    }
    const pgCtlBinary = binaries.checks.find((item) => item.name === "pg_ctl")?.resolvedPath ?? "pg_ctl";
    const start = await runCommand(pgCtlBinary, [
      "-D",
      this.config.paths.postgresDataDir,
      "-l",
      this.config.paths.postgresCtlLogFile,
      "-w",
      "start"
    ], commonPostgresBinDirs);
    if (!start.ok) {
      throw new Error(
        start.stderr || start.stdout || "pg_ctl failed to start the managed PostgreSQL runtime."
      );
    }
    const nextState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (!nextState.running) {
      throw new Error(
        "Managed PostgreSQL start was requested, but the runtime did not become healthy."
      );
    }
    return nextState.detail;
  }
  async stopPostgres() {
    const binaries = await inspectPostgresBinaries();
    const pgCtlCheck = binaries.checks.find((item) => item.name === "pg_ctl");
    if (!pgCtlCheck?.available) {
      throw new Error("Managed PostgreSQL cannot be stopped because pg_ctl is not available.");
    }
    if (!existsSync(`${this.config.paths.postgresDataDir}/PG_VERSION`)) {
      return "Managed PostgreSQL data directory is not initialized.";
    }
    const processState = await inspectManagedPostgresProcess(this.config, binaries, true);
    if (!processState.running) {
      return "Managed PostgreSQL is already stopped.";
    }
    const stop = await runCommand(pgCtlCheck.resolvedPath, [
      "-D",
      this.config.paths.postgresDataDir,
      "-m",
      "fast",
      "-w",
      "stop"
    ], commonPostgresBinDirs);
    if (!stop.ok) {
      throw new Error(
        stop.stderr || stop.stdout || "pg_ctl failed to stop the managed PostgreSQL runtime."
      );
    }
    return "Managed PostgreSQL stop completed.";
  }
  async shutdown() {
    return;
  }
  async writeManagedPostgresConfig() {
    const autoConfigFile = `${this.config.paths.postgresDataDir}/postgresql.auto.conf`;
    await writeFile4(autoConfigFile, buildPostgresAutoConfig(this.config), "utf8");
    const hbaFile = `${this.config.paths.postgresDataDir}/pg_hba.conf`;
    let content = "";
    try {
      content = await readFile4(hbaFile, "utf8");
    } catch {
      content = "";
    }
    const managedRule = "host all all 127.0.0.1/32 trust";
    if (!content.includes(managedRule)) {
      const nextContent = `${content.trimEnd()}

# Managed by OpsProbe
${managedRule}
`;
      await writeFile4(hbaFile, nextContent, "utf8");
    }
  }
};
async function readFileSafe(path) {
  try {
    return await readFile4(path, "utf8");
  } catch {
    return "";
  }
}

// src/settings.ts
import { mkdir as mkdir5, readFile as readFile5 } from "node:fs/promises";
var EMPTY_DESKTOP_SETTINGS = {};
var DESKTOP_SETTINGS_STATE_KEY = "desktop-settings";
function cloneAsset2(asset) {
  return JSON.parse(JSON.stringify(asset));
}
function normalizeSettings(settings) {
  return {
    activeAsset: settings.activeAsset ? cloneAsset2(settings.activeAsset) : void 0,
    selectedTemplateId: settings.selectedTemplateId,
    onboardingMode: settings.onboardingMode,
    reportAudience: settings.reportAudience,
    historyAssetFilter: settings.historyAssetFilter,
    historyDateFrom: settings.historyDateFrom,
    historyDateTo: settings.historyDateTo,
    scheduleIntervalMinutes: settings.scheduleIntervalMinutes,
    migrationPath: settings.migrationPath,
    reportPath: settings.reportPath,
    pdfReportPath: settings.pdfReportPath
  };
}
var LocalDesktopSettingsStore = class {
  config;
  getStorage;
  constructor(config2, getStorage) {
    this.config = config2;
    this.getStorage = getStorage;
  }
  async get() {
    const persisted = await this.getStorage().state.get(DESKTOP_SETTINGS_STATE_KEY);
    if (persisted) {
      return normalizeSettings(persisted);
    }
    const migrated = await this.readLegacySettings();
    if (migrated) {
      const normalized = normalizeSettings(migrated);
      await this.getStorage().state.set(DESKTOP_SETTINGS_STATE_KEY, normalized);
      return normalized;
    }
    return EMPTY_DESKTOP_SETTINGS;
  }
  async getResponse() {
    return {
      ok: true,
      settings: await this.get(),
      source: "local-service"
    };
  }
  async upsert(request) {
    const current = await this.get();
    const next = normalizeSettings({
      ...current,
      ...request.settings
    });
    await this.getStorage().state.set(DESKTOP_SETTINGS_STATE_KEY, next);
    return {
      ok: true,
      settings: next,
      source: "local-service"
    };
  }
  async readLegacySettings() {
    await mkdir5(this.config.paths.configDir, { recursive: true });
    try {
      const raw = await readFile5(this.config.paths.desktopSettingsFile, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
};

// src/main.ts
var config = createDefaultLocalServiceConfig();
var bootstrap = new ManagedLocalServiceBootstrap(config);
var fileStorage = new LocalFileStorageAdapter(`${config.paths.dataDir}/opsprobe-storage.json`);
var storage = fileStorage;
var storageBackendMessage = "Local file storage adapter is active.";
var storageClosed = false;
var scheduleStore = new LocalScheduleStore(config, () => storage);
var desktopSettingsStore = new LocalDesktopSettingsStore(config, () => storage);
var builtInTemplates = builtInInspectionTemplateDefinitions.map(
  (definition) => createInspectionTemplate(definition)
);
var DESKTOP_SETTINGS_STATE_KEY2 = "desktop-settings";
var SCHEDULES_STATE_KEY2 = "inspection-schedules";
async function shutdownStorage() {
  if (storageClosed) {
    return;
  }
  await storage.shutdown();
  storageClosed = true;
}
async function migrateFileRunsToPostgres(postgresStorage) {
  await fileStorage.bootstrap();
  const assets = await fileStorage.assets.list();
  const templates = await fileStorage.templates.list();
  const runs = await fileStorage.inspectionRuns.listRecent(1e4);
  for (const asset of assets) {
    await postgresStorage.assets.upsert(asset);
  }
  for (const template of templates) {
    await postgresStorage.templates.upsert(template);
  }
  for (const run of runs.reverse()) {
    await postgresStorage.inspectionRuns.save(run);
  }
  return runs.length;
}
async function migrateLegacyStateIntoStorage(targetStorage) {
  const existingSettings = await targetStorage.state.get(DESKTOP_SETTINGS_STATE_KEY2);
  if (!existingSettings) {
    try {
      const raw = await readFile6(config.paths.desktopSettingsFile, "utf8");
      await targetStorage.state.set(DESKTOP_SETTINGS_STATE_KEY2, JSON.parse(raw));
    } catch {
    }
  }
  const existingSchedules = await targetStorage.state.get(SCHEDULES_STATE_KEY2);
  if (!existingSchedules) {
    try {
      const raw = await readFile6(config.paths.schedulesFile, "utf8");
      await targetStorage.state.set(
        SCHEDULES_STATE_KEY2,
        JSON.parse(raw)
      );
    } catch {
    }
  }
}
async function migrateFileStateToPostgres(postgresStorage) {
  const fileSettings = await fileStorage.state.get(DESKTOP_SETTINGS_STATE_KEY2);
  if (fileSettings) {
    await postgresStorage.state.set(DESKTOP_SETTINGS_STATE_KEY2, fileSettings);
  }
  const fileSchedules = await fileStorage.state.get(SCHEDULES_STATE_KEY2);
  if (fileSchedules) {
    await postgresStorage.state.set(SCHEDULES_STATE_KEY2, fileSchedules);
  }
}
async function selectStorageAdapter() {
  const health = await bootstrap.ensureRuntime();
  if (health.status === "ready") {
    const postgresStorage = new PostgresStorageAdapter({
      database: "postgres",
      host: config.paths.runtimeDir,
      port: config.postgres.port,
      user: "opsprobe"
    });
    try {
      await postgresStorage.bootstrap();
      const postgresHealth = await postgresStorage.health();
      if (postgresHealth.status === "pass") {
        const migratedRuns = await migrateFileRunsToPostgres(postgresStorage);
        await migrateLegacyStateIntoStorage(fileStorage);
        await migrateFileStateToPostgres(postgresStorage);
        storage = postgresStorage;
        storageClosed = false;
        storageBackendMessage = migratedRuns > 0 ? `${postgresHealth.detail} Migrated ${migratedRuns} file-backed inspection runs into PostgreSQL and unified schedules/settings into the active state store.` : `${postgresHealth.detail} Schedules and desktop settings now share the active state store with runtime data.`;
        return;
      }
      storageBackendMessage = `Falling back to local file storage: ${postgresHealth.detail}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PostgreSQL storage bootstrap failure.";
      storageBackendMessage = `Falling back to local file storage: ${message}`;
    }
  } else {
    storageBackendMessage = "Local file storage adapter is active because managed PostgreSQL is not ready.";
  }
  await fileStorage.bootstrap();
  await migrateLegacyStateIntoStorage(fileStorage);
  storage = fileStorage;
  storageClosed = false;
}
async function ensureRuntimeDirs() {
  await Promise.all([
    mkdir6(config.paths.rootDir, { recursive: true }),
    mkdir6(config.paths.configDir, { recursive: true }),
    mkdir6(config.paths.dataDir, { recursive: true }),
    mkdir6(config.paths.logDir, { recursive: true }),
    mkdir6(config.paths.runtimeDir, { recursive: true }),
    mkdir6(config.paths.postgresDataDir, { recursive: true }),
    mkdir6(config.paths.postgresLogDir, { recursive: true })
  ]);
  await selectStorageAdapter();
  for (const template of builtInTemplates) {
    await storage.templates.upsert(template);
  }
}
async function buildStatusResponse(mode = "starting") {
  const health = await bootstrap.ensureRuntime();
  const scheduleSummary = await scheduleStore.summarizeFailures();
  const failedScheduleLabels = scheduleSummary.failedSchedules.slice(0, 3).map((item) => item.asset.name).join(", ");
  const recoveryActions = [];
  const serviceProcessCheck = health.checks.find((check) => check.id === "service.process");
  const bootstrapCheck = health.checks.find((check) => check.id === "service.bootstrap");
  const postgresDataDirCheck = health.checks.find((check) => check.id === "postgres.data_dir");
  const sshCheck = health.checks.find((check) => check.id === "local.binary.ssh");
  const reportDirCheck = health.checks.find((check) => check.id === "local.report_dir");
  if (mode !== "ready") {
    recoveryActions.push({
      id: "service.start-or-restart",
      label: mode === "stopped" ? "Start local service" : "Restart local service",
      detail: mode === "stopped" ? "Use Start Service to launch the background local service before expecting schedules or service-owned runs." : "Use Restart Service to rebuild the local-service process, refresh runtime markers, and re-check managed PostgreSQL state."
    });
  }
  if (bootstrapCheck?.status === "critical" || postgresDataDirCheck?.status === "warning") {
    recoveryActions.push({
      id: "postgres.bootstrap",
      label: "Bootstrap managed PostgreSQL",
      detail: "Initialize the dedicated OpsProbe PostgreSQL data directory, then start PostgreSQL again so runtime data can move onto the managed store."
    });
  }
  if (serviceProcessCheck?.status !== "pass" && mode === "ready") {
    recoveryActions.push({
      id: "service.reconcile",
      label: "Reconcile service runtime markers",
      detail: "The service was expected to be ready, but the process check disagrees. Restart the local service so PID and status markers are rebuilt cleanly."
    });
  }
  if (sshCheck?.status === "critical") {
    recoveryActions.push({
      id: "ssh.install",
      label: "Install SSH client tooling",
      detail: "Install `ssh` before testing credentials or running inspections from this machine. Password-based connections also need `sshpass` if you want password mode."
    });
  }
  if (reportDirCheck?.status === "critical") {
    recoveryActions.push({
      id: "report-dir.repair",
      label: "Repair report directory permissions",
      detail: `Fix write access under ${config.paths.reportDir} so report export and related smoke paths can complete successfully.`
    });
  }
  if (scheduleSummary.failedSchedules.length > 0) {
    recoveryActions.push({
      id: "schedule.failures.review",
      label: "Review failed schedules",
      detail: scheduleSummary.failedSchedules.length === 1 ? `Inspect the latest saved error for ${scheduleSummary.failedSchedules[0]?.asset.name} before re-enabling unattended runs.` : `Inspect the latest saved errors for ${scheduleSummary.failedSchedules.length} schedules before trusting unattended runs again.`
    });
  }
  return {
    ok: true,
    snapshot: {
      status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
      config,
      health: {
        ...health,
        checks: [
          ...mode === "ready" ? health.checks.map(
            (check) => check.id === "service.process" ? {
              ...check,
              status: "pass",
              detail: "The local service background process is running."
            } : check
          ) : health.checks,
          {
            id: "storage.backend",
            label: "Storage Backend",
            status: storage === fileStorage ? "warning" : "pass",
            detail: storageBackendMessage
          },
          {
            id: "scheduling.local",
            label: "Local Scheduling",
            status: scheduleSummary.failedSchedules.length > 0 ? "warning" : "pass",
            detail: scheduleSummary.total === 0 ? "No local schedules have been configured yet." : scheduleSummary.failedSchedules.length > 0 ? `${scheduleSummary.failedSchedules.length} schedule failures need review: ${failedScheduleLabels}` : `${scheduleSummary.enabledSchedules} enabled schedules are stored locally.`
          }
        ]
      },
      recoveryActions
    }
  };
}
async function writeStatusFile(mode) {
  const response = await buildStatusResponse(mode);
  await writeFile5(
    config.paths.serviceStatusFile,
    `${JSON.stringify(response, null, 2)}
`,
    "utf8"
  );
  return response;
}
function isProcessAlive2(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
async function resolveServiceMode() {
  if (!existsSync2(config.paths.servicePidFile)) {
    return await readPersistedServiceMode(config.paths.serviceStatusFile);
  }
  const rawPid = (await readFile6(config.paths.servicePidFile, "utf8").catch(() => "")).trim();
  const pid = Number.parseInt(rawPid, 10);
  if (!Number.isNaN(pid) && isProcessAlive2(pid)) {
    return "ready";
  }
  await rm2(config.paths.servicePidFile, { force: true });
  return await readPersistedServiceMode(config.paths.serviceStatusFile);
}
async function statusCommand() {
  await ensureRuntimeDirs();
  const mode = await resolveServiceMode();
  const response = await buildStatusResponse(mode);
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function readJsonStdin() {
  let raw = "";
  for await (const chunk of input) {
    raw += String(chunk);
  }
  return JSON.parse(raw);
}
async function stopServiceRuntime() {
  if (!existsSync2(config.paths.servicePidFile)) {
    await ensureRuntimeDirs();
    await writeStatusFile("stopped");
    return "Local service is already stopped.";
  }
  const pid = Number((await readFile6(config.paths.servicePidFile, "utf8")).trim());
  if (!Number.isNaN(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
    }
  }
  try {
    await shutdownStorage();
    await bootstrap.stopPostgres();
  } catch {
  }
  await writeStatusFile("stopped");
  await rm2(config.paths.servicePidFile, { force: true });
  return "Local service stop signal sent. Run status or Start Service again to confirm recovery state.";
}
async function stopCommand() {
  const message = await stopServiceRuntime();
  const response = {
    ok: true,
    message
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function restartCommand() {
  await stopServiceRuntime();
  await ensureRuntimeDirs();
  const response = {
    ok: true,
    message: "Local service restart prepared. Start Service again to launch a fresh background process with rebuilt runtime markers."
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function bootstrapPostgresCommand() {
  await ensureRuntimeDirs();
  const response = {
    ok: true,
    message: await bootstrap.bootstrapPostgres()
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function startPostgresCommand() {
  await ensureRuntimeDirs();
  const response = {
    ok: true,
    message: await bootstrap.startPostgres()
  };
  await selectStorageAdapter();
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function stopPostgresCommand() {
  await ensureRuntimeDirs();
  await shutdownStorage();
  const response = {
    ok: true,
    message: await bootstrap.stopPostgres()
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
}
async function serveCommand() {
  await ensureRuntimeDirs();
  await writeFile5(config.paths.servicePidFile, `${process.pid}
`, "utf8");
  let scheduler = new LocalScheduler(scheduleStore, storage);
  try {
    await bootstrap.startPostgres();
    await selectStorageAdapter();
    scheduler = new LocalScheduler(scheduleStore, storage);
  } catch {
  }
  await writeStatusFile("ready");
  const cleanup = async () => {
    try {
      await shutdownStorage();
      await bootstrap.stopPostgres();
    } catch {
    }
    await writeStatusFile("stopped");
    await rm2(config.paths.servicePidFile, { force: true });
    process.exit(0);
  };
  process.on("SIGINT", () => {
    void cleanup();
  });
  process.on("SIGTERM", () => {
    void cleanup();
  });
  setInterval(() => {
    void writeStatusFile("ready");
  }, 5e3);
  void scheduler.runDueSchedules();
  setInterval(() => {
    void scheduler.runDueSchedules();
  }, 3e4);
}
async function main() {
  const mode = process.argv[2] ?? "status";
  try {
    if (mode === "serve") {
      await serveCommand();
      return;
    }
    if (mode === "stop") {
      await stopCommand();
      return;
    }
    if (mode === "restart") {
      await restartCommand();
      return;
    }
    if (mode === "postgres-bootstrap") {
      await bootstrapPostgresCommand();
      return;
    }
    if (mode === "postgres-start") {
      await startPostgresCommand();
      return;
    }
    if (mode === "postgres-stop") {
      await stopPostgresCommand();
      return;
    }
    if (mode === "inspect-preview") {
      const request = await readJsonStdin();
      const response = await buildInspectionPreview(request);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "inspect-run") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const response = await buildInspectionExecution(request, storage);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "inspection-history") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin().catch(() => ({}));
      const response = await readInspectionHistory(storage, request);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "assets-list") {
      await ensureRuntimeDirs();
      const response = {
        ok: true,
        assets: await storage.assets.list(),
        source: "local-service"
      };
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "assets-upsert") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      await storage.assets.upsert(request.asset);
      const response = {
        ok: true,
        message: `Saved asset ${request.asset.id}.`
      };
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "settings-get") {
      await ensureRuntimeDirs();
      const response = await desktopSettingsStore.getResponse();
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "settings-upsert") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const response = await desktopSettingsStore.upsert(request);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "schedules-list") {
      await ensureRuntimeDirs();
      const response = await scheduleStore.listResponse();
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "config-export") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const response = await exportLocalConfig(
        storage,
        scheduleStore,
        desktopSettingsStore,
        config
      );
      await writeFile5(request.path, `${JSON.stringify(response.package, null, 2)}
`, "utf8");
      const commandResponse = {
        ok: true,
        message: `Exported local configuration to ${request.path}.`
      };
      process.stdout.write(`${JSON.stringify(commandResponse, null, 2)}
`);
      return;
    }
    if (mode === "config-import") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const raw = await readFile6(request.path, "utf8");
      const response = await importLocalConfig(
        { package: JSON.parse(raw) },
        storage,
        scheduleStore,
        desktopSettingsStore
      );
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "schedules-upsert") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const response = await scheduleStore.upsert(request);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "schedules-delete") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      await scheduleStore.delete(request);
      const response = {
        ok: true,
        message: `Deleted schedule ${request.id}.`
      };
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    if (mode === "report-export-html") {
      await ensureRuntimeDirs();
      const request = await readJsonStdin();
      const response = await exportHtmlReport(request);
      process.stdout.write(`${JSON.stringify(response, null, 2)}
`);
      return;
    }
    await statusCommand();
  } finally {
    if (mode !== "serve") {
      await shutdownStorage();
    }
  }
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown local service failure.";
  process.stderr.write(
    `${JSON.stringify(
      {
        ok: false,
        error: message
      },
      null,
      2
    )}
`
  );
  process.exitCode = 1;
});
