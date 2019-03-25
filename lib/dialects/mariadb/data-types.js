'use strict';

const _ = require('lodash');
const moment = require('moment-timezone');

module.exports = BaseTypes => {
  BaseTypes.ABSTRACT.prototype.dialectTypes = 'https://mariadb.com/kb/en/library/resultset/#field-types';

  /**
   * types: [buffer_type, ...]
   * @see documentation : https://mariadb.com/kb/en/library/resultset/#field-types
   * @see connector implementation : https://github.com/MariaDB/mariadb-connector-nodejs/blob/master/lib/const/field-type.js
   */

  BaseTypes.DATE.types.mariadb = ['DATETIME'];
  BaseTypes.STRING.types.mariadb = ['VAR_STRING'];
  BaseTypes.CHAR.types.mariadb = ['STRING'];
  BaseTypes.TEXT.types.mariadb = ['BLOB'];
  BaseTypes.TINYINT.types.mariadb = ['TINY'];
  BaseTypes.SMALLINT.types.mariadb = ['SHORT'];
  BaseTypes.MEDIUMINT.types.mariadb = ['INT24'];
  BaseTypes.INTEGER.types.mariadb = ['LONG'];
  BaseTypes.BIGINT.types.mariadb = ['LONGLONG'];
  BaseTypes.FLOAT.types.mariadb = ['FLOAT'];
  BaseTypes.TIME.types.mariadb = ['TIME'];
  BaseTypes.DATEONLY.types.mariadb = ['DATE'];
  BaseTypes.BOOLEAN.types.mariadb = ['TINY'];
  BaseTypes.BLOB.types.mariadb = ['TINYBLOB', 'BLOB', 'LONGBLOB'];
  BaseTypes.DECIMAL.types.mariadb = ['NEWDECIMAL'];
  BaseTypes.UUID.types.mariadb = false;
  BaseTypes.ENUM.types.mariadb = false;
  BaseTypes.REAL.types.mariadb = ['DOUBLE'];
  BaseTypes.DOUBLE.types.mariadb = ['DOUBLE'];
  BaseTypes.GEOMETRY.types.mariadb = ['GEOMETRY'];
  BaseTypes.JSON.types.mariadb = ['JSON'];

  class DECIMAL extends BaseTypes.DECIMAL {
    toSql() {
      let definition = super.toSql();
      if (this._unsigned) {
        definition += ' UNSIGNED';
      }
      if (this._zerofill) {
        definition += ' ZEROFILL';
      }
      return definition;
    }
  }

  class DATE extends BaseTypes.DATE {
    toSql() {
      return `DATETIME${this._length ? `(${this._length})` : ''}`;
    }
    _stringify(date, options) {
      date = this._applyTimezone(date, options);
      return date.format('YYYY-MM-DD HH:mm:ss.SSS');
    }
    static parse(value, options) {
      value = value.string();
      if (value === null) {
        return value;
      }
      if (moment.tz.zone(options.timezone)) {
        value = moment.tz(value, options.timezone).toDate();
      }
      else {
        value = new Date(`${value} ${options.timezone}`);
      }
      return value;
    }
  }

  class DATEONLY extends BaseTypes.DATEONLY {
    static parse(value) {
      return value.string();
    }
  }

  class UUID extends BaseTypes.UUID {
    toSql() {
      return 'CHAR(36) BINARY';
    }
  }

  class GEOMETRY extends BaseTypes.GEOMETRY {
    constructor(type, srid) {
      super(type, srid);
      if (_.isEmpty(this.type)) {
        this.sqlType = this.key;
      }
      else {
        this.sqlType = this.type;
      }
    }
    toSql() {
      return this.sqlType;
    }
  }

  class ENUM extends BaseTypes.ENUM {
    toSql(options) {
      return `ENUM(${this.values.map(value => options.escape(value)).join(', ')})`;
    }
  }

  class JSONTYPE extends BaseTypes.JSON {
    _stringify(value, options) {
      return options.acceptsString && typeof value === 'string' ? value
        : JSON.stringify(value);
    }
  }

  return {
    ENUM,
    DATE,
    DATEONLY,
    UUID,
    GEOMETRY,
    DECIMAL,
    JSON: JSONTYPE
  };
};